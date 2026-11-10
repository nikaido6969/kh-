// ===== レースエンジン =====
const CC_BASE = { 100: 33, 150: 43, 200: 55 };
const ITEMS = {
  turbo: { icon: '🥕', name: 'ターボにんじん' },
  turbo3: { icon: '🥕', name: 'トリプルにんじん', n: 3 },
  nut: { icon: '🌰', name: 'ドングリ弾' },
  stink: { icon: '🪲', name: 'カメムシミサイル' },
  natto: { icon: '🫘', name: '納豆トラップ' },
  onigiri: { icon: '🍙', name: '無敵おにぎり' },
  kaminari: { icon: '⚡', name: '雷さま' },
  sumi: { icon: '🐙', name: '墨ダコ' },
  ufo: { icon: '🛸', name: '牽引UFO' },
};
const ITEM_TABLE = [
  [0.2, { natto: 35, nut: 30, turbo: 20, stink: 10, sumi: 5 }],
  [0.55, { nut: 15, stink: 25, turbo: 20, turbo3: 15, natto: 10, sumi: 8, onigiri: 5 }],
  [1.01, { turbo3: 25, stink: 20, onigiri: 18, ufo: 12, kaminari: 9, turbo: 12, sumi: 4 }],
];
const MT_COL = [0xffffff, 0x4ac8ff, 0xffa020, 0xd060ff];
const MT_TIME = [0, 0.55, 1.05, 1.65];

// ---------- 入力 ----------
const Input = {
  keys: {}, touch: { l: false, r: false, a: false, b: false, drift: false, item: false }, autoAccel: U.isTouch, tilt: 0,
  st: { steer: 0, accel: false, brake: false, drift: false, item: false, back: false, look: false },
  prevItem: false, prevDrift: false, itemEdge: false, driftEdge: false,
  init() {
    addEventListener('keydown', e => { this.keys[e.code] = true; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && GAME && GAME.running) e.preventDefault(); });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });
  },
  poll() {
    const k = this.keys, t = this.touch;
    let steer = 0;
    if (k.ArrowLeft || k.KeyA) steer -= 1;
    if (k.ArrowRight || k.KeyD) steer += 1;
    if (t.l) steer -= 1; if (t.r) steer += 1;
    let accel = !!(k.ArrowUp || k.KeyW || k.KeyX) || t.a;
    let brake = !!(k.ArrowDown || k.KeyS || k.KeyZ) || t.b;
    let drift = !!(k.Space || k.ShiftLeft || k.ShiftRight || k.KeyR) || t.drift;
    let item = !!(k.KeyE || k.KeyQ || k.ControlLeft || k.KeyF) || t.item;
    let look = !!k.KeyC;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const ax = p.axes[0] || 0; if (Math.abs(ax) > 0.15) steer += ax;
      const b = (i) => p.buttons[i] && p.buttons[i].pressed;
      if (b(14)) steer -= 1; if (b(15)) steer += 1;
      if (b(0) || b(7) && false) accel = true;
      if (b(1)) brake = true;
      if (b(5) || b(7)) drift = true;
      if (b(4) || b(6)) item = true;
      if (b(2)) look = true;
      if (b(12)) this.up = true;
    }
    if (this.autoAccel && !brake) accel = true;
    steer = U.clamp(steer, -1, 1);
    this.itemEdge = item && !this.prevItem; this.prevItem = item;
    this.driftEdge = drift && !this.prevDrift; this.prevDrift = drift;
    Object.assign(this.st, { steer, accel, brake, drift, item, back: brake, look });
    return this.st;
  },
};

// ---------- パーティクル ----------
class Particles {
  constructor(scene) {
    this.pool = []; this.scene = scene;
    const tex = U.glowTex();
    for (let i = 0; i < 260; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.visible = false; scene.add(sp);
      this.pool.push({ sp, life: 0, max: 1, v: new THREE.Vector3(), g: 0, s0: 1, s1: 0 });
    }
    this.i = 0;
  }
  emit(pos, vel, col, life, s0, s1, g = 0, additive = true) {
    const p = this.pool[this.i]; this.i = (this.i + 1) % this.pool.length;
    p.sp.position.copy(pos); p.v.copy(vel); p.sp.material.color.setHex(col);
    p.sp.material.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    p.life = p.max = life; p.s0 = s0; p.s1 = s1; p.g = g; p.sp.visible = true;
  }
  update(dt) {
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.sp.visible = false; continue; }
      p.v.y -= p.g * dt;
      p.sp.position.addScaledVector(p.v, dt);
      const t = 1 - p.life / p.max;
      const s = p.s0 + (p.s1 - p.s0) * t; p.sp.scale.set(s, s, s);
      p.sp.material.opacity = Math.min(1, p.life / p.max * 1.5);
    }
  }
}

