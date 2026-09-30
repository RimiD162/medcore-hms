import React, { useState, useEffect } from 'react';
import PortalHome from './components/PortalHome';
import StaffRolesPage from './components/StaffRolesPage';
import PatientPortalModal from './components/PatientPortalModal';
import AuthModal from './components/AuthModal';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [currentPage, setCurrentPage] = useState('portal'); // 'portal' | 'staff-roles'
  const [theme, setTheme] = useState('light'); // 'light' | 'dark'
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync theme attribute to document body for global styles
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenAuth = (mode) => {
    setAuthModalMode(mode);
  };

  const handleLoginSuccess = (role) => {
    setAuthModalMode(null);
    setCurrentPage('staff-roles');
    showToast(`Logged in as ${role.title} (${role.subtitle})`);
  };

  return (
    <div className="app-root">
      {/* 1. Main Gateway Page (Hospital Staff & Patient Choice) */}
      {currentPage === 'portal' && (
        <PortalHome
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenAuth={handleOpenAuth}
          onSelectStaff={() => {
            setCurrentPage('staff-roles');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectPatient={() => setShowPatientModal(true)}
        />
      )}

      {/* 2. Staff Roles Page (Doctor, Nurse, Receptionist, Pharmacist, Lab Tech, Accountant) */}
      {currentPage === 'staff-roles' && (
        <StaffRolesPage
          onBackToHome={() => {
            setCurrentPage('portal');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAuth={handleOpenAuth}
          onShowToast={showToast}
        />
      )}

      {/* Interactive Patient Portal Modal */}
      {showPatientModal && (
        <PatientPortalModal
          onClose={() => setShowPatientModal(false)}
          onShowToast={showToast}
        />
      )}

      {/* Sign In & Get Started Modal */}
      {authModalMode && (
        <AuthModal
          mode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <CheckCircle2 size={18} color="#00d2b4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
