/* SADEEM Hangar · core: DOM helpers, store, events, router, AI context, content.
   Zones import what they need from "@/core". The API mirrors the original hangar so behaviour carries over. */
import { t, tx, num, lang, setLangValue, type Bi, type Lang, type Text } from "./i18n";
import { SAMPLE_IDEAS, CHALLENGES, SOURCES, DOMAINS, ENTITIES, ZONES, NIGHT_ZONES, type Idea, type ZoneId } from "./data";

export { t, tx, num, lang, SAMPLE_IDEAS, CHALLENGES, SOURCES, DOMAINS, ENTITIES, ZONES, NIGHT_ZONES };
export type { Bi, Lang, Text, Idea, ZoneId };
export * from "./data";

/* ---------- DOM ---------- */
export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
export function svgEl(n: string, a: Record<string, string | number> = {}) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", n);
  for (const k in a) e.setAttribute(k, String(a[k]));
  return e;
}
/** Standard zone header: eyebrow, title, lead. */
export function head(el: HTMLElement, kicker: Text, title: Text, lead?: Text) {
  el.insertAdjacentHTML("beforeend",
    `<header class="zh wrap"><span class="kk">${esc(tx(kicker))}</span><h1>${esc(tx(title))}</h1>${lead ? `<p class="lead">${esc(tx(lead))}</p>` : ""}</header>`);
}
/** Inline icon set (stroke icons, 20×20). */
export const icon = (name: keyof typeof ICONS, cls = "i") => `<svg class="${cls}" viewBox="0 0 20 20" aria-hidden="true">${ICONS[name]}</svg>`;
export const ICONS = {
  search: '<circle cx="9" cy="9" r="5.5"/><path d="m13.2 13.2 4 4"/>',
  map: '<path d="M3 5.5 7.5 3l5 2.5L17 3v11.5L12.5 17l-5-2.5L3 17z"/><path d="M7.5 3v11.5M12.5 5.5V17"/>',
  tour: '<circle cx="10" cy="10" r="6.5"/><path d="M10 6v4l2.6 1.6"/>',
  sound: '<path d="M4 8v4h3l4 3V5L7 8Z"/><path d="M13.5 7.5a3.5 3.5 0 0 1 0 5"/>',
  close: '<path d="M5 5l10 10M15 5 5 15"/>',
  chevron: '<path d="m7 8 3 3 3-3"/>',
  arrow: '<path d="M4 10h12M12 6l4 4-4 4"/>',
  spark: '<path d="M10 2.5 11.4 8.6 17.5 10l-6.1 1.4L10 17.5l-1.4-6.1L2.5 10l6.1-1.4Z"/>',
  moon: '<path d="M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8Z"/>',
  menu: '<path d="M3.5 6h13M3.5 10h13M3.5 14h13"/>',
  lock: '<rect x="4.5" y="9" width="11" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/>',
  grid: '<rect x="3.5" y="3.5" width="5" height="5"/><rect x="11.5" y="3.5" width="5" height="5"/><rect x="3.5" y="11.5" width="5" height="5"/><rect x="11.5" y="11.5" width="5" height="5"/>',
};
/** The SADEEM four-point star mark. */
export const STAR = `<svg class="star" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1 18.2 13.8 31 16 18.2 18.2 16 31 13.8 18.2 1 16 13.8 13.8Z" fill="currentColor"/><path d="m26 3 .8 3.2L30 7l-3.2.8L26 11l-.8-3.2L22 7l3.2-.8Z" fill="currentColor" opacity=".55"/></svg>`;

/* ---------- storage ---------- */
const KEY = "sadeem_hangar_v2";
export interface Store { ideas: Idea[]; gate: any[]; drones: any[]; quotesOverride: Record<string, any> | null; seen: Record<string, any>; moves: Record<string, any>; [k: string]: any }
export const DB: Store = { ideas: [], gate: [], drones: [], quotesOverride: null, seen: {}, moves: {} };
try { const s = localStorage.getItem(KEY) ?? localStorage.getItem("sadeem_hangar_v1"); if (s) Object.assign(DB, JSON.parse(s)); } catch { /* ignore */ }
export const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch { /* ignore */ } };
export const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
export const allIdeas = (): Idea[] => [...DB.ideas, ...SAMPLE_IDEAS];

/* ---------- events ---------- */
const bus: Record<string, Array<(d?: any) => void>> = {};
export const on = (k: string, f: (d?: any) => void) => { (bus[k] ||= []).push(f); return () => { bus[k] = bus[k].filter(x => x !== f); }; };
export const emit = (k: string, d?: any) => (bus[k] || []).forEach(f => f(d));

/* ---------- context ---------- */
export interface Ctx { zone: ZoneId; object: any; state: any; [k: string]: any }
export const ctx: Ctx = { zone: "arrival", object: null, state: null };

