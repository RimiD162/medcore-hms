import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  TestTube,
  Activity,
  Inbox,
  Microscope,
} from 'lucide-react';
import labApi from '../../api/labApi';
import useLabData from '../../hooks/useLabData';
import { Card, Badge, Button, Tabs, LoadingState, ErrorState } from '../../components/ui';

export const LabNotificationsPage = () => {
  const [filter, setFilter] = useState('ALL');

  const { data, loading, error, refetch } = useLabData(
    () =>
      labApi.getNotifications({
        isRead: filter === 'UNREAD' ? 'false' : undefined,
        limit: 50,
      }),
    [filter]
  );

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkAsRead = async (id) => {
    try {
      await labApi.markNotificationRead(id);
      refetch();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await labApi.markAllNotificationsRead();
      refetch();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  return (
    <div className="med-page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Laboratory Notifications & Alerts
            </h1>
            {unreadCount > 0 && <Badge variant="danger">{unreadCount} Unread</Badge>}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time alerts for incoming STAT diagnostic orders, specimen recollections, and critical panic value notifications.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            icon={CheckCheck}
            onClick={handleMarkAllRead}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={filter}
        onChange={setFilter}
        tabs={[
          { id: 'ALL', label: `All Alerts (${notifications.length})` },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
        ]}
      />

      {/* Notifications List */}
      <div style={{ marginTop: '20px' }}>
        {loading ? (
          <LoadingState message="Loading laboratory notifications..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : notifications.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Inbox size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              No Notifications
            </h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              You're all caught up. New diagnostic investigation requests and alerts will appear here.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                style={{
                  padding: '16px 20px',
                  background: notif.isRead ? 'var(--card-bg)' : 'rgba(124, 58, 237, 0.05)',
                  border: notif.isRead ? '1px solid var(--border-color)' : '1px solid rgba(124, 58, 237, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background:
                          notif.type === 'URGENT' || notif.type === 'ALERT'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : notif.type === 'WARNING'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(124, 58, 237, 0.15)',
                        color:
                          notif.type === 'URGENT' || notif.type === 'ALERT'
                            ? '#ef4444'
                            : notif.type === 'WARNING'
                            ? '#f59e0b'
                            : '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {notif.type === 'URGENT' || notif.type === 'ALERT' ? (
                        <AlertTriangle size={18} />
                      ) : (
                        <Bell size={18} />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {notif.title}
                        </span>
                        {!notif.isRead && <Badge variant="primary" dot>New</Badge>}
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {notif.message}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Check}
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LabNotificationsPage;
