const CACHE_NAME = 'bricks-v5'; // Updated version to trigger cache refresh

// Assets to cache for offline availability
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/BRICKS LOGO.PNG', // Updated to match your new file
  '/favicon.ico'
];

// 1. Install Event: Cache UI Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚓ BRICKS: Pre-caching UI assets and Logo');
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become active immediately
  self.skipWaiting();
});

// 2. Activate Event: Clean up old caches & take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 BRICKS: Clearing old cache version');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Immediately take control of all open tabs
  return self.clients.claim();
});

// 3. Fetch Event: Network First with Cache Fallback for UI
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for internal assets to avoid API conflicts
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache with fresh version from network
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable
        return caches.match(event.request);
      })
  );
});

/**
 * --- NATIVE APP NOTIFICATION LOGIC ---
 */

// 4. Push Event: Listen for backend signals
self.addEventListener('push', (event) => {
  let data = { 
    title: 'BRICKS TREASURY', 
    body: 'New requisition activity recorded.', 
    url: '/' 
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/BRICKS LOGO.PNG', // Updated icon path
    badge: '/BRICKS LOGO.PNG', // Updated badge path
    vibrate: [200, 100, 200],
    tag: 'requisition-sync',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Notification Click: Open or focus the app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});
