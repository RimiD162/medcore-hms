import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Users,
  Calendar,
  CreditCard,
  BedDouble,
  Receipt,
  UserPlus,
  CalendarPlus,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Heart,
  Shield,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, Badge, Button, Tabs, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistPatientDetailPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');

  const fetchPatient = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await receptionistApi.getPatientById(patientId);
      setPatient(res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load safe patient profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  if (loading) {
    return <LoadingState message="Loading safe patient demographic & billing file..." />;
  }

  if (error || !patient) {
    return (
      <div className="med-page-container">
        <Button variant="outline" size="sm" onClick={() => navigate('/app/receptionist/patients')} style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Directory
        </Button>
        <ErrorState message={error || 'Patient record not found'} onRetry={fetchPatient} />
      </div>
    );
  }

  const appointments = patient.appointments || [];
  const invoices = patient.invoices || [];
  const payments = patient.payments || [];
  const admissions = patient.admissions || [];

  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.outstandingAmount || 0), 0);

  return (
    <div className="med-page-container">
      {/* 1. Header with Breadcrumb & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/receptionist/patients')}>
            <ArrowLeft size={16} /> Directory
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0 }}>
                {patient.fullName}
              </h1>
              <span style={{ fontSize: '1rem', fontWeight: '700', color: '#00d2b4', padding: '3px 10px', borderRadius: '6px', background: 'rgba(0, 210, 180, 0.1)' }}>
                {patient.patientIdNumber}
              </span>
              <Badge variant="teal">{patient.status || 'Active'}</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
              Registration Source: <strong>{patient.registrationSource}</strong> &bull; Member Since: <strong>{new Date(patient.createdAt).toLocaleDateString()}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="primary" size="sm" onClick={() => navigate(`/app/receptionist/appointments/book?patientId=${patient.id}`)}>
            <CalendarPlus size={14} style={{ marginRight: '6px' }} /> Book Appointment
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/app/receptionist/billing?patientId=${patient.id}`)}>
            <Receipt size={14} style={{ marginRight: '6px' }} /> Create Invoice
          </Button>
        </div>
      </div>

      {/* 2. Demographics & Financial Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Safe Demographics Card */}
        <Card title="Demographic & Contact Identity">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted, #94a3b8)', display: 'block', fontSize: '0.75rem' }}>GENDER & AGE</span>
              <strong style={{ color: 'var(--text-main, #f8fafc)' }}>
                {patient.gender || 'Not Specified'} {patient.age ? `(${patient.age} yrs)` : ''}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted, #94a3b8)', display: 'block', fontSize: '0.75rem' }}>BLOOD GROUP</span>
              <strong style={{ color: '#00d2b4' }}>{patient.bloodGroup || 'Not Tested'}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted, #94a3b8)', display: 'block', fontSize: '0.75rem' }}>PHONE NUMBER</span>
              <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{patient.phone}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted, #94a3b8)', display: 'block', fontSize: '0.75rem' }}>EMAIL</span>
              <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{patient.email || 'None on file'}</strong>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)', display: 'block', fontSize: '0.75rem' }}>RESIDENTIAL ADDRESS</span>
              <span style={{ color: 'var(--text-main, #f8fafc)' }}>{patient.address || 'No residential address registered'}</span>
            </div>

            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
              <span style={{ color: 'var(--text-muted, #94a3b8)', display: 'block', fontSize: '0.75rem' }}>EMERGENCY CONTACT</span>
              <strong style={{ color: 'var(--text-main, #f8fafc)' }}>
                {patient.emergencyContact || 'None Listed'} {patient.emergencyPhone ? `• ${patient.emergencyPhone}` : ''}
              </strong>
            </div>
          </div>
        </Card>

        {/* Front Desk Billing Account Card */}
        <Card title="Billing & Accounts Balance">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>TOTAL BILLED</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', marginTop: '4px' }}>
                ${totalBilled.toFixed(2)}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'block' }}>TOTAL PAID</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                ${totalPaid.toFixed(2)}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', padding: '12px', borderRadius: '8px', background: totalOutstanding > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)', border: totalOutstanding > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: totalOutstanding > 0 ? '#f87171' : '#94a3b8', display: 'block' }}>OUTSTANDING BALANCE</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: totalOutstanding > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
                ${totalOutstanding.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Operational History Tabs */}
      <Card>
        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              type="button"
              className={`med-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar size={16} style={{ marginRight: '6px' }} /> Appointments ({appointments.length})
            </button>
            <button
              type="button"
              className={`med-tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
              onClick={() => setActiveTab('invoices')}
            >
              <Receipt size={16} style={{ marginRight: '6px' }} /> Invoices ({invoices.length})
            </button>
            <button
              type="button"
              className={`med-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <DollarSign size={16} style={{ marginRight: '6px' }} /> Payments ({payments.length})
            </button>
            <button
              type="button"
              className={`med-tab-btn ${activeTab === 'admissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('admissions')}
            >
              <BedDouble size={16} style={{ marginRight: '6px' }} /> Inpatient Stays ({admissions.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Appointments */}
        {activeTab === 'appointments' && (
          <div>
            {appointments.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                <Calendar size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p>No appointment records found for this patient.</p>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => navigate(`/app/receptionist/appointments/book?patientId=${patient.id}`)}
                >
                  Book First Appointment
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="med-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>APPT #</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>DATE & TIME</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>DOCTOR / DEPT</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>TYPE & REASON</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr key={apt.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#00d2b4' }}>
                          {apt.appointmentNumber}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-main, #f8fafc)' }}>
                          {new Date(apt.appointmentDate).toISOString().slice(0, 10)} at {apt.appointmentTime}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-main, #f8fafc)' }}>
                          Dr. {apt.doctor?.user?.fullName} ({apt.doctor?.department})
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted, #94a3b8)' }}>
                          {apt.type} {apt.reason ? `• ${apt.reason}` : ''}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <Badge
                            variant={
                              apt.status === 'CONFIRMED'
                                ? 'teal'
                                : apt.status === 'COMPLETED'
                                ? 'blue'
                                : apt.status === 'CANCELLED'
                                ? 'danger'
                                : 'amber'
                            }
                          >
                            {apt.status} {apt.isCheckedIn ? '(Checked In)' : ''}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Invoices */}
        {activeTab === 'invoices' && (
          <div>
            {invoices.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                <Receipt size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p>No invoices have been billed to this patient yet.</p>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => navigate(`/app/receptionist/billing?patientId=${patient.id}`)}
                >
                  Create Invoice
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="med-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>INVOICE #</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>DATE</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>TOTAL</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>PAID</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>BALANCE</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>STATUS</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#00d2b4' }}>
                          {inv.invoiceNumber}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-main, #f8fafc)' }}>
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--text-main, #f8fafc)' }}>
                          ${Number(inv.totalAmount).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#10b981' }}>
                          ${Number(inv.paidAmount).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 14px', color: Number(inv.outstandingAmount) > 0 ? '#ef4444' : '#94a3b8' }}>
                          ${Number(inv.outstandingAmount).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <Badge
                            variant={
                              inv.status === 'PAID'
                                ? 'teal'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'amber'
                                : 'danger'
                            }
                          >
                            {inv.status}
                          </Badge>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {Number(inv.outstandingAmount) > 0 ? (
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => navigate(`/app/receptionist/payments?invoiceId=${inv.id}`)}
                            >
                              Collect Pay
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => navigate(`/app/receptionist/invoices?invoiceId=${inv.id}`)}
                            >
                              Receipt
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payments */}
        {activeTab === 'payments' && (
          <div>
            {payments.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                <DollarSign size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p>No payment receipts recorded for this patient.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="med-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>RECEIPT #</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>DATE</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>AMOUNT</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>METHOD</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>REF / NOTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pay) => (
                      <tr key={pay.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#10b981' }}>
                          {pay.receiptNumber}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-main, #f8fafc)' }}>
                          {new Date(pay.paymentDate).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#10b981' }}>
                          ${Number(pay.amount).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <Badge variant="blue">{pay.paymentMethod}</Badge>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted, #94a3b8)' }}>
                          {pay.referenceNumber || pay.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Admissions */}
        {activeTab === 'admissions' && (
          <div>
            {admissions.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                <BedDouble size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p>Patient has no inpatient admission stays on record.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="med-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>WARD & BED</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>ADMISSION DATE</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>ADMITTING DOCTOR</th>
                      <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#94a3b8' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissions.map((adm) => (
                      <tr key={adm.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--text-main, #f8fafc)' }}>
                          {adm.ward} &bull; Bed {adm.bedNumber}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-main, #f8fafc)' }}>
                          {new Date(adm.admissionDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-main, #f8fafc)' }}>
                          Dr. {adm.admittingDoctor?.user?.fullName || 'Assigned Staff'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <Badge variant={adm.status === 'ADMITTED' ? 'amber' : 'teal'}>
                            {adm.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReceptionistPatientDetailPage;
