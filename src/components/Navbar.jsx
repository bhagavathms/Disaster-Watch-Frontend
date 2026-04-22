import { useEffect, useRef } from 'react';

const STATE_LABELS = {
  connecting: 'Connecting…',
  live:       'Live',
  error:      'Reconnecting…',
  offline:    'API Offline',
};

export default function Navbar({ view, onSwitch, connState, flashCount }) {
  const badgeRef = useRef(null);

  // Brief green flash on each new live event
  useEffect(() => {
    if (!flashCount || !badgeRef.current) return;
    badgeRef.current.classList.add('conn-flash');
    const t = setTimeout(() => badgeRef.current?.classList.remove('conn-flash'), 600);
    return () => clearTimeout(t);
  }, [flashCount]);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">⚠</span>
        <span className="brand-title">DisasterWatch</span>
      </div>

      <div className="navbar-links">
        <button
          className={`nav-btn${view === 'map' ? ' active' : ''}`}
          onClick={() => onSwitch('map')}
        >
          <span className="nav-icon">🗺</span> Live Map
        </button>
        <button
          className={`nav-btn${view === 'query' ? ' active' : ''}`}
          onClick={() => onSwitch('query')}
        >
          <span className="nav-icon">🔍</span> Query
        </button>
      </div>

      <div className="navbar-right">
        <div ref={badgeRef} className={`conn-badge conn-${connState}`}>
          <span className="conn-dot" />
          <span className="conn-label">{STATE_LABELS[connState] || connState}</span>
        </div>
      </div>
    </nav>
  );
}
