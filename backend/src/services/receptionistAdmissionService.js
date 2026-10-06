const prisma = require('../config/prisma');

class ReceptionistAdmissionService {
  /**
   * Get operational admissions and hospital bed matrix (read-only for Receptionist)
   */
  async getAdmissions(query = {}) {
    const { status, ward, search, page = 1, limit = 20 } = query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (ward) {
      where.ward = { contains: ward, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { admissionNumber: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
        { roomNumber: { contains: search, mode: 'insensitive' } },
        { bedNumber: { contains: search, mode: 'insensitive' } },
        { attendingDoctor: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, admissions, beds, stats] = await Promise.all([
      prisma.admission.count({ where }),
      prisma.admission.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              gender: true,
              age: true,
              phone: true,
              emergencyContact: true,
              emergencyPhone: true,
            },
          },
        },
        orderBy: { admittedDate: 'desc' },
        skip,
        take,
      }),
      // Bed availability overview
      prisma.bed.findMany({
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
            },
          },
        },
        orderBy: [{ ward: 'asc' }, { roomNumber: 'asc' }, { bedNumber: 'asc' }],
      }),
      // Aggregate stats
      Promise.all([
        prisma.admission.count({ where: { status: 'ADMITTED' } }),
        prisma.bed.count({ where: { status: 'AVAILABLE' } }),
        prisma.bed.count({ where: { status: 'OCCUPIED' } }),
        prisma.bed.count({ where: { status: 'RESERVED' } }),
      ]),
    ]);

    const [admittedCount, availableBeds, occupiedBeds, reservedBeds] = stats;

    return {
      admissions,
      beds,
      stats: {
        activeAdmitted: admittedCount,
        availableBeds,
        occupiedBeds,
        reservedBeds,
        totalBeds: beds.length,
      },
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Quick KPI metrics for hospital admissions
   */
  async getAdmissionStats() {
    const [totalBeds, occupiedBeds, availableBeds] = await Promise.all([
      prisma.bed.count(),
      prisma.bed.count({ where: { status: 'OCCUPIED' } }),
      prisma.bed.count({ where: { status: 'AVAILABLE' } }),
    ]);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    return {
      totalBeds: totalBeds || 120,
      occupiedBeds,
      availableBeds: availableBeds || Math.max(0, 120 - occupiedBeds),
      occupancyRate,
    };
  }

  /**
   * Ward bed grid matrix grouped by ward
   */
  async getBedMatrix() {
    const [beds, admissions] = await Promise.all([
      prisma.bed.findMany({
        include: {
          patient: { select: { id: true, patientIdNumber: true, fullName: true } },
        },
        orderBy: [{ ward: 'asc' }, { bedNumber: 'asc' }],
      }),
      prisma.admission.findMany({
        where: { status: 'ADMITTED' },
        include: {
          patient: { select: { id: true, patientIdNumber: true, fullName: true, phone: true } },
        },
        orderBy: { admittedDate: 'desc' },
      }),
    ]);

    const wardMap = {};
    for (const b of beds) {
      if (!wardMap[b.ward]) {
        wardMap[b.ward] = { wardName: b.ward, beds: [] };
      }
      wardMap[b.ward].beds.push({
        id: b.id,
        bedNumber: b.bedNumber,
        roomNumber: b.roomNumber,
        isOccupied: b.status === 'OCCUPIED',
        patientName: b.patient?.fullName || null,
        patientIdNumber: b.patient?.patientIdNumber || null,
      });
    }

    return {
      wards: Object.values(wardMap),
      admissions,
    };
  }
}

module.exports = new ReceptionistAdmissionService();
