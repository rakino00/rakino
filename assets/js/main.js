/**
 * main.js — Rakino
 * Seções atuais: Início, Web Projects, Notations e Python.
 * Admin: somente rakifernn@gmail.com.
 */
import { $, esc, toast, icon, fmtDateBR } from './ui.js';
import { initModal, openModal, hideModal, isModalOpen } from './modal.js';
import * as Auth from './auth.js';
import * as Notes from './notations.js';
import { renderPython, bindPython } from './python.js';

const ADMIN_EMAIL = 'rakifernn@gmail.com';

const TABS = [
  { id: 'home', label: 'Início', icon: 'home', access: 'guest' },
  { id: 'web', label: 'Web Projects', icon: 'globe', access: 'guest' },
  { id: 'notations', label: 'Notations', icon: 'note', access: 'user' },
  { id: 'python', label: 'Python', icon: 'python', access: 'guest' },
  { id: 'admin', label: 'Admin', icon: 'settings', access: 'admin' },
];
const tabDef = (id) => TABS.find((t) => t.id === id);
const EMOJI = { web: '🌐' };
const DATA_FILE = { web: 'web-projects' };
const session = { ready: false, user: null, guest: sessionStorage.getItem('rakino_guest') === '1' };
const panels = {};
const rendered = new Set();
let activeTab = 'home';
const cache = {};

const isAdmin = () => session.user?.email?.toLowerCase() === ADMIN_EMAIL;

