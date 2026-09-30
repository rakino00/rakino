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

async function getData(kind) {
  if (cache[kind]) return cache[kind];
  if (kind !== 'web') return [];

  // A lista do repositório é a base. O Firestore pode acrescentar/alterar projetos,
  // mas nunca deve esconder projetos que já estão publicados no GitHub.
  let localList = [];
  try {
    const res = await fetch(`data/${DATA_FILE[kind]}.json?v=20260930`, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    localList = await res.json();
  } catch (err) {
    console.warn('[Rakino] falha ao ler JSON local', kind, err);
  }

  try {
    const { db, fs } = Auth.ctx();
    if (db && fs) {
      const snap = await fs.getDocs(fs.collection(db, 'webProjects'));
      const cloudList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const merged = new Map(localList.map(p => [p.id, p]));
      cloudList.forEach(p => merged.set(p.id, { ...(merged.get(p.id) || {}), ...p }));
      cache[kind] = [...merged.values()].sort((a,b) => (a.order ?? 999) - (b.order ?? 999));
      return cache[kind];
    }
  } catch (err) {
    console.warn('[Rakino] Firestore webProjects indisponível:', err);
  }

  cache[kind] = localList.sort((a,b) => (a.order ?? 999) - (b.order ?? 999));
  if (!cache[kind].length) toast('Não consegui carregar os Web Projects.', 4000);
  return cache[kind];
}

function card(item, kind) {
  const cover = item.cover || coverSVG(item);
  const tags = kind === 'web'
    ? [`<span class="tag ok">.${esc(item.type || 'html')}</span>`, ...(item.tags || []).map(t => `<span class="tag">${esc(t)}</span>`)]
    : [];
  return `<article class="card" role="button" tabindex="0" data-open data-kind="${kind}" data-id="${esc(item.id)}">
    <img class="card-image" src="${esc(cover)}" alt="Capa automática de ${esc(item.title)}" loading="lazy">
    <div class="card-body"><h3 class="card-title">${esc(item.title)}</h3>
    <p class="card-desc">${esc(item.description || '')}</p><div class="card-tags">${tags.join('')}</div></div></article>`;
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
  Notes.onChange(() => {
    const h = $('#homeNotes'); if (h) h.innerHTML = Notes.pendingHTML(5);
    if (!$('#dockRadial')?.matches(':hover')) closeDockRadial();
  });
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
  el.innerHTML = `<h2 class="section-title"><span class="accent">🌐</span> Web Projects</h2>
    <p class="lead">Páginas e apps simples rodando direto no navegador.</p>
    ${gridOrEmpty(list, id, 'Nenhum projeto cadastrado.')}`;
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
  const expand = `<a class="icon-btn" href="${esc(p.file)}" title="Abrir projeto" aria-label="Abrir">${icon('expand')}</a>`;
  return `<div class="modal-box tall">${bar(p.title, expand)}<div class="modal-body frame-wrap"><div class="frame-loading">Carregando…</div>
    <iframe class="frame" src="${esc(p.file)}" title="${esc(p.title)}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"></iframe></div></div>`;
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
  bindDockHover();
}

let dockHoverTimer = 0;
function dockRadialItems() {
  const items = [`<button class="dock-radial-item" data-radial-tab="web" style="--dx:-48px;--dy:-74px">${icon('globe')}<span>Web Projects</span></button>`];
  const pending = Notes.pendingCount();
  if (session.user && pending > 0) {
    items.push(`<button class="dock-radial-item" data-radial-tab="notations" style="--dx:48px;--dy:-74px">${icon('note')}<span>Pendentes <b>${pending}</b></span></button>`);
  }
  return items.join('');
}

function closeDockRadial() {
  const radial = $('#dockRadial');
  if (!radial) return;
  clearTimeout(dockHoverTimer);
  radial.classList.remove('open');
  radial.setAttribute('aria-hidden', 'true');
}

function openDockRadial(anchor) {
  const radial = $('#dockRadial');
  if (!radial) return;
  const rect = anchor.getBoundingClientRect();
  radial.innerHTML = dockRadialItems();
  radial.style.left = `${rect.left + rect.width / 2}px`;
  radial.style.top = `${rect.top + rect.height / 2}px`;
  radial.classList.add('open');
  radial.setAttribute('aria-hidden', 'false');
}

function bindDockHover() {
  const dock = $('#dock');
  if (!dock) return;
  dock.querySelectorAll('.dock-item').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      clearTimeout(dockHoverTimer);
      openDockRadial(btn);
    });
    btn.addEventListener('mouseleave', () => {
      dockHoverTimer = setTimeout(() => {
        const radial = $('#dockRadial');
        if (!radial?.matches(':hover')) closeDockRadial();
      }, 120);
    });
  });
}

