/**
 * Recordes públicos dos jogos Rakino.
 * - Leitura: pública (qualquer visitante pode ver).
 * - Escrita: somente usuário autenticado, validada pelo Firestore.
 * - Visitantes também podem jogar normalmente; o recorde online só é salvo quando logados.
 */
import * as Auth from './auth.js';

const fallbackName = 'indivíduo desconhecido';
const cleanGameId = id => String(id || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');

export async function getRecord(gameId) {
  const id = cleanGameId(gameId);
  const { db, fs } = Auth.ctx();
  if (!db || !fs) return { score: 0, name: fallbackName };
  try {
    const snap = await fs.getDoc(fs.doc(db, 'gameRecords', id));
    if (!snap.exists()) return { score: 0, name: fallbackName };
    const d = snap.data() || {};
    return { score: Number(d.score) || 0, name: d.name || fallbackName };
  } catch (err) {
    console.warn('[Rakino] recorde indisponível:', id, err);
    return { score: 0, name: fallbackName };
  }
}

async function waitForAuthReady(timeout = 8000) {
  const started = Date.now();
  while (!Auth.isReady() && Date.now() - started < timeout) await new Promise(r => setTimeout(r, 100));
  if (!Auth.isReady()) return null;
  return await new Promise(resolve => {
    let settled = false;
    let off;
    off = Auth.onUser(u => { if (!settled) { settled = true; off?.(); resolve(u); } });
    setTimeout(() => { if (!settled) { settled = true; off?.(); resolve(null); } }, 1200);
  });
}

export async function submitRecord(gameId, score) {
  const value = Math.floor(Number(score) || 0);
  if (value <= 0) return false;
  const user = await waitForAuthReady();
  if (!user) return false;
  const { db, fs } = Auth.ctx();
  if (!db || !fs) return false;
  const name = user.displayName || user.email || fallbackName;
  const id = cleanGameId(gameId);
  try {
    const ref = fs.doc(db, 'gameRecords', id);
    return await fs.runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      const old = Number(snap.data()?.score) || 0;
      if (value <= old) return false;
      tx.set(ref, { score: value, name, uid: user.uid, updatedAt: fs.serverTimestamp() }, { merge: true });
      return true;
    });
  } catch (err) {
    console.warn('[Rakino] não foi possível salvar recorde:', id, err);
    return false;
  }
}

export function mountGameRecord({ gameId, target, suffix = '' }) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return () => {};
  const paint = r => { el.textContent = r.score > 0 ? `${r.score}${suffix ? ` ${suffix}` : ''} — ${r.name}` : `Ainda não há recorde${suffix ? ` (${suffix})` : ''}`; };
  waitForAuthReady().then(() => getRecord(gameId)).then(paint);
  const onScore = async e => {
    if (e.detail?.gameId !== gameId) return;
    await submitRecord(gameId, e.detail.score);
    paint(await getRecord(gameId));
  };
  window.addEventListener('rakino:game-score', onScore);
  return () => window.removeEventListener('rakino:game-score', onScore);
}
