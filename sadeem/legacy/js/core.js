/* SADEEM HANGAR · core: state, i18n, router, AI dock, storage */
"use strict";
window.H=(function(){
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- i18n ---------- */
const I18N={
ar:{
 brand:"سديم",hangar:"الهانقر",os:"نظام سديم",enter:"ادخل المنشأة",work:"اذهب إلى العمل",
 z_arrival:"المدخل الوطني",z_vision:"قاعة الرؤية",z_deck:"منصة القيادة",z_bay:"حظيرة المنصات",z_drones:"مختبر الدرونات",z_factory:"مصنع المستقبل",z_lab:"مسار سديم",z_twins:"مختبر التوائم الرقمية",z_missions:"هندسة المهام",z_library:"مكتبة الابتكار",z_radar:"رادار التقنيات",z_galaxy:"الكوكبة الوطنية",z_foresight:"المرصد",z_gate:"قبو الاحتواء",z_os:"نظام سديم",
 palette:"انتقل إلى…",palHint:"اكتب اسم منطقة أو أداة أو فكرة",lang:"English",
 ai:"الطبقة الذكية",aiRole:"الدور",aiSug:"مقترح · يُراجعه إنسان",aiOff:"لا يوجد سياق بعد",
 map:"خريطة المنشأة",tour:"جولة موجّهة",sound:"الصوت المحيط",close:"إغلاق",back:"رجوع",next:"التالي",run:"شغّل",reset:"إعادة",save:"حفظ",apply:"طبّق",cancel:"إلغاء",
 training:"قيم تدريبية توضيحية، ليست مواصفات رسمية",all:"الكل",proposed:"مقترح · بانتظار الاعتماد الرسمي",
 toIdea:"حوّل هذه النتيجة إلى فكرة",
 stage:["التجميع","التصنيف","التنقية","الاحتواء","التنظيم","التقييم الوطني","اختبار جدول الأفكار","التجربة","المتابعة","الإحالة والاعتماد","التوجيه للجهة المختصة"],
 sadeem:"سديم",contained:"محتواة · تحت التوجيه الوطني",
 madeIn:"صُنع في أبوظبي",
 pillars:{VISION:"الرؤية",KNOWLEDGE:"المعرفة",INNOVATION:"الابتكار",AMBITION:"الطموح",ENGINEERING:"الهندسة","HUMAN CAPITAL":"رأس المال البشري",FUTURE:"المستقبل"},
 arSurface:"النص العربي الرسمي يُضاف من الصفحة الرسمية قبل النشر",enSurface:"لا توجد ترجمة رسمية؛ يُعرض الأصل العربي",
 source:"المصدر",verified:"موثّق",
},
en:{
 brand:"SADEEM",hangar:"Hangar",os:"SADEEM OS",enter:"Enter the facility",work:"Go to work",
 z_arrival:"Entry Point",z_vision:"Vision Chamber",z_deck:"Command Deck",z_bay:"Vehicle Bay",z_drones:"Drone Lab",z_factory:"Factory of the Future",z_lab:"Pipeline Hall",z_twins:"Digital Twin Lab",z_missions:"Mission Engineering",z_library:"Innovation Library",z_radar:"Technology Radar",z_galaxy:"National Constellation",z_foresight:"Foresight Telescope",z_gate:"Containment Vault",z_os:"SADEEM OS",
 palette:"Go to…",palHint:"Type a zone, a tool or an idea",lang:"العربية",
 ai:"AI layer",aiRole:"Role",aiSug:"Suggested · a person confirms",aiOff:"No context yet",
 map:"Facility map",tour:"Guided tour",sound:"Ambient sound",close:"Close",back:"Back",next:"Next",run:"Run",reset:"Reset",save:"Save",apply:"Apply",cancel:"Cancel",
 training:"Illustrative training values, not official specifications",all:"All",proposed:"Proposed · pending official approval",
 toIdea:"Turn this result into an idea",
 stage:["Collection","Classification","Filtering","Containment","Organisation","National evaluation","Idea-table test","Experiment","Follow-up","Referral & approval","Routing"],
 sadeem:"SADEEM",contained:"Contained · under national guidance",
 madeIn:"Made in Abu Dhabi",
 pillars:{VISION:"VISION",KNOWLEDGE:"KNOWLEDGE",INNOVATION:"INNOVATION",AMBITION:"AMBITION",ENGINEERING:"ENGINEERING","HUMAN CAPITAL":"HUMAN CAPITAL",FUTURE:"FUTURE"},
 arSurface:"Official Arabic text is added from the official page before publication",enSurface:"No official translation; the Arabic original is shown",
 source:"Source",verified:"Verified",
}};
let L="ar";try{L=localStorage.getItem("sadeem_lang")||"ar"}catch(e){}
const t=k=>{const v=I18N[L][k];return v==null?(I18N.en[k]??k):v};
const tx=o=>o==null?"":(typeof o==="string"?o:(o[L]??o.en??""));
const num=n=>L==="ar"?String(n).replace(/\d/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]):String(n);

/* ---------- storage ---------- */
const KEY="sadeem_hangar_v1";
let DB={ideas:[],gate:[],drones:[],quotesOverride:null,seen:{},moves:{}};
try{const s=localStorage.getItem(KEY);if(s)DB=Object.assign(DB,JSON.parse(s))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){}};
const uid=()=>Math.random().toString(36).slice(2,8).toUpperCase();

