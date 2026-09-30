/* SADEEM Hangar · Factory of the Future (L3).
   One line of eight stations, twelve technologies, six metrics. A current↔future slider transforms each station;
   walk mode moves station by station at the line's takt. Illustrative training values. */
import { $, $$, esc, t, tx, num, go, register, ai, ctx, head, lang, RM, type Bi, type Insight } from "@/core";
import { FACTORY as F, type FactoryMetrics, type Station } from "@/engines/factory";

const A = (ar: string, en: string): Bi => ({ ar, en });

/* state survives a revisit, as in the original hangar (walking does not) */
let on = new Set<string>();
let cur = -1;          // station in view (-1 = none)
let walking = false;
let timer = 0;
let root: HTMLElement | null = null;

const METRICS: Array<{ k: keyof FactoryMetrics; l: Bi; u: string; dir: 1 | -1 }> = [
  { k: "tp", l: A("الإنتاجية", "Throughput"), u: "u/shift", dir: 1 },
  { k: "q", l: A("جودة أول مرور", "First-pass quality"), u: "%", dir: 1 },
  { k: "inc", l: A("الحوادث", "Incidents"), u: "/1000h", dir: -1 },
  { k: "cost", l: A("مؤشر التكلفة", "Cost index"), u: "", dir: -1 },
  { k: "down", l: A("التوقف", "Downtime"), u: "%", dir: -1 },
  { k: "takt", l: A("زمن الدورة", "Takt"), u: "min", dir: -1 },
];
const FX_NAME: Record<string, Bi> = {
  tp: A("الإنتاجية", "throughput"), q: A("الجودة", "quality"), inc: A("الحوادث", "incidents"), cost: A("التكلفة", "cost"), down: A("التوقف", "downtime"),
};
const techName = (k: string) => tx(F.TECH.find(x => x.k === k)!.n);
const stName = (k: string) => tx(F.STATIONS.find(s => s.k === k)!.n);
/** Stations whose own cycle time is the line's constraint (≥ 30 min) carry a bottleneck flag while still manual. */
const BOTTLENECK = (s: Station) => s.takt >= 30;

function stopWalk() { walking = false; clearTimeout(timer); timer = 0; }

