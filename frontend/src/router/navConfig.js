// Navigation configuration — add items here as new phases are built.
// Each item will auto-appear in the sidebar for the listed roles.

export const navConfig = [
  // ── Phase 0 ────────────────────────────────────────────────────
  {
    label: 'Dashboard',
    icon: '📊',
    path: '/dashboard',
    roles: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'accountant'],
    phase: 0,
  },

  // ── Phase 2 (will unlock: Departments, Doctors, Patients) ──────
  // { label: 'Patients',    icon: '👥', path: '/patients',    roles: ['admin','doctor','nurse','receptionist'], phase: 2 },
  // { label: 'Doctors',     icon: '🩺', path: '/doctors',     roles: ['admin','receptionist'], phase: 2 },
  // { label: 'Departments', icon: '🏥', path: '/departments', roles: ['admin'], phase: 2 },

  // ── Phase 3 ────────────────────────────────────────────────────
  // { label: 'Appointments', icon: '📅', path: '/appointments', roles: ['admin','doctor','receptionist','nurse'], phase: 3 },

  // ── Phase 4-5 ──────────────────────────────────────────────────
  // { label: 'Consultations',  icon: '📋', path: '/consultations',  roles: ['doctor','nurse'], phase: 4 },
  // { label: 'Prescriptions',  icon: '💊', path: '/prescriptions',  roles: ['doctor','pharmacist'], phase: 5 },

  // ── Phase 6-7 ──────────────────────────────────────────────────
  // { label: 'Pharmacy',    icon: '🧪', path: '/pharmacy',    roles: ['admin','pharmacist'], phase: 6 },
  // { label: 'Laboratory',  icon: '🔬', path: '/laboratory',  roles: ['admin','lab_technician','doctor'], phase: 7 },

  // ── Phase 8-9 ──────────────────────────────────────────────────
  // { label: 'Wards & Beds', icon: '🛏', path: '/wards',   roles: ['admin','nurse','doctor'], phase: 8 },
  // { label: 'Billing',      icon: '🧾', path: '/billing',  roles: ['admin','accountant','receptionist'], phase: 9 },

  // ── Phase 15 ───────────────────────────────────────────────────
  // { label: 'Reports',  icon: '📈', path: '/reports', roles: ['admin','accountant'], phase: 15 },

  // ── Phase 17 ───────────────────────────────────────────────────
  // { label: 'Audit Logs', icon: '🛡', path: '/audit', roles: ['admin'], phase: 17 },

  // ── Phase 18 ───────────────────────────────────────────────────
  // { label: 'Settings', icon: '⚙️', path: '/settings', roles: ['admin'], phase: 18 },
];
