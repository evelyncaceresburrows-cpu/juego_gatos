import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Auditoría §3.8 — PWA real con service worker.
// Solo en producción (en dev el HMR de Vite no se lleva bien con SW
// agresivo). Registro silencioso: si falla, la app sigue funcionando
// normal, solo no hay cache offline.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* no-op — sin SW seguimos online-only */
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
