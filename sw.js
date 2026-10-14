/* sw.js — deixa o site instalável (PWA) e abrindo offline.
   Rede primeiro (alterações no GitHub aparecem na hora); o cache só serve de reserva offline.
   Firebase/Google e outras origens nunca passam por aqui.
   Aumente CACHE (v16, v17…) para forçar limpeza total. */
const CACHE = 'rakino-v15';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'data/web-projects.json',
  'assets/css/style.css',
  'assets/js/main.js', 'assets/js/ui.js', 'assets/js/modal.js', 'assets/js/auth.js', 'assets/js/profile.js',
  'assets/js/background.js', 'assets/js/catalog.js', 'assets/js/dock.js', 'assets/js/admin.js',
  'assets/js/notations.js', 'assets/js/chat.js', 'assets/js/python.js', 'assets/js/runner.js',
  'assets/js/records.js', 'assets/js/site-config.js', 'assets/js/firebase-config.js',
  'assets/img/icon.svg', 'assets/img/logo.png',
  'assets/sprites/saltador/player.png', 'assets/sprites/saltador/obstacles.png',
];

self.addEventListener('install', (e) => {
  // um arquivo faltando NÃO pode derrubar a instalação (addAll falharia por inteiro)
  e.waitUntil(caches.open(CACHE)
    .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req).then((hit) => hit || Response.error()))
  );
});
