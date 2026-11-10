// ===== コース定義 =====
// コマンド: S(直線) C(カーブ: 正=右) L(縦ループ)
// opts: w 幅, sh 路肩, surf 路面, wall 壁, tunnel 'arch'|'tube', dy 高低差, bank バンク, cork ひねり,
//       bumps 凸凹, ramp {h,len}, gap 穴, items 位置, boost 位置, sign 看板, fit 自動長さ調整
const S = (len, o = {}) => Object.assign({ t: 's', len }, o);
const C = (ang, r, o = {}) => Object.assign({ t: 'c', ang, r }, o);
const L = (r, o = {}) => Object.assign({ t: 'l', r }, o);

const COURSES = [
  // ---------- 柴犬カップ（大地のオフロード） ----------
  {
    id: 'mori', name: '苔むす巨木の森', cup: 0, desc: '根っこだらけの苔道。巨大キノコの間を駆け抜けろ',
    w: 20, sh: 6, surf: 'moss', shSurf: 'mud', wall: 'logs', gravity: 30,
    theme: { skyTop: 0x3a7a5a, skyBot: 0xcfe8b0, fog: 0xb8d8a0, fogFar: 520, ground: 0x4a7a3a, groundTex: 'moss2', sun: 0.95, amb: 0.8 },
    deco: [['bigtree', 34], ['mushroom', 40], ['glowflower', 60], ['rock', 20]],
    music: { bpm: 136, root: 57, scale: 'dorian', seed: 11 },
    cmds: [
      S(130, { fit: 1, items: 0.5 }), C(90, 40, { dy: 12 }), S(70, { fit: 2, bumps: 0.8 }), C(-60, 30, { dy: -14 }), C(60, 30),
      S(60, { ramp: { h: 4, len: 20 } }), S(40), C(90, 38, { dy: 10, items: 0.5 }), S(80, { bumps: 0.6 }), C(-60, 35, { dy: -10 }), C(60, 35),
      C(90, 40, { boost: 0.5 }), S(80, { dy: 2 }), C(90, 45), S(90),
    ],
  },
  {
    id: 'offroad', name: '泥んこジャングル', cup: 0, desc: '泥沼・丸太・ジャンプ台のワイルドコース',
    w: 22, sh: 8, surf: 'dirt', shSurf: 'mud', wall: 'logs', gravity: 30,
    theme: { skyTop: 0x5a9a7a, skyBot: 0xf0e0b0, fog: 0xd8d0a0, fogFar: 560, ground: 0x6a5a30, groundTex: 'dirt', sun: 1.0, amb: 0.75 },
    deco: [['palm', 40], ['bigtree', 16], ['rock', 30], ['stump', 24], ['mushroom', 14]],
    music: { bpm: 146, root: 55, scale: 'minor', seed: 41 },
    cmds: [
      S(120, { fit: 1, items: 0.5 }), C(100, 40, { dy: 8 }), S(70, { ramp: { h: 3, len: 18 } }), S(50, { fit: 2 }),
      C(-90, 30, { bumps: 0.6 }), C(140, 36, { dy: -8 }), S(90, { bumps: 0.9, items: 0.6 }), C(70, 40),
      S(60, { ramp: { h: 4, len: 20 } }), S(60), C(-40, 50), C(180, 42), S(90, { boost: 0.4 }),
    ],
  },
  {
    id: 'gake', name: '超激坂マウンテン', cup: 0, desc: '壁みたいな登り坂と、落ちるような下り坂',
    w: 18, sh: 3, surf: 'cliff', shSurf: 'rock2', wall: 'rock', gravity: 30,
    theme: { skyTop: 0x4a6ad8, skyBot: 0xf0d8f0, fog: 0xd8d0f0, fogFar: 650, ground: 0x7a6a5a, groundTex: 'cliff', sun: 1.05, amb: 0.75 },
    deco: [['floatrock', 30], ['pine', 50], ['crystal', 16]],
    music: { bpm: 150, root: 59, scale: 'minor', seed: 53 },
    cmds: [
      S(120, { fit: 1, items: 0.5 }), C(90, 40, { dy: 20 }), S(70, { dy: 35, lin: true }), C(180, 30, { bank: 25 }),
      S(90, { dy: -55, lin: true, boost: 0.2 }), S(40, { ramp: { h: 5, len: 25 } }), S(30, { gap: true }), S(50, { fit: 2 }),
      C(-90, 30, { dy: 15, bumps: 0.5 }), C(90, 35, { dy: -15 }), C(90, 40, { items: 0.5 }), S(100),
    ],
  },
  {
    id: 'canyon', name: '大ジャンプ渓谷', cup: 0, desc: '赤い谷を飛び越える巨大ジャンプ台',
    w: 20, sh: 4, surf: 'redsand', shSurf: 'sand', wall: 'rock', gravity: 30, groundDrop: 45,
    theme: { skyTop: 0x4aa3e8, skyBot: 0xffd9a8, fog: 0xf0c898, fogFar: 700, ground: 0xc77a44, groundTex: 'sand', sun: 1.15, amb: 0.7 },
    deco: [['mesa', 26], ['cactus', 50], ['rock', 30]],
    music: { bpm: 138, root: 52, scale: 'dorian', seed: 79 },
    cmds: [
      S(140, { fit: 1, items: 0.4, boost: 0.8 }), S(40, { ramp: { h: 5, len: 30 } }), S(30, { gap: true }), S(60),
      C(90, 40, { dy: -10 }), S(80, { fit: 2, boost: 0.7 }), S(40, { ramp: { h: 6, len: 30 } }), S(32, { gap: true }),
      S(50, { items: 0.5, dy: -8 }), C(90, 38), S(70, { boost: 0.6 }), S(40, { ramp: { h: 5, len: 28 } }),
      S(28, { gap: true }), S(50), C(-50, 40, { dy: 8 }), C(50, 40), C(90, 45, { dy: 10 }), S(90),
    ],
  },
  // ---------- カメムシカップ（海・空・地底） ----------
  {
    id: 'kaitei', name: '海底トンネル', cup: 1, desc: '浜辺から海へダイブ！水中はふわふわ',
    w: 20, sh: 4, surf: 'sand', shSurf: 'sand', wall: 'coral', gravity: 30, water: -6,
    theme: { skyTop: 0x39a6ff, skyBot: 0xc8f2ff, fog: 0xbfe8ff, fogFar: 650, ground: 0xe0cf98, groundTex: 'sand', sun: 1.1, amb: 0.8, groundDrop: 4 },
    deco: [['coral', 60], ['seaweed', 80], ['rock', 30], ['palm', 10]],
    music: { bpm: 118, root: 62, scale: 'dorian', seed: 83 },
    cmds: [
      S(120, { fit: 1, items: 0.5 }), C(90, 40), S(80, { dy: -30, boost: 0.15 }), C(-70, 35), C(150, 40, { items: 0.5 }),
      S(90, { fit: 2, bumps: 0.3 }), C(-90, 30, { dy: -6 }), C(180, 40, { dy: 8 }), S(70, { ramp: { h: 4, len: 20 } }),
      S(40), C(100, 38, { dy: 28 }), S(90),
    ],
  },
  {
    id: 'kumo', name: '天空の浮島', cup: 1, desc: '浮島から浮島へ大ジャンプ。らせんで雲の上へ',
    w: 18, sh: 3, surf: 'cloudroad', shSurf: 'grass', wall: 'glow', gravity: 22, noGround: true,
    theme: { skyTop: 0x5ab0ff, skyBot: 0xfff0f8, fog: 0xf0f4ff, fogFar: 800, ground: null, sun: 1.1, amb: 0.85 },
    deco: [['floatrock', 60], ['cloudpuff', 50], ['rainbow', 4]],
    music: { bpm: 132, root: 64, scale: 'lydian', seed: 61 },
    cmds: [
      S(140, { fit: 1, items: 0.5, boost: 0.85 }), S(40, { ramp: { h: 4, len: 24 } }), S(36, { gap: true }), C(90, 40, { wall: false, dy: -10 }),
      S(60, { fit: 2 }), C(450, 32, { dy: 30, bank: 20, items: 0.4 }), C(90, 40), S(60, { ramp: { h: 4, len: 22 } }), S(40, { gap: true }),
      C(-60, 35, { dy: -10 }), C(60, 35, { dy: -10, wall: false }), C(90, 40, { dy: -10 }), S(90),
    ],
  },
  {
    id: 'coaster', name: '雲上ジェットコースター', cup: 1, desc: '一回転ループ・ひねり・急降下の絶叫レール',
    w: 15, sh: 1, surf: 'rail', shSurf: 'steel', wall: 'rail', gravity: 32, noGround: true,
    theme: { skyTop: 0xff9ec4, skyBot: 0xffe6c8, fog: 0xffe0d0, fogFar: 800, ground: null, sun: 1.05, amb: 0.85 },
    deco: [['cloudpuff', 60], ['balloon', 30], ['ferris', 1]],
    music: { bpm: 160, root: 64, scale: 'major', seed: 67 },
    cmds: [
      S(110, { fit: 1, items: 0.5 }), C(90, 35, { dy: 30 }), S(60, { dy: 20, fit: 2 }), C(90, 30, { bank: 30 }),
      S(70, { dy: -45, lin: true, boost: 0.25 }), L(20), S(60, { items: 0.5 }), C(90, 30, { bank: 30, dy: 10 }),
      S(120, { cork: 360, dy: -5 }), C(-90, 32, { bank: 30 }), C(90, 32, { bank: 30, dy: -10 }), S(60, { ramp: { h: 3, len: 15 } }), S(26, { gap: true }),
      S(40), C(90, 32, { bank: 25 }), S(80),
    ],
  },
  {
    id: 'chitei', name: '地底マグマ洞窟', cup: 1, desc: '地下深くへ潜る。足元はマグマの海',
    w: 18, sh: 2, surf: 'rock', shSurf: 'rock2', wall: 'crystal', gravity: 30, noGround: true, lava: true,
    theme: { skyTop: 0x0a0508, skyBot: 0x2a0d06, fog: 0x1a0806, fogFar: 380, ground: null, sun: 0.35, amb: 0.45 },
    deco: [['crystal', 60], ['stalag', 40], ['mushroom', 20]],
    music: { bpm: 152, root: 50, scale: 'phrygian', seed: 97 },
    cmds: [
      S(110, { fit: 1, items: 0.5, tunnel: 'tube' }), C(90, 35, { tunnel: 'tube', dy: -15 }), S(70, { boost: 0.5 }),
      C(-90, 30, { tunnel: 'tube', dy: -10 }), C(180, 34, { dy: -5, items: 0.6 }), S(60, { fit: 2, tunnel: 'tube' }),
      C(90, 30, { tunnel: 'tube', dy: 10 }), S(70, { ramp: { h: 4, len: 20 } }), S(28, { gap: true }), S(50),
      C(90, 40, { dy: 20 }), S(80, { tunnel: 'tube' }),
    ],
  },
  // ---------- くねくねカップ（宇宙・空想） ----------
  {
    id: 'jupiter', name: '木星ガス雲', cup: 2, desc: '重力2.5倍(体感)。大赤斑のらせんを下れ',
    w: 19, sh: 2, surf: 'jupiter', shSurf: 'jupiter2', wall: 'glow', gravity: 44, noGround: true,
    theme: { skyTop: 0x3a1a10, skyBot: 0xe0904a, fog: 0xd08a50, fogFar: 520, ground: null, sun: 1.0, amb: 0.7 },
    deco: [['cloud', 60]],
    music: { bpm: 128, root: 53, scale: 'minor', seed: 101 },
    cmds: [
      S(130, { fit: 1, items: 0.5 }), C(90, 45, { dy: 15, bank: 15 }), S(80, { wall: false, boost: 0.5 }),
      C(450, 36, { dy: -30, bank: 20, items: 0.3 }), S(70, { fit: 2 }), C(90, 40, { dy: 15 }), S(60, { ramp: { h: 4, len: 22 } }),
      S(28, { gap: true }), S(60), C(90, 50), S(80),
    ],
  },
  {
    id: 'tsuki', name: '月面クレーター', cup: 2, desc: '重力1/6。クレーターを跳ねて宇宙を飛べ',
    w: 20, sh: 3, surf: 'moon', shSurf: 'moon2', wall: 'glow', gravity: 12, noGround: true, space: true, moonGround: true,
    theme: { skyTop: 0x000006, skyBot: 0x101028, fog: 0x080818, fogFar: 900, ground: null, sun: 1.0, amb: 0.6 },
    deco: [['crater', 30], ['asteroid', 30], ['flag', 3]],
    music: { bpm: 124, root: 55, scale: 'lydian', seed: 131 },
    cmds: [
      S(140, { fit: 1, items: 0.5 }), C(90, 45, { bumps: 0.8 }), S(60, { ramp: { h: 5, len: 26 } }), S(60, { gap: true }), S(60, { fit: 2 }),
      C(90, 35, { dy: 15 }), S(60), C(-60, 40, { bumps: 1.0 }), C(60, 40, { dy: -15, items: 0.5 }), S(80, { boost: 0.3 }), S(40, { ramp: { h: 6, len: 26 } }),
      S(50, { gap: true }), S(60), C(90, 40, { wall: false }), S(60), C(90, 45), S(90),
    ],
  },
  {
    id: 'uchuu', name: '宇宙ステーション', cup: 2, desc: '低重力。壁のない場所から落ちると宇宙の彼方へ',
    w: 18, sh: 1, surf: 'neon', shSurf: 'neon2', wall: 'glow', gravity: 16, noGround: true, space: true,
    theme: { skyTop: 0x000008, skyBot: 0x0a0a2a, fog: 0x050518, fogFar: 900, ground: null, sun: 0.9, amb: 0.6 },
    deco: [['asteroid', 50], ['satellite', 8]],
    music: { bpm: 140, root: 57, scale: 'lydian', seed: 113 },
    cmds: [
      S(140, { fit: 1, items: 0.5, boost: 0.8 }), C(90, 40, { wall: false }), S(80, { ramp: { h: 3, len: 20 }, wall: false }),
      S(46, { gap: true }), S(60, { wall: false }), C(90, 30, { dy: 20, wall: false, bank: 20 }), S(60, { fit: 2 }),
      C(-60, 35, { bank: 25, items: 0.5 }), C(60, 35, { bank: 25 }), S(100, { cork: 360, boost: 0.15 }), C(90, 40, { dy: -20, bank: 20 }),
      S(60), C(90, 42, { wall: false }), S(90),
    ],
  },
  {
    id: 'bosen', name: 'クネクネ母船', cup: 2, desc: '星人の母船内部。全部入りの最終コース',
    w: 18, sh: 1.5, surf: 'alien', shSurf: 'neon2', wall: 'glow', gravity: 22, noGround: true, space: true,
    theme: { skyTop: 0x0a0018, skyBot: 0x2a0a3a, fog: 0x1a0828, fogFar: 800, ground: null, sun: 0.9, amb: 0.65 },
    deco: [['asteroid', 30], ['tentacle', 30]],
    music: { bpm: 168, root: 58, scale: 'phrygian', seed: 127 },
    cmds: [
      S(150, { fit: 1, items: 0.5, boost: 0.85 }), C(90, 40, { dy: 20, bank: 20 }), S(60, { tunnel: 'tube' }), L(20),
      S(80, { fit: 2, items: 0.5 }), C(90, 30, { wall: false }), S(60, { ramp: { h: 4, len: 20 } }), S(34, { gap: true }),
      S(60, { boost: 0.5 }), C(90, 35, { dy: -20, bank: 25 }), S(110, { cork: 360 }), C(-60, 40, { tunnel: 'tube' }),
      C(60, 40, { tunnel: 'tube' }), C(90, 45, { items: 0.4 }), S(90),
    ],
  },
];

