import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initOneSignal } from './services/oneSignalService';

// Init OneSignal before app
// Wrapped in try-catch so it never blocks render
try {
  initOneSignal();
} catch (err) {
  console.warn('OneSignal init failed:', err);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);