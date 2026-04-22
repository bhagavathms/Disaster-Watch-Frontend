/* ═══════════════════════════════════════════════════════════
   map.js — Leaflet map, markers, filters, sidebar
            Live data: SSE stream + /events/recent REST fetch
═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────
// MODULE STATE
// ─────────────────────────────────────────────
let _map          = null;   // Leaflet map instance
let _markerLayer  = null;   // LayerGroup holding all circle markers
let _activeMarker = null;   // Currently selected marker
let _sseSource    = null;   // EventSource for live stream
let _sseRetryTimer = null;  // Reconnect timer handle

// Shared live events array — also exposed as window.LIVE_EVENTS for analytics.js
window.LIVE_EVENTS = [];
const _liveEvents   = window.LIVE_EVENTS;
const _liveEventIds = new Set();   // dedup guard

// ─────────────────────────────────────────────
// CONNECTION STATUS BADGE
// ─────────────────────────────────────────────
function setConnStatus(state, label) {
  const el = document.getElementById('conn-status');
  if (!el) return;
  el.className = `conn-badge conn-${state}`;
  el.querySelector('.conn-label').textContent =
    label || { connecting: 'Connecting…', live: 'Live', error: 'Reconnecting…', offline: 'API Offline' }[state] || state;
}

function flashConn() {
  const el = document.getElementById('conn-status');
  if (!el) return;
  el.classList.add('conn-flash');
  setTimeout(() => el.classList.remove('conn-flash'), 600);
}

// ─────────────────────────────────────────────
// SIMULATION CONTROLS  (called from index.html buttons)
// ─────────────────────────────────────────────
async function startSimulation() {
  const delayEl = document.getElementById('sim-delay');
  const delay   = delayEl ? parseFloat(delayEl.value) || 0.5 : 0.5;
  try {
    const res  = await fetch(`${window.APP.API_BASE}/stream/start?delay=${delay}`, { method: 'POST' });
    const data = await res.json();
    setSimStatus(`Running (PID ${data.pid})`, true);
  } catch (e) {
    setSimStatus('Failed to start', false);
  }
}

async function stopSimulation() {
  try {
    await fetch(`${window.APP.API_BASE}/stream/stop`, { method: 'POST' });
    setSimStatus('Stopped', false);
  } catch (e) {
    setSimStatus('Failed to stop', false);
  }
}

async function checkSimStatus() {
  try {
    const data = await fetch(`${window.APP.API_BASE}/stream/status`).then(r => r.json());
    setSimStatus(
      data.simulation_running ? `Running (PID ${data.pid})` : 'Not running',
      data.simulation_running
    );
  } catch (_) { /* silently ignore on startup */ }
}

function setSimStatus(text, running) {
  const el = document.getElementById('sim-status');
  if (!el) return;
  el.textContent  = text;
  el.className    = running ? 'sim-status sim-running' : 'sim-status';
}

// ─────────────────────────────────────────────
// MAP INIT
// ─────────────────────────────────────────────
async function initMap() {
  if (_map) { _map.invalidateSize(); return; }

  if (typeof L === 'undefined') {
    document.getElementById('map-container').innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ef4444;' +
      'font-size:16px;font-family:Inter,sans-serif;">' +
      '&#9888; Leaflet.js failed to load. Check your internet connection and refresh.</div>';
    return;
  }

  _map = L.map('map-container', {
    center: [20, 0], zoom: 2,
    zoomControl: true, attributionControl: true,
    minZoom: 2, maxZoom: 18, worldCopyJump: true
  });
  window._leafletMap = _map;

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
      '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd', maxZoom: 19
  }).addTo(_map);

  _markerLayer = L.layerGroup().addTo(_map);
  _map.on('click', () => closeSidebar());

  setConnStatus('connecting');
  await _loadInitialEvents();
  _startSSE();
  checkSimStatus();
  applyFilters();
}

// ─────────────────────────────────────────────
// LOAD INITIAL EVENTS  via /events/recent
// ─────────────────────────────────────────────
async function _loadInitialEvents() {
  try {
    const raw  = await fetch(`${window.APP.API_BASE}/events/recent?limit=500`).then(r => r.json());
    const list = Array.isArray(raw) ? raw : (raw.events || []);
    list.forEach(ev => _ingestEvent(ev));
  } catch (e) {
    console.error('Could not load initial events:', e);
    setConnStatus('offline');
  }
}

