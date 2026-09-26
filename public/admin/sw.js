/* Admin-only worker. Never caches pages, API responses, sessions or customer data. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let message;
  try { message = event.data?.json(); } catch { return; }
  if (!message || typeof message.title !== 'string') return;
  const id = typeof message.orderId === 'string' && /^[a-f0-9-]{36}$/i.test(message.orderId) ? message.orderId : '';
  event.waitUntil(self.registration.showNotification(message.title.slice(0, 120), {
    body: typeof message.body === 'string' ? message.body.slice(0, 240) : 'Open Orders for details.',
    icon: '/admin/icons/icon-192.png', tag: id || 'orders', data: { url: id ? '/admin/orders/' + id : '/admin/orders' },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/admin/orders', self.location.origin);
  if (target.origin !== self.location.origin || !/^\/admin\/orders(?:\/[a-f0-9-]{36})?$/.test(target.pathname)) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).pathname.startsWith('/admin'));
    if (existing) { await existing.navigate(target.href); return existing.focus(); }
    return self.clients.openWindow(target.href);
  })());
});
