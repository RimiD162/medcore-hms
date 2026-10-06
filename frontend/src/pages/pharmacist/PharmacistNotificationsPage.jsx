import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Info,
  Clock,
  Inbox,
  Filter,
} from 'lucide-react';
import pharmacistApi from '../../api/pharmacistApi';
import usePharmacistData from '../../hooks/usePharmacistData';
import { Card, Badge, Button, Tabs, LoadingState, ErrorState } from '../../components/ui';

export const PharmacistNotificationsPage = () => {
  const [filter, setFilter] = useState('ALL');

  const { data, loading, error, refetch } = usePharmacistData(
    () =>
      pharmacistApi.getNotifications({
        isRead: filter === 'UNREAD' ? 'false' : undefined,
        limit: 50,
      }),
    [filter]
  );

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkAsRead = async (id) => {
    try {
      await pharmacistApi.markNotificationRead(id);
      refetch();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await pharmacistApi.markAllNotificationsRead();
      refetch();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  return (
    <div className="med-page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pharmacy Notifications & Alerts
            </h1>
            {unreadCount > 0 && <Badge variant="danger">{unreadCount} Unread</Badge>}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time notifications for newly issued doctor prescriptions, doctor hold updates, and inventory warnings.
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
          <LoadingState message="Loading pharmacy notifications..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : notifications.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Inbox size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              No Notifications
            </h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              You're all caught up. New prescription orders and alerts will appear here.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                style={{
                  padding: '16px 20px',
                  background: notif.isRead ? 'var(--card-bg)' : 'rgba(5, 150, 105, 0.05)',
                  border: notif.isRead ? '1px solid var(--border-color)' : '1px solid rgba(5, 150, 105, 0.3)',
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
                            : 'rgba(5, 150, 105, 0.15)',
                        color:
                          notif.type === 'URGENT' || notif.type === 'ALERT'
                            ? '#ef4444'
                            : notif.type === 'WARNING'
                            ? '#f59e0b'
                            : '#059669',
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

export default PharmacistNotificationsPage;
