/* SADEEM HANGAR · 02 Command Deck */
(function(){
const {$,$$,esc,t,tx,num,go,register,ai,allIdeas,CHALLENGES,svgEl,SOURCES,DOMAINS}=H;
let zoom=null;const deck={bottle:-1};
const contained=i=>i.sens==="high"||H.DB.gate.some(g=>g.idea===i.id&&g.level==="high");
register("deck",{
 mount(el){
  H.head(el,{ar:"منصة القيادة · 02",en:"Command Deck · 02"},{ar:"حالة الابتكار الوطني عالي الحساسية",en:"The state of national high-sensitivity innovation"},{ar:"من المحفظة الوطنية إلى المجال إلى الفكرة. السجلات المعلَّمة «مثال» توضيحية، والمؤشرات مقترحة بانتظار الاعتماد الرسمي.",en:"From the national portfolio to domain to idea. Records marked 'example' are illustrative; indicators are proposed, pending official approval."});
  el.insertAdjacentHTML("beforeend",`<div class="wrap" style="padding-bottom:48px"><div class="deckTop" id="stats"></div>
   <div class="zoomBar"><span class="crumb" id="crumb"></span><button class="chip" id="zoomOut" hidden>${esc(t("back"))}</button></div>
   <div class="grid g2"><div class="panel"><h3>${esc(tx({ar:"المحفظة الوطنية",en:"National portfolio"}))}<small>${esc(tx({ar:"المجال × نوع المصدر",en:"domain × source type"}))}</small></h3><svg class="deckMap" id="pmap" viewBox="0 0 760 340" role="img" aria-label="Portfolio map"></svg></div>
    <div class="panel"><h3>${esc(tx({ar:"مسار سديم",en:"SADEEM pipeline"}))}<small id="pipeN"></small></h3><div class="pipe" id="pipe"></div><p class="note" style="margin-top:34px" id="bottle"></p></div></div>
   <div class="panel" style="margin-top:18px"><h3>${esc(tx({ar:"سديم × الدولة",en:"SADEEM × the State"}))}<small>${esc(t("proposed"))}</small></h3><div class="dims" id="vals"></div></div>
   <div class="grid g3" style="margin-top:18px">
    <div class="panel"><h3>${esc(tx({ar:"قرارات مطلوبة",en:"Decisions required"}))}</h3><div class="dec" id="dec"></div></div>
    <div class="panel"><h3>${esc(tx({ar:"المخاطر والاختناقات",en:"Risks and bottlenecks"}))}</h3><div class="dec" id="risk"></div></div>
    <div class="panel"><h3>${esc(tx({ar:"احتياجات الدولة",en:"National needs"}))}<small>${esc(tx({ar:"أيام متبقية",en:"days left"}))}</small></h3><div class="dec" id="chs"></div></div>
   </div></div>`);
  $("#zoomOut").onclick=()=>{zoom=null;render()};
  render();
  function render(){
    const all=allIdeas();const ideas=zoom?all.filter(i=>i.area===zoom):all;
    const dups=all.filter(i=>i.dupOf).length+3;
    const st=[[{ar:"الأفكار المستلمة",en:"Ideas received"},ideas.length,""],[{ar:"آخر ٣٠ يوماً",en:"Last 30 days"},ideas.filter(i=>i.days<=30).length,""],[{ar:"ازدواجيات منعت",en:"Duplicates prevented"},dups,"good"],[{ar:"محتواة",en:"Contained"},ideas.filter(contained).length,"warn"],[{ar:"بانتظار الاعتماد",en:"Awaiting approval"},ideas.filter(i=>i.st===9).length,""],[{ar:"وُجّهت لجهات مختصة",en:"Routed to entities"},ideas.filter(i=>i.st>=10).length,"good"]];
    $("#stats").innerHTML=st.map(([l,v,c])=>`<div class="stat ${c}"><span>${esc(tx(l))}</span><b ${typeof v==="number"?`data-count="${v}"`:""}>${esc(num(v))}</b></div>`).join("");if(window.FX)FX.count($("#stats"));
    $("#crumb").textContent=zoom?`${tx({ar:"المحفظة",en:"Portfolio"})} › ${tx(DOMAINS[zoom])}`:tx({ar:"المحفظة الوطنية",en:"National portfolio"});
    $("#zoomOut").hidden=!zoom;
    drawMap(all);drawPipe(ideas);drawVals(all);drawDec(ideas);
    $("#chs").innerHTML=CHALLENGES.map(c=>`<article class="${c.due<20?"warn":""}"><b>${esc(c.id)} · ${esc(tx(c.t))}</b><p>${esc(tx(c.d))}</p><div class="row"><span>${esc(tx(c.sponsor))}</span><span>${num(c.due)} · ${num(all.filter(i=>i.ch===c.id).length)} ${esc(tx({ar:"فكرة",en:"ideas"}))}</span></div></article>`).join("");
    ai.set({object:zoom||"portfolio",state:{n:ideas.length}});
  }
  function drawMap(all){
    const svg=$("#pmap");svg.innerHTML="";const W=760,H0=340,pad=8;const keys=Object.keys(DOMAINS);const colW=(W-pad*(keys.length+1))/keys.length;const srcs=Object.keys(SOURCES);
    keys.forEach((d,di)=>{const x=pad+di*(colW+pad);const c=all.filter(i=>i.area===d);const g=svgEl("g",{style:"cursor:pointer"});
      g.appendChild(svgEl("rect",{x,y:pad,width:colW,height:H0-pad*2,rx:4,fill:zoom===d?"var(--sovT)":"none",stroke:zoom===d?"var(--sov)":"var(--line)"}));
      const tl=svgEl("text",{x:x+10,y:pad+18,class:"divL"});tl.textContent=tx(DOMAINS[d]);g.appendChild(tl);
      const tc=svgEl("text",{x:x+10,y:pad+34});tc.textContent=`${num(c.length)} ${tx({ar:"فكرة",en:"ideas"})}`;g.appendChild(tc);
      let y=pad+48;const inner=H0-pad*2-56;
      srcs.forEach(sk=>{const n=c.filter(i=>i.src===sk).length;if(!n)return;const h=Math.max(22,inner*n/Math.max(1,c.length)*.9);const cont=c.filter(i=>i.src===sk&&contained(i)).length;
        g.appendChild(svgEl("rect",{x:x+8,y,width:colW-16,height:h-4,rx:3,class:"prog"}));
        if(cont)g.appendChild(svgEl("rect",{x:x+8,y,width:Math.max(6,(colW-16)*cont/n),height:h-4,rx:3,fill:"var(--brassT)"}));
        const tt=svgEl("text",{x:x+14,y:y+15});tt.textContent=`${tx(SOURCES[sk])} · ${num(n)}`;g.appendChild(tt);y+=h});
      g.onclick=()=>{zoom=zoom===d?null:d;render()};svg.appendChild(g)});
  }
  function drawPipe(ideas){
    const counts=Array.from({length:11},(_,s)=>ideas.filter(i=>i.st===s).length);const mx=Math.max(1,...counts);
    const ages=Array.from({length:11},(_,s)=>{const c=ideas.filter(i=>i.st===s);return c.length?c.reduce((a,i)=>a+i.days,0)/c.length:0});
    let bottle=-1,worst=0;ages.forEach((a,s)=>{if(s>0&&s<10&&a*counts[s]>worst){worst=a*counts[s];bottle=s}});
    $("#pipe").innerHTML=counts.map((c,s)=>`<div class="${s===bottle?"bottle":""}" style="height:${Math.max(3,c/mx*100)}%" title="${esc(t("stage")[s])}"><span>${num(c)}</span><em>${num(s+1)}</em></div>`).join("");
    $("#pipeN").textContent=`${num(ideas.length)} ${tx({ar:"فكرة عبر ١١ محطة",en:"ideas across 11 stations"})}`;
    $("#bottle").textContent=bottle>=0?tx({ar:`الاختناق: محطة «${t("stage")[bottle]}» — متوسط العمر ${num(Math.round(ages[bottle]))} يوماً لـ${num(counts[bottle])} فكرة.`,en:`Bottleneck: '${t("stage")[bottle]}' — average age ${Math.round(ages[bottle])} days for ${counts[bottle]} ideas.`}):"";
    deck.bottle=bottle;
  }
  function drawVals(all){
    const n=Math.max(1,all.length);
    const V=[[{ar:"مركزية سيادية: نسبة الأفكار الواردة عبر البوابة الواحدة",en:"Sovereign centralisation: share received through the single door"},100],
     [{ar:"توحيد المرجعية: أفكار مرتبطة باحتياج وطني معلن",en:"Unified reference: ideas linked to a declared national need"},Math.round(all.filter(i=>i.ch).length/n*100)],
     [{ar:"استباق وطني: أفكار وصلت قبل إعلان احتياج",en:"National anticipation: ideas that arrived before a need was declared"},Math.round(all.filter(i=>!i.ch).length/n*100)],
     [{ar:"تقليل الهدر: ازدواجيات منعت من إجمالي الوارد",en:"Less waste: duplicates prevented of all received"},Math.round((all.filter(i=>i.dupOf).length+3)/n*100)],
     [{ar:"الاكتفاء الذاتي: أفكار في التصنيع والإمداد المحلي",en:"Self-sufficiency: ideas in local manufacturing and supply"},Math.round(all.filter(i=>i.area==="mfg").length/n*100)],
     [{ar:"جودة المدخلات: أفكار اجتازت التقييم الوطني",en:"Input quality: ideas past national evaluation"},Math.round(all.filter(i=>i.st>=6).length/n*100)]];
    $("#vals").innerHTML=V.map(([l,v],k)=>`<div class="dim" style="grid-template-columns:minmax(0,1.4fr) 1fr 44px"><span>${num(k+1)} · ${esc(tx(l))}</span><div class="bar"><i style="width:${v}%"></i></div><b>${num(v)}%</b></div>`).join("");
  }
  function drawDec(ideas){
    const d=[],r=[];
    ideas.filter(i=>i.st===9).forEach(i=>d.push(["crit",{ar:`اعتماد إحالة: ${contained(i)?"سجل محتوى":tx(i.t)}`,en:`Approve referral: ${contained(i)?"contained record":tx(i.t)}`},{ar:`${i.id} · ${num(i.days)} يوماً`,en:`${i.id} · ${i.days} days`},i]));
    ideas.filter(i=>i.st===6).forEach(i=>d.push(["",{ar:`اختبار جدول الأفكار: ${contained(i)?"سجل محتوى":tx(i.t)}`,en:`Idea-table test: ${contained(i)?"contained record":tx(i.t)}`},{ar:`${i.id} · قبل الإحالة`,en:`${i.id} · before referral`},i]));
    ideas.filter(i=>i.days>60&&i.st<10).forEach(i=>r.push(["warn",{ar:`فكرة متعثرة: ${contained(i)?"سجل محتوى":tx(i.t)}`,en:`Stalled: ${contained(i)?"contained record":tx(i.t)}`},{ar:`${num(i.days)} يوماً في «${t("stage")[i.st]}»`,en:`${i.days} days at '${t("stage")[i.st]}'`},i]));
    if(deck.bottle>=0)r.unshift(["crit",{ar:`اختناق في «${t("stage")[deck.bottle]}»`,en:`Bottleneck at '${t("stage")[deck.bottle]}'`},{ar:"سعة التقييم أو نقص المعلومات",en:"Evaluation capacity or missing information"},null]);
    r.push(["warn",{ar:"بنود مفتوحة للجهة المعتمِدة",en:"Open items for the approving authority"},{ar:"المعايير الوطنية وأوزانها · قائمة الجهات المختصة · ملكية الفكرة عند الإحالة",en:"National criteria and weights · list of competent entities · IP ownership on referral"},null]);
    const card=([c,b,p,i])=>`<article class="${c}" ${i?`data-i="${esc(i.id)}" style="cursor:pointer"`:""}><b>${esc(tx(b))}</b><p>${esc(tx(p))}</p></article>`;
    $("#dec").innerHTML=d.slice(0,4).map(card).join("")||`<p class="mute">—</p>`;$("#risk").innerHTML=r.slice(0,4).map(card).join("")||`<p class="mute">—</p>`;
    $$("[data-i]",el).forEach(a=>a.onclick=()=>{H.ctx.state={openIdea:a.dataset.i};go("lab")});
  }
 },
 insight(c){const n=(c.state&&c.state.n)||allIdeas().length;const b=deck.bottle;return {role:{ar:"دعم القرار",en:"Decision support"},lines:[{ar:`${num(n)} فكرة في النطاق الحالي. ${b>=0?`أبطأ محطة «${t("stage")[b]}»؛ أسرع تدخل: جلسة تقييم إضافية أو قالب معلومات أوضح للمحطة السابقة.`:""}`,en:`${n} ideas in scope. ${b>=0?`The slowest station is '${t("stage")[b]}'; fastest lever: an extra evaluation session or a clearer information template for the station before.`:""}`},{ar:"الجزء الذهبي في كل خانة = السجلات المحتواة؛ تُحتسب في الأرقام ولا يظهر محتواها.",en:"The gold part of each block = contained records; counted in the numbers, never shown."},{ar:"مؤشرات «سديم × الدولة» مشتقة من الصفحة المفاهيمية ومقترحة للاعتماد.",en:"The SADEEM × State indicators are derived from the concept page and proposed for approval."}],actions:[{label:{ar:"اذهب إلى الاختناق",en:"Go to the bottleneck"},run:()=>go("lab")}]}}
});
})();
