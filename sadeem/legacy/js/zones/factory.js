/* SADEEM HANGAR · Zone 05 Factory of the Future */
(function(){
const {$,$$,esc,t,tx,num,go,register,ai}=H;
const F=window.FACTORY;
let on=new Set(),morph=0,walk=-1;
const FUTURE=new Set(F.TECH.map(x=>x.k));
register("factory",{
 mount(el){
  H.head(el,{ar:"مصنع المستقبل · L3",en:"Factory of the Future · L3"},{ar:"خط واحد، حالتان",en:"One line, two states"},{ar:"حرّك المزلاج لتشاهد الخط يتحول محطةً محطة من الحالة الحالية إلى المستقبلية، أو فعّل تقنية واحدة وراقب المقاييس الستة. امشِ على الخط بإيقاع الإنتاج.",en:"Move the slider to watch the line transform station by station from current to future, or enable one technology and watch the six metrics. Walk the line at its takt."});
  el.insertAdjacentHTML("beforeend",`<div class="wrap" style="padding-bottom:48px">
   <div class="morph"><span>${esc(tx({ar:"الحالة الحالية",en:"Current"}))}</span><input type="range" id="morph" min="0" max="100" value="0" aria-label="morph"><span>${esc(tx({ar:"المستقبلية",en:"Future"}))}</span><button class="chip" id="walkBtn">${esc(tx({ar:"امشِ على الخط",en:"Walk the line"}))}</button></div>
   <svg class="line" id="line" viewBox="0 0 1200 300" role="img" aria-label="Production line"></svg>
   <div class="mrow" id="mrow" style="margin-top:14px"></div>
   <div class="grid g2" style="margin-top:18px"><div class="panel"><h3>${esc(tx({ar:"التقنيات",en:"Technologies"}))}<small id="capex"></small></h3><div class="techs" id="techs"></div></div>
   <div class="panel"><h3>${esc(tx({ar:"محطة تحت النظر",en:"Station in view"}))}</h3><div id="stInfo" class="mute" style="font-size:13.5px"></div><p class="note" style="margin-top:14px">${esc(t("training"))}</p><button class="btn ghost sm" id="toIdea" style="margin-top:12px">${esc(t("toIdea"))}</button></div></div></div>`);
  $("#morph").oninput=e=>{morph=+e.target.value/100;const k=Math.round(morph*F.TECH.length);on=new Set(F.TECH.slice(0,k).map(x=>x.k));render()};
  $("#walkBtn").onclick=()=>{walk=walk<0?0:-1;render();if(walk>=0)step()};
  $("#toIdea").onclick=()=>{const r=F.compute(on);H.ctx.state={draft:{t:{ar:"تحسين خط الإنتاج بتقنيات مصنع المستقبل",en:"Improve the line with Factory-of-the-Future technologies"},d:tx({ar:`من مصنع المستقبل: ${[...on].join("، ")||"بلا تقنيات"} → إنتاجية ${r.tp} وحدة/وردية، جودة ${r.q}%، توقف ${r.down}%، تكلفة ${r.cost}. رأس المال التقديري ${r.capex} م.درهم.`,en:`From the Factory of the Future: ${[...on].join(", ")||"no technologies"} → ${r.tp} units/shift, ${r.q}% first-pass, ${r.down}% downtime, cost index ${r.cost}. Indicative capex AED ${r.capex}m.`}),area:"mfg",ch:"N-03"}};go("lab")};
  render();
  function step(){if(walk<0)return;walk=(walk+1)%F.STATIONS.length;render();const tk=F.compute(on).takt;setTimeout(step,Math.max(700,tk*40))}
  function render(){
    const r=F.compute(on),base=F.compute(new Set()),eff=F.stationEffects(on);
    const M=[[{ar:"الإنتاجية",en:"Throughput"},r.tp,base.tp,"u/shift",1],[{ar:"جودة أول مرور",en:"First-pass quality"},r.q,base.q,"%",1],[{ar:"الحوادث",en:"Incidents"},r.inc,base.inc,"/1000h",-1],[{ar:"مؤشر التكلفة",en:"Cost index"},r.cost,base.cost,"",-1],[{ar:"التوقف",en:"Downtime"},r.down,base.down,"%",-1],[{ar:"زمن الدورة",en:"Takt"},r.takt,base.takt,"min",-1]];
    $("#mrow").innerHTML=M.map(([l,v,b,u,dir])=>{const d=+(v-b).toFixed(1);const good=d*dir>0;return `<div class="metric"><span>${esc(tx(l))}</span><b>${esc(num(v))}<small>${u}</small></b><em class="${d===0?"":good?"":"neg"}">${d===0?"—":(d>0?"+":"")+num(d)}</em></div>`}).join("");
    $("#techs").innerHTML=F.TECH.map(x=>`<button class="tech" aria-pressed="${on.has(x.k)}" data-k="${x.k}"><i></i><span>${esc(tx(x.n))}<small>${esc(tx(x.d))} · ${num(x.fx.capex)}m</small></span></button>`).join("");
    $$("#techs .tech").forEach(b=>b.onclick=()=>{const k=b.dataset.k;on.has(k)?on.delete(k):on.add(k);morph=on.size/F.TECH.length;$("#morph").value=Math.round(morph*100);render();ai.set({object:k})});
    $("#capex").textContent=`${tx({ar:"رأس مال تقديري",en:"indicative capex"})} ${num(r.capex)}m AED`;
    drawLine(eff,r);
    const s=walk>=0?F.STATIONS[walk]:null;$("#stInfo").innerHTML=s?`<b>${esc(tx(s.n))}</b> · ${esc(tx({ar:"زمن المحطة",en:"station time"}))} ${num(s.takt)} min<br>${eff[s.k].length?tx({ar:"تقنيات مفعّلة: ",en:"Enabled: "})+eff[s.k].map(k=>tx(F.TECH.find(x=>x.k===k).n)).join(", "):tx({ar:"لا تقنيات مفعّلة هنا بعد",en:"No technologies enabled here yet"})}`:tx({ar:"اضغط «امشِ على الخط» لتتحرك الكاميرا محطةً محطة بإيقاع الإنتاج.",en:"Press 'Walk the line' to move station by station at the line's takt."});
    ai.set({state:{r,base}});
  }
  function drawLine(eff,r){
    const s=$("#line");const n=F.STATIONS.length,W=1200,sw=120,gap=(W-40-n*sw)/(n-1);let g=`<line class="belt" x1="20" y1="200" x2="${W-20}" y2="200"/>`;
    F.STATIONS.forEach((st,i)=>{const x=20+i*(sw+gap),y=90;const e=eff[st.k];const fut=e.length>0;const fl=walk===i;
      g+=`<g class="st" transform="translate(${x},${y})">${fl?`<rect x="-8" y="-30" width="${sw+16}" height="180" rx="6" fill="var(--sovT)" stroke="var(--sov)"/>`:""}<rect class="fl" x="0" y="0" width="${sw}" height="110" rx="4"/><text x="${sw/2}" y="-10" text-anchor="middle">${esc(tx(st.n))}</text>`;
      // worker / robot
      if(e.includes("robotics")||e.includes("agv")){g+=`<rect class="robot" x="20" y="30" width="18" height="40" rx="3"/><rect class="robot" x="38" y="42" width="30" height="6" rx="2"/><circle class="robot" cx="72" cy="45" r="5"/>`}else{g+=`<circle class="worker" cx="30" cy="34" r="8"/><rect class="worker" x="22" y="44" width="16" height="30" rx="4"/>`}
      if(e.includes("hmc"))g+=`<rect x="44" y="56" width="20" height="14" rx="2" fill="none" stroke="var(--sov)"/>`;
      if(e.includes("vision"))g+=`<circle class="cam" cx="${sw-20}" cy="22" r="7"/><path d="M${sw-20} 29 l-12 26 h24z" fill="var(--brassT)"/>`;
      if(e.includes("pdm")||e.includes("iot"))g+=`<circle cx="${sw-14}" cy="90" r="4" fill="var(--good)"><animate attributeName="opacity" values="1;.2;1" dur="1.6s" repeatCount="indefinite"/></circle>`;
      if(e.includes("twins")||e.includes("analytics"))g+=`<rect x="${sw-40}" y="74" width="30" height="22" rx="2" fill="none" stroke="var(--sov)"/><polyline points="${sw-36},92 ${sw-30},84 ${sw-24},88 ${sw-16},78" fill="none" stroke="var(--sov)" stroke-width="1.5"/>`;
      if(e.includes("am"))g+=`<rect x="70" y="60" width="26" height="30" rx="2" fill="none" stroke="var(--brass)"/><rect class="part" x="78" y="76" width="10" height="8"/>`;
      if(e.includes("cv-safety"))g+=`<rect x="4" y="4" width="${sw-8}" height="102" rx="4" fill="none" stroke="var(--good)" stroke-dasharray="3 3"/>`;
      if(e.includes("tooling"))g+=`<path d="M60 92 l10 -10 M64 96 l10 -10" stroke="var(--sov)" stroke-width="2"/>`;
      if(!fut&&Math.random()<0.4)g+=`<circle class="flag" cx="${sw-14}" cy="90" r="4"/>`;
      g+=`<text class="sm" x="${sw/2}" y="130" text-anchor="middle">${num(st.takt)} min · ${fut?num(e.length)+" "+tx({ar:"تقنية",en:"tech"}):tx({ar:"يدوي",en:"manual"})}</text></g>`;
      // parts on belt
      g+=`<rect class="part" x="${x+sw/2-6}" y="194" width="12" height="12" rx="2"><animate attributeName="x" from="${x+sw/2-6}" to="${x+sw+gap+sw/2-6}" dur="${Math.max(1.2,r.takt/10)}s" repeatCount="indefinite"/></rect>`;
    });
    g+=`<text class="sm" x="20" y="250">${esc(tx({ar:"إيقاع الخط",en:"LINE TAKT"}))} ${num(r.takt)} min · ${esc(tx({ar:"الأجزاء تتحرك بسرعة الإيقاع",en:"parts move at takt speed"}))}</text>`;
    s.innerHTML=g;
  }
 },
 insight(c){const st=c.state||{};const r=st.r||F.compute(on),base=st.base||F.compute(new Set());
  if(c.object){const x=F.TECH.find(y=>y.k===c.object);const fx=Object.entries(x.fx).filter(([k])=>k!=="capex").map(([k,v])=>`${{tp:"throughput",q:"quality",inc:"incidents",cost:"cost",down:"downtime"}[k]} ${v>0?"+":""}${Math.round(v*100)}%`).join(", ");return {role:{ar:"مستشار التصنيع",en:"Manufacturing advisor"},lines:[{ar:`${tx(x.n)} (${tx(x.d)}) على محطات ${x.at.map(a=>tx(F.STATIONS.find(s=>s.k===a).n)).join("، ")}. الأثر المنمذج: ${fx}. رأس المال ${num(x.fx.capex)}m.`,en:`${tx(x.n)} (${tx(x.d)}) at ${x.at.map(a=>tx(F.STATIONS.find(s=>s.k===a).n)).join(", ")}. Modelled effect: ${fx}. Capex ${x.fx.capex}m.`}]}}
  const best=F.TECH.filter(x=>!on.has(x.k)).map(x=>({x,v:(x.fx.tp*2-x.fx.down-x.fx.inc*.5-x.fx.cost)/x.fx.capex})).sort((a,b)=>b.v-a.v)[0];
  return {role:{ar:"مستشار التصنيع",en:"Manufacturing advisor"},lines:[{ar:`مقارنة بالحالة الحالية: إنتاجية ${num(r.tp-base.tp>0?"+":"")}${num(r.tp-base.tp)}، توقف ${num((r.down-base.down).toFixed(1))} نقطة، حوادث ${num((r.inc-base.inc).toFixed(1))}.`,en:`Versus current state: throughput ${r.tp-base.tp>0?"+":""}${r.tp-base.tp}, downtime ${(r.down-base.down).toFixed(1)} pts, incidents ${(r.inc-base.inc).toFixed(1)}.`},best?{ar:`الوحدة التالية من الاستثمار تحرّك المقاييس أكثر عند: ${tx(best.x.n)} (${num(best.x.fx.capex)}m).`,en:`The next unit of investment moves the metrics most at: ${tx(best.x.n)} (${best.x.fx.capex}m).`}:{ar:"كل التقنيات مفعّلة؛ العوائد الآن متناقصة بعد السادسة.",en:"All technologies enabled; returns diminish beyond the sixth."}],actions:best?[{label:{ar:"فعّلها",en:"Enable it"},run:()=>{on.add(best.x.k);const b=$(`[data-k="${best.x.k}"]`);if(b)b.click()}}]:[]}}
});
})();