register("factory", {
  mount(el) {
    root = el; stopWalk(); cur = -1;
    head(el, A("مصنع المستقبل · L3", "Factory of the Future · L3"), A("خط واحد، حالتان", "One line, two states"),
      A("حرّك المزلاج لتشاهد الخط يتحول محطةً محطة من الحالة الحالية إلى المستقبلية، أو فعّل تقنية واحدة وراقب المقاييس الستة. امشِ على الخط بإيقاع الإنتاج.",
        "Move the slider to watch the line transform station by station from current to future, or enable one technology and watch the six metrics. Walk the line at its takt."));

    el.insertAdjacentHTML("beforeend", `<div class="wrap fz">
      <div class="fz-ctl">
        <label class="fz-morph">
          <span class="fz-end">${esc(tx(A("الحالة الحالية", "Current")))}</span>
          <input type="range" id="fzMorph" min="0" max="${F.TECH.length}" step="1" value="${on.size}" aria-label="${esc(tx(A("من الحالة الحالية إلى المستقبلية", "From current to future state")))}">
          <span class="fz-end">${esc(tx(A("المستقبلية", "Future")))}</span>
        </label>
        <span class="fz-count n" id="fzCount"></span>
        <button class="btn ghost sm" id="fzWalk" aria-pressed="false"></button>
      </div>

      <figure class="fz-fig">
        <div class="fz-scroll" id="fzScroll"><svg class="fz-line" id="fzLine" viewBox="0 0 1200 300" role="group" aria-label="${esc(tx(A("خط الإنتاج: ثماني محطات", "Production line: eight stations")))}"></svg></div>
        <figcaption class="fz-legend">
          <span><i class="k worker"></i>${esc(tx(A("عامل · محطة يدوية", "Worker · manual station")))}</span>
          <span><i class="k robot"></i>${esc(tx(A("روبوت أو عربة ذاتية", "Cobot or AGV")))}</span>
          <span><i class="k sensor"></i>${esc(tx(A("مستشعر حي", "Live sensor")))}</span>
          <span><i class="k flag"></i>${esc(tx(A("نقطة اختناق يدوية", "Manual bottleneck")))}</span>
          <span><i class="k part"></i>${esc(tx(A("قطعة على السير بسرعة الإيقاع", "Part on the belt at takt speed")))}</span>
        </figcaption>
      </figure>

      <div class="fz-metrics" id="fzMetrics" aria-live="polite"></div>

      <div class="fz-grid">
        <section class="panel fz-tech">
          <div class="ph"><h3>${esc(tx(A("التقنيات", "Technologies")))}</h3><small class="mute n" id="fzCapex"></small></div>
          <div class="fz-techs" id="fzTechs">${F.TECH.map(x => `<button class="fz-t" type="button" aria-pressed="false" data-k="${x.k}"><i aria-hidden="true"></i><span><b>${esc(tx(x.n))}</b><small>${esc(tx(x.d))} · <span class="n">${esc(num(x.fx.capex))}m</span></small></span></button>`).join("")}</div>
        </section>
        <section class="panel fz-view">
          <div class="ph"><h3>${esc(tx(A("محطة تحت النظر", "Station in view")))}</h3><small class="mute n" id="fzIdx"></small></div>
          <div id="fzInfo" class="fz-info"></div>
          <hr class="divL">
          <p class="note">${esc(t("training"))}</p>
          <div><button class="btn sm" id="fzIdea" type="button">${esc(t("toIdea"))}</button></div>
        </section>
      </div>
    </div>`);

    const morph = $<HTMLInputElement>("#fzMorph", el);
    morph.addEventListener("input", () => { const k = +morph.value; on = new Set(F.TECH.slice(0, k).map(x => x.k)); render(); });
    $$<HTMLButtonElement>("#fzTechs .fz-t", el).forEach(b => b.addEventListener("click", () => toggleTech(b.dataset.k!)));
    $("#fzWalk", el).addEventListener("click", () => {
      if (walking) { stopWalk(); render(); return; }
      walking = true; if (cur < 0) cur = 0; render(); schedule();
    });
    const svg = $("#fzLine", el);
    const pick = (g: Element | null) => { if (!g) return; const i = +(g as HTMLElement).dataset.i!; stopWalk(); cur = cur === i ? -1 : i; render(true); };
    svg.addEventListener("click", e => pick((e.target as Element).closest(".st")));
    svg.addEventListener("keydown", e => {
      const g = (e.target as Element).closest(".st"); if (!g) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(g); }
    });
    $("#fzIdea", el).addEventListener("click", toIdea);
    render();
  },
  unmount() { stopWalk(); root = null; },
  insight(c): Insight {
    const st = c.state || {};
    const r: FactoryMetrics = st.r || F.compute(on), base: FactoryMetrics = st.base || F.compute(new Set());
    const role = A("مستشار التصنيع", "Manufacturing advisor");
    const x = c.object ? F.TECH.find(y => y.k === c.object) : null;
    if (x) {
      const fx = (l: "ar" | "en") => Object.entries(x.fx).filter(([k]) => k !== "capex")
        .map(([k, v]) => `${FX_NAME[k][l]} ${v > 0 ? "+" : ""}${Math.round(v * 100)}%`).join(l === "ar" ? "، " : ", ");
      const at = (l: "ar" | "en") => x.at.map(a => F.STATIONS.find(s => s.k === a)!.n[l]).join(l === "ar" ? "، " : ", ");
      return { role, lines: [{
        ar: `${x.n.ar} (${x.d.ar}) على محطات ${at("ar")}. الأثر المنمذج: ${num(fx("ar"))}. رأس المال ${num(x.fx.capex)}m.`,
        en: `${x.n.en} (${x.d.en}) at ${at("en")}. Modelled effect: ${fx("en")}. Capex ${x.fx.capex}m.`,
      }] };
    }
    const best = F.TECH.filter(y => !on.has(y.k))
      .map(y => ({ x: y, v: (y.fx.tp * 2 - y.fx.down - y.fx.inc * .5 - y.fx.cost) / y.fx.capex }))
      .sort((a, b) => b.v - a.v)[0];
    const dtp = r.tp - base.tp, sign = dtp > 0 ? "+" : "";
    return {
      role,
      lines: [
        { ar: `مقارنة بالحالة الحالية: إنتاجية ${num(sign)}${num(dtp)}، توقف ${num((r.down - base.down).toFixed(1))} نقطة، حوادث ${num((r.inc - base.inc).toFixed(1))}.`,
          en: `Versus current state: throughput ${sign}${dtp}, downtime ${(r.down - base.down).toFixed(1)} pts, incidents ${(r.inc - base.inc).toFixed(1)}.` },
        best
          ? { ar: `الوحدة التالية من الاستثمار تحرّك المقاييس أكثر عند: ${best.x.n.ar} (${num(best.x.fx.capex)}m).`, en: `The next unit of investment moves the metrics most at: ${best.x.n.en} (${best.x.fx.capex}m).` }
          : { ar: "كل التقنيات مفعّلة؛ العوائد الآن متناقصة بعد السادسة.", en: "All technologies enabled; returns diminish beyond the sixth." },
      ],
      actions: best ? [{ label: A("فعّلها", "Enable it"), run: () => { if (!on.has(best.x.k)) toggleTech(best.x.k); } }] : [],
    };
  },
});

