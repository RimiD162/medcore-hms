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
} from 'lucide-react';
import Sidebar from './Sidebar';
import doctorApi from '../../api/doctorApi';
import nurseApi from '../../api/nurseApi';

export const AppLayout = ({ theme = 'light', onToggleTheme, onShowToast }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isNurse = location.pathname.startsWith('/app/nurse');

  const [userInfo, setUserInfo] = useState(
    isNurse
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
        }
  );
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch profile and unread notifications count based on role
  useEffect(() => {
    async function loadUserContext() {
      if (isNurse) {
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
        } catch (e) {
          // Fallback default nurse
        }

        try {
          const notifRes = await nurseApi.getUnreadCount();
          if (notifRes.data?.unreadCount !== undefined) {
            setUnreadCount(notifRes.data.unreadCount);
          }
        } catch (e) {
          // Fallback
        }
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
        } catch (e) {
          // Fallback default doctor
        }

        try {
          const notifRes = await doctorApi.getUnreadCount();
          if (notifRes.data?.unreadCount !== undefined) {
            setUnreadCount(notifRes.data.unreadCount);
          }
        } catch (e) {
          // Fallback
        }
      }
    }

    loadUserContext();
  }, [isNurse]);

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

  const profilePath = isNurse ? '/app/nurse/profile' : '/app/doctor/profile';
  const notificationsPath = isNurse ? '/app/nurse/notifications' : '/app/doctor/notifications';
  const quickActionPath = isNurse ? '/app/nurse/vitals' : '/app/doctor/consultations';
  const quickActionLabel = isNurse ? 'Quick Vitals Check' : 'Consultation Hub';

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
        role={isNurse ? 'NURSE' : 'DOCTOR'}
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
                  {isNurse ? (
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
              {isNurse ? <Activity size={15} /> : <Plus size={15} />}
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
              title={isNurse ? 'View Nurse Profile' : 'View Doctor Profile'}
            >
              <img
                src={userInfo.avatarUrl || (isNurse ? 'https://images.unsplash.com/photo-1594824813624-9b28a883907c?auto=format&fit=crop&q=80&w=200' : '/images/doctor.jpg')}
                alt={userInfo.name}
                className="med-topbar-avatar"
              />
              <span className="med-avatar-status-dot" />
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="med-page-content">
          <Outlet context={{ theme, userInfo, isNurse, onShowToast, setUnreadCount }} />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
