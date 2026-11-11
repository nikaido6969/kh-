// ===== コース定義 =====
// コマンド: S(直線) C(カーブ: 正=右) L(縦ループ)
// opts: w 幅, sh 路肩, surf 路面, wall 壁, tunnel 'arch'|'tube', dy 高低差, bank バンク, cork ひねり,
//       bumps 凸凹, ramp {h,len}, gap 穴, items 位置, boost 位置, sign 看板, fit 自動長さ調整
const S = (len, o = {}) => Object.assign({ t: 's', len }, o);
const C = (ang, r, o = {}) => Object.assign({ t: 'c', ang, r }, o);
const L = (r, o = {}) => Object.assign({ t: 'l', r }, o);

const COURSES = [
  // ---------- 大地のオフロード ----------
  {
    id: 'kawara', name: 'じゃり道と川渡り', cup: 0, desc: 'ガタガタのじゃり道。川をザブザブ突っ切れ',
    w: 19, sh: 4, surf: 'gravel', shSurf: 'meadow', wall: 'none', edge: ['rock', 'bush'], gravity: 30, water: -1.2, waterColor: 0x3a9ad8,
    theme: { skyTop: 0x4a9ae8, skyBot: 0xe8f4e0, fog: 0xd8e8d0, fogFar: 560, ground: 0x6a9a4a, groundTex: 'meadow', sun: 1.05, amb: 0.8, groundDrop: 2 },
    deco: [['tree', 50], ['rock', 40], ['bush', 60], ['reed', 50]],
    music: { bpm: 140, root: 57, scale: 'dorian', seed: 11 },
    cmds: [
      S(130, { fit: 1, items: 0.5, bumps: 0.4 }), C(90, 40), S(60, { dy: -3 }), S(40, { dy: 3 }), C(-70, 35, { bumps: 0.5 }), C(160, 38, { items: 0.5 }),
      S(70, { fit: 2, dy: -3 }), S(50, { dy: 3, ramp: { h: 3, len: 18 } }), C(-60, 40), C(150, 40, { bumps: 0.6 }), C(90, 40), S(90),
    ],
  },
  {
    id: 'numa', name: '底なし沼の湿地', cup: 0, desc: '沼に沈むとノロノロ。丸太ジャンプで抜けろ',
    w: 20, sh: 5, surf: 'mudpath', shSurf: 'swampgrass', wall: 'none', edge: ['log', 'reed'], gravity: 30, water: -1.0, waterColor: 0x4a5a2a,
    theme: { skyTop: 0x5a6a4a, skyBot: 0xc8d0a0, fog: 0x8a9a6a, fogFar: 380, ground: 0x4a5a2a, groundTex: 'swampgrass', sun: 0.8, amb: 0.75, groundDrop: 2 },
    deco: [['deadtree', 50], ['reed', 90], ['mushroom', 16], ['stump', 30]],
    music: { bpm: 122, root: 52, scale: 'phrygian', seed: 19 },
    cmds: [
      S(120, { fit: 1, items: 0.5 }), C(90, 35, { dy: -2 }), S(80, { bumps: 0.5 }), C(-90, 30, { dy: 2 }), S(50, { ramp: { h: 3, len: 16 } }), S(30),
      C(180, 35, { dy: -2, items: 0.5 }), S(70, { fit: 2 }), C(-90, 30, { dy: 2 }), C(90, 35), C(90, 40, { boost: 0.5 }), C(90, 40), S(90),
    ],
  },
  {
    id: 'yamamichi', name: '60°激坂の山道', cup: 0, desc: '壁のような60°の登りと、落ちるような下り',
    w: 16, sh: 3, surf: 'trail', shSurf: 'mountain', wall: 'none', edge: ['rock', 'pine'], gravity: 30,
    theme: { skyTop: 0x3a6ad8, skyBot: 0xe8e0f0, fog: 0xd0d0e8, fogFar: 700, ground: 0x6a6a52, groundTex: 'mountain', sun: 1.05, amb: 0.75 },
    deco: [['pine', 90], ['rock', 40], ['mountain', 10]],
    music: { bpm: 152, root: 59, scale: 'minor', seed: 53 },
    cmds: [
      S(110, { fit: 1, items: 0.5 }), C(90, 35, { dy: 8 }), S(28, { dy: 45, lin: true }), S(30), C(180, 28, { bank: 20, items: 0.5 }),
      S(30, { dy: -48, lin: true, boost: 0.1 }), S(60, { bumps: 0.6, fit: 2 }), C(-90, 30, { dy: 10 }), S(22, { dy: -15, lin: true }), C(90, 35), C(90, 40), S(90),
    ],
  },
  {
    id: 'mori', name: '迷いの森', cup: 0, desc: '巨木と根っこの迷路。光るキノコが道しるべ',
    w: 18, sh: 4, surf: 'forest', shSurf: 'leaves', wall: 'none', edge: ['root', 'bush'], gravity: 30,
    theme: { skyTop: 0x2a5a3a, skyBot: 0x9ac88a, fog: 0x6a8a5a, fogFar: 360, ground: 0x3a5a2a, groundTex: 'leaves', sun: 0.8, amb: 0.8 },
    deco: [['bigtree', 50], ['mushroom', 50], ['glowflower', 80], ['bush', 40]],
    music: { bpm: 136, root: 57, scale: 'dorian', seed: 17 },
    cmds: [
      S(130, { fit: 1, items: 0.5 }), C(90, 40, { dy: 12 }), S(70, { fit: 2, bumps: 0.8 }), C(-60, 30, { dy: -14 }), C(60, 30),
      S(60, { ramp: { h: 4, len: 20 } }), S(40), C(90, 38, { dy: 10, items: 0.5 }), S(80, { bumps: 0.6 }), C(-60, 35, { dy: -10 }), C(60, 35),
      C(90, 40, { boost: 0.5 }), S(80, { dy: 2 }), C(90, 45), S(90),
    ],
  },
  // ---------- 惑星めぐり ----------
  {
    id: 'jupiter', name: '木星ガス雲', cup: 1, desc: '重力2.5倍(体感)。大赤斑のらせんを下れ',
    w: 19, sh: 2, surf: 'jupiter', shSurf: 'jupiter2', wall: 'none', edge: ['cloudlet'], gravity: 44, noGround: true,
    theme: { skyTop: 0x3a1a10, skyBot: 0xe0904a, fog: 0xd08a50, fogFar: 520, ground: null, sun: 1.0, amb: 0.7 },
    deco: [['cloud', 60]],
    music: { bpm: 128, root: 53, scale: 'minor', seed: 101 },
    cmds: [
      S(130, { fit: 1, items: 0.5 }), C(90, 45, { dy: 15, bank: 15 }), S(80, { boost: 0.5 }),
      C(450, 36, { dy: -30, bank: 20, items: 0.3 }), S(70, { fit: 2 }), C(90, 40, { dy: 15 }), S(60, { ramp: { h: 4, len: 22 } }),
      S(28, { gap: true }), S(60), C(90, 50), S(80),
    ],
  },
  {
    id: 'kinsei', name: '金星の灼熱火山', cup: 1, desc: '硫酸の雲と溶岩の海。60°の火山を登って飛び降りろ',
    w: 18, sh: 3, surf: 'venus', shSurf: 'basalt', wall: 'none', edge: ['lavarock'], gravity: 27, noGround: true, lava: true,
    theme: { skyTop: 0x8a5a10, skyBot: 0xffd060, fog: 0xe0a040, fogFar: 420, ground: null, sun: 1.1, amb: 0.7 },
    deco: [['lavarock', 40], ['crystal', 10], ['cloud', 30]],
    music: { bpm: 148, root: 50, scale: 'phrygian', seed: 141 },
    cmds: [
      S(120, { fit: 1, items: 0.5 }), C(90, 40, { dy: 10 }), S(35, { dy: 55, lin: true }), S(30), C(90, 30, { bank: 25 }), S(35, { dy: -55, lin: true, boost: 0.1 }),
      S(40, { ramp: { h: 5, len: 25 } }), S(30, { gap: true }), S(50), C(90, 35, { bumps: 0.6 }), S(80, { fit: 2, dy: -10, items: 0.5 }), C(90, 40), S(90),
    ],
  },
  {
    id: 'tsuki', name: '月面クレーター', cup: 1, desc: '重力1/6。クレーターを跳ねて宇宙を飛べ',
    w: 20, sh: 3, surf: 'moon', shSurf: 'moon2', wall: 'none', edge: ['moonrock'], gravity: 12, noGround: true, space: true,
    theme: { skyTop: 0x000006, skyBot: 0x101028, fog: 0x080818, fogFar: 900, ground: null, sun: 1.0, amb: 0.6 },
    deco: [['crater', 30], ['asteroid', 30], ['flag', 3]],
    music: { bpm: 124, root: 55, scale: 'lydian', seed: 131 },
    cmds: [
      S(140, { fit: 1, items: 0.5 }), C(90, 45, { bumps: 0.8 }), S(60, { ramp: { h: 5, len: 26 } }), S(60, { gap: true }), S(60, { fit: 2 }),
      C(90, 35, { dy: 15 }), S(60), C(-60, 40, { bumps: 1.0 }), C(60, 40, { dy: -15, items: 0.5 }), S(80, { boost: 0.3 }), S(40, { ramp: { h: 6, len: 26 } }),
      S(50, { gap: true }), S(60), C(90, 40), S(60), C(90, 45), S(90),
    ],
  },
  {
    id: 'kaitei', name: '海の底', cup: 1, desc: '浜辺から海へダイブ！水中はふわふわ',
    w: 20, sh: 4, surf: 'seabed', shSurf: 'sand', wall: 'none', edge: ['coral'], gravity: 30, water: -6,
    theme: { skyTop: 0x39a6ff, skyBot: 0xc8f2ff, fog: 0xbfe8ff, fogFar: 650, ground: 0xe0cf98, groundTex: 'sand', sun: 1.1, amb: 0.8, groundDrop: 2 },
    deco: [['coral', 60], ['seaweed', 80], ['rock', 30], ['palm', 10]],
    music: { bpm: 118, root: 62, scale: 'dorian', seed: 83 },
    cmds: [
      S(120, { fit: 1, items: 0.5 }), C(90, 40), S(80, { dy: -30, boost: 0.15 }), C(-70, 35), C(150, 40, { items: 0.5 }),
      S(90, { fit: 2, bumps: 0.3 }), C(-90, 30, { dy: -6 }), C(180, 40, { dy: 8 }), S(70, { ramp: { h: 4, len: 20 } }),
      S(40), C(100, 38, { dy: 28 }), S(90),
    ],
  },
  // ---------- 未知の世界 ----------
  {
    id: 'chitei', name: '地底マグマ洞窟', cup: 2, desc: '地下深くへ潜る。足元はマグマの海',
    w: 18, sh: 2, surf: 'cave', shSurf: 'rock2', wall: 'none', edge: ['crystal'], gravity: 30, noGround: true, lava: true,
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
  {
    id: 'kumo', name: '天空の浮島', cup: 2, desc: '浮島から浮島へ大ジャンプ。らせんで雲の上へ',
    w: 18, sh: 3, surf: 'islandgrass', shSurf: 'meadow', wall: 'none', edge: ['bush', 'flowerclump'], gravity: 22, noGround: true,
    theme: { skyTop: 0x5ab0ff, skyBot: 0xfff0f8, fog: 0xf0f4ff, fogFar: 800, ground: null, sun: 1.1, amb: 0.85 },
    deco: [['floatrock', 60], ['cloudpuff', 50], ['rainbow', 4]],
    music: { bpm: 132, root: 64, scale: 'lydian', seed: 61 },
    cmds: [
      S(140, { fit: 1, items: 0.5, boost: 0.85 }), S(40, { ramp: { h: 4, len: 24 } }), S(36, { gap: true }), C(90, 40, { dy: -10 }),
      S(60, { fit: 2 }), C(450, 32, { dy: 30, bank: 20, items: 0.4 }), C(90, 40), S(60, { ramp: { h: 4, len: 22 } }), S(40, { gap: true }),
      C(-60, 35, { dy: -10 }), C(60, 35, { dy: -10 }), C(90, 40, { dy: -10 }), S(90),
    ],
  },
  {
    id: 'suisho', name: '水晶の未知惑星', cup: 2, desc: '光る水晶の大地。60°の水晶山を越えて飛べ',
    w: 19, sh: 3, surf: 'crystalground', shSurf: 'crystal2', wall: 'none', edge: ['crystal'], gravity: 20, noGround: true, space: true,
    theme: { skyTop: 0x10002a, skyBot: 0x5a2a8a, fog: 0x3a1a5a, fogFar: 700, ground: null, sun: 0.9, amb: 0.7 },
    deco: [['crystal', 80], ['tentacle', 16], ['glowflower', 60], ['asteroid', 20]],
    music: { bpm: 144, root: 61, scale: 'lydian', seed: 151 },
    cmds: [
      S(130, { fit: 1, items: 0.5, boost: 0.85 }), C(90, 40, { dy: 15 }), S(30, { dy: 40, lin: true }), C(-90, 30), C(90, 30, { items: 0.5 }),
      S(28, { dy: -45, lin: true }), S(40, { ramp: { h: 5, len: 24 } }), S(40, { gap: true }), S(50), C(90, 35, { dy: -10, bank: 20 }),
      S(40), C(90, 40), S(70, { fit: 2 }), C(90, 40), S(90),
    ],
  },
  {
    id: 'bosen', name: 'クネクネ母船', cup: 2, desc: '星人の母船内部。ループ・ひねり・全部入り',
    w: 18, sh: 1.5, surf: 'alien', shSurf: 'neon2', wall: 'none', edge: ['tentacle_s'], gravity: 22, noGround: true, space: true,
    theme: { skyTop: 0x0a0018, skyBot: 0x2a0a3a, fog: 0x1a0828, fogFar: 800, ground: null, sun: 0.9, amb: 0.65 },
    deco: [['asteroid', 30], ['tentacle', 30]],
    music: { bpm: 168, root: 58, scale: 'phrygian', seed: 127 },
    cmds: [
      S(150, { fit: 1, items: 0.5, boost: 0.85 }), C(90, 40, { dy: 20, bank: 20 }), S(60, { tunnel: 'tube' }), L(20),
      S(80, { fit: 2, items: 0.5 }), C(90, 30), S(60, { ramp: { h: 4, len: 20 } }), S(34, { gap: true }),
      S(60, { boost: 0.5 }), C(90, 35, { dy: -20, bank: 25 }), S(110, { cork: 360 }), C(-60, 40, { tunnel: 'tube' }),
      C(60, 40, { tunnel: 'tube' }), C(90, 45, { items: 0.4 }), S(90),
    ],
  },
];

// ===== 風船バトル ステージ（正多角形リング：自動で閉じる） =====
const ARENA_BASE = { w: 56, sh: 2, gravity: 28, laps: 0, edge: ['rock', 'bush'] };
const ARENAS = [
  { id: 'b_niwa', name: '柴犬の庭ドーナツ', n: 4, side: 70, r: 36, hill: 6, surf: 'meadow', shSurf: 'meadow', wall: 'none', theme: { skyTop: 0x5aa8ff, skyBot: 0xe0f4ff, fog: 0xd8ecff, fogFar: 600, ground: 0x6cbf4a, groundTex: 'meadow', sun: 1, amb: 0.8 }, deco: [['bigtree', 20], ['mushroom', 20], ['glowflower', 40]] },
  { id: 'b_tsuki', name: '月面リング', n: 6, side: 50, r: 34, hill: 0, bumps: 1.2, surf: 'moon', shSurf: 'moon2', wall: 'none', edge: ['moonrock'], gravity: 12, noGround: true, space: true, theme: { skyTop: 0x000006, skyBot: 0x101028, fog: 0x080818, fogFar: 900, ground: null, sun: 1, amb: 0.6 }, deco: [['crater', 20], ['asteroid', 20]] },
  { id: 'b_kaitei', name: '海底神殿', n: 4, side: 60, r: 40, hill: 0, surf: 'seabed', shSurf: 'sand', wall: 'none', edge: ['coral'], water: 30, theme: { skyTop: 0x39a6ff, skyBot: 0xc8f2ff, fog: 0xbfe8ff, fogFar: 650, ground: 0xe0cf98, groundTex: 'sand', sun: 1.1, amb: 0.8 }, deco: [['coral', 40], ['seaweed', 50], ['pillar', 16]] },
  { id: 'b_magma', name: 'マグマ大鍋', n: 3, side: 70, r: 40, hill: 0, bumps: 0.6, surf: 'cave', shSurf: 'rock2', wall: 'none', edge: ['crystal'], noGround: true, lava: true, theme: { skyTop: 0x0a0508, skyBot: 0x3a0d06, fog: 0x2a0806, fogFar: 420, ground: null, sun: 0.4, amb: 0.5 }, deco: [['crystal', 40], ['stalag', 20]] },
  { id: 'b_okashi', name: 'お菓子の城', n: 4, side: 56, r: 38, hill: 8, surf: 'candy2', shSurf: 'candy2', wall: 'none', edge: ['lollipop_s'], theme: { skyTop: 0xff9ad8, skyBot: 0xfff0f8, fog: 0xffe0f0, fogFar: 600, ground: 0xffc8e0, groundTex: 'candy2', sun: 1.05, amb: 0.85 }, deco: [['lollipop', 40], ['mushroom', 20]] },
  { id: 'b_kumo', name: '雲の上リング', n: 5, side: 50, r: 36, hill: 0, surf: 'islandgrass', shSurf: 'meadow', wall: 'none', edge: ['bush', 'flowerclump'], gravity: 20, noGround: true, theme: { skyTop: 0x5ab0ff, skyBot: 0xfff0f8, fog: 0xf0f4ff, fogFar: 800, ground: null, sun: 1.1, amb: 0.85 }, deco: [['cloudpuff', 40], ['floatrock', 30], ['rainbow', 3]] },
  { id: 'b_jupiter', name: '木星の大渦', n: 6, side: 46, r: 36, hill: 0, bumps: 0.5, surf: 'jupiter', shSurf: 'jupiter2', wall: 'none', edge: ['cloudlet'], gravity: 40, noGround: true, theme: { skyTop: 0x3a1a10, skyBot: 0xe0904a, fog: 0xd08a50, fogFar: 520, ground: null, sun: 1, amb: 0.7 }, deco: [['cloud', 40]] },
  { id: 'b_bosen', name: '母船格納庫', n: 4, side: 64, r: 34, hill: 5, surf: 'alien', shSurf: 'neon2', wall: 'none', edge: ['tentacle_s'], gravity: 22, noGround: true, space: true, theme: { skyTop: 0x0a0018, skyBot: 0x2a0a3a, fog: 0x1a0828, fogFar: 800, ground: null, sun: 0.9, amb: 0.65 }, deco: [['tentacle', 20], ['asteroid', 20]] },
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
  { name: '大地のオフロードカップ', icon: '🪨' },
  { name: '惑星めぐりカップ', icon: '🪐' },
  { name: '未知の世界カップ', icon: '👽' },
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
