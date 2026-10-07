import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Wallet,
  Clock,
  RotateCcw,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';
import { formatCurrency, formatCompactCurrency, formatDate, getStatusBadgeVariant } from '../../utils/financeFormatters';

export const AccountantDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await accountantApi.getDashboard();
      setData(res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load financial dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingState message="Connecting to MedCore Financial Vault & Ledger..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const kpis = data?.kpis || {};
  const recentInvoices = data?.recentInvoices || [];
  const recentPayments = data?.recentPayments || [];
  const recentExpenses = data?.recentExpenses || [];
  const monthlyRevenue = data?.monthlyRevenue || [];
  const aging = data?.agingBreakdown || {};

  // Find max value for pure SVG trend visualization
  const maxTrendVal = Math.max(
    ...monthlyRevenue.map((m) => Math.max(Number(m.invoiced || 0), Number(m.collected || 0))),
    1000
  );

  return (
    <div className="med-page-container">
      {/* 1. Header & Quick Action Hub */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '1.7rem',
                fontWeight: '800',
                color: 'var(--text-main, #f8fafc)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <FileSpreadsheet size={28} color="#d97706" /> Finance & Revenue Operations
            </h1>
            <span
              style={{
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(217, 119, 6, 0.3)',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldCheck size={13} /> Live System Ledger
            </span>
          </div>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.9rem',
              color: 'var(--text-muted, #94a3b8)',
            }}
          >
            Hospital financial health, cash flows, patient billing cycles, and operational expenses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={fetchDashboard} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} style={{ marginRight: '6px' }} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/accountant/invoices/new')}>
            <Plus size={14} style={{ marginRight: '6px' }} /> Create Invoice
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/accountant/payments')}>
            <Wallet size={14} style={{ marginRight: '6px' }} /> Record Payment
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/accountant/expenses')}>
            <CreditCard size={14} style={{ marginRight: '6px' }} /> Log Expense
          </Button>
        </div>
      </div>

      {/* 2. Primary KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        {/* Card 1: Total Invoiced */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                Total Invoiced (All-Time)
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', marginTop: '4px' }}>
                {formatCurrency(kpis.totalInvoiced)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={13} /> {kpis.totalInvoicesCount || 0} Total Hospital Invoices
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(0, 210, 180, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00d2b4',
              }}
            >
              <Receipt size={22} />
            </div>
          </div>
        </Card>

        {/* Card 2: Cash Collected */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                Cash Collected
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                {formatCurrency(kpis.totalCollected)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wallet size={13} /> {kpis.totalPaymentsCount || 0} Completed Receipts
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Wallet size={22} />
            </div>
          </div>
        </Card>

        {/* Card 3: Total Outstanding */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                Outstanding Balances
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: Number(kpis.totalOutstanding) > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
                {formatCurrency(kpis.totalOutstanding)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> {kpis.pendingInvoicesCount || 0} Unpaid / Partial Bills
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <Clock size={22} />
            </div>
          </div>
        </Card>

        {/* Card 4: Net Operating Cash Flow */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                Net Cash Flow
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: Number(kpis.netCashFlow) >= 0 ? '#38bdf8' : '#f87171', marginTop: '4px' }}>
                {formatCurrency(kpis.netCashFlow)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Exp: {formatCompactCurrency(kpis.totalExpenses)}</span> &bull; <span>Ref: {formatCompactCurrency(kpis.totalRefunds)}</span>
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <TrendingUp size={22} />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Monthly Revenue Trend & Aging Buckets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Left: Monthly Invoiced vs Collected SVG Bar Chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: 0 }}>
                Revenue & Collection Trends
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                Comparing gross billed services vs settled cash receipts
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00d2b4' }}>
                <span style={{ width: '10px', height: '10px', background: '#00d2b4', borderRadius: '2px' }} /> Invoiced
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }} /> Collected
              </span>
            </div>
          </div>

          {monthlyRevenue.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
              No monthly trend data recorded yet.
            </div>
          ) : (
            <div style={{ height: '190px', display: 'flex', alignItems: 'flex-end', gap: '14px', paddingTop: '20px' }}>
              {monthlyRevenue.map((item, idx) => {
                const invoicedHeight = Math.max(6, (Number(item.invoiced || 0) / maxTrendVal) * 130);
                const collectedHeight = Math.max(6, (Number(item.collected || 0) / maxTrendVal) * 130);
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                      {/* Invoiced Bar */}
                      <div
                        title={`Invoiced: ${formatCurrency(item.invoiced)}`}
                        style={{
                          width: '14px',
                          height: `${invoicedHeight}px`,
                          background: 'linear-gradient(180deg, #00d2b4, rgba(0, 210, 180, 0.4))',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease',
                          cursor: 'pointer',
                        }}
                      />
                      {/* Collected Bar */}
                      <div
                        title={`Collected: ${formatCurrency(item.collected)}`}
                        style={{
                          width: '14px',
                          height: `${collectedHeight}px`,
                          background: 'linear-gradient(180deg, #10b981, rgba(16, 185, 129, 0.4))',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease',
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '8px', whiteSpace: 'nowrap' }}>
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: Accounts Receivable Aging Buckets */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: 0 }}>
                Accounts Receivable Aging
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                Outstanding dues segmented by invoice maturity
              </p>
            </div>
            <Button variant="outline" size="xs" onClick={() => navigate('/app/accountant/outstanding')}>
              View All &rarr;
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* 0-30 Days */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981' }}>0 – 30 DAYS (CURRENT)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', marginTop: '4px' }}>
                {formatCurrency(aging.current || 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>Standard terms</div>
            </div>

            {/* 31-60 Days */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#f59e0b' }}>31 – 60 DAYS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', marginTop: '4px' }}>
                {formatCurrency(aging.thirtyToSixty || 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>Follow-up notice</div>
            </div>

            {/* 61-90 Days */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#fb923c' }}>61 – 90 DAYS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', marginTop: '4px' }}>
                {formatCurrency(aging.sixtyToNinety || 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>Urgent settlement</div>
            </div>

            {/* 90+ Days */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ef4444' }}>90+ DAYS (OVERDUE)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
                {formatCurrency(aging.overNinety || 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '2px' }}>High collection risk</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Recent Financial Streams (Invoices & Payments) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Recent Invoices */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} color="#00d2b4" /> Recent Invoices
            </h3>
            <Button variant="outline" size="xs" onClick={() => navigate('/app/accountant/invoices')}>
              View All Invoices &rarr;
            </Button>
          </div>

          {recentInvoices.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.88rem' }}>
              No recent invoices found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="med-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', color: '#94a3b8' }}>INVOICE</th>
                    <th style={{ padding: '8px 10px', color: '#94a3b8' }}>PATIENT</th>
                    <th style={{ padding: '8px 10px', color: '#94a3b8' }}>TOTAL</th>
                    <th style={{ padding: '8px 10px', color: '#94a3b8' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', cursor: 'pointer' }}
                      onClick={() => navigate(`/app/accountant/invoices/${inv.id}`)}
                    >
                      <td style={{ padding: '10px 10px', fontWeight: '700', color: '#00d2b4' }}>
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)' }}>
                          {inv.patient?.fullName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {inv.patient?.patientIdNumber}
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', fontWeight: '700' }}>
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <Badge variant={getStatusBadgeVariant(inv.status)}>
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Payments */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={18} color="#10b981" /> Recent Collections
            </h3>
            <Button variant="outline" size="xs" onClick={() => navigate('/app/accountant/payments')}>
              View All Payments &rarr;
            </Button>
          </div>

          {recentPayments.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.88rem' }}>
              No recent payments recorded.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="med-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', color: '#94a3b8' }}>RECEIPT #</th>
                    <th style={{ padding: '8px 10px', color: '#94a3b8' }}>INVOICE</th>
                    <th style={{ padding: '8px 10px', color: '#94a3b8' }}>AMOUNT</th>
                    <th style={{ padding: '8px 10px', color: '#94a3b8' }}>METHOD</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((pmt) => (
                    <tr
                      key={pmt.id}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', cursor: 'pointer' }}
                      onClick={() => navigate(`/app/accountant/payments?receipt=${pmt.receiptNumber}`)}
                    >
                      <td style={{ padding: '10px 10px', fontWeight: '700', color: '#10b981' }}>
                        {pmt.receiptNumber}
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-muted, #94a3b8)' }}>
                        {pmt.invoice?.invoiceNumber || '—'}
                      </td>
                      <td style={{ padding: '10px 10px', fontWeight: '700', color: '#10b981' }}>
                        +{formatCurrency(pmt.amount)}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                          }}
                        >
                          {pmt.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AccountantDashboardPage;
