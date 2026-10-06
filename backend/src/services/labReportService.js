const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { generateLabReportNumber } = require('../utils/patientIdGenerator');
const labOrderService = require('./labOrderService');

class LabReportService {
  get patientDemographicSelect() {
    return {
      id: true,
      patientIdNumber: true,
      fullName: true,
      age: true,
      gender: true,
      bloodGroup: true,
      dateOfBirth: true,
      phone: true,
    };
  }

  /**
   * List lab reports for Doctor module (compatible with existing Doctor workspace)
   */
  async getLabReports(doctorId, query = {}) {
    const { search, status, category, isReviewed, page = 1, limit = 20 } = query;

    const where = {};
    if (doctorId) {
      where.order = { orderingDoctorId: doctorId };
    }
    if (status) {
      where.status = status;
    }
    if (category) {
      where.order = {
        ...where.order,
        items: { some: { labTest: { category } } },
      };
    }
    if (isReviewed !== undefined) {
      where.isReviewed = isReviewed === 'true' || isReviewed === true;
    }

    if (search) {
      where.OR = [
        { reportNumber: { contains: search, mode: 'insensitive' } },
        { order: { patient: { fullName: { contains: search, mode: 'insensitive' } } } },
        { order: { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } } },
        { order: { items: { some: { testNameSnapshot: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, reports] = await Promise.all([
      prisma.labReport.count({ where }),
      prisma.labReport.findMany({
        where,
        include: {
          order: {
            include: {
              patient: {
                select: this.patientDemographicSelect,
              },
              orderingDoctor: {
                include: {
                  user: { select: { fullName: true, email: true } },
                },
              },
              items: {
                include: {
                  labTest: true,
                  results: {
                    include: {
                      values: { include: { parameter: true } },
                    },
                  },
                },
              },
            },
          },
          verifiedBy: {
            select: { id: true, fullName: true, email: true },
          },
          releasedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    const formatted = reports.map((r) => {
      const items = r.order?.items || [];
      const testNames = items.map((i) => i.testNameSnapshot).join(', ');
      const categoryName = items[0]?.labTest?.category || 'Clinical Pathology';
      const hasCritical = items.some((i) =>
        i.results?.some((res) => res.values?.some((v) => v.flag === 'CRITICAL'))
      );

      return {
        ...r,
        testName: testNames,
        category: categoryName,
        isCritical: hasCritical,
        orderedDate: r.order?.orderedAt || r.createdAt,
        reportedDate: r.releasedAt || r.verifiedAt || r.updatedAt,
        patient: r.order?.patient,
        orderedBy: r.order?.orderingDoctor,
      };
    });

    return {
      reports: formatted,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * List all lab reports (for Laboratory Workspace)
   */
  async listAllReports(query = {}) {
    return this.getLabReports(null, query);
  }

  /**
   * Get single lab report details with snapshot results, parameter ranges, and audit chain
   */
  async getLabReportById(doctorIdOrNull, reportId) {
    const where = { id: reportId };
    if (doctorIdOrNull) {
      where.order = { orderingDoctorId: doctorIdOrNull };
    }

    const report = await prisma.labReport.findFirst({
      where,
      include: {
        order: {
          include: {
            patient: {
              select: this.patientDemographicSelect,
            },
            orderingDoctor: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
            samples: true,
            items: {
              include: {
                labTest: {
                  include: {
                    parameters: { orderBy: { displayOrder: 'asc' } },
                  },
                },
                results: {
                  include: {
                    values: {
                      include: { parameter: true },
                      orderBy: { parameter: { displayOrder: 'asc' } },
                    },
                    corrections: {
                      include: {
                        correctedBy: { select: { fullName: true } },
                      },
                      orderBy: { correctedAt: 'desc' },
                    },
                    enteredBy: { select: { fullName: true, email: true } },
                    verifiedBy: { select: { fullName: true, email: true } },
                  },
                },
              },
            },
          },
        },
        verifiedBy: {
          select: { id: true, fullName: true, email: true },
        },
        releasedBy: {
          select: { id: true, fullName: true, email: true },
        },
        documents: true,
      },
    });

    if (!report) {
      throw ApiError.notFound('Lab report not found');
    }

    const items = report.order?.items || [];
    const testNames = items.map((i) => i.testNameSnapshot).join(', ');
    const categoryName = items[0]?.labTest?.category || 'Clinical Pathology';
    const hasCritical = items.some((i) =>
      i.results?.some((res) => res.values?.some((v) => v.flag === 'CRITICAL'))
    );

    return {
      ...report,
      testName: testNames,
      category: categoryName,
      isCritical: hasCritical,
      orderedDate: report.order?.orderedAt || report.createdAt,
      reportedDate: report.releasedAt || report.verifiedAt || report.updatedAt,
      patient: report.order?.patient,
      orderedBy: report.order?.orderingDoctor,
      results: items.flatMap((i) =>
        (i.results || []).map((res) => ({
          ...res,
          test: i.labTest ? {
            ...i.labTest,
            testCode: i.labTest.code,
            testName: i.labTest.name,
          } : null,
          values: res.values.map((v) => ({
            ...v,
            unit: v.unitSnapshot || v.parameter?.unit,
            numericValue: v.numericValue !== null ? Number(v.numericValue) : null,
          })),
        }))
      ),
    };
  }

  /**
   * Verify and Release a Diagnostic Report
   */
  async verifyAndReleaseReport(orderId, data, actingUser) {
    const {
      summary,
      technicalNotes,
      criticalNotes,
      criticalNotifiedTo,
      bypassSeparateVerifierCheck = false,
    } = data;

    const order = await prisma.labTestOrder.findUnique({
      where: { id: orderId },
      include: {
        patient: true,
        orderingDoctor: { include: { user: true } },
        items: {
          include: {
            labTest: true,
            results: {
              include: { values: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Lab order not found for report verification');
    }

    // Verify all items have results entered
    const missingResults = order.items.filter((item) => !item.results || item.results.length === 0);
    if (missingResults.length > 0) {
      throw ApiError.badRequest(
        `Cannot verify and release report: Results have not been entered for test(s): ${missingResults.map((m) => m.testNameSnapshot).join(', ')}`
      );
    }

    // Separate Verifier Policy Check
    const requireSeparateVerifier = process.env.LAB_REQUIRE_SEPARATE_VERIFIER !== 'false' && !bypassSeparateVerifierCheck;

    if (requireSeparateVerifier) {
      for (const item of order.items) {
        for (const res of item.results) {
          if (res.enteredById && res.enteredById === actingUser.id) {
            throw ApiError.badRequest(
              `Separate verifier policy violation: You entered the results for '${item.testNameSnapshot}'. A different senior technician or pathologist must verify and release this report.`
            );
          }
        }
      }
    }

    const isCritical = order.items.some((item) =>
      item.results.some((res) => res.values.some((v) => v.flag === 'CRITICAL'))
    );

    const reportNumber = await generateLabReportNumber();

    return prisma.$transaction(async (tx) => {
      // 1. Mark results as VERIFIED
      for (const item of order.items) {
        for (const res of item.results) {
          await tx.labResult.update({
            where: { id: res.id },
            data: {
              status: 'VERIFIED',
              verifiedBy: { connect: { id: actingUser.id } },
              verifiedAt: new Date(),
            },
          });
        }
        await tx.labTestOrderItem.update({
          where: { id: item.id },
          data: { status: 'COMPLETED' },
        });
      }

      // 2. Create or Update Report
      const existingReport = await tx.labReport.findFirst({
        where: { orderId: order.id },
      });

      let report;
      if (existingReport) {
        report = await tx.labReport.update({
          where: { id: existingReport.id },
          data: {
            status: 'RELEASED',
            verifiedBy: { connect: { id: actingUser.id } },
            releasedBy: { connect: { id: actingUser.id } },
            verifiedAt: new Date(),
            releasedAt: new Date(),
            contentSnapshot: {
              summary: summary || 'Diagnostic panel completed and verified.',
              technicalNotes: technicalNotes || null,
              criticalNotes: isCritical ? criticalNotes || 'Critical parameters identified.' : null,
              criticalNotifiedTo: isCritical ? criticalNotifiedTo || order.orderingDoctor?.user?.fullName || 'Attending Physician' : null,
            },
          },
        });
      } else {
        report = await tx.labReport.create({
          data: {
            reportNumber,
            order: { connect: { id: order.id } },
            status: 'RELEASED',
            verifiedBy: { connect: { id: actingUser.id } },
            releasedBy: { connect: { id: actingUser.id } },
            verifiedAt: new Date(),
            releasedAt: new Date(),
            contentSnapshot: {
              summary: summary || 'Diagnostic panel completed and verified.',
              technicalNotes: technicalNotes || null,
              criticalNotes: isCritical ? criticalNotes || 'Critical parameters identified.' : null,
              criticalNotifiedTo: isCritical ? criticalNotifiedTo || order.orderingDoctor?.user?.fullName || 'Attending Physician' : null,
            },
          },
        });
      }

      // 3. Mark Order as COMPLETED
      await tx.labTestOrder.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' },
      });

      // 4. Notify Ordering Doctor
      if (order.orderingDoctor?.user?.id) {
        await tx.notification.create({
          data: {
            userId: order.orderingDoctor.user.id,
            title: isCritical
              ? `CRITICAL LAB REPORT RELEASED: ${report.reportNumber}`
              : `Lab Report Released: ${report.reportNumber}`,
            message: `Results for patient ${order.patient.fullName} are now available in the EMR.${isCritical ? ' IMMEDIATE ATTENTION REQUIRED.' : ''}`,
            type: isCritical ? 'URGENT' : 'INFO',
            isRead: false,
          },
        }).catch(() => {});
      }

      return report;
    }, { maxWait: 15000, timeout: 30000 }).then((rep) => this.getLabReportById(null, rep.id));
  }

  /**
   * Doctor creates a test order from consultation (Doctor compatibility)
   */
  async orderLabTest(doctorId, data) {
    const { patientId, testName, category = 'Clinical Pathology', doctorNotes, priority = 'ROUTINE' } = data;

    let test = await prisma.labTest.findFirst({
      where: {
        OR: [
          { name: { equals: testName, mode: 'insensitive' } },
          { code: { equals: testName, mode: 'insensitive' } },
        ],
      },
    });

    if (!test) {
      test = await prisma.labTest.findFirst({
        where: { isActive: true },
      });
    }

    if (test) {
      const createdOrder = await labOrderService.createOrder(doctorId, {
        patientId,
        testIds: [test.id],
        priority,
        clinicalNotes: doctorNotes,
      });

      const reportNumber = await generateLabReportNumber();
      const report = await prisma.labReport.create({
        data: {
          reportNumber,
          order: { connect: { id: createdOrder.id } },
          status: 'DRAFT',
          doctorNotes: doctorNotes || null,
        },
      });

      return this.getLabReportById(doctorId, report.id);
    }

    throw ApiError.badRequest('No laboratory test available in catalog to order.');
  }

  /**
   * Doctor marks lab report as reviewed with clinical interpretation notes
   */
  async reviewLabReport(doctorId, reportId, doctorNotes) {
    const report = await prisma.labReport.findFirst({
      where: {
        id: reportId,
        ...(doctorId && { order: { orderingDoctorId: doctorId } }),
      },
    });

    if (!report) {
      throw ApiError.notFound('Lab report not found');
    }

    await prisma.labReport.update({
      where: { id: reportId },
      data: {
        isReviewed: true,
        reviewedAt: new Date(),
        doctorNotes: doctorNotes || report.doctorNotes,
      },
    });

    return this.getLabReportById(doctorId, reportId);
  }
}

module.exports = new LabReportService();
