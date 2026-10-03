import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PortalHome from '../components/PortalHome';
import StaffRolesPage from '../components/StaffRolesPage';
import PatientPortalModal from '../components/PatientPortalModal';
import AuthModal from '../components/AuthModal';
import AppLayout from '../components/layout/AppLayout';
import { CheckCircle2 } from 'lucide-react';

// Doctor Pages
import DoctorDashboardPage from '../pages/doctor/DoctorDashboardPage';
import DoctorAppointmentsPage from '../pages/doctor/DoctorAppointmentsPage';
import DoctorPatientsPage from '../pages/doctor/DoctorPatientsPage';
import DoctorPatientDetailPage from '../pages/doctor/DoctorPatientDetailPage';
import DoctorConsultationsPage from '../pages/doctor/DoctorConsultationsPage';
import DoctorConsultationDetailPage from '../pages/doctor/DoctorConsultationDetailPage';
import DoctorMedicalRecordsPage from '../pages/doctor/DoctorMedicalRecordsPage';
import DoctorPrescriptionsPage from '../pages/doctor/DoctorPrescriptionsPage';
import DoctorLabReportsPage from '../pages/doctor/DoctorLabReportsPage';
import DoctorDocumentsPage from '../pages/doctor/DoctorDocumentsPage';
import DoctorNotificationsPage from '../pages/doctor/DoctorNotificationsPage';
import DoctorProfilePage from '../pages/doctor/DoctorProfilePage';
import DoctorAvailabilityPage from '../pages/doctor/DoctorAvailabilityPage';

// Nurse Pages
import NurseDashboardPage from '../pages/nurse/NurseDashboardPage';
import NurseAssignedPatientsPage from '../pages/nurse/NurseAssignedPatientsPage';
import NursePatientDetailPage from '../pages/nurse/NursePatientDetailPage';
import NurseVitalMonitoringPage from '../pages/nurse/NurseVitalMonitoringPage';
import NurseNursingNotesPage from '../pages/nurse/NurseNursingNotesPage';
import NurseMedicationAdministrationPage from '../pages/nurse/NurseMedicationAdministrationPage';
import NurseAdmissionsPage from '../pages/nurse/NurseAdmissionsPage';
import NurseBedAssignmentPage from '../pages/nurse/NurseBedAssignmentPage';
import NurseNotificationsPage from '../pages/nurse/NurseNotificationsPage';
import NurseProfilePage from '../pages/nurse/NurseProfilePage';

export const AppRouter = () => {
  const [theme, setTheme] = useState('light');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const navigate = useNavigate();

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
    if (role.id === 'doctor') {
      navigate('/app/doctor');
      showToast(`Welcome Dr. Sarah Chen! Logged in as ${role.title}.`);
    } else if (role.id === 'nurse') {
      navigate('/app/nurse');
      showToast(`Welcome Nurse Sarah Jenkins, RN! Logged in as ${role.title}.`);
    } else {
      navigate('/staff-roles');
      showToast(`Logged in as ${role.title} (${role.subtitle})`);
    }
  };

  return (
    <>
      <Routes>
        {/* 1. Landing Gateway Page */}
        <Route
          path="/"
          element={
            <PortalHome
              theme={theme}
              onToggleTheme={toggleTheme}
              onOpenAuth={handleOpenAuth}
              onSelectStaff={() => {
                navigate('/staff-roles');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectPatient={() => setShowPatientModal(true)}
            />
          }
        />

        {/* 2. Staff Roles Selection */}
        <Route
          path="/staff-roles"
          element={
            <StaffRolesPage
              theme={theme}
              onToggleTheme={toggleTheme}
              onBackToHome={() => {
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAuth={handleOpenAuth}
              onShowToast={showToast}
            />
          }
        />

        {/* 3. Doctor Module Shell & Nested Routes */}
        <Route
          path="/app/doctor"
          element={
            <AppLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              onShowToast={showToast}
            />
          }
        >
          <Route index element={<DoctorDashboardPage />} />
          <Route path="dashboard" element={<DoctorDashboardPage />} />
          <Route path="appointments" element={<DoctorAppointmentsPage />} />
          <Route path="patients" element={<DoctorPatientsPage />} />
          <Route path="patients/:patientId" element={<DoctorPatientDetailPage />} />
          <Route path="consultations" element={<DoctorConsultationsPage />} />
          <Route path="consultations/:appointmentId" element={<DoctorConsultationDetailPage />} />
          <Route path="medical-records" element={<DoctorMedicalRecordsPage />} />
          <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
          <Route path="lab-reports" element={<DoctorLabReportsPage />} />
          <Route path="documents" element={<DoctorDocumentsPage />} />
          <Route path="notifications" element={<DoctorNotificationsPage />} />
          <Route path="profile" element={<DoctorProfilePage />} />
          <Route path="availability" element={<DoctorAvailabilityPage />} />
        </Route>

        {/* 4. Nurse Module Shell & Nested Routes */}
        <Route
          path="/app/nurse"
          element={
            <AppLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              onShowToast={showToast}
            />
          }
        >
          <Route index element={<NurseDashboardPage />} />
          <Route path="dashboard" element={<NurseDashboardPage />} />
          <Route path="patients" element={<NurseAssignedPatientsPage />} />
          <Route path="patients/:patientId" element={<NursePatientDetailPage />} />
          <Route path="vitals" element={<NurseVitalMonitoringPage />} />
          <Route path="nursing-notes" element={<NurseNursingNotesPage />} />
          <Route path="medication-administration" element={<NurseMedicationAdministrationPage />} />
          <Route path="medications" element={<Navigate to="/app/nurse/medication-administration" replace />} />
          <Route path="admissions" element={<NurseAdmissionsPage />} />
          <Route path="bed-assignment" element={<NurseBedAssignmentPage />} />
          <Route path="beds" element={<Navigate to="/app/nurse/bed-assignment" replace />} />
          <Route path="notifications" element={<NurseNotificationsPage />} />
          <Route path="profile" element={<NurseProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Patient Portal Modal */}
      {showPatientModal && (
        <PatientPortalModal
          onClose={() => setShowPatientModal(false)}
          onShowToast={showToast}
        />
      )}

      {/* Auth Modal */}
      {authModalMode && (
        <AuthModal
          mode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Toast Notice */}
      {toastMessage && (
        <div className="toast-notice">
          <CheckCircle2 size={18} color="#00d2b4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};

export default AppRouter;
