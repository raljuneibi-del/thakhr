import { describe, it, expect } from "vitest";
import { OPS_CORE, simulate, createSim, stormArrival, stormAt, inStorm, pathKm, fits, ASSETS, BASE, ZONE, STATION, VIL, TMAX, type Plan } from "./ops";

const DEFAULT: Plan = { assign: { W1: "deliver", M1: "deliver", B1: "watch", D1: "search" }, route: "wad" };

describe("OPS_CORE mission engine", () => {
  it("has six assets and three objectives", () => {
    expect(ASSETS).toHaveLength(6);
    expect(OPS_CORE.TASKS.map(t => t.k)).toEqual(["deliver", "search", "watch"]);
    expect(OPS_CORE.TASKS.reduce((s, t) => s + t.w, 0)).toBeCloseTo(1);
  });

  it("moves the storm front from the north-west at a fixed speed", () => {
    expect(stormAt(0)).toBe(-150);
    expect(stormAt(1) - stormAt(0)).toBe(70);
    expect(stormArrival(BASE.x, BASE.z)).toBeCloseTo(0.4286, 3);
    expect(stormArrival(ZONE.x, ZONE.z)).toBeCloseTo(2.8571, 3);
    expect(stormArrival(STATION.x, STATION.z)).toBeCloseTo(3.6571, 3);
    expect(stormArrival(VIL.x, VIL.z)).toBeCloseTo(4.1429, 3);
    const h = stormArrival(STATION.x, STATION.z);
    expect(inStorm(STATION.x, STATION.z, h - .01)).toBe(false);
    expect(inStorm(STATION.x, STATION.z, h + .01)).toBe(true);
  });

  it("keeps legacy route lengths", () => {
    expect(["hwy", "trk", "wad", "zon", "sta"].map(k => pathKm(k as any))).toEqual([207, 170, 138, 88, 121]);
  });

  it("only ground assets can deliver", () => {
    for (const a of ASSETS) expect(fits(a, "deliver")).toBe(a.type === "g");
    for (const a of ASSETS) expect(fits(a, "watch")).toBe(true);
  });

  it("scores the default plan as legacy does", () => {
    const r = simulate(DEFAULT);
    expect(r.deliver.score).toBe(100);
    expect(r.search.score).toBe(100);
    expect(r.watch.score).toBe(58);
    expect(r.total).toBe(87);
    expect(r.gaps).toEqual(["watch"]);
  });

  it("names the forecast gap when the highway closes under the storm", () => {
    const r = simulate({ assign: { W1: "deliver", M1: "deliver", B1: "search", D1: "watch", D2: "watch" }, route: "hwy" });
    expect(r.deliver.road).toBe(true);
    expect(r.deliver.score).toBe(75);
    expect(r.watch.score).toBe(33);
    expect(r.total).toBe(70);
    expect(r.gaps).toEqual(["watch", "forecast"]);
  });

  it("gets 4×4 vehicles stuck in dunes and names the dune gap", () => {
    const r = simulate({ assign: { W1: "deliver", M1: "deliver", M2: "search" }, route: "trk" });
    expect(r.deliver.stuck).toEqual(["TV-1"]);
    expect(r.search.score).toBe(60);
    expect(r.total).toBe(58);
    expect(r.gaps).toEqual(["watch", "dune"]);
  });

  it("handles an empty plan", () => {
    const r = simulate({ assign: {}, route: "wad" });
    expect(r.total).toBe(0);
    expect(r.search.t).toBeNull();
    expect(r.gaps).toEqual(["watch"]);
  });

  it("stops at TMAX and records events in time order; drones go down inside the storm", () => {
    const s = createSim({ assign: { D1: "watch", D2: "search" }, route: "wad" });
    while (!s.S.done) s.step(.02);
    expect(s.S.t).toBe(TMAX);
    const ts = s.S.events.map(e => e.t);
    expect([...ts].sort((a, b) => a - b)).toEqual(ts);
    expect(s.S.U.every(u => ["down", "rtb", "done", "station", "search"].includes(u.st))).toBe(true);
    s.step(.02); // no-op once done
    expect(s.S.t).toBe(TMAX);
  });
});
