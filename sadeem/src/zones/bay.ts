/* SADEEM Hangar · Zone L1 · Vehicle Bay.
   Three generic national reference platforms (never a company's product): orbit, explode by assembly, layer isolation,
   part swap with live deltas, A/B ghost compare, mission test, then "Turn this result into an idea" → Pipeline Hall.
   All figures are illustrative training values. */
import { $, $$, esc, t, tx, num, go, register, ai, toast, head, ctx, lang, type Bi } from "@/core";
import { VEH, type Cfg, type DimKey, type FitResult, type Mission, type Platform, type Scores, type SlotKey } from "@/engines/vehicle";
import { Viewer, type ViewerAPI } from "@/viewer/viewer";

const V = VEH;
type Layer = [string, Bi];
const LAYER_SETS: Record<string, Layer[]> = {
  vehicle: [["chassis", { ar: "الهيكل", en: "Chassis" }], ["power", { ar: "الدفع", en: "Powertrain" }], ["armour", { ar: "الحماية", en: "Protection" }], ["mission", { ar: "المهمة", en: "Mission" }], ["cooling", { ar: "التبريد", en: "Cooling" }], ["ai", { ar: "الذكاء", en: "Intelligence" }]],
  aircraft: [["structure", { ar: "البنية", en: "Structure" }], ["wing", { ar: "الأجنحة", en: "Wings" }], ["engine", { ar: "المحرك", en: "Engine" }], ["avionics", { ar: "الإلكترونيات", en: "Avionics" }], ["sensors", { ar: "المستشعرات", en: "Sensors" }], ["payload", { ar: "الحمولة", en: "Payload" }]],
};
/** On the aircraft, each Bay slot drives an airframe assembly (see VEH.cfgToModel). Used for highlight and the tray hint. */
const AIR_SLOT: Partial<Record<SlotKey, string>> = { chassis: "wing", power: "engine", armour: "structure", mission: "payload", ai: "avionics" };

/* state survives leaving and re-entering the bay, as in the original */
let plat: Platform = V.PLATFORMS[0];
let cfg: Cfg = { ...plat.def };
let snapA: { plat: string; cfg: Cfg } | null = null;
let ghostOn = false;
let mission: Mission = V.MISSIONS[0];
let lastTest: FitResult | null = null;
let layers: Set<string> | null = null;
let expl = 0;
let cmp: "base" | "a" = "base";
let viewer: ViewerAPI | null = null;
let root: HTMLElement | null = null;
let hlT = 0;

const L = (o: Bi) => esc(tx(o));
const dimName = (k: DimKey) => tx(V.DIMS.find(d => d.k === k)!.n);
const cfgCode = (c: Cfg) => Object.values(c).join(" · ").toUpperCase();
const platOf = (k: string) => V.PLATFORMS.find(p => p.k === k)!;
const signed = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + num(Math.abs(n));

register("bay", {
  async mount(el) {
    root = el;
    head(el, { ar: "حظيرة المنصات · L1", en: "Vehicle Bay · L1" },
      { ar: "افتح المنصة إلى طبقاتها الهندسية", en: "Open the platform into its engineering layers" },
      { ar: "دوّر، فكّك، بدّل المكوّنات، قارن نسختين، ثم اختبر التشكيلة في مهمة. النماذج ثلاثية الأبعاد بدائل إجرائية حتى تصل أصول glTF الرسمية.", en: "Rotate, explode, swap components, compare two versions, then test the configuration on a mission. The 3D models are procedural placeholders until official glTF assets arrive." });

    el.insertAdjacentHTML("beforeend", `<div class="wrap bay">
      <div class="bay-plats" id="plats" role="group" aria-label="${L({ ar: "المنصات المرجعية", en: "Reference platforms" })}">
        ${V.PLATFORMS.map((p, i) => `<button type="button" class="plat" data-p="${p.k}" aria-pressed="${p.k === plat.k}">
          <span class="plat-n mono">${esc(p.n)}</span><span class="plat-s">${L(p.sub)}</span><span class="plat-i mono" aria-hidden="true">0${i + 1}</span></button>`).join("")}
      </div>
      <p class="note bay-train">${esc(t("training"))}</p>

      <div class="bay-main">
        <div class="bay-stage">
          <div class="v3" id="v3" tabindex="0" role="application" aria-roledescription="${L({ ar: "عارض ثلاثي الأبعاد", en: "3D viewer" })}"
               aria-label="${L({ ar: "عارض المنصة. الأسهم للدوران، + و − للتقريب، 0 لإعادة الضبط.", en: "Platform viewer. Arrow keys orbit, + and − zoom, 0 resets." })}">
            <div class="hud" aria-live="polite"><b class="mono" id="hudN"></b><span id="hudS"></span><span class="mono hud-c" id="hudC"></span></div>
            <div class="vbtns">
              <button type="button" class="vb" data-z="-1" aria-label="${L({ ar: "تقريب", en: "Zoom in" })}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 5v10M5 10h10"/></svg></button>
              <button type="button" class="vb" data-z="1" aria-label="${L({ ar: "تبعيد", en: "Zoom out" })}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10h10"/></svg></button>
              <button type="button" class="vb" data-z="0" aria-label="${L({ ar: "إعادة ضبط المنظر", en: "Reset view" })}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10a5.5 5.5 0 1 0 1.7-4"/><path d="M4 3.5v3h3"/></svg></button>
            </div>
            <div class="legend" id="legend" hidden><span class="lg-a">A</span>${L({ ar: "النسخة المحفوظة · شبح", en: "saved version · ghost" })}<span class="lg-b">B</span>${L({ ar: "الحالية", en: "current" })}</div>
            <div class="fallback" id="fb" hidden>
              <b>${L({ ar: "مسقط هندسي جانبي", en: "Engineering side elevation" })}</b>
              <span>${L({ ar: "العرض ثلاثي الأبعاد غير متاح على هذا الجهاز؛ المسقط والأرقام تتحدث مباشرة.", en: "3D is not available on this device; the elevation and the numbers still update live." })}</span>
            </div>
          </div>

          <div class="studio" role="toolbar" aria-label="${L({ ar: "أدوات العرض", en: "Viewer tools" })}">
            <label class="st-ex"><span class="st-k">${L({ ar: "تفكيك", en: "Explode" })}</span>
              <input type="range" id="exp" min="0" max="100" value="${Math.round(expl * 100)}" aria-describedby="expV"><output class="mono" id="expV">${num(Math.round(expl * 100))}%</output></label>
            <div class="st-layers"><span class="st-k" id="lyK">${L({ ar: "الطبقات", en: "Layers" })}</span><div class="chips" id="layerChips" role="group" aria-labelledby="lyK"></div></div>
            <div class="st-ab"><span class="st-k">A/B</span>
              <button type="button" class="chip" id="snapBtn">${L({ ar: "احفظ كنسخة A", en: "Save as A" })}</button>
              <button type="button" class="chip" id="ghostBtn" aria-pressed="false">${L({ ar: "قارن مع A", en: "Compare with A" })}</button></div>
          </div>
          <p class="note bay-hint">${esc(t("training"))} · ${L({ ar: "اسحب للدوران، عجلة الفأرة للتقريب", en: "Drag to orbit, wheel to zoom" })}</p>
        <section class="panel dimsP" aria-labelledby="dimH">
          <div class="ph"><h3 id="dimH">${L({ ar: "الأبعاد الهندسية", en: "Engineering dimensions" })}</h3>
            <div class="seg sm" id="cmpSeg" role="group" aria-label="${L({ ar: "أساس المقارنة", en: "Compare against" })}">
              <button type="button" data-c="base">${L({ ar: "مقارنة بالتشكيلة الأساسية", en: "vs the base configuration" })}</button>
              <button type="button" data-c="a">${L({ ar: "مقارنة بالنسخة A", en: "vs version A" })}</button></div></div>
          <div class="dims" id="dims"></div>
          <p class="dim-key mute"><span class="tick" aria-hidden="true"></span><span id="reqKey"></span></p>
        </section>
        </div>

        <aside class="panel tray" aria-labelledby="trayH">
          <div class="ph"><h3 id="trayH">${L({ ar: "صينية المكوّنات", en: "Parts tray" })}</h3><small class="mute">${L({ ar: "بدّل وشاهد الفرق", en: "swap and see the delta" })}</small></div>
          <div class="slots" id="slots"></div>
        </aside>
      </div>

      <div class="bay-lower">
        <section class="panel mtest" aria-labelledby="mH">
          <div class="ph"><h3 id="mH">${L({ ar: "اختبار المهمة", en: "Mission test" })}</h3><small class="mute">${L({ ar: "قيم تدريبية", en: "training values" })}</small></div>
          <div class="mt-grid"><div class="mt-ctl">
          <div class="field"><label for="mSel">${L({ ar: "المهمة", en: "Mission" })}</label>
            <select id="mSel">${V.MISSIONS.map(m => `<option value="${m.k}"${m.k === mission.k ? " selected" : ""}>${L(m.n)}</option>`).join("")}</select></div>
          <p class="ink2 m-desc" id="mDesc"></p>
          <div class="reqs" id="reqs"></div>
          <div><button type="button" class="btn" id="runTest">${esc(t("run"))}</button></div>
          </div>
          <div id="testOut" class="mt-out" aria-live="polite"></div></div>
        </section>
      </div>
    </div>`);

    const v3 = $("#v3", el);
    viewer = Viewer(v3);

    $$<HTMLButtonElement>("#plats .plat", el).forEach(b => b.onclick = () => {
      if (b.dataset.p === plat.k) return;
      plat = platOf(b.dataset.p!); cfg = { ...plat.def }; snapA = null; ghostOn = false; layers = null; lastTest = null; cmp = "base";
      $$("#plats .plat", el).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      viewer?.layers(null); viewer?.set(plat.model, V.cfgToModel(plat, cfg)); renderGhost(); render(); ai.set({ object: null, state: null });
    });
    const exp = $<HTMLInputElement>("#exp", el);
    exp.oninput = () => { expl = +exp.value / 100; $("#expV", el).textContent = num(exp.value) + "%"; viewer?.explode(expl); };
    $$<HTMLButtonElement>(".vbtns .vb", el).forEach(b => b.onclick = () => { const z = +b.dataset.z!; if (z) viewer?.zoom(z as 1 | -1); else viewer?.reset(); });
    $("#snapBtn", el).onclick = () => { snapA = { plat: plat.k, cfg: { ...cfg } }; toast({ ar: "حُفظت النسخة A", en: "Version A saved" }); renderGhost(); render(); };
    $("#ghostBtn", el).onclick = () => { if (!snapA) { toast({ ar: "احفظ نسخة A أولاً", en: "Save version A first" }); return; } ghostOn = !ghostOn; renderGhost(); };
    $$<HTMLButtonElement>("#cmpSeg button", el).forEach(b => b.onclick = () => { if (b.dataset.c === "a" && !snapA) return; cmp = b.dataset.c as "base" | "a"; render(); });
    const sel = $<HTMLSelectElement>("#mSel", el);
    sel.onchange = () => { mission = V.MISSIONS.find(m => m.k === sel.value)!; lastTest = null; renderMission(); render(); ai.set({ object: "mission", state: mission.k }); };
    $("#runTest", el).onclick = runTest;

    renderMission(); render();
    const ok = await viewer.mount();
    if (root !== el || !viewer) return; // left the bay while loading
    $("#fb", el).hidden = ok;
    v3.classList.toggle("is-bp", !ok);
    if (!ok) v3.removeAttribute("aria-roledescription");
    viewer.set(plat.model, V.cfgToModel(plat, cfg));
    if (expl) viewer.explode(expl);
    viewer.layers(layers);
    renderGhost();
  },

  unmount() {
    clearTimeout(hlT);
    viewer?.stop(); viewer = null; root = null;
  },

  insight(c) {
    const v = V.score(plat, cfg);
    const slot = c.object && V.SLOTS.find(s => s.k === c.object);
    if (slot) {
      const o = V.opt(slot.k, cfg[slot.k])!;
      const fx = Object.entries(o.fx).map(([k, d]) => `${dimName(k as DimKey)} ${d! > 0 ? "+" : ""}${d}`).join(", ") || tx({ ar: "لا تغيير عن الأساس", en: "no change from base" });
      return { role: { ar: "مساعد هندسي", en: "Engineering copilot" }, lines: [
        { ar: `${tx(slot.n)}: ${tx(o.n)} — ${tx(o.d)}. الأثر: ${fx}.`, en: `${tx(slot.n)}: ${tx(o.n)} — ${tx(o.d)}. Effect: ${fx}.` },
        { ar: "جرّب البديل الأعلى في هذه الفتحة وراقب أي بُعد ينخفض.", en: "Try the next option in this slot and watch which dimension drops." }] };
    }
    if (c.object === "test" && lastTest) {
      const fail = lastTest.f.filter(x => !x.pass);
      return { role: { ar: "مساعد المحاكاة", en: "Simulation assistant" }, lines: [fail.length
        ? { ar: `فشلت ${num(fail.length)} من ${num(lastTest.f.length)} متطلبات. أول فجوة: ${dimName(fail[0].k)} (${num(fail[0].have)} من ${num(fail[0].need)}).`, en: `${fail.length} of ${lastTest.f.length} requirements failed. First gap: ${dimName(fail[0].k)} (${fail[0].have} of ${fail[0].need}).` }
        : { ar: "كل المتطلبات محققة. الرافعة التالية: خفض التكلفة دون كسر أي متطلب.", en: "All requirements met. Next lever: reduce cost without breaking a requirement." }],
        actions: [{ label: t("toIdea"), run: () => toIdea() }] };
    }
    const weakest = V.DIMS.filter(d => !d.inv).sort((a, b) => v[a.k] - v[b.k])[0];
    return { role: { ar: "مساعد هندسي", en: "Engineering copilot" }, lines: [
      { ar: `${plat.n}: أضعف بُعد حالياً هو ${tx(weakest.n)} (${num(v[weakest.k])}). حرّك شريط التفكيك لترى الطبقات، أو المس رقاقة طبقة لإبرازها.`, en: `${plat.n}: the weakest dimension now is ${tx(weakest.n)} (${v[weakest.k]}). Move the explode slider to see layers, or hover a layer chip to highlight it.` },
      { ar: "احفظ نسخة A ثم غيّر مكوّناً وقارن: النسخة A تظهر كشبح أزرق.", en: "Save version A, change a part and compare: version A appears as a blue ghost." }],
      actions: [{ label: { ar: "شغّل اختبار المهمة", en: "Run the mission test" }, run: () => { runTest(); $("#testOut")?.scrollIntoView({ block: "nearest", behavior: "smooth" }); } }] };
  },
});