// ---------- カート ----------
let KART_ID = 0;
class Kart {
  constructor(game, ch, o) {
    this.game = game; this.ch = ch; this.id = o.id ?? ('k' + (KART_ID++));
    this.name = o.name || ch.name; this.type = o.type; // player / ai / remote
    this.isPlayer = o.type === 'player'; this.isAI = o.type === 'ai'; this.isRemote = o.type === 'remote';
    const [spd, acc, hnd, wgt] = ch.st;
    this.vmax = game.ccBase * (0.93 + 0.035 * spd);
    this.accK = 0.8 + 0.13 * acc;
    this.turn = 1.5 + 0.13 * hnd;
    this.weight = wgt;
    const m = buildRacerModel(ch);
    this.model = m; game.scene.add(m.root);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(1.25, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
    sh.renderOrder = 1; game.scene.add(sh); this.shadow = sh;
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: 0xffffaa, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.glow.scale.set(5, 5, 5); this.glow.visible = false; game.scene.add(this.glow);
    Object.assign(this, {
      dist: 0, d: 0, h: 0, vh: 0, yaw: 0, v: 0, grounded: true, airT: 0, drift: 0, driftCharge: 0, mt: 0, slide: 0,
      boostT: 0, boostCol: 0, spinT: 0, knockT: 0, starT: 0, shrinkT: 0, ufoT: 0, inkT: 0, respawnT: 0, fallT: -1, offEdge: false, fromGap: false,
      item: null, itemN: 0, rollT: 0, finished: false, finishTime: 0, lap: 0, rank: 0, lastSafe: 0, trick: false, trickT: 0, spinVis: 0, flipVis: 0,
      steerVis: 0, wheelRot: 0, aiOff: 0, aiOffT: 0, aiItemT: 0, skill: 1, rb: 1, input: { steer: 0, accel: false, brake: false, drift: false }, prevDrift: false, prevItem: false,
      netT: null, rubber: 1, padCool: 0,
    });
  }
  get progress() { return this.finished ? 1e9 - this.finishTime : this.dist; }
}

// ---------- ゲーム本体 ----------
class Game {
  constructor(renderer) {
    this.renderer = renderer; this.running = false; this.paused = false;
    this.fr = { p: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), r: new THREE.Vector3() };
    this.tmp = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), m: new THREE.Matrix4(), q: new THREE.Quaternion() };
  }

  setup(cfg) {
    this.dispose();
    this.cfg = cfg;
    this.def = COURSES.find(c => c.id === cfg.course);
    this.ccBase = CC_BASE[cfg.cc] || 43;
    this.laps = cfg.laps || 3;
    const scene = new THREE.Scene(); this.scene = scene;
    const th = this.def.theme;
    scene.fog = new THREE.Fog(th.fog, 60, th.fogFar);
    this.baseFog = { c: new THREE.Color(th.fog), near: 60, far: th.fogFar };
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, th.amb));
    const sun = new THREE.DirectionalLight(0xffffff, th.sun); sun.position.set(200, 400, 120); scene.add(sun);
    this.track = new Track(this.def); this.track.buildScene(scene);
    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.3, 4000);
    this.camPos = new THREE.Vector3(); this.camUp = new THREE.Vector3(0, 1, 0); this.camLook = new THREE.Vector3(); this.camInit = false;
    this.particles = new Particles(scene);
    // カート
    this.karts = [];
    cfg.racers.forEach((r, i) => {
      const k = new Kart(this, CHARS.find(c => c.id === r.ch) || CHARS[0], r);
      const row = Math.floor(i / 2);
      k.dist = -8 - row * 6.5; k.d = (i % 2 ? 1 : -1) * this.track.hw[0] * 0.45;
      k.lastSafe = k.dist;
      k.skill = r.skill || 1;
      this.karts.push(k);
    });
    this.player = this.karts.find(k => k.isPlayer);
    // アイテムボックス
    this.boxes = [];
    const bgeo = new THREE.BoxGeometry(1.7, 1.7, 1.7);
    const bmat = new THREE.MeshStandardMaterial({ map: U.itemBoxTex(), transparent: true, opacity: 0.85, emissive: 0xffffff, emissiveMap: U.itemBoxTex(), emissiveIntensity: 0.5 });
    for (const j of this.track.itemRows) {
      const hw = this.track.hw[j];
      for (const f of [-0.66, -0.22, 0.22, 0.66]) {
        const m = new THREE.Mesh(bgeo, bmat); scene.add(m);
        const b = { s: j * this.track.ds, d: f * hw, alive: true, t: 0, mesh: m };
        this.placeOnTrack(m, b.s, b.d, 1.3); this.boxes.push(b);
      }
    }
    // ダッシュ板
    this.pads = [];
    const pgeo = new THREE.PlaneGeometry(3.2, 5);
    const pmat = new THREE.MeshBasicMaterial({ map: U.boostTex(), transparent: true, opacity: 0.95, side: THREE.DoubleSide });
    for (const j of this.track.boosts) {
      for (const f of [-0.35, 0.35]) {
        const s = j * this.track.ds, d = f * this.track.hw[j];
        const m = new THREE.Mesh(pgeo, pmat);
        this.track.frame(s, this.fr);
        const mat = new THREE.Matrix4().makeBasis(this.fr.r, this.fr.t, this.fr.u);
        m.quaternion.setFromRotationMatrix(mat);
        m.position.copy(this.fr.p).addScaledVector(this.fr.r, d).addScaledVector(this.fr.u, 0.06 + this.track.lerpArr(this.track.off, s));
        scene.add(m); this.pads.push({ s, d });
      }
    }
    this.projs = []; this.projId = 0;
    // 交通
    this.traffic = [];
    if (this.def.traffic) {
      for (let i = 0; i < this.def.traffic; i++) {
        const onc = i % 2 === 1;
        const c = { dist: (i + 0.5) / this.def.traffic * this.track.L, d: (onc ? 1 : -1) * this.track.hw[0] * 0.48, v: onc ? -17 : 15, mesh: this.makeCar(i) };
        scene.add(c.mesh); this.traffic.push(c);
      }
    }
    // UFO
    this.ufoMesh = new THREE.Group();
    mk(this.ufoMesh, GEO.sph(1.6, 16, 8), 0xc0c8d8, 0, 0, 0, { s: [1.6, 0.35, 1.6], mo: { m: 0.8, r: 0.2 } });
    mk(this.ufoMesh, GEO.sph(0.8, 12, 8), 0x7dffb0, 0, 0.4, 0, { mo: { op: 0.7, e: 0x20a060 } });
    this.ufoMesh.visible = false; scene.add(this.ufoMesh);
    // 状態
    this.time = 0; this.raceT = -4.0; this.started = false; this.finishedAll = false; this.countShown = 4;
    this.finalLapShown = false; this.resultsShown = false; this.rocket = { first: null };
    this.running = true; this.paused = false;
    HUD.setup(this);
    SND.startBGM(this.def.music);
    SND.startEngine();
  }

  makeCar(i) {
    const g = new THREE.Group();
    const cols = [0xffffff, 0xf4f4f4, 0x3a6ad8, 0xd8d8d8, 0xffd23a, 0x8ad84a];
    const col = cols[i % cols.length];
    if (i % 3 === 0) { // 軽トラ
      mk(g, GEO.box(1.7, 1.4, 1.4), col, 0, 1.1, 1.0);
      mk(g, GEO.box(1.6, 0.6, 0.05), 0x6a90b0, 0, 1.4, 1.72, { mo: { e: 0x203040 } });
      mk(g, GEO.box(1.7, 0.5, 2.2), col, 0, 0.75, -0.8);
      mk(g, GEO.box(1.72, 0.4, 0.05), col, 0, 1.15, -1.9);
    } else {
      mk(g, GEO.box(1.8, 0.9, 3.8), col, 0, 0.8, 0);
      mk(g, GEO.box(1.6, 0.7, 2.0), col, 0, 1.55, -0.2);
      mk(g, GEO.box(1.5, 0.55, 0.05), 0x6a90b0, 0, 1.55, 0.82, { mo: { e: 0x203040 } });
    }
    for (const [x, z] of [[-0.85, 1.2], [0.85, 1.2], [-0.85, -1.2], [0.85, -1.2]]) mk(g, GEO.cyl(0.35, 0.35, 0.3, 10), 0x1a1a1a, x, 0.35, z, { r: [0, 0, Math.PI / 2] });
    mk(g, GEO.box(0.4, 0.2, 0.05), 0xffffa0, -0.6, 0.85, 1.92, { mo: { e: 0xffffa0 } });
    mk(g, GEO.box(0.4, 0.2, 0.05), 0xffffa0, 0.6, 0.85, 1.92, { mo: { e: 0xffffa0 } });
    return g;
  }

  placeOnTrack(obj, s, d, h, yaw = 0) {
    const fr = this.track.frame(s, this.fr);
    const F = this.tmp.a.copy(fr.t).multiplyScalar(Math.cos(yaw)).addScaledVector(fr.r, Math.sin(yaw));
    const Lf = this.tmp.b.crossVectors(fr.u, F);
    this.tmp.m.makeBasis(Lf, fr.u, F);
    obj.quaternion.setFromRotationMatrix(this.tmp.m);
    obj.position.copy(fr.p).addScaledVector(fr.r, d).addScaledVector(fr.u, h + this.track.lerpArr(this.track.off, s));
  }

  dispose() {
    this.running = false;
    SND.stopBGM(); SND.stopEngine();
    if (this.scene) {
      this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      this.scene = null;
    }
  }

  // ===== メインループ =====
  update(dt) {
    if (!this.running || this.paused) return;
    dt = Math.min(dt, 1 / 30);
    this.time += dt;
    this.raceT += dt;
    // カウントダウン
    if (!this.started) {
      const c = Math.ceil(-this.raceT);
      if (c < this.countShown && c >= 1) { this.countShown = c; HUD.msg(String(c), 0.9, 'count'); SND.play('count'); }
      const inp = Input.poll();
      if (this.player && inp.accel && this.rocket.first === null) this.rocket.first = this.raceT;
      if (this.player && !inp.accel) this.rocket.first = null;
      if (this.raceT >= 0) {
        this.started = true; HUD.msg('GO!', 1.0, 'go'); SND.play('go');
        if (this.player && this.rocket.first !== null) {
          const t = this.rocket.first;
          if (t > -1.7 && t < -0.9) { this.player.boostT = 1.0; this.player.v = this.player.vmax * 0.8; SND.play('boost'); HUD.msg('ロケットスタート！', 1.2, 'small'); }
          else if (t <= -2.6) { this.player.spinT = 0.8; HUD.msg('エンスト…', 1.0, 'small'); }
        }
        for (const k of this.karts) if (k.isAI && Math.random() < 0.5) k.boostT = 0.6 + Math.random() * 0.4;
      }
    }
    // 入力
    if (this.player) {
      const inp = this.started ? Input.poll() : { steer: 0, accel: false, brake: false, drift: false };
      if (this.started) {
        Object.assign(this.player.input, inp);
        this.player.input.driftEdge = Input.driftEdge; this.player.input.itemEdge = Input.itemEdge;
      }
      if (this.player.finished) this.aiInput(this.player, dt);
    }
    for (const k of this.karts) if (k.isAI) this.aiInput(k, dt);
    // 物理
    for (const k of this.karts) {
      if (k.isRemote) this.remoteUpdate(k, dt);
      else this.physics(k, dt);
    }
    this.collideKarts();
    this.updateProjs(dt);
    this.updateBoxes(dt);
    this.updateTraffic(dt);
    this.updateRanks();
    for (const k of this.karts) this.visual(k, dt);
    this.particles.update(dt);
    this.updateCamera(dt);
    HUD.update(this, dt);
    if (this.player) SND.setEngine(this.player.v, this.player.boostT > 0);
    if (window.NET && NET.active) NET.tick(this, dt);
  }

  // ----- AI -----
  aiInput(k, dt) {
    const tr = this.track, inp = k.input;
    const s = tr.wrap(k.dist);
    k.aiOffT -= dt;
    if (k.aiOffT <= 0) { k.aiOffT = 1.5 + Math.random() * 3; k.aiOffTarget = (Math.random() - 0.5) * 0.7; }
    k.aiOff = U.damp(k.aiOff, k.aiOffTarget || 0, 0.8, dt);
    const la = 9 + Math.max(0, k.v) * 0.32;
    const hw = tr.lerpArr(tr.hw, s + la);
    let tD = tr.lerpArr(tr.ai, s + la) + k.aiOff * hw;
    // 障害物回避
    for (const p of this.projs) {
      if (p.type !== 'natto') continue;
      const ds = this.dDist(p.dist, k.dist);
      if (ds > 0 && ds < 28 && Math.abs(p.d - tD) < 2.5) tD += (p.d > tD ? -1 : 1) * 3;
    }
    for (const c of this.traffic) {
      const ds = this.dDist(c.dist, k.dist);
      if (ds > -3 && ds < 32 && Math.abs(c.d - tD) < 3.2) tD = c.d + (k.d > c.d ? 3.6 : -3.6);
    }
    tD = U.clamp(tD, -hw + 1.5, hw - 1.5);
    const yawDes = Math.atan2(tD - k.d, la);
    const kap = tr.lerpArr(tr.kap, s + Math.max(0, k.v) * 0.12);
    const turnRate = k.turn * Math.min(1, Math.abs(k.v) / 14) * (1 - 0.18 * Math.abs(k.v) / k.vmax) || 0.3;
    let need = kap * k.v + U.wrapA(yawDes - k.yaw) * 3.2;
    if (k.inkT > 0) need += Math.sin(this.time * 3 + k.id.length) * 1.2;
    inp.steer = U.clamp(need / Math.max(0.3, turnRate), -1, 1);
    inp.accel = true; inp.brake = false; inp.drift = false; inp.driftEdge = false;
    if (Math.abs(k.yaw) > 1.6) inp.steer = -Math.sign(k.yaw);
    // アイテム
    inp.itemEdge = false;
    if (k.item && k.rollT <= 0) {
      k.aiItemT -= dt;
      if (k.aiItemT <= 0) {
        let use = true;
        if (k.item === 'natto') use = this.karts.some(o => o !== k && this.dDist(k.dist, o.dist) > 0 && this.dDist(k.dist, o.dist) < 25) || Math.random() < 0.02;
        if (k.item === 'nut') use = this.karts.some(o => o !== k && this.dDist(o.dist, k.dist) > 0 && this.dDist(o.dist, k.dist) < 40 && Math.abs(o.d - k.d) < 3) || Math.random() < 0.01;
        if (use) { inp.itemEdge = true; k.aiItemT = 0.6 + Math.random() * 1.5; }
      }
    }
  }

  dDist(a, b) { // a - b を周回考慮で
    let x = a - b; const L = this.track.L;
    x = ((x % L) + L * 1.5) % L - L / 2; return x;
  }

  // ----- 物理 -----
  physics(k, dt) {
    const tr = this.track, def = this.def, inp = k.input;
    const s = tr.wrap(k.dist);
    const [i] = tr.idx(s);
    const hw = tr.hw[i], sh = tr.sh[i], fl = tr.flags[i];
    // タイマー
    k.boostT = Math.max(0, k.boostT - dt); k.spinT = Math.max(0, k.spinT - dt); k.knockT = Math.max(0, k.knockT - dt);
    k.starT = Math.max(0, k.starT - dt); k.shrinkT = Math.max(0, k.shrinkT - dt); k.inkT = Math.max(0, k.inkT - dt);
    k.padCool = Math.max(0, k.padCool - dt);
    if (k.ufoT > 0) { k.ufoT -= dt; if (k.ufoT <= 0) { k.ufoT = 0; k.boostT = 0.8; } }
    if (k.respawnT > 0) { k.respawnT -= dt; k.v = 0; if (k.respawnT > 0) return; }
    if (k.rollT > 0) { k.rollT -= dt; if (k.rollT <= 0) { k.rollT = 0; if (k.isPlayer) SND.play('item'); k.aiItemT = 0.8 + Math.random() * 2.5; } else if (k.isPlayer && Math.random() < 0.5) SND.play('roll'); }
    const locked = !this.started || k.spinT > 0 || k.knockT > 0;
    // アイテム使用
    if (!locked && inp.itemEdge && k.item && k.rollT <= 0) this.useItem(k, inp);
    // 最高速
    let vm = k.vmax * k.rb * (k.isAI ? k.skill : 1);
    if (k.shrinkT > 0) vm *= 0.72;
    const off = Math.abs(k.d) > hw + 0.4 && !(fl & 1);
    const shSurf = def.shSurf;
    const hardSh = ['sidewalk', 'steel', 'neon2', 'rock2', 'jupiter2'].includes(shSurf);
    let pen = 1;
    if (off && k.grounded && k.boostT <= 0 && k.starT <= 0 && k.ufoT <= 0) pen = hardSh ? 0.88 : shSurf === 'mud' ? 0.45 : 0.55;
    vm *= pen;
    const wy = this._worldY(k);
    const inWater = def.water != null && wy < def.water;
    if (inWater) vm *= 0.94;
    if (k.inWater !== inWater) { if (k.isPlayer) SND.play('splash'); k.inWater = inWater; }
    if (k.boostT > 0) vm = Math.max(vm, k.vmax * 1.3);
    if (k.starT > 0) vm = Math.max(vm, k.vmax * 1.14);
    const ufo = k.ufoT > 0;
    if (ufo) vm = k.vmax * 1.65;
    // 縦方向
    if (ufo) {
      k.v = U.damp(k.v, vm, 3, dt);
    } else if (!locked) {
      if (inp.accel && !inp.brake) {
        if (k.v < vm) { const x = U.clamp(k.v / vm, 0, 1); k.v += k.accK * vm * (0.9 * Math.pow(1 - x, 0.75) + 0.015) * dt; }
      } else if (inp.brake) {
        if (k.v > 0) k.v -= 42 * dt; else k.v = Math.max(-11, k.v - 16 * dt);
      } else k.v -= Math.sign(k.v) * Math.min(Math.abs(k.v), 9 * dt);
      if (k.boostT > 0 && k.v < vm) k.v += 75 * dt;
    } else {
      k.v *= Math.exp(-(k.knockT > 0 ? 4 : 2.2) * dt);
    }
    if (k.v > vm) k.v -= (k.v - vm) * Math.min(1, (pen < 1 ? 3.5 : 1.8) * dt);
    // ハンドリング
    const sp = Math.abs(k.v);
    let turnRate = k.turn * Math.min(1, sp / 13) * (1 - 0.16 * Math.min(1.3, sp / k.vmax));
    if (!k.grounded) turnRate *= 0.55;
    if (inWater) turnRate *= 0.9;
    let yawRate = 0;
    const steer = locked ? 0 : inp.steer;
    // ジャンプ & ドリフト
    if (!locked && !ufo && inp.driftEdge && k.grounded) {
      k.vh = 5.2; k.grounded = false; k.airT = 0; k.hop = true; if (k.isPlayer) SND.play('hop');
    }
    if (!locked && !ufo && inp.driftEdge && !k.grounded && !k.hop && k.airT < 0.35 && k.vh > 3 && !k.trick) { k.trick = true; k.trickT = 0; if (k.isPlayer) SND.play('hop'); }
    if (!locked && !ufo && inp.drift && !k.drift && Math.abs(steer) > 0.35 && k.v > 15 && (k.grounded || k.hop)) {
      k.drift = Math.sign(steer); k.driftCharge = 0; k.mt = 0;
    }
    if (k.drift) {
      if (!inp.drift || k.v < 10 || locked || ufo) {
        if (k.mt > 0 && !locked) { k.boostT = Math.max(k.boostT, MT_TIME[k.mt]); k.boostCol = k.mt; if (k.isPlayer) SND.play('boost'); }
        k.drift = 0; k.mt = 0; k.driftCharge = 0;
      } else {
        const base = 0.8 + 0.48 * steer * k.drift;
        yawRate = k.drift * turnRate * base * 1.08;
        if (k.grounded) k.driftCharge += dt * (0.75 + 0.95 * Math.max(0, steer * k.drift)) * (k.isAI ? 0 : 1);
        const lv = k.driftCharge > 3.0 ? 3 : k.driftCharge > 1.9 ? 2 : k.driftCharge > 0.95 ? 1 : 0;
        if (lv > k.mt) { k.mt = lv; if (k.isPlayer) SND.play('mt1'); }
      }
    } else {
      yawRate = steer * turnRate * Math.sign(k.v || 1);
    }
    if (ufo) { // 自動操縦
      const tD = tr.lerpArr(tr.ai, s + 20);
      const kap = tr.lerpArr(tr.kap, s + 5);
      k.d = U.damp(k.d, tD, 2, dt); k.yaw = U.damp(k.yaw, 0, 6, dt); yawRate = 0;
      k.yaw += kap * k.v * dt * 0; // 軌道に沿う
    }
    k.slide = U.damp(k.slide, k.drift * 0.42, 6, dt);
    k.yaw += yawRate * dt;
    // トラック曲率
    const kap = tr.lerpArr(tr.kap, s);
    const scale = U.clamp(1 / (1 - kap * k.d), 0.6, 1.7);
    const dsA = k.v * Math.cos(k.yaw) * dt * scale;
    if (!ufo) k.yaw -= kap * dsA;
    k.dist += dsA;
    k.d += k.v * Math.sin(k.yaw) * dt;
    k.yaw = U.wrapA(k.yaw);
    // 壁
    const s2 = tr.wrap(k.dist);
    const [i2] = tr.idx(s2);
    const fl2 = tr.flags[i2];
    const edge = tr.hw[i2] + tr.sh[i2] - 0.8;
    if (!(fl2 & 2)) {
      if (Math.abs(k.d) > edge) {
        const sg = Math.sign(k.d); k.d = sg * edge;
        if (k.yaw * sg > 0) {
          const imp = Math.abs(Math.sin(k.yaw));
          k.v *= 1 - 0.55 * imp; k.yaw = -k.yaw * 0.3;
          if (imp > 0.15 && k.v > 6) { if (k.isPlayer) { SND.play('wall'); HUD.shake(0.25 * imp); } this.spark(k, 0xffd080, 6); }
          if (imp > 0.35 && k.drift) { k.drift = 0; k.mt = 0; }
        }
      }
    } else if (Math.abs(k.d) > tr.hw[i2] + tr.sh[i2] + 0.6 && !k.offEdge && !ufo) {
      k.offEdge = true; k.grounded = false;
    }
    // 垂直
    let g = def.gravity;
    if (inWater) g *= 0.45;
    const sOff = tr.lerpArr(tr.off, s2);
    const gap = (fl2 & 1) || k.offEdge;
    if (ufo) { k.h = U.damp(k.h, 1.2, 4, dt); k.vh = 0; k.grounded = true; k.offEdge = false; }
    else if (k.grounded) {
      if (gap) { k.grounded = false; k.fromGap = true; }
      else {
        const nv = (sOff - k.h) / dt, pred = k.vh - g * dt;
        if (nv < pred - 0.8 && sOff < k.h) { k.grounded = false; k.vh = pred; k.airT = 0; k.hop = false; }
        else { k.h = sOff; k.vh = U.clamp(nv, -30, 30); }
      }
    }
    if (!k.grounded && !ufo) {
      k.vh -= g * dt; k.h += k.vh * dt; k.airT += dt;
      if (k.trick) k.trickT += dt;
      if (gap) k.fromGap = true;
      if (!gap && k.h <= sOff) {
        if (k.fromGap && k.h < sOff - 1.6) { this.fallOut(k, true); return; }
        k.h = sOff; k.grounded = true; k.vh = 0; k.fromGap = false;
        if (k.airT > 0.35 && k.isPlayer) SND.play('land');
        if (k.trick) { k.boostT = Math.max(k.boostT, 0.9); k.boostCol = 1; if (k.isPlayer) SND.play('boost'); }
        k.trick = false; k.hop = false; k.airT = 0;
      }
      if (k.h < -14) { this.fallOut(k, !!(fl2 & 1)); return; }
    }
    if (k.grounded && !(fl2 & 1) && Math.abs(k.d) < tr.hw[i2] && !k.offEdge) k.lastSafe = k.dist;
    // ダッシュ板
    if (k.padCool <= 0 && k.h < 1.2) for (const p of this.pads) {
      if (Math.abs(this.dDist(k.dist, p.s)) < 2.5 && Math.abs(k.d - p.d) < 2.0) {
        k.boostT = Math.max(k.boostT, 1.15); k.boostCol = 2; k.padCool = 0.4; if (k.isPlayer) SND.play('boost');
      }
    }
    // ラップ
    const lap = Math.floor(k.dist / tr.L) + 1;
    if (lap !== k.lap) {
      if (lap > k.lap && k.lap >= 1 && k.isPlayer && lap <= this.laps) {
        if (lap === this.laps) { HUD.msg('FINAL LAP', 2, 'final'); SND.play('final'); if (SND.bgm) SND.bgm.fast = 1.12; }
        else { HUD.msg('LAP ' + lap, 1.2, 'small'); SND.play('lap'); }
      }
      k.lap = lap;
    }
    if (!k.finished && k.dist >= this.laps * tr.L) this.finish(k);
    // 粒子
    if (k.grounded && k.v > 20 && off && !hardSh && Math.random() < 0.5) this.dust(k, shSurf === 'grass' ? 0x9ac86a : 0xa07a4a);
    if (inWater && Math.random() < 0.3) this.bubble(k);
  }

  _worldY(k) { const fr = this.track.frame(k.dist, this.fr); return fr.p.y + fr.r.y * k.d + fr.u.y * k.h; }

  fallOut(k, gap) {
    if (k.isPlayer) { SND.play('fall'); HUD.msg('回収中…', 1.2, 'small'); }
    let s = k.lastSafe;
    if (gap) { // 穴の先へ
      let d = k.dist; let n = 0;
      while ((this.track.flagAt(d) & 1) && n < 200) { d += 2; n++; }
      s = d + 3;
    }
    k.dist = s; k.d = U.clamp(this.track.lerpArr(this.track.ai, s), -3, 3); k.h = 0; k.vh = 0; k.v = 0; k.yaw = 0;
    k.grounded = true; k.offEdge = false; k.fromGap = false; k.drift = 0; k.mt = 0; k.respawnT = 1.3; k.trick = false; k.hop = false;
    k.lastSafe = s;
  }

  finish(k) {
    k.finished = true; k.finishTime = this.raceT;
    if (k.isPlayer) {
      SND.play('finish'); HUD.msg('FINISH!', 3, 'go');
      if (SND.bgm) SND.bgm.fast = 1;
      setTimeout(() => this.showResults(), 3500);
    }
  }

  showResults() {
    if (this.resultsShown || !this.running) return;
    this.resultsShown = true;
    if (this.cfg.onResults) this.cfg.onResults(this.results());
  }

  results() {
    const L = this.track.L * this.laps;
    return this.karts.map(k => {
      let t = k.finishTime;
      if (!k.finished) { const rem = Math.max(0, L - k.dist); t = this.raceT + rem / Math.max(15, k.vmax * 0.9); }
      return { k, t, est: !k.finished };
    }).sort((a, b) => a.t - b.t);
  }

  // ----- アイテム -----
  rollItem(k) {
    const n = this.karts.length;
    const p = n > 1 ? k.rank / (n - 1) : 0;
    let table = ITEM_TABLE.find(([lim]) => p < lim)[1];
    if (this.cfg.mode === 'tt') table = { turbo3: 1 };
    let tot = 0; for (const v of Object.values(table)) tot += v;
    let r = Math.random() * tot;
    for (const [key, w] of Object.entries(table)) { r -= w; if (r <= 0) { k.item = key; break; } }
    if (!k.item) k.item = 'turbo';
    k.itemN = ITEMS[k.item].n || 1;
    k.rollT = k.isPlayer ? 1.1 : 0.9;
  }

  useItem(k, inp) {
    const it = k.item;
    const back = inp.back || inp.brake;
    const net = (o) => { if (window.NET && NET.active) NET.send({ t: 'proj', p: o }); };
    switch (it) {
      case 'turbo': case 'turbo3':
        k.boostT = Math.max(k.boostT, 1.25); k.boostCol = 2; k.v = Math.max(k.v, k.vmax); if (k.isPlayer) SND.play('boost'); break;
      case 'nut': {
        const o = { type: 'nut', dist: k.dist + (back ? -2.6 : 2.6), d: k.d, yaw: back ? 0 : k.yaw, v: back ? -55 : 74, owner: k.id };
        this.spawnProj(o); net(o); if (k.isPlayer) SND.play('throw'); break;
      }
      case 'stink': {
        const ahead = this.karts.filter(o => o !== k && !o.finished && this.dDist(o.dist, k.dist) > 0).sort((a, b) => this.dDist(a.dist, k.dist) - this.dDist(b.dist, k.dist))[0];
        const tgt = this.karts.find(o => o.rank === k.rank - 1) || ahead;
        const o = { type: 'stink', dist: k.dist + 2.6, d: k.d, yaw: 0, v: 68, owner: k.id, target: back ? null : (tgt ? tgt.id : null) };
        if (back) { o.type = 'nut'; o.dist = k.dist - 2.6; o.v = -55; }
        this.spawnProj(o); net(o); if (k.isPlayer) SND.play('throw'); break;
      }
      case 'natto': {
        const o = { type: 'natto', dist: k.dist - 2.8, d: k.d, yaw: 0, v: 0, owner: k.id };
        this.spawnProj(o); net(o); if (k.isPlayer) SND.play('throw'); break;
      }
      case 'onigiri':
        k.starT = 7; k.spinT = 0; k.knockT = 0; k.shrinkT = 0; if (k.isPlayer) SND.play('star'); break;
      case 'kaminari':
        this.applyKaminari(k.id); if (window.NET && NET.active) NET.send({ t: 'fx', fx: 'kaminari', from: k.id }); break;
      case 'sumi':
        this.applySumi(k.id); if (window.NET && NET.active) NET.send({ t: 'fx', fx: 'sumi', from: k.id }); break;
      case 'ufo':
        k.ufoT = 4.5; k.drift = 0; k.spinT = 0; k.knockT = 0; if (k.isPlayer) SND.play('boost'); break;
    }
    k.itemN--;
    if (k.itemN <= 0) { k.item = null; k.itemN = 0; }
  }

  applyKaminari(fromId) {
    SND.play('thunder'); HUD.flash();
    for (const o of this.karts) {
      if (o.id === fromId || o.isRemote || o.starT > 0 || o.ufoT > 0) continue;
      o.shrinkT = 3.2 + (1 - o.rank / this.karts.length) * 1.5; o.spinT = Math.max(o.spinT, 0.6);
      o.item = null; o.itemN = 0; o.rollT = 0; o.drift = 0; o.mt = 0;
    }
  }
  applySumi(fromId) {
    const src = this.karts.find(k => k.id === fromId); if (!src) return;
    for (const o of this.karts) {
      if (o.id === fromId || o.isRemote) continue;
      if (o.rank < src.rank) { o.inkT = 4.5; if (o.isPlayer) HUD.ink(); }
    }
  }

  spawnProj(o) {
    const p = Object.assign({ id: o.id || (this.cfg.netId || 'L') + '_' + (this.projId++), life: o.type === 'natto' ? 90 : o.type === 'stink' ? 11 : 8, h: 0.6, bounces: 5, age: 0, alive: true }, o);
    o.id = p.id;
    let m;
    if (p.type === 'nut') {
      m = new THREE.Group();
      mk(m, GEO.sph(0.55, 12, 10), 0x8a5a2a, 0, 0, 0, { s: [1, 1.15, 1] });
      mk(m, GEO.sph(0.58, 12, 6), 0x5a3a1a, 0, 0.3, 0, { s: [1, 0.45, 1] });
      mk(m, GEO.cyl(0.05, 0.05, 0.3, 5), 0x3a2a10, 0, 0.6, 0);
    } else if (p.type === 'stink') {
      m = new THREE.Group();
      mk(m, GEO.sph(0.6, 12, 10), 0x6a8a3a, 0, 0, 0, { s: [1, 0.5, 1.3] });
      mk(m, GEO.sph(0.25, 8, 6), 0x3a4a20, 0, 0.05, 0.7);
      for (const s of [-1, 1]) mk(m, GEO.cyl(0.02, 0.02, 0.6, 4), 0x2a2a1a, s * 0.15, 0.15, 1.0, { r: [1.2, 0, s * 0.3] });
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: 0xff4040, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      gl.scale.set(2.2, 2.2, 2.2); m.add(gl);
    } else {
      m = new THREE.Group();
      for (let q = 0; q < 9; q++) mk(m, GEO.sph(0.22, 7, 5), 0xb0803a, Math.cos(q) * 0.45 * (q % 3 / 2), 0.15 + (q % 2) * 0.12, Math.sin(q) * 0.45 * (q % 3 / 2), { s: [1, 0.8, 1.3] });
      mk(m, GEO.cyl(0.8, 0.8, 0.05, 14), 0xf4f4e8, 0, 0.0, 0, { mo: { op: 0.6 } });
    }
    p.mesh = m; this.scene.add(m);
    this.projs.push(p);
    return p;
  }

  removeProj(p, fx = true) {
    if (!p.alive) return;
    p.alive = false; this.scene.remove(p.mesh);
    if (fx) { this.track.frame(p.dist, this.fr); const pos = this.fr.p.clone().addScaledVector(this.fr.r, p.d).addScaledVector(this.fr.u, 1); for (let i = 0; i < 10; i++) this.particles.emit(pos, new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 8, (Math.random() - 0.5) * 10), 0xffd080, 0.5, 1.2, 0.2, 10); }
  }

  updateProjs(dt) {
    const tr = this.track;
    for (const p of this.projs) {
      if (!p.alive) continue;
      p.life -= dt; p.age += dt;
      if (p.life <= 0) { this.removeProj(p); continue; }
      const s = tr.wrap(p.dist);
      if (p.type === 'nut') {
        const kap = tr.lerpArr(tr.kap, s);
        const ds = p.v * Math.cos(p.yaw) * dt;
        p.yaw -= kap * ds * Math.sign(p.v || 1);
        p.dist += ds; p.d += Math.abs(p.v) * Math.sin(p.yaw) * dt * Math.sign(p.v);
        const [i] = tr.idx(p.dist);
        const edge = tr.hw[i] + tr.sh[i] - 0.6;
        if (Math.abs(p.d) > edge) {
          if (tr.flags[i] & 2) { this.removeProj(p); continue; }
          p.d = Math.sign(p.d) * edge; p.yaw = -p.yaw; p.bounces--; if (p.bounces < 0) { this.removeProj(p); continue; }
        }
        if (tr.flags[i] & 1) { this.removeProj(p, false); continue; }
      } else if (p.type === 'stink') {
        const tgt = p.target && this.karts.find(k => k.id === p.target);
        p.dist += p.v * dt;
        let tD = tr.lerpArr(tr.ai, s + 10);
        if (tgt) {
          const dd = this.dDist(tgt.dist, p.dist);
          if (dd < 0 && dd > -6) { p.dist = tgt.dist; }
          if (dd > -10 && dd < 140) tD = tgt.d;
          if (dd < 40) p.v = Math.max(p.v, tgt.v + 25);
        }
        p.d = U.damp(p.d, tD, dd2(p, tgt, this) < 30 ? 6 : 2.5, dt);
      }
      // 当たり判定（ローカルカートのみ）
      for (const k of this.karts) {
        if (k.isRemote || k.respawnT > 0) continue;
        if (k.id === p.owner && p.age < (p.type === 'natto' ? 1.0 : 0.6)) continue;
        if (Math.abs(this.dDist(k.dist, p.dist)) < 1.9 && Math.abs(k.d - p.d) < 1.7 && k.h < 2.5) {
          if (k.starT <= 0 && k.ufoT <= 0) this.hitKart(k, p.type === 'natto' ? 'spin' : 'knock');
          this.removeProj(p);
          if (window.NET && NET.active) NET.send({ t: 'phit', id: p.id });
          break;
        }
      }
      if (!p.alive) continue;
      // 弾同士
      for (const q of this.projs) {
        if (q === p || !q.alive) continue;
        if (Math.abs(this.dDist(q.dist, p.dist)) < 1.4 && Math.abs(q.d - p.d) < 1.3) { this.removeProj(p); this.removeProj(q); break; }
      }
      if (!p.alive) continue;
      const spin = p.type === 'natto' ? 0 : this.time * 10;
      this.placeOnTrack(p.mesh, p.dist, p.d, p.type === 'natto' ? 0.05 : 0.6, p.type === 'nut' ? spin : p.type === 'stink' ? 0 : 0);
      if (p.type === 'nut') p.mesh.rotateX(this.time * 12);
    }
    this.projs = this.projs.filter(p => p.alive);
    function dd2(p, t, g) { return t ? Math.abs(g.dDist(t.dist, p.dist)) : 999; }
  }

  hitKart(k, kind) {
    if (k.starT > 0 || k.ufoT > 0) return;
    if (kind === 'spin') { k.spinT = 1.0; }
    else { k.knockT = 1.3; k.vh = 8; k.grounded = false; k.airT = 0; }
    k.drift = 0; k.mt = 0; k.boostT = 0;
    if (k.isPlayer) { SND.play('hit'); HUD.shake(0.5); }
    this.spark(k, 0xffe060, 14);
  }

  updateBoxes(dt) {
    for (const b of this.boxes) {
      if (!b.alive) { b.t -= dt; if (b.t <= 0) { b.alive = true; b.mesh.visible = true; b.mesh.scale.setScalar(0.1); } continue; }
      if (b.mesh.scale.x < 1) b.mesh.scale.setScalar(Math.min(1, b.mesh.scale.x + dt * 3));
      b.mesh.rotation.y += dt * 1.6; b.mesh.rotation.x += dt * 0.7;
      for (const k of this.karts) {
        if (k.respawnT > 0) continue;
        if (Math.abs(this.dDist(k.dist, b.s)) < 1.8 && Math.abs(k.d - b.d) < 1.8 && k.h < 3) {
          b.alive = false; b.t = 1.6; b.mesh.visible = false;
          for (let i = 0; i < 8; i++) this.particles.emit(b.mesh.position, new THREE.Vector3((Math.random() - 0.5) * 12, Math.random() * 10, (Math.random() - 0.5) * 12), [0xff7ad8, 0x7ad8ff, 0xffe07a][i % 3], 0.6, 1, 0.2, 12);
          if (!k.isRemote && !k.item && k.rollT <= 0 && !k.finished) this.rollItem(k);
          break;
        }
      }
    }
  }

  updateTraffic(dt) {
    for (const c of this.traffic) {
      c.dist += c.v * dt;
      this.placeOnTrack(c.mesh, c.dist, c.d, 0, c.v < 0 ? Math.PI : 0);
      for (const k of this.karts) {
        if (k.isRemote || k.respawnT > 0 || k.knockT > 0) continue;
        if (Math.abs(this.dDist(k.dist, c.dist)) < 2.8 && Math.abs(k.d - c.d) < 1.9 && k.h < 2) {
          if (k.starT > 0 || k.ufoT > 0) continue;
          this.hitKart(k, 'knock'); k.d += Math.sign(k.d - c.d || 1) * 1.5;
        }
      }
    }
  }

  collideKarts() {
    const ks = this.karts;
    for (let a = 0; a < ks.length; a++) for (let b = a + 1; b < ks.length; b++) {
      const A = ks[a], B = ks[b];
      if (A.respawnT > 0 || B.respawnT > 0) continue;
      const ds = this.dDist(A.dist, B.dist);
      if (Math.abs(ds) > 2.2) continue;
      const dd = A.d - B.d;
      if (Math.abs(dd) > 1.55 || Math.abs(A.h - B.h) > 1.6) continue;
      // 無敵
      const aInv = A.starT > 0 || A.ufoT > 0, bInv = B.starT > 0 || B.ufoT > 0;
      if (aInv && !bInv && !B.isRemote) { this.hitKart(B, 'knock'); continue; }
      if (bInv && !aInv && !A.isRemote) { this.hitKart(A, 'knock'); continue; }
      const wA = A.weight * (A.shrinkT > 0 ? 0.3 : 1), wB = B.weight * (B.shrinkT > 0 ? 0.3 : 1);
      if (A.shrinkT > 0 && B.shrinkT <= 0 && !A.isRemote && Math.abs(dd) < 1) { A.spinT = Math.max(A.spinT, 0.8); }
      if (B.shrinkT > 0 && A.shrinkT <= 0 && !B.isRemote && Math.abs(dd) < 1) { B.spinT = Math.max(B.spinT, 0.8); }
      const ov = 1.55 - Math.abs(dd);
      const sg = Math.sign(dd || (a - b));
      const tot = wA + wB;
      if (!A.isRemote) A.d += sg * ov * (wB / tot);
      if (!B.isRemote) B.d -= sg * ov * (wA / tot);
      if (Math.abs(ds) < 1.2) {
        if (!A.isRemote && ds < 0) A.v *= 0.985; if (!B.isRemote && ds > 0) B.v *= 0.985;
      }
      if ((A.isPlayer || B.isPlayer) && ov > 0.25) SND.play('wall');
    }
  }

  updateRanks() {
    const sorted = this.karts.slice().sort((a, b) => b.progress - a.progress);
    sorted.forEach((k, i) => k.rank = i);
    // ラバーバンド
    const humans = this.karts.filter(k => !k.isAI);
    const ref = humans.length ? humans.reduce((s, k) => s + k.dist, 0) / humans.length : 0;
    for (const k of this.karts) {
      if (!k.isAI) { k.rb = 1; continue; }
      const diff = ref - k.dist;
      k.rb = 1 + U.clamp(diff / 260, -0.09, 0.11);
    }
  }

  // ----- リモート -----
  remoteUpdate(k, dt) {
    const n = k.netT; if (!n) return;
    const L = this.track.L;
    let target = n.dist + n.v * Math.min(0.25, (performance.now() - n.at) / 1000);
    let diff = target - k.dist;
    if (Math.abs(diff) > 30) k.dist = target; else k.dist += diff * Math.min(1, dt * 10);
    k.d = U.damp(k.d, n.d, 10, dt); k.h = U.damp(k.h, n.h, 12, dt); k.yaw = U.damp(k.yaw, n.yaw, 10, dt); k.v = n.v;
    k.drift = n.dr; k.mt = n.mt; k.boostT = n.b ? 0.1 : 0; k.boostCol = n.bc || 1; k.starT = n.st ? 0.2 : 0; k.shrinkT = n.sh ? 0.2 : 0; k.ufoT = n.u ? 0.2 : 0;
    k.spinT = n.sp ? 0.2 : 0; k.knockT = n.kn ? 0.2 : 0; k.grounded = n.g; k.respawnT = n.rs ? 0.2 : 0;
    k.slide = U.damp(k.slide, k.drift * 0.42, 6, dt);
    k.input.steer = n.s || 0;
    if (n.fin && !k.finished) { k.finished = true; k.finishTime = n.ft; }
    k.lap = Math.floor(k.dist / L) + 1;
  }

  // ----- 見た目 -----
  visual(k, dt) {
    const tr = this.track, fr = tr.frame(k.dist, this.fr);
    const m = k.model;
    k.spinVis += (k.spinT > 0 ? 16 : 0) * dt; if (k.spinT <= 0) k.spinVis = U.damp(k.spinVis, Math.round(k.spinVis / (Math.PI * 2)) * Math.PI * 2, 8, dt);
    k.flipVis = k.knockT > 0 ? k.flipVis + 9 * dt : U.damp(k.flipVis, Math.round(k.flipVis / (Math.PI * 2)) * Math.PI * 2, 10, dt);
    const fy = k.yaw + k.slide + k.spinVis;
    const F = this.tmp.a.copy(fr.t).multiplyScalar(Math.cos(fy)).addScaledVector(fr.r, Math.sin(fy));
    const Lf = this.tmp.b.crossVectors(fr.u, F);
    this.tmp.m.makeBasis(Lf, fr.u, F);
    m.root.quaternion.setFromRotationMatrix(this.tmp.m);
    if (k.flipVis) m.root.rotateX(-k.flipVis);
    if (k.trick) m.root.rotateZ(k.trickT * 14);
    const lift = k.respawnT > 0 ? k.respawnT * 6 : 0;
    m.root.position.copy(fr.p).addScaledVector(fr.r, k.d).addScaledVector(fr.u, k.h + lift + (k.ufoT > 0 ? 0 : 0));
    const sc = k.shrinkT > 0 ? 0.5 : 1;
    m.root.scale.setScalar(U.damp(m.root.scale.x, sc, 8, dt));
    m.root.visible = !(k.respawnT > 0 && Math.floor(this.time * 15) % 2);
    // 影
    const so = tr.lerpArr(tr.off, k.dist);
    const gap = tr.flagAt(k.dist) & 1;
    k.shadow.visible = !gap && !k.offEdge;
    k.shadow.position.copy(fr.p).addScaledVector(fr.r, k.d).addScaledVector(fr.u, so + 0.05);
    this.tmp.m.makeBasis(fr.r, fr.t, fr.u); k.shadow.quaternion.setFromRotationMatrix(this.tmp.m);
    const shs = Math.max(0.3, 1 - (k.h - so) * 0.08) * sc; k.shadow.scale.set(shs, shs, shs);
    // ホイール
    k.wheelRot += k.v * dt / 0.32;
    k.steerVis = U.damp(k.steerVis, k.input.steer || 0, 10, dt);
    for (const w of m.kart.wheels) { w.tire.parent.rotation.x = k.wheelRot; if (w.front) w.g.rotation.y = -k.steerVis * 0.45; }
    m.drv.rotation.z = -k.steerVis * 0.18;
    m.anim(this.time + k.id.length);
    // ブースト炎
    const bc = k.ufoT > 0 ? 0x7dffb0 : k.starT > 0 ? 0xffe060 : MT_COL[Math.max(1, k.boostCol)];
    for (const f of m.kart.flames) { f.visible = k.boostT > 0 || k.ufoT > 0; f.material.color.setHex(bc); f.scale.set(1, 1 + Math.random() * 0.8, 1); }
    // 無敵
    k.glow.visible = k.starT > 0;
    if (k.starT > 0) { k.glow.position.copy(m.root.position).addScaledVector(fr.u, 1); k.glow.material.color.setHSL((this.time * 2) % 1, 1, 0.6); }
    // UFO
    if (k.ufoT > 0 && (k.isPlayer || !this.ufoMesh.userData.owner || this.ufoMesh.userData.owner === k.id)) {
      this.ufoMesh.visible = true; this.ufoMesh.userData.owner = k.id;
      this.ufoMesh.position.copy(m.root.position).addScaledVector(fr.u, 4.2); this.ufoMesh.quaternion.copy(m.root.quaternion); this.ufoMesh.rotateY(this.time * 4);
    } else if (this.ufoMesh.userData.owner === k.id) { this.ufoMesh.visible = false; this.ufoMesh.userData.owner = null; }
    // ドリフト火花
    if (k.drift && k.grounded && Math.random() < 0.8) {
      const col = MT_COL[k.mt];
      for (const sd of [-1, 1]) {
        const p = this.tmp.c.copy(m.root.position).addScaledVector(F, -1.0).addScaledVector(Lf, sd * 0.8).addScaledVector(fr.u, 0.2);
        const vel = new THREE.Vector3().copy(F).multiplyScalar(-4).addScaledVector(fr.u, 3 + Math.random() * 3).addScaledVector(Lf, (Math.random() - 0.5) * 4);
        this.particles.emit(p, vel, col, 0.25, k.mt ? 0.9 : 0.5, 0.1, 10);
      }
    }
    if (k.boostT > 0 && Math.random() < 0.6) {
      const p = this.tmp.c.copy(m.root.position).addScaledVector(F, -1.7).addScaledVector(fr.u, 0.5);
      this.particles.emit(p, new THREE.Vector3().copy(F).multiplyScalar(-6), bc, 0.25, 1.2, 0.2, 0);
    }
    if (k.starT > 0 && Math.random() < 0.4) this.particles.emit(m.root.position.clone().addScaledVector(fr.u, 1 + Math.random()), new THREE.Vector3((Math.random() - 0.5) * 6, 3, (Math.random() - 0.5) * 6), 0xffffff, 0.4, 0.7, 0.1, 0);
  }

  spark(k, col, n) {
    const pos = k.model.root.position;
    for (let i = 0; i < n; i++) this.particles.emit(pos, new THREE.Vector3((Math.random() - 0.5) * 12, Math.random() * 8, (Math.random() - 0.5) * 12), col, 0.4, 0.8, 0.1, 15);
  }
  dust(k, col) {
    const p = k.model.root.position.clone();
    this.particles.emit(p, new THREE.Vector3((Math.random() - 0.5) * 3, 2 + Math.random() * 2, (Math.random() - 0.5) * 3), col, 0.6, 1.0, 2.5, 0, false);
  }
  bubble(k) {
    const p = k.model.root.position.clone(); p.y += 1;
    this.particles.emit(p, new THREE.Vector3((Math.random() - 0.5) * 2, 4 + Math.random() * 3, (Math.random() - 0.5) * 2), 0xbfe8ff, 1.2, 0.4, 0.8, -1);
  }

  // ----- カメラ -----
  updateCamera(dt) {
    const k = this.player || this.karts[0];
    if (!k) return;
    const fr = this.track.frame(k.dist, this.fr);
    const fy = k.yaw + k.slide * 0.35 + (k.spinT > 0 ? 0 : 0);
    const F = new THREE.Vector3().copy(fr.t).multiplyScalar(Math.cos(fy)).addScaledVector(fr.r, Math.sin(fy));
    const kp = k.model.root.position;
    const look = Input.st.look;
    const back = look ? -1 : 1;
    const dist = (innerWidth < innerHeight ? 6.4 : 5.7) + Math.min(1.3, Math.max(0, k.v) * 0.012) + (k.boostT > 0 ? 0.6 : 0);
    const want = new THREE.Vector3().copy(kp).addScaledVector(F, -dist * back).addScaledVector(fr.u, 2.35 + (this.started ? 0 : 0.6));
    const lookAt = new THREE.Vector3().copy(kp).addScaledVector(F, 3.5 * back).addScaledVector(fr.u, 1.1);
    if (!this.camInit || look !== this.lastLook) { this.camPos.copy(want); this.camUp.copy(fr.u); this.camLook.copy(lookAt); this.camInit = true; this.lastLook = look; }
    const kk = 1 - Math.exp(-dt * 9);
    this.camPos.lerp(want, kk); this.camLook.lerp(lookAt, 1 - Math.exp(-dt * 16));
    this.camUp.lerp(fr.u, 1 - Math.exp(-dt * 5)).normalize();
    const c = this.camera;
    c.position.copy(this.camPos);
    if (HUD.shakeT > 0) c.position.add(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(HUD.shakeT * 0.8));
    c.up.copy(this.camUp); c.lookAt(this.camLook);
    const port = innerWidth < innerHeight;
    const fov = (port ? 84 : 68) + Math.min(14, Math.max(0, k.v) * 0.16) + (k.boostT > 0 ? 6 : 0);
    c.fov = U.damp(c.fov, fov, 4, dt); c.updateProjectionMatrix();
    // 水中/トンネル演出
    const def = this.def, sc = this.scene;
    if (def.water != null && c.position.y < def.water) { sc.fog.color.setHex(0x1a6aa8); sc.fog.near = 5; sc.fog.far = 160; }
    else { sc.fog.color.copy(this.baseFog.c); sc.fog.near = this.baseFog.near; sc.fog.far = this.baseFog.far; }
    if (this.track.sky) this.track.sky.position.copy(c.position);
  }

  render() {
    if (!this.scene) return;
    this.renderer.render(this.scene, this.camera);
  }
}

