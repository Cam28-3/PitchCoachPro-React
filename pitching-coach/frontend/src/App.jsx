import { useState, useEffect, useCallback } from 'react';
import * as api from './utils/api';
import { getLocalData, setLocalData } from './utils/storage';
import { calculateScore, calculateExactScore, getLandedZoneId } from './utils/scoring';

import Modal from './components/Modal';
import Sidebar from './components/Sidebar';
import StrikeZone from './components/StrikeZone';
import TargetGrid from './components/TargetGrid';
import PitchControls from './components/PitchControls';
import CoachingNotes from './components/CoachingNotes';
import SummaryPanel from './components/SummaryPanel';
import HistoryPanel from './components/HistoryPanel';

const APP_ID = 'default-app-id';

export default function App() {
  const [isOnlineMode, setIsOnlineMode] = useState(true);

  const [pitches, setPitches] = useState([]);
  const [pitchers, setPitchers] = useState([]);
  const [currentSessionNotes, setCurrentSessionNotes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const [selectedPitcherId, setSelectedPitcherId] = useState(null);
  const [selectedPitcherName, setSelectedPitcherName] = useState(null);
  const [isViewingPastSession, setIsViewingPastSession] = useState(false);

  const [selectedTargetZoneIndex, setSelectedTargetZoneIndex] = useState(null);
  const [exactTarget, setExactTarget] = useState(null);
  const [isSettingTarget, setIsSettingTarget] = useState(false);
  const [currentGridMode, setCurrentGridMode] = useState('precision');
  const [pitchType, setPitchType] = useState('fastball');
  const [pitchSpeed, setPitchSpeed] = useState(85);

  const [modal, setModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load pitchers on mount
  useEffect(() => {
    api.fetchPitchers()
      .then(data => { setPitchers(data); setIsOnlineMode(true); })
      .catch(() => {
        setIsOnlineMode(false);
        setPitchers(getLocalData(APP_ID, 'pitchers') || []);
      });

    api.fetchLeaderboard()
      .then(setLeaderboard)
      .catch(() => setLeaderboard(getLocalData(APP_ID, 'leaderboard') || []));
  }, []);

  // Load pitches when pitcher changes
  useEffect(() => {
    if (!selectedPitcherId || isViewingPastSession) return;
    if (!isOnlineMode) {
      setPitches(getLocalData(APP_ID, `pitches_${selectedPitcherId}`) || []);
      return;
    }
    api.fetchPitches(selectedPitcherId)
      .then(setPitches)
      .catch(() => setPitches(getLocalData(APP_ID, `pitches_${selectedPitcherId}`) || []));
  }, [selectedPitcherId, isViewingPastSession, isOnlineMode]);

  const addPitcher = useCallback(async (name, handedness) => {
    if (!isOnlineMode) {
      const stored = getLocalData(APP_ID, 'pitchers') || [];
      const newPitcher = { id: `local_${Date.now()}`, name, handedness };
      const updated = [...stored, newPitcher];
      setLocalData(APP_ID, 'pitchers', updated);
      setPitchers(updated);
      return;
    }
    try {
      const newPitcher = await api.createPitcher(name, handedness);
      setPitchers(prev => [...prev, newPitcher]);
    } catch (e) {
      setModal('Error adding pitcher: ' + e.message);
    }
  }, [isOnlineMode]);

  const selectPitcher = useCallback((id, name) => {
    setIsViewingPastSession(false);
    setSelectedPitcherId(id);
    setSelectedPitcherName(name);
    setCurrentSessionNotes([]);
    setPitches([]);
  }, []);

  const handlePitchClick = useCallback(async (x, y, containerWidth, containerHeight) => {
    // Target-setting mode: place the crosshair, don't record a pitch
    if (isSettingTarget) {
      setExactTarget({ x, y });
      setIsSettingTarget(false);
      setSelectedTargetZoneIndex(null);
      return;
    }

    if (!selectedPitcherId) { setModal('Please select a pitcher first.'); return; }

    const score = exactTarget
      ? calculateExactScore(x, y, exactTarget.x, exactTarget.y, currentGridMode, containerWidth)
      : calculateScore(x, y, selectedTargetZoneIndex, currentGridMode, containerWidth, containerHeight);
    const landedZoneId = getLandedZoneId(x, y, currentGridMode, containerWidth, containerHeight);

    const newPitch = {
      id: `pitch_${Date.now()}`,
      x, y,
      type: pitchType,
      speed: pitchSpeed,
      score,
      landedZoneId,
      targetZoneId: exactTarget ? null : selectedTargetZoneIndex,
      exactTarget: exactTarget || null,
      gridMode: currentGridMode,
      timestamp: Date.now(),
    };

    const updatedPitches = [...pitches, newPitch];
    setPitches(updatedPitches);

    if (!isOnlineMode) {
      setLocalData(APP_ID, `pitches_${selectedPitcherId}`, updatedPitches);
      return;
    }
    try {
      await api.addPitch(selectedPitcherId, newPitch);
    } catch (e) {
      console.error('Error saving pitch', e);
    }
  }, [isSettingTarget, exactTarget, selectedPitcherId, selectedTargetZoneIndex, currentGridMode, pitchType, pitchSpeed, pitches, isOnlineMode]);

  const saveSession = useCallback(async () => {
    if (!selectedPitcherId) { setModal('Please select a pitcher first.'); return; }
    if (pitches.length === 0) { setModal('No pitches to archive.'); return; }

    setIsSaving(true);
    const totalScore = pitches.reduce((s, p) => s + (p.score || 0), 0);
    const sessionData = {
      pitcherId: selectedPitcherId,
      pitcherName: selectedPitcherName,
      pitches: pitches.map(({ id: _id, ...p }) => p),
      notes: currentSessionNotes,
      totalScore,
      pitchCount: pitches.length,
      gridMode: currentGridMode,
    };

    try {
      if (!isOnlineMode) {
        const stored = getLocalData(APP_ID, 'sessions') || [];
        const withId = { ...sessionData, id: `session_${Date.now()}`, savedAt: Date.now() };
        const updated = [withId, ...stored];
        setLocalData(APP_ID, 'sessions', updated);
        setSessions(updated);
        const lb = getLocalData(APP_ID, 'leaderboard') || [];
        const existing = lb.find(e => e.pitcherId === selectedPitcherId);
        if (!existing || totalScore > existing.bestScore) {
          const updatedLb = lb
            .filter(e => e.pitcherId !== selectedPitcherId)
            .concat({ pitcherId: selectedPitcherId, pitcherName: selectedPitcherName, bestScore: totalScore })
            .sort((a, b) => b.bestScore - a.bestScore)
            .slice(0, 3);
          setLocalData(APP_ID, 'leaderboard', updatedLb);
          setLeaderboard(updatedLb);
        }
      } else {
        await api.saveSession(sessionData);
        const [newSessions, newLb] = await Promise.all([api.fetchSessions(), api.fetchLeaderboard()]);
        setSessions(newSessions);
        setLeaderboard(newLb);
      }
      setModal(`Session archived! Total score: ${totalScore} pts across ${pitches.length} pitches.`);
    } catch (e) {
      setModal('Error saving session: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  }, [selectedPitcherId, selectedPitcherName, pitches, currentSessionNotes, currentGridMode, isOnlineMode]);

  const undoLastPitch = useCallback(async () => {
    if (pitches.length === 0) return;
    const last = pitches[pitches.length - 1];
    const updated = pitches.slice(0, -1);
    setPitches(updated);
    if (!isOnlineMode && selectedPitcherId) {
      setLocalData(APP_ID, `pitches_${selectedPitcherId}`, updated);
    } else if (selectedPitcherId) {
      api.deletePitch(selectedPitcherId, last.id).catch(console.error);
    }
  }, [pitches, isOnlineMode, selectedPitcherId]);

  const clearPitches = useCallback(() => {
    setPitches([]);
    setCurrentSessionNotes([]);
    if (!isOnlineMode && selectedPitcherId) {
      setLocalData(APP_ID, `pitches_${selectedPitcherId}`, []);
    } else if (selectedPitcherId) {
      api.clearPitches(selectedPitcherId).catch(console.error);
    }
  }, [isOnlineMode, selectedPitcherId]);

  const loadSession = useCallback(session => {
    setPitches(session.pitches || []);
    setCurrentSessionNotes(session.notes || []);
    setSelectedPitcherName(session.pitcherName);
    setSelectedPitcherId(session.pitcherId);
    setIsViewingPastSession(true);
    if (session.gridMode) setCurrentGridMode(session.gridMode);
  }, []);

  const exitPastSession = useCallback(() => {
    setIsViewingPastSession(false);
    setPitches([]);
    setCurrentSessionNotes([]);
    if (selectedPitcherId) {
      if (!isOnlineMode) setPitches(getLocalData(APP_ID, `pitches_${selectedPitcherId}`) || []);
      else api.fetchPitches(selectedPitcherId).then(setPitches).catch(console.error);
    }
  }, [isOnlineMode, selectedPitcherId]);

  const searchSessions = useCallback(async (query) => {
    if (!isOnlineMode) {
      const stored = getLocalData(APP_ID, 'sessions') || [];
      if (!query) return stored;
      const lower = query.toLowerCase();
      return stored.filter(s => (s.pitcherName || '').toLowerCase().includes(lower));
    }
    try {
      return await api.fetchSessions(query);
    } catch (e) {
      return sessions.filter(s => (s.pitcherName || '').toLowerCase().includes((query || '').toLowerCase()));
    }
  }, [isOnlineMode, sessions]);

  const addNote = useCallback(text => {
    setCurrentSessionNotes(prev => [...prev, text]);
  }, []);

  const totalScore = pitches.reduce((s, p) => s + (p.score || 0), 0);
  const perfectCount = pitches.filter(p => p.score === 10).length;
  const strikeCount = pitches.filter(p => p.score === 5).length;
  const ballCount = pitches.filter(p => p.score === 0).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '16px' }}>
      <Modal message={modal} onClose={() => setModal(null)} />

      <div style={{ display: 'flex', flexDirection: 'row', gap: 16, maxWidth: 1400, margin: '0 auto', alignItems: 'flex-start' }}>
        {/* Left Sidebar */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <Sidebar
            pitchers={pitchers}
            selectedPitcherId={selectedPitcherId}
            leaderboard={leaderboard}
            isOnlineMode={isOnlineMode}
            onSelectPitcher={selectPitcher}
            onAddPitcher={addPitcher}
          />
        </div>

        {/* Center */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isViewingPastSession && (
            <div style={{ background: '#7c1d1d', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#fca5a5', textAlign: 'center' }}>
              Viewing past session for <strong>{selectedPitcherName}</strong>. Canvas is read-only.
            </div>
          )}

          <div className="panel" style={{ padding: 12 }}>
            <StrikeZone
              pitches={pitches}
              currentGridMode={currentGridMode}
              isViewingPastSession={isViewingPastSession}
              selectedTargetZoneIndex={selectedTargetZoneIndex}
              exactTarget={exactTarget}
              isSettingTarget={isSettingTarget}
              onPitchClick={handlePitchClick}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Score', value: totalScore, color: '#6366f1' },
              { label: 'Perfect', value: perfectCount, color: '#fbbf24' },
              { label: 'Strikes', value: strikeCount, color: '#facc15' },
              { label: 'Balls', value: ballCount, color: '#60a5fa' },
            ].map(({ label, value, color }) => (
              <div key={label} className="panel" style={{ textAlign: 'center', padding: '10px 8px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {!isViewingPastSession && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-success" style={{ flex: 2 }} onClick={saveSession} disabled={isSaving || pitches.length === 0}>
                {isSaving ? 'Saving...' : 'Archive Session'}
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={undoLastPitch} disabled={pitches.length === 0}>
                Undo
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={clearPitches} disabled={pitches.length === 0}>
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isViewingPastSession && (
            <div className="panel" style={{ opacity: exactTarget ? 0.4 : 1, pointerEvents: exactTarget ? 'none' : 'auto' }}>
              <TargetGrid
                currentGridMode={currentGridMode}
                selectedTargetZoneIndex={selectedTargetZoneIndex}
                onSelectZone={setSelectedTargetZoneIndex}
              />
            </div>
          )}
          <PitchControls
            currentGridMode={currentGridMode}
            onGridModeChange={mode => { setCurrentGridMode(mode); setSelectedTargetZoneIndex(null); }}
            pitchType={pitchType}
            onPitchTypeChange={setPitchType}
            pitchSpeed={pitchSpeed}
            onPitchSpeedChange={setPitchSpeed}
            exactTarget={exactTarget}
            isSettingTarget={isSettingTarget}
            onSetTargetMode={() => setIsSettingTarget(prev => !prev)}
            onClearExactTarget={() => { setExactTarget(null); setIsSettingTarget(false); }}
          />
          <CoachingNotes notes={currentSessionNotes} onAddNote={addNote} />
          <SummaryPanel pitches={pitches} currentGridMode={currentGridMode} selectedPitcherName={selectedPitcherName} />
          <HistoryPanel sessions={sessions} onLoadSession={loadSession} onSearchSessions={searchSessions} isViewingPastSession={isViewingPastSession} onExitPastSession={exitPastSession} />
        </div>
      </div>
    </div>
  );
}
