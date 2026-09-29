/**
 * main.js — orquestra o site: login, dock, rotas (#/aba/item), painéis e modais.
 *
 * Fluxo:  index.html → main.js → (Firebase Auth opcional) → painéis renderizados a
 *         partir de data/*.json  →  notations em tempo real via Firestore.
 */
import { $, esc, toast, icon, fmtDateBR } from './ui.js';
import { initModal, openModal, hideModal, isModalOpen } from './modal.js';
import * as Auth from './auth.js';
import * as Notes from './notations.js';

/* access: 'guest' = visitante vê · 'user' = precisa de login Google */
const TABS = [
  { id: 'home',        label: 'Início',       icon: 'home',    access: 'guest' },
  { id: 'web',         label: 'Web Projects', icon: 'globe',   access: 'guest' },
  { id: 'experiences', label: 'Experiences',  icon: 'compass', access: 'guest' },
  { id: 'notations',   label: 'Notations',    icon: 'note',    access: 'user'  },
  { id: 'python',      label: 'Python',       icon: 'python',  access: 'user'  },
  { id: 'tech',        label: 'Tech',         icon: 'chip',    access: 'user'  },
  { id: 'games',       label: 'Games',        icon: 'gamepad', access: 'user'  },
];
const tabDef = (id) => TABS.find((t) => t.id === id);
const EMOJI = { web: '🌐', tech: '💻', games: '🎮', experiences: '🧳' };
const DATA_FILE = { web: 'web-projects', experiences: 'experiences', tech: 'tech', games: 'games' };

const session = { ready: false, user: null, guest: sessionStorage.getItem('rakino_guest') === '1' };
const panels = {};
const rendered = new Set();
let activeTab = 'home';

/* ------------------------------ dados ------------------------------ */
const cache = {};
async function getData(kind) {
  if (cache[kind]) return cache[kind];
  try {
    const res = await fetch(`data/${DATA_FILE[kind]}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    cache[kind] = await res.json();
  } catch (err) {
    console.warn('[Rakino] falha ao ler dados', kind, err);
    toast('Não consegui carregar os dados. Abra o site por um servidor (não por file://).', 4000);
    return [];
  }
  return cache[kind];
}

/* ------------------------------ cards ------------------------------ */
function card(item, kind) {
  const cover = item.cover
    ? `<img class="card-image" src="${esc(item.cover)}" alt="" loading="lazy">`
    : `<div class="card-image ${kind}" aria-hidden="true">${esc(item.icon || EMOJI[kind])}</div>`;
  const tags = [];
  if (kind === 'web') tags.push(`<span class="tag ok">.${esc(item.type || 'html')}</span>`, ...(item.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`));
  if (kind === 'tech' || kind === 'games') {
    const ok = ['Finalizado', 'Beta'].includes(item.status);
    tags.push(`<span class="tag ${ok ? 'ok' : 'wip'}">${esc(item.status || '')}</span>`);
    if (item.engine) tags.push(`<span class="tag">${esc(item.engine)}</span>`);
  }
  if (kind === 'experiences' && item.date) tags.push(`<span class="tag">${fmtDateBR(item.date)}</span>`);
  return `<article class="card" role="button" tabindex="0" data-open data-kind="${kind}" data-id="${esc(item.id)}">
    ${cover}<div class="card-body">
      <h3 class="card-title">${esc(item.title)}</h3>
      <p class="card-desc">${esc(item.description || item.excerpt || '')}</p>
      <div class="card-tags">${tags.join('')}</div>
    </div></article>`;
}
const cards = (list, kind) => list.map((i) => card(i, kind)).join('');
const gridOrEmpty = (list, kind, emptyMsg) => list.length ? `<div class="grid">${cards(list, kind)}</div>` : `<p class="empty-state">${emptyMsg}</p>`;
const rowOrEmpty = (list, kind) => list.length ? `<div class="row-scroll">${cards(list.slice(0, 8), kind)}</div>` : '<p class="empty-state">Nada por aqui ainda.</p>';

