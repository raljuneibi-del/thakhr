/* SADEEM Hangar · Zone L2 · Drone Lab.
   A design table: ten engineering decisions on one side, the living airframe in the middle, the numbers beside it.
   The airframe is a keyed SVG scene; geometry is written as CSS properties so every change morphs instead of jumping.
   All figures are illustrative training values (engine: src/engines/drone.ts). */
import { $, $$, esc, t, tx, num, go, register, ai, toast, head, lang, DB, save, ctx, uid, type Bi } from "@/core";
import { FX } from "@/shell/fx";
import { DRONE as D, type DroneConfig, type DroneResult, type FitResult, type Binding, type GroupKey, type Mission } from "@/engines/drone";

let cfg: DroneConfig = { ...D.DEF };
let mission: Mission = D.MISSIONS[0];

const NS = "http://www.w3.org/2000/svg";
const CX = 300, CY = 212;
const L = (ar: string, en: string): Bi => ({ ar, en });
const minU = () => (lang() === "ar" ? "د" : "min");

/* ---------- endurance ring: the ring shrinks with endurance (minutes → radius) ---------- */
const ringR = (min: number) => 104 + 92 * Math.min(1, Math.max(0, min) / 360);

/* ---------- minimal keyed SVG reconciler (attributes + CSS geometry, so changes transition) ---------- */
interface VN { k: string; t: string; a?: Record<string, string | number>; s?: Record<string, string>; c?: VN[]; txt?: string }
function patch(parent: Element, list: VN[]) {
  const want = new Set(list.map(v => v.k));
  const have = new Map<string, Element>();
  for (const el of Array.from(parent.children)) {
    const k = el.getAttribute("data-k"); if (!k) continue;
    if (want.has(k)) have.set(k, el); else el.remove();
  }
  list.forEach((v, i) => {
    let el = have.get(v.k);
    if (el && el.localName !== v.t) { el.remove(); el = undefined; }
    if (!el) { el = document.createElementNS(NS, v.t); el.setAttribute("data-k", v.k); }
    const at = parent.children[i];
    if (at !== el) parent.insertBefore(el, at || null);
    if (v.a) for (const n in v.a) { const val = String(v.a[n]); if (el.getAttribute(n) !== val) el.setAttribute(n, val); }
    if (v.s) for (const n in v.s) (el as SVGElement).style.setProperty(n, v.s[n]);
    if (v.txt !== undefined && el.textContent !== v.txt) el.textContent = v.txt;
    if (v.c) patch(el, v.c);
  });
}
const px = (n: number) => `${+n.toFixed(2)}px`;
const tr = (x: number, y: number, extra = "") => `translate(${px(x)}, ${px(y)})${extra}`;
/** geometry as both attribute (fallback) and CSS property (transitions where supported). */
function geo(a: Record<string, number>) {
  const out = { a: {} as Record<string, number>, s: {} as Record<string, string> };
  for (const k in a) { out.a[k] = +a[k].toFixed(2); out.s[k] = px(a[k]); }
  return out;
}
const rect = (k: string, cls: string, x: number, y: number, w: number, h: number, rx = 0): VN => { const g = geo({ x, y, width: Math.max(0, w), height: Math.max(0, h), rx }); return { k, t: "rect", a: { class: cls, ...g.a }, s: g.s }; };
const circ = (k: string, cls: string, r: number): VN => { const g = geo({ r }); return { k, t: "circle", a: { class: cls, cx: 0, cy: 0, ...g.a }, s: g.s }; };
const grp = (k: string, x: number, y: number, c: VN[], cls = "p", extra = ""): VN => ({ k, t: "g", a: { class: cls }, s: { transform: tr(x, y, extra) }, c });
const path = (k: string, cls: string, d: string): VN => ({ k, t: "path", a: { class: cls, d }, s: { d: `path("${d}")` } });

