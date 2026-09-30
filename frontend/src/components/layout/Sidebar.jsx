import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { navConfig } from '../../router/navConfig';

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    addToast('Signed out successfully', 'success');
    navigate('/login');
  };

  // Filter nav items visible to the current user's role
  const visibleNav = navConfig.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  const roleLabels = {
    admin:          'Hospital Admin',
    doctor:         'Doctor',
    nurse:          'Nurse',
    receptionist:   'Front Desk',
    pharmacist:     'Pharmacist',
    lab_technician: 'Lab Technician',
    accountant:     'Accountant',
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MC';

  return (
    <aside className={`app-sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-emblem">M</div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">MedCore</span>
            <span className="sidebar-brand-tag">HMS</span>
          </div>
        )}
        <button className="sidebar-toggle-btn" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        <ul className="sidebar-nav-list">
          {visibleNav.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'sidebar-nav-active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User profile footer */}
      <div className="sidebar-user-section">
        <div className="sidebar-user-info">
          <div className="sidebar-user-avatar">{initials}</div>
          {!collapsed && (
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user?.full_name || 'System User'}</span>
              <span className="sidebar-user-role">{roleLabels[user?.role] || user?.role}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          🚪
        </button>
      </div>
    </aside>
  );
}
