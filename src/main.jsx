import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Filler, Title, Tooltip, Legend,
} from 'chart.js';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './styles/main.css';
import App from './App';

// Register all Chart.js components used across the app
ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Filler, Title, Tooltip, Legend,
);

// Dark theme defaults for all charts
ChartJS.defaults.color                              = '#8ba3c0';
ChartJS.defaults.borderColor                       = '#2a3f58';
ChartJS.defaults.font.family                       = "'Inter', system-ui, sans-serif";
ChartJS.defaults.font.size                         = 12;
ChartJS.defaults.plugins.legend.labels.color       = '#8ba3c0';
ChartJS.defaults.plugins.legend.labels.padding     = 16;
ChartJS.defaults.plugins.tooltip.backgroundColor   = 'rgba(22,32,50,0.97)';
ChartJS.defaults.plugins.tooltip.titleColor        = '#e8f0fe';
ChartJS.defaults.plugins.tooltip.bodyColor         = '#8ba3c0';
ChartJS.defaults.plugins.tooltip.borderColor       = '#2a3f58';
ChartJS.defaults.plugins.tooltip.borderWidth       = 1;
ChartJS.defaults.plugins.tooltip.padding           = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius      = 8;
ChartJS.defaults.scale.grid.color                  = 'rgba(42,63,88,0.6)';
ChartJS.defaults.scale.ticks.color                 = '#546a84';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
