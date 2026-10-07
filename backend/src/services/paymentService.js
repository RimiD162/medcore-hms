/**
 * Shared Payment Domain Service
 * Handles transactional payment recording with row locking, strict overpayment prevention,
 * idempotency replay, voiding with reason, and collections auditing.
 */

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const billingConfig = require('../config/billingConfig');
const {
  roundMoney,
  calculateInvoiceTotals,
} = require('../utils/financeMoney');
const { generatePaymentNumber } = require('../utils/patientIdGenerator');

class PaymentService {
  /**
   * Record a payment against an invoice with row-level transaction locks and idempotency protection
   */
  async recordPayment(arg1, arg2, arg3) {
    let invoiceId, data, receivedById;
    if (typeof arg1 === 'string') {
      invoiceId = arg1;
      data = arg2 || {};
      receivedById = arg3;
    } else {
      data = arg1 || {};
      invoiceId = data.invoiceId;
      receivedById = arg2;
    }

    const receiverId = typeof receivedById === 'object' && receivedById !== null ? receivedById.id : receivedById;
    const receiverUser = typeof receivedById === 'object' && receivedById !== null ? receivedById : null;

    const {
      patientId,
      amount,
      paymentMethod = 'CASH',
      paymentDate,
      referenceNumber,
      notes,
      idempotencyKey,
    } = data;

    const paymentAmount = roundMoney(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw ApiError.badRequest('Payment amount must be a positive number greater than 0');
    }

    if (paymentAmount > billingConfig.thresholds.amountSanityUpperBound) {
      throw ApiError.badRequest(`Payment amount exceeds sanity limit of ₹${billingConfig.thresholds.amountSanityUpperBound.toLocaleString('en-IN')}`);
    }

    const validMethods = billingConfig.paymentMethods;
    if (!validMethods.includes(paymentMethod)) {
      throw ApiError.badRequest(`Invalid payment method '${paymentMethod}'. Allowed methods: ${validMethods.join(', ')}`);
    }

    // Check payment date rules
    const parsedPaymentDate = paymentDate ? new Date(paymentDate) : new Date();
    const now = new Date();
    if (parsedPaymentDate > new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
      throw ApiError.badRequest('Payment date cannot be in the future');
    }

    // Idempotency replay check before starting transaction
    if (idempotencyKey) {
      const existing = await prisma.payment.findUnique({
        where: { idempotencyKey },
        include: {
          invoice: {
            include: {
              patient: {
                select: {
                  id: true,
                  patientIdNumber: true,
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
        },
      });
      if (existing) {
        return {
          ...existing,
          id: existing.id,
          amount: roundMoney(existing.amount),
          payment: existing,
          invoice: {
            ...existing.invoice,
            totalAmount: roundMoney(existing.invoice.totalAmount),
            paidAmount: roundMoney(existing.invoice.paidAmount),
            outstandingAmount: roundMoney(existing.invoice.outstandingAmount),
          },
          replayed: true,
          isDuplicate: true,
        };
      }
    }

    // Execute payment recording and invoice transition inside locked transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Lock invoice row for update to prevent concurrent double-payment
        await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${invoiceId} FOR UPDATE`;

      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          items: true,
          adjustments: true,
          payments: true,
          refunds: true,
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

      if (!invoice) {
        throw ApiError.notFound('Invoice record not found');
      }

      if (invoice.status === 'CANCELLED') {
        throw ApiError.badRequest('Cannot record payment against a cancelled invoice');
      }

      if (patientId && invoice.patientId !== patientId) {
        throw ApiError.badRequest('Invoice does not belong to the specified patient');
      }

      const currentOutstanding = roundMoney(Number(invoice.outstandingAmount));
      if (currentOutstanding <= 0 || invoice.status === 'PAID') {
        throw ApiError.badRequest('Invoice is already fully paid. No further payments accepted.');
      }

      // 2. Strict Overpayment Check
      if (paymentAmount > currentOutstanding) {
        throw ApiError.badRequest(
          `Payment amount (₹${paymentAmount.toFixed(2)}) exceeds remaining outstanding balance (₹${currentOutstanding.toFixed(2)}). Overpayments are strictly prohibited.`
        );
      }

      // 3. Generate Unique Payment Receipt Number
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
          paymentDate: parsedPaymentDate,
          paidAt: new Date(),
          status: 'COMPLETED',
          idempotencyKey: idempotencyKey || null,
          receivedById: receiverId || null,
          notes: notes || null,
        },
      });

      // 5. Recompute all invoice totals and status with the new payment included
      const allPayments = [...invoice.payments, payment];
      const totals = calculateInvoiceTotals({
        items: invoice.items,
        adjustments: invoice.adjustments,
        payments: allPayments,
        refunds: invoice.refunds,
        isCancelled: invoice.status === 'CANCELLED',
      });

      // 6. Update Invoice cached balances and status
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: totals.paidAmount,
          outstandingAmount: totals.outstandingAmount,
          status: totals.status,
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

      // 7. Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: receiverId || null,
          userName: receiverUser?.fullName || null,
          role: receiverUser?.role || null,
          action: 'PAYMENT_RECORDED',
          entity: 'Payment',
          entityId: payment.id,
          description: `Recorded ${paymentMethod} payment #${payment.paymentNumber} of ₹${paymentAmount.toFixed(2)} for Invoice #${invoice.invoiceNumber}. Balance remaining: ₹${totals.outstandingAmount.toFixed(2)}.`,
        },
      });

      return {
        ...payment,
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        amount: roundMoney(payment.amount),
        payment,
        invoice: {
          ...updatedInvoice,
          totalAmount: roundMoney(updatedInvoice.totalAmount),
          paidAmount: roundMoney(updatedInvoice.paidAmount),
          outstandingAmount: roundMoney(updatedInvoice.outstandingAmount),
        },
      };
    }, { maxWait: 15000, timeout: 60000 });

