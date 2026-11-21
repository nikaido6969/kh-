// ===== コースごとの仕掛け =====
// roll: コースを逆走してくる障害物 / sky: 空から降ってくる / pads: 大ジャンプ台 / wind: 横風 / current: 水流
const GIMMICKS = {
  kawara: { roll: { mesh: 'log', n: 3, v: -9, kind: 'spin', msg: '🪵 流木にぶつかった！' }, current: 5, pads: { mesh: 'geyser', n: 2 } },
  numa: { pads: { mesh: 'geyser', n: 6 }, roll: { mesh: 'wani', n: 3, v: -5, kind: 'grab', msg: '🐊 ワニにかまれた！' } },
  yamamichi: { roll: { mesh: 'boulder', n: 5, v: -20, kind: 'flat', msg: '🪨 落石でぺちゃんこ！' }, sky: { mesh: 'rock', every: 5, kind: 'flat' } },
  mori: { pads: { mesh: 'mushroom', n: 7 }, roll: { mesh: 'inoshishi', n: 3, v: -24, kind: 'knock', msg: '🐗 イノシシ突進！' } },
  jupiter: { wind: { every: 9, dur: 2.6, msg: '🌪 木星の暴風！' }, sky: { mesh: 'bolt', every: 6, kind: 'shock' } },
  kinsei: { sky: { mesh: 'lavabomb', every: 3.2, kind: 'burn' }, pads: { mesh: 'geyser', n: 4 } },
  tsuki: { sky: { mesh: 'meteor', every: 2.8, kind: 'flat' }, pads: { mesh: 'crystalpad', n: 3 } },
  kaitei: { roll: { mesh: 'jelly', n: 7, v: -5, kind: 'shock', msg: '🪼 クラゲでビリビリ！', h: 1.4 }, current: 4 },
  chitei: { sky: { mesh: 'stalactite', every: 3.2, kind: 'flat' }, roll: { mesh: 'boulder', n: 2, v: -16, kind: 'flat', msg: '🪨 岩にひかれた！' } },
  kumo: { wind: { every: 10, dur: 2.2, msg: '💨 突風！' }, sky: { mesh: 'bolt', every: 5, kind: 'shock' }, pads: { mesh: 'cloudpad', n: 5 } },
  suisho: { pads: { mesh: 'crystalpad', n: 7 }, sky: { mesh: 'meteor', every: 5, kind: 'flat' } },
  bosen: { roll: { mesh: 'tentacle', n: 5, v: -12, kind: 'grab', msg: '🦑 触手につかまった！' }, sky: { mesh: 'bolt', every: 7, kind: 'shock' } },
  // バトル
  b_niwa: { pads: { mesh: 'mushroom', n: 6 }, roll: { mesh: 'inoshishi', n: 2, v: -20, kind: 'knock', msg: '🐗 イノシシ突進！' } },
  b_tsuki: { sky: { mesh: 'meteor', every: 2.5, kind: 'flat' }, pads: { mesh: 'crystalpad', n: 4 } },
  b_kaitei: { roll: { mesh: 'jelly', n: 6, v: -5, kind: 'shock', msg: '🪼 クラゲでビリビリ！', h: 1.4 }, current: 4 },
  b_magma: { sky: { mesh: 'lavabomb', every: 2.6, kind: 'burn' }, pads: { mesh: 'geyser', n: 5 } },
  b_okashi: { pads: { mesh: 'mushroom', n: 6 }, sky: { mesh: 'candyfall', every: 4, kind: 'flat' } },
  b_kumo: { wind: { every: 9, dur: 2.2, msg: '💨 突風！' }, pads: { mesh: 'cloudpad', n: 6 }, sky: { mesh: 'bolt', every: 5, kind: 'shock' } },
  b_jupiter: { wind: { every: 8, dur: 2.6, msg: '🌪 木星の暴風！' }, sky: { mesh: 'bolt', every: 4, kind: 'shock' } },
  b_bosen: { roll: { mesh: 'tentacle', n: 4, v: -12, kind: 'grab', msg: '🦑 触手につかまった！' }, pads: { mesh: 'crystalpad', n: 4 } },
};

