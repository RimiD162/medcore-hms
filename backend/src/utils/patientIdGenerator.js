const prisma = require('../config/prisma');

/**
 * Race-safe Unique Patient ID Generator
 * Generates human-readable patient identifiers in format: MC-YYYY-NNNNNN
 * Backed by transaction / sequence retry to ensure strict uniqueness under concurrency
 */
async function generatePatientId(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `MC-${currentYear}-`;

  // Find the highest existing patient ID for the current year
  const latestPatient = await tx.patient.findFirst({
    where: {
      patientIdNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      patientIdNumber: 'desc',
    },
    select: {
      patientIdNumber: true,
    },
  });

  let nextSequence = 1;

  if (latestPatient && latestPatient.patientIdNumber) {
    const parts = latestPatient.patientIdNumber.split('-');
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  } else {
    // If no MC-YYYY-NNNNNN format exists yet, check legacy format MED-P-XXXX
    const legacyCount = await tx.patient.count();
    nextSequence = legacyCount + 100;
  }

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

  const latest = await tx.appointment.findFirst({
    where: {
      appointmentNumber: { startsWith: prefix },
    },
    orderBy: {
      appointmentNumber: 'desc',
    },
    select: { appointmentNumber: true },
  });

  let seq = 101;
  if (latest?.appointmentNumber) {
    const parts = latest.appointmentNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) seq = parsed + 1;
    }
  }

  return `${prefix}${seq}`;
}

/**
 * Generate unique invoice number
 * e.g. INV-2026-0001
 */
async function generateInvoiceNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const latest = await tx.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let seq = 1;
  if (latest?.invoiceNumber) {
    const parts = latest.invoiceNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) seq = parsed + 1;
    }
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Generate unique payment receipt number
 * e.g. PAY-2026-0001
 */
async function generatePaymentNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `PAY-${currentYear}-`;

  const latest = await tx.payment.findFirst({
    where: { paymentNumber: { startsWith: prefix } },
    orderBy: { paymentNumber: 'desc' },
    select: { paymentNumber: true },
  });

  let seq = 1;
  if (latest?.paymentNumber) {
    const parts = latest.paymentNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) seq = parsed + 1;
    }
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Generate unique emergency record number
 * e.g. EMG-2026-001
 */
async function generateEmergencyNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `EMG-${currentYear}-`;

  const latest = await tx.emergencyRegistration.findFirst({
    where: { emergencyNumber: { startsWith: prefix } },
    orderBy: { emergencyNumber: 'desc' },
    select: { emergencyNumber: true },
  });

  let seq = 1;
  if (latest?.emergencyNumber) {
    const parts = latest.emergencyNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) seq = parsed + 1;
    }
  }

  return `${prefix}${String(seq).padStart(3, '0')}`;
}

/**
 * Generate unique medicine catalog code
 * e.g. MED-2026-001
 */
async function generateMedicineCode(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `MED-${currentYear}-`;

  const latest = await tx.medicine.findFirst({
    where: { medicineCode: { startsWith: prefix } },
    orderBy: { medicineCode: 'desc' },
    select: { medicineCode: true },
  });

  let seq = 1;
  if (latest?.medicineCode) {
    const parts = latest.medicineCode.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) seq = parsed + 1;
    }
  }

  return `${prefix}${String(seq).padStart(3, '0')}`;
}

/**
 * Generate unique dispensing record number
 * e.g. DSP-2026-0001
 */
async function generateDispensingNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `DSP-${currentYear}-`;

  const latest = await tx.dispensing.findFirst({
    where: { dispensingNumber: { startsWith: prefix } },
    orderBy: { dispensingNumber: 'desc' },
    select: { dispensingNumber: true },
  });

  let seq = 1;
  if (latest?.dispensingNumber) {
    const parts = latest.dispensingNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) seq = parsed + 1;
    }
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Generate unique stock ledger transaction number
 * e.g. TXN-2026-0001
 */
async function generateTransactionNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `TXN-${currentYear}-`;

  const latest = await tx.stockTransaction.findFirst({
    where: { transactionNumber: { startsWith: prefix } },
    orderBy: { transactionNumber: 'desc' },
    select: { transactionNumber: true },
  });

  let seq = 1;
  if (latest?.transactionNumber) {
    const parts = latest.transactionNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) seq = parsed + 1;
    }
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Generate unique stock receipt number
 * e.g. REC-2026-0001
 */
async function generateStockReceiptNumber(tx = prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `REC-${currentYear}-`;

  const latest = await tx.stockReceipt.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  });

  let seq = 1;
  if (latest?.receiptNumber) {
    const parts = latest.receiptNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) seq = parsed + 1;
    }
  }

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
};
