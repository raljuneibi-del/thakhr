/* SADEEM Hangar · The Foresight Telescope — "capability sky".
   Anticipation, not reaction (a stated SADEEM × State value), made literal: scrub the portfolio forward in time
   and watch which ideas ignite into national capabilities and WHEN — and, crucially, which national needs stay
   dark voids with nothing heading toward them. A deterministic, illustrative projection; not a forecast of record. */
import {
  $, $$, esc, t, tx, num, go, register, ai, ctx, lang, head, allIdeas, DB, DOMAINS, CHALLENGES, RM, icon,
  type Idea, type Ctx, type Insight, type Bi,
} from "@/core";

/* data palette for the canvas (domain hues); legend swatches reuse it so they always match the sky */
const DCOL: Record<string, string> = { land: "#C8A45C", air: "#6FA8E6", cyber: "#5FB79B", mfg: "#DB8E48" };
const NEEDDOM: Record<string, string> = { "N-01": "land", "N-02": "air", "N-03": "mfg", "N-04": "cyber", "N-05": "land" };

type Star = Idea & { _ang: number; _seed: number; ghost?: 1 };
interface Proj { it: Star; ps: number; ignited: boolean; r: number; ang: number; x: number; y: number; rad: number }
interface NeedState { reaching: number; heading: number; void: boolean }

const contained = (i: Idea) => i.sens === "high" || DB.gate.some((g: any) => g.idea === i.id && g.level === "high");
const scoreOf = (i: Idea) => i.score || (i.st >= 6 ? 70 : 50);
/** Stations advanced per projected year: momentum from score; contained records move slower (extra scrutiny). */
const velOf = (i: Idea) => (0.75 + scoreOf(i) / 100 * 1.5) * (contained(i) ? 0.55 : 1);

const YEARS = 5, STEPS = 60;                         // slider: 0..60 months
let cleanup: (() => void) | null = null;

