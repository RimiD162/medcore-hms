import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Save,
  Trash2,
  Plus,
  FlaskConical,
  Clock,
  DollarSign,
  TestTube,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Button, Badge, LoadingState, ErrorState } from '../../components/ui';

export const LabCatalogDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: test, loading, error, refetch } = useLabData(
    () => labApi.getTestById(id),
    [id]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Editable Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sampleType: '',
    containerType: '',
    turnaroundTimeMinutes: 60,
    price: 0,
    fastingRequired: false,
    description: '',
    isActive: true,
  });

  const [parameters, setParameters] = useState([]);

  useEffect(() => {
    if (test) {
      setFormData({
        name: test.name || '',
        category: test.category || 'Biochemistry',
        sampleType: test.sampleType || 'Blood',
        containerType: test.containerType || '',
        turnaroundTimeMinutes: test.turnaroundTimeMinutes || 60,
        price: Number(test.price || 0),
        fastingRequired: Boolean(test.fastingRequired),
        description: test.description || '',
        isActive: Boolean(test.isActive),
      });

      setParameters(
        (test.parameters || []).map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          unit: p.unit,
          dataType: p.dataType,
          referenceMin: p.referenceMin !== null && p.referenceMin !== undefined ? p.referenceMin : '',
          referenceMax: p.referenceMax !== null && p.referenceMax !== undefined ? p.referenceMax : '',
          criticalLow: p.criticalLow !== null && p.criticalLow !== undefined ? p.criticalLow : '',
          criticalHigh: p.criticalHigh !== null && p.criticalHigh !== undefined ? p.criticalHigh : '',
          normalText: p.normalText || '',
        }))
      );
    }
  }, [test]);

  const handleAddParam = () => {
    setParameters([
      ...parameters,
      {
        name: '',
        code: '',
        unit: 'mg/dL',
        dataType: 'NUMERIC',
        referenceMin: '',
        referenceMax: '',
        criticalLow: '',
        criticalHigh: '',
        normalText: '',
      },
    ]);
  };

  const handleRemoveParam = (index) => {
    if (parameters.length <= 1) return;
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleParamChange = (index, field, value) => {
    const updated = [...parameters];
    updated[index][field] = value;
    setParameters(updated);
  };

  const handleToggleStatus = async () => {
    try {
      await labApi.toggleTestStatus(id);
      refetch();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      const payload = {
        ...formData,
        turnaroundTimeMinutes: Number(formData.turnaroundTimeMinutes) || 60,
        price: Number(formData.price) || 0,
        parameters: parameters.map((p, idx) => ({
          name: p.name.trim(),
          code: p.code.trim().toUpperCase(),
          unit: p.unit.trim(),
          dataType: p.dataType,
          displayOrder: idx,
          referenceMin: p.referenceMin !== '' ? Number(p.referenceMin) : null,
          referenceMax: p.referenceMax !== '' ? Number(p.referenceMax) : null,
          criticalLow: p.criticalLow !== '' ? Number(p.criticalLow) : null,
          criticalHigh: p.criticalHigh !== '' ? Number(p.criticalHigh) : null,
          normalText: p.normalText?.trim() || null,
        })),
      };

      await labApi.updateTest(id, payload);
      setIsEditing(false);
      setFeedbackMsg({ type: 'success', text: 'Diagnostic investigation updated successfully.' });
      refetch();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update test';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading investigation details..." />;
  if (error || !test) return <ErrorState message={error || 'Test not found'} onRetry={refetch} />;

  return (
    <div className="med-page-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Breadcrumb & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/app/lab/catalog')}>
            Back to Catalog
          </Button>
          <span style={{ color: 'var(--text-secondary)' }}>/</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#8b5cf6' }}>{test.code}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="outline"
            icon={test.isActive ? ToggleRight : ToggleLeft}
            onClick={handleToggleStatus}
          >
            {test.isActive ? 'Active in System' : 'Disabled'}
          </Button>

          {!isEditing ? (
            <Button variant="primary" icon={Edit} onClick={() => setIsEditing(true)}>
              Edit Investigation
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel Edit
            </Button>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{
            background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: feedbackMsg.type === 'success' ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Form / Display */}
      <form onSubmit={handleSave}>
        {/* Investigation Summary Card */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    background: 'rgba(124, 58, 237, 0.15)',
                    color: '#8b5cf6',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {test.code}
                </span>
                <Badge variant="primary">{test.category}</Badge>
                <Badge variant={test.isActive ? 'success' : 'default'}>
                  {test.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {!isEditing ? (
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {test.name}
                </h1>
              ) : (
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', fontSize: '1.25rem', fontWeight: 700, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                />
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hospital Diagnostic Fee</div>
              {!isEditing ? (
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                  ${Number(test.price || 0).toFixed(2)}
                </div>
              ) : (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ width: '110px', fontSize: '1.1rem', fontWeight: 700, padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: '#10b981', textAlign: 'right' }}
                />
              )}
            </div>
          </div>

          {/* Metadata Specs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Specimen Requirement
              </span>
              {!isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <TestTube size={15} color="#3b82f6" /> {test.sampleType || 'Blood'}
                </div>
              ) : (
                <select
                  value={formData.sampleType}
                  onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                >
                  <option value="Blood">Blood</option>
                  <option value="Serum">Serum</option>
                  <option value="Plasma">Plasma</option>
                  <option value="Urine">Urine</option>
                  <option value="Swab">Swab</option>
                  <option value="CSF">CSF</option>
                  <option value="Other">Other</option>
                </select>
              )}
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Container / Tube Color
              </span>
              {!isEditing ? (
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {test.containerType || 'Standard Specimen Container'}
                </span>
              ) : (
                <input
                  type="text"
                  value={formData.containerType}
                  onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              )}
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Target Turnaround Time (TAT)
              </span>
              {!isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <Clock size={15} color="#f59e0b" /> {test.turnaroundTimeMinutes || 60} Minutes
                </div>
              ) : (
                <input
                  type="number"
                  value={formData.turnaroundTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, turnaroundTimeMinutes: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              )}
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Fasting Protocol
              </span>
              {!isEditing ? (
                <Badge variant={test.fastingRequired ? 'danger' : 'default'}>
                  {test.fastingRequired ? '10-12 Hr Fasting Required' : 'No Fasting Required'}
                </Badge>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.fastingRequired}
                    onChange={(e) => setFormData({ ...formData, fastingRequired: e.target.checked })}
                  />
                  Fasting Required
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Clinical Indications & Instructions
            </span>
            {!isEditing ? (
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {test.description || 'No specific clinical preparation notes provided.'}
              </p>
            ) : (
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
            )}
          </div>
        </Card>

        {/* Multi-Parameter Table Card */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#8b5cf6" /> Configured Test Parameters ({parameters.length})
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Server-owned reference ranges. Out-of-bound values automatically trigger Low, High, or Critical badges.
              </p>
            </div>

            {isEditing && (
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={handleAddParam}>
                Add Parameter
              </Button>
            )}
          </div>

          {!isEditing ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 12px' }}>Parameter</th>
                    <th style={{ padding: '10px 12px' }}>Code</th>
                    <th style={{ padding: '10px 12px' }}>Data Type</th>
                    <th style={{ padding: '10px 12px' }}>Unit</th>
                    <th style={{ padding: '10px 12px' }}>Reference Normal</th>
                    <th style={{ padding: '10px 12px' }}>Panic / Critical Thresholds</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((p, idx) => (
                    <tr key={p.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.name}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#8b5cf6' }}>
                        {p.code}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Badge variant="default">{p.dataType}</Badge>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                        {p.unit || '—'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {p.dataType === 'NUMERIC' ? (
                          p.referenceMin !== '' && p.referenceMax !== '' ? (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>
                              {p.referenceMin} – {p.referenceMax} {p.unit}
                            </span>
                          ) : p.referenceMin !== '' ? (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>&gt; {p.referenceMin} {p.unit}</span>
                          ) : p.referenceMax !== '' ? (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>&lt; {p.referenceMax} {p.unit}</span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>Not bounded</span>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-primary)' }}>{p.normalText || 'Standard qualitative norm'}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {p.criticalLow !== '' || p.criticalHigh !== '' ? (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>
                            {p.criticalLow !== '' ? `< ${p.criticalLow}` : ''}
                            {p.criticalLow !== '' && p.criticalHigh !== '' ? ' or ' : ''}
                            {p.criticalHigh !== '' ? `> ${p.criticalHigh}` : ''}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>None set</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {parameters.map((param, index) => (
                <div
                  key={index}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) 40px',
                    gap: '10px',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={param.name}
                      onChange={(e) => handleParamChange(index, 'name', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                      Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={param.code}
                      onChange={(e) => handleParamChange(index, 'code', e.target.value.toUpperCase())}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                      Unit *
                    </label>
                    <input
                      type="text"
                      required
                      value={param.unit}
                      onChange={(e) => handleParamChange(index, 'unit', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                      Data Type
                    </label>
                    <select
                      value={param.dataType}
                      onChange={(e) => handleParamChange(index, 'dataType', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    >
                      <option value="NUMERIC">NUMERIC</option>
                      <option value="QUALITATIVE">QUALITATIVE</option>
                      <option value="TEXT">TEXT</option>
                    </select>
                  </div>

                  {param.dataType === 'NUMERIC' ? (
                    <>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#10b981', display: 'block', marginBottom: '2px' }}>
                          Ref Min
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={param.referenceMin}
                          onChange={(e) => handleParamChange(index, 'referenceMin', e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#10b981', display: 'block', marginBottom: '2px' }}>
                          Ref Max
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={param.referenceMax}
                          onChange={(e) => handleParamChange(index, 'referenceMax', e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#ef4444', display: 'block', marginBottom: '2px' }}>
                          Crit Low
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={param.criticalLow}
                          onChange={(e) => handleParamChange(index, 'criticalLow', e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#ef4444', display: 'block', marginBottom: '2px' }}>
                          Crit High
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={param.criticalHigh}
                          onChange={(e) => handleParamChange(index, 'criticalHigh', e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                        />
                      </div>
                    </>
                  ) : (
                    <div style={{ gridColumn: 'span 4' }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                        Normal Qualitative Text
                      </label>
                      <input
                        type="text"
                        value={param.normalText}
                        onChange={(e) => handleParamChange(index, 'normalText', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveParam(index)}
                      disabled={parameters.length <= 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: parameters.length <= 1 ? 'var(--text-secondary)' : '#ef4444',
                        cursor: parameters.length <= 1 ? 'not-allowed' : 'pointer',
                        padding: '6px',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {isEditing && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Save} disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Save Investigation Changes'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default LabCatalogDetailPage;
