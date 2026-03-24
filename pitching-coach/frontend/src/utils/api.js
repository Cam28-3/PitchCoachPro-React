const BASE = '/api';

export async function fetchPitchers() {
  const res = await fetch(`${BASE}/pitchers`);
  if (!res.ok) throw new Error('Failed to fetch pitchers');
  return res.json();
}

export async function createPitcher(name, handedness) {
  const res = await fetch(`${BASE}/pitchers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, handedness }),
  });
  if (!res.ok) throw new Error('Failed to create pitcher');
  return res.json();
}

export async function fetchPitches(pitcherId) {
  const res = await fetch(`${BASE}/pitchers/${pitcherId}/pitches`);
  if (!res.ok) throw new Error('Failed to fetch pitches');
  return res.json();
}

export async function addPitch(pitcherId, pitch) {
  const res = await fetch(`${BASE}/pitchers/${pitcherId}/pitches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pitch),
  });
  if (!res.ok) throw new Error('Failed to add pitch');
  return res.json();
}

export async function clearPitches(pitcherId) {
  const res = await fetch(`${BASE}/pitchers/${pitcherId}/pitches`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear pitches');
}

export async function fetchSessions(pitcherName) {
  const url = pitcherName
    ? `${BASE}/sessions?pitcherName=${encodeURIComponent(pitcherName)}`
    : `${BASE}/sessions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function saveSession(sessionData) {
  const res = await fetch(`${BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData),
  });
  if (!res.ok) throw new Error('Failed to save session');
  return res.json();
}

export async function fetchLeaderboard() {
  const res = await fetch(`${BASE}/leaderboard`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}
