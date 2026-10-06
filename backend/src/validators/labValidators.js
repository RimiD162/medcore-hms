const { z } = require('zod');

const sampleTypeEnum = z.enum([
  'BLOOD',
  'SERUM',
  'PLASMA',
  'URINE',
  'STOOL',
  'SPUTUM',
  'SWAB',
  'CSF',
  'TISSUE',
  'OTHER',
]);

const orderPriorityEnum = z.enum(['ROUTINE', 'URGENT', 'STAT']);

const resultTypeEnum = z.enum([
  'NUMERIC',
  'TEXT',
  'POSITIVE_NEGATIVE',
  'QUALITATIVE',
]);

// ── Parameter Definition Schema ────────────────────────────────
const rawLabParameterSchema = z.object({
  id: z.string().optional(),
  parameterName: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  parameterCode: z.string().optional().nullable(),
  parameterType: z.string().optional(),
  resultType: resultTypeEnum.optional(),
  unit: z.string().max(50).nullable().optional(),
  displayOrder: z.coerce.number().int().min(1).default(1),
  minRange: z.coerce.number().nullable().optional(),
  maxRange: z.coerce.number().nullable().optional(),
  low: z.coerce.number().nullable().optional(),
  high: z.coerce.number().nullable().optional(),
  criticalLow: z.coerce.number().nullable().optional(),
  criticalHigh: z.coerce.number().nullable().optional(),
  targetValue: z.string().nullable().optional(),
  isMandatory: z.boolean().default(true),
  allowedOptions: z.array(z.string()).optional(),
});

const labParameterSchema = rawLabParameterSchema.transform((data) => ({
  ...data,
  parameterName: data.parameterName || data.name || 'Parameter',
  minRange: data.minRange !== undefined ? data.minRange : data.low,
  maxRange: data.maxRange !== undefined ? data.maxRange : data.high,
}));

