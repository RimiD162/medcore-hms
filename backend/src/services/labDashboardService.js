const prisma = require('../config/prisma');

class LabDashboardService {
  /**
   * Laboratory real-time operational dashboard KPIs and queues
   */
  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      pendingCollectionCount,
      samplesInLabCount,
      awaitingResultCount,
      awaitingVerificationCount,
      criticalAlertsTodayCount,
      completedTodayCount,
      statOrdersCount,
      totalCatalogTests,
      recentUrgentOrders,
      criticalResultsQueue,
      sampleTypeBreakdown,
      statusBreakdown,
    ] = await Promise.all([
      // 1. Pending Sample Collection
      prisma.labSample.count({
        where: { status: 'PENDING' },
      }),

      // 2. Samples in Lab (Received, Processing, Collected)
      prisma.labSample.count({
        where: { status: { in: ['RECEIVED', 'PROCESSING', 'COLLECTED'] } },
      }),

      // 3. Tests Awaiting Result Entry
      prisma.labTestOrderItem.count({
        where: { status: { in: ['SAMPLE_COLLECTED', 'PROCESSING'] } },
      }),

      // 4. Results Awaiting Verification
      prisma.labResult.count({
        where: { status: 'ENTERED' },
      }),

      // 5. Critical Alerts Today
      prisma.labResultValue.count({
        where: {
          flag: 'CRITICAL',
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),

      // 6. Reports Released Today
      prisma.labReport.count({
        where: {
          status: 'RELEASED',
          releasedAt: { gte: todayStart, lte: todayEnd },
        },
      }),

      // 7. STAT priority orders pending
      prisma.labTestOrder.count({
        where: {
          priority: 'STAT',
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),

      // 8. Active catalog tests
      prisma.labTest.count({
        where: { isActive: true },
      }),

      // 9. Recent Urgent / STAT Orders
      prisma.labTestOrder.findMany({
        where: {
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              age: true,
              gender: true,
            },
          },
          orderingDoctor: {
            include: {
              user: { select: { fullName: true } },
            },
          },
          items: {
            include: {
              labTest: { select: { name: true, code: true, category: true } },
            },
          },
          samples: {
            select: { sampleCode: true, status: true, sampleType: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { orderedAt: 'desc' },
        ],
        take: 6,
      }),

      // 10. Critical Results Queue
      prisma.labResult.findMany({
        where: {
          values: { some: { flag: 'CRITICAL' } },
          status: { not: 'VERIFIED' },
        },
        include: {
          orderItem: {
            include: {
              labTest: { select: { name: true, code: true } },
              order: {
                select: {
                  orderNumber: true,
                  patient: {
                    select: { fullName: true, patientIdNumber: true },
                  },
                },
              },
            },
          },
          enteredBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // 11. Sample Type breakdown
      prisma.labSample.groupBy({
        by: ['sampleType'],
        _count: { id: true },
      }),

      // 12. Order status breakdown
      prisma.labTestOrder.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    return {
      kpis: {
        pendingCollectionCount,
        samplesInLabCount,
        awaitingResultCount,
        awaitingVerificationCount,
        criticalAlertsTodayCount,
        completedTodayCount,
        statOrdersCount,
        totalCatalogTests,
      },
      recentUrgentOrders: recentUrgentOrders.map((o) => ({
        ...o,
        orderDate: o.orderedAt,
        orderedBy: o.orderingDoctor,
        items: o.items.map((i) => ({
          ...i,
          test: i.labTest ? { ...i.labTest, testName: i.labTest.name, testCode: i.labTest.code } : null,
        })),
        samples: o.samples.map((s) => ({ ...s, sampleBarcode: s.sampleCode })),
      })),
      criticalResultsQueue: criticalResultsQueue.map((r) => ({
        ...r,
        test: r.orderItem?.labTest ? { ...r.orderItem.labTest, testName: r.orderItem.labTest.name, testCode: r.orderItem.labTest.code } : null,
        order: r.orderItem?.order,
      })),
      sampleTypeBreakdown: sampleTypeBreakdown.map((s) => ({
        sampleType: s.sampleType,
        count: s._count.id,
      })),
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    };
  }
}

module.exports = new LabDashboardService();
