import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { messages } from '../api';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';

export default function Messages() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messages.conversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
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

  return (
    <>
      <Navbar />
      <div className="page" style={{ maxWidth: 700 }}>
        <h1>Messages</h1>

        {loading && <p>Loading conversations...</p>}

        {!loading && conversations.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#a09878' }}>No messages yet.</p>
            <p style={{ color: '#6b6348', fontSize: 14, marginTop: 8 }}>
              Visit a user's profile to send them a message.
            </p>
          </div>
        )}

        <div className="conversation-list">
          {conversations.map((conv: any) => (
            <Link key={conv.partnerId} to={`/messages/${conv.partnerId}`} className="conversation-item">
              <Avatar user={conv.partner} size={44} />
              <div className="conversation-info">
                <div className="conversation-header">
                  <strong>{conv.partner?.displayName || conv.partner?.username}</strong>
                  <small>{formatTime(conv.lastMessage?.createdAt)}</small>
                </div>
                <p className="conversation-preview">
                  {conv.lastMessage?.content?.substring(0, 80)}
                  {conv.lastMessage?.content?.length > 80 ? '...' : ''}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="unread-badge">{conv.unreadCount}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