function toggleTech(k: string) {
  on.has(k) ? on.delete(k) : on.add(k);
  if (root) $<HTMLInputElement>("#fzMorph", root).value = String(on.size);
  render();
  ai.set({ object: k });
}

function schedule() {
  clearTimeout(timer);
  if (!walking) return;
  timer = window.setTimeout(() => {
    if (!walking || !root) return;
    cur = (cur + 1) % F.STATIONS.length; render(); schedule();
  }, Math.max(700, F.compute(on).takt * 40));
}

function toIdea() {
  const r = F.compute(on);
  const names = (l: "ar" | "en") => [...on].map(k => F.TECH.find(x => x.k === k)!.n[l]).join(l === "ar" ? "، " : ", ");
  ctx.state = { draft: {
    t: A("تحسين خط الإنتاج بتقنيات مصنع المستقبل", "Improve the line with Factory-of-the-Future technologies"),
    d: tx({
      ar: `من مصنع المستقبل: ${names("ar") || "بلا تقنيات"} → إنتاجية ${r.tp} وحدة/وردية، جودة ${r.q}%، توقف ${r.down}%، تكلفة ${r.cost}. رأس المال التقديري ${r.capex} م.درهم.`,
      en: `From the Factory of the Future: ${names("en") || "no technologies"} → ${r.tp} units/shift, ${r.q}% first-pass, ${r.down}% downtime, cost index ${r.cost}. Indicative capex AED ${r.capex}m.`,
    }),
    area: "mfg", ch: "N-03",
  } };
  void go("lab");
}

