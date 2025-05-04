const CACHE_NAME = 'eduresources-v1';
const DYNAMIC_CACHE_NAME = 'eduresources-dynamic-v1';

// List all pages and assets to cache (static resources)
const ASSETS_TO_CACHE = [
  '/', 
  'index.html', 
  'syllabus.html', 
  'about.html', 
  'books.html', 
  'fallback.html',
  'notes.html',
  'pastpapers.html',
  'privacy.html',
  'quizzes.html',
  'quiz.html',
  'resources.html',
  'tutoring.html',
  'tips.html',
  'syllabus-data.json', 
  'papers-data.json', 
  'icon-192.png', 
  'icon-512.png',
  'logo.png', 
  'hero-bg.jpg',
  'manifest.json',
  'service-worker.js', // The service worker itself
  'assets/fonts/roboto.woff2', // Example for fonts
  'assets/images/banner.jpg', // Example for image assets
  // Add more resources (CSS, JS files, images, etc.) as needed
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);  // Cache all listed assets during install
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
            return caches.delete(cache);  // Delete old caches to free up space
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

  // Cache all HTML requests and respond with cached HTML or fetch if not available
  if (event.request.url.endsWith('.html')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }

  // Cache images and other static assets like CSS and JS
  else if (event.request.url.endsWith('.jpg') || event.request.url.endsWith('.png') || event.request.url.endsWith('.css') || event.request.url.endsWith('.js')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((response) => {
          return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());  // Cache dynamically loaded resources
            return response;
          });
        });
      })
    );
  }

  // For API calls (syllabus-data.json, papers-data.json), use cache-first or network-first strategy
  else if (event.request.url.endsWith('syllabus-data.json') || event.request.url.endsWith('papers-data.json')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request).then((response) => {
          const clonedResponse = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);  // Cache the API response
          });
          return response;
        });

        // If cached response exists, return it, otherwise fetch from the network
        return cachedResponse || networkFetch;
      })
    );
  }

  // Handle other content types if necessary (like videos, fonts, etc.)
});

// Background sync (if needed for offline features)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-resources') {
    console.log('Service Worker: Background sync triggered');
    // Logic to retry failed requests or perform background sync
  }
});

// Push notification handling (if needed)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'EduResources', body: 'You have a new notification!', url: '/' };

  const options = {
    body: data.body,
    icon: 'icon-192.png',
    badge: 'badge.png',
    vibrate: [200, 100, 200],
    data: { url: data.url },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});