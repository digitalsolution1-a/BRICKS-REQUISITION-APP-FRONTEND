const CACHE_NAME = 'bricks-v9'; // Incremented to force square logo update

// Assets to cache for offline availability
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/BRICKS LOGO.png', // Using the exact filename you uploaded
  '/favicon.ico'
];

// 1. Install Event: Cache UI assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚓ BRICKS: Caching Square Assets v9');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Cleanup old stretched caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 BRICKS: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Fetch Event: Network First Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// 4. Push Event: Native Notifications
self.addEventListener('push', (event) => {
  let data = { 
    title: 'BRICKS TREASURY', 
    body: 'New requisition update.', 
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
    icon: '/BRICKS LOGO.png',
    badge: '/BRICKS LOGO.png',
    vibrate: [200, 100, 200],
    tag: 'requisition-sync',
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url || '/');
    })
  );
});
