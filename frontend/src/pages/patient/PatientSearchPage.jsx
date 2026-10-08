import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  Pill,
  Microscope,
  CreditCard,
  FolderLock,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Filter,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const performSearch = async (query = searchQuery, category = activeCategory) => {
    if (!query.trim()) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    try {
      setLoading(true);
      const res = await patientApi.searchRecords({
        q: query.trim(),
        category: category === 'ALL' ? undefined : category,
      });
      if (res.data) {
        setResults(res.data.results || []);
        setTotalCount(res.data.totalCount || (res.data.results || []).length);
      }
    } catch (err) {
      console.error('Search error', err);
      if (onShowToast) onShowToast('Search query failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, activeCategory);
    }
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery });
    performSearch(searchQuery, activeCategory);
  };

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    performSearch(searchQuery, cat);
  };

  const categories = [
    { id: 'ALL', label: 'All Records' },
    { id: 'VISIT', label: 'Consultations' },
    { id: 'PRESCRIPTION', label: 'Prescriptions' },
    { id: 'LAB_REPORT', label: 'Lab Reports' },
    { id: 'INVOICE', label: 'Invoices' },
    { id: 'DOCUMENT', label: 'Vault Documents' },
  ];

  const getResultIcon = (type) => {
    switch (type) {
      case 'VISIT':
        return { icon: Stethoscope, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      case 'PRESCRIPTION':
        return { icon: Pill, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' };
      case 'LAB_REPORT':
        return { icon: Microscope, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' };
      case 'INVOICE':
        return { icon: CreditCard, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' };
      case 'DOCUMENT':
        return { icon: FolderLock, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      default:
        return { icon: FileText, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
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
            <Search size={20} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
            Patient Portal Search
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
          Scoped deep search across your diagnoses, prescription medications, lab findings, billing ledgers, and documents.
        </p>
      </div>

      {/* ── Search Input & Filter Controls ──────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 14,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }} />
            <input
              type="text"
              placeholder="Search across all your clinical records, medicines, lab reports, doctor notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                borderRadius: 10,
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'var(--input-bg, #f8fafc)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
              autoFocus
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
            Category:
          </span>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  background: isSelected ? '#0284c7' : 'var(--pill-bg, #f1f5f9)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary, #475569)',
                  border: isSelected ? '1px solid #0284c7' : '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 20,
                  padding: '0.25rem 0.8rem',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search Results List ─────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 100, borderRadius: 14, backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : !searchQuery.trim() ? (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px dashed var(--border-color, #cbd5e1)',
          borderRadius: 16,
          padding: '3rem 2rem',
          textAlign: 'center',
          color: 'var(--text-secondary, #64748b)',
        }}>
          Type keywords above (such as diagnosis names, doctor names, medications, lab tests, or bill numbers) to search.
        </div>
      ) : results.length === 0 ? (
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
          <Search size={36} color="#94a3b8" />
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
            No Matching Records Found
          </h3>
          <p style={{ margin: 0, maxWidth: 440, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            No records matched "{searchQuery}" under the selected category. Try broader search terms.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #64748b)' }}>
            Found <strong>{totalCount}</strong> matching record{totalCount !== 1 ? 's' : ''} for "{searchQuery}"
          </div>

          {results.map((item, idx) => {
            const { icon: Icon, color, bg } = getResultIcon(item.type);
            const dateFormatted = item.date ? new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }) : 'Record';

            return (
              <Link
                key={item.id || idx}
                to={item.link || '#'}
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 14,
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: bg,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={20} />
                  </div>
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
                        {item.category || item.type?.replace('_', ' ') || 'RECORD'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)' }}>
                        {dateFormatted}
                      </span>
                    </div>

                    <h3 style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                      {item.title}
                    </h3>

                    {item.snippet && (
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)', lineHeight: 1.4 }}>
                        {item.snippet}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0284c7', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}>
                  <span>View</span>
                  <ChevronRight size={15} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientSearchPage;
