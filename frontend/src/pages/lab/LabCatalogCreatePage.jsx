import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FlaskConical,
  TestTube,
  AlertTriangle,
  Layers,
  HelpCircle,
} from 'lucide-react';
import labApi from '../../api/labApi';
import { Card, Button, Input, Select, Badge } from '../../components/ui';

export const LabCatalogCreatePage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Biochemistry',
    sampleType: 'Blood',
    containerType: 'Lavender (EDTA)',
    turnaroundTimeMinutes: 60,
    price: 35.0,
    fastingRequired: false,
    description: '',
  });

  // Parameters State
  const [parameters, setParameters] = useState([
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
    // Auto populate code from name if empty
    if (field === 'name' && !updated[index].code) {
      updated[index].code = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .slice(0, 12);
    }
    setParameters(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      // Validate parameters
      for (const p of parameters) {
        if (!p.name.trim() || !p.code.trim()) {
          throw new Error('All parameter rows must specify Name and Code.');
        }
      }

      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
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

      await labApi.createTest(payload);
      navigate('/app/lab/catalog');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create diagnostic test';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="med-page-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Breadcrumbs & Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/app/lab/catalog')}>
          Back to Catalog
        </Button>
        <span style={{ color: 'var(--text-secondary)' }}>/</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>New Diagnostic Investigation</span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Configure New Diagnostic Test
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Define the investigation metadata, specimen collection requirements, and multi-parameter reference ranges.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: General Test Details */}
        <Card style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical size={18} color="#8b5cf6" /> Investigation Header & Pricing
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Test Code (Unique) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CBC, TROP_I, BMP"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', textTransform: 'uppercase', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Full Investigation Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Complete Blood Count with Differential"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Diagnostic Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              >
                <option value="Hematology">Hematology</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Immunology">Immunology</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Pathology">Pathology</option>
                <option value="Urinalysis">Urinalysis</option>
                <option value="Molecular">Molecular / Genetics</option>
                <option value="Toxicology">Toxicology</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Billed Hospital Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Sample Specimen Type *
              </label>
              <select
                value={formData.sampleType}
                onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              >
                <option value="Blood">Blood (Whole Blood)</option>
                <option value="Serum">Serum</option>
                <option value="Plasma">Plasma</option>
                <option value="Urine">Urine</option>
                <option value="Swab">Swab / Culture</option>
                <option value="CSF">Cerebrospinal Fluid</option>
                <option value="Stool">Stool Sample</option>
                <option value="Tissue">Biopsy / Tissue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Collection Container / Tube Spec
              </label>
              <input
                type="text"
                placeholder="e.g. Lavender (EDTA) / Gold (SST)"
                value={formData.containerType}
                onChange={(e) => setFormData({ ...formData, containerType: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Target Turnaround Time (Minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.turnaroundTimeMinutes}
                onChange={(e) => setFormData({ ...formData, turnaroundTimeMinutes: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={formData.fastingRequired}
                  onChange={(e) => setFormData({ ...formData, fastingRequired: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#8b5cf6' }}
                />
                <strong>Fasting Required Prior to Draw</strong>
              </label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Clinical Description & Instructions
            </label>
            <textarea
              rows={2}
              placeholder="Clinical indications, special storage instructions, or preparation guidelines..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
          </div>
        </Card>

        {/* Section 2: Multi-Parameter Reference Ranges Builder */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#8b5cf6" /> Investigation Parameters & Numeric Norms ({parameters.length})
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Units are server-owned and immutable during result entry. Set panic bounds for auto critical flags.
              </p>
            </div>

            <Button type="button" variant="outline" size="sm" icon={Plus} onClick={handleAddParam}>
              Add Parameter Row
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {parameters.map((param, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) 40px',
                  gap: '10px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Param Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hemoglobin"
                    value={param.name}
                    onChange={(e) => handleParamChange(index, 'name', e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Param Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="HGB"
                    value={param.code}
                    onChange={(e) => handleParamChange(index, 'code', e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Unit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="g/dL"
                    value={param.unit}
                    onChange={(e) => handleParamChange(index, 'unit', e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
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
                      <label style={{ fontSize: '0.72rem', color: '#10b981', display: 'block', marginBottom: '3px' }}>
                        Ref Min
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Min"
                        value={param.referenceMin}
                        onChange={(e) => handleParamChange(index, 'referenceMin', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#10b981', display: 'block', marginBottom: '3px' }}>
                        Ref Max
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Max"
                        value={param.referenceMax}
                        onChange={(e) => handleParamChange(index, 'referenceMax', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#ef4444', display: 'block', marginBottom: '3px' }}>
                        Panic Low
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Crit Low"
                        value={param.criticalLow}
                        onChange={(e) => handleParamChange(index, 'criticalLow', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#ef4444', display: 'block', marginBottom: '3px' }}>
                        Panic High
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Crit High"
                        value={param.criticalHigh}
                        onChange={(e) => handleParamChange(index, 'criticalHigh', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ gridColumn: 'span 4' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                      Normal Text / Standard Options (Comma Separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NEGATIVE, NON-REACTIVE, CLEAR"
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
                    title="Remove parameter"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/app/lab/catalog')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            disabled={submitting}
          >
            {submitting ? 'Saving Investigation...' : 'Save & Publish Test'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LabCatalogCreatePage;
