const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class PharmacyProfileService {
  /**
   * Get pharmacist profile
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        employeeId: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        pharmacistProfile: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('Pharmacist user not found');
    }

    return user;
  }

  /**
   * Update permitted fields (phone, bio, shift, department)
   * Note: role, employeeId, licenseNumber, and permissions are immutable
   */
  async updateProfile(userId, data) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pharmacistProfile: true },
    });

    if (!user) {
      throw ApiError.notFound('Pharmacist user not found');
    }

    // Update user phone if provided
    if (data.phone !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone: data.phone },
      });
    }

    // Update pharmacistProfile fields
    if (user.pharmacistProfile) {
      await prisma.pharmacistProfile.update({
        where: { userId },
        data: {
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.shift && { shift: data.shift }),
          ...(data.department && { department: data.department }),
        },
      });
    }

    return this.getProfile(userId);
  }
}

module.exports = new PharmacyProfileService();
