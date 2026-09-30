/* SADEEM Hangar · Digital Twin Lab (L4) + Mission Engineering "Shamal Storm" (L5).
   Both read the same pure OPS_CORE engine: the environment twin reads the storm front the mission map shows. */
import { $, $$, esc, t, tx, num, go, register, ai, ctx, head, lang, RM, type Bi, type Insight } from "@/core";
import { OPS_CORE as O, type Plan, type RouteKey, type SimResult, type SimState, type TaskKey, type Gap, type EventKey, type UnitState } from "@/engines/ops";

const A = (ar: string, en: string): Bi => ({ ar, en });
/** SVG text in charts/maps is laid out in an LTR box; Arabic labels get direction="rtl" and a mirrored anchor
    so "l" always means "text starts at x and runs right", "r" means "text ends at x". */
const ta = (p: "l" | "m" | "r") => {
  if (lang() !== "ar") return `text-anchor="${p === "l" ? "start" : p === "r" ? "end" : "middle"}"`;
  return `direction="rtl" text-anchor="${p === "l" ? "end" : p === "r" ? "start" : "middle"}"`;
};

/* =====================================================================
   DIGITAL TWIN LAB · cooling-system twin (illustrative model)
   ===================================================================== */
type Cool = "std" | "enh" | "graphene";
const COOL: Record<Cool, number> = { std: 1, enh: 1.16, graphene: 1.28 };
const COOL_N: Record<Cool, Bi> = { std: A("قياسي", "Standard"), enh: A("مُعزَّز", "Enhanced"), graphene: A("جرافين", "Graphene") };
const LIMIT = 105; // °C derate limit
export function coolant(amb: number, load: number, clog: number, cool: Cool) { return amb + load * .62 * (1 + clog * .95) / COOL[cool] + 4; }

interface TwinResult { pts: Array<[number, number]>; derateAt: number | null; peak: number }
const tw = { amb: 45, load: 70, clog: 20, cool: "std" as Cool };

function calc(): TwinResult {
  const pts: Array<[number, number]> = []; let derateAt: number | null = null, peak = 0;
  for (let h = 0; h <= 8; h += .25) {
    const load = tw.load * (0.75 + 0.25 * Math.sin(h * 1.3));
    const clog = Math.min(100, tw.clog + h * 4);
    const T = coolant(tw.amb, load, clog / 100, tw.cool);
    pts.push([h, T]); peak = Math.max(peak, T);
    if (derateAt == null && T >= LIMIT) derateAt = h;
  }
  return { pts, derateAt, peak: Math.round(peak) };
}
const isSolved = (r: TwinResult) => r.derateAt != null && r.derateAt <= 2 && tw.amb >= 46 && tw.amb <= 50;

let twRoot: HTMLElement | null = null;

