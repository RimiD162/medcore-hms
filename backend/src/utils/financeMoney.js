/**
 * Exact Financial Mathematics & Money Calculation Utilities
 * Enforces server-authoritative calculations, half-up 2-decimal rounding,
 * derived status, and strict consistency invariants.
 */

const billingConfig = require('../config/billingConfig');

/**
 * Pure Half-Up Rounding to exactly 2 decimal places.
 * Avoids JavaScript IEEE-754 floating-point drift.
 * @param {number|string|Decimal} value 
 * @returns {number}
 */
function roundMoney(value) {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) return 0.00;
  const sign = num < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(num) * 100 + Number.EPSILON * 100)) / 100;
}

/**
 * Calculate line item values with configured tax and item-level discount
 * Line total = (quantity × unitPrice − lineDiscount) + lineTax
 * where lineTax = round((quantity × unitPrice − lineDiscount) × taxRate / 100)
 */
function calculateLineItem({ quantity = 1, unitPrice = 0, discount = 0, taxRate = 0 }) {
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const price = Math.max(0, roundMoney(unitPrice));
  const gross = roundMoney(qty * price);
  const disc = Math.min(gross, Math.max(0, roundMoney(discount)));
  const net = roundMoney(gross - disc);
  
  const rate = Math.max(0, Number(taxRate) || 0);
  const tax = roundMoney(net * (rate / 100));
  const total = roundMoney(net + tax);

  return {
    quantity: qty,
    unitPrice: price,
    discount: disc,
    taxRate: rate,
    taxAmount: tax,
    lineNet: net,
    totalPrice: total,
  };
}

/**
 * Comprehensive invoice totals and status recomputation
 * @param {Object} params
 * @param {Array} params.items - Validated line items
 * @param {Array} params.adjustments - Credit / Debit adjustments
 * @param {Array} params.payments - Payments list
 * @param {Array} params.refunds - Refunds list
 * @param {boolean} params.isCancelled - Whether invoice is cancelled
 * @returns {Object} Calculated invoice aggregate summary
 */
function calculateInvoiceTotals(params = {}) {
  const {
    items = [],
    adjustments = [],
    payments = [],
    refunds = [],
    isCancelled = false,
  } = params;

  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let grandTotal = 0;

  for (const item of items) {
    const calculated = calculateLineItem({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      taxRate: item.taxRate || 0,
    });
    subtotal += roundMoney(calculated.quantity * calculated.unitPrice);
    totalDiscount += calculated.discount;
    totalTax += calculated.taxAmount;
    grandTotal += calculated.totalPrice;
  }

  subtotal = roundMoney(subtotal);
  totalDiscount = roundMoney(totalDiscount);
  totalTax = roundMoney(totalTax);
  grandTotal = roundMoney(grandTotal);

  // Net Adjustments (Debits add, Credits subtract)
  let netAdjustments = 0;
  if (adjustments.length > 0) {
    for (const adj of adjustments) {
      const amt = roundMoney(adj.amount);
      if (adj.type === 'DEBIT') {
        netAdjustments += amt;
      } else if (adj.type === 'CREDIT') {
        netAdjustments -= amt;
      }
    }
  } else if (params.adjustmentAmount !== undefined) {
    netAdjustments = roundMoney(Number(params.adjustmentAmount || 0));
  }
  netAdjustments = roundMoney(netAdjustments);

  // Effective Total: 0 if cancelled, else max(0, grandTotal + netAdjustments)
  const effectiveTotal = isCancelled ? 0.00 : Math.max(0, roundMoney(grandTotal + netAdjustments));

  // Payments & Refunds
  const paidAmount = payments.length > 0
    ? roundMoney(payments.filter((p) => p.status !== 'VOIDED').reduce((sum, p) => sum + Number(p.amount || 0), 0))
    : roundMoney(Number(params.paidAmount || 0));

  const refundedAmount = refunds.length > 0
    ? roundMoney(refunds.filter((r) => r.status === 'PROCESSED').reduce((sum, r) => sum + Number(r.amount || 0), 0))
    : roundMoney(Number(params.refundedAmount || 0));

  const netReceived = Math.max(0, roundMoney(paidAmount - refundedAmount));

  // Derive Stored Status
  let status = 'PENDING';
  if (isCancelled) {
    if (netReceived === 0 && refundedAmount > 0) {
      status = 'REFUNDED';
    } else {
      status = 'CANCELLED';
    }
  } else if (refundedAmount > 0 && netReceived === 0 && paidAmount > 0) {
    status = 'REFUNDED';
  } else if (netReceived >= effectiveTotal && effectiveTotal > 0) {
    status = 'PAID';
  } else if (netReceived > 0) {
    status = 'PARTIALLY_PAID';
  } else {
    status = 'PENDING';
  }

  // Outstanding: 0 if cancelled or refunded, else max(0, effectiveTotal - netReceived)
  const isTerminated = isCancelled || status === 'REFUNDED' || status === 'CANCELLED';
  const outstandingAmount = isTerminated ? 0.00 : Math.max(0, roundMoney(effectiveTotal - netReceived));

  // Refundable Surplus: max(0, netReceived - effectiveTotal)
  const refundableSurplus = Math.max(0, roundMoney(netReceived - effectiveTotal));

  return {
    subtotal,
    discountAmount: totalDiscount,
    taxAmount: totalTax,
    totalAmount: grandTotal,
    adjustmentAmount: netAdjustments,
    effectiveTotal,
    paidAmount,
    refundedAmount,
    netReceived,
    outstandingAmount,
    refundableSurplus,
    status,
  };
}

/**
 * Derive whether an invoice is OVERDUE based on date-only comparison in hospital timezone
 * OVERDUE is DERIVED, NEVER stored.
 * Expression: dueDate < today AND outstandingAmount > 0 AND status in (PENDING, PARTIALLY_PAID)
 */
function isInvoiceOverdue(invoice, referenceDate = new Date()) {
  if (!invoice) return false;
  if (invoice.status !== 'PENDING' && invoice.status !== 'PARTIALLY_PAID') return false;
  const outstanding = Number(invoice.outstandingAmount || 0);
  if (outstanding <= 0) return false;
  if (!invoice.dueDate) return false;

  const due = new Date(invoice.dueDate);
  const ref = new Date(referenceDate);

  // Normalize to date-only string YYYY-MM-DD for comparison
  const dueDateStr = due.toISOString().slice(0, 10);
  const todayStr = ref.toISOString().slice(0, 10);

  return dueDateStr < todayStr;
}

/**
 * Format money with configured currency symbol, locale and lakh grouping
 * @param {number|string|Decimal} amount 
 * @returns {string} e.g. "₹5,000.00"
 */
function formatMoney(amount) {
  const num = roundMoney(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = new Intl.NumberFormat(billingConfig.locale, {
    style: 'currency',
    currency: billingConfig.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absNum);

  return isNegative ? `-${formatted}` : formatted;
}

module.exports = {
  roundMoney,
  calculateLineItem,
  calculateInvoiceTotals,
  isInvoiceOverdue,
  formatMoney,
};
