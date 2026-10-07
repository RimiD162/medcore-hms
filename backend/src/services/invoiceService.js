/**
 * Shared Invoice Domain Service
 * Single source of truth for hospital invoices across Accountant, Receptionist, Doctor, Pharmacy, and Lab.
 */

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const billingConfig = require('../config/billingConfig');
const {
  roundMoney,
  calculateLineItem,
  calculateInvoiceTotals,
  isInvoiceOverdue,
} = require('../utils/financeMoney');
const { generateInvoiceNumber } = require('../utils/patientIdGenerator');

class InvoiceService {
  /**
   * List active service catalog items and standard prices
   */
  async getServiceCatalog(category = null) {
    const where = {
      isActive: true,
      ...(category && { category }),
    };

    return prisma.serviceCatalog.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Create an invoice from server-authoritative catalog prices and validated rules
   */
  async createInvoice(data, createdById) {
    const creatorId = typeof createdById === 'object' && createdById !== null ? createdById.id : createdById;
    const creatorUser = typeof createdById === 'object' && createdById !== null ? createdById : null;

    const {
      patientId,
      appointmentId,
      type = 'General',
      invoiceDate,
      dueDate,
      notes,
      items = [],
      idempotencyKey,
      discountAmount = 0,
    } = data;

    // Idempotency guard: Return existing if already created with this key
    if (idempotencyKey) {
      const existing = await prisma.invoice.findUnique({
        where: { idempotencyKey },
        include: {
          items: true,
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              phone: true,
              email: true,
              address: true,
            },
          },
          payments: true,
        },
      });
      if (existing) {
        return existing;
      }
    }

