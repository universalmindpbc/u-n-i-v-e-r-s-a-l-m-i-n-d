import { orbitPose } from './orbit.mjs?v=20261103orbit1';
import { createPerformance } from './performance.mjs?v=20261103orbit1';
import { initMedia } from './media.mjs?v=20261103orbit1';
import { createStory, ORBIT_START, STORY_END } from './story.mjs?v=20261103orbit1';
const $ = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = () => innerWidth < 700;
const status = (message) => { $('scene-status').textContent = message; };
const places = {
  overview: { number: '01 · THE CLEARING', title: 'The clearing', copy: 'An open green space for creative learning, emotional awareness and connection. Music, fashion and mindfulness bring people together, with support close at hand.' },
  main: { number: '02 · MAIN PAVILION', title: 'Main pavilion', copy: 'Music, fashion and collective experiences gather beneath a single vaulted shell, opening onto the lawn. An open dance floor sits among Moroso Tropicália lounges by Patricia Urquiola and hanging seats.' },
  food: { number: '03 · FOOD & PLAY', title: 'Food and play', copy: 'Cooking workshops, shared food and creative activities invite people to learn together. Flowing pavilions open onto the lawn and a sculptural playground.' },
  play: { number: '04 · PLAYGROUND', title: 'Sculptural playground', copy: 'Sculptural play architecture inspired by Zaha Hadid Architects (ZHA). A fluid bridge rises from the lawn, with a walk-through arch, a gently curving upper route and rainbow metallic surfaces in aluminium or stainless steel.' },
  river: { number: '05 · BY THE WATER', title: 'Apple Music area', copy: 'Transparent tubular listening pylons, Moroso Tropicália furniture by Patricia Urquiola and AKG K812 headphones create space for focused listening, reflection and mindfulness by the water.' },
  fashion: { number: '07 · FASHION', title: 'Fashion runway', copy: 'The central approach becomes a runway for Indigenous fashion, self-expression and creative exchange. Models walk among moving images and sculptures, connecting fashion with identity and confidence.' },
  support: { number: '06 · SUPPORT AREA', title: 'Support & connection', copy: 'A shared support space bringing together headspace, Médecins Sans Frontières (MSF), and the Australian Association of Buddhist Counsellors and Psychotherapists (AABCAP). School nominations and headspace referrals connect participants with a welcome conversation, optional support and onward care.' }
};
let sceneAPI = null;
let entered=false,buildStage='site',rain=false,layoutVisible=false,tourTimer=0,storyState=null;
let autoTourCancelled=false,lastAutoView=null,lineupDismissed=false,lineupOverride=null;
const story=createStory(applyStory);
$('world').inert=true;$('world').setAttribute('aria-hidden','true');
const media = initMedia(state => sceneAPI?.setMusicMotion(state));
let night = false;
function syncNight(value){night=value;document.body.dataset.night=String(value);$('night-toggle').setAttribute('aria-pressed',String(value));$('night-toggle').setAttribute('aria-label',value?'Switch to day':'Switch to night');$('day-label').textContent=value?'Night':'Day';}
$('night-toggle').addEventListener('click',()=>{const value=night?0:1;story.setNight(value);syncNight(!!value);sceneAPI?.setNight(value);document.body.dataset.nightProgress=String(value);});
let mode = '3d';
let selected = 'overview';
function selectPlace(key, show = true, automated = false) {
  if(!automated)stopTour();
  selected = key;lineupDismissed=false;syncLineup();
  document.body.dataset.cameraView = key;
  const info = places[key];
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === key)));
  $('place-number').textContent = info.number;
  $('place-title').textContent = info.title;
  $('place-copy').textContent = info.copy;
  if(key!=='overview')emotionPanel(false);
  $('interior-view').hidden=key!=='main';
  $('place-card').hidden = !show || key === 'overview';
  if (mode === '3d') sceneAPI?.go(key);
  status(info.title + ' ' + info.copy);
}
function setMode(next) {
  mode = next;syncLineup();
  document.body.dataset.mode = mode;
  $('plan').hidden = mode !== 'plan';
  $('scene').hidden = mode === 'plan';
  $('plan-toggle').setAttribute('aria-pressed', String(mode === 'plan'));
  $('plan-toggle').innerHTML = mode === 'plan' ? '<span aria-hidden="true">◇</span> 3D view' : '<span aria-hidden="true">▦</span> 2D plan';
  $('labels-toggle').disabled = mode === 'plan';
  $('navigation-hint').textContent = mode === 'plan' ? 'Select a place for details' : mobile() ? 'Drag to orbit · pinch to zoom' : 'Drag to look around · scroll to move closer';
  sceneAPI?.setVisible(mode === '3d' && entered);
  if (mode === '3d') sceneAPI?.go(selected, true);
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => selectPlace(b.dataset.view)));
$('interior-view').addEventListener('click',()=>{stopTour();sceneAPI?.go('interior');$('place-card').hidden=true;});
$('place-close').addEventListener('click', () => { $('place-card').hidden = true; document.querySelector(`[data-view="${selected}"]`).focus(); });
$('reset-view').addEventListener('click', () => selectPlace('overview', false));
$('plan-toggle').addEventListener('click', () => setMode(mode === 'plan' && sceneAPI ? '3d' : 'plan'));
$('labels-toggle').addEventListener('click', () => {
  const visible = $('labels-toggle').getAttribute('aria-pressed') !== 'true';
  $('labels-toggle').setAttribute('aria-pressed', String(visible));
  $('labels').hidden = !visible;
});
document.querySelector('.landing-name').addEventListener('click',()=>$('vision').showModal());
$('about-open').addEventListener('click', () => $('vision').showModal());
$('about-close').addEventListener('click', () => $('vision').close());
$('vision').addEventListener('click', (e) => { if (e.target === $('vision')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });

// Both fullscreen and playback begin synchronously in the Explore gesture.
const fullscreenButton = $('fullscreen-toggle');
let entryShell=null,fullscreenOwner=document;
try {if(parent!==window&&parent.UniversalMindEntry){entryShell=parent.UniversalMindEntry;fullscreenOwner=parent.document;}}catch{}
const fullscreenRoot = fullscreenOwner.documentElement;
const fullscreenActive = () => Boolean(fullscreenOwner.fullscreenElement || fullscreenOwner.webkitFullscreenElement);
const fullscreenSupported = () => Boolean(
  (fullscreenRoot.requestFullscreen && fullscreenOwner.fullscreenEnabled !== false) ||
  (fullscreenRoot.webkitRequestFullscreen && fullscreenOwner.webkitFullscreenEnabled !== false)
);
function syncFullscreen() {
  const active = fullscreenActive();
  fullscreenButton.hidden = !fullscreenSupported();
  fullscreenButton.setAttribute('aria-pressed', String(active));
  const label = active ? 'Exit fullscreen' : 'Enter fullscreen';
  fullscreenButton.setAttribute('aria-label', label);
  fullscreenButton.title = label;
  $('fullscreen-status').hidden = true;
}
async function changeFullscreen(enterOnly=false){
  if(!fullscreenSupported())return;
  fullscreenButton.disabled=true;
  try{
    if(fullscreenActive()){
      if(!enterOnly){const leave=fullscreenOwner.exitFullscreen||fullscreenOwner.webkitExitFullscreen;await leave.call(fullscreenOwner);}
    }else{const enter=fullscreenRoot.requestFullscreen||fullscreenRoot.webkitRequestFullscreen;await enter.call(fullscreenRoot);}
    syncFullscreen();
  }catch{syncFullscreen();if(!enterOnly&&!fullscreenActive()){$('fullscreen-status').textContent='Continue exploring in this window.';$('fullscreen-status').hidden=false;setTimeout(()=>{$('fullscreen-status').hidden=true;},4000);}}
  finally{fullscreenButton.disabled=false;}
}
fullscreenButton.addEventListener('click',()=>changeFullscreen());
function launchFestival(){
  if(entered)return;entered=true;document.body.dataset.entered='true';
  $('landing').hidden=true;$('world').inert=false;$('world').removeAttribute('aria-hidden');
  sceneAPI?.setVisible(mode==='3d');media.start();changeFullscreen(true);startStory();$('replay-story').focus({preventScroll:true});
}
$('explore-enter').addEventListener('click',launchFestival);
function syncLineup(){
 const automatic=selected==='overview'&&!lineupDismissed&&(Number(storyState?.seconds||0)<6||Number(storyState?.seconds||0)>=STORY_END);
 const show=entered&&mode==='3d'&&(lineupOverride??automatic);
 document.body.dataset.lineupVisible=String(show);$('artist-lineup').setAttribute('aria-hidden',String(!show));$('lineup-toggle').setAttribute('aria-pressed',String(show));
}
$('lineup-toggle').addEventListener('click',()=>{stopTour();lineupOverride=document.body.dataset.lineupVisible!=='true';if(lineupOverride){emotionPanel(false);$('place-card').hidden=true;}syncLineup();});
function applyStory(state){
  storyState=state;buildStage=state.phase;
  document.body.dataset.buildStage=state.phase==='night'||state.phase==='dusk'||state.phase==='tour'||state.phase==='orbit'?'open':state.phase;
  document.body.dataset.story=state.seconds>=STORY_END?'complete':state.phase;
  document.body.dataset.storyTime=state.seconds.toFixed(1);
  document.body.dataset.siteReady=String(state.navigation);
  document.body.dataset.nightProgress=state.night.toFixed(3);
  const descriptions={site:'The open site.',arrival:'The road train arrives.',assembly:'The pavilion is being built.',fitout:'Facilities and furnishings are being added.',open:'The Lab is open.',dusk:'Daylight fades and the light show begins.',tour:'Explore the Lab.',orbit:'A continuous journey around the festival.',night:'The site is illuminated.'};
  if($('story-status').dataset.phase!==state.phase){$('story-status').dataset.phase=state.phase;$('story-status').textContent=descriptions[state.phase];}
  syncNight(state.night>.65);sceneAPI?.setStory(state);
  const orbitActive=state.phase==='orbit'&&!autoTourCancelled&&!reduced.matches&&mode==='3d';
  document.body.dataset.cinematic=String(orbitActive);
  if(orbitActive){if(!lastAutoView?.startsWith('orbit')){emotionPanel(false);$('place-card').hidden=true;lineupOverride=null;lineupDismissed=true;lastAutoView='orbit';}sceneAPI?.orbit(state.seconds-ORBIT_START);}
  $('labels').style.visibility=state.navigation&&!orbitActive?'':'hidden';
  if(state.tourView&&!autoTourCancelled&&state.tourView!==lastAutoView){lastAutoView=state.tourView;selectPlace(state.tourView,true,true);if(state.tourView==='overview'&&innerWidth>=1100)emotionPanel(true);}
  const autoActive=!autoTourCancelled&&(state.phase==='tour'||orbitActive);document.body.dataset.tourActive=String(autoActive);if(!tourTimer){$('tour-toggle').textContent=autoActive?'Stop tour':'Tour';$('tour-toggle').setAttribute('aria-pressed',String(autoActive));}
  document.body.dataset.tourStep=state.tourView||'';syncLineup();
}
function startStory(){stopTour();autoTourCancelled=false;lastAutoView=null;lineupOverride=null;emotionPanel(false);$('place-card').hidden=true;selectPlace('overview',false,true);story.start();}
$('replay-story').addEventListener('click',startStory);
function stopTour(){autoTourCancelled=true;document.body.dataset.cinematic='false';if(storyState?.navigation)$('labels').style.visibility='';document.body.dataset.tourActive='false';clearTimeout(tourTimer);tourTimer=0;$('tour-toggle').setAttribute('aria-pressed','false');$('tour-toggle').textContent='Tour';}
$('tour-toggle').addEventListener('click',()=>{
  if(tourTimer||(!autoTourCancelled&&['tour','orbit'].includes(storyState?.phase))){stopTour();return;}
  stopTour();let n=0;const route=['overview','main','food','play','river','support','fashion'];
  $('tour-toggle').setAttribute('aria-pressed','true');$('tour-toggle').textContent='Stop tour';
  const next=()=>{if(n>=route.length){stopTour();selectPlace('overview',false,true);return;}selectPlace(route[n++],true,true);tourTimer=setTimeout(next,n===route.length?10000:5000);};next();
});
function emotionPanel(open){$('emotion-panel').hidden=!open;$('emotion-toggle').setAttribute('aria-expanded',String(open));document.body.dataset.emotionPanel=String(open);}
$('emotion-toggle').addEventListener('click',()=>{stopTour();emotionPanel($('emotion-panel').hidden);});
$('emotion-close').addEventListener('click',()=>{emotionPanel(false);$('emotion-toggle').focus();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('emotion-panel').hidden)emotionPanel(false);});
$('support-pathway').addEventListener('click',()=>{emotionPanel(false);selectPlace('support');});
const connectionSteps=[
  {key:'earth',label:'Connection to our earth',cue:'Feel your feet on the ground, or feel the support beneath you as you sit.'},
  {key:'self',label:'Connection to self',cue:'Feel your breath. Feel your body.'},
  {key:'others',label:'Connection to each other',cue:'Feel the energy of the people around you.'}
];
function updateConnection(){
  stopTour();const value=Number($('response-range').value)/100,step=connectionSteps[value<.34?0:value<.67?1:2];
  $('response-state').textContent=step.label;$('connection-cue').textContent=step.cue;
  document.querySelectorAll('[data-connection]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.connection===step.key)));
  sceneAPI?.setResponse(value);media.setResponse(value);document.body.dataset.responseLevel=value.toFixed(2);document.body.dataset.connectionStep=step.key;
}
$('response-range').addEventListener('input',updateConnection);
document.querySelectorAll('[data-connection]').forEach(button=>button.addEventListener('click',()=>{$('response-range').value=button.dataset.response;updateConnection();}));
$('rain-toggle').addEventListener('click',()=>{rain=!rain;$('rain-toggle').setAttribute('aria-pressed',String(rain));document.body.dataset.rain=String(rain);sceneAPI?.setRain(rain);});
$('layout-toggle').addEventListener('click',()=>{layoutVisible=!layoutVisible;$('layout-toggle').setAttribute('aria-pressed',String(layoutVisible));$('layout-notes').hidden=!layoutVisible;sceneAPI?.setLayout(layoutVisible);});
addEventListener('pagehide',stopTour);
fullscreenOwner.addEventListener('fullscreenchange', syncFullscreen);
fullscreenOwner.addEventListener('webkitfullscreenchange', syncFullscreen);
addEventListener('pagehide',()=>{fullscreenOwner.removeEventListener('fullscreenchange',syncFullscreen);fullscreenOwner.removeEventListener('webkitfullscreenchange',syncFullscreen);});
syncFullscreen();

async function buildWorld() {
  const THREE = await import('three');
  const [{OrbitControls},{createArchitecture},{createSiteFeatures},{createCrowd,createRunwayCrowd},{createLightShow},{createRunway}]=await Promise.all([import('./vendor/OrbitControls.js'),import('./architecture.mjs?v=20261103orbit1'),import('./site-features.mjs?v=20261103orbit1'),import('./crowd.mjs?v=20261103orbit1'),import('./light-show.mjs?v=20261103orbit1'),import('./runway.mjs?v=20261103orbit1')]);
  const architecture=createArchitecture(THREE);
  let seed = 1947;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e9ece2');
  scene.fog = new THREE.Fog('#e9ece2', mobile() ? 205 : 115, mobile() ? 390 : 255);
  const camera = new THREE.PerspectiveCamera(mobile() ? 50 : 41, innerWidth / innerHeight, 0.2, 550);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile() ? 1.6 : 2));
  renderer.setSize(innerWidth, $('world').clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.localClippingEnabled=true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '3D landscape. Drag to orbit, pinch or scroll to zoom. Arrow keys rotate; plus and minus zoom. Use the place buttons for preset views.');
  $('scene').append(canvas);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !reduced.matches;
  controls.dampingFactor = 0.08;
  controls.minDistance = 12;
  controls.maxDistance = mobile() ? 240 : 155;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI * 0.485;
  controls.maxTargetRadius = 100;
  controls.enablePan = false;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.8;
  const skyLight=new THREE.HemisphereLight('#f4f6ed', '#718360', 2.3);scene.add(skyLight);
  const sun = new THREE.DirectionalLight('#fff1d9', 3.4);
  sun.position.set(-48, 78, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile() ? 1024 : 2048, mobile() ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -83, right: 83, top: 75, bottom: -75, near: 1, far: 180 });
  sun.shadow.normalBias = 0.05;
  sun.shadow.bias = -0.0001;
  sun.shadow.radius = 4;
  scene.add(sun);
  const mats = {
    shell: new THREE.MeshStandardMaterial({ color: '#cdb18c', roughness: 0.91, side: THREE.DoubleSide }),
    stone: new THREE.MeshStandardMaterial({ color: '#c7c1a5', roughness: 1 }),
    timber: new THREE.MeshStandardMaterial({ color: '#937a59', roughness: 1 }),
    sand: new THREE.MeshStandardMaterial({ color: '#b7b999', roughness: 1 })
  };
  function mesh(geometry, material, parent = scene) { const m = new THREE.Mesh(geometry, material); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  function riverX(z) { return 44 + Math.sin(z * 0.025) * 7 + Math.sin(z * 0.059) * 2.4; }

  // The land is a broad clearing. Trees and uneven ground stay at its edges.
  const groundGeo = new THREE.PlaneGeometry(340, 300, 100, 90);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  const grassColors = [];
  const baseGrass = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const perimeter = Math.min(1, Math.max(0, (-z - 36) / 35, (-x - 48) / 30));
    const h = perimeter * (1.3 + 1.1 * Math.sin(x * .06) * Math.cos(z * .04));
    pos.setY(i, (Math.abs(x-riverX(z)) < 16 ? 0 : h) - .12);
    const n = Math.sin(x * .12 + Math.cos(z * .06)) * Math.cos(z * .11) * .025 + random() * .012;
    baseGrass.setHSL(.25 + n * .25, .28 + n, .39 + n);
    grassColors.push(baseGrass.r, baseGrass.g, baseGrass.b);
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(grassColors, 3));
  groundGeo.computeVertexNormals();
  const grass = mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  grass.castShadow = false;
  const texCanvas = document.createElement('canvas'); texCanvas.width = texCanvas.height = 256;
  const ctx = texCanvas.getContext('2d');
  ctx.fillStyle = '#b3bda0'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16000; i++) { const s = random() > .5 ? 230 : 75; ctx.fillStyle = `rgba(${s},${s},${s},.07)`; ctx.fillRect(random()*256, random()*256, .5, 2); }
  const groundTexture = new THREE.CanvasTexture(texCanvas); groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping; groundTexture.repeat.set(65,55); groundTexture.colorSpace = THREE.SRGBColorSpace;
  grass.material.map = groundTexture;
  grass.material.needsUpdate = true;

  function riverStrip(width, elevation, material) {
    const verts = [], index = [], uv = [];
    for (let i = 0; i <= 150; i++) { const z = -150 + i * 2; const x = riverX(z),bankWidth=width*(1+.045*Math.sin(z*.15)+.025*Math.sin(z*.4)); verts.push(x-bankWidth, elevation, z, x+bankWidth, elevation, z); uv.push(0,i/150,1,i/150); if(i<150){const a=i*2;index.push(a,a+2,a+1,a+1,a+2,a+3);} }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
    const m=mesh(geo,material);m.castShadow=false;return m;
  }
  riverStrip(10.8,-.015,mats.sand);
  const waterMat = new THREE.ShaderMaterial({
    uniforms: { time:{value:0}, waterA:{value:new THREE.Color('#367f86')}, waterB:{value:new THREE.Color('#a1d4c5')} },
    vertexShader: `varying vec3 vWorld; varying vec2 vFlow;
      void main(){vFlow=uv;vWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float time; uniform vec3 waterA; uniform vec3 waterB; varying vec3 vWorld; varying vec2 vFlow;
      void main(){
        float across=(vFlow.x-.5)*18.8;
        float downstream=vWorld.z-time*1.35;
        float bend=sin(across*.43+downstream*.11)*1.7+sin(across*.91-downstream*.27)*.8;
        float waves=.5+.5*sin(downstream*1.8+bend+sin(across*1.3+downstream*.21)*.7);
        float ribbons=.5+.5*sin(across*3.7+sin(downstream*.28)*1.3+sin(across*1.1+downstream*.47)*1.3);
        float glints=pow(waves,16.)*pow(ribbons,2.)*(.5+.5*sin(across*.37+downstream*.41));
        float current=pow(.5+.5*sin(downstream*.72+across*.6+sin(across*.9)),9.);
        float drift=current*smoothstep(.15,.85,.5+.5*sin(across*.8-downstream*.25));
        float shore=pow(abs(vFlow.x-.5)*2.,5.);
        vec3 c=mix(waterA,waterB,.14+.1*ribbons+.2*shore);
        c=mix(c,waterB,min(.85,glints*.52+drift*.3));
        c+=vec3(.1,.14,.13)*glints;
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side:THREE.DoubleSide
  });
  riverStrip(9.4,.025,waterMat);
  document.body.dataset.riverFlow='downstream';
  // Shared, low-detail geometry keeps the forest light enough for phones.
  const treeList=[];
  for(let i=0;i<170;i++) { const x=-87+random()*131,z=-39-random()*42; if(x<riverX(z)-16)treeList.push({x,z,s: .78+random()*.85}); }
  for(let i=0;i<110;i++){const x=-48-random()*35,z=-35+random()*100;treeList.push({x:z>0?Math.min(x,-71-random()*12):x,z,s:.8+random()*.75});}
  for(let i=0;i<90;i++){const z=-130+random()*255;treeList.push({x:riverX(z)+19+random()*26,z,s:.8+random()*.65});}
  const dummy=new THREE.Object3D();
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.13,.27,1,5),new THREE.MeshStandardMaterial({color:'#8e8d76',roughness:1}),treeList.length);
  const crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#6f8858',roughness:1}),treeList.length*5);
  trunks.castShadow=true;trunks.receiveShadow=true;crowns.castShadow=true;crowns.receiveShadow=true;
  const foliageColor=new THREE.Color();
  treeList.forEach((t,i)=>{
    const edgeH=Math.min(1,Math.max(0,(-t.z-36)/35,(-t.x-48)/30))*(1.3+1.1*Math.sin(t.x*.06)*Math.cos(t.z*.04));
    dummy.position.set(t.x,edgeH+3.4*t.s,t.z);dummy.scale.set(t.s,6.8*t.s,t.s);dummy.rotation.set(0,random()*6.28,.035);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
    for(let j=0;j<5;j++){
      const a=j*2.39+random();
      dummy.position.set(t.x+Math.sin(a)*(j?2:0)*t.s,edgeH+(6.7+(j===0?2.3:random()*2))*t.s,t.z+Math.cos(a)*(j?2:0)*t.s);
      dummy.scale.set((2.1+random())*t.s,(2.6+random()*1.5)*t.s,(2+random())*t.s);dummy.rotation.set(random(),random(),random());dummy.updateMatrix();crowns.setMatrixAt(i*5+j,dummy.matrix);
      foliageColor.setHSL(.24+random()*.055,.18+random()*.13,.23+random()*.11);crowns.setColorAt(i*5+j,foliageColor);
    }
  });scene.add(trunks,crowns);
  const crownMatrices=crowns.instanceMatrix.array.slice();
  const animatedFlags=[];

  const paths=new THREE.Group();scene.add(paths);
  function path(points,width=2.4){
    const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.055,p[1])));
    const verts=[],ind=[];
    for(let i=0;i<=80;i++){const p=c.getPoint(i/80),t=c.getTangent(i/80);verts.push(p.x-t.z*width/2,p.y,p.z+t.x*width/2,p.x+t.z*width/2,p.y,p.z-t.x*width/2);if(i<80){const a=i*2;ind.push(a,a+2,a+1,a+1,a+2,a+3);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(ind);g.computeVertexNormals();const m=mesh(g,mats.stone,paths);m.castShadow=false;
  }
  path([[2,62],[1,38],[0,21],[1,6],[0,-6]],3.3);
  path([[0,8],[-8,0],[-19,-7],[-25,-8]]);
  path([[0,21],[-10,23],[-24,19]]);
  path([[0,14],[10,15],[20,10],[25,0]],1.8);
  path([[-25,-8],[-31,-14],[-35,-24]],1.8);

  const architectureGroup=new THREE.Group();scene.add(architectureGroup);
  const buildings={};
  const main=architecture.mainVault();main.position.set(0,.08,-12);architectureGroup.add(main);buildings.main=main;
  const platform=mesh(new THREE.BoxGeometry(24,.16,20),mats.stone,main);platform.position.y=-.08;
  for(const [key,x,z,scale,rotation] of [['food',-24,-9,1,-.35],['park',-23,20,.88,-1.1],['support',-34,-24,.78,.35]]){
    const g=architecture.satellite({scale});g.position.set(x,.08,z);g.rotation.y=rotation;architectureGroup.add(g);buildings[key]=g;
    const deck=mesh(new THREE.CylinderGeometry(6.4,6.4,.15,64),mats.stone,g);deck.scale.z=.85;deck.position.y=-.08;
  }
  const playground=architecture.playground({rainbow:true});playground.position.set(-17,.08,31);playground.rotation.y=.35;architectureGroup.add(playground);buildings.playground=playground;
  const buildPlanes={};
  for(const [key,g] of Object.entries(buildings)){
    const plane=new THREE.Plane(new THREE.Vector3(0,-1,0),0);buildPlanes[key]=plane;
    const cloned=new Map();g.traverse(o=>{if(!o.isMesh)return;const clone=m=>{if(!cloned.has(m)){const n=m.clone();n.clippingPlanes=[plane];n.clipShadows=true;cloned.set(m,n);}return cloned.get(m);};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);});
  }
  const lightShow=createLightShow(THREE,scene,Object.values(buildings),architecture);
  const features=createSiteFeatures(THREE,scene,$('music-video'),architecture,$('stage-geometry-video'));
  const crowd=createCrowd(THREE),runwayCrowd=createRunwayCrowd(THREE),runway=createRunway(THREE,scene,features.videoMap);scene.add(crowd.builders,crowd.visitors,runwayCrowd.group);
  const performanceStage=createPerformance(THREE);scene.add(performanceStage.group);
  crowd.visitors.traverse(o=>{if(o.isInstancedMesh)o.userData.fullCount=o.count;});
  const contextStart=scene.children.length;
  // Contextual proposal identities: physical flags, a vehicle and a staff uniform.
  const images = Object.fromEntries(await Promise.all([
    ['flower','universal-mind-flower.png'],['headspace','headspace.svg'],['msf','msf.svg'],['education','nsw-government.svg'],['apple','apple-music.svg'],['vogue','vogue.png']
  ].map(async ([key,file]) => {
    const image = new Image(); image.src = new URL('./assets/'+file,import.meta.url).href;
    await image.decode(); return [key,image];
  })));
  function monochrome(image,width,height) {
    const c=document.createElement('canvas');c.width=width;c.height=height;
    const context=c.getContext('2d');context.drawImage(image,0,0,width,height);
    context.globalCompositeOperation='source-in';context.fillStyle='#293b35';context.fillRect(0,0,width,height);return c;
  }
  function brandTexture(key,flag=false) {
    const c=document.createElement('canvas');c.width=1024;c.height=flag?768:384;
    const context=c.getContext('2d');
    if(flag){context.fillStyle='#f3f0e7';context.fillRect(0,0,c.width,c.height);context.globalAlpha=.72;context.drawImage(images.flower,24,70,620,620);context.globalAlpha=1;}
    const img=images[key],ratio=img.naturalWidth/img.naturalHeight;
    const w=flag?(key==='flower'?530:key==='education'?170:490):900,h=w/ratio;
    if(key==='flower'){context.clearRect(0,0,c.width,c.height);context.fillStyle='#f3f0e7';context.fillRect(0,0,c.width,c.height);context.drawImage(img,70,(c.height-h)/2,w,h);}else context.drawImage(monochrome(img,Math.round(w),Math.round(h)),flag?72:62,(c.height-h)/2,w,h);
    if(key==='education'){context.fillStyle='#293b35';context.font='500 43px Arial';context.fillText('Education',260,400);}
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return texture;
  }
  const brandMaps=Object.fromEntries(['headspace','msf','education','apple'].map(key=>[key,brandTexture(key)]));
  const poleMat=new THREE.MeshStandardMaterial({color:'#7a8278',metalness:.6,roughness:.42});
  function flag(key,x,z,angle=.55){
    const group=new THREE.Group();group.name=key+' triangular proposal flag';group.position.set(x,0,z);group.rotation.y=angle;scene.add(group);
    const pole=mesh(new THREE.CylinderGeometry(.055,.075,6.8,10),poleMat,group);pole.position.y=3.4;
    const base=mesh(new THREE.CylinderGeometry(.45,.55,.18,24),mats.stone,group);base.position.y=.09;
    const geometry=new THREE.PlaneGeometry(1,1,24,14),positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){const u=positions.getX(i)+.5,v=positions.getY(i)+.5;positions.setXYZ(i,.09+u*4.1,4.9+(v-.5)*(1-u)*3.1,.17*Math.sin(u*7+v*1.6)*u);}
    geometry.computeVertexNormals();
    animatedFlags.push({geometry,base:positions.array.slice()});
    mesh(geometry,new THREE.MeshStandardMaterial({map:brandTexture(key,true),roughness:.96,side:THREE.DoubleSide}),group);
    return group;
  }
  flag('headspace',-27,-17.5,2.65);flag('msf',-40,-22,2.65);flag('flower',12.6,-1,.55);flag('education',-7.6,30,.6);flag('apple',25,5);flag('vogue',7.6,30,-.6);
  const messagePalette=['#5ab8f5','#f7da59','#f486c3','#8edcb0'];
  const messagePlacements=[['Peace',-10,40,.4],['Love',16,31,-.5],['Unity',-14,16,.3],['Respect',29,18,-.5],['PLUR',-18,-17,.4],['This Too Shall Pass',18,-30,.3],['Kindness',-28,-30,.4],['Namaste',30,-4,-.45]];
  for(const [i,[text,x,z,angle]] of messagePlacements.entries()){
    const g=flag('flower',x,z,angle);g.name=text+' message flag';g.scale.setScalar(.72);
    const c=document.createElement('canvas');c.width=1024;c.height=768;const ctx=c.getContext('2d');
    ctx.fillStyle=messagePalette[i%4];ctx.fillRect(0,0,1024,768);ctx.globalAlpha=.25;ctx.drawImage(images.flower,30,125,500,500);ctx.globalAlpha=1;
    ctx.fillStyle='#142c38';ctx.textAlign='left';ctx.font='800 italic 104px Arial';
    const words=text==='This Too Shall Pass'?['This too','shall pass']: [text];if(words.length>1)ctx.font='700 italic 73px Arial';words.forEach((word,j)=>ctx.fillText(word,55,words.length===1?425:352+j*90));
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    g.children[2].material.map.dispose();g.children[2].material.map=texture;g.children[2].material.needsUpdate=true;
  }
  document.body.dataset.messageFlags=messagePlacements.map(x=>x[0]).join('|');
  function decal(key,w,h,parent,x,y,z,rotation=0){
    const mark=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:brandMaps[key],transparent:true,depthWrite:false,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}),parent);
    mark.position.set(x,y,z);mark.rotation.y=rotation;mark.castShadow=false;return mark;
  }
  const booth=new THREE.Group();booth.name='Proposed headspace welcome booth';booth.position.set(-34,0,-22);booth.rotation.y=.45;scene.add(booth);
  const counter=mesh(new THREE.BoxGeometry(2.6,1.05,.85),mats.timber,booth);counter.position.y=.525;
  const sign=mesh(new THREE.BoxGeometry(1.7,.38,.05),new THREE.MeshStandardMaterial({color:'#f5f4eb',roughness:1}),booth);sign.position.set(0,.63,.45);decal('headspace',1.5,.34,booth,0,.63,.48);
  const staff=new THREE.Group();staff.name='Illustrative headspace staff figure';staff.position.set(-28.8,.08,-16.7);staff.rotation.y=.55;scene.add(staff);
  const uniform=new THREE.MeshStandardMaterial({color:'#d6e0cc',roughness:1}),trousers=new THREE.MeshStandardMaterial({color:'#455853',roughness:1}),skin=new THREE.MeshStandardMaterial({color:'#ac8462',roughness:.9});
  const torso=mesh(new THREE.BoxGeometry(.48,.62,.26),uniform,staff);torso.position.y=1.08;
  const head=mesh(new THREE.SphereGeometry(.145,18,12),skin,staff);head.position.y=1.58;
  for(const side of [-1,1]){const leg=mesh(new THREE.CylinderGeometry(.075,.06,.72,10),trousers,staff);leg.position.set(side*.13,.36,0);const arm=mesh(new THREE.CapsuleGeometry(.065,.46,4,10),uniform,staff);arm.position.set(side*.3,1.03,0);arm.rotation.z=side*.1;}
  decal('headspace',.38,.14,staff,0,1.22,.137);decal('headspace',.38,.14,staff,0,1.22,-.137,Math.PI);
  const vehicle=new THREE.Group();vehicle.name='Illustrative MSF support vehicle';vehicle.position.set(-36,.12,-15);vehicle.rotation.y=.55;scene.add(vehicle);
  const paint=new THREE.MeshStandardMaterial({color:'#f0f1e9',roughness:.38,metalness:.12}),rubber=new THREE.MeshStandardMaterial({color:'#303531',roughness:.95}),glass=new THREE.MeshStandardMaterial({color:'#6f898b',roughness:.18,metalness:.28});
  function vehicleBox(w,h,d,material,x,y,z){const part=mesh(new THREE.BoxGeometry(w,h,d),material,vehicle);part.position.set(x,y,z);return part;}
  vehicleBox(2.05,.85,4.5,paint,0,.8,0);vehicleBox(1.92,1,2.55,paint,0,1.63,-.52);vehicleBox(1.98,.14,2.65,paint,0,2.17,-.52);vehicleBox(1.7,.69,.035,glass,0,1.7,.77);
  for(const side of [-1,1]){
    vehicleBox(.035,.63,1.92,glass,side*.977,1.72,-.5);
    for(const z of [-1.45,1.42]){const tire=mesh(new THREE.CylinderGeometry(.47,.47,.3,24),rubber,vehicle);tire.rotation.z=Math.PI/2;tire.position.set(side*1.04,.47,z);const hub=mesh(new THREE.CylinderGeometry(.24,.24,.315,16),poleMat,vehicle);hub.rotation.z=Math.PI/2;hub.position.copy(tire.position);}
    decal('msf',1.38,.53,vehicle,side*1.035,1.02,-.2,side*Math.PI/2);
    vehicleBox(.4,.16,.04,new THREE.MeshStandardMaterial({color:'#ece4b5',roughness:.3}),side*.65,.99,2.27);
  }
  vehicleBox(2.16,.17,.22,rubber,0,.52,2.27);vehicleBox(2.16,.17,.22,rubber,0,.52,-2.27);
  document.body.dataset.brandAssets='ready';
  const contextDecor=new THREE.Group();const contextObjects=scene.children.slice(contextStart);contextObjects.forEach(o=>contextDecor.add(o));scene.add(contextDecor);
  const anchorData=[['main','Main pavilion',[0,8.4,-12]],['food','Food',[-24,6.5,-9]],['play','Playground',[-17,3.8,31]],['river','Apple Music area',[22,1.3,8]],['support','Support',[-32,3,-20]],['fashion','Fashion runway',[0,2.2,24]]];
  const anchors=anchorData.map(([key,label,p])=>{
    const el=document.createElement('button');el.className='scene-label';el.dataset.key=key;el.tabIndex=-1;el.innerHTML='<i></i>'+label;el.addEventListener('click',()=>selectPlace(key));$('labels').append(el);return {el,p:new THREE.Vector3(...p)};
  });
  const presets={
    overview:{pos:[65,51,82],target:[-1,0,0]},
    main:{pos:[21,12,19],target:[0,3,-12]},
    interior:{pos:[0,3.2,-1],target:[0,3.1,-18.9]},
    food:{pos:[11,23,43],target:[-20,2,11]},
    play:{pos:[0,8,45],target:[-17,1.6,31]},
    river:{pos:[32,5,23],target:[23,1.7,10]},
    support:{pos:[-21,13,-37],target:[-33,2,-18]},
    fashion:{pos:[16,9,46],target:[0,1.5,23]}
  };
  const nightLights=[];
  for(const [x,z,colour] of [[-9,-8,'#d98bff'],[9,-8,'#67c8e4'],[-24,-9,'#ffc798'],[-23,20,'#b2a0ff'],[25,5,'#70dfcb']]){
    const light=new THREE.PointLight(colour,0,24,1.3);light.position.set(x,2,z);scene.add(light);nightLights.push(light);
  }
  let tween=null,visible=true,raf=0,needsFrame=true,lastT=0,musicMotion=false,motionTime=0,waterTime=0,lastWaterFrame=0;
  let currentStory={seconds:0,construction:0,programme:0,night:0,navigation:false};
  let responseLevel=.7;
  const goldSky=new THREE.Color('#efc284'),peachSky=new THREE.Color('#c4868d'),goldSun=new THREE.Color('#ffc474');
  const daySky=new THREE.Color('#e9ece2'),nightSky=new THREE.Color('#101f30'),daySun=new THREE.Color('#fff1d9'),nightSun=new THREE.Color('#a5c0e2');
  const dayWaterA=new THREE.Color('#367f86'),nightWaterA=new THREE.Color('#123d48'),dayWaterB=new THREE.Color('#a1d4c5'),nightWaterB=new THREE.Color('#397280');
  function setNight(value){
    currentStory.night=Number(value);features.setNight(value);lightShow.set(Number(value),currentStory.programme>0);
    const v=Number(value);if(v<.3)scene.background.lerpColors(daySky,goldSky,v/.3);else if(v<.58)scene.background.lerpColors(goldSky,peachSky,(v-.3)/.28);else scene.background.lerpColors(peachSky,nightSky,(v-.58)/.42);scene.fog.color.copy(scene.background);
    skyLight.intensity=2.3-1.75*value;sun.intensity=3.4-3.16*value;
    if(v<.5)sun.color.lerpColors(daySun,goldSun,v*2);else sun.color.lerpColors(goldSun,nightSun,(v-.5)*2);sun.position.y=78-96*v;renderer.toneMappingExposure=1.15+.2*value;
    nightLights.forEach((light,i)=>light.intensity=currentStory.programme>0?Math.max(0,Math.min(1,(value-i*.09)/.45))*32:0);
    waterMat.uniforms.waterA.value.lerpColors(dayWaterA,nightWaterA,Number(value));waterMat.uniforms.waterB.value.lerpColors(dayWaterB,nightWaterB,Number(value));
    needsFrame=true;requestFrame();
  }
  function setResponse(value){responseLevel=value;lightShow.setResponse(value);features.setResponse(value);nightLights.forEach((light,i)=>{light.color.setHSL(.48+value*.3+i*.04,.6,.65);light.intensity=currentStory.programme>0?currentStory.night*(12+value*24):0;});document.body.dataset.sceneResponse=value.toFixed(2);needsFrame=true;requestFrame();}
  function setStory(value){
    currentStory={...value};
    for(const [key,g] of Object.entries(buildings)){const p=value[key]||0;g.visible=p>0;buildPlanes[key].constant=p>=1?100:Math.max(.1,p*8.7);}
    contextDecor.visible=value.programme>0;paths.visible=value.seconds>=16;runway.setVisible(value.furniture>0);runwayCrowd.group.visible=value.programme>0;
    features.setStory(value);setNight(value.night);setResponse(responseLevel);crowd.builders.visible=value.seconds>6&&value.seconds<29;crowd.visitors.visible=value.programme>0;performanceStage.group.visible=value.programme>=1;
    crowd.visitors.traverse(o=>{if(o.isInstancedMesh)o.count=Math.floor(70*value.programme)*(o.userData.fullCount/70);});
    document.body.dataset.revealed=Object.keys(buildings).filter(k=>value[k]>=1).join(',');
    document.querySelectorAll('#place-list,.view-tools').forEach(e=>e.inert=!value.navigation);
    $('labels').style.visibility=value.navigation?'':'hidden';
    if(value.seconds<32)renderer.shadowMap.needsUpdate=true;needsFrame=true;requestFrame();
  }
  function setRain(value){features.setRain(value);needsFrame=true;renderer.shadowMap.needsUpdate=true;requestFrame();}
  function setLayout(value){features.setLayout(value);needsFrame=true;requestFrame();}
  function animateMusic(t){
    for(const {geometry,base} of animatedFlags){const a=geometry.attributes.position;for(let i=0;i<a.count;i++){const u=(base[i*3]-.09)/4.1;a.setZ(i,base[i*3+2]+Math.sin(t*2.3+u*7+base[i*3+1])*u*.24);}a.needsUpdate=true;geometry.computeVertexNormals();}
    const a=crowns.instanceMatrix.array;for(let i=0;i<crowns.count;i++){const n=i*16;a[n+12]=crownMatrices[n+12]+Math.sin(t*.75+crownMatrices[n+14]*.07)*.28;a[n+14]=crownMatrices[n+14]+Math.cos(t*.6+crownMatrices[n+12]*.06)*.16;}crowns.instanceMatrix.needsUpdate=true;
    document.body.dataset.motionFrame=String(Math.round(t*100));
  }
  function setMusicMotion(value){musicMotion=value;document.body.dataset.musicMotion=String(value);needsFrame=true;requestFrame();}

  function go(key,instant=false){
    const p=presets[key];const end=new THREE.Vector3(...p.pos),target=new THREE.Vector3(...p.target);
    if(mobile()&&key==='overview'){end.set(102,90,134);target.set(-1,0,0);}else if(mobile()){end.sub(target).multiplyScalar(1.5).add(target);}
    if(instant||reduced.matches){camera.position.copy(end);controls.target.copy(target);controls.update();tween=null;}else{tween={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),to:end,target};}
    needsFrame=true;requestFrame();
  }
  function orbit(seconds){
    const pose=orbitPose(seconds,mobile());tween=null;controls.enableDamping=false;
    camera.position.fromArray(pose.position);controls.target.fromArray(pose.target);controls.update();controls.enableDamping=!reduced.matches;
    document.body.dataset.orbitShot=pose.shot;document.body.dataset.cameraPosition=camera.position.toArray().map(n=>n.toFixed(2)).join(',');
    needsFrame=true;requestFrame();
  }
  function resize(){const w=$('world').clientWidth,h=$('world').clientHeight;camera.aspect=w/h;camera.fov=mobile()?50:41;controls.maxDistance=mobile()?240:155;scene.fog.near=mobile()?205:115;scene.fog.far=mobile()?390:255;camera.updateProjectionMatrix();renderer.setSize(w,h);needsFrame=true;if(selected==='overview')go('overview',true);requestFrame();}
  addEventListener('resize',resize);
  controls.addEventListener('start',()=>{tween=null;stopTour();lineupDismissed=true;syncLineup();});
  controls.addEventListener('change',()=>{needsFrame=true;requestFrame();});
  canvas.addEventListener('keydown',(e)=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key))return;
    e.preventDefault();stopTour();lineupDismissed=true;syncLineup();tween=null;const sph=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if(e.key==='ArrowLeft')sph.theta-=.12;if(e.key==='ArrowRight')sph.theta+=.12;if(e.key==='ArrowUp')sph.phi=Math.max(.1,sph.phi-.1);if(e.key==='ArrowDown')sph.phi=Math.min(Math.PI*.485,sph.phi+.1);
    if(e.key==='+'||e.key==='=')sph.radius=Math.max(12,sph.radius*.9);if(e.key==='-')sph.radius=Math.min(controls.maxDistance,sph.radius*1.1);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));controls.update();needsFrame=true;requestFrame();
  });
  function requestFrame(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
  function frame(t){
    raf=0;if(!visible||document.hidden)return;
    const waterMoving=entered&&media.motionEnabled();if(waterMoving&&lastWaterFrame)waterTime+=Math.min(.05,Math.max(0,(t-lastWaterFrame)/1000));lastWaterFrame=t;
    if(features.update(motionTime,t)){needsFrame=true;}
    crowd.update(musicMotion?motionTime:t*.001,{construction:currentStory.construction,dancing:musicMotion,visible:currentStory.seconds>6,night:currentStory.night});performanceStage.update(motionTime,musicMotion);lightShow.update(motionTime);runwayCrowd.update(motionTime,{moving:musicMotion,visible:runwayCrowd.group.visible});
    if(tween){const a=Math.min(1,(t-tween.start)/1250),ease=a*a*(3-2*a);camera.position.lerpVectors(tween.from,tween.to,ease);controls.target.lerpVectors(tween.fromTarget,tween.target,ease);if(a===1)tween=null;needsFrame=true;}
    controls.update();
    const videoActive=!$('music-video').paused&&$('music-video').readyState>=2;
    if(!reduced.matches||musicMotion||needsFrame||videoActive||waterMoving){
      // Cap render work at approximately 30fps.
      if(t-lastT>30||needsFrame){if(musicMotion){motionTime+=Math.min(.05,Math.max(0,(t-lastT)/1000));animateMusic(motionTime);}waterMat.uniforms.time.value=waterTime;document.body.dataset.riverTime=waterTime.toFixed(3);renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;lastT=t;needsFrame=false;
        const w=$('world').clientWidth,h=$('world').clientHeight,placed=[];
        for(const a of anchors){
          const p=a.p.clone().project(camera),x=(p.x*.5+.5)*w;let y=(-p.y*.5+.5)*h;
          const width=a.el.offsetWidth||120;
          for(let attempt=0;attempt<6&&placed.some(b=>Math.abs(x-b.x)<(width+b.width)/2+5&&Math.abs(y-b.y)<34);attempt++)y-=34;
          const hidden=p.z>1||p.z<-1||x<20||x>w-20||y<80||y>h-200;
          a.el.style.display=hidden?'none':'';a.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;
          if(!hidden)placed.push({x,y,width});
        }
        document.body.dataset.rendered='true';document.body.dataset.renderCalls=String(renderer.info.render.calls);document.body.dataset.renderTriangles=String(renderer.info.render.triangles);
      }
    }
    if(!reduced.matches||musicMotion||tween||needsFrame||videoActive||waterMoving)requestFrame();
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{needsFrame=true;requestFrame();}});
  reduced.addEventListener('change',()=>{controls.enableDamping=!reduced.matches;needsFrame=true;requestFrame();});
  canvas.addEventListener('webglcontextlost',(e)=>{e.preventDefault();setMode('plan');status('The 3D view paused. The 2D site plan remains available.');});
  go('overview',true);resize();
  return {go,orbit,setNight,setStory,setResponse,setRain,setLayout,setMusicMotion,setVisible(v){visible=v;if(!v){cancelAnimationFrame(raf);raf=0;}else{needsFrame=true;requestFrame();}},stats(){return {triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,trees:treeList.length,...features.stats};}};
}

try {
  sceneAPI=await buildWorld();
  sceneAPI.setNight(0);sceneAPI.setMusicMotion(media.isAnimating());sceneAPI.setStory(storyState||{seconds:0,phase:'site',main:0,food:0,park:0,support:0,apple:0,playground:0,furniture:0,programme:0,truck:0,construction:0,night:0,navigation:false});sceneAPI.setRain(rain);sceneAPI.setLayout(layoutVisible);
  $('loading').hidden=true;$('explore-enter').disabled=false;
  document.body.dataset.ready='true';
  setMode('3d');
  status('The landscape is ready. Explore with the place buttons or drag the scene.');
  if(document.documentElement.dataset.autoLaunch==='true')launchFestival();
} catch(error) {
  console.error('Lab landscape:',error);
  $('loading').hidden=true;$('explore-enter').disabled=false;
  document.body.dataset.ready='fallback';
  setMode('plan');
  $('plan-toggle').disabled=true;
  $('plan-toggle').textContent='2D plan';
  $('navigation-hint').textContent='3D unavailable · explore the site plan';
  status('3D is unavailable on this device. The site plan and all place descriptions are available.');
}

if(document.documentElement.dataset.autoLaunch==='true'&&!entered)launchFestival();
