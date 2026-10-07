import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Wallet,
  RotateCcw,
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '../../utils/financeFormatters';

export const AccountantTransactionsPage = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalCredits: 0, totalDebits: 0, netCashFlow: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [direction, setDirection] = useState(''); // '' | 'CREDIT' | 'DEBIT'
  const [type, setType] = useState(''); // '' | 'PAYMENT' | 'REFUND' | 'EXPENSE'
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 25 });

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        direction: direction || undefined,
        type: type || undefined,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 25,
      };

      const res = await accountantApi.getTransactions(params);
      const data = res.data || res;
      setTransactions(data.transactions || []);
      setPagination(data.pagination || { total: 0, totalPages: 1, limit: 25 });
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setError(err.message || 'Failed to load transaction ledger stream');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 250);
    return () => clearTimeout(timer);
  }, [direction, type, search, startDate, endDate, page]);

  const handleExportCsv = () => {
    const url = accountantApi.getExportUrl('transactions', {
      direction: direction || undefined,
      type: type || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="med-page-container">
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowLeftRight size={28} color="#00d2b4" /> Derived Financial Ledger Stream
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Real-time unified audit stream synthesizing all cash inflows (payments) and outflows (refunds, expenses).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={fetchTransactions}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportCsv}>
            <Download size={14} style={{ marginRight: '6px' }} /> Export CSV
          </Button>
        </div>
      </div>

      {/* 2. Top Summary Stream Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '24px' }}>
        {/* Total Inflow (Credits) */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase' }}>
                TOTAL CASH INFLOW (CREDITS)
              </span>
              <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                +{formatCurrency(summary.totalCredits)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                Patient Payments & Insurance Remittances
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <ArrowDownRight size={22} />
            </div>
          </div>
        </Card>

        {/* Total Outflow (Debits) */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase' }}>
                TOTAL CASH OUTFLOW (DEBITS)
              </span>
              <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
                -{formatCurrency(summary.totalDebits)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                Operational Expenses & Patient Refunds
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <ArrowUpRight size={22} />
            </div>
          </div>
        </Card>

        {/* Net Cash Flow */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: Number(summary.netCashFlow) >= 0 ? '#00d2b4' : '#ef4444', textTransform: 'uppercase' }}>
                NET OPERATING CASH FLOW
              </span>
              <div style={{ fontSize: '1.55rem', fontWeight: '800', color: Number(summary.netCashFlow) >= 0 ? '#00d2b4' : '#ef4444', marginTop: '4px' }}>
                {formatCurrency(summary.netCashFlow)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                {summary.count} Total Stream Transactions
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 210, 180, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d2b4' }}>
              <TrendingUp size={22} />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Filter Controls Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Search Description, Ref, Party
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="med-form-input"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="Search ledger..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Cash Flow Direction
            </label>
            <select
              className="med-form-select"
              style={{ width: '100%' }}
              value={direction}
              onChange={(e) => { setDirection(e.target.value); setPage(1); }}
            >
              <option value="">All Directions</option>
              <option value="CREDIT">CREDIT (Inflow +)</option>
              <option value="DEBIT">DEBIT (Outflow -)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              Transaction Type
            </label>
            <select
              className="med-form-select"
              style={{ width: '100%' }}
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
            >
              <option value="">All Stream Types</option>
              <option value="PAYMENT">PAYMENT (Patient Inflow)</option>
              <option value="REFUND">REFUND (Patient Outflow)</option>
              <option value="EXPENSE">EXPENSE (Vendor Outflow)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px' }}>
              From Date
            </label>
            <input
              type="date"
              className="med-form-input"
              style={{ width: '100%' }}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
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
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </Card>

      {/* 4. Unified Ledger Table */}
      {loading ? (
        <LoadingState message="Deriving unified financial ledger stream..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTransactions} />
      ) : transactions.length === 0 ? (
        <Card>
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <ArrowLeftRight size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Transactions Recorded
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              No transactions match the selected filter parameters.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="med-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>FLOW</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>TIMESTAMP</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>TYPE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>DESCRIPTION / REFERENCE</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>COUNTERPARTY</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>METHOD</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => {
                  const isCredit = tx.direction === 'CREDIT';
                  return (
                    <tr key={tx.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '14px 14px' }}>
                        <span
                          style={{
                            background: isCredit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isCredit ? '#10b981' : '#ef4444',
                            border: `1px solid ${isCredit ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          {isCredit ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                          {tx.direction}
                        </span>
                      </td>

                      <td style={{ padding: '14px 14px', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {formatDate(tx.transactionDate, true)}
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <Badge variant={tx.type === 'PAYMENT' ? 'teal' : tx.type === 'REFUND' ? 'purple' : 'neutral'}>
                          {tx.type}
                        </Badge>
                      </td>

                      <td style={{ padding: '14px 14px', fontSize: '0.88rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main, #f8fafc)' }}>
                          {tx.description}
                        </div>
                        {tx.referenceNumber && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                            Ref: {tx.referenceNumber}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 14px', fontSize: '0.85rem', color: 'var(--text-main, #f8fafc)' }}>
                        {tx.counterparty || '—'}
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {tx.paymentMethod || 'DIRECT'}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '14px 14px',
                          textAlign: 'right',
                          fontWeight: '800',
                          fontSize: '1rem',
                          color: isCredit ? '#10b981' : '#ef4444',
                        }}
                      >
                        {isCredit ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 8px 0',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                marginTop: '12px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                Page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} transactions)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft size={14} style={{ marginRight: '4px' }} /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}>
                  Next <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AccountantTransactionsPage;