/* ---------- sample records (marked as examples) ---------- */
const SAMPLE_IDEAS=[
 {id:"SD-1041",t:{ar:"تبريد ذاتي التنظيف للمركبات في البيئة الصحراوية",en:"Self-cleaning cooling for vehicles in desert conditions"},st:9,area:"land",src:"industry",owner:{ar:"شركة صناعية وطنية",en:"National industrial company"},days:34,sample:1,ch:"N-01",score:81},
 {id:"SD-1058",t:{ar:"كشف عيوب اللحام بالرؤية الحاسوبية",en:"Computer-vision weld-defect detection"},st:7,area:"mfg",src:"research",owner:{ar:"مختبر بحثي وطني",en:"National research lab"},days:64,sample:1,ch:"N-03",score:74},
 {id:"SD-1066",t:{ar:"درون طويل التحمل محكم ضد الغبار",en:"Dust-sealed long-endurance drone"},st:6,area:"air",src:"talent",owner:{ar:"موهبة وطنية",en:"National talent"},days:31,sample:1,ch:"N-02",score:77},
 {id:"SD-1071",t:{ar:"قطع غيار حرجة بالتصنيع الإضافي المعدني",en:"Critical spares by metal additive manufacturing"},st:10,area:"mfg",src:"industry",owner:{ar:"شركة صناعية وطنية",en:"National industrial company"},days:12,sample:1,ch:"N-03",score:86,entity:{ar:"جهة صناعية سيادية",en:"Sovereign industrial entity"}},
 {id:"SD-1077",t:{ar:"توأم رقمي لمنظومات التبريد في الأسطول",en:"Digital twin of fleet cooling systems"},st:5,area:"land",src:"academic",owner:{ar:"جامعة وطنية",en:"National university"},days:40,sample:1,ch:"N-04",score:69},
 {id:"SD-1080",t:{ar:"ملاحة بصرية عند فقدان إشارة GNSS",en:"Visual navigation under GNSS denial"},st:3,area:"air",src:"startup",owner:{ar:"شركة ناشئة وطنية",en:"National start-up"},days:12,sample:1,ch:"N-02",sens:"high"},
 {id:"SD-1083",t:{ar:"تدريب الفنيين بالواقع المعزز",en:"AR training for technicians"},st:2,area:"mfg",src:"academic",owner:{ar:"جامعة وطنية",en:"National university"},days:9,sample:1,ch:""},
 {id:"SD-1085",t:{ar:"مؤشر انسداد فلتر الهواء",en:"Air-filter clogging indicator"},st:1,area:"land",src:"talent",owner:{ar:"موهبة وطنية",en:"National talent"},days:4,sample:1,ch:"N-01"},
 {id:"SD-1086",t:{ar:"جدولة ذكية للصيانة التنبؤية",en:"Smart predictive-maintenance scheduling"},st:0,area:"mfg",src:"industry",owner:{ar:"شركة صناعية وطنية",en:"National industrial company"},days:2,sample:1,ch:"N-03"},
 {id:"SD-1087",t:{ar:"لوحة حماية مركّبة أخف وزناً",en:"Lighter composite protection panel"},st:4,area:"land",src:"research",owner:{ar:"مختبر بحثي وطني",en:"National research lab"},days:22,sample:1,ch:"",sens:"controlled"},
 {id:"SD-1090",t:{ar:"اتصالات شبكية مرنة للدرونات",en:"Resilient mesh comms for drones"},st:8,area:"cyber",src:"startup",owner:{ar:"شركة ناشئة وطنية",en:"National start-up"},days:71,sample:1,ch:"N-02",score:72},
 {id:"SD-1092",t:{ar:"تشفير خفيف لبيانات المستشعرات الطرفية",en:"Lightweight encryption for edge sensor data"},st:6,area:"cyber",src:"research",owner:{ar:"مختبر بحثي وطني",en:"National research lab"},days:66,sample:1,ch:"N-04",score:70,sens:"high"},
];
const SOURCES={research:{ar:"مختبرات بحثية",en:"Research labs"},academic:{ar:"جامعات",en:"Universities"},industry:{ar:"شركات صناعية",en:"Industrial companies"},startup:{ar:"شركات ناشئة",en:"Start-ups"},talent:{ar:"مواهب وطنية",en:"National talent"}};
const DOMAINS={land:{ar:"الأنظمة البرية",en:"Land systems"},air:{ar:"الجو والفضاء",en:"Air & space"},cyber:{ar:"السيبراني والإلكترونيات",en:"Cyber & electronics"},mfg:{ar:"التصنيع المتقدم",en:"Advanced manufacturing"}};
const ENTITIES=[{k:"sov",ar:"جهة سيادية",en:"Sovereign entity"},{k:"ind",ar:"جهة صناعية سيادية",en:"Sovereign industrial entity"},{k:"res",ar:"جهة بحثية وطنية",en:"National research entity"},{k:"acad",ar:"جهة أكاديمية وطنية",en:"National academic entity"}];
const CHALLENGES=[
 {id:"N-01",t:{ar:"تشغيل الأنظمة البرية عند 50°م",en:"Land systems operating at 50 °C"},d:{ar:"كيف نحافظ على أداء التبريد في الغبار والحرارة دون زيادة الوزن؟",en:"How do we keep cooling performance in dust and heat without adding mass?"},sponsor:{ar:"جهة سيادية",en:"Sovereign entity"},due:18,reward:0},
 {id:"N-02",t:{ar:"مراقبة جوية مستمرة في العواصف",en:"Continuous aerial watch through storms"},d:{ar:"زمن تحليق طويل مع مقاومة الرياح والغبار وملاحة دون GNSS.",en:"Long endurance with wind and dust tolerance and GNSS-denied navigation."},sponsor:{ar:"جهة سيادية",en:"Sovereign entity"},due:33,reward:0},
 {id:"N-03",t:{ar:"سلاسل إمداد صناعية مكتفية ذاتياً",en:"Self-sufficient industrial supply chains"},d:{ar:"خفض الاعتماد على القطع المستوردة النادرة والتوقفات غير المخططة.",en:"Reduce dependence on rare imported parts and unplanned downtime."},sponsor:{ar:"جهة صناعية سيادية",en:"Sovereign industrial entity"},due:47,reward:0},
 {id:"N-05",t:{ar:"الطاقة والدفع المستدام للمنصات",en:"Sustainable power and propulsion for platforms"},d:{ar:"احتياج معلن لا تتجه إليه أي فكرة بعد — فراغ قدرة قائم.",en:"A declared need with no ideas heading toward it yet — a standing capability void."},sponsor:{ar:"جهة سيادية",en:"Sovereign entity"},due:90,reward:0},
 {id:"N-04",t:{ar:"بيانات الميدان إلى قرار خلال ساعات",en:"Field data to decision in hours"},d:{ar:"كيف تصل بيانات المنظومات إلى المهندسين بأمان خلال ساعات لا أسابيع؟",en:"How does system data reach engineers securely in hours, not weeks?"},sponsor:{ar:"جهة بحثية وطنية",en:"National research entity"},due:60,reward:0},
];
const allIdeas=()=>[...DB.ideas,...SAMPLE_IDEAS];

