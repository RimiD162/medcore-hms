const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class PatientService {
  /**
   * List patients who have appointments or medical history with this doctor
   */
  async getPatients(doctorId, query = {}) {
    const { search, gender, bloodGroup, status, page = 1, limit = 20, sortBy = 'fullName', sortOrder = 'asc' } = query;

    // Find patients with at least one appointment with this doctor
    const where = {
      appointments: {
        some: { doctorId },
      },
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { patientIdNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (gender) {
      where.gender = gender;
    }

    if (bloodGroup) {
      where.bloodGroup = bloodGroup;
    }

    if (status) {
      where.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        include: {
          appointments: {
            where: { doctorId },
            orderBy: { appointmentDate: 'desc' },
            take: 2,
            select: {
              id: true,
              appointmentNumber: true,
              appointmentDate: true,
              appointmentTime: true,
              status: true,
              type: true,
            },
          },
          _count: {
            select: {
              consultations: { where: { doctorId } },
              prescriptions: { where: { doctorId } },
              labReports: { where: { orderedById: doctorId } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
    ]);

    // Format last visit and next appointment
    const formatted = patients.map((p) => {
      const pastApt = p.appointments.find((a) => a.status === 'COMPLETED');
      const nextApt = p.appointments.find((a) => ['SCHEDULED', 'CONFIRMED'].includes(a.status));

      return {
        id: p.id,
        patientIdNumber: p.patientIdNumber,
        fullName: p.fullName,
        age: p.age,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        phone: p.phone,
        email: p.email,
        allergies: p.allergies,
        chronicConditions: p.chronicConditions,
        status: p.status,
        lastVisit: pastApt ? pastApt.appointmentDate : null,
        nextAppointment: nextApt ? `${new Date(nextApt.appointmentDate).toLocaleDateString()} at ${nextApt.appointmentTime}` : null,
        counts: p._count,
      };
    });

    return {
      patients: formatted,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get comprehensive Patient EMR Profile (authorized for this doctor)
   */
  async getPatientById(doctorId, patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        appointments: {
          where: { doctorId },
          orderBy: { appointmentDate: 'desc' },
          include: {
            consultation: {
              select: {
                id: true,
                status: true,
                diagnosis: true,
              },
            },
          },
        },
        consultations: {
          where: { doctorId },
          orderBy: { createdAt: 'desc' },
          include: {
            appointment: {
              select: {
                appointmentNumber: true,
                appointmentDate: true,
                type: true,
              },
            },
            prescription: {
              include: { items: true },
            },
          },
        },
        medicalRecords: {
          orderBy: { recordDate: 'desc' },
          include: {
            doctor: {
              select: {
                department: true,
                specialization: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
        prescriptions: {
          orderBy: { prescribedDate: 'desc' },
          include: {
            doctor: {
              select: {
                user: { select: { fullName: true } },
              },
            },
            items: true,
          },
        },
        labReports: {
          orderBy: { orderedDate: 'desc' },
          include: {
            orderedBy: {
              select: {
                user: { select: { fullName: true } },
              },
            },
          },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        followUps: {
          where: { doctorId },
          orderBy: { followUpDate: 'desc' },
        },
      },
    });

    if (!patient) {
      throw ApiError.notFound('Patient record not found');
    }

    return patient;
  }
}

module.exports = new PatientService();
