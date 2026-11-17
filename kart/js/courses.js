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
      S(130, { fit: 1, items: 0.5, bumps: 0.4 }), C(90, 40, { arch: 'rock' }), S(60, { fit: 2, dy: -3, w: 27 }), S(40, { dy: 3 }), C(-60, 35, { bumps: 0.5, w: 12 }), C(60, 35),
      S(50, { dy: 8 }), S(40, { dy: -9, ramp: { h: 3, len: 16 } }), C(90, 38, { items: 0.5 }), S(70, { dy: -2, w: 28 }), S(50, { dy: 3, arch: 'fall' }), C(-45, 36, { dy: 6, w: 12 }),
      C(45, 36, { dy: -6 }), C(90, 40, { bumps: 0.6 }), S(60, { boost: 0.5 }), C(90, 40), S(90),
    ],
  },
  {
    id: 'numa', name: '底なし沼の湿地', cup: 0, desc: '沼に沈むとノロノロ。丸太ジャンプで抜けろ',
    w: 20, sh: 5, surf: 'mudpath', shSurf: 'swampgrass', wall: 'none', edge: ['log', 'reed'], gravity: 30, water: -1.0, waterColor: 0x4a5a2a,
    theme: { skyTop: 0x5a6a4a, skyBot: 0xc8d0a0, fog: 0x8a9a6a, fogFar: 380, ground: 0x4a5a2a, groundTex: 'swampgrass', sun: 0.8, amb: 0.75, groundDrop: 2 },
    deco: [['deadtree', 50], ['reed', 90], ['mushroom', 16], ['stump', 30]],
    music: { bpm: 122, root: 52, scale: 'phrygian', seed: 19 },
    cmds: [
      S(120, { fit: 1, items: 0.5 }), C(90, 35, { dy: -2, arch: 'rock' }), S(80, { fit: 2, bumps: 0.5, w: 27 }), C(-90, 30, { dy: 2, w: 12 }), S(50, { ramp: { h: 3, len: 16 } }), S(30),
      C(90, 30, { dy: -2 }), C(90, 35, { items: 0.5 }), S(60, { w: 11, dy: 3 }), C(-60, 30, { dy: -3 }), C(60, 30), S(40, { ramp: { h: 3, len: 16 } }), S(30, { w: 26 }),
      C(90, 35, { boost: 0.5, arch: 'rib' }), C(-45, 30), C(45, 30, { dy: 2 }), C(90, 40), S(90),
    ],
  },
  {
    id: 'yamamichi', name: '60°激坂の山道', cup: 0, desc: '壁のような60°の登りと、落ちるような下り',
    w: 16, sh: 3, surf: 'trail', shSurf: 'mountain', wall: 'none', edge: ['rock', 'pine'], gravity: 30,
    theme: { skyTop: 0x3a6ad8, skyBot: 0xe8e0f0, fog: 0xd0d0e8, fogFar: 700, ground: 0x6a6a52, groundTex: 'mountain', sun: 1.05, amb: 0.75 },
    deco: [['pine', 90], ['rock', 40], ['mountain', 10]],
    music: { bpm: 152, root: 59, scale: 'minor', seed: 53 },
    cmds: [
      S(110, { fit: 1, items: 0.5 }), C(90, 35, { dy: 8, arch: 'torii' }), S(60, { fit: 2 }), S(28, { dy: 45, lin: true }), S(30, { w: 12 }), C(180, 28, { bank: 20, items: 0.5 }),
      S(30, { dy: -48, lin: true, boost: 0.1 }), S(40, { ramp: { h: 4, len: 20 } }), S(40, { bumps: 0.6 }), C(-90, 30, { dy: 10, tunnel: 'arch' }), S(22, { dy: -15, lin: true }),
      C(-90, 26, { w: 12 }), C(180, 26, { dy: 6 }), S(24, { dy: 20, lin: true }), S(24, { dy: -26, lin: true, arch: 'rock' }), C(90, 35), C(90, 40, { items: 0.5 }), S(90),
    ],
  },
  {
    id: 'mori', name: '迷いの森', cup: 0, desc: '巨木と根っこの迷路。光るキノコが道しるべ',
    w: 18, sh: 4, surf: 'forest', shSurf: 'leaves', wall: 'none', edge: ['root', 'bush'], gravity: 30,
    theme: { skyTop: 0x2a5a3a, skyBot: 0x9ac88a, fog: 0x6a8a5a, fogFar: 360, ground: 0x3a5a2a, groundTex: 'leaves', sun: 0.8, amb: 0.8 },
    deco: [['bigtree', 50], ['mushroom', 50], ['glowflower', 80], ['bush', 40]],
    music: { bpm: 136, root: 57, scale: 'dorian', seed: 17 },
    cmds: [
      S(130, { fit: 1, items: 0.5 }), C(90, 40, { dy: 12, arch: 'torii' }), S(70, { fit: 2, bumps: 0.8, w: 12 }), C(-60, 30, { dy: -14 }), C(60, 30, { tunnel: 'arch' }),
      S(60, { ramp: { h: 4, len: 20 } }), S(40, { w: 27 }), C(90, 38, { dy: 10, items: 0.5 }), S(26, { dy: -22, lin: true }), S(50, { bumps: 0.6, arch: 'rock' }), C(-60, 35, { dy: 12, w: 12 }), C(60, 35),
      C(90, 40, { boost: 0.5 }), S(60, { dy: 2 }), C(-45, 30), C(45, 30), C(90, 45), S(90),
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
      S(130, { fit: 1, items: 0.5 }), C(90, 45, { dy: 15, bank: 15, arch: 'ring' }), S(80, { fit: 2, boost: 0.5, w: 12 }),
      C(450, 36, { dy: -30, bank: 20, items: 0.3 }), S(70, { w: 26 }), S(26, { dy: -22, lin: true }), C(90, 40, { dy: 15 }), S(60, { ramp: { h: 4, len: 22 } }),
      S(28, { gap: true }), S(50, { arch: 'ring' }), S(26, { dy: 22, lin: true }), C(-60, 35), C(60, 35, { items: 0.5 }), C(90, 50), S(80),
    ],
  },
  {
    id: 'kinsei', name: '金星の灼熱火山', cup: 1, desc: '硫酸の雲と溶岩の海。60°の火山を登って飛び降りろ',
    w: 18, sh: 3, surf: 'venus', shSurf: 'basalt', wall: 'none', edge: ['lavarock'], gravity: 27, noGround: true, lava: true,
    theme: { skyTop: 0x8a5a10, skyBot: 0xffd060, fog: 0xe0a040, fogFar: 420, ground: null, sun: 1.1, amb: 0.7 },
    deco: [['lavarock', 40], ['crystal', 10], ['cloud', 30]],
    music: { bpm: 148, root: 50, scale: 'phrygian', seed: 141 },
    cmds: [
      S(120, { fit: 1, items: 0.5 }), C(90, 40, { dy: 10, arch: 'rock' }), S(60, { fit: 2, w: 12 }), S(35, { dy: 55, lin: true }), S(30), C(90, 30, { bank: 25 }), S(35, { dy: -55, lin: true, boost: 0.1 }),
      S(40, { ramp: { h: 5, len: 25 } }), S(30, { gap: true }), S(50, { w: 26 }), C(-60, 30, { bumps: 0.6 }), C(60, 30, { tunnel: 'tube' }), C(90, 35),
      S(24, { dy: 18, lin: true }), S(24, { dy: -28, lin: true, items: 0.5 }), C(90, 40, { arch: 'rock' }), S(90),
    ],
  },
  {
    id: 'tsuki', name: '月面クレーター', cup: 1, desc: '重力1/6。クレーターを跳ねて宇宙を飛べ',
    w: 20, sh: 3, surf: 'moon', shSurf: 'moon2', wall: 'none', edge: ['moonrock'], gravity: 12, noGround: true, space: true,
    theme: { skyTop: 0x000006, skyBot: 0x101028, fog: 0x080818, fogFar: 900, ground: null, sun: 1.0, amb: 0.6 },
    deco: [['crater', 30], ['asteroid', 30], ['flag', 3]],
    music: { bpm: 124, root: 55, scale: 'lydian', seed: 131 },
    cmds: [
      S(140, { fit: 1, items: 0.5 }), C(90, 45, { bumps: 0.8, arch: 'ring' }), S(60, { fit: 2, w: 12 }), S(60, { ramp: { h: 5, len: 26 } }), S(60, { gap: true }), S(50),
      C(90, 35, { dy: 15 }), S(26, { dy: -25, lin: true }), C(-60, 40, { bumps: 1.0, w: 27 }), C(60, 40, { dy: 10, items: 0.5 }), S(80, { boost: 0.3 }), S(40, { ramp: { h: 6, len: 26 } }),
      S(50, { gap: true }), S(60, { arch: 'ring' }), C(90, 40), S(60, { w: 12 }), C(90, 45), S(90),
    ],
  },
  {
    id: 'kaitei', name: '海の底', cup: 1, desc: '浜辺から海へダイブ！水中はふわふわ',
    w: 20, sh: 4, surf: 'seabed', shSurf: 'sand', wall: 'none', edge: ['coral'], gravity: 30, water: -6,
    theme: { skyTop: 0x39a6ff, skyBot: 0xc8f2ff, fog: 0xbfe8ff, fogFar: 650, ground: 0xe0cf98, groundTex: 'sand', sun: 1.1, amb: 0.8, groundDrop: 2 },
    deco: [['coral', 60], ['seaweed', 80], ['rock', 30], ['palm', 10]],
    music: { bpm: 118, root: 62, scale: 'dorian', seed: 83 },
    cmds: [
      S(120, { fit: 1, items: 0.5 }), C(90, 40, { arch: 'rock' }), S(80, { fit: 2, dy: -30, boost: 0.15 }), C(-70, 35, { w: 12 }), C(160, 40, { items: 0.5 }),
      S(60, { bumps: 0.3, w: 27 }), S(24, { dy: -16, lin: true }), C(-90, 30, { tunnel: 'arch' }), C(180, 40, { dy: 8 }), S(70, { ramp: { h: 4, len: 20 } }),
      S(40, { arch: 'rib' }), C(-45, 30), C(45, 30, { dy: 10 }), C(90, 38, { dy: 28 }), S(90),
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
      S(110, { fit: 1, items: 0.5, tunnel: 'tube' }), C(90, 35, { tunnel: 'tube', dy: -15 }), S(70, { fit: 2, boost: 0.5, w: 12 }),
      C(-90, 30, { tunnel: 'tube', dy: -10 }), C(180, 34, { dy: -5, items: 0.6, w: 26 }), S(26, { dy: -20, lin: true }), S(60, { tunnel: 'tube' }),
      C(90, 30, { tunnel: 'tube', dy: 10 }), S(70, { ramp: { h: 4, len: 20 } }), S(28, { gap: true }), S(50, { arch: 'rib' }), S(26, { dy: 20, lin: true }),
      C(-60, 30), C(60, 30, { w: 12 }), C(90, 40, { dy: 20 }), S(80, { tunnel: 'tube' }),
    ],
  },
  {
    id: 'kumo', name: '天空の浮島', cup: 2, desc: '浮島から浮島へ大ジャンプ。らせんで雲の上へ',
    w: 18, sh: 3, surf: 'islandgrass', shSurf: 'meadow', wall: 'none', edge: ['bush', 'flowerclump'], gravity: 22, noGround: true,
    theme: { skyTop: 0x5ab0ff, skyBot: 0xfff0f8, fog: 0xf0f4ff, fogFar: 800, ground: null, sun: 1.1, amb: 0.85 },
    deco: [['floatrock', 60], ['cloudpuff', 50], ['rainbow', 4]],
    music: { bpm: 132, root: 64, scale: 'lydian', seed: 61 },
    cmds: [
      S(140, { fit: 1, items: 0.5, boost: 0.85 }), S(40, { ramp: { h: 4, len: 24 } }), S(36, { gap: true }), C(90, 40, { dy: -10, arch: 'ring' }),
      S(60, { fit: 2, w: 12 }), S(28, { dy: 30, lin: true }), C(90, 36, { bank: 20, items: 0.4 }), S(26, { dy: -22, lin: true }), S(60, { ramp: { h: 4, len: 22 } }), S(40, { gap: true }),
      C(-60, 35, { w: 26 }), C(60, 35), S(100, { cork: 360 }), C(90, 40, { dy: 2 }), S(40), C(90, 40, { items: 0.5, arch: 'ring' }), S(90),
    ],
  },
  {
    id: 'suisho', name: '水晶の未知惑星', cup: 2, desc: '光る水晶の大地。60°の水晶山を越えて飛べ',
    w: 19, sh: 3, surf: 'crystalground', shSurf: 'crystal2', wall: 'none', edge: ['crystal'], gravity: 20, noGround: true, space: true,
    theme: { skyTop: 0x10002a, skyBot: 0x5a2a8a, fog: 0x3a1a5a, fogFar: 700, ground: null, sun: 0.9, amb: 0.7 },
    deco: [['crystal', 80], ['tentacle', 16], ['glowflower', 60], ['asteroid', 20]],
    music: { bpm: 144, root: 61, scale: 'lydian', seed: 151 },
    cmds: [
      S(130, { fit: 1, items: 0.5, boost: 0.85 }), C(90, 40, { dy: 15, arch: 'ring' }), S(60, { fit: 2, w: 12 }), S(30, { dy: 40, lin: true }), C(-90, 30), C(90, 30, { items: 0.5 }),
      S(28, { dy: -45, lin: true }), S(40, { ramp: { h: 5, len: 24 } }), S(40, { gap: true }), S(50, { w: 27 }), C(90, 35, { dy: -10, bank: 20 }), L(18), S(50),
      C(-60, 30, { tunnel: 'tube' }), C(60, 30), C(90, 40), S(40), C(90, 40, { arch: 'ring' }), S(90),
    ],
  },
  {
    id: 'bosen', name: 'クネクネ母船', cup: 2, desc: '星人の母船内部。ループ・ひねり・全部入り',
    w: 18, sh: 1.5, surf: 'alien', shSurf: 'neon2', wall: 'none', edge: ['tentacle_s'], gravity: 22, noGround: true, space: true,
    theme: { skyTop: 0x0a0018, skyBot: 0x2a0a3a, fog: 0x1a0828, fogFar: 800, ground: null, sun: 0.9, amb: 0.65 },
    deco: [['asteroid', 30], ['tentacle', 30]],
    music: { bpm: 168, root: 58, scale: 'phrygian', seed: 127 },
    cmds: [
      S(150, { fit: 1, items: 0.5, boost: 0.85 }), C(90, 40, { dy: 20, bank: 20, arch: 'rib' }), S(60, { tunnel: 'tube' }), L(20),
      S(80, { fit: 2, items: 0.5, w: 12 }), C(90, 30), S(60, { ramp: { h: 4, len: 20 } }), S(34, { gap: true }), S(60, { boost: 0.5, w: 27 }), S(26, { dy: -24, lin: true }),
      C(90, 35, { dy: -20, bank: 25 }), S(110, { cork: 360 }), C(-60, 40, { tunnel: 'tube' }), C(60, 40, { tunnel: 'tube' }), S(26, { dy: 24, lin: true, arch: 'rib' }),
      C(90, 45, { items: 0.4 }), S(90),
    ],
  },
];

