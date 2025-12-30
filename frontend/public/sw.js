self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'ZakatVault Notification';
    const options = {
      body: data.body || 'You have a new update from ZakatVault.',
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // If it's not JSON, it might be plain text
    const text = event.data.text();
    const options = {
      body: text,
      icon: '/favicon.png',
      badge: '/favicon.png'
    };
    event.waitUntil(self.registration.showNotification('ZakatVault', options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
