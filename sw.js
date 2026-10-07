// Blitzbirne: zuerst aus dem Netz laden (damit Updates sofort ankommen), ohne Netz aus dem Zwischenspeicher.
var CACHE = 'blitzbirne-v1';
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png']); }));
});
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var cacheable = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(fetch(e.request).then(function(res){
    if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copy); }); }
    return res;
  }).catch(function(){ return caches.match(e.request, {ignoreSearch: true}).then(function(r){ return r || caches.match('./'); }); }));
});