register("twins", {
  mount(el) {
    twRoot = el;
    head(el, A("مختبر التوائم الرقمية · L4", "Digital Twin Lab · L4"), A("غيّر المعامل وشاهد النتيجة في اللحظة نفسها", "Change a parameter and see the consequence in the same moment"),
      A("توأم منظومة التبريد يقرأ الحرارة المحيطة والحمل وحالة الفلتر ويعطي درجة السائل ولحظة خفض القدرة. توأم البيئة يقرأ جبهة العاصفة من محرك المهام نفسه.",
        "The cooling twin reads ambient, load and filter state and returns coolant temperature and the derate moment. The environment twin reads the storm front from the same mission engine."));
    const slider = (id: string, l: Bi, min: number, max: number, v: number, unit: string) =>
      `<div class="field tw-f"><label for="tw-${id}"><span>${esc(tx(l))}</span><b class="n" id="tw-v-${id}"></b><small>${unit}</small></label><input type="range" id="tw-${id}" min="${min}" max="${max}" value="${v}"></div>`;
    const envPts: Array<[Bi, { x: number; z: number }]> = [[A("القاعدة", "Base"), O.BASE], [A("منطقة البحث", "Search zone"), O.ZONE], [A("محطة المراقبة", "Watch station"), O.STATION], [A("القرية", "Village"), O.VIL]];

    el.insertAdjacentHTML("beforeend", `<div class="wrap tw">
      <section class="panel tw-cool">
        <div class="ph"><h3>${esc(tx(A("توأم منظومة التبريد · منصة ٨×٨", "Cooling-system twin · 8×8 platform")))}</h3><small class="mute">${esc(t("training"))}</small></div>
        <figure class="tw-fig"><svg class="tw-chart" id="twChart" viewBox="0 0 700 290" role="img" aria-labelledby="twCap"></svg>
          <figcaption id="twCap" class="sr"></figcaption></figure>
        <div class="tw-ctl">
          ${slider("amb", A("الحرارة المحيطة", "Ambient"), 25, 55, tw.amb, "°C")}
          ${slider("load", A("حمل المحرك", "Engine load"), 20, 100, tw.load, "%")}
          ${slider("clog", A("انسداد الفلتر", "Filter clogging"), 0, 100, tw.clog, "%")}
          <div class="field tw-f"><span id="twCoolL">${esc(tx(A("منظومة التبريد", "Cooling")))}</span>
            <div class="seg" id="twCool" role="group" aria-labelledby="twCoolL">${(Object.keys(COOL) as Cool[]).map(k => `<button type="button" aria-pressed="${tw.cool === k}" data-k="${k}">${esc(tx(COOL_N[k]))}</button>`).join("")}</div></div>
        </div>
        <div class="tw-metrics" id="twM" aria-live="polite"></div>
        <div><button class="btn sm" type="button" id="twIdea">${esc(t("toIdea"))}</button></div>
      </section>

      <div class="tw-side">
        <section class="panel">
          <div class="ph"><h3>${esc(tx(A("توأم البيئة · جبهة عاصفة الشمال", "Environment twin · shamal front")))}</h3><small class="mute mono">OPS_CORE</small></div>
          <div class="tw-env">
            ${envPts.map(([n, p]) => { const h = O.stormArrival(p.x, p.z); return `<div class="tw-er"><span>${esc(tx(n))}</span><div class="tw-eb"><i style="inline-size:${Math.min(100, h / O.TMAX * 100).toFixed(2)}%"></i></div><b class="n">T+${esc(num(h.toFixed(1)))}h</b></div>`; }).join("")}
            <div class="tw-er tw-axis" aria-hidden="true"><span></span><div class="tw-ticks">${[0, 2, 4, 6].map(h => `<i style="inset-inline-start:${h / O.TMAX * 100}%">${num(h)}h</i>`).join("")}</div><b></b></div>
          </div>
          <p class="note">${esc(tx(A("زمن وصول الجبهة إلى كل نقطة، محسوب من محرك المهام نفسه المستخدم في هندسة المهام.", "Front arrival at each point, computed by the same engine used in Mission Engineering.")))}</p>
          <div><a class="btn ghost sm" href="#missions">${esc(t("z_missions"))}<svg class="i tw-arr" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M12 6l4 4-4 4"/></svg></a></div>
        </section>
        <section class="panel">
          <div class="ph"><h3>${esc(tx(A("قضية المحقق الهندسي", "Engineering Detective case")))}</h3><small class="mute">${esc(tx(A("على التوأم", "on the twin")))}</small></div>
          <p class="ink2 tw-brief">${esc(tx(A("عادت مركبة من الميدان بخفض قدرة متكرر بعد ساعتين من التشغيل عند 48°م. أعد إنتاج العطل على التوأم: أي مزيج من الحمل والانسداد يعبر حد 105°م خلال أقل من ساعتين؟",
            "A vehicle returned from the field with repeated derating after two hours at 48 °C. Reproduce the failure on the twin: which mix of load and clogging crosses 105 °C in under two hours?")))}</p>
          <div id="twCase" class="tw-case" aria-live="polite"></div>
        </section>
      </div>
    </div>`);

    (["amb", "load", "clog"] as const).forEach(k => $<HTMLInputElement>("#tw-" + k, el).addEventListener("input", e => { tw[k] = +(e.target as HTMLInputElement).value; renderTwin(); }));
    $$<HTMLButtonElement>("#twCool button", el).forEach(b => b.addEventListener("click", () => {
      tw.cool = b.dataset.k as Cool;
      $$("#twCool button", el).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      renderTwin();
    }));
    $("#twIdea", el).addEventListener("click", twinToIdea);
    renderTwin();
  },
  unmount() { twRoot = null; },
  insight(c): Insight | null {
    const st = c.state || {}; const r: TwinResult | undefined = st.r; if (!r) return null;
    return {
      role: A("مساعد المحاكاة", "Simulation assistant"),
      lines: [
        { ar: `الذروة ${num(r.peak)}°م. ${r.derateAt != null ? `خفض القدرة يبدأ عند T+${num(r.derateAt)}h.` : "لا خفض قدرة خلال ٨ ساعات."} الانسداد يضاعف أثر الحمل، لذا الفلتر أرخص رافعة من المشعاع.`,
          en: `Peak ${r.peak} °C. ${r.derateAt != null ? `Derating starts at T+${r.derateAt}h.` : "No derating within 8 hours."} Clogging multiplies the load effect, so the filter is a cheaper lever than the radiator.` },
        st.solved
          ? { ar: "القضية حُلّت على التوأم. حوّلها إلى فكرة مرتبطة بالاحتياج الوطني N-01.", en: "The case is solved on the twin. Turn it into an idea linked to national need N-01." }
          : { ar: "لحل قضية المحقق: أعد إنتاج العطل قبل T+2h عند 48°م.", en: "To solve the Detective case: reproduce the failure before T+2h at 48 °C." },
      ],
      actions: [{ label: t("toIdea"), run: twinToIdea }],
    };
  },
});

