/* SADEEM Hangar · 01 Entry Point + Vision Chamber.
   The Entry Point: a nebula condenses once into the four-point star above a monumental door engraved with
   H.H. Sheikh Mansour's statement; entering lights the three thresholds in order, splits the door and walks
   the visitor into the Vision Chamber. The Vision Chamber: verified statements resolve above seven pillars,
   and the touched pillar sends its light along to the zones it drives. */
import { $, $$, esc, t, tx, num, lang, go, register, quotes, ai, ctx, RM, STAR, icon, setLang, hasWebGL, type Bi } from "@/core";
import { FX } from "@/shell/fx";
import { Nebula3D, Nebula2D, type NebulaHandle } from "@/scenes/nebula";

/* ---------- statements: the language rule ---------- */
export interface Quote {
  id: string; leader: Bi; ar: string; en: string; date: string; context: Bi;
  source: string; sourceUrl: string; sourceUrlAr?: string; pillar?: string; zone?: string; verification?: string; note?: string;
}
interface Surface { text: string; lang: "ar" | "en"; dir: "rtl" | "ltr"; original: boolean; caption: string; url: string }

/** A language surface shows a statement only in that language's official wording; otherwise the original,
    with a caption. Never a machine translation. */
function surface(q: Quote): Surface {
  const L = lang();
  const own = L === "ar" ? q.ar : q.en;
  if (own) {
    const url = L === "ar" && q.sourceUrlAr ? q.sourceUrlAr : q.sourceUrl;
    return { text: own, lang: L, dir: L === "ar" ? "rtl" : "ltr", original: false, caption: "", url };
  }
  const oL: "ar" | "en" = q.en ? "en" : "ar";
  const text = q.en || q.ar || "";
  const url = oL === "ar" && q.sourceUrlAr ? q.sourceUrlAr : q.sourceUrl;
  return { text, lang: oL, dir: oL === "ar" ? "rtl" : "ltr", original: true, caption: L === "ar" ? t("arSurface") : t("enSurface"), url };
}
const VERIF: Record<string, Bi> = {
  "verified": { ar: "موثّق من الصفحات الرسمية باللغتين", en: "Verified on the official pages in both languages" },
  "verified-en": { ar: "النص الإنجليزي موثّق من الموقع الرسمي", en: "English verified on the official site" },
  "verified-en-secondary": { ar: "النص الإنجليزي كما نقلته صحافة موثوقة؛ يُرفق الأصل الرسمي قبل الاستخدام العام", en: "English as reported by reputable press; the official original is linked before public use" },
  "verified-ar-secondary": { ar: "النص العربي كما نقلته صحافة موثوقة؛ يُرفق الأصل الرسمي قبل الاستخدام العام", en: "Arabic as reported by reputable press; the official original is linked before public use" },
};
const verif = (q: Quote) => q.verification ? (VERIF[q.verification] ? tx(VERIF[q.verification]) : q.verification) : "";
function fmtDate(d: string) {
  const dt = new Date(d + "T12:00:00");
  if (!d || isNaN(+dt)) return esc(d);
  try {
    return new Intl.DateTimeFormat(lang() === "ar" ? "ar" : "en-GB", { day: "numeric", month: "long", year: "numeric", numberingSystem: lang() === "ar" ? "arab" : "latn" }).format(dt);
  } catch { return num(d); }
}
const allQ = () => quotes() as Quote[];
const safeUrl = (u: string) => /^https:\/\//i.test(u || "") ? u : "";

