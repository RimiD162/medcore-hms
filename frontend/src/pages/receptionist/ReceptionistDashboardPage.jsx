import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  CreditCard,
  UserPlus,
  CalendarPlus,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Building2,
  DollarSign,
  ArrowRight,
  Sparkles,
  Phone,
  Timer,
  ChevronRight,
  Search,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import useReceptionistData from '../../hooks/useReceptionistData';
import { Card, StatCard, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistDashboardPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};
  const { data: dashboard, loading, error, refetch } = useReceptionistData(receptionistApi.getDashboard);
  const [checkingInId, setCheckingInId] = useState(null);

  if (loading) {
    return <LoadingState message="Connecting to MedCore Front Desk & Lobby Engine..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const stats = dashboard?.stats || {};
  const todayAppointments = dashboard?.todayAppointments || [];
  const waitingPatients = dashboard?.waitingPatients || [];
  const recentRegistrations = dashboard?.recentRegistrations || [];
  const recentEmergencies = dashboard?.recentEmergencies || [];
  const receptionist = dashboard?.receptionist || {};

  const handleCheckIn = async (appointmentId, patientName) => {
    try {
      setCheckingInId(appointmentId);
      await receptionistApi.checkInAppointment(appointmentId);
      if (onShowToast) {
        onShowToast(`Checked in ${patientName}. Patient added to Waiting Queue.`);
      }
      refetch();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to check in patient');
      }
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="med-dashboard-view">
      {/* 1. Receptionist Shift Header Banner */}
      <Card
        className="med-receptionist-banner-card"
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(15, 124, 122, 0.15), rgba(6, 19, 31, 0.8))',
          border: '1px solid rgba(0, 210, 180, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #00d2b4, #0f7c7a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(0, 210, 180, 0.35)',
              }}
            >
              <Building2 size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: 0 }}>
                  {receptionist.fullName || 'Rachel Adams'}
                </h2>
                <Badge variant="teal">{receptionist.shift || 'Morning Shift (07:00 - 15:30)'}</Badge>
                <Badge variant="blue">{receptionist.deskLocation || 'Main Lobby Front Desk - Counter 1'}</Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                Staff ID: <strong>{receptionist.employeeId || 'REC-8801'}</strong> &bull; Workstation: <strong>Front Desk Console</strong>
              </p>
            </div>
          </div>

          {/* Action Hub */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/receptionist/patients/register')}>
              <UserPlus size={14} style={{ marginRight: '6px' }} /> Register Patient
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/app/receptionist/appointments/book')}>
              <CalendarPlus size={14} style={{ marginRight: '6px' }} /> Book Slot
            </Button>
            <Button variant="danger" size="sm" onClick={() => navigate('/app/receptionist/emergency')}>
              <AlertCircle size={14} style={{ marginRight: '6px' }} /> Fast Emergency
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/receptionist/billing')}>
              <Receipt size={14} style={{ marginRight: '6px' }} /> New Invoice
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Key Operational StatCards */}
      <div className="med-stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard
          title="Today's Registrations"
          value={stats.todayRegistrations || 0}
          subtitle="New patients intake today"
          icon={Users}
          color="#00d2b4"
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments || 0}
          subtitle="Scheduled & confirmed visits"
          icon={Calendar}
          color="#0284c7"
        />
        <StatCard
          title="Waiting in Lobby"
          value={stats.waitingPatients || 0}
          subtitle="Checked in, awaiting doctor"
          icon={Clock}
          color="#f59e0b"
        />
        <StatCard
          title="Pending Invoices"
          value={stats.pendingInvoices || 0}
          subtitle="Unpaid or partial bills"
          icon={CreditCard}
          color="#ec4899"
        />
        <StatCard
          title="Today's Collections"
          value={`$${Number(stats.todayCollections || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Total payments collected"
          icon={DollarSign}
          color="#10b981"
        />
      </div>

      {/* 3. Split Queue Layout: Today's Appointments + Waiting Room */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left Column: Today's Scheduled Appointments */}
        <Card
          title="Today's Appointment Schedule"
          subtitle="Real-time patient check-in desk"
          extra={
            <Button variant="outline" size="xs" onClick={() => navigate('/app/receptionist/appointments')}>
              View All <ChevronRight size={14} />
            </Button>
          }
        >
          {todayAppointments.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
              <Calendar size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>No appointments scheduled for today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayAppointments.slice(0, 6).map((apt) => (
                <div
                  key={apt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'rgba(0, 210, 180, 0.1)',
                        color: '#00d2b4',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                      }}
                    >
                      {apt.appointmentTime}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem' }}>
                        {apt.patient?.fullName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {apt.patient?.patientIdNumber} &bull; Dr. {apt.doctor?.user?.fullName} ({apt.doctor?.department})
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {apt.isCheckedIn ? (
                      <Badge variant="teal">Checked In</Badge>
                    ) : apt.status === 'CANCELLED' ? (
                      <Badge variant="danger">Cancelled</Badge>
                    ) : apt.status === 'COMPLETED' ? (
                      <Badge variant="blue">Completed</Badge>
                    ) : (
                      <Button
                        variant="primary"
                        size="xs"
                        disabled={checkingInId === apt.id}
                        onClick={() => handleCheckIn(apt.id, apt.patient?.fullName)}
                      >
                        <CheckCircle2 size={13} style={{ marginRight: '4px' }} />
                        {checkingInId === apt.id ? 'Checking In...' : 'Check In'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right Column: Live Waiting Room Queue */}
        <Card
          title="Lobby Waiting Room (Live Queue)"
          subtitle="Patients checked in and waiting to be seen"
          extra={
            <Badge variant="amber">
              <Timer size={12} style={{ marginRight: '4px' }} />
              {waitingPatients.length} Waiting
            </Badge>
          }
        >
          {waitingPatients.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
              <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>Lobby is clear. No patients currently waiting.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {waitingPatients.map((apt, idx) => {
                const waitMinutes = apt.checkedInAt
                  ? Math.max(0, Math.floor((new Date() - new Date(apt.checkedInAt)) / 60000))
                  : 0;

                return (
                  <div
                    key={apt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#f59e0b',
                          color: '#000',
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem' }}>
                          {apt.patient?.fullName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {apt.patient?.patientIdNumber} &bull; Room {apt.doctor?.roomNumber || 'TBD'} &bull; Dr. {apt.doctor?.user?.fullName}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <Badge variant={waitMinutes > 30 ? 'danger' : 'amber'}>
                        {waitMinutes}m Wait
                      </Badge>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                        Slot: {apt.appointmentTime}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* 4. Bottom Grid: Fast Emergency Triage Stream & Recent Registrations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
        
        {/* Recent Emergencies */}
        <Card
          title="Emergency Intake Feed"
          subtitle="Fast-path trauma and critical walk-ins"
          extra={
            <Button variant="outline" size="xs" onClick={() => navigate('/app/receptionist/emergency')}>
              Intake Log <ChevronRight size={14} />
            </Button>
          }
        >
          {recentEmergencies.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p>No active emergencies logged today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentEmergencies.slice(0, 4).map((emg) => (
                <div
                  key={emg.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.88rem' }}>
                      {emg.patientName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {emg.emergencyNumber} &bull; {emg.reason || 'Critical care'}
                    </div>
                  </div>
                  <Badge variant={emg.priority === 'CRITICAL' ? 'danger' : 'amber'}>
                    {emg.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Registrations */}
        <Card
          title="Recent Patient Intakes"
          subtitle="Newly generated patient records today"
          extra={
            <Button variant="outline" size="xs" onClick={() => navigate('/app/receptionist/patients')}>
              Directory <ChevronRight size={14} />
            </Button>
          }
        >
          {recentRegistrations.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
              <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p>No new patients registered today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentRegistrations.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.88rem' }}>
                      {p.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {p.patientIdNumber} &bull; {p.phone} &bull; {p.gender}, {p.age ? `${p.age} yrs` : 'DOB'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate(`/app/receptionist/patients/${p.id}`)}
                  >
                    Profile
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ReceptionistDashboardPage;
