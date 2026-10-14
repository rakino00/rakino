/**
 * main.js — maestro do Rakino: abas, rotas (#/aba/id), login e inicialização.
 * A lógica de cada parte mora no seu módulo:
 *   catalog.js  lista de Web Projects e cards     dock.js   barra inferior + menu radial
 *   admin.js    painel do administrador           profile.js  perfil e temas (background.js = tema interativo)
 *   notations.js / chat.js / python.js / runner.js  seções e mini jogo
 * Admin: somente ADMIN_EMAIL (a proteção real de escrita está em firestore.rules).
 */
import { $, esc, toast, icon } from './ui.js';
import { initModal, openModal, hideModal, isModalOpen } from './modal.js';
import * as Auth from './auth.js';
import * as Notes from './notations.js';
import * as Profile from './profile.js';
import * as Chat from './chat.js';
import { renderPython, bindPython } from './python.js';
import { mountRunner } from './runner.js';
import { getData, gridOrEmpty, clearCache } from './catalog.js';
import { initDock, renderDock, markActive, closeRadialIfIdle } from './dock.js';
import { initAdmin, renderAdmin } from './admin.js';
import { LOGO_SRC, LOGO_FALLBACK } from './site-config.js';

const ADMIN_EMAIL = 'rakifernn@gmail.com';

const TABS = [
  { id: 'home', label: 'Início', icon: 'home', access: 'guest' },
  { id: 'web', label: 'Web Projects', icon: 'globe', access: 'guest' },
  { id: 'notations', label: 'Notations', icon: 'note', access: 'user' },
  { id: 'python', label: 'Automações', icon: 'python', access: 'guest' },
  { id: 'admin', label: 'Admin', icon: 'settings', access: 'admin' },
];
const tabDef = (id) => TABS.find((t) => t.id === id);

const session = { ready: false, user: null, guest: sessionStorage.getItem('rakino_guest') === '1' };
const panels = {};
const rendered = new Set();     // abas já desenhadas (evita refazer ao navegar)
let activeTab = 'home';
let openItemId = null;          // projeto aberto no modal

const isAdmin = () => session.user?.email?.toLowerCase() === ADMIN_EMAIL;

/* ---------- abas ---------- */
function buildPanels() {
  const main = $('#main');
  TABS.forEach((t) => {
    const s = document.createElement('section');
    s.id = 'tab-' + t.id; s.className = 'tab-panel';
    main.appendChild(s); panels[t.id] = s;
  });
  Notes.bind(panels.notations); Notes.mount(panels.notations);
  Notes.onChange(() => {
    const h = $('#homeNotes'); if (h) h.innerHTML = Notes.pendingHTML(5);
    renderDock(); closeRadialIfIdle();
  });
}

async function renderTab(id) {
  const el = panels[id];
  if (id === 'home') return renderHome();
  if (id === 'notations') return;
  if (id === 'admin') return renderAdmin(el);
  if (rendered.has(id)) return;
  rendered.add(id);
  if (id === 'python') { el.innerHTML = renderPython(); bindPython(el); return; }
  const list = await getData('web');
  el.innerHTML = `<h2 class="section-title"><span class="accent">🌐</span> Web Projects</h2>
    <p class="lead">Páginas e apps simples rodando direto no navegador.</p>
    ${await gridOrEmpty(list, 'web', 'Nenhum projeto cadastrado.')}`;
}

async function renderHome() {
  const u = session.user;
  const name = u ? (u.displayName || u.email || 'Usuário Rakino') : 'estranho';
  panels.home.innerHTML = `<div class="hero home-identity"><h1>${esc(name)}</h1></div>
    ${u ? `<h2 class="section-title"><span class="accent">🗒</span> Anotações e tarefas pendentes</h2><div class="notation-list" id="homeNotes">${Notes.pendingHTML(5)}</div>` : ''}
    <section class="runner-wrap" id="homeRunner"></section>`;
  mountRunner($('#homeRunner'));
}

