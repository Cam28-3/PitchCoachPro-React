require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initFirebase } = require('./firebase');

const pitchersRouter = require('./routes/pitchers');
const sessionsRouter = require('./routes/sessions');
const leaderboardRouter = require('./routes/leaderboard');

initFirebase();

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/pitchers', pitchersRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
