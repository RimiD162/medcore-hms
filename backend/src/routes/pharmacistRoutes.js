const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const pharmacistValidators = require('../validators/pharmacistValidators');
const pharmacistController = require('../controllers/pharmacistController');

const router = express.Router();

// Apply Authentication & Role Guard to all Pharmacist routes
router.use(authMiddleware);
router.use(requireRole('PHARMACIST'));

// ── 1. Dashboard ──────────────────────────────────────────────
router.get('/dashboard', pharmacistController.getDashboard);

// ── 2. Medicine Catalog ─────────────────────────────────────
router.get('/medicines', pharmacistController.getMedicines);
router.post(
  '/medicines',
  validate(pharmacistValidators.createMedicineSchema),
  pharmacistController.createMedicine
);
router.get('/medicines/:id', pharmacistController.getMedicineById);
router.patch(
  '/medicines/:id',
  validate(pharmacistValidators.updateMedicineSchema),
  pharmacistController.updateMedicine
);

// ── 3. Inventory & Batches ──────────────────────────────────
router.get('/inventory', pharmacistController.getInventory);
router.get('/inventory/batches', pharmacistController.getBatches);
router.get('/batches', pharmacistController.getBatches); // Alias
router.get('/inventory/batches/:id', pharmacistController.getBatchById);
router.get('/batches/:id', pharmacistController.getBatchById); // Alias

router.post(
  '/inventory/receipts',
  validate(pharmacistValidators.stockReceiptSchema),
  pharmacistController.receiveStock
);
router.post(
  '/inventory/adjustments',
  validate(pharmacistValidators.stockAdjustmentSchema),
  pharmacistController.adjustStock
);
router.post(
  '/inventory/write-offs',
  validate(pharmacistValidators.expiryWriteOffSchema),
  pharmacistController.writeOffExpired
);

router.get('/inventory/transactions', pharmacistController.getTransactions);
router.get('/transactions', pharmacistController.getTransactions); // Alias

// ── 4. Stock Alerts & Expiry ────────────────────────────────
router.get('/low-stock', pharmacistController.getLowStock);
router.get('/expiry', pharmacistController.getExpiryBuckets);

// ── 5. Prescriptions Queue & Review ─────────────────────────
router.get('/prescriptions', pharmacistController.getPrescriptions);
router.get('/prescriptions/:id', pharmacistController.getPrescriptionDetail);
router.patch(
  '/prescriptions/:id/items/:itemId/map',
  validate(pharmacistValidators.mapPrescriptionItemSchema),
  pharmacistController.mapPrescriptionItem
);
router.post(
  '/prescriptions/:id/hold',
  validate(pharmacistValidators.prescriptionHoldSchema),
  pharmacistController.holdPrescription
);
router.post('/prescriptions/:id/release', pharmacistController.releasePrescription);

// ── 6. Dispensing & History ─────────────────────────────────
router.post(
  '/dispensing',
  validate(pharmacistValidators.createDispensingSchema),
  pharmacistController.dispense
);
router.get('/dispensing/history', pharmacistController.getDispensingHistory);

// ── 7. Sales & Billed Items (Read-only) ──────────────────────
router.get('/sales', pharmacistController.getSales);

// ── 8. Notifications ────────────────────────────────────────
router.get('/notifications', pharmacistController.getNotifications);
router.patch('/notifications/read-all', pharmacistController.markAllNotificationsRead);
router.patch('/notifications/:id/read', pharmacistController.markNotificationRead);

// ── 9. Profile ──────────────────────────────────────────────
router.get('/profile', pharmacistController.getProfile);
router.patch(
  '/profile',
  validate(pharmacistValidators.updatePharmacistProfileSchema),
  pharmacistController.updateProfile
);

module.exports = router;
