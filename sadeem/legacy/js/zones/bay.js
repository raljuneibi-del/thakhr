/* SADEEM HANGAR · Zone 03 Vehicle Bay */
(function(){
const {$,$$,esc,t,tx,num,go,register,ai,toast}=H;
const V=window.VEH;
let plat=V.PLATFORMS[0],cfg=Object.assign({},plat.def),snapA=null,ghostOn=false,viewer=null,mission=V.MISSIONS[0],lastTest=null,layers=null;
const LAYER_SETS={vehicle:[["chassis",{ar:"الهيكل",en:"Chassis"}],["power",{ar:"الدفع",en:"Powertrain"}],["armour",{ar:"الحماية",en:"Protection"}],["mission",{ar:"المهمة",en:"Mission"}],["cooling",{ar:"التبريد",en:"Cooling"}],["ai",{ar:"الذكاء",en:"Intelligence"}]],
 aircraft:[["structure",{ar:"البنية",en:"Structure"}],["wing",{ar:"الأجنحة",en:"Wings"}],["engine",{ar:"المحرك",en:"Engine"}],["avionics",{ar:"الإلكترونيات",en:"Avionics"}],["sensors",{ar:"المستشعرات",en:"Sensors"}],["payload",{ar:"الحمولة",en:"Payload"}]]};
register("bay",{
 async mount(el){
  H.head(el,{ar:"حظيرة المنصات · L1",en:"Vehicle Bay · L1"},{ar:"افتح المنصة إلى طبقاتها الهندسية",en:"Open the platform into its engineering layers"},{ar:"دوّر، فكّك، بدّل المكوّنات، قارن نسختين، ثم اختبر التشكيلة في مهمة. النماذج ثلاثية الأبعاد بدائل إجرائية حتى تصل أصول glTF الرسمية.",en:"Rotate, explode, swap components, compare two versions, then test the configuration on a mission. The 3D models are procedural placeholders until official glTF assets arrive."});
  el.insertAdjacentHTML("beforeend",`<div class="wrap bayGrid">
   <div><div class="seg" id="plats">${V.PLATFORMS.map(p=>`<button aria-pressed="${p.k===plat.k}" data-p="${p.k}">${p.n}</button>`).join("")}</div>
    <div class="v3" id="v3" style="margin-top:12px"><div class="hud"><b id="hudN"></b><span id="hudS"></span><span class="mono" id="hudC"></span></div>
     <div class="ctl"><label class="ex"><span>${esc(tx({ar:"تفكيك",en:"Explode"}))}</span><input type="range" id="exp" min="0" max="100" value="0"></label><div id="layerChips" style="display:flex;gap:6px;flex-wrap:wrap"></div><button class="chip" id="ghostBtn">${esc(tx({ar:"قارن مع A",en:"Compare with A"}))}</button><button class="chip" id="snapBtn">${esc(tx({ar:"احفظ كنسخة A",en:"Save as A"}))}</button></div></div>
    <p class="note" style="margin-top:8px">${esc(t("training"))} · ${esc(tx({ar:"اسحب للدوران، عجلة الفأرة للتقريب",en:"Drag to orbit, wheel to zoom"}))}</p>
    <div class="grid g2" style="margin-top:18px"><div class="panel"><h3>${esc(tx({ar:"الأبعاد الهندسية",en:"Engineering dimensions"}))}<small id="dDelta"></small></h3><div class="dims" id="dims"></div></div>
     <div class="panel"><h3>${esc(tx({ar:"اختبار المهمة",en:"Mission test"}))}</h3><div class="field"><select id="mSel">${V.MISSIONS.map(m=>`<option value="${m.k}">${esc(tx(m.n))}</option>`).join("")}</select></div><p class="mute" id="mDesc" style="font-size:13px;margin-bottom:10px"></p><button class="btn brass sm" id="runTest">${esc(t("run"))}</button><div id="testOut" style="margin-top:12px"></div></div></div></div>
   <div class="panel"><h3>${esc(tx({ar:"صينية المكوّنات",en:"Parts tray"}))}<small>${esc(tx({ar:"بدّل وشاهد الفرق",en:"swap and see the delta"}))}</small></h3><div class="slots" id="slots"></div></div></div>`);
  viewer=window.Viewer($("#v3"));
  $$("#plats button").forEach(b=>b.onclick=()=>{plat=V.PLATFORMS.find(p=>p.k===b.dataset.p);cfg=Object.assign({},plat.def);snapA=null;ghostOn=false;layers=null;lastTest=null;$$("#plats button").forEach(x=>x.setAttribute("aria-pressed",x===b));render()});
  $("#exp").oninput=e=>viewer.explode(+e.target.value/100);
  $("#snapBtn").onclick=()=>{snapA={plat:plat.k,cfg:Object.assign({},cfg)};toast({ar:"حُفظت النسخة A",en:"Version A saved"});renderGhost()};
  $("#ghostBtn").onclick=()=>{if(!snapA){toast({ar:"احفظ نسخة A أولاً",en:"Save version A first"});return}ghostOn=!ghostOn;renderGhost()};
  $("#mSel").onchange=e=>{mission=V.MISSIONS.find(m=>m.k===e.target.value);$("#mDesc").textContent=tx(mission.d);ai.set({object:"mission",state:mission.k})};$("#mDesc").textContent=tx(mission.d);
  $("#runTest").onclick=runTest;
  render();await viewer.mount();viewer.set(plat.model,V.cfgToModel(plat,cfg));renderGhost();
  function render(){
    $("#hudN").textContent=plat.n;$("#hudS").textContent=tx(plat.sub);$("#hudC").textContent=Object.values(cfg).join(" · ").toUpperCase();
    const ls=LAYER_SETS[plat.model];$("#layerChips").innerHTML=ls.map(([k,n])=>`<button class="chip ${!layers||layers.has(k)?"on":""}" data-l="${k}">${esc(tx(n))}</button>`).join("");
    $$("#layerChips .chip").forEach(b=>{b.onclick=()=>{const k=b.dataset.l;if(!layers)layers=new Set(ls.map(x=>x[0]));if(layers.has(k))layers.delete(k);else layers.add(k);if(layers.size===ls.length)layers=null;viewer.layers(layers);render()};b.onmouseenter=()=>viewer.highlight(b.dataset.l);b.onmouseleave=()=>viewer.highlight(null)});
    $("#slots").innerHTML=V.SLOTS.map(s=>`<div class="slot"><h4>${esc(tx(s.n))}</h4><div class="opts">${s.o.map(o=>`<button aria-pressed="${cfg[s.k]===o.k}" data-s="${s.k}" data-o="${o.k}" title="${esc(tx(o.d))}">${esc(tx(o.n))}</button>`).join("")}</div></div>`).join("");
    $$("#slots button").forEach(b=>b.onclick=()=>{cfg[b.dataset.s]=b.dataset.o;viewer.set(plat.model,V.cfgToModel(plat,cfg));viewer.highlight(b.dataset.s);setTimeout(()=>viewer.highlight(null),900);lastTest=null;render();ai.set({object:b.dataset.s,state:b.dataset.o})});
    const v=V.score(plat,cfg),base=V.score(plat,plat.def);
    $("#dims").innerHTML=V.DIMS.map(d=>{const val=v[d.k],dl=val-base[d.k],disp=d.inv?100-val:val;const req=mission.req[d.k];const miss=req&&(d.inv?100-val:val)<req;return `<div class="dim ${miss?"miss":""}"><span>${esc(tx(d.n))}</span><div class="bar"><i style="width:${disp}%"></i></div><b>${num(disp)}${dl?` <span class="delta ${(d.inv?-dl:dl)<0?"neg":""}">${dl>0?"+":""}${num(dl)}</span>`:""}</b></div>`}).join("");
    $("#dDelta").textContent=tx({ar:"مقارنة بالتشكيلة الأساسية",en:"vs the base configuration"});
    if(lastTest)renderTest();
  }
  function renderGhost(){if(!viewer)return;viewer.ghost(ghostOn&&snapA?V.PLATFORMS.find(p=>p.k===snapA.plat).model:null,ghostOn&&snapA?V.cfgToModel(V.PLATFORMS.find(p=>p.k===snapA.plat),snapA.cfg):null);$("#ghostBtn").classList.toggle("on",ghostOn)}
  function runTest(){const v=V.score(plat,cfg);lastTest=V.fit(v,mission);renderTest();ai.set({object:"test",state:lastTest})}
  function renderTest(){const r=lastTest;$("#testOut").innerHTML=`<div class="testRes"><div class="score">${num(r.score)}<small class="mute" style="font-size:12px"> /100</small></div>${r.f.map(x=>`<div class="dim ${x.pass?"":"miss"}"><span>${esc(tx(V.DIMS.find(d=>d.k===x.k).n))}</span><div class="bar"><i style="width:${x.have}%"></i></div><b>${num(x.have)}/${num(x.need)}</b></div>`).join("")}<button class="btn ghost sm" id="toIdea">${esc(t("toIdea"))}</button></div>`;
    $("#toIdea").onclick=()=>{const gaps=r.f.filter(x=>!x.pass).map(x=>tx(V.DIMS.find(d=>d.k===x.k).n)).join("، ");H.ctx.state={draft:{t:{ar:`تحسين ${plat.n} لمهمة «${tx(mission.n)}»`,en:`Improve ${plat.n} for '${tx(mission.n)}'`},d:tx({ar:`من حظيرة المنصات: تشكيلة ${Object.values(cfg).join("/")} حققت ${r.score}/100. الفجوات: ${gaps||"لا شيء"}.`,en:`From the Vehicle Bay: configuration ${Object.values(cfg).join("/")} scored ${r.score}/100. Gaps: ${gaps||"none"}.`}),area:plat.model==="aircraft"?"air":"land"}};go("lab")}}
 },
 unmount(){if(viewer)viewer.stop();viewer=null},
 insight(c){
  const v=V.score(plat,cfg);const slot=c.object&&V.SLOTS.find(s=>s.k===c.object);
  if(slot){const o=V.opt(slot.k,cfg[slot.k]);const fx=Object.entries(o.fx).map(([k,d])=>`${tx(V.DIMS.find(x=>x.k===k).n)} ${d>0?"+":""}${d}`).join(", ")||tx({ar:"لا تغيير عن الأساس",en:"no change from base"});
   return {role:{ar:"مساعد هندسي",en:"Engineering copilot"},lines:[{ar:`${tx(slot.n)}: ${tx(o.n)} — ${tx(o.d)}. الأثر: ${fx}.`,en:`${tx(slot.n)}: ${tx(o.n)} — ${tx(o.d)}. Effect: ${fx}.`},{ar:"جرّب البديل الأعلى في هذه الفتحة وراقب أي بُعد ينخفض.",en:"Try the next option in this slot and watch which dimension drops."}]}}
  if(c.object==="test"&&lastTest){const fail=lastTest.f.filter(x=>!x.pass);return {role:{ar:"مساعد المحاكاة",en:"Simulation assistant"},lines:[fail.length?{ar:`فشلت ${num(fail.length)} من ${num(lastTest.f.length)} متطلبات. أول فجوة: ${tx(V.DIMS.find(d=>d.k===fail[0].k).n)} (${num(fail[0].have)} من ${num(fail[0].need)}).`,en:`${fail.length} of ${lastTest.f.length} requirements failed. First gap: ${tx(V.DIMS.find(d=>d.k===fail[0].k).n)} (${fail[0].have} of ${fail[0].need}).`}:{ar:"كل المتطلبات محققة. الرافعة التالية: خفض التكلفة دون كسر أي متطلب.",en:"All requirements met. Next lever: reduce cost without breaking a requirement."}],actions:[{label:t("toIdea"),run:()=>$("#toIdea")&&$("#toIdea").click()}]}}
  const weakest=V.DIMS.filter(d=>!d.inv).sort((a,b)=>v[a.k]-v[b.k])[0];
  return {role:{ar:"مساعد هندسي",en:"Engineering copilot"},lines:[{ar:`${plat.n}: أضعف بُعد حالياً هو ${tx(weakest.n)} (${num(v[weakest.k])}). حرّك شريط التفكيك لترى الطبقات، أو المس رقاقة طبقة لإبرازها.`,en:`${plat.n}: the weakest dimension now is ${tx(weakest.n)} (${v[weakest.k]}). Move the explode slider to see layers, or hover a layer chip to highlight it.`},{ar:"احفظ نسخة A ثم غيّر مكوّناً وقارن: النسخة A تظهر كشبح أزرق.",en:"Save version A, change a part and compare: version A appears as a blue ghost."}],actions:[{label:{ar:"شغّل اختبار المهمة",en:"Run the mission test"},run:()=>$("#runTest")&&$("#runTest").click()}]}}
});
})();
