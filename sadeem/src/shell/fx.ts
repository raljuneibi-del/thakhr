/* SADEEM Hangar · cinematic layer: zone transition, reveal, count-up, facility map, guided tour, ambient sound, tween. */
import { $, $$, esc, go, RM, lang, num, tx, t, type ZoneId } from "@/core";

/* ---------- light-wipe transition between zones ---------- */
function wipe(cb: () => void) {
  if (RM) { cb(); return; }
  const w = document.createElement("div"); w.className = "fxwipe"; document.body.appendChild(w);
  requestAnimationFrame(() => w.classList.add("in"));
  setTimeout(() => { cb(); w.classList.add("out"); setTimeout(() => w.remove(), 620); }, 380);
}

/* ---------- reveal: elements already in the first frame stay visible; the rest rise in ---------- */
let io: IntersectionObserver | null = null;
function reveal(root: ParentNode = document) {
  if (RM || !("IntersectionObserver" in window)) return;
  io ||= new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.remove("pre"); io!.unobserve(x.target); } }), { rootMargin: "0px 0px -6% 0px" });
  const vh = innerHeight;
  $$(".panel, .stat, .rv", root).forEach((el, i) => {
    el.classList.add("rv");
    if (el.getBoundingClientRect().top > vh) { el.style.setProperty("--d", (Math.min(i % 6, 5) * 60) + "ms"); el.classList.add("pre"); io!.observe(el); }
  });
}

