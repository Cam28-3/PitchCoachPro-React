import { useRef, useState } from 'react';
import {
  TARGET_ZONE_LAYOUT_5X5,
  TARGET_ZONE_LAYOUT_BASIC,
  STRIKE_ZONES_5X5,
  STRIKE_ZONES_BASIC,
  PITCH_TYPE_COLORS,
  STRIKE_ZONE_WIDTH_INCHES,
  CANVAS_ASPECT_RATIO,
} from '../constants';
import { generateFeedback } from '../utils/generateFeedback';

function getHeatmapColor(count, maxCount) {
  if (count === 0) return '#1e293b';
  const ratio = count / maxCount;
  if (ratio < 0.25) return '#1e3a5f';
  if (ratio < 0.5) return '#1d4ed8';
  if (ratio < 0.75) return '#2563eb';
  return '#1e40af';
}

const FEEDBACK_COLORS = {
  positive: { bg: '#052e16', border: '#16a34a', text: '#86efac', label: '#22c55e' },
  warning:  { bg: '#2d1515', border: '#dc2626', text: '#fca5a5', label: '#ef4444' },
  tip:      { bg: '#172554', border: '#3b82f6', text: '#bfdbfe', label: '#60a5fa' },
};

export default function SummaryPanel({ pitches, currentGridMode, selectedPitcherName, onHighlightPitch, highlightedPitchId }) {
  const panelRef = useRef(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [strikeZoneHeight, setStrikeZoneHeight] = useState(24);

  const totalPitches = pitches.length;
  const totalScore = pitches.reduce((s, p) => s + (p.score || 0), 0);
  const avgScore = totalPitches > 0 ? (totalScore / totalPitches).toFixed(1) : '0.0';
  const maxScore = totalPitches * 10;
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const perfectCount = pitches.filter(p => p.score === 10).length;
  const strikeCount = pitches.filter(p => p.score === 5).length;
  const ballCount = pitches.filter(p => p.score === 0).length;

  // Average miss in inches — only for pitches with an exact target and recorded container width
  const exactPitches = pitches.filter(p => p.exactTarget && p.containerWidth > 0);

  function getMissInches(p) {
    const strikeZoneCols = p.gridMode === 'precision' ? 3 : 2;
    const totalCols = p.gridMode === 'precision' ? 5 : 4;
    const strikeZoneWidthPx = (strikeZoneCols / totalCols) * p.containerWidth;
    const pxPerInchH = strikeZoneWidthPx / STRIKE_ZONE_WIDTH_INCHES;
    const strikeZoneHeightPx = (strikeZoneCols / totalCols) * p.containerWidth * CANVAS_ASPECT_RATIO;
    const pxPerInchV = strikeZoneHeightPx / strikeZoneHeight;
    const dx = (p.x - p.exactTarget.x) / pxPerInchH;
    const dy = (p.y - p.exactTarget.y) / pxPerInchV;
    return { dx, dy, resultant: Math.sqrt(dx ** 2 + dy ** 2) };
  }

  let missStats = null;
  if (exactPitches.length > 0) {
    const misses = exactPitches.map(getMissInches);
    const avgH = misses.reduce((s, m) => s + m.dx, 0) / misses.length;
    const avgV = misses.reduce((s, m) => s + m.dy, 0) / misses.length;
    missStats = {
      horizontal: avgH,
      vertical: avgV,
      resultant: Math.sqrt(avgH ** 2 + avgV ** 2),
      count: exactPitches.length,
    };
  }

  const SCORE_LABEL = { 10: 'Perfect', 5: 'Strike', 0: 'Ball' };
  const SCORE_COLOR = { 10: '#fbbf24', 5: '#facc15', 0: '#60a5fa' };

  // Pitch type breakdown
  const byType = {};
  for (const p of pitches) {
    byType[p.type] = (byType[p.type] || 0) + 1;
  }

  // Heatmap - count pitches per zone
  const cols = currentGridMode === 'precision' ? 5 : 4;
  const rows = currentGridMode === 'precision' ? 5 : 4;
  const layout = currentGridMode === 'precision' ? TARGET_ZONE_LAYOUT_5X5 : TARGET_ZONE_LAYOUT_BASIC;
  const strikeZones = currentGridMode === 'precision' ? STRIKE_ZONES_5X5 : STRIKE_ZONES_BASIC;

  const zoneCount = {};
  for (const p of pitches) {
    if (p.landedZoneId != null) {
      zoneCount[p.landedZoneId] = (zoneCount[p.landedZoneId] || 0) + 1;
    }
  }
  const maxCount = Math.max(1, ...Object.values(zoneCount));

  const handleExportPDF = async () => {
    if (!panelRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(panelRef.current, { backgroundColor: '#1e293b', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`pitchpro-summary-${selectedPitcherName || 'session'}.pdf`);
    } catch (e) {
      console.error('PDF export error', e);
      alert('PDF export failed: ' + e.message);
    }
  };

  return (
    <div className="panel" id="summaryPanel">
      <div ref={panelRef}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p className="section-title" style={{ margin: 0 }}>Session Summary</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
            SZ Height
            <input
              type="number"
              min={10}
              max={36}
              value={strikeZoneHeight}
              onChange={e => setStrikeZoneHeight(Math.max(10, Math.min(36, Number(e.target.value))))}
              style={{
                width: 42,
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 4,
                color: '#e2e8f0',
                fontSize: 11,
                padding: '2px 4px',
                textAlign: 'center',
              }}
            />
            <span style={{ color: '#475569' }}>"</span>
          </label>
        </div>

        {selectedPitcherName && (
          <p style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, marginBottom: 10 }}>
            {selectedPitcherName}
          </p>
        )}

        {/* Score overview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {[
            { label: 'Total Score', value: totalScore, color: '#6366f1' },
            { label: 'Accuracy', value: `${pct}%`, color: pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444' },
            { label: 'Avg / Pitch', value: avgScore, color: '#94a3b8' },
            { label: 'Total Pitches', value: totalPitches, color: '#94a3b8' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '8px 10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Outcome breakdown */}
        {totalPitches > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[
              { label: 'Perfect', count: perfectCount, color: '#fbbf24' },
              { label: 'Strike', count: strikeCount, color: '#facc15' },
              { label: 'Ball', count: ballCount, color: '#60a5fa' },
            ].map(({ label, count, color }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  background: '#0f172a',
                  border: `1px solid ${color}44`,
                  borderRadius: 6,
                  padding: '6px 4px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color }}>{count}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Pitch type breakdown */}
        {Object.keys(byType).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              By Pitch Type
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(byType).map(([type, count]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: PITCH_TYPE_COLORS[type] || '#94a3b8',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ fontSize: 12, color: '#cbd5e1', flex: 1 }}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{count}</div>
                  <div
                    style={{
                      flex: 2,
                      height: 4,
                      background: '#1e293b',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(count / totalPitches) * 100}%`,
                        background: PITCH_TYPE_COLORS[type] || '#94a3b8',
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Average Miss Stats */}
        {missStats && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Avg Miss ({missStats.count} pitch{missStats.count !== 1 ? 'es' : ''} w/ exact target)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                {
                  label: 'Horizontal',
                  value: Math.abs(missStats.horizontal).toFixed(1) + '"',
                  sub: missStats.horizontal > 0.05 ? 'Right' : missStats.horizontal < -0.05 ? 'Left' : 'On target',
                  color: '#60a5fa',
                },
                {
                  label: 'Vertical',
                  value: Math.abs(missStats.vertical).toFixed(1) + '"',
                  sub: missStats.vertical > 0.05 ? 'Low' : missStats.vertical < -0.05 ? 'High' : 'On target',
                  color: '#a78bfa',
                },
                {
                  label: 'Resultant',
                  value: missStats.resultant.toFixed(1) + '"',
                  sub: 'Total',
                  color: '#34d399',
                },
              ].map(({ label, value, sub, color }) => (
                <div
                  key={label}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    padding: '8px 6px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{sub}</div>
                  <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-pitch log */}
        {totalPitches > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Pitch Log
            </p>
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {pitches.map((p, i) => {
                const miss = p.exactTarget && p.containerWidth > 0 ? getMissInches(p) : null;
                const scoreColor = SCORE_COLOR[p.score] ?? '#94a3b8';
                const scoreLabel = SCORE_LABEL[p.score] ?? '—';
                return (
                  <div
                    key={p.id || i}
                    onClick={() => onHighlightPitch?.(highlightedPitchId === (p.id ?? i) ? null : (p.id ?? i))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: highlightedPitchId === (p.id ?? i) ? '#1c2a1a' : '#0f172a',
                      border: highlightedPitchId === (p.id ?? i) ? '1px solid #f59e0b' : '1px solid #1e293b',
                      borderRadius: 6,
                      padding: '5px 8px',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {/* Pitch number */}
                    <span style={{ color: '#475569', width: 18, flexShrink: 0, textAlign: 'right' }}>
                      {i + 1}
                    </span>
                    {/* Type dot */}
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: PITCH_TYPE_COLORS[p.type] || '#94a3b8', flexShrink: 0 }} />
                    {/* Type + speed */}
                    <span style={{ color: '#cbd5e1', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : '—'} {p.speed ? `${p.speed} mph` : ''}
                    </span>
                    {/* Outcome */}
                    <span style={{ color: scoreColor, fontWeight: 700, flexShrink: 0, width: 44, textAlign: 'right' }}>
                      {scoreLabel}
                    </span>
                    {/* Miss stats */}
                    {miss ? (
                      <span style={{ color: '#64748b', flexShrink: 0, fontSize: 10, textAlign: 'right', minWidth: 110 }}>
                        <span style={{ color: '#60a5fa' }}>{Math.abs(miss.dx).toFixed(1)}"</span>
                        <span style={{ color: '#475569' }}>{miss.dx > 0.05 ? 'R' : miss.dx < -0.05 ? 'L' : '·'} </span>
                        <span style={{ color: '#a78bfa' }}>{Math.abs(miss.dy).toFixed(1)}"</span>
                        <span style={{ color: '#475569' }}>{miss.dy > 0.05 ? 'Lo' : miss.dy < -0.05 ? 'Hi' : '·'} </span>
                        <span style={{ color: '#34d399' }}>{miss.resultant.toFixed(1)}"</span>
                      </span>
                    ) : (
                      <span style={{ color: '#334155', flexShrink: 0, fontSize: 10, minWidth: 110, textAlign: 'right' }}>no exact target</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Heatmap */}
        {totalPitches > 0 && (
          <div>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Zone Heatmap
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 3,
              }}
            >
              {Array.from({ length: rows * cols }, (_, i) => {
                let zoneId;
                if (currentGridMode === 'precision') {
                  zoneId = layout[i];
                } else {
                  zoneId = layout[i]?.id;
                }
                const count = zoneCount[zoneId] || 0;
                const isStrike = strikeZones.includes(zoneId);
                const bg = count > 0 ? getHeatmapColor(count, maxCount) : isStrike ? '#1a2535' : '#111827';
                return (
                  <div
                    key={i}
                    className="heatmap-cell"
                    style={{
                      background: bg,
                      border: isStrike ? '1px solid #1d4ed820' : '1px solid #1e29360',
                      fontSize: 9,
                      color: count > 0 ? '#e2e8f0' : '#334155',
                    }}
                  >
                    {count > 0 ? count : zoneId}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {totalPitches >= 3 && (
        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: 12 }}
            onClick={() => setShowFeedback(v => !v)}
          >
            {showFeedback ? 'Hide Coaching Feedback' : 'Get Coaching Feedback'}
          </button>

          {showFeedback && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {generateFeedback(pitches, currentGridMode).map((item, i) => {
                const colors = FEEDBACK_COLORS[item.type];
                return (
                  <div
                    key={i}
                    style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      padding: '7px 10px',
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: colors.label, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                      {item.category}
                    </div>
                    <div style={{ fontSize: 12, color: colors.text, lineHeight: 1.4 }}>
                      {item.message}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {totalPitches > 0 && (
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 8, fontSize: 12 }}
          onClick={handleExportPDF}
        >
          Export PDF
        </button>
      )}
    </div>
  );
}
