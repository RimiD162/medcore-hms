import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Pill,
  Boxes,
  ClipboardList,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Receipt,
  CreditCard,
  DollarSign,
  ArrowRight,
  Sparkles,
  Search,
  PlusCircle,
  FilePlus,
  Clock,
  ShieldCheck,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, StatCard, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistDashboardPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};
  const { data: dashboard, loading, error, refetch } = usePharmacistData(pharmacistApi.getDashboard);

  if (loading) {
    return <LoadingState message="Connecting to MedCore Pharmacy & Inventory Engine..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const stats = dashboard?.stats || {};
  const pendingPrescriptions = dashboard?.pendingPrescriptions || [];
  const lowStockAlerts = dashboard?.lowStockAlerts || [];
  const recentTransactions = dashboard?.recentTransactions || [];

  return (
    <div className="med-dashboard-view">
      {/* 1. Pharmacist Shift Header Banner */}
      <Card
        className="med-receptionist-banner-card"
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.15), rgba(6, 19, 31, 0.8))',
          border: '1px solid rgba(5, 150, 105, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              }}
            >
              <Pill size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Central Pharmacy & Dispensary
                </h1>
                <Badge variant="success" dot>
                  FEFO Live
                </Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Pharmacist On Duty: <strong style={{ color: 'var(--text-primary)' }}>Marcus Vance, RPh</strong> (License: RPH-2024-8849) • Station: Central Dispensary
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button
              variant="outline"
              size="sm"
              icon={FilePlus}
              onClick={() => navigate('/app/pharmacist/medicines/new')}
            >
              Add Medicine
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Boxes}
              onClick={() => navigate('/app/pharmacist/inventory')}
            >
              Receive Stock
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => navigate('/app/pharmacist/dispensing')}
              style={{ background: '#059669', borderColor: '#047857' }}
            >
              Dispense Rx
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Key Metrics Grid (StatCards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          title="Active Formulations"
          value={stats.totalMedicines || 0}
          icon={Pill}
          color="emerald"
          change="In Catalog"
          changeType="neutral"
        />
        <StatCard
          title="Usable Stock Units"
          value={stats.totalStockUnits || 0}
          icon={Boxes}
          color="cyan"
          change="Active Batches"
          changeType="positive"
        />
        <StatCard
          title="Pending Rx Queue"
          value={stats.pendingPrescriptions || 0}
          icon={ClipboardList}
          color="amber"
          change={stats.pendingPrescriptions > 0 ? 'Action Required' : 'All Clear'}
          changeType={stats.pendingPrescriptions > 0 ? 'warning' : 'positive'}
        />
        <StatCard
          title="Dispensed Today"
          value={stats.prescriptionsDispensedToday || 0}
          icon={CheckCircle2}
          color="emerald"
          change="Orders Fulfilled"
          changeType="positive"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockMedicines || 0}
          icon={AlertTriangle}
          color="rose"
          change={stats.lowStockMedicines > 0 ? 'Below Reorder' : 'Healthy'}
          changeType={stats.lowStockMedicines > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          title="Today's Pharmacy Sales"
          value={`$${Number(stats.todayBilledSales || 0).toFixed(2)}`}
          icon={DollarSign}
          color="blue"
          change="Billed to Invoices"
          changeType="positive"
        />
      </div>

      {/* 3. Main Split View: Pending Queue & Alert Sidebar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {/* Left: Live Pending Prescription Queue */}
        <Card
          style={{ gridColumn: 'span 2', minWidth: '0' }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={18} color="#059669" />
                <span>Pending Prescriptions Queue</span>
                <Badge variant="warning">{pendingPrescriptions.length} Active</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigate('/app/pharmacist/prescriptions')}
              >
                View Full Queue
              </Button>
            </div>
          }
        >
          {pendingPrescriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={40} color="#059669" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                Prescription Queue is Clear
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>No pending prescriptions awaiting verification or dispensing.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingPrescriptions.map((rx) => {
                const unmappedCount = rx.items.filter((i) => !i.medicineId).length;
                const isFullyMapped = unmappedCount === 0;

                return (
                  <div
                    key={rx.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      background: rx.onHold
                        ? 'rgba(239, 68, 68, 0.06)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: rx.onHold
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: '1 1 240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {rx.prescriptionNumber}
                        </span>
                        {rx.onHold ? (
                          <Badge variant="danger">On Hold: {rx.holdReason}</Badge>
                        ) : (
                          <Badge variant={rx.dispensingStatus === 'PARTIALLY_DISPENSED' ? 'warning' : 'primary'}>
                            {rx.dispensingStatus}
                          </Badge>
                        )}
                        {!isFullyMapped && !rx.onHold && (
                          <Badge variant="warning">{unmappedCount} Unmapped Item{unmappedCount > 1 ? 's' : ''}</Badge>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Patient: <strong style={{ color: 'var(--text-primary)' }}>{rx.patient?.fullName}</strong> ({rx.patient?.patientIdNumber}) • Dr. {rx.doctor?.user?.fullName} ({rx.doctor?.department})
                      </div>

                      {rx.patient?.allergies && rx.patient.allergies.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <AlertCircle size={13} color="#ef4444" />
                          <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                            Allergies: {rx.patient.allergies.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        disabled={rx.onHold || !isFullyMapped}
                        onClick={() => navigate(`/app/pharmacist/dispensing?rxId=${rx.id}`)}
                        style={{ background: '#059669', borderColor: '#047857' }}
                      >
                        Dispense
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: Low Stock & Expiry Alerts Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Low Stock Alert Box */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                  <span>Low Stock Warnings</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/app/pharmacist/low-stock')}
                >
                  View All
                </Button>
              </div>
            }
          >
            {lowStockAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                All medicines are at healthy inventory levels.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lowStockAlerts.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: item.isOutOfStock ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.08)',
                      border: item.isOutOfStock ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(245,158,11,0.2)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Stock: <strong style={{ color: item.isOutOfStock ? '#ef4444' : '#f59e0b' }}>{item.usableStock} {item.unit}</strong> (Reorder: {item.reorderLevel})
                      </div>
                    </div>
                    <Badge variant={item.isOutOfStock ? 'danger' : 'warning'}>
                      {item.isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions Card */}
          <Card title="Pharmacy Operations">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Button
                variant="outline"
                size="sm"
                icon={Boxes}
                onClick={() => navigate('/app/pharmacist/inventory')}
                style={{ justifyContent: 'flex-start', padding: '10px' }}
              >
                Stock Matrix
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={CalendarClock}
                onClick={() => navigate('/app/pharmacist/expiry')}
                style={{ justifyContent: 'flex-start', padding: '10px' }}
              >
                Expiry Buckets
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Receipt}
                onClick={() => navigate('/app/pharmacist/dispensing/history')}
                style={{ justifyContent: 'flex-start', padding: '10px' }}
              >
                Dispense Log
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={CreditCard}
                onClick={() => navigate('/app/pharmacist/sales')}
                style={{ justifyContent: 'flex-start', padding: '10px' }}
              >
                Sales Ledger
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Recent Stock Ledger Transactions */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#059669" />
              <span>Recent Inventory Transactions (Append-Only Ledger)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/app/pharmacist/transactions')}
            >
              Full Ledger History
            </Button>
          </div>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="med-data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Tx Number</th>
                <th>Medicine & Batch</th>
                <th>Type</th>
                <th>Change</th>
                <th>Balance After</th>
                <th>Reason / Note</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No stock transactions recorded yet.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => {
                  const isPositive = tx.quantityChange > 0;
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.transactionNumber}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{tx.medicine?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Batch: {tx.batch?.batchNumber}
                        </div>
                      </td>
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
                        {tx.reason || '—'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{tx.performedBy?.fullName || 'System'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PharmacistDashboardPage;
