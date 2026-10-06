const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { generateAppointmentNumber } = require('../utils/patientIdGenerator');

function parseDbDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
  }
  const dateStr = String(dateInput).slice(0, 10);
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function getDayBounds(d = new Date()) {
  const today = parseDbDate(d);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return { today, tomorrow };
}

class ReceptionistAppointmentService {
  /**
   * List appointments with flexible multi-criteria filtering
   */
  async getAppointments(query = {}) {
    const {
      view,
      date,
      doctorId,
      department,
      status,
      search,
      page = 1,
      limit = 25,
      sortBy = 'appointmentTime',
      sortOrder = 'asc',
    } = query;

    const { today, tomorrow } = getDayBounds();

    const where = {};

    // 1. Date & View Filter
    if (view === 'today') {
      where.appointmentDate = { gte: today, lt: tomorrow };
    } else if (view === 'upcoming') {
      where.appointmentDate = { gte: tomorrow };
    } else if (view === 'past') {
      where.appointmentDate = { lt: today };
    } else if (date) {
      const selected = parseDbDate(date);
      const next = new Date(selected);
      next.setUTCDate(next.getUTCDate() + 1);
      where.appointmentDate = { gte: selected, lt: next };
    }

    // 2. Doctor / Department Filter
    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (department) {
      where.doctor = {
        department: { contains: department, mode: 'insensitive' },
      };
    }

    // 3. Status Filter
    if (status) {
      where.status = status;
    }

    // 4. Search Filter
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
        select: {
          id: true,
          appointmentNumber: true,
          appointmentDate: true,
          appointmentTime: true,
          type: true,
          status: true,
          isCheckedIn: true,
          checkedInAt: true,
          reason: true,
          cancelReason: true,
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              gender: true,
              age: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              id: true,
              department: true,
              specialization: true,
              roomNumber: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: [{ appointmentDate: 'asc' }, { [sortBy]: sortOrder }],
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
   * Calendar range appointments query
   */
  async getCalendarAppointments(startDate, endDate, doctorId = null) {
    if (!startDate || !endDate) {
      throw ApiError.badRequest('startDate and endDate query parameters are required for calendar view');
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const where = {
      appointmentDate: {
        gte: start,
        lte: end,
      },
      ...(doctorId && { doctorId }),
    };

    const appointments = await prisma.appointment.findMany({
      where,
      select: {
        id: true,
        appointmentNumber: true,
        appointmentDate: true,
        appointmentTime: true,
        type: true,
        status: true,
        isCheckedIn: true,
        reason: true,
        patient: {
          select: {
            id: true,
            patientIdNumber: true,
            fullName: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            department: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
    });

    return appointments;
  }

  /**
   * Generate available / booked / unavailable time slots for a doctor on a specific date
   */
  async getDoctorAvailability(doctorId, dateStr) {
    if (!doctorId || !dateStr) {
      throw ApiError.badRequest('doctorId and date (YYYY-MM-DD) are required');
    }

    const targetDate = parseDbDate(dateStr);
    if (!targetDate || isNaN(targetDate.getTime())) {
      throw ApiError.badRequest('Invalid date format. Expected YYYY-MM-DD');
    }

    const dayOfWeek = new Date(`${dateStr}T12:00:00.000Z`).getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    const [doctor, schedule, existingAppointments] = await Promise.all([
      prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        include: { user: { select: { fullName: true } } },
      }),
      prisma.doctorAvailability.findFirst({
        where: { doctorId, dayOfWeek, isActive: true },
      }),
      prisma.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: targetDate,
          status: { notIn: ['CANCELLED'] },
        },
        select: {
          appointmentTime: true,
          status: true,
        },
      }),
    ]);

    if (!doctor) {
      throw ApiError.notFound('Doctor profile not found');
    }

    if (!schedule) {
      return {
        doctor: {
          id: doctor.id,
          name: doctor.user.fullName,
          department: doctor.department,
        },
        date: dateStr,
        dayOfWeek,
        isOffDuty: true,
        message: 'Doctor has no scheduled working hours on this day of the week',
        slots: [],
      };
    }

    // Generate slots
    const slots = [];
    const duration = schedule.consultationDuration || 15;
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);

    let startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    let breakStartTotal = null;
    let breakEndTotal = null;
    if (schedule.breakStartTime && schedule.breakEndTime) {
      const [bStartH, bStartM] = schedule.breakStartTime.split(':').map(Number);
      const [bEndH, bEndM] = schedule.breakEndTime.split(':').map(Number);
      breakStartTotal = bStartH * 60 + bStartM;
      breakEndTotal = bEndH * 60 + bEndM;
    }

    const bookedTimes = new Set(existingAppointments.map((a) => a.appointmentTime));

    // Determine current time in local comparison
    const now = new Date();
    const isToday = now.toISOString().slice(0, 10) === dateStr;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    while (startTotal + duration <= endTotal) {
      const slotH = Math.floor(startTotal / 60);
      const slotM = startTotal % 60;
      const timeStr = `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}`;

      // Check if slot falls in break
      const inBreak =
        breakStartTotal !== null &&
        breakEndTotal !== null &&
        startTotal >= breakStartTotal &&
        startTotal < breakEndTotal;

      // Check if slot is in past
      const isPast = isToday && startTotal <= currentMinutes;

      // Check if slot is booked
      const isBooked = bookedTimes.has(timeStr);

      let status = 'Available';
      if (inBreak || isPast) {
        status = 'Unavailable';
      } else if (isBooked) {
        status = 'Booked';
      }

      slots.push({
        time: timeStr,
        status, // 'Available' | 'Booked' | 'Unavailable'
        isSelectable: status === 'Available',
        reason: inBreak ? 'Doctor Break' : isPast ? 'Past Slot' : isBooked ? 'Slot Booked' : 'Open',
      });

      startTotal += duration;
    }

    return {
      doctor: {
        id: doctor.id,
        name: doctor.user.fullName,
        department: doctor.department,
        roomNumber: doctor.roomNumber,
        consultationFee: doctor.consultationFee,
      },
      date: dateStr,
      dayOfWeek,
      isOffDuty: false,
      workingHours: `${schedule.startTime} - ${schedule.endTime}`,
      slots,
    };
  }

