// ===== キャラ固有の魔法（ゲージが満タンで発動） =====
// ゲージ：走るだけで少しずつ、アイテム箱・ミニターボ・ジャンプアクションで多めに溜まる
const MAGIC = {
  kunekune: { name: 'くねくねワープ', desc: 'コースの先へ瞬間移動', col: 0xffffff , line: 'ニョロ〜ン…先に着いてました' },
  shiba: { name: 'わんわん猛ダッシュ', desc: '3秒間の超加速', col: 0xffa040 , line: '仲間の柴犬が大集合！みんなで爆走ワン' },
  shibaman: { name: '定時ダッシュ', desc: '加速＋4秒間の無敵', col: 0x3a6ad8 , line: '「お先に失礼します！」定時の本気' },
  shibafu: { name: '芝生ロード', desc: '後ろに芝生を敷いて追っ手を減速', col: 0x5ac84a , line: '芝刈り機より速く芝が伸びる！' },
  kamemushi: { name: '激臭ガス', desc: '周り14mの相手を毒ガスで包む', col: 0x7ad84a , line: 'くっさ！！半径14m退避勧告' },
  natto: { name: 'ねばねば網', desc: '前方40mの相手を数秒ヌルヌルに', col: 0xc8a050 , line: 'ねば〜っ。かき混ぜ回数400回' },
  denchu: { name: '停電ビリビリ', desc: '周り18mの相手を感電させる', col: 0x9ad8ff , line: 'バチバチィ！ご近所一帯停電です' },
  konnyaku: { name: 'ぷるぷる一閃', desc: '前方に突進斬り。当たった相手を吹っ飛ばす', col: 0xd8dde6 , line: 'ぷるん…斬！切れないけど斬る' },
  chikuwa: { name: '分身の術', desc: '5秒間すり抜け無敵', col: 0x2a3a6a , line: 'ドロン！ちくわが4本に増えた' },
  bonsai: { name: '剪定の舞', desc: '周りの罠・弾を全部刈り取りバリア', col: 0x3a8a3a , line: 'チョキチョキ…見事な剪定じゃ' },
  shingou: { name: '全部赤信号', desc: '前の相手全員を1.5秒停止', col: 0xff3a3a , line: '巨大な赤信号！全員止まれ！' },
  mochi: { name: '正月ボディプレス', desc: '大ジャンプして着地で衝撃波', col: 0xff8a2a , line: 'もち膨らみ〜…ドスーン！！' },
  kurage: { name: '重力反転', desc: '前の相手を空へ浮かせて失速', col: 0xe0a060 , line: 'ぷか〜。みんな空へご招待' },
  keshigomu: { name: '全部消す', desc: 'コース上の弾と相手のアイテムを消去', col: 0xffffff , line: 'ゴシゴシ…全部なかったことに' },
  gacha: { name: 'ガチャ10連', desc: 'レアアイテム確定', col: 0xd8323a , line: 'ガチャガチャ…SSR確定演出！' },
  hiyashi: { name: '冷やし始めました', desc: '後ろの相手を凍らせて自分は加速', col: 0x8ad8ff , line: '冷やし中華、始めました（相手を）' },
  namazu: { name: '大地震', desc: '地面にいる周り60mの相手が全員スピン', col: 0x8a7a5a , line: 'ナマズが暴れて大地震！' },
  dogu: { name: '縄文ビーム', desc: '前方の3人をビームで撃ち抜く', col: 0xff6ab0 , line: 'ジョーモーン！目からビーム' },
  omunie: { name: 'おむにえの全能', desc: '6秒間 無敵・超加速・周りを吹き飛ばしアイテム補充', col: 0xb05aff , line: '紫の光が全てを包む…みんなちびっこに' },
};
const MAGIC_TIME = 26; // 走るだけで満タンになる秒数

