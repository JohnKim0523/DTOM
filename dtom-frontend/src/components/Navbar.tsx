import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messages, notifications } from '../api';

export default function Navbar() {
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchCounts = () => {
      messages.unreadCount()
        .then((res: any) => setUnreadMessages(res.count || 0))
        .catch(() => {});
      notifications.unreadCount()
        .then((res: any) => setUnreadNotifs(res.count || 0))
        .catch(() => {});
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="navbar">
      <h1 style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>DTOM</h1>
      <div className="navbar-right">
        <button onClick={() => navigate('/')}>Home</button>
        <button className="navbar-messages-btn" onClick={() => navigate('/notifications')}>
          Alerts
          {unreadNotifs > 0 && <span className="navbar-badge">{unreadNotifs > 99 ? '99+' : unreadNotifs}</span>}
        </button>
        <button className="navbar-messages-btn" onClick={() => navigate('/messages')}>
          Messages
          {unreadMessages > 0 && <span className="navbar-badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>}
        </button>
        <button onClick={() => navigate('/account')}>Account</button>
      </div>
    </nav>
  );
}