/* ---------- the airframe ---------- */
function scene(r: DroneResult): VN[] {
  const vt = r.vt, hexa = cfg.airframe === "hexa";
  const bodyL = 60 + r.batt * 16, bodyW = 34 + (r.o.autonomy.m || 0) * 40;
  const thrust = r.o.propulsion.thrust!;
  const out: VN[] = [];
  const R = ringR(r.end);
  const req = mission.req.end || 0;

  // endurance ring (gold), its glow, and the mission's required ring (dashed)
  out.push(grp("glow", CX, CY, [circ("c", "glow", R + 26)]));
  if (req) out.push(grp("reqRing", CX, CY, [circ("c", "reqRing", ringR(req)), { k: "l", t: "text", a: { class: "rlab req", y: 0, "text-anchor": "middle" }, s: { transform: tr(0, ringR(req) + 16) }, txt: `${tx(L("المطلوب", "REQUIRED"))} · ${req} ${minU()}` }]));
  out.push(grp("ring", CX, CY, [circ("c", "ring", R), { k: "l", t: "text", a: { class: "rlab", "text-anchor": "middle", id: "dRingLab" }, s: { transform: tr(0, -R - 10) }, txt: `${tx(L("حلقة التحمل", "ENDURANCE RING"))} · ${r.end} ${minU()}` }]));

  // arms + rotors (multirotor) · booms + lift rotors (VTOL). Keys are shared so a frame change morphs rotor positions.
  const n = vt ? 4 : hexa ? 6 : 4, arm = hexa ? 95 : 105;
  const vtPos: Array<[number, number]> = [[95, 58], [-95, 58], [-95, -58], [95, -58]];
  const rr = vt ? 16 : 18 + thrust * 8;
  const spin = `${+(1.4 / thrust).toFixed(2)}s`, blade = `${+(0.5 / thrust).toFixed(2)}s`;
  if (vt) {
    out.push(rect("boomL", "shell", CX - 95 - 3, CY - 58, 6, 116, 3), rect("boomR", "shell", CX + 95 - 3, CY - 58, 6, 116, 3));
  } else {
    for (let i = 0; i < n; i++) {
      const deg = (i / n) * 360 + (hexa ? 0 : 45);
      // arm drawn along +x then rotated; the 0.7 vertical squash gives the table its slight perspective
      out.push({ k: "arm" + i, t: "g", a: { class: "p" }, s: { transform: `translate(${CX}px, ${CY}px) scale(1, .7) rotate(${deg}deg)` }, c: [rect("r", "shell arm", 0, -(3 + (r.pay > 1 ? 2 : 0)), arm, 6 + (r.pay > 1 ? 4 : 0), 3)] });
    }
  }
  for (let i = 0; i < n; i++) {
    let x: number, y: number;
    if (vt) [x, y] = [CX + vtPos[i][0], CY + vtPos[i][1]];
    else { const a = ((i / n) * 360 + (hexa ? 0 : 45)) * Math.PI / 180; x = CX + Math.cos(a) * arm; y = CY + Math.sin(a) * arm * .7; }
    out.push({ k: "rot" + i, t: "g", a: { class: "p rotor" }, s: { transform: tr(x, y), "--spin": spin, "--blade": vt ? "1s" : blade }, c: [
      circ("disc", "disc", rr),
      { k: "b", t: "g", a: { class: "blade" }, c: [path("l", "bl", `M${-rr} 0 L${rr} 0`)] },
      circ("hub", "hub", 5),
    ] });
  }

  if (vt) {
    const wl = cfg.wings === "long" ? 190 : cfg.wings === "delta" ? 120 : 150, wc = cfg.wings === "delta" ? 70 : 26;
    out.push(path("wing", "shell wing", `M${CX - wl} ${CY - 4} L${CX - 20} ${CY - wc / 2} L${CX + 20} ${CY - wc / 2} L${CX + wl} ${CY - 4} L${CX + wl} ${CY + 6} L${CX + 20} ${CY + wc / 2} L${CX - 20} ${CY + wc / 2} L${CX - wl} ${CY + 6} Z`));
    out.push(path("tail", "shell wing", `M${CX - 6} ${CY + bodyL / 2 + 18} l-22 12 h56 l-22 -12 z`));
    const pr = 10 + thrust * 3;
    out.push({ k: "pusher", t: "g", a: { class: "p rotor" }, s: { transform: tr(CX, CY - bodyL / 2 - 6), "--spin": ".4s", "--blade": ".4s" }, c: [
      circ("disc", "disc", pr), { k: "b", t: "g", a: { class: "blade" }, c: [path("l", "bl", `M${-pr} 0 L${pr} 0`)] }] });
  }

  // fuselage / body
  out.push(rect("body", "shell body", CX - bodyW / 2, CY - bodyL / 2, bodyW, bodyL, vt ? bodyW / 2 : 8));
  if (cfg.materials === "sealed") out.push(rect("seal", "seal", CX - bodyW / 2 + 3, CY - bodyL / 2 + 3, bodyW - 6, bodyL - 6, vt ? bodyW / 2 - 3 : 6));

  // energy: battery pack or fuel cell
  const bh = Math.min(bodyL - 14, 10 + r.batt * 10);
  out.push(rect("cell", cfg.energy === "h2" ? "cell h2" : "cell", CX - bodyW / 2 + 6, CY - bh / 2, bodyW - 12, bh, 3));
  out.push({ k: "cellT", t: "text", a: { class: cfg.energy === "h2" ? "cellT h2" : "cellT", x: CX, y: CY + 3, "text-anchor": "middle" }, txt: cfg.energy === "h2" ? "H₂" : `${r.o.energy.wh} Wh` });

  // camera turret
  const cam = r.o.cameras.k, cy2 = CY + bodyL / 2 + (cam === "gimbal" ? 16 : 9);
  out.push(grp("cam", CX, cy2, [circ("lens", "lens", cam === "gimbal" ? 13 : cam === "eoir" ? 9 : 6), ...(cam !== "eo" ? [{ k: "ir", t: "circle", a: { class: "ir", cx: 5, cy: 0, r: 3 } } as VN] : [])]));

  // sensors
  if (cfg.sensors === "lidar") out.push(grp("lidar", CX, CY - bodyL / 2 - 9, [rect("b", "sensorBox", -8, -5, 16, 10), { k: "e", t: "circle", a: { class: "emit", r: 3, cx: 0, cy: 0 } }]));
  if (cfg.sensors === "nav") out.push(grp("nav", CX, CY - bodyL / 2 + 8, [{ k: "a", t: "circle", a: { class: "emit", r: 4, cx: -bodyW / 2 - 2, cy: 0 } }, { k: "b", t: "circle", a: { class: "emit", r: 4, cx: bodyW / 2 + 2, cy: 0 } }]));

  // comms
  if (cfg.comms === "sat") out.push(grp("comms", CX + bodyW / 2 + 4, CY - 18, [rect("dish", "satBox", 0, 0, 22, 14, 2), path("m", "wire", "M11 0 v-10")]));
  else { const m = cfg.comms === "mesh"; out.push(grp("comms", CX + bodyW / 2, CY - bodyL / 2 + 6, [path("m", "wire", `M0 0 l${m ? 14 : 9} -${m ? 22 : 14}`)])); }

  // payload
  if (cfg.payload.startsWith("pod")) {
    const big = cfg.payload === "pod5", pw = big ? 46 : 30;
    out.push(grp("pod", CX, CY + bodyL / 2, [path("s1", "wire", "M-8 0 v24"), path("s2", "wire", "M8 0 v24"), rect("box", "pod", -pw / 2, 24, pw, big ? 30 : 20, 4)]));
  }
  if (cfg.payload === "relay") out.push(grp("relay", CX, CY + bodyL / 2 + 22, [rect("box", "relayBox", -14, 0, 28, 12, 2), path("a", "emitLine", "M0 0 v-8 m-6 0 h12")]));
  return out;
}