// ===== 一本道（スタート→ゴール）化：各コースの生成ルール =====
const GEN = {
  kawara: { name: 'グラベルラリー 河原', desc: '道なき河原を切り裂くラリー。川をザブザブ突っ切れ', length: 3400, flat: true, mix: { rally: 4, river: 3, wild: 3, rallyJump: 2, scurve: 2, crests: 1, tight90: 1 } },
  numa: { length: 3200, flat: true, mix: { river: 4, scurve: 2, chicane: 2, wild: 2, gapjump: 1, tight90: 2, rally: 1 } },
  yamamichi: { desc: '九十九折りのヘアピン、崖から空中ダイブ、トンネル', length: 4200, mix: { hairpins: 3, hairpinsDown: 2, climb: 2, cliff: 3, dropoff: 2, tunnel: 1, sweeper: 1, rallyJump: 1 } },
  mori: { name: 'フォレストラリー', desc: '木々の間の道なき道を全開で駆け抜けるラリー', length: 3600, mix: { rally: 4, rallyJump: 2, scurve: 2, chicane: 1, tight90: 2, crests: 2, wild: 2 } },
  jupiter: { length: 4000, mix: { spiral: 2, sweeper: 3, cliff: 2, gapjump: 2, descent: 2, climb: 1, scurve: 1 } },
  kinsei: { length: 3800, mix: { climb: 3, dropoff: 3, cliff: 2, hairpins: 2, hairpinsDown: 1, sweeper: 1, gapjump: 1 } },
  tsuki: { length: 4500, mix: { wild: 3, crests: 3, gapjump: 3, cliff: 2, sweeper: 1, rallyJump: 2 } },
  kaitei: { length: 3500, mix: { descent: 2, climb: 2, scurve: 2, sweeper: 2, tube: 1, crests: 1, chicane: 1 }, yMin: -60, yMax: 30 },
  chitei: { length: 3600, mix: { tube: 4, hairpinsDown: 2, descent: 2, cliff: 2, chicane: 1, gapjump: 1 } },
  kumo: { length: 4200, mix: { gapjump: 3, cliff: 3, spiral: 2, sweeper: 2, cork: 1, climb: 1 } },
  suisho: { length: 4600, mix: { climb: 2, dropoff: 2, wild: 2, gapjump: 2, spiral: 1, loop: 1, scurve: 2, rallyJump: 1 } },
  bosen: { length: 5000, mix: { loop: 2, cork: 2, spiral: 2, tube: 2, gapjump: 2, chicane: 2, sweeper: 1, cliff: 1 } },
};
COURSES.forEach((c, i) => {
  const g = GEN[c.id]; if (!g) return;
  delete c.cmds; c.open = true; c.gen = Object.assign({ seed: 1000 + i * 97 }, g);
  if (g.name) c.name = g.name; if (g.desc) c.desc = g.desc;
  c.desc = c.desc + `（約${(g.length / 1000).toFixed(1)}km）`;
  c.wildSurf = { kawara: 'gravel', numa: 'mudpath', mori: 'forest', tsuki: 'moon', suisho: 'crystalground', yamamichi: 'trail' }[c.id] || c.surf;
});

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
  return Object.assign({}, ARENA_BASE, a, { battle: true, cmds, music: { bpm: 156, root: 57 + (a.n % 3), scale: 'minor', seed: 200 + a.n * 7 + a.side, classic: null } });
});

