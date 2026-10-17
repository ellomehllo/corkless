self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch {}
  const n = p.notification || {}, d = p.data || {};
  e.waitUntil(self.registration.showNotification(d.title || n.title || 'tack', {
    body: d.body || n.body || '', icon: 'icon-192.png?v=202610050117', badge: 'icon-192.png?v=202610050117', tag: 'tack-' + (d.tag || 'note'), renotify: true,
    data: { link: d.link || self.registration.scope }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.link) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
    // tack is already open: bring it forward and let it open the job or chat without reloading.
    for (const c of l) if (c.url.startsWith(self.registration.scope) && 'focus' in c) { c.postMessage({ type: 'open', link: url }); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
