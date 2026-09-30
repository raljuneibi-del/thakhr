/* SADEEM Hangar · Drone Lab engine (pure, no DOM). First-order mass, power and endurance relations.
   All figures are illustrative training values, not specifications.
   Ported 1:1 from legacy `window.DRONE` — same members, same signatures, same numbers. */

export type Bi = { ar: string; en: string };
const A = (ar: string, en: string): Bi => ({ ar, en });

export type GroupKey =
  | "airframe" | "wings" | "propulsion" | "energy" | "sensors"
  | "cameras" | "comms" | "payload" | "materials" | "autonomy";

/** One selectable option inside a parameter group. Every numeric field is optional; absent means "no effect". */
export interface DroneOption {
  k: string; n: Bi; d: Bi;
  m?: number;       // kg added
  mf?: number;      // structural mass factor (materials)
  drag?: number; lift?: number; wind?: number; cost?: number; maint?: number; cruise?: number;
  eff?: number; thrust?: number; noise?: number;   // propulsion
  wh?: number;                                     // energy
  w?: number;                                      // avionics draw, W
  auto?: number;                                   // autonomy contribution
  range?: number;                                  // comms, km
}
export interface DroneGroup { k: GroupKey; n: Bi; o: DroneOption[]; onlyVtol?: number }
export type DroneConfig = Record<GroupKey, string>;

export interface MissionReq { end?: number; wind?: number; range?: number; night?: number; payload?: number; rangeKm?: number; lidar?: number; auto?: number; relay?: number }
export interface Mission { k: string; n: Bi; req: MissionReq; d: Bi }

export interface DroneResult {
  o: Record<GroupKey, DroneOption>;
  mass: number; dry: number; batt: number; pay: number;
  margin: number; maxMass: number; power: number; end: number; speed: number; rangeKm: number;
  wind: number; auto: number; cost: number; maint: number; noise: number; commsKm: number; vt: boolean;
}
export interface FitItem { k: string; pass: boolean; ar: string; en: string }
export interface FitResult { f: FitItem[]; pass: number; total: number; score: number }
export interface Binding extends Bi { k?: string }