const CUPS = [
  { name: '大地のオフロードカップ', icon: '🪨' },
  { name: '惑星めぐりカップ', icon: '🪐' },
  { name: '未知の世界カップ', icon: '👽' },
];


// ===== 一本道コース自動生成（スタート→ゴール 3〜5km） =====
// 道の部品（パターン）を組み合わせ、自分の道と重ならないように並べる
const PATTERNS = {
  hairpins: (r, d) => [C(d * 165, 15 + r() * 5, { dy: 6 }), S(30 + r() * 20, { dy: 6 }), C(-d * 165, 15 + r() * 5, { dy: 6 }), S(30, { dy: 4 })],
  hairpinsDown: (r, d) => [C(d * 165, 16 + r() * 5, { dy: -6 }), S(30 + r() * 20, { dy: -6 }), C(-d * 165, 16 + r() * 5, { dy: -6 }), S(30, { dy: -4 })],
  scurve: (r, d) => [C(d * (45 + r() * 30), 30 + r() * 15), C(-d * (45 + r() * 30), 30 + r() * 15), S(30 + r() * 30)],
  chicane: (r, d) => [S(40), C(d * 50, 18), S(12, { w: 13 }), C(-d * 100, 18, { w: 13 }), S(12, { w: 13 }), C(d * 50, 18), S(40)],
  tight90: (r, d) => [S(50 + r() * 40, { items: 0.4 }), C(d * 90, 14 + r() * 6), S(40)],
  sweeper: (r, d) => [C(d * (100 + r() * 60), 55 + r() * 25, { bank: 18 }), S(40)],
  spiral: (r, d) => [C(d * 360, 34, { dy: (r() < 0.5 ? 1 : -1) * 36, bank: 18 }), S(40)],
  climb: (r, d) => [S(28 + r() * 10, { dy: 22 + r() * 18, lin: true }), S(40), C(d * 30, 50)],
  descent: (r, d) => [S(50, { dy: -12 }), C(d * 40, 45, { dy: -10 }), S(50, { dy: -12, boost: 0.5 })],
  crests: (r, d) => [S(42, { dy: 7 }), S(42, { dy: -7 }), S(42, { dy: 8 }), S(42, { dy: -8 }), S(40, { dy: 6 }), S(40, { dy: -6 })],
  cliff: (r, d) => [S(60, { items: 0.3 }), S(36, { ramp: { h: 3, len: 18 } }), S(46, { gap: true, dy: -30, lin: true }), S(70, { boost: 0.4 }), C(d * 40, 45)],
  dropoff: (r, d) => [S(50), S(26, { dy: -32, lin: true }), S(80, { bumps: 0.4 }), C(d * 50, 40)],
  gapjump: (r, d) => [S(70, { boost: 0.5 }), S(40, { ramp: { h: 4, len: 24 } }), S(32, { gap: true }), S(60)],
  wild: (r, d) => [S(60, { wild: true, w: 44, items: 0.5 }), C(d * (20 + r() * 30), 120, { wild: true, w: 44, dy: (r() - 0.5) * 16 }), S(120, { wild: true, w: 46, bumps: 0.5 }), C(-d * (20 + r() * 30), 120, { wild: true, w: 44 }), S(60, { wild: true, w: 40 })],
  rally: (r, d) => [S(50, { wild: true, w: 26, bumps: 0.6 }), C(d * (60 + r() * 50), 24 + r() * 10, { wild: true, w: 26 }), S(40, { wild: true, w: 26, dy: 6 }), S(30, { wild: true, w: 26, dy: -6 }), C(-d * (70 + r() * 50), 22 + r() * 10, { wild: true, w: 26 }), S(50, { wild: true, w: 26, bumps: 0.7 })],
  rallyJump: (r, d) => [S(60, { wild: true, w: 24 }), S(30, { wild: true, w: 24, dy: 9 }), S(26, { wild: true, w: 24, dy: -14, lin: true }), S(60, { wild: true, w: 24, bumps: 0.6 }), C(d * 70, 26, { wild: true, w: 24 })],
  tunnel: (r, d) => [S(110 + r() * 60, { tunnel: 'arch' }), C(d * 45, 50, { tunnel: 'arch' }), S(40)],
  tube: (r, d) => [S(90, { tunnel: 'tube' }), C(d * 70, 34, { tunnel: 'tube', dy: -8 }), S(60, { tunnel: 'tube' })],
  river: (r, d) => [S(50, { dy: -3 }), S(60, { dy: 0 }), S(50, { dy: 3 }), C(d * 35, 50)],
  loop: (r, d) => [S(60, { boost: 0.6 }), L(20), S(60)],
  cork: (r, d) => [S(110, { cork: 360, boost: 0.1 }), S(30)],
};

