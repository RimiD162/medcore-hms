import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Microscope,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Eye,
  Printer,
  Calendar,
  User,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, Input, LoadingState, ErrorState } from '../../components/ui';

export const LabReportsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('');

  const { data, loading, error, refetch } = useLabData(
    () =>
      labApi.getReports({
        search: search || undefined,
        status: statusFilter || undefined,
        overallFlag: flagFilter || undefined,
      }),
    [search, statusFilter, flagFilter]
  );

  const reports = data?.reports || [];

  const getFlagBadgeVariant = (flag) => {
    switch (flag) {
      case 'CRITICAL':
        return 'danger';
      case 'ABNORMAL':
      case 'HIGH':
      case 'LOW':
        return 'warning';
      case 'NORMAL':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'RELEASED':
      case 'VERIFIED':
        return 'success';
      case 'COMPLETED':
        return 'primary';
      case 'DRAFT':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="med-page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Diagnostic Reports & Verification Hub
            </h1>
            <Badge variant="primary">{reports.length} Reports</Badge>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Peer verification, clinical sign-off, amended revision tracking, and final report release to EMR.
          </p>
        </div>

        <Button
          variant="outline"
          icon={Activity}
          onClick={() => navigate('/app/lab/worklist')}
        >
          Result Worklist &rarr;
        </Button>
      </div>

      {/* Filter Bar */}
      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'center' }}>
          <div>
            <Input
              placeholder="Search by Report # (e.g. RPT-2026-0001) or Patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>

          <div>
            <select
              className="med-select-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            >
              <option value="">All Report Statuses</option>
              <option value="RELEASED">RELEASED (Available in EMR)</option>
              <option value="VERIFIED">VERIFIED (Scientist Signed)</option>
              <option value="COMPLETED">COMPLETED (Pending Verification)</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>

          <div>
            <select
              className="med-select-field"
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            >
              <option value="">All Technical Flags</option>
              <option value="CRITICAL">CRITICAL Values</option>
              <option value="ABNORMAL">ABNORMAL Values</option>
              <option value="NORMAL">NORMAL Range</option>
            </select>
          </div>

          {(search || statusFilter || flagFilter) && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setFlagFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Reports List */}
      {loading ? (
        <LoadingState message="Loading diagnostic reports..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : reports.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Microscope size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            No Diagnostic Reports Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            {search || statusFilter || flagFilter
              ? 'No reports match your selected criteria.'
              : 'Completed diagnostic investigations will appear here for peer verification and release.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports.map((report) => (
            <Card
              key={report.id}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '16px 20px',
                border: report.overallFlag === 'CRITICAL' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                background: report.overallFlag === 'CRITICAL' ? 'rgba(239, 68, 68, 0.03)' : 'var(--card-bg)',
              }}
              onClick={() => navigate(`/app/lab/reports/${report.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                {/* Left: Report Number, Flag, Status */}
                <div style={{ minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.05rem', color: '#8b5cf6' }}>
                      {report.reportNumber}
                    </span>
                    <Badge variant={getFlagBadgeVariant(report.overallFlag)}>
                      {report.overallFlag || 'NORMAL'}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(report.status)}>
                      {report.status}
                    </Badge>
                    {report.isAmended && (
                      <Badge variant="warning">AMENDED</Badge>
                    )}
                  </div>

                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Order Ref: <strong style={{ color: '#8b5cf6' }}>{report.order?.orderNumber}</strong>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Generated on {new Date(report.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Middle: Patient & Doctor */}
                <div style={{ flex: '1 1 280px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {report.order?.patient?.fullName || 'Patient Name'}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '6px' }}>
                      (MRN: {report.order?.patient?.patientId || 'N/A'})
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Attending: Dr. {report.order?.orderingDoctor?.user?.fullName || report.order?.orderingDoctor?.fullName || 'Physician'}
                  </div>

                  {report.verifiedBy && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#10b981', marginTop: '3px' }}>
                      <ShieldCheck size={13} />
                      <span>Verified by: {report.verifiedBy?.user?.fullName || report.verifiedBy?.fullName || 'Medical Lab Scientist'}</span>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button variant="outline" size="sm" icon={Eye}>
                    View Report &rarr;
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabReportsPage;
