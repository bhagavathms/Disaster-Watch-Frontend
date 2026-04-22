# DisasterWatch — Frontend

Real-time disaster monitoring dashboard built with **React + Vite**. Streams live events from MongoDB via SSE and pulls historical analytics from PostgreSQL — both served by the FastAPI backend.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Node.js 18+** | [nodejs.org](https://nodejs.org) — needed to run Vite |
| **Disaster Watch Backend** | Must be running at `http://127.0.0.1:8000` |
| **MongoDB** | Must be up (backend connects to it) |
| **PostgreSQL** | Must be up with `disaster_dw` populated |

---

## How to Run

### Step 1 — Start the backend

Follow the backend README. The short version:

```bash
# Start PostgreSQL (Windows)
rm -f "/c/Program Files/PostgreSQL/18/data/postmaster.pid"
"/c/Program Files/PostgreSQL/18/bin/pg_ctl.exe" start -D "/c/Program Files/PostgreSQL/18/data"

# Start MongoDB (Windows service usually already running on :27017)

# Run the full pipeline + API server
python run_pipeline.py
```

The API must be reachable at `http://127.0.0.1:8000` before opening the frontend.

### Step 2 — Install frontend dependencies (first time only)

```bash
cd "C:\Users\S Saday\OneDrive\Desktop\Disaster-Watch-Frontend"
npm install
```

### Step 3 — Start the dev server

```bash
npm run dev
```

Open **`http://localhost:3000`** in your browser. Hot-reload is enabled — edits to any `.jsx` or `.css` file apply instantly without a page refresh.

### Build for production (optional)

```bash
npm run build      # outputs to dist/
npm run preview    # serves the production build locally
```

---

## What You'll See

### Live Map tab
- Loads the last 500 events from MongoDB on page open (`GET /events/recent`)
- Connects to the SSE stream — new events appear as map markers in real time
- The **connection badge** (top-right of navbar) shows the stream state:
  - 🟡 **Connecting…** — establishing SSE connection
  - 🟢 **Live** — stream active, badge flashes on each new event
  - 🟠 **Reconnecting…** — SSE dropped, retries automatically every 5 s
  - 🔴 **API Offline** — backend unreachable
- Filter panel (top-right of map) — filter by type, severity, date range
- Click any marker to open the detail sidebar

### Simulation controls (bottom of filter panel)

| Control | What it does |
|---------|-------------|
| **▶ Start** | Calls `POST /stream/start` — backend begins drip-feeding events into MongoDB |
| **⏹ Stop** | Calls `POST /stream/stop` |
| **Delay (s)** | Seconds between each inserted event (default 0.5) |

> If the pipeline already ran and MongoDB has data, you don't need the simulation — the initial REST load will populate the map immediately.

### Analytics tab
Pulls aggregated data from PostgreSQL (auto-falls back to live event cache if API is down):
- **Event Count by Type** — total events per disaster type (bar chart)
- **Severity Distribution** — breakdown per type from live event cache (stacked bar)
- **Monthly Event Trend** — events per month, all 4 types (line chart)
- **Geographic Distribution** — events grouped by region (doughnut chart)
- **4 stat cards** — total events, most active region, highest severity event, most common type

---

## Project Structure

```
Disaster-Watch-Frontend/
├── index.html              Vite HTML entry point
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx            App bootstrap, Chart.js registration, CSS import
    ├── App.jsx             Top-level: view state + live events hook
    ├── config.js           Shared constants, color palettes, normalizers
    ├── hooks/
    │   ├── useLiveEvents.js   SSE connection + /events/recent fetch → events[]
    │   ├── useAnalytics.js    Parallel fetch of all /analytics/* endpoints
    │   └── useSimulation.js   start/stop/status calls to /stream/*
    ├── components/
    │   ├── Navbar.jsx         Top bar with connection badge
    │   ├── MapView.jsx        react-leaflet map + filtered CircleMarkers
    │   ├── FilterPanel.jsx    Type/severity/date filters + sim controls
    │   ├── EventSidebar.jsx   Slide-in event detail panel
    │   └── AnalyticsView.jsx  react-chartjs-2 charts + stat cards
    └── styles/
        └── main.css           Full dark theme (CSS variables, all components)
```

---

## API the Frontend Uses

All requests go to `http://127.0.0.1:8000`.

| Endpoint | Used by | Source DB |
|----------|---------|-----------|
| `GET /events/recent?limit=500` | Map initial load | MongoDB |
| `GET /stream/events` | SSE live stream | MongoDB |
| `POST /stream/start?delay=0.5` | Sim start button | — |
| `POST /stream/stop` | Sim stop button | — |
| `GET /stream/status` | Sim status on load | — |
| `GET /analytics/event-counts` | Chart 1, stat cards | PostgreSQL |
| `GET /analytics/monthly-trends?event_type=<t>` | Chart 3 (×4 parallel calls) | PostgreSQL |
| `GET /analytics/locations/top?limit=30` | Chart 4, stat cards | PostgreSQL |
