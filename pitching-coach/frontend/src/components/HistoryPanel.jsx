import { useState } from 'react';

export default function HistoryPanel({
  sessions,
  onLoadSession,
  onSearchSessions,
  isViewingPastSession,
  onExitPastSession,
}) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const handleSearch = async () => {
    const results = await onSearchSessions(query.trim());
    setSearchResults(results);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') handleSearch();
  };

  const displayList = searchResults !== null ? searchResults : sessions;

  return (
    <div className="panel">
      <p className="section-title">Session History</p>

      {isViewingPastSession && (
        <button
          className="btn btn-danger"
          style={{ width: '100%', marginBottom: 10, fontSize: 12 }}
          onClick={onExitPastSession}
        >
          Exit Past Session View
        </button>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by pitcher name..."
          style={{
            flex: 1,
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#e2e8f0',
            fontSize: 12,
            padding: '6px 10px',
            outline: 'none',
          }}
        />
        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 10px' }} onClick={handleSearch}>
          Search
        </button>
        {searchResults !== null && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '6px 10px' }}
            onClick={() => { setSearchResults(null); setQuery(''); }}
          >
            Clear
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
        {displayList.length === 0 ? (
          <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '16px 0' }}>
            {searchResults !== null ? 'No sessions found.' : 'No sessions archived yet.'}
          </p>
        ) : (
          displayList.map(session => (
            <div
              key={session.id}
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '8px 10px',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}
              onClick={() => onLoadSession(session)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                  {session.pitcherName || 'Unknown Pitcher'}
                </span>
                <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 700 }}>
                  {session.totalScore ?? 0} pts
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                {session.pitchCount ?? 0} pitches •{' '}
                {session.savedAt
                  ? new Date(
                      session.savedAt.seconds ? session.savedAt.seconds * 1000 : session.savedAt
                    ).toLocaleDateString()
                  : 'Unknown date'}
              </div>
              {session.notes && session.notes.length > 0 && (
                <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
                  {session.notes.length} note{session.notes.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
