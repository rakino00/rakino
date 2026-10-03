/* sw.js — deixa o site instalável (PWA) e abrindo offline.
   Estratégia: rede primeiro (alterações publicadas aparecem na hora); o cache é só fallback offline.
   Firebase/Google e outros domínios nunca passam por aqui. */
const CACHE = 'rakino-v14';   // ← aumente (v15, v16…) para forçar limpeza total do cache
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'data/web-projects.json',
  'assets/css/style.css', 'assets/img/icon.svg',
  'assets/js/main.js', 'assets/js/ui.js', 'assets/js/modal.js', 'assets/js/auth.js',
  'assets/js/notations.js', 'assets/js/profile.js', 'assets/js/chat.js',
  'assets/js/python.js', 'assets/js/runner.js', 'assets/js/firebase-config.js',
  'assets/sprites/saltador/player.png', 'assets/sprites/saltador/obstacles.png',
];

self.addEventListener('install', (e) => {
  // allSettled: se um arquivo faltar, o resto continua sendo guardado (addAll falharia inteiro).
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) =>
          cached || (req.mode === 'navigate' ? caches.match('index.html') : null) || Response.error()
        )
      )
  );
});
