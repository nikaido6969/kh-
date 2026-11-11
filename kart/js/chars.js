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
function eyes(g, x, y, z, sp, r = 0.08, white = true) {
  for (const s of [-1, 1]) {
    if (white) mk(g, GEO.sph(r, 10, 8), 0xffffff, x + s * sp, y, z);
    mk(g, GEO.sph(r * 0.55, 8, 6), 0x111111, x + s * sp, y, z + r * (white ? 0.6 : 0));
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
];

// ===== カート =====
function buildKart(col) {
  const g = new THREE.Group();
  const body = U.mat(col, { m: 0.35, r: 0.35 });
  const dark = U.mat(0x22252c, { r: 0.6 });
  const chrome = U.mat(0xdfe4ea, { m: 0.9, r: 0.2 });
  mk(g, GEO.box(1.35, 0.32, 2.1), 0, 0, 0.34, 0, { mat: body });
  mk(g, GEO.box(1.1, 0.25, 0.7), 0, 0, 0.4, 1.2, { mat: body, r: [0.25, 0, 0] });
  mk(g, GEO.box(1.6, 0.08, 0.35), 0, 0, 0.3, 1.45, { mat: dark });
  mk(g, GEO.box(1.4, 0.1, 0.4), 0, 0, 0.95, -1.0, { mat: body });
  for (const s of [-1, 1]) mk(g, GEO.box(0.08, 0.5, 0.3), 0, s * 0.55, 0.7, -1.0, { mat: dark });
  mk(g, GEO.box(0.9, 0.5, 0.25), 0, 0, 0.7, -0.45, { mat: dark });
  mk(g, GEO.tor(0.18, 0.03), 0, 0, 0.75, 0.55, { mat: dark, r: [-0.8, 0, 0] });
  const flames = [];
  for (const s of [-1, 1]) {
    mk(g, GEO.cyl(0.08, 0.1, 0.4, 8), 0, s * 0.3, 0.45, -1.15, { mat: chrome, r: [1.57, 0, 0] });
    const fl = new THREE.Mesh(GEO.cone(0.12, 0.6, 8), new THREE.MeshBasicMaterial({ color: 0x5ad8ff, transparent: true, opacity: 0.85 }));
    fl.rotation.x = -Math.PI / 2; fl.position.set(s * 0.3, 0.45, -1.55); fl.visible = false; g.add(fl); flames.push(fl);
  }
  const wheels = [];
  const wg = GEO.cyl(0.32, 0.32, 0.32, 14);
  const hg = GEO.cyl(0.16, 0.16, 0.34, 8);
  for (const [x, z, f] of [[-0.78, 0.8, 1], [0.78, 0.8, 1], [-0.8, -0.75, 0], [0.8, -0.75, 0]]) {
    const w = new THREE.Group(); w.position.set(x, 0.32, z);
    const t = mk(w, wg, 0, 0, 0, 0, { mat: dark, r: [0, 0, Math.PI / 2] });
    mk(w, hg, 0, 0, 0, 0, { mat: chrome, r: [0, 0, Math.PI / 2] });
    g.add(w); wheels.push({ g: w, front: !!f, tire: t });
  }
  const anchor = new THREE.Group(); anchor.position.set(0, 0.5, -0.25); g.add(anchor);
  return { g, wheels, flames, anchor };
}

function buildRacerModel(ch) {
  const k = buildKart(ch.color);
  const drv = new THREE.Group();
  const anim = ch.build(drv) || (() => {});
  k.anchor.add(drv);
  return { root: k.g, kart: k, drv, anim };
}
