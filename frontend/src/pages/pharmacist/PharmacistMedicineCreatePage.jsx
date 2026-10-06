import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Pill,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Building,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import { Card, Badge, Button, InputField, SelectField, TextareaField } from '../../components/ui';

export const PharmacistMedicineCreatePage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brandName: '',
    category: 'Antibiotic',
    manufacturer: '',
    strength: '',
    dosageForm: 'Tablet',
    route: 'Oral',
    unit: 'Tablets',
    sellingPrice: '',
    reorderLevel: 20,
    status: 'Active',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'sellingPrice' || name === 'reorderLevel' ? (value === '' ? '' : Number(value)) : value,
    }));
    setError(null);
    setDuplicateWarning(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.genericName.trim() || !formData.manufacturer.trim() || !formData.strength.trim()) {
      setError('Please fill in all mandatory medicine formulation fields.');
      return;
    }

    if (Number(formData.sellingPrice) <= 0) {
      setError('Selling price must be greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const created = await pharmacistApi.createMedicine(formData);
      if (onShowToast) {
        onShowToast(`Created formulation ${formData.name} (${created.data?.medicineCode || 'Saved'})`);
      }
      navigate(`/app/pharmacist/medicines/${created.data?.id || ''}`);
    } catch (err) {
      if (err.status === 409) {
        setDuplicateWarning(err.message);
      } else {
        setError(err.message || 'Failed to create medicine formulation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="med-page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate('/app/pharmacist/medicines')}
        >
          Back
        </Button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Add New Formulation to Catalog
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Define clinical naming, dosage specifications, packaging units, and reorder levels.
          </p>
        </div>
      </div>

      {duplicateWarning && (
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Duplicate Formulation Alert</strong>
            <span>{duplicateWarning}</span>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card title="1. Clinical & Commercial Details" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <InputField
              label="Medicine Name *"
              name="name"
              placeholder="e.g. Amoxicillin 500mg"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <InputField
              label="Generic Active Ingredient *"
              name="genericName"
              placeholder="e.g. Amoxicillin Trihydrate"
              value={formData.genericName}
              onChange={handleChange}
              required
            />
            <InputField
              label="Brand / Trade Name"
              name="brandName"
              placeholder="e.g. Augmentin, Moxatag"
              value={formData.brandName}
              onChange={handleChange}
            />
            <SelectField
              label="Therapeutic Category *"
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={[
                { value: 'Antibiotic', label: 'Antibiotic' },
                { value: 'Analgesic', label: 'Analgesic / Antipyretic' },
                { value: 'Cardiovascular', label: 'Cardiovascular' },
                { value: 'Antidiabetic', label: 'Antidiabetic' },
                { value: 'Antihypertensive', label: 'Antihypertensive' },
                { value: 'Respiratory', label: 'Respiratory' },
                { value: 'Gastrointestinal', label: 'Gastrointestinal' },
                { value: 'Anticoagulant', label: 'Anticoagulant' },
                { value: 'Corticosteroid', label: 'Corticosteroid' },
                { value: 'Antihistamine', label: 'Antihistamine' },
                { value: 'Other', label: 'Other' },
              ]}
              required
            />
            <InputField
              label="Manufacturer *"
              name="manufacturer"
              placeholder="e.g. GlaxoSmithKline, Pfizer"
              value={formData.manufacturer}
              onChange={handleChange}
              required
            />
            <SelectField
              label="Catalog Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'Active', label: 'Active (Available for Dispensing)' },
                { value: 'Inactive', label: 'Inactive (Disabled)' },
              ]}
            />
          </div>
        </Card>

        <Card title="2. Formulation, Dosage & Units" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <InputField
              label="Strength *"
              name="strength"
              placeholder="e.g. 500mg, 10mg/5ml"
              value={formData.strength}
              onChange={handleChange}
              required
            />
            <SelectField
              label="Dosage Form *"
              name="dosageForm"
              value={formData.dosageForm}
              onChange={handleChange}
              options={[
                { value: 'Tablet', label: 'Tablet' },
                { value: 'Capsule', label: 'Capsule' },
                { value: 'Syrup', label: 'Syrup / Suspension' },
                { value: 'Injection', label: 'Injection (IV/IM)' },
                { value: 'Ointment', label: 'Ointment / Cream' },
                { value: 'Inhaler', label: 'Inhaler / Respule' },
                { value: 'Drops', label: 'Drops (Eye/Ear)' },
              ]}
            />
            <SelectField
              label="Administration Route"
              name="route"
              value={formData.route}
              onChange={handleChange}
              options={[
                { value: 'Oral', label: 'Oral' },
                { value: 'Intravenous', label: 'Intravenous (IV)' },
                { value: 'Intramuscular', label: 'Intramuscular (IM)' },
                { value: 'Topical', label: 'Topical' },
                { value: 'Inhalation', label: 'Inhalation' },
                { value: 'Ophthalmic', label: 'Ophthalmic' },
              ]}
            />
            <InputField
              label="Dispensing Unit"
              name="unit"
              placeholder="e.g. Tablets, Vials, Bottles"
              value={formData.unit}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card title="3. Pricing & Inventory Controls" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <InputField
              label="Selling Price ($ per unit) *"
              name="sellingPrice"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.sellingPrice}
              onChange={handleChange}
              required
            />
            <InputField
              label="Reorder Threshold Level (units) *"
              name="reorderLevel"
              type="number"
              min="0"
              placeholder="20"
              value={formData.reorderLevel}
              onChange={handleChange}
              required
            />
          </div>

          <TextareaField
            label="Clinical Description / Usage Notes"
            name="description"
            placeholder="Key contraindications, storage requirements (e.g. Store below 25°C), or clinical guidance..."
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
        </Card>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/app/pharmacist/medicines')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={submitting}
            style={{ background: '#059669', borderColor: '#047857' }}
          >
            Create Formulation
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PharmacistMedicineCreatePage;
