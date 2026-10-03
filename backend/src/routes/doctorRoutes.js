const express = require('express');
const { authMiddleware, requireRole, authorizePatientAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const doctorValidators = require('../validators/doctorValidators');

const doctorController = require('../controllers/doctorController');
const appointmentController = require('../controllers/appointmentController');
const patientController = require('../controllers/patientController');
const consultationController = require('../controllers/consultationController');
const medicalRecordController = require('../controllers/medicalRecordController');
const prescriptionController = require('../controllers/prescriptionController');
const labReportController = require('../controllers/labReportController');
const documentController = require('../controllers/documentController');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Apply Auth and Role Guard to all Doctor routes
router.use(authMiddleware);
router.use(requireRole('DOCTOR'));

// ── 1. Doctor Profile & Dashboard ─────────────────────────────
router.get('/profile', doctorController.getProfile);
router.put(
  '/profile',
  validate(doctorValidators.updateProfileSchema),
  doctorController.updateProfile
);
router.get('/dashboard', doctorController.getDashboard);

// ── 2. Doctor Availability Schedule ───────────────────────────
router.get('/availability', doctorController.getAvailability);
router.post(
  '/availability',
  validate(doctorValidators.availabilitySchema),
  doctorController.createAvailability
);
router.put(
  '/availability/:id',
  validate(doctorValidators.updateAvailabilitySchema),
  doctorController.updateAvailability
);
router.delete('/availability/:id', doctorController.deleteAvailability);
router.patch('/availability/:id/toggle', doctorController.toggleAvailability);

// ── 3. Appointments ───────────────────────────────────────────
router.get('/appointments', appointmentController.getAppointments);
router.get('/appointments/:id', appointmentController.getAppointmentById);
router.patch(
  '/appointments/:id/status',
  validate(doctorValidators.updateAppointmentStatusSchema),
  appointmentController.updateStatus
);
router.patch(
  '/appointments/:id/reschedule',
  validate(doctorValidators.rescheduleAppointmentSchema),
  appointmentController.reschedule
);
router.patch('/appointments/:id/check-in', appointmentController.toggleCheckIn);

// ── 4. Patients ───────────────────────────────────────────────
router.get('/patients', patientController.getPatients);
router.get('/patients/:patientId', authorizePatientAccess, patientController.getPatientById);

// ── 5. Consultations ──────────────────────────────────────────
router.get('/consultations', consultationController.getConsultations);
router.get(
  '/consultations/appointment/:appointmentId',
  consultationController.getOrCreateForAppointment
);
router.post(
  '/consultations/draft',
  validate(doctorValidators.saveConsultationDraftSchema),
  consultationController.saveDraft
);
router.put(
  '/consultations/:id/draft',
  validate(doctorValidators.updateConsultationDraftSchema),
  consultationController.saveDraft
);
router.post(
  '/consultations/:id/complete',
  validate(doctorValidators.completeConsultationSchema),
  consultationController.completeConsultation
);

// ── 6. Medical Records ────────────────────────────────────────
router.get('/medical-records', medicalRecordController.getMedicalRecords);
router.get(
  '/medical-records/patient/:patientId',
  authorizePatientAccess,
  medicalRecordController.getPatientTimeline
);
router.get('/medical-records/:id', medicalRecordController.getRecordById);

// ── 7. Prescriptions ──────────────────────────────────────────
router.get('/prescriptions', prescriptionController.getPrescriptions);
router.get('/prescriptions/:id', prescriptionController.getPrescriptionById);
router.post(
  '/prescriptions',
  validate(doctorValidators.createPrescriptionSchema),
  prescriptionController.createPrescription
);

// ── 8. Laboratory Reports ─────────────────────────────────────
router.get('/lab-reports', labReportController.getLabReports);
router.get('/lab-reports/:id', labReportController.getLabReportById);
router.post(
  '/lab-reports/order',
  validate(doctorValidators.orderLabReportSchema),
  labReportController.orderLabTest
);
router.patch(
  '/lab-reports/:id/review',
  validate(doctorValidators.reviewLabReportSchema),
  labReportController.reviewLabReport
);

// ── 9. Documents ──────────────────────────────────────────────
router.get('/documents', documentController.getDocuments);
router.get('/documents/:id', documentController.getDocumentById);

// ── 10. Notifications ─────────────────────────────────────────
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.patch('/notifications/:id/read', notificationController.markAsRead);
router.patch('/notifications/mark-all-read', notificationController.markAllAsRead);

module.exports = router;
