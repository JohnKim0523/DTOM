import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin, setAdminToken, clearAdminToken } from '../../api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('adminToken'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!loggedIn) return;
    admin.stats()
      .then(setStats)
      .catch((err: any) => {
        if (err.message?.includes('Admin access required') || err.message?.includes('Forbidden')) {
          clearAdminToken();
          setLoggedIn(false);
        } else {
          setError(err.message);
        }
      });
  }, [loggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await admin.login({ username, password });
      setAdminToken(res.token);
      setLoggedIn(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setLoggedIn(false);
    setStats(null);
    setUsername('');
    setPassword('');
  };

  if (!loggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-brand">
          <h1>DTOM</h1>
          <p>Admin Panel</p>
        </div>
        <div className="auth-card">
          <h2>Admin Login</h2>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <h1 style={{ cursor: 'pointer' }} onClick={() => navigate('/admin')}>DTOM Admin</h1>
        <div className="navbar-right">
          <button onClick={() => navigate('/admin/users')}>Users</button>
          <button onClick={() => navigate('/admin/events')}>Events</button>
          <button onClick={() => navigate('/admin/messages')}>Messages</button>
          <button className="btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <div className="page">
        <h1>Dashboard</h1>
        {error && <p className="error">{error}</p>}

        {stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card" onClick={() => navigate('/admin/users')}>
              <span className="admin-stat-number">{stats.users}</span>
              <span className="admin-stat-label">Users</span>
            </div>
            <div className="admin-stat-card" onClick={() => navigate('/admin/events')}>
              <span className="admin-stat-number">{stats.events}</span>
              <span className="admin-stat-label">Events</span>
            </div>
            <div className="admin-stat-card" onClick={() => navigate('/admin/messages')}>
              <span className="admin-stat-number">{stats.messages}</span>
              <span className="admin-stat-label">Messages</span>
            </div>
            <div className="admin-stat-card" onClick={() => navigate('/admin/messages')}>
              <span className="admin-stat-number">{stats.comments}</span>
              <span className="admin-stat-label">Comments</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
