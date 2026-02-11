
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Registro minimalista y seguro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usamos ruta relativa pura para máxima compatibilidad
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('SW activo:', reg.scope))
      .catch(err => console.warn('SW no registrado (modo desarrollo o error):', err));
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
