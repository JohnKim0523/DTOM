import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { admin } from '../../api';

type Tab = 'messages' | 'comments';

export default function AdminMessages() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('messages');
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [msgPage, setMsgPage] = useState(1);
  const [msgTotalPages, setMsgTotalPages] = useState(1);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [cmtPage, setCmtPage] = useState(1);
  const [cmtTotalPages, setCmtTotalPages] = useState(1);
  const [error, setError] = useState('');

  if (!localStorage.getItem('adminToken')) return <Navigate to="/admin" />;

  const loadMessages = (p: number) => {
    admin.listMessages(p)
      .then((res: any) => {
        setMessagesList(res.data);
        setMsgPage(res.page);
        setMsgTotalPages(res.totalPages);
      })
      .catch((err: any) => setError(err.message));
  };

  const loadComments = (p: number) => {
    admin.listComments(p)
      .then((res: any) => {
        setCommentsList(res.data);
        setCmtPage(res.page);
        setCmtTotalPages(res.totalPages);
      })
      .catch((err: any) => setError(err.message));
  };

  useEffect(() => {
    loadMessages(1);
    loadComments(1);
  }, []);

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await admin.deleteComment(id);
      loadComments(cmtPage);
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
          <button onClick={() => navigate('/admin/events')}>Events</button>
        </div>
      </nav>
      <div className="page">
        <h1>Messages & Comments</h1>
        {error && <p className="error">{error}</p>}

        <div className="tabs">
          <button className={`tab ${tab === 'messages' ? 'tab-active' : ''}`} onClick={() => setTab('messages')}>
            Messages
          </button>
          <button className={`tab ${tab === 'comments' ? 'tab-active' : ''}`} onClick={() => setTab('comments')}>
            Comments
          </button>
        </div>

        {tab === 'messages' && (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Content</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {messagesList.map(m => (
                    <tr key={m.id}>
                      <td>{m.sender?.username || m.senderId}</td>
                      <td>{m.receiver?.username || m.receiverId}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.content}
                      </td>
                      <td>{new Date(m.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <button disabled={msgPage <= 1} onClick={() => loadMessages(msgPage - 1)}>Prev</button>
              <span>Page {msgPage} of {msgTotalPages}</span>
              <button disabled={msgPage >= msgTotalPages} onClick={() => loadMessages(msgPage + 1)}>Next</button>
            </div>
          </>
        )}

        {tab === 'comments' && (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Author</th>
                    <th>Event</th>
                    <th>Content</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commentsList.map(c => (
                    <tr key={c.id}>
                      <td>{c.author?.username || c.authorId}</td>
                      <td>{c.event?.title || c.eventId}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.content}
                      </td>
                      <td>{new Date(c.createdAt).toLocaleString()}</td>
                      <td>
                        <button className="btn-sm btn-danger" onClick={() => handleDeleteComment(c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <button disabled={cmtPage <= 1} onClick={() => loadComments(cmtPage - 1)}>Prev</button>
              <span>Page {cmtPage} of {cmtTotalPages}</span>
              <button disabled={cmtPage >= cmtTotalPages} onClick={() => loadComments(cmtPage + 1)}>Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
