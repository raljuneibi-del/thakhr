/* SADEEM Hangar · 02 Command Deck — the decision-grade view for the approving authority.
   Portfolio (domain × source type), the pipeline and its bottleneck, decisions, referrals pending,
   the six SADEEM × State indicators, national needs and open items. Records marked "example" are illustrative. */
import {
  $, $$, esc, t, tx, num, go, register, ai, head, icon, allIdeas, ctx, DB,
  CHALLENGES, SOURCES, DOMAINS, type Idea, type Text, type Bi,
} from "@/core";
import { FX } from "@/shell/fx";

type Sev = "crit" | "warn" | "";
interface DecItem { sev: Sev; title: Bi; sub: Bi; idea: Idea | null }

const L = (ar: string, en: string): Bi => ({ ar, en });
const contained = (i: Idea) => i.sens === "high" || DB.gate.some(g => g.idea === i.id && g.level === "high");
const title = (i: Idea) => contained(i) ? tx(L("سجل محتوى", "Contained record")) : tx(i.t);
const stage = (s: number): string => t("stage")[s] ?? "";

/** The seven open items for the approving authority (same list as SADEEM OS › Open items). */
export const OPEN_ITEMS: Bi[] = [
  L("الولاية القانونية وخط التبعية لمركز سديم", "SADEEM's legal mandate and reporting line"),
  L("المعايير الوطنية للتقييم وأوزانها", "National evaluation criteria and their weights"),
  L("مستويات التصنيف ومن يملك صلاحية الاحتواء", "Classification levels and who holds containment authority"),
  L("قائمة الجهات الوطنية المختصة وقنوات استلامها", "The list of competent national entities and their intake channels"),
  L("ملكية الفكرة وحقوق صاحبها عند الإحالة", "Idea ownership and the contributor's rights on referral"),
  L("تمويل التجارب والمتابعة", "Funding of experiments and follow-up"),
  L("المبادرات الوطنية المحتملة (غير حصرية)", "Possible national initiatives (non-exclusive)"),
];

let zoom: string | null = null;
const deck = { bottle: -1 };
let root: HTMLElement | null = null;

function openIdea(id: string) { ctx.state = { openIdea: id }; void go("lab"); }
function openOS(view: string) { ctx.state = { osView: view }; void go("os"); }

