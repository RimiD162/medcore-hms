import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  Clock,
  MapPin,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientAppointmentsPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [selectedCancelApt, setSelectedCancelApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [tab]);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const params = {};
      if (tab === 'upcoming') params.timeframe = 'upcoming';
      else if (tab === 'past') params.timeframe = 'past';
      const res = await patientApi.getAppointments(params);
      if (res.data) setAppointments(res.data);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCancelApt || cancelReason.trim().length < 3) return;
    try {
      setCancelling(true);
      await patientApi.cancelAppointment(selectedCancelApt.id, { cancelReason });
      if (onShowToast) onShowToast('Appointment cancelled successfully');
      setSelectedCancelApt(null);
      setCancelReason('');
      fetchAppointments();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Unable to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'pp-badge pp-badge-green';
      case 'SCHEDULED': return 'pp-badge pp-badge-yellow';
      case 'COMPLETED': return 'pp-badge pp-badge-blue';
      default: return 'pp-badge pp-badge-red';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Header */}
      <div className="pp-page-header">
        <div>
          <h1 className="pp-page-title">My Appointments</h1>
          <p className="pp-page-subtitle">Manage scheduled doctor visits, follow-ups, and booking history.</p>
        </div>
        <Link to="/app/patient/appointments/book" className="pp-btn-primary">
          <CalendarPlus size={16} />
          <span>Book New Visit</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="pp-tabs">
        {[
          { id: 'upcoming', label: 'Upcoming Consultations' },
          { id: 'past', label: 'Past Visits' },
          { id: 'all', label: 'All History' },
        ].map((t) => (
          <button
            key={t.id}
            className={`pp-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="pp-skeleton" style={{ height: 104 }} />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="pp-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            backgroundColor: 'var(--pp-accent-light)', color: 'var(--pp-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Calendar size={28} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--pp-text-primary)' }}>
            No appointments found
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--pp-text-muted)', margin: '0 0 1.2rem' }}>
            {tab === 'upcoming'
              ? 'You do not have any upcoming doctor appointments scheduled.'
              : 'No appointment history records matched this filter.'}
          </p>
          <Link to="/app/patient/appointments/book" className="pp-btn-primary">
            Book an Appointment Now
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appointments.map((apt) => {
            const isUpcoming = ['SCHEDULED', 'CONFIRMED'].includes(apt.status);
            return (
              <div key={apt.id} className="pp-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                {/* Left */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: 13, flexShrink: 0,
                    background: isUpcoming ? 'linear-gradient(135deg,#0284c7,#0369a1)' : 'var(--pp-surface-alt)',
                    color: isUpcoming ? '#fff' : 'var(--pp-text-muted)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, lineHeight: 1,
                    boxShadow: isUpcoming ? '0 4px 12px rgba(2,132,199,0.3)' : 'none',
                    border: isUpcoming ? 'none' : '1px solid var(--pp-border)',
                  }}>
                    <span style={{ fontSize: '0.62rem', textTransform: 'uppercase' }}>
                      {new Date(apt.appointmentDate).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span style={{ fontSize: '1.3rem' }}>
                      {new Date(apt.appointmentDate).getDate()}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--pp-text-primary)' }}>
                        Dr. {apt.doctor?.name || 'Physician'}
                      </span>
                      <span className={getStatusBadgeClass(apt.status)}>{apt.status}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--pp-text-muted)', fontWeight: 600 }}>
                        #{apt.appointmentNumber}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--pp-text-muted)', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} />
                        <span>{apt.appointmentTime} ({apt.type})</span>
                      </div>
                      {apt.doctor?.department && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={13} />
                          <span>{apt.doctor.department}{apt.doctor.roomNumber ? ` (Room ${apt.doctor.roomNumber})` : ''}</span>
                        </div>
                      )}
                    </div>
                    {apt.reason && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--pp-text-secondary)', marginTop: '0.3rem' }}>
                        Reason: {apt.reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Link to={`/app/patient/appointments/${apt.id}`} className="pp-btn-secondary">
                    Details
                  </Link>
                  {isUpcoming && (
                    <button
                      className="pp-btn-secondary"
                      onClick={() => setSelectedCancelApt(apt)}
                      style={{ color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(239,68,68,0.06)' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {selectedCancelApt && (
        <div className="pp-modal-overlay" onClick={() => setSelectedCancelApt(null)}>
          <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#dc2626' }}>
              Cancel Appointment
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--pp-text-muted)', margin: '0 0 1.25rem' }}>
              Are you sure you want to cancel your consultation with Dr.&nbsp;
              {selectedCancelApt.doctor?.name} on&nbsp;
              {new Date(selectedCancelApt.appointmentDate).toLocaleDateString()} at&nbsp;
              {selectedCancelApt.appointmentTime}?
            </p>

            <form onSubmit={handleCancelSubmit}>
              <div className="pp-form-group">
                <label className="pp-label">Cancellation Reason (Required)</label>
                <textarea
                  className="pp-textarea"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please specify why you are cancelling this appointment…"
                  required
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="pp-btn-secondary"
                  onClick={() => setSelectedCancelApt(null)}
                  disabled={cancelling}
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={cancelling || cancelReason.trim().length < 3}
                  className="pp-btn-primary"
                  style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}
                >
                  {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointmentsPage;
