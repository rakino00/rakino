/**
 * chat.js — chat comunitário do Rakino.
 * Convidados não recebem o componente. Usuários autenticados compartilham uma sala
 * e carregam somente as 255 mensagens mais recentes.
 */
import * as Auth from './auth.js';
import { esc, toast } from './ui.js';
import { openModal, hideModal } from './modal.js';

const MAX_MESSAGES = 255;
let user = null;
let messages = [];
let unsub = null;
let bubble = null;

function fmt(ts) {
  const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(d);
}
function nameOf(m) { return m.displayName || m.email?.split('@')[0] || 'Usuário'; }
function avatarOf(m) {
  return m.photoURL ? `<img src="${esc(m.photoURL)}" alt="" referrerpolicy="no-referrer">` : `<span>${esc(nameOf(m).slice(0,1).toUpperCase())}</span>`;
}
function chatMarkup(full = false) {
  const body = messages.length ? messages.map(m => `<article class="chat-msg ${m.uid === user?.uid ? 'mine' : ''}">
    <div class="chat-avatar">${avatarOf(m)}</div><div class="chat-msg-body"><div class="chat-msg-head"><strong>${esc(nameOf(m))}</strong><time>${fmt(m.createdAt)}</time></div><p>${esc(m.text)}</p></div>
  </article>`).join('') : '<div class="chat-empty">Ainda não há mensagens. Seja o primeiro a acender a forja. ✦</div>';
  return `<div class="chat-shell ${full ? 'chat-shell-modal' : ''}">
    <div class="chat-head"><div><strong>Rakino Chat</strong><small>${messages.length ? `${messages.length} mensagens recentes` : 'Conversa da comunidade'}</small></div><div class="chat-head-actions"><button class="chat-min" data-chat-min aria-label="Minimizar">−</button>${full ? '<button class="icon-btn" data-close aria-label="Fechar">×</button>' : ''}</div></div>
    <div class="chat-messages" data-chat-messages>${body}</div>
    <form class="chat-form" data-chat-form><input name="message" maxlength="500" autocomplete="off" placeholder="Escreva para a comunidade…" data-chat-input><button class="btn btn-primary" type="submit">Enviar</button></form>
  </div>`;
}

function renderBubble() {
  if (!user) return removeBubble();
  if (!bubble) {
    bubble = document.createElement('div');
    bubble.id = 'chatBubbleRoot';
    document.body.appendChild(bubble);
  }
  const unread = 0;
  bubble.innerHTML = `<button class="chat-bubble" data-chat-open aria-label="Abrir chat"><span class="chat-orb">✦</span><span>Chat</span>${unread ? `<b>${unread}</b>` : ''}</button>`;
  bubble.querySelector('[data-chat-open]').onclick = openChat;
}
function removeBubble() { bubble?.remove(); bubble = null; }

async function send(text) {
  if (!user || !text.trim()) return;
  const { db, fs } = Auth.ctx();
  try {
    await fs.addDoc(fs.collection(db, 'chatMessages'), {
      uid: user.uid, displayName: user.displayName || '', email: user.email || '', photoURL: user.photoURL || '',
      text: text.trim().slice(0, 500), createdAt: fs.serverTimestamp(),
    });
  } catch (e) {
    console.error(e); toast('Não consegui enviar a mensagem.');
  }
}
function bindChat(root) {
  const form = root.querySelector('[data-chat-form]');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const input = form.elements.message;
    const text = input.value;
    input.value = '';
    await send(text);
    input.focus();
  });
  const min = root.querySelector('[data-chat-min]');
  if (min) min.onclick = () => { hideModal(); renderBubble(); };
  const box = root.querySelector('[data-chat-messages]');
  if (box) requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
}

export function openChat() {
  if (!user) return;
  const root = openModal(chatMarkup(true), { cls: 'chat-modal' });
  bindChat(root);
  const input = root.querySelector('[data-chat-input]');
  input?.focus();
}

function subscribe() {
  if (!user) return;
  const { db, fs } = Auth.ctx();
  unsub?.();
  unsub = fs.onSnapshot(
    fs.query(fs.collection(db, 'chatMessages'), fs.orderBy('createdAt', 'desc'), fs.limit(MAX_MESSAGES)),
    snap => {
      messages = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
      renderBubble();
      const open = document.querySelector('#modalRoot .chat-shell');
      if (open) {
        const typed = open.querySelector('[data-chat-input]');
        const draft = typed ? typed.value : '';
        const hadFocus = typed && document.activeElement === typed;
        const box = open.querySelector('[data-chat-messages]');
        const atBottom = !box || box.scrollHeight - box.scrollTop - box.clientHeight < 80;
        open.outerHTML = chatMarkup(true);
        const rootEl = document.getElementById('modalRoot');
        bindChat(rootEl);
        const input = rootEl.querySelector('[data-chat-input]');
        if (input) { input.value = draft; if (hadFocus) input.focus(); }
        const nb = rootEl.querySelector('[data-chat-messages]');
        if (nb && !atBottom) nb.scrollTop = box ? box.scrollTop : 0;
      }
    },
    err => { console.error(err); toast('O chat está temporariamente indisponível.'); }
  );
}

export function start(u) { user = u; renderBubble(); subscribe(); }
export function stop() { unsub?.(); unsub = null; user = null; messages = []; removeBubble(); }
export function refresh() { if (user) renderBubble(); }