const G: DroneGroup[] = [
 { k: "airframe", n: A("الهيكل", "Airframe"), o: [
  { k: "quad", n: A("رباعي", "Quad"), m: 1.1, drag: 1.0, lift: 1.0, wind: .55, cost: 6, maint: .9, d: A("بسيط، أخف، أسهل صيانة", "Simple, light, easy to maintain") },
  { k: "hexa", n: A("سداسي", "Hexa"), m: 1.7, drag: 1.15, lift: 1.3, wind: .75, cost: 9, maint: .8, d: A("حمولة أثقل واستقرار أعلى", "Heavier payload, more stability") },
  { k: "vtol", n: A("جناح ثابت VTOL", "Fixed-wing VTOL"), m: 2.6, drag: .45, lift: 2.2, wind: .7, cost: 16, cruise: 1, maint: .6, d: A("يطير كطائرة ويهبط كدرون", "Flies like a plane, lands like a drone") }] },
 { k: "wings", n: A("الأجنحة", "Wings"), onlyVtol: 1, o: [
  { k: "std", n: A("قياسية", "Standard"), m: 0, drag: 1, lift: 1, d: A("نسبة أبعاد متوازنة", "Balanced aspect ratio") },
  { k: "long", n: A("عالية النسبة", "High aspect"), m: .3, drag: .85, lift: 1.15, wind: -.08, cost: 2, d: A("مدى أطول، حساسية أعلى للرياح", "Longer range, more wind-sensitive") },
  { k: "delta", n: A("دلتا", "Delta"), m: .2, drag: 1.1, lift: .9, wind: .1, cost: 1, d: A("أسرع، أقل كفاءة", "Faster, less efficient") }] },
 { k: "propulsion", n: A("الدفع", "Propulsion"), o: [
  { k: "std", n: A("محركات قياسية", "Standard motors"), m: .6, eff: .72, thrust: 1, cost: 3, noise: 1, d: A("أداء متوازن", "Balanced performance") },
  { k: "eff", n: A("عالية الكفاءة", "High efficiency"), m: .7, eff: .84, thrust: 1, cost: 5, noise: 1, d: A("دقائق طيران أكثر لكل شحنة", "More minutes per charge") },
  { k: "quiet", n: A("منخفضة الضوضاء", "Low noise"), m: .75, eff: .7, thrust: .95, cost: 6, noise: .55, d: A("بصمة صوتية أقل", "Quieter signature") },
  { k: "hp", n: A("عالية العزم", "High thrust"), m: .95, eff: .66, thrust: 1.35, cost: 6, noise: 1.2, d: A("تحمل حمولة أثقل ورياحاً أقوى", "Carries more, fights wind") }] },
 { k: "energy", n: A("الطاقة", "Energy"), o: [
  { k: "ls", n: A("بطارية 200 Wh", "200 Wh battery"), m: 1.0, wh: 200, cost: 2, d: A("أخف، زمن أقصر", "Lighter, shorter flight") },
  { k: "ll", n: A("بطارية 400 Wh", "400 Wh battery"), m: 2.0, wh: 400, cost: 4, d: A("زمن أطول، حمولة أقل", "Longer flight, less payload") },
  { k: "xl", n: A("بطارية 700 Wh", "700 Wh battery"), m: 3.6, wh: 700, cost: 7, d: A("تحليق طويل، وزن كبير", "Long flight, heavy") },
  { k: "h2", n: A("خلية وقود 1.4 kWh", "1.4 kWh fuel cell"), m: 3.2, wh: 1400, cost: 18, maint: .7, d: A("ساعات متواصلة، سلسلة إمداد جديدة", "Hours aloft, a new supply chain") }] },
 { k: "sensors", n: A("المستشعرات", "Sensors"), o: [
  { k: "basic", n: A("أساسية", "Basic"), m: .08, w: 2, cost: 1, d: A("IMU وGNSS", "IMU and GNSS") },
  { k: "nav", n: A("ملاحة بلا GNSS", "GNSS-denied nav"), m: .22, w: 6, cost: 6, auto: .15, d: A("ملاحة بصرية عند فقدان الإشارة", "Visual navigation when signal is lost") },
  { k: "lidar", n: A("ليدار", "LiDAR"), m: .45, w: 14, cost: 9, auto: .1, d: A("خرائط ثلاثية الأبعاد دقيقة", "Precise 3D maps") }] },
 { k: "cameras", n: A("الكاميرات", "Cameras"), o: [
  { k: "eo", n: A("نهارية", "EO"), m: .15, w: 4, cost: 2, d: A("رؤية نهارية", "Day vision") },
  { k: "eoir", n: A("نهارية وحرارية", "EO/IR"), m: .38, w: 9, cost: 8, d: A("ليل ونهار", "Day and night") },
  { k: "gimbal", n: A("رأس مثبَّت 30×", "30× gimbal"), m: .7, w: 16, cost: 14, d: A("تكبير بعيد وتثبيت", "Long zoom, stabilised") }] },
 { k: "comms", n: A("الاتصالات", "Comms"), o: [
  { k: "los", n: A("خط رؤية 10 كم", "10 km line of sight"), m: .1, w: 3, cost: 1, range: 10, d: A("بسيط ومحدود", "Simple and limited") },
  { k: "mesh", n: A("شبكة مترابطة 25 كم", "25 km mesh"), m: .25, w: 8, cost: 5, range: 25, d: A("يمر عبر درونات أخرى", "Relays through other drones") },
  { k: "sat", n: A("قمر صناعي", "Satcom"), m: .6, w: 22, cost: 16, range: 400, d: A("بلا حدود تقريباً، ثقيل", "Near unlimited, heavy") }] },
 { k: "payload", n: A("الحمولة", "Payload"), o: [
  { k: "none", n: A("بلا", "None"), m: 0, w: 0, cost: 0, d: A("استطلاع فقط", "Reconnaissance only") },
  { k: "relay", n: A("مُرحِّل اتصالات", "Comms relay"), m: .6, w: 10, cost: 4, d: A("يمد الشبكة خلف العوائق", "Extends the network") },
  { k: "pod2", n: A("حاوية 2 كجم", "2 kg pod"), m: 2.4, w: 0, cost: 2, drag: .1, d: A("إمدادات طبية صغيرة", "Small medical supplies") },
  { k: "pod5", n: A("حاوية 5 كجم", "5 kg pod"), m: 5.6, w: 0, cost: 3, drag: .2, d: A("قطع غيار وإمدادات", "Spares and supplies") }] },
 { k: "materials", n: A("المواد", "Materials"), o: [
  { k: "al", n: A("ألمنيوم", "Aluminium"), mf: 1.0, cost: 0, maint: 1, wind: 0, d: A("رخيص وقابل للإصلاح", "Cheap and repairable") },
  { k: "cf", n: A("ألياف كربون", "Carbon fibre"), mf: .82, cost: 5, maint: .85, wind: .05, d: A("أخف بـ18%", "18% lighter") },
  { k: "sealed", n: A("كربون محكم ضد الغبار", "Dust-sealed carbon"), mf: .88, cost: 8, maint: .75, wind: .18, d: A("يعيش في العاصفة", "Survives the storm") }] },
 { k: "autonomy", n: A("الاستقلالية", "Autonomy"), o: [
  { k: "manual", n: A("يدوي", "Manual"), w: 0, cost: 0, auto: .2, d: A("طيار عن بُعد دائماً", "Always piloted") },
  { k: "wp", n: A("مسار مبرمج", "Waypoint"), w: 4, cost: 2, auto: .55, d: A("يطير نقاطاً ويعود", "Flies set points and returns") },
  { k: "onboard", n: A("ذكاء على المتن", "On-board AI"), m: .3, w: 18, cost: 9, auto: .85, d: A("يقرر دون شبكة", "Decides without a link") },
  { k: "swarm", n: A("سرب", "Swarm"), m: .35, w: 22, cost: 14, auto: .95, d: A("عدة درونات تتقاسم المهمة", "Several drones share the mission") }] },
];

