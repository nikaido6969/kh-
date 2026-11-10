// ===== アイテム & 武器 =====
const ITEMS = {
  // レース用
  rifle: { icon: '🎯', name: '狙撃ライフル', line: '前のヤツをスコープで狙え！' },
  bomb: { icon: '💣', name: '爆弾', line: '前に放り投げて大爆発' },
  dango: { icon: '🍡', name: '団子', line: '3つ転がしてスピンさせる', n: 1 },
  banana: { icon: '🍌', name: 'バナナの房まるごと', line: '後ろにバナナを大量投下' },
  cap: { icon: '🧃', name: 'りんごジュースのキャップ', line: '指で弾いて壁でカンカン跳ね返る' },
  paper: { icon: '📰', name: '新聞紙', line: '天から先頭集団の顔にバサッ' },
  ichoyaku: { icon: '💊', name: '胃薬', line: 'スッキリ加速…か腹痛か' },
  gas: { icon: '☠️', name: '毒ガス', line: '後ろにモクモク毒ガス' },
  shippu: { icon: '🩹', name: '湿布', line: 'ひんやりバリア。攻撃を1回防ぐ' },
  moufu: { icon: '🛌', name: '毛布', line: '前の相手を包んで眠らせる' },
  zabuton: { icon: '🟪', name: '座布団', line: '積み上げて浮遊。罠も穴も無視' },
  megusuri: { icon: '💧', name: '目薬', line: '視界クリアで集中ゾーン…しみるかも' },
  fan: { icon: '🌀', name: '扇風機', line: '前方に強風。相手を吹き飛ばす' },
  tv: { icon: '📺', name: 'テレビ', line: '天からテレビ落下＆ビリビリ感電' },
  karaage: { icon: '🍗', name: 'からあげ君', line: '食べて大加速。アツアツ注意' },
  // バトル用
  hammer: { icon: '🔨', name: '特大バナナ叩き', line: '巨大バナナで周りをぶっ叩く' },
  mgun: { icon: '🔫', name: 'マシンガン連打', line: 'ダダダダダ！' },
  gasoline: { icon: '⛽', name: 'ガソリン垂れ流しファイヤー', line: '走った跡が燃える。風船が溶ける' },
  waterb: { icon: '🎈', name: '大量特大水風船', line: '6発まとめてぶん投げ' },
  eda: { icon: '🫛', name: '枝豆コロコロ', line: '枝豆100個ばらまき。食べた相手は10倍デカくなる' },
  tako: { icon: '🐙', name: 'アツアツたこ焼き', line: 'ソースたっぷり。自分もやけど' },
  natto: { icon: '🫘', name: '納豆', line: 'ベトベト。触れたら最後まで滑り続ける' },
  // スペシャル（勝利賞品）
  sp_iretoba: { icon: '🦷', name: '黄金の入れ歯', line: '一番近い相手から風船とアイテムを強奪', sp: true },
  sp_zabuton10: { icon: '👑', name: '伝説の座布団10枚', line: '10秒間 浮遊＆無敵', sp: true },
  sp_ame: { icon: '🍬', name: 'おばちゃんの飴ちゃん', line: '全員が飴に夢中で2秒停止', sp: true },
  sp_harisen: { icon: '🪭', name: '宇宙ハリセン', line: '周囲25mを全員ハリセンでしばく', sp: true },
  sp_jikka: { icon: '🏠', name: '実家の安心感', line: '風船+3／レースなら超加速＆バリア', sp: true },
};
const SPECIALS = Object.keys(ITEMS).filter(k => ITEMS[k].sp);
const RACE_TABLE = [
  [0.2, { banana: 22, cap: 20, dango: 16, shippu: 14, megusuri: 10, ichoyaku: 10, fan: 8 }],
  [0.6, { dango: 10, cap: 10, bomb: 12, moufu: 12, fan: 10, gas: 10, karaage: 12, ichoyaku: 8, zabuton: 8, megusuri: 6, banana: 6 }],
  [1.01, { rifle: 14, tv: 12, paper: 10, karaage: 16, zabuton: 14, bomb: 10, moufu: 12, gas: 6, ichoyaku: 6 }],
];
const BATTLE_TABLE = { hammer: 16, mgun: 14, gasoline: 14, waterb: 16, eda: 14, tako: 14, natto: 12 };

