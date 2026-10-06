const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const {
  evaluateParameterFlag,
  deriveOverallFlag,
  formatReferenceRange,
} = require('./resultFlagService');

class LabResultService {
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
   * List lab results with filters, status, critical flags
   */
  async listResults(query = {}) {
    const {
      search,
      status,
      overallFlag,
      isCritical,
      testId,
      page = 1,
      limit = 20,
    } = query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (testId) {
      where.orderItem = { labTestId: testId };
    }

    if (search) {
      where.OR = [
        { orderItem: { testNameSnapshot: { contains: search, mode: 'insensitive' } } },
        { orderItem: { order: { orderNumber: { contains: search, mode: 'insensitive' } } } },
        { sample: { sampleCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, results] = await Promise.all([
      prisma.labResult.count({ where }),
      prisma.labResult.findMany({
        where,
        include: {
          orderItem: {
            include: {
              labTest: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  category: true,
                },
              },
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  priority: true,
                  patient: {
                    select: this.patientDemographicSelect,
                  },
                },
              },
            },
          },
          sample: {
            select: {
              id: true,
              sampleCode: true,
              sampleType: true,
              status: true,
            },
          },
          enteredBy: {
            select: { id: true, fullName: true, email: true },
          },
          verifiedBy: {
            select: { id: true, fullName: true, email: true },
          },
          values: {
            include: { parameter: true },
          },
          _count: {
            select: { values: true, corrections: true },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take,
      }),
    ]);

    const formatted = results.map((r) => {
      const hasCrit = r.values.some((v) => v.flag === 'CRITICAL');
      const hasAbnormal = r.values.some((v) => v.flag === 'LOW' || v.flag === 'HIGH');
      const overall = hasCrit ? 'CRITICAL' : (hasAbnormal ? 'HIGH' : 'NORMAL');

      return {
        ...r,
        isCritical: hasCrit,
        overallFlag: overall,
        test: r.orderItem?.labTest ? {
          ...r.orderItem.labTest,
          testCode: r.orderItem.labTest.code,
          testName: r.orderItem.labTest.name,
        } : null,
        order: r.orderItem?.order,
        sample: r.sample ? { ...r.sample, sampleBarcode: r.sample.sampleCode } : null,
      };
    });

    const filtered = formatted.filter((item) => {
      if (overallFlag && item.overallFlag !== overallFlag) return false;
      if (isCritical !== undefined && item.isCritical !== (isCritical === 'true' || isCritical === true)) return false;
      return true;
    });

    return {
      results: filtered,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Get single lab result with full values, ranges, corrections
   */
  async getResultById(id) {
    const result = await prisma.labResult.findUnique({
      where: { id },
      include: {
        orderItem: {
          include: {
            labTest: {
              include: {
                parameters: {
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
            order: {
              include: {
                patient: { select: this.patientDemographicSelect },
                orderingDoctor: {
                  include: {
                    user: { select: { fullName: true, email: true } },
                  },
                },
              },
            },
          },
        },
        sample: true,
        values: {
          include: {
            parameter: true,
          },
          orderBy: { parameter: { displayOrder: 'asc' } },
        },
        corrections: {
          include: {
            correctedBy: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { correctedAt: 'desc' },
        },
        enteredBy: {
          select: { id: true, fullName: true, email: true },
        },
        verifiedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!result) {
      throw ApiError.notFound('Lab result not found');
    }

    const hasCrit = result.values.some((v) => v.flag === 'CRITICAL');
    const hasAbnormal = result.values.some((v) => v.flag === 'LOW' || v.flag === 'HIGH');
    const overall = hasCrit ? 'CRITICAL' : (hasAbnormal ? 'HIGH' : 'NORMAL');

    return {
      ...result,
      status: (result.corrections && result.corrections.length > 0) ? 'CORRECTED' : result.status,
      isCritical: hasCrit,
      overallFlag: overall,
      test: result.orderItem?.labTest ? {
        ...result.orderItem.labTest,
        testCode: result.orderItem.labTest.code,
        testName: result.orderItem.labTest.name,
        parameters: result.orderItem.labTest.parameters.map((p) => ({
          ...p,
          parameterName: p.name,
          minRange: p.low,
          maxRange: p.high,
        })),
      } : null,
      order: result.orderItem?.order ? {
        ...result.orderItem.order,
        orderedBy: result.orderItem.order.orderingDoctor,
      } : null,
      sample: result.sample ? { ...result.sample, sampleBarcode: result.sample.sampleCode } : null,
      values: result.values.map((v) => ({
        ...v,
        unit: v.unitSnapshot || v.parameter?.unit,
        numericValue: v.numericValue !== null ? Number(v.numericValue) : null,
      })),
    };
  }

  /**
   * Enter test result parameters with technical flag calculation
   */
  async enterResults(orderItemId, data, enteredByUserId) {
    const { values = [], technicalNotes } = data;

    const orderItem = await prisma.labTestOrderItem.findUnique({
      where: { id: orderItemId },
      include: {
        labTest: {
          include: {
            parameters: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        order: true,
        sample: true,
        results: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!orderItem) {
      throw ApiError.notFound('Lab test order item not found');
    }

    if (orderItem.status === 'CANCELLED') {
      throw ApiError.badRequest(`Cannot enter results for item in '${orderItem.status}' status`);
    }

    const test = orderItem.labTest;
    const paramMap = new Map(test.parameters.map((p) => [p.id, p]));

    const evaluatedValues = [];
    for (const valEntry of values) {
      const param = paramMap.get(valEntry.parameterId);
      if (!param) continue;

      const flag = evaluateParameterFlag(param, valEntry.numericValue, valEntry.textValue);
      const referenceRangeSnapshot = formatReferenceRange(param);

      evaluatedValues.push({
        parameterId: param.id,
        numericValue: valEntry.numericValue !== undefined && valEntry.numericValue !== null && valEntry.numericValue !== ''
          ? parseFloat(valEntry.numericValue)
          : null,
        textValue: valEntry.textValue ? String(valEntry.textValue).trim() : null,
        flag,
        referenceRangeSnapshot,
        unitSnapshot: param.unit || null,
      });
    }

    const { isCritical } = deriveOverallFlag(evaluatedValues);

    return prisma.$transaction(async (tx) => {
      let resultRecord;

      if (orderItem.results && orderItem.results.length > 0) {
        resultRecord = await tx.labResult.update({
          where: { id: orderItem.results[0].id },
          data: {
            enteredBy: { connect: { id: enteredByUserId } },
            enteredAt: new Date(),
            status: 'ENTERED',
          },
        });

        await tx.labResultValue.deleteMany({
          where: { labResultId: resultRecord.id },
        });
      } else {
        resultRecord = await tx.labResult.create({
          data: {
            orderItem: { connect: { id: orderItem.id } },
            sample: { connect: { id: orderItem.sampleId } },
            enteredBy: { connect: { id: enteredByUserId } },
            enteredAt: new Date(),
            status: 'ENTERED',
            version: 1,
          },
        });
      }

      if (evaluatedValues.length > 0) {
        await tx.labResultValue.createMany({
          data: evaluatedValues.map((v) => ({
            labResultId: resultRecord.id,
            parameterId: v.parameterId,
            numericValue: v.numericValue,
            textValue: v.textValue,
            flag: v.flag,
            referenceRangeSnapshot: v.referenceRangeSnapshot,
            unitSnapshot: v.unitSnapshot,
          })),
        });
      }

      await tx.labTestOrderItem.update({
        where: { id: orderItemId },
        data: { status: 'PROCESSING' },
      });

      const allItems = await tx.labTestOrderItem.findMany({
        where: { orderId: orderItem.orderId },
      });
      const allEntered = allItems.every(
        (i) => i.id === orderItemId || i.status === 'PROCESSING' || i.status === 'COMPLETED'
      );

      if (allEntered) {
        await tx.labTestOrder.update({
          where: { id: orderItem.orderId },
          data: { status: 'PROCESSING' },
        });
      }

      if (isCritical) {
        await tx.notification.create({
          data: {
            userId: enteredByUserId,
            title: `CRITICAL LAB VALUE: ${test.name}`,
            message: `Critical alert flagged on Order ${orderItem.order?.orderNumber}. Immediate senior verification required.`,
            type: 'URGENT',
            isRead: false,
          },
        }).catch(() => {});
      }

      return resultRecord;
    }, { maxWait: 15000, timeout: 30000 }).then((res) => this.getResultById(res.id));
  }

  /**
   * Correct an entered or verified result with immutable audit trail
   */
  async correctResult(resultId, data, correctedByUserId) {
    const { reason, values = [] } = data;

    if (!reason || reason.trim().length === 0) {
      throw ApiError.badRequest('A specific clinical / technical reason is required to correct results.');
    }

    const result = await prisma.labResult.findUnique({
      where: { id: resultId },
      include: {
        orderItem: {
          include: {
            labTest: {
              include: { parameters: true },
            },
            order: true,
          },
        },
        values: {
          include: { parameter: true },
        },
      },
    });

    if (!result) {
      throw ApiError.notFound('Lab result not found');
    }

    const paramMap = new Map(result.orderItem.labTest.parameters.map((p) => [p.id, p]));
    const originalSnapshot = result.values.map((v) => ({
      parameterId: v.parameterId,
      name: v.parameter?.name,
      numericValue: v.numericValue,
      textValue: v.textValue,
      flag: v.flag,
    }));

    const evaluatedValues = [];
    for (const valEntry of values) {
      const param = paramMap.get(valEntry.parameterId);
      if (!param) continue;

      const flag = evaluateParameterFlag(param, valEntry.numericValue, valEntry.textValue);
      const referenceRangeSnapshot = formatReferenceRange(param);

      evaluatedValues.push({
        parameterId: param.id,
        numericValue: valEntry.numericValue !== undefined && valEntry.numericValue !== null && valEntry.numericValue !== ''
          ? parseFloat(valEntry.numericValue)
          : null,
        textValue: valEntry.textValue ? String(valEntry.textValue).trim() : null,
        flag,
        referenceRangeSnapshot,
        unitSnapshot: param.unit || null,
      });
    }

    return prisma.$transaction(async (tx) => {
      // 1. Log immutable correction row
      await tx.labResultCorrection.create({
        data: {
          labResult: { connect: { id: resultId } },
          originalValues: originalSnapshot,
          correctedValues: evaluatedValues,
          reason,
          correctedBy: { connect: { id: correctedByUserId } },
          correctedAt: new Date(),
        },
      });

      // 2. Replace result values
      await tx.labResultValue.deleteMany({
        where: { labResultId: resultId },
      });

      if (evaluatedValues.length > 0) {
        await tx.labResultValue.createMany({
          data: evaluatedValues.map((v) => ({
            labResultId: resultId,
            parameterId: v.parameterId,
            numericValue: v.numericValue,
            textValue: v.textValue,
            flag: v.flag,
            referenceRangeSnapshot: v.referenceRangeSnapshot,
            unitSnapshot: v.unitSnapshot,
          })),
        });
      }

      // 3. Mark Report as AMENDED if already released
      const report = await tx.labReport.findFirst({
        where: { orderId: result.orderItem.orderId },
      });
      if (report && report.status === 'RELEASED') {
        await tx.labReport.update({
          where: { id: report.id },
          data: {
            status: 'AMENDED',
            isAmended: true,
            amendedAt: new Date(),
          },
        });
      }

      return result;
    }, { maxWait: 15000, timeout: 30000 }).then(() => this.getResultById(resultId));
  }
}

module.exports = new LabResultService();
