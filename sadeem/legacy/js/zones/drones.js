/* SADEEM HANGAR · Zone 04 Drone Lab */
(function(){
const {$,$$,esc,t,tx,num,go,register,ai,toast}=H;
const D=window.DRONE;
let cfg=Object.assign({},D.DEF),mission=D.MISSIONS[0];
register("drones",{
 mount(el){
  H.head(el,{ar:"مختبر الدرونات · L2",en:"Drone Lab · L2"},{ar:"الدرون يتغيّر معك، والمفاضلات تظهر أمامك",en:"The airframe changes as you choose, and the trade-offs show"},{ar:"أحد عشر قراراً هندسياً تحكم الوزن والطاقة وزمن التحليق والمدى والتكلفة. لا يوجد خيار مجاني: المحرك يقرأ القيد الحاكم ويسمّي المعامل الذي يحرّره.",en:"Eleven engineering decisions govern mass, power, endurance, range and cost. No choice is free: the engine names the binding constraint and the parameter that releases it."});
  el.insertAdjacentHTML("beforeend",`<div class="wrap droneGrid">
   <div class="panel" id="params" style="align-self:start"></div>
   <div class="bench"><div class="hud" id="hud"></div><svg id="drone" viewBox="70 20 460 380" role="img" aria-label="Drone"></svg><div class="bind" id="bind"></div></div>
   <div style="display:grid;gap:14px;align-content:start">
    <div class="panel"><h3>${esc(tx({ar:"ملف المهمة",en:"Mission profile"}))}</h3><div class="field"><select id="dm">${D.MISSIONS.map(m=>`<option value="${m.k}">${esc(tx(m.n))}</option>`).join("")}</select></div><p class="mute" id="dmD" style="font-size:13px"></p><div id="fit" style="margin-top:10px;display:grid;gap:6px"></div></div>
    <div class="panel"><h3>${esc(tx({ar:"عجلة المفاضلات",en:"Trade-off wheel"}))}<small>${esc(tx({ar:"المتقطع = المطلوب",en:"dashed = required"}))}</small></h3><svg class="wheel" id="wheel" viewBox="0 0 300 285"></svg></div>
    <div class="panel"><h3>${esc(tx({ar:"الأرقام",en:"Numbers"}))}<small>${esc(t("training"))}</small></h3><div class="metrics" id="mx"></div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn sm" id="saveCfg">${esc(tx({ar:"احفظ التشكيلة",en:"Save configuration"}))}</button><button class="btn ghost sm" id="toIdea">${esc(t("toIdea"))}</button></div></div>
   </div></div>`);
  $("#dm").onchange=e=>{mission=D.MISSIONS.find(m=>m.k===e.target.value);render()};
  $("#saveCfg").onclick=()=>{H.DB.drones.unshift({id:"D-"+H.uid(),cfg:Object.assign({},cfg),mission:mission.k,at:Date.now()});H.save();toast({ar:"حُفظت في نظام سديم",en:"Saved to the SADEEM OS"})};
  $("#toIdea").onclick=()=>{const r=D.compute(cfg),b=D.binding(r,mission);H.ctx.state={draft:{t:{ar:`تشكيلة درون لمهمة «${tx(mission.n)}»`,en:`Drone configuration for '${tx(mission.n)}'`},d:tx({ar:`من مختبر الدرونات: ${Object.values(cfg).join("/")} — كتلة ${r.mass} كجم، ${r.end} دقيقة، ${r.rangeKm} كم، تكلفة ${r.cost.toLocaleString()} درهم. ${b.ar}`,en:`From the Drone Lab: ${Object.values(cfg).join("/")} — ${r.mass} kg, ${r.end} min, ${r.rangeKm} km, cost AED ${r.cost.toLocaleString()}. ${b.en}`}),area:"air",ch:mission.k==="storm"?"N-02":""}};go("lab")};
  render();
  function render(){
    const r=D.compute(cfg),ft=D.fit(r,mission),b=D.binding(r,mission);
    $("#dmD").textContent=tx(mission.d);
    $("#params").innerHTML=`<h3>${esc(tx({ar:"قرارات التصميم",en:"Design decisions"}))}</h3>`+D.G.map(g=>{if(g.onlyVtol&&cfg.airframe!=="vtol")return "";const o=r.o[g.k];return `<div class="pgroup"><h4>${esc(tx(g.n))}<span>${esc(tx(o.d))}</span></h4><div class="opts">${g.o.map(x=>`<button aria-pressed="${cfg[g.k]===x.k}" data-g="${g.k}" data-o="${x.k}">${esc(tx(x.n))}</button>`).join("")}</div></div>`}).join("");
    $$("#params button").forEach(bt=>bt.onclick=()=>{cfg[bt.dataset.g]=bt.dataset.o;render();ai.set({object:bt.dataset.g})});
    drawDrone(r);drawWheel(r,ft);
    $("#hud").innerHTML=`<b>${esc(tx({ar:"طاولة العمل",en:"WORKBENCH"}))}</b> · ${r.vt?"VTOL":cfg.airframe.toUpperCase()} · ${num(r.mass)} kg · ${num(r.power)} W`;
    $("#bind").innerHTML=`<b>${esc(tx({ar:"القيد الحاكم",en:"Binding constraint"}))}</b> — ${esc(tx(b))}`;
    const M=[[{ar:"الكتلة",en:"Mass"},r.mass,"kg",r.margin<0?"bad":""],[{ar:"هامش الرفع",en:"Lift margin"},r.margin,"kg",r.margin<0?"bad":r.margin<.5?"":"ok"],[{ar:"الاستهلاك",en:"Power draw"},r.power,"W",""],[{ar:"زمن التحليق",en:"Endurance"},r.end,H.L==="ar"?"د":"min",ft.f.find(x=>x.k==="end")?(ft.f.find(x=>x.k==="end").pass?"ok":"bad"):""],[{ar:"سرعة الطيران",en:"Cruise"},r.speed,"m/s",""],[{ar:"نصف قطر المدى",en:"Radius"},r.rangeKm,"km",""],[{ar:"مقاومة الرياح",en:"Wind tolerance"},Math.round(r.wind*100),"%",""],[{ar:"الاستقلالية",en:"Autonomy"},Math.round(r.auto*100),"%",""],[{ar:"التكلفة",en:"Unit cost"},(r.cost/1000).toFixed(0)+"k","AED",""],[{ar:"سهولة الصيانة",en:"Maintainability"},Math.round(r.maint*100),"%",""]];
    $("#mx").innerHTML=M.map(([l,v,u,c])=>`<div class="metric ${c}"><span>${esc(tx(l))}</span><b>${esc(num(v))}<small>${esc(u)}</small></b></div>`).join("");
    $("#fit").innerHTML=ft.f.map(x=>`<div class="dim ${x.pass?"":"miss"}" style="grid-template-columns:auto 1fr"><span class="tag ${x.pass?"good":"crit"}">${x.pass?"✓":"✕"}</span><span style="font-size:12.5px">${esc(H.L==="ar"?x.ar:x.en)}</span></div>`).join("")+`<div class="note" style="margin-top:6px">${esc(tx({ar:"ملاءمة المهمة",en:"Mission fit"}))}: ${num(ft.score)}/100</div>`;
    ai.set({state:{r,ft,b}});
  }
  function drawDrone(r){
    const s=$("#drone");const vt=r.vt,hexa=cfg.airframe==="hexa";const cx=300,cy=200;
    const bodyL=60+r.batt*16,bodyW=34+(r.o.autonomy.m||0)*40;
    const arm=vt?0:hexa?95:105,n=vt?0:hexa?6:4;const rot=vt?[[-95,-58],[95,-58],[-95,58],[95,58]]:[];
    const shell=cfg.materials==="sealed"?"#3B3D42":cfg.materials==="cf"?"#2C2E33":"#5A5D63";
    let g=`<defs><radialGradient id="rg" cx="50%" cy="50%"><stop offset="0" stop-color="#C9A164" stop-opacity=".35"/><stop offset="1" stop-color="#C9A164" stop-opacity="0"/></radialGradient></defs>`;
    g+=`<circle cx="${cx}" cy="${cy}" r="${120+r.end/4}" fill="url(#rg)"/><circle cx="${cx}" cy="${cy}" r="${Math.min(170,120+r.end/4)}" fill="none" stroke="#C9A164" stroke-opacity=".5" stroke-dasharray="3 5"/><text x="${cx}" y="${cy-Math.min(170,120+r.end/4)-6}" text-anchor="middle" font-family="IBM Plex Mono" font-size="10" fill="#C9A164">${esc(tx({ar:"حلقة التحمل",en:"ENDURANCE RING"}))} · ${num(r.end)} min</text>`;
    // arms + rotors
    for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2+(hexa?0:Math.PI/4);const x=cx+Math.cos(a)*arm,y=cy+Math.sin(a)*arm*.7;const rr=18+r.o.propulsion.thrust*8;
      g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${shell}" stroke-width="${6+(r.pay>1?4:0)}" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${rr}" fill="none" stroke="#B9BBB6" stroke-width="1.5" stroke-opacity=".8"><animateTransform attributeName="transform" type="rotate" from="0 ${x} ${y}" to="360 ${x} ${y}" dur="${1.4/r.o.propulsion.thrust}s" repeatCount="indefinite"/></circle><line x1="${x-rr}" y1="${y}" x2="${x+rr}" y2="${y}" stroke="#D8D9D4" stroke-width="2"><animateTransform attributeName="transform" type="rotate" from="0 ${x} ${y}" to="360 ${x} ${y}" dur="${.5/r.o.propulsion.thrust}s" repeatCount="indefinite"/></line><circle cx="${x}" cy="${y}" r="5" fill="#8E9095"/>`}
    if(vt){const wl=cfg.wings==="long"?190:cfg.wings==="delta"?120:150,wc=cfg.wings==="delta"?70:26;
      g+=`<path d="M${cx-wl} ${cy-4} L${cx-20} ${cy-wc/2} L${cx+20} ${cy-wc/2} L${cx+wl} ${cy-4} L${cx+wl} ${cy+6} L${cx+20} ${cy+wc/2} L${cx-20} ${cy+wc/2} L${cx-wl} ${cy+6} Z" fill="${shell}" stroke="#8E9095"/><path d="M${cx-6} ${cy+bodyL/2+18} l-22 12 h56 l-22-12z" fill="${shell}" stroke="#8E9095"/>`;
      rot.forEach(([dx,dy])=>{g+=`<circle cx="${cx+dx}" cy="${cy+dy}" r="16" fill="none" stroke="#B9BBB6" stroke-width="1.5"><animateTransform attributeName="transform" type="rotate" from="0 ${cx+dx} ${cy+dy}" to="360 ${cx+dx} ${cy+dy}" dur="1s" repeatCount="indefinite"/></circle><line x1="${cx+dx-16}" y1="${cy+dy}" x2="${cx+dx+16}" y2="${cy+dy}" stroke="#D8D9D4" stroke-width="2"/>`});
      g+=`<circle cx="${cx}" cy="${cy-bodyL/2-6}" r="${10+r.o.propulsion.thrust*3}" fill="none" stroke="#D8D9D4" stroke-width="2"><animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy-bodyL/2-6}" to="360 ${cx} ${cy-bodyL/2-6}" dur=".4s" repeatCount="indefinite"/></circle>`}
    // body
    g+=`<rect x="${cx-bodyW/2}" y="${cy-bodyL/2}" width="${bodyW}" height="${bodyL}" rx="${vt?bodyW/2:8}" fill="${shell}" stroke="#B9BBB6" stroke-width="1.5"/>`;
    if(cfg.materials==="sealed")g+=`<rect x="${cx-bodyW/2+3}" y="${cy-bodyL/2+3}" width="${bodyW-6}" height="${bodyL-6}" rx="6" fill="none" stroke="#C9A164" stroke-width="1" stroke-dasharray="2 3"/>`;
    // battery / cell
    const bh=Math.min(bodyL-14,10+r.batt*10);g+=`<rect x="${cx-bodyW/2+6}" y="${cy-bh/2}" width="${bodyW-12}" height="${bh}" rx="3" fill="${cfg.energy==="h2"?"#3F6E8E":"#7A7D80"}" stroke="#B9BBB6" stroke-width=".8"/><text x="${cx}" y="${cy+3}" text-anchor="middle" font-family="IBM Plex Mono" font-size="8" fill="#EDECE7">${cfg.energy==="h2"?"H₂":num(r.o.energy.wh)+" Wh"}</text>`;
    // camera gimbal
    const cam=r.o.cameras.k;g+=`<circle cx="${cx}" cy="${cy+bodyL/2+(cam==="gimbal"?16:9)}" r="${cam==="gimbal"?13:cam==="eoir"?9:6}" fill="#1B1C1E" stroke="#C9A164" stroke-width="1.5"/>`;
    if(cam==="eoir"||cam==="gimbal")g+=`<circle cx="${cx+5}" cy="${cy+bodyL/2+(cam==="gimbal"?16:9)}" r="3" fill="#B3261E"/>`;
    // sensors
    if(cfg.sensors==="lidar")g+=`<rect x="${cx-8}" y="${cy-bodyL/2-14}" width="16" height="10" fill="#1B1C1E" stroke="#8FBDF0"/><circle cx="${cx}" cy="${cy-bodyL/2-9}" r="3" fill="#8FBDF0"/>`;
    if(cfg.sensors==="nav")g+=`<circle cx="${cx-bodyW/2-2}" cy="${cy-bodyL/2+8}" r="4" fill="#8FBDF0"/><circle cx="${cx+bodyW/2+2}" cy="${cy-bodyL/2+8}" r="4" fill="#8FBDF0"/>`;
    // comms
    const ck=cfg.comms;g+=ck==="sat"?`<rect x="${cx+bodyW/2+4}" y="${cy-18}" width="22" height="14" rx="2" fill="#5A5D63" stroke="#B9BBB6"/><path d="M${cx+bodyW/2+15} ${cy-18} v-10" stroke="#B9BBB6"/>`:`<path d="M${cx+bodyW/2} ${cy-bodyL/2+6} l${ck==="mesh"?14:9} -${ck==="mesh"?22:14}" stroke="#B9BBB6" stroke-width="1.5"/>`;
    // payload
    if(cfg.payload.startsWith("pod")){const pw=cfg.payload==="pod5"?46:30;g+=`<rect x="${cx-pw/2}" y="${cy+bodyL/2+24}" width="${pw}" height="${cfg.payload==="pod5"?30:20}" rx="4" fill="#B8894E" stroke="#C9A164"/><line x1="${cx-8}" y1="${cy+bodyL/2}" x2="${cx-8}" y2="${cy+bodyL/2+24}" stroke="#8E9095"/><line x1="${cx+8}" y1="${cy+bodyL/2}" x2="${cx+8}" y2="${cy+bodyL/2+24}" stroke="#8E9095"/>`}
    if(cfg.payload==="relay")g+=`<rect x="${cx-14}" y="${cy+bodyL/2+22}" width="28" height="12" rx="2" fill="#2A2C31" stroke="#8FBDF0"/><path d="M${cx} ${cy+bodyL/2+22} v-8 m-6 0 h12" stroke="#8FBDF0" stroke-width="1.5"/>`;
    // mass bar
    const mw=220;g+=`<text x="${cx-mw/2}" y="378" font-family="IBM Plex Mono" font-size="9" fill="#8E9095">MASS ${num(r.mass)} / ${num(r.maxMass)} kg</text><rect x="${cx-mw/2}" y="384" width="${mw}" height="6" fill="#2A2C31"/><rect x="${cx-mw/2}" y="384" width="${Math.min(mw,mw*r.mass/r.maxMass)}" height="6" fill="${r.margin<0?"#B3261E":"#C9A164"}"/>`;
    s.innerHTML=g;
  }
  function drawWheel(r,ft){
    const s=$("#wheel");const cx=150,cy=132,R=92;
    const axes=[[{ar:"التحمل",en:"Endurance"},Math.min(1,r.end/360),(mission.req.end||0)/360],[{ar:"الرياح",en:"Wind"},r.wind,mission.req.wind||0],[{ar:"الاتصال",en:"Comms"},Math.min(1,r.commsKm/60),Math.min(1,(mission.req.range||0)/60)],[{ar:"الاستقلالية",en:"Autonomy"},r.auto,mission.req.auto||0],[{ar:"الحمولة",en:"Payload"},Math.min(1,Math.max(0,r.margin)/4),Math.min(1,(mission.req.payload||0)/4)],[{ar:"الاقتصاد",en:"Economy"},Math.max(0,1-r.cost/90000),.35]];
    const pt=(i,v)=>{const a=-Math.PI/2+i/axes.length*Math.PI*2;return [cx+Math.cos(a)*R*v,cy+Math.sin(a)*R*v]};
    let g="";[.25,.5,.75,1].forEach(k=>{g+=`<polygon class="ax" points="${axes.map((_,i)=>pt(i,k).join(",")).join(" ")}"/>`});
    axes.forEach((a,i)=>{const [x,y]=pt(i,1);g+=`<line class="ax" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;const [lx,ly]=pt(i,1.22);g+=`<text x="${lx}" y="${ly+4}" text-anchor="middle">${esc(tx(a[0]))}</text>`});
    g+=`<polygon class="req" points="${axes.map((a,i)=>pt(i,Math.max(.03,a[2])).join(",")).join(" ")}"/>`;
    g+=`<polygon class="cur" points="${axes.map((a,i)=>pt(i,Math.max(.03,a[1])).join(",")).join(" ")}"/>`;
    g+=`<text x="${cx}" y="280" text-anchor="middle" style="font-weight:600">${esc(tx({ar:"ملاءمة",en:"fit"}))} ${num(ft.score)}/100</text>`;
    s.innerHTML=g;
  }
 },
 insight(c){const st=c.state||{};const r=st.r||D.compute(cfg),b=st.b||D.binding(r,mission);
  if(c.object){const g=D.G.find(x=>x.k===c.object);const o=r.o[g.k];return {role:{ar:"مستشار التصميم",en:"Design advisor"},lines:[{ar:`${tx(g.n)} → ${tx(o.n)}: ${tx(o.d)}. الكتلة الآن ${num(r.mass)} كجم والاستهلاك ${num(r.power)} واط، فيصبح زمن التحليق ${num(r.end)} دقيقة.`,en:`${tx(g.n)} → ${tx(o.n)}: ${tx(o.d)}. Mass is now ${r.mass} kg and draw ${r.power} W, so endurance is ${r.end} min.`},b]}}
  const alt=r.vt?{ar:"بديل: هيكل سداسي مع خلية وقود يعطي زمناً طويلاً مع تحليق ثابت.",en:"Alternative: a hexa frame with a fuel cell gives long endurance with hover capability."}:{ar:"بديل: هيكل VTOL يخفض الاستهلاك إلى أقل من النصف لنفس الكتلة.",en:"Alternative: a VTOL frame cuts draw to less than half for the same mass."};
  return {role:{ar:"مستشار التصميم",en:"Design advisor"},lines:[b,alt,{ar:`تكلفة الوحدة ${r.cost.toLocaleString()} درهم؛ كل ١٠٠٠ Wh إضافية تكلف وزناً قبل أن تكلف مالاً.`,en:`Unit cost AED ${r.cost.toLocaleString()}; every extra 1,000 Wh costs mass before it costs money.`}],actions:[{label:t("toIdea"),run:()=>$("#toIdea")&&$("#toIdea").click()}]}}
});
})();
