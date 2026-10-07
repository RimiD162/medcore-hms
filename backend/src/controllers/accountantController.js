const prisma = require('../config/prisma');
const ApiResponse = require('../utils/ApiResponse');
const invoiceService = require('../services/invoiceService');
const paymentService = require('../services/paymentService');
const refundService = require('../services/refundService');
const billingAdjustmentService = require('../services/billingAdjustmentService');
const expenseService = require('../services/expenseService');
const transactionService = require('../services/transactionService');
const financialReportService = require('../services/financialReportService');
const financialMetricsService = require('../services/financialMetricsService');
const billingConfig = require('../config/billingConfig');

const {
  createInvoiceSchema,
  cancelInvoiceSchema,
  recordPaymentSchema,
  voidPaymentSchema,
  createAdjustmentSchema,
  requestRefundSchema,
  approveRefundSchema,
  processRefundSchema,
  rejectRefundSchema,
  createExpenseSchema,
  cancelExpenseSchema,
  updateProfileSchema,
} = require('../validators/accountantValidators');

class AccountantController {
  // ── 1. Dashboard & KPIs ──
  async getDashboardKpis(req, res) {
    try {
      const kpis = await financialMetricsService.getDashboardKpis();

      // Recent Activity
      const [recentInvoices, recentPayments, recentExpenses, pendingRefundsCount] = await Promise.all([
        prisma.invoice.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: { select: { id: true, patientIdNumber: true, fullName: true, phone: true } },
          },
        }),
        prisma.payment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: { status: 'COMPLETED' },
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                patient: { select: { id: true, patientIdNumber: true, fullName: true } },
              },
            },
          },
        }),
        prisma.expense.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.refund.count({
          where: { status: 'REQUESTED' },
        }),
      ]);

      return ApiResponse.success(res, 'Dashboard metrics retrieved successfully', {
        ...kpis,
        pendingRefundsCount,
        recentInvoices,
        recentPayments,
        recentExpenses,
      });
    } catch (err) {
      console.error('Error fetching accountant dashboard:', err);
      return ApiResponse.error(res, err.message || 'Failed to fetch dashboard metrics', err.statusCode || 500);
    }
  }

  // ── 2. Invoices ──
  async listInvoices(req, res) {
    try {
      const result = await invoiceService.listInvoices(req.query, req.query);
      return ApiResponse.success(res, 'Invoices retrieved successfully', result);
    } catch (err) {
      console.error('Error listing invoices:', err);
      return ApiResponse.error(res, err.message || 'Failed to list invoices', err.statusCode || 500);
    }
  }

  async getInvoiceById(req, res) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.params.id);
      return ApiResponse.success(res, 'Invoice details retrieved successfully', invoice);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      return ApiResponse.error(res, err.message || 'Failed to fetch invoice', err.statusCode || 500);
    }
  }

  async createInvoice(req, res) {
    try {
      const parseResult = createInvoiceSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid invoice data', parseResult.error.flatten());
      }

      const invoice = await invoiceService.createInvoice(parseResult.data, req.user);
      return ApiResponse.created(res, 'Invoice created successfully', invoice);
    } catch (err) {
      console.error('Error creating invoice:', err);
      return ApiResponse.error(res, err.message || 'Failed to create invoice', err.statusCode || 500);
    }
  }

  async cancelInvoice(req, res) {
    try {
      const parseResult = cancelInvoiceSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid cancellation reason', parseResult.error.flatten());
      }

      const result = await invoiceService.cancelInvoice(req.params.id, req.user, parseResult.data.reason);
      return ApiResponse.success(res, 'Invoice cancelled successfully', result);
    } catch (err) {
      console.error('Error cancelling invoice:', err);
      return ApiResponse.error(res, err.message || 'Failed to cancel invoice', err.statusCode || 500);
    }
  }

  async createAdjustment(req, res) {
    try {
      const parseResult = createAdjustmentSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid adjustment data', parseResult.error.flatten());
      }

      const result = await billingAdjustmentService.createAdjustment(req.params.id, parseResult.data, req.user);
      return ApiResponse.created(res, 'Invoice adjustment applied successfully', result);
    } catch (err) {
      console.error('Error creating adjustment:', err);
      return ApiResponse.error(res, err.message || 'Failed to apply adjustment', err.statusCode || 500);
    }
  }

  // ── 3. Payments ──
  async listPayments(req, res) {
    try {
      const result = await paymentService.listPayments(req.query, req.query);
      return ApiResponse.success(res, 'Payments retrieved successfully', result);
    } catch (err) {
      console.error('Error listing payments:', err);
      return ApiResponse.error(res, err.message || 'Failed to list payments', err.statusCode || 500);
    }
  }

  async recordPayment(req, res) {
    try {
      const parseResult = recordPaymentSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid payment data', parseResult.error.flatten());
      }

      const invoiceId = req.params.invoiceId || req.body.invoiceId;
      if (!invoiceId) {
        return ApiResponse.badRequest(res, 'Invoice ID is required to record payment');
      }

      const result = await paymentService.recordPayment(invoiceId, parseResult.data, req.user);
      return ApiResponse.created(res, 'Payment recorded successfully', result);
    } catch (err) {
      console.error('Error recording payment:', err);
      return ApiResponse.error(res, err.message || 'Failed to record payment', err.statusCode || 500);
    }
  }

  async voidPayment(req, res) {
    try {
      const parseResult = voidPaymentSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid void reason', parseResult.error.flatten());
      }

      const result = await paymentService.voidPayment(req.params.paymentId, parseResult.data.reason, req.user);
      return ApiResponse.success(res, 'Payment voided successfully', result);
    } catch (err) {
      console.error('Error voiding payment:', err);
      return ApiResponse.error(res, err.message || 'Failed to void payment', err.statusCode || 500);
    }
  }

  // ── 4. Outstanding Aging ──
  async getOutstandingAging(req, res) {
    try {
      const report = await financialReportService.getOutstandingAgingReport();
      return ApiResponse.success(res, 'Outstanding aging report retrieved successfully', report);
    } catch (err) {
      console.error('Error fetching aging report:', err);
      return ApiResponse.error(res, err.message || 'Failed to fetch aging report', err.statusCode || 500);
    }
  }

  // ── 5. Refunds ──
  async listRefunds(req, res) {
    try {
      const result = await refundService.listRefunds(req.query, req.query);
      return ApiResponse.success(res, 'Refunds retrieved successfully', result);
    } catch (err) {
      console.error('Error listing refunds:', err);
      return ApiResponse.error(res, err.message || 'Failed to list refunds', err.statusCode || 500);
    }
  }

  async requestRefund(req, res) {
    try {
      const parseResult = requestRefundSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid refund request data', parseResult.error.flatten());
      }

      const invoiceId = req.params.invoiceId || req.body.invoiceId;
      if (!invoiceId) {
        return ApiResponse.badRequest(res, 'Invoice ID is required for refund request');
      }

      const result = await refundService.requestRefund(invoiceId, parseResult.data, req.user);
      return ApiResponse.created(res, 'Refund requested successfully', result);
    } catch (err) {
      console.error('Error requesting refund:', err);
      return ApiResponse.error(res, err.message || 'Failed to request refund', err.statusCode || 500);
    }
  }

  async approveRefund(req, res) {
    try {
      const parseResult = approveRefundSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid approval data', parseResult.error.flatten());
      }

      const result = await refundService.approveRefund(req.params.refundId, req.user, parseResult.data?.notes);
      return ApiResponse.success(res, 'Refund approved successfully', result);
    } catch (err) {
      console.error('Error approving refund:', err);
      return ApiResponse.error(res, err.message || 'Failed to approve refund', err.statusCode || 500);
    }
  }

  async processRefund(req, res) {
    try {
      const parseResult = processRefundSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid process data', parseResult.error.flatten());
      }

      const result = await refundService.processRefund(req.params.refundId, parseResult.data, req.user);
      return ApiResponse.success(res, 'Refund processed successfully', result);
    } catch (err) {
      console.error('Error processing refund:', err);
      return ApiResponse.error(res, err.message || 'Failed to process refund', err.statusCode || 500);
    }
  }

  async rejectRefund(req, res) {
    try {
      const parseResult = rejectRefundSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid rejection data', parseResult.error.flatten());
      }

      const result = await refundService.rejectRefund(req.params.refundId, parseResult.data.rejectionReason, req.user);
      return ApiResponse.success(res, 'Refund rejected successfully', result);
    } catch (err) {
      console.error('Error rejecting refund:', err);
      return ApiResponse.error(res, err.message || 'Failed to reject refund', err.statusCode || 500);
    }
  }

  // ── 6. Expenses ──
  async listExpenses(req, res) {
    try {
      const result = await expenseService.listExpenses(req.query, req.query);
      return ApiResponse.success(res, 'Expenses retrieved successfully', result);
    } catch (err) {
      console.error('Error listing expenses:', err);
      return ApiResponse.error(res, err.message || 'Failed to list expenses', err.statusCode || 500);
    }
  }

  async getExpenseById(req, res) {
    try {
      const expense = await expenseService.getExpenseById(req.params.id);
      return ApiResponse.success(res, 'Expense details retrieved successfully', expense);
    } catch (err) {
      console.error('Error fetching expense:', err);
      return ApiResponse.error(res, err.message || 'Failed to fetch expense', err.statusCode || 500);
    }
  }

  async createExpense(req, res) {
    try {
      const parseResult = createExpenseSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid expense data', parseResult.error.flatten());
      }

      const expense = await expenseService.createExpense(parseResult.data, req.user);
      return ApiResponse.created(res, 'Expense recorded successfully', expense);
    } catch (err) {
      console.error('Error creating expense:', err);
      if (err.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: err.message,
          duplicateDetails: err.duplicateDetails,
        });
      }
      return ApiResponse.error(res, err.message || 'Failed to record expense', err.statusCode || 500);
    }
  }

  async approveExpense(req, res) {
    try {
      const result = await expenseService.approveExpense(req.params.id, req.user, req.body.notes);
      return ApiResponse.success(res, 'Expense approved successfully', result);
    } catch (err) {
      console.error('Error approving expense:', err);
      return ApiResponse.error(res, err.message || 'Failed to approve expense', err.statusCode || 500);
    }
  }

  async cancelExpense(req, res) {
    try {
      const parseResult = cancelExpenseSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid cancellation reason', parseResult.error.flatten());
      }

      const result = await expenseService.cancelExpense(req.params.id, req.user, parseResult.data.reason);
      return ApiResponse.success(res, 'Expense cancelled successfully', result);
    } catch (err) {
      console.error('Error cancelling expense:', err);
      return ApiResponse.error(res, err.message || 'Failed to cancel expense', err.statusCode || 500);
    }
  }

  async getExpenseCategories(req, res) {
    try {
      const result = await expenseService.getExpenseCategoriesSummary(req.query.startDate, req.query.endDate);
      return ApiResponse.success(res, 'Expense categories summary retrieved successfully', result);
    } catch (err) {
      console.error('Error fetching expense categories:', err);
      return ApiResponse.error(res, err.message || 'Failed to fetch categories summary', err.statusCode || 500);
    }
  }

  // ── 7. Transactions (Unified Derived Stream) ──
  async getTransactions(req, res) {
    try {
      const result = await transactionService.getTransactions(req.query, req.query);
      return ApiResponse.success(res, 'Unified financial transactions retrieved successfully', result);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return ApiResponse.error(res, err.message || 'Failed to fetch transactions', err.statusCode || 500);
    }
  }

  // ── 8. Reports & CSV Export ──
  async getDailyCollectionsReport(req, res) {
    try {
      const report = await financialReportService.getDailyCollectionsReport(req.query.startDate, req.query.endDate);
      return ApiResponse.success(res, 'Daily collections report retrieved successfully', report);
    } catch (err) {
      console.error('Error fetching collections report:', err);
      return ApiResponse.error(res, err.message || 'Failed to fetch collections report', err.statusCode || 500);
    }
  }

  async getDepartmentRevenueReport(req, res) {
    try {
      const report = await financialReportService.getRevenueByDepartmentReport(req.query.startDate, req.query.endDate);
      return ApiResponse.success(res, 'Department revenue report retrieved successfully', report);
    } catch (err) {
      console.error('Error fetching department report:', err);
      return ApiResponse.error(res, err.message || 'Failed to fetch department report', err.statusCode || 500);
    }
  }

  async getIncomeStatementSummary(req, res) {
    try {
      const report = await financialReportService.getIncomeStatementSummary(req.query.startDate, req.query.endDate);
      return ApiResponse.success(res, 'Income statement summary retrieved successfully', report);
    } catch (err) {
      console.error('Error fetching income statement:', err);
      return ApiResponse.error(res, err.message || 'Failed to fetch income statement', err.statusCode || 500);
    }
  }

  async exportReportCsv(req, res) {
    try {
      const { type } = req.query;
      if (!type) {
        return ApiResponse.badRequest(res, 'Report type is required for CSV export');
      }

      const { filename, csv } = await financialReportService.exportReportCsv(type, req.query);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csv);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      return ApiResponse.error(res, err.message || 'Failed to export CSV', err.statusCode || 500);
    }
  }

  // ── 9. Profile, Patients Demographic Search & Config ──
  async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { accountantProfile: true },
      });

      if (!user) {
        return ApiResponse.notFound(res, 'Accountant user not found');
      }

      return ApiResponse.success(res, 'Profile retrieved successfully', {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        accountantProfile: user.accountantProfile,
        isSeniorApprover: !!user.accountantProfile?.isSeniorApprover,
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      return ApiResponse.error(res, err.message || 'Failed to fetch profile', 500);
    }
  }

  async updateProfile(req, res) {
    try {
      const parseResult = updateProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        return ApiResponse.badRequest(res, 'Invalid profile data', parseResult.error.flatten());
      }

      const { fullName, phone, qualification } = parseResult.data;

      const updated = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: req.user.id },
          data: {
            ...(fullName ? { fullName } : {}),
            ...(phone ? { phone } : {}),
          },
        });

        if (qualification !== undefined && req.user.accountantId) {
          await tx.accountantProfile.update({
            where: { id: req.user.accountantId },
            data: { qualification },
          });
        }

        return user;
      });

      return ApiResponse.success(res, 'Profile updated successfully', updated);
    } catch (err) {
      console.error('Error updating profile:', err);
      return ApiResponse.error(res, err.message || 'Failed to update profile', 500);
    }
  }

  async getPatientsSearch(req, res) {
    try {
      const { search } = req.query;
      const where = {};

      if (search && search.trim()) {
        const q = search.trim();
        where.OR = [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { patientIdNumber: { contains: q, mode: 'insensitive' } },
        ];
      }

      // Demographic-only projection (Strictly no medical history, prescriptions, vitals)
      const patients = await prisma.patient.findMany({
        where,
        take: 30,
        orderBy: { fullName: 'asc' },
        select: {
          id: true,
          patientIdNumber: true,
          fullName: true,
          phone: true,
          gender: true,
          age: true,
          address: true,
        },
      });

      const formattedPatients = patients.map((p) => ({
        id: p.id,
        patientId: p.patientIdNumber,
        patientIdNumber: p.patientIdNumber,
        fullName: p.fullName,
        phone: p.phone,
        gender: p.gender,
        age: p.age,
        address: p.address,
      }));

      return ApiResponse.success(res, 'Patients retrieved successfully', formattedPatients);
    } catch (err) {
      console.error('Error searching patients:', err);
      return ApiResponse.error(res, err.message || 'Failed to search patients', 500);
    }
  }

  async getNotifications(req, res) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      return ApiResponse.success(res, 'Notifications retrieved successfully', notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return ApiResponse.error(res, err.message || 'Failed to fetch notifications', 500);
    }
  }

  async markNotificationRead(req, res) {
    try {
      const { id } = req.params;
      const notification = await prisma.notification.updateMany({
        where: { id, userId: req.user.id },
        data: { isRead: true },
      });

      return ApiResponse.success(res, 'Notification marked as read', notification);
    } catch (err) {
      console.error('Error updating notification:', err);
      return ApiResponse.error(res, err.message || 'Failed to update notification', 500);
    }
  }

  async getBillingConfig(req, res) {
    try {
      return ApiResponse.success(res, 'Billing configuration retrieved successfully', {
        currency: billingConfig.CURRENCY,
        locale: billingConfig.LOCALE,
        hospital: billingConfig.HOSPITAL_METADATA,
        invoiceTypes: billingConfig.INVOICE_TYPES,
        serviceTypes: billingConfig.SERVICE_TYPES,
        paymentMethods: billingConfig.PAYMENT_METHODS,
        adjustmentTypes: billingConfig.ADJUSTMENT_TYPES,
        refundMethods: billingConfig.REFUND_METHODS,
        expenseCategories: billingConfig.EXPENSE_CATEGORIES,
        catalog: billingConfig.BILLING_CATALOG,
      });
    } catch (err) {
      console.error('Error fetching config:', err);
      return ApiResponse.error(res, 'Failed to fetch configuration', 500);
    }
  }
}

module.exports = new AccountantController();
