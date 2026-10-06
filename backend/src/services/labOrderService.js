const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { generateLabOrderNumber, generateLabSampleCode } = require('../utils/patientIdGenerator');

class LabOrderService {
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
      emergencyContact: true,
    };
  }

  /**
   * List lab test orders
   */
  async listOrders(query = {}, user = null) {
    const {
      search,
      status,
      priority,
      patientId,
      doctorId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (doctorId) {
      where.orderingDoctorId = doctorId;
    }

    if (startDate || endDate) {
      where.orderedAt = {};
      if (startDate) where.orderedAt.gte = new Date(startDate);
      if (endDate) where.orderedAt.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
        { items: { some: { testNameSnapshot: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, orders] = await Promise.all([
      prisma.labTestOrder.count({ where }),
      prisma.labTestOrder.findMany({
        where,
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
          items: {
            include: {
              labTest: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  category: true,
                  sampleType: true,
                  processingTime: true,
                  price: true,
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
              results: {
                select: {
                  id: true,
                  status: true,
                  version: true,
                  values: {
                    select: { flag: true },
                  },
                },
              },
            },
          },
          samples: {
            select: {
              id: true,
              sampleCode: true,
              sampleType: true,
              status: true,
              collectedAt: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { orderedAt: 'desc' },
        ],
        skip,
        take,
      }),
    ]);

    // Format for output
    const formatted = orders.map((o) => ({
      ...o,
      orderDate: o.orderedAt,
      orderedBy: o.orderingDoctor,
      samples: o.samples.map((s) => ({ ...s, sampleBarcode: s.sampleCode })),
      items: o.items.map((i) => ({
        ...i,
        test: i.labTest ? { ...i.labTest, testCode: i.labTest.code, testName: i.labTest.name } : null,
        sample: i.sample ? { ...i.sample, sampleBarcode: i.sample.sampleCode } : null,
        result: i.results && i.results[0] ? {
          ...i.results[0],
          isCritical: i.results[0].values.some((v) => v.flag === 'CRITICAL'),
          overallFlag: i.results[0].values.some((v) => v.flag === 'CRITICAL') ? 'CRITICAL' : 'NORMAL',
        } : null,
      })),
    }));

    return {
      orders: formatted,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Get single lab order by ID with all relations
   */
  async getOrderById(id, user = null) {
    const order = await prisma.labTestOrder.findUnique({
      where: { id },
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
        items: {
          include: {
            labTest: {
              include: {
                parameters: {
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
            sample: true,
            results: {
              include: {
                values: {
                  include: {
                    parameter: true,
                  },
                },
                corrections: {
                  orderBy: { correctedAt: 'desc' },
                  include: {
                    correctedBy: {
                      select: { fullName: true, email: true },
                    },
                  },
                },
                enteredBy: {
                  select: { fullName: true, email: true },
                },
                verifiedBy: {
                  select: { fullName: true, email: true },
                },
              },
            },
          },
        },
        samples: {
          include: {
            collectedBy: {
              select: { fullName: true, email: true },
            },
            recollectionOf: true,
            recollections: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        reports: {
          include: {
            verifiedBy: {
              select: { fullName: true, email: true },
            },
            releasedBy: {
              select: { fullName: true, email: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Lab test order not found');
    }

    return {
      ...order,
      orderDate: order.orderedAt,
      orderedBy: order.orderingDoctor,
      samples: order.samples.map((s) => ({
        ...s,
        sampleBarcode: s.sampleCode,
        recollectedFrom: s.recollectionOf,
        recollectedSamples: s.recollections,
      })),
      items: order.items.map((i) => {
        const primaryResult = i.results && i.results[0] ? i.results[0] : null;
        const isCritical = primaryResult?.values?.some((v) => v.flag === 'CRITICAL') || false;
        const overallFlag = isCritical ? 'CRITICAL' : (primaryResult?.values?.some((v) => v.flag === 'LOW' || v.flag === 'HIGH') ? 'HIGH' : 'NORMAL');

        return {
          ...i,
          test: i.labTest ? {
            ...i.labTest,
            testCode: i.labTest.code,
            testName: i.labTest.name,
            parameters: i.labTest.parameters.map((p) => ({
              ...p,
              parameterName: p.name,
              minRange: p.low,
              maxRange: p.high,
            })),
          } : null,
          sample: i.sample ? { ...i.sample, sampleBarcode: i.sample.sampleCode } : null,
          result: primaryResult ? {
            ...primaryResult,
            isCritical,
            overallFlag,
            values: primaryResult.values.map((v) => ({
              ...v,
              unit: v.unitSnapshot || v.parameter?.unit,
              numericValue: v.numericValue !== null ? Number(v.numericValue) : null,
            })),
          } : null,
        };
      }),
    };
  }

  /**
   * Create lab test order with multi-test and automatic specimen grouping
   */
  async createOrder(doctorId, data) {
    const {
      patientId,
      items: rawItems,
      testIds: rawTestIds,
      priority = 'ROUTINE',
      clinicalNotes,
      clinicalIndication,
    } = data;

    let itemConfigs = [];
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      itemConfigs = rawItems.map((item) =>
        typeof item === 'string' ? { testId: item } : { testId: item.testId || item.id, notes: item.notes }
      );
    } else if (Array.isArray(rawTestIds) && rawTestIds.length > 0) {
      itemConfigs = rawTestIds.map((id) => ({ testId: id }));
    } else if (data.testId) {
      itemConfigs = [{ testId: data.testId, notes: data.notes }];
    }

    if (itemConfigs.length === 0) {
      throw ApiError.badRequest('At least one laboratory test must be selected');
    }

    // Validate patient
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw ApiError.notFound('Patient not found');
    }

    // Ensure ordering doctor profile
    let doctorProfileId = doctorId;
    if (!doctorProfileId) {
      const defaultDoc = await prisma.doctorProfile.findFirst();
      doctorProfileId = defaultDoc ? defaultDoc.id : null;
    }

    if (!doctorProfileId) {
      throw ApiError.badRequest('A valid doctor profile is required to place diagnostic orders');
    }

    // Fetch tests
    const testIds = itemConfigs.map((c) => c.testId);
    const tests = await prisma.labTest.findMany({
      where: { id: { in: testIds }, isActive: true },
    });

    const testMap = new Map(tests.map((t) => [t.id, t]));

    // Group tests by sampleType
    const sampleTypeMap = new Map();
    for (const test of tests) {
      const sType = test.sampleType || 'BLOOD';
      if (!sampleTypeMap.has(sType)) {
        sampleTypeMap.set(sType, []);
      }
      sampleTypeMap.get(sType).push(test);
    }

    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const orderNumber = await generateLabOrderNumber(tx);

      const order = await tx.labTestOrder.create({
        data: {
          orderNumber,
          patient: { connect: { id: patientId } },
          orderingDoctor: { connect: { id: doctorProfileId } },
          priority,
          status: 'ORDERED',
          clinicalIndication: clinicalNotes || clinicalIndication || null,
        },
      });

      // 2. Create Samples for each sampleType
      const sampleRecords = new Map();
      for (const [sampleType, testsForType] of sampleTypeMap.entries()) {
        const sampleBarcode = await generateLabSampleCode(sampleType, tx);

        const sample = await tx.labSample.create({
          data: {
            sampleCode: sampleBarcode,
            order: { connect: { id: order.id } },
            patient: { connect: { id: patientId } },
            sampleType,
            status: 'PENDING',
          },
        });
        sampleRecords.set(sampleType, sample);
      }

      // 3. Create Order Items
      for (const itemConfig of itemConfigs) {
        const test = testMap.get(itemConfig.testId);
        const sample = sampleRecords.get(test.sampleType || 'BLOOD');

        await tx.labTestOrderItem.create({
          data: {
            order: { connect: { id: order.id } },
            labTest: { connect: { id: test.id } },
            testNameSnapshot: test.name,
            priceSnapshot: test.price || 0,
            status: 'ORDERED',
            sample: sample ? { connect: { id: sample.id } } : undefined,
          },
        });
      }

      // 4. Shared Hospital Billing (InvoiceItem source: "LAB")
      const openInvoice = await tx.invoice.findFirst({
        where: {
          patientId,
          status: { in: ['PENDING', 'PARTIALLY_PAID'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (openInvoice) {
        for (const test of tests) {
          await tx.invoiceItem.create({
            data: {
              invoice: { connect: { id: openInvoice.id } },
              serviceName: `Lab Test: ${test.name} (${test.code})`,
              category: 'Diagnostic',
              source: 'LAB',
              quantity: 1,
              unitPrice: test.price || 0,
              totalPrice: test.price || 0,
            },
          });
        }
      }

      return order;
    }, { maxWait: 15000, timeout: 30000 });

    return this.getOrderById(createdOrder.id);
  }

  /**
   * Cancel lab order
   */
  async cancelOrder(id, reason, user = null) {
    const order = await prisma.labTestOrder.findUnique({
      where: { id },
      include: { samples: true, items: true },
    });

    if (!order) {
      throw ApiError.notFound('Lab test order not found');
    }

    if (order.status === 'COMPLETED') {
      throw ApiError.badRequest('Cannot cancel an order that has already been completed');
    }

    const collectedOrProcessing = order.samples.some(
      (s) => s.status === 'PROCESSING' || s.status === 'RECEIVED_IN_LAB' || s.status === 'COLLECTED'
    );
    if (collectedOrProcessing) {
      throw ApiError.badRequest('Cannot cancel order after samples have been collected or received in laboratory');
    }

    await prisma.$transaction(async (tx) => {
      await tx.labSample.updateMany({
        where: { orderId: id },
        data: { status: 'CANCELLED' },
      });

      await tx.labTestOrderItem.updateMany({
        where: { orderId: id },
        data: {
          status: 'CANCELLED',
          cancelReason: reason || 'Order cancelled',
          cancelledAt: new Date(),
        },
      });

      await tx.labTestOrder.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          clinicalIndication: order.clinicalIndication
            ? `${order.clinicalIndication}\n[Cancelled: ${reason || 'User cancelled'}]`
            : `[Cancelled: ${reason || 'User cancelled'}]`,
        },
      });
    });

    return this.getOrderById(id);
  }
}

module.exports = new LabOrderService();
