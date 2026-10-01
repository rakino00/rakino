/**
 * notations.js — tarefas e lembretes pessoais (Firestore, por usuário).
 *
 * Onde ficam os dados:  users/{uid}/notations/{id}   (só o dono lê/escreve — ver firestore.rules)
 * Tempo real:           onSnapshot atualiza a tela na hora, inclusive entre celular e PC.
 * Offline:              o cache do Firestore guarda as alterações e sincroniza ao voltar a internet.
 */
import * as Auth from './auth.js';
import { esc, toast, todayISO, fmtDateBR } from './ui.js';
import { openModal, requestClose } from './modal.js';

const PRIO = { nv3: 3, nv2: 2, nv1: 1 };
const PRIO_LABEL = { nv3: 'Alta', nv2: 'Média', nv1: 'Baixa' };

let items = [];
let loaded = false;
let unsub = null;
let uid = null;
let mountEl = null;
let filter = 'pending'; // pending | all | done
const listeners = new Set();

export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const isLoaded = () => loaded;

/* ------------------------------ dados ------------------------------ */
export function start(user) {
  stop(true);
  uid = user.uid;
  const { db, fs } = Auth.ctx();
  unsub = fs.onSnapshot(
    fs.collection(db, 'users', uid, 'notations'),
    (snap) => {
      items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      loaded = true;
      emit();
    },
    (err) => { console.error(err); toast('Não consegui sincronizar as notations (' + (err.code || 'erro') + ').'); }
  );
}

export function stop(silent = false) {
  unsub && unsub();
  unsub = null; uid = null; items = []; loaded = false;
  if (!silent) emit();
}

function cmp(a, b) {
  if (!!a.completed !== !!b.completed) return a.completed ? 1 : -1;
  const p = (PRIO[b.priority] || 0) - (PRIO[a.priority] || 0);
  if (p) return p;
  const d = (a.date || '9999').localeCompare(b.date || '9999');
  if (d) return d;
  return (a.time || '99:99').localeCompare(b.time || '99:99');
}

function col() { const { db, fs } = Auth.ctx(); return fs.collection(db, 'users', uid, 'notations'); }

async function save(data, id) {
  const { fs } = Auth.ctx();
  const payload = { ...data, updatedAt: fs.serverTimestamp() };
  if (id) return fs.updateDoc(fs.doc(col(), id), payload);
  return fs.addDoc(col(), { ...payload, completed: false, createdAt: fs.serverTimestamp() });
}
async function toggle(id) {
  const n = items.find((x) => x.id === id);
  if (!n) return;
  const { fs } = Auth.ctx();
  return fs.updateDoc(fs.doc(col(), id), { completed: !n.completed, updatedAt: fs.serverTimestamp() });
}
async function remove(id) { const { fs } = Auth.ctx(); return fs.deleteDoc(fs.doc(col(), id)); }

const fail = (what) => (e) => { console.error(e); toast(`Erro ao ${what}: ${e.code || e.message}`); };

/* ------------------------------ HTML ------------------------------ */
function itemHTML(n) {
  const late = !n.completed && n.date && n.date < todayISO();
  const meta = [];
  if (late) meta.push('<span class="late">Atrasada</span>');
  if (n.date) meta.push(fmtDateBR(n.date));
  if (n.time) meta.push(esc(String(n.time).slice(0, 5)));
  meta.push(n.type === 'reminder' ? 'Lembrete' : 'Tarefa');
  const prio = PRIO_LABEL[n.priority] ? n.priority : 'nv1';
  return `<div class="notation-item ${prio}${n.completed ? ' completed' : ''}" data-id="${esc(n.id)}">
    <button class="check" role="checkbox" aria-checked="${!!n.completed}" aria-label="Marcar como concluída" data-check><i></i></button>
    <button class="n-body" data-edit>
      <span class="n-title">${esc(n.title)}<span class="pill ${prio}">${PRIO_LABEL[prio]}</span></span>
      <span class="n-meta">${meta.join(' · ')}</span>
      ${n.description ? `<span class="n-desc">${esc(n.description)}</span>` : ''}
    </button></div>`;
}

export function pendingHTML(limit = 5) {
  if (!loaded) return '<p class="empty-state">Carregando…</p>';
  const list = items.filter((n) => !n.completed).sort(cmp).slice(0, limit);
  return list.length ? list.map(itemHTML).join('') : '<p class="empty-state">Nenhuma tarefa pendente. 🎉</p>';
}

