import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, events, users, friends, follows, invites, members, posts, clearToken, imageUrl } from '../api';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import UserLink from '../components/UserLink';
import PostCard from '../components/PostCard';

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);
  const [friendList, setFriendList] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [eventInvites, setEventInvites] = useState<any[]>([]);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null);
  const [followList, setFollowList] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Posts
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState('');
  const [repostEventId, setRepostEventId] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const postImageRef = useRef<HTMLInputElement>(null);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    auth.me().then((u: any) => {
      setUser(u);
      follows.counts(u.id).then(setFollowCounts).catch(() => {});
    }).catch(() => {});
    events.myCreated().then(setMyEvents).catch(() => {});
    events.myJoined().then(setJoinedEvents).catch(() => {});
    friends.list().then(setFriendList).catch(() => {});
    friends.requests().then(setFriendRequests).catch(() => {});
    invites.list().then(setEventInvites).catch(() => {});
    loadMyPosts();
  }, []);

  const loadMyPosts = () => {
    auth.me().then((u: any) => {
      posts.userPosts(u.id).then((res: any) => setMyPosts(res.data || [])).catch(() => {});
    }).catch(() => {});
  };

  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPostImage(file);
    setPostImagePreview(URL.createObjectURL(file));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postSubmitting) return;
    setPostSubmitting(true);
    try {
      if (repostEventId) {
        await posts.repost(repostEventId);
      } else if (postImage) {
        await posts.createImage(postImage, postContent || undefined);
      } else if (postContent.trim()) {
        await posts.createText(postContent);
      }
      setPostContent('');
      setPostImage(null);
      setPostImagePreview('');
      setRepostEventId('');
      loadMyPosts();
    } catch (err: any) {
      setError(err.message || 'Failed to create post.');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await posts.remove(postId);
      setMyPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete post.');
    }
  };

  const openFollowModal = async (type: 'followers' | 'following') => {
    if (!user) return;
    setShowFollowModal(type);
    try {
      const list = type === 'followers'
        ? await follows.followers(user.id)
        : await follows.following(user.id);
      setFollowList(list);
    } catch {
      setFollowList([]);
    }
  };

  const logout = () => {
    clearToken();
    navigate('/login');
  };

  const startEditing = () => {
    setEditName(user.displayName || '');
    setEditBio(user.bio || '');
    setEditing(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await users.uploadAvatar(file);
      setUser(updated);
    } catch {}
  };

  const handleAcceptFriend = async (id: string) => {
    try {
      await friends.accept(id);
      setFriendRequests(prev => prev.filter(r => r.id !== id));
      friends.list().then(setFriendList).catch(() => {});
    } catch {}
  };

  const handleDeclineFriend = async (id: string) => {
    try {
      await friends.remove(id);
      setFriendRequests(prev => prev.filter(r => r.id !== id));
    } catch {}
  };

  const handleRemoveFriend = async (id: string) => {
    try {
      await friends.remove(id);
      setFriendList(prev => prev.filter(f => f.id !== id));
    } catch {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await users.updateMe({
        displayName: editName || undefined,
        bio: editBio || undefined,
      });
      setUser(updated);
      setEditing(false);
    } catch {}
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');
    try {
      await auth.changePassword(oldPassword, newPassword);
      setPasswordMsg('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await users.deleteMe();
      clearToken();
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account.');
    }
  };

  const handleAcceptInvite = async (eventId: string) => {
    try {
      await members.acceptInvite(eventId);
      setEventInvites(prev => prev.filter(i => i.eventId !== eventId));
    } catch (err: any) { setError(err.message); }
  };

  const handleDeclineInvite = async (eventId: string) => {
    try {
      await members.declineInvite(eventId);
      setEventInvites(prev => prev.filter(i => i.eventId !== eventId));
    } catch (err: any) { setError(err.message); }
  };

  return (
    <>
      <Navbar />
      <div className="page">
        {user && (
          <div className="card profile-card">
            <Avatar user={user} size={80} />
            <div className="profile-info">
              {editing ? (
                <form onSubmit={handleSave}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <button type="button" onClick={() => fileRef.current?.click()}>
                      Change Avatar
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <input
                    placeholder="Display name"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                  <textarea
                    placeholder="Bio"
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit">Save</button>
                    <button type="button" className="btn-danger" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <h1>{user.displayName || user.username}</h1>
                  <p>{user.email}</p>
                  {user.bio && <p>{user.bio}</p>}
                  <small>Member since {new Date(user.createdAt).toLocaleDateString()}</small>
                  <div className="profile-stats" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
                    <div className="profile-stat clickable" onClick={() => openFollowModal('followers')}>
                      <strong>{followCounts.followers}</strong>
                      <span>Followers</span>
                    </div>
                    <div className="profile-stat clickable" onClick={() => openFollowModal('following')}>
                      <strong>{followCounts.following}</strong>
                      <span>Following</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <button onClick={startEditing}>Edit Profile</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Create Post */}
        <div className="card create-post-card">
          <strong style={{ color: '#d4a520', marginBottom: 8, display: 'block' }}>Create Post</strong>
          <form onSubmit={handleCreatePost} style={{ marginBottom: 0 }}>
            <textarea
              placeholder="What's on your mind?"
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              style={{ minHeight: 60 }}
            />
            {postImagePreview && (
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <img src={postImagePreview} alt="Preview" className="image-preview" />
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  style={{ position: 'absolute', top: 4, right: 4 }}
                  onClick={() => { setPostImage(null); setPostImagePreview(''); }}
                >
                  X
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => postImageRef.current?.click()}
                style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #d4a520' }}>
                Add Image
              </button>
              <input ref={postImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePostImageSelect} />
              <select
                value={repostEventId}
                onChange={e => setRepostEventId(e.target.value)}
                style={{ padding: '10px', borderRadius: 6, border: '1px solid #33301e', background: '#16160f', color: '#eee8d5', fontSize: 14, fontFamily: 'inherit' }}
              >
                <option value="">Share Event...</option>
                {myEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
              <button type="submit" disabled={postSubmitting || (!postContent.trim() && !postImage && !repostEventId)}>
                {postSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        {error && <p className="error">{error}</p>}
        {passwordMsg && <p style={{ color: '#4caf50', marginBottom: 10 }}>{passwordMsg}</p>}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Link to="/events/new"><button>Create Event</button></Link>
          <button
            style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #d4a520' }}
            onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordError(''); }}
          >
            Change Password
          </button>
          <button className="btn-danger" onClick={logout}>Sign Out</button>
          <button
            className="btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ marginLeft: 'auto' }}
          >
            Delete Account
          </button>
        </div>

        {/* Password change form */}
        {showPasswordForm && (
          <div className="card" style={{ marginBottom: 16 }}>
            <strong>Change Password</strong>
            <form onSubmit={handlePasswordChange} style={{ marginTop: 8, marginBottom: 0 }}>
              <input
                type="password"
                placeholder="Current password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              {passwordError && <p className="error">{passwordError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit">Update Password</button>
                <button type="button" className="btn-danger" onClick={() => setShowPasswordForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Delete account confirmation */}
        {showDeleteConfirm && (
          <div className="card" style={{ marginBottom: 16, borderColor: '#8b2020' }}>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: '#e74c3c' }}>Are you sure you want to delete your account?</strong>
              <br />
              <span style={{ color: '#a09878', fontSize: 13 }}>This action cannot be undone. All your data will be permanently removed.</span>
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-danger" onClick={handleDeleteAccount}>Yes, Delete My Account</button>
              <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Event invitations */}
        {eventInvites.length > 0 && (
          <>
            <h2>Event Invitations ({eventInvites.length})</h2>
            {eventInvites.map(inv => (
              <div key={inv.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Link to={`/events/${inv.eventId}`} style={{ fontWeight: 600 }}>{inv.event?.title || 'Event'}</Link>
                  {inv.event?.organizer && (
                    <span style={{ color: '#6b6348', fontSize: 13, marginLeft: 8 }}>
                      by {inv.event.organizer.displayName || inv.event.organizer.username}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-sm" onClick={() => handleAcceptInvite(inv.eventId)}>Accept</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDeclineInvite(inv.eventId)}>Decline</button>
                </div>
              </div>
            ))}
          </>
        )}

        {friendRequests.length > 0 && (
          <>
            <h2>Friend Requests ({friendRequests.length})</h2>
            {friendRequests.map(req => (
              <div key={req.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <UserLink user={req.requester} size={32} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-sm" onClick={() => handleAcceptFriend(req.id)}>Accept</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDeclineFriend(req.id)}>Decline</button>
                </div>
              </div>
            ))}
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2>Friends ({friendList.length})</h2>
          <Link to="/people"><button className="btn-sm" style={{ marginTop: 16 }}>Find People</button></Link>
        </div>
        {friendList.length === 0 && <p>No friends yet.</p>}
        {friendList.map(f => {
          const friend = f.requesterId === user?.id ? f.addressee : f.requester;
          return (
            <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <UserLink user={friend} size={32} />
              <button className="btn-danger btn-sm" onClick={() => handleRemoveFriend(f.id)}>Remove</button>
            </div>
          );
        })}

        <h2>Events You're Attending ({joinedEvents.length})</h2>
        {joinedEvents.length === 0 && <p>You haven't joined any events yet.</p>}
        <div className="event-grid">
          {joinedEvents.map(ev => (
            <Link key={ev.id} to={`/events/${ev.id}`}>
              <div className="card event-card">
                {ev.imageUrl ? (
                  <img src={imageUrl(ev.imageUrl)} alt={ev.title} className="card-thumbnail" />
                ) : (
                  <div className="card-no-image">No image</div>
                )}
                <div className="event-card-body">
                  <h3>{ev.title}</h3>
                  <p>{ev.description.substring(0, 80)}</p>
                  <small>{ev.status} &middot; {ev.organizer?.displayName}</small>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <h2>Events You Created ({myEvents.length})</h2>
        {myEvents.length === 0 && <p>You haven't created any events yet.</p>}
        <div className="event-grid">
          {myEvents.map(ev => (
            <Link key={ev.id} to={`/events/${ev.id}`}>
              <div className="card event-card">
                {ev.imageUrl ? (
                  <img src={imageUrl(ev.imageUrl)} alt={ev.title} className="card-thumbnail" />
                ) : (
                  <div className="card-no-image">No image</div>
                )}
                <div className="event-card-body">
                  <h3>{ev.title}</h3>
                  <p>{ev.description.substring(0, 80)}</p>
                  <small>{ev.status}</small>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <h2>My Posts ({myPosts.length})</h2>
        {myPosts.length === 0 && <p>No posts yet.</p>}
        {myPosts.map((post: any) => (
          <PostCard key={post.id} post={post} currentUser={user} onDelete={handleDeletePost} />
        ))}

        {showFollowModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowFollowModal(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h2>{showFollowModal === 'followers' ? 'Followers' : 'Following'}</h2>
              {followList.length === 0 && (
                <p style={{ color: '#6b6348' }}>
                  {showFollowModal === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {followList.map((f: any) => {
                  const u = showFollowModal === 'followers' ? f.follower : f.following;
                  return (
                    <div
                      key={f.id}
                      className="card"
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => { setShowFollowModal(null); navigate(`/users/${u.id}`); }}
                    >
                      <UserLink user={u} size={32} />
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '16px' }}>
                <button className="btn-danger" onClick={() => setShowFollowModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
