const express = require('express');
const router = express.Router();
const accountantController = require('../controllers/accountantController');
const { authenticate, authorize, requireSeniorApprover } = require('../middleware/auth');

// All accountant endpoints require authentication and ACCOUNTANT (or ADMIN) role
router.use(authenticate);
router.use(authorize('ACCOUNTANT', 'ADMIN'));

// ── 1. Dashboard & KPIs ──
router.get('/dashboard', (req, res) => accountantController.getDashboardKpis(req, res));

// ── 2. Invoices ──
router.get('/invoices', (req, res) => accountantController.listInvoices(req, res));
router.get('/invoices/:id', (req, res) => accountantController.getInvoiceById(req, res));
router.post('/invoices', (req, res) => accountantController.createInvoice(req, res));
router.post('/invoices/:id/cancel', (req, res) => accountantController.cancelInvoice(req, res));
router.post('/invoices/:id/adjustments', (req, res) => accountantController.createAdjustment(req, res));
router.post('/invoices/:invoiceId/payments', (req, res) => accountantController.recordPayment(req, res));
router.post('/invoices/:invoiceId/refunds', (req, res) => accountantController.requestRefund(req, res));

// ── 3. Payments ──
router.get('/payments', (req, res) => accountantController.listPayments(req, res));
router.post('/payments/:paymentId/void', (req, res) => accountantController.voidPayment(req, res));

// ── 4. Outstanding ──
router.get('/outstanding', (req, res) => accountantController.getOutstandingAging(req, res));

// ── 5. Refunds ──
router.get('/refunds', (req, res) => accountantController.listRefunds(req, res));
router.post('/refunds/:refundId/approve', requireSeniorApprover, (req, res) => accountantController.approveRefund(req, res));
router.post('/refunds/:refundId/process', (req, res) => accountantController.processRefund(req, res));
router.post('/refunds/:refundId/reject', (req, res) => accountantController.rejectRefund(req, res));

// ── 6. Expenses ──
router.get('/expenses', (req, res) => accountantController.listExpenses(req, res));
router.get('/expenses/categories', (req, res) => accountantController.getExpenseCategories(req, res));
router.get('/expenses/:id', (req, res) => accountantController.getExpenseById(req, res));
router.post('/expenses', (req, res) => accountantController.createExpense(req, res));
router.post('/expenses/:id/approve', requireSeniorApprover, (req, res) => accountantController.approveExpense(req, res));
router.post('/expenses/:id/cancel', (req, res) => accountantController.cancelExpense(req, res));

// ── 7. Transactions (Unified Derived Stream) ──
router.get('/transactions', (req, res) => accountantController.getTransactions(req, res));

// ── 8. Reports & Exports ──
router.get('/reports/daily-collections', (req, res) => accountantController.getDailyCollectionsReport(req, res));
router.get('/reports/department-revenue', (req, res) => accountantController.getDepartmentRevenueReport(req, res));
router.get('/reports/income-summary', (req, res) => accountantController.getIncomeStatementSummary(req, res));
router.get('/reports/export', (req, res) => accountantController.exportReportCsv(req, res));

// ── 9. Patients Demographic Search, Profile & Config ──
router.get('/patients/search', (req, res) => accountantController.getPatientsSearch(req, res));
router.get('/profile', (req, res) => accountantController.getProfile(req, res));
router.put('/profile', (req, res) => accountantController.updateProfile(req, res));
router.get('/notifications', (req, res) => accountantController.getNotifications(req, res));
router.patch('/notifications/:id/read', (req, res) => accountantController.markNotificationRead(req, res));
router.get('/config', (req, res) => accountantController.getBillingConfig(req, res));

module.exports = router;
