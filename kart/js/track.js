// ===== トラック構築（サンプル列・メッシュ・地形・装飾） =====
class Track {
  constructor(def) {
    this.def = def;
    this.theme = def.theme;
    this._build();
  }

  _build() {
    const def = this.def;
    const r = turtle(def);
    const cmds = r.cmds;
    let pts = r.pts;
    const n0 = pts.length;
    // クローズ誤差を分散
    const E = r.end;
    pts.forEach((p, k) => { const t = (k + 1) / n0; p.x -= E[0] * t; p.y -= E[1] * t; p.z -= E[2] * t; });
    // 平滑化
    for (let pass = 0; pass < 2; pass++) {
      const q = pts.map(p => ({ x: p.x, y: p.y, z: p.z }));
      for (let k = 0; k < n0; k++) {
        let sx = 0, sy = 0, sz = 0;
        for (let o = -2; o <= 2; o++) { const p = q[(k + o + n0) % n0]; sx += p.x; sy += p.y; sz += p.z; }
        pts[k].x = sx / 5; pts[k].y = sy / 5; pts[k].z = sz / 5;
      }
    }
    // 等間隔リサンプル
    const cum = [0];
    for (let k = 0; k < n0; k++) {
      const a = pts[k], b = pts[(k + 1) % n0];
      cum.push(cum[k] + Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z));
    }
    const total = cum[n0];
    const N = Math.round(total);
    const ds = total / N;
    this.N = N; this.ds = ds; this.L = total;
    const F = (n) => new Float32Array(n);
    const P = F(N * 3), T = F(N * 3), Uv = F(N * 3), R = F(N * 3);
    const hw = F(N), sh = F(N), off = F(N), kap = F(N), bank = F(N), roll = F(N), ai = F(N);
    const flags = new Uint8Array(N), ci = new Int16Array(N), tt = F(N), surfI = new Uint8Array(N);
    const surfList = [];
    let seg = 0;
    for (let j = 0; j < N; j++) {
      const target = j * ds;
      while (cum[seg + 1] < target && seg < n0 - 1) seg++;
      const a = pts[seg], b = pts[(seg + 1) % n0];
      const f = (target - cum[seg]) / Math.max(1e-6, cum[seg + 1] - cum[seg]);
      P[j * 3] = a.x + (b.x - a.x) * f; P[j * 3 + 1] = a.y + (b.y - a.y) * f; P[j * 3 + 2] = a.z + (b.z - a.z) * f;
      const nb = f < 0.5 ? a : b;
      ci[j] = nb.ci; tt[j] = nb.tt; if (nb.loop) flags[j] |= 16;
    }
    // 先頭サンプルはコマンド0の開始
    // コマンドごとの属性
    this.cmdStart = []; this.cmdCount = [];
    for (let j = 0; j < N; j++) { const c = ci[j]; if (this.cmdStart[c] == null) this.cmdStart[c] = j; this.cmdCount[c] = (this.cmdCount[c] || 0) + 1; }
    let rollBase = 0, lastCi = -1, curCork = 0;
    for (let j = 0; j < N; j++) {
      const c = cmds[ci[j]];
      if (ci[j] !== lastCi) { rollBase += curCork; curCork = c.cork ? c.cork * Math.PI / 180 : 0; lastCi = ci[j]; }
      hw[j] = (c.w ?? def.w) / 2;
      sh[j] = c.sh ?? def.sh;
      const wall = c.wall === false ? false : !!def.wall;
      if (!wall) flags[j] |= 2;
      if (c.gap) flags[j] |= 1;
      if (c.tunnel === 'arch') flags[j] |= 4;
      if (c.tunnel === 'tube') flags[j] |= 8;
      const sf = c.surf || def.surf;
      let si = surfList.indexOf(sf); if (si < 0) { surfList.push(sf); si = surfList.length - 1; }
      surfI[j] = si;
      const len = cmdLength(c);
      let o = 0;
      if (c.ramp) {
        const st = 1 - c.ramp.len / len;
        if (tt[j] > st) { const u = (tt[j] - st) / (1 - st); o += c.ramp.h * Math.pow(u, 1.6); }
      }
      if (c.bumps) {
        const s = j * ds;
        const taper = Math.min(1, tt[j] * 8, (1 - tt[j]) * 8);
        o += c.bumps * 0.5 * (1 - Math.cos(2 * Math.PI * s / 7.5)) * (0.65 + 0.35 * Math.sin(s * 0.37)) * taper;
      }
      off[j] = o;
      bank[j] = c.bank && c.t === 'c' ? c.bank * Math.PI / 180 * Math.sign(c.ang) : 0;
      roll[j] = rollBase + curCork * tt[j];
    }
    this.surfList = surfList;
    // 平滑化（幅・バンク）
    const smooth = (arr, w) => {
      const out = F(N);
      for (let j = 0; j < N; j++) { let s = 0; for (let o = -w; o <= w; o++) s += arr[(j + o + N) % N]; out[j] = s / (2 * w + 1); }
      return out;
    };
    const hwS = smooth(hw, 10), shS = smooth(sh, 10);
    if (!def.battle) for (let j = 0; j < N; j++) { const q = j * ds; hwS[j] *= 1 + 0.16 * Math.sin(q * 0.031) + 0.08 * Math.sin(q * 0.093 + 1); shS[j] *= 1 + 0.4 * Math.sin(q * 0.07 + 2); }
    const _u = 0, bankS = smooth(smooth(bank, 18), 10);
    // フレーム
    const v = new THREE.Vector3(), t = new THREE.Vector3(), u = new THREE.Vector3(), rr = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    let prevU = new THREE.Vector3(0, 1, 0);
    for (let j = 0; j < N; j++) {
      const a = (j - 1 + N) % N, b = (j + 1) % N;
      t.set(P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]).normalize();
      if (flags[j] & 16) {
        u.copy(prevU).addScaledVector(t, -prevU.dot(t)).normalize();
      } else {
        u.copy(up).addScaledVector(t, -up.dot(t)).normalize();
      }
      prevU.copy(u);
      const rl = roll[j] + bankS[j];
      rr.crossVectors(t, u);
      if (rl !== 0) { const c = Math.cos(rl), s = Math.sin(rl); v.copy(u).multiplyScalar(c).addScaledVector(rr, s); u.copy(v).normalize(); }
      rr.crossVectors(t, u).normalize();
      u.crossVectors(rr, t).normalize();
      T.set([t.x, t.y, t.z], j * 3); Uv.set([u.x, u.y, u.z], j * 3); R.set([rr.x, rr.y, rr.z], j * 3);
    }
    for (let j = 0; j < N; j++) {
      const a = (j - 1 + N) % N, b = (j + 1) % N;
      const dx = T[b * 3] - T[a * 3], dy = T[b * 3 + 1] - T[a * 3 + 1], dz = T[b * 3 + 2] - T[a * 3 + 2];
      kap[j] = (dx * R[j * 3] + dy * R[j * 3 + 1] + dz * R[j * 3 + 2]) / (2 * ds);
    }
    Object.assign(this, { P, T, Uv, R, hw: hwS, sh: shS, off, kap, flags, ci, tt, surfI, cmds });
    // AIライン（インを突く）
    const raw = F(N);
    for (let j = 0; j < N; j++) {
      let k = 0; for (let o = -6; o <= 26; o += 2) k += kap[(j + o + N) % N];
      k /= 17;
      raw[j] = U.clamp(k * 28, -1, 1) * hwS[j] * 0.62;
      if (off[j] > 0.5 || (flags[j] & 1)) raw[j] *= 0.2;
    }
    const aiS = smooth(smooth(raw, 14), 8);
    this.ai = aiS;
    // アイテムボックス・ダッシュ板・看板位置
    this.itemRows = []; this.boosts = []; this.signs = [];
    cmds.forEach((c, k) => {
      const st = this.cmdStart[k], cnt = this.cmdCount[k] || 1;
      if (c.items != null) this.itemRows.push(st + Math.floor(cnt * c.items));
      if (c.boost != null) this.boosts.push(st + Math.floor(cnt * c.boost));
      if (c.sign) this.signs.push({ i: st + Math.floor(cnt * 0.3), text: c.sign });
    });
    // 範囲
    let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (let j = 0; j < N; j++) {
      minX = Math.min(minX, P[j * 3]); maxX = Math.max(maxX, P[j * 3]);
      minY = Math.min(minY, P[j * 3 + 1]); maxY = Math.max(maxY, P[j * 3 + 1]);
      minZ = Math.min(minZ, P[j * 3 + 2]); maxZ = Math.max(maxZ, P[j * 3 + 2]);
    }
    this.bounds = { minX, maxX, minY, maxY, minZ, maxZ };
    // 空間グリッド
    this.cell = 24; this.grid = new Map();
    for (let j = 0; j < N; j += 2) {
      const key = Math.floor(P[j * 3] / this.cell) + ',' + Math.floor(P[j * 3 + 2] / this.cell);
      if (!this.grid.has(key)) this.grid.set(key, []);
      this.grid.get(key).push(j);
    }
  }

  // ---- クエリ ----
  wrap(s) { s %= this.L; if (s < 0) s += this.L; return s; }
  idx(s) { const x = this.wrap(s) / this.ds; const i = Math.floor(x); return [i % this.N, x - i]; }
  lerpArr(a, s) { const [i, f] = this.idx(s); const j = (i + 1) % this.N; return a[i] + (a[j] - a[i]) * f; }
  frame(s, o) {
    const [i, f] = this.idx(s); const j = (i + 1) % this.N;
    const A = (arr, v) => v.set(arr[i * 3] + (arr[j * 3] - arr[i * 3]) * f, arr[i * 3 + 1] + (arr[j * 3 + 1] - arr[i * 3 + 1]) * f, arr[i * 3 + 2] + (arr[j * 3 + 2] - arr[i * 3 + 2]) * f);
    A(this.P, o.p); A(this.T, o.t).normalize(); A(this.Uv, o.u).normalize(); A(this.R, o.r).normalize();
    return o;
  }
  flagAt(s) { return this.flags[this.idx(s)[0]]; }
  surfAt(s) { return this.surfList[this.surfI[this.idx(s)[0]]]; }
  nearest(x, z, radius) {
    const c = this.cell, gx = Math.floor(x / c), gz = Math.floor(z / c);
    let best = 1e9, bi = -1, minY = 1e9;
    const rc = Math.ceil(radius / c);
    for (let a = -rc; a <= rc; a++) for (let b = -rc; b <= rc; b++) {
      const arr = this.grid.get((gx + a) + ',' + (gz + b)); if (!arr) continue;
      for (const j of arr) {
        const d = Math.hypot(this.P[j * 3] - x, this.P[j * 3 + 2] - z);
        if (d < best) { best = d; bi = j; }
      }
    }
    if (bi >= 0) {
      const lim = best + 8;
      for (let a = -rc; a <= rc; a++) for (let b = -rc; b <= rc; b++) {
        const arr = this.grid.get((gx + a) + ',' + (gz + b)); if (!arr) continue;
        for (const j of arr) if (Math.hypot(this.P[j * 3] - x, this.P[j * 3 + 2] - z) < lim) minY = Math.min(minY, this.P[j * 3 + 1]);
      }
    }
    return { d: best, i: bi, y: minY };
  }

  // ---- 地形の高さ ----
  terrainH(x, z) {
    const def = this.def, b = this.bounds;
    const base = b.minY - (def.groundDrop ?? this.theme.groundDrop ?? 0.8);
    const hill = (Math.sin(x * 0.011) * Math.cos(z * 0.013) + 0.5 * Math.sin(x * 0.027 + z * 0.019) + 0.3 * Math.cos(x * 0.05 - z * 0.041)) / 1.8;
    const A = def.id === 'gake' ? 55 : def.id === 'mori' ? 14 : def.id === 'touge' ? 45 : def.id === 'canyon' ? 30 : def.id === 'kaitei' ? 8 : 6;
    if (def.groundDrop && def.id === 'coaster') return base;
    const nr = this.nearest(x, z, 90);
    if (nr.i < 0) return base + Math.max(0, hill) * A + (def.id === 'touge' ? 10 : 0);
    const j = nr.i, fl = this.flags[j];
    const edge = this.hw[j] + this.sh[j];
    let near = nr.y - 0.45;
    if (def.id === 'canyon') near = Math.max(base, nr.y - 1.3);
    if (fl & 1) near = base - 30;
    const w = U.clamp((nr.d - edge - 8) / 70, 0, 1);
    const ws = w * w * (3 - 2 * w);
    let h = near + hill * A * ws;
    if (def.id === 'touge' || def.id === 'gake') h = near + (Math.abs(hill) * A + 6) * ws;
    if (def.id === 'canyon') h = near + (hill > -0.1 ? 1 : -1) * A * ws;
    if (fl & 4) {
      if (nr.d < edge + 3) h = nr.y - 4;
      else h = Math.max(h, nr.y + 14 * U.clamp((nr.d - edge - 3) / 6, 0, 1));
    }
    if (fl & 1 && nr.d < edge + 30) h = Math.min(h, base - 30);
    if (def.id === 'kaitei' && nr.y > def.water + 1 && nr.d < edge + 30) h = Math.max(h, def.water + 1.2 - nr.d * 0.05);
    return h;
  }

  // ---- メッシュ構築 ----
  buildScene(scene) {
    const def = this.def, th = this.theme;
    this.group = new THREE.Group(); scene.add(this.group);
    const G = this.group;
    this._buildRoad(G);
    this._buildWalls(G);
    this._buildTunnels(G);
    this._buildStart(G);
    this._buildSigns(G);
    if (!def.noGround) this._buildGround(G);
    this._buildPillars(G);
    this._buildDeco(G);
    if (def.water != null) {
      const b = this.bounds;
      const geo = new THREE.PlaneGeometry(b.maxX - b.minX + 1600, b.maxZ - b.minZ + 1600);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: def.waterColor || 0x2a9ad8, transparent: true, opacity: def.waterColor ? 0.78 : 0.55, roughness: 0.15, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false }));
      m.position.set((b.minX + b.maxX) / 2, def.water, (b.minZ + b.maxZ) / 2);
      m.renderOrder = 2;
      G.add(m); this.waterMesh = m;
    }
    if (def.lava) {
      const b = this.bounds;
      const geo = new THREE.PlaneGeometry(b.maxX - b.minX + 1200, b.maxZ - b.minZ + 1200, 1, 1); geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff5a12, fog: true }));
      m.position.set((b.minX + b.maxX) / 2, b.minY - 18, (b.minZ + b.maxZ) / 2);
      G.add(m);
      const pl = new THREE.PointLight(0xff6a20, 1.2, 300); pl.position.set(m.position.x, b.minY - 5, m.position.z); G.add(pl);
    }
    this._buildSky(scene);
  }

  _ribbon(runTest, d0f, d1f, h0, h1, mat, vScale, skipGap = true) {
    // d0f/d1f: (j)=>横位置, 区間ごとに分割
    const N = this.N, G = [];
    const pos = [], uv = [], idx = [];
    let vcount = 0;
    const emit = () => {
      if (!pos.length) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx); geo.computeVertexNormals();
      G.push(new THREE.Mesh(geo, mat));
      pos.length = 0; uv.length = 0; idx.length = 0; vcount = 0;
    };
    let open = false;
    for (let jj = 0; jj <= N; jj++) {
      const j = jj % N;
      const ok = runTest(j) && !(skipGap && (this.flags[j] & 1));
      if (!ok) { if (open) { emit(); open = false; } continue; }
      const P = this.P, R = this.R, Uv = this.Uv;
      const o = this.off[j];
      const d0 = d0f(j), d1 = d1f(j);
      for (const [d, hh, uu] of [[d0, h0, 0], [d1, h1, 1]]) {
        const hy = (typeof hh === 'function' ? hh(j) : hh) + o;
        pos.push(P[j * 3] + R[j * 3] * d + Uv[j * 3] * hy, P[j * 3 + 1] + R[j * 3 + 1] * d + Uv[j * 3 + 1] * hy, P[j * 3 + 2] + R[j * 3 + 2] * d + Uv[j * 3 + 2] * hy);
        uv.push(uu, jj * this.ds / vScale);
      }
      if (open) { const b = vcount - 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      vcount += 2; open = true;
    }
    emit();
    return G;
  }

  _buildRoad(G) {
    const def = this.def;
    const surfMats = this.surfList.map(sf => new THREE.MeshStandardMaterial({ map: U.surfTex(sf), roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide, emissive: ['alien', 'cave', 'crystalground', 'venus'].includes(sf) ? 0xffffff : 0, emissiveMap: ['alien', 'cave', 'crystalground', 'venus'].includes(sf) ? U.surfTex(sf) : null, emissiveIntensity: 0.45 }));
    this.surfList.forEach((sf, si) => {
      this._ribbon(j => this.surfI[j] === si, j => -this.hw[j], j => this.hw[j], 0, 0, surfMats[si], 16).forEach(m => G.add(m));
    });
    const shTex = U.surfTex(def.shSurf || 'grass');
    const shMat = new THREE.MeshStandardMaterial({ map: shTex, roughness: 0.9, side: THREE.DoubleSide, emissive: ['neon2', 'crystal2'].includes(def.shSurf) ? 0x4020a0 : 0, emissiveIntensity: 0.4 });
    this._ribbon(j => true, j => -this.hw[j] - this.sh[j], j => -this.hw[j], -0.02, -0.02, shMat, 8).forEach(m => G.add(m));
    this._ribbon(j => true, j => this.hw[j], j => this.hw[j] + this.sh[j], -0.02, -0.02, shMat, 8).forEach(m => G.add(m));
    if (false) {
      const cm = new THREE.MeshStandardMaterial({ map: U.surfTex('curb'), roughness: 0.7, side: THREE.DoubleSide });
      this._ribbon(j => true, j => -this.hw[j] - 0.9, j => -this.hw[j], 0.01, 0.01, cm, 6).forEach(m => G.add(m));
      this._ribbon(j => true, j => this.hw[j], j => this.hw[j] + 0.9, 0.01, 0.01, cm, 6).forEach(m => G.add(m));
    }
    // 裏面と側面
    const under = new THREE.MeshStandardMaterial({ map: U.surfTex(def.space ? 'crystal2' : def.lava ? 'basalt' : 'earthside'), color: 0xffffff, roughness: 1, side: THREE.DoubleSide });
    const dep = def.noGround ? -3.2 : -1.2;
    const ed = j => this.hw[j] + this.sh[j];
    this._ribbon(j => !(this.flags[j] & 8), j => -ed(j) * 0.8, j => ed(j) * 0.8, dep, dep, under, 10).forEach(m => G.add(m));
    this._ribbon(j => !(this.flags[j] & 8), j => -ed(j) * 0.8, j => -ed(j), dep, -0.02, under, 10).forEach(m => G.add(m));
    this._ribbon(j => !(this.flags[j] & 8), j => ed(j), j => ed(j) * 0.8, -0.02, dep, under, 10).forEach(m => G.add(m));
    this._buildEdge(G);
  }

  _buildEdge(G) {
    const def = this.def, types = def.edge || [];
    if (!types.length) return;
    const rng = U.rng(def.id.length * 31 + 5);
    const fr = { p: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), r: new THREE.Vector3() };
    const lists = types.map(() => []);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ry = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    const step = def.battle ? 7 : 4;
    for (let j = 0; j < this.N; j += step) {
      if (this.flags[j] & (1 | 8 | 16)) continue;
      this.frame(j * this.ds, fr);
      for (const side of [-1, 1]) {
        if (rng() < 0.15) continue;
        const ti = Math.floor(rng() * types.length);
        const d = side * (this.hw[j] + this.sh[j] + 0.3 + rng() * 1.6);
        p.copy(fr.p).addScaledVector(fr.r, d).addScaledVector(fr.u, -0.1);
        m4.makeBasis(fr.r, fr.u, fr.t.clone().negate()); q.setFromRotationMatrix(m4);
        ry.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * 6.28); q.multiply(ry);
        const k = 0.6 + rng() * 0.8; sc.set(k, k, k);
        lists[ti].push(new THREE.Matrix4().compose(p.clone(), q.clone(), sc.clone()));
      }
    }
    types.forEach((t, ti) => {
      const parts = DECO[t] ? DECO[t]() : null; if (!parts || !lists[ti].length) return;
      for (const part of parts) {
        const im = new THREE.InstancedMesh(part.geo, part.mat, lists[ti].length);
        lists[ti].forEach((mm, k) => { m4.multiplyMatrices(mm, part.m); im.setMatrixAt(k, m4); });
        G.add(im);
      }
    });
  }

  _buildWalls(G) {
    const w = this.def.wall; if (!w || w === 'none') return;
    const styles = {
      hedge: [0x3f8f34, 1.3, 0], guard: [0xdfe4ea, 1.0, 0.3], fence: [0x9a6a3a, 1.1, 0], logs: [0x7a4f2a, 1.2, 0],
      rail: [0xff4fa0, 1.2, 0.3], candywall: [0xff7ab0, 1.6, 0.2], rock: [0x9a5a34, 1.8, 0], coral: [0xff7aa8, 1.3, 0], crystal: [0xa05aff, 1.5, 0.6], glow: [0x40e8ff, 0.9, 1.0],
    };
    const [col, hgt, emi] = styles[w] || styles.guard;
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.3, emissive: emi ? col : 0, emissiveIntensity: emi, side: THREE.DoubleSide, transparent: w === 'glow', opacity: w === 'glow' ? 0.75 : 1 });
    const ed = j => this.hw[j] + this.sh[j];
    const test = j => !(this.flags[j] & 2);
    const h0 = w === 'guard' ? 0.35 : 0;
    this._ribbon(test, j => -ed(j), j => -ed(j), h0, hgt, mat, 4).forEach(m => G.add(m));
    this._ribbon(test, j => ed(j), j => ed(j), h0, hgt, mat, 4).forEach(m => G.add(m));
    if (w === 'guard') {
      const pm = U.mat(0x9aa0a8, { m: 0.5 });
      this._ribbon(test, j => -ed(j) - 0.05, j => -ed(j) - 0.05, 0, 0.36, pm, 4).forEach(m => G.add(m));
      this._ribbon(test, j => ed(j) + 0.05, j => ed(j) + 0.05, 0, 0.36, pm, 4).forEach(m => G.add(m));
    }
  }

  _buildTunnels(G) {
    const N = this.N;
    for (const [flag, full] of [[4, false], [8, true]]) {
      const pos = [], idx = [], uv = [];
      const segs = 14;
      let rows = 0, open = false;
      const mats = full ? new THREE.MeshStandardMaterial({ map: U.surfTex('rock2'), color: 0x9a7a6a, roughness: 1, side: THREE.DoubleSide })
        : new THREE.MeshStandardMaterial({ color: 0x8a8a86, roughness: 0.9, side: THREE.DoubleSide });
      const emit = () => {
        if (!pos.length) return;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx); g.computeVertexNormals();
        G.add(new THREE.Mesh(g, mats));
        pos.length = idx.length = uv.length = 0; rows = 0;
      };
      const lights = [];
      for (let jj = 0; jj <= N; jj++) {
        const j = jj % N;
        if (!(this.flags[j] & flag)) { if (open) { emit(); open = false; } continue; }
        const rad = this.hw[j] + this.sh[j] + 1.2;
        const cy = full ? rad * 0.35 : 0;
        for (let k = 0; k <= segs; k++) {
          const a = full ? (k / segs) * Math.PI * 2 : (k / segs) * Math.PI;
          const cx = Math.cos(a) * rad, cyy = Math.sin(a) * rad * (full ? 1 : 0.75) + cy;
          for (let q = 0; q < 3; q++) pos.push(this.P[j * 3 + q] + this.R[j * 3 + q] * cx + this.Uv[j * 3 + q] * cyy);
          uv.push(k / segs * 4, jj * this.ds / 10);
        }
        if (open) {
          const b0 = (rows - 1) * (segs + 1), b1 = rows * (segs + 1);
          for (let k = 0; k < segs; k++) idx.push(b0 + k, b1 + k, b0 + k + 1, b0 + k + 1, b1 + k, b1 + k + 1);
        }
        rows++; open = true;
        if (jj % 14 === 0) lights.push([j, rad, cy, full]);
      }
      emit();
      // トンネル照明
      if (lights.length) {
        const lg = new THREE.BoxGeometry(1.6, 0.25, 0.6);
        const lm = new THREE.MeshBasicMaterial({ color: full ? 0xff9a50 : 0xffe28a });
        const im = new THREE.InstancedMesh(lg, lm, lights.length * 2);
        const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1);
        const fr = { p: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), r: new THREE.Vector3() };
        let c = 0;
        for (const [j, rad, cy, fl] of lights) {
          this.frame(j * this.ds, fr);
          for (const side of [-1, 1]) {
            const ang = fl ? Math.PI / 2 + side * 0.5 : Math.PI / 2 + side * 0.6;
            const p = fr.p.clone().addScaledVector(fr.r, Math.cos(ang) * (rad - 0.3)).addScaledVector(fr.u, Math.sin(ang) * (rad - 0.3) * (fl ? 1 : 0.75) + cy);
            m4.makeBasis(fr.r, fr.u, fr.t.clone().negate()); q.setFromRotationMatrix(m4);
            m4.compose(p, q, sc); im.setMatrixAt(c++, m4);
          }
        }
        G.add(im);
      }
    }
  }

  _buildStart(G) {
    const fr = this.frame(0.5, { p: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), r: new THREE.Vector3() });
    const w = this.hw[0] * 2;
    const geo = new THREE.PlaneGeometry(w, 2.4);
    const tex = U.checkerTex(); tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(w / 3, 1);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex }));
    const mat = new THREE.Matrix4().makeBasis(fr.r, fr.t, fr.u);
    m.quaternion.setFromRotationMatrix(mat);
    m.position.copy(fr.p).addScaledVector(fr.u, 0.04);
    G.add(m);
    this._gantry(G, 2, 'START', 0xfff4d0, 0x8a4a20, true);
  }

  _gantry(G, j, text, fg, bg, checker) {
    const fr = this.frame(j * this.ds, { p: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), r: new THREE.Vector3() });
    const ed = this.hw[j] + this.sh[j] + 0.6;
    const pm = U.mat(0x7a5a3a, { r: 0.9 });
    const g = new THREE.Group();
    const basis = new THREE.Matrix4().makeBasis(fr.r, fr.u, fr.t.clone().negate());
    g.quaternion.setFromRotationMatrix(basis); g.position.copy(fr.p);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 9, 8), pm); p.position.set(s * ed, 4.5, 0); g.add(p); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(ed * 2, 0.5, 0.5), pm); beam.position.set(0, 8.5, 0); g.add(beam);
    const tex = U.textTex(text, U.hex(bg), U.hex(fg));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(ed * 1.6, 16), 3.2), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    sign.position.set(0, 7, 0.3); g.add(sign);
    G.add(g);
  }

  _buildSigns(G) {
    for (const s of this.signs) this._gantry(G, s.i, s.text, 0xffffff, 0x1f5fc0);
  }

  _buildGround(G) {
    const b = this.bounds, th = this.theme;
    const margin = 420;
    const W = b.maxX - b.minX + margin * 2, D = b.maxZ - b.minZ + margin * 2;
    const seg = 150;
    const geo = new THREE.PlaneGeometry(W, D, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    const pos = geo.attributes.position;
    const uvs = geo.attributes.uv;
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k) + cx, z = pos.getZ(k) + cz;
      pos.setXYZ(k, x, this.terrainH(x, z), z);
      uvs.setXY(k, x / 24, z / 24);
    }
    geo.computeVertexNormals();
    const tex = U.surfTex(th.groundTex || 'grass');
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 1 }));
    G.add(m);
    this.groundMesh = m;
  }

  _buildPillars(G) {
    const def = this.def;
    const list = [];
    for (let j = 0; j < this.N; j += 18) {
      if (this.flags[j] & (1 | 16 | 8)) continue;
      const x = this.P[j * 3], y = this.P[j * 3 + 1], z = this.P[j * 3 + 2];
      if (this.Uv[j * 3 + 1] < 0.6) continue;
      let gy;
      if (def.noGround) { if (def.lava) gy = this.bounds.minY - 18; else continue; }
      else gy = this.terrainH(x, z);
      if (y - gy > 3) list.push([x, y - 0.9, z, gy]);
    }
    if (!list.length) return;
    const col = def.id === 'coaster' ? 0xf0f0f0 : def.id === 'canyon' ? 0xa0623a : def.lava ? 0x3a2420 : 0x9a9a94;
    const geo = new THREE.CylinderGeometry(def.id === 'canyon' ? 3 : 0.8, def.id === 'canyon' ? 4.5 : 1, 1, 10);
    geo.translate(0, -0.5, 0);
    const im = new THREE.InstancedMesh(geo, U.mat(col, { m: def.id === 'coaster' ? 0.5 : 0 }), list.length);
    const m4 = new THREE.Matrix4();
    list.forEach(([x, y, z, gy], k) => { m4.makeScale(1, y - gy, 1); m4.setPosition(x, y, z); im.setMatrixAt(k, m4); });
    G.add(im);
  }

  _buildDeco(G) {
    const def = this.def, rng = U.rng(def.id.length * 999 + 7);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    for (const [type, count] of def.deco || []) {
      const parts = DECO[type] ? DECO[type]() : null; if (!parts) continue;
      const far = ['mountain', 'mesa', 'cloud', 'asteroid', 'satellite', 'ferris', 'tentacle', 'floatrock', 'cloudpuff', 'rainbow', 'bigtree'].includes(type);
      const mats = [];
      let tries = 0;
      while (mats.length < count && tries < count * 12) {
        tries++;
        const j = Math.floor(rng() * this.N);
        if (this.flags[j] & (8 | 16)) continue;
        const side = rng() < 0.5 ? -1 : 1;
        const ed = this.hw[j] + this.sh[j];
        const dist = type === 'bigtree' ? ed + 8 + rng() * 60 : far ? ed + 40 + rng() * 260 : ed + 4 + rng() * (type === 'pole' ? 3 : 45);
        const x = this.P[j * 3] + this.R[j * 3] * side * dist, z = this.P[j * 3 + 2] + this.R[j * 3 + 2] * side * dist;
        const nr = this.nearest(x, z, 40);
        if (nr.i >= 0 && nr.d < this.hw[nr.i] + this.sh[nr.i] + (type === 'pole' ? 1.5 : 3)) continue;
        let y;
        if (def.noGround) y = this.P[j * 3 + 1] + (rng() - 0.5) * (far ? 160 : 30) - (far ? 0 : 6);
        if (def.noGround && ['crater', 'flag', 'mushroom', 'glowflower', 'crystal'].includes(type)) y = this.P[j * 3 + 1] - 1;
        else y = this.terrainH(x, z);
        if (def.water != null && ['palm'].includes(type) && y < def.water) continue;
        if (def.water != null && ['coral', 'seaweed'].includes(type) && y > def.water - 2) continue;
        const s = (far ? 1 : 0.7) + rng() * 0.8;
        const yaw = rng() * Math.PI * 2;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        if (type === 'pole') { // 道路沿いに向きを揃える
          const t = new THREE.Vector3(this.T[j * 3], 0, this.T[j * 3 + 2]).normalize();
          q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), t);
        }
        sc.set(s, s, s); p.set(x, y, z);
        mats.push(new THREE.Matrix4().compose(p.clone(), q.clone(), sc.clone()));
      }
      for (const part of parts) {
        const im = new THREE.InstancedMesh(part.geo, part.mat, mats.length);
        mats.forEach((mm, k) => { m4.multiplyMatrices(mm, part.m); im.setMatrixAt(k, m4); });
        G.add(im);
      }
    }
  }

  _buildSky(scene) {
    const th = this.theme;
    const geo = new THREE.SphereGeometry(1800, 32, 16);
    const cols = [];
    const top = new THREE.Color(th.skyTop), bot = new THREE.Color(th.skyBot);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const y = pos.getY(k) / 1800; const t = U.clamp((y + 0.15) / 0.9, 0, 1);
      const c = bot.clone().lerp(top, Math.pow(t, 0.7)); cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -1;
    this.sky = sky; scene.add(sky);
    const def = this.def;
    if (def.space || def.id === 'jupiter') {
      const sg = new THREE.BufferGeometry(); const sp = [];
      const r = U.rng(5);
      for (let k = 0; k < 2500; k++) { const v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(1500); sp.push(v.x, v.y, v.z); }
      sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
      const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false }));
      sky.add(stars);
    }
    if (def.id === 'jupiter' || def.id === 'uchuu' || def.id === 'bosen') {
      const isJ = def.id !== 'uchuu';
      const tex = isJ ? U.bandTex(['#e8c49a', '#c9844e', '#f4e2c4', '#b0603a', '#e0a878'], 'jband') : U.bandTex(['#2a6fd8', '#3a8af0', '#2ea05a', '#f0f0f0', '#1f5fc0'], 'eband');
      const pl = new THREE.Mesh(new THREE.SphereGeometry(isJ ? 520 : 300, 48, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35, fog: false }));
      pl.position.set(-700, isJ ? -350 : 250, -900);
      pl.rotation.z = 0.25;
      if (def.id === 'jupiter') {
        const spot = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 16), new THREE.MeshBasicMaterial({ color: 0xc0402a, fog: false }));
        spot.scale.set(1.6, 0.8, 0.4); spot.position.set(240, -80, 450); pl.add(spot);
      }
      sky.add(pl);
      if (def.id === 'bosen') { pl.scale.setScalar(0.5); pl.position.set(600, 300, -800); }
    }
  }
}

// ===== 装飾パーツ =====
const DECO = (() => {
  const M4 = (x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, ry = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
  const P = (geo, col, m, o) => ({ geo, mat: U.mat(col, o || {}), m });
  return {
    tree: () => [P(new THREE.CylinderGeometry(0.35, 0.5, 3, 6), 0x7a5230, M4(0, 1.5, 0)), P(new THREE.ConeGeometry(2.4, 5, 8), 0x2f8f3a, M4(0, 5, 0), { flat: true })],
    pine: () => [P(new THREE.CylinderGeometry(0.3, 0.45, 3, 6), 0x5a3a20, M4(0, 1.5, 0)), P(new THREE.ConeGeometry(2, 7, 7), 0x1f5f30, M4(0, 6, 0), { flat: true })],
    round: () => [P(new THREE.CylinderGeometry(0.3, 0.4, 2.5, 6), 0x7a5230, M4(0, 1.2, 0)), P(new THREE.IcosahedronGeometry(2.2, 1), 0x4fae46, M4(0, 3.8, 0), { flat: true })],
    flower: () => [P(new THREE.SphereGeometry(0.5, 6, 5), 0xff7ab0, M4(0, 0.4, 0)), P(new THREE.SphereGeometry(0.45, 6, 5), 0xffe04a, M4(0.9, 0.35, 0.3)), P(new THREE.SphereGeometry(0.45, 6, 5), 0xffffff, M4(-0.6, 0.35, 0.7))],
    doghouse: () => [P(new THREE.BoxGeometry(3, 2.4, 3), 0xd8a060, M4(0, 1.2, 0)), P(new THREE.ConeGeometry(2.6, 1.6, 4), 0xd0402a, M4(0, 3.2, 0, 1, 1, 1, Math.PI / 4), { flat: true }), P(new THREE.BoxGeometry(1.2, 1.3, 0.1), 0x2a1a10, M4(0, 0.7, 1.52))],
    house: () => [P(new THREE.BoxGeometry(7, 5, 6), 0xe8e0d0, M4(0, 2.5, 0)), P(new THREE.ConeGeometry(5.6, 2.8, 4), 0x4a5a7a, M4(0, 6.4, 0, 1, 1, 0.9, Math.PI / 4), { flat: true }), P(new THREE.BoxGeometry(1.6, 1.4, 0.1), 0x7ab0d8, M4(1.5, 3, 3.02), { e: 0x204060 })],
    konbini: () => [P(new THREE.BoxGeometry(12, 4.5, 8), 0xf4f4f0, M4(0, 2.25, 0)), P(new THREE.BoxGeometry(12.2, 0.9, 8.2), 0x2ab060, M4(0, 4.0, 0), { e: 0x105020 }), P(new THREE.BoxGeometry(12.3, 0.4, 8.3), 0xff8a2a, M4(0, 3.4, 0)), P(new THREE.BoxGeometry(8, 2.2, 0.1), 0xbfe6ff, M4(0, 1.5, 4.05), { e: 0x6a90b0 })],
    pole: () => [P(new THREE.CylinderGeometry(0.18, 0.24, 11, 6), 0x9a9a94, M4(0, 5.5, 0)), P(new THREE.BoxGeometry(2.4, 0.15, 0.15), 0x6a6a64, M4(0, 10, 0)), P(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 6), 0x5a5a5a, M4(0.6, 9.3, 0))],
    vending: () => [P(new THREE.BoxGeometry(1.4, 2.2, 1), 0xd8323a, M4(0, 1.1, 0)), P(new THREE.BoxGeometry(1.1, 0.9, 0.05), 0xe8f6ff, M4(0, 1.5, 0.52), { e: 0x8ab0d0 })],
    scarecrow: () => [P(new THREE.CylinderGeometry(0.08, 0.08, 3, 5), 0x8a6a3a, M4(0, 1.5, 0)), P(new THREE.BoxGeometry(2, 0.1, 0.1), 0x8a6a3a, M4(0, 2.2, 0)), P(new THREE.SphereGeometry(0.4, 8, 6), 0xf0e0c0, M4(0, 3, 0)), P(new THREE.ConeGeometry(0.8, 0.5, 8), 0xd8b84a, M4(0, 3.4, 0)), P(new THREE.BoxGeometry(1, 1, 0.3), 0x3a6ad8, M4(0, 2, 0))],
    rock: () => [P(new THREE.DodecahedronGeometry(1.8, 0), 0x8a8580, M4(0, 0.8, 0, 1, 0.7, 1.2), { flat: true })],
    stump: () => [P(new THREE.CylinderGeometry(1.1, 1.3, 1.2, 9), 0x7a5230, M4(0, 0.6, 0)), P(new THREE.CylinderGeometry(1.1, 1.1, 0.05, 9), 0xd8b07a, M4(0, 1.22, 0))],
    mountain: () => [P(new THREE.ConeGeometry(70, 90, 7), 0x5a7a4a, M4(0, 40, 0), { flat: true }), P(new THREE.ConeGeometry(22, 26, 7), 0xf4f4f4, M4(0, 77, 0), { flat: true })],
    tent: () => [P(new THREE.ConeGeometry(6, 7, 8), 0xff6a8a, M4(0, 3.5, 0), { flat: true }), P(new THREE.CylinderGeometry(6, 6, 2.5, 8), 0xfff0f4, M4(0, 1.2, 0))],
    balloon: () => [P(new THREE.SphereGeometry(1.2, 10, 8), 0xffd23a, M4(0, 9, 0, 1, 1.2, 1)), P(new THREE.CylinderGeometry(0.03, 0.03, 8, 3), 0xffffff, M4(0, 4, 0))],
    ferris: () => [P(new THREE.TorusGeometry(40, 1.2, 8, 40), 0xff4fa0, M4(0, 48, 0)), P(new THREE.BoxGeometry(2, 50, 2), 0xffffff, M4(-14, 24, 0)), P(new THREE.BoxGeometry(2, 50, 2), 0xffffff, M4(14, 24, 0)), P(new THREE.TorusGeometry(30, 0.6, 6, 30), 0x5ad8ff, M4(0, 48, 0))],
    mesa: () => [P(new THREE.CylinderGeometry(40, 55, 70, 9), 0xc07a44, M4(0, 0, 0), { flat: true }), P(new THREE.CylinderGeometry(40.5, 40.5, 3, 9), 0xe8a868, M4(0, 34, 0), { flat: true })],
    cactus: () => [P(new THREE.CylinderGeometry(0.5, 0.6, 4.5, 7), 0x3f8a3a, M4(0, 2.2, 0)), P(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 6), 0x3f8a3a, M4(0.8, 2.8, 0)), P(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 6), 0x3f8a3a, M4(-0.8, 2.2, 0))],
    coral: () => [P(new THREE.ConeGeometry(1.2, 3.5, 6), 0xff7a8a, M4(0, 1.7, 0), { flat: true }), P(new THREE.ConeGeometry(0.8, 2.5, 6), 0xffb03a, M4(1.2, 1.2, 0.4), { flat: true }), P(new THREE.SphereGeometry(1, 7, 6), 0xb05aff, M4(-1, 0.6, 0.5), { flat: true })],
    seaweed: () => [P(new THREE.CylinderGeometry(0.12, 0.25, 6, 4), 0x2a9a4a, M4(0, 3, 0)), P(new THREE.CylinderGeometry(0.1, 0.2, 4.5, 4), 0x3ab05a, M4(0.6, 2.2, 0.3))],
    palm: () => [P(new THREE.CylinderGeometry(0.3, 0.45, 7, 6), 0x9a7040, M4(0, 3.5, 0)), P(new THREE.ConeGeometry(3.6, 1.4, 7), 0x3a9a3a, M4(0, 7.2, 0), { flat: true })],
    crystal: () => [P(new THREE.OctahedronGeometry(1.6, 0), 0xb06aff, M4(0, 1.6, 0, 0.7, 2, 0.7), { e: 0x8030ff, ei: 0.8 }), P(new THREE.OctahedronGeometry(1, 0), 0x5ae8ff, M4(1.3, 0.9, 0.4, 0.6, 1.5, 0.6), { e: 0x20a0ff, ei: 0.8 })],
    stalag: () => [P(new THREE.ConeGeometry(1.4, 6, 6), 0x5a3a30, M4(0, 3, 0), { flat: true })],
    cloud: () => [P(new THREE.SphereGeometry(14, 10, 8), 0xf0b078, M4(0, 0, 0, 1.6, 0.6, 1), { op: 0.65, e: 0x603010 }), P(new THREE.SphereGeometry(10, 10, 8), 0xffd0a0, M4(14, 3, 4, 1.4, 0.6, 1), { op: 0.6, e: 0x603010 })],
    asteroid: () => [P(new THREE.IcosahedronGeometry(6, 0), 0x6a6470, M4(0, 0, 0, 1, 0.8, 1.2), { flat: true })],
    satellite: () => [P(new THREE.BoxGeometry(4, 4, 6), 0xd8d8e0, M4(0, 0, 0), { m: 0.7 }), P(new THREE.BoxGeometry(20, 0.2, 5), 0x2a4ad8, M4(0, 0, 0), { e: 0x101860 })],
    bigtree: () => [P(new THREE.CylinderGeometry(3, 4.5, 40, 9), 0x6a4a2a, M4(0, 20, 0), { flat: true }), P(new THREE.IcosahedronGeometry(16, 1), 0x2f7a3a, M4(0, 44, 0, 1, 0.7, 1), { flat: true }), P(new THREE.IcosahedronGeometry(11, 1), 0x4a9a3a, M4(9, 36, 5, 1, 0.7, 1), { flat: true })],
    mushroom: () => [P(new THREE.CylinderGeometry(0.8, 1.2, 6, 10), 0xf4ead8, M4(0, 3, 0)), P(new THREE.SphereGeometry(4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xe04a6a, M4(0, 5.6, 0, 1, 0.7, 1), { e: 0x401020 }), P(new THREE.SphereGeometry(0.7, 8, 6), 0xffffff, M4(1.8, 7.6, 1), {}), P(new THREE.SphereGeometry(0.6, 8, 6), 0xffffff, M4(-1.6, 7.4, -1.2), {})],
    glowflower: () => [P(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 4), 0x3a8a3a, M4(0, 0.8, 0)), P(new THREE.IcosahedronGeometry(0.5, 0), 0x7affe0, M4(0, 1.8, 0), { e: 0x30c0a0, ei: 1 }), P(new THREE.IcosahedronGeometry(0.4, 0), 0xff8ae0, M4(0.7, 1.3, 0.2), { e: 0xc040a0, ei: 1 })],
    floatrock: () => [P(new THREE.ConeGeometry(9, 14, 7), 0x8a7060, M4(0, -7, 0, 1, 1, 1), { flat: true }), P(new THREE.CylinderGeometry(9, 9, 1.6, 7), 0x5ab04a, M4(0, 0.6, 0), { flat: true }), P(new THREE.ConeGeometry(2, 5, 6), 0x2f8a3a, M4(3, 3.5, 2), { flat: true })],
    cloudpuff: () => [P(new THREE.IcosahedronGeometry(10, 1), 0xffffff, M4(0, 0, 0, 1.6, 0.7, 1), { e: 0x8a8a9a, op: 0.92 }), P(new THREE.IcosahedronGeometry(7, 1), 0xffffff, M4(10, 2, 3, 1.4, 0.7, 1), { e: 0x8a8a9a, op: 0.92 })],
    rainbow: () => [0xff4a4a, 0xffa03a, 0xffe03a, 0x5ad86a, 0x4a9aff, 0x9a5aff].map((c, i) => P(new THREE.TorusGeometry(70 - i * 3, 1.5, 6, 40, Math.PI), c, M4(0, -20, 0), { e: c, ei: 0.5, op: 0.8 })),
    crater: () => [P(new THREE.TorusGeometry(8, 1.6, 6, 18), 0x8a8a94, M4(0, 0.3, 0, 1, 1, 1), { flat: true })].map(p => { p.m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)); return p; }),
    flag: () => [P(new THREE.CylinderGeometry(0.08, 0.08, 5, 5), 0xdddddd, M4(0, 2.5, 0)), P(new THREE.BoxGeometry(2.2, 1.3, 0.05), 0xffd23a, M4(1.1, 4.3, 0))],
    pillar: () => [P(new THREE.CylinderGeometry(2.2, 2.6, 26, 10), 0xe8dcc0, M4(0, 13, 0)), P(new THREE.BoxGeometry(6, 1.6, 6), 0xd8ccb0, M4(0, 26.5, 0))],
    lollipop: () => [P(new THREE.CylinderGeometry(0.3, 0.3, 9, 6), 0xffffff, M4(0, 4.5, 0)), P(new THREE.CylinderGeometry(3.2, 3.2, 0.8, 18), 0xff5aa8, M4(0, 10.5, 0, 1, 1, 1), { e: 0x401030 })].map((p, i) => { if (i) p.m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)); return p; }),
    bush: () => [P(new THREE.IcosahedronGeometry(1.3, 0), 0x3f8a34, M4(0, 0.8, 0, 1.3, 0.9, 1), { flat: true }), P(new THREE.IcosahedronGeometry(0.9, 0), 0x5aa83f, M4(0.9, 0.6, 0.3), { flat: true })],
    reed: () => [P(new THREE.CylinderGeometry(0.05, 0.08, 3, 3), 0x8a9a4a, M4(0, 1.5, 0)), P(new THREE.CylinderGeometry(0.05, 0.08, 2.6, 3), 0x7a8a3a, M4(0.4, 1.3, 0.2)), P(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 5), 0x6a4a2a, M4(0, 3.1, 0))],
    log: () => [P(new THREE.CylinderGeometry(0.5, 0.55, 4, 8), 0x7a5230, M4(0, 0.5, 0, 1, 1, 1).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2)), { flat: true })],
    root: () => [P(new THREE.TorusGeometry(1.4, 0.35, 5, 10, Math.PI), 0x6a4a2a, M4(0, 0, 0), { flat: true }), P(new THREE.TorusGeometry(0.9, 0.25, 5, 8, Math.PI), 0x5a3a20, M4(1.2, 0, 0.6, 1, 1, 1, 1), { flat: true })],
    lavarock: () => [P(new THREE.DodecahedronGeometry(1.4, 0), 0x2a1a14, M4(0, 0.6, 0, 1, 0.8, 1.2), { flat: true, e: 0x401000 }), P(new THREE.OctahedronGeometry(0.4, 0), 0xff7a20, M4(0.6, 1.2, 0.3), { e: 0xff5a00 })],
    moonrock: () => [P(new THREE.DodecahedronGeometry(1.2, 0), 0x8a8a94, M4(0, 0.5, 0, 1.2, 0.7, 1), { flat: true })],
    cloudlet: () => [P(new THREE.IcosahedronGeometry(1.6, 1), 0xffe0c0, M4(0, 0.6, 0, 1.4, 0.7, 1), { op: 0.85, e: 0x604020 })],
    flowerclump: () => [P(new THREE.SphereGeometry(0.4, 6, 5), 0xff8ac0, M4(0, 0.4, 0)), P(new THREE.SphereGeometry(0.35, 6, 5), 0xffe04a, M4(0.6, 0.35, 0.2)), P(new THREE.SphereGeometry(0.35, 6, 5), 0x8ac8ff, M4(-0.5, 0.35, 0.4)), P(new THREE.IcosahedronGeometry(0.8, 0), 0x5aa83f, M4(0, 0.2, 0, 1.5, 0.5, 1.5), { flat: true })],
    tentacle_s: () => [P(new THREE.TorusGeometry(1.2, 0.3, 6, 12, Math.PI * 1.2), 0x7dffb0, M4(0, 1, 0), { e: 0x20a060, ei: 0.6 })],
    lollipop_s: () => [P(new THREE.CylinderGeometry(0.12, 0.12, 3, 5), 0xffffff, M4(0, 1.5, 0)), P(new THREE.SphereGeometry(0.9, 10, 8), 0xff5aa8, M4(0, 3.3, 0, 1, 1, 0.4), { e: 0x401030 })],
    deadtree: () => [P(new THREE.CylinderGeometry(0.3, 0.6, 8, 6), 0x4a3a2a, M4(0, 4, 0), { flat: true }), P(new THREE.CylinderGeometry(0.12, 0.2, 3.5, 5), 0x4a3a2a, M4(1, 6.5, 0).multiply(new THREE.Matrix4().makeRotationZ(-0.9)), { flat: true }), P(new THREE.CylinderGeometry(0.1, 0.18, 3, 5), 0x4a3a2a, M4(-0.9, 5.5, 0.3).multiply(new THREE.Matrix4().makeRotationZ(0.8)), { flat: true })],
    tentacle: () => [P(new THREE.TorusGeometry(10, 1.6, 8, 24, Math.PI * 1.3), 0x7dffb0, M4(0, 10, 0), { e: 0x20a060, ei: 0.6 }), P(new THREE.SphereGeometry(3, 10, 8), 0xff5ad8, M4(10, 10, 0), { e: 0x802060 })],
  };
})();
