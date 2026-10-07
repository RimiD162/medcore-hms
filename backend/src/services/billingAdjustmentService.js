/**
 * Shared Billing Adjustment Domain Service
 * Single integration mechanism for line reversals (Pharmacy returns, Lab order cancellations, discounts).
 */

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const {
  roundMoney,
  calculateInvoiceTotals,
} = require('../utils/financeMoney');

class BillingAdjustmentService {
  /**
   * Apply an append-only Credit adjustment to an invoice line (e.g. Pharmacy return, Lab cancellation)
   */
  async creditLine({ invoiceId, invoiceItemId, amount, reason, createdById }) {
    const adjAmount = Math.max(0, roundMoney(amount));
    if (adjAmount <= 0) {
      throw ApiError.badRequest('Credit adjustment amount must be greater than 0');
    }

    if (!reason || reason.trim().length < 3) {
      throw ApiError.badRequest('A reason for the credit adjustment is required');
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
        },
      });

      if (!invoice) {
        throw ApiError.notFound('Invoice record not found');
      }

      if (invoice.status === 'CANCELLED') {
        throw ApiError.badRequest('Cannot apply adjustments to a cancelled invoice');
      }

      let lineItem = null;
      if (invoiceItemId) {
        lineItem = invoice.items.find((i) => i.id === invoiceItemId);
        if (!lineItem) {
          throw ApiError.notFound('Referenced invoice line item not found on this invoice');
        }
      }

      // 2. Create append-only adjustment
      const adjustment = await tx.invoiceAdjustment.create({
        data: {
          invoiceId,
          invoiceItemId: invoiceItemId || null,
          type: 'CREDIT',
          amount: adjAmount,
          reason,
          createdById: createdById || null,
        },
      });

      // 3. Recompute Invoice Totals
      const allAdjustments = [...invoice.adjustments, adjustment];
      const totals = calculateInvoiceTotals({
        items: invoice.items,
        adjustments: allAdjustments,
        payments: invoice.payments,
        refunds: invoice.refunds,
        isCancelled: invoice.status === 'CANCELLED',
      });

      // 4. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          adjustmentAmount: totals.adjustmentAmount,
          outstandingAmount: totals.outstandingAmount,
          status: totals.status,
        },
        include: {
          items: true,
          adjustments: true,
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: createdById || null,
          action: 'LINE_CREDIT_ADJUSTED',
          entity: 'InvoiceAdjustment',
          entityId: adjustment.id,
          description: `Applied CREDIT adjustment of ₹${adjAmount.toFixed(2)} to Invoice #${invoice.invoiceNumber}${lineItem ? ` (Line: ${lineItem.serviceName})` : ''}. Reason: "${reason}".`,
        },
      });

      return {
        adjustment,
        invoice: updatedInvoice,
      };
    }, { maxWait: 15000, timeout: 60000 });
  }

  /**
   * Apply an append-only Debit adjustment
   */
  async debitLine({ invoiceId, invoiceItemId, amount, reason, createdById }) {
    const adjAmount = Math.max(0, roundMoney(amount));
    if (adjAmount <= 0) {
      throw ApiError.badRequest('Debit adjustment amount must be greater than 0');
    }

    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${invoiceId} FOR UPDATE`;

      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true, adjustments: true, payments: true, refunds: true },
      });

      if (!invoice) throw ApiError.notFound('Invoice record not found');
      if (invoice.status === 'CANCELLED') throw ApiError.badRequest('Cannot adjust cancelled invoice');

      const adjustment = await tx.invoiceAdjustment.create({
        data: {
          invoiceId,
          invoiceItemId: invoiceItemId || null,
          type: 'DEBIT',
          amount: adjAmount,
          reason,
          createdById: createdById || null,
        },
      });

      const allAdjustments = [...invoice.adjustments, adjustment];
      const totals = calculateInvoiceTotals({
        items: invoice.items,
        adjustments: allAdjustments,
        payments: invoice.payments,
        refunds: invoice.refunds,
        isCancelled: false,
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          adjustmentAmount: totals.adjustmentAmount,
          outstandingAmount: totals.outstandingAmount,
          status: totals.status,
        },
      });

      return { adjustment, invoice: updatedInvoice };
    }, { maxWait: 15000, timeout: 60000 });
  }
}

module.exports = new BillingAdjustmentService();