const MISSIONS: Mission[] = [
 { k: "storm", n: A("مراقبة 4 ساعات في عاصفة شمال", "4-hour watch in a shamal"), req: { end: 240, wind: .7, range: 25, night: 1 }, d: A("الاحتياج الوطني N-02: البقاء فوق ممر الإغاثة أثناء العاصفة.", "National need N-02: stay over the relief corridor through the storm.") },
 { k: "deliver", n: A("توصيل 5 كجم إلى موقع بعيد 30 كم", "Deliver 5 kg to a site 30 km away"), req: { payload: 5, rangeKm: 70, end: 60 }, d: A("إمدادات طبية إلى قرية حدودية.", "Medical supplies to a border village.") },
 { k: "map", n: A("مسح ثلاثي الأبعاد لمنطقة 20 كم²", "3D survey of 20 km²"), req: { lidar: 1, end: 90, auto: .5 }, d: A("خرائط دقيقة لممر جديد.", "Precise maps of a new corridor.") },
 { k: "relay", n: A("مُرحِّل اتصالات 6 ساعات", "6-hour comms relay"), req: { relay: 1, end: 360, wind: .5 }, d: A("شبكة فوق الوادي عندما تسقط الأبراج.", "A network over the wadi when towers fall.") },
];

const DEF: DroneConfig = { airframe: "quad", wings: "std", propulsion: "std", energy: "ll", sensors: "basic", cameras: "eoir", comms: "los", payload: "none", materials: "al", autonomy: "wp" };

const pick = (g: GroupKey, k: string | undefined): DroneOption | undefined => G.find(x => x.k === g)!.o.find(o => o.k === k);

