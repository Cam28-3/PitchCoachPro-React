import { useRef, useState } from 'react';
import {
  TARGET_ZONE_LAYOUT_5X5,
  TARGET_ZONE_LAYOUT_BASIC,
  STRIKE_ZONES_5X5,
  STRIKE_ZONES_BASIC,
  PITCH_TYPE_COLORS,
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

export default function SummaryPanel({ pitches, currentGridMode, selectedPitcherName }) {
  const panelRef = useRef(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const totalPitches = pitches.length;
  const totalScore = pitches.reduce((s, p) => s + (p.score || 0), 0);
  const avgScore = totalPitches > 0 ? (totalScore / totalPitches).toFixed(1) : '0.0';
  const maxScore = totalPitches * 10;
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const perfectCount = pitches.filter(p => p.score === 10).length;
  const strikeCount = pitches.filter(p => p.score === 5).length;
  const ballCount = pitches.filter(p => p.score === 0).length;

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
        <p className="section-title">Session Summary</p>

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
