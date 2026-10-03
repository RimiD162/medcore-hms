const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class NurseAdmissionService {
  /**
   * Get list of inpatient admissions (active or historical)
   */
  async getAdmissions(query = {}) {
    const { status, ward, search, limit = 50, page = 1 } = query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {};
    if (status) where.status = status;
    if (ward) where.ward = { contains: ward, mode: 'insensitive' };

    if (search) {
      where.OR = [
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
        { admittingDiagnosis: { contains: search, mode: 'insensitive' } },
        { bedNumber: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.admission.count({ where });
    const admissions = await prisma.admission.findMany({
      where,
      skip,
      take: parseInt(limit, 10),
      orderBy: { admittedDate: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            patientIdNumber: true,
            age: true,
            gender: true,
            bloodGroup: true,
            allergies: true,
          },
        },
      },
    });

    return {
      admissions,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  }

  /**
   * Get single admission detail
   */
  async getAdmissionById(id) {
    const admission = await prisma.admission.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!admission) {
      throw ApiError.notFound('Admission record not found');
    }

    return admission;
  }
}

module.exports = new NurseAdmissionService();
