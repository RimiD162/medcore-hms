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
        if (res.data) setPatient(res.data);
      } catch {
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
      } catch {}
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
    localStorage.removeItem('medcore_patient_token');
    if (onShowToast) onShowToast('Signed out of Patient Portal');
    navigate('/portal/login');
  };

  const navItems = [
    { title: 'Dashboard',        path: '/app/patient',                       icon: LayoutDashboard, exact: true },
    { title: 'My Appointments',  path: '/app/patient/appointments',          icon: Calendar },
    { title: 'Book Appointment', path: '/app/patient/appointments/book',     icon: CalendarPlus, badge: 'New' },
    { title: 'Medical Records',  path: '/app/patient/medical-records',       icon: FileText },
    { title: 'Prescriptions',    path: '/app/patient/prescriptions',         icon: Pill },
    { title: 'Lab Reports',      path: '/app/patient/lab-reports',           icon: Microscope },
    { title: 'Billing & Invoices', path: '/app/patient/billing',             icon: CreditCard },
    { title: 'Document Vault',   path: '/app/patient/documents',             icon: FolderLock },
    { title: 'Insurance',        path: '/app/patient/insurance',             icon: ShieldCheck },
    { title: 'Health Timeline',  path: '/app/patient/timeline',              icon: History },
  ];

  const bottomNavItems = [
    { title: 'Home',        path: '/app/patient',              icon: LayoutDashboard, exact: true },
    { title: 'Visits',      path: '/app/patient/appointments', icon: Calendar },
    { title: 'Records',     path: '/app/patient/medical-records', icon: FileText },
    { title: 'Labs',        path: '/app/patient/lab-reports',  icon: Microscope },
    { title: 'Billing',     path: '/app/patient/billing',      icon: CreditCard },
    { title: 'Profile',     path: '/app/patient/profile',      icon: User },
  ];

  const avatarInitial = patient?.fullName ? patient.fullName.charAt(0).toUpperCase() : 'P';

  return (
    <div className="pp-layout" data-theme={theme}>

      {/* ── Top Header ──────────────────────────────────────────── */}
      <header className="pp-header">

        {/* Left: Mobile toggle + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            className="pp-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/app/patient" className="pp-header-brand">
            <div className="pp-header-logo">
              <HeartPulse size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span className="pp-header-brand-name">MedCore</span>
                <span className="pp-header-portal-badge">Patient Portal</span>
              </div>
              <div className="pp-header-brand-sub">Personal Health &amp; Clinical Records</div>
            </div>
          </Link>
        </div>

        {/* Center: Search */}
        <form className="pp-search-form" onSubmit={handleSearchSubmit}>
          <div className="pp-search-wrap">
            <Search size={15} className="pp-search-icon" />
            <input
              type="text"
              className="pp-search-input"
              placeholder="Search records, prescriptions, doctors…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Right: Actions */}
        <div className="pp-header-actions">
          {/* Book Appointment */}
          <Link to="/app/patient/appointments/book" className="pp-btn-book">
            <CalendarPlus size={15} />
            <span>Book Visit</span>
          </Link>

          {/* Theme Toggle */}
          <button className="pp-icon-btn" onClick={onToggleTheme} title="Toggle theme" style={{ border: 'none' }}>
            {theme === 'dark'
              ? <Sun size={17} color="#facc15" />
              : <Moon size={17} />}
          </button>

          {/* Notifications */}
          <Link to="/app/patient/notifications" className="pp-icon-btn" title="Notifications">
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="pp-notif-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User Pill */}
          <Link to="/app/patient/profile" className="pp-user-pill">
            <div className="pp-user-avatar">{avatarInitial}</div>
            <div>
              <div className="pp-user-name">{patient?.fullName || 'Patient'}</div>
              <div className="pp-user-id">{patient?.patientIdNumber || 'Active'}</div>
            </div>
          </Link>
        </div>
      </header>

      {/* ── Body: Sidebar + Main ─────────────────────────────────── */}
      <div className="pp-body">

        {/* Sidebar */}
        <aside className={`pp-sidebar${mobileMenuOpen ? ' pp-sidebar-open' : ''}`}>

          <div className="pp-nav-list">
            <span className="pp-nav-section-label">Clinical Health</span>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) => `pp-nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="pp-nav-item-inner">
                    <Icon size={17} />
                    <span>{item.title}</span>
                  </span>
                  {item.badge && (
                    <span className="pp-nav-badge">{item.badge}</span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Bottom Nav Items */}
          <div className="pp-sidebar-bottom">
            <NavLink
              to="/app/patient/profile"
              className={({ isActive }) => `pp-nav-item-bottom${isActive ? ' active' : ''}`}
            >
              <User size={17} />
              <span>My Profile &amp; Vitals</span>
            </NavLink>

            <NavLink
              to="/app/patient/settings"
              className={({ isActive }) => `pp-nav-item-bottom${isActive ? ' active' : ''}`}
            >
              <Settings size={17} />
              <span>Account &amp; Security</span>
            </NavLink>

            <button
              className="pp-nav-item-bottom pp-logout-btn"
              onClick={handleLogout}
            >
              <LogOut size={17} style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444' }}>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="pp-main">
          <Outlet context={{ patient, onShowToast }} />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ─────────────────────────── */}
      <nav className="pp-mobile-nav">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `pp-mobile-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.title}</span>
              <span className="pp-mobile-nav-dot" />
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
};

export default PatientLayout;
