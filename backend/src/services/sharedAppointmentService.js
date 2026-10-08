/**
 * Shared Appointment & Availability Domain Service
 * Single source of truth for Doctor availability slots, collision locks, and state transitions.
 * Enforces patient and staff rules server-side without duplicate logic.
 */

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const portalConfig = require('../config/portalConfig');
const { generateAppointmentNumber } = require('../utils/patientIdGenerator');
const patientNotificationService = require('./patientNotificationService');

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

class SharedAppointmentService {
  /**
   * Get available time slots for a doctor on a given date (Public & Patient Safe)
   * Only returns available slots; booked slots are masked as 'Booked' and unavailable
   */
  async getDoctorAvailability(doctorId, dateStr, isPatientView = false) {
    if (!doctorId || !dateStr) {
      throw ApiError.badRequest('doctorId and date (YYYY-MM-DD) are required');
    }

    const targetDate = parseDbDate(dateStr);
    if (!targetDate || isNaN(targetDate.getTime())) {
      throw ApiError.badRequest('Invalid date format. Expected YYYY-MM-DD');
    }

    const dayOfWeek = new Date(`${dateStr}T12:00:00.000Z`).getUTCDay();

    const [doctor, schedule, existingAppointments] = await Promise.all([
      prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        include: { user: { select: { fullName: true, avatarUrl: true } } },
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
          specialization: doctor.specialization,
          consultationFee: Number(doctor.consultationFee),
          avatarUrl: doctor.user.avatarUrl,
        },
        date: dateStr,
        dayOfWeek,
        isOffDuty: true,
        message: 'Doctor has no scheduled working hours on this day',
        slots: [],
      };
    }

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

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const isToday = dateStr === todayStr;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const minNoticeMinutes = portalConfig.minBookingNoticeHours * 60;

    while (startTotal + duration <= endTotal) {
      const slotH = Math.floor(startTotal / 60);
      const slotM = startTotal % 60;
      const timeStr = `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}`;

      const inBreak =
        breakStartTotal !== null &&
        breakEndTotal !== null &&
        startTotal >= breakStartTotal &&
        startTotal < breakEndTotal;

      const isPast = isToday && startTotal <= currentMinutes;
      const violatesNotice = isToday && isPatientView && (startTotal - currentMinutes < minNoticeMinutes);
      const isBooked = bookedTimes.has(timeStr);

      let status = 'Available';
      if (inBreak || isPast || violatesNotice) {
        status = 'Unavailable';
      } else if (isBooked) {
        status = 'Booked';
      }

      // In patient view, booked or unavailable slots are clearly marked non-selectable
      slots.push({
        time: timeStr,
        status: status === 'Available' ? 'Available' : 'Unavailable',
        isSelectable: status === 'Available',
      });

      startTotal += duration;
    }

