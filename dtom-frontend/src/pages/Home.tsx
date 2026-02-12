import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { events, search, BACKEND_URL } from '../api';
import Navbar from '../components/Navbar';
import UserLink from '../components/UserLink';

type Tab = 'all' | 'joined';

export default function Home() {
  const [tab, setTab] = useState<Tab>('all');
  const [eventList, setEventList] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ users: any[]; events: any[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) {
      loadEvents();
    }
  }, [tab]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await search(query.trim());
        setSearchResults(results);
      } catch {
        setSearchResults({ users: [], events: [] });
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const loadEvents = async () => {
    try {
      if (tab === 'all') {
        const res = await events.list();
        setEventList(res.data);
      } else {
        setEventList(await events.myJoined());
      }
    } catch {
      setEventList([]);
    }
  };

  const isSearching = query.trim().length > 0;

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search events and people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {isSearching ? (
          <div>
            {searching && <p>Searching...</p>}
            {searchResults && (
              <>
                <h2>People ({searchResults.users.length})</h2>
                {searchResults.users.length === 0 && <p>No people found.</p>}
                <div className="search-people-list">
                  {searchResults.users.map((u: any) => (
                    <div key={u.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <UserLink user={u} size={32} />
                    </div>
                  ))}
                </div>

                <h2>Events ({searchResults.events.length})</h2>
                {searchResults.events.length === 0 && <p>No events found.</p>}
                <div className="event-grid">
                  {searchResults.events.map((ev: any) => (
                    <Link key={ev.id} to={`/events/${ev.id}`}>
                      <div className="card event-card">
                        {ev.imageUrl ? (
                          <img src={`${BACKEND_URL}${ev.imageUrl}`} alt={ev.title} className="card-thumbnail" />
                        ) : (
                          <div className="card-no-image">No image</div>
                        )}
                        <div className="event-card-body">
                          <h3>{ev.title}</h3>
                          <p>{ev.description.substring(0, 80)}</p>
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
          </div>
        ) : (
          <>
            <div className="tabs">
              <button className={`tab ${tab === 'all' ? 'tab-active' : ''}`} onClick={() => setTab('all')}>All Events</button>
              <button className={`tab ${tab === 'joined' ? 'tab-active' : ''}`} onClick={() => setTab('joined')}>Joined</button>
            </div>

            {eventList.length === 0 && <p>No events found.</p>}
            <div className="event-grid">
              {eventList.map(ev => (
                <Link key={ev.id} to={`/events/${ev.id}`}>
                  <div className="card event-card">
                    {ev.imageUrl ? (
                      <img src={`${BACKEND_URL}${ev.imageUrl}`} alt={ev.title} className="card-thumbnail" />
                    ) : (
                      <div className="card-no-image">No image</div>
                    )}
                    <div className="event-card-body">
                      <h3>{ev.title}</h3>
                      <p>{ev.description.substring(0, 80)}</p>
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
      </div>
    </>
  );
}
