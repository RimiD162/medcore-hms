const consultationService = require('../services/consultationService');
const ApiResponse = require('../utils/ApiResponse');

class ConsultationController {
  async getConsultations(req, res, next) {
    try {
      const data = await consultationService.getConsultations(req.user.doctorId, req.query);
      return ApiResponse.success(res, data, 'Consultations retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getOrCreateForAppointment(req, res, next) {
    try {
      const data = await consultationService.getOrCreateForAppointment(
        req.user.doctorId,
        req.params.appointmentId
      );
      return ApiResponse.success(res, data, 'Consultation workspace loaded');
    } catch (err) {
      next(err);
    }
  }

  async saveDraft(req, res, next) {
    try {
      const saved = await consultationService.saveDraft(
        req.user.doctorId,
        req.params.id,
        req.body
      );
      return ApiResponse.success(res, saved, 'Consultation draft saved successfully');
    } catch (err) {
      next(err);
    }
  }

  async completeConsultation(req, res, next) {
    try {
      const result = await consultationService.completeConsultation(
        req.user.doctorId,
        req.params.id,
        req.body
      );
      return ApiResponse.success(
        res,
        result,
        'Consultation completed and medical record generated successfully'
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ConsultationController();
