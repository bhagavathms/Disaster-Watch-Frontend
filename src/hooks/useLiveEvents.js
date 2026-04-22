import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE, normalizeEvent, SSE_MAX_RECENT, SSE_FLUSH_MS, SSE_RETRY_MS } from '../config';

export function useLiveEvents() {
  const [recentEvents, setRecentEvents] = useState([]);
  const [connState, setConnState]       = useState('connecting');
  const [flashCount, setFlashCount]     = useState(0);

  const sseRef    = useRef(null);
  const retryRef  = useRef(null);
  const batchRef  = useRef([]);
  const timerRef  = useRef(null);

  const flush = useCallback(() => {
    timerRef.current = null;
    const batch = batchRef.current.splice(0);
    if (!batch.length) return;
    setRecentEvents(prev => {
      const next = [...prev, ...batch];
      return next.length > SSE_MAX_RECENT ? next.slice(-SSE_MAX_RECENT) : next;
    });
    setFlashCount(n => n + batch.length);
  }, []);

  const startSSE = useCallback(() => {
    if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null; }
    if (sseRef.current)   { sseRef.current.close();         sseRef.current   = null; }

    const es = new EventSource(`${API_BASE}/stream/events`);
    sseRef.current = es;

    es.onmessage = (e) => {
      if (sseRef.current !== es) return;
      try {
        const frame = JSON.parse(e.data);
        if (frame.type === 'connected') setConnState('live');
        if (frame.type === 'event' && frame.data) {
          batchRef.current.push(normalizeEvent(frame.data));
          if (!timerRef.current) timerRef.current = setTimeout(flush, SSE_FLUSH_MS);
        }
      } catch { /* ignore malformed frames */ }
    };

    es.onerror = () => {
      if (sseRef.current !== es) return;
      console.warn('SSE dropped — retrying in 5 s');
      setConnState('error');
      es.close();
      sseRef.current = null;
      retryRef.current = setTimeout(startSSE, SSE_RETRY_MS);
    };
  }, [flush]);

  useEffect(() => {
    startSSE();
    return () => {
      const es = sseRef.current;
      if (es) { sseRef.current = null; es.close(); }
      if (retryRef.current) clearTimeout(retryRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startSSE]);

  return { recentEvents, connState, flashCount };
}
