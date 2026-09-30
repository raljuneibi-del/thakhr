/* SADEEM Hangar · 03 Pipeline Hall (collection → routing) + 04 Containment Vault.
   Eleven stations drawn from SADEEM's functions; every idea is an object at its station and moves when a gate is met.
   Every gate, criterion and classification rule here is proposed, pending official approval. */
import {
  $, $$, esc, t, tx, num, lang, go, register, ai, toast, allIdeas, addIdea, head, icon, RM,
  CHALLENGES, SOURCES, DOMAINS, ENTITIES, DB, save, ctx, uid, type Idea, type Bi,
} from "@/core";
import { FX } from "@/shell/fx";
import { EVAL, CRITERIA, type Level, type NationalScore, type Twin, type Classification, type ClassAnswers } from "@/engines/evaluate";

const B = (ar: string, en: string): Bi => ({ ar, en });
const T = (ar: string, en: string) => esc(tx({ ar, en }));
const stages = (): string[] => t("stage");
const pad2 = (n: number) => String(n).padStart(2, "0");

/* ---------- gate to leave each station (proposed, pending official approval) ---------- */
const GATES: Bi[] = [
  B("استلام عبر البوابة الواحدة وإصدار رقم مرجعي", "Received through the single door; reference issued"),
  B("تحديد المجال ونوع المصدر والاحتياج الوطني", "Domain, source type and national need tagged"),
  B("اجتياز فحص الازدواجية وضمن النطاق", "Duplicate check cleared; in scope"),
  B("تأكيد مستوى الحساسية من شخص مخوّل", "Sensitivity level confirmed by an authorised person"),
  B("إسناد إلى محفظة ومحلل", "Assigned to a portfolio and an analyst"),
  B("اجتياز حد التقييم على المعايير الوطنية الستة", "Threshold met on the six national criteria"),
  B("الأفضل بين الأفكار المشابهة في جدول الأفكار", "Best in class against similar ideas in the idea table"),
  B("خطة تجربة بقياس قبل/بعد", "An experiment plan with a before/after measure"),
  B("تسجيل النتائج وتحقيق «التوجيه قبل التنفيذ»", "Results recorded; guidance before execution met"),
  B("اعتماد الجهة المخوّلة", "Approval by the authority"),
  B("قبول الجهة الوطنية المختصة وتحوّلها إلى برنامج قدرة", "Accepted by the competent entity; becomes a capability programme"),
];

/* ---------- guided submission: five stations instead of one form ---------- */
const STEPS: Array<{ k: string; n: Bi; l: Bi }> = [
  { k: "problem", n: B("الفكرة", "Idea"), l: B("ما الفكرة أو المبادرة؟ ما الذي لاحظته ولماذا يهم الدولة؟", "What is the idea or initiative? What did you observe and why does it matter to the state?") },
  { k: "evidence", n: B("الدليل", "Evidence"), l: B("ما الدليل؟ أرقام، تجارب، حالات متكررة", "What is the evidence? Numbers, trials, repeated cases") },
  { k: "root", n: B("السبب الجذري", "Root cause"), l: B("ما السبب الجذري الذي تعالجه؟", "What root cause does it address?") },
  { k: "value", n: B("الأثر الوطني", "National impact"), l: B("ما الأثر الوطني؟ اكتفاء ذاتي، تقليل هدر أو مخاطر، قدرة جديدة", "What is the national impact? Self-sufficiency, less waste or risk, a new capability") },
  { k: "concept", n: B("الحل", "Solution"), l: B("ما الحل المقترح، وما مستوى نضجه، وما البديلان؟", "What is the proposed solution, its maturity, and two alternatives?") },
];

const CONTAINED_REC = B("سجل محتوى", "Contained record");
const LEVEL_NAME: Record<Level, Bi> = { high: B("محتوى", "Contained"), controlled: B("موجَّه", "Controlled"), open: B("مفتوح", "Open") };
const LEVEL_TAG: Record<Level, string> = { high: "warn", controlled: "sov", open: "good" };
const SEAL_LABEL: Record<Level, string> = { high: "CONTAINED · محتواة", controlled: "CONTROLLED · موجَّهة", open: "OPEN · مفتوحة" };

interface Walk { step: number; t: string; area: string; src: string; ch: string; f: Record<string, string>; twin?: Twin | null; twinSeen?: boolean }
interface GateRec { idea: string; level: Level; ref: string; at: number; rule: Bi; by: "human-confirmed" | "keyword-screen" }

const gateLog = (): GateRec[] => DB.gate as GateRec[];
const isContained = (i: Idea) => i.sens === "high" || gateLog().some(x => x.idea === i.id && x.level === "high");
const hidden = (i: Idea) => isContained(i) && !i.mine;
const titleOf = (i: Idea) => hidden(i) ? tx(CONTAINED_REC) : tx(i.t);
const ideaText = (i: Idea) => (i.d || "") + " " + (i.t.en || i.t.ar || "");
const needOf = (id?: string) => CHALLENGES.find(c => c.id === id);
const smooth = (): ScrollBehavior => (RM ? "auto" : "smooth");

/* ================================================================
   03 · PIPELINE HALL
   ================================================================ */
let sel: string | null = null;
let walk: Walk | null = null;
let receipt: { id: string; level: Level } | null = null;
let pick: number | null = null;               // station filter
let timers: number[] = [];