/* ---------- metrics (value formatters keep engineering digits Western, as a readout) ---------- */
type MKey = "mass" | "margin" | "power" | "end" | "speed" | "rangeKm" | "wind" | "auto" | "cost" | "maint";
const METRICS: Array<{ k: MKey; l: Bi; u: Bi | string; v: (r: DroneResult) => number; f: (n: number) => string }> = [
  { k: "mass", l: L("الكتلة", "Mass"), u: "kg", v: r => r.mass, f: n => n.toFixed(2) },
  { k: "margin", l: L("هامش الرفع", "Lift margin"), u: "kg", v: r => r.margin, f: n => n.toFixed(2) },
  { k: "power", l: L("الاستهلاك", "Power draw"), u: "W", v: r => r.power, f: n => String(Math.round(n)) },
  { k: "end", l: L("زمن التحليق", "Endurance"), u: L("د", "min"), v: r => r.end, f: n => String(Math.round(n)) },
  { k: "speed", l: L("سرعة الطيران", "Cruise"), u: "m/s", v: r => r.speed, f: n => n.toFixed(1) },
  { k: "rangeKm", l: L("نصف قطر المدى", "Radius"), u: "km", v: r => r.rangeKm, f: n => String(Math.round(n)) },
  { k: "wind", l: L("مقاومة الرياح", "Wind tolerance"), u: "%", v: r => r.wind * 100, f: n => String(Math.round(n)) },
  { k: "auto", l: L("الاستقلالية", "Autonomy"), u: "%", v: r => r.auto * 100, f: n => String(Math.round(n)) },
  { k: "cost", l: L("التكلفة", "Unit cost"), u: "AED", v: r => r.cost / 1000, f: n => Math.round(n) + "k" },
  { k: "maint", l: L("سهولة الصيانة", "Maintainability"), u: "%", v: r => r.maint * 100, f: n => String(Math.round(n)) },
];

