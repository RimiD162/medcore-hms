const labCatalogService = require('../services/labCatalogService');
const labOrderService = require('../services/labOrderService');
const labSampleService = require('../services/labSampleService');
const labResultService = require('../services/labResultService');
const labReportService = require('../services/labReportService');
const labDashboardService = require('../services/labDashboardService');
const labNotificationService = require('../services/labNotificationService');
const labProfileService = require('../services/labProfileService');

class LabController {
  // ================= CATALOG =================
  async listTests(req, res, next) {
    try {
      const data = await labCatalogService.listTests(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getTestById(req, res, next) {
    try {
      const test = await labCatalogService.getTestById(req.params.id);
      res.status(200).json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  }

  async createTest(req, res, next) {
    try {
      const test = await labCatalogService.createTest(req.body);
      res.status(201).json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  }

  async updateTest(req, res, next) {
    try {
      const test = await labCatalogService.updateTest(req.params.id, req.body);
      res.status(200).json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  }

  async toggleTestStatus(req, res, next) {
    try {
      const test = await labCatalogService.toggleTestStatus(req.params.id);
      res.status(200).json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  }

  async listCategories(req, res, next) {
    try {
      const categories = await labCatalogService.listCategories();
      res.status(200).json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  // ================= ORDERS =================
  async listOrders(req, res, next) {
    try {
      const data = await labOrderService.listOrders(req.query, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await labOrderService.getOrderById(req.params.id, req.user);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async createOrder(req, res, next) {
    try {
      // If doctor is logged in, pass doctorProfileId
      const doctorId = req.user?.doctorProfile?.id || null;
      const order = await labOrderService.createOrder(doctorId, req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const order = await labOrderService.cancelOrder(req.params.id, req.body.reason, req.user);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  // ================= SAMPLES =================
  async listSamples(req, res, next) {
    try {
      const data = await labSampleService.listSamples(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getSampleById(req, res, next) {
    try {
      const sample = await labSampleService.getSampleById(req.params.id);
      res.status(200).json({ success: true, data: sample });
    } catch (err) {
      next(err);
    }
  }

  async collectSample(req, res, next) {
    try {
      const sample = await labSampleService.collectSample(req.params.id, req.body, req.user.id);
      res.status(200).json({ success: true, data: sample });
    } catch (err) {
      next(err);
    }
  }

  async receiveSample(req, res, next) {
    try {
      const sample = await labSampleService.receiveSample(req.params.id, req.body, req.user.id);
      res.status(200).json({ success: true, data: sample });
    } catch (err) {
      next(err);
    }
  }

  async rejectSample(req, res, next) {
    try {
      const sample = await labSampleService.rejectSample(req.params.id, req.body, req.user.id);
      res.status(200).json({ success: true, data: sample });
    } catch (err) {
      next(err);
    }
  }

  async recollectSample(req, res, next) {
    try {
      const sample = await labSampleService.recollectSample(req.params.id, req.body, req.user.id);
      res.status(201).json({ success: true, data: sample });
    } catch (err) {
      next(err);
    }
  }

  // ================= RESULTS =================
  async listResults(req, res, next) {
    try {
      const data = await labResultService.listResults(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getResultById(req, res, next) {
    try {
      const result = await labResultService.getResultById(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async enterResults(req, res, next) {
    try {
      const result = await labResultService.enterResults(req.params.itemId, req.body, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async correctResult(req, res, next) {
    try {
      const result = await labResultService.correctResult(req.params.id, req.body, req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ================= REPORTS =================
  async listReports(req, res, next) {
    try {
      const data = await labReportService.listAllReports(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getReportById(req, res, next) {
    try {
      const report = await labReportService.getLabReportById(null, req.params.id);
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async verifyAndReleaseReport(req, res, next) {
    try {
      const report = await labReportService.verifyAndReleaseReport(req.params.orderId, req.body, req.user);
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  // ================= DASHBOARD & NOTIFICATIONS =================
  async getDashboardStats(req, res, next) {
    try {
      const stats = await labDashboardService.getDashboardStats();
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async listNotifications(req, res, next) {
    try {
      const notifications = await labNotificationService.listNotifications(req.user.id, req.query);
      res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  }

  async markNotificationRead(req, res, next) {
    try {
      const notif = await labNotificationService.markAsRead(req.params.id);
      res.status(200).json({ success: true, data: notif });
    } catch (err) {
      next(err);
    }
  }

  async markAllNotificationsRead(req, res, next) {
    try {
      const result = await labNotificationService.markAllAsRead(req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ================= PROFILE =================
  async getProfile(req, res, next) {
    try {
      const profile = await labProfileService.getProfile(req.user.id);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const profile = await labProfileService.updateProfile(req.user.id, req.body);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LabController();