export function addIdea(o: Partial<Idea>): Idea {
  const id = "SD-" + (2000 + DB.ideas.length + 1);
  const it: Idea = Object.assign({ id, st: 0, days: 0, area: "land", src: "talent", owner: { ar: "أنت", en: "You" }, ch: "", mine: 1 as const, created: Date.now(), t: { ar: "", en: "" } }, o);
  DB.ideas.unshift(it); save(); emit("ideas"); return it;
}

/* ---------- zones + router ---------- */
export interface Insight { role: Text; lines?: Text[]; actions?: Array<{ label: Text; run?: () => void }> }
export interface Zone {
  mount(el: HTMLElement): void | Promise<void>;
  unmount?(): void;
  insight?(c: Ctx): Insight | null;
  [k: string]: any;
}
const zones: Partial<Record<ZoneId, Zone>> = {};
let cur: ZoneId | null = null;
export const current = () => cur;
export function register(id: ZoneId, z: Zone) { zones[id] = z; }

const STATE_KEYS = ["draft", "openIdea", "openCh", "osView", "stage", "gateIdea"];
let transition: ((cb: () => void) => void) | null = null;
let afterMount: ((el: HTMLElement) => void) | null = null;
export function setTransition(f: typeof transition) { transition = f; }
export function setAfterMount(f: typeof afterMount) { afterMount = f; }

export async function go(id: string) {
  const zid = (ZONES as string[]).includes(id) ? id as ZoneId : "arrival";
  if (location.hash !== "#" + zid) history.pushState(null, "", "#" + zid);
  if (transition && cur && cur !== zid) transition(() => { void show(zid); });
  else await show(zid);
}

export async function show(id: ZoneId) {
  const z = zones[id]; if (!z) return;
  if (cur && cur !== id) { try { zones[cur]?.unmount?.(); } catch (e) { console.error(e); } }
  cur = id; ctx.zone = id; ctx.object = null;
  const inc = ctx.state || {};
  ctx.state = STATE_KEYS.some(k => inc[k] !== undefined) ? inc : null;
  document.body.dataset.zone = id;
  document.body.classList.toggle("night", NIGHT_ZONES.includes(id));
  const stage = $("#stage"); stage.innerHTML = "";
  const el = document.createElement("section");
  el.className = "zone z-" + id; el.id = "zone-" + id;
  stage.appendChild(el);
  emit("zone", id);
  try { await z.mount(el); } catch (e: any) { console.error(e); el.innerHTML = `<div class="wrap"><p class="err">${esc(e?.message)}</p></div>`; }
  ai.refresh();
  window.scrollTo(0, 0);
  try { afterMount?.(el); } catch { /* ignore */ }
  document.title = `${t("z_" + id)} · ${t("brand")} ${t("hangar")}`;
}
addEventListener("popstate", () => { void show((location.hash.slice(1) || "arrival") as ZoneId); });
addEventListener("hashchange", () => { const h = location.hash.slice(1) as ZoneId; if (h && h !== cur) void show(h); });

/* ---------- AI layer (advisory; rules only, nothing leaves the browser) ---------- */
export const ai = {
  last: null as Insight | null,
  refresh() {
    const z = cur ? zones[cur] : null;
    let r: Insight | null = null;
    try { r = z?.insight ? z.insight(ctx) : null; } catch (e) { console.error(e); }
    ai.last = r;
    emit("ai", r);
  },
  set(o: Partial<Ctx>) { Object.assign(ctx, o); ai.refresh(); },
};
export const openAI = () => emit("ai:open");

/* ---------- toast ---------- */
let toastT = 0;
export function toast(msg: Text) {
  const el = $("#toast"); if (!el) return;
  el.textContent = tx(msg); el.hidden = false;
  clearTimeout(toastT); toastT = window.setTimeout(() => (el.hidden = true), 2800);
}

/* ---------- language ---------- */
export function setLang(l: Lang) { setLangValue(l); emit("lang", l); void show(cur || "arrival"); }

/* ---------- content ---------- */
export const content: Record<string, any> = {};
export async function loadJSON(name: string) {
  if (content[name]) return content[name];
  try { const r = await fetch(`./content/${name}.json`); content[name] = await r.json(); }
  catch { content[name] = { items: [] }; }
  return content[name];
}
export function quotes(): any[] {
  const q = content.quotes ? content.quotes.items : [];
  return DB.quotesOverride ? q.map((x: any) => Object.assign({}, x, DB.quotesOverride![x.id] || {})) : q;
}

/* ---------- three.js (lazy, bundled; loaded only by 3D zones) ---------- */
let threeP: Promise<typeof import("three")> | null = null;
export function loadThree() { return (threeP ||= import("three")); }
export function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
