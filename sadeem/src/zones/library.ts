/* SADEEM Hangar · Zone 06 Innovation Library + Zone 07 Technology Radar.
   Library: a lit archive wall arranged by theme, not folder, with search and discovery (related items, radar links).
   Radar: technologies on four horizons (Adopt · Trial · Assess · Hold) across four domains; fly between them;
   every briefing links to national needs, the owning programme and the library. */
import {
  $, $$, esc, t, tx, num, go, register, ai, ctx, content, lang, icon, head, svgEl, openAI, RM, CHALLENGES,
  type Bi, type Ctx, type Insight,
} from "@/core";
import { FX } from "@/shell/fx";

/* ---------- content shapes (public/content/library.json, radar.json) ---------- */
interface Theme extends Bi { k: string }
interface LibItem extends Bi { id: string; k: string; sum: Bi; tags: string[]; year: number }
interface Library { themes: Theme[]; items: LibItem[] }
interface Horizon extends Bi { k: "adopt" | "trial" | "assess" | "hold"; r: number }
interface RDomain extends Bi { k: string }
interface Tech extends Bi { id: string; h: Horizon["k"]; d: string; a: number; brief: Bi; challenges: string[]; programme: string }
interface Radar { horizons: Horizon[]; domains: RDomain[]; items: Tech[] }

const LIB = (): Library => content.library && content.library.themes ? content.library : { themes: [], items: [] };
const RD = (): Radar => content.radar && content.radar.horizons ? content.radar : { horizons: [], domains: [], items: [] };

/* Library ↔ radar link. Tags are English keywords, so match on the English name in both languages. */
const libForTech = (it: Tech) => LIB().items.filter(l => l.tags.includes(it.id) || l.tags.some(tg => it.en.toLowerCase().includes(tg)));
const techForLib = (i: LibItem) => RD().items.filter(r => i.tags.includes(r.id) || i.tags.some(tg => r.en.toLowerCase().includes(tg)));
const relatedLib = (i: LibItem) => LIB().items.filter(x => x.id !== i.id && x.tags.some(tg => i.tags.includes(tg))).slice(0, 3);

/* shared state survives zone changes so library ↔ radar hand-offs land on the right object */
let theme = "all", q = "", selLib: string | null = null;
let selT: string | null = null, domF = "all";

/* ======================================================================
   INNOVATION LIBRARY
   ====================================================================== */
const TONE: Record<string, string> = { case: "star", lesson: "warn", research: "good", academic: "good", video: "crit" };

