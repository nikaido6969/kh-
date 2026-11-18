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
    this.$('lgChar').src = this.thumbs.omunie;
    this.bind();
    this.show('s-title');
    let last = performance.now();
    const loop = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const racing = GAME.running && !this.cur; if (racing !== this._racingCls) { this._racingCls = racing; document.body.classList.toggle('racing', racing); }
      const st = !!(GAME.running && GAME.started); if (st !== this._startedCls) { this._startedCls = st; document.body.classList.toggle('started', st); }
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
      const m = buildRacerModel(ch); m.root.traverse(o => { if (o.isMesh && !o.userData.outline) o.castShadow = true; }); s.add(m.root);
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
    this.menuModel.root.traverse(o => { if (o.isMesh && !o.userData.outline) o.castShadow = true; });
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
    s.add(new THREE.HemisphereLight(0xffffff, 0x6a5a7a, 0.5));
    const d = new THREE.DirectionalLight(0xffffff, 0.75); d.position.set(4, 8, 6); s.add(d);
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
      if (e.target.closest && e.target.closest('.tbtn,#hitem,.hbag,#btnPause')) return;
      SND.init();
      for (const t of e.changedTouches) {
        if (t.clientX >= innerWidth * 0.5 && t.clientY > innerHeight * 0.5) { Input.touch.jump = true; setTimeout(() => Input.touch.jump = false, 120); const tj = this.$('tjump'); tj.classList.add('on'); setTimeout(() => tj.classList.remove('on'), 160); continue; }
        if (t.clientX < innerWidth * 0.5 && t.clientY > innerHeight * 0.45) {   // 左下ダブルタップ＝アイテム
          const now = performance.now(), lt = this._lastTap;
          if (lt && now - lt.t < 320 && Math.hypot(t.clientX - lt.x, t.clientY - lt.y) < 60) { Input.touch.item = true; setTimeout(() => Input.touch.item = false, 120); this._lastTap = null; }
          else this._lastTap = { t: now, x: t.clientX, y: t.clientY };
        }
        if (!this._stick && t.clientX < innerWidth * 0.5) this._stick = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX };
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
    btn('bMagic', 'magic', true);
    for (let i = 0; i < 2; i++) { const e = this.$('hbag' + i); const f = (ev) => { ev.preventDefault(); if (GAME.running && GAME.player) GAME.swapItem(GAME.player, i); }; e.addEventListener('touchstart', f, { passive: false }); e.addEventListener('mousedown', f); }
    try { if (U.isTouch && screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => { }); } catch (e) { }
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
  // ===== コースの絵はがき（世界ごとの景色＋ルート＋高低差） =====
  courseStats(def) {
    const r = turtle(def), p = r.pts, cmds = r.cmds;
    let minY = 1e9, maxY = -1e9; for (const q of p) { minY = Math.min(minY, q.y); maxY = Math.max(maxY, q.y); }
    const n = (f) => cmds.filter(f).length;
    return { km: p.length / 1000, rise: Math.round(maxY - minY), jumps: n(c => c.gap || c.ramp), wild: n(c => c.wild), tunnel: n(c => c.tunnel), loop: n(c => c.t === 'l' || c.cork), hairpin: n(c => c.t === 'c' && Math.abs(c.ang) >= 150), pts: p, minY, maxY };
  },
  courseArt(def) {
    this._art = this._art || {};
    const key = def.id + (def.battle ? 'b' : '');
    if (this._art[key]) return this._art[key];
    const W = 320, H = 200, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'), th = def.theme, R = U.rng(def.id.length * 31 + 7);
    const hx = (n) => '#' + n.toString(16).padStart(6, '0');
    const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, hx(th.skyTop)); sky.addColorStop(1, hx(th.skyBot)); c.fillStyle = sky; c.fillRect(0, 0, W, H);
    const biome = BIOME[def.baseId || def.id] || 'meadow';
    const hills = (y0, amp, col, n = 5) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 8) c.lineTo(x, y0 - Math.abs(Math.sin(x / W * Math.PI * n * 0.5 + y0)) * amp); c.lineTo(W, H); c.fill(); };
    const tri = (x, y, w, h, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + w / 2, y); c.lineTo(x - w / 2, y); c.fill(); };
    const stars = (k) => { c.fillStyle = '#fff'; for (let i = 0; i < k; i++) c.fillRect(R() * W, R() * H * 0.7, 1.5, 1.5); };
    const circ = (x, y, rad, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); };
    switch (biome) {
      case 'meadow': hills(150, 30, '#7ac850', 3); hills(170, 18, '#5aa83a', 5); for (let i = 0; i < 9; i++) { const x = R() * W; tri(x, 160 + R() * 20, 18, 34, '#2f7a3a'); } c.fillStyle = '#5ab0ff'; c.fillRect(0, 186, W, 14); break;
      case 'swamp': hills(160, 14, '#4a5a2a', 4); c.fillStyle = '#3a4a2a'; c.fillRect(0, 168, W, 32); for (let i = 0; i < 26; i++) { c.fillStyle = '#7a8a3a'; c.fillRect(R() * W, 150 + R() * 30, 2, 18); } for (let i = 0; i < 5; i++) { c.strokeStyle = '#3a2a1a'; c.lineWidth = 3; const x = R() * W; c.beginPath(); c.moveTo(x, 170); c.lineTo(x + 6, 120); c.lineTo(x - 10, 110); c.stroke(); } break;
      case 'mountain': for (let i = 0; i < 4; i++) { const x = 40 + i * 80 + R() * 20, h = 90 + R() * 60; tri(x, 190, 150, h, '#6a7a8a'); tri(x, 190 - h + 36, 50, 36, '#ffffff'); } hills(185, 14, '#4f7a3a', 6); for (let i = 0; i < 10; i++) tri(R() * W, 196, 14, 30, '#1f5f30'); break;
      case 'forest': for (let i = 0; i < 18; i++) { const x = R() * W; c.fillStyle = '#5a3a20'; c.fillRect(x - 3, 110, 7, 90); circ(x, 100 + R() * 20, 22 + R() * 12, ['#2f7a3a', '#3a8a3a', '#4fae46'][i % 3]); } for (let i = 0; i < 5; i++) { const x = R() * W; c.fillStyle = '#f4ead8'; c.fillRect(x - 2, 170, 4, 20); c.fillStyle = '#e04a6a'; c.beginPath(); c.ellipse(x, 170, 12, 7, 0, Math.PI, 0); c.fill(); } break;
      case 'gas': circ(W * 0.7, H * 0.95, 160, '#d8904a'); for (let i = 0; i < 7; i++) { c.fillStyle = ['#e8c49a', '#c9844e', '#f4e2c4', '#b0603a'][i % 4]; c.fillRect(0, 110 + i * 14, W, 7); } circ(W * 0.62, 150, 14, '#c0402a'); break;
      case 'volcano': tri(W * 0.55, 200, 260, 140, '#3a2a22'); c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(W * 0.55 - 14, 64); c.lineTo(W * 0.55 + 14, 64); c.lineTo(W * 0.55 + 40, 200); c.lineTo(W * 0.55 + 20, 200); c.fill(); for (let i = 0; i < 12; i++) circ(W * 0.55 + (R() - 0.5) * 60, 40 + R() * 30, 3 + R() * 4, '#ffb040'); c.fillStyle = '#ff5a12'; c.fillRect(0, 188, W, 12); break;
      case 'moon': stars(90); circ(W * 0.2, 46, 26, '#3a8af0'); circ(W * 0.2 + 6, 40, 10, '#2ea05a'); hills(160, 16, '#9a9aa4', 4); c.fillStyle = '#8a8a94'; c.fillRect(0, 168, W, 32); for (let i = 0; i < 6; i++) { c.strokeStyle = '#6a6a74'; c.lineWidth = 3; c.beginPath(); c.ellipse(R() * W, 178 + R() * 14, 16, 5, 0, 0, 7); c.stroke(); } break;
      case 'sea': c.fillStyle = 'rgba(30,120,200,0.55)'; c.fillRect(0, 70, W, 130); for (let i = 0; i < 20; i++) { c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(R() * W, 90 + R() * 100, 2 + R() * 4, 0, 7); c.stroke(); } for (let i = 0; i < 8; i++) tri(R() * W, 200, 14, 30 + R() * 20, ['#ff7a8a', '#ffb03a', '#b05aff'][i % 3]); for (let i = 0; i < 5; i++) { c.fillStyle = '#ffa030'; c.beginPath(); c.ellipse(R() * W, 100 + R() * 60, 8, 4, 0, 0, 7); c.fill(); } break;
      case 'cave': c.fillStyle = '#1a0806'; c.fillRect(0, 0, W, H); c.fillStyle = '#2a1410'; for (let i = 0; i < 12; i++) tri(R() * W, 0, 20, -50 - R() * 30, '#3a2420'); c.fillStyle = '#ff5a12'; c.fillRect(0, 180, W, 20); for (let i = 0; i < 8; i++) tri(R() * W, 180, 12, 30 + R() * 20, i % 2 ? '#b06aff' : '#5ae8ff'); break;
      case 'sky': for (let i = 0; i < 6; i++) { const x = R() * W, y = 60 + R() * 100; circ(x, y, 20, '#fff'); circ(x + 18, y + 4, 16, '#fff'); circ(x - 16, y + 6, 14, '#fff'); } for (let i = 0; i < 3; i++) { const x = 50 + i * 110, y = 150 + R() * 20; c.fillStyle = '#5ab04a'; c.fillRect(x - 30, y, 60, 8); tri(x, y + 40, 60, -32, '#8a7060'); } ['#ff4a4a', '#ffa03a', '#ffe03a', '#5ad86a', '#4a9aff', '#9a5aff'].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.arc(W * 0.8, 200, 110 - i * 5, Math.PI, 0); c.stroke(); }); break;
      case 'crystal': stars(60); for (let i = 0; i < 14; i++) { const x = R() * W, h = 40 + R() * 80; c.fillStyle = `hsl(${260 + R() * 70},80%,${55 + R() * 20}%)`; c.beginPath(); c.moveTo(x, 200 - h); c.lineTo(x + 12, 200); c.lineTo(x - 12, 200); c.fill(); } break;
      case 'alien': stars(60); circ(W * 0.8, 40, 30, '#ff8ad8'); for (let i = 0; i < 6; i++) { c.strokeStyle = '#7dffb0'; c.lineWidth = 6; c.beginPath(); const x = R() * W; c.moveTo(x, 200); c.quadraticCurveTo(x + 30, 150, x - 10, 110 + R() * 30); c.stroke(); } c.fillStyle = '#3a0a5a'; c.fillRect(0, 185, W, 15); break;
      case 'candy': hills(160, 24, '#ffc0dc', 4); for (let i = 0; i < 7; i++) { const x = R() * W; c.fillStyle = '#fff'; c.fillRect(x - 2, 120, 4, 50); circ(x, 116, 14, ['#ff5aa8', '#5ad8ff', '#ffe04a'][i % 3]); } break;
    }
    // ルート（上から見た形）
    const st = this.courseStats(def), p = st.pts;
    let a = 1e9, b = -1e9, e = 1e9, f = -1e9; for (const q of p) { a = Math.min(a, q.x); b = Math.max(b, q.x); e = Math.min(e, q.z); f = Math.max(f, q.z); }
    const box = { x: 16, y: 14, w: W - 32, h: H - 70 }, sc = Math.min(box.w / (b - a || 1), box.h / (f - e || 1));
    const X = (q) => box.x + (q.x - a) * sc + (box.w - (b - a) * sc) / 2, Y = (q) => box.y + (q.z - e) * sc + (box.h - (f - e) * sc) / 2;
    c.lineCap = c.lineJoin = 'round';
    for (const [lw, col] of [[9, 'rgba(30,10,60,0.65)'], [4.5, '#ffffff']]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); p.forEach((q, i) => { if (i % 3) return; i ? c.lineTo(X(q), Y(q)) : c.moveTo(X(q), Y(q)); }); if (!def.open) c.closePath(); c.stroke(); }
    if (def.open && !def.battle) { const q0 = p[0], q1 = p[p.length - 1]; circ(X(q0), Y(q0), 7, '#2ab060'); circ(X(q1), Y(q1), 7, '#ff3a5a'); c.fillStyle = '#fff'; c.font = 'bold 9px sans-serif'; c.fillText('S', X(q0) - 3, Y(q0) + 3); c.fillText('G', X(q1) - 3, Y(q1) + 3); }
    // 高低差グラフ
    const gy = H - 44, gh = 36;
    c.fillStyle = 'rgba(20,10,40,0.55)'; c.fillRect(0, gy - 4, W, gh + 8);
    const rng = Math.max(20, st.maxY - st.minY);
    c.beginPath(); c.moveTo(0, gy + gh);
    for (let i = 0; i < p.length; i += 6) c.lineTo(i / (p.length - 1) * W, gy + gh - (p[i].y - st.minY) / rng * gh);
    c.lineTo(W, gy + gh); c.closePath();
    const eg = c.createLinearGradient(0, gy, 0, gy + gh); eg.addColorStop(0, '#ffd23a'); eg.addColorStop(1, 'rgba(255,120,60,0.4)'); c.fillStyle = eg; c.fill();
    c.fillStyle = '#fff'; c.font = 'bold 11px sans-serif'; c.fillText(`高低差 ${st.rise}m`, 8, gy + 12);
    return (this._art[key] = cv.toDataURL('image/jpeg', 0.85));
  },
  courseChips(def) {
    const st = this.courseStats(def), ch = [];
    if (def.open) ch.push(`<span>📏 ${st.km.toFixed(1)}km</span>`); else ch.push(`<span>📏 1周${Math.round(st.km * 1000)}m</span>`);
    ch.push(`<span class="${st.rise > 100 ? 'hot' : ''}">⛰ ${st.rise}m</span>`);
    if (st.jumps) ch.push(`<span class="hot">⤴ ジャンプ${st.jumps}</span>`);
    if (st.wild) ch.push(`<span class="ok">🏁 ラリー</span>`);
    if (st.hairpin) ch.push(`<span>↩ ヘアピン${st.hairpin}</span>`);
    if (st.tunnel) ch.push(`<span>🕳 トンネル</span>`);
    if (st.loop) ch.push(`<span class="hot">🎢 ループ</span>`);
    if (def.water != null) ch.push(`<span class="cool">💧 水</span>`);
    if (def.gravity < 25) ch.push(`<span class="cool">🪶 低重力</span>`);
    if (def.gravity > 35) ch.push(`<span class="hot">⬇ 高重力</span>`);
    return ch.join('');
  },
  openCourse() {
    const box = this.$('courseList'); box.innerHTML = '';
    this.$('courseTitle').textContent = this.sel.mode === 'gp' ? 'カップをえらぶ' : 'コースをえらぶ';
    CUPS.forEach((cup, ci) => {
      const sec = document.createElement('div'); sec.className = 'cup';
      const cs = COURSES.filter(c => c.cup === ci);
      if (this.sel.mode === 'gp') {
        const b = document.createElement('button'); b.className = 'cupbtn';
        b.innerHTML = `<div class="cupic">${cup.icon}</div><div><h3>${cup.name}</h3><p>${cs.map(c => c.name).join('・')}</p><div class="cupmini">${cs.map(c => `<img src="${this.courseArt(c)}" alt="">`).join('')}</div></div>`;
        b.onclick = () => { SND.play('select'); this.startGP(ci); };
        sec.appendChild(b);
      } else {
        sec.innerHTML = `<h4>${cup.icon} ${cup.name}</h4>`;
        const row = document.createElement('div'); row.className = 'crow';
        cs.forEach(c => {
          const b = document.createElement('button'); b.className = 'course';
          const best = this.store.get('tt_' + c.id + '_' + this.sel.cc, null);
          b.innerHTML = `<img src="${this.courseArt(c)}" alt=""><div class="cinfo"><b>${c.name}</b><small>${c.desc}</small><div class="chips">${this.courseChips(c)}</div>${this.sel.mode === 'tt' && best ? `<em>BEST ${HUD.fmt(best)}</em>` : ''}</div>`;
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
        b.innerHTML = `<img src="${this.courseArt(def)}" alt=""><div class="cinfo"><b>${def.name}</b><small>${sub}</small></div>`;
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
