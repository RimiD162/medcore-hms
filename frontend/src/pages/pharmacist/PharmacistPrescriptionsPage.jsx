import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  User,
  Pill,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, Badge, Button, Tabs, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistPrescriptionsPage = () => {
  const navigate = useNavigate();
  const [statusTab, setStatusTab] = useState('ACTIVE');
  const [search, setSearch] = useState('');

  const { data, loading, error, refetch } = usePharmacistData(
    () =>
      pharmacistApi.getPrescriptions({
        status: statusTab !== 'ALL' ? statusTab : undefined,
        search: search || undefined,
        limit: 50,
      }),
    [statusTab, search]
  );

  const prescriptions = data?.prescriptions || [];
  const total = data?.pagination?.total || 0;

  return (
    <div className="med-page-container">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pharmacy Prescription Queue
            </h1>
            <Badge variant="primary">{total} Prescriptions</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Review doctor orders, map free-text medications, confirm quantities, and dispense with FEFO batch allocation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            icon={Clock}
            onClick={() => navigate('/app/pharmacist/dispensing/history')}
          >
            Dispense History
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={statusTab}
        onChange={setStatusTab}
        tabs={[
          { id: 'ACTIVE', label: 'Active Queue (Pending & Partial)' },
          { id: 'ON_HOLD', label: 'On Hold' },
          { id: 'DISPENSED', label: 'Fully Dispensed' },
          { id: 'ALL', label: 'All Orders' },
        ]}
      />

      {/* Search Toolbar */}
      <Card style={{ margin: '20px 0', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="auth-input"
              placeholder="Search by Rx number, patient name, or patient ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px', height: '40px' }}
            />
          </div>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Content List */}
      {loading ? (
        <LoadingState message="Loading prescription orders and mapping status..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : prescriptions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Prescriptions in this Queue
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            There are no prescription orders matching the selected status.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {prescriptions.map((rx) => {
            const unmappedItems = rx.items?.filter((i) => !i.medicineId) || [];
            const isFullyMapped = unmappedItems.length === 0;
            const items = rx.items || [];

            return (
              <Card
                key={rx.id}
                style={{
                  padding: '20px',
                  border: rx.onHold
                    ? '1px solid rgba(239, 68, 68, 0.35)'
                    : '1px solid var(--border-color)',
                  background: rx.onHold
                    ? 'rgba(239, 68, 68, 0.04)'
                    : 'var(--card-bg)',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                      {rx.prescriptionNumber}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      • Prescribed: {new Date(rx.prescribedDate).toLocaleDateString()}
                    </span>

                    {rx.onHold ? (
                      <Badge variant="danger">ON HOLD: {rx.holdReason}</Badge>
                    ) : (
                      <Badge
                        variant={
                          rx.dispensingStatus === 'DISPENSED'
                            ? 'success'
                            : rx.dispensingStatus === 'PARTIALLY_DISPENSED'
                            ? 'warning'
                            : 'primary'
                        }
                      >
                        {rx.dispensingStatus}
                      </Badge>
                    )}

                    {!isFullyMapped && !rx.onHold && (
                      <Badge variant="warning">{unmappedItems.length} Unmapped Item{unmappedItems.length > 1 ? 's' : ''}</Badge>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/app/pharmacist/prescriptions/${rx.id}`)}
                    >
                      Review & Map
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={rx.onHold || !isFullyMapped || rx.dispensingStatus === 'DISPENSED'}
                      onClick={() => navigate(`/app/pharmacist/dispensing?rxId=${rx.id}`)}
                      style={{ background: '#059669', borderColor: '#047857' }}
                    >
                      Dispense Rx
                    </Button>
                  </div>
                </div>

                {/* Patient Demographic & Safeguard Strip */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} color="var(--text-secondary)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {rx.patient?.fullName}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      ({rx.patient?.patientIdNumber}) • {rx.patient?.age}y / {rx.patient?.gender}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Prescriber: <strong>Dr. {rx.doctor?.user?.fullName}</strong> ({rx.doctor?.department})
                  </div>

                  {/* Red Alert Pill for Allergies */}
                  {rx.patient?.allergies && rx.patient.allergies.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={15} color="#ef4444" />
                      <Badge variant="danger">
                        Allergies: {rx.patient.allergies.join(', ')}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Items Summary Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="med-data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Prescribed Medicine</th>
                        <th>Dosage & Frequency</th>
                        <th>Duration</th>
                        <th>Prescribed Qty</th>
                        <th>Dispensed Qty</th>
                        <th>Formulary Mapping</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.medicineName}</td>
                          <td>{item.dosage} • {item.frequency}</td>
                          <td>{item.duration}</td>
                          <td>
                            <strong style={{ color: item.quantityPrescribed ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                              {item.quantityPrescribed || 'Pending Confirmation'}
                            </strong>
                          </td>
                          <td>{item.quantityDispensed || 0}</td>
                          <td>
                            {item.medicineId ? (
                              <Badge variant="success">Mapped to Catalog</Badge>
                            ) : (
                              <Badge variant="warning">Mapping Required</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PharmacistPrescriptionsPage;
