/* ═══════════════════════════════════════════════════════════
   analytics.js — Chart.js dashboard: 4 charts + stat cards
═══════════════════════════════════════════════════════════ */
/* global Chart */

// Chart instances — kept so we can destroy & recreate on re-init
const _charts = {};

// ─────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────
function initAnalytics() {
  const events = window.DISASTER_EVENTS;

  // Update header count
  const headerEl = document.getElementById('total-events-header');
  if (headerEl) headerEl.textContent = events.length;

  renderCountByType(events);
  renderSeverityDist(events);
  renderMonthlyTrend(events);
  renderGeoDist(events);
  renderStatCards(events);
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function destroyChart(id) {
  if (_charts[id]) {
    _charts[id].destroy();
    delete _charts[id];
  }
}

function countBy(events, keyFn) {
  return events.reduce((acc, ev) => {
    const k = keyFn(ev);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

const TYPES      = window.APP.TYPES;
const SEV_LEVELS = window.APP.SEV_LEVELS;
const TYPE_COLORS       = window.APP.TYPE_COLORS;
const TYPE_COLORS_ALPHA = window.APP.TYPE_COLORS_ALPHA;
const SEV_COLORS        = window.APP.SEV_COLORS;
const SEV_COLORS_ALPHA  = window.APP.SEV_COLORS_ALPHA;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─────────────────────────────────────────────
// CHART 1 — Event Count by Type (horizontal bar)
// ─────────────────────────────────────────────
function renderCountByType(events) {
  destroyChart('countByType');

  const counts = countBy(events, ev => ev.event_type);
  const labels = TYPES.map(t => window.capitalize(t));
  const data   = TYPES.map(t => counts[t] || 0);
  const colors = TYPES.map(t => TYPE_COLORS_ALPHA[t]);
  const borders = TYPES.map(t => TYPE_COLORS[t]);

  const ctx = document.getElementById('chart-count-by-type').getContext('2d');
  _charts.countByType = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Events',
        data,
        backgroundColor: colors,
        borderColor: borders,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.x} events`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 5 },
          grid: { color: 'rgba(42,63,88,0.5)' }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#e8f0fe',
            font: { weight: '500', size: 13 }
          }
        }
      }
    }
  });
}

// ─────────────────────────────────────────────
// CHART 2 — Severity Distribution (stacked bar)
// ─────────────────────────────────────────────
function renderSeverityDist(events) {
  destroyChart('severityDist');

  // Build matrix: sevCounts[type][severity] = count
  const sevCounts = {};
  TYPES.forEach(t => {
    sevCounts[t] = { low: 0, moderate: 0, high: 0, extreme: 0 };
  });
  events.forEach(ev => {
    if (sevCounts[ev.event_type]) {
      sevCounts[ev.event_type][ev.severity_level]++;
    }
  });

  const labels   = TYPES.map(t => window.capitalize(t));
  const datasets = SEV_LEVELS.map(sev => ({
    label:           window.capitalize(sev),
    data:            TYPES.map(t => sevCounts[t][sev]),
    backgroundColor: SEV_COLORS_ALPHA[sev],
    borderColor:     SEV_COLORS[sev],
    borderWidth:     1,
    borderRadius:    3,
    stack:           'severity'
  }));

  const ctx = document.getElementById('chart-severity-dist').getContext('2d');
  _charts.severityDist = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#8ba3c0',
            font: { size: 11 },
            padding: 12
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: items => items[0].label,
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}`
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: '#e8f0fe', font: { weight: '500', size: 12 } }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: 'rgba(42,63,88,0.5)' },
          ticks: { stepSize: 5 }
        }
      }
    }
  });
}

