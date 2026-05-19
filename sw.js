const CACHE_NAME = 'inventario-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/db.js',
  '/js/pages.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/firebase-config.js',
  '/js/components.js',
  '/js/charts.js',
  '/manifest.json',
];

// Instalación: cachear archivos esenciales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activación: limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar peticiones: cache-first para archivos estáticos, network-first para Firebase
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // No cachear peticiones a Firebase (auth, firestore)
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first para el resto
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    }).catch(() => {
      // Si falla todo, responder con página offline
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
