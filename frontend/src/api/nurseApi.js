import axiosClient from './axiosClient';

export const nurseApi = {
  // ── 1. Dashboard ─────────────────────────────────────────────
  getDashboard: () => axiosClient.get('/nurse/dashboard'),

  // ── 2. Profile ───────────────────────────────────────────────
  getProfile: () => axiosClient.get('/nurse/profile'),
  updateProfile: (data) => axiosClient.put('/nurse/profile', data),

  // ── 3. Assigned Patients Directory & Detail ───────────────────
  getAssignedPatients: (params = {}) => axiosClient.get('/nurse/patients', { params }),
  getPatientDetail: (patientId) => axiosClient.get(`/nurse/patients/${patientId}`),

  // ── 4. Vital Signs Monitoring ─────────────────────────────────
  getVitals: (params = {}) => axiosClient.get('/nurse/vitals', { params }),
  recordVitals: (data) => axiosClient.post('/nurse/vitals', data),
  correctVitalSign: (id, data) => axiosClient.put(`/nurse/vitals/${id}`, data),

  // ── 5. Nursing Clinical Notes ─────────────────────────────────
  getNotes: (params = {}) => axiosClient.get('/nurse/notes', { params }),
  getNoteById: (id) => axiosClient.get(`/nurse/notes/${id}`),
  createNote: (data) => axiosClient.post('/nurse/notes', data),

  // ── 6. Medication Administration (e-MAR) ──────────────────────
  getMedicationTasks: (params = {}) => axiosClient.get('/nurse/medications', { params }),
  getMedicationTaskById: (id) => axiosClient.get(`/nurse/medications/${id}`),
  administerMedication: (id, data = {}) =>
    axiosClient.post(`/nurse/medications/${id}/administer`, data),
  holdMedication: (id, data) =>
    axiosClient.post(`/nurse/medications/${id}/hold`, data),
  missMedication: (id, data) =>
    axiosClient.post(`/nurse/medications/${id}/miss`, data),

  // ── 7. Inpatient Admissions (Read View) ───────────────────────
  getAdmissions: (params = {}) => axiosClient.get('/nurse/admissions', { params }),
  getAdmissionById: (id) => axiosClient.get(`/nurse/admissions/${id}`),

  // ── 8. Bed Allocation Grid ────────────────────────────────────
  getBeds: (params = {}) => axiosClient.get('/nurse/beds', { params }),
  updateBedStatus: (id, status, notes) =>
    axiosClient.patch(`/nurse/beds/${id}/status`, { status, notes }),

  // ── 9. Notifications ──────────────────────────────────────────
  getNotifications: (params = {}) => axiosClient.get('/nurse/notifications', { params }),
  getUnreadCount: () => axiosClient.get('/nurse/notifications/unread-count'),
  markNotificationAsRead: (id) => axiosClient.patch(`/nurse/notifications/${id}/read`),
  markAllNotificationsAsRead: () => axiosClient.patch('/nurse/notifications/mark-all-read'),
};

export default nurseApi;
