// Import Firebase App and Messaging SDKs inside the Service Worker context
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyD_2ABUZdhHIqFeszgVKT2qFz52_7VTmaI",
  authDomain: "medi-valut.firebaseapp.com",
  projectId: "medi-valut",
  storageBucket: "medi-valut.firebasestorage.app",
  messagingSenderId: "370081851759",
  appId: "1:370081851759:web:3161ed81c1ac90eb6f609a"
});

// Retrieve an instance of Firebase Cloud Messaging.
const messaging = firebase.messaging();

// Handle background messages when website tab is closed
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Parse notification payload details
  const notificationTitle = payload.notification?.title || payload.data?.title || 'MediVault Reminder';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'It is time for your scheduled health activity!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true, // keeps the notification visible until user interacts with it
    data: {
      url: payload.data?.url || '/',
      type: payload.data?.type || 'general'
    },
    actions: [
      { action: 'open', title: '✓ Open Dashboard' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to focus or reopen the web application
self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data || {};
  const action = event.action;

  event.notification.close(); // close the notification banner

  if (action === 'close') {
    return; // user clicked dismiss
  }

  // Open the targeted URL (e.g. '/tablet-alarm' or '/drinking-water')
  const targetUrl = data.url ? new URL(data.url, self.location.origin).href : self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      // If no window is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