function genCourse(def) {
  const G = def.gen, r = U.rng(G.seed);
  const pick = () => { let t = 0; for (const k in G.mix) t += G.mix[k]; let x = r() * t; for (const k in G.mix) { x -= G.mix[k]; if (x <= 0) return k; } return 'scurve'; };
  const cmds = [S(110, { items: 0.85 })];
  let tries = 0;
  const half = (def.w / 2 + def.sh);
  while (tries++ < 400) {
    const tr = turtleRun(cmds);
    const len = tr.pts.length;
    if (len >= G.length) break;
    const y = tr.end[1];
    let name = pick();
    if (y > (G.yMax ?? 140) && /climb|hairpins$|crests/.test(name)) name = 'descent';
    if (y < (G.yMin ?? -100) && /descent|dropoff|cliff|Down/.test(name)) name = 'climb';
    let placed = false;
    for (const d of (r() < 0.5 ? [1, -1] : [-1, 1])) {
      let add = PATTERNS[name](r, d);
      if (G.flat) add = add.map(c => c.dy && name !== 'river' ? Object.assign({}, c, { dy: 0 }) : c);
      if (cmds.length % 3 === 0) add[0] = Object.assign({}, add[0], { items: add[0].items ?? 0.5 });
      const test = turtleRun(cmds.concat(add));
      const p = test.pts, nOld = Math.max(0, len - 90);
      let ok = true;
      for (let i = len; i < p.length && ok; i += 3) for (let j = 0; j < nOld; j += 4) {
        const dx = p[i].x - p[j].x, dz = p[i].z - p[j].z;
        if (Math.abs(dx) > 120 || Math.abs(dz) > 120) continue;
        const wi = (p[i].w || def.w) / 2 + def.sh, wj = (p[j].w || def.w) / 2 + def.sh;
        if (Math.hypot(dx, dz) < wi + wj + 10 && Math.abs(p[i].y - p[j].y) < 18) { ok = false; break; }
      }
      if (ok) { cmds.push(...add); placed = true; break; }
    }
    if (!placed) cmds.push(C((r() < 0.5 ? 1 : -1) * 60, 40));   // 行き詰まったら向きを変えて逃げる
  }
  cmds.push(S(70, { boost: 0.3 }), S(140));
  return cmds;
}

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
      pts.push({ x, y, z, ci, tt, loop, w: c.w });
    }
    if (c.t === 'l') y = y0;
  });
  return { pts, dirs, end: [x, y, z], th };
}

function turtle(def) {
  if (def.gen && !def.cmds) def.cmds = genCourse(def);
  const lay = (!def.gen && typeof LAYOUT !== 'undefined' && LAYOUT[def.id]) || [];
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
