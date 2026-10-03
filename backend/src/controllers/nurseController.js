const nurseProfileService = require('../services/nurseProfileService');
const nurseDashboardService = require('../services/nurseDashboardService');
const nursePatientService = require('../services/nursePatientService');
const vitalSignService = require('../services/vitalSignService');
const nursingNoteService = require('../services/nursingNoteService');
const medicationAdministrationService = require('../services/medicationAdministrationService');
const nurseAdmissionService = require('../services/nurseAdmissionService');
const nurseBedService = require('../services/nurseBedService');
const notificationService = require('../services/notificationService');
const ApiResponse = require('../utils/ApiResponse');

class NurseController {
  // ── Profile ────────────────────────────────────────────────
  async getProfile(req, res, next) {
    try {
      const profile = await nurseProfileService.getProfile(req.user.id, req.user.nurseId);
      return ApiResponse.success(res, profile, 'Nurse profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updated = await nurseProfileService.updateProfile(req.user.id, req.user.nurseId, req.body);
      return ApiResponse.success(res, updated, 'Nurse profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── Dashboard ──────────────────────────────────────────────
  async getDashboard(req, res, next) {
    try {
      const dashboard = await nurseDashboardService.getDashboard(req.user.nurseId);
      return ApiResponse.success(res, dashboard, 'Nurse dashboard summary retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── Assigned Patients ──────────────────────────────────────
  async getAssignedPatients(req, res, next) {
    try {
      const result = await nursePatientService.getAssignedPatients(req.user.nurseId, req.query);
      return ApiResponse.success(res, result, 'Assigned patients retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getPatientDetail(req, res, next) {
    try {
      const patient = await nursePatientService.getPatientDetail(req.user.nurseId, req.params.patientId);
      return ApiResponse.success(res, patient, 'Patient clinical details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── Vitals ─────────────────────────────────────────────────
  async getVitals(req, res, next) {
    try {
      const result = await vitalSignService.getVitals(req.user.nurseId, req.query);
      return ApiResponse.success(res, result, 'Vital sign records retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async recordVitals(req, res, next) {
    try {
      const vital = await vitalSignService.recordVitals(req.user.nurseId, req.body);
      return ApiResponse.created(res, vital, 'Vital signs recorded successfully');
    } catch (err) {
      next(err);
    }
  }

  async correctVitalSign(req, res, next) {
    try {
      const updated = await vitalSignService.correctVitalSign(req.user.nurseId, req.params.id, req.body);
      return ApiResponse.success(res, updated, 'Vital sign record corrected successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── Nursing Notes ──────────────────────────────────────────
  async getNotes(req, res, next) {
    try {
      const result = await nursingNoteService.getNotes(req.user.nurseId, req.query);
      return ApiResponse.success(res, result, 'Nursing notes retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async createNote(req, res, next) {
    try {
      const note = await nursingNoteService.createNote(req.user.nurseId, req.body);
      return ApiResponse.created(res, note, 'Nursing note created successfully');
    } catch (err) {
      next(err);
    }
  }

  async getNoteById(req, res, next) {
    try {
      const note = await nursingNoteService.getNoteById(req.params.id);
      return ApiResponse.success(res, note, 'Nursing note retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── Medication Administration (e-MAR) ─────────────────────
  async getMedicationTasks(req, res, next) {
    try {
      const result = await medicationAdministrationService.getTasks(req.user.nurseId, req.query);
      return ApiResponse.success(res, result, 'Medication administration tasks retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getMedicationTaskById(req, res, next) {
    try {
      const task = await medicationAdministrationService.getTaskById(req.params.id);
      return ApiResponse.success(res, task, 'Medication task retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async administerMedication(req, res, next) {
    try {
      const updated = await medicationAdministrationService.administer(
        req.user.nurseId,
        req.params.id,
        req.body
      );
      return ApiResponse.success(res, updated, 'Medication marked as administered successfully');
    } catch (err) {
      next(err);
    }
  }

  async holdMedication(req, res, next) {
    try {
      const updated = await medicationAdministrationService.hold(
        req.user.nurseId,
        req.params.id,
        req.body
      );
      return ApiResponse.success(res, updated, 'Medication marked as held');
    } catch (err) {
      next(err);
    }
  }

  async missMedication(req, res, next) {
    try {
      const updated = await medicationAdministrationService.miss(
        req.user.nurseId,
        req.params.id,
        req.body
      );
      return ApiResponse.success(res, updated, 'Medication marked as missed');
    } catch (err) {
      next(err);
    }
  }

  // ── Inpatient Admissions ───────────────────────────────────
  async getAdmissions(req, res, next) {
    try {
      const result = await nurseAdmissionService.getAdmissions(req.query);
      return ApiResponse.success(res, result, 'Inpatient admissions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getAdmissionById(req, res, next) {
    try {
      const admission = await nurseAdmissionService.getAdmissionById(req.params.id);
      return ApiResponse.success(res, admission, 'Admission detail retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── Bed Allocation Grid ────────────────────────────────────
  async getBeds(req, res, next) {
    try {
      const result = await nurseBedService.getBeds(req.query);
      return ApiResponse.success(res, result, 'Bed layout and occupancy retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateBedStatus(req, res, next) {
    try {
      const updated = await nurseBedService.updateBedStatus(
        req.params.id,
        req.body.status,
        req.body.notes
      );
      return ApiResponse.success(res, updated, 'Bed status updated successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── Notifications ──────────────────────────────────────────
  async getNotifications(req, res, next) {
    try {
      const result = await notificationService.getNotifications(req.user.id, req.query);
      return ApiResponse.success(res, result, 'Notifications retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const result = await notificationService.getUnreadCount(req.user.id);
      return ApiResponse.success(res, result, 'Unread count retrieved');
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const updated = await notificationService.markAsRead(req.user.id, req.params.id);
      return ApiResponse.success(res, updated, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      return ApiResponse.success(res, result, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NurseController();
