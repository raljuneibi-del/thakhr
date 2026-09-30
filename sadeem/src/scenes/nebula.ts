/* SADEEM Hangar · scene: nebula to star.
   A diffuse field of particles condenses once into the four-point SADEEM mark (the meaning of the name),
   breathes at rest, and parts like an iris when the visitor enters.
   Nebula3D renders it with three.js points; Nebula2D is the canvas fallback when WebGL is unavailable.
   Both take an `anchor()` that says where (in canvas pixels) the star should resolve and how large it is. */
import { loadThree, RM } from "@/core";

export interface NebulaAnchor { x: number; y: number; r: number }
export interface NebulaOptions {
  /** Where the star resolves, in canvas CSS pixels, and its radius. */
  anchor: () => NebulaAnchor;
  /** Start already condensed (reduced motion, or the star has already formed this visit). */
  formed?: boolean;
  /** Called once when the star has fully resolved. */
  onFormed?: () => void;
}
export interface NebulaHandle {
  /** Part the field like an iris; `cb` runs when it is fully open. */
  open(cb?: () => void): void;
  /** Re-measure the anchor (after layout changes). */
  layout(): void;
  stop(): void;
  readonly kind: "webgl" | "2d";
}

const CONDENSE_DELAY = 0.6, CONDENSE_DUR = 3.4;

/** Read a colour token as linear 0..1 RGB (tokens are hex in tokens.css). */
function tokenRGB(name: string, fallback: [number, number, number]): [number, number, number] {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (m) { const n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  } catch { /* ignore */ }
  return fallback;
}

/** A point inside a unit four-point star with concave sides (the SADEEM mark): four tapering arms around a dense core. */
function starPt(): [number, number, number] {
  const k = Math.floor(Math.random() * 4);
  const t = Math.pow(Math.random(), 1.25);                    // distance along the arm, denser toward the core
  const hw = 0.26 * Math.pow(1 - t, 2.1);                     // concave taper
  const u = (Math.random() * 2 - 1) * hw * Math.sqrt(Math.random());
  const z = (Math.random() - 0.5) * 0.06 * (1 - t);
  const [ax, ay] = [[1, 0], [0, 1], [-1, 0], [0, -1]][k];
  return [ax * t - ay * u, ay * t + ax * u, z];
}
/** A point in the diffuse cloud (world units). */
function cloudPt(r: number): [number, number, number] {
  const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), d = Math.pow(Math.random(), 0.45) * r * 2.4;
  return [Math.sin(b) * Math.cos(a) * d * 1.6, Math.sin(b) * Math.sin(a) * d * 0.8, Math.cos(b) * d * 0.6];
}

const VS = /* glsl */`
uniform float uP, uOpen, uT, uPix, uStarS;
attribute vec3 aCloud, aStar;
attribute float aSeed, aSize;
varying float vA, vSeed;
void main() {
  float e = uP * uP * (3.0 - 2.0 * uP);
  vec3 p = mix(aCloud, aStar * uStarS, e);
  p += vec3(sin(uT * .6 + aSeed * 6.283) * .03 * (1.0 - e * .7), cos(uT * .5 + aSeed * 4.0) * .02, sin(uT * .7 + aSeed * 2.0) * .02);
  float o = uOpen * uOpen;
  p += normalize(p + vec3(.0001)) * o * (3.5 + aSeed * 3.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float depth = -mv.z;
  gl_PointSize = aSize * uPix * (9.0 / depth) * (1.0 - e * .3) * (1.0 - o * .6);
  gl_Position = projectionMatrix * mv;
  vA = mix(0.5, 0.3, e) * (1.0 - o) * smoothstep(16.0, 3.0, depth);
  vSeed = aSeed;
}`;
const FS = /* glsl */`
uniform vec3 uGold, uPale;
varying float vA, vSeed;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.05, d) * vA;
  vec3 col = mix(uPale, uGold, vSeed);
  col = mix(col, vec3(1.0, 0.96, 0.86), smoothstep(0.3, 0.0, d) * .45);
  gl_FragColor = vec4(col, a);
}`;

