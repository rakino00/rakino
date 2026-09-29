/* sw.js — deixa o site instalável (PWA) e abrindo offline.
   Estratégia: "stale-while-revalidate" para arquivos do próprio site (abre rápido do cache
   e atualiza em segundo plano). Firebase/Google nunca passam por aqui. */
const CACHE = 'rakino-v1';   // ← aumente (v2, v3…) se quiser forçar limpeza total do cache
const SHELL = ['./', 'index.html', 'assets/css/style.css', 'assets/js/main.js', 'assets/js/ui.js', 'assets/js/modal.js',
  'assets/js/auth.js', 'assets/js/notations.js', 'assets/js/firebase-config.js', 'manifest.webmanifest', 'assets/img/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(req);
    const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
    return cached || net;
  }));
});
