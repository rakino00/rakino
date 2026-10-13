import cfg from '../../../../assets/js/firebase-config.js';

const KEY = 'frontier-advance-records-v1';
const VERSION = '10.14.1';
const CDN = `https://www.gstatic.com/firebasejs/${VERSION}/`;
const LIMIT = 10;

function localGet() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
function normalize(row) {
  return {
    hero: String(row.hero || 'Herói').slice(0, 40),
    score: Math.max(0, Math.floor(Number(row.score) || 0)),
    won: row.won === true,
    time: Math.max(0, Math.floor(Number(row.time) || 0)),
    kills: Math.max(0, Math.floor(Number(row.kills) || 0)),
    displayName: String(row.displayName || 'Jogador').slice(0, 48),
    date: row.date || new Date().toISOString(),
  };
}

/** Recordes globais para usuários autenticados e fallback local para visitantes/offline. */
export class Records {
  constructor() { this.ctxPromise = null; }
  async context() {
    if (!this.ctxPromise) this.ctxPromise = this.initFirebase();
    return this.ctxPromise;
  }
  async initFirebase() {
    if (!cfg?.apiKey || String(cfg.apiKey).startsWith('COLE')) return null;
    try {
      const [appM, authM, fsM] = await Promise.all([
        import(CDN + 'firebase-app.js'),
        import(CDN + 'firebase-auth.js'),
        import(CDN + 'firebase-firestore.js'),
      ]);
      const appName = 'frontier-advance-records';
      const app = appM.getApps().find(a => a.name === appName) || appM.initializeApp(cfg, appName);
      const auth = authM.getAuth(app);
      const db = fsM.getFirestore(app);
      const user = await new Promise(resolve => {
        let stop = () => {};
        stop = authM.onAuthStateChanged(auth, u => { stop(); resolve(u || null); }, () => { stop(); resolve(null); });
      });
      return { auth, db, user, fs: fsM };
    } catch (error) {
      console.warn('[Frontier Advance] Recordes online indisponíveis; usando recordes locais.', error);
      return null;
    }
  }
  async get() {
    const ctx = await this.context();
    if (ctx?.user) {
      try {
        const q = ctx.fs.query(ctx.fs.collection(ctx.db, 'frontierRecords'), ctx.fs.orderBy('score', 'desc'), ctx.fs.limit(LIMIT));
        const snap = await ctx.fs.getDocs(q);
        const online = snap.docs.map(d => {
          const data = d.data();
          return normalize({ ...data, date: data.createdAt?.toDate?.()?.toISOString?.() || data.date });
        });
        return online;
      } catch (error) {
        console.warn('[Frontier Advance] Não foi possível carregar o ranking online.', error);
      }
    }
    return localGet().map(normalize).sort((a, b) => b.score - a.score).slice(0, LIMIT);
  }
  async save(row) {
    const ctx = await this.context();
    const user = ctx?.user;
    const normalized = normalize({
      ...row,
      displayName: user?.displayName || user?.email?.split('@')[0] || 'Visitante',
      date: new Date().toISOString(),
    });
    const local = [...localGet(), normalized].sort((a, b) => b.score - a.score).slice(0, LIMIT);
    try { localStorage.setItem(KEY, JSON.stringify(local)); } catch {}
    if (!user || !ctx) return { online: false };
    try {
      await ctx.fs.addDoc(ctx.fs.collection(ctx.db, 'frontierRecords'), {
        uid: user.uid,
        displayName: normalized.displayName,
        hero: normalized.hero,
        score: normalized.score,
        won: normalized.won,
        time: normalized.time,
        kills: normalized.kills,
        createdAt: ctx.fs.serverTimestamp(),
      });
      return { online: true };
    } catch (error) {
      console.warn('[Frontier Advance] Não foi possível salvar o recorde online.', error);
      return { online: false };
    }
  }
}