/* ---------- context + events ---------- */
const ctx={zone:"arrival",object:null,state:null};
const bus={};
const on=(k,f)=>{(bus[k]=bus[k]||[]).push(f)},emit=(k,d)=>{(bus[k]||[]).forEach(f=>f(d))};

/* ---------- zones + router ---------- */
const ZONES=["arrival","vision","deck","bay","drones","factory","lab","twins","missions","library","radar","galaxy","foresight","gate","os"];
const zones={};
let cur=null;
function register(id,z){zones[id]=z}
async function go(id){if(!ZONES.includes(id))id="arrival";if(location.hash!=="#"+id){history.pushState(null,"","#"+id)}if(window.FX&&cur&&cur!==id){FX.wipe(()=>show(id))}else{await show(id)}}
async function show(id){
  const z=zones[id];if(!z)return;
  if(cur&&cur!==id&&zones[cur].unmount)zones[cur].unmount();
  cur=id;ctx.zone=id;ctx.object=null;const inc=ctx.state||{};ctx.state=["draft","openIdea","openCh","osView","stage","gateIdea"].some(k=>inc[k]!==undefined)?inc:null;
  document.body.dataset.zone=id;
  const stage=$("#stage");stage.innerHTML="";
  const el=document.createElement("section");el.className="zone z-"+id;el.id="zone-"+id;stage.appendChild(el);
  $$("#dock [data-go]").forEach(a=>a.setAttribute("aria-current",a.dataset.go===id?"page":"false"));
  try{await z.mount(el);ctx.intentDone=1}catch(e){console.error(e);el.innerHTML=`<div class="wrap"><p class="err">${esc(e.message)}</p></div>`}
  ai.refresh();window.scrollTo(0,0);
  try{window.FX&&(FX.reveal(el),FX.count(el))}catch(e){}
}
addEventListener("hashchange",()=>show(location.hash.slice(1)||"arrival"));

