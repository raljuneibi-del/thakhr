/* SADEEM Hangar · procedural placeholder models (original generic designs, no company's product).
   Ported from the previous build to three 0.186: colour management is on, so hex colours are given in sRGB
   and textures are tagged SRGBColorSpace. Materials are tuned matte for a studio look (no bloom, no neon).
   Takes the three namespace as a parameter so the library stays lazily loaded. */
import type { Group, Material, Mesh, Object3D, MeshStandardMaterial, CanvasTexture, BufferGeometry } from "three";

type Three = typeof import("three");
export type ModelKind = "vehicle" | "drone" | "aircraft";
export interface MatSet {
  body: MeshStandardMaterial; panel: MeshStandardMaterial; metal: MeshStandardMaterial; gun: MeshStandardMaterial;
  rubber: MeshStandardMaterial; glass: MeshStandardMaterial; lamp: Material; red: Material; cyan: Material;
  gold: MeshStandardMaterial; white: MeshStandardMaterial; green: Material;
}
export interface ModelFactory {
  build(kind: string, cfg: Record<string, any> | null | undefined): Group;
  vehicle(cfg?: Record<string, any>): Group;
  drone(cfg?: Record<string, any>): Group;
  aircraft(cfg?: Record<string, any>): Group;
  animate(root: Object3D, dt: number): void;
  mats(scheme?: string): MatSet;
  /** Free the geometries of a model built here (shared materials are kept). */
  disposeModel(root: Object3D): void;
  /** Free every cached material and texture. */
  dispose(): void;
}

