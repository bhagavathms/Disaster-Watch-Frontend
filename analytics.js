/* ═══════════════════════════════════════════════════════════
   analytics.js — Chart.js dashboard
   Primary data source: PostgreSQL analytics API endpoints
   Fallback:            window.LIVE_EVENTS (MongoDB SSE cache)
═══════════════════════════════════════════════════════════ */
/* global Chart */

const _charts = {};

function destroyChart(id) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

function _countBy(events, keyFn) {
  return events.reduce((acc, ev) => {
    const k = keyFn(ev); acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});
}

const TYPES             = window.APP.TYPES;
const SEV_LEVELS        = window.APP.SEV_LEVELS;
const TYPE_COLORS       = window.APP.TYPE_COLORS;
const TYPE_COLORS_ALPHA = window.APP.TYPE_COLORS_ALPHA;
const SEV_COLORS        = window.APP.SEV_COLORS;
const SEV_COLORS_ALPHA  = window.APP.SEV_COLORS_ALPHA;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────
async function initAnalytics() {
  const headerEl = document.getElementById('total-events-header');
  if (headerEl) headerEl.textContent = 'Loading…';

  const BASE       = window.APP.API_BASE;
  const liveEvents = window.LIVE_EVENTS || [];

  try {
    // Fetch all analytics data in parallel from PostgreSQL
    const [countData, topLocations, ...monthlyByType] = await Promise.all([
      fetch(`${BASE}/analytics/event-counts`).then(r => r.json()),
      fetch(`${BASE}/analytics/locations/top?limit=30`).then(r => r.json()),
      ...TYPES.map(t =>
        fetch(`${BASE}/analytics/monthly-trends?event_type=${t}`).then(r => r.json())
      )
    ]);

    const total = countData.reduce((s, d) => s + (d.total || 0), 0);
    if (headerEl) headerEl.textContent = total.toLocaleString();

    renderCountByType(countData);
    renderSeverityDist(liveEvents);      // no API endpoint — use live cache
    renderMonthlyTrend(monthlyByType);
    renderGeoDist(topLocations);
    renderStatCards(countData, topLocations, liveEvents);

  } catch (e) {
    console.warn('Analytics API unavailable, falling back to live event cache:', e);
    if (headerEl) headerEl.textContent = liveEvents.length.toLocaleString();

    renderCountByTypeFallback(liveEvents);
    renderSeverityDist(liveEvents);
    renderMonthlyTrendFallback(liveEvents);
    renderGeoDistFallback(liveEvents);
    renderStatCardsFallback(liveEvents);
  }
}

// ─────────────────────────────────────────────
// CHART 1 — Event Count by Type  (horizontal bar)
// ─────────────────────────────────────────────
function renderCountByType(countData) {
  destroyChart('countByType');

  const data    = TYPES.map(t => (countData.find(d => d.event_type === t) || {}).total || 0);
  const labels  = TYPES.map(t => window.capitalize(t));
  const colors  = TYPES.map(t => TYPE_COLORS_ALPHA[t]);
  const borders = TYPES.map(t => TYPE_COLORS[t]);

  const ctx = document.getElementById('chart-count-by-type').getContext('2d');
  _charts.countByType = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Events', data, backgroundColor: colors, borderColor: borders, borderWidth: 1.5, borderRadius: 6, borderSkipped: false }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${c.parsed.x.toLocaleString()} events` } }
      },
      scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(42,63,88,0.5)' } },
        y: { grid: { display: false }, ticks: { color: '#e8f0fe', font: { weight: '500', size: 13 } } }
      }
    }
  });
}

function renderCountByTypeFallback(events) {
  const counts = _countBy(events, ev => ev.event_type);
  renderCountByType(TYPES.map(t => ({ event_type: t, total: counts[t] || 0 })));
}

