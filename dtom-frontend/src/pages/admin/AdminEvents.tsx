import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { admin } from '../../api';

const STATUS_OPTIONS = ['draft', 'published', 'cancelled', 'completed'];

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [editEvent, setEditEvent] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', status: 'published' });

  if (!localStorage.getItem('adminToken')) return <Navigate to="/admin" />;

  const load = (p: number) => {
    admin.listEvents(p)
      .then((res: any) => {
        setEvents(res.data);
        setPage(res.page);
        setTotalPages(res.totalPages);
      })
      .catch((err: any) => setError(err.message));
  };

  useEffect(() => { load(1); }, []);

  const openEdit = (ev: any) => {
    setEditEvent(ev);
    setEditForm({
      title: ev.title || '',
      description: ev.description || '',
      status: ev.status || 'published',
    });
  };

  const saveEdit = async () => {
    try {
      await admin.updateEvent(editEvent.id, editForm);
      setEditEvent(null);
      load(page);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete event "${title}"? This cannot be undone.`)) return;
    try {
      await admin.deleteEvent(id);
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
          <button onClick={() => navigate('/admin/users')}>Users</button>
          <button onClick={() => navigate('/admin/messages')}>Messages</button>
        </div>
      </nav>
      <div className="page">
        <h1>Manage Events</h1>
        {error && <p className="error">{error}</p>}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Organizer</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td>{ev.title}</td>
                  <td>{ev.organizer?.username || ev.organizerId}</td>
                  <td><span className="status-badge">{ev.status}</span></td>
                  <td>{ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <button className="btn-sm" onClick={() => openEdit(ev)}>Edit</button>{' '}
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(ev.id, ev.title)}>Delete</button>
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

        {editEvent && (
          <div className="admin-modal-backdrop" onClick={() => setEditEvent(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h2>Edit Event</h2>
              <form onSubmit={e => { e.preventDefault(); saveEdit(); }}>
                <label>Title</label>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                />
                <label>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                />
                <label>Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #33301e',
                    background: '#16160f',
                    color: '#eee8d5',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="submit">Save</button>
                  <button type="button" className="btn-danger" onClick={() => setEditEvent(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
