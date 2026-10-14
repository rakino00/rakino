/**
 * background.js — fundo interativo do tema "interactive".
 *
 * Sem tema, sem imagem: manchas de luz macias que se comportam como um fluido.
 *   • seguem o ponteiro/dedo com atraso diferente cada uma (daí o efeito de "rastro");
 *   • a rolagem da página empurra as manchas e as acende com a velocidade;
 *   • trocar de aba do site ou abrir um projeto manda uma onda (evento `rakino:pulse`);
 *   • parado, tudo deriva devagar sozinho.
 *
 * Custo baixo de propósito: desenha num canvas de ~1/4 da resolução (o navegador suaviza
 * ao esticar), para quando a aba fica oculta e vira um quadro estático com "reduzir movimento".
 *
 * Uso:   setBackground(true | false)     — chamado pelo profile.js conforme o tema
 *        dispatchEvent(new CustomEvent('rakino:pulse', { detail: { dir: 1, x, y } }))
 *          dir  = -1 | 0 | 1  (sentido da navegação, empurra as manchas)
 *          x, y = origem da onda em px (opcional; padrão = centro)
 */
const SCALE = 0.25;           // resolução do canvas em relação à tela
const BLOBS = 7;
const WAKE = 14;              // pontos do rastro do ponteiro

let canvas, ctx, raf = 0, active = false, w = 0, h = 0;
let palette = [[0, 240, 255], [168, 85, 247], [236, 72, 153]];
let bg = [8, 10, 15], light = false;
let blobs = [], wake = [], wakeI = 0;
let lastT = 0, energy = 0.35, calm = 0;
const ptr = { x: 0, y: 0, tx: 0, ty: 0, seen: 0 };
let scrollY = 0, scrollV = 0;
const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');

/* converte qualquer cor CSS em [r,g,b] usando o próprio canvas como parser */
function rgb(css, fallback) {
  try {
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = '#000'; c.fillStyle = String(css).trim();
    const v = c.fillStyle;
    if (v[0] === '#') return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
    const m = v.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : fallback;
  } catch { return fallback; }
}

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n, f) => rgb(cs.getPropertyValue(n) || f, rgb(f, [128, 128, 128]));
  light = document.documentElement.dataset.mode === 'light';
  bg = v('--bg', '#080A0F');
  palette = [v('--cyan', '#00F0FF'), v('--purple', '#A855F7'), v('--pink', '#EC4899')];
}

function resize() {
  if (!canvas) return;
  const cw = Math.max(1, Math.round(innerWidth * SCALE)), ch = Math.max(1, Math.round(innerHeight * SCALE));
  w = innerWidth; h = innerHeight;
  if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
  if (!ptr.seen) { ptr.x = ptr.tx = w * 0.5; ptr.y = ptr.ty = h * 0.4; }
  makeBlobs();
  if (active && ctx && reduceMQ.matches) { step(0.016, 3); draw(); }
}

function makeBlobs() {
  const big = Math.max(w, h);
  blobs = Array.from({ length: BLOBS }, (_, i) => {
    const a = (i / BLOBS) * Math.PI * 2;
    const ax = w * (0.5 + 0.34 * Math.cos(a)), ay = h * (0.5 + 0.34 * Math.sin(a * 1.3));
    return {
      x: ax, y: ay, vx: 0, vy: 0, ax, ay,
      r: big * (0.16 + (i % 3) * 0.045),
      c: i % palette.length,
      follow: 0.12 + (i / BLOBS) * 0.55,       // quanto cada mancha é atraída pelo ponteiro
      k: 2.2 + i * 0.5,                         // rigidez da mola → atrasos diferentes
      ph: i * 1.7,
    };
  });
  wake = Array.from({ length: WAKE }, () => ({ x: 0, y: 0, life: 0, c: 0 }));
}

function frame(t) {
  raf = 0;
  if (!active) return;
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
  step(dt, t / 1000); draw();
  if (!document.hidden && !reduceMQ.matches) raf = requestAnimationFrame(frame);
}

function step(dt, time) {
  // ponteiro suavizado; sem movimento há 3s → as manchas voltam a derivar sozinhas
  ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 9);
  ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 9);
  calm = Math.min(1, calm + dt / 3);
  const pull = 1 - calm * 0.85;

  scrollV *= Math.pow(0.02, dt);                      // inércia da rolagem
  energy += (0.35 + Math.min(1.1, Math.abs(scrollV) * 0.0009) - energy) * Math.min(1, dt * 2.2);

  for (const b of blobs) {
    const idleX = b.ax + Math.cos(time * 0.13 + b.ph) * w * 0.12;
    const idleY = b.ay + Math.sin(time * 0.11 + b.ph * 1.3) * h * 0.12;
    const tx = idleX + (ptr.x - idleX) * b.follow * pull;
    const ty = idleY + (ptr.y - idleY) * b.follow * pull;
    // mola amortecida
    b.vx += (tx - b.x) * b.k * dt * 6; b.vy += (ty - b.y) * b.k * dt * 6;
    b.vy += -scrollV * dt * (0.35 + b.follow);        // a rolagem arrasta as manchas
    const damp = Math.pow(0.04, dt);
    b.vx *= damp; b.vy *= damp;
    b.x += b.vx * dt; b.y += b.vy * dt;
  }
  for (const p of wake) p.life = Math.max(0, p.life - dt * 1.1);
}

