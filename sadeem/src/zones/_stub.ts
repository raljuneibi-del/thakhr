/* temporary stubs so the shell can be checked before the zones are ported; removed once all zones exist */
import { register, head, ZONES, type ZoneId } from "@/core";
const have = new Set<string>(Object.keys(import.meta.glob("./*.ts")).map(p => p.replace("./", "").replace(".ts", "")));
for (const z of ZONES) if (!have.has(z)) register(z as ZoneId, { mount(el) { head(el, "stub", z, "Porting in progress"); } , insight: () => ({ role: { ar: "مضيف المنشأة", en: "Facility host" }, lines: [{ ar: "أنت أمام نقطة الدخول الوطنية الواحدة.", en: "You are at the single national entry point." }] }) });
