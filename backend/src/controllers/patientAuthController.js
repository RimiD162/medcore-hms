const patientAuthService = require('../services/patientAuthService');
const patientPortalService = require('../services/patientPortalService');
const ApiResponse = require('../utils/ApiResponse');
const {
  activatePortalInviteSchema,
  patientLoginSchema,
  changePasswordSchema,
} = require('../validators/patientValidators');

class PatientAuthController {
  async activatePortalAccount(req, res, next) {
    try {
      const validated = activatePortalInviteSchema.parse(req.body);
      const result = await patientAuthService.activatePortalAccount(validated);
      return ApiResponse.success(res, result, 'Portal account successfully activated');
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const validated = patientLoginSchema.parse(req.body);
      const result = await patientAuthService.patientLogin(validated);
      return ApiResponse.success(res, result, 'Patient login successful');
    } catch (err) {
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const result = await patientAuthService.registerPatient(req.body);
      return ApiResponse.success(res, result, 'Registration request received');
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const result = await patientAuthService.forgotPassword(req.body.email);
      return ApiResponse.success(res, result, 'Password assistance instructions');
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const validated = changePasswordSchema.parse(req.body);
      const result = await patientAuthService.changePassword({
        userId: req.user.id,
        currentPassword: validated.currentPassword,
        newPassword: validated.newPassword,
      });
      return ApiResponse.success(res, result, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const profile = await patientPortalService.getProfile(req.patient.id);
      return ApiResponse.success(res, profile, 'Current patient session retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PatientAuthController();
