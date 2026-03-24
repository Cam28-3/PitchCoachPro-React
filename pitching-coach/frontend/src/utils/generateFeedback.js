import { STRIKE_ZONES_5X5, STRIKE_ZONES_BASIC } from '../constants';

// Zone position helpers for 5x5 grid
// Layout:
//   Row 0: 21 22 23 24 25  (high/above zone)
//   Row 1: 16  1  2  3 17
//   Row 2: 15  4  5  6 18
//   Row 3: 14  7  8  9 19
//   Row 4: 13 12 11 10 20  (low/below zone)
//   Col 0: inside (21,16,15,14,13)
//   Col 4: outside (25,17,18,19,20)

const HIGH_ZONES_5X5   = [21, 22, 23, 24, 25];
const LOW_ZONES_5X5    = [13, 12, 11, 10, 20];
const INSIDE_ZONES_5X5 = [21, 16, 15, 14, 13];
const OUTSIDE_ZONES_5X5 = [25, 17, 18, 19, 20];

// Basic grid: strike zones = 1,2,3,4; high = 11,12,13,14; low = 9,10,15,16; inside = 5,6; outside = 7,8
const HIGH_ZONES_BASIC   = [11, 12, 13, 14];
const LOW_ZONES_BASIC    = [9, 10, 15, 16];
const INSIDE_ZONES_BASIC = [5, 6];
const OUTSIDE_ZONES_BASIC = [7, 8];

function getStrikeZones(gridMode) {
  return gridMode === 'precision' ? STRIKE_ZONES_5X5 : STRIKE_ZONES_BASIC;
}

