import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messages, usersApi, auth } from '../api';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import UserLink from '../components/UserLink';

export default function Conversation() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [messageList, setMessageList] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!userId) return;

    Promise.all([
      auth.me(),
      usersApi.get(userId),
      messages.conversation(userId),
    ])
      .then(([me, partnerData, msgs]) => {
        setCurrentUser(me);
        setPartner(partnerData);
        setMessageList(msgs);
        messages.markRead(userId).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Poll for new messages every 5 seconds
    pollRef.current = setInterval(async () => {
      try {
        const msgs = await messages.conversation(userId);
        setMessageList(msgs);
        messages.markRead(userId).catch(() => {});
      } catch {}
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newMessage.trim() || sending) return;
    setSending(true);
    try {
      const sent = await messages.send(userId, newMessage.trim());
      setMessageList(prev => [...prev, sent]);
      setNewMessage('');
    } catch {}
    setSending(false);
  };

  if (loading) return <><Navbar /><p style={{ padding: 40 }}>Loading...</p></>;

  return (
    <>
      <Navbar />
      <div className="page conversation-page" style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 62px)' }}>
        <div className="conversation-top-bar">
          <button className="back-btn" onClick={() => navigate('/messages')}>&larr; Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserLink user={partner} size={32} />
          </div>
        </div>

        <div className="message-list">
          {messageList.length === 0 && (
            <p style={{ textAlign: 'center', color: '#6b6348', padding: 40 }}>
              No messages yet. Say hello!
            </p>
          )}
          {messageList.map((msg: any) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id} className={`message-bubble ${isMe ? 'message-mine' : 'message-theirs'}`}>
                {!isMe && <Avatar user={partner} size={28} />}
                <div className={`message-content ${isMe ? 'message-content-mine' : 'message-content-theirs'}`}>
                  <p>{msg.content}</p>
                  <small>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form className="message-input-bar" onSubmit={handleSend}>
          <input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={sending || !newMessage.trim()}>Send</button>
        </form>
      </div>
    </>
  );
}