/* ---------- AI layer ---------- */
const ai={
  refresh(){const z=zones[cur];const box=$("#aiBody"),role=$("#aiRole");if(!box)return;
    let r=null;try{r=z&&z.insight?z.insight(ctx):null}catch(e){console.error(e)}
    if(!r){role.textContent="—";box.innerHTML=`<p class="mute">${esc(t("aiOff"))}</p>`;return}
    role.textContent=tx(r.role);
    box.innerHTML=(r.lines||[]).map(l=>`<p>${esc(tx(l))}</p>`).join("")+
      ((r.actions||[]).length?`<div class="aiActs">${r.actions.map((a,i)=>`<button class="chip" data-ai="${i}">${esc(tx(a.label))}</button>`).join("")}</div>`:"");
    $$("[data-ai]",box).forEach(b=>b.onclick=()=>{const a=r.actions[+b.dataset.ai];a.run&&a.run()});
  },
  set(o){Object.assign(ctx,o);ai.refresh()}
};

/* ---------- ideas ---------- */
function addIdea(o){const id="SD-"+(2000+DB.ideas.length+1);const it=Object.assign({id,st:0,days:0,area:"land",src:"talent",owner:{ar:"أنت",en:"You"},ch:"",mine:1,created:Date.now()},o);DB.ideas.unshift(it);save();emit("ideas");return it}
function openAI(){const d=$("#aiDock");if(!d)return;d.classList.add("on");document.body.classList.add("aiOpen");$("#aiBtn").setAttribute("aria-expanded","true")}
function toast(msg){const el=$("#toast");el.textContent=tx(msg);el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2600)}

