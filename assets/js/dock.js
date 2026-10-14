/**
 * dock.js — barra de seções (embaixo) e o menu "radial" que abre ao passar o mouse.
 *
 * O dock não conhece o resto do site: recebe tudo por `initDock(api)` (veja main.js).
 *   api.tabs            lista de abas (TABS)
 *   api.tabDef(id)      busca uma aba
 *   api.session         { user }
 *   api.isAdmin()       true se for o administrador
 *   api.getActive()     id da aba ativa
 *   api.getData(kind)   catálogo de Web Projects
 *   api.openProject(id) abre um projeto no modal
 *   api.askLogin(def)   mostra o aviso de "área restrita"
 *   api.goLogin()       volta para a tela de login
 */
import { $, esc, icon } from './ui.js';
import * as Notes from './notations.js';

let api;
let hoverTimer = 0;
let hoverToken = 0;
const PULSE_IMG = 'assets/img/dock-pulse.gif';

/* ---------- barra principal ---------- */
export function renderDock() {
  $('#dock').innerHTML = api.tabs.filter((t) => t.id !== 'admin' || api.isAdmin()).map((t) => {
    const locked = t.access === 'user' && !api.session.user;
    return `<button class="dock-item${locked ? ' locked' : ''}${t.id === api.getActive() ? ' active' : ''}" data-tab="${t.id}" data-label="${esc(t.label)}" aria-label="${esc(t.label)}${locked ? ' (requer login)' : ''}">${icon(t.icon)}<span class="tip">${esc(t.label)}</span></button>`;
  }).join('');
  bindHover();
}

export function markActive(tab) {
  document.querySelectorAll('.dock-item').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
}

/* ---------- menu radial ---------- */
const initials = (title = '') => {
  const words = String(title).replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'R';
  return (words.length === 1 ? words[0].slice(0, 2) : words.slice(0, 2).map((w) => w[0]).join('')).toUpperCase();
};

const orb = (text, cls = '') => `<div class="dock-project-orb ${cls}"><span>${esc(text)}</span><img src="${PULSE_IMG}" alt="" aria-hidden="true"></div>`;

const radialButton = ({ action, label, media, cls = '' }) =>
  `<button class="dock-radial-item ${cls}" data-radial-action="${esc(action)}" title="${esc(label)}" aria-label="${esc(label)}">${media}<span class="dock-radial-label">${esc(label)}</span></button>`;

async function radialItems(tab) {
  const { user } = api.session;
  const pending = () => (Notes.getPending ? Notes.getPending() : []);

  if (tab === 'web') {
    const list = await api.getData('web');
    return list.map((p) => radialButton({ action: `web:${p.id}`, label: p.title, media: orb(initials(p.title)), cls: 'dock-web-preview' })).join('');
  }
  if (tab === 'python') return radialButton({ action: 'tab:python', label: 'Automações', media: orb('PY', 'python'), cls: 'dock-python-preview' });
  if (tab === 'notations') {
    if (!user) return radialButton({ action: 'login:notations', label: 'Entrar para ver anotações', media: orb('🔒', 'locked'), cls: 'dock-note-preview-card' });
    const list = pending();
    if (!list.length) return radialButton({ action: 'tab:notations', label: 'Nenhuma anotação em aberto', media: orb('✓', 'empty'), cls: 'dock-note-preview-card' });
    return list.map((n) => radialButton({ action: `note:${n.id}`, label: n.title || 'Anotação', media: orb(initials(n.title || 'Nota'), 'note'), cls: 'dock-note-preview-card' })).join('');
  }
  if (tab === 'home') {
    const items = [radialButton({ action: 'tab:python', label: 'Automações', media: orb('PY', 'python'), cls: 'dock-category-card' })];
    if (user && pending().length) items.push(radialButton({ action: 'tab:notations', label: 'Anotações e tarefas pendentes', media: orb('NO', 'note'), cls: 'dock-category-card' }));
    return items.join('');
  }
  if (tab === 'admin') return radialButton({ action: 'tab:admin', label: 'Painel administrativo', media: orb('⚙'), cls: 'dock-category-card' });
  return '';
}

export function closeRadial() {
  const radial = $('#dockRadial');
  if (!radial) return;
  radial.classList.remove('open');
  radial.setAttribute('aria-hidden', 'true');
  radial.innerHTML = '';
}
/** Fecha o radial se o mouse não estiver em cima dele. */
export const closeRadialIfIdle = () => { if (!$('#dockRadial')?.matches(':hover')) closeRadial(); };

async function openRadial(anchor) {
  const radial = $('#dockRadial');
  if (!radial) return;
  clearTimeout(hoverTimer);
  const token = ++hoverToken;
  radial.innerHTML = '<div class="dock-radial-loading">Abrindo…</div>';
  radial.classList.add('open');
  radial.setAttribute('aria-hidden', 'false');
  const html = await radialItems(anchor.dataset.tab);
  if (token !== hoverToken) return;                      // o mouse já foi para outro ícone
  radial.innerHTML = html || '<div class="dock-radial-loading">Nada disponível.</div>';
  const rect = anchor.getBoundingClientRect();
  radial.style.left = `${Math.max(12, Math.min(innerWidth - 12, rect.left + rect.width / 2))}px`;
}

function bindHover() {
  document.querySelectorAll('#dock .dock-item').forEach((btn) => {
    btn.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => openRadial(btn), 90); });
    btn.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeRadialIfIdle, 180); });
  });
}

function bindRadial() {
  const radial = $('#dockRadial');
  radial.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
  radial.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeRadial, 180); });
  radial.addEventListener('click', (e) => {
    const b = e.target.closest('[data-radial-action]');
    if (!b) return;
    const action = b.dataset.radialAction || '';
    closeRadial();
    if (action.startsWith('web:')) return api.openProject(action.slice(4));
    if (action.startsWith('note:')) {
      if (!api.session.user) return api.goLogin();
      location.hash = '#/notations';
      return setTimeout(() => Notes.openEditor(action.slice(5)), 0);
    }
    if (action.startsWith('login:')) return api.askLogin(api.tabDef(action.slice(6)) || api.tabDef('notations'));
    if (action.startsWith('tab:')) {
      const tab = action.slice(4), def = api.tabDef(tab);
      if (def?.access === 'user' && !api.session.user) return api.askLogin(def);
      if (def?.access === 'admin' && !api.isAdmin()) return;
      location.hash = `#/${tab}`;
    }
  });
}

/** Clique no dock: navega (ou pede login). */
function bindClicks() {
  $('#dock').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    const def = api.tabDef(b.dataset.tab);
    if (def.access === 'user' && !api.session.user) return api.askLogin(def);
    if (def.access === 'admin' && !api.isAdmin()) return;
    location.hash = '#/' + def.id;
  });
}

export function initDock(deps) {
  api = deps;
  bindRadial();
  bindClicks();
}
