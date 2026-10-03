const patientService = require('../services/patientService');
const ApiResponse = require('../utils/ApiResponse');

class PatientController {
  async getPatients(req, res, next) {
    try {
      const data = await patientService.getPatients(req.user.doctorId, req.query);
      return ApiResponse.success(res, data, 'Patients retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getPatientById(req, res, next) {
    try {
      const patient = await patientService.getPatientById(req.user.doctorId, req.params.patientId);
      return ApiResponse.success(res, patient, 'Patient EMR profile retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PatientController();