/** Troca a aba visível. Se mudou, avisa o fundo interativo e define de que lado a seção entra. */
function activate(tab) {
  const prev = TABS.findIndex((t) => t.id === activeTab), next = TABS.findIndex((t) => t.id === tab);
  const changed = tab !== activeTab;
  activeTab = tab;
  TABS.forEach((t) => panels[t.id].classList.toggle('active', t.id === tab));
  markActive(tab);
  $('#fab').hidden = !(tab === 'notations' && session.user);
  renderTab(tab);
  window.scrollTo({ top: 0 });
  if (changed) {
    const dir = Math.sign(next - prev);
    document.documentElement.style.setProperty('--nav-dx', `${dir * 36}px`);
    window.dispatchEvent(new CustomEvent('rakino:pulse', { detail: { dir, x: innerWidth / 2, y: innerHeight } }));
  }
}

/* ---------- modal de projeto ---------- */
const barHTML = (title, extra = '') =>
  `<div class="modal-bar"><div class="modal-title">${esc(title)}</div>${extra}<button class="icon-btn" data-close aria-label="Fechar">${icon('close')}</button></div>`;

function webModal(p) {
  const file = p.file || '';
  const expand = `<a class="icon-btn" href="${esc(file)}" title="Abrir projeto" aria-label="Abrir">${icon('expand')}</a>`;
  return `<div class="modal-box tall">${barHTML(p.title, expand)}<div class="modal-body frame-wrap"><div class="frame-loading">Carregando…</div>
    <iframe class="frame" src="${esc(file + (file.includes('?') ? '&' : '?') + 'embed=1')}" title="${esc(p.title)}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"></iframe></div></div>`;
}

async function showItem(id, push) {
  const item = (await getData('web')).find((x) => x.id === id);
  if (!item) { history.replaceState(null, '', '#/web'); return; }
  const root = openModal(webModal(item), {
    hash: push ? `#/web/${encodeURIComponent(id)}` : null,
    closeUrl: '#/web',
    onClose: () => { if (openItemId === id) openItemId = null; },
  });
  openItemId = id;
  root.querySelector('iframe')?.addEventListener('load', () => root.querySelector('.frame-loading')?.classList.add('done'));
}

/* ---------- login ---------- */
function goLogin() { session.guest = false; sessionStorage.removeItem('rakino_guest'); showLogin(); }

function askLogin(def) {
  openModal(`<div class="modal-box"><div class="modal-body" style="text-align:center"><div style="font-size:2.4rem">🔒</div>
    <h3>${esc(def.label)} é área restrita</h3><p class="modal-note">Entre com sua conta Google para acessar suas Notations.</p>
    <div class="modal-actions" style="justify-content:center"><button class="btn btn-primary" id="askLoginBtn">Entrar com Google</button><button class="btn" data-close>Agora não</button></div></div></div>`,
  { cls: 'sheet', closeUrl: '#/home' });
  $('#askLoginBtn').onclick = () => { hideModal(); goLogin(); };
}

function showLogin() {
  hideModal(); $('#app').hidden = true; $('#login').hidden = false;
  const g = $('#btnGoogle'), note = $('#loginNote');
  g.disabled = !Auth.isReady(); note.hidden = Auth.isReady();
  note.textContent = Auth.isConfigured() ? 'Não consegui falar com o Google agora.' : 'Login Google ainda não configurado — confira o Firebase.';
}
function showApp() {
  $('#login').hidden = true; $('#app').hidden = false;
  rendered.clear(); clearCache();
  renderChip(); renderDock();
  if (!location.hash) history.replaceState(null, '', '#/home');
  route();
}
function decide() { session.ready = true; hideBoot(); (session.user || session.guest) ? showApp() : showLogin(); }

