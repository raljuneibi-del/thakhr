/* SADEEM HANGAR · OPS_CORE mission engine (pure, no DOM) · ported verbatim */
/* ================= OPS CORE (pure simulation, no DOM) ================= */
const OPS_CORE=(()=>{
const KM=0.5;                       // 1 map unit = 0.5 km
const BASE={x:-120,z:-40},VIL={x:130,z:60},ZONE={x:40,z:30},STATION={x:104,z:38},CONVOY={x:52,z:40};
const WIND={x:.8,z:.6};             // shamal: from north-west towards south-east
const proj=(x,z)=>WIND.x*x+WIND.z*z;
const S0=-150,SV=70,TMAX=6;          // storm front position (map units) and speed (units/h)
const stormAt=t=>S0+SV*t;
const inStorm=(x,z,t)=>proj(x,z)<stormAt(t);
const stormArrival=(x,z)=>(proj(x,z)-S0)/SV;

/* routes: point lists with terrain tag for the segment that starts at each point */
const R={
 hwy:{tag:"road",pts:[BASE,[-95,-72],[-60,-96],[-10,-110],[40,-108],[90,-94],[128,-62],[146,-20],[142,24],VIL]},
 trk:{tag:"dune",pts:[BASE,[-95,-5],[-60,35],[-15,78],[40,108],[92,110],[122,90],VIL]},
 wad:{tags:["plain","plain","plain","wadi","wadi","wadi","wadi","wadi"],pts:[BASE,[-80,-30],[-30,-20],[20,-8],[62,8],[84,14],STATION,[120,50],VIL]},
 zon:{tags:["plain","plain","dune","dune"],pts:[BASE,[-80,-10],[-30,10],[10,24],ZONE]},
};
const P=p=>Array.isArray(p)?{x:p[0],z:p[1]}:p;
function dense(route,upto){const pts=route.pts.map(P);const out=[];let s=0;
  const n=upto!=null?upto:pts.length-1;
  for(let i=0;i<n;i++){const a=pts[i],b=pts[i+1],tag=route.tags?route.tags[i]:route.tag;const L=Math.hypot(b.x-a.x,b.z-a.z),k=Math.max(1,Math.ceil(L/3));
    for(let j=0;j<k;j++){const f=j/k;const x=a.x+(b.x-a.x)*f,z=a.z+(b.z-a.z)*f;if(out.length){const p=out[out.length-1];s+=Math.hypot(x-p.x,z-p.z)}out.push({x,z,s,tag})}}
  const e=pts[n];const p=out[out.length-1];s+=Math.hypot(e.x-p.x,e.z-p.z);out.push({x:e.x,z:e.z,s,tag:out[out.length-1].tag});return out}
function line(a,b){a=P(a);b=P(b);const L=Math.hypot(b.x-a.x,b.z-a.z),k=Math.max(2,Math.ceil(L/4)),out=[];for(let j=0;j<=k;j++){const f=j/k;out.push({x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f,s:L*f,tag:"air"})}return out}
const PATHS={hwy:dense(R.hwy),trk:dense(R.trk),wad:dense(R.wad),zon:dense(R.zon),sta:dense(R.wad,6)};
const pathKm=k=>Math.round(PATHS[k][PATHS[k].length-1].s*KM);

/* fleet: illustrative indices for a training exercise, not operational data */
const ASSETS=[
 {id:"W1",n:"LV-8",code:"8×8",type:"g",cap:3,spd:{road:60,dune:38,wadi:32,plain:45},watch:.5,search:1/1.5,st:{speed:.5,load:1,end:.9,dust:.9},ar:"مركبة قتالية مدرعة",en:"Armoured combat vehicle"},
 {id:"M1",n:"TV-1",code:"4×4",type:"g",cap:1.5,spd:{road:95,dune:30,wadi:42,plain:55},watch:.4,search:1/1.5,st:{speed:.75,load:.5,end:.8,dust:.55},ar:"مركبة تكتيكية متعددة المهام",en:"Multi-role tactical vehicle"},
 {id:"M2",n:"TV-2",code:"4×4",type:"g",cap:1.5,spd:{road:95,dune:30,wadi:42,plain:55},watch:.4,search:1/1.5,st:{speed:.75,load:.5,end:.8,dust:.55},ar:"مركبة تكتيكية متعددة المهام",en:"Multi-role tactical vehicle"},
 {id:"B1",n:"ISR-A",code:"ISR",type:"a",spd:450,end:4,watch:1,blind:.2,search:1/.35,alt:36,st:{speed:1,load:0,end:.6,dust:.35},ar:"طائرة استطلاع وهجوم خفيف",en:"Light attack and ISR aircraft"},
 {id:"D1",n:"UAV-1",code:"UAV",type:"a",drone:1,spd:120,end:3,watch:1,search:1/.8,alt:20,st:{speed:.3,load:0,end:.45,dust:.1},ar:"درون استطلاع",en:"Reconnaissance drone"},
 {id:"D2",n:"UAV-2",code:"UAV",type:"a",drone:1,spd:120,end:3,watch:1,search:1/.8,alt:20,st:{speed:.3,load:0,end:.45,dust:.1},ar:"درون استطلاع",en:"Reconnaissance drone"}];
const TASKS=[{k:"deliver",w:.4,need:2,due:5},{k:"search",w:.3,due:3},{k:"watch",w:.3}];
const fits=(a,task)=>task==="deliver"?a.type==="g":true;

function pathFor(a,task,route){
  if(a.type==="g")return task==="deliver"?PATHS[route||"wad"]:task==="search"?PATHS.zon:PATHS.sta;
  return line(BASE,task==="search"?ZONE:STATION)}

/* create a simulation for plan = {assign:{assetId:task}, route:"hwy"|"trk"|"wad"} */
function createSim(plan){
  const U=ASSETS.filter(a=>plan.assign[a.id]).map(a=>{const task=plan.assign[a.id],path=pathFor(a,task,plan.route);
    return {a,task,path,d:0,i:0,x:path[0].x,z:path[0].z,st:"go",air:0,flags:{}}});
  const S={t:0,U,events:[],delivered:[],searchP:0,found:null,cov:0,covT:[],done:false,flags:{}};
  const ev=(k,o={})=>S.events.push({t:S.t,k,...o});
  function advance(u,dist){const p=u.path;u.d=Math.min(u.d+dist,p[p.length-1].s);while(u.i<p.length-2&&p[u.i+1].s<=u.d)u.i++;const a=p[u.i],b=p[u.i+1]||a;const f=b.s>a.s?(u.d-a.s)/(b.s-a.s):0;u.x=a.x+(b.x-a.x)*f;u.z=a.z+(b.z-a.z)*f;u.tag=a.tag;return u.d>=p[p.length-1].s-1e-6}
  function step(dt){if(S.done)return;const t=S.t;
    if(!S.flags.base&&inStorm(BASE.x,BASE.z,t)){S.flags.base=1;ev("stormBase")}
    if(!S.flags.zone&&inStorm(ZONE.x,ZONE.z,t)){S.flags.zone=1;ev("stormZone")}
    if(!S.flags.sta&&inStorm(STATION.x,STATION.z,t)){S.flags.sta=1;ev("stormSta")}
    let cov=0,srch=0;
    for(const u of S.U){const a=u.a,storm=inStorm(u.x,u.z,t);
      if(u.st==="stuck"||u.st==="down"||u.st==="rtb"||u.st==="done")continue;
      if(a.type==="a"){u.air+=dt;
        if(a.drone&&storm){u.st="down";ev("down",{u:a.n});continue}
        if(!a.drone&&storm&&!u.flags.blind){u.flags.blind=1;ev("blind",{u:a.n})}
        if(u.air>=a.end){u.st="rtb";ev("rtb",{u:a.n});continue}}
      if(u.st==="go"){let v;
        if(a.type==="a")v=a.spd;
        else{const base=a.spd[u.tag||"plain"]||a.spd.plain;let f=1;
          if(storm){if(u.tag==="road"){f=.3;if(!S.flags.road){S.flags.road=1;ev("road")}}
            else if(u.tag==="dune"){if(a.id!=="W1"){u.st="stuck";ev("stuck",{u:a.n});continue}f=.5}
            else if(u.tag==="wadi")f=.8;else f=.5}
          v=base*f}
        const arrived=advance(u,v*2*dt);
        if(arrived){if(u.task==="deliver"){u.st="done";S.delivered.push({t:t+dt,cap:a.cap,u:a.n});ev("arrive",{u:a.n})}
          else if(u.task==="search"){u.st="search";ev("onSearch",{u:a.n})}else{u.st="station";ev("onStation",{u:a.n})}}}
      else if(u.st==="search"){if(S.found!=null){u.st="done";continue}
        srch+=a.type==="a"?(storm?0:a.search):(storm?a.search*.5:a.search)}
      else if(u.st==="station"){cov=Math.max(cov,a.type==="a"?(storm?(a.blind||0):a.watch):a.watch)}}
    if(srch>0&&S.found==null){S.searchP+=srch*dt;if(S.searchP>=1){S.found=t+dt;ev("found")}}
    S.cov+=cov*dt;S.covT.push(cov);
    S.t=t+dt;if(S.t>=TMAX-1e-9){S.t=TMAX;S.done=true}}
  function result(){
    const R={};const del=S.U.filter(u=>u.task==="deliver"),se=S.U.filter(u=>u.task==="search"),wa=S.U.filter(u=>u.task==="watch");
    let got=0,late=0,first=null;for(const d of S.delivered){if(d.t<=5){got+=d.cap}else{late+=d.cap*.5}if(first==null)first=d.t}
    const lastOn=S.delivered.filter(d=>d.t<=5).reduce((m,d)=>Math.max(m,d.t),0);
    R.deliver={score:Math.round(Math.min(1,(got+late)/2)*100),n:del.length,got,late,lastOn,stuck:del.filter(u=>u.st==="stuck").map(u=>u.a.n),road:!!S.flags.road&&del.some(u=>plan.route==="hwy")};
    const f=S.found;R.search={score:f==null?0:f<=3?100:f<=4.5?60:30,n:se.length,t:f,down:se.filter(u=>u.st==="down").map(u=>u.a.n),air:se.some(u=>u.a.type==="a")};
    R.watch={score:Math.round(S.cov/TMAX*100),n:wa.length,blindAfter:stormArrival(STATION.x,STATION.z)};
    R.total=Math.round(R.deliver.score*.4+R.search.score*.3+R.watch.score*.3);
    // capability gaps, most important first
    const G=[];
    if(R.watch.score<85)G.push("watch");
    if(R.deliver.stuck.length)G.push("dune");
    if(R.deliver.road&&R.deliver.score<100)G.push("forecast");
    if(R.search.score<100&&!R.search.air&&R.search.n)G.push("launch");
    if(R.search.down.length&&!G.includes("watch"))G.push("watch");
    R.gaps=G.slice(0,2);return R}
  return {S,step,result};
}
function simulate(plan,dt=.005){const s=createSim(plan);while(!s.S.done)s.step(dt);return s.result()}
return {KM,BASE,VIL,ZONE,STATION,CONVOY,WIND,proj,S0,SV,TMAX,stormAt,inStorm,stormArrival,R,PATHS,pathKm,ASSETS,TASKS,fits,pathFor,line,createSim,simulate};
})();

window.OPS_CORE=OPS_CORE;
