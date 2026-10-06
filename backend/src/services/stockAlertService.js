const prisma = require('../config/prisma');

class StockAlertService {
  /**
   * Get medicines with low stock (usable stock <= reorderLevel) or out of stock (usable stock == 0)
   */
  async getLowStockMedicines(query = {}) {
    const { category, urgency, page = 1, limit = 20 } = query;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const medicines = await prisma.medicine.findMany({
      where: {
        status: 'Active',
        ...(category && category !== 'ALL' && { category }),
      },
      include: {
        batches: {
          where: {
            status: 'Active',
            expiryDate: { gte: today },
          },
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const lowStockItems = [];

    for (const med of medicines) {
      const usableStock = med.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);

      if (usableStock <= med.reorderLevel) {
        let urgencyLevel = 'LOW_STOCK';
        if (usableStock === 0) {
          urgencyLevel = 'OUT_OF_STOCK';
        } else if (usableStock <= Math.floor(med.reorderLevel / 2)) {
          urgencyLevel = 'CRITICAL_LOW';
        }

        if (!urgency || urgency === 'ALL' || urgency === urgencyLevel) {
          lowStockItems.push({
            ...med,
            usableStock,
            deficit: Math.max(0, med.reorderLevel - usableStock),
            urgencyLevel,
            activeBatches: med.batches,
          });
        }
      }
    }

    // Sort by urgency: OUT_OF_STOCK first, then CRITICAL_LOW, then LOW_STOCK
    const urgencyWeight = { OUT_OF_STOCK: 0, CRITICAL_LOW: 1, LOW_STOCK: 2 };
    lowStockItems.sort((a, b) => urgencyWeight[a.urgencyLevel] - urgencyWeight[b.urgencyLevel]);

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);
    const paginated = lowStockItems.slice(skip, skip + take);

    return {
      lowStock: paginated,
      summary: {
        totalLowStock: lowStockItems.length,
        outOfStockCount: lowStockItems.filter((m) => m.urgencyLevel === 'OUT_OF_STOCK').length,
        criticalLowCount: lowStockItems.filter((m) => m.urgencyLevel === 'CRITICAL_LOW').length,
      },
      pagination: {
        total: lowStockItems.length,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(lowStockItems.length / take) || 1,
      },
    };
  }

  /**
   * Get batches categorized by expiry window (Expired, 30 days, 60 days, 90 days)
   */
  async getExpiryBuckets(query = {}) {
    const { bucket = 'ALL', page = 1, limit = 20 } = query;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const in30Days = new Date(today.getTime() + 30 * 86400000);
    const in60Days = new Date(today.getTime() + 60 * 86400000);
    const in90Days = new Date(today.getTime() + 90 * 86400000);

    const batches = await prisma.medicineBatch.findMany({
      where: {
        status: { in: ['Active', 'Expired'] },
        quantityAvailable: { gt: 0 },
      },
      include: {
        medicine: {
          select: {
            id: true,
            medicineCode: true,
            name: true,
            genericName: true,
            category: true,
            unit: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const categorized = [];

    for (const b of batches) {
      const exp = new Date(b.expiryDate);
      const diffMs = exp.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffMs / 86400000);

      let bucketName = null;
      let recommendedAction = 'Monitor Stock';

      if (daysUntilExpiry < 0) {
        bucketName = 'EXPIRED';
        recommendedAction = 'Quarantine & Write Off immediately';
      } else if (daysUntilExpiry <= 30) {
        bucketName = '30_DAYS';
        recommendedAction = 'Prioritize for dispensing (FEFO) or return to vendor';
      } else if (daysUntilExpiry <= 60) {
        bucketName = '60_DAYS';
        recommendedAction = 'FEFO dispensing priority';
      } else if (daysUntilExpiry <= 90) {
        bucketName = '90_DAYS';
        recommendedAction = 'Regular dispensing cycle';
      }

      if (bucketName && (bucket === 'ALL' || bucket === bucketName)) {
        categorized.push({
          ...b,
          daysUntilExpiry,
          bucketName,
          recommendedAction,
        });
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);
    const paginated = categorized.slice(skip, skip + take);

    return {
      batches: paginated,
      summary: {
        expiredCount: categorized.filter((b) => b.bucketName === 'EXPIRED').length,
        in30DaysCount: categorized.filter((b) => b.bucketName === '30_DAYS').length,
        in60DaysCount: categorized.filter((b) => b.bucketName === '60_DAYS').length,
        in90DaysCount: categorized.filter((b) => b.bucketName === '90_DAYS').length,
      },
      pagination: {
        total: categorized.length,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(categorized.length / take) || 1,
      },
    };
  }
}

module.exports = new StockAlertService();
