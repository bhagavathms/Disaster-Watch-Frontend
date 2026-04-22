import { useMemo } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  TYPES, SEV_LEVELS, SEV_ORDER, MONTHS,
  TYPE_COLORS, TYPE_COLORS_ALPHA,
  SEV_COLORS, SEV_COLORS_ALPHA,
  capitalize, getRegion, CHART_COLOR_PALETTE,
} from '../config';
import { useAnalytics } from '../hooks/useAnalytics';

// ─── Shared chart options helpers ───────────────────────────────────────────
const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#8ba3c0', font: { size: 11 }, padding: 12 } },
    tooltip: {
      backgroundColor: 'rgba(22,32,50,0.97)',
      titleColor: '#e8f0fe', bodyColor: '#8ba3c0',
      borderColor: '#2a3f58', borderWidth: 1, padding: 10, cornerRadius: 8,
    },
  },
};

const gridColor = 'rgba(42,63,88,0.5)';

// ─── Build chart data from API or fallback ───────────────────────────────────
function buildCountData(counts) {
  return {
    labels:   TYPES.map(capitalize),
    datasets: [{
      label: 'Events',
      data:            TYPES.map(t => (counts.find(d => d.event_type === t) || {}).total || 0),
      backgroundColor: TYPES.map(t => TYPE_COLORS_ALPHA[t]),
      borderColor:     TYPES.map(t => TYPE_COLORS[t]),
      borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
    }],
  };
}

function buildSeverityData(liveEvents) {
  const m = {};
  TYPES.forEach(t => { m[t] = { low: 0, moderate: 0, high: 0, extreme: 0 }; });
  liveEvents.forEach(ev => { if (m[ev.event_type]) m[ev.event_type][ev.severity_level]++; });
  return {
    labels:   TYPES.map(capitalize),
    datasets: SEV_LEVELS.map(sev => ({
      label:           capitalize(sev),
      data:            TYPES.map(t => m[t][sev]),
      backgroundColor: SEV_COLORS_ALPHA[sev],
      borderColor:     SEV_COLORS[sev],
      borderWidth: 1, borderRadius: 3, stack: 'severity',
    })),
  };
}

function buildMonthlyData(monthlyByType) {
  const monthly = {};
  TYPES.forEach((t, i) => {
    monthly[t] = new Array(12).fill(0);
    (monthlyByType[i] || []).forEach(d => { monthly[t][(d.month || 1) - 1] += (d.total || 0); });
  });
  return {
    labels:   MONTHS,
    datasets: TYPES.map(t => ({
      label:                capitalize(t),
      data:                 monthly[t],
      borderColor:          TYPE_COLORS[t],
      backgroundColor:      TYPE_COLORS[t] + '22',
      borderWidth:          2,
      pointRadius:          4, pointHoverRadius: 6,
      pointBackgroundColor: TYPE_COLORS[t],
      pointBorderColor:     '#0f1923', pointBorderWidth: 1.5,
      tension: 0.35, fill: false,
    })),
  };
}

function buildGeoData(locations) {
  const regionMap = {};
  locations.forEach(loc => {
    const r = loc.region || 'Other';
    regionMap[r] = (regionMap[r] || 0) + (loc.total || 0);
  });
  const entries = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);
  const palette = CHART_COLOR_PALETTE;
  return {
    labels:   entries.map(e => e[0]),
    datasets: [{
      data:            entries.map(e => e[1]),
      backgroundColor: entries.map((_, i) => palette[i % palette.length] + 'cc'),
      borderColor:     entries.map((_, i) => palette[i % palette.length]),
      borderWidth: 1.5, hoverOffset: 8,
    }],
  };
}

// Fallback monthly from live events
function buildMonthlyFromEvents(liveEvents) {
  const monthly = {};
  TYPES.forEach(t => { monthly[t] = new Array(12).fill(0); });
  liveEvents.forEach(ev => {
    const m = new Date(ev.timestamp).getUTCMonth();
    if (monthly[ev.event_type]) monthly[ev.event_type][m]++;
  });
  return buildMonthlyData(TYPES.map(t => monthly[t].map((total, i) => ({ month: i + 1, total }))));
}

