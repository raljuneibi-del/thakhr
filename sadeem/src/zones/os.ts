/* SADEEM Hangar · SADEEM OS — the daily work surface behind the facility.
   A module rail (a horizontal scroller on phones), boards, tables and editors over the same record set as the Hangar.
   Records marked "example" are illustrative; proposed items stay marked pending official approval. */
import {
  $, $$, esc, t, tx, num, go, register, ai, toast, allIdeas, ctx, DB, save, content, quotes, icon,
  CHALLENGES, SOURCES, DOMAINS, ENTITIES, type Idea, type Bi, type Text,
} from "@/core";
import { DRONE } from "@/engines/drone";
import { OPEN_ITEMS } from "./deck";

type View = "home" | "ideas" | "pipeline" | "challenges" | "experiments" | "referrals" | "entities" | "configs" | "achievements" | "gate" | "quotes" | "open";

const L = (ar: string, en: string): Bi => ({ ar, en });
const MODS: Array<[View, Bi]> = [
  ["home", L("الرئيسية", "Home")], ["ideas", L("قائمة الاستلام", "Intake queue")], ["pipeline", L("لوحة المسار", "Pipeline board")], ["challenges", L("احتياجات الدولة", "National needs")],
  ["experiments", L("التجارب والمتابعة", "Experiments & follow-up")], ["referrals", L("الإحالة والتوجيه", "Referrals & routing")], ["entities", L("الجهات المختصة", "Competent entities")], ["configs", L("التشكيلات الهندسية", "Engineering configs")], ["achievements", L("الإنجازات", "Achievements")],
  ["gate", L("سجل الاحتواء", "Vault log")], ["quotes", L("نظام محتوى الاقتباسات", "Quotes content system")], ["open", L("البنود المفتوحة", "Open items")],
];
const ZL: Array<[string, Bi]> = [
  ["lab", L("مسار سديم", "Pipeline Hall")], ["gate", L("قبو الاحتواء", "Containment Vault")], ["deck", L("منصة القيادة", "Command Deck")], ["bay", L("حظيرة المنصات", "Vehicle Bay")], ["drones", L("مختبر الدرونات", "Drone Lab")],
  ["factory", L("مصنع المستقبل", "Future Factory")], ["twins", L("التوائم الرقمية", "Digital Twins")], ["missions", L("المحاكاة", "Games & simulations")], ["library", L("المكتبة", "Library")], ["radar", L("الرادار", "Radar")],
];

const contained = (i: Idea) => i.sens === "high" || DB.gate.some(g => g.idea === i.id && g.level === "high");
/** Contained records are counted but never shown, except to their own contributor. */
const shown = (i: Idea) => contained(i) && !i.mine ? tx(L("سجل محتوى", "Contained record")) : tx(i.t);
const masked = (i: Idea) => contained(i) && !i.mine;
const stage = (s: number): string => t("stage")[s] ?? "";
const EX = () => `<span class="ex">${esc(tx(L("مثال", "example")))}</span>`;
const LEVEL: Record<string, Bi> = { high: L("محتواة", "Contained"), controlled: L("موجَّهة", "Controlled"), open: L("مفتوحة", "Open") };

let view: View = "home";
let q = "";
let dom = "";
let root: HTMLElement | null = null;

function openIdea(id: string) { ctx.state = { openIdea: id }; void go("lab"); }

/* ---------- small building blocks ---------- */
const H = (title: Text, meta = "", actions = "") =>
  `<header class="osH"><div class="osHt"><span class="kk">${esc(t("os"))}</span><h2 id="osTitle" tabindex="-1">${esc(tx(title))}</h2>${meta ? `<p class="osMeta">${meta}</p>` : ""}</div>${actions ? `<div class="osAct">${actions}</div>` : ""}</header>`;
const emptyState = (ic: string, title: Text, body: Text, action = "") =>
  `<div class="empty"><span class="emI" aria-hidden="true">${ic}</span><b>${esc(tx(title))}</b><p>${esc(tx(body))}</p>${action}</div>`;
