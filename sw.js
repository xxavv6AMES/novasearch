const CACHE_NAME = 'nova-search-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/js/pwa.js',
    '/manifest.json',
    '/sounds/beep-start.mp3',
    '/sounds/beep-end.mp3',
    '/sounds/beep-error.mp3',
    'https://static.wixstatic.com/media/5f23d5_5724b6ca5ab64193801259dddba35e59~mv2.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
