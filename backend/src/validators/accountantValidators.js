const { z } = require('zod');
const { INVOICE_TYPES, SERVICE_TYPES, PAYMENT_METHODS, EXPENSE_CATEGORIES, ADJUSTMENT_TYPES, REFUND_METHODS } = require('../config/billingConfig');

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  serviceType: z.enum([
    'CONSULTATION',
    'PROCEDURE',
    'PHARMACY',
    'LABORATORY',
    'ROOM_RENT',
    'NURSING_CARE',
    'EQUIPMENT',
    'OTHER',
  ]).default('OTHER'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  discount: z.number().min(0, 'Discount must be non-negative').default(0),
  taxRate: z.number().min(0, 'Tax rate must be non-negative').default(0),
  serviceId: z.string().optional().nullable(),
});

const createInvoiceSchema = z.object({
  patientId: z.string().uuid('Valid patient ID is required'),
  appointmentId: z.string().uuid('Valid appointment ID').optional().nullable(),
  type: z.enum([
    'STANDARD',
    'EMERGENCY',
    'IPD',
    'OPD',
    'PHARMACY',
    'LABORATORY',
    'PROCEDURE',
    'MISCELLANEOUS',
  ]).default('STANDARD'),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required'),
});

const cancelInvoiceSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters'),
});

const recordPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'INSURANCE', 'NET_BANKING', 'OTHER']).default('CASH'),
  transactionRef: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  paymentDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
  idempotencyKey: z.string().max(100).optional().nullable(),
});

const voidPaymentSchema = z.object({
  reason: z.string().min(3, 'Void reason must be at least 3 characters'),
});

const createAdjustmentSchema = z.object({
  adjustmentType: z.enum([
    'CREDIT_NOTE',
    'DEBIT_NOTE',
    'DISCOUNT_CORRECTION',
    'WRITE_OFF',
    'PRICE_CORRECTION',
  ]),
  amount: z.number().positive('Adjustment amount must be greater than zero'),
  reason: z.string().min(3, 'Adjustment reason must be at least 3 characters'),
});

const requestRefundSchema = z.object({
  amount: z.number().positive('Refund amount must be greater than zero'),
  reason: z.string().min(3, 'Refund reason must be at least 3 characters'),
  refundMethod: z.enum([
    'CASH',
    'CARD',
    'UPI',
    'BANK_TRANSFER',
    'ORIGINAL_PAYMENT_METHOD',
    'OTHER',
  ]).default('CASH'),
});

const approveRefundSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});

const processRefundSchema = z.object({
  refundMethod: z.enum([
    'CASH',
    'CARD',
    'UPI',
    'BANK_TRANSFER',
    'ORIGINAL_PAYMENT_METHOD',
    'OTHER',
  ]).default('CASH'),
  transactionRef: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

const rejectRefundSchema = z.object({
  rejectionReason: z.string().min(3, 'Rejection reason must be at least 3 characters'),
});

const createExpenseSchema = z.object({
  title: z.string().min(2, 'Expense title must be at least 2 characters'),
  category: z.enum([
    'MEDICAL_SUPPLIES',
    'PHARMACY_INVENTORY',
    'LAB_REAGENTS',
    'UTILITIES',
    'SALARIES',
    'MAINTENANCE',
    'EQUIPMENT_LEASE',
    'ADMINISTRATIVE',
    'MARKETING',
    'OTHER',
  ]),
  amount: z.number().positive('Expense amount must be greater than zero'),
  taxAmount: z.number().min(0, 'Tax amount cannot be negative').default(0).optional(),
  expenseDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
  vendorName: z.string().max(150).optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  confirmDuplicate: z.boolean().default(false).optional(),
});

const cancelExpenseSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters'),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().max(20).optional().nullable(),
  qualification: z.string().max(100).optional().nullable(),
});

module.exports = {
  createInvoiceSchema,
  cancelInvoiceSchema,
  recordPaymentSchema,
  voidPaymentSchema,
  createAdjustmentSchema,
  requestRefundSchema,
  approveRefundSchema,
  processRefundSchema,
  rejectRefundSchema,
  createExpenseSchema,
  cancelExpenseSchema,
  updateProfileSchema,
};