/* ---------- rendering ---------- */
function render() {
  const el = root; if (!el) return;
  $("#hudN", el).textContent = plat.n;
  $("#hudS", el).textContent = tx(plat.sub);
  $("#hudC", el).textContent = cfgCode(cfg);

  // layer chips: pressed = visible. Hover/focus highlights the assembly in the model.
  const ls = LAYER_SETS[plat.model];
  const lc = $("#layerChips", el);
  lc.innerHTML = ls.map(([k, n]) => `<button type="button" class="chip" data-l="${k}" aria-pressed="${!layers || layers.has(k)}">${L(n)}</button>`).join("");
  $$<HTMLButtonElement>("button", lc).forEach(b => {
    const k = b.dataset.l!;
    b.onclick = () => {
      if (!layers) layers = new Set(ls.map(x => x[0]));
      if (layers.has(k)) layers.delete(k); else layers.add(k);
      if (layers.size === ls.length) layers = null;
      viewer?.layers(layers); render(); $<HTMLButtonElement>(`#layerChips [data-l="${k}"]`, el)?.focus();
    };
    b.onmouseenter = b.onfocus = () => viewer?.highlight(k);
    b.onmouseleave = b.onblur = () => viewer?.highlight(null);
  });

  // parts tray
  const air = plat.model === "aircraft";
  $("#slots", el).innerHTML = V.SLOTS.map(s => {
    const cur = V.opt(s.k, cfg[s.k])!;
    const hint = air && AIR_SLOT[s.k] ? LAYER_SETS.aircraft.find(x => x[0] === AIR_SLOT[s.k])![1] : null;
    return `<div class="slot" role="group" aria-labelledby="sl-${s.k}">
      <h4 id="sl-${s.k}">${L(s.n)}${hint ? `<span class="slot-map">${L({ ar: "يؤثر على", en: "drives" })} ${L(hint)}</span>` : ""}</h4>
      <div class="opts">${s.o.map(o => `<button type="button" aria-pressed="${cfg[s.k] === o.k}" data-s="${s.k}" data-o="${o.k}" title="${L(o.d)}">${L(o.n)}</button>`).join("")}</div>
      <p class="slot-d">${L(cur.d)}${fxLine(cur.fx)}</p></div>`;
  }).join("");
  $$<HTMLButtonElement>("#slots button", el).forEach(b => b.onclick = () => {
    const s = b.dataset.s as SlotKey, o = b.dataset.o!;
    if (cfg[s] === o) return;
    cfg[s] = o;
    viewer?.set(plat.model, V.cfgToModel(plat, cfg));
    const lay = plat.model === "aircraft" ? AIR_SLOT[s] || null : s;
    viewer?.highlight(lay); clearTimeout(hlT); hlT = window.setTimeout(() => viewer?.highlight(null), 900);
    lastTest = null; render();
    $<HTMLButtonElement>(`#slots [data-s="${s}"][data-o="${o}"]`, el)?.focus();
    ai.set({ object: s, state: o });
  });

  // dimensions with live deltas (against the base configuration or version A)
  const segA = $<HTMLButtonElement>('#cmpSeg [data-c="a"]', el);
  if (!snapA && cmp === "a") cmp = "base";
  segA.disabled = !snapA; segA.title = snapA ? "" : tx({ ar: "احفظ نسخة A أولاً", en: "Save version A first" });
  $$("#cmpSeg button", el).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.c === cmp)));
  const v = V.score(plat, cfg);
  const ref: Scores = cmp === "a" && snapA ? V.score(platOf(snapA.plat), snapA.cfg) : V.score(plat, plat.def);
  $("#dims", el).innerHTML = V.DIMS.map(d => {
    const disp = V.shown(d, v), dd = disp - V.shown(d, ref);
    const req = mission.req[d.k]; const miss = req != null && disp < req;
    return `<div class="dim${miss ? " miss" : ""}">
      <span class="dim-n">${L(d.n)}${d.inv ? `<small>${L({ ar: "أعلى = أوفر", en: "higher = more affordable" })}</small>` : ""}</span>
      <div class="bar"><i style="width:${disp}%"></i>${req != null ? `<em class="tick" style="inset-inline-start:${req}%" title="${L({ ar: "متطلب المهمة", en: "Mission requirement" })} ${num(req)}"></em>` : ""}</div>
      <b class="n">${num(disp)}</b><span class="delta n${dd < 0 ? " neg" : ""}${dd === 0 ? " zero" : ""}">${dd ? signed(dd) : "·"}</span></div>`;
  }).join("");
  $("#reqKey", el).textContent = `${tx({ ar: "علامة متطلب المهمة", en: "Mission requirement mark" })}: ${tx(mission.n)}`;

  if (lastTest) renderTest();
  else $("#testOut", el).innerHTML = `<p class="mt-empty">${L({ ar: "شغّل الاختبار لترى مدى ملاءمة التشكيلة لمتطلبات المهمة.", en: "Run the test to see how the configuration fits the mission's requirements." })}</p>`;
}