/* ---------- trade-off wheel axes ---------- */
const AXES: Bi[] = [L("التحمل", "Endurance"), L("الرياح", "Wind"), L("الاتصال", "Comms"), L("الاستقلالية", "Autonomy"), L("الحمولة", "Payload"), L("الاقتصاد", "Economy")];
const WX = 160, WY = 136, WR = 92;
const wheelCur = (r: DroneResult) => [Math.min(1, r.end / 360), r.wind, Math.min(1, r.commsKm / 60), r.auto, Math.min(1, Math.max(0, r.margin) / 4), Math.max(0, 1 - r.cost / 90000)];
const wheelReq = (m: Mission) => [(m.req.end || 0) / 360, m.req.wind || 0, Math.min(1, (m.req.range || 0) / 60), m.req.auto || 0, Math.min(1, (m.req.payload || 0) / 4), .35];
const wpt = (i: number, v: number) => { const a = -Math.PI / 2 + i / AXES.length * Math.PI * 2; return [WX + Math.cos(a) * WR * v, WY + Math.sin(a) * WR * v]; };
const wpoly = (vals: number[]) => vals.map((v, i) => wpt(i, Math.max(.03, v)).map(n => n.toFixed(1)).join(",")).join(" ");

/** split the engine's binding sentence into the constraint and the lever that releases it */
function splitBinding(b: Binding): { c: string; lever: string } {
  const s = tx(b).replace(/^(القيد الحاكم|Binding constraint):\s*/, "");
  const i = s.indexOf(". ");
  return i < 0 ? { c: s, lever: "" } : { c: s.slice(0, i), lever: s.slice(i + 2) };
}

let tw: { cancel(): void } | null = null;
let shown: Record<string, number> | null = null;
let shownWheel: { cur: number[]; req: number[] } | null = null;

