const version = 'v1.1.0';
const CACHE_NAME = `godotxt-${version}`;
const urls = [
	`/images/apple-touch-icon.png?v=${version}`,
	`/images/favicon-96x96.png?v=${version}`,
	`/images/favicon.ico`,
	`/images/favicon.svg?v=${version}`,
	`/images/web-app-manifest-192x192.png?v=${version}`,
	`/images/web-app-manifest-512x512.png?v=${version}`,
	`/scripts/main.js?v=${version}`,
	`/scripts/modal.js?v=${version}`,
	`/scripts/pocketbase.umd.js?v=v0.26.1`,
	`/scripts/todotxt.js?v=${version}`,
	`/styles/pico.red.min.css?v=v2.1.1`,
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

// Fetch: Cache-first for static assets
self.addEventListener('fetch', event => {
	const url = new URL(event.request.url);

	// Network-only for APIs
	if (url.pathname.startsWith('/api/') || url.pathname === '/_') {
		event.respondWith(
			fetch(event.request).catch(() => {
				return new Response(
					JSON.stringify({ status: 'error', message: 'This action requires an internet connection' }),
					{ headers: { 'Content-Type': 'application/json' } }
				);
			})
		);
		return;
	}

	// Cache-first for all other requests
	event.respondWith(
		caches.match(event.request).then(cachedResponse => {
			return cachedResponse || fetch(event.request).then(networkResponse => {
				if (networkResponse.ok && event.request.method === 'GET') {
					return caches.open(CACHE_NAME).then(cache => {
						cache.put(event.request, networkResponse.clone());
						return networkResponse;
					});
				}
				return networkResponse;
			});
		}).catch(() => {
			// Fallback for HTML requests
			if (event.request.mode === 'navigate') {
				return caches.match('/index.html');
			}
			return new Response('Offline content unavailable', { status: 503 });
		})
	);
});
