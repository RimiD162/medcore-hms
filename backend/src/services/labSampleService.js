const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { generateLabSampleCode } = require('../utils/patientIdGenerator');

class LabSampleService {
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
   * List samples with filters, barcode search, sampleType, status
   */
  async listSamples(query = {}) {
    const {
      search,
      status,
      sampleType,
      priority,
      page = 1,
      limit = 20,
    } = query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (sampleType) {
      where.sampleType = sampleType;
    }

    if (priority) {
      where.order = { priority };
    }

    if (search) {
      where.OR = [
        { sampleCode: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, samples] = await Promise.all([
      prisma.labSample.count({ where }),
      prisma.labSample.findMany({
        where,
        include: {
          patient: {
            select: this.patientDemographicSelect,
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              priority: true,
              status: true,
              orderedAt: true,
              orderingDoctor: {
                include: {
                  user: { select: { fullName: true } },
                },
              },
            },
          },
          collectedBy: {
            select: { id: true, fullName: true, email: true },
          },
          orderItems: {
            include: {
              labTest: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  category: true,
                  processingTime: true,
                },
              },
            },
          },
        },
        orderBy: [
          { order: { priority: 'desc' } },
          { createdAt: 'desc' },
        ],
        skip,
        take,
      }),
    ]);

    const formatted = samples.map((s) => ({
      ...s,
      sampleBarcode: s.sampleCode,
      order: s.order ? { ...s.order, orderDate: s.order.orderedAt, orderedBy: s.order.orderingDoctor } : null,
      items: s.orderItems.map((i) => ({
        ...i,
        test: i.labTest ? { ...i.labTest, testCode: i.labTest.code, testName: i.labTest.name } : null,
      })),
    }));

