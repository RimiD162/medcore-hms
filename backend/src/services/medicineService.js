const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { generateMedicineCode } = require('../utils/patientIdGenerator');

class MedicineService {
  /**
   * List medicines with search, category, status filters, and pagination
   */
  async getMedicines(query = {}) {
    const { search, category, status, sortBy = 'name', sortOrder = 'asc', page = 1, limit = 20 } = query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { brandName: { contains: search, mode: 'insensitive' } },
        { medicineCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const orderBy = {};
    if (sortBy === 'price') {
      orderBy.sellingPrice = sortOrder;
    } else if (sortBy === 'category') {
      orderBy.category = sortOrder;
    } else {
      orderBy.name = sortOrder;
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [total, medicines] = await Promise.all([
      prisma.medicine.count({ where }),
      prisma.medicine.findMany({
        where,
        include: {
          batches: {
            where: {
              status: 'Active',
              expiryDate: { gte: today },
            },
            select: {
              id: true,
              batchNumber: true,
              expiryDate: true,
              quantityAvailable: true,
            },
            orderBy: { expiryDate: 'asc' },
          },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    // Calculate usable stock per medicine
    const enriched = medicines.map((med) => {
      const usableStock = med.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);
      let stockStatus = 'In Stock';
      if (usableStock === 0) {
        stockStatus = 'Out of Stock';
      } else if (usableStock <= med.reorderLevel) {
        stockStatus = 'Low Stock';
      }

      return {
        ...med,
        usableStock,
        stockStatus,
        activeBatchCount: med.batches.length,
      };
    });

    return {
      medicines: enriched,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get single medicine by ID with batch and recent transaction history
   */
  async getMedicineById(id) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const medicine = await prisma.medicine.findUnique({
      where: { id },
      include: {
        batches: {
          orderBy: { expiryDate: 'asc' },
        },
        stockTransactions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            batch: { select: { batchNumber: true } },
            performedBy: { select: { fullName: true } },
          },
        },
      },
    });

    if (!medicine) {
      throw ApiError.notFound('Medicine not found in catalog');
    }

    const usableStock = medicine.batches
      .filter((b) => b.status === 'Active' && new Date(b.expiryDate) >= today)
      .reduce((sum, b) => sum + b.quantityAvailable, 0);

    let stockStatus = 'In Stock';
    if (usableStock === 0) {
      stockStatus = 'Out of Stock';
    } else if (usableStock <= medicine.reorderLevel) {
      stockStatus = 'Low Stock';
    }

    return {
      ...medicine,
      usableStock,
      stockStatus,
    };
  }

  /**
   * Create new medicine with duplicate detection warning
   */
  async createMedicine(data, user) {
    // Check for likely duplicates (name + strength + dosageForm + manufacturer)
    const existing = await prisma.medicine.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        strength: { equals: data.strength, mode: 'insensitive' },
        dosageForm: { equals: data.dosageForm, mode: 'insensitive' },
        manufacturer: { equals: data.manufacturer, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw ApiError.conflict(
        `A formulation of ${data.name} (${data.strength} ${data.dosageForm}) from ${data.manufacturer} already exists under code ${existing.medicineCode}`
      );
    }

    const medicineCode = await generateMedicineCode();

    const created = await prisma.medicine.create({
      data: {
        medicineCode,
        name: data.name,
        genericName: data.genericName,
        brandName: data.brandName || null,
        category: data.category,
        manufacturer: data.manufacturer,
        strength: data.strength,
        dosageForm: data.dosageForm,
        route: data.route || 'Oral',
        unit: data.unit || 'Tablets',
        sellingPrice: data.sellingPrice,
        reorderLevel: data.reorderLevel ?? 20,
        status: data.status || 'Active',
        description: data.description || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.fullName || 'Pharmacist',
        role: 'PHARMACIST',
        action: 'CREATE_MEDICINE',
        entity: 'Medicine',
        entityId: created.id,
        description: `Created catalog medicine ${created.name} (${created.medicineCode}) with unit price $${created.sellingPrice}`,
      },
    });

    return created;
  }

  /**
   * Update medicine metadata, price, or active status
   */
  async updateMedicine(id, data, user) {
    const existing = await prisma.medicine.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Medicine not found');
    }

    // If deactivating, check if pending prescription items reference it
    if (data.status === 'Inactive' && existing.status === 'Active') {
      const pendingCount = await prisma.prescriptionItem.count({
        where: {
          medicineId: id,
          prescription: {
            dispensingStatus: { in: ['PENDING', 'PARTIALLY_DISPENSED'] },
          },
        },
      });

      if (pendingCount > 0) {
        console.warn(`Warning: Deactivating medicine ${existing.name} with ${pendingCount} pending prescription items`);
      }
    }

    const updated = await prisma.medicine.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.genericName && { genericName: data.genericName }),
        ...(data.brandName !== undefined && { brandName: data.brandName }),
        ...(data.category && { category: data.category }),
        ...(data.manufacturer && { manufacturer: data.manufacturer }),
        ...(data.strength && { strength: data.strength }),
        ...(data.dosageForm && { dosageForm: data.dosageForm }),
        ...(data.route && { route: data.route }),
        ...(data.unit && { unit: data.unit }),
        ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
        ...(data.reorderLevel !== undefined && { reorderLevel: data.reorderLevel }),
        ...(data.status && { status: data.status }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.fullName || 'Pharmacist',
        role: 'PHARMACIST',
        action: 'UPDATE_MEDICINE',
        entity: 'Medicine',
        entityId: id,
        description: `Updated medicine ${updated.name} (${updated.medicineCode})`,
      },
    });

    return updated;
  }
}

module.exports = new MedicineService();
