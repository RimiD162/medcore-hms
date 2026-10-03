const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class NursingNoteService {
  /**
   * Create a new nursing clinical note
   */
  async createNote(nurseId, payload) {
    if (!nurseId) throw ApiError.unauthorized('Nurse context required');

    const note = await prisma.nursingNote.create({
      data: {
        patientId: payload.patientId,
        nurseId,
        shift: payload.shift || null,
        observation: payload.observation,
        careProvided: payload.careProvided,
        patientResponse: payload.patientResponse,
        additionalNotes: payload.additionalNotes || null,
        isFlagged: payload.isFlagged || false,
      },
      include: {
        nurse: {
          include: {
            user: {
              select: { fullName: true, employeeId: true },
            },
          },
        },
        patient: {
          select: { id: true, fullName: true, patientIdNumber: true },
        },
      },
    });

    return note;
  }

  /**
   * Get nursing notes with filtering and pagination
   */
  async getNotes(nurseId, query = {}) {
    const { patientId, isFlagged, shift, search, limit = 50, page = 1 } = query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {};
    if (patientId) where.patientId = patientId;
    if (isFlagged === 'true' || isFlagged === true) where.isFlagged = true;
    if (shift) where.shift = { contains: shift, mode: 'insensitive' };

    if (search) {
      where.OR = [
        { observation: { contains: search, mode: 'insensitive' } },
        { careProvided: { contains: search, mode: 'insensitive' } },
        { patientResponse: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Filter to nurse's assigned patients if no specific patient requested
    if (!patientId && nurseId) {
      where.patient = {
        ...where.patient,
        nurseAssignments: {
          some: { nurseId, isActive: true },
        },
      };
    }

    const total = await prisma.nursingNote.count({ where });
    const notes = await prisma.nursingNote.findMany({
      where,
      skip,
      take: parseInt(limit, 10),
      orderBy: { createdAt: 'desc' },
      include: {
        nurse: {
          include: {
            user: {
              select: { fullName: true, employeeId: true },
            },
          },
        },
        patient: {
          select: { id: true, fullName: true, patientIdNumber: true, age: true, gender: true },
        },
      },
    });

    return {
      notes,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  }

  /**
   * Get chronological nursing notes for a specific patient
   */
  async getPatientNotes(patientId) {
    const notes = await prisma.nursingNote.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        nurse: {
          include: {
            user: {
              select: { fullName: true, employeeId: true },
            },
          },
        },
      },
    });

    return notes;
  }

  /**
   * Get single note by ID
   */
  async getNoteById(id) {
    const note = await prisma.nursingNote.findUnique({
      where: { id },
      include: {
        nurse: {
          include: {
            user: {
              select: { fullName: true, employeeId: true },
            },
          },
        },
        patient: {
          select: { id: true, fullName: true, patientIdNumber: true, age: true, gender: true },
        },
      },
    });

    if (!note) {
      throw ApiError.notFound('Nursing note not found');
    }

    return note;
  }
}

module.exports = new NursingNoteService();
