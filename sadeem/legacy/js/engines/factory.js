/* SADEEM HANGAR · Factory of the Future engine (pure). Eight stations, twelve technologies, six metrics.
   Illustrative training values. */
window.FACTORY=(function(){
const A=(ar,en)=>({ar,en});
const STATIONS=[
 {k:"receive",n:A("الاستلام","Receive"),takt:14},{k:"machine",n:A("التشغيل الآلي","Machining"),takt:38},{k:"additive",n:A("التصنيع الإضافي","Additive"),takt:30},
 {k:"inspect",n:A("الفحص","Inspection"),takt:22},{k:"assemble",n:A("التجميع","Assembly"),takt:44},{k:"test",n:A("الاختبار","Test"),takt:26},
 {k:"pack",n:A("التغليف","Pack"),takt:12},{k:"dispatch",n:A("الإرسال","Dispatch"),takt:10}];
const TECH=[
 {k:"robotics",n:A("روبوتات تعاونية","Cobots"),at:["assemble","machine"],fx:{tp:.10,q:.02,inc:-.15,cost:-.04,down:0,capex:1.8},d:A("تجميع ولحام","Assembly and welding")},
 {k:"twins",n:A("توأم رقمي للخط","Line digital twin"),at:["dispatch"],fx:{tp:.05,q:.02,inc:-.05,cost:-.03,down:-.18,capex:1.2},d:A("يرى التوقف قبل حدوثه","Sees the stop before it happens")},
 {k:"am",n:A("قطع غيار بالطباعة","Printed spares"),at:["additive"],fx:{tp:.03,q:0,inc:0,cost:-.06,down:-.12,capex:.9},d:A("قطع نادرة عند الطلب","Rare parts on demand")},
 {k:"vision",n:A("فحص بالرؤية الحاسوبية","AI visual inspection"),at:["inspect"],fx:{tp:.06,q:.06,inc:0,cost:-.02,down:0,capex:.7},d:A("عيوب اللحام في ثوانٍ","Weld defects in seconds")},
 {k:"pdm",n:A("صيانة تنبؤية","Predictive maintenance"),at:["machine","test"],fx:{tp:.04,q:.01,inc:-.05,cost:-.03,down:-.25,capex:.8},d:A("اهتزاز وحرارة على الآلات الحرجة","Vibration and heat on critical machines")},
 {k:"agv",n:A("لوجستيات ذاتية","Autonomous logistics"),at:["receive","pack"],fx:{tp:.07,q:0,inc:-.10,cost:-.03,down:-.02,capex:1.1},d:A("عربات ذاتية بين المحطات","AGVs between stations")},
 {k:"materials",n:A("مواد متقدمة","Advanced materials"),at:["machine"],fx:{tp:0,q:.03,inc:0,cost:.02,down:0,capex:.6},d:A("أخف وأقوى، أغلى قليلاً","Lighter and stronger, slightly dearer")},
 {k:"tooling",n:A("عدد ذكية","Smart tooling"),at:["assemble"],fx:{tp:.04,q:.03,inc:-.06,cost:-.01,down:-.03,capex:.4},d:A("عزم موثّق لكل برغي","Documented torque on every bolt")},
 {k:"iot",n:A("إنترنت الأشياء الصناعي","Industrial IoT"),at:["machine","assemble","test"],fx:{tp:.02,q:.01,inc:-.02,cost:-.01,down:-.08,capex:.5},d:A("كل آلة تتكلم","Every machine reports")},
 {k:"hmc",n:A("تعاون إنسان-آلة","Human-machine collaboration"),at:["assemble","inspect"],fx:{tp:.03,q:.02,inc:-.12,cost:-.01,down:0,capex:.3},d:A("واجهات ومساعدة معززة","Interfaces and AR guidance")},
 {k:"analytics",n:A("تحليلات التصنيع","Manufacturing analytics"),at:["dispatch"],fx:{tp:.04,q:.02,inc:-.03,cost:-.04,down:-.06,capex:.4},d:A("لوحة واحدة للخط","One board for the line")},
 {k:"cv-safety",n:A("سلامة بالرؤية الحاسوبية","Vision safety"),at:["machine","assemble"],fx:{tp:0,q:0,inc:-.30,cost:0,down:0,capex:.5},d:A("توقف قبل الاصطدام","Stops before contact")},
];
const BASE={tp:118,q:91.5,inc:3.2,cost:100,down:14,takt:44}; // units/shift, first-pass %, incidents/1000h, cost index, downtime %, takt min
function compute(on){
  let tp=0,q=0,inc=0,cost=0,down=0,capex=0;const active=TECH.filter(t=>on.has(t.k));
  for(const t of active){tp+=t.fx.tp;q+=t.fx.q;inc+=t.fx.inc;cost+=t.fx.cost;down+=t.fx.down;capex+=t.fx.capex}
  const dim=1-0.12*Math.max(0,active.length-6)/6; // diminishing returns beyond six
  const r={tp:Math.round(BASE.tp*(1+tp*dim)),q:+Math.min(99.4,BASE.q*(1+q*dim)).toFixed(1),inc:+Math.max(.2,BASE.inc*(1+inc)).toFixed(1),cost:Math.round(BASE.cost*(1+cost*dim)),down:+Math.max(2,BASE.down*(1+down)).toFixed(1),capex:+capex.toFixed(1)};
  r.takt=+(BASE.takt/(1+tp*dim)).toFixed(0);
  return r;
}
function stationEffects(on){const m={};for(const s of STATIONS)m[s.k]=[];for(const t of TECH)if(on.has(t.k))t.at.forEach(a=>m[a].push(t.k));return m}
return {STATIONS,TECH,BASE,compute,stationEffects};
})();
