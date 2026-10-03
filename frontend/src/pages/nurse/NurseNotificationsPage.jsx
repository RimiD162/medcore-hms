import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  CheckCheck,
} from 'lucide-react';
import nurseApi from '../../api/nurseApi';
import useNurseData from '../../hooks/useNurseData';
import { Card, Badge, Button, LoadingState, ErrorState, EmptyState } from '../../components/ui';

export const NurseNotificationsPage = () => {
  const { onShowToast, setUnreadCount } = useOutletContext() || {};
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, loading, error, refetch } = useNurseData(
    () => nurseApi.getNotifications({ isRead: unreadOnly ? 'false' : undefined }),
    [unreadOnly]
  );

  const notifications = data?.notifications || [];
  const unreadTotal = data?.unreadCount || 0;

  const handleMarkAsRead = async (id) => {
    try {
      await nurseApi.markNotificationAsRead(id);
      refetch();
      if (setUnreadCount) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await nurseApi.markAllNotificationsAsRead();
      if (onShowToast) onShowToast('All notifications marked as read.');
      if (setUnreadCount) setUnreadCount(0);
      refetch();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to update notifications');
    }
  };

  return (
    <div className="med-page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main, #f8fafc)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={24} color="#00d2b4" />
            Nurse Station Alerts & Notifications
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)' }}>
            Real-time critical alerts, medication round alarms, and clinical messages
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setUnreadOnly(!unreadOnly)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: unreadOnly ? 'rgba(0, 210, 180, 0.15)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
              border: unreadOnly ? '1px solid #00d2b4' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              color: unreadOnly ? '#00d2b4' : 'var(--text-main, #fff)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {unreadOnly ? 'Showing Unread Only' : 'Show All Notifications'}
          </button>

          {unreadTotal > 0 && (
            <Button variant="primary" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck size={15} style={{ marginRight: '6px' }} /> Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Notification Stream */}
      <Card>
        {loading ? (
          <LoadingState message="Loading notification alerts..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You are fully caught up with no pending alerts."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((n) => {
              const isUrgent = n.type === 'URGENT' || n.type === 'ALERT';
              const isMed = n.type === 'MEDICATION';

              return (
                <div
                  key={n.id}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: !n.isRead
                      ? isUrgent
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'rgba(0, 210, 180, 0.06)'
                      : 'var(--bg-subtle, rgba(255, 255, 255, 0.02))',
                    border: !n.isRead
                      ? isUrgent
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : '1px solid rgba(0, 210, 180, 0.25)'
                      : '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: isUrgent
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isMed
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(0, 210, 180, 0.15)',
                        color: isUrgent ? '#f87171' : isMed ? '#f59e0b' : '#00d2b4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isUrgent ? <AlertTriangle size={18} /> : isMed ? <Clock size={18} /> : <Info size={18} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main, #fff)' }}>
                          {n.title}
                        </h4>
                        {!n.isRead && (
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isUrgent ? '#ef4444' : '#00d2b4' }} />
                        )}
                        <Badge variant={isUrgent ? 'rose' : isMed ? 'amber' : 'teal'}>
                          {n.type}
                        </Badge>
                      </div>

                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #cbd5e1)', lineHeight: '1.4' }}>
                        {n.message}
                      </p>

                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '6px', display: 'inline-block' }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(n.id)}>
                      Mark Read
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default NurseNotificationsPage;
