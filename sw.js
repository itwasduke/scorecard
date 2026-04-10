// Golf League Scorer — Service Worker
// Cache-first strategy for shell assets, network-first for API calls

const CACHE_NAME = 'golf-scorer-v1';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// ─── INSTALL ───────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        SHELL_ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('Failed to cache:', url, err);
        }))
      );
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE ──────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Network-only for external APIs (Gemini, Firebase, Fonts)
  const isExternal =
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('jsdelivr.net') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com');

  if (isExternal) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return an empty 503 so the app can show its own offline message
        return new Response('{"offline":true}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Cache-first for local shell assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: return app shell for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