    return {
      doctor: {
        id: doctor.id,
        name: doctor.user.fullName,
        department: doctor.department,
        specialization: doctor.specialization,
        roomNumber: doctor.roomNumber,
        consultationFee: Number(doctor.consultationFee),
        avatarUrl: doctor.user.avatarUrl,
      },
      date: dateStr,
      dayOfWeek,
      isOffDuty: false,
      workingHours: `${schedule.startTime} - ${schedule.endTime}`,
      slots: isPatientView ? slots.filter((s) => s.status === 'Available') : slots,
    };
  }

  /**
   * Book an Appointment (Patient or Staff initiator)
   */
  async bookAppointment({ patientId, doctorId, appointmentDate, appointmentTime, type = 'General', reason = null, isPatientActor = false, bookedByUserId = null }) {
    const targetDate = parseDbDate(appointmentDate);

    // 1. Verify Patient
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });
    if (!patient) {
      throw ApiError.notFound('Patient record not found');
    }

    // 2. Verify Doctor & Department
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });
    if (!doctor) {
      throw ApiError.notFound('Doctor profile not found');
    }

    // 3. Patient Specific Constraints
    if (isPatientActor) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const selectedDateStr = targetDate.toISOString().slice(0, 10);

      // Past date check
      if (selectedDateStr < todayStr) {
        throw ApiError.badRequest('Cannot book an appointment for a past date');
      }

      // Minimum Notice Window Check (if booking for today)
      if (selectedDateStr === todayStr) {
        const [slotH, slotM] = appointmentTime.split(':').map(Number);
        const slotTotalM = slotH * 60 + slotM;
        const currentTotalM = now.getHours() * 60 + now.getMinutes();
        if (slotTotalM - currentTotalM < portalConfig.minBookingNoticeHours * 60) {
          throw ApiError.badRequest(
            `Appointments must be booked at least ${portalConfig.minBookingNoticeHours} hours in advance.`
          );
        }
      }

      // Maximum Upcoming Appointments Limit
      const upcomingCount = await prisma.appointment.count({
        where: {
          patientId,
          appointmentDate: { gte: parseDbDate(todayStr) },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      });

      if (upcomingCount >= portalConfig.maxUpcomingAppointments) {
        throw ApiError.badRequest(
          `You have reached the maximum limit of ${portalConfig.maxUpcomingAppointments} active upcoming appointments.`
        );
      }

      // Patient Overlapping Appointment Guard (Patient cannot have 2 appointments at the same time with any doctor)
      const overlappingPatientApt = await prisma.appointment.findFirst({
        where: {
          patientId,
          appointmentDate: targetDate,
          appointmentTime,
          status: { notIn: ['CANCELLED'] },
        },
      });

      if (overlappingPatientApt) {
        throw ApiError.badRequest(
          `You already have an active appointment scheduled on ${appointmentDate} at ${appointmentTime}.`
        );
      }
    }

    // 4. Atomic Transaction for Slot Double-Booking Prevention
    const newAppointment = await prisma.$transaction(async (tx) => {
      // Re-check slot collision inside transaction
      const slotConflict = await tx.appointment.findFirst({
        where: {
          doctorId,
          appointmentDate: targetDate,
          appointmentTime,
          status: { notIn: ['CANCELLED'] },
        },
      });

      if (slotConflict) {
        throw ApiError.badRequest(
          `Slot ${appointmentTime} on ${appointmentDate} has just been booked. Please select another slot.`
        );
      }

      const appointmentNumber = await generateAppointmentNumber(tx);
      const initialStatus = (isPatientActor && !portalConfig.portalAutoConfirm) ? 'SCHEDULED' : 'CONFIRMED';

      const created = await tx.appointment.create({
        data: {
          appointmentNumber,
          doctorId,
          patientId,
          appointmentDate: targetDate,
          appointmentTime,
          type,
          status: initialStatus,
          reason,
          bookedById: bookedByUserId,
        },
        include: {
          doctor: {
            include: { user: true },
          },
          patient: true,
        },
      });

      // Doctor Notification
      await tx.notification.create({
        data: {
          userId: doctor.userId,
          title: 'New Appointment Booked',
          message: `${patient.fullName} booked for ${appointmentDate} at ${appointmentTime} (${type}).`,
          type: 'APPOINTMENT',
          entityType: 'Appointment',
          entityId: created.id,
        },
      });

      return created;
    }, { maxWait: 15000, timeout: 30000 });

    // Patient Notification (if booked by staff)
    if (!isPatientActor) {
      await patientNotificationService.notifyAppointmentConfirmed(patientId, newAppointment.id, appointmentDate);
    }

    return newAppointment;
  }

  /**
   * Reschedule Appointment
   */
  async rescheduleAppointment({ appointmentId, newDate, newTime, isPatientActor = false, patientId = null }) {
    const targetDate = parseDbDate(newDate);

    const where = { id: appointmentId };
    if (isPatientActor && patientId) {
      where.patientId = patientId;
    }

    const appointment = await prisma.appointment.findFirst({
      where,
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

    if (isPatientActor) {
      if (appointment.rescheduleCount >= portalConfig.maxReschedulesPerAppointment) {
        throw ApiError.badRequest(
          `This appointment has reached the maximum limit of ${portalConfig.maxReschedulesPerAppointment} reschedules.`
        );
      }

      // Check overlapping patient appointment on new date/time
      const overlap = await prisma.appointment.findFirst({
        where: {
          patientId: appointment.patientId,
          appointmentDate: targetDate,
          appointmentTime: newTime,
          status: { notIn: ['CANCELLED'] },
          id: { not: appointmentId },
        },
      });
      if (overlap) {
        throw ApiError.badRequest(`You already have an appointment on ${newDate} at ${newTime}.`);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
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
        throw ApiError.badRequest(`Slot ${newTime} on ${newDate} is unavailable. Please select another slot.`);
      }

      const res = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          appointmentDate: targetDate,
          appointmentTime: newTime,
          rescheduleCount: { increment: 1 },
          isCheckedIn: false,
          checkedInAt: null,
        },
        include: {
          doctor: { include: { user: true } },
          patient: true,
        },
      });

      // Doctor Notification
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

      return res;
    }, { maxWait: 15000, timeout: 30000 });

    if (!isPatientActor) {
      await patientNotificationService.notifyAppointmentRescheduled(appointment.patientId, updated.id, newDate, newTime);
    }

    return updated;
  }

  /**
   * Cancel Appointment
   */
  async cancelAppointment({ appointmentId, cancelReason, isPatientActor = false, patientId = null, cancelledByUserId = null }) {
    const where = { id: appointmentId };
    if (isPatientActor && patientId) {
      where.patientId = patientId;
    }

    const appointment = await prisma.appointment.findFirst({
      where,
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }

    if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      throw ApiError.badRequest(`Cannot cancel an appointment with status '${appointment.status}'`);
    }

    if (appointment.isCheckedIn) {
      throw ApiError.badRequest('Cannot cancel an appointment after the patient has checked in at the hospital.');
    }

    if (isPatientActor) {
      const now = new Date();
      const aptDateStr = appointment.appointmentDate.toISOString().slice(0, 10);
      const todayStr = now.toISOString().slice(0, 10);

      if (aptDateStr === todayStr) {
        const [slotH, slotM] = appointment.appointmentTime.split(':').map(Number);
        const slotTotalM = slotH * 60 + slotM;
        const currentTotalM = now.getHours() * 60 + now.getMinutes();
        if (slotTotalM - currentTotalM < portalConfig.minCancellationNoticeHours * 60) {
          throw ApiError.badRequest(
            `Cancellations must be requested at least ${portalConfig.minCancellationNoticeHours} hours before the appointment time.`
          );
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          cancelReason,
          cancelledAt: new Date(),
          cancelledById: cancelledByUserId,
        },
        include: {
          doctor: { include: { user: true } },
          patient: true,
        },
      });

      // Doctor Notification
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

    if (!isPatientActor) {
      await patientNotificationService.notifyAppointmentCancelled(appointment.patientId, updated.id);
    }

    return updated;
  }
}

module.exports = new SharedAppointmentService();
