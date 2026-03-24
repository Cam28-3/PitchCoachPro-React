const { Router } = require('express');
const { getDb, getIsConfigured } = require('../firebase');

const router = Router();

const getBasePath = () => {
  const appId = process.env.APP_ID || 'default-app-id';
  return `artifacts/${appId}/coaches/main-coach`;
};

// GET /api/sessions?pitcherName=...
router.get('/', async (req, res) => {
  if (!getIsConfigured()) return res.json([]);
  try {
    let query = getDb().collection(`${getBasePath()}/sessions`).orderBy('savedAt', 'desc');
    const snap = await query.get();
    let sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (req.query.pitcherName) {
      const lower = req.query.pitcherName.toLowerCase();
      sessions = sessions.filter(s => (s.pitcherName || '').toLowerCase().includes(lower));
    }
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/sessions
router.post('/', async (req, res) => {
  const session = req.body;
  if (!getIsConfigured()) {
    return res.json({ id: `session_${Date.now()}`, ...session, savedAt: Date.now() });
  }
  try {
    const ref = await getDb().collection(`${getBasePath()}/sessions`).add({
      ...session,
      savedAt: new Date().toISOString(),
    });
    res.json({ id: ref.id, ...session });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