/* ------------------------------ painéis ------------------------------ */
function buildPanels() {
  const main = $('#main');
  TABS.forEach((t) => {
    const s = document.createElement('section');
    s.id = 'tab-' + t.id; s.className = 'tab-panel';
    main.appendChild(s);
    panels[t.id] = s;
  });
  Notes.bind(panels.home);
  Notes.bind(panels.notations);
  Notes.mount(panels.notations);
  Notes.onChange(() => { const h = $('#homeNotes'); if (h) h.innerHTML = Notes.pendingHTML(5); });
}

async function renderTab(id) {
  const el = panels[id];
  if (id === 'home') return renderHome();
  if (id === 'notations' || rendered.has(id)) return;
  rendered.add(id);
  if (id === 'python') {
    el.innerHTML = `<div class="construction"><div class="big">🐍</div><h2>Python — em construção</h2>
      <p>Aqui vão ficar os projetos e automações em Python. Ainda estou preparando tudo com carinho.</p></div>`;
    return;
  }
  const list = await getData(id);
  const titles = {
    web: ['🌐', 'Web Projects', 'Páginas e apps simples rodando direto no navegador. Toque para abrir.'],
    experiences: ['🧳', 'Experiences', ''],
    tech: ['💻', 'Tech', ''],
    games: ['🎮', 'Games', ''],
  }[id];
  el.innerHTML = `<h2 class="section-title"><span class="accent">${titles[0]}</span> ${titles[1]}</h2>
    ${titles[2] ? `<p class="lead">${titles[2]}</p>` : ''}
    ${gridOrEmpty(list, id, id === 'web' ? 'Nenhum projeto ainda. Coloque um arquivo .html na pasta web-projects/ (veja docs/INSTRUCOES.md).' : 'Nada cadastrado ainda nesta seção.')}`;
}

async function renderHome() {
  const u = session.user;
  const [web, exp, tech, games] = await Promise.all([getData('web'), getData('experiences'), u ? getData('tech') : [], u ? getData('games') : []]);
  const first = u ? (u.displayName || '').split(' ')[0] : '';
  panels.home.innerHTML = `
    <div class="hero"><h1>${u ? `Olá${first ? ', ' + esc(first) : ''} 👋` : 'Bem-vindo ao Rakino ✦'}</h1>
      <p>${u ? 'Seu painel: tarefas, projetos e experiências.' : 'Você está no modo visitante. Entre com Google para liberar o resto.'}</p></div>
    ${u ? `<h2 class="section-title"><span class="accent">🗒</span> Tarefas pendentes</h2><div class="notation-list" id="homeNotes">${Notes.pendingHTML(5)}</div>` : ''}
    <h2 class="section-title"><span class="accent">🌐</span> Web Projects</h2>${rowOrEmpty(web, 'web')}
    <h2 class="section-title"><span class="accent">🧳</span> Experiences</h2>${rowOrEmpty(exp, 'experiences')}
    ${u ? `<h2 class="section-title"><span class="accent">💻</span> Tech</h2>${rowOrEmpty(tech, 'tech')}
           <h2 class="section-title"><span class="accent">🎮</span> Games</h2>${rowOrEmpty(games, 'games')}` : ''}`;
}

/* ------------------------------ modais de item ------------------------------ */
const bar = (title, extra = '') => `<div class="modal-bar"><div class="modal-title">${esc(title)}</div>${extra}
  <button class="icon-btn" data-close aria-label="Fechar">${icon('close')}</button></div>`;

function webModal(p) {
  const isPhp = /\.php$/i.test(p.file);
  const expand = isPhp ? '' : `<a class="icon-btn" href="${esc(p.file)}" title="Ampliar (abrir a página do projeto)" aria-label="Ampliar">${icon('expand')}</a>`;
  const body = isPhp
    ? `<div class="modal-body"><div class="notice"><strong>Este projeto usa PHP.</strong><br>O GitHub Pages só serve arquivos estáticos e não executa PHP, então ele não roda aqui. O código continua no repositório.</div></div>`
    : `<div class="modal-body frame-wrap"><div class="frame-loading">Carregando…</div>
        <iframe class="frame" src="${esc(p.file)}" title="${esc(p.title)}"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"></iframe></div>`;
  return `<div class="modal-box tall">${bar(p.title, expand)}${body}</div>`;
}

