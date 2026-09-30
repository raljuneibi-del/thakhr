/* SADEEM Hangar · the building's chrome: dock with floor-grouped navigation, command palette,
   AI drawer, toast and footer. Rebuilt on every language change. */
import {
  $, $$, esc, t, tx, num, lang, setLang, go, on, ai, current, icon, STAR, NAV, ZONES,
  allIdeas, CHALLENGES, ctx, setTransition, setAfterMount, type ZoneId, type Insight,
} from "@/core";
import { FX } from "./fx";

const groupOf = (id: ZoneId) => NAV.find(g => g.items.some(i => i.id === id));

export function mountShell() {
  document.body.insertAdjacentHTML("afterbegin", `
    <a class="skip" href="#stage">${lang() === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}</a>
    <header id="dock"></header>
    <div id="dockSheet" class="overlay" hidden></div>
    <main id="stage" tabindex="-1"></main>
    <footer id="foot"></footer>
    <aside id="aiDock" aria-label="AI"></aside>
    <button id="aiWhisper" type="button" hidden></button>
    <div id="palette" class="overlay" hidden><div class="sheet palBox" role="dialog" aria-modal="true"><div class="palIn">${icon("search")}<input id="palIn" autocomplete="off"><kbd>Esc</kbd></div><div id="palList" role="listbox"></div></div></div>
    <div id="toast" role="status" aria-live="polite" hidden></div>`);

  setTransition(FX.wipe);
  setAfterMount(el => { FX.reveal(el); FX.count(el); });

  render();
  on("lang", render);
  on("zone", syncCurrent);
  on("ai", renderAI);
  on("ai:open", () => toggleAI(true));

  addEventListener("keydown", e => {
    const tag = ((e.target as HTMLElement).tagName || "").toLowerCase();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); return; }
    if (e.key === "Escape") { closeMenus(); $("#palette").hidden = true; $("#dockSheet").hidden = true; }
    if (e.metaKey || e.ctrlKey || e.altKey || ["input", "textarea", "select"].includes(tag)) return;
    const JUMP: Record<string, ZoneId> = { "1": "arrival", "2": "vision", "3": "deck", "4": "lab", "5": "gate", "6": "bay", "7": "radar", "0": "os" };
    if (JUMP[e.key]) void go(JUMP[e.key]);
    else if (e.key.toLowerCase() === "m") FX.map();
    else if (e.key === "/") { e.preventDefault(); openPalette(); }
  });
  document.addEventListener("click", e => { if (!(e.target as HTMLElement).closest(".navG")) closeMenus(); });
  const pal = $("#palette");
  pal.addEventListener("click", e => { if (e.target === pal) pal.hidden = true; });
  $<HTMLInputElement>("#palIn").addEventListener("input", e => renderPal((e.target as HTMLInputElement).value));
  $<HTMLInputElement>("#palIn").addEventListener("keydown", e => {
    const items = $$<HTMLButtonElement>("#palList button"); if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[0].focus(); }
    if (e.key === "Enter" && i < 0) { e.preventDefault(); items[0].click(); }
  });
  $("#palList").addEventListener("keydown", e => {
    const items = $$<HTMLButtonElement>("#palList button"); const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[Math.min(items.length - 1, i + 1)]?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); i <= 0 ? $("#palIn").focus() : items[i - 1].focus(); }
  });
  let aiOpenPref = false;
  try { aiOpenPref = localStorage.getItem("sadeem_ai") === "1"; } catch { /* */ }
  if (aiOpenPref && innerWidth >= 1500) toggleAI(true);
}

