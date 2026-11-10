// ===== 乱入キャラ（じじい・ばばあ・お化け 18種） =====
const NPCS = [
  { id: 'tsuru', name: 'ツルツルじじい', type: 'jiji', hair: 'bald', pose: 'run', beh: 'flash', line: 'まぶしかろう…ワシの頭が' },
  { id: 'houki', name: 'ホウキ持ちババア', type: 'baba', hair: 'bun', acc: 'broom', pose: 'fly', beh: 'broom', line: '掃除の邪魔じゃー！どきなはれ！' },
  { id: 'mukimuki', name: 'ムキムキババア', type: 'baba', hair: 'perm', acc: 'muscle', pose: 'run', beh: 'ally', line: 'あんた、手伝ったるわ！', friend: true },
  { id: 'yokozuke', name: '横付けババア', type: 'baba', hair: 'perm', acc: 'bag', pose: 'run', beh: 'side', line: '…どこ行くん？…なぁ…なぁ…' },
  { id: 'yotsunbai', name: '四つん這いじいちゃん', type: 'jiji', hair: 'white', pose: 'crawl', beh: 'chase', line: 'まてぇぇぇぇ…' },
  { id: 'bakusou', name: '爆走おばちゃん', type: 'baba', hair: 'perm', acc: 'bag', pose: 'run', beh: 'overtake', line: 'タイムセール始まるでー！どいてどいて！' },
  { id: 'ouen', name: '応援じいちゃん', type: 'jiji', hair: 'white', acc: 'flag', pose: 'run', beh: 'cheer', line: 'がんばれー！若いの！', friend: true },
  { id: 'amechan', name: '飴ちゃんおばちゃん', type: 'baba', hair: 'perm', acc: 'candy', pose: 'run', beh: 'gift', line: '飴ちゃん持っていき〜', friend: true },
  { id: 'ochimusha', name: '落ち武者', type: 'ghost', acc: 'armor', pose: 'float', beh: 'block', line: 'ここは…通さぬ…' },
  { id: 'onepiece', name: '白いワンピースの女', type: 'ghost', hair: 'long', pose: 'float', beh: 'teleport', line: '……………' },
  { id: 'rokuro', name: 'ろくろ首ババア', type: 'baba', hair: 'bun', acc: 'neck', pose: 'run', beh: 'neck', line: '首が伸びちゃった〜 ジャンプで越えな！' },
  { id: 'iretoba', name: '入れ歯飛ばしじじい', type: 'jiji', hair: 'bald', acc: 'dentures', pose: 'run', beh: 'denture', line: 'フガッ！入れ歯が飛んでいく〜！' },
  { id: 'bonodori', name: '盆踊りおばけ', type: 'ghost', acc: 'happi', pose: 'float', beh: 'dance', line: 'ア ヨイヨイ♪ みんな踊れ〜', friend: true },
  { id: 'gyakusou', name: '逆走じいちゃん', type: 'jiji', hair: 'white', acc: 'cane', pose: 'run', beh: 'oncoming', line: 'こっちが正しい道じゃ！' },
  { id: 'navi', name: 'ナビおばあ', type: 'baba', hair: 'bun', acc: 'navi', pose: 'run', beh: 'curse', line: '次を右…いや左じゃったかの' },
  { id: 'toumei', name: '透明じじい', type: 'jiji', acc: 'invisible', pose: 'run', beh: 'thief', line: '（足音だけが聞こえる…）' },
  { id: 'zashiki', name: '座敷わらし', type: 'ghost', hair: 'bob', acc: 'kimono', pose: 'float', beh: 'zashiki', line: 'いいこと、あるよ…', friend: true },
  { id: 'hannya', name: '般若ママ', type: 'baba', acc: 'hannya', pose: 'run', beh: 'hannya', line: '宿題やったんかぁぁぁ！！' },
];

