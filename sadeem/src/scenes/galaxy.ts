/* SADEEM Hangar · The National Constellation.
   The whole portfolio rendered as a living galaxy: every idea is a star. Angle = domain, radius = pipeline station
   (a diffuse outer nebula of new ideas drawn inward to the SADEEM core), brightness = national score, contained
   records are dark red motes whose content is withheld. On entry the stars fly in from the rim and the galaxy forms.
   WebGL (three.js); where WebGL is unavailable the zone draws an intentional 2D chart of the same geometry. */
import {
  $, $$, esc, t, tx, num, go, register, ai, ctx, current, allIdeas, DB, DOMAINS, SOURCES, RM, loadThree, hasWebGL, icon, svgEl,
  type Idea, type Ctx, type Insight,
} from "@/core";

const DOMS = ["land", "air", "cyber", "mfg"] as const;
/* data palette (sRGB 0..1) shared by the WebGL stars, the 2D chart and the legend */
const DCOL: Record<string, [number, number, number]> = { land: [0.78, 0.62, 0.32], air: [0.44, 0.66, 0.90], cyber: [0.36, 0.73, 0.60], mfg: [0.86, 0.55, 0.28] };
const CONT: [number, number, number] = [0.58, 0.16, 0.14];
const DOM_ANG: Record<string, number> = { land: 0, air: Math.PI / 2, cyber: Math.PI, mfg: 3 * Math.PI / 2 };
const rgb = (c: number[]) => `rgb(${c.map(v => Math.round(v * 255)).join(",")})`;

const contained = (i: Idea) => i.sens === "high" || DB.gate.some((g: any) => g.idea === i.id && g.level === "high");
const scoreOf = (i: Idea) => i.score || (i.st >= 6 ? 70 : 50);
const stOf = (i: Idea) => Math.max(0, Math.min(10, i.st));
const seedOf = (i: Idea) => [...String(i.id)].reduce((a, c) => a + c.charCodeAt(0), 0);
/** Galactic placement shared by 3D and 2D: angle from domain (±35° jitter), radius from station (outer = new). */
function place(it: Idea) {
  const st = stOf(it), seed = seedOf(it);
  const r = 2.2 + (11 - st) / 11 * 8.6;
  const ang = (DOM_ANG[it.area] ?? 0) + ((seed % 70) - 35) * Math.PI / 180;
  const y = ((seed % 13) / 13 - .5) * 2.6 * (1 - st / 14) + Math.sin(seed) * 0.3;
  return { r, ang, y, seed };
}

let cleanup: (() => void) | null = null;

