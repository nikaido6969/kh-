// ===== 景色：光と影・空・草・水・生き物・観客・花火 =====
const BIOME = {
  kawara: 'meadow', numa: 'swamp', yamamichi: 'mountain', mori: 'forest', jupiter: 'gas', kinsei: 'volcano', tsuki: 'moon', kaitei: 'sea',
  chitei: 'cave', kumo: 'sky', suisho: 'crystal', bosen: 'alien',
  b_niwa: 'meadow', b_tsuki: 'moon', b_kaitei: 'sea', b_magma: 'cave', b_okashi: 'candy', b_kumo: 'sky', b_jupiter: 'gas', b_bosen: 'alien',
};

const SCN_TEX = {
  cloud: () => makeTex('scn_cloud', 256, (g, s) => {
    const r = U.rng(7);
    for (let i = 0; i < 26; i++) {
      const x = s * (0.18 + r() * 0.64), y = s * (0.42 + (r() - 0.5) * 0.22), rad = s * (0.08 + r() * 0.13);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.6, 'rgba(250,250,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
    }
    const sh = g.createLinearGradient(0, s * 0.3, 0, s * 0.7); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(120,130,160,0.25)');
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = sh; g.fillRect(0, 0, s, s);
  }, false),
  grass: () => makeTex('scn_grass', 128, (g, s) => {
    const r = U.rng(3);
    for (let i = 0; i < 46; i++) {
      const x = 6 + r() * (s - 12), h = s * (0.45 + r() * 0.55), lean = (r() - 0.5) * 26;
      g.strokeStyle = `hsl(${88 + r() * 30},${45 + r() * 25}%,${24 + r() * 26}%)`; g.lineWidth = 2 + r() * 2.5;
      g.beginPath(); g.moveTo(x, s); g.quadraticCurveTo(x + lean * 0.3, s - h * 0.6, x + lean, s - h); g.stroke();
    }
  }, false),
  water: () => makeTex('scn_water', 256, (g, s) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    const r = U.rng(11);
    g.strokeStyle = 'rgba(140,190,230,0.55)'; g.lineWidth = 2;
    for (let i = 0; i < 70; i++) { const x = r() * s, y = r() * s, w = 10 + r() * 26; g.beginPath(); g.ellipse(x, y, w, w * 0.32, r() * 0.4, 0, 7); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 90; i++) g.fillRect(r() * s, r() * s, 2 + r() * 3, 1);
  }, true),
};