// ─────────────────────────────────────────────
// CHART 2 — Severity Distribution  (stacked bar, always from live cache)
// ─────────────────────────────────────────────
function renderSeverityDist(events) {
  destroyChart('severityDist');

  const sevCounts = {};
  TYPES.forEach(t => { sevCounts[t] = { low: 0, moderate: 0, high: 0, extreme: 0 }; });
  events.forEach(ev => { if (sevCounts[ev.event_type]) sevCounts[ev.event_type][ev.severity_level]++; });

  const labels   = TYPES.map(t => window.capitalize(t));
  const datasets = SEV_LEVELS.map(sev => ({
    label: window.capitalize(sev),
    data:  TYPES.map(t => sevCounts[t][sev]),
    backgroundColor: SEV_COLORS_ALPHA[sev],
    borderColor:     SEV_COLORS[sev],
    borderWidth: 1, borderRadius: 3, stack: 'severity'
  }));

  const ctx = document.getElementById('chart-severity-dist').getContext('2d');
  _charts.severityDist = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { color: '#8ba3c0', font: { size: 11 }, padding: 12 } },
        tooltip: { mode: 'index', intersect: false, callbacks: { title: i => i[0].label, label: c => ` ${c.dataset.label}: ${c.parsed.y}` } }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: '#e8f0fe', font: { weight: '500', size: 12 } } },
        y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(42,63,88,0.5)' }, ticks: { stepSize: 5 } }
      }
    }
  });
}