/* ---------- ENTRY POINT ---------- */
const TH: Array<[string, Bi]> = [
  ["01", { ar: "الاحتواء قبل الإطلاق", en: "Containment before launch" }],
  ["02", { ar: "التوجيه قبل التنفيذ", en: "Guidance before execution" }],
  ["03", { ar: "الحوكمة قبل التجربة", en: "Governance before experiment" }],
];
const VAL: Bi[] = [
  { ar: "مركزية سيادية لإدارة الابتكار عالي الحساسية", en: "Sovereign centralisation of high-sensitivity innovation" },
  { ar: "توحيد مرجعية الابتكار عالي الأثر", en: "A unified reference for high-impact innovation" },
  { ar: "استباق وطني بدل ردّ الفعل", en: "National anticipation instead of reaction" },
  { ar: "تقليل الهدر والمخاطر", en: "Less waste and risk" },
  { ar: "دعم الاكتفاء الذاتي وبناء قدرات وطنية مستدامة", en: "Self-sufficiency and sustainable national capabilities" },
  { ar: "رفع جودة المدخلات الفكرية للقطاع الدفاعي", en: "Higher-quality intellectual inputs to the defence sector" },
];
const DESC: Record<string, Bi> = {
  vision: { ar: "تصريحات القيادة كمعمار يقود القدرات", en: "Leadership statements as architecture that drives capability" },
  deck: { ar: "المحفظة الوطنية، الإحالات، مؤشرات سديم الستة", en: "National portfolio, referrals, the six SADEEM indicators" },
  lab: { ar: "من التجميع إلى التوجيه للجهة المختصة", en: "From collection to routing to the competent entity" },
  gate: { ar: "التصنيف والاحتواء قبل أي إطلاق", en: "Classification and containment before any launch" },
  bay: { ar: "منصات مرجعية تُفكّك إلى طبقاتها", en: "Reference platforms opened into their layers" },
  drones: { ar: "صمّم وشاهد المفاضلات الهندسية", en: "Design and see the engineering trade-offs" },
  factory: { ar: "خط واحد بين الحالي والمستقبلي", en: "One line between current and future" },
  twins: { ar: "غيّر المعامل وشاهد النتيجة", en: "Change a parameter, see the consequence" },
  missions: { ar: "خطّط مهمة واكتشف فجوات القدرة", en: "Plan a mission and find capability gaps" },
  library: { ar: "ما تعرفه الدولة، منظّماً للاكتشاف", en: "What the nation knows, organised for discovery" },
  radar: { ar: "التقنيات على أربعة آفاق", en: "Technologies on four horizons" },
};
const ZLIST: Array<[string, string]> = [["vision", "VC"], ["deck", "02"], ["lab", "03"], ["gate", "04"], ["bay", "L1"], ["drones", "L2"], ["factory", "L3"], ["twins", "L4"], ["missions", "L5"], ["library", "06"], ["radar", "07"]];

/** The star condenses once per visit; returning to the Entry Point finds it already formed. */
let starFormed = false;
let arr: { neb: NebulaHandle | null; timers: number[]; off: Array<() => void>; dead: boolean } | null = null;

function archSVG() {
  const floor = Array.from({ length: 13 }, (_, i) => `<line x1="720" y1="560" x2="${120 + i * 100}" y2="900"/>`).join("");
  const rows = [600, 650, 712, 792, 900].map(y => `<line x1="0" y1="${y}" x2="1440" y2="${y}" stroke-opacity="${(0.05 + (y - 600) / 900 * 0.14).toFixed(3)}"/>`).join("");
  const ribs = [0, 1, 2, 3].map(i => { const s = 1 - i * 0.16, w = 900 * s, h = 620 * s, cx = 720, top = 40 + i * 26; return `<path d="M${cx - w / 2} ${top + h} Q${cx - w / 2} ${top} ${cx} ${top} Q${cx + w / 2} ${top} ${cx + w / 2} ${top + h}" stroke-width="${(1.6 - i * 0.3).toFixed(2)}"/>`; }).join("");
  return `<svg class="arch" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs><linearGradient id="arRib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--star)" stop-opacity=".45"/><stop offset="1" style="stop-color:var(--star)" stop-opacity="0"/></linearGradient></defs>
    <g class="archFloor" stroke="currentColor" stroke-opacity=".14" stroke-width="1">${floor}${rows}</g>
    <g class="archRibs" fill="none" stroke="url(#arRib)">${ribs}</g></svg>`;
}

function engraving(q: Quote, s: Surface, hidden: boolean) {
  return `<div class="engr"${hidden ? ' aria-hidden="true"' : ""}><div class="engrIn">
    <p class="stmt" dir="${s.dir}" lang="${s.lang}">${esc(s.text)}</p>
    <p class="by">${esc(tx(q.leader))}</p>
    <p class="when">${fmtDate(q.date)} · ${esc(tx(q.context))}</p></div></div>`;
}

