import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Microscope,
  Calendar,
  User,
  Search,
  ChevronRight,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientLabReportsPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const fetchReports = async (searchTerm = '', page = 1) => {
    try {
      setLoading(true);
      const res = await patientApi.getLabReports({
        search: searchTerm,
        page,
        limit: 10,
      });
      if (res.data) {
        setReports(res.data.reports || []);
        setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load lab reports', err);
      if (onShowToast) onShowToast('Failed to fetch laboratory reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(search, 1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports(search, 1);
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
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <Microscope size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
              Diagnostic & Lab Reports
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            Review verified pathology tests, blood biomarker panels, reference ranges, and diagnostic findings.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(124, 58, 237, 0.08)',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          padding: '0.4rem 0.8rem',
          borderRadius: 10,
          fontSize: '0.8rem',
          color: '#7c3aed',
          fontWeight: 600,
        }}>
          <ShieldCheck size={16} />
          <span>Pathology Certified & Released</span>
        </div>
      </div>

      {/* ── Search Bar ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 14,
        padding: '0.85rem 1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }} />
            <input
              type="text"
              placeholder="Search by test name, category, or order number..."
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
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Search Reports
          </button>
        </form>
      </div>

      {/* ── Lab Reports List ────────────────────────────────────────── */}
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
      ) : reports.length === 0 ? (
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
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed',
          }}>
            <Microscope size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
            No Released Lab Reports Found
          </h3>
          <p style={{ margin: 0, maxWidth: 440, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            {search
              ? 'No laboratory reports match your current search query. Try clearing the search box.'
              : 'Diagnostic tests are published here immediately once verified and released by the hospital pathology team.'}
          </p>
          {search && (
            <button
              onClick={() => { setSearch(''); fetchReports('', 1); }}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #7c3aed',
                color: '#7c3aed',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {reports.map((report) => {
            const dateFormatted = report.releasedAt || report.orderDate ? new Date(report.releasedAt || report.orderDate).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) : 'Recent Report';

            const isAmended = report.isAmended || report.status === 'AMENDED';

            return (
              <div
                key={report.id}
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 14,
                  padding: '1.4rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header Row */}
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
                      backgroundColor: 'rgba(124, 58, 237, 0.1)',
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Microscope size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                          {report.testName || 'Diagnostic Lab Assay'}
                        </h3>
                        {isAmended ? (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 6,
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                          }}>
                            AMENDED
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 6,
                            backgroundColor: 'rgba(124, 58, 237, 0.1)',
                            color: '#7c3aed',
                          }}>
                            RELEASED
                          </span>
                        )}
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
                        <span>Category: <strong>{report.category || 'Clinical Pathology'}</strong></span>
                        <span>&bull; Order #{report.orderNumber || report.id?.substring(0, 8)}</span>
                        <span>&bull; {dateFormatted}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/app/patient/lab-reports/${report.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1rem',
                      borderRadius: 8,
                      backgroundColor: 'rgba(124, 58, 237, 0.08)',
                      color: '#7c3aed',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      border: '1px solid rgba(124, 58, 237, 0.25)',
                    }}
                  >
                    <span>View Full Lab Results</span>
                    <ChevronRight size={15} />
                  </Link>
                </div>

                {/* Parameters Preview if present */}
                {report.parameters && report.parameters.length > 0 && (
                  <div style={{
                    backgroundColor: 'var(--subcard-bg, #f8fafc)',
                    borderRadius: 10,
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-color, #f1f5f9)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center',
                    fontSize: '0.82rem',
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
                      Key Parameters ({report.parameters.length}):
                    </span>
                    {report.parameters.slice(0, 4).map((p, idx) => (
                      <span key={idx} style={{ color: 'var(--text-primary, #334155)' }}>
                        {p.parameterName}: <strong>{p.value} {p.unit}</strong>
                        {p.flag && p.flag !== 'NORMAL' && (
                          <span style={{
                            marginLeft: 4,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            padding: '0.1rem 0.35rem',
                            borderRadius: 4,
                          }}>
                            {p.flag}
                          </span>
                        )}
                      </span>
                    ))}
                    {report.parameters.length > 4 && (
                      <span style={{ color: '#7c3aed', fontWeight: 600, fontSize: '0.78rem' }}>
                        +{report.parameters.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Disclaimer Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '1rem 1.25rem',
        borderRadius: 12,
        backgroundColor: 'rgba(124, 58, 237, 0.04)',
        border: '1px solid rgba(124, 58, 237, 0.15)',
        fontSize: '0.82rem',
        color: 'var(--text-secondary, #64748b)',
        lineHeight: 1.5,
      }}>
        <Info size={18} color="#7c3aed" style={{ flexShrink: 0 }} />
        <span>
          <strong>Reference Range Notice:</strong> Flags compare values with the laboratory's configured reference information. Please discuss your results with your doctor.
        </span>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchReports(search, pagination.page - 1)}
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
            onClick={() => fetchReports(search, pagination.page + 1)}
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

export default PatientLabReportsPage;
