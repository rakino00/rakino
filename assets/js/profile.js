/**
 * profile.js — perfil, preferências visuais e identidade do usuário.
 * A preferência de tema é gravada em users/{uid}.profile e reaplicada em cada dispositivo.
 */
import * as Auth from './auth.js';
import { esc, toast } from './ui.js';
import { openModal, hideModal } from './modal.js';

const DEFAULT_THEME = 'default';
const THEMES = {
  default: { label: 'Rakino Original', description: 'O Rakino atual: minimalista, neon e direto.' },
  forge: { label: 'Dream Forge', description: 'Um laboratório noturno onde software e jogos nascem juntos.' },
};
let currentTheme = DEFAULT_THEME;

function applyTheme(theme = DEFAULT_THEME) {
  currentTheme = THEMES[theme] ? theme : DEFAULT_THEME;
  document.documentElement.dataset.rakinoTheme = currentTheme;
  localStorage.setItem('rakino_visual_theme', currentTheme);
}

export function getTheme() { return currentTheme; }

export function applySavedTheme() {
  applyTheme(localStorage.getItem('rakino_visual_theme') || DEFAULT_THEME);
}

export async function loadForUser(user) {
  if (!user) return applySavedTheme();
  try {
    const { db, fs } = Auth.ctx();
    const snap = await fs.getDoc(fs.doc(db, 'users', user.uid));
    const theme = snap.exists() ? snap.data()?.theme : null;
    applyTheme(theme || localStorage.getItem('rakino_visual_theme') || DEFAULT_THEME);
  } catch (e) {
    console.warn('[Rakino] perfil indisponível:', e);
    applySavedTheme();
  }
}

async function saveTheme(user, theme) {
  applyTheme(theme);
  if (!user) return;
  try {
    const { db, fs } = Auth.ctx();
    await fs.setDoc(fs.doc(db, 'users', user.uid), {
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      email: user.email || '',
      theme: currentTheme,
      updatedAt: fs.serverTimestamp(),
    }, { merge: true });
    toast('Tema salvo na sua conta.');
  } catch (e) {
    console.error(e);
    toast('Não consegui salvar o tema na conta.');
  }
}

export function openProfile(user) {
  if (!user) return;
  const root = openModal(`<div class="modal-box profile-modal">
    <div class="modal-bar"><div class="modal-title">Seu perfil</div><button class="icon-btn" data-close aria-label="Fechar">×</button></div>
    <div class="modal-body">
      <div class="profile-hero">
        ${user.photoURL ? `<img class="profile-avatar" src="${esc(user.photoURL)}" alt="" referrerpolicy="no-referrer">` : `<div class="profile-avatar avatar">${esc((user.displayName || user.email || '?')[0].toUpperCase())}</div>`}
        <div><h2>${esc(user.displayName || 'Usuário Rakino')}</h2><p>${esc(user.email || '')}</p></div>
      </div>
      <h3 class="profile-section-title">Atmosfera do Rakino</h3>
      <div class="theme-choices">
        ${Object.entries(THEMES).map(([id, t]) => `<button class="theme-choice ${currentTheme === id ? 'selected' : ''}" data-theme-choice="${id}">
          <span class="theme-preview ${id}"><i></i><b></b><em></em></span><span><strong>${esc(t.label)}</strong><small>${esc(t.description)}</small></span>
        </button>`).join('')}
      </div>
      <div class="profile-facts"><span>Google conectado</span><span>Notations sincronizadas</span><span>Chat habilitado</span></div>
    </div></div>`);
  root.querySelectorAll('[data-theme-choice]').forEach(btn => btn.addEventListener('click', async () => {
    root.querySelectorAll('[data-theme-choice]').forEach(x => x.classList.remove('selected'));
    btn.classList.add('selected');
    await saveTheme(user, btn.dataset.themeChoice);
  }));
}
