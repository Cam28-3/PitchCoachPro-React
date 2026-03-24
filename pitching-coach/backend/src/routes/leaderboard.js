const { Router } = require('express');
const { getDb, getIsConfigured } = require('../firebase');

const router = Router();

const getBasePath = () => {
  const appId = process.env.APP_ID || 'default-app-id';
  return `artifacts/${appId}/coaches/main-coach`;
};

// GET /api/leaderboard
router.get('/', async (req, res) => {
  if (!getIsConfigured()) return res.json([]);
  try {
    const snap = await getDb().collection(`${getBasePath()}/sessions`).get();
    const sessions = snap.docs.map(d => d.data());

    const byPitcher = {};
    for (const s of sessions) {
      const pid = s.pitcherId;
      if (!pid) continue;
      if (!byPitcher[pid] || (s.totalScore ?? 0) > byPitcher[pid].bestScore) {
        byPitcher[pid] = { pitcherId: pid, pitcherName: s.pitcherName, bestScore: s.totalScore ?? 0 };
      }
    }

    const leaderboard = Object.values(byPitcher)
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 3);

    res.json(leaderboard);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