function renderChip() {
  const u = session.user;
  $('#userChip').innerHTML = u
    ? `<button class="profile-chip" data-profile title="Abrir perfil">${u.photoURL ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">` : `<span class="avatar">${esc((u.displayName || u.email || '?')[0].toUpperCase())}</span>`}
       <span class="user-name">${esc(u.displayName || u.email || '')}</span>${isAdmin() ? '<span class="badge">ADMIN</span>' : ''}</button><button class="chip-btn" data-logout>Sair</button>`
    : `<span class="badge">Visitante</span><button class="chip-btn" data-login>Entrar</button>`;
}

/* ---------- rotas: #/aba  ou  #/web/<id> ---------- */
function route() {
  if (!session.ready || $('#app').hidden) return;
  const [, t, rawId] = location.hash.split('/');
  let tab = tabDef(t) ? t : 'home';
  const def = tabDef(tab);
  const allowed = def.access === 'guest' || (def.access === 'user' && !!session.user) || (def.access === 'admin' && isAdmin());
  if (!allowed) { history.replaceState(null, '', '#/home'); tab = 'home'; askLogin(def); }
  activate(tab);
  const id = rawId ? decodeURIComponent(rawId) : '';
  if (id && allowed && tab === 'web' && (!isModalOpen() || openItemId !== id)) showItem(id, false);
  else if (!id && isModalOpen()) hideModal();
}

/* ---------- inicialização ---------- */
const applyLogo = () => document.querySelectorAll('[data-site-logo]').forEach((img) => {
  img.src = LOGO_SRC;
  img.onerror = () => { img.onerror = null; img.src = LOGO_FALLBACK; };
});
function hideBoot() { const b = $('#boot'); if (!b) return; b.classList.add('done'); setTimeout(() => b.remove(), 400); }

function bindGlobal() {
  initDock({
    tabs: TABS, tabDef, session, isAdmin, getActive: () => activeTab, getData,
    openProject: (id) => showItem(id, true), askLogin, goLogin,
  });
  initAdmin({
    getUser: () => (isAdmin() ? session.user : null),
    onChanged: () => rendered.delete('web'),
  });
  $('#themeToggle').onclick = () => {
    const next = document.documentElement.dataset.mode === 'light' ? 'dark' : 'light';
    Profile.saveColorMode(session.user, next);
  };
  $('#main').addEventListener('click', (e) => { const c = e.target.closest('[data-open]'); if (c) showItem(c.dataset.id, true); });
  $('#main').addEventListener('keydown', (e) => {
    const c = e.target.closest('[data-open]');
    if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showItem(c.dataset.id, true); }
  });
  $('#fab').addEventListener('click', () => Notes.openEditor());
  $('#userChip').addEventListener('click', async (e) => {
    if (e.target.closest('[data-profile]')) return Profile.openProfile(session.user);
    if (e.target.closest('[data-logout]')) {
      try { await Auth.logout(); } catch { toast('Erro ao sair.'); }
      sessionStorage.removeItem('rakino_guest'); session.guest = false;
    }
    if (e.target.closest('[data-login]')) goLogin();
  });
  $('#btnGoogle').addEventListener('click', async () => {
    try { await Auth.loginGoogle(); } catch (err) { console.error(err); toast('Não foi possível entrar: ' + (err.code || err.message), 4500); }
  });
  $('#btnGuest').addEventListener('click', () => { session.guest = true; sessionStorage.setItem('rakino_guest', '1'); decide(); });
  window.addEventListener('hashchange', route);
}

async function boot() {
  applyLogo();
  Profile.applySavedTheme();        // tema + modo de cor salvos neste aparelho (a conta sobrescreve depois, se houver login)
  initModal(); buildPanels(); bindGlobal();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

  // Se o CDN do Firebase demorar ou estiver bloqueado, o site abre mesmo assim (modo visitante).
  const fallback = setTimeout(() => { if (!session.ready) decide(); }, 6000);
  const initP = Auth.init();
  await Promise.race([initP, new Promise((r) => setTimeout(() => r(false), 6000))]);
  clearTimeout(fallback);

  const onUser = async (u) => {
    const changed = (u?.uid || null) !== (session.user?.uid || null);
    session.user = u || null;
    if (u) { if (changed) Notes.start(u); await Profile.loadForUser(u); Chat.start(u); }
    else { Notes.stop(); Chat.stop(); Profile.applySavedTheme(); }
    if (changed || !session.ready) { renderChip(); renderDock(); decide(); }
  };
  Auth.onUser(onUser);
  if (!Auth.isReady()) initP.then((ok) => { if (ok) Auth.onUser(onUser); });
}
boot();
