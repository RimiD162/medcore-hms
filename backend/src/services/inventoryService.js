const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const {
  generateTransactionNumber,
  generateStockReceiptNumber,
} = require('../utils/patientIdGenerator');

class InventoryService {
  /**
   * Get inventory overview grouped by medicine with active batches and stock status
   */
  async getInventoryOverview(query = {}) {
    const { search, category, status, page = 1, limit = 20 } = query;

    const where = {};
    if (category && category !== 'ALL') where.category = category;
    if (status && status !== 'ALL') where.status = status;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { medicineCode: { contains: search, mode: 'insensitive' } },
        { batches: { some: { batchNumber: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, medicines] = await Promise.all([
      prisma.medicine.count({ where }),
      prisma.medicine.findMany({
        where,
        include: {
          batches: {
            orderBy: { expiryDate: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
    ]);

    const enriched = medicines.map((med) => {
      const activeBatches = med.batches.filter(
        (b) => b.status === 'Active' && new Date(b.expiryDate) >= today
      );
      const expiredBatches = med.batches.filter(
        (b) => b.status === 'Expired' || new Date(b.expiryDate) < today
      );

      const usableStock = activeBatches.reduce((sum, b) => sum + b.quantityAvailable, 0);
      const expiredStock = expiredBatches.reduce((sum, b) => sum + b.quantityAvailable, 0);

      let stockStatus = 'In Stock';
      if (usableStock === 0) {
        stockStatus = 'Out of Stock';
      } else if (usableStock <= med.reorderLevel) {
        stockStatus = 'Low Stock';
      }

      return {
        ...med,
        usableStock,
        expiredStock,
        totalStock: usableStock + expiredStock,
        stockStatus,
        activeBatches: activeBatches.map((b) => {
          const diffMs = new Date(b.expiryDate).getTime() - today.getTime();
          const daysUntilExpiry = Math.ceil(diffMs / 86400000);
          return {
            ...b,
            daysUntilExpiry,
          };
        }),
        expiredBatches,
      };
    });

    return {
      inventory: enriched,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Receive stock (Goods Receipt)
   * Creates StockReceipt, StockReceiptItems, creates/updates batches, and writes RECEIPT ledger rows
   */
  async receiveStock(data, user) {
    const { supplier, invoiceReference, notes, items } = data;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const receiptResult = await prisma.$transaction(
      async (tx) => {
        const receiptNumber = await generateStockReceiptNumber(tx);

        const receipt = await tx.stockReceipt.create({
          data: {
            receiptNumber,
            supplier,
            invoiceReference: invoiceReference || null,
            receivedById: user?.id || null,
            notes: notes || null,
          },
        });

        const createdReceiptItems = [];

        for (const item of items) {
          const expDate = new Date(`${item.expiryDate}T00:00:00.000Z`);
          if (expDate <= today) {
            throw ApiError.badRequest(
              `Expiry date for batch ${item.batchNumber} must be in the future (received: ${item.expiryDate})`
            );
          }

          const medicine = await tx.medicine.findUnique({
            where: { id: item.medicineId },
          });

          if (!medicine) {
            throw ApiError.notFound(`Medicine not found for ID ${item.medicineId}`);
          }

          const receiptItem = await tx.stockReceiptItem.create({
            data: {
              receiptId: receipt.id,
              medicineId: item.medicineId,
              batchNumber: item.batchNumber,
              quantityReceived: item.quantityReceived,
              purchaseCost: item.purchaseCost ?? null,
              expiryDate: expDate,
            },
          });
          createdReceiptItems.push(receiptItem);

          // Find or create batch
          let batch = await tx.medicineBatch.findUnique({
            where: {
              medicineId_batchNumber: {
                medicineId: item.medicineId,
                batchNumber: item.batchNumber,
              },
            },
          });

          let newBalance = item.quantityReceived;

          if (batch) {
            newBalance = batch.quantityAvailable + item.quantityReceived;
            batch = await tx.medicineBatch.update({
              where: { id: batch.id },
              data: {
                quantityReceived: batch.quantityReceived + item.quantityReceived,
                quantityAvailable: newBalance,
                status: 'Active',
                expiryDate: expDate,
                purchaseCost: item.purchaseCost ?? batch.purchaseCost,
                sellingPrice: item.sellingPrice ?? batch.sellingPrice ?? medicine.sellingPrice,
              },
            });
          } else {
            batch = await tx.medicineBatch.create({
              data: {
                medicineId: item.medicineId,
                batchNumber: item.batchNumber,
                manufacturer: medicine.manufacturer,
                supplier: supplier,
                expiryDate: expDate,
                quantityReceived: item.quantityReceived,
                quantityAvailable: item.quantityReceived,
                purchaseCost: item.purchaseCost ?? null,
                sellingPrice: item.sellingPrice ?? medicine.sellingPrice,
                status: 'Active',
              },
            });
          }

          // Write append-only RECEIPT ledger row
          const transactionNumber = await generateTransactionNumber(tx);
          await tx.stockTransaction.create({
            data: {
              transactionNumber,
              medicineId: item.medicineId,
              batchId: batch.id,
              quantityChange: item.quantityReceived,
              type: 'RECEIPT',
              reason: `Goods receipt #${receiptNumber} from ${supplier}`,
              balanceAfter: newBalance,
              performedById: user?.id || null,
              receiptId: receipt.id,
            },
          });
        }

        return { receipt, itemsCount: createdReceiptItems.length };
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.fullName || 'Pharmacist',
        role: 'PHARMACIST',
        action: 'RECEIVE_STOCK',
        entity: 'StockReceipt',
        entityId: receiptResult.receipt.id,
        description: `Received ${receiptResult.itemsCount} medicine items from ${supplier} (Receipt #${receiptResult.receipt.receiptNumber})`,
      },
    });

    return receiptResult;
  }

  /**
   * Adjust stock on a batch (Increase or Decrease with mandatory reason)
   */
  async adjustStock(data, user) {
    const { batchId, quantityChange, reason } = data;

    if (quantityChange === 0) {
      throw ApiError.badRequest('Quantity change cannot be zero');
    }
    if (!reason || reason.trim().length < 3) {
      throw ApiError.badRequest('A clinical/operational reason (min 3 chars) is mandatory for stock adjustment');
    }

    const adjustmentResult = await prisma.$transaction(
      async (tx) => {
        const batch = await tx.medicineBatch.findUnique({
          where: { id: batchId },
          include: { medicine: true },
        });

        if (!batch) {
          throw ApiError.notFound('Medicine batch not found');
        }

        const newBalance = batch.quantityAvailable + quantityChange;
        if (newBalance < 0) {
          throw ApiError.badRequest(
            `Adjustment of ${quantityChange} would result in negative stock (current: ${batch.quantityAvailable})`
          );
        }

        const updatedBatch = await tx.medicineBatch.update({
          where: { id: batchId },
          data: { quantityAvailable: newBalance },
        });

        const type = quantityChange > 0 ? 'ADJUSTMENT_INCREASE' : 'ADJUSTMENT_DECREASE';
        const transactionNumber = await generateTransactionNumber(tx);

        const transaction = await tx.stockTransaction.create({
          data: {
            transactionNumber,
            medicineId: batch.medicineId,
            batchId: batch.id,
            quantityChange,
            type,
            reason,
            balanceAfter: newBalance,
            performedById: user?.id || null,
          },
        });

        return { batch: updatedBatch, transaction };
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.fullName || 'Pharmacist',
        role: 'PHARMACIST',
        action: 'ADJUST_STOCK',
        entity: 'MedicineBatch',
        entityId: batchId,
        description: `Adjusted batch stock by ${quantityChange} units. Reason: ${reason}. New balance: ${adjustmentResult.batch.quantityAvailable}`,
      },
    });

    return adjustmentResult;
  }

  /**
   * Write off expired batch stock
   */
  async writeOffExpired(data, user) {
    const { batchId, reason } = data;

    if (!reason || reason.trim().length < 3) {
      throw ApiError.badRequest('A valid reason is mandatory for batch expiry write-off');
    }

    const writeOffResult = await prisma.$transaction(
      async (tx) => {
        const batch = await tx.medicineBatch.findUnique({
          where: { id: batchId },
          include: { medicine: true },
        });

        if (!batch) {
          throw ApiError.notFound('Medicine batch not found');
        }

        if (batch.quantityAvailable <= 0) {
          throw ApiError.badRequest('Batch has no remaining stock units to write off');
        }

        const qtyToWriteOff = batch.quantityAvailable;

        const updatedBatch = await tx.medicineBatch.update({
          where: { id: batchId },
          data: {
            quantityAvailable: 0,
            status: 'WrittenOff',
          },
        });

        const transactionNumber = await generateTransactionNumber(tx);
        const transaction = await tx.stockTransaction.create({
          data: {
            transactionNumber,
            medicineId: batch.medicineId,
            batchId: batch.id,
            quantityChange: -qtyToWriteOff,
            type: 'EXPIRY_WRITE_OFF',
            reason,
            balanceAfter: 0,
            performedById: user?.id || null,
          },
        });

        return { batch: updatedBatch, transaction, quantityWrittenOff: qtyToWriteOff };
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.fullName || 'Pharmacist',
        role: 'PHARMACIST',
        action: 'WRITE_OFF_EXPIRY',
        entity: 'MedicineBatch',
        entityId: batchId,
        description: `Wrote off ${writeOffResult.quantityWrittenOff} expired units for batch. Reason: ${reason}`,
      },
    });

    return writeOffResult;
  }

  /**
   * List append-only stock transaction history
   */
  async getTransactions(query = {}) {
    const { medicineId, batchId, type, startDate, endDate, page = 1, limit = 25 } = query;

    const where = {};
    if (medicineId) where.medicineId = medicineId;
    if (batchId) where.batchId = batchId;
    if (type && type !== 'ALL') where.type = type;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, transactions] = await Promise.all([
      prisma.stockTransaction.count({ where }),
      prisma.stockTransaction.findMany({
        where,
        include: {
          medicine: {
            select: {
              id: true,
              medicineCode: true,
              name: true,
              genericName: true,
              unit: true,
            },
          },
          batch: {
            select: {
              id: true,
              batchNumber: true,
              expiryDate: true,
            },
          },
          performedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          dispensing: {
            select: {
              dispensingNumber: true,
              prescriptionId: true,
            },
          },
          receipt: {
            select: {
              receiptNumber: true,
              supplier: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}

module.exports = new InventoryService();