register("drones", {
  mount(el) {
    const ar = lang() === "ar";
    shown = null; shownWheel = null;
    head(el, L("مختبر الدرونات · L2", "Drone Lab · L2"), L("الدرون يتغيّر معك، والمفاضلات تظهر أمامك", "The airframe changes as you choose, and the trade-offs show"),
      L("عشرة قرارات هندسية تحكم الوزن والطاقة وزمن التحليق والمدى والتكلفة. لا يوجد خيار مجاني: المحرك يقرأ القيد الحاكم ويسمّي المعامل الذي يحرّره.", "Ten engineering decisions govern mass, power, endurance, range and cost. No choice is free: the engine names the binding constraint and the parameter that releases it."));

    const unit = (u: Bi | string) => esc(typeof u === "string" ? u : tx(u));
    el.insertAdjacentHTML("beforeend", `
    <div class="wrap dMission">
      <div class="dmHead"><span class="kk" id="dmLab">${esc(tx(L("ملف المهمة", "Mission profile")))}</span><p class="dmDesc" id="dmD" aria-live="polite"></p></div>
      <div class="dmSet" role="group" aria-labelledby="dmLab">${D.MISSIONS.map((m, i) => `<button type="button" data-m="${m.k}" aria-pressed="false"><i class="mono">0${i + 1}</i><span>${esc(tx(m.n))}</span></button>`).join("")}</div>
    </div>
    <div class="wrap droneGrid">
      <section class="bench night-surface" aria-label="${esc(tx(L("طاولة العمل", "Workbench")))}">
        <div class="hud"><span><b>${esc(tx(L("طاولة العمل", "WORKBENCH")))}</b> · <span id="hudF"></span></span><span class="hudR mono" id="hudN" dir="ltr"></span></div>
        <svg id="drone" viewBox="0 0 600 440" role="img" aria-labelledby="droneDesc">
          <title id="droneDesc"></title>
          <defs><radialGradient id="dGlow" cx="50%" cy="50%"><stop offset="0" class="g0"/><stop offset="1" class="g1"/></radialGradient></defs>
          <g class="cross" aria-hidden="true"><path d="M${CX} 12 V428 M12 ${CY} H588"/></g>
          <g id="dScene"></g>
        </svg>
        <div class="gauge">
          <div class="gLab mono"><span>MASS</span><span id="gMass" dir="ltr"></span></div>
          <div class="gBar"><i id="gFill"></i></div>
        </div>
        <div class="bind" id="bind" aria-live="polite"></div>
      </section>
      <div class="dStrip" id="dStrip" aria-hidden="true"></div>
      <section class="panel params" id="params" aria-labelledby="pTitle">
        <div class="ph"><h3 id="pTitle">${esc(tx(L("قرارات التصميم", "Design decisions")))}</h3></div>
        ${D.G.map(g => `<div class="pgroup" data-g="${g.k}" role="group" aria-labelledby="pg-${g.k}">
          <div class="pgH"><h4 id="pg-${g.k}">${esc(tx(g.n))}</h4><span class="pgD" id="pd-${g.k}"></span></div>
          <div class="opts">${g.o.map(o => `<button type="button" data-g="${g.k}" data-o="${o.k}" aria-pressed="false" title="${esc(tx(o.d))}">${esc(tx(o.n))}</button>`).join("")}</div>
        </div>`).join("")}
      </section>
      <section class="panel read" aria-labelledby="mxTitle">
        <div class="ph"><h3 id="mxTitle">${esc(tx(L("الأرقام", "Numbers")))}</h3><small>${esc(t("training"))}</small></div>
        <div class="metrics" id="mx">${METRICS.map(m => `<div class="metric" data-m="${m.k}"><span>${esc(tx(m.l))}</span><b><output class="mono">–</output><small>${unit(m.u)}</small></b></div>`).join("")}</div>
        <div class="acts"><button class="btn sm" type="button" id="saveCfg">${esc(tx(L("احفظ التشكيلة", "Save configuration")))}</button><button class="btn ghost sm" type="button" id="toIdea">${esc(t("toIdea"))}<svg class="i dir" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M12 6l4 4-4 4"/></svg></button></div>
      </section>
      <div class="ana">
        <section class="panel fitP" aria-labelledby="fitTitle">
          <div class="ph"><h3 id="fitTitle">${esc(tx(L("ملاءمة المهمة", "Mission fit")))}</h3><span class="score"><b class="mono" id="fitN">0</b><small class="mono">/100</small></span></div>
          <div class="bar gold fitBar"><i id="fitBar" style="width:0"></i></div>
          <ul class="fitL" id="fit"></ul>
        </section>
        <section class="panel wheelP" aria-labelledby="whTitle">
          <div class="ph"><h3 id="whTitle">${esc(tx(L("عجلة المفاضلات", "Trade-off wheel")))}</h3><small class="mute">${esc(tx(L("المتقطع = المطلوب", "dashed = required")))}</small></div>
          <svg class="wheel" id="wheel" viewBox="0 0 320 290" role="img" aria-labelledby="whDesc">
            <title id="whDesc"></title>
            ${[.25, .5, .75, 1].map(k => `<polygon class="ax" points="${AXES.map((_, i) => wpt(i, k).map(n => n.toFixed(1)).join(",")).join(" ")}"/>`).join("")}
            ${AXES.map((a, i) => { const [x, y] = wpt(i, 1), [lx, ly] = wpt(i, 1.2); return `<line class="ax" x1="${WX}" y1="${WY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/><text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle">${esc(tx(a))}</text>`; }).join("")}
            <polygon class="req" id="wReq" points=""/>
            <polygon class="cur" id="wCur" points=""/>
            <text class="wFit" x="${WX}" y="282" text-anchor="middle" id="wFit"></text>
          </svg>
        </section>
      </div>
    </div>`);

    const root = el;
    const dmD = $("#dmD", root), sceneG = $("#dScene", root);

    $$<HTMLButtonElement>(".dmSet button", root).forEach(b => b.addEventListener("click", () => {
      mission = D.MISSIONS.find(m => m.k === b.dataset.m) || D.MISSIONS[0]; render(); ai.set({ object: null });
    }));
    $$<HTMLButtonElement>("#params .opts button", root).forEach(b => b.addEventListener("click", () => {
      cfg[b.dataset.g as GroupKey] = b.dataset.o!; render(); ai.set({ object: b.dataset.g });
    }));
    $("#saveCfg", root).addEventListener("click", () => {
      DB.drones.unshift({ id: "D-" + uid(), cfg: { ...cfg }, mission: mission.k, at: Date.now() }); save();
      toast(L("حُفظت في نظام سديم", "Saved to the SADEEM OS"));
    });
    $("#toIdea", root).addEventListener("click", () => {
      const r = D.compute(cfg), b = D.binding(r, mission);
      ctx.state = { draft: {
        t: { ar: `تشكيلة درون لمهمة «${tx(mission.n)}»`, en: `Drone configuration for '${tx(mission.n)}'` },
        d: tx({ ar: `من مختبر الدرونات: ${Object.values(cfg).join("/")} — كتلة ${r.mass} كجم، ${r.end} دقيقة، ${r.rangeKm} كم، تكلفة ${r.cost.toLocaleString()} درهم. ${b.ar}`, en: `From the Drone Lab: ${Object.values(cfg).join("/")} — ${r.mass} kg, ${r.end} min, ${r.rangeKm} km, cost AED ${r.cost.toLocaleString()}. ${b.en}` }),
        area: "air", ch: mission.k === "storm" ? "N-02" : "" } };
      void go("lab");
    });

    render();

    function render() {
      const r = D.compute(cfg), ft = D.fit(r, mission), b = D.binding(r, mission);

      // mission selector
      $$<HTMLButtonElement>(".dmSet button", root).forEach(x => x.setAttribute("aria-pressed", String(x.dataset.m === mission.k)));
      dmD.textContent = tx(mission.d);

      // decisions (built once; state updated in place so keyboard focus survives)
      for (const g of D.G) {
        const box = $(`.pgroup[data-g="${g.k}"]`, root);
        const hide = !!g.onlyVtol && cfg.airframe !== "vtol";
        box.hidden = hide;
        $(`#pd-${g.k}`, root).textContent = tx(r.o[g.k].d);
        $$<HTMLButtonElement>(".opts button", box).forEach(x => x.setAttribute("aria-pressed", String(cfg[g.k] === x.dataset.o)));
      }

      // airframe
      $("#drone", root).setAttribute("class", "m-" + cfg.materials);
      patch(sceneG, scene(r));
      $("#droneDesc", root).textContent = `${tx(r.o.airframe.n)} · ${r.mass} kg · ${r.power} W · ${r.end} min`;
      $("#hudF", root).textContent = r.vt ? "VTOL" : cfg.airframe.toUpperCase();

      // mass gauge
      const pct = Math.min(100, r.mass / r.maxMass * 100);
      const gFill = $("#gFill", root); gFill.style.width = pct + "%"; gFill.classList.toggle("over", r.margin < 0);
      $("#gMass", root).textContent = `${r.mass} / ${r.maxMass} kg`;

      // binding constraint + the lever that releases it
      const sb = splitBinding(b), met = !b.k;
      $("#bind", root).className = "bind" + (met ? " met" : "");
      $("#bind", root).innerHTML = `<span class="bLab">${esc(tx(L("القيد الحاكم", "Binding constraint")))}</span>
        <p class="bC">${esc(sb.c)}</p>${sb.lever ? `<p class="bL">${met ? "" : `<span>${esc(tx(L("الرافعة", "Lever")))}</span>`}${esc(sb.lever)}</p>` : ""}`;

      // metric states
      const endFit = ft.f.find(x => x.k === "end");
      const state: Partial<Record<MKey, string>> = {
        mass: r.margin < 0 ? "bad" : "",
        margin: r.margin < 0 ? "bad" : r.margin < .5 ? "" : "ok",
        end: endFit ? (endFit.pass ? "ok" : "bad") : "",
      };
      for (const m of METRICS) { const box = $(`.metric[data-m="${m.k}"]`, root); box.classList.toggle("bad", state[m.k] === "bad"); box.classList.toggle("ok", state[m.k] === "ok"); }

      // mission fit list
      const bk = b.k;
      $("#fit", root).innerHTML = ft.f.map(x => `<li class="${x.pass ? "pass" : "miss"}${x.k === bk ? " binding" : ""}"><span class="tag ${x.pass ? "good" : "crit"}" aria-hidden="true">${x.pass ? "✓" : "✕"}</span><span class="fT">${esc(ar ? x.ar : x.en)}</span><span class="sr">${esc(x.pass ? tx(L("محقق", "met")) : tx(L("غير محقق", "not met")))}</span></li>`).join("");
      ($("#fitBar", root) as HTMLElement).style.width = ft.score + "%";
      $("#whDesc", root).textContent = `${tx(L("ملاءمة المهمة", "Mission fit"))}: ${ft.score}/100`;

      animateNumbers(r, ft);
      ai.set({ state: { r, ft, b } });
    }

    function animateNumbers(r: DroneResult, ft: FitResult) {
      const target: Record<string, number> = { score: ft.score };
      for (const m of METRICS) target[m.k] = m.v(r);
      const wT = { cur: wheelCur(r), req: wheelReq(mission) };
      const from = shown ? { ...shown } : { ...target };
      const wFrom = shownWheel ? { cur: [...shownWheel.cur], req: [...shownWheel.req] } : { cur: wT.cur.map(() => 0), req: wT.req.map(() => 0) };
      const outs = new Map(METRICS.map(m => [m.k, $(`.metric[data-m="${m.k}"] output`, root)]));
      const hudN = $("#hudN", root), strip = $("#dStrip", root), fitN = $("#fitN", root), wFit = $("#wFit", root);
      const wCur = $("#wCur", root), wReq = $("#wReq", root), ringLab = $("#dRingLab", root);
      const fitWord = tx(L("ملاءمة", "fit"));
      const endU = ar ? "د" : "min";
      tw?.cancel();
      tw = FX.tween(620, e => {
        const v: Record<string, number> = {};
        for (const k in target) v[k] = from[k] + (target[k] - from[k]) * e;
        shown = v;
        shownWheel = { cur: wT.cur.map((x, i) => wFrom.cur[i] + (x - wFrom.cur[i]) * e), req: wT.req.map((x, i) => wFrom.req[i] + (x - wFrom.req[i]) * e) };
        for (const m of METRICS) outs.get(m.k)!.textContent = m.f(e === 1 ? target[m.k] : v[m.k]);
        const f = (k: MKey) => METRICS.find(m => m.k === k)!.f(e === 1 ? target[k] : v[k]);
        hudN.textContent = `${f("mass")} kg · ${f("power")} W`;
        const sc = String(Math.round(e === 1 ? target.score : v.score));
        fitN.textContent = sc;
        wFit.textContent = `${fitWord} ${sc}/100`;
        strip.innerHTML = `<span dir="ltr"><b>${f("mass")}</b> kg</span><span dir="ltr"><b>${f("power")}</b> W</span><span dir="ltr" class="${$(".metric[data-m='end']", root).className.includes("bad") ? "bad" : ""}"><b>${f("end")}</b> ${endU}</span><span>${esc(fitWord)} <b dir="ltr">${sc}/100</b></span>`;
        if (ringLab) ringLab.textContent = `${tx(L("حلقة التحمل", "ENDURANCE RING"))} · ${f("end")} ${endU}`;
        wCur.setAttribute("points", wpoly(shownWheel.cur));
        wReq.setAttribute("points", wpoly(shownWheel.req));
      });
    }
  },

  unmount() { tw?.cancel(); tw = null; shown = null; shownWheel = null; },

  insight(c) {
    const st = c.state || {};
    const r: DroneResult = st.r || D.compute(cfg), b: Binding = st.b || D.binding(r, mission);
    if (c.object) {
      const g = D.G.find(x => x.k === c.object);
      if (g) {
        const o = r.o[g.k];
        return { role: L("مستشار التصميم", "Design advisor"), lines: [
          { ar: `${tx(g.n)} → ${tx(o.n)}: ${tx(o.d)}. الكتلة الآن ${num(r.mass)} كجم والاستهلاك ${num(r.power)} واط، فيصبح زمن التحليق ${num(r.end)} دقيقة.`, en: `${tx(g.n)} → ${tx(o.n)}: ${tx(o.d)}. Mass is now ${r.mass} kg and draw ${r.power} W, so endurance is ${r.end} min.` }, b] };
      }
    }
    const alt = r.vt
      ? L("بديل: هيكل سداسي مع خلية وقود يعطي زمناً طويلاً مع تحليق ثابت.", "Alternative: a hexa frame with a fuel cell gives long endurance with hover capability.")
      : L("بديل: هيكل VTOL يخفض الاستهلاك إلى أقل من النصف لنفس الكتلة.", "Alternative: a VTOL frame cuts draw to less than half for the same mass.");
    return { role: L("مستشار التصميم", "Design advisor"), lines: [b, alt,
      { ar: `تكلفة الوحدة ${r.cost.toLocaleString()} درهم؛ كل ١٠٠٠ Wh إضافية تكلف وزناً قبل أن تكلف مالاً.`, en: `Unit cost AED ${r.cost.toLocaleString()}; every extra 1,000 Wh costs mass before it costs money.` }],
      actions: [{ label: t("toIdea"), run: () => { const x = document.getElementById("toIdea"); if (x) x.click(); } }] };
  },
});