function compute(cfg: Partial<DroneConfig>): DroneResult {
  const o = {} as Record<GroupKey, DroneOption>;
  // an unknown option key (e.g. an old saved configuration) falls back to the default instead of throwing
  for (const g of G) o[g.k] = pick(g.k, cfg[g.k] || DEF[g.k]) || pick(g.k, DEF[g.k])!;
  const vt = o.airframe.k === "vtol";
  const wing: DroneOption = vt ? o.wings : { k: "none", n: A("", ""), d: A("", ""), m: 0, drag: 1, lift: 1, wind: 0 };
  const mf = o.materials.mf!;
  const struct = (o.airframe.m! + wing.m!) * mf;
  const dry = struct + o.propulsion.m! + o.sensors.m! + o.cameras.m! + o.comms.m! + (o.autonomy.m || 0);
  const batt = o.energy.m!, pay = o.payload.m!;
  const mass = +(dry + batt + pay).toFixed(2);                                  // kg
  const lift = o.airframe.lift! * wing.lift! * o.propulsion.thrust!;              // relative lift capacity
  const maxMass = 5.2 * lift;                                                     // kg the frame can lift with margin
  const margin = maxMass - mass;
  const drag = o.airframe.drag! * wing.drag! + (o.payload.drag || 0);
  // hover/cruise power: multirotor ~ 110 W/kg, fixed wing ~ 45 W/kg, scaled by drag and efficiency
  const pkg = (vt ? 48 : 112) * drag / o.propulsion.eff!;
  const avionics = o.sensors.w! + o.cameras.w! + o.comms.w! + o.autonomy.w! + o.payload.w!;
  const power = Math.round(pkg * mass + avionics + 8);                            // W
  const usable = o.energy.wh! * 0.85;
  const end = margin < 0 ? 0 : Math.round(usable / power * 60);                   // minutes
  const speed = vt ? (22 + 8 * o.propulsion.thrust! - 2 * drag) : (14 + 4 * o.propulsion.thrust! - 3 * drag); // m/s cruise
  const rangeKm = +(end * 60 * speed / 1000 / 2).toFixed(0);                      // out-and-back radius
  const wind = Math.min(1, o.airframe.wind! + (wing.wind || 0) + o.materials.wind! + (o.propulsion.thrust! - 1) * .3);
  const auto = Math.min(1, (o.autonomy.auto || 0) + (o.sensors.auto || 0));
  const cost = G.reduce((s, g) => s + (o[g.k].cost || 0) * (g.onlyVtol && !vt ? 0 : 1), 0) * 1000; // AED illustrative
  const maint = +(G.reduce((s, g) => s * (o[g.k].maint || 1), 1)).toFixed(2);
  const noise = o.propulsion.noise!;
  return { o, mass, dry: +dry.toFixed(2), batt, pay, margin: +margin.toFixed(2), maxMass: +maxMass.toFixed(1), power, end, speed: +speed.toFixed(1), rangeKm, wind: +wind.toFixed(2), auto: +auto.toFixed(2), cost, maint, noise, commsKm: o.comms.range!, vt };
}

