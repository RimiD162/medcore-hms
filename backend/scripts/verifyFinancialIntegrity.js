/**
 * Read-only Financial Integrity Verification Script
 * Recomputes all invoice figures from pure underlying lines, adjustments, payments,
 * and refunds, asserting 100% agreement with cached columns and statuses.
 */

require('dotenv').config();
const prisma = require('../src/config/prisma');
const { calculateInvoiceTotals, roundMoney } = require('../src/utils/financeMoney');

async function verifyFinancialIntegrity() {
  console.log('🔍 Starting Read-Only Financial Integrity Audit...');

  const invoices = await prisma.invoice.findMany({
    include: {
      items: true,
      adjustments: true,
      payments: true,
      refunds: true,
      patient: {
        select: {
          fullName: true,
          patientIdNumber: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Auditing ${invoices.length} total hospital invoices...`);

  let checkedCount = 0;
  let mismatchCount = 0;
  const discrepancies = [];

  for (const inv of invoices) {
    checkedCount++;

    const expected = calculateInvoiceTotals({
      items: inv.items,
      adjustments: inv.adjustments,
      payments: inv.payments,
      refunds: inv.refunds,
      isCancelled: inv.status === 'CANCELLED',
    });

    const storedSubtotal = roundMoney(inv.subtotal);
    const storedDiscount = roundMoney(inv.discountAmount);
    const storedTax = roundMoney(inv.taxAmount);
    const storedTotal = roundMoney(inv.totalAmount);
    const storedAdjustment = roundMoney(inv.adjustmentAmount);
    const storedPaid = roundMoney(inv.paidAmount);
    const storedRefunded = roundMoney(inv.refundedAmount);
    const storedOutstanding = roundMoney(inv.outstandingAmount);
    const storedStatus = inv.status;

    const diffs = [];

    if (Math.abs(storedSubtotal - expected.subtotal) > 0.001) {
      diffs.push(`Subtotal mismatch: Stored ₹${storedSubtotal} vs Recomputed ₹${expected.subtotal}`);
    }
    if (Math.abs(storedDiscount - expected.discountAmount) > 0.001) {
      diffs.push(`Discount mismatch: Stored ₹${storedDiscount} vs Recomputed ₹${expected.discountAmount}`);
    }
    if (Math.abs(storedTax - expected.taxAmount) > 0.001) {
      diffs.push(`Tax mismatch: Stored ₹${storedTax} vs Recomputed ₹${expected.taxAmount}`);
    }
    if (Math.abs(storedTotal - expected.totalAmount) > 0.001) {
      diffs.push(`Total mismatch: Stored ₹${storedTotal} vs Recomputed ₹${expected.totalAmount}`);
    }
    if (Math.abs(storedAdjustment - expected.adjustmentAmount) > 0.001) {
      diffs.push(`Adjustment mismatch: Stored ₹${storedAdjustment} vs Recomputed ₹${expected.adjustmentAmount}`);
    }
    if (Math.abs(storedPaid - expected.paidAmount) > 0.001) {
      diffs.push(`Paid Amount mismatch: Stored ₹${storedPaid} vs Recomputed ₹${expected.paidAmount}`);
    }
    if (Math.abs(storedRefunded - expected.refundedAmount) > 0.001) {
      diffs.push(`Refunded Amount mismatch: Stored ₹${storedRefunded} vs Recomputed ₹${expected.refundedAmount}`);
    }
    if (Math.abs(storedOutstanding - expected.outstandingAmount) > 0.001) {
      diffs.push(`Outstanding mismatch: Stored ₹${storedOutstanding} vs Recomputed ₹${expected.outstandingAmount}`);
    }
    if (storedStatus !== expected.status) {
      diffs.push(`Status mismatch: Stored '${storedStatus}' vs Recomputed '${expected.status}'`);
    }

    if (diffs.length > 0) {
      mismatchCount++;
      discrepancies.push({
        invoiceNumber: inv.invoiceNumber,
        patient: `${inv.patient.fullName} (${inv.patient.patientIdNumber})`,
        errors: diffs,
      });
    }
  }

  console.log('---------------------------------------------------------');
  if (mismatchCount === 0) {
    console.log(`✅ Financial Integrity Audit Passed: 100% agreement across all ${checkedCount} invoices, lines, payments, and refunds.`);
    return true;
  } else {
    console.error(`❌ Financial Integrity Audit FAILED: Found ${mismatchCount} invoice discrepancies:`);
    for (const d of discrepancies) {
      console.error(`\n[Invoice #${d.invoiceNumber} - ${d.patient}]`);
      for (const err of d.errors) {
        console.error(`  - ${err}`);
      }
    }
    return false;
  }
}

if (require.main === module) {
  verifyFinancialIntegrity()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Integrity audit encountered an unexpected error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = verifyFinancialIntegrity;
module.exports.verifyFinancialIntegrity = verifyFinancialIntegrity;