function tabHTML() {
  const shown = items.filter((n) => filter === 'all' ? true : filter === 'done' ? n.completed : !n.completed).sort(cmp);
  const btn = (v, t) => `<button class="${filter === v ? 'on' : ''}" data-filter="${v}">${t}</button>`;
  const empty = !loaded ? 'Carregando…' : filter === 'done' ? 'Nada concluído ainda.' : 'Nada por aqui. Toque em + para criar uma notation.';
  return `<div class="notes-head">
      <h2 class="section-title" style="margin:20px 0 10px"><span class="accent">🗒</span> Notations</h2>
      <div class="seg" role="group" aria-label="Filtro">${btn('pending', 'Pendentes')}${btn('all', 'Todas')}${btn('done', 'Concluídas')}</div>
    </div>
    ${navigator.onLine ? '' : '<p class="sync">Sem conexão — as alterações ficam salvas no aparelho e sincronizam depois.</p>'}
    <div class="notation-list">${shown.length ? shown.map(itemHTML).join('') : `<p class="empty-state">${empty}</p>`}</div>`;
}

/* ------------------------------ UI ------------------------------ */
export function mount(el) { mountEl = el; paint(); }
function paint() { if (mountEl && mountEl.isConnected) mountEl.innerHTML = tabHTML(); }
function emit() { paint(); listeners.forEach((fn) => fn()); }
window.addEventListener('online', paint);
window.addEventListener('offline', paint);

/** Liga os cliques (checkbox / editar / filtro / nova) a um container. */
export function bind(el) {
  el.addEventListener('click', (e) => {
    const check = e.target.closest('[data-check]');
    const edit = e.target.closest('[data-edit]');
    const flt = e.target.closest('[data-filter]');
    const row = e.target.closest('[data-id]');
    if (check && row) return void toggle(row.dataset.id).catch(fail('atualizar'));
    if (edit && row) return openEditor(row.dataset.id);
    if (flt) { filter = flt.dataset.filter; paint(); }
  });
}

export function openEditor(id = null) {
  if (!uid) return;
  const n = id ? items.find((x) => x.id === id) : null;
  const prio = n?.priority || 'nv1';
  const type = n?.type || 'task';
  const radio = (name, val, label, cur) =>
    `<label class="seg-opt"><input type="radio" name="${name}" value="${val}" ${cur === val ? 'checked' : ''}><span>${label}</span></label>`;

  const root = openModal(`
    <div class="modal-box">
      <div class="sheet-grip"></div>
      <div class="modal-body">
        <form class="sheet-form" id="noteForm" autocomplete="off">
          <h3>${n ? 'Editar notation' : 'Nova notation'}</h3>
          <label>Título
            <input name="title" required maxlength="150" value="${esc(n?.title || '')}" data-autofocus>
          </label>
          <label>Descrição
            <textarea name="description" rows="3" maxlength="2000">${esc(n?.description || '')}</textarea>
          </label>
          <div class="row2">
            <label>Data<input type="date" name="date" value="${esc(n?.date || '')}"></label>
            <label>Hora<input type="time" name="time" value="${esc(n?.time || '')}"></label>
          </div>
          <div class="field"><span>Prioridade</span>
            <div class="seg">${radio('priority', 'nv1', 'Baixa', prio)}${radio('priority', 'nv2', 'Média', prio)}${radio('priority', 'nv3', 'Alta', prio)}</div>
          </div>
          <div class="field"><span>Tipo</span>
            <div class="seg">${radio('type', 'task', 'Tarefa', type)}${radio('type', 'reminder', 'Lembrete', type)}</div>
          </div>
          <div class="form-actions">
            ${n ? '<button type="button" class="btn danger" data-del>Excluir</button>' : ''}
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>`, { cls: 'sheet', hash: location.hash || '#/notations' });

  const form = root.querySelector('#noteForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const title = String(fd.get('title')).trim();
    if (!title) return;
    const data = {
      title,
      description: String(fd.get('description')).trim() || null,
      date: fd.get('date') || null,
      time: fd.get('time') || null,
      priority: fd.get('priority'),
      type: fd.get('type'),
    };
    // não damos "await": offline o Firestore só confirma quando a internet volta,
    // mas a tela já reflete a mudança pelo cache local.
    save(data, id).catch(fail('salvar'));
    requestClose();
  });

  const del = form.querySelector('[data-del]');
  if (del) {
    let armed = false;
    del.addEventListener('click', () => {
      if (!armed) { armed = true; del.textContent = 'Toque de novo para excluir'; setTimeout(() => { armed = false; del.textContent = 'Excluir'; }, 3000); return; }
      remove(id).catch(fail('excluir'));
      requestClose();
    });
  }
}
