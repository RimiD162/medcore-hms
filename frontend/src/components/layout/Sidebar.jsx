import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CalendarPlus,
  Users,
  UserPlus,
  ClipboardList,
  FileText,
  Pill,
  Microscope,
  FolderOpen,
  Bell,
  User,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Activity,
  BedDouble,
  HeartPulse,
  Receipt,
  CreditCard,
  Wallet,
  AlertCircle,
  Building2,
} from 'lucide-react';
import Logo from '../Logo';

const doctorNavItems = [
  { path: '/app/doctor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/app/doctor/appointments', label: 'Appointments', icon: Calendar },
  { path: '/app/doctor/patients', label: 'My Patients', icon: Users },
  { path: '/app/doctor/consultations', label: 'Consultations', icon: ClipboardList },
  { path: '/app/doctor/medical-records', label: 'Medical Records', icon: FileText },
  { path: '/app/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
  { path: '/app/doctor/lab-reports', label: 'Laboratory Reports', icon: Microscope },
  { path: '/app/doctor/documents', label: 'Documents', icon: FolderOpen },
  { path: '/app/doctor/notifications', label: 'Notifications', icon: Bell, hasBadge: true },
  { path: '/app/doctor/profile', label: 'My Profile', icon: User },
  { path: '/app/doctor/availability', label: 'Weekly Schedule', icon: Clock },
];

const nurseNavItems = [
  { path: '/app/nurse', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/app/nurse/patients', label: 'Assigned Patients', icon: Users },
  { path: '/app/nurse/vitals', label: 'Vital Monitoring', icon: Activity },
  { path: '/app/nurse/nursing-notes', label: 'Nursing Notes', icon: ClipboardList },
  { path: '/app/nurse/medication-administration', label: 'Medication Admin (e-MAR)', icon: Pill },
  { path: '/app/nurse/admissions', label: 'Inpatient Admissions', icon: FileText },
  { path: '/app/nurse/bed-assignment', label: 'Bed Allocation Grid', icon: BedDouble },
  { path: '/app/nurse/notifications', label: 'Notifications', icon: Bell, hasBadge: true },
  { path: '/app/nurse/profile', label: 'Nurse Profile', icon: User },
];

const receptionistNavItems = [
  { path: '/app/receptionist', label: 'Front Desk Overview', icon: LayoutDashboard, exact: true },
  { path: '/app/receptionist/patients', label: 'Patient Directory', icon: Users, exact: true },
  { path: '/app/receptionist/patients/register', label: 'Register Patient', icon: UserPlus },
  { path: '/app/receptionist/appointments', label: 'Appointments Queue', icon: Calendar, exact: true },
  { path: '/app/receptionist/appointments/book', label: 'Book Appointment', icon: CalendarPlus },
  { path: '/app/receptionist/calendar', label: 'Schedule Calendar', icon: Clock },
  { path: '/app/receptionist/billing', label: 'Create Invoice', icon: CreditCard },
  { path: '/app/receptionist/invoices', label: 'Invoices & Billing', icon: Receipt },
  { path: '/app/receptionist/payments', label: 'Payment Registry', icon: Wallet },
  { path: '/app/receptionist/admissions', label: 'Ward Bed Matrix', icon: BedDouble },
  { path: '/app/receptionist/emergency', label: 'Emergency Intake', icon: AlertCircle },
  { path: '/app/receptionist/notifications', label: 'Notifications', icon: Bell, hasBadge: true },
  { path: '/app/receptionist/profile', label: 'Staff Profile', icon: User },
];

export const Sidebar = ({
  collapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  unreadNotifications = 0,
  user = null,
  role = 'DOCTOR', // 'DOCTOR' | 'NURSE' | 'RECEPTIONIST'
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isReceptionist = role === 'RECEPTIONIST' || location.pathname.startsWith('/app/receptionist');
  const isNurse = role === 'NURSE' || location.pathname.startsWith('/app/nurse');
  
  const navItems = isReceptionist 
    ? receptionistNavItems 
    : isNurse 
      ? nurseNavItems 
      : doctorNavItems;

  const workspaceTitle = isReceptionist 
    ? 'Reception Desk' 
    : isNurse 
      ? 'Nurse Station' 
      : 'Doctor Workspace';

  const profileRoute = isReceptionist 
    ? '/app/receptionist/profile' 
    : isNurse 
      ? '/app/nurse/profile' 
      : '/app/doctor/profile';

  const defaultUser = isReceptionist
    ? {
        name: 'Rachel Adams',
        specialization: 'Lead Front Desk Receptionist',
        department: 'Main Lobby / Admissions',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      }
    : isNurse
      ? {
          name: 'Nurse Sarah Jenkins, RN',
          specialization: 'Senior Ward Charge Nurse',
          department: 'Ward 3B',
          avatarUrl: 'https://images.unsplash.com/photo-1594824813624-9b28a883907c?auto=format&fit=crop&q=80&w=200',
        }
      : {
          name: 'Dr. Sarah Chen',
          specialization: 'Cardiologist',
          department: 'OPD-102',
          avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
        };

  const currentUser = user || defaultUser;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="med-sidebar-mobile-backdrop" onClick={onCloseMobile} />
      )}

      <aside className={`med-sidebar ${collapsed ? 'is-collapsed' : ''} ${isMobileOpen ? 'is-mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="med-sidebar-header">
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Logo />
            </div>
          ) : (
            <div className="med-sidebar-logo-collapsed">
              {isReceptionist ? (
                <Building2 size={24} color="#00d2b4" />
              ) : isNurse ? (
                <HeartPulse size={24} color="#00d2b4" />
              ) : (
                <Stethoscope size={24} color="#00d2b4" />
              )}
            </div>
          )}

          <button
            type="button"
            className="med-sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle Sidebar"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Workspace Navigation */}
        <div className="med-sidebar-nav-section">
          {!collapsed && (
            <span className="med-sidebar-group-title">{workspaceTitle}</span>
          )}

          <nav className="med-sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `med-sidebar-link ${isActive ? 'active' : ''}`
                  }
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} className="med-nav-icon" />
                  {!collapsed && <span className="med-nav-label">{item.label}</span>}
                  {item.hasBadge && unreadNotifications > 0 && (
                    <span className="med-nav-badge">{unreadNotifications}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="med-sidebar-footer">
          <div
            className="med-sidebar-user-card"
            onClick={() => navigate(profileRoute)}
            title="View Profile"
          >
            <img
              src={currentUser.avatarUrl || '/images/doctor.jpg'}
              alt={currentUser.name}
              className="med-sidebar-avatar"
            />
            {!collapsed && (
              <div className="med-sidebar-user-info">
                <span className="med-sidebar-user-name">{currentUser.name}</span>
                <span className="med-sidebar-user-role">{currentUser.specialization || currentUser.department}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="med-sidebar-logout-btn"
            onClick={() => navigate('/staff-roles')}
            title="Switch Workspace / Exit"
          >
            <LogOut size={16} />
            {!collapsed && <span>Exit Workspace</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