// ─────────────────────────────────────────────
// CHART 3 — Monthly Event Trend (line)
// ─────────────────────────────────────────────
function renderMonthlyTrend(events) {
  destroyChart('monthlyTrend');

  // monthly[type][0..11] = count
  const monthly = {};
  TYPES.forEach(t => { monthly[t] = new Array(12).fill(0); });

  events.forEach(ev => {
    const month = new Date(ev.timestamp).getUTCMonth(); // 0-based
    if (monthly[ev.event_type]) {
      monthly[ev.event_type][month]++;
    }
  });

  const datasets = TYPES.map(t => ({
    label:           window.capitalize(t),
    data:            monthly[t],
    borderColor:     TYPE_COLORS[t],
    backgroundColor: TYPE_COLORS[t] + '22',
    borderWidth:     2,
    pointRadius:     4,
    pointHoverRadius: 6,
    pointBackgroundColor: TYPE_COLORS[t],
    pointBorderColor: '#0f1923',
    pointBorderWidth: 1.5,
    tension:         0.35,
    fill:            false
  }));

  const ctx = document.getElementById('chart-monthly-trend').getContext('2d');
  _charts.monthlyTrend = new Chart(ctx, {
    type: 'line',
    data: { labels: MONTHS, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#8ba3c0',
            font: { size: 11 },
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 8
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(42,63,88,0.4)' },
          ticks: { color: '#8ba3c0' }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(42,63,88,0.5)' },
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

// ─────────────────────────────────────────────
// CHART 4 — Geographic Distribution (doughnut)
// ─────────────────────────────────────────────
function renderGeoDist(events) {
  destroyChart('geoDist');

  // Count events per region
  const regionCounts = {};
  window.APP.REGIONS.forEach(r => { regionCounts[r.name] = 0; });
  regionCounts['Other'] = 0;

  events.forEach(ev => {
    const region = window.getRegion(ev.latitude, ev.longitude);
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });

  // Filter out 'Other' if zero, keep defined region order
  const regionNames  = window.APP.REGIONS.map(r => r.name).filter(n => regionCounts[n] > 0);
  const regionData   = regionNames.map(n => regionCounts[n]);

  // Colour palette for 6 regions
  const regionColors = [
    '#3b82f6',  // Asia-Pacific  — blue
    '#06b6d4',  // South Asia    — cyan
    '#f97316',  // Americas      — orange
    '#22c55e',  // Europe        — green
    '#eab308',  // Middle East   — yellow
    '#a855f7'   // Africa        — purple
  ];

  const ctx = document.getElementById('chart-geo-dist').getContext('2d');
  _charts.geoDist = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: regionNames,
      datasets: [{
        data:            regionData,
        backgroundColor: regionColors.slice(0, regionNames.length).map(c => c + 'cc'),
        borderColor:     regionColors.slice(0, regionNames.length),
        borderWidth:     1.5,
        hoverOffset:     8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: '#8ba3c0',
            font: { size: 11 },
            padding: 10,
            usePointStyle: true,
            pointStyleWidth: 8,
            generateLabels: chart => {
              const data = chart.data;
              return data.labels.map((label, i) => ({
                text:            `${label} (${data.datasets[0].data[i]})`,
                fillStyle:       data.datasets[0].backgroundColor[i],
                strokeStyle:     data.datasets[0].borderColor[i],
                lineWidth:       1,
                pointStyle:      'circle',
                hidden:          false,
                index:           i,
                fontColor:       '#e8f0fe'
              }));
            }
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${ctx.parsed} events (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// ─────────────────────────────────────────────
// STAT CARDS
// ─────────────────────────────────────────────
function renderStatCards(events) {
  // 1. Total events
  document.getElementById('stat-total').textContent = events.length;

  // 2. Most active region
  const regionCounts = {};
  events.forEach(ev => {
    const r = window.getRegion(ev.latitude, ev.longitude);
    regionCounts[r] = (regionCounts[r] || 0) + 1;
  });
  const topRegion = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])[0];
  document.getElementById('stat-region').textContent =
    topRegion ? `${topRegion[0]} (${topRegion[1]})` : '—';

  // 3. Highest severity event
  //    Priority: extreme > high > moderate > low, then highest raw value
  const sevOrder = window.APP.SEV_ORDER;
  const topEvent = [...events].sort((a, b) => {
    const sevDiff = sevOrder[b.severity_level] - sevOrder[a.severity_level];
    if (sevDiff !== 0) return sevDiff;
    return b.severity_raw - a.severity_raw;
  })[0];

  if (topEvent) {
    const el = document.getElementById('stat-highest');
    el.textContent = topEvent.event_id;
    el.title = `${window.capitalize(topEvent.event_type)} — ${topEvent.severity_raw} ${window.severityUnit(topEvent.event_type)}`;
    el.style.fontSize = '13px';
  }

  // 4. Most common type
  const typeCounts = countBy(events, ev => ev.event_type);
  const topType    = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('stat-common').textContent =
    topType ? `${window.capitalize(topType[0])} (${topType[1]})` : '—';
}