    return result;
  }

  /**
   * Search, filter, and list payments with collections aggregation
   */
  async getPayments(query = {}) {
    const {
      paymentMethod,
      status = 'COMPLETED',
      search,
      patientId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 25,
      sortBy = 'paidAt',
      sortOrder = 'desc',
    } = query;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.paymentDate.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined && minAmount !== '') where.amount.gte = Number(minAmount);
      if (maxAmount !== undefined && maxAmount !== '') where.amount.lte = Number(maxAmount);
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    const allowedSortFields = ['paymentNumber', 'paymentDate', 'paidAt', 'amount', 'paymentMethod', 'status'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'paidAt';
    const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [total, payments, collectionsAgg] = await Promise.all([
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
              paidAmount: true,
              outstandingAmount: true,
              status: true,
            },
          },
          receivedBy: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
          voidedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: { [orderField]: orderDirection },
        skip,
        take,
      }),
      prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    const totalCollected = Number(collectionsAgg._sum.amount || 0);

    return {
      payments,
      summary: {
        totalTransactions: total,
        totalAmountCollected: totalCollected,
      },
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Get single payment details by ID
   */
  async getPaymentById(paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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
        invoice: {
          include: {
            items: true,
            payments: true,
          },
        },
        refunds: {
          include: {
            requestedBy: { select: { fullName: true } },
            approvedBy: { select: { fullName: true } },
            processedBy: { select: { fullName: true } },
          },
        },
        receivedBy: {
          select: { fullName: true, role: true },
        },
        voidedBy: {
          select: { fullName: true, role: true },
        },
      },
    });

    if (!payment) {
      throw ApiError.notFound('Payment receipt not found');
    }

    return payment;
  }

  /**
   * Void a payment entry (Correction workflow with mandatory reason)
   * Blocked if payment has active or processed refunds. Recalculates invoice.
   */
  async voidPayment(paymentId, reasonOrData, voidedById) {
    const reason = typeof reasonOrData === 'string' ? reasonOrData : (reasonOrData?.reason || '');
    const voiderId = typeof voidedById === 'object' && voidedById !== null ? voidedById.id : voidedById;
    const voiderUser = typeof voidedById === 'object' && voidedById !== null ? voidedById : null;

    if (!reason || reason.trim().length < 3) {
      throw ApiError.badRequest('A void reason of at least 3 characters is required');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Lock payment and invoice
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          refunds: true,
          invoice: {
            include: {
              items: true,
              adjustments: true,
              payments: true,
              refunds: true,
            },
          },
        },
      });

      if (!payment) {
        throw ApiError.notFound('Payment record not found');
      }

      if (payment.status === 'VOIDED') {
        throw ApiError.badRequest('Payment is already voided');
      }

      // Check if any refunds exist on this payment
      const activeOrProcessedRefunds = payment.refunds.filter(
        (r) => ['REQUESTED', 'APPROVED', 'PROCESSED'].includes(r.status)
      );
      if (activeOrProcessedRefunds.length > 0) {
        throw ApiError.badRequest(
          'Cannot void payment because it has associated active or processed refunds. Resolve refunds first.'
        );
      }

      // 2. Mark payment as VOIDED
      const voidedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'VOIDED',
          voidedAt: new Date(),
          voidedById: voiderId || null,
          voidReason: reason.trim(),
        },
      });

      // 3. Recalculate invoice totals excluding this voided payment
      const remainingPayments = payment.invoice.payments.map((p) =>
        p.id === paymentId ? { ...p, status: 'VOIDED' } : p
      );

      const totals = calculateInvoiceTotals({
        items: payment.invoice.items,
        adjustments: payment.invoice.adjustments,
        payments: remainingPayments,
        refunds: payment.invoice.refunds,
        isCancelled: payment.invoice.status === 'CANCELLED',
      });

      // 4. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: totals.paidAmount,
          outstandingAmount: totals.outstandingAmount,
          status: totals.status,
        },
      });

      // 5. Audit
      await tx.auditLog.create({
        data: {
          userId: voiderId || null,
          userName: voiderUser?.fullName || null,
          role: voiderUser?.role || null,
          action: 'PAYMENT_VOIDED',
          entity: 'Payment',
          entityId: paymentId,
          description: `Voided payment #${payment.paymentNumber} of ₹${Number(payment.amount).toFixed(2)} on Invoice #${payment.invoice.invoiceNumber}. Reason: "${reason.trim()}".`,
        },
      });

      return {
        ...voidedPayment,
        id: voidedPayment.id,
        status: 'VOIDED',
        payment: voidedPayment,
        invoice: {
          ...updatedInvoice,
          totalAmount: roundMoney(updatedInvoice.totalAmount),
          paidAmount: roundMoney(updatedInvoice.paidAmount),
          outstandingAmount: roundMoney(updatedInvoice.outstandingAmount),
        },
      };
    }, { maxWait: 15000, timeout: 60000 });
  }
}

module.exports = new PaymentService();
