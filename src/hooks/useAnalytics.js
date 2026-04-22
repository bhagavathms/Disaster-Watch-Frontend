import { useState, useEffect } from 'react';
import { API_BASE, TYPES } from '../config';

export function useAnalytics() {
  const [data, setData]       = useState(null);  // { counts, locations, monthlyByType, totalEvents }
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [countsRaw, locationsRaw, ...monthlyRaw] = await Promise.all([
          fetch(`${API_BASE}/analytics/event-counts`).then(r => r.json()),
          fetch(`${API_BASE}/analytics/locations/top?limit=30`).then(r => r.json()),
          ...TYPES.map(t =>
            fetch(`${API_BASE}/analytics/monthly-trends?event_type=${t}`).then(r => r.json())
          ),
        ]);

        // Normalize: all endpoints wrap results in { data: [...] } and use `count` not `total`
        const counts = (countsRaw.data || []).map(d => ({
          event_type: d.event_type,
          total:      d.count || d.total || 0,
        }));

        const locations = (locationsRaw.data || []).map(d => ({
          country: d.country,
          region:  d.region,
          total:   d.count || d.total || 0,
        }));

        const monthlyByType = monthlyRaw.map(raw =>
          (raw.data || []).map(d => ({
            year:  d.year,
            month: d.month,
            total: d.count || d.total || 0,
          }))
        );

        // total_events is provided directly in event-counts response
        const totalEvents = countsRaw.total_events
          ?? counts.reduce((s, d) => s + d.total, 0);

        if (!cancelled) {
          setData({ counts, locations, monthlyByType, totalEvents });
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
