import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// OneSignal completely removed
// Push notifications handled by native Web Push API
// via src/services/pushService.js

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);