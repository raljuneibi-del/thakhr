/* SADEEM Hangar · 3D platform viewer: night studio (one soft key light, matte materials, no bloom, sRGB output),
   orbit, explode by assembly, layer isolation, highlight, A/B ghost compare.
   When WebGL is unavailable it degrades to a live blueprint elevation (SVG) that honours the same API. */
import { loadThree, hasWebGL, RM, svgEl } from "@/core";
import { CALMOD, type ModelFactory } from "./procedural";
import type { Group, Mesh, Object3D, Scene, PerspectiveCamera, WebGLRenderer, Material, Texture } from "three";

export interface ViewerAPI {
  /** Build the renderer and attach it. Resolves false when WebGL is unavailable (blueprint fallback is shown). */
  mount(): Promise<boolean>;
  readonly mode: "3d" | "blueprint" | "idle";
  set(kind: string, cfg: Record<string, any>): void;
  explode(f: number): void;
  layers(set: Set<string> | null): void;
  highlight(slot: string | null): void;
  ghost(kind: string | null, cfg: Record<string, any> | null): void;
  zoom(dir: 1 | -1): void;
  reset(): void;
  stop(): void;
}

/* Explode offsets per assembly, in model lengths/6. The fourth value pushes the part outward along its side (±z). */
type Off = [number, number, number, number?];
const OFF: Record<string, Record<string, Off>> = {
  vehicle: { chassis: [0, 0, 0], power: [0, .5, 0, 1.3], armour: [0, .35, 0, 1.5], mission: [0, 2.4, 0], cooling: [1.8, .4, 0], ai: [0, 2.9, 0, .9] },
  aircraft: { structure: [0, 0, 0], wing: [.2, .15, 0, 1.4], engine: [1.5, .15, 0], avionics: [0, 1.3, 0], sensors: [.5, -.9, 0], payload: [0, -1.1, 0] },
  drone: { frame: [0, 0, 0], motors: [0, .9, 0], energy: [0, -.7, 0], sensors: [0, 1.6, .9], payload: [0, -.9, 0], autonomy: [0, 1.2, 0], shell: [0, 0, 0, 1] },
};

const cssVar = (el: Element, k: string, d: string) => (getComputedStyle(el).getPropertyValue(k).trim() || d);

