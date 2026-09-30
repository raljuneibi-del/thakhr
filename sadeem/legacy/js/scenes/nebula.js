/* SADEEM HANGAR · scene: nebula to star (WebGL points). The field condenses from a diffuse cloud into the
   four-point SADEEM mark, breathes at rest, and parts like an iris when the visitor enters. */
(function(){
function starPt(r){const arm=Math.random()<.5;const t=Math.pow(Math.random(),1.35)*(Math.random()<.5?1:-1);
  const w=(1-Math.abs(t))*.12*Math.pow(Math.random(),.6)*(Math.random()<.5?1:-1);const z=(Math.random()-.5)*.08*(1-Math.abs(t));
  return arm?[t*r,w*r,z*r]:[w*r,t*r,z*r]}
function cloudPt(r){const a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1),d=Math.pow(Math.random(),.45)*r*2.4;
  return [Math.sin(b)*Math.cos(a)*d*1.5,Math.sin(b)*Math.sin(a)*d*.75,Math.cos(b)*d*.6]}
const VS=[
"uniform float uP,uOpen,uT,uPix;attribute vec3 aCloud,aStar;attribute float aSeed,aSize;varying float vA,vSeed;",
"void main(){float e=uP*uP*(3.0-2.0*uP);vec3 p=mix(aCloud,aStar,e);",
"p+=vec3(sin(uT*.6+aSeed*6.283)*.03*(1.0-e*.7),cos(uT*.5+aSeed*4.0)*.02,sin(uT*.7+aSeed*2.0)*.02);",
"float o=uOpen*uOpen;p+=normalize(p+vec3(.0001))*o*(3.5+aSeed*3.0);",
"vec4 mv=modelViewMatrix*vec4(p,1.0);float depth=-mv.z;",
"gl_PointSize=aSize*uPix*(9.0/depth)*(1.0+e*.6)*(1.0-o*.6);gl_Position=projectionMatrix*mv;",
"vA=(0.35+0.65*e)*(1.0-o)*smoothstep(14.0,4.0,depth);vSeed=aSeed;}"].join("\n");
const FS=[
"precision mediump float;varying float vA,vSeed;",
"void main(){vec2 c=gl_PointCoord-0.5;float d=length(c);float a=smoothstep(0.5,0.05,d)*vA;",
"vec3 gold=mix(vec3(0.98,0.90,0.70),vec3(0.78,0.62,0.32),vSeed);vec3 col=mix(gold,vec3(1.0,0.97,0.88),smoothstep(0.35,0.0,d)*.8);",
"gl_FragColor=vec4(col,a);}"].join("\n");

window.Nebula3D=async function(canvas){
  const RM=H.RM;const T=await loadThree();
  const R=new T.WebGLRenderer({canvas,antialias:false,alpha:true,powerPreference:"high-performance"});
  R.setPixelRatio(Math.min(devicePixelRatio||1,1.75));R.setClearColor(0x000000,0);
  const S=new T.Scene();const CAM=new T.PerspectiveCamera(38,1,.1,60);CAM.position.set(0,.15,7.2);
  const N=innerWidth<700?3000:7000,r=1.55;
  const cloud=new Float32Array(N*3),star=new Float32Array(N*3),seed=new Float32Array(N),psize=new Float32Array(N);
  for(let i=0;i<N;i++){const c=cloudPt(r),s=i<N*.88?starPt(r):cloudPt(r*.55);cloud.set(c,i*3);star.set(s,i*3);seed[i]=Math.random();psize[i]=1.2+Math.pow(Math.random(),3)*3.2}
  const G=new T.BufferGeometry();G.setAttribute("position",new T.BufferAttribute(cloud.slice(),3));G.setAttribute("aCloud",new T.BufferAttribute(cloud,3));G.setAttribute("aStar",new T.BufferAttribute(star,3));G.setAttribute("aSeed",new T.BufferAttribute(seed,1));G.setAttribute("aSize",new T.BufferAttribute(psize,1));
  const U={uP:{value:RM?1:0},uOpen:{value:0},uT:{value:0},uPix:{value:Math.min(devicePixelRatio||1,1.75)}};
  const M=new T.ShaderMaterial({uniforms:U,vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  S.add(new T.Points(G,M));
  /* hangar floor: a receding grid that reads as the apron the visitor stands on */
  const grid=new T.GridHelper(44,44,0x8A6E3A,0x3E3422);grid.position.y=-2.15;grid.material.transparent=true;grid.material.opacity=.28;S.add(grid);
  const fogPlane=new T.Mesh(new T.PlaneGeometry(60,30),new T.MeshBasicMaterial({color:0x100E0A,transparent:true,opacity:.0}));fogPlane.position.set(0,-2.14,-8);fogPlane.rotation.x=-Math.PI/2;S.add(fogPlane);
  /* rib arcs of the hangar */
  const ribM=new T.LineBasicMaterial({color:0xC8A45C,transparent:true,opacity:.22});
  for(let k=0;k<5;k++){const pts=[];const z=-3-k*2.2,w=5.2+k*1.4,h=3.4+k*.9;for(let i=0;i<=40;i++){const a=Math.PI*i/40;pts.push(new T.Vector3(Math.cos(a)*w,Math.sin(a)*h-2.15,z))}
    const l=new T.Line(new T.BufferGeometry().setFromPoints(pts),ribM.clone());l.material.opacity=.22-k*.035;S.add(l)}
  let raf=0,t0=performance.now(),mx=0,my=0,target={x:0,y:0},open=0,opening=false,onOpened=null,stopped=false;
  const size=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;R.setSize(w,h,false);CAM.aspect=w/h;CAM.updateProjectionMatrix()};
  size();const ro=new ResizeObserver(size);ro.observe(canvas);
  const onMove=e=>{target.x=(e.clientX/innerWidth-.5);target.y=(e.clientY/innerHeight-.5)};
  if(!RM)addEventListener("pointermove",onMove,{passive:true});
  function frame(now){if(stopped)return;raf=requestAnimationFrame(frame);const T2=(now-t0)/1000;
    if(!RM){U.uP.value=Math.min(1,Math.max(0,(T2-.6)/3.4))}
    if(opening){open=Math.min(1,open+.016);U.uOpen.value=open;CAM.position.z=7.2-open*4.6;if(open>=1&&onOpened){const f=onOpened;onOpened=null;f()}}
    U.uT.value=T2;mx+=(target.x-mx)*.04;my+=(target.y-my)*.04;
    CAM.position.x=mx*.9;CAM.position.y=.15-my*.5;CAM.lookAt(0,0,0);
    const breathe=1+Math.sin(T2*.8)*.012;S.children[0].scale.setScalar(breathe);S.children[0].rotation.z=Math.sin(T2*.15)*.05;
    R.render(S,CAM)}
  raf=requestAnimationFrame(frame);
  return {open(cb){opening=true;onOpened=cb;if(RM){open=1;U.uOpen.value=1;cb&&cb()}},
    stop(){stopped=true;cancelAnimationFrame(raf);ro.disconnect();removeEventListener("pointermove",onMove);try{R.dispose()}catch(e){}}};
};
})();
