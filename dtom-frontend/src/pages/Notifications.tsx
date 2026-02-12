import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '../api';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifList, setNotifList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notifications.list()
      .then(setNotifList)
      .catch(() => {})
      .finally(() => setLoading(false));
    notifications.markAllRead().catch(() => {});
  }, []);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleClick = (notif: any) => {
    if (notif.type === 'friend_request' || notif.type === 'friend_accepted') {
      navigate(`/users/${notif.actorId}`);
    } else if (notif.referenceId) {
      navigate(`/events/${notif.referenceId}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page" style={{ maxWidth: 700 }}>
        <h1>Notifications</h1>
        {loading && <p>Loading...</p>}
        {!loading && notifList.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#a09878' }}>No notifications yet.</p>
          </div>
        )}
        <div className="notification-list">
          {notifList.map((n: any) => (
            <div
              key={n.id}
              className={`notification-item ${!n.read ? 'notification-unread' : ''}`}
              onClick={() => handleClick(n)}
              style={{ cursor: 'pointer' }}
            >
              <Avatar user={n.actor} size={36} />
              <div className="notification-body">
                <p>
                  <strong>{n.actor?.displayName || n.actor?.username || 'Someone'}</strong>{' '}
                  {n.message}
                </p>
                <small>{formatTime(n.createdAt)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