/** WebGL nebula. Throws (rejects) if a WebGL context cannot be created, so the caller can fall back to Nebula2D. */
export async function Nebula3D(canvas: HTMLCanvasElement, opts: NebulaOptions): Promise<NebulaHandle> {
  const T = await loadThree();
  const R = new T.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  const pix = Math.min(devicePixelRatio || 1, 1.75);
  R.setPixelRatio(pix); R.setClearColor(0x000000, 0);
  R.outputColorSpace = T.SRGBColorSpace;

  const S = new T.Scene();
  const CAM = new T.PerspectiveCamera(38, 1, 0.1, 60);
  const CAM_Z = 7.2;
  CAM.position.set(0, 0.15, CAM_Z);

  const N = innerWidth < 700 ? 3200 : 7000;
  const cloud = new Float32Array(N * 3), star = new Float32Array(N * 3), seed = new Float32Array(N), psize = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const c = cloudPt(1.55);
    const s = i < N * 0.9 ? starPt() : cloudPt(0.3);
    cloud.set(c, i * 3); star.set(s, i * 3); seed[i] = Math.random(); psize[i] = 1.1 + Math.pow(Math.random(), 3) * 3.0;
  }
  const G = new T.BufferGeometry();
  G.setAttribute("position", new T.BufferAttribute(cloud.slice(), 3));
  G.setAttribute("aCloud", new T.BufferAttribute(cloud, 3));
  G.setAttribute("aStar", new T.BufferAttribute(star, 3));
  G.setAttribute("aSeed", new T.BufferAttribute(seed, 1));
  G.setAttribute("aSize", new T.BufferAttribute(psize, 1));
  G.boundingSphere = new T.Sphere(new T.Vector3(), 50); // points move in the shader; never cull them

  const gold = tokenRGB("--star", [0.784, 0.643, 0.361]);
  const U = {
    uP: { value: opts.formed || RM ? 1 : 0 }, uOpen: { value: 0 }, uT: { value: 0 }, uPix: { value: pix }, uStarS: { value: 1 },
    uGold: { value: new T.Color(gold[0], gold[1], gold[2]) }, uPale: { value: new T.Color(0.98, 0.9, 0.72) },
  };
  const M = new T.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
  const pts = new T.Points(G, M);
  S.add(pts);

  /* the apron floor and the hangar ribs: faint architecture that gives the field depth as the camera drifts */
  const grid = new T.GridHelper(44, 44, 0x8a6e3a, 0x3e3422);
  grid.position.y = -2.4;
  const gm = grid.material as import("three").LineBasicMaterial;
  gm.transparent = true; gm.opacity = 0.16; gm.depthWrite = false;
  S.add(grid);
  const ribs: Array<import("three").Line> = [];
  for (let k = 0; k < 5; k++) {
    const P: import("three").Vector3[] = [];
    const z = -3 - k * 2.2, w = 5.6 + k * 1.4, h = 4.2 + k * 0.9;
    for (let i = 0; i <= 48; i++) { const a = Math.PI * i / 48; P.push(new T.Vector3(Math.cos(a) * w, Math.sin(a) * h - 2.4, z)); }
    const l = new T.Line(new T.BufferGeometry().setFromPoints(P), new T.LineBasicMaterial({ color: 0xc8a45c, transparent: true, opacity: 0.16 - k * 0.026, depthWrite: false }));
    ribs.push(l); S.add(l);
  }

  let raf = 0, stopped = false, visible = true, opening = false, open = 0, formedFired = !!(opts.formed || RM);
  let onOpened: (() => void) | undefined;
  const t0 = performance.now() - (opts.formed ? 1e5 : 0);
  let mx = 0, my = 0; const target = { x: 0, y: 0 };

  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    R.setSize(w, h, false);
    CAM.aspect = w / h;
    const a = opts.anchor();
    // shift the projection so the world origin (the star) lands on the anchor
    CAM.setViewOffset(w, h, w / 2 - a.x, h / 2 - a.y, w, h);
    CAM.updateProjectionMatrix();
    const pxPerWorld = (h / 2) / (CAM_Z * Math.tan(T.MathUtils.degToRad(CAM.fov / 2)));
    U.uStarS.value = Math.max(0.12, a.r / pxPerWorld);
    if (RM || !loopWanted()) draw(performance.now());
  }
  const loopWanted = () => !RM || opening;

  function draw(now: number) {
    const s = (now - t0) / 1000;
    if (!RM && !opts.formed) U.uP.value = Math.min(1, Math.max(0, (s - CONDENSE_DELAY) / CONDENSE_DUR));
    if (!formedFired && U.uP.value >= 1) { formedFired = true; opts.onFormed?.(); }
    if (opening) {
      open = RM ? 1 : Math.min(1, open + 0.016);
      U.uOpen.value = open;
      CAM.position.z = CAM_Z - open * 4.4;
      ribs.forEach(l => ((l.material as import("three").LineBasicMaterial).opacity *= 0.97));
      if (open >= 1 && onOpened) { const f = onOpened; onOpened = undefined; f(); }
    }
    U.uT.value = RM ? 0 : s;
    mx += (target.x - mx) * 0.04; my += (target.y - my) * 0.04;
    CAM.position.x = mx * 0.9; CAM.position.y = 0.15 - my * 0.5;
    CAM.lookAt(0, 0, 0);
    if (!RM) { pts.scale.setScalar(1 + Math.sin(s * 0.8) * 0.012); pts.rotation.z = Math.sin(s * 0.15) * 0.04; }
    R.render(S, CAM);
  }
  function frame(now: number) {
    if (stopped) return;
    if (visible && loopWanted()) draw(now);
    raf = requestAnimationFrame(frame);
  }

  const ro = new ResizeObserver(layout); ro.observe(canvas);
  const io = new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); }); io.observe(canvas);
  const onMove = (e: PointerEvent) => { target.x = e.clientX / innerWidth - 0.5; target.y = e.clientY / innerHeight - 0.5; };
  if (!RM) addEventListener("pointermove", onMove, { passive: true });
  layout();
  draw(performance.now());
  raf = requestAnimationFrame(frame);

  return {
    kind: "webgl",
    open(cb) { opening = true; onOpened = cb; if (RM) { draw(performance.now()); } },
    layout,
    stop() {
      stopped = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener("pointermove", onMove);
      G.dispose(); M.dispose(); grid.geometry.dispose(); gm.dispose();
      ribs.forEach(l => { l.geometry.dispose(); (l.material as import("three").Material).dispose(); });
      R.dispose();
      try { R.forceContextLoss(); } catch { /* ignore */ }
    },
  };
}

