import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  API_BASE, TYPE_COLORS, SEV_COLORS, SEV_ORDER, capitalize, formatTimestamp, getRegion,
  normSev, SEV_TO_DB, QUERY_PAGE_SIZE as PAGE_SIZE, ANALYTICS_SAMPLE_LIMIT, LOCATION_PROXIMITY_KM,
} from '../config';
import { COUNTRIES } from '../countries';

const DEFAULT_Q = {
  types:    { earthquake: true, fire: true, flood: true, storm: true },
  severity: 'all',
  country:  '',
  lat:      '',
  lng:      '',
  dateStart:'',
  dateEnd:  '',
  groupBy:  'month',
};

// ─── Analytics helpers ────────────────────────────────────────────────────────

function computeSummary(events) {
  const byType     = { earthquake: 0, fire: 0, flood: 0, storm: 0 };
  const bySev      = { low: 0, moderate: 0, high: 0, extreme: 0 };
  const byContinent = {};

  events.forEach(ev => {
    byType[ev.event_type] = (byType[ev.event_type] || 0) + 1;
    bySev[ev.severity_level] = (bySev[ev.severity_level] || 0) + 1;
    const region = getRegion(ev.latitude, ev.longitude);
    if (!byContinent[region]) byContinent[region] = { count: 0, sevSum: 0 };
    byContinent[region].count++;
    byContinent[region].sevSum += SEV_ORDER[ev.severity_level] || 0;
  });

  return { byType, bySev, byContinent, total: events.length };
}

