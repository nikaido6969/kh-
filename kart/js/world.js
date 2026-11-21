// ===== 新コース12本：ジャングル探検 & 世界の名所めぐり =====
// 路面テクスチャ
Object.assign(SURF, {
  cobble: (g, s) => { g.fillStyle = '#7a7468'; g.fillRect(0, 0, s, s); const r = U.rng(41); for (let y = 0; y < s; y += 16) for (let x = (y / 16 % 2) * 8; x < s; x += 16) { const c = 100 + r() * 50 | 0; g.fillStyle = `rgb(${c},${c - 6},${c - 16})`; g.beginPath(); g.ellipse(x + 8, y + 8, 7, 6.5, 0, 0, 7); g.fill(); } },
  brickroad: (g, s) => { g.fillStyle = '#6a5a4a'; g.fillRect(0, 0, s, s); const r = U.rng(43); for (let y = 0; y < s; y += 20) for (let x = (y / 20 % 2) * 22; x < s; x += 44) { const c = 130 + r() * 40 | 0; g.fillStyle = `rgb(${c},${c - 24},${c - 50})`; g.fillRect(x + 1, y + 1, 42, 18); } },
  jungle: (g, s) => { noise(g, s, '#6a4a2a', 0.35, 8000, 3); const r = U.rng(47); g.fillStyle = 'rgba(60,110,40,0.55)'; for (let i = 0; i < 40; i++) g.fillRect(r() * s, r() * s, 6 + r() * 10, 3 + r() * 6); },
  junglefloor: (g, s) => { noise(g, s, '#2f5a22', 0.4, 9000, 3); const r = U.rng(49); g.fillStyle = 'rgba(120,80,40,0.4)'; for (let i = 0; i < 30; i++) g.fillRect(r() * s, r() * s, 10 + r() * 20, 4); },
  desertroad: (g, s) => { noise(g, s, '#c8a068', 0.25, 7000, 3); g.fillStyle = 'rgba(120,80,40,0.35)'; g.fillRect(s * 0.28, 0, 14, s); g.fillRect(s * 0.66, 0, 14, s); },
  dune: (g, s) => { noise(g, s, '#e4c48a', 0.2, 6000, 3); g.strokeStyle = 'rgba(180,140,80,0.4)'; g.lineWidth = 3; for (let y = 10; y < s; y += 22) { g.beginPath(); for (let x = 0; x <= s; x += 8) { const yy = y + Math.sin(x / 20) * 4; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); } },
  cityroad: (g, s) => { noise(g, s, '#3e4046', 0.2, 6000); g.fillStyle = '#f4f4f0'; g.fillRect(6, 0, 5, s); g.fillRect(s - 11, 0, 5, s); g.fillStyle = '#ffd23a'; g.fillRect(s / 2 - 5, 0, 4, s * 0.6); g.fillRect(s / 2 + 1, 0, 4, s * 0.6); },
  plaza: (g, s) => { g.fillStyle = '#c8c0b0'; g.fillRect(0, 0, s, s); g.strokeStyle = '#a89e8c'; g.lineWidth = 2; for (let i = 0; i <= s; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(s, i); g.stroke(); } },
  stoneroad: (g, s) => { noise(g, s, '#8a8478', 0.3, 8000, 3); const r = U.rng(53); g.strokeStyle = 'rgba(50,45,40,0.5)'; g.lineWidth = 2; for (let i = 0; i < 18; i++) { g.strokeRect(r() * s, r() * s, 20 + r() * 30, 14 + r() * 20); } },
});

const LANDMARK = new Set(['eiffel', 'pyramid', 'sphinx', 'greatwall', 'fuji', 'colosseum', 'bigben', 'liberty', 'skyscraper', 'opera', 'angkor', 'waterfall', 'pagoda', 'harbourbridge', 'londoneye']);

