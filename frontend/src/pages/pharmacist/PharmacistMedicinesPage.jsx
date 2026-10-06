import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistMedicinesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const { data, loading, error, refetch } = usePharmacistData(
    () =>
      pharmacistApi.getMedicines({
        search: search || undefined,
        category: category !== 'ALL' ? category : undefined,
        status: status !== 'ALL' ? status : undefined,
        limit: 50,
      }),
    [search, category, status]
  );

  const medicines = data?.medicines || [];
  const total = data?.pagination?.total || 0;

  return (
    <div className="med-page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Medicine Catalog
            </h1>
            <Badge variant="primary">{total} Formulations</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Manage hospital drug formulary, pricing, reorder thresholds, and active formulations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            icon={Layers}
            onClick={() => navigate('/app/pharmacist/batches')}
          >
            Batch Ledger
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/app/pharmacist/medicines/new')}
            style={{ background: '#059669', borderColor: '#047857' }}
          >
            Add New Medicine
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="auth-input"
              placeholder="Search by name, generic name, brand, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px', height: '40px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="auth-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ height: '40px', minWidth: '150px' }}
            >
              <option value="ALL">All Categories</option>
              <option value="Antibiotic">Antibiotic</option>
              <option value="Analgesic">Analgesic</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Antidiabetic">Antidiabetic</option>
              <option value="Antihypertensive">Antihypertensive</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
              <option value="Anticoagulant">Anticoagulant</option>
              <option value="Corticosteroid">Corticosteroid</option>
              <option value="Antihistamine">Antihistamine</option>
            </select>

            <select
              className="auth-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ height: '40px', minWidth: '130px' }}
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Content */}
      {loading ? (
        <LoadingState message="Loading catalog formulations..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : medicines.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Pill size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Medicines Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px', fontSize: '0.9rem' }}>
            No medicines match the selected filter criteria.
          </p>
          <Button variant="outline" onClick={() => { setSearch(''); setCategory('ALL'); setStatus('ALL'); }}>
            Reset Filters
          </Button>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Medicine Name & Generic</th>
                  <th>Category</th>
                  <th>Strength / Form</th>
                  <th>Selling Price</th>
                  <th>Usable Stock</th>
                  <th>Active Batches</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => (
                  <tr key={med.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{med.medicineCode}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{med.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {med.genericName} {med.brandName ? `(${med.brandName})` : ''}
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline">{med.category}</Badge>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{med.strength}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{med.dosageForm} ({med.route})</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#10b981' }}>
                      ${Number(med.sellingPrice).toFixed(2)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}> / {med.unit}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700 }}>{med.usableStock} {med.unit}</span>
                        <Badge
                          variant={
                            med.stockStatus === 'In Stock'
                              ? 'success'
                              : med.stockStatus === 'Low Stock'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {med.stockStatus}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Reorder: {med.reorderLevel}
                      </div>
                    </td>
                    <td>
                      <Badge variant="primary">{med.activeBatchCount || 0} Batches</Badge>
                    </td>
                    <td>
                      <Badge variant={med.status === 'Active' ? 'success' : 'secondary'}>
                        {med.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => navigate(`/app/pharmacist/medicines/${med.id}`)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PharmacistMedicinesPage;