register("library", {
  mount(el) {
    const L = LIB();
    head(el,
      { ar: "مكتبة الابتكار · 06", en: "Innovation Library · 06" },
      { ar: "ما تعرفه الدولة، منظّماً للاكتشاف", en: "What the nation knows, organised for discovery" },
      { ar: "جدار معرفي مضاء يُرتَّب بالموضوع لا بالمجلد: أبحاث وتقارير ودروس مستفادة وإحاطات وشراكات أكاديمية. كل عنصر مرتبط بتحدٍّ أو تقنية على الرادار.", en: "A lit knowledge wall arranged by theme, not folder: research, reports, lessons learned, briefings and academic partnerships. Every item links to a challenge or a technology on the radar." });

    el.insertAdjacentHTML("beforeend", `<div class="wrap">
      <div class="libBar">
        <label class="libSearch">
          <span class="sr">${esc(tx({ ar: "ابحث في المكتبة", en: "Search the library" }))}</span>
          ${icon("search")}
          <input type="search" id="libQ" autocomplete="off" placeholder="${esc(tx({ ar: "ابحث في المكتبة…", en: "Search the library…" }))}" value="${esc(q)}">
        </label>
        <p class="libCount" id="libCount" aria-live="polite"></p>
      </div>
      <div class="themes chips" id="libThemes" role="group" aria-label="${esc(tx({ ar: "الموضوعات", en: "Themes" }))}"></div>
      <div class="wall" id="libWall"></div>
    </div>`);

    const qIn = $<HTMLInputElement>("#libQ", el);
    qIn.addEventListener("input", () => { q = qIn.value; render(); });

    const themeName = (k: string) => tx(L.themes.find(x => x.k === k));
    const match = (i: LibItem, ql: string) => !ql || [i.id, i.ar, i.en, i.sum.ar, i.sum.en, i.tags.join(" ")].join(" ").toLowerCase().includes(ql);

    function render() {
      const ql = q.trim().toLowerCase();
      const hits = L.items.filter(i => match(i, ql));
      const shown = hits.filter(i => theme === "all" || i.k === theme);

      // theme chips carry the count under the current search
      $("#libThemes", el).innerHTML = [{ k: "all", ar: t("all"), en: t("all") } as Theme, ...L.themes].map(x => {
        const n = x.k === "all" ? hits.length : hits.filter(i => i.k === x.k).length;
        return `<button class="chip" data-k="${esc(x.k)}" aria-pressed="${theme === x.k}"${n || x.k === theme ? "" : " data-empty"}>${esc(tx(x))}<span class="n">${num(n)}</span></button>`;
      }).join("");
      $$<HTMLButtonElement>("#libThemes .chip", el).forEach(b => b.onclick = () => { theme = b.dataset.k!; render(); });

      $("#libCount", el).textContent = lang() === "ar"
        ? `${num(shown.length)} من ${num(L.items.length)} عنصراً`
        : `${shown.length} of ${L.items.length} items`;

      // the wall: every item, ordered by theme, each lit in its theme's colour
      const order = (k: string) => L.themes.findIndex(x => x.k === k);
      const wall = [...shown].sort((a, b) => order(a.k) - order(b.k) || a.id.localeCompare(b.id));
      $("#libWall", el).innerHTML = wall.length ? wall.map(book).join("")
        : `<div class="libEmpty"><p>${esc(tx({ ar: "لا توجد عناصر تطابق البحث.", en: "No items match this search." }))}</p>
          <button class="btn sm ghost" id="libClear">${esc(tx({ ar: "امسح البحث", en: "Clear the search" }))}</button></div>`;

      $$<HTMLButtonElement>(".book", el).forEach(b => b.onclick = () => select(selLib === b.dataset.i ? null : b.dataset.i!));
      $$<HTMLButtonElement>("[data-lib]", el).forEach(b => b.onclick = () => select(b.dataset.lib!, true));
      $$<HTMLButtonElement>("[data-tech]", el).forEach(b => b.onclick = () => { selT = b.dataset.tech!; go("radar"); });
      $$<HTMLButtonElement>("[data-askai]", el).forEach(b => b.onclick = () => openAI());
      const clr = $("#libClear", el); if (clr) clr.onclick = () => { q = ""; qIn.value = ""; theme = "all"; render(); qIn.focus(); };
    }

    function book(i: LibItem) {
      const on = selLib === i.id;
      const card = `<button class="book" data-i="${esc(i.id)}" aria-expanded="${on}">
        <span class="bkMeta"><span>${esc(themeName(i.k))}</span><span class="mono">${esc(i.id)} · ${num(i.year)}</span></span>
        <b class="bkT">${esc(tx(i))}</b>
        <span class="bkSum">${esc(tx(i.sum))}</span>
        <span class="bkTags mono">${i.tags.map(x => `<bdi>#${esc(x)}</bdi>`).join(" ")}</span>
      </button>`;
      if (!on) return `<article class="bk" data-tone="${TONE[i.k] || "base"}">${card}</article>`;
      const rel = relatedLib(i), rad = techForLib(i);
      return `<article class="bk open" data-tone="${TONE[i.k] || "base"}">${card}
        <div class="bkOpen">
          <div class="stack">
            <span class="kk">${esc(tx({ ar: "مرتبط في المكتبة", en: "Related in the library" }))}</span>
            ${rel.length ? `<ul class="bkList">${rel.map(r => `<li><button data-lib="${esc(r.id)}"><span class="mono">${esc(r.id)}</span>${esc(tx(r))}</button></li>`).join("")}</ul>`
              : `<p class="mute">—</p>`}
          </div>
          <div class="stack">
            <span class="kk">${esc(tx({ ar: "على الرادار", en: "On the radar" }))}</span>
            ${rad.length ? `<div class="chips">${rad.map(r => `<button class="chip" data-tech="${esc(r.id)}">${esc(tx(r))}</button>`).join("")}</div>`
              : `<p class="mute">—</p>`}
          </div>
          <div class="bkAct">
            <button class="btn sm ghost" data-askai>${icon("spark")}${esc(tx({ ar: "اسأل مساعد البحث", en: "Ask the research assistant" }))}</button>
          </div>
        </div>
      </article>`;
    }

    function select(id: string | null, scroll = false) {
      selLib = id;
      if (id) { const it = L.items.find(x => x.id === id); if (it && theme !== "all" && it.k !== theme) theme = "all"; }
      render();
      ai.set({ object: id });
      if (id) {
        const b = $<HTMLButtonElement>(`.book[data-i="${CSS.escape(id)}"]`, el);
        if (b) { b.focus({ preventScroll: true }); if (scroll) b.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" }); }
      }
    }

    render();
    if (selLib) { ai.set({ object: selLib }); const b = $(`.book[data-i="${CSS.escape(selLib)}"]`, el); if (b) requestAnimationFrame(() => b.scrollIntoView({ block: "center" })); }
  },

  insight(c: Ctx): Insight {
    const L = LIB();
    const i = c.object && L.items.find(x => x.id === c.object);
    const role = { ar: "مساعد البحث", en: "Research assistant" };
    if (i) {
      const rel = relatedLib(i), rad = techForLib(i);
      return {
        role,
        lines: [
          { ar: `${i.ar}: ${i.sum.ar}`, en: `${i.en}: ${i.sum.en}` },
          rel.length ? { ar: "مرتبط: " + rel.map(x => x.ar).join(" · "), en: "Related: " + rel.map(x => x.en).join(" · ") } : null,
          rad.length ? { ar: "على الرادار: " + rad.map(r => r.ar).join("، "), en: "On the radar: " + rad.map(r => r.en).join(", ") } : null,
        ].filter(Boolean) as Bi[],
        actions: [{ label: { ar: "افتح الرادار", en: "Open the radar" }, run: () => { if (rad[0]) selT = rad[0].id; go("radar"); } }],
      };
    }
    return {
      role,
      lines: [{ ar: `${num(L.items.length)} عنصراً في ${num(L.themes.length)} موضوعات. اختر عنصراً لأربطه بما يشبهه وبالرادار.`, en: `${L.items.length} items across ${L.themes.length} themes. Select an item and I link it to related items and the radar.` }],
    };
  },
});

/* ======================================================================
   TECHNOLOGY RADAR
   ====================================================================== */
const V = 800, C = V / 2, R = 330, CORE = 40;          // scope geometry (viewBox units)
const QUAD_START = -90;                                // first domain quadrant starts at 12 o'clock, clockwise

interface Placed { it: Tech; x: number; y: number; ang: number; n: number }

/** Lay each technology inside its (domain quadrant × horizon band) cell, spread evenly. */
function layout(rd: Radar): Placed[] {
  const bands = rd.horizons.map((h, k) => ({ k: h.k, r0: k ? rd.horizons[k - 1].r * R : CORE, r1: h.r * R }));
  const order = [...rd.items].sort((a, b) =>
    rd.horizons.findIndex(h => h.k === a.h) - rd.horizons.findIndex(h => h.k === b.h) ||
    rd.domains.findIndex(d => d.k === a.d) - rd.domains.findIndex(d => d.k === b.d) || a.a - b.a);
  return order.map((it, idx) => {
    const qi = Math.max(0, rd.domains.findIndex(d => d.k === it.d));
    const cell = order.filter(o => o.d === it.d && o.h === it.h);
    const j = cell.indexOf(it), n = cell.length;
    const b = bands.find(x => x.k === it.h) || bands[bands.length - 1];
    const mid = (b.r0 + b.r1) / 2, w = b.r1 - b.r0;
    const r = n > 2 ? mid + (j % 2 ? .18 : -.18) * w : mid;
    const ang = QUAD_START + qi * 90 + (j + 1) / (n + 1) * 90;
    const a = ang * Math.PI / 180;
    return { it, x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, ang, n: idx + 1 };
  });
}

const NEXT: Record<Horizon["k"], Bi> = {
  adopt: { ar: "التالي: توسيع التبني إلى قسم ثانٍ وقياس الأثر.", en: "Next: extend adoption to a second department and measure impact." },
  trial: { ar: "التالي: قرار تبنٍّ أو إيقاف بعد التجربة الجارية.", en: "Next: an adopt-or-stop decision after the current trial." },
  assess: { ar: "التالي: دراسة جدوى قصيرة قبل أي تجربة.", en: "Next: a short feasibility study before any trial." },
  hold: { ar: "التالي: مراجعة سنوية فقط.", en: "Next: an annual review only." },
};

let radarCleanup: (() => void) | null = null;

register("radar", {
  mount(el) {
    const rd = RD();
    const P = layout(rd);
    const two = (n: number) => String(n).padStart(2, "0");
    head(el,
      { ar: "رادار التقنيات · 07", en: "Technology Radar · 07" },
      { ar: "كون من التقنيات على أربعة آفاق حول نجمة سديم", en: "A universe of technologies on four horizons around the SADEEM star" },
      { ar: "تبنٍّ، تجربة، تقييم، ترقّب. المس تقنية لتقرأ إحاطتها وتصل إلى التحديات والبرامج والمكتبة المرتبطة بها.", en: "Adopt, trial, assess, hold. Touch a technology to read its briefing and reach the challenges, programmes and library items linked to it." });

    el.insertAdjacentHTML("beforeend", `<div class="wrap radarGrid">
      <div class="scope">
        <div class="scopeBar">
          <span class="kk">${esc(tx({ ar: "المنظار", en: "Scope" }))} · ${num(rd.items.length)} ${esc(tx({ ar: "تقنية", en: "technologies" }))}</span>
          <div class="seg" id="rdDom" role="group" aria-label="${esc(tx({ ar: "المجالات", en: "Domains" }))}"></div>
        </div>
        <div class="scopeView">
          <svg class="radar" id="rd" viewBox="0 0 ${V} ${V}" role="group" aria-label="${esc(tx({ ar: "رادار التقنيات", en: "Technology radar" }))}"></svg>
          <button class="btn sm quiet scopeReset" id="rdReset" hidden>${esc(tx({ ar: "المشهد الكامل", en: "Full view" }))}</button>
        </div>
        <p class="scopeCap">${esc(tx({ ar: "من المركز إلى الخارج: تبنٍّ ← تجربة ← تقييم ← ترقّب. كل ربع مجال.", en: "Centre outwards: Adopt → Trial → Assess → Hold. Each quadrant is one domain." }))}</p>
      </div>
      <aside class="panel brief" id="brief" aria-live="polite"></aside>
      <div class="techIndex" id="rdIndex"></div>
    </div>`);

    const svg = $<SVGSVGElement>("#rd", el);
    const HZ = (k: string) => rd.horizons.find(x => x.k === k);
    const DM = (k: string) => rd.domains.find(x => x.k === k);

    /* ---- static instrument ---- */
    (function drawScope() {
      const g = (n: string, a: Record<string, string | number> = {}, parent: Element = svg) => { const e = svgEl(n, a); parent.appendChild(e); return e; };
      const defs = g("defs");
      const rg = g("radialGradient", { id: "rdGlow" }, defs);
      g("stop", { offset: "0", "stop-color": "currentColor", "stop-opacity": ".22" }, rg);
      g("stop", { offset: "1", "stop-color": "currentColor", "stop-opacity": "0" }, rg);
      // quadrant wash (domain filter lights one)
      rd.domains.forEach((d, qi) => {
        const a0 = (QUAD_START + qi * 90) * Math.PI / 180, a1 = (QUAD_START + qi * 90 + 90) * Math.PI / 180;
        g("path", { class: "quad", "data-d": d.k, d: `M${C},${C} L${C + Math.cos(a0) * R},${C + Math.sin(a0) * R} A${R},${R} 0 0 1 ${C + Math.cos(a1) * R},${C + Math.sin(a1) * R} Z` });
      });
      // degree ticks on the rim
      for (let k = 0; k < 72; k++) {
        const a = k * 5 * Math.PI / 180, long = k % 6 === 0;
        g("line", { class: long ? "tick l" : "tick", x1: C + Math.cos(a) * (R + 6), y1: C + Math.sin(a) * (R + 6), x2: C + Math.cos(a) * (R + (long ? 16 : 11)), y2: C + Math.sin(a) * (R + (long ? 16 : 11)) });
      }
      rd.horizons.forEach(h => g("circle", { class: "ring", cx: C, cy: C, r: h.r * R }));
      // axes between domains
      for (let k = 0; k < 4; k++) { const a = (QUAD_START + k * 90) * Math.PI / 180; g("line", { class: "axis", x1: C + Math.cos(a) * CORE, y1: C + Math.sin(a) * CORE, x2: C + Math.cos(a) * (R + 16), y2: C + Math.sin(a) * (R + 16) }); }
      // horizon names on the 12 o'clock axis, centred in their band
      rd.horizons.forEach((h, k) => {
        const r0 = k ? rd.horizons[k - 1].r * R : CORE, r1 = h.r * R;
        const tt = g("text", { class: "hz", x: C, y: C - (r0 + r1) / 2 + 4, "text-anchor": "middle" }); tt.textContent = lang() === "en" ? h.en.toUpperCase() : h.ar;
      });
      // domain names at the four corners
      rd.domains.forEach((d, qi) => {
        const a = (QUAD_START + qi * 90 + 45) * Math.PI / 180, rr = R + 42;
        const tt = g("text", { class: "dm", "data-d": d.k, x: C + Math.cos(a) * rr, y: C + Math.sin(a) * rr + 4, "text-anchor": "middle" }); tt.textContent = tx(d);
      });
      g("circle", { class: "glow", cx: C, cy: C, r: 120, fill: "url(#rdGlow)" });
      g("line", { class: "beam", id: "rdBeam", x1: C, y1: C, x2: C, y2: C });
      g("circle", { class: "core", cx: C, cy: C, r: CORE - 6 });
      const star = g("path", { class: "coreStar", d: "M0-22 3.4-3.4 22 0 3.4 3.4 0 22-3.4 3.4-22 0-3.4-3.4Z", transform: `translate(${C} ${C})` }); void star;
      // nodes
      P.forEach(p => {
        const lab = tx(p.it);
        const node = g("g", { class: "node", "data-id": p.it.id, "data-d": p.it.d, tabindex: 0, role: "button", "aria-pressed": "false",
          "aria-label": `${two(p.n)} · ${lab} · ${tx(HZ(p.it.h))} · ${tx(DM(p.it.d))}` });
        g("circle", { class: "halo", cx: p.x, cy: p.y, r: 20 }, node);
        g("circle", { class: "dot", cx: p.x, cy: p.y, r: 11 }, node);
        const nt = g("text", { class: "num", x: p.x, y: p.y + 3.5, "text-anchor": "middle" }, node); nt.textContent = two(p.n);
        const below = p.y > C;
        const lt = g("text", { class: "lab", x: p.x, y: p.y + (below ? 30 : -20), "text-anchor": "middle" }, node); lt.textContent = lab;
      });
    })();

    /* ---- view (fly) ---- */
    let vb = { x: 0, y: 0, s: V }, tw: { cancel(): void } | null = null;
    const setVB = (v: typeof vb) => { vb = v; svg.setAttribute("viewBox", `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.s.toFixed(1)} ${v.s.toFixed(1)}`); };
    let beamAng = -90, beamR = 0;
    const setBeam = (ang: number, r: number) => { beamAng = ang; beamR = r; const a = ang * Math.PI / 180; const b = $("#rdBeam", svg); b.setAttribute("x2", String(C + Math.cos(a) * r)); b.setAttribute("y2", String(C + Math.sin(a) * r)); };
    function fly(to: Placed | null) {
      tw?.cancel();
      const from = { ...vb }, fa = beamAng, fr = beamR;
      let target = { x: 0, y: 0, s: V }, ta = fa, tr = 0;
      if (to) {
        const s = 540, fx = C + (to.x - C) * .7, fy = C + (to.y - C) * .7;
        target = { x: Math.max(-20, Math.min(V - s + 20, fx - s / 2)), y: Math.max(-20, Math.min(V - s + 20, fy - s / 2)), s };
        ta = to.ang; tr = Math.hypot(to.x - C, to.y - C) - 13;
        // shortest rotation for the beam
        while (ta - fa > 180) ta -= 360; while (fa - ta > 180) ta += 360;
      }
      tw = FX.tween(RM ? 0 : 900, e => {
        setVB({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, s: from.s + (target.s - from.s) * e });
        setBeam(fa + (ta - fa) * e, fr + (tr - fr) * e);
      });
      $("#rdReset", el).hidden = !to;
    }

    /* ---- selection ---- */
    function select(id: string | null, focus = false) {
      selT = id;
      $$("#rd .node", el).forEach(n => { const on = n.dataset.id === id; n.classList.toggle("on", on); n.setAttribute("aria-pressed", String(on)); });
      $$<HTMLButtonElement>(".tech", el).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
      const p = P.find(x => x.it.id === id) || null;
      fly(p); brief(); ai.set({ object: id });
      if (p) FX.sound("move");
      if (focus && id) $(`#rd .node[data-id="${CSS.escape(id)}"]`, el)?.focus({ preventScroll: true });
    }
    const step = (d: number) => {
      const i = P.findIndex(x => x.it.id === selT);
      const n = i < 0 ? (d > 0 ? 0 : P.length - 1) : (i + d + P.length) % P.length;
      select(P[n].it.id);
    };

    $$("#rd .node", el).forEach(n => {
      n.addEventListener("click", () => select(n.dataset.id === selT ? null : n.dataset.id!));
      n.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(n.dataset.id!); } });
    });
    const onKey = (e: KeyboardEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest(".scope, .brief, .techIndex")) return;
      if ((e.target as HTMLElement).matches("input, textarea")) return;
      const rtl = document.documentElement.dir === "rtl";
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); step((e.key === "ArrowRight") !== rtl ? 1 : -1); if ((e.target as Element).closest(".scope")) $(`#rd .node[data-id="${CSS.escape(selT!)}"]`, el)?.focus({ preventScroll: true }); }
      else if (e.key === "Escape" && selT) select(null);
    };
    el.addEventListener("keydown", onKey);
    $("#rdReset", el).onclick = () => select(null);

    /* ---- domain filter ---- */
    function renderDom() {
      $("#rdDom", el).innerHTML = [{ k: "all", ar: t("all"), en: t("all") }, ...rd.domains].map(d =>
        `<button data-d="${esc(d.k)}" aria-pressed="${domF === d.k}">${esc(tx(d))}</button>`).join("");
      $$<HTMLButtonElement>("#rdDom button", el).forEach(b => b.onclick = () => { domF = b.dataset.d!; renderDom(); });
      svg.dataset.dom = domF;
      $$(".techIndex", el).forEach(x => (x.dataset.dom = domF));
    }

    /* ---- index: four horizons, numbered ---- */
    $("#rdIndex", el).innerHTML = rd.horizons.map(h => {
      const items = P.filter(p => p.it.h === h.k);
      return `<section class="hzCol" data-h="${h.k}">
        <header><h3>${esc(tx(h))}</h3><span class="n">${num(items.length)}</span></header>
        <div class="techs">${items.map(p => `<button class="tech" data-id="${esc(p.it.id)}" data-d="${esc(p.it.d)}" aria-pressed="false">
          <i class="mono">${two(p.n)}</i><span><b>${esc(tx(p.it))}</b><small>${esc(tx(DM(p.it.d)))}</small></span></button>`).join("") || `<p class="mute">—</p>`}</div>
      </section>`;
    }).join("");
    $$<HTMLButtonElement>(".tech", el).forEach(b => b.onclick = () => select(b.dataset.id === selT ? null : b.dataset.id!));

    /* ---- briefing ---- */
    function brief() {
      const b = $("#brief", el);
      const i = P.findIndex(x => x.it.id === selT);
      const it = i >= 0 ? P[i].it : null;
      if (!it) {
        b.innerHTML = `<div class="ph"><h3>${esc(tx({ ar: "إحاطة تقنية", en: "Technology briefing" }))}</h3></div>
          <p class="mute">${esc(tx({ ar: "المس نقطة على الرادار.", en: "Touch a node on the radar." }))}</p>
          <dl class="hzSum">${rd.horizons.map(h => `<div><dt>${esc(tx(h))}</dt><dd>${num(rd.items.filter(x => x.h === h.k).length)}</dd></div>`).join("")}</dl>
          <div class="briefNav"><button class="btn sm ghost" data-step="1">${esc(tx({ ar: "ابدأ الجولة بين التقنيات", en: "Fly through the technologies" }))}${icon("arrow", "i flip")}</button></div>`;
      } else {
        const h = HZ(it.h), d = DM(it.d), lib = libForTech(it);
        b.innerHTML = `<div class="briefTop">
            <div class="row"><span class="tag sov">${esc(tx(h))}</span><span class="tag">${esc(tx(d))}</span></div>
            <div class="briefNav">
              <button class="btn sm quiet" data-step="-1" aria-label="${esc(tx({ ar: "التقنية السابقة", en: "Previous technology" }))}">${icon("arrow", "i flip back")}</button>
              <span class="mono ctr" dir="ltr">${two(i + 1)} / ${two(P.length)}</span>
              <button class="btn sm quiet" data-step="1" aria-label="${esc(tx({ ar: "التقنية التالية", en: "Next technology" }))}">${icon("arrow", "i flip")}</button>
            </div>
          </div>
          <h3 class="briefT">${esc(tx(it))}</h3>
          <p class="briefP">${esc(tx(it.brief))}</p>
          <div class="kv"><span>${esc(tx({ ar: "البرنامج المالك", en: "Owning programme" }))}</span><b>${esc(it.programme)}</b></div>
          ${it.challenges.length ? `<div class="stack"><span class="kk">${esc(tx({ ar: "احتياجات وطنية مرتبطة", en: "Linked national needs" }))}</span>
            <div class="chips">${it.challenges.map(c => { const ch = CHALLENGES.find(x => x.id === c); return `<button class="chip" data-ch="${esc(c)}"><span class="mono">${esc(c)}</span>${esc(ch ? tx(ch.t) : "")}</button>`; }).join("")}</div></div>` : ""}
          ${lib.length ? `<div class="stack"><span class="kk">${esc(tx({ ar: "في المكتبة", en: "In the library" }))}</span>
            <ul class="bkList">${lib.map(l => `<li><button data-lib="${esc(l.id)}"><span class="mono">${esc(l.id)}</span>${esc(tx(l))}</button></li>`).join("")}</ul></div>` : ""}
          <div class="row briefAct">
            <button class="btn sm" id="rIdea">${esc(tx({ ar: "اقترح فكرة بهذه التقنية", en: "Propose an idea with this technology" }))}</button>
            <a class="btn sm ghost" href="#library">${esc(t("z_library"))}</a>
          </div>`;
        $$<HTMLButtonElement>("[data-ch]", b).forEach(x => x.onclick = () => { ctx.state = { openCh: x.dataset.ch }; go("lab"); });
        $$<HTMLButtonElement>("[data-lib]", b).forEach(x => x.onclick = () => { selLib = x.dataset.lib!; theme = "all"; q = ""; go("library"); });
        $("#rIdea", b).onclick = () => {
          ctx.state = { draft: { t: { ar: `توظيف ${it.ar} لاحتياج وطني`, en: `Applying ${it.en} to a national need` }, d: tx(it.brief),
            area: it.d === "mfg" ? "mfg" : it.d === "aero" ? "air" : it.d === "mds" ? "cyber" : "land", ch: it.challenges[0] || "" } };
          go("lab");
        };
      }
      $$<HTMLButtonElement>("[data-step]", b).forEach(x => x.onclick = () => step(+x.dataset.step!));
    }

    renderDom();
    brief();
    if (selT && P.some(p => p.it.id === selT)) { const id = selT; selT = null; select(id); } else selT = null;
    radarCleanup = () => { tw?.cancel(); el.removeEventListener("keydown", onKey); };
  },

  unmount() { radarCleanup?.(); radarCleanup = null; },

  insight(c: Ctx): Insight {
    const rd = RD();
    const role = { ar: "كشّاف التقنيات", en: "Technology scout" };
    const it = c.object && rd.items.find(x => x.id === c.object);
    if (it) {
      const h = rd.horizons.find(x => x.k === it.h), d = rd.domains.find(x => x.k === it.d);
      return {
        role,
        lines: [
          { ar: `${it.ar} على أفق «${h?.ar ?? ""}» في ${d?.ar ?? ""}. ${it.brief.ar}`, en: `${it.en} on the '${h?.en ?? ""}' horizon in ${d?.en ?? ""}. ${it.brief.en}` },
          NEXT[it.h],
          it.challenges.length ? { ar: "تجيب عن الاحتياجات: " + it.challenges.join("، "), en: "Answers needs: " + it.challenges.join(", ") } : null,
        ].filter(Boolean) as Bi[],
      };
    }
    const counts = (l: "ar" | "en") => rd.horizons.map(h => `${h[l]} ${l === "ar" ? num(rd.items.filter(i => i.h === h.k).length) : rd.items.filter(i => i.h === h.k).length}`).join(" · ");
    return {
      role,
      lines: [
        { ar: `${num(rd.items.length)} تقنية: ${counts("ar")}.`, en: `${rd.items.length} technologies: ${counts("en")}.` },
        { ar: "الرادار يُحرَّر من نظام سديم؛ كل تقنية تصل إلى التجربة تُربط باحتياج وطني واحد على الأقل.", en: "The radar is edited from the SADEEM OS; every technology that reaches trial is linked to at least one national need." },
      ],
    };
  },
});