function twinToIdea() {
  const r = calc();
  ctx.state = { draft: {
    t: A("منع خفض القدرة الحراري في الأسطول البري", "Prevent thermal derating in the land fleet"),
    d: tx({
      ar: `من مختبر التوائم: عند ${tw.amb}°م وحمل ${tw.load}% وانسداد ${tw.clog}% مع تبريد ${COOL_N[tw.cool].ar}، تصل حرارة السائل إلى ${r.peak}°م وتبدأ الحماية بعد ${r.derateAt ?? "—"} ساعة.`,
      en: `From the Twin Lab: at ${tw.amb} °C, ${tw.load}% load and ${tw.clog}% clogging with ${COOL_N[tw.cool].en.toLowerCase()} cooling, coolant peaks at ${r.peak} °C and derating starts after ${r.derateAt ?? "—"} h.`,
    }),
    area: "land", ch: "N-01",
  } };
  void go("lab");
}

/** Nice axis domain that always shows the 105 °C limit with headroom. */
function yDomain(pts: Array<[number, number]>) {
  const lo = Math.min(...pts.map(p => p[1])), hi = Math.max(...pts.map(p => p[1]));
  const step = Math.max(hi, LIMIT + 10) - Math.min(lo, 60) > 90 ? 20 : 10;
  const y0 = Math.floor(Math.min(lo - 4, 60) / step) * step;
  const y1 = Math.ceil(Math.max(hi + 4, LIMIT + 10) / step) * step;
  return { y0, y1, step };
}

