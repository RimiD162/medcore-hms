const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// Valid state machine transitions
const ALLOWED_TRANSITIONS = {
  SCHEDULED: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

class AppointmentService {
  /**
   * List doctor-scoped appointments with flexible filters & views
   */
  async getAppointments(doctorId, query = {}) {
    const { view, status, search, startDate, endDate, page = 1, limit = 50 } = query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      doctorId,
    };

    // View filter
    if (view === 'today') {
      where.appointmentDate = {
        gte: today,
        lt: tomorrow,
      };
    } else if (view === 'upcoming') {
      where.appointmentDate = {
        gte: tomorrow,
      };
    } else if (view === 'past') {
      where.appointmentDate = {
        lt: today,
      };
    } else if (startDate && endDate) {
      where.appointmentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Search filter (patient name, ID, or appointment number)
    if (search) {
      where.OR = [
        { appointmentNumber: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
        { patient: { phone: { contains: search } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              age: true,
              gender: true,
              bloodGroup: true,
              phone: true,
              allergies: true,
              chronicConditions: true,
            },
          },
          consultation: {
            select: {
              id: true,
              status: true,
              chiefComplaint: true,
              diagnosis: true,
            },
          },
        },
        orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
        skip,
        take,
      }),
    ]);

    return {
      appointments,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get single appointment details
   */
  async getAppointmentById(doctorId, appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId },
      include: {
        patient: true,
        consultation: {
          include: {
            prescription: {
              include: { items: true },
            },
            medicalRecord: true,
          },
        },
      },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }

    return appointment;
  }

  /**
   * Transition appointment status enforcing state machine
   */
  async updateStatus(doctorId, appointmentId, newStatus, cancelReason = null) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }

    const currentStatus = appointment.status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw ApiError.badRequest(
        `Invalid appointment status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: [${allowed.join(', ')}]`
      );
    }

    if (newStatus === 'CANCELLED' && !cancelReason) {
      throw ApiError.badRequest('A cancellation reason is required to cancel an appointment');
    }

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: newStatus,
        cancelReason: newStatus === 'CANCELLED' ? cancelReason : appointment.cancelReason,
      },
      include: {
        patient: true,
      },
    });
  }

  /**
   * Reschedule appointment (changes date/time only, preserves allowed status)
   */
  async reschedule(doctorId, appointmentId, newDate, newTime) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }

    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
      throw ApiError.badRequest(
        `Cannot reschedule appointment with terminal status '${appointment.status}'`
      );
    }

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        appointmentDate: new Date(newDate),
        appointmentTime: newTime,
      },
      include: {
        patient: true,
      },
    });
  }

  /**
   * Toggle checked-in status for waiting queue management
   */
  async toggleCheckIn(doctorId, appointmentId, isCheckedIn) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        isCheckedIn: isCheckedIn !== undefined ? isCheckedIn : !appointment.isCheckedIn,
        checkedInAt: isCheckedIn ? new Date() : null,
      },
    });
  }
}

module.exports = new AppointmentService();