// 名所や景色の3Dモデル（ローポリ）
(() => {
  const M4 = (x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  const P = (geo, col, m, o) => ({ geo, mat: U.mat(col, o || {}), m });
  const PM = (geo, mat, m) => ({ geo, mat, m });
  const winTex = (key, bg, lit) => makeTex(key, 128, (g, s) => { g.fillStyle = bg; g.fillRect(0, 0, s, s); const r = U.rng(key.length * 7); for (let y = 6; y < s; y += 14) for (let x = 6; x < s; x += 12) { g.fillStyle = r() < 0.45 ? lit : 'rgba(20,30,50,0.85)'; g.fillRect(x, y, 7, 9); } });
  const archTex = makeTex('arch', 256, (g, s) => { g.fillStyle = '#d8c49a'; g.fillRect(0, 0, s, s); g.fillStyle = '#3a2e22'; for (let row = 0; row < 3; row++) for (let i = 0; i < 8; i++) { const x = i * 32 + 6, y = row * 80 + 14; g.fillRect(x, y + 14, 20, 44); g.beginPath(); g.arc(x + 10, y + 14, 10, Math.PI, 0); g.fill(); } g.fillStyle = 'rgba(120,90,50,0.35)'; for (let row = 1; row < 3; row++) g.fillRect(0, row * 80 + 4, s, 6); });
  const clockTex = makeTex('clockface', 128, (g, s) => { g.fillStyle = '#c8a860'; g.fillRect(0, 0, s, s); g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; g.fillStyle = '#222'; g.fillRect(64 + Math.cos(a) * 42 - 2, 64 + Math.sin(a) * 42 - 2, 4, 4); } g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 28); g.moveTo(64, 64); g.lineTo(90, 70); g.stroke(); }, false);
  const fallTex = makeTex('waterfallTex', 128, (g, s) => { const r = U.rng(5); g.fillStyle = '#bfe6ff'; g.fillRect(0, 0, s, s); for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; g.fillRect(r() * s, r() * s, 2 + r() * 3, 20 + r() * 50); } });
  const stdMat = (map, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ map, roughness: 0.85 }, o));
  Object.assign(DECO, {
    // ---- ジャングル ----
    jungletree: () => [P(new THREE.CylinderGeometry(0.7, 1.2, 16, 7), 0x6a4a2a, M4(0, 8, 0)), P(new THREE.IcosahedronGeometry(6, 0), 0x2f7a2a, M4(0, 17, 0, 1.3, 0.5, 1.3), { flat: true }), P(new THREE.IcosahedronGeometry(4.5, 0), 0x3f9a34, M4(2, 19.5, 1, 1.2, 0.5, 1.2), { flat: true }), P(new THREE.CylinderGeometry(0.08, 0.08, 9, 3), 0x3a7a2a, M4(3, 12, 0)), P(new THREE.CylinderGeometry(0.08, 0.08, 7, 3), 0x3a7a2a, M4(-2.5, 13, 1))],
    fern: () => [0, 1, 2, 3, 4, 5].map(i => P(new THREE.ConeGeometry(0.5, 3.2, 3), i % 2 ? 0x3a9a3a : 0x2f8a30, M4(Math.cos(i) * 0.9, 1.1, Math.sin(i) * 0.9, 1, 1, 0.25, i, Math.cos(i) * 0.9, Math.sin(i) * 0.9), { flat: true })),
    banana: () => [P(new THREE.CylinderGeometry(0.25, 0.35, 5, 6), 0x6a8a3a, M4(0, 2.5, 0))].concat([0, 1, 2, 3, 4].map(i => P(new THREE.BoxGeometry(0.9, 0.1, 4), 0x4aaa3a, M4(Math.cos(i * 1.26) * 1.6, 5, Math.sin(i * 1.26) * 1.6, 1, 1, 1, -i * 1.26 + Math.PI / 2, 0.5), { flat: true }))),
    jflower: () => [P(new THREE.ConeGeometry(0.6, 1, 5), 0xff3a6a, M4(0, 0.6, 0, 1, 1, 1, 0, Math.PI), { e: 0x401020 }), P(new THREE.SphereGeometry(0.2, 6, 4), 0xffe04a, M4(0, 0.7, 0))],
    // ---- 遺跡・滝 ----
    angkor: () => {
      const st = 0x8a8a74, a = [P(new THREE.BoxGeometry(110, 8, 90), st, M4(0, 4, 0), { flat: true }), P(new THREE.BoxGeometry(80, 10, 64), 0x7a7a66, M4(0, 13, 0), { flat: true }), P(new THREE.BoxGeometry(54, 10, 42), st, M4(0, 23, 0), { flat: true })];
      for (const [x, z, h] of [[0, 0, 46], [-22, -16, 30], [22, -16, 30], [-22, 16, 30], [22, 16, 30]]) { a.push(P(new THREE.CylinderGeometry(2, 7, h, 8), 0x7a7a64, M4(x, 28 + h / 2, z), { flat: true })); for (let i = 1; i < 5; i++) a.push(P(new THREE.TorusGeometry(7 - i * 1.25, 0.9, 4, 8), 0x6a6a56, M4(x, 28 + h * i / 5, z, 1, 1, 1, 0, Math.PI / 2))); }
      return a;
    },
    waterfall: () => [P(new THREE.BoxGeometry(90, 70, 30), 0x5a5a4a, M4(0, 35, -12), { flat: true }), P(new THREE.BoxGeometry(92, 4, 34), 0x3f7a2f, M4(0, 71, -12), { flat: true }), PM(new THREE.PlaneGeometry(60, 70), stdMat(fallTex, { emissive: 0x6aa8d8, emissiveIntensity: 0.4, transparent: true, opacity: 0.92 }), M4(0, 35, 3.2)), P(new THREE.IcosahedronGeometry(16, 1), 0xffffff, M4(0, 4, 8, 2.2, 0.5, 1), { op: 0.55, e: 0x8aa8c0 })],
    // ---- パリ ----
    eiffel: () => {
      const c = 0x6a5a4a, a = [];
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.push(P(new THREE.BoxGeometry(5, 64, 5), c, M4(x * 18, 28, z * 18, 1, 1, 1, 0, -z * 0.32, x * 0.32), { m: 0.4 }));
      a.push(P(new THREE.BoxGeometry(46, 4, 46), c, M4(0, 56, 0), { m: 0.4 }));
      a.push(P(new THREE.CylinderGeometry(6, 15, 60, 4), c, M4(0, 88, 0, 1, 1, 1, Math.PI / 4), { m: 0.4, flat: true }));
      a.push(P(new THREE.BoxGeometry(16, 3, 16), c, M4(0, 118, 0)));
      a.push(P(new THREE.CylinderGeometry(1.2, 6, 62, 4), c, M4(0, 150, 0, 1, 1, 1, Math.PI / 4), { m: 0.4, flat: true }));
      a.push(P(new THREE.CylinderGeometry(0.4, 0.6, 14, 4), 0xc8c0b0, M4(0, 188, 0)));
      a.push(P(new THREE.SphereGeometry(1.4, 6, 4), 0xffe08a, M4(0, 196, 0), { e: 0xffc040, ei: 1 }));
      return a;
    },
    lamp: () => [P(new THREE.CylinderGeometry(0.12, 0.18, 5, 6), 0x2a2a2a, M4(0, 2.5, 0), { m: 0.6 }), P(new THREE.SphereGeometry(0.45, 8, 6), 0xfff2c0, M4(0, 5.2, 0), { e: 0xffd880, ei: 0.9 })],
    cafe: () => [P(new THREE.BoxGeometry(8, 7, 6), 0xf0e4d0, M4(0, 3.5, 0)), P(new THREE.BoxGeometry(8.4, 1.2, 2.4), 0xd83a4a, M4(0, 3.6, 3.6, 1, 1, 1, 0, 0.35)), P(new THREE.BoxGeometry(8.2, 1.4, 6.2), 0x5a6a8a, M4(0, 7.6, 0), { flat: true })],
    // ---- エジプト ----
    pyramid: () => [P(new THREE.ConeGeometry(70, 92, 4), 0xd8b070, M4(0, 46, 0, 1, 1, 1, Math.PI / 4), { flat: true }), P(new THREE.ConeGeometry(42, 56, 4), 0xc8a060, M4(95, 28, 40, 1, 1, 1, Math.PI / 4), { flat: true }), P(new THREE.ConeGeometry(26, 34, 4), 0xd0a868, M4(150, 17, 70, 1, 1, 1, Math.PI / 4), { flat: true })],
    sphinx: () => [P(new THREE.BoxGeometry(10, 8, 30), 0xc8a060, M4(0, 4, 0), { flat: true }), P(new THREE.BoxGeometry(8, 10, 8), 0xd0a868, M4(0, 11, 13), { flat: true }), P(new THREE.ConeGeometry(7, 8, 4), 0x4a7ab0, M4(0, 15, 12, 1, 1, 1, Math.PI / 4), { flat: true }), P(new THREE.BoxGeometry(3, 2, 12), 0xc8a060, M4(-3.5, 1, 19)), P(new THREE.BoxGeometry(3, 2, 12), 0xc8a060, M4(3.5, 1, 19))],
    obelisk: () => [P(new THREE.CylinderGeometry(0.9, 1.6, 14, 4), 0xc8a878, M4(0, 7, 0, 1, 1, 1, Math.PI / 4), { flat: true }), P(new THREE.ConeGeometry(1.2, 2, 4), 0xffd060, M4(0, 15, 0, 1, 1, 1, Math.PI / 4), { m: 0.6 })],
    // ---- 中国 ----
    greatwall: () => [P(new THREE.BoxGeometry(70, 9, 7), 0x9a8a72, M4(0, 4.5, 0), { flat: true }), ...[-30, -18, -6, 6, 18, 30].map(x => P(new THREE.BoxGeometry(4, 2.2, 7.4), 0x8a7a62, M4(x, 10, 0))), P(new THREE.BoxGeometry(12, 16, 12), 0x8a7a62, M4(36, 8, 0), { flat: true }), P(new THREE.ConeGeometry(9, 5, 4), 0x6a3a2a, M4(36, 18.5, 0, 1, 1, 1, Math.PI / 4), { flat: true })],
    // ---- 日本 ----
    fuji: () => [P(new THREE.ConeGeometry(160, 150, 9), 0x4a6a9a, M4(0, 60, 0), { flat: true }), P(new THREE.ConeGeometry(58, 54, 9), 0xf4f6ff, M4(0, 108, 0), { flat: true })],
    torii: () => [P(new THREE.CylinderGeometry(0.5, 0.6, 9, 8), 0xd8322a, M4(-4, 4.5, 0)), P(new THREE.CylinderGeometry(0.5, 0.6, 9, 8), 0xd8322a, M4(4, 4.5, 0)), P(new THREE.BoxGeometry(11.5, 0.9, 1.2), 0x2a2222, M4(0, 9.3, 0)), P(new THREE.BoxGeometry(10, 0.6, 0.9), 0xd8322a, M4(0, 7.6, 0))],
    pagoda: () => { const a = []; for (let i = 0; i < 5; i++) { const w = 14 - i * 2; a.push(P(new THREE.BoxGeometry(w * 0.6, 4, w * 0.6), 0xb8382a, M4(0, i * 6 + 2, 0))); a.push(P(new THREE.ConeGeometry(w * 0.85, 2.4, 4), 0x3a3a40, M4(0, i * 6 + 5, 0, 1, 1, 1, Math.PI / 4), { flat: true })); } a.push(P(new THREE.CylinderGeometry(0.3, 0.3, 7, 5), 0xc8a040, M4(0, 34, 0), { m: 0.6 })); return a; },
    sakura: () => [P(new THREE.CylinderGeometry(0.4, 0.6, 4, 6), 0x5a3a2a, M4(0, 2, 0)), P(new THREE.IcosahedronGeometry(3, 1), 0xffb8d0, M4(0, 5.4, 0, 1.2, 0.8, 1.2), { flat: true }), P(new THREE.IcosahedronGeometry(2, 0), 0xffd0e0, M4(1.6, 6, 0.8), { flat: true })],
    // ---- ローマ ----
    colosseum: () => [PM(new THREE.CylinderGeometry(62, 62, 46, 32, 1, true), stdMat(archTex, { side: THREE.DoubleSide }), M4(0, 23, 0, 1, 1, 0.8)), P(new THREE.CylinderGeometry(50, 50, 30, 32, 1, true), 0xb8a47e, M4(0, 15, 0, 1, 1, 0.8), { ds: true }), P(new THREE.CylinderGeometry(62, 62, 2, 32), 0xc8b48a, M4(0, 1, 0, 1, 1, 0.8))],
    cypress: () => [P(new THREE.CylinderGeometry(0.25, 0.35, 2, 5), 0x5a3a20, M4(0, 1, 0)), P(new THREE.ConeGeometry(1.2, 9, 7), 0x2a5a2a, M4(0, 6, 0), { flat: true })],
    column: () => [P(new THREE.CylinderGeometry(1, 1.1, 12, 10), 0xe8dcc0, M4(0, 6, 0)), P(new THREE.BoxGeometry(2.8, 0.8, 2.8), 0xd8ccb0, M4(0, 12.4, 0))],
    // ---- ロンドン ----
    bigben: () => [P(new THREE.BoxGeometry(14, 80, 14), 0xc8a868, M4(0, 40, 0), { flat: true }), ...[0, 1, 2, 3].map(i => PM(new THREE.PlaneGeometry(10, 10), stdMat(clockTex, { emissive: 0x605030, emissiveIntensity: 0.3 }), M4(Math.sin(i * Math.PI / 2) * 7.05, 68, Math.cos(i * Math.PI / 2) * 7.05, 1, 1, 1, i * Math.PI / 2))), P(new THREE.ConeGeometry(10.5, 22, 4), 0x3a4a3a, M4(0, 91, 0, 1, 1, 1, Math.PI / 4), { flat: true }), P(new THREE.BoxGeometry(60, 26, 16), 0xc0a060, M4(-37, 13, 0), { flat: true })],
    londoneye: () => [P(new THREE.TorusGeometry(55, 1.2, 6, 48), 0xe8eef6, M4(0, 62, 0), { m: 0.5 }), P(new THREE.BoxGeometry(2, 66, 2), 0xd8dde6, M4(-12, 31, 0, 1, 1, 1, 0, 0, -0.18)), P(new THREE.BoxGeometry(2, 66, 2), 0xd8dde6, M4(12, 31, 0, 1, 1, 1, 0, 0, 0.18)), ...Array.from({ length: 16 }, (_, i) => P(new THREE.SphereGeometry(2.4, 8, 6), 0xbfe6ff, M4(Math.cos(i / 16 * 6.28) * 55, 62 + Math.sin(i / 16 * 6.28) * 55, 0, 1.3, 1, 1), { op: 0.85 }))],
    redbox: () => [P(new THREE.BoxGeometry(1.2, 3, 1.2), 0xd8202a, M4(0, 1.5, 0)), P(new THREE.BoxGeometry(1.4, 0.4, 1.4), 0xd8202a, M4(0, 3.2, 0))],
    // ---- ニューヨーク ----
    liberty: () => [P(new THREE.BoxGeometry(22, 26, 22), 0xb8ac94, M4(0, 13, 0), { flat: true }), P(new THREE.BoxGeometry(14, 10, 14), 0xa89c84, M4(0, 31, 0), { flat: true }), P(new THREE.CylinderGeometry(4, 7, 32, 8), 0x5aa88a, M4(0, 52, 0), { flat: true }), P(new THREE.SphereGeometry(3.4, 10, 8), 0x5aa88a, M4(0, 71, 0), { flat: true }), P(new THREE.ConeGeometry(4.4, 2.6, 7), 0x5aa88a, M4(0, 74, 0), { flat: true }), P(new THREE.CylinderGeometry(1.1, 1.3, 20, 6), 0x5aa88a, M4(5.5, 72, 0, 1, 1, 1, 0, 0, -0.2), { flat: true }), P(new THREE.SphereGeometry(2, 8, 6), 0xffc040, M4(7.6, 83, 0), { e: 0xffa020, ei: 1 })],
    skyscraper: () => [PM(new THREE.BoxGeometry(22, 120, 22), stdMat(winTex('win1', '#4a5a72', 'rgba(255,230,150,0.9)'), { metalness: 0.3 }), M4(0, 60, 0)), PM(new THREE.BoxGeometry(16, 80, 16), stdMat(winTex('win2', '#6a7a8a', 'rgba(200,230,255,0.9)')), M4(30, 40, 10)), P(new THREE.ConeGeometry(4, 18, 4), 0xc8ccd6, M4(0, 129, 0, 1, 1, 1, Math.PI / 4), { m: 0.7 })],
    taxi: () => [P(new THREE.BoxGeometry(2, 1, 4.2), 0xffc81a, M4(0, 0.8, 0)), P(new THREE.BoxGeometry(1.8, 0.8, 2.2), 0xffd84a, M4(0, 1.6, -0.2)), P(new THREE.BoxGeometry(0.8, 0.3, 0.4), 0xffffff, M4(0, 2.15, -0.2), { e: 0x808080 })],
    // ---- シドニー ----
    opera: () => { const a = [P(new THREE.BoxGeometry(90, 8, 50), 0xc8b8a0, M4(0, 4, 0), { flat: true })]; [[-28, 1], [-8, 1.25], [14, 1], [34, 0.8]].forEach(([x, s], i) => { a.push(P(new THREE.SphereGeometry(18 * s, 12, 8, 0, Math.PI, 0, Math.PI / 2), 0xf6f4ee, M4(x, 8, -6, 0.7, 1.6, 1, Math.PI / 2 + 0.2 * (i % 2 ? 1 : -1)), { ds: true, r: 0.3 })); a.push(P(new THREE.SphereGeometry(14 * s, 12, 8, 0, Math.PI, 0, Math.PI / 2), 0xeeeae2, M4(x + 4, 8, 10, 0.6, 1.3, 1, -Math.PI / 2), { ds: true, r: 0.3 })); }); return a; },
    harbourbridge: () => [P(new THREE.TorusGeometry(70, 2.4, 6, 32, Math.PI), 0x6a7280, M4(0, 0, 0), { m: 0.5 }), P(new THREE.BoxGeometry(150, 3, 14), 0x5a6270, M4(0, 34, 0), { m: 0.4 }), P(new THREE.BoxGeometry(12, 44, 14), 0xb8ac94, M4(-75, 22, 0), { flat: true }), P(new THREE.BoxGeometry(12, 44, 14), 0xb8ac94, M4(75, 22, 0), { flat: true })],
  });
})();

