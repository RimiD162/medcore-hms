const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { generateLabTestCode } = require('../utils/patientIdGenerator');

class LabCatalogService {
  /**
   * List lab tests with parameter definitions, search, category filter, pagination
   */
  async listTests(query = {}) {
    const { search, category, sampleType, isActive, page = 1, limit = 50 } = query;

    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    if (category) {
      where.category = category;
    }

    if (sampleType) {
      where.sampleType = sampleType;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, tests] = await Promise.all([
      prisma.labTest.count({ where }),
      prisma.labTest.findMany({
        where,
        include: {
          parameters: {
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        skip,
        take,
      }),
    ]);

    // Format for consistent frontend and API output
    const formattedTests = tests.map((t) => ({
      ...t,
      testCode: t.code,
      testName: t.name,
      turnaroundTimeMinutes: t.processingTime,
      minSampleVolume: t.sampleVolume,
      parameters: t.parameters.map((p) => ({
        ...p,
        parameterName: p.name,
        minRange: p.low,
        maxRange: p.high,
      })),
    }));

    return {
      tests: formattedTests,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Get single lab test with all parameters
   */
  async getTestById(id) {
    const test = await prisma.labTest.findUnique({
      where: { id },
      include: {
        parameters: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!test) {
      throw ApiError.notFound('Lab test definition not found in catalog');
    }

    return {
      ...test,
      testCode: test.code,
      testName: test.name,
      turnaroundTimeMinutes: test.processingTime,
      minSampleVolume: test.sampleVolume,
      parameters: test.parameters.map((p) => ({
        ...p,
        parameterName: p.name,
        minRange: p.low,
        maxRange: p.high,
      })),
    };
  }

  /**
   * Create new lab test with parameters in catalog
   */
  async createTest(data) {
    const {
      testCode: customCode,
      code,
      testName,
      name,
      category,
      description,
      sampleType = 'BLOOD',
      minSampleVolume,
      sampleVolume,
      turnaroundTimeMinutes,
      processingTime,
      price,
      isActive = true,
      parameters = [],
    } = data;

    const finalName = name || testName || 'Diagnostic Test';
    let finalCode = code || customCode;

    if (!finalCode) {
      finalCode = await generateLabTestCode(category);
    } else {
      const existing = await prisma.labTest.findUnique({ where: { code: finalCode } });
      if (existing) {
        throw ApiError.badRequest(`Lab test code '${finalCode}' already exists`);
      }
    }

    const createdTest = await prisma.$transaction(async (tx) => {
      const test = await tx.labTest.create({
        data: {
          code: finalCode,
          name: finalName,
          category,
          description: description || null,
          sampleType,
          sampleVolume: sampleVolume || minSampleVolume || '2.0 mL',
          processingTime: processingTime || turnaroundTimeMinutes ? parseInt(processingTime || turnaroundTimeMinutes, 10) : 60,
          price: price !== undefined ? parseFloat(price) : 0,
          isActive: Boolean(isActive),
        },
      });

      if (parameters && parameters.length > 0) {
        const paramData = parameters.map((p, idx) => ({
          labTestId: test.id,
          name: p.parameterName || p.name || `Param ${idx + 1}`,
          resultType: p.resultType || p.parameterType || 'NUMERIC',
          unit: p.unit || null,
          low: p.minRange !== undefined && p.minRange !== null && p.minRange !== '' ? parseFloat(p.minRange) : (p.low !== undefined && p.low !== null ? parseFloat(p.low) : null),
          high: p.maxRange !== undefined && p.maxRange !== null && p.maxRange !== '' ? parseFloat(p.maxRange) : (p.high !== undefined && p.high !== null ? parseFloat(p.high) : null),
          criticalLow: p.criticalLow !== undefined && p.criticalLow !== null && p.criticalLow !== '' ? parseFloat(p.criticalLow) : null,
          criticalHigh: p.criticalHigh !== undefined && p.criticalHigh !== null && p.criticalHigh !== '' ? parseFloat(p.criticalHigh) : null,
          allowedOptions: Array.isArray(p.allowedOptions) ? p.allowedOptions : [],
          displayOrder: p.displayOrder !== undefined ? parseInt(p.displayOrder, 10) : idx + 1,
        }));

        await tx.labTestParameter.createMany({
          data: paramData,
        });
      }

      return tx.labTest.findUnique({
        where: { id: test.id },
        include: {
          parameters: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
    });

    return this.getTestById(createdTest.id);
  }

  /**
   * Update lab test and sync parameters
   */
  async updateTest(id, data) {
    const existing = await prisma.labTest.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Lab test not found');
    }

    const {
      testName,
      name,
      category,
      description,
      sampleType,
      minSampleVolume,
      sampleVolume,
      turnaroundTimeMinutes,
      processingTime,
      price,
      isActive,
      parameters,
    } = data;

    await prisma.$transaction(async (tx) => {
      const updatePayload = {};
      if (name || testName) updatePayload.name = name || testName;
      if (category !== undefined) updatePayload.category = category;
      if (description !== undefined) updatePayload.description = description;
      if (sampleType !== undefined) updatePayload.sampleType = sampleType;
      if (sampleVolume || minSampleVolume) updatePayload.sampleVolume = sampleVolume || minSampleVolume;
      if (processingTime || turnaroundTimeMinutes) updatePayload.processingTime = parseInt(processingTime || turnaroundTimeMinutes, 10);
      if (price !== undefined) updatePayload.price = parseFloat(price);
      if (isActive !== undefined) updatePayload.isActive = Boolean(isActive);

      await tx.labTest.update({
        where: { id },
        data: updatePayload,
      });

      if (Array.isArray(parameters)) {
        await tx.labTestParameter.deleteMany({
          where: { labTestId: id },
        });

        if (parameters.length > 0) {
          const paramData = parameters.map((p, idx) => ({
            labTestId: id,
            name: p.parameterName || p.name || `Param ${idx + 1}`,
            resultType: p.resultType || p.parameterType || 'NUMERIC',
            unit: p.unit || null,
            low: p.minRange !== undefined && p.minRange !== null && p.minRange !== '' ? parseFloat(p.minRange) : (p.low !== undefined && p.low !== null ? parseFloat(p.low) : null),
            high: p.maxRange !== undefined && p.maxRange !== null && p.maxRange !== '' ? parseFloat(p.maxRange) : (p.high !== undefined && p.high !== null ? parseFloat(p.high) : null),
            criticalLow: p.criticalLow !== undefined && p.criticalLow !== null && p.criticalLow !== '' ? parseFloat(p.criticalLow) : null,
            criticalHigh: p.criticalHigh !== undefined && p.criticalHigh !== null && p.criticalHigh !== '' ? parseFloat(p.criticalHigh) : null,
            allowedOptions: Array.isArray(p.allowedOptions) ? p.allowedOptions : [],
            displayOrder: p.displayOrder !== undefined ? parseInt(p.displayOrder, 10) : idx + 1,
          }));

          await tx.labTestParameter.createMany({
            data: paramData,
          });
        }
      }
    });

    return this.getTestById(id);
  }

  /**
   * Toggle active state
   */
  async toggleTestStatus(id) {
    const existing = await prisma.labTest.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Lab test not found');
    }

    return prisma.labTest.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }

  /**
   * Get distinct categories
   */
  async listCategories() {
    const tests = await prisma.labTest.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return tests.map((t) => ({ category: t.category }));
  }
}

module.exports = new LabCatalogService();
