// ===== サウンド（WebAudio合成） =====
const SND = {
  ctx: null, master: null, music: null, sfx: null, engine: null, bgm: null, vol: { m: 0.35, s: 0.6 },
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    this.music = this.ctx.createGain(); this.music.gain.value = this.vol.m; this.music.connect(this.master);
    this.sfx = this.ctx.createGain(); this.sfx.gain.value = this.vol.s; this.sfx.connect(this.master);
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
  },
  tone(f, dur, type = 'square', vol = 0.2, slide = 0, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.3, f = 1200, q = 1, slide = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const fl = this.ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (slide !== 1) fl.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(this.sfx); s.start(t); s.stop(t + dur);
  },
  play(name) {
    switch (name) {
      case 'count': this.tone(440, 0.25, 'square', 0.25); break;
      case 'go': this.tone(880, 0.6, 'square', 0.25); break;
      case 'item': [660, 880, 1100].forEach((f, i) => this.tone(f, 0.08, 'square', 0.12, 0, i * 0.05)); break;
      case 'roll': this.tone(1200 + Math.random() * 400, 0.03, 'square', 0.05); break;
      case 'boost': this.noise(0.6, 0.35, 600, 0.8, 4); this.tone(200, 0.5, 'sawtooth', 0.12, 3); break;
      case 'mt1': this.tone(500, 0.15, 'triangle', 0.15, 1.5); break;
      case 'hop': this.tone(300, 0.08, 'triangle', 0.15, 1.6); break;
      case 'hit': this.noise(0.4, 0.5, 400, 0.6, 0.3); this.tone(180, 0.4, 'sawtooth', 0.2, 0.3); break;
      case 'wall': this.noise(0.15, 0.4, 300, 1); break;
      case 'throw': this.tone(700, 0.15, 'triangle', 0.15, 0.4); break;
      case 'lap': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.15, 'square', 0.15, 0, i * 0.08)); break;
      case 'final': [784, 784, 784, 1046].forEach((f, i) => this.tone(f, 0.2, 'square', 0.18, 0, i * 0.15)); break;
      case 'finish': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.25, 'square', 0.15, 0, i * 0.12)); break;
      case 'star': [988, 1175, 1319, 1568].forEach((f, i) => this.tone(f, 0.1, 'square', 0.1, 0, i * 0.06)); break;
      case 'thunder': this.noise(1.2, 0.6, 200, 0.5, 0.5); break;
      case 'fall': this.tone(800, 0.8, 'triangle', 0.2, 0.2); break;
      case 'select': this.tone(880, 0.07, 'square', 0.12); break;
      case 'back': this.tone(440, 0.07, 'square', 0.12); break;
      case 'splash': this.noise(0.5, 0.4, 900, 0.7, 0.5); break;
      case 'land': this.noise(0.12, 0.3, 200, 1); break;
    }
  },
  startEngine() {
    if (!this.ctx || this.engine) return;
    const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square';
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    const g = this.ctx.createGain(); g.gain.value = 0.0;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfx);
    o1.start(); o2.start();
    this.engine = { o1, o2, g, f };
  },
  setEngine(sp, boost) {
    if (!this.engine) return;
    const t = this.ctx.currentTime;
    const base = 55 + Math.abs(sp) * 2.6 + (boost ? 40 : 0);
    this.engine.o1.frequency.setTargetAtTime(base, t, 0.05);
    this.engine.o2.frequency.setTargetAtTime(base * 0.5 + 3, t, 0.05);
    this.engine.g.gain.setTargetAtTime(0.05 + Math.min(0.07, Math.abs(sp) * 0.0015), t, 0.1);
  },
  stopEngine() { if (this.engine) { this.engine.o1.stop(); this.engine.o2.stop(); this.engine = null; } },
  // ---- BGM: シード付き自動作曲 ----
  startBGM(m) {
    this.stopBGM(); if (!this.ctx) return;
    const scales = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], yonanuki: [0, 2, 4, 7, 9] };
    const sc = scales[m.scale] || scales.major;
    const r = U.rng(m.seed);
    const note = (deg, oct = 0) => { const n = sc.length; const o = Math.floor(deg / n); const d = ((deg % n) + n) % n; return m.root + sc[d] + 12 * (o + oct); };
    const prog = [0, 5, 3, 4].map(x => x + Math.floor(r() * 2));
    const mel = []; let cur = 7;
    for (let i = 0; i < 64; i++) { if (r() < 0.25) mel.push(null); else { cur += Math.floor(r() * 5) - 2; cur = U.clamp(cur, 2, 14); mel.push(cur); } }
    const bgm = { step: 0, next: this.ctx.currentTime + 0.1, bpm: m.bpm, prog, mel, note, fast: 1, alive: true };
    this.bgm = bgm;
    const f = (n) => 440 * Math.pow(2, (n - 69) / 12);
    const sched = () => {
      if (!bgm.alive) return;
      const spb = 60 / (bgm.bpm * bgm.fast) / 4;
      while (bgm.next < this.ctx.currentTime + 0.2) {
        const s = bgm.step % 64, bar = Math.floor(s / 16), chord = bgm.prog[bar];
        const t = bgm.next;
        const v = (fr, d, type, vol) => { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type; o.frequency.value = fr; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(this.music); o.start(t); o.stop(t + d + 0.02); };
        if (s % 2 === 0) v(f(note(chord, -2) + (s % 4 === 2 ? 12 : 0)), spb * 1.8, 'triangle', 0.35);
        const mn = bgm.mel[s % 64];
        if (mn != null && s % 2 === 0) v(f(note(mn + chord)), spb * 1.6, 'square', 0.07);
        if (s % 4 === 1) v(f(note(chord + 2 + (s % 8 === 1 ? 2 : 4))), spb * 0.8, 'sawtooth', 0.03);
        if (s % 4 === 0) { const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf; const g = this.ctx.createGain(); const fl = this.ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 160; g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12); src.connect(fl); fl.connect(g); g.connect(this.music); src.start(t); src.stop(t + 0.15); }
        if (s % 2 === 1) { const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf; const g = this.ctx.createGain(); const fl = this.ctx.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 7000; g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04); src.connect(fl); fl.connect(g); g.connect(this.music); src.start(t); src.stop(t + 0.05); }
        bgm.step++; bgm.next += spb;
      }
      bgm.timer = setTimeout(sched, 50);
    };
    sched();
  },
  stopBGM() { if (this.bgm) { this.bgm.alive = false; clearTimeout(this.bgm.timer); this.bgm = null; } },
};
