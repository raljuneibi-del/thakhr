/* SADEEM HANGAR · cinematic layer: zone transitions, spotlight, reveal-on-mount, count-up, facility map, guided tour */
(function(){
const {$,$$,go,RM,esc}=H;
const FX={};window.FX=FX;

/* ---------- light-wipe transition between zones ---------- */
let wiping=false;
FX.wipe=function(cb){
  if(RM){cb&&cb();return}
  const w=document.createElement("div");w.className="fxwipe";document.body.appendChild(w);
  requestAnimationFrame(()=>w.classList.add("in"));
  setTimeout(()=>{cb&&cb();w.classList.add("out");setTimeout(()=>w.remove(),620)},420);
};

/* ---------- pointer spotlight that follows the cursor over dark zones ---------- */
let spotEl=null;
function ensureSpot(){if(spotEl)return spotEl;spotEl=document.createElement("div");spotEl.className="fxspot";document.body.appendChild(spotEl);return spotEl}
addEventListener("pointermove",e=>{if(RM)return;const dark=document.body.dataset.zone;if(!["arrival","vision","bay","gate","radar"].includes(dark)){if(spotEl)spotEl.style.opacity="0";return}
  const s=ensureSpot();s.style.opacity="1";s.style.setProperty("--mx",e.clientX+"px");s.style.setProperty("--my",e.clientY+"px")},{passive:true});

/* ---------- reveal-on-scroll for panels ---------- */
let io=null;
FX.reveal=function(root){
  if(RM)return;
  if(!io)io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target)}}),{threshold:.08,rootMargin:"0px 0px -6% 0px"});
  const r=root||document;
  $$(".panel, .stat, .zoneList a, .book, .valueRow, .vc, .journey, .radar, .line",r).forEach(el=>el.classList.add("rv"));
  $$(".rv",r).forEach((el,i)=>{el.style.setProperty("--d",(Math.min(i,8)*55)+"ms");io.observe(el)});
};

/* ---------- count-up on numeric tiles ---------- */
FX.count=function(root){
  if(RM)return;
  $$("[data-count]",root||document).forEach(el=>{
    const raw=el.getAttribute("data-count");const end=parseFloat(raw);if(isNaN(end))return;
    const dur=800,t0=performance.now(),pre=el.dataset.pre||"",suf=el.dataset.suf||"";
    const step=n=>{const p=Math.min(1,(n-t0)/dur);const e=1-Math.pow(1-p,3);const v=Math.round(end*e);el.textContent=pre+H.num(v)+suf;if(p<1)requestAnimationFrame(step)};
    requestAnimationFrame(step);
  });
};

/* ---------- facility map overlay ---------- */
const MAP=[
 {z:"deck",x:20,y:16,w:26,h:14,n:{ar:"منصة القيادة",en:"Command Deck"},lvl:"mezz"},
 {z:"radar",x:37,y:16,w:26,h:14,n:{ar:"رادار التقنيات",en:"Radar"},lvl:"mezz"},
 {z:"library",x:54,y:16,w:26,h:14,n:{ar:"المكتبة",en:"Library"},lvl:"mezz"},
 {z:"bay",x:6,y:36,w:22,h:42,n:{ar:"المختبرات",en:"Capability labs"},lvl:"ground",labs:1},
 {z:"vision",x:34,y:34,w:32,h:12,n:{ar:"قاعة الرؤية",en:"Vision Chamber"},lvl:"ground"},
 {z:"lab",x:34,y:48,w:32,h:22,n:{ar:"مسار سديم",en:"Pipeline Hall"},lvl:"ground",main:1},
 {z:"gate",x:34,y:72,w:32,h:8,n:{ar:"قبو الاحتواء",en:"Containment Vault"},lvl:"ground",vault:1},
 {z:"arrival",x:6,y:84,w:74,h:8,n:{ar:"المدخل الوطني الواحد",en:"Single Entry Point"},lvl:"entry"},
];
FX.map=function(){
  let ov=$("#fxmap");
  if(ov){ov.remove();return}
  ov=document.createElement("div");ov.id="fxmap";ov.className="fxmap";
  const L=H.L;
  ov.innerHTML=`<div class="fxmapBox" role="dialog" aria-label="${L==="ar"?"خريطة المنشأة":"Facility map"}">
    <div class="fxmapHead"><b>${L==="ar"?"خريطة المنشأة":"Facility map"}</b><button class="fxmapX" aria-label="close">✕</button></div>
    <div class="fxmapPlan">${MAP.map(m=>`<button class="fxmapZone ${m.main?"main":""} ${m.vault?"vault":""}" data-z="${m.z}" style="left:${m.x}%;top:${m.y}%;width:${m.w}%;height:${m.h}%" ${document.body.dataset.zone===m.z?'aria-current="page"':""}><span>${esc(L==="ar"?m.n.ar:m.n.en)}</span></button>`).join("")}
      <div class="fxmapAxis fxmapMezz">${L==="ar"?"الطابق العلوي":"MEZZANINE"}</div>
      <div class="fxmapAxis fxmapGround">${L==="ar"?"الطابق الأرضي":"GROUND"}</div>
    </div>
    <p class="fxmapNote">${L==="ar"?"المس منطقة للانتقال إليها. الطريق الوحيد للداخل هو المدخل الوطني الواحد.":"Touch a zone to move to it. The only way in is the single national entry point."}</p></div>`;
  document.body.appendChild(ov);
  const close=()=>ov.remove();
  ov.addEventListener("click",e=>{if(e.target===ov)close()});
  $(".fxmapX",ov).onclick=close;
  $$(".fxmapZone",ov).forEach(b=>b.onclick=()=>{close();go(b.dataset.z)});
  addEventListener("keydown",function esc(e){if(e.key==="Escape"){close();removeEventListener("keydown",esc)}});
};

