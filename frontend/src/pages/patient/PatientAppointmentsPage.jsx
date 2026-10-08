import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  RotateCcw,
  Ban,
  Search,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientAppointmentsPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'past' | 'all'
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
      if (res.data) {
        setAppointments(res.data);
      }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>My Appointments</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, marginTop: '0.2rem' }}>
            Manage scheduled doctor visits, follow-ups, and booking history.
          </p>
        </div>

        <Link
          to="/app/patient/appointments/book"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1.1rem',
            borderRadius: 10,
            fontSize: '0.85rem',
            fontWeight: 700,
            backgroundColor: '#0284c7',
            color: '#ffffff',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
          }}
        >
          <CalendarPlus size={16} />
          <span>Book New Visit</span>
        </Link>
      </div>

      {/* ── Filter Tabs ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle, #e2e8f0)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'upcoming', label: 'Upcoming Consultations' },
          { id: 'past', label: 'Past Visits' },
          { id: 'all', label: 'All History' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: tab === t.id ? 700 : 500,
              backgroundColor: tab === t.id ? '#0284c7' : 'transparent',
              color: tab === t.id ? '#ffffff' : '#64748b',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Appointments List / Loading / Empty State ────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 110, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.04)' }} />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div style={{
          padding: '3.5rem 1.5rem',
          borderRadius: 18,
          backgroundColor: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Calendar size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>No appointments found</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
              {tab === 'upcoming'
                ? 'You do not have any upcoming doctor appointments scheduled.'
                : 'No appointment history records matched this filter.'}
            </p>
          </div>
          <Link
            to="/app/patient/appointments/book"
            style={{
              padding: '0.55rem 1.2rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              textDecoration: 'none',
              marginTop: '0.5rem',
            }}
          >
            Book an Appointment Now
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appointments.map((apt) => {
            const isUpcoming = ['SCHEDULED', 'CONFIRMED'].includes(apt.status);
            return (
              <div
                key={apt.id}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: 16,
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                {/* Left: Date Badge + Doctor Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{
                    width: 54,
                    height: 54,
                    borderRadius: 12,
                    backgroundColor: isUpcoming ? '#0284c7' : '#94a3b8',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {new Date(apt.appointmentDate).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span style={{ fontSize: '1.3rem', marginTop: '0.1rem' }}>
                      {new Date(apt.appointmentDate).getDate()}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                        Dr. {apt.doctor?.name || 'Physician'}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 6,
                        backgroundColor:
                          apt.status === 'CONFIRMED'
                            ? '#dcfce7'
                            : apt.status === 'SCHEDULED'
                              ? '#fef3c7'
                              : apt.status === 'COMPLETED'
                                ? '#e0f2fe'
                                : '#fee2e2',
                        color:
                          apt.status === 'CONFIRMED'
                            ? '#15803d'
                            : apt.status === 'SCHEDULED'
                              ? '#b45309'
                              : apt.status === 'COMPLETED'
                                ? '#0369a1'
                                : '#b91c1c',
                      }}>
                        {apt.status}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                        #{apt.appointmentNumber}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.82rem', color: '#64748b', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} />
                        <span>{apt.appointmentTime} ({apt.type})</span>
                      </div>
                      {apt.doctor?.department && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={14} />
                          <span>{apt.doctor.department} {apt.doctor.roomNumber ? `(Room ${apt.doctor.roomNumber})` : ''}</span>
                        </div>
                      )}
                    </div>

                    {apt.reason && (
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.35rem' }}>
                        Reason: {apt.reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Link
                    to={`/app/patient/appointments/${apt.id}`}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(0,0,0,0.04)',
                      color: 'inherit',
                      textDecoration: 'none',
                      border: '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    Details
                  </Link>

                  {isUpcoming && (
                    <button
                      onClick={() => setSelectedCancelApt(apt)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        border: 'none',
                        cursor: 'pointer',
                      }}
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

      {/* ── Cancel Appointment Confirmation Modal ────────────────────── */}
      {selectedCancelApt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: 18,
            padding: '1.75rem',
            maxWidth: 460,
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#b91c1c' }}>
              Cancel Appointment
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.4rem 0 1rem 0' }}>
              Are you sure you want to cancel your consultation with Dr. {selectedCancelApt.doctor?.name} on {new Date(selectedCancelApt.appointmentDate).toLocaleDateString()} at {selectedCancelApt.appointmentTime}?
            </p>

            <form onSubmit={handleCancelSubmit}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Cancellation Reason (Required)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please specify why you are cancelling this appointment..."
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCancelApt(null)}
                  disabled={cancelling}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: '1px solid #cbd5e1',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={cancelling || cancelReason.trim().length < 3}
                  style={{
                    padding: '0.55rem 1.2rem',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
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
