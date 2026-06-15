// ============================================
// sw.js — Service Worker
// ============================================

const CACHE_NAME = 'v2v-app-v2';

const FILES_TO_CACHE = [
  '/V2V_App_v2/',
  '/V2V_App_v2/index.html',
  '/V2V_App_v2/css/style.css',
  '/V2V_App_v2/js/app.js',
  '/V2V_App_v2/js/auth.js',
  '/V2V_App_v2/js/esp.js',
  '/V2V_App_v2/js/map.js',
  '/V2V_App_v2/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    }).catch(err => {
      console.log('Cache skipped:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