/* ---------- count-up on numeric tiles ---------- */
function count(root: ParentNode = document) {
  if (RM) return;
  $$("[data-count]", root).forEach(el => {
    const end = parseFloat(el.getAttribute("data-count") || ""); if (isNaN(end)) return;
    const dur = 900, t0 = performance.now(), pre = el.dataset.pre || "", suf = el.dataset.suf || "";
    const step = (n: number) => { const p = Math.min(1, (n - t0) / dur); const e = 1 - Math.pow(1 - p, 3); el.textContent = pre + num(Math.round(end * e)) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

/* ---------- facility map ---------- */
const MAP: Array<{ z: ZoneId; x: number; y: number; w: number; h: number; n: { ar: string; en: string }; main?: 1; vault?: 1 }> = [
  { z: "deck", x: 4, y: 8, w: 22, h: 16, n: { ar: "منصة القيادة", en: "Command Deck" } },
  { z: "library", x: 28, y: 8, w: 22, h: 16, n: { ar: "مكتبة الابتكار", en: "Innovation Library" } },
  { z: "radar", x: 52, y: 8, w: 22, h: 16, n: { ar: "رادار التقنيات", en: "Technology Radar" } },
  { z: "galaxy", x: 76, y: 8, w: 20, h: 16, n: { ar: "الكوكبة", en: "Constellation" } },
  { z: "bay", x: 4, y: 32, w: 22, h: 14, n: { ar: "حظيرة المنصات", en: "Vehicle Bay" } },
  { z: "drones", x: 4, y: 48, w: 22, h: 14, n: { ar: "مختبر الدرونات", en: "Drone Lab" } },
  { z: "factory", x: 4, y: 64, w: 22, h: 14, n: { ar: "مصنع المستقبل", en: "Factory" } },
  { z: "vision", x: 30, y: 32, w: 40, h: 12, n: { ar: "قاعة الرؤية", en: "Vision Chamber" } },
  { z: "lab", x: 30, y: 46, w: 40, h: 20, n: { ar: "مسار سديم", en: "Pipeline Hall" }, main: 1 },
  { z: "gate", x: 30, y: 68, w: 40, h: 10, n: { ar: "قبو الاحتواء", en: "Containment Vault" }, vault: 1 },
  { z: "twins", x: 74, y: 32, w: 22, h: 14, n: { ar: "التوائم الرقمية", en: "Digital Twins" } },
  { z: "missions", x: 74, y: 48, w: 22, h: 14, n: { ar: "هندسة المهام", en: "Missions" } },
  { z: "foresight", x: 74, y: 64, w: 22, h: 14, n: { ar: "المرصد", en: "Foresight" } },
  { z: "arrival", x: 4, y: 84, w: 92, h: 10, n: { ar: "المدخل الوطني الواحد", en: "Single National Entry Point" } },
];
function map() {
  let ov = $("#fxmap");
  if (ov) { ov.remove(); return; }
  ov = document.createElement("div"); ov.id = "fxmap"; ov.className = "overlay";
  const ar = lang() === "ar";
  ov.innerHTML = `<div class="sheet fxmapBox" role="dialog" aria-modal="true" aria-label="${esc(t("map"))}">
    <div class="sheet-h"><div><span class="kk">${ar ? "هانقر سديم" : "SADEEM Hangar"}</span><h2>${esc(t("map"))}</h2></div>
      <button class="iconBtn" data-x aria-label="${esc(t("close"))}"><svg class="i" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5 5 15"/></svg></button></div>
    <div class="fxmapPlan">
      <span class="fxmapAxis" style="top:2%">${ar ? "الطابق العلوي" : "Mezzanine"}</span>
      <span class="fxmapAxis" style="top:27%">${ar ? "الطابق الأرضي" : "Ground floor"}</span>
      ${MAP.map(m => `<button class="fxmapZone ${m.main ? "main" : ""} ${m.vault ? "vault" : ""}" data-z="${m.z}" style="inset-inline-start:${m.x}%;top:${m.y}%;width:${m.w}%;height:${m.h}%" ${document.body.dataset.zone === m.z ? 'aria-current="page"' : ""}><span>${esc(tx(m.n))}</span></button>`).join("")}
    </div>
    <p class="note">${ar ? "المس منطقة للانتقال إليها. الطريق الوحيد للداخل هو المدخل الوطني الواحد." : "Touch a zone to move to it. The only way in is the single national entry point."}</p></div>`;
  document.body.appendChild(ov);
  const close = () => { ov!.remove(); removeEventListener("keydown", k); };
  const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
  addEventListener("keydown", k);
  ov.addEventListener("click", e => { if (e.target === ov) close(); });
  $("[data-x]", ov).onclick = close;
  $$<HTMLButtonElement>(".fxmapZone", ov).forEach(b => (b.onclick = () => { close(); void go(b.dataset.z!); }));
  requestAnimationFrame(() => ov!.classList.add("in"));
}

/* ---------- guided tour for delegations ---------- */
const TOUR: Array<{ z: ZoneId; ar: string; en: string }> = [
  { z: "arrival", ar: "نبدأ من المدخل الوطني الواحد: كل فكرة عالية الحساسية تدخل من هنا، فلا تشتت ولا ازدواجية.", en: "We begin at the single national entry point: every high-sensitivity idea enters here, so nothing is fragmented or duplicated." },
  { z: "vision", ar: "قاعة الرؤية تربط تصريحات القيادة بما يحرّكه كل مبدأ داخل سديم.", en: "The Vision Chamber links leadership statements to what each principle drives inside SADEEM." },
  { z: "lab", ar: "مسار سديم: إحدى عشرة محطة من التجميع إلى التوجيه للجهة الوطنية المختصة.", en: "The SADEEM pipeline: eleven stations from collection to routing to the competent national entity." },
  { z: "gate", ar: "قبو الاحتواء: التصنيف قبل الإطلاق، والفكرة الحساسة تُختم ولا تغادر الإطار السيادي.", en: "The Containment Vault: classification before launch; a sensitive idea is sealed and never leaves the sovereign frame." },
  { z: "deck", ar: "منصة القيادة تعطي الجهة المعتمِدة صورة القرار: أين يتعطّل المسار وما ينتظر الاعتماد.", en: "The Command Deck gives the authority a decision view: where the pipeline stalls and what awaits approval." },
  { z: "radar", ar: "رادار التقنيات ومختبرات القدرة تختم الجولة: من الفكرة إلى قدرة وطنية.", en: "The Technology Radar and capability labs close the tour: from an idea to a national capability." },
];
let tourI = -1; let tourBar: HTMLElement | null = null;
function tour(start?: number | false) {
  if (start === false) { tourEnd(); return; }
  tourI = start === 0 ? 0 : tourI + 1;
  if (tourI >= TOUR.length) { tourEnd(); return; }
  const step = TOUR[tourI];
  void go(step.z);
  if (!tourBar) { tourBar = document.createElement("div"); tourBar.className = "fxtour"; tourBar.setAttribute("role", "status"); document.body.appendChild(tourBar); }
  const last = tourI === TOUR.length - 1;
  tourBar.innerHTML = `<div class="fxtourIn">
    <div class="fxtourSteps">${TOUR.map((_, i) => `<i class="${i <= tourI ? "on" : ""}"></i>`).join("")}</div>
    <span class="fxtourN n">${num(tourI + 1)} / ${num(TOUR.length)}</span>
    <p>${esc(tx(step))}</p>
    <div class="fxtourB"><button class="btn quiet sm" data-end>${lang() === "ar" ? "إنهاء" : "End tour"}</button><button class="btn sm" data-next>${last ? (lang() === "ar" ? "تم" : "Done") : t("next")}</button></div></div>`;
  $("[data-next]", tourBar).onclick = () => (last ? tourEnd() : tour());
  $("[data-end]", tourBar).onclick = () => tourEnd();
  requestAnimationFrame(() => tourBar?.classList.add("in"));
}
function tourEnd() { tourI = -1; if (tourBar) { const b = tourBar; tourBar = null; b.classList.remove("in"); setTimeout(() => b.remove(), 400); } }

/* ---------- ambient sound (opt-in, synthesized, no files) ---------- */
let AC: AudioContext | null = null, ambientOn = false, gainNode: GainNode | null = null, nodes: OscillatorNode[] = [];
const ac = () => { if (!AC) { try { AC = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { AC = null; } } return AC; };
function sound(kind: "door" | "seal" | "move" | "reveal") {
  if (!ambientOn) return; const a = ac(); if (!a) return; const now = a.currentTime;
  const beep = (f: number, d: number, type: OscillatorType = "sine", g = .06) => { const o = a.createOscillator(), v = a.createGain(); o.type = type; o.frequency.value = f; o.connect(v); v.connect(a.destination); v.gain.setValueAtTime(0, now); v.gain.linearRampToValueAtTime(g, now + .02); v.gain.exponentialRampToValueAtTime(.0001, now + d); o.start(now); o.stop(now + d + .05); };
  if (kind === "door") { beep(180, 1.1, "sine", .05); beep(90, 1.4, "sine", .04); }
  else if (kind === "seal") { beep(140, .5, "triangle", .06); setTimeout(() => beep(70, .7, "sine", .05), 160); }
  else if (kind === "move") beep(320, .18, "sine", .03);
  else beep(520, .3, "sine", .025);
}
function ambient(onFlag: boolean) {
  const a = ac(); if (!a) return false;
  if (onFlag && !ambientOn) {
    if (a.state === "suspended") void a.resume();
    ambientOn = true;
    gainNode = a.createGain(); gainNode.gain.value = 0; gainNode.connect(a.destination);
    const filt = a.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 420; filt.Q.value = 6; filt.connect(gainNode);
    const o1 = a.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = 55;
    const o2 = a.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = 55.4;
    o1.connect(filt); o2.connect(filt); o1.start(); o2.start();
    const lfo = a.createOscillator(); lfo.frequency.value = .06; const lg = a.createGain(); lg.gain.value = 120; lfo.connect(lg); lg.connect(filt.frequency); lfo.start();
    gainNode.gain.linearRampToValueAtTime(.03, a.currentTime + 2);
    nodes = [o1, o2, lfo];
  } else if (!onFlag && ambientOn) {
    ambientOn = false; gainNode?.gain.linearRampToValueAtTime(0, a.currentTime + .8);
    const n = nodes; setTimeout(() => n.forEach(o => { try { o.stop(); } catch { /* */ } }), 900);
  }
  return ambientOn;
}

/* ---------- numeric tween ---------- */
function tween(dur: number, fn: (e: number) => void, done?: () => void) {
  if (RM) { fn(1); done?.(); return { cancel() { /* */ } }; }
  const t0 = performance.now(); let id = 0, killed = false;
  const step = (n: number) => { if (killed) return; const p = Math.min(1, (n - t0) / dur); fn(1 - Math.pow(1 - p, 3)); if (p < 1) id = requestAnimationFrame(step); else done?.(); };
  id = requestAnimationFrame(step);
  return { cancel() { killed = true; cancelAnimationFrame(id); } };
}

export const FX = { wipe, reveal, count, map, tour, tourEnd, sound, ambient, tween };
export default FX;
