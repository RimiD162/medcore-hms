const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class ReceptionistProfileService {
  /**
   * Get logged-in receptionist profile & workspace context
   */
  async getProfile(userId, receptionistId) {
    const profile = await prisma.receptionistProfile.findFirst({
      where: receptionistId ? { id: receptionistId } : { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            role: true,
            employeeId: true,
            isActive: true,
          },
        },
      },
    });

    if (!profile) {
      throw ApiError.notFound('Receptionist profile not found');
    }

    return profile;
  }

  /**
   * Update receptionist profile (allowed fields only: fullName, phone, shift, bio, avatarUrl)
   * Role, permissions, and employeeId remain immutable
   */
  async updateProfile(userId, receptionistId, data) {
    const { fullName, phone, avatarUrl, shift, bio } = data;

    const profile = await prisma.receptionistProfile.findFirst({
      where: receptionistId ? { id: receptionistId } : { userId },
    });

    if (!profile) {
      throw ApiError.notFound('Receptionist profile not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (fullName || phone || avatarUrl) {
        await tx.user.update({
          where: { id: profile.userId },
          data: {
            ...(fullName && { fullName }),
            ...(phone && { phone }),
            ...(avatarUrl && { avatarUrl }),
          },
        });
      }

      return tx.receptionistProfile.update({
        where: { id: profile.id },
        data: {
          ...(phone && { phone }),
          ...(shift && { shift }),
          ...(bio !== undefined && { bio }),
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              role: true,
              employeeId: true,
            },
          },
        },
      });
    });

    return updated;
  }
}

module.exports = new ReceptionistProfileService();
