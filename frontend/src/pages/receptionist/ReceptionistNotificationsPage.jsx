import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  CreditCard,
  BedDouble,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';

export const ReceptionistNotificationsPage = () => {
  const navigate = useNavigate();
  const { onShowToast } = useOutletContext() || {};

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await receptionistApi.getNotifications();
      setNotifications(res.data || res || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await receptionistApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await receptionistApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onShowToast) {
        onShowToast('All notifications marked as read.');
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('Failed to mark all as read');
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'UNREAD') return !n.isRead;
    if (filterType === 'APPOINTMENT') return n.type === 'APPOINTMENT';
    if (filterType === 'BILLING') return n.type === 'BILLING';
    if (filterType === 'EMERGENCY') return n.type === 'EMERGENCY';
    return true;
  });

  const getIconForType = (type) => {
    switch (type) {
      case 'APPOINTMENT':
        return <Calendar size={18} color="#00d2b4" />;
      case 'BILLING':
        return <CreditCard size={18} color="#10b981" />;
      case 'EMERGENCY':
        return <AlertCircle size={18} color="#ef4444" />;
      case 'ADMISSION':
        return <BedDouble size={18} color="#3b82f6" />;
      default:
        return <Bell size={18} color="#f59e0b" />;
    }
  };

  return (
    <div className="med-page-container" style={{ maxWidth: '920px', margin: '0 auto' }}>
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={28} color="#00d2b4" /> Front Desk Notifications
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            System updates, doctor schedules, booking cancellations, and emergency alerts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="primary" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck size={16} style={{ marginRight: '6px' }} /> Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* 2. Filters Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All (${notifications.length})` },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'APPOINTMENT', label: 'Appointments' },
            { id: 'BILLING', label: 'Billing & Payments' },
            { id: 'EMERGENCY', label: 'Emergencies' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`med-tab-btn ${filterType === tab.id ? 'active' : ''}`}
              onClick={() => setFilterType(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* 3. Notifications List */}
      {loading ? (
        <LoadingState message="Loading notification feed..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Notifications
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              You are all caught up! No notifications match the selected category.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifications.map((n) => (
            <Card
              key={n.id}
              style={{
                background: n.isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 210, 180, 0.04)',
                border: n.isRead ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 210, 180, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px',
                    }}
                  >
                    {getIconForType(n.type)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)' }}>
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00d2b4', display: 'inline-block' }} />
                      )}
                      <Badge variant="blue">{n.type}</Badge>
                    </div>

                    <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.4 }}>
                      {n.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                      <Clock size={12} />
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleMarkAsRead(n.id)}
                    title="Mark as Read"
                  >
                    <Check size={14} />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceptionistNotificationsPage;
