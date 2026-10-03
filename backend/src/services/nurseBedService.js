const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class NurseBedService {
  /**
   * Get all beds with ward statistics and active patient details
   */
  async getBeds(query = {}) {
    const { ward, status, roomNumber } = query;

    const where = {};
    if (ward) where.ward = { contains: ward, mode: 'insensitive' };
    if (status) where.status = status;
    if (roomNumber) where.roomNumber = roomNumber;

    const beds = await prisma.bed.findMany({
      where,
      orderBy: [{ ward: 'asc' }, { roomNumber: 'asc' }, { bedNumber: 'asc' }],
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            patientIdNumber: true,
            age: true,
            gender: true,
            allergies: true,
            admissions: {
              where: { status: 'ADMITTED' },
              take: 1,
            },
          },
        },
      },
    });

    // Compute stats
    const totalBeds = beds.length;
    const availableBeds = beds.filter((b) => b.status === 'AVAILABLE').length;
    const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED').length;
    const reservedBeds = beds.filter((b) => b.status === 'RESERVED').length;
    const maintenanceBeds = beds.filter((b) => b.status === 'MAINTENANCE').length;

    // Group by Ward
    const wardGroups = beds.reduce((acc, bed) => {
      if (!acc[bed.ward]) {
        acc[bed.ward] = [];
      }
      acc[bed.ward].push({
        id: bed.id,
        bedNumber: bed.bedNumber,
        ward: bed.ward,
        roomNumber: bed.roomNumber,
        status: bed.status,
        patient: bed.patient
          ? {
              id: bed.patient.id,
              fullName: bed.patient.fullName,
              patientIdNumber: bed.patient.patientIdNumber,
              age: bed.patient.age,
              gender: bed.patient.gender,
              diagnosis: bed.patient.admissions[0]?.admittingDiagnosis || 'Under Observation',
              admittedDate: bed.patient.admissions[0]?.admittedDate || null,
              attendingDoctor: bed.patient.admissions[0]?.attendingDoctor || null,
            }
          : null,
      });
      return acc;
    }, {});

    return {
      stats: {
        totalBeds,
        availableBeds,
        occupiedBeds,
        reservedBeds,
        maintenanceBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      },
      wardGroups,
      beds: beds.map((b) => ({
        id: b.id,
        bedNumber: b.bedNumber,
        ward: b.ward,
        roomNumber: b.roomNumber,
        status: b.status,
        patient: b.patient || null,
      })),
    };
  }

  /**
   * Update bed operational status (AVAILABLE, RESERVED, MAINTENANCE)
   */
  async updateBedStatus(bedId, status) {
    const validStatuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid bed status: ${status}. Must be one of ${validStatuses.join(', ')}`);
    }

    const existing = await prisma.bed.findUnique({
      where: { id: bedId },
    });

    if (!existing) {
      throw ApiError.notFound('Bed record not found');
    }

    // If bed has active assigned patient, it cannot be set to AVAILABLE without discharge
    if (existing.patientId && status === 'AVAILABLE') {
      throw ApiError.badRequest('Cannot mark bed as AVAILABLE while patient is currently occupying the bed');
    }

    const updated = await prisma.bed.update({
      where: { id: bedId },
      data: {
        status,
      },
    });

    return updated;
  }
}

module.exports = new NurseBedService();
