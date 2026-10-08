import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Ban,
  User,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientAppointmentDetailPage = () => {
  const { appointmentId } = useParams();
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState(null);

  // Reschedule state
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [rescheduling, setRescheduling] = useState(false);

  // Cancel state
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  async function fetchAppointment() {
    try {
      setLoading(true);
      const res = await patientApi.getAppointmentById(appointmentId);
      if (res.data) {
        setAppointment(res.data);
      }
    } catch (err) {
      setError(err.message || 'Appointment not found');
    } finally {
      setLoading(false);
    }
  }

  // Load slots when rescheduling date changes
  useEffect(() => {
    if (!showReschedule || !newDate || !appointment?.doctor?.id) return;

    async function loadSlots() {
      try {
        setSlotsLoading(true);
        const res = await patientApi.getDoctorAvailability(appointment.doctor.id, newDate);
        if (res.data) {
          setAvailableSlots(res.data.slots || []);
        }
      } catch (err) {
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }

    loadSlots();
  }, [newDate, showReschedule]);

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) return;

    try {
      setRescheduling(true);
      await patientApi.rescheduleAppointment(appointment.id, {
        appointmentDate: newDate,
        appointmentTime: newTime,
      });
      if (onShowToast) onShowToast('Appointment rescheduled successfully!');
      setShowReschedule(false);
      fetchAppointment();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to reschedule appointment');
    } finally {
      setRescheduling(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (cancelReason.trim().length < 3) return;

    try {
      setCancelling(true);
      await patientApi.cancelAppointment(appointment.id, { cancelReason });
      if (onShowToast) onShowToast('Appointment cancelled successfully');
      setShowCancel(false);
      fetchAppointment();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Unable to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading appointment details...</div>;
  }

  if (error || !appointment) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h3 style={{ color: '#ef4444' }}>Appointment Not Found</h3>
        <p style={{ color: '#64748b' }}>{error || 'This record does not exist or you do not have permission to view it.'}</p>
        <Link to="/app/patient/appointments" style={{ color: '#0284c7', fontWeight: 600 }}>
          ← Back to Appointments
        </Link>
      </div>
    );
  }

  const isUpcoming = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Top Breadcrumb ────────────────────────────────────────── */}
      <div>
        <Link to="/app/patient/appointments" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.85rem', textDecoration: 'none', marginBottom: '0.5rem' }}>
          <ChevronLeft size={16} />
          <span>Back to Appointments</span>
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
              Appointment #{appointment.appointmentNumber}
            </h1>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Booked on {new Date(appointment.createdAt).toLocaleDateString()}
            </span>
          </div>

          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            padding: '0.3rem 0.8rem',
            borderRadius: 8,
            backgroundColor:
              appointment.status === 'CONFIRMED'
                ? '#dcfce7'
                : appointment.status === 'SCHEDULED'
                  ? '#fef3c7'
                  : appointment.status === 'COMPLETED'
                    ? '#e0f2fe'
                    : '#fee2e2',
            color:
              appointment.status === 'CONFIRMED'
                ? '#15803d'
                : appointment.status === 'SCHEDULED'
                  ? '#b45309'
                  : appointment.status === 'COMPLETED'
                    ? '#0369a1'
                    : '#b91c1c',
          }}>
            {appointment.status}
          </span>
        </div>
      </div>

      {/* ── Main Detail Card ──────────────────────────────────────── */}
      <div style={{
        padding: '2rem',
        borderRadius: 20,
        backgroundColor: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        {/* Doctor Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
          }}>
            <Stethoscope size={28} />
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>Dr. {appointment.doctor?.name}</div>
            <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600 }}>
              {appointment.doctor?.specialization} • {appointment.doctor?.department}
            </div>
            {appointment.doctor?.roomNumber && (
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                Consultation Room: {appointment.doctor.roomNumber}
              </div>
            )}
          </div>
        </div>

        {/* Schedule & Timing Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Date</span>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.1rem' }}>
              {new Date(appointment.appointmentDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Time & Type</span>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.1rem' }}>
              {appointment.appointmentTime} ({appointment.type})
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Check-in Status</span>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: appointment.isCheckedIn ? '#10b981' : '#f59e0b', marginTop: '0.1rem' }}>
              {appointment.isCheckedIn ? 'Checked In at Clinic' : 'Waiting Arrival'}
            </div>
          </div>
        </div>

        {appointment.reason && (
          <div style={{ padding: '1rem', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Reason for Visit:</span>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{appointment.reason}</p>
          </div>
        )}

        {appointment.cancelReason && (
          <div style={{ padding: '1rem', borderRadius: 12, backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Cancellation Reason:</span>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{appointment.cancelReason}</p>
          </div>
        )}

        {/* Action Buttons */}
        {isUpcoming && (
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => setShowReschedule(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.1rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 700,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} />
              <span>Reschedule</span>
            </button>

            <button
              onClick={() => setShowCancel(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.1rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 700,
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Ban size={15} />
              <span>Cancel Visit</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Reschedule Modal ────────────────────────────────────────── */}
      {showReschedule && (
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
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Reschedule Appointment</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.3rem 0 1.25rem 0' }}>
              Select a new date and available time slot for Dr. {appointment.doctor?.name}.
            </p>

            <form onSubmit={handleRescheduleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setNewTime('');
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              {newDate && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Available Slots
                  </label>
                  {slotsLoading ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading slots...</div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>No slots available on this date.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                      {availableSlots.map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          onClick={() => setNewTime(s.time)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: 8,
                            fontSize: '0.82rem',
                            fontWeight: newTime === s.time ? 800 : 500,
                            backgroundColor: newTime === s.time ? '#0284c7' : 'rgba(0,0,0,0.04)',
                            color: newTime === s.time ? '#ffffff' : 'inherit',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowReschedule(false)}
                  disabled={rescheduling}
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling || !newDate || !newTime}
                  style={{
                    padding: '0.55rem 1.2rem',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    cursor: (!newDate || !newTime) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ────────────────────────────────────────────── */}
      {showCancel && (
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
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.3rem 0 1rem 0' }}>
              Please provide a brief reason for cancelling your visit.
            </p>

            <form onSubmit={handleCancelSubmit}>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
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
                  onClick={() => setShowCancel(false)}
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
                  Keep Visit
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

export default PatientAppointmentDetailPage;
