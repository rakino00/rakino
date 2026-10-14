/**
 * Recordes dos jogos Rakino.
 * - Guarda sempre o recorde local neste navegador, inclusive para visitantes.
 * - Sincroniza recordes globais no Firestore quando há login.
 * - A regra de segurança continua sendo a autoridade para os recordes online.
 */
import * as Auth from './auth.js';

const fallbackName = 'indivíduo desconhecido';
const localKey = id => `rakino_record_${id}_v1`;
const cleanGameId = id => String(id || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
const normalize = d => ({ score: Math.max(0, Math.floor(Number(d?.score) || 0)), name: String(d?.name || fallbackName) });

function getLocal(id) {
  try { return normalize(JSON.parse(localStorage.getItem(localKey(id)) || 'null')); }
  catch { return { score: 0, name: fallbackName }; }
}
function setLocal(id, record) {
  try { localStorage.setItem(localKey(id), JSON.stringify(normalize(record))); }
  catch (err) { console.warn('[Rakino] não foi possível guardar recorde local:', err); }
}

export async function getRecord(gameId) {
  const id = cleanGameId(gameId);
  const local = getLocal(id);
  if (!Auth.isReady() && Auth.isConfigured()) { try { await Auth.init(); } catch {} }
  const { db, fs } = Auth.ctx();
  if (!db || !fs) return local;
  try {
    const snap = await fs.getDoc(fs.doc(db, 'gameRecords', id));
    if (!snap.exists()) return local;
    const cloud = normalize(snap.data());
    if (cloud.score > local.score) setLocal(id, cloud);
    return cloud.score >= local.score ? cloud : local;
  } catch (err) {
    console.warn('[Rakino] recorde online indisponível:', id, err);
    return local;
  }
}

async function currentUser(timeout = 4500) {
  if (!Auth.isReady() && Auth.isConfigured()) { try { await Auth.init(); } catch {} }
  if (!Auth.isReady()) return null;
  return new Promise(resolve => {
    let done = false, off;
    const finish = u => { if (done) return; done = true; off?.(); resolve(u || null); };
    off = Auth.onUser(finish);
    setTimeout(() => finish(null), timeout);
  });
}

export async function submitRecord(gameId, score) {
  const id = cleanGameId(gameId);
  const value = Math.max(0, Math.floor(Number(score) || 0));
  if (!id || value <= 0) return false;
  const previous = await getRecord(id);
  if (value <= previous.score) return false;
  const user = await currentUser();
  const record = { score: value, name: user ? (user.displayName || user.email || fallbackName) : fallbackName };
  // Save locally first so a guest or temporary network failure never loses a record.
  setLocal(id, record);
  const { db, fs } = Auth.ctx();
  if (user && db && fs) {
    try {
      const ref = fs.doc(db, 'gameRecords', id);
      await fs.runTransaction(db, async tx => {
        const snap = await tx.get(ref);
        const old = Number(snap.data()?.score) || 0;
        if (value > old) tx.set(ref, { ...record, uid: user.uid, updatedAt: fs.serverTimestamp() }, { merge: true });
      });
    } catch (err) {
      console.warn('[Rakino] recorde ficou salvo localmente; sincronização falhou:', id, err);
    }
  }
  return true;
}

export function mountGameRecord({ gameId, target, suffix = '' }) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return () => {};
  const paint = r => { el.textContent = r.score > 0 ? `${r.score}${suffix ? ` ${suffix}` : ''} — ${r.name}` : `Ainda não há recorde${suffix ? ` (${suffix})` : ''}`; };
  getRecord(gameId).then(paint);
  const onScore = async e => {
    if (cleanGameId(e.detail?.gameId) !== cleanGameId(gameId)) return;
    await submitRecord(gameId, e.detail.score);
    paint(await getRecord(gameId));
  };
  window.addEventListener('rakino:game-score', onScore);
  return () => window.removeEventListener('rakino:game-score', onScore);
}