/* ---------- guided tour (for delegations): walks the key zones with captions ---------- */
const TOUR=[
 {z:"arrival",ar:"نبدأ من المدخل الوطني الواحد: كل فكرة عالية الحساسية تدخل من هنا، فلا تشتت ولا ازدواجية.",en:"We begin at the single national entry point: every high-sensitivity idea enters here, so nothing is fragmented or duplicated."},
 {z:"vision",ar:"قاعة الرؤية تربط تصريحات القيادة بما يحرّكه كل مبدأ داخل سديم.",en:"The Vision Chamber links leadership statements to what each principle drives inside SADEEM."},
 {z:"lab",ar:"مسار سديم: إحدى عشرة محطة من التجميع إلى التوجيه للجهة الوطنية المختصة.",en:"The SADEEM pipeline: eleven stations from collection to routing to the competent national entity."},
 {z:"gate",ar:"قبو الاحتواء: التصنيف قبل الإطلاق، والفكرة الحساسة تُختم ولا تغادر الإطار السيادي.",en:"The Containment Vault: classification before launch; a sensitive idea is sealed and never leaves the sovereign frame."},
 {z:"deck",ar:"منصة القيادة تعطي الجهة المعتمِدة صورة القرار: أين يتعطّل المسار وما ينتظر الاعتماد.",en:"The Command Deck gives the authority a decision view: where the pipeline stalls and what awaits approval."},
 {z:"radar",ar:"رادار التقنيات ومختبرات القدرة تختم الجولة: من الفكرة إلى قدرة وطنية.",en:"The Technology Radar and capability labs close the tour: from an idea to a national capability."},
];
let tourI=-1,tourBar=null;
FX.tour=function(start){
  if(start===false||tourI>=TOUR.length-1&&start!==0){FX.tourEnd();if(start!==0)return}
  tourI=(start===0?0:tourI+1);
  const step=TOUR[tourI];const L=H.L;
  go(step.z);
  if(!tourBar){tourBar=document.createElement("div");tourBar.className="fxtour";document.body.appendChild(tourBar)}
  tourBar.innerHTML=`<div class="fxtourIn"><span class="fxtourN">${H.num(tourI+1)}/${H.num(TOUR.length)}</span><p>${esc(L==="ar"?step.ar:step.en)}</p><div class="fxtourB"><button class="fxtourX">${L==="ar"?"إنهاء":"End"}</button><button class="fxtourNext">${tourI<TOUR.length-1?(L==="ar"?"التالي":"Next"):(L==="ar"?"تم":"Done")}</button></div></div>`;
  $(".fxtourNext",tourBar).onclick=()=>tourI<TOUR.length-1?FX.tour():FX.tourEnd();
  $(".fxtourX",tourBar).onclick=()=>FX.tourEnd();
  requestAnimationFrame(()=>tourBar.classList.add("in"));
};
FX.tourEnd=function(){tourI=-1;if(tourBar){tourBar.classList.remove("in");const b=tourBar;tourBar=null;setTimeout(()=>b.remove(),400)}};

