import { useState } from 'react';

export default function CoachingNotes({ notes, onAddNote }) {
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAddNote(trimmed);
    setDraft('');
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAdd();
    }
  };

  return (
    <div className="panel">
      <p className="section-title">Coaching Notes</p>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a coaching note... (Ctrl+Enter to save)"
        rows={3}
        style={{
          width: '100%',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 8,
          color: '#e2e8f0',
          fontSize: 13,
          padding: '8px 10px',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'Inter, sans-serif',
          marginBottom: 8,
        }}
      />
      <button
        className="btn btn-secondary"
        style={{ width: '100%', marginBottom: notes.length > 0 ? 10 : 0 }}
        onClick={handleAdd}
        disabled={!draft.trim()}
      >
        + Add Note
      </button>

      {notes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
          {notes.map((note, i) => (
            <div
              key={i}
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                color: '#cbd5e1',
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: '#475569', marginRight: 6 }}>{i + 1}.</span>
              {note}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
