// ===== キャラクター18人 & カート =====
const GEO = {
  sph: (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h),
  box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  cyl: (a, b, h, s = 12, open = false) => new THREE.CylinderGeometry(a, b, h, s, 1, open),
  cone: (r, h, s = 10) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, a = Math.PI * 2) => new THREE.TorusGeometry(r, t, 8, 18, a),
};
function mk(g, geo, col, x, y, z, o = {}) {
  const m = new THREE.Mesh(geo, o.mat || U.mat(col, o.mo || {}));
  m.position.set(x, y, z);
  if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2]);
  if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
  g.add(m); return m;
}
// アニメ調の目：白目＋大きな色付き瞳＋瞳孔＋キラッとしたハイライト＋ほっぺ
const EYE_HI = new THREE.MeshBasicMaterial({ color: 0xffffff });
const EYE_PU = new THREE.MeshBasicMaterial({ color: 0x0a0614 });
const BLUSH = new THREE.MeshBasicMaterial({ color: 0xff7a9a, transparent: true, opacity: 0.55, depthWrite: false });
function eyes(g, x, y, z, sp, r = 0.08, white = true, iris = 0x4a2a8a) {
  for (const s of [-1, 1]) {
    const ex = x + s * sp;
    if (white) {
      mk(g, GEO.sph(r * 1.18, 16, 12), 0xffffff, ex, y, z, { s: [0.95, 1.25, 0.5], mo: { r: 0.2 } }).userData.noOutline = true;
      mk(g, GEO.sph(r * 0.86, 16, 12), iris, ex, y - r * 0.08, z + r * 0.32, { s: [1, 1.25, 0.45], mo: { r: 0.25 } }).userData.noOutline = true;
      mk(g, GEO.sph(r * 0.46, 12, 8), 0, ex, y - r * 0.08, z + r * 0.5, { s: [1, 1.2, 0.4], mat: EYE_PU });
      mk(g, GEO.sph(r * 0.27, 10, 8), 0, ex - s * r * 0.28, y + r * 0.34, z + r * 0.66, { mat: EYE_HI });
      mk(g, GEO.sph(r * 0.13, 8, 6), 0, ex + s * r * 0.3, y - r * 0.42, z + r * 0.64, { mat: EYE_HI });
      mk(g, GEO.sph(r * 0.75, 10, 6), 0, ex + s * r * 0.55, y - r * 1.75, z + r * 0.1, { s: [1.3, 0.55, 0.3], mat: BLUSH });
    } else {
      mk(g, GEO.sph(r * 0.62, 12, 8), 0, ex, y, z, { s: [1, 1.25, 0.6], mat: EYE_PU });
      mk(g, GEO.sph(r * 0.22, 8, 6), 0, ex - s * r * 0.15, y + r * 0.25, z + r * 0.3, { mat: EYE_HI });
    }
  }
}

