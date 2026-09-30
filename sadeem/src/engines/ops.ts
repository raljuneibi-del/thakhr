/* SADEEM Hangar · OPS_CORE mission engine (pure simulation, no DOM). Ported verbatim from the legacy engine.
   Map units: +x east, +z south; 1 unit = 0.5 km. Illustrative training scenario, not operational data. */

export interface Pt { x: number; z: number }
export type Terrain = "road" | "dune" | "wadi" | "plain" | "air";
export interface PathPt extends Pt { s: number; tag: Terrain }
export interface Route { tag?: Terrain; tags?: Terrain[]; pts: Array<Pt | [number, number]> }
export type TaskKey = "deliver" | "search" | "watch";
export type RouteKey = "hwy" | "trk" | "wad";
export interface AssetStats { speed: number; load: number; end: number; dust: number }
export interface Asset {
  id: string; n: string; code: string; type: "g" | "a"; cap?: number; drone?: 1;
  spd: number | Partial<Record<Terrain, number>>; end?: number; watch: number; blind?: number; search: number; alt?: number;
  st: AssetStats; ar: string; en: string;
}
export interface Plan { assign: Record<string, TaskKey | "" | undefined>; route: RouteKey }
export type UnitState = "go" | "stuck" | "down" | "rtb" | "done" | "search" | "station";
export interface Unit { a: Asset; task: TaskKey; path: PathPt[]; d: number; i: number; x: number; z: number; st: UnitState; air: number; tag?: Terrain; flags: Record<string, number> }
export type EventKey = "stormBase" | "stormZone" | "stormSta" | "road" | "stuck" | "down" | "blind" | "rtb" | "arrive" | "onSearch" | "onStation" | "found";
export interface SimEvent { t: number; k: EventKey; u?: string }
export interface SimState {
  t: number; U: Unit[]; events: SimEvent[]; delivered: Array<{ t: number; cap: number; u: string }>;
  searchP: number; found: number | null; cov: number; covT: number[]; done: boolean; flags: Record<string, number>;
}
export type Gap = "watch" | "dune" | "forecast" | "launch";
export interface SimResult {
  deliver: { score: number; n: number; got: number; late: number; lastOn: number; stuck: string[]; road: boolean };
  search: { score: number; n: number; t: number | null; down: string[]; air: boolean };
  watch: { score: number; n: number; blindAfter: number };
  total: number;
  gaps: Gap[];
}

export const KM = 0.5;                       // 1 map unit = 0.5 km
export const BASE: Pt = { x: -120, z: -40 }, VIL: Pt = { x: 130, z: 60 }, ZONE: Pt = { x: 40, z: 30 }, STATION: Pt = { x: 104, z: 38 }, CONVOY: Pt = { x: 52, z: 40 };
export const WIND: Pt = { x: .8, z: .6 };    // shamal: from north-west towards south-east
export const proj = (x: number, z: number) => WIND.x * x + WIND.z * z;
export const S0 = -150, SV = 70, TMAX = 6;   // storm front position (map units) and speed (units/h)
export const stormAt = (t: number) => S0 + SV * t;
export const inStorm = (x: number, z: number, t: number) => proj(x, z) < stormAt(t);
export const stormArrival = (x: number, z: number) => (proj(x, z) - S0) / SV;

/* routes: point lists with terrain tag for the segment that starts at each point */
export const R: Record<"hwy" | "trk" | "wad" | "zon", Route> = {
  hwy: { tag: "road", pts: [BASE, [-95, -72], [-60, -96], [-10, -110], [40, -108], [90, -94], [128, -62], [146, -20], [142, 24], VIL] },
  trk: { tag: "dune", pts: [BASE, [-95, -5], [-60, 35], [-15, 78], [40, 108], [92, 110], [122, 90], VIL] },
  wad: { tags: ["plain", "plain", "plain", "wadi", "wadi", "wadi", "wadi", "wadi"], pts: [BASE, [-80, -30], [-30, -20], [20, -8], [62, 8], [84, 14], STATION, [120, 50], VIL] },
  zon: { tags: ["plain", "plain", "dune", "dune"], pts: [BASE, [-80, -10], [-30, 10], [10, 24], ZONE] },
};
const P = (p: Pt | [number, number]): Pt => Array.isArray(p) ? { x: p[0], z: p[1] } : p;