register("deck", {
  mount(el) {
    root = el;
    head(el, L("منصة القيادة · 02", "Command Deck · 02"), L("حالة الابتكار الوطني عالي الحساسية", "The state of national high-sensitivity innovation"),
      L("من المحفظة الوطنية إلى المجال إلى الفكرة. السجلات المعلَّمة «مثال» توضيحية، والمؤشرات مقترحة بانتظار الاعتماد الرسمي.",
        "From the national portfolio to domain to idea. Records marked 'example' are illustrative; indicators are proposed, pending official approval."));

    const domKeys = Object.keys(DOMAINS);
    el.insertAdjacentHTML("beforeend", `<div class="wrap dk">
      <div class="dkBar">
        <nav class="dkCrumb" aria-label="${esc(tx(L("النطاق", "Scope")))}"><span id="dkCrumb"></span></nav>
        <div class="seg dkScope" role="group" aria-label="${esc(tx(L("تصفية حسب المجال", "Filter by domain")))}">
          <button type="button" data-z="">${esc(t("all"))}</button>
          ${domKeys.map(d => `<button type="button" data-z="${d}">${esc(tx(DOMAINS[d]))}</button>`).join("")}
        </div>
      </div>
      <div class="stats dkStats" id="dkStats" aria-live="polite"></div>

      <div class="g2 dkRow dkMain">
        <section class="panel" aria-labelledby="dkPmH">
          <div class="ph"><h3 id="dkPmH">${esc(tx(L("المحفظة الوطنية", "National portfolio")))}</h3><small class="mute">${esc(tx(L("المجال × نوع المصدر", "domain × source type")))}</small></div>
          <div class="pmap" id="dkMap"></div>
          <p class="dkLegend"><i aria-hidden="true"></i>${esc(tx(L("الجزء الذهبي = سجلات محتواة؛ تُحتسب ولا يظهر محتواها", "Gold share = contained records; counted, never shown")))}</p>
        </section>
        <section class="panel" aria-labelledby="dkPiH">
          <div class="ph"><h3 id="dkPiH">${esc(tx(L("مسار سديم", "SADEEM pipeline")))}</h3><small class="mute" id="dkPipeN"></small></div>
          <ol class="pipe" id="dkPipe"></ol>
          <p class="pipeR" id="dkPipeR" aria-live="polite"></p>
          <p class="dkBottle" id="dkBottle"></p>
        </section>
      </div>

      <div class="g3 dkRow">
        <section class="panel"><div class="ph"><h3>${esc(tx(L("قرارات مطلوبة", "Decisions required")))}</h3><small class="mute" id="dkDecN"></small></div><div class="dec" id="dkDec"></div></section>
        <section class="panel"><div class="ph"><h3>${esc(tx(L("إحالات بانتظار القرار", "Referrals pending")))}</h3>
          <button type="button" class="btn quiet sm dkLink" data-os="referrals">${esc(tx(L("في نظام سديم", "In SADEEM OS")))}${icon("arrow", "i dir")}</button></div>
          <div class="refs" id="dkRefs"></div></section>
        <section class="panel"><div class="ph"><h3>${esc(tx(L("المخاطر والاختناقات", "Risks and bottlenecks")))}</h3></div><div class="dec" id="dkRisk"></div></section>
      </div>

      <section class="panel dkRow" aria-labelledby="dkValH">
        <div class="ph"><h3 id="dkValH">${esc(tx(L("سديم × الدولة", "SADEEM × the State")))}</h3><span class="proposed">${esc(t("proposed"))}</span></div>
        <div class="vals" id="dkVals"></div>
      </section>

      <div class="g2 dkRow dkLow">
        <section class="panel"><div class="ph"><h3>${esc(tx(L("احتياجات الدولة", "National needs")))}</h3><small class="mute">${esc(tx(L("أيام متبقية", "days left")))}</small></div><div class="needs" id="dkNeeds"></div></section>
        <section class="panel"><div class="ph"><h3>${esc(tx(L("البنود المفتوحة للجهة المعتمِدة", "Open items for the approving authority")))}</h3>
          <button type="button" class="btn quiet sm dkLink" data-os="open">${esc(tx(L("في نظام سديم", "In SADEEM OS")))}${icon("arrow", "i dir")}</button></div>
          <ol class="openL">${OPEN_ITEMS.map((o, k) => `<li><span class="n">${num(k + 1)}</span><b>${esc(tx(o))}</b><span class="tag warn">${esc(tx(L("بانتظار الاعتماد", "Pending approval")))}</span></li>`).join("")}</ol>
          <p class="note">${esc(tx(L("الإطار المفاهيمي لسديم لا يتضمن آليات تشغيلية. هذه البنود تُستكمل حصرياً بموافقة رسمية.", "The SADEEM concept contains no operational mechanisms. These items are completed exclusively with official approval.")))}</p>
        </section>
      </div>
    </div>`);

    $$<HTMLButtonElement>(".dkScope button", el).forEach(b => b.addEventListener("click", () => { zoom = b.dataset.z || null; render(); }));
    $$<HTMLButtonElement>("[data-os]", el).forEach(b => b.addEventListener("click", () => openOS(b.dataset.os!)));
    render();
  },
  unmount() { root = null; },
  insight(c) {
    const n = (c.state && c.state.n) || allIdeas().length;
    const b = deck.bottle;
    return {
      role: L("دعم القرار", "Decision support"),
      lines: [
        L(`${num(n)} فكرة في النطاق الحالي. ${b >= 0 ? `أبطأ محطة «${t("stage")[b]}»؛ أسرع تدخل: جلسة تقييم إضافية أو قالب معلومات أوضح للمحطة السابقة.` : ""}`,
          `${n} ideas in scope. ${b >= 0 ? `The slowest station is '${t("stage")[b]}'; fastest lever: an extra evaluation session or a clearer information template for the station before.` : ""}`),
        L("الجزء الذهبي في كل خانة = السجلات المحتواة؛ تُحتسب في الأرقام ولا يظهر محتواها.", "The gold part of each block = contained records; counted in the numbers, never shown."),
        L("مؤشرات «سديم × الدولة» مشتقة من الصفحة المفاهيمية ومقترحة للاعتماد.", "The SADEEM × State indicators are derived from the concept page and proposed for approval."),
      ],
      actions: [{ label: L("اذهب إلى الاختناق", "Go to the bottleneck"), run: () => void go("lab") }],
    };
  },
});

