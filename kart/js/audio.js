// ===== サウンド（WebAudio合成） =====
const SND = {
  ctx: null, master: null, music: null, sfx: null, engine: null, bgm: null, vol: { m: 0.33, s: 0.65 }, lastT: {},
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(this.ctx.destination);
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(comp);
    this.music = this.ctx.createGain(); this.music.gain.value = this.vol.m; this.music.connect(this.master);
    this.sfx = this.ctx.createGain(); this.sfx.gain.value = this.vol.s; this.sfx.connect(this.master);
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
  },
  now() { return this.ctx.currentTime; },
  // 基本ボイス
  tone(f, dur, type = 'square', vol = 0.2, slide = 0, delay = 0, dest) {
    if (!this.ctx) return;
    const t = this.now() + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.03);
  },
  noise(dur, vol = 0.3, f = 1200, q = 1, slide = 1, delay = 0, type = 'bandpass', dest) {
    if (!this.ctx) return;
    const t = this.now() + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const fl = this.ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (slide !== 1) fl.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfx); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  },
  play(name) {
    if (!this.ctx) return;
    const n = this.now();
    if (this.lastT[name] && n - this.lastT[name] < 0.045) return;
    this.lastT[name] = n;
    const T = (...a) => this.tone(...a), N = (...a) => this.noise(...a);
    switch (name) {
      case 'count': T(440, 0.3, 'square', 0.22); T(880, 0.3, 'sine', 0.1); break;
      case 'go': T(880, 0.7, 'square', 0.22); T(1320, 0.7, 'sine', 0.12); break;
      case 'item': [660, 880, 1100, 1320].forEach((f, i) => T(f, 0.09, 'square', 0.1, 0, i * 0.04)); break;
      case 'roll': T(1200 + Math.random() * 600, 0.03, 'square', 0.04); break;
      case 'boost': N(0.7, 0.35, 500, 0.7, 5); T(180, 0.6, 'sawtooth', 0.1, 3.5); break;
      case 'mt1': T(500, 0.15, 'triangle', 0.15, 1.6); break;
      case 'hop': T(320, 0.08, 'triangle', 0.15, 1.7); break;
      case 'hit': N(0.4, 0.5, 400, 0.6, 0.3); T(220, 0.4, 'sawtooth', 0.18, 0.3); T(660, 0.25, 'square', 0.06, 0.5, 0.05); break;
      case 'wall': N(0.15, 0.4, 260, 1.2); T(90, 0.12, 'sine', 0.3, 0.6); break;
      case 'throw': N(0.2, 0.25, 1800, 1, 0.4); break;
      case 'lap': [523, 659, 784, 1046].forEach((f, i) => T(f, 0.16, 'square', 0.14, 0, i * 0.08)); break;
      case 'final': [784, 784, 784, 988, 1175].forEach((f, i) => T(f, 0.22, 'square', 0.16, 0, i * 0.14)); break;
      case 'finish': [523, 659, 784, 1046, 784, 1046, 1318, 1568].forEach((f, i) => { T(f, 0.3, 'square', 0.13, 0, i * 0.12); T(f / 2, 0.3, 'triangle', 0.15, 0, i * 0.12); }); break;
      case 'star': [988, 1175, 1319, 1568, 1976].forEach((f, i) => T(f, 0.1, 'square', 0.09, 0, i * 0.05)); break;
      case 'fall': T(900, 0.9, 'triangle', 0.2, 0.15); break;
      case 'select': T(880, 0.07, 'square', 0.1); T(1320, 0.07, 'sine', 0.06, 0, 0.03); break;
      case 'back': T(440, 0.07, 'square', 0.1); break;
      case 'splash': N(0.6, 0.5, 1400, 0.6, 0.3); N(0.3, 0.3, 400, 1, 1, 0.05); for (let i = 0; i < 5; i++) T(800 + Math.random() * 1200, 0.06, 'sine', 0.05, 1.5, 0.05 + i * 0.04); break;
      case 'land': N(0.15, 0.35, 180, 1); T(70, 0.15, 'sine', 0.3, 0.5); break;
      // --- アイテム ---
      case 'scope': T(2400, 0.06, 'sine', 0.08); T(2400, 0.06, 'sine', 0.08, 0, 0.15); T(2400, 0.3, 'sine', 0.08, 0, 0.3); break;
      case 'gunshot': N(0.08, 0.9, 3000, 0.5, 0.2, 0, 'lowpass'); N(0.6, 0.5, 800, 0.5, 0.2); T(60, 0.4, 'sine', 0.6, 0.4); T(3000, 0.35, 'sine', 0.05, 0.3, 0.05); break;
      case 'fuse': N(1.0, 0.18, 6000, 2, 1, 0, 'highpass'); break;
      case 'boom': N(1.4, 0.9, 900, 0.4, 0.08, 0, 'lowpass'); T(55, 1.0, 'sine', 0.8, 0.4); T(110, 0.5, 'sawtooth', 0.2, 0.3); break;
      case 'poyon': T(300, 0.25, 'sine', 0.3, 2.2); T(500, 0.2, 'sine', 0.15, 0.6, 0.12); break;
      case 'thud': for (let i = 0; i < 4; i++) { N(0.12, 0.35, 250, 1, 1, i * 0.07); T(80, 0.1, 'sine', 0.25, 0.6, i * 0.07); } break;
      case 'ping': T(3200, 0.25, 'sine', 0.12, 0.9); T(4800, 0.12, 'sine', 0.05); break;
      case 'paper': for (let i = 0; i < 6; i++) N(0.08, 0.25, 3000 + Math.random() * 3000, 1.5, 1, i * 0.05, 'highpass'); break;
      case 'gulp': T(300, 0.12, 'sine', 0.3, 0.5); T(250, 0.14, 'sine', 0.3, 0.5, 0.18); break;
      case 'growl': T(70, 1.0, 'sawtooth', 0.15, 0.7); T(90, 0.8, 'sawtooth', 0.1, 1.3, 0.3); break;
      case 'hiss': N(1.6, 0.3, 5000, 0.8, 0.6, 0, 'highpass'); break;
      case 'cough': N(0.1, 0.3, 600, 2); N(0.12, 0.3, 500, 2, 1, 0.15); break;
      case 'peta': N(0.06, 0.4, 2000, 1); T(150, 0.08, 'sine', 0.3, 0.5); break;
      case 'fwash': N(0.4, 0.3, 900, 0.6, 0.4); break;
      case 'snore': T(90, 0.6, 'sawtooth', 0.12, 1.3); N(0.6, 0.12, 400, 2, 1.5); T(120, 0.5, 'sawtooth', 0.1, 0.7, 0.8); break;
      case 'poff': N(0.25, 0.35, 300, 0.7, 0.5); T(120, 0.2, 'sine', 0.3, 0.7); break;
      case 'drip': T(900, 0.12, 'sine', 0.2, 2.2); T(1400, 0.1, 'sine', 0.1, 1.5, 0.15); break;
      case 'fan': N(1.4, 0.35, 300, 0.5, 1, 0, 'lowpass'); T(48, 1.4, 'square', 0.06); break;
      case 'whistle': T(2000, 1.1, 'sine', 0.12, 0.25); break;
      case 'crash': N(0.6, 0.8, 2500, 0.4, 0.3); for (let i = 0; i < 6; i++) T(1500 + Math.random() * 3000, 0.15, 'square', 0.05, 0.5, i * 0.05); T(70, 0.4, 'sine', 0.5, 0.5); break;
      case 'bzzt': for (let i = 0; i < 8; i++) T(60 + Math.random() * 40, 0.08, 'sawtooth', 0.22, 1, i * 0.07); N(0.6, 0.2, 4000, 1, 1, 0, 'highpass'); break;
      case 'munch': for (let i = 0; i < 4; i++) N(0.07, 0.4, 1500, 1, 0.5, i * 0.12); T(400, 0.08, 'sine', 0.1, 0.7, 0.5); break;
      case 'eat': for (let i = 0; i < 3; i++) N(0.06, 0.35, 1200, 1, 0.5, i * 0.1); T(200, 0.6, 'sine', 0.2, 0.3, 0.3); break;
      case 'swing': N(0.3, 0.4, 600, 0.8, 4); break;
      case 'bonk': T(180, 0.35, 'sine', 0.6, 0.5); T(360, 0.4, 'triangle', 0.25, 2.5); N(0.1, 0.4, 600, 1); break;
      case 'mgun': N(0.05, 0.6, 2500, 0.6, 0.3); T(90, 0.05, 'square', 0.25, 0.5); break;
      case 'gurgle': for (let i = 0; i < 6; i++) T(120 + Math.random() * 120, 0.1, 'sine', 0.2, 1.6, i * 0.08); break;
      case 'fire': N(0.4, 0.2, 700, 0.5, 2, 0, 'lowpass'); for (let i = 0; i < 3; i++) N(0.02, 0.2, 4000, 1, 1, Math.random() * 0.3, 'highpass'); break;
      case 'rattle': for (let i = 0; i < 16; i++) T(1500 + Math.random() * 2000, 0.03, 'triangle', 0.05, 0.8, i * 0.04); break;
      case 'sizzle': N(1.2, 0.3, 6000, 0.6, 0.7, 0, 'highpass'); for (let i = 0; i < 10; i++) N(0.02, 0.2, 5000, 1, 1, Math.random() * 1, 'highpass'); break;
      case 'achi': T(700, 0.15, 'square', 0.15, 1.4); T(800, 0.15, 'square', 0.15, 1.4, 0.18); T(900, 0.2, 'square', 0.15, 1.4, 0.36); break;
      case 'squish': N(0.5, 0.35, 500, 3, 0.4); T(200, 0.4, 'sine', 0.15, 0.6); break;
      case 'slip': T(1200, 0.4, 'sine', 0.15, 0.3); N(0.3, 0.2, 2000, 2, 0.4); break;
      case 'squash': T(400, 0.3, 'square', 0.15, 0.2); N(0.2, 0.4, 300, 1); break;
      case 'grab': T(60, 0.5, 'sawtooth', 0.25, 0.8); break;
      case 'pop': N(0.08, 0.7, 2200, 0.7, 0.4); T(1400, 0.06, 'sine', 0.15, 0.4); break;
      case 'bite': N(0.05, 0.6, 3000, 1); N(0.05, 0.6, 3000, 1, 1, 0.1); T(900, 0.2, 'square', 0.1, 1.5, 0.2); break;
      case 'ame': [1046, 1318, 1568, 2093].forEach((f, i) => T(f, 0.2, 'sine', 0.12, 0, i * 0.07)); break;
      case 'harisen': N(0.12, 0.9, 2500, 0.4, 0.3); T(300, 0.2, 'square', 0.2, 0.4); break;
      case 'jikka': [523, 659, 784, 659, 784, 1046].forEach((f, i) => T(f, 0.35, 'triangle', 0.15, 0, i * 0.18)); break;
      case 'shine': T(3000, 0.6, 'sine', 0.08, 1.5); T(4000, 0.4, 'sine', 0.06, 1.2, 0.1); break;
      case 'taiko': for (let i = 0; i < 4; i++) { T(90, 0.3, 'sine', 0.5, 0.5, i * 0.22); N(0.05, 0.3, 300, 1, 1, i * 0.22); } break;
      case 'navi': T(1046, 0.15, 'sine', 0.15); T(784, 0.3, 'sine', 0.15, 0, 0.18); break;
      // --- ホラー ---
      case 'stinger': [55, 58.3, 82.4, 116.5, 233].forEach(f => T(f, 2.2, 'sawtooth', 0.12, 0.97)); N(1.5, 0.3, 200, 0.5, 6, 0, 'lowpass'); T(1760, 1.4, 'sine', 0.05, 0.94); T(1864, 1.4, 'sine', 0.05, 1.05); break;
      case 'whisper': for (let i = 0; i < 5; i++) N(0.3, 0.12, 2500 + Math.random() * 2000, 6, 0.8, i * 0.2); break;
      case 'laugh': for (let i = 0; i < 6; i++) { T(520 - i * 30, 0.12, 'sawtooth', 0.08, 1.3, i * 0.13); T(780 - i * 40, 0.12, 'triangle', 0.06, 1.2, i * 0.13); } break;
      case 'heart': T(55, 0.15, 'sine', 0.7, 0.6); T(50, 0.15, 'sine', 0.55, 0.6, 0.18); break;
    }
  },
  startEngine() {
    if (!this.ctx || this.engine) return;
    const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square';
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 800;
    const g = this.ctx.createGain(); g.gain.value = 0.0;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfx);
    o1.start(); o2.start();
    this.engine = { o1, o2, g, f };
  },
  setEngine(sp, boost) {
    if (!this.engine) return;
    const t = this.now();
    const base = 55 + Math.abs(sp) * 2.5 + (boost ? 40 : 0);
    this.engine.o1.frequency.setTargetAtTime(base, t, 0.05);
    this.engine.o2.frequency.setTargetAtTime(base * 0.5 + 3, t, 0.05);
    this.engine.f.frequency.setTargetAtTime(500 + Math.abs(sp) * 20, t, 0.1);
    this.engine.g.gain.setTargetAtTime(0.04 + Math.min(0.06, Math.abs(sp) * 0.0013), t, 0.1);
  },
  stopEngine() { if (this.engine) { this.engine.o1.stop(); this.engine.o2.stop(); this.engine = null; } },

  // ---- BGM：イントロ→Aメロ→Bメロ→サビ の構成で自動作曲 ----
  startBGM(m) {
    this.stopBGM(); if (!this.ctx) return;
    const scales = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], yonanuki: [0, 2, 4, 7, 9] };
    const sc = scales[m.scale] || scales.major;
    const r = U.rng(m.seed);
    const note = (deg, oct = 0) => { const n = sc.length; const o = Math.floor(deg / n); const d = ((deg % n) + n) % n; return m.root + sc[d] + 12 * (o + oct); };
    const progs = [[0, 5, 3, 4], [0, 3, 4, 4], [5, 3, 0, 4], [0, 4, 5, 3], [3, 4, 2, 5], [0, 2, 3, 4]];
    const pick = () => progs[Math.floor(r() * progs.length)];
    // モチーフ（2小節=32ステップ）
    const motif = () => {
      const rh = []; for (let i = 0; i < 32; i++) rh.push(i % 4 === 0 ? r() < 0.9 : i % 2 === 0 ? r() < 0.55 : r() < 0.18);
      const pt = []; let c = 4; for (let i = 0; i < 32; i++) { c += Math.floor(r() * 5) - 2; c = U.clamp(c, 0, 9); pt.push(c); }
      return { rh, pt };
    };
    const sections = {
      I: { bars: 4, prog: pick(), mel: null, drum: 'build', arp: false },
      A: { bars: 8, prog: pick(), mel: motif(), drum: 'beat', arp: false },
      B: { bars: 8, prog: pick(), mel: motif(), drum: 'half', arp: true },
      C: { bars: 8, prog: pick(), mel: motif(), drum: 'four', arp: true, hi: 7 },
    };
    const order = ['I', 'A', 'B', 'C', 'A', 'C', 'B', 'C'];
    const bgm = { step: 0, next: this.now() + 0.15, bpm: m.bpm, fast: 1, alive: true, trans: 0, mode: 'normal', sec: 0, secStep: 0 };
    this.bgm = bgm;
    const f = (n) => 440 * Math.pow(2, (n - 69 + bgm.trans) / 12);
    const voice = (fr, d, type, vol, t, att = 0.005) => { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type; o.frequency.value = fr; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(this.music); o.start(t); o.stop(t + d + 0.03); };
    const drum = (kind, t, vol = 1) => {
      const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf; const g = this.ctx.createGain(); const fl = this.ctx.createBiquadFilter();
      if (kind === 'k') { voice(150, 0.18, 'sine', 0.9 * vol, t); const o = this.ctx.createOscillator(); return; }
      fl.type = kind === 'h' ? 'highpass' : 'bandpass'; fl.frequency.value = kind === 'h' ? 7500 : 1900; fl.Q.value = kind === 'h' ? 1 : 0.8;
      const d = kind === 'h' ? 0.04 : 0.16; g.gain.setValueAtTime((kind === 'h' ? 0.13 : 0.45) * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      src.connect(fl); fl.connect(g); g.connect(this.music); src.start(t, Math.random()); src.stop(t + d + 0.02);
    };
    const kick = (t, v = 1) => { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(0.9 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2); o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.22); };
    const sched = () => {
      if (!bgm.alive) return;
      const spb = 60 / (bgm.bpm * bgm.fast) / 4;
      while (bgm.next < this.now() + 0.25) {
        const t = bgm.next;
        if (bgm.mode === 'scary') this.scaryStep(bgm, t, spb, f, voice, kick);
        else if (bgm.mode === 'goal') this.goalStep(bgm, t, spb, f, voice, note);
        else if (bgm.mode === 'wait') { if (bgm.step % 16 === 0) voice(f(note(0, -1)), spb * 14, 'triangle', 0.12, t, 0.3); }
        else {
          const name = order[bgm.sec % order.length], S = sections[name];
          const s = bgm.secStep, bar = Math.floor(s / 16), b16 = s % 16;
          const chord = S.prog[bar % 4];
          const last = bar === S.bars - 1;
          // ドラム
          if (S.drum === 'build') { if (b16 % (bar < 2 ? 8 : 4) === 0) kick(t); if (bar === 3 && b16 >= 8) drum('s', t, (b16 - 7) / 8); if (b16 % 2 === 0) drum('h', t, 0.6); }
          else {
            if (S.drum === 'four' ? b16 % 4 === 0 : (b16 === 0 || b16 === 8 || (b16 === 10 && r() < 0.5))) kick(t);
            if (S.drum !== 'half' ? (b16 === 4 || b16 === 12) : b16 === 8) drum('s', t);
            if (last && b16 >= 12) drum('s', t, 0.7);
            drum('h', t, b16 % 2 ? 0.5 : 1);
          }
          // ベース
          const bp = S.drum === 'four' ? [0, 12, 0, 12] : [0, 0, 7, 12];
          if (b16 % 2 === 0) voice(f(note(chord, -2) + bp[(b16 / 2) % 4]), spb * 1.7, 'triangle', 0.4, t);
          if (b16 % 4 === 2 && S.drum !== 'build') voice(f(note(chord, -1)), spb * 0.9, 'sawtooth', 0.05, t);
          // パッド
          if (b16 === 0) [0, 2, 4].forEach(o => voice(f(note(chord + o, 0)), spb * 15, 'triangle', 0.035, t, 0.05));
          // アルペジオ
          if (S.arp) { const ar = [0, 2, 4, 7, 4, 2]; voice(f(note(chord + ar[b16 % 6], 1)), spb * 0.8, 'square', 0.022, t); }
          // メロディ
          if (S.mel) {
            const i = s % 32, var2 = Math.floor(s / 32) % 2;
            if (S.mel.rh[i]) {
              let deg = S.mel.pt[i] + (var2 && i > 24 ? 2 : 0) + (S.hi || 0);
              if (i % 8 === 0) deg = Math.round(deg / 2) * 2;
              const len = S.mel.rh[(i + 1) % 32] ? 1 : 2;
              voice(f(note(deg + chord % 2)), spb * len * 1.6, 'square', 0.065, t);
              voice(f(note(deg + chord % 2) + 12), spb * len * 1.2, 'sine', 0.025, t);
            }
          }
          bgm.secStep++;
          if (bgm.secStep >= S.bars * 16) { bgm.secStep = 0; bgm.sec++; if (bgm.sec >= order.length) bgm.sec = 1; }
        }
        bgm.step++; bgm.next += spb;
      }
      bgm.timer = setTimeout(sched, 40);
    };
    sched();
  },
  scaryStep(bgm, t, spb, f, voice, kick) {
    const s = bgm.step % 32;
    if (s === 0) { voice(f(33), spb * 30, 'sawtooth', 0.12, t, 0.4); voice(f(34), spb * 30, 'sawtooth', 0.1, t, 0.4); }
    if (s % 8 === 0) { kick(t, 0.8); kick(t + spb * 1.2, 0.6); }
    if (Math.random() < 0.12) voice(f(84 + Math.floor(Math.random() * 3)), spb * 6, 'sine', 0.04, t, 0.1);
    if (s === 16) voice(f(70), spb * 12, 'triangle', 0.05, t, 0.5);
  },
  goalStep(bgm, t, spb, f, voice, note) {
    const s = bgm.step % 64;
    const prog = [0, 3, 4, 0], c = prog[Math.floor(s / 16)];
    if (s % 16 === 0) [0, 2, 4].forEach(o => voice(f(note(c + o)), spb * 15, 'triangle', 0.06, t, 0.1));
    if (s % 4 === 0) voice(f(note(c, -2)), spb * 3, 'triangle', 0.3, t);
    const mel = [7, null, 9, null, 11, 9, 7, null, 4, null, 7, null, 9, null, null, null];
    const mn = mel[s % 16]; if (mn != null) voice(f(note(mn + c)), spb * 3, 'square', 0.05, t);
  },
  scary(on) { if (!this.bgm) return; if (on) { this.bgm.prevMode = this.bgm.mode === 'scary' ? this.bgm.prevMode : this.bgm.mode; this.bgm.mode = 'scary'; } else if (this.bgm.mode === 'scary') this.bgm.mode = this.bgm.prevMode || 'normal'; },
  setMode(m) { if (this.bgm) { if (this.bgm.mode === 'scary') this.bgm.prevMode = m; else this.bgm.mode = m; } },
  stopBGM() { if (this.bgm) { this.bgm.alive = false; clearTimeout(this.bgm.timer); this.bgm = null; } },
};