function dense(route: Route, upto?: number): PathPt[] {
  const pts = route.pts.map(P); const out: PathPt[] = []; let s = 0;
  const n = upto != null ? upto : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1], tag = (route.tags ? route.tags[i] : route.tag)!;
    const L = Math.hypot(b.x - a.x, b.z - a.z), k = Math.max(1, Math.ceil(L / 3));
    for (let j = 0; j < k; j++) {
      const f = j / k; const x = a.x + (b.x - a.x) * f, z = a.z + (b.z - a.z) * f;
      if (out.length) { const p = out[out.length - 1]; s += Math.hypot(x - p.x, z - p.z); }
      out.push({ x, z, s, tag });
    }
  }
  const e = pts[n]; const p = out[out.length - 1]; s += Math.hypot(e.x - p.x, e.z - p.z);
  out.push({ x: e.x, z: e.z, s, tag: out[out.length - 1].tag });
  return out;
}
export function line(a0: Pt | [number, number], b0: Pt | [number, number]): PathPt[] {
  const a = P(a0), b = P(b0); const L = Math.hypot(b.x - a.x, b.z - a.z), k = Math.max(2, Math.ceil(L / 4)), out: PathPt[] = [];
  for (let j = 0; j <= k; j++) { const f = j / k; out.push({ x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, s: L * f, tag: "air" }); }
  return out;
}
export const PATHS: Record<"hwy" | "trk" | "wad" | "zon" | "sta", PathPt[]> = { hwy: dense(R.hwy), trk: dense(R.trk), wad: dense(R.wad), zon: dense(R.zon), sta: dense(R.wad, 6) };
export const pathKm = (k: keyof typeof PATHS) => Math.round(PATHS[k][PATHS[k].length - 1].s * KM);

/* fleet: illustrative indices for a training exercise, not operational data */
export const ASSETS: Asset[] = [
  { id: "W1", n: "LV-8", code: "8×8", type: "g", cap: 3, spd: { road: 60, dune: 38, wadi: 32, plain: 45 }, watch: .5, search: 1 / 1.5, st: { speed: .5, load: 1, end: .9, dust: .9 }, ar: "مركبة قتالية مدرعة", en: "Armoured combat vehicle" },
  { id: "M1", n: "TV-1", code: "4×4", type: "g", cap: 1.5, spd: { road: 95, dune: 30, wadi: 42, plain: 55 }, watch: .4, search: 1 / 1.5, st: { speed: .75, load: .5, end: .8, dust: .55 }, ar: "مركبة تكتيكية متعددة المهام", en: "Multi-role tactical vehicle" },
  { id: "M2", n: "TV-2", code: "4×4", type: "g", cap: 1.5, spd: { road: 95, dune: 30, wadi: 42, plain: 55 }, watch: .4, search: 1 / 1.5, st: { speed: .75, load: .5, end: .8, dust: .55 }, ar: "مركبة تكتيكية متعددة المهام", en: "Multi-role tactical vehicle" },
  { id: "B1", n: "ISR-A", code: "ISR", type: "a", spd: 450, end: 4, watch: 1, blind: .2, search: 1 / .35, alt: 36, st: { speed: 1, load: 0, end: .6, dust: .35 }, ar: "طائرة استطلاع وهجوم خفيف", en: "Light attack and ISR aircraft" },
  { id: "D1", n: "UAV-1", code: "UAV", type: "a", drone: 1, spd: 120, end: 3, watch: 1, search: 1 / .8, alt: 20, st: { speed: .3, load: 0, end: .45, dust: .1 }, ar: "درون استطلاع", en: "Reconnaissance drone" },
  { id: "D2", n: "UAV-2", code: "UAV", type: "a", drone: 1, spd: 120, end: 3, watch: 1, search: 1 / .8, alt: 20, st: { speed: .3, load: 0, end: .45, dust: .1 }, ar: "درون استطلاع", en: "Reconnaissance drone" },
];
export const TASKS: Array<{ k: TaskKey; w: number; need?: number; due?: number }> = [{ k: "deliver", w: .4, need: 2, due: 5 }, { k: "search", w: .3, due: 3 }, { k: "watch", w: .3 }];
export const fits = (a: Asset, task: TaskKey) => task === "deliver" ? a.type === "g" : true;

export function pathFor(a: Asset, task: TaskKey, route?: RouteKey): PathPt[] {
  if (a.type === "g") return task === "deliver" ? PATHS[route || "wad"] : task === "search" ? PATHS.zon : PATHS.sta;
  return line(BASE, task === "search" ? ZONE : STATION);
}

