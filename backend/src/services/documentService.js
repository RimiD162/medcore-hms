const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class DocumentService {
  /**
   * List categorized clinical documents accessible to doctor
   */
  async getDocuments(doctorId, query = {}) {
    const { category, search, patientId, page = 1, limit = 20 } = query;

    const where = {
      patient: {
        appointments: {
          some: { doctorId },
        },
      },
      ...(category && { category }),
      ...(patientId && { patientId }),
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              age: true,
              gender: true,
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      documents,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Securely fetch document metadata
   */
  async getDocumentById(doctorId, documentId) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        patient: {
          appointments: {
            some: { doctorId },
          },
        },
      },
      include: {
        patient: true,
      },
    });

    if (!document) {
      throw ApiError.notFound('Document record not found or access denied');
    }

    return document;
  }
}

module.exports = new DocumentService();
