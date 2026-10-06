const medicineService = require('../services/medicineService');
const batchService = require('../services/batchService');
const inventoryService = require('../services/inventoryService');
const stockAlertService = require('../services/stockAlertService');
const prescriptionQueueService = require('../services/prescriptionQueueService');
const dispensingService = require('../services/dispensingService');
const pharmacyBillingService = require('../services/pharmacyBillingService');
const pharmacyDashboardService = require('../services/pharmacyDashboardService');
const pharmacyNotificationService = require('../services/pharmacyNotificationService');
const pharmacyProfileService = require('../services/pharmacyProfileService');
const ApiResponse = require('../utils/ApiResponse');

class PharmacistController {
  // ── 1. Dashboard ────────────────────────────────────────────
  async getDashboard(req, res, next) {
    try {
      const data = await pharmacyDashboardService.getDashboardMetrics();
      return ApiResponse.success(res, data, 'Pharmacy dashboard metrics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 2. Medicine Catalog ─────────────────────────────────────
  async getMedicines(req, res, next) {
    try {
      const data = await medicineService.getMedicines(req.query);
      return ApiResponse.success(res, data, 'Medicines retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getMedicineById(req, res, next) {
    try {
      const data = await medicineService.getMedicineById(req.params.id);
      return ApiResponse.success(res, data, 'Medicine retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async createMedicine(req, res, next) {
    try {
      const data = await medicineService.createMedicine(req.body, req.user);
      return ApiResponse.created(res, data, 'Medicine created successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateMedicine(req, res, next) {
    try {
      const data = await medicineService.updateMedicine(req.params.id, req.body, req.user);
      return ApiResponse.success(res, data, 'Medicine updated successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 3. Inventory & Batches ──────────────────────────────────
  async getInventory(req, res, next) {
    try {
      const data = await inventoryService.getInventoryOverview(req.query);
      return ApiResponse.success(res, data, 'Inventory overview retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getBatches(req, res, next) {
    try {
      const data = await batchService.getBatches(req.query);
      return ApiResponse.success(res, data, 'Batches retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getBatchById(req, res, next) {
    try {
      const data = await batchService.getBatchById(req.params.id);
      return ApiResponse.success(res, data, 'Batch details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async receiveStock(req, res, next) {
    try {
      const data = await inventoryService.receiveStock(req.body, req.user);
      return ApiResponse.created(res, data, 'Stock received and batches updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req, res, next) {
    try {
      const data = await inventoryService.adjustStock(req.body, req.user);
      return ApiResponse.success(res, data, 'Batch stock adjusted successfully');
    } catch (err) {
      next(err);
    }
  }

  async writeOffExpired(req, res, next) {
    try {
      const data = await inventoryService.writeOffExpired(req.body, req.user);
      return ApiResponse.success(res, data, 'Expired batch stock written off successfully');
    } catch (err) {
      next(err);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const data = await inventoryService.getTransactions(req.query);
      return ApiResponse.success(res, data, 'Stock transactions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 4. Stock Alerts & Expiry ────────────────────────────────
  async getLowStock(req, res, next) {
    try {
      const data = await stockAlertService.getLowStockMedicines(req.query);
      return ApiResponse.success(res, data, 'Low-stock medicines retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getExpiryBuckets(req, res, next) {
    try {
      const data = await stockAlertService.getExpiryBuckets(req.query);
      return ApiResponse.success(res, data, 'Expiry buckets retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 5. Prescriptions Queue & Review ─────────────────────────
  async getPrescriptions(req, res, next) {
    try {
      const data = await prescriptionQueueService.getPrescriptionQueue(req.query);
      return ApiResponse.success(res, data, 'Prescription queue retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getPrescriptionDetail(req, res, next) {
    try {
      const data = await prescriptionQueueService.getPrescriptionDetail(req.params.id);
      return ApiResponse.success(res, data, 'Prescription detail retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async mapPrescriptionItem(req, res, next) {
    try {
      const data = await prescriptionQueueService.mapPrescriptionItem(
        req.params.id,
        req.params.itemId,
        req.body,
        req.user
      );
      return ApiResponse.success(res, data, 'Prescription item mapped successfully');
    } catch (err) {
      next(err);
    }
  }

  async holdPrescription(req, res, next) {
    try {
      const data = await prescriptionQueueService.holdPrescription(req.params.id, req.body, req.user);
      return ApiResponse.success(res, data, 'Prescription placed on hold');
    } catch (err) {
      next(err);
    }
  }

  async releasePrescription(req, res, next) {
    try {
      const data = await prescriptionQueueService.releasePrescription(req.params.id, req.user);
      return ApiResponse.success(res, data, 'Prescription released from hold');
    } catch (err) {
      next(err);
    }
  }

  // ── 6. Dispensing & History ─────────────────────────────────
  async dispense(req, res, next) {
    try {
      const data = await dispensingService.dispense(req.body, req.user);
      return ApiResponse.created(res, data, 'Prescription dispensed successfully');
    } catch (err) {
      next(err);
    }
  }

  async getDispensingHistory(req, res, next) {
    try {
      const data = await dispensingService.getDispensingHistory(req.query);
      return ApiResponse.success(res, data, 'Dispensing history retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 7. Sales & Billed Items (Read-only) ──────────────────────
  async getSales(req, res, next) {
    try {
      const data = await pharmacyBillingService.getSales(req.query);
      return ApiResponse.success(res, data, 'Pharmacy sales retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 8. Notifications ────────────────────────────────────────
  async getNotifications(req, res, next) {
    try {
      const data = await pharmacyNotificationService.getNotifications(req.user.id, req.query);
      return ApiResponse.success(res, data, 'Notifications retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async markNotificationRead(req, res, next) {
    try {
      const data = await pharmacyNotificationService.markAsRead(req.user.id, req.params.id);
      return ApiResponse.success(res, data, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  async markAllNotificationsRead(req, res, next) {
    try {
      const data = await pharmacyNotificationService.markAllAsRead(req.user.id);
      return ApiResponse.success(res, data, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }

  // ── 9. Profile ──────────────────────────────────────────────
  async getProfile(req, res, next) {
    try {
      const data = await pharmacyProfileService.getProfile(req.user.id);
      return ApiResponse.success(res, data, 'Pharmacist profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const data = await pharmacyProfileService.updateProfile(req.user.id, req.body);
      return ApiResponse.success(res, data, 'Pharmacist profile updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PharmacistController();