function render(keepFocus = false) {
  const el = root; if (!el) return;
  const r = F.compute(on), base = F.compute(new Set()), eff = F.stationEffects(on);

  $("#fzCount", el).textContent = `${num(on.size)} / ${num(F.TECH.length)} ${tx(A("تقنيات", "technologies"))}`;
  $<HTMLInputElement>("#fzMorph", el).setAttribute("aria-valuetext", `${on.size} / ${F.TECH.length}`);
  const wb = $("#fzWalk", el);
  wb.setAttribute("aria-pressed", String(walking));
  wb.innerHTML = `<svg class="i" viewBox="0 0 20 20" aria-hidden="true">${walking ? '<path d="M7 5v10M13 5v10"/>' : '<path d="M7 5l8 5-8 5z"/>'}</svg>${esc(tx(walking ? A("أوقف المشي", "Stop walking") : A("امشِ على الخط", "Walk the line")))}`;

  $("#fzMetrics", el).innerHTML = METRICS.map(m => {
    const v = r[m.k], b = base[m.k]; const d = +(v - b).toFixed(1);
    const cls = d === 0 ? "" : d * m.dir > 0 ? "good" : "bad";
    return `<div class="fz-m"><span>${esc(tx(m.l))}</span><b class="n">${esc(num(v))}${m.u ? `<small>${m.u}</small>` : ""}</b><em class="n ${cls}">${d === 0 ? "—" : (d > 0 ? "+" : "−") + esc(num(Math.abs(d)))}</em></div>`;
  }).join("");

  $$<HTMLButtonElement>("#fzTechs .fz-t", el).forEach(b => b.setAttribute("aria-pressed", String(on.has(b.dataset.k!))));
  $("#fzCapex", el).textContent = `${tx(A("رأس مال تقديري", "indicative capex"))} ${num(r.capex)}m AED`;

  const focused = keepFocus || (document.activeElement as HTMLElement | null)?.closest?.("#fzLine") ? cur : -2;
  drawLine(el, eff, r);
  if (focused >= 0) ($(`#fzLine .st[data-i="${focused}"]`, el) as unknown as SVGGElement | null)?.focus({ preventScroll: true });

  const s = cur >= 0 ? F.STATIONS[cur] : null;
  $("#fzIdx", el).textContent = s ? `${num(String(cur + 1).padStart(2, "0"))} / ${num("08")}` : "";
  $("#fzInfo", el).innerHTML = s
    ? `<b class="fz-sn">${esc(tx(s.n))}</b>
       <dl class="kv"><dt>${esc(tx(A("زمن المحطة", "Station time")))}</dt><dd class="n">${esc(num(s.takt))} min</dd>
       <dt>${esc(tx(A("الحالة", "State")))}</dt><dd>${esc(tx(eff[s.k].length ? A("مستقبلية", "Future") : A("يدوية", "Manual")))}</dd></dl>
       <p class="ink2">${eff[s.k].length ? esc(tx(A("تقنيات مفعّلة: ", "Enabled: "))) + esc(eff[s.k].map(techName).join(lang() === "ar" ? "، " : ", ")) : esc(tx(A("لا تقنيات مفعّلة هنا بعد", "No technologies enabled here yet")))}</p>`
    : `<p class="mute">${esc(tx(A("اضغط «امشِ على الخط» لتتحرك الكاميرا محطةً محطة بإيقاع الإنتاج.", "Press 'Walk the line' to move station by station at the line's takt.")))}</p>`;

  if (walking && s) keepInView(el, cur);
  ai.set({ state: { r, base } });
}

/** On narrow screens the line scrolls sideways; keep the walked station in view without moving the page. */
function keepInView(el: HTMLElement, i: number) {
  const sc = $("#fzScroll", el), g = $(`#fzLine .st[data-i="${i}"]`, el);
  if (!sc || !g || sc.scrollWidth <= sc.clientWidth + 1) return;
  const a = sc.getBoundingClientRect(), b = g.getBoundingClientRect();
  const delta = (b.left + b.width / 2) - (a.left + a.width / 2);
  sc.scrollBy({ left: delta, behavior: RM ? "auto" : "smooth" });
}

