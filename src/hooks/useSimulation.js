import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

export function useSimulation() {
  const [running, setRunning] = useState(false);
  const [pid, setPid]         = useState(null);
  const [statusMsg, setStatusMsg] = useState('Checking…');

  async function check() {
    try {
      const d = await fetch(`${API_BASE}/stream/status`).then(r => r.json());
      setRunning(d.simulation_running);
      setPid(d.pid || null);
      setStatusMsg(d.simulation_running ? `Running (PID ${d.pid})` : 'Not running');
    } catch {
      setStatusMsg('Backend offline');
    }
  }

  async function start(delay = 0.5) {
    try {
      const d = await fetch(`${API_BASE}/stream/start?delay=${delay}`, { method: 'POST' }).then(r => r.json());
      setRunning(true);
      setPid(d.pid || null);
      setStatusMsg(`Running (PID ${d.pid})`);
    } catch {
      setStatusMsg('Failed to start');
    }
  }

  async function stop() {
    try {
      await fetch(`${API_BASE}/stream/stop`, { method: 'POST' });
      setRunning(false);
      setPid(null);
      setStatusMsg('Stopped');
    } catch {
      setStatusMsg('Failed to stop');
    }
  }

  useEffect(() => { check(); }, []);

  return { running, pid, statusMsg, start, stop };
}
