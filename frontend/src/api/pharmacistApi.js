import axiosClient from './axiosClient';

export const pharmacistApi = {
  // ── 1. Dashboard ────────────────────────────────────────────────
  getDashboard: () => axiosClient.get('/pharmacist/dashboard'),

  // ── 2. Medicine Catalog ─────────────────────────────────────────
  getMedicines: (params = {}) => axiosClient.get('/pharmacist/medicines', { params }),
  getMedicineById: (id) => axiosClient.get(`/pharmacist/medicines/${id}`),
  createMedicine: (data) => axiosClient.post('/pharmacist/medicines', data),
  updateMedicine: (id, data) => axiosClient.patch(`/pharmacist/medicines/${id}`, data),

  // ── 3. Inventory & Batches ──────────────────────────────────────
  getInventory: (params = {}) => axiosClient.get('/pharmacist/inventory', { params }),
  getBatches: (params = {}) => axiosClient.get('/pharmacist/inventory/batches', { params }),
  getBatchById: (id) => axiosClient.get(`/pharmacist/inventory/batches/${id}`),
  receiveStock: (data) => axiosClient.post('/pharmacist/inventory/receipts', data),
  adjustStock: (data) => axiosClient.post('/pharmacist/inventory/adjustments', data),
  writeOffExpired: (data) => axiosClient.post('/pharmacist/inventory/write-offs', data),
  getTransactions: (params = {}) => axiosClient.get('/pharmacist/inventory/transactions', { params }),

  // ── 4. Stock Alerts & Expiry ────────────────────────────────────
  getLowStock: (params = {}) => axiosClient.get('/pharmacist/low-stock', { params }),
  getExpiryBuckets: (params = {}) => axiosClient.get('/pharmacist/expiry', { params }),

  // ── 5. Prescriptions Queue & Review ─────────────────────────────
  getPrescriptions: (params = {}) => axiosClient.get('/pharmacist/prescriptions', { params }),
  getPrescriptionDetail: (id) => axiosClient.get(`/pharmacist/prescriptions/${id}`),
  mapPrescriptionItem: (id, itemId, data) =>
    axiosClient.patch(`/pharmacist/prescriptions/${id}/items/${itemId}/map`, data),
  holdPrescription: (id, data) =>
    axiosClient.post(`/pharmacist/prescriptions/${id}/hold`, data),
  releasePrescription: (id) =>
    axiosClient.post(`/pharmacist/prescriptions/${id}/release`),

  // ── 6. Dispensing & History ─────────────────────────────────────
  dispense: (data) => axiosClient.post('/pharmacist/dispensing', data),
  getDispensingHistory: (params = {}) =>
    axiosClient.get('/pharmacist/dispensing/history', { params }),

  // ── 7. Sales & Billed Items (Read-only) ──────────────────────────
  getSales: (params = {}) => axiosClient.get('/pharmacist/sales', { params }),

  // ── 8. Notifications ────────────────────────────────────────────
  getNotifications: (params = {}) => axiosClient.get('/pharmacist/notifications', { params }),
  markNotificationRead: (id) => axiosClient.patch(`/pharmacist/notifications/${id}/read`),
  markAllNotificationsRead: () => axiosClient.patch('/pharmacist/notifications/read-all'),

  // ── 9. Profile ──────────────────────────────────────────────────
  getProfile: () => axiosClient.get('/pharmacist/profile'),
  updateProfile: (data) => axiosClient.patch('/pharmacist/profile', data),
};

export default pharmacistApi;
