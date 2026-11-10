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
    }
  },

  updateGimmicks(dt) {
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
          if (k.isPlayer) { SND.play('poyon'); HUD.toast('🍄 大ジャンプ！空中でドリフトボタン→着地で加速'); }
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
