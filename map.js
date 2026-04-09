/* ═══════════════════════════════════════════════════════════
   map.js — Leaflet map, markers, filters, sidebar
═══════════════════════════════════════════════════════════ */

// Module-level state
let _map          = null;   // Leaflet map instance
let _markerLayer  = null;   // Leaflet LayerGroup holding all circle markers
let _activeMarker = null;   // Currently selected marker

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
function initMap() {
  if (_map) {
    _map.invalidateSize();
    return;
  }

  if (typeof L === 'undefined') {
    document.getElementById('map-container').innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ef4444;font-size:16px;font-family:Inter,sans-serif;">' +
      '&#9888; Leaflet.js failed to load. Please check your internet connection and refresh.' +
      '</div>';
    console.error('Leaflet (L) is not defined. CDN script may have failed to load.');
    return;
  }

  // Create map
  _map = L.map('map-container', {
    center: [20, 0],
    zoom: 2,
    zoomControl: true,
    attributionControl: true,
    minZoom: 2,
    maxZoom: 18,
    worldCopyJump: true
  });

  // Expose to app.js for invalidateSize calls
  window._leafletMap = _map;

  // CartoDB Dark Matter tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
      '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(_map);

  // Layer group for markers
  _markerLayer = L.layerGroup().addTo(_map);

  // Close sidebar when clicking the map background
  _map.on('click', () => closeSidebar());

  // Initial render
  applyFilters();
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

  const sevFilter  = document.getElementById('severity-filter').value;
  const dateStart  = document.getElementById('date-start').value;
  const dateEnd    = document.getElementById('date-end').value;

  const startMs = dateStart ? new Date(dateStart).getTime() : -Infinity;
  const endMs   = dateEnd   ? new Date(dateEnd + 'T23:59:59Z').getTime() : Infinity;

  const sevOrder = window.APP.SEV_ORDER;

  const filtered = window.DISASTER_EVENTS.filter(ev => {
    // Type filter
    if (!types[ev.event_type]) return false;

    // Severity filter
    if (sevFilter !== 'all') {
      if (sevFilter === 'extreme' && ev.severity_level !== 'extreme') return false;
      if (sevFilter !== 'extreme' && sevOrder[ev.severity_level] < sevOrder[sevFilter]) return false;
    }

    // Date filter
    const evMs = new Date(ev.timestamp).getTime();
    if (evMs < startMs || evMs > endMs) return false;

    return true;
  });

  // Update count display
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
  document.getElementById('date-start').value       = '2024-01-01';
  document.getElementById('date-end').value         = '2024-12-31';
  applyFilters();
}

function toggleFilterPanel() {
  const panel  = document.getElementById('filter-panel');
  const btn    = document.getElementById('filter-toggle');
  const isCollapsed = panel.classList.toggle('collapsed');
  btn.title = isCollapsed ? 'Expand filters' : 'Collapse filters';
}

