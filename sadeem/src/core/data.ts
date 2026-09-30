/* SADEEM Hangar · reference data. Every record below is an illustrative example, marked `sample`. */
import type { Bi } from "./i18n";

export type Domain = "land" | "air" | "cyber" | "mfg";
export type Source = "research" | "academic" | "industry" | "startup" | "talent";
export type Sensitivity = "open" | "controlled" | "high";

export interface Idea {
  id: string;
  t: Bi;
  text?: string;
  st: number;            // station index 0..10
  area: Domain | string;
  src: Source | string;
  owner: Bi;
  days: number;
  sample?: 1;
  mine?: 1;
  ch?: string;           // national need id
  score?: number;
  sens?: Sensitivity | string;
  entity?: Bi;
  created?: number;
  [k: string]: any;
}

export interface Need { id: string; t: Bi; d: Bi; sponsor: Bi; due: number; reward: number }

export const SAMPLE_IDEAS: Idea[] = [
  { id: "SD-1041", t: { ar: "تبريد ذاتي التنظيف للمركبات في البيئة الصحراوية", en: "Self-cleaning cooling for vehicles in desert conditions" }, st: 9, area: "land", src: "industry", owner: { ar: "شركة صناعية وطنية", en: "National industrial company" }, days: 34, sample: 1, ch: "N-01" },
  { id: "SD-1058", t: { ar: "كشف عيوب اللحام بالرؤية الحاسوبية", en: "Computer-vision weld-defect detection" }, st: 7, area: "mfg", src: "research", owner: { ar: "مختبر بحثي وطني", en: "National research lab" }, days: 64, sample: 1, ch: "N-03" },
  { id: "SD-1066", t: { ar: "درون طويل التحمل محكم ضد الغبار", en: "Dust-sealed long-endurance drone" }, st: 6, area: "air", src: "talent", owner: { ar: "موهبة وطنية", en: "National talent" }, days: 31, sample: 1, ch: "N-02" },
  { id: "SD-1071", t: { ar: "قطع غيار حرجة بالتصنيع الإضافي المعدني", en: "Critical spares by metal additive manufacturing" }, st: 10, area: "mfg", src: "industry", owner: { ar: "شركة صناعية وطنية", en: "National industrial company" }, days: 12, sample: 1, ch: "N-03", entity: { ar: "جهة صناعية سيادية", en: "Sovereign industrial entity" } },
  { id: "SD-1077", t: { ar: "توأم رقمي لمنظومات التبريد في الأسطول", en: "Digital twin of fleet cooling systems" }, st: 5, area: "land", src: "academic", owner: { ar: "جامعة وطنية", en: "National university" }, days: 40, sample: 1, ch: "N-04" },
  { id: "SD-1080", t: { ar: "ملاحة بصرية عند فقدان إشارة GNSS", en: "Visual navigation under GNSS denial" }, st: 3, area: "air", src: "startup", owner: { ar: "شركة ناشئة وطنية", en: "National start-up" }, days: 12, sample: 1, ch: "N-02", sens: "high" },
  { id: "SD-1083", t: { ar: "تدريب الفنيين بالواقع المعزز", en: "AR training for technicians" }, st: 2, area: "mfg", src: "academic", owner: { ar: "جامعة وطنية", en: "National university" }, days: 9, sample: 1, ch: "" },
  { id: "SD-1085", t: { ar: "مؤشر انسداد فلتر الهواء", en: "Air-filter clogging indicator" }, st: 1, area: "land", src: "talent", owner: { ar: "موهبة وطنية", en: "National talent" }, days: 4, sample: 1, ch: "N-01" },
  { id: "SD-1086", t: { ar: "جدولة ذكية للصيانة التنبؤية", en: "Smart predictive-maintenance scheduling" }, st: 0, area: "mfg", src: "industry", owner: { ar: "شركة صناعية وطنية", en: "National industrial company" }, days: 2, sample: 1, ch: "N-03" },
  { id: "SD-1087", t: { ar: "لوحة حماية مركّبة أخف وزناً", en: "Lighter composite protection panel" }, st: 4, area: "land", src: "research", owner: { ar: "مختبر بحثي وطني", en: "National research lab" }, days: 22, sample: 1, ch: "", sens: "controlled" },
  { id: "SD-1090", t: { ar: "اتصالات شبكية مرنة للدرونات", en: "Resilient mesh comms for drones" }, st: 8, area: "cyber", src: "startup", owner: { ar: "شركة ناشئة وطنية", en: "National start-up" }, days: 71, sample: 1, ch: "N-02" },
  { id: "SD-1092", t: { ar: "تشفير خفيف لبيانات المستشعرات الطرفية", en: "Lightweight encryption for edge sensor data" }, st: 6, area: "cyber", src: "research", owner: { ar: "مختبر بحثي وطني", en: "National research lab" }, days: 66, sample: 1, ch: "N-04", sens: "high" },
];

