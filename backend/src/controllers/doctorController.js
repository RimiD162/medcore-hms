const doctorProfileService = require('../services/doctorProfileService');
const dashboardService = require('../services/dashboardService');
const ApiResponse = require('../utils/ApiResponse');

class DoctorController {
  async getProfile(req, res, next) {
    try {
      const profile = await doctorProfileService.getProfile(req.user.id, req.user.doctorId);
      return ApiResponse.success(res, profile, 'Doctor profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updated = await doctorProfileService.updateProfile(req.user.id, req.user.doctorId, req.body);
      return ApiResponse.success(res, updated, 'Doctor profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async getAvailability(req, res, next) {
    try {
      const availability = await doctorProfileService.getAvailability(req.user.doctorId);
      return ApiResponse.success(res, availability, 'Doctor availability schedules retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createAvailability(req, res, next) {
    try {
      const created = await doctorProfileService.createAvailability(req.user.doctorId, req.body);
      return ApiResponse.created(res, created, 'Availability schedule added successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateAvailability(req, res, next) {
    try {
      const updated = await doctorProfileService.updateAvailability(
        req.user.doctorId,
        req.params.id,
        req.body
      );
      return ApiResponse.success(res, updated, 'Availability schedule updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteAvailability(req, res, next) {
    try {
      const result = await doctorProfileService.deleteAvailability(req.user.doctorId, req.params.id);
      return ApiResponse.success(res, result, 'Availability schedule deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async toggleAvailability(req, res, next) {
    try {
      const updated = await doctorProfileService.toggleAvailability(req.user.doctorId, req.params.id);
      return ApiResponse.success(res, updated, 'Availability status toggled successfully');
    } catch (err) {
      next(err);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const summary = await dashboardService.getDashboardSummary(req.user.doctorId);
      return ApiResponse.success(res, summary, 'Dashboard summary retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DoctorController();
