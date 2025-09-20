import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Import Leaflet setup to initialize it
import './lib/leaflet-setup';

// Add comprehensive error handling for debugging
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error, e.filename, e.lineno, e.colno);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault(); // Prevent the default browser behavior
});

// Add console log to verify the app is loading
console.log('MetroBusiness app starting...');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);