function getMissDirection(zones, gridMode) {
  const high   = gridMode === 'precision' ? HIGH_ZONES_5X5   : HIGH_ZONES_BASIC;
  const low    = gridMode === 'precision' ? LOW_ZONES_5X5    : LOW_ZONES_BASIC;
  const inside = gridMode === 'precision' ? INSIDE_ZONES_5X5 : INSIDE_ZONES_BASIC;
  const outside = gridMode === 'precision' ? OUTSIDE_ZONES_5X5 : OUTSIDE_ZONES_BASIC;

  const counts = { high: 0, low: 0, inside: 0, outside: 0 };
  for (const z of zones) {
    if (high.includes(z))    counts.high++;
    if (low.includes(z))     counts.low++;
    if (inside.includes(z))  counts.inside++;
    if (outside.includes(z)) counts.outside++;
  }
  return counts;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates rule-based coaching feedback from session pitch data.
 * Returns an array of { category, message, type } objects.
 * type: 'positive' | 'warning' | 'tip'
 */
export function generateFeedback(pitches, gridMode = 'precision') {
  if (!pitches || pitches.length < 3) {
    return [{ category: 'Info', message: 'Throw at least 3 pitches to generate feedback.', type: 'tip' }];
  }

  const feedback = [];
  const strikeZones = getStrikeZones(gridMode);
  const total = pitches.length;

  const perfectCount = pitches.filter(p => p.score === 10).length;
  const strikeCount  = pitches.filter(p => p.score === 5).length;
  const ballCount    = pitches.filter(p => p.score === 0).length;
  const inZoneCount  = pitches.filter(p => strikeZones.includes(p.landedZoneId)).length;

  const strikeRate  = inZoneCount / total;
  const perfectRate = perfectCount / total;
  const avgScore    = pitches.reduce((s, p) => s + (p.score || 0), 0) / total;

  // --- Overall command ---
  if (strikeRate >= 0.75) {
    feedback.push({ category: 'Command', message: `Excellent zone command — ${Math.round(strikeRate * 100)}% of pitches hit the strike zone.`, type: 'positive' });
  } else if (strikeRate >= 0.55) {
    feedback.push({ category: 'Command', message: `Decent command with ${Math.round(strikeRate * 100)}% strike rate. Aim for 70%+.`, type: 'tip' });
  } else {
    feedback.push({ category: 'Command', message: `Only ${Math.round(strikeRate * 100)}% of pitches landed in the strike zone. Focus on consistent release point.`, type: 'warning' });
  }

  // --- Precision ---
  if (perfectRate >= 0.4) {
    feedback.push({ category: 'Precision', message: `${Math.round(perfectRate * 100)}% perfect location — great target hitting.`, type: 'positive' });
  } else if (perfectRate >= 0.2) {
    feedback.push({ category: 'Precision', message: `${perfectCount} perfect pitches (${Math.round(perfectRate * 100)}%). Work on repeating your delivery to hit targets more consistently.`, type: 'tip' });
  } else if (total >= 5) {
    feedback.push({ category: 'Precision', message: `Only ${perfectCount} perfect pitches this session. Try slowing down and focusing on one target zone at a time.`, type: 'warning' });
  }

  // --- Miss tendency ---
  const ballPitches = pitches.filter(p => p.score === 0 && p.landedZoneId != null);
  if (ballPitches.length >= 3) {
    const missZones = ballPitches.map(p => p.landedZoneId);
    const missCounts = getMissDirection(missZones, gridMode);
    const topMiss = Object.entries(missCounts).sort((a, b) => b[1] - a[1])[0];

    if (topMiss[1] >= 2) {
      const directionTips = {
        high: 'Missing high suggests the arm is releasing too early — focus on driving down through the pitch.',
        low:  'Missing low often means releasing too late or dropping the elbow — stay tall through release.',
        inside: 'Consistent misses inside may indicate the body is opening up too early — stay closed longer.',
        outside: 'Consistent misses outside suggest the arm is dragging — drive the front hip and stay on top.',
      };
      feedback.push({
        category: 'Miss Tendency',
        message: `Tends to miss ${topMiss[0]} (${topMiss[1]} of ${ballPitches.length} balls). ${directionTips[topMiss[0]]}`,
        type: 'warning',
      });
    }
  }

  // --- Pitch type breakdown ---
  const byType = {};
  for (const p of pitches) {
    if (!byType[p.type]) byType[p.type] = { total: 0, strikes: 0, perfect: 0 };
    byType[p.type].total++;
    if (strikeZones.includes(p.landedZoneId)) byType[p.type].strikes++;
    if (p.score === 10) byType[p.type].perfect++;
  }

  const typeEntries = Object.entries(byType).filter(([, v]) => v.total >= 3);
  if (typeEntries.length > 1) {
    const best  = typeEntries.sort((a, b) => (b[1].strikes / b[1].total) - (a[1].strikes / a[1].total))[0];
    const worst = typeEntries.sort((a, b) => (a[1].strikes / a[1].total) - (b[1].strikes / b[1].total))[0];

    if (best[0] !== worst[0]) {
      feedback.push({
        category: 'Pitch Type',
        message: `Best command: ${capitalize(best[0])} (${Math.round((best[1].strikes / best[1].total) * 100)}% strikes). Most work needed: ${capitalize(worst[0])} (${Math.round((worst[1].strikes / worst[1].total) * 100)}% strikes).`,
        type: 'tip',
      });
    }
  }

  // --- Speed consistency ---
  const speeds = pitches.map(p => p.speed).filter(Boolean);
  if (speeds.length >= 5) {
    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / speeds.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev <= 2) {
      feedback.push({ category: 'Velocity', message: `Consistent velocity — avg ${Math.round(avg)} mph with only ${stdDev.toFixed(1)} mph variation.`, type: 'positive' });
    } else if (stdDev > 5) {
      feedback.push({ category: 'Velocity', message: `Velocity varies by ±${stdDev.toFixed(1)} mph (avg ${Math.round(avg)} mph). Inconsistent effort level can hurt command.`, type: 'warning' });
    }
  }

  // --- Volume tip ---
  if (total < 10) {
    feedback.push({ category: 'Session', message: `Short session (${total} pitches). More reps will give more accurate feedback.`, type: 'tip' });
  } else if (total >= 30) {
    feedback.push({ category: 'Session', message: `High volume session (${total} pitches). Monitor fatigue — command often drops in the final third of long sessions.`, type: 'tip' });
  }

  return feedback;
}