/* ---------- film grain layer (shown only on the dark cinematic zones via CSS) ---------- */
(function(){if(RM)return;const g=document.createElement("div");g.className="grainLayer";g.setAttribute("aria-hidden","true");document.body.appendChild(g)})();

/* ---------- ambient sound: opt-in, synthesized (no external files) ---------- */
let AC=null,ambientGain=null,ambientOn=false;
function ctx(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=null}}return AC}
FX.sound=function(kind){
  if(!ambientOn)return;const a=ctx();if(!a)return;const now=a.currentTime;
  const beep=(f,d,type,g)=>{const o=a.createOscillator(),v=a.createGain();o.type=type||"sine";o.frequency.value=f;o.connect(v);v.connect(a.destination);v.gain.setValueAtTime(0,now);v.gain.linearRampToValueAtTime(g||.06,now+.02);v.gain.exponentialRampToValueAtTime(.0001,now+d);o.start(now);o.stop(now+d+.05)};
  if(kind==="door"){beep(180,1.1,"sine",.05);beep(90,1.4,"sine",.04)}
  else if(kind==="seal"){beep(140,.5,"triangle",.06);setTimeout(()=>beep(70,.7,"sine",.05),160)}
  else if(kind==="move"){beep(320,.18,"sine",.03)}
  else if(kind==="reveal"){beep(520,.3,"sine",.025)}
};
FX.ambient=function(on){
  const a=ctx();if(!a)return false;
  if(on&&!ambientOn){if(a.state==="suspended")a.resume();
    ambientOn=true;
    // a low sovereign drone: two detuned oscillators through a slow-moving filter
    ambientGain=a.createGain();ambientGain.gain.value=0;ambientGain.connect(a.destination);
    const filt=a.createBiquadFilter();filt.type="lowpass";filt.frequency.value=420;filt.Q.value=6;filt.connect(ambientGain);
    const o1=a.createOscillator();o1.type="sawtooth";o1.frequency.value=55;
    const o2=a.createOscillator();o2.type="sawtooth";o2.frequency.value=55.4;
    o1.connect(filt);o2.connect(filt);o1.start();o2.start();
    const lfo=a.createOscillator();lfo.frequency.value=.06;const lg=a.createGain();lg.gain.value=120;lfo.connect(lg);lg.connect(filt.frequency);lfo.start();
    ambientGain.gain.linearRampToValueAtTime(.03,a.currentTime+2);
    FX._amb={o1,o2,lfo};
  }else if(!on&&ambientOn){ambientOn=false;if(ambientGain)ambientGain.gain.linearRampToValueAtTime(0,a.currentTime+.8);
    setTimeout(()=>{try{FX._amb.o1.stop();FX._amb.o2.stop();FX._amb.lfo.stop()}catch(e){}},900)}
  return ambientOn;
};

/* ---------- SVG geometry tween: animate numeric attributes/props over t (used by labs) ---------- */
FX.tween=function(dur,fn,done){
  if(RM){fn(1);done&&done();return{cancel(){}}}
  const t0=performance.now();let id=0,killed=false;
  const step=n=>{if(killed)return;const p=Math.min(1,(n-t0)/dur);const e=1-Math.pow(1-p,3);fn(e);if(p<1)id=requestAnimationFrame(step);else done&&done()};
  id=requestAnimationFrame(step);return{cancel(){killed=true;cancelAnimationFrame(id)}};
};

/* ---------- keyboard shortcuts: number keys jump between the main zones ---------- */
const JUMP={"1":"arrival","2":"vision","3":"deck","4":"lab","5":"gate","6":"bay","7":"radar","0":"os"};
addEventListener("keydown",e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;const tag=(e.target.tagName||"").toLowerCase();
  if(tag==="input"||tag==="textarea"||tag==="select")return;
  if(JUMP[e.key]){go(JUMP[e.key])}
  else if(e.key.toLowerCase()==="m"){FX.map()}
});

})();
