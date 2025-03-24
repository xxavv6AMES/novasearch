const CACHE_NAME = 'novasearch-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/results.html',
    '/style.css',
    '/results-style.css',
    '/script.js'
];

// Add whitelist of domains we want to cache
const CACHE_WHITELIST = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdnjs.cloudflare.com',
    'd2zcpib8duehag.cloudfront.net'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
    );
});

self.addEventListener('fetch', event => {
    // Don't attempt to cache Google CSE requests
    if (event.request.url.includes('cse.google.com')) {
        return;
    }

    // Check if the request is for a whitelisted domain
    const url = new URL(event.request.url);
    const shouldCache = CACHE_WHITELIST.some(domain => url.hostname.includes(domain));

    if (shouldCache) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request)
                        .then(response => {
                            if (!response || response.status !== 200) {
                                return response;
                            }
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                            return response;
                        });
                })
                .catch(() => {
                    // Return fallback response if fetch fails
                    return new Response('', {
                        status: 408,
                        statusText: 'Request timed out.'
                    });
                })
        );
    }
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});