function buildGeoFromEvents(liveEvents) {
  const m = {};
  liveEvents.forEach(ev => {
    const r = getRegion(ev.latitude, ev.longitude);
    m[r] = (m[r] || 0) + 1;
  });
  return buildGeoData(Object.entries(m).map(([region, total]) => ({ region, total })));
}

// ─── Stat cards ─────────────────────────────────────────────────────────────
function StatCards({ counts, locations, liveEvents }) {
  const total = counts.reduce((s, d) => s + (d.total || 0), 0);

  const topRegion = useMemo(() => {
    const m = {};
    locations.forEach(loc => {
      const r = loc.region || 'Other';
      m[r] = (m[r] || 0) + (loc.total || 0);
    });
    const [name, n] = Object.entries(m).sort((a, b) => b[1] - a[1])[0] || ['—', 0];
    return `${name} (${n.toLocaleString()})`;
  }, [locations]);

  const topEvent = useMemo(() =>
    [...liveEvents].sort((a, b) => SEV_ORDER[b.severity_level] - SEV_ORDER[a.severity_level])[0],
  [liveEvents]);

  const topType = [...counts].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="stats-row">
      <StatCard icon="🌐" value={total.toLocaleString()} label="Total Events" />
      <StatCard icon="📍" value={topRegion} label="Most Active Region" />
      <StatCard
        icon="🔴"
        value={topEvent ? topEvent.event_id : '—'}
        title={topEvent ? `${capitalize(topEvent.event_type)} — ${capitalize(topEvent.severity_level)}` : ''}
        label="Highest Severity Event"
        small
      />
      <StatCard
        icon="📈"
        value={topType ? `${capitalize(topType.event_type)} (${topType.total.toLocaleString()})` : '—'}
        label="Most Common Type"
      />
    </div>
  );
}

