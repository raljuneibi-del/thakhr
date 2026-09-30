/* SADEEM HANGAR · 3D viewer: neutral studio lighting, explode, layers, ghost compare. Uses the procedural placeholder models. */
(function(){
function loadS(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.async=false;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
let lp=null;
window.loadThree=function(){if(lp)return lp;lp=(async()=>{if(!window.THREE)await loadS(window.THREE_SRC||"https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js");return THREE})();lp.catch(()=>{lp=null});return lp};
const OFF={chassis:[0,0,0],structure:[0,0,0],frame:[0,0,0],power:[0,.5,-1.4],engine:[0,.6,-1.2],armour:[0,1.5,0],mission:[0,2.4,0],cooling:[1.8,.4,0],ai:[0,2.8,1.2],avionics:[0,1.3,1.2],motors:[0,.9,0],energy:[0,-.7,0],sensors:[0,1.6,.9],wing:[1.6,0,0],payload:[0,-.9,0]};
window.Viewer=function(host){
 let R,S,CAM,MOD=null,GHOST=null,MF,cv,raf=0,last=0,ro,exp=0,vis=null,hlSlot=null,sig="",ready=false;
 const orb={th:.8,ph:1.15,r:12,tth:.8,tph:1.15,tr:12,user:0,min:4,max:40};
 async function init(){const T=await loadThree();if(!window.CALMOD)throw new Error("models");MF=CALMOD();
  cv=document.createElement("canvas");R=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:false,powerPreference:"high-performance"});R.setPixelRatio(Math.min(devicePixelRatio,1.6));
  R.outputEncoding=T.sRGBEncoding;R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=.95;R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;
  S=new T.Scene();S.background=new T.Color(0x131417);S.fog=new T.Fog(0x131417,26,60);
  CAM=new T.PerspectiveCamera(30,1,.1,200);
  S.add(new T.HemisphereLight(0xE8E9E4,0x2A2C30,.55));
  const key=new T.DirectionalLight(0xFFF6E8,1.9);key.position.set(8,16,10);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.0003;key.shadow.camera.left=key.shadow.camera.bottom=-14;key.shadow.camera.right=key.shadow.camera.top=14;S.add(key);
  const fill=new T.DirectionalLight(0xCFD8E6,.55);fill.position.set(-10,6,-6);S.add(fill);
  const rim=new T.PointLight(0xC9A164,.9,30,1.6);rim.position.set(-6,3,-8);S.add(rim);
  // floor: graphite with a 1 m grid
  const c=document.createElement("canvas");c.width=c.height=1024;const x=c.getContext("2d");x.fillStyle="#1B1C1F";x.fillRect(0,0,1024,1024);
  x.strokeStyle="rgba(255,255,255,.07)";x.lineWidth=1;for(let i=0;i<=1024;i+=51.2){x.beginPath();x.moveTo(i,0);x.lineTo(i,1024);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(1024,i);x.stroke()}
  x.strokeStyle="rgba(201,161,100,.35)";x.lineWidth=2;x.beginPath();x.arc(512,512,400,0,7);x.stroke();
  const ft=new T.CanvasTexture(c);ft.encoding=T.sRGBEncoding;ft.anisotropy=8;
  const floor=new T.Mesh(new T.CircleGeometry(20,96),new T.MeshStandardMaterial({map:ft,roughness:.75,metalness:.15}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;S.add(floor);
  const P=new Map();let pinch=0;
  cv.addEventListener("pointerdown",e=>{cv.setPointerCapture(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);orb.user=performance.now()});
  cv.addEventListener("pointermove",e=>{if(!P.has(e.pointerId))return;const [px,py]=P.get(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);orb.user=performance.now();
    if(P.size===1){orb.tth-=(e.clientX-px)*.008;orb.tph=Math.max(.5,Math.min(1.5,orb.tph-(e.clientY-py)*.006))}
    else if(P.size===2){const v=[...P.values()];const d=Math.hypot(v[0][0]-v[1][0],v[0][1]-v[1][1]);if(pinch)orb.tr=Math.max(orb.min,Math.min(orb.max,orb.tr*pinch/d));pinch=d}});
  const up=e=>{P.delete(e.pointerId);if(P.size<2)pinch=0};cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
  cv.addEventListener("wheel",e=>{e.preventDefault();orb.tr=Math.max(orb.min,Math.min(orb.max,orb.tr*(1+Math.sign(e.deltaY)*.08)));orb.user=performance.now()},{passive:false});
  ro=new ResizeObserver(size);ready=true}
 function size(){if(!R)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;R.setSize(w,h,false);CAM.aspect=w/h;CAM.updateProjectionMatrix()}
 function prep(root){root.updateMatrixWorld(true);root.traverse(o=>{if(o.isMesh)o.userData.base=o.material});root.children.forEach(ch=>{ch.userData.o=ch.position.clone();ch.userData.s=ch.userData.slot||(function f(o){if(o.userData.slot)return o.userData.slot;for(const c of o.children){const r=f(c);if(r)return r}return null})(ch)})}
 function applyExplode(root){if(!root)return;const L=(root.userData.len||7)/6;root.children.forEach(ch=>{if(!ch.userData.o)return;const o=OFF[ch.userData.s]||[0,.6,0];ch.position.set(ch.userData.o.x+o[0]*L*exp,ch.userData.o.y+o[1]*L*exp,ch.userData.o.z+o[2]*L*exp)})}
 function applyVis(root){if(!root)return;root.traverse(o=>{if(o.isMesh){const s=o.userData.slot;o.visible=!vis||!s||vis.has(s);if(o.userData.base)o.material=(hlSlot&&s===hlSlot)?hlMat():o.userData.base}})}
 let _hl=null;function hlMat(){if(_hl)return _hl;_hl=new THREE.MeshStandardMaterial({color:0xC9A164,emissive:0x6A4C1E,roughness:.4,metalness:.3});return _hl}
 function frame(now){if(!cv||!cv.isConnected){raf=0;return}raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-(last||now))/1000);last=now;
  if(performance.now()-orb.user>4000&&!H.RM)orb.tth+=dt*.12;
  orb.th+=(orb.tth-orb.th)*Math.min(1,dt*6);orb.ph+=(orb.tph-orb.ph)*Math.min(1,dt*6);orb.r+=(orb.tr-orb.r)*Math.min(1,dt*5);
  const ty=(MOD&&MOD.userData.h||3)*.4+exp*1.2;CAM.position.set(Math.sin(orb.th)*Math.sin(orb.ph)*orb.r,ty+Math.cos(orb.ph)*orb.r,Math.cos(orb.th)*Math.sin(orb.ph)*orb.r);CAM.lookAt(0,ty,0);
  if(MOD)MF.animate(MOD,dt);R.render(S,CAM)}
 return {
  async mount(){host.classList.add("ld");try{if(!ready)await init()}catch(e){host.classList.remove("ld");host.classList.add("fail");return false}host.appendChild(cv);host.classList.remove("ld");ro.observe(host);size();if(!raf){last=0;raf=requestAnimationFrame(frame)}return true},
  set(type,cfg){if(!ready)return;const s=type+JSON.stringify(cfg);if(s===sig&&MOD)return;sig=s;const first=!MOD;if(MOD){S.remove(MOD)}
   MOD=MF.build(type,cfg);MOD.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});prep(MOD);S.add(MOD);const len=MOD.userData.len||7;orb.min=len*.8;orb.max=len*3.5;if(first||orb.p!==type){orb.tr=orb.r=len*(innerWidth<820?2.3:1.8);orb.p=type}applyExplode(MOD);applyVis(MOD);if(GHOST)applyExplode(GHOST)},
  explode(f){exp=f;applyExplode(MOD);applyExplode(GHOST)},
  layers(set){vis=set;applyVis(MOD)},
  highlight(slot){hlSlot=slot;applyVis(MOD)},
  ghost(type,cfg){if(GHOST){S.remove(GHOST);GHOST=null}if(!cfg||!ready)return;GHOST=MF.build(type,cfg);const m=new THREE.MeshStandardMaterial({color:0x6FA8E6,transparent:true,opacity:.28,depthWrite:false,roughness:.5});GHOST.traverse(o=>{if(o.isMesh)o.material=m});prep(GHOST);S.add(GHOST);applyExplode(GHOST)},
  stop(){if(raf)cancelAnimationFrame(raf);raf=0;if(ro)ro.disconnect()}
 };
};
})();
