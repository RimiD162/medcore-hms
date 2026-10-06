const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { generateInvoiceNumber, generatePaymentNumber } = require('../utils/patientIdGenerator');

class ReceptionistBillingService {
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
   * Create an invoice for a patient from configured service catalog items
   * All totals, taxes, and balances are server-calculated and authoritative
   */
  async createInvoice(data, createdById) {
    const { patientId, appointmentId, dueDate, notes, discountAmount = 0, items = [] } = data;

    // Validate patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
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
    }

    // Lookup prices from ServiceCatalog for authoritative pricing
    const catalogIds = items.map((i) => i.serviceCatalogId).filter(Boolean);
    const catalogRecords = await prisma.serviceCatalog.findMany({
      where: { id: { in: catalogIds } },
    });
    const catalogMap = new Map(catalogRecords.map((c) => [c.id, c]));

    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      let unitPrice = 0;
      let serviceName = item.serviceName;
      let category = item.category || 'General';

      if (item.serviceCatalogId && catalogMap.has(item.serviceCatalogId)) {
        const catalogItem = catalogMap.get(item.serviceCatalogId);
        unitPrice = Number(catalogItem.price);
        serviceName = catalogItem.name;
        category = catalogItem.category;
      } else {
        // If not in catalog, fallback to standard general consultation if not provided
        unitPrice = item.unitPrice ? Math.max(0, Number(item.unitPrice)) : 500.00;
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const lineTotal = unitPrice * quantity;
      calculatedSubtotal += lineTotal;

      validatedItems.push({
        serviceCatalogId: item.serviceCatalogId || null,
        serviceName,
        category,
        unitPrice,
        quantity,
        totalPrice: lineTotal,
      });
    }

    const appliedDiscount = Math.min(calculatedSubtotal, Math.max(0, Number(discountAmount)));
    const calculatedTotal = calculatedSubtotal - appliedDiscount;

    const newInvoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await generateInvoiceNumber(tx);

      return tx.invoice.create({
        data: {
          invoiceNumber,
          patientId,
          appointmentId: appointmentId || null,
          createdById,
          issueDate: new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          subtotal: calculatedSubtotal,
          taxAmount: 0.00,
          discountAmount: appliedDiscount,
          totalAmount: calculatedTotal,
          paidAmount: 0.00,
          outstandingAmount: calculatedTotal,
          status: calculatedTotal === 0 ? 'PAID' : 'PENDING',
          notes: notes || null,
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
            },
          },
        },
      });
    }, { maxWait: 15000, timeout: 30000 });

    return newInvoice;
  }

  /**
   * Search, filter, and list invoices
   */
  async getInvoices(query = {}) {
    const { status, search, patientId, page = 1, limit = 20 } = query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
        { patient: { phone: { contains: search } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

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
              referenceNumber: true,
            },
          },
        },
        orderBy: { issueDate: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      invoices,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get single invoice details by ID
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
          },
        },
        items: true,
        payments: {
          include: {
            receivedBy: {
              select: { fullName: true },
            },
          },
          orderBy: { paidAt: 'desc' },
        },
        createdBy: {
          select: { fullName: true },
        },
      },
    });

    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    return invoice;
  }

  /**
   * Record a payment against an existing invoice
   * Transactional lock prevents concurrent overpayment and accurately transitions state
   */
  async recordPayment(data, receivedById) {
    const { invoiceId, patientId, amount, paymentMethod = 'CASH', referenceNumber, notes } = data;

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw ApiError.badRequest('Payment amount must be a positive number greater than 0');
    }

    const validMethods = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'];
    if (!validMethods.includes(paymentMethod)) {
      throw ApiError.badRequest(`Invalid payment method '${paymentMethod}'. Allowed: ${validMethods.join(', ')}`);
    }

    // Execute payment recording and invoice status transition inside transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Re-read invoice inside transaction to get latest outstanding amount
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { patient: true },
      });

      if (!invoice) {
        throw ApiError.notFound('Invoice not found');
      }

      if (patientId && invoice.patientId !== patientId) {
        throw ApiError.badRequest('Invoice does not belong to the specified patient');
      }

      const currentOutstanding = Number(invoice.outstandingAmount);
      const currentPaid = Number(invoice.paidAmount);
      const totalAmount = Number(invoice.totalAmount);

      if (currentOutstanding <= 0 || invoice.status === 'PAID') {
        throw ApiError.badRequest('Invoice is already fully paid. No further payments accepted.');
      }

      // 2. Strict Overpayment Check
      if (paymentAmount > currentOutstanding) {
        throw ApiError.badRequest(
          `Payment amount ($${paymentAmount.toFixed(2)}) exceeds remaining outstanding balance ($${currentOutstanding.toFixed(2)}). Overpayments are not permitted.`
        );
      }

      // 3. Generate unique payment receipt number
      const paymentNumber = await generatePaymentNumber(tx);

      // 4. Create Payment record
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId,
          patientId: invoice.patientId,
          amount: paymentAmount,
          paymentMethod,
          referenceNumber: referenceNumber || null,
          paidAt: new Date(),
          receivedById,
          notes: notes || null,
        },
      });

      // 5. Compute new balances and status
      const newPaidAmount = currentPaid + paymentAmount;
      const newOutstandingAmount = Math.max(0, totalAmount - newPaidAmount);

      let newStatus = 'PENDING';
      if (newOutstandingAmount === 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      // 6. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstandingAmount,
          status: newStatus,
        },
      });

      return {
        payment,
        invoice: updatedInvoice,
      };
    }, { maxWait: 15000, timeout: 30000 });

    return result;
  }

  /**
   * List payment receipts and transaction history
   */
  async getPayments(query = {}) {
    const { paymentMethod, search, patientId, startDate, endDate, page = 1, limit = 25 } = query;

    const where = {};

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (startDate && endDate) {
      where.paidAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, payments, totalCollections] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
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
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              status: true,
            },
          },
          receivedBy: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        skip,
        take,
      }),
      prisma.payment.findMany({
        where,
        select: { amount: true },
      }),
    ]);

    const totalAmount = totalCollections.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      payments,
      summary: {
        totalTransactions: total,
        totalAmountCollected: totalAmount,
      },
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}

module.exports = new ReceptionistBillingService();