// ===== 風船バトル ステージ（正多角形リング：自動で閉じる） =====
const ARENA_BASE = { w: 56, sh: 2, gravity: 28, laps: 0 };
const ARENAS = [
  { id: 'b_niwa', name: '柴犬の庭ドーナツ', n: 4, side: 70, r: 36, hill: 6, surf: 'moss', shSurf: 'grass', wall: 'hedge', theme: { skyTop: 0x5aa8ff, skyBot: 0xe0f4ff, fog: 0xd8ecff, fogFar: 600, ground: 0x6cbf4a, groundTex: 'grass', sun: 1, amb: 0.8 }, deco: [['bigtree', 20], ['mushroom', 20], ['glowflower', 40]] },
  { id: 'b_tsuki', name: '月面リング', n: 6, side: 50, r: 34, hill: 0, bumps: 1.2, surf: 'moon', shSurf: 'moon2', wall: 'glow', gravity: 12, noGround: true, space: true, theme: { skyTop: 0x000006, skyBot: 0x101028, fog: 0x080818, fogFar: 900, ground: null, sun: 1, amb: 0.6 }, deco: [['crater', 20], ['asteroid', 20]] },
  { id: 'b_kaitei', name: '海底神殿', n: 4, side: 60, r: 40, hill: 0, surf: 'sand', shSurf: 'sand', wall: 'coral', water: 30, theme: { skyTop: 0x39a6ff, skyBot: 0xc8f2ff, fog: 0xbfe8ff, fogFar: 650, ground: 0xe0cf98, groundTex: 'sand', sun: 1.1, amb: 0.8 }, deco: [['coral', 40], ['seaweed', 50], ['pillar', 16]] },
  { id: 'b_magma', name: 'マグマ大鍋', n: 3, side: 70, r: 40, hill: 0, bumps: 0.6, surf: 'rock', shSurf: 'rock2', wall: 'crystal', noGround: true, lava: true, theme: { skyTop: 0x0a0508, skyBot: 0x3a0d06, fog: 0x2a0806, fogFar: 420, ground: null, sun: 0.4, amb: 0.5 }, deco: [['crystal', 40], ['stalag', 20]] },
  { id: 'b_okashi', name: 'お菓子の城', n: 4, side: 56, r: 38, hill: 8, surf: 'candy', shSurf: 'candy2', wall: 'candywall', theme: { skyTop: 0xff9ad8, skyBot: 0xfff0f8, fog: 0xffe0f0, fogFar: 600, ground: 0xffc8e0, groundTex: 'candy2', sun: 1.05, amb: 0.85 }, deco: [['lollipop', 40], ['mushroom', 20]] },
  { id: 'b_kumo', name: '雲の上リング', n: 5, side: 50, r: 36, hill: 0, surf: 'cloudroad', shSurf: 'grass', wall: 'glow', gravity: 20, noGround: true, theme: { skyTop: 0x5ab0ff, skyBot: 0xfff0f8, fog: 0xf0f4ff, fogFar: 800, ground: null, sun: 1.1, amb: 0.85 }, deco: [['cloudpuff', 40], ['floatrock', 30], ['rainbow', 3]] },
  { id: 'b_jupiter', name: '木星の大渦', n: 6, side: 46, r: 36, hill: 0, bumps: 0.5, surf: 'jupiter', shSurf: 'jupiter2', wall: 'glow', gravity: 40, noGround: true, theme: { skyTop: 0x3a1a10, skyBot: 0xe0904a, fog: 0xd08a50, fogFar: 520, ground: null, sun: 1, amb: 0.7 }, deco: [['cloud', 40]] },
  { id: 'b_bosen', name: '母船格納庫', n: 4, side: 64, r: 34, hill: 5, surf: 'alien', shSurf: 'neon2', wall: 'glow', gravity: 22, noGround: true, space: true, theme: { skyTop: 0x0a0018, skyBot: 0x2a0a3a, fog: 0x1a0828, fogFar: 800, ground: null, sun: 0.9, amb: 0.65 }, deco: [['tentacle', 20], ['asteroid', 20]] },
].map(a => {
  const cmds = [];
  for (let i = 0; i < a.n; i++) {
    const dy = a.hill && a.n % 2 === 0 ? (i % 2 ? -a.hill : a.hill) : 0;
    cmds.push(S(a.side, { items: 0.5, dy, bumps: a.bumps }));
    cmds.push(C(360 / a.n, a.r, { items: i % 2 ? 0.5 : undefined }));
  }
  return Object.assign({}, ARENA_BASE, a, { battle: true, cmds, music: { bpm: 156, root: 57 + (a.n % 3), scale: 'minor', seed: 200 + a.n * 7 + a.side } });
});