export const SOURCES: Record<string, Bi> = {
  research: { ar: "مختبرات بحثية", en: "Research labs" },
  academic: { ar: "جامعات", en: "Universities" },
  industry: { ar: "شركات صناعية", en: "Industrial companies" },
  startup: { ar: "شركات ناشئة", en: "Start-ups" },
  talent: { ar: "مواهب وطنية", en: "National talent" },
};

export const DOMAINS: Record<string, Bi> = {
  land: { ar: "الأنظمة البرية", en: "Land systems" },
  air: { ar: "الجو والفضاء", en: "Air & space" },
  cyber: { ar: "السيبراني والإلكترونيات", en: "Cyber & electronics" },
  mfg: { ar: "التصنيع المتقدم", en: "Advanced manufacturing" },
};

export const ENTITIES: Array<{ k: string } & Bi> = [
  { k: "sov", ar: "جهة سيادية", en: "Sovereign entity" },
  { k: "ind", ar: "جهة صناعية سيادية", en: "Sovereign industrial entity" },
  { k: "res", ar: "جهة بحثية وطنية", en: "National research entity" },
  { k: "acad", ar: "جهة أكاديمية وطنية", en: "National academic entity" },
];

export const CHALLENGES: Need[] = [
  { id: "N-01", t: { ar: "تشغيل الأنظمة البرية عند 50°م", en: "Land systems operating at 50 °C" }, d: { ar: "كيف نحافظ على أداء التبريد في الغبار والحرارة دون زيادة الوزن؟", en: "How do we keep cooling performance in dust and heat without adding mass?" }, sponsor: { ar: "جهة سيادية", en: "Sovereign entity" }, due: 18, reward: 0 },
  { id: "N-02", t: { ar: "مراقبة جوية مستمرة في العواصف", en: "Continuous aerial watch through storms" }, d: { ar: "زمن تحليق طويل مع مقاومة الرياح والغبار وملاحة دون GNSS.", en: "Long endurance with wind and dust tolerance and GNSS-denied navigation." }, sponsor: { ar: "جهة سيادية", en: "Sovereign entity" }, due: 33, reward: 0 },
  { id: "N-03", t: { ar: "سلاسل إمداد صناعية مكتفية ذاتياً", en: "Self-sufficient industrial supply chains" }, d: { ar: "خفض الاعتماد على القطع المستوردة النادرة والتوقفات غير المخططة.", en: "Reduce dependence on rare imported parts and unplanned downtime." }, sponsor: { ar: "جهة صناعية سيادية", en: "Sovereign industrial entity" }, due: 47, reward: 0 },
  { id: "N-05", t: { ar: "الطاقة والدفع المستدام للمنصات", en: "Sustainable power and propulsion for platforms" }, d: { ar: "احتياج معلن لا تتجه إليه أي فكرة بعد — فراغ قدرة قائم.", en: "A declared need with no ideas heading toward it yet — a standing capability void." }, sponsor: { ar: "جهة سيادية", en: "Sovereign entity" }, due: 90, reward: 0 },
  { id: "N-04", t: { ar: "بيانات الميدان إلى قرار خلال ساعات", en: "Field data to decision in hours" }, d: { ar: "كيف تصل بيانات المنظومات إلى المهندسين بأمان خلال ساعات لا أسابيع؟", en: "How does system data reach engineers securely in hours, not weeks?" }, sponsor: { ar: "جهة بحثية وطنية", en: "National research entity" }, due: 60, reward: 0 },
];

/** Zones in facility order, grouped by floor for navigation. `n` is the bay code shown in wayfinding. */
export type ZoneId = "arrival" | "vision" | "deck" | "bay" | "drones" | "factory" | "lab" | "twins" | "missions" | "library" | "radar" | "galaxy" | "foresight" | "gate" | "os";
export const ZONES: ZoneId[] = ["arrival", "vision", "deck", "bay", "drones", "factory", "lab", "twins", "missions", "library", "radar", "galaxy", "foresight", "gate", "os"];
export const NAV: Array<{ g: string; items: Array<{ id: ZoneId; n: string }> }> = [
  { g: "g_facility", items: [{ id: "arrival", n: "01" }, { id: "vision", n: "VC" }] },
  { g: "g_pipeline", items: [{ id: "lab", n: "03" }, { id: "gate", n: "04" }, { id: "deck", n: "02" }] },
  { g: "g_labs", items: [{ id: "bay", n: "L1" }, { id: "drones", n: "L2" }, { id: "factory", n: "L3" }, { id: "twins", n: "L4" }, { id: "missions", n: "L5" }] },
  { g: "g_intel", items: [{ id: "library", n: "06" }, { id: "radar", n: "07" }, { id: "galaxy", n: "✦" }, { id: "foresight", n: "◎" }] },
];
/** Zones that are staged at night (dark surfaces). Everything else is facility daylight. */
export const NIGHT_ZONES: ZoneId[] = ["arrival", "vision", "gate", "bay", "galaxy", "radar", "foresight", "missions"];