function bindRadial() {
  const radial = $('#dockRadial');
  radial.addEventListener('mouseenter', () => clearTimeout(dockHoverTimer));
  radial.addEventListener('mouseleave', () => {
    dockHoverTimer = setTimeout(closeDockRadial, 120);
  });
  radial.addEventListener('click', e => {
    const b = e.target.closest('[data-radial-tab]');
    if (!b) return;
    closeDockRadial();
    const tab = b.dataset.radialTab;
    const def = tabDef(tab);
    if (def.access === 'user' && !session.user) return askLogin(def);
    location.hash = `#/${tab}`;
  });
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
  const list=await getData('web');
  el.innerHTML=`<div class="hero"><h1>⚙️ Administrador</h1><p>Gerencie os Web Projects salvos no Firebase.</p></div>
    <div class="admin-bar"><button class="btn btn-primary" data-admin-add>+ Novo Web Project</button>
    <button class="btn" data-admin-import>Importar JSON atual</button><span class="admin-status">${esc(session.user.email)}</span></div>
    <div class="admin-list">${list.map(p=>`<div class="admin-row"><div><strong>${esc(p.title)}</strong><small>${esc(p.file||'')}</small></div>
      <div><button class="btn" data-admin-edit="${esc(p.id)}">Editar</button><button class="btn danger" data-admin-del="${esc(p.id)}">Excluir</button></div></div>`).join('') || '<p class="empty-state">Nenhum projeto.</p>'}</div>`;
  el.onclick=async e=>{
    const add=e.target.closest('[data-admin-add]'), imp=e.target.closest('[data-admin-import]'), edit=e.target.closest('[data-admin-edit]'), del=e.target.closest('[data-admin-del]');
    if(add) return openAdminEditor();
    if(imp) return importCurrentJSON();
    if(edit) return openAdminEditor(list.find(x=>x.id===edit.dataset.adminEdit));
    if(del) { if(!confirm('Excluir este Web Project?')) return; await adminDelete(del.dataset.adminDel); }
  };
}
function webCollection() { const {db,fs}=Auth.ctx(); return fs.collection(db,'webProjects'); }
async function adminSet(id,data) {
  const {fs}=Auth.ctx(); const ref=fs.doc(webCollection(),id);
  await fs.setDoc(ref,{...data,updatedAt:fs.serverTimestamp()},{merge:true}); delete cache.web; rendered.delete('web'); rendered.delete('admin'); await renderAdmin(panels.admin); toast('Projeto salvo.');
}
async function adminDelete(id) { const {fs}=Auth.ctx(); await fs.deleteDoc(fs.doc(webCollection(),id)); delete cache.web; rendered.delete('web'); await renderAdmin(panels.admin); toast('Projeto excluído.'); }
async function importCurrentJSON() {
  const list=await getData('web'); if(!list.length) return toast('Não há JSON para importar.');
  for(const p of list) { const {id,...data}=p; await adminSet(id,data); }
  toast('JSON importado para o Firebase.');
}
function openAdminEditor(p=null) {
  const id=p?.id||'';
  const root=openModal(`<div class="modal-box"><div class="modal-body"><form id="adminForm" class="sheet-form">
    <h3>${p?'Editar':'Novo'} Web Project</h3>
    <label>ID<input name="id" required value="${esc(id)}" ${p?'readonly':''}></label>
    <label>Título<input name="title" required maxlength="100" value="${esc(p?.title||'')}"></label>
    <label>Arquivo HTML<input name="file" required value="${esc(p?.file||'web-projects/')}"></label>
    <label>Descrição<textarea name="description" rows="3">${esc(p?.description||'')}</textarea></label>
    <label>Ícone/emoji<input name="icon" value="${esc(p?.icon||'🌐')}"></label>
    <label>Tags<input name="tags" value="${esc((p?.tags||[]).join(', '))}"></label>
    <label>Ordem<input type="number" name="order" value="${Number(p?.order||999)}"></label>
    <div class="form-actions"><button class="btn btn-primary">Salvar</button></div></form></div></div>`,{cls:'sheet'});
  root.querySelector('form').onsubmit=async e=>{
    e.preventDefault(); const fd=new FormData(e.target); const key=String(fd.get('id')).trim().replace(/[^a-zA-Z0-9_-]/g,'-');
    if(!key) return;
    await adminSet(key,{title:String(fd.get('title')).trim(),file:String(fd.get('file')).trim(),description:String(fd.get('description')).trim(),icon:String(fd.get('icon')).trim()||'🌐',tags:String(fd.get('tags')).split(',').map(s=>s.trim()).filter(Boolean),type:'html',order:Number(fd.get('order'))||999});
    hideModal();
  };
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
  bindRadial();
  $('#dock').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;const def=tabDef(b.dataset.tab);if(def.access==='user'&&!session.user)return askLogin(def);if(def.access==='admin'&&!isAdmin())return;location.hash='#/'+def.id;});
  $('#main').addEventListener('click',e=>{const c=e.target.closest('[data-open]');if(c)showItem(c.dataset.kind,c.dataset.id,true);});
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
