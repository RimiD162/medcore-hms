import axiosClient from './axiosClient';

export const accountantApi = {
  // ── 1. Dashboard & KPIs ──────────────────────────────────────────
  getDashboard: () => axiosClient.get('/accountant/dashboard'),

  // ── 2. Invoices & Billing Operations ────────────────────────────
  getInvoices: (params = {}) => axiosClient.get('/accountant/invoices', { params }),
  getInvoiceById: (id) => axiosClient.get(`/accountant/invoices/${id}`),
  createInvoice: (data) => axiosClient.post('/accountant/invoices', data),
  cancelInvoice: (id, data = {}) => axiosClient.post(`/accountant/invoices/${id}/cancel`, data),
  createAdjustment: (invoiceId, data) =>
    axiosClient.post(`/accountant/invoices/${invoiceId}/adjustments`, data),
  recordPayment: (invoiceId, data) =>
    axiosClient.post(`/accountant/invoices/${invoiceId}/payments`, data),
  requestRefund: (invoiceId, data) =>
    axiosClient.post(`/accountant/invoices/${invoiceId}/refunds`, data),

  // ── 3. Payments Registry & Voiding ──────────────────────────────
  getPayments: (params = {}) => axiosClient.get('/accountant/payments', { params }),
  voidPayment: (paymentId, data) =>
    axiosClient.post(`/accountant/payments/${paymentId}/void`, data),

  // ── 4. Outstanding Balances & Aging ─────────────────────────────
  getOutstandingAging: (params = {}) =>
    axiosClient.get('/accountant/outstanding', { params }),

  // ── 5. Refunds Lifecycle ────────────────────────────────────────
  getRefunds: (params = {}) => axiosClient.get('/accountant/refunds', { params }),
  approveRefund: (refundId, data = {}) =>
    axiosClient.post(`/accountant/refunds/${refundId}/approve`, data),
  processRefund: (refundId, data = {}) =>
    axiosClient.post(`/accountant/refunds/${refundId}/process`, data),
  rejectRefund: (refundId, data) =>
    axiosClient.post(`/accountant/refunds/${refundId}/reject`, data),

  // ── 6. Expenses Management ──────────────────────────────────────
  getExpenses: (params = {}) => axiosClient.get('/accountant/expenses', { params }),
  getExpenseCategories: () => axiosClient.get('/accountant/expenses/categories'),
  getExpenseById: (id) => axiosClient.get(`/accountant/expenses/${id}`),
  createExpense: (data) => axiosClient.post('/accountant/expenses', data),
  approveExpense: (id, data = {}) => axiosClient.post(`/accountant/expenses/${id}/approve`, data),
  cancelExpense: (id, data) => axiosClient.post(`/accountant/expenses/${id}/cancel`, data),

  // ── 7. Transactions (Derived Unified Stream) ────────────────────
  getTransactions: (params = {}) =>
    axiosClient.get('/accountant/transactions', { params }),

  // ── 8. Financial Reports & Analytics ────────────────────────────
  getDailyCollectionsReport: (params = {}) =>
    axiosClient.get('/accountant/reports/daily-collections', { params }),
  getDepartmentRevenueReport: (params = {}) =>
    axiosClient.get('/accountant/reports/department-revenue', { params }),
  getIncomeSummaryReport: (params = {}) =>
    axiosClient.get('/accountant/reports/income-summary', { params }),

  // ── CSV Export Helper ───────────────────────────────────────────
  getExportUrl: (type, params = {}) => {
    const query = new URLSearchParams({ type, ...params }).toString();
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    return `${baseURL}/accountant/reports/export?${query}`;
  },

  // ── 9. Patients Demographic Search, Profile & Notifications ─────
  searchPatients: (params = {}) =>
    axiosClient.get('/accountant/patients/search', { params }),
  getProfile: () => axiosClient.get('/accountant/profile'),
  updateProfile: (data) => axiosClient.put('/accountant/profile', data),
  getNotifications: (params = {}) =>
    axiosClient.get('/accountant/notifications', { params }),
  markNotificationRead: (id) =>
    axiosClient.patch(`/accountant/notifications/${id}/read`),
  getConfig: () => axiosClient.get('/accountant/config'),
};

export default accountantApi;
