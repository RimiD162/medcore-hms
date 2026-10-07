/**
 * Shared Financial Metrics Service
 * Single source of truth for hospital revenue, collections, outstanding balances,
 * overdue counts, category breakdowns, and dashboard KPI calculations.
 */

const prisma = require('../config/prisma');
const billingConfig = require('../config/billingConfig');
const { roundMoney } = require('../utils/financeMoney');

class FinancialMetricsService {
  /**
   * Helper to get start and end boundaries for today, this week, this month in UTC / Hospital TZ
   */
  getDateBoundaries(referenceDate = new Date()) {
    const now = new Date(referenceDate);

    // Today (00:00:00 to 23:59:59.999)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Yesterday for comparison
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    // This Month (1st of month to end of month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(nextMonthStart.getTime() - 1);

    // Last Month for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(monthStart.getTime() - 1);

    // Year Start
    const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

    return {
      todayStart,
      todayEnd,
      yesterdayStart,
      yesterdayEnd,
      monthStart,
      monthEnd,
      lastMonthStart,
      lastMonthEnd,
      yearStart,
    };
  }

  /**
   * Calculate Collections for a given date range
   * Collections = Completed Payments (by paymentDate) - Processed Refunds (by processedAt)
   */
  async getCollections(startDate, endDate) {
    const paymentWhere = {
      status: 'COMPLETED',
      ...(startDate && endDate && {
        paymentDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const refundWhere = {
      status: 'PROCESSED',
      ...(startDate && endDate && {
        processedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [paymentsSum, refundsSum] = await Promise.all([
      prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
      }),
      prisma.refund.aggregate({
        where: refundWhere,
        _sum: { amount: true },
      }),
    ]);

    const totalPaid = Number(paymentsSum._sum.amount || 0);
    const totalRefunded = Number(refundsSum._sum.amount || 0);

    return roundMoney(totalPaid - totalRefunded);
  }

  /**
   * Calculate Billed Net Revenue for a given date range
   * Net Revenue = Gross - Discounts (Tax excluded and reported separately)
   */
  async getNetRevenue(startDate, endDate) {
    const where = {
      status: { not: 'CANCELLED' },
      ...(startDate && endDate && {
        invoiceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const invoiceAgg = await prisma.invoice.aggregate({
      where,
      _sum: {
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        totalAmount: true,
        adjustmentAmount: true,
      },
      _count: { id: true },
    });

    const subtotal = Number(invoiceAgg._sum.subtotal || 0);
    const discount = Number(invoiceAgg._sum.discountAmount || 0);
    const tax = Number(invoiceAgg._sum.taxAmount || 0);
    const adjustments = Number(invoiceAgg._sum.adjustmentAmount || 0);
    const count = invoiceAgg._count.id;

    const grossRevenue = roundMoney(subtotal + (adjustments < 0 ? adjustments : 0));
    const netRevenue = roundMoney(subtotal - discount + adjustments);
    const billedTotal = roundMoney(netRevenue + tax);

    return {
      grossRevenue,
      netRevenue,
      taxAmount: roundMoney(tax),
      billedTotal,
      invoiceCount: count,
    };
  }

  /**
   * Executive Dashboard KPI Summary
   */
  async getDashboardSummary(referenceDate = new Date()) {
    const boundaries = this.getDateBoundaries(referenceDate);

    // Execute queries in parallel
    const [
      todayRevenueData,
      yesterdayRevenueData,
      monthRevenueData,
      lastMonthRevenueData,
      todayCollections,
      yesterdayCollections,
      monthCollections,
      pendingInvoicesCount,
      totalOutstandingAgg,
      overdueInvoicesList,
      monthlyExpensesAgg,
      lastMonthExpensesAgg,
      totalInvoicesMonthCount,
      recentPayments,
      recentInvoices,
    ] = await Promise.all([
      // 1. Today's Revenue (Billed basis)
      this.getNetRevenue(boundaries.todayStart, boundaries.todayEnd),
      this.getNetRevenue(boundaries.yesterdayStart, boundaries.yesterdayEnd),

      // 2. Month's Revenue (Billed basis)
      this.getNetRevenue(boundaries.monthStart, boundaries.monthEnd),
      this.getNetRevenue(boundaries.lastMonthStart, boundaries.lastMonthEnd),

      // 3. Collections (Cash basis)
      this.getCollections(boundaries.todayStart, boundaries.todayEnd),
      this.getCollections(boundaries.yesterdayStart, boundaries.yesterdayEnd),
      this.getCollections(boundaries.monthStart, boundaries.monthEnd),

      // 4. Pending Payments Count
      prisma.invoice.count({
        where: { status: 'PENDING' },
      }),

      // 5. Total Outstanding on Non-Cancelled Invoices
      prisma.invoice.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { outstandingAmount: true },
      }),

      // 6. Overdue Invoices
      prisma.invoice.findMany({
        where: {
          status: { in: ['PENDING', 'PARTIALLY_PAID'] },
          dueDate: { lt: boundaries.todayStart },
          outstandingAmount: { gt: 0 },
        },
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),

      // 7. Monthly Expenses (Recorded basis)
      prisma.expense.aggregate({
        where: {
          status: 'RECORDED',
          expenseDate: {
            gte: boundaries.monthStart,
            lte: boundaries.monthEnd,
          },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          status: 'RECORDED',
          expenseDate: {
            gte: boundaries.lastMonthStart,
            lte: boundaries.lastMonthEnd,
          },
        },
        _sum: { amount: true },
      }),

      // 8. Total Invoices Count this month
      prisma.invoice.count({
        where: {
          status: { not: 'CANCELLED' },
          invoiceDate: {
            gte: boundaries.monthStart,
            lte: boundaries.monthEnd,
          },
        },
      }),

      // 9. Recent Payments (Latest 6)
      prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        take: 6,
      }),

      // 10. Recent Invoices (Latest 6)
      prisma.invoice.findMany({
        include: {
          patient: {
            select: {
              id: true,
              patientIdNumber: true,
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    const totalOutstanding = Number(totalOutstandingAgg._sum.outstandingAmount || 0);
    const monthlyExpenses = Number(monthlyExpensesAgg._sum.amount || 0);
    const lastMonthExpenses = Number(lastMonthExpensesAgg._sum.amount || 0);

    // Compute backend trends (only when non-zero baseline exists, else null)
    const computeTrend = (current, previous) => {
      if (previous === 0 || previous === null || previous === undefined) return null;
      const diff = current - previous;
      const pct = (diff / previous) * 100;
      return {
        direction: pct >= 0 ? 'up' : 'down',
        percentage: Math.abs(roundMoney(pct)),
        label: `${pct >= 0 ? '+' : '-'}${Math.abs(roundMoney(pct))}% vs prev`,
      };
    };

    const todayRevTrend = computeTrend(todayRevenueData.netRevenue, yesterdayRevenueData.netRevenue);
    const monthRevTrend = computeTrend(monthRevenueData.netRevenue, lastMonthRevenueData.netRevenue);
    const todayPayTrend = computeTrend(todayCollections, yesterdayCollections);
    const expenseTrend = computeTrend(monthlyExpenses, lastMonthExpenses);

    // Categorize Overdue Invoices
    const overdueList = overdueInvoicesList.map((inv) => {
      const due = new Date(inv.dueDate);
      const diffDays = Math.max(1, Math.floor((boundaries.todayStart - due) / (86400000)));
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        patientName: inv.patient.fullName,
        patientIdNumber: inv.patient.patientIdNumber,
        phone: inv.patient.phone,
        dueDate: inv.dueDate,
        daysOverdue: diffDays,
        outstandingAmount: Number(inv.outstandingAmount),
        totalAmount: Number(inv.totalAmount),
        status: inv.status,
      };
    });

    return {
      kpis: {
        todayRevenue: {
          value: todayRevenueData.netRevenue,
          basis: 'Billed net revenue (Invoice date)',
          trend: todayRevTrend,
        },
        totalRevenueThisMonth: {
          value: monthRevenueData.netRevenue,
          basis: 'Billed net revenue (Invoice date)',
          trend: monthRevTrend,
        },
        todayPayments: {
          value: todayCollections,
          basis: 'Cash collections (Payment date less refunds)',
          trend: todayPayTrend,
        },
        monthCollections: {
          value: monthCollections,
          basis: 'Cash collections (Payment date less refunds)',
        },
        pendingInvoices: {
          value: pendingInvoicesCount,
          basis: 'Invoices awaiting first payment',
        },
        outstandingBalance: {
          value: roundMoney(totalOutstanding),
          basis: 'Uncollected balance on active invoices',
        },
        overdueInvoices: {
          value: overdueList.length,
          basis: 'Past due date with remaining balance',
        },
        monthlyExpenses: {
          value: roundMoney(monthlyExpenses),
          basis: 'Recorded operating expenses this month',
          trend: expenseTrend,
        },
        totalInvoicesThisMonth: {
          value: totalInvoicesMonthCount,
          basis: 'Active invoices created this month',
        },
      },
      recentPayments,
      recentInvoices,
      overdueInvoices: overdueList,
    };
  }

  /**
   * Revenue by Line Item Category / Source (from InvoiceItems, not invoice type)
   */
  async getRevenueBySource(startDate, endDate) {
    const where = {
      invoice: {
        status: { not: 'CANCELLED' },
        ...(startDate && endDate && {
          invoiceDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
    };

    const items = await prisma.invoiceItem.findMany({
      where,
      select: {
        category: true,
        source: true,
        totalPrice: true,
        quantity: true,
      },
    });

    const categoryMap = new Map();
    let grandTotal = 0;

    for (const item of items) {
      const cat = item.category || 'General';
      const amount = Number(item.totalPrice || 0);
      grandTotal += amount;

      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { category: cat, totalAmount: 0, itemsCount: 0 });
      }
      const entry = categoryMap.get(cat);
      entry.totalAmount = roundMoney(entry.totalAmount + amount);
      entry.itemsCount += item.quantity || 1;
    }

    const categories = Array.from(categoryMap.values()).map((c) => ({
      ...c,
      percentage: grandTotal > 0 ? roundMoney((c.totalAmount / grandTotal) * 100) : 0,
    }));

    categories.sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      totalRevenue: roundMoney(grandTotal),
      breakdown: categories,
    };
  }
}

module.exports = new FinancialMetricsService();
