const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class NursePatientService {
  /**
   * Get all patients currently assigned to the nurse with aggregated clinical state
   */
  async getAssignedPatients(nurseId, query = {}) {
    if (!nurseId) throw ApiError.unauthorized('Nurse context required');

    const { search, ward, limit = 50, page = 1 } = query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {
      nurseAssignments: {
        some: {
          nurseId,
          isActive: true,
        },
      },
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { patientIdNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (ward) {
      where.admissions = {
        some: {
          status: 'ADMITTED',
          ward: { contains: ward, mode: 'insensitive' },
        },
      };
    }

    const total = await prisma.patient.count({ where });
    const patients = await prisma.patient.findMany({
      where,
      skip,
      take: parseInt(limit, 10),
      orderBy: { fullName: 'asc' },
      include: {
        admissions: {
          where: { status: 'ADMITTED' },
          take: 1,
        },
        vitalSigns: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        nursingNotes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        medicationAdministrations: {
          where: {
            status: { in: ['SCHEDULED', 'DUE'] },
          },
          take: 5,
        },
        _count: {
          select: {
            vitalSigns: true,
            nursingNotes: true,
            medicationAdministrations: true,
          },
        },
      },
    });

    // Format output with computed clinical indicators
    const formattedPatients = patients.map((p) => {
      const activeAdmission = p.admissions[0] || null;
      const latestVital = p.vitalSigns[0] || null;
      const latestNote = p.nursingNotes[0] || null;
      const pendingMedsCount = p.medicationAdministrations.length;

      return {
        id: p.id,
        fullName: p.fullName,
        patientIdNumber: p.patientIdNumber,
        age: p.age,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        allergies: p.allergies,
        medicalHistory: p.chronicConditions || [],
        emergencyContact: p.emergencyContact,
        phone: p.phone,
        email: p.email,
        admission: activeAdmission
          ? {
              id: activeAdmission.id,
              admissionNumber: activeAdmission.admissionNumber,
              admittedDate: activeAdmission.admittedDate,
              admittingDiagnosis: activeAdmission.admittingDiagnosis,
              attendingDoctor: activeAdmission.attendingDoctor,
              ward: activeAdmission.ward,
              roomNumber: activeAdmission.roomNumber,
              bedNumber: activeAdmission.bedNumber,
            }
          : null,
        latestVital: latestVital
          ? {
              id: latestVital.id,
              bloodPressure: latestVital.bloodPressure,
              pulse: latestVital.pulse,
              temperature: latestVital.temperature,
              oxygenSaturation: latestVital.oxygenSaturation,
              respiratoryRate: latestVital.respiratoryRate,
              isFlagged: latestVital.isFlagged,
              flagReason: latestVital.flagReason,
              recordedAt: latestVital.recordedAt,
            }
          : null,
        latestNote: latestNote
          ? {
              id: latestNote.id,
              observation: latestNote.observation,
              recordedAt: latestNote.recordedAt,
              isFlagged: latestNote.isFlagged,
            }
          : null,
        pendingMedsCount,
      };
    });

    return {
      patients: formattedPatients,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  }

  /**
   * Get comprehensive EMR detail for an assigned patient
   */
  async getPatientDetail(nurseId, patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        admissions: {
          orderBy: { admittedDate: 'desc' },
        },
        vitalSigns: {
          orderBy: { recordedAt: 'desc' },
          include: {
            nurse: {
              include: {
                user: { select: { fullName: true, employeeId: true } },
              },
            },
          },
        },
        nursingNotes: {
          orderBy: { recordedAt: 'desc' },
          include: {
            nurse: {
              include: {
                user: { select: { fullName: true, employeeId: true } },
              },
            },
          },
        },
        medicationAdministrations: {
          orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
          include: {
            nurse: {
              include: {
                user: { select: { fullName: true } },
              },
            },
            prescription: {
              select: {
                id: true,
                prescriptionNumber: true,
                doctor: {
                  include: {
                    user: { select: { fullName: true } },
                  },
                },
              },
            },
          },
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              include: {
                user: { select: { fullName: true } },
              },
            },
            items: true,
          },
        },
        labReports: {
          orderBy: { createdAt: 'desc' },
          include: {
            orderedBy: {
              include: {
                user: { select: { fullName: true } },
              },
            },
          },
        },
        medicalRecords: {
          orderBy: { recordDate: 'desc' },
          include: {
            doctor: {
              include: {
                user: { select: { fullName: true } },
              },
            },
          },
        },
        nurseAssignments: {
          where: { isActive: true },
          include: {
            nurse: {
              include: {
                user: { select: { fullName: true, employeeId: true } },
              },
            },
          },
        },
      },
    });

    if (!patient) {
      throw ApiError.notFound('Patient record not found');
    }

    return patient;
  }
}

module.exports = new NursePatientService();