// ─────────────────────────────────────────────
// MARKER RENDERING
// ─────────────────────────────────────────────
function renderMarkers(events) {
  _markerLayer.clearLayers();
  _activeMarker = null;

  const colors  = window.APP.TYPE_COLORS;
  const radii   = window.APP.SEV_RADIUS;

  events.forEach(ev => {
    const color  = colors[ev.event_type]      || '#ffffff';
    const radius = radii[ev.severity_level]   || 6;

    const marker = L.circleMarker([ev.latitude, ev.longitude], {
      radius:      radius,
      fillColor:   color,
      color:       color,
      weight:      1.5,
      opacity:     0.9,
      fillOpacity: 0.75,
      className:   `marker-${ev.event_type}`
    });

    // Hover tooltip
    const tooltipHtml =
      `<strong style="color:${color}">${window.capitalize(ev.event_type)}</strong>` +
      `<br><span style="color:#e8f0fe">${window.capitalize(ev.severity_level)}</span>` +
      `<span style="color:#546a84"> severity</span>`;

    marker.bindTooltip(tooltipHtml, {
      direction: 'top',
      offset: [0, -(radius + 4)],
      opacity: 1
    });

    // Hover glow effect
    marker.on('mouseover', function() {
      this.setStyle({
        weight: 2.5,
        fillOpacity: 1,
        radius: radius + 2
      });
    });

    marker.on('mouseout', function() {
      if (_activeMarker !== this) {
        this.setStyle({
          weight: 1.5,
          fillOpacity: 0.75,
          radius: radius
        });
      }
    });

    // Click — open sidebar
    marker.on('click', function(e) {
      L.DomEvent.stopPropagation(e);

      // Reset previously active marker style
      if (_activeMarker && _activeMarker !== this) {
        const prev = _activeMarker._disasterEvent;
        if (prev) {
          _activeMarker.setStyle({
            weight: 1.5,
            fillOpacity: 0.75,
            radius: radii[prev.severity_level] || 6
          });
        }
      }

      // Highlight this marker
      this.setStyle({
        weight: 3,
        fillOpacity: 1,
        radius: radius + 3
      });

      _activeMarker = this;
      openSidebar(ev);
    });

    // Store event ref on marker for reset
    marker._disasterEvent = ev;

    _markerLayer.addLayer(marker);
  });
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function openSidebar(ev) {
  const sidebar = document.getElementById('detail-sidebar');

  // ── Info card ──
  document.getElementById('sb-event-id').textContent  = ev.event_id;
  document.getElementById('sb-source').textContent    = ev.source;
  document.getElementById('sb-timestamp').textContent = window.formatTimestamp(ev.timestamp);
  document.getElementById('sb-coords').textContent    =
    `${ev.latitude.toFixed(4)}°, ${ev.longitude.toFixed(4)}°`;

  // ── Badges ──
  const typeBadge = document.getElementById('sb-type-badge');
  const sevBadge  = document.getElementById('sb-sev-badge');

  typeBadge.textContent = window.capitalize(ev.event_type);
  typeBadge.dataset.type = ev.event_type;

  sevBadge.textContent = window.capitalize(ev.severity_level);
  sevBadge.dataset.sev = ev.severity_level;

  // ── Severity bar ──
  document.getElementById('sb-sev-label').textContent =
    window.severityUnit(ev.event_type);

  document.getElementById('sb-sev-value').textContent =
    `${ev.severity_raw} ${unitAbbr(ev.event_type)}`;

  const pct  = window.severityPercent(ev.event_type, ev.severity_raw);
  const fill = document.getElementById('sb-sev-fill');
  fill.style.width      = `${pct}%`;
  fill.style.background = window.severityColor(ev.severity_level);

  // ── Extended fields ──
  document.getElementById('sidebar-fields').innerHTML = buildFieldsHTML(ev);

  // ── Slide in ──
  sidebar.classList.add('open');
}

function closeSidebar() {
  const sidebar = document.getElementById('detail-sidebar');
  sidebar.classList.remove('open');

  // Reset active marker highlight
  if (_activeMarker) {
    const ev = _activeMarker._disasterEvent;
    if (ev) {
      _activeMarker.setStyle({
        weight: 1.5,
        fillOpacity: 0.75,
        radius: window.APP.SEV_RADIUS[ev.severity_level] || 6
      });
    }
    _activeMarker = null;
  }
}

// ─────────────────────────────────────────────
// BUILD EXTENDED FIELDS HTML
// ─────────────────────────────────────────────
function buildFieldsHTML(ev) {
  let html = '';

  if (ev.event_type === 'earthquake') {
    html += groupTitle('Seismic Details');
    html += field('Place',          ev.place);
    html += field('Depth',          `${ev.depth_km} km`);
    html += field('Magnitude Type', ev.magnitude_type?.toUpperCase());
    html += field('MMI',            ev.mmi);
    html += field('Felt Reports',   ev.felt_count?.toLocaleString());
    html += field('Significance',   ev.significance);
    html += groupTitle('Alert');
    html += field('Alert Level',    badge(ev.alert_level, alertColor(ev.alert_level)));
    html += boolVal(ev.tsunami);
  }

  else if (ev.event_type === 'fire') {
    html += groupTitle('Fire Radiative Power');
    html += field('Total FRP',      `${ev.total_frp_mw} MW`);
    html += field('Area Burned',    `${ev.area_km2?.toLocaleString()} km²`);
    html += field('FRP Magnitude',  ev.magnitude);
    html += field('Pixel Count',    ev.pixel_count?.toLocaleString());
    html += groupTitle('Detection');
    html += field('Satellite',      ev.satellite);
    html += field('Instrument',     ev.instrument);
  }

  else if (ev.event_type === 'flood') {
    html += groupTitle('Flood Metrics');
    html += field('FMI Index',      ev.fmi?.toFixed(1));
    html += field('Flooded Area',   `${ev.area_km2?.toLocaleString()} km²`);
    html += field('Depth Score',    ev.depth_score?.toFixed(1));
    html += field('Duration Score', ev.duration_score?.toFixed(1));
    html += field('HWM Stations',   ev.hwm_count);
    html += groupTitle('Location');
    html += field('Waterbody',      ev.waterbody);
    html += field('Country',        ev.country);
  }

  else if (ev.event_type === 'storm') {
    html += groupTitle('Meteorological Data');
    html += field('Wind Speed',     `${ev.wind_kmh} km/h`);
    html += field('Pressure',       `${ev.pressure_hpa} hPa`);
    html += field('Humidity',       `${ev.humidity_pct}%`);
    html += field('Rain (1h)',      `${ev.rain_1h_mm} mm`);
    html += field('Beaufort Scale', `${ev.beaufort_scale} / 12`);
    html += groupTitle('Classification');
    html += field('Condition',      ev.condition);
    html += field('Location',       `${ev.city_name}, ${ev.country_code}`);
  }

  return html;
}

function groupTitle(label) {
  return `<div class="field-group-title">${label}</div>`;
}

function field(key, val) {
  if (val === undefined || val === null || val === '') return '';
  return `
    <div class="field-row">
      <span class="field-key">${key}</span>
      <span class="field-val">${val}</span>
    </div>`;
}

function boolVal(val) {
  const cls = val ? 'bool-true' : 'bool-false';
  return `<div class="field-row">
    <span class="field-key">Tsunami Risk</span>
    <span class="field-val ${cls}">${val ? 'Yes' : 'No'}</span>
  </div>`;
}

function badge(text, color) {
  return `<span style="
    display:inline-block;
    padding:2px 10px;
    border-radius:12px;
    font-size:11px;
    font-weight:600;
    text-transform:uppercase;
    background:${color}22;
    color:${color};
    border:1px solid ${color}55;
  ">${text}</span>`;
}

function alertColor(level) {
  return { green: '#22c55e', yellow: '#eab308', orange: '#f97316', red: '#ef4444' }[level] || '#8ba3c0';
}

function unitAbbr(type) {
  return { earthquake: 'M', fire: 'MW', flood: 'FMI', storm: 'km/h' }[type] || '';
}
