import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  FileText,
  Pill,
  Microscope,
  CreditCard,
  History,
  ShieldCheck,
  FolderLock,
  ArrowRight,
  Clock,
  MapPin,
  Stethoscope,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  User,
  Heart,
  TrendingUp,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientDashboardPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await patientApi.getDashboard();
        if (res.data) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: 140, borderRadius: 16, backgroundColor: 'rgba(2, 132, 199, 0.08)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 110, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.04)' }} />
          ))}
        </div>
      </div>
    );
  }

  const profile = data?.profile || {};
  const metrics = data?.metrics || {};
  const nextAppointment = data?.nextAppointment;

  return (
    <div className="patient-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* ── 1. Hero Welcome & Health ID Banner ────────────────────────── */}
      <div style={{
        borderRadius: 20,
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #0f172a 100%)',
        color: '#ffffff',
        padding: '1.75rem 2rem',
        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Welcome back, {profile.fullName || 'Patient'}
            </h1>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              padding: '0.2rem 0.6rem',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              {profile.patientIdNumber || 'ID: Active'}
            </span>
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', margin: 0, maxWidth: 540, lineHeight: 1.4 }}>
            Access verified diagnostic reports, active medication regimens, scheduled outpatient consultations, and itemized billing statements.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.9)' }}>
            {profile.bloodGroup && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>Blood:</span>
                <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 700 }}>
                  {profile.bloodGroup}
                </span>
              </div>
            )}
            {profile.age && (
              <div>
                <span style={{ fontWeight: 600 }}>Age:</span> {profile.age} yrs ({profile.gender})
              </div>
            )}
            {profile.allergies && profile.allergies.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>Allergies:</span>
                <span style={{ color: '#fef08a' }}>{profile.allergies.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
              fontSize: '0.85rem',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '0.65rem 1.15rem',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            <Pill size={16} />
            <span>My Meds</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Stat Metric Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Upcoming Appointments */}
        <Link
          to="/app/patient/appointments"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '1.25rem',
            borderRadius: 16,
            border: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
            transition: 'transform 0.18s, box-shadow 0.18s',
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'rgba(2, 132, 199, 0.12)',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>{metrics.upcomingAppointmentsCount || 0}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Upcoming Visits</div>
          </div>
        </Link>

        {/* Active Prescriptions */}
        <Link
          to="/app/patient/prescriptions"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '1.25rem',
            borderRadius: 16,
            border: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Pill size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>{metrics.activePrescriptionsCount || 0}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Active Prescriptions</div>
          </div>
        </Link>

        {/* Released Lab Results */}
        <Link
          to="/app/patient/lab-reports"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '1.25rem',
            borderRadius: 16,
            border: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Microscope size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>{metrics.releasedLabReportsCount || 0}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Diagnostic Reports</div>
          </div>
        </Link>

        {/* Hospital Balance */}
        <Link
          to="/app/patient/billing"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            padding: '1.25rem',
            borderRadius: 16,
            border: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: metrics.totalOutstandingAmount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: metrics.totalOutstandingAmount > 0 ? '#ef4444' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>
              ₹{Number(metrics.totalOutstandingAmount || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
              {metrics.totalOutstandingAmount > 0 ? 'Outstanding Balance' : 'Account Settled'}
            </div>
          </div>
        </Link>
      </div>

      {/* ── 3. Next Upcoming Appointment (if any) ───────────────────── */}
      {nextAppointment && (
        <div style={{
          padding: '1.5rem',
          borderRadius: 18,
          border: '1px solid rgba(2, 132, 199, 0.25)',
          backgroundColor: 'rgba(2, 132, 199, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              lineHeight: 1,
            }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                {new Date(nextAppointment.appointmentDate).toLocaleString('default', { month: 'short' })}
              </span>
              <span style={{ fontSize: '1.25rem' }}>
                {new Date(nextAppointment.appointmentDate).getDate()}
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  Next Visit: Dr. {nextAppointment.doctor?.name || 'Physician'}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                  borderRadius: 6,
                  backgroundColor: nextAppointment.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: nextAppointment.status === 'CONFIRMED' ? '#059669' : '#d97706',
                }}>
                  {nextAppointment.status}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={14} />
                  <span>{nextAppointment.appointmentTime} ({nextAppointment.type})</span>
                </div>
                {nextAppointment.doctor?.department && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} />
                    <span>{nextAppointment.doctor.department} {nextAppointment.doctor.roomNumber ? `• Room ${nextAppointment.doctor.roomNumber}` : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              to={`/app/patient/appointments/${nextAppointment.id}`}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 600,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                textDecoration: 'none',
              }}
            >
              View Details
            </Link>
          </div>
        </div>
      )}

      {/* ── 4. Main Two-Column Content Grid ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        
        {/* Left Column: Recent Consultations & Prescriptions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Recent Medical Records */}
          <div style={{
            padding: '1.5rem',
            borderRadius: 18,
            border: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#0284c7" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Recent Medical Records</h3>
              </div>
              <Link to="/app/patient/medical-records" style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                View All →
              </Link>
            </div>

            {(!data?.recentMedicalRecords || data.recentMedicalRecords.length === 0) ? (
              <div style={{ padding: '1.5rem 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No completed clinical visit records available yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.recentMedicalRecords.map((rec) => (
                  <Link
                    key={rec.id}
                    to={`/app/patient/medical-records/${rec.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem',
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,0.05)',
                      backgroundColor: 'rgba(0,0,0,0.015)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{rec.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {new Date(rec.visitDate).toLocaleDateString()} • Dr. {rec.doctor?.name || 'Attending Physician'}
                      </div>
                      {rec.diagnosis && (
                        <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 500, marginTop: '0.2rem' }}>
                          Diagnosis: {rec.diagnosis}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={18} color="#94a3b8" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Active Prescriptions */}
          <div style={{
            padding: '1.5rem',
            borderRadius: 18,
            border: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pill size={18} color="#10b981" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Active Medications</h3>
              </div>
              <Link to="/app/patient/prescriptions" style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                View All →
              </Link>
            </div>

            {(!data?.recentPrescriptions || data.recentPrescriptions.length === 0) ? (
              <div style={{ padding: '1.5rem 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No active prescriptions recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.recentPrescriptions.map((rx) => (
                  <Link
                    key={rx.id}
                    to={`/app/patient/prescriptions/${rx.id}`}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,0.05)',
                      backgroundColor: 'rgba(0,0,0,0.015)',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'block',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>#{rx.prescriptionNumber}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                        {rx.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Prescribed by Dr. {rx.doctor?.name || 'Physician'} on {new Date(rx.prescribedDate).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155', marginTop: '0.4rem' }}>
                      {rx.items?.map((i) => `${i.medicineName} (${i.dosage})`).join(', ')}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Lab Reports & Billing Statements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Released Lab Reports */}
          <div style={{
            padding: '1.5rem',
            borderRadius: 18,
            border: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Microscope size={18} color="#8b5cf6" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Released Lab Reports</h3>
              </div>
              <Link to="/app/patient/lab-reports" style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                View All →
              </Link>
            </div>

            {(!data?.recentLabReports || data.recentLabReports.length === 0) ? (
              <div style={{ padding: '1.5rem 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No released diagnostic laboratory reports found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.recentLabReports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/app/patient/lab-reports/${report.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem',
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,0.05)',
                      backgroundColor: 'rgba(0,0,0,0.015)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{report.testName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Released on {new Date(report.releasedAt).toLocaleDateString()} • Report #{report.reportNumber}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#8b5cf6',
                      backgroundColor: 'rgba(139, 92, 246, 0.12)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 6,
                    }}>
                      {report.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invoices & Billing */}
          <div style={{
            padding: '1.5rem',
            borderRadius: 18,
            border: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: 'var(--bg-surface, #ffffff)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} color="#0284c7" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Recent Invoices & Bills</h3>
              </div>
              <Link to="/app/patient/billing" style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                View All Bills →
              </Link>
            </div>

            {(!data?.recentInvoices || data.recentInvoices.length === 0) ? (
              <div style={{ padding: '1.5rem 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No hospital invoices generated for this account.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.recentInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    to={`/app/patient/invoices/${inv.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem',
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,0.05)',
                      backgroundColor: 'rgba(0,0,0,0.015)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>#{inv.invoiceNumber} ({inv.type})</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Date: {new Date(inv.invoiceDate).toLocaleDateString()} • Total: ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: inv.status === 'PAID' ? '#10b981' : '#ef4444',
                        backgroundColor: inv.status === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 6,
                      }}>
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