register("arrival", {
  mount(el) {
    const qs = allQ();
    const q = qs.find(x => x.zone === "arrival") || qs.find(x => x.id === "Q4") || qs[0];
    const s = q ? surface(q) : null;
    const other = lang() === "ar" ? "en" : "ar";
    const state = arr = { neb: null as NebulaHandle | null, timers: [] as number[], off: [] as Array<() => void>, dead: false };
    const later = (f: () => void, ms: number) => { state.timers.push(window.setTimeout(f, ms)); };

    el.innerHTML = `
    <div class="apron${starFormed || RM ? " formed" : ""}" id="apron">
      <canvas class="nebula" id="nebula" aria-hidden="true"></canvas>
      ${archSVG()}
      <div class="apronIn">
        <div class="crest">
          <div class="starSlot" id="starSlot" aria-hidden="true">${STAR}</div>
          <p class="logoLock"><span lang="ar">سديم للابتكار</span><b lang="en">SADEEM INNOVATES</b></p>
        </div>
        <figure class="door" id="door">
          <div class="beyond" aria-hidden="true">${STAR}</div>
          ${q && s ? `
          <div class="leaf ls">${engraving(q, s, false)}</div>
          <div class="leaf le">${engraving(q, s, true)}</div>` : `<div class="leaf ls"></div><div class="leaf le"></div>`}
          <span class="seam" aria-hidden="true"></span>
        </figure>
        ${q && s ? `<p class="plaque">
          ${s.original ? `<span class="orig">${esc(s.caption)}</span>` : ""}
          <span class="prov"><span>${esc(t("source"))}: ${safeUrl(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(q.source)}</a>` : esc(q.source)}</span>${verif(q) ? `<i aria-hidden="true">·</i><span class="vf">${esc(verif(q))}</span>` : ""}</span></p>` : ""}
        <ol class="thresholds" id="th" aria-label="${esc(tx({ ar: "العتبات الثلاث", en: "The three thresholds" }))}">
          ${TH.map(([n, l]) => `<li><b class="mono">${n}</b><span>${esc(tx(l))}</span></li>`).join("")}
        </ol>
        <div class="acts">
          <button class="btn lg enter" id="enterBtn" type="button">${esc(t("enter"))}${icon("arrow")}</button>
          <a class="btn ghost lg" href="#os">${esc(t("work"))}</a>
          <button class="btn quiet lgSw" id="lgSw" type="button" lang="${other}">${esc(t("lang"))}</button>
        </div>
      </div>
      <p class="sr" aria-live="polite" id="arrLive"></p>
    </div>

    <div class="wrap arrIntro">
      <div class="arrHead">
        <span class="kk">${esc(tx({ ar: "نقطة دخول وطنية واحدة", en: "Single National Entry Point" }))}</span>
        <h1>${esc(tx({ ar: "هانقر سديم للابتكار", en: "The SADEEM Innovation Hangar" }))}</h1>
        <p class="lead">${esc(tx({ ar: "فضاء وطني منضبط تتشكّل فيه الأفكار وتُنقّى قبل أن تتحول إلى قدرات أو تطبيقات. بوابة واحدة للابتكار التقني عالي الحساسية، تمنع التشتت والازدواجية والاستخدام غير المنضبط للأفكار.", en: "A controlled national space where ideas take shape and are refined before they become capabilities or applications. One door for high-sensitivity technical innovation, preventing fragmentation, duplication and uncontrolled use of ideas." }))}</p>
      </div>
      <div class="arrVals">
        <span class="kk">${esc(tx({ ar: "سديم × الدولة", en: "SADEEM × the State" }))}</span>
        <ol class="valueRow">${VAL.map((v, i) => `<li><i class="mono">0${i + 1}</i><span>${esc(tx(v))}</span></li>`).join("")}</ol>
      </div>
    </div>

    <div class="wrap arrZones">
      <div class="sec-h"><span class="kk">${esc(t("map"))}</span></div>
      <nav class="zoneList" aria-label="${esc(t("map"))}">${ZLIST.map(([z, n]) => `<a href="#${z}"><i class="mono">${n}</i><b>${esc(t("z_" + z))}</b><span>${esc(tx(DESC[z]))}</span></a>`).join("")}</nav>
      <p class="disc">${esc(tx({ ar: "لا تتضمن هذه المنصة آليات تشغيلية معتمدة. كل آلية معروضة هنا مقترحة، وتُستكمل تفاصيلها حصرياً في مراحل لاحقة وبموافقة رسمية.", en: "This platform contains no approved operational mechanisms. Every mechanism shown is proposed; details are completed exclusively in later phases with official approval." }))}</p>
    </div>`;

    const apron = $("#apron", el), canvas = $<HTMLCanvasElement>("#nebula", el), slot = $("#starSlot", el);
    const anchor = () => {
      const c = canvas.getBoundingClientRect(), r = slot.getBoundingClientRect();
      return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2, r: Math.max(18, r.height / 2) };
    };
    const onFormed = () => { starFormed = true; apron.classList.add("formed"); FX.sound("reveal"); };
    const nebOpts = { anchor, formed: starFormed || RM, onFormed };
    const fallback2D = () => { if (state.dead) return; state.neb = Nebula2D(canvas, nebOpts); apron.classList.add("scene", "s2d"); };
    if (hasWebGL()) {
      Nebula3D(canvas, nebOpts).then(n => {
        if (state.dead) { n.stop(); return; }
        state.neb = n; apron.classList.add("scene", "s3d");
      }).catch(() => fallback2D());
    } else fallback2D();
    // keep the star on its slot when fonts or the viewport change the layout
    const ro = new ResizeObserver(() => state.neb?.layout()); ro.observe(slot); ro.observe(apron);
    state.off.push(() => ro.disconnect());

    // the hangar architecture drifts gently with the pointer (never the statement)
    if (!RM) {
      const arch = $("svg.arch", el);
      const onMove = (e: PointerEvent) => { const dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5; arch.style.transform = `translate(${(dx * -18).toFixed(1)}px,${(dy * -10).toFixed(1)}px) scale(1.05)`; };
      apron.addEventListener("pointermove", onMove);
      state.off.push(() => apron.removeEventListener("pointermove", onMove));
    }

    // entering: the thresholds light in the order of the principles, the door splits, the building opens
    const ths = $$("#th li", el);
    const live = $("#arrLive", el);
    let entering = false;
    const enter = () => {
      if (entering) return; entering = true;
      const step = RM ? 60 : 520;
      el.classList.add("entering");
      $<HTMLButtonElement>("#enterBtn", el).setAttribute("aria-disabled", "true");
      ths.forEach((x, i) => later(() => { x.classList.add("lit"); live.textContent = x.textContent?.replace(/^\d+/, "").trim() || ""; FX.sound("move"); }, i * step + (RM ? 0 : 120)));
      later(() => {
        $("#door", el).classList.add("open"); FX.sound("door");
        state.neb?.open();
      }, step * 3 + (RM ? 0 : 200));
      later(() => { void go("vision"); }, RM ? 300 : step * 3 + 2300);
    };
    $("#enterBtn", el).onclick = enter;
    $("#door", el).onclick = e => { if ((e.target as HTMLElement).closest("a")) return; enter(); };
    $("#lgSw", el).onclick = () => setLang(other);
  },
  unmount() {
    if (!arr) return;
    arr.dead = true;
    arr.timers.forEach(clearTimeout);
    arr.off.forEach(f => f());
    arr.neb?.stop();
    arr = null;
  },
  insight() {
    return {
      role: { ar: "مضيف المنشأة", en: "Facility host" },
      lines: [
        { ar: "أنت أمام نقطة الدخول الوطنية الواحدة. سديم تعني السحابة التي تتكوّن منها النجوم: الأفكار تدخل مبعثرة وتخرج قدرات محددة.", en: "You stand at the single national entry point. Sadeem means the nebula stars form from: ideas enter diffuse and leave as defined capabilities." },
        { ar: "الدخول يمر بثلاث عتبات بترتيب المبادئ: الاحتواء، ثم التوجيه، ثم الحوكمة.", en: "Entry crosses three thresholds in the order of the principles: containment, then guidance, then governance." },
        { ar: "التصريح على الباب موثّق بمصدره ويُدار من نظام المحتوى.", en: "The statement on the door carries its source and is managed in the content system." },
      ],
      actions: [
        { label: { ar: "ادخل", en: "Enter" }, run: () => { const b = $<HTMLButtonElement>("#enterBtn"); b?.click(); } },
        { label: { ar: "إلى العمل مباشرة", en: "Straight to work" }, run: () => { void go("os"); } },
      ],
    };
  },
});

/* ---------- VISION CHAMBER ---------- */
const PILLARS = ["VISION", "KNOWLEDGE", "INNOVATION", "AMBITION", "ENGINEERING", "HUMAN CAPITAL", "FUTURE"] as const;
type Pillar = typeof PILLARS[number];
const CHAINS: Record<Pillar, Array<[string, Bi]>> = {
  VISION: [["deck", { ar: "منصة القيادة", en: "Command Deck" }], ["lab", { ar: "مسار سديم", en: "SADEEM pipeline" }]],
  KNOWLEDGE: [["library", { ar: "المكتبة", en: "Library" }], ["radar", { ar: "رادار التقنيات", en: "Technology Radar" }], ["library", { ar: "مساعد البحث", en: "Research assistant" }], ["lab", { ar: "جودة المدخلات الفكرية", en: "Quality of intellectual inputs" }]],
  INNOVATION: [["lab", { ar: "احتياجات الدولة", en: "National needs" }], ["lab", { ar: "التجميع والتصنيف", en: "Collection & classification" }], ["lab", { ar: "التقييم الوطني", en: "National evaluation" }], ["lab", { ar: "التجربة والمتابعة", en: "Experiment & follow-up" }], ["deck", { ar: "التوجيه للجهة المختصة", en: "Routing to the competent entity" }]],
  AMBITION: [["deck", { ar: "منصة القيادة", en: "Command Deck" }], ["os", { ar: "المبادرات الوطنية المحتملة", en: "Possible national initiatives" }]],
  ENGINEERING: [["bay", { ar: "حظيرة المنصات", en: "Vehicle Bay" }], ["drones", { ar: "مختبر الدرونات", en: "Drone Lab" }], ["twins", { ar: "التوائم الرقمية", en: "Digital Twins" }], ["missions", { ar: "هندسة المهام", en: "Mission Engineering" }]],
  "HUMAN CAPITAL": [["lab", { ar: "المواهب الوطنية", en: "National talent" }], ["os", { ar: "الإنجازات", en: "Achievements" }]],
  FUTURE: [["radar", { ar: "الذكاء الاصطناعي", en: "AI" }], ["twins", { ar: "التوائم الرقمية", en: "Digital Twins" }], ["drones", { ar: "الأنظمة الذاتية", en: "Autonomous systems" }], ["factory", { ar: "التصنيع المتقدم", en: "Advanced manufacturing" }], ["gate", { ar: "الاكتفاء الذاتي", en: "Self-sufficiency" }]],
};
let curP: Pillar = "INNOVATION";
let vcOff: Array<() => void> = [];
const pName = (p: string) => (t("pillars") as Record<string, string>)[p] ?? p;

register("vision", {
  mount(el) {
    el.innerHTML = `<div class="vcHall">
      <div class="wrap vcTop">
        <span class="kk">${esc(tx({ ar: "قاعة الرؤية", en: "Vision Chamber" }))}</span>
        <p class="vcArc">${esc(tx({ ar: "الرؤية ← القدرة ← الابتكار ← التنفيذ ← الأثر الوطني", en: "Vision → Capability → Innovation → Execution → National impact" }))}</p>
      </div>
      <div class="vcStage"><div class="vcBeam" aria-hidden="true"></div>
        <div class="wrap"><figure class="vcStmt" id="vcStmt" aria-live="polite"></figure></div></div>
      <div class="wrap vcFloor">
        <div class="vcScroll"><div class="vc" id="vc" role="group" aria-label="${esc(tx({ ar: "أعمدة الرؤية السبعة", en: "The seven pillars" }))}">${PILLARS.map((p, i) => `<button class="pillar" type="button" data-p="${p}" aria-pressed="${p === curP}" aria-controls="vcStmt chain"><span class="pShaft" aria-hidden="true"></span><span class="pBeam" aria-hidden="true"></span><i class="mono" aria-hidden="true">${String(i + 1).padStart(2, "0")}</i><b>${esc(pName(p))}</b></button>`).join("")}</div></div>
        <p class="vcHint">${esc(tx({ ar: "المس عموداً لتقرأ التصريح الذي يقوده وتتبع الضوء إلى ما يحرّكه داخل سديم.", en: "Touch a pillar to read the statement it drives and follow the light to what it moves inside SADEEM." }))}</p>
        <nav class="chain" id="chain" aria-label="${esc(tx({ ar: "ما يحرّكه العمود", en: "What the pillar drives" }))}"></nav>
      </div></div>`;

    const btns = $$<HTMLButtonElement>(".pillar", el);
    const render = (animate: boolean) => {
      const qs = allQ();
      const q = qs.find(x => x.pillar === curP) || qs.find(x => x.pillar === "INNOVATION") || qs[0];
      const box = $("#vcStmt", el);
      if (!q) { box.innerHTML = ""; return; }
      const s = surface(q);
      const words = s.text.split(/\s+/).filter(Boolean);
      const url = safeUrl(s.url);
      box.innerHTML = `<blockquote class="${animate && !RM ? "rev" : ""}" dir="${s.dir}" lang="${s.lang}"${url ? ` cite="${esc(url)}"` : ""}><p>${words.map((w, i) => `<span style="--i:${Math.min(i, 30)}">${esc(w)}</span>`).join(" ")}</p></blockquote>
        <figcaption>
          <p class="by">${esc(tx(q.leader))}<i aria-hidden="true">·</i><span>${fmtDate(q.date)}</span></p>
          ${s.original ? `<p class="orig">${esc(s.caption)}</p>` : ""}
          <p class="src"><span>${esc(t("source"))}: ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(q.source)}</a>` : esc(q.source)}</span><i aria-hidden="true">·</i><span>${esc(tx(q.context))}</span>${verif(q) ? `<i aria-hidden="true">·</i><span class="vf">${esc(verif(q))}</span>` : ""}</p>
        </figcaption>`;
      const ch = CHAINS[curP];
      const chain = $("#chain", el);
      chain.innerHTML = `<span class="src0"><b>${esc(pName(curP))}</b></span>` + ch.map(([z, l], i) => `<span class="lk"><i class="arw" aria-hidden="true" style="--k:${i}">${icon("arrow")}</i><a href="#${z}" style="--k:${i}">${esc(tx(l))}</a></span>`).join("");
      chain.classList.remove("flow"); void chain.offsetWidth; if (!RM) chain.classList.add("flow");
    };
    btns.forEach(b => {
      b.onclick = () => {
        curP = b.dataset.p as Pillar;
        btns.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        render(true); FX.sound("move");
        ai.set({ object: curP });
      };
    });
    // arrow keys move between pillars
    const vc = $("#vc", el);
    const onKey = (e: KeyboardEvent) => {
      const i = btns.indexOf(document.activeElement as HTMLButtonElement); if (i < 0) return;
      const fwd = lang() === "ar" ? "ArrowLeft" : "ArrowRight", back = lang() === "ar" ? "ArrowRight" : "ArrowLeft";
      let j = -1;
      if (e.key === fwd) j = (i + 1) % btns.length; else if (e.key === back) j = (i - 1 + btns.length) % btns.length;
      else if (e.key === "Home") j = 0; else if (e.key === "End") j = btns.length - 1;
      if (j >= 0) { e.preventDefault(); btns[j].focus(); btns[j].click(); }
    };
    vc.addEventListener("keydown", onKey);
    vcOff.push(() => vc.removeEventListener("keydown", onKey));
    render(false);
    // on phones the pillar row scrolls: bring the lit pillar into view
    const on = btns.find(b => b.dataset.p === curP);
    const sc = $(".vcScroll", el);
    if (on && sc.scrollWidth > sc.clientWidth) sc.scrollLeft += on.getBoundingClientRect().left - sc.getBoundingClientRect().left - (sc.clientWidth - on.clientWidth) / 2;
    ai.set({ object: curP });
  },
  unmount() { vcOff.forEach(f => f()); vcOff = []; },
  insight(c) {
    const p = (c.object as string) || curP;
    return {
      role: { ar: "مرشد الرؤية", en: "Vision guide" },
      lines: [
        { ar: `العمود المختار: ${pName(p)}. كل تصريح هنا مرتبط بمصدره، وكل عمود يضيء مسارات حقيقية داخل سديم.`, en: `Selected pillar: ${p}. Every statement carries its source, and every pillar lights real paths inside SADEEM.` },
        { ar: "التصريح بلغة غير متوفرة رسمياً يُعرض بلغته الأصلية فقط، ولا يُترجم آلياً.", en: "A statement without official wording in one language is shown only in its original language, never machine-translated." },
      ],
      actions: [{ label: { ar: "افتح نظام المحتوى", en: "Open the content system" }, run: () => { ctx.state = { osView: "quotes" }; void go("os"); } }],
    };
  },
});
