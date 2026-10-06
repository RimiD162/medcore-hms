import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import {
  CalendarPlus,
  ArrowLeft,
  Search,
  User,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, Button, Badge, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistAppointmentBookPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { onShowToast } = useOutletContext() || {};

  const preselectedPatientId = searchParams.get('patientId');
  const preselectedDoctorId = searchParams.get('doctorId');

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(preselectedDoctorId || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState('');
  const [type, setType] = useState('General');
  const [reason, setReason] = useState('');

  // Availability State
  const [availability, setAvailability] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [patRes, docRes] = await Promise.all([
          receptionistApi.getPatients({ limit: 100 }),
          receptionistApi.getDoctors(),
        ]);
        const patData = patRes.data || patRes;
        const docData = docRes.data || docRes;
        setPatients(patData.patients || []);
        setDoctors(docData || []);

        if (docData?.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docData[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial booking data', err);
      } finally {
        setLoadingInitial(false);
      }
    };
    loadInitialData();
  }, []);

  // Fetch doctor availability whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setAvailability(null);
      return;
    }

    const fetchAvailability = async () => {
      setLoadingSlots(true);
      setSelectedTime('');
      setBookingError(null);
      try {
        const res = await receptionistApi.getDoctorAvailability(selectedDoctorId, selectedDate);
        setAvailability(res.data || res);
      } catch (err) {
        console.error('Failed to load availability slots', err);
        setAvailability(null);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [selectedDoctorId, selectedDate]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setBookingError('Please select a patient.');
      return;
    }
    if (!selectedDoctorId) {
      setBookingError('Please select a doctor.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      setBookingError('Please select an available appointment time slot.');
      return;
    }

    setBooking(true);
    setBookingError(null);

    try {
      const res = await receptionistApi.bookAppointment({
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        type,
        reason: reason || undefined,
      });

      const apt = res.data || res;

      if (onShowToast) {
        onShowToast(`Appointment ${apt.appointmentNumber} successfully booked for ${selectedDate} at ${selectedTime}!`);
      }

      navigate('/app/receptionist/appointments');
    } catch (err) {
      setBookingError(err.message || 'Slot collision or booking failure. Please choose another slot.');
    } finally {
      setBooking(false);
    }
  };

  if (loadingInitial) {
    return <LoadingState message="Loading doctor rosters and patient registry..." />;
  }

  const selectedDoctorObj = doctors.find((d) => d.id === selectedDoctorId);
  const selectedPatientObj = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="med-page-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/receptionist/appointments')}>
            <ArrowLeft size={16} /> Back to Appointments
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0 }}>
              Book Patient Appointment
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
              Live availability engine with real-time double-booking prevention.
            </p>
          </div>
        </div>
      </div>

      {bookingError && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            marginBottom: '20px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={20} />
          <span>{bookingError}</span>
        </div>
      )}

      <form onSubmit={handleBookingSubmit}>
        {/* Step 1: Select Patient */}
        <Card title="1. Select Patient" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', alignItems: 'center' }}>
            <div>
              <label className="med-form-label">Registered Patient *</label>
              <select
                className="med-form-select"
                style={{ width: '100%' }}
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">-- Choose Patient from Directory --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.patientIdNumber}) &bull; {p.phone}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '20px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>Not registered yet?</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/receptionist/patients/register')}
              >
                <UserPlus size={14} style={{ marginRight: '6px' }} /> Register New Patient
              </Button>
            </div>
          </div>
        </Card>

        {/* Step 2: Select Doctor & Date */}
        <Card title="2. Select Doctor & Visit Date" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label className="med-form-label">Attending Doctor *</label>
              <select
                className="med-form-select"
                style={{ width: '100%' }}
                required
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.name} &bull; {doc.department} (Fee: ${doc.consultationFee})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="med-form-label">Appointment Date *</label>
              <input
                type="date"
                className="med-form-input"
                style={{ width: '100%' }}
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {selectedDoctorObj && (
            <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
              Department: <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{selectedDoctorObj.department}</strong> &bull; Consultation Fee: <strong style={{ color: '#00d2b4' }}>${selectedDoctorObj.consultationFee}</strong> &bull; Room: <strong>{selectedDoctorObj.roomNumber || 'TBD'}</strong>
            </div>
          )}
        </Card>

        {/* Step 3: Interactive Slots Grid */}
        <Card title="3. Choose Time Slot" subtitle="Live availability derived from doctor shift hours" style={{ marginBottom: '20px' }}>
          {loadingSlots ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
              <Clock size={28} className="spinner" style={{ margin: '0 auto 8px' }} />
              <p>Calculating real-time doctor slots...</p>
            </div>
          ) : !availability || availability.isOffDuty ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px' }}>
              <AlertCircle size={28} style={{ margin: '0 auto 8px' }} />
              <strong>{availability?.message || 'Doctor has no scheduled working hours on this date.'}</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Please select another day or choose an on-duty doctor.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                  Working Hours: <strong>{availability.workingHours}</strong>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#00d2b4' }} /> Available
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#475569' }} /> Booked
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f59e0b' }} /> Break / Past
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                {availability.slots.map((slot, idx) => {
                  const isSelected = selectedTime === slot.time;
                  const isAvailable = slot.status === 'Available';

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedTime(slot.time)}
                      title={`${slot.time} - ${slot.reason}`}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        border: isSelected
                          ? '2px solid #00d2b4'
                          : isAvailable
                          ? '1px solid rgba(0, 210, 180, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSelected
                          ? 'linear-gradient(135deg, #00d2b4, #0f7c7a)'
                          : isAvailable
                          ? 'rgba(0, 210, 180, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected
                          ? '#ffffff'
                          : isAvailable
                          ? '#00d2b4'
                          : '#64748b',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>

              {selectedTime && (
                <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0, 210, 180, 0.1)', color: '#00d2b4', fontSize: '0.88rem', fontWeight: '600' }}>
                  ✓ Selected Slot: {selectedDate} at {selectedTime}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Step 4: Visit Details */}
        <Card title="4. Visit Type & Chief Complaint" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label className="med-form-label">Appointment / Visit Type</label>
              <select
                className="med-form-select"
                style={{ width: '100%' }}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="General">General Consultation</option>
                <option value="Follow-up">Follow-up Visit</option>
                <option value="Routine">Routine Checkup</option>
                <option value="Specialist">Specialist Review</option>
                <option value="Emergency">Urgent / Walk-In</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="med-form-label">Chief Complaint / Reason for Booking</label>
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%' }}
                placeholder="e.g. Chest pain follow-up, BP check, fever since 2 days"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button type="button" variant="outline" onClick={() => navigate('/app/receptionist/appointments')}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={booking || !selectedTime || !selectedPatientId}
          >
            <CalendarPlus size={16} style={{ marginRight: '6px' }} />
            {booking ? 'Confirming Booking...' : 'Confirm Appointment Booking'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReceptionistAppointmentBookPage;
