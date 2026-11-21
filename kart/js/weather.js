// ===== ランダム天候 & 突発ハプニング（グランプリ・VS・バトル共通） =====
// 天候：晴れ / 大雨 / 嵐（雨＋横風＋カミナリ） / 砂嵐 / 竜巻   … レース中にランダムで移り変わる
// ハプニング：大岩が転がってくる・カミナリが落ちる（どの天候でもたまに起きる）
const WEATHER = {
  clear: { name: '晴れ', icon: '☀️' },
  rain: { name: '大雨', icon: '🌧️', rain: 1, dark: 0.35, fog: 0x8a96a6, far: 260, grip: 0.9 },
  storm: { name: '嵐', icon: '⛈️', rain: 1.6, dark: 0.6, fog: 0x4a5262, far: 190, wind: 7, bolts: 4, grip: 0.86 },
  sand: { name: '砂嵐', icon: '🌪️', sand: 1, dark: 0.25, fog: 0xc89a5a, far: 120, wind: 9, grip: 0.92 },
  tornado: { name: '竜巻', icon: '🌀', rain: 0.5, dark: 0.45, fog: 0x6a6e6a, far: 240, wind: 4, twisters: 1 },
};
const WX_INDOOR = ['sea', 'cave', 'alien', 'moon', 'gas', 'crystal'];

Object.assign(Game.prototype, {
  setupWeather() {
    const biome = (typeof BIOME !== 'undefined' && (BIOME[this.def.id] || BIOME[this.def.baseId])) || this.def.biome || 'meadow';
    this.wx = {
      indoor: WX_INDOOR.includes(biome) || !!this.def.space, online: !!this.cfg.netId,
      kind: 'clear', lv: 0, nextT: 3 + Math.random() * 6, boltT: 9 + Math.random() * 8, rockT: 14 + Math.random() * 10,
      twT: 6, rocks: [], strikes: [], twisters: [], flashT: 0,
      base: { c: this.baseFog.c.clone(), far: this.baseFog.far, sun: this.sun ? this.sun.intensity : 1 },
    };
    this.hemi = this.scene.children.find(o => o.isHemisphereLight); if (this.hemi) this.wx.base.hemi = this.hemi.intensity;
    // 最初の天候：半分くらいの確率で荒れ模様
    this.wx.kind = this.pickWeather(true);
    // 雨（線）
    const NR = 1500, rg = new THREE.BufferGeometry(), rp = new Float32Array(NR * 6);
    rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    this.rainMesh = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xc8d8ee, transparent: true, opacity: 0, depthWrite: false }));
    this.rainMesh.frustumCulled = false; this.rainMesh.renderOrder = 7; this.scene.add(this.rainMesh);
    this.rainDrops = []; for (let i = 0; i < NR; i++) this.rainDrops.push({ x: (Math.random() - 0.5) * 80, y: Math.random() * 40, z: (Math.random() - 0.5) * 80, v: 38 + Math.random() * 18 });
    // 砂（点）
    const NS = 1400, sg = new THREE.BufferGeometry(), sp = new Float32Array(NS * 3);
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.sandMesh = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xe0b070, size: 0.9, map: U.glowTex(), transparent: true, opacity: 0, depthWrite: false }));
    this.sandMesh.frustumCulled = false; this.sandMesh.renderOrder = 7; this.scene.add(this.sandMesh);
    this.sandDust = []; for (let i = 0; i < NS; i++) this.sandDust.push({ x: (Math.random() - 0.5) * 70, y: Math.random() * 14, z: (Math.random() - 0.5) * 70, v: 0.6 + Math.random() });
  },

  pickWeather(first) {
    const W = this.wx; if (W.indoor) return 'clear';
    const t = [['clear', first ? 45 : 30], ['rain', 22], ['storm', 16], ['sand', 13], ['tornado', 12]].filter(x => x[0] !== W.kind || first);
    let tot = 0; t.forEach(x => tot += x[1]); let r = Math.random() * tot;
    for (const [k, w] of t) { r -= w; if (r <= 0) return k; }
    return 'clear';
  },

  setWeather(kind) {
    const W = this.wx; if (W.kind === kind) return;
    W.kind = kind;
    if (this.player && this.started) { const d = WEATHER[kind]; HUD.toast(`${d.icon} 天気が変わった：${d.name}`); if (kind === 'storm' || kind === 'tornado') SND.play('thunder'); }
  },

  updateWeather(dt) {
    const W = this.wx; if (!W) return;
    const D = WEATHER[W.kind];
    const target = W.kind === 'clear' ? 0 : 1;
    W.lv += (target - W.lv) * Math.min(1, dt * 0.5);
    // 天候の移り変わり
    if (this.started) { W.nextT -= dt; if (W.nextT <= 0) { W.nextT = 28 + Math.random() * 30; this.setWeather(this.pickWeather(false)); } }
    // 空の暗さと霧
    const lv = W.lv, dk = (D.dark || 0) * lv;
    if (D.fog) { this.baseFog.c.copy(W.base.c).lerp(new THREE.Color(D.fog), lv * 0.85); this.baseFog.far = W.base.far + (Math.min(W.base.far, D.far) - W.base.far) * lv; }
    else { this.baseFog.c.lerp(W.base.c, Math.min(1, dt)); this.baseFog.far += (W.base.far - this.baseFog.far) * Math.min(1, dt); }
    if (this.track.sky) { const sc = this.track.sky.material.color; sc.setRGB(1, 1, 1); if (D.fog) sc.lerp(new THREE.Color(D.fog), lv * 0.8); if (W.flashT > 0) sc.lerp(new THREE.Color(0xffffff), 0.6); }
    W.flashT = Math.max(0, W.flashT - dt);
    const fl = W.flashT > 0 ? 2.4 * W.flashT / 0.35 : 0;
    if (this.sun) this.sun.intensity = W.base.sun * (1 - dk) + fl;
    if (this.hemi) this.hemi.intensity = W.base.hemi * (1 - dk * 0.6) + fl * 0.5;
    this.smokeCol = D.rain ? 0xe8eef6 : D.sand ? 0xd8b080 : 0xd8d4cc;
    this.wetGrip = 1 - (1 - (D.grip || 1)) * lv;
    // 雨・砂を描く
    const cam = this.camera.position, rainA = (D.rain || 0) * lv, sandA = (D.sand || 0) * lv, wind = (D.wind || 0) * lv;
    this.rainMesh.material.opacity = Math.min(0.55, rainA * 0.4);
    if (rainA > 0.02) {
      const a = this.rainMesh.geometry.attributes.position.array; let i = 0;
      for (const r of this.rainDrops) {
        r.y -= r.v * dt * (0.8 + rainA * 0.3); r.x += wind * dt * 0.6;
        if (r.y < -6) { r.y = 30 + Math.random() * 10; r.x = (Math.random() - 0.5) * 80; r.z = (Math.random() - 0.5) * 80; }
        const x = cam.x + r.x, y = cam.y + r.y - 8, z = cam.z + r.z;
        a[i++] = x; a[i++] = y; a[i++] = z; a[i++] = x - wind * 0.05; a[i++] = y + 1.1 + rainA * 0.5; a[i++] = z;
      }
      this.rainMesh.geometry.attributes.position.needsUpdate = true; this.rainMesh.visible = true;
    } else this.rainMesh.visible = false;
    this.sandMesh.material.opacity = Math.min(0.85, sandA * 0.8);
    if (sandA > 0.02) {
      const a = this.sandMesh.geometry.attributes.position.array; let i = 0;
      for (const s of this.sandDust) {
        s.x += (wind * 2.2 + s.v * 6) * dt; s.y += Math.sin(this.time * 3 + s.v * 9) * dt * 1.5;
        if (s.x > 35) { s.x = -35; s.z = (Math.random() - 0.5) * 70; s.y = Math.random() * 14; }
        a[i++] = cam.x + s.x; a[i++] = cam.y + s.y - 6; a[i++] = cam.z + s.z;
      }
      this.sandMesh.geometry.attributes.position.needsUpdate = true; this.sandMesh.visible = true;
    } else this.sandMesh.visible = false;
    // 横風（嵐・砂嵐・竜巻）
    if (wind > 0.3 && this.started) {
      W.gust = (W.gust || 0) + dt; const g = Math.sin(W.gust * 0.7) * 0.6 + Math.sin(W.gust * 1.9) * 0.4;
      for (const k of this.karts) if (!k.isRemote && !k.out && k.ufoT <= 0) k.d += g * wind * 0.22 * dt * (3 / (2 + k.weight));
    }
    // 雨のしぶき
    if (rainA > 0.3 && this.player && this.player.grounded && Math.abs(this.player.v) > 12 && Math.random() < 0.7) {
      const p = this.player.model.root.position.clone(); p.y += 0.3;
      this.particles.emit(p, new THREE.Vector3((Math.random() - 0.5) * 5, 2 + Math.random() * 3, (Math.random() - 0.5) * 5), 0xe8f0ff, 0.5, 0.4, 1.6, 6, false);
    }
    SND.setAmbience(rainA, Math.max(wind / 9, sandA * 0.8));
    if (!this.started) return;
    const local = !W.online;
    // カミナリ（嵐で多め、それ以外でもたまに）
    W.boltT -= dt * (D.bolts ? D.bolts : 1);
    if (W.boltT <= 0) { W.boltT = 14 + Math.random() * 14; if (!W.indoor || this.def.id !== 'kaitei') this.lightningStrike(local); }
    // 大岩（どの天候でもたまに）
    W.rockT -= dt; if (W.rockT <= 0) { W.rockT = 22 + Math.random() * 18; if (local) this.spawnBoulder(); }
    // 竜巻
    if (D.twisters && local) { W.twT -= dt; if (W.twT <= 0 && W.twisters.length < 2) { W.twT = 14 + Math.random() * 10; this.spawnTwister(); } }
    this.updateBoulders(dt); this.updateStrikes(dt); this.updateTwisters(dt);
  },

  // ---- カミナリ ----
  lightningStrike(local) {
    const W = this.wx, tr = this.track;
    const cands = this.karts.filter(k => !k.out && !k.finished);
    const k = this.player && !this.player.out && Math.random() < 0.5 ? this.player : cands[Math.floor(Math.random() * cands.length)];
    if (!k) return;
    const lead = this.battle ? (Math.random() - 0.5) * 16 : Math.max(8, k.v * 1.1) + Math.random() * 10;
    const s = k.dist + lead, hw = tr.lerpArr(tr.hw, s), d = U.clamp(k.d + (Math.random() - 0.5) * 7, -hw + 2, hw - 2);
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.4, 3.3, 28), new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    this.scene.add(ring); this.placeOnTrack(ring, s, d, 0.15); ring.rotateX(Math.PI / 2);
    W.strikes.push({ s, d, t: 1.1, ring, local });
    if (k.isPlayer) HUD.toast('⚡ カミナリが落ちる！よけろ！');
  },
  updateStrikes(dt) {
    const W = this.wx;
    for (const o of W.strikes) {
      o.t -= dt;
      o.ring.material.opacity = 0.35 + 0.45 * Math.abs(Math.sin(this.time * 22)); o.ring.scale.setScalar(0.6 + Math.max(0, o.t) * 0.5);
      if (o.t <= 0 && !o.hit) {
        o.hit = true; W.flashT = 0.35;
        const fr = this.track.frame(o.s, this.fr), base = fr.p.clone().addScaledVector(fr.r, o.d).addScaledVector(fr.u, this.track.lerpArr(this.track.off, o.s));
        const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: 0xfaf6ff });
        let x = 0, z = 0; for (let y = 70; y > 0; y -= 6) { const nx = (Math.random() - 0.5) * 5, nz = (Math.random() - 0.5) * 5; const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 6.6, 4), m); seg.position.set((x + nx) / 2, y - 3, (z + nz) / 2); seg.rotation.z = Math.atan2(nx - x, 6); seg.rotation.x = Math.atan2(nz - z, 6); g.add(seg); x = nx; z = nz; }
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: 0xc8d8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(26, 26, 26); glow.position.y = 2; g.add(glow);
        g.position.copy(base); this.scene.add(g); o.bolt = g;
        const near = this.player ? this.player.model.root.position.distanceTo(base) : 0;
        SND.thunder(near < 30 ? 1 : near < 120 ? 0.6 : 0.3, near / 340);
        if (near < 20) HUD.shake(0.55);
        for (let i = 0; i < 30; i++) this.particles.emit(base, new THREE.Vector3((Math.random() - 0.5) * 24, Math.random() * 16, (Math.random() - 0.5) * 24), i % 2 ? 0xfff6a0 : 0xaad8ff, 0.6, 1.6, 0.3, 14);
        if (o.local) for (const k of this.karts) {
          if (k.isRemote || k.out) continue;
          if (Math.abs(this.dDist(k.dist, o.s)) < 3.8 && Math.abs(k.d - o.d) < 3.8 && k.h < 5) { this.damage(k, 'shock', { balloons: 1 }); if (k.isPlayer) HUD.toast('⚡ ビリビリッ！カミナリ直撃！'); }
        }
      }
      if (o.bolt) o.bolt.visible = Math.floor(o.t * 40) % 3 !== 0;
      if (o.t < -0.35) { this.scene.remove(o.ring); if (o.bolt) this.scene.remove(o.bolt); o.dead = true; }
    }
    W.strikes = W.strikes.filter(o => !o.dead);
  },

  // ---- 転がってくる大岩 ----
  spawnBoulder() {
    const W = this.wx, tr = this.track, P = this.player && !this.player.out ? this.player : this.karts.find(k => !k.out);
    if (!P) return;
    const s = P.dist + 110 + Math.random() * 40;
    if (!this.battle && (s > tr.finishS - 40 || (tr.flagAt && tr.flagAt(s) & (1 | 16)))) return;
    const hw = tr.lerpArr(tr.hw, s), r = 3.2 + Math.random() * 1.2;
    const g = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), new THREE.MeshStandardMaterial({ color: 0x7a6e62, roughness: 0.95, flatShading: true }));
    const pos = rock.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const f = 0.85 + Math.random() * 0.3; pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f, pos.getZ(i) * f); } rock.geometry.computeVertexNormals();
    rock.castShadow = true; g.add(rock); this.scene.add(g); this.placeOnTrack(g, s, P.d, r);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(r * 1.1, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })); this.scene.add(shadow);
    W.rocks.push({ g, rock, shadow, s, d: U.clamp(P.d + (Math.random() - 0.5) * hw, -hw + r, hw - r), v: -(22 + Math.random() * 10), r, t: 0, sway: (Math.random() - 0.5) * 3 });
    HUD.toast('🪨 ゴゴゴ…大岩が転がってきた！');
    SND.play('rumble');
  },
  updateBoulders(dt) {
    const W = this.wx, tr = this.track;
    for (const b of W.rocks) {
      b.t += dt; b.s += b.v * dt; b.d += Math.sin(b.t * 0.9) * b.sway * dt;
      const hw = tr.lerpArr(tr.hw, b.s); b.d = U.clamp(b.d, -hw + b.r * 0.6, hw - b.r * 0.6);
      const bounce = Math.abs(Math.sin(b.t * 2.6)) * 1.4;
      this.placeOnTrack(b.g, b.s, b.d, b.r * 0.85 + bounce, Math.PI);
      b.rock.rotation.x -= b.v / b.r * dt;
      this.placeOnTrack(b.shadow, b.s, b.d, 0.08); b.shadow.rotateX(-Math.PI / 2);
      if (Math.random() < 0.5) this.particles.emit(b.g.position.clone().add(new THREE.Vector3(0, -b.r * 0.7, 0)), new THREE.Vector3((Math.random() - 0.5) * 6, 2 + Math.random() * 2, (Math.random() - 0.5) * 6), 0xb8a888, 1.0, 1.2, 4, -0.4, false);
      if (this.player) { const dd = this.player.model.root.position.distanceTo(b.g.position); if (dd < 40) HUD.shake(Math.min(0.25, (40 - dd) / 160)); }
      for (const k of this.karts) {
        if (k.isRemote || k.out || k.h > b.r + 1) continue;
        if (Math.abs(this.dDist(k.dist, b.s)) < b.r + 1 && Math.abs(k.d - b.d) < b.r + 0.8 && !(b.hitIds || (b.hitIds = new Set())).has(k.id)) {
          b.hitIds.add(k.id); this.damage(k, 'flat', { balloons: 2 }); if (k.isPlayer) { HUD.toast('🪨 大岩にひかれてペチャンコ！'); SND.play('crash'); }
        }
      }
      const behind = this.player ? this.dDist(b.s, this.player.dist) : -999;
      if (b.t > 14 || behind < -80 || (!this.battle && b.s < tr.startS)) { this.scene.remove(b.g); this.scene.remove(b.shadow); b.dead = true; }
    }
    W.rocks = W.rocks.filter(b => !b.dead);
  },

  // ---- 竜巻 ----
  spawnTwister() {
    const W = this.wx, tr = this.track, P = this.player && !this.player.out ? this.player : this.karts.find(k => !k.out);
    if (!P) return;
    const s = P.dist + 90 + Math.random() * 60, hw = tr.lerpArr(tr.hw, s);
    const g = new THREE.Group(), layers = [];
    for (let i = 0; i < 14; i++) {
      const rr = 1.2 + i * i * 0.07 + i * 0.35;
      const m = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.35 + i * 0.06, 6, 18), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x8a8a84 : 0xa8a49a, transparent: true, opacity: 0.55 - i * 0.015, depthWrite: false }));
      m.rotation.x = Math.PI / 2; m.position.y = i * 2.6; g.add(m); layers.push(m);
    }
    this.scene.add(g); this.placeOnTrack(g, s, U.clamp(P.d, -hw + 4, hw - 4), 0);
    W.twisters.push({ g, layers, s, d: U.clamp(P.d, -hw + 4, hw - 4), v: -(6 + Math.random() * 6), t: 0, life: 16, caught: new Set() });
    HUD.toast('🌪️ 竜巻が近づいてくる！');
    SND.play('fan');
  },
  updateTwisters(dt) {
    const W = this.wx, tr = this.track;
    for (const w of W.twisters) {
      w.t += dt; w.s += w.v * dt; w.d += Math.sin(w.t * 0.6) * 5 * dt;
      const hw = tr.lerpArr(tr.hw, w.s); w.d = U.clamp(w.d, -hw + 3, hw - 3);
      this.placeOnTrack(w.g, w.s, w.d, 0);
      w.layers.forEach((m, i) => { m.rotation.z += dt * (4 + i * 0.3); m.position.x = Math.sin(w.t * 2 + i * 0.5) * i * 0.18; });
      if (Math.random() < 0.8) { const a = Math.random() * 6.28, rr = 2 + Math.random() * 4; this.particles.emit(w.g.position.clone().add(new THREE.Vector3(Math.cos(a) * rr, Math.random() * 3, Math.sin(a) * rr)), new THREE.Vector3(-Math.sin(a) * 10, 6 + Math.random() * 8, Math.cos(a) * 10), 0x9a948a, 1.2, 1.5, 4, -1, false); }
      if (this.player) { const dd = this.player.model.root.position.distanceTo(w.g.position); SND.setTwister(Math.max(0, 1 - dd / 90)); if (dd < 30) HUD.shake(0.12); }
      for (const k of this.karts) {
        if (k.isRemote || k.out || k.respawnT > 0) continue;
        const ds = this.dDist(k.dist, w.s), dd = k.d - w.d, dist = Math.hypot(ds, dd);
        if (dist < 14 && k.ufoT <= 0) k.d -= Math.sign(dd || 1) * (14 - dist) * 0.25 * dt;   // 吸い寄せ
        if (dist < 4.2 && !w.caught.has(k.id)) {
          w.caught.add(k.id); this.damage(k, 'knock', { balloons: 1 });
          if (k.knockT > 0 || !k.grounded) { k.vh = 16; k.grounded = false; k.airT = 0; k.trick = true; k.trickT = 0; }
          if (k.isPlayer) { HUD.toast('🌪️ 竜巻に巻き上げられた！'); SND.play('fan'); }
        }
      }
      if (w.t > w.life || (this.player && this.dDist(w.s, this.player.dist) < -60)) { this.scene.remove(w.g); w.dead = true; }
    }
    W.twisters = W.twisters.filter(w => !w.dead);
    if (!W.twisters.length) SND.setTwister(0);
  },
});