function crossGeo(w, h) {
  const a = new THREE.PlaneGeometry(w, h); a.translate(0, h / 2, 0);
  const b = a.clone(); b.rotateY(Math.PI / 2);
  const c = a.clone(); c.rotateY(Math.PI / 4);
  const pos = [], uv = [], idx = []; let o = 0;
  for (const g of [a, b, c]) {
    const p = g.attributes.position.array, u = g.attributes.uv.array, ix = g.index.array;
    for (let i = 0; i < p.length; i++) pos.push(p[i]); for (let i = 0; i < u.length; i++) uv.push(u[i]);
    for (let i = 0; i < ix.length; i++) idx.push(ix[i] + o); o += p.length / 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}

Object.assign(Game.prototype, {
  setupScenery() {
    const def = this.def, tr = this.track, scene = this.scene, th = def.theme;
    const biome = BIOME[def.id] || 'meadow';
    const touch = U.isTouch;
    this.scn = { biome, t: 0, crit: [], clouds: [], crowd: null, fx: [] };
    const S = this.scn;
    // ---- 光と影 ----
    const sun = this.sun;
    if (sun) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(touch ? 1024 : 2048, touch ? 1024 : 2048);
      const c = sun.shadow.camera; c.left = -48; c.right = 48; c.top = 48; c.bottom = -48; c.near = 10; c.far = 700;
      sun.shadow.bias = -0.0006; if ('normalBias' in sun.shadow) sun.shadow.normalBias = 0.5;
      S.sunDir = new THREE.Vector3(0.45, 0.8, 0.3).normalize();
    }
    tr.group.traverse(o => {
      if (o.isInstancedMesh) { o.castShadow = true; o.receiveShadow = false; }
      else if (o.isMesh) o.receiveShadow = true;
    });
    for (const k of this.karts) k.model.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    // ---- 太陽 ----
    if (!['cave'].includes(biome)) {
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: ['moon', 'crystal', 'alien'].includes(biome) ? 0xfff8f0 : biome === 'volcano' ? 0xffc060 : 0xfff2c8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      glow.scale.set(260, 260, 1); S.sunGlow = glow; scene.add(glow);
      const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      core.scale.set(60, 60, 1); S.sunCore = core; scene.add(core);
    }
    // ---- 雲 ----
    const b = tr.bounds, cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    const cloudy = { meadow: 22, swamp: 16, mountain: 26, forest: 14, sky: 40, candy: 20, sea: 18, volcano: 18, gas: 34 }[biome] || 0;
    const rng = U.rng(def.id.length * 17 + 3);
    for (let i = 0; i < cloudy; i++) {
      const col = biome === 'gas' ? 0xf0b080 : biome === 'volcano' ? 0x8a7a6a : biome === 'candy' ? 0xffe0f0 : biome === 'swamp' ? 0xd8dcc8 : 0xffffff;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: SCN_TEX.cloud(), color: col, transparent: true, opacity: biome === 'sky' ? 0.95 : 0.88, depthWrite: false, fog: false }));
      const a = rng() * Math.PI * 2, rad = 260 + rng() * 700;
      const w = 140 + rng() * 200;
      sp.scale.set(w, w * 0.55, 1);
      sp.position.set(cx + Math.cos(a) * rad, b.maxY + (biome === 'sky' ? -40 + rng() * 140 : 110 + rng() * 160), cz + Math.sin(a) * rad);
      sp.userData.v = 2 + rng() * 4; scene.add(sp); S.clouds.push(sp);
    }
    // ---- 地形の色むら（タイル感を消す・斜面は岩っぽく） ----
    if (tr.groundMesh) {
      const g = tr.groundMesh.geometry, pos = g.attributes.position, nor = g.attributes.normal;
      const cols = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), ny = nor.getY(i);
        const n = 0.82 + 0.18 * Math.sin(x * 0.021 + Math.sin(z * 0.017) * 2) * Math.cos(z * 0.019 - x * 0.007);
        const rock = U.clamp((0.86 - ny) * 3, 0, 1);
        let r = n, gg = n, bb = n;
        if (['meadow', 'forest', 'swamp', 'mountain'].includes(biome)) { r = U.lerp(n * 0.92, 0.78, rock); gg = U.lerp(n * 1.0, 0.74, rock); bb = U.lerp(n * 0.86, 0.7, rock); }
        if (biome === 'mountain' && y > b.maxY + 18) { const sn = U.clamp((y - b.maxY - 18) / 25, 0, 1); r = U.lerp(r, 1, sn); gg = U.lerp(gg, 1, sn); bb = U.lerp(bb, 1, sn); }
        cols[i * 3] = r; cols[i * 3 + 1] = gg; cols[i * 3 + 2] = bb;
      }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      tr.groundMesh.material.vertexColors = true; tr.groundMesh.material.needsUpdate = true;
      if (biome === 'mountain') tr.groundMesh.material.map = U.surfTex('meadow');
    }
    // ---- 揺れる草 ----
    if (!def.noGround && ['meadow', 'forest', 'swamp', 'mountain', 'candy'].includes(biome)) {
      const n = touch ? 1600 : 3200;
      const mat = new THREE.MeshStandardMaterial({ map: SCN_TEX.grass(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, color: biome === 'candy' ? 0xffa0d0 : biome === 'swamp' ? 0xc8d0a0 : 0xffffff });
      S.grassU = { value: 0 };
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = S.grassU;
        sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          #ifdef USE_INSTANCING
          float ph = instanceMatrix[3].x * 0.21 + instanceMatrix[3].z * 0.17;
          #else
          float ph = 0.0;
          #endif
          transformed.x += sin(uTime * 2.1 + ph) * 0.16 * position.y;
          transformed.z += cos(uTime * 1.7 + ph) * 0.10 * position.y;`);
      };
      const im = new THREE.InstancedMesh(crossGeo(1.5, 1.0), mat, n);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      let c = 0, tries = 0;
      while (c < n && tries++ < n * 4) {
        const j = Math.floor(rng() * tr.N); if (tr.flags[j] & (1 | 4 | 8 | 16)) continue;
        const side = rng() < 0.5 ? -1 : 1, ed = tr.hw[j] + tr.sh[j];
        const dist = ed + 0.6 + Math.pow(rng(), 1.7) * 26;
        const x = tr.P[j * 3] + tr.R[j * 3] * side * dist, z = tr.P[j * 3 + 2] + tr.R[j * 3 + 2] * side * dist;
        const nr = tr.nearest(x, z, 30); if (nr.i >= 0 && nr.d < tr.hw[nr.i] + tr.sh[nr.i] + 0.3) continue;
        const y = tr.terrainH(x, z);
        if (def.water != null && y < def.water - 0.2) continue;
        const k = 0.7 + rng() * 0.9; q.setFromAxisAngle(up, rng() * 6.28); sc.set(k, k * (0.8 + rng() * 0.6), k); p.set(x, y - 0.05, z);
        m4.compose(p, q, sc); im.setMatrixAt(c++, m4);
      }
      im.count = c; im.receiveShadow = true; scene.add(im); S.grass = im;
    }
    // ---- 水面アニメ ----
    if (tr.waterMesh) {
      const wt = SCN_TEX.water().clone(); wt.needsUpdate = true; wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(60, 60);
      const m = tr.waterMesh.material; m.map = wt; m.roughness = 0.08; m.metalness = 0.35; m.needsUpdate = true;
      S.water = wt; tr.waterMesh.receiveShadow = true;
    }
    // ---- 観客（スタート横） ----
    if (!def.noGround && !def.battle) {
      const n = 70, body = new THREE.CylinderGeometry(0.42, 0.5, 1.4, 8); body.translate(0, 0.7, 0);
      const head = new THREE.SphereGeometry(0.36, 10, 8); head.translate(0, 1.75, 0);
      const imB = new THREE.InstancedMesh(body, new THREE.MeshStandardMaterial({ roughness: 0.8 }), n);
      const imH = new THREE.InstancedMesh(head, new THREE.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.7 }), n);
      const shirt = [0xff4f7a, 0x3a8aff, 0xffd23a, 0x5ad86a, 0xffffff, 0xff8a3a, 0xa05aff];
      const fr = { p: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), r: new THREE.Vector3() };
      const base = [];
      for (let i = 0; i < n; i++) {
        const s = 6 + rng() * 46, side = i % 2 ? 1 : -1;
        tr.frame(s, fr); const ed = tr.hw[Math.floor(s / tr.ds)] + tr.sh[Math.floor(s / tr.ds)];
        const d = side * (ed + 3 + rng() * 9);
        const x = fr.p.x + fr.r.x * d, z = fr.p.z + fr.r.z * d;
        base.push({ x, y: tr.terrainH(x, z), z, ph: rng() * 6.28, yaw: Math.atan2(fr.p.x - x, fr.p.z - z) });
        imB.setColorAt(i, new THREE.Color(shirt[i % shirt.length]));
      }
      imB.castShadow = imH.castShadow = true;
      scene.add(imB); scene.add(imH); S.crowd = { imB, imH, base };
      // 旗
      const flagM = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.7 });
      S.flags = [];
      for (let i = 0; i < 8; i++) {
        const bb = base[i * 7 % n], pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 5), U.mat(0xdddddd));
        pole.position.set(bb.x, bb.y + 2.5, bb.z); scene.add(pole);
        const fg = new THREE.PlaneGeometry(1.8, 1.1, 8, 1); fg.translate(0.9, 0, 0);
        const fl = new THREE.Mesh(fg, flagM.clone()); fl.material.color.setHex(shirt[i % shirt.length]);
        fl.position.set(bb.x, bb.y + 4.4, bb.z); scene.add(fl); S.flags.push(fl);
      }
    }
    // ---- 生き物 ----
    const add = (kind, n) => { for (let i = 0; i < n; i++) S.crit.push(this.makeCritter(kind, rng)); };
    if (['meadow', 'mountain', 'sea', 'sky', 'swamp'].includes(biome)) add(biome === 'sea' ? 'gull' : 'bird', 14);
    if (['meadow', 'forest', 'candy', 'sky'].includes(biome)) add('butterfly', touch ? 14 : 24);
    if (['forest', 'swamp'].includes(biome)) add('firefly', touch ? 40 : 70);
    if (['cave', 'volcano'].includes(biome)) add('ember', touch ? 40 : 70);
    if (biome === 'sea') add('fish', touch ? 30 : 50);
    if (['crystal', 'alien', 'moon'].includes(biome)) add('mote', touch ? 30 : 50);
    for (const c of S.crit) scene.add(c.obj);
    S.shootT = 3;
  },

  makeCritter(kind, rng) {
    const o = new THREE.Group(); let wings = [];
    if (kind === 'bird' || kind === 'gull') {
      const col = kind === 'gull' ? 0xf4f4f4 : 0x3a3430;
      mk(o, GEO.sph(0.25, 8, 6), col, 0, 0, 0, { s: [0.7, 0.6, 1.6] });
      for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.45), U.mat(col, { ds: true })); w.geometry.translate(s * 0.7, 0, 0); w.rotation.x = -Math.PI / 2; o.add(w); wings.push(w); }
    } else if (kind === 'butterfly') {
      const col = [0xffd23a, 0xff7ab0, 0x5ac8ff, 0xffffff, 0xff8a3a][Math.floor(rng() * 5)];
      for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.22, 8), U.mat(col, { ds: true, e: col, ei: 0.25 })); w.geometry.translate(s * 0.2, 0, 0); w.rotation.x = -Math.PI / 2; o.add(w); wings.push(w); }
    } else if (kind === 'fish') {
      const col = [0xffa030, 0x5ac8ff, 0xffe04a, 0xff6a8a][Math.floor(rng() * 4)];
      mk(o, GEO.sph(0.35, 8, 6), col, 0, 0, 0, { s: [0.45, 0.8, 1.4] }); mk(o, GEO.cone(0.3, 0.5, 4), col, 0, 0, -0.6, { r: [-Math.PI / 2, 0, 0] });
    } else {
      const col = { firefly: 0xd8ff6a, ember: 0xff7a20, mote: 0xb8a0ff }[kind];
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.glowTex(), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      const s = kind === 'mote' ? 0.9 : 0.7; sp.scale.set(s, s, s); o.add(sp);
    }
    return { kind, obj: o, wings, ph: rng() * 6.28, sp: 0.6 + rng() * 0.8, off: new THREE.Vector3((rng() - 0.5) * 80, 0, (rng() - 0.5) * 80), h: rng(), r: 8 + rng() * 30 };
  },

  updateScenery(dt) {
    const S = this.scn; if (!S) return;
    S.t += dt; const t = S.t;
    const k = this.player || this.karts[0]; if (!k) return;
    const kp = k.model.root.position, cam = this.camera.position;
    // 太陽と影を自分のまわりに
    if (this.sun && S.sunDir) {
      this.sun.position.copy(kp).addScaledVector(S.sunDir, 260); this.sun.target.position.copy(kp); this.sun.target.updateMatrixWorld();
    }
    if (S.sunGlow) { S.sunGlow.position.copy(cam).addScaledVector(S.sunDir, 1500); S.sunCore.position.copy(S.sunGlow.position); }
    for (const c of S.clouds) { c.position.x += c.userData.v * dt; }
    if (S.grassU) S.grassU.value = t;
    if (S.water) { S.water.offset.x = t * 0.012; S.water.offset.y = Math.sin(t * 0.3) * 0.02; }
    // 観客：跳ねて手を振る
    if (S.crowd) {
      const { imB, imH, base } = S.crowd, m4 = this.tmp.m, q = this.tmp.q, sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      const near = kp.distanceTo(new THREE.Vector3(base[0].x, base[0].y, base[0].z)) < 160;
      if (near || !S.crowdInit) {
        S.crowdInit = true;
        const hype = this.started ? 1 : 0.4;
        base.forEach((b, i) => {
          const jump = Math.max(0, Math.sin(t * (5 + (i % 3)) + b.ph)) * 0.5 * hype;
          q.setFromAxisAngle(up, b.yaw + Math.sin(t * 2 + b.ph) * 0.3); p.set(b.x, b.y + jump, b.z);
          m4.compose(p, q, sc); imB.setMatrixAt(i, m4); imH.setMatrixAt(i, m4);
        });
        imB.instanceMatrix.needsUpdate = imH.instanceMatrix.needsUpdate = true;
      }
      for (const f of S.flags) { const pa = f.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); pa.setZ(i, Math.sin(x * 2.2 - t * 6) * 0.18 * x); } pa.needsUpdate = true; }
    }
    // 生き物：自分のまわりを漂う
    const wy = this.def.water;
    for (const c of S.crit) {
      const a = t * 0.25 * c.sp + c.ph, o = c.obj;
      let x = kp.x + c.off.x + Math.cos(a) * c.r, z = kp.z + c.off.z + Math.sin(a) * c.r, y;
      if (c.kind === 'bird' || c.kind === 'gull') {
        y = kp.y + 22 + c.h * 25; o.rotation.y = -a; c.wings.forEach((w, i) => w.rotation.z = (i ? -1 : 1) * Math.sin(t * 9 + c.ph) * 0.6);
        if (Math.random() < 0.0008 && this.player) SND.play('chirp');
      } else if (c.kind === 'butterfly') {
        x = kp.x + c.off.x * 0.5 + Math.cos(a * 2.3) * c.r * 0.3; z = kp.z + c.off.z * 0.5 + Math.sin(a * 1.7) * c.r * 0.3;
        y = kp.y + 1 + c.h * 3 + Math.sin(t * 3 + c.ph) * 0.6; o.rotation.y = a * 3; c.wings.forEach((w, i) => w.rotation.z = (i ? -1 : 1) * (0.2 + Math.abs(Math.sin(t * 16 + c.ph)) * 1.1));
      } else if (c.kind === 'fish') {
        if (wy == null || cam.y > wy) { o.visible = false; continue; } o.visible = true;
        y = Math.min(wy - 1, kp.y + 1 + c.h * 8); o.rotation.y = -a + Math.PI / 2 * (c.sp > 1 ? 1 : -1); o.rotation.z = Math.sin(t * 8 + c.ph) * 0.2;
      } else {
        y = kp.y + 0.5 + ((c.kind === 'ember' ? (t * 1.5 * c.sp + c.h * 12) % 12 : c.h * 6 + Math.sin(t + c.ph) * 1.2));
        o.children[0].material.opacity = c.kind === 'firefly' ? 0.4 + 0.6 * Math.max(0, Math.sin(t * 2.5 + c.ph * 3)) : 0.85;
      }
      o.position.set(x, y, z);
    }
    // 流れ星（宇宙）
    if (['moon', 'crystal', 'alien'].includes(S.biome)) {
      S.shootT -= dt;
      if (S.shootT <= 0) {
        S.shootT = 1.5 + Math.random() * 3;
        const p = cam.clone().add(new THREE.Vector3((Math.random() - 0.5) * 400, 120 + Math.random() * 120, (Math.random() - 0.5) * 400));
        const v = new THREE.Vector3((Math.random() - 0.5) * 2, -0.6, (Math.random() - 0.5) * 2).normalize().multiplyScalar(260);
        for (let i = 0; i < 10; i++) this.particles.emit(p.clone().addScaledVector(v, -i * 0.012), v, 0xffffff, 0.6, 6 - i * 0.4, 1, 0);
      }
    }
    // 花火
    for (const f of S.fx) {
      f.t -= dt; f.next -= dt;
      if (f.next <= 0 && f.t > 0) {
        f.next = 0.18 + Math.random() * 0.3;
        const p = f.at.clone().add(new THREE.Vector3((Math.random() - 0.5) * 40, 18 + Math.random() * 20, (Math.random() - 0.5) * 40));
        const col = [0xff4f7a, 0xffd23a, 0x5ae8ff, 0x7dff8a, 0xb05aff, 0xffffff][Math.floor(Math.random() * 6)];
        for (let i = 0; i < 40; i++) { const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(14 + Math.random() * 6); this.particles.emit(p, v, col, 1.1, 1.4, 0.2, 6); }
        SND.play('firework');
      }
    }
    S.fx = S.fx.filter(f => f.t > 0);
    if (S.rings) for (const r of S.rings) { if (r.t <= 0) continue; r.t -= dt; const k2 = 1 - r.t / 1.1; const sc = r.size * (0.4 + k2 * 2.6); r.m.scale.set(sc, sc, sc); r.m.material.opacity = 0.6 * (1 - k2); if (r.t <= 0) r.m.visible = false; }
  },

  // ---- 水しぶき ----
  waterSplash(k, entering) {
    const p = k.model.root.position;
    const near = !this.player || p.distanceTo(this.camera.position) < 90;
    if (!near) return;
    const power = U.clamp(Math.abs(k.v) / 35 + Math.abs(k.vh) / 12, 0.25, 1.4);
    const wy = this.def.water, at = new THREE.Vector3(p.x, wy + 0.1, p.z);
    const F = this.fwdVec(k);
    // 王冠状に飛び散る水柱
    const n = Math.round(80 * power);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 9 * power;
      const v = new THREE.Vector3(Math.cos(a) * sp, 7 + Math.random() * 12 * power, Math.sin(a) * sp).addScaledVector(F, Math.abs(k.v) * 0.35);
      this.particles.emit(at, v, i % 3 ? 0xd8eeff : 0x7fb8e0, 0.75 + Math.random() * 0.6, 0.9 + Math.random() * 0.8, 0.25, 24, false);
    }
    // 霧
    for (let i = 0; i < 10 * power; i++) this.particles.emit(at.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 0.5 + Math.random() * 1.5, (Math.random() - 0.5) * 3)), new THREE.Vector3((Math.random() - 0.5) * 3, 2 + Math.random() * 2, (Math.random() - 0.5) * 3), 0xffffff, 1.4, 1.6, 4.5, 0, false);
    this.ripple(at, 1.2 + power * 2.2);
    if (k.isPlayer) { SND.splash(power); HUD.shake(0.25 * power); if (entering && power > 0.7) this.screenDrops(); }
    else if (p.distanceTo(this.camera.position) < 40) SND.splash(power * 0.5);
  },
  waterSpray(k, dt) {
    if (!k.inWater || !k.grounded || k.waterDepth > 2.4 || Math.abs(k.v) < 8) return;
    const p = k.model.root.position; if (this.player && p.distanceTo(this.camera.position) > 70) return;
    const F = this.fwdVec(k), up = new THREE.Vector3(0, 1, 0), L = new THREE.Vector3().crossVectors(up, F).normalize();
    const sp = Math.abs(k.v), wy = this.def.water;
    const rate = Math.round(2 + sp / 7);
    for (let i = 0; i < rate; i++) {
      for (const s of [-1, 1]) {   // 車輪の横に扇状のしぶき
        const at = p.clone().addScaledVector(F, -0.7).addScaledVector(L, s * 0.9); at.y = wy + 0.05;
        const v = new THREE.Vector3().addScaledVector(L, s * (3 + Math.random() * sp * 0.18)).addScaledVector(F, -sp * 0.15 + Math.random() * 2);
        v.y = 3 + Math.random() * sp * 0.22;
        this.particles.emit(at, v, Math.random() < 0.5 ? 0xd8eeff : 0x8cc0e6, 0.45 + Math.random() * 0.35, 0.6 + Math.random() * 0.5, 0.15, 22, false);
      }
    }
    if (Math.random() < sp / 40) {   // 後ろに立ちのぼる水煙（ルースターテール）
      const at = p.clone().addScaledVector(F, -1.6); at.y = wy + 0.2;
      this.particles.emit(at, new THREE.Vector3().addScaledVector(F, -sp * 0.2).add(new THREE.Vector3(0, 5 + Math.random() * 3, 0)), 0xffffff, 0.9, 0.8, 2.6, 6, false);
    }
    k.rippleT = (k.rippleT || 0) - dt;
    if (k.rippleT <= 0) { k.rippleT = 0.12; this.ripple(new THREE.Vector3(p.x, wy + 0.06, p.z), 0.8); }
  },
  ripple(at, size) {
    const S = this.scn; if (!S) return;
    if (!S.rings) S.rings = [];
    let r = S.rings.find(x => x.t <= 0);
    if (!r) {
      if (S.rings.length >= 24) r = S.rings[0];
      else { const m = new THREE.Mesh(new THREE.RingGeometry(0.75, 1, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.renderOrder = 3; this.scene.add(m); r = { m, t: 0 }; S.rings.push(r); }
    }
    r.m.position.copy(at); r.t = 1.1; r.size = size; r.m.visible = true;
  },
  screenDrops() {
    const e = document.getElementById('hdrops'); if (!e) return;
    e.innerHTML = Array.from({ length: 14 }, () => { const s = 18 + Math.random() * 46; return `<i style="left:${Math.random() * 100}%;top:${Math.random() * 90}%;width:${s}px;height:${s * 1.15}px;animation-delay:${Math.random() * 0.3}s"></i>`; }).join('');
    e.classList.remove('on'); void e.offsetWidth; e.classList.add('on');
  },

  fireworks(at) { if (this.scn) this.scn.fx.push({ at: at.clone(), t: 5, next: 0 }); },
});