function fxLine(fx: Partial<Scores>) {
  const e = Object.entries(fx);
  if (!e.length) return "";
  return `<span class="slot-fx">${e.map(([k, d]) => {
    const dim = V.DIMS.find(x => x.k === k)!; const good = dim.inv ? d! < 0 : d! > 0;
    return `<i class="${good ? "up" : "dn"}">${esc(tx(dim.n))} <bdi class="n">${d! > 0 ? "+" : "−"}${num(Math.abs(d!))}</bdi></i>`;
  }).join("")}</span>`;
}

function renderMission() {
  const el = root; if (!el) return;
  $("#mDesc", el).textContent = tx(mission.d);
  $("#reqs", el).innerHTML = `<span class="mute">${L({ ar: "المتطلبات", en: "Requirements" })}</span>` +
    Object.entries(mission.req).map(([k, n]) => `<span class="tag">${esc(dimName(k as DimKey))} ≥ ${num(n!)}</span>`).join("");
}

function renderGhost() {
  const el = root; if (!el) return;
  const on = ghostOn && !!snapA;
  viewer?.ghost(on ? platOf(snapA!.plat).model : null, on ? V.cfgToModel(platOf(snapA!.plat), snapA!.cfg) : null);
  const gb = $("#ghostBtn", el); gb.setAttribute("aria-pressed", String(on)); gb.classList.toggle("dim-off", !snapA);
  $("#snapBtn", el).classList.toggle("saved", !!snapA);
  const lg = $("#legend", el); lg.hidden = !on;
}

