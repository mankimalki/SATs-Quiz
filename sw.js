const CACHE_NAME = 'eduresources-v1';
const DYNAMIC_CACHE_NAME = 'eduresources-dynamic-v1';

const ASSETS_TO_CACHE = [
  '/',
  'index.html',
  'app.js',
  'logo.png',
  'hero-bg.jpg',
  'icon-192.png',
  'icon-512.png',
  'fallback.html',
  'manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: Deleting Old Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('fallback.html');
        }

        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          if (event.request.destination === 'image') {
            return caches.match('placeholder.png');
          }
        });
      })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-resources') {
    console.log('Service Worker: Background sync triggered');
    // Add logic to retry failed requests if needed
  }
});

// Push notification
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {
    title: 'EduResources',
    body: 'You have a new notification!',
    url: '/'
  };

  const options = {
    body: data.body,
    icon: 'icon-192.png',
    badge: 'badge.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});