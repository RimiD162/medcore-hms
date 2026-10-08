import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Calendar,
  FileText,
  Pill,
  Microscope,
  CreditCard,
  ChevronRight,
  Clock,
  ShieldCheck,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientNotificationsPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterUnread, setFilterUnread] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const fetchNotifications = async (unread = false, page = 1) => {
    try {
      setLoading(true);
      const res = await patientApi.getNotifications({
        unreadOnly: unread ? 'true' : undefined,
        page,
        limit: 15,
      });
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
        setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
      if (onShowToast) onShowToast('Failed to load notification alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(filterUnread, 1);
  }, [filterUnread]);

  const handleMarkAllRead = async () => {
    try {
      await patientApi.markAllNotificationsAsRead();
      if (onShowToast) onShowToast('All notifications marked as read');
      await fetchNotifications(filterUnread, pagination.page);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      try {
        await patientApi.markNotificationAsRead(item.id);
      } catch (err) {
        console.error('Failed to mark notification read', err);
      }
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'APPOINTMENT':
        return { icon: Calendar, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
      case 'LAB_RESULT':
        return { icon: Microscope, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' };
      case 'PRESCRIPTION':
        return { icon: Pill, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' };
      case 'INVOICE':
        return { icon: CreditCard, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' };
      default:
        return { icon: Bell, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <Bell size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
              Notifications & Alerts
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            Zero-PHI appointment confirmations, released lab alerts, and prescription readiness notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid var(--border-color, #cbd5e1)',
              backgroundColor: 'var(--card-bg, #ffffff)',
              color: '#0284c7',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <CheckCheck size={16} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 14,
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setFilterUnread(false)}
            style={{
              background: !filterUnread ? '#0284c7' : 'var(--pill-bg, #f1f5f9)',
              color: !filterUnread ? '#ffffff' : 'var(--text-primary, #475569)',
              border: !filterUnread ? '1px solid #0284c7' : '1px solid var(--border-color, #e2e8f0)',
              borderRadius: 20,
              padding: '0.25rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: !filterUnread ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            All Alerts ({pagination.total || notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterUnread(true)}
            style={{
              background: filterUnread ? '#0284c7' : 'var(--pill-bg, #f1f5f9)',
              color: filterUnread ? '#ffffff' : 'var(--text-primary, #475569)',
              border: filterUnread ? '1px solid #0284c7' : '1px solid var(--border-color, #e2e8f0)',
              borderRadius: 20,
              padding: '0.25rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: filterUnread ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)' }}>
          Notifications preserve HIPAA/GDPR confidentiality with zero clinical PHI in push payloads.
        </div>
      </div>

      {/* ── Notification Feed ───────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: 12, backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px dashed var(--border-color, #cbd5e1)',
          borderRadius: 16,
          padding: '3.5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <Bell size={36} color="#94a3b8" />
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
            No Notifications
          </h3>
          <p style={{ margin: 0, maxWidth: 440, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            {filterUnread
              ? 'You have caught up with all unread notifications.'
              : 'You do not have any notification alerts at this time.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((item) => {
            const { icon: Icon, color, bg } = getNotificationIcon(item.type);
            const timeFormatted = item.createdAt ? new Date(item.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }) : 'Recent';

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                style={{
                  background: item.isRead ? 'var(--card-bg, #ffffff)' : 'var(--unread-bg, rgba(2, 132, 199, 0.04))',
                  border: item.isRead ? '1px solid var(--border-color, #e2e8f0)' : '1px solid rgba(2, 132, 199, 0.3)',
                  borderRadius: 12,
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: item.link ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: bg,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={20} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: item.isRead ? 600 : 800, fontSize: '0.92rem', color: 'var(--text-primary, #0f172a)' }}>
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: '#0284c7',
                          display: 'inline-block',
                        }} />
                      )}
                    </div>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)' }}>
                      {item.message}
                    </p>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '0.25rem', display: 'block' }}>
                      {timeFormatted}
                    </span>
                  </div>
                </div>

                {item.link && (
                  <div style={{ color: '#0284c7', display: 'flex', alignItems: 'center' }}>
                    <ChevronRight size={18} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientNotificationsPage;
