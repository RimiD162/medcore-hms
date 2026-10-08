import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CalendarPlus,
  FileText,
  Pill,
  Microscope,
  CreditCard,
  FolderLock,
  ShieldCheck,
  History,
  User,
  Settings,
  Bell,
  Sun,
  Moon,
  Search,
  LogOut,
  Menu,
  X,
  HeartPulse,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientLayout = ({ theme = 'light', onToggleTheme, onShowToast }) => {
  const [patient, setPatient] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPatientProfile() {
      try {
        const res = await patientApi.getProfile();
        if (res.data) {
          setPatient(res.data);
        }
      } catch (err) {
        // Fallback demo patient profile
        setPatient({
          fullName: 'Robert Sterling',
          patientIdNumber: 'MC-2026-000101',
          bloodGroup: 'O+',
          gender: 'Male',
          age: 48,
          email: 'patient.a@medcore.health',
        });
      }

      try {
        const notifRes = await patientApi.getNotifications();
        if (notifRes.data?.unreadCount !== undefined) {
          setUnreadCount(notifRes.data.unreadCount);
        }
      } catch (e) {}
    }

    loadPatientProfile();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/app/patient/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medcore_auth_token');
    if (onShowToast) onShowToast('Signed out of Patient Portal');
    navigate('/portal/login');
  };

  const navItems = [
    { title: 'Dashboard', path: '/app/patient', icon: LayoutDashboard, exact: true },
    { title: 'My Appointments', path: '/app/patient/appointments', icon: Calendar },
    { title: 'Book Appointment', path: '/app/patient/appointments/book', icon: CalendarPlus, badge: 'New' },
    { title: 'Medical Records', path: '/app/patient/medical-records', icon: FileText },
    { title: 'Prescriptions', path: '/app/patient/prescriptions', icon: Pill },
    { title: 'Lab Reports', path: '/app/patient/lab-reports', icon: Microscope },
    { title: 'Billing & Invoices', path: '/app/patient/billing', icon: CreditCard },
    { title: 'Document Vault', path: '/app/patient/documents', icon: FolderLock },
    { title: 'Insurance Coverage', path: '/app/patient/insurance', icon: ShieldCheck },
    { title: 'Health Timeline', path: '/app/patient/timeline', icon: History },
  ];

  const bottomNavItems = [
    { title: 'Home', path: '/app/patient', icon: LayoutDashboard, exact: true },
    { title: 'Appointments', path: '/app/patient/appointments', icon: Calendar },
    { title: 'Records', path: '/app/patient/medical-records', icon: FileText },
    { title: 'Lab Tests', path: '/app/patient/lab-reports', icon: Microscope },
    { title: 'Billing', path: '/app/patient/billing', icon: CreditCard },
    { title: 'Profile', path: '/app/patient/profile', icon: User },
  ];

  return (
    <div className="patient-portal-layout" data-theme={theme} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme === 'dark' ? '#071522' : '#f8fafc', color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>
      
      {/* ── Top Header Navigation Bar ────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        backgroundColor: theme === 'dark' ? '#091c2e' : '#ffffff',
        borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {/* Left: Brand & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-only-btn"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '0.25rem',
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/app/patient" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7 0%, #00d2b4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
            }}>
              <HeartPulse size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>MedCore</span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 6,
                  backgroundColor: theme === 'dark' ? '#0d3846' : '#e0f2fe',
                  color: theme === 'dark' ? '#38bdf8' : '#0369a1',
                }}>
                  Patient Portal
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                Personal Health & Clinical Records
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="desktop-search-form" style={{ flex: 1, maxWidth: 420, margin: '0 2rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search records, prescriptions, lab reports, doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 1rem 0.55rem 2.25rem',
                borderRadius: 9999,
                fontSize: '0.85rem',
                border: `1px solid ${theme === 'dark' ? '#1e3a5f' : '#cbd5e1'}`,
                backgroundColor: theme === 'dark' ? '#071522' : '#f8fafc',
                color: 'inherit',
                outline: 'none',
                transition: 'all 0.2s',
              }}
            />
          </div>
        </form>

        {/* Right: Actions, Theme, Notifications & User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Quick Book Appointment Button */}
          <Link
            to="/app/patient/appointments/book"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.3)',
              transition: 'background 0.2s',
            }}
            className="desktop-book-btn"
          >
            <CalendarPlus size={15} />
            <span>Book Visit</span>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            style={{
              padding: '0.5rem',
              borderRadius: 8,
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
              backgroundColor: theme === 'dark' ? '#0e2638' : '#f1f5f9',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} color="#facc15" /> : <Moon size={17} color="#475569" />}
          </button>

          {/* Notifications Link */}
          <Link
            to="/app/patient/notifications"
            style={{
              position: 'relative',
              padding: '0.5rem',
              borderRadius: 8,
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
              backgroundColor: theme === 'dark' ? '#0e2638' : '#f1f5f9',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px #ffffff',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill */}
          <Link
            to="/app/patient/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 10,
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
              backgroundColor: theme === 'dark' ? '#0c2233' : '#f8fafc',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}>
              {patient?.fullName ? patient.fullName.charAt(0) : 'P'}
            </div>
            <div className="desktop-user-text" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.1 }}>
                {patient?.fullName || 'Patient'}
              </div>
              <div style={{ fontSize: '0.68rem', color: theme === 'dark' ? '#38bdf8' : '#0284c7', fontWeight: 600 }}>
                {patient?.patientIdNumber || 'ID: Active'}
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* ── Main Layout Body (Sidebar + Content) ────────────────── */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Desktop Sidebar Navigation */}
        <aside
          className={`patient-desktop-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
          style={{
            width: 260,
            flexShrink: 0,
            borderRight: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            backgroundColor: theme === 'dark' ? '#081a29' : '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.25rem 0.75rem',
          }}
        >
          {/* Main Nav Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: theme === 'dark' ? '#64748b' : '#94a3b8',
              padding: '0.5rem 0.75rem',
            }}>
              Clinical Health
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `patient-nav-item ${isActive ? 'active' : ''}`
                  }
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: 'none',
                    color: isActive
                      ? '#ffffff'
                      : theme === 'dark' ? '#cbd5e1' : '#475569',
                    backgroundColor: isActive
                      ? '#0284c7'
                      : 'transparent',
                    transition: 'all 0.18s ease',
                  })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={18} />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: 4,
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Bottom Sidebar Settings & User Box */}
          <div style={{ paddingTop: '1rem', borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}` }}>
            <NavLink
              to="/app/patient/profile"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.55rem 0.85rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                textDecoration: 'none',
                color: isActive ? '#0284c7' : theme === 'dark' ? '#cbd5e1' : '#475569',
                fontWeight: isActive ? 700 : 500,
              })}
            >
              <User size={18} />
              <span>My Profile & Vitals</span>
            </NavLink>

            <NavLink
              to="/app/patient/settings"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.55rem 0.85rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                textDecoration: 'none',
                color: isActive ? '#0284c7' : theme === 'dark' ? '#cbd5e1' : '#475569',
                fontWeight: isActive ? 700 : 500,
              })}
            >
              <Settings size={18} />
              <span>Account & Security</span>
            </NavLink>

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.55rem 0.85rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                color: '#ef4444',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                marginTop: '0.25rem',
                fontWeight: 500,
              }}
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ── Main Routed Page Content ────────────────────────────── */}
        <main style={{
          flex: 1,
          padding: '1.5rem',
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
          overflowY: 'auto',
          paddingBottom: '5rem', // Offset for mobile bottom bar
        }}>
          <Outlet context={{ patient, onShowToast }} />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ────────────────────────── */}
      <nav
        className="patient-mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: 'none',
          backgroundColor: theme === 'dark' ? '#091c2e' : '#ffffff',
          borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
          padding: '0.4rem 0.25rem',
          justifyContent: 'space-around',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        }}
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                textDecoration: 'none',
                fontSize: '0.65rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? '#0284c7'
                  : theme === 'dark' ? '#94a3b8' : '#64748b',
                padding: '0.25rem 0.5rem',
                borderRadius: 6,
              })}
            >
              <Icon size={19} />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Embedded CSS for Responsive Styles */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-search-form {
            display: none !important;
          }
          .desktop-book-btn {
            display: none !important;
          }
          .desktop-user-text {
            display: none !important;
          }
          .mobile-only-btn {
            display: block !important;
          }
          .patient-desktop-sidebar {
            position: fixed !important;
            top: 60px !important;
            bottom: 56px !important;
            left: -280px !important;
            z-index: 45 !important;
            transition: left 0.25s ease !important;
            box-shadow: 4px 0 15px rgba(0,0,0,0.15) !important;
          }
          .patient-desktop-sidebar.mobile-open {
            left: 0 !important;
          }
          .patient-mobile-bottom-nav {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientLayout;
