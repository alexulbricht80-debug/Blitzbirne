// Blitzbirne: zuerst aus dem Netz laden (damit Updates sofort ankommen), ohne Netz aus dem Zwischenspeicher.
var CACHE = 'blitzbirne-v3';
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png']); }));
});
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var cacheable = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!cacheable) return;
  var nav = e.request.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname) || /version\.json$/.test(url.pathname);
  e.respondWith((nav ? fetch(url.href, {cache: 'no-store', credentials: 'same-origin'}) : fetch(e.request)).then(function(res){
    if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(), key = nav ? (/version\.json$/.test(url.pathname) ? 'version.json' : './') : e.request; caches.open(CACHE).then(function(c){ c.put(key, copy); }); }
    return res;
  }).catch(function(){ return caches.match(e.request, {ignoreSearch: true}).then(function(r){ return r || caches.match('./'); }); }));
});
