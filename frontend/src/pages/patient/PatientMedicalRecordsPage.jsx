import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  User,
  Stethoscope,
  Search,
  Filter,
  ChevronRight,
  Activity,
  Heart,
  Pill,
  Microscope,
  FileCheck,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientMedicalRecordsPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const fetchRecords = async (searchTerm = '', dept = '', page = 1) => {
    try {
      setLoading(true);
      const res = await patientApi.getMedicalRecords({
        search: searchTerm,
        department: dept,
        page,
        limit: 10,
      });
      if (res.data) {
        setRecords(res.data.records || []);
        setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load medical records', err);
      if (onShowToast) onShowToast('Failed to fetch clinical visit summaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(search, selectedDept, 1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords(search, selectedDept, 1);
  };

  const handleDeptFilter = (dept) => {
    setSelectedDept(dept);
    fetchRecords(search, dept, 1);
  };

  const departments = ['All', 'Cardiology', 'General Medicine', 'Orthopedics', 'Pediatrics', 'Neurology', 'Pulmonology'];

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
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <FileText size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
              Medical Records & Consultations
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            Review completed physician consultations, diagnoses, vitals snapshots, and clinical treatment summaries.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
          border: '1px solid rgba(2, 132, 199, 0.2)',
          padding: '0.4rem 0.8rem',
          borderRadius: 10,
          fontSize: '0.8rem',
          color: '#0284c7',
          fontWeight: 600,
        }}>
          <ShieldCheck size={16} />
          <span>Patient-Authorized Record Vault</span>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 14,
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            position: 'relative',
            flex: '1 1 280px',
          }}>
            <Search size={18} style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }} />
            <input
              type="text"
              placeholder="Search by diagnosis, doctor name, or symptoms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.4rem',
                borderRadius: 10,
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'var(--input-bg, #f8fafc)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Search Records
          </button>
        </form>

        {/* Department Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
            Specialty:
          </span>
          {departments.map((dept) => {
            const isSelected = dept === 'All' ? selectedDept === '' : selectedDept === dept;
            return (
              <button
                key={dept}
                type="button"
                onClick={() => handleDeptFilter(dept === 'All' ? '' : dept)}
                style={{
                  background: isSelected ? '#0284c7' : 'var(--pill-bg, #f1f5f9)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary, #475569)',
                  border: isSelected ? '1px solid #0284c7' : '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 20,
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {dept}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Records List ────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 140,
              borderRadius: 14,
              backgroundColor: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              animation: 'pulse 1.5s infinite',
            }} />
          ))}
        </div>
      ) : records.length === 0 ? (
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
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
          }}>
            <FileText size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
            No Clinical Medical Records Found
          </h3>
          <p style={{ margin: 0, maxWidth: 440, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            {search || selectedDept
              ? 'No medical records match your current filter parameters. Try clearing the search keyword or selecting All specialties.'
              : 'You do not have any released clinical encounter summaries on record yet. Completed doctor consultations will appear here automatically.'}
          </p>
          {(search || selectedDept) && (
            <button
              onClick={() => { setSearch(''); setSelectedDept(''); fetchRecords('', '', 1); }}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #0284c7',
                color: '#0284c7',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {records.map((rec) => {
            const visitFormatted = rec.visitDate ? new Date(rec.visitDate).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) : 'Recorded Visit';

            return (
              <div
                key={rec.id}
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 14,
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                className="patient-record-card"
              >
                {/* Top Row: Date, Doctor, Specialty, View button */}
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
                      backgroundColor: 'rgba(2, 132, 199, 0.1)',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Stethoscope size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                          {rec.doctorName ? `Dr. ${rec.doctorName.replace(/^Dr\.\s*/i, '')}` : 'Attending Physician'}
                        </h3>
                        {rec.doctorDepartment && (
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 6,
                            backgroundColor: 'rgba(2, 132, 199, 0.1)',
                            color: '#0284c7',
                            fontWeight: 600,
                          }}>
                            {rec.doctorDepartment}
                          </span>
                        )}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary, #64748b)',
                        marginTop: '0.2rem',
                      }}>
                        <Calendar size={13} />
                        <span>{visitFormatted}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/app/patient/medical-records/${rec.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.9rem',
                      borderRadius: 8,
                      backgroundColor: 'rgba(2, 132, 199, 0.08)',
                      color: '#0284c7',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      border: '1px solid rgba(2, 132, 199, 0.2)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>View Full Clinical Record</span>
                    <ChevronRight size={15} />
                  </Link>
                </div>

                {/* Middle Content: Diagnosis & Chief Complaint */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.75rem',
                  backgroundColor: 'var(--subcard-bg, #f8fafc)',
                  borderRadius: 10,
                  padding: '0.85rem 1rem',
                  border: '1px solid var(--border-color, #f1f5f9)',
                }}>
                  {rec.diagnosis && (
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, color: '#0284c7' }}>
                        Primary Diagnosis
                      </span>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                        {rec.diagnosis}
                      </p>
                    </div>
                  )}

                  {rec.chiefComplaint && (
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>
                        Chief Complaint / Symptoms
                      </span>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-primary, #334155)' }}>
                        {rec.chiefComplaint}
                      </p>
                    </div>
                  )}
                </div>

                {/* Vitals Quick Strip (if available) */}
                {rec.vitals && Object.keys(rec.vitals).length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    flexWrap: 'wrap',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary, #64748b)',
                    paddingTop: '0.25rem',
                  }}>
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0284c7' }}>
                      <Activity size={14} /> Vitals:
                    </span>
                    {rec.vitals.bp && <span>BP: <strong>{rec.vitals.bp} mmHg</strong></span>}
                    {rec.vitals.pulse && <span>Pulse: <strong>{rec.vitals.pulse} bpm</strong></span>}
                    {rec.vitals.spo2 && <span>SpO2: <strong>{rec.vitals.spo2}%</strong></span>}
                    {rec.vitals.temp && <span>Temp: <strong>{rec.vitals.temp} °F</strong></span>}
                  </div>
                )}

                {/* Footer Badges: Prescriptions & Lab tests linked */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  borderTop: '1px solid var(--border-color, #f1f5f9)',
                  paddingTop: '0.75rem',
                  fontSize: '0.76rem',
                }}>
                  {rec.prescriptionsCount > 0 && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      color: '#059669',
                      fontWeight: 600,
                      backgroundColor: 'rgba(5, 150, 105, 0.08)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 6,
                    }}>
                      <Pill size={13} /> {rec.prescriptionsCount} Prescription{rec.prescriptionsCount > 1 ? 's' : ''} Issued
                    </span>
                  )}
                  {rec.labOrdersCount > 0 && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      color: '#7c3aed',
                      fontWeight: 600,
                      backgroundColor: 'rgba(124, 58, 237, 0.08)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 6,
                    }}>
                      <Microscope size={13} /> {rec.labOrdersCount} Lab Order{rec.labOrdersCount > 1 ? 's' : ''} Linked
                    </span>
                  )}
                </div>
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
            onClick={() => fetchRecords(search, selectedDept, pagination.page - 1)}
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
            onClick={() => fetchRecords(search, selectedDept, pagination.page + 1)}
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

export default PatientMedicalRecordsPage;
