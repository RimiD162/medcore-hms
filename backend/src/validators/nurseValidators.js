const { z } = require('zod');

// ── Vital Signs Validation ────────────────────────────────────
const baseVitalSignsObject = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  bloodPressure: z
    .string()
    .regex(/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be formatted as Systolic/Diastolic (e.g. 120/80)'),
  temperature: z
    .number({ invalid_type_error: 'Temperature must be a number' })
    .min(70.0, 'Temperature is physiologically impossible (< 70°F)')
    .max(115.0, 'Temperature is physiologically impossible (> 115°F)'),
  pulse: z
    .number({ invalid_type_error: 'Pulse must be an integer' })
    .int()
    .min(20, 'Pulse rate is physiologically impossible (< 20 bpm)')
    .max(300, 'Pulse rate is physiologically impossible (> 300 bpm)'),
  respiratoryRate: z
    .number({ invalid_type_error: 'Respiratory rate must be an integer' })
    .int()
    .min(4, 'Respiratory rate is physiologically impossible (< 4 bpm)')
    .max(80, 'Respiratory rate is physiologically impossible (> 80 bpm)'),
  oxygenSaturation: z
    .number({ invalid_type_error: 'Oxygen saturation must be an integer' })
    .int()
    .min(50, 'SpO2 is physiologically impossible (< 50%)')
    .max(100, 'SpO2 cannot exceed 100%'),
  weight: z.number().min(1).max(500).optional().nullable(),
  height: z.number().min(30).max(300).optional().nullable(),
  observation: z.string().max(1000).optional().nullable(),
  recordedAt: z.string().datetime().optional().nullable(),
});

const vitalSignsSchema = baseVitalSignsObject.refine(
  (data) => {
    if (!data.bloodPressure) return true;
    const parts = data.bloodPressure.split('/');
    const sys = parseInt(parts[0], 10);
    const dia = parseInt(parts[1], 10);
    return sys >= 40 && sys <= 280 && dia >= 20 && dia <= 180 && sys > dia;
  },
  {
    message: 'Systolic blood pressure (40-280) must be strictly greater than diastolic (20-180)',
    path: ['bloodPressure'],
  }
);

const updateVitalSignSchema = baseVitalSignsObject
  .partial()
  .omit({ patientId: true })
  .refine(
    (data) => {
      if (!data.bloodPressure) return true;
      const parts = data.bloodPressure.split('/');
      const sys = parseInt(parts[0], 10);
      const dia = parseInt(parts[1], 10);
      return sys >= 40 && sys <= 280 && dia >= 20 && dia <= 180 && sys > dia;
    },
    {
      message: 'Systolic blood pressure (40-280) must be strictly greater than diastolic (20-180)',
      path: ['bloodPressure'],
    }
  );

// ── Nursing Notes Validation ──────────────────────────────────
const nursingNoteSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  shift: z.string().max(100).optional().nullable(),
  observation: z.string().min(3, 'Observation must contain at least 3 characters').max(2000),
  careProvided: z.string().min(3, 'Care provided must contain at least 3 characters').max(2000),
  patientResponse: z.string().min(3, 'Patient response must contain at least 3 characters').max(2000),
  additionalNotes: z.string().max(1000).optional().nullable(),
  isFlagged: z.boolean().optional().default(false),
});

// ── Medication Administration Validation ──────────────────────
const administerMedicationSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});

const holdMedicationSchema = z.object({
  reason: z.string().min(3, 'A clinical reason must be provided when holding medication').max(500),
  notes: z.string().max(500).optional().nullable(),
});

const missMedicationSchema = z.object({
  reason: z.string().min(3, 'A clinical reason must be provided when marking medication as missed').max(500),
  notes: z.string().max(500).optional().nullable(),
});

// ── Nurse Profile Validation ──────────────────────────────────
const updateNurseProfileSchema = z
  .object({
    phone: z.string().min(6).max(20).optional().nullable(),
    bio: z.string().max(1000).optional().nullable(),
    shift: z.string().max(100).optional(),
    role: z.any().optional(), // Used to verify role immutability
  })
  .refine((data) => !data.role || data.role === 'NURSE', {
    message: 'Unauthorized: Changing user role or administrative permissions is not permitted',
    path: ['role'],
  });

module.exports = {
  vitalSignsSchema,
  updateVitalSignSchema,
  nursingNoteSchema,
  administerMedicationSchema,
  holdMedicationSchema,
  missMedicationSchema,
  updateNurseProfileSchema,
};