// ─────────────────────────────────────────────
// SSE  —  /stream/events
// ─────────────────────────────────────────────
function _startSSE() {
  if (_sseSource) { _sseSource.close(); _sseSource = null; }
  if (_sseRetryTimer) { clearTimeout(_sseRetryTimer); _sseRetryTimer = null; }

  _sseSource = new EventSource(`${window.APP.API_BASE}/stream/events`);

  _sseSource.onmessage = (e) => {
    try {
      const frame = JSON.parse(e.data);
      if (frame.type === 'connected') {
        setConnStatus('live');
      }
      if (frame.type === 'event' && frame.data) {
        const norm = window.APP.normalizeEvent(frame.data);
        if (!_liveEventIds.has(norm.event_id)) {
          _liveEventIds.add(norm.event_id);
          _liveEvents.push(norm);
          _tryAddLiveMarker(norm);   // add directly if it passes filters
          flashConn();
          _updateFilterCount(1);
        }
      }
    } catch (err) {
      console.warn('SSE parse error:', err);
    }
  };

  _sseSource.onerror = () => {
    setConnStatus('error');
    _sseSource.close();
    _sseSource = null;
    _sseRetryTimer = setTimeout(_startSSE, 5000);
  };
}

// Ingest a raw backend event into _liveEvents (deduped)
function _ingestEvent(raw) {
  const norm = window.APP.normalizeEvent(raw);
  if (!_liveEventIds.has(norm.event_id)) {
    _liveEventIds.add(norm.event_id);
    _liveEvents.push(norm);
  }
}

// Add a single live event marker if it passes the current filter state
function _tryAddLiveMarker(ev) {
  const types = {
    earthquake: document.getElementById('chk-earthquake')?.checked,
    fire:       document.getElementById('chk-fire')?.checked,
    flood:      document.getElementById('chk-flood')?.checked,
    storm:      document.getElementById('chk-storm')?.checked
  };
  if (!types[ev.event_type]) return;

  const sevFilter = document.getElementById('severity-filter')?.value || 'all';
  const sevOrder  = window.APP.SEV_ORDER;
  if (sevFilter !== 'all') {
    if (sevFilter === 'extreme' && ev.severity_level !== 'extreme') return;
    if (sevFilter !== 'extreme' && sevOrder[ev.severity_level] < sevOrder[sevFilter]) return;
  }

  const dateStart = document.getElementById('date-start')?.value;
  const dateEnd   = document.getElementById('date-end')?.value;
  const evMs = new Date(ev.timestamp).getTime();
  if (dateStart && evMs < new Date(dateStart).getTime()) return;
  if (dateEnd   && evMs > new Date(dateEnd + 'T23:59:59Z').getTime()) return;

  addSingleMarker(ev);
}

// Increment the visible event count by n
function _updateFilterCount(n) {
  const el = document.getElementById('filter-count');
  if (!el) return;
  const m = el.textContent.match(/^(\d+)/);
  const c = (m ? parseInt(m[1]) : 0) + n;
  el.textContent = `${c} event${c !== 1 ? 's' : ''}`;
}

// ─────────────────────────────────────────────
// FILTER LOGIC
// ─────────────────────────────────────────────
function applyFilters() {
  const types = {
    earthquake: document.getElementById('chk-earthquake').checked,
    fire:       document.getElementById('chk-fire').checked,
    flood:      document.getElementById('chk-flood').checked,
    storm:      document.getElementById('chk-storm').checked
  };

  const sevFilter = document.getElementById('severity-filter').value;
  const dateStart = document.getElementById('date-start').value;
  const dateEnd   = document.getElementById('date-end').value;

  const startMs  = dateStart ? new Date(dateStart).getTime()              : -Infinity;
  const endMs    = dateEnd   ? new Date(dateEnd + 'T23:59:59Z').getTime() : Infinity;
  const sevOrder = window.APP.SEV_ORDER;

  const filtered = _liveEvents.filter(ev => {
    if (!types[ev.event_type]) return false;
    if (sevFilter !== 'all') {
      if (sevFilter === 'extreme' && ev.severity_level !== 'extreme') return false;
      if (sevFilter !== 'extreme' && sevOrder[ev.severity_level] < sevOrder[sevFilter]) return false;
    }
    const evMs = new Date(ev.timestamp).getTime();
    if (evMs < startMs || evMs > endMs) return false;
    return true;
  });

  const countEl = document.getElementById('filter-count');
  if (countEl) countEl.textContent = `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`;

  renderMarkers(filtered);
}

