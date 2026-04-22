import { capitalize, formatTimestamp, SEV_COLORS, SEV_PCT } from '../config';

export default function EventSidebar({ event: ev, onClose }) {
  const isOpen = !!ev;

  return (
    <aside className={`detail-sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-inner">
        <button className="sidebar-close" onClick={onClose}>✕</button>

        {ev && (
          <>
            {/* Info card */}
            <div className="sidebar-info-card">
              <InfoRow label="Event ID"    value={ev.event_id} />
              <InfoRow label="Source"      value={ev.source || '—'} />
              <InfoRow label="Timestamp"   value={formatTimestamp(ev.timestamp)} />
              <InfoRow label="Coordinates" value={`${(+ev.latitude).toFixed(4)}°, ${(+ev.longitude).toFixed(4)}°`} />
            </div>

            {/* Badges */}
            <div className="sidebar-badges">
              <span className="badge-type" data-type={ev.event_type}>{capitalize(ev.event_type)}</span>
              <span className="badge-severity" data-sev={ev.severity_level}>{capitalize(ev.severity_level)}</span>
            </div>

            {/* Severity bar */}
            <div className="sidebar-severity-bar">
              <div className="sev-label-row">
                <span className="sev-label">Severity Level</span>
                <span className="sev-value">{capitalize(ev.severity_level)}</span>
              </div>
              <div className="sev-track">
                <div
                  className="sev-fill"
                  style={{
                    width:      `${SEV_PCT[ev.severity_level] || 25}%`,
                    background: SEV_COLORS[ev.severity_level] || '#8ba3c0',
                  }}
                />
              </div>
            </div>

            {/* Extended fields */}
            <div className="sidebar-fields">
              {ev.processed_at && (
                <Group title="Processing Info">
                  <Field k="Processed At" v={formatTimestamp(ev.processed_at)} />
                </Group>
              )}
              <TypeFields ev={ev} />
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-key">{label}</span>
      <span className="info-val">{value}</span>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <>
      <div className="field-group-title">{title}</div>
      {children}
    </>
  );
}

function Field({ k, v }) {
  if (v == null || v === '') return null;
  return (
    <div className="field-row">
      <span className="field-key">{k}</span>
      <span className="field-val">{v}</span>
    </div>
  );
}

function TypeFields({ ev }) {
  if (ev.event_type === 'earthquake' && (ev.place || ev.depth_km != null)) {
    return (
      <Group title="Seismic Details">
        <Field k="Place"          v={ev.place} />
        <Field k="Depth"          v={ev.depth_km != null ? `${ev.depth_km} km` : null} />
        <Field k="Magnitude Type" v={ev.magnitude_type?.toUpperCase()} />
        <Field k="MMI"            v={ev.mmi} />
        <Field k="Felt Reports"   v={ev.felt_count?.toLocaleString()} />
      </Group>
    );
  }
  if (ev.event_type === 'fire' && (ev.total_frp_mw != null || ev.area_km2 != null)) {
    return (
      <Group title="Fire Radiative Power">
        <Field k="Total FRP"   v={ev.total_frp_mw != null ? `${ev.total_frp_mw} MW`               : null} />
        <Field k="Area Burned" v={ev.area_km2     != null ? `${ev.area_km2.toLocaleString()} km²`  : null} />
        <Field k="Satellite"   v={ev.satellite} />
      </Group>
    );
  }
  if (ev.event_type === 'flood' && (ev.fmi != null || ev.area_km2 != null)) {
    return (
      <Group title="Flood Metrics">
        <Field k="FMI Index"    v={ev.fmi?.toFixed(1)} />
        <Field k="Flooded Area" v={ev.area_km2 != null ? `${ev.area_km2.toLocaleString()} km²` : null} />
        <Field k="Country"      v={ev.country} />
      </Group>
    );
  }
  if (ev.event_type === 'storm' && (ev.wind_kmh != null || ev.pressure_hpa != null)) {
    return (
      <Group title="Meteorological Data">
        <Field k="Wind Speed" v={ev.wind_kmh     != null ? `${ev.wind_kmh} km/h`     : null} />
        <Field k="Pressure"   v={ev.pressure_hpa != null ? `${ev.pressure_hpa} hPa`  : null} />
        <Field k="Humidity"   v={ev.humidity_pct != null ? `${ev.humidity_pct}%`     : null} />
      </Group>
    );
  }
  return (
    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0', fontSize: '13px' }}>
      No extended data available
    </div>
  );
}
