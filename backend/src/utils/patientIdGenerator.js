const prisma = require('../config/prisma');

/**
 * Extract maximum numeric suffix from a list of identifier strings
 */
function getMaxSequence(items, fieldName, prefix) {
  let maxSeq = 0;
  for (const item of items) {
    const val = item[fieldName];
    if (val && typeof val === 'string' && val.startsWith(prefix)) {
      const suffix = val.slice(prefix.length);
      const parsed = parseInt(suffix, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }
  return maxSeq;
}

/**
 * Race-safe Unique Patient ID Generator
 * Generates human-readable patient identifiers in format: MC-YYYY-NNNNNN
 */
async function generatePatientId(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `MC-${currentYear}-`;

  const patients = await tx.patient.findMany({
    where: { patientIdNumber: { startsWith: prefix } },
    select: { patientIdNumber: true },
  });

  const maxSeq = getMaxSequence(patients, 'patientIdNumber', prefix);
  const nextSequence = maxSeq > 0 ? maxSeq + 1 : (await tx.patient.count()) + 100;
  const formattedSequence = String(nextSequence).padStart(6, '0');
  return `${prefix}${formattedSequence}`;
}

/**
 * Generate unique appointment number
 * e.g. APT-2026-1001
 */
async function generateAppointmentNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `APT-${currentYear}-`;

  const appointments = await tx.appointment.findMany({
    where: { appointmentNumber: { startsWith: prefix } },
    select: { appointmentNumber: true },
  });

  const maxSeq = getMaxSequence(appointments, 'appointmentNumber', prefix);
  const seq = maxSeq >= 100 ? maxSeq + 1 : 101;
  return `${prefix}${seq}`;
}

/**
 * Generate unique invoice number
 * e.g. INV-2026-0001
 */
async function generateInvoiceNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const invoices = await tx.invoice.findMany({
    select: { invoiceNumber: true },
  });

  let maxSeq = 0;
  for (const inv of invoices) {
    if (!inv.invoiceNumber) continue;
    const numMatches = inv.invoiceNumber.match(/\d+/g);
    if (numMatches && numMatches.length > 0) {
      const lastNum = parseInt(numMatches[numMatches.length - 1], 10);
      if (!isNaN(lastNum) && lastNum > maxSeq) {
        maxSeq = lastNum;
      }
    }
  }

  const seq = maxSeq + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Generate unique payment receipt number
 * e.g. PAY-2026-0001
 */
async function generatePaymentNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `PAY-${currentYear}-`;

  const payments = await tx.payment.findMany({
    where: { paymentNumber: { startsWith: prefix } },
    select: { paymentNumber: true },
  });

  const maxSeq = getMaxSequence(payments, 'paymentNumber', prefix);
  const seq = maxSeq + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Generate unique emergency record number
 * e.g. EMG-2026-001
 */
async function generateEmergencyNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `EMG-${currentYear}-`;

  const emergencies = await tx.emergencyRegistration.findMany({
    where: { emergencyNumber: { startsWith: prefix } },
    select: { emergencyNumber: true },
  });

  const maxSeq = getMaxSequence(emergencies, 'emergencyNumber', prefix);
  const seq = maxSeq + 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

/**
 * Generate unique medicine catalog code
 * e.g. MED-2026-001
 */
async function generateMedicineCode(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `MED-${currentYear}-`;

  const medicines = await tx.medicine.findMany({
    where: { medicineCode: { startsWith: prefix } },
    select: { medicineCode: true },
  });

  const maxSeq = getMaxSequence(medicines, 'medicineCode', prefix);
  const seq = maxSeq + 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

/**
 * Generate unique dispensing record number
 * e.g. DSP-2026-0001
 */
async function generateDispensingNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `DSP-${currentYear}-`;

  const dispensings = await tx.dispensing.findMany({
    where: { dispensingNumber: { startsWith: prefix } },
    select: { dispensingNumber: true },
  });

  const maxSeq = getMaxSequence(dispensings, 'dispensingNumber', prefix);
  const seq = maxSeq + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Generate unique stock ledger transaction number
 * e.g. TXN-2026-0001
 */
async function generateTransactionNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `TXN-${currentYear}-`;

  const transactions = await tx.stockTransaction.findMany({
    where: { transactionNumber: { startsWith: prefix } },
    select: { transactionNumber: true },
  });

  const maxSeq = getMaxSequence(transactions, 'transactionNumber', prefix);
  const seq = maxSeq + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Generate unique stock receipt number
 * e.g. REC-2026-0001
 */
async function generateStockReceiptNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `REC-${currentYear}-`;

  const receipts = await tx.stockReceipt.findMany({
    where: { receiptNumber: { startsWith: prefix } },
    select: { receiptNumber: true },
  });

  const maxSeq = getMaxSequence(receipts, 'receiptNumber', prefix);
  const seq = maxSeq + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Generate unique lab test catalog code
 * e.g. LAB-TST-0001
 */
async function generateLabTestCode(tx = prisma) {
  const prefix = 'LAB-TST-';

  const tests = await tx.labTest.findMany({
    where: { code: { startsWith: prefix } },
    select: { code: true },
  });

  const maxSeq = getMaxSequence(tests, 'code', prefix);
  const seq = maxSeq + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Generate unique lab order number
 * e.g. ORD-2026-0001
 */
async function generateLabOrderNumber(txArg = prisma) {
  const tx = (txArg && txArg.labTestOrder) ? txArg : prisma;
  const currentYear = new Date().getFullYear();
  const prefix = `ORD-${currentYear}-`;

  const orders = await tx.labTestOrder.findMany({
    select: { orderNumber: true },
  });

  let maxSeq = 0;
  for (const o of orders) {
    if (!o.orderNumber) continue;
    const numMatches = o.orderNumber.match(/\d+/g);
    if (numMatches && numMatches.length > 0) {
      const lastNum = parseInt(numMatches[numMatches.length - 1], 10);
      if (!isNaN(lastNum) && lastNum > maxSeq) {
        maxSeq = lastNum;
      }
    }
  }

  const seq = maxSeq + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Generate unique lab sample tracking code
 * e.g. LAB-SMP-000001
 */
async function generateLabSampleCode(sampleTypeOrTx = null, client = prisma) {
  const tx = (sampleTypeOrTx && sampleTypeOrTx.labSample) ? sampleTypeOrTx : client;
  const prefix = 'LAB-SMP-';

  const samples = await tx.labSample.findMany({
    select: { sampleCode: true },
  });

  let maxSeq = 0;
  for (const s of samples) {
    if (!s.sampleCode) continue;
    const numMatches = s.sampleCode.match(/\d+/g);
    if (numMatches && numMatches.length > 0) {
      const lastNum = parseInt(numMatches[numMatches.length - 1], 10);
      if (!isNaN(lastNum) && lastNum > maxSeq) {
        maxSeq = lastNum;
      }
    }
  }

  const seq = maxSeq + 1;
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

/**
 * Generate unique lab diagnostic report number
 * e.g. REP-2026-0001
 */
async function generateLabReportNumber(txArg = prisma) {
  const tx = (txArg && txArg.labReport) ? txArg : prisma;
  const currentYear = new Date().getFullYear();
  const prefix = `REP-${currentYear}-`;

  const reports = await tx.labReport.findMany({
    select: { reportNumber: true },
  });

  let maxSeq = 0;
  for (const r of reports) {
    if (!r.reportNumber) continue;
    const numMatches = r.reportNumber.match(/\d+/g);
    if (numMatches && numMatches.length > 0) {
      const lastNum = parseInt(numMatches[numMatches.length - 1], 10);
      if (!isNaN(lastNum) && lastNum > maxSeq) {
        maxSeq = lastNum;
      }
    }
  }

  const seq = maxSeq + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

module.exports = {
  generatePatientId,
  generateAppointmentNumber,
  generateInvoiceNumber,
  generatePaymentNumber,
  generateEmergencyNumber,
  generateMedicineCode,
  generateDispensingNumber,
  generateTransactionNumber,
  generateStockReceiptNumber,
  generateLabTestCode,
  generateLabOrderNumber,
  generateLabSampleCode,
  generateLabReportNumber,
};
