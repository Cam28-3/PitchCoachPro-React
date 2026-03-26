const { Router } = require('express');
const { getDb, getIsConfigured } = require('../firebase');

const router = Router();

const getBasePath = () => {
  const appId = process.env.APP_ID || 'default-app-id';
  return `artifacts/${appId}/coaches/main-coach`;
};

// GET /api/pitchers
router.get('/', async (req, res) => {
  if (!getIsConfigured()) return res.json([]);
  try {
    const snap = await getDb().collection(`${getBasePath()}/pitchers`).get();
    const pitchers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(pitchers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/pitchers
router.post('/', async (req, res) => {
  const { name, handedness } = req.body;
  if (!name || !handedness) return res.status(400).json({ error: 'name and handedness required' });

  if (!getIsConfigured()) {
    return res.json({ id: `local_${Date.now()}`, name, handedness });
  }
  try {
    const ref = await getDb().collection(`${getBasePath()}/pitchers`).add({
      name,
      handedness,
      createdAt: new Date().toISOString(),
    });
    res.json({ id: ref.id, name, handedness });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/pitchers/:id/pitches
router.get('/:id/pitches', async (req, res) => {
  if (!getIsConfigured()) return res.json([]);
  try {
    const snap = await getDb()
      .collection(`${getBasePath()}/pitchers/${req.params.id}/pitches`)
      .orderBy('timestamp', 'asc')
      .get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/pitchers/:id/pitches
router.post('/:id/pitches', async (req, res) => {
  const pitch = req.body;
  if (!getIsConfigured()) return res.json({ id: `local_${Date.now()}`, ...pitch });
  try {
    const ref = await getDb()
      .collection(`${getBasePath()}/pitchers/${req.params.id}/pitches`)
      .add({ ...pitch, timestamp: new Date().toISOString() });
    res.json({ id: ref.id, ...pitch });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/pitchers/:id/pitches/:pitchId
router.delete('/:id/pitches/:pitchId', async (req, res) => {
  if (!getIsConfigured()) return res.json({ deleted: 1 });
  try {
    await getDb()
      .collection(`${getBasePath()}/pitchers/${req.params.id}/pitches`)
      .doc(req.params.pitchId)
      .delete();
    res.json({ deleted: 1 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/pitchers/:id/pitches
router.delete('/:id/pitches', async (req, res) => {
  if (!getIsConfigured()) return res.json({ deleted: 0 });
  try {
    const snap = await getDb()
      .collection(`${getBasePath()}/pitchers/${req.params.id}/pitches`)
      .get();
    const batch = getDb().batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    res.json({ deleted: snap.size });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
