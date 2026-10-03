import axiosClient from './axiosClient';

export const doctorApi = {
  // ── 1. Dashboard ─────────────────────────────────────────────
  getDashboard: () => axiosClient.get('/doctor/dashboard'),

  // ── 2. Profile & Availability ────────────────────────────────
  getProfile: () => axiosClient.get('/doctor/profile'),
  updateProfile: (data) => axiosClient.put('/doctor/profile', data),
  getAvailability: () => axiosClient.get('/doctor/availability'),
  createAvailability: (data) => axiosClient.post('/doctor/availability', data),
  updateAvailability: (id, data) => axiosClient.put(`/doctor/availability/${id}`, data),
  deleteAvailability: (id) => axiosClient.delete(`/doctor/availability/${id}`),
  toggleAvailability: (id) => axiosClient.patch(`/doctor/availability/${id}/toggle`),

  // ── 3. Appointments ──────────────────────────────────────────
  getAppointments: (params = {}) => axiosClient.get('/doctor/appointments', { params }),
  getAppointmentById: (id) => axiosClient.get(`/doctor/appointments/${id}`),
  updateAppointmentStatus: (id, status, cancelReason = null) =>
    axiosClient.patch(`/doctor/appointments/${id}/status`, { status, cancelReason }),
  rescheduleAppointment: (id, appointmentDate, appointmentTime) =>
    axiosClient.patch(`/doctor/appointments/${id}/reschedule`, { appointmentDate, appointmentTime }),
  toggleCheckIn: (id, isCheckedIn) =>
    axiosClient.patch(`/doctor/appointments/${id}/check-in`, { isCheckedIn }),

  // ── 4. Patients ──────────────────────────────────────────────
  getPatients: (params = {}) => axiosClient.get('/doctor/patients', { params }),
  getPatientById: (patientId) => axiosClient.get(`/doctor/patients/${patientId}`),

  // ── 5. Consultations ─────────────────────────────────────────
  getConsultations: (params = {}) => axiosClient.get('/doctor/consultations', { params }),
  getConsultationForAppointment: (appointmentId) =>
    axiosClient.get(`/doctor/consultations/appointment/${appointmentId}`),
  saveConsultationDraft: (id, data) =>
    axiosClient.put(`/doctor/consultations/${id}/draft`, data),
  completeConsultation: (id, data) =>
    axiosClient.post(`/doctor/consultations/${id}/complete`, data),

  // ── 6. Medical Records ───────────────────────────────────────
  getMedicalRecords: (params = {}) => axiosClient.get('/doctor/medical-records', { params }),
  getPatientTimeline: (patientId) => axiosClient.get(`/doctor/medical-records/patient/${patientId}`),
  getMedicalRecordById: (id) => axiosClient.get(`/doctor/medical-records/${id}`),

  // ── 7. Prescriptions ─────────────────────────────────────────
  getPrescriptions: (params = {}) => axiosClient.get('/doctor/prescriptions', { params }),
  getPrescriptionById: (id) => axiosClient.get(`/doctor/prescriptions/${id}`),
  createPrescription: (data) => axiosClient.post('/doctor/prescriptions', data),

  // ── 8. Laboratory Reports ────────────────────────────────────
  getLabReports: (params = {}) => axiosClient.get('/doctor/lab-reports', { params }),
  getLabReportById: (id) => axiosClient.get(`/doctor/lab-reports/${id}`),
  orderLabTest: (data) => axiosClient.post('/doctor/lab-reports/order', data),
  reviewLabReport: (id, doctorNotes) =>
    axiosClient.patch(`/doctor/lab-reports/${id}/review`, { doctorNotes }),

  // ── 9. Documents ─────────────────────────────────────────────
  getDocuments: (params = {}) => axiosClient.get('/doctor/documents', { params }),
  getDocumentById: (id) => axiosClient.get(`/doctor/documents/${id}`),

  // ── 10. Notifications ────────────────────────────────────────
  getNotifications: (params = {}) => axiosClient.get('/doctor/notifications', { params }),
  getUnreadCount: () => axiosClient.get('/doctor/notifications/unread-count'),
  markNotificationAsRead: (id) => axiosClient.patch(`/doctor/notifications/${id}/read`),
  markAllNotificationsAsRead: () => axiosClient.patch('/doctor/notifications/mark-all-read'),
};

export default doctorApi;
