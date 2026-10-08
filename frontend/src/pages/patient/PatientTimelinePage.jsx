import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  History,
  Calendar,
  FileText,
  Pill,
  Microscope,
  CreditCard,
  FolderLock,
  ChevronRight,
  Clock,
  ArrowRight,
  ShieldCheck,
  Filter,
  Sparkles,
  Stethoscope,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientTimelinePage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchTimeline = async (category = 'ALL') => {
    try {
      setLoading(true);
      const res = await patientApi.getTimeline({
        category: category === 'ALL' ? undefined : category,
        limit: 50,
      });
      if (res.data) {
        setEvents(res.data.events || []);
      }
    } catch (err) {
      console.error('Failed to load timeline', err);
      if (onShowToast) onShowToast('Failed to fetch health timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline(typeFilter);
  }, []);

  const handleTypeChange = (t) => {
    setTypeFilter(t);
    fetchTimeline(t);
  };

  const categories = [
    { id: 'ALL', label: 'Complete Health History', icon: History },
    { id: 'APPOINTMENT', label: 'Appointments', icon: Calendar },
    { id: 'VISIT', label: 'Doctor Encounters', icon: Stethoscope },
    { id: 'PRESCRIPTION', label: 'Prescriptions', icon: Pill },
    { id: 'LAB_REPORT', label: 'Lab Reports', icon: Microscope },
    { id: 'BILLING', label: 'Invoices & Bills', icon: CreditCard },
    { id: 'DOCUMENT', label: 'Vault Uploads', icon: FolderLock },
  ];

  const getEventIcon = (type) => {
    switch (type) {
      case 'APPOINTMENT':
        return { icon: Calendar, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      case 'VISIT':
        return { icon: Stethoscope, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      case 'PRESCRIPTION':
        return { icon: Pill, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' };
      case 'LAB_REPORT':
        return { icon: Microscope, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' };
      case 'BILLING':
        return { icon: CreditCard, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' };
      case 'DOCUMENT':
        return { icon: FolderLock, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      default:
        return { icon: History, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };
    }
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
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <History size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
              Unified Health Timeline
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            Chronological aggregation of your entire clinical journey: consultations, diagnostic tests, medications, and invoices.
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
          <span>Patient-Scoped Health Stream</span>
        </div>
      </div>

      {/* ── Category Filter Pills ───────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 14,
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
          Filter Stream:
        </span>
        {categories.map((c) => {
          const isSelected = typeFilter === c.id;
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleTypeChange(c.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: isSelected ? '#0284c7' : 'var(--pill-bg, #f1f5f9)',
                color: isSelected ? '#ffffff' : 'var(--text-primary, #475569)',
                border: isSelected ? '1px solid #0284c7' : '1px solid var(--border-color, #e2e8f0)',
                borderRadius: 20,
                padding: '0.25rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Vertical Timeline Stream ─────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '1.5rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 110, borderRadius: 14, backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : events.length === 0 ? (
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
          <History size={36} color="#94a3b8" />
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
            No Timeline Events Recorded
          </h3>
          <p style={{ margin: 0, maxWidth: 440, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            Your healthcare events will be automatically ordered into this chronological health timeline as you complete visits, receive prescriptions, or perform lab tests.
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
          {/* Vertical Connecting Line */}
          <div style={{
            position: 'absolute',
            top: 24,
            bottom: 24,
            left: 20,
            width: 2,
            backgroundColor: 'var(--border-color, #e2e8f0)',
          }} />

          {/* Timeline Nodes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {events.map((evt, idx) => {
              const { icon: EventIcon, color, bg } = getEventIcon(evt.type);
              const dateFormatted = evt.date ? new Date(evt.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }) : 'Recorded Event';

              return (
                <div key={evt.id || idx} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                  {/* Circular Node Icon */}
                  <div style={{
                    position: 'absolute',
                    left: -28,
                    top: 14,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'var(--card-bg, #ffffff)',
                    border: `2px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    zIndex: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                  }}>
                    <EventIcon size={16} />
                  </div>

                  {/* Event Card */}
                  <div style={{
                    flex: 1,
                    background: 'var(--card-bg, #ffffff)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: 14,
                    padding: '1.25rem 1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 6,
                            backgroundColor: bg,
                            color: color,
                            textTransform: 'uppercase',
                          }}>
                            {evt.type?.replace('_', ' ') || 'HEALTH EVENT'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                            {dateFormatted}
                          </span>
                        </div>
                        <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                          {evt.title}
                        </h3>
                      </div>

                      {evt.link && (
                        <Link
                          to={evt.link}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: color,
                            textDecoration: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 6,
                            backgroundColor: bg,
                          }}
                        >
                          <span>View Details</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>

                    {evt.description && (
                      <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-primary, #334155)', lineHeight: 1.5 }}>
                        {evt.description}
                      </p>
                    )}

                    {evt.metadata && typeof evt.metadata === 'object' && Object.keys(evt.metadata).length > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary, #64748b)',
                        borderTop: '1px solid var(--border-color, #f1f5f9)',
                        paddingTop: '0.5rem',
                      }}>
                        {Object.entries(evt.metadata).map(([key, val]) => (
                          <span key={key}>
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}: <strong style={{ color: 'var(--text-primary, #1e293b)' }}>{String(val)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTimelinePage;
