const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { generatePatientId, generateEmergencyNumber } = require('../utils/patientIdGenerator');

class ReceptionistEmergencyService {
  /**
   * List emergency registrations with priority and status filters
   */
  async getEmergencyList(query = {}) {
    const { priority, status, search, page = 1, limit = 20 } = query;

    const where = {};

    if (priority) {
      where.priority = priority;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { emergencyNumber: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, emergencies] = await Promise.all([
      prisma.emergencyRegistration.count({ where }),
      prisma.emergencyRegistration.findMany({
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
          registeredBy: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: { arrivedAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      emergencies,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Fast-path emergency patient intake
   * Creates emergency patient record and triage intake record in one transaction
   */
  async createEmergency(data, registeredById) {
    const {
      patientName,
      priority = 'HIGH',
      reason,
      gender = 'Other',
      age,
      phone,
      emergencyContact,
      emergencyPhone,
      triageNotes,
      assignedDoctorId,
      assignedBedId,
    } = data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate unique Patient ID
      const patientIdNumber = await generatePatientId(tx);

      // 2. Fast patient record creation
      const patient = await tx.patient.create({
        data: {
          patientIdNumber,
          fullName: patientName,
          gender,
          age: age !== undefined && age !== null ? parseInt(age, 10) : null,
          phone: phone || 'Unknown (Emergency)',
          emergencyContact: emergencyContact || null,
          emergencyPhone: emergencyPhone || null,
          registrationSource: 'Emergency',
          status: 'Active',
        },
      });

      // 3. Generate unique Emergency intake number
      const emergencyNumber = await generateEmergencyNumber(tx);

      // 4. Create Emergency Registration record
      const emergencyRecord = await tx.emergencyRegistration.create({
        data: {
          emergencyNumber,
          patientId: patient.id,
          priority,
          reason,
          status: 'TRIAGED',
          triageNotes: triageNotes || null,
          assignedDoctorId: assignedDoctorId || null,
          assignedBedId: assignedBedId || null,
          registeredById,
        },
        include: {
          patient: true,
        },
      });

      // 5. Notify Emergency Doctor / Care Team if doctor assigned or default alert
      if (assignedDoctorId) {
        const doc = await tx.doctorProfile.findUnique({
          where: { id: assignedDoctorId },
        });
        if (doc) {
          await tx.notification.create({
            data: {
              userId: doc.userId,
              title: `[EMERGENCY ${priority}] New Triage Arrival`,
              message: `${patient.fullName} (${emergencyNumber}) admitted to ER. Reason: ${reason}`,
              type: 'URGENT',
              entityType: 'EmergencyRegistration',
              entityId: emergencyRecord.id,
            },
          });
        }
      }

      return emergencyRecord;
    }, { maxWait: 15000, timeout: 30000 });

    return result;
  }
}

module.exports = new ReceptionistEmergencyService();