const CUPS = [
  { name: '柴犬カップ', icon: '🐕' },
  { name: 'カメムシカップ', icon: '🪲' },
  { name: 'くねくねカップ', icon: '👽' },
];

// ===== タートル生成（自動クローズ付き） =====
function cmdLength(c) {
  if (c.t === 's') return c.len;
  if (c.t === 'c') return Math.abs(c.ang) * Math.PI / 180 * c.r;
  return Math.PI * 2 * c.r;
}

function turtleRun(cmds) {
  let x = 0, y = 0, z = 0, th = 0;
  const pts = [];
  const dirs = [];
  cmds.forEach((c, ci) => {
    const len = cmdLength(c);
    const n = Math.max(1, Math.round(len / 1));
    const y0 = y, x0 = x, z0 = z, th0 = th;
    dirs[ci] = [Math.sin(th), Math.cos(th)];
    for (let k = 1; k <= n; k++) {
      const tt = k / n;
      let loop = false;
      if (c.t === 's') {
        x += Math.sin(th) * len / n; z += Math.cos(th) * len / n;
      } else if (c.t === 'c') {
        const a = c.ang * Math.PI / 180;
        th -= a / n;
        x += Math.sin(th) * len / n; z += Math.cos(th) * len / n;
      } else {
        loop = true;
        const a = Math.PI * 2 * tt;
        const fx = Math.sin(th0), fz = Math.cos(th0);
        const rx = -Math.cos(th0), rz = Math.sin(th0);
        const shift = 18 * (tt * tt * (3 - 2 * tt));
        x = x0 + fx * c.r * Math.sin(a) + rx * shift;
        z = z0 + fz * c.r * Math.sin(a) + rz * shift;
        y = y0 + c.r * (1 - Math.cos(a));
      }
      if (!loop) {
        const e = c.lin ? tt : tt * tt * (3 - 2 * tt);
        y = y0 + (c.dy || 0) * e;
      }
      pts.push({ x, y, z, ci, tt, loop });
    }
    if (c.t === 'l') y = y0;
  });
  return { pts, dirs, end: [x, y, z], th };
}

function turtle(def) {
  const lay = (typeof LAYOUT !== 'undefined' && LAYOUT[def.id]) || [];
  let cmds = def.cmds.map((c, i) => {
    const o = Object.assign({}, c);
    if (lay[i] != null) { if (o.t === 's') o.len = lay[i]; else if (o.t === 'c') o.r = lay[i]; }
    return o;
  });
  let r = turtleRun(cmds);
  const i1 = cmds.findIndex(c => c.fit === 1), i2 = cmds.findIndex(c => c.fit === 2);
  if (i1 >= 0 && i2 >= 0) {
    const [ax, az] = r.dirs[i1], [bx, bz] = r.dirs[i2];
    const ex = -r.end[0], ez = -r.end[2];
    const det = ax * bz - az * bx;
    if (Math.abs(det) > 1e-3) {
      const a = (ex * bz - ez * bx) / det;
      const b = (ax * ez - az * ex) / det;
      cmds[i1].len += a; cmds[i2].len += b;
      r = turtleRun(cmds);
    }
  }
  r.cmds = cmds;
  return r;
}

if (typeof module !== 'undefined') module.exports = { COURSES, ARENAS, turtle, cmdLength };