function renderTwin() {
  const el = twRoot; if (!el) return;
  (["amb", "load", "clog"] as const).forEach(k => { $("#tw-v-" + k, el).textContent = num(tw[k]); });
  const r = calc();
  const rtl = lang() === "ar";
  // chart: time on x (0..8 h), coolant °C on y, both linear and to scale
  const L = 52, Rr = 684, T0 = 18, B = 250;
  const { y0, y1, step } = yDomain(r.pts);
  const X = (h: number) => L + h / 8 * (Rr - L), Y = (v: number) => B - (v - y0) / (y1 - y0) * (B - T0);
  // the limit label sits at whichever end of the chart is away from the derate label
  const limLeft = r.derateAt == null || X(r.derateAt) > L + 260;
  let g = `<rect class="over" x="${L}" y="${T0}" width="${Rr - L}" height="${Y(LIMIT) - T0}"/>`;
  for (let v = y0; v <= y1; v += step) g += `<line class="gl" x1="${L}" y1="${Y(v)}" x2="${Rr}" y2="${Y(v)}"/><text class="tick" x="${L - 8}" y="${Y(v) + 3.5}" text-anchor="end">${v}°</text>`;
  for (let h = 0; h <= 8; h += 2) g += `<line class="gx" x1="${X(h)}" y1="${B}" x2="${X(h)}" y2="${B + 5}"/><text class="tick" x="${X(h)}" y="${B + 20}" text-anchor="middle">T+${h}h</text>`;
  g += `<line class="axis" x1="${L}" y1="${B}" x2="${Rr}" y2="${B}"/>`;
  g += `<line class="lim" x1="${L}" y1="${Y(LIMIT)}" x2="${Rr}" y2="${Y(LIMIT)}"/><text class="limT" x="${limLeft ? L + 6 : Rr - 6}" y="${Y(LIMIT) - 7}" ${ta(limLeft ? "l" : "r")}>${esc(tx(A("حد خفض القدرة 105°", "derate limit 105°")))}</text>`;
  const line = r.pts.map(([h, v]) => `${X(h).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  g += `<polygon class="area" points="${X(0)},${B} ${line} ${X(8)},${B}"/><polyline class="cur" points="${line}"/>`;
  if (r.derateAt != null) {
    const dx = X(r.derateAt), lx = Math.min(Math.max(dx, L + 50), Rr - 50);
    g += `<line class="dv" x1="${dx}" y1="${Y(LIMIT)}" x2="${dx}" y2="${B}"/><circle class="dot" cx="${dx}" cy="${Y(LIMIT)}" r="5"/>`;
    g += `<text class="limT" x="${lx}" y="${Y(LIMIT) - 22}" ${ta("m")}>${esc(tx(A("خفض القدرة", "derate")))} \u2066T+${r.derateAt}h\u2069</text>`;
  }
  const svg = $("#twChart", el); svg.innerHTML = g;
  $("#twCap", el).textContent = tx({
    ar: `منحنى حرارة السائل خلال ٨ ساعات؛ الذروة ${num(r.peak)}°م؛ ${r.derateAt != null ? `خفض القدرة عند T+${num(r.derateAt)}h` : "لا خفض قدرة"}.`,
    en: `Coolant temperature over 8 hours; peak ${r.peak} °C; ${r.derateAt != null ? `derate at T+${r.derateAt}h` : "no derating"}.`,
  });

  const M: Array<[Bi, string, string]> = [
    [A("ذروة حرارة السائل", "Peak coolant"), r.peak + "°C", r.peak >= LIMIT ? "bad" : "ok"],
    [A("لحظة خفض القدرة", "Derate at"), r.derateAt != null ? "T+" + r.derateAt + "h" : "—", r.derateAt != null ? "bad" : "ok"],
    [A("هامش الأمان", "Safety margin"), Math.max(0, LIMIT - r.peak) + "°C", ""],
    [A("معامل التبريد", "Cooling factor"), String(COOL[tw.cool]), ""],
  ];
  $("#twM", el).innerHTML = M.map(([l, v, c]) => `<div class="tw-m ${c}"><span>${esc(tx(l))}</span><b class="n"><bdi dir="ltr">${esc(num(v))}</bdi></b></div>`).join("");

  const solved = isSolved(r);
  $("#twCase", el).innerHTML = `<span class="tag ${solved ? "good" : "warn"}">${esc(tx(solved ? A("✓ حُلّت", "✓ Solved") : A("… مفتوحة", "… Open")))}</span><p>${esc(solved
    ? tx({ ar: `أُعيد إنتاج العطل: حمل ${num(tw.load)}% وانسداد ${num(tw.clog)}% عند ${num(tw.amb)}°م. السبب الجذري المرجح: انسداد الفلتر بالغبار لا عطل المضخة. الأدلة على التوأم تتفق مع تقرير L02.`,
      en: `Failure reproduced: ${tw.load}% load and ${tw.clog}% clogging at ${tw.amb} °C. Likely root cause: dust-clogged filter, not the pump. The twin agrees with report L02.` })
    : tx(A("اضبط الحرارة على 48°م وارفع الانسداد حتى يعبر الخط الأحمر قبل T+2h.", "Set ambient to 48 °C and raise clogging until the line crosses red before T+2h.")))}</p>`;
  ai.set({ state: { r, solved } });
}

/* =====================================================================
   MISSION ENGINEERING · Shamal Storm
   ===================================================================== */
const plan: Plan = { assign: { W1: "deliver", M1: "deliver", B1: "watch", D1: "search" }, route: "wad" };
let result: SimResult | null = null;
let tS = 6;                 // time on the map, hours
let playing = false, raf = 0, last = 0;
let msRoot: HTMLElement | null = null;
let cache: { key: string; s: ReturnType<typeof O.createSim> } | null = null;

const TASK_N: Record<TaskKey, Bi> = { deliver: A("إيصال الإمدادات", "Deliver"), search: A("البحث عن القافلة", "Search"), watch: A("مراقبة الممر", "Watch") };
const ROUTE_N: Record<RouteKey, Bi> = { hwy: A("الطريق السريع · مكشوف", "Highway · exposed"), trk: A("مسار الكثبان · رمال", "Dune track · sand"), wad: A("الوادي · محمي جزئياً", "Wadi · partly sheltered") };
const ST_N: Partial<Record<UnitState, Bi>> = { stuck: A("عالق", "stuck"), down: A("ساقط", "down"), rtb: A("عودة", "RTB"), done: A("تم", "done"), search: A("يبحث", "searching"), station: A("يراقب", "on station") };
const EV_N = (k: EventKey, u = ""): Bi => ({
  stormBase: A("العاصفة بلغت القاعدة", "Storm reached base"), stormZone: A("العاصفة بلغت منطقة البحث", "Storm reached the search zone"),
  stormSta: A("العاصفة بلغت المحطة", "Storm reached the station"), road: A("الطريق السريع أُغلق تقريباً", "Highway nearly closed"),
  stuck: A(`${u} علق في الكثبان`, `${u} stuck in dunes`), down: A(`${u} سقط في العاصفة`, `${u} lost to the storm`),
  blind: A(`${u} أعمته العاصفة`, `${u} blinded by the storm`), rtb: A(`${u} عاد لنفاد التحمل`, `${u} returned, endurance out`),
  arrive: A(`${u} وصل القرية`, `${u} reached the village`), onSearch: A(`${u} في منطقة البحث`, `${u} in the search zone`),
  onStation: A(`${u} على المحطة`, `${u} on station`), found: A("عُثر على القافلة", "Convoy found"),
} as Record<EventKey, Bi>)[k] || A(k, k);
const GAP: Record<Gap, Bi> = {
  watch: A("فجوة: مراقبة مستمرة في العاصفة — درون محكم ضد الغبار طويل التحمل (الاحتياج الوطني N-02).", "Gap: continuous watch inside the storm — a dust-sealed long-endurance drone (national need N-02)."),
  dune: A("فجوة: عبور الرمال الناعمة — ضغط إطارات ذاتي أو مركبة ٨×٨ أخرى.", "Gap: soft-sand crossing — central tyre inflation or a second 8×8."),
  forecast: A("فجوة: توقع الطرق — دمج بيانات الطقس في تخطيط المسار.", "Gap: road forecasting — weather data in route planning."),
  launch: A("فجوة: إطلاق جوي سريع للبحث.", "Gap: fast air launch for search."),
};
const OBJ: Array<{ k: TaskKey; l: Bi }> = [
  { k: "deliver", l: A("طنّان من الإمدادات إلى القرية قبل T+5h", "Two tonnes of supplies to the village before T+5h") },
  { k: "search", l: A("إيجاد القافلة العالقة قبل T+3h", "Find the stranded convoy before T+3h") },
  { k: "watch", l: A("عيون فوق ممر الإغاثة", "Eyes above the relief corridor") },
];

const activePlan = (): Plan => ({ assign: Object.fromEntries(Object.entries(plan.assign).filter(([, v]) => v)) as Plan["assign"], route: plan.route });
/** Simulation state at time t (same stepping as the original: dt 0.02 h), advanced incrementally while playing. */
function simAt(time: number): SimState {
  const key = JSON.stringify(activePlan());
  if (!cache || cache.key !== key || cache.s.S.t > time + 1e-9) cache = { key, s: O.createSim(activePlan()) };
  const s = cache.s; while (s.S.t < time && !s.S.done) s.step(.02);
  return s.S;
}

function stopPlay() { playing = false; cancelAnimationFrame(raf); clearTimeout(raf); raf = 0; }

register("missions", {
  mount(el) {
    msRoot = el; stopPlay(); cache = null;
    head(el, A("هندسة المهام · L5", "Mission Engineering · L5"), A("عاصفة الشمال: خطّط، نفّذ، واكتشف ما ينقص", "Shamal Storm: plan, execute, find what is missing"),
      A("عاصفة تغلق الطرق واحداً بعد الآخر. قرية حدودية تحتاج طنَّين من الإمدادات قبل T+5h، قافلة عالقة يجب إيجادها قبل T+3h، وممر إغاثة يحتاج عيوناً فوقه. ستة أصول، ست ساعات. سيناريو تدريبي غير حقيقي.",
        "A storm closes roads one by one. A border village needs two tonnes of supplies before T+5h, a stranded convoy must be found before T+3h, and a relief corridor needs eyes above it. Six assets, six hours. A training scenario, not real."));
    el.insertAdjacentHTML("beforeend", `<div class="wrap ms">
      <div class="ms-mapcol">
        <figure class="ms-fig">
          <svg class="ms-map" id="msMap" viewBox="0 0 640 460" role="img" aria-labelledby="msCap"></svg>
          <figcaption id="msCap" class="sr"></figcaption>
        </figure>
        <div class="ms-time">
          <button class="btn ghost sm ms-play" type="button" id="msPlay" aria-pressed="false"></button>
          <label class="ms-range"><span class="n">T+0</span><input type="range" id="msT" min="0" max="60" value="${Math.round(tS * 10)}" aria-label="${esc(tx(A("زمن المحاكاة", "Simulation time")))}"><span class="n" id="msTL"></span></label>
        </div>
        <div class="ms-legend">
          <span><i class="k hwy"></i>${esc(tx(A("الطريق السريع", "Highway")))}</span>
          <span><i class="k trk"></i>${esc(tx(A("مسار الكثبان", "Dune track")))}</span>
          <span><i class="k wad"></i>${esc(tx(A("الوادي", "Wadi")))}</span>
          <span><i class="k zon"></i>${esc(tx(A("منطقة البحث", "Search zone")))}</span>
          <span><i class="k storm"></i>${esc(tx(A("جبهة العاصفة", "Storm front")))}</span>
          <span><i class="k ug"></i>${esc(tx(A("أصل بري", "Ground asset")))}</span>
          <span><i class="k ua"></i>${esc(tx(A("أصل جوي", "Air asset")))}</span>
        </div>
        <section class="ms-log"><h3 class="ms-h">${esc(tx(A("سجل الأحداث", "Event log")))}</h3><ol class="ms-evt" id="msEvt" aria-live="polite"></ol></section>
      </div>

      <div class="ms-side">
        <section class="panel">
          <h3>${esc(tx(A("الأسطول والمهام", "Fleet and tasks")))}</h3>
          <div class="ms-assets">${O.ASSETS.map(a => `<div class="ms-a"><span class="ms-code n">${esc(a.code)}</span><span class="ms-an"><b>${esc(a.n)}</b><small>${esc(lang() === "ar" ? a.ar : a.en)}</small></span>
            <select data-a="${a.id}" aria-label="${esc(a.n + " · " + tx(A("المهمة", "task")))}"><option value="">—</option>${O.TASKS.map(k => `<option value="${k.k}" ${plan.assign[a.id] === k.k ? "selected" : ""} ${!O.fits(a, k.k) ? "disabled" : ""}>${esc(tx(TASK_N[k.k]))}</option>`).join("")}</select></div>`).join("")}</div>
          <div class="field"><span id="msRouteL">${esc(tx(A("مسار الإيصال", "Delivery route")))}</span>
            <div class="seg ms-route" id="msRoute" role="group" aria-labelledby="msRouteL">${(Object.keys(ROUTE_N) as RouteKey[]).map(k => `<button type="button" aria-pressed="${plan.route === k}" data-r="${k}">${esc(tx(ROUTE_N[k]))}<small class="n">${esc(num(O.pathKm(k)))} km</small></button>`).join("")}</div></div>
          <button class="btn gold" type="button" id="msRun">${esc(tx(A("نفّذ الخطة", "Execute the plan")))}</button>
        </section>
        <section class="panel" id="msRes" aria-live="polite"></section>
      </div>
    </div>`);

    $$<HTMLSelectElement>(".ms-assets select", el).forEach(s => s.addEventListener("change", () => { plan.assign[s.dataset.a!] = (s.value || "") as TaskKey | ""; result = null; renderRes(); draw(); }));
    $$<HTMLButtonElement>("#msRoute button", el).forEach(b => b.addEventListener("click", () => {
      plan.route = b.dataset.r as RouteKey;
      $$("#msRoute button", el).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      result = null; renderRes(); draw();
    }));
    const range = $<HTMLInputElement>("#msT", el);
    range.addEventListener("input", () => { stopPlay(); tS = +range.value / 10; draw(); });
    $("#msPlay", el).addEventListener("click", () => { if (playing) { stopPlay(); draw(); } else play(); });
    $("#msRun", el).addEventListener("click", () => { result = O.simulate(activePlan()); renderRes(); draw(); ai.set({ object: "result", state: result }); });
    renderRes(); draw();
  },
  unmount() { stopPlay(); msRoot = null; cache = null; },
  insight(c): Insight {
    const role = A("مساعد المحاكاة", "Simulation assistant");
    const air = O.ASSETS.find(a => a.id === "B1")!.n;
    if (c.object === "result" && c.state) {
      const r: SimResult = c.state;
      return {
        role,
        lines: [
          { ar: `النتيجة ${num(r.total)}/100. ${r.watch.score < 85 ? "المراقبة تنهار عندما تصل العاصفة إلى المحطة (T+" + num(r.watch.blindAfter.toFixed(1)) + "h)." : ""} ${r.deliver.stuck.length ? r.deliver.stuck.join("، ") + " علق في الكثبان." : ""}`.trim(),
            en: `Score ${r.total}/100. ${r.watch.score < 85 ? "Watch collapses when the storm reaches the station (T+" + r.watch.blindAfter.toFixed(1) + "h)." : ""} ${r.deliver.stuck.length ? r.deliver.stuck.join(", ") + " stuck in dunes." : ""}`.trim() },
          { ar: `جرّب: الوادي للإيصال، ${air} للبحث، الدرونات للمراقبة المبكرة فقط.`, en: `Try: wadi for delivery, ${air} for search, drones for early watch only.` },
        ],
        actions: [{ label: t("toIdea"), run: missionToIdea }],
      };
    }
    return {
      role,
      lines: [
        A("حرّك شريط الزمن لترى جبهة العاصفة تتقدم من الشمال الغربي. الطريق السريع الأسرع لكنه أول ما يُغلق.", "Move the time slider to watch the front advance from the north-west. The highway is fastest and the first to close."),
        A("الدرونات تسقط داخل العاصفة؛ الطائرة تُعمى لكنها تبقى.", "Drones go down inside the storm; the aircraft is blinded but stays up."),
      ],
      actions: [{ label: A("نفّذ", "Execute"), run: () => { if (msRoot) $("#msRun", msRoot).click(); } }],
    };
  },
});

function play() {
  if (tS >= O.TMAX - 1e-9) tS = 0;
  playing = true;
  if (RM) {
    // reduced motion: advance in half-hour steps instead of a continuous sweep
    const tick = () => { if (!playing || !msRoot) return; tS = Math.min(O.TMAX, +(tS + .5).toFixed(2)); draw(); if (tS >= O.TMAX) { stopPlay(); draw(); } else raf = window.setTimeout(tick, 700); };
    draw(); raf = window.setTimeout(tick, 700); return;
  }
  last = performance.now();
  const frame = (now: number) => {
    if (!playing || !msRoot) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    tS = Math.min(O.TMAX, tS + dt * O.TMAX / 12); // six hours in twelve seconds
    draw();
    if (tS >= O.TMAX) { stopPlay(); draw(); return; }
    raf = requestAnimationFrame(frame);
  };
  draw(); raf = requestAnimationFrame(frame);
}

function missionToIdea() {
  const r = result; if (!r) return;
  ctx.state = { draft: {
    t: A("سد فجوة قدرة من سيناريو عاصفة الشمال", "Close a capability gap from the Shamal Storm scenario"),
    d: tx({
      ar: `من هندسة المهام: النتيجة ${r.total}/100 (إيصال ${r.deliver.score}، بحث ${r.search.score}، مراقبة ${r.watch.score}). ${r.gaps.map(k => GAP[k].ar).join(" ")}`,
      en: `From Mission Engineering: ${r.total}/100 (delivery ${r.deliver.score}, search ${r.search.score}, watch ${r.watch.score}). ${r.gaps.map(k => GAP[k].en).join(" ")}`,
    }),
    area: "air", ch: r.gaps.includes("watch") ? "N-02" : "",
  } };
  void go("lab");
}

function renderRes() {
  const el = msRoot; if (!el) return;
  const box = $("#msRes", el);
  const r = result;
  if (!r) {
    const w = Object.fromEntries(O.TASKS.map(k => [k.k, k.w]));
    box.innerHTML = `<div class="ph"><h3>${esc(tx(A("النتيجة", "Result")))}</h3><small class="mute">${esc(tx(A("ثلاثة أهداف", "Three objectives")))}</small></div>
      <ol class="ms-obj">${OBJ.map(o => `<li><span>${esc(tx(o.l))}</span><b class="n">${esc(num(Math.round(w[o.k] * 100)))}%</b></li>`).join("")}</ol>
      <p class="mute ms-hint">${esc(tx(A("نفّذ الخطة لترى النتيجة والفجوات.", "Execute the plan to see the result and the capability gaps.")))}</p>`;
    return;
  }
  const rows: Array<[Bi, number]> = [[A("الإيصال", "Delivery"), r.deliver.score], [A("البحث", "Search"), r.search.score], [A("المراقبة", "Watch"), r.watch.score]];
  box.innerHTML = `<div class="ph"><h3>${esc(tx(A("النتيجة", "Result")))}</h3><b class="ms-total n">${esc(num(r.total))}<small>/100</small></b></div>
    <div class="ms-dims">${rows.map(([l, v]) => `<div class="ms-dim"><span>${esc(tx(l))}</span><div class="bar ${v >= 85 ? "good" : v >= 50 ? "warn" : "crit"}" role="img" aria-label="${esc(tx(l))} ${v}/100"><i style="inline-size:${v}%"></i></div><b class="n">${esc(num(v))}</b></div>`).join("")}</div>
    <div class="ms-gaps"><h4 class="ms-h">${esc(tx(A("فجوات القدرة", "Capability gaps")))}</h4>${r.gaps.map(k => `<p class="ms-gap">${esc(tx(GAP[k]))}</p>`).join("") || `<p class="mute">${esc(tx(A("لا فجوات قدرة كبيرة في هذه الخطة.", "No major capability gaps in this plan.")))}</p>`}</div>
    <div><button class="btn sm" type="button" id="msIdea">${esc(t("toIdea"))}</button></div>`;
  $("#msIdea", box).addEventListener("click", missionToIdea);
}

/* map: uniform scale (1 map unit = 0.5 km), +x east, +z south, north up */
const SC = 1.8, CX = 13;
const MX = (x: number) => 320 + (x - CX) * SC, MY = (z: number) => 230 + z * SC;

function draw() {
  const el = msRoot; if (!el) return;
  const svg = $("#msMap", el);
  $("#msTL", el).textContent = "T+" + num(tS.toFixed(1)) + "h";
  const range = $<HTMLInputElement>("#msT", el); range.value = String(Math.round(tS * 10));
  range.setAttribute("aria-valuetext", "T+" + tS.toFixed(1) + "h");
  const pb = $("#msPlay", el);
  pb.setAttribute("aria-pressed", String(playing));
  pb.innerHTML = `<svg class="i" viewBox="0 0 20 20" aria-hidden="true">${playing ? '<path d="M7 5v10M13 5v10"/>' : '<path d="M7 5l8 5-8 5z"/>'}</svg>${esc(tx(playing ? A("إيقاف", "Pause") : A("شغّل العاصفة", "Play the storm")))}`;

  // storm front: the line perpendicular to the wind through stormAt(t); the storm lies behind it (north-west)
  const st = O.stormAt(tS), w = O.WIND, px = -w.z, pz = w.x, c = { x: w.x * st, z: w.z * st };
  const a = { x: c.x + px * 400, z: c.z + pz * 400 }, b = { x: c.x - px * 400, z: c.z - pz * 400 };
  let g = `<polygon class="storm" points="${MX(a.x)},${MY(a.z)} ${MX(b.x)},${MY(b.z)} ${MX(b.x - w.x * 600)},${MY(b.z - w.z * 600)} ${MX(a.x - w.x * 600)},${MY(a.z - w.z * 600)}"/>`;
  g += `<line class="front" x1="${MX(a.x)}" y1="${MY(a.z)}" x2="${MX(b.x)}" y2="${MY(b.z)}"/>`;
  for (const k of ["hwy", "trk", "wad", "zon"] as const) g += `<polyline class="route ${k}${k === plan.route ? " sel" : ""}" points="${O.PATHS[k].map(p => MX(p.x).toFixed(1) + "," + MY(p.z).toFixed(1)).join(" ")}"/>`;
  // site labels sit above-right, except the village (below-left) so unit labels at the nearby station never collide
  const lbl: Array<[{ x: number; z: number }, Bi, number, number, "l" | "r"]> = [[O.BASE, A("القاعدة", "BASE"), 9, -8, "l"], [O.VIL, A("القرية", "VILLAGE"), -10, 20, "r"], [O.ZONE, A("منطقة البحث", "SEARCH ZONE"), 9, -8, "l"], [O.STATION, A("محطة المراقبة", "WATCH"), 9, -8, "l"]];
  lbl.forEach(([p, n, dx, dy, an]) => { g += `<rect class="site" x="${MX(p.x) - 4.5}" y="${MY(p.z) - 4.5}" width="9" height="9" transform="rotate(45 ${MX(p.x)} ${MY(p.z)})"/><text class="site-t" x="${MX(p.x) + dx}" y="${MY(p.z) + dy}" ${ta(an)}>${esc(tx(n))}</text>`; });
  const S = simAt(tS);
  const seen = new Map<string, number>(); // stack labels of units sharing a spot
  S.U.forEach(u => {
    const spot = `${Math.round(MX(u.x) / 14)}:${Math.round(MY(u.z) / 14)}`; const k = seen.get(spot) || 0; seen.set(spot, k + 1);
    const faded = u.st === "down" || u.st === "stuck";
    const s = u.st !== "go" ? " · " + tx(ST_N[u.st] || A(u.st, u.st)) : "";
    g += `<g class="unit ${u.a.type}${faded ? " lost" : ""}"><circle cx="${MX(u.x).toFixed(1)}" cy="${MY(u.z).toFixed(1)}" r="${u.a.type === "a" ? 5 : 6}"/><text x="${(MX(u.x) + 9).toFixed(1)}" y="${(MY(u.z) + 17 + k * 14).toFixed(1)}" ${ta("l")}>${esc(u.a.n + s)}</text></g>`;
  });
  // title, north arrow and scale bar (20 km = 40 map units)
  g += `<text class="hud" x="14" y="24" ${ta("l")}>${esc(tx(A("جبهة العاصفة", "STORM FRONT")))} · T+${esc(num(tS.toFixed(1)))}h</text>`;
  g += `<g class="north" transform="translate(610 30)"><path d="M0 -14 L6 6 L0 2 L-6 6Z"/><text x="0" y="20" text-anchor="middle">N</text></g>`;
  const sb = 40 * SC;
  g += `<g class="scale" transform="translate(14 438)"><line x1="0" y1="0" x2="${sb}" y2="0"/><line x1="0" y1="-4" x2="0" y2="4"/><line x1="${sb / 2}" y1="-3" x2="${sb / 2}" y2="3"/><line x1="${sb}" y1="-4" x2="${sb}" y2="4"/><text x="${sb + 8}" y="4">20 km</text></g>`;
  svg.innerHTML = g;

  $("#msCap", el).textContent = tx({
    ar: `خريطة السيناريو عند T+${num(tS.toFixed(1))}h: القاعدة غرباً، القرية شرقاً، وجبهة العاصفة تتقدم من الشمال الغربي.`,
    en: `Scenario map at T+${tS.toFixed(1)}h: base to the west, village to the east, the storm front advancing from the north-west.`,
  });
  const evs = S.events.slice(-8);
  $("#msEvt", el).innerHTML = evs.length
    ? evs.map(e => `<li><span class="n">T+${esc(num(e.t.toFixed(1)))}h</span><span>${esc(tx(EV_N(e.k, e.u)))}</span></li>`).join("")
    : `<li class="mute"><span class="n">T+0.0h</span><span>${esc(tx(A("لا أحداث بعد", "No events yet")))}</span></li>`;
}

export {};
