const CACHE_NAME = 'workforcepro-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
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

// Fetch — network first, cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET and firebase/api requests
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('firestore') ||
    event.request.url.includes('firebase') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache fresh response
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request)
          .then(cached => cached || caches.match('/index.html'));
      })
  );
});

// ─── Push Notifications (existing) ───
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body:    data.body  || 'New notification',
    icon:    data.icon  || '/icon-192.png',
    badge:   '/icon-192.png',
    tag:     data.tag   || 'default',
    data:    { url: data.url || '/' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'WorkforcePro', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});