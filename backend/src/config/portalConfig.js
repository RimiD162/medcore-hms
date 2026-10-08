/**
 * Centralized Patient Portal Configuration Module
 * Authoritative parameters and operational thresholds.
 * Zero magic numbers in code.
 */

const portalConfig = {
  // Booking and Scheduling Rules
  minBookingNoticeHours: parseInt(process.env.PORTAL_MIN_BOOKING_NOTICE_HOURS || '2', 10),
  maxUpcomingAppointments: parseInt(process.env.PORTAL_MAX_UPCOMING_APPOINTMENTS || '5', 10),
  minCancellationNoticeHours: parseInt(process.env.PORTAL_MIN_CANCELLATION_NOTICE_HOURS || '4', 10),
  maxReschedulesPerAppointment: parseInt(process.env.PORTAL_MAX_RESCHEDULES || '3', 10),
  patientAppointmentTypes: ['General', 'Follow-up', 'Routine'],
  portalAutoConfirm: process.env.PORTAL_AUTO_CONFIRM === 'true', // Default: false (staff confirm)

  // Clinical Data Release Policy
  recordReleaseDelayHours: parseInt(process.env.PORTAL_RECORD_RELEASE_DELAY_HOURS || '0', 10),
  portalLabRequireDoctorReview: process.env.PORTAL_LAB_REQUIRE_DOCTOR_REVIEW === 'true', // Default: false (release means visible)
  recentPrescriptionWindowDays: parseInt(process.env.PORTAL_RECENT_PRESCRIPTION_DAYS || '30', 10),

  // Account & Registration Rules
  patientSelfRegistrationEnabled: process.env.PATIENT_SELF_REGISTRATION_ENABLED === 'true', // Default: false (invite-only)
  minimumSelfServiceAge: parseInt(process.env.PORTAL_MIN_SELF_SERVICE_AGE || '18', 10),
  inviteExpiryDays: parseInt(process.env.PORTAL_INVITE_EXPIRY_DAYS || '7', 10),
  maxInviteAttempts: parseInt(process.env.PORTAL_MAX_INVITE_ATTEMPTS || '5', 10),

  // Document Vault Rules
  allowedUploadMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
  allowedUploadExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
  maxUploadSizeBytes: parseInt(process.env.PORTAL_MAX_UPLOAD_SIZE_BYTES || String(10 * 1024 * 1024), 10), // 10MB
  patientUploadQuotaBytes: parseInt(process.env.PORTAL_PATIENT_QUOTA_BYTES || String(50 * 1024 * 1024), 10), // 50MB

  // Online Payment Abstraction
  onlinePaymentsEnabled: process.env.ONLINE_PAYMENTS_ENABLED === 'true', // Default: false
  paymentGatewayProvider: process.env.PAYMENT_GATEWAY_PROVIDER || 'none', // 'none' | 'stripe' | 'razorpay' | 'mock'

  // Timezone & Localization
  hospitalTimezone: process.env.HOSPITAL_TIMEZONE || 'Asia/Kolkata',
  currency: 'INR',
  currencySymbol: '₹',
};

module.exports = portalConfig;
