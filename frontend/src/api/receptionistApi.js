import axiosClient from './axiosClient';

export const receptionistApi = {
  // ── 1. Dashboard & Front Desk Queue ─────────────────────────────
  getDashboard: () => axiosClient.get('/receptionist/dashboard'),
  getQueue: (params = {}) => axiosClient.get('/receptionist/queue', { params }),

  // ── 2. Patient Management & Projections ─────────────────────────
  getPatients: (params = {}) => axiosClient.get('/receptionist/patients', { params }),
  getPatientById: (id) => axiosClient.get(`/receptionist/patients/${id}`),
  checkDuplicates: (params = {}) => axiosClient.get('/receptionist/patients/check-duplicates', { params }),
  registerPatient: (data) => axiosClient.post('/receptionist/patients', data),
  updatePatient: (id, data) => axiosClient.put(`/receptionist/patients/${id}`, data),

  // ── 3. Appointments & Availability Engine ───────────────────────
  getAppointments: (params = {}) => axiosClient.get('/receptionist/appointments', { params }),
  getAppointmentById: (id) => axiosClient.get(`/receptionist/appointments/${id}`),
  getDoctors: (params = {}) => axiosClient.get('/receptionist/appointments/doctors', { params }),
  getDoctorAvailability: (doctorId, date) =>
    axiosClient.get('/receptionist/appointments/availability', { params: { doctorId, date } }),
  bookAppointment: (data) => axiosClient.post('/receptionist/appointments/book', data),
  checkInAppointment: (id) => axiosClient.patch(`/receptionist/appointments/${id}/check-in`),
  rescheduleAppointment: (id, data) =>
    axiosClient.patch(`/receptionist/appointments/${id}/reschedule`, data),
  cancelAppointment: (id, data) =>
    axiosClient.patch(`/receptionist/appointments/${id}/cancel`, data),

  // ── 4. Billing, Invoices & Payments ─────────────────────────────
  getServiceCatalog: (params = {}) => axiosClient.get('/receptionist/billing/catalog', { params }),
  getInvoices: (params = {}) => axiosClient.get('/receptionist/billing/invoices', { params }),
  getInvoiceById: (id) => axiosClient.get(`/receptionist/billing/invoices/${id}`),
  createInvoice: (data) => axiosClient.post('/receptionist/billing/invoices', data),
  getPayments: (params = {}) => axiosClient.get('/receptionist/billing/payments', { params }),
  recordPayment: (data) => axiosClient.post('/receptionist/billing/payments', data),

  // ── 5. Admissions & Bed Matrix (Operational View) ───────────────
  getAdmissions: (params = {}) => axiosClient.get('/receptionist/admissions', { params }),
  getAdmissionStats: () => axiosClient.get('/receptionist/admissions/stats'),
  getBedMatrix: () => axiosClient.get('/receptionist/admissions/bed-matrix'),

  // ── 6. Emergency Intake (Fast-Path) ─────────────────────────────
  getEmergencies: (params = {}) => axiosClient.get('/receptionist/emergencies', { params }),
  createEmergency: (data) => axiosClient.post('/receptionist/emergencies', data),
  updateEmergencyStatus: (id, data) =>
    axiosClient.patch(`/receptionist/emergencies/${id}/status`, data),

  // ── 7. Notifications ───────────────────────────────────────────
  getNotifications: (params = {}) => axiosClient.get('/receptionist/notifications', { params }),
  getUnreadCount: () => axiosClient.get('/receptionist/notifications/unread-count'),
  markAsRead: (id) => axiosClient.patch(`/receptionist/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.patch('/receptionist/notifications/mark-all-read'),

  // ── 8. Receptionist Profile ─────────────────────────────────────
  getProfile: () => axiosClient.get('/receptionist/profile'),
  updateProfile: (data) => axiosClient.put('/receptionist/profile', data),
};

export default receptionistApi;
