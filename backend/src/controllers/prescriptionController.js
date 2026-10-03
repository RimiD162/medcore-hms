const prescriptionService = require('../services/prescriptionService');
const ApiResponse = require('../utils/ApiResponse');

class PrescriptionController {
  async getPrescriptions(req, res, next) {
    try {
      const data = await prescriptionService.getPrescriptions(req.user.doctorId, req.query);
      return ApiResponse.success(res, data, 'Prescriptions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getPrescriptionById(req, res, next) {
    try {
      const prescription = await prescriptionService.getPrescriptionById(
        req.user.doctorId,
        req.params.id
      );
      return ApiResponse.success(res, prescription, 'Prescription details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createPrescription(req, res, next) {
    try {
      const created = await prescriptionService.createPrescription(req.user.doctorId, req.body);
      return ApiResponse.created(res, created, 'Prescription generated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PrescriptionController();
