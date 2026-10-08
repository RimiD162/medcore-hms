import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Pill,
  Calendar,
  User,
  Stethoscope,
  Search,
  Filter,
  ChevronRight,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Printer,
  Sparkles,
  Info,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientPrescriptionsPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const fetchPrescriptions = async (status = 'ALL', page = 1) => {
    try {
      setLoading(true);
      const res = await patientApi.getPrescriptions({
        status: status === 'ALL' ? undefined : status,
        page,
        limit: 10,
      });
      if (res.data) {
        setPrescriptions(res.data.prescriptions || []);
        setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load prescriptions', err);
      if (onShowToast) onShowToast('Failed to fetch digital prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions(statusFilter, 1);
  }, []);

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    fetchPrescriptions(status, 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <Pill size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
              Digital E-Prescriptions
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            Access authorized doctor prescriptions, active medication schedules, dosage instructions, and dispensing tokens.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(5, 150, 105, 0.08)',
          border: '1px solid rgba(5, 150, 105, 0.2)',
          padding: '0.4rem 0.8rem',
          borderRadius: 10,
          fontSize: '0.8rem',
          color: '#059669',
          fontWeight: 600,
        }}>
          <ShieldCheck size={16} />
          <span>Doctor E-Signed & Verified</span>
        </div>
      </div>

      {/* ── Status Filter Bar ───────────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 14,
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
            Filter Prescriptions:
          </span>
          {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => {
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusChange(st)}
                style={{
                  background: isSelected ? '#059669' : 'var(--pill-bg, #f1f5f9)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary, #475569)',
                  border: isSelected ? '1px solid #059669' : '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 20,
                  padding: '0.25rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {st === 'ALL' ? 'All Records' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
          Showing <strong>{prescriptions.length}</strong> prescription{prescriptions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Prescriptions List ──────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 150,
              borderRadius: 14,
              backgroundColor: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              animation: 'pulse 1.5s infinite',
            }} />
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px dashed var(--border-color, #cbd5e1)',
          borderRadius: 16,
          padding: '3.5rem 2rem',
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
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669',
          }}>
            <Pill size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
            No Prescriptions Found
          </h3>
          <p style={{ margin: 0, maxWidth: 440, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            {statusFilter !== 'ALL'
              ? `You do not have any ${statusFilter.toLowerCase()} prescriptions. Try switching to 'All Records'.`
              : 'You do not have any active or past e-prescriptions on record. Doctor prescriptions issued during visits will appear here.'}
          </p>
          {statusFilter !== 'ALL' && (
            <button
              onClick={() => handleStatusChange('ALL')}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #059669',
                color: '#059669',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              Show All Prescriptions
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {prescriptions.map((rx) => {
            const rxDateFormatted = rx.date ? new Date(rx.date).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) : 'Recorded Prescription';

            const isActive = rx.status === 'ACTIVE';

            return (
              <div
                key={rx.id}
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  border: isActive ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 14,
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.1rem',
                  boxShadow: isActive ? '0 4px 12px -2px rgba(5, 150, 105, 0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Header: RX Number, Status, Doctor, Date */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: isActive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                      color: isActive ? '#059669' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Pill size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary, #0f172a)' }}>
                          {rx.prescriptionNumber || `RX-${rx.id?.substring(0, 8).toUpperCase()}`}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: 20,
                          backgroundColor: isActive ? 'rgba(5, 150, 105, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          color: isActive ? '#059669' : '#64748b',
                          textTransform: 'uppercase',
                        }}>
                          {rx.status || 'ACTIVE'}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary, #64748b)',
                        marginTop: '0.2rem',
                        flexWrap: 'wrap',
                      }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary, #334155)' }}>
                          {rx.doctorName ? `Dr. ${rx.doctorName.replace(/^Dr\.\s*/i, '')}` : 'Physician'}
                        </span>
                        {rx.doctorDepartment && <span>&bull; {rx.doctorDepartment}</span>}
                        <span>&bull; {rxDateFormatted}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/app/patient/prescriptions/${rx.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1rem',
                      borderRadius: 8,
                      backgroundColor: 'rgba(5, 150, 105, 0.08)',
                      color: '#059669',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      border: '1px solid rgba(5, 150, 105, 0.25)',
                    }}
                  >
                    <span>View Prescription Details</span>
                    <ChevronRight size={15} />
                  </Link>
                </div>

                {/* Medication Items List */}
                {rx.items && rx.items.length > 0 && (
                  <div style={{
                    backgroundColor: 'var(--subcard-bg, #f8fafc)',
                    borderRadius: 10,
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border-color, #f1f5f9)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary, #64748b)', letterSpacing: '0.04em' }}>
                      Prescribed Medications ({rx.items.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.6rem' }}>
                      {rx.items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            padding: '0.6rem 0.8rem',
                            borderRadius: 8,
                            backgroundColor: 'var(--card-bg, #ffffff)',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary, #0f172a)' }}>
                              {item.medicineName}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #64748b)' }}>
                              {item.dosage} &bull; {item.frequency || 'As Directed'}
                            </div>
                          </div>
                          {item.duration && (
                            <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600, backgroundColor: 'rgba(5, 150, 105, 0.08)', padding: '0.15rem 0.45rem', borderRadius: 4 }}>
                              {item.duration}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer notes */}
                {rx.generalInstructions && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Info size={14} color="#059669" />
                    <span>Instructions: <strong>{rx.generalInstructions}</strong></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchPrescriptions(statusFilter, pagination.page - 1)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 8,
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--card-bg, #fff)',
              cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
              opacity: pagination.page <= 1 ? 0.5 : 1,
              fontSize: '0.82rem',
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)' }}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => fetchPrescriptions(statusFilter, pagination.page + 1)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 8,
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--card-bg, #fff)',
              cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
              opacity: pagination.page >= pagination.pages ? 0.5 : 1,
              fontSize: '0.82rem',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptionsPage;