// ─────────────────────────────────────────────
// CHART 3 — Monthly Event Trend  (multi-line)
// monthlyByType[i] = [{year, month, total}, …] for TYPES[i]
// ─────────────────────────────────────────────
function renderMonthlyTrend(monthlyByType) {
  destroyChart('monthlyTrend');

  // Aggregate across all years: monthly[type][0..11] = count
  const monthly = {};
  TYPES.forEach((t, i) => {
    monthly[t] = new Array(12).fill(0);
    (monthlyByType[i] || []).forEach(d => { monthly[t][(d.month || 1) - 1] += (d.total || 0); });
  });

  const datasets = TYPES.map(t => ({
    label:                window.capitalize(t),
    data:                 monthly[t],
    borderColor:          TYPE_COLORS[t],
    backgroundColor:      TYPE_COLORS[t] + '22',
    borderWidth:          2,
    pointRadius:          4,
    pointHoverRadius:     6,
    pointBackgroundColor: TYPE_COLORS[t],
    pointBorderColor:     '#0f1923',
    pointBorderWidth:     1.5,
    tension:              0.35,
    fill:                 false
  }));

  const ctx = document.getElementById('chart-monthly-trend').getContext('2d');
  _charts.monthlyTrend = new Chart(ctx, {
    type: 'line',
    data: { labels: MONTHS, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'top', labels: { color: '#8ba3c0', font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 } },
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y}` } }
      },
      scales: {
        x: { grid: { color: 'rgba(42,63,88,0.4)' }, ticks: { color: '#8ba3c0' } },
        y: { beginAtZero: true, grid: { color: 'rgba(42,63,88,0.5)' } }
      }
    }
  });
}

function renderMonthlyTrendFallback(events) {
  const monthly = {};
  TYPES.forEach(t => { monthly[t] = new Array(12).fill(0); });
  events.forEach(ev => {
    const m = new Date(ev.timestamp).getUTCMonth();
    if (monthly[ev.event_type]) monthly[ev.event_type][m]++;
  });
  renderMonthlyTrend(TYPES.map(t => monthly[t].map((total, i) => ({ month: i + 1, total }))));
}

// ─────────────────────────────────────────────
// CHART 4 — Geographic Distribution  (doughnut)
// topLocations = [{country, region, total}, …]
// ─────────────────────────────────────────────
function renderGeoDist(topLocations) {
  destroyChart('geoDist');

  // Aggregate by region (continent-level)
  const regionMap = {};
  topLocations.forEach(loc => {
    const r = loc.region || 'Other';
    regionMap[r] = (regionMap[r] || 0) + (loc.total || 0);
  });

  const entries     = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);
  const regionNames = entries.map(e => e[0]);
  const regionData  = entries.map(e => e[1]);
  const palette     = ['#3b82f6','#06b6d4','#f97316','#22c55e','#eab308','#a855f7','#ec4899','#14b8a6'];

  const ctx = document.getElementById('chart-geo-dist').getContext('2d');
  _charts.geoDist = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: regionNames,
      datasets: [{
        data:            regionData,
        backgroundColor: regionNames.map((_, i) => palette[i % palette.length] + 'cc'),
        borderColor:     regionNames.map((_, i) => palette[i % palette.length]),
        borderWidth: 1.5, hoverOffset: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: {
          display: true, position: 'right',
          labels: {
            color: '#8ba3c0', font: { size: 11 }, padding: 10,
            usePointStyle: true, pointStyleWidth: 8,
            generateLabels: chart => {
              const d = chart.data;
              return d.labels.map((label, i) => ({
                text:        `${label} (${(d.datasets[0].data[i] || 0).toLocaleString()})`,
                fillStyle:   d.datasets[0].backgroundColor[i],
                strokeStyle: d.datasets[0].borderColor[i],
                lineWidth:   1, pointStyle: 'circle', hidden: false, index: i, fontColor: '#e8f0fe'
              }));
            }
          }
        },
        tooltip: {
          callbacks: {
            label: c => {
              const total = c.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((c.parsed / total) * 100).toFixed(1);
              return ` ${c.label}: ${c.parsed.toLocaleString()} events (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function renderGeoDistFallback(events) {
  const regionMap = {};
  window.APP.REGIONS.forEach(r => { regionMap[r.name] = 0; });
  events.forEach(ev => {
    const r = window.getRegion(ev.latitude, ev.longitude);
    regionMap[r] = (regionMap[r] || 0) + 1;
  });
  renderGeoDist(
    Object.entries(regionMap).filter(e => e[1] > 0).map(([region, total]) => ({ region, total }))
  );
}

// ─────────────────────────────────────────────
// STAT CARDS
// ─────────────────────────────────────────────
function renderStatCards(countData, topLocations, liveEvents) {
  // Total events
  const total = countData.reduce((s, d) => s + (d.total || 0), 0);
  document.getElementById('stat-total').textContent = total.toLocaleString();

  // Most active region
  const regionMap = {};
  topLocations.forEach(loc => {
    const r = loc.region || 'Other';
    regionMap[r] = (regionMap[r] || 0) + (loc.total || 0);
  });
  const topRegion = Object.entries(regionMap).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('stat-region').textContent =
    topRegion ? `${topRegion[0]} (${topRegion[1].toLocaleString()})` : '—';

  // Highest severity event — from live cache (API has no "worst event" endpoint)
  _setHighestSeverityCard(liveEvents);

  // Most common type
  const topType = [...countData].sort((a, b) => b.total - a.total)[0];
  document.getElementById('stat-common').textContent =
    topType ? `${window.capitalize(topType.event_type)} (${topType.total.toLocaleString()})` : '—';
}

function renderStatCardsFallback(events) {
  document.getElementById('stat-total').textContent = events.length.toLocaleString();

  const regionMap = {};
  events.forEach(ev => {
    const r = window.getRegion(ev.latitude, ev.longitude);
    regionMap[r] = (regionMap[r] || 0) + 1;
  });
  const topRegion = Object.entries(regionMap).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('stat-region').textContent =
    topRegion ? `${topRegion[0]} (${topRegion[1]})` : '—';

  _setHighestSeverityCard(events);

  const typeCounts = _countBy(events, ev => ev.event_type);
  const topType    = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('stat-common').textContent =
    topType ? `${window.capitalize(topType[0])} (${topType[1]})` : '—';
}

function _setHighestSeverityCard(events) {
  const sevOrder = window.APP.SEV_ORDER;
  const topEvent = [...events].sort((a, b) => sevOrder[b.severity_level] - sevOrder[a.severity_level])[0];
  const el = document.getElementById('stat-highest');
  if (topEvent) {
    el.textContent = topEvent.event_id;
    el.title       = `${window.capitalize(topEvent.event_type)} — ${window.capitalize(topEvent.severity_level)}`;
    el.style.fontSize = '11px';
  } else {
    el.textContent = '—';
  }
}
