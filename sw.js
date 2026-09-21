/* ============================================================
   Service Worker — ILS-Offline PWA
   Strategy: Cache-First for all assets, Network-First for JSON data
   ============================================================ */

const CACHE_NAME = 'ils-offline-v1';

// All files that make up the app shell
const PRECACHE_URLS = [
  './Eworksheet/',
  './Eworksheet/index.html',
  './Eworksheet/ils.html',
  './Eworksheet/airport.json',
  './Eworksheet/manifest.json',
  './Eworksheet/assets/tailwind.css',
  './Eworksheet/assets/fontawesome.css',
  './Eworksheet/assets/icon-192.png',
  './Eworksheet/assets/icon-512.png',
  './Eworksheet/assets/fonts/inter-latin-300-normal.woff2',
  './Eworksheet/assets/fonts/inter-latin-400-normal.woff2',
  './Eworksheet/assets/fonts/inter-latin-500-normal.woff2',
  './Eworksheet/assets/fonts/inter-latin-600-normal.woff2',
  './Eworksheet/assets/fonts/inter-latin-700-normal.woff2',
  './Eworksheet/assets/fonts/fa-solid-900.woff2',
  './Eworksheet/assets/fonts/fa-regular-400.woff2',
  './Eworksheet/assets/fonts/fa-brands-400.woff2',
];

/* ── Install: pre-cache everything ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

/* ── Activate: remove old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch: Cache-First strategy ── */
self.addEventListener('fetch', event => {
  // Only handle GET requests for same-origin or relative assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Not in cache — try network, then cache for next time
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Offline and not in cache — return offline fallback for HTML pages
        if (event.request.destination === 'document') {
          return caches.match('./Eworksheet/index.html');
        }
      });
    })
  );
});
