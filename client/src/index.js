import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { registerServiceWorker, trackWebVitals, inlineCriticalCSS } from './utils/performance';

// Inline critical CSS for faster initial render
inlineCriticalCSS();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for offline functionality and caching
registerServiceWorker();

// Track Web Vitals for performance monitoring
trackWebVitals();
