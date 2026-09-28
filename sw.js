const CACHE_NAME = 'toolsuf-cache-v13';
const ASSETS_TO_CACHE = [
  'index.html',
  'style.css',
  'app.js',
  'favicon.png',
  'manifest.json',
  'shared/maintenance.js',
  'shared/toolsuf-download.js',
  'shared/cute-loading.js',
  'shared/cute-loading.css',
  'shared/job-manager.js',
  'shared/job-ui.js',
  'shared/job-ui.css',
  'tools/ai-workflow-assistant/index.html',
  'tools/ai-workflow-assistant/style.css',
  'tools/ai-workflow-assistant/script.js',
  'tools/background-remover/index.html',
  'tools/background-remover/style.css',
  'tools/background-remover/script.js',
  'tools/background-remover/bg-removal-worker.js',
  'tools/web-monitor/index.html',
  'tools/web-monitor/style.css',
  'tools/web-monitor/script.js',
  'yusjul-admin/index.html'
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

// Fetch Event: Network First, Fallback to Cache
self.addEventListener('fetch', (e) => {
  // 1. Bypass Service Worker sepenuhnya untuk semua panggilan API (maintenance, monitor, status, heartbeat)
  if (e.request.url.includes('/api/') || e.request.url.includes('_t=') || e.request.method !== 'GET') {
    return; // Serahkan langsung ke jaringan tanpa intervensi cache
  }

  // Only handle same-origin requests
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    fetch(e.request).then((networkResponse) => {
      // Cache fresh responses for offline fallback (hanya aset statis non-API)
      if (networkResponse && networkResponse.status === 200 && !e.request.url.includes('/api/')) {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
      // Network failed — try cache
      return caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback for navigation
        if (e.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
