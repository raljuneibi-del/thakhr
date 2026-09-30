/* SADEEM HANGAR · The Foresight Telescope — "capability sky".
   Anticipation, not reaction (a stated SADEEM × State value), made literal: scrub the portfolio forward in time
   and watch which ideas ignite into national capabilities and WHEN — and, crucially, which national needs stay
   dark voids with nothing heading toward them. A deterministic, illustrative projection; not a forecast of record. */
(function(){
const {$,$$,esc,t,tx,num,go,register,ai,allIdeas,DOMAINS,CHALLENGES,SOURCES,RM}=H;
const DCOL={land:"#C8A45C",air:"#6FA8E6",cyber:"#5FB79B",mfg:"#DB8E48"};
const contained=i=>i.sens==="high"||H.DB.gate.some(g=>g.idea===i.id&&g.level==="high");
const scoreOf=i=>i.score||(i.st>=6?70:50);
/* stations advanced per projected year: momentum from score; contained records move slower (extra scrutiny) */
const velOf=i=>(0.75+scoreOf(i)/100*1.5)*(contained(i)?0.55:1);

register("foresight",{
 mount(el){
  const NEEDS=CHALLENGES;                 // national needs sit on the rim
  const ideas=allIdeas();
  // assign each idea an angle under the sector of the need it serves (unlinked → neutral sector)
  const sectors={};const step=2*Math.PI/(NEEDS.length+1);
  NEEDS.forEach((n,k)=>sectors[n.id]=-Math.PI/2+step*(k+1));
  const neutral=-Math.PI/2;
  const NEEDDOM={"N-01":"land","N-02":"air","N-03":"mfg","N-04":"cyber","N-05":"land"};
  const setAng=it=>{const seed=[...String(it.id)].reduce((a,c)=>a+c.charCodeAt(0),0);it._ang=(sectors[it.ch]!=null?sectors[it.ch]:neutral)+((seed%38)-19)*Math.PI/180;it._seed=seed};
  ideas.forEach(setAng);
  // "what-if" scenario: launching a challenge injects illustrative inbound ideas toward a need
  let scenario=[],scnN=0;
  const pool=()=>ideas.concat(scenario);
  function launch(needId){const dom=NEEDDOM[needId]||"land";for(let k=0;k<3;k++){const it={id:"WHATIF-"+(++scnN),t:{ar:"فكرة مقترحة عبر تحدٍّ",en:"Idea drawn by a challenge"},area:dom,src:"talent",ch:needId,st:1,score:64+k*6,ghost:1};setAng(it);scenario.push(it)}renderWhatif();draw()}
  function resetScn(){scenario=[];renderWhatif();draw()}

  el.innerHTML=`<div class="fsWrap">
    <div class="fsHead"><span class="kk">${esc(tx({ar:"المرصد",en:"The Foresight Telescope"}))}</span>
     <h1>${esc(tx({ar:"سماء القدرات القادمة",en:"The sky of coming capabilities"}))}</h1>
     <p>${esc(tx({ar:"استباق وطني بدل ردّ الفعل: حرّك الزمن لترى أي فكرة ستشتعل قدرةً وطنية ومتى، وأي احتياج وطني سيبقى فراغاً مظلماً بلا مسار يغذّيه.",en:"Anticipation, not reaction: move time to see which ideas will ignite as national capabilities and when — and which national needs stay dark voids with nothing heading toward them."}))}</p></div>
    <div class="fsStage"><canvas id="fsCv"></canvas>
      <div class="fsReadout" id="fsRead"></div></div>
    <div class="fsControls">
      <button class="btn sm" id="fsPlay">▶ ${esc(tx({ar:"شغّل الزمن",en:"Run time"}))}</button>
      <div class="fsSlider"><span id="fsYear">${esc(tx({ar:"اليوم",en:"Today"}))}</span><input type="range" id="fsRange" min="0" max="60" value="0" aria-label="years"></div>
      <span class="galNote" style="position:static;display:block">${esc(t("proposed"))} · ${esc(tx({ar:"إسقاط توضيحي",en:"illustrative projection"}))}</span>
    </div>
    <div class="fsWhatif" id="fsWhatif"></div>
    <div class="fsLegend" id="fsLegend"></div>
   </div>`;
  $("#fsLegend").innerHTML=Object.keys(DCOL).map(d=>`<span class="glg"><i style="background:${DCOL[d]}"></i>${esc(tx(DOMAINS[d]))}</span>`).join("")
    +`<span class="glg"><i style="background:var(--good)"></i>${esc(tx({ar:"احتياج مغطّى",en:"need covered"}))}</span>`
    +`<span class="glg"><i style="background:var(--crit)"></i>${esc(tx({ar:"فراغ قدرة",en:"capability void"}))}</span>`;

  const cv=$("#fsCv"),x=cv.getContext("2d");let W,H0,dpr,cx,cy,Rmax;
  function size(){dpr=Math.min(devicePixelRatio||1,2);W=cv.clientWidth;H0=cv.clientHeight;cv.width=W*dpr;cv.height=H0*dpr;x.setTransform(dpr,0,0,dpr,0,0);cx=W/2;cy=H0/2;Rmax=Math.min(W,H0)/2-28}
  const ro=new ResizeObserver(size);ro.observe(cv);size();

  let year=0,playing=false,raf=0,tw=0,hover=null;
  const rOf=projSt=>Rmax*(0.14+(11-Math.max(0,Math.min(11,projSt)))/11*0.82);
  function projected(y){y=(y==null?year:y);return pool().map(it=>{const ps=Math.min(11,it.st+velOf(it)*y);return {it,ps,ignited:ps>=10,r:rOf(ps),ang:it._ang}})}
  function needStatus(proj){const m={};NEEDS.forEach(n=>{const linked=proj.filter(p=>p.it.ch===n.id&&!contained(p.it));const reaching=linked.filter(p=>p.ps>=9.5).length;const heading=linked.filter(p=>p.ps>=6).length;m[n.id]={reaching,heading,void:reaching===0}});return m}

  function draw(){
    x.clearRect(0,0,W,H0);
    // deep space wash
    const bg=x.createRadialGradient(cx,cy,0,cx,cy,Rmax*1.3);bg.addColorStop(0,"rgba(200,164,92,.06)");bg.addColorStop(1,"rgba(14,12,8,0)");x.fillStyle=bg;x.fillRect(0,0,W,H0);
    // horizon rings + station labels (outer=new, inner=routed)
    x.font="10px 'IBM Plex Mono',monospace";x.textAlign="center";
    [[0,t("stage")[0]],[5,t("stage")[5]],[10,t("stage")[10]]].forEach(([st,lab])=>{const r=rOf(st);x.beginPath();x.arc(cx,cy,r,0,7);x.strokeStyle="rgba(200,164,92,.14)";x.lineWidth=1;x.stroke();
      x.fillStyle="rgba(143,135,114,.9)";x.fillText(lab,cx,cy-r-6)});
    const proj=projected(),ns=needStatus(proj);
    // national needs as rim arcs
    NEEDS.forEach(n=>{const a=sectors[n.id],half=step*0.42;const st=ns[n.id];const col=st.void?"#B3261E":st.reaching>=1?"#3E7A4F":"#B8832A";
      x.beginPath();x.arc(cx,cy,Rmax+10,a-half,a+half);x.strokeStyle=col;x.lineWidth=st.void?5:3;x.globalAlpha=st.void?(0.5+0.5*Math.sin(tw*3)):0.85;x.stroke();x.globalAlpha=1;
      // label
      const lx=cx+Math.cos(a)*(Rmax+24),ly=cy+Math.sin(a)*(Rmax+24);x.fillStyle=col;x.font="600 10px 'IBM Plex Mono',monospace";x.fillText(n.id,lx,ly)});
    // trails + stars
    proj.forEach(p=>{const px=cx+Math.cos(p.ang)*p.r,py=cy+Math.sin(p.ang)*p.r;
      const startR=rOf(p.it.st),sx=cx+Math.cos(p.ang)*startR,sy=cy+Math.sin(p.ang)*startR;
      if(year>0){x.beginPath();x.moveTo(sx,sy);x.lineTo(px,py);x.strokeStyle=(contained(p.it)?"rgba(179,38,30,":"rgba(200,164,92,")+"0.18)";x.lineWidth=1;x.stroke()}
      const col=contained(p.it)?"#B3261E":(DCOL[p.it.area]||"#C8A45C");
      const rad=(contained(p.it)?2.4:2.6+scoreOf(p.it)/100*3)+(p.ignited?2.5:0);
      if(p.ignited){x.beginPath();x.arc(px,py,rad+6+2*Math.sin(tw*4+p.it._seed),0,7);x.fillStyle="rgba(231,206,146,.16)";x.fill()}
      if(p.it.ghost){ // scenario idea: a hollow ring, so it reads as proposed not real
        x.beginPath();x.arc(px,py,rad+1.5,0,7);x.strokeStyle=col;x.lineWidth=1.4;x.setLineDash([3,3]);x.globalAlpha=.9;x.stroke();x.setLineDash([]);x.globalAlpha=1;
      }else{x.beginPath();x.arc(px,py,rad,0,7);x.fillStyle=col;x.shadowBlur=p.ignited?16:8;x.shadowColor=col;x.globalAlpha=hover===p.it?1:.92;x.fill();x.shadowBlur=0;x.globalAlpha=1;}
      p._sx=px;p._sy=py;p._r=rad});
    // core star
    x.save();x.translate(cx,cy);x.rotate(tw*.1);x.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4-Math.PI/2,rr=k%2?7:20;const fx=Math.cos(a)*rr,fy=Math.sin(a)*rr;k?x.lineTo(fx,fy):x.moveTo(fx,fy)}x.closePath();x.fillStyle="#E7CE92";x.shadowBlur=24;x.shadowColor="#C8A45C";x.fill();x.restore();x.shadowBlur=0;
    if(hover){const p=proj.find(q=>q.it===hover);if(p){x.fillStyle="rgba(20,17,12,.92)";const lab=contained(hover)?tx({ar:"سجل محتوى",en:"Contained record"}):tx(hover.t);x.font="12px "+(H.L==="ar"?"'Readex Pro'":"'Archivo'")+",sans-serif";const w=x.measureText(lab).width+18;x.fillRect(p._sx-w/2,p._sy-30,w,20);x.fillStyle="#F1ECDF";x.textAlign="center";x.fillText(lab,p._sx,p._sy-16)}}
    // readout
    const caps=proj.filter(p=>p.ignited&&!contained(p.it)).length;const voids=NEEDS.filter(n=>ns[n.id].void).length;
    $("#fsRead").innerHTML=`<div class="fsRnum"><b>${num(caps)}</b><span>${esc(tx({ar:"قدرة وطنية مشتعلة",en:"national capabilities ignited"}))}</span></div>
      <div class="fsRnum ${voids?"bad":"good"}"><b>${num(voids)}</b><span>${esc(tx({ar:"احتياج بلا مسار قادم",en:"needs with no path coming"}))}</span></div>`
      +(scenario.length?`<div class="fsRnum" style="border-color:var(--brass2)"><b>${num(scenario.length)}</b><span>${esc(tx({ar:"فكرة من سيناريو «ماذا لو»",en:"ideas from the what-if scenario"}))}</span></div>`:"");
    ai.set({state:{caps,voids,year:Math.round(year*10)/10,scn:scenario.length}});
  }
  cv.addEventListener("pointermove",e=>{const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;let best=null,bd=16;
    projected().forEach(p=>{const dx=mx-(cx+Math.cos(p.ang)*p.r),dy=my-(cy+Math.sin(p.ang)*p.r);const d=Math.hypot(dx,dy);if(d<bd){bd=d;best=p.it}});
    if(best!==hover){hover=best;cv.style.cursor=best?"pointer":"default";if(!playing)draw()}});
  cv.addEventListener("click",e=>{if(hover&&!contained(hover)){H.ctx.state={openIdea:hover.id};go("lab")}});
  function renderWhatif(){
    const box=$("#fsWhatif");if(!box)return;const ns5=needStatus(projected(5));
    box.innerHTML=`<span class="fsWiLabel">${esc(tx({ar:"ماذا لو؟ سدّ فراغاً بإطلاق تحدٍّ:",en:"What if? Close a void by launching a challenge:"}))}</span>`
      +NEEDS.map(n=>{const v=ns5[n.id].void;return `<button class="fsWi ${v?"void":"ok"}" data-n="${n.id}" ${v?"":"disabled"}>${esc(n.id)} · ${v?esc(tx({ar:"أطلق تحدياً",en:"Launch a challenge"})):esc(tx({ar:"مغطّى بحلول +٥ سنوات",en:"covered by +5y"}))}</button>`}).join("")
      +(scenario.length?`<button class="fsWi reset" id="fsReset">${esc(tx({ar:"مسح السيناريو",en:"Clear scenario"}))}</button>`:"");
    $$(".fsWi[data-n]",box).forEach(b=>{if(!b.disabled)b.onclick=()=>launch(b.dataset.n)});
    if($("#fsReset"))$("#fsReset").onclick=resetScn;
  }
  const setYear=v=>{year=v/12;$("#fsYear").textContent=v===0?tx({ar:"اليوم",en:"Today"}):(H.L==="ar"?`+${num((v/12).toFixed(1))} سنة`:`+${(v/12).toFixed(1)} yr`);if(!playing)draw()};
  $("#fsRange").oninput=e=>setYear(+e.target.value);
  $("#fsPlay").onclick=()=>{if(playing){playing=false;$("#fsPlay").innerHTML="▶ "+tx({ar:"شغّل الزمن",en:"Run time"});return}
    playing=true;$("#fsPlay").innerHTML="⏸ "+tx({ar:"إيقاف",en:"Pause"});let v=0;
    const run=()=>{if(!playing)return;v+=0.5;if(v>60){v=60;playing=false;$("#fsPlay").innerHTML="▶ "+tx({ar:"أعد",en:"Replay"})}$("#fsRange").value=v;setYear(v);if(playing)raf=requestAnimationFrame(run)};raf=requestAnimationFrame(run)};
  renderWhatif();
  // gentle twinkle loop
  let tRaf=0;function loop(){tRaf=requestAnimationFrame(loop);tw+=0.02;draw()}
  if(!RM)loop();else draw();
  this._cleanup=()=>{playing=false;cancelAnimationFrame(raf);cancelAnimationFrame(tRaf);ro.disconnect()};
 },
 unmount(){if(this._cleanup)this._cleanup();this._cleanup=null},
 insight(c){const st=c.state||{};
  return {role:{ar:"مرصد الاستباق",en:"Foresight watch"},lines:[
   {ar:`الإسقاط عند ${st.year?`+${num(st.year)} سنة`:"اليوم"}: ${num(st.caps||0)} قدرة وطنية مشتعلة، و${num(st.voids||0)} احتياج بلا مسار قادم.`,en:`Projection at ${st.year?`+${st.year}y`:"today"}: ${num(st.caps||0)} national capabilities ignited, ${num(st.voids||0)} needs with no path coming.`},
   {ar:"الفراغ المظلم هو القيمة: احتياج وطني لا تتجه إليه أي فكرة. سدّه بإطلاق تحدٍّ أو توجيه فكرة قائمة قبل أن يصبح فجوة قدرة.",en:"The dark void is the value: a national need no idea is moving toward. Close it by opening a challenge or steering an existing idea before it becomes a capability gap."},
   ...(st.scn?[{ar:`سيناريو «ماذا لو» فعّال: ${num(st.scn)} فكرة افتراضية تُظهر أثر إطلاق تحدٍّ على سماء السنوات القادمة.`,en:`A what-if scenario is active: ${num(st.scn)} illustrative ideas showing how launching a challenge changes the coming-years sky.`}]:[]),
   {ar:"هذا إسقاط توضيحي حتمي من زخم الأفكار، وليس تنبؤاً رسمياً.",en:"This is a deterministic illustrative projection from idea momentum, not an official forecast."}],
   actions:[{label:{ar:"افتح احتياجات الدولة",en:"Open national needs"},run:()=>{H.ctx.state={osView:"challenges"};go("os")}}]}}
});
})();
