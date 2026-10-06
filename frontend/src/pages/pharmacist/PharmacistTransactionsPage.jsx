import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Search,
  Filter,
  Download,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistTransactionsPage = () => {
  const navigate = useNavigate();
  const [type, setType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, loading, error, refetch } = usePharmacistData(
    () =>
      pharmacistApi.getTransactions({
        type: type !== 'ALL' ? type : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      }),
    [type, startDate, endDate]
  );

  const transactions = data?.transactions || [];
  const total = data?.pagination?.total || 0;

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Stock Transaction Ledger
            </h1>
            <Badge variant="primary">{total} Transactions</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Complete append-only audit trail of every stock intake, prescription dispensation, count adjustment, and write-off.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            icon={Boxes}
            onClick={() => navigate('/app/pharmacist/inventory')}
          >
            Inventory Matrix
          </Button>
          <Button
            variant="outline"
            icon={Receipt}
            onClick={() => navigate('/app/pharmacist/dispensing/history')}
          >
            Dispense Log
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="auth-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ height: '40px', minWidth: '180px' }}
            >
              <option value="ALL">All Transaction Types</option>
              <option value="RECEIPT">RECEIPT (Goods Intake)</option>
              <option value="DISPENSE">DISPENSE (Prescription)</option>
              <option value="ADJUSTMENT_INCREASE">ADJUSTMENT_INCREASE</option>
              <option value="ADJUSTMENT_DECREASE">ADJUSTMENT_DECREASE</option>
              <option value="EXPIRY_WRITE_OFF">EXPIRY_WRITE_OFF</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>From:</span>
              <input
                type="date"
                className="auth-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ height: '40px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>To:</span>
              <input
                type="date"
                className="auth-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ height: '40px' }}
              />
            </div>

            {(type !== 'ALL' || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setType('ALL');
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

      {/* Ledger Table */}
      {loading ? (
        <LoadingState message="Loading append-only stock transaction ledger..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : transactions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Clock size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Transactions Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            No transactions match the selected filter criteria.
          </p>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Tx Number</th>
                  <th>Date & Time</th>
                  <th>Medicine</th>
                  <th>Batch Number</th>
                  <th>Transaction Type</th>
                  <th>Quantity Change</th>
                  <th>Balance After</th>
                  <th>Reason / Reference</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isPositive = tx.quantityChange > 0;
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.transactionNumber}</td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(tx.createdAt).toLocaleString()}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.medicine?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {tx.medicine?.medicineCode}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{tx.batch?.batchNumber || '—'}</td>
                      <td>
                        <Badge
                          variant={
                            tx.type === 'RECEIPT'
                              ? 'success'
                              : tx.type === 'DISPENSE'
                              ? 'primary'
                              : tx.type === 'EXPIRY_WRITE_OFF'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {tx.type}
                        </Badge>
                      </td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: isPositive ? '#10b981' : '#ef4444',
                        }}
                      >
                        {isPositive ? `+${tx.quantityChange}` : tx.quantityChange} {tx.medicine?.unit || 'units'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{tx.balanceAfter}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                        {tx.reason || (tx.dispensing ? `Dispensing #${tx.dispensing.dispensingNumber}` : '—')}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{tx.performedBy?.fullName || 'System'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PharmacistTransactionsPage;