function draw() {
  const W = canvas.width, H = canvas.height, s = SCALE;
  // esmaece o quadro anterior em vez de apagar: é isso que deixa o rastro "líquido"
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(${bg[0]},${bg[1]},${bg[2]},${reduceMQ.matches ? 1 : 0.16})`;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = light ? 'multiply' : 'lighter';
  const gain = light ? 0.55 : 0.21;

  for (const b of blobs) {
    const sp = Math.min(1, Math.hypot(b.vx, b.vy) / 900);
    blob(b.x * s, b.y * s, b.r * s * (1 + sp * 0.22 + energy * 0.12), palette[b.c], gain * (0.55 + energy * 0.7));
  }
  for (const p of wake) if (p.life > 0) blob(p.x * s, p.y * s, 130 * s * (0.6 + p.life * 0.5), palette[p.c], gain * 0.9 * p.life);
}

function blob(x, y, r, c, a) {
  // modo claro: cores pastel + 'multiply' (tingem o fundo claro sem escurecê-lo)
  const [R, G, B] = light ? c.map((v) => Math.round(255 - (255 - v) * 0.55)) : c;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${R},${G},${B},${Math.min(1, light ? a * 0.8 : a)})`);
  g.addColorStop(1, `rgba(${R},${G},${B},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/* ---------- entradas ---------- */
function onMove(x, y) {
  ptr.seen = 1; ptr.tx = x; ptr.ty = y; calm = 0;
  const p = wake[wakeI = (wakeI + 1) % WAKE];
  p.x = x; p.y = y; p.life = 1; p.c = wakeI % palette.length;
  energy = Math.min(1.2, energy + 0.02);
}
const onPointer = (e) => onMove(e.clientX, e.clientY);
const onTouch = (e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); };
function onScroll() {
  const y = scrollY; scrollY = window.scrollY;
  scrollV = Math.max(-2500, Math.min(2500, scrollV + (scrollY - y) * 22));
  calm = 0; wakeUp();
}
function onPulse(e) {
  const d = e.detail || {}, dir = d.dir || 0, cx = d.x ?? w * 0.5, cy = d.y ?? h * 0.5;
  energy = 0.9; calm = 0;
  blobs.forEach((b, i) => {
    const dx = b.x - cx, dy = b.y - cy, dist = Math.hypot(dx, dy) || 1;
    const push = 900 * (0.5 + (i % 3) * 0.25);
    b.vx += dir * push * 1.1 + (dx / dist) * push * 0.45;   // a navegação empurra para o lado do destino
    b.vy += (dy / dist) * push * 0.45;
    if (dir) b.c = (b.c + 1) % palette.length;               // muda o matiz a cada troca de seção
  });
  for (let i = 0; i < 5; i++) { const p = wake[wakeI = (wakeI + 1) % WAKE]; p.x = cx + (Math.random() - 0.5) * 160; p.y = cy + (Math.random() - 0.5) * 160; p.life = 1; p.c = i % palette.length; }
  wakeUp();
}
function wakeUp() { if (active && !raf && !document.hidden && !reduceMQ.matches) { lastT = performance.now(); raf = requestAnimationFrame(frame); } }
function onVisibility() { if (!document.hidden) wakeUp(); }
function onModeChange() { readColors(); if (active && reduceMQ.matches) { draw(); } }

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.id = 'fx'; canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  ctx = canvas.getContext('2d', { alpha: false });
}

export function setBackground(on) {
  on = !!on;
  if (on === active) return;
  active = on;
  if (!on) {
    cancelAnimationFrame(raf); raf = 0;
    removeEventListener('resize', resize); removeEventListener('pointermove', onPointer);
    removeEventListener('touchmove', onTouch); removeEventListener('scroll', onScroll);
    removeEventListener('rakino:pulse', onPulse); removeEventListener('rakino:mode', onModeChange);
    document.removeEventListener('visibilitychange', onVisibility);
    reduceMQ.removeEventListener?.('change', onVisibility);
    if (canvas) canvas.hidden = true;
    return;
  }
  ensureCanvas(); canvas.hidden = false;
  readColors(); resize(); scrollY = window.scrollY;
  ctx.fillStyle = `rgb(${bg})`; ctx.fillRect(0, 0, canvas.width, canvas.height);
  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('touchmove', onTouch, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('rakino:pulse', onPulse);
  addEventListener('rakino:mode', onModeChange);
  document.addEventListener('visibilitychange', onVisibility);
  reduceMQ.addEventListener?.('change', onVisibility);
  if (reduceMQ.matches) { step(0.016, 3); draw(); } else wakeUp();
}
