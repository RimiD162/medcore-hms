import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  CalendarPlus,
  RefreshCw,
  Eye,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, Badge, Button, Modal, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistCalendarPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('week'); // 'day' | 'week' | 'month'
  const [doctorId, setDoctorId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aptRes, docRes] = await Promise.all([
        receptionistApi.getAppointments({ limit: 100, doctorId: doctorId || undefined }),
        doctors.length === 0 ? receptionistApi.getDoctors() : Promise.resolve({ data: doctors }),
      ]);

      const aptData = aptRes.data || aptRes;
      setAppointments(aptData.appointments || []);

      if (doctors.length === 0) {
        setDoctors(docRes.data || docRes || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load calendar appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [doctorId]);

  // Navigate calendar dates
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (calendarView === 'day') next.setDate(next.getDate() - 1);
    else if (calendarView === 'week') next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (calendarView === 'day') next.setDate(next.getDate() + 1);
    else if (calendarView === 'week') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate Week Days
  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // start from Monday
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const handleCheckIn = async (id, patientName) => {
    try {
      await receptionistApi.checkInAppointment(id);
      if (onShowToast) {
        onShowToast(`Checked in ${patientName}.`);
      }
      setSelectedAppointment(null);
      fetchCalendarData();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Check-in failed');
      }
    }
  };

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarIcon size={28} color="#00d2b4" /> Doctor Schedule Calendar
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Visual timetable of doctor consultations, room assignments, and booking slots.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/receptionist/appointments/book')}>
            <CalendarPlus size={14} style={{ marginRight: '6px' }} /> Book Slot
          </Button>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Date Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button variant="outline" size="sm" onClick={handlePrev} title="Previous">
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext} title="Next">
                <ChevronRight size={16} />
              </Button>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)' }}>
              {calendarView === 'day'
                ? currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
                : calendarView === 'week'
                ? `${weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                : currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h2>
          </div>

          {/* View Toggle & Doctor Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              className="med-form-select"
              style={{ minWidth: '180px' }}
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.name} ({doc.department})
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '2px' }}>
              {['day', 'week', 'month'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCalendarView(v)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: calendarView === v ? '#00d2b4' : 'transparent',
                    color: calendarView === v ? '#000' : 'var(--text-muted, #94a3b8)',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Calendar Grid */}
      {loading ? (
        <LoadingState message="Loading calendar timetable..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCalendarData} />
      ) : (
        <Card>
          {/* Week View */}
          {calendarView === 'week' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', minHeight: '520px' }}>
              {weekDays.map((day, idx) => {
                const dayStr = day.toISOString().slice(0, 10);
                const isToday = new Date().toISOString().slice(0, 10) === dayStr;
                const dayApts = appointments.filter((a) => a.appointmentDate.slice(0, 10) === dayStr);

                return (
                  <div
                    key={idx}
                    style={{
                      borderRadius: '10px',
                      background: isToday ? 'rgba(0, 210, 180, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                      border: isToday ? '1px solid rgba(0, 210, 180, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ textAlign: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>
                        {day.toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: isToday ? '#00d2b4' : 'var(--text-main, #f8fafc)' }}>
                        {day.getDate()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
                      {dayApts.length === 0 ? (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: '16px' }}>
                          No bookings
                        </div>
                      ) : (
                        dayApts.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background:
                                apt.status === 'CONFIRMED'
                                  ? 'rgba(0, 210, 180, 0.15)'
                                  : apt.status === 'COMPLETED'
                                  ? 'rgba(59, 130, 246, 0.15)'
                                  : 'rgba(245, 158, 11, 0.12)',
                              borderLeft: `3px solid ${
                                apt.status === 'CONFIRMED' ? '#00d2b4' : apt.status === 'COMPLETED' ? '#3b82f6' : '#f59e0b'
                              }`,
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease',
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f8fafc' }}>
                              {apt.appointmentTime} - {apt.patient?.fullName}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              Dr. {apt.doctor?.user?.fullName?.split(' ')[0]}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Day / Month fallback */}
          {calendarView !== 'week' && (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted, #94a3b8)' }}>
                Displaying appointments for {currentDate.toLocaleDateString()}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginTop: '16px' }}>
                {appointments
                  .filter((a) => calendarView === 'day' ? a.appointmentDate.slice(0, 10) === currentDate.toISOString().slice(0, 10) : true)
                  .map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: '#00d2b4' }}>{apt.appointmentTime}</span>
                        <Badge variant="teal">{apt.status}</Badge>
                      </div>
                      <div style={{ fontWeight: '600', color: '#f8fafc', marginTop: '4px' }}>
                        {apt.patient?.fullName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Dr. {apt.doctor?.user?.fullName} ({apt.doctor?.department})
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          title={`Appointment Details (${selectedAppointment.appointmentNumber})`}
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '0.88rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>PATIENT</span>
                <strong style={{ color: '#f8fafc' }}>{selectedAppointment.patient?.fullName}</strong>
                <div style={{ fontSize: '0.75rem', color: '#00d2b4' }}>{selectedAppointment.patient?.patientIdNumber}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>ATTENDING DOCTOR</span>
                <strong style={{ color: '#f8fafc' }}>Dr. {selectedAppointment.doctor?.user?.fullName}</strong>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{selectedAppointment.doctor?.department} &bull; Rm {selectedAppointment.doctor?.roomNumber || 'TBD'}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>SCHEDULED SLOT</span>
                <strong style={{ color: '#f8fafc' }}>
                  {selectedAppointment.appointmentDate.slice(0, 10)} at {selectedAppointment.appointmentTime}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>STATUS</span>
                <Badge variant="teal">{selectedAppointment.status} {selectedAppointment.isCheckedIn ? '(Checked In)' : ''}</Badge>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedAppointment(null)}>
                Close
              </Button>
              {!selectedAppointment.isCheckedIn && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCheckIn(selectedAppointment.id, selectedAppointment.patient?.fullName)}
                >
                  <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Check In
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReceptionistCalendarPage;
