/* SafeRed · modo sin señal.
   Guarda la página en el teléfono después de la primera visita, para que el número y los botones
   de llamada sigan visibles aunque no haya internet (por ejemplo, en un subterráneo durante una emergencia).
   - Páginas: primero la red (siempre lo más nuevo); si no hay señal, la copia guardada.
   - Archivos (estilos, fotos, fuente): la copia guardada al instante y se actualiza en segundo plano.
   Solo se guardan archivos de este mismo sitio; nunca datos del visitante. */
"use strict";
var CACHE = "safered-v1";

self.addEventListener("install", function () { self.skipWaiting(); });

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// La página avisa qué archivos usó en la primera visita para dejarlos guardados
self.addEventListener("message", function (event) {
  var data = event.data || {};
  if (data.type !== "cache" || !Array.isArray(data.urls)) return;
  var same = data.urls.filter(function (u) {
    try { return new URL(u).origin === self.location.origin; } catch (e) { return false; }
  }).slice(0, 60);
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return Promise.all(same.map(function (u) { return cache.add(u).catch(function () {}); }));
  }));
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // WhatsApp, SEC y otros sitios no se tocan

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          return hit || caches.match(new URL("./", self.registration.scope).href);
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      var update = fetch(req).then(function (res) {
        if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return cached; });
      if (cached) { event.waitUntil(update); return cached; }
      return update;
    })
  );
});
