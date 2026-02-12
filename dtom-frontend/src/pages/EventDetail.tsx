import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, events, members, comments, friends, fundraising, BACKEND_URL } from '../api';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import UserLink from '../components/UserLink';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [memberList, setMemberList] = useState<any[]>([]);
  const [commentList, setCommentList] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', purpose: '', location: '', eventDate: '' });
  const [error, setError] = useState('');

  // Fundraising
  const [contributions, setContributions] = useState<any[]>([]);
  const [contributeAmount, setContributeAmount] = useState('');
  const [showContributions, setShowContributions] = useState(false);

  // Invite friends
  const [friendList, setFriendList] = useState<any[]>([]);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (!id) return;
    auth.me().then(setCurrentUser).catch(() => {});
    events.get(id).then(setEvent).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!currentUser || !event || !id) return;
    setIsOrganizer(event.organizerId === currentUser.id);
    loadMembers();
    if (event.hasFundraising) {
      fundraising.contributions(id).then(setContributions).catch(() => {});
    }
  }, [currentUser, event]);

  const loadMembers = async () => {
    if (!id || !currentUser) return;
    try {
      const list = await members.list(id);
      setMemberList(list);
      const myMembership = list.find((m: any) => m.userId === currentUser.id);
      const orgMatch = event?.organizerId === currentUser.id;
      const memberMatch = !!myMembership && myMembership.role !== 'invited';
      setIsMember(memberMatch || orgMatch);
      setMyRole(myMembership?.role || (orgMatch ? 'organizer' : null));
      if (memberMatch || orgMatch) loadComments();
    } catch {
      setIsMember(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;
    try {
      setCommentList(await comments.list(id));
    } catch {}
  };

  const handleJoin = async () => {
    if (!id) return;
    try {
      await members.join(id);
      loadMembers();
    } catch (err: any) { setError(err.message); }
  };

  const handleLeave = async () => {
    if (!id) return;
    try {
      await members.leave(id);
      setIsMember(false);
      setCommentList([]);
      setMemberList(prev => prev.filter(m => m.userId !== currentUser?.id));
    } catch (err: any) { setError(err.message); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;
    try {
      await comments.create(id, newComment);
      setNewComment('');
      loadComments();
    } catch (err: any) { setError(err.message); }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await comments.remove(commentId);
      setCommentList(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) { setError(err.message); }
  };

  const handleDeleteEvent = async () => {
    if (!id) return;
    if (!confirm('Delete this event? This cannot be undone.')) return;
    try {
      await events.remove(id);
      navigate('/');
    } catch (err: any) { setError(err.message); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      setEvent(await events.uploadImage(id, file));
    } catch (err: any) { setError(err.message); }
  };

  const startEditing = () => {
    setEditing(true);
    setEditForm({
      title: event.title || '',
      description: event.description || '',
      purpose: event.purpose || '',
      location: event.location || '',
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const updated = await events.update(id, {
        title: editForm.title,
        description: editForm.description,
        purpose: editForm.purpose || undefined,
        location: editForm.location || undefined,
        eventDate: editForm.eventDate || undefined,
      });
      setEvent(updated);
      setEditing(false);
    } catch (err: any) { setError(err.message); }
  };

  // Moderation
  const handlePromote = async (userId: string) => {
    if (!id) return;
    try { await members.promote(id, userId); loadMembers(); } catch (err: any) { setError(err.message); }
  };
  const handleDemote = async (userId: string) => {
    if (!id) return;
    try { await members.demote(id, userId); loadMembers(); } catch (err: any) { setError(err.message); }
  };
  const handleKick = async (userId: string) => {
    if (!id) return;
    try { await members.kick(id, userId); loadMembers(); } catch (err: any) { setError(err.message); }
  };

  // Fundraising
  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !contributeAmount) return;
    try {
      await fundraising.contribute(id, parseFloat(contributeAmount));
      setContributeAmount('');
      events.get(id).then(setEvent).catch(() => {});
      fundraising.contributions(id).then(setContributions).catch(() => {});
    } catch (err: any) { setError(err.message); }
  };

  // Invite
  const openInviteModal = async () => {
    try {
      const fl = await friends.list();
      setFriendList(fl);
      setShowInvite(true);
    } catch {}
  };
  const handleInvite = async (userId: string) => {
    if (!id) return;
    try {
      await members.invite(id, userId);
      setFriendList(prev => prev.filter(f => {
        const friendId = f.requesterId === currentUser?.id ? f.addresseeId : f.requesterId;
        return friendId !== userId;
      }));
    } catch (err: any) { setError(err.message); }
  };

  const canModerate = isOrganizer || myRole === 'moderator';

  if (!event) return <p>Loading...</p>;

  return (
    <>
    <Navbar />
    <div className="page-narrow">

      {editing ? (
        <form onSubmit={handleEditSubmit}>
          <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" required />
          <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" required />
          <input value={editForm.purpose} onChange={e => setEditForm({ ...editForm, purpose: e.target.value })} placeholder="Purpose" />
          <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} placeholder="Location" />
          <input type="datetime-local" value={editForm.eventDate} onChange={e => setEditForm({ ...editForm, eventDate: e.target.value })} />
          <label className="file-label">
            Change Image
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit">Save</button>
            <button type="button" className="btn-danger" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          {event.imageUrl && (
            <img src={`${BACKEND_URL}${event.imageUrl}`} alt={event.title} className="event-image" />
          )}
          <h1>{event.title}</h1>
          <p>{event.description}</p>
          {event.purpose && <p><strong>Purpose:</strong> {event.purpose}</p>}
          {event.location && <p><strong>Location:</strong> {event.location}</p>}
          {event.eventDate && <p><strong>Date:</strong> {new Date(event.eventDate).toLocaleString()}</p>}
          <p><strong>Status:</strong> {event.status}</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong>Organizer:</strong> <UserLink user={event.organizer} size={24} />
          </p>

          {isOrganizer && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={startEditing}>Edit Event</button>
              <button className="btn-danger" onClick={handleDeleteEvent}>Delete Event</button>
            </div>
          )}
        </>
      )}

      {error && <p className="error">{error}</p>}

      {/* Fundraising Section */}
      {event.hasFundraising && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ color: '#d4a520', marginBottom: 8 }}>Fundraising</h3>
          <div className="fundraising-progress-bar">
            <div
              className="fundraising-progress-fill"
              style={{ width: `${Math.min(100, (event.fundraisingCurrent / (event.fundraisingGoal || 1)) * 100)}%` }}
            />
          </div>
          <p style={{ fontSize: 14, marginTop: 6 }}>
            <strong>${Number(event.fundraisingCurrent || 0).toFixed(2)}</strong> raised
            {event.fundraisingGoal ? ` of $${Number(event.fundraisingGoal).toFixed(2)} goal` : ''}
          </p>
          {isMember && (
            <form onSubmit={handleContribute} style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 0 }}>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Amount ($)"
                value={contributeAmount}
                onChange={e => setContributeAmount(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit">Contribute</button>
            </form>
          )}
          <button
            className="btn-sm"
            style={{ marginTop: 8, background: 'transparent', color: '#a09878', border: '1px solid #33301e' }}
            onClick={() => setShowContributions(!showContributions)}
          >
            {showContributions ? 'Hide' : 'Show'} Contributors ({contributions.length})
          </button>
          {showContributions && (
            <div style={{ marginTop: 8 }}>
              {contributions.map((c: any) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <UserLink user={c.user} size={20} />
                  <span style={{ color: '#d4a520' }}>${Number(c.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '12px', display: 'flex', gap: 8 }}>
        {isMember ? (
          !isOrganizer && <button onClick={handleLeave}>Leave Event</button>
        ) : (
          <button onClick={handleJoin}>Join Event</button>
        )}
        {canModerate && (
          <button onClick={openInviteModal} style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #d4a520' }}>
            Invite Friends
          </button>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>Invite Friends</strong>
            <button className="btn-sm" onClick={() => setShowInvite(false)}>Close</button>
          </div>
          {friendList.length === 0 && <p style={{ color: '#6b6348', fontSize: 13 }}>No friends to invite.</p>}
          {friendList.map((f: any) => {
            const friend = f.requesterId === currentUser?.id ? f.addressee : f.requester;
            const alreadyMember = memberList.some(m => m.userId === friend?.id);
            return (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <UserLink user={friend} size={24} />
                {alreadyMember ? (
                  <small style={{ color: '#6b6348' }}>Already in event</small>
                ) : (
                  <button className="btn-sm" onClick={() => handleInvite(friend.id)}>Invite</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h2>Members ({memberList.filter(m => m.role !== 'invited').length})</h2>
      <ul>
        {memberList.filter(m => m.role !== 'invited').map(m => (
          <li key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserLink user={m.user} size={28} />
              <span className="status-badge">{m.role}</span>
            </div>
            {isOrganizer && m.userId !== currentUser?.id && m.userId !== event.organizerId && (
              <div style={{ display: 'flex', gap: 4 }}>
                {m.role === 'attendee' ? (
                  <button className="btn-sm" onClick={() => handlePromote(m.userId)}>Mod</button>
                ) : (
                  <button className="btn-sm" onClick={() => handleDemote(m.userId)}>Unmod</button>
                )}
                <button className="btn-danger btn-sm" onClick={() => handleKick(m.userId)}>Kick</button>
              </div>
            )}
            {!isOrganizer && myRole === 'moderator' && m.userId !== currentUser?.id && m.userId !== event.organizerId && m.role !== 'moderator' && (
              <button className="btn-danger btn-sm" onClick={() => handleKick(m.userId)}>Kick</button>
            )}
          </li>
        ))}
      </ul>

      {isMember && (
        <>
          <h2>Thread</h2>
          {commentList.length === 0 && <p>No comments yet.</p>}
          {commentList.map(c => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Avatar user={c.author} size={32} />
                  <div>
                    <strong><UserLink user={c.author} showAvatar={false} /></strong>
                    <p>{c.content}</p>
                    <small>{new Date(c.createdAt).toLocaleString()}</small>
                  </div>
                </div>
                {(isOrganizer || myRole === 'moderator' || c.authorId === currentUser?.id) && (
                  <button className="btn-danger btn-sm" onClick={() => handleDeleteComment(c.id)}>X</button>
                )}
              </div>
            </div>
          ))}
          <form onSubmit={handleComment}>
            <input
              placeholder="Write a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </>
      )}
    </div>
    </>
  );
}
