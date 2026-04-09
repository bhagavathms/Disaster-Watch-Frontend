/* ═══════════════════════════════════════════════════════════
   app.js — Navigation routing, view switching, shared config
═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────
// SHARED CONSTANTS  (used by map.js & analytics.js)
// ─────────────────────────────────────────────

window.APP = {

  // Colors per disaster type
  TYPE_COLORS: {
    earthquake: '#f97316',
    fire:       '#ef4444',
    flood:      '#3b82f6',
    storm:      '#a855f7'
  },

  // Semi-transparent fill versions for Chart.js datasets
  TYPE_COLORS_ALPHA: {
    earthquake: 'rgba(249,115,22,0.75)',
    fire:       'rgba(239,68,68,0.75)',
    flood:      'rgba(59,130,246,0.75)',
    storm:      'rgba(168,85,247,0.75)'
  },

  // Colors per severity level
  SEV_COLORS: {
    low:      '#22c55e',
    moderate: '#eab308',
    high:     '#f97316',
    extreme:  '#ef4444'
  },

  SEV_COLORS_ALPHA: {
    low:      'rgba(34,197,94,0.75)',
    moderate: 'rgba(234,179,8,0.75)',
    high:     'rgba(249,115,22,0.75)',
    extreme:  'rgba(239,68,68,0.75)'
  },

  // Marker radius in px per severity level
  SEV_RADIUS: {
    low:      5,
    moderate: 7,
    high:     10,
    extreme:  14
  },

  // Ordered lists
  TYPES:      ['earthquake', 'fire', 'flood', 'storm'],
  SEV_LEVELS: ['low', 'moderate', 'high', 'extreme'],

  // Geographic regions  [label, latMin, latMax, lonMin, lonMax]
  REGIONS: [
    { name: 'Asia-Pacific',  latMin:  -50, latMax:  50, lonMin:  100, lonMax:  180 },
    { name: 'South Asia',    latMin:    5, latMax:  40, lonMin:   60, lonMax:  100 },
    { name: 'Americas',      latMin:  -60, latMax:  75, lonMin: -180, lonMax:  -30 },
    { name: 'Europe',        latMin:   35, latMax:  72, lonMin:  -30, lonMax:   45 },
    { name: 'Middle East',   latMin:   12, latMax:  42, lonMin:   35, lonMax:   65 },
    { name: 'Africa',        latMin:  -40, latMax:  38, lonMin:  -20, lonMax:   55 }
  ],

  // Severity ordering for filter comparisons
  SEV_ORDER: { low: 0, moderate: 1, high: 2, extreme: 3 },

  // Chart.js global defaults (applied once on boot)
  _chartDefaultsApplied: false
};

// ─────────────────────────────────────────────
// CHART.JS GLOBAL DEFAULTS
// ─────────────────────────────────────────────
function applyChartDefaults() {
  if (window.APP._chartDefaultsApplied) return;
  window.APP._chartDefaultsApplied = true;

  Chart.defaults.color = '#8ba3c0';
  Chart.defaults.borderColor = '#2a3f58';
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.color = '#8ba3c0';
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(22,32,50,0.97)';
  Chart.defaults.plugins.tooltip.titleColor = '#e8f0fe';
  Chart.defaults.plugins.tooltip.bodyColor = '#8ba3c0';
  Chart.defaults.plugins.tooltip.borderColor = '#2a3f58';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.scale.grid.color = 'rgba(42,63,88,0.6)';
  Chart.defaults.scale.ticks.color = '#546a84';
}

// ─────────────────────────────────────────────
// LAZY-INIT FLAGS
// ─────────────────────────────────────────────
let _mapInitialized       = false;
let _analyticsInitialized = false;
let _currentView          = 'map';

// ─────────────────────────────────────────────
// VIEW SWITCHER
// ─────────────────────────────────────────────
function switchView(view) {
  if (view === _currentView) return;
  _currentView = view;

  const mapView       = document.getElementById('map-view');
  const analyticsView = document.getElementById('analytics-view');
  const navMap        = document.getElementById('nav-map');
  const navAnalytics  = document.getElementById('nav-analytics');

  if (view === 'map') {
    // Show map, hide analytics
    analyticsView.classList.add('hidden');
    mapView.classList.remove('hidden');

    navMap.classList.add('active');
    navAnalytics.classList.remove('active');

    // Lazy-init or re-size Leaflet
    if (!_mapInitialized) {
      _mapInitialized = true;
      initMap();
    } else {
      // Leaflet must be told the container is visible again
      if (window._leafletMap) {
        window._leafletMap.invalidateSize();
      }
    }

  } else if (view === 'analytics') {
    // Show analytics, hide map
    mapView.classList.add('hidden');
    analyticsView.classList.remove('hidden');

    navAnalytics.classList.add('active');
    navMap.classList.remove('active');

    // Lazy-init charts
    if (!_analyticsInitialized) {
      _analyticsInitialized = true;
      try { applyChartDefaults(); } catch (e) { console.warn('Chart defaults skipped:', e); }
      initAnalytics();
    }
  }
}

// ─────────────────────────────────────────────
// UTILITY HELPERS  (shared across modules)
// ─────────────────────────────────────────────

/**
 * Determine which geographic region a lat/lon belongs to.
 * Returns the region name string, or 'Other' if none match.
 */
window.getRegion = function(lat, lon) {
  for (const r of window.APP.REGIONS) {
    if (lat >= r.latMin && lat <= r.latMax &&
        lon >= r.lonMin && lon <= r.lonMax) {
      return r.name;
    }
  }
  return 'Other';
};

/**
 * Capitalise the first letter of a string.
 */
window.capitalize = function(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format an ISO timestamp to a readable local string.
 */
window.formatTimestamp = function(iso) {
  try {
    return new Date(iso).toUTCString().replace(' GMT', ' UTC');
  } catch {
    return iso;
  }
};

/**
 * Return a percentage (0–100) representing how severe a raw value is,
 * normalised per disaster type for use in the sidebar severity bar.
 */
window.severityPercent = function(type, rawValue) {
  const scales = {
    earthquake: { min: 0, max: 9.5 },
    fire:       { min: 0, max: 600 },
    flood:      { min: 0, max: 5   },
    storm:      { min: 0, max: 300 }
  };
  const s = scales[type] || { min: 0, max: 100 };
  return Math.min(100, Math.max(0, ((rawValue - s.min) / (s.max - s.min)) * 100));
};

/**
 * Return the human-readable unit label for a disaster type's raw value.
 */
window.severityUnit = function(type) {
  return {
    earthquake: 'Richter magnitude',
    fire:       'FRP (MW)',
    flood:      'FMI index',
    storm:      'Wind speed (km/h)'
  }[type] || '';
};

/**
 * Return the CSS fill colour matching a severity level.
 */
window.severityColor = function(level) {
  return window.APP.SEV_COLORS[level] || '#8ba3c0';
};

// ─────────────────────────────────────────────
// BOOT — initialise the default view (map)
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  try { applyChartDefaults(); } catch (e) { console.warn('Chart defaults skipped:', e); }
  // Map view is visible by default — initialise it
  _mapInitialized = true;
  initMap();
});
