const patientPortalService = require('../services/patientPortalService');
const ApiResponse = require('../utils/ApiResponse');
const {
  updateProfileSchema,
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  initiatePaymentSchema,
  uploadDocumentSchema,
  searchSchema,
} = require('../validators/patientValidators');

class PatientPortalController {
  // ── Dashboard & Profile ──
  async getDashboard(req, res, next) {
    try {
      const data = await patientPortalService.getDashboard(req.patient.id);
      return ApiResponse.success(res, data, 'Patient dashboard retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req, res, next) {
    try {
      const data = await patientPortalService.getProfile(req.patient.id);
      return ApiResponse.success(res, data, 'Patient profile retrieved');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const validated = updateProfileSchema.parse(req.body);
      const data = await patientPortalService.updateProfile(req.patient.id, validated);
      return ApiResponse.success(res, data, 'Patient profile updated');
    } catch (err) {
      next(err);
    }
  }

  // ── Appointments ──
  async getAppointments(req, res, next) {
    try {
      const data = await patientPortalService.getAppointments(req.patient.id, req.query);
      return ApiResponse.success(res, data, 'Appointments retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getAppointmentById(req, res, next) {
    try {
      const data = await patientPortalService.getAppointmentById(req.patient.id, req.params.appointmentId);
      return ApiResponse.success(res, data, 'Appointment details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getDoctors(req, res, next) {
    try {
      const data = await patientPortalService.getDoctors(req.query);
      return ApiResponse.success(res, data, 'Doctors directory retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getDoctorAvailability(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;
      const data = await patientPortalService.getDoctorAvailability(doctorId, date);
      return ApiResponse.success(res, data, 'Doctor availability slots retrieved');
    } catch (err) {
      next(err);
    }
  }

  async bookAppointment(req, res, next) {
    try {
      const validated = bookAppointmentSchema.parse(req.body);
      const data = await patientPortalService.bookAppointment(req.patient.id, validated);
      return ApiResponse.created(res, data, 'Appointment booked successfully');
    } catch (err) {
      next(err);
    }
  }

  async rescheduleAppointment(req, res, next) {
    try {
      const validated = rescheduleAppointmentSchema.parse(req.body);
      const data = await patientPortalService.rescheduleAppointment(
        req.patient.id,
        req.params.appointmentId,
        validated
      );
      return ApiResponse.success(res, data, 'Appointment rescheduled successfully');
    } catch (err) {
      next(err);
    }
  }

  async cancelAppointment(req, res, next) {
    try {
      const validated = cancelAppointmentSchema.parse(req.body);
      const data = await patientPortalService.cancelAppointment(
        req.patient.id,
        req.params.appointmentId,
        validated
      );
      return ApiResponse.success(res, data, 'Appointment cancelled successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── Medical Records & Prescriptions ──
  async getMedicalRecords(req, res, next) {
    try {
      const data = await patientPortalService.getMedicalRecords(req.patient.id, req.query);
      return ApiResponse.success(res, data, 'Medical records retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getMedicalRecordById(req, res, next) {
    try {
      const data = await patientPortalService.getMedicalRecordById(req.patient.id, req.params.recordId);
      return ApiResponse.success(res, data, 'Medical record retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getPrescriptions(req, res, next) {
    try {
      const data = await patientPortalService.getPrescriptions(req.patient.id, req.query);
      return ApiResponse.success(res, data, 'Prescriptions retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getPrescriptionById(req, res, next) {
    try {
      const data = await patientPortalService.getPrescriptionById(req.patient.id, req.params.prescriptionId);
      return ApiResponse.success(res, data, 'Prescription details retrieved');
    } catch (err) {
      next(err);
    }
  }

  // ── Lab Reports ──
  async getLabReports(req, res, next) {
    try {
      const data = await patientPortalService.getLabReports(req.patient.id, req.query);
      return ApiResponse.success(res, data, 'Released laboratory reports retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getLabReportById(req, res, next) {
    try {
      const data = await patientPortalService.getLabReportById(req.patient.id, req.params.reportId);
      return ApiResponse.success(res, data, 'Laboratory report retrieved');
    } catch (err) {
      next(err);
    }
  }

  // ── Billing & Payments ──
  async getInvoices(req, res, next) {
    try {
      const data = await patientPortalService.getInvoices(req.patient.id, req.query);
      return ApiResponse.success(res, data, 'Invoices retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getInvoiceById(req, res, next) {
    try {
      const data = await patientPortalService.getInvoiceById(req.patient.id, req.params.invoiceId);
      return ApiResponse.success(res, data, 'Invoice details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getPayments(req, res, next) {
    try {
      const data = await patientPortalService.getPayments(req.patient.id, req.query);
      return ApiResponse.success(res, data, 'Payments history retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getPaymentOptions(req, res, next) {
    try {
      const data = await patientPortalService.getPaymentOptions(req.patient.id, req.params.invoiceId);
      return ApiResponse.success(res, data, 'Payment options retrieved');
    } catch (err) {
      next(err);
    }
  }

  async initiatePayment(req, res, next) {
    try {
      const validated = initiatePaymentSchema.parse(req.body);
      const data = await patientPortalService.initiatePayment(
        req.patient.id,
        req.params.invoiceId,
        validated
      );
      return ApiResponse.success(res, data, 'Payment initiated');
    } catch (err) {
      next(err);
    }
  }

  // ── Document Vault ──
  async getDocuments(req, res, next) {
    try {
      const data = await patientPortalService.getDocuments(req.patient.id, req.query);
      return ApiResponse.success(res, data, 'Documents retrieved');
    } catch (err) {
      next(err);
    }
  }

  async uploadDocument(req, res, next) {
    try {
      const validated = uploadDocumentSchema.parse(req.body);
      const data = await patientPortalService.uploadDocument(
        req.patient.id,
        req.user.id,
        validated
      );
      return ApiResponse.created(res, data, 'Document uploaded successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const data = await patientPortalService.deleteDocument(req.patient.id, req.params.documentId);
      return ApiResponse.success(res, data, 'Document removed');
    } catch (err) {
      next(err);
    }
  }

  // ── Insurance ──
  async getInsurance(req, res, next) {
    try {
      const data = await patientPortalService.getInsurance(req.patient.id);
      return ApiResponse.success(res, data, 'Insurance policies and claims retrieved');
    } catch (err) {
      next(err);
    }
  }

  // ── Health Timeline & Search ──
  async getTimeline(req, res, next) {
    try {
      const data = await patientPortalService.getTimeline(req.patient.id);
      return ApiResponse.success(res, data, 'Health timeline events retrieved');
    } catch (err) {
      next(err);
    }
  }

  async search(req, res, next) {
    try {
      const validated = searchSchema.parse(req.query);
      const data = await patientPortalService.search(req.patient.id, validated);
      return ApiResponse.success(res, data, 'Search results retrieved');
    } catch (err) {
      next(err);
    }
  }

  // ── Notifications ──
  async getNotifications(req, res, next) {
    try {
      const data = await patientPortalService.getNotifications(req.user.id, req.query);
      return ApiResponse.success(res, data, 'Notifications retrieved');
    } catch (err) {
      next(err);
    }
  }

  async markNotificationRead(req, res, next) {
    try {
      const data = await patientPortalService.markNotificationRead(req.user.id, req.params.notificationId);
      return ApiResponse.success(res, data, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  async markAllNotificationsRead(req, res, next) {
    try {
      const data = await patientPortalService.markAllNotificationsRead(req.user.id);
      return ApiResponse.success(res, data, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PatientPortalController();
