const CACHE_NAME = "behave-cache-v1";

const ASSETS = [
  "/Behave/",
  "/Behave/index.html",
  "/Behave/manifest.json",
  "/Behave/service-worker.js",
  "/Behave/icon-192.png",
  "/Behave/icon-512.png",
  "/Behave/js/storage.js",
  "/Behave/js/events.js",
  "/Behave/js/charts.js",
  "/Behave/js/ui.js",
  "/Behave/js/gestures.js",
  "/Behave/js/pwa.js",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/chart.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();

  self.clients.matchAll({ type: "window" }).then(clients => {
    clients.forEach(client => client.postMessage("UPDATE_AVAILABLE"));
  });
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then(response => {
        const clone = response.clone();
        const ct = response.headers.get("content-type") || "";
        if (!ct.includes("text/html")) {
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