function StatCard({ icon, value, label, title, small }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value" title={title} style={small ? { fontSize: '11px' } : {}}>
          {value}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// ─── Fallback stat cards when API is down ────────────────────────────────────
function StatCardsFallback({ liveEvents }) {
  const total    = liveEvents.length;
  const topEvent = [...liveEvents].sort((a, b) => SEV_ORDER[b.severity_level] - SEV_ORDER[a.severity_level])[0];

  const regionMap = {};
  liveEvents.forEach(ev => {
    const r = getRegion(ev.latitude, ev.longitude);
    regionMap[r] = (regionMap[r] || 0) + 1;
  });
  const [topR, topRn] = Object.entries(regionMap).sort((a, b) => b[1] - a[1])[0] || ['—', 0];

  const typeMap = {};
  liveEvents.forEach(ev => { typeMap[ev.event_type] = (typeMap[ev.event_type] || 0) + 1; });
  const [topT, topTn] = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0] || ['—', 0];

  return (
    <div className="stats-row">
      <StatCard icon="🌐" value={total.toLocaleString()}          label="Total Events (live cache)" />
      <StatCard icon="📍" value={`${topR} (${topRn})`}           label="Most Active Region" />
      <StatCard icon="🔴" value={topEvent?.event_id || '—'}       label="Highest Severity Event" small />
      <StatCard icon="📈" value={`${capitalize(topT)} (${topTn})`} label="Most Common Type" />
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AnalyticsView({ liveEvents }) {
  const { data, loading, error } = useAnalytics();

  // Chart options
  const countOpts = {
    ...baseOpts,
    indexAxis: 'y',
    plugins: {
      ...baseOpts.plugins,
      legend: { display: false },
      tooltip: { ...baseOpts.plugins.tooltip, callbacks: { label: c => ` ${c.parsed.x.toLocaleString()} events` } },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: gridColor } },
      y: { grid: { display: false }, ticks: { color: '#e8f0fe', font: { weight: '500', size: 13 } } },
    },
  };

  const severityOpts = {
    ...baseOpts,
    plugins: {
      ...baseOpts.plugins,
      legend: { ...baseOpts.plugins.legend, display: true, position: 'top' },
      tooltip: { ...baseOpts.plugins.tooltip, mode: 'index', intersect: false },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#e8f0fe', font: { weight: '500', size: 12 } } },
      y: { stacked: true, beginAtZero: true, grid: { color: gridColor }, ticks: { stepSize: 5 } },
    },
  };

  const monthlyOpts = {
    ...baseOpts,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      ...baseOpts.plugins,
      legend: { ...baseOpts.plugins.legend, display: true, position: 'top', labels: { ...baseOpts.plugins.legend.labels, usePointStyle: true, pointStyleWidth: 8 } },
    },
    scales: {
      x: { grid: { color: 'rgba(42,63,88,0.4)' }, ticks: { color: '#8ba3c0' } },
      y: { beginAtZero: true, grid: { color: gridColor } },
    },
  };

  const geoOpts = {
    ...baseOpts,
    cutout: '60%',
    plugins: {
      ...baseOpts.plugins,
      legend: {
        display: true, position: 'right',
        labels: {
          ...baseOpts.plugins.legend.labels,
          usePointStyle: true, pointStyleWidth: 8, padding: 10,
          generateLabels: chart => {
            const d = chart.data;
            return d.labels.map((label, i) => ({
              text:        `${label} (${(d.datasets[0].data[i] || 0).toLocaleString()})`,
              fillStyle:   d.datasets[0].backgroundColor[i],
              strokeStyle: d.datasets[0].borderColor[i],
              lineWidth: 1, pointStyle: 'circle', hidden: false, index: i, fontColor: '#e8f0fe',
            }));
          },
        },
        tooltip: {
          callbacks: {
            label: c => {
              const tot = c.dataset.data.reduce((a, b) => a + b, 0);
              return ` ${c.label}: ${c.parsed.toLocaleString()} (${((c.parsed / tot) * 100).toFixed(1)}%)`;
            },
          },
        },
      },
    },
  };

  const totalEvents = data
    ? (data.totalEvents ?? data.counts.reduce((s, d) => s + (d.total || 0), 0))
    : liveEvents.length;

  return (
    <div className="analytics-view">
      <div className="analytics-wrapper">
        <div className="analytics-header">
          <h1 className="analytics-title">Disaster Analytics Dashboard</h1>
          <p className="analytics-subtitle">
            Aggregated insights from{' '}
            <strong>{loading ? '…' : totalEvents.toLocaleString()}</strong> monitored events worldwide
            {error && <span className="analytics-fallback-note"> (live cache)</span>}
          </p>
        </div>

        {loading ? (
          <div className="analytics-loading">Loading analytics from PostgreSQL…</div>
        ) : (
          <>
            <div className="chart-grid">
              <ChartCard title="Event Count by Type" tag="Bar">
                <Bar
                  data={data ? buildCountData(data.counts) : buildCountData(
                    TYPES.map(t => ({ event_type: t, total: liveEvents.filter(e => e.event_type === t).length }))
                  )}
                  options={countOpts}
                />
              </ChartCard>

              <ChartCard title="Severity Distribution" tag="Stacked Bar">
                <Bar data={buildSeverityData(liveEvents)} options={severityOpts} />
              </ChartCard>

              <ChartCard title="Monthly Event Trend" tag="Line">
                <Line
                  data={data ? buildMonthlyData(data.monthlyByType) : buildMonthlyFromEvents(liveEvents)}
                  options={monthlyOpts}
                />
              </ChartCard>

              <ChartCard title="Geographic Distribution" tag="Doughnut" doughnut>
                <Doughnut
                  data={data ? buildGeoData(data.locations) : buildGeoFromEvents(liveEvents)}
                  options={geoOpts}
                />
              </ChartCard>
            </div>

            {data ? (
              <StatCards counts={data.counts} locations={data.locations} liveEvents={liveEvents} />
            ) : (
              <StatCardsFallback liveEvents={liveEvents} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, tag, doughnut, children }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <span className="chart-card-title">{title}</span>
        <span className="chart-card-tag">{tag}</span>
      </div>
      <div className={`chart-card-body${doughnut ? ' chart-card-body--doughnut' : ''}`}>
        {children}
      </div>
    </div>
  );
}
