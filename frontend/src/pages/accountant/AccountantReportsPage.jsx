import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  Clock,
  DollarSign,
  PieChart,
  CheckCircle2,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils/financeFormatters';

export const AccountantReportsPage = () => {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'department' | 'aging' | 'income'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report Data
  const [dailyData, setDailyData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [agingData, setAgingData] = useState(null);
  const [incomeData, setIncomeData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      if (activeTab === 'daily') {
        const res = await accountantApi.getDailyCollectionsReport(params);
        setDailyData(res.data?.dailyCollections || res.data || []);
      } else if (activeTab === 'department') {
        const res = await accountantApi.getDepartmentRevenueReport(params);
        setDeptData(res.data?.departments || res.data || []);
      } else if (activeTab === 'aging') {
        const res = await accountantApi.getOutstandingAging(params);
        setAgingData(res.data || res);
      } else if (activeTab === 'income') {
        const res = await accountantApi.getIncomeSummaryReport(params);
        setIncomeData(res.data || res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load financial report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, startDate, endDate]);

  const handleExport = (reportType) => {
    const url = accountantApi.getExportUrl(reportType, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    window.open(url, '_blank');
  };

  // Compute maximum for department SVG chart
  const maxDeptRevenue = Math.max(...deptData.map((d) => Number(d.totalAmount || d.revenue || 0)), 1000);

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={28} color="#00d2b4" /> Financial Reports & Analytics Hub
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Hospital revenue cycles, daily collection summaries, department billing breakdown, and CSV exports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer size={14} style={{ marginRight: '6px' }} /> Print Report
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleExport(activeTab)}>
            <Download size={14} style={{ marginRight: '6px' }} /> Export CSV
          </Button>
        </div>
      </div>

      {/* 2. Report Navigation Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          style={{
            background: activeTab === 'daily' ? '#00d2b4' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: activeTab === 'daily' ? '#091a29' : '#f8fafc',
            fontWeight: '700',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('daily')}
        >
          Daily Collections
        </button>

        <button
          type="button"
          style={{
            background: activeTab === 'department' ? '#00d2b4' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: activeTab === 'department' ? '#091a29' : '#f8fafc',
            fontWeight: '700',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('department')}
        >
          Department Revenue
        </button>

        <button
          type="button"
          style={{
            background: activeTab === 'aging' ? '#00d2b4' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: activeTab === 'aging' ? '#091a29' : '#f8fafc',
            fontWeight: '700',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('aging')}
        >
          Accounts Receivable Aging
        </button>

        <button
          type="button"
          style={{
            background: activeTab === 'income' ? '#00d2b4' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: activeTab === 'income' ? '#091a29' : '#f8fafc',
            fontWeight: '700',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('income')}
        >
          Income Statement Summary
        </button>
      </div>

      {/* 3. Date Filter Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              From Date
            </label>
            <input
              type="date"
              className="med-form-input"
              style={{ width: '100%' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              To Date
            </label>
            <input
              type="date"
              className="med-form-input"
              style={{ width: '100%' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div>
            <Button variant="outline" size="md" onClick={fetchReports} style={{ width: '100%' }}>
              <RefreshCw size={14} style={{ marginRight: '6px' }} /> Update Report
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Tab 1: Daily Collections Report */}
      {activeTab === 'daily' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: 0 }}>
              Daily Collections Ledger
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
              Showing {dailyData.length} active collection days
            </span>
          </div>

          {loading ? (
            <LoadingState message="Aggregating daily receipts..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchReports} />
          ) : dailyData.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
              No collections found for the selected period.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="med-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', color: '#94a3b8' }}>DATE</th>
                    <th style={{ padding: '10px 12px', color: '#94a3b8' }}>TRANSACTION COUNT</th>
                    <th style={{ padding: '10px 12px', color: '#94a3b8' }}>CASH</th>
                    <th style={{ padding: '10px 12px', color: '#94a3b8' }}>CARD / POS</th>
                    <th style={{ padding: '10px 12px', color: '#94a3b8' }}>UPI / ONLINE</th>
                    <th style={{ padding: '10px 12px', color: '#94a3b8' }}>INSURANCE / OTHER</th>
                    <th style={{ padding: '10px 12px', color: '#94a3b8', textAlign: 'right' }}>DAILY TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#00d2b4' }}>
                        {formatDate(row.date)}
                      </td>
                      <td style={{ padding: '12px' }}>{row.count || row.transactionCount || 0} receipts</td>
                      <td style={{ padding: '12px' }}>{formatCurrency(row.cash || 0)}</td>
                      <td style={{ padding: '12px' }}>{formatCurrency(row.card || 0)}</td>
                      <td style={{ padding: '12px' }}>{formatCurrency(row.upi || 0)}</td>
                      <td style={{ padding: '12px' }}>{formatCurrency(row.insurance || row.other || 0)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>
                        {formatCurrency(row.total || row.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 5. Tab 2: Department Revenue Report */}
      {activeTab === 'department' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Department Chart Card */}
          <Card>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: '0 0 16px' }}>
              Department Revenue Breakdown
            </h3>
            {deptData.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                No department revenue data available.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {deptData.map((d, idx) => {
                  const rev = Number(d.totalAmount || d.revenue || 0);
                  const widthPct = Math.min(100, Math.max(5, (rev / maxDeptRevenue) * 100));
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-main, #f8fafc)' }}>
                          {d.department || d.name}
                        </span>
                        <span style={{ fontWeight: '800', color: '#00d2b4' }}>
                          {formatCurrency(rev)}
                        </span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${widthPct}%`,
                            background: 'linear-gradient(90deg, #00d2b4, #3b82f6)',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Department Table */}
          <Card>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: '0 0 16px' }}>
              Itemized Department Ledger
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="med-table" style={{ width: '100%', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', color: '#94a3b8' }}>DEPARTMENT</th>
                    <th style={{ padding: '8px 10px', color: '#94a3b8' }}>ITEMS BILLED</th>
                    <th style={{ padding: '8px 10px', color: '#94a3b8', textAlign: 'right' }}>GROSS REVENUE</th>
                  </tr>
                </thead>
                <tbody>
                  {deptData.map((d, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '10px', fontWeight: '600', color: 'var(--text-main, #f8fafc)' }}>
                        {d.department || d.name}
                      </td>
                      <td style={{ padding: '10px' }}>{d.itemCount || d.count || 0}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#00d2b4' }}>
                        {formatCurrency(d.totalAmount || d.revenue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 6. Tab 3: Aging Analysis Report */}
      {activeTab === 'aging' && (
        <Card>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: '0 0 16px' }}>
            Accounts Receivable Aging Analysis
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981' }}>0 – 30 DAYS (CURRENT)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                {formatCurrency(agingData?.agingSummary?.current || 0)}
              </div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f59e0b' }}>31 – 60 DAYS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
                {formatCurrency(agingData?.agingSummary?.thirtyToSixty || 0)}
              </div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(251, 146, 60, 0.08)', border: '1px solid rgba(251, 146, 60, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fb923c' }}>61 – 90 DAYS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fb923c', marginTop: '4px' }}>
                {formatCurrency(agingData?.agingSummary?.sixtyToNinety || 0)}
              </div>
            </div>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ef4444' }}>90+ DAYS (OVERDUE)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
                {formatCurrency(agingData?.agingSummary?.overNinety || 0)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 7. Tab 4: Income Statement Summary */}
      {activeTab === 'income' && (
        <Card>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', margin: '0 0 16px' }}>
            Hospital Operating Income Statement
          </h3>

          <div style={{ maxWidth: '520px', margin: '0 auto', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
              <span style={{ color: '#94a3b8' }}>Gross Invoiced Billings:</span>
              <span style={{ fontWeight: '700', color: '#f8fafc' }}>{formatCurrency(incomeData?.totalInvoiced || 0)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem', color: '#10b981' }}>
              <span>Settled Cash Collections:</span>
              <span style={{ fontWeight: '700' }}>+{formatCurrency(incomeData?.totalCollected || 0)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem', color: '#a855f7' }}>
              <span>Patient Refunds & Reversals:</span>
              <span style={{ fontWeight: '700' }}>-{formatCurrency(incomeData?.totalRefunds || 0)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem', color: '#ef4444' }}>
              <span>Operational Hospital Expenses:</span>
              <span style={{ fontWeight: '700' }}>-{formatCurrency(incomeData?.totalExpenses || 0)}</span>
            </div>

            <div style={{ borderTop: '2px solid rgba(255, 255, 255, 0.1)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800' }}>
              <span style={{ color: '#f8fafc' }}>Net Operating Margin:</span>
              <span style={{ color: Number(incomeData?.netOperatingIncome || 0) >= 0 ? '#00d2b4' : '#ef4444' }}>
                {formatCurrency(incomeData?.netOperatingIncome || 0)}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AccountantReportsPage;