/** Create a simulation for plan = {assign:{assetId:task}, route:"hwy"|"trk"|"wad"}. */
export function createSim(plan: Plan) {
  const U: Unit[] = ASSETS.filter(a => plan.assign[a.id]).map(a => {
    const task = plan.assign[a.id] as TaskKey, path = pathFor(a, task, plan.route);
    return { a, task, path, d: 0, i: 0, x: path[0].x, z: path[0].z, st: "go" as UnitState, air: 0, flags: {} };
  });
  const S: SimState = { t: 0, U, events: [], delivered: [], searchP: 0, found: null, cov: 0, covT: [], done: false, flags: {} };
  const ev = (k: EventKey, o: { u?: string } = {}) => S.events.push({ t: S.t, k, ...o });
  function advance(u: Unit, dist: number) {
    const p = u.path; u.d = Math.min(u.d + dist, p[p.length - 1].s);
    while (u.i < p.length - 2 && p[u.i + 1].s <= u.d) u.i++;
    const a = p[u.i], b = p[u.i + 1] || a; const f = b.s > a.s ? (u.d - a.s) / (b.s - a.s) : 0;
    u.x = a.x + (b.x - a.x) * f; u.z = a.z + (b.z - a.z) * f; u.tag = a.tag;
    return u.d >= p[p.length - 1].s - 1e-6;
  }
  function step(dt: number) {
    if (S.done) return; const t = S.t;
    if (!S.flags.base && inStorm(BASE.x, BASE.z, t)) { S.flags.base = 1; ev("stormBase"); }
    if (!S.flags.zone && inStorm(ZONE.x, ZONE.z, t)) { S.flags.zone = 1; ev("stormZone"); }
    if (!S.flags.sta && inStorm(STATION.x, STATION.z, t)) { S.flags.sta = 1; ev("stormSta"); }
    let cov = 0, srch = 0;
    for (const u of S.U) {
      const a = u.a, storm = inStorm(u.x, u.z, t);
      if (u.st === "stuck" || u.st === "down" || u.st === "rtb" || u.st === "done") continue;
      if (a.type === "a") {
        u.air += dt;
        if (a.drone && storm) { u.st = "down"; ev("down", { u: a.n }); continue; }
        if (!a.drone && storm && !u.flags.blind) { u.flags.blind = 1; ev("blind", { u: a.n }); }
        if (u.air >= a.end!) { u.st = "rtb"; ev("rtb", { u: a.n }); continue; }
      }
      if (u.st === "go") {
        let v: number;
        if (a.type === "a") v = a.spd as number;
        else {
          const spd = a.spd as Record<string, number>;
          const base = spd[u.tag || "plain"] || spd.plain; let f = 1;
          if (storm) {
            if (u.tag === "road") { f = .3; if (!S.flags.road) { S.flags.road = 1; ev("road"); } }
            else if (u.tag === "dune") { if (a.id !== "W1") { u.st = "stuck"; ev("stuck", { u: a.n }); continue; } f = .5; }
            else if (u.tag === "wadi") f = .8; else f = .5;
          }
          v = base * f;
        }
        const arrived = advance(u, v * 2 * dt);
        if (arrived) {
          if (u.task === "deliver") { u.st = "done"; S.delivered.push({ t: t + dt, cap: a.cap!, u: a.n }); ev("arrive", { u: a.n }); }
          else if (u.task === "search") { u.st = "search"; ev("onSearch", { u: a.n }); }
          else { u.st = "station"; ev("onStation", { u: a.n }); }
        }
      } else if (u.st === "search") {
        if (S.found != null) { u.st = "done"; continue; }
        srch += a.type === "a" ? (storm ? 0 : a.search) : (storm ? a.search * .5 : a.search);
      } else if (u.st === "station") {
        cov = Math.max(cov, a.type === "a" ? (storm ? (a.blind || 0) : a.watch) : a.watch);
      }
    }
    if (srch > 0 && S.found == null) { S.searchP += srch * dt; if (S.searchP >= 1) { S.found = t + dt; ev("found"); } }
    S.cov += cov * dt; S.covT.push(cov);
    S.t = t + dt; if (S.t >= TMAX - 1e-9) { S.t = TMAX; S.done = true; }
  }
  function result(): SimResult {
    const del = S.U.filter(u => u.task === "deliver"), se = S.U.filter(u => u.task === "search"), wa = S.U.filter(u => u.task === "watch");
    let got = 0, late = 0;
    for (const d of S.delivered) { if (d.t <= 5) got += d.cap; else late += d.cap * .5; }
    const lastOn = S.delivered.filter(d => d.t <= 5).reduce((m, d) => Math.max(m, d.t), 0);
    const deliver = { score: Math.round(Math.min(1, (got + late) / 2) * 100), n: del.length, got, late, lastOn, stuck: del.filter(u => u.st === "stuck").map(u => u.a.n), road: !!S.flags.road && del.some(() => plan.route === "hwy") };
    const f = S.found;
    const search = { score: f == null ? 0 : f <= 3 ? 100 : f <= 4.5 ? 60 : 30, n: se.length, t: f, down: se.filter(u => u.st === "down").map(u => u.a.n), air: se.some(u => u.a.type === "a") };
    const watch = { score: Math.round(S.cov / TMAX * 100), n: wa.length, blindAfter: stormArrival(STATION.x, STATION.z) };
    const total = Math.round(deliver.score * .4 + search.score * .3 + watch.score * .3);
    // capability gaps, most important first
    const G: Gap[] = [];
    if (watch.score < 85) G.push("watch");
    if (deliver.stuck.length) G.push("dune");
    if (deliver.road && deliver.score < 100) G.push("forecast");
    if (search.score < 100 && !search.air && search.n) G.push("launch");
    if (search.down.length && !G.includes("watch")) G.push("watch");
    return { deliver, search, watch, total, gaps: G.slice(0, 2) };
  }
  return { S, step, result };
}
export function simulate(plan: Plan, dt = .005): SimResult { const s = createSim(plan); while (!s.S.done) s.step(dt); return s.result(); }

export const OPS_CORE = { KM, BASE, VIL, ZONE, STATION, CONVOY, WIND, proj, S0, SV, TMAX, stormAt, inStorm, stormArrival, R, PATHS, pathKm, ASSETS, TASKS, fits, pathFor, line, createSim, simulate };
export default OPS_CORE;
