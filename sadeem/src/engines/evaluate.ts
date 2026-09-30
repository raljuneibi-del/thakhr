/* SADEEM Hangar · idea evaluation + SADEEM classification rules (pure, deterministic, offline).
   Ported from the legacy EVAL engine. Nothing here touches the DOM or leaves the browser. */
import type { Bi } from "@/core/i18n";
import type { Idea } from "@/core/data";

const A = (ar: string, en: string): Bi => ({ ar, en });

export type Level = "open" | "controlled" | "high";
export interface InputScores { clarity: number; value: number; feasibility: number; risk: number; fit: number }
export interface Evaluation { s: InputScores; total: number; missing: Bi[]; verdict: Bi }
export interface ClassAnswers { domain?: number; dual?: number; export?: number; partner?: number }
export interface Classification { level: Level; pts: number; kw: boolean; rule: Bi }
export type Criterion = "need" | "sov" | "feas" | "self" | "risk" | "quality";
export interface NationalScore { s: Record<Criterion, number>; total: number; ev: Evaluation; reasons: Record<Criterion, Bi> }
export interface Twin<T = Idea> { i: T; sim: number }

const KW = {
  value: [/cost|ساع|درهم|كلفة|وقت|زمن|hour|save|توفير|downtime|توقف|throughput|إنتاج/i],
  feas: [/prototype|نموذج|test|تجربة|exist|موجود|supplier|مورد|off-the-shelf|جاهز/i],
  risk: [/safety|سلامة|explos|ammunition|ذخيرة|hazard|خطر|fire|حريق/i],
  fit: [/cooling|تبريد|dust|غبار|drone|درون|autonom|ذات|additive|طباعة|twin|توأم|weld|لحام|emirat|إماراتي|training|تدريب/i],
  clarity: [/because|لأن|so that|بحيث|instead|بدل|when|عندما/i],
};
const SENS = [/missile|صاروخ|warhead|رأس حربي|guidance|توجيه صاروخ|classified|سري|export control|ammunition|ذخيرة|encryption key|مفتاح تشفير|frequency plan|خطة ترددات|partner data|بيانات شريك/i];
const SELF = /spare|قطع|supply|إمداد|additive|تصنيع/i;

/** Input-quality evaluation of a submission text (intake coach). */
function evaluate(text: string, ch?: string | null): Evaluation {
  const t = String(text || ""); const len = t.length;
  const hit = (arr: RegExp[]) => arr.some(r => r.test(t));
  const s: InputScores = {
    clarity: Math.min(100, Math.round(20 + Math.min(len, 600) / 600 * 55 + (hit(KW.clarity) ? 25 : 0))),
    value: Math.min(100, 45 + (hit(KW.value) ? 35 : 0) + (ch ? 10 : 0) + (len > 240 ? 10 : 0)),
    feasibility: Math.min(100, 50 + (hit(KW.feas) ? 30 : 0) + (len > 120 ? 10 : 0) - (len > 1200 ? 10 : 0)),
    risk: hit(KW.risk) ? 68 : 28,
    fit: Math.min(100, 40 + (hit(KW.fit) ? 35 : 0) + (ch ? 25 : 0)),
  };
  const missing: Bi[] = [];
  if (!hit(KW.value)) missing.push(A("لم يُذكر الأثر الكمي: كم ساعة أو درهماً أو توقفاً توفّر الفكرة؟", "No quantified impact: how many hours, dirhams or stops does it save?"));
  if (!hit(KW.feas)) missing.push(A("لم يُذكر كيف يمكن تجربتها بتكلفة منخفضة وفي مدة محددة.", "No path to a low-cost, time-boxed test."));
  if (!ch) missing.push(A("لم تُربط باحتياج وطني معلن؛ الربط يرفع الأولوية.", "Not linked to a declared national need; linking raises priority."));
  if (len < 120) missing.push(A("الوصف قصير؛ أضف الملاحظة الأصلية ومن يتأثر بها.", "The description is short; add the original observation and who is affected."));
  const total = Math.round(s.clarity * .2 + s.value * .3 + s.feasibility * .25 + (100 - s.risk) * .1 + s.fit * .15);
  const verdict = total >= 72 ? A("جاهزة للتقييم الوطني", "Ready for national evaluation")
    : total >= 55 ? A("تحتاج معلومات قبل التقييم", "Needs information before evaluation")
    : A("تحتاج إعادة صياغة", "Needs rework");
  return { s, total, missing, verdict };
}

/** SADEEM classification: four answers + a sensitive-term screen → open / controlled / high. */
function classify(text: string, answers?: ClassAnswers | null): Classification {
  const a = answers || {};
  let pts = (a.domain || 0) * 2 + (a.dual || 0) * 2 + (a.export || 0) * 3 + (a.partner || 0) * 2;
  const kw = SENS.some(r => r.test(String(text || ""))); if (kw) pts += 3;
  const level: Level = pts >= 5 ? "high" : pts >= 3 ? "controlled" : "open";
  const rule = level === "high"
    ? A("قاعدة الاحتواء: مجال حساس + استخدام مزدوج أو ضوابط تصدير. تُحفَظ الفكرة في مجموعة مقيدة ولا تُرسل إلى أي نموذج خارجي، وتُوجَّه عبر المسار الوطني.", "Containment rule: sensitive domain plus dual use or export controls. Stored in the restricted collection, never sent to an external model, guided through the national path.")
    : level === "controlled"
      ? A("قاعدة التوجيه: تُراجع داخلياً قبل النشر، وتبقى خارج البورصة والخلاصة.", "Guidance rule: reviewed internally before publication, kept out of the exchange and the feed.")
      : A("قاعدة الانفتاح: تدخل مسار الابتكار العادي.", "Open rule: enters the normal innovation path.");
  return { level, pts, kw, rule };
}

