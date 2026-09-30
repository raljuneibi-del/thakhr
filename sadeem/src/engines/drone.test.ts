import { describe, it, expect } from "vitest";
import { DRONE, type DroneConfig, type GroupKey } from "./drone";

const D = DRONE;
const cfg = (o: Partial<DroneConfig> = {}): DroneConfig => ({ ...D.DEF, ...o });
const mission = (k: string) => D.MISSIONS.find(m => m.k === k)!;

describe("DRONE catalogue", () => {
  it("has ten parameter groups and four mission profiles", () => {
    expect(D.G.map(g => g.k)).toEqual(["airframe", "wings", "propulsion", "energy", "sensors", "cameras", "comms", "payload", "materials", "autonomy"]);
    expect(D.MISSIONS.map(m => m.k)).toEqual(["storm", "deliver", "map", "relay"]);
  });
  it("defaults point at real options in every group", () => {
    for (const g of D.G) expect(g.o.some(o => o.k === D.DEF[g.k as GroupKey])).toBe(true);
  });
  it("only the wings group is VTOL-only, and every option is bilingual", () => {
    expect(D.G.filter(g => g.onlyVtol).map(g => g.k)).toEqual(["wings"]);
    for (const g of D.G) for (const o of g.o) { expect(o.n.ar && o.n.en).toBeTruthy(); expect(o.d.ar && o.d.en).toBeTruthy(); }
  });
});

describe("compute · legacy numbers", () => {
  it("default quad", () => {
    const { o, ...r } = D.compute(D.DEF);
    expect(r).toEqual({ mass: 4.26, dry: 2.26, batt: 2, pay: 0, margin: 0.94, maxMass: 5.2, power: 689, end: 30, speed: 15, rangeKm: 14, wind: 0.55, auto: 0.55, cost: 25000, maint: 0.9, noise: 1, commsKm: 10, vt: false });
    expect(o.airframe.k).toBe("quad");
  });
  it("VTOL + fuel cell + sealed + mesh + high thrust", () => {
    const { o, ...r } = D.compute(cfg({ airframe: "vtol", energy: "h2", materials: "sealed", comms: "mesh", propulsion: "hp" }));
    expect(r).toEqual({ mass: 7.15, dry: 3.95, batt: 3.2, pay: 0, margin: 8.29, maxMass: 15.4, power: 265, end: 269, speed: 31.9, rangeKm: 257, wind: 0.98, auto: 0.55, cost: 64000, maint: 0.32, noise: 1.2, commsKm: 25, vt: true });
  });
  it("overloaded quad with a 5 kg pod cannot fly", () => {
    const r = D.compute(cfg({ payload: "pod5" }));
    expect(r.mass).toBe(9.86); expect(r.margin).toBe(-4.66); expect(r.power).toBe(1867);
    expect(r.end).toBe(0); expect(r.rangeKm).toBe(0); expect(r.speed).toBe(14.4); expect(r.cost).toBe(28000);
  });
  it("wings are ignored (mass, drag, cost) unless the airframe is VTOL", () => {
    const a = D.compute(cfg({ airframe: "hexa" })), b = D.compute(cfg({ airframe: "hexa", wings: "long" }));
    const { o: _a, ...ra } = a; const { o: _b, ...rb } = b;
    expect(rb).toEqual(ra);
    expect(rb).toMatchObject({ mass: 4.86, maxMass: 6.8, power: 895, end: 23, wind: 0.75, cost: 28000, maint: 0.8 });
    const v1 = D.compute(cfg({ airframe: "vtol" })), v2 = D.compute(cfg({ airframe: "vtol", wings: "long" }));
    expect(v2.cost - v1.cost).toBe(2000);
    expect(v2.mass).toBeGreaterThan(v1.mass);
  });
});

