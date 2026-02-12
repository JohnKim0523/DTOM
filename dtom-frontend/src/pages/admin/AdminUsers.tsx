import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { admin } from '../../api';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '' });

  if (!localStorage.getItem('adminToken')) return <Navigate to="/admin" />;

  const load = (p: number) => {
    admin.listUsers(p)
      .then((res: any) => {
        setUsers(res.data);
        setPage(res.page);
        setTotalPages(res.totalPages);
      })
      .catch((err: any) => setError(err.message));
  };

  useEffect(() => { load(1); }, []);

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      displayName: user.displayName || '',
      bio: user.bio || '',
    });
  };

  const saveEdit = async () => {
    try {
      await admin.updateUser(editUser.id, editForm);
      setEditUser(null);
      load(page);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await admin.deleteUser(id);
      load(page);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <nav className="navbar">
        <h1 style={{ cursor: 'pointer' }} onClick={() => navigate('/admin')}>DTOM Admin</h1>
        <div className="navbar-right">
          <button onClick={() => navigate('/admin')}>Dashboard</button>
          <button onClick={() => navigate('/admin/events')}>Events</button>
          <button onClick={() => navigate('/admin/messages')}>Messages</button>
        </div>
      </nav>
      <div className="page">
        <h1>Manage Users</h1>
        {error && <p className="error">{error}</p>}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Display Name</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.displayName || '—'}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-sm" onClick={() => openEdit(u)}>Edit</button>{' '}
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(u.id, u.username)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</button>
        </div>

        {editUser && (
          <div className="admin-modal-backdrop" onClick={() => setEditUser(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h2>Edit User: {editUser.username}</h2>
              <form onSubmit={e => { e.preventDefault(); saveEdit(); }}>
                <label>Display Name</label>
                <input
                  value={editForm.displayName}
                  onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                />
                <label>Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="submit">Save</button>
                  <button type="button" className="btn-danger" onClick={() => setEditUser(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
