import React, { useState } from 'react';
import {
  X,
  User,
  Calendar,
  FileText,
  TestTube,
  Download,
  CreditCard,
  PhoneCall,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const PatientPortalModal = ({ onClose, onShowToast }) => {
  const [activeTab, setActiveTab] = useState('appointments');

  const patientInfo = {
    name: 'Sarah Miller',
    uhid: 'MC-849201',
    bloodGroup: 'O+ Positive',
    ageGender: '28 Yrs / Female',
    emergencyContact: '+1 (555) 389-2910',
  };

  const appointments = [
    {
      doctor: 'Dr. David Chen, MD',
      specialty: 'Cardiology & Internal Medicine',
      date: 'Tomorrow, Oct 1, 2026',
      time: '10:30 AM',
      room: 'OPD Suite 204',
      status: 'Confirmed',
    },
    {
      doctor: 'Dr. Elena Rostova',
      specialty: 'General Health & Pulmonology',
      date: 'Oct 14, 2026',
      time: '02:15 PM',
      room: 'OPD Suite 108',
      status: 'Upcoming',
    },
  ];

  const prescriptions = [
    {
      id: 'RX-7712',
      doctor: 'Dr. David Chen',
      date: 'Sep 24, 2026',
      meds: [
        { name: 'Atorvastatin 10mg', dose: '1 tab at bedtime (30 days)' },
        { name: 'Aspirin 81mg', dose: '1 tab with morning breakfast' },
      ],
      pharmacyStatus: 'Ready for Pickup at Pharmacy Counter #2',
    },
  ];

  const labReports = [
    {
      id: 'LAB-904',
      testName: 'Comprehensive Metabolic & Lipid Panel',
      orderedBy: 'Dr. David Chen',
      date: 'Sep 25, 2026',
      status: 'Normal / Verified',
    },
    {
      id: 'LAB-891',
      testName: 'Complete Blood Count (CBC) with Differential',
      orderedBy: 'Dr. Elena Rostova',
      date: 'Sep 12, 2026',
      status: 'Normal / Verified',
    },
  ];

  const handleAction = (actionName) => {
    onShowToast(`Patient Portal: "${actionName}" processed successfully.`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="patient-portal-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ background: 'rgba(7, 26, 44, 0.96)' }}>
          <div className="modal-header-left">
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <User size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="modal-header-title">{patientInfo.name}</h2>
                <span style={{
                  background: 'rgba(2, 132, 199, 0.2)',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  border: '1px solid rgba(2, 132, 199, 0.4)',
                }}>
                  UHID: {patientInfo.uhid}
                </span>
              </div>
              <p className="modal-header-subtitle">
                {patientInfo.ageGender} &bull; Blood: {patientInfo.bloodGroup} &bull; MedCore Patient Vault
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '16px 28px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(6, 20, 34, 0.6)',
        }}>
          {[
            { id: 'appointments', label: 'My Appointments', icon: Calendar },
            { id: 'prescriptions', label: 'Active Prescriptions', icon: FileText },
            { id: 'labs', label: 'Lab & Diagnostic Reports', icon: TestTube },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  borderBottom: isActive ? '2.5px solid #0284c7' : '2.5px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <TabIcon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="modal-body" style={{ background: '#091c2c' }}>
          {activeTab === 'appointments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>
                  Scheduled Consultations ({appointments.length})
                </span>
                <button
                  onClick={() => handleAction('Book New Appointment Slot')}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  + Book New Appointment
                </button>
              </div>

              {appointments.map((apt, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(6, 20, 32, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: '700' }}>{apt.doctor}</h4>
                    <p style={{ fontSize: '0.82rem', color: '#38bdf8', marginBottom: '6px' }}>{apt.specialty}</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {apt.date} at {apt.time}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} /> {apt.room}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAction(`Join Video Teleconsult with ${apt.doctor}`)}
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Teleconsult Room
                    </button>
                    <button
                      onClick={() => handleAction(`Reschedule Appointment with ${apt.doctor}`)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {prescriptions.map((rx, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(6, 20, 32, 0.8)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '14px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10b981' }}>{rx.id}</span>
                      <h4 style={{ fontSize: '1rem', color: '#fff' }}>Prescribed by {rx.doctor} &bull; {rx.date}</h4>
                    </div>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                    }}>
                      {rx.pharmacyStatus}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    {rx.meds.map((m, mIdx) => (
                      <div key={mIdx} style={{ fontSize: '0.84rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{m.name}</strong>
                        <span style={{ color: '#94a3b8' }}>{m.dose}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleAction('Pharmacy Pickup Token Requested')}
                    style={{
                      background: '#10b981',
                      color: '#041926',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Request Pharmacy Fast-Pickup Token
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'labs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {labReports.map((lab, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(6, 20, 32, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>{lab.testName}</h4>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Ordered by {lab.orderedBy} &bull; {lab.date} &bull; <span style={{ color: '#34d399', fontWeight: '700' }}>{lab.status}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleAction(`Downloaded ${lab.testName} Official PDF Report`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientPortalModal;
