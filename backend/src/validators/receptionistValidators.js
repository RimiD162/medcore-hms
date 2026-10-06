const { z } = require('zod');

// ── Patient Registration Schema ───────────────────────────────
const registerPatientSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid date of birth required (YYYY-MM-DD)',
  }),
  gender: z.enum(['Male', 'Female', 'Other'], {
    errorMap: () => ({ message: "Gender must be 'Male', 'Female', or 'Other'" }),
  }),
  phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().max(250).optional().nullable().or(z.literal('')),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().nullable().or(z.literal('')),
  emergencyContact: z.string().max(100).optional().nullable().or(z.literal('')),
  emergencyPhone: z.string().max(20).optional().nullable().or(z.literal('')),
  allergies: z.array(z.string()).optional().default([]),
  chronicConditions: z.array(z.string()).optional().default([]),
  registrationSource: z.enum(['Standard', 'Emergency', 'Referral']).optional().default('Standard'),
  allowDuplicate: z.boolean().optional().default(false),
});

// ── Patient Search / Filter Schema ────────────────────────────
const patientQuerySchema = z.object({
  search: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  registrationDate: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('20'),
  sortBy: z.enum(['fullName', 'createdAt', 'patientIdNumber']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ── Appointment Booking Schema ────────────────────────────────
const bookAppointmentSchema = z.object({
  patientId: z.string().uuid('Valid patient ID required'),
  doctorId: z.string().uuid('Valid doctor profile ID required'),
  appointmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid appointment date required (YYYY-MM-DD)',
  }),
  appointmentTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  type: z.enum(['General', 'Follow-up', 'Emergency', 'Routine']).default('General'),
  reason: z.string().min(2, 'Reason must be at least 2 characters').max(500),
});

// ── Appointment Reschedule Schema ─────────────────────────────
const rescheduleAppointmentSchema = z.object({
  newDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid new date required (YYYY-MM-DD)',
  }),
  newTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
});

// ── Appointment Cancellation Schema ───────────────────────────
const cancelAppointmentSchema = z.object({
  cancelReason: z.string().min(3, 'Cancellation reason must be at least 3 characters').max(500),
});

// ── Service Invoice Creation Schema ───────────────────────────
const createInvoiceSchema = z.object({
  patientId: z.string().uuid('Valid patient ID required'),
  appointmentId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  discountAmount: z.number().min(0).optional().default(0),
  items: z.array(
    z.object({
      serviceCatalogId: z.string().uuid().optional().nullable(),
      serviceName: z.string().min(1, 'Service name required'),
      category: z.string().optional().default('General'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
    })
  ).min(1, 'At least one service item is required to generate an invoice'),
});

// ── Payment Recording Schema ──────────────────────────────────
const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid('Valid invoice ID required'),
  patientId: z.string().uuid('Valid patient ID required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'], {
    errorMap: () => ({ message: "Payment method must be 'CASH', 'CARD', 'UPI', or 'BANK_TRANSFER'" }),
  }),
  referenceNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
});

// ── Fast-Path Emergency Registration Schema ───────────────────
const createEmergencySchema = z.object({
  patientName: z.string().min(2, 'Patient name or identification placeholder required'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
  reason: z.string().min(3, 'Emergency clinical reason or presenting condition required'),
  gender: z.enum(['Male', 'Female', 'Other']).optional().default('Other'),
  age: z.number().int().min(0).max(130).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  emergencyContact: z.string().max(100).optional().nullable(),
  emergencyPhone: z.string().max(20).optional().nullable(),
  triageNotes: z.string().max(500).optional().nullable(),
  assignedDoctorId: z.string().uuid().optional().nullable(),
  assignedBedId: z.string().uuid().optional().nullable(),
});

// ── Receptionist Profile Update Schema ─────────────────────────
const updateReceptionistProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().min(8).max(20).optional().nullable(),
  shift: z.enum(['Morning (08:00 - 16:00)', 'Evening (16:00 - 00:00)', 'Night (00:00 - 08:00)', 'Rotating']).optional(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url('Valid image URL required').optional().nullable(),
}).strict(); // Disallows injecting 'role', 'status', 'permissions'

module.exports = {
  registerPatientSchema,
  patientQuerySchema,
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  createInvoiceSchema,
  recordPaymentSchema,
  createEmergencySchema,
  updateReceptionistProfileSchema,
};