Object.assign(Game.prototype, {
  toast(k, text) { if (k.isPlayer) HUD.toast(text); },

  rollItem(k) {
    let table;
    if (this.battle) table = BATTLE_TABLE;
    else {
      const n = this.karts.length, p = n > 1 ? k.rank / (n - 1) : 0;
      table = RACE_TABLE.find(([lim]) => p < lim)[1];
    }
    if (this.cfg.mode === 'tt') table = { karaage: 1 };
    let tot = 0; for (const v of Object.values(table)) tot += v;
    let r = Math.random() * tot; k.item = null;
    for (const [key, w] of Object.entries(table)) { r -= w; if (r <= 0) { k.item = key; break; } }
    if (!k.item) k.item = Object.keys(table)[0];
    k.itemN = ITEMS[k.item].n || 1;
    k.rollT = k.isPlayer ? 1.1 : 0.9;
  },

  // 前方のターゲット
  targetAhead(k, maxD = 160) {
    if (this.battle) return this.nearestFoe(k, 120);
    let best = null, bd = 1e9;
    for (const o of this.karts) {
      if (o === k || o.finished || o.out) continue;
      const dd = this.dDist(o.dist, k.dist);
      if (dd > 0 && dd < maxD && dd < bd) { bd = dd; best = o; }
    }
    return best || this.karts.find(o => o.rank === k.rank - 1);
  },
  nearestFoe(k, maxD = 1e9) {
    let best = null, bd = maxD;
    for (const o of this.karts) {
      if (o === k || o.out) continue;
      const dd = Math.hypot(this.dDist(o.dist, k.dist), o.d - k.d);
      if (dd < bd) { bd = dd; best = o; }
    }
    return best;
  },
  foesNear(k, r) { return this.karts.filter(o => o !== k && !o.out && Math.hypot(this.dDist(o.dist, k.dist), o.d - k.d) < r * (o.giantT > 0 ? 1.6 : 1)); },

  netProj(o) { if (window.NET && NET.active) NET.send({ t: 'proj', p: o }); },
  // ダメージ（リモートなら転送）
  hitAny(k, kind, opt = {}) {
    if (k.isRemote) { if (window.NET && NET.active) NET.send({ t: 'fx', fx: 'hit', id: k.id, kind, opt }); return; }
    this.damage(k, kind, opt);
  },

  useItem(k, inp) {
    const it = k.item, back = inp.back || inp.brake;
    const info = ITEMS[it];
    this.toast(k, `${info.icon} ${info.name}！`);
    const P = (o) => { o.owner = k.id; this.spawnProj(o); this.netProj(o); return o; };
    const fwd = (sp) => ({ dist: k.dist + (back ? -2.8 : 2.8), d: k.d, yaw: back ? 0 : k.yaw, v: back ? -sp * 0.7 : sp + Math.max(0, k.v) });
    const R = Math.random();
    switch (it) {
      case 'rifle': {
        const t = this.targetAhead(k);
        SND.play('scope');
        k.laser = { t: 0.75, target: t ? t.id : null, miss: R < 0.15 };
        break;
      }
      case 'bomb': P(Object.assign(fwd(30), { type: 'bomb', h: 1.5, vh: back ? 4 : 11 })); SND.play('fuse'); break;
      case 'dango': for (const a of [-0.12, 0, 0.12]) P(Object.assign(fwd(70), { type: 'dango', yaw: (back ? 0 : k.yaw) + a })); SND.play('poyon'); break;
      case 'banana':
        for (let i = 0; i < 7; i++) P({ type: 'banana', dist: k.dist - 3 - i * 1.6, d: k.d + (Math.random() - 0.5) * 9, yaw: 0, v: 0 });
        SND.play('thud'); break;
      case 'cap': P(Object.assign(fwd(88), { type: 'cap', bounces: 6 })); SND.play('ping'); break;
      case 'paper': {
        const ahead = this.karts.filter(o => o !== k && !o.out && (this.battle ? true : o.rank < k.rank)).sort((a, b) => a.rank - b.rank).slice(0, 3);
        for (const o of ahead) P({ type: 'paper', target: o.id, dist: o.dist, d: o.d, v: 0, warn: 0.9 });
        SND.play('paper'); break;
      }
      case 'ichoyaku':
        SND.play('gulp');
        if (R < 0.7) { this.cure(k); k.boostT = Math.max(k.boostT, 1.4); k.boostCol = 1; this.toast(k, '💊 スッキリ！加速！'); }
        else { k.bellyT = 2.2; SND.play('growl'); this.toast(k, '💊 お腹ゴロゴロ…逆効果！'); }
        break;
      case 'gas': for (let i = 0; i < 3; i++) P({ type: 'gas', dist: k.dist - 4 - i * 5, d: k.d + (Math.random() - 0.5) * 4, v: 0 }); SND.play('hiss'); break;
      case 'shippu': k.shieldT = 14; k.boostT = Math.max(k.boostT, 0.5); SND.play('peta'); this.toast(k, '🩹 ひんやり〜 バリア装着'); break;
      case 'moufu': { const t = this.targetAhead(k); P(Object.assign(fwd(66), { type: 'moufu', target: t ? t.id : null })); SND.play('fwash'); break; }
      case 'zabuton':
        if (R < 0.2) { SND.play('poff'); this.toast(k, '🟪 座布団全部持ってけ！…没収'); }
        else { k.hoverT = 5; SND.play('poff'); this.toast(k, '🟪 座布団3枚！浮いた！'); }
        break;
      case 'megusuri':
        SND.play('drip');
        if (R < 0.7) { k.blindT = 0; k.inkT = 0; k.eyeburnT = 0; k.zoneT = 5; this.toast(k, '💧 視界クリア！集中ゾーン'); if (k.isPlayer) HUD.clearBlind(); }
        else { k.eyeburnT = 1.8; this.toast(k, '💧 しみるぅぅ！'); }
        break;
      case 'fan': {
        SND.play('fan');
        const back2 = R < 0.18;
        if (back2) { k.windT = 1.4; k.windDir = 0; this.toast(k, '🌀 逆風！自分が押し戻される'); }
        for (const o of this.karts) {
          if (o === k || o.out) continue;
          const dd = this.dDist(o.dist, k.dist);
          if (dd > 0 && dd < 50 && Math.abs(o.d - k.d) < 12) this.hitAny(o, 'wind', { dir: Math.sign(o.d - k.d || 1) });
        }
        for (let i = 0; i < 20; i++) this.particles.emit(k.model.root.position.clone().add(new THREE.Vector3(0, 1, 0)), this.fwdVec(k).multiplyScalar(30 + Math.random() * 20).add(new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 2, (Math.random() - 0.5) * 8)), 0xe0f4ff, 0.8, 1.2, 3, 0, false);
        break;
      }
      case 'tv': {
        const ahead = this.karts.filter(o => o !== k && !o.out && (this.battle || o.rank < k.rank)).sort(() => Math.random() - 0.5).slice(0, 3);
        for (const o of ahead) P({ type: 'tv', target: o.id, dist: o.dist, d: o.d, v: 0, warn: 1.3 });
        SND.play('whistle'); break;
      }
      case 'karaage':
        SND.play('munch');
        if (R < 0.25) { k.spinT = 0.5; k.boostT = Math.max(k.boostT, 1.2); this.toast(k, '🍗 アツッ！でも美味い'); }
        else { k.boostT = Math.max(k.boostT, 2.2); k.boostCol = 2; this.toast(k, '🍗 うまっ！爆速！'); }
        SND.play('boost'); break;
      // ----- バトル武器 -----
      case 'hammer': {
        SND.play('swing');
        k.hammerT = 0.6;
        setTimeout(() => {
          if (!this.running) return;
          SND.play('bonk');
          for (const o of this.foesNear(k, 9)) this.hitAny(o, 'flat', { balloons: 2, src: k.id });
        }, 280);
        break;
      }
      case 'mgun': k.gunT = 2.4; k.gunCd = 0; break;
      case 'gasoline': k.fireT = 4.5; k.fireCd = 0; SND.play('gurgle'); break;
      case 'waterb':
        for (let i = 0; i < 6; i++) P({ type: 'waterb', dist: k.dist + 2, d: k.d + (i - 2.5) * 1.2, yaw: k.yaw + (i - 2.5) * 0.12, v: 34 + Math.random() * 22 + Math.max(0, k.v), h: 2, vh: 9 + Math.random() * 5 });
        SND.play('throw'); break;
      case 'eda':
        for (let i = 0; i < 100; i++) P({ type: 'eda', dist: k.dist + 3, d: k.d + (Math.random() - 0.5) * 3, yaw: k.yaw + (Math.random() - 0.5) * 1.6, v: 10 + Math.random() * 40, h: 0.3 });
        SND.play('rattle'); this.toast(k, '🫛 枝豆100個、転がれ〜！'); break;
      case 'tako':
        for (let i = 0; i < 8; i++) P({ type: 'tako', dist: k.dist + 2, d: k.d + (i - 3.5) * 0.8, yaw: k.yaw + (i - 3.5) * 0.09, v: 40 + Math.random() * 15 + Math.max(0, k.v), h: 1.6, vh: 6 + Math.random() * 3 });
        SND.play('sizzle');
        setTimeout(() => { if (this.running) { this.damage(k, 'burn', { balloons: 1, self: true }); this.toast(k, '🐙 アチチチ！自分もやけど！'); } }, 350);
        break;
      case 'natto':
        for (let i = 0; i < 4; i++) P({ type: 'natto', dist: k.dist - 3 - i * 2, d: k.d + (Math.random() - 0.5) * 6, v: 0 });
        k.slick = true; SND.play('squish'); this.toast(k, '🫘 自分もベトベト…ずっと滑る！'); break;
      // ----- スペシャル -----
      case 'sp_iretoba': {
        const o = this.nearestFoe(k);
        SND.play('bite');
        if (o) { this.hitAny(o, 'spin', { balloons: 2, steal: true }); if (this.battle) k.balloons = Math.min(10, k.balloons + 1); this.updateBalloons(k); if (o.item && !o.isRemote) { k.item = o.item; k.itemN = o.itemN; o.item = null; return; } }
        break;
      }
      case 'sp_zabuton10': k.hoverT = 10; k.starT = 10; SND.play('star'); break;
      case 'sp_ame': for (const o of this.karts) if (o !== k) this.hitAny(o, 'sleep', { t: 2, candy: true }); SND.play('ame'); break;
      case 'sp_harisen': SND.play('harisen'); for (const o of this.foesNear(k, 25)) this.hitAny(o, 'knock', { balloons: 2 }); break;
      case 'sp_jikka':
        if (this.battle) { k.balloons = Math.min(10, k.balloons + 3); this.updateBalloons(k); }
        else { k.boostT = 3; k.shieldT = 15; }
        SND.play('jikka'); break;
    }
    k.itemN--;
    if (k.itemN <= 0) { k.item = null; k.itemN = 0; }
  },

  fwdVec(k) {
    const fr = this.track.frame(k.dist, this.fr);
    return new THREE.Vector3().copy(fr.t).multiplyScalar(Math.cos(k.yaw)).addScaledVector(fr.r, Math.sin(k.yaw));
  },

  cure(k) { k.blindT = k.sleepT = k.gasT = k.bellyT = k.eyeburnT = k.flatT = k.inkT = k.reverseT = 0; if (k.isPlayer) HUD.clearBlind(); },

  // ---- 毎フレームのステータス ----
  updateStatus(k, dt) {
    for (const key of ['blindT', 'sleepT', 'flatT', 'gasT', 'hoverT', 'zoneT', 'eyeburnT', 'bellyT', 'giantT', 'invT', 'shieldT', 'windT', 'hammerT', 'reverseT', 'grabT'])
      if (k[key] > 0) k[key] = Math.max(0, k[key] - dt);
    // ライフル照準
    if (k.laser) {
      k.laser.t -= dt;
      if (k.laser.t <= 0) {
        const t = this.karts.find(o => o.id === k.laser.target);
        SND.play('gunshot');
        if (k.laser.miss || !t) { this.damage(k, 'spin', {}); this.toast(k, '🎯 暴発！自分に当たった'); }
        else this.hitAny(t, 'knock', { balloons: 2 });
        k.laser = null;
      }
    }
    if (k.gunT > 0) {
      k.gunT -= dt; k.gunCd -= dt;
      if (k.gunCd <= 0) {
        k.gunCd = 0.1; SND.play('mgun');
        const o = { type: 'bullet', owner: k.id, dist: k.dist + 2.5, d: k.d + (Math.random() - 0.5) * 0.8, yaw: k.yaw + (Math.random() - 0.5) * 0.08, v: 120 + Math.max(0, k.v) };
        this.spawnProj(o); this.netProj(o);
      }
    }
    if (k.fireT > 0) {
      k.fireT -= dt; k.fireCd -= dt;
      if (k.fireCd <= 0) { k.fireCd = 0.18; const o = { type: 'fire', owner: k.id, dist: k.dist - 2.5, d: k.d, v: 0 }; this.spawnProj(o); this.netProj(o); if (Math.random() < 0.3) SND.play('fire'); }
    }
    if (k.isPlayer) HUD.status(k);
  },

  damage(k, kind, opt = {}) {
    if (k.out || k.respawnT > 0) return;
    if (kind === 'wind') { k.windT = 1.4; k.windDir = opt.dir; return; }
    if (!opt.self) {
      if (k.invT > 0 || k.starT > 0 || k.ufoT > 0) return;
      if (k.shieldT > 0) { k.shieldT = 0; SND.play('peta'); this.toast(k, '🩹 湿布が守ってくれた！'); this.spark(k, 0xffffff, 10); return; }
      if (k.hoverT > 0 && ['spin', 'slip', 'nattoT'].includes(kind)) return;
    }
    switch (kind) {
      case 'spin': case 'slip': k.spinT = 0.8; break;
      case 'knock': k.knockT = 1.0; k.vh = 4.2; k.grounded = false; k.airT = 0; break;
      case 'flat': k.flatT = 2.4; k.spinT = 0.4; break;
      case 'shock': k.flatT = 2.0; k.spinT = 0.8; this.spark(k, 0x9ad8ff, 30); break;
      case 'sleep': k.sleepT = opt.t || 1.8; break;
      case 'burn': k.spinT = 0.6; break;
      case 'blind': k.blindT = opt.t || 3.5; if (k.isPlayer) HUD.blind(opt.style || 'paper'); return;
      case 'gas': k.gasT = 1.2; return;
      case 'natto': k.slick = true; k.spinT = 0.7; break;
      case 'grab': k.grabT = 1.5; break;
    }
    if (kind !== 'grab') { k.drift = 0; k.mt = 0; k.boostT = 0; }
    k.invT = this.battle ? 1.8 : 0.6; k.flow *= 0.45;
    if (k.isPlayer) { SND.play({ spin: 'hit', slip: 'slip', knock: 'hit', flat: 'squash', shock: 'bzzt', sleep: 'snore', burn: 'achi', natto: 'squish', grab: 'grab' }[kind] || 'hit'); HUD.shake(0.5); }
    this.spark(k, 0xffe060, 12);
    if (this.battle && !opt.noBalloon) {
      let n = opt.balloons || 1;
      if (k.giantT > 0) n *= 2;
      this.popBalloons(k, n);
    }
  },

  // ---- 弾 ----
  spawnProj(o) {
    const p = Object.assign({ id: o.id || (this.cfg.netId || 'L') + '_' + (this.projId++), h: 0.6, vh: 0, bounces: 3, age: 0, alive: true, yaw: 0, v: 0, d: 0 }, o);
    o.id = p.id;
    p.life = { banana: 70, natto: 999, eda: 40, gas: 6, fire: 6, bullet: 1.3, tv: 9, paper: 9, bomb: 6, waterb: 4, tako: 4, moufu: 11 }[p.type] || 8;
    const m = new THREE.Group();
    const T = p.type;
    if (T === 'cap') { mk(m, GEO.cyl(0.45, 0.45, 0.2, 14), 0xff4a3a, 0, 0, 0, { mo: { m: 0.6, r: 0.3 } }); mk(m, GEO.cyl(0.47, 0.47, 0.05, 14), 0xffd23a, 0, 0.12, 0); }
    else if (T === 'dango') { mk(m, GEO.sph(0.45), [0xffb0c8, 0xfff4e0, 0x9ad86a][this.projId % 3], 0, 0.3, 0); }
    else if (T === 'bullet') { mk(m, GEO.sph(0.18, 6, 4), 0xffe060, 0, 0, 0, { s: [1, 1, 3], mo: { e: 0xffa020 } }); }
    else if (T === 'bomb') { mk(m, GEO.sph(0.7), 0x1a1a1a, 0, 0, 0, { mo: { m: 0.5, r: 0.3 } }); mk(m, GEO.cyl(0.05, 0.05, 0.5, 4), 0xc8a060, 0, 0.8, 0); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: 0xffa020, blending: THREE.AdditiveBlending, transparent: true })); sp.position.y = 1.1; m.add(sp); }
    else if (T === 'banana') { mk(m, GEO.tor(0.4, 0.14, Math.PI), 0xffd83a, 0, 0.15, 0, { r: [Math.PI / 2, 0, 0] }); }
    else if (T === 'natto') { for (let q = 0; q < 9; q++) mk(m, GEO.sph(0.22, 7, 5), 0xb0803a, Math.cos(q) * 0.5 * (q % 3 / 2), 0.15, Math.sin(q) * 0.5 * (q % 3 / 2), { s: [1, 0.8, 1.3] }); mk(m, GEO.cyl(1.4, 1.4, 0.05, 14), 0xe8e0c0, 0, 0.02, 0, { mo: { op: 0.55 } }); }
    else if (T === 'eda') { mk(m, this.edaGeo || (this.edaGeo = new THREE.SphereGeometry(0.2, 6, 4)), 0x7ac83a, 0, 0.2, 0, { s: [2.2, 1, 1] }); }
    else if (T === 'moufu') { mk(m, GEO.box(2.2, 0.25, 1.8), 0x5a8ad8, 0, 0, 0); mk(m, GEO.box(2.25, 0.27, 0.3), 0xffffff, 0, 0, 0.5); }
    else if (T === 'waterb') { mk(m, GEO.sph(0.9), 0x5ab8ff, 0, 0, 0, { mo: { op: 0.75, r: 0.1 } }); }
    else if (T === 'tako') { mk(m, GEO.sph(0.45), 0xd88a3a, 0, 0, 0); mk(m, GEO.sph(0.46, 10, 6), 0x5a2a10, 0, 0.12, 0, { s: [1, 0.5, 1] }); }
    else if (T === 'gas') { for (let q = 0; q < 6; q++) mk(m, GEO.sph(2.2, 8, 6), 0x7ad84a, (Math.random() - 0.5) * 4, 1 + Math.random() * 1.5, (Math.random() - 0.5) * 4, { mo: { op: 0.35, e: 0x305a10 } }); }
    else if (T === 'fire') { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: 0xff6a1a, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); sp.scale.set(4, 4, 4); sp.position.y = 1; m.add(sp); mk(m, GEO.cone(1, 2.4, 6), 0xffa030, 0, 1.2, 0, { mo: { e: 0xff5a10, op: 0.8 } }); }
    else if (T === 'tv' || T === 'paper') {
      const obj = new THREE.Group(); obj.name = 'obj';
      if (T === 'tv') { mk(obj, GEO.box(3, 2.3, 2), 0x3a3a3a, 0, 0, 0); mk(obj, GEO.box(2.6, 1.9, 0.05), 0x9ad8ff, 0, 0, 1.03, { mo: { e: 0x4a8ab0 } }); mk(obj, GEO.cyl(0.03, 0.03, 1.4, 4), 0x888888, 0.4, 1.6, 0, { r: [0, 0, 0.4] }); mk(obj, GEO.cyl(0.03, 0.03, 1.4, 4), 0x888888, -0.4, 1.6, 0, { r: [0, 0, -0.4] }); }
      else { mk(obj, new THREE.PlaneGeometry(2.6, 1.8), 0xf0ece0, 0, 0, 0, { mat: new THREE.MeshBasicMaterial({ map: U.textTex('号外！', '#f0ece0', '#222', 256, 128), side: THREE.DoubleSide }) }); }
      obj.position.y = 25; m.add(obj);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.4, 20), new THREE.MeshBasicMaterial({ color: 0xff3a3a, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1; m.add(ring);
    }
    else { mk(m, GEO.sph(0.5), 0xffffff, 0, 0, 0); }
    p.mesh = m; this.scene.add(m);
    this.projs.push(p);
    return p;
  },

  removeProj(p, fx = true) {
    if (!p.alive) return;
    p.alive = false; this.scene.remove(p.mesh);
    if (fx && p.type !== 'eda' && p.type !== 'bullet') { const pos = p.mesh.position.clone(); pos.y += 1; for (let i = 0; i < 10; i++) this.particles.emit(pos, new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 8, (Math.random() - 0.5) * 10), 0xffd080, 0.5, 1.2, 0.2, 10); }
  },

  explode(p, radius, kind, opt, col = 0xffa030) {
    const pos = p.mesh.position.clone(); pos.y += 1;
    for (let i = 0; i < 40; i++) this.particles.emit(pos, new THREE.Vector3((Math.random() - 0.5) * 30, Math.random() * 20, (Math.random() - 0.5) * 30), i % 2 ? col : 0xffffff, 0.7, 3, 0.5, 8);
    for (const k of this.karts) {
      if (k.isRemote) continue;
      if (Math.hypot(this.dDist(k.dist, p.dist), k.d - p.d) < radius && Math.abs(k.h - p.h) < radius) this.damage(k, kind, opt);
    }
  },

  updateProjs(dt) {
    const tr = this.track;
    for (const p of this.projs) {
      if (!p.alive) continue;
      p.life -= dt; p.age += dt;
      const T = p.type;
      if (p.life <= 0) {
        if (T === 'bomb') { SND.play('boom'); HUD.shake(0.6); this.explode(p, 9, 'knock', { balloons: 2, self: false }); }
        this.removeProj(p, T !== 'gas' && T !== 'fire'); continue;
      }
      const s = tr.wrap(p.dist);
      const [i] = tr.idx(p.dist);
      const edge = tr.hw[i] + tr.sh[i] - 0.6;
      const off = tr.off[i];
      // 移動
      if (['cap', 'dango', 'bullet', 'eda', 'waterb', 'tako', 'bomb'].includes(T)) {
        const kap = tr.lerpArr(tr.kap, s);
        const ds = p.v * Math.cos(p.yaw) * dt;
        p.yaw -= kap * ds * Math.sign(p.v || 1);
        p.dist += ds; p.d += Math.abs(p.v) * Math.sin(p.yaw) * dt * Math.sign(p.v || 1);
        if (T === 'eda') p.v *= Math.exp(-1.6 * dt);
        if (['waterb', 'tako', 'bomb'].includes(T)) {
          if (p.vh !== null) { p.vh -= 28 * dt; p.h += p.vh * dt; }
          if (p.h <= off + 0.5 && p.vh !== null) {
            p.h = off + 0.5;
            if (T === 'waterb') { SND.play('splash'); this.explode(p, 4.8, 'slip', { balloons: 1 }, 0x5ab8ff); this.removeProj(p, false); continue; }
            if (T === 'tako') { SND.play('sizzle'); this.explode(p, 2.8, 'burn', { balloons: 1 }, 0xd88a3a); this.removeProj(p, false); continue; }
            if (T === 'bomb') { p.vh = null; p.v = 0; p.life = Math.min(p.life, 1.1); }
          }
        }
        if (Math.abs(p.d) > edge) {
          if (tr.flags[i] & 2) { this.removeProj(p, false); continue; }
          p.d = Math.sign(p.d) * edge; p.yaw = -p.yaw; p.bounces--;
          if (T === 'cap') SND.play('ping');
          if (p.bounces < 0 && T !== 'eda') { this.removeProj(p); continue; }
          if (T === 'eda') p.v *= 0.5;
        }
        if ((tr.flags[i] & 1) && !['waterb', 'tako', 'bomb'].includes(T)) { this.removeProj(p, false); continue; }
      } else if (T === 'moufu') {
        const tgt = p.target && this.karts.find(k => k.id === p.target);
        p.dist += p.v * dt;
        let tD = tr.lerpArr(tr.ai, s + 10);
        if (tgt) { const dd = this.dDist(tgt.dist, p.dist); if (dd > -10 && dd < 160) tD = tgt.d; if (dd < 40) p.v = Math.max(p.v, tgt.v + 25); if (dd < 0 && dd > -6) p.dist = tgt.dist; }
        p.d = U.damp(p.d, tD, 4, dt);
      } else if (T === 'tv' || T === 'paper') {
        const tgt = this.karts.find(k => k.id === p.target);
        p.warn -= dt;
        if (tgt && p.warn > 0.35) { p.dist = tgt.dist + tgt.v * 0.35; p.d = tgt.d; }
        const obj = p.mesh.getObjectByName('obj');
        obj.position.y = Math.max(0.8, 25 * Math.max(0, p.warn) / 1.2);
        obj.rotation.y += dt * 4; obj.rotation.x = T === 'paper' ? Math.sin(p.age * 6) * 0.5 : 0;
        if (p.warn <= 0) {
          if (T === 'tv') {
            SND.play('crash'); setTimeout(() => SND.play('bzzt'), 120);
            for (const k of this.karts) if (!k.isRemote && Math.abs(this.dDist(k.dist, p.dist)) < 3.5 && Math.abs(k.d - p.d) < 3.5) this.damage(k, 'shock', { balloons: 2 });
            this.explode(p, 0, 'shock', {}, 0x9ad8ff);
          } else if (tgt && !tgt.isRemote) { SND.play('paper'); this.damage(tgt, 'blind', { t: 3.5, style: 'paper' }); }
          this.removeProj(p, false); continue;
        }
      }
      // 当たり判定（ローカルのカートのみ）
      if (!['tv', 'paper', 'bomb'].includes(T) && !(T === 'waterb' || T === 'tako')) {
        const zone = T === 'gas' || T === 'fire';
        const rad = T === 'gas' ? 5 : T === 'fire' ? 2.6 : T === 'eda' ? 1.3 : 1.8;
        for (const k of this.karts) {
          if (k.isRemote || k.respawnT > 0 || k.out) continue;
          if (k.id === p.owner && p.age < (zone ? 99 : T === 'natto' || T === 'banana' ? 1.0 : 0.5)) continue;
          const kr = k.giantT > 0 ? 4 : 0;
          if (Math.abs(this.dDist(k.dist, p.dist)) < rad + kr && Math.abs(k.d - p.d) < rad - 0.2 + kr && k.h < 2.5 + kr) {
            if (zone) {
              if (T === 'gas') { k.gasT = 1.0; if (k.isPlayer && Math.random() < 0.05) SND.play('cough'); }
              else if (k.invT <= 0) { this.damage(k, 'burn', { balloons: 1 }); if (k.isPlayer) this.toast(k, '🔥 風船が溶ける〜！'); }
              continue;
            }
            if (k.hoverT > 0 && ['banana', 'natto', 'eda'].includes(T)) continue;
            const kind = { banana: 'slip', natto: 'natto', eda: 'slip', moufu: 'sleep', bullet: 'spin', cap: 'spin', dango: 'spin' }[T] || 'spin';
            if (T === 'moufu') { this.damage(k, 'blind', { t: 1.8, style: 'blanket' }); SND.play('fwash'); }
            if (T === 'eda' && k.starT <= 0 && k.invT <= 0 && k.shieldT <= 0) { k.giantT = 8; this.toast(k, '🫛 枝豆うまっ！体が10倍に…でも弱い！'); SND.play('eat'); }
            this.damage(k, kind, { balloons: T === 'eda' ? 1 : 1 });
            if (T !== 'natto') this.removeProj(p);
            if (window.NET && NET.active) NET.send({ t: 'phit', id: p.id });
            break;
          }
        }
      }
      if (!p.alive) continue;
      // 見た目
      const hh = ['tv', 'paper', 'gas', 'fire', 'natto', 'banana', 'eda'].includes(T) ? 0.05 : p.h;
      this.placeOnTrack(p.mesh, p.dist, p.d, hh, T === 'cap' || T === 'dango' ? this.time * 12 : 0);
      if (T === 'gas') p.mesh.scale.setScalar(1 + p.age * 0.15);
      if (T === 'fire') p.mesh.scale.setScalar(Math.min(1, p.life) * (0.8 + Math.random() * 0.3));
    }
    this.projs = this.projs.filter(p => p.alive);
    // ライフルのレーザー
    this.updateLasers();
  },

  updateLasers() {
    if (!this.laserLines) { this.laserLines = []; }
    let n = 0;
    for (const k of this.karts) {
      if (!k.laser) continue;
      const t = this.karts.find(o => o.id === k.laser.target); if (!t) continue;
      let L = this.laserLines[n];
      if (!L) { L = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xff2020 })); this.scene.add(L); this.laserLines.push(L); }
      const a = k.model.root.position.clone(); a.y += 1.2; const b = t.model.root.position.clone(); b.y += 1;
      L.geometry.setFromPoints([a, b]); L.visible = Math.floor(this.time * 20) % 2 === 0; n++;
    }
    for (let i = n; i < this.laserLines.length; i++) this.laserLines[i].visible = false;
  },
});