/* ---------- dock ---------- */
function render() {
  const dock = $("#dock");
  const cur = current();
  dock.innerHTML = `<div class="dockIn">
    <a class="wm" href="#arrival" aria-label="${esc(t("brand"))} ${esc(t("hangar"))}">${STAR}<span class="wmT"><b>${esc(t("brand"))}</b><small>${esc(t("hangar"))}</small></span></a>
    <nav class="nav" aria-label="${esc(t("map"))}">
      ${NAV.map((g, gi) => `<div class="navG" data-g="${gi}">
        <button class="navB" type="button" aria-expanded="false" aria-haspopup="true">${esc(t(g.g))}${icon("chevron")}</button>
        <div class="navM" role="menu">${g.items.map(i => `<a role="menuitem" href="#${i.id}" data-go="${i.id}"><i class="n">${i.n}</i><span><b>${esc(t("z_" + i.id))}</b><small>${esc(t("d_" + i.id))}</small></span></a>`).join("")}</div>
      </div>`).join("")}
    </nav>
    <div class="tools">
      <button class="search" id="palBtn" type="button" aria-label="${esc(t("palette"))}">${icon("search")}<span>${esc(t("palette"))}</span><kbd>⌘K</kbd></button>
      <button class="iconBtn hideS" id="mapBtn" type="button" title="${esc(t("map"))}" aria-label="${esc(t("map"))}">${icon("map")}</button>
      <button class="iconBtn hideS" id="tourBtn" type="button" title="${esc(t("tour"))}" aria-label="${esc(t("tour"))}">${icon("tour")}</button>
      <button class="iconBtn hideS" id="soundBtn" type="button" title="${esc(t("sound"))}" aria-label="${esc(t("sound"))}" aria-pressed="false">${icon("sound")}</button>
      <button class="iconBtn hideS" id="themeBtn" type="button" title="${esc(t("theme"))}" aria-label="${esc(t("theme"))}">${icon("moon")}</button>
      <button class="lgBtn" id="lgBtn" type="button" lang="${lang() === "ar" ? "en" : "ar"}" aria-label="${esc(t("lang"))}">${esc(t("lang"))}</button>
      <a class="btn sm osBtn" href="#os" data-go="os">${esc(t("os"))}</a>
      <button class="aiBtn" id="aiBtn" type="button" aria-expanded="false" aria-controls="aiDock"><i class="pulse"></i><span>${esc(t("ai"))}</span></button>
      <button class="iconBtn menuBtn" id="menuBtn" type="button" aria-label="${esc(t("menu"))}" aria-expanded="false">${icon("menu")}</button>
    </div>
  </div>
  <div class="crumb" id="crumb"></div>`;

  $$<HTMLElement>(".navG", dock).forEach(g => {
    const b = $<HTMLButtonElement>(".navB", g);
    b.onclick = e => { e.stopPropagation(); const open = !g.classList.contains("open"); closeMenus(); if (open) { g.classList.add("open"); b.setAttribute("aria-expanded", "true"); } };
    g.addEventListener("keydown", e => { if (e.key === "Escape") { closeMenus(); b.focus(); } });
  });
  $$<HTMLAnchorElement>("[data-go]", dock).forEach(a => (a.onclick = e => { e.preventDefault(); closeMenus(); void go(a.dataset.go!); }));
  $("#lgBtn").onclick = () => setLang(lang() === "ar" ? "en" : "ar");
  $("#palBtn").onclick = openPalette;
  $("#mapBtn").onclick = () => FX.map();
  $("#tourBtn").onclick = () => FX.tour(0);
  $("#soundBtn").onclick = () => { const b = $("#soundBtn"); const onF = FX.ambient(b.getAttribute("aria-pressed") !== "true"); b.setAttribute("aria-pressed", onF ? "true" : "false"); };
  $("#themeBtn").onclick = toggleTheme;
  $("#aiBtn").onclick = () => toggleAI();
  $("#menuBtn").onclick = openSheet;

  renderFoot();
  renderAIFrame();
  renderAI(ai.last);
  if (cur) syncCurrent(cur);
}

function closeMenus() {
  $$(".navG.open").forEach(g => { g.classList.remove("open"); $(".navB", g).setAttribute("aria-expanded", "false"); });
}

