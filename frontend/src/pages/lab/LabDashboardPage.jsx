import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  TestTube,
  Microscope,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Search,
  User,
  FlaskConical,
  FileCheck,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, StatCard, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const LabDashboardPage = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useLabData(() => labApi.getDashboard());

  const stats = data?.stats || {
    pendingOrders: 0,
    urgentOrders: 0,
    pendingSamples: 0,
    receivedSamples: 0,
    inProcessingSamples: 0,
    completedResultsToday: 0,
    releasedReportsToday: 0,
    criticalResultsCount: 0,
  };

  const urgentOrders = data?.urgentOrders || [];
  const recentReports = data?.recentReports || [];

  return (
    <div className="med-page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Header with Title and Quick Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Diagnostic Laboratory Hub
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'rgba(124, 58, 237, 0.12)',
                color: '#8b5cf6',
                border: '1px solid rgba(124, 58, 237, 0.25)',
              }}
            >
              <FlaskConical size={12} /> Clinical Pathology & Biochemistry
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Real-time diagnostic workflow, specimen chain of custody, analyzer result entry, and verified report release.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={refetch}
            disabled={loading}
          >
            Refresh Data
          </Button>
          <Button
            variant="primary"
            icon={TestTube}
            onClick={() => navigate('/app/lab/samples')}
          >
            Collect Specimen
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading laboratory dashboard metrics & queues..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {/* 2. Critical Alert Banner if critical results exist */}
          {stats.criticalResultsCount > 0 && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.05))',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>
                    {stats.criticalResultsCount} Critical Biomarker Alert{stats.criticalResultsCount > 1 ? 's' : ''} Require Immediate Attention
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Biomarker assay values breached panic thresholds. Prompt clinician notification is recommended.
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={AlertCircle}
                onClick={() => navigate('/app/lab/critical-alerts')}
              >
                Open Critical Alert Queue &rarr;
              </Button>
            </div>
          )}

          {/* 3. Key Operational Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            <StatCard
              title="Pending Specimen Intake"
              value={stats.pendingSamples}
              subtitle="Awaiting positive ID check & draw"
              icon={TestTube}
              trend={{ direction: 'neutral', label: 'Draw Queue' }}
              accentColor="#3b82f6"
            />
            <StatCard
              title="Active In-Lab Worklist"
              value={stats.inProcessingSamples + stats.receivedSamples}
              subtitle={`${stats.receivedSamples} Received &bull; ${stats.inProcessingSamples} In Analyzer`}
              icon={Activity}
              trend={{ direction: 'up', label: 'Processing' }}
              accentColor="#8b5cf6"
            />
            <StatCard
              title="Verified Reports Today"
              value={stats.releasedReportsToday}
              subtitle="Signed & released to Doctor EMR"
              icon={Microscope}
              trend={{ direction: 'up', label: '+ Today' }}
              accentColor="#10b981"
            />
            <StatCard
              title="STAT / Urgent Orders"
              value={stats.urgentOrders}
              subtitle="High priority turnaround"
              icon={Clock}
              trend={{ direction: stats.urgentOrders > 0 ? 'down' : 'neutral', label: 'Priority SLA' }}
              accentColor="#f59e0b"
            />
          </div>

          {/* 4. Quick Action Pathways */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            <Card
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.04), transparent)',
              }}
              onClick={() => navigate('/app/lab/samples')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TestTube size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Specimen Collection
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Positive Patient ID & Barcode Draw
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-secondary)" />
              </div>
            </Card>

            <Card
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.04), transparent)',
              }}
              onClick={() => navigate('/app/lab/worklist')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: '#8b5cf6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Activity size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Result Entry Worklist
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Auto Technical Range Flagging
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-secondary)" />
              </div>
            </Card>

            <Card
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.04), transparent)',
              }}
              onClick={() => navigate('/app/lab/reports')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Microscope size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Reports & Verification
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Separate Verifier Sign-off & PDF
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-secondary)" />
              </div>
            </Card>

            <Card
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.04), transparent)',
              }}
              onClick={() => navigate('/app/lab/catalog')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FlaskConical size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Test Catalog & Ranges
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Multi-Parameter Reference Norms
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-secondary)" />
              </div>
            </Card>
          </div>

          {/* 5. Main Split Section: STAT / Urgent Queue vs Recent Released Reports */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
            {/* Urgent & STAT Orders Queue */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Urgent & STAT Diagnostic Orders
                  </h3>
                  <Badge variant="warning">{urgentOrders.length}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/app/lab/orders')}
                >
                  View All Orders &rarr;
                </Button>
              </div>

              {urgentOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No urgent diagnostic orders in queue</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>All STAT requests have been triaged and processed.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {urgentOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/app/lab/orders/${order.id}`)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {order.orderNumber}
                          </span>
                          <Badge variant={order.priority === 'STAT' ? 'danger' : 'warning'}>
                            {order.priority}
                          </Badge>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          Patient: <strong style={{ color: 'var(--text-primary)' }}>{order.patient?.fullName || 'Anonymous'}</strong> ({order.patient?.patientId || 'N/A'})
                          &bull; Ordering: Dr. {order.orderingDoctor?.user?.fullName || 'Staff'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#8b5cf6', marginTop: '3px' }}>
                          {order.items?.map((i) => i.test?.name).join(', ') || 'Diagnostic Tests'}
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        Process &rarr;
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recently Released Verified Diagnostic Reports */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Recent Verified Reports
                  </h3>
                  <Badge variant="success">{recentReports.length}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/app/lab/reports')}
                >
                  View All Reports &rarr;
                </Button>
              </div>

              {recentReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}>
                  <Microscope size={36} color="var(--text-secondary)" style={{ margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No reports finalized today yet</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Completed reports awaiting verification will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentReports.slice(0, 5).map((report) => (
                    <div
                      key={report.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/app/lab/reports/${report.id}`)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {report.reportNumber}
                          </span>
                          <Badge variant={report.isAmended ? 'warning' : 'success'}>
                            {report.isAmended ? 'AMENDED' : report.status}
                          </Badge>
                          {report.overallFlag === 'CRITICAL' && (
                            <Badge variant="danger">CRITICAL</Badge>
                          )}
                        </div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          Patient: <strong style={{ color: 'var(--text-primary)' }}>{report.order?.patient?.fullName || 'Patient'}</strong>
                          &bull; Order: {report.order?.orderNumber}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Verified By: {report.verifiedBy?.user?.fullName || report.verifiedBy?.fullName || 'Lab Scientist'} &bull; {new Date(report.releasedAt || report.verifiedAt || report.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" icon={FileCheck}>
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default LabDashboardPage;
