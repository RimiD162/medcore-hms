const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class MedicalRecordService {
  /**
   * Get all medical records accessible to doctor
   */
  async getMedicalRecords(doctorId, query = {}) {
    const { search, recordType, page = 1, limit = 20 } = query;

    const where = {
      doctorId,
    };

    if (recordType) {
      where.recordType = recordType;
    }

    if (search) {
      where.OR = [
        { recordNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { diagnosis: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, records] = await Promise.all([
      prisma.medicalRecord.count({ where }),
      prisma.medicalRecord.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              age: true,
              gender: true,
              bloodGroup: true,
            },
          },
          consultation: {
            select: {
              id: true,
              chiefComplaint: true,
              treatmentPlan: true,
            },
          },
        },
        orderBy: { recordDate: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      records,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get chronological clinical timeline of a patient
   */
  async getPatientTimeline(doctorId, patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        patientIdNumber: true,
        fullName: true,
        age: true,
        gender: true,
        bloodGroup: true,
        allergies: true,
        chronicConditions: true,
      },
    });

    if (!patient) {
      throw ApiError.notFound('Patient not found');
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: {
            department: true,
            specialization: true,
            user: { select: { fullName: true } },
          },
        },
        documents: true,
      },
      orderBy: { recordDate: 'desc' },
    });

    return {
      patient,
      timeline: records,
    };
  }

  /**
   * Get single medical record detail
   */
  async getRecordById(doctorId, recordId) {
    const record = await prisma.medicalRecord.findFirst({
      where: { id: recordId, doctorId },
      include: {
        patient: true,
        consultation: {
          include: {
            prescription: {
              include: { items: true },
            },
          },
        },
        documents: true,
      },
    });

    if (!record) {
      throw ApiError.notFound('Medical record not found');
    }

    return record;
  }
}

module.exports = new MedicalRecordService();
