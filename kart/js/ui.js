// ===== メニュー / 画面遷移 =====
let GAME = null;
const UI = {
  sel: { mode: 'gp', cc: 150, ch: 'kunekune', cup: 0, course: 'garden' },
  gp: null,
  store: {
    get(k, d) { try { const v = localStorage.getItem('kkart_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('kkart_' + k, JSON.stringify(v)); } catch (e) { } },
  },
  $(id) { return document.getElementById(id); },
  show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
    if (id) this.$(id).classList.add('on');
    this.cur = id;
  },
  init() {
    this.sel.ch = this.store.get('ch', 'kunekune');
    Input.autoAccel = this.store.get('auto', U.isTouch);
    Input.sens = this.store.get('sens', 0.85);
    Input.gyroOn = this.store.get('gyro', true);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.$('cv'), antialias: !U.isTouch, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, U.isTouch ? 1.5 : 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 0.82;
    addEventListener('resize', () => {
      this.renderer.setSize(innerWidth, innerHeight);
      if (GAME && GAME.camera) { GAME.camera.aspect = innerWidth / innerHeight; GAME.camera.updateProjectionMatrix(); }
      if (this.menuCam) { this.menuCam.aspect = innerWidth / innerHeight; this.menuCam.updateProjectionMatrix(); }
    });
    GAME = new Game(this.renderer);
    HUD.init(); Input.init();
    this.buildMenuScene();
    this.makeThumbs();
    this.bind();
    this.show('s-title');
    let last = performance.now();
    const loop = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const racing = GAME.running && !this.cur; if (racing !== this._racingCls) { this._racingCls = racing; document.body.classList.toggle('racing', racing); }
      if (GAME.running) {
        if (GAME.cfg.waitGo) GAME.raceT = -4;
        GAME.update(dt); GAME.render();
        if (!GAME.paused && !this.cur && (Input.keys.Escape || Input.keys.KeyP)) { Input.keys.Escape = Input.keys.KeyP = false; this.pause(); }
      } else this.menuRender(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => { if (document.hidden && GAME.running && !GAME.paused && !(NET.active)) this.pause(); });
  },

  // ---- メニュー背景 ----
  buildMenuScene() {
    const s = new THREE.Scene();
    // 夕焼けの空
    const sg = new THREE.SphereGeometry(400, 32, 16), cols = [], top = new THREE.Color(0x3a7ae8), mid = new THREE.Color(0x9ac8ff), bot = new THREE.Color(0xffd8a8);
    const sp = sg.attributes.position;
    for (let i = 0; i < sp.count; i++) { const y = sp.getY(i) / 400; const c = y > 0.15 ? mid.clone().lerp(top, Math.min(1, (y - 0.15) / 0.6)) : bot.clone().lerp(mid, U.clamp((y + 0.05) / 0.2, 0, 1)); cols.push(c.r, c.g, c.b); }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    s.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })));
    s.fog = new THREE.Fog(0xffe2c0, 160, 480);
    s.add(new THREE.HemisphereLight(0xcfe4ff, 0x4a6a2a, 0.55));
    const sun = new THREE.DirectionalLight(0xffe2b8, 1.7); sun.position.set(30, 45, 20); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 5, far: 150 }); sun.shadow.bias = -0.0008; s.add(sun);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: 0xfff0c0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); glow.position.set(150, 70, 100); glow.scale.set(120, 120, 1); s.add(glow);
    // 島
    const gt = U.surfTex('meadow').clone(); gt.needsUpdate = true; gt.repeat.set(14, 14);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 64), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
    const tt = U.surfTex('gravel').clone(); tt.needsUpdate = true; tt.repeat.set(10, 1);
    const ring = new THREE.Mesh(new THREE.RingGeometry(9, 13.6, 96, 1), new THREE.MeshStandardMaterial({ map: tt, roughness: 1 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; ring.receiveShadow = true; s.add(ring);
    for (const r of [8.8, 13.8]) { const c = new THREE.Mesh(new THREE.TorusGeometry(r, 0.18, 6, 96), U.mat(0xffffff)); c.rotation.x = Math.PI / 2; c.position.y = 0.08; s.add(c); }
    // 台座
    const ped = new THREE.Group(); s.add(ped);
    const pb = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.7, 0.7, 48), U.mat(0xfff8ee, { r: 0.35 })); pb.position.y = 0.35; pb.castShadow = pb.receiveShadow = true; ped.add(pb);
    const pr = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.1, 8, 64), U.mat(0xff6a8a, { e: 0xff3a6a, ei: 0.9 })); pr.rotation.x = Math.PI / 2; pr.position.y = 0.72; ped.add(pr);
    // 木・キノコ・遠くの山
    const rng = U.rng(9), m4 = new THREE.Matrix4();
    const place = (type, n, r0, r1, s0, s1) => {
      const parts = DECO[type](), mats = [];
      for (let i = 0; i < n; i++) { const a = rng() * 6.28, r = r0 + rng() * (r1 - r0), k = s0 + rng() * (s1 - s0); mats.push(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * 6.28), new THREE.Vector3(k, k, k))); }
      for (const part of parts) { const im = new THREE.InstancedMesh(part.geo, part.mat, n); mats.forEach((mm, i) => { m4.multiplyMatrices(mm, part.m); im.setMatrixAt(i, m4); }); im.castShadow = true; s.add(im); }
    };
    place('tree', 22, 17, 40, 0.8, 1.4); place('round', 14, 16, 36, 0.8, 1.3); place('mushroom', 9, 15.5, 26, 0.45, 0.8); place('flowerclump', 40, 14.5, 30, 0.8, 1.3); place('rock', 10, 15, 32, 0.6, 1.1);
    place('mountain', 10, 120, 170, 0.8, 1.3);
    for (let i = 0; i < 9; i++) { const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: SCN_TEX.cloud(), transparent: true, opacity: 0.95, depthWrite: false, fog: false })); const a = rng() * 6.28, r = 90 + rng() * 120; c.position.set(Math.cos(a) * r, 40 + rng() * 40, Math.sin(a) * r); const w = 50 + rng() * 60; c.scale.set(w, w * 0.5, 1); s.add(c); }
    // 周回するライバルたち
    this.menuRacers = [];
    const pool = CHARS.slice().sort(() => Math.random() - 0.5).slice(0, 4);
    pool.forEach((ch, i) => {
      const m = buildRacerModel(ch); m.root.traverse(o => { if (o.isMesh) o.castShadow = true; }); s.add(m.root);
      this.menuRacers.push({ m, a: i * Math.PI / 2, r: 10.3 + (i % 2) * 2, v: 0.42 + i * 0.035, wob: rng() * 6 });
    });
    this.menuScene = s; this.menuPed = ped;
    this.menuCam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 900);
    this.menuT = 0;
    this.setMenuChar(this.sel.ch);
    // タイトル：タップでスタート
    this.$('tPress').addEventListener('click', () => this.titleStart());
  },
  titleStart() {
    SND.init(); SND.play('title');
    this.$('s-title').classList.add('menu-on');
    this.titleMusic();
    if (this.gyroStart) this.gyroStart();
  },
  titleMusic() { if (!GAME.running && SND.ctx) { SND.startBGM({ bpm: 126, root: 62, scale: 'major', seed: 5 }); } },
  setMenuChar(id) {
    if (this.menuModel) this.menuPed.remove(this.menuModel.root);
    const ch = CHARS.find(c => c.id === id) || CHARS[0];
    this.menuModel = buildRacerModel(ch);
    this.menuModel.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.menuModel.root.position.y = 0.72; this.menuModel.root.scale.setScalar(1.25);
    this.menuPed.add(this.menuModel.root);
  },
  menuRender(dt) {
    this.menuT += dt; const t = this.menuT;
    if (this.menuModel) { this.menuModel.root.rotation.y = t * 0.8; this.menuModel.anim(t); }
    for (const R of this.menuRacers) {
      R.a += R.v * dt * (1 + 0.15 * Math.sin(t * 0.7 + R.wob));
      const x = Math.cos(R.a) * R.r, z = Math.sin(R.a) * R.r;
      R.m.root.position.set(x, 0.02, z); R.m.root.rotation.y = -R.a + Math.PI;
      R.m.root.rotateZ(-0.12);
      for (const w of R.m.kart.wheels) w.g.rotation.x += R.v * R.r * dt / 0.32;
      R.m.anim(t + R.wob);
      const fl = R.m.kart.flames; const boost = Math.sin(t * 0.9 + R.wob) > 0.85; fl.forEach(f => { f.visible = boost; f.scale.y = 1 + Math.random() * 0.8; });
    }
    const wide = innerWidth > innerHeight, cur = this.cur, c = this.menuCam;
    if (cur === 's-char') {
      const side = wide ? 3.6 : 0;
      c.position.set(side, wide ? 3.6 : 4.6, wide ? 9.5 : 13); c.lookAt(side, wide ? 1.7 : -0.4, 0);
    } else {
      const a = t * 0.07 + 0.6, r = wide ? 30 : 38, h = wide ? 10 : 14;
      c.position.set(Math.cos(a) * r, h, Math.sin(a) * r);
      const lx = wide && cur === 's-title' ? 4 : 0;
      c.lookAt(Math.cos(a + Math.PI / 2) * lx, 2.4, Math.sin(a + Math.PI / 2) * lx);
    }
    this.renderer.render(this.menuScene, c);
  },
  makeThumbs() {
    const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
    r.setSize(160, 160); r.outputEncoding = THREE.sRGBEncoding;
    const s = new THREE.Scene();
    s.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.0));
    const d = new THREE.DirectionalLight(0xffffff, 0.8); d.position.set(4, 8, 6); s.add(d);
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50); cam.position.set(2.2, 2.4, 4.6); cam.lookAt(0, 0.9, 0);
    this.thumbs = {};
    for (const ch of CHARS) {
      const m = buildRacerModel(ch); m.root.rotation.y = 0.5; m.anim(0.3); s.add(m.root);
      r.render(s, cam); this.thumbs[ch.id] = r.domElement.toDataURL();
      s.remove(m.root);
    }
    r.dispose(); try { r.forceContextLoss(); } catch (e) { }
  },

  // ---- ボタン ----
  bind() {
    const on = (id, f) => this.$(id).addEventListener('click', (e) => { SND.init(); SND.play('select'); f(e); });
    document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
      SND.init(); SND.play('select'); this.gyroStart();
      this.sel.mode = b.dataset.mode;
      if (this.sel.mode === 'online' || this.sel.mode === 'battle') { this.sel.cc = 150; this.openChar(); return; }
      this.openCC();
    }));
    document.querySelectorAll('[data-cc]').forEach(b => b.addEventListener('click', () => { SND.play('select'); this.sel.cc = +b.dataset.cc; this.openChar(); }));
    document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { SND.init(); SND.play('back'); this.back(b.dataset.back); }));
    on('btnChar', () => { this.store.set('ch', this.sel.ch); if (this.sel.mode === 'online') this.openOnline(); else if (this.sel.mode === 'battle') this.openArena(); else this.openCourse(); });
    on('btnHelp', () => this.show('s-help'));
    on('btnSet', () => this.openSettings());
    // 感度・ジャイロ（設定画面とポーズ画面の両方）
    document.querySelectorAll('.tune .sens').forEach(r => {
      r.value = Input.sens;
      r.addEventListener('input', () => { Input.sens = +r.value; this.store.set('sens', Input.sens); this.syncTune(); });
    });
    document.querySelectorAll('.tune .gyro').forEach(b => b.addEventListener('click', () => {
      SND.play('select'); Input.gyroOn = !Input.gyroOn; this.store.set('gyro', Input.gyroOn);
      if (Input.gyroOn) this.gyroStart(); this.syncTune();
    }));
    this.syncTune();
    on('optAuto', () => { Input.autoAccel = !Input.autoAccel; this.store.set('auto', Input.autoAccel); this.openSettings(); });
    on('resNext', () => this.resultsNext());
    on('resRetry', () => this.retry());
    on('resQuit', () => this.quit());
    on('pResume', () => this.resume());
    on('pRetry', () => { this.resume(); this.retry(); });
    on('pQuit', () => { this.resume(); this.quit(); });
    on('btnPause', () => this.pause());
    on('netHost', () => this.netHost());
    on('netJoin', () => this.netJoin());
    on('netGo', () => this.netGo());
    on('netCopy', () => { try { navigator.clipboard.writeText(NET.code || ''); NET.status('コードをコピーしました：' + NET.code); } catch (e) { } });
    // ===== iPhone操作 =====
    // 左手：ハンドル（親指を置いた所が中心。そこから左右に動かした分だけ切れる）
    // 右手：ドリフト／アイテム／ブレーキの3ボタン
    this._stick = null;
    const active = () => GAME.running && !GAME.paused && !this.cur;
    const stickUpd = () => {
      const st = this._stick, ring = this.$('tstick'), knob = this.$('tknob');
      this.$('tpad').style.opacity = st ? 0 : '';
      if (!st) { Input.touch.ax = null; ring.classList.remove('on'); knob.style.transform = 'translate(-50%,-50%)'; return; }
      const range = 70 / Input.sens;
      let v = U.clamp((st.x - st.ox) / range, -1, 1);
      const dead = 0.06; v = Math.abs(v) < dead ? 0 : Math.sign(v) * (Math.abs(v) - dead) / (1 - dead);
      Input.touch.ax = Math.sign(v) * Math.min(1, Math.pow(Math.abs(v), 1.35));
      ring.classList.add('on'); ring.style.left = st.ox + 'px'; ring.style.top = st.oy + 'px';
      knob.style.transform = `translate(calc(-50% + ${U.clamp(st.x - st.ox, -range, range)}px),-50%) rotate(${Input.touch.ax * 40}deg)`;
    };
    const tstart = (e) => {
      if (!active()) return;
      if (e.target.closest && e.target.closest('.tbtn,#hitem,#btnPause')) return;
      SND.init();
      for (const t of e.changedTouches) {
        if (!this._stick && t.clientX < innerWidth * 0.6) this._stick = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX };
      }
      stickUpd(); this.$('thint').style.opacity = 0; e.preventDefault();
    };
    const tmove = (e) => { if (!this._stick) return; for (const t of e.changedTouches) if (t.identifier === this._stick.id) this._stick.x = t.clientX; stickUpd(); };
    const tend = (e) => { for (const t of e.changedTouches) if (this._stick && t.identifier === this._stick.id) this._stick = null; stickUpd(); };
    document.addEventListener('touchstart', tstart, { passive: false });
    document.addEventListener('touchmove', tmove, { passive: true });
    document.addEventListener('touchend', tend); document.addEventListener('touchcancel', tend);
    // 右手ボタン（同時押しOK）
    const btn = (id, key, pulse) => {
      const el = this.$(id); const ids = new Set();
      const set = () => { const on = ids.size > 0; el.classList.toggle('on', on); if (!pulse) Input.touch[key] = on; };
      el.addEventListener('touchstart', (e) => { e.preventDefault(); SND.init(); for (const t of e.changedTouches) ids.add(t.identifier); if (pulse) { Input.touch[key] = true; setTimeout(() => Input.touch[key] = false, 120); } set(); this.$('thint').style.opacity = 0; }, { passive: false });
      const up = (e) => { for (const t of e.changedTouches) ids.delete(t.identifier); set(); };
      el.addEventListener('touchend', up); el.addEventListener('touchcancel', up);
      el.addEventListener('mousedown', () => { ids.add('m'); if (pulse) { Input.touch[key] = true; setTimeout(() => Input.touch[key] = false, 120); } set(); });
      el.addEventListener('mouseup', () => { ids.delete('m'); set(); }); el.addEventListener('mouseleave', () => { ids.delete('m'); set(); });
    };
    btn('bDrift', 'drift'); btn('bItem', 'item', true); btn('bBrake', 'b'); btn('bJump', 'jump'); btn('bMagic', 'magic', true);
    this.$('hmagic').addEventListener('mousedown', () => { Input.touch.magic = true; setTimeout(() => Input.touch.magic = false, 120); });
    const itemTap = (e) => { e.preventDefault(); Input.touch.item = true; setTimeout(() => Input.touch.item = false, 120); };
    this.$('hitem').addEventListener('touchstart', itemTap, { passive: false });
    this.$('hitem').addEventListener('mousedown', itemTap);
    this.$('touch').style.display = U.isTouch ? 'block' : 'none';
    if (U.isTouch) document.body.classList.add('touch');
    document.addEventListener('keydown', (e) => {
      if (!GAME.running && this.cur && (e.code === 'Escape' || e.code === 'Backspace')) {
        const b = document.querySelector('#' + this.cur + ' [data-back]'); if (b) b.click();
      }
    });
  },
  back(to) {
    if (to === 'title') { NET.leave(); this.show('s-title'); this.titleMusic(); }
    else this.show(to);
  },
  syncTune() {
    const lab = Input.sens < 0.7 ? 'おだやか' : Input.sens < 0.95 ? 'ふつう' : Input.sens < 1.25 ? 'やや鋭い' : 'クイック';
    document.querySelectorAll('.tune .sens').forEach(r => { if (+r.value !== Input.sens) r.value = Input.sens; });
    document.querySelectorAll('.tune .sensv').forEach(e => e.textContent = lab + '（' + Math.round(Input.sens * 100) + '）');
    document.querySelectorAll('.tune .gyro').forEach(b => b.textContent = '📱 傾けて曲がる：' + (Input.gyroOn ? 'ON' : 'OFF'));
    const st = !Input.gyroOn ? '' : Input.gyroLive ? '傾きを検出中。レース開始時の持ち方がまっすぐになります' : U.isTouch ? 'この画面では傾きが届いていません（ブラウザで直接開くと使えます）' : 'スマホで使えます';
    document.querySelectorAll('.tune .gyros').forEach(e => e.textContent = st);
  },
  // ジャイロ：iPhoneは許可が必要（タップ時に要求）
  gyroStart() {
    if (!Input.gyroOn || this.gyroBound) return;
    const bind = () => {
      if (this.gyroBound) return; this.gyroBound = true;
      // 画面の面内で重力がどちら向きか＝ハンドルの回転角（持ち方・iOS/Androidの符号差に関係なく、開始時を基準に差分を取る）
      let gx = 0, gy = 0, init = false;
      addEventListener('devicemotion', (e) => {
        const g = e.accelerationIncludingGravity; if (!g || g.x == null || g.y == null) return;
        if (!init) { gx = g.x; gy = g.y; init = true; } else { gx += (g.x - gx) * 0.25; gy += (g.y - gy) * 0.25; }
        if (!Input.gyroLive) { Input.gyroLive = true; this.syncTune(); }
        if (Math.hypot(gx, gy) < 2.5) { Input.tilt = 0; return; }   // 平置き：無効
        const a = Math.atan2(gy, gx) * 180 / Math.PI;
        if (Input.gyroZero == null) Input.gyroZero = a;
        let d = a - Input.gyroZero;
        if (d > 180) d -= 360; if (d < -180) d += 360;
        d = Math.abs(d) < 3 ? 0 : d - Math.sign(d) * 3;            // 3°の遊び
        Input.tilt = U.clamp(d / 28, -1, 1) * 0.55;                 // 「やや」曲がる：最大55%
      });
    };
    try {
      const D = window.DeviceMotionEvent;
      if (D && typeof D.requestPermission === 'function') D.requestPermission().then(r => { if (r === 'granted' || !/iPhone|iPad|iPod/.test(navigator.userAgent)) bind(); else { Input.gyroOn = false; this.store.set('gyro', false); this.syncTune(); } }).catch(() => bind());
      else if (D) bind();
    } catch (e) { }
  },
  openSettings() {
    this.$('optAuto').textContent = 'オートアクセル：' + (Input.autoAccel ? 'ON' : 'OFF');
    this.show('s-set');
  },
  openCC() { this.show('s-cc'); },
  openChar() {
    const g = this.$('charGrid'); g.innerHTML = '';
    for (const ch of CHARS) {
      const d = document.createElement('button');
      d.className = 'cc' + (ch.id === this.sel.ch ? ' sel' : '');
      d.innerHTML = `<img src="${this.thumbs[ch.id]}" alt=""><span>${ch.name}</span>${ch.rare ? '<em class="rare">RARE</em>' : ''}`;
      if (ch.rare) d.classList.add('rarecard');
      d.onclick = () => { SND.play('select'); this.sel.ch = ch.id; g.querySelectorAll('.cc').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); this.charInfo(); this.setMenuChar(ch.id); };
      g.appendChild(d);
    }
    this.charInfo(); this.setMenuChar(this.sel.ch);
    this.show('s-char');
  },
  charInfo() {
    const ch = CHARS.find(c => c.id === this.sel.ch);
    const lab = ['スピード', '加速', 'ハンドル', '重さ'];
    const M = MAGIC[ch.id];
    this.$('charInfo').innerHTML = `<h3>${ch.name}${ch.rare ? ' <em class="rare">★RARE</em>' : ''}</h3><p>${ch.desc}</p><p class="cmagic">✨ 魔法「${M.name}」<br><small>${M.desc}</small></p>` + ch.st.map((v, i) => `<div class="bar"><label>${lab[i]}</label><i><b style="width:${v * 20}%"></b></i></div>`).join('');
  },
  courseThumb(def) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 120;
    const c = cv.getContext('2d');
    const r = turtle(def); const p = r.pts;
    let a = 1e9, b = -1e9, e = 1e9, f = -1e9;
    p.forEach(q => { a = Math.min(a, q.x); b = Math.max(b, q.x); e = Math.min(e, q.z); f = Math.max(f, q.z); });
    const s = 100 / Math.max(b - a, f - e);
    c.lineWidth = 5; c.lineJoin = 'round'; c.strokeStyle = U.hex(def.theme.skyTop);
    const X = (q) => 10 + (q.x - a) * s + (100 - (b - a) * s) / 2, Y = (q) => 10 + (q.z - e) * s + (100 - (f - e) * s) / 2;
    c.beginPath(); p.forEach((q, i) => { i ? c.lineTo(X(q), Y(q)) : c.moveTo(X(q), Y(q)); }); if (!def.open) c.closePath(); c.stroke();
    if (def.open) { const q0 = p[0], q1 = p[p.length - 1]; c.fillStyle = '#2ab060'; c.beginPath(); c.arc(X(q0), Y(q0), 6, 0, 7); c.fill(); c.fillStyle = '#ff3a5a'; c.beginPath(); c.arc(X(q1), Y(q1), 6, 0, 7); c.fill(); }
    return cv.toDataURL();
  },
  openCourse() {
    const box = this.$('courseList'); box.innerHTML = '';
    this.$('courseTitle').textContent = this.sel.mode === 'gp' ? 'カップをえらぶ' : 'コースをえらぶ';
    CUPS.forEach((cup, ci) => {
      const sec = document.createElement('div'); sec.className = 'cup';
      const cs = COURSES.filter(c => c.cup === ci);
      if (this.sel.mode === 'gp') {
        const b = document.createElement('button'); b.className = 'cupbtn';
        b.innerHTML = `<div class="cupic">${cup.icon}</div><div><h3>${cup.name}</h3><p>${cs.map(c => c.name).join('・')}</p></div>`;
        b.onclick = () => { SND.play('select'); this.startGP(ci); };
        sec.appendChild(b);
      } else {
        sec.innerHTML = `<h4>${cup.icon} ${cup.name}</h4>`;
        const row = document.createElement('div'); row.className = 'crow';
        cs.forEach(c => {
          const b = document.createElement('button'); b.className = 'course';
          const best = this.store.get('tt_' + c.id + '_' + this.sel.cc, null);
          b.innerHTML = `<img src="${this.courseThumb(c)}" alt=""><b>${c.name}</b><small>${c.desc}</small>${this.sel.mode === 'tt' && best ? `<em>BEST ${HUD.fmt(best)}</em>` : ''}`;
          b.onclick = () => { SND.play('select'); this.sel.course = c.id; this.startRace(); };
          row.appendChild(b);
        });
        sec.appendChild(row);
      }
      box.appendChild(sec);
    });
    this.show('s-course');
  },

  openArena() {
    const box = this.$('courseList'); box.innerHTML = '';
    this.$('courseTitle').textContent = 'バトルステージをえらぶ';
    const section = (title, list) => {
      const sec = document.createElement('div'); sec.className = 'cup'; sec.innerHTML = `<h4>${title}</h4>`;
      const row = document.createElement('div'); row.className = 'crow';
      list.forEach(([id, def, sub]) => {
        const b = document.createElement('button'); b.className = 'course';
        b.innerHTML = `<img src="${this.courseThumb(def)}" alt=""><b>${def.name}</b><small>${sub}</small>`;
        b.onclick = () => { SND.play('select'); this.sel.course = id; this.startBattle(); };
        row.appendChild(b);
      });
      sec.appendChild(row); box.appendChild(sec);
    };
    section('🎈 バトル専用ステージ（大平原）', ARENAS.map(a => [a.id, a, a.n === 2 ? '往復の一本道・障害物あり' : '広い大自然・障害物あり']));
    section('🏁 レースコースで戦う（幅を広げた一本道）', COURSES.map(c => ['bc_' + c.id, c, '1.3km区間・両端は岩の壁']));
    this.show('s-course');
  },
  startBattle() {
    const racers = this.makeField(8).map((a, i) => Object.assign({ id: 'ai' + i }, a)).concat([{ ch: this.sel.ch, type: 'player', name: 'あなた', id: 'P' }]);
    this.launch(racers);
  },
  // ---- レース開始 ----
  makeField(n) {
    const others = CHARS.filter(c => c.id !== this.sel.ch && !c.rare).sort(() => Math.random() - 0.5).slice(0, n - 1);
    const ai = others.map((c, i) => ({ ch: c.id, type: 'ai', name: c.name, skill: (this.sel.cc === 200 ? 0.97 : 0.95) + (i / n) * 0.045 }));
    return ai;
  },
  startGP(cup) {
    const field = this.makeField(12);
    this.gp = { cup, race: 0, courses: COURSES.filter(c => c.cup === cup).map(c => c.id), pts: {}, field };
    this.gp.order = field.map(a => a.ch).concat(['P']);
    this.runGPRace();
  },
  runGPRace() {
    const g = this.gp;
    this.sel.course = g.courses[g.race];
    const order = g.order;
    const racers = order.map(id => id === 'P' ? { ch: this.sel.ch, type: 'player', name: 'あなた', id: 'P' } : Object.assign({ id: 'ai_' + id }, g.field.find(f => f.ch === id)));
    this.launch(racers);
  },
  startRace() {
    let racers;
    if (this.sel.mode === 'tt') racers = [{ ch: this.sel.ch, type: 'player', name: 'あなた', id: 'P' }];
    else racers = this.makeField(12).map((a, i) => Object.assign({ id: 'ai' + i }, a)).concat([{ ch: this.sel.ch, type: 'player', name: 'あなた', id: 'P' }]);
    this.launch(racers);
  },
  launch(racers, extra = {}) {
    SND.init();
    this.show(null);
    this.$('loading').classList.add('on');
    setTimeout(() => {
      GAME.setup(Object.assign({ course: this.sel.course, cc: this.sel.cc, racers, mode: this.sel.mode, laps: 3, onResults: (r) => this.showResults(r) }, extra));
      if (this.sel.mode === 'tt' && GAME.player) { GAME.player.item = 'karaage'; GAME.player.itemN = 3; }
      const inv = this.store.get('specials', []);
      if (inv.length && GAME.player && !['tt', 'online'].includes(this.sel.mode)) {
        const sp = inv.shift(); this.store.set('specials', inv);
        if (ITEMS[sp]) { GAME.player.item = sp; GAME.player.itemN = 1; setTimeout(() => HUD.toast(`🎁 スペシャル持ち込み：${ITEMS[sp].icon}${ITEMS[sp].name}`), 1500); }
      }
      this.$('loading').classList.remove('on');
      Input.gyroZero = null; Input.tilt = 0;
      this.$('btnPause').style.display = 'block'; this.$('thint').style.opacity = 1;
      if (extra.onReady) extra.onReady();
    }, 30);
  },
  pause() { if (!GAME.running) return; if (!NET.active) GAME.paused = true; this.show('s-pause'); this.$('pRetry').style.display = NET.active ? 'none' : ''; },
  resume() { GAME.paused = false; this.show(null); },
  quit() {
    GAME.dispose(); HUD.hide(); this.$('btnPause').style.display = 'none';
    if (NET.active) { NET.leave(); }
    this.gp = null; this.show('s-title'); this.titleMusic();
  },
  retry() {
    if (this.gp) { this.runGPRace(); return; }
    const racers = GAME.cfg.racers; this.launch(racers);
  },

  // ---- 結果 ----
  showResults(res) {
    const g = this.gp;
    const tbody = this.$('resBody');
    const pts = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const render = () => {
      const r = GAME.running ? GAME.results() : res;
      tbody.innerHTML = r.map((x, i) => `<tr class="${x.k.isPlayer ? 'me' : ''}"><td>${i + 1}</td><td><img src="${this.thumbs[x.k.ch.id]}"></td><td>${x.k.isPlayer ? 'あなた' : x.k.name}</td><td>${x.battle ? (x.k.out ? '脱落' : '🎈×' + x.t) : x.est ? '<span class="est">走行中</span>' : HUD.fmt(x.t)}</td>${g ? `<td>+${pts[i] || 0}</td>` : ''}</tr>`).join('');
    };
    render();
    if (NET.active) { clearInterval(this.resTimer); this.resTimer = setInterval(() => { if (this.cur === 's-results') render(); else clearInterval(this.resTimer); }, 1000); }
    const me = res.findIndex(x => x.k.isPlayer);
    let prize = '';
    if (me === 0 && !['tt', 'online'].includes(this.sel.mode) && !this.awarded) {
      const sp = SPECIALS[Math.floor(Math.random() * SPECIALS.length)];
      const inv = this.store.get('specials', []); inv.push(sp); this.store.set('specials', inv.slice(-5));
      prize = `🎁 スペシャル「${ITEMS[sp].icon}${ITEMS[sp].name}」ゲット！（${ITEMS[sp].line}）次の試合で使えます`;
    }
    this.$('resPrize').textContent = prize;
    this.$('resTitle').textContent = this.sel.mode === 'tt' ? 'タイムアタック' : (me + 1) + '位 ' + (me === 0 ? '🏆 優勝！' : me < 3 ? '🎉 表彰台！' : 'おつかれさま！');
    if (this.sel.mode === 'tt' && GAME.player) {
      const key = 'tt_' + this.sel.course + '_' + this.sel.cc;
      const best = this.store.get(key, null); const t = GAME.player.finishTime;
      if (!best || t < best) { this.store.set(key, t); this.$('resTitle').textContent = '新記録！ ' + HUD.fmt(t); }
      else this.$('resTitle').textContent = HUD.fmt(t) + '（ベスト ' + HUD.fmt(best) + '）';
    }
    if (g) {
      res.forEach((x, i) => { const id = x.k.isPlayer ? 'P' : x.k.ch.id; g.pts[id] = (g.pts[id] || 0) + (pts[i] || 0); });
      this.$('resNext').textContent = g.race < 3 ? '次のレースへ' : '最終結果へ';
    } else this.$('resNext').textContent = NET.active ? (NET.isHost ? 'ロビーへ戻る' : '待機') : this.sel.mode === 'battle' ? 'ステージ選択へ' : 'コース選択へ';
    this.$('resNext').style.display = NET.active && !NET.isHost ? 'none' : '';
    this.$('resRetry').style.display = NET.active ? 'none' : '';
    this.$('resHead').innerHTML = `<th>順位</th><th></th><th>名前</th><th>${this.sel.mode === 'battle' ? '風船' : 'タイム'}</th>${g ? '<th>pt</th>' : ''}`;
    if (this.sel.mode === 'battle') this.$('resTitle').textContent = me === 0 ? '🎈 バトル優勝！' : (me + 1) + '位 おしい！';
    this.$('btnPause').style.display = 'none';
    this.show('s-results');
  },
  resultsNext() {
    const g = this.gp;
    if (NET.active) { NET.send({ t: 'back' }); this.netBackToLobby(); return; }
    if (!g) { GAME.dispose(); HUD.hide(); if (this.sel.mode === 'battle') this.openArena(); else this.openCourse(); return; }
    if (this.$('resNext').dataset.stage === 'stand') {
      this.$('resNext').dataset.stage = '';
      if (g.race >= 3) { GAME.dispose(); HUD.hide(); this.gp = null; this.show('s-title'); return; }
      g.race++; g.order = Object.entries(g.pts).sort((a, b) => a[1] - b[1]).map(e => e[0]);
      this.runGPRace(); return;
    }
    // 総合順位表示
    const st = Object.entries(g.pts).sort((a, b) => b[1] - a[1]);
    this.$('resHead').innerHTML = '<th>総合</th><th></th><th>名前</th><th>ポイント</th>';
    this.$('resBody').innerHTML = st.map(([id, p], i) => { const ch = id === 'P' ? this.sel.ch : id; const c = CHARS.find(x => x.id === ch); return `<tr class="${id === 'P' ? 'me' : ''}"><td>${i + 1}</td><td><img src="${this.thumbs[ch]}"></td><td>${id === 'P' ? 'あなた' : c.name}</td><td>${p}</td></tr>`; }).join('');
    const myRank = st.findIndex(e => e[0] === 'P') + 1;
    this.$('resTitle').textContent = g.race >= 3 ? `${CUPS[g.cup].name} 総合${myRank}位 ${myRank === 1 ? '🏆🏆🏆' : myRank <= 3 ? '🥉' : ''}` : `総合順位（${g.race + 1}/4戦）`;
    this.$('resNext').textContent = g.race >= 3 ? 'タイトルへ' : '次のレースへ';
    this.$('resNext').dataset.stage = 'stand';
    this.$('resRetry').style.display = 'none';
  },

  // ---- オンライン ----
  openOnline() {
    this.$('netLobby').style.display = 'none';
    this.$('netEntry').style.display = '';
    this.$('netName').value = this.store.get('name', '');
    NET.status('部屋を作るか、友達の部屋コードを入力してください');
    this.show('s-online');
  },
  netName() { const n = (this.$('netName').value || '').trim().slice(0, 10) || 'プレイヤー'; this.store.set('name', n); return n; },
  async netHost() {
    const ok = await NET.host(this.netName(), this.sel.ch);
    if (ok) this.netLobbyView();
  },
  async netJoin() {
    const code = this.$('netCode').value; if (!code) { NET.status('部屋コードを入力してください'); return; }
    const ok = await NET.join(code, this.netName(), this.sel.ch);
    if (ok) this.netLobbyView();
  },
  netLobbyView() {
    this.$('netEntry').style.display = 'none'; this.$('netLobby').style.display = '';
    this.$('netHostOpts').style.display = NET.isHost ? '' : 'none';
    this.$('netCodeShow').textContent = NET.code;
    const sel = this.$('netCourse');
    if (!sel.options.length) COURSES.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = CUPS[c.cup].icon + ' ' + c.name; sel.appendChild(o); });
    NET.lobbyCb = (ps) => {
      this.$('netPlayers').innerHTML = ps.map(p => `<li><img src="${this.thumbs[p.ch]}"><b>${p.name}</b>${p.host ? '<em>ホスト</em>' : ''}${p.id === NET.myId ? '<em class="me">あなた</em>' : ''}</li>`).join('');
    };
    NET.lobbyCb(NET.players);
    this.show('s-online');
  },
  netGo() {
    if (!NET.isHost) return;
    NET.startRace(this.$('netCourse').value, +this.$('netCC').value, this.$('netCpu').checked);
  },
  netStart(m) {
    NET.active = true;
    this.sel.mode = 'online'; this.sel.course = m.course; this.sel.cc = m.cc; this.gp = null;
    const racers = m.racers.map(r => {
      let type = 'remote';
      if (r.id === NET.myId) type = 'player';
      else if (r.cpu && NET.isHost) type = 'ai';
      return { id: r.id, ch: r.ch, name: r.name, type, skill: r.skill };
    });
    this.launch(racers, { waitGo: true, netId: NET.myId, onReady: () => { HUD.msg('みんなを待っています…', 30, 'small'); NET.ready(); } });
  },
  netBackToLobby() {
    clearInterval(this.resTimer);
    GAME.dispose(); HUD.hide(); this.$('btnPause').style.display = 'none';
    NET.active = false;
    this.netLobbyView();
  },
};

addEventListener('load', () => UI.init());
