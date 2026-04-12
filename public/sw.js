const CACHE_NAME = 'bricks-v1';

// Assets to cache for offline availability
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
  // Force the waiting service worker to become active immediately
  self.skipWaiting();
});

// 2. Activate Event: Clean up old caches for version control
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

// 3. Fetch Event: Network First, then Cache fallback
self.addEventListener('fetch', (event) => {
  // Only handle requests from our own origin to avoid caching external API data/sensitive info
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache with fresh version from network
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // Fallback to cache if network is unavailable (e.g., poor maritime connection)
        return caches.match(event.request);
      })
  );
});

/**
 * --- NATIVE APP NOTIFICATION LOGIC ---
 */

// 4. Push Event: Listens for signals from the backend even when the app is closed
self.addEventListener('push', (event) => {
  let data = { 
    title: 'BRICKS Update', 
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
    icon: '/logo192.png',
    badge: '/logo192.png', // Shown in the Android/iOS status bar
    vibrate: [200, 100, 200], // Native haptic feedback
    tag: 'requisition-sync', // Groups similar notifications
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Notification Click: Logic to open or focus the app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Automatically dismiss the alert

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if the app is already open in any tab/window
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // If the app is closed, launch it as a fresh native window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});