function buildNPC(def) {
  const g = new THREE.Group();
  const ghost = def.type === 'ghost';
  const skin = ghost ? 0xe8eef8 : 0xf0c8a0;
  const mo = ghost ? { op: 0.7, e: 0x6a7a9a } : {};
  const body = new THREE.Group(); g.add(body);
  const cloth = { jiji: 0x6a6a5a, baba: 0xb05a8a, ghost: 0xf4f8ff }[def.type];
  const legs = [];
  if (def.acc !== 'invisible') {
    mk(body, GEO.cyl(0.42, 0.55, 1.3, 10), def.acc === 'kimono' ? 0xd8323a : def.acc === 'happi' ? 0x2a4ad8 : cloth, 0, 1.45, 0, { mo });
    if (!ghost) for (const s of [-1, 1]) legs.push(mk(body, GEO.cyl(0.13, 0.13, 0.9, 6), 0x4a4a52, s * 0.2, 0.45, 0));
    else mk(body, GEO.cone(0.55, 1.2, 10), cloth, 0, 0.5, 0, { r: [Math.PI, 0, 0], mo });
    const arms = [];
    for (const s of [-1, 1]) arms.push(mk(body, GEO.cyl(0.1, 0.1, 0.9, 6), def.acc === 'muscle' ? skin : cloth, s * 0.55, 1.5, 0.25, { r: [-1.0, 0, s * 0.3], mo }));
    if (def.acc === 'muscle') for (const s of [-1, 1]) { mk(body, GEO.sph(0.32), skin, s * 0.62, 1.7, 0.1); mk(body, GEO.sph(0.26), skin, s * 0.6, 1.35, 0.45); }
    body.userData.arms = arms;
  }
  const head = new THREE.Group(); head.position.y = 2.45; body.add(head);
  if (def.acc === 'neck') { mk(body, GEO.cyl(0.12, 0.12, 2.6, 6), skin, 0, 3.4, 0); head.position.y = 4.8; }
  if (def.acc !== 'invisible') {
    const hm = mk(head, GEO.sph(0.42), skin, 0, 0, 0, { mo: def.hair === 'bald' ? { m: 0.6, r: 0.08 } : mo });
    if (def.acc === 'hannya') { hm.material = U.mat(0xf8f4e8); for (const s of [-1, 1]) mk(head, GEO.cone(0.08, 0.5, 6), 0xd8c890, s * 0.25, 0.45, 0, { r: [0, 0, -s * 0.4] }); for (const s of [-1, 1]) mk(head, GEO.sph(0.08, 8, 6), 0xff1a1a, s * 0.15, 0.05, 0.38, { mo: { e: 0xff0000 } }); mk(head, GEO.box(0.4, 0.1, 0.05), 0x8a0000, 0, -0.2, 0.4); }
    else { eyes(head, 0, 0.05, 0.36, 0.14, 0.07); mk(head, GEO.box(0.22, 0.05, 0.03), 0x5a2a2a, 0, -0.17, 0.4); }
    if (def.hair === 'white') for (const s of [-1, 1]) mk(head, GEO.sph(0.18, 8, 6), 0xf4f4f4, s * 0.36, 0.08, -0.05);
    if (def.hair === 'perm') for (let i = 0; i < 9; i++) mk(head, GEO.sph(0.16, 7, 5), 0x8a5aa8, Math.cos(i) * 0.3, 0.3 + (i % 2) * 0.08, Math.sin(i) * 0.3 - 0.05);
    if (def.hair === 'bun') { mk(head, GEO.sph(0.43, 12, 8), 0xb8b8b8, 0, 0.08, -0.05, { s: [1, 0.9, 1] }); mk(head, GEO.sph(0.2), 0xb8b8b8, 0, 0.42, -0.2); }
    if (def.hair === 'long') { mk(head, GEO.box(0.9, 1.6, 0.4), 0x0a0a0a, 0, -0.5, -0.1); mk(head, GEO.box(0.8, 0.9, 0.05), 0x0a0a0a, 0, -0.1, 0.42); }
    if (def.hair === 'bob') mk(head, GEO.sph(0.45, 12, 8), 0x111111, 0, 0.1, -0.06, { s: [1.05, 0.95, 1] });
    if (def.acc === 'dentures') mk(head, GEO.box(0.32, 0.14, 0.12), 0xffffff, 0, -0.2, 0.42);
    if (def.acc === 'armor') { mk(head, GEO.cone(0.6, 0.4, 8), 0x3a3a3a, 0, 0.35, 0); for (let i = 0; i < 3; i++) mk(body, GEO.cyl(0.02, 0.02, 1.2, 4), 0x8a6a3a, -0.2 + i * 0.2, 1.8, -0.5, { r: [0.8, 0, 0] }); }
  } else {
    mk(head, GEO.tor(0.12, 0.025), 0x111111, -0.15, 0, 0.4); mk(head, GEO.tor(0.12, 0.025), 0x111111, 0.15, 0, 0.4);
    for (const s of [-1, 1]) mk(body, GEO.box(0.25, 0.15, 0.45), 0x5a3a2a, s * 0.2, 0.08, 0.05);
  }
  if (def.acc === 'broom') { mk(body, GEO.cyl(0.05, 0.05, 3, 5), 0x8a6a3a, 0, 0.5, 0.2, { r: [Math.PI / 2, 0, 0] }); mk(body, GEO.cone(0.4, 0.9, 8), 0xd8b060, 0, 0.5, -1.6, { r: [-Math.PI / 2, 0, 0] }); }
  if (def.acc === 'bag') mk(body, GEO.box(0.6, 0.6, 0.3), 0xffd23a, 0.75, 1.0, 0.2);
  if (def.acc === 'flag') { mk(body, GEO.cyl(0.03, 0.03, 1.6, 4), 0x8a6a3a, 0.7, 2.3, 0.3); mk(body, GEO.box(0.8, 0.5, 0.02), 0xff3a3a, 1.1, 2.9, 0.3); }
  if (def.acc === 'candy') mk(body, GEO.sph(0.25, 10, 8), 0xff5aa8, 0.7, 1.9, 0.5, { mo: { e: 0x601030 } });
  if (def.acc === 'cane') mk(body, GEO.cyl(0.04, 0.04, 1.4, 5), 0x5a3a1a, 0.6, 0.8, 0.3);
  if (def.acc === 'navi') mk(body, GEO.box(0.6, 0.4, 0.06), 0x222222, 0, 1.6, 0.6, { mo: { e: 0x2a6aff, ei: 0.6 } });
  if (def.pose === 'crawl') { body.rotation.x = 1.25; body.position.set(0, 0.8, -0.8); }
  g.scale.setScalar(1.35);
  return { g, body, legs, head };
}

