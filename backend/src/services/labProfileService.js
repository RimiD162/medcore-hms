const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class LabProfileService {
  /**
   * Get laboratory technician profile for logged in user
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        labTechnicianProfile: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Auto-provision profile if missing
    if (!user.labTechnicianProfile && user.role === 'LAB_TECHNICIAN') {
      const profile = await prisma.labTechnicianProfile.create({
        data: {
          userId: user.id,
          employeeId: `LAB-EMP-${user.id.slice(0, 4).toUpperCase()}`,
          department: 'Clinical Pathology',
          specialization: 'General Diagnostics & Hematology',
          isSeniorVerifier: user.email.includes('verifier') || user.email.includes('senior'),
        },
      });
      return { ...user, labTechnicianProfile: profile };
    }

    return user;
  }

  /**
   * Update profile details
   */
  async updateProfile(userId, data) {
    const { fullName, phone, department, specialization, certifications, shiftSchedule } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { labTechnicianProfile: true },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return prisma.$transaction(async (tx) => {
      if (fullName || phone) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(fullName && { fullName }),
            ...(phone && { phone }),
          },
        });
      }

      if (user.labTechnicianProfile) {
        await tx.labTechnicianProfile.update({
          where: { userId },
          data: {
            ...(department && { department }),
            ...(specialization && { specialization }),
            ...(certifications && { certifications }),
            ...(shiftSchedule && { shiftSchedule }),
          },
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: { labTechnicianProfile: true },
      });
    });
  }
}

module.exports = new LabProfileService();