/* ---------- language ---------- */
function setLang(l){L=l;try{localStorage.setItem("sadeem_lang",l)}catch(e){}document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";chrome();show(cur||"arrival")}

/* ---------- chrome ---------- */
function chrome(){
  const dock=$("#dock");
  const items=[["arrival","01"],["vision","VC"],["deck","02"],["lab","03"],["gate","04"],["bay","L1"],["drones","L2"],["factory","L3"],["twins","L4"],["missions","L5"],["library","06"],["radar","07"],["galaxy","✦"],["foresight","◎"]];
  dock.innerHTML=`<div class="dockIn">
    <a class="wm" href="#arrival" data-go="arrival"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1 L18.2 13.8 L31 16 L18.2 18.2 L16 31 L13.8 18.2 L1 16 L13.8 13.8 Z" fill="currentColor"/><path d="M26 3l.8 3.2L30 7l-3.2.8L26 11l-.8-3.2L22 7l3.2-.8z" fill="currentColor" opacity=".6"/></svg><b>${esc(t("brand"))}</b><span>${esc(t("hangar"))}</span></a>
    <nav class="dz" aria-label="${esc(t("map"))}">${items.map(([id,n])=>`<a href="#${id}" data-go="${id}"><i>${n}</i><span>${esc(t("z_"+id))}</span></a>`).join("")}</nav>
    <div class="dr">
      <button class="pal" id="palBtn" type="button"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M14 14l4 4" stroke="currentColor" stroke-width="1.5"/></svg><span>${esc(t("palette"))}</span><kbd>⌘K</kbd></button>
      <button class="ic" id="mapBtn" type="button" title="${esc(t("map"))}" aria-label="${esc(t("map"))}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5.5 7.5 3 12.5 5.5 17 3v11.5L12.5 17 7.5 14.5 3 17z M7.5 3v11.5 M12.5 5.5V17" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></button>
      <button class="ic" id="tourBtn" type="button" title="${esc(t("tour"))}" aria-label="${esc(t("tour"))}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z M10 4v6l4 2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>
      <button class="ic" id="soundBtn" type="button" title="${esc(t("sound"))}" aria-label="${esc(t("sound"))}" aria-pressed="false"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8v4h3l4 3V5L7 8Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path class="sndWave" d="M13.5 7.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button><a class="osBtn" href="#os" data-go="os">${esc(t("os"))}</a>
      <button class="lg" id="lgBtn" type="button">${esc(t("lang"))}</button>
      <button class="aiBtn" id="aiBtn" type="button" aria-expanded="false" aria-controls="aiDock"><i></i>${esc(t("ai"))}</button>
    </div></div>`;
  $("#lgBtn").onclick=()=>setLang(L==="ar"?"en":"ar");
  $("#palBtn").onclick=openPalette;
  $("#mapBtn").onclick=()=>window.FX&&FX.map();
  $("#tourBtn").onclick=()=>window.FX&&FX.tour(0);
  $("#soundBtn").onclick=()=>{const on=window.FX&&FX.ambient(!$("#soundBtn").matches('[aria-pressed="true"]'));$("#soundBtn").setAttribute("aria-pressed",on?"true":"false")};
  $("#aiBtn").onclick=()=>{const d=$("#aiDock");const o=d.classList.toggle("on");document.body.classList.toggle("aiOpen",o);$("#aiBtn").setAttribute("aria-expanded",o)};
  $("#aiHead b").textContent=t("ai");$("#aiSug").textContent=t("aiSug");$("#aiRoleL").textContent=t("aiRole");
  $("#aiX").onclick=()=>{$("#aiDock").classList.remove("on");document.body.classList.remove("aiOpen");$("#aiBtn").setAttribute("aria-expanded","false")};
}
function openPalette(){
  const p=$("#palette");p.hidden=false;const inp=$("#palIn");inp.value="";inp.placeholder=t("palHint");inp.focus();renderPal("");
}
function renderPal(q){
  q=q.trim().toLowerCase();const list=$("#palList");
  const entries=[...ZONES.map(z=>({k:z,l:t("z_"+z),go:()=>go(z)})),
    ...allIdeas().map(i=>({k:i.id,l:i.id+" · "+tx(i.t),go:()=>{ctx.state={openIdea:i.id};go("lab")}})),
    ...CHALLENGES.map(c=>({k:c.id,l:c.id+" · "+tx(c.t),go:()=>{ctx.state={openCh:c.id};go("lab")}}))];
  const f=entries.filter(e=>!q||e.l.toLowerCase().includes(q)||e.k.toLowerCase().includes(q)).slice(0,12);
  list.innerHTML=f.map((e,i)=>`<button type="button" data-i="${i}"><span>${esc(e.l)}</span><kbd>${esc(e.k)}</kbd></button>`).join("")||`<p class="mute">—</p>`;
  $$("button",list).forEach(b=>b.onclick=()=>{$("#palette").hidden=true;f[+b.dataset.i].go()});
}
function initChrome(){
  document.documentElement.lang=L;document.documentElement.dir=L==="ar"?"rtl":"ltr";
  chrome();
  $("#palIn").oninput=e=>renderPal(e.target.value);
  $("#palette").onclick=e=>{if(e.target.id==="palette")e.target.hidden=true};
  addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openPalette()}if(e.key==="Escape"){$("#palette").hidden=true}});
}

/* ---------- content loading ---------- */
const content={};
async function loadJSON(name){if(content[name])return content[name];try{const r=await fetch("content/"+name+".json");content[name]=await r.json()}catch(e){content[name]={items:[]}}return content[name]}
function quotes(){const q=content.quotes?content.quotes.items:[];if(DB.quotesOverride){return q.map(x=>Object.assign({},x,DB.quotesOverride[x.id]||{}))}return q}

/* ---------- helpers for zones ---------- */
function svgEl(n,a){const e=document.createElementNS("http://www.w3.org/2000/svg",n);for(const k in a)e.setAttribute(k,a[k]);return e}
function head(el,kicker,title,lead){el.insertAdjacentHTML("beforeend",`<header class="zh wrap"><span class="kk">${esc(tx(kicker))}</span><h1>${esc(tx(title))}</h1>${lead?`<p class="lead">${esc(tx(lead))}</p>`:""}</header>`)}

async function boot(){
  initChrome();
  await Promise.all([loadJSON("quotes"),loadJSON("radar"),loadJSON("library")]);
  const id=location.hash.slice(1)||"arrival";
  await show(zones[id]?id:"arrival");
  document.body.classList.add("ready");
}
return {$,$$,esc,RM,t,tx,num,get L(){return L},DB,save,uid,SAMPLE_IDEAS,CHALLENGES,SOURCES,DOMAINS,ENTITIES,allIdeas,addIdea,ctx,on,emit,register,go,ai,openAI,toast,setLang,loadJSON,content,quotes,svgEl,head,boot,ZONES};
})();
