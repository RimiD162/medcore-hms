import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  Receipt,
  User,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, StatCard, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistSalesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, loading, error, refetch } = usePharmacistData(
    () =>
      pharmacistApi.getSales({
        search: search || undefined,
        invoiceStatus: invoiceStatus !== 'ALL' ? invoiceStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 50,
      }),
    [search, invoiceStatus, startDate, endDate]
  );

  const sales = data?.sales || [];
  const summary = data?.summary || {};

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pharmacy Sales & Billing Ledger
            </h1>
            <Badge variant="primary">Read-Only Financial View</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Track all pharmacy line items billed to patient hospital invoices and monitor payment collection status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            icon={Receipt}
            onClick={() => navigate('/app/pharmacist/dispensing/history')}
          >
            Dispense Log
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          title="Total Billed Pharmacy Items"
          value={summary.totalItemsCount || 0}
          icon={Receipt}
          color="emerald"
          change="Medication Lines"
          changeType="positive"
        />
        <StatCard
          title="Total Pharmacy Billed Value"
          value={`$${Number(summary.totalBilledValue || 0).toFixed(2)}`}
          icon={DollarSign}
          color="cyan"
          change="Cumulative Sales"
          changeType="positive"
        />
      </div>

      {/* Filter Toolbar */}
      <Card style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="auth-input"
              placeholder="Search by medication description, invoice #, patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px', height: '40px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="auth-input"
              value={invoiceStatus}
              onChange={(e) => setInvoiceStatus(e.target.value)}
              style={{ height: '40px', minWidth: '150px' }}
            >
              <option value="ALL">All Invoice Statuses</option>
              <option value="PAID">PAID (Settled)</option>
              <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
              <option value="PENDING">PENDING (Open)</option>
            </select>

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

            {(search || invoiceStatus !== 'ALL' || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setInvoiceStatus('ALL');
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

      {/* Sales Table */}
      {loading ? (
        <LoadingState message="Loading billed pharmacy transactions and invoice statuses..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : sales.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <CreditCard size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Billed Pharmacy Items Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            No billed pharmacy items match the selected filter criteria.
          </p>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Service Description & Batch</th>
                  <th>Patient</th>
                  <th>Invoice Number</th>
                  <th>Quantity</th>
                  <th>Unit Rate</th>
                  <th>Line Total</th>
                  <th>Invoice Payment Status</th>
                  <th>Billed Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.serviceName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Category: Pharmacy (Dispensary)</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.invoice?.patient?.fullName || 'Patient'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {item.invoice?.patient?.patientIdNumber}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.invoice?.invoiceNumber || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                    <td>${Number(item.unitPrice).toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>
                      ${Number(item.totalPrice).toFixed(2)}
                    </td>
                    <td>
                      <Badge
                        variant={
                          item.invoice?.status === 'PAID'
                            ? 'success'
                            : item.invoice?.status === 'PARTIALLY_PAID'
                            ? 'warning'
                            : 'primary'
                        }
                      >
                        {item.invoice?.status || 'PENDING'}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
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

export default PharmacistSalesPage;
