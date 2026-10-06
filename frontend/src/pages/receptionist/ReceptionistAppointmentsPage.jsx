import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  User,
  Stethoscope,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, Badge, Button, Modal, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistAppointmentsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { onShowToast } = useOutletContext() || {};

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [view, setView] = useState(searchParams.get('view') || 'today');
  const [doctorId, setDoctorId] = useState(searchParams.get('doctorId') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Dialog States
  const [selectedApt, setSelectedApt] = useState(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [actionError, setActionError] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        view: view !== 'all' ? view : undefined,
        doctorId: doctorId || undefined,
        status: status || undefined,
        search: search || undefined,
        page,
        limit: 20,
      };

      const [aptRes, docRes] = await Promise.all([
        receptionistApi.getAppointments(params),
        doctors.length === 0 ? receptionistApi.getDoctors() : Promise.resolve({ data: doctors }),
      ]);

      const aptData = aptRes.data || aptRes;
      setAppointments(aptData.appointments || []);
      setPagination(aptData.pagination || { total: 0, totalPages: 1, limit: 20 });

      if (doctors.length === 0) {
        setDoctors(docRes.data || docRes || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load appointments queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 250);
    return () => clearTimeout(timer);
  }, [view, doctorId, status, search, page]);

  const handleCheckIn = async (appointmentId, patientName) => {
    try {
      await receptionistApi.checkInAppointment(appointmentId);
      if (onShowToast) {
        onShowToast(`Checked in ${patientName}. Patient is now in Waiting Queue.`);
      }
      fetchAppointments();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to check in appointment');
      }
    }
  };

  const handleOpenReschedule = (apt) => {
    setSelectedApt(apt);
    setRescheduleDate(new Date(apt.appointmentDate).toISOString().slice(0, 10));
    setRescheduleTime(apt.appointmentTime || '10:00');
    setActionError(null);
    setRescheduleModalOpen(true);
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!selectedApt) return;
    setRescheduling(true);
    setActionError(null);

    try {
      await receptionistApi.rescheduleAppointment(selectedApt.id, {
        appointmentDate: rescheduleDate,
        appointmentTime: rescheduleTime,
      });

      if (onShowToast) {
        onShowToast(`Appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}.`);
      }
      setRescheduleModalOpen(false);
      fetchAppointments();
    } catch (err) {
      setActionError(err.message || 'Failed to reschedule appointment slot.');
    } finally {
      setRescheduling(false);
    }
  };

  const handleOpenCancel = (apt) => {
    setSelectedApt(apt);
    setCancelReason('');
    setActionError(null);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!selectedApt) return;
    if (cancelReason.trim().length < 3) {
      setActionError('Cancellation reason must be at least 3 characters.');
      return;
    }
    setCancelling(true);
    setActionError(null);

    try {
      await receptionistApi.cancelAppointment(selectedApt.id, {
        cancelReason: cancelReason.trim(),
      });

      if (onShowToast) {
        onShowToast(`Appointment ${selectedApt.appointmentNumber} has been cancelled.`);
      }
      setCancelModalOpen(false);
      fetchAppointments();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={28} color="#00d2b4" /> Appointments Queue
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Manage daily check-ins, lobby flow, slot reschedules, and booking cancellations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={fetchAppointments}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/receptionist/appointments/book')}>
            <CalendarPlus size={14} style={{ marginRight: '6px' }} /> Book New Appointment
          </Button>
        </div>
      </div>

      {/* 2. Filter & View Tabs */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { id: 'today', label: "Today's Schedule" },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'past', label: 'Past History' },
              { id: 'all', label: 'All Records' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`med-tab-btn ${view === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setView(tab.id);
                  setPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>
              Search Patient / Apt # / Phone
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%', paddingLeft: '32px' }}
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>
              Doctor
            </label>
            <select
              className="med-form-select"
              style={{ width: '100%' }}
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.name} ({doc.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>
              Status Filter
            </label>
            <select
              className="med-form-select"
              style={{ width: '100%' }}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="CONFIRMED">CONFIRMED (Checked In)</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="NO_SHOW">NO SHOW</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 3. Appointments Table */}
      {loading ? (
        <LoadingState message="Loading appointment schedule records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAppointments} />
      ) : appointments.length === 0 ? (
        <Card>
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Appointments Found
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              No appointment visits match the specified filter criteria.
            </p>
            <Button
              variant="primary"
              size="sm"
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/app/receptionist/appointments/book')}
            >
              <CalendarPlus size={14} style={{ marginRight: '6px' }} /> Book An Appointment
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>TIME / DATE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>APPT #</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PATIENT NAME</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>ATTENDING DOCTOR</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>TYPE & REASON</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>STATUS</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => {
                  const isTodayApt =
                    new Date(apt.appointmentDate).toISOString().slice(0, 10) ===
                    new Date().toISOString().slice(0, 10);

                  return (
                    <tr key={apt.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#00d2b4', fontSize: '0.92rem' }}>
                          {apt.appointmentTime}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {new Date(apt.appointmentDate).toISOString().slice(0, 10)}
                        </div>
                      </td>

                      <td style={{ padding: '14px 14px', fontWeight: '700', color: 'var(--text-main, #f8fafc)', fontSize: '0.85rem' }}>
                        {apt.appointmentNumber}
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <div
                          style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)', fontSize: '0.92rem', cursor: 'pointer' }}
                          onClick={() => navigate(`/app/receptionist/patients/${apt.patientId}`)}
                        >
                          {apt.patient?.fullName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {apt.patient?.patientIdNumber} &bull; {apt.patient?.phone}
                        </div>
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ color: 'var(--text-main, #f8fafc)', fontWeight: '600', fontSize: '0.88rem' }}>
                          Dr. {apt.doctor?.user?.fullName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {apt.doctor?.department} {apt.doctor?.roomNumber ? `• Rm ${apt.doctor?.roomNumber}` : ''}
                        </div>
                      </td>

                      <td style={{ padding: '14px 14px', fontSize: '0.85rem' }}>
                        <div style={{ color: 'var(--text-main, #f8fafc)' }}>{apt.type}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {apt.reason || 'General Consultation'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <Badge
                            variant={
                              apt.status === 'CONFIRMED'
                                ? 'teal'
                                : apt.status === 'COMPLETED'
                                ? 'blue'
                                : apt.status === 'CANCELLED'
                                ? 'danger'
                                : 'amber'
                            }
                          >
                            {apt.status}
                          </Badge>
                          {apt.isCheckedIn && (
                            <span style={{ fontSize: '0.7rem', color: '#00d2b4', fontWeight: '600' }}>
                              ✓ Checked In ({apt.checkedInAt ? new Date(apt.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''})
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* Check-In Button (only active if today and not already checked in/completed/cancelled) */}
                          {!apt.isCheckedIn && !['COMPLETED', 'CANCELLED'].includes(apt.status) && (
                            <Button
                              variant="primary"
                              size="xs"
                              disabled={!isTodayApt}
                              title={!isTodayApt ? 'Check-in only allowed on the day of appointment' : 'Check-in patient'}
                              onClick={() => handleCheckIn(apt.id, apt.patient?.fullName)}
                            >
                              <CheckCircle2 size={13} style={{ marginRight: '3px' }} /> Check In
                            </Button>
                          )}

                          {/* Reschedule Button */}
                          {!['COMPLETED', 'CANCELLED'].includes(apt.status) && (
                            <Button
                              variant="outline"
                              size="xs"
                              title="Reschedule Slot"
                              onClick={() => handleOpenReschedule(apt)}
                            >
                              <RotateCcw size={13} />
                            </Button>
                          )}

                          {/* Cancel Button */}
                          {!['COMPLETED', 'CANCELLED'].includes(apt.status) && (
                            <Button
                              variant="danger"
                              size="xs"
                              title="Cancel Appointment"
                              onClick={() => handleOpenCancel(apt)}
                            >
                              <XCircle size={13} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 8px 0',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                marginTop: '12px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                Showing page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} visits)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Reschedule Dialog */}
      {rescheduleModalOpen && selectedApt && (
        <Modal
          isOpen={rescheduleModalOpen}
          onClose={() => setRescheduleModalOpen(false)}
          title={`Reschedule Appointment (${selectedApt.appointmentNumber})`}
        >
          <form onSubmit={handleConfirmReschedule} style={{ padding: '8px 0' }}>
            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
              Patient: <strong>{selectedApt.patient?.fullName}</strong> &bull; Doctor: <strong>Dr. {selectedApt.doctor?.user?.fullName}</strong>
            </p>

            {actionError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', marginBottom: '14px', fontSize: '0.85rem' }}>
                {actionError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label className="med-form-label">New Date *</label>
                <input
                  type="date"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
              </div>

              <div>
                <label className="med-form-label">New Time (HH:MM) *</label>
                <input
                  type="time"
                  className="med-form-input"
                  style={{ width: '100%' }}
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button type="button" variant="outline" size="sm" onClick={() => setRescheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={rescheduling}>
                {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Dialog */}
      {cancelModalOpen && selectedApt && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title={`Cancel Appointment (${selectedApt.appointmentNumber})`}
        >
          <form onSubmit={handleConfirmCancel} style={{ padding: '8px 0' }}>
            <p style={{ margin: '0 0 14px', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
              Are you sure you want to cancel the appointment for <strong>{selectedApt.patient?.fullName}</strong> with <strong>Dr. {selectedApt.doctor?.user?.fullName}</strong>?
            </p>

            {actionError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', marginBottom: '14px', fontSize: '0.85rem' }}>
                {actionError}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label className="med-form-label">Mandatory Cancellation Reason * (min 3 chars)</label>
              <textarea
                className="med-form-textarea"
                rows={3}
                style={{ width: '100%' }}
                placeholder="e.g. Patient called to postpone due to travel conflict..."
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button type="button" variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
                Go Back
              </Button>
              <Button type="submit" variant="danger" size="sm" disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ReceptionistAppointmentsPage;
