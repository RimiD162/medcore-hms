const express = require('express');
const labController = require('../controllers/labController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createLabTestSchema,
  updateLabTestSchema,
  createLabOrderSchema,
  collectSampleSchema,
  receiveSampleSchema,
  rejectSampleSchema,
  enterResultSchema,
  correctResultSchema,
  verifyReportSchema,
  updateProfileSchema,
} = require('../validators/labValidators');

const router = express.Router();

// All lab routes require authentication
router.use(authenticate);

// ================= DASHBOARD =================
router.get('/dashboard', authorize('LAB_TECHNICIAN', 'ADMIN', 'DOCTOR'), labController.getDashboardStats);

// ================= CATALOG =================
router.get('/catalog', authorize('LAB_TECHNICIAN', 'DOCTOR', 'ADMIN', 'NURSE'), labController.listTests);
router.get('/catalog/categories', authorize('LAB_TECHNICIAN', 'DOCTOR', 'ADMIN', 'NURSE'), labController.listCategories);
router.get('/catalog/:id', authorize('LAB_TECHNICIAN', 'DOCTOR', 'ADMIN', 'NURSE'), labController.getTestById);
router.post('/catalog', authorize('LAB_TECHNICIAN', 'ADMIN'), validate(createLabTestSchema), labController.createTest);
router.put('/catalog/:id', authorize('LAB_TECHNICIAN', 'ADMIN'), validate(updateLabTestSchema), labController.updateTest);
router.patch('/catalog/:id/toggle-status', authorize('LAB_TECHNICIAN', 'ADMIN'), labController.toggleTestStatus);

// ================= ORDERS =================
router.get('/orders', authorize('LAB_TECHNICIAN', 'DOCTOR', 'ADMIN', 'NURSE'), labController.listOrders);
router.get('/orders/:id', authorize('LAB_TECHNICIAN', 'DOCTOR', 'ADMIN', 'NURSE'), labController.getOrderById);
router.post('/orders', authorize('DOCTOR', 'LAB_TECHNICIAN', 'ADMIN'), validate(createLabOrderSchema), labController.createOrder);
router.post('/orders/:id/cancel', authorize('DOCTOR', 'LAB_TECHNICIAN', 'ADMIN'), labController.cancelOrder);

// ================= SAMPLES =================
router.get('/samples', authorize('LAB_TECHNICIAN', 'ADMIN', 'DOCTOR', 'NURSE'), labController.listSamples);
router.get('/samples/:id', authorize('LAB_TECHNICIAN', 'ADMIN', 'DOCTOR', 'NURSE'), labController.getSampleById);
router.post('/samples/:id/collect', authorize('LAB_TECHNICIAN', 'NURSE', 'ADMIN'), validate(collectSampleSchema), labController.collectSample);
router.post('/samples/:id/receive', authorize('LAB_TECHNICIAN', 'ADMIN'), validate(receiveSampleSchema), labController.receiveSample);
router.post('/samples/:id/reject', authorize('LAB_TECHNICIAN', 'ADMIN'), validate(rejectSampleSchema), labController.rejectSample);
router.post('/samples/:id/recollect', authorize('LAB_TECHNICIAN', 'DOCTOR', 'ADMIN'), labController.recollectSample);

// ================= RESULTS =================
router.get('/results', authorize('LAB_TECHNICIAN', 'DOCTOR', 'ADMIN'), labController.listResults);
router.get('/results/:id', authorize('LAB_TECHNICIAN', 'DOCTOR', 'ADMIN'), labController.getResultById);
router.post('/results/item/:itemId', authorize('LAB_TECHNICIAN', 'ADMIN'), validate(enterResultSchema), labController.enterResults);
router.post('/results/:id/correct', authorize('LAB_TECHNICIAN', 'ADMIN'), validate(correctResultSchema), labController.correctResult);

// ================= REPORTS =================
router.get('/reports', authorize('LAB_TECHNICIAN', 'DOCTOR', 'ADMIN'), labController.listReports);
router.get('/reports/:id', authorize('LAB_TECHNICIAN', 'DOCTOR', 'ADMIN'), labController.getReportById);
router.post('/reports/order/:orderId/verify', authorize('LAB_TECHNICIAN', 'ADMIN'), validate(verifyReportSchema), labController.verifyAndReleaseReport);

// ================= NOTIFICATIONS =================
router.get('/notifications', authorize('LAB_TECHNICIAN', 'ADMIN'), labController.listNotifications);
router.patch('/notifications/read-all', authorize('LAB_TECHNICIAN', 'ADMIN'), labController.markAllNotificationsRead);
router.patch('/notifications/:id/read', authorize('LAB_TECHNICIAN', 'ADMIN'), labController.markNotificationRead);

// ================= PROFILE =================
router.get('/profile', authorize('LAB_TECHNICIAN', 'ADMIN'), labController.getProfile);
router.put('/profile', authorize('LAB_TECHNICIAN', 'ADMIN'), validate(updateProfileSchema), labController.updateProfile);

module.exports = router;