function syncCurrent(id: ZoneId) {
  $$<HTMLAnchorElement>("#dock [data-go], #dockSheet [data-go]").forEach(a => a.setAttribute("aria-current", a.dataset.go === id ? "page" : "false"));
  const g = groupOf(id);
  $$<HTMLElement>(".navG").forEach(el => el.classList.toggle("cur", !!g && NAV[+el.dataset.g!] === g));
  const item = g?.items.find(i => i.id === id);
  const crumb = $("#crumb");
  if (crumb) crumb.innerHTML = id === "os"
    ? `<span>${esc(t("os"))}</span>`
    : `<span>${esc(g ? t(g.g) : "")}</span><i>/</i><b><em class="n">${item?.n ?? ""}</em>${esc(t("z_" + id))}</b>`;
  const tb = $("#themeBtn"); if (tb) tb.setAttribute("aria-pressed", String(document.documentElement.dataset.theme === "dark"));
}

/* ---------- mobile sheet (all zones by floor) ---------- */
function openSheet() {
  const s = $("#dockSheet");
  s.innerHTML = `<div class="sheet navSheet" role="dialog" aria-modal="true" aria-label="${esc(t("menu"))}">
    <div class="sheet-h"><div class="wm">${STAR}<span class="wmT"><b>${esc(t("brand"))}</b><small>${esc(t("hangar"))}</small></span></div>
    <button class="iconBtn" data-x aria-label="${esc(t("close"))}">${icon("close")}</button></div>
    ${NAV.map(g => `<section><h3 class="kk">${esc(t(g.g))}</h3>${g.items.map(i => `<a href="#${i.id}" data-go="${i.id}"><i class="n">${i.n}</i><span><b>${esc(t("z_" + i.id))}</b><small>${esc(t("d_" + i.id))}</small></span></a>`).join("")}</section>`).join("")}
    <div class="row"><a class="btn" href="#os" data-go="os">${esc(t("os"))}</a><button class="btn ghost" data-map>${esc(t("map"))}</button><button class="btn ghost" data-tour>${esc(t("tour"))}</button><button class="btn ghost" data-theme>${esc(t("theme"))}</button></div>
  </div>`;
  s.hidden = false;
  const close = () => (s.hidden = true);
  s.onclick = e => { if (e.target === s) close(); };
  $("[data-x]", s).onclick = close;
  $$<HTMLAnchorElement>("[data-go]", s).forEach(a => (a.onclick = e => { e.preventDefault(); close(); void go(a.dataset.go!); }));
  $("[data-map]", s).onclick = () => { close(); FX.map(); };
  $("[data-tour]", s).onclick = () => { close(); FX.tour(0); };
  $("[data-theme]", s).onclick = () => { toggleTheme(); };
  syncCurrent(current() || "arrival");
}

/* ---------- theme ---------- */
function toggleTheme() {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  r.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("sadeem_theme", r.dataset.theme); } catch { /* */ }
  syncCurrent(current() || "arrival");
}

/* ---------- footer ---------- */
function renderFoot() {
  $("#foot").innerHTML = `<div class="wrap footIn">
    <div class="wm">${STAR}<span class="wmT"><b>${esc(t("brand"))}</b><small>${lang() === "ar" ? "سديم للابتكار" : "SADEEM Innovates"}</small></span></div>
    <p class="footP">${lang() === "ar" ? "الاحتواء قبل الإطلاق · التوجيه قبل التنفيذ · الحوكمة قبل التجربة" : "Containment before launch · Guidance before execution · Governance before experiment"}</p>
    <p class="footD">${esc(t("disclaimer"))}</p>
    <p class="footM"><span class="proposed">${esc(t("proposed"))}</span><span>${esc(t("madeIn"))}</span></p>
  </div>`;
}

