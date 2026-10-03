const { z } = require('zod');

// Time format regex "HH:mm"
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ── 1. Doctor Profile Validation ──────────────────────────────
const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().min(7, 'Phone number must be at least 7 digits').optional(),
  department: z.string().min(2, 'Department is required').optional(),
  specialization: z.string().min(2, 'Specialization is required').optional(),
  licenseNumber: z.string().min(3, 'License number is required').optional(),
  consultationFee: z.number().positive('Consultation fee must be greater than 0').optional(),
  experienceYears: z.number().int().min(0, 'Experience years must be non-negative').optional(),
  qualifications: z.array(z.string()).optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').optional(),
  roomNumber: z.string().optional(),
  status: z.enum(['Available', 'In Consultation', 'On Leave', 'Busy']).optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').optional(),
});

// ── 2. Doctor Availability Validation ─────────────────────────
const availabilityObject = z.object({
  dayOfWeek: z.number().int().min(0).max(6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format (e.g. 09:00)'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format (e.g. 17:00)'),
  breakStartTime: z.string().regex(timeRegex, 'Break start time must be in HH:mm format').nullable().optional(),
  breakEndTime: z.string().regex(timeRegex, 'Break end time must be in HH:mm format').nullable().optional(),
  consultationDuration: z.number().int().min(5, 'Consultation duration must be at least 5 minutes').max(120, 'Duration cannot exceed 120 minutes').default(15),
  isActive: z.boolean().default(true),
});

const availabilitySchema = availabilityObject
  .refine(
    (data) => {
      const start = data.startTime.replace(':', '');
      const end = data.endTime.replace(':', '');
      return parseInt(end, 10) > parseInt(start, 10);
    },
    {
      message: 'End time must be later than start time',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      if (!data.breakStartTime || !data.breakEndTime) return true;
      const bStart = parseInt(data.breakStartTime.replace(':', ''), 10);
      const bEnd = parseInt(data.breakEndTime.replace(':', ''), 10);
      return bEnd > bStart;
    },
    {
      message: 'Break end time must be later than break start time',
      path: ['breakEndTime'],
    }
  )
  .refine(
    (data) => {
      if (!data.breakStartTime || !data.breakEndTime) return true;
      const start = parseInt(data.startTime.replace(':', ''), 10);
      const end = parseInt(data.endTime.replace(':', ''), 10);
      const bStart = parseInt(data.breakStartTime.replace(':', ''), 10);
      const bEnd = parseInt(data.breakEndTime.replace(':', ''), 10);
      return bStart >= start && bEnd <= end;
    },
    {
      message: 'Break interval must be within working hours (startTime and endTime)',
      path: ['breakStartTime'],
    }
  );

const updateAvailabilitySchema = availabilityObject.partial();

// ── 3. Appointment Transition & Action Schemas ─────────────────
const updateAppointmentStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], {
    errorMap: () => ({ message: 'Invalid appointment status' }),
  }),
  cancelReason: z.string().min(3, 'Cancellation reason must be at least 3 characters').optional(),
});

const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid appointment date required (YYYY-MM-DD)',
  }),
  appointmentTime: z.string().regex(timeRegex, 'Appointment time must be in HH:mm format'),
});

// ── 4. Consultation Schemas ───────────────────────────────────
const vitalsSchema = z.object({
  bp: z.string().regex(/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be in format like 120/80').optional().or(z.literal('')),
  heartRate: z.number().int().min(30).max(250).optional().nullable(),
  temp: z.number().min(90).max(110).optional().nullable(),
  spo2: z.number().int().min(50).max(100).optional().nullable(),
  weight: z.number().positive().max(300).optional().nullable(),
  height: z.number().positive().max(250).optional().nullable(),
  bmi: z.number().positive().optional().nullable(),
}).optional();

const saveConsultationDraftSchema = z.object({
  appointmentId: z.string().uuid('Valid appointment UUID required'),
  chiefComplaint: z.string().optional().nullable(),
  symptoms: z.array(z.string()).default([]),
  vitals: vitalsSchema,
  clinicalNotes: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  treatmentPlan: z.string().optional().nullable(),
  doctorNotes: z.string().optional().nullable(),
});

const completeConsultationSchema = z.object({
  chiefComplaint: z.string().min(2, 'Chief complaint is required for completing consultation'),
  symptoms: z.array(z.string()).min(1, 'At least one symptom is required'),
  vitals: vitalsSchema,
  clinicalNotes: z.string().min(5, 'Clinical notes are required'),
  diagnosis: z.string().min(2, 'Diagnosis is required'),
  treatmentPlan: z.string().min(2, 'Treatment plan is required'),
  doctorNotes: z.string().optional().nullable(),
  followUp: z.object({
    followUpDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid follow-up date required (YYYY-MM-DD)',
    }),
    reason: z.string().min(2, 'Follow-up reason is required'),
    notes: z.string().optional().nullable(),
  }).optional().nullable(),
});

// ── 5. Prescription Item & Builder Schemas ────────────────────
const prescriptionItemSchema = z.object({
  medicineName: z.string().min(2, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g. 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g. 1-0-1)'),
  duration: z.string().min(1, 'Duration is required (e.g. 5 Days)'),
  route: z.string().default('Oral'),
  instructions: z.string().optional().nullable(),
});

const createPrescriptionSchema = z.object({
  patientId: z.string().uuid('Valid patient UUID required'),
  consultationId: z.string().uuid('Valid consultation UUID').optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one prescription medicine item is required'),
});

// ── 6. Lab Report Order & Review Schemas ───────────────────────
const orderLabReportSchema = z.object({
  patientId: z.string().uuid('Valid patient UUID required'),
  testName: z.string().min(2, 'Test name is required'),
  category: z.string().default('Clinical Pathology'),
  doctorNotes: z.string().optional().nullable(),
});

const reviewLabReportSchema = z.object({
  doctorNotes: z.string().min(2, 'Clinical review interpretation is required'),
});

// ── 7. Follow-Up Creation Schema ──────────────────────────────
const createFollowUpSchema = z.object({
  patientId: z.string().uuid('Valid patient UUID required'),
  followUpDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid follow-up date required (YYYY-MM-DD)',
  }),
  reason: z.string().min(2, 'Follow-up reason is required'),
  notes: z.string().optional().nullable(),
});

const updateConsultationDraftSchema = saveConsultationDraftSchema.partial();

module.exports = {
  updateProfileSchema,
  availabilitySchema,
  updateAvailabilitySchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
  saveConsultationDraftSchema,
  updateConsultationDraftSchema,
  completeConsultationSchema,
  createPrescriptionSchema,
  orderLabReportSchema,
  reviewLabReportSchema,
  createFollowUpSchema,
};
