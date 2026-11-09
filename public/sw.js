// Cache version — update this string on every deployment to bust old caches.
// Format: companion-YYYYMMDD-N
const CACHE_NAME    = 'companion-20261109-1';
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
//   - HTML pages:     network-first (always fresh), cached copy only as an
//                     offline fallback
//   - API + RSC:      network-only (never cache — a cached RSC payload pins a
//                     page to the build that produced it, which is how pages
//                     ended up rendering different deployments side by side)
//   - Static assets:  cache-first (icons, manifest, hashed build chunks)
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API calls
  if (url.pathname.startsWith('/api/')) return;

  // Never cache React Server Component payloads (client-side navigation
  // data). Serving one from cache mixes an old build's pages into a new
  // build's session.
  if (url.searchParams.has('_rsc') ||
      (event.request.headers.get('accept') || '').includes('text/x-component') ||
      event.request.headers.get('RSC') === '1' ||
      event.request.headers.get('Next-Router-State-Tree')) {
    return;
  }

  // Next.js build chunks have content hashes in the URL, so cache-first is
  // safe: a new deployment produces new URLs that miss the cache.
  if (url.pathname.startsWith('/_next/static/')) {
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

  // HTML navigation: network-first, fall back to cache when offline
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
