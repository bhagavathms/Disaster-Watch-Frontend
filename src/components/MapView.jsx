import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import {
  API_BASE, TYPE_COLORS, SEV_RADIUS, SEV_ORDER, capitalize, normSev,
  FETCH_DEBOUNCE_MS, MAP_BOUNDS_PAD, CLUSTER_MAX_RADIUS,
  MAP_INITIAL_ZOOM, MAP_MIN_ZOOM, MAP_MAX_ZOOM, MAP_TILE_MAX_ZOOM,
  ZOOM_CONTINENT_MAX, ZOOM_COUNTRY_MAX
} from '../config';
import FilterPanel from './FilterPanel';
import EventSidebar from './EventSidebar';

const DEFAULT_FILTERS = {
  types:     { earthquake: true, fire: true, flood: true, storm: true },
  severity:  'all',
  dateStart: '',
  dateEnd:   '',
};

// Shared state between GeoHoverLayer and MapDataLayer for ultra-fast filtering
const HoverContext = {
  bounds: null,
  updateMarkers: null,
  currentClusters: []
};

// ── Historical Data Layer ───────────────────────────────────────────────────
const MapDataLayer = memo(function MapDataLayer({ filters, onSelect, onCountChange }) {
  const map         = useMap();
  const mcgRef      = useRef(null);
  const modeRef     = useRef(null);
  const timerRef    = useRef(null);
  const fetchSeqRef = useRef(0);
  const filtersRef  = useRef(filters);
  const onSelectRef = useRef(onSelect);
  const onCountRef  = useRef(onCountChange);
  filtersRef.current  = filters;
  onSelectRef.current = onSelect;
  onCountRef.current  = onCountChange;

  const getLayerGroup = useCallback((targetMode) => {
    if (mcgRef.current && modeRef.current === targetMode) {
      return mcgRef.current;
    }
    if (mcgRef.current) {
      map.removeLayer(mcgRef.current);
    }
    modeRef.current = targetMode;
    if (targetMode === 'clustered') {
      mcgRef.current = L.layerGroup();
    } else {
      mcgRef.current = L.markerClusterGroup({
        chunkedLoading:      false,
        maxClusterRadius:    CLUSTER_MAX_RADIUS,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom:   true,
      });
    }
    map.addLayer(mcgRef.current);
    return mcgRef.current;
  }, [map]);

  const doFetch = useCallback(() => {
    const zoom = Math.round(map.getZoom());
    const seq = ++fetchSeqRef.current;
    const bounds = map.getBounds();
    const f = filtersRef.current;
    // At high zoom, fetch only what's visible — large padding wastes resources and causes lag
    const pad = zoom >= 10 ? 0.05 : zoom >= 7 ? 0.15 : MAP_BOUNDS_PAD;
    const latPad = (bounds.getNorth() - bounds.getSouth()) * pad;
    const lngPad = (bounds.getEast()  - bounds.getWest())  * pad;

    const qs = new URLSearchParams({
      min_lat: Math.max(-90,  bounds.getSouth() - latPad).toFixed(5),
      max_lat: Math.min( 90,  bounds.getNorth() + latPad).toFixed(5),
      min_lon: Math.max(-180, bounds.getWest()  - lngPad).toFixed(5),
      max_lon: Math.min( 180, bounds.getEast()  + lngPad).toFixed(5),
      zoom,
    });
    if (f.dateStart) qs.set('start_date', f.dateStart);
    if (f.dateEnd)   qs.set('end_date',   f.dateEnd);

    fetch(`${API_BASE}/events/map?${qs}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(resp => {
        if (seq !== fetchSeqRef.current) return;
        if (!map) return;

        const mcg = getLayerGroup(resp.mode);
        mcg.clearLayers();

        const markers = [];
        let shown = 0;

        if (resp.mode === 'clustered') {
          HoverContext.currentClusters = resp.data || [];
          (resp.data || []).forEach(c => {
            const ev_type = (c.event_type || '').toLowerCase();
            if (!f.types[ev_type]) return;
            shown += c.count;
            const color = TYPE_COLORS[ev_type] || '#fff';
            // Size bubble by log of count
            const size = Math.max(20, Math.min(70, 15 + Math.log2(c.count) * 4));
            const r = size / 2;

            markers.push(
              L.marker([c.lat, c.lng], {
                icon: L.divIcon({
                  className: 'cluster-bubble',
                  html: `<div style="background:${color}dd;width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:11px;border:1px solid #ffffff44;box-shadow:0 0 10px ${color}88;">${c.count > 999 ? (c.count/1000).toFixed(1)+'k' : c.count}</div>`,
                  iconSize: [size, size],
                  iconAnchor: [r, r],
                })
              })
            );
          });
        } else {
          HoverContext.currentClusters = [];
          (resp.data || []).forEach(raw => {
            const ev = {
              ...raw,
              event_type:     (raw.event_type || '').toLowerCase(),
              severity_level: normSev(raw.severity_level),
              latitude:       parseFloat(raw.latitude),
              longitude:      parseFloat(raw.longitude),
            };
            if (!f.types[ev.event_type]) return;
            if (f.severity !== 'all') {
              if (f.severity === 'extreme' && ev.severity_level !== 'extreme') return;
              if (f.severity !== 'extreme' && SEV_ORDER[ev.severity_level] < SEV_ORDER[f.severity]) return;
            }
            shown++;
            const color = TYPE_COLORS[ev.event_type] || '#fff';
            const r = SEV_RADIUS[ev.severity_level] || 4;
            const d = r * 2;

            markers.push(
              L.marker([ev.latitude, ev.longitude], {
                icon: L.divIcon({
                  className: '',
                  html: `<span style="display:block;width:${d}px;height:${d}px;border-radius:50%;background:${color};box-shadow:0 0 4px ${color}88;"></span>`,
                  iconSize: [d, d],
                  iconAnchor: [r, r],
                })
              })
                .bindTooltip(`<b style="color:${color}">${capitalize(ev.event_type)}</b><br/>${capitalize(ev.severity_level)} severity`, { direction: 'top' })
                .on('click', () => onSelectRef.current(ev))
            );
          });
        }

        if (mcg.addLayers) {
          mcg.addLayers(markers);
        } else {
          markers.forEach(m => mcg.addLayer(m));
        }

        // Visibility is zoom-only: hidden at continent/country zoom, always shown when zoomed in.
        // Hover only controls the floating stats tooltip — never marker visibility.
        HoverContext.updateMarkers = () => {
          const show = Math.round(map.getZoom()) >= 9;
          markers.forEach(m => {
            if (m._icon) {
              m._icon.style.opacity         = show ? '1' : '0';
              m._icon.style.pointerEvents   = show ? 'auto' : 'none';
              m._icon.style.transition      = 'opacity 0.2s ease-in-out';
            }
            if (m._shadow) m._shadow.style.opacity = show ? '1' : '0';
          });
        };
        HoverContext.updateMarkers();
        onCountRef.current(resp.total_count ?? shown);
      })
      .catch(err => console.error('/events/map failed:', err));
  }, [map, getLayerGroup]);

  const scheduleFetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doFetch, FETCH_DEBOUNCE_MS);
  }, [doFetch]);

  useMapEvents({ moveend: scheduleFetch, zoomend: scheduleFetch });

  useEffect(() => {
    doFetch();
    return () => {
      if (mcgRef.current) { map.removeLayer(mcgRef.current); mcgRef.current = null; }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [map, doFetch]);

  useEffect(() => { doFetch(); }, [filters, doFetch]);

  return null;
});

// ── Hover Layer (GeoJSON) ────────────────────────────────────────────────────
const GeoHoverLayer = memo(function GeoHoverLayer() {
  const map = useMap();
  const [countries, setCountries] = useState(null);
  const [zoom, setZoom] = useState(() => Math.round(map.getZoom()));
  const geoLayerRef = useRef(null);
  const activeLayersRef = useRef([]);

  useEffect(() => {
    fetch('/geo/countries.geojson')
      .then(r => r.json())
      .then(setCountries)
      .catch(e => console.error("Countries GeoJSON not found:", e));
  }, []);

  useMapEvents({
    zoomend: () => {
      setZoom(Math.round(map.getZoom()));
      if (HoverContext.updateMarkers) HoverContext.updateMarkers();
    }
  });

  const onEachFeature = useCallback((feature, layer) => {
    layer.on({
      mouseover: (e) => {
        const z = Math.round(map.getZoom());
        let layersToHighlight = [layer];

        if (z <= ZOOM_CONTINENT_MAX) {
          let cont = feature.properties.continent;
          if (feature.properties.name === 'Russia') cont = 'Asia'; // User requested Russia shouldn't be in Europe
          if (cont && geoLayerRef.current) {
            layersToHighlight = [];
            geoLayerRef.current.eachLayer(l => {
              let lCont = l.feature.properties.continent;
              if (l.feature.properties.name === 'Russia') lCont = 'Asia';
              if (lCont === cont) {
                layersToHighlight.push(l);
              }
            });
          }
        }

        const combinedBounds = L.latLngBounds();
        layersToHighlight.forEach(l => {
          l.setStyle({ weight: 2, color: '#fff', fillOpacity: 0.1 });
          combinedBounds.extend(l.getBounds());
        });

        HoverContext.bounds = combinedBounds;
        if (HoverContext.updateMarkers) HoverContext.updateMarkers();
        activeLayersRef.current = layersToHighlight;

        // Calculate and show floating stats box
        let total = 0;
        const typeCounts = {};
        HoverContext.currentClusters.forEach(c => {
           if (combinedBounds.contains([c.lat, c.lng])) {
              total += c.count;
              const evType = (c.event_type || '').toLowerCase();
              typeCounts[evType] = (typeCounts[evType] || 0) + c.count;
           }
        });

        const regionName = z <= ZOOM_CONTINENT_MAX ? (feature.properties.continent || 'Unknown Region') : feature.properties.name;
        
        let statsHtml = `<div style="padding:4px;font-family:sans-serif;color:#fff;background:#1e293b;border-radius:6px;min-width:140px;">
           <div style="font-weight:bold;border-bottom:1px solid #475569;margin-bottom:6px;padding-bottom:6px;font-size:14px;">${regionName}</div>
           <div style="font-size:13px;margin-bottom:6px;">Total Events: <b>${total.toLocaleString()}</b></div>
        `;
        if (total > 0) {
           statsHtml += `<div style="display:flex; flex-direction:column; gap: 4px; font-size:12px;">`;
           Object.keys(typeCounts).forEach(t => {
               statsHtml += `<div style="display:flex;justify-content:space-between;"><span><span style="color:${TYPE_COLORS[t]}">●</span> ${capitalize(t)}</span> <b>${typeCounts[t].toLocaleString()}</b></div>`;
           });
           statsHtml += `</div>`;
        }
        statsHtml += `</div>`;

        layer.bindTooltip(statsHtml, { 
          sticky: true, 
          className: 'custom-geo-tooltip',
          direction: 'top',
          offset: [0, -10]
        }).openTooltip(e.latlng);
      },
      mouseout: () => {
        layer.unbindTooltip();
        activeLayersRef.current.forEach(l => {
          l.setStyle({ weight: 1, color: '#444', fillOpacity: 0 });
        });
        activeLayersRef.current = [];
        HoverContext.bounds = null;
        if (HoverContext.updateMarkers) HoverContext.updateMarkers();
      }
    });
  }, [map]);

  if (zoom > ZOOM_COUNTRY_MAX || !countries) return null;

  return (
    <GeoJSON 
      key="geo-hover"
      ref={geoLayerRef}
      data={countries} 
      style={{ weight: 1, color: '#444', fillOpacity: 0 }} 
      onEachFeature={onEachFeature} 
    />
  );
});

// ── Live data layer ──────────────────────────────────────────────────────────
const LiveDataLayer = memo(function LiveDataLayer({ onSelect }) {
  const map         = useMap();
  const layerRef    = useRef(null);
  const esRef       = useRef(null);
  const seenRef     = useRef(new Set());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    layerRef.current = L.layerGroup().addTo(map);

    function addMarker(raw) {
      const ev = {
        ...raw,
        event_type:     (raw.event_type || '').toLowerCase(),
        severity_level: normSev(raw.severity_level),
        latitude:       parseFloat(raw.latitude),
        longitude:      parseFloat(raw.longitude),
      };
      const id = ev.event_id || `${ev.latitude}_${ev.longitude}_${ev.timestamp}`;
      if (seenRef.current.has(id) || isNaN(ev.latitude) || isNaN(ev.longitude)) return;
      seenRef.current.add(id);

      const color = TYPE_COLORS[ev.event_type] || '#fff';
      const r     = SEV_RADIUS[ev.severity_level] || 4;
      const d     = r * 2;

      L.marker([ev.latitude, ev.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<span class="live-dot" style="width:${d}px;height:${d}px;background:${color};box-shadow:0 0 8px ${color};"></span>`,
          iconSize:   [d, d],
          iconAnchor: [r, r],
        }),
        zIndexOffset: 500,
      })
        .bindTooltip(
          `<b style="color:${color}">${capitalize(ev.event_type)}</b> <span style="color:#22c55e;font-size:10px">● LIVE</span><br/>${capitalize(ev.severity_level)} severity`,
          { direction: 'top', opacity: 0.95 }
        )
        .on('click', () => onSelectRef.current(ev))
        .addTo(layerRef.current);
    }

    fetch(`${API_BASE}/live/snapshot`)
      .then(r => r.json())
      .then(body => (body.events || []).forEach(addMarker))
      .catch(err => console.error('[live] snapshot failed:', err));

    const es = new EventSource(`${API_BASE}/live/stream`);
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const frame = JSON.parse(e.data);
        if (frame.type === 'event' && frame.data) addMarker(frame.data);
      } catch {}
    };

    return () => {
      if (esRef.current)   { esRef.current.close();          esRef.current   = null; }
      if (layerRef.current){ map.removeLayer(layerRef.current); layerRef.current = null; }
      seenRef.current.clear();
    };
  }, [map]);

  return null;
});