function gimMesh(type) {
  const g = new THREE.Group();
  switch (type) {
    case 'boulder': mk(g, new THREE.DodecahedronGeometry(2.2, 0), 0x7a7268, 0, 2.2, 0, { mo: { flat: true } }); break;
    case 'log': mk(g, GEO.cyl(0.8, 0.8, 6, 9), 0x7a5230, 0, 0.8, 0, { r: [0, 0, Math.PI / 2], mo: { flat: true } }); break;
    case 'wani': mk(g, GEO.box(1.6, 0.6, 4.4), 0x3f6a2a, 0, 0.3, 0); mk(g, GEO.box(1.2, 0.5, 1.8), 0x4a7a30, 0, 0.5, 2.8); for (const s of [-1, 1]) mk(g, GEO.sph(0.2, 8, 6), 0xffe04a, s * 0.4, 0.9, 2.4); mk(g, GEO.cone(0.5, 2.2, 5), 0x3f6a2a, 0, 0.3, -3.2, { r: [-Math.PI / 2, 0, 0] }); break;
    case 'inoshishi': mk(g, GEO.sph(1.3, 10, 8), 0x6a4a30, 0, 1.3, 0, { s: [1, 0.9, 1.5] }); mk(g, GEO.cone(0.6, 1.2, 8), 0x5a3a24, 0, 1.2, 2, { r: [Math.PI / 2, 0, 0] }); for (const s of [-1, 1]) mk(g, GEO.cone(0.1, 0.6, 5), 0xffffff, s * 0.35, 1.2, 2.2, { r: [0.6, 0, 0] }); break;
    case 'jelly': {
      mk(g, new THREE.SphereGeometry(1.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xff9ae0, 0, 0.6, 0, { mo: { op: 0.75, e: 0xa03090, ds: true } });
      for (let i = 0; i < 6; i++) mk(g, GEO.cyl(0.05, 0.02, 1.6, 4), 0xffc0f0, Math.cos(i) * 0.6, -0.3, Math.sin(i) * 0.6, { mo: { e: 0xa03090 } });
      break;
    }
    case 'tentacle': mk(g, GEO.cyl(0.25, 0.7, 5, 8), 0x7dffb0, 0, 2.5, 0, { mo: { e: 0x20a060 } }); mk(g, GEO.sph(0.5), 0xff5ad8, 0, 5.2, 0, { mo: { e: 0x802060 } }); break;
    case 'mushroom': mk(g, GEO.cyl(0.9, 1.1, 0.9, 10), 0xf4ead8, 0, 0.45, 0); mk(g, new THREE.SphereGeometry(2.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xff5a7a, 0, 0.7, 0, { s: [1, 0.45, 1], mo: { e: 0x601020 } }); for (let i = 0; i < 5; i++) mk(g, GEO.sph(0.3, 8, 6), 0xffffff, Math.cos(i * 1.3) * 1.3, 1.45, Math.sin(i * 1.3) * 1.3); break;
    case 'geyser': mk(g, GEO.tor(1.6, 0.4), 0x5a4a3a, 0, 0.1, 0, { r: [Math.PI / 2, 0, 0], mo: { flat: true } }); mk(g, GEO.cyl(1.3, 1.3, 0.1, 14), 0xbfe8ff, 0, 0.12, 0, { mo: { e: 0x4a8ab0, op: 0.8 } }); break;
    case 'crystalpad': mk(g, GEO.cyl(2, 2.2, 0.4, 6), 0x5ae8ff, 0, 0.2, 0, { mo: { e: 0x20a0ff, ei: 0.9, flat: true } }); mk(g, new THREE.OctahedronGeometry(0.6, 0), 0xffffff, 0, 1.2, 0, { mo: { e: 0x80c0ff } }); break;
    case 'cloudpad': for (let i = 0; i < 5; i++) mk(g, GEO.sph(1.1, 10, 8), 0xffffff, Math.cos(i * 1.26) * 1.2, 0.5, Math.sin(i * 1.26) * 1.2, { mo: { e: 0x9a9aaa } }); break;
    case 'rock': case 'meteor': mk(g, new THREE.DodecahedronGeometry(1.6, 0), type === 'meteor' ? 0x4a3a3a : 0x8a8580, 0, 0, 0, { mo: { flat: true, e: type === 'meteor' ? 0xff4a10 : 0 } }); break;
    case 'stalactite': mk(g, GEO.cone(1, 4.5, 6), 0x5a3a30, 0, 1.5, 0, { r: [Math.PI, 0, 0], mo: { flat: true } }); break;
    case 'lavabomb': mk(g, GEO.sph(1.2, 10, 8), 0xff6a1a, 0, 0, 0, { mo: { e: 0xff4a00, ei: 1 } }); break;
    case 'candyfall': mk(g, GEO.sph(1.5, 12, 10), 0xff5aa8, 0, 0, 0, { mo: { e: 0x601030 } }); mk(g, GEO.cyl(0.12, 0.12, 3, 5), 0xffffff, 0, 2, 0); break;
    case 'bolt': mk(g, GEO.cyl(0.25, 0.25, 60, 5), 0xffffa0, 0, 30, 0, { mat: new THREE.MeshBasicMaterial({ color: 0xffffc0 }) }); break;
  }
  return g;
}

Object.assign(Game.prototype, {
  setupGimmicks() {
    const cfg = GIMMICKS[this.def.id] || {};
    this.gim = { cfg, pads: [], sky: [], skyT: 6, windT: cfg.wind ? cfg.wind.every : 0, windOn: 0, windDir: 1 };
    const tr = this.track, rng = U.rng(this.def.id.length * 53 + 9);
    const online = !!this.cfg.netId;
    if (cfg.roll && !online) {
      for (let i = 0; i < cfg.roll.n; i++) {
        const m = gimMesh(cfg.roll.mesh); this.scene.add(m);
        this.traffic.push({ dist: (i + 0.5) / cfg.roll.n * tr.L + 60, d: 0, v: cfg.roll.v, mesh: m, kind: cfg.roll.kind, msg: cfg.roll.msg, r: cfg.roll.mesh === 'boulder' ? 2.6 : 2.1, ph: i * 2.1, roll: ['boulder', 'log'].includes(cfg.roll.mesh), h: cfg.roll.h || 0 });
      }
    }
    if (cfg.pads) {
      let tries = 0;
      while (this.gim.pads.length < cfg.pads.n && tries++ < 200) {
        const j = Math.floor(rng() * tr.N);
        if (j < 40 || j > tr.N - 40 || (tr.flags[j] & (1 | 8 | 16)) || tr.off[j] > 0.6 || Math.abs(tr.T[j * 3 + 1]) > 0.35) continue;
        let ok = true; for (let q = 0; q < 50; q++) if (tr.flags[(j + q) % tr.N] & (1 | 16)) ok = false;
        if (!ok || this.gim.pads.some(p => Math.abs(p.j - j) < 60)) continue;
        const d = (rng() - 0.5) * tr.hw[j] * 1.2;
        const m = gimMesh(cfg.pads.mesh); this.scene.add(m);
        this.placeOnTrack(m, j * tr.ds, d, 0);
        this.gim.pads.push({ j, s: j * tr.ds, d, m, type: cfg.pads.mesh, t: 0 });
      }
    }    this.setupShortcuts();
  },

  // ---- 急カーブの外側に紅白ガードレール＋矢印看板 ----
  setupCornerRails() {
    const tr = this.track; this.railSide = null; if (this.battle) return;
    const N = tr.N, side = new Int8Array(N), K = 1 / 48;
    for (let j = 0; j < N; j++) {
      if (tr.flags[j] & (1 | 8 | 16)) continue;
      let m = 0; for (let o = -6; o <= 6; o += 2) { const q = Math.min(N - 1, Math.max(0, j + o)); if (Math.abs(tr.kap[q]) > Math.abs(m)) m = tr.kap[q]; }
      if (Math.abs(m) > K) side[j] = m > 0 ? -1 : 1;   // 右カーブ→左側(外側)にレール
    }
    this.railSide = side;
    const segs = [], signs = [], fr = { p: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), r: new THREE.Vector3() };
    for (let j = 0; j < N; j += 2) if (side[j]) { segs.push(j); if (j % 8 === 0) signs.push(j); }
    if (!segs.length) return;
    const len = tr.ds * 2.05, mtx = new THREE.Matrix4(), col = new THREE.Color();
    const rail = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.5, len), new THREE.MeshToonMaterial({ color: 0xffffff }), segs.length);
    const post = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 5), new THREE.MeshToonMaterial({ color: 0x9aa0a8 }), segs.length);
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d');
    c.fillStyle = '#ffd23a'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#e0202a'; c.beginPath(); c.moveTo(14, 8); c.lineTo(46, 32); c.lineTo(14, 56); c.lineTo(26, 56); c.lineTo(56, 32); c.lineTo(26, 8); c.fill();
    const sgeo = new THREE.PlaneGeometry(1.6, 1.6), smatR = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide });
    const sign = new THREE.InstancedMesh(sgeo, smatR, signs.length);
    segs.forEach((j, i) => {
      const s = j * tr.ds + tr.ds; tr.frame(s, fr);
      const d = side[j] * (tr.hw[j] + 0.7), y = tr.lerpArr(tr.off, s);
      const pos = fr.p.clone().addScaledVector(fr.r, d).addScaledVector(fr.u, y + 0.75);
      mtx.makeBasis(fr.r, fr.u, fr.t).setPosition(pos); rail.setMatrixAt(i, mtx);
      rail.setColorAt(i, col.set(Math.floor(j / 2) % 2 ? 0xe0202a : 0xffffff));
      mtx.makeBasis(fr.r, fr.u, fr.t).setPosition(pos.addScaledVector(fr.u, -0.35)); post.setMatrixAt(i, mtx);
    });
    signs.forEach((j, i) => {
      const s = j * tr.ds; tr.frame(s, fr);
      const d = side[j] * (tr.hw[j] + 1.6), y = tr.lerpArr(tr.off, s);
      const pos = fr.p.clone().addScaledVector(fr.r, d).addScaledVector(fr.u, y + 1.9);
      const xr = fr.r.clone().multiplyScalar(-side[j]);   // 矢印がカーブ方向を指す
      mtx.makeBasis(xr, fr.u, xr.clone().cross(fr.u)).setPosition(pos); sign.setMatrixAt(i, mtx);
    });
    rail.instanceColor.needsUpdate = true;
    this.scene.add(rail, post, sign);
  },
  railHit() {
    const tr = this.track, side = this.railSide; if (!side) return;
    for (const k of this.karts) {
      if (k.isRemote || k.out || k.h > 2 || k.respawnT > 0) continue;
      const j = tr.idx(k.dist)[0], sd = side[j]; if (!sd) continue;
      const lim = tr.hw[j] + 0.3;
      if (k.d * sd > lim) {
        k.d = sd * lim; k.v *= 0.985; k.yaw *= 0.8;
        if (k.isPlayer && this.time - (this.railAt || 0) > 0.6) { this.railAt = this.time; SND.play('wall'); }
      }
    }
  },

  // ---- 隠し抜け道トンネル（カーブの内側の路肩に入口。入ると先へワープ）----
  setupShortcuts() {
    this.setupCornerRails();
    this.shortcuts = [];
    const tr = this.track; if (this.battle || !tr.open) return;
    const fa = { p: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), r: new THREE.Vector3() }, fb = { p: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), r: new THREE.Vector3() };
    const cands = [];
    for (let s0 = tr.startS + 250; s0 < tr.finishS - 350; s0 += 10) {
      tr.frame(s0, fa); let best = null;
      for (let span = 140; span <= 420; span += 20) {
        tr.frame(s0 + span, fb);
        const dx = fb.p.x - fa.p.x, dy = fb.p.y - fa.p.y, dz = fb.p.z - fa.p.z, chord = Math.hypot(dx, dz);
        if (Math.abs(dy) > 18 || chord > span * 0.72) continue;
        const gain = span - chord * 1.15; if (gain < 45) continue;
        if (!best || gain > best.gain) best = { s0, s1: s0 + span, gain, side: Math.sign(dx * fa.r.x + dz * fa.r.z) || 1 };
      }
      if (best) cands.push(best);
    }
    cands.sort((a, b) => b.gain - a.gain);
    for (const c of cands) {
      if (this.shortcuts.length >= 2) break;
      if (this.shortcuts.some(o => c.s0 < o.s1 + 150 && c.s1 > o.s0 - 150)) continue;
      if (tr.flagAt(c.s0) & (1 | 8 | 16) || tr.flagAt(c.s1) & (1 | 8 | 16)) continue;
      const j0 = tr.idx(c.s0)[0], j1 = tr.idx(c.s1)[0];
      c.d0 = c.side * tr.hw[j0] * 0.82; c.d1 = c.side * tr.hw[j1] * 0.7;
      c.m0 = this.tunnelMouth(c.s0, c.d0, false); c.m1 = this.tunnelMouth(c.s1, c.d1, true);
      this.shortcuts.push(c);
    }
  },
  tunnelMouth(s, d, exit) {
    const g = new THREE.Group(), fr = { p: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), r: new THREE.Vector3() };
    const rock = new THREE.MeshToonMaterial({ color: 0x7a6a58 }), dark = new THREE.MeshBasicMaterial({ color: 0x0a0806, side: THREE.DoubleSide });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.9, 7, 14, Math.PI), rock); g.add(arch);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(2.5, 16, 0, Math.PI), dark); hole.position.z = -0.3; g.add(hole);
    for (const x of [-3.4, 3.4]) { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), rock); b.position.set(x, 0.6, -0.4); g.add(b); }
    for (let i = 0; i < 5; i++) { const bu = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), new THREE.MeshToonMaterial({ color: 0x3f8a3a })); bu.position.set(-3 + i * 1.5, 2.8 + Math.random() * 0.8, -0.6); g.add(bu); }
    if (!exit) { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const c = cv.getContext('2d'); c.fillStyle = '#ffd23a'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#2a1652'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.fillText('ぬけ道', 64, 44);
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })); sg.position.set(0, 4.6, 0.3); g.add(sg); }
    this.track.frame(s, fr);
    g.position.copy(fr.p).addScaledVector(fr.r, d).addScaledVector(fr.u, this.track.lerpArr(this.track.off, s));
    g.lookAt(g.position.clone().addScaledVector(fr.t, exit ? 1 : -1));
    this.scene.add(g); return g;
  },
  updateShortcuts() {
    for (const k of this.karts) {
      const prev = k._scPrev ?? k.dist; k._scPrev = k.dist;
      if (k.isRemote || k.out || k.respawnT > 0 || k.ufoT > 0) continue;
      for (const c of this.shortcuts) {
        if (prev < c.s0 && k.dist >= c.s0 && Math.abs(k.d - c.d0) < 3.2 && k.h < 3) {
          k.dist = c.s1 + 2; k._scPrev = k.dist; k.d = c.d1; k.h = 0; k.vh = 0; k.grounded = true; k.yaw = 0; k.boostT = Math.max(k.boostT, 0.6);
          if (k.isPlayer) { SND.play('boost'); HUD.flash(); HUD.toast(`🕳️ 抜け道トンネル！約${Math.round(c.gain)}m近道`); this.lookBackT = 0; }
        }
      }
    }
  },

  updateGimmicks(dt) {
    if (this.shortcuts) this.updateShortcuts();
    this.railHit();
    const G = this.gim, cfg = G.cfg, tr = this.track;
    const online = !!this.cfg.netId;
    // ジャンプ台
    for (const p of G.pads) {
      p.t = Math.max(0, p.t - dt);
      p.m.scale.set(1 + p.t * 0.5, 1 - p.t * 0.6, 1 + p.t * 0.5);
      if (p.type === 'geyser' && Math.random() < 0.2) this.particles.emit(p.m.position.clone(), new THREE.Vector3((Math.random() - 0.5) * 2, 6 + Math.random() * 8, (Math.random() - 0.5) * 2), 0xdff4ff, 0.7, 0.8, 0.2, 12);
      for (const k of this.karts) {
        if (k.isRemote || k.out || !k.grounded || k.respawnT > 0 || k.ufoT > 0) continue;
        if (Math.abs(this.dDist(k.dist, p.s)) < 2.4 && Math.abs(k.d - p.d) < 2.4) {
          k.vh = 13 * Math.sqrt(this.def.gravity / 30); k.grounded = false; k.airT = 0; k.hop = false; p.t = 0.5;
          if (k.isPlayer) { SND.play('poyon'); HUD.toast('🍄 大ジャンプ！'); }
        }
      }
    }
    // 空から降ってくる
    if (cfg.sky && this.started && !online) {
      G.skyT -= dt;
      if (G.skyT <= 0) {
        G.skyT = cfg.sky.every * (0.7 + Math.random() * 0.6);
        const cands = this.karts.filter(k => !k.out && !k.finished);
        const k = Math.random() < 0.45 && this.player && !this.player.out ? this.player : cands[Math.floor(Math.random() * cands.length)];
        if (k) {
          const m = gimMesh(cfg.sky.mesh); this.scene.add(m);
          const ring = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.1, 24), new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }));
          this.scene.add(ring);
          const lead = this.battle ? (Math.random() - 0.5) * 20 : Math.max(10, k.v * 1.25) + Math.random() * 12;
          const hw = tr.lerpArr(tr.hw, k.dist + lead);
          const o = { m, ring, dist: k.dist + lead, d: U.clamp(k.d + (Math.random() - 0.5) * 8, -hw + 2, hw - 2), t: 1.35, bolt: cfg.sky.mesh === 'bolt' };
          const fr = tr.frame(o.dist, this.fr);
          this.tmp.m.makeBasis(fr.r, fr.t, fr.u); ring.quaternion.setFromRotationMatrix(this.tmp.m);
          ring.position.copy(fr.p).addScaledVector(fr.r, o.d).addScaledVector(fr.u, 0.12 + tr.lerpArr(tr.off, o.dist));
          o.base = ring.position.clone(); o.up = fr.u.clone();
          G.sky.push(o);
        }
      }
      for (const o of G.sky) {
        o.t -= dt;
        o.ring.material.opacity = 0.4 + 0.4 * Math.sin(this.time * 25);
        o.ring.scale.setScalar(0.6 + Math.max(0, o.t) * 0.5);
        if (o.bolt) { o.m.visible = o.t < 0.12; o.m.position.copy(o.base); }
        else { o.m.position.copy(o.base).addScaledVector(o.up, Math.max(0, o.t) * 45 + 1); o.m.rotation.x += dt * 5; }
        if (o.t <= 0 && !o.hit) {
          o.hit = true;
          const near = this.player && this.player.model.root.position.distanceTo(o.base) < 60;
          if (near) { SND.play(o.bolt ? 'bzzt' : cfg.sky.kind === 'burn' ? 'sizzle' : 'crash'); if (this.player.model.root.position.distanceTo(o.base) < 14) HUD.shake(0.35); }
          for (let i = 0; i < 24; i++) this.particles.emit(o.base, new THREE.Vector3((Math.random() - 0.5) * 22, Math.random() * 14, (Math.random() - 0.5) * 22), o.bolt ? 0xffffa0 : cfg.sky.kind === 'burn' ? 0xff6a1a : 0xc8b8a0, 0.6, 2, 0.4, 14);
          for (const k of this.karts) {
            if (k.isRemote || k.out) continue;
            if (Math.abs(this.dDist(k.dist, o.dist)) < 3.3 && Math.abs(k.d - o.d) < 3.3 && k.h < 4) this.damage(k, cfg.sky.kind, { balloons: 1 });
          }
        }
        if (o.t < -0.25) { this.scene.remove(o.m); this.scene.remove(o.ring); o.dead = true; }
      }
      G.sky = G.sky.filter(o => !o.dead);
    }
    // 横風
    if (cfg.wind) {
      if (G.windOn > 0) {
        G.windOn -= dt;
        for (const k of this.karts) {
          if (k.isRemote || k.out || k.ufoT > 0) continue;
          k.d += G.windDir * 6.5 * dt * (k.grounded ? 1 : 1.6) * (3 / (2 + k.weight));
          if (Math.random() < 0.25) this.particles.emit(k.model.root.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 12, Math.random() * 4, (Math.random() - 0.5) * 12)), this.tmp.c.copy(this.track.frame(k.dist, this.fr).r).multiplyScalar(G.windDir * 40).clone(), 0xffffff, 0.35, 0.3, 0.1, 0);
        }
      } else {
        G.windT -= dt;
        if (G.windT <= 0) { G.windT = cfg.wind.every * (0.7 + Math.random() * 0.6); G.windOn = cfg.wind.dur; G.windDir = Math.random() < 0.5 ? -1 : 1; SND.play('fan'); HUD.toast(cfg.wind.msg + (G.windDir > 0 ? ' →→→' : ' ←←←')); }
      }
    }
    // 水流
    if (cfg.current) for (const k of this.karts) {
      if (k.isRemote || k.out || !k.inWater) continue;
      k.d += Math.sin(k.dist * 0.02) * cfg.current * dt;
    }
  },
});
