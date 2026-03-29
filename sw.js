// RPM Pro — Service Worker com auto-atualização
// Estratégia: Network-first para JS/CSS/HTML, cache como fallback
// Nunca mais CTRL+SHIFT+R

const CACHE_NAME = 'rpmpro-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/login.html',
  '/css/style.css',
  '/manifest.json',
  '/img/icon-192.svg'
];

// Instala: cacheia o app shell básico
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Ativa: limpa caches antigos e toma controle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first — sempre busca do servidor, cache só como fallback offline
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Não cachear: API Supabase, auth, analytics, extensões externas
  if (url.origin !== location.origin) return;
  if (e.request.method !== 'GET') return;

  // HTML, JS, CSS → network-first (sempre atualizado)
  if (e.request.destination === 'document' ||
      e.request.destination === 'script' ||
      e.request.destination === 'style' ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css')) {

    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Atualiza o cache com a versão nova
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)) // Offline: usa cache
    );
    return;
  }

  // Imagens e outros assets → stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// Escuta mensagem pra forçar atualização
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
