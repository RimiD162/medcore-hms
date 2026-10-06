const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const {
  generateDispensingNumber,
  generateTransactionNumber,
  generateInvoiceNumber,
} = require('../utils/patientIdGenerator');

class DispensingService {
  /**
   * Execute transactional prescription dispensing
   */
  async dispense(data, user) {
    const { prescriptionId, idempotencyKey, notes, items } = data;

    if (!idempotencyKey || idempotencyKey.trim().length < 5) {
      throw ApiError.badRequest('A unique idempotency key (min 5 chars) is required');
    }

    if (!items || items.length === 0) {
      throw ApiError.badRequest('At least one item must be specified for dispensing');
    }

    // 1. Idempotency Check (Fast path)
    const existingDispensing = await prisma.dispensing.findUnique({
      where: { idempotencyKey },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            fullName: true,
            patientIdNumber: true,
          },
        },
        prescription: {
          select: {
            prescriptionNumber: true,
          },
        },
      },
    });

    if (existingDispensing) {
      return {
        ...existingDispensing,
        isIdempotentReplay: true,
      };
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 2. Interactive PostgreSQL Transaction with Row Locks & Atomicity
    const result = await prisma.$transaction(
      async (tx) => {
        // Fetch and lock prescription
        const prescription = await tx.prescription.findUnique({
          where: { id: prescriptionId },
          include: {
            items: true,
            patient: true,
            doctor: { include: { user: true } },
          },
        });

        if (!prescription) {
          throw ApiError.notFound('Prescription not found');
        }

        if (prescription.status === 'Cancelled' || prescription.dispensingStatus === 'CANCELLED') {
          throw ApiError.badRequest('Cannot dispense a cancelled prescription');
        }

        if (prescription.onHold || prescription.dispensingStatus === 'ON_HOLD') {
          throw ApiError.badRequest(
            `Prescription is currently on hold: "${prescription.holdReason}". Please release from hold first.`
          );
        }

        let dispensingTotalAmount = 0;
        const createdDispensingItems = [];
        const stockUpdates = [];

        // Validate each item request
        for (const reqItem of items) {
          const rxItem = prescription.items.find((i) => i.id === reqItem.prescriptionItemId);
          if (!rxItem) {
            throw ApiError.notFound(`Prescription item ${reqItem.prescriptionItemId} not found in this prescription`);
          }

          if (!rxItem.medicineId) {
            throw ApiError.badRequest(
              `Item "${rxItem.medicineName}" is not mapped to a catalog medicine. Please map the item before dispensing.`
            );
          }

          if (rxItem.medicineId !== reqItem.medicineId) {
            throw ApiError.badRequest(
              `Medicine ID mismatch for item "${rxItem.medicineName}" (expected: ${rxItem.medicineId}, got: ${reqItem.medicineId})`
            );
          }

          const prescribedQty = rxItem.quantityPrescribed;
          if (!prescribedQty || prescribedQty <= 0) {
            throw ApiError.badRequest(
              `Prescribed quantity has not been confirmed for "${rxItem.medicineName}". Please confirm quantity before dispensing.`
            );
          }

          const remainingQty = prescribedQty - rxItem.quantityDispensed;
          if (reqItem.quantity > remainingQty) {
            throw ApiError.badRequest(
              `Requested quantity (${reqItem.quantity}) exceeds remaining prescribed quantity (${remainingQty}) for "${rxItem.medicineName}"`
            );
          }

          // Fetch and lock batch
          const batch = await tx.medicineBatch.findUnique({
            where: { id: reqItem.batchId },
            include: { medicine: true },
          });

          if (!batch) {
            throw ApiError.notFound(`Batch ID ${reqItem.batchId} not found`);
          }

          if (batch.medicineId !== rxItem.medicineId) {
            throw ApiError.badRequest(
              `Batch ${batch.batchNumber} does not belong to medicine "${rxItem.medicineName}"`
            );
          }

          if (batch.status !== 'Active') {
            throw ApiError.badRequest(
              `Batch ${batch.batchNumber} is not active (current status: ${batch.status})`
            );
          }

          const batchExp = new Date(batch.expiryDate);
          if (batchExp < today) {
            throw ApiError.badRequest(
              `Batch ${batch.batchNumber} has expired on ${batch.expiryDate.toISOString().split('T')[0]} and cannot be dispensed`
            );
          }

          if (batch.quantityAvailable < reqItem.quantity) {
            throw ApiError.conflict(
              `Insufficient stock in batch ${batch.batchNumber} (available: ${batch.quantityAvailable}, requested: ${reqItem.quantity})`
            );
          }

          // Price snapshot from DB
          const unitPrice = Number(batch.sellingPrice || batch.medicine.sellingPrice);
          const lineTotal = Number((unitPrice * reqItem.quantity).toFixed(2));
          dispensingTotalAmount += lineTotal;

          stockUpdates.push({
            rxItem,
            batch,
            dispenseQty: reqItem.quantity,
            unitPrice,
            lineTotal,
            overrideReason: reqItem.overrideReason || null,
          });
        }

        // Generate unique dispensing number
        const dispensingNumber = await generateDispensingNumber(tx);

        // Find or create open PENDING invoice for patient
        let invoice = await tx.invoice.findFirst({
          where: {
            patientId: prescription.patientId,
            status: 'PENDING',
          },
          orderBy: { issueDate: 'desc' },
        });

        if (!invoice) {
          const invoiceNumber = await generateInvoiceNumber(tx);
          invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              patientId: prescription.patientId,
              createdById: user?.id || null,
              subtotal: 0,
              taxAmount: 0,
              discountAmount: 0,
              totalAmount: 0,
              paidAmount: 0,
              outstandingAmount: 0,
              status: 'PENDING',
              notes: 'Generated for Pharmacy Dispensing',
            },
          });
        }

        // Create Dispensing master record
        const dispensing = await tx.dispensing.create({
          data: {
            dispensingNumber,
            prescriptionId: prescription.id,
            patientId: prescription.patientId,
            pharmacistId: user?.id || null,
            status: 'Completed',
            idempotencyKey,
            totalAmount: dispensingTotalAmount,
            notes: notes || null,
            invoiceId: invoice.id,
          },
        });

        // Execute batch deductions, stock ledger transactions, and invoice items
        for (const update of stockUpdates) {
          const { rxItem, batch, dispenseQty, unitPrice, lineTotal } = update;

          // 1. Atomic batch quantity update with balance check
          const updatedBatch = await tx.medicineBatch.update({
            where: { id: batch.id },
            data: {
              quantityAvailable: {
                decrement: dispenseQty,
              },
            },
          });

          // Ensure invariant (checked by DB constraint and runtime check)
          if (updatedBatch.quantityAvailable < 0) {
            throw ApiError.conflict(`Concurrent conflict: batch ${batch.batchNumber} stock went negative`);
          }

          // 2. Create Dispensing Item snapshot
          const dispensingItem = await tx.dispensingItem.create({
            data: {
              dispensingId: dispensing.id,
              prescriptionItemId: rxItem.id,
              medicineId: rxItem.medicineId,
              batchId: batch.id,
              medicineNameSnapshot: rxItem.medicineName,
              batchNumberSnapshot: batch.batchNumber,
              quantity: dispenseQty,
              unitPriceSnapshot: unitPrice,
              totalPrice: lineTotal,
              instructionsSnapshot: rxItem.instructions || null,
            },
          });
          createdDispensingItems.push(dispensingItem);

          // 3. Write append-only DISPENSE stock transaction
          const transactionNumber = await generateTransactionNumber(tx);
          await tx.stockTransaction.create({
            data: {
              transactionNumber,
              medicineId: rxItem.medicineId,
              batchId: batch.id,
              quantityChange: -dispenseQty,
              type: 'DISPENSE',
              reason: `Dispensed for Prescription #${prescription.prescriptionNumber} (${prescription.patient.fullName})`,
              balanceAfter: updatedBatch.quantityAvailable,
              performedById: user?.id || null,
              dispensingId: dispensing.id,
            },
          });

          // 4. Update prescription item quantity dispensed
          await tx.prescriptionItem.update({
            where: { id: rxItem.id },
            data: {
              quantityDispensed: {
                increment: dispenseQty,
              },
            },
          });

          // 5. Add pharmacy line item to shared Invoice
          await tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              serviceName: `Pharmacy: ${rxItem.medicineName} (Qty: ${dispenseQty}, Batch: ${batch.batchNumber})`,
              category: 'Pharmacy',
              source: 'PHARMACY',
              dispensingItemId: dispensingItem.id,
              unitPrice: unitPrice,
              quantity: dispenseQty,
              totalPrice: lineTotal,
            },
          });
        }

        // 6. Recalculate invoice totals server-side
        const invoiceItems = await tx.invoiceItem.findMany({
          where: { invoiceId: invoice.id },
        });
        const newSubtotal = invoiceItems.reduce((acc, itm) => acc + Number(itm.totalPrice), 0);
        const newTotal = Number((newSubtotal + Number(invoice.taxAmount) - Number(invoice.discountAmount)).toFixed(2));
        const newOutstanding = Number((newTotal - Number(invoice.paidAmount)).toFixed(2));

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            subtotal: newSubtotal,
            totalAmount: newTotal,
            outstandingAmount: newOutstanding,
          },
        });

        // 7. Derive and update overall prescription dispensing status
        const updatedRxItems = await tx.prescriptionItem.findMany({
          where: { prescriptionId: prescription.id },
        });

        const allDone = updatedRxItems.every(
          (i) => i.quantityPrescribed && i.quantityDispensed >= i.quantityPrescribed
        );
        const someDone = updatedRxItems.some((i) => i.quantityDispensed > 0);

        let finalDispensingStatus = 'PARTIALLY_DISPENSED';
        if (allDone) {
          finalDispensingStatus = 'DISPENSED';
        }

        await tx.prescription.update({
          where: { id: prescription.id },
          data: {
            dispensingStatus: finalDispensingStatus,
          },
        });

        // 8. Write audit log
        await tx.auditLog.create({
          data: {
            userId: user?.id,
            userName: user?.fullName || 'Pharmacist',
            role: 'PHARMACIST',
            action: 'DISPENSE_PRESCRIPTION',
            entity: 'Dispensing',
            entityId: dispensing.id,
            description: `Dispensed ${createdDispensingItems.length} items for Prescription #${prescription.prescriptionNumber} (Total: $${dispensingTotalAmount.toFixed(2)})`,
          },
        });

        return {
          dispensing: {
            ...dispensing,
            items: createdDispensingItems,
          },
          prescription: {
            id: prescription.id,
            prescriptionNumber: prescription.prescriptionNumber,
            dispensingStatus: finalDispensingStatus,
          },
          invoice: {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: newTotal,
            outstandingAmount: newOutstanding,
          },
        };
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // 3. Post-commit notifications
    try {
      const rx = await prisma.prescription.findUnique({
        where: { id: prescriptionId },
        include: { doctor: { include: { user: true } }, patient: true },
      });

      if (rx?.doctor?.user?.id) {
        await prisma.notification.create({
          data: {
            userId: rx.doctor.user.id,
            title: 'Prescription Dispensed (Pharmacy)',
            message: `Prescription #${rx.prescriptionNumber} for ${rx.patient.fullName} was dispensed by Pharmacy.`,
            type: 'INFO',
            entityType: 'Prescription',
            entityId: prescriptionId,
          },
        });
      }
    } catch (notifErr) {
      console.warn('Deferred post-dispensing notification warning:', notifErr.message);
    }

    return result;
  }

  /**
   * List dispensing history
   */
  async getDispensingHistory(query = {}) {
    const { search, patientId, pharmacistId, startDate, endDate, page = 1, limit = 20 } = query;

    const where = {};
    if (patientId) where.patientId = patientId;
    if (pharmacistId) where.pharmacistId = pharmacistId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (search) {
      where.OR = [
        { dispensingNumber: { contains: search, mode: 'insensitive' } },
        { prescription: { prescriptionNumber: { contains: search, mode: 'insensitive' } } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, dispensings] = await Promise.all([
      prisma.dispensing.count({ where }),
      prisma.dispensing.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              phone: true,
            },
          },
          pharmacist: {
            select: {
              id: true,
              fullName: true,
              employeeId: true,
            },
          },
          prescription: {
            select: {
              id: true,
              prescriptionNumber: true,
              prescribedDate: true,
              doctor: {
                select: {
                  department: true,
                  user: { select: { fullName: true } },
                },
              },
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              totalAmount: true,
              paidAmount: true,
            },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      dispensings,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}

module.exports = new DispensingService();