function drawLine(el: HTMLElement, eff: Record<string, string[]>, r: FactoryMetrics) {
  const svg = $("#fzLine", el);
  const n = F.STATIONS.length, W = 1200, M = 24, sw = 120, gap = (W - 2 * M - n * sw) / (n - 1);
  const rtl = lang() === "ar";
  const X = (i: number) => rtl ? W - M - sw - i * (sw + gap) : M + i * (sw + gap);
  const Y = 64, H = 112, BELT = 236, maxT = Math.max(...F.STATIONS.map(s => s.takt));
  const dur = Math.max(1.2, r.takt / 10);
  let g = `<line class="belt" x1="${M}" y1="${BELT}" x2="${W - M}" y2="${BELT}"/>`;
  F.STATIONS.forEach((st, i) => {
    const x = X(i), e = eff[st.k], fut = e.length > 0, sel = cur === i;
    const lbl = `${tx(st.n)} · ${st.takt} min · ${fut ? `${e.length} ${tx(A("تقنية", "tech"))}` : tx(A("يدوي", "manual"))}`;
    g += `<g class="st${sel ? " sel" : ""}${fut ? " fut" : ""}" data-i="${i}" transform="translate(${x},${Y})" tabindex="0" role="button" aria-pressed="${sel}" aria-label="${esc(lbl)}">`;
    if (sel) g += `<rect class="hl" x="-8" y="-38" width="${sw + 16}" height="${H + 88}" rx="6"/>`;
    g += `<text class="nm" x="${sw / 2}" y="-14" text-anchor="middle">${esc(tx(st.n))}</text>`;
    g += `<rect class="fl" x="0" y="0" width="${sw}" height="${H}" rx="4"/>`;
    g += `<text class="ix" x="${rtl ? sw - 8 : 8}" y="16" text-anchor="${rtl ? "end" : "start"}">${String(i + 1).padStart(2, "0")}</text>`;
    // worker or robot
    if (e.includes("robotics") || e.includes("agv")) g += `<rect class="robot" x="22" y="34" width="18" height="40" rx="3"/><rect class="robot" x="40" y="46" width="30" height="6" rx="2"/><circle class="robot" cx="74" cy="49" r="5"/>`;
    else g += `<circle class="worker" cx="32" cy="38" r="8"/><rect class="worker" x="24" y="48" width="16" height="30" rx="4"/>`;
    if (e.includes("hmc")) g += `<rect class="ol sov" x="46" y="60" width="20" height="14" rx="2"/>`;
    if (e.includes("vision")) g += `<path class="cone" d="M${sw - 20} 33 l-12 26 h24z"/><circle class="cam" cx="${sw - 20}" cy="26" r="7"/>`;
    if (e.includes("pdm") || e.includes("iot")) g += `<circle class="sensor${RM ? "" : " pulse"}" cx="${sw - 14}" cy="${H - 18}" r="4"/>`;
    if (e.includes("twins") || e.includes("analytics")) g += `<rect class="ol sov" x="${sw - 44}" y="${H - 38}" width="30" height="22" rx="2"/><polyline class="spark" points="${sw - 40},${H - 20} ${sw - 34},${H - 28} ${sw - 28},${H - 24} ${sw - 20},${H - 34}"/>`;
    if (e.includes("am")) g += `<rect class="ol gold" x="72" y="62" width="26" height="30" rx="2"/><rect class="part" x="80" y="78" width="10" height="8"/>`;
    if (e.includes("cv-safety")) g += `<rect class="safe" x="4" y="4" width="${sw - 8}" height="${H - 8}" rx="4"/>`;
    if (e.includes("tooling")) g += `<path class="tool" d="M56 96 l10 -10 M60 100 l10 -10"/>`;
    if (!fut && BOTTLENECK(st)) g += `<circle class="flag" cx="${sw - 14}" cy="${H - 18}" r="4"/>`;
    // station time drawn to scale against the longest station
    const tw = sw * st.takt / maxT;
    g += `<rect class="tk-bg" x="0" y="${H + 14}" width="${sw}" height="3"/><rect class="tk" x="${rtl ? sw - tw : 0}" y="${H + 14}" width="${tw}" height="3"/>`;
    g += `<text class="sm" x="${sw / 2}" y="${H + 36}" text-anchor="middle">${esc(num(st.takt))} min · ${esc(fut ? num(e.length) + " " + tx(A("تقنية", "tech")) : tx(A("يدوي", "manual")))}</text></g>`;
    // a part on the belt, travelling to the next station at takt speed
    const cx = x + sw / 2 - 6, nx = i < n - 1 ? X(i + 1) + sw / 2 - 6 : cx + (rtl ? -1 : 1) * (sw / 2 + gap / 2);
    g += `<rect class="part" x="${cx}" y="${BELT - 6}" width="12" height="12" rx="2">${RM ? "" : `<animate attributeName="x" from="${cx}" to="${nx}" dur="${dur}s" repeatCount="indefinite"/>`}</rect>`;
  });
  g += `<text class="sm foot" x="${rtl ? W - M : M}" y="${BELT + 44}" text-anchor="start">${esc(tx(A("إيقاع الخط", "LINE TAKT")))} ${esc(num(r.takt))} min · ${esc(tx(A("الأجزاء تتحرك بسرعة الإيقاع", "parts move at takt speed")))}</text>`;
  svg.innerHTML = g;
}

export {};
