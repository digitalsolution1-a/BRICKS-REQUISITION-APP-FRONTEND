const CACHE_NAME = 'bricks-v1';

// We cache the core UI but allow the browser to fetch fresh data for requisitions
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico'
];

// 1. Install Event: Cache the application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚓ BRICKS Cache: Pre-caching offline assets');
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 BRICKS Cache: Clearing old version');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. Fetch Event: Network First, then Cache
// This ensures staff see live updates if online, but the app still opens if offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like API calls to Render/MongoDB) 
  // to prevent caching sensitive requisition data
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If the network is available, use it and update the cache
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // If network fails (e.g., at sea), look in the cache
        return caches.match(event.request);
      })
  );
});
