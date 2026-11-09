/* Offline support: after the first visit everything, the PowerPoint and PDF readers included, comes
   from this cache, so Present works on a venue's bad Wi-Fi. Files people open are never cached:
   they're read straight from the device and never pass through here.
   Bump VERSION whenever any file changes, so phones pick up the new one. */
var VERSION = 'present-v4';
var FILES = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'lang.js',
  'visit-counter.js',
  'manifest.webmanifest',
  'ellenial-theme.js',
  'ellenial-help.js',
  'ellenial-help.css',
  'fonts/fraunces-latin-600-normal.woff2',
  'fonts/fraunces-latin-400-italic.woff2',
  'fonts/dm-sans-latin-400-normal.woff2',
  'fonts/dm-sans-latin-500-normal.woff2',
  'fonts/dm-sans-latin-700-normal.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'vendor/pdfjs/pdf.min.mjs',
  'vendor/pdfjs/pdf.worker.min.mjs',
  'vendor/pptx-renderer/aiden0z-pptx-renderer.browser.es.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Pages: try the network first so updates arrive, fall back to the cache offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
