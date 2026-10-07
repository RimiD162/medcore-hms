import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  CheckCheck,
} from 'lucide-react';
import accountantApi from '../../api/accountantApi';
import { Card, Badge, Button, LoadingState, ErrorState } from '../../components/ui';
import { formatDate, formatTimeAgo } from '../../utils/financeFormatters';

export const AccountantNotificationsPage = () => {
  const { setUnreadCount } = useOutletContext() || {};
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountantApi.getNotifications();
      const list = res.data?.notifications || res.data || [];
      setNotifications(list);
      const unread = list.filter((n) => !n.isRead).length;
      if (setUnreadCount) setUnreadCount(unread);
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
      await accountantApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (setUnreadCount) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={28} color="#00d2b4" /> Financial Notifications & Alerts
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)' }}>
            Real-time billing alerts, refund approvals, overdue reminders, and payment receipts.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchNotifications}>
          <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
        </Button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <LoadingState message="Loading notifications..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : notifications.length === 0 ? (
        <Card>
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main, #f8fafc)', marginBottom: '6px' }}>
              No Notifications
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              You're all caught up with financial alerts!
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              style={{
                background: notif.isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 210, 180, 0.04)',
                borderLeft: notif.isRead ? '3px solid rgba(255, 255, 255, 0.1)' : '3px solid #00d2b4',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: notif.type === 'REFUND_REQUESTED' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0, 210, 180, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: notif.type === 'REFUND_REQUESTED' ? '#c084fc' : '#00d2b4',
                      flexShrink: 0,
                    }}
                  >
                    <Bell size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-main, #f8fafc)', fontSize: '0.95rem' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                      {formatTimeAgo(notif.createdAt)} &bull; {formatDate(notif.createdAt, true)}
                    </div>
                  </div>
                </div>

                {!notif.isRead && (
                  <Button variant="outline" size="xs" onClick={() => handleMarkAsRead(notif.id)}>
                    <CheckCheck size={13} style={{ marginRight: '4px' }} /> Mark as Read
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

export default AccountantNotificationsPage;
