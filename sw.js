/* sw.js — deixa o site instalável (PWA) e abrindo offline.
   Estratégia: "stale-while-revalidate" para arquivos do próprio site (abre rápido do cache
   e atualiza em segundo plano). Firebase/Google nunca passam por aqui. */
const CACHE = 'rakino-v12';   // ← aumente (v2, v3…) se quiser forçar limpeza total do cache
const SHELL = ['./', 'index.html', 'assets/css/style.css', 'assets/js/main.js', 'assets/js/ui.js', 'assets/js/modal.js',
  'assets/js/auth.js', 'assets/js/notations.js', 'assets/js/profile.js', 'assets/js/chat.js', 'assets/js/python.js', 'assets/js/runner.js', 'assets/js/firebase-config.js', 'manifest.webmanifest', 'assets/img/icon.svg', 'assets/sprites/saltador/player.png', 'assets/sprites/saltador/obstacles.png', 'Raki/index.html', 'Raki/assets/sprites/player/player.png', 'web-projects/acordePlus.html', 'web-projects/RakinoFood.html', 'web-projects/rakino-race.html', 'web-projects/takamae-vesikika.html', 'web-projects/puzzle-suffers.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Rede primeiro para que alterações publicadas no GitHub apareçam imediatamente.
  // O cache serve apenas como fallback quando estiver offline.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || Response.error()))
  );
});
