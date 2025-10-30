// Use timestamp or build hash for cache versioning
const CACHE_NAME = `migoyugo-game-v${Date.now()}`;
const STATIC_CACHE = `migoyugo-static-v${Date.now()}`;
const DYNAMIC_CACHE = `migoyugo-dynamic-v${Date.now()}`;

const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/sounds/migo.mp3',
  '/sounds/yugo.mp3',
  '/sounds/igo.mp3'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function(cache) {
        console.log('Service Worker: Caching App Shell');
        // Cache resources with error handling
        return cache.addAll(urlsToCache).catch(error => {
          console.log('Service Worker: Some resources failed to cache:', error);
          // Continue with installation even if some resources fail
          return Promise.resolve();
        });
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.log('Service Worker: Installation failed:', error);
        // Skip waiting even if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Delete old caches that don't match current version
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Ensure the new service worker takes control immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content, but with network-first for HTML
self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const { request } = event;
  
  try {
    const url = new URL(request.url);
    
    // Skip cross-origin requests
    if (url.origin !== location.origin) {
      return;
    }

    // Network first for HTML pages (ensures updates are fetched)
    if (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) {
      event.respondWith(
        fetch(request)
          .then(response => {
            // Clone the response because it can only be consumed once
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone))
              .catch(error => console.log('Failed to cache response:', error));
            return response;
          })
          .catch(() => {
            // If network fails, try cache
            return caches.match(request);
          })
      );
      return;
    }

    // Cache first for other resources (CSS, JS, images, sounds)
    event.respondWith(
      caches.match(request)
        .then(function(response) {
          // Return cached version if available
          if (response) {
            return response;
          }
          
          // Otherwise fetch from network and cache it
          return fetch(request).then(function(response) {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it can only be consumed once
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(function(cache) {
                cache.put(request, responseToCache);
              })
              .catch(error => console.log('Failed to cache response:', error));

            return response;
          });
        })
        .catch(error => {
          console.log('Fetch failed:', error);
          // Return a basic error response
          return new Response('Network error', { status: 408, statusText: 'Request Timeout' });
        })
    );
  } catch (error) {
    console.log('Service Worker fetch error:', error);
    // Don't respond to the event if there's an error
  }
});

// Listen for messages from the main thread
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 