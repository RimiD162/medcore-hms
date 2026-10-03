const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class DoctorProfileService {
  /**
   * Get logged-in doctor profile and statistics
   */
  async getProfile(userId, doctorId) {
    const doctor = await prisma.doctorProfile.findFirst({
      where: doctorId ? { id: doctorId } : { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            role: true,
            isActive: true,
          },
        },
        availabilities: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        _count: {
          select: {
            appointments: true,
            consultations: true,
            prescriptions: true,
          },
        },
      },
    });

    if (!doctor) {
      throw ApiError.notFound('Doctor profile not found');
    }

    return doctor;
  }

  /**
   * Update doctor profile details
   */
  async updateProfile(userId, doctorId, data) {
    const { fullName, phone, avatarUrl, ...profileData } = data;

    const doctor = await prisma.doctorProfile.findFirst({
      where: doctorId ? { id: doctorId } : { userId },
    });

    if (!doctor) {
      throw ApiError.notFound('Doctor profile not found');
    }

    // Atomic update of user details + doctor profile
    const updated = await prisma.$transaction(async (tx) => {
      if (fullName || phone || avatarUrl) {
        await tx.user.update({
          where: { id: doctor.userId },
          data: {
            ...(fullName && { fullName }),
            ...(phone && { phone }),
            ...(avatarUrl && { avatarUrl }),
          },
        });
      }

      return tx.doctorProfile.update({
        where: { id: doctor.id },
        data: profileData,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      });
    });

    return updated;
  }

  /**
   * List weekly availability schedules
   */
  async getAvailability(doctorId) {
    return prisma.doctorAvailability.findMany({
      where: { doctorId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Create availability schedule slot with overlap validation
   */
  async createAvailability(doctorId, data) {
    const { dayOfWeek, startTime, endTime, breakStartTime, breakEndTime, consultationDuration, isActive } = data;

    // Check for overlapping schedule on the same day for this doctor
    await this.validateNoScheduleOverlap(doctorId, dayOfWeek, startTime, endTime);

    return prisma.doctorAvailability.create({
      data: {
        doctorId,
        dayOfWeek,
        startTime,
        endTime,
        breakStartTime: breakStartTime || null,
        breakEndTime: breakEndTime || null,
        consultationDuration: consultationDuration || 15,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
  }

  /**
   * Update availability schedule slot
   */
  async updateAvailability(doctorId, availabilityId, data) {
    const existing = await prisma.doctorAvailability.findFirst({
      where: { id: availabilityId, doctorId },
    });

    if (!existing) {
      throw ApiError.notFound('Availability schedule not found');
    }

    const dayOfWeek = data.dayOfWeek !== undefined ? data.dayOfWeek : existing.dayOfWeek;
    const startTime = data.startTime || existing.startTime;
    const endTime = data.endTime || existing.endTime;

    // Check for overlap excluding current record
    await this.validateNoScheduleOverlap(doctorId, dayOfWeek, startTime, endTime, availabilityId);

    return prisma.doctorAvailability.update({
      where: { id: availabilityId },
      data: {
        ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.breakStartTime !== undefined && { breakStartTime: data.breakStartTime }),
        ...(data.breakEndTime !== undefined && { breakEndTime: data.breakEndTime }),
        ...(data.consultationDuration !== undefined && { consultationDuration: data.consultationDuration }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  /**
   * Delete availability slot
   */
  async deleteAvailability(doctorId, availabilityId) {
    const existing = await prisma.doctorAvailability.findFirst({
      where: { id: availabilityId, doctorId },
    });

    if (!existing) {
      throw ApiError.notFound('Availability schedule not found');
    }

    await prisma.doctorAvailability.delete({
      where: { id: availabilityId },
    });

    return { message: 'Availability schedule deleted successfully' };
  }

  /**
   * Toggle availability slot active status
   */
  async toggleAvailability(doctorId, availabilityId) {
    const existing = await prisma.doctorAvailability.findFirst({
      where: { id: availabilityId, doctorId },
    });

    if (!existing) {
      throw ApiError.notFound('Availability schedule not found');
    }

    return prisma.doctorAvailability.update({
      where: { id: availabilityId },
      data: { isActive: !existing.isActive },
    });
  }

  /**
   * Helper to ensure no overlapping schedules on the same day
   */
  async validateNoScheduleOverlap(doctorId, dayOfWeek, newStart, newEnd, excludeId = null) {
    const schedules = await prisma.doctorAvailability.findMany({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    const newStartMin = this.timeToMinutes(newStart);
    const newEndMin = this.timeToMinutes(newEnd);

    for (const schedule of schedules) {
      const existStartMin = this.timeToMinutes(schedule.startTime);
      const existEndMin = this.timeToMinutes(schedule.endTime);

      // Overlap formula: (StartA < EndB) and (EndA > StartB)
      if (newStartMin < existEndMin && newEndMin > existStartMin) {
        throw ApiError.badRequest(
          `Schedule overlaps with an existing time slot (${schedule.startTime} - ${schedule.endTime}) on this day`
        );
      }
    }
  }

  timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }
}

module.exports = new DoctorProfileService();