function resetFilters() {
  document.getElementById('chk-earthquake').checked = true;
  document.getElementById('chk-fire').checked       = true;
  document.getElementById('chk-flood').checked      = true;
  document.getElementById('chk-storm').checked      = true;
  document.getElementById('severity-filter').value  = 'all';
  document.getElementById('date-start').value       = '';
  document.getElementById('date-end').value         = '';
  applyFilters();
}

function toggleFilterPanel() {
  const panel = document.getElementById('filter-panel');
  const btn   = document.getElementById('filter-toggle');
  const collapsed = panel.classList.toggle('collapsed');
  btn.title = collapsed ? 'Expand filters' : 'Collapse filters';
}

// ─────────────────────────────────────────────
// MARKER RENDERING
// ─────────────────────────────────────────────
function renderMarkers(events) {
  _markerLayer.clearLayers();
  _activeMarker = null;
  events.forEach(ev => addSingleMarker(ev));
}

function addSingleMarker(ev) {
  const color  = window.APP.TYPE_COLORS[ev.event_type]    || '#ffffff';
  const radius = window.APP.SEV_RADIUS[ev.severity_level] || 6;

  const marker = L.circleMarker([ev.latitude, ev.longitude], {
    radius,
    fillColor:   color,
    color,
    weight:      1.5,
    opacity:     0.9,
    fillOpacity: 0.75,
    className:   `marker-${ev.event_type}`
  });

  marker.bindTooltip(
    `<strong style="color:${color}">${window.capitalize(ev.event_type)}</strong>` +
    `<br><span style="color:#e8f0fe">${window.capitalize(ev.severity_level)}</span>` +
    `<span style="color:#546a84"> severity</span>`,
    { direction: 'top', offset: [0, -(radius + 4)], opacity: 1 }
  );

  marker.on('mouseover', function() {
    this.setStyle({ weight: 2.5, fillOpacity: 1, radius: radius + 2 });
  });
  marker.on('mouseout', function() {
    if (_activeMarker !== this) this.setStyle({ weight: 1.5, fillOpacity: 0.75, radius });
  });
  marker.on('click', function(e) {
    L.DomEvent.stopPropagation(e);
    if (_activeMarker && _activeMarker !== this) {
      const prev = _activeMarker._disasterEvent;
      if (prev) _activeMarker.setStyle({
        weight: 1.5, fillOpacity: 0.75,
        radius: window.APP.SEV_RADIUS[prev.severity_level] || 6
      });
    }
    this.setStyle({ weight: 3, fillOpacity: 1, radius: radius + 3 });
    _activeMarker = this;
    openSidebar(ev);
  });

  marker._disasterEvent = ev;
  _markerLayer.addLayer(marker);
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function openSidebar(ev) {
  document.getElementById('sb-event-id').textContent  = ev.event_id;
  document.getElementById('sb-source').textContent    = ev.source || '—';
  document.getElementById('sb-timestamp').textContent = window.formatTimestamp(ev.timestamp);
  document.getElementById('sb-coords').textContent    =
    `${(+ev.latitude).toFixed(4)}°, ${(+ev.longitude).toFixed(4)}°`;

  const typeBadge = document.getElementById('sb-type-badge');
  const sevBadge  = document.getElementById('sb-sev-badge');
  typeBadge.textContent  = window.capitalize(ev.event_type);
  typeBadge.dataset.type = ev.event_type;
  sevBadge.textContent   = window.capitalize(ev.severity_level);
  sevBadge.dataset.sev   = ev.severity_level;

  // Severity bar — level-based percentage (raw value not in API response)
  const sevPct = { low: 25, moderate: 50, high: 75, extreme: 100 }[ev.severity_level] || 25;
  document.getElementById('sb-sev-label').textContent = 'Severity Level';
  document.getElementById('sb-sev-value').textContent = window.capitalize(ev.severity_level);
  const fill = document.getElementById('sb-sev-fill');
  fill.style.width      = `${sevPct}%`;
  fill.style.background = window.severityColor(ev.severity_level);

  document.getElementById('sidebar-fields').innerHTML = _buildFieldsHTML(ev);
  document.getElementById('detail-sidebar').classList.add('open');
}

function closeSidebar() {
  document.getElementById('detail-sidebar').classList.remove('open');
  if (_activeMarker) {
    const ev = _activeMarker._disasterEvent;
    if (ev) _activeMarker.setStyle({
      weight: 1.5, fillOpacity: 0.75,
      radius: window.APP.SEV_RADIUS[ev.severity_level] || 6
    });
    _activeMarker = null;
  }
}

// ─────────────────────────────────────────────
// EXTENDED FIELDS  (shows what the API provides)
// ─────────────────────────────────────────────
function _buildFieldsHTML(ev) {
  let html = '';

  if (ev.processed_at) {
    html += _groupTitle('Processing Info');
    html += _field('Processed At', window.formatTimestamp(ev.processed_at));
  }

  // Type-specific extended data (present when MongoDB returns richer objects)
  if (ev.event_type === 'earthquake') {
    if (ev.place || ev.depth_km != null || ev.magnitude_type) {
      html += _groupTitle('Seismic Details');
      html += _field('Place',          ev.place);
      html += _field('Depth',          ev.depth_km != null ? `${ev.depth_km} km` : null);
      html += _field('Magnitude Type', ev.magnitude_type?.toUpperCase());
      html += _field('MMI',            ev.mmi);
      html += _field('Felt Reports',   ev.felt_count?.toLocaleString());
      html += _field('Significance',   ev.significance);
    }
    if (ev.alert_level) {
      html += _groupTitle('Alert');
      html += _field('Alert Level', _badge(ev.alert_level, _alertColor(ev.alert_level)));
      html += _boolField('Tsunami Risk', ev.tsunami);
    }
  } else if (ev.event_type === 'fire') {
    if (ev.total_frp_mw != null || ev.area_km2 != null) {
      html += _groupTitle('Fire Radiative Power');
      html += _field('Total FRP',   ev.total_frp_mw != null ? `${ev.total_frp_mw} MW`              : null);
      html += _field('Area Burned', ev.area_km2     != null ? `${ev.area_km2.toLocaleString()} km²` : null);
      html += _field('Satellite',   ev.satellite);
      html += _field('Instrument',  ev.instrument);
    }
  } else if (ev.event_type === 'flood') {
    if (ev.fmi != null || ev.area_km2 != null) {
      html += _groupTitle('Flood Metrics');
      html += _field('FMI Index',    ev.fmi?.toFixed(1));
      html += _field('Flooded Area', ev.area_km2 != null ? `${ev.area_km2.toLocaleString()} km²` : null);
      html += _field('Country',      ev.country);
      html += _field('Waterbody',    ev.waterbody);
    }
  } else if (ev.event_type === 'storm') {
    if (ev.wind_kmh != null || ev.pressure_hpa != null) {
      html += _groupTitle('Meteorological Data');
      html += _field('Wind Speed',   ev.wind_kmh     != null ? `${ev.wind_kmh} km/h`   : null);
      html += _field('Pressure',     ev.pressure_hpa != null ? `${ev.pressure_hpa} hPa` : null);
      html += _field('Humidity',     ev.humidity_pct != null ? `${ev.humidity_pct}%`    : null);
      html += _field('Rain (1h)',    ev.rain_1h_mm   != null ? `${ev.rain_1h_mm} mm`    : null);
      html += _field('Condition',    ev.condition);
    }
  }

  if (!html) {
    html = '<div style="color:var(--text-muted);text-align:center;padding:16px 0;font-size:13px;">' +
           'No extended data available</div>';
  }

  return html;
}

function _groupTitle(label) {
  return `<div class="field-group-title">${label}</div>`;
}
function _field(key, val) {
  if (val == null || val === '') return '';
  return `<div class="field-row"><span class="field-key">${key}</span><span class="field-val">${val}</span></div>`;
}
function _boolField(key, val) {
  const cls = val ? 'bool-true' : 'bool-false';
  return `<div class="field-row"><span class="field-key">${key}</span>` +
         `<span class="field-val ${cls}">${val ? 'Yes' : 'No'}</span></div>`;
}
function _badge(text, color) {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;` +
         `font-weight:600;text-transform:uppercase;background:${color}22;color:${color};` +
         `border:1px solid ${color}55;">${text}</span>`;
}
function _alertColor(level) {
  return ({ green: '#22c55e', yellow: '#eab308', orange: '#f97316', red: '#ef4444' })[level] || '#8ba3c0';
}
