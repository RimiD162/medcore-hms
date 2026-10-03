import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Users,
  Pill,
  Activity,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  HeartPulse,
  BedDouble,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import nurseApi from '../../api/nurseApi';
import useNurseData from '../../hooks/useNurseData';
import { Card, StatCard, Badge, Button, LoadingState, ErrorState, EmptyState } from '../../components/ui';

export const NurseDashboardPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};
  const { data: dashboard, loading, error, refetch } = useNurseData(nurseApi.getDashboard);
  const [administeringId, setAdministeringId] = useState(null);

  if (loading) {
    return <LoadingState message="Loading Nurse Station Dashboard & Ward Roster..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const nurse = dashboard?.nurse || {};
  const metrics = dashboard?.metrics || {};
  const urgentTasks = dashboard?.urgentTasks?.medications || [];
  const assignedPatients = dashboard?.assignedPatients || [];
  const recentVitals = dashboard?.recentVitals || [];
  const recentNotes = dashboard?.recentNotes || [];

  const handleQuickAdminister = async (taskId, medName, patientName) => {
    try {
      setAdministeringId(taskId);
      await nurseApi.administerMedication(taskId, { notes: 'Administered on scheduled round via dashboard quick-action' });
      if (onShowToast) {
        onShowToast(`Administered ${medName} for ${patientName} successfully.`);
      }
      refetch();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.response?.data?.message || err.message || 'Failed to administer medication');
      }
    } finally {
      setAdministeringId(null);
    }
  };

  return (
    <div className="med-dashboard-view">
      {/* 1. Nurse Shift Header Banner */}
      <Card className="med-nurse-banner-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(0, 168, 143, 0.12), rgba(15, 34, 53, 0.6))', border: '1px solid rgba(0, 210, 180, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #00d2b4, #00897b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(0, 210, 180, 0.35)' }}>
              <HeartPulse size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: 0 }}>
                  {nurse.fullName || 'Nurse Sarah Jenkins, RN'}
                </h2>
                <Badge variant="teal">{nurse.shift || 'Morning Shift (07:00 - 15:00)'}</Badge>
                <Badge variant="blue">{nurse.ward || 'Ward 3B - General Medical'}</Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                License: <strong>{nurse.licenseNumber || 'RN-99201'}</strong> &bull; Department: <strong>{nurse.department || 'Inpatient Nursing'}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/nurse/vitals')}>
              <Activity size={14} style={{ marginRight: '6px' }} /> Record Vitals
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/app/nurse/medication-administration')}>
              <Pill size={14} style={{ marginRight: '6px' }} /> e-MAR Rounds
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Key Metrics StatCards */}
      <div className="med-stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard
          title="Assigned Inpatients"
          value={metrics.assignedPatientsCount || 0}
          subtitle="Active roster in your care"
          icon={Users}
          variant="teal"
          actionText="View Patients"
          onActionClick={() => navigate('/app/nurse/patients')}
        />
        <StatCard
          title="Due / Pending Meds"
          value={metrics.pendingMedsCount || 0}
          subtitle="Scheduled medication tasks"
          icon={Pill}
          variant="amber"
          actionText="Open e-MAR"
          onActionClick={() => navigate('/app/nurse/medication-administration')}
        />
        <StatCard
          title="Administered Today"
          value={metrics.administeredTodayCount || 0}
          subtitle="Doses verified & signed"
          icon={CheckCircle2}
          variant="emerald"
          actionText="e-MAR Log"
          onActionClick={() => navigate('/app/nurse/medication-administration')}
        />
        <StatCard
          title="Flagged Vital Signs"
          value={metrics.flaggedVitalsCount || 0}
          subtitle="Requires close observation"
          icon={AlertTriangle}
          variant="rose"
          actionText="Vital Monitor"
          onActionClick={() => navigate('/app/nurse/vitals?isFlagged=true')}
        />
        <StatCard
          title="Notes Logged Today"
          value={metrics.notesTodayCount || 0}
          subtitle="Clinical observations"
          icon={ClipboardList}
          variant="purple"
          actionText="Nursing Notes"
          onActionClick={() => navigate('/app/nurse/nursing-notes')}
        />
      </div>

      {/* 3. Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Left Column: Urgent Medications & Care Tasks */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#f59e0b" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Medications Due & Care Tasks</h3>
            </div>
            <Badge variant="amber">{urgentTasks.length} Due Soon</Badge>
          </div>

          {urgentTasks.length === 0 ? (
            <EmptyState
              title="All medications up to date"
              description="No immediate pending doses for your assigned patients."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {urgentTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main, #fff)' }}>
                        {task.medicineName} {task.dosage}
                      </span>
                      <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 210, 180, 0.15)', color: '#00d2b4', fontWeight: '600' }}>
                        {task.route}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', marginTop: '3px' }}>
                      Patient: <strong style={{ color: 'var(--text-main, #fff)' }}>{task.patientName}</strong> ({task.patientNumber}) &bull; <BedDouble size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {task.ward} / {task.bedNumber}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '3px', fontWeight: '600' }}>
                      Scheduled: {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    disabled={administeringId === task.id}
                    onClick={() => handleQuickAdminister(task.id, task.medicineName, task.patientName)}
                  >
                    {administeringId === task.id ? 'Signing...' : 'Administer'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right Column: Assigned Patients Ward Roster */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BedDouble size={18} color="#00d2b4" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Assigned Inpatient Roster</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/app/nurse/patients')}>
              View All <ChevronRight size={14} />
            </Button>
          </div>

          {assignedPatients.length === 0 ? (
            <EmptyState
              title="No patients assigned"
              description="You do not currently have active inpatient assignments."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assignedPatients.map((pt) => (
                <div
                  key={pt.id}
                  onClick={() => navigate(`/app/nurse/patients/${pt.id}`)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00d2b4')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.08))')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 210, 180, 0.12)', color: '#00d2b4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                        {pt.fullName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-main, #fff)' }}>
                          {pt.fullName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {pt.patientIdNumber} &bull; {pt.age}y &bull; {pt.gender} &bull; {pt.bloodGroup}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <Badge variant="blue">{pt.ward} &bull; {pt.bedNumber}</Badge>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
                        Diag: {pt.diagnosis}
                      </div>
                    </div>
                  </div>

                  {pt.latestVital && (
                    <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', background: pt.latestVital.isFlagged ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span>
                        BP: <strong>{pt.latestVital.bloodPressure}</strong> &bull; HR: <strong>{pt.latestVital.pulse} bpm</strong> &bull; SpO2: <strong>{pt.latestVital.oxygenSaturation}%</strong> &bull; Temp: <strong>{pt.latestVital.temperature}°F</strong>
                      </span>
                      {pt.latestVital.isFlagged && (
                        <span style={{ color: '#ef4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> Flagged
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 4. Recent Clinical Activity Feed (Vitals & Nursing Notes) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#00d2b4" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Recent Vital Checks</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/app/nurse/vitals')}>
              All Vitals <ChevronRight size={14} />
            </Button>
          </div>

          {recentVitals.length === 0 ? (
            <EmptyState title="No recent vitals" description="Recorded vital signs will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentVitals.map((v) => (
                <div
                  key={v.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: v.isFlagged ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
                    border: v.isFlagged ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>{v.patient?.fullName}</span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                      BP {v.bloodPressure} &bull; HR {v.pulse} bpm &bull; SpO2 {v.oxygenSaturation}% &bull; Temp {v.temperature}°F
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                    {new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} color="#8b5cf6" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Recent Nursing Notes</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/app/nurse/nursing-notes')}>
              All Notes <ChevronRight size={14} />
            </Button>
          </div>

          {recentNotes.length === 0 ? (
            <EmptyState title="No recent nursing notes" description="Logged clinical notes will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentNotes.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>{n.patient?.fullName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #cbd5e1)', lineHeight: '1.4' }}>
                    {n.observation.length > 100 ? `${n.observation.slice(0, 100)}...` : n.observation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default NurseDashboardPage;
