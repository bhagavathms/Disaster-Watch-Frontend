import { useState } from 'react';
import { TYPE_COLORS } from '../config';
import { useSimulation } from '../hooks/useSimulation';

export default function FilterPanel({ filters, onChange, eventCount }) {
  const [collapsed, setCollapsed]     = useState(false);
  const [simDelay, setSimDelay]       = useState('0.5');
  const [pendingStart, setPendingStart] = useState(filters.dateStart);
  const [pendingEnd,   setPendingEnd]   = useState(filters.dateEnd);
  const sim = useSimulation();

  function setType(type, checked) {
    onChange(prev => ({ ...prev, types: { ...prev.types, [type]: checked } }));
  }

  function applyDates() {
    onChange(prev => ({ ...prev, dateStart: pendingStart, dateEnd: pendingEnd }));
  }

  function reset() {
    setPendingStart('');
    setPendingEnd('');
    onChange({
      types: { earthquake: true, fire: true, flood: true, storm: true },
      severity: 'all',
      dateStart: '',
      dateEnd:   '',
    });
  }

  return (
    <div className={`filter-panel${collapsed ? ' collapsed' : ''}`}>
      <div className="filter-panel-header">
        <span className="filter-title">Filters</span>
        <button
          className="filter-toggle-btn"
          title={collapsed ? 'Expand filters' : 'Collapse filters'}
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? '‹' : '›'}
        </button>
      </div>

      <div className="filter-body">
        {/* Disaster type checkboxes */}
        <div className="filter-section">
          <div className="filter-label">Disaster Type</div>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <label key={type} className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.types[type]}
                onChange={e => setType(type, e.target.checked)}
              />
              <span className="chk-dot" style={{ background: color }} />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>

        {/* Severity */}
        <div className="filter-section">
          <div className="filter-label">Minimum Severity</div>
          <select
            className="filter-select"
            value={filters.severity}
            onChange={e => onChange(prev => ({ ...prev, severity: e.target.value }))}
          >
            <option value="all">All Levels</option>
            <option value="low">Low+</option>
            <option value="moderate">Moderate+</option>
            <option value="high">High+</option>
            <option value="extreme">Extreme Only</option>
          </select>
        </div>

        {/* Date range */}
        <div className="filter-section">
          <div className="filter-label">Date Range</div>
          <div className="date-inputs">
            <input
              type="date"
              className="filter-date"
              value={pendingStart}
              onChange={e => setPendingStart(e.target.value)}
            />
            <input
              type="date"
              className="filter-date"
              value={pendingEnd}
              onChange={e => setPendingEnd(e.target.value)}
            />
          </div>
          <button className="apply-dates-btn" onClick={applyDates}>Apply</button>
        </div>

        <button className="reset-btn" onClick={reset}>↺ Reset Filters</button>

        <div className="filter-section filter-count-row">
          <span className="filter-count-label">Showing</span>
          <span className="filter-count">{eventCount} event{eventCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Simulation controls */}
        <div className="filter-section sim-section">
          <div className="filter-label">Live Feed Simulation</div>
          <div className="sim-delay-row">
            <label className="sim-delay-label">Delay (s)</label>
            <input
              type="number"
              className="sim-delay-input"
              value={simDelay}
              min="0.1" max="10" step="0.1"
              onChange={e => setSimDelay(e.target.value)}
            />
          </div>
          <div className="sim-btn-row">
            <button className="sim-btn sim-btn--start" onClick={() => sim.start(parseFloat(simDelay) || 0.5)}>
              ▶ Start
            </button>
            <button className="sim-btn sim-btn--stop" onClick={sim.stop}>
              ⏹ Stop
            </button>
          </div>
          <div className={`sim-status${sim.running ? ' sim-running' : ''}`}>
            {sim.statusMsg}
          </div>
        </div>
      </div>
    </div>
  );
}
