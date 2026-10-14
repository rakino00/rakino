/**
 * admin.js — painel do administrador (CRUD dos Web Projects salvos no Firestore).
 * Só aparece para o e-mail definido em ADMIN_EMAIL (main.js); as regras do Firestore
 * (firestore.rules) são quem realmente protege a escrita.
 *
 *   initAdmin({ getUser, onChanged })
 *     getUser()   → usuário logado (ou null)
 *     onChanged() → chamado após salvar/excluir, para o site recarregar a aba Web Projects
 */
import * as Auth from './auth.js';
import { esc, toast } from './ui.js';
import { openModal, hideModal } from './modal.js';
import { getData, invalidate } from './catalog.js';

let deps;
export const initAdmin = (d) => { deps = d; };

const collection = () => { const { db, fs } = Auth.ctx(); return fs.collection(db, 'webProjects'); };

async function save(el, id, data) {
  const { fs } = Auth.ctx();
  await fs.setDoc(fs.doc(collection(), id), { ...data, updatedAt: fs.serverTimestamp() }, { merge: true });
  invalidate('web'); deps.onChanged();
  await renderAdmin(el);
  toast('Projeto salvo.');
}
async function remove(el, id) {
  const { fs } = Auth.ctx();
  await fs.deleteDoc(fs.doc(collection(), id));
  invalidate('web'); deps.onChanged();
  await renderAdmin(el);
  toast('Projeto excluído.');
}
async function importCurrent(el) {
  const list = await getData('web');
  if (!list.length) return toast('Não há JSON para importar.');
  for (const { id, ...data } of list) await save(el, id, data);
  toast('JSON importado para o Firebase.');
}

export async function renderAdmin(el) {
  const user = deps.getUser();
  if (!user) { el.innerHTML = '<p class="empty-state">Acesso restrito ao administrador.</p>'; return; }
  const list = await getData('web');
  el.innerHTML = `<div class="hero"><h1>⚙️ Administrador</h1><p>Gerencie os Web Projects salvos no Firebase.</p></div>
    <div class="admin-bar"><button class="btn btn-primary" data-admin-add>+ Novo Web Project</button>
    <button class="btn" data-admin-import>Importar JSON atual</button><span class="admin-status">${esc(user.email)}</span></div>
    <div class="admin-list">${list.map((p) => `<div class="admin-row"><div><strong>${esc(p.title)}</strong><small>${esc(p.file || '')}</small></div>
      <div><button class="btn" data-admin-edit="${esc(p.id)}">Editar</button><button class="btn danger" data-admin-del="${esc(p.id)}">Excluir</button></div></div>`).join('') || '<p class="empty-state">Nenhum projeto.</p>'}</div>`;
  el.onclick = async (e) => {
    const q = (s) => e.target.closest(s);
    if (q('[data-admin-add]')) return openEditor(el);
    if (q('[data-admin-import]')) return importCurrent(el);
    const edit = q('[data-admin-edit]'); if (edit) return openEditor(el, list.find((x) => x.id === edit.dataset.adminEdit));
    const del = q('[data-admin-del]');
    if (del && confirm('Excluir este Web Project?')) await remove(el, del.dataset.adminDel);
  };
}

function openEditor(el, p = null) {
  const root = openModal(`<div class="modal-box"><div class="modal-body"><form id="adminForm" class="sheet-form">
    <h3>${p ? 'Editar' : 'Novo'} Web Project</h3>
    <label>ID<input name="id" required value="${esc(p?.id || '')}" ${p ? 'readonly' : ''}></label>
    <label>Título<input name="title" required maxlength="100" value="${esc(p?.title || '')}"></label>
    <label>Arquivo HTML<input name="file" required value="${esc(p?.file || 'web-projects/')}"></label>
    <label>Descrição<textarea name="description" rows="3">${esc(p?.description || '')}</textarea></label>
    <label>Ícone/emoji<input name="icon" value="${esc(p?.icon || '🌐')}"></label>
    <label>Tags<input name="tags" value="${esc((p?.tags || []).join(', '))}"></label>
    <label>Ordem<input type="number" name="order" value="${Number(p?.order || 999)}"></label>
    <div class="form-actions"><button class="btn btn-primary">Salvar</button></div></form></div></div>`, { cls: 'sheet' });
  root.querySelector('form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target), val = (k) => String(fd.get(k)).trim();
    const key = val('id').replace(/[^a-zA-Z0-9_-]/g, '-');
    if (!key) return;
    await save(el, key, {
      title: val('title'), file: val('file'), description: val('description'), icon: val('icon') || '🌐',
      tags: val('tags').split(',').map((s) => s.trim()).filter(Boolean), type: 'html', order: Number(fd.get('order')) || 999,
    });
    hideModal();
  };
}
