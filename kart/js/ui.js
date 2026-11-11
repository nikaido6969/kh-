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
    this.renderer = new THREE.WebGLRenderer({ canvas: this.$('cv'), antialias: !U.isTouch, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, U.isTouch ? 1.5 : 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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
    s.background = new THREE.Color(0xf6efe4);
    s.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 0.9));
    const d = new THREE.DirectionalLight(0xffffff, 0.9); d.position.set(5, 10, 7); s.add(d);
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.3, 48), U.mat(0xffffff, { r: 0.4 }));
    floor.position.y = -0.15; s.add(floor);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.06, 8, 64), U.mat(0xff6a8a, { e: 0xff3a6a }));
    ring.rotation.x = Math.PI / 2; s.add(ring);
    this.menuScene = s;
    this.menuCam = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
    this.menuCam.position.set(0, 2.6, 7.5); this.menuCam.lookAt(0, 0.9, 0);
    this.menuT = 0;
    this.setMenuChar(this.sel.ch);
  },
  setMenuChar(id) {
    if (this.menuModel) this.menuScene.remove(this.menuModel.root);
    const ch = CHARS.find(c => c.id === id) || CHARS[0];
    this.menuModel = buildRacerModel(ch);
    this.menuScene.add(this.menuModel.root);
  },
  menuRender(dt) {
    this.menuT += dt;
    if (this.menuModel) { this.menuModel.root.rotation.y = this.menuT * 0.8; this.menuModel.anim(this.menuT); }
    const wide = innerWidth > innerHeight;
    const showModel = ['s-char', 's-title', 's-online'].includes(this.cur);
    if (this.menuModel) this.menuModel.root.visible = showModel;
    const side = this.cur === 's-char' ? 3.2 : this.cur === 's-title' ? -3.6 : 0;
    if (wide) { this.menuCam.position.set(side, 2.6, 8.5); this.menuCam.lookAt(side, 0.9, 0); }
    else { this.menuCam.position.set(0, 3.4, 12); this.menuCam.lookAt(0, this.cur === 's-char' ? -2.2 : -0.6, 0); }
    this.renderer.render(this.menuScene, this.menuCam);
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
      SND.init(); SND.play('select');
      this.sel.mode = b.dataset.mode;
      if (this.sel.mode === 'online' || this.sel.mode === 'battle') { this.sel.cc = 150; this.openChar(); return; }
      this.openCC();
    }));
    document.querySelectorAll('[data-cc]').forEach(b => b.addEventListener('click', () => { SND.play('select'); this.sel.cc = +b.dataset.cc; this.openChar(); }));
    document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { SND.init(); SND.play('back'); this.back(b.dataset.back); }));
    on('btnChar', () => { this.store.set('ch', this.sel.ch); if (this.sel.mode === 'online') this.openOnline(); else if (this.sel.mode === 'battle') this.openArena(); else this.openCourse(); });
    on('btnHelp', () => this.show('s-help'));
    on('btnSet', () => this.openSettings());
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
    // タッチ：画面左右でハンドル
    const zones = () => {
      const ts = this._touches || {}; let l = false, r = false;
      for (const id in ts) { if (ts[id] < innerWidth / 2) l = true; else r = true; }
      const both = l && r;
      Input.touch.l = l && !both; Input.touch.r = r && !both; Input.touch.b = both;
      this.$('tzL').classList.toggle('on', l); this.$('tzR').classList.toggle('on', r);
    };
    this._touches = {};
    const active = () => GAME.running && !GAME.paused && !this.cur;
    const tstart = (e) => {
      if (!active()) return;
      if (e.target.closest && e.target.closest('#hitem,#btnPause')) return;
      SND.init();
      for (const t of e.changedTouches) this._touches[t.identifier] = t.clientX;
      zones(); this.$('thint').style.opacity = 0; e.preventDefault();
    };
    const tmove = (e) => { if (!active()) return; for (const t of e.changedTouches) if (t.identifier in this._touches) this._touches[t.identifier] = t.clientX; zones(); };
    const tend = (e) => { for (const t of e.changedTouches) delete this._touches[t.identifier]; zones(); };
    document.addEventListener('touchstart', tstart, { passive: false });
    document.addEventListener('touchmove', tmove, { passive: true });
    document.addEventListener('touchend', tend); document.addEventListener('touchcancel', tend);
    const itemTap = (e) => { e.preventDefault(); Input.touch.item = true; setTimeout(() => Input.touch.item = false, 120); };
    this.$('hitem').addEventListener('touchstart', itemTap, { passive: false });
    this.$('hitem').addEventListener('mousedown', itemTap);
    this.$('touch').style.display = U.isTouch ? 'block' : 'none';
    document.addEventListener('keydown', (e) => {
      if (!GAME.running && this.cur && (e.code === 'Escape' || e.code === 'Backspace')) {
        const b = document.querySelector('#' + this.cur + ' [data-back]'); if (b) b.click();
      }
    });
  },
  back(to) {
    if (to === 'title') { NET.leave(); this.show('s-title'); }
    else this.show(to);
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
      d.innerHTML = `<img src="${this.thumbs[ch.id]}" alt=""><span>${ch.name}</span>`;
      d.onclick = () => { SND.play('select'); this.sel.ch = ch.id; g.querySelectorAll('.cc').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); this.charInfo(); this.setMenuChar(ch.id); };
      g.appendChild(d);
    }
    this.charInfo(); this.setMenuChar(this.sel.ch);
    this.show('s-char');
  },
  charInfo() {
    const ch = CHARS.find(c => c.id === this.sel.ch);
    const lab = ['スピード', '加速', 'ハンドル', '重さ'];
    this.$('charInfo').innerHTML = `<h3>${ch.name}</h3><p>${ch.desc}</p>` + ch.st.map((v, i) => `<div class="bar"><label>${lab[i]}</label><i><b style="width:${v * 20}%"></b></i></div>`).join('');
  },
  courseThumb(def) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 120;
    const c = cv.getContext('2d');
    const r = turtle(def); const p = r.pts;
    let a = 1e9, b = -1e9, e = 1e9, f = -1e9;
    p.forEach(q => { a = Math.min(a, q.x); b = Math.max(b, q.x); e = Math.min(e, q.z); f = Math.max(f, q.z); });
    const s = 100 / Math.max(b - a, f - e);
    c.lineWidth = 5; c.lineJoin = 'round'; c.strokeStyle = U.hex(def.theme.skyTop);
    c.beginPath(); p.forEach((q, i) => { const x = 10 + (q.x - a) * s + (100 - (b - a) * s) / 2, y = 10 + (q.z - e) * s + (100 - (f - e) * s) / 2; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.stroke();
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
    const sec = document.createElement('div'); sec.className = 'cup';
    const row = document.createElement('div'); row.className = 'crow';
    ARENAS.forEach(a => {
      const b = document.createElement('button'); b.className = 'course';
      b.innerHTML = `<img src="${this.courseThumb(a)}" alt=""><b>${a.name}</b><small>風船10個×8人</small>`;
      b.onclick = () => { SND.play('select'); this.sel.course = a.id; this.startBattle(); };
      row.appendChild(b);
    });
    sec.appendChild(row); box.appendChild(sec);
    this.show('s-course');
  },
  startBattle() {
    const racers = this.makeField(8).map((a, i) => Object.assign({ id: 'ai' + i }, a)).concat([{ ch: this.sel.ch, type: 'player', name: 'あなた', id: 'P' }]);
    this.launch(racers);
  },
  // ---- レース開始 ----
  makeField(n) {
    const others = CHARS.filter(c => c.id !== this.sel.ch).sort(() => Math.random() - 0.5).slice(0, n - 1);
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
      this.$('btnPause').style.display = 'block'; this.$('thint').style.opacity = 1;
      if (extra.onReady) extra.onReady();
    }, 30);
  },
  pause() { if (!GAME.running) return; if (!NET.active) GAME.paused = true; this.show('s-pause'); this.$('pRetry').style.display = NET.active ? 'none' : ''; },
  resume() { GAME.paused = false; this.show(null); },
  quit() {
    GAME.dispose(); HUD.hide(); this.$('btnPause').style.display = 'none';
    if (NET.active) { NET.leave(); }
    this.gp = null; this.show('s-title');
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
