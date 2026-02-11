
const CACHE_NAME = 'cromoche-v14'; // Incrementamos versión
const OFFLINE_URL = './index.html';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // NUNCA cachear llamadas a la API de Google Scripts o peticiones POST
  if (event.request.url.includes('script.google.com') || event.request.method === 'POST') {
    return; // Dejar que el navegador lo maneje normalmente (Network only)
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        // Cache dinámico solo para imágenes externas de confianza
        if (event.request.url.includes('googleusercontent.com') || event.request.url.includes('drive.google.com')) {
           const cacheCopy = fetchRes.clone();
           caches.open(CACHE_NAME).then(cache => cache.put(event.request, cacheCopy));
        }
        return fetchRes;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        return null;
      });
    })
  );
});