    return {
      samples: formatted,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Get single sample by ID with complete custody chain
   */
  async getSampleById(id) {
    const sample = await prisma.labSample.findUnique({
      where: { id },
      include: {
        patient: {
          select: this.patientDemographicSelect,
        },
        order: {
          include: {
            orderingDoctor: {
              include: {
                user: { select: { fullName: true, email: true } },
              },
            },
          },
        },
        collectedBy: {
          select: { id: true, fullName: true, email: true },
        },
        receivedBy: {
          select: { id: true, fullName: true, email: true },
        },
        recollectionOf: true,
        recollections: true,
        orderItems: {
          include: {
            labTest: {
              include: {
                parameters: {
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
            results: true,
          },
        },
      },
    });

    if (!sample) {
      throw ApiError.notFound('Lab sample not found');
    }

    return {
      ...sample,
      sampleBarcode: sample.sampleCode,
      order: sample.order ? { ...sample.order, orderDate: sample.order.orderedAt, orderedBy: sample.order.orderingDoctor } : null,
      items: sample.orderItems.map((i) => ({
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
        result: i.results && i.results[0] ? i.results[0] : null,
      })),
      recollectedFrom: sample.recollectionOf,
      recollectedSamples: sample.recollections,
    };
  }

  /**
   * Collect sample with mandatory patient ID confirmation check
   */
  async collectSample(sampleId, data, collectedByUserId) {
    const {
      confirmPatientId,
      patientIdNumber,
      collectionNotes,
      sampleCondition,
    } = data;

    if (confirmPatientId !== true && confirmPatientId !== 'true') {
      throw ApiError.badRequest('Patient identity must be positively confirmed at point of collection (confirmPatientId is required).');
    }

    const sample = await prisma.labSample.findUnique({
      where: { id: sampleId },
      include: {
        patient: true,
        order: { include: { samples: true } },
      },
    });

    if (!sample) {
      throw ApiError.notFound('Lab sample not found');
    }

    if (patientIdNumber && sample.patient.patientIdNumber) {
      if (patientIdNumber.trim().toUpperCase() !== sample.patient.patientIdNumber.trim().toUpperCase()) {
        throw ApiError.badRequest(`Provided patient ID '${patientIdNumber}' does not match specimen target '${sample.patient.patientIdNumber}'`);
      }
    }

    if (sample.status !== 'PENDING') {
      throw ApiError.badRequest(`Cannot collect sample in '${sample.status}' status`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.labSample.update({
        where: { id: sampleId },
        data: {
          status: 'COLLECTED',
          collectedBy: { connect: { id: collectedByUserId } },
          collectedAt: new Date(),
          collectionNotes: collectionNotes || null,
          sampleCondition: sampleCondition || 'Good',
        },
      });

      await tx.labTestOrderItem.updateMany({
        where: { sampleId },
        data: { status: 'SAMPLE_COLLECTED' },
      });

      const allSamples = await tx.labSample.findMany({
        where: { orderId: sample.orderId },
      });
      const allCollected = allSamples.every(
        (s) => s.id === sampleId || s.status === 'COLLECTED' || s.status === 'RECEIVED' || s.status === 'PROCESSING' || s.status === 'PROCESSED'
      );

      if (allCollected) {
        await tx.labTestOrder.update({
          where: { id: sample.orderId },
          data: { status: 'SAMPLE_COLLECTED' },
        });
      }
    }, { maxWait: 15000, timeout: 30000 });

    return this.getSampleById(sampleId);
  }

  /**
   * Receive sample into laboratory (custody handoff)
   */
  async receiveSample(sampleId, data, receivedByUserId) {
    const { conditionNotes, notes } = data;

    const sample = await prisma.labSample.findUnique({
      where: { id: sampleId },
    });

    if (!sample) {
      throw ApiError.notFound('Lab sample not found');
    }

    if (sample.status !== 'COLLECTED') {
      throw ApiError.badRequest(`Sample in status '${sample.status}' cannot be received into lab processing.`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.labSample.update({
        where: { id: sampleId },
        data: {
          status: 'RECEIVED',
          receivedBy: { connect: { id: receivedByUserId } },
          receivedAt: new Date(),
          collectionNotes: conditionNotes || notes
            ? `${sample.collectionNotes ? sample.collectionNotes + ' | ' : ''}Received: ${conditionNotes || notes}`
            : sample.collectionNotes,
        },
      });

      await tx.labTestOrderItem.updateMany({
        where: { sampleId },
        data: { status: 'PROCESSING' },
      });

      await tx.labTestOrder.update({
        where: { id: sample.orderId },
        data: { status: 'PROCESSING' },
      });
    }, { maxWait: 15000, timeout: 30000 });

    return this.getSampleById(sampleId);
  }

  /**
   * Reject sample with structured reason and notification
   */
  async rejectSample(sampleId, data, rejectedByUserId) {
    const { rejectionReason, rejectionNotes } = data;

    if (!rejectionReason) {
      throw ApiError.badRequest('A structured rejectionReason is mandatory for specimen rejection.');
    }

    const sample = await prisma.labSample.findUnique({
      where: { id: sampleId },
      include: {
        patient: true,
        order: {
          include: {
            orderingDoctor: { include: { user: true } },
          },
        },
      },
    });

    if (!sample) {
      throw ApiError.notFound('Lab sample not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.labSample.update({
        where: { id: sampleId },
        data: {
          status: 'REJECTED',
          rejectionReason,
          collectionNotes: rejectionNotes ? `${sample.collectionNotes ? sample.collectionNotes + ' | ' : ''}Rejection Note: ${rejectionNotes}` : sample.collectionNotes,
          rejectedAt: new Date(),
          rejectedBy: { connect: { id: rejectedByUserId } },
        },
      });

      await tx.labTestOrderItem.updateMany({
        where: { sampleId },
        data: { status: 'CANCELLED' },
      });

      if (sample.order?.orderingDoctor?.user?.id) {
        await tx.notification.create({
          data: {
            userId: sample.order.orderingDoctor.user.id,
            title: `Specimen Rejected: ${sample.sampleCode} (${sample.sampleType})`,
            message: `Sample for patient ${sample.patient.fullName} was rejected due to: ${rejectionReason}. ${rejectionNotes ? 'Notes: ' + rejectionNotes : ''}. Recollection recommended.`,
            type: 'URGENT',
            isRead: false,
          },
        }).catch(() => {});
      }
    }, { maxWait: 15000, timeout: 30000 });

    return this.getSampleById(sampleId);
  }

  /**
   * Request / trigger specimen recollection
   */
  async recollectSample(sampleId, data = {}, actingUserId) {
    const { instructions } = data;

    const originalSample = await prisma.labSample.findUnique({
      where: { id: sampleId },
      include: { orderItems: true },
    });

    if (!originalSample) {
      throw ApiError.notFound('Lab sample not found');
    }

    if (originalSample.status !== 'REJECTED') {
      throw ApiError.badRequest('Recollection can only be initiated for rejected specimens');
    }

    const newBarcode = await generateLabSampleCode(originalSample.sampleType);
    let createdSampleId;

    await prisma.$transaction(async (tx) => {
      const newSample = await tx.labSample.create({
        data: {
          sampleCode: newBarcode,
          order: { connect: { id: originalSample.orderId } },
          patient: { connect: { id: originalSample.patientId } },
          sampleType: originalSample.sampleType,
          status: 'PENDING',
          recollectionOf: { connect: { id: sampleId } },
          collectionNotes: instructions ? `Recollection instruction: ${instructions}` : 'Recollection requested',
        },
      });

      createdSampleId = newSample.id;

      await tx.labTestOrderItem.updateMany({
        where: { sampleId: originalSample.id },
        data: {
          sampleId: newSample.id,
          status: 'ORDERED',
        },
      });

      await tx.labTestOrder.update({
        where: { id: originalSample.orderId },
        data: { status: 'ORDERED' },
      });
    }, { maxWait: 15000, timeout: 30000 });

    return this.getSampleById(createdSampleId);
  }
}

module.exports = new LabSampleService();
