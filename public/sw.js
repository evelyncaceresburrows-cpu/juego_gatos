/* ADE service worker — auditoría §3.8 (PWA real).
 *
 * Estrategia minimalista (sin Workbox para evitar peso extra):
 *   - install: pre-cachea app shell (rutas críticas).
 *   - fetch:
 *       · navegación → network-first con fallback al shell cacheado.
 *       · assets propios (/, /assets/) → cache-first, network-fallback.
 *       · resto → passthrough (no cache; fonts CDN ya se cachean solas).
 *   - activate: limpia caches viejas.
 *
 * Versionado: cambiar CACHE_VERSION invalida la cache anterior. Subir el
 * número al hacer un cambio que requiera evict (HTML modificado, etc.).
 */

const CACHE_VERSION = 'ade-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/og-image.png',
  '/assets/ade/character/ade-idle.webp',
  '/assets/ade/character/ade-curious.webp',
  '/assets/ade/character/ade-scan.webp',
  '/assets/ade/character/ade-hunt.webp',
  '/assets/ade/character/ade-fuse.webp',
  '/assets/ade/character/ade-interpret.webp',
  '/assets/ade/character/ade-archive.webp',
  '/assets/ade/character/ade-offended.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navegación (HTML) → network-first, fallback al index cacheado.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put('/index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    );
    return;
  }

  // Assets propios (same-origin) → cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        });
      }),
    );
    return;
  }

  // Cross-origin (fonts, etc.) → passthrough.
});