Object.assign(Game.prototype, {
  chargeMagic(k, amt) {
    if (!this.started || k.out || k.finished) return;
    const before = k.magic || 0;
    k.magic = Math.min(1, before + amt * (k.ch.rare ? 1.3 : 1));
    if (k.isPlayer && before < 1 && k.magic >= 1) { SND.play('magicReady'); HUD.toast(`✨ 魔法「${MAGIC[k.ch.id].name}」が使える！`); }
  },

  useMagic(k) {
    const M = MAGIC[k.ch.id]; if (!M || (k.magic || 0) < 1) return;
    k.magic = 0;
    const id = k.ch.id, fwd = (o) => this.dDist(o.dist, k.dist), near = (r) => this.karts.filter(o => o !== k && !o.out && Math.hypot(fwd(o), o.d - k.d) < r);
    const ahead = (r) => this.karts.filter(o => o !== k && !o.out && fwd(o) > 0 && fwd(o) < r);
    const behind = (r) => this.karts.filter(o => o !== k && !o.out && fwd(o) < 0 && fwd(o) > -r);
    const P = (o) => { o.owner = k.id; this.spawnProj(o); this.netProj(o); };
    switch (id) {
      case 'kunekune': {
        k.stretchT = 0.6; for (const o of ahead(120)) if (!o.isRemote) o.wiggleT = 3;
        let d = k.dist + 55, n = 0; while ((this.track.flagAt(d) & 1) && n++ < 60) d += 3;
        k.dist = d; k.lastSafe = d; k.d = U.clamp(this.track.lerpArr(this.track.ai, d), -4, 4); k.respawnT = 0.25; break;
      }
      case 'shiba': k.boostT = Math.max(k.boostT, 3); k.boostCol = 2; for (let i = 0; i < 6; i++) this.summonShiba(k, i); break;
      case 'shibaman': k.boostT = Math.max(k.boostT, 2); k.starT = Math.max(k.starT, 4); break;
      case 'shibafu': for (let i = 0; i < 5; i++) P({ type: 'gas', dist: k.dist - 6 - i * 5, d: k.d + (Math.random() - 0.5) * 6, v: 0, grass: true }); k.boostT = Math.max(k.boostT, 1); break;
      case 'kamemushi': for (const o of near(14)) this.hitAny(o, 'gas', {}), this.hitAny(o, 'spin', { balloons: 1 }); for (let i = 0; i < 3; i++) P({ type: 'gas', dist: k.dist + (i - 1) * 4, d: k.d + (Math.random() - 0.5) * 4, v: 0 }); break;
      case 'natto': for (const o of ahead(40)) this.hitAny(o, 'slip', { balloons: 1 }), o.isRemote || (o.windT = 1.2, o.windDir = Math.random() < 0.5 ? -1 : 1); break;
      case 'denchu': for (const o of near(18)) { this.hitAny(o, 'shock', { balloons: 1 }); this.bolt(o); } HUD.flash(); break;
      case 'konnyaku': if (k.isPlayer) HUD.slash(); k.boostT = Math.max(k.boostT, 1.2); for (const o of ahead(16)) if (Math.abs(o.d - k.d) < 6) this.hitAny(o, 'knock', { balloons: 2 }); break;
      case 'chikuwa': k.starT = Math.max(k.starT, 5); k.ghostT = 5; this.clones(k); break;
      case 'bonsai': for (const p of this.projs) if (p.alive && p.owner !== k.id && Math.abs(this.dDist(p.dist, k.dist)) < 45) this.removeProj(p); k.shieldT = Math.max(k.shieldT, 15); break;
      case 'shingou': for (const o of (this.battle ? near(40) : ahead(250))) this.hitAny(o, 'sleep', { t: 1.5, noBalloon: true }); this.bigSignal(k); break;
      case 'mochi': k.vh = 16; k.grounded = false; k.airT = 0; k.pound = true; k.puffT = 1.8; break;
      case 'kurage': for (const o of (this.battle ? near(30) : ahead(80))) { this.hitAny(o, 'knock', { balloons: 1 }); if (!o.isRemote) o.vh = 15; this.jellyHat(o); } break;
      case 'keshigomu':
        if (k.isPlayer) HUD.eraser();
        for (const p of this.projs) if (p.alive && p.owner !== k.id) this.removeProj(p);
        for (const o of this.karts) if (o !== k && !o.isRemote) { o.item = null; o.itemN = 0; o.rollT = 0; }
        break;
      case 'gacha': { const pool = this.battle ? ['bazooka', 'missile', 'hammer', 'sp_harisen', 'sp_ame'] : ['missile', 'bazooka', 'tv', 'sp_zabuton10', 'sp_jikka']; k.item = pool[Math.floor(Math.random() * pool.length)]; k.itemN = 1; k.rollT = 0.6; break; }
      case 'hiyashi': for (const o of behind(40)) { this.hitAny(o, 'sleep', { t: 1.6, noBalloon: true }); this.iceCube(o, 1.6); } k.boostT = Math.max(k.boostT, 1.5); break;
      case 'namazu': for (const o of near(60)) if (o.grounded) this.hitAny(o, 'spin', { balloons: 1 }); HUD.shake(0.8); this.bigNamazu(k); break;
      case 'dogu': for (const o of ahead(120).sort((a, b) => fwd(a) - fwd(b)).slice(0, 3)) this.hitAny(o, 'knock', { balloons: 2 }); k.beamT = 0.6; break;
      case 'omunie':
        k.starT = Math.max(k.starT, 6); k.boostT = Math.max(k.boostT, 6); k.boostCol = 3;
        for (const o of near(30)) this.hitAny(o, 'knock', { balloons: 2 });
        for (const o of this.karts) if (o !== k && !o.isRemote && !o.out) o.shrinkT = Math.max(o.shrinkT, 4);
        this.purpleSky(); this.magicCircle(k);
        if (!k.item) { k.item = this.battle ? 'missile' : 'karaage'; k.itemN = 2; }
        break;
    }
    this.magicFx(k, M);
    if (window.NET && NET.active) NET.send({ t: 'fx', fx: 'magic', from: k.id });
  },

  // ---- 面白演出 ----
  summon(obj, life, upd) { this.scene.add(obj); (this.mfx || (this.mfx = [])).push({ obj, t: 0, life, upd }); },
  updateMagicFx(dt) {
    if (!this.mfx) return;
    for (const f of this.mfx) { f.t += dt; if (f.upd) f.upd(f, dt); if (f.t >= f.life) { this.scene.remove(f.obj); f.dead = true; } }
    this.mfx = this.mfx.filter(f => !f.dead);
  },
  summonShiba(k, i) {
    const g = new THREE.Group(); const body = mk(g, GEO.sph(0.5), 0xd98a3a, 0, 0.55, 0, { s: [0.9, 0.8, 1.4] });
    mk(g, GEO.sph(0.3), 0xfff4e6, 0, 0.5, 0.45); shibaHead(g, 1.05, 0.9);
    const tail = mk(g, GEO.tor(0.16, 0.07, Math.PI * 1.6), 0xd98a3a, 0, 0.9, -0.65, { r: [0, Math.PI / 2, 0] });
    const legs = []; for (const [x, z] of [[-0.25, 0.4], [0.25, 0.4], [-0.25, -0.4], [0.25, -0.4]]) legs.push(mk(g, GEO.cyl(0.08, 0.08, 0.45, 5), 0xd98a3a, x, 0.2, z));
    const side = i % 2 ? 1 : -1, lane = (Math.floor(i / 2) + 1) * 1.6 * side, lag = -3 + Math.floor(i / 2) * 2.5;
    this.summon(g, 3.2, (f) => {
      const t = f.t; this.placeOnTrack(g, k.dist + lag + t * 6, k.d + lane, Math.abs(Math.sin(t * 14 + i)) * 0.4, 0);
      legs.forEach((l, j) => l.rotation.x = Math.sin(t * 22 + j * 1.6) * 0.9); tail.rotation.z = Math.sin(t * 25) * 0.6;
      if (Math.random() < 0.05 && k.isPlayer) SND.play('woof');
    });
  },
  bolt(o) {
    const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: 0xfff6a0 });
    let x = 0, z = 0; for (let y = 40; y > 0; y -= 5) { const nx = (Math.random() - 0.5) * 3, nz = (Math.random() - 0.5) * 3; const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5.4, 4), m); seg.position.set((x + nx) / 2, y - 2.5, (z + nz) / 2); seg.rotation.z = Math.atan2(nx - x, 5); g.add(seg); x = nx; z = nz; }
    this.summon(g, 0.45, (f) => { g.position.copy(o.model.root.position); g.visible = Math.floor(f.t * 30) % 2 === 0; });
  },
  clones(k) {
    for (let i = 1; i <= 3; i++) {
      const m = buildRacerModel(k.ch); m.root.traverse(c => { if (c.isMesh) { c.material = c.material.clone(); c.material.transparent = true; c.material.opacity = 0.45; } });
      this.summon(m.root, 5, (f) => { this.placeOnTrack(m.root, k.dist - i * 2.2, k.d + Math.sin(f.t * 5 + i * 2) * 2.5, k.h, k.yaw); m.anim(f.t + i); });
    }
  },
  bigSignal(k) {
    const g = new THREE.Group();
    mk(g, GEO.cyl(0.6, 0.6, 22, 8), 0x7a7f88, 14, 11, 0);
    mk(g, GEO.box(16, 5, 2.5), 0x3a3f48, 0, 20, 0);
    const lamps = [0x2aff6a, 0xffd23a, 0xff2020].map((c, i) => { const l = mk(g, GEO.cyl(1.8, 1.8, 0.4, 20), c, (i - 1) * 5.2, 20, 1.3, { r: [Math.PI / 2, 0, 0], mat: new THREE.MeshBasicMaterial({ color: i === 2 ? c : 0x222222 }) }); return l; });
    const s = k.dist + 60;
    this.summon(g, 3, (f) => { this.placeOnTrack(g, s, 0, 0, Math.PI); lamps[2].visible = Math.floor(f.t * 6) % 2 === 0 || f.t > 0.8; });
  },
  jellyHat(o) {
    const g = new THREE.Group();
    mk(g, new THREE.SphereGeometry(1.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xff9ae0, 0, 0, 0, { mo: { op: 0.7, e: 0xa03090, ds: true } });
    for (let i = 0; i < 6; i++) mk(g, GEO.cyl(0.05, 0.02, 2.2, 4), 0xffc0f0, Math.cos(i) * 0.8, -1.1, Math.sin(i) * 0.8);
    this.summon(g, 2.4, (f) => { g.position.copy(o.model.root.position); g.position.y += 3 + Math.sin(f.t * 6) * 0.2; g.scale.setScalar(1 + Math.sin(f.t * 8) * 0.08); });
  },
  iceCube(o, life) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 3.6), new THREE.MeshStandardMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.2, emissive: 0x204060 }));
    this.summon(m, life, () => { m.position.copy(o.model.root.position); m.position.y += 1.1; m.quaternion.copy(o.model.root.quaternion); });
  },
  bigNamazu(k) {
    const g = new THREE.Group();
    mk(g, GEO.sph(4, 16, 12), 0x5a5a48, 0, 0, 0, { s: [1, 0.8, 2.4] }); mk(g, GEO.sph(3.4, 14, 10), 0xd8d0b0, 0, -0.8, 0.8, { s: [1, 0.7, 2.2] });
    for (const s2 of [-1, 1]) { mk(g, GEO.sph(0.7, 10, 8), 0xffffff, s2 * 2.2, 1.6, 6.5); mk(g, GEO.sph(0.35, 8, 6), 0x111111, s2 * 2.2, 1.6, 7.1); mk(g, GEO.cyl(0.12, 0.05, 7, 4), 0x2a2a1a, s2 * 3, 0, 8, { r: [0, 0, s2 * 1.2] }); }
    const s = k.dist + 30, side = (this.track.hw[0] + 12);
    this.summon(g, 2.6, (f) => { const t = f.t / 2.6; this.placeOnTrack(g, s, side * (1 - t * 2), Math.sin(t * Math.PI) * 26 - 4, Math.PI / 2); g.rotateX(-1.2 + t * 2.4); });
  },
  magicCircle(k) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
    c.strokeStyle = '#d8a8ff'; c.lineWidth = 6; c.shadowColor = '#b05aff'; c.shadowBlur = 16;
    for (const r of [120, 96, 60]) { c.beginPath(); c.arc(128, 128, r, 0, 7); c.stroke(); }
    c.beginPath(); for (let i = 0; i <= 5; i++) { const a = i * Math.PI * 4 / 5 - Math.PI / 2; const x = 128 + Math.cos(a) * 96, y = 128 + Math.sin(a) * 96; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.summon(m, 2.2, (f) => { this.placeOnTrack(m, k.dist, k.d, 0.15, 0); m.rotateX(-Math.PI / 2); m.rotateZ(f.t * 2); m.material.opacity = Math.max(0, 1 - f.t / 2.2); m.scale.setScalar(0.4 + f.t * 0.6); });
  },
  purpleSky() {
    const f = this.scene.fog, base = this.baseFog; if (!base) return;
    const save = { c: base.c.clone(), far: base.far }; base.c = new THREE.Color(0x5a1a9a); base.far = Math.min(base.far, 300);
    setTimeout(() => { if (this.baseFog === base) { base.c = save.c; base.far = save.far; } }, 2200);
  },

  magicFx(k, M) {
    const p = k.model.root.position.clone(); p.y += 1;
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2, r = 10 + Math.random() * 10;
      this.particles.emit(p, new THREE.Vector3(Math.cos(a) * r, 2 + Math.random() * 8, Math.sin(a) * r), i % 3 ? M.col : 0xffffff, 0.8, 1.3, 0.2, 2);
    }
    for (let i = 0; i < 24; i++) this.particles.emit(p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3)), new THREE.Vector3(0, 6 + Math.random() * 8, 0), M.col, 1.1, 0.9, 0.1, -2);
    const nearCam = !this.player || p.distanceTo(this.camera.position) < 80;
    if (nearCam) SND.play(k.ch.rare ? 'magicRare' : 'magic');
    if (k.isPlayer) { HUD.cutin(k, M); if (k.ch.rare) HUD.flash(); }
    else if (this.player && nearCam) HUD.toast(`✨ ${k.name}「${M.line}」`);

  },

  // 毎フレーム（ローカルのカート）
  updateMagic(k, dt, inp) {
    this.chargeMagic(k, dt / MAGIC_TIME);
    if (k.pound && k.grounded) { // 鏡餅：着地の衝撃波
      k.pound = false; SND.play('boom'); HUD.shake(k.isPlayer ? 0.7 : 0);
      for (const o of this.karts) if (o !== k && !o.out && Math.hypot(this.dDist(o.dist, k.dist), o.d - k.d) < 16) this.hitAny(o, 'flat', { balloons: 2 });
      const p = k.model.root.position; for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28; this.particles.emit(p, new THREE.Vector3(Math.cos(a) * 18, 2, Math.sin(a) * 18), 0xfff0d8, 0.6, 1.4, 0.3, 4, false); }
    }
    if (k.wiggleT > 0) { k.wiggleT -= dt; inp.steer = U.clamp((inp.steer || 0) + Math.sin(this.time * 9 + k.weight) * 0.9, -1, 1); if (Math.random() < 0.2) this.particles.emit(k.model.root.position.clone().add(new THREE.Vector3(0, 2, 0)), new THREE.Vector3(0, 2, 0), 0xffffff, 0.5, 0.5, 0.1, 0); }
    if (k.beamT > 0) { k.beamT -= dt; const p = k.model.root.position.clone(); p.y += 1; const F = this.fwdVec(k); for (let i = 0; i < 6; i++) this.particles.emit(p.clone().addScaledVector(F, 2 + Math.random() * 60), new THREE.Vector3(0, 0, 0), 0xff6ab0, 0.25, 1.6, 0.6, 0); }
    if (k.isAI && (k.magic || 0) >= 1 && this.started && Math.random() < dt * 0.5) inp.magicEdge = true;
    if (inp.magicEdge && (k.magic || 0) >= 1 && k.spinT <= 0 && k.knockT <= 0 && k.sleepT <= 0) this.useMagic(k);
    inp.magicEdge = false;
  },
});
