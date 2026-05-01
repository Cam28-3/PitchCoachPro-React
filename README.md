# PitchCoachPro

A web application for recording pitching sessions, tracking location accuracy, and generating coaching feedback. Coaches or players click a strike zone canvas to log where each pitch lands, set targets, and review per-pitch and session-level statistics.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
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

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled (or run without one in offline mode)

### 1. Install dependencies

```bash
# Frontend
cd pitching-coach/frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure environment (optional — skip to use offline mode)

```bash
cd pitching-coach/backend
cp .env.example .env   # or create .env manually
```

See [Environment Variables](#environment-variables) below.

### 3. Start the backend

```bash
cd pitching-coach/backend
npm run dev        # node --watch (auto-restarts on file changes)
# or
npm start          # production
```

Backend runs on `http://localhost:3001`.

### 4. Start the frontend

```bash
cd pitching-coach/frontend
npm run dev
```

Frontend runs on `http://localhost:5173`. Vite proxies all `/api/*` requests to the backend.

---

## Environment Variables

Create `pitching-coach/backend/.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
PORT=3001
```

Obtain `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` from a Firebase service account JSON file (Firebase Console → Project Settings → Service Accounts → Generate new private key).

If any of the Firebase variables are missing or set to placeholder values, the backend starts in **offline/mock mode** — all routes return empty data and the frontend automatically falls back to localStorage.

---

## Offline Mode

The frontend detects backend failure on startup and switches to offline mode automatically. In offline mode:

- All data (pitchers, pitches, sessions, leaderboard) is persisted in `localStorage` keyed by a per-app ID
- The status indicator in the top-left shows "Offline Mode" in amber
- All features work identically — no backend required

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
