/**
 * Shared Refund Domain Service
 * Enforces surplus/payment refunding, 3-stage lifecycle (REQUESTED -> APPROVED -> PROCESSED),
 * reserved-capacity concurrency protection, and separation of duties.
 */

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const billingConfig = require('../config/billingConfig');
const {
  roundMoney,
  calculateInvoiceTotals,
} = require('../utils/financeMoney');
const { generateRefundNumber } = require('../utils/patientIdGenerator');

class RefundService {
  /**
   * Request a refund against an existing payment and invoice
   */
  async requestRefund(arg1, arg2, arg3) {
    let invoiceId, data, requestedById;
    if (typeof arg1 === 'string') {
      invoiceId = arg1;
      data = arg2 || {};
      requestedById = arg3;
    } else {
      data = arg1 || {};
      invoiceId = data.invoiceId;
      requestedById = arg2;
    }

    const requesterId = typeof requestedById === 'object' && requestedById !== null ? requestedById.id : requestedById;
    const requesterUser = typeof requestedById === 'object' && requestedById !== null ? requestedById : null;

    const { amount, reason, refundMethod = 'CASH' } = data;
    let paymentId = data.paymentId;

    const refundAmount = roundMoney(amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      throw ApiError.badRequest('Refund amount must be a positive number greater than 0');
    }

    if (!reason || reason.trim().length < 3) {
      throw ApiError.badRequest('A detailed refund reason of at least 3 characters is required');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Lock invoice
      await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${invoiceId} FOR UPDATE`;

      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          items: true,
          adjustments: true,
          payments: true,
          refunds: true,
          patient: true,
        },
      });

      if (!invoice) {
        throw ApiError.notFound('Invoice not found');
      }

      // If paymentId not provided, auto-select first completed payment
      if (!paymentId) {
        const eligible = invoice.payments.find((p) => p.status === 'COMPLETED');
        if (!eligible) {
          throw ApiError.badRequest('No completed payments exist on this invoice to refund');
        }
        paymentId = eligible.id;
      }

      const payment = invoice.payments.find((p) => p.id === paymentId);
      if (!payment) {
        throw ApiError.notFound('Payment record not found on this invoice');
      }

      if (payment.status === 'VOIDED') {
        throw ApiError.badRequest('Cannot issue refund against a voided payment');
      }

      // 2. Compute Available Refundable Amount
      const completedPaymentsTotal = roundMoney(
        invoice.payments
          .filter((p) => p.status === 'COMPLETED')
          .reduce((sum, p) => sum + Number(p.amount), 0)
      );
      const processedRefundsTotal = roundMoney(
        invoice.refunds
          .filter((r) => r.status === 'PROCESSED')
          .reduce((sum, r) => sum + Number(r.amount), 0)
      );
      const pendingRefundsTotal = roundMoney(
        invoice.refunds
          .filter((r) => ['REQUESTED', 'APPROVED'].includes(r.status))
          .reduce((sum, r) => sum + Number(r.amount), 0)
      );

      const maxRefundable = Math.max(
        0,
        roundMoney(completedPaymentsTotal - (processedRefundsTotal + pendingRefundsTotal))
      );

      if (maxRefundable <= 0) {
        throw ApiError.badRequest('No refundable balance exists on this invoice.');
      }

      if (refundAmount > maxRefundable) {
        throw ApiError.badRequest(
          `Requested refund (₹${refundAmount.toFixed(2)}) cannot exceed refundable amount of ₹${maxRefundable.toFixed(2)}.`
        );
      }

      // 3. Generate Refund Number & Record Request
      const refundNumber = await generateRefundNumber(tx);

      const refund = await tx.refund.create({
        data: {
          refundNumber,
          paymentId,
          invoiceId,
          amount: refundAmount,
          reason: reason.trim(),
          refundMethod,
          status: 'REQUESTED',
          requestedById: requesterId || null,
        },
        include: {
          payment: true,
          invoice: true,
          requestedBy: { select: { id: true, fullName: true, role: true } },
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          userId: requesterId || null,
          userName: requesterUser?.fullName || null,
          role: requesterUser?.role || null,
          action: 'REFUND_REQUESTED',
          entity: 'Refund',
          entityId: refund.id,
          description: `Requested refund #${refund.refundNumber} of ₹${refundAmount.toFixed(2)} against Payment #${payment.paymentNumber} on Invoice #${invoice.invoiceNumber}. Reason: "${reason.trim()}".`,
        },
      });

      return {
        ...refund,
        id: refund.id,
        refundNumber: refund.refundNumber,
        amount: roundMoney(refund.amount),
      };
    }, { maxWait: 15000, timeout: 60000 });
  }

  /**
   * Approve a pending refund request (Senior Approver duty)
   */
  async approveRefund(refundId, approvedById, notes = '') {
    const approverId = typeof approvedById === 'object' && approvedById !== null ? approvedById.id : approvedById;
    const approverUser = typeof approvedById === 'object' && approvedById !== null ? approvedById : null;

    return prisma.$transaction(async (tx) => {
      const refund = await tx.refund.findUnique({
        where: { id: refundId },
        include: { invoice: true, payment: true },
      });

      if (!refund) {
        throw ApiError.notFound('Refund record not found');
      }

      if (refund.status !== 'REQUESTED') {
        throw ApiError.badRequest(`Cannot approve refund with status '${refund.status}'. Expected 'REQUESTED'.`);
      }

      // Separation of duties check
      if (billingConfig.thresholds.requireSeparateApprover && refund.requestedById && refund.requestedById === approverId) {
        throw ApiError.forbidden('Separation of duties violation: The refund requester cannot approve their own refund request.');
      }

      const approved = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: 'APPROVED',
          approvedById: approverId || null,
          approvedAt: new Date(),
          rejectionReason: notes ? `[Approved Notes]: ${notes}` : null,
        },
        include: {
          payment: true,
          invoice: true,
          requestedBy: { select: { id: true, fullName: true, role: true } },
          approvedBy: { select: { id: true, fullName: true, role: true } },
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          userId: approverId || null,
          userName: approverUser?.fullName || null,
          role: approverUser?.role || null,
          action: 'REFUND_APPROVED',
          entity: 'Refund',
          entityId: refundId,
          description: `Approved refund #${refund.refundNumber} of ₹${Number(refund.amount).toFixed(2)}.`,
        },
      });

      return {
        ...approved,
        id: approved.id,
        refundNumber: approved.refundNumber,
        amount: roundMoney(approved.amount),
      };
    }, { maxWait: 15000, timeout: 60000 });
  }

  /**
   * Reject a refund request
   */
  async rejectRefund(refundId, reasonOrData, rejectedById) {
    const reason = typeof reasonOrData === 'string' ? reasonOrData : (reasonOrData?.reason || reasonOrData?.rejectionReason || '');
    const rejecterId = typeof rejectedById === 'object' && rejectedById !== null ? rejectedById.id : rejectedById;
    const rejecterUser = typeof rejectedById === 'object' && rejectedById !== null ? rejectedById : null;

    if (!reason || reason.trim().length < 3) {
      throw ApiError.badRequest('A rejection reason of at least 3 characters is required');
    }

    return prisma.$transaction(async (tx) => {
      const refund = await tx.refund.findUnique({
        where: { id: refundId },
      });

      if (!refund) {
        throw ApiError.notFound('Refund record not found');
      }

      if (!['REQUESTED', 'APPROVED'].includes(refund.status)) {
        throw ApiError.badRequest(`Cannot reject refund with status '${refund.status}'`);
      }

      const rejected = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason.trim(),
        },
        include: {
          payment: true,
          invoice: true,
        },
      });

      // Audit
      await tx.auditLog.create({
        data: {
          userId: rejecterId || null,
          userName: rejecterUser?.fullName || null,
          role: rejecterUser?.role || null,
          action: 'REFUND_REJECTED',
          entity: 'Refund',
          entityId: refundId,
          description: `Rejected refund #${refund.refundNumber}. Reason: "${reason.trim()}".`,
        },
      });

      return {
        ...rejected,
        id: rejected.id,
        status: 'REJECTED',
        amount: roundMoney(rejected.amount),
      };
    }, { maxWait: 15000, timeout: 60000 });
  }

  /**
   * Cancel a refund request (by requester before processing)
   */
  async cancelRefund(refundId, reasonOrData, cancelledById) {
    const reason = typeof reasonOrData === 'string' ? reasonOrData : (reasonOrData?.reason || 'Cancelled by requester');
    const cancellerId = typeof cancelledById === 'object' && cancelledById !== null ? cancelledById.id : cancelledById;
    const cancellerUser = typeof cancelledById === 'object' && cancelledById !== null ? cancelledById : null;

    return prisma.$transaction(async (tx) => {
      const refund = await tx.refund.findUnique({
        where: { id: refundId },
      });

      if (!refund) {
        throw ApiError.notFound('Refund record not found');
      }

      if (!['REQUESTED', 'APPROVED'].includes(refund.status)) {
        throw ApiError.badRequest(`Cannot cancel refund with status '${refund.status}'`);
      }

      const cancelled = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: 'CANCELLED',
          rejectionReason: reason.trim(),
        },
        include: { payment: true, invoice: true },
      });

      await tx.auditLog.create({
        data: {
          userId: cancellerId || null,
          userName: cancellerUser?.fullName || null,
          role: cancellerUser?.role || null,
          action: 'REFUND_CANCELLED',
          entity: 'Refund',
          entityId: refundId,
          description: `Cancelled refund #${refund.refundNumber}.`,
        },
      });

      return {
        ...cancelled,
        id: cancelled.id,
        status: 'CANCELLED',
        amount: roundMoney(cancelled.amount),
      };
    }, { maxWait: 15000, timeout: 60000 });
  }

  /**
   * Process and finalize refund settlement
   */
  async processRefund(refundId, data = {}, processedById) {
    const { refundMethod = 'CASH', referenceNumber, notes } = data;
    const processorId = typeof processedById === 'object' && processedById !== null ? processedById.id : processedById;
    const processorUser = typeof processedById === 'object' && processedById !== null ? processedById : null;

    return prisma.$transaction(async (tx) => {
      // 1. Lock refund and invoice
      const refund = await tx.refund.findUnique({
        where: { id: refundId },
        include: {
          invoice: {
            include: {
              items: true,
              adjustments: true,
              payments: true,
              refunds: true,
            },
          },
          payment: true,
        },
      });

      if (!refund) {
        throw ApiError.notFound('Refund record not found');
      }

      if (refund.status !== 'APPROVED') {
        throw ApiError.badRequest(`Cannot process refund with status '${refund.status}'. Expected 'APPROVED'.`);
      }

      // 2. Mark Refund PROCESSED
      const processed = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: 'PROCESSED',
          processedById: processorId || null,
          processedAt: new Date(),
          refundMethod,
          referenceNumber: referenceNumber || null,
          rejectionReason: notes ? `${refund.rejectionReason || ''}\n[Process Note]: ${notes}`.trim() : refund.rejectionReason,
        },
      });

      // 3. Recompute Invoice Cached Totals
      const allRefunds = refund.invoice.refunds.map((r) =>
        r.id === refundId ? { ...r, status: 'PROCESSED' } : r
      );

      const totals = calculateInvoiceTotals({
        items: refund.invoice.items,
        adjustments: refund.invoice.adjustments,
        payments: refund.invoice.payments,
        refunds: allRefunds,
        isCancelled: refund.invoice.status === 'CANCELLED',
      });

      // 4. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: refund.invoiceId },
        data: {
          refundedAmount: totals.refundedAmount,
          outstandingAmount: totals.outstandingAmount,
          status: totals.status,
        },
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
      });

      // 5. Audit
      await tx.auditLog.create({
        data: {
          userId: processorId || null,
          userName: processorUser?.fullName || null,
          role: processorUser?.role || null,
          action: 'REFUND_PROCESSED',
          entity: 'Refund',
          entityId: refundId,
          description: `Processed refund #${refund.refundNumber} of ₹${Number(refund.amount).toFixed(2)} via ${refundMethod} (Ref: ${referenceNumber || 'N/A'}). Invoice #${refund.invoice.invoiceNumber} status: ${totals.status}.`,
        },
      });

      return {
        ...processed,
        id: processed.id,
        refund: processed,
        amount: roundMoney(processed.amount),
        invoice: {
          ...updatedInvoice,
          totalAmount: roundMoney(updatedInvoice.totalAmount),
          paidAmount: roundMoney(updatedInvoice.paidAmount),
          refundedAmount: roundMoney(updatedInvoice.refundedAmount),
          outstandingAmount: roundMoney(updatedInvoice.outstandingAmount),
        },
      };
    }, { maxWait: 15000, timeout: 60000 });
  }

  /**
   * Search and list refunds with filters
   */
  async getRefunds(query = {}) {
    const { status, search, startDate, endDate, page = 1, limit = 20 } = query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (search) {
      where.OR = [
        { refundNumber: { contains: search, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
        { payment: { paymentNumber: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    const [total, refunds, processedSummary] = await Promise.all([
      prisma.refund.count({ where }),
      prisma.refund.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
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
          payment: {
            select: {
              id: true,
              paymentNumber: true,
              amount: true,
              paymentMethod: true,
            },
          },
          requestedBy: { select: { id: true, fullName: true, role: true } },
          approvedBy: { select: { id: true, fullName: true, role: true } },
          processedBy: { select: { id: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.refund.aggregate({
        where: { ...where, status: 'PROCESSED' },
        _sum: { amount: true },
      }),
    ]);

    const formattedRefunds = refunds.map((r) => ({
      ...r,
      amount: roundMoney(r.amount),
    }));

    return {
      refunds: formattedRefunds,
      summary: {
        totalRequests: total,
        totalAmountRefunded: roundMoney(Number(processedSummary._sum.amount || 0)),
      },
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  async listRefunds(filters = {}, pagination = {}) {
    return this.getRefunds({ ...filters, ...pagination });
  }
}

module.exports = new RefundService();
