const prisma = require('../config/prisma');
const { roundMoney, calculateInvoiceTotals, isInvoiceOverdue } = require('../utils/financeMoney');
const { PAYMENT_METHODS, EXPENSE_CATEGORIES } = require('../config/billingConfig');

/**
 * Sanitizes CSV cell values against spreadsheet formula injection (CSV Injection)
 * Prevents execution of `=,+,-,@,\t,\r` by prefixing with a single quote (')
 */
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // If starts with risky character, prefix with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape inner double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Converts an array of objects to CSV format with UTF-8 BOM
 */
function arrayToCsv(headers, rows) {
  const headerLine = headers.map((h) => sanitizeCsvCell(h.label || h.key || h)).join(',');
  const rowLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = typeof h.accessor === 'function' ? h.accessor(row) : row[h.key || h];
        return sanitizeCsvCell(val);
      })
      .join(',')
  );

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

class FinancialReportService {
  /**
   * Daily Collections Report
   */
  async getDailyCollectionsReport(startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: start, lte: end },
        status: 'COMPLETED',
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            patient: { select: { id: true, patientIdNumber: true, fullName: true, phone: true } },
          },
        },
        receivedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    // Group by Date and Payment Method
    const dailyMap = {};
    const methodSummary = {};

    let totalCollected = 0;

    for (const p of payments) {
      const amount = roundMoney(p.amount);
      totalCollected = roundMoney(totalCollected + amount);

      const dateKey = new Date(p.paymentDate).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          total: 0,
          count: 0,
          byMethod: {},
        };
      }

      dailyMap[dateKey].total = roundMoney(dailyMap[dateKey].total + amount);
      dailyMap[dateKey].count += 1;
      dailyMap[dateKey].byMethod[p.paymentMethod] = roundMoney(
        (dailyMap[dateKey].byMethod[p.paymentMethod] || 0) + amount
      );

      methodSummary[p.paymentMethod] = roundMoney((methodSummary[p.paymentMethod] || 0) + amount);
    }

    const dailyBreakdown = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));

    return {
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      totalCollected: roundMoney(totalCollected),
      totalTransactions: payments.length,
      methodSummary,
      dailyBreakdown,
      payments: payments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        invoiceNumber: p.invoice?.invoiceNumber,
        patientName: p.invoice?.patient?.fullName || 'N/A',
        patientId: p.invoice?.patient?.patientIdNumber || 'N/A',
        amount: roundMoney(p.amount),
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate,
        recordedBy: p.receivedBy?.fullName || 'Staff',
        transactionRef: p.referenceNumber || '-',
      })),
    };
  }

  /**
   * Revenue by Department / Service Category Report
   */
  async getRevenueByDepartmentReport(startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          invoiceDate: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
      },
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, invoiceDate: true, status: true },
        },
      },
    });

    const categoryMap = {};
    let totalGross = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalNet = 0;

    for (const item of invoiceItems) {
      const cat = item.serviceType || 'OTHER';
      const qty = item.quantity || 1;
      const unitPrice = roundMoney(item.unitPrice);
      const gross = roundMoney(unitPrice * qty);
      const discount = roundMoney(item.discount || 0);
      const tax = roundMoney(item.taxAmount || 0);
      const net = roundMoney(item.totalPrice);

      if (!categoryMap[cat]) {
        categoryMap[cat] = {
          department: cat,
          itemCount: 0,
          grossRevenue: 0,
          discountAmount: 0,
          taxAmount: 0,
          netRevenue: 0,
        };
      }

      categoryMap[cat].itemCount += qty;
      categoryMap[cat].grossRevenue = roundMoney(categoryMap[cat].grossRevenue + gross);
      categoryMap[cat].discountAmount = roundMoney(categoryMap[cat].discountAmount + discount);
      categoryMap[cat].taxAmount = roundMoney(categoryMap[cat].taxAmount + tax);
      categoryMap[cat].netRevenue = roundMoney(categoryMap[cat].netRevenue + net);

      totalGross = roundMoney(totalGross + gross);
      totalDiscount = roundMoney(totalDiscount + discount);
      totalTax = roundMoney(totalTax + tax);
      totalNet = roundMoney(totalNet + net);
    }

    const departments = Object.values(categoryMap).map((d) => ({
      ...d,
      sharePercentage: totalNet > 0 ? roundMoney((d.netRevenue / totalNet) * 100) : 0,
    }));

    departments.sort((a, b) => b.netRevenue - a.netRevenue);

    return {
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      summary: {
        totalGross: roundMoney(totalGross),
        totalDiscount: roundMoney(totalDiscount),
        totalTax: roundMoney(totalTax),
        totalNet: roundMoney(totalNet),
      },
      departments,
    };
  }

  /**
   * Outstanding Aging Analysis Report
   */
  async getOutstandingAgingReport() {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      },
      include: {
        patient: {
          select: { id: true, patientIdNumber: true, fullName: true, phone: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const buckets = {
      current: { label: '0–30 Days', count: 0, totalAmount: 0, invoices: [] },
      thirtyToSixty: { label: '31–60 Days', count: 0, totalAmount: 0, invoices: [] },
      sixtyToNinety: { label: '61–90 Days', count: 0, totalAmount: 0, invoices: [] },
      overNinety: { label: '90+ Days (High Risk)', count: 0, totalAmount: 0, invoices: [] },
    };

    let totalOutstanding = 0;

    for (const inv of invoices) {
      const outstanding = roundMoney(inv.totalAmount - (inv.paidAmount || 0));
      if (outstanding <= 0) continue;

      totalOutstanding = roundMoney(totalOutstanding + outstanding);

      const refDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate || inv.createdAt);
      const diffMs = now.getTime() - refDate.getTime();
      const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      const invoiceRow = {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        patientName: inv.patient?.fullName || 'N/A',
        patientId: inv.patient?.patientIdNumber || 'N/A',
        phone: inv.patient?.phone || 'N/A',
        totalAmount: roundMoney(inv.totalAmount),
        paidAmount: roundMoney(inv.paidAmount || 0),
        outstandingAmount: outstanding,
        dueDate: inv.dueDate,
        daysOverdue: diffDays,
        status: inv.status,
      };

      if (diffDays <= 30) {
        buckets.current.count += 1;
        buckets.current.totalAmount = roundMoney(buckets.current.totalAmount + outstanding);
        buckets.current.invoices.push(invoiceRow);
      } else if (diffDays <= 60) {
        buckets.thirtyToSixty.count += 1;
        buckets.thirtyToSixty.totalAmount = roundMoney(buckets.thirtyToSixty.totalAmount + outstanding);
        buckets.thirtyToSixty.invoices.push(invoiceRow);
      } else if (diffDays <= 90) {
        buckets.sixtyToNinety.count += 1;
        buckets.sixtyToNinety.totalAmount = roundMoney(buckets.sixtyToNinety.totalAmount + outstanding);
        buckets.sixtyToNinety.invoices.push(invoiceRow);
      } else {
        buckets.overNinety.count += 1;
        buckets.overNinety.totalAmount = roundMoney(buckets.overNinety.totalAmount + outstanding);
        buckets.overNinety.invoices.push(invoiceRow);
      }
    }

    return {
      asOfDate: now.toISOString(),
      totalOutstanding: roundMoney(totalOutstanding),
      totalInvoices: invoices.length,
      buckets,
    };
  }

  /**
   * Income / Financial Summary Statement (Management View)
   */
  async getIncomeStatementSummary(startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const [billedSummary, collectionsSummary, refundsSummary, expensesSummary] = await Promise.all([
      // Gross Billed on Invoices
      prisma.invoice.aggregate({
        where: {
          invoiceDate: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true, subtotal: true, taxAmount: true, discountAmount: true },
        _count: { id: true },
      }),

      // Actual Cash Collections
      prisma.payment.aggregate({
        where: {
          paymentDate: { gte: start, lte: end },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Processed Cash Refunds
      prisma.refund.aggregate({
        where: {
          processedAt: { gte: start, lte: end },
          status: 'PROCESSED',
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Approved / Recorded Expenses
      prisma.expense.aggregate({
        where: {
          expenseDate: { gte: start, lte: end },
          status: { in: ['RECORDED', 'APPROVED'] },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalBilled = roundMoney(billedSummary._sum.totalAmount || 0);
    const totalCollected = roundMoney(collectionsSummary._sum.amount || 0);
    const totalRefunded = roundMoney(refundsSummary._sum.amount || 0);
    const netRevenueCollected = roundMoney(totalCollected - totalRefunded);
    const totalExpenses = roundMoney(expensesSummary._sum.amount || 0);
    const netOperatingSurplus = roundMoney(netRevenueCollected - totalExpenses);

    return {
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      billed: {
        subtotal: roundMoney(billedSummary._sum.subtotal || 0),
        tax: roundMoney(billedSummary._sum.taxAmount || 0),
        discount: roundMoney(billedSummary._sum.discountAmount || 0),
        totalBilled,
        invoiceCount: billedSummary._count.id || 0,
      },
      cashFlow: {
        totalCollections: totalCollected,
        totalRefunds: totalRefunded,
        netCollections: netRevenueCollected,
        totalExpenses,
        netSurplus: netOperatingSurplus,
      },
    };
  }

  /**
   * Export reports as streamable sanitized CSV
   */
  async exportReportCsv(reportType, filters = {}) {
    if (reportType === 'daily_collections') {
      const data = await this.getDailyCollectionsReport(filters.startDate, filters.endDate);
      const headers = [
        { key: 'paymentNumber', label: 'Payment #' },
        { key: 'invoiceNumber', label: 'Invoice #' },
        { key: 'paymentDate', label: 'Date', accessor: (r) => new Date(r.paymentDate).toLocaleDateString() },
        { key: 'patientName', label: 'Patient Name' },
        { key: 'patientId', label: 'Patient ID' },
        { key: 'paymentMethod', label: 'Method' },
        { key: 'amount', label: 'Amount (INR)', accessor: (r) => r.amount.toFixed(2) },
        { key: 'transactionRef', label: 'Transaction Ref' },
        { key: 'recordedBy', label: 'Cashier' },
      ];
      return {
        filename: `Daily_Collections_${new Date().toISOString().split('T')[0]}.csv`,
        csv: arrayToCsv(headers, data.payments),
      };
    }

    if (reportType === 'department_revenue') {
      const data = await this.getRevenueByDepartmentReport(filters.startDate, filters.endDate);
      const headers = [
        { key: 'department', label: 'Department / Category' },
        { key: 'itemCount', label: 'Service Units' },
        { key: 'grossRevenue', label: 'Gross Revenue (INR)', accessor: (r) => r.grossRevenue.toFixed(2) },
        { key: 'discountAmount', label: 'Discounts (INR)', accessor: (r) => r.discountAmount.toFixed(2) },
        { key: 'taxAmount', label: 'Taxes (INR)', accessor: (r) => r.taxAmount.toFixed(2) },
        { key: 'netRevenue', label: 'Net Billed (INR)', accessor: (r) => r.netRevenue.toFixed(2) },
        { key: 'sharePercentage', label: 'Revenue Share (%)', accessor: (r) => `${r.sharePercentage}%` },
      ];
      return {
        filename: `Department_Revenue_${new Date().toISOString().split('T')[0]}.csv`,
        csv: arrayToCsv(headers, data.departments),
      };
    }

    if (reportType === 'aging_outstanding') {
      const data = await this.getOutstandingAgingReport();
      const allInvoices = [
        ...data.buckets.current.invoices.map((i) => ({ ...i, bucket: '0-30 Days' })),
        ...data.buckets.thirtyToSixty.invoices.map((i) => ({ ...i, bucket: '31-60 Days' })),
        ...data.buckets.sixtyToNinety.invoices.map((i) => ({ ...i, bucket: '61-90 Days' })),
        ...data.buckets.overNinety.invoices.map((i) => ({ ...i, bucket: '90+ Days' })),
      ];

      const headers = [
        { key: 'invoiceNumber', label: 'Invoice #' },
        { key: 'patientName', label: 'Patient Name' },
        { key: 'patientId', label: 'Patient ID' },
        { key: 'phone', label: 'Phone' },
        { key: 'bucket', label: 'Aging Bucket' },
        { key: 'daysOverdue', label: 'Days Overdue' },
        { key: 'totalAmount', label: 'Total Billed (INR)', accessor: (r) => r.totalAmount.toFixed(2) },
        { key: 'paidAmount', label: 'Paid Amount (INR)', accessor: (r) => r.paidAmount.toFixed(2) },
        { key: 'outstandingAmount', label: 'Outstanding (INR)', accessor: (r) => r.outstandingAmount.toFixed(2) },
        { key: 'status', label: 'Status' },
      ];
      return {
        filename: `Outstanding_Aging_${new Date().toISOString().split('T')[0]}.csv`,
        csv: arrayToCsv(headers, allInvoices),
      };
    }

    if (reportType === 'expenses_summary') {
      const expenses = await prisma.expense.findMany({
        where: {
          ...(filters.startDate || filters.endDate
            ? {
                expenseDate: {
                  ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
                  ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
                },
              }
            : {}),
        },
        orderBy: { expenseDate: 'desc' },
      });

      const headers = [
        { key: 'expenseNumber', label: 'Expense #' },
        { key: 'expenseDate', label: 'Date', accessor: (r) => new Date(r.expenseDate).toLocaleDateString() },
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'vendorName', label: 'Vendor' },
        { key: 'referenceNumber', label: 'Ref #' },
        { key: 'amount', label: 'Amount (INR)', accessor: (r) => roundMoney(r.amount).toFixed(2) },
        { key: 'taxAmount', label: 'Tax (INR)', accessor: (r) => roundMoney(r.taxAmount || 0).toFixed(2) },
        { key: 'status', label: 'Status' },
      ];

      return {
        filename: `Expenses_Summary_${new Date().toISOString().split('T')[0]}.csv`,
        csv: arrayToCsv(headers, expenses),
      };
    }

    const err = new Error(`Unsupported report type: ${reportType}`);
    err.statusCode = 400;
    throw err;
  }
}

module.exports = new FinancialReportService();
module.exports.sanitizeCsvCell = sanitizeCsvCell;
module.exports.arrayToCsv = arrayToCsv;