// ── Test Catalog Schemas ──────────────────────────────────────
const rawCreateLabTestSchema = z.object({
  testCode: z.string().min(2).max(50).optional(),
  code: z.string().min(2).max(50).optional(),
  testName: z.string().min(2).max(150).optional(),
  name: z.string().min(2).max(150).optional(),
  category: z.string().min(2, 'Category is required').max(100),
  department: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  instructions: z.string().max(500).optional().nullable(),
  sampleType: sampleTypeEnum.default('BLOOD'),
  containerType: z.string().max(50).optional().nullable(),
  minSampleVolume: z.string().max(50).optional().nullable(),
  sampleVolume: z.string().max(50).optional().nullable(),
  turnaroundTimeMinutes: z.coerce.number().int().min(1).default(60),
  processingTime: z.coerce.number().int().min(1).optional(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  fastingRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
  parameters: z.array(rawLabParameterSchema).optional().default([]),
});

const createLabTestSchema = rawCreateLabTestSchema.transform((data) => ({
  ...data,
  testName: data.testName || data.name || 'Unnamed Test',
  testCode: data.testCode || data.code,
  turnaroundTimeMinutes: data.turnaroundTimeMinutes || data.processingTime || 60,
  minSampleVolume: data.minSampleVolume || data.sampleVolume || '1.0 mL',
}));

const updateLabTestSchema = rawCreateLabTestSchema.partial().transform((data) => ({
  ...data,
  testName: data.testName || data.name,
  testCode: data.testCode || data.code,
  turnaroundTimeMinutes: data.turnaroundTimeMinutes || data.processingTime,
  minSampleVolume: data.minSampleVolume || data.sampleVolume,
}));

// ── Order Creation Schema ─────────────────────────────────────
const rawCreateLabOrderSchema = z.object({
  patientId: z.string().uuid('Valid patient ID is required'),
  testIds: z.array(z.string().uuid()).optional(),
  items: z.array(z.union([z.string(), z.object({ testId: z.string(), notes: z.string().optional() })])).optional(),
  testId: z.string().uuid().optional(),
  priority: orderPriorityEnum.default('ROUTINE'),
  clinicalNotes: z.string().max(500).optional().nullable(),
  clinicalIndication: z.string().max(500).optional().nullable(),
  fastingStatus: z.string().optional().nullable(),
  consultationId: z.string().uuid().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable(),
});

const createLabOrderSchema = rawCreateLabOrderSchema.transform((data) => ({
  ...data,
  clinicalNotes: data.clinicalNotes || data.clinicalIndication,
  testIds: data.testIds || (data.testId ? [data.testId] : undefined),
}));

// ── Sample Collection & Processing Schemas ────────────────────
const rawCollectSampleSchema = z.object({
  confirmPatientId: z.boolean().or(z.string()).optional(),
  patientConfirmation: z.string().optional(),
  patientIdNumber: z.string().optional().nullable(),
  sampleCondition: z.string().max(100).optional().nullable(),
  collectionNotes: z.string().max(500).optional().nullable(),
  storageLocation: z.string().max(100).optional().nullable(),
  volumeCollected: z.string().max(50).optional().nullable(),
});

const collectSampleSchema = rawCollectSampleSchema.transform((data) => ({
  ...data,
  confirmPatientId: data.confirmPatientId === true || data.confirmPatientId === 'true' || Boolean(data.patientConfirmation),
}));

const rawReceiveSampleSchema = z.object({
  storageLocation: z.string().max(100).optional().nullable(),
  conditionNotes: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

const receiveSampleSchema = rawReceiveSampleSchema.transform((data) => ({
  ...data,
  conditionNotes: data.conditionNotes || data.notes,
}));

const rawRejectSampleSchema = z.object({
  rejectionReason: z.string().min(3).optional(),
  reason: z.string().min(3).optional(),
  rejectionNotes: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  requestRecollection: z.boolean().default(false),
}).refine(
  (data) => Boolean((data.rejectionReason && data.rejectionReason.length >= 3) || (data.reason && data.reason.length >= 3)),
  { message: 'A structured rejection reason is required (minimum 3 characters)' }
);

const rejectSampleSchema = rawRejectSampleSchema.transform((data) => ({
  ...data,
  rejectionReason: data.rejectionReason || data.reason,
  rejectionNotes: data.rejectionNotes || data.notes,
}));

// ── Result Entry, Correction, Verification Schemas ────────────
const resultParameterValueInputSchema = z.object({
  parameterId: z.string(),
  numericValue: z.coerce.number().nullable().optional(),
  textValue: z.string().max(500).nullable().optional(),
  remarks: z.string().max(500).nullable().optional(),
});

const rawEnterResultSchema = z.object({
  values: z.array(resultParameterValueInputSchema).optional(),
  parameterValues: z.array(resultParameterValueInputSchema).optional(),
  technicalNotes: z.string().max(500).optional().nullable(),
  equipmentUsed: z.string().max(100).optional().nullable(),
});

const enterResultSchema = rawEnterResultSchema.transform((data) => ({
  ...data,
  values: data.values || data.parameterValues || [],
}));

const rawCorrectResultSchema = z.object({
  reason: z.string().min(3, 'Formal correction reason is required (minimum 3 characters)').max(500),
  values: z.array(resultParameterValueInputSchema).optional(),
  parameterValues: z.array(resultParameterValueInputSchema).optional(),
  technicalNotes: z.string().max(500).optional().nullable(),
});

const correctResultSchema = rawCorrectResultSchema.transform((data) => ({
  ...data,
  values: data.values || data.parameterValues || [],
}));

const rawVerifyReportSchema = z.object({
  summary: z.string().max(1000).optional().nullable(),
  technicalNotes: z.string().max(1000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  criticalNotes: z.string().max(1000).optional().nullable(),
  criticalNotifiedTo: z.string().max(200).optional().nullable(),
  bypassSeparateVerifierCheck: z.boolean().optional().default(false),
});

const verifyReportSchema = rawVerifyReportSchema.transform((data) => ({
  ...data,
  technicalNotes: data.technicalNotes || data.notes,
}));

// ── Profile Update Schema ─────────────────────────────────────
const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().max(20).optional().nullable(),
  department: z.string().max(100).optional(),
  specialization: z.string().max(150).optional(),
  certifications: z.string().max(500).optional().nullable(),
  shiftSchedule: z.string().max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
});

module.exports = {
  sampleTypeEnum,
  orderPriorityEnum,
  resultTypeEnum,
  labParameterSchema,
  createLabTestSchema,
  updateLabTestSchema,
  createLabOrderSchema,
  collectSampleSchema,
  receiveSampleSchema,
  rejectSampleSchema,
  resultParameterValueInputSchema,
  enterResultSchema,
  correctResultSchema,
  verifyReportSchema,
  updateProfileSchema,
};