function experienceModal(x) {
  const gallery = (x.gallery || []).map((g) => `<img src="${esc(g)}" alt="" loading="lazy">`).join('');
  return `<div class="modal-box">${bar(x.title)}<div class="modal-body">
    ${x.cover ? `<img class="modal-cover" src="${esc(x.cover)}" alt="">` : ''}
    ${x.date ? `<p class="modal-note">${fmtDateBR(x.date)}</p>` : ''}
    <p style="white-space:pre-wrap">${esc(x.content || x.description || '')}</p>
    ${gallery ? `<div class="modal-gallery">${gallery}</div>` : ''}</div></div>`;
}

function projectModal(p) {
  // Regra do projeto: nunca fingir execução. Só README (texto), link real de demo ou download real.
  const actions = [];
  if (p.demo_url) actions.push(`<a class="btn btn-primary" href="${esc(p.demo_url)}" target="_blank" rel="noopener">↗ Abrir demonstração</a>`);
  if (p.download) actions.push(`<a class="btn" href="${esc(p.download)}" download>⬇ Download</a>`);
  return `<div class="modal-box">${bar(p.title)}<div class="modal-body">
    ${p.cover ? `<img class="modal-cover" src="${esc(p.cover)}" alt="">` : ''}
    <p class="modal-note">Status: ${esc(p.status || '—')}${p.engine ? ' · ' + esc(p.engine) : ''}</p>
    <p>${esc(p.content || p.description || '')}</p>
    ${p.readme ? `<h4>README</h4><div class="modal-readme">${esc(p.readme)}</div>` : (!p.demo_url ? '<p class="modal-note">Preview não disponível para este projeto.</p>' : '')}
    ${actions.length ? `<div class="modal-actions">${actions.join('')}</div>` : ''}</div></div>`;
}

async function showItem(kind, id, push) {
  const item = (await getData(kind)).find((x) => x.id === id);
  if (!item) { history.replaceState(null, '', `#/${kind}`); return; }
  const html = kind === 'web' ? webModal(item) : kind === 'experiences' ? experienceModal(item) : projectModal(item);
  const root = openModal(html, {
    hash: push ? `#/${kind}/${encodeURIComponent(id)}` : null,
    closeUrl: `#/${kind}`,
  });
  const frame = root.querySelector('iframe');
  if (frame) frame.addEventListener('load', () => root.querySelector('.frame-loading')?.classList.add('done'));
}

function askLogin(def) {
  openModal(`<div class="modal-box"><div class="sheet-grip"></div><div class="modal-body" style="text-align:center">
      <div style="font-size:2.4rem">🔒</div>
      <h3 style="margin:8px 0">${esc(def.label)} é área restrita</h3>
      <p class="modal-note">Entre com sua conta Google para liberar Notations, Tech, Games e o resto do site.</p>
      <div class="modal-actions" style="justify-content:center">
        <button class="btn btn-primary" id="askLoginBtn">Entrar com Google</button>
        <button class="btn" data-close>Agora não</button></div></div></div>`,
    { cls: 'sheet', closeUrl: '#/home' });
  $('#askLoginBtn').onclick = () => { hideModal(); goLogin(); };
}

/* ------------------------------ dock + rotas ------------------------------ */
function renderDock() {
  $('#dock').innerHTML = TABS.map((t) => {
    const locked = t.access === 'user' && !session.user;
    return `<button class="dock-item${locked ? ' locked' : ''}${t.id === activeTab ? ' active' : ''}" data-tab="${t.id}" data-label="${esc(t.label)}" aria-label="${esc(t.label)}${locked ? ' (requer login)' : ''}">${icon(t.icon)}<span class="tip">${esc(t.label)}</span></button>`;
  }).join('');
}

function activate(tab) {
  activeTab = tab;
  TABS.forEach((t) => panels[t.id].classList.toggle('active', t.id === tab));
  document.querySelectorAll('.dock-item').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  $('#fab').hidden = !(tab === 'notations' && session.user);
  renderTab(tab);
  window.scrollTo({ top: 0 });
}

