# PitchCoachPro

A web application for recording pitching sessions, tracking location accuracy, and generating coaching feedback. Coaches or players click a strike zone canvas to log where each pitch lands, set targets, and review per-pitch and session-level statistics.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Firebase Setup](#firebase-setup)
- [Replacing the Database (Project Handoff)](#replacing-the-database-project-handoff)
- [Launching the App](#launching-the-app)
- [Environment Variables](#environment-variables)
- [How Data Persistence Works](#how-data-persistence-works)
- [Offline Mode](#offline-mode)
- [Strike Zone Model](#strike-zone-model)
- [Scoring System](#scoring-system)
- [Miss Statistics](#miss-statistics)
- [Component Reference](#component-reference)
- [API Reference](#api-reference)
- [Key Constants](#key-constants)

---

## Features

- **Click-to-record pitches** on an interactive strike zone canvas
- **Two grid modes** — Precision (5×5, 25 zones) and Basic (4×4, 16 zones)
- **Zone targeting** — select a target zone from the grid before throwing
- **Exact target mode** — click any pixel on the canvas to place a precise crosshair target
- **Pitch type & speed tracking** — Fastball, Curveball, Slider, Changeup, Sinker; speed 40–105 mph
- **Per-pitch scoring** — Perfect (10 pts), Strike (5 pts), Ball (0 pts)
- **Miss statistics in inches** — average horizontal, vertical, and resultant miss with configurable strike zone height
- **Per-pitch log** — scrollable list with individual miss stats; click any row to highlight that pitch on the canvas and dim all others
- **Session summary** — score overview, accuracy %, pitch type breakdown, zone heatmap
- **Rule-based coaching feedback** — command, precision, miss tendency, pitch type comparison, velocity consistency
- **Session archiving & history** — save sessions, search by pitcher name, reload past sessions for review
- **Leaderboard** — top 3 best session scores per pitcher
- **PDF export** of the session summary panel
- **Coaching notes** — add freeform text notes during a session
- **Pitcher roster** — add pitchers with name and handedness (R/L)
- **Online/offline mode** — falls back to localStorage automatically if the backend is unreachable

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 3 |
| Backend | Node.js, Express 5 |
| Database | Firebase Firestore (via `firebase-admin`) |
| PDF export | `html2canvas` + `jsPDF` |
| Offline fallback | `localStorage` |

---

## Project Structure

```
PitchCoachPro React/
└── pitching-coach/
    ├── frontend/
    │   └── src/
    │       ├── App.jsx                  # Root component — all state lives here
    │       ├── constants.js             # Strike zone dimensions, zone layouts, pitch types
    │       ├── components/
    │       │   ├── StrikeZone.jsx       # Canvas + pitch dot overlay
    │       │   ├── TargetGrid.jsx       # Zone selection grid
    │       │   ├── PitchControls.jsx    # Grid mode, pitch type, speed, exact target
    │       │   ├── Sidebar.jsx          # Pitcher roster + leaderboard
    │       │   ├── SummaryPanel.jsx     # Session stats, miss stats, pitch log, heatmap
    │       │   ├── HistoryPanel.jsx     # Past session search and replay
    │       │   ├── CoachingNotes.jsx    # Freeform note input
    │       │   └── Modal.jsx            # Simple alert modal
    │       └── utils/
    │           ├── scoring.js           # Score calculation, zone lookup, px→position helpers
    │           ├── generateFeedback.js  # Rule-based coaching feedback engine
    │           ├── api.js               # REST API calls to the backend
    │           └── storage.js           # localStorage read/write helpers
    └── backend/
        └── src/
            ├── index.js                 # Express app setup
            ├── firebase.js              # Firestore initialization
            └── routes/
                ├── pitchers.js          # CRUD for pitchers and their pitches
                ├── sessions.js          # Archive and retrieve sessions
                └── leaderboard.js       # Top scores
```

---

## Requirements

To run the app you need:

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Two terminal windows** — one for the backend, one for the frontend
- **A Firebase project** (for data to persist across sessions) — or skip it to use offline/localStorage mode

---

## Firebase Setup

Firebase is the cloud database that stores pitchers, sessions, and leaderboard data. Without it the app still works, but all data is lost when you close the browser.

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** and follow the prompts

### 2. Enable Firestore

1. In your project, go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (allows all reads/writes for 30 days — fine for development)
4. Pick a region and click **Done**

### 3. Get service account credentials

1. Go to **Project Settings** (gear icon, top left) → **Service accounts** tab
2. Click **Generate new private key** → **Generate key**
3. A `.json` file downloads — open it, you will need three values from it

### 4. Create the backend `.env` file

Create the file at `pitching-coach/backend/.env` and fill in the values from the downloaded JSON:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
PORT=3001
```

> **Important:** The `FIREBASE_PRIVATE_KEY` must be wrapped in double quotes and keep the literal `\n` characters exactly as they appear in the downloaded JSON file.

> **Security:** Never commit `.env` to git. The `backend/.gitignore` already excludes it. Never share the private key — anyone with it has full write access to your database. If it is ever exposed, go back to Firebase → Service Accounts, delete the key, and generate a new one.

### 5. Verify the connection

When you start the backend (see below), you should see in the terminal:

```
[Firebase] Firestore connected
Backend running on http://localhost:3001
```

If you see `[Firebase] No valid config — running in offline/mock mode`, the `.env` file is missing or the values are wrong. Make sure you are running `npm run dev` from inside the `pitching-coach/backend/` directory.

---

## Replacing the Database (Project Handoff)

If you are taking over this project and want to use your own Firebase account instead of the original owner's, follow these steps. **You do not need to touch any code** — only the `.env` file changes.

### What is tied to the original owner's account

- The **Firebase project** (and all stored data — pitchers, sessions, leaderboard)
- The **service account credentials** in `pitching-coach/backend/.env`

Everything else (all source code, frontend, backend logic) is completely portable and belongs to whoever has the repo.

### Steps to switch to your own database

1. **Create a new Firebase project** — follow [Firebase Setup](#firebase-setup) steps 1–3 above to get your own project ID, client email, and private key.

2. **Replace the `.env` file** — open `pitching-coach/backend/.env` and swap in your own values:

   ```env
   FIREBASE_PROJECT_ID=your-new-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-new-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   PORT=3001
   ```

3. **Enable Firestore** in your new project (Build → Firestore Database → Create database → Start in test mode).

4. **Restart the backend** (`npm run dev` in `pitching-coach/backend/`). You should see `[Firebase] Firestore connected` — the app is now writing to your database.

### What happens to the old data

Old session and pitcher data stays in the original Firebase project. Your new database starts empty. If you need to migrate data, export it from the original Firestore console (Firebase → Firestore → **Export**) and import it into your new project — but for most handoffs, starting fresh is fine.

### If you do not want Firebase at all

Skip the `.env` file entirely. The app runs in **offline/localStorage mode** automatically — all features work, but data is browser-local only (see [Offline Mode](#offline-mode)).

---

## Launching the App

The app requires **two processes running at the same time** — the backend and the frontend. Open two terminal windows.

### Terminal 1 — Backend

```bash
cd pitching-coach/backend
npm run dev
```

Runs on `http://localhost:3001`. Keep this running — it is what talks to Firebase and persists all data.

### Terminal 2 — Frontend

```bash
cd pitching-coach/frontend
npm run dev
```

Runs on `http://localhost:5173`. Open this URL in your browser.

### First time setup (install dependencies)

If you have never run the project before, install dependencies first:

```bash
cd pitching-coach/frontend && npm install
cd ../backend && npm install
```

---

## Deployment

The frontend and backend deploy separately since they're two different runtimes (static site vs. Node server).

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com), pointing at this repo. A [render.yaml](render.yaml) is included at the repo root for one-click config, or set manually:
   - **Root directory**: `pitching-coach/backend`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
2. Set environment variables in the Render dashboard (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `ALLOWED_ORIGINS`) — see the table below. Omit the Firebase variables to run the deployed backend in mock mode (safe for a public demo — no real database needed).
3. Note the resulting URL (e.g. `https://pitchcoach-backend.onrender.com`) — the frontend needs it.

### Frontend → Vercel

1. Create a new project on [Vercel](https://vercel.com), pointing at this repo.
   - **Root directory**: `pitching-coach/frontend`
   - Framework preset: Vite (auto-detected)
2. Set the environment variable `VITE_API_URL` to the Render backend URL from above.
3. Once deployed, go back to Render and set `ALLOWED_ORIGINS` to the Vercel URL (e.g. `https://pitchcoachpro.vercel.app`) so the backend's CORS policy accepts requests from it, then redeploy the backend.

Note: `checkHealth()` in [api.js](pitching-coach/frontend/src/utils/api.js) makes the frontend fall back to offline/localStorage mode automatically if the backend is unreachable or unconfigured — so the app still works as a demo even without wiring up a live backend at all.

---

## Environment Variables

### Backend (`pitching-coach/backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Yes (for persistence) | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes (for persistence) | Service account email from the downloaded JSON |
| `FIREBASE_PRIVATE_KEY` | Yes (for persistence) | Private key from the downloaded JSON, wrapped in double quotes |
| `PORT` | No | Port for the backend (default: `3001`) |
| `ALLOWED_ORIGINS` | No | Comma-separated list of origins allowed to call the API (default: `http://localhost:5173`) |

If any Firebase variable is missing, the backend starts in mock mode — the app still works but **nothing is saved to the database**.

### Frontend (`pitching-coach/frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Base URL of the backend API. Leave blank for local dev (Vite proxies `/api` to `localhost:3001`). Set to the deployed backend's URL in production. |

---

## How Data Persistence Works

All data lives in **Firebase Firestore** (Google's cloud database). The backend is the only thing that talks to Firestore directly — the frontend only ever talks to the backend.

```
Browser (frontend)  →  Backend (Express)  →  Firestore (Firebase cloud)
```

Because data is stored in the cloud:
- Closing the browser does **not** delete data
- Stopping the frontend does **not** delete data
- Restarting your computer does **not** delete data
- Data is accessible from any machine that runs the backend with the same `.env`

The only requirement for data to persist is that the **backend is running** when the frontend makes a request. The frontend checks Firebase status on startup — if the backend is unreachable or Firebase is not configured, it automatically falls back to offline mode.

---

## Offline Mode

If the backend is not running or Firebase is not configured, the app automatically switches to offline mode:

- The status indicator in the header shows **"Offline Mode"** in amber
- All data is saved in the browser's `localStorage` instead of Firestore
- All features work identically
- Data persists across page refreshes but is **browser-local** — it won't be visible on another machine and will be lost if the browser storage is cleared

---

## Strike Zone Model

The canvas represents a catcher's-eye view of the strike zone.

### Precision mode (5×5 grid)

```
[ 21 ][ 22 ][ 23 ][ 24 ][ 25 ]   ← above zone
[ 16 ][  1 ][  2 ][  3 ][ 17 ]
[ 15 ][  4 ][  5 ][  6 ][ 18 ]   ← strike zone = zones 1–9
[ 14 ][  7 ][  8 ][  9 ][ 19 ]
[ 13 ][ 12 ][ 11 ][ 10 ][ 20 ]   ← below zone
 ↑ inside                outside ↑
```

Strike zones: `1–9`. Border zones: `10–25`.

### Basic mode (4×4 grid)

```
[ 13 ][ 11 ][ 12 ][ 14 ]   ← above zone
[  5 ][  1 ][  2 ][  7 ]
[  6 ][  3 ][  4 ][  8 ]   ← strike zone = zones 1–4
[ 15 ][  9 ][ 10 ][ 16 ]   ← below zone
```

Strike zones: `1–4`. Border zones: `5–16`.

### Real-world dimensions

| Constant | Value | Source |
|---|---|---|
| `STRIKE_ZONE_WIDTH_INCHES` | 17" | Width of home plate |
| `STRIKE_ZONE_HEIGHT_INCHES` | 24" | Default (configurable per session in Summary panel) |
| `BASEBALL_DIAMETER_INCHES` | 2.9" | Used to size pitch dots and score thresholds |
| `CANVAS_ASPECT_RATIO` | 1.4117 | ≈ 24/17 — keeps px/inch equal on both axes at default height |

---

## Scoring System

### Zone-based targeting

| Result | Points | Condition |
|---|---|---|
| Perfect | 10 | Pitch lands in the selected target zone |
| Strike | 5 | Pitch lands in an adjacent zone (precision mode only) |
| Ball | 0 | All other landings |

### Exact target mode

Uses Euclidean pixel distance from the crosshair target, converted to baseball diameters:

| Result | Points | Distance |
|---|---|---|
| Perfect | 10 | ≤ 1 baseball diameter |
| Strike | 5 | ≤ 3 baseball diameters |
| Ball | 0 | > 3 baseball diameters |

---

## Miss Statistics

Miss stats appear in the Session Summary when at least one pitch was recorded with an exact target. They show how far each pitch landed from its target in real-world inches.

### Conversion

Each pitch stores `containerWidth` (the canvas pixel width at recording time). This allows correct scaling even if the window is resized later.

```
pxPerInchH = (strikeZoneCols / totalCols × containerWidth) / 17
pxPerInchV = (strikeZoneRows / totalRows × containerWidth × CANVAS_ASPECT_RATIO) / strikeZoneHeight

missH (inches) = (pitch.x − target.x) / pxPerInchH   (+= right, −= left)
missV (inches) = (pitch.y − target.y) / pxPerInchV   (+= low,   −= high)
resultant      = √(missH² + missV²)
```

`strikeZoneHeight` defaults to **24"** and can be adjusted per session using the input in the top-right of the Session Summary panel (range: 10–36"). Changing it does not affect scoring — only the inch readouts.

### Per-pitch log

Every pitch appears in the log with its outcome and miss stats. Clicking a row:
- Highlights that pitch on the canvas with an amber ring
- Fades all other pitches to 15% opacity
- Shows the exact target crosshair (white) or target zone highlight (dashed white) for that pitch
- Clicking the same row again clears the selection

---

## Component Reference

### `App.jsx`
Root component. Owns all application state. Handles pitcher selection, pitch recording, session archiving, and undo/reset.

### `StrikeZone.jsx`
Canvas-based strike zone with a div overlay for pitch dots. Draws grid, zone numbers, strike zone border, target highlights, and the exact target crosshair. Accepts `highlightedPitchId` to dim non-selected pitches and show the focused pitch's target.

### `TargetGrid.jsx`
Renders the zone selection grid (5×5 or 4×4). Strike zones have a distinct background; the selected zone is highlighted amber.

### `PitchControls.jsx`
Controls for grid mode, pitch type, pitch speed (slider + number input, 40–105 mph), and exact target placement.

### `SummaryPanel.jsx`
Session summary including score overview, pitch type breakdown, average miss stats, per-pitch log, zone heatmap, coaching feedback (toggle), and PDF export.

### `Sidebar.jsx`
Pitcher roster management (add with name + handedness, select active pitcher) and leaderboard (top 3 session scores).

### `HistoryPanel.jsx`
Browse and search archived sessions. Click a session to load it in read-only mode on the canvas.

### `CoachingNotes.jsx`
Add freeform text notes during a session. Notes are saved with the session when archived.

### `Modal.jsx`
Simple full-screen alert overlay for error and confirmation messages.

---

## API Reference

All routes are prefixed `/api`. The frontend proxies them via Vite's `server.proxy` config.

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/pitchers` | List all pitchers |
| `POST` | `/api/pitchers` | Create a pitcher `{ name, handedness }` |
| `GET` | `/api/pitchers/:id/pitches` | Get all pitches for a pitcher |
| `POST` | `/api/pitchers/:id/pitches` | Add a pitch |
| `DELETE` | `/api/pitchers/:id/pitches/:pitchId` | Delete a single pitch |
| `DELETE` | `/api/pitchers/:id/pitches` | Clear all pitches for a pitcher |
| `GET` | `/api/sessions` | List sessions (optional `?pitcherName=` filter) |
| `POST` | `/api/sessions` | Archive a session |
| `GET` | `/api/leaderboard` | Get top session scores |
| `GET` | `/api/health` | Health check |

---

## Key Constants

All in `src/constants.js`:

```js
STRIKE_ZONE_WIDTH_INCHES   // 17  — real width of home plate
STRIKE_ZONE_HEIGHT_INCHES  // 24  — default strike zone height
BASEBALL_DIAMETER_INCHES   // 2.9 — used for dot sizing and exact-target scoring
CANVAS_ASPECT_RATIO        // 1.4117 ≈ 24/17

TARGET_ZONE_LAYOUT_5X5     // 25-element array mapping grid index → zone ID
TARGET_ZONE_LAYOUT_BASIC   // 16-element array mapping grid index → { id, row, col }
STRIKE_ZONES_5X5           // [1..9] — which zone IDs count as strikes in precision mode
STRIKE_ZONES_BASIC         // [1..4] — which zone IDs count as strikes in basic mode

PITCH_TYPES                // ['fastball', 'curveball', 'slider', 'changeup', 'sinker']
PITCH_TYPE_COLORS          // map of pitch type → hex color used across all charts/dots
```
