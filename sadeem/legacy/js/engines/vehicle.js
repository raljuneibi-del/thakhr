/* SADEEM HANGAR · Vehicle Bay engine (pure): platform catalogue, configuration scoring, mission fit.
   Extended from the previous Hangar Studio model. Illustrative training values. */
window.VEH=(function(){
const A=(ar,en)=>({ar,en});
const DIMS=[{k:"range",n:A("المدى","Range")},{k:"speed",n:A("السرعة والحركة","Speed & mobility")},{k:"protection",n:A("الحماية","Protection")},{k:"thermal",n:A("التحمل الحراري","Thermal endurance")},{k:"autonomy",n:A("الوعي والاستقلالية","Awareness & autonomy")},{k:"cost",n:A("التكلفة","Cost"),inv:1}];
const SLOTS=[
 {k:"chassis",n:A("الهيكل","Chassis"),o:[
  {k:"4x4",n:A("٤×٤ خفيف","4×4 light"),fx:{speed:12,range:6,protection:-10,cost:-15},d:A("رشيق وأسرع، مساحة وحماية أقل","Agile and faster, less room and protection")},
  {k:"6x6",n:A("٦×٦ متوازن","6×6 balanced"),fx:{},d:A("توازن بين الحمل والحركة","Balance of load and mobility")},
  {k:"8x8",n:A("٨×٨ ثقيل","8×8 heavy"),fx:{protection:12,speed:-6,range:-5,cost:15},d:A("ثبات وحماية وقدرة حمل أعلى","Stability, protection, more capacity")}]},
 {k:"power",n:A("منظومة الدفع","Powertrain"),o:[
  {k:"diesel",n:A("ديزل","Diesel"),fx:{},d:A("موثوق وسهل الإمداد","Reliable, easy to supply")},
  {k:"hybrid",n:A("هجين","Hybrid"),fx:{range:16,thermal:-4,autonomy:5,cost:10},d:A("مدى أطول وتشغيل صامت عند التوقف","Longer range, silent watch when parked")},
  {k:"electric",n:A("كهربائي","Electric"),fx:{range:-22,speed:6,thermal:-14,cost:14},d:A("عزم فوري وبصمة أقل، مدى أقصر","Instant torque, lower signature, shorter range")}]},
 {k:"armour",n:A("الحماية","Protection"),o:[
  {k:"light",n:A("خفيفة","Light"),fx:{protection:-20,speed:10,range:6},d:A("أخف وأسرع","Lighter and faster")},
  {k:"medium",n:A("متوسطة","Medium"),fx:{},d:A("المعيار المتوازن","The balanced standard")},
  {k:"heavy",n:A("ثقيلة معيارية","Heavy modular"),fx:{protection:24,speed:-10,range:-9,thermal:-5,cost:10},d:A("ألواح قابلة للتبديل","Swappable panels")},
  {k:"aps",n:A("حماية نشطة","Active protection"),fx:{protection:32,cost:22,thermal:-4,autonomy:6},d:A("تكشف التهديد وتعترضه","Detects and intercepts threats")}]},
 {k:"mission",n:A("وحدة المهمة","Mission module"),o:[
  {k:"cargo",n:A("نقل وإمداد","Cargo"),fx:{cost:-5},d:A("مساحة حمولة مرنة","Flexible load space")},
  {k:"mast",n:A("صاري استشعار","Sensor mast"),fx:{autonomy:10,cost:6},d:A("رؤية فوق العوائق","View above obstacles")},
  {k:"turret",n:A("برج عن بُعد","Remote turret"),fx:{protection:6,cost:15,thermal:-4},d:A("تسليح دون تعريض الطاقم","Armed without exposing the crew")},
  {k:"medic",n:A("إخلاء طبي","Medevac"),fx:{cost:4,range:-2},d:A("وحدة إسعاف ميداني","Field ambulance")}]},
 {k:"cooling",n:A("التبريد","Cooling"),o:[
  {k:"std",n:A("قياسي","Standard"),fx:{},d:A("للظروف المعتدلة","For moderate conditions")},
  {k:"enh",n:A("مُعزَّز","Enhanced"),fx:{thermal:16,range:-3,cost:5},d:A("مراوح وقلب مشعاع إضافي","Extra fans and radiator core")},
  {k:"graphene",n:A("زعانف جرافين","Graphene fins"),fx:{thermal:26,cost:12},d:A("طرد حرارة أعلى بوزن أقل","More heat rejection, less mass")}]},
 {k:"ai",n:A("الذكاء والتحكم","Intelligence"),o:[
  {k:"manual",n:A("يدوي","Manual"),fx:{},d:A("الطاقم يتحكم بكل شيء","The crew controls everything")},
  {k:"assist",n:A("مساعد القيادة","Driver assist"),fx:{autonomy:16,cost:5},d:A("رؤية ٣٦٠° وتنبيهات","360° view and alerts")},
  {k:"convoy",n:A("قافلة ذاتية","Autonomous convoy"),fx:{autonomy:36,cost:15,thermal:-3},d:A("تتبع المركبة القائدة","Follows the lead vehicle")}]}];
const PLATFORMS=[
 {k:"lv8",n:"REF-8×8",sub:A("منصة برية مرجعية مدرعة ٨×٨","Reference 8×8 armoured land platform"),def:{chassis:"8x8",power:"diesel",armour:"heavy",mission:"turret",cooling:"enh",ai:"assist"},model:"vehicle",base:{range:52,speed:50,protection:64,thermal:56,autonomy:48,cost:60}},
 {k:"tv4",n:"REF-4×4",sub:A("منصة برية تكتيكية مرجعية ٤×٤","Reference 4×4 tactical land platform"),def:{chassis:"4x4",power:"diesel",armour:"medium",mission:"cargo",cooling:"std",ai:"manual"},model:"vehicle",base:{range:58,speed:62,protection:48,thermal:50,autonomy:40,cost:44}},
 {k:"isr",n:"REF-ISR",sub:A("منصة جوية مرجعية للاستطلاع","Reference light ISR aircraft"),def:{chassis:"6x6",power:"diesel",armour:"light",mission:"mast",cooling:"std",ai:"assist"},model:"aircraft",base:{range:66,speed:70,protection:38,thermal:52,autonomy:58,cost:55}},
];
const MISSIONS=[
 {k:"bp",n:A("دورية حدودية في ٥٠°م","Border patrol at 50 °C"),req:{thermal:62,range:55,protection:50},d:A("٨ ساعات تحت الشمس على رمال ناعمة","8 hours in the sun on soft sand")},
 {k:"rc",n:A("قافلة إغاثة ٤٠٠ كم","Relief convoy, 400 km"),req:{range:72,autonomy:58,cost:58},d:A("إيصال مساعدات عبر طرق طويلة","Delivering aid across long routes")},
 {k:"fp",n:A("حماية منشأة حيوية","Critical site protection"),req:{protection:72,autonomy:55,thermal:50},d:A("تمركز طويل وجاهزية دائمة","Long deployment, always ready")}];
const opt=(s,k)=>SLOTS.find(x=>x.k===s).o.find(o=>o.k===k);
function score(p,cfg){const v=Object.assign({},p.base);for(const s of SLOTS){const o=opt(s.k,cfg[s.k]||p.def[s.k]);for(const k in o.fx)v[k]=(v[k]||0)+o.fx[k]}for(const k in v)v[k]=Math.max(5,Math.min(100,Math.round(v[k])));return v}
function fit(v,m){const f=[];for(const k in m.req){const need=m.req[k];const have=k==="cost"?100-v.cost:v[k];f.push({k,need,have,pass:have>=need})}return {f,score:Math.round(f.filter(x=>x.pass).length/f.length*100)}}
function cfgToModel(p,cfg){ // maps to the procedural model's cfg keys
  if(p.model==="aircraft")return {structure:cfg.armour==="light"?"carbon":"alu",engine:cfg.power==="electric"?"el":"tp",wing:cfg.chassis==="8x8"?"le":cfg.mission==="turret"?"strike":"std",avionics:cfg.ai==="manual"?"basic":"aico",pods:cfg.mission==="turret"?4:cfg.mission==="cargo"?0:2,sensors:cfg.mission==="mast"?"ball":"none"};
  return {chassis:cfg.chassis,power:cfg.power,armour:cfg.armour,mission:cfg.mission,cooling:cfg.cooling,ai:cfg.ai};
}
return {DIMS,SLOTS,PLATFORMS,MISSIONS,opt,score,fit,cfgToModel};
})();
