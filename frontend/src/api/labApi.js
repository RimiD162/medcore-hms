import axiosClient from './axiosClient';

export const labApi = {
  // ── 1. Dashboard ────────────────────────────────────────────────
  getDashboard: () => axiosClient.get('/lab/dashboard'),

  // ── 2. Test Catalog ─────────────────────────────────────────────
  getCatalog: (params = {}) => axiosClient.get('/lab/catalog', { params }),
  getCategories: () => axiosClient.get('/lab/catalog/categories'),
  getTestById: (id) => axiosClient.get(`/lab/catalog/${id}`),
  createTest: (data) => axiosClient.post('/lab/catalog', data),
  updateTest: (id, data) => axiosClient.put(`/lab/catalog/${id}`, data),
  toggleTestStatus: (id) => axiosClient.patch(`/lab/catalog/${id}/toggle-status`),

  // ── 3. Diagnostic Orders ────────────────────────────────────────
  getOrders: (params = {}) => axiosClient.get('/lab/orders', { params }),
  getOrderById: (id) => axiosClient.get(`/lab/orders/${id}`),
  createOrder: (data) => axiosClient.post('/lab/orders', data),
  cancelOrder: (id, data = {}) => axiosClient.post(`/lab/orders/${id}/cancel`, data),

  // ── 4. Specimen Samples & Custody ───────────────────────────────
  getSamples: (params = {}) => axiosClient.get('/lab/samples', { params }),
  getSampleById: (id) => axiosClient.get(`/lab/samples/${id}`),
  collectSample: (id, data) => axiosClient.post(`/lab/samples/${id}/collect`, data),
  receiveSample: (id, data = {}) => axiosClient.post(`/lab/samples/${id}/receive`, data),
  rejectSample: (id, data) => axiosClient.post(`/lab/samples/${id}/reject`, data),
  recollectSample: (id) => axiosClient.post(`/lab/samples/${id}/recollect`),

  // ── 5. Results & Corrections ────────────────────────────────────
  getResults: (params = {}) => axiosClient.get('/lab/results', { params }),
  getResultById: (id) => axiosClient.get(`/lab/results/${id}`),
  enterResults: (itemId, data) => axiosClient.post(`/lab/results/item/${itemId}`, data),
  correctResult: (id, data) => axiosClient.post(`/lab/results/${id}/correct`, data),

  // ── 6. Diagnostic Reports & Verification ─────────────────────────
  getReports: (params = {}) => axiosClient.get('/lab/reports', { params }),
  getReportById: (id) => axiosClient.get(`/lab/reports/${id}`),
  verifyAndReleaseReport: (orderId, data = {}) =>
    axiosClient.post(`/lab/reports/order/${orderId}/verify`, data),

  // ── 7. Notifications ────────────────────────────────────────────
  getNotifications: (params = {}) => axiosClient.get('/lab/notifications', { params }),
  markNotificationRead: (id) => axiosClient.patch(`/lab/notifications/${id}/read`),
  markAllNotificationsRead: () => axiosClient.patch('/lab/notifications/read-all'),

  // ── 8. Profile ──────────────────────────────────────────────────
  getProfile: () => axiosClient.get('/lab/profile'),
  updateProfile: (data) => axiosClient.put('/lab/profile', data),
};

export default labApi;
