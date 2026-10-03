const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Clean Lab Integration Stub for future Phase diagnostic execution
 */
class LabIntegrationStub {
  static async notifyLabOrderPlaced(labReport) {
    return {
      success: true,
      sampleCollectionToken: `TK-LAB-${Date.now().toString().slice(-4)}`,
      status: 'SAMPLE_ORDER_QUEUED',
    };
  }
}

class LabReportService {
  /**
   * List doctor-ordered or patient-linked laboratory reports
   */
  async getLabReports(doctorId, query = {}) {
    const { search, status, category, isReviewed, page = 1, limit = 20 } = query;

    const where = {
      orderedById: doctorId,
      ...(status && { status }),
      ...(category && { category }),
      ...(isReviewed !== undefined && { isReviewed: isReviewed === 'true' }),
    };

    if (search) {
      where.OR = [
        { reportNumber: { contains: search, mode: 'insensitive' } },
        { testName: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, reports] = await Promise.all([
      prisma.labReport.count({ where }),
      prisma.labReport.findMany({
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
        orderBy: { orderedDate: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      reports,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get single lab report details
   */
  async getLabReportById(doctorId, reportId) {
    const report = await prisma.labReport.findFirst({
      where: { id: reportId, orderedById: doctorId },
      include: {
        patient: true,
        orderedBy: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        documents: true,
      },
    });

    if (!report) {
      throw ApiError.notFound('Lab report not found');
    }

    return report;
  }

  /**
   * Order a new laboratory test from consultation or patient EMR
   */
  async orderLabTest(doctorId, data) {
    const { patientId, testName, category = 'Clinical Pathology', doctorNotes } = data;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw ApiError.notFound('Patient not found');
    }

    const count = await prisma.labReport.count();
    const reportNumber = `LAB-2026-${String(count + 501).padStart(3, '0')}`;

    const created = await prisma.labReport.create({
      data: {
        reportNumber,
        patientId,
        orderedById: doctorId,
        testName,
        category,
        status: 'ORDERED',
        orderedDate: new Date(),
        doctorNotes: doctorNotes || null,
        isReviewed: false,
      },
      include: {
        patient: true,
      },
    });

    await LabIntegrationStub.notifyLabOrderPlaced(created);

    return created;
  }

  /**
   * Doctor marks lab report as reviewed with clinical interpretation notes
   */
  async reviewLabReport(doctorId, reportId, doctorNotes) {
    const report = await prisma.labReport.findFirst({
      where: { id: reportId, orderedById: doctorId },
    });

    if (!report) {
      throw ApiError.notFound('Lab report not found');
    }

    return prisma.labReport.update({
      where: { id: reportId },
      data: {
        isReviewed: true,
        reviewedAt: new Date(),
        doctorNotes,
      },
      include: {
        patient: true,
      },
    });
  }
}

module.exports = new LabReportService();