register("lab", {
  mount(el) {
    sel = null; walk = null; receipt = null; pick = null; timers = [];
    head(el, B("مسار سديم · 03", "Pipeline Hall · 03"),
      B("من التجميع إلى التوجيه للجهة الوطنية المختصة", "From collection to routing to the competent national entity"),
      B("إحدى عشرة محطة مستخرجة من وظائف مركز سديم. كل فكرة جسم على الخط، وكل بوابة تقول ما يفتح المحطة التالية. البوابات والمعايير مقترحة بانتظار الاعتماد الرسمي.",
        "Eleven stations drawn from SADEEM's functions. Every idea is an object on the line, and every gate says what opens the next station. Gates and criteria are proposed, pending official approval."));

    el.insertAdjacentHTML("beforeend", `
      <div class="wrap">
        <section class="lineSec" aria-labelledby="lnH">
          <div class="lineHead">
            <h2 id="lnH" class="sr">${T("الخط", "The line")}</h2>
            <span class="proposed">${esc(t("proposed"))}</span>
            <ul class="legend" aria-label="${T("مفتاح الألوان", "Legend")}">
              <li><i class="sw mine"></i>${T("أفكارك", "Your ideas")}</li>
              <li><i class="sw"></i>${T("مصادر وطنية", "National sources")}</li>
              <li><i class="sw c"></i>${T("محتواة", "Contained")}</li>
            </ul>
          </div>
          <div class="lineBox" id="lnBox" tabindex="0" role="region" aria-label="${T("خط سديم: إحدى عشرة محطة", "The SADEEM line: eleven stations")}"></div>
        </section>
        <div class="labGrid">
          <div class="colA"><article class="panel rec" id="detail" aria-live="polite"></article></div>
          <div class="colB">
            <section class="panel" id="walkP" aria-labelledby="wH"></section>
            <section class="panel" aria-labelledby="ilH">
              <div class="ph"><h3 id="ilH">${T("الأفكار على الخط", "Ideas on the line")}</h3><small class="mute n" id="iN"></small></div>
              <div id="iFilter"></div>
              <div class="ideaList" id="ideas"></div>
            </section>
          </div>
        </div>
        <section class="needs" aria-labelledby="ndH">
          <div class="sec-h"><h2 id="ndH">${T("احتياجات الدولة المعلنة", "Declared national needs")}</h2><span class="note">${esc(t("example"))} · ${T("سجلات توضيحية", "illustrative records")}</span></div>
          <div class="chl" id="chl"></div>
        </section>
      </div>`);

    /* deep links: draft (from a lab result), openIdea, openCh, stage */
    const st = ctx.state || {};
    let focusWalk = false;
    if (st.draft) { walk = { step: 0, t: tx(st.draft.t), area: st.draft.area || "land", src: "talent", ch: st.draft.ch || "", f: { problem: st.draft.d || "" } }; focusWalk = true; }
    if (st.openIdea) sel = String(st.openIdea);
    if (st.openCh) { walk = { step: 0, t: "", area: "land", src: "talent", ch: st.openCh, f: {} }; focusWalk = true; }
    if (typeof st.stage === "number" && st.stage >= 0 && st.stage <= 10) pick = st.stage;
    render();
    if (focusWalk) later(() => $("#walkP")?.scrollIntoView({ behavior: smooth(), block: "start" }), 80);
    else if (st.openIdea) later(() => $("#detail")?.scrollIntoView({ behavior: smooth(), block: "start" }), 80);
    if (pick != null && !sel && !walk) ai.set({ object: "station", state: pick });
  },
  unmount() { timers.forEach(clearTimeout); timers = []; },
  insight(c) {
    if (c.object === "contained") return { role: B("مساعد الاحتواء", "Containment assistant"), lines: [B("هذا السجل محتوى. لا أقرأ نصه ولا أرسله إلى أي نموذج؛ أعرض المرجع والمحطة فقط.", "This record is contained. I do not read its text or send it to any model; I show the reference and station only.")] };
    if (c.object === "idea" && c.state) {
      const { i, ns, twins } = c.state as { i: Idea; ns: NationalScore; twins: Twin[] };
      const s = stages()[i.st];
      return {
        role: B("المقيّم الوطني", "National assessor"),
        lines: [
          B(`${i.id} عند «${s}» منذ ${num(i.days)} يوماً. التقييم المقترح ${num(ns.total)}/١٠٠.`, `${i.id} at '${s}' for ${i.days} days. Proposed score ${ns.total}/100.`),
          B(`لفتح المحطة التالية: ${GATES[Math.min(10, i.st)].ar}.`, `To open the next station: ${GATES[Math.min(10, i.st)].en}.`),
          twins && twins.length ? B(`تنبيه ازدواجية: تشبه ${twins.map(x => x.i.id).join("، ")}.`, `Duplicate alert: resembles ${twins.map(x => x.i.id).join(", ")}.`) : null,
          ...ns.ev.missing.slice(0, 1),
        ].filter(Boolean) as Bi[],
      };
    }
    if (c.object === "walk" && c.state && c.state.walk) {
      const w = c.state.walk as Walk; const ev = EVAL.evaluate(w.t + " " + Object.values(w.f).join(" "), w.ch);
      return {
        role: B("مدرّب التقديم", "Intake coach"),
        lines: [
          B(`المحطة ${num(w.step + 1)} من ٥. الوضوح ${num(ev.s.clarity)}، القيمة ${num(ev.s.value)}، الجدوى ${num(ev.s.feasibility)}.`, `Station ${w.step + 1} of 5. Clarity ${ev.s.clarity}, value ${ev.s.value}, feasibility ${ev.s.feasibility}.`),
          ...ev.missing.slice(0, 2),
          B("صياغتك تبقى صياغتك؛ أقترح ولا أستبدل.", "Your wording stays yours; I suggest, I do not replace."),
        ],
      };
    }
    if (c.object === "station" && typeof c.state === "number") {
      const s = c.state;
      return { role: B("المقيّم الوطني", "National assessor"), lines: [B(`محطة «${t("stage")[s]}»: بوابتها ${GATES[s].ar}.`, `Station '${t("stage")[s]}': its gate is ${GATES[s].en}.`), B(t("proposed"), t("proposed"))] };
    }
    return {
      role: B("المقيّم الوطني", "National assessor"),
      lines: [B("اختر فكرة لتقييمها وفق المعايير الوطنية المقترحة، أو قدّم فكرة عبر نقطة الدخول الواحدة. المحطة الرابعة (الاحتواء) لا تُتجاوز دون تصنيف مؤكد.", "Select an idea to evaluate it on the proposed national criteria, or submit through the single entry point. Station four (containment) cannot be passed without a confirmed classification.")],
      actions: [{ label: B("قدّم فكرة", "Submit an idea"), run: () => { const b = $("#startWalk"); if (b) (b as HTMLButtonElement).click(); else $("#walkP")?.scrollIntoView({ behavior: smooth() }); } }],
    };
  },
});

function later(f: () => void, ms: number) { timers.push(window.setTimeout(f, ms)); }

