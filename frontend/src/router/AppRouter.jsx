import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Layout
import AppShell from '../components/layout/AppShell';
import ProtectedRoute from '../components/layout/ProtectedRoute';

// Auth pages (public)
import LoginPage from '../pages/auth/LoginPage';

// App pages (protected)
import DashboardPage from '../pages/dashboard/DashboardPage';

// Error pages
import UnauthorizedPage, { NotFoundPage } from '../pages/errors/ErrorPages';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public: redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public: Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected: App Shell wraps all authenticated pages */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                {/* Phase 2+ routes will be added here */}
              </Route>
            </Route>

            {/* Error pages */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