function coverSVG(item) {
  const title = String(item.title || 'Web Project').slice(0, 42);
  const iconText = String(item.icon || '🌐');
  const tags = (item.tags || []).slice(0, 3).join(' · ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
    <defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#00f0ff"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
    <rect width="1200" height="675" fill="#080a0f"/><circle cx="1050" cy="100" r="330" fill="#a855f7" opacity=".20"/>
    <circle cx="150" cy="620" r="280" fill="#00f0ff" opacity=".12"/>
    <rect x="55" y="55" width="1090" height="565" rx="36" fill="#0f1420" stroke="url(#g)" stroke-width="3"/>
    <text x="100" y="190" font-size="100">${iconText}</text>
    <text x="100" y="330" fill="#e7e9ee" font-family="Arial,sans-serif" font-size="58" font-weight="700">${escSvg(title)}</text>
    <text x="100" y="400" fill="#9aa3b2" font-family="Arial,sans-serif" font-size="28">${escSvg(tags || 'Web Project')}</text>
    <text x="100" y="555" fill="#00f0ff" font-family="Arial,sans-serif" font-size="25">RAKINO • WEB PROJECTS</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
function escSvg(v) { return String(v).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }

const GITHUB = {
  owner: 'rakino00',
  repo: 'rakino',
  branch: 'main',
  root: 'web-projects',
};

function githubApi(path) {
  return `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path}?ref=${encodeURIComponent(GITHUB.branch)}&t=${Date.now()}`;
}

async function githubJSON(path) {
  const res = await fetch(githubApi(path), {
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${path}`);
  return res.json();
}

async function githubText(file) {
  const url = file.download_url || `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${GITHUB.branch}/${file.path}`;
  const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`README ${res.status}: ${file.path}`);
  return res.text();
}

function scalar(v) {
  const value = String(v ?? '').trim();
  if (!value) return '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1,-1);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function parseListValue(v) {
  const value = String(v ?? '').trim();
  if (!value) return [];
  if (value.startsWith('[') && value.endsWith(']')) {
    try { return JSON.parse(value.replace(/'/g, '"')); } catch { return value.slice(1,-1).split(',').map(x=>x.trim()).filter(Boolean); }
  }
  return [scalar(value)];
}

function parseProjectMD(text) {
  const out = {};
  const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  let body = String(text || '');
  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
    if (end > 0) {
      body = lines.slice(end + 1).join('\n').trim();
      let activeList = null;
      for (const line of lines.slice(1, end)) {
        if (!line.trim() || line.trim().startsWith('#')) continue;
        const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (m) {
          const key = m[1];
          const raw = m[2].trim();
          if (raw === '') { out[key] = []; activeList = key; continue; }
          out[key] = ['tags','creators','technologies','features'].includes(key) ? parseListValue(raw) : scalar(raw);
          activeList = null;
          continue;
        }
        const item = line.match(/^\s+-\s+(.*)$/);
        if (item && activeList) out[activeList].push(scalar(item[1]));
      }
    }
  }
  out.body = body;
  out.creators = Array.isArray(out.creators) ? out.creators : (out.creators ? [out.creators] : []);
  for (const key of ['tags','technologies','features']) out[key] = Array.isArray(out[key]) ? out[key] : (out[key] ? [out[key]] : []);
  return out;
}

function extOf(path='') {
  const m = String(path).match(/\.([^.\/]+)$/);
  return m ? m[1].toLowerCase() : '';
}

function resolveRepoURL(path='') {
  return `https://${GITHUB.owner}.github.io/${GITHUB.repo}/${path.replace(/^\//,'')}`;
}

function resolveCover(meta, dirEntries, projectPath) {
  const wanted = meta.cover || meta.thumbnail;
  if (wanted) {
    if (/^https?:\/\//i.test(wanted) || wanted.startsWith('data:')) return wanted;
    const clean = String(wanted).replace(/^\.\//,'');
    return resolveRepoURL(`${projectPath}/${clean}`);
  }
  const image = dirEntries.find(f => f.type === 'file' && /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name));
  return image ? resolveRepoURL(image.path) : '';
}

async function discoverWebProjects() {
  const dirs = await githubJSON(GITHUB.root);
  const projectDirs = (Array.isArray(dirs) ? dirs : []).filter(x => x.type === 'dir');
  const found = [];

  for (const dir of projectDirs) {
    try {
      const entries = await githubJSON(dir.path);
      const md = entries.find(x => x.type === 'file' && x.name.toLowerCase() === 'project.md');
      if (!md) continue;
      const raw = await githubText(md);
      const meta = parseProjectMD(raw);
      const entry = String(meta.entry || 'index.html').replace(/^\.\//,'');
      const entryFile = entries.find(x => x.type === 'file' && x.name === entry) || entries.find(x => x.type === 'file' && x.name.toLowerCase() === 'index.html');
      if (!entryFile) continue;
      const project = {
        id: dir.name,
        path: dir.path,
        title: meta.title || dir.name,
        description: meta.description || meta.body?.split(/\n\s*\n/)[0] || 'Protótipo web.',
        creators: meta.creators,
        icon: meta.icon || '🌐',
        type: meta.type || extOf(entryFile.name) || 'web',
        tags: meta.tags,
        technologies: meta.technologies,
        features: meta.features,
        status: meta.status || 'prototype',
        version: meta.version || '',
        updated: meta.updated || '',
        entry,
        file: resolveRepoURL(`${dir.path}/${entry}`),
        cover: resolveCover(meta, entries, dir.path),
        files: entries.filter(x => x.type === 'file').map(x => x.name),
        repoPath: `https://github.com/${GITHUB.owner}/${GITHUB.repo}/tree/${GITHUB.branch}/${dir.path}`,
      };
      found.push(project);
    } catch (err) {
      console.warn('[Rakino] Projeto ignorado:', dir.path, err);
    }
  }
  return found.sort((a,b) => a.title.localeCompare(b.title, 'pt-BR'));
}

async function getData(kind, force=false) {
  if (kind !== 'web') return [];
  if (!force && cache[kind]) return cache[kind];
  try {
    cache[kind] = await discoverWebProjects();
  } catch (err) {
    console.error('[Rakino] Não foi possível descobrir Web Projects:', err);
    cache[kind] = [];
    toast('Não consegui ler a pasta web-projects do GitHub.', 5000);
  }
  return cache[kind];
}

function refreshWebProjects() {
  delete cache.web;
  rendered.delete('web');
  renderTab('web');
  if (activeTab === 'home') renderHome();
}

function card(item, kind) {
  const cover = item.cover || coverSVG(item);
  const tags = kind === 'web'
    ? [`<span class="tag ok">.${esc(item.type || 'web')}</span>`, ...(item.tags || []).slice(0,5).map(t => `<span class="tag">${esc(t)}</span>`)]
    : [];
  const creators = (item.creators || []).join(', ');
  return `<article class="card" role="button" tabindex="0" data-open data-kind="${kind}" data-id="${esc(item.id)}">
    <div class="card-cover-wrap"><img class="card-image" src="${esc(cover)}" alt="Capa de ${esc(item.title)}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('fallback')"><span class="cover-icon">${esc(item.icon || '🌐')}</span></div>
    <div class="card-body"><h3 class="card-title">${esc(item.title)}</h3>
    <p class="card-desc">${esc(item.description || '')}</p>
    ${creators ? `<p class="card-meta">${esc(creators)}</p>` : ''}
    <div class="card-tags">${tags.join('')}</div></div></article>`;
}

const cards = (list, kind) => list.map(i => card(i, kind)).join('');
const gridOrEmpty = (list, kind, empty) => list.length ? `<div class="grid">${cards(list, kind)}</div>` : `<p class="empty-state">${empty}</p>`;
const rowOrEmpty = (list, kind) => list.length ? `<div class="row-scroll">${cards(list.slice(0,8), kind)}</div>` : '<p class="empty-state">Nada por aqui ainda.</p>';

function buildPanels() {
  const main = $('#main');
  TABS.forEach(t => {
    const s = document.createElement('section');
    s.id = 'tab-' + t.id; s.className = 'tab-panel'; main.appendChild(s); panels[t.id] = s;
  });
  Notes.bind(panels.notations); Notes.mount(panels.notations);
  Notes.onChange(() => { const h = $('#homeNotes'); if (h) h.innerHTML = Notes.pendingHTML(5); });
}

async function renderTab(id) {
  const el = panels[id];
  if (id === 'home') return renderHome();
  if (id === 'notations') return;
  if (id === 'python') {
    if (rendered.has(id)) return;
    rendered.add(id); el.innerHTML = renderPython(); bindPython(el); return;
  }
  if (id === 'admin') { return renderAdmin(el); }
  if (rendered.has(id)) return;
  rendered.add(id);
  const list = await getData(id);
  el.innerHTML = `<div class="section-head"><div><h2 class="section-title"><span class="accent">🌐</span> Web Projects</h2><p class="lead">Cada pasta com <code>project.md</code> aparece automaticamente.</p></div><button class="btn" data-refresh-web>↻ Atualizar</button></div>${gridOrEmpty(list, id, 'Nenhum projeto com project.md válido.')}`;
}

async function renderHome() {
  const web = await getData('web');
  const u = session.user, first = u ? (u.displayName || '').split(' ')[0] : '';
  panels.home.innerHTML = `<div class="hero"><h1>${u ? `Olá${first ? ', ' + esc(first) : ''} 👋` : 'Bem-vindo ao Rakino ✦'}</h1>
    <p>${u ? 'Seu painel pessoal de projetos e notations.' : 'Projetos, Python e suas notations.'}</p></div>
    ${u ? `<h2 class="section-title"><span class="accent">🗒</span> Tarefas pendentes</h2><div class="notation-list" id="homeNotes">${Notes.pendingHTML(5)}</div>` : ''}
    <h2 class="section-title"><span class="accent">🌐</span> Web Projects</h2>${rowOrEmpty(web,'web')}`;
}

const bar = (title, extra='') => `<div class="modal-bar"><div class="modal-title">${esc(title)}</div>${extra}<button class="icon-btn" data-close aria-label="Fechar">${icon('close')}</button></div>`;

function webModal(p) {
  const expand = `<a class="icon-btn" href="${esc(p.file)}" target="_blank" rel="noopener" title="Abrir projeto" aria-label="Abrir">${icon('expand')}</a>`;
  const repo = `<a class="icon-btn" href="${esc(p.repoPath)}" target="_blank" rel="noopener" title="Ver no GitHub" aria-label="GitHub">${icon('github')}</a>`;
  const tags = (p.tags || []).map(t=>`<span class="tag">${esc(t)}</span>`).join('');
  const tech = (p.technologies || []).map(t=>`<span class="tag ok">${esc(t)}</span>`).join('');
  const creators = (p.creators || []).join(', ');
  const files = (p.files || []).join(', ');
  return `<div class="modal-box tall"><div class="modal-bar"><div class="modal-title">${esc(p.icon || '🌐')} ${esc(p.title)}</div>${repo}${expand}<button class="icon-btn" data-close aria-label="Fechar">${icon('close')}</button></div>
    <div class="modal-body web-project-modal">
      <div class="project-meta-head"><div><strong>${esc(p.description)}</strong><div class="card-meta">${creators ? 'Criador(es): '+esc(creators) : ''}${p.status ? ' · '+esc(p.status) : ''}${p.version ? ' · '+esc(p.version) : ''}</div></div><div class="card-tags">${tags}${tech}</div></div>
      <div class="frame-wrap"><div class="frame-loading">Carregando…</div><iframe class="frame" src="${esc(p.file)}" title="${esc(p.title)}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"></iframe></div>
      <details class="project-details"><summary>Metadados e arquivos</summary><p><b>Tipo:</b> ${esc(p.type)} · <b>Entrada:</b> ${esc(p.entry)}</p><p><b>Arquivos:</b> ${esc(files || '—')}</p></details>
    </div></div>`;
}

async function showItem(kind,id,push) {
  const item = (await getData(kind)).find(x => x.id === id);
  if (!item) { history.replaceState(null,'',`#/${kind}`); return; }
  const root = openModal(webModal(item), { hash: push ? `#/${kind}/${encodeURIComponent(id)}` : null, closeUrl:`#/${kind}` });
  root.querySelector('iframe')?.addEventListener('load', () => root.querySelector('.frame-loading')?.classList.add('done'));
}

function askLogin(def) {
  openModal(`<div class="modal-box"><div class="modal-body" style="text-align:center"><div style="font-size:2.4rem">🔒</div>
    <h3>${esc(def.label)} é área restrita</h3><p class="modal-note">Entre com sua conta Google para acessar suas Notations.</p>
    <div class="modal-actions" style="justify-content:center"><button class="btn btn-primary" id="askLoginBtn">Entrar com Google</button><button class="btn" data-close>Agora não</button></div></div></div>`, {cls:'sheet',closeUrl:'#/home'});
  $('#askLoginBtn').onclick = () => { hideModal(); goLogin(); };
}

function renderDock() {
  $('#dock').innerHTML = TABS.filter(t => t.id !== 'admin' || isAdmin()).map(t => {
    const locked = t.access === 'user' && !session.user;
    return `<button class="dock-item${locked?' locked':''}${t.id===activeTab?' active':''}" data-tab="${t.id}" data-label="${esc(t.label)}" aria-label="${esc(t.label)}${locked?' (requer login)':''}">${icon(t.icon)}<span class="tip">${esc(t.label)}</span></button>`;
  }).join('');
}

function activate(tab) {
  activeTab=tab;
  TABS.forEach(t => panels[t.id].classList.toggle('active',t.id===tab));
  document.querySelectorAll('.dock-item').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  $('#fab').hidden=!(tab==='notations'&&session.user);
  renderTab(tab); window.scrollTo({top:0});
}

function route() {
  if (!session.ready || $('#app').hidden) return;
  const [,t,rawId] = location.hash.split('/');
  let tab = tabDef(t) ? t : 'home'; const def=tabDef(tab);
  const allowed = def.access==='guest' || (def.access==='user'&&!!session.user) || (def.access==='admin'&&isAdmin());
  if (!allowed) { history.replaceState(null,'','#/home'); tab='home'; askLogin(def); }
  activate(tab);
  const id=rawId?decodeURIComponent(rawId):'';
  if (id&&allowed&&DATA_FILE[tab]&&!isModalOpen()) showItem(tab,id,false);
  else if (!id&&isModalOpen()) hideModal();
}

function renderChip() {
  const u=session.user;
  $('#userChip').innerHTML=u
    ? `${u.photoURL?`<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`:`<span class="avatar">${esc((u.displayName||u.email||'?')[0].toUpperCase())}</span>`}
       <span class="user-name">${esc(u.displayName||u.email||'')}</span>${isAdmin()?'<span class="badge">ADMIN</span>':''}<button class="chip-btn" data-logout>Sair</button>`
    : `<span class="badge">Visitante</span><button class="chip-btn" data-login>Entrar</button>`;
}

async function renderAdmin(el) {
  if (!isAdmin()) { el.innerHTML='<p class="empty-state">Acesso restrito ao administrador.</p>'; return; }
  const list=await getData('web', true);
  el.innerHTML=`<div class="hero"><h1>⚙️ Administrador</h1><p>Os Web Projects agora são descobertos diretamente da pasta <code>web-projects/</code> no GitHub.</p></div>
    <div class="admin-bar"><button class="btn btn-primary" data-admin-refresh>↻ Atualizar descoberta</button><span class="admin-status">${list.length} projeto(s) encontrado(s)</span></div>
    <div class="notice">Para adicionar, remover ou reorganizar um protótipo, altere a pasta pelo GitHub Desktop. Cada projeto precisa de um <code>project.md</code> e de um arquivo de entrada, normalmente <code>index.html</code>.</div>
    <div class="admin-list">${list.map(p=>`<div class="admin-row"><div><strong>${esc(p.icon)} ${esc(p.title)}</strong><small>${esc(p.path)}/project.md · ${esc(p.entry)}</small></div><div><a class="btn" href="${esc(p.repoPath)}" target="_blank" rel="noopener">GitHub</a></div></div>`).join('') || '<p class="empty-state">Nenhum projeto com project.md válido.</p>'}</div>`;
  el.onclick=e=>{ if(e.target.closest('[data-admin-refresh]')) refreshWebProjects(); };
}

function showLogin() {
  hideModal(); $('#app').hidden=true; $('#login').hidden=false;
  const g=$('#btnGoogle'), note=$('#loginNote'); g.disabled=!Auth.isReady(); note.hidden=Auth.isReady();
  note.textContent=Auth.isConfigured()?'Não consegui falar com o Google agora.':'Login Google ainda não configurado — confira o Firebase.';
}
function showApp() {
  $('#login').hidden=true; $('#app').hidden=false; rendered.clear(); Object.keys(cache).forEach(k=>delete cache[k]);
  renderChip(); renderDock(); if(!location.hash) history.replaceState(null,'','#/home'); route();
}
function decide() { session.ready=true; hideBoot(); (session.user||session.guest)?showApp():showLogin(); }
function goLogin() { session.guest=false; sessionStorage.removeItem('rakino_guest'); showLogin(); }
function hideBoot(){const b=$('#boot');if(!b)return;b.classList.add('done');setTimeout(()=>b.remove(),400);}

function bindTheme() {
  const key='rakino_theme', saved=localStorage.getItem(key);
  const setTheme=t=>{document.documentElement.dataset.theme=t;localStorage.setItem(key,t);$('#themeToggle').textContent=t==='light'?'☀️':'🌙';$('#themeToggle').title=t==='light'?'Tema escuro':'Tema claro';};
  setTheme(saved||'dark');
  $('#themeToggle').onclick=()=>setTheme(document.documentElement.dataset.theme==='light'?'dark':'light');
}

function bindGlobal() {
  $('#dock').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;const def=tabDef(b.dataset.tab);if(def.access==='user'&&!session.user)return askLogin(def);if(def.access==='admin'&&!isAdmin())return;location.hash='#/'+def.id;});
  $('#main').addEventListener('click',e=>{const refresh=e.target.closest('[data-refresh-web]');if(refresh){refreshWebProjects();return;}const c=e.target.closest('[data-open]');if(c)showItem(c.dataset.kind,c.dataset.id,true);});
  $('#main').addEventListener('keydown',e=>{const c=e.target.closest('[data-open]');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();showItem(c.dataset.kind,c.dataset.id,true);}});
  $('#fab').addEventListener('click',()=>Notes.openEditor());
  $('#userChip').addEventListener('click',async e=>{if(e.target.closest('[data-logout]')){try{await Auth.logout();}catch{toast('Erro ao sair.')}sessionStorage.removeItem('rakino_guest');session.guest=false;}if(e.target.closest('[data-login]'))goLogin();});
  $('#btnGoogle').addEventListener('click',async()=>{try{await Auth.loginGoogle();}catch(err){console.error(err);toast('Não foi possível entrar: '+(err.code||err.message),4500);}});
  $('#btnGuest').addEventListener('click',()=>{session.guest=true;sessionStorage.setItem('rakino_guest','1');decide();});
  window.addEventListener('hashchange',route);
}

async function boot(){
  initModal(); buildPanels(); bindGlobal(); bindTheme();
  if('serviceWorker' in navigator&&location.protocol!=='file:') navigator.serviceWorker.register('sw.js').catch(()=>{});
  await Auth.init();
  Auth.onUser(u=>{const changed=(u?.uid||null)!==(session.user?.uid||null);session.user=u||null;if(u){if(changed)Notes.start(u);}else Notes.stop();if(changed||!session.ready)decide();});
  setTimeout(()=>{if(!session.ready)decide();},5000);
}
boot();
