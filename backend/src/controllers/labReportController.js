const labReportService = require('../services/labReportService');
const ApiResponse = require('../utils/ApiResponse');

class LabReportController {
  async getLabReports(req, res, next) {
    try {
      const data = await labReportService.getLabReports(req.user.doctorId, req.query);
      return ApiResponse.success(res, data, 'Lab reports retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getLabReportById(req, res, next) {
    try {
      const report = await labReportService.getLabReportById(req.user.doctorId, req.params.id);
      return ApiResponse.success(res, report, 'Lab report details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async orderLabTest(req, res, next) {
    try {
      const created = await labReportService.orderLabTest(req.user.doctorId, req.body);
      return ApiResponse.created(res, created, 'Laboratory test ordered successfully');
    } catch (err) {
      next(err);
    }
  }

  async reviewLabReport(req, res, next) {
    try {
      const updated = await labReportService.reviewLabReport(
        req.user.doctorId,
        req.params.id,
        req.body.doctorNotes
      );
      return ApiResponse.success(res, updated, 'Lab report reviewed and signed successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LabReportController();
