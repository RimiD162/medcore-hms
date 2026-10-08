const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const receptionistValidators = require('../validators/receptionistValidators');
const receptionistController = require('../controllers/receptionistController');

const router = express.Router();

// Apply Authentication & Role Guard to all Receptionist routes
router.use(authMiddleware);
router.use(requireRole('RECEPTIONIST'));

// ── 1. Dashboard ──────────────────────────────────────────────
router.get('/dashboard', receptionistController.getDashboard);
router.get('/queue', receptionistController.getDashboard);

// ── 2. Patients Directory & Intake ────────────────────────────
router.get('/patients', receptionistController.getPatients);
router.get('/patients/check-duplicates', receptionistController.checkDuplicates);
router.post(
  '/patients',
  validate(receptionistValidators.registerPatientSchema),
  receptionistController.registerPatient
);
router.get('/patients/:patientId', receptionistController.getPatientById);
router.post('/patients/:patientId/portal-invite', receptionistController.createPortalInvite);

// ── 3. Appointments & Schedule ────────────────────────────────
router.get('/appointments', receptionistController.getAppointments);
router.get('/appointments/doctors', receptionistController.getDoctorsList);
router.get('/appointments/calendar', receptionistController.getCalendarAppointments);
router.get('/appointments/availability', receptionistController.getDoctorAvailability);
router.post(
  '/appointments/book',
  validate(receptionistValidators.bookAppointmentSchema),
  receptionistController.bookAppointment
);
router.patch(
  '/appointments/:id/reschedule',
  validate(receptionistValidators.rescheduleAppointmentSchema),
  receptionistController.rescheduleAppointment
);
router.patch(
  '/appointments/:id/cancel',
  validate(receptionistValidators.cancelAppointmentSchema),
  receptionistController.cancelAppointment
);
router.patch('/appointments/:id/check-in', receptionistController.checkInAppointment);

// ── 4. Inpatient Admissions & Bed Matrix ──────────────────────
router.get('/admissions', receptionistController.getAdmissions);
router.get('/admissions/stats', receptionistController.getAdmissionStats);
router.get('/admissions/bed-matrix', receptionistController.getBedMatrix);

// ── 5. Emergency Intake ───────────────────────────────────────
router.get('/emergency', receptionistController.getEmergencyList);
router.get('/emergencies', receptionistController.getEmergencyList);
router.post(
  '/emergency',
  validate(receptionistValidators.createEmergencySchema),
  receptionistController.createEmergency
);
router.post(
  '/emergencies',
  validate(receptionistValidators.createEmergencySchema),
  receptionistController.createEmergency
);

// ── 6. Billing, Invoices & Payments ───────────────────────────
router.get('/billing/catalog', receptionistController.getServiceCatalog);
router.get('/billing/invoices', receptionistController.getInvoices);
router.get('/billing/invoices/:id', receptionistController.getInvoiceById);
router.post(
  '/billing/invoices',
  validate(receptionistValidators.createInvoiceSchema),
  receptionistController.createInvoice
);
router.get('/invoices', receptionistController.getInvoices);
router.get('/invoices/:id', receptionistController.getInvoiceById);
router.post(
  '/invoices',
  validate(receptionistValidators.createInvoiceSchema),
  receptionistController.createInvoice
);

router.get('/billing/payments', receptionistController.getPayments);
router.post(
  '/billing/payments',
  validate(receptionistValidators.recordPaymentSchema),
  receptionistController.recordPayment
);
router.get('/payments', receptionistController.getPayments);
router.post(
  '/payments',
  validate(receptionistValidators.recordPaymentSchema),
  receptionistController.recordPayment
);

// ── 7. Notifications ─────────────────────────────────────────
router.get('/notifications', receptionistController.getNotifications);
router.get('/notifications/unread-count', receptionistController.getUnreadCount);
router.patch('/notifications/:id/read', receptionistController.markAsRead);
router.patch('/notifications/mark-all-read', receptionistController.markAllAsRead);

// ── 8. Profile & Shift ───────────────────────────────────────
router.get('/profile', receptionistController.getProfile);
router.put(
  '/profile',
  validate(receptionistValidators.updateReceptionistProfileSchema),
  receptionistController.updateProfile
);

module.exports = router;