function render() {
  const el = root; if (!el) return;
  const all = allIdeas();
  const ideas = zoom ? all.filter(i => i.area === zoom) : all;

  // scope control
  $$<HTMLButtonElement>(".dkScope button", el).forEach(b => b.setAttribute("aria-pressed", String((b.dataset.z || null) === zoom)));
  $("#dkCrumb", el).innerHTML = zoom
    ? `<button type="button" class="dkUp">${esc(tx(L("المحفظة", "Portfolio")))}</button><i aria-hidden="true">›</i><b>${esc(tx(DOMAINS[zoom]))}</b>`
    : `<b>${esc(tx(L("المحفظة الوطنية", "National portfolio")))}</b>`;
  $(".dkUp", el)?.addEventListener("click", () => { zoom = null; render(); });

  // KPI row
  const dups = all.filter(i => i.dupOf).length + 3;
  const st: Array<[Bi, number, string]> = [
    [L("الأفكار المستلمة", "Ideas received"), ideas.length, ""],
    [L("آخر ٣٠ يوماً", "Last 30 days"), ideas.filter(i => i.days <= 30).length, ""],
    [L("ازدواجيات منعت", "Duplicates prevented"), dups, "good"],
    [L("محتواة", "Contained"), ideas.filter(contained).length, "warn"],
    [L("بانتظار الاعتماد", "Awaiting approval"), ideas.filter(i => i.st === 9).length, ""],
    [L("وُجّهت لجهات مختصة", "Routed to entities"), ideas.filter(i => i.st >= 10).length, "good"],
  ];
  const sEl = $("#dkStats", el);
  sEl.innerHTML = st.map(([l, v, c]) => `<div class="stat ${c}"><span>${esc(tx(l))}</span><b data-count="${v}">${esc(num(v))}</b></div>`).join("");
  FX.count(sEl);

  drawMap(el, all);
  drawPipe(el, ideas);
  drawDec(el, ideas);
  drawRefs(el, ideas);
  drawVals(el, all);
  drawNeeds(el, all);
  ai.set({ object: zoom || "portfolio", state: { n: ideas.length } });
}

function drawMap(el: HTMLElement, all: Idea[]) {
  const srcs = Object.keys(SOURCES);
  $("#dkMap", el).innerHTML = Object.keys(DOMAINS).map(d => {
    const c = all.filter(i => i.area === d);
    const segs = srcs.map(sk => {
      const n = c.filter(i => i.src === sk).length; if (!n) return "";
      const cont = c.filter(i => i.src === sk && contained(i)).length;
      return `<span class="pseg" style="flex-grow:${n}">${cont ? `<span class="pcont" style="inline-size:${Math.max(8, cont / n * 100)}%"></span>` : ""}<em>${esc(tx(SOURCES[sk]))}</em><i>${num(n)}</i></span>`;
    }).join("");
    const on = zoom === d;
    return `<button type="button" class="pcol${on ? " on" : ""}" data-d="${d}" aria-pressed="${on}">
      <span class="pcolH"><b>${esc(tx(DOMAINS[d]))}</b><small>${num(c.length)} ${esc(tx(L("فكرة", "ideas")))}</small></span>
      <span class="pstack">${segs || `<span class="pnone">—</span>`}</span></button>`;
  }).join("");
  $$<HTMLButtonElement>("#dkMap .pcol", el).forEach(b => b.addEventListener("click", () => { const d = b.dataset.d!; zoom = zoom === d ? null : d; render(); }));
}

