const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class PrescriptionQueueService {
  /**
   * List prescriptions in the pharmacy queue
   */
  async getPrescriptionQueue(query = {}) {
    const { search, status = 'ACTIVE', page = 1, limit = 20 } = query;

    const where = {};

    if (status === 'ACTIVE') {
      where.dispensingStatus = { in: ['PENDING', 'PARTIALLY_DISPENSED', 'ON_HOLD'] };
    } else if (status && status !== 'ALL') {
      where.dispensingStatus = status;
    }

    if (search) {
      where.OR = [
        { prescriptionNumber: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientIdNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, prescriptions] = await Promise.all([
      prisma.prescription.count({ where }),
      prisma.prescription.findMany({
        where,
        select: {
          id: true,
          prescriptionNumber: true,
          prescribedDate: true,
          dispensingStatus: true,
          onHold: true,
          holdReason: true,
          notes: true,
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              age: true,
              gender: true,
              allergies: true,
            },
          },
          doctor: {
            select: {
              id: true,
              department: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          items: {
            select: {
              id: true,
              medicineId: true,
              medicineName: true,
              dosage: true,
              frequency: true,
              duration: true,
              quantityPrescribed: true,
              quantityDispensed: true,
            },
          },
        },
        orderBy: [{ prescribedDate: 'desc' }],
        skip,
        take,
      }),
    ]);

    const enriched = prescriptions.map((rx) => {
      const totalItems = rx.items.length;
      const unmappedItems = rx.items.filter((i) => !i.medicineId).length;
      const isFullyMapped = unmappedItems === 0;

      return {
        ...rx,
        totalItems,
        unmappedItems,
        isFullyMapped,
      };
    });

    return {
      prescriptions: enriched,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get single prescription detail with safe demographic projection and stock availability per item
   */
  async getPrescriptionDetail(prescriptionId) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      select: {
        id: true,
        prescriptionNumber: true,
        prescribedDate: true,
        dispensingStatus: true,
        onHold: true,
        holdReason: true,
        heldAt: true,
        notes: true,
        patient: {
          select: {
            id: true,
            patientIdNumber: true,
            fullName: true,
            age: true,
            gender: true,
            allergies: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            department: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        heldBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                medicineCode: true,
                name: true,
                genericName: true,
                strength: true,
                dosageForm: true,
                unit: true,
                sellingPrice: true,
                reorderLevel: true,
                status: true,
                batches: {
                  where: {
                    status: 'Active',
                    expiryDate: { gte: today },
                    quantityAvailable: { gt: 0 },
                  },
                  orderBy: { expiryDate: 'asc' }, // FEFO default
                  select: {
                    id: true,
                    batchNumber: true,
                    expiryDate: true,
                    quantityAvailable: true,
                    sellingPrice: true,
                  },
                },
              },
            },
          },
        },
        dispensings: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            pharmacist: { select: { fullName: true } },
          },
        },
      },
    });

    if (!prescription) {
      throw ApiError.notFound('Prescription not found');
    }

    // Enrich items with calculated suggestions and stock availability
    const enrichedItems = prescription.items.map((item) => {
      let suggestedQuantity = null;

      // Smart derivation for suggestion when quantity is absent
      // e.g. "1-0-1" (2/day) x "5 Days" = 10
      if (!item.quantityPrescribed) {
        const freqMatch = item.frequency.match(/(\d)-(\d)-(\d)/);
        const durMatch = item.duration.match(/(\d+)\s*Day/i);
        if (freqMatch && durMatch) {
          const dosesPerDay = parseInt(freqMatch[1], 10) + parseInt(freqMatch[2], 10) + parseInt(freqMatch[3], 10);
          const days = parseInt(durMatch[1], 10);
          if (dosesPerDay > 0 && days > 0) {
            suggestedQuantity = dosesPerDay * days;
          }
        }
      }

      const availableStock = item.medicine?.batches?.reduce(
        (sum, b) => sum + b.quantityAvailable,
        0
      ) || 0;

      const remainingQuantity = (item.quantityPrescribed || 0) - item.quantityDispensed;

      return {
        ...item,
        suggestedQuantity,
        availableStock,
        remainingQuantity: Math.max(0, remainingQuantity),
        isStockSufficient: item.quantityPrescribed ? availableStock >= remainingQuantity : availableStock > 0,
        eligibleBatches: item.medicine?.batches || [],
      };
    });

    return {
      ...prescription,
      items: enrichedItems,
    };
  }

  /**
   * Map free-text prescription item to a catalog medicine and set/confirm quantity
   */
  async mapPrescriptionItem(prescriptionId, itemId, data, user) {
    const { medicineId, quantityPrescribed } = data;

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { items: true },
    });

    if (!prescription) {
      throw ApiError.notFound('Prescription not found');
    }

    const item = prescription.items.find((i) => i.id === itemId);
    if (!item) {
      throw ApiError.notFound('Prescription item not found in this prescription');
    }

    const medicine = await prisma.medicine.findUnique({
      where: { id: medicineId },
    });

    if (!medicine || medicine.status !== 'Active') {
      throw ApiError.badRequest('Selected medicine is not active in the catalog');
    }

    const updated = await prisma.prescriptionItem.update({
      where: { id: itemId },
      data: {
        medicineId,
        ...(quantityPrescribed && { quantityPrescribed }),
      },
      include: {
        medicine: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.fullName || 'Pharmacist',
        role: 'PHARMACIST',
        action: 'MAP_PRESCRIPTION_ITEM',
        entity: 'PrescriptionItem',
        entityId: itemId,
        description: `Mapped item "${item.medicineName}" to catalog medicine ${medicine.name} (${medicine.medicineCode})`,
      },
    });

    return updated;
  }

  /**
   * Place prescription on hold with mandatory clinical/operational reason
   */
  async holdPrescription(prescriptionId, data, user) {
    const { reason } = data;

    if (!reason || reason.trim().length < 3) {
      throw ApiError.badRequest('A mandatory reason (min 3 chars) is required to place prescription on hold');
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        doctor: {
          include: { user: true },
        },
        patient: true,
      },
    });

    if (!prescription) {
      throw ApiError.notFound('Prescription not found');
    }

    const updated = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        onHold: true,
        holdReason: reason,
        heldById: user?.id || null,
        heldAt: new Date(),
        dispensingStatus: 'ON_HOLD',
      },
    });

    // Send notification to prescribing Doctor
    if (prescription.doctor?.user?.id) {
      await prisma.notification.create({
        data: {
          userId: prescription.doctor.user.id,
          title: 'Prescription Placed On Hold (Pharmacy)',
          message: `Prescription #${prescription.prescriptionNumber} for ${prescription.patient.fullName} was placed on hold by Pharmacy. Reason: ${reason}`,
          type: 'URGENT',
          entityType: 'Prescription',
          entityId: prescriptionId,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.fullName || 'Pharmacist',
        role: 'PHARMACIST',
        action: 'HOLD_PRESCRIPTION',
        entity: 'Prescription',
        entityId: prescriptionId,
        description: `Placed prescription #${prescription.prescriptionNumber} on hold. Reason: ${reason}`,
      },
    });

    return updated;
  }

  /**
   * Release prescription from hold
   */
  async releasePrescription(prescriptionId, user) {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: true,
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    if (!prescription) {
      throw ApiError.notFound('Prescription not found');
    }

    // Determine derived status
    const allDispensed = prescription.items.every(
      (i) => i.quantityPrescribed && i.quantityDispensed >= i.quantityPrescribed
    );
    const someDispensed = prescription.items.some((i) => i.quantityDispensed > 0);

    let nextStatus = 'PENDING';
    if (allDispensed) nextStatus = 'DISPENSED';
    else if (someDispensed) nextStatus = 'PARTIALLY_DISPENSED';

    const updated = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        onHold: false,
        holdReason: null,
        heldById: null,
        heldAt: null,
        dispensingStatus: nextStatus,
      },
    });

    // Notify doctor
    if (prescription.doctor?.user?.id) {
      await prisma.notification.create({
        data: {
          userId: prescription.doctor.user.id,
          title: 'Prescription Released from Hold (Pharmacy)',
          message: `Prescription #${prescription.prescriptionNumber} for ${prescription.patient.fullName} has been released and resumed for dispensing.`,
          type: 'INFO',
          entityType: 'Prescription',
          entityId: prescriptionId,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.fullName || 'Pharmacist',
        role: 'PHARMACIST',
        action: 'RELEASE_PRESCRIPTION',
        entity: 'Prescription',
        entityId: prescriptionId,
        description: `Released prescription #${prescription.prescriptionNumber} from hold back to queue (${nextStatus})`,
      },
    });

    return updated;
  }
}

module.exports = new PrescriptionQueueService();
