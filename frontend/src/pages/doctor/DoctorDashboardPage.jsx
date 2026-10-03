import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  ClipboardList,
  Activity,
  Microscope,
  ArrowRight,
  Stethoscope,
  PlusCircle,
  FileText,
  Pill,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import doctorApi from '../../api/doctorApi';
import useDoctorData from '../../hooks/useDoctorData';
import { Card, StatCard, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const DoctorDashboardPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};
  const { data: dashboard, loading, error, refetch } = useDoctorData(doctorApi.getDashboard);

  if (loading) {
    return <LoadingState message="Loading Doctor Dashboard analytics..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const stats = dashboard?.stats || {};
  const todayAppointments = dashboard?.todayAppointments || [];
  const pendingConsultations = dashboard?.pendingConsultations || [];
  const recentPatients = dashboard?.recentPatients || [];
  const recentLabReports = dashboard?.recentLabReports || [];
  const upcomingFollowUps = dashboard?.upcomingFollowUps || [];

  return (
    <div className="med-dashboard-view">
      {/* 1. 6 StatCards Grid */}
      <div className="med-stat-grid">
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          subtitle="Scheduled & active today"
          icon={Calendar}
          variant="teal"
          actionText="View Schedule"
          onActionClick={() => navigate('/app/doctor/appointments?view=today')}
        />
        <StatCard
          title="Upcoming Appointments"
          value={stats.upcomingAppointments}
          subtitle="Next 7 days"
          icon={Clock}
          variant="blue"
          actionText="Upcoming"
          onActionClick={() => navigate('/app/doctor/appointments?view=upcoming')}
        />
        <StatCard
          title="Pending Consultations"
          value={stats.pendingConsultations}
          subtitle="Active draft records"
          icon={ClipboardList}
          variant="amber"
          actionText="Resume Drafts"
          onActionClick={() => navigate('/app/doctor/consultations')}
        />
        <StatCard
          title="Clinical Follow-ups"
          value={stats.followUps}
          subtitle="Due this week"
          icon={Activity}
          variant="purple"
          actionText="Follow-ups"
          onActionClick={() => navigate('/app/doctor/patients')}
        />
        <StatCard
          title="My Patients"
          value={stats.myPatients}
          subtitle="Under clinical care"
          icon={Users}
          variant="emerald"
          actionText="Patient EMR"
          onActionClick={() => navigate('/app/doctor/patients')}
        />
        <StatCard
          title="Pending Lab Reports"
          value={stats.pendingLabReports}
          subtitle="Ordered & processing"
          icon={Microscope}
          variant="rose"
          actionText="Review Labs"
          onActionClick={() => navigate('/app/doctor/lab-reports')}
        />
      </div>

      {/* 2. Quick Action Ribbon */}
      <div className="med-quick-actions-bar">
        <span className="med-quick-actions-title">Clinical Quick Actions:</span>
        <div className="med-quick-actions-list">
          <Button
            size="sm"
            variant="teal"
            icon={Calendar}
            onClick={() => navigate('/app/doctor/appointments?view=today')}
          >
            Today's Schedule
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={Stethoscope}
            onClick={() => navigate('/app/doctor/consultations')}
          >
            Start Consultation
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={Users}
            onClick={() => navigate('/app/doctor/patients')}
          >
            View Patients
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={Pill}
            onClick={() => navigate('/app/doctor/prescriptions')}
          >
            New Prescription
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={Clock}
            onClick={() => navigate('/app/doctor/availability')}
          >
            Manage Hours
          </Button>
        </div>
      </div>

      {/* 3. Main Dashboard Grid Layout */}
      <div className="med-dashboard-main-grid">
        {/* Left Column: Today's Appointments & Pending Consultations */}
        <div className="med-dash-col-left">
          {/* Today's Appointments Card */}
          <Card
            title="Today's Appointments"
            subtitle={`${todayAppointments.length} patients scheduled for consultation`}
            icon={Calendar}
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/app/doctor/appointments?view=today')}
              >
                All &rarr;
              </Button>
            }
          >
            {todayAppointments.length === 0 ? (
              <div className="med-empty-block">
                <p>No appointments scheduled for today.</p>
              </div>
            ) : (
              <div className="med-appointment-list">
                {todayAppointments.map((apt) => (
                  <div key={apt.id} className="med-appointment-item">
                    <div className="med-apt-time-badge">
                      <Clock size={14} />
                      <span>{apt.appointmentTime}</span>
                    </div>

                    <div className="med-apt-patient-info">
                      <div className="med-apt-patient-header">
                        <span className="med-apt-patient-name">{apt.patient.fullName}</span>
                        <span className="med-apt-patient-mrn">({apt.patient.patientIdNumber})</span>
                        <span className="med-apt-patient-meta">
                          {apt.patient.gender}, {apt.patient.age}y &bull; {apt.patient.bloodGroup}
                        </span>
                      </div>
                      <p className="med-apt-reason">
                        Reason: {apt.reason || 'General Consultation'}
                      </p>
                    </div>

                    <div className="med-apt-actions">
                      <Badge status={apt.status} size="sm" />
                      {apt.isCheckedIn && (
                        <span className="med-waiting-pill">
                          <span className="med-waiting-dot" /> Waiting
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(`/app/doctor/consultations/${apt.id}`)}
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Consultations (Active Drafts) */}
          <Card
            title="Active Consultation Drafts"
            subtitle="In-progress clinical consultations requiring completion"
            icon={ClipboardList}
            className="med-mt-4"
          >
            {pendingConsultations.length === 0 ? (
              <div className="med-empty-block">
                <p>No pending drafts. All consultations are completed.</p>
              </div>
            ) : (
              <div className="med-draft-list">
                {pendingConsultations.map((draft) => (
                  <div key={draft.id} className="med-draft-item">
                    <div className="med-draft-info">
                      <span className="med-draft-name">{draft.patient.fullName}</span>
                      <span className="med-draft-sub">
                        Chief Complaint: {draft.chiefComplaint || 'Pending assessment'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/app/doctor/consultations/${draft.appointmentId}`)}
                    >
                      Resume &rarr;
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Patients Roster */}
          <Card
            title="Recent Patients"
            subtitle="Patients recently seen under clinical care"
            icon={Users}
            className="med-mt-4"
          >
            <div className="med-table-responsive">
              <table className="med-table med-table-sm">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>MRN</th>
                    <th>Age/Gender</th>
                    <th>Last Diagnosis</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPatients.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.fullName}</td>
                      <td>{p.patientIdNumber}</td>
                      <td>{p.age}y / {p.gender}</td>
                      <td>
                        <span className="med-text-truncate">{p.lastDiagnosis}</span>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/app/doctor/patients/${p.id}`)}
                        >
                          View EMR
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Follow-ups, Lab Reports, and Alerts */}
        <div className="med-dash-col-right">
          {/* Upcoming Clinical Follow-ups */}
          <Card
            title="Upcoming Follow-ups"
            subtitle="Patient review schedules"
            icon={Activity}
          >
            {upcomingFollowUps.length === 0 ? (
              <div className="med-empty-block">
                <p>No follow-ups due in the next few days.</p>
              </div>
            ) : (
              <div className="med-followup-list">
                {upcomingFollowUps.map((fu) => (
                  <div key={fu.id} className="med-followup-item">
                    <div className="med-followup-date-box">
                      <span className="med-fu-day">
                        {new Date(fu.followUpDate).getDate()}
                      </span>
                      <span className="med-fu-month">
                        {new Date(fu.followUpDate).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                    <div className="med-followup-info">
                      <span className="med-fu-patient">{fu.patient.fullName}</span>
                      <span className="med-fu-reason">{fu.reason}</span>
                      {fu.notes && <span className="med-fu-notes">&bull; {fu.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Laboratory Investigations */}
          <Card
            title="Laboratory Reports"
            subtitle="Recent ordered and reviewed diagnostic results"
            icon={Microscope}
            className="med-mt-4"
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/app/doctor/lab-reports')}
              >
                All &rarr;
              </Button>
            }
          >
            {recentLabReports.length === 0 ? (
              <div className="med-empty-block">
                <p>No recent laboratory reports.</p>
              </div>
            ) : (
              <div className="med-lab-preview-list">
                {recentLabReports.map((lab) => (
                  <div key={lab.id} className="med-lab-preview-item">
                    <div className="med-lab-preview-top">
                      <span className="med-lab-test-title">{lab.testName}</span>
                      <Badge status={lab.status} size="sm" />
                    </div>
                    <div className="med-lab-preview-patient">
                      <span>{lab.patient?.fullName}</span> &bull; <span>{lab.category}</span>
                    </div>
                    {lab.resultSummary && (
                      <p className="med-lab-summary-text">{lab.resultSummary}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