function drawPipe(el: HTMLElement, ideas: Idea[]) {
  const counts = Array.from({ length: 11 }, (_, s) => ideas.filter(i => i.st === s).length);
  const mx = Math.max(1, ...counts);
  const ages = Array.from({ length: 11 }, (_, s) => { const c = ideas.filter(i => i.st === s); return c.length ? c.reduce((a, i) => a + i.days, 0) / c.length : 0; });
  let bottle = -1, worst = 0;
  ages.forEach((a, s) => { if (s > 0 && s < 10 && a * counts[s] > worst) { worst = a * counts[s]; bottle = s; } });
  deck.bottle = bottle;

  const desc = (s: number) => tx(L(
    `المحطة ${num(s + 1)} · ${stage(s)} — ${num(counts[s])} فكرة${counts[s] ? `، متوسط العمر ${num(Math.round(ages[s]))} يوماً` : ""}`,
    `Station ${s + 1} · ${stage(s)} — ${counts[s]} ideas${counts[s] ? `, average age ${Math.round(ages[s])} days` : ""}`));

  $("#dkPipe", el).innerHTML = counts.map((c, s) =>
    `<li class="${s === bottle ? "bottle" : ""}${c ? "" : " zero"}" tabindex="0" data-s="${s}" aria-label="${esc(desc(s))}" title="${esc(stage(s))}">
      <span class="pv">${num(c)}</span><span class="pb" style="--v:${(c / mx).toFixed(3)}"></span><em>${num(s + 1)}</em></li>`).join("");
  $("#dkPipeN", el).textContent = `${num(ideas.length)} ${tx(L("فكرة عبر ١١ محطة", "ideas across 11 stations"))}`;
  const readout = $("#dkPipeR", el);
  const setR = (s: number) => { readout.textContent = s >= 0 ? desc(s) : ""; };
  setR(bottle);
  $$<HTMLElement>("#dkPipe li", el).forEach(li => {
    const s = +li.dataset.s!;
    li.addEventListener("pointerenter", () => setR(s));
    li.addEventListener("focus", () => setR(s));
  });
  $("#dkPipe", el).addEventListener("pointerleave", () => setR(bottle));

  $("#dkBottle", el).innerHTML = bottle >= 0
    ? `<span class="tag warn">${esc(tx(L("الاختناق", "Bottleneck")))}</span> ${esc(tx(L(
      `محطة «${stage(bottle)}» — متوسط العمر ${num(Math.round(ages[bottle]))} يوماً لـ${num(counts[bottle])} فكرة.`,
      `'${stage(bottle)}' — average age ${Math.round(ages[bottle])} days for ${counts[bottle]} ideas.`)))}`
    : "";
}

function decCard(d: DecItem) {
  const inner = `<b>${esc(tx(d.title))}</b><p>${esc(tx(d.sub))}</p>`;
  return d.idea
    ? `<button type="button" class="dcard ${d.sev}" data-i="${esc(d.idea.id)}">${inner}</button>`
    : `<article class="dcard ${d.sev}">${inner}</article>`;
}
const empty = (m: Text) => `<p class="dkEmpty">${esc(tx(m))}</p>`;

function drawDec(el: HTMLElement, ideas: Idea[]) {
  const d: DecItem[] = [], r: DecItem[] = [];
  ideas.filter(i => i.st === 9).forEach(i => d.push({ sev: "crit", title: L(`اعتماد إحالة: ${contained(i) ? "سجل محتوى" : i.t.ar}`, `Approve referral: ${contained(i) ? "contained record" : i.t.en}`), sub: L(`${i.id} · ${num(i.days)} يوماً`, `${i.id} · ${i.days} days`), idea: i }));
  ideas.filter(i => i.st === 6).forEach(i => d.push({ sev: "", title: L(`اختبار جدول الأفكار: ${contained(i) ? "سجل محتوى" : i.t.ar}`, `Idea-table test: ${contained(i) ? "contained record" : i.t.en}`), sub: L(`${i.id} · قبل الإحالة`, `${i.id} · before referral`), idea: i }));
  ideas.filter(i => i.days > 60 && i.st < 10).forEach(i => r.push({ sev: "warn", title: L(`فكرة متعثرة: ${contained(i) ? "سجل محتوى" : i.t.ar}`, `Stalled: ${contained(i) ? "contained record" : i.t.en}`), sub: L(`${num(i.days)} يوماً في «${t("stage")[i.st]}»`, `${i.days} days at '${t("stage")[i.st]}'`), idea: i }));
  if (deck.bottle >= 0) r.unshift({ sev: "crit", title: L(`اختناق في «${stage(deck.bottle)}»`, `Bottleneck at '${stage(deck.bottle)}'`), sub: L("سعة التقييم أو نقص المعلومات", "Evaluation capacity or missing information"), idea: null });
  r.push({ sev: "warn", title: L("بنود مفتوحة للجهة المعتمِدة", "Open items for the approving authority"), sub: L("المعايير الوطنية وأوزانها · قائمة الجهات المختصة · ملكية الفكرة عند الإحالة", "National criteria and weights · list of competent entities · IP ownership on referral"), idea: null });

  $("#dkDecN", el).textContent = d.length ? num(d.length) : "";
  $("#dkDec", el).innerHTML = d.slice(0, 4).map(decCard).join("") || empty(L("لا قرارات معلّقة في هذا النطاق.", "No decisions pending in this scope."));
  $("#dkRisk", el).innerHTML = r.slice(0, 4).map(decCard).join("") || empty("—");
  $$<HTMLButtonElement>(".dcard[data-i]", el).forEach(a => a.addEventListener("click", () => openIdea(a.dataset.i!)));
}

