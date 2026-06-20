import React, { useEffect, useState } from 'react';
import { getNotifications, markNotificationAsRead } from '../services/api';

const NotificationsPage = ({ onNavigate, currentUser, onNotificationRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('All'); // 'All', 'Unread', 'Read'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      setError('Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      // Refresh local list
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'Read' } : n));
      // Notify parent app of read status update to refresh count
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (err) {
      setError('Failed to update notification status.');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    return n.status === filter;
  });

  return (
    <div className="notifications-container">
      <div className="page-header">
        <div>
          <h2>System Change Notifications</h2>
          <p className="subtitle">
            {currentUser.role === 'Admin' 
              ? 'View all engineering change notifications generated in the radar system' 
              : currentUser.role === 'Viewer'
              ? 'Read-only log of change impact notifications'
              : `Change alerts for your assigned component: ${currentUser.assignedComponent?.name || 'Unassigned'}`}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
          Back to Dashboard
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {['All', 'Unread', 'Read'].map(opt => (
          <button
            key={opt}
            className={`category-tab-btn ${filter === opt ? 'active' : ''}`}
            onClick={() => setFilter(opt)}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            {opt}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">Loading alerts...</p>
      ) : filteredNotifications.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem' }}>
          <h3>No Notifications Found</h3>
          <p>There are no notifications matching the <strong>{filter}</strong> status filter.</p>
        </div>
      ) : (
        <div className="notifications-list animate-fade-in">
          {filteredNotifications.map(n => {
            const isUnread = n.status === 'Unread';
            const sourceName = n.sourceComponent?.name || 'Unknown Component';
            const affectedName = n.affectedComponent?.name || 'Unknown Component';
            
            return (
              <div key={n._id} className={`notif-row-card ${isUnread ? 'unread' : ''}`}>
                <div className="notif-content-block">
                  <div className="notif-title-row">
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>[NOTIF-{n._id.slice(-6).toUpperCase()}]</span>
                    {isUnread && <span className="notif-badge-unread">UNREAD ALERT</span>}
                    <span className="text-muted">•</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Source: <strong>{sourceName}</strong> ➔ Impacted: <strong>{affectedName}</strong>
                    </span>
                  </div>
                  
                  <div className="notif-msg" style={{ margin: '0.5rem 0' }}>
                    {n.message}
                  </div>
                  
                  <div className="notif-meta">
                    <span>Uploaded Version: <strong className="text-highlight">{n.uploadedVersion}</strong></span>
                    <span>Date Generated: {new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="notif-actions">
                  {isUnread && currentUser.role !== 'Viewer' && (
                    <button className="btn-read" onClick={() => handleMarkAsRead(n._id)}>
                      ✓ Mark Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
