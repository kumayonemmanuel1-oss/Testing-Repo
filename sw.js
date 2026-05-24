const CACHE = 'pulsewave-v2';
const SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('cloudinary.com') || url.includes('.mp3')) return;
  e.respondWith(
    fetch(e.request).then(response => {
      if (response.ok && e.request.method === 'GET' && url.startsWith(self.location.origin)) {
        caches.open(CACHE).then(c => c.put(e.request, response.clone()));
      }
      return response;
    }).catch(() => caches.match(e.request))
  );
});