    // Validate patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, fullName: true, patientIdNumber: true },
    });
    if (!patient) {
      throw ApiError.notFound('Patient record not found');
    }

    // Validate appointment if provided
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });
      if (!appointment) {
        throw ApiError.notFound('Referenced appointment not found');
      }
      if (appointment.patientId !== patientId) {
        throw ApiError.badRequest('Referenced appointment does not belong to the selected patient');
      }
    }

    if (!items || items.length === 0) {
      throw ApiError.badRequest('Invoice must contain at least one line item');
    }

    // Server-Authoritative Price Resolution
    const catalogIds = items.map((i) => i.serviceCatalogId).filter(Boolean);
    const catalogRecords = catalogIds.length > 0
      ? await prisma.serviceCatalog.findMany({ where: { id: { in: catalogIds } } })
      : [];
    const catalogMap = new Map(catalogRecords.map((c) => [c.id, c]));

    const validatedItems = [];
    for (const item of items) {
      let unitPrice = 0;
      let serviceName = item.serviceName || 'Service Item';
      let category = item.category || 'General';
      let source = item.source || 'GENERAL';

      if (item.serviceCatalogId && catalogMap.has(item.serviceCatalogId)) {
        const cat = catalogMap.get(item.serviceCatalogId);
        unitPrice = Number(cat.price);
        serviceName = cat.name;
        category = cat.category;
      } else if (item.unitPrice !== undefined && item.unitPrice !== null) {
        unitPrice = Math.max(0, Number(item.unitPrice));
      } else {
        unitPrice = 500.00; // Standard general consultation default
      }

      // Check tax rate from config
      let taxRate = 0;
      if (item.taxRate !== undefined && item.taxRate !== null) {
        taxRate = Number(item.taxRate);
      } else if (item.taxRateCode && billingConfig.taxRates[item.taxRateCode]) {
        taxRate = billingConfig.taxRates[item.taxRateCode].rate;
      }

      const itemDiscount = Math.max(0, Number(item.discount || 0));

      const lineCalculations = calculateLineItem({
        quantity: item.quantity,
        unitPrice,
        discount: itemDiscount,
        taxRate,
      });

      validatedItems.push({
        serviceCatalogId: item.serviceCatalogId || null,
        serviceName,
        category,
        source,
        unitPrice: lineCalculations.unitPrice,
        quantity: lineCalculations.quantity,
        discount: lineCalculations.discount,
        taxRate: lineCalculations.taxRate,
        taxAmount: lineCalculations.taxAmount,
        totalPrice: lineCalculations.totalPrice,
      });
    }

    // Calculate invoice totals
    const totals = calculateInvoiceTotals({
      items: validatedItems,
      adjustments: [],
      payments: [],
      refunds: [],
      isCancelled: false,
    });

    // Default dates
    const parsedInvoiceDate = invoiceDate ? new Date(invoiceDate) : new Date();
    let parsedDueDate = dueDate ? new Date(dueDate) : null;
    if (!parsedDueDate) {
      parsedDueDate = new Date(parsedInvoiceDate);
      parsedDueDate.setDate(parsedDueDate.getDate() + billingConfig.thresholds.defaultPaymentTermsDays);
    }

    // Execute in transaction with collision retry
    let retries = 3;
    let newInvoice = null;

    while (retries > 0) {
      try {
        newInvoice = await prisma.$transaction(async (tx) => {
          const invoiceNumber = await generateInvoiceNumber(tx);

          const created = await tx.invoice.create({
            data: {
              invoiceNumber,
              patientId,
              appointmentId: appointmentId || null,
              createdById: creatorId || null,
              type,
              invoiceDate: parsedInvoiceDate,
              issueDate: parsedInvoiceDate,
              dueDate: parsedDueDate,
              subtotal: totals.subtotal,
              discountAmount: totals.discountAmount,
              taxAmount: totals.taxAmount,
              totalAmount: totals.totalAmount,
              adjustmentAmount: totals.adjustmentAmount,
              paidAmount: 0.00,
              refundedAmount: 0.00,
              outstandingAmount: totals.outstandingAmount,
              status: totals.status,
              notes: notes || null,
              idempotencyKey: idempotencyKey || null,
              items: {
                create: validatedItems,
              },
            },
            include: {
              items: true,
              patient: {
                select: {
                  id: true,
                  patientIdNumber: true,
                  fullName: true,
                  phone: true,
                  email: true,
                  address: true,
                },
              },
              payments: true,
              adjustments: true,
            },
          });

          // Audit Log
          await tx.auditLog.create({
            data: {
              userId: creatorId || null,
              userName: creatorUser?.fullName || null,
              role: creatorUser?.role || null,
              action: 'INVOICE_CREATED',
              entity: 'Invoice',
              entityId: created.id,
              description: `Created invoice #${created.invoiceNumber} for patient ${patient.fullName} (${patient.patientIdNumber}) totaling ₹${totals.totalAmount.toFixed(2)}.`,
            },
          });

          return created;
        }, { maxWait: 15000, timeout: 30000 });

        break;
      } catch (err) {
        if (err.code === 'P2002' && err.meta?.target?.includes('invoice_number') && retries > 1) {
          retries--;
          await new Promise((r) => setTimeout(r, 100));
          continue;
        }
        throw err;
      }
    }

    return {
      ...newInvoice,
      subtotal: Number(newInvoice.subtotal),
      totalAmount: Number(newInvoice.totalAmount),
      paidAmount: Number(newInvoice.paidAmount),
      refundedAmount: Number(newInvoice.refundedAmount),
      outstandingAmount: Number(newInvoice.outstandingAmount),
      isOverdue: isInvoiceOverdue(newInvoice),
    };
  }

  /**
   * Search, filter, and list invoices with pagination and derived status
   */
  async getInvoices(query = {}) {
    const {
      status,
      search,
      patientId,
      type,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      isOverdue,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where = {};

    // Specific Status Filter (or derived OVERDUE)
    if (status === 'OVERDUE' || isOverdue === 'true' || isOverdue === true) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.dueDate = { lt: today };
      where.status = { in: ['PENDING', 'PARTIALLY_PAID'] };
      where.outstandingAmount = { gt: 0 };
    } else if (status && status !== 'ALL') {
      where.status = status;
    }

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.invoiceDate.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.totalAmount = {};
      if (minAmount !== undefined && minAmount !== '') where.totalAmount.gte = Number(minAmount);
      if (maxAmount !== undefined && maxAmount !== '') where.totalAmount.lte = Number(maxAmount);
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
        { patient: { phone: { contains: search } } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    const allowedSortFields = ['invoiceNumber', 'invoiceDate', 'dueDate', 'totalAmount', 'outstandingAmount', 'status', 'createdAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
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
          items: true,
          payments: {
            select: {
              id: true,
              paymentNumber: true,
              amount: true,
              paymentMethod: true,
              paidAt: true,
              status: true,
              referenceNumber: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: { [orderField]: orderDirection },
        skip,
        take,
      }),
    ]);

    const enrichedInvoices = invoices.map((inv) => ({
      ...inv,
      isOverdue: isInvoiceOverdue(inv),
    }));

    return {
      invoices: enrichedInvoices,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Get single invoice details by ID with complete financial audit trail
   */
  async getInvoiceById(invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: {
          select: {
            id: true,
            patientIdNumber: true,
            fullName: true,
            phone: true,
            email: true,
            address: true,
            gender: true,
            age: true,
          },
        },
        items: {
          include: {
            adjustments: true,
          },
        },
        payments: {
          include: {
            receivedBy: {
              select: { fullName: true, role: true },
            },
            voidedBy: {
              select: { fullName: true },
            },
            refunds: true,
          },
          orderBy: { paidAt: 'desc' },
        },
        adjustments: {
          include: {
            createdBy: {
              select: { fullName: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        refunds: {
          include: {
            requestedBy: { select: { fullName: true } },
            approvedBy: { select: { fullName: true } },
            processedBy: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        createdBy: {
          select: { fullName: true, role: true },
        },
        cancelledBy: {
          select: { fullName: true, role: true },
        },
        appointment: {
          select: {
            id: true,
            appointmentNumber: true,
            appointmentDate: true,
            appointmentTime: true,
            type: true,
          },
        },
      },
    });

    if (!invoice) {
      throw ApiError.notFound('Invoice record not found');
    }

    return {
      ...invoice,
      isOverdue: isInvoiceOverdue(invoice),
      refundableSurplus: Math.max(0, roundMoney(Number(invoice.paidAmount) - Number(invoice.refundedAmount) - (invoice.status === 'CANCELLED' ? 0 : Number(invoice.totalAmount) + Number(invoice.adjustmentAmount)))),
    };
  }

  /**
   * Edit non-cancelled invoice
   * When payments exist: only due date and notes can be modified.
   * When no payments: due date, notes, non-clinical items and discounts can be modified.
   */
  async updateInvoice(invoiceId, updateData, userId) {
    const { dueDate, notes, items } = updateData;

    return prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true, payments: true },
      });

      if (!existing) {
        throw ApiError.notFound('Invoice not found');
      }

      if (existing.status === 'CANCELLED') {
        throw ApiError.badRequest('Cancelled invoices cannot be modified');
      }

      const hasPayments = existing.payments.some((p) => p.status !== 'VOIDED');
      const updatedFields = {
        updatedAt: new Date(),
      };

      if (dueDate) {
        updatedFields.dueDate = new Date(dueDate);
      }
      if (notes !== undefined) {
        updatedFields.notes = notes;
      }

      // If items are submitted and no payments exist, update items
      if (items && Array.isArray(items)) {
        if (hasPayments) {
          throw ApiError.badRequest('Line items cannot be directly edited after payments are recorded. Use credit adjustments for corrections.');
        }

        // Prohibit modifying items sourced from PHARMACY or LAB directly
        const linkedItems = existing.items.filter((i) => i.source === 'PHARMACY' || i.source === 'LAB');
        if (linkedItems.length > 0) {
          throw ApiError.badRequest('This invoice contains pharmacy or laboratory items. Clinical line items cannot be modified directly.');
        }

        // Delete existing and replace with new validated items
        await tx.invoiceItem.deleteMany({ where: { invoiceId } });

        const newItemsData = items.map((i) => {
          const calc = calculateLineItem({
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount || 0,
            taxRate: i.taxRate || 0,
          });
          return {
            invoiceId,
            serviceCatalogId: i.serviceCatalogId || null,
            serviceName: i.serviceName || 'Service',
            category: i.category || 'General',
            source: 'GENERAL',
            unitPrice: calc.unitPrice,
            quantity: calc.quantity,
            discount: calc.discount,
            taxRate: calc.taxRate,
            taxAmount: calc.taxAmount,
            totalPrice: calc.totalPrice,
          };
        });

        await tx.invoiceItem.createMany({ data: newItemsData });

        const totals = calculateInvoiceTotals({
          items: newItemsData,
          adjustments: [],
          payments: [],
          refunds: [],
          isCancelled: false,
        });

        updatedFields.subtotal = totals.subtotal;
        updatedFields.discountAmount = totals.discountAmount;
        updatedFields.taxAmount = totals.taxAmount;
        updatedFields.totalAmount = totals.totalAmount;
        updatedFields.outstandingAmount = totals.outstandingAmount;
        updatedFields.status = totals.status;
      }

      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: updatedFields,
        include: { items: true, patient: true },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          userId,
          action: 'INVOICE_UPDATED',
          entity: 'Invoice',
          entityId: invoiceId,
          description: `Updated invoice #${updated.invoiceNumber}.`,
        },
      });

      return updated;
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Cancel an invoice with mandatory reason
   * Non-destructive: sets status CANCELLED, zeroes outstanding, converts paid amount to surplus.
   */
  async cancelInvoice(invoiceId, { reason }, userId) {
    if (!reason || reason.trim().length < 5) {
      throw ApiError.badRequest('A cancellation reason of at least 5 characters is required');
    }

    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true, items: true },
      });

      if (!invoice) {
        throw ApiError.notFound('Invoice not found');
      }

      if (invoice.status === 'CANCELLED') {
        throw ApiError.badRequest('Invoice is already cancelled');
      }

      const hasPharmacyOrLab = invoice.items.some((i) => i.source === 'PHARMACY' || i.source === 'LAB');

      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'CANCELLED',
          outstandingAmount: 0.00,
          cancelledAt: new Date(),
          cancelledById: userId,
          cancelReason: reason,
        },
        include: {
          items: true,
          patient: true,
          payments: true,
        },
      });

      // Write Audit
      await tx.auditLog.create({
        data: {
          userId,
          action: 'INVOICE_CANCELLED',
          entity: 'Invoice',
          entityId: invoiceId,
          description: `Cancelled invoice #${invoice.invoiceNumber}. Reason: "${reason}". Clinical items warning: ${hasPharmacyOrLab}.`,
        },
      });

      return {
        ...updated,
        clinicalWarning: hasPharmacyOrLab
          ? 'Notice: Clinical dispensing and lab diagnostic orders are not reversed by financial invoice cancellation.'
          : null,
      };
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Add append-only credit or debit adjustment to an invoice
   */
  async addAdjustment(invoiceId, adjustmentData, userId) {
    const { amount, type = 'CREDIT', reason, invoiceItemId } = adjustmentData;

    const adjAmount = Math.max(0, roundMoney(amount));
    if (adjAmount <= 0) {
      throw ApiError.badRequest('Adjustment amount must be a positive number greater than 0');
    }

    if (!reason || reason.trim().length < 3) {
      throw ApiError.badRequest('Adjustment reason is required');
    }

    if (!['CREDIT', 'DEBIT'].includes(type)) {
      throw ApiError.badRequest('Adjustment type must be CREDIT or DEBIT');
    }

    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true, adjustments: true, payments: true, refunds: true },
      });

      if (!invoice) {
        throw ApiError.notFound('Invoice not found');
      }

      if (invoice.status === 'CANCELLED') {
        throw ApiError.badRequest('Cannot adjust a cancelled invoice');
      }

      // If item specified, verify item exists
      if (invoiceItemId) {
        const item = invoice.items.find((i) => i.id === invoiceItemId);
        if (!item) {
          throw ApiError.notFound('Referenced invoice line item not found on this invoice');
        }
      }

      const adjustment = await tx.invoiceAdjustment.create({
        data: {
          invoiceId,
          invoiceItemId: invoiceItemId || null,
          type,
          amount: adjAmount,
          reason,
          createdById: userId,
        },
      });

      // Recompute invoice cached totals
      const allAdjustments = [...invoice.adjustments, adjustment];
      const totals = calculateInvoiceTotals({
        items: invoice.items,
        adjustments: allAdjustments,
        payments: invoice.payments,
        refunds: invoice.refunds,
        isCancelled: invoice.status === 'CANCELLED',
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          adjustmentAmount: totals.adjustmentAmount,
          outstandingAmount: totals.outstandingAmount,
          status: totals.status,
        },
        include: { adjustments: true, items: true, patient: true },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'INVOICE_ADJUSTED',
          entity: 'Invoice',
          entityId: invoiceId,
          description: `Applied ${type} adjustment of ₹${adjAmount.toFixed(2)} to invoice #${invoice.invoiceNumber}. Reason: "${reason}".`,
        },
      });

      return {
        adjustment,
        invoice: updatedInvoice,
      };
    }, { maxWait: 15000, timeout: 30000 });
  }
}

module.exports = new InvoiceService();
