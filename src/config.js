// Backend returns Access-Control-Allow-Origin: * so direct requests work fine.
export const API_BASE = 'http://127.0.0.1:8000';

// ── Map ────────────────────────────────────────────────────────────────────────
export const MAP_INITIAL_ZOOM  = 2;
export const MAP_MIN_ZOOM      = 2;
export const MAP_MAX_ZOOM      = 18;
export const MAP_TILE_MAX_ZOOM = 19;
export const MAP_BOUNDS_PAD    = 0.35;   // fraction of viewport to prefetch beyond edges
export const FETCH_DEBOUNCE_MS = 300;
export const CLUSTER_MAX_RADIUS = 70;    // px — leaflet.markercluster maxClusterRadius
export const BUBBLE_SIZE_MIN   = 40;     // px
export const BUBBLE_SIZE_MAX   = 90;     // px
export const ZOOM_CONTINENT_MAX = 4;
export const ZOOM_COUNTRY_MAX   = 8;

// ── Query / pagination ─────────────────────────────────────────────────────────
export const QUERY_PAGE_SIZE        = 50;
export const ANALYTICS_SAMPLE_LIMIT = 2000;
export const LOCATION_PROXIMITY_KM  = 500;

// ── SSE / live feed ────────────────────────────────────────────────────────────
export const SSE_MAX_RECENT   = 500;    // rolling buffer size in useLiveEvents
export const SSE_FLUSH_MS     = 500;    // batch-flush interval
export const SSE_RETRY_MS     = 5000;  // reconnect delay on error

// ── Severity ───────────────────────────────────────────────────────────────────
// Maps DB-stored uppercase values → frontend lowercase labels
export const DB_TO_SEV = { LOW: 'low', MEDIUM: 'moderate', HIGH: 'high', CRITICAL: 'extreme' };
// Maps frontend labels → DB-stored uppercase values (for sending filter params)
export const SEV_TO_DB = { low: 'LOW', moderate: 'MEDIUM', high: 'HIGH', extreme: 'CRITICAL' };
// Severity bar widths in EventSidebar
export const SEV_PCT   = { low: 25, moderate: 50, high: 75, extreme: 100 };

// ── Charts ─────────────────────────────────────────────────────────────────────
export const CHART_COLOR_PALETTE = [
  '#3b82f6','#06b6d4','#f97316','#22c55e','#eab308','#a855f7','#ec4899','#14b8a6',
];

export const TYPE_COLORS = {
  earthquake: '#f97316',
  fire:       '#ef4444',
  flood:      '#3b82f6',
  storm:      '#a855f7',
};

export const TYPE_COLORS_ALPHA = {
  earthquake: 'rgba(249,115,22,0.75)',
  fire:       'rgba(239,68,68,0.75)',
  flood:      'rgba(59,130,246,0.75)',
  storm:      'rgba(168,85,247,0.75)',
};

export const SEV_COLORS = {
  low:      '#22c55e',
  moderate: '#eab308',
  high:     '#f97316',
  extreme:  '#ef4444',
};

export const SEV_COLORS_ALPHA = {
  low:      'rgba(34,197,94,0.75)',
  moderate: 'rgba(234,179,8,0.75)',
  high:     'rgba(249,115,22,0.75)',
  extreme:  'rgba(239,68,68,0.75)',
};

export const SEV_RADIUS = { low: 4, moderate: 5, high: 7, extreme: 9 };

export const TYPES      = ['earthquake', 'fire', 'flood', 'storm'];
export const SEV_LEVELS = ['low', 'moderate', 'high', 'extreme'];
export const SEV_ORDER  = { low: 0, moderate: 1, high: 2, extreme: 3 };

export const REGIONS = [
  { name: 'Asia-Pacific', latMin: -50, latMax:  50, lonMin:  100, lonMax:  180 },
  { name: 'South Asia',   latMin:   5, latMax:  40, lonMin:   60, lonMax:  100 },
  { name: 'Americas',     latMin: -60, latMax:  75, lonMin: -180, lonMax:  -30 },
  { name: 'Europe',       latMin:  35, latMax:  72, lonMin:  -30, lonMax:   45 },
  { name: 'Middle East',  latMin:  12, latMax:  42, lonMin:   35, lonMax:   65 },
  { name: 'Africa',       latMin: -40, latMax:  38, lonMin:  -20, lonMax:   55 },
];

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function normalizeSeverity(level) {
  return DB_TO_SEV[(level || '').toUpperCase()] || 'low';
}
// Short alias used in components
export const normSev = normalizeSeverity;

export function normalizeEvent(ev) {
  return {
    ...ev,
    event_type:     (ev.event_type || '').toLowerCase(),
    severity_level: normalizeSeverity(ev.severity_level),
    latitude:       parseFloat(ev.latitude),
    longitude:      parseFloat(ev.longitude),
    timestamp:      ev.event_time || ev.processed_at || ev.timestamp,
  };
}

export function getRegion(lat, lon) {
  for (const r of REGIONS) {
    if (lat >= r.latMin && lat <= r.latMax && lon >= r.lonMin && lon <= r.lonMax) return r.name;
  }
  return 'Other';
}

export const capitalize = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

export function formatTimestamp(iso) {
  try { return new Date(iso).toUTCString().replace(' GMT', ' UTC'); }
  catch { return iso || '—'; }
}
