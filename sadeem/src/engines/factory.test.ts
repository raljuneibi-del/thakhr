import { describe, it, expect } from "vitest";
import { FACTORY, compute, stationEffects, STATIONS, TECH, BASE } from "./factory";

const all = new Set(TECH.map(t => t.k));
const first = (n: number) => new Set(TECH.slice(0, n).map(t => t.k));

describe("factory engine", () => {
  it("has one line of eight stations and twelve technologies", () => {
    expect(STATIONS).toHaveLength(8);
    expect(TECH).toHaveLength(12);
    expect(new Set(TECH.map(t => t.k)).size).toBe(12);
    for (const t of TECH) for (const a of t.at) expect(STATIONS.some(s => s.k === a)).toBe(true);
    expect(FACTORY.compute).toBe(compute);
  });

  it("returns the current-state baseline with no technologies", () => {
    expect(compute(new Set())).toEqual({ tp: 118, q: 91.5, inc: 3.2, cost: 100, down: 14, capex: 0, takt: 44 });
    expect(compute(new Set()).takt).toBe(BASE.takt);
  });

  it("matches legacy numbers for one, six, seven and twelve technologies", () => {
    expect(compute(new Set(["robotics"]))).toEqual({ tp: 130, q: 93.3, inc: 2.7, cost: 96, down: 14, capex: 1.8, takt: 40 });
    expect(compute(first(6))).toEqual({ tp: 159, q: 99.4, inc: 2.1, cost: 79, down: 6, capex: 6.5, takt: 33 });
    expect(compute(first(7))).toEqual({ tp: 158, q: 99.4, inc: 2.1, cost: 81, down: 6, capex: 7.1, takt: 33 });
    expect(compute(all)).toEqual({ tp: 168, q: 99.4, inc: 0.4, cost: 77, down: 3.6, capex: 9.2, takt: 31 });
  });

  it("clamps quality, incidents and downtime to physical floors/ceilings", () => {
    const r = compute(all);
    expect(r.q).toBeLessThanOrEqual(99.4);
    expect(r.inc).toBeGreaterThanOrEqual(.2);
    expect(r.down).toBeGreaterThanOrEqual(2);
  });

  it("applies diminishing returns beyond six technologies", () => {
    // advanced materials adds cost; with seven techs the throughput gain is damped, so tp drops by one unit
    expect(compute(first(7)).tp).toBeLessThan(compute(first(6)).tp);
  });

  it("takt shortens as throughput rises", () => {
    for (let n = 1; n <= 12; n++) {
      const r = compute(first(n));
      expect(r.takt).toBeLessThanOrEqual(BASE.takt);
      // takt = base / (1 + gain); allow the rounding of tp and takt
      expect(Math.abs(r.takt - BASE.takt * BASE.tp / r.tp)).toBeLessThan(1);
    }
  });

  it("maps enabled technologies to the stations they act on", () => {
    const e = stationEffects(new Set(["iot", "vision"]));
    expect(e.machine).toEqual(["iot"]);
    expect(e.assemble).toEqual(["iot"]);
    expect(e.test).toEqual(["iot"]);
    expect(e.inspect).toEqual(["vision"]);
    expect(e.receive).toEqual([]);
    expect(Object.keys(stationEffects(new Set()))).toHaveLength(8);
    expect(Object.values(stationEffects(all)).every(a => a.length > 0)).toBe(true);
  });
});
