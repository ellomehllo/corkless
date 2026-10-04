self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch {}
  const n = p.notification || {}, d = p.data || {};
  e.waitUntil(self.registration.showNotification(d.title || n.title || 'tack', {
    body: d.body || n.body || '', icon: 'icon-192.png?v=202610050117', badge: 'icon-192.png?v=202610050117', tag: 'tack-' + (d.tag || 'note'),
    data: { link: d.link || self.registration.scope }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.link) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
    for (const c of l) if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