export function Viewer(host: HTMLElement): ViewerAPI {
  let mode: ViewerAPI["mode"] = "idle";
  let T: typeof import("three");
  let R: WebGLRenderer | null = null, S: Scene, CAM: PerspectiveCamera, MF: ModelFactory;
  let MOD: Group | null = null, GHOST: Group | null = null;
  let cv: HTMLCanvasElement | null = null, raf = 0, last = 0, ro: ResizeObserver | null = null, io: IntersectionObserver | null = null;
  let exp = 0, expT = 0, vis: Set<string> | null = null, hl: string | null = null, sig = "", kind = "vehicle";
  let ring: Mesh | null = null;
  let hlMat: Material | null = null, ghostFill: Material | null = null, ghostLine: Material | null = null;
  const disposables: Array<{ dispose(): void }> = [];
  const off: Array<() => void> = [];
  const orb = { th: .8, ph: 1.15, r: 12, tth: .8, tph: 1.15, tr: 12, user: 0, min: 4, max: 40, home: 12 };
  let onScreen = true;

  /* ---------- blueprint fallback state ---------- */
  let bp: SVGSVGElement | null = null; let bpCfg: Record<string, any> | null = null; let bpGhost: { kind: string; cfg: Record<string, any> } | null = null;

  async function init() {
    if (!hasWebGL()) throw new Error("no-webgl");
    T = await loadThree();
    const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
    MF = CALMOD(T);
    cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: "high-performance" });
    R.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    R.outputColorSpace = T.SRGBColorSpace;
    R.toneMapping = T.NeutralToneMapping; R.toneMappingExposure = 1;
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFShadowMap;

    const bg = new T.Color(cssVar(host, "--night", "#12100B"));
    S = new T.Scene(); S.background = bg; S.fog = new T.Fog(bg, 30, 64);
    // soft image-based fill from a neutral room, kept low: it gives the matte surfaces form without a second lamp
    const pm = new T.PMREMGenerator(R); const env = pm.fromScene(new RoomEnvironment(), .04).texture; pm.dispose();
    S.environment = env; S.environmentIntensity = .32; disposables.push(env);
    CAM = new T.PerspectiveCamera(30, 1, .1, 200);

    // the one key light: warm, high, soft-shadowed
    const key = new T.DirectionalLight(0xFFF3E2, 2.6); key.position.set(8, 16, 10); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.normalBias = .02; key.shadow.radius = 5; key.shadow.blurSamples = 12;
    const sc = key.shadow.camera; sc.left = sc.bottom = -14; sc.right = sc.top = 14; sc.near = 1; sc.far = 50;
    S.add(key);

    // floor: warm graphite with a faint 1 m grid and one hairline gold ring; fog dissolves the edge into the night
    const c = document.createElement("canvas"); c.width = c.height = 1024; const x = c.getContext("2d")!;
    x.fillStyle = "#1E1B15"; x.fillRect(0, 0, 1024, 1024);
    x.strokeStyle = "rgba(241,236,223,.05)"; x.lineWidth = 1;
    for (let i = 0; i <= 1024; i += 12.8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 1024); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(1024, i); x.stroke(); }
    const ft = new T.CanvasTexture(c); ft.colorSpace = T.SRGBColorSpace; ft.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy());
    const floorG = new T.CircleGeometry(80, 96), floorM = new T.MeshStandardMaterial({ map: ft, roughness: .92, metalness: 0 });
    const floor = new T.Mesh(floorG, floorM); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; S.add(floor);
    disposables.push(ft, floorG, floorM);
    const ringG = new T.RingGeometry(1, 1.012, 160), ringM = new T.MeshBasicMaterial({ color: new T.Color("#C8A45C"), transparent: true, opacity: .2, depthWrite: false });
    ring = new T.Mesh(ringG, ringM); ring.rotation.x = -Math.PI / 2; ring.position.y = .005; S.add(ring); disposables.push(ringG, ringM);

    hlMat = new T.MeshStandardMaterial({ color: new T.Color("#C8A45C"), emissive: new T.Color("#5A4318"), roughness: .45, metalness: .2 });
    ghostFill = new T.MeshBasicMaterial({ color: new T.Color("#6FA8E6"), transparent: true, opacity: .1, depthWrite: false });
    ghostLine = new T.LineBasicMaterial({ color: new T.Color("#8CBBF0"), transparent: true, opacity: .55, depthWrite: false });
    disposables.push(hlMat, ghostFill, ghostLine);

    /* orbit: drag, wheel, pinch, keyboard */
    const P = new Map<number, [number, number]>(); let pinch = 0;
    const lis = <K extends keyof HTMLElementEventMap>(el: HTMLElement, k: K, f: (e: HTMLElementEventMap[K]) => void, o?: AddEventListenerOptions) => { el.addEventListener(k, f as any, o); off.push(() => el.removeEventListener(k, f as any, o)); };
    lis(cv, "pointerdown", e => { cv!.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]); orb.user = performance.now(); host.classList.add("grab"); });
    lis(cv, "pointermove", e => {
      if (!P.has(e.pointerId)) return; const [px, py] = P.get(e.pointerId)!; P.set(e.pointerId, [e.clientX, e.clientY]); orb.user = performance.now();
      if (P.size === 1) { orb.tth -= (e.clientX - px) * .008; orb.tph = Math.max(.5, Math.min(1.5, orb.tph - (e.clientY - py) * .006)); }
      else if (P.size === 2) { const v = [...P.values()]; const d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]); if (pinch) orb.tr = clampR(orb.tr * pinch / d); pinch = d; }
    });
    const up = (e: PointerEvent) => { P.delete(e.pointerId); if (P.size < 2) pinch = 0; if (!P.size) host.classList.remove("grab"); };
    lis(cv, "pointerup", up); lis(cv, "pointercancel", up);
    lis(cv, "wheel", e => { e.preventDefault(); orb.tr = clampR(orb.tr * (1 + Math.sign(e.deltaY) * .08)); orb.user = performance.now(); }, { passive: false });
    lis(host, "keydown", e => {
      if (e.target !== host) return;
      const k = e.key; let hit = true;
      if (k === "ArrowLeft") orb.tth += .15; else if (k === "ArrowRight") orb.tth -= .15;
      else if (k === "ArrowUp") orb.tph = Math.max(.5, orb.tph - .08); else if (k === "ArrowDown") orb.tph = Math.min(1.5, orb.tph + .08);
      else if (k === "+" || k === "=") api.zoom(-1); else if (k === "-" || k === "_") api.zoom(1);
      else if (k === "0" || k === "Home") api.reset(); else hit = false;
      if (hit) { e.preventDefault(); e.stopPropagation(); orb.user = performance.now(); }
    });
    ro = new ResizeObserver(size);
    io = new IntersectionObserver(es => { onScreen = es.some(x => x.isIntersecting); if (onScreen) loop(); });
  }
  const clampR = (r: number) => Math.max(orb.min, Math.min(orb.max, r));

  function size() {
    if (!R || !CAM) return; const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    R.setSize(w, h, false); CAM.aspect = w / h; CAM.updateProjectionMatrix();
    // fit the model to narrow viewports (the camera frames by height, so widen the distance when the frame is tall)
    const len = MOD?.userData.len || 7; orb.home = len * (CAM.aspect < 1.2 ? 3.2 : 2.35);
    if (!orb.user) orb.tr = orb.home; // keep framing until the viewer is touched
  }

  function prep(root: Object3D) {
    root.updateMatrixWorld(true);
    const box = new T.Box3(), c = new T.Vector3();
    root.traverse(o => { if ((o as Mesh).isMesh) o.userData.base = (o as Mesh).material; });
    root.children.forEach(ch => {
      ch.userData.o = ch.position.clone();
      ch.userData.s = ch.userData.slot || findSlot(ch);
      box.setFromObject(ch); box.getCenter(c); ch.userData.side = Math.abs(c.z) < .05 ? 0 : Math.sign(c.z);
    });
  }
  function findSlot(o: Object3D): string | null { if (o.userData.slot) return o.userData.slot; for (const c of o.children) { const r = findSlot(c); if (r) return r; } return null; }
  function applyExplode(root: Group | null) {
    if (!root) return; const L = (root.userData.len || 7) / 6; const tab = OFF[root.userData.kind] || OFF.vehicle;
    root.children.forEach(ch => {
      const o0 = ch.userData.o; if (!o0) return; const o = tab[ch.userData.s] || [0, .6, 0]; const lat = (o[3] || 0) * (ch.userData.side || 0);
      ch.position.set(o0.x + o[0] * L * exp, o0.y + o[1] * L * exp, o0.z + (o[2] + lat) * L * exp);
    });
  }
  function applyVis(root: Group | null) {
    if (!root) return;
    root.traverse(o => {
      const m = o as Mesh; if (!m.isMesh) return; const s = o.userData.slot;
      o.visible = !vis || !s || vis.has(s);
      if (o.userData.base) m.material = (hl && s === hl) ? hlMat! : o.userData.base;
    });
  }
  function dropModel(root: Group | null) { if (!root) return; S.remove(root); MF.disposeModel(root); }

  function frame(now: number) {
    raf = 0; if (!cv || !cv.isConnected || !R || !onScreen) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    if (performance.now() - orb.user > 4000 && !RM) orb.tth += dt * .12;
    const k = RM ? 1 : Math.min(1, dt * 6);
    orb.th += (orb.tth - orb.th) * k; orb.ph += (orb.tph - orb.ph) * k; orb.r += (orb.tr - orb.r) * (RM ? 1 : Math.min(1, dt * 5));
    if (Math.abs(expT - exp) > .0005) { exp += (expT - exp) * (RM ? 1 : Math.min(1, dt * 8)); applyExplode(MOD); applyExplode(GHOST); }
    const ty = (MOD?.userData.h || 3) * .4 + exp * 1.2, rr = orb.r * (1 + exp * .22);
    CAM.position.set(Math.sin(orb.th) * Math.sin(orb.ph) * rr, ty + Math.cos(orb.ph) * rr, Math.cos(orb.th) * Math.sin(orb.ph) * rr);
    CAM.lookAt(0, ty, 0);
    if (MOD && !RM) MF.animate(MOD, dt);
    R.render(S, CAM);
  }
  function loop() { if (!raf && mode === "3d") { last = 0; raf = requestAnimationFrame(frame); } }

  /* ---------- blueprint (SVG) fallback ---------- */
  function bpRender() {
    if (!bp) return;
    bp.innerHTML = "";
    const k = bpCfg ? kind : "vehicle";
    const g = blueprint(k, bpCfg || {}, "b"); bp.appendChild(g);
    if (bpGhost) bp.insertBefore(blueprint(bpGhost.kind, bpGhost.cfg, "a"), g);
    bpApply();
  }
  function bpApply() {
    if (!bp) return; const tab = OFF[kind] || OFF.vehicle;
    bp.querySelectorAll<SVGGElement>("g[data-slot]").forEach(g => {
      const s = g.dataset.slot!; const o = tab[s] || [0, .6, 0];
      const ghost = g.closest(".bpA");
      // side elevation: x is length, y is height; lateral parts separate slightly downward so they read as "off the side"
      g.setAttribute("transform", `translate(${(o[0] * .6) * exp} ${-(o[1] * .6 - Math.abs(o[3] || 0) * .3) * exp})`);
      g.style.opacity = (!ghost && vis && !vis.has(s)) ? "0" : "";
      g.classList.toggle("hl", !ghost && hl === s);
    });
  }

  const api: ViewerAPI = {
    get mode() { return mode; },
    async mount() {
      host.classList.add("ld");
      try { if (!R) await init(); }
      catch {
        host.classList.remove("ld"); host.classList.add("fail"); mode = "blueprint";
        bp = svgEl("svg", { class: "bp", viewBox: "-5.6 -6.2 11.2 7", "aria-hidden": "true", preserveAspectRatio: "xMidYMid meet" }) as SVGSVGElement;
        host.prepend(bp); bpRender(); return false;
      }
      mode = "3d";
      host.prepend(cv!); host.classList.remove("ld"); host.classList.add("live");
      ro!.observe(host); io!.observe(host); size(); loop();
      return true;
    },
    set(k, cfg) {
      kind = k;
      if (mode === "blueprint") { bpCfg = cfg; bpRender(); return; }
      if (!R) return;
      const s = k + JSON.stringify(cfg); if (s === sig && MOD) return; sig = s;
      const first = !MOD || MOD.userData.kind !== k;
      dropModel(MOD);
      MOD = MF.build(k, cfg); MOD.userData.kind = k;
      MOD.traverse(o => { if ((o as Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      prep(MOD); S.add(MOD);
      const len = MOD.userData.len || 7; ring?.scale.setScalar(len * .78); orb.min = len * .8; orb.max = len * 3.5;
      size();
      if (first) { orb.tr = orb.r = orb.home; orb.user = 0; }
      if (S.fog) { (S.fog as any).near = len * 2.2; (S.fog as any).far = len * 5.2; }
      applyExplode(MOD); applyVis(MOD); applyExplode(GHOST);
    },
    explode(f) { expT = f; if (mode === "blueprint") { exp = f; bpApply(); } else if (RM) { exp = f; applyExplode(MOD); applyExplode(GHOST); } },
    layers(set) { vis = set; if (mode === "blueprint") bpApply(); else applyVis(MOD); },
    highlight(slot) { hl = slot; if (mode === "blueprint") bpApply(); else applyVis(MOD); },
    ghost(k, cfg) {
      if (mode === "blueprint") { bpGhost = k && cfg ? { kind: k, cfg } : null; bpRender(); return; }
      if (GHOST) { dropModel(GHOST); GHOST = null; }
      if (!cfg || !k || !R) return;
      GHOST = MF.build(k, cfg); GHOST.userData.kind = k;
      const lines: Array<[Object3D, Object3D]> = [];
      GHOST.traverse(o => {
        const m = o as Mesh; if (!m.isMesh) return;
        m.material = ghostFill!; m.castShadow = false; m.receiveShadow = false; m.renderOrder = 2;
        const e = new T.LineSegments(new T.EdgesGeometry(m.geometry, 28), ghostLine!); e.renderOrder = 3; lines.push([m, e]);
      });
      lines.forEach(([m, e]) => m.add(e));
      prep(GHOST); GHOST.traverse(o => { delete o.userData.base; });
      S.add(GHOST); applyExplode(GHOST);
    },
    zoom(dir) { orb.tr = clampR(orb.tr * (dir > 0 ? 1.18 : 1 / 1.18)); orb.user = performance.now(); },
    reset() { orb.tth = orb.th + ((.8 - orb.th) % (Math.PI * 2)); orb.tph = 1.15; orb.tr = orb.home; orb.user = performance.now(); },
    stop() {
      if (raf) cancelAnimationFrame(raf); raf = 0;
      ro?.disconnect(); io?.disconnect(); off.forEach(f => f()); off.length = 0;
      if (R) {
        dropModel(MOD); dropModel(GHOST); MOD = GHOST = null;
        MF.dispose(); disposables.forEach(d => d.dispose()); disposables.length = 0;
        (S.environment as Texture | null)?.dispose();
        R.dispose(); R.forceContextLoss(); R = null;
      }
      cv?.remove(); cv = null; bp?.remove(); bp = null; mode = "idle";
    },
  };
  return api;
}

/* ---------- blueprint elevation (side view, metres; y up) ---------- */
function P(pts: number[][], cls: string) { return svgEl("polygon", { points: pts.map(p => `${p[0].toFixed(3)},${(-p[1]).toFixed(3)}`).join(" "), class: cls }); }
function Rc(x: number, y: number, w: number, h: number, cls: string) { return svgEl("rect", { x: x.toFixed(3), y: (-(y + h)).toFixed(3), width: w.toFixed(3), height: h.toFixed(3), class: cls }); }
function Ci(x: number, y: number, r: number, cls: string) { return svgEl("circle", { cx: x.toFixed(3), cy: (-y).toFixed(3), r: r.toFixed(3), class: cls }); }
function Li(x1: number, y1: number, x2: number, y2: number, cls: string) { return svgEl("line", { x1, y1: -y1, x2, y2: -y2, class: cls }); }
function G(slot: string, ...kids: Element[]) { const g = svgEl("g", { "data-slot": slot }); kids.forEach(k => g.appendChild(k)); return g; }

/** Side elevation of the same procedural platform, for devices without WebGL. `which` = "b" (current) or "a" (ghost). */
export function blueprint(kind: string, cfg: Record<string, any>, which: "a" | "b"): SVGGElement {
  const root = svgEl("g", { class: which === "a" ? "bpA" : "bpB" }) as SVGGElement;
  if (kind === "aircraft") {
    const prof = [[0, 0], [.18, .15], [.34, .55], [.46, 1.2], [.5, 2.2], [.48, 3.4], [.4, 4.6], [.28, 5.8], [.16, 6.9], [.05, 7.4], [0, 7.45]];
    const top = prof.map(p => [3.75 - p[1], 1.6 + p[0] * 1.05]), bot = prof.map(p => [3.75 - p[1], 1.6 - p[0] * 1.05]).reverse();
    const hp = +(cfg.pods ?? 4), per = hp >= 7 ? 3 : hp >= 4 ? 2 : hp > 0 ? 1 : 0;
    const pods: Element[] = []; for (let i = 0; i < per; i++) pods.push(Rc(-.4 + i * .08, .78, 1.55, .28, "s2"), Rc(.1 + i * .08, 1.02, .4, .12, "s1"));
    root.append(
      G("structure", P([...top, ...bot], "s1"), P([[-2.25, 1.95], [-3.65, 1.95], [-3.8, 3.3], [-3.25, 3.3]], "s1"), Li(-3.6, 1.95, -2.5, 1.95, "hl1"),
        Li(2.3, .5, 2.3, 1.3, "hl1"), Ci(2.3, .25, .25, "s2"), Li(-.1, .5, -.1, 1.1, "hl1"), Ci(-.1, .25, .25, "s2")),
      G("wing", Rc(-.95, 1.25, 1.85, .1, "s1"), ...(cfg.wing === "le" ? [Rc(-1.05, 1.25, 2.05, .1, "s3")] : []), ...(cfg.wing === "strike" ? [Rc(-.1, 1.16, .8, .08, "s2")] : [])),
      G("engine", Rc(3.78, .05, .06, 3.1, "s2"), P([[3.78, 1.4], [4.25, 1.6], [3.78, 1.8]], "s2"), Rc(2.55, 1.6, .3, .14, "s2"),
        ...(cfg.engine === "el" || cfg.engine === "hy" ? [Rc(2.05, 1.41, .7, .08, "ac")] : [])),
      G("avionics", svgEl("path", { d: "M0.1,-1.95 A1.1,0.45 0 0 1 2.3,-1.95 Z", class: "s3" }), ...(cfg.avionics === "aico" ? [Rc(-1.35, 2.03, .3, .04, "ac")] : [])),
      G("payload", ...pods),
      G("sensors", ...(cfg.sensors === "ball" || cfg.sensors === "eoir" ? [Ci(2.2, 1.08, .2, "s2")] : [])),
    );
    root.setAttribute("transform", "scale(1.12) translate(0 -.2)");
    return root;
  }
  // land vehicle
  const ch = cfg.chassis || "8x8", is4 = ch === "4x4";
  const L = is4 ? 5.6 : ch === "6x6" ? 6.8 : 7.8, wr = is4 ? .62 : .6, base = .72, roofY = is4 ? 2.6 : 2.34;
  const prof = is4
    ? [[-L / 2, base], [L / 2 - .2, base], [L / 2, base + .35], [L / 2, 1.45], [L / 2 - 1.25, 1.62], [L / 2 - 1.8, 2.55], [-L / 2 + .25, 2.6], [-L / 2, 2.3]]
    : [[-L / 2 + .1, base], [L / 2 - .7, base], [L / 2, 1.35], [L / 2 - .05, 1.55], [L / 2 - .75, 1.9], [-L / 2 + .1, 1.9], [-L / 2, 1.8], [-L / 2, 1.0]];
  const span = is4 ? [L / 2 - 1.05, -L / 2 + 1.1] : ch === "6x6" ? [L / 2 - 1.2, L / 2 - 2.7, -L / 2 + 1.25] : [L / 2 - 1.25, L / 2 - 2.6, -L / 2 + 2.55, -L / 2 + 1.2];
  const chassis = G("chassis", P(prof, "s1"));
  if (!is4) chassis.appendChild(P([[-L / 2 + .25, 1.85], [L / 2 - 1.05, 1.85], [L / 2 - 1.6, 2.28], [-L / 2 + .25, 2.34]], "s1"));
  span.forEach(x => { chassis.append(Ci(x, wr, wr, "s2"), Ci(x, wr, wr * .55, "s1")); });
  root.appendChild(chassis);
  const ar = cfg.armour || "medium"; const arm = G("armour");
  if (ar !== "light") { const cnt = is4 ? 3 : ch === "6x6" ? 4 : 5, len = (L - 1.2) / cnt, h = ar === "medium" ? .5 : .62; for (let i = 0; i < cnt; i++) arm.appendChild(Rc(-L / 2 + .7 + len * i + .04, 1.62 - h / 2, len - .08, h, "s3")); }
  if (ar === "aps") [L / 2 - .6, -L / 2 + .5].forEach(x => arm.appendChild(Rc(x - .15, 2.12 + (is4 ? .3 : 0), .3, .26, "s2")));
  root.appendChild(arm);
  const mi = cfg.mission || "turret", mx = mi === "turret" ? (is4 ? -.8 : .2) : mi === "mast" ? (is4 ? -1.3 : -.8) : mi === "cargo" ? (is4 ? -1.1 : -.4) : (is4 ? -1.1 : -.9);
  const mis = G("mission");
  if (mi === "turret") mis.append(P([[-.75, 0], [.55, 0], [.8, .2], [.6, .55], [-.6, .58], [-.8, .3]].map(p => [p[0] + mx, p[1] + roofY + .14]), "s1"), Rc(mx + .85, roofY + .38, 2.2, .09, "s2"));
  else if (mi === "mast") mis.append(Rc(mx - .12, roofY + .3, .24, 2.8, "s2"), Rc(mx - .04, roofY + 2.75, .08, .7, "s2"), Ci(mx, roofY + 3.65, .2, "s2"));
  else if (mi === "cargo") mis.append(Rc(mx - 1.2, roofY + .1, 2.4, .05, "s2"), Rc(mx - .95, roofY + .15, .7, .4, "s3"), Rc(mx - .05, roofY + .15, .7, .35, "s3"));
  else mis.append(Rc(mx - (is4 ? 1.4 : 1.6), roofY, is4 ? 2.8 : 3.2, .7, "s3"), Rc(mx - .25, roofY + .28, .5, .14, "cr"), Rc(mx - .07, roofY + .1, .14, .5, "cr"));
  root.appendChild(mis);
  const pw = cfg.power || "diesel"; const pwr = G("power");
  if (pw !== "electric") pwr.appendChild(Rc((is4 ? L / 2 - 1.7 : L / 2 - .9) - .07, roofY - .65 + (is4 ? -.4 : .2), .14, .9, "s2"));
  if (pw !== "diesel") pwr.appendChild(Rc(-L / 2 + 1, base + .18, L - 2.2, .04, "ac"));
  if (pw === "hybrid") pwr.appendChild(Rc(-L / 2 + .35, roofY, .9, .35, "s2"));
  root.appendChild(pwr);
  const co = cfg.cooling || "std"; const cool = G("cooling"); const nf = co === "std" ? 5 : 9;
  for (let i = 0; i < nf; i++) cool.appendChild(Rc((is4 ? L / 2 - .5 : L / 2 - .9) - i * .12, is4 ? .9 : 1.78, .03, co === "std" ? .3 : .36, co === "graphene" ? "au" : "s2"));
  root.appendChild(cool);
  const ai = cfg.ai || "manual"; const aig = G("ai");
  if (ai !== "manual") [L / 2 - .26, -L / 2 + .04].forEach(x => aig.appendChild(Rc(x, is4 ? 2.4 : 2.15, .12, .1, "ac")));
  if (ai === "convoy") aig.appendChild(Rc((is4 ? L / 2 - 2.1 : L / 2 - 1.9) - .19, roofY, .38, .2, "s2"));
  root.appendChild(aig);
  return root;
}