function route() {
  if (!session.ready || $('#app').hidden) return;
  const [, t, rawId] = location.hash.split('/');
  let tab = tabDef(t) ? t : 'home';
  const def = tabDef(tab);
  const allowed = def.access === 'guest' || !!session.user;
  if (!allowed) { history.replaceState(null, '', '#/home'); tab = 'home'; askLogin(def); }
  activate(tab);
  const id = rawId ? decodeURIComponent(rawId) : '';
  if (id && allowed && DATA_FILE[tab]) { if (!isModalOpen()) showItem(tab, id, false); }
  else if (!allowed) { /* modal de login já aberto */ }
  else if (isModalOpen()) hideModal();
}

/* ------------------------------ sessão ------------------------------ */
function renderChip() {
  const u = session.user;
  $('#userChip').innerHTML = u
    ? `${u.photoURL ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">` : `<span class="avatar">${esc((u.displayName || u.email || '?')[0].toUpperCase())}</span>`}
       <span class="user-name">${esc(u.displayName || u.email || '')}</span>
       <button class="chip-btn" data-logout>Sair</button>`
    : `<span class="badge">Visitante</span><button class="chip-btn" data-login>Entrar</button>`;
}

function hideBoot() { const b = $('#boot'); if (!b) return; b.classList.add('done'); setTimeout(() => b.remove(), 400); }

function showLogin() {
  hideModal();
  $('#app').hidden = true;
  $('#login').hidden = false;
  const g = $('#btnGoogle'); const note = $('#loginNote');
  g.disabled = !Auth.isReady();
  note.hidden = Auth.isReady();
  note.textContent = Auth.isConfigured()
    ? 'Não consegui falar com o Google agora (sem internet?). Você pode entrar como visitante.'
    : 'Login Google ainda não configurado — veja docs/INSTRUCOES.md. Enquanto isso, use "Só visitar".';
}

function showApp() {
  $('#login').hidden = true;
  $('#app').hidden = false;
  rendered.delete('web'); rendered.delete('experiences'); rendered.delete('tech'); rendered.delete('games');
  renderChip(); renderDock();
  if (!location.hash) history.replaceState(null, '', '#/home');
  route();
}

function decide() {
  session.ready = true;
  hideBoot();
  (session.user || session.guest) ? showApp() : showLogin();
}

function goLogin() {
  session.guest = false;
  sessionStorage.removeItem('rakino_guest');
  showLogin();
}

/* ------------------------------ eventos globais ------------------------------ */
function bindGlobal() {
  $('#dock').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    const def = tabDef(b.dataset.tab);
    if (def.access === 'user' && !session.user) return askLogin(def);
    if (location.hash.split('/')[1] === def.id && !location.hash.split('/')[2]) return window.scrollTo({ top: 0, behavior: 'smooth' });
    location.hash = '#/' + def.id;
  });

  $('#main').addEventListener('click', (e) => {
    const c = e.target.closest('[data-open]');
    if (c) showItem(c.dataset.kind, c.dataset.id, true);
  });
  $('#main').addEventListener('keydown', (e) => {
    const c = e.target.closest('[data-open]');
    if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showItem(c.dataset.kind, c.dataset.id, true); }
  });

  $('#fab').addEventListener('click', () => Notes.openEditor());

  $('#userChip').addEventListener('click', async (e) => {
    if (e.target.closest('[data-logout]')) {
      try { await Auth.logout(); } catch (err) { toast('Erro ao sair.'); }
      sessionStorage.removeItem('rakino_guest'); session.guest = false;
    }
    if (e.target.closest('[data-login]')) goLogin();
  });

  $('#btnGoogle').addEventListener('click', async () => {
    try { await Auth.loginGoogle(); }
    catch (err) { console.error(err); toast('Não foi possível entrar: ' + (err.code || err.message), 4500); }
  });
  $('#btnGuest').addEventListener('click', () => {
    session.guest = true; sessionStorage.setItem('rakino_guest', '1'); decide();
  });

  window.addEventListener('hashchange', route);
}

/* ------------------------------ início ------------------------------ */
async function boot() {
  initModal();
  buildPanels();
  bindGlobal();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  await Auth.init();
  Auth.onUser((u) => {
    const changed = (u?.uid || null) !== (session.user?.uid || null);
    session.user = u || null;
    if (u) { if (changed) Notes.start(u); } else Notes.stop();
    if (changed || !session.ready) decide();
  });
  setTimeout(() => { if (!session.ready) decide(); }, 5000); // segurança (offline)
}
boot();
