const appointmentService = require('../services/appointmentService');
const ApiResponse = require('../utils/ApiResponse');

class AppointmentController {
  async getAppointments(req, res, next) {
    try {
      const data = await appointmentService.getAppointments(req.user.doctorId, req.query);
      return ApiResponse.success(res, data, 'Appointments retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getAppointmentById(req, res, next) {
    try {
      const appointment = await appointmentService.getAppointmentById(
        req.user.doctorId,
        req.params.id
      );
      return ApiResponse.success(res, appointment, 'Appointment details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status, cancelReason } = req.body;
      const updated = await appointmentService.updateStatus(
        req.user.doctorId,
        req.params.id,
        status,
        cancelReason
      );
      return ApiResponse.success(res, updated, `Appointment status updated to ${status}`);
    } catch (err) {
      next(err);
    }
  }

  async reschedule(req, res, next) {
    try {
      const { appointmentDate, appointmentTime } = req.body;
      const updated = await appointmentService.reschedule(
        req.user.doctorId,
        req.params.id,
        appointmentDate,
        appointmentTime
      );
      return ApiResponse.success(res, updated, 'Appointment rescheduled successfully');
    } catch (err) {
      next(err);
    }
  }

  async toggleCheckIn(req, res, next) {
    try {
      const { isCheckedIn } = req.body;
      const updated = await appointmentService.toggleCheckIn(
        req.user.doctorId,
        req.params.id,
        isCheckedIn
      );
      return ApiResponse.success(res, updated, 'Appointment check-in status updated');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AppointmentController();
