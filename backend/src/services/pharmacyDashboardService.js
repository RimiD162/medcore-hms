const prisma = require('../config/prisma');

class PharmacyDashboardService {
  /**
   * Aggregate live KPI metrics and dashboard sections for Pharmacist
   */
  async getDashboardMetrics() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today.getTime() + 86400000 - 1);
    const in30Days = new Date(today.getTime() + 30 * 86400000);

    const [
      totalMedicines,
      allActiveBatches,
      allExpiredBatches,
      pendingRxCount,
      dispensedTodayCount,
      todaySalesItems,
      pendingPrescriptions,
      recentTransactions,
      allMedicines,
    ] = await Promise.all([
      prisma.medicine.count({ where: { status: 'Active' } }),
      prisma.medicineBatch.findMany({
        where: {
          status: 'Active',
          expiryDate: { gte: today },
        },
        select: {
          quantityAvailable: true,
          expiryDate: true,
        },
      }),
      prisma.medicineBatch.count({
        where: {
          OR: [
            { status: 'Expired' },
            { expiryDate: { lt: today } },
          ],
          quantityAvailable: { gt: 0 },
        },
      }),
      prisma.prescription.count({
        where: {
          dispensingStatus: { in: ['PENDING', 'PARTIALLY_DISPENSED'] },
          onHold: false,
        },
      }),
      prisma.dispensing.count({
        where: {
          createdAt: { gte: today, lte: endOfDay },
        },
      }),
      prisma.invoiceItem.findMany({
        where: {
          source: 'PHARMACY',
          createdAt: { gte: today, lte: endOfDay },
        },
        select: { totalPrice: true },
      }),
      prisma.prescription.findMany({
        where: {
          dispensingStatus: { in: ['PENDING', 'PARTIALLY_DISPENSED', 'ON_HOLD'] },
        },
        take: 8,
        orderBy: { prescribedDate: 'desc' },
        select: {
          id: true,
          prescriptionNumber: true,
          prescribedDate: true,
          dispensingStatus: true,
          onHold: true,
          holdReason: true,
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
              department: true,
              user: { select: { fullName: true } },
            },
          },
          items: {
            select: {
              id: true,
              medicineName: true,
              medicineId: true,
              quantityPrescribed: true,
              quantityDispensed: true,
            },
          },
        },
      }),
      prisma.stockTransaction.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          medicine: { select: { name: true, medicineCode: true, unit: true } },
          batch: { select: { batchNumber: true } },
          performedBy: { select: { fullName: true } },
        },
      }),
      prisma.medicine.findMany({
        where: { status: 'Active' },
        include: {
          batches: {
            where: { status: 'Active', expiryDate: { gte: today } },
            select: { quantityAvailable: true },
          },
        },
      }),
    ]);

    // Calculate total usable stock units
    const totalStockUnits = allActiveBatches.reduce((acc, b) => acc + b.quantityAvailable, 0);

    // Calculate low stock count
    let lowStockCount = 0;
    const lowStockAlerts = [];

    for (const med of allMedicines) {
      const stock = med.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);
      if (stock <= med.reorderLevel) {
        lowStockCount++;
        lowStockAlerts.push({
          id: med.id,
          name: med.name,
          medicineCode: med.medicineCode,
          category: med.category,
          unit: med.unit,
          usableStock: stock,
          reorderLevel: med.reorderLevel,
          isOutOfStock: stock === 0,
        });
      }
    }

    // Near-expiry batches count (<= 30 days) + expired
    const expiringSoonCount = allActiveBatches.filter(
      (b) => new Date(b.expiryDate) <= in30Days
    ).length;
    const totalExpiryRiskBatches = expiringSoonCount + allExpiredBatches;

    // Today's billed sales
    const todaySalesTotal = todaySalesItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    return {
      stats: {
        totalMedicines,
        totalStockUnits,
        pendingPrescriptions: pendingRxCount,
        prescriptionsDispensedToday: dispensedTodayCount,
        lowStockMedicines: lowStockCount,
        expiryRiskBatches: totalExpiryRiskBatches,
        todayBilledSales: todaySalesTotal,
      },
      pendingPrescriptions,
      lowStockAlerts: lowStockAlerts.slice(0, 5),
      recentTransactions,
    };
  }
}

module.exports = new PharmacyDashboardService();
