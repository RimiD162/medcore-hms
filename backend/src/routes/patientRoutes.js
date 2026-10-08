const express = require('express');
const patientPortalController = require('../controllers/patientPortalController');
const { authMiddleware, requirePatient } = require('../middleware/auth');

const router = express.Router();

// Enforce authentication & patient identity on all portal routes
router.use(authMiddleware);
router.use(requirePatient);

// ── Dashboard & Profile ──
router.get('/dashboard', patientPortalController.getDashboard);
router.get('/profile', patientPortalController.getProfile);
router.put('/profile', patientPortalController.updateProfile);

// ── Doctors & Availability ──
router.get('/doctors', patientPortalController.getDoctors);
router.get('/doctors/:doctorId/availability', patientPortalController.getDoctorAvailability);

// ── Appointments ──
router.get('/appointments', patientPortalController.getAppointments);
router.post('/appointments', patientPortalController.bookAppointment);
router.get('/appointments/:appointmentId', patientPortalController.getAppointmentById);
router.put('/appointments/:appointmentId/reschedule', patientPortalController.rescheduleAppointment);
router.put('/appointments/:appointmentId/cancel', patientPortalController.cancelAppointment);

// ── Medical Records & Prescriptions ──
router.get('/medical-records', patientPortalController.getMedicalRecords);
router.get('/medical-records/:recordId', patientPortalController.getMedicalRecordById);
router.get('/prescriptions', patientPortalController.getPrescriptions);
router.get('/prescriptions/:prescriptionId', patientPortalController.getPrescriptionById);

// ── Laboratory Reports ──
router.get('/lab-reports', patientPortalController.getLabReports);
router.get('/lab-reports/:reportId', patientPortalController.getLabReportById);

// ── Billing & Payments ──
router.get('/invoices', patientPortalController.getInvoices);
router.get('/invoices/:invoiceId', patientPortalController.getInvoiceById);
router.get('/invoices/:invoiceId/payment-options', patientPortalController.getPaymentOptions);
router.post('/invoices/:invoiceId/payments', patientPortalController.initiatePayment);
router.get('/payments', patientPortalController.getPayments);

// ── Document Vault ──
router.get('/documents', patientPortalController.getDocuments);
router.post('/documents', patientPortalController.uploadDocument);
router.delete('/documents/:documentId', patientPortalController.deleteDocument);

// ── Insurance Policies & Claims (Read-Only) ──
router.get('/insurance', patientPortalController.getInsurance);

// ── Timeline & Global Search ──
router.get('/timeline', patientPortalController.getTimeline);
router.get('/search', patientPortalController.search);

// ── Notifications ──
router.get('/notifications', patientPortalController.getNotifications);
router.put('/notifications/read-all', patientPortalController.markAllNotificationsRead);
router.put('/notifications/:notificationId/read', patientPortalController.markNotificationRead);

module.exports = router;
