// Cache version — update this string on every deployment to bust old caches.
// Format: companion-YYYYMMDD-N
const CACHE_NAME    = 'companion-20250609-1';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: pre-cache static assets only (NOT the HTML shell —
// always fetch HTML fresh so users get new deployments immediately)
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate: delete ALL old caches that don't match current CACHE_NAME
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch strategy:
//   - HTML pages:     network-first (always fresh)
//   - API calls:      network-only  (never cache)
//   - Static assets:  cache-first   (icons, manifest)
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Never cache API calls
  if (url.includes('/api/')) return;

  // Never cache Next.js build chunks from _next/static differently —
  // they have content hashes so cache-first is safe
  if (url.includes('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(res) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // HTML navigation: network-first, fall back to cache
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(function(res) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Static assets (icons etc): cache-first
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(res) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      });
    })
  );
});