export function CALMOD(T: Three): ModelFactory {
  const col = (h: string) => new T.Color(h); // sRGB hex → linear working space (colour management on)
  const shared = <M extends Material>(m: M): M => { m.userData.shared = true; return m; };
  let camoTex: CanvasTexture | null = null;

  /* Matte desert paint: a flat sand base with soft, low-contrast weathering and fine grain (reads as paint, not a pattern). */
  function camo() {
    if (camoTex) return camoTex;
    const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d")!;
    x.fillStyle = "#AE9874"; x.fillRect(0, 0, 256, 256);
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 48; i++) {
      const cx = r() * 256, cy = r() * 256, rad = 20 + r() * 50, g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      const tone = r() > .5 ? "150,128,96" : "190,170,138";
      g.addColorStop(0, `rgba(${tone},.22)`); g.addColorStop(1, `rgba(${tone},0)`);
      x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(40,30,20,${r() * .05})`; x.fillRect(r() * 256, r() * 256, 1, 1); }
    camoTex = new T.CanvasTexture(c); camoTex.wrapS = camoTex.wrapT = T.RepeatWrapping; camoTex.repeat.set(.22, .22);
    camoTex.colorSpace = T.SRGBColorSpace; camoTex.anisotropy = 4;
    return camoTex;
  }

  const M: Record<string, MatSet> = {};
  function mats(scheme?: string): MatSet {
    const k = scheme || "sand"; if (M[k]) return M[k];
    const std = (o: ConstructorParameters<typeof T.MeshStandardMaterial>[0]) => shared(new T.MeshStandardMaterial(o));
    const body = k === "sand" ? std({ color: col("#FFFFFF"), map: camo(), roughness: .82, metalness: .04 })
      : k === "grey" ? std({ color: col("#8A9096"), roughness: .66, metalness: .12 })
      : k === "dark" ? std({ color: col("#40454B"), roughness: .6, metalness: .14 })
      : std({ color: col("#2E3136"), roughness: .5, metalness: .25 });
    const panel = shared(body.clone()); panel.color = col(k === "sand" ? "#D9CDB6" : k === "grey" ? "#B7BBBE" : "#5A6068");
    // self-lit details are tone-mapped and kept low so the model stays matte without a bloom pass
    const glow = (h: string, s = 1) => shared(new T.MeshBasicMaterial({ color: col(h).multiplyScalar(s) }));
    M[k] = {
      body, panel,
      metal: std({ color: col("#5A5D62"), roughness: .5, metalness: .55 }),
      gun: std({ color: col("#2B2D30"), roughness: .55, metalness: .35 }),
      rubber: std({ color: col("#1B1C1E"), roughness: .95, metalness: 0 }),
      glass: std({ color: col("#16222B"), roughness: .12, metalness: .3 }),
      lamp: glow("#F4E6C4"),
      red: glow("#C4452F"),
      cyan: glow("#7FB9C6", .9),
      green: glow("#4FBF7F"),
      gold: std({ color: col("#C8A45C"), roughness: .42, metalness: .6 }),
      white: std({ color: col("#E4DFD4"), roughness: .75, metalness: 0 }),
    };
    return M[k];
  }

  /* ---------- geometry helpers ---------- */
  function triUV(g: BufferGeometry, sc: number) {
    const P = g.attributes.position; if (!g.attributes.normal) g.computeVertexNormals();
    const n = g.attributes.normal, uv = new Float32Array(P.count * 2);
    for (let i = 0; i < P.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      let u: number, v: number;
      if (az >= ax && az >= ay) { u = x; v = y; } else if (ax >= ay) { u = z; v = y; } else { u = x; v = z; }
      uv[i * 2] = u * sc; uv[i * 2 + 1] = v * sc;
    }
    g.setAttribute("uv", new T.BufferAttribute(uv, 2)); return g;
  }
  function ext(pts: number[][], depth: number, bevel: number, mat: Material, seg?: number) {
    const s = new T.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath();
    const g = new T.ExtrudeGeometry(s, { depth: depth - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg || 2, steps: 1, curveSegments: 8 });
    g.translate(0, 0, -(depth - bevel * 2) / 2); g.computeVertexNormals(); triUV(g, 1);
    const m = new T.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m;
  }
  function box(w: number, h: number, d: number, mat: Material, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(triUV(new T.BoxGeometry(w, h, d), 1), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m;
  }
  function cyl(rt: number, rb: number, h: number, mat: Material, seg = 20) {
    const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), mat); m.castShadow = m.receiveShadow = true; return m;
  }
  function capG(r: number, l: number) {
    const pts: InstanceType<Three["Vector2"]>[] = [];
    for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + i / 8 * Math.PI / 2; pts.push(new T.Vector2(Math.cos(a) * r, Math.sin(a) * r - l / 2)); }
    for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push(new T.Vector2(Math.cos(a) * r, Math.sin(a) * r + l / 2)); }
    return new T.LatheGeometry(pts, 20);
  }
  function tag<O extends Object3D>(o: O, slot: string): O { o.userData.slot = slot; o.traverse(c => { if ((c as Mesh).isMesh) c.userData.slot = slot; }); return o; }
  function wheel(r: number, w: number, m: MatSet) {
    const g = new T.Group(); const tire = cyl(r, r, w, m.rubber, 32); tire.rotation.x = Math.PI / 2; g.add(tire);
    const tr = new T.Mesh(new T.TorusGeometry(r * .93, r * .1, 8, 28), m.rubber); tr.scale.z = w / (r * .2) * .55; g.add(tr);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const l = box(w * .96, r * .12, r * .2, m.rubber); l.rotation.y = Math.PI / 2; l.position.set(Math.cos(a) * r * .99, Math.sin(a) * r * .99, 0); l.rotation.z = a; g.add(l); }
    const hub = cyl(r * .55, r * .58, w * 1.02, m.metal, 20); hub.rotation.x = Math.PI / 2; g.add(hub);
    const cap = cyl(r * .2, r * .25, w * 1.1, m.gun, 12); cap.rotation.x = Math.PI / 2; g.add(cap);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const b = cyl(.03, .03, w * 1.08, m.gun, 6); b.rotation.x = Math.PI / 2; b.position.set(Math.cos(a) * r * .38, Math.sin(a) * r * .38, 0); g.add(b); }
    g.userData.spin = 1; return g;
  }

  /* ---------- LAND VEHICLE ---------- */
  function vehicle(cfg: Record<string, any> = {}) {
    const m = mats("sand"); const G = new T.Group(); const ch = cfg.chassis || "8x8"; const is4 = ch === "4x4";
    const L = is4 ? 5.6 : ch === "6x6" ? 6.8 : 7.8, W = 2.55, wr = is4 ? .62 : .6; const base = .72;
    // hull
    const prof = is4
      ? [[-L / 2, base], [L / 2 - .2, base], [L / 2, base + .35], [L / 2, 1.45], [L / 2 - 1.25, 1.62], [L / 2 - 1.8, 2.55], [-L / 2 + .25, 2.6], [-L / 2, 2.3]]
      : [[-L / 2 + .1, base], [L / 2 - .7, base], [L / 2, 1.35], [L / 2 - .05, 1.55], [L / 2 - .75, 1.9], [-L / 2 + .1, 1.9], [-L / 2, 1.8], [-L / 2, 1.0]];
    G.add(tag(ext(prof, W, .07, m.body), "chassis"));
    if (!is4) {
      const up = ext([[-L / 2 + .25, 1.85], [L / 2 - 1.05, 1.85], [L / 2 - 1.6, 2.28], [-L / 2 + .25, 2.34]], W - .7, .05, m.body); up.position.y = .001; G.add(tag(up, "chassis"));
      [-1, 1].forEach(sd => { const pl = box(L - 1.9, .62, .07, m.body, -.45, 2.02, sd * (W / 2 - .2)); pl.rotation.x = sd * .62; G.add(tag(pl, "chassis")); });
    }
    // V-belly
    G.add(tag(ext([[-L / 2 + .3, base + .02], [L / 2 - .8, base + .02], [L / 2 - 1.1, base - .18], [-L / 2 + .6, base - .18]], W * .72, .03, m.metal), "chassis"));
    // glass / vision blocks
    if (is4) {
      G.add(tag(ext([[L / 2 - 1.3, 1.66], [L / 2 - 1.78, 2.46], [L / 2 - 1.86, 2.46], [L / 2 - 1.38, 1.66]], W * .86, .02, m.glass), "chassis"));
      [-1, 1].forEach(sd => { G.add(tag(box(1.1, .55, .02, m.glass, L / 2 - 2.55, 2.12, sd * (W / 2 + .005)), "chassis")); G.add(tag(box(1.0, .55, .02, m.glass, L / 2 - 3.85, 2.12, sd * (W / 2 + .005)), "chassis")); });
    } else {
      for (let i = 0; i < 3; i++) { const vb = box(.03, .16, .32, m.glass); vb.position.set(L / 2 - 1.5 + (i - 1) * .02, 2.05, (i - 1) * .45); vb.rotation.z = -.55; G.add(tag(vb, "chassis")); }
      [-1, 1].forEach(sd => { for (let i = 0; i < 3; i++) G.add(tag(box(.34, .14, .02, m.glass, -L / 2 + 1.6 + i * 1.35, 2.0, sd * (W / 2 + .03)), "chassis")); });
    }
    // lights
    [-1, 1].forEach(sd => {
      G.add(tag(box(.04, .12, .26, m.lamp, L / 2 + .005 - (is4 ? 0 : .08), is4 ? 1.2 : 1.3, sd * (W / 2 - .35)), "chassis"));
      G.add(tag(box(.04, .08, .12, m.red, -L / 2 - .01, 1.7, sd * (W / 2 - .25)), "chassis"));
    });
    // wheels
    const span = is4 ? [L / 2 - 1.05, -L / 2 + 1.1] : ch === "6x6" ? [L / 2 - 1.2, L / 2 - 2.7, -L / 2 + 1.25] : [L / 2 - 1.25, L / 2 - 2.6, -L / 2 + 2.55, -L / 2 + 1.2];
    span.forEach(x => [-1, 1].forEach(sd => { const w = wheel(wr, .46, m); w.position.set(x, wr, sd * (W / 2 - .02)); G.add(tag(w, "chassis")); }));
    // wheel arches
    span.forEach(x => [-1, 1].forEach(sd => { const f = ext([[-wr - .12, 0], [wr + .12, 0], [wr - .05, .22], [-wr + .05, .22]], .5, .02, m.body); f.position.set(x, wr * 2 - .02, sd * (W / 2 + .02)); G.add(tag(f, "chassis")); }));
    // armour
    const ar = cfg.armour || "medium";
    if (ar !== "light") {
      const th = ar === "medium" ? .07 : .12; const cnt = is4 ? 3 : ch === "6x6" ? 4 : 5; const len = (L - 1.2) / cnt;
      [-1, 1].forEach(sd => { for (let i = 0; i < cnt; i++) {
        G.add(tag(box(len - .08, ar === "medium" ? .5 : .62, th, m.panel, -L / 2 + .7 + len * (i + .5), 1.62, sd * (W / 2 + th / 2 + .04)), "armour"));
        if (ar !== "medium") for (let b = 0; b < 4; b++) G.add(tag(box(.05, .05, .02, m.metal, -L / 2 + .7 + len * (i + .5) + (b % 2 ? 1 : -1) * (len / 2 - .18), 1.62 + (b < 2 ? 1 : -1) * .22, sd * (W / 2 + th + .05)), "armour"));
      } });
    }
    if (ar === "aps") {
      [[L / 2 - .6, 1], [L / 2 - .6, -1], [-L / 2 + .5, 1], [-L / 2 + .5, -1]].forEach(([x, sd]) => {
        const r = box(.3, .26, .06, m.gun, x, 2.25 + (is4 ? .3 : 0), sd * (W / 2 - .05)); r.rotation.y = sd * .5; G.add(tag(r, "armour"));
        G.add(tag(box(.2, .05, .02, m.cyan, x, 2.25 + (is4 ? .3 : 0), sd * (W / 2 - .01)), "armour"));
      });
      [-1, 1].forEach(sd => G.add(tag(box(.5, .22, .3, m.metal, -.2, 2.45 + (is4 ? .25 : 0), sd * .8), "armour")));
    }
    const roofY = is4 ? 2.6 : 2.34;
    // mission module
    const mi = cfg.mission || "turret"; const MG = new T.Group();
    if (mi === "turret") {
      const ring = cyl(.62, .66, .14, m.metal, 28); ring.position.y = roofY + .07; MG.add(ring);
      const tur = ext([[-.75, 0], [.55, 0], [.8, .2], [.6, .55], [-.6, .58], [-.8, .3]], 1.15, .05, m.body); tur.position.y = roofY + .14; MG.add(tur);
      MG.add(box(.3, .22, .26, m.gun, .85, roofY + .42, 0));
      const bar = cyl(.055, .07, 2.1, m.gun, 14); bar.rotation.z = Math.PI / 2; bar.position.set(1.95, roofY + .42, 0); MG.add(bar);
      const muz = cyl(.085, .085, .22, m.gun, 12); muz.rotation.z = Math.PI / 2; muz.position.set(2.98, roofY + .42, 0); MG.add(muz);
      MG.add(box(.34, .26, .26, m.gun, -.1, roofY + .86, .32)); MG.add(box(.02, .14, .14, m.glass, .08, roofY + .86, .32));
      MG.position.x = is4 ? -.8 : .2;
    } else if (mi === "mast") {
      MG.add(box(.8, .3, .8, m.metal, 0, roofY + .15, 0));
      [1.1, .9, .8].reduce((y, h, i) => { const c = cyl(.12 - i * .025, .13 - i * .025, h, m.metal, 14); c.position.y = y + h / 2; MG.add(c); return y + h; }, roofY + .3);
      const head = new T.Group(); head.position.y = roofY + 3.1; head.add(box(.08, .7, 1.1, m.gun)); head.add(box(.02, .62, 1.0, m.gold, .05, 0, 0));
      const eo = new T.Mesh(new T.SphereGeometry(.2, 20, 14), m.gun); eo.position.y = .55; head.add(eo);
      const eg = new T.Mesh(new T.CircleGeometry(.09, 16), m.glass); eg.position.set(.2, .55, 0); eg.rotation.y = Math.PI / 2; head.add(eg);
      head.userData.spinY = .6; MG.add(head); MG.position.x = is4 ? -1.3 : -.8;
    } else if (mi === "cargo") {
      const rk = new T.Group(); rk.add(box(2.4, .05, W * .85, m.metal, 0, roofY + .12, 0));
      for (let i = 0; i < 4; i++) rk.add(box(.05, .25, W * .85, m.metal, -1.2 + i * .8, roofY + .24, 0));
      [[-.6, .4, .5], [.3, .35, .45], [-.2, .3, -.5], [.7, .25, -.45]].forEach(([x, h, z]) => rk.add(box(.7, h, .7, m.panel, x, roofY + .15 + h / 2, z)));
      MG.add(rk); MG.position.x = is4 ? -1.1 : -.4;
    } else if (mi === "medic") {
      MG.add(box(is4 ? 2.8 : 3.2, .7, W * .96, m.white, 0, roofY + .35, 0));
      [-1, 1].forEach(sd => { MG.add(box(.5, .14, .01, m.red, 0, roofY + .35, sd * W * .485)); MG.add(box(.14, .5, .01, m.red, 0, roofY + .35, sd * W * .485)); });
      MG.add(box(.3, .08, .5, m.red, .6, roofY + .74, 0)); MG.position.x = is4 ? -1.1 : -.9;
    }
    G.add(tag(MG, "mission"));
    // power
    const pw = cfg.power || "diesel";
    if (pw !== "electric") { const ex = cyl(.07, .07, .9, m.gun, 10); ex.position.set(is4 ? L / 2 - 1.7 : L / 2 - .9, roofY - .2 + (is4 ? -.4 : .2), -(W / 2 + .08)); G.add(tag(ex, "power")); }
    if (pw !== "diesel") {
      [-1, 1].forEach(sd => G.add(tag(box(L - 2.2, .04, .02, m.cyan, -.1, base + .2, sd * (W / 2 + .02)), "power")));
      if (pw === "hybrid") G.add(tag(box(.9, .35, .5, m.metal, -L / 2 + .8, roofY + .18, .6), "power"));
    }
    // cooling
    const co = cfg.cooling || "std"; const gy = is4 ? 1.05 : 1.6, gx = is4 ? L / 2 + .01 : L / 2 - .9; const nf = co === "std" ? 5 : 9;
    for (let i = 0; i < nf; i++) {
      const s = box(.02, co === "std" ? .3 : .36, .05, co === "graphene" ? m.gold : m.gun);
      if (is4) { s.position.set(gx, gy, -.5 + i * (1 / (nf - 1))); s.rotation.y = Math.PI / 2; } else s.position.set(gx - (i * .12), gy + .35, (W / 2 + .03));
      G.add(tag(s, "cooling"));
    }
    if (co === "graphene") G.add(tag(box(1.2, .02, .9, m.gold, is4 ? L / 2 - .6 : L / 2 - 1.3, is4 ? 1.56 : 2.1, 0), "cooling"));
    // intelligence
    const ai = cfg.ai || "manual";
    if (ai !== "manual") [[L / 2 - .2, 1], [L / 2 - .2, -1], [-L / 2 + .1, 1], [-L / 2 + .1, -1]].forEach(([x, sd]) => {
      G.add(tag(box(.12, .1, .1, m.gun, x, is4 ? 2.45 : 2.2, sd * (W / 2 - .1)), "ai"));
      G.add(tag(box(.02, .04, .04, m.cyan, x + (x > 0 ? .06 : -.06), is4 ? 2.45 : 2.2, sd * (W / 2 - .1)), "ai"));
    });
    if (ai === "convoy") {
      const pk = cyl(.18, .2, .2, m.gun, 24); pk.position.set(is4 ? L / 2 - 2.1 : L / 2 - 1.9, roofY + .1, 0); pk.userData.spinY = 3; G.add(tag(pk, "ai"));
      G.add(tag(box(.02, .05, .3, m.cyan, pk.position.x + .19, roofY + .12, 0), "ai"));
    }
    // antennas & details
    [-1, 1].forEach(sd => { const a = cyl(.012, .02, 1.8, m.gun, 6); a.position.set(-L / 2 + .4, roofY + .9, sd * (W / 2 - .2)); a.rotation.z = .08; G.add(tag(a, "chassis")); });
    G.add(tag(box(.5, .06, .4, m.metal, is4 ? -L / 2 + 1 : L / 2 - 2.2, roofY + .04, -.5), "chassis"));
    G.userData.len = L; G.userData.h = roofY + 1; return G;
  }

  /* ---------- DRONE ---------- */
  function drone(cfg: Record<string, any> = {}) {
    const m = mats("dark"); const G = new T.Group(); const fr = cfg.frame || "quad"; const sh = cfg.shell || "std";
    const rotors: Group[] = [];
    function rotor(r: number, blades: number) {
      const g = new T.Group(); g.add(cyl(.05, .06, .08, m.metal, 12));
      for (let i = 0; i < blades; i++) { const b = box(r, .012, .07, m.gun); b.position.x = r / 2; const p = new T.Group(); p.add(b); p.rotation.y = i / blades * Math.PI * 2; g.add(p); }
      const disc = new T.Mesh(new T.CircleGeometry(r, 32), new T.MeshBasicMaterial({ color: 0x9fb0be, transparent: true, opacity: .08, depthWrite: false, side: T.DoubleSide }));
      disc.rotation.x = -Math.PI / 2; g.add(disc); g.userData.spinY = 28; rotors.push(g); return g;
    }
    if (fr === "vtol") {
      const fus = new T.Mesh(capG(.22, 1.6), m.body); fus.rotation.z = Math.PI / 2; fus.position.y = .6; fus.castShadow = true; G.add(tag(fus, "frame"));
      const nose = new T.Mesh(new T.SphereGeometry(.22, 20, 14), m.body); nose.position.set(1.0, .6, 0); nose.scale.x = 1.6; G.add(tag(nose, "frame"));
      const wing = ext([[0, -1.9], [.35, -1.9], [.45, 1.9], [0, 1.9]], .05, .02, m.body); wing.rotation.x = Math.PI / 2; wing.position.set(-.1, .72, 0); G.add(tag(wing, "frame"));
      [-1, 1].forEach(sd => {
        const bm = cyl(.035, .035, 2.2, m.body, 10); bm.rotation.z = Math.PI / 2; bm.position.set(0, .68, sd * .95); G.add(tag(bm, "frame"));
        [.95, -1.05].forEach(x => { const r = rotor(.45, 2); r.position.set(x, .82, sd * .95); G.add(tag(r, "motors")); });
        const vt = ext([[0, 0], [.35, 0], [.1, .45], [-.05, .45]], .03, .01, m.body); vt.position.set(-1.2, .68, sd * .95); vt.rotation.x = sd * -.4; G.add(tag(vt, "frame"));
      });
      const pr = rotor(.35, 3); pr.rotation.z = Math.PI / 2; pr.position.set(-1.12, .6, 0); pr.userData.spinY = 0; pr.userData.spinX = 28; G.add(tag(pr, "motors"));
      [-1, 1].forEach(sd => { G.add(tag(box(.9, .03, .03, m.gun, .1, .12, sd * .3), "frame")); const lg = cyl(.02, .02, .45, m.gun, 6); lg.position.set(.1, .35, sd * .3); G.add(tag(lg, "frame")); });
    } else {
      const arms = fr === "hexa" ? 6 : 4;
      const bodyPts = sh === "low" ? [[-.45, 0], [.45, 0], [.6, .14], [.35, .3], [-.35, .3], [-.6, .14]] : [[-.4, 0], [.4, 0], [.52, .12], [.4, .28], [-.4, .28], [-.52, .12]];
      const body = ext(bodyPts, .62, sh === "low" ? .01 : .06, m.body); body.position.y = .45; G.add(tag(body, "frame")); G.add(tag(box(.2, .04, .3, m.cyan, .45, .62, 0), "frame"));
      for (let i = 0; i < arms; i++) {
        const a = (i + .5) / arms * Math.PI * 2;
        const arm = box(1.1, .06, .08, m.body); arm.position.set(Math.cos(a) * .6, .62, Math.sin(a) * .6); arm.rotation.y = -a; G.add(tag(arm, "frame"));
        const mo = cyl(.09, .1, .14, cfg.motors === "quiet" ? m.gold : m.metal, 16); mo.position.set(Math.cos(a) * 1.12, .7, Math.sin(a) * 1.12); G.add(tag(mo, "motors"));
        const r = rotor(cfg.motors === "quiet" ? .52 : .46, cfg.motors === "quiet" ? 3 : 2); r.position.set(Math.cos(a) * 1.12, .8, Math.sin(a) * 1.12); G.add(tag(r, "motors"));
        G.add(tag(box(.04, .03, .04, i < arms / 2 ? m.red : m.cyan, Math.cos(a) * 1.12, .62, Math.sin(a) * 1.12), "frame"));
      }
      [-1, 1].forEach(sd => { G.add(tag(box(.9, .03, .04, m.gun, 0, .05, sd * .35), "frame")); [-.3, .3].forEach(x => { const l = cyl(.018, .018, .42, m.gun, 6); l.position.set(x, .26, sd * .35); l.rotation.x = sd * .2; G.add(tag(l, "frame")); }); });
    }
    // energy
    const en = cfg.energy || "ls";
    if (en === "h2") { const t = new T.Mesh(new T.CylinderGeometry(.13, .13, .8, 20), m.white); t.rotation.z = Math.PI / 2; t.position.set(fr === "vtol" ? -.1 : 0, .86, 0); t.castShadow = true; G.add(tag(t, "energy")); G.add(tag(box(.1, .02, .28, m.cyan, fr === "vtol" ? -.1 : 0, .99, 0), "energy")); }
    else if (en === "ll") G.add(tag(box(.5, .08, .34, m.metal, fr === "vtol" ? .2 : 0, fr === "vtol" ? .34 : .4, 0), "energy"));
    // payload
    const pl = cfg.payload || "eoir"; const PG = new T.Group(); PG.position.set(fr === "vtol" ? .6 : .1, fr === "vtol" ? .3 : .28, 0);
    if (pl === "eoir") { PG.add(cyl(.03, .03, .1, m.gun, 8)); const ball = new T.Mesh(new T.SphereGeometry(.14, 24, 16), m.gun); ball.position.y = -.12; PG.add(ball); const l = new T.Mesh(new T.CircleGeometry(.06, 16), m.glass); l.position.set(.14, -.12, 0); l.rotation.y = Math.PI / 2; PG.add(l); }
    else if (pl === "lidar") { const pk = cyl(.12, .12, .12, m.gun, 24); pk.position.y = -.08; pk.userData.spinY = 4; PG.add(pk); PG.add(box(.02, .04, .18, m.cyan, .12, -.08, 0)); }
    else if (pl === "pod") { const pd = new T.Mesh(capG(.08, .4), m.panel); pd.rotation.z = Math.PI / 2; pd.position.y = -.1; PG.add(pd); }
    else if (pl === "relay") { const mst = cyl(.015, .015, .6, m.gun, 6); mst.position.y = .55; PG.position.y = .9; PG.add(mst); const d = new T.Mesh(new T.ConeGeometry(.16, .08, 20, 1, true), m.white); d.position.y = .85; PG.add(d); }
    G.add(tag(PG, "payload"));
    if (cfg.autonomy === "swarm") G.add(tag(box(.18, .03, .18, m.cyan, fr === "vtol" ? -.3 : -.2, fr === "vtol" ? .84 : .77, 0), "autonomy"));
    else if (cfg.autonomy === "wp") { const a = cyl(.01, .01, .3, m.gun, 6); a.position.set(-.25, fr === "vtol" ? .95 : .9, 0); G.add(tag(a, "autonomy")); }
    if (sh === "sand") [-1, 1].forEach(sd => G.add(tag(box(.3, .14, .02, m.gold, fr === "vtol" ? .4 : .1, fr === "vtol" ? .6 : .58, sd * (fr === "vtol" ? .2 : .32)), "shell")));
    G.scale.setScalar(1.6); G.userData.len = 4; G.userData.h = 2.2; G.userData.rotors = rotors; return G;
  }

  /* ---------- LIGHT ISR AIRCRAFT ---------- */
  function aircraft(cfg: Record<string, any> = {}) {
    const carbon = cfg.structure === "carbon"; const m = mats(carbon ? "dark" : "grey"); const G = new T.Group();
    // fuselage (lathe along x)
    const prof = [[0, 0], [.18, .15], [.34, .55], [.46, 1.2], [.5, 2.2], [.48, 3.4], [.4, 4.6], [.28, 5.8], [.16, 6.9], [.05, 7.4], [0, 7.45]];
    const lg = new T.LatheGeometry(prof.map(p => new T.Vector2(p[0], p[1])), 32); lg.rotateZ(Math.PI / 2); lg.translate(3.75, 0, 0);
    const fus = new T.Mesh(lg, m.body); fus.scale.set(1, 1.05, .9); fus.position.y = 1.6; fus.castShadow = fus.receiveShadow = true; G.add(tag(fus, "structure"));
    // canopy
    const can = new T.Mesh(new T.SphereGeometry(.5, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), m.glass); can.scale.set(2.2, .9, .78); can.position.set(1.2, 1.95, 0); G.add(tag(can, "avionics"));
    G.add(tag(box(.04, .36, .04, m.body, 1.7, 2.1, 0), "structure")); G.add(tag(box(.04, .36, .04, m.body, .6, 2.1, 0), "structure"));
    // wing
    const span = cfg.wing === "le" ? 6.6 : 5.6; const wp = [[.9, 0], [-.5, 0], [-.95, span], [.05, span], [.25, span * .6]];
    const wing = ext(wp, .16, .05, m.body, 2); wing.rotation.x = -Math.PI / 2; wing.position.set(.9, 1.3, 0); G.add(tag(wing, "wing"));
    const wr = ext(wp.map(p => [p[0], -p[1]]), .16, .05, m.body, 2); wr.rotation.x = -Math.PI / 2; wr.position.set(.9, 1.3, 0); G.add(tag(wr, "wing"));
    [-1, 1].forEach(sd => G.add(tag(box(.25, .03, .04, m.cyan, 0, 1.32, sd * (span - .05)), "wing")));
    if (cfg.wing === "strike") [-1, 1].forEach(sd => G.add(tag(box(.8, .08, .08, m.gun, .3, 1.24, sd * 1.4), "wing")));
    // tail
    const hs = ext([[.2, 0], [-.9, 0], [-1.05, 1.7], [-.55, 1.7]], .1, .03, m.body);
    [1, -1].forEach(sd => { const h = hs.clone(); h.rotation.x = sd * -Math.PI / 2; h.position.set(-2.7, 1.95, 0); G.add(tag(h, "structure")); });
    const vf = ext([[.3, 0], [-1.1, 0], [-1.25, 1.35], [-.7, 1.35]], .12, .03, m.body); vf.position.set(-2.55, 1.95, 0); G.add(tag(vf, "structure"));
    // engine & propeller
    const eng = cfg.engine || "tp"; const blades = eng === "hp" ? 5 : 4; const PR = new T.Group(); PR.position.set(3.78, 1.6, 0);
    const sp = new T.Mesh(new T.ConeGeometry(.2, .45, 24), m.metal); sp.rotation.z = -Math.PI / 2; sp.position.x = .18; PR.add(sp);
    for (let i = 0; i < blades; i++) { const b = box(.05, 1.5, .14, m.gun); b.position.y = .78; const p = new T.Group(); p.add(b); p.rotation.x = i / blades * Math.PI * 2; PR.add(p); }
    const blur = new T.Mesh(new T.CircleGeometry(1.55, 40), new T.MeshBasicMaterial({ color: 0xb8c4cf, transparent: true, opacity: .025, side: T.DoubleSide, depthWrite: false }));
    blur.rotation.y = Math.PI / 2; PR.add(blur);
    PR.userData.spinX = 22; G.add(tag(PR, "engine"));
    [-1, 1].forEach(sd => { const ex = cyl(.07, .09, .3, m.gun, 10); ex.rotation.x = Math.PI / 2; ex.position.set(2.7, 1.7, sd * .46); G.add(tag(ex, "engine")); });
    if (eng === "hy" || eng === "el") G.add(tag(box(.7, .08, .02, m.cyan, 2.4, 1.45, .47), "engine"));
    // hardpoints (payload): 0, 2, 4 or 7 stores
    const hp = +(cfg.pods ?? 4); const per = hp >= 7 ? 3 : hp >= 4 ? 2 : hp > 0 ? 1 : 0; const PG = new T.Group();
    [-1, 1].forEach(sd => { for (let i = 0; i < per; i++) {
      const z = sd * (1.4 + i * 1.25); PG.add(box(.6, .18, .06, m.metal, .25, 1.12, z));
      const pd = new T.Mesh(new T.CylinderGeometry(.14, .14, 1.4, 16), i === 0 ? m.panel : m.metal); pd.rotation.z = Math.PI / 2; pd.position.set(.3, .92, z); pd.castShadow = true; PG.add(pd);
      const nc = new T.Mesh(new T.ConeGeometry(.14, .3, 16), m.metal); nc.rotation.z = -Math.PI / 2; nc.position.set(1.15, .92, z); PG.add(nc);
    } });
    if (hp === 7) { const c = new T.Mesh(new T.CylinderGeometry(.18, .18, 1.8, 16), m.panel); c.rotation.z = Math.PI / 2; c.position.set(.3, .95, 0); PG.add(c); }
    G.add(tag(PG, "payload"));
    // sensors ("ball" is the Bay's name for the EO/IR ball)
    const se = cfg.sensors === "ball" ? "eoir" : cfg.sensors || "none";
    if (se === "eoir") {
      const b = new T.Mesh(new T.SphereGeometry(.2, 24, 16), m.gun); b.position.set(2.2, 1.08, 0); G.add(tag(b, "sensors"));
      const l = new T.Mesh(new T.CircleGeometry(.09, 16), m.glass); l.position.set(2.4, 1.06, 0); l.rotation.y = Math.PI / 2; G.add(tag(l, "sensors"));
    }
    if (se === "sar") { const s = new T.Mesh(new T.CylinderGeometry(.16, .16, 2.2, 16), m.panel); s.rotation.z = Math.PI / 2; s.position.set(-.4, 1.05, 0); G.add(tag(s, "sensors")); }
    if (cfg.avionics === "aico") G.add(tag(box(.3, .02, .3, m.cyan, -1.2, 2.05, 0), "avionics"));
    // landing gear
    const gear = (x: number, z: number, h: number) => {
      const s = cyl(.04, .04, h, m.metal, 8); s.position.set(x, h / 2 + .25, z); G.add(tag(s, "structure"));
      const w = cyl(.25, .25, .16, m.rubber, 20); w.rotation.x = Math.PI / 2; w.position.set(x, .25, z); G.add(tag(w, "structure"));
    };
    gear(2.3, 0, 1.05); gear(-.1, 1.1, .85); gear(-.1, -1.1, .85);
    // navigation lights
    G.add(tag(box(.04, .04, .04, m.red, -.95, 1.32, -span + .1), "wing")); G.add(tag(box(.04, .04, .04, m.green, -.95, 1.32, span - .1), "wing"));
    G.userData.len = span * 2; G.userData.h = 3.5; return G;
  }

  function build(p: string, cfg: Record<string, any> | null | undefined) { return p === "vehicle" ? vehicle(cfg || {}) : p === "drone" ? drone(cfg || {}) : aircraft(cfg || {}); }
  function animate(root: Object3D, dt: number) { root.traverse(o => { if (o.userData.spinY) o.rotation.y += o.userData.spinY * dt; if (o.userData.spinX) o.rotation.x += o.userData.spinX * dt; }); }
  function disposeModel(root: Object3D) {
    const seen = new Set<BufferGeometry>();
    root.traverse(o => {
      const me = o as Mesh; if (!me.isMesh && !(o as any).isLineSegments) return;
      const g = me.geometry as BufferGeometry; if (g && !seen.has(g)) { seen.add(g); g.dispose(); }
      const ms = Array.isArray(me.material) ? me.material : [me.material];
      ms.forEach(m => { if (m && !m.userData.shared) m.dispose(); });
    });
  }
  function dispose() {
    for (const k in M) Object.values(M[k]).forEach(m => m.dispose());
    for (const k in M) delete M[k];
    camoTex?.dispose(); camoTex = null;
  }
  return { build, vehicle, drone, aircraft, animate, mats, disposeModel, dispose };
}
export default CALMOD;
