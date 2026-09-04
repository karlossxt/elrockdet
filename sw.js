const CACHE_NAME = 'elrock-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/likes.js',
  '/manifest.json',
  '/fontawesome-all.min.css',
  '/favicon-32.png',
  '/favicon-16.png',
  '/favicon-180.png',
  '/logo-rock.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== location.origin) {
    if (request.destination === 'image') {
      event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request))
      );
    }
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return networkResponse;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return networkResponse;
      });
    })
  );
});
