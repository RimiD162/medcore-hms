import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Plus,
  Stethoscope,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import Sidebar from './Sidebar';
import doctorApi from '../../api/doctorApi';

export const AppLayout = ({ theme = 'light', onToggleTheme, onShowToast }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState({
    name: 'Dr. Sarah Chen',
    specialization: 'Cardiology',
    department: 'OPD-102',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
  });
  const [unreadCount, setUnreadCount] = useState(3);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch doctor profile and unread notifications count
  useEffect(() => {
    async function loadDoctorContext() {
      try {
        const profileRes = await doctorApi.getProfile();
        if (profileRes.data) {
          const p = profileRes.data;
          setDoctorInfo({
            name: p.user?.fullName || 'Dr. Sarah Chen',
            specialization: p.specialization || 'Cardiologist',
            department: p.roomNumber || p.department || 'OPD-102',
            avatarUrl: p.user?.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
          });
        }
      } catch (e) {
        // Use default doctor fallback
      }

      try {
        const notifRes = await doctorApi.getUnreadCount();
        if (notifRes.data?.unreadCount !== undefined) {
          setUnreadCount(notifRes.data.unreadCount);
        }
      } catch (e) {
        // fallback
      }
    }

    loadDoctorContext();
  }, []);

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

  return (
    <div className={`med-app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} data-theme={theme}>
      {/* 1. Sidebar Component */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        unreadNotifications={unreadCount}
        doctor={doctorInfo}
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
                {getGreeting()}, <span className="teal-highlight">{doctorInfo.name}</span>
              </h2>
              <div className="med-greeting-sub">
                <span className="med-dept-tag">
                  <Stethoscope size={13} /> {doctorInfo.specialization} &bull; {doctorInfo.department}
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
              onClick={() => navigate('/app/doctor/consultations')}
              title="Start or View Consultations"
            >
              <Plus size={15} />
              <span>Consultation Hub</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className="med-topbar-icon-btn"
              onClick={() => navigate('/app/doctor/notifications')}
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
              onClick={() => navigate('/app/doctor/profile')}
              title="View Doctor Profile"
            >
              <img
                src={doctorInfo.avatarUrl || '/images/doctor.jpg'}
                alt={doctorInfo.name}
                className="med-topbar-avatar"
              />
              <span className="med-avatar-status-dot" />
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="med-page-content">
          <Outlet context={{ theme, doctorInfo, onShowToast, setUnreadCount }} />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
