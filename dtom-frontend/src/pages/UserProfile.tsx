import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usersApi, friends, follows, auth, posts, imageUrl } from '../api';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import UserLink from '../components/UserLink';
import PostCard from '../components/PostCard';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friendStatus, setFriendStatus] = useState<{
    status: string | null;
    friendshipId: string | null;
    direction: string | null;
  }>({ status: null, friendshipId: null, direction: null });
  const [activity, setActivity] = useState<{
    createdEvents: any[];
    joinedEvents: any[];
    recentComments: any[];
  }>({ createdEvents: [], joinedEvents: [], recentComments: [] });
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null);
  const [followList, setFollowList] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'created' | 'joined' | 'comments'>('posts');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setShowFollowModal(null);
    Promise.all([
      usersApi.get(id),
      auth.me(),
      friends.status(id),
      usersApi.activity(id),
      follows.counts(id),
      follows.status(id),
      posts.userPosts(id),
    ])
      .then(([userData, me, fStatus, act, fCounts, fFollowing, userPostsData]) => {
        setUser(userData);
        setCurrentUser(me);
        setFriendStatus(fStatus);
        setActivity(act);
        setFollowCounts(fCounts);
        setIsFollowing(fFollowing.isFollowing);
        setUserPosts(userPostsData.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!id) return;
    try {
      await follows.follow(id);
      setIsFollowing(true);
      setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
    } catch {}
  };

  const handleUnfollow = async () => {
    if (!id) return;
    try {
      await follows.unfollow(id);
      setIsFollowing(false);
      setFollowCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
    } catch {}
  };

  const openFollowModal = async (type: 'followers' | 'following') => {
    if (!id) return;
    setShowFollowModal(type);
    try {
      const list = type === 'followers'
        ? await follows.followers(id)
        : await follows.following(id);
      setFollowList(list);
    } catch {
      setFollowList([]);
    }
  };

  const handleAddFriend = async () => {
    if (!id) return;
    try {
      await friends.send(id);
      setFriendStatus({ status: 'pending', friendshipId: null, direction: 'outgoing' });
    } catch {}
  };

  const handleAccept = async () => {
    if (!friendStatus.friendshipId) return;
    try {
      await friends.accept(friendStatus.friendshipId);
      setFriendStatus({ ...friendStatus, status: 'accepted' });
    } catch {}
  };

  const handleDecline = async () => {
    if (!friendStatus.friendshipId) return;
    try {
      await friends.remove(friendStatus.friendshipId);
      setFriendStatus({ status: null, friendshipId: null, direction: null });
    } catch {}
  };

  const handleRemove = async () => {
    if (!friendStatus.friendshipId) return;
    try {
      await friends.remove(friendStatus.friendshipId);
      setFriendStatus({ status: null, friendshipId: null, direction: null });
    } catch {}
  };

  if (loading) return <><Navbar /><p style={{ padding: 40 }}>Loading...</p></>;
  if (!user) return <><Navbar /><p style={{ padding: 40 }}>User not found.</p></>;

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="card profile-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Avatar user={user} size={80} />
          <div className="profile-info" style={{ textAlign: 'center' }}>
            <h1>{user.displayName || user.username}</h1>
            <p>@{user.username}</p>
            {user.bio && <p style={{ marginTop: 8 }}>{user.bio}</p>}
            <small>Member since {new Date(user.createdAt).toLocaleDateString()}</small>

            <div className="profile-stats">
              <div className="profile-stat clickable" onClick={() => openFollowModal('followers')}>
                <strong>{followCounts.followers}</strong>
                <span>Followers</span>
              </div>
              <div className="profile-stat clickable" onClick={() => openFollowModal('following')}>
                <strong>{followCounts.following}</strong>
                <span>Following</span>
              </div>
              <div className="profile-stat">
                <strong>{activity.createdEvents.length}</strong>
                <span>Created</span>
              </div>
              <div className="profile-stat">
                <strong>{activity.joinedEvents.length}</strong>
                <span>Joined</span>
              </div>
            </div>
          </div>
        </div>

        {!isOwnProfile && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px', marginBottom: '24px' }}>
            {isFollowing ? (
              <button
                onClick={handleUnfollow}
                style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #d4a520' }}
              >
                Unfollow
              </button>
            ) : (
              <button onClick={handleFollow}>Follow</button>
            )}
            {friendStatus.status === null && (
              <button className="friend-btn" onClick={handleAddFriend}>Add Friend</button>
            )}
            {friendStatus.status === 'pending' && friendStatus.direction === 'outgoing' && (
              <button className="friend-btn friend-btn-pending" disabled>Request Pending</button>
            )}
            {friendStatus.status === 'pending' && friendStatus.direction === 'incoming' && (
              <>
                <button className="friend-btn" onClick={handleAccept}>Accept Request</button>
                <button className="btn-danger" onClick={handleDecline}>Decline</button>
              </>
            )}
            {friendStatus.status === 'accepted' && (
              <button className="friend-btn friend-btn-friends" onClick={handleRemove}>Remove Friend</button>
            )}
            <button
              onClick={() => navigate(`/messages/${user.id}`)}
              style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #d4a520' }}
            >
              Send Message
            </button>
          </div>
        )}

        {isOwnProfile && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px', marginBottom: '24px' }}>
            <button onClick={() => navigate('/account')}>Edit Profile</button>
          </div>
        )}

        <div className="tabs">
          <button className={`tab ${activeTab === 'posts' ? 'tab-active' : ''}`} onClick={() => setActiveTab('posts')}>
            Posts ({userPosts.length})
          </button>
          <button className={`tab ${activeTab === 'created' ? 'tab-active' : ''}`} onClick={() => setActiveTab('created')}>
            Events Created ({activity.createdEvents.length})
          </button>
          <button className={`tab ${activeTab === 'joined' ? 'tab-active' : ''}`} onClick={() => setActiveTab('joined')}>
            Events Joined ({activity.joinedEvents.length})
          </button>
          <button className={`tab ${activeTab === 'comments' ? 'tab-active' : ''}`} onClick={() => setActiveTab('comments')}>
            Comments ({activity.recentComments.length})
          </button>
        </div>

        {activeTab === 'posts' && (
          <>
            {userPosts.length === 0 && <p style={{ color: '#6b6348' }}>No posts yet.</p>}
            {userPosts.map((post: any) => (
              <PostCard key={post.id} post={post} currentUser={currentUser} />
            ))}
          </>
        )}

        {activeTab === 'created' && (
          <>
            {activity.createdEvents.length === 0 && <p style={{ color: '#6b6348' }}>No events created yet.</p>}
            <div className="event-grid">
              {activity.createdEvents.map((ev: any) => (
                <Link key={ev.id} to={`/events/${ev.id}`}>
                  <div className="card event-card">
                    {ev.imageUrl ? (
                      <img src={imageUrl(ev.imageUrl)} alt={ev.title} className="card-thumbnail" />
                    ) : (
                      <div className="card-no-image">No image</div>
                    )}
                    <div className="event-card-body">
                      <h3>{ev.title}</h3>
                      <p>{ev.description?.substring(0, 80)}</p>
                      <small>{ev.status}</small>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {activeTab === 'joined' && (
          <>
            {activity.joinedEvents.length === 0 && <p style={{ color: '#6b6348' }}>No events joined yet.</p>}
            <div className="event-grid">
              {activity.joinedEvents.map((ev: any) => (
                <Link key={ev.id} to={`/events/${ev.id}`}>
                  <div className="card event-card">
                    {ev.imageUrl ? (
                      <img src={imageUrl(ev.imageUrl)} alt={ev.title} className="card-thumbnail" />
                    ) : (
                      <div className="card-no-image">No image</div>
                    )}
                    <div className="event-card-body">
                      <h3>{ev.title}</h3>
                      <p>{ev.description?.substring(0, 80)}</p>
                      <small style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {ev.status} &middot; <UserLink user={ev.organizer} size={16} />
                      </small>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {activeTab === 'comments' && (
          <>
            {activity.recentComments.length === 0 && <p style={{ color: '#6b6348' }}>No comments yet.</p>}
            {activity.recentComments.map((c: any) => (
              <div key={c.id} className="card activity-comment">
                <div className="activity-comment-header">
                  <span style={{ color: '#6b6348', fontSize: 12 }}>
                    commented on{' '}
                    <Link to={`/events/${c.eventId}`} style={{ color: '#d4a520' }}>
                      {c.event?.title || 'an event'}
                    </Link>
                  </span>
                  <small style={{ color: '#6b6348' }}>{new Date(c.createdAt).toLocaleDateString()}</small>
                </div>
                <p style={{ marginTop: 6 }}>{c.content}</p>
              </div>
            ))}
          </>
        )}

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
