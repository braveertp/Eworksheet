/* ============================================================
   Service Worker — E-Worksheet PWA
   Cache-First for all assets
   ============================================================ */

const CACHE_NAME = 'eworksheet-v3';

const PRECACHE_URLS = [
  './',
  './index.html',
  './ils.html',
  './manifest.json',
  './airport.json',
];

/* ── Install: pre-cache everything ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // addAll แบบ individual เพื่อไม่ให้ 1 ไฟล์พัง = ทั้งหมดพัง
        return Promise.allSettled(
          PRECACHE_URLS.map(url =>
            cache.add(url).catch(err => console.warn('Pre-cache miss:', url, err))
          )
        );
      })
  );
  self.skipWaiting();
});

/* ── Activate: remove old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch: Cache-First, fallback to network ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // ข้าม cross-origin requests (CDN ที่เหลือ ฯลฯ)
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline fallback สำหรับ HTML
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});