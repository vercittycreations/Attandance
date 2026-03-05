importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// These placeholders are replaced at build time by vite.config.js plugin
// In production (Vercel), real values get injected automatically
firebase.initializeApp({
  apiKey:            '__VITE_API_KEY__',
  authDomain:        '__VITE_AUTH_DOMAIN__',
  projectId:         '__VITE_PROJECT_ID__',
  storageBucket:     '__VITE_STORAGE_BUCKET__',
  messagingSenderId: '__VITE_MESSAGING_SENDER_ID__',
  appId:             '__VITE_APP_ID__'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'WorkforcePro';
  const body  = payload.notification?.body  || 'You have a new notification';

  self.registration.showNotification(title, {
    body,
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: payload.data?.type || 'general',
    vibrate: [200, 100, 200],
    data: { url: payload.data?.url || '/dashboard' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});