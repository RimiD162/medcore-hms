const { z } = require('zod');

const updateProfileSchema = z.object({
  phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20).optional(),
  address: z.string().max(255).optional().nullable(),
  emergencyContact: z.string().max(100).optional().nullable(),
  emergencyPhone: z.string().max(20).optional().nullable(),
}).strict({
  message: 'Only phone, address, and emergency contact details may be updated by patient',
});

const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format'),
  type: z.enum(['General', 'Follow-up', 'Routine', 'Specialist']).default('General'),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional().nullable(),
});

const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format'),
});

const cancelAppointmentSchema = z.object({
  cancelReason: z.string().min(3, 'Cancellation reason must be at least 3 characters').max(500),
});

const initiatePaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  idempotencyKey: z.string().min(8, 'Valid idempotency key is required'),
});

const uploadDocumentSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150),
  category: z.enum(['Medical Document', 'Lab Report', 'Prescription', 'Insurance Document', 'Other']).default('Medical Document'),
  fileData: z.string().min(1, 'File content data is required'), // Base64 or data URL
  fileName: z.string().min(1, 'Original filename is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
});

const activatePortalInviteSchema = z.object({
  inviteCode: z.string().min(6, 'Invite code must be at least 6 characters').trim(),
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const patientLoginSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const searchSchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters').max(100),
});

module.exports = {
  updateProfileSchema,
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  initiatePaymentSchema,
  uploadDocumentSchema,
  activatePortalInviteSchema,
  patientLoginSchema,
  changePasswordSchema,
  searchSchema,
};
