/**
 * auth.js — Login com Google (Firebase Auth) + Firestore, carregados sob demanda.
 * O SDK vem direto do CDN oficial do Google (sem build, sem npm).
 * Se o Firebase não estiver configurado (ou estiver sem internet), o site
 * continua funcionando em modo visitante.
 */
import cfg from './firebase-config.js';

const VERSION = '10.14.1';
const CDN = `https://www.gstatic.com/firebasejs/${VERSION}/`;

let A = null;   // módulo firebase-auth
let F = null;   // módulo firebase-firestore
let auth = null;
let db = null;
let ready = false;
let initPromise = null;

export const isConfigured = () => !!cfg && !!cfg.apiKey && !String(cfg.apiKey).startsWith('COLE');
export const isReady = () => ready;
export const ctx = () => ({ db, fs: F });

export async function init() {
  if (ready) return true;
  if (!isConfigured()) return false;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const [appM, authM, fsM] = await Promise.all([
        import(CDN + 'firebase-app.js'),
        import(CDN + 'firebase-auth.js'),
        import(CDN + 'firebase-firestore.js'),
      ]);
      A = authM; F = fsM;
      const app = appM.getApps?.().length ? appM.getApp() : appM.initializeApp(cfg);
      auth = A.getAuth(app);
      db = F.initializeFirestore(app, {
        localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
      });
      ready = true;
      return true;
    } catch (err) {
      console.warn('[Rakino] Firebase indisponível:', err);
      return false;
    } finally {
      initPromise = null;
    }
  })();
  return initPromise;
}

/** Chama cb(user|null) sempre que o login mudar. */
export function onUser(cb) {
  if (!ready) { cb(null); return () => {}; }
  return A.onAuthStateChanged(auth, cb);
}

export async function loginGoogle() {
  const provider = new A.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await A.signInWithPopup(auth, provider);
  } catch (e) {
    const fallback = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/web-storage-unsupported'];
    if (fallback.includes(e.code)) return A.signInWithRedirect(auth, provider); // celulares / PWA
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
    throw e;
  }
}

export const logout = () => A.signOut(auth);
