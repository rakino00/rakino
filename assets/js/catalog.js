/**
 * catalog.js — de onde vêm os Web Projects e como viram cards.
 *
 * Fonte dos dados:
 *   1. data/web-projects.json  → gerado por tools/gerar_manifest.py a partir de web-projects/<pasta>/metadata.md
 *   2. coleção `webProjects` do Firestore → pode acrescentar/alterar, nunca esconde o que está no repositório.
 *
 * Para adicionar um projeto novo basta criar a pasta + metadata.md (o deploy gera o JSON).
 */
import * as Auth from './auth.js';
import { esc, toast } from './ui.js';
import { getRecord } from './records.js';

const DATA_FILE = { web: 'web-projects' };
const cache = {};

// Registros legados que não fazem mais parte do Rakino: filtrados também do Firestore,
// para que versões antigas não reapareçam no catálogo.
const RETIRED_IDS = new Set(['rakino-space', 'rakino-race-3d', 'aim-arena-3d', 'rakino-space-3d', 'rakino-race-3d-single-player']);
const RETIRED_TITLES = new Set(['rakino race 3d', 'rakino space 3d', 'rakino race 3d — single player', 'aim arena 3d — corredores']);
const RETIRED_PATTERN = /rakino[-_ ]space(?:[-_ ]3d)?|rakino[-_ ]race[-_ ]3d|aim[-_ ]arena[-_ ]3d/;

const isRetired = (p) => {
  const id = String(p.id || '').toLowerCase();
  const title = String(p.title || '').trim().toLowerCase();
  const file = String(p.file || '').toLowerCase();
  return RETIRED_IDS.has(id) || RETIRED_TITLES.has(title) || RETIRED_PATTERN.test(`${id} ${file} ${title}`);
};
const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999);

/** Descarta o cache em memória (use depois de salvar/excluir no painel admin). */
export const invalidate = (kind = 'web') => { delete cache[kind]; };
export const clearCache = () => Object.keys(cache).forEach((k) => delete cache[k]);

export async function getData(kind) {
  if (cache[kind]) return cache[kind];
  if (kind !== 'web') return [];

  let local = [];
  try {
    const res = await fetch(`data/${DATA_FILE[kind]}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    local = await res.json();
  } catch (err) {
    console.warn('[Rakino] falha ao ler JSON local', kind, err);
  }

  try {
    const { db, fs } = Auth.ctx();
    if (db && fs) {
      const snap = await fs.getDocs(fs.collection(db, 'webProjects'));
      const cloud = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.file && !isRetired(p));
      const merged = new Map(cloud.map((p) => [p.id, p]));
      local.forEach((p) => merged.set(p.id, { ...(merged.get(p.id) || {}), ...p }));   // o repositório tem precedência
      // deduplica pelo arquivo (ignora maiúsculas); em empate, vence quem está no repositório
      const unique = new Map();
      [...merged.values()].filter((p) => !isRetired(p)).forEach((p) => {
        const key = String(p.file || p.title || p.id).trim().toLowerCase();
        if (!unique.has(key) || local.some((l) => l.id === p.id)) unique.set(key, p);
      });
      return (cache[kind] = [...unique.values()].sort(byOrder));
    }
  } catch (err) {
    console.warn('[Rakino] Firestore webProjects indisponível:', err);
  }

  cache[kind] = local.sort(byOrder);
  if (!cache[kind].length) toast('Não consegui carregar os Web Projects.', 4000);
  return cache[kind];
}

/* ---------- capa gerada (SVG) ---------- */
const escSvg = (v) => String(v).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

function coverSVG(item) {
  const title = String(item.title || 'Web Project').slice(0, 42);
  const iconText = String(item.icon || '🌐');
  const tags = (item.tags || []).slice(0, 3).join(' · ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
    <defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#00f0ff"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
    <rect width="1200" height="675" fill="#080a0f"/><circle cx="1050" cy="100" r="330" fill="#a855f7" opacity=".20"/>
    <circle cx="150" cy="620" r="280" fill="#00f0ff" opacity=".12"/>
    <rect x="55" y="55" width="1090" height="565" rx="36" fill="#0f1420" stroke="url(#g)" stroke-width="3"/>
    <text x="100" y="190" font-size="100">${escSvg(iconText)}</text>
    <text x="100" y="330" fill="#e7e9ee" font-family="Arial,sans-serif" font-size="58" font-weight="700">${escSvg(title)}</text>
    <text x="100" y="400" fill="#9aa3b2" font-family="Arial,sans-serif" font-size="28">${escSvg(tags || 'Web Project')}</text>
    <text x="100" y="555" fill="#00f0ff" font-family="Arial,sans-serif" font-size="25">RAKINO • WEB PROJECTS</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/* ---------- cards ---------- */
/** É jogo? Basta ter a tag "jogo" no metadata.md — jogos abrem em página própria e mostram recorde. */
export const isGame = (item) => (item.tags || []).some((t) => String(t).toLowerCase() === 'jogo');

const recordCache = {};
async function recordBlock(item) {
  if (!isGame(item)) return '';
  const r = recordCache[item.id] || await getRecord(item.id);
  recordCache[item.id] = r;
  const has = r.score > 0;
  return `<div class="card-record"><span>🏆 Recorde</span><strong>${has ? esc(String(r.score)) : '—'}</strong><small>${esc(has ? r.name : 'ainda não registrado')}</small></div>`;
}

function creditLine(item) {
  const names = [...(item.creator ? [item.creator] : []), ...(item.creators || [])];
  return names.length ? `<p class="card-desc"><small>Por: ${esc(names.join(', '))}</small></p>` : '';
}

async function card(item, kind) {
  const game = isGame(item);
  const tags = kind === 'web'
    ? [`<span class="tag ok">.${esc(item.type || 'html')}</span>`, ...(item.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`)]
    : [];
  const inner = `<img class="card-image" src="${esc(item.cover || coverSVG(item))}" alt="Capa automática de ${esc(item.title)}" loading="lazy">
    <div class="card-body"><h3 class="card-title">${esc(item.title)}</h3><p class="card-desc">${esc(item.description || '')}</p>
    ${creditLine(item)}${await recordBlock(item)}<div class="card-tags">${tags.join('')}</div></div>`;
  return game
    ? `<a class="card game-card" href="${esc(item.file)}" data-game-card>${inner}</a>`
    : `<article class="card" role="button" tabindex="0" data-open data-kind="${kind}" data-id="${esc(item.id)}">${inner}</article>`;
}

const cards = async (list, kind) => (await Promise.all(list.map((i) => card(i, kind)))).join('');
export const gridOrEmpty = async (list, kind, empty) =>
  list.length ? `<div class="grid">${await cards(list, kind)}</div>` : `<p class="empty-state">${empty}</p>`;
