const ApiResponse = require('../utils/ApiResponse');
const receptionistDashboardService = require('../services/receptionistDashboardService');
const receptionistPatientService = require('../services/receptionistPatientService');
const receptionistAppointmentService = require('../services/receptionistAppointmentService');
const receptionistBillingService = require('../services/receptionistBillingService');
const receptionistAdmissionService = require('../services/receptionistAdmissionService');
const receptionistEmergencyService = require('../services/receptionistEmergencyService');
const receptionistNotificationService = require('../services/receptionistNotificationService');
const receptionistProfileService = require('../services/receptionistProfileService');

class ReceptionistController {
  // ── 1. Dashboard ──────────────────────────────────────────────
  async getDashboard(req, res, next) {
    try {
      const data = await receptionistDashboardService.getDashboardSummary();
      return ApiResponse.success(res, data, 'Front Desk dashboard retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 2. Patients ───────────────────────────────────────────────
  async getPatients(req, res, next) {
    try {
      const data = await receptionistPatientService.getPatients(req.query);
      return ApiResponse.success(res, data, 'Patients retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async checkDuplicates(req, res, next) {
    try {
      const { phone, fullName, dateOfBirth } = req.query;
      const duplicates = await receptionistPatientService.checkDuplicates(phone, fullName, dateOfBirth);
      return ApiResponse.success(res, { duplicates }, 'Duplicate check completed');
    } catch (err) {
      next(err);
    }
  }

  async registerPatient(req, res, next) {
    try {
      const registeredById = req.user.id;
      const result = await receptionistPatientService.registerPatient(req.body, registeredById);
      if (result.duplicateWarning) {
        return ApiResponse.success(res, result, 'Potential duplicate patient detected', 200);
      }
      return ApiResponse.created(res, result.patient, 'Patient registered successfully');
    } catch (err) {
      next(err);
    }
  }

  async getPatientById(req, res, next) {
    try {
      const patient = await receptionistPatientService.getPatientById(req.params.patientId);
      return ApiResponse.success(res, patient, 'Patient safe profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async createPortalInvite(req, res, next) {
    try {
      const { patientId } = req.params;
      const receptionistUserId = req.user.id;
      const result = await receptionistPatientService.createPortalInvite(patientId, receptionistUserId, req.body);
      return ApiResponse.created(res, result, 'Patient portal invitation generated successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 3. Appointments ───────────────────────────────────────────
  async getAppointments(req, res, next) {
    try {
      const data = await receptionistAppointmentService.getAppointments(req.query);
      return ApiResponse.success(res, data, 'Appointments retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getCalendarAppointments(req, res, next) {
    try {
      const { startDate, endDate, doctorId } = req.query;
      const data = await receptionistAppointmentService.getCalendarAppointments(startDate, endDate, doctorId);
      return ApiResponse.success(res, data, 'Calendar appointments retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getDoctorAvailability(req, res, next) {
    try {
      const { doctorId, date } = req.query;
      const data = await receptionistAppointmentService.getDoctorAvailability(doctorId, date);
      return ApiResponse.success(res, data, 'Doctor availability slots retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async bookAppointment(req, res, next) {
    try {
      const bookedById = req.user.id;
      const appointment = await receptionistAppointmentService.bookAppointment(req.body, bookedById);
      return ApiResponse.created(res, appointment, 'Appointment booked successfully');
    } catch (err) {
      next(err);
    }
  }

  async rescheduleAppointment(req, res, next) {
    try {
      const { newDate, newTime } = req.body;
      const appointment = await receptionistAppointmentService.rescheduleAppointment(
        req.params.id,
        newDate,
        newTime
      );
      return ApiResponse.success(res, appointment, 'Appointment rescheduled successfully');
    } catch (err) {
      next(err);
    }
  }

  async cancelAppointment(req, res, next) {
    try {
      const { cancelReason } = req.body;
      const cancelledById = req.user.id;
      const appointment = await receptionistAppointmentService.cancelAppointment(
        req.params.id,
        cancelReason,
        cancelledById
      );
      return ApiResponse.success(res, appointment, 'Appointment cancelled successfully');
    } catch (err) {
      next(err);
    }
  }

  async getDoctorsList(req, res, next) {
    try {
      const data = await receptionistAppointmentService.getDoctorsList();
      return ApiResponse.success(res, data, 'Doctors list retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async checkInAppointment(req, res, next) {
    try {
      const appointment = await receptionistAppointmentService.checkInAppointment(req.params.id);
      return ApiResponse.success(res, appointment, 'Patient checked in successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 4. Admissions & Beds ──────────────────────────────────────
  async getAdmissions(req, res, next) {
    try {
      const data = await receptionistAdmissionService.getAdmissions(req.query);
      return ApiResponse.success(res, data, 'Admissions and bed matrix retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getAdmissionStats(req, res, next) {
    try {
      const data = await receptionistAdmissionService.getAdmissionStats();
      return ApiResponse.success(res, data, 'Admission stats retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getBedMatrix(req, res, next) {
    try {
      const data = await receptionistAdmissionService.getBedMatrix();
      return ApiResponse.success(res, data, 'Bed matrix retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 5. Emergency Intake ───────────────────────────────────────
  async getEmergencyList(req, res, next) {
    try {
      const data = await receptionistEmergencyService.getEmergencyList(req.query);
      return ApiResponse.success(res, data, 'Emergency registrations retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async createEmergency(req, res, next) {
    try {
      const registeredById = req.user.id;
      const emergency = await receptionistEmergencyService.createEmergency(req.body, registeredById);
      return ApiResponse.created(res, emergency, 'Emergency patient registered successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 6. Billing, Invoices & Payments ───────────────────────────
  async getServiceCatalog(req, res, next) {
    try {
      const catalog = await receptionistBillingService.getServiceCatalog(req.query.category);
      return ApiResponse.success(res, catalog, 'Service catalog retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getInvoices(req, res, next) {
    try {
      const data = await receptionistBillingService.getInvoices(req.query);
      return ApiResponse.success(res, data, 'Invoices retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getInvoiceById(req, res, next) {
    try {
      const invoice = await receptionistBillingService.getInvoiceById(req.params.id);
      return ApiResponse.success(res, invoice, 'Invoice retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async createInvoice(req, res, next) {
    try {
      const createdById = req.user.id;
      const invoice = await receptionistBillingService.createInvoice(req.body, createdById);
      return ApiResponse.created(res, invoice, 'Invoice created successfully');
    } catch (err) {
      next(err);
    }
  }

  async getPayments(req, res, next) {
    try {
      const data = await receptionistBillingService.getPayments(req.query);
      return ApiResponse.success(res, data, 'Payments retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async recordPayment(req, res, next) {
    try {
      const receivedById = req.user.id;
      const result = await receptionistBillingService.recordPayment(req.body, receivedById);
      return ApiResponse.created(res, result, 'Payment recorded successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── 7. Notifications ─────────────────────────────────────────
  async getNotifications(req, res, next) {
    try {
      const data = await receptionistNotificationService.getNotifications(req.user.id, req.query);
      return ApiResponse.success(res, data, 'Notifications retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const data = await receptionistNotificationService.getUnreadCount(req.user.id);
      return ApiResponse.success(res, data, 'Unread notification count retrieved');
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await receptionistNotificationService.markAsRead(req.user.id, req.params.id);
      return ApiResponse.success(res, notification, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await receptionistNotificationService.markAllAsRead(req.user.id);
      return ApiResponse.success(res, result, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }

  // ── 8. Profile ───────────────────────────────────────────────
  async getProfile(req, res, next) {
    try {
      const profile = await receptionistProfileService.getProfile(req.user.id, req.user.receptionistId);
      return ApiResponse.success(res, profile, 'Receptionist profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updated = await receptionistProfileService.updateProfile(
        req.user.id,
        req.user.receptionistId,
        req.body
      );
      return ApiResponse.success(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReceptionistController();
