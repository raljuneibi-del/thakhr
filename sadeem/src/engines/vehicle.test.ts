import { describe, it, expect } from "vitest";
import { VEH, DIMS, SLOTS, PLATFORMS, MISSIONS, score, fit, cfgToModel, opt, shown, type Cfg } from "./vehicle";

const P = (k: string) => PLATFORMS.find(p => p.k === k)!;
const M = (k: string) => MISSIONS.find(m => m.k === k)!;

describe("catalogue", () => {
  it("has three generic reference platforms, six dimensions, six slots, three missions", () => {
    expect(PLATFORMS.map(p => p.n)).toEqual(["REF-8×8", "REF-4×4", "REF-ISR"]);
    expect(PLATFORMS.map(p => p.model)).toEqual(["vehicle", "vehicle", "aircraft"]);
    expect(DIMS).toHaveLength(6);
    expect(DIMS.filter(d => d.inv).map(d => d.k)).toEqual(["cost"]);
    expect(SLOTS.map(s => s.k)).toEqual(["chassis", "power", "armour", "mission", "cooling", "ai"]);
    expect(SLOTS.map(s => s.o.length)).toEqual([3, 3, 4, 4, 3, 3]);
    expect(MISSIONS.map(m => m.k)).toEqual(["bp", "rc", "fp"]);
  });
  it("every platform default points to a real option and every text is bilingual", () => {
    for (const p of PLATFORMS) for (const s of SLOTS) expect(opt(s.k, p.def[s.k]), `${p.k}.${s.k}`).toBeTruthy();
    for (const s of SLOTS) for (const o of s.o) { expect(o.n.ar && o.n.en && o.d.ar && o.d.en).toBeTruthy(); }
  });
  it("exposes the legacy API object", () => {
    expect(Object.keys(VEH)).toEqual(expect.arrayContaining(["DIMS", "SLOTS", "PLATFORMS", "MISSIONS", "opt", "score", "fit", "cfgToModel"]));
  });
});

describe("score", () => {
  it("REF-8×8 default matches the legacy training values (with clamping at 100)", () => {
    expect(score(P("lv8"), P("lv8").def)).toEqual({ range: 35, speed: 34, protection: 100, thermal: 63, autonomy: 64, cost: 100 });
  });
  it("REF-4×4 default", () => {
    expect(score(P("tv4"), P("tv4").def)).toEqual({ range: 64, speed: 74, protection: 38, thermal: 50, autonomy: 40, cost: 24 });
  });
  it("REF-ISR default", () => {
    expect(score(P("isr"), P("isr").def)).toEqual({ range: 72, speed: 80, protection: 18, thermal: 52, autonomy: 84, cost: 66 });
  });
  it("a swap changes only the dimensions in the option's effect", () => {
    const p = P("tv4"); const a = score(p, p.def); const b = score(p, { ...p.def, power: "hybrid" });
    expect(b.range - a.range).toBe(16); expect(b.thermal - a.thermal).toBe(-4);
    expect(b.autonomy - a.autonomy).toBe(5); expect(b.cost - a.cost).toBe(10);
    expect(b.speed).toBe(a.speed); expect(b.protection).toBe(a.protection);
  });
  it("clamps to the 5..100 band", () => {
    const p = P("isr");
    const v = score(p, { ...p.def, armour: "light", chassis: "4x4" });
    expect(v.protection).toBe(8);
    const low = score({ ...p, base: { ...p.base, protection: 0 } }, { ...p.def, armour: "light", chassis: "4x4" });
    expect(low.protection).toBe(5);
    for (const val of Object.values(score(P("lv8"), { ...P("lv8").def, armour: "aps", ai: "convoy" }))) { expect(val).toBeGreaterThanOrEqual(5); expect(val).toBeLessThanOrEqual(100); }
  });
  it("falls back to the platform default for missing or unknown options", () => {
    const p = P("lv8");
    expect(score(p, {})).toEqual(score(p, p.def));
    expect(score(p, { ...p.def, armour: "nope" })).toEqual(score(p, p.def));
  });
  it("does not mutate the platform base", () => {
    const p = P("tv4"); const before = { ...p.base }; score(p, { ...p.def, armour: "aps" }); expect(p.base).toEqual(before);
  });
  it("shown() inverts cost only", () => {
    const v = score(P("tv4"), P("tv4").def);
    expect(shown(DIMS.find(d => d.k === "cost")!, v)).toBe(76);
    expect(shown(DIMS.find(d => d.k === "range")!, v)).toBe(64);
  });
});

describe("fit", () => {
  it("REF-8×8 on border patrol passes 2 of 3 → 67", () => {
    const r = fit(score(P("lv8"), P("lv8").def), M("bp"));
    expect(r.score).toBe(67);
    expect(r.f).toEqual([
      { k: "thermal", need: 62, have: 63, pass: true },
      { k: "range", need: 55, have: 35, pass: false },
      { k: "protection", need: 50, have: 100, pass: true },
    ]);
  });
  it("cost requirement is measured as affordability (100 − cost)", () => {
    const r = fit(score(P("tv4"), P("tv4").def), M("rc"));
    const c = r.f.find(x => x.k === "cost")!;
    expect(c.have).toBe(76); expect(c.pass).toBe(true);
    expect(r.score).toBe(33);
  });
  it("need equal to have passes; empty requirements score 0", () => {
    const v = score(P("lv8"), P("lv8").def);
    expect(fit(v, { k: "x", n: { ar: "", en: "" }, d: { ar: "", en: "" }, req: { thermal: 63 } }).score).toBe(100);
    expect(fit(v, { k: "x", n: { ar: "", en: "" }, d: { ar: "", en: "" }, req: {} }).score).toBe(0);
  });
  it("a tuned 4×4 can meet every requirement of the relief convoy", () => {
    const p = P("tv4");
    const cfg: Cfg = { ...p.def, power: "hybrid", ai: "convoy", armour: "light" };
    const r = fit(score(p, cfg), M("rc"));
    expect(r.f.every(x => x.pass)).toBe(false); // cost breaks: convoy + hybrid are expensive
    const r2 = fit(score(p, { ...p.def, power: "hybrid", ai: "assist", mission: "mast" }), M("rc"));
    expect(r2.f.find(x => x.k === "range")!.pass).toBe(true);
  });
});

describe("cfgToModel", () => {
  it("passes land configurations straight through", () => {
    expect(cfgToModel(P("lv8"), P("lv8").def)).toEqual(P("lv8").def);
  });
  it("maps the aircraft slots to airframe parts", () => {
    expect(cfgToModel(P("isr"), P("isr").def)).toEqual({ structure: "carbon", engine: "tp", wing: "std", avionics: "aico", pods: 2, sensors: "ball" });
    expect(cfgToModel(P("isr"), { ...P("isr").def, chassis: "8x8", mission: "turret", power: "electric", ai: "manual", armour: "heavy" }))
      .toEqual({ structure: "alu", engine: "el", wing: "le", avionics: "basic", pods: 4, sensors: "none" });
    expect(cfgToModel(P("isr"), { ...P("isr").def, mission: "turret" })).toMatchObject({ wing: "strike", pods: 4 });
    expect(cfgToModel(P("isr"), { ...P("isr").def, mission: "cargo" })).toMatchObject({ pods: 0, sensors: "none" });
  });
});