function runTest() {
  const v = V.score(plat, cfg);
  lastTest = V.fit(v, mission);
  renderTest();
  ai.set({ object: "test", state: lastTest });
}

function renderTest() {
  const el = root; if (!el || !lastTest) return;
  const r = lastTest; const passN = r.f.filter(x => x.pass).length;
  const state = r.score === 100 ? "good" : r.score >= 50 ? "warn" : "crit";
  $("#testOut", el).innerHTML = `<div class="testRes">
    <div class="tr-h"><div class="score"><b class="n">${num(r.score)}</b><small>/${num(100)}</small></div>
      <span class="tag ${state}">${num(passN)}/${num(r.f.length)} ${L({ ar: "متطلبات محققة", en: "requirements met" })}</span></div>
    ${r.f.map(x => `<div class="dim${x.pass ? "" : " miss"}"><span class="dim-n">${esc(dimName(x.k))}</span>
      <div class="bar"><i style="width:${x.have}%"></i><em class="tick" style="inset-inline-start:${x.need}%"></em></div>
      <b class="n">${num(x.have)}<small>/${num(x.need)}</small></b><span class="delta n${x.pass ? " zero" : " neg"}">${x.pass ? "✓" : signed(x.have - x.need)}</span></div>`).join("")}
    <button type="button" class="btn gold" id="toIdea">${esc(t("toIdea"))}<svg class="i flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M12 6l4 4-4 4"/></svg></button>
  </div>`;
  $("#toIdea", el).onclick = toIdea;
}

/** Hand the result to the Pipeline Hall's guided submission, numbers attached (legacy draft format). */
function toIdea() {
  if (!lastTest) runTest();
  const r = lastTest!;
  const gaps = r.f.filter(x => !x.pass).map(x => dimName(x.k)).join(lang() === "ar" ? "، " : ", ");
  const code = Object.values(cfg).join("/");
  ctx.state = { draft: {
    t: { ar: `تحسين ${plat.n} لمهمة «${mission.n.ar}»`, en: `Improve ${plat.n} for '${mission.n.en}'` },
    d: tx({ ar: `من حظيرة المنصات: تشكيلة ${code} حققت ${r.score}/100. الفجوات: ${gaps || "لا شيء"}.`, en: `From the Vehicle Bay: configuration ${code} scored ${r.score}/100. Gaps: ${gaps || "none"}.` }),
    area: plat.model === "aircraft" ? "air" : "land",
  } };
  void go("lab");
}