function fit(r: DroneResult, m: Mission): FitResult {
  const q = m.req, f: FitItem[] = []; const ok = (k: string, pass: boolean, ar: string, en: string) => f.push({ k, pass, ar, en });
  if (q.end) ok("end", r.end >= q.end, `زمن التحليق ${r.end} من ${q.end} دقيقة`, `Endurance ${r.end} of ${q.end} min`);
  if (q.wind) ok("wind", r.wind >= q.wind, `مقاومة الرياح ${Math.round(r.wind * 100)}% من ${Math.round(q.wind * 100)}%`, `Wind tolerance ${Math.round(r.wind * 100)}% of ${Math.round(q.wind * 100)}%`);
  if (q.range) ok("comms", r.commsKm >= q.range, `مدى الاتصال ${r.commsKm} من ${q.range} كم`, `Comms ${r.commsKm} of ${q.range} km`);
  if (q.night) ok("night", r.o.cameras.k !== "eo", `رؤية ليلية`, `Night vision`);
  if (q.payload) ok("payload", r.pay >= q.payload && r.margin >= 0, `حمولة ${r.pay} من ${q.payload} كجم`, `Payload ${r.pay} of ${q.payload} kg`);
  if (q.rangeKm) ok("rangeKm", r.rangeKm * 2 >= q.rangeKm, `مسافة ${r.rangeKm * 2} من ${q.rangeKm} كم ذهاباً وإياباً`, `Distance ${r.rangeKm * 2} of ${q.rangeKm} km round trip`);
  if (q.lidar) ok("lidar", r.o.sensors.k === "lidar", `ليدار على المتن`, `LiDAR on board`);
  if (q.auto) ok("auto", r.auto >= q.auto, `استقلالية ${Math.round(r.auto * 100)}% من ${Math.round(q.auto * 100)}%`, `Autonomy ${Math.round(r.auto * 100)}% of ${Math.round(q.auto * 100)}%`);
  if (q.relay) ok("relay", r.o.payload.k === "relay", `مُرحِّل اتصالات`, `Comms relay`);
  if (r.margin < 0) f.unshift({ k: "lift", pass: false, ar: `الوزن ${r.mass} كجم يتجاوز قدرة الرفع ${r.maxMass} كجم`, en: `Mass ${r.mass} kg exceeds lift capacity ${r.maxMass} kg` });
  const pass = f.filter(x => x.pass).length;
  return { f, pass, total: f.length, score: f.length ? Math.round(pass / f.length * 100) : 0 };
}

const HINT: Record<string, Bi> = {
  lift: { ar: "خفّف الحمولة أو اختر هيكلاً سداسياً/VTOL أو محركات عالية العزم.", en: "Lighten the payload, or move to a hexa/VTOL frame or high-thrust motors." },
  end: { ar: "الطاقة تحكم زمن التحليق: بطارية أكبر أو خلية وقود، أو هيكل VTOL يخفض الاستهلاك.", en: "Energy sets endurance: a larger battery or a fuel cell, or a VTOL frame that cuts draw." },
  wind: { ar: "مواد محكمة وهيكل أثقل ومحركات عالية العزم ترفع مقاومة الرياح.", en: "Sealed materials, a heavier frame and high-thrust motors raise wind tolerance." },
  comms: { ar: "الاتصال يحدّ المدى: شبكة مترابطة أو قمر صناعي.", en: "Comms limit reach: a mesh link or satcom." },
  night: { ar: "كاميرا نهارية فقط: اختر EO/IR.", en: "Day camera only: choose EO/IR." },
  payload: { ar: "اختر حاوية أكبر وتحقق من هامش الرفع.", en: "Choose a larger pod and check the lift margin." },
  rangeKm: { ar: "المسافة = الزمن × السرعة: طاقة أكبر أو VTOL أسرع.", en: "Distance = time × speed: more energy or a faster VTOL." },
  lidar: { ar: "أضف الليدار وراقب الوزن والاستهلاك.", en: "Add LiDAR and watch mass and draw." },
  auto: { ar: "ذكاء على المتن أو ملاحة بلا GNSS.", en: "On-board AI or GNSS-denied navigation." },
  relay: { ar: "اختر حمولة المُرحِّل.", en: "Select the relay payload." },
};

/** The binding constraint: which single requirement is furthest from being met, and which parameter releases it. */
function binding(r: DroneResult, m: Mission): Binding {
  const ft = fit(r, m); const fail = ft.f.find(x => !x.pass);
  if (!fail) return { ar: "كل المتطلبات محققة. الرافعة التالية: التكلفة والصيانة.", en: "All requirements met. Next lever: cost and maintainability." };
  const hint = HINT[fail.k];
  return { ar: `القيد الحاكم: ${fail.ar}. ${hint.ar}`, en: `Binding constraint: ${fail.en}. ${hint.en}`, k: fail.k };
}

export const DRONE = { G, MISSIONS, DEF, compute, fit, binding };
export default DRONE;
