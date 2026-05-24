const CACHE = 'pulsewave-v1';
const SHELL = ['/', '/index.html', '/manifest.json'];

// Install: pre-cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for shell assets, network-first for audio (Cloudinary)
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Let audio streams always go to network — never cache large media
  if (url.includes('cloudinary.com') || url.includes('.mp3')) {
    return; // fall through to network
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache valid same-origin GET responses
        if (response.ok && e.request.method === 'GET' && url.startsWith(self.location.origin)) {
          caches.open(CACHE).then(c => c.put(e.request, response.clone()));
        }
        return response;
      }).catch(() => cached); // offline fallback
    })
  );
});