// ===== アニメ調シェーディング（トゥーン＋輪郭線） =====
const TOON = (() => {
  const d = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
const TOON_CACHE = new Map();
const OUTLINE_MAT = (() => {
  const m = new THREE.MeshBasicMaterial({ color: 0x1e1030, side: THREE.BackSide });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * 0.022;'); };
  return m;
})();
function toonify(root) {
  const list = [];
  root.traverse(o => { if (o.isMesh) list.push(o); });
  for (const o of list) {
    const m = o.material;
    if (m && m.isMeshStandardMaterial) {
      const key = [m.color.getHex(), m.emissive.getHex(), m.emissiveIntensity, m.transparent, m.opacity, m.side, m.map ? m.map.uuid : ''].join('|');
      let t = TOON_CACHE.get(key);
      if (!t) {
        t = new THREE.MeshToonMaterial({ color: m.color.clone().multiplyScalar(1.08), emissive: m.emissive, emissiveIntensity: m.emissiveIntensity * 0.9, map: m.map, transparent: m.transparent, opacity: m.opacity, side: m.side, gradientMap: TOON });
        TOON_CACHE.set(key, t);
      }
      o.material = t;
    }
    if (o.userData.noOutline || !o.material || o.material.transparent || o.material.isMeshBasicMaterial || o.material.isSpriteMaterial) continue;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const sc = o.getWorldScale ? 1 : 1;
    if (o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z) < 0.09) continue;
    const ol = new THREE.Mesh(o.geometry, OUTLINE_MAT); ol.userData.outline = true; o.add(ol);
  }
}
function shibaHead(g, y, sc = 1) {
  const h = new THREE.Group(); h.position.y = y; h.scale.setScalar(sc); g.add(h);
  mk(h, GEO.sph(0.36), 0xd98a3a, 0, 0, 0, { s: [1.1, 0.95, 1] });
  mk(h, GEO.sph(0.2), 0xfff4e6, 0, -0.1, 0.26, { s: [1.2, 0.8, 1] });
  mk(h, GEO.sph(0.06), 0x1a1a1a, 0, -0.02, 0.44);
  mk(h, GEO.sph(0.12), 0xfff4e6, -0.16, 0.06, 0.24, { s: [1, 0.6, 0.6] });
  mk(h, GEO.sph(0.12), 0xfff4e6, 0.16, 0.06, 0.24, { s: [1, 0.6, 0.6] });
  for (const s of [-1, 1]) mk(h, GEO.cone(0.12, 0.26, 4), 0xc9782e, s * 0.2, 0.36, 0, { r: [0, 0, -s * 0.25] });
  eyes(h, 0, 0.1, 0.3, 0.12, 0.05, false);
  return h;
}

const CHARS = [
  {
    id: 'kunekune', name: 'くねくね星人', desc: '常に揺れている謎の白い生命体', color: 0xf4f4ff, st: [3, 4, 4, 2],
    build(g) {
      const segs = [];
      for (let k = 0; k < 8; k++) segs.push(mk(g, GEO.sph(0.2 - k * 0.008), 0xf8f8ff, 0, 0.15 + k * 0.2, 0));
      const head = segs[7];
      eyes(head, 0, 0.03, 0.12, 0.07, 0.04, false);
      const arms = [mk(g, GEO.cyl(0.05, 0.05, 0.7, 6), 0xf8f8ff, -0.3, 0.8, 0.2, { r: [1.2, 0, 0.6] }), mk(g, GEO.cyl(0.05, 0.05, 0.7, 6), 0xf8f8ff, 0.3, 0.8, 0.2, { r: [1.2, 0, -0.6] })];
      return (t) => { segs.forEach((m, k) => { m.position.x = Math.sin(t * 6 + k * 0.8) * 0.06 * k; m.position.z = Math.cos(t * 5 + k) * 0.03 * k; }); arms[0].rotation.z = 0.6 + Math.sin(t * 7) * 0.4; arms[1].rotation.z = -0.6 - Math.sin(t * 7 + 1) * 0.4; };
    },
  },
  {
    id: 'shiba', name: '柴犬', desc: 'ただの柴犬。ハンドルは肉球で握る', color: 0xff9a3a, st: [2, 5, 4, 1],
    build(g) {
      mk(g, GEO.sph(0.4), 0xd98a3a, 0, 0.35, -0.05, { s: [1, 0.9, 1.2] });
      mk(g, GEO.sph(0.25), 0xfff4e6, 0, 0.35, 0.25);
      const h = shibaHead(g, 0.85, 1.05);
      const tail = mk(g, GEO.tor(0.14, 0.06, Math.PI * 1.6), 0xd98a3a, 0, 0.65, -0.5, { r: [0, Math.PI / 2, 0] });
      return (t) => { tail.rotation.z = Math.sin(t * 12) * 0.5; h.rotation.z = Math.sin(t * 2) * 0.08; };
    },
  },
  {
    id: 'shibaman', name: '柴犬人間', desc: '首から下は会社員。残業明けで爆走', color: 0x3a6ad8, st: [4, 3, 3, 3],
    build(g) {
      mk(g, GEO.box(0.62, 0.7, 0.36), 0xffffff, 0, 0.45, 0);
      mk(g, GEO.box(0.64, 0.4, 0.38), 0x2a2f45, 0, 0.12, 0);
      mk(g, GEO.box(0.1, 0.42, 0.02), 0xd8323a, 0, 0.5, 0.19);
      for (const s of [-1, 1]) mk(g, GEO.cyl(0.07, 0.07, 0.55, 6), 0xffffff, s * 0.3, 0.55, 0.3, { r: [1.1, 0, 0] });
      const h = shibaHead(g, 1.08, 0.95);
      return (t) => { h.rotation.y = Math.sin(t * 1.3) * 0.15; };
    },
  },
  {
    id: 'shibafu', name: '芝生人間', desc: '全身が芝生。刈られるのが怖い', color: 0x5ab04a, st: [3, 3, 4, 3],
    build(g) {
      mk(g, GEO.box(0.7, 1.0, 0.5), 0x4f9a3a, 0, 0.55, 0);
      const blades = [];
      const r = U.rng(4);
      for (let k = 0; k < 40; k++) {
        const x = (r() - 0.5) * 0.7, z = (r() - 0.5) * 0.5;
        blades.push(mk(g, GEO.cone(0.04, 0.3, 3), r() < 0.5 ? 0x6ac84a : 0x3f8a2a, x, 1.15, z));
      }
      for (let k = 0; k < 18; k++) { const a = r() * Math.PI * 2; mk(g, GEO.cone(0.035, 0.2, 3), 0x6ac84a, Math.cos(a) * 0.36, 0.2 + r() * 0.8, Math.sin(a) * 0.26, { r: [Math.sin(a) * 1.4, 0, -Math.cos(a) * 1.4] }); }
      eyes(g, 0, 0.8, 0.26, 0.14, 0.08);
      mk(g, GEO.box(0.2, 0.04, 0.02), 0x1a3a10, 0, 0.6, 0.26);
      return (t) => { blades.forEach((b, k) => { b.rotation.x = Math.sin(t * 4 + k) * 0.25; }); };
    },
  },
  {
    id: 'kamemushi', name: 'カメムシ団子', desc: 'カメムシが丸まった団子。においは強烈', color: 0x7a8a3a, st: [3, 2, 3, 4],
    build(g) {
      mk(g, GEO.cyl(0.03, 0.03, 1.6, 6), 0xd8b07a, 0, 0.75, 0);
      const balls = [];
      for (let k = 0; k < 3; k++) {
        const b = new THREE.Group(); b.position.y = 0.3 + k * 0.42; g.add(b); balls.push(b);
        mk(b, GEO.sph(0.2), 0x4a5a2a, 0, 0, 0);
        for (let q = 0; q < 9; q++) {
          const a = q / 9 * Math.PI * 2, e = (q % 3 - 1) * 0.6;
          const bug = mk(b, GEO.sph(0.11, 8, 6), q % 2 ? 0x6a8a3a : 0x8a7a3a, Math.cos(a) * 0.2 * Math.cos(e), Math.sin(e) * 0.2, Math.sin(a) * 0.2 * Math.cos(e), { s: [1, 0.45, 1.3] });
          bug.lookAt(0, 0, 0);
        }
      }
      eyes(balls[2], 0, 0.06, 0.2, 0.08, 0.055);
      for (const s of [-1, 1]) mk(balls[2], GEO.cyl(0.012, 0.012, 0.4, 4), 0x2a2a1a, s * 0.1, 0.32, 0.05, { r: [0.3, 0, s * 0.4] });
      return (t) => { balls.forEach((b, k) => { b.rotation.y = t * (1 + k * 0.3); }); };
    },
  },
  {
    id: 'natto', name: '納豆ねばお', desc: '糸を引いてコーナーにへばりつく', color: 0xc9a05a, st: [2, 5, 5, 1],
    build(g) {
      mk(g, GEO.box(0.8, 0.25, 0.6), 0xf4f4f0, 0, 0.12, 0);
      const beans = [];
      const r = U.rng(9);
      for (let k = 0; k < 16; k++) beans.push(mk(g, GEO.sph(0.11, 8, 6), 0xb0803a, (r() - 0.5) * 0.6, 0.3 + r() * 0.5 + (k > 12 ? 0.3 : 0), (r() - 0.5) * 0.45, { s: [1, 0.8, 1.3] }));
      const top = mk(g, GEO.sph(0.2), 0xb0803a, 0, 1.0, 0.05, { s: [1, 0.85, 1.2] });
      eyes(top, 0, 0.04, 0.2, 0.07, 0.05);
      const strings = [];
      for (let k = 0; k < 8; k++) strings.push(mk(g, GEO.cyl(0.006, 0.006, 0.8, 3), 0xffffff, (r() - 0.5) * 0.5, 0.7, (r() - 0.5) * 0.4, { r: [r() - 0.5, 0, r() - 0.5], mo: { op: 0.7 } }));
      return (t) => { top.position.y = 1.0 + Math.sin(t * 5) * 0.04; strings.forEach((s, k) => s.scale.y = 1 + Math.sin(t * 3 + k) * 0.3); };
    },
  },
  {
    id: 'denchu', name: '電柱おじさん', desc: '頑丈すぎる電柱。体当たり最強', color: 0x8a8a8a, st: [5, 1, 2, 5],
    build(g) {
      mk(g, GEO.cyl(0.18, 0.24, 2.2, 10), 0xa8a8a2, 0, 1.0, 0);
      mk(g, GEO.box(1.2, 0.08, 0.08), 0x5a5a5a, 0, 1.85, 0);
      for (const s of [-1, 0, 1]) mk(g, GEO.cyl(0.05, 0.05, 0.12, 6), 0xf0f0f0, s * 0.5, 1.93, 0);
      eyes(g, 0, 1.35, 0.2, 0.08, 0.06);
      mk(g, GEO.box(0.3, 0.06, 0.05), 0x2a2a2a, 0, 1.22, 0.21);
      mk(g, GEO.box(0.32, 0.14, 0.02), 0xffe23a, 0, 0.8, 0.22);
      const wire = mk(g, GEO.cyl(0.01, 0.01, 1.6, 3), 0x1a1a1a, 0.6, 1.6, -0.3, { r: [0.6, 0, 0.3] });
      return (t) => { wire.rotation.x = 0.6 + Math.sin(t * 3) * 0.2; };
    },
  },
  {
    id: 'konnyaku', name: 'こんにゃく侍', desc: 'ぷるぷるの剣豪。斬られても切れない', color: 0x6a6a7a, st: [4, 3, 2, 3],
    build(g) {
      const body = mk(g, GEO.box(0.7, 0.9, 0.42), 0x7a7880, 0, 0.5, 0, { mo: { r: 0.3 } });
      const r = U.rng(2);
      for (let k = 0; k < 24; k++) mk(body, GEO.sph(0.025, 5, 4), 0x2a2a2a, (r() - 0.5) * 0.66, (r() - 0.5) * 0.86, 0.21);
      eyes(g, 0, 0.7, 0.22, 0.14, 0.06);
      mk(g, GEO.box(0.12, 0.08, 0.3), 0x1a1a1a, 0, 1.0, -0.05);
      mk(g, GEO.cyl(0.05, 0.05, 0.25, 6), 0x1a1a1a, 0, 1.08, -0.2, { r: [1.57, 0, 0] });
      mk(g, GEO.box(0.04, 0.04, 1.1), 0xd8dde6, 0.42, 0.5, -0.1, { r: [0.5, 0, 0], mo: { m: 0.8, r: 0.2 } });
      mk(g, GEO.box(0.06, 0.06, 0.25), 0x8a2a2a, 0.42, 0.74, 0.32, { r: [0.5, 0, 0] });
      return (t) => { body.scale.set(1 + Math.sin(t * 9) * 0.04, 1 - Math.sin(t * 9) * 0.04, 1); };
    },
  },
  {
    id: 'chikuwa', name: 'ちくわ忍者', desc: '穴から向こうが見える。風通し抜群', color: 0x2a3a6a, st: [3, 4, 4, 2],
    build(g) {
      mk(g, GEO.cyl(0.28, 0.28, 1.2, 16, true), 0xf0d8a8, 0, 0.6, 0, { mo: { ds: true } });
      mk(g, GEO.cyl(0.29, 0.29, 0.12, 16, true), 0xa86a2a, 0, 0.3, 0, { mo: { ds: true } });
      mk(g, GEO.cyl(0.29, 0.29, 0.12, 16, true), 0xa86a2a, 0, 0.75, 0, { mo: { ds: true } });
      mk(g, GEO.cyl(0.13, 0.13, 1.21, 12, true), 0xd8b080, 0, 0.6, 0, { mo: { ds: true } });
      mk(g, GEO.cyl(0.3, 0.3, 0.14, 16, true), 0x1a2a5a, 0, 1.0, 0, { mo: { ds: true } });
      const tails = [mk(g, GEO.box(0.06, 0.04, 0.4), 0x1a2a5a, 0.1, 1.0, -0.45), mk(g, GEO.box(0.06, 0.04, 0.35), 0x1a2a5a, -0.1, 0.98, -0.42)];
      eyes(g, 0, 1.0, 0.3, 0.1, 0.05);
      return (t) => { tails.forEach((m, k) => { m.rotation.x = Math.sin(t * 14 + k) * 0.3; }); };
    },
  },
  {
    id: 'bonsai', name: '盆栽じいちゃん', desc: '樹齢300年。ドリフトは枝ぶりで決まる', color: 0x8a5a2a, st: [3, 2, 5, 3],
    build(g) {
      mk(g, GEO.cyl(0.4, 0.3, 0.35, 12), 0x5a4a6a, 0, 0.18, 0);
      mk(g, GEO.cyl(0.12, 0.16, 0.8, 7), 0x6a4a2a, 0.05, 0.7, 0, { r: [0, 0, 0.25] });
      mk(g, GEO.cyl(0.08, 0.1, 0.6, 6), 0x6a4a2a, -0.18, 1.05, 0, { r: [0, 0, -0.9] });
      const leaves = [mk(g, GEO.sph(0.3, 8, 6), 0x2f7a3a, -0.45, 1.25, 0, { s: [1.3, 0.6, 1], mo: { flat: true } }), mk(g, GEO.sph(0.32, 8, 6), 0x3a8a3a, 0.2, 1.3, 0, { s: [1.4, 0.6, 1.1], mo: { flat: true } }), mk(g, GEO.sph(0.2, 8, 6), 0x2f7a3a, 0.05, 1.6, 0, { s: [1.3, 0.6, 1], mo: { flat: true } })];
      eyes(g, 0.05, 0.75, 0.16, 0.08, 0.045, false);
      mk(g, GEO.cone(0.16, 0.45, 8), 0xf4f4f4, 0.05, 0.45, 0.14, { r: [Math.PI, 0, 0] });
      for (const s of [-1, 1]) mk(g, GEO.box(0.12, 0.03, 0.02), 0xf4f4f4, 0.05 + s * 0.08, 0.83, 0.16);
      return (t) => { leaves.forEach((l, k) => l.rotation.y = Math.sin(t + k) * 0.1); };
    },
  },
  {
    id: 'shingou', name: '信号機ちゃん', desc: '気分で色が変わる。赤でも止まらない', color: 0x3ac88a, st: [2, 4, 5, 2],
    build(g) {
      mk(g, GEO.box(1.1, 0.42, 0.3), 0x6a7078, 0, 0.9, 0);
      mk(g, GEO.cyl(0.05, 0.05, 0.6, 6), 0x6a7078, 0, 0.45, 0);
      mk(g, GEO.box(0.5, 0.35, 0.3), 0x5a8ad8, 0, 0.25, 0);
      const cols = [0x2aff6a, 0xffd23a, 0xff3a3a];
      const lamps = cols.map((c, k) => {
        const m = mk(g, GEO.cyl(0.13, 0.13, 0.06, 14), c, (k - 1) * 0.34, 0.9, 0.16, { r: [1.57, 0, 0] });
        m.material = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.2 });
        return m;
      });
      for (const s of [-1, 1]) mk(g, GEO.sph(0.12, 8, 6), 0x3a2a1a, s * 0.62, 1.0, 0, { s: [0.7, 1.4, 0.7] });
      eyes(g, 0, 0.68, 0.16, 0.12, 0.04, false);
      return (t) => { const k = Math.floor(t * 1.2) % 3; lamps.forEach((m, q) => m.material.emissiveIntensity = q === k ? 1.6 : 0.1); };
    },
  },
  {
    id: 'mochi', name: '鏡餅ロボ', desc: '正月生まれの重量級。みかんが本体', color: 0xff8a2a, st: [4, 2, 2, 5],
    build(g) {
      mk(g, GEO.sph(0.5), 0xfaf8f0, 0, 0.3, 0, { s: [1, 0.55, 1] });
      mk(g, GEO.sph(0.4), 0xfaf8f0, 0, 0.72, 0, { s: [1, 0.55, 1] });
      const mikan = mk(g, GEO.sph(0.2), 0xff8a1a, 0, 1.08, 0);
      mk(g, GEO.box(0.2, 0.02, 0.08), 0x2a8a3a, 0.08, 1.28, 0, { r: [0, 0, 0.4] });
      eyes(g, 0, 0.74, 0.36, 0.13, 0.06);
      const arms = [];
      for (const s of [-1, 1]) arms.push(mk(g, GEO.cyl(0.06, 0.06, 0.6, 6), 0x8a9098, s * 0.55, 0.5, 0.2, { r: [1.0, 0, s * 0.3], mo: { m: 0.7 } }));
      mk(g, GEO.box(0.9, 0.08, 0.5), 0xd8323a, 0, 0.02, 0);
      return (t) => { mikan.rotation.y = t * 2; arms.forEach((a, k) => a.rotation.x = 1.0 + Math.sin(t * 4 + k * 3) * 0.15); };
    },
  },
  {
    id: 'kurage', name: '木星クラゲ', desc: '木星の大気で育った。ガス抜きが得意', color: 0xe0a060, st: [3, 5, 3, 1],
    build(g) {
      const tex = U.bandTex(['#e8c49a', '#c9844e', '#f4e2c4', '#b0603a'], 'jband2');
      const dome = mk(g, new THREE.SphereGeometry(0.5, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.8), 0xffffff, 0, 0.7, 0, { mat: new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.92, side: THREE.DoubleSide, emissive: 0x402010 }) });
      const tents = [];
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; tents.push(mk(g, GEO.cyl(0.03, 0.01, 0.7, 4), 0xf4c090, Math.cos(a) * 0.3, 0.35, Math.sin(a) * 0.3)); }
      eyes(g, 0, 0.85, 0.42, 0.14, 0.07);
      return (t) => { dome.scale.set(1 + Math.sin(t * 4) * 0.06, 1 - Math.sin(t * 4) * 0.06, 1 + Math.sin(t * 4) * 0.06); tents.forEach((m, k) => { m.rotation.x = Math.sin(t * 5 + k) * 0.4; m.rotation.z = Math.cos(t * 4 + k) * 0.4; }); };
    },
  },
  {
    id: 'keshigomu', name: '消しゴム番長', desc: 'ケースはボロボロ。過去は消せない', color: 0x2a5ad8, st: [4, 3, 3, 4],
    build(g) {
      mk(g, GEO.box(0.62, 1.0, 0.4), 0xfafafa, 0, 0.5, 0);
      mk(g, GEO.box(0.64, 0.5, 0.42), 0x2a5ad8, 0, 0.35, 0);
      mk(g, GEO.box(0.65, 0.08, 0.43), 0x1a1a1a, 0, 0.6, 0);
      mk(g, GEO.box(0.65, 0.08, 0.43), 0xd8323a, 0, 0.12, 0);
      const pomp = mk(g, GEO.sph(0.28), 0x111111, 0, 1.1, 0.12, { s: [1, 0.6, 1.6] });
      eyes(g, 0, 0.85, 0.21, 0.12, 0.05, false);
      for (const s of [-1, 1]) mk(g, GEO.box(0.14, 0.03, 0.02), 0x111111, s * 0.12, 0.93, 0.21, { r: [0, 0, s * 0.35] });
      return (t) => { pomp.position.z = 0.12 + Math.sin(t * 6) * 0.02; };
    },
  },
  {
    id: 'gacha', name: 'ガチャ自販機', desc: '中身はランダム。たまにSSRが出る', color: 0xd8323a, st: [5, 2, 2, 5],
    build(g) {
      mk(g, GEO.box(0.8, 0.8, 0.6), 0xd8323a, 0, 0.4, 0);
      mk(g, GEO.box(0.3, 0.12, 0.05), 0xffd23a, 0, 0.35, 0.31);
      const dome = mk(g, GEO.sph(0.42), 0xffffff, 0, 1.0, 0, { mo: { op: 0.35, r: 0.1 } });
      const caps = [];
      const r = U.rng(1); const cols = [0xff5a8a, 0x5ad8ff, 0xffe04a, 0x7aff6a, 0xb05aff];
      for (let k = 0; k < 12; k++) caps.push(mk(g, GEO.sph(0.1, 8, 6), cols[k % 5], (r() - 0.5) * 0.5, 0.85 + r() * 0.3, (r() - 0.5) * 0.4));
      const handle = mk(g, GEO.box(0.3, 0.06, 0.06), 0xf0f0f0, 0, 0.6, 0.32);
      eyes(g, 0, 0.6, 0.31, 0.25, 0.06);
      return (t) => { handle.rotation.z = t * 3; caps.forEach((c, k) => c.position.y = 0.85 + ((k * 0.07 + Math.sin(t * 3 + k) * 0.05) % 0.3)); };
    },
  },
  {
    id: 'hiyashi', name: '冷やし中華', desc: '夏しか本気を出さない。始めました', color: 0xffd23a, st: [4, 4, 2, 3],
    build(g) {
      mk(g, GEO.cyl(0.5, 0.3, 0.35, 16), 0xf4f4f4, 0, 0.2, 0);
      mk(g, GEO.cyl(0.47, 0.47, 0.04, 16), 0xf2d27a, 0, 0.36, 0);
      const r = U.rng(6);
      const tops = [[0xff9aa8, 0.14], [0xffe04a, 0.12], [0x4ab04a, 0.12], [0xd8323a, 0.1]];
      tops.forEach(([c, sz], k) => { const a = k / 4 * Math.PI * 2; mk(g, GEO.box(sz * 2, 0.04, sz * 0.8), c, Math.cos(a) * 0.25, 0.4, Math.sin(a) * 0.25, { r: [0, a, 0] }); });
      const face = mk(g, GEO.sph(0.25), 0xf2d27a, 0, 0.62, 0, { s: [1, 0.8, 1] });
      eyes(face, 0, 0.05, 0.22, 0.09, 0.05);
      const tex = U.textTex('始めました', '#ffffff', '#2a5ad8', 256, 64);
      const flag = mk(g, new THREE.PlaneGeometry(0.7, 0.18), 0xffffff, 0, 1.1, -0.2, { mat: new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }) });
      mk(g, GEO.cyl(0.015, 0.015, 0.9, 4), 0x8a6a3a, -0.37, 0.8, -0.2);
      return (t) => { flag.rotation.y = Math.sin(t * 4) * 0.3; };
    },
  },
  {
    id: 'namazu', name: 'ナマズ課長', desc: '地震を予知して会議をサボる', color: 0x5a6a4a, st: [4, 2, 3, 4],
    build(g) {
      const body = mk(g, GEO.sph(0.45), 0x5a5a48, 0, 0.6, 0, { s: [1, 1.2, 0.9] });
      mk(g, GEO.sph(0.4), 0xd8d0b0, 0, 0.5, 0.12, { s: [0.9, 1.0, 0.8] });
      mk(g, GEO.box(0.4, 0.03, 0.02), 0x2a1a1a, 0, 0.75, 0.45);
      eyes(g, 0, 0.95, 0.33, 0.2, 0.07);
      for (const s of [-1, 1]) mk(g, GEO.tor(0.1, 0.015), 0x111111, s * 0.2, 0.95, 0.4);
      mk(g, GEO.box(0.12, 0.02, 0.02), 0x111111, 0, 0.95, 0.4);
      const wh = [];
      for (const s of [-1, 1]) wh.push(mk(g, GEO.cyl(0.012, 0.006, 0.9, 4), 0x2a2a1a, s * 0.45, 0.8, 0.35, { r: [0, 0, s * 1.3] }));
      mk(g, GEO.box(0.1, 0.35, 0.02), 0x2a4ad8, 0, 0.35, 0.46);
      return (t) => { wh.forEach((w, k) => w.rotation.x = Math.sin(t * 4 + k) * 0.3); body.rotation.z = Math.sin(t * 2) * 0.05; };
    },
  },
  {
    id: 'dogu', name: '土偶ギャル', desc: '縄文から来たギャル。ゴーグルは自前', color: 0xff6ab0, st: [3, 3, 3, 3],
    build(g) {
      mk(g, GEO.box(0.7, 0.6, 0.4), 0xb87a4a, 0, 0.35, 0, { mo: { flat: true } });
      mk(g, GEO.sph(0.32), 0xb87a4a, 0, 0.95, 0, { s: [1.2, 1, 0.9] });
      for (const s of [-1, 1]) {
        mk(g, GEO.sph(0.13), 0xa86a3a, s * 0.16, 0.98, 0.24, { s: [1.2, 0.8, 0.5] });
        mk(g, GEO.box(0.18, 0.025, 0.02), 0x2a1a10, s * 0.16, 0.98, 0.3);
        mk(g, GEO.sph(0.16), 0xb87a4a, s * 0.45, 0.45, 0, { s: [0.6, 1, 0.6] });
      }
      for (let k = 0; k < 4; k++) mk(g, GEO.tor(0.12, 0.02), 0x6a3a1a, 0, 0.45, 0.2 - k * 0.0, { r: [0, 0, 0], s: [1 + k * 0.3, 1 + k * 0.3, 1] });
      const bow = mk(g, GEO.sph(0.14, 8, 6), 0xff5ab0, 0.22, 1.25, 0, { s: [1.6, 0.8, 0.6] });
      mk(g, GEO.sph(0.06, 8, 6), 0xffd23a, 0, 0.72, 0.28);
      return (t) => { bow.rotation.z = Math.sin(t * 5) * 0.3; };
    },
  },
  {
    id: 'omunie', name: 'おむにえさん', desc: '紫に光る謎のレアキャラ。全能の魔法を操る', color: 0x7a2ad8, st: [5, 4, 4, 3], rare: true,
    build(g) {
      const robe = U.mat(0x6a1ac8, { r: 0.35, e: 0x2a0a50, ei: 0.6 });
      const gold = U.mat(0xffd23a, { m: 0.8, r: 0.25, e: 0x6a4a00, ei: 0.4 });
      mk(g, GEO.cone(0.62, 1.25, 20), 0, 0, 0.62, 0, { mat: robe });
      const head = new THREE.Group(); head.position.y = 1.36; g.add(head);
      mk(head, GEO.sph(0.38, 18, 14), 0xb08aff, 0, 0, 0, { mo: { r: 0.3, e: 0x3a1a8a, ei: 0.5 } });
      mk(head, GEO.cone(0.46, 0.7, 20), 0, 0, 0.32, -0.06, { mat: robe, r: [-0.25, 0, 0] });
      for (const s of [-1, 1]) {
        mk(head, GEO.sph(0.085, 10, 8), 0xffffff, s * 0.14, 0.02, 0.32, { mo: { e: 0xffffff, ei: 1.4 } });
        mk(head, GEO.sph(0.045, 8, 6), 0x3a0a8a, s * 0.14, 0.02, 0.4);
      }
      mk(head, GEO.box(0.12, 0.03, 0.02), 0x3a0a8a, 0, -0.14, 0.36);
      const halo = mk(g, GEO.tor(0.36, 0.05, Math.PI * 2), 0, 0, 1.98, -0.05, { mat: gold, r: [Math.PI / 2 - 0.25, 0, 0] });
      const orbs = [];
      for (let i = 0; i < 3; i++) {
        const o = new THREE.Mesh(GEO.sph(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: [0xff7af0, 0xb07aff, 0x7ad8ff][i] }));
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: [0xff7af0, 0xb07aff, 0x7ad8ff][i], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        gl.scale.set(0.7, 0.7, 0.7); o.add(gl); g.add(o); orbs.push(o);
      }
      const wand = new THREE.Group(); wand.position.set(0.45, 1.0, 0.25); g.add(wand);
      mk(wand, GEO.cyl(0.03, 0.03, 0.8, 6), 0x3a1a0a, 0, 0.2, 0, { r: [0.3, 0, -0.3] });
      mk(wand, new THREE.OctahedronGeometry(0.13, 0), 0, 0.12, 0.6, 0.12, { mat: gold });
      return (t) => {
        orbs.forEach((o, i) => { const a = t * 2.2 + i * 2.09; o.position.set(Math.cos(a) * 0.75, 1.2 + Math.sin(t * 3 + i) * 0.18, Math.sin(a) * 0.75); });
        halo.rotation.z = t * 1.5; head.position.y = 1.36 + Math.sin(t * 2.5) * 0.04; wand.rotation.z = Math.sin(t * 3) * 0.25;
      };
    },
  },
];

