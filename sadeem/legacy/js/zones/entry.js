/* SADEEM HANGAR · 01 Entry Point + Vision Chamber */
(function(){
const {$,$$,esc,t,tx,go,register,quotes,ai,RM}=H;
const STAR='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1 L18.2 13.8 L31 16 L18.2 18.2 L16 31 L13.8 18.2 L1 16 L13.8 13.8 Z" fill="currentColor"/></svg>';

/* nebula → star: particles drift as a diffuse cloud, then condense onto the four-point star (the meaning of the name) */
function nebula(cv){
  const x=cv.getContext("2d");let W,H0,dpr,raf=0,t0=performance.now(),P=[];
  function size(){dpr=Math.min(devicePixelRatio||1,1.6);W=cv.clientWidth;H0=cv.clientHeight;cv.width=W*dpr;cv.height=H0*dpr;x.setTransform(dpr,0,0,dpr,0,0)}
  size();
  const N=Math.round(Math.min(900,W*H0/900));
  const starPt=(i)=>{ // a point on the four-point star outline/interior
    const k=i%4,a=k*Math.PI/2,r=Math.pow(Math.random(),1.8);const spread=(1-r)*.2;
    const ang=a+(Math.random()-.5)*spread*2.2;return [Math.cos(ang)*r,Math.sin(ang)*r]};
  for(let i=0;i<N;i++){const g=Math.random()*Math.PI*2,d=Math.pow(Math.random(),.6);P.push({x:Math.cos(g)*d*1.6+ (Math.random()-.5)*.6,y:Math.sin(g)*d*.9+(Math.random()-.5)*.4,s:starPt(i),z:Math.random(),w:Math.random()*Math.PI*2})}
  function frame(now){raf=requestAnimationFrame(frame);const T=(now-t0)/1000;const c=RM?1:Math.min(1,Math.max(0,(T-.8)/3.2));const e=c<.5?4*c*c*c:1-Math.pow(-2*c+2,3)/2;
    x.clearRect(0,0,W,H0);const cx=W/2,cy=H0*.42,R=Math.min(W,H0)*.36;
    const gr=x.createRadialGradient(cx,cy,0,cx,cy,R*1.8);gr.addColorStop(0,`rgba(200,164,92,${.10+.10*e})`);gr.addColorStop(1,"rgba(200,164,92,0)");x.fillStyle=gr;x.fillRect(0,0,W,H0);
    for(const p of P){const dr=RM?0:Math.sin(T*.3+p.w)*.02;const px=p.x*(1-e)+p.s[0]*.5*e+dr,py=p.y*(1-e)+p.s[1]*.5*e+dr*.5;
      const a=.25+.55*p.z;x.fillStyle=`rgba(${220+p.z*20|0},${190+p.z*30|0},${130+p.z*50|0},${a})`;const sz=.6+p.z*1.4;x.fillRect(cx+px*R-sz/2,cy+py*R-sz/2,sz,sz)}
    if(e>.95&&RM!==true&&T>6){cancelAnimationFrame(raf);raf=requestAnimationFrame(idle)}}
  function idle(now){raf=requestAnimationFrame(idle);const T=(now-t0)/1000;x.clearRect(0,0,W,H0);const cx=W/2,cy=H0*.42,R=Math.min(W,H0)*.36;
    const gr=x.createRadialGradient(cx,cy,0,cx,cy,R*1.8);gr.addColorStop(0,"rgba(200,164,92,.2)");gr.addColorStop(1,"rgba(200,164,92,0)");x.fillStyle=gr;x.fillRect(0,0,W,H0);
    for(const p of P){const tw=.7+.3*Math.sin(T*1.2+p.w*3);x.fillStyle=`rgba(${220+p.z*20|0},${190+p.z*30|0},${130+p.z*50|0},${(.25+.55*p.z)*tw})`;const sz=.6+p.z*1.4;x.fillRect(cx+p.s[0]*.5*R-sz/2,cy+p.s[1]*.5*R-sz/2,sz,sz)}}
  raf=requestAnimationFrame(frame);
  const ro=new ResizeObserver(size);ro.observe(cv);
  return ()=>{cancelAnimationFrame(raf);ro.disconnect()};
}

let stopNeb=null;
register("arrival",{
 mount(el){
  const qs=quotes();const q=qs.find(x=>x.zone==="arrival")||qs[0];
  const lang=H.L;const stmt=lang==="ar"&&q.ar?q.ar:lang==="en"&&q.en?q.en:(q.en||q.ar);
  const note=lang==="ar"&&!q.ar?t("arSurface"):lang==="en"&&!q.en?t("enSurface"):"";
  const TH=[["01",{ar:"الاحتواء قبل الإطلاق",en:"Containment before launch"}],["02",{ar:"التوجيه قبل التنفيذ",en:"Guidance before execution"}],["03",{ar:"الحوكمة قبل التجربة",en:"Governance before experiment"}]];
  el.innerHTML=`
  <div class="apron"><canvas id="nebula" aria-hidden="true"></canvas>
   <svg class="hangarArch" id="arch" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="ribG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C8A45C" stop-opacity=".5"/><stop offset="1" stop-color="#C8A45C" stop-opacity="0"/></linearGradient>
      <radialGradient id="gateG" cx="50%" cy="50%"><stop offset="0" stop-color="#E7CE92" stop-opacity=".9"/><stop offset="35%" stop-color="#C8A45C" stop-opacity=".35"/><stop offset="100%" stop-color="#C8A45C" stop-opacity="0"/></radialGradient>
    </defs>
    <g class="archFloor" stroke="#C8A45C" stroke-opacity=".16" stroke-width="1">
      ${Array.from({length:13},(_,i)=>{const x=120+i*100;return `<line x1="720" y1="560" x2="${x}" y2="900"/>`}).join("")}
      ${[600,650,712,792,900].map(y=>`<line x1="0" y1="${y}" x2="1440" y2="${y}" stroke-opacity="${0.05+(y-600)/900*0.14}"/>`).join("")}
    </g>
    <g class="archRibs">
      ${[0,1,2,3].map(i=>{const s=1-i*0.16;const w=760*s,h=520*s,cx=720,top=120+i*24;return `<path d="M${cx-w/2} ${top+h} Q${cx-w/2} ${top} ${cx} ${top} Q${cx+w/2} ${top} ${cx+w/2} ${top+h}" fill="none" stroke="url(#ribG)" stroke-width="${2-i*0.35}"/>`}).join("")}
    </g>
    <circle class="archGate" cx="720" cy="410" r="300" fill="url(#gateG)"/>
   </svg>
   <div class="entryCore">
    <div class="logoLock"><span>سديم للابتكار</span><b>SADEEM INNOVATES</b></div>
    <div class="door" id="door"><div class="beyond">${STAR}</div><div class="leaf a"></div><div class="leaf b"></div>
      <div class="engr"><div><q dir="${stmt===q.en?"ltr":"rtl"}" lang="${stmt===q.en?"en":"ar"}">${esc(stmt)}</q><cite>${esc(tx(q.leader))}</cite><small>${esc(q.date)} · ${esc(tx(q.context))}${note?" · "+esc(note):""}</small></div></div></div>
    <div class="thresholds" id="th">${TH.map(([n,l])=>`<div><b>${n}</b>${esc(tx(l))}</div>`).join("")}</div>
   </div></div>
  <div class="wrap arrBar">
    <div><div class="plate">${esc(tx({ar:"نقطة دخول وطنية واحدة",en:"Single National Entry Point"}))}</div>
      <h1>${esc(tx({ar:"هانقر سديم للابتكار",en:"The SADEEM Innovation Hangar"}))}</h1>
      <p class="lead">${esc(tx({ar:"فضاء وطني منضبط تتشكّل فيه الأفكار وتُنقّى قبل أن تتحول إلى قدرات أو تطبيقات. بوابة واحدة للابتكار التقني عالي الحساسية، تمنع التشتت والازدواجية والاستخدام غير المنضبط للأفكار.",en:"A controlled national space where ideas take shape and are refined before they become capabilities or applications. One door for high-sensitivity technical innovation, preventing fragmentation, duplication and uncontrolled use of ideas."}))}</p></div>
    <div class="acts"><button class="btn" id="enterBtn">${esc(t("enter"))}</button><a class="btn ghost" href="#os">${esc(t("work"))}</a></div>
  </div>
  <div class="wrap"><div class="plate">${esc(tx({ar:"سديم × الدولة",en:"SADEEM × the State"}))}</div><div class="valueRow">${VAL.map((v,i)=>`<div><i>0${i+1}</i>${esc(tx(v))}</div>`).join("")}</div>
   <div class="zoneList">${[["vision","VC"],["deck","02"],["lab","03"],["gate","04"],["bay","L1"],["drones","L2"],["factory","L3"],["twins","L4"],["missions","L5"],["library","06"],["radar","07"]].map(([z,n])=>`<a href="#${z}"><i>${n}</i><b>${esc(t("z_"+z))}</b><span>${esc(tx(DESC[z]))}</span></a>`).join("")}</div>
   <p class="disc">${esc(tx({ar:"لا تتضمن هذه المنصة آليات تشغيلية معتمدة. كل آلية معروضة هنا مقترحة، وتُستكمل تفاصيلها حصرياً في مراحل لاحقة وبموافقة رسمية.",en:"This platform contains no approved operational mechanisms. Every mechanism shown is proposed; details are completed exclusively in later phases with official approval."}))}</p></div>`;
  // Prefer the WebGL nebula; fall back to the 2D canvas if WebGL is unavailable.
  let neb3d=null,supportsGL=false;
  try{const c=document.createElement("canvas");supportsGL=!!(c.getContext("webgl")||c.getContext("experimental-webgl"))}catch(e){supportsGL=false}
  if(supportsGL&&window.Nebula3D&&window.loadThree){
    window.Nebula3D($("#nebula")).then(n=>{neb3d=n;if(pendingEnter)runEnter()}).catch(()=>{stopNeb=nebula($("#nebula"))});
    $("#arch").style.opacity=".5"; // the 3D scene carries its own hangar geometry; keep the SVG arch faint behind it
  }else{stopNeb=nebula($("#nebula"));}
  if(!RM){const arch=$("#arch"),core=$(".entryCore",el);
    const onMove=e=>{const dx=(e.clientX/innerWidth-.5),dy=(e.clientY/innerHeight-.5);if(arch)arch.style.transform=`translate(${dx*-22}px,${dy*-14}px) scale(1.06)`;if(core)core.style.transform=`translate(${dx*10}px,${dy*7}px)`};
    el.addEventListener("pointermove",onMove);}
  // cinematic intro: letterbox in, then the wordmark and door settle
  if(!RM){el.classList.add("cineIntro");setTimeout(()=>el.classList.add("cineReady"),80);setTimeout(()=>el.classList.remove("cineIntro"),2400);}
  const ths=$$("#th div");let pendingEnter=false;
  function runEnter(){const d=$("#door");const step=RM?60:460;
    ths.forEach((x,i)=>setTimeout(()=>x.classList.add("lit"),i*step));
    setTimeout(()=>{d.classList.add("open");if(neb3d)neb3d.open();window.FX&&FX.sound&&FX.sound("door");},step*3);
    el.classList.add("entering");
    setTimeout(()=>go("vision"),RM?300:step*3+2000);}
  $("#enterBtn").onclick=()=>{if(pendingEnter)return;pendingEnter=true;if(supportsGL&&!neb3d&&!stopNeb){/* wait for scene */}else runEnter();};
  $("#door").onclick=()=>$("#enterBtn").click();
 },
 unmount(){if(stopNeb)stopNeb();stopNeb=null;const c=$("#nebula");},
 insight(){return {role:{ar:"مضيف المنشأة",en:"Facility host"},lines:[{ar:"أنت أمام نقطة الدخول الوطنية الواحدة. سديم تعني السحابة التي تتكوّن منها النجوم: الأفكار تدخل مبعثرة وتخرج قدرات محددة.",en:"You stand at the single national entry point. Sadeem means the nebula stars form from: ideas enter diffuse and leave as defined capabilities."},{ar:"الدخول يمر بثلاث عتبات بترتيب المبادئ: الاحتواء، ثم التوجيه، ثم الحوكمة.",en:"Entry crosses three thresholds in the order of the principles: containment, then guidance, then governance."},{ar:"التصريح على الباب موثّق بمصدره ويُدار من نظام المحتوى.",en:"The statement on the door carries its source and is managed in the content system."}],actions:[{label:{ar:"ادخل",en:"Enter"},run:()=>$("#enterBtn")&&$("#enterBtn").click()},{label:{ar:"إلى العمل مباشرة",en:"Straight to work"},run:()=>go("os")}]}}
});
const VAL=[{ar:"مركزية سيادية لإدارة الابتكار عالي الحساسية",en:"Sovereign centralisation of high-sensitivity innovation"},{ar:"توحيد مرجعية الابتكار عالي الأثر",en:"A unified reference for high-impact innovation"},{ar:"استباق وطني بدل ردّ الفعل",en:"National anticipation instead of reaction"},{ar:"تقليل الهدر والمخاطر",en:"Less waste and risk"},{ar:"دعم الاكتفاء الذاتي وبناء قدرات وطنية مستدامة",en:"Self-sufficiency and sustainable national capabilities"},{ar:"رفع جودة المدخلات الفكرية للقطاع الدفاعي",en:"Higher-quality intellectual inputs to the defence sector"}];
const DESC={vision:{ar:"تصريحات القيادة كمعمار يقود القدرات",en:"Leadership statements as architecture that drives capability"},deck:{ar:"المحفظة الوطنية، الإحالات، مؤشرات سديم الستة",en:"National portfolio, referrals, the six SADEEM indicators"},lab:{ar:"من التجميع إلى التوجيه للجهة المختصة",en:"From collection to routing to the competent entity"},gate:{ar:"التصنيف والاحتواء قبل أي إطلاق",en:"Classification and containment before any launch"},bay:{ar:"منصات مرجعية تُفكّك إلى طبقاتها",en:"Reference platforms opened into their layers"},drones:{ar:"صمّم وشاهد المفاضلات الهندسية",en:"Design and see the engineering trade-offs"},factory:{ar:"خط واحد بين الحالي والمستقبلي",en:"One line between current and future"},twins:{ar:"غيّر المعامل وشاهد النتيجة",en:"Change a parameter, see the consequence"},missions:{ar:"خطّط مهمة واكتشف فجوات القدرة",en:"Plan a mission and find capability gaps"},library:{ar:"ما تعرفه الدولة، منظّماً للاكتشاف",en:"What the nation knows, organised for discovery"},radar:{ar:"التقنيات على أربعة آفاق",en:"Technologies on four horizons"}};

/* ---------- VISION CHAMBER ---------- */
const PILLARS=["VISION","KNOWLEDGE","INNOVATION","AMBITION","ENGINEERING","HUMAN CAPITAL","FUTURE"];
const CHAINS={
 VISION:[["deck",{ar:"منصة القيادة",en:"Command Deck"}],["lab",{ar:"مسار سديم",en:"SADEEM pipeline"}]],
 KNOWLEDGE:[["library",{ar:"المكتبة",en:"Library"}],["radar",{ar:"رادار التقنيات",en:"Technology Radar"}],["library",{ar:"مساعد البحث",en:"Research assistant"}],["lab",{ar:"جودة المدخلات الفكرية",en:"Quality of intellectual inputs"}]],
 INNOVATION:[["lab",{ar:"احتياجات الدولة",en:"National needs"}],["lab",{ar:"التجميع والتصنيف",en:"Collection & classification"}],["lab",{ar:"التقييم الوطني",en:"National evaluation"}],["lab",{ar:"التجربة والمتابعة",en:"Experiment & follow-up"}],["deck",{ar:"التوجيه للجهة المختصة",en:"Routing to the competent entity"}]],
 AMBITION:[["deck",{ar:"منصة القيادة",en:"Command Deck"}],["os",{ar:"المبادرات الوطنية المحتملة",en:"Possible national initiatives"}]],
 ENGINEERING:[["bay",{ar:"حظيرة المنصات",en:"Vehicle Bay"}],["drones",{ar:"مختبر الدرونات",en:"Drone Lab"}],["twins",{ar:"التوائم الرقمية",en:"Digital Twins"}],["missions",{ar:"هندسة المهام",en:"Mission Engineering"}]],
 "HUMAN CAPITAL":[["lab",{ar:"المواهب الوطنية",en:"National talent"}],["os",{ar:"الإنجازات",en:"Achievements"}]],
 FUTURE:[["radar",{ar:"الذكاء الاصطناعي",en:"AI"}],["twins",{ar:"التوائم الرقمية",en:"Digital Twins"}],["drones",{ar:"الأنظمة الذاتية",en:"Autonomous systems"}],["factory",{ar:"التصنيع المتقدم",en:"Advanced manufacturing"}],["gate",{ar:"الاكتفاء الذاتي",en:"Self-sufficiency"}]],
};
let cur="INNOVATION";
register("vision",{
 mount(el){
  el.insertAdjacentHTML("beforeend",`<div class="vcHall">
    <div class="wrap"><span class="kk">${esc(tx({ar:"قاعة الرؤية",en:"Vision Chamber"}))}</span>
     <p class="vcArc">${esc(tx({ar:"الرؤية ← القدرة ← الابتكار ← التنفيذ ← الأثر الوطني",en:"Vision → Capability → Innovation → Execution → National impact"}))}</p></div>
    <div class="vcStage"><div class="vcBeam" id="vcBeam"></div><div class="wrap"><div class="vcStmt" id="vcStmt"></div></div></div>
    <div class="wrap"><div class="vc" id="vc">${PILLARS.map(p=>`<button class="pillar" data-p="${p}" aria-pressed="${p===cur}"><span class="pBeam"></span><span class="pShaft"></span><b>${esc(t("pillars")[p])}</b></button>`).join("")}</div>
     <p class="vcHint">${esc(tx({ar:"المس عموداً لتقرأ التصريح الذي يقوده وتتبع الضوء إلى ما يحرّكه داخل سديم.",en:"Touch a pillar to read the statement it drives and follow the light to what it moves inside SADEEM."}))}</p>
     <div class="chain" id="chain"></div></div></div>`);
  $$(".pillar",el).forEach(b=>b.onclick=()=>{cur=b.dataset.p;$$(".pillar",el).forEach(x=>x.setAttribute("aria-pressed",x===b));render();ai.set({object:cur})});
  render();ai.set({object:cur});
  function render(){
    const qs=quotes();const q=qs.find(x=>x.pillar===cur)||qs.find(x=>x.pillar==="INNOVATION")||qs[0];
    const lang=H.L;const stmt=lang==="ar"&&q.ar?q.ar:lang==="en"&&q.en?q.en:(q.en||q.ar);
    const note=lang==="ar"&&!q.ar?t("arSurface"):lang==="en"&&!q.en?t("enSurface"):"";
    const words=stmt.split(/\s+/);
    $("#vcStmt").innerHTML=`<q class="rev" dir="${stmt===q.en?"ltr":"rtl"}" lang="${stmt===q.en?"en":"ar"}">${words.map((w,i)=>`<span style="animation-delay:${Math.min(i*.045,1.8)}s">${esc(w)} </span>`).join("")}</q><cite>${esc(tx(q.leader))} · ${esc(q.date)}</cite><div class="src">${esc(t("source"))}: <a href="${esc(q.sourceUrl)}" target="_blank" rel="noopener">${esc(q.source)}</a> · ${esc(tx(q.context))}${note?" · "+esc(note):""}</div>`;
    const ch=CHAINS[cur];$("#chain").innerHTML=`<span><b>${esc(t("pillars")[cur])}</b></span>`+ch.map(([z,l])=>`<i>→</i><a href="#${z}">${esc(tx(l))}</a>`).join("");
  }
 },
 insight(c){const p=c.object||cur;return {role:{ar:"مرشد الرؤية",en:"Vision guide"},lines:[{ar:`العمود المختار: ${t("pillars")[p]}. كل تصريح هنا مرتبط بمصدره، وكل عمود يضيء مسارات حقيقية داخل سديم.`,en:`Selected pillar: ${p}. Every statement carries its source, and every pillar lights real paths inside SADEEM.`},{ar:"التصريح بلغة غير متوفرة رسمياً يُعرض بلغته الأصلية فقط، ولا يُترجم آلياً.",en:"A statement without official wording in one language is shown only in its original language, never machine-translated."}],actions:[{label:{ar:"افتح نظام المحتوى",en:"Open the content system"},run:()=>{H.ctx.state={osView:"quotes"};go("os")}}]}}
});
})();
