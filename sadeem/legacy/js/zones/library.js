/* SADEEM HANGAR · Zone 09 Innovation Library + Zone 10 Technology Radar */
(function(){
const {$,$$,esc,t,tx,num,go,register,ai,content,CHALLENGES}=H;
let theme="all",q="";
register("library",{
 mount(el){
  const LIB=content.library;
  H.head(el,{ar:"مكتبة الابتكار · 06",en:"Innovation Library · 06"},{ar:"ما تعرفه الدولة، منظّماً للاكتشاف",en:"What the nation knows, organised for discovery"},{ar:"جدار معرفي مضاء يُرتَّب بالموضوع لا بالمجلد: أبحاث وتقارير ودروس مستفادة وإحاطات وشراكات أكاديمية. كل عنصر مرتبط بتحدٍّ أو تقنية على الرادار.",en:"A lit knowledge wall arranged by theme, not folder: research, reports, lessons learned, briefings and academic partnerships. Every item links to a challenge or a technology on the radar."});
  el.insertAdjacentHTML("beforeend",`<div class="wrap"><div class="themes" id="themes"></div><div class="field" style="max-width:420px"><input id="q" placeholder="${esc(tx({ar:"ابحث في المكتبة…",en:"Search the library…"}))}" value="${esc(q)}"></div><div class="shelf" id="shelf"></div></div>`);
  $("#q").oninput=e=>{q=e.target.value;render()};render();
  function render(){
    $("#themes").innerHTML=`<button class="chip" aria-pressed="${theme==="all"}" data-k="all">${esc(t("all")||tx({ar:"الكل",en:"All"}))}</button>`+LIB.themes.map(x=>`<button class="chip" aria-pressed="${theme===x.k}" data-k="${x.k}">${esc(tx(x))}</button>`).join("");
    $$("#themes .chip").forEach(b=>b.onclick=()=>{theme=b.dataset.k;render()});
    const ql=q.trim().toLowerCase();const items=LIB.items.filter(i=>(theme==="all"||i.k===theme)&&(!ql||(tx(i)+" "+tx(i.sum)+" "+i.tags.join(" ")).toLowerCase().includes(ql)));
    $("#shelf").innerHTML=items.map(i=>`<button class="book" data-k="${i.k}" data-i="${i.id}"><div class="row"><span>${esc(tx(LIB.themes.find(x=>x.k===i.k)))}</span><span>${esc(i.id)} · ${num(i.year)}</span></div><b>${esc(tx(i))}</b><p>${esc(tx(i.sum))}</p><div class="row"><span>${i.tags.map(x=>"#"+esc(x)).join(" ")}</span></div></button>`).join("")||`<p class="mute">—</p>`;
    $$("#shelf .book").forEach(b=>b.onclick=()=>{ai.set({object:b.dataset.i});$("#aiDock").classList.add("on")});
  }
 },
 insight(c){const LIB=content.library;const i=c.object&&LIB.items.find(x=>x.id===c.object);
  if(i){const rel=LIB.items.filter(x=>x.id!==i.id&&x.tags.some(tg=>i.tags.includes(tg))).slice(0,3);const rad=content.radar.items.filter(r=>i.tags.includes(r.id)||i.tags.some(tg=>tx(r).toLowerCase().includes(tg)));
   return {role:{ar:"مساعد البحث",en:"Research assistant"},lines:[{ar:`${tx(i)}: ${tx(i.sum)}`,en:`${tx(i)}: ${tx(i.sum)}`},rel.length?{ar:"مرتبط: "+rel.map(x=>tx(x)).join(" · "),en:"Related: "+rel.map(x=>tx(x)).join(" · ")}:null,rad.length?{ar:"على الرادار: "+rad.map(r=>tx(r)).join("، "),en:"On the radar: "+rad.map(r=>tx(r)).join(", ")}:null].filter(Boolean),actions:[{label:{ar:"افتح الرادار",en:"Open the radar"},run:()=>go("radar")}]}}
  return {role:{ar:"مساعد البحث",en:"Research assistant"},lines:[{ar:`${num(LIB.items.length)} عنصراً في ${num(LIB.themes.length)} موضوعات. اختر عنصراً لأربطه بما يشبهه وبالرادار.`,en:`${LIB.items.length} items across ${LIB.themes.length} themes. Select an item and I link it to related items and the radar.`}]}}
});

/* ---------- RADAR ---------- */
let selT=null;
register("radar",{
 mount(el){
  const RD=content.radar;
  H.head(el,{ar:"رادار التقنيات · 07",en:"Technology Radar · 07"},{ar:"كون من التقنيات على أربعة آفاق حول نجمة سديم",en:"A universe of technologies on four horizons around the SADEEM star"},{ar:"تبنٍّ، تجربة، تقييم، ترقّب. المس تقنية لتقرأ إحاطتها وتصل إلى التحديات والبرامج والمكتبة المرتبطة بها.",en:"Adopt, trial, assess, hold. Touch a technology to read its briefing and reach the challenges, programmes and library items linked to it."});
  el.insertAdjacentHTML("beforeend",`<div class="wrap radarGrid"><svg class="radar" id="rd" viewBox="0 0 760 560" role="img" aria-label="Technology radar"></svg><div class="panel brief" id="brief"></div></div>`);
  draw();brief();
  function draw(){
    const s=$("#rd");const cx=380,cy=280,R=250;let g="";
    RD.horizons.forEach(h=>{g+=`<circle class="ring h" cx="${cx}" cy="${cy}" r="${R*h.r}"/><text class="hz" x="${cx+6}" y="${cy-R*h.r+14}">${esc(tx(h).toUpperCase())}</text>`});
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;g+=`<line class="spoke" x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*R}" y2="${cy+Math.sin(a)*R}"/>`}
    g+=`<circle class="core" cx="${cx}" cy="${cy}" r="34"/><text x="${cx}" y="${cy+4}" text-anchor="middle" style="fill:#E0C27E;font-weight:600;letter-spacing:.2em">SADEEM</text>`;
    RD.items.forEach(it=>{const h=RD.horizons.find(x=>x.k===it.h);const r=R*(h.r-.11);const a=(it.a-90)*Math.PI/180;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;const on=selT===it.id;
      g+=`<g class="node ${on?"on":""}" data-id="${it.id}"><circle cx="${x}" cy="${y}" r="${on?11:8}"/><text x="${x}" y="${y+(y>cy?22:-14)}" text-anchor="middle">${esc(tx(it))}</text></g>`});
    s.innerHTML=g;$$("#rd .node").forEach(n=>n.onclick=()=>{selT=n.dataset.id;draw();brief();ai.set({object:selT})});
  }
  function brief(){
    const it=RD.items.find(x=>x.id===selT);const b=$("#brief");
    if(!it){b.innerHTML=`<h3>${esc(tx({ar:"إحاطة تقنية",en:"Technology briefing"}))}</h3><p class="mute">${esc(tx({ar:"المس نقطة على الرادار.",en:"Touch a node on the radar."}))}</p><div class="row" style="margin-top:12px">${RD.domains.map(d=>`<span class="tag">${esc(tx(d))}</span>`).join("")}</div>`;return}
    const h=RD.horizons.find(x=>x.k===it.h),d=RD.domains.find(x=>x.k===it.d);const lib=content.library.items.filter(l=>l.tags.includes(it.id)||l.tags.some(tg=>tx(it).toLowerCase().includes(tg)));
    b.innerHTML=`<div class="row"><span class="tag brass">${esc(tx(h))}</span><span class="tag">${esc(tx(d))}</span></div><h3>${esc(tx(it))}</h3><p style="font-size:13.5px;color:var(--ink2)">${esc(tx(it.brief))}</p>
     <div class="kv"><span>${esc(tx({ar:"البرنامج المالك",en:"Owning programme"}))}</span><b style="font-family:inherit">${esc(it.programme)}</b></div>
     ${it.challenges.length?`<div><b style="font-size:12.5px">${esc(tx({ar:"احتياجات وطنية مرتبطة",en:"Linked national needs"}))}</b><div class="row" style="margin-top:6px">${it.challenges.map(c=>{const ch=CHALLENGES.find(x=>x.id===c);return `<button class="chip" data-ch="${c}">${esc(c)} · ${esc(ch?tx(ch.t):"")}</button>`}).join("")}</div></div>`:""}
     ${lib.length?`<div><b style="font-size:12.5px">${esc(tx({ar:"في المكتبة",en:"In the library"}))}</b><ul style="margin:6px 0 0;padding-inline-start:18px;font-size:13px">${lib.map(l=>`<li>${esc(tx(l))}</li>`).join("")}</ul></div>`:""}
     <div class="row"><a class="btn sm ghost" href="#library">${esc(t("z_library"))}</a><button class="btn sm" id="rIdea">${esc(tx({ar:"اقترح فكرة بهذه التقنية",en:"Propose an idea with this technology"}))}</button></div>`;
    $$("[data-ch]",b).forEach(x=>x.onclick=()=>{H.ctx.state={openCh:x.dataset.ch};go("lab")});
    $("#rIdea").onclick=()=>{H.ctx.state={draft:{t:{ar:`توظيف ${tx(it)} لاحتياج وطني`,en:`Applying ${tx(it)} to a national need`},d:tx(it.brief),area:it.d==="mfg"?"mfg":it.d==="aero"?"air":it.d==="mds"?"cyber":"land",ch:it.challenges[0]||""}};go("lab")};
  }
 },
 insight(c){const RD=content.radar;const it=c.object&&RD.items.find(x=>x.id===c.object);
  if(it){const h=RD.horizons.find(x=>x.k===it.h);const next={adopt:{ar:"التالي: توسيع التبني إلى قسم ثانٍ وقياس الأثر.",en:"Next: extend adoption to a second department and measure impact."},trial:{ar:"التالي: قرار تبنٍّ أو إيقاف بعد التجربة الجارية.",en:"Next: an adopt-or-stop decision after the current trial."},assess:{ar:"التالي: دراسة جدوى قصيرة قبل أي تجربة.",en:"Next: a short feasibility study before any trial."},hold:{ar:"التالي: مراجعة سنوية فقط.",en:"Next: an annual review only."}}[it.h];
   return {role:{ar:"كشّاف التقنيات",en:"Technology scout"},lines:[{ar:`${tx(it)} على أفق «${tx(h)}» في ${tx(RD.domains.find(x=>x.k===it.d))}. ${tx(it.brief)}`,en:`${tx(it)} on the '${tx(h)}' horizon in ${tx(RD.domains.find(x=>x.k===it.d))}. ${tx(it.brief)}`},next,it.challenges.length?{ar:"تجيب عن الاحتياجات: "+it.challenges.join("، "),en:"Answers needs: "+it.challenges.join(", ")}:null].filter(Boolean)}}
  const counts=RD.horizons.map(h=>`${tx(h)} ${num(RD.items.filter(i=>i.h===h.k).length)}`).join(" · ");
  return {role:{ar:"كشّاف التقنيات",en:"Technology scout"},lines:[{ar:`${num(RD.items.length)} تقنية: ${counts}.`,en:`${RD.items.length} technologies: ${counts}.`},{ar:"الرادار يُحرَّر من نظام سديم؛ كل تقنية تصل إلى التجربة تُربط باحتياج وطني واحد على الأقل.",en:"The radar is edited from the SADEEM OS; every technology that reaches trial is linked to at least one national need."}]}}
});
})();