// ===== カート =====
// ===== キャラ専用カート：5種類の車体×塗装パターン×ゼッケン =====
const KART_STYLE = {
  kunekune: ['hover', 'galaxy', 0x8affd8], shiba: ['retro', 'dots', 0xffffff], shibaman: ['formula', 'stripe', 0xffd23a],
  shibafu: ['buggy', 'camo', 0x8a5a2a], kamemushi: ['buggy', 'camo', 0x3a2a1a], natto: ['retro', 'checker', 0xffffff],
  denchu: ['truck', 'hazard', 0x1a1a1a], konnyaku: ['formula', 'flame', 0xff3a3a], chikuwa: ['formula', 'flame', 0xffa020],
  bonsai: ['retro', 'gradient', 0xd8b07a], shingou: ['formula', 'checker', 0xff3a3a], mochi: ['truck', 'dots', 0xd8323a],
  kurage: ['hover', 'gradient', 0xffffff], keshigomu: ['retro', 'stripe', 0xffffff], gacha: ['truck', 'dots', 0xffe04a],
  hiyashi: ['retro', 'zebra', 0x3a8aff], namazu: ['buggy', 'camo', 0xd8d0b0], dogu: ['formula', 'flame', 0xffd23a],
  omunie: ['hover', 'galaxy', 0xffd23a],
};
const PAINT_CACHE = {};
function paintTex(pat, c1, c2, num) {
  const key = [pat, c1, c2, num].join('_'); if (PAINT_CACHE[key]) return PAINT_CACHE[key];
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const h1 = '#' + c1.toString(16).padStart(6, '0'), h2 = '#' + c2.toString(16).padStart(6, '0'), r = U.rng(c1 + c2);
  g.fillStyle = h1; g.fillRect(0, 0, S, S);
  switch (pat) {
    case 'stripe': g.fillStyle = h2; g.fillRect(S * 0.36, 0, S * 0.1, S); g.fillRect(S * 0.54, 0, S * 0.1, S); break;
    case 'flame': g.fillStyle = h2; for (let i = 0; i < 7; i++) { const x = i * S / 6; g.beginPath(); g.moveTo(x - 30, S); g.quadraticCurveTo(x - 10, S * 0.5, x + 10, S * (0.15 + r() * 0.3)); g.quadraticCurveTo(x + 4, S * 0.55, x + 34, S); g.fill(); } g.fillStyle = 'rgba(255,240,120,0.7)'; for (let i = 0; i < 7; i++) { const x = i * S / 6; g.beginPath(); g.moveTo(x - 12, S); g.quadraticCurveTo(x, S * 0.7, x + 6, S * 0.5); g.quadraticCurveTo(x + 4, S * 0.75, x + 16, S); g.fill(); } break;
    case 'dots': for (let y = 0; y < S; y += 42) for (let x = (y / 42 % 2) * 21; x < S; x += 42) { g.fillStyle = pat === 'dots' && c2 === 0xffe04a ? ['#ff5a8a', '#5ad8ff', '#ffe04a', '#7aff6a'][(x + y) % 4] : h2; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); } break;
    case 'checker': for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) { g.fillStyle = h2; g.fillRect(x * 32, y * 32, 32, 32); } break;
    case 'camo': for (let i = 0; i < 40; i++) { g.fillStyle = [h2, 'rgba(0,0,0,0.25)', 'rgba(255,255,255,0.18)'][i % 3]; g.beginPath(); g.ellipse(r() * S, r() * S, 18 + r() * 30, 10 + r() * 20, r() * 3, 0, 7); g.fill(); } break;
    case 'galaxy': { const gr = g.createLinearGradient(0, 0, S, S); gr.addColorStop(0, '#120030'); gr.addColorStop(0.5, h1); gr.addColorStop(1, '#100828'); g.fillStyle = gr; g.fillRect(0, 0, S, S); for (let i = 0; i < 120; i++) { g.fillStyle = r() < 0.2 ? h2 : '#ffffff'; g.fillRect(r() * S, r() * S, 2, 2); } g.strokeStyle = h2; g.lineWidth = 3; g.beginPath(); g.arc(S * 0.5, S * 0.5, S * 0.3, 0.3, 2.6); g.stroke(); break; }
    case 'zebra': g.fillStyle = h2; for (let i = -2; i < 10; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.quadraticCurveTo(i * 32 + 30, S / 2, i * 32, S); g.lineTo(i * 32 + 12, S); g.quadraticCurveTo(i * 32 + 42, S / 2, i * 32 + 12, 0); g.fill(); } break;
    case 'gradient': { const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, h2); gr.addColorStop(1, h1); g.fillStyle = gr; g.fillRect(0, 0, S, S); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, S * 0.18, S, 10); break; }
    case 'hazard': g.fillStyle = h2; for (let i = -8; i < 16; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 16, 0); g.lineTo(i * 32 + 16 + S, S); g.lineTo(i * 32 + S, S); g.fill(); } break;
  }
  if (num != null) { g.fillStyle = '#fff'; g.beginPath(); g.arc(S / 2, S / 2, 44, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = '#1e1030'; g.stroke(); g.fillStyle = '#1e1030'; g.font = 'bold 56px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(num), S / 2, S / 2 + 3); }
  const t = new THREE.CanvasTexture(cv); return (PAINT_CACHE[key] = t);
}

function buildKart(ch) {
  const col = ch.color, [style, pat, acc] = KART_STYLE[ch.id] || ['formula', 'stripe', 0xffffff];
  const num = CHARS.indexOf(ch) + 1;
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ map: paintTex(pat, col, acc), roughness: 0.3, metalness: 0.25 });
  const paintN = new THREE.MeshStandardMaterial({ map: paintTex(pat, col, acc, num), roughness: 0.3, metalness: 0.25 });
  const accM = U.mat(acc, { m: 0.4, r: 0.3 });
  const dark = U.mat(0x22252c, { r: 0.6 });
  const chrome = U.mat(0xdfe4ea, { m: 0.9, r: 0.2 });
  const glass = U.mat(0x9ad8ff, { op: 0.55, r: 0.05, m: 0.3 });
  let seatY = 0.5, wheelR = 0.32, wheelW = 0.32, track = 0.8, glowCol = null, exY = 0.45;
  if (style === 'formula') {
    mk(g, GEO.box(1.0, 0.3, 2.3), 0, 0, 0.34, 0.05, { mat: paint });
    mk(g, GEO.box(0.7, 0.24, 0.9), 0, 0, 0.36, 1.45, { mat: paintN, r: [0.12, 0, 0] });
    mk(g, GEO.box(1.9, 0.06, 0.36), 0, 0, 0.24, 1.75, { mat: accM });
    for (const sd of [-1, 1]) { mk(g, GEO.box(0.06, 0.22, 0.4), 0, sd * 0.94, 0.3, 1.75, { mat: accM }); mk(g, GEO.box(0.38, 0.3, 1.1), 0, sd * 0.68, 0.36, -0.15, { mat: paint }); mk(g, GEO.cyl(0.13, 0.13, 0.05, 12), 0, sd * 0.86, 0.38, 0.05, { mat: dark, r: [0, 0, Math.PI / 2] }); }
    mk(g, GEO.box(1.6, 0.08, 0.45), 0, 0, 1.12, -1.1, { mat: accM });
    for (const sd of [-1, 1]) mk(g, GEO.box(0.06, 0.6, 0.3), 0, sd * 0.5, 0.8, -1.05, { mat: dark });
    mk(g, GEO.box(0.7, 0.45, 0.4), 0, 0, 0.65, -0.55, { mat: paint });
  } else if (style === 'buggy') {
    seatY = 0.75; wheelR = 0.44; wheelW = 0.38; track = 0.92; exY = 0.7;
    mk(g, GEO.box(1.2, 0.22, 2.0), 0, 0, 0.62, 0, { mat: paint });
    mk(g, GEO.box(1.1, 0.12, 0.5), 0, 0, 0.5, 1.15, { mat: dark, r: [0.4, 0, 0] });
    mk(g, GEO.box(1.0, 0.3, 0.55), 0, 0, 0.82, 0.75, { mat: paintN, r: [-0.15, 0, 0] });
    const bar = (x1, y1, z1, x2, y2, z2) => { const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2), m = new THREE.Mesh(GEO.cyl(0.05, 0.05, a.distanceTo(b), 6), accM); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(m); };
    for (const sd of [-1, 1]) { bar(sd * 0.55, 0.7, 0.35, sd * 0.45, 1.75, -0.2); bar(sd * 0.55, 0.7, -0.85, sd * 0.45, 1.75, -0.2); }
    bar(-0.45, 1.75, -0.2, 0.45, 1.75, -0.2);
    for (const sd of [-1, 1]) mk(g, GEO.cyl(0.11, 0.11, 0.08, 10), 0xffffa0, sd * 0.35, 1.0, 1.0, { r: [Math.PI / 2, 0, 0], mo: { e: 0xffffa0, ei: 1 } });
    mk(g, GEO.box(0.9, 0.35, 0.35), 0, 0, 0.85, -0.95, { mat: dark });
  } else if (style === 'retro') {
    seatY = 0.55;
    mk(g, GEO.sph(0.75, 20, 14), 0, 0, 0.5, 0.15, { mat: paintN, s: [0.95, 0.42, 1.65] });
    mk(g, GEO.box(1.6, 0.12, 0.2), 0, 0, 0.32, 1.35, { mat: chrome });
    mk(g, GEO.box(1.5, 0.12, 0.2), 0, 0, 0.36, -1.1, { mat: chrome });
    for (const sd of [-1, 1]) { mk(g, GEO.sph(0.14, 12, 10), 0xfff6c0, sd * 0.42, 0.6, 1.1, { mo: { e: 0xfff0a0, ei: 1 } }); mk(g, GEO.cone(0.16, 0.6, 3), 0, sd * 0.5, 0.75, -0.95, { mat: accM, r: [-Math.PI / 2 - 0.4, 0, 0] }); }
    mk(g, GEO.box(0.9, 0.35, 0.06), 0, 0, 0.88, 0.6, { mat: glass, r: [-0.4, 0, 0] });
  } else if (style === 'hover') {
    seatY = 0.62; wheelR = 0.22; wheelW = 0.2; glowCol = acc === 0xffd23a ? 0xb05aff : acc;
    mk(g, GEO.cyl(1.0, 0.85, 0.32, 28), 0, 0, 0.52, 0, { mat: paintN, s: [1, 1, 1.35] });
    mk(g, GEO.tor(0.98, 0.07, Math.PI * 2), 0, 0, 0.6, 0, { mat: new THREE.MeshBasicMaterial({ color: glowCol }), r: [Math.PI / 2, 0, 0], s: [1, 1.35, 1] });
    mk(g, GEO.cone(0.32, 0.9, 16), 0, 0, 0.55, 1.35, { mat: paint, r: [Math.PI / 2, 0, 0], s: [1.5, 1, 0.5] });
    for (const sd of [-1, 1]) mk(g, GEO.box(0.06, 0.55, 0.6), 0, sd * 0.6, 0.85, -1.0, { mat: accM, r: [-0.4, 0, sd * 0.3] });
    mk(g, GEO.sph(0.62, 18, 10, ), 0, 0, 0.9, -0.1, { mat: glass, s: [1, 0.55, 1.1] });
  } else { // truck
    seatY = 0.62; wheelR = 0.36; track = 0.84;
    mk(g, GEO.box(1.4, 0.3, 2.3), 0, 0, 0.45, 0, { mat: paint });
    mk(g, GEO.box(1.4, 0.75, 0.75), 0, 0, 0.95, 0.75, { mat: paintN });
    mk(g, GEO.box(1.3, 0.4, 0.05), 0, 0, 1.12, 1.13, { mat: glass });
    for (const sd of [-1, 1]) { mk(g, GEO.box(0.06, 0.32, 1.1), 0, sd * 0.68, 0.75, -0.55, { mat: accM }); mk(g, GEO.sph(0.12, 10, 8), 0xffffa0, sd * 0.5, 0.7, 1.16, { mo: { e: 0xffffa0, ei: 1 } }); }
    mk(g, GEO.box(1.4, 0.32, 0.06), 0, 0, 0.75, -1.12, { mat: accM });
  }
  const flames = [];
  for (const sd of [-1, 1]) {
    mk(g, GEO.cyl(0.08, 0.11, 0.4, 10), 0, sd * 0.3, exY, -1.2, { mat: chrome, r: [1.57, 0, 0] });
    const fl = new THREE.Mesh(GEO.cone(0.13, 0.65, 8), new THREE.MeshBasicMaterial({ color: 0x5ad8ff, transparent: true, opacity: 0.85 }));
    fl.rotation.x = -Math.PI / 2; fl.position.set(sd * 0.3, exY, -1.62); fl.visible = false; g.add(fl); flames.push(fl);
  }
  if (glowCol) { const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: glowCol, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); gl.position.y = 0.12; gl.scale.set(3.6, 1.2, 1); g.add(gl); }
  const wheels = [];
  const wg = GEO.cyl(wheelR, wheelR, wheelW, 16), hg = GEO.cyl(wheelR * 0.55, wheelR * 0.55, wheelW + 0.02, 10);
  const rim = U.mat(acc === 0xffffff ? 0xdfe4ea : acc, { m: 0.7, r: 0.25 });
  for (const [sx, z, f] of [[-1, 0.85, 1], [1, 0.85, 1], [-1, -0.78, 0], [1, -0.78, 0]]) {
    const w = new THREE.Group(); w.position.set(sx * (track + (f ? 0 : 0.02)), wheelR, z);
    const t = mk(w, wg, 0, 0, 0, 0, { mat: dark, r: [0, 0, Math.PI / 2] });
    mk(w, hg, 0, 0, 0, 0, { mat: rim, r: [0, 0, Math.PI / 2] });
    if (style === 'buggy') for (let i = 0; i < 8; i++) mk(t, GEO.box(0.06, wheelW + 0.04, 0.1), 0, Math.cos(i * 0.785) * wheelR, 0, Math.sin(i * 0.785) * wheelR, { mat: dark, r: [0, -i * 0.785, 0] });
    g.add(w); wheels.push({ g: w, front: !!f, tire: t });
  }
  const anchor = new THREE.Group(); anchor.position.set(0, seatY, -0.25); g.add(anchor);
  return { g, wheels, flames, anchor };
}

function buildRacerModel(ch) {
  const k = buildKart(ch);
  const drv = new THREE.Group();
  const anim = ch.build(drv) || (() => {});
  k.anchor.add(drv);
  toonify(k.g);
  return { root: k.g, kart: k, drv, anim };
}