// ── MapView ───────────────────────────────────────────────────────────────────
export default function MapView() {
  const [filters, setFilters]             = useState(DEFAULT_FILTERS);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const [isLive, setIsLive]               = useState(false);

  return (
    <div className="map-view">
      {!isLive && <FilterPanel filters={filters} onChange={setFilters} eventCount={filteredCount} />}

      <MapContainer center={[20, 0]} zoom={MAP_INITIAL_ZOOM} minZoom={MAP_MIN_ZOOM} maxZoom={MAP_MAX_ZOOM} worldCopyJump className="map-container">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={MAP_TILE_MAX_ZOOM}
        />
        {isLive ? (
          <LiveDataLayer onSelect={setSelectedEvent} />
        ) : (
          <>
            <GeoHoverLayer />
            <MapDataLayer filters={filters} onSelect={setSelectedEvent} onCountChange={setFilteredCount} />
          </>
        )}
      </MapContainer>

      <div className="live-toggle-wrap">
        <button
          className={`live-toggle-btn${isLive ? ' live-toggle-btn--live' : ''}`}
          onClick={() => { setIsLive(!isLive); setSelectedEvent(null); }}
        >
          <span className={`live-toggle-indicator${isLive ? ' pulsing' : ''}`} />
          {isLive ? 'Live Feed' : 'Historical'}
        </button>
      </div>

      <EventSidebar event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
