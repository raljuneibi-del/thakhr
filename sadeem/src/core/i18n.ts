/* SADEEM Hangar · language layer. Arabic is the first language of the building. */

export type Lang = "ar" | "en";
export type Bi = { ar: string; en: string };
export type Text = string | Bi | null | undefined;

const DICT = {
  ar: {
    brand: "سديم", hangar: "الهانقر", os: "نظام سديم", enter: "ادخل المنشأة", work: "اذهب إلى العمل",
    z_arrival: "المدخل الوطني", z_vision: "قاعة الرؤية", z_deck: "منصة القيادة", z_bay: "حظيرة المنصات",
    z_drones: "مختبر الدرونات", z_factory: "مصنع المستقبل", z_lab: "مسار سديم", z_twins: "مختبر التوائم الرقمية",
    z_missions: "هندسة المهام", z_library: "مكتبة الابتكار", z_radar: "رادار التقنيات", z_galaxy: "الكوكبة الوطنية",
    z_foresight: "المرصد", z_gate: "قبو الاحتواء", z_os: "نظام سديم",
    g_facility: "المنشأة", g_pipeline: "المسار", g_labs: "مختبرات القدرة", g_intel: "المعرفة والاستشراف",
    d_arrival: "باب واحد وثلاث عتبات", d_vision: "تصريحات القيادة الموثّقة", d_deck: "صورة القرار الوطني",
    d_lab: "إحدى عشرة محطة حتى التوجيه", d_gate: "التصنيف قبل الإطلاق", d_bay: "منصات مرجعية بطبقاتها",
    d_drones: "الوزن والطاقة وزمن التحليق", d_factory: "خط الإنتاج الحالي والمستقبلي", d_twins: "توأم التبريد والبيئة",
    d_missions: "عاصفة الشمال: ست منصات", d_library: "ما تعرفه الدولة بالفعل", d_radar: "التقنيات على أربعة آفاق",
    d_galaxy: "المحفظة كمجرّة حيّة", d_foresight: "إشارات المستقبل", d_os: "سطح العمل اليومي",
    palette: "انتقل إلى…", palHint: "اكتب اسم منطقة أو أداة أو فكرة", lang: "English", langShort: "EN",
    ai: "الطبقة الذكية", aiRole: "الدور", aiSug: "مقترح · يُراجعه إنسان", aiOff: "لا يوجد سياق بعد",
    map: "خريطة المنشأة", tour: "جولة موجّهة", sound: "الصوت المحيط", theme: "المظهر", menu: "القائمة",
    close: "إغلاق", back: "رجوع", next: "التالي", run: "شغّل", reset: "إعادة", save: "حفظ", apply: "طبّق", cancel: "إلغاء",
    training: "قيم تدريبية توضيحية، ليست مواصفات رسمية", all: "الكل", proposed: "مقترح · بانتظار الاعتماد الرسمي",
    toIdea: "حوّل هذه النتيجة إلى فكرة",
    stage: ["التجميع", "التصنيف", "التنقية", "الاحتواء", "التنظيم", "التقييم الوطني", "اختبار جدول الأفكار", "التجربة", "المتابعة", "الإحالة والاعتماد", "التوجيه للجهة المختصة"],
    sadeem: "سديم", contained: "محتواة · تحت التوجيه الوطني", madeIn: "صُنع في أبوظبي",
    disclaimer: "إطار مفاهيمي عالي المستوى. لا يتضمن آليات تشغيلية؛ التفاصيل تُستكمل لاحقاً وحصراً بموافقة رسمية.",
    pillars: { VISION: "الرؤية", KNOWLEDGE: "المعرفة", INNOVATION: "الابتكار", AMBITION: "الطموح", ENGINEERING: "الهندسة", "HUMAN CAPITAL": "رأس المال البشري", FUTURE: "المستقبل" },
    arSurface: "النص العربي الرسمي يُضاف من الصفحة الرسمية قبل النشر", enSurface: "لا توجد ترجمة رسمية؛ يُعرض الأصل العربي",
    source: "المصدر", verified: "موثّق", example: "مثال",
  },
  en: {
    brand: "SADEEM", hangar: "Hangar", os: "SADEEM OS", enter: "Enter the facility", work: "Go to work",
    z_arrival: "Entry Point", z_vision: "Vision Chamber", z_deck: "Command Deck", z_bay: "Vehicle Bay",
    z_drones: "Drone Lab", z_factory: "Factory of the Future", z_lab: "Pipeline Hall", z_twins: "Digital Twin Lab",
    z_missions: "Mission Engineering", z_library: "Innovation Library", z_radar: "Technology Radar", z_galaxy: "National Constellation",
    z_foresight: "Foresight Telescope", z_gate: "Containment Vault", z_os: "SADEEM OS",
    g_facility: "Facility", g_pipeline: "Pipeline", g_labs: "Capability labs", g_intel: "Knowledge & foresight",
    d_arrival: "One door, three thresholds", d_vision: "Verified leadership statements", d_deck: "The national decision view",
    d_lab: "Eleven stations to routing", d_gate: "Classification before launch", d_bay: "Reference platforms, layer by layer",
    d_drones: "Mass, power and endurance", d_factory: "The line today and tomorrow", d_twins: "Cooling and environment twins",
    d_missions: "Shamal Storm: six assets", d_library: "What the nation already knows", d_radar: "Technologies on four horizons",
    d_galaxy: "The portfolio as a living galaxy", d_foresight: "Signals from the future", d_os: "The daily work surface",
    palette: "Go to…", palHint: "Type a zone, a tool or an idea", lang: "العربية", langShort: "ع",
    ai: "AI layer", aiRole: "Role", aiSug: "Suggested · a person confirms", aiOff: "No context yet",
    map: "Facility map", tour: "Guided tour", sound: "Ambient sound", theme: "Appearance", menu: "Menu",
    close: "Close", back: "Back", next: "Next", run: "Run", reset: "Reset", save: "Save", apply: "Apply", cancel: "Cancel",
    training: "Illustrative training values, not official specifications", all: "All", proposed: "Proposed · pending official approval",
    toIdea: "Turn this result into an idea",
    stage: ["Collection", "Classification", "Filtering", "Containment", "Organisation", "National evaluation", "Idea-table test", "Experiment", "Follow-up", "Referral & approval", "Routing"],
    sadeem: "SADEEM", contained: "Contained · under national guidance", madeIn: "Made in Abu Dhabi",
    disclaimer: "A high-level conceptual frame. It contains no operational mechanisms; details are completed later, exclusively, with official approval.",
    pillars: { VISION: "VISION", KNOWLEDGE: "KNOWLEDGE", INNOVATION: "INNOVATION", AMBITION: "AMBITION", ENGINEERING: "ENGINEERING", "HUMAN CAPITAL": "HUMAN CAPITAL", FUTURE: "FUTURE" },
    arSurface: "Official Arabic text is added from the official page before publication", enSurface: "No official translation; the Arabic original is shown",
    source: "Source", verified: "Verified", example: "Example",
  },
} as const;

type Dict = (typeof DICT)["en"];

let L: Lang = "ar";
try { const s = localStorage.getItem("sadeem_lang"); if (s === "ar" || s === "en") L = s; } catch { /* storage blocked */ }

export const lang = (): Lang => L;
export const isAr = () => L === "ar";
export function setLangValue(l: Lang) {
  L = l;
  try { localStorage.setItem("sadeem_lang", l); } catch { /* ignore */ }
  document.documentElement.lang = l;
  document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
}

/** Dictionary lookup. Returns the Arabic or English entry (strings, arrays or maps). */
export function t<K extends keyof Dict>(k: K): any;
export function t(k: string): any;
export function t(k: string): any {
  const v = (DICT[L] as any)[k];
  return v == null ? ((DICT.en as any)[k] ?? k) : v;
}

/** Pick the current language from a bilingual object. */
export const tx = (o: Text): string => o == null ? "" : typeof o === "string" ? o : (o[L] ?? o.en ?? "");

/** Arabic-Indic numerals in Arabic prose; Western numerals everywhere else. */
export const num = (n: number | string): string =>
  L === "ar" ? String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[+d]) : String(n);