/* ---------- AI drawer ---------- */
function renderAIFrame() {
  $("#aiDock").innerHTML = `<div class="aiHead"><span class="aiDot"></span><b>${esc(t("ai"))}</b>
    <button class="iconBtn" id="aiX" type="button" aria-label="${esc(t("close"))}">${icon("close")}</button></div>
    <div class="aiRole"><span>${esc(t("aiRole"))}</span><b id="aiRole">—</b></div>
    <div class="aiBody" id="aiBody"></div>
    <p class="aiFoot">${icon("lock")}<span>${esc(t("aiSug"))}${lang() === "ar" ? " · قواعد محلية، لا يغادر شيء المتصفح" : " · local rules, nothing leaves the browser"}</span></p>`;
  $("#aiX").onclick = () => toggleAI(false);
}
function renderAI(r: Insight | null) {
  const box = $("#aiBody"), role = $("#aiRole"); if (!box) return;
  if (!r) { role.textContent = "—"; box.innerHTML = `<p class="mute">${esc(t("aiOff"))}</p>`; }
  else {
    role.textContent = tx(r.role);
    box.innerHTML = (r.lines || []).map(l => `<p>${esc(tx(l))}</p>`).join("") +
      ((r.actions || []).length ? `<div class="aiActs">${r.actions!.map((a, i) => `<button class="chip" data-ai="${i}">${esc(tx(a.label))}${icon("arrow")}</button>`).join("")}</div>` : "");
    $$<HTMLButtonElement>("[data-ai]", box).forEach(b => (b.onclick = () => r.actions![+b.dataset.ai!].run?.()));
  }
  // whisper: a one-line hint when the drawer is closed
  const w = $<HTMLButtonElement>("#aiWhisper");
  const open = document.body.classList.contains("aiOpen");
  if (r && r.lines?.length && !open) {
    w.innerHTML = `<i class="pulse"></i><span><b>${esc(tx(r.role))}</b><small>${esc(tx(r.lines[0]))}</small></span>`;
    w.hidden = false; w.onclick = () => toggleAI(true);
  } else w.hidden = true;
}
function toggleAI(force?: boolean) {
  const open = force ?? !document.body.classList.contains("aiOpen");
  document.body.classList.toggle("aiOpen", open);
  $("#aiBtn")?.setAttribute("aria-expanded", String(open));
  try { localStorage.setItem("sadeem_ai", open ? "1" : "0"); } catch { /* */ }
  renderAI(ai.last);
}

/* ---------- command palette ---------- */
function openPalette() {
  const p = $("#palette"); p.hidden = false;
  const inp = $<HTMLInputElement>("#palIn"); inp.value = ""; inp.placeholder = t("palHint"); inp.focus();
  renderPal("");
}
function renderPal(q: string) {
  q = q.trim().toLowerCase();
  const list = $("#palList");
  type E = { k: string; l: string; s: string; go: () => void };
  const entries: E[] = [
    ...ZONES.map(z => ({ k: z, l: t("z_" + z), s: t("d_" + z), go: () => void go(z) })),
    ...allIdeas().map(i => ({ k: i.id, l: tx(i.t), s: t("stage")[i.st] ?? "", go: () => { ctx.state = { openIdea: i.id }; void go("lab"); } })),
    ...CHALLENGES.map(c => ({ k: c.id, l: tx(c.t), s: tx(c.sponsor), go: () => { ctx.state = { openCh: c.id }; void go("lab"); } })),
  ];
  const f = entries.filter(e => !q || e.l.toLowerCase().includes(q) || e.k.toLowerCase().includes(q) || e.s.toLowerCase().includes(q)).slice(0, 12);
  list.innerHTML = f.map((e, i) => `<button type="button" role="option" data-i="${i}"><span><b>${esc(e.l)}</b><small>${esc(e.s)}</small></span><kbd>${esc(e.k)}</kbd></button>`).join("")
    || `<p class="mute palEmpty">${lang() === "ar" ? "لا نتائج" : "No results"}</p>`;
  $$<HTMLButtonElement>("button", list).forEach(b => (b.onclick = () => { $("#palette").hidden = true; f[+b.dataset.i!].go(); }));
}

export { num };
