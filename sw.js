const CACHE_NAME = 'toolsuf-cache-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'style.css',
  'app.js',
  'favicon.png',
  'manifest.json',
  'tools/ai-workflow-assistant/index.html',
  'tools/ai-workflow-assistant/style.css',
  'tools/ai-workflow-assistant/script.js'
];

// Install Event: cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache First, Fallback to Network
self.addEventListener('fetch', (e) => {
  // Only handle HTTP/HTTPS requests (ignores chrome-extension, file:// etc.)
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        // Cache newly fetched assets dynamically
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for offline if not cached
        if (e.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
