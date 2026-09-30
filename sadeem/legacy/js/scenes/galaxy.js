/* SADEEM HANGAR · The National Constellation.
   The whole portfolio rendered as a living galaxy: every idea is a star. Angle = domain, radius = pipeline
   station (a diffuse outer nebula of new ideas drawn inward to the SADEEM core), brightness = national score,
   contained ideas are sealed dark motes. On entry the stars fly in from the rim and the galaxy forms itself.
   WebGL; if unavailable the zone shows a 2D fallback map. */
(function(){
const {$,$$,esc,t,tx,num,go,register,ai,allIdeas,DOMAINS,SOURCES,RM}=H;
const DOMS=["land","air","cyber","mfg"];
const DCOL={land:[0.78,0.62,0.32],air:[0.44,0.66,0.90],cyber:[0.36,0.73,0.60],mfg:[0.86,0.55,0.28]};
const CONT=[0.72,0.22,0.20];
const contained=i=>i.sens==="high"||H.DB.gate.some(g=>g.idea===i.id&&g.level==="high");
const scoreOf=i=>i.score||(i.st>=6?70:50);

register("galaxy",{
 async mount(el){
  el.innerHTML=`<div class="galaxyWrap">
    <canvas id="galCv"></canvas>
    <div class="galHead"><span class="kk">${esc(tx({ar:"الكوكبة الوطنية",en:"The National Constellation"}))}</span>
     <h1>${esc(tx({ar:"المحفظة الوطنية كمجرّة حيّة",en:"The national portfolio as a living galaxy"}))}</h1>
     <p>${esc(tx({ar:"كل فكرة نجمة: تدخل سديماً في الأطراف وتُسحب نحو نواة سديم عبر إحدى عشرة محطة، حتى تشتعل قدرةً وطنية. اسحب للدوران، والمس نجمة لتفتحها.",en:"Every idea is a star: it enters as nebula at the rim and is drawn toward the SADEEM core through eleven stations, until it ignites as a national capability. Drag to orbit, touch a star to open it."}))}</p></div>
    <div class="galLegend" id="galLegend"></div>
    <div class="galRings" id="galRings"></div>
    <div class="galCard" id="galCard" hidden></div>
    <p class="galNote">${esc(t("proposed"))} · ${esc(tx({ar:"البيانات مثال توضيحي",en:"data shown is illustrative"}))}</p>
   </div>`;
  const ideas=allIdeas();
  // legend
  $("#galLegend").innerHTML=DOMS.map(d=>`<span class="glg"><i style="background:rgb(${DCOL[d].map(c=>Math.round(c*255)).join(",")})"></i>${esc(tx(DOMAINS[d]))}</span>`).join("")
    +`<span class="glg"><i style="background:rgb(184,56,51)"></i>${esc(tx({ar:"محتواة",en:"contained"}))}</span>`;
  // radial ring labels (outer = new, inner = routed)
  $("#galRings").innerHTML=[[t("stage")[0],"92%"],[t("stage")[5],"58%"],[t("stage")[10],"20%"]].map(([lab,r])=>`<span style="--r:${r}">${esc(lab)}</span>`).join("");

  let supportsGL=false;try{const c=document.createElement("canvas");supportsGL=!!(c.getContext("webgl")||c.getContext("experimental-webgl"))}catch(e){}
  if(!supportsGL||!window.loadThree){fallback(el,ideas);return}
  let T;try{T=await window.loadThree()}catch(e){fallback(el,ideas);return}
  if(H.ctx.zone!=="galaxy")return; // navigated away while loading

  const cv=$("#galCv");
  const R=new T.WebGLRenderer({canvas:cv,antialias:false,alpha:true,powerPreference:"high-performance"});
  R.setPixelRatio(Math.min(devicePixelRatio||1,1.7));R.setClearColor(0x000000,0);
  const S=new T.Scene();S.fog=new T.FogExp2(0x0E0C08,0.035);
  const CAM=new T.PerspectiveCamera(46,1,.1,120);CAM.position.set(0,7,17);

  // ---- ambient dust (non-interactive) ----
  const DN=innerWidth<700?1400:3200,dpos=new Float32Array(DN*3),dcol=new Float32Array(DN*3);
  for(let i=0;i<DN;i++){const a=Math.random()*Math.PI*2,rr=2+Math.pow(Math.random(),.6)*12,y=(Math.random()-.5)*3.2*(1-rr/16);
    dpos.set([Math.cos(a)*rr,y,Math.sin(a)*rr],i*3);const b=.5+Math.random()*.5;dcol.set([0.66*b,0.55*b,0.33*b],i*3)}
  const dg=new T.BufferGeometry();dg.setAttribute("position",new T.BufferAttribute(dpos,3));dg.setAttribute("color",new T.BufferAttribute(dcol,3));
  const dust=new T.Points(dg,new T.PointsMaterial({size:.06,vertexColors:true,transparent:true,opacity:.5,depthWrite:false,blending:T.AdditiveBlending}));
  S.add(dust);

  // ---- idea stars (interactive) ----
  const N=ideas.length;
  const pos=new Float32Array(N*3),start=new Float32Array(N*3),col=new Float32Array(N*3),siz=new Float32Array(N);
  const domAng={land:0,air:Math.PI/2,cyber:Math.PI,mfg:3*Math.PI/2};
  ideas.forEach((it,i)=>{
    const st=Math.max(0,Math.min(11,it.st));
    const r=2.2+(11-st)/11*8.6;                                   // outer = new, inner = routed
    const base=domAng[it.area]!=null?domAng[it.area]:0;
    const seed=[...String(it.id)].reduce((a,c)=>a+c.charCodeAt(0),0);
    const ang=base+((seed%70)-35)*Math.PI/180;                    // ±35° sector jitter
    const y=((seed%13)/13-.5)*2.6*(1-st/14)+Math.sin(seed)*0.3;
    pos.set([Math.cos(ang)*r,y,Math.sin(ang)*r],i*3);
    const rimA=Math.random()*Math.PI*2,rimR=13+Math.random()*4;
    start.set([Math.cos(rimA)*rimR,(Math.random()-.5)*5,Math.sin(rimA)*rimR],i*3);
    const c=contained(it)?CONT:(DCOL[it.area]||[0.8,0.7,0.4]);col.set(c,i*3);
    siz[i]=contained(it)?1.8:(2.0+scoreOf(it)/100*3.6+(st>=10?2.4:0));
  });
  const g=new T.BufferGeometry();g.setAttribute("position",new T.BufferAttribute(start.slice(),3));g.setAttribute("aColor",new T.BufferAttribute(col,3));g.setAttribute("aSize",new T.BufferAttribute(siz,1));
  const U={uPix:{value:Math.min(devicePixelRatio||1,1.7)},uT:{value:0}};
  const VS="uniform float uPix,uT;attribute vec3 aColor;attribute float aSize;varying vec3 vC;varying float vTw;void main(){vC=aColor;vTw=0.75+0.25*sin(uT*2.0+position.x*3.0+position.z*2.0);vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*uPix*(120.0/-mv.z);gl_Position=projectionMatrix*mv;}";
  const FS="precision mediump float;varying vec3 vC;varying float vTw;void main(){vec2 c=gl_PointCoord-0.5;float d=length(c);float a=smoothstep(0.5,0.06,d);float core=smoothstep(0.22,0.0,d);vec3 col=mix(vC,vec3(1.0),core*0.7);gl_FragColor=vec4(col*vTw,a);}";
  const M=new T.ShaderMaterial({uniforms:U,vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  const stars=new T.Points(g,M);S.add(stars);

  // ---- core: the SADEEM four-point star ----
  const coreShape=(()=>{const s=new T.Shape();const R1=1.15,R2=.32;for(let k=0;k<8;k++){const a=k*Math.PI/4-Math.PI/2;const rr=k%2?R2:R1;const x=Math.cos(a)*rr,y=Math.sin(a)*rr;k?s.lineTo(x,y):s.moveTo(x,y)}s.closePath();return s})();
  const coreGeo=new T.ShapeGeometry(coreShape);
  const core=new T.Mesh(coreGeo,new T.MeshBasicMaterial({color:0xE7CE92,transparent:true,opacity:.95,side:T.DoubleSide}));
  core.rotation.x=-Math.PI/2;S.add(core);
  const halo=new T.Mesh(new T.CircleGeometry(2.4,48),new T.MeshBasicMaterial({color:0xC8A45C,transparent:true,opacity:.12,blending:T.AdditiveBlending,depthWrite:false}));
  halo.rotation.x=-Math.PI/2;halo.position.y=-.02;S.add(halo);
  // routed capabilities orbit the core
  const routed=ideas.filter(it=>it.st>=10&&!contained(it));

  // ---- interaction ----
  const ray=new T.Raycaster();ray.params.Points.threshold=1.1;const mouse=new T.Vector2();
  let hoverI=-1,focusI=-1;
  const orb={th:.6,ph:.95,r:19,tth:.6,tph:.95,tr:19,drag:false,px:0,py:0,user:0};
  function pick(cx,cy){const rect=cv.getBoundingClientRect();mouse.x=((cx-rect.left)/rect.width)*2-1;mouse.y=-((cy-rect.top)/rect.height)*2+1;ray.setFromCamera(mouse,CAM);const hits=ray.intersectObject(stars);return hits.length?hits[0].index:-1}
  cv.addEventListener("pointerdown",e=>{orb.drag=true;orb.px=e.clientX;orb.py=e.clientY;orb.moved=false;cv.setPointerCapture(e.pointerId);orb.user=performance.now()});
  cv.addEventListener("pointermove",e=>{
    if(orb.drag){const dx=e.clientX-orb.px,dy=e.clientY-orb.py;if(Math.abs(dx)+Math.abs(dy)>4)orb.moved=true;orb.tth-=dx*.006;orb.tph=Math.max(.25,Math.min(1.4,orb.tph-dy*.005));orb.px=e.clientX;orb.py=e.clientY;orb.user=performance.now()}
    else{const idx=pick(e.clientX,e.clientY);if(idx!==hoverI){hoverI=idx;cv.style.cursor=idx>=0?"pointer":"grab"}}
  });
  cv.addEventListener("pointerup",e=>{orb.drag=false;if(!orb.moved){const idx=pick(e.clientX,e.clientY);if(idx>=0)openCard(idx)}});
  cv.addEventListener("wheel",e=>{e.preventDefault();orb.tr=Math.max(7,Math.min(34,orb.tr*(1+Math.sign(e.deltaY)*.08)));orb.user=performance.now()},{passive:false});
  cv.style.cursor="grab";

  function openCard(i){focusI=i;const it=ideas[i];const c=$("#galCard");const cont=contained(it);
    const st=t("stage")[Math.max(0,Math.min(11,it.st))];
    c.hidden=false;c.innerHTML=`<button class="galX" aria-label="close">✕</button>
      ${cont?`<span class="tag warn">${esc(t("contained"))}</span><b class="gcT">${esc(tx({ar:"سجل محتوى",en:"Contained record"}))}</b><p class="gcM">${esc(tx({ar:"المحتوى محجوب. تظهر الحالة فقط، ولا يُرسل النص إلى أي نموذج خارجي.",en:"Content withheld. Only the status shows; the text is never sent to an external model."}))}</p>`
      :`<span class="tag ${it.st>=10?"good":it.st>=6?"sov":""}">${esc(it.id)}</span><b class="gcT">${esc(tx(it.t))}</b>
        <div class="gcKv"><span>${esc(tx({ar:"المجال",en:"Domain"}))}</span><b>${esc(tx(DOMAINS[it.area]||{ar:"",en:""}))}</b>
         <span>${esc(tx({ar:"المصدر",en:"Source"}))}</span><b>${esc(tx(SOURCES[it.src]||it.owner))}</b>
         <span>${esc(tx({ar:"المحطة",en:"Station"}))}</span><b>${esc(st)} · ${num(it.st+1)}/11</b>
         <span>${esc(tx({ar:"التقييم الوطني",en:"National score"}))}</span><b>${num(scoreOf(it))}/100</b></div>`}
      <div class="gcB"><button class="btn sm" data-open>${esc(tx({ar:"افتح في المسار",en:"Open in the pipeline"}))}</button></div>`;
    $(".galX",c).onclick=()=>{c.hidden=true;focusI=-1};
    $("[data-open]",c).onclick=()=>{H.ctx.state={openIdea:it.id};go("lab")};
    ai.set({object:it.id});
  }

  function size(){const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;R.setSize(w,h,false);CAM.aspect=w/h;CAM.updateProjectionMatrix()}
  size();const ro=new ResizeObserver(size);ro.observe(cv);

  let raf=0,t0=performance.now(),form=RM?1:0,stopped=false;
  const target=new T.Vector3(0,0,0);
  function frame(now){if(stopped)return;raf=requestAnimationFrame(frame);const tt=(now-t0)/1000;U.uT.value=tt;
    if(form<1){form=Math.min(1,form+.012);const e=1-Math.pow(1-form,3);const p=g.attributes.position.array;
      for(let i=0;i<N*3;i++)p[i]=start[i]+(pos[i]-start[i])*e;g.attributes.position.needsUpdate=true}
    // idle auto-rotate
    if(performance.now()-orb.user>4000&&!RM)orb.tth+=.0015;
    orb.th+=(orb.tth-orb.th)*.08;orb.ph+=(orb.tph-orb.ph)*.08;orb.r+=(orb.tr-orb.r)*.08;
    CAM.position.set(Math.sin(orb.th)*Math.cos(orb.ph)*orb.r,Math.sin(orb.ph)*orb.r+2,Math.cos(orb.th)*Math.cos(orb.ph)*orb.r);
    if(focusI>=0){target.set(pos[focusI*3],pos[focusI*3+1],pos[focusI*3+2]).multiplyScalar(.5)}else target.lerp(new T.Vector3(0,0,0),.1);
    CAM.lookAt(target);
    core.lookAt(CAM.position);core.rotation.z=tt*.15;
    halo.material.opacity=.10+.04*Math.sin(tt*1.2);
    dust.rotation.y=tt*.01;stars.rotation.y=0;
    R.render(S,CAM)}
  raf=requestAnimationFrame(frame);

  this._cleanup=()=>{stopped=true;cancelAnimationFrame(raf);ro.disconnect();try{R.dispose();g.dispose();dg.dispose()}catch(e){}};
 },
 unmount(){if(this._cleanup)this._cleanup();this._cleanup=null},
 insight(c){const ideas=allIdeas();const routed=ideas.filter(i=>i.st>=10).length;const cont=ideas.filter(contained).length;
  const it=c.object&&ideas.find(x=>x.id===c.object);
  if(it&&!contained(it))return {role:{ar:"مرشد الكوكبة",en:"Constellation guide"},lines:[{ar:`${it.id}: ${tx(it.t)} — عند «${t("stage")[it.st]}»، تقييم ${num(scoreOf(it))}. كلما اقتربت النجمة من النواة اقتربت من أن تصبح قدرة وطنية.`,en:`${it.id}: ${tx(it.t)} — at '${t("stage")[it.st]}', score ${scoreOf(it)}. The closer a star sits to the core, the closer it is to becoming a national capability.`}],actions:[{label:{ar:"افتح في المسار",en:"Open in the pipeline"},run:()=>{H.ctx.state={openIdea:it.id};go("lab")}}]};
  return {role:{ar:"مرشد الكوكبة",en:"Constellation guide"},lines:[{ar:`الكوكبة تعرض ${num(ideas.length)} فكرة كنجوم: الزاوية مجالها، والبُعد عن النواة محطتها. ${num(routed)} وصلت للتوجيه كقدرات وطنية.`,en:`The constellation shows ${ideas.length} ideas as stars: angle is domain, distance from the core is station. ${routed} reached routing as national capabilities.`},{ar:`النجوم الداكنة الحمراء (${num(cont)}) سجلات محتواة؛ تظهر مكانها دون محتواها.`,en:`The dark red stars (${cont}) are contained records; their place shows, their content does not.`}]}}
});

function fallback(el,ideas){
  const wrap=$(".galaxyWrap",el);if(wrap)$("#galCv",el).style.display="none";
  const byStation={};ideas.forEach(i=>{(byStation[i.st]=byStation[i.st]||[]).push(i)});
  const rows=Object.keys(byStation).sort((a,b)=>b-a).map(st=>`<div class="galRow"><b>${esc(H.t("stage")[st])}</b><div>${byStation[st].map(i=>`<span class="galDot" data-i="${esc(i.id)}" style="background:rgb(${(contained(i)?CONT:(DCOL[i.area]||[.8,.7,.4])).map(c=>Math.round(c*255)).join(",")})" title="${esc(tx(i.t))}"></span>`).join("")}</div></div>`).join("");
  el.querySelector(".galRings").insertAdjacentHTML("afterend",`<div class="galFallback">${rows}</div>`);
  $$(".galDot",el).forEach(d=>d.onclick=()=>{H.ctx.state={openIdea:d.dataset.i};go("lab")});
}
})();