function computeGrouped(events, groupBy) {
  const counts = {};
  events.forEach(ev => {
    const d = new Date(ev.timestamp);
    if (isNaN(d)) return;
    const key = groupBy === 'year'
      ? String(d.getFullYear())
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  const labels = Object.keys(counts).sort();
  return { labels, data: labels.map(l => counts[l]) };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCards({ summary }) {
  const sevScore = summary.total
    ? (Object.entries(summary.bySev).reduce((acc, [k, n]) => acc + SEV_ORDER[k] * n, 0) / summary.total).toFixed(2)
    : '—';

  return (
    <div className="qsum-cards">
      <div className="qsum-card qsum-total">
        <div className="qsum-val">{summary.total.toLocaleString()}</div>
        <div className="qsum-label">Total Events</div>
      </div>
      {Object.entries(summary.byType).map(([type, count]) => (
        <div key={type} className="qsum-card" style={{ borderColor: TYPE_COLORS[type] }}>
          <div className="qsum-val" style={{ color: TYPE_COLORS[type] }}>{count.toLocaleString()}</div>
          <div className="qsum-label">{capitalize(type)}</div>
        </div>
      ))}
      <div className="qsum-card">
        <div className="qsum-val">{sevScore}</div>
        <div className="qsum-label">Avg Severity<span className="qsum-sublabel"> (0–3)</span></div>
      </div>
    </div>
  );
}

function SevBar({ bySev, total }) {
  return (
    <div className="qsev-bar-wrap">
      <div className="qsev-title">Severity Distribution</div>
      <div className="qsev-track">
        {['low','moderate','high','extreme'].map(s => {
          const pct = total ? (bySev[s] || 0) / total * 100 : 0;
          return pct > 0 ? (
            <div
              key={s}
              className="qsev-seg"
              style={{ width: `${pct}%`, background: SEV_COLORS[s] }}
              title={`${capitalize(s)}: ${(bySev[s]||0).toLocaleString()} (${pct.toFixed(1)}%)`}
            />
          ) : null;
        })}
      </div>
      <div className="qsev-legend">
        {['low','moderate','high','extreme'].map(s => (
          <span key={s} className="qsev-leg-item">
            <span className="qsev-dot" style={{ background: SEV_COLORS[s] }} />
            {capitalize(s)}: {(bySev[s]||0).toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}

function GroupChart({ groupedData, groupBy }) {
  const { labels, data } = groupedData;

  if (!labels.length) return null;

  const chartData = {
    labels,
    datasets: [{
      label: 'Events',
      data,
      backgroundColor: 'rgba(59,130,246,0.55)',
      borderColor: '#3b82f6',
      borderWidth: 1,
      borderRadius: 3,
    }],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toLocaleString()} events` } } },
    scales: {
      x: { ticks: { maxTicksLimit: 20, maxRotation: 45 } },
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="qchart-wrap">
      <div className="qchart-title">Events by {groupBy === 'year' ? 'Year' : 'Month'}</div>
      <div className="qchart-inner">
        <Bar data={chartData} options={opts} />
      </div>
    </div>
  );
}

function ContinentTable({ byContinent }) {
  const rows = Object.entries(byContinent)
    .map(([region, { count, sevSum }]) => ({ region, count, avgSev: count ? (sevSum / count).toFixed(2) : '—' }))
    .sort((a, b) => b.count - a.count);

  if (!rows.length) return null;

  return (
    <div className="qcont-wrap">
      <div className="qcont-title">By Region / Continent</div>
      <table className="qcont-table">
        <thead>
          <tr><th>Region</th><th>Events</th><th>Avg Severity</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.region}>
              <td>{r.region}</td>
              <td>{r.count.toLocaleString()}</td>
              <td>{r.avgSev}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventCard({ ev, expanded, onToggle }) {
  const color = TYPE_COLORS[ev.event_type] || '#fff';
  const sevColor = SEV_COLORS[ev.severity_level] || '#8ba3c0';

  return (
    <div className={`qev-card${expanded ? ' expanded' : ''}`} onClick={onToggle}>
      <div className="qev-row">
        <span className="qev-type-dot" style={{ background: color }} />
        <span className="qev-type" style={{ color }}>{capitalize(ev.event_type)}</span>
        <span className="qev-loc">
          {ev.country || `${(+ev.latitude).toFixed(2)}°, ${(+ev.longitude).toFixed(2)}°`}
        </span>
        <span className="qev-time">{ev.timestamp ? new Date(ev.timestamp).toLocaleDateString() : '—'}</span>
        <span className="qev-sev" style={{ color: sevColor }}>{capitalize(ev.severity_level)}</span>
        <span className="qev-chevron">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="qev-details">
          <div className="qev-detail-grid">
            <Detail label="Event ID"    value={ev.event_id} />
            <Detail label="Timestamp"   value={formatTimestamp(ev.timestamp)} />
            <Detail label="Coordinates" value={`${(+ev.latitude).toFixed(4)}°, ${(+ev.longitude).toFixed(4)}°`} />
            <Detail label="Source"      value={ev.source} />
            {ev.event_type === 'earthquake' && <>
              <Detail label="Place"     value={ev.place} />
              <Detail label="Depth"     value={ev.depth_km != null ? `${ev.depth_km} km` : null} />
              <Detail label="Mag Type"  value={ev.magnitude_type?.toUpperCase()} />
              <Detail label="MMI"       value={ev.mmi} />
            </>}
            {ev.event_type === 'fire' && <>
              <Detail label="Total FRP"    value={ev.total_frp_mw != null ? `${ev.total_frp_mw} MW` : null} />
              <Detail label="Area Burned"  value={ev.area_km2 != null ? `${ev.area_km2.toLocaleString()} km²` : null} />
              <Detail label="Satellite"    value={ev.satellite} />
            </>}
            {ev.event_type === 'flood' && <>
              <Detail label="FMI Index"    value={ev.fmi?.toFixed(1)} />
              <Detail label="Flooded Area" value={ev.area_km2 != null ? `${ev.area_km2.toLocaleString()} km²` : null} />
            </>}
            {ev.event_type === 'storm' && <>
              <Detail label="Wind Speed" value={ev.wind_kmh != null ? `${ev.wind_kmh} km/h` : null} />
              <Detail label="Pressure"   value={ev.pressure_hpa != null ? `${ev.pressure_hpa} hPa` : null} />
              <Detail label="Humidity"   value={ev.humidity_pct != null ? `${ev.humidity_pct}%` : null} />
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

function CountrySelect({ value, onChange }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const filtered = useMemo(() =>
    COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase())),
  [search]);

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function select(country) {
    onChange(country);
    setOpen(false);
    setSearch('');
  }

  function clear(e) { e.stopPropagation(); onChange(''); setSearch(''); }

  return (
    <div className="country-select" ref={ref}>
      <div className="country-input-wrap" onClick={() => setOpen(o => !o)}>
        <input
          className="qs-input country-search-input"
          placeholder="All countries"
          value={open ? search : value || ''}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(''); }}
        />
        {value && !open && (
          <button className="country-clear" onClick={clear}>✕</button>
        )}
        <span className="country-arrow">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="country-dropdown">
          {filtered.length === 0
            ? <div className="country-no-match">No match</div>
            : filtered.map(c => (
              <div
                key={c}
                className={`country-option${c === value ? ' selected' : ''}`}
                onMouseDown={() => select(c)}
              >{c}</div>
            ))
          }
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="qev-detail-row">
      <span className="qev-detail-key">{label}</span>
      <span className="qev-detail-val">{value}</span>
    </div>
  );
}

function QueryFilters({ query, setQuery, onSearch, loading }) {
  function setType(type, checked) {
    setQuery(q => ({ ...q, types: { ...q.types, [type]: checked } }));
  }

  return (
    <aside className="query-sidebar">
      <div className="qs-title">Query Filters</div>

      <div className="qs-section">
        <div className="qs-label">Disaster Type</div>
        {Object.keys(query.types).map(type => (
          <label key={type} className="filter-checkbox">
            <input type="checkbox" checked={query.types[type]} onChange={e => setType(type, e.target.checked)} />
            <span className="chk-dot" style={{ background: TYPE_COLORS[type] }} />
            {capitalize(type)}
          </label>
        ))}
      </div>

      <div className="qs-section">
        <div className="qs-label">Minimum Severity</div>
        <select className="filter-select" value={query.severity} onChange={e => setQuery(q => ({ ...q, severity: e.target.value }))}>
          <option value="all">All Levels</option>
          <option value="low">Low+</option>
          <option value="moderate">Moderate+</option>
          <option value="high">High+</option>
          <option value="extreme">Extreme Only</option>
        </select>
      </div>

      <div className="qs-section">
        <div className="qs-label">Country</div>
        <CountrySelect
          value={query.country}
          onChange={country => setQuery(q => ({ ...q, country }))}
        />
      </div>

      <div className="qs-section">
        <div className="qs-label">Location (lat / lng)</div>
        <div className="qs-latlon">
          <input className="qs-input" placeholder="Lat" value={query.lat} onChange={e => setQuery(q => ({ ...q, lat: e.target.value }))} />
          <input className="qs-input" placeholder="Lng" value={query.lng} onChange={e => setQuery(q => ({ ...q, lng: e.target.value }))} />
        </div>
      </div>

      <div className="qs-section">
        <div className="qs-label">Date Range</div>
        <input type="date" className="filter-date" value={query.dateStart} onChange={e => setQuery(q => ({ ...q, dateStart: e.target.value }))} />
        <input type="date" className="filter-date" style={{ marginTop: 6 }} value={query.dateEnd} onChange={e => setQuery(q => ({ ...q, dateEnd: e.target.value }))} />
      </div>

      <div className="qs-section">
        <div className="qs-label">Group By</div>
        <select className="filter-select" value={query.groupBy} onChange={e => setQuery(q => ({ ...q, groupBy: e.target.value }))}>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>

      <button className="qs-search-btn" onClick={onSearch} disabled={loading}>
        {loading ? 'Searching…' : 'Search'}
      </button>
    </aside>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

function buildQS(query) {
  const qs = new URLSearchParams();
  Object.entries(query.types).forEach(([t, on]) => { if (on) qs.append('type', t); });
  if (query.severity !== 'all') {
    qs.set('severity',       query.severity);
    qs.set('severity_level', SEV_TO_DB[query.severity]);
    qs.set('min_severity',   SEV_TO_DB[query.severity]);
  }
  if (query.country)            qs.set('country', query.country);
  if (query.lat && query.lng) {
    qs.set('lat', query.lat);
    qs.set('lng', query.lng);
    qs.set('proximity_km', String(LOCATION_PROXIMITY_KM));
  }
  if (query.dateStart) qs.set('start_date', query.dateStart);
  if (query.dateEnd)   qs.set('end_date',   query.dateEnd);
  return qs;
}

function applySeverityFilter(events, severity) {
  if (severity === 'all') return events;
  return events.filter(ev => SEV_ORDER[ev.severity_level] >= SEV_ORDER[severity]);
}

function normalizeEvents(raw) {
  return (raw || []).map(ev => ({
    ...ev,
    event_type:     (ev.event_type || '').toLowerCase(),
    severity_level: normSev(ev.severity_level),
    latitude:       parseFloat(ev.latitude),
    longitude:      parseFloat(ev.longitude),
    timestamp:      ev.event_time || ev.processed_at || ev.timestamp,
  }));
}

export default function QueryView() {
  const [query,      setQuery]      = useState(DEFAULT_Q);
  const [summary,    setSummary]    = useState(null);   // computed from analytics sample
  const [listTotal,  setListTotal]  = useState(0);      // accurate total from backend
  const [pageEvents, setPageEvents] = useState([]);     // current page of events
  const [pageIdx,    setPageIdx]    = useState(0);
  const [groupedData,setGroupedData]= useState(null);   // {labels, data} for chart
  const [loading,    setLoading]    = useState(false);
  const [pageLoading,setPageLoading]= useState(false);
  const [error,      setError]      = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const activeQueryRef = useRef(null);
  const totalPages = Math.ceil(listTotal / PAGE_SIZE);

  const fetchPage = useCallback(async (query, idx) => {
    const qs = buildQS(query);
    qs.set('limit', PAGE_SIZE);
    qs.set('offset', idx * PAGE_SIZE);
    const r    = await fetch(`${API_BASE}/events/search?${qs}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const body = await r.json();
    return {
      events: normalizeEvents(body.events ?? body.data ?? []),
      total:  body.total ?? 0,
    };
  }, []);

  const fetchAnalyticsSample = useCallback(async (query) => {
    // Fetch a fixed sample for client-side analytics (summary cards, chart, continent table)
    const qs = buildQS(query);
    qs.set('limit', String(ANALYTICS_SAMPLE_LIMIT));
    qs.set('offset', '0');
    const r    = await fetch(`${API_BASE}/events/search?${qs}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const body = await r.json();
    return normalizeEvents(body.events ?? body.data ?? []);
  }, []);

  const handleSearch = useCallback(async () => {
    const token = Symbol();
    activeQueryRef.current = token;

    setLoading(true);
    setError(null);
    setPageIdx(0);
    setExpandedId(null);
    setSummary(null);
    setGroupedData(null);

    try {
      const enabledTypes = Object.entries(query.types).filter(([, v]) => v).map(([k]) => k);

      // Build params shared by analytics endpoints
      const analyticsBase = new URLSearchParams();
      if (query.dateStart) analyticsBase.set('start_date', query.dateStart);
      if (query.dateEnd)   analyticsBase.set('end_date',   query.dateEnd);
      if (query.country)   analyticsBase.set('country',    query.country);

      // All four fetches in parallel:
      // 1) event-counts → accurate per-type totals
      // 2) monthly trends per enabled type → chart
      // 3) small sample → severity dist + continent table
      // 4) page 0 → event list
      const trendFetches = enabledTypes.map(t => {
        const tqs = new URLSearchParams(analyticsBase);
        tqs.set('event_type', t);
        return fetch(`${API_BASE}/analytics/monthly-trends?${tqs}`).then(r => r.json());
      });

      const [sample, page0, ...trendResults] = await Promise.all([
        fetchAnalyticsSample(query),
        fetchPage(query, 0),
        ...trendFetches,
      ]);
      if (activeQueryRef.current !== token) return;

      // page0.total is the authoritative count — it comes from the search endpoint
      // which correctly applies ALL filters (country, date, type, severity).
      const accurateTotal = page0.total;

      // Combine monthly trends across enabled types
      const combined = {};
      trendResults.forEach(res => {
        (res.data || []).forEach(d => {
          const key = query.groupBy === 'year'
            ? String(d.year)
            : `${d.year}-${String(d.month).padStart(2, '0')}`;
          combined[key] = (combined[key] || 0) + (d.count || d.total || 0);
        });
      });
      const trendLabels = Object.keys(combined).sort();
      const groupedFromTrends = trendLabels.length > 0
        ? { labels: trendLabels, data: trendLabels.map(l => combined[l]) }
        : null;

      // Scale all sample-derived counts (byType, bySev, byContinent) up to
      // the accurate total so every card is proportionally consistent.
      const filteredSample = applySeverityFilter(sample, query.severity);
      const filteredPage   = applySeverityFilter(page0.events, query.severity);
      const sampleSummary  = computeSummary(filteredSample);
      const scale = sampleSummary.total > 0 ? accurateTotal / sampleSummary.total : 1;

      const scaledByType = Object.fromEntries(
        Object.entries(sampleSummary.byType).map(([k, v]) => [k, Math.round(v * scale)])
      );
      const scaledBySev = Object.fromEntries(
        Object.entries(sampleSummary.bySev).map(([k, v]) => [k, Math.round(v * scale)])
      );
      const scaledByContinent = {};
      Object.entries(sampleSummary.byContinent).forEach(([region, { count, sevSum }]) => {
        scaledByContinent[region] = { count: Math.round(count * scale), sevSum: sevSum * scale };
      });

      setSummary({ byType: scaledByType, bySev: scaledBySev, byContinent: scaledByContinent, total: accurateTotal });
      setGroupedData(groupedFromTrends ?? computeGrouped(filteredSample, query.groupBy));
      setListTotal(accurateTotal);
      setPageEvents(filteredPage);
    } catch (e) {
      if (activeQueryRef.current !== token) return;
      setError(e.message);
    } finally {
      if (activeQueryRef.current === token) setLoading(false);
    }
  }, [query, fetchAnalyticsSample, fetchPage]);

  const goToPage = useCallback(async (idx) => {
    setPageLoading(true);
    setExpandedId(null);
    try {
      const q = activeQueryRef._query || query;
      const { events } = await fetchPage(q, idx);
      setPageEvents(applySeverityFilter(events, q.severity));
      setPageIdx(idx);
    } catch {
      // page fetch failed silently — keep current page
    } finally {
      setPageLoading(false);
    }
  }, [query, fetchPage]);

  // store last searched query so goToPage can use it even after query state changes
  useEffect(() => { activeQueryRef._query = query; }, [query]);

  const hasResults = summary !== null;

  return (
    <div className="query-view">
      <QueryFilters query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} />

      <div className="query-main">
        {!hasResults && !loading && !error && (
          <div className="query-placeholder">
            <div className="qph-icon">🔍</div>
            <div className="qph-text">Set filters and click Search to explore events</div>
          </div>
        )}

        {loading && (
          <div className="query-placeholder">
            <div className="qph-text">Searching…</div>
          </div>
        )}

        {error && <div className="query-error">Error: {error}</div>}

        {hasResults && !loading && <>
          <SummaryCards summary={{ ...summary, total: listTotal }} />

          <div className="qanalytics-row">
            <SevBar bySev={summary.bySev} total={summary.total} />
            <ContinentTable byContinent={summary.byContinent} />
          </div>

          {groupedData && <GroupChart groupedData={groupedData} groupBy={query.groupBy} />}

          <div className="qlist-header">
            <span className="qlist-title">
              {listTotal.toLocaleString()} events
              {listTotal > ANALYTICS_SAMPLE_LIMIT && summary.total <= ANALYTICS_SAMPLE_LIMIT && (
                <span className="qlist-cap"> · analytics based on first 2 000</span>
              )}
            </span>
            {totalPages > 1 && (
              <div className="qpager">
                <button disabled={pageIdx === 0 || pageLoading} onClick={() => goToPage(pageIdx - 1)}>‹</button>
                <span>{pageIdx + 1} / {totalPages}</span>
                <button disabled={pageIdx === totalPages - 1 || pageLoading} onClick={() => goToPage(pageIdx + 1)}>›</button>
              </div>
            )}
          </div>

          <div className={`qev-list${pageLoading ? ' qev-list--loading' : ''}`}>
            {pageEvents.map(ev => (
              <EventCard
                key={ev.event_id || `${ev.latitude}_${ev.longitude}_${ev.timestamp}`}
                ev={ev}
                expanded={expandedId === ev.event_id}
                onToggle={() => setExpandedId(id => id === ev.event_id ? null : ev.event_id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="qpager qpager--bottom">
              <button disabled={pageIdx === 0 || pageLoading} onClick={() => goToPage(pageIdx - 1)}>‹ Prev</button>
              <span>{pageIdx + 1} / {totalPages}</span>
              <button disabled={pageIdx === totalPages - 1 || pageLoading} onClick={() => goToPage(pageIdx + 1)}>Next ›</button>
            </div>
          )}
        </>}
      </div>
    </div>
  );
}
