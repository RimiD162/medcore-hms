import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  MapPin,
  CalendarPlus,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientAppointmentBookPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  
  // Form State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Tomorrow by default
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('General');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Fetch Active Doctors
  useEffect(() => {
    async function loadDoctors() {
      try {
        setLoadingDoctors(true);
        const res = await patientApi.getDoctors();
        if (res.data) {
          setDoctors(res.data);
        }
      } catch (err) {
        if (onShowToast) onShowToast(err.message || 'Failed to load doctors');
      } finally {
        setLoadingDoctors(false);
      }
    }
    loadDoctors();
  }, []);

  // 2. Fetch Availability Slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;

    async function loadSlots() {
      try {
        setLoadingSlots(true);
        setErrorMsg(null);
        setSelectedTime('');
        const res = await patientApi.getDoctorAvailability(selectedDoctor.id, selectedDate);
        if (res.data) {
          setAvailability(res.data);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Unable to fetch availability slots for this date');
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [selectedDoctor, selectedDate]);

  const departments = ['ALL', ...new Set(doctors.map((d) => d.department).filter(Boolean))];
  const filteredDoctors = selectedDepartment === 'ALL'
    ? doctors
    : doctors.filter((d) => d.department === selectedDepartment);

  const handleFinalBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    try {
      setBooking(true);
      setErrorMsg(null);
      const res = await patientApi.bookAppointment({
        doctorId: selectedDoctor.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        type: appointmentType,
        reason: reason.trim() || null,
      });

      if (onShowToast) onShowToast('Appointment booked successfully!');
      navigate(`/app/patient/appointments/${res.data.id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Breadcrumb & Header ────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#64748b', marginBottom: '0.4rem' }}>
          <Link to="/app/patient/appointments" style={{ color: 'inherit', textDecoration: 'none' }}>Appointments</Link>
          <ChevronRight size={14} />
          <span style={{ color: '#0284c7', fontWeight: 600 }}>Book Consultation</span>
        </div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>Book a Doctor Appointment</h1>
      </div>

      {/* ── Step Progress Indicator ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderRadius: 14,
        backgroundColor: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
      }}>
        {[
          { num: 1, title: 'Select Physician' },
          { num: 2, title: 'Choose Slot' },
          { num: 3, title: 'Visit Details' },
          { num: 4, title: 'Confirmation' },
        ].map((s, idx) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: step >= s.num ? '#0284c7' : 'rgba(0,0,0,0.06)',
              color: step >= s.num ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}>
              {step > s.num ? <CheckCircle2 size={16} /> : s.num}
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: step === s.num ? 700 : 500, color: step === s.num ? 'inherit' : '#94a3b8' }}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div style={{
          padding: '1rem',
          borderRadius: 12,
          backgroundColor: '#fef2f2',
          border: '1px solid #fee2e2',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.88rem',
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Step 1: Select Physician ────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Department Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: selectedDepartment === dept ? 700 : 500,
                  backgroundColor: selectedDepartment === dept ? '#0284c7' : 'rgba(0,0,0,0.04)',
                  color: selectedDepartment === dept ? '#ffffff' : 'inherit',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {dept === 'ALL' ? 'All Specialties' : dept}
              </button>
            ))}
          </div>

          {/* Doctor Cards Grid */}
          {loadingDoctors ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading physicians...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {filteredDoctors.map((doc) => {
                const isSelected = selectedDoctor?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 16,
                      backgroundColor: 'var(--bg-surface, #ffffff)',
                      border: `2px solid ${isSelected ? '#0284c7' : 'var(--border-subtle, #e2e8f0)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: 'rgba(2, 132, 199, 0.1)',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                      }}>
                        <Stethoscope size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Dr. {doc.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>{doc.specialization}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      <div>Department: {doc.department}</div>
                      {doc.roomNumber && <div>Room: {doc.roomNumber}</div>}
                      <div style={{ marginTop: '0.2rem', fontWeight: 600, color: '#334155' }}>
                        Fee: ₹{doc.consultationFee}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedDoctor}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                borderRadius: 8,
                fontSize: '0.88rem',
                fontWeight: 700,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                cursor: selectedDoctor ? 'pointer' : 'not-allowed',
                opacity: selectedDoctor ? 1 : 0.5,
              }}
            >
              <span>Continue to Schedule</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Pick Date & Time Slot ───────────────────────────── */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            padding: '1.25rem',
            borderRadius: 16,
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Selected Physician:</span>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Dr. {selectedDoctor?.name} ({selectedDoctor?.specialization})</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Select Appointment Date
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Slots View */}
          <div style={{
            padding: '1.5rem',
            borderRadius: 18,
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
              Available Time Slots for {new Date(selectedDate).toLocaleDateString()}
            </h3>

            {loadingSlots ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Checking physician schedule...</div>
            ) : availability?.isOffDuty ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                Dr. {selectedDoctor?.name} is not on duty on this day. Please select a different date.
              </div>
            ) : availability?.slots?.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No available time slots remaining on this date. Please try another day.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.65rem' }}>
                {availability?.slots?.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: 10,
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 800 : 600,
                        backgroundColor: isSelected ? '#0284c7' : 'rgba(2, 132, 199, 0.06)',
                        color: isSelected ? '#ffffff' : '#0284c7',
                        border: `1px solid ${isSelected ? '#0284c7' : 'rgba(2, 132, 199, 0.2)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.2rem',
                borderRadius: 8,
                fontSize: '0.88rem',
                border: '1px solid #cbd5e1',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep(3)}
              disabled={!selectedTime}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                borderRadius: 8,
                fontSize: '0.88rem',
                fontWeight: 700,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                cursor: selectedTime ? 'pointer' : 'not-allowed',
                opacity: selectedTime ? 1 : 0.5,
              }}
            >
              <span>Continue to Visit Details</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Visit Details ────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            padding: '1.75rem',
            borderRadius: 18,
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Consultation Type
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {['General', 'Follow-up', 'Routine', 'Specialist'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAppointmentType(t)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 8,
                      fontSize: '0.85rem',
                      fontWeight: appointmentType === t ? 700 : 500,
                      backgroundColor: appointmentType === t ? '#0284c7' : 'rgba(0,0,0,0.04)',
                      color: appointmentType === t ? '#ffffff' : 'inherit',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Reason for Consultation / Symptoms (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for scheduling this visit..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button
              onClick={() => setStep(2)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.2rem',
                borderRadius: 8,
                fontSize: '0.88rem',
                border: '1px solid #cbd5e1',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep(4)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                borderRadius: 8,
                fontSize: '0.88rem',
                fontWeight: 700,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>Review Booking</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Summary & Confirmation ───────────────────────────── */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            padding: '2rem',
            borderRadius: 18,
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Review Consultation Details</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', padding: '1.25rem', borderRadius: 12, backgroundColor: 'rgba(2, 132, 199, 0.04)', border: '1px solid rgba(2, 132, 199, 0.15)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Physician</span>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Dr. {selectedDoctor?.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#0284c7' }}>{selectedDoctor?.department}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Date & Time</span>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{new Date(selectedDate).toLocaleDateString()}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedTime} ({appointmentType})</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Consultation Fee</span>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#059669' }}>₹{selectedDoctor?.consultationFee}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Payable at front desk / online</div>
              </div>
            </div>

            {reason && (
              <div style={{ fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 600 }}>Reason: </span>
                <span>{reason}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button
              onClick={() => setStep(3)}
              disabled={booking}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.2rem',
                borderRadius: 8,
                fontSize: '0.88rem',
                border: '1px solid #cbd5e1',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>

            <button
              onClick={handleFinalBooking}
              disabled={booking}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.75rem',
                borderRadius: 10,
                fontSize: '0.92rem',
                fontWeight: 800,
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                cursor: booking ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <CalendarPlus size={18} />
              <span>{booking ? 'Confirming Appointment...' : 'Confirm Appointment'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointmentBookPage;
