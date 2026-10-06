import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Clock,
  DollarSign,
  TestTube,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, Input, Select, LoadingState, ErrorState } from '../../components/ui';

export const LabCatalogPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sampleTypeFilter, setSampleTypeFilter] = useState('');

  const { data, loading, error, refetch } = useLabData(
    () =>
      labApi.getCatalog({
        search: search || undefined,
        category: selectedCategory || undefined,
        sampleType: sampleTypeFilter || undefined,
      }),
    [search, selectedCategory, sampleTypeFilter]
  );

  const { data: catData } = useLabData(() => labApi.getCategories(), []);

  const tests = data?.tests || [];
  const categories = catData?.categories || [];

  const handleToggleStatus = async (e, testId) => {
    e.stopPropagation();
    try {
      await labApi.toggleTestStatus(testId);
      refetch();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  return (
    <div className="med-page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Diagnostic Test Catalog
            </h1>
            <Badge variant="primary">{tests.length} Configured Tests</Badge>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Comprehensive directory of laboratory investigations, multi-parameter norms, panic thresholds, and specimen specs.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/app/lab/catalog/new')}
        >
          Add New Investigation
        </Button>
      </div>

      {/* Filters Bar */}
      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'center' }}>
          <div>
            <Input
              placeholder="Search by test name or code (e.g. CBC, Troponin)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>

          <div>
            <select
              className="med-select-field"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className="med-select-field"
              value={sampleTypeFilter}
              onChange={(e) => setSampleTypeFilter(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            >
              <option value="">All Specimen Types</option>
              <option value="Blood">Blood (Whole/EDTA)</option>
              <option value="Serum">Serum</option>
              <option value="Plasma">Plasma</option>
              <option value="Urine">Urine</option>
              <option value="Swab">Swab / Culture</option>
              <option value="CSF">Cerebrospinal Fluid</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {(search || selectedCategory || sampleTypeFilter) && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                  setSampleTypeFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Tests Grid */}
      {loading ? (
        <LoadingState message="Loading diagnostic catalog tests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : tests.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Boxes size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Investigation Tests Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px', fontSize: '0.9rem' }}>
            {search || selectedCategory
              ? 'Try adjusting your search criteria or category filter.'
              : 'Add your first diagnostic test to initialize the laboratory catalog.'}
          </p>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/app/lab/catalog/new')}
          >
            Create Test Now
          </Button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {tests.map((test) => (
            <Card
              key={test.id}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: test.isActive ? '1px solid var(--border-color)' : '1px dashed rgba(239, 68, 68, 0.4)',
                opacity: test.isActive ? 1 : 0.75,
              }}
              onClick={() => navigate(`/app/lab/catalog/${test.id}`)}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          background: 'rgba(124, 58, 237, 0.12)',
                          color: '#8b5cf6',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {test.code}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {test.category}
                      </span>
                    </div>
                    <h3 style={{ margin: '4px 0 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {test.name}
                    </h3>
                  </div>

                  <Badge variant={test.isActive ? 'success' : 'default'}>
                    {test.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                {/* Description */}
                {test.description && (
                  <p style={{ margin: '0 0 12px', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {test.description}
                  </p>
                )}

                {/* Specimen & Turnaround Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                    }}
                  >
                    <TestTube size={12} /> {test.sampleType || 'Specimen'}
                  </span>

                  {test.turnaroundTimeMinutes && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                      }}
                    >
                      <Clock size={12} /> {test.turnaroundTimeMinutes} mins TAT
                    </span>
                  )}

                  {test.fastingRequired && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        fontWeight: 600,
                      }}
                    >
                      Fasting Required
                    </span>
                  )}
                </div>

                {/* Parameters Preview */}
                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '8px 10px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Parameters ({test.parameters?.length || 0})</span>
                    <span>Units</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {test.parameters?.slice(0, 3).map((param) => (
                      <div key={param.id || param.code} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                        <span style={{ fontWeight: 500 }}>{param.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{param.unit || 'qualitative'}</span>
                      </div>
                    ))}
                    {(test.parameters?.length || 0) > 3 && (
                      <span style={{ fontSize: '0.72rem', color: '#8b5cf6', fontStyle: 'italic' }}>
                        + {test.parameters.length - 3} more parameters
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Bottom Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#10b981' }}>
                  ${Number(test.price || 0).toFixed(2)}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleToggleStatus(e, test.id)}
                    title={test.isActive ? 'Deactivate test' : 'Activate test'}
                  >
                    {test.isActive ? <ToggleRight size={18} color="#10b981" /> : <ToggleLeft size={18} color="var(--text-secondary)" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit}
                    onClick={() => navigate(`/app/lab/catalog/${test.id}`)}
                  >
                    Configure
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabCatalogPage;
