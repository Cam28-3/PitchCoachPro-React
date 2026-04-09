import {
  TARGET_ZONE_LAYOUT_5X5,
  TARGET_ZONE_LAYOUT_BASIC,
  STRIKE_ZONES_5X5,
  STRIKE_ZONES_BASIC,
  BASEBALL_DIAMETER_INCHES,
  STRIKE_ZONE_WIDTH_INCHES,
} from '../constants';

// Scoring thresholds based on real baseball dimensions:
//   Perfect = within 1 baseball diameter of target
//   Strike  = within 3 baseball diameters of target
const PERFECT_RADII = 1.0;
const STRIKE_RADII  = 3.0;

export function calculateExactScore(x, y, targetX, targetY, currentGridMode, containerWidth) {
  const strikeZoneCols = currentGridMode === 'precision' ? 3 : 2;
  const totalCols      = currentGridMode === 'precision' ? 5 : 4;
  const strikeZoneWidthPx = (strikeZoneCols / totalCols) * containerWidth;
  const baseballPx = (BASEBALL_DIAMETER_INCHES / STRIKE_ZONE_WIDTH_INCHES) * strikeZoneWidthPx;

  const dist = Math.sqrt((x - targetX) ** 2 + (y - targetY) ** 2);
  if (dist <= baseballPx * PERFECT_RADII) return 10;
  if (dist <= baseballPx * STRIKE_RADII)  return 5;
  return 0;
}

export function getLandedZoneId(x, y, currentGridMode, containerWidth, containerHeight) {
  const cols = currentGridMode === 'precision' ? 5 : 4;
  const rows = currentGridMode === 'precision' ? 5 : 4;
  const cellWidth = containerWidth / cols;
  const cellHeight = containerHeight / rows;

  const landedCol = Math.floor(x / cellWidth);
  const landedRow = Math.floor(y / cellHeight);

  const clampedCol = Math.max(0, Math.min(cols - 1, landedCol));
  const clampedRow = Math.max(0, Math.min(rows - 1, landedRow));

  const idx = clampedRow * cols + clampedCol;

  if (currentGridMode === 'precision') {
    return TARGET_ZONE_LAYOUT_5X5[idx] ?? null;
  } else {
    return TARGET_ZONE_LAYOUT_BASIC[idx]?.id ?? null;
  }
}

export function calculateScore(x, y, selectedTargetZoneIndex, currentGridMode, containerWidth, containerHeight) {
  if (selectedTargetZoneIndex === null || selectedTargetZoneIndex === undefined) return 0;

  const cols = currentGridMode === 'precision' ? 5 : 4;
  const rows = currentGridMode === 'precision' ? 5 : 4;
  const cellWidth = containerWidth / cols;
  const cellHeight = containerHeight / rows;

  const landedCol = Math.max(0, Math.min(cols - 1, Math.floor(x / cellWidth)));
  const landedRow = Math.max(0, Math.min(rows - 1, Math.floor(y / cellHeight)));

  const idx = landedRow * cols + landedCol;
  let landedZoneId;
  if (currentGridMode === 'precision') {
    landedZoneId = TARGET_ZONE_LAYOUT_5X5[idx];
  } else {
    landedZoneId = TARGET_ZONE_LAYOUT_BASIC[idx]?.id;
  }

  if (landedZoneId === selectedTargetZoneIndex) return 10;

  if (currentGridMode === 'precision') {
    // Find target zone position
    const targetIdx = TARGET_ZONE_LAYOUT_5X5.indexOf(selectedTargetZoneIndex);
    if (targetIdx === -1) return 0;
    const targetCol = targetIdx % cols;
    const targetRow = Math.floor(targetIdx / cols);

    const colDiff = Math.abs(landedCol - targetCol);
    const rowDiff = Math.abs(landedRow - targetRow);

    if (colDiff <= 1 && rowDiff <= 1) return 5;
    return 0;
  }

  return 0;
}

export function getZonePosition(zoneId, currentGridMode, containerWidth, containerHeight) {
  const cols = currentGridMode === 'precision' ? 5 : 4;
  const rows = currentGridMode === 'precision' ? 5 : 4;
  const cellWidth = containerWidth / cols;
  const cellHeight = containerHeight / rows;

  let col, row;
  if (currentGridMode === 'precision') {
    const idx = TARGET_ZONE_LAYOUT_5X5.indexOf(zoneId);
    if (idx === -1) return null;
    col = idx % cols;
    row = Math.floor(idx / cols);
  } else {
    const entry = TARGET_ZONE_LAYOUT_BASIC.find(z => z.id === zoneId);
    if (!entry) return null;
    col = entry.col - 1;
    row = entry.row - 1;
  }

  return {
    x: col * cellWidth + cellWidth / 2,
    y: row * cellHeight + cellHeight / 2,
    col,
    row,
    cellWidth,
    cellHeight,
  };
}

export function isStrikeZone(zoneId, currentGridMode) {
  if (currentGridMode === 'precision') return STRIKE_ZONES_5X5.includes(zoneId);
  return STRIKE_ZONES_BASIC.includes(zoneId);
}
