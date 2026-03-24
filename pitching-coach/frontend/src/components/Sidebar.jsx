import { useState } from 'react';

const HAND_OPTIONS = ['R', 'L'];

export default function Sidebar({
  pitchers,
  selectedPitcherId,
  leaderboard,
  isOnlineMode,
  onSelectPitcher,
  onAddPitcher,
}) {
  const [newName, setNewName] = useState('');
  const [newHand, setNewHand] = useState('R');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddPitcher(trimmed, newHand);
    setNewName('');
    setNewHand('R');
    setIsAdding(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="panel" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 4 }}>⚾</div>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>PitchPro Coach</h1>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 6,
            background: '#0f172a',
            borderRadius: 20,
            padding: '3px 10px',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isOnlineMode ? '#22c55e' : '#f59e0b',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{isOnlineMode ? 'Online' : 'Offline Mode'}</span>
        </div>
      </div>

      {/* Roster */}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p className="section-title" style={{ margin: 0 }}>Pitcher Roster</p>
          <button
            className="btn btn-primary"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setIsAdding(v => !v)}
          >
            {isAdding ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {isAdding && (
          <div style={{ marginBottom: 10, padding: 10, background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Pitcher name"
              autoFocus
              style={{
                width: '100%',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 6,
                color: '#e2e8f0',
                fontSize: 13,
                padding: '6px 8px',
                outline: 'none',
                marginBottom: 8,
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              {HAND_OPTIONS.map(h => (
                <button
                  key={h}
                  className={`btn ${newHand === h ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: 12, padding: '4px 8px' }}
                  onClick={() => setNewHand(h)}
                >
                  {h === 'R' ? 'Right-Handed' : 'Left-Handed'}
                </button>
              ))}
            </div>
            <button
              className="btn btn-success"
              style={{ width: '100%', marginTop: 8, fontSize: 12 }}
              onClick={handleAdd}
              disabled={!newName.trim()}
            >
              Add Pitcher
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 220, overflowY: 'auto' }}>
          {pitchers.length === 0 ? (
            <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '12px 0' }}>
              No pitchers added yet
            </p>
          ) : (
            pitchers.map(pitcher => (
              <button
                key={pitcher.id}
                className="btn"
                style={{
                  justifyContent: 'flex-start',
                  background: selectedPitcherId === pitcher.id ? '#312e81' : '#0f172a',
                  border: `1px solid ${selectedPitcherId === pitcher.id ? '#6366f1' : '#334155'}`,
                  color: selectedPitcherId === pitcher.id ? '#e0e7ff' : '#cbd5e1',
                  fontSize: 13,
                  padding: '8px 10px',
                  borderRadius: 8,
                  gap: 8,
                }}
                onClick={() => onSelectPitcher(pitcher.id, pitcher.name)}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: selectedPitcherId === pitcher.id ? '#6366f1' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                    color: '#e2e8f0',
                  }}
                >
                  {pitcher.name.charAt(0).toUpperCase()}
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>{pitcher.name}</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>{pitcher.handedness || 'R'}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="panel">
        <p className="section-title">Leaderboard</p>
        {leaderboard.length === 0 ? (
          <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '8px 0' }}>
            Archive sessions to build leaderboard
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {leaderboard.slice(0, 3).map((entry, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div
                  key={entry.pitcherId || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#0f172a',
                    borderRadius: 8,
                    padding: '7px 10px',
                    border: '1px solid #334155',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{medals[i]}</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#e2e8f0' }}>{entry.pitcherName}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
                    {entry.bestScore}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
