import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Calendar,
  Microscope,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react';
import doctorApi from '../../api/doctorApi';
import { Card, Button, Badge, LoadingState, ErrorState } from '../../components/ui';

export const DoctorNotificationsPage = () => {
  const navigate = useNavigate();
  const { onShowToast, setUnreadCount } = useOutletContext() || {};

  const [notifications, setNotifications] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await doctorApi.getNotifications();
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadTotal(res.data.unreadCount || 0);
        if (setUnreadCount) setUnreadCount(res.data.unreadCount || 0);
      }
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
      await doctorApi.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadTotal((prev) => Math.max(0, prev - 1));
      if (setUnreadCount) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      if (onShowToast) onShowToast('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await doctorApi.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadTotal(0);
      if (setUnreadCount) setUnreadCount(0);
      if (onShowToast) onShowToast('All notifications marked as read');
    } catch (err) {
      if (onShowToast) onShowToast('Failed to mark all as read');
    }
  };

  if (loading) {
    return <LoadingState message="Loading notifications..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchNotifications} />;
  }

  const getNotifIcon = (type) => {
    switch (type) {
      case 'APPOINTMENT':
        return <Calendar size={18} color="#00a88f" />;
      case 'LAB_RESULT':
        return <Microscope size={18} color="#0284c7" />;
      case 'URGENT':
        return <AlertTriangle size={18} color="#d93c46" />;
      default:
        return <Info size={18} color="#64748b" />;
    }
  };

  return (
    <div className="med-notifications-page">
      <div className="med-page-header">
        <div>
          <h1 className="med-page-title">Notifications & Clinical Alerts</h1>
          <p className="med-page-subtitle">
            Real-time updates on patient check-ins, lab results ready for review, and departmental notices
          </p>
        </div>

        {unreadTotal > 0 && (
          <Button
            variant="outline"
            icon={CheckCheck}
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      <Card padding="none">
        {notifications.length === 0 ? (
          <div className="med-empty-block" style={{ padding: '60px 20px' }}>
            <Bell size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <p>You have no notifications at this time.</p>
          </div>
        ) : (
          <div className="med-notifications-list">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`med-notif-item ${!notif.isRead ? 'unread' : ''}`}
                onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
              >
                <div className="med-notif-icon-box">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="med-notif-content">
                  <div className="med-notif-header">
                    <span className="med-notif-title">{notif.title}</span>
                    <span className="med-notif-time">
                      <Clock size={12} />
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="med-notif-msg">{notif.message}</p>
                </div>

                <div className="med-notif-action">
                  {!notif.isRead ? (
                    <button
                      type="button"
                      className="med-notif-mark-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
                      title="Mark as read"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  ) : (
                    <span className="med-notif-read-dot" title="Read" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DoctorNotificationsPage;
