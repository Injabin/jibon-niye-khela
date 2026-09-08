/* Jibon Niye Khela — offline service worker (init.md M6 #3, Gate 6 PWA check).
 *
 * Strategy:
 *  - the app shell (`/`), the web manifest and the icons are precached on
 *    install, so a previously visited player always has an entry point;
 *  - navigations are network-first with a fallback to the cached shell, so a
 *    fresh deploy never serves a stale page but offline still resolves;
 *  - every other same-origin GET is stale-while-revalidate: served instantly
 *    from cache while the network refreshes the copy in the background.
 *
 * The game state itself (characters, settings, achievements) lives in
 * localStorage / IndexedDB, so cached chunks + shell are all that is needed
 * to keep playing offline.
 */

const CACHE = 'jibon-niye-khela-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png'];

const isSameOrigin = (url) => url.origin === self.location.origin || url.href.startsWith('/');
const isGet = (request) => request.method === 'GET';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!isGet(request) || !isSameOrigin(new URL(request.url))) return;

  const isNavigation = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('/'))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => hit);
      return hit || network;
    }),
  );
});