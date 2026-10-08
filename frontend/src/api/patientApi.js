import axiosClient from './axiosClient';

export const patientApi = {
  // ── Auth Endpoints ──
  activateAccount: (data) => axiosClient.post('/auth/patient/activate', data),
  login: (data) => axiosClient.post('/auth/patient/login', data),
  register: (data) => axiosClient.post('/auth/patient/register', data),
  forgotPassword: (email) => axiosClient.post('/auth/patient/forgot-password', { email }),
  changePassword: (data) => axiosClient.post('/auth/patient/change-password', data),
  getMe: () => axiosClient.get('/auth/patient/me'),

  // ── Dashboard & Profile ──
  getDashboard: () => axiosClient.get('/patient/dashboard'),
  getProfile: () => axiosClient.get('/patient/profile'),
  updateProfile: (data) => axiosClient.put('/patient/profile', data),

  // ── Doctors & Availability ──
  getDoctors: (params) => axiosClient.get('/patient/doctors', { params }),
  getDoctorAvailability: (doctorId, date) =>
    axiosClient.get(`/patient/doctors/${doctorId}/availability`, { params: { date } }),

  // ── Appointments ──
  getAppointments: (params) => axiosClient.get('/patient/appointments', { params }),
  getAppointmentById: (appointmentId) => axiosClient.get(`/patient/appointments/${appointmentId}`),
  bookAppointment: (data) => axiosClient.post('/patient/appointments', data),
  rescheduleAppointment: (appointmentId, data) =>
    axiosClient.put(`/patient/appointments/${appointmentId}/reschedule`, data),
  cancelAppointment: (appointmentId, data) =>
    axiosClient.put(`/patient/appointments/${appointmentId}/cancel`, data),

  // ── Medical Records ──
  getMedicalRecords: (params) => axiosClient.get('/patient/medical-records', { params }),
  getMedicalRecordById: (recordId) => axiosClient.get(`/patient/medical-records/${recordId}`),

  // ── Prescriptions ──
  getPrescriptions: (params) => axiosClient.get('/patient/prescriptions', { params }),
  getPrescriptionById: (prescriptionId) => axiosClient.get(`/patient/prescriptions/${prescriptionId}`),

  // ── Lab Reports ──
  getLabReports: (params) => axiosClient.get('/patient/lab-reports', { params }),
  getLabReportById: (reportId) => axiosClient.get(`/patient/lab-reports/${reportId}`),

  // ── Billing & Invoices ──
  getInvoices: (params) => axiosClient.get('/patient/invoices', { params }),
  getInvoiceById: (invoiceId) => axiosClient.get(`/patient/invoices/${invoiceId}`),
  getPaymentOptions: (invoiceId) => axiosClient.get(`/patient/invoices/${invoiceId}/payment-options`),
  initiatePayment: (invoiceId, data) =>
    axiosClient.post(`/patient/invoices/${invoiceId}/payments`, data),
  getPayments: (params) => axiosClient.get('/patient/payments', { params }),

  // ── Documents ──
  getDocuments: (params) => axiosClient.get('/patient/documents', { params }),
  uploadDocument: (data) => axiosClient.post('/patient/documents', data),
  deleteDocument: (documentId) => axiosClient.delete(`/patient/documents/${documentId}`),

  // ── Insurance ──
  getInsurance: () => axiosClient.get('/patient/insurance'),

  // ── Health Timeline & Global Search ──
  getTimeline: () => axiosClient.get('/patient/timeline'),
  search: (q) => axiosClient.get('/patient/search', { params: { q } }),

  // ── Notifications ──
  getNotifications: (params) => axiosClient.get('/patient/notifications', { params }),
  markNotificationRead: (notificationId) =>
    axiosClient.put(`/patient/notifications/${notificationId}/read`),
  markAllNotificationsRead: () => axiosClient.put('/patient/notifications/read-all'),
};

export default patientApi;
