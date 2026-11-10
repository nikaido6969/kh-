// ===== 風船バトル & 見た目追加 =====
const BATTLE_TIME = 180;
Object.assign(Game.prototype, {
  hitKart(k, kind) { this.damage(k, kind, {}); },

  setupBattle() {
    const L = this.track.L, n = this.karts.length;
    this.karts.forEach((k, i) => {
      k.dist = i * L / n + 5; k.d = ((i % 3) - 1) * 10; k.yaw = 0; k.lastSafe = k.dist; k.balloons = 10;
      const g = new THREE.Group(); k.balGroup = g; k.bal = [];
      const base = new THREE.Color(k.ch.color);
      for (let j = 0; j < 10; j++) {
        const c = base.clone().offsetHSL((j % 5) * 0.12, 0.2, 0.05);
        const b = new THREE.Group();
        const sp = new THREE.Mesh(GEO.sph(0.34, 10, 8), new THREE.MeshStandardMaterial({ color: c, roughness: 0.25, metalness: 0.1, emissive: c, emissiveIntensity: 0.15 }));
        sp.scale.set(1, 1.2, 1); b.add(sp);
        const st = new THREE.Mesh(GEO.cyl(0.01, 0.01, 1.1, 3), U.mat(0xffffff)); st.position.y = -0.85; b.add(st);
        const a = (j - 4.5) * 0.3;
        b.position.set(Math.sin(a) * 1.2, 2.3 + (j % 2) * 0.5, -0.5 - Math.cos(a) * 0.6);
        g.add(b); k.bal.push(b);
      }
      k.model.root.add(g);
    });
    this.battleT = BATTLE_TIME; this.battleEnd = false;
  },

  updateBalloons(k) { if (k.bal) k.bal.forEach((b, j) => b.visible = j < k.balloons); },

  popBalloons(k, n) {
    for (let i = 0; i < n && k.balloons > 0; i++) {
      k.balloons--;
      const b = k.bal && k.bal[k.balloons];
      if (b) { const p = new THREE.Vector3(); b.getWorldPosition(p); for (let q = 0; q < 12; q++) this.particles.emit(p, new THREE.Vector3((Math.random() - 0.5) * 14, Math.random() * 10, (Math.random() - 0.5) * 14), k.ch.color, 0.5, 1, 0.2, 10); }
    }
    this.updateBalloons(k);
    SND.play('pop');
    if (k.balloons <= 0 && !k.out) {
      k.out = true; k.outT = this.raceT;
      this.spark(k, 0xffffff, 40);
      if (k.isPlayer) { HUD.msg('風船ゼロ…脱落！', 2.5, 'final'); SND.play('fall'); }
      else if (this.player) HUD.toast(`💥 ${k.name} 脱落！`);
    }
  },

  updateBattle(dt) {
    if (!this.started || this.battleEnd) return;
    this.battleT -= dt;
    const alive = this.karts.filter(k => !k.out);
    if (this.battleT <= 30 && !this.lastCall) { this.lastCall = true; HUD.msg('残り30秒！', 1.5, 'final'); if (SND.bgm) SND.bgm.fast = 1.15; }
    if (alive.length <= 1 || this.battleT <= 0 || (this.player && this.player.out)) {
      this.battleEnd = true;
      const win = alive.length === 1 ? alive[0] : null;
      HUD.msg(this.player && !this.player.out && (win === this.player || this.player.rank === 0) ? '勝利！🎉' : 'しゅうりょう！', 3, 'go');
      SND.play('finish'); if (SND.bgm) SND.bgm.fast = 1;
      setTimeout(() => this.showResults(), this.player && this.player.out ? 2000 : 3200);
    }
  },

  battleResults() {
    return this.karts.slice().sort((a, b) => a.rank - b.rank).map(k => ({ k, t: k.balloons, est: false, battle: true }));
  },

  battleAI(k, dt) {
    const tr = this.track, inp = k.input;
    if (k.out) { inp.accel = false; inp.steer = 0; return; }
    const s = tr.wrap(k.dist);
    let tgt = null, tDist = 1e9, tD = 0;
    // 標的：近い敵（プレイヤー優先気味）
    for (const o of this.karts) {
      if (o === k || o.out) continue;
      const dd = Math.hypot(this.dDist(o.dist, k.dist), o.d - k.d) * (o.isPlayer ? 0.95 : 1);
      if (dd < tDist) { tDist = dd; tgt = o; }
    }
    let ds = 30, dl = 0;
    if (!k.item && k.rollT <= 0) { // アイテム箱を取りに行く
      let bb = null, bd = 90;
      for (const b of this.boxes) { if (!b.alive) continue; const dd = Math.hypot(this.dDist(b.s, k.dist), b.d - k.d); if (dd < bd) { bd = dd; bb = b; } }
      if (bb && (bd < tDist || !tgt)) { ds = this.dDist(bb.s, k.dist); dl = bb.d - k.d; }
      else if (tgt) { ds = this.dDist(tgt.dist, k.dist); dl = tgt.d - k.d; }
    } else if (tgt) { ds = this.dDist(tgt.dist, k.dist); dl = tgt.d - k.d; }
    if (k.balloons <= 2 && tgt && tDist < 25) { ds = -ds; dl = -dl; } // 逃げる
    if (Math.abs(ds) < 0.5) ds = 0.5;
    let des = Math.atan2(dl, ds);
    const edge = tr.hw[Math.floor(s / tr.ds) % tr.N] + tr.sh[0] - 5;
    if (Math.abs(k.d) > edge && Math.sign(Math.sin(des)) === Math.sign(k.d)) des = Math.atan2(-k.d * 0.5, Math.cos(des) >= 0 ? 10 : -10);
    const kap = tr.lerpArr(tr.kap, s);
    const turnRate = k.turn * Math.min(1, Math.abs(k.v) / 13) || 0.3;
    const err = U.wrapA(des - k.yaw);
    inp.steer = U.clamp((err * 3 + kap * k.v * Math.cos(k.yaw)) / Math.max(0.4, turnRate), -1, 1);
    inp.accel = true; inp.brake = false; inp.drift = false; inp.driftEdge = false;
    if (k.gasT > 0 || k.blindT > 0) inp.steer += Math.sin(this.time * 3) * 0.6;
    // 武器
    inp.itemEdge = false;
    if (k.item && k.rollT <= 0) {
      k.aiItemT -= dt;
      const facing = Math.abs(err) < 0.35;
      let use = k.aiItemT < -6;
      switch (k.item) {
        case 'hammer': use = use || tDist < 8; break;
        case 'mgun': case 'tako': case 'waterb': case 'eda': use = use || (facing && tDist < 45); break;
        case 'gasoline': case 'natto': use = use || (tgt && this.dDist(tgt.dist, k.dist) < 0 && tDist < 25); break;
        default: use = use || k.aiItemT < 0;
      }
      if (use) { inp.itemEdge = true; k.aiItemT = 1 + Math.random() * 2; }
    }
  },

  // ---- カートの追加ビジュアル ----
  visualExtra(k, fr, dt) {
    const root = k.model.root;
    if (k.bal) k.bal.forEach((b, j) => { b.rotation.z = Math.sin(this.time * 3 + j) * 0.15; b.position.y = 2.3 + (j % 2) * 0.5 + Math.sin(this.time * 2.5 + j * 1.3) * 0.08; });
    if (k.hoverT > 0 && !k.cush) {
      k.cush = new THREE.Group();
      for (let i = 0; i < 3; i++) mk(k.cush, GEO.box(1.8, 0.32, 2), [0x8a3ad8, 0xd83a6a, 0x3a8ad8][i], 0, -0.25 - i * 0.36, 0, { r: [0, i * 0.3, 0] });
      root.add(k.cush);
    }
    if (k.cush) k.cush.visible = k.hoverT > 0;
    if (k.shieldT > 0 && !k.shieldSp) {
      k.shieldSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: 0xe8f8ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
      k.shieldSp.scale.set(3.6, 3.6, 3.6); k.shieldSp.position.y = 0.9; root.add(k.shieldSp);
    }
    if (k.shieldSp) k.shieldSp.visible = k.shieldT > 0;
    if (k.hammerT > 0 && !k.ham) {
      k.ham = new THREE.Group();
      const ban = mk(k.ham, GEO.tor(2.2, 0.75, Math.PI * 0.9), 0xffd83a, 0, 3.2, 0, { r: [0, Math.PI / 2, 0], mo: { r: 0.4 } });
      mk(k.ham, GEO.cyl(0.25, 0.25, 0.8, 6), 0x5a3a1a, 0, 1.0, 0);
      ban.scale.set(1, 1, 1.2);
      root.add(k.ham);
    }
    if (k.ham) { k.ham.visible = k.hammerT > 0; if (k.hammerT > 0) k.ham.rotation.x = -1.4 + (1 - k.hammerT / 0.6) * 2.8; }
    const p = root.position;
    if (k.sleepT > 0 && Math.random() < 0.15) this.particles.emit(p.clone().add(new THREE.Vector3(0, 2, 0)), new THREE.Vector3(0.5, 2, 0), 0x9ad8ff, 1, 0.5, 1, 0);
    if (k.gasT > 0 && Math.random() < 0.4) this.particles.emit(p.clone().add(new THREE.Vector3(0, 1, 0)), new THREE.Vector3((Math.random() - 0.5) * 2, 1.5, (Math.random() - 0.5) * 2), 0x7ad84a, 0.8, 1, 2, 0, false);
    if (k.slick && Math.random() < 0.15) this.particles.emit(p.clone(), new THREE.Vector3(0, 0.5, 0), 0xc8a060, 0.6, 0.4, 0.8, 0, false);
    if (k.flatT > 0 && k.flatT > 1.5 && Math.random() < 0.3) this.particles.emit(p.clone().add(new THREE.Vector3(0, 0.6, 0)), new THREE.Vector3((Math.random() - 0.5) * 6, 3, (Math.random() - 0.5) * 6), 0x9ad8ff, 0.3, 0.6, 0.1, 0);
  },
});
