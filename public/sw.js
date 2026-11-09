const CACHE_NAME = 'apex-shell-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/apex-mark.svg', '/sounds/notification.mp3', '/sounds/race-start-beeps.mp3'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    // Pre-cache the built JS/CSS referenced by index.html so the app can start
    // offline after its first successful online visit.
    const response = await cache.match('/index.html');
    const html = await response.text();
    const assets = [...html.matchAll(/(?:src|href)=\"([^\"]*\/assets\/[^\"]+)\"/g)]
      .map((match) => match[1]);
    await Promise.all(assets.map((asset) => cache.add(asset).catch(() => null)));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('apex-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
    self.clients.claim(),
  ]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({ type: 'window', includeControlled: true });
    for (const client of windowClients) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) client.navigate(targetUrl).catch(() => {});
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const responseToCache = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseToCache)));
        return response;
      } catch {
        return (await caches.match('/index.html')) || (await caches.match('/'));
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/assets/') || APP_SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const responseToCache = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache)));
        }
        return response;
      });
    }));
  }
});
