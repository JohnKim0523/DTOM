import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi, friends, auth } from '../api';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import UserLink from '../components/UserLink';

export default function PeoplePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friendList, setFriendList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, any>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    auth.me().then(setCurrentUser).catch(() => {});
    friends.list().then(setFriendList).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await usersApi.search(searchQuery.trim());
        setSearchResults(results);
        // Fetch friend status for each result
        const statuses: Record<string, any> = {};
        await Promise.all(
          results.map(async (u: any) => {
            try {
              statuses[u.id] = await friends.status(u.id);
            } catch {
              statuses[u.id] = { status: null, friendshipId: null, direction: null };
            }
          })
        );
        setFriendStatuses(statuses);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [searchQuery]);

  const handleAddFriend = async (userId: string) => {
    try {
      await friends.send(userId);
      setFriendStatuses(prev => ({
        ...prev,
        [userId]: { status: 'pending', friendshipId: null, direction: 'outgoing' },
      }));
    } catch {}
  };

  const handleAcceptFriend = async (userId: string) => {
    const fs = friendStatuses[userId];
    if (!fs?.friendshipId) return;
    try {
      await friends.accept(fs.friendshipId);
      setFriendStatuses(prev => ({
        ...prev,
        [userId]: { ...prev[userId], status: 'accepted' },
      }));
      friends.list().then(setFriendList).catch(() => {});
    } catch {}
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      await friends.remove(friendshipId);
      setFriendList(prev => prev.filter(f => f.id !== friendshipId));
    } catch {}
  };

  const renderFriendButton = (userId: string) => {
    if (userId === currentUser?.id) return null;
    const fs = friendStatuses[userId];
    if (!fs || fs.status === null) {
      return <button className="btn-sm" onClick={() => handleAddFriend(userId)}>Add Friend</button>;
    }
    if (fs.status === 'pending' && fs.direction === 'outgoing') {
      return <button className="btn-sm" disabled style={{ background: '#33301e', color: '#a09878' }}>Pending</button>;
    }
    if (fs.status === 'pending' && fs.direction === 'incoming') {
      return <button className="btn-sm" onClick={() => handleAcceptFriend(userId)}>Accept</button>;
    }
    if (fs.status === 'accepted') {
      return <button className="btn-sm" disabled style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #d4a520' }}>Friends</button>;
    }
    return null;
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>People</h1>

        <div className="search-bar">
          <input
            placeholder="Search by username, email, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {searchQuery.trim() && (
          <>
            <h2>Search Results</h2>
            {searching && <p style={{ color: '#6b6348' }}>Searching...</p>}
            {!searching && searchResults.length === 0 && (
              <p style={{ color: '#6b6348' }}>No users found.</p>
            )}
            <div className="people-list">
              {searchResults.map((u: any) => (
                <div key={u.id} className="card people-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => navigate(`/users/${u.id}`)}>
                    <Avatar user={u} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block' }}>{u.displayName || u.username}</strong>
                      <small style={{ color: '#6b6348' }}>@{u.username}</small>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {renderFriendButton(u.id)}
                    {u.id !== currentUser?.id && (
                      <button className="btn-sm" onClick={() => navigate(`/messages/${u.id}`)}
                        style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #d4a520' }}>
                        DM
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2>Your Friends ({friendList.length})</h2>
        {friendList.length === 0 && <p style={{ color: '#6b6348' }}>No friends yet. Search for users above to add friends.</p>}
        <div className="people-list">
          {friendList.map((f: any) => {
            const friend = f.requesterId === currentUser?.id ? f.addressee : f.requester;
            if (!friend) return null;
            return (
              <div key={f.id} className="card people-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/users/${friend.id}`)}>
                  <Avatar user={friend} size={40} />
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block' }}>{friend.displayName || friend.username}</strong>
                    <small style={{ color: '#6b6348' }}>@{friend.username}</small>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn-sm" onClick={() => navigate(`/messages/${friend.id}`)}
                    style={{ background: '#1a1a14', color: '#d4a520', border: '1px solid #d4a520' }}>
                    DM
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => handleRemoveFriend(f.id)}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
