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

// Receptionist Pages
import ReceptionistDashboardPage from '../pages/receptionist/ReceptionistDashboardPage';
import ReceptionistPatientsPage from '../pages/receptionist/ReceptionistPatientsPage';
import ReceptionistPatientRegisterPage from '../pages/receptionist/ReceptionistPatientRegisterPage';
import ReceptionistPatientDetailPage from '../pages/receptionist/ReceptionistPatientDetailPage';
import ReceptionistAppointmentsPage from '../pages/receptionist/ReceptionistAppointmentsPage';
import ReceptionistAppointmentBookPage from '../pages/receptionist/ReceptionistAppointmentBookPage';
import ReceptionistCalendarPage from '../pages/receptionist/ReceptionistCalendarPage';
import ReceptionistAdmissionsPage from '../pages/receptionist/ReceptionistAdmissionsPage';
import ReceptionistEmergencyPage from '../pages/receptionist/ReceptionistEmergencyPage';
import ReceptionistBillingPage from '../pages/receptionist/ReceptionistBillingPage';
import ReceptionistInvoicesPage from '../pages/receptionist/ReceptionistInvoicesPage';
import ReceptionistPaymentsPage from '../pages/receptionist/ReceptionistPaymentsPage';
import ReceptionistNotificationsPage from '../pages/receptionist/ReceptionistNotificationsPage';
import ReceptionistProfilePage from '../pages/receptionist/ReceptionistProfilePage';

// Pharmacist Pages
import PharmacistDashboardPage from '../pages/pharmacist/PharmacistDashboardPage';
import PharmacistMedicinesPage from '../pages/pharmacist/PharmacistMedicinesPage';
import PharmacistMedicineCreatePage from '../pages/pharmacist/PharmacistMedicineCreatePage';
import PharmacistMedicineDetailPage from '../pages/pharmacist/PharmacistMedicineDetailPage';
import PharmacistInventoryPage from '../pages/pharmacist/PharmacistInventoryPage';
import PharmacistBatchesPage from '../pages/pharmacist/PharmacistBatchesPage';
import PharmacistTransactionsPage from '../pages/pharmacist/PharmacistTransactionsPage';
import PharmacistLowStockPage from '../pages/pharmacist/PharmacistLowStockPage';
import PharmacistExpiryPage from '../pages/pharmacist/PharmacistExpiryPage';
import PharmacistPrescriptionsPage from '../pages/pharmacist/PharmacistPrescriptionsPage';
import PharmacistPrescriptionDetailPage from '../pages/pharmacist/PharmacistPrescriptionDetailPage';
import PharmacistDispensingWorkspacePage from '../pages/pharmacist/PharmacistDispensingWorkspacePage';
import PharmacistDispensingHistoryPage from '../pages/pharmacist/PharmacistDispensingHistoryPage';
import PharmacistSalesPage from '../pages/pharmacist/PharmacistSalesPage';
import PharmacistNotificationsPage from '../pages/pharmacist/PharmacistNotificationsPage';
import PharmacistProfilePage from '../pages/pharmacist/PharmacistProfilePage';