register("galaxy", {
  async mount(el) {
    const ideas = allIdeas();

    el.innerHTML = `<div class="galaxyWrap">
      <canvas id="galCv" tabindex="0" aria-label="${esc(tx({ ar: "الكوكبة الوطنية: اسحب أو استخدم الأسهم للدوران، و+ و− للتقريب", en: "National constellation: drag or use the arrow keys to orbit, + and − to zoom" }))}"></canvas>
      <div class="galHead">
        <span class="kk">${esc(tx({ ar: "الكوكبة الوطنية", en: "The National Constellation" }))}</span>
        <h1>${esc(tx({ ar: "المحفظة الوطنية كمجرّة حيّة", en: "The national portfolio as a living galaxy" }))}</h1>
        <p>${esc(tx({ ar: "كل فكرة نجمة: تدخل سديماً في الأطراف وتُسحب نحو نواة سديم عبر إحدى عشرة محطة، حتى تشتعل قدرةً وطنية. اسحب للدوران، والمس نجمة لتفتحها.", en: "Every idea is a star: it enters as nebula at the rim and is drawn toward the SADEEM core through eleven stations, until it ignites as a national capability. Drag to orbit, touch a star to open it." }))}</p>
        <details class="galIndex">
          <summary>${icon("grid")}${esc(tx({ ar: "فهرس النجوم", en: "Star index" }))} <span class="n">${num(ideas.length)}</span></summary>
          <ul>${ideas.map((it, i) => { const c = contained(it); return `<li><button data-star="${i}"${c ? ` class="ct"` : ""}>
            <i style="--c:${rgb(c ? CONT : DCOL[it.area] || [.8, .7, .4])}"></i>
            <span class="mono">${c ? "—" : esc(it.id)}</span><span class="nm">${esc(c ? tx({ ar: "سجل محتوى", en: "Contained record" }) : tx(it.t))}</span></button></li>`; }).join("")}</ul>
        </details>
      </div>
      <aside class="galCard" id="galCard" hidden aria-live="polite"></aside>
      <div class="galTip" id="galTip" hidden></div>
      <div class="galFoot">
        <ul class="galLegend">${DOMS.map(d => `<li><i style="--c:${rgb(DCOL[d])}"></i>${esc(tx(DOMAINS[d]))}</li>`).join("")}
          <li><i class="ct" style="--c:${rgb(CONT)}"></i>${esc(tx({ ar: "محتواة", en: "contained" }))}</li></ul>
        <div class="galScale" aria-hidden="true">
          <span class="kk">${esc(tx({ ar: "البُعد عن النواة = المحطة", en: "Distance from core = station" }))}</span>
          <ol>${[0, 5, 10].map(s => `<li><b></b>${esc(t("stage")[s])}</li>`).join("")}</ol>
        </div>
        <p class="galNote"><span class="proposed">${esc(t("proposed"))}</span> · ${esc(tx({ ar: "البيانات مثال توضيحي", en: "data shown is illustrative" }))}<span class="galMode" id="galMode"></span></p>
      </div>
    </div>`;

    const wrap = $(".galaxyWrap", el);
    let focusI = -1;
    const disposers: Array<() => void> = [];

    /* ---- the card (shared by 3D and 2D) ---- */
    function openCard(i: number) {
      focusI = i; const it = ideas[i]; const c = $("#galCard", el); const cont = contained(it);
      const st = t("stage")[stOf(it)];
      c.hidden = false;
      c.innerHTML = `<button class="galX" aria-label="${esc(t("close"))}">${icon("close")}</button>
        ${cont ? `<span class="tag crit">${icon("lock")}${esc(t("contained"))}</span><b class="gcT">${esc(tx({ ar: "سجل محتوى", en: "Contained record" }))}</b>
          <p class="gcM">${esc(tx({ ar: "المحتوى محجوب. تظهر الحالة فقط، ولا يُرسل النص إلى أي نموذج خارجي.", en: "Content withheld. Only the status shows; the text is never sent to an external model." }))}</p>`
        : `<span class="tag ${it.st >= 10 ? "good" : it.st >= 6 ? "sov" : ""}">${esc(it.id)}</span><b class="gcT">${esc(tx(it.t))}</b>
          <dl class="gcKv">
            <dt>${esc(tx({ ar: "المجال", en: "Domain" }))}</dt><dd>${esc(tx(DOMAINS[it.area] || { ar: "", en: "" }))}</dd>
            <dt>${esc(tx({ ar: "المصدر", en: "Source" }))}</dt><dd>${esc(tx(SOURCES[it.src] || it.owner))}</dd>
            <dt>${esc(tx({ ar: "المحطة", en: "Station" }))}</dt><dd>${esc(st)} · ${num(stOf(it) + 1)}/${num(11)}</dd>
            <dt>${esc(tx({ ar: "التقييم الوطني", en: "National score" }))}</dt><dd>${num(scoreOf(it))}/${num(100)}</dd>
          </dl>
          <div class="bar gold" aria-hidden="true"><i style="width:${(stOf(it) + 1) / 11 * 100}%"></i></div>`}
        <div class="gcB"><button class="btn sm" data-open>${esc(tx({ ar: "افتح في المسار", en: "Open in the pipeline" }))}</button></div>`;
      $<HTMLButtonElement>(".galX", c).onclick = closeCard;
      $<HTMLButtonElement>("[data-open]", c).onclick = () => { ctx.state = { openIdea: it.id }; go("lab"); };
      $$(".galFlat .st", el).forEach(n => n.classList.toggle("on", +n.dataset.i! === i));
      ai.set({ object: it.id });
    }
    function closeCard() { $("#galCard", el).hidden = true; focusI = -1; $$(".galFlat .st", el).forEach(n => n.classList.remove("on")); ai.set({ object: null }); }
    $$<HTMLButtonElement>("[data-star]", el).forEach(b => b.onclick = () => { openCard(+b.dataset.star!); $<HTMLDetailsElement>(".galIndex", el).open = false; $<HTMLButtonElement>("#galCard .galX", el)?.focus(); });
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape" && !$("#galCard", el).hidden) closeCard(); };
    el.addEventListener("keydown", onEsc); disposers.push(() => el.removeEventListener("keydown", onEsc));
    cleanup = () => disposers.splice(0).forEach(f => { try { f(); } catch { /* ignore */ } });

    /* ---- 2D chart (no WebGL): same geometry seen from above ---- */
    const flat = (why: string) => {
      wrap.classList.add("flat");
      $("#galMode", el).textContent = " · " + why;
      const V = 760, C = V / 2, S = C / 12.8;
      const svg = svgEl("svg", { class: "galFlat", viewBox: `0 0 ${V} ${V}`, role: "group", "aria-label": tx({ ar: "الكوكبة الوطنية، عرض ثنائي الأبعاد", en: "National constellation, 2D view" }) });
      const add = (n: string, a: Record<string, string | number>, p: Element = svg) => { const e = svgEl(n, a); p.appendChild(e); return e; };
      [0, 5, 10].forEach(s => add("circle", { class: "ring", cx: C, cy: C, r: (2.2 + (11 - s) / 11 * 8.6) * S }));
      DOMS.forEach(d => {
        const a = DOM_ANG[d]; add("line", { class: "axis", x1: C, y1: C, x2: C + Math.cos(a) * 11.4 * S, y2: C + Math.sin(a) * 11.4 * S });
        const tt = add("text", { class: "dm", x: C + Math.cos(a) * 11.2 * S, y: C + Math.sin(a) * 11.2 * S + (Math.sin(a) > .5 ? 18 : Math.sin(a) < -.5 ? -10 : 4), "text-anchor": Math.cos(a) > .5 ? "end" : Math.cos(a) < -.5 ? "start" : "middle" });
        tt.textContent = tx(DOMAINS[d]);
      });
      add("path", { class: "core", d: "M0-22 3.4-3.4 22 0 3.4 3.4 0 22-3.4 3.4-22 0-3.4-3.4Z", transform: `translate(${C} ${C})` });
      ideas.forEach((it, i) => {
        const p = place(it), cont = contained(it);
        const x = C + Math.cos(p.ang) * p.r * S, y = C + Math.sin(p.ang) * p.r * S;
        const rad = cont ? 4 : 4 + scoreOf(it) / 100 * 5 + (it.st >= 10 ? 2.5 : 0);
        const g = add("g", { class: "st" + (cont ? " ct" : ""), "data-i": i, tabindex: 0, role: "button", "aria-label": cont ? tx({ ar: "سجل محتوى", en: "Contained record" }) : `${it.id} · ${tx(it.t)}` });
        if (!cont) add("circle", { class: "gl", cx: x, cy: y, r: rad * 2.4, fill: rgb(DCOL[it.area] || [.8, .7, .4]) }, g);
        add("circle", { class: "dot", cx: x, cy: y, r: rad, fill: rgb(cont ? CONT : DCOL[it.area] || [.8, .7, .4]) }, g);
        add("circle", { class: "sel", cx: x, cy: y, r: rad + 6 }, g);
        g.addEventListener("click", () => openCard(i));
        g.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCard(i); } });
      });
      $("#galCv", el).replaceWith(svg);
    };

    if (!hasWebGL()) { flat(tx({ ar: "عرض ثنائي الأبعاد (WebGL غير متاح)", en: "2D view (WebGL unavailable)" })); return; }
    let T: typeof import("three");
    try { T = await loadThree(); } catch { flat(tx({ ar: "عرض ثنائي الأبعاد", en: "2D view" })); return; }
    if (current() !== "galaxy" || !el.isConnected) return;   // navigated away while loading

    const cv = $<HTMLCanvasElement>("#galCv", el);
    let R: import("three").WebGLRenderer;
    try { R = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, powerPreference: "high-performance" }); }
    catch { flat(tx({ ar: "عرض ثنائي الأبعاد (WebGL غير متاح)", en: "2D view (WebGL unavailable)" })); return; }
    const PIX = Math.min(devicePixelRatio || 1, 1.7);
    R.setPixelRatio(PIX); R.setClearColor(0x000000, 0); R.outputColorSpace = T.SRGBColorSpace;
    const S = new T.Scene(); S.fog = new T.FogExp2(0x0E0C08, 0.035);
    const CAM = new T.PerspectiveCamera(46, 1, .1, 120); CAM.position.set(0, 7, 17);
    const lin = new T.Color();
    const toLinear = (r: number, g: number, b: number) => { lin.setRGB(r, g, b, T.SRGBColorSpace); return [lin.r, lin.g, lin.b]; };

    // ---- ambient dust (non-interactive) ----
    const DN = innerWidth < 700 ? 1400 : 3200, dpos = new Float32Array(DN * 3), dcol = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) {
      const a = Math.random() * Math.PI * 2, rr = 2 + Math.pow(Math.random(), .6) * 12, y = (Math.random() - .5) * 3.2 * (1 - rr / 16);
      dpos.set([Math.cos(a) * rr, y, Math.sin(a) * rr], i * 3);
      const b = .5 + Math.random() * .5; dcol.set(toLinear(0.66 * b, 0.55 * b, 0.33 * b), i * 3);
    }
    const dg = new T.BufferGeometry();
    dg.setAttribute("position", new T.BufferAttribute(dpos, 3)); dg.setAttribute("color", new T.BufferAttribute(dcol, 3));
    const dm = new T.PointsMaterial({ size: .06, vertexColors: true, transparent: true, opacity: .5, depthWrite: false, blending: T.AdditiveBlending });
    const dust = new T.Points(dg, dm); S.add(dust);

    // ---- idea stars (interactive) ----
    const N = ideas.length;
    const pos = new Float32Array(N * 3), start = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N), dark = new Float32Array(N);
    ideas.forEach((it, i) => {
      const p = place(it), cont = contained(it);
      pos.set([Math.cos(p.ang) * p.r, p.y, Math.sin(p.ang) * p.r], i * 3);
      const rimA = Math.random() * Math.PI * 2, rimR = 13 + Math.random() * 4;
      start.set([Math.cos(rimA) * rimR, (Math.random() - .5) * 5, Math.sin(rimA) * rimR], i * 3);
      // brightness = national score; contained records are dim motes
      const k = cont ? 1 : 0.62 + scoreOf(it) / 100 * 0.5;
      col.set((cont ? CONT : DCOL[it.area] || [0.8, 0.7, 0.4]).map(v => Math.min(1, v * k)), i * 3);
      siz[i] = cont ? 1.8 : (2.0 + scoreOf(it) / 100 * 3.6 + (it.st >= 10 ? 2.4 : 0));
      dark[i] = cont ? 1 : 0;
    });
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.BufferAttribute(RM ? pos.slice() : start.slice(), 3));
    g.setAttribute("aColor", new T.BufferAttribute(col, 3));
    g.setAttribute("aSize", new T.BufferAttribute(siz, 1));
    g.setAttribute("aDark", new T.BufferAttribute(dark, 1));
    const U = { uPix: { value: PIX }, uT: { value: 0 }, uFocus: { value: -1 } };
    const VS = `uniform float uPix; uniform float uT;
      attribute vec3 aColor; attribute float aSize; attribute float aDark;
      varying vec3 vC; varying float vTw; varying float vDark;
      void main(){
        vC = aColor; vDark = aDark;
        vTw = aDark > .5 ? 0.8 : 0.75 + 0.25 * sin(uT * 2.0 + position.x * 3.0 + position.z * 2.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPix * (120.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`;
    const FS = `varying vec3 vC; varying float vTw; varying float vDark;
      void main(){
        vec2 c = gl_PointCoord - 0.5; float d = length(c);
        float a = smoothstep(0.5, 0.06, d);
        float core = smoothstep(0.22, 0.0, d) * (1.0 - vDark);
        vec3 col = mix(vC, vec3(1.0), core * 0.7);
        a *= mix(1.0, 0.85, vDark);
        gl_FragColor = vec4(col * vTw, a);
      }`;
    const M = new T.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    const stars = new T.Points(g, M); S.add(stars);

    // ---- core: the SADEEM four-point star ----
    const shape = new T.Shape(); const R1 = 1.15, R2 = .32;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, rr = k % 2 ? R2 : R1; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (k) shape.lineTo(x, y); else shape.moveTo(x, y); }
    shape.closePath();
    const coreGeo = new T.ShapeGeometry(shape), coreMat = new T.MeshBasicMaterial({ color: 0xE7CE92, transparent: true, opacity: .95, side: T.DoubleSide, fog: false });
    const core = new T.Mesh(coreGeo, coreMat); core.rotation.x = -Math.PI / 2; S.add(core);
    // a soft radial glow (not a flat disc) under the core
    const glow = document.createElement("canvas"); glow.width = glow.height = 128;
    const gx = glow.getContext("2d")!, gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(231,206,146,1)"); gr.addColorStop(.35, "rgba(200,164,92,.35)"); gr.addColorStop(1, "rgba(200,164,92,0)");
    gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
    const glowTex = new T.CanvasTexture(glow); glowTex.colorSpace = T.SRGBColorSpace;
    const haloGeo = new T.PlaneGeometry(7, 7), haloMat = new T.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false, fog: false });
    const halo = new T.Mesh(haloGeo, haloMat); S.add(halo);
    // station rings on the galactic plane: outer = collection, inner = routing (the scale made visible)
    const ringMat = new T.LineBasicMaterial({ color: 0xC8A45C, transparent: true, opacity: .14, depthWrite: false });
    const ringGeos = [0, 5, 10].map(s => {
      const r = 2.2 + (11 - s) / 11 * 8.6, pts: import("three").Vector3[] = [];
      for (let k = 0; k <= 128; k++) { const a = k / 128 * Math.PI * 2; pts.push(new T.Vector3(Math.cos(a) * r, -.05, Math.sin(a) * r)); }
      const rg = new T.BufferGeometry().setFromPoints(pts); S.add(new T.Line(rg, ringMat)); return rg;
    });

    // ---- interaction ----
    const ray = new T.Raycaster(); ray.params.Points = { threshold: 1.1 }; const mouse = new T.Vector2();
    let hoverI = -1;
    const orb = { th: .6, ph: .95, r: 19, tth: .6, tph: .95, tr: 19, drag: false, px: 0, py: 0, user: 0, moved: false };
    const tip = $("#galTip", el);
    const pick = (x: number, y: number) => {
      const rect = cv.getBoundingClientRect(); mouse.x = ((x - rect.left) / rect.width) * 2 - 1; mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(mouse, CAM); const hits = ray.intersectObject(stars); return hits.length ? hits[0].index ?? -1 : -1;
    };
    const showTip = (i: number, x: number, y: number) => {
      if (i < 0) { tip.hidden = true; return; }
      const it = ideas[i], r = wrap.getBoundingClientRect();
      tip.textContent = contained(it) ? tx({ ar: "سجل محتوى", en: "Contained record" }) : `${it.id} · ${tx(it.t)}`;
      tip.hidden = false; tip.style.left = `${x - r.left}px`; tip.style.top = `${y - r.top}px`;
    };
    const onDown = (e: PointerEvent) => { orb.drag = true; orb.px = e.clientX; orb.py = e.clientY; orb.moved = false; cv.setPointerCapture(e.pointerId); orb.user = performance.now(); };
    const onMove = (e: PointerEvent) => {
      if (orb.drag) {
        const dx = e.clientX - orb.px, dy = e.clientY - orb.py;
        if (Math.abs(dx) + Math.abs(dy) > 4) orb.moved = true;
        orb.tth -= dx * .006; orb.tph = Math.max(.25, Math.min(1.4, orb.tph - dy * .005)); orb.px = e.clientX; orb.py = e.clientY; orb.user = performance.now();
        tip.hidden = true;
      } else if (e.pointerType === "mouse") {
        const idx = pick(e.clientX, e.clientY);
        if (idx !== hoverI) { hoverI = idx; cv.style.cursor = idx >= 0 ? "pointer" : "grab"; }
        showTip(idx, e.clientX, e.clientY);
      }
    };
    const onUp = (e: PointerEvent) => { const was = orb.drag; orb.drag = false; if (was && !orb.moved) { const idx = pick(e.clientX, e.clientY); if (idx >= 0) openCard(idx); } };
    const onCancel = () => { orb.drag = false; };
    const onLeave = () => { tip.hidden = true; hoverI = -1; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); orb.tr = Math.max(7, Math.min(34, orb.tr * (1 + Math.sign(e.deltaY) * .08))); orb.user = performance.now(); };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key; let used = true;
      if (k === "ArrowLeft") orb.tth += .15; else if (k === "ArrowRight") orb.tth -= .15;
      else if (k === "ArrowUp") orb.tph = Math.min(1.4, orb.tph + .1); else if (k === "ArrowDown") orb.tph = Math.max(.25, orb.tph - .1);
      else if (k === "+" || k === "=") orb.tr = Math.max(7, orb.tr * .9); else if (k === "-" || k === "_") orb.tr = Math.min(34, orb.tr * 1.1);
      else used = false;
      if (used) { e.preventDefault(); orb.user = performance.now(); }
    };
    cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onCancel); cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("wheel", onWheel, { passive: false }); cv.addEventListener("keydown", onKey);
    cv.style.cursor = "grab";

    const size = () => { const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return; R.setSize(w, h, false); CAM.aspect = w / h; CAM.updateProjectionMatrix(); };
    size(); const ro = new ResizeObserver(size); ro.observe(cv);

    let raf = 0, stopped = false, form = RM ? 1 : 0;
    const t0 = performance.now(), target = new T.Vector3(), origin = new T.Vector3();
    // pause when the tab is hidden or the canvas scrolls away
    let visible = true;
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf && !stopped) raf = requestAnimationFrame(frame); }, { threshold: 0 });
    io.observe(cv);
    function frame(now: number) {
      raf = 0; if (stopped) return;
      if (visible) raf = requestAnimationFrame(frame);
      const tt = (now - t0) / 1000; U.uT.value = RM ? 0 : tt;
      if (form < 1) {
        form = Math.min(1, form + .012); const e = 1 - Math.pow(1 - form, 3); const p = g.attributes.position.array as Float32Array;
        for (let i = 0; i < N * 3; i++) p[i] = start[i] + (pos[i] - start[i]) * e;
        g.attributes.position.needsUpdate = true; if (form >= 1) g.computeBoundingSphere();
      }
      if (performance.now() - orb.user > 4000 && !RM) orb.tth += .0015;        // idle auto-rotate
      orb.th += (orb.tth - orb.th) * .08; orb.ph += (orb.tph - orb.ph) * .08; orb.r += (orb.tr - orb.r) * .08;
      CAM.position.set(Math.sin(orb.th) * Math.cos(orb.ph) * orb.r, Math.sin(orb.ph) * orb.r + 2, Math.cos(orb.th) * Math.cos(orb.ph) * orb.r);
      if (focusI >= 0) target.lerp(origin.set(pos[focusI * 3], pos[focusI * 3 + 1], pos[focusI * 3 + 2]).multiplyScalar(.5), .1);
      else target.lerp(origin.set(0, 0, 0), .1);
      CAM.lookAt(target);
      core.lookAt(CAM.position); core.rotation.z = RM ? 0 : tt * .15;
      haloMat.opacity = .28 + (RM ? 0 : .08 * Math.sin(tt * 1.2)); halo.quaternion.copy(CAM.quaternion);
      dust.rotation.y = RM ? 0 : tt * .01;
      R.render(S, CAM);
    }
    raf = requestAnimationFrame(frame);
    $("#galMode", el).textContent = "";

    disposers.push(() => {
      stopped = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onCancel); cv.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("wheel", onWheel); cv.removeEventListener("keydown", onKey);
      [g, dg, coreGeo, haloGeo, ...ringGeos].forEach(x => x.dispose());
      [M, dm, coreMat, haloMat, ringMat].forEach(x => x.dispose()); glowTex.dispose();
      R.dispose(); R.forceContextLoss();
    });

  },

  unmount() { cleanup?.(); cleanup = null; },

  insight(c: Ctx): Insight {
    const ideas = allIdeas(); const routed = ideas.filter(i => i.st >= 10).length; const cont = ideas.filter(contained).length;
    const role = { ar: "مرشد الكوكبة", en: "Constellation guide" };
    const it = c.object && ideas.find(x => x.id === c.object);
    if (it && !contained(it)) {
      return {
        role,
        lines: [{ ar: `${it.id}: ${it.t.ar} — عند «${t("stage")[stOf(it)]}»، تقييم ${num(scoreOf(it))}. كلما اقتربت النجمة من النواة اقتربت من أن تصبح قدرة وطنية.`, en: `${it.id}: ${it.t.en} — at '${t("stage")[stOf(it)]}', score ${scoreOf(it)}. The closer a star sits to the core, the closer it is to becoming a national capability.` }],
        actions: [{ label: { ar: "افتح في المسار", en: "Open in the pipeline" }, run: () => { ctx.state = { openIdea: it.id }; go("lab"); } }],
      };
    }
    return {
      role,
      lines: [
        { ar: `الكوكبة تعرض ${num(ideas.length)} فكرة كنجوم: الزاوية مجالها، والبُعد عن النواة محطتها. ${num(routed)} وصلت للتوجيه كقدرات وطنية.`, en: `The constellation shows ${ideas.length} ideas as stars: angle is domain, distance from the core is station. ${routed} reached routing as national capabilities.` },
        { ar: `النجوم الداكنة الحمراء (${num(cont)}) سجلات محتواة؛ تظهر مكانها دون محتواها.`, en: `The dark red stars (${cont}) are contained records; their place shows, their content does not.` },
      ],
    };
  },
});