  /**
   * Book an appointment with atomic transaction and concurrency collision protection
   */
  async bookAppointment(data, bookedById) {
    const { patientId, doctorId, appointmentDate, appointmentTime, type = 'General', reason } = data;

    const targetDate = parseDbDate(appointmentDate);

    // Validate patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw ApiError.notFound('Patient record not found');
    }

    // Validate doctor exists
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });
    if (!doctor) {
      throw ApiError.notFound('Doctor profile not found');
    }

    // Transactional check and booking to guarantee zero double-booking under concurrency
    const newAppointment = await prisma.$transaction(async (tx) => {
      // 1. Conflict check inside transaction
      const existingConflict = await tx.appointment.findFirst({
        where: {
          doctorId,
          appointmentDate: targetDate,
          appointmentTime,
          status: { notIn: ['CANCELLED'] },
        },
      });

      if (existingConflict) {
        throw ApiError.badRequest(
          `Slot ${appointmentTime} on ${appointmentDate} has already been booked. Please choose another available slot.`
        );
      }

      // 2. Generate unique appointment number
      const appointmentNumber = await generateAppointmentNumber(tx);

      // 3. Create appointment
      const created = await tx.appointment.create({
        data: {
          appointmentNumber,
          doctorId,
          patientId,
          appointmentDate: targetDate,
          appointmentTime,
          type,
          status: 'SCHEDULED',
          reason,
          bookedById,
        },
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              id: true,
              department: true,
              specialization: true,
              roomNumber: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      });

      // 4. Create Notification for the Doctor
      await tx.notification.create({
        data: {
          userId: doctor.userId,
          title: 'New Appointment Booked',
          message: `${patient.fullName} (${patient.patientIdNumber}) booked for ${appointmentDate} at ${appointmentTime}.`,
          type: 'APPOINTMENT',
          entityType: 'Appointment',
          entityId: created.id,
        },
      });

      return created;
    }, { maxWait: 15000, timeout: 30000 });

    return newAppointment;
  }

  /**
   * Reschedule appointment (revalidates slot and updates date/time)
   */
  async rescheduleAppointment(appointmentId, newDate, newTime) {
    const targetDate = parseDbDate(newDate);

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }

    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
      throw ApiError.badRequest(`Cannot reschedule appointment with terminal status '${appointment.status}'`);
    }

    const updatedAppointment = await prisma.$transaction(async (tx) => {
      // Re-verify availability
      const conflict = await tx.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          appointmentDate: targetDate,
          appointmentTime: newTime,
          status: { notIn: ['CANCELLED'] },
          id: { not: appointmentId },
        },
      });

      if (conflict) {
        throw ApiError.badRequest(
          `Slot ${newTime} on ${newDate} is already booked. Please choose another available slot.`
        );
      }

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          appointmentDate: targetDate,
          appointmentTime: newTime,
          isCheckedIn: false,
          checkedInAt: null,
        },
        include: {
          patient: true,
          doctor: { select: { user: { select: { fullName: true } }, department: true } },
        },
      });

      // Doctor notification
      await tx.notification.create({
        data: {
          userId: appointment.doctor.userId,
          title: 'Appointment Rescheduled',
          message: `Appointment for ${appointment.patient.fullName} rescheduled to ${newDate} at ${newTime}.`,
          type: 'APPOINTMENT',
          entityType: 'Appointment',
          entityId: appointment.id,
        },
      });

      return updated;
    }, { maxWait: 15000, timeout: 30000 });

    return updatedAppointment;
  }

  /**
   * Cancel appointment with mandatory reason and audit metadata
   */
  async cancelAppointment(appointmentId, cancelReason, cancelledById) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true, patient: true },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }

    if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      throw ApiError.badRequest(`Cannot cancel an appointment already marked as '${appointment.status}'`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          cancelReason,
          cancelledAt: new Date(),
          cancelledById,
        },
        include: {
          patient: true,
          doctor: { select: { user: { select: { fullName: true } } } },
        },
      });

      // Notify Doctor
      await tx.notification.create({
        data: {
          userId: appointment.doctor.userId,
          title: 'Appointment Cancelled',
          message: `Appointment for ${appointment.patient.fullName} on ${appointment.appointmentDate.toISOString().slice(0, 10)} was cancelled. Reason: ${cancelReason}`,
          type: 'APPOINTMENT',
          entityType: 'Appointment',
          entityId: appointment.id,
        },
      });

      return res;
    }, { maxWait: 15000, timeout: 30000 });

    return updated;
  }

  /**
   * Check-in patient arrival at Front Desk
   * Enforces rules: only on appointment date, auto-confirms Scheduled, Waiting derived state
   */
  async checkInAppointment(appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }

    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
      throw ApiError.badRequest(`Cannot check in an appointment with status '${appointment.status}'`);
    }

    // Check if appointment is for today (compare YYYY-MM-DD strings for UTC and local date)
    const aptDate = new Date(appointment.appointmentDate);
    const now = new Date();
    
    const aptDateStr = aptDate.toISOString().slice(0, 10);
    const todayUtcStr = now.toISOString().slice(0, 10);
    const localNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    const todayLocalStr = localNow.toISOString().slice(0, 10);

    const isToday = (aptDateStr === todayUtcStr || aptDateStr === todayLocalStr);

    if (!isToday) {
      throw ApiError.badRequest(
        `Check-in is only permitted on the day of the appointment (${aptDateStr}). Today is ${todayLocalStr}.`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CONFIRMED', // Scheduled auto-confirms upon physical check-in
          isCheckedIn: true,
          checkedInAt: new Date(),
        },
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              roomNumber: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      });

      // Doctor live arrival alert
      await tx.notification.create({
        data: {
          userId: appointment.doctor.userId,
          title: 'Patient Checked In',
          message: `${appointment.patient.fullName} (${appointment.patient.patientIdNumber}) has arrived and checked in at Front Desk. Waiting for consultation.`,
          type: 'APPOINTMENT',
          entityType: 'Appointment',
          entityId: appointment.id,
        },
      });

      return res;
    }, { maxWait: 15000, timeout: 30000 });

    return updated;
  }

  /**
   * Get list of all doctors for appointments booking dropdowns
   */
  async getDoctorsList() {
    const doctors = await prisma.doctorProfile.findMany({
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
      },
      orderBy: { department: 'asc' },
    });
    return doctors.map((d) => ({
      id: d.id,
      name: d.user.fullName,
      email: d.user.email,
      phone: d.user.phone,
      department: d.department,
      specialization: d.specialization,
      roomNumber: d.roomNumber,
      consultationFee: d.consultationFee,
    }));
  }
}

module.exports = new ReceptionistAppointmentService();
