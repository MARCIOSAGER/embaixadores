const CACHE_NAME = 'embaixadores-v3';
const STATIC_ASSETS = ['/', '/index.html', '/logo-legendarios.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Skip non-GET and Supabase API calls
  if (request.method !== 'GET' || request.url.includes('supabase.co')) return;

  const url = new URL(request.url);

  // Network-first para o HTML (navegação) e para os bundles JS/CSS versionados
  // do Vite (caminhos /assets/*). Assim cada deploy invalida o cache automaticamente.
  const isNavigation = request.mode === 'navigate' || request.destination === 'document';
  const isBuildAsset = url.pathname.startsWith('/assets/');

  if (isNavigation || isBuildAsset) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first para o resto (imagens, fontes, logo)
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
