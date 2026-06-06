/*
 * Service Worker for BullForge Push Notifications
 */

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'BullForge Notification',
        body: event.data.text()
      };
    }
  }

  const title = data.title || 'BullForge Price Alert';
  const options = {
    body: data.body || 'Your target price threshold has been crossed.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'bullforge-alert-' + (data.data?.symbol || 'generic'),
    renotify: true,
    data: data.data || {},
    actions: [
      { action: 'open_url', title: 'View Trade' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If there's an open window, navigate and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If no open window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
