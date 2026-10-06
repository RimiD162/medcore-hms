const { z } = require('zod');

/**
 * Zod Schemas for Pharmacist Workspace Operations
 */

// ── Medicine Catalog Validation ───────────────────────────────
const createMedicineSchema = z.object({
  name: z.string().trim().min(2, 'Medicine name must be at least 2 characters'),
  genericName: z.string().trim().min(2, 'Generic name must be at least 2 characters'),
  brandName: z.string().trim().optional().nullable(),
  category: z.string().trim().min(2, 'Category is required (e.g. Antibiotic, Analgesic)'),
  manufacturer: z.string().trim().min(2, 'Manufacturer name is required'),
  strength: z.string().trim().min(1, 'Strength is required (e.g. 500mg, 10mg/ml)'),
  dosageForm: z.string().trim().min(1, 'Dosage form is required (e.g. Tablet, Capsule, Syrup)'),
  route: z.string().trim().default('Oral'),
  unit: z.string().trim().default('Tablets'),
  sellingPrice: z.number().positive('Selling price must be greater than 0'),
  reorderLevel: z.number().int().nonnegative('Reorder level must be >= 0').default(20),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  description: z.string().trim().optional().nullable(),
});

const updateMedicineSchema = createMedicineSchema.partial();

// ── Batch & Receipt Validation ────────────────────────────────
const createBatchSchema = z.object({
  medicineId: z.string().uuid('Valid medicine ID is required'),
  batchNumber: z.string().trim().min(2, 'Batch number must be at least 2 characters'),
  manufacturer: z.string().trim().optional().nullable(),
  supplier: z.string().trim().optional().nullable(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
  quantityReceived: z.number().int().positive('Quantity received must be greater than 0'),
  purchaseCost: z.number().nonnegative('Purchase cost must be >= 0').optional().nullable(),
  sellingPrice: z.number().positive('Selling price must be > 0').optional().nullable(),
});

const stockReceiptSchema = z.object({
  supplier: z.string().trim().min(2, 'Supplier name is required'),
  invoiceReference: z.string().trim().optional().nullable(),
  receivedDate: z.string().optional(),
  notes: z.string().trim().optional().nullable(),
  items: z.array(
    z.object({
      medicineId: z.string().uuid('Valid medicine ID is required'),
      batchNumber: z.string().trim().min(2, 'Batch number is required'),
      quantityReceived: z.number().int().positive('Quantity must be greater than 0'),
      purchaseCost: z.number().nonnegative().optional().nullable(),
      sellingPrice: z.number().positive().optional().nullable(),
      expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
    })
  ).min(1, 'Receipt must contain at least one medicine item'),
});

// ── Adjustments & Write-Offs ──────────────────────────────────
const stockAdjustmentSchema = z.object({
  batchId: z.string().uuid('Valid batch ID is required'),
  quantityChange: z.number().int().refine((val) => val !== 0, {
    message: 'Quantity change cannot be zero',
  }),
  reason: z.string().trim().min(3, 'Adjustment reason must be at least 3 characters'),
});

const expiryWriteOffSchema = z.object({
  batchId: z.string().uuid('Valid batch ID is required'),
  reason: z.string().trim().min(3, 'Write-off reason is mandatory'),
});

// ── Prescription Review & Mapping ─────────────────────────────
const mapPrescriptionItemSchema = z.object({
  medicineId: z.string().uuid('Valid catalog medicine ID is required'),
  quantityPrescribed: z.number().int().positive('Prescribed quantity must be > 0').optional(),
});

const prescriptionHoldSchema = z.object({
  reason: z.string().trim().min(3, 'Hold reason is mandatory (e.g. Unclear dosage, stock unavailable)'),
});

// ── Dispensing Validation ─────────────────────────────────────
const dispenseItemSchema = z.object({
  prescriptionItemId: z.string().uuid('Valid prescription item ID is required'),
  medicineId: z.string().uuid('Valid medicine ID is required'),
  batchId: z.string().uuid('Valid batch ID is required'),
  quantity: z.number().int().positive('Dispensed quantity must be greater than 0'),
  overrideReason: z.string().trim().optional().nullable(),
});

const createDispensingSchema = z.object({
  prescriptionId: z.string().uuid('Valid prescription ID is required'),
  idempotencyKey: z.string().trim().min(5, 'Idempotency key is required'),
  notes: z.string().trim().optional().nullable(),
  items: z.array(dispenseItemSchema).min(1, 'Dispensing must contain at least one item'),
});

// ── Pharmacist Profile Validation ─────────────────────────────
const updatePharmacistProfileSchema = z.object({
  phone: z.string().trim().optional().nullable(),
  bio: z.string().trim().optional().nullable(),
  shift: z.string().trim().optional(),
  department: z.string().trim().optional(),
});

module.exports = {
  createMedicineSchema,
  updateMedicineSchema,
  createBatchSchema,
  stockReceiptSchema,
  stockAdjustmentSchema,
  expiryWriteOffSchema,
  mapPrescriptionItemSchema,
  prescriptionHoldSchema,
  createDispensingSchema,
  updatePharmacistProfileSchema,
};
