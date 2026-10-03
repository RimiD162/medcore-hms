const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class MedicationAdministrationService {
  /**
   * Get medication administration tasks (e-MAR schedule)
   */
  async getTasks(nurseId, query = {}) {
    const { patientId, status, date, shift, limit = 50, page = 1 } = query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      where.scheduledAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Filter to nurse's assigned patients if no specific patient requested
    if (!patientId && nurseId) {
      where.patient = {
        nurseAssignments: {
          some: { nurseId, isActive: true },
        },
      };
    }

    const total = await prisma.medicationAdministration.count({ where });
    const tasks = await prisma.medicationAdministration.findMany({
      where,
      skip,
      take: parseInt(limit, 10),
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            patientIdNumber: true,
            allergies: true,
            age: true,
            gender: true,
            admissions: {
              where: { status: 'ADMITTED' },
              take: 1,
            },
          },
        },
        nurse: {
          include: {
            user: {
              select: { fullName: true, employeeId: true },
            },
          },
        },
        prescriptionItem: {
          select: {
            id: true,
            instructions: true,
            prescription: {
              select: {
                id: true,
                prescriptionNumber: true,
                notes: true,
                doctor: {
                  include: {
                    user: { select: { fullName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      tasks,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  }

  /**
   * Administer medication (Transition to ADMINISTERED)
   */
  async administer(nurseId, taskId, payload = {}) {
    if (!nurseId) throw ApiError.unauthorized('Nurse context required');

    const task = await prisma.medicationAdministration.findUnique({
      where: { id: taskId },
      include: { patient: true },
    });

    if (!task) {
      throw ApiError.notFound('Medication administration record not found');
    }

    if (task.status === 'ADMINISTERED') {
      throw ApiError.badRequest('This medication has already been administered (idempotency check)');
    }

    if (['HELD', 'MISSED', 'CANCELLED'].includes(task.status)) {
      throw ApiError.badRequest(`Cannot administer medication with current terminal status: ${task.status}`);
    }

    const updated = await prisma.medicationAdministration.update({
      where: { id: taskId },
      data: {
        status: 'ADMINISTERED',
        administeredAt: new Date(),
        nurseId,
        notes: payload.notes || task.notes,
      },
      include: {
        patient: {
          select: { id: true, fullName: true, patientIdNumber: true },
        },
        nurse: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Hold medication (Transition to HELD)
   */
  async hold(nurseId, taskId, payload) {
    if (!nurseId) throw ApiError.unauthorized('Nurse context required');
    if (!payload.reason) throw ApiError.badRequest('A clinical reason is mandatory to hold medication');

    const task = await prisma.medicationAdministration.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw ApiError.notFound('Medication administration record not found');
    }

    if (['ADMINISTERED', 'CANCELLED'].includes(task.status)) {
      throw ApiError.badRequest(`Cannot hold medication in status ${task.status}`);
    }

    const updated = await prisma.medicationAdministration.update({
      where: { id: taskId },
      data: {
        status: 'HELD',
        nurseId,
        reason: payload.reason,
        notes: payload.notes || task.notes,
      },
      include: {
        patient: {
          select: { id: true, fullName: true, patientIdNumber: true },
        },
        nurse: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Mark medication as missed (Transition to MISSED)
   */
  async miss(nurseId, taskId, payload) {
    if (!nurseId) throw ApiError.unauthorized('Nurse context required');
    if (!payload.reason) throw ApiError.badRequest('A clinical reason is mandatory to mark medication as missed');

    const task = await prisma.medicationAdministration.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw ApiError.notFound('Medication administration record not found');
    }

    if (['ADMINISTERED', 'CANCELLED'].includes(task.status)) {
      throw ApiError.badRequest(`Cannot mark medication as missed in status ${task.status}`);
    }

    const updated = await prisma.medicationAdministration.update({
      where: { id: taskId },
      data: {
        status: 'MISSED',
        nurseId,
        reason: payload.reason,
        notes: payload.notes || task.notes,
      },
      include: {
        patient: {
          select: { id: true, fullName: true, patientIdNumber: true },
        },
        nurse: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Get single task by ID
   */
  async getTaskById(id) {
    const task = await prisma.medicationAdministration.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            patientIdNumber: true,
            allergies: true,
            age: true,
            gender: true,
            bloodGroup: true,
            admissions: {
              where: { status: 'ADMITTED' },
              take: 1,
            },
          },
        },
        nurse: {
          include: {
            user: { select: { fullName: true, employeeId: true } },
          },
        },
        prescriptionItem: {
          include: {
            prescription: {
              include: {
                doctor: {
                  include: {
                    user: { select: { fullName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw ApiError.notFound('Medication task not found');
    }

    return task;
  }
}

module.exports = new MedicationAdministrationService();
