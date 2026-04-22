import { useState } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import QueryView from './components/QueryView';
import { useLiveEvents } from './hooks/useLiveEvents';

export default function App() {
  const [view, setView] = useState('map');
  const { recentEvents, connState, flashCount } = useLiveEvents();

  return (
    <>
      <Navbar
        view={view}
        onSwitch={setView}
        connState={connState}
        flashCount={flashCount}
      />

      {/* Keep both mounted so the map doesn't re-initialize on tab switch */}
      <div style={{ display: view === 'map' ? 'block' : 'none' }} className="view">
        <MapView />
      </div>

      {view === 'query' && (
        <div className="view query-scroll">
          <QueryView />
        </div>
      )}
    </>
  );
}