const idBtn = (i: Idea) => `<button type="button" class="idB mono" data-i="${esc(i.id)}" title="${esc(tx(L("افتحها في الهانقر", "See it in the Hangar")))}">${esc(i.id)}</button>`;
const table = (heads: string[], rows: string, cls = "") =>
  `<div class="tblWrap osTbl ${cls}"><table><thead><tr>${heads.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
const days = (n: number) => `${num(n)} ${tx(L("يوماً", "d"))}`;

register("os", {
  mount(el) {
    root = el;
    const st = ctx.state || {};
    if (st.osView && MODS.some(m => m[0] === st.osView)) view = st.osView;
    el.innerHTML = `<aside class="rail" aria-label="${esc(t("os"))}"><div class="railIn" id="osRail"></div></aside><div class="osMain" id="osMain"></div>`;
    renderRail();
    renderMain(false);
  },
  unmount() { root = null; },
  insight(c) {
    const v = c.object;
    if (v === "quotes") return {
      role: L("محرر المحتوى", "Content editor"),
      lines: [L("ثلاثة تصريحات بحاجة إلى النص العربي الرسمي، واثنان بحاجة إلى رابط وام أو الحساب الرسمي. لا يُنشر نص بلغة ما لم يُلصق من المصدر الرسمي.",
        "Three statements need the official Arabic text and two need a WAM or official-account link. No language surface publishes until its text is pasted from the official source.")],
    };
    const ideas = allIdeas(); const old = ideas.filter(i => i.days > 60 && i.st < 9).length;
    return {
      role: L("مساعد نظام سديم", "SADEEM OS assistant"),
      lines: [L(`${num(ideas.length)} فكرة، ${num(old)} منها متعثرة أكثر من ٦٠ يوماً. اضغط ⌘K للانتقال إلى أي منطقة أو فكرة.`,
        `${ideas.length} ideas, ${old} stalled over 60 days. Press ⌘K to jump to any zone or idea.`)],
    };
  },
});

/* ---------- rail ---------- */
function renderRail() {
  const el = root; if (!el) return;
  const count = (k: View) => k === "ideas" ? allIdeas().length : k === "gate" ? DB.gate.length : null;
  $("#osRail", el).innerHTML = `
    <p class="railH"><span>${esc(t("os"))}</span></p>
    <nav class="railMods" aria-label="${esc(tx(L("وحدات النظام", "OS modules")))}">${MODS.map(([k, l]) => {
      const n = count(k);
      return `<button type="button" data-v="${k}" ${view === k ? `aria-current="page"` : ""}><span>${esc(tx(l))}</span>${n != null ? `<small>${num(n)}</small>` : ""}</button>`;
    }).join("")}</nav>
    <p class="railH railHz"><span>${esc(t("hangar"))}</span></p>
    <nav class="railZones" aria-label="${esc(t("hangar"))}">${ZL.map(([z, l]) => `<button type="button" data-z="${z}"><span>${esc(tx(l))}</span>${icon("arrow", "i dir")}</button>`).join("")}</nav>
    <label class="railSel"><span class="sr">${esc(tx(L("اذهب إلى الهانقر", "Go to the Hangar")))}</span>
      <select id="osJump"><option value="">${esc(t("hangar"))} ↗</option>${ZL.map(([z, l]) => `<option value="${z}">${esc(tx(l))}</option>`).join("")}</select></label>`;
  $$<HTMLButtonElement>("[data-v]", el).forEach(b => b.addEventListener("click", () => {
    if (view === b.dataset.v) return;
    view = b.dataset.v as View; q = ""; dom = "";
    renderRail(); renderMain(true);
  }));
  $$<HTMLButtonElement>("[data-z]", el).forEach(b => b.addEventListener("click", () => void go(b.dataset.z!)));
  $<HTMLSelectElement>("#osJump", el).addEventListener("change", e => { const v = (e.target as HTMLSelectElement).value; if (v) void go(v); });
  // keep the active module visible in the phone scroller
  const cur = $<HTMLElement>(".railMods [aria-current]", el);
  const rail = $<HTMLElement>(".rail", el);
  if (cur && rail && rail.scrollWidth > rail.clientWidth + 2) {
    const rr = rail.getBoundingClientRect(), cr = cur.getBoundingClientRect();
    rail.scrollLeft += (cr.left + cr.width / 2) - (rr.left + rr.width / 2);
  }
}

/* ---------- main ---------- */
function renderMain(focus: boolean) {
  const el = root; if (!el) return;
  const m = $("#osMain", el);
  const ideas = allIdeas();
  m.dataset.v = view;
  m.innerHTML = VIEWS[view](ideas);
  wire(m);
  if (focus) {
    const top = el.getBoundingClientRect().top;
    if (top < 0) window.scrollTo({ top: window.scrollY + top, behavior: "auto" });
    $<HTMLElement>("#osTitle", m)?.focus({ preventScroll: true });
  }
  ai.set({ object: view });
}

function wire(m: HTMLElement) {
  $$<HTMLButtonElement>("[data-i]", m).forEach(b => b.addEventListener("click", () => openIdea(b.dataset.i!)));
  $$<HTMLButtonElement>("[data-go]", m).forEach(b => b.addEventListener("click", () => void go(b.dataset.go!)));
  $$<HTMLButtonElement>("[data-mod]", m).forEach(b => b.addEventListener("click", () => { view = b.dataset.mod as View; renderRail(); renderMain(true); }));
  // board filters
  const qi = $<HTMLInputElement>("#osQ", m);
  if (qi) qi.addEventListener("input", () => { q = qi.value; refreshBoard(m); });
  $$<HTMLButtonElement>("[data-dom]", m).forEach(b => b.addEventListener("click", () => {
    dom = b.dataset.dom || "";
    $$<HTMLButtonElement>("[data-dom]", m).forEach(x => x.setAttribute("aria-pressed", String((x.dataset.dom || "") === dom)));
    refreshBoard(m);
  }));
  // quotes editor
  const qs = $<HTMLButtonElement>("#qSave", m);
  if (qs) {
    qs.addEventListener("click", () => {
      const o: Record<string, Record<string, string>> = {};
      $$<HTMLTextAreaElement>("textarea[data-q]", m).forEach(x => { (o[x.dataset.q!] ||= {})[x.dataset.f!] = x.value.trim(); });
      DB.quotesOverride = o; save();
      $("#qState", m).textContent = "";
      toast(L("حُفظت النصوص. تظهر على الأسطح فوراً.", "Saved. The surfaces show them now."));
    });
    $<HTMLButtonElement>("#qReset", m).addEventListener("click", () => { DB.quotesOverride = null; save(); renderMain(false); });
    $$<HTMLTextAreaElement>("textarea[data-q]", m).forEach(x => x.addEventListener("input", () => {
      $("#qState", m).textContent = tx(L("تعديلات غير محفوظة", "Unsaved changes"));
    }));
  }
}

/* ---------- boards (intake queue, pipeline) ---------- */
function boardCols(): Array<[number, string]> {
  return view === "pipeline"
    ? (t("stage") as string[]).map((s, k) => [k, s] as [number, string])
    : [[0, tx(L("مستلمة", "Received"))], [1, tx(L("تصنيف وتنقية", "Classify & filter"))], [3, tx(L("احتواء", "Containment"))], [4, tx(L("تنظيم وتقييم", "Organise & evaluate"))], [6, tx(L("اختبار وتجربة", "Test & experiment"))], [9, tx(L("إحالة وتوجيه", "Refer & route"))]];
}
function filtered(ideas: Idea[]) {
  const s = q.trim().toLowerCase();
  return ideas.filter(i => (!dom || i.area === dom) && (!s || i.id.toLowerCase().includes(s) || (!masked(i) && (i.t.ar + " " + i.t.en).toLowerCase().includes(s))));
}
function boardHTML(ideas: Idea[]) {
  const cols = boardCols();
  const ks = cols.map(c => c[0]);
  const bucket = (k: number) => view === "pipeline"
    ? ideas.filter(i => i.st === k)
    : ideas.filter(i => { const idx = ks.findIndex((v, j) => i.st >= v && (j === ks.length - 1 || i.st < ks[j + 1])); return ks[idx] === k; });
  return cols.map(([k, l], ci) => {
    const c = bucket(k);
    return `<section class="col" aria-label="${esc(l)}"><h3><span class="cn">${num(view === "pipeline" ? k + 1 : ci + 1)}</span><span class="ct">${esc(l)}</span><span class="cc">${num(c.length)}</span></h3>
      <div class="cards">${c.map(i => `<button type="button" class="card${masked(i) ? " masked" : ""}" data-i="${esc(i.id)}">
        <span class="cTop"><span class="mono">${esc(i.id)}</span>${i.sample ? EX() : ""}${masked(i) ? icon("lock", "i lk") : ""}</span>
        <b>${esc(shown(i))}</b>
        <span class="cFoot"><span>${esc(tx(DOMAINS[i.area]) || String(i.area))}</span><span>${days(i.days)}</span></span></button>`).join("") || `<p class="colE">—</p>`}</div></section>`;
  }).join("");
}
function refreshBoard(m: HTMLElement) {
  const f = filtered(allIdeas());
  $("#osKan", m).innerHTML = boardHTML(f);
  $("#osKanN", m).textContent = `${num(f.length)} ${tx(L("فكرة", "ideas"))}`;
  $$<HTMLButtonElement>("#osKan [data-i]", m).forEach(b => b.addEventListener("click", () => openIdea(b.dataset.i!)));
}

const VIEWS: Record<View, (ideas: Idea[]) => string> = {
  home(ideas) {
    const mine = DB.ideas;
    const stalled = ideas.filter(i => i.days > 60 && i.st < 9);
    const S: Array<[Bi, number]> = [
      [L("أفكاري", "My ideas"), mine.length], [L("تتقدّم", "Moving"), mine.filter(i => i.st > 0).length], [L("احتياجات معلنة", "Declared needs"), CHALLENGES.length],
      [L("تشكيلات محفوظة", "Saved configs"), DB.drones.length], [L("محتواة", "Contained"), DB.gate.filter(g => g.level === "high").length], [L("بانتظار الاعتماد", "Awaiting approval"), ideas.filter(i => i.st === 9).length],
    ];
    const kind = (k: string) => { const th = (content.library?.themes || []).find((y: any) => y.k === k); return th ? tx(th) : k; };
    const lib: any[] = (content.library?.items || []).filter((x: any) => ["bulletin", "case", "video"].includes(x.k));
    return H(L("عملي اليوم", "My work today"))
      + `<div class="stats osStats">${S.map(([l, v]) => `<div class="stat"><span>${esc(tx(l))}</span><b>${num(v)}</b></div>`).join("")}</div>
      <div class="osHome">
        <div class="stack osCol">
          <section class="panel"><div class="ph"><h3>${esc(tx(L("إجراءات سريعة", "Quick actions")))}</h3></div>
            <div class="row qa"><button type="button" class="btn sm" data-go="lab">${esc(tx(L("قدّم فكرة", "Submit an idea")))}</button><button type="button" class="btn ghost sm" data-go="drones">${esc(tx(L("صمّم درون", "Design a drone")))}</button><button type="button" class="btn ghost sm" data-go="missions">${esc(tx(L("شغّل محاكاة", "Run a simulation")))}</button><button type="button" class="btn ghost sm" data-go="deck">${esc(tx(L("منصة القيادة", "Command Deck")))}</button></div></section>
          <section class="panel"><div class="ph"><h3>${esc(tx(L("أفكاري", "My ideas")))}</h3>${mine.length ? `<small class="mute">${num(mine.length)}</small>` : ""}</div>
            ${mine.length ? `<div class="ideaList">${mine.slice(0, 6).map(i => `<button type="button" class="ideaRow" data-i="${esc(i.id)}"><span class="mono">${esc(i.id)}</span><span class="irT"><b>${esc(tx(i.t))}</b><small>${esc(stage(i.st))}</small></span><span class="tag sov">${num(i.st + 1)}/${num(11)}</span></button>`).join("")}</div>`
              : emptyState(icon("spark"), L("لم تقدّم فكرة بعد", "No ideas yet"), L("لم تقدّم فكرة بعد. رحلتك تبدأ بملاحظة واحدة.", "No ideas yet. Your journey starts with one observation."), `<button type="button" class="btn sm" data-go="lab">${esc(tx(L("قدّم فكرة", "Submit an idea")))}</button>`)}
          </section>
          <section class="panel"><div class="ph"><h3>${esc(tx(L("متعثرة أكثر من ٦٠ يوماً", "Stalled over 60 days")))}</h3><small class="mute">${num(stalled.length)}</small></div>
            ${stalled.length ? `<div class="ideaList">${stalled.map(i => `<button type="button" class="ideaRow" data-i="${esc(i.id)}"><span class="mono">${esc(i.id)}</span><span class="irT"><b>${esc(shown(i))}</b><small>${esc(stage(i.st))}${i.sample ? " · " + esc(tx(L("مثال", "example"))) : ""}</small></span><span class="tag warn">${days(i.days)}</span></button>`).join("")}</div>`
              : `<p class="mute">—</p>`}
          </section>
        </div>
        <section class="panel"><div class="ph"><h3>${esc(tx(L("نشرات سديم", "SADEEM bulletins")))}</h3><button type="button" class="btn quiet sm" data-go="library">${esc(tx(L("المكتبة", "Library")))}${icon("arrow", "i dir")}</button></div>
          <div class="bulls">${lib.map(x => `<article><span class="tag">${esc(kind(x.k))}</span><b>${esc(tx(x))}</b><p>${esc(tx(x.sum))}</p></article>`).join("") || `<p class="mute">—</p>`}</div></section>
      </div>`;
  },

  ideas: board,
  pipeline: board,

  challenges(ideas) {
    return H(L("احتياجات الدولة", "National needs"), `${num(CHALLENGES.length)} ${esc(tx(L("احتياج معلن", "declared needs")))} · ${esc(tx(L("أمثلة توضيحية", "illustrative examples")))}`)
      + table(["ID", tx(L("الاحتياج", "Need")), tx(L("الجهة", "Entity")), tx(L("الأفكار", "Ideas")), tx(L("المتبقي", "Days left"))],
        CHALLENGES.map(c => { const n = ideas.filter(i => i.ch === c.id).length; return `<tr><td class="mono">${esc(c.id)}</td><td class="wide"><b>${esc(tx(c.t))}</b><span class="sub">${esc(tx(c.d))}</span></td><td>${esc(tx(c.sponsor))}</td><td class="num">${n ? num(n) : `<span class="tag crit">${num(0)}</span>`}</td><td class="num"><span class="${c.due < 20 ? "tag warn" : ""}">${num(c.due)}</span></td></tr>`; }).join(""), "tNeeds");
  },

  experiments(ideas) {
    const ex = ideas.filter(i => i.st >= 7 && i.st <= 8);
    return H(L("التجارب والمتابعة", "Experiments & follow-up"), `${num(ex.length)} ${esc(tx(L("فكرة في التجربة أو المتابعة", "ideas in experiment or follow-up")))}`)
      + (ex.length ? table(["ID", tx(L("الفكرة", "Idea")), tx(L("المرحلة", "Stage")), tx(L("الأيام", "Days")), tx(L("المالك", "Owner"))],
        ex.map(i => `<tr><td>${idBtn(i)}</td><td class="wide">${esc(shown(i))}${i.sample ? " " + EX() : ""}</td><td><span class="tag ${i.st >= 9 ? "good" : "sov"}">${esc(stage(i.st))}</span></td><td class="num">${num(i.days)}</td><td>${esc(tx(SOURCES[i.src] || i.owner))}</td></tr>`).join(""))
        : emptyState(icon("tour"), L("لا تجارب جارية", "No experiments running"), L("تظهر هنا الأفكار في محطتي التجربة والمتابعة.", "Ideas at the experiment and follow-up stations appear here.")));
  },

  referrals(ideas) {
    const rf = ideas.filter(i => i.st >= 9);
    return H(L("الإحالة والتوجيه", "Referrals & routing"), `<span class="proposed">${esc(t("proposed"))}</span>`)
      + (rf.length ? table(["ID", tx(L("الفكرة", "Idea")), tx(L("الحالة", "Status")), tx(L("الجهة المستلمة", "Receiving entity"))],
        rf.map(i => `<tr><td>${idBtn(i)}</td><td class="wide">${esc(contained(i) ? tx(L("سجل محتوى", "Contained record")) : tx(i.t))}${i.sample ? " " + EX() : ""}</td><td><span class="tag ${i.st >= 10 ? "good" : "warn"}">${esc(stage(i.st))}</span></td><td>${esc(i.entity ? tx(i.entity) : "—")}</td></tr>`).join(""))
        : emptyState(icon("arrow"), L("لا إحالات بعد", "No referrals yet"), L("تظهر هنا الأفكار عند محطتي الإحالة والتوجيه.", "Ideas at the referral and routing stations appear here.")));
  },

  entities(ideas) {
    return H(L("الجهات الوطنية المختصة", "Competent national entities"))
      + `<p class="lead osLead">${esc(tx(L("لم تُسمَّ الجهات في الإطار المفاهيمي. تُستخدم أنواع الجهات هنا إلى أن تُعتمد القائمة رسمياً.", "The concept names no entities. Entity types are used here until the list is officially approved.")))}</p>
      <div class="tiles">${ENTITIES.map(e => { const n = ideas.filter(i => i.entity && i.entity.en === e.en).length; return `<div class="tile"><span class="tIc" aria-hidden="true">${icon("grid")}</span><b>${esc(tx(e))}</b><small><span class="n">${num(n)}</span> ${esc(tx(L("إحالة", "referrals")))}</small></div>`; }).join("")}</div>`;
  },

  configs() {
    const rows = DB.drones.map((d: any) => {
      let r: ReturnType<typeof DRONE.compute> | null = null;
      try { r = DRONE.compute(d.cfg || {}); } catch { r = null; }
      const parts = DRONE.G.filter(g => !(g.onlyVtol && d.cfg?.airframe !== "vtol")).map(g => { const o = g.o.find(x => x.k === d.cfg?.[g.k]); return o ? tx(o.n) : d.cfg?.[g.k]; }).filter(Boolean);
      const mis = DRONE.MISSIONS.find(x => x.k === d.mission);
      return `<tr><td class="mono">${esc(d.id)}</td><td class="wide cfg">${esc(parts.join(" · "))}</td><td>${esc(mis ? tx(mis.n) : "—")}</td><td class="num">${r ? `${num(r.mass)} kg` : "—"}</td><td class="num">${r ? `${num(r.end)} min` : "—"}</td></tr>`;
    }).join("");
    return H(L("التشكيلات الهندسية", "Engineering configurations"), DB.drones.length ? `${num(DB.drones.length)} · <span>${esc(t("training"))}</span>` : "")
      + (DB.drones.length ? table(["ID", tx(L("التشكيلة", "Configuration")), tx(L("المهمة", "Mission")), tx(L("الكتلة", "Mass")), tx(L("التحمل", "Endurance"))], rows)
        : emptyState(icon("spark"), L("لا تشكيلات محفوظة", "No saved configurations"), L("احفظ تشكيلة من مختبر الدرونات لتظهر هنا.", "Save a configuration in the Drone Lab and it appears here."), `<button type="button" class="btn sm" data-go="drones">${esc(t("z_drones"))}</button>`));
  },

  achievements() {
    const mine = DB.ideas, gates = DB.gate;
    const B: Array<[Bi, Bi, boolean]> = [
      [L("أول ملاحظة", "First observation"), L("قدّم فكرة واحدة", "Submit one idea"), mine.length >= 1],
      [L("مهندس المهام", "Mission engineer"), L("حوّل نتيجة محاكاة إلى فكرة", "Turn a simulation into an idea"), mine.some(i => /From|من /.test(i.d || ""))],
      [L("معماري الدرونات", "Drone architect"), L("احفظ تشكيلة درون", "Save a drone configuration"), DB.drones.length >= 1],
      [L("حارس السيادة", "Sovereignty keeper"), L("أكّد تصنيف فكرة في قبو الاحتواء", "Confirm a classification in the vault"), gates.some(g => g.by === "human-confirmed")],
      [L("البوابة الأولى", "First gate"), L("انقل فكرة إلى المحطة التالية", "Move an idea to the next station"), mine.some(i => i.st > 0)],
      [L("قدرة وطنية", "National capability"), L("فكرة تُوجَّه إلى جهة مختصة", "An idea routed to a competent entity"), mine.some(i => i.st >= 10)],
    ];
    const got = B.filter(b => b[2]).length;
    return H(L("الإنجازات", "Achievements"), `${num(got)} / ${num(B.length)}`)
      + `<p class="lead osLead">${esc(tx(L("الأوسمة تكافئ المساهمة في المسار الوطني، لا النقرات.", "Badges reward contribution to the national pipeline, not clicks.")))}</p>
      <div class="tiles">${B.map(([n, d, on]) => `<div class="tile ach${on ? " on" : ""}"><span class="tag ${on ? "sov" : ""}">${on ? "✓" : "—"}</span><b>${esc(tx(n))}</b><small>${esc(tx(d))}</small></div>`).join("")}</div>`;
  },

  gate() {
    return H(L("سجل الاحتواء", "Vault log"), `${num(DB.gate.length)} ${esc(tx(L("قيد", "entries")))}`, `<button type="button" class="btn ghost sm" data-go="gate">${esc(t("z_gate"))}${icon("arrow", "i dir")}</button>`)
      + `<p class="note osNote">${esc(tx(L("المحتوى محجوب؛ يظهر المرجع والمستوى والحالة فقط.", "Content withheld; only reference, level and status are shown.")))}</p>`
      + (DB.gate.length ? table([tx(L("المرجع", "Ref")), tx(L("الفكرة", "Idea")), tx(L("المستوى", "Level")), tx(L("بواسطة", "By")), tx(L("التاريخ", "Date"))],
        DB.gate.map(g => `<tr><td class="mono">${esc(g.ref)}</td><td class="mono">${esc(g.idea)}</td><td><span class="tag ${g.level === "high" ? "warn" : g.level === "controlled" ? "sov" : "good"}">${esc(LEVEL[g.level] ? tx(LEVEL[g.level]) : g.level)}</span></td><td>${esc(g.by === "human-confirmed" ? tx(L("تأكيد بشري", "Human-confirmed")) : tx(L("فحص آلي", "Automatic screen")))}</td><td class="mono">${esc(new Date(g.at).toISOString().slice(0, 10))}</td></tr>`).join(""))
        : emptyState(icon("lock"), L("السجل فارغ", "The log is empty"), L("كل تصنيف يُؤكَّد في قبو الاحتواء يُسجَّل هنا بمرجعه ومستواه.", "Every classification confirmed in the Containment Vault is logged here with its reference and level.")));
  },

  quotes() {
    const qs = quotes();
    return H(L("نظام محتوى الاقتباسات", "Quotes content system"), `${num(qs.length)} ${esc(tx(L("تصريحات", "statements")))}`)
      + `<p class="lead osLead">${esc(tx(L("كل اقتباس يُنشر فقط إذا وُثّق بمصدر رسمي. النص العربي والإنجليزي يُلصقان حرفياً من الصفحة الرسمية؛ لا ترجمة آلية.", "A statement publishes only when verified against an official source. Arabic and English are pasted verbatim from the official page; no machine translation.")))}</p>
      <div class="qlist">${qs.map((x: any) => `<section class="panel qcard" aria-labelledby="qh-${esc(x.id)}">
        <div class="ph"><h3 id="qh-${esc(x.id)}"><span class="mono">${esc(x.id)}</span> · ${esc(tx(x.leader))}</h3><span class="tag ${x.verification === "verified" ? "good" : "warn"}">${esc(x.verification)}</span></div>
        <div class="g2 qform">
          <div class="field"><label for="qt-${esc(x.id)}-en">English (official)</label><textarea id="qt-${esc(x.id)}-en" data-q="${esc(x.id)}" data-f="en" dir="ltr" lang="en" placeholder="${esc(x.en ? "" : "—")}">${esc(x.en)}</textarea></div>
          <div class="field"><label for="qt-${esc(x.id)}-ar">العربية (الرسمية)</label><textarea id="qt-${esc(x.id)}-ar" data-q="${esc(x.id)}" data-f="ar" dir="rtl" lang="ar" placeholder="${esc(x.ar ? "" : tx(L("النص العربي الرسمي يُضاف من الصفحة الرسمية قبل النشر", "Official Arabic text is added from the official page before publication")))}">${esc(x.ar)}</textarea></div>
        </div>
        <div class="kv qkv"><span>${esc(tx(L("التاريخ · السياق", "Date · context")))}</span><b><span class="mono">${esc(x.date)}</span> · ${esc(tx(x.context))}</b>
          <span>${esc(t("source"))}</span><b><a href="${esc(x.sourceUrl)}" target="_blank" rel="noopener">${esc(x.source)}</a>${x.sourceUrlAr ? ` · <a href="${esc(x.sourceUrlAr)}" target="_blank" rel="noopener" lang="ar">العربية</a>` : ""}</b>
          <span>${esc(tx(L("المنطقة · الميزة · العمود", "Zone · feature · pillar")))}</span><b class="mono">${esc(x.zone)} · ${esc(x.osFeature)} · ${esc(x.pillar)}</b></div>
        ${x.note ? `<p class="note">${esc(x.note)}</p>` : ""}</section>`).join("")}</div>
      <div class="qbar"><span class="mute" id="qState" aria-live="polite"></span><button type="button" class="btn ghost sm" id="qReset">${esc(t("reset"))}</button><button type="button" class="btn sm" id="qSave">${esc(t("save"))}</button></div>`;
  },

  open() {
    return H(L("البنود المفتوحة للجهة المعتمِدة", "Open items for the approving authority"), `${num(OPEN_ITEMS.length)} ${esc(tx(L("بنود", "items")))}`)
      + `<p class="lead osLead">${esc(tx(L("الإطار المفاهيمي لسديم لا يتضمن آليات تشغيلية. هذه البنود تُستكمل حصرياً بموافقة رسمية.", "The SADEEM concept contains no operational mechanisms. These items are completed exclusively with official approval.")))}</p>
      <ol class="oitems">${OPEN_ITEMS.map((l, k) => `<li><span class="oN">${num(k + 1)}</span><b>${esc(tx(l))}</b><span class="tag warn">${esc(tx(L("الحالة: بانتظار الاعتماد", "Status: pending approval")))}</span></li>`).join("")}</ol>`;
  },
};

function board(ideas: Idea[]) {
  const f = filtered(ideas);
  const title = MODS.find(x => x[0] === view)![1];
  return H(title, `<span id="osKanN">${num(f.length)} ${esc(tx(L("فكرة", "ideas")))}</span> · ${num(boardCols().length)} ${esc(tx(view === "pipeline" ? L("محطة", "stations") : L("أعمدة", "columns")))}`)
    + `<div class="osTools">
      <label class="osSearch">${icon("search")}<span class="sr">${esc(tx(L("ابحث بالرقم أو العنوان", "Search by ID or title")))}</span><input type="search" id="osQ" value="${esc(q)}" placeholder="${esc(tx(L("ابحث بالرقم أو العنوان", "Search by ID or title")))}"></label>
      <div class="chips" role="group" aria-label="${esc(tx(L("تصفية حسب المجال", "Filter by domain")))}">
        <button type="button" class="chip" data-dom="" aria-pressed="${!dom}">${esc(t("all"))}</button>
        ${Object.keys(DOMAINS).map(d => `<button type="button" class="chip" data-dom="${d}" aria-pressed="${dom === d}">${esc(tx(DOMAINS[d]))}</button>`).join("")}
      </div></div>
      <div class="kan${view === "pipeline" ? " wide" : ""}" id="osKan">${boardHTML(f)}</div>`;
}