// コース一覧に追加（3つのカップ）
CUPS.push({ name: 'ジャングル探検カップ', icon: '🌴' }, { name: '世界の名所カップA', icon: '🗼' }, { name: '世界の名所カップB', icon: '🗽' });
const WORLD = [
  { id: 'jungle', name: 'ジャングル大冒険', cup: 3, desc: '巨木とツタの密林を、道なき道で突っ走れ', w: 20, sh: 4, surf: 'jungle', shSurf: 'junglefloor', wildSurf: 'jungle', wall: 'none', edge: ['fern', 'banana', 'jflower'], gravity: 30, water: -1.2, waterColor: 0x3a6a3a,
    theme: { skyTop: 0x5aa0c8, skyBot: 0xd8f0c0, fog: 0x8ab88a, fogFar: 300, ground: 0x2f5a22, groundTex: 'junglefloor', sun: 0.95, amb: 0.85, groundDrop: 2 },
    deco: [['jungletree', 110], ['banana', 50], ['fern', 70], ['bigtree', 10]], music: { bpm: 150, root: 52, scale: 'dorian', seed: 301 }, biome: 'forest',
    gen: { length: 3600, flat: true, mix: { rally: 4, rallyJump: 2, river: 2, scurve: 2, chicane: 1, tight90: 2, wild: 2 } } },
  { id: 'amazon', name: 'アマゾン川くだり', cup: 3, desc: '大河をザブザブ渡り、ワニの川岸を駆け抜ける', w: 22, sh: 5, surf: 'mudpath', shSurf: 'junglefloor', wildSurf: 'mudpath', wall: 'none', edge: ['reed', 'fern'], gravity: 30, water: -0.8, waterColor: 0x7a6a3a,
    theme: { skyTop: 0x6aa8d8, skyBot: 0xe8f0d0, fog: 0xa0b890, fogFar: 380, ground: 0x3a6a2a, groundTex: 'junglefloor', sun: 1.0, amb: 0.85, groundDrop: 2 },
    deco: [['jungletree', 80], ['palm', 40], ['banana', 40], ['reed', 80]], music: { bpm: 138, root: 55, scale: 'dorian', seed: 307 }, biome: 'swamp',
    gen: { length: 3800, flat: true, mix: { river: 5, sweeper: 2, scurve: 2, wild: 2, rally: 2, gapjump: 1 } } },
  { id: 'angkor', name: 'アンコール遺跡', cup: 3, desc: '石の参道と崩れた遺跡。密林の奥にそびえる塔', w: 18, sh: 3, surf: 'stoneroad', shSurf: 'junglefloor', wildSurf: 'jungle', wall: 'none', edge: ['column', 'fern'], gravity: 30,
    theme: { skyTop: 0x7ab0d8, skyBot: 0xf0e4c8, fog: 0xc8c0a0, fogFar: 460, ground: 0x4a6a2a, groundTex: 'junglefloor', sun: 1.05, amb: 0.8 },
    deco: [['angkor', 3], ['jungletree', 70], ['palm', 30], ['rock', 30]], music: { bpm: 132, root: 57, scale: 'phrygian', seed: 311 }, biome: 'forest',
    gen: { length: 3600, mix: { hairpins: 2, tunnel: 2, climb: 2, descent: 2, chicane: 2, scurve: 2, rallyJump: 1 } } },
  { id: 'iguazu', name: 'イグアスの大滝', cup: 3, desc: '轟音の滝の前を、しぶきを浴びて大ジャンプ', w: 19, sh: 4, surf: 'trail', shSurf: 'junglefloor', wildSurf: 'jungle', wall: 'none', edge: ['fern', 'rock'], gravity: 30, water: -1.5, waterColor: 0x5a9ab0,
    theme: { skyTop: 0x4a9ae8, skyBot: 0xe8f6f0, fog: 0xb8d8d0, fogFar: 420, ground: 0x3a6a2a, groundTex: 'junglefloor', sun: 1.05, amb: 0.85, groundDrop: 2 },
    deco: [['waterfall', 6], ['jungletree', 70], ['banana', 30], ['rock', 40]], music: { bpm: 146, root: 59, scale: 'lydian', seed: 317 }, biome: 'forest',
    gen: { length: 4000, mix: { cliff: 3, gapjump: 2, river: 2, descent: 2, climb: 2, sweeper: 1, rallyJump: 1 } } },
  { id: 'paris', name: 'パリ・エッフェル塔', cup: 4, desc: '石畳の街並みを抜け、エッフェル塔の下を駆け抜ける', w: 18, sh: 2, surf: 'cobble', shSurf: 'sidewalk', wall: 'none', edge: ['lamp', 'cypress'], gravity: 30,
    theme: { skyTop: 0x6aa0e0, skyBot: 0xf4ecf0, fog: 0xd8d4e0, fogFar: 520, ground: 0x6a8a4a, groundTex: 'meadow', sun: 1.05, amb: 0.85 },
    deco: [['eiffel', 4], ['cafe', 40], ['house', 30], ['round', 40]], music: { bpm: 128, root: 60, scale: 'major', seed: 401 }, biome: 'city',
    gen: { length: 3400, mix: { tight90: 3, chicane: 3, scurve: 2, sweeper: 2, tunnel: 1, crests: 1 } } },
  { id: 'egypt', name: 'ピラミッド砂漠', cup: 4, desc: '砂丘を飛び越え、ピラミッドとスフィンクスの横を爆走', w: 22, sh: 6, surf: 'desertroad', shSurf: 'dune', wildSurf: 'dune', wall: 'none', edge: ['obelisk', 'cactus'], gravity: 30,
    theme: { skyTop: 0x4a8ae0, skyBot: 0xf8e8c0, fog: 0xf0d8a8, fogFar: 600, ground: 0xe0c088, groundTex: 'dune', sun: 1.25, amb: 0.85 },
    deco: [['pyramid', 4], ['sphinx', 3], ['palm', 20], ['mesa', 6]], music: { bpm: 140, root: 52, scale: 'phrygian', seed: 409 }, biome: 'desert',
    gen: { length: 4200, mix: { wild: 4, crests: 3, rallyJump: 2, gapjump: 2, sweeper: 2, scurve: 1 } } },
  { id: 'choujou', name: '万里の長城', cup: 4, desc: '山の尾根を這う長城沿いの激坂ヘアピン', w: 16, sh: 2, surf: 'brickroad', shSurf: 'cliff', wall: 'none', edge: ['rock', 'pine'], gravity: 30,
    theme: { skyTop: 0x6aa8e8, skyBot: 0xf0ece0, fog: 0xc8d0c0, fogFar: 520, ground: 0x6a8a4a, groundTex: 'meadow', sun: 1.05, amb: 0.8 },
    deco: [['greatwall', 40], ['mountain', 10], ['pine', 50], ['pagoda', 3]], music: { bpm: 134, root: 57, scale: 'yonanuki', seed: 413 }, biome: 'mountain',
    gen: { length: 4200, mix: { hairpins: 3, hairpinsDown: 2, climb: 2, cliff: 2, dropoff: 1, sweeper: 1, tunnel: 1 } } },
  { id: 'fuji', name: '富士山と鳥居', cup: 4, desc: '桜並木と千本鳥居、正面にそびえる富士山', w: 18, sh: 3, surf: 'jproad', shSurf: 'meadow', wall: 'none', edge: ['torii', 'sakura'], gravity: 30, water: -1.4, waterColor: 0x4a8ad8,
    theme: { skyTop: 0x5a9aea, skyBot: 0xfff0f4, fog: 0xe0e4f0, fogFar: 600, ground: 0x5a8a3a, groundTex: 'meadow', sun: 1.1, amb: 0.85 },
    deco: [['fuji', 2], ['pagoda', 4], ['sakura', 60], ['torii', 20], ['pine', 30]], music: { bpm: 136, root: 62, scale: 'yonanuki', seed: 419 }, biome: 'meadow',
    gen: { length: 3800, mix: { sweeper: 3, scurve: 2, climb: 2, descent: 2, tunnel: 1, crests: 2, river: 1 } } },
  { id: 'newyork', name: 'ニューヨーク摩天楼', cup: 5, desc: '超高層ビルの谷間を、イエローキャブと競り合え', w: 20, sh: 2, surf: 'cityroad', shSurf: 'sidewalk', wall: 'none', edge: ['lamp', 'taxi'], gravity: 30, water: -2, waterColor: 0x3a6a9a,
    theme: { skyTop: 0x4a7ad0, skyBot: 0xf0e0d0, fog: 0xc8ccd8, fogFar: 640, ground: 0x6a7a5a, groundTex: 'meadow', sun: 1.05, amb: 0.9 },
    deco: [['skyscraper', 60], ['liberty', 2], ['house', 10]], music: { bpm: 150, root: 57, scale: 'minor', seed: 503 }, biome: 'city',
    gen: { length: 4000, mix: { tight90: 4, sweeper: 2, spiral: 1, tunnel: 2, chicane: 2, gapjump: 1, loop: 1 } } },
  { id: 'rome', name: 'ローマ・コロッセオ', cup: 5, desc: '古代の石畳と円柱、コロッセオをぐるっと一周', w: 18, sh: 3, surf: 'cobble', shSurf: 'plaza', wall: 'none', edge: ['cypress', 'column'], gravity: 30,
    theme: { skyTop: 0x5a9ae8, skyBot: 0xf8ecd8, fog: 0xe0d4c0, fogFar: 560, ground: 0x7a8a4a, groundTex: 'meadow', sun: 1.15, amb: 0.85 },
    deco: [['colosseum', 3], ['column', 30], ['cypress', 60], ['house', 20]], music: { bpm: 132, root: 60, scale: 'major', seed: 509 }, biome: 'meadow',
    gen: { length: 3600, mix: { sweeper: 3, chicane: 2, scurve: 2, tight90: 2, crests: 2, cliff: 1 } } },
  { id: 'london', name: 'ロンドン・ビッグベン', cup: 5, desc: '時計塔と観覧車を横目に、テムズ河畔を疾走', w: 18, sh: 2, surf: 'cityroad', shSurf: 'sidewalk', wall: 'none', edge: ['lamp', 'redbox'], gravity: 30, water: -2, waterColor: 0x4a6a7a,
    theme: { skyTop: 0x7a90b0, skyBot: 0xe8e8ec, fog: 0xc0c4cc, fogFar: 460, ground: 0x5a7a4a, groundTex: 'meadow', sun: 0.9, amb: 0.9 },
    deco: [['bigben', 3], ['londoneye', 2], ['house', 40], ['round', 30]], music: { bpm: 142, root: 55, scale: 'minor', seed: 521 }, biome: 'city',
    gen: { length: 3600, mix: { tight90: 3, chicane: 2, sweeper: 2, tunnel: 2, river: 1, scurve: 2 } } },
  { id: 'sydney', name: 'シドニー・オペラハウス', cup: 5, desc: '青い湾と白い帆の屋根。ハーバーブリッジを越えて海沿いを飛ばせ', w: 20, sh: 3, surf: 'asphalt', shSurf: 'sand', wall: 'none', edge: ['palm', 'lamp'], gravity: 30, water: -1.6, waterColor: 0x2a8ad8,
    theme: { skyTop: 0x2a8af0, skyBot: 0xe8f6ff, fog: 0xc8e4f4, fogFar: 640, ground: 0x6a9a4a, groundTex: 'meadow', sun: 1.2, amb: 0.85 },
    deco: [['opera', 3], ['harbourbridge', 2], ['palm', 50], ['skyscraper', 12]], music: { bpm: 146, root: 62, scale: 'lydian', seed: 527 }, biome: 'meadow',
    gen: { length: 3800, mix: { sweeper: 3, crests: 2, gapjump: 2, river: 2, scurve: 2, cliff: 1 } } },
];
WORLD.forEach((c, i) => {
  c.open = true; c.gen.seed = 3000 + i * 131;
  c.desc = c.desc + `（約${(c.gen.length / 1000).toFixed(1)}km）`;
  COURSES.push(c);
  BIOME[c.id] = c.biome;
});
// コースごとの仕掛け
Object.assign(GIMMICKS, {
  jungle: { roll: { mesh: 'inoshishi', n: 3, v: -22, kind: 'knock', msg: '🐗 イノシシ突進！' }, pads: { mesh: 'mushroom', n: 3 } },
  amazon: { roll: { mesh: 'wani', n: 4, v: -5, kind: 'grab', msg: '🐊 ワニにかまれた！' }, current: 5 },
  angkor: { roll: { mesh: 'boulder', n: 3, v: -18, kind: 'flat', msg: '🪨 遺跡の石が転がってきた！' } },
  iguazu: { current: 6, pads: { mesh: 'geyser', n: 4 } },
  egypt: { wind: { every: 10, dur: 2.4, msg: '🏜️ 砂まじりの突風！' } },
  choujou: { roll: { mesh: 'boulder', n: 4, v: -20, kind: 'flat', msg: '🪨 長城の石が落ちてきた！' } },
  fuji: { pads: { mesh: 'geyser', n: 2 } },
  london: { wind: { every: 12, dur: 2, msg: '💨 テムズの川風！' } },
  sydney: { pads: { mesh: 'geyser', n: 3 }, wind: { every: 14, dur: 2, msg: '🌊 海風！' } },
});
