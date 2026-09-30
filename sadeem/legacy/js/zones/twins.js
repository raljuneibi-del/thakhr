/* SADEEM HANGAR · Zone 07 Digital Twin Lab + Mission Engineering (OPS_CORE) */
(function(){
const {$,$$,esc,t,tx,num,go,register,ai,toast}=H;

/* ---------- cooling twin model (illustrative) ---------- */
const COOL={std:1,enh:1.16,graphene:1.28};
function coolant(amb,load,clog,cool){return amb+load*.62*(1+clog*.95)/COOL[cool]+4}
let tw={amb:45,load:70,clog:20,cool:"std"};
register("twins",{
 mount(el){
  H.head(el,{ar:"مختبر التوائم الرقمية · L4",en:"Digital Twin Lab · L4"},{ar:"غيّر المعامل وشاهد النتيجة في اللحظة نفسها",en:"Change a parameter and see the consequence in the same moment"},{ar:"توأم منظومة التبريد يقرأ الحرارة المحيطة والحمل وحالة الفلتر ويعطي درجة السائل ولحظة خفض القدرة. توأم البيئة يقرأ جبهة العاصفة من محرك المهام نفسه.",en:"The cooling twin reads ambient, load and filter state and returns coolant temperature and the derate moment. The environment twin reads the storm front from the same mission engine."});
  el.insertAdjacentHTML("beforeend",`<div class="wrap grid g2" style="padding-bottom:48px">
   <div class="panel"><h3>${esc(tx({ar:"توأم منظومة التبريد · منصة ٨×٨",en:"Cooling-system twin · 8×8 platform"}))}<small>${esc(t("training"))}</small></h3>
    <svg class="twinChart" id="tc" viewBox="0 0 700 260"></svg>
    <div class="grid g2" style="margin-top:14px;gap:12px">
     <div><div class="field"><label>${esc(tx({ar:"الحرارة المحيطة",en:"Ambient"}))} <b class="n" id="vAmb"></b> °C</label><input type="range" id="amb" min="25" max="55" value="${tw.amb}"></div>
      <div class="field"><label>${esc(tx({ar:"حمل المحرك",en:"Engine load"}))} <b class="n" id="vLoad"></b> %</label><input type="range" id="load" min="20" max="100" value="${tw.load}"></div></div>
     <div><div class="field"><label>${esc(tx({ar:"انسداد الفلتر",en:"Filter clogging"}))} <b class="n" id="vClog"></b> %</label><input type="range" id="clog" min="0" max="100" value="${tw.clog}"></div>
      <div class="field"><label>${esc(tx({ar:"منظومة التبريد",en:"Cooling"}))}</label><div class="seg" id="cool">${["std","enh","graphene"].map(k=>`<button aria-pressed="${tw.cool===k}" data-k="${k}">${esc(tx({std:{ar:"قياسي",en:"Standard"},enh:{ar:"مُعزَّز",en:"Enhanced"},graphene:{ar:"جرافين",en:"Graphene"}}[k]))}</button>`).join("")}</div></div></div></div>
    <div class="metrics" id="twM" style="margin-top:6px"></div>
    <button class="btn ghost sm" id="toIdea" style="margin-top:12px">${esc(t("toIdea"))}</button></div>
   <div style="display:grid;gap:18px;align-content:start"><div class="panel"><h3>${esc(tx({ar:"توأم البيئة · جبهة عاصفة الشمال",en:"Environment twin · shamal front"}))}<small>OPS_CORE</small></h3><div id="storm" class="dims"></div><p class="note" style="margin-top:10px">${esc(tx({ar:"زمن وصول الجبهة إلى كل نقطة، محسوب من محرك المهام نفسه المستخدم في هندسة المهام.",en:"Front arrival at each point, computed by the same engine used in Mission Engineering."}))}</p><a class="btn sm" href="#missions" style="margin-top:12px">${esc(t("z_missions"))}</a></div>
   <div class="panel"><h3>${esc(tx({ar:"قضية المحقق الهندسي",en:"Engineering Detective case"}))}<small>${esc(tx({ar:"على التوأم",en:"on the twin"}))}</small></h3><p style="font-size:13.5px;color:var(--ink2)">${esc(tx({ar:"عادت مركبة من الميدان بخفض قدرة متكرر بعد ساعتين من التشغيل عند 48°م. أعد إنتاج العطل على التوأم: أي مزيج من الحمل والانسداد يعبر حد 105°م خلال أقل من ساعتين؟",en:"A vehicle returned from the field with repeated derating after two hours at 48 °C. Reproduce the failure on the twin: which mix of load and clogging crosses 105 °C in under two hours?"}))}</p><div id="case" style="margin-top:10px"></div></div></div></div>`);
  const upd=()=>{tw.amb=+$("#amb").value;tw.load=+$("#load").value;tw.clog=+$("#clog").value;render()};
  ["amb","load","clog"].forEach(k=>$("#"+k).oninput=upd);
  $$("#cool button").forEach(b=>b.onclick=()=>{tw.cool=b.dataset.k;$$("#cool button").forEach(x=>x.setAttribute("aria-pressed",x===b));render()});
  $("#toIdea").onclick=()=>{const r=calc();H.ctx.state={draft:{t:{ar:"منع خفض القدرة الحراري في الأسطول البري",en:"Prevent thermal derating in the land fleet"},d:tx({ar:`من مختبر التوائم: عند ${tw.amb}°م وحمل ${tw.load}% وانسداد ${tw.clog}% مع تبريد ${tw.cool}، تصل حرارة السائل إلى ${r.peak}°م وتبدأ الحماية بعد ${r.derateAt||"—"} ساعة.`,en:`From the Twin Lab: at ${tw.amb} °C, ${tw.load}% load and ${tw.clog}% clogging with ${tw.cool} cooling, coolant peaks at ${r.peak} °C and derating starts after ${r.derateAt||"—"} h.`}),area:"land",ch:"N-01"}};go("lab")};
  render();
  function calc(){const pts=[];let derateAt=null,peak=0;for(let h=0;h<=8;h+=.25){const load=tw.load*(0.75+0.25*Math.sin(h*1.3));const clog=Math.min(100,tw.clog+h*4);const T=coolant(tw.amb,load,clog/100,tw.cool);pts.push([h,T]);peak=Math.max(peak,T);if(derateAt==null&&T>=105)derateAt=h}return {pts,derateAt,peak:Math.round(peak)}}
  function render(){
    $("#vAmb").textContent=num(tw.amb);$("#vLoad").textContent=num(tw.load);$("#vClog").textContent=num(tw.clog);
    const r=calc();const s=$("#tc");const X=h=>50+h/8*630,Y=T=>230-(T-60)/70*190;
    let g="";[60,80,100,120].forEach(T=>{g+=`<line class="grid" x1="50" y1="${Y(T)}" x2="680" y2="${Y(T)}"/><text x="44" y="${Y(T)+3}" text-anchor="end">${T}°</text>`});
    [0,2,4,6,8].forEach(h=>{g+=`<text x="${X(h)}" y="248" text-anchor="middle">T+${h}h</text>`});
    g+=`<line class="lim" x1="50" y1="${Y(105)}" x2="680" y2="${Y(105)}"/><text x="676" y="${Y(105)-4}" text-anchor="end" fill="var(--crit)">${esc(tx({ar:"حد خفض القدرة 105°",en:"derate limit 105°"}))}</text>`;
    g+=`<polyline class="cur" points="${r.pts.map(([h,T])=>X(h)+","+Y(Math.min(130,T))).join(" ")}"/>`;
    if(r.derateAt!=null)g+=`<circle class="dot" cx="${X(r.derateAt)}" cy="${Y(105)}" r="5" style="fill:var(--crit)"/><text x="${X(r.derateAt)}" y="${Y(105)-12}" text-anchor="middle" fill="var(--crit)">${esc(tx({ar:"خفض القدرة",en:"derate"}))} T+${num(r.derateAt)}h</text>`;
    s.innerHTML=g;
    $("#twM").innerHTML=[[{ar:"ذروة حرارة السائل",en:"Peak coolant"},r.peak+"°C",r.peak>=105?"bad":"ok"],[{ar:"لحظة خفض القدرة",en:"Derate at"},r.derateAt!=null?"T+"+r.derateAt+"h":"—",r.derateAt!=null?"bad":"ok"],[{ar:"هامش الأمان",en:"Safety margin"},Math.max(0,105-r.peak)+"°C",""],[{ar:"معامل التبريد",en:"Cooling factor"},COOL[tw.cool],""]].map(([l,v,c])=>`<div class="metric ${c}"><span>${esc(tx(l))}</span><b>${esc(num(v))}</b></div>`).join("");
    const O=window.OPS_CORE;const pts=[["Base",O.BASE],[tx({ar:"منطقة البحث",en:"Search zone"}),O.ZONE],[tx({ar:"محطة المراقبة",en:"Watch station"}),O.STATION],[tx({ar:"القرية",en:"Village"}),O.VIL]];
    $("#storm").innerHTML=pts.map(([n,p])=>{const h=O.stormArrival(p.x,p.z);return `<div class="dim" style="grid-template-columns:130px 1fr 60px"><span>${esc(n)}</span><div class="bar warn"><i style="width:${Math.min(100,h/6*100)}%"></i></div><b>T+${num(h.toFixed(1))}h</b></div>`}).join("");
    const solved=r.derateAt!=null&&r.derateAt<=2&&tw.amb>=46&&tw.amb<=50;
    $("#case").innerHTML=`<div class="dim" style="grid-template-columns:auto 1fr"><span class="tag ${solved?"good":"warn"}">${solved?"✓":"…"}</span><span style="font-size:13px">${esc(solved?tx({ar:`أُعيد إنتاج العطل: حمل ${tw.load}% وانسداد ${tw.clog}% عند ${tw.amb}°م. السبب الجذري المرجح: انسداد الفلتر بالغبار لا عطل المضخة. الأدلة على التوأم تتفق مع تقرير L02.`,en:`Failure reproduced: ${tw.load}% load and ${tw.clog}% clogging at ${tw.amb} °C. Likely root cause: dust-clogged filter, not the pump. The twin agrees with report L02.`}):tx({ar:"اضبط الحرارة على 48°م وارفع الانسداد حتى يعبر الخط الأحمر قبل T+2h.",en:"Set ambient to 48 °C and raise clogging until the line crosses red before T+2h."}))}</span></div>`;
    ai.set({state:{r,solved}});
  }
 },
 insight(c){const st=c.state||{};const r=st.r;if(!r)return null;
  return {role:{ar:"مساعد المحاكاة",en:"Simulation assistant"},lines:[{ar:`الذروة ${num(r.peak)}°م. ${r.derateAt!=null?`خفض القدرة يبدأ عند T+${num(r.derateAt)}h.`:"لا خفض قدرة خلال ٨ ساعات."} الانسداد يضاعف أثر الحمل، لذا الفلتر أرخص رافعة من المشعاع.`,en:`Peak ${r.peak} °C. ${r.derateAt!=null?`Derating starts at T+${r.derateAt}h.`:"No derating within 8 hours."} Clogging multiplies the load effect, so the filter is a cheaper lever than the radiator.`},{ar:st.solved?"القضية حُلّت على التوأم. حوّلها إلى فكرة مرتبطة بالاحتياج الوطني N-01.":"لحل قضية المحقق: أعد إنتاج العطل قبل T+2h عند 48°م.",en:st.solved?"The case is solved on the twin. Turn it into an idea linked to national need N-01.":"To solve the Detective case: reproduce the failure before T+2h at 48 °C."}],actions:[{label:t("toIdea"),run:()=>$("#toIdea")&&$("#toIdea").click()}]}}
});

/* ---------- MISSION ENGINEERING ---------- */
let plan={assign:{W1:"deliver",M1:"deliver",B1:"watch",D1:"search"},route:"wad"},result=null,tSlider=6;
register("missions",{
 mount(el){
  const O=window.OPS_CORE;
  H.head(el,{ar:"هندسة المهام · L5",en:"Mission Engineering · L5"},{ar:"عاصفة الشمال: خطّط، نفّذ، واكتشف ما ينقص",en:"Shamal Storm: plan, execute, find what is missing"},{ar:"عاصفة تغلق الطرق واحداً بعد الآخر. قرية حدودية تحتاج طنَّين من الإمدادات قبل T+5h، قافلة عالقة يجب إيجادها قبل T+3h، وممر إغاثة يحتاج عيوناً فوقه. ستة أصول، ست ساعات. سيناريو تدريبي غير حقيقي.",en:"A storm closes roads one by one. A border village needs two tonnes of supplies before T+5h, a stranded convoy must be found before T+3h, and a relief corridor needs eyes above it. Six assets, six hours. A training scenario, not real."});
  el.insertAdjacentHTML("beforeend",`<div class="wrap grid g2" style="padding-bottom:48px"><div><svg class="map" id="map" viewBox="0 0 640 420" role="img" aria-label="Mission map"></svg>
    <div class="morph" style="margin-top:8px"><span>T+0</span><input type="range" id="tS" min="0" max="60" value="60" aria-label="time"><span id="tL">T+6h</span></div>
    <div class="evt" id="evt"></div></div>
   <div style="display:grid;gap:14px;align-content:start"><div class="panel"><h3>${esc(tx({ar:"الأسطول والمهام",en:"Fleet and tasks"}))}</h3><div class="assets" id="assets">${O.ASSETS.map(a=>`<div class="asset"><i>${esc(a.code)}</i><span><b>${esc(a.n)}</b><br><small class="mute">${esc(H.L==="ar"?a.ar:a.en)}</small></span><select data-a="${a.id}"><option value="">—</option>${O.TASKS.map(k=>`<option value="${k.k}" ${plan.assign[a.id]===k.k?"selected":""} ${!O.fits(a,k.k)?"disabled":""}>${esc(tx({deliver:{ar:"إيصال الإمدادات",en:"Deliver"},search:{ar:"البحث عن القافلة",en:"Search"},watch:{ar:"مراقبة الممر",en:"Watch"}}[k.k]))}</option>`).join("")}</select></div>`).join("")}</div>
    <div class="field" style="margin-top:12px"><label>${esc(tx({ar:"مسار الإيصال",en:"Delivery route"}))}</label><div class="seg" id="route">${[["hwy",{ar:"الطريق السريع · مكشوف",en:"Highway · exposed"}],["trk",{ar:"مسار الكثبان · رمال",en:"Dune track · sand"}],["wad",{ar:"الوادي · محمي جزئياً",en:"Wadi · partly sheltered"}]].map(([k,l])=>`<button aria-pressed="${plan.route===k}" data-r="${k}">${esc(tx(l))}</button>`).join("")}</div></div>
    <button class="btn brass" id="run">${esc(tx({ar:"نفّذ الخطة",en:"Execute the plan"}))}</button></div>
    <div class="panel" id="res"><h3>${esc(tx({ar:"النتيجة",en:"Result"}))}</h3><p class="mute">${esc(tx({ar:"نفّذ الخطة لترى النتيجة والفجوات.",en:"Execute the plan to see the result and the capability gaps."}))}</p></div></div></div>`);
  $$("#assets select").forEach(s=>s.onchange=()=>{plan.assign[s.dataset.a]=s.value;result=null;draw()});
  $$("#route button").forEach(b=>b.onclick=()=>{plan.route=b.dataset.r;$$("#route button").forEach(x=>x.setAttribute("aria-pressed",x===b));result=null;draw()});
  $("#tS").oninput=e=>{tSlider=+e.target.value/10;$("#tL").textContent="T+"+tSlider.toFixed(1)+"h";draw()};
  $("#run").onclick=()=>{const p={assign:Object.fromEntries(Object.entries(plan.assign).filter(([k,v])=>v)),route:plan.route};result=O.simulate(p);renderRes();draw();ai.set({object:"result",state:result})};
  draw();
  function simAt(t){const p={assign:Object.fromEntries(Object.entries(plan.assign).filter(([k,v])=>v)),route:plan.route};const s=O.createSim(p);while(s.S.t<t&&!s.S.done)s.step(.02);return s.S}
  function draw(){
    const M=v=>320+v*1.9,N=v=>210+v*1.25;const s=$("#map");let g="";
    // storm front at t: line perpendicular to WIND through stormAt(t)
    const st=O.stormAt(tSlider);const w=O.WIND;const px=-w.z,pz=w.x;const c={x:w.x*st,z:w.z*st};
    const a={x:c.x+px*400,z:c.z+pz*400},b={x:c.x-px*400,z:c.z-pz*400};
    g+=`<polygon class="storm" points="${M(a.x)},${N(a.z)} ${M(b.x)},${N(b.z)} ${M(b.x-w.x*600)},${N(b.z-w.z*600)} ${M(a.x-w.x*600)},${N(a.z-w.z*600)}"/>`;
    for(const k of ["hwy","trk","wad","zon"]){const pts=O.PATHS[k];g+=`<polyline class="route ${k} ${k===plan.route?"sel":""}" points="${pts.map(p=>M(p.x)+","+N(p.z)).join(" ")}"/>`}
    const lbl=[[O.BASE,"BASE"],[O.VIL,tx({ar:"القرية",en:"VILLAGE"})],[O.ZONE,tx({ar:"منطقة البحث",en:"SEARCH ZONE"})],[O.STATION,tx({ar:"محطة المراقبة",en:"WATCH"})]];
    lbl.forEach(([p,n])=>{g+=`<circle cx="${M(p.x)}" cy="${N(p.z)}" r="5" fill="var(--ink)"/><text x="${M(p.x)+8}" y="${N(p.z)-6}">${esc(n)}</text>`});
    const S=simAt(tSlider);S.U.forEach(u=>{g+=`<g class="unit ${u.a.type}"><circle cx="${M(u.x)}" cy="${N(u.z)}" r="6" class="unit ${u.a.type}" opacity="${u.st==="down"||u.st==="stuck"?.35:1}"/><text x="${M(u.x)+9}" y="${N(u.z)+4}">${esc(u.a.n)}${u.st!=="go"?" · "+esc(tx({stuck:{ar:"عالق",en:"stuck"},down:{ar:"ساقط",en:"down"},rtb:{ar:"عودة",en:"RTB"},done:{ar:"تم",en:"done"},search:{ar:"يبحث",en:"searching"},station:{ar:"يراقب",en:"on station"}}[u.st]||{ar:u.st,en:u.st})):""}</text></g>`});
    g+=`<text x="12" y="20">${esc(tx({ar:"جبهة العاصفة",en:"STORM FRONT"}))} · T+${num(tSlider.toFixed(1))}h</text><text x="12" y="408" class="sm">${esc(tx({ar:"الطريق السريع رمادي · الكثبان بني · الوادي أخضر · منطقة البحث بنفسجي",en:"Highway grey · dunes brown · wadi green · search zone purple"}))}</text>`;
    s.innerHTML=g;
    $("#evt").innerHTML=S.events.slice(-8).map(e=>`<div><span>T+${num(e.t.toFixed(1))}h</span> ${esc(tx({stormBase:{ar:"العاصفة بلغت القاعدة",en:"Storm reached base"},stormZone:{ar:"العاصفة بلغت منطقة البحث",en:"Storm reached the search zone"},stormSta:{ar:"العاصفة بلغت المحطة",en:"Storm reached the station"},road:{ar:"الطريق السريع أُغلق تقريباً",en:"Highway nearly closed"},stuck:{ar:`${e.u} علق في الكثبان`,en:`${e.u} stuck in dunes`},down:{ar:`${e.u} سقط في العاصفة`,en:`${e.u} lost to the storm`},blind:{ar:`${e.u} أعمته العاصفة`,en:`${e.u} blinded by the storm`},rtb:{ar:`${e.u} عاد لنفاد التحمل`,en:`${e.u} returned, endurance out`},arrive:{ar:`${e.u} وصل القرية`,en:`${e.u} reached the village`},onSearch:{ar:`${e.u} في منطقة البحث`,en:`${e.u} in the search zone`},onStation:{ar:`${e.u} على المحطة`,en:`${e.u} on station`},found:{ar:"عُثر على القافلة",en:"Convoy found"}}[e.k]||{ar:e.k,en:e.k}))}</div>`).join("");
  }
  function renderRes(){const r=result;const GAP={watch:{ar:"فجوة: مراقبة مستمرة في العاصفة — درون محكم ضد الغبار طويل التحمل (الاحتياج الوطني N-02).",en:"Gap: continuous watch inside the storm — a dust-sealed long-endurance drone (national need N-02)."},dune:{ar:"فجوة: عبور الرمال الناعمة — ضغط إطارات ذاتي أو مركبة ٨×٨ أخرى.",en:"Gap: soft-sand crossing — central tyre inflation or a second 8×8."},forecast:{ar:"فجوة: توقع الطرق — دمج بيانات الطقس في تخطيط المسار.",en:"Gap: road forecasting — weather data in route planning."},launch:{ar:"فجوة: إطلاق جوي سريع للبحث.",en:"Gap: fast air launch for search."}};
    $("#res").innerHTML=`<h3>${esc(tx({ar:"النتيجة",en:"Result"}))}<small>${num(r.total)}/100</small></h3><div class="dims">${[["deliver",{ar:"الإيصال",en:"Delivery"},r.deliver.score],["search",{ar:"البحث",en:"Search"},r.search.score],["watch",{ar:"المراقبة",en:"Watch"},r.watch.score]].map(([k,l,v])=>`<div class="dim"><span>${esc(tx(l))}</span><div class="bar ${v>=85?"good":v>=50?"warn":"crit"}"><i style="width:${v}%"></i></div><b>${num(v)}</b></div>`).join("")}</div>
     <div style="margin-top:12px;display:grid;gap:6px;font-size:13px">${r.gaps.map(k=>`<div>${esc(tx(GAP[k]))}</div>`).join("")||`<div class="mute">${esc(tx({ar:"لا فجوات قدرة كبيرة في هذه الخطة.",en:"No major capability gaps in this plan."}))}</div>`}</div>
     <button class="btn ghost sm" id="toIdea" style="margin-top:12px">${esc(t("toIdea"))}</button>`;
    $("#toIdea").onclick=()=>{H.ctx.state={draft:{t:{ar:"سد فجوة قدرة من سيناريو عاصفة الشمال",en:"Close a capability gap from the Shamal Storm scenario"},d:tx({ar:`من هندسة المهام: النتيجة ${r.total}/100 (إيصال ${r.deliver.score}، بحث ${r.search.score}، مراقبة ${r.watch.score}). ${r.gaps.map(k=>GAP[k].ar).join(" ")}`,en:`From Mission Engineering: ${r.total}/100 (delivery ${r.deliver.score}, search ${r.search.score}, watch ${r.watch.score}). ${r.gaps.map(k=>GAP[k].en).join(" ")}`}),area:"air",ch:r.gaps.includes("watch")?"N-02":""}};go("lab")}}
 },
 insight(c){if(c.object==="result"&&c.state){const r=c.state;return {role:{ar:"مساعد المحاكاة",en:"Simulation assistant"},lines:[{ar:`النتيجة ${num(r.total)}/100. ${r.watch.score<85?"المراقبة تنهار عندما تصل العاصفة إلى المحطة ("+"T+"+num(r.watch.blindAfter.toFixed(1))+"h).":""} ${r.deliver.stuck.length?r.deliver.stuck.join("، ")+" علق في الكثبان.":""}`,en:`Score ${r.total}/100. ${r.watch.score<85?"Watch collapses when the storm reaches the station (T+"+r.watch.blindAfter.toFixed(1)+"h).":""} ${r.deliver.stuck.length?r.deliver.stuck.join(", ")+" stuck in dunes.":""}`},{ar:"جرّب: الوادي للإيصال، B-250 للبحث، الدرونات للمراقبة المبكرة فقط.",en:"Try: wadi for delivery, B-250 for search, drones for early watch only."}],actions:[{label:t("toIdea"),run:()=>$("#toIdea")&&$("#toIdea").click()}]}}
  return {role:{ar:"مساعد المحاكاة",en:"Simulation assistant"},lines:[{ar:"حرّك شريط الزمن لترى جبهة العاصفة تتقدم من الشمال الغربي. الطريق السريع الأسرع لكنه أول ما يُغلق.",en:"Move the time slider to watch the front advance from the north-west. The highway is fastest and the first to close."},{ar:"الدرونات تسقط داخل العاصفة؛ الطائرة تُعمى لكنها تبقى.",en:"Drones go down inside the storm; the aircraft is blinded but stays up."}],actions:[{label:{ar:"نفّذ",en:"Execute"},run:()=>$("#run")&&$("#run").click()}]}}
});
})();
