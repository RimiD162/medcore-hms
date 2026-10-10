import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  FileText,
  Pill,
  Microscope,
  CreditCard,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientDashboardPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await patientApi.getDashboard();
        if (res.data) setData(res.data);
      } catch {
        // leave data null
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="pp-skeleton" style={{ height: 148, borderRadius: 22 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="pp-skeleton" style={{ height: 96 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: '1.5rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="pp-skeleton" style={{ height: 220, borderRadius: 18 }} />
          ))}
        </div>
      </div>
    );
  }

  const profile = data?.profile || {};
  const metrics = data?.metrics || {};
  const nextAppointment = data?.nextAppointment;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── 1. Welcome Hero Banner ─────────────────────────────── */}
      <div className="pp-welcome-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: '#fff' }}>
              Welcome back, {profile.fullName || 'Patient'}
            </h1>
            {profile.patientIdNumber && (
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                padding: '0.2rem 0.65rem',
                borderRadius: 20,
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#fff',
              }}>
                {profile.patientIdNumber}
              </span>
            )}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem', margin: 0, maxWidth: 520, lineHeight: 1.5 }}>
            Access your verified diagnostic reports, active medications, scheduled consultations, and billing statements.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', flexWrap: 'wrap' }}>
            {profile.bloodGroup && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>Blood:</span>
                <span style={{ backgroundColor: 'rgba(239,68,68,0.28)', padding: '0.1rem 0.45rem', borderRadius: 5, fontWeight: 700 }}>
                  {profile.bloodGroup}
                </span>
              </div>
            )}
            {profile.age && (
              <div>
                <span style={{ fontWeight: 600 }}>Age:</span> {profile.age} yrs ({profile.gender})
              </div>
            )}
            {profile.allergies?.length > 0 && (
              <div>
                <span style={{ fontWeight: 600 }}>Allergies: </span>
                <span style={{ color: '#fef08a' }}>{profile.allergies.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <Link
            to="/app/patient/appointments/book"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#ffffff',
              color: '#0284c7',
              padding: '0.65rem 1.15rem',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.84rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              transition: 'transform 0.18s, box-shadow 0.18s',
            }}
          >
            <CalendarPlus size={16} />
            <span>Book Appointment</span>
          </Link>
          <Link
            to="/app/patient/prescriptions"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '0.65rem 1.15rem',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: '0.84rem',
              textDecoration: 'none',
              transition: 'background 0.18s',
            }}
          >
            <Pill size={16} />
            <span>My Meds</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Stat Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '1rem' }}>
        <Link to="/app/patient/appointments" className="pp-stat-card">
          <div className="pp-stat-icon-wrap" style={{ backgroundColor: 'rgba(2,132,199,0.12)', color: '#0284c7' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="pp-stat-value">{metrics.upcomingAppointmentsCount || 0}</div>
            <div className="pp-stat-label">Upcoming Visits</div>
          </div>
        </Link>

        <Link to="/app/patient/prescriptions" className="pp-stat-card">
          <div className="pp-stat-icon-wrap" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <Pill size={24} />
          </div>
          <div>
            <div className="pp-stat-value">{metrics.activePrescriptionsCount || 0}</div>
            <div className="pp-stat-label">Active Prescriptions</div>
          </div>
        </Link>

        <Link to="/app/patient/lab-reports" className="pp-stat-card">
          <div className="pp-stat-icon-wrap" style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            <Microscope size={24} />
          </div>
          <div>
            <div className="pp-stat-value">{metrics.releasedLabReportsCount || 0}</div>
            <div className="pp-stat-label">Diagnostic Reports</div>
          </div>
        </Link>

        <Link to="/app/patient/billing" className="pp-stat-card">
          <div className="pp-stat-icon-wrap" style={{
            backgroundColor: metrics.totalOutstandingAmount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            color: metrics.totalOutstandingAmount > 0 ? '#ef4444' : '#10b981',
          }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div className="pp-stat-value">
              ₹{Number(metrics.totalOutstandingAmount || 0).toLocaleString('en-IN')}
            </div>
            <div className="pp-stat-label">
              {metrics.totalOutstandingAmount > 0 ? 'Outstanding Balance' : 'Account Settled'}
            </div>
          </div>
        </Link>
      </div>

      {/* ── 3. Next Appointment Banner ─────────────────────────── */}
      {nextAppointment && (
        <div className="pp-apt-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="pp-apt-date-badge">
              <span style={{ fontSize: '0.62rem', textTransform: 'uppercase' }}>
                {new Date(nextAppointment.appointmentDate).toLocaleString('default', { month: 'short' })}
              </span>
              <span style={{ fontSize: '1.3rem' }}>
                {new Date(nextAppointment.appointmentDate).getDate()}
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--pp-text-primary)' }}>
                  Next Visit: Dr. {nextAppointment.doctor?.name || 'Physician'}
                </span>
                <span className={`pp-badge ${nextAppointment.status === 'CONFIRMED' ? 'pp-badge-green' : 'pp-badge-yellow'}`}>
                  {nextAppointment.status}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: 'var(--pp-text-muted)', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} />
                  <span>{nextAppointment.appointmentTime} ({nextAppointment.type})</span>
                </div>
                {nextAppointment.doctor?.department && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={13} />
                    <span>{nextAppointment.doctor.department}{nextAppointment.doctor.roomNumber ? ` · Room ${nextAppointment.doctor.roomNumber}` : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Link
            to={`/app/patient/appointments/${nextAppointment.id}`}
            className="pp-btn-primary"
          >
            View Details
          </Link>
        </div>
      )}

      {/* ── 4. Two-Column Content Grid ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: '1.5rem' }}>

        {/* Left Col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Recent Medical Records */}
          <div className="pp-card">
            <div className="pp-card-header">
              <div className="pp-card-title-wrap">
                <FileText size={18} color="#0284c7" />
                <h3 className="pp-card-title">Recent Medical Records</h3>
              </div>
              <Link to="/app/patient/medical-records" className="pp-card-link">View All →</Link>
            </div>

            {(!data?.recentMedicalRecords || data.recentMedicalRecords.length === 0) ? (
              <div className="pp-empty-state">No completed clinical visit records yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {data.recentMedicalRecords.map((rec) => (
                  <Link key={rec.id} to={`/app/patient/medical-records/${rec.id}`} className="pp-list-item">
                    <div>
                      <div className="pp-list-item-title">{rec.title}</div>
                      <div className="pp-list-item-sub">
                        {new Date(rec.visitDate).toLocaleDateString()} · Dr. {rec.doctor?.name || 'Attending Physician'}
                      </div>
                      {rec.diagnosis && (
                        <div className="pp-list-item-accent">Diagnosis: {rec.diagnosis}</div>
                      )}
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--pp-text-dim)', flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Active Prescriptions */}
          <div className="pp-card">
            <div className="pp-card-header">
              <div className="pp-card-title-wrap">
                <Pill size={18} color="#10b981" />
                <h3 className="pp-card-title">Active Medications</h3>
              </div>
              <Link to="/app/patient/prescriptions" className="pp-card-link">View All →</Link>
            </div>

            {(!data?.recentPrescriptions || data.recentPrescriptions.length === 0) ? (
              <div className="pp-empty-state">No active prescriptions recorded.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {data.recentPrescriptions.map((rx) => (
                  <Link key={rx.id} to={`/app/patient/prescriptions/${rx.id}`} className="pp-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="pp-list-item-title">#{rx.prescriptionNumber}</span>
                      <span className="pp-badge pp-badge-green">{rx.status}</span>
                    </div>
                    <div className="pp-list-item-sub">
                      Prescribed by Dr. {rx.doctor?.name || 'Physician'} on {new Date(rx.prescribedDate).toLocaleDateString()}
                    </div>
                    {rx.items?.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--pp-text-secondary)', marginTop: '0.3rem' }}>
                        {rx.items.map((i) => `${i.medicineName} (${i.dosage})`).join(', ')}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Released Lab Reports */}
          <div className="pp-card">
            <div className="pp-card-header">
              <div className="pp-card-title-wrap">
                <Microscope size={18} color="#8b5cf6" />
                <h3 className="pp-card-title">Released Lab Reports</h3>
              </div>
              <Link to="/app/patient/lab-reports" className="pp-card-link">View All →</Link>
            </div>

            {(!data?.recentLabReports || data.recentLabReports.length === 0) ? (
              <div className="pp-empty-state">No released laboratory reports found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {data.recentLabReports.map((report) => (
                  <Link key={report.id} to={`/app/patient/lab-reports/${report.id}`} className="pp-list-item">
                    <div>
                      <div className="pp-list-item-title">{report.testName}</div>
                      <div className="pp-list-item-sub">
                        Released {new Date(report.releasedAt).toLocaleDateString()} · #{report.reportNumber}
                      </div>
                    </div>
                    <span className="pp-badge pp-badge-purple">{report.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="pp-card">
            <div className="pp-card-header">
              <div className="pp-card-title-wrap">
                <CreditCard size={18} color="#0284c7" />
                <h3 className="pp-card-title">Recent Invoices &amp; Bills</h3>
              </div>
              <Link to="/app/patient/billing" className="pp-card-link">View All Bills →</Link>
            </div>

            {(!data?.recentInvoices || data.recentInvoices.length === 0) ? (
              <div className="pp-empty-state">No hospital invoices generated for this account.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {data.recentInvoices.map((inv) => (
                  <Link key={inv.id} to={`/app/patient/billing/${inv.id}`} className="pp-list-item">
                    <div>
                      <div className="pp-list-item-title">#{inv.invoiceNumber} ({inv.type})</div>
                      <div className="pp-list-item-sub">
                        {new Date(inv.invoiceDate).toLocaleDateString()} · ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className={`pp-badge ${inv.status === 'PAID' ? 'pp-badge-green' : 'pp-badge-red'}`}>
                        {inv.status}
                      </span>
                      {inv.outstandingAmount > 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600, marginTop: '0.2rem' }}>
                          Due: ₹{inv.outstandingAmount.toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboardPage;