/** The six national criteria (proposed, pending official approval). Weights are an open item for the approving authority. */
export const CRITERIA: Array<[Criterion, Bi]> = [
  ["need", A("مواءمة الاحتياج الوطني", "National need alignment")],
  ["sov", A("القيمة السيادية", "Sovereign value")],
  ["feas", A("الجدوى والنضج التقني", "Feasibility & maturity")],
  ["self", A("الاكتفاء الذاتي", "Self-sufficiency")],
  ["risk", A("المخاطر والحساسية", "Risk & sensitivity")],
  ["quality", A("جودة المدخل الفكري", "Quality of the input")],
];
export const WEIGHTS: Record<Criterion, number> = { need: .22, sov: .18, feas: .18, self: .16, risk: .10, quality: .16 };

/** Deterministic per-record spread (legacy): the sum of the id's character codes. */
const idHash = (id: string) => [...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0);

/** Six-criteria national score with a rule-based reason for each criterion.
    Uses the English title (or the Arabic one when no English exists) so a score never changes with the interface language. */
function national(i: Pick<Idea, "id" | "t" | "ch" | "sens"> & { d?: string }): NationalScore {
  const title = i.t?.en || i.t?.ar || "";
  const ev = evaluate((i.d || "") + " " + title, i.ch);
  const h = idHash(i.id);
  const selfHit = SELF.test((i.t?.ar || "") + " " + (i.t?.en || ""));
  const s: Record<Criterion, number> = {
    need: i.ch ? Math.min(100, 70 + h % 25) : 45,
    sov: Math.min(100, 50 + (i.sens ? 25 : 0) + h % 20),
    feas: ev.s.feasibility,
    self: Math.min(100, 45 + (selfHit ? 35 : 10) + h % 15),
    risk: i.sens === "high" ? 70 : ev.s.risk,
    quality: ev.s.clarity,
  };
  const total = Math.round(s.need * WEIGHTS.need + s.sov * WEIGHTS.sov + s.feas * WEIGHTS.feas + s.self * WEIGHTS.self + (100 - s.risk) * WEIGHTS.risk + s.quality * WEIGHTS.quality);
  const reasons: Record<Criterion, Bi> = {
    need: i.ch ? A(`مرتبطة بالاحتياج الوطني المعلن ${i.ch}`, `Linked to declared national need ${i.ch}`) : A("غير مرتبطة باحتياج وطني معلن", "Not linked to a declared national need"),
    sov: i.sens ? A("تحمل علامة حساسية، ما يرفع قيمتها السيادية", "Carries a sensitivity marking, which raises its sovereign value") : A("لا تحمل علامة حساسية", "Carries no sensitivity marking"),
    feas: s.feas >= 80 ? A("يُذكر مسار تجربة أو مكوّن قائم", "A test path or an existing component is named") : A("لا يُذكر بعد مسار تجربة منخفض التكلفة", "No low-cost test path named yet"),
    self: selfHit ? A("تعالج القطع أو الإمداد أو التصنيع المحلي", "Addresses parts, supply or local manufacture") : A("لا يُذكر إحلال مباشر في سلسلة الإمداد", "No direct supply-chain substitution stated"),
    risk: i.sens === "high" ? A("حساسية عالية: تُدار تحت الاحتواء", "High sensitivity: handled under containment") : s.risk > 50 ? A("وردت مصطلحات سلامة أو خطر", "Safety or hazard terms are present") : A("لم تُرصد مصطلحات سلامة أو خطر", "No safety or hazard terms detected"),
    quality: s.quality >= 60 ? A("وصف واضح ومعلّل", "A clear, reasoned description") : A("الوصف موجز؛ تنقصه الملاحظة الأصلية ومن يتأثر بها", "Brief description; the original observation and who is affected are missing"),
  };
  return { s, total, ev, reasons };
}

/** Words of three or more letters, lower-cased, punctuation removed (Arabic and Latin). */
function words(s: string): Set<string> {
  return new Set(String(s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(w => w.length > 2));
}

/** Nearest twins: ideas in `pool` whose words overlap `text` by at least 34 %, best first, at most three. */
function similar<T extends Pick<Idea, "id" | "t"> & { d?: string }>(text: string, pool: T[], skip?: string): Array<Twin<T>> {
  const a = words(text);
  return pool.filter(i => i.id !== skip).map(i => {
    const b = words((i.t?.ar || "") + " " + (i.t?.en || "") + " " + (i.d || ""));
    let n = 0; a.forEach(w => { if (b.has(w)) n++; });
    return { i, sim: a.size ? n / Math.min(a.size, b.size || 1) : 0 };
  }).filter(x => x.sim >= .34).sort((x, y) => y.sim - x.sim).slice(0, 3);
}

export const EVAL = { evaluate, classify, national, similar, words };
export default EVAL;