// ---------- HUD ----------
const HUD = {
  el: {}, shakeT: 0, msgT: 0,
  init() {
    for (const id of ['hud', 'hpos', 'hlap', 'htime', 'hitem', 'hitemi', 'hitemn', 'hspeed', 'hmsg', 'hmap', 'hink', 'hflash', 'hlines', 'hmt']) this.el[id] = document.getElementById(id);
    this.mapCtx = this.el.hmap.getContext('2d');
  },
  setup(g) {
    this.el.hud.style.display = 'block';
    const tr = g.track, b = tr.bounds;
    const W = 170, pad = 10;
    const sx = (W - pad * 2) / Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    this.map = { sx, ox: pad + ((W - pad * 2) - (b.maxX - b.minX) * sx) / 2 - b.minX * sx, oz: pad + ((W - pad * 2) - (b.maxZ - b.minZ) * sx) / 2 - b.minZ * sx };
    const cv = document.createElement('canvas'); cv.width = cv.height = W;
    const c = cv.getContext('2d');
    c.lineCap = c.lineJoin = 'round';
    for (const [w, col] of [[9, 'rgba(0,0,0,0.35)'], [5, 'rgba(255,255,255,0.95)']]) {
      c.strokeStyle = col; c.lineWidth = w; c.beginPath();
      for (let j = 0; j <= tr.N; j += 3) { const q = j % tr.N; const x = tr.P[q * 3] * sx + this.map.ox, y = tr.P[q * 3 + 2] * sx + this.map.oz; j ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.closePath(); c.stroke();
    }
    this.mapBg = cv;
    this.el.hink.style.opacity = 0;
  },
  hide() { this.el.hud.style.display = 'none'; },
  msg(t, dur, cls) { const e = this.el.hmsg; e.textContent = t; e.className = 'show ' + (cls || ''); this.msgT = dur; },
  shake(a) { this.shakeT = Math.max(this.shakeT, a); },
  flash() { const e = this.el.hflash; e.style.transition = 'none'; e.style.opacity = 0.9; requestAnimationFrame(() => { e.style.transition = 'opacity 0.8s'; e.style.opacity = 0; }); },
  ink() { const e = this.el.hink; e.style.transition = 'none'; e.style.opacity = 1; setTimeout(() => { e.style.transition = 'opacity 2.5s'; e.style.opacity = 0; }, 2000); },
  fmt(t) { if (t < 0) t = 0; const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + s.toFixed(3).padStart(6, '0'); },
  update(g, dt) {
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) this.el.hmsg.className = ''; }
    const k = g.player; if (!k) return;
    this.el.hpos.innerHTML = (k.rank + 1) + '<small>位</small>';
    this.el.hpos.className = 'r' + Math.min(k.rank + 1, 4);
    this.el.hlap.textContent = 'LAP ' + U.clamp(k.lap, 1, g.laps) + '/' + g.laps;
    this.el.htime.textContent = this.fmt(k.finished ? k.finishTime : g.raceT);
    this.el.hspeed.innerHTML = Math.round(Math.abs(k.v) * 3.6) + '<small>km/h</small>';
    if (k.rollT > 0) { const keys = Object.keys(ITEMS); this.el.hitemi.textContent = ITEMS[keys[Math.floor(g.time * 14) % keys.length]].icon; this.el.hitemn.textContent = ''; }
    else if (k.item) { this.el.hitemi.textContent = ITEMS[k.item].icon; this.el.hitemn.textContent = k.itemN > 1 ? '×' + k.itemN : ''; }
    else { this.el.hitemi.textContent = ''; this.el.hitemn.textContent = ''; }
    this.el.hlines.style.opacity = k.boostT > 0 || k.ufoT > 0 ? 1 : Math.max(0, (k.v - k.vmax * 0.95) / (k.vmax * 0.2));
    this.el.hmt.style.background = k.drift ? '#' + MT_COL[k.mt].toString(16).padStart(6, '0') : 'transparent';
    this.el.hmt.style.width = k.drift ? Math.min(100, k.driftCharge / 3 * 100) + '%' : '0';
    // ミニマップ
    const c = this.mapCtx, mp = this.map;
    c.clearRect(0, 0, 170, 170); c.drawImage(this.mapBg, 0, 0);
    const sorted = g.karts.slice().sort((a, b) => (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0));
    for (const o of sorted) {
      const p = o.model.root.position;
      const x = p.x * mp.sx + mp.ox, y = p.z * mp.sx + mp.oz;
      c.fillStyle = '#' + o.ch.color.toString(16).padStart(6, '0');
      c.strokeStyle = o.isPlayer ? '#ff2a5a' : o.isRemote ? '#2a8aff' : '#222';
      c.lineWidth = o.isPlayer ? 3 : 1.5;
      c.beginPath(); c.arc(x, y, o.isPlayer ? 6 : 4, 0, 7); c.fill(); c.stroke();
    }
  },
};
