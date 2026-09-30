import { describe, expect, test } from "vitest";
import { EVAL, CRITERIA, WEIGHTS } from "./evaluate";
import { SAMPLE_IDEAS } from "@/core/data";

describe("evaluate (intake coach)", () => {
  test("empty text gives the legacy floor and all four missing items", () => {
    const r = EVAL.evaluate("", null);
    expect(r.s).toEqual({ clarity: 20, value: 45, feasibility: 50, risk: 28, fit: 40 });
    expect(r.total).toBe(43);
    expect(r.missing).toHaveLength(4);
    expect(r.verdict.en).toBe("Needs rework");
  });

  test("a complete, linked submission is ready for national evaluation", () => {
    const r = EVAL.evaluate("It saves 40 hours of downtime because a prototype of the cooling module already exists with a local supplier and can be tested in a month.", "N-01");
    expect(r.s).toEqual({ clarity: 58, value: 90, feasibility: 90, risk: 28, fit: 100 });
    expect(r.total).toBe(83);
    expect(r.missing).toHaveLength(0);
    expect(r.verdict.en).toBe("Ready for national evaluation");
  });

  test("linking a national need raises value and fit and removes that missing item", () => {
    const a = EVAL.evaluate("drone", ""), b = EVAL.evaluate("drone", "N-02");
    expect(b.s.value - a.s.value).toBe(10);
    expect(b.s.fit - a.s.fit).toBe(25);
    expect(b.missing.length).toBe(a.missing.length - 1);
  });

  test("Arabic keywords count the same as English ones", () => {
    expect(EVAL.evaluate("خطر حريق", "").s.risk).toBe(68);
    expect(EVAL.evaluate("fire hazard", "").s.risk).toBe(68);
  });

  test("scores never exceed 100 and very long text loses feasibility", () => {
    const long = "because cost prototype cooling ".repeat(60);
    const r = EVAL.evaluate(long, "N-01");
    Object.values(r.s).forEach(v => expect(v).toBeLessThanOrEqual(100));
    expect(r.s.feasibility).toBe(80);
  });
});

describe("classify (containment vault)", () => {
  test("levels follow the points thresholds 3 and 5", () => {
    expect(EVAL.classify("", {}).level).toBe("open");
    expect(EVAL.classify("", { domain: 1 }).level).toBe("open");
    expect(EVAL.classify("", { export: 1 })).toMatchObject({ level: "controlled", pts: 3 });
    expect(EVAL.classify("", { domain: 2, dual: 1 })).toMatchObject({ level: "high", pts: 6 });
    expect(EVAL.classify("", { domain: 2, dual: 1, export: 1, partner: 1 }).pts).toBe(11);
  });

  test("a sensitive term adds three points on its own", () => {
    expect(EVAL.classify("missile guidance", {})).toMatchObject({ level: "controlled", pts: 3, kw: true });
    expect(EVAL.classify("صاروخ", { domain: 1 })).toMatchObject({ level: "high", pts: 5, kw: true });
  });

  test("the containment rule keeps its wording", () => {
    const r = EVAL.classify("", { export: 1, dual: 1 });
    expect(r.level).toBe("high");
    expect(r.rule.en).toContain("never sent to an external model");
    expect(r.rule.ar).toContain("لا تُرسل إلى أي نموذج خارجي");
  });
});

describe("national (six criteria)", () => {
  test("six criteria whose weights sum to one", () => {
    expect(CRITERIA.map(c => c[0])).toEqual(["need", "sov", "feas", "self", "risk", "quality"]);
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  test("reproduces the legacy scores for the sample records", () => {
    const by = (id: string) => EVAL.national(SAMPLE_IDEAS.find(i => i.id === id)!);
    expect(by("SD-1071").total).toBe(66);
    expect(by("SD-1071").s).toEqual({ need: 92, sov: 67, feas: 50, self: 87, risk: 28, quality: 24 });
    expect(by("SD-1080").s.risk).toBe(70);           // high sensitivity pins risk
    expect(by("SD-1083").s.need).toBe(45);           // no national need
    expect(by("SD-1041").total).toBe(61);
  });

  test("every criterion carries a reason in both languages", () => {
    const n = EVAL.national(SAMPLE_IDEAS[0]);
    for (const [k] of CRITERIA) { expect(n.reasons[k].ar.length).toBeGreaterThan(0); expect(n.reasons[k].en.length).toBeGreaterThan(0); }
    expect(n.reasons.need.en).toContain("N-01");
  });

  test("is deterministic", () => {
    const i = SAMPLE_IDEAS[3];
    expect(EVAL.national(i)).toEqual(EVAL.national(i));
  });
});

describe("similar (one door, no twins)", () => {
  test("finds the nearest twin across languages", () => {
    const r = EVAL.similar("Self-cleaning cooling for desert vehicles", SAMPLE_IDEAS);
    expect(r[0].i.id).toBe("SD-1041");
    expect(r[0].sim).toBe(1);
    const ar = EVAL.similar("تبريد ذاتي التنظيف للمركبات", SAMPLE_IDEAS);
    expect(ar[0].i.id).toBe("SD-1041");
  });

  test("skips the record itself, caps at three and ignores unrelated text", () => {
    expect(EVAL.similar("Self-cleaning cooling for desert vehicles", SAMPLE_IDEAS, "SD-1041").every(x => x.i.id !== "SD-1041")).toBe(true);
    expect(EVAL.similar("drones drone mesh comms encryption edge sensor", SAMPLE_IDEAS).length).toBeLessThanOrEqual(3);
    expect(EVAL.similar("zzz qqq", SAMPLE_IDEAS)).toEqual([]);
    expect(EVAL.similar("", SAMPLE_IDEAS)).toEqual([]);
  });
});