function drawRefs(el: HTMLElement, ideas: Idea[]) {
  const rf = ideas.filter(i => i.st >= 9).sort((a, b) => a.st - b.st || b.days - a.days);
  $("#dkRefs", el).innerHTML = rf.length ? `<ul>${rf.map(i => `<li><button type="button" data-i="${esc(i.id)}">
      <span class="rTop"><span class="mono">${esc(i.id)}</span>${i.sample ? `<span class="ex">${esc(tx(L("مثال", "example")))}</span>` : ""}<span class="tag ${i.st >= 10 ? "good" : "warn"}">${esc(stage(i.st))}</span></span>
      <b>${esc(title(i))}</b>
      <small>${esc(tx(L("الجهة المستلمة", "Receiving entity")))}: ${esc(i.entity ? tx(i.entity) : "—")}</small></button></li>`).join("")}</ul>`
    : empty(L("لا إحالات في هذا النطاق.", "No referrals in this scope."));
  $$<HTMLButtonElement>("#dkRefs [data-i]", el).forEach(a => a.addEventListener("click", () => openIdea(a.dataset.i!)));
}

function drawVals(el: HTMLElement, all: Idea[]) {
  const n = Math.max(1, all.length);
  const V: Array<[Bi, Bi, number]> = [
    [L("مركزية سيادية", "Sovereign centralisation"), L("نسبة الأفكار الواردة عبر البوابة الواحدة", "share received through the single door"), 100],
    [L("توحيد المرجعية", "Unified reference"), L("أفكار مرتبطة باحتياج وطني معلن", "ideas linked to a declared national need"), Math.round(all.filter(i => i.ch).length / n * 100)],
    [L("استباق وطني", "National anticipation"), L("أفكار وصلت قبل إعلان احتياج", "ideas that arrived before a need was declared"), Math.round(all.filter(i => !i.ch).length / n * 100)],
    [L("تقليل الهدر", "Less waste"), L("ازدواجيات منعت من إجمالي الوارد", "duplicates prevented of all received"), Math.round((all.filter(i => i.dupOf).length + 3) / n * 100)],
    [L("الاكتفاء الذاتي", "Self-sufficiency"), L("أفكار في التصنيع والإمداد المحلي", "ideas in local manufacturing and supply"), Math.round(all.filter(i => i.area === "mfg").length / n * 100)],
    [L("جودة المدخلات", "Input quality"), L("أفكار اجتازت التقييم الوطني", "ideas past national evaluation"), Math.round(all.filter(i => i.st >= 6).length / n * 100)],
  ];
  $("#dkVals", el).innerHTML = V.map(([h, d, v], k) => `<div class="val">
      <span class="vk">${num(k + 1)}</span>
      <div class="vt"><b>${esc(tx(h))}</b><small>${esc(tx(d))}</small></div>
      <b class="vv">${num(v)}<span>%</span></b>
      <div class="bar" role="img" aria-label="${esc(`${tx(h)}: ${num(v)}%`)}"><i style="width:${Math.min(100, v)}%"></i></div></div>`).join("");
}

function drawNeeds(el: HTMLElement, all: Idea[]) {
  $("#dkNeeds", el).innerHTML = CHALLENGES.map(c => {
    const n = all.filter(i => i.ch === c.id).length;
    return `<article class="need${c.due < 20 ? " soon" : ""}${n ? "" : " void"}">
      <div class="nTop"><span class="mono">${esc(c.id)}</span><b>${esc(tx(c.t))}</b></div>
      <p>${esc(tx(c.d))}</p>
      <div class="nMeta"><span>${esc(tx(c.sponsor))}</span>
        <span class="${c.due < 20 ? "due" : ""}">${num(c.due)} ${esc(tx(L("يوماً", "days")))}</span>
        <span>${num(n)} ${esc(tx(L("فكرة", "ideas")))}</span></div></article>`;
  }).join("");
}