Object.assign(Game.prototype, {
  updateNPC(dt) {
    const P = this.player; if (!P) return;
    if (!this.npcs.length && !P.finished && !P.out) {
      this.npcT -= dt;
      if (this.npcT <= 0) { this.spawnNPC(NPCS[Math.floor(Math.random() * NPCS.length)]); this.npcT = 25 + Math.random() * 22; }
    }
    for (const n of this.npcs) this.npcStep(n, dt, P);
    const before = this.npcs.length;
    this.npcs = this.npcs.filter(n => { if (n.t > n.life) { this.scene.remove(n.m.g); return false; } return true; });
    if (before && !this.npcs.length) this.horror(false);
  },

  spawnNPC(def) {
    const P = this.player, m = buildNPC(def);
    this.scene.add(m.g);
    const n = { def, m, t: 0, life: 10, dist: P.dist - 20, d: P.d + (Math.random() < 0.5 ? -3 : 3), h: 0, v: 0, cd: 1.5, uses: 0, side: Math.random() < 0.5 ? -1 : 1, yaw: 0 };
    const b = def.beh;
    if (b === 'block') { n.dist = P.dist + 45; n.d = P.d; }
    if (b === 'oncoming') { n.dist = P.dist + 150; n.d = P.d; n.yaw = Math.PI; }
    if (b === 'neck') { n.dist = P.dist + 60; n.d = this.track.hw[0] + 2; n.life = 7; this.makeNeck(n); }
    if (b === 'broom') { n.h = 4; }
    if (b === 'side' || b === 'cheer' || b === 'gift' || b === 'curse' || b === 'zashiki') n.d = P.d + n.side * 7;
    if (b === 'teleport') { n.dist = P.dist + 20; n.life = 8; }
    this.npcs.push(n);
    if (this.dDist(n.dist, P.dist) < 0) this.lookBackT = 1.7;
    this.horror(true);
    HUD.banner(def.name, def.line);
    SND.play('stinger'); setTimeout(() => SND.play(def.type === 'ghost' ? 'whisper' : 'laugh'), 500);
    if (def.friend) setTimeout(() => { if (this.npcs.includes(n)) { this.horror(false); HUD.toast(`✨ ${def.name}は味方だった！`); } }, 2200);
  },

  makeNeck(n) {
    const w = (this.track.hw[0] + this.track.sh[0]) * 2 + 4;
    const neck = mk(n.m.g, GEO.cyl(0.35, 0.35, w / 1.35, 8), 0xf0c8a0, w / 2.7, 1.0 / 1.35, 0, { r: [0, 0, Math.PI / 2] });
    n.neck = neck;
  },

  horror(on) {
    if (this.horrorOn === on) return;
    this.horrorOn = on;
    HUD.horror(on);
    SND.scary(on);
    const f = this.scene.fog;
    if (on) { this.baseFog.saveFar = this.baseFog.far; this.baseFog.far = Math.min(this.baseFog.far, 220); this.baseFog.saveC = this.baseFog.c.clone(); this.baseFog.c = this.baseFog.c.clone().multiplyScalar(0.25); }
    else if (this.baseFog.saveFar) { this.baseFog.far = this.baseFog.saveFar; this.baseFog.c = this.baseFog.saveC; }
  },

  npcStep(n, dt, P) {
    n.t += dt; n.cd -= dt;
    const b = n.def.beh, near = (r) => Math.abs(this.dDist(P.dist, n.dist)) < r && Math.abs(P.d - n.d) < r * 0.9 && P.h < 2.5;
    const pv = Math.max(P.v, 20);
    const leave = () => { n.life = Math.min(n.life, n.t + 1.5); n.leaving = true; };
    switch (b) {
      case 'overtake':
        n.v = pv + 20; n.d = U.damp(n.d, P.d + 0.5, 1, dt);
        for (const k of this.karts) if (!k.isRemote && Math.abs(this.dDist(k.dist, n.dist)) < 2.5 && Math.abs(k.d - n.d) < 2) this.damage(k, 'spin', { noBalloon: true });
        if (this.dDist(n.dist, P.dist) > 60) leave();
        break;
      case 'ally': {
        n.v = pv + 26;
        const foes = this.karts.filter(k => k !== P && !k.out && this.dDist(k.dist, n.dist) > -5);
        const t = foes.sort((a, c) => this.dDist(a.dist, n.dist) - this.dDist(c.dist, n.dist))[0];
        if (t) { n.d = U.damp(n.d, t.d, 3, dt); if (Math.abs(this.dDist(t.dist, n.dist)) < 3 && Math.abs(t.d - n.d) < 2.5) { this.hitAny(t, 'knock', { balloons: 1 }); SND.play('bonk'); n.dist += 6; } }
        break;
      }
      case 'side':
        n.dist = U.damp(n.dist, P.dist, 3, dt); n.v = 0;
        n.d = U.damp(n.d, P.d + n.side * 2.7, 2, dt);
        if (n.t > 1.5 && n.t < 8) { P.d -= n.side * 1.4 * dt; if (n.cd <= 0) { n.cd = 2; HUD.toast(`👵「${['どこ行くん？', 'なぁ…', 'ご飯食べた？', 'ええ車やな…'][n.uses++ % 4]}」`); } }
        if (n.t > 8) n.v = -20;
        break;
      case 'chase': case 'flash': case 'hannya':
        n.v = pv + (b === 'hannya' ? 9 : 6); n.d = U.damp(n.d, P.d, 2, dt);
        if (b === 'flash' && n.cd <= 0 && Math.abs(this.dDist(P.dist, n.dist)) < 14) { n.cd = 3; this.damage(P, 'blind', { t: 1, style: 'flash' }); SND.play('shine'); }
        if (near(2.2)) {
          if (b === 'hannya') { P.item = null; P.itemN = 0; this.damage(P, 'spin', { balloons: 1 }); HUD.toast('👹 アイテムを没収された！'); }
          else { this.damage(P, 'grab', {}); HUD.toast('👴 つかまった！足が重い…'); }
          n.dist -= 25;
        }
        break;
      case 'broom':
        n.dist = U.damp(n.dist, P.dist + 2, 2, dt); n.v = 0; n.d = P.d + Math.sin(n.t * 1.5) * 4; n.h = 4 + Math.sin(n.t * 3);
        if (n.cd <= 0) { n.cd = 2.2; P.windT = 0.8; P.windDir = Math.random() < 0.5 ? -1 : 1; SND.play('fan'); HUD.toast('🧹 シャッシャッ！掃き出された！'); }
        break;
      case 'cheer':
        n.dist = U.damp(n.dist, P.dist + 2, 3, dt); n.d = U.damp(n.d, P.d + n.side * 6, 2, dt);
        if (n.t > 2.2 && n.cd <= 0 && n.uses < 2) { n.cd = 2.5; n.uses++; P.boostT = Math.max(P.boostT, 1.2); SND.play('boost'); HUD.toast('🚩 がんばれー！加速！'); }
        if (n.uses >= 2 && n.t > 7) leave();
        break;
      case 'gift':
        n.dist = U.damp(n.dist, P.dist + 1, 3, dt); n.d = U.damp(n.d, P.d + n.side * 4, 2, dt);
        if (n.t > 2.5 && !n.uses) { n.uses = 1; if (!P.item) this.rollItem(P); else P.boostT = 1.5; SND.play('ame'); HUD.toast('🍬 飴ちゃんもろた！'); leave(); }
        break;
      case 'block':
        n.v = pv * 0.8; n.d = U.damp(n.d, P.d, 0.8, dt);
        if (near(2.3)) { this.damage(P, 'spin', { balloons: 1 }); n.dist += 30; }
        break;
      case 'teleport':
        if (n.cd <= 0) { n.cd = 1.1; n.dist = P.dist + 6 + Math.random() * 25; n.d = (Math.random() - 0.5) * this.track.hw[0] * 1.6; SND.play('whisper'); HUD.glitch(); }
        n.v = 0; if (near(2.2)) { this.damage(P, 'blind', { t: 1.5, style: 'ghost' }); n.cd = 0; }
        break;
      case 'neck':
        n.v = 0;
        if (Math.abs(this.dDist(P.dist, n.dist)) < 1.5 && P.h < 1.2 && P.hoverT <= 0 && !n.hit) { n.hit = true; this.damage(P, 'spin', { balloons: 1 }); HUD.toast('🦒 首に引っかかった！'); }
        break;
      case 'denture':
        n.v = pv + 2; n.d = U.damp(n.d, P.d + n.side * 4, 1, dt);
        if (n.cd <= 0 && n.uses < 4) { n.cd = 1.6; n.uses++; this.spawnProj({ type: 'cap', owner: 'npc', dist: n.dist + 3, d: n.d, yaw: Math.atan2(P.d - n.d, 15), v: pv + 30, bounces: 1 }); SND.play('ping'); }
        break;
      case 'dance':
        n.dist = U.damp(n.dist, P.dist + 4, 2, dt); n.d = Math.sin(n.t * 2) * 6;
        if (n.t > 2.2 && n.cd <= 0) { n.cd = 3; let c = 0; for (const k of this.karts) if (k !== P && Math.abs(this.dDist(k.dist, P.dist)) < 80) { this.hitAny(k, 'spin', { noBalloon: true }); c++; } if (c) HUD.toast(`💃 周りの${c}人が踊りだした！`); SND.play('taiko'); }
        break;
      case 'oncoming':
        n.v = -28; n.d = U.damp(n.d, P.d, 0.7, dt);
        if (near(2.4)) { this.damage(P, 'knock', { balloons: 1 }); n.d += 6; }
        if (this.dDist(n.dist, P.dist) < -30) leave();
        break;
      case 'curse':
        n.dist = U.damp(n.dist, P.dist + 1, 3, dt); n.d = U.damp(n.d, P.d + n.side * 4, 2, dt);
        if (n.t > 2 && !n.uses) { n.uses = 1; P.reverseT = 3.5; SND.play('navi'); HUD.toast('🗺️「次を右です」…ハンドルが逆に！'); }
        if (n.t > 6) leave();
        break;
      case 'thief':
        n.v = pv + 8; n.d = U.damp(n.d, P.d, 2, dt);
        if (near(2.2) && !n.uses) { n.uses = 1; if (P.item) { P.item = null; P.itemN = 0; HUD.toast('👻 アイテムを盗まれた！'); } else { P.boostT = 1; HUD.toast('👻 …背中を押された？'); } SND.play('whisper'); leave(); }
        break;
      case 'zashiki':
        n.dist = U.damp(n.dist, P.dist + 2, 3, dt); n.d = U.damp(n.d, P.d + n.side * 4, 2, dt);
        if (n.t > 2.5 && !n.uses) { n.uses = 1; if (Math.random() < 0.5) P.starT = 4; else P.shieldT = 15; SND.play('star'); HUD.toast('🎎 座敷わらしのご加護！'); leave(); }
        break;
    }
    n.dist += n.v * dt;
    // 見た目
    this.placeOnTrack(n.m.g, n.dist, n.d, n.h, n.yaw);
    const ph = n.t * 12;
    n.m.legs.forEach((l, i) => l.rotation.x = Math.sin(ph + i * Math.PI) * 0.8);
    if (n.m.body.userData.arms) n.m.body.userData.arms.forEach((a, i) => a.rotation.x = -1 + Math.sin(ph + i * Math.PI) * 0.6);
    if (n.def.pose === 'crawl') n.m.body.position.y = 0.8 + Math.abs(Math.sin(ph)) * 0.2;
    if (n.def.pose === 'float') n.m.body.position.y = 0.4 + Math.sin(n.t * 3) * 0.3;
    if (b === 'dance') n.m.g.rotation.y += Math.sin(n.t * 4) * 0.5;
    if (b === 'teleport') n.m.g.visible = Math.random() > 0.15;
    if (b === 'side') n.m.head.lookAt(P.model.root.position);
  },
});
