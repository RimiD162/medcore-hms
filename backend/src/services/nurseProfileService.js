const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class NurseProfileService {
  async getProfile(userId, nurseId) {
    const id = nurseId || userId;
    if (!id) {
      throw ApiError.badRequest('Nurse ID or User ID is required');
    }

    const nurse = await prisma.nurseProfile.findFirst({
      where: {
        OR: [{ id }, { userId }],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            employeeId: true,
            avatarUrl: true,
            role: true,
            isActive: true,
            isVerified: true,
            hospital: {
              select: {
                id: true,
                name: true,
                city: true,
                phone: true,
              },
            },
          },
        },
        assignments: {
          where: { isActive: true },
          include: {
            patient: {
              select: {
                id: true,
                patientIdNumber: true,
                fullName: true,
                gender: true,
                age: true,
              },
            },
          },
        },
      },
    });

    if (!nurse) {
      throw ApiError.notFound('Nurse profile not found');
    }

    return nurse;
  }

  async updateProfile(userId, nurseId, payload) {
    const id = nurseId || userId;
    if (!id) {
      throw ApiError.badRequest('Nurse ID or User ID is required');
    }

    const nurse = await prisma.nurseProfile.findFirst({
      where: {
        OR: [{ id }, { userId }],
      },
    });

    if (!nurse) {
      throw ApiError.notFound('Nurse profile not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedNurse = await tx.nurseProfile.update({
        where: { id: nurse.id },
        data: {
          bio: payload.bio !== undefined ? payload.bio : nurse.bio,
          phone: payload.phone !== undefined ? payload.phone : nurse.phone,
          shift: payload.shift !== undefined ? payload.shift : nurse.shift,
        },
      });

      if (payload.phone) {
        await tx.user.update({
          where: { id: nurse.userId },
          data: { phone: payload.phone },
        });
      }

      return updatedNurse;
    });

    return updated;
  }
}

module.exports = new NurseProfileService();
