const express = require('express');
const { authMiddleware, requireRole, authorizeNursePatientAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const nurseValidators = require('../validators/nurseValidators');
const nurseController = require('../controllers/nurseController');

const router = express.Router();

// Apply Auth and Role Guard to all Nurse routes
router.use(authMiddleware);
router.use(requireRole('NURSE'));

// ── 1. Nurse Profile & Dashboard ──────────────────────────────
router.get('/profile', nurseController.getProfile);
router.put(
  '/profile',
  validate(nurseValidators.updateNurseProfileSchema),
  nurseController.updateProfile
);
router.get('/dashboard', nurseController.getDashboard);

// ── 2. Assigned Patients Directory & Detail ───────────────────
router.get('/patients', nurseController.getAssignedPatients);
router.get(
  '/patients/:patientId',
  authorizeNursePatientAccess,
  nurseController.getPatientDetail
);

// ── 3. Vital Signs Monitoring ─────────────────────────────────
router.get('/vitals', nurseController.getVitals);
router.post(
  '/vitals',
  validate(nurseValidators.vitalSignsSchema),
  nurseController.recordVitals
);
router.put(
  '/vitals/:id',
  validate(nurseValidators.updateVitalSignSchema),
  nurseController.correctVitalSign
);

// ── 4. Nursing Clinical Notes ─────────────────────────────────
router.get('/notes', nurseController.getNotes);
router.get('/notes/:id', nurseController.getNoteById);
router.post(
  '/notes',
  validate(nurseValidators.nursingNoteSchema),
  nurseController.createNote
);

// ── 5. Medication Administration (e-MAR) ──────────────────────
router.get('/medications', nurseController.getMedicationTasks);
router.get('/medications/:id', nurseController.getMedicationTaskById);
router.post(
  '/medications/:id/administer',
  validate(nurseValidators.administerMedicationSchema),
  nurseController.administerMedication
);
router.post(
  '/medications/:id/hold',
  validate(nurseValidators.holdMedicationSchema),
  nurseController.holdMedication
);
router.post(
  '/medications/:id/miss',
  validate(nurseValidators.missMedicationSchema),
  nurseController.missMedication
);

// ── 6. Inpatient Admissions ───────────────────────────────────
router.get('/admissions', nurseController.getAdmissions);
router.get('/admissions/:id', nurseController.getAdmissionById);

// ── 7. Bed Allocation Grid ────────────────────────────────────
router.get('/beds', nurseController.getBeds);
router.patch('/beds/:id/status', nurseController.updateBedStatus);

// ── 8. Notifications ──────────────────────────────────────────
router.get('/notifications', nurseController.getNotifications);
router.get('/notifications/unread-count', nurseController.getUnreadCount);
router.patch('/notifications/:id/read', nurseController.markAsRead);
router.patch('/notifications/mark-all-read', nurseController.markAllAsRead);

module.exports = router;