register("foresight", {
  mount(el) {
    const NEEDS = CHALLENGES;                          // national needs sit on the rim
    const ideas = allIdeas() as Star[];
    const sectors: Record<string, number> = {}; const step = 2 * Math.PI / (NEEDS.length + 1);
    NEEDS.forEach((n, k) => (sectors[n.id] = -Math.PI / 2 + step * (k + 1)));
    const neutral = -Math.PI / 2;
    const setAng = (it: Star) => {
      const seed = [...String(it.id)].reduce((a, c) => a + c.charCodeAt(0), 0);
      it._ang = (sectors[it.ch || ""] != null ? sectors[it.ch!] : neutral) + ((seed % 38) - 19) * Math.PI / 180; it._seed = seed;
    };
    ideas.forEach(setAng);
    // "what-if": launching a challenge injects illustrative inbound ideas toward a need
    let scenario: Star[] = [], scnN = 0;
    const pool = () => ideas.concat(scenario);

    head(el,
      { ar: "المرصد", en: "The Foresight Telescope" },
      { ar: "سماء القدرات القادمة", en: "The sky of coming capabilities" },
      { ar: "استباق وطني بدل ردّ الفعل: حرّك الزمن لترى أي فكرة ستشتعل قدرةً وطنية ومتى، وأي احتياج وطني سيبقى فراغاً مظلماً بلا مسار يغذّيه.", en: "Anticipation, not reaction: move time to see which ideas will ignite as national capabilities and when — and which national needs stay dark voids with nothing heading toward them." });

    const ticks = Array.from({ length: YEARS + 1 }, (_, y) => `<span>${y === 0 ? esc(tx({ ar: "اليوم", en: "Today" })) : (lang() === "ar" ? `+${num(y)}` : `+${y}y`)}</span>`).join("");
    el.insertAdjacentHTML("beforeend", `<div class="wrap fsGrid">
      <div class="fsMain">
        <div class="fsScope">
          <canvas id="fsCv" tabindex="0" role="img" aria-describedby="fsHelp"></canvas>
          <div class="fsEpoch" aria-hidden="true"><span class="kk">${esc(tx({ ar: "الإسقاط", en: "Projection" }))}</span><b id="fsEpoch"></b></div>
          <p class="sr" id="fsHelp">${esc(tx({ ar: "سماء القدرات: كل نجمة فكرة، والاحتياجات الوطنية على الحافة. استخدم الأسهم للتنقّل بين النجوم وEnter لفتح الفكرة في المسار.", en: "Capability sky: every star is an idea, national needs sit on the rim. Use the arrow keys to move between stars and Enter to open the idea in the pipeline." }))}</p>
        </div>
        <div class="fsControls">
          <button class="btn sm" id="fsPlay"></button>
          <div class="fsSlider">
            <label class="sr" for="fsRange">${esc(tx({ ar: "السنوات القادمة", en: "Years ahead" }))}</label>
            <input type="range" id="fsRange" min="0" max="${STEPS}" step="1" value="0">
            <div class="fsTicks" aria-hidden="true">${ticks}</div>
          </div>
          <output class="fsYear" id="fsYear" for="fsRange"></output>
        </div>
      </div>
      <aside class="fsSide">
        <div class="fsRead" id="fsRead" aria-live="polite"></div>
        <section class="fsBlock">
          <h2 class="fsH">${esc(tx({ ar: "ماذا لو؟ سدّ فراغاً بإطلاق تحدٍّ:", en: "What if? Close a void by launching a challenge:" }))}</h2>
          <div class="fsWhatif" id="fsWhatif"></div>
        </section>
        <section class="fsBlock">
          <h2 class="fsH">${esc(tx({ ar: "مفتاح السماء", en: "Key to the sky" }))}</h2>
          <ul class="fsLegend" id="fsLegend"></ul>
        </section>
        <p class="proposed">${esc(t("proposed"))} · ${esc(tx({ ar: "إسقاط توضيحي", en: "illustrative projection" }))}</p>
      </aside>
    </div>`);

    $("#fsLegend", el).innerHTML =
      Object.keys(DCOL).map(d => `<li><i style="--c:${DCOL[d]}"></i>${esc(tx(DOMAINS[d]))}</li>`).join("")
      + `<li><i class="ct"></i>${esc(tx({ ar: "سجل محتوى", en: "Contained record" }))}</li>`
      + `<li><i class="gh"></i>${esc(tx({ ar: "فكرة من سيناريو «ماذا لو»", en: "Idea from the what-if scenario" }))}</li>`
      + `<li><i class="arc good"></i>${esc(tx({ ar: "احتياج مغطّى", en: "need covered" }))}</li>`
      + `<li><i class="arc crit"></i>${esc(tx({ ar: "فراغ قدرة", en: "capability void" }))}</li>`;

    /* ---- canvas + tokens ---- */
    const cv = $<HTMLCanvasElement>("#fsCv", el), x = cv.getContext("2d")!;
    const cs = getComputedStyle(el);
    const tok = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
    const C = {
      star: tok("--star", "#C8A45C"), good: tok("--good", "#3E7A4F"), warn: tok("--warn", "#B8832A"), crit: tok("--crit", "#A4332A"),
      ink: tok("--on-night", "#F1ECDF"), ink2: tok("--on-night-2", "rgba(241,236,223,.68)"), ink3: tok("--on-night-3", "rgba(241,236,223,.44)"),
      night: tok("--night", "#12100B"), mono: tok("--f-mono", "monospace"), body: tok("--f-body", "sans-serif"),
    };
    let W = 0, H0 = 0, cx = 0, cy = 0, Rmax = 0;
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H0 = cv.clientHeight; if (!W || !H0) return;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H0 * dpr); x.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H0 / 2; Rmax = Math.min(W, H0) / 2 - (W < 480 ? 30 : 40);
      draw();
    }

    let year = 0, playing = false, raf = 0, tRaf = 0, tw = 0, hover: Star | null = null, last: Proj[] = [];
    const rOf = (projSt: number) => Rmax * (0.14 + (11 - Math.max(0, Math.min(11, projSt))) / 11 * 0.82);
    const projected = (y = year): Proj[] => pool().map(it => {
      const ps = Math.min(11, it.st + velOf(it) * y), r = rOf(ps);
      const rad = (contained(it) ? 2.4 : 2.6 + scoreOf(it) / 100 * 3) + (ps >= 10 ? 2.5 : 0);
      return { it, ps, ignited: ps >= 10, r, ang: it._ang, x: cx + Math.cos(it._ang) * r, y: cy + Math.sin(it._ang) * r, rad };
    });
    const needStatus = (proj: Proj[]) => {
      const m: Record<string, NeedState> = {};
      NEEDS.forEach(n => {
        const linked = proj.filter(p => p.it.ch === n.id && !contained(p.it));
        const reaching = linked.filter(p => p.ps >= 9.5).length, heading = linked.filter(p => p.ps >= 6).length;
        m[n.id] = { reaching, heading, void: reaching === 0 };
      });
      return m;
    };

    let aiKey = "";
    function draw() {
      if (!W) return;
      x.clearRect(0, 0, W, H0);
      // deep-space wash
      const bg = x.createRadialGradient(cx, cy, 0, cx, cy, Rmax * 1.3);
      bg.addColorStop(0, "rgba(200,164,92,.07)"); bg.addColorStop(1, "rgba(14,12,8,0)");
      x.fillStyle = bg; x.fillRect(0, 0, W, H0);
      // fine reticle: cross-hair and degree ticks, the telescope's eyepiece
      x.strokeStyle = C.ink3; x.globalAlpha = .35; x.lineWidth = 1;
      x.beginPath(); x.moveTo(cx - Rmax - 4, cy); x.lineTo(cx + Rmax + 4, cy); x.moveTo(cx, cy - Rmax - 4); x.lineTo(cx, cy + Rmax + 4); x.stroke();
      for (let k = 0; k < 120; k++) {
        const a = k * Math.PI / 60, l = k % 10 === 0 ? 7 : 3;
        x.beginPath(); x.moveTo(cx + Math.cos(a) * (Rmax + 2), cy + Math.sin(a) * (Rmax + 2)); x.lineTo(cx + Math.cos(a) * (Rmax + 2 - l), cy + Math.sin(a) * (Rmax + 2 - l)); x.stroke();
      }
      x.globalAlpha = 1;
      // horizon rings + station labels (outer = new, inner = routed)
      x.textAlign = "center"; x.font = `10px ${C.body}`;
      ([[0, t("stage")[0]], [5, t("stage")[5]], [10, t("stage")[10]]] as Array<[number, string]>).forEach(([st, lab]) => {
        const r = rOf(st); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.strokeStyle = "rgba(200,164,92,.16)"; x.lineWidth = 1; x.stroke();
        const w = x.measureText(lab).width + 10; x.fillStyle = C.night; x.fillRect(cx - w / 2, cy - r - 13, w, 14);
        x.fillStyle = C.ink3; x.fillText(lab, cx, cy - r - 3);
      });
      const proj = projected(), ns = needStatus(proj);
      last = proj;
      // national needs as rim arcs
      NEEDS.forEach(n => {
        const a = sectors[n.id], half = step * 0.42, st = ns[n.id];
        const col = st.void ? C.crit : st.reaching >= 1 ? C.good : C.warn;
        x.beginPath(); x.arc(cx, cy, Rmax + 10, a - half, a + half); x.strokeStyle = col; x.lineWidth = st.void ? 4 : 2.5;
        x.globalAlpha = st.void ? (RM ? .85 : 0.5 + 0.5 * Math.sin(tw * 3)) : 0.85; x.stroke(); x.globalAlpha = 1;
        const lx = cx + Math.cos(a) * (Rmax + 25), ly = cy + Math.sin(a) * (Rmax + 25);
        x.fillStyle = col; x.font = `600 10px ${C.mono}`; x.fillText(n.id, lx, ly + 3);
      });
      // trails + stars
      proj.forEach(p => {
        const c = contained(p.it);
        if (year > 0) {
          const sR = rOf(p.it.st);
          x.beginPath(); x.moveTo(cx + Math.cos(p.ang) * sR, cy + Math.sin(p.ang) * sR); x.lineTo(p.x, p.y);
          x.strokeStyle = c ? "rgba(179,38,30,.2)" : "rgba(200,164,92,.2)"; x.lineWidth = 1; x.stroke();
        }
        const col = c ? C.crit : (DCOL[p.it.area] || C.star);
        if (p.ignited) { x.beginPath(); x.arc(p.x, p.y, p.rad + 6 + (RM ? 0 : 2 * Math.sin(tw * 4 + p.it._seed)), 0, 7); x.fillStyle = "rgba(231,206,146,.16)"; x.fill(); }
        if (p.it.ghost) { // scenario idea: a hollow dashed ring, so it reads as proposed, not real
          x.beginPath(); x.arc(p.x, p.y, p.rad + 1.5, 0, 7); x.strokeStyle = col; x.lineWidth = 1.4; x.setLineDash([3, 3]); x.globalAlpha = .9; x.stroke(); x.setLineDash([]); x.globalAlpha = 1;
        } else {
          x.beginPath(); x.arc(p.x, p.y, p.rad, 0, 7); x.fillStyle = col; x.shadowBlur = p.ignited ? 16 : 8; x.shadowColor = col;
          x.globalAlpha = hover === p.it ? 1 : .92; x.fill(); x.shadowBlur = 0; x.globalAlpha = 1;
        }
        if (hover === p.it) { x.beginPath(); x.arc(p.x, p.y, p.rad + 5, 0, 7); x.strokeStyle = C.ink; x.lineWidth = 1; x.stroke(); }
      });
      // core star
      x.save(); x.translate(cx, cy); x.rotate(RM ? 0 : tw * .1); x.beginPath();
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, rr = k % 2 ? 6 : 19; const fx = Math.cos(a) * rr, fy = Math.sin(a) * rr; k ? x.lineTo(fx, fy) : x.moveTo(fx, fy); }
      x.closePath(); x.fillStyle = "#E7CE92"; x.shadowBlur = 24; x.shadowColor = C.star; x.fill(); x.restore(); x.shadowBlur = 0;
      // hover label
      if (hover) {
        const p = proj.find(q => q.it === hover);
        if (p) {
          const lab = contained(hover) ? tx({ ar: "سجل محتوى", en: "Contained record" }) : `${hover.id} · ${tx(hover.t)}`;
          x.font = `12px ${C.body}`; const w = Math.min(W - 16, x.measureText(lab).width + 20);
          const bx = Math.max(8, Math.min(W - 8 - w, p.x - w / 2)), by = p.y - p.rad - 34 < 4 ? p.y + p.rad + 10 : p.y - p.rad - 34;
          x.fillStyle = "rgba(18,16,11,.94)"; x.strokeStyle = "rgba(200,164,92,.5)"; x.lineWidth = 1;
          x.beginPath(); x.rect(bx, by, w, 24); x.fill(); x.stroke();
          x.fillStyle = C.ink; x.textAlign = "center"; x.fillText(lab, bx + w / 2, by + 16, w - 12);
        }
      }
      // readout
      const caps = proj.filter(p => p.ignited && !contained(p.it)).length, voids = NEEDS.filter(n => ns[n.id].void).length;
      const key = `${caps}|${voids}|${Math.round(year * 10)}|${scenario.length}`;
      if (key !== aiKey) {
        aiKey = key;
        $("#fsRead", el).innerHTML = `
          <div class="fsStat"><b>${num(caps)}</b><span>${esc(tx({ ar: "قدرة وطنية مشتعلة", en: "national capabilities ignited" }))}</span></div>
          <div class="fsStat ${voids ? "bad" : "good"}"><b>${num(voids)}</b><span>${esc(tx({ ar: "احتياج بلا مسار قادم", en: "needs with no path coming" }))}</span></div>
          ${scenario.length ? `<div class="fsStat scn"><b>${num(scenario.length)}</b><span>${esc(tx({ ar: "فكرة من سيناريو «ماذا لو»", en: "ideas from the what-if scenario" }))}</span></div>` : ""}`;
        cv.setAttribute("aria-label", tx({ ar: `سماء القدرات: ${num(caps)} قدرة مشتعلة، ${num(voids)} احتياج بلا مسار قادم.`, en: `Capability sky: ${caps} capabilities ignited, ${voids} needs with no path coming.` }));
        ai.set({ state: { caps, voids, year: Math.round(year * 10) / 10, scn: scenario.length } });
      }
    }

    /* ---- pointer + keyboard ---- */
    const pickAt = (mx: number, my: number) => { let best: Star | null = null, bd = 16; last.forEach(p => { const d = Math.hypot(mx - p.x, my - p.y); if (d < bd) { bd = d; best = p.it; } }); return best as Star | null; };
    const setHover = (h: Star | null) => { if (h === hover) return; hover = h; cv.style.cursor = h && !contained(h) ? "pointer" : "default"; if (!loopOn()) draw(); };
    const open = (h: Star | null) => { if (h && !contained(h) && !h.ghost) { ctx.state = { openIdea: h.id }; go("lab"); } };
    cv.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(); setHover(pickAt(e.clientX - r.left, e.clientY - r.top)); });
    cv.addEventListener("pointerleave", () => setHover(null));
    cv.addEventListener("click", e => { const r = cv.getBoundingClientRect(); open(pickAt(e.clientX - r.left, e.clientY - r.top)); });
    cv.addEventListener("keydown", e => {
      const order = [...last].sort((a, b) => ((a.ang + 7 * Math.PI) % (2 * Math.PI)) - ((b.ang + 7 * Math.PI) % (2 * Math.PI)) || a.r - b.r).map(p => p.it);
      if (!order.length) return;
      const i = hover ? order.indexOf(hover) : -1;
      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault(); const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
        setHover(order[(i + d + order.length) % order.length]);
      } else if (e.key === "Enter") { e.preventDefault(); open(hover); }
      else if (e.key === "Escape") setHover(null);
    });
    cv.addEventListener("blur", () => setHover(null));

    /* ---- what-if ---- */
    function launch(needId: string) {
      const dom = NEEDDOM[needId] || "land";
      for (let k = 0; k < 3; k++) {
        const it = { id: "WHATIF-" + (++scnN), t: { ar: "فكرة مقترحة عبر تحدٍّ", en: "Idea drawn by a challenge" }, area: dom, src: "talent", ch: needId, st: 1, score: 64 + k * 6, ghost: 1, owner: { ar: "", en: "" }, days: 0 } as unknown as Star;
        setAng(it); scenario.push(it);
      }
      renderWhatif(); draw();
    }
    function renderWhatif() {
      const ns5 = needStatus(projected(YEARS));
      $("#fsWhatif", el).innerHTML = `<ul class="fsNeeds">${NEEDS.map(n => {
        const v = ns5[n.id].void;
        return `<li class="${v ? "void" : "ok"}"><span class="mono">${esc(n.id)}</span><div class="nb"><span class="nm">${esc(tx(n.t))}</span>
          ${v ? `<button class="btn sm ghost" data-n="${esc(n.id)}">${esc(tx({ ar: "أطلق تحدياً", en: "Launch a challenge" }))}</button>`
              : `<span class="cov">${esc(tx({ ar: "مغطّى بحلول +٥ سنوات", en: "covered by +5y" }))}</span>`}</div></li>`;
      }).join("")}</ul>${scenario.length ? `<button class="btn sm quiet" id="fsReset">${icon("close")}${esc(tx({ ar: "مسح السيناريو", en: "Clear scenario" }))}</button>` : ""}`;
      $$<HTMLButtonElement>("[data-n]", el).forEach(b => b.onclick = () => launch(b.dataset.n!));
      const rs = $("#fsReset", el); if (rs) rs.onclick = () => { scenario = []; renderWhatif(); draw(); };
    }

    /* ---- time ---- */
    const range = $<HTMLInputElement>("#fsRange", el), playB = $<HTMLButtonElement>("#fsPlay", el);
    const yearLabel = (v: number) => v === 0 ? tx({ ar: "اليوم", en: "Today" }) : (lang() === "ar" ? `+${num((v / 12).toFixed(1))} سنة` : `+${(v / 12).toFixed(1)} yr`);
    const setPlayLabel = (k: "run" | "pause" | "replay") => {
      const L: Record<string, [string, Bi]> = {
        run: ["▶", { ar: "شغّل الزمن", en: "Run time" }], pause: ["❚❚", { ar: "إيقاف", en: "Pause" }], replay: ["↺", { ar: "أعد", en: "Replay" }],
      };
      playB.innerHTML = `<span aria-hidden="true" class="gl">${L[k][0]}</span>${esc(tx(L[k][1]))}`;
      playB.setAttribute("aria-pressed", String(k === "pause"));
    };
    const setYear = (v: number) => {
      year = v / 12;
      const lab = yearLabel(v); $("#fsYear", el).textContent = lab; $("#fsEpoch", el).textContent = lab;
      range.style.setProperty("--p", `${v / STEPS * 100}%`);
      if (!loopOn()) draw();
    };
    range.addEventListener("input", () => { if (playing) { playing = false; setPlayLabel("run"); } setYear(+range.value); });
    playB.onclick = () => {
      if (playing) { playing = false; cancelAnimationFrame(raf); setPlayLabel("run"); return; }
      playing = true; setPlayLabel("pause");
      let v = +range.value >= STEPS ? 0 : +range.value;
      const run = () => {
        if (!playing) return;
        v += 0.5; if (v >= STEPS) { v = STEPS; playing = false; setPlayLabel("replay"); }
        range.value = String(v); setYear(v); if (playing) raf = requestAnimationFrame(run);
      };
      raf = requestAnimationFrame(run);
    };

    /* ---- twinkle loop (off for reduced motion) ---- */
    const loopOn = () => !RM;
    const loop = () => { tRaf = requestAnimationFrame(loop); tw += 0.02; draw(); };

    setPlayLabel("run"); setYear(0); renderWhatif();
    const ro = new ResizeObserver(size); ro.observe(cv); size();
    if (loopOn()) loop();

    cleanup = () => { playing = false; cancelAnimationFrame(raf); cancelAnimationFrame(tRaf); ro.disconnect(); };
  },

  unmount() { cleanup?.(); cleanup = null; },

  insight(c: Ctx): Insight {
    const st = c.state || {};
    return {
      role: { ar: "مرصد الاستباق", en: "Foresight watch" },
      lines: [
        { ar: `الإسقاط عند ${st.year ? `+${num(st.year)} سنة` : "اليوم"}: ${num(st.caps || 0)} قدرة وطنية مشتعلة، و${num(st.voids || 0)} احتياج بلا مسار قادم.`, en: `Projection at ${st.year ? `+${st.year}y` : "today"}: ${st.caps || 0} national capabilities ignited, ${st.voids || 0} needs with no path coming.` },
        { ar: "الفراغ المظلم هو القيمة: احتياج وطني لا تتجه إليه أي فكرة. سدّه بإطلاق تحدٍّ أو توجيه فكرة قائمة قبل أن يصبح فجوة قدرة.", en: "The dark void is the value: a national need no idea is moving toward. Close it by opening a challenge or steering an existing idea before it becomes a capability gap." },
        ...(st.scn ? [{ ar: `سيناريو «ماذا لو» فعّال: ${num(st.scn)} فكرة افتراضية تُظهر أثر إطلاق تحدٍّ على سماء السنوات القادمة.`, en: `A what-if scenario is active: ${st.scn} illustrative ideas showing how launching a challenge changes the coming-years sky.` }] : []),
        { ar: "هذا إسقاط توضيحي حتمي من زخم الأفكار، وليس تنبؤاً رسمياً.", en: "This is a deterministic illustrative projection from idea momentum, not an official forecast." },
      ],
      actions: [{ label: { ar: "افتح احتياجات الدولة", en: "Open national needs" }, run: () => { ctx.state = { osView: "challenges" }; go("os"); } }],
    };
  },
});