describe("compute · first-order relations", () => {
  it("more energy → more endurance, but more mass", () => {
    const e = ["ls", "ll", "xl", "h2"].map(k => D.compute(cfg({ airframe: "hexa", energy: k })));
    for (let i = 1; i < e.length; i++) { expect(e[i].end).toBeGreaterThan(e[i - 1].end); }
    expect(e[2].mass).toBeGreaterThan(e[1].mass);
    // the same 700 Wh pack grounds a quad: mass beats lift, endurance collapses to zero
    const q = D.compute(cfg({ energy: "xl" }));
    expect(q.margin).toBeLessThan(0); expect(q.end).toBe(0);
  });
  it("VTOL cuts draw to less than half for the same payload set", () => {
    const q = D.compute(D.DEF), v = D.compute(cfg({ airframe: "vtol" }));
    expect(v.power * 2).toBeLessThan(q.power);
    expect(v.speed).toBeGreaterThan(q.speed);
  });
  it("high efficiency motors lengthen endurance; carbon fibre lightens the structure", () => {
    expect(D.compute(cfg({ propulsion: "eff" })).end).toBeGreaterThan(D.compute(D.DEF).end);
    expect(D.compute(cfg({ materials: "cf" })).mass).toBeLessThan(D.compute(D.DEF).mass);
  });
  it("range is the out-and-back radius: end × speed / 2", () => {
    const r = D.compute(cfg({ airframe: "vtol", energy: "xl" }));
    expect(r.rangeKm).toBe(Math.round(r.end * 60 * r.speed / 1000 / 2));
  });
  it("wind tolerance and autonomy are clamped to 1", () => {
    const r = D.compute(cfg({ airframe: "hexa", materials: "sealed", propulsion: "hp", autonomy: "swarm", sensors: "nav" }));
    expect(r.wind).toBe(1); expect(r.auto).toBe(1);
  });
  it("missing or unknown keys fall back to the defaults", () => {
    const { o: _o, ...r } = D.compute({} as DroneConfig);
    const { o: _d, ...d } = D.compute(D.DEF);
    expect(r).toEqual(d);
    expect(D.compute(cfg({ energy: "nope" })).end).toBe(d.end);
  });
});

describe("fit + binding", () => {
  it("default quad against each mission (legacy scores)", () => {
    const r = D.compute(D.DEF);
    expect(D.MISSIONS.map(m => D.fit(r, m).score)).toEqual([25, 0, 33, 33]);
    expect(D.fit(r, mission("storm")).f.map(x => [x.k, x.pass])).toEqual([["end", false], ["wind", false], ["comms", false], ["night", true]]);
    for (const m of D.MISSIONS) expect(D.binding(r, m).k).toBe("end");
  });
  it("lift failure is listed first and becomes the binding constraint", () => {
    const r = D.compute(cfg({ payload: "pod5" })), f = D.fit(r, mission("deliver"));
    expect(f.f[0]).toMatchObject({ k: "lift", pass: false, en: "Mass 9.86 kg exceeds lift capacity 5.2 kg" });
    expect(f).toMatchObject({ pass: 0, total: 4, score: 0 });
    const b = D.binding(r, mission("deliver"));
    expect(b.k).toBe("lift");
    expect(b.en).toBe("Binding constraint: Mass 9.86 kg exceeds lift capacity 5.2 kg. Lighten the payload, or move to a hexa/VTOL frame or high-thrust motors.");
    expect(b.ar.startsWith("القيد الحاكم: الوزن 9.86 كجم")).toBe(true);
  });
  it("a storm-ready VTOL meets every requirement and names the next lever", () => {
    const r = D.compute(cfg({ airframe: "vtol", energy: "h2", materials: "sealed", comms: "mesh", propulsion: "hp" }));
    const f = D.fit(r, mission("storm"));
    expect(f.score).toBe(100);
    expect(D.binding(r, mission("storm"))).toEqual({ ar: "كل المتطلبات محققة. الرافعة التالية: التكلفة والصيانة.", en: "All requirements met. Next lever: cost and maintainability." });
  });
  it("day-only camera fails the night requirement; LiDAR and relay are checked by selection", () => {
    const r = D.compute(cfg({ cameras: "eo" }));
    expect(D.fit(r, mission("storm")).f.find(x => x.k === "night")!.pass).toBe(false);
    expect(D.fit(D.compute(cfg({ sensors: "lidar" })), mission("map")).f.find(x => x.k === "lidar")!.pass).toBe(true);
    expect(D.fit(D.compute(cfg({ payload: "relay" })), mission("relay")).f.find(x => x.k === "relay")!.pass).toBe(true);
  });
  it("round-trip distance uses twice the radius", () => {
    const r = D.compute(cfg({ airframe: "vtol", energy: "xl", payload: "pod5", propulsion: "hp" }));
    const it = D.fit(r, mission("deliver")).f.find(x => x.k === "rangeKm")!;
    expect(it.en).toBe(`Distance ${r.rangeKm * 2} of 70 km round trip`);
    expect(it.pass).toBe(r.rangeKm * 2 >= 70);
  });
});
