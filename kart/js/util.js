// ===== 共通ユーティリティ =====
const U = {};
U.rng = function (seed) {
  let s = (seed >>> 0) || 1;
  return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
};
U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
U.lerp = (a, b, t) => a + (b - a) * t;
U.wrapA = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
U.damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
U.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
U.hex = (c) => '#' + c.toString(16).padStart(6, '0');

// ---- キャンバステクスチャ ----
const TEX = {};
function makeTex(key, size, draw, rep = true) {
  if (TEX[key]) return TEX[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(cv);
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  TEX[key] = t;
  return t;
}
function noise(g, s, base, vari, n = 4000, sz = 2) {
  g.fillStyle = base; g.fillRect(0, 0, s, s);
  const r = U.rng(n + s);
  for (let i = 0; i < n; i++) {
    const v = (r() - 0.5) * vari;
    g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v)})`;
    g.fillRect(r() * s, r() * s, sz * (0.5 + r()), sz * (0.5 + r()));
  }
}
const SURF = {
  asphalt: (g, s) => { noise(g, s, '#55575c', 0.25, 6000); g.fillStyle = '#f4f4f4'; g.fillRect(6, 0, 6, s); g.fillRect(s - 12, 0, 6, s); },
  jproad: (g, s) => {
    noise(g, s, '#45474b', 0.22, 7000); g.fillStyle = '#f2f2ee'; g.fillRect(8, 0, 7, s); g.fillRect(s - 15, 0, 7, s);
    g.fillRect(s / 2 - 3, 0, 6, s * 0.5);
  },
  oldroad: (g, s) => {
    noise(g, s, '#6b6a66', 0.3, 7000);
    const r = U.rng(5); g.strokeStyle = 'rgba(30,30,30,0.6)'; g.lineWidth = 2;
    for (let i = 0; i < 12; i++) { g.beginPath(); let x = r() * s, y = r() * s; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = 'rgba(70,70,70,0.5)'; for (let i = 0; i < 6; i++) g.fillRect(r() * s, r() * s, 30 + r() * 40, 20 + r() * 30);
    g.fillStyle = 'rgba(240,240,230,0.55)'; g.fillRect(s / 2 - 3, 0, 6, s * 0.45);
  },
  dirt: (g, s) => {
    noise(g, s, '#8a6238', 0.35, 8000, 3);
    g.fillStyle = 'rgba(60,40,20,0.35)'; g.fillRect(s * 0.28, 0, 18, s); g.fillRect(s * 0.66, 0, 18, s);
  },
  mud: (g, s) => { noise(g, s, '#5a3f22', 0.35, 6000, 4); g.fillStyle = 'rgba(40,25,10,0.5)'; const r = U.rng(9); for (let i = 0; i < 10; i++) { g.beginPath(); g.ellipse(r() * s, r() * s, 20 + r() * 25, 10 + r() * 15, 0, 0, 7); g.fill(); } },
  grass: (g, s) => { noise(g, s, '#5aa83c', 0.3, 9000, 2); },
  field: (g, s) => { noise(g, s, '#7aa05a', 0.25, 6000, 3); },
  rice: (g, s) => { noise(g, s, '#8cbf3f', 0.25, 5000); g.fillStyle = 'rgba(60,110,40,0.4)'; for (let i = 0; i < s; i += 16) g.fillRect(0, i, s, 4); g.fillStyle = 'rgba(120,90,50,0.5)'; g.fillRect(0, 0, s, 6); g.fillRect(0, 0, 6, s); },
  sidewalk: (g, s) => { g.fillStyle = '#b8b5ac'; g.fillRect(0, 0, s, s); g.strokeStyle = '#8f8c84'; g.lineWidth = 3; for (let i = 0; i <= s; i += 32) { g.beginPath(); g.moveTo(0, i); g.lineTo(s, i); g.stroke(); } g.fillStyle = '#dedad0'; g.fillRect(0, 0, 14, s); g.fillRect(s - 14, 0, 14, s); },
  curb: (g, s) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#e23b3b'; g.fillRect(0, i * s / 8, s, s / 8); } },
  steel: (g, s) => { noise(g, s, '#8a8f98', 0.2, 2000); g.fillStyle = '#ffd23a'; for (let i = 0; i < 8; i++) { g.save(); g.translate(0, i * 32); g.fillRect(0, 0, s, 12); g.restore(); } },
  rail: (g, s) => {
    g.fillStyle = '#3c3f46'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#a8743e' : '#9a6834'; g.fillRect(0, i * 32 + 2, s, 28); }
    noise(g, 0, 'rgba(0,0,0,0)', 0, 0);
    g.fillStyle = '#d8dde6'; g.fillRect(s * 0.18, 0, 10, s); g.fillRect(s * 0.78, 0, 10, s);
    g.fillStyle = '#ff4fa0'; g.fillRect(0, 0, 8, s); g.fillRect(s - 8, 0, 8, s);
  },
  sandroad: (g, s) => { noise(g, s, '#c99a62', 0.25, 7000); g.fillStyle = 'rgba(255,240,210,0.8)'; g.fillRect(8, 0, 6, s); g.fillRect(s - 14, 0, 6, s); },
  sand: (g, s) => { noise(g, s, '#e2c48a', 0.22, 6000); },
  rock: (g, s) => {
    noise(g, s, '#3d2a26', 0.3, 8000, 3);
    const r = U.rng(3); g.strokeStyle = 'rgba(255,110,30,0.85)'; g.lineWidth = 2;
    for (let i = 0; i < 8; i++) { g.beginPath(); let x = r() * s, y = r() * s; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = '#ff9a3a'; g.fillRect(6, 0, 5, s); g.fillRect(s - 11, 0, 5, s);
  },
  rock2: (g, s) => { noise(g, s, '#2a1c1a', 0.3, 6000, 3); },
  jupiter: (g, s) => {
    const cols = ['#e6b07a', '#d88f55', '#f2d2a6', '#c8703c', '#efc596'];
    for (let i = 0; i < 16; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(i * s / 16, 0, s / 16 + 1, s); }
    noise(g, 0, 'rgba(0,0,0,0)', 0, 0);
    g.globalAlpha = 0.25; noise(g, s, 'rgba(0,0,0,0)', 0.4, 4000, 4); g.globalAlpha = 1;
    g.fillStyle = '#fff3d0'; g.fillRect(4, 0, 6, s); g.fillRect(s - 10, 0, 6, s);
  },
  jupiter2: (g, s) => { noise(g, s, '#8a4a28', 0.3, 4000, 3); },
  neon: (g, s) => {
    g.fillStyle = '#0c1030'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(80,200,255,0.35)'; g.lineWidth = 2;
    for (let i = 0; i <= s; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(s, i); g.stroke(); }
    g.fillStyle = '#ff3ad8'; g.fillRect(0, 0, 10, s); g.fillRect(s - 10, 0, 10, s);
    g.fillStyle = '#5af2ff'; g.fillRect(s / 2 - 2, 0, 4, s / 2);
  },
  neon2: (g, s) => { g.fillStyle = '#1a0a3a'; g.fillRect(0, 0, s, s); g.fillStyle = '#7a3aff'; for (let i = 0; i < s; i += 32) g.fillRect(0, i, s, 12); },
  alien: (g, s) => {
    g.fillStyle = '#2a0a40'; g.fillRect(0, 0, s, s);
    const r = U.rng(17);
    for (let i = 0; i < 40; i++) { g.fillStyle = `hsla(${280 + r() * 60},80%,${35 + r() * 25}%,0.8)`; g.beginPath(); g.ellipse(r() * s, r() * s, 10 + r() * 22, 8 + r() * 18, r() * 3, 0, 7); g.fill(); }
    g.strokeStyle = '#7dffb0'; g.lineWidth = 3; g.beginPath();
    for (let y = 0; y <= s; y += 4) { const x = s / 2 + Math.sin(y / s * Math.PI * 4) * 20; y ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.fillStyle = '#7dffb0'; g.fillRect(0, 0, 8, s); g.fillRect(s - 8, 0, 8, s);
  },
};
Object.assign(SURF, {
  moss: (g, s) => { noise(g, s, '#4f7a34', 0.35, 9000, 3); const r = U.rng(21); g.strokeStyle = 'rgba(90,60,30,0.7)'; g.lineWidth = 7; for (let i = 0; i < 5; i++) { g.beginPath(); let x = r() * s, y = r() * s; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 90; y += r() * 40; g.lineTo(x, y); } g.stroke(); } g.fillStyle = 'rgba(160,220,90,0.5)'; for (let i = 0; i < 40; i++) g.fillRect(r() * s, r() * s, 6, 6); },
  moss2: (g, s) => { noise(g, s, '#3f6a2a', 0.3, 7000, 3); },
  cliff: (g, s) => { noise(g, s, '#8a7a68', 0.35, 9000, 3); const r = U.rng(8); g.fillStyle = 'rgba(60,45,35,0.5)'; for (let i = 0; i < 25; i++) { g.beginPath(); g.ellipse(r() * s, r() * s, 6 + r() * 14, 4 + r() * 8, r() * 3, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,230,160,0.6)'; g.fillRect(4, 0, 5, s); g.fillRect(s - 9, 0, 5, s); },
  redsand: (g, s) => { noise(g, s, '#c0703a', 0.32, 8000, 3); g.fillStyle = 'rgba(90,40,20,0.3)'; g.fillRect(s * 0.3, 0, 16, s); g.fillRect(s * 0.65, 0, 16, s); },
  cloudroad: (g, s) => { g.fillStyle = '#f4f6ff'; g.fillRect(0, 0, s, s); const r = U.rng(4); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${200 + r() * 55},${210 + r() * 45},255,0.7)`; g.beginPath(); g.arc(r() * s, r() * s, 8 + r() * 22, 0, 7); g.fill(); } const cols = ['#ff7aa8', '#ffd23a', '#7ae8a0', '#7ab0ff']; cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 4, 0, 4, s); g.fillRect(s - 16 + i * 4, 0, 4, s); }); },
  moon: (g, s) => { noise(g, s, '#9a9aa4', 0.35, 9000, 3); const r = U.rng(31); for (let i = 0; i < 14; i++) { const x = r() * s, y = r() * s, rad = 6 + r() * 20; g.strokeStyle = 'rgba(60,60,70,0.6)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, rad, 0, 7); g.stroke(); g.fillStyle = 'rgba(40,40,50,0.35)'; g.fill(); } g.fillStyle = '#5af2ff'; g.fillRect(3, 0, 5, s); g.fillRect(s - 8, 0, 5, s); },
  moon2: (g, s) => { noise(g, s, '#6a6a74', 0.3, 6000, 3); },
  candy: (g, s) => { for (let i = 0; i < 8; i++) { g.fillStyle = ['#ff7ab0', '#fff0f6', '#7ad8ff', '#fff0f6', '#ffd23a', '#fff0f6', '#9aff8a', '#fff0f6'][i]; g.save(); g.translate(0, i * 32); g.transform(1, 0.3, 0, 1, 0, 0); g.fillRect(-60, 0, s + 120, 32); g.restore(); } const r = U.rng(2); for (let i = 0; i < 80; i++) { g.fillStyle = ['#ff3a6a', '#3a8aff', '#ffe03a', '#3aff8a'][i % 4]; g.fillRect(r() * s, r() * s, 7, 3); } },
  candy2: (g, s) => { noise(g, s, '#ffc0dc', 0.2, 4000, 3); const r = U.rng(5); for (let i = 0; i < 60; i++) { g.fillStyle = ['#ff3a6a', '#3a8aff', '#ffe03a', '#fff'][i % 4]; g.fillRect(r() * s, r() * s, 6, 3); } },
});
U.surfTex = (k) => makeTex('s_' + k, 256, SURF[k] || SURF.asphalt);
U.checkerTex = () => makeTex('checker', 128, (g, s) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#fff'; g.fillRect(i * s / 8, j * s / 2, s / 8, s / 2); } });
U.boostTex = () => makeTex('boost', 128, (g, s) => {
  const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#ffde3a'); gr.addColorStop(1, '#ff7a1a');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  g.fillStyle = '#fff';
  for (let k = 0; k < 2; k++) { const y = k * s / 2; g.beginPath(); g.moveTo(s * 0.15, y + s * 0.45); g.lineTo(s / 2, y + s * 0.08); g.lineTo(s * 0.85, y + s * 0.45); g.lineTo(s * 0.7, y + s * 0.45); g.lineTo(s / 2, y + s * 0.25); g.lineTo(s * 0.3, y + s * 0.45); g.fill(); }
}, false);
U.itemBoxTex = () => makeTex('ibox', 128, (g, s) => {
  const gr = g.createLinearGradient(0, 0, s, s);
  gr.addColorStop(0, 'rgba(255,120,220,0.9)'); gr.addColorStop(0.5, 'rgba(120,220,255,0.9)'); gr.addColorStop(1, 'rgba(255,240,120,0.9)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(4, 4, s - 8, s - 8);
  g.fillStyle = '#fff'; g.font = 'bold 84px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', s / 2, s / 2 + 4);
}, false);
U.textTex = (text, bg = '#1f6fd0', fg = '#fff', w = 512, h = 128) => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = fg; g.font = `bold ${Math.floor(h * 0.5)}px "Hiragino Sans","Noto Sans JP",sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2);
  return new THREE.CanvasTexture(cv);
};
U.glowTex = () => makeTex('glow', 64, (g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
}, false);
U.bandTex = (cols, key) => makeTex(key, 256, (g, s) => {
  const r = U.rng(42);
  let y = 0; while (y < s) { const h = 6 + r() * 22; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(0, y, s, h + 1); y += h; }
  g.globalAlpha = 0.3; for (let i = 0; i < 300; i++) { g.fillStyle = cols[i % cols.length]; g.beginPath(); g.ellipse(r() * s, r() * s, 10 + r() * 30, 2 + r() * 4, 0, 0, 7); g.fill(); }
  g.globalAlpha = 1;
}, true);

// マテリアルキャッシュ
const MATS = {};
U.mat = function (color, o = {}) {
  const key = color + JSON.stringify(o);
  if (MATS[key]) return MATS[key];
  const m = new THREE.MeshStandardMaterial({
    color, roughness: o.r ?? 0.65, metalness: o.m ?? 0.05,
    emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1,
    flatShading: !!o.flat, transparent: !!o.op, opacity: o.op ?? 1, side: o.ds ? THREE.DoubleSide : THREE.FrontSide,
  });
  MATS[key] = m; return m;
};