// Lab Technician Pages
import LabDashboardPage from '../pages/lab/LabDashboardPage';
import LabCatalogPage from '../pages/lab/LabCatalogPage';
import LabCatalogCreatePage from '../pages/lab/LabCatalogCreatePage';
import LabCatalogDetailPage from '../pages/lab/LabCatalogDetailPage';
import LabOrdersPage from '../pages/lab/LabOrdersPage';
import LabOrderDetailPage from '../pages/lab/LabOrderDetailPage';
import LabSamplesPage from '../pages/lab/LabSamplesPage';
import LabSampleDetailPage from '../pages/lab/LabSampleDetailPage';
import LabResultWorklistPage from '../pages/lab/LabResultWorklistPage';
import LabResultEntryPage from '../pages/lab/LabResultEntryPage';
import LabReportsPage from '../pages/lab/LabReportsPage';
import LabReportDetailPage from '../pages/lab/LabReportDetailPage';
import LabCriticalAlertsPage from '../pages/lab/LabCriticalAlertsPage';
import LabHistoryAuditPage from '../pages/lab/LabHistoryAuditPage';
import LabNotificationsPage from '../pages/lab/LabNotificationsPage';
import LabProfilePage from '../pages/lab/LabProfilePage';

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
      localStorage.setItem('medcore_auth_token', 'demo-doctor-token');
      navigate('/app/doctor');
      showToast(`Welcome Dr. Sarah Chen! Logged in as ${role.title}.`);
    } else if (role.id === 'nurse') {
      localStorage.setItem('medcore_auth_token', 'demo-nurse-token');
      navigate('/app/nurse');
      showToast(`Welcome Nurse Sarah Jenkins, RN! Logged in as ${role.title}.`);
    } else if (role.id === 'receptionist') {
      localStorage.setItem('medcore_auth_token', 'demo-receptionist-token');
      navigate('/app/receptionist');
      showToast(`Welcome Rachel Adams! Logged in as ${role.title}.`);
    } else if (role.id === 'pharmacist') {
      localStorage.setItem('medcore_auth_token', 'demo-pharmacist-token');
      navigate('/app/pharmacist');
      showToast(`Welcome Marcus Vance, RPh! Logged in as ${role.title}.`);
    } else if (role.id === 'lab_tech' || role.id === 'lab') {
      localStorage.setItem('medcore_auth_token', 'demo-lab-token');
      navigate('/app/lab');
      showToast(`Welcome Alex Mercer, MLS! Logged in as ${role.title}.`);
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

        {/* 5. Receptionist Module Shell & Nested Routes */}
        <Route
          path="/app/receptionist"
          element={
            <AppLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              onShowToast={showToast}
            />
          }
        >
          <Route index element={<ReceptionistDashboardPage />} />
          <Route path="dashboard" element={<ReceptionistDashboardPage />} />
          <Route path="patients" element={<ReceptionistPatientsPage />} />
          <Route path="patients/register" element={<ReceptionistPatientRegisterPage />} />
          <Route path="patients/:patientId" element={<ReceptionistPatientDetailPage />} />
          <Route path="appointments" element={<ReceptionistAppointmentsPage />} />
          <Route path="appointments/book" element={<ReceptionistAppointmentBookPage />} />
          <Route path="calendar" element={<ReceptionistCalendarPage />} />
          <Route path="billing" element={<ReceptionistBillingPage />} />
          <Route path="invoices" element={<ReceptionistInvoicesPage />} />
          <Route path="payments" element={<ReceptionistPaymentsPage />} />
          <Route path="admissions" element={<ReceptionistAdmissionsPage />} />
          <Route path="emergency" element={<ReceptionistEmergencyPage />} />
          <Route path="notifications" element={<ReceptionistNotificationsPage />} />
          <Route path="profile" element={<ReceptionistProfilePage />} />
        </Route>

        {/* 6. Pharmacist Module Shell & Nested Routes */}
        <Route
          path="/app/pharmacist"
          element={
            <AppLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              onShowToast={showToast}
            />
          }
        >
          <Route index element={<PharmacistDashboardPage />} />
          <Route path="dashboard" element={<PharmacistDashboardPage />} />
          <Route path="medicines" element={<PharmacistMedicinesPage />} />
          <Route path="medicines/new" element={<PharmacistMedicineCreatePage />} />
          <Route path="medicines/:id" element={<PharmacistMedicineDetailPage />} />
          <Route path="inventory" element={<PharmacistInventoryPage />} />
          <Route path="batches" element={<PharmacistBatchesPage />} />
          <Route path="batches/:id" element={<PharmacistBatchesPage />} />
          <Route path="transactions" element={<PharmacistTransactionsPage />} />
          <Route path="low-stock" element={<PharmacistLowStockPage />} />
          <Route path="expiry" element={<PharmacistExpiryPage />} />
          <Route path="prescriptions" element={<PharmacistPrescriptionsPage />} />
          <Route path="prescriptions/:id" element={<PharmacistPrescriptionDetailPage />} />
          <Route path="dispensing" element={<PharmacistDispensingWorkspacePage />} />
          <Route path="dispensing/history" element={<PharmacistDispensingHistoryPage />} />
          <Route path="sales" element={<PharmacistSalesPage />} />
          <Route path="notifications" element={<PharmacistNotificationsPage />} />
          <Route path="profile" element={<PharmacistProfilePage />} />
        </Route>

        {/* 7. Laboratory Technician Module Shell & Nested Routes */}
        <Route
          path="/app/lab"
          element={
            <AppLayout
              theme={theme}
              onToggleTheme={toggleTheme}
              onShowToast={showToast}
            />
          }
        >
          <Route index element={<LabDashboardPage />} />
          <Route path="dashboard" element={<LabDashboardPage />} />
          <Route path="catalog" element={<LabCatalogPage />} />
          <Route path="catalog/new" element={<LabCatalogCreatePage />} />
          <Route path="catalog/:id" element={<LabCatalogDetailPage />} />
          <Route path="orders" element={<LabOrdersPage />} />
          <Route path="orders/:id" element={<LabOrderDetailPage />} />
          <Route path="samples" element={<LabSamplesPage />} />
          <Route path="samples/:id" element={<LabSampleDetailPage />} />
          <Route path="worklist" element={<LabResultWorklistPage />} />
          <Route path="worklist/:itemId" element={<LabResultEntryPage />} />
          <Route path="reports" element={<LabReportsPage />} />
          <Route path="reports/:id" element={<LabReportDetailPage />} />
          <Route path="critical-alerts" element={<LabCriticalAlertsPage />} />
          <Route path="audit-history" element={<LabHistoryAuditPage />} />
          <Route path="notifications" element={<LabNotificationsPage />} />
          <Route path="profile" element={<LabProfilePage />} />
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

