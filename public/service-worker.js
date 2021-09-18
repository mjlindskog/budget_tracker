const FILES_TO_CACHE = [
    "/manifest.json",
    "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
    "https://cdn.jsdelivr.net/npm/chart.js@2.8.0",
    "/index.html",
    "/styles.css",
    "/index.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];

const STATIC_CACHE = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache";

self.addEventListener("install", e => {
    e.waitUntil(
        caches
        .open(STATIC_CACHE)
        .then(cache => cache.addAll(FILES_TO_CACHE))
        .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", e => {
    const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
    e.waitUntil(
        caches
        .keys()
        .then(cacheNames => {
            return cacheNames.filter(
                cacheName => !currentCaches.includes(cacheName)
            );
        })
        .then(cachesToDelete => {
            return Promise.all(
                cachesToDelete.map(cacheToDelete => {
                    return caches.delete(cacheToDelete);
                })
            );
        })
        .then(() => self.clients.claim())
    );
});
  
self.addEventListener("fetch", e => {
    if (
        e.request.method !== "GET" ||
        !e.request.url.startsWith(self.location.origin)
    ) {
        e.respondWith(fetch(e.request));
        return;
    }
    if (e.request.url.includes("/api/images")) {
        e.respondWith(
            caches.open(RUNTIME_CACHE).then(cache => {
                return fetch(e.request)
                .then(response => {
                    cache.put(e.request, response.clone());
                    return response;
                })
                .catch(() => caches.match(e.request));
            })
            .catch((err) => console.log(err))
        );
        return;
    }

    e.respondWith(
        caches.match(e.request)
        .then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return caches.open(RUNTIME_CACHE).then(cache => {
                return fetch(e.request)
                .then(response => {
                    return cache.put(e.request, response.clone())
                    .then(() => {
                        return response;
                    });
                });
            });
        })
    );
});