/* ---------- full render (the line, list, record, submission, needs) ---------- */
function render(moved?: { id: string; from: DOMRect | null }) {
  const ideas = allIdeas();
  drawLine(ideas);
  renderList(ideas);
  renderNeeds(ideas);
  renderDetail(ideas);
  renderWalk();
  if (moved?.from && !RM) {
    const o = $(`#lnBox .obj[data-i="${CSS.escape(moved.id)}"]`);
    if (o) {
      const to = o.getBoundingClientRect();
      o.animate([{ transform: `translate(${moved.from.left - to.left}px, ${moved.from.top - to.top}px)` }, { transform: "none" }], { duration: 760, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
  }
}

/* ---------- the line ---------- */
function drawLine(ideas: Idea[]) {
  const box = $("#lnBox"); const S = stages();
  const selIdea = ideas.find(k => k.id === sel);
  const MAX = 6;
  let h = `<ol class="line">`;
  for (let k = 0; k < 11; k++) {
    const c = ideas.filter(i => i.st === k);
    const cls = ["stn", k === 3 ? "cont" : "", selIdea && selIdea.st === k ? "on" : "", pick === k ? "pick" : ""].filter(Boolean).join(" ");
    h += `<li class="${cls}">
      ${k === 3 ? `<span class="contTag">${icon("lock")}${T("الاحتواء", "Containment")}</span>` : ""}
      <div class="objs">${c.slice(0, MAX).map(objHTML).join("")}${c.length > MAX ? `<span class="more n">+${num(c.length - MAX)}</span>` : ""}</div>
      <button class="node" type="button" data-s="${k}" aria-pressed="${pick === k}" aria-label="${esc(S[k])} · ${num(c.length)} ${T("فكرة", "ideas")}"><i></i></button>
      <div class="lbl"><span class="no mono">${pad2(k + 1)}</span><b>${esc(S[k])}</b><small class="n">${c.length ? `${num(c.length)} ${c.length === 1 ? T("فكرة", "idea") : T("أفكار", "ideas")}` : "—"}</small></div>
    </li>`;
  }
  h += `<li class="end"><span>${T("جهة مختصة", "Entity")}</span>${icon("arrow")}</li></ol>`;
  box.innerHTML = h;
  $$<HTMLButtonElement>(".obj", box).forEach(b => (b.onclick = () => { sel = b.dataset.i!; render(); $("#detail").scrollIntoView({ behavior: smooth(), block: "nearest" }); }));
  $$<HTMLButtonElement>(".node", box).forEach(b => (b.onclick = () => {
    const s = +b.dataset.s!; pick = pick === s ? null : s;
    drawLine(allIdeas()); renderList(allIdeas());
    if (pick != null) ai.set({ object: "station", state: pick }); else renderDetail(allIdeas());
    $<HTMLButtonElement>(`#lnBox .node[data-s="${s}"]`)?.focus();
  }));
}
function objHTML(i: Idea) {
  const c = isContained(i);
  const cls = ["obj", i.mine ? "mine" : "", c ? "c" : "", i.id === sel ? "sel" : ""].filter(Boolean).join(" ");
  return `<button type="button" class="${cls}" data-i="${esc(i.id)}" aria-pressed="${i.id === sel}" aria-label="${esc(i.id)} · ${esc(titleOf(i))}" title="${esc(i.id)} · ${esc(titleOf(i))}">${c ? icon("lock") : ""}<span>${esc(String(i.id).replace(/^SD-/, ""))}</span></button>`;
}

/* ---------- ideas on the line ---------- */
function renderList(ideas: Idea[]) {
  const list = pick == null ? ideas : ideas.filter(i => i.st === pick);
  $("#iN").textContent = (pick == null ? num(list.length) : num(list.length) + " / " + num(ideas.length)) + " " + tx(B("فكرة", "ideas"));
  $("#iFilter").innerHTML = pick == null ? "" : `<div class="row filt"><span class="mute">${T("المحطة", "Station")}</span><button class="chip on" type="button" id="clrPick" aria-label="${T("إلغاء التصفية", "Clear filter")}">${num(pick + 1)} · ${esc(stages()[pick])} ${icon("close")}</button></div><p class="gateLine"><span>${T("بوابتها", "Its gate")}</span>${esc(tx(GATES[pick]))}</p>`;
  const clr = $("#clrPick"); if (clr) clr.onclick = () => { pick = null; drawLine(allIdeas()); renderList(allIdeas()); };
  $("#ideas").innerHTML = list.slice(0, 16).map(i => {
    const c = isContained(i);
    return `<button type="button" class="ideaRow${i.id === sel ? " on" : ""}" data-i="${esc(i.id)}" aria-pressed="${i.id === sel}">
      <i class="mono">${esc(i.id)}</i>
      <span class="ir"><b>${esc(titleOf(i))}</b><small>${esc(stages()[i.st])} · ${esc(tx(SOURCES[i.src] || i.owner))}${i.sample ? " · " + T("مثال", "example") : ""}</small></span>
      <span class="tag ${c ? "warn" : i.st >= 9 ? "good" : i.st >= 5 ? "sov" : ""}">${c ? icon("lock") : num(i.st + 1) + "/" + num(11)}</span>
    </button>`;
  }).join("") || `<p class="mute empty">${T("لا توجد أفكار عند هذه المحطة بعد.", "No ideas at this station yet.")}</p>`;
  $$<HTMLButtonElement>("#ideas .ideaRow").forEach(b => (b.onclick = () => { sel = b.dataset.i!; render(); $("#detail").scrollIntoView({ behavior: smooth(), block: "nearest" }); }));
}

/* ---------- declared national needs ---------- */
function renderNeeds(ideas: Idea[]) {
  $("#chl").innerHTML = CHALLENGES.map(c => {
    const n = ideas.filter(i => i.ch === c.id).length;
    return `<article class="ch">
      <div class="chTop"><span class="mono">${esc(c.id)}</span>${n === 0 ? `<span class="tag warn">${T("فراغ قدرة", "Capability void")}</span>` : ""}</div>
      <h3>${esc(tx(c.t))}</h3>
      <p>${esc(tx(c.d))}</p>
      <dl class="chMeta"><div><dt>${T("الجهة", "Sponsor")}</dt><dd>${esc(tx(c.sponsor))}</dd></div><div><dt>${T("الأفكار", "Ideas")}</dt><dd class="n">${num(n)}</dd></div><div><dt>${T("المهلة", "Window")}</dt><dd class="n">${num(c.due)} ${T("يوماً", "days")}</dd></div></dl>
      <button class="btn ghost sm" type="button" data-ch="${esc(c.id)}">${T("قدّم فكرة لهذا الاحتياج", "Submit for this need")}${icon("arrow", "i dir")}</button>
    </article>`;
  }).join("");
  $$<HTMLButtonElement>("#chl [data-ch]").forEach(b => (b.onclick = () => {
    walk = { step: 0, t: "", area: "land", src: "talent", ch: b.dataset.ch!, f: {} }; receipt = null;
    renderWalk(); $("#walkP").scrollIntoView({ behavior: smooth(), block: "start" }); $<HTMLInputElement>("#wT")?.focus({ preventScroll: true });
  }));
}

/* ---------- the idea record ---------- */
function renderDetail(ideas: Idea[]) {
  const box = $("#detail"); const S = stages();
  const i = ideas.find(x => x.id === sel);
  if (!i) {
    box.classList.add("idle");
    box.innerHTML = `<div class="ph"><h3>${T("سجل الفكرة", "Idea record")}</h3></div>
      <div class="idleBody">${icon("grid")}<p>${T("اختر فكرة على الخط أو من القائمة لترى محطتها، وما يفتح البوابة التالية، وتقييمها على المعايير الوطنية الستة.", "Select an idea on the line or from the list to see its station, what opens the next gate, and its score on the six national criteria.")}</p></div>
      <dl class="gateList">${GATES.map((g, k) => `<div${pick === k ? ' class="on"' : ""}><dt class="mono">${pad2(k + 1)}</dt><dd><b>${esc(S[k])}</b><span>${esc(tx(g))}</span></dd></div>`).join("")}</dl>
      <p class="proposed">${esc(t("proposed"))}</p>`;
    if (!walk) ai.set({ object: pick != null ? "station" : null, state: pick });
    return;
  }
  box.classList.remove("idle");
  const cont = isContained(i); const gate = gateLog().find(x => x.idea === i.id);
  if (cont && !i.mine) {
    box.innerHTML = `<div class="ph"><h3><span class="mono rid">${esc(i.id)}</span>${esc(tx(CONTAINED_REC))}</h3><span class="tag warn">${icon("lock")}${esc(t("contained"))}</span></div>
      <div class="miniVault"><div class="plate"><b>CONTAINED · محتواة</b><span class="mono">${esc(gate ? gate.ref : "SD-VAULT")}</span><span>${esc(S[i.st])}</span></div></div>
      <p class="note">${T("المحتوى محجوب عن هذا العرض. يظهر المرجع والمحطة فقط، ولا يُرسل النص إلى أي نموذج خارجي.", "Content withheld from this view. Only the reference and station show, and the text is never sent to an external model.")}</p>`;
    ai.set({ object: "contained", state: { i } });
    return;
  }
  const ns = EVAL.national(i);
  const pool = allIdeas();
  const twins = EVAL.similar(tx(i.t) + " " + (i.d || ""), pool, i.id);
  const need = needOf(i.ch);
  const words = EVAL.words(ideaText(i));
  const peers = pool.filter(x => x.id !== i.id && x.area === i.area && x.st >= 5)
    .map(x => { const w = EVAL.words(ideaText(x)); let n = 0; words.forEach(k => { if (w.has(k)) n++; }); return { x, sim: n, sc: EVAL.national(x).total }; })
    .sort((a, b) => b.sim - a.sim || b.sc - a.sc).slice(0, 3);
  const table = [{ x: i, sc: ns.total }, ...peers.map(p => ({ x: p.x, sc: p.sc }))];
  const best = table.reduce((m, r) => (r.sc > m.sc ? r : m), table[0]);
  const risky = (k: string) => k === "risk";

  box.innerHTML = `
    <header class="recHead">
      <div class="recT"><span class="mono rid">${esc(i.id)}</span><h3>${esc(tx(i.t))}</h3><p class="mute">${esc(tx(SOURCES[i.src] || i.owner))} · ${esc(tx(DOMAINS[i.area] || B("", "")))}</p></div>
      <div class="chips">${i.sample ? `<span class="tag">${esc(t("example"))}</span>` : ""}${i.mine ? `<span class="tag sov">${T("فكرتك", "Yours")}</span>` : ""}${cont ? `<span class="tag warn">${icon("lock")}${esc(t("contained"))}${gate ? " · " + esc(gate.ref) : ""}</span>` : i.sens === "controlled" ? `<span class="tag sov">${esc(tx(LEVEL_NAME.controlled))}</span>` : ""}</div>
    </header>
    <div class="prog" role="img" aria-label="${T("المحطة", "Station")} ${num(i.st + 1)} / ${num(11)} · ${esc(S[i.st])}">
      <ol>${S.map((s, k) => `<li class="${k < i.st ? "done" : k === i.st ? "on" : ""}" title="${num(k + 1)} · ${esc(s)}"></li>`).join("")}</ol>
      <p><span class="mono">${pad2(i.st + 1)}/11</span><b>${esc(S[i.st])}</b><span class="mute">· ${num(i.days)} ${T("يوماً في المحطة", "days at station")}</span></p>
    </div>
    ${i.d ? `<p class="body">${esc(i.d)}</p>` : `<p class="mute body">${T("(سجل مثال؛ النص الكامل في نظام سديم)", "(example record; the full text lives in the SADEEM OS)")}</p>`}
    <dl class="kv">
      <dt>${T("المحطة الحالية", "Current station")}</dt><dd>${esc(S[i.st])}</dd>
      <dt>${T("ما يفتح المحطة التالية", "What opens the next station")}</dt><dd>${esc(tx(GATES[Math.min(10, i.st)]))}</dd>
      <dt>${T("الاحتياج الوطني", "National need")}</dt><dd>${need ? `<span class="mono">${esc(need.id)}</span> · ${esc(tx(need.t))}` : esc(i.ch || "—")}</dd>
      <dt>${T("الجهة المستلمة", "Receiving entity")}</dt><dd>${esc(i.entity ? tx(i.entity) : "—")}</dd>
      ${i.dupOf ? `<dt>${T("مكررة محتملة مع", "Possible duplicate of")}</dt><dd class="mono">${esc(i.dupOf)}</dd>` : ""}
    </dl>
    <section class="evalBox" aria-labelledby="evH">
      <div class="evHead"><h4 id="evH">${T("التقييم وفق المعايير الوطنية (مقترح)", "National-criteria evaluation (proposed)")}</h4><p class="score"><b class="n">${num(ns.total)}</b><span class="n">/${num(100)}</span></p></div>
      <ul class="crit">${CRITERIA.map(([k, l]) => `<li>
        <div class="cl"><span>${esc(tx(l))}</span><small>${esc(tx(ns.reasons[k]))}</small></div>
        <div class="bar ${risky(k) ? (ns.s[k] > 50 ? "crit" : "good") : ""}"><i style="width:${ns.s[k]}%"></i></div>
        <b class="n">${num(ns.s[k])}</b></li>`).join("")}</ul>
      ${ns.ev.missing.length ? `<div class="miss"><span>${T("ما ينقص السجل", "What the record is missing")}</span><ul>${ns.ev.missing.slice(0, 3).map(m => `<li>${esc(tx(m))}</li>`).join("")}</ul></div>` : ""}
      <p class="proposed">${T("الأوزان بند مفتوح لدى الجهة المعتمدة.", "Weights are an open item for the approving authority.")}</p>
    </section>
    ${i.st >= 5 && i.st <= 7 ? `<section class="evalBox itable${i.st === 6 ? " live" : ""}" aria-labelledby="itH">
      <div class="evHead"><h4 id="itH">${T("جدول الأفكار: المقارنة قبل الإحالة", "Idea table: comparison before referral")}</h4>${i.st === 6 ? `<span class="tag sov">${T("اختبار المحطة ٧", "Station 7 test")}</span>` : ""}</div>
      <div class="tblWrap"><table><thead><tr><th scope="col">ID</th><th scope="col">${T("الفكرة", "Idea")}</th><th scope="col">${T("المحطة", "Station")}</th><th scope="col">${T("النتيجة", "Score")}</th></tr></thead><tbody>
      ${table.map(r => `<tr class="${r.x === i ? "self" : ""}${r === best ? " best" : ""}"><td class="mono">${esc(r.x.id)}</td><td>${esc(r.x !== i && hidden(r.x) ? tx(CONTAINED_REC) : tx(r.x.t))}${r === best ? ` <span class="bestMark">★ ${T("الأفضل ضمن الفئة", "Best in class")}</span>` : ""}</td><td class="mono">${pad2(r.x.st + 1)}</td><td class="n">${num(r.sc)}</td></tr>`).join("")}
      </tbody></table></div>
      ${peers.length ? "" : `<p class="mute sm">${T("لا توجد أفكار مشابهة في المجال نفسه بعد؛ تُقارن الفكرة عند ورود نظيراتها.", "No similar ideas in the same domain yet; the idea is compared as peers arrive.")}</p>`}
    </section>` : ""}
    ${twins.length ? `<div class="twins"><span>${T("أفكار مشابهة (فحص الازدواجية):", "Similar ideas (duplicate check):")}</span>${twins.map(x => `<button class="chip" type="button" data-i="${esc(x.i.id)}"><span class="mono">${esc(x.i.id)}</span> ${num(Math.round(x.sim * 100))}%</button>`).join("")}</div>` : ""}
    <div class="acts">
      ${i.mine && i.st === 9 ? `<label class="field ent"><span>${T("الجهة الوطنية المختصة", "Competent national entity")}</span><select id="ent">${ENTITIES.map(e => `<option value="${e.k}">${esc(tx(e))}</option>`).join("")}</select></label>` : ""}
      <div class="row">
        ${i.mine && i.st < 10 ? `<button class="btn sm" type="button" id="advance">${T("تحقق متطلب البوابة", "Gate met")}${icon("arrow", "i dir")}${T("المحطة التالية", "next station")}</button>` : ""}
        <button class="btn ghost sm" type="button" id="support">${T("اطلب توجيهاً", "Request guidance")}</button>
        <button class="btn ghost sm" type="button" id="toVault">${icon("lock")}${T("صنّف في قبو الاحتواء", "Classify in the vault")}</button>
      </div>
    </div>`;

  $$<HTMLButtonElement>(".twins [data-i]", box).forEach(b => (b.onclick = () => { sel = b.dataset.i!; render(); }));
  const adv = $("#advance");
  if (adv) adv.onclick = () => {
    if (i.st === 3 && !gateLog().some(x => x.idea === i.id && x.by === "human-confirmed")) {
      toast(B("محطة الاحتواء تحتاج تأكيد التصنيف في القبو أولاً", "The containment station needs a confirmed classification in the vault first")); return;
    }
    if (i.st === 9) { const e = ENTITIES.find(x => x.k === $<HTMLSelectElement>("#ent").value)!; i.entity = { ar: e.ar, en: e.en }; }
    const from = $(`#lnBox .obj[data-i="${CSS.escape(i.id)}"]`)?.getBoundingClientRect() || null;
    i.st++; i.days = 0; save(); FX.sound("move");
    toast(B(`انتقلت الفكرة إلى «${t("stage")[i.st]}»`, `Moved to '${t("stage")[i.st]}'`));
    render({ id: i.id, from });
  };
  $("#support").onclick = () => { i.support = (i.support || 0) + 1; save(); toast(B("وصل طلب التوجيه إلى محللي سديم", "Guidance request sent to SADEEM analysts")); };
  $("#toVault").onclick = () => { ctx.state = { gateIdea: i.id }; void go("gate"); };
  ai.set({ object: "idea", state: { i, ns, twins } });
}

/* ---------- guided submission through the single entry point ---------- */
function renderWalk() {
  const box = $("#walkP");
  if (!walk) {
    if (receipt) {
      const r = receipt;
      box.innerHTML = `<div class="ph"><h3 id="wH">${T("استُلمت الفكرة", "Received")}</h3><span class="tag ${LEVEL_TAG[r.level]}">${esc(tx(LEVEL_NAME[r.level]))}</span></div>
        <div class="receipt"><span>${T("الرقم المرجعي", "Reference")}</span><b class="mono">${esc(r.id)}</b><small>${esc(stages()[0])} · ${T("صدر الرقم المرجعي عبر البوابة الواحدة", "reference issued through the single door")}</small></div>
        ${r.level === "high" ? `<p class="note">${T("احتُويت الفكرة في القبو: لا تُرسل إلى أي نموذج خارجي، ويؤكد شخص مخوّل التصنيف.", "Contained in the vault: never sent to an external model; an authorised person confirms the classification.")}</p>` : r.level === "controlled" ? `<p class="note">${T("رُصدت مؤشرات حساسية؛ تُراجع داخلياً ويؤكد شخص التصنيف في القبو.", "Sensitivity indicators found; reviewed internally, and a person confirms the classification in the vault.")}</p>` : ""}
        <div class="row"><button class="btn sm" type="button" id="startWalk">${T("قدّم فكرة أخرى", "Submit another")}</button><button class="btn ghost sm" type="button" id="toV2">${icon("lock")}${T("صنّف في القبو", "Classify in the vault")}</button></div>`;
      $("#toV2").onclick = () => { ctx.state = { gateIdea: r.id }; void go("gate"); };
    } else {
      box.innerHTML = `<div class="ph"><h3 id="wH">${T("قدّم عبر نقطة الدخول الواحدة", "Submit through the single entry point")}</h3></div>
        <p class="ink2 intro">${T("خمس محطات موجّهة بدل نموذج واحد. المساعد يقيّم كل محطة ويبحث عن أفكار مشابهة قبل القبول، ويُفحص مستوى الحساسية تلقائياً.", "Five guided stations instead of one form. The assistant evaluates each station and looks for similar ideas before acceptance; sensitivity is screened automatically.")}</p>
        <ol class="stepList">${STEPS.map((s, k) => `<li><span class="mono">${pad2(k + 1)}</span>${esc(tx(s.n))}</li>`).join("")}</ol>
        <div class="row"><button class="btn" type="button" id="startWalk">${T("ابدأ", "Start")}${icon("arrow", "i dir")}</button></div>`;
    }
    $("#startWalk").onclick = () => { walk = { step: 0, t: "", area: "land", src: "talent", ch: "", f: {} }; receipt = null; renderWalk(); $<HTMLInputElement>("#wT")?.focus(); };
    return;
  }
  const w = walk;
  if (w.twin) { renderTwin(box, w); return; }
  const s = STEPS[w.step];
  box.innerHTML = `
    <div class="ph"><h3 id="wH">${T("تقديم فكرة", "Submission")}</h3><small class="mono">${pad2(w.step + 1)}/05</small></div>
    <ol class="steps">${STEPS.map((x, k) => `<li class="${k < w.step ? "done" : k === w.step ? "on" : ""}"${k === w.step ? ' aria-current="step"' : ""}><span class="mono">${pad2(k + 1)}</span><em>${esc(tx(x.n))}</em></li>`).join("")}</ol>
    <div class="walk">
      ${w.step === 0 ? `<div class="field"><label for="wT">${T("عنوان الفكرة", "Idea title")}</label><input id="wT" type="text" value="${esc(w.t)}" autocomplete="off"></div>` : `<p class="wTitle"><span class="mute">${T("الفكرة", "Idea")}</span> ${esc(w.t)}</p>`}
      <div class="field"><label for="wF">${esc(tx(s.l))}</label><textarea id="wF">${esc(w.f[s.k] || "")}</textarea></div>
      ${w.step === 0 ? `<div class="g2 tight">
          <div class="field"><label for="wS">${T("نوع المصدر", "Source type")}</label><select id="wS">${Object.entries(SOURCES).map(([k, v]) => `<option value="${k}" ${w.src === k ? "selected" : ""}>${esc(tx(v))}</option>`).join("")}</select></div>
          <div class="field"><label for="wA">${T("المجال", "Domain")}</label><select id="wA">${Object.entries(DOMAINS).map(([k, v]) => `<option value="${k}" ${w.area === k ? "selected" : ""}>${esc(tx(v))}</option>`).join("")}</select></div>
        </div>
        <div class="field"><label for="wC">${T("الاحتياج الوطني (اختياري)", "National need (optional)")}</label><select id="wC"><option value="">—</option>${CHALLENGES.map(c => `<option value="${c.id}" ${w.ch === c.id ? "selected" : ""}>${esc(c.id)} · ${esc(tx(c.t))}</option>`).join("")}</select></div>` : ""}
      <div class="evalBox coach" id="wEval" aria-live="polite"></div>
      <div class="row wNav">
        ${w.step > 0 ? `<button class="btn ghost sm" type="button" id="wBack">${icon("arrow", "i dir back")}${esc(t("back"))}</button>` : ""}
        <button class="btn sm" type="button" id="wNext">${w.step < 4 ? esc(t("next")) : T("أرسل عبر نقطة الدخول", "Send through the entry point")}${icon("arrow", "i dir")}</button>
        <button class="btn quiet sm" type="button" id="wCancel">${esc(t("cancel"))}</button>
      </div>
    </div>`;
  const grab = () => {
    w.f[s.k] = $<HTMLTextAreaElement>("#wF").value;
    const ti = $<HTMLInputElement>("#wT"); if (ti) w.t = ti.value;
    const c = $<HTMLSelectElement>("#wC"); if (c) w.ch = c.value;
    const a = $<HTMLSelectElement>("#wA"); if (a) w.area = a.value;
    const so = $<HTMLSelectElement>("#wS"); if (so) w.src = so.value;
  };
  const coach = () => {
    const txt = w.t + " " + Object.values(w.f).join(" ");
    const ev = EVAL.evaluate(txt, w.ch);
    const tw = w.step >= 1 ? EVAL.similar(txt, allIdeas()) : [];
    $("#wEval").innerHTML = `<div class="qRow"><span>${T("جودة المدخل", "Input quality")}</span><div class="bar"><i style="width:${ev.total}%"></i></div><b class="n">${num(ev.total)}</b></div>
      <p class="hint">${esc(ev.missing[0] ? tx(ev.missing[0]) : tx(B("جيد. أكمل إلى المحطة التالية.", "Good. Continue to the next station.")))}</p>
      ${tw.length ? `<p class="dupWarn">${icon("search")}<span>${T("قد تكون مكررة مع:", "Possible duplicate of:")}</span>${tw.map(x => `<button type="button" class="chip" data-i="${esc(x.i.id)}"><span class="mono">${esc(x.i.id)}</span></button>`).join("")}</p>` : ""}`;
    $$<HTMLButtonElement>("#wEval [data-i]").forEach(b => (b.onclick = () => { sel = b.dataset.i!; renderDetail(allIdeas()); drawLine(allIdeas()); renderList(allIdeas()); $("#detail").scrollIntoView({ behavior: smooth(), block: "start" }); }));
  };
  coach();
  const onInput = () => { grab(); coach(); ai.set({ object: "walk", state: { walk: w } }); };
  $("#wF").oninput = onInput;
  const ti = $("#wT"); if (ti) ti.oninput = onInput;
  ["#wC", "#wA", "#wS"].forEach(id => { const e = $(id); if (e) e.onchange = onInput; });
  const wb = $("#wBack"); if (wb) wb.onclick = () => { grab(); w.step--; renderWalk(); $<HTMLTextAreaElement>("#wF").focus(); };
  $("#wCancel").onclick = () => { walk = null; renderWalk(); ai.refresh(); };
  $("#wNext").onclick = () => {
    grab();
    if (w.step === 0 && !w.t.trim()) { toast(B("أضف عنواناً", "Add a title")); $<HTMLInputElement>("#wT").focus(); return; }
    if (w.step < 4) { w.step++; renderWalk(); $<HTMLTextAreaElement>("#wF").focus(); return; }
    /* one door, no twins: surface the nearest twin before acceptance */
    const twin = EVAL.similar(w.t + " " + composeText(w), allIdeas())[0];
    if (twin && !w.twinSeen) { w.twin = twin; renderWalk(); $<HTMLButtonElement>("#twOk")?.focus(); return; }
    submit(w);
  };
  ai.set({ object: "walk", state: { walk: w } });
}

function composeText(w: Walk) { return STEPS.map(x => `${tx(x.l)}\n${w.f[x.k] || "—"}`).join("\n\n"); }

function renderTwin(box: HTMLElement, w: Walk) {
  const tw = w.twin!; const i = tw.i;
  box.innerHTML = `<div class="ph"><h3 id="wH">${T("قبل القبول: التوأم الأقرب", "Before acceptance: the nearest twin")}</h3><small class="mono">05/05</small></div>
    <p class="ink2 intro">${T("باب واحد بلا توائم. تقديمك يشبه فكرة موجودة على الخط؛ راجعها قبل أن يُصدر الرقم المرجعي.", "One door, no twins. Your submission resembles an idea already on the line; review it before a reference is issued.")}</p>
    <div class="twinCard">
      <div class="pair"><span class="mute">${T("تقديمك", "Yours")}</span><b>${esc(w.t)}</b></div>
      <div class="simMeter"><span class="n">${num(Math.round(tw.sim * 100))}%</span><small>${T("تشابه", "overlap")}</small></div>
      <div class="pair"><span class="mono">${esc(i.id)}</span><b>${esc(titleOf(i))}</b><small class="mute">${esc(stages()[i.st])} · ${esc(tx(SOURCES[i.src] || i.owner))}</small></div>
    </div>
    <div class="row">
      <button class="btn sm" type="button" id="twOk">${T("فكرتي مختلفة · أرسل", "Mine is different · send")}</button>
      <button class="btn ghost sm" type="button" id="twOpen">${T("افتح التوأم", "Open the twin")}</button>
      <button class="btn quiet sm" type="button" id="twEdit">${T("عد للتعديل", "Back to edit")}</button>
    </div>
    <p class="note">${T("تُسجَّل الفكرة كمكررة محتملة إذا تجاوز التشابه ٥٠٪.", "The idea is recorded as a possible duplicate when overlap exceeds 50%.")}</p>`;
  $("#twOk").onclick = () => { w.twinSeen = true; w.twin = null; submit(w); };
  $("#twOpen").onclick = () => { sel = i.id; w.twin = null; render(); $("#detail").scrollIntoView({ behavior: smooth(), block: "start" }); };
  $("#twEdit").onclick = () => { w.twin = null; renderWalk(); };
}

function submit(w: Walk) {
  const d = composeText(w);
  const cls = EVAL.classify(d + " " + w.t, {});
  const dup = EVAL.similar(w.t + " " + d, allIdeas())[0];
  const it = addIdea({ t: { ar: w.t, en: w.t }, d, area: w.area, src: w.src, ch: w.ch, st: 0, dupOf: dup && dup.sim > .5 ? dup.i.id : "" });
  if (cls.level !== "open") { DB.gate.unshift({ idea: it.id, level: cls.level, ref: "SV-" + uid(), at: Date.now(), rule: cls.rule, by: "keyword-screen" } satisfies GateRec); save(); }
  sel = it.id; walk = null; receipt = { id: it.id, level: cls.level };
  FX.sound("move");
  toast(cls.level === "high" ? B(`استُلمت ${it.id} واحتُويت في القبو`, `${it.id} received and contained in the vault`) : B(`استُلمت الفكرة برقم ${it.id}`, `Received as ${it.id}`));
  render();
  const o = $(`#lnBox .obj[data-i="${CSS.escape(it.id)}"]`); if (o && !RM) o.classList.add("arrive");
}

/* ================================================================
   04 · CONTAINMENT VAULT
   ================================================================ */
let gTimers: number[] = [];
const QUESTIONS: Array<[keyof ClassAnswers, Bi, Bi[]]> = [
  ["domain", B("مجال الفكرة", "Domain"), [B("عام", "General"), B("تقني حساس", "Sensitive technical"), B("دفاعي", "Defence")]],
  ["dual", B("استخدام مزدوج؟", "Dual use?"), [B("لا", "No"), B("نعم", "Yes")]],
  ["export", B("تمسّ ضوابط التصدير أو بيانات مصنَّفة؟", "Touches export controls or classified data?"), [B("لا", "No"), B("نعم", "Yes")]],
  ["partner", B("تتضمن بيانات جهة أخرى؟", "Includes another entity's data?"), [B("لا", "No"), B("نعم", "Yes")]],
];

register("gate", {
  mount(el) {
    gTimers = [];
    head(el, B("قبو الاحتواء · 04", "Containment Vault · 04"),
      B("الاحتواء قبل الإطلاق · التوجيه قبل التنفيذ · الحوكمة قبل التجربة", "Containment before launch · Guidance before execution · Governance before experiment"),
      B("إدارة الابتكار عالي الحساسية في المجال التقني والدفاعي. تُصنَّف الفكرة هنا، وما يبلغ المستوى العالي يُختم ويُحجب ولا يُرسل إلى أي نموذج خارجي، ثم يُوجَّه عبر المسار الوطني.",
        "Management of high-sensitivity innovation in the technical and defence field. Ideas are classified here; anything at the high level is sealed, withheld and never sent to an external model, then guided through the national path."));
    const ideas = allIdeas().filter(i => i.mine || !i.sens);
    const want = ctx.state && ctx.state.gateIdea;
    let pickId: string = (want && ideas.some(i => i.id === want) ? want : ideas[0]?.id) || "";
    const a: Required<ClassAnswers> = { domain: 0, dual: 0, export: 0, partner: 0 };
    let res: Classification | null = null;

    el.insertAdjacentHTML("beforeend", `
      <div class="wrap gateGrid">
        <div class="vaultCol">
          <div class="vault" id="vault" aria-live="polite">
            <div class="vIn">
              <div class="lock"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1 18.2 13.8 31 16 18.2 18.2 16 31 13.8 18.2 1 16 13.8 13.8Z" fill="currentColor"/></svg></div>
              <b class="brandL">SADEEM · سديم</b>
              <p class="tagline">${T("منصة ابتكار وطنية مركزية للابتكار التقني عالي الحساسية", "A national, centralised platform for high-sensitivity technical innovation")}</p>
              <div class="onTable" id="onTable"></div>
            </div>
            <div class="seal" id="seal" aria-hidden="true">
              <i class="bolt"></i><i class="bolt"></i><i class="bolt"></i><i class="bolt"></i>
              <div class="plate"><b id="sealB">CONTAINED</b><span class="mono" id="sealRef"></span><small id="sealS"></small></div>
            </div>
          </div>
          <ol class="principles">
            <li><span class="mono">01</span><div><b>${T("الاحتواء قبل الإطلاق", "Containment before launch")}</b><p>${T("لا إطلاق ولا تداول مفتوح؛ الفكرة تتشكّل وتُنقّى داخل فضاء منضبط.", "No launch and no open circulation; the idea takes shape inside a controlled space.")}</p></div></li>
            <li><span class="mono">02</span><div><b>${T("التوجيه قبل التنفيذ", "Guidance before execution")}</b><p>${T("تُوجَّه إلى الجهة الوطنية المختصة حسب احتياجات الدولة.", "Routed to the competent national entity according to the state's needs.")}</p></div></li>
            <li><span class="mono">03</span><div><b>${T("الحوكمة قبل التجربة", "Governance before experiment")}</b><p>${T("إطار سيادي محكوم بغرض التمكين.", "A sovereign framework governed for enablement.")}</p></div></li>
          </ol>
          <p class="rule">${icon("lock")}<span>${T("قاعدة الاحتواء: السجل عالي المستوى لا يُرسل أبداً إلى أي نموذج خارجي؛ ويعمل دعمه الذكي بالقواعد فقط أو بنموذج مستضاف داخل البيئة السيادية. يعمل هذا البناء بقواعد حتمية دون اتصال، فلا يغادر شيء المتصفح.", "Containment rule: a record at the high level is never sent to any external model; its AI support runs only on rules or on a model hosted inside the sovereign environment. This build uses deterministic rules offline, so nothing leaves the browser.")}</span></p>
          <p class="note">${T("مستويات التصنيف وقواعدها مقترحة، وتُستكمل حصرياً بموافقة رسمية.", "Classification levels and rules are proposed and are completed exclusively with official approval.")}</p>
        </div>
        <section class="panel qform" aria-labelledby="gH">
          <div class="ph"><h3 id="gH">${T("تصنيف فكرة", "Classify an idea")}</h3><small class="mute">${T("المساعد يقترح، الإنسان يؤكد", "the assistant recommends, a person confirms")}</small></div>
          <div class="field"><label for="gI">${T("الفكرة", "Idea")}</label><select id="gI">${ideas.map(i => `<option value="${esc(i.id)}" ${i.id === pickId ? "selected" : ""}>${esc(i.id)} · ${esc(tx(i.t))}</option>`).join("")}</select></div>
          <div class="qs">${QUESTIONS.map(([k, l, o], n) => `<div class="q" role="group" aria-labelledby="q${n}"><b id="q${n}">${esc(tx(l))}</b><div class="seg" data-q="${k}">${o.map((x, v) => `<button type="button" aria-pressed="${v === 0}" data-v="${v}">${esc(tx(x))}</button>`).join("")}</div></div>`).join("")}</div>
          <div class="row"><button class="btn" type="button" id="gRun">${T("احسب التصنيف", "Compute classification")}</button><button class="btn gold" type="button" id="gConfirm" hidden>${icon("lock")}${T("أؤكد التصنيف", "Confirm classification")}</button></div>
          <div id="gOut" aria-live="polite"></div>
        </section>
        <section class="panel logP" aria-labelledby="lgH">
          <div class="ph"><h3 id="lgH">${T("سجل الاحتواء والتوجيه", "Containment and routing log")}</h3><small class="mute n" id="lgN"></small></div>
          <div class="tblWrap" id="log"></div>
        </section>
      </div>`);

    const vault = $("#vault");
    const showIdea = () => {
      const i = allIdeas().find(x => x.id === pickId);
      $("#onTable").innerHTML = i ? `<span class="mono">${esc(i.id)}</span><b>${esc(tx(i.t))}</b><small>${esc(stages()[i.st])}</small>` : "";
      const g = gateLog().find(x => x.idea === pickId && x.by === "human-confirmed");
      setSeal(g ? g.level : null, g ? g.ref : "", i);
    };
    const setSeal = (level: Level | null, ref: string, i?: Idea) => {
      vault.classList.toggle("sealed", !!level);
      vault.dataset.level = level || "";
      if (level) {
        $("#sealB").textContent = SEAL_LABEL[level];
        $("#sealRef").textContent = ref;
        $("#sealS").textContent = i ? `${i.id} · ${stages()[i.st]}` : "";
      }
      $("#seal").setAttribute("aria-hidden", String(!level));
    };
    const renderLog = () => {
      const log = gateLog();
      $("#lgN").textContent = `${num(log.length)} ${tx(log.length === 1 ? B("سجل", "record") : B("سجلات", "records"))}`;
      const fmt = new Intl.DateTimeFormat(lang() === "ar" ? "ar-AE" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      $("#log").innerHTML = `<table><thead><tr><th scope="col">${T("المرجع", "Ref")}</th><th scope="col">${T("الفكرة", "Idea")}</th><th scope="col">${T("المستوى", "Level")}</th><th scope="col">${T("بواسطة", "By")}</th><th scope="col">${T("التاريخ", "Date")}</th></tr></thead><tbody>${
        log.map(g => `<tr><td class="mono">${esc(g.ref)}</td><td class="mono">${esc(g.idea)}</td><td><span class="tag ${LEVEL_TAG[g.level] || ""}">${g.level === "high" ? icon("lock") : ""}${esc(tx(LEVEL_NAME[g.level] || B(g.level, g.level)))}</span></td><td>${esc(g.by === "human-confirmed" ? tx(B("تأكيد بشري", "Human-confirmed")) : tx(B("فحص آلي", "Automatic screen")))}</td><td class="mute">${g.at ? esc(fmt.format(g.at)) : "—"}</td></tr>`).join("")
        || `<tr><td colspan="5" class="mute">${T("لا توجد سجلات بعد. تُسجَّل كل عملية تصنيف مؤكدة هنا بمرجعها.", "No records yet. Every confirmed classification is recorded here with its reference.")}</td></tr>`}</tbody></table>`;
    };
    showIdea(); renderLog();

    $$<HTMLButtonElement>(".seg[data-q] button", el).forEach(b => (b.onclick = () => {
      const seg = b.parentElement!; const q = seg.dataset.q as keyof ClassAnswers;
      a[q] = +b.dataset.v!;
      $$<HTMLButtonElement>("button", seg).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      if (res) { res = null; $("#gOut").innerHTML = ""; $("#gConfirm").hidden = true; }
    }));
    $<HTMLSelectElement>("#gI").onchange = e => { pickId = (e.target as HTMLSelectElement).value; res = null; $("#gOut").innerHTML = ""; $("#gConfirm").hidden = true; showIdea(); };
    $("#gRun").onclick = () => {
      const i = allIdeas().find(x => x.id === pickId); if (!i) return;
      res = EVAL.classify((i.d || "") + " " + tx(i.t), a);
      $("#gOut").innerHTML = `<div class="evalBox result lv-${res.level}">
        <div class="evHead"><h4>${T("التصنيف المقترح", "Recommended classification")}</h4><span class="tag ${LEVEL_TAG[res.level]}">${res.level === "high" ? icon("lock") : ""}${esc(tx(LEVEL_NAME[res.level]))}</span></div>
        <p class="pts"><span class="n">${num(res.pts)}</span> ${T("نقاط", "pts")}${res.kw ? ` · <span class="kwHit">${T("كلمات حساسة رُصدت", "sensitive terms detected")}</span>` : ""}</p>
        <p class="ruleTxt">${esc(tx(res.rule))}</p></div>`;
      $("#gConfirm").hidden = false;
      ai.set({ object: "class", state: res });
    };
    $("#gConfirm").onclick = () => {
      if (!res) return;
      const i = allIdeas().find(x => x.id === pickId);
      const ref = "SV-" + uid();
      DB.gate = gateLog().filter(g => g.idea !== pickId);
      DB.gate.unshift({ idea: pickId, level: res.level, ref, at: Date.now(), rule: res.rule, by: "human-confirmed" } satisfies GateRec);
      save();
      setSeal(res.level, ref, i);
      FX.sound("seal");
      toast(B(`سُجّل التصنيف ${ref}`, `Classification ${ref} recorded`));
      $("#gConfirm").hidden = true;
      renderLog();
      ai.refresh();
      res = null;
    };
  },
  unmount() { gTimers.forEach(clearTimeout); gTimers = []; },
  insight(c) {
    if (c.object === "class" && c.state) {
      const r = c.state as Classification;
      return {
        role: B("مساعد التصنيف (استشاري)", "Classification assistant (advisory)"),
        lines: [
          B(`المستوى المقترح: ${LEVEL_NAME[r.level].ar}. ${r.rule.ar}`, `Recommended level: ${LEVEL_NAME[r.level].en}. ${r.rule.en}`),
          B("القرار للإنسان ويُسجَّل باسمه. السجلات المحتواة لا تظهر لغير المخوّلين.", "The decision is a person's and is recorded under their name. Contained records are hidden from anyone not authorised."),
        ],
      };
    }
    const n = gateLog().filter(g => g.level === "high").length + allIdeas().filter(i => i.sens === "high").length;
    return {
      role: B("مساعد التصنيف (استشاري)", "Classification assistant (advisory)"),
      lines: [B("أربعة أسئلة تكفي لاقتراح مستوى: مفتوح، موجّه، أو محتوى.", "Four questions are enough to recommend a level: open, controlled or contained."), B(`محتواة الآن: ${num(n)}.`, `Contained now: ${n}.`)],
    };
  },
});