/** 2D canvas fallback: the same story (cloud → star → iris) without WebGL. */
export function Nebula2D(canvas: HTMLCanvasElement, opts: NebulaOptions): NebulaHandle {
  const x = canvas.getContext("2d");
  const noop: NebulaHandle = { kind: "2d", open(cb) { cb?.(); }, layout() { /* */ }, stop() { /* */ } };
  if (!x) return noop;
  const [gr, gg, gb] = tokenRGB("--star", [0.784, 0.643, 0.361]).map(v => Math.round(v * 255));
  let W = 0, H = 0, raf = 0, stopped = false, visible = true;
  let A: NebulaAnchor = { x: 0, y: 0, r: 60 };
  const t0 = performance.now() - (opts.formed ? 1e5 : 0);
  let opening = false, open = 0, onOpened: (() => void) | undefined, formedFired = !!(opts.formed || RM);

  const small = innerWidth < 700;
  const N = small ? 700 : 1400;
  type P = { cx: number; cy: number; sx: number; sy: number; z: number; w: number; dx: number; dy: number };
  const Ps: P[] = [];
  for (let i = 0; i < N; i++) {
    const g = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), 0.6);
    const s = i < N * 0.9 ? starPt() : [Math.cos(g) * 0.25 * Math.random(), Math.sin(g) * 0.25 * Math.random(), 0];
    const ang = Math.atan2(s[1], s[0]) + (Math.random() - 0.5) * 0.4;
    Ps.push({ cx: Math.cos(g) * d * 0.62 + (Math.random() - 0.5) * 0.2, cy: Math.sin(g) * d * 0.5 + (Math.random() - 0.5) * 0.14, sx: s[0], sy: s[1], z: Math.random(), w: Math.random() * Math.PI * 2, dx: Math.cos(ang), dy: Math.sin(ang) });
  }
  function layout() {
    const dpr = Math.min(devicePixelRatio || 1, 1.6);
    W = canvas.clientWidth; H = canvas.clientHeight; if (!W || !H) return;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    x!.setTransform(dpr, 0, 0, dpr, 0, 0);
    A = opts.anchor();
    if (RM) draw(performance.now());
  }
  function draw(now: number) {
    const s = (now - t0) / 1000;
    const c = RM || opts.formed ? 1 : Math.min(1, Math.max(0, (s - CONDENSE_DELAY) / CONDENSE_DUR));
    const e = c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
    if (!formedFired && c >= 1) { formedFired = true; opts.onFormed?.(); }
    if (opening) { open = RM ? 1 : Math.min(1, open + 0.018); if (open >= 1 && onOpened) { const f = onOpened; onOpened = undefined; f(); } }
    const o = open * open;
    x!.clearRect(0, 0, W, H);
    const halo = x!.createRadialGradient(A.x, A.y, 0, A.x, A.y, A.r * 3.2);
    halo.addColorStop(0, `rgba(${gr},${gg},${gb},${(0.1 + 0.12 * e) * (1 - o)})`); halo.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
    x!.fillStyle = halo; x!.fillRect(0, 0, W, H);
    for (const p of Ps) {
      const dr = RM ? 0 : Math.sin(s * 0.3 + p.w) * 0.012 * (1 - e * 0.7);
      let px = A.x + (p.cx * W + dr * W) * (1 - e) + p.sx * A.r * e;
      let py = A.y + (p.cy * H + dr * H * 0.5) * (1 - e) + p.sy * A.r * e;
      if (o) { const push = o * (W * 0.6) * (0.5 + p.z); px += p.dx * push; py += p.dy * push; }
      const tw = e >= 1 && !RM ? 0.75 + 0.25 * Math.sin(s * 1.2 + p.w * 3) : 1;
      const a = (0.28 + 0.6 * p.z) * tw * (1 - o);
      x!.fillStyle = `rgba(${Math.min(255, gr + 30 + p.z * 20) | 0},${Math.min(255, gg + 30 + p.z * 30) | 0},${Math.min(255, gb + 40 + p.z * 50) | 0},${a})`;
      const sz = 0.7 + p.z * 1.5;
      x!.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    }
  }
  function frame(now: number) {
    if (stopped) return;
    if (visible && (!RM || opening)) draw(now);
    raf = requestAnimationFrame(frame);
  }
  const ro = new ResizeObserver(layout); ro.observe(canvas);
  const io = new IntersectionObserver(es => { visible = es.some(en => en.isIntersecting); }); io.observe(canvas);
  layout(); draw(performance.now());
  raf = requestAnimationFrame(frame);
  return {
    kind: "2d",
    open(cb) { opening = true; onOpened = cb; if (RM) draw(performance.now()); },
    layout,
    stop() { stopped = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); },
  };
}

export default Nebula3D;
