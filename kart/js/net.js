// ===== 友達対戦（PeerJS / WebRTC） =====
const NET = {
  peer: null, conns: [], isHost: false, active: false, myId: null, code: null, players: [], lobbyCb: null, sendT: 0, readySet: null,
  status(t) { const e = document.getElementById('netStatus'); if (e) e.textContent = t; },
  makePeer(id) {
    return new Promise((res, rej) => {
      const p = id ? new Peer(id, { debug: 0 }) : new Peer({ debug: 0 });
      const to = setTimeout(() => rej(new Error('timeout')), 12000);
      p.on('open', (i) => { clearTimeout(to); res(p); });
      p.on('error', (e) => { clearTimeout(to); rej(e); });
    });
  },
  async host(name, ch) {
    this.leave();
    this.isHost = true;
    const code = Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    this.status('部屋を作成中…');
    try { this.peer = await this.makePeer('kkart-' + code); }
    catch (e) { this.status('作成失敗：' + (e.type || e.message) + '（もう一度お試しください）'); return false; }
    this.code = code; this.myId = this.peer.id;
    this.players = [{ id: this.myId, name, ch, host: true }];
    this.peer.on('connection', (c) => this.setupConn(c));
    this.status('部屋コード：' + code + '　友達にこのコードを伝えてね');
    this.lobbyUpdate();
    return true;
  },
  async join(code, name, ch) {
    this.leave();
    this.isHost = false;
    code = code.trim().toUpperCase();
    this.status('接続中…');
    try { this.peer = await this.makePeer(); }
    catch (e) { this.status('接続失敗：' + (e.type || e.message)); return false; }
    this.myId = this.peer.id; this.code = code;
    const c = this.peer.connect('kkart-' + code, { reliable: true });
    return new Promise((res) => {
      const to = setTimeout(() => { this.status('部屋が見つかりません（コードを確認）'); res(false); }, 10000);
      c.on('open', () => { clearTimeout(to); this.setupConn(c); c.send({ t: 'hello', name, ch }); this.status('接続しました！ホストの開始を待っています'); res(true); });
      this.peer.on('error', (e) => { clearTimeout(to); this.status('接続エラー：' + e.type); res(false); });
    });
  },
  setupConn(c) {
    this.conns.push(c);
    c.on('data', (m) => this.onData(c, m));
    c.on('close', () => {
      this.conns = this.conns.filter(x => x !== c);
      if (this.isHost) { this.players = this.players.filter(p => p.id !== c.peer); this.lobbyUpdate(); }
      else { this.status('ホストとの接続が切れました'); }
    });
  },
  send(m, except) {
    for (const c of this.conns) if (c !== except && c.open) { try { c.send(m); } catch (e) { } }
  },
  lobbyUpdate() {
    if (this.isHost) this.send({ t: 'lobby', players: this.players });
    if (this.lobbyCb) this.lobbyCb(this.players);
  },
  onData(c, m) {
    if (this.isHost && ['st', 'proj', 'phit', 'fx'].includes(m.t)) this.send(m, c); // 中継
    switch (m.t) {
      case 'hello':
        if (!this.isHost) return;
        if (this.players.length >= 8) { c.send({ t: 'full' }); return; }
        this.players.push({ id: c.peer, name: m.name, ch: m.ch });
        this.lobbyUpdate(); SND.play('select');
        break;
      case 'full': this.status('満員です'); break;
      case 'lobby': this.players = m.players; if (this.lobbyCb) this.lobbyCb(this.players); break;
      case 'start': UI.netStart(m); break;
      case 'ready': if (this.readySet) { this.readySet.add(c.peer); this.checkReady(); } break;
      case 'go': if (GAME && GAME.cfg) { GAME.cfg.waitGo = false; } break;
      case 'st': this.applyState(m); break;
      case 'sts': m.list.forEach(s => this.applyState(s)); if (this.isHost) { } break;
      case 'proj': if (GAME && GAME.running) GAME.spawnProj(Object.assign({}, m.p)); break;
      case 'phit': if (GAME && GAME.running) { const p = GAME.projs.find(q => q.id === m.id); if (p) GAME.removeProj(p); } break;
      case 'fx': if (GAME && GAME.running && m.fx === 'hit') { const k = GAME.karts.find(x => x.id === m.id); if (k && !k.isRemote) GAME.damage(k, m.kind, m.opt || {}); } break;
      case 'back': UI.netBackToLobby(); break;
    }
  },
  applyState(s) {
    if (!GAME || !GAME.running) return;
    const k = GAME.karts.find(x => x.id === s.id);
    if (!k || !k.isRemote) return;
    s.at = performance.now(); k.netT = s;
  },
  // ホスト：開始
  startRace(course, cc, cpu) {
    const racers = this.players.map(p => ({ id: p.id, ch: p.ch, name: p.name }));
    const used = new Set(racers.map(r => r.ch));
    let n = 0;
    while (cpu && racers.length < 8) {
      const ch = CHARS.find(c => !used.has(c.id)) || CHARS[n % CHARS.length]; used.add(ch.id);
      racers.push({ id: 'cpu' + (n++), ch: ch.id, name: ch.name, cpu: true, skill: 0.95 + Math.random() * 0.04 });
    }
    // 人間を後方に
    racers.sort((a, b) => (a.cpu ? 0 : 1) - (b.cpu ? 0 : 1));
    const msg = { t: 'start', course, cc, racers };
    this.send(msg);
    this.readySet = new Set();
    this.readyTimer = setTimeout(() => this.goAll(), 9000);
    UI.netStart(msg);
  },
  checkReady() {
    const humans = this.players.filter(p => !p.host).map(p => p.id);
    if (humans.every(id => this.readySet.has(id)) && this.hostReady) this.goAll();
  },
  goAll() {
    if (!this.readySet) return;
    clearTimeout(this.readyTimer); this.readySet = null;
    this.send({ t: 'go' });
    if (GAME && GAME.cfg) GAME.cfg.waitGo = false;
  },
  ready() {
    if (this.isHost) { this.hostReady = true; this.checkReady(); }
    else this.send({ t: 'ready' });
  },
  tick(g, dt) {
    this.sendT -= dt; if (this.sendT > 0) return; this.sendT = 1 / 15;
    const list = g.karts.filter(k => !k.isRemote).map(k => ({
      t: 'st', id: k.id, dist: +k.dist.toFixed(2), d: +k.d.toFixed(2), h: +k.h.toFixed(2), yaw: +k.yaw.toFixed(3), v: +k.v.toFixed(2),
      dr: k.drift, mt: k.mt, b: k.boostT > 0 ? 1 : 0, bc: k.boostCol, st: k.starT > 0 ? 1 : 0, sh: k.shrinkT > 0 ? 1 : 0, u: k.ufoT > 0 ? 1 : 0,
      sp: k.spinT > 0 ? 1 : 0, kn: k.knockT > 0 ? 1 : 0, g: k.grounded, rs: k.respawnT > 0 ? 1 : 0, s: +(k.input.steer || 0).toFixed(2), fin: k.finished, ft: k.finishTime,
    }));
    if (list.length === 1) this.send(list[0]); else this.send({ t: 'sts', list });
  },
  leave() {
    try { if (this.peer) this.peer.destroy(); } catch (e) { }
    this.peer = null; this.conns = []; this.active = false; this.players = []; this.isHost = false; this.readySet = null; this.hostReady = false;
  },
};
window.NET = NET;
