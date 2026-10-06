import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Printer,
  Calendar,
  User,
  Pill,
  DollarSign,
  ClipboardCheck,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, Badge, Button, Modal, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistDispensingHistoryPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedDispense, setSelectedDispense] = useState(null);

  const { data, loading, error, refetch } = usePharmacistData(
    () =>
      pharmacistApi.getDispensingHistory({
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 50,
      }),
    [search, startDate, endDate]
  );

  const dispensings = data?.dispensings || [];
  const total = data?.pagination?.total || 0;

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Dispensing History & Audit Log
            </h1>
            <Badge variant="primary">{total} Records</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Historical record of all dispensed prescriptions, batch allocations, linked patient invoices, and pharmacist signatures.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            icon={ClipboardCheck}
            onClick={() => navigate('/app/pharmacist/dispensing')}
            style={{ background: '#059669', borderColor: '#047857' }}
          >
            New Dispensation
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
              placeholder="Search by Dispensing #, Rx #, patient name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px', height: '40px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>From:</span>
              <input
                type="date"
                className="auth-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ height: '40px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>To:</span>
              <input
                type="date"
                className="auth-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ height: '40px' }}
              />
            </div>

            {(search || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table Content */}
      {loading ? (
        <LoadingState message="Loading dispensing transaction history..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : dispensings.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Receipt size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Dispensing Records Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            No prescription dispensations match the filter criteria.
          </p>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Dispensing #</th>
                  <th>Prescription #</th>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Items Dispensed</th>
                  <th>Total Billed</th>
                  <th>Invoice Status</th>
                  <th>Pharmacist</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dispensings.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.dispensingNumber}</td>
                    <td style={{ fontWeight: 500 }}>{d.prescription?.prescriptionNumber || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.patient?.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {d.patient?.patientIdNumber}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(d.createdAt).toLocaleString()}</td>
                    <td>{d.items?.length || 0} items</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>
                      ${Number(d.totalAmount).toFixed(2)}
                    </td>
                    <td>
                      <Badge
                        variant={
                          d.invoice?.status === 'PAID'
                            ? 'success'
                            : d.invoice?.status === 'PARTIALLY_PAID'
                            ? 'warning'
                            : 'primary'
                        }
                      >
                        {d.invoice?.status || 'PENDING'}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{d.pharmacist?.fullName || 'Pharmacist'}</td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => setSelectedDispense(d)}
                      >
                        Receipt Slip
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dispense Slip Modal */}
      {selectedDispense && (
        <Modal
          isOpen={!!selectedDispense}
          onClose={() => setSelectedDispense(null)}
          title={`Dispensing Receipt — ${selectedDispense.dispensingNumber}`}
          size="lg"
        >
          <div style={{ padding: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
              <div><strong>Dispensing Number:</strong> {selectedDispense.dispensingNumber}</div>
              <div><strong>Prescription Number:</strong> {selectedDispense.prescription?.prescriptionNumber}</div>
              <div><strong>Patient:</strong> {selectedDispense.patient?.fullName} ({selectedDispense.patient?.patientIdNumber})</div>
              <div><strong>Pharmacist:</strong> {selectedDispense.pharmacist?.fullName || 'Marcus Vance, RPh'}</div>
              <div><strong>Date & Time:</strong> {new Date(selectedDispense.createdAt).toLocaleString()}</div>
              <div><strong>Invoice:</strong> {selectedDispense.invoice?.invoiceNumber || 'Linked Invoice'} ({selectedDispense.invoice?.status || 'PENDING'})</div>
            </div>

            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>Dispensed Medication Lines:</div>
            <table className="med-data-table" style={{ width: '100%', marginBottom: '16px', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch Number</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedDispense.items?.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600 }}>{i.medicineNameSnapshot}</td>
                    <td>{i.batchNumberSnapshot}</td>
                    <td>{i.quantity}</td>
                    <td>${Number(i.unitPriceSnapshot).toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>${Number(i.totalPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700 }}>Total Billed Charge:</td>
                  <td style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
                    ${Number(selectedDispense.totalAmount).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {selectedDispense.notes && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                <strong>Notes:</strong> {selectedDispense.notes}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <Button
              variant="outline"
              icon={Printer}
              onClick={() => window.print()}
            >
              Print Receipt Slip
            </Button>
            <Button
              variant="primary"
              onClick={() => setSelectedDispense(null)}
              style={{ background: '#059669', borderColor: '#047857' }}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PharmacistDispensingHistoryPage;
