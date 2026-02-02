const version = 'v2.1.1';
const CACHE_NAME = `godotxt-${version}`;
const urls = [
	`/images/apple-touch-icon.png?v=${version}`,
	`/images/favicon-96x96.png?v=${version}`,
	`/images/favicon.ico`,
	`/images/favicon.svg?v=${version}`,
	`/images/web-app-manifest-192x192.png?v=${version}`,
	`/images/web-app-manifest-512x512.png?v=${version}`,
	`/scripts/app.js?v=${version}`,
	`/scripts/modal.js?v=${version}`,
	`/scripts/todotxt.js?v=${version}`,
	`/styles/pico.min.css?v=v2.1.1`,
	`/styles/style.css?v=${version}`,
	`/index.html`,
	`/site.webmanifest?v=${version}`
];

// Install: Cache static assets
self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => cache.addAll(urls))
			.then(() => self.skipWaiting())
	);
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.filter(name => name !== CACHE_NAME)
					.map(name => caches.delete(name))
			);
		}).then(() => self.clients.claim())
	);
});

// Fetch: Cache static assets
self.addEventListener('fetch', event => {
	event.respondWith(
		caches.match(event.request).then(cachedResponse => {
			return cachedResponse || fetch(event.request).then(networkResponse => {
				if (networkResponse && networkResponse.ok && event.request.method === 'GET') {
					return caches.open(CACHE_NAME).then(cache => {
						cache.put(event.request, networkResponse.clone());
						return networkResponse;
					});
				}
				return networkResponse;
			}).catch(() => {
				if (event.request.mode === 'navigate') {
					return caches.match('/index.html');
				}
				return new Response('Offline content unavailable', { status: 503 });
			});
		})
	);
});
