/* RELI offline shell: only navigations may fall back to HTML. */
const CACHE_NAME = 'edm-dodge-reli-v4';
const ASSETS = ['./','./index.html','./style.css','./visual-upgrade.css','./game.js','./visuals.js','./engine.js','./audio.js','./missions.js','./progression.js','./manifest.webmanifest','./icon.svg'];
const withinScope = url => url.origin === self.location.origin && url.pathname.startsWith(new URL(self.registration.scope).pathname);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('edm-dodge-reli-') && key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !withinScope(new URL(event.request.url))) return;
  const isNavigation = event.request.mode === 'navigate';
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone())));
      return response;
    }).catch(async () => {
      const cached = await caches.match(event.request, {ignoreSearch:true});
      if (cached) return cached;
      if (isNavigation) {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      // Never serve HTML as a failed JS/CSS/audio request (module MIME error).
      return new Response('Offline resource not cached', {status:503, statusText:'Offline'});
    })
  );
});
