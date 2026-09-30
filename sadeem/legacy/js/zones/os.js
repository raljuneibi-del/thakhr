/* SADEEM HANGAR · SADEEM OS (fast, conventional surface behind the facility) */
(function(){
const {$,$$,esc,t,tx,num,go,register,ai,toast,allIdeas,CHALLENGES}=H;
let view="home";
const MODS=[
 ["home",{ar:"الرئيسية",en:"Home"}],["ideas",{ar:"قائمة الاستلام",en:"Intake queue"}],["pipeline",{ar:"لوحة المسار",en:"Pipeline board"}],["challenges",{ar:"احتياجات الدولة",en:"National needs"}],
 ["experiments",{ar:"التجارب والمتابعة",en:"Experiments & follow-up"}],["referrals",{ar:"الإحالة والتوجيه",en:"Referrals & routing"}],["entities",{ar:"الجهات المختصة",en:"Competent entities"}],["configs",{ar:"التشكيلات الهندسية",en:"Engineering configs"}],["achievements",{ar:"الإنجازات",en:"Achievements"}],
 ["gate",{ar:"سجل الاحتواء",en:"Vault log"}],["quotes",{ar:"نظام محتوى الاقتباسات",en:"Quotes content system"}],["open",{ar:"البنود المفتوحة",en:"Open items"}]];
const ZL=[["lab",{ar:"مسار سديم",en:"Pipeline Hall"}],["gate",{ar:"قبو الاحتواء",en:"Containment Vault"}],["deck",{ar:"منصة القيادة",en:"Command Deck"}],["bay",{ar:"حظيرة المنصات",en:"Vehicle Bay"}],["drones",{ar:"مختبر الدرونات",en:"Drone Lab"}],["factory",{ar:"مصنع المستقبل",en:"Future Factory"}],["twins",{ar:"التوائم الرقمية",en:"Digital Twins"}],["missions",{ar:"المحاكاة",en:"Games & simulations"}],["library",{ar:"المكتبة",en:"Library"}],["radar",{ar:"الرادار",en:"Radar"}]];
register("os",{
 mount(el){
  const st=H.ctx.state||{};if(st.osView)view=st.osView;
  el.innerHTML=`<aside class="rail" id="rail"></aside><div class="osMain" id="osMain"></div>`;
  renderRail();renderMain();
  function renderRail(){
    $("#rail").innerHTML=`<h4>${esc(t("os"))}</h4>`+MODS.map(([k,l])=>`<button data-v="${k}" aria-current="${view===k?"page":"false"}"><span>${esc(tx(l))}</span>${k==="ideas"?`<small>${num(allIdeas().length)}</small>`:k==="gate"?`<small>${num(H.DB.gate.length)}</small>`:""}</button>`).join("")+`<h4>${esc(t("hangar"))}</h4>`+ZL.map(([z,l])=>`<button data-z="${z}"><span>${esc(tx(l))}</span><small>↗</small></button>`).join("");
    $$("#rail [data-v]").forEach(b=>b.onclick=()=>{view=b.dataset.v;renderRail();renderMain()});
    $$("#rail [data-z]").forEach(b=>b.onclick=()=>go(b.dataset.z));
  }
  function renderMain(){
    const m=$("#osMain");const ideas=allIdeas();
    if(view==="home"){
      const mine=H.DB.ideas;
      m.innerHTML=`<h2>${esc(tx({ar:"عملي اليوم",en:"My work today"}))}</h2><div class="deckTop">${[[{ar:"أفكاري",en:"My ideas"},mine.length],[{ar:"تتقدّم",en:"Moving"},mine.filter(i=>i.st>0).length],[{ar:"احتياجات معلنة",en:"Declared needs"},CHALLENGES.length],[{ar:"تشكيلات محفوظة",en:"Saved configs"},H.DB.drones.length],[{ar:"محتواة",en:"Contained"},H.DB.gate.filter(g=>g.level==="high").length],[{ar:"بانتظار الاعتماد",en:"Awaiting approval"},allIdeas().filter(i=>i.st===9).length]].map(([l,v])=>`<div class="stat"><span>${esc(tx(l))}</span><b>${num(v)}</b></div>`).join("")}</div>
       <div class="grid g2"><div class="panel"><h3>${esc(tx({ar:"إجراءات سريعة",en:"Quick actions"}))}</h3><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn sm" data-q="lab">${esc(tx({ar:"قدّم فكرة",en:"Submit an idea"}))}</button><button class="btn ghost sm" data-q="drones">${esc(tx({ar:"صمّم درون",en:"Design a drone"}))}</button><button class="btn ghost sm" data-q="missions">${esc(tx({ar:"شغّل محاكاة",en:"Run a simulation"}))}</button><button class="btn ghost sm" data-q="deck">${esc(tx({ar:"منصة القيادة",en:"Command Deck"}))}</button></div>
        <h3 style="margin-top:18px">${esc(tx({ar:"أفكاري",en:"My ideas"}))}</h3><div class="ideaList">${mine.slice(0,6).map(i=>`<button class="ideaRow" data-i="${esc(i.id)}"><i>${esc(i.id)}</i><span><b>${esc(tx(i.t))}</b><small>${esc(t("stage")[i.st])}</small></span><span class="tag sov">${num(i.st+1)}/11</span></button>`).join("")||`<p class="mute">${esc(tx({ar:"لم تقدّم فكرة بعد. رحلتك تبدأ بملاحظة واحدة.",en:"No ideas yet. Your journey starts with one observation."}))}</p>`}</div></div>
        <div class="panel"><h3>${esc(tx({ar:"نشرات سديم",en:"SADEEM bulletins"}))}</h3><div class="dec">${H.content.library.items.filter(x=>["bulletin","case","video"].includes(x.k)).map(x=>`<article><b>${esc(tx(x))}</b><p>${esc(tx(x.sum))}</p></article>`).join("")}</div></div></div>`;
      $$("[data-q]",m).forEach(b=>b.onclick=()=>go(b.dataset.q));$$("[data-i]",m).forEach(b=>b.onclick=()=>{H.ctx.state={openIdea:b.dataset.i};go("lab")});
    }
    else if(view==="ideas"||view==="pipeline"){
      const cols=view==="pipeline"?t("stage").map((s,k)=>[k,s]):[[0,tx({ar:"مستلمة",en:"Received"})],[1,tx({ar:"تصنيف وتنقية",en:"Classify & filter"})],[3,tx({ar:"احتواء",en:"Containment"})],[4,tx({ar:"تنظيم وتقييم",en:"Organise & evaluate"})],[6,tx({ar:"اختبار وتجربة",en:"Test & experiment"})],[9,tx({ar:"إحالة وتوجيه",en:"Refer & route"})]];
      const bucket=k=>view==="pipeline"?ideas.filter(i=>i.st===k):ideas.filter(i=>{const ks=cols.map(c=>c[0]);const idx=ks.findIndex((v,j)=>i.st>=v&&(j===ks.length-1||i.st<ks[j+1]));return ks[idx]===k});
      m.innerHTML=`<h2>${esc(tx(MODS.find(x=>x[0]===view)[1]))}</h2><div class="kan">${cols.map(([k,l])=>{const c=bucket(k);return `<div class="col"><h4>${esc(l)}<span>${num(c.length)}</span></h4>${c.map(i=>`<div class="card" data-i="${esc(i.id)}" style="cursor:pointer"><i>${esc(i.id)}${i.sample?" · "+esc(tx({ar:"مثال",en:"example"})):""}</i>${esc(i.sens==="high"&&!i.mine?tx({ar:"سجل محتوى",en:"Contained record"}):tx(i.t))}</div>`).join("")}</div>`}).join("")}</div>`;
      $$("[data-i]",m).forEach(b=>b.onclick=()=>{H.ctx.state={openIdea:b.dataset.i};go("lab")});
    }
    else if(view==="challenges"){
      m.innerHTML=`<h2>${esc(tx({ar:"احتياجات الدولة",en:"National needs"}))}</h2><div class="tblWrap"><table class="t"><thead><tr><th>ID</th><th>${esc(tx({ar:"الاحتياج",en:"Need"}))}</th><th>${esc(tx({ar:"الجهة",en:"Entity"}))}</th><th>${esc(tx({ar:"الأفكار",en:"Ideas"}))}</th><th>${esc(tx({ar:"المتبقي",en:"Days left"}))}</th></tr></thead><tbody>${CHALLENGES.map(c=>`<tr><td class="mono">${c.id}</td><td><b>${esc(tx(c.t))}</b><br><span class="mute" style="font-size:12.5px">${esc(tx(c.d))}</span></td><td>${esc(tx(c.sponsor))}</td><td class="mono">${num(ideas.filter(i=>i.ch===c.id).length)}</td><td class="mono">${num(c.due)}</td></tr>`).join("")}</tbody></table></div>`;
    }
    else if(view==="experiments"){
      const ex=ideas.filter(i=>i.st>=7&&i.st<=8);
      m.innerHTML=`<h2>${esc(tx({ar:"التجارب والمتابعة",en:"Experiments & follow-up"}))}</h2><div class="tblWrap"><table class="t"><thead><tr><th>ID</th><th>${esc(tx({ar:"الفكرة",en:"Idea"}))}</th><th>${esc(tx({ar:"المرحلة",en:"Stage"}))}</th><th>${esc(tx({ar:"الأيام",en:"Days"}))}</th><th>${esc(tx({ar:"المالك",en:"Owner"}))}</th></tr></thead><tbody>${ex.map(i=>`<tr><td class="mono">${esc(i.id)}</td><td>${esc(tx(i.t))}</td><td><span class="tag ${i.st>=9?"good":"sov"}">${esc(t("stage")[i.st])}</span></td><td class="mono">${num(i.days)}</td><td>${esc(tx(H.SOURCES[i.src]||i.owner))}</td></tr>`).join("")}</tbody></table></div>`;
    }
    else if(view==="referrals"){
      const rf=ideas.filter(i=>i.st>=9);
      m.innerHTML=`<h2>${esc(tx({ar:"الإحالة والتوجيه",en:"Referrals & routing"}))}</h2><p class="note" style="margin-bottom:12px">${esc(t("proposed"))}</p><div class="tblWrap"><table class="t"><thead><tr><th>ID</th><th>${esc(tx({ar:"الفكرة",en:"Idea"}))}</th><th>${esc(tx({ar:"الحالة",en:"Status"}))}</th><th>${esc(tx({ar:"الجهة المستلمة",en:"Receiving entity"}))}</th></tr></thead><tbody>${rf.map(i=>`<tr><td class="mono">${esc(i.id)}</td><td>${esc(i.sens==="high"?tx({ar:"سجل محتوى",en:"Contained record"}):tx(i.t))}</td><td><span class="tag ${i.st>=10?"good":"warn"}">${esc(t("stage")[i.st])}</span></td><td>${esc(i.entity?tx(i.entity):"—")}</td></tr>`).join("")}</tbody></table></div>`;
    }
    else if(view==="entities"){
      m.innerHTML=`<h2>${esc(tx({ar:"الجهات الوطنية المختصة",en:"Competent national entities"}))}</h2><p class="lead" style="margin:0 0 16px">${esc(tx({ar:"لم تُسمَّ الجهات في الإطار المفاهيمي. تُستخدم أنواع الجهات هنا إلى أن تُعتمد القائمة رسمياً.",en:"The concept names no entities. Entity types are used here until the list is officially approved."}))}</p><div class="badges">${H.ENTITIES.map(e=>`<div class="badge"><b>${esc(tx(e))}</b><small>${num(ideas.filter(i=>i.entity&&i.entity.en===e.en).length)} ${esc(tx({ar:"إحالة",en:"referrals"}))}</small></div>`).join("")}</div>`;
    }
    else if(view==="open"){
      const O=[[{ar:"الولاية القانونية وخط التبعية لمركز سديم",en:"SADEEM's legal mandate and reporting line"}],[{ar:"المعايير الوطنية للتقييم وأوزانها",en:"National evaluation criteria and their weights"}],[{ar:"مستويات التصنيف ومن يملك صلاحية الاحتواء",en:"Classification levels and who holds containment authority"}],[{ar:"قائمة الجهات الوطنية المختصة وقنوات استلامها",en:"The list of competent national entities and their intake channels"}],[{ar:"ملكية الفكرة وحقوق صاحبها عند الإحالة",en:"Idea ownership and the contributor's rights on referral"}],[{ar:"تمويل التجارب والمتابعة",en:"Funding of experiments and follow-up"}],[{ar:"المبادرات الوطنية المحتملة (غير حصرية)",en:"Possible national initiatives (non-exclusive)"}]];
      m.innerHTML=`<h2>${esc(tx({ar:"البنود المفتوحة للجهة المعتمِدة",en:"Open items for the approving authority"}))}</h2><p class="lead" style="margin:0 0 16px">${esc(tx({ar:"الإطار المفاهيمي لسديم لا يتضمن آليات تشغيلية. هذه البنود تُستكمل حصرياً بموافقة رسمية.",en:"The SADEEM concept contains no operational mechanisms. These items are completed exclusively with official approval."}))}</p><div class="dec">${O.map(([l],k)=>`<article class="warn"><b>${num(k+1)} · ${esc(tx(l))}</b><p>${esc(tx({ar:"الحالة: بانتظار الاعتماد",en:"Status: pending approval"}))}</p></article>`).join("")}</div>`;
    }
    else if(view==="configs"){
      m.innerHTML=`<h2>${esc(tx({ar:"التشكيلات الهندسية",en:"Engineering configurations"}))}</h2>${H.DB.drones.length?`<div class="tblWrap"><table class="t"><thead><tr><th>ID</th><th>${esc(tx({ar:"التشكيلة",en:"Configuration"}))}</th><th>${esc(tx({ar:"المهمة",en:"Mission"}))}</th><th>${esc(tx({ar:"الكتلة",en:"Mass"}))}</th><th>${esc(tx({ar:"التحمل",en:"Endurance"}))}</th></tr></thead><tbody>${H.DB.drones.map(d=>{const r=DRONE.compute(d.cfg);return `<tr><td class="mono">${esc(d.id)}</td><td class="mono" style="font-size:12px">${esc(Object.values(d.cfg).join(" / "))}</td><td>${esc(tx(DRONE.MISSIONS.find(x=>x.k===d.mission).n))}</td><td class="mono">${num(r.mass)} kg</td><td class="mono">${num(r.end)} min</td></tr>`}).join("")}</tbody></table></div>`:`<p class="mute">${esc(tx({ar:"احفظ تشكيلة من مختبر الدرونات لتظهر هنا.",en:"Save a configuration in the Drone Lab and it appears here."}))}</p><button class="btn sm" style="margin-top:12px" onclick="H.go('drones')">${esc(t("z_drones"))}</button>`}`;
    }
    else if(view==="achievements"){
      const mine=H.DB.ideas,gates=H.DB.gate;
      const B=[[{ar:"أول ملاحظة",en:"First observation"},{ar:"قدّم فكرة واحدة",en:"Submit one idea"},mine.length>=1],[{ar:"مهندس المهام",en:"Mission engineer"},{ar:"حوّل نتيجة محاكاة إلى فكرة",en:"Turn a simulation into an idea"},mine.some(i=>/From|من /.test(i.d||""))],[{ar:"معماري الدرونات",en:"Drone architect"},{ar:"احفظ تشكيلة درون",en:"Save a drone configuration"},H.DB.drones.length>=1],[{ar:"حارس السيادة",en:"Sovereignty keeper"},{ar:"أكّد تصنيف فكرة في قبو الاحتواء",en:"Confirm a classification in the vault"},gates.some(g=>g.by==="human-confirmed")],[{ar:"البوابة الأولى",en:"First gate"},{ar:"انقل فكرة إلى المحطة التالية",en:"Move an idea to the next station"},mine.some(i=>i.st>0)],[{ar:"قدرة وطنية",en:"National capability"},{ar:"فكرة تُوجَّه إلى جهة مختصة",en:"An idea routed to a competent entity"},mine.some(i=>i.st>=10)]];
      m.innerHTML=`<h2>${esc(tx({ar:"الإنجازات",en:"Achievements"}))}</h2><p class="lead" style="margin:0 0 16px">${esc(tx({ar:"الأوسمة تكافئ المساهمة في المسار الوطني، لا النقرات.",en:"Badges reward contribution to the national pipeline, not clicks."}))}</p><div class="badges">${B.map(([n,d,on])=>`<div class="badge ${on?"":"off"}"><span class="tag ${on?"brass":""}">${on?"✓":"—"}</span><b>${esc(tx(n))}</b><small>${esc(tx(d))}</small></div>`).join("")}</div>`;
    }
    else if(view==="gate"){
      m.innerHTML=`<h2>${esc(tx({ar:"سجل الاحتواء",en:"Vault log"}))}</h2><p class="note" style="margin-bottom:12px">${esc(tx({ar:"المحتوى محجوب؛ يظهر المرجع والمستوى والحالة فقط.",en:"Content withheld; only reference, level and status are shown."}))}</p><div class="tblWrap"><table class="t"><thead><tr><th>Ref</th><th>${esc(tx({ar:"الفكرة",en:"Idea"}))}</th><th>${esc(tx({ar:"المستوى",en:"Level"}))}</th><th>${esc(tx({ar:"بواسطة",en:"By"}))}</th><th>${esc(tx({ar:"التاريخ",en:"Date"}))}</th></tr></thead><tbody>${H.DB.gate.map(g=>`<tr><td class="mono">${esc(g.ref)}</td><td class="mono">${esc(g.idea)}</td><td><span class="tag ${g.level==="high"?"warn":"sov"}">${esc(g.level)}</span></td><td>${esc(g.by)}</td><td class="mono">${esc(new Date(g.at).toISOString().slice(0,10))}</td></tr>`).join("")||`<tr><td colspan="5" class="mute">—</td></tr>`}</tbody></table></div><a class="btn sm" href="#gate" style="margin-top:14px">${esc(t("z_gate"))}</a>`;
    }
    else if(view==="quotes"){
      const qs=H.quotes();
      m.innerHTML=`<h2>${esc(tx({ar:"نظام محتوى الاقتباسات",en:"Quotes content system"}))}</h2><p class="lead" style="margin:0 0 16px">${esc(tx({ar:"كل اقتباس يُنشر فقط إذا وُثّق بمصدر رسمي. النص العربي والإنجليزي يُلصقان حرفياً من الصفحة الرسمية؛ لا ترجمة آلية.",en:"A statement publishes only when verified against an official source. Arabic and English are pasted verbatim from the official page; no machine translation."}))}</p>
       <div style="display:grid;gap:14px">${qs.map(q=>`<div class="panel"><h3>${esc(q.id)} · ${esc(tx(q.leader))}<small><span class="tag ${q.verification==="verified"?"good":"warn"}">${esc(q.verification)}</span></small></h3>
        <div class="grid g2" style="gap:12px"><div class="field"><label>English (official)</label><textarea data-q="${q.id}" data-f="en" dir="ltr">${esc(q.en)}</textarea></div><div class="field"><label>العربية (الرسمية)</label><textarea data-q="${q.id}" data-f="ar" dir="rtl">${esc(q.ar)}</textarea></div></div>
        <div class="kv" style="font-size:12.5px"><span>${esc(tx({ar:"التاريخ · السياق",en:"Date · context"}))}</span><b style="font-family:inherit">${esc(q.date)} · ${esc(tx(q.context))}</b><span>${esc(t("source"))}</span><b style="font-family:inherit"><a href="${esc(q.sourceUrl)}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(q.source)}</a></b><span>${esc(tx({ar:"المنطقة · الميزة · العمود",en:"Zone · feature · pillar"}))}</span><b>${esc(q.zone)} · ${esc(q.osFeature)} · ${esc(q.pillar)}</b></div>
        <p class="note" style="margin-top:8px">${esc(q.note)}</p></div>`).join("")}</div>
       <div style="display:flex;gap:8px;margin-top:14px"><button class="btn sm" id="qSave">${esc(t("save"))}</button><button class="btn ghost sm" id="qReset">${esc(t("reset"))}</button></div>`;
      $("#qSave").onclick=()=>{const o={};$$("textarea[data-q]",m).forEach(x=>{(o[x.dataset.q]=o[x.dataset.q]||{})[x.dataset.f]=x.value.trim()});H.DB.quotesOverride=o;H.save();toast({ar:"حُفظت النصوص. تظهر على الأسطح فوراً.",en:"Saved. The surfaces show them now."})};
      $("#qReset").onclick=()=>{H.DB.quotesOverride=null;H.save();renderMain()};
    }
    ai.set({object:view});
  }
 },
 insight(c){const v=c.object;
  if(v==="quotes")return {role:{ar:"محرر المحتوى",en:"Content editor"},lines:[{ar:"ثلاثة تصريحات بحاجة إلى النص العربي الرسمي، واثنان بحاجة إلى رابط وام أو الحساب الرسمي. لا يُنشر نص بلغة ما لم يُلصق من المصدر الرسمي.",en:"Three statements need the official Arabic text and two need a WAM or official-account link. No language surface publishes until its text is pasted from the official source."}]};
  const ideas=allIdeas();const old=ideas.filter(i=>i.days>60&&i.st<9).length;
  return {role:{ar:"مساعد نظام سديم",en:"SADEEM OS assistant"},lines:[{ar:`${num(ideas.length)} فكرة، ${num(old)} منها متعثرة أكثر من ٦٠ يوماً. اضغط ⌘K للانتقال إلى أي منطقة أو فكرة.`,en:`${ideas.length} ideas, ${old} stalled over 60 days. Press ⌘K to jump to any zone or idea.`}]}}
});
})();
