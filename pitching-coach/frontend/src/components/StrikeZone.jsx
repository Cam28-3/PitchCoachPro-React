import { useRef, useEffect, useState, useCallback } from 'react';
import {
  CANVAS_ASPECT_RATIO,
  TARGET_ZONE_LAYOUT_5X5,
  TARGET_ZONE_LAYOUT_BASIC,
  STRIKE_ZONES_5X5,
  STRIKE_ZONES_BASIC,
  BASEBALL_DIAMETER_INCHES,
  STRIKE_ZONE_WIDTH_INCHES,
} from '../constants';

function drawCrosshair(ctx, x, y, color = '#f59e0b') {
  const size = 14;
  const gap  = 4;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x - gap, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + gap,  y); ctx.lineTo(x + size, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x, y - gap); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + gap);  ctx.lineTo(x, y + size); ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, gap, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCanvas(canvas, currentGridMode, isViewingPastSession, selectedTargetZoneIndex, exactTarget, isSettingTarget) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  const cols = currentGridMode === 'precision' ? 5 : 4;
  const rows = currentGridMode === 'precision' ? 5 : 4;
  const cellW = W / cols;
  const cellH = H / rows;

  // Draw grid lines
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  for (let c = 1; c < cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cellW, 0);
    ctx.lineTo(c * cellW, H);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * cellH);
    ctx.lineTo(W, r * cellH);
    ctx.stroke();
  }

  // Draw strike zone rectangle
  const strikeColor = isViewingPastSession ? '#ef4444' : '#6366f1';
  ctx.strokeStyle = strikeColor;
  ctx.lineWidth = 4;
  if (currentGridMode === 'precision') {
    ctx.strokeRect(cellW, cellH, cellW * 3, cellH * 3);
  } else {
    ctx.strokeRect(cellW, cellH, cellW * 2, cellH * 2);
  }

  // Draw zone numbers
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(10, Math.min(14, cellW * 0.3))}px Inter, sans-serif`;

  const layout = currentGridMode === 'precision' ? TARGET_ZONE_LAYOUT_5X5 : TARGET_ZONE_LAYOUT_BASIC;
  const strikeZones = currentGridMode === 'precision' ? STRIKE_ZONES_5X5 : STRIKE_ZONES_BASIC;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      let zoneId;
      if (currentGridMode === 'precision') {
        zoneId = layout[idx];
      } else {
        zoneId = layout[idx]?.id;
      }

      const isStrike = strikeZones.includes(zoneId);
      const cx = c * cellW + cellW / 2;
      const cy = r * cellH + cellH / 2;

      ctx.fillStyle = isStrike ? 'rgba(99,102,241,0.12)' : 'rgba(51,65,85,0.18)';
      ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);

      ctx.fillStyle = isStrike ? '#818cf8' : '#475569';
      ctx.fillText(String(zoneId), cx, cy);
    }
  }

  // Highlight selected zone target (only when no exact target is active)
  if (!exactTarget && selectedTargetZoneIndex !== null && selectedTargetZoneIndex !== undefined) {
    let selCol = -1, selRow = -1;
    if (currentGridMode === 'precision') {
      const idx = TARGET_ZONE_LAYOUT_5X5.indexOf(selectedTargetZoneIndex);
      if (idx !== -1) { selCol = idx % cols; selRow = Math.floor(idx / cols); }
    } else {
      const entry = TARGET_ZONE_LAYOUT_BASIC.find(z => z.id === selectedTargetZoneIndex);
      if (entry) { selCol = entry.col - 1; selRow = entry.row - 1; }
    }
    if (selCol !== -1) {
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.strokeRect(selCol * cellW + 2, selRow * cellH + 2, cellW - 4, cellH - 4);
      ctx.fillStyle = 'rgba(217,119,6,0.15)';
      ctx.fillRect(selCol * cellW + 2, selRow * cellH + 2, cellW - 4, cellH - 4);
    }
  }

  // Draw exact target crosshair
  if (exactTarget) {
    // Pulse ring
    ctx.beginPath();
    ctx.arc(exactTarget.x, exactTarget.y, 20, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(245,158,11,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawCrosshair(ctx, exactTarget.x, exactTarget.y, '#f59e0b');
  }

  // "Click to place target" overlay when in setting mode
  if (isSettingTarget) {
    ctx.fillStyle = 'rgba(245,158,11,0.07)';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(2, 2, W - 4, H - 4);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(15,23,42,0.75)';
    const labelW = 220, labelH = 28, labelX = W / 2 - labelW / 2, labelY = 10;
    ctx.beginPath();
    ctx.roundRect(labelX, labelY, labelW, labelH, 6);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Click to place exact target', W / 2, labelY + labelH / 2);
  }

  // Draw center dot
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
}

export default function StrikeZone({
  pitches,
  currentGridMode,
  isViewingPastSession,
  selectedTargetZoneIndex,
  exactTarget,
  isSettingTarget,
  onPitchClick,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredPitch, setHoveredPitch] = useState(null);

  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = w * CANVAS_ASPECT_RATIO;
    setDimensions({ width: w, height: h });
    if (canvasRef.current) {
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      drawCanvas(canvasRef.current, currentGridMode, isViewingPastSession, selectedTargetZoneIndex, exactTarget, isSettingTarget);
    }
  }, [currentGridMode, isViewingPastSession, selectedTargetZoneIndex, exactTarget, isSettingTarget]);

  useEffect(() => {
    updateSize();
    const obs = new ResizeObserver(updateSize);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [updateSize]);

  useEffect(() => {
    if (canvasRef.current && dimensions.width > 0) {
      canvasRef.current.width = dimensions.width;
      canvasRef.current.height = dimensions.height;
      drawCanvas(canvasRef.current, currentGridMode, isViewingPastSession, selectedTargetZoneIndex, exactTarget, isSettingTarget);
    }
  }, [dimensions, currentGridMode, isViewingPastSession, selectedTargetZoneIndex, exactTarget, isSettingTarget]);

  const handleClick = useCallback(
    e => {
      if (isViewingPastSession) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onPitchClick(x, y, dimensions.width, dimensions.height);
    },
    [isViewingPastSession, onPitchClick, dimensions]
  );

  const getDotSize = useCallback(
    pitch => {
      if (dimensions.width === 0) return 12;
      const cols = currentGridMode === 'precision' ? 5 : 4;
      const cellWidth = dimensions.width / cols;
      const strikeZoneWidthPx = currentGridMode === 'precision' ? cellWidth * 3 : cellWidth * 2;
      const baseDotSize = (BASEBALL_DIAMETER_INCHES / STRIKE_ZONE_WIDTH_INCHES) * strikeZoneWidthPx;
      const speed = pitch.speed || 80;
      const clampedSpeed = Math.max(60, Math.min(100, speed));
      const scale = 0.85 + ((clampedSpeed - 60) / 40) * 0.4;
      return baseDotSize * scale;
    },
    [dimensions, currentGridMode]
  );

  const scoreClass = score => {
    if (score === 10) return 'perfect';
    if (score === 5) return 'strike';
    return 'ball';
  };

  const cursor = isSettingTarget ? 'crosshair' : isViewingPastSession ? 'default' : 'pointer';

  return (
    <div
      ref={containerRef}
      className="strike-zone-container"
      style={{ height: dimensions.height || 'auto', cursor }}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="strike-zone-canvas" />

      {/* Pitch dots overlay */}
      {dimensions.width > 0 &&
        pitches.map((pitch, i) => {
          const dotSize = getDotSize(pitch);
          const isLast = i === pitches.length - 1;
          const pctX = (pitch.x / dimensions.width) * 100;
          const pctY = (pitch.y / dimensions.height) * 100;

          return (
            <div
              key={pitch.id || i}
              className={`pitch-dot ${pitch.type} ${scoreClass(pitch.score)}${isLast ? ' new-pitch-animation' : ''}`}
              style={{
                left: `${pctX}%`,
                top: `${pctY}%`,
                width: dotSize,
                height: dotSize,
              }}
              onMouseEnter={() => setHoveredPitch(i)}
              onMouseLeave={() => setHoveredPitch(null)}
            >
              {hoveredPitch === i && (
                <div className="pitch-tooltip">
                  {pitch.type} • {pitch.speed} mph • {pitch.score}pts
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
