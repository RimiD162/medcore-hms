const medicalRecordService = require('../services/medicalRecordService');
const ApiResponse = require('../utils/ApiResponse');

class MedicalRecordController {
  async getMedicalRecords(req, res, next) {
    try {
      const data = await medicalRecordService.getMedicalRecords(req.user.doctorId, req.query);
      return ApiResponse.success(res, data, 'Medical records retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getPatientTimeline(req, res, next) {
    try {
      const data = await medicalRecordService.getPatientTimeline(
        req.user.doctorId,
        req.params.patientId
      );
      return ApiResponse.success(res, data, 'Patient clinical timeline retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getRecordById(req, res, next) {
    try {
      const record = await medicalRecordService.getRecordById(req.user.doctorId, req.params.id);
      return ApiResponse.success(res, record, 'Medical record details retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MedicalRecordController();
