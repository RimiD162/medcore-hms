import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Plus,
  Stethoscope,
  HeartPulse,
  Calendar,
  Activity,
  CheckCircle2,
  Building2,
  Pill,
  Microscope,
  TestTube,
} from 'lucide-react';
import Sidebar from './Sidebar';
import doctorApi from '../../api/doctorApi';
import nurseApi from '../../api/nurseApi';
import receptionistApi from '../../api/receptionistApi';
import pharmacistApi from '../../api/pharmacistApi';
import labApi from '../../api/labApi';
import accountantApi from '../../api/accountantApi';

export const AppLayout = ({ theme = 'light', onToggleTheme, onShowToast }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAccountant = location.pathname.startsWith('/app/accountant');
  const isLab = location.pathname.startsWith('/app/lab');
  const isPharmacist = location.pathname.startsWith('/app/pharmacist');
  const isReceptionist = location.pathname.startsWith('/app/receptionist');
  const isNurse = location.pathname.startsWith('/app/nurse');

  const currentRole = isAccountant
    ? 'ACCOUNTANT'
    : isLab
      ? 'LAB_TECHNICIAN'
      : isPharmacist
        ? 'PHARMACIST'
        : isReceptionist
          ? 'RECEPTIONIST'
          : isNurse
            ? 'NURSE'
            : 'DOCTOR';

  const defaultUserInfo = isAccountant
    ? {
        name: 'David Sterling, CA',
        specialization: 'Senior Financial Controller',
        department: 'Hospital Revenue & Finance',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      }
    : isLab
      ? {
          name: 'Alex Mercer, MLS',
          specialization: 'Senior Medical Laboratory Scientist',
          department: 'Clinical Pathology & Biochemistry',
          avatarUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=200',
        }
      : isPharmacist
        ? {
            name: 'Marcus Vance, RPh',
            specialization: 'Lead Clinical Pharmacist',
            department: 'Central Pharmacy & Dispensary',
            avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
          }
        : isReceptionist
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
                specialization: 'Cardiology',
                department: 'OPD-102',
                avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
              };

  const [userInfo, setUserInfo] = useState(defaultUserInfo);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch profile and unread notifications count based on role
  useEffect(() => {
    async function loadUserContext() {
      if (isAccountant) {
        try {
          const profileRes = await accountantApi.getProfile();
          if (profileRes.data) {
            const p = profileRes.data;
            setUserInfo({
              name: p.user?.fullName || 'David Sterling, CA',
              specialization: p.qualifications?.join(', ') || 'Senior Financial Controller',
              department: p.section || p.department || 'Hospital Revenue & Finance',
              avatarUrl: p.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            });
          }
        } catch (e) {}
        try {
          const notifRes = await accountantApi.getNotifications({ isRead: 'false' });
          if (notifRes.data?.unreadCount !== undefined) {
            setUnreadCount(notifRes.data.unreadCount);
          }
        } catch (e) {}
      } else if (isLab) {
        try {
          const profileRes = await labApi.getProfile();
          if (profileRes.data) {
            const p = profileRes.data;
            setUserInfo({
              name: p.user?.fullName || 'Alex Mercer, MLS',
              specialization: p.qualifications?.join(', ') || 'Senior Medical Laboratory Scientist',
              department: p.section || p.department || 'Clinical Pathology & Biochemistry',
              avatarUrl: p.user?.avatarUrl || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=200',
            });
          }
        } catch (e) {
          // Fallback default lab
        }
        try {
          const notifRes = await labApi.getNotifications({ isRead: 'false' });
          if (notifRes.data?.unreadCount !== undefined) {
            setUnreadCount(notifRes.data.unreadCount);
          }
        } catch (e) {}
      } else if (isPharmacist) {
        try {
          const profileRes = await pharmacistApi.getProfile();
          if (profileRes.data) {
            const p = profileRes.data;
            setUserInfo({
              name: p.user?.fullName || 'Marcus Vance, RPh',
              specialization: p.qualifications?.join(', ') || 'Lead Clinical Pharmacist',
              department: p.dispensarySection || p.department || 'Central Pharmacy & Dispensary',
              avatarUrl: p.user?.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
            });
          }
        } catch (e) {}
        try {
          const notifRes = await pharmacistApi.getNotifications({ isRead: 'false' });
          if (notifRes.data?.unreadCount !== undefined) {
            setUnreadCount(notifRes.data.unreadCount);
          }
        } catch (e) {}
      } else if (isReceptionist) {
        try {
          const profileRes = await receptionistApi.getProfile();
          if (profileRes.data) {
            const p = profileRes.data;
            setUserInfo({
              name: p.user?.fullName || 'Rachel Adams',
              specialization: 'Lead Front Desk Receptionist',
              department: p.deskLocation || 'Main Lobby / Admissions',
              avatarUrl: p.user?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
            });
          }
        } catch (e) {}
        try {
          const notifRes = await receptionistApi.getNotifications({ isRead: 'false' });
          if (notifRes.data?.unreadCount !== undefined) {
            setUnreadCount(notifRes.data.unreadCount);
          }
        } catch (e) {}
      } else if (isNurse) {
        try {
          const profileRes = await nurseApi.getProfile();
          if (profileRes.data) {
            const p = profileRes.data;
            setUserInfo({
              name: p.user?.fullName || 'Nurse Sarah Jenkins, RN',
              specialization: p.qualifications?.join(', ') || 'Registered Nurse',
              department: p.ward || p.department || 'Ward 3B',
              avatarUrl: p.user?.avatarUrl || 'https://images.unsplash.com/photo-1594824813624-9b28a883907c?auto=format&fit=crop&q=80&w=200',
            });
          }
        } catch (e) {}
        try {
          const notifRes = await nurseApi.getUnreadCount();
          if (notifRes.data?.unreadCount !== undefined) {
            setUnreadCount(notifRes.data.unreadCount);
          }
        } catch (e) {}
      } else {
        try {
          const profileRes = await doctorApi.getProfile();
          if (profileRes.data) {
            const p = profileRes.data;
            setUserInfo({
              name: p.user?.fullName || 'Dr. Sarah Chen',
              specialization: p.specialization || 'Cardiologist',
              department: p.roomNumber || p.department || 'OPD-102',
              avatarUrl: p.user?.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
            });
          }
        } catch (e) {}
        try {
          const notifRes = await doctorApi.getUnreadCount();
          if (notifRes.data?.unreadCount !== undefined) {
            setUnreadCount(notifRes.data.unreadCount);
          }
        } catch (e) {}
      }
    }

    loadUserContext();
  }, [isAccountant, isLab, isPharmacist, isReceptionist, isNurse]);

  // Time-of-day greeting generator
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const profilePath = isAccountant
    ? '/app/accountant/profile'
    : isLab
      ? '/app/lab/profile'
      : isPharmacist
        ? '/app/pharmacist/profile'
        : isReceptionist
          ? '/app/receptionist/profile'
          : isNurse
            ? '/app/nurse/profile'
            : '/app/doctor/profile';

  const notificationsPath = isAccountant
    ? '/app/accountant/notifications'
    : isLab
      ? '/app/lab/notifications'
      : isPharmacist
        ? '/app/pharmacist/notifications'
        : isReceptionist
          ? '/app/receptionist/notifications'
          : isNurse
            ? '/app/nurse/notifications'
            : '/app/doctor/notifications';

  const quickActionPath = isAccountant
    ? '/app/accountant/invoices/new'
    : isLab
      ? '/app/lab/samples'
      : isPharmacist
        ? '/app/pharmacist/dispensing'
        : isReceptionist
          ? '/app/receptionist/appointments/book'
          : isNurse
            ? '/app/nurse/vitals'
            : '/app/doctor/consultations';

  const quickActionLabel = isAccountant
    ? 'Create Invoice'
    : isLab
      ? 'Collect Specimen'
      : isPharmacist
        ? 'Dispense Rx'
        : isReceptionist
          ? 'Book Appointment'
          : isNurse
            ? 'Quick Vitals Check'
            : 'Consultation Hub';

  return (
    <div className={`med-app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} data-theme={theme}>
      {/* 1. Sidebar Component */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        unreadNotifications={unreadCount}
        user={userInfo}
        role={currentRole}
      />

      {/* 2. Main Content Area */}
      <div className="med-app-main">
        {/* Top Navbar */}
        <header className="med-topbar">
          <div className="med-topbar-left">
            <button
              type="button"
              className="med-mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open Sidebar Menu"
            >
              <Menu size={20} />
            </button>

            <div className="med-topbar-greeting">
              <h2 className="med-greeting-text">
                {getGreeting()}, <span className="teal-highlight">{userInfo.name}</span>
              </h2>
              <div className="med-greeting-sub">
                <span className="med-dept-tag">
                  {isAccountant ? (
                    <Building2 size={13} />
                  ) : isLab ? (
                    <Microscope size={13} />
                  ) : isPharmacist ? (
                    <Pill size={13} />
                  ) : isReceptionist ? (
                    <Building2 size={13} />
                  ) : isNurse ? (
                    <HeartPulse size={13} />
                  ) : (
                    <Stethoscope size={13} />
                  )}
                  {userInfo.specialization} &bull; {userInfo.department}
                </span>
                <span className="med-date-tag">
                  <Calendar size={13} /> {currentDateFormatted}
                </span>
              </div>
            </div>
          </div>

          <div className="med-topbar-right">
            {/* Quick Action Button */}
            <button
              type="button"
              className="med-btn-quick-consultation"
              onClick={() => navigate(quickActionPath)}
              title={quickActionLabel}
            >
              {isAccountant ? <Plus size={15} /> : isLab ? <TestTube size={15} /> : isNurse ? <Activity size={15} /> : <Plus size={15} />}
              <span>{quickActionLabel}</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className="med-topbar-icon-btn"
              onClick={() => navigate(notificationsPath)}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="med-bell-badge">{unreadCount}</span>}
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              className="med-topbar-theme-toggle"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            {/* User Avatar Mini */}
            <div
              className="med-topbar-avatar-wrap"
              onClick={() => navigate(profilePath)}
              title="View Staff Profile"
            >
              <img
                src={userInfo.avatarUrl || '/images/doctor.jpg'}
                alt={userInfo.name}
                className="med-topbar-avatar"
              />
              <span className="med-avatar-status-dot" />
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="med-page-content">
          <Outlet context={{ theme, userInfo, isAccountant, isNurse, isLab, isPharmacist, isReceptionist, onShowToast, setUnreadCount }} />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

