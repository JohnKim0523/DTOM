import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, events, members, comments, threads, friends, fundraising, posts, topics, topicComments, imageUrl } from '../api';
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

  // Repost
  const [reposted, setReposted] = useState(false);

  // Threads
  const [threadList, setThreadList] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadPermission, setNewThreadPermission] = useState('open');
  const [newThreadType, setNewThreadType] = useState('channel');

  // Comment image
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState('');
  const commentImageRef = useRef<HTMLInputElement>(null);

  // Community thread (topics)
  const [topicList, setTopicList] = useState<any[]>([]);
  const [topicSort, setTopicSort] = useState<'new' | 'top'>('new');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newTopicImage, setNewTopicImage] = useState<File | null>(null);
  const [newTopicImagePreview, setNewTopicImagePreview] = useState('');
  const topicImageRef = useRef<HTMLInputElement>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<any>(null);
  const [topicCommentList, setTopicCommentList] = useState<any[]>([]);
  const [newTopicComment, setNewTopicComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [topicCommentImage, setTopicCommentImage] = useState<File | null>(null);
  const [topicCommentImagePreview, setTopicCommentImagePreview] = useState('');
  const topicCommentImageRef = useRef<HTMLInputElement>(null);

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
    if (!id || !currentUser || !event) return;
    try {
      const list = await members.list(id);
      setMemberList(list);
      const myMembership = list.find((m: any) => m.userId === currentUser.id);
      const orgMatch = event.organizerId === currentUser.id;
      const memberMatch = !!myMembership && myMembership.role !== 'invited';
      setIsMember(memberMatch || orgMatch);
      setMyRole(myMembership?.role || (orgMatch ? 'organizer' : null));
      if (memberMatch || orgMatch) {
        loadThreads();
        loadComments();
      }
    } catch {
      // Don't reset isMember on error — the user may already be a member
      // but the request failed due to a network issue
    }
  };

  const loadThreads = async () => {
    if (!id) return;
    try {
      setThreadList(await threads.list(id));
    } catch {}
  };

  const loadComments = async (threadId?: string | null) => {
    if (!id) return;
    try {
      const tid = threadId !== undefined ? threadId : activeThreadId;
      setCommentList(await comments.list(id, tid === null ? '' : tid));
    } catch {}
  };

  const handleThreadChange = (threadId: string | null) => {
    setActiveThreadId(threadId);
    setExpandedTopicId(null);
    setExpandedTopic(null);
    setTopicCommentList([]);
    if (!id) return;
    const thread = threadList.find(t => t.id === threadId);
    if (thread?.type === 'community') {
      loadTopics(threadId!, topicSort);
    } else {
      comments.list(id, threadId === null ? '' : threadId).then(setCommentList).catch(() => {});
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newThreadTitle.trim()) return;
    try {
      await threads.create(id, newThreadTitle, newThreadPermission, newThreadType);
      setNewThreadTitle('');
      setNewThreadPermission('open');
      setNewThreadType('channel');
      setShowNewThread(false);
      loadThreads();
    } catch (err: any) { setError(err.message); }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Delete this thread and all its comments?')) return;
    try {
      await threads.remove(threadId);
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        loadComments(null);
      }
      loadThreads();
    } catch (err: any) { setError(err.message); }
  };

  const handleThreadPermissionChange = async (threadId: string, permission: string) => {
    try {
      await threads.update(threadId, permission);
      loadThreads();
    } catch (err: any) { setError(err.message); }
  };

  const handleJoin = async () => {
    if (!id) return;
    try {
      await members.join(id);
      setIsMember(true);
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

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCommentImage(file);
    setCommentImagePreview(URL.createObjectURL(file));
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || (!newComment.trim() && !commentImage)) return;
    try {
      if (commentImage) {
        await comments.createWithImage(id, commentImage, newComment || ' ', activeThreadId || undefined);
      } else {
        await comments.create(id, newComment, activeThreadId || undefined);
      }
      setNewComment('');
      setCommentImage(null);
      setCommentImagePreview('');
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

  const handleRepost = async () => {
    if (!id) return;
    try {
      await posts.repost(id);
      setReposted(true);
    } catch (err: any) { setError(err.message); }
  };

  // --- Community thread (topics) handlers ---

  const loadTopics = async (threadId: string, sort: 'new' | 'top') => {
    try {
      setTopicList(await topics.list(threadId, sort));
    } catch {}
  };

  const handleTopicSortChange = (sort: 'new' | 'top') => {
    setTopicSort(sort);
    if (activeThreadId) loadTopics(activeThreadId, sort);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || !newTopicTitle.trim() || !newTopicContent.trim()) return;
    try {
      if (newTopicImage) {
        await topics.createWithImage(activeThreadId, newTopicImage, newTopicTitle, newTopicContent);
      } else {
        await topics.create(activeThreadId, newTopicTitle, newTopicContent);
      }
      setNewTopicTitle('');
      setNewTopicContent('');
      setNewTopicImage(null);
      setNewTopicImagePreview('');
      setShowNewTopic(false);
      loadTopics(activeThreadId, topicSort);
    } catch (err: any) { setError(err.message); }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      await topics.remove(topicId);
      if (expandedTopicId === topicId) {
        setExpandedTopicId(null);
        setExpandedTopic(null);
        setTopicCommentList([]);
      }
      if (activeThreadId) loadTopics(activeThreadId, topicSort);
    } catch (err: any) { setError(err.message); }
  };

  const handleTopicVote = async (topicId: string) => {
    try {
      const result = await topics.vote(topicId);
      setTopicList(prev => prev.map(t => t.id === topicId ? { ...t, score: result.score, userVoted: result.voted } : t));
      if (expandedTopic?.id === topicId) {
        setExpandedTopic((prev: any) => prev ? { ...prev, score: result.score, userVoted: result.voted } : prev);
      }
    } catch (err: any) { setError(err.message); }
  };

  const handleExpandTopic = async (topic: any) => {
    if (expandedTopicId === topic.id) {
      setExpandedTopicId(null);
      setExpandedTopic(null);
      setTopicCommentList([]);
      return;
    }
    setExpandedTopicId(topic.id);
    setExpandedTopic(topic);
    setReplyingTo(null);
    setReplyContent('');
    try {
      setTopicCommentList(await topicComments.list(topic.id));
    } catch {}
  };

  const handleTopicCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTopicCommentImage(file);
    setTopicCommentImagePreview(URL.createObjectURL(file));
  };

  const handleCreateTopicComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedTopicId || (!newTopicComment.trim() && !topicCommentImage)) return;
    try {
      if (topicCommentImage) {
        await topicComments.createWithImage(expandedTopicId, topicCommentImage, newTopicComment || ' ');
      } else {
        await topicComments.create(expandedTopicId, newTopicComment);
      }
      setNewTopicComment('');
      setTopicCommentImage(null);
      setTopicCommentImagePreview('');
      setTopicCommentList(await topicComments.list(expandedTopicId));
      if (activeThreadId) loadTopics(activeThreadId, topicSort);
    } catch (err: any) { setError(err.message); }
  };

  const handleCreateReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!expandedTopicId || !replyContent.trim()) return;
    try {
      await topicComments.create(expandedTopicId, replyContent, parentId);
      setReplyingTo(null);
      setReplyContent('');
      setTopicCommentList(await topicComments.list(expandedTopicId));
      if (activeThreadId) loadTopics(activeThreadId, topicSort);
    } catch (err: any) { setError(err.message); }
  };

  const handleDeleteTopicComment = async (commentId: string) => {
    if (!expandedTopicId) return;
    try {
      await topicComments.remove(commentId);
      setTopicCommentList(await topicComments.list(expandedTopicId));
      if (activeThreadId) loadTopics(activeThreadId, topicSort);
    } catch (err: any) { setError(err.message); }
  };

  const handleTopicCommentVote = async (commentId: string) => {
    try {
      const result = await topicComments.vote(commentId);
      setTopicCommentList(prev => prev.map(c => {
        if (c.id === commentId) return { ...c, score: result.score, userVoted: result.voted };
        if (c.replies) {
          return { ...c, replies: c.replies.map((r: any) => r.id === commentId ? { ...r, score: result.score, userVoted: result.voted } : r) };
        }
        return c;
      }));
    } catch (err: any) { setError(err.message); }
  };

  const canModerate = isOrganizer || myRole === 'moderator';

  // Get active thread's permission and type
  const activeThread = threadList.find(t => t.id === activeThreadId);
  const threadPermission = activeThread?.permission || 'open';
  const isCommunityThread = activeThread?.type === 'community';
  const canPostInThread = activeThreadId === null
    || threadPermission === 'open'
    || (threadPermission === 'readonly' && canModerate);
  const threadLocked = activeThreadId !== null && threadPermission === 'locked';

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
            <img src={imageUrl(event.imageUrl)} alt={event.title} className="event-image" />
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

      <div style={{ marginTop: '12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {isMember ? (
          !isOrganizer && <button onClick={handleLeave}>Leave Event</button>
        ) : (
          <button onClick={handleJoin}>Join Event</button>
        )}
        {currentUser && (
          reposted ? (
            <button disabled style={{ background: '#33301e', color: '#a09878' }}>Shared!</button>
          ) : (
            <button onClick={handleRepost} style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #d4a520' }}>
              Share to Profile
            </button>
          )
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

          {/* Thread tab bar */}
          <div className="thread-tabs">
            <button
              className={`thread-tab ${activeThreadId === null ? 'thread-tab-active' : ''}`}
              onClick={() => handleThreadChange(null)}
            >
              General
            </button>
            {threadList.map(t => (
              <div key={t.id} className="thread-tab-wrapper">
                <button
                  className={`thread-tab ${activeThreadId === t.id ? 'thread-tab-active' : ''}`}
                  onClick={() => handleThreadChange(t.id)}
                >
                  {t.title}
                  {t.type === 'community' && (
                    <span className="thread-permission-badge" style={{ background: 'rgba(100, 149, 237, 0.2)', color: '#6495ed' }}>Community</span>
                  )}
                  <span className={`thread-permission-badge thread-permission-${t.permission}`}>
                    {t.permission === 'locked' ? 'Locked' : t.permission === 'readonly' ? 'Read-only' : ''}
                  </span>
                </button>
                {isOrganizer && (
                  <div className="thread-tab-controls">
                    <select
                      value={t.permission}
                      onChange={e => handleThreadPermissionChange(t.id, e.target.value)}
                      className="thread-permission-select"
                    >
                      <option value="open">Open</option>
                      <option value="readonly">Read-only</option>
                      <option value="locked">Locked</option>
                    </select>
                    <button className="btn-danger btn-sm" onClick={() => handleDeleteThread(t.id)} style={{ padding: '2px 6px', fontSize: 11 }}>X</button>
                  </div>
                )}
              </div>
            ))}
            {isOrganizer && (
              <button
                className="thread-tab thread-tab-add"
                onClick={() => setShowNewThread(!showNewThread)}
              >
                +
              </button>
            )}
          </div>

          {/* New thread form */}
          {showNewThread && isOrganizer && (
            <form onSubmit={handleCreateThread} className="thread-create-form">
              <input
                placeholder="Thread name..."
                value={newThreadTitle}
                onChange={e => setNewThreadTitle(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={newThreadPermission} onChange={e => setNewThreadPermission(e.target.value)}
                  style={{ padding: '8px', borderRadius: 6, border: '1px solid #33301e', background: '#16160f', color: '#eee8d5', fontSize: 13, flex: 1 }}>
                  <option value="open">Open</option>
                  <option value="readonly">Read-only</option>
                  <option value="locked">Locked</option>
                </select>
                <select value={newThreadType} onChange={e => setNewThreadType(e.target.value)}
                  style={{ padding: '8px', borderRadius: 6, border: '1px solid #33301e', background: '#16160f', color: '#eee8d5', fontSize: 13, flex: 1 }}>
                  <option value="channel">Channel</option>
                  <option value="community">Community</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="submit" className="btn-sm">Create</button>
                <button type="button" className="btn-sm" onClick={() => setShowNewThread(false)} style={{ background: 'transparent', color: '#6b6348', border: '1px solid #33301e' }}>Cancel</button>
              </div>
            </form>
          )}

          {/* Community thread UI */}
          {isCommunityThread ? (
            <>
              {/* Sort toggle + New Topic */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="topic-sort-toggle">
                  <button className={`topic-sort-btn ${topicSort === 'new' ? 'topic-sort-active' : ''}`} onClick={() => handleTopicSortChange('new')}>New</button>
                  <button className={`topic-sort-btn ${topicSort === 'top' ? 'topic-sort-active' : ''}`} onClick={() => handleTopicSortChange('top')}>Top</button>
                </div>
                {!threadLocked && canPostInThread && (
                  <button className="btn-sm" onClick={() => setShowNewTopic(!showNewTopic)}
                    style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #d4a520' }}>
                    {showNewTopic ? 'Cancel' : 'New Topic'}
                  </button>
                )}
              </div>

              {threadLocked && (
                <p style={{ color: '#6b6348', fontStyle: 'italic', marginBottom: 12 }}>This thread is locked.</p>
              )}
              {!threadLocked && !canPostInThread && (
                <p style={{ color: '#6b6348', fontStyle: 'italic', marginBottom: 12 }}>Only organizers and moderators can create topics in this thread.</p>
              )}

              {/* New topic form */}
              {showNewTopic && !threadLocked && canPostInThread && (
                <form onSubmit={handleCreateTopic} className="topic-create-form">
                  <input
                    placeholder="Topic title..."
                    value={newTopicTitle}
                    onChange={e => setNewTopicTitle(e.target.value)}
                    required
                  />
                  <textarea
                    placeholder="What do you want to discuss?"
                    value={newTopicContent}
                    onChange={e => setNewTopicContent(e.target.value)}
                    required
                    style={{ minHeight: 60 }}
                  />
                  {newTopicImagePreview && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={newTopicImagePreview} alt="Preview" className="comment-photo" />
                      <button type="button" className="btn-danger btn-sm"
                        style={{ position: 'absolute', top: 2, right: 2, padding: '1px 4px', fontSize: 10 }}
                        onClick={() => { setNewTopicImage(null); setNewTopicImagePreview(''); }}>X</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn-sm" onClick={() => topicImageRef.current?.click()}
                      style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #33301e' }}>
                      Attach Photo
                    </button>
                    <input ref={topicImageRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) { setNewTopicImage(f); setNewTopicImagePreview(URL.createObjectURL(f)); } }} />
                    <button type="submit">Post Topic</button>
                  </div>
                </form>
              )}

              {/* Topic list */}
              {topicList.length === 0 && <p>No topics yet.</p>}
              {topicList.map(topic => (
                <div key={topic.id}>
                  <div className="topic-card" onClick={() => handleExpandTopic(topic)}>
                    <div className="topic-vote-col" onClick={e => e.stopPropagation()}>
                      <button
                        className={`topic-vote-btn ${topic.userVoted ? 'topic-vote-active' : ''}`}
                        onClick={() => !threadLocked && handleTopicVote(topic.id)}
                        disabled={threadLocked}
                      >&#9650;</button>
                      <span className="topic-score">{topic.score}</span>
                    </div>
                    <div className="topic-content-col">
                      <div className="topic-header">
                        <strong>{topic.title}</strong>
                      </div>
                      <div className="topic-meta">
                        <UserLink user={topic.author} size={18} />
                        <span style={{ color: '#6b6348', fontSize: 12 }}>{new Date(topic.createdAt).toLocaleString()}</span>
                        <span style={{ color: '#6b6348', fontSize: 12 }}>{topic.commentCount} comment{topic.commentCount !== 1 ? 's' : ''}</span>
                      </div>
                      {(isOrganizer || myRole === 'moderator' || topic.authorId === currentUser?.id) && (
                        <button className="btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDeleteTopic(topic.id); }}
                          style={{ position: 'absolute', top: 8, right: 8, padding: '2px 6px', fontSize: 11 }}>X</button>
                      )}
                    </div>
                  </div>

                  {/* Expanded topic */}
                  {expandedTopicId === topic.id && (
                    <div className="topic-expanded">
                      <div className="topic-body">
                        <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{topic.content}</p>
                        {topic.imageUrl && (
                          <img src={imageUrl(topic.imageUrl)} alt="topic" className="comment-photo" style={{ marginTop: 8 }} />
                        )}
                      </div>

                      <div className="topic-comments-section">
                        <h3 style={{ fontSize: 14, color: '#d4a520', marginBottom: 8 }}>Comments</h3>

                        {topicCommentList.length === 0 && <p style={{ color: '#6b6348', fontSize: 13 }}>No comments yet.</p>}
                        {topicCommentList.map(c => (
                          <div key={c.id} className="topic-comment">
                            <div className="topic-comment-main">
                              <div style={{ display: 'flex', gap: 8 }}>
                                <div className="topic-vote-col-sm" onClick={e => e.stopPropagation()}>
                                  <button
                                    className={`topic-vote-btn-sm ${c.userVoted ? 'topic-vote-active' : ''}`}
                                    onClick={() => !threadLocked && handleTopicCommentVote(c.id)}
                                    disabled={threadLocked}
                                  >&#9650;</button>
                                  <span style={{ fontSize: 11, color: c.userVoted ? '#d4a520' : '#a09878' }}>{c.score}</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Avatar user={c.author} size={22} />
                                    <strong style={{ fontSize: 13 }}><UserLink user={c.author} showAvatar={false} /></strong>
                                    <small style={{ color: '#6b6348' }}>{new Date(c.createdAt).toLocaleString()}</small>
                                  </div>
                                  <p style={{ fontSize: 14, marginTop: 4 }}>{c.content}</p>
                                  {c.imageUrl && <img src={imageUrl(c.imageUrl)} alt="comment" className="comment-photo" />}
                                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                    {!threadLocked && (
                                      <button className="btn-sm" onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyContent(''); }}
                                        style={{ background: 'transparent', color: '#a09878', border: 'none', padding: '2px 4px', fontSize: 12 }}>
                                        Reply
                                      </button>
                                    )}
                                    {(isOrganizer || myRole === 'moderator' || c.authorId === currentUser?.id) && (
                                      <button className="btn-danger btn-sm" onClick={() => handleDeleteTopicComment(c.id)}
                                        style={{ padding: '2px 6px', fontSize: 11 }}>X</button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Reply form */}
                            {replyingTo === c.id && (
                              <form onSubmit={e => handleCreateReply(e, c.id)} style={{ marginLeft: 40, marginTop: 4, marginBottom: 8, display: 'flex', gap: 6, flexDirection: 'row' }}>
                                <input placeholder="Write a reply..." value={replyContent} onChange={e => setReplyContent(e.target.value)}
                                  style={{ flex: 1, fontSize: 13, padding: 6 }} />
                                <button type="submit" className="btn-sm">Reply</button>
                              </form>
                            )}

                            {/* Nested replies */}
                            {c.replies && c.replies.map((r: any) => (
                              <div key={r.id} className="topic-comment-reply">
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <div className="topic-vote-col-sm" onClick={e => e.stopPropagation()}>
                                    <button
                                      className={`topic-vote-btn-sm ${r.userVoted ? 'topic-vote-active' : ''}`}
                                      onClick={() => !threadLocked && handleTopicCommentVote(r.id)}
                                      disabled={threadLocked}
                                    >&#9650;</button>
                                    <span style={{ fontSize: 11, color: r.userVoted ? '#d4a520' : '#a09878' }}>{r.score}</span>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <Avatar user={r.author} size={20} />
                                      <strong style={{ fontSize: 12 }}><UserLink user={r.author} showAvatar={false} /></strong>
                                      <small style={{ color: '#6b6348' }}>{new Date(r.createdAt).toLocaleString()}</small>
                                    </div>
                                    <p style={{ fontSize: 13, marginTop: 3 }}>{r.content}</p>
                                    {r.imageUrl && <img src={imageUrl(r.imageUrl)} alt="reply" className="comment-photo" />}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                                      {!threadLocked && (
                                        <button className="btn-sm" onClick={() => { setReplyingTo(c.id); setReplyContent(`@${r.author?.username || r.author?.displayName || ''} `); }}
                                          style={{ background: 'transparent', color: '#a09878', border: 'none', padding: '2px 4px', fontSize: 12 }}>
                                          Reply
                                        </button>
                                      )}
                                      {(isOrganizer || myRole === 'moderator' || r.authorId === currentUser?.id) && (
                                        <button className="btn-danger btn-sm" onClick={() => handleDeleteTopicComment(r.id)}
                                          style={{ padding: '2px 6px', fontSize: 11 }}>X</button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}

                        {/* New comment on topic */}
                        {!threadLocked && (
                          <form onSubmit={handleCreateTopicComment} style={{ marginTop: 8 }}>
                            <input
                              placeholder="Write a comment..."
                              value={newTopicComment}
                              onChange={e => setNewTopicComment(e.target.value)}
                            />
                            {topicCommentImagePreview && (
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img src={topicCommentImagePreview} alt="Preview" className="comment-photo" />
                                <button type="button" className="btn-danger btn-sm"
                                  style={{ position: 'absolute', top: 2, right: 2, padding: '1px 4px', fontSize: 10 }}
                                  onClick={() => { setTopicCommentImage(null); setTopicCommentImagePreview(''); }}>X</button>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="button" className="btn-sm" onClick={() => topicCommentImageRef.current?.click()}
                                style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #33301e' }}>
                                Attach Photo
                              </button>
                              <input ref={topicCommentImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleTopicCommentImageSelect} />
                              <button type="submit">Send</button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Channel thread: flat comments (existing behavior) */}
              {commentList.length === 0 && <p>No comments yet.</p>}
              {commentList.map(c => (
                <div key={c.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Avatar user={c.author} size={32} />
                      <div>
                        <strong><UserLink user={c.author} showAvatar={false} /></strong>
                        <p>{c.content}</p>
                        {c.imageUrl && (
                          <img src={imageUrl(c.imageUrl)} alt="comment" className="comment-photo" />
                        )}
                        <small>{new Date(c.createdAt).toLocaleString()}</small>
                      </div>
                    </div>
                    {(isOrganizer || myRole === 'moderator' || c.authorId === currentUser?.id) && (
                      <button className="btn-danger btn-sm" onClick={() => handleDeleteComment(c.id)}>X</button>
                    )}
                  </div>
                </div>
              ))}

              {/* Comment form */}
              {threadLocked ? (
                <p style={{ color: '#6b6348', fontStyle: 'italic', marginTop: 8 }}>This thread is locked.</p>
              ) : !canPostInThread ? (
                <p style={{ color: '#6b6348', fontStyle: 'italic', marginTop: 8 }}>Only organizers and moderators can post in this thread.</p>
              ) : (
                <form onSubmit={handleComment}>
                  <input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                  />
                  {commentImagePreview && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={commentImagePreview} alt="Preview" className="comment-photo" />
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        style={{ position: 'absolute', top: 2, right: 2, padding: '1px 4px', fontSize: 10 }}
                        onClick={() => { setCommentImage(null); setCommentImagePreview(''); }}
                      >X</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn-sm" onClick={() => commentImageRef.current?.click()}
                      style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #33301e' }}>
                      Attach Photo
                    </button>
                    <input ref={commentImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCommentImageSelect} />
                    <button type="submit">Send</button>
                  </div>
                </form>
              )}
            </>
          )}
        </>
      )}
    </div>
    </>
  );
}
