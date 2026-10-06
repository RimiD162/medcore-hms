const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class BatchService {
  /**
   * List batches with filters (medicineId, status, expiry window) and pagination
   */
  async getBatches(query = {}) {
    const { search, medicineId, status, expiryBucket, page = 1, limit = 20 } = query;

    const where = {};
    if (medicineId) where.medicineId = medicineId;
    if (status && status !== 'ALL') where.status = status;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (expiryBucket === 'EXPIRED') {
      where.expiryDate = { lt: today };
    } else if (expiryBucket === '30_DAYS') {
      const in30Days = new Date(today.getTime() + 30 * 86400000);
      where.expiryDate = { gte: today, lte: in30Days };
    } else if (expiryBucket === '60_DAYS') {
      const in60Days = new Date(today.getTime() + 60 * 86400000);
      where.expiryDate = { gte: today, lte: in60Days };
    } else if (expiryBucket === '90_DAYS') {
      const in90Days = new Date(today.getTime() + 90 * 86400000);
      where.expiryDate = { gte: today, lte: in90Days };
    }

    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { medicine: { name: { contains: search, mode: 'insensitive' } } },
        { medicine: { genericName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, batches] = await Promise.all([
      prisma.medicineBatch.count({ where }),
      prisma.medicineBatch.findMany({
        where,
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
            },
          },
        },
        orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
    ]);

    // Calculate days to expiry and derived status
    const enriched = batches.map((b) => {
      const exp = new Date(b.expiryDate);
      const diffMs = exp.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffMs / 86400000);

      let expiryStatus = 'Valid';
      if (daysUntilExpiry < 0) {
        expiryStatus = 'Expired';
      } else if (daysUntilExpiry <= 30) {
        expiryStatus = 'Expiring Soon (30d)';
      } else if (daysUntilExpiry <= 60) {
        expiryStatus = 'Expiring (60d)';
      } else if (daysUntilExpiry <= 90) {
        expiryStatus = 'Expiring (90d)';
      }

      return {
        ...b,
        daysUntilExpiry,
        expiryStatus,
      };
    });

    return {
      batches: enriched,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Get single batch by ID
   */
  async getBatchById(id) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const batch = await prisma.medicineBatch.findUnique({
      where: { id },
      include: {
        medicine: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: {
            performedBy: { select: { fullName: true } },
          },
        },
      },
    });

    if (!batch) {
      throw ApiError.notFound('Batch not found');
    }

    const exp = new Date(batch.expiryDate);
    const diffMs = exp.getTime() - today.getTime();
    const daysUntilExpiry = Math.ceil(diffMs / 86400000);

    return {
      ...batch,
      daysUntilExpiry,
    };
  }
}

module.exports = new BatchService();
