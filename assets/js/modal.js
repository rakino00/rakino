/**
 * modal.js — modal único do site (janela de projeto, detalhes e formulários).
 *
 * Comportamento:
 *  - clicar FORA da janela fecha;  Esc fecha;  botão [data-close] fecha;
 *  - o botão "voltar" do celular fecha o modal (usamos history.pushState);
 *  - quando `hash` é informado, a URL muda (#/web/acordePlus) e vira link direto.
 *
 * BUG ANTIGO (blur na tela toda): .modal-root tinha display:flex, o que anula o
 * atributo `hidden`. Agora o CSS tem [hidden]{display:none!important} e o modal
 * só existe no DOM enquanto está aberto.
 */
let root;
let state = null; // { pushed, closeUrl, onClose }

export function initModal() {
  root = document.getElementById('modalRoot');
  root.addEventListener('click', (e) => {
    if (e.target === root) requestClose();              // clique fora da janela
    if (e.target.closest('[data-close]')) requestClose(); // botão fechar
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state) requestClose(); });
  window.addEventListener('popstate', () => { if (state && state.pushed) hideModal(); });
}

export const isModalOpen = () => !!state;

export function openModal(html, { cls = '', hash = null, closeUrl = null, onClose = null } = {}) {
  if (state) hideModal();
  root.className = 'modal-root ' + cls;
  root.innerHTML = html;
  root.hidden = false;
  document.body.classList.add('no-scroll');
  let pushed = false;
  if (hash !== null) {
    history.pushState({ m: 1 }, '', hash);
    pushed = true;
  }
  state = { pushed, closeUrl, onClose };
  const focusable = root.querySelector('[data-autofocus]') || root.querySelector('[data-close]');
  focusable && focusable.focus({ preventScroll: true });
  return root;
}

export function requestClose() {
  if (!state) return;
  if (state.pushed) history.back();           // popstate esconde o modal
  else {
    if (state.closeUrl) history.replaceState(null, '', state.closeUrl);
    hideModal();
  }
}

export function hideModal() {
  if (!state) return;
  const { onClose } = state;
  state = null;
  root.hidden = true;
  root.innerHTML = '';
  root.className = 'modal-root';
  document.body.classList.remove('no-scroll');
  onClose && onClose();
}
