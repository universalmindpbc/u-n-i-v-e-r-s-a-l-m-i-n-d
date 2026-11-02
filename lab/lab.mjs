import { initMedia } from './media.mjs';
const $ = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = () => innerWidth < 700;
const status = (message) => { $('scene-status').textContent = message; };
const places = {
  overview: { number: '01 · THE CLEARING', title: 'Open lawn', copy: 'A generous green lawn holds the programme together. Forest meets two boundaries; a river or creek frames a third.', note: 'An illustrative setting. The host community will help choose and shape the actual site.' },
  main: { number: '02 · MAIN PAVILION', title: 'Main pavilion', copy: 'Music, fashion and collective experiences gather beneath a single vaulted shell, opening onto the lawn.', note: 'A Droneport-derived form study. Capacity, construction and rain protection remain design workstreams.' },
  food: { number: '03 · FOOD & PLAY', title: 'Food and play pavilions', copy: 'Two fluid satellite shells create places for cooking, conversation and younger visitors, with clear views across the lawn.', note: 'The same provisional material palette as the main vault, with simpler surfaces and no oval apertures.' },
  river: { number: '04 · BY THE WATER', title: 'Apple Music area', copy: 'A triangular Apple Music flag marks the proposed listening area. Future stages add Tropicália seats and transparent tubular listening pylons.', note: 'Proposed collaboration. Waterway separation, acoustics and light-rain shelter remain in development.' },
  support: { number: '05 · SUPPORT AREA', title: 'Support area', copy: 'A welcome booth, headspace staff figure and MSF support vehicle illustrate the proposed facilities. Triangular flags share the Universal Mind flower.', note: 'Illustrative placements. Partner participation, staffing and clinical services remain to be agreed.' }
};
let sceneAPI = null;
const media = initMedia(state => sceneAPI?.setMusicMotion(state));
let night = false;
$('night-toggle').addEventListener('click',()=>{
  night=!night;document.body.dataset.night=String(night);
  $('night-toggle').setAttribute('aria-pressed',String(night));
  $('night-toggle').setAttribute('aria-label',night?'Switch to day':'Switch to night');
  $('day-label').textContent=night?'Night':'Day';sceneAPI?.setNight(night);
});
let mode = '3d';
let selected = 'overview';
function selectPlace(key, show = true) {
  selected = key;
  document.body.dataset.cameraView = key;
  const info = places[key];
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === key)));
  $('place-number').textContent = info.number;
  $('place-title').textContent = info.title;
  $('place-copy').textContent = info.copy;
  $('place-footnote').textContent = info.note;
  $('place-card').hidden = !show || key === 'overview';
  if (mode === '3d') sceneAPI?.go(key);
  status(info.title + ' ' + info.copy);
}
function setMode(next) {
  mode = next;
  document.body.dataset.mode = mode;
  $('plan').hidden = mode !== 'plan';
  $('scene').hidden = mode === 'plan';
  $('plan-toggle').setAttribute('aria-pressed', String(mode === 'plan'));
  $('plan-toggle').innerHTML = mode === 'plan' ? '<span aria-hidden="true">◇</span> 3D view' : '<span aria-hidden="true">▦</span> 2D plan';
  $('labels-toggle').disabled = mode === 'plan';
  $('navigation-hint').textContent = mode === 'plan' ? 'Select a place for details' : mobile() ? 'Drag to orbit · pinch to zoom' : 'Drag to look around · scroll to move closer';
  sceneAPI?.setVisible(mode === '3d');
  if (mode === '3d') sceneAPI?.go(selected, true);
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => selectPlace(b.dataset.view)));
$('place-close').addEventListener('click', () => { $('place-card').hidden = true; document.querySelector(`[data-view="${selected}"]`).focus(); });
$('reset-view').addEventListener('click', () => selectPlace('overview', false));
$('plan-toggle').addEventListener('click', () => setMode(mode === 'plan' && sceneAPI ? '3d' : 'plan'));
$('labels-toggle').addEventListener('click', () => {
  const visible = $('labels-toggle').getAttribute('aria-pressed') !== 'true';
  $('labels-toggle').setAttribute('aria-pressed', String(visible));
  $('labels').hidden = !visible;
});
$('about-open').addEventListener('click', () => $('vision').showModal());
$('about-close').addEventListener('click', () => $('vision').close());
$('vision').addEventListener('click', (e) => { if (e.target === $('vision')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });

// Fullscreen is initiated only by the visitor's button press.
const fullscreenButton = $('fullscreen-toggle');
const fullscreenRoot = document.documentElement;
const fullscreenActive = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
const fullscreenSupported = () => Boolean(
  (fullscreenRoot.requestFullscreen && document.fullscreenEnabled !== false) ||
  (fullscreenRoot.webkitRequestFullscreen && document.webkitFullscreenEnabled !== false)
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
fullscreenButton.addEventListener('click', async () => {
  fullscreenButton.disabled = true;
  try {
    if (fullscreenActive()) {
      const leave = document.exitFullscreen || document.webkitExitFullscreen;
      await leave.call(document);
    } else {
      const enter = fullscreenRoot.requestFullscreen || fullscreenRoot.webkitRequestFullscreen;
      await enter.call(fullscreenRoot);
    }
    syncFullscreen();
  } catch {
    syncFullscreen();
    $('fullscreen-status').textContent = 'Fullscreen is unavailable. Continue exploring in this window.';
    $('fullscreen-status').hidden = false;
  } finally {
    fullscreenButton.disabled = false;
  }
});
document.addEventListener('fullscreenchange', syncFullscreen);
document.addEventListener('webkitfullscreenchange', syncFullscreen);
syncFullscreen();

async function buildWorld() {
  const THREE = await import('three');
  const { OrbitControls } = await import('./vendor/OrbitControls.js');
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
  controls.maxTargetRadius = 36;
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
    for (let i = 0; i <= 150; i++) { const z = -150 + i * 2; const x = riverX(z); verts.push(x-width, elevation, z, x+width, elevation, z); uv.push(0,i/150,1,i/150); if(i<150){const a=i*2;index.push(a,a+2,a+1,a+1,a+2,a+3);} }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
    const m=mesh(geo,material);m.castShadow=false;return m;
  }
  riverStrip(10.8,-.015,mats.sand);
  const waterMat = new THREE.ShaderMaterial({
    uniforms: { time:{ value:0 }, waterA:{value:new THREE.Color('#4d8d87')}, waterB:{value:new THREE.Color('#9cb9a7')} },
    vertexShader: 'varying vec3 vWorld; void main(){vWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform float time; uniform vec3 waterA; uniform vec3 waterB; varying vec3 vWorld; void main(){float n=sin(vWorld.x*2.8+sin(vWorld.z*.7)+time*.28)*sin(vWorld.z*1.2+time*.19);float broad=sin(vWorld.z*.14+vWorld.x*.2)*.5+.5;float sparkle=pow(max(0.,n),18.)*.24;vec3 c=mix(waterA,waterB,.22+broad*.2+sparkle);gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    side: THREE.DoubleSide
  });
  riverStrip(9.4,.025,waterMat);
  // Shared, low-detail geometry keeps the forest light enough for phones.
  const treeList=[];
  for(let i=0;i<170;i++) { const x=-87+random()*131,z=-39-random()*42; if(x<riverX(z)-16)treeList.push({x,z,s: .78+random()*.85}); }
  for(let i=0;i<110;i++)treeList.push({x:-48-random()*35,z:-35+random()*100,s:.8+random()*.75});
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
  const animatedFlags=[],animatedPeople=[];

  function path(points,width=2.4){
    const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.055,p[1])));
    const verts=[],ind=[];
    for(let i=0;i<=80;i++){const p=c.getPoint(i/80),t=c.getTangent(i/80);verts.push(p.x-t.z*width/2,p.y,p.z+t.x*width/2,p.x+t.z*width/2,p.y,p.z-t.x*width/2);if(i<80){const a=i*2;ind.push(a,a+2,a+1,a+1,a+2,a+3);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(ind);g.computeVertexNormals();const m=mesh(g,mats.stone);m.castShadow=false;
  }
  path([[2,62],[1,38],[0,21],[1,6],[0,-6]],3.3);
  path([[0,8],[-8,0],[-19,-7],[-25,-8]]);
  path([[0,21],[-10,23],[-24,19]]);
  path([[0,14],[10,15],[20,10],[25,0]],1.8);
  path([[-25,-8],[-31,-14],[-35,-24]],1.8);

  // A closed shell with a thin edge, generated from a continuous surface.
  function shell(surface,thickness,stepsU=48,stepsV=48){
    const pts=[],idx=[];
    for(let side=0;side<2;side++)for(let j=0;j<=stepsV;j++)for(let i=0;i<=stepsU;i++){
      const p=surface(i/stepsU,j/stepsV);pts.push(p[0],p[1]-side*thickness,p[2]);
    }
    const count=(stepsU+1)*(stepsV+1);
    for(let j=0;j<stepsV;j++)for(let i=0;i<stepsU;i++){
      const a=j*(stepsU+1)+i,b=a+1,c=a+stepsU+1,d=c+1;idx.push(a,c,b,b,c,d,a+count,b+count,c+count,b+count,d+count,c+count);
    }
    function edge(a,b){idx.push(a,b,a+count,b,b+count,a+count);}
    for(let i=0;i<stepsU;i++){edge(i+1,i);edge(stepsV*(stepsU+1)+i,stepsV*(stepsU+1)+i+1);}
    for(let j=0;j<stepsV;j++){edge(j*(stepsU+1),(j+1)*(stepsU+1));edge((j+1)*(stepsU+1)+stepsU,j*(stepsU+1)+stepsU);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  const main=new THREE.Group();main.position.set(0,0,-12);scene.add(main);
  const vault=mesh(shell((u,v)=>{const x=2*u-1,z=2*v-1;return [x*11.3,.28+4.15*Math.sqrt(1-x*x)+3.5*Math.sqrt(1-z*z),z*9.2];},.28),mats.shell,main);
  vault.name='Main pavilion — provisional shell';
  const platform=mesh(new THREE.BoxGeometry(24,.16,20),mats.stone,main);platform.position.y=-.01;
  // Sparse radial joints communicate scale without specifying a construction system.
  const jointMat=new THREE.LineBasicMaterial({color:'#9b8469',transparent:true,opacity:.13});
  for(let i=1;i<18;i++){
    const x=-1+i/9,p=[];for(let j=0;j<=60;j++){const z=-1+j/30;p.push(new THREE.Vector3(x*11.3,.295+4.15*Math.sqrt(1-x*x)+3.5*Math.sqrt(1-z*z),z*9.2));}main.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),jointMat));
  }
  function satellite(x,z,scale,rotation){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;g.scale.setScalar(scale);scene.add(g);
    const spine=new THREE.CubicBezierCurve3(new THREE.Vector3(0,.2,-3.7),new THREE.Vector3(0,5.8,-6),new THREE.Vector3(0,6.7,0),new THREE.Vector3(0,5.4,4));
    mesh(shell((u,v)=>{const p=spine.getPoint(v),w=.9+5.2*Math.sin(v*Math.PI/2),q=u*2-1;return [q*w,p.y-.95*q*q*Math.sin(v*Math.PI/2),p.z+.9*q*q*Math.sin(v*Math.PI/2)];},.19,36,44),mats.shell,g);
    const deck=mesh(new THREE.CylinderGeometry(6.4,6.4,.15,64),mats.stone,g);deck.scale.z=.85;deck.position.set(0,0,0);
    return g;
  }
  satellite(-24,-9,1,-.35);satellite(-23,20,.88,-1.1);
  // Service/support footprint is intentionally plain until the facilities stage.
  const support=mesh(new THREE.BoxGeometry(6,2.7,4),new THREE.MeshStandardMaterial({color:'#a6aa90',roughness:1}));support.position.set(-36,1.3,-24);
  const supportRoof=mesh(new THREE.BoxGeometry(6.5,.15,4.5),mats.timber);supportRoof.position.set(-36,2.73,-24);
  // Contextual proposal identities: physical flags, a vehicle and a staff uniform.
  const images = Object.fromEntries(await Promise.all([
    ['flower','universal-mind-flower.png'],['headspace','headspace.svg'],['msf','msf.svg'],['education','nsw-government.svg'],['apple','apple-music.svg']
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
    const w=flag?(key==='education'?170:490):900,h=w/ratio;
    context.drawImage(monochrome(img,Math.round(w),Math.round(h)),flag?72:62,(c.height-h)/2,w,h);
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
  flag('headspace',-30,-24,2.65);flag('msf',-40,-22,2.65);flag('education',11,-3);flag('apple',25,5);
  function decal(key,w,h,parent,x,y,z,rotation=0){
    const mark=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:brandMaps[key],transparent:true,depthWrite:false,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}),parent);
    mark.position.set(x,y,z);mark.rotation.y=rotation;mark.castShadow=false;return mark;
  }
  const booth=new THREE.Group();booth.name='Proposed headspace welcome booth';booth.position.set(-30,0,-18);booth.rotation.y=.45;scene.add(booth);
  const counter=mesh(new THREE.BoxGeometry(2.6,1.05,.85),mats.timber,booth);counter.position.y=.525;
  for(const x of [-1.45,1.45]){const post=mesh(new THREE.CylinderGeometry(.055,.055,2.65,8),poleMat,booth);post.position.set(x,1.325,-.4);}
  const canopy=mesh(new THREE.BoxGeometry(3.3,.11,2),mats.shell,booth);canopy.position.set(0,2.65,-.25);
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
  // Human scale figures are illustrative, with no artist likenesses.
  const personColours=['#ded7c1','#6c8174','#c1b09a','#7c858e','#cebea5'];
  const people=[[-2,0],[3,-8],[-6,-13],[6,-15],[-24,-5],[-21,-7],[-18,20],[-26,20],[0,29],[1,34],[16,13],[21,7],[-10,9],[-8,8],[6,20],[-2,-17]];
  people.forEach(([x,z],i)=>{
    const g=new THREE.Group();g.position.set(x,.08,z);g.rotation.y=random()*6.28;scene.add(g);animatedPeople.push({group:g,angle:g.rotation.y});
    const cloth=new THREE.MeshStandardMaterial({color:personColours[i%personColours.length],roughness:1});
    const torso=mesh(new THREE.CapsuleGeometry(.19,.48,3,6),cloth,g);torso.position.y=1.02;
    const head=mesh(new THREE.SphereGeometry(.135,8,6),new THREE.MeshStandardMaterial({color:i%3?'#bba286':'#806956'}),g);head.position.y=1.55;
    for(const s of [-1,1]){const leg=mesh(new THREE.CylinderGeometry(.065,.05,.69,5),cloth,g);leg.position.set(s*.11,.35,0);}
  });
  const anchorData=[['main','Main pavilion',[0,8.4,-12]],['food','Food',[-24,6.5,-9]],['food','Play',[-23,5.7,20]],['river','Apple Music area',[22,1.3,8]],['support','Support',[-32,3,-20]]];
  const anchors=anchorData.map(([key,label,p])=>{
    const el=document.createElement('button');el.className='scene-label';el.dataset.key=key;el.tabIndex=-1;el.innerHTML='<i></i>'+label;el.addEventListener('click',()=>selectPlace(key));$('labels').append(el);return {el,p:new THREE.Vector3(...p)};
  });
  const presets={
    overview:{pos:[65,51,82],target:[-1,0,0]},
    main:{pos:[27,17,24],target:[0,3,-10]},
    food:{pos:[3,23,40],target:[-22,2,4]},
    river:{pos:[35,6,18],target:[26,3,5]},
    support:{pos:[-21,13,-37],target:[-33,2,-18]}
  };
  const nightLights=[];
  for(const [x,z,colour] of [[-9,-8,'#d98bff'],[9,-8,'#67c8e4'],[-24,-9,'#ffc798'],[-23,20,'#b2a0ff'],[25,5,'#70dfcb']]){
    const light=new THREE.PointLight(colour,0,24,1.3);light.position.set(x,2,z);scene.add(light);nightLights.push(light);
  }
  let tween=null,visible=true,raf=0,needsFrame=true,lastT=0,musicMotion=false,motionTime=0;
  function setNight(value){
    scene.background.set(value?'#101f30':'#e9ece2');scene.fog.color.copy(scene.background);
    skyLight.intensity=value?.55:2.3;sun.intensity=value?.24:3.4;
    sun.color.set(value?'#a5c0e2':'#fff1d9');renderer.toneMappingExposure=value?1.35:1.15;
    nightLights.forEach(light=>light.intensity=value?32:0);
    waterMat.uniforms.waterA.value.set(value?'#123d48':'#4d8d87');waterMat.uniforms.waterB.value.set(value?'#397280':'#9cb9a7');
    needsFrame=true;renderer.shadowMap.needsUpdate=true;requestFrame();
  }
  function animateMusic(t){
    for(const {geometry,base} of animatedFlags){const a=geometry.attributes.position;for(let i=0;i<a.count;i++){const u=(base[i*3]-.09)/4.1;a.setZ(i,base[i*3+2]+Math.sin(t*2.3+u*7+base[i*3+1])*u*.24);}a.needsUpdate=true;geometry.computeVertexNormals();}
    animatedPeople.forEach(({group,angle},i)=>{group.rotation.z=Math.sin(t*2.1+i*.7)*.045;group.rotation.y=angle+Math.sin(t*1.1+i)*.12;group.position.y=.08+Math.abs(Math.sin(t*2.1+i*.7))*.06;});
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
  function resize(){const w=$('world').clientWidth,h=$('world').clientHeight;camera.aspect=w/h;camera.fov=mobile()?50:41;controls.maxDistance=mobile()?240:155;scene.fog.near=mobile()?205:115;scene.fog.far=mobile()?390:255;camera.updateProjectionMatrix();renderer.setSize(w,h);needsFrame=true;if(selected==='overview')go('overview',true);requestFrame();}
  addEventListener('resize',resize);
  controls.addEventListener('start',()=>{tween=null;});
  controls.addEventListener('change',()=>{needsFrame=true;requestFrame();});
  canvas.addEventListener('keydown',(e)=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key))return;
    e.preventDefault();tween=null;const sph=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if(e.key==='ArrowLeft')sph.theta-=.12;if(e.key==='ArrowRight')sph.theta+=.12;if(e.key==='ArrowUp')sph.phi=Math.max(.1,sph.phi-.1);if(e.key==='ArrowDown')sph.phi=Math.min(Math.PI*.485,sph.phi+.1);
    if(e.key==='+'||e.key==='=')sph.radius=Math.max(12,sph.radius*.9);if(e.key==='-')sph.radius=Math.min(controls.maxDistance,sph.radius*1.1);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));controls.update();needsFrame=true;requestFrame();
  });
  function requestFrame(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
  function frame(t){
    raf=0;if(!visible||document.hidden)return;
    if(tween){const a=Math.min(1,(t-tween.start)/1250),ease=a*a*(3-2*a);camera.position.lerpVectors(tween.from,tween.to,ease);controls.target.lerpVectors(tween.fromTarget,tween.target,ease);if(a===1)tween=null;needsFrame=true;}
    controls.update();
    if(!reduced.matches||musicMotion||needsFrame){
      // Keep the water subtle and cap animation work at approximately 30fps.
      if(t-lastT>30||needsFrame){if(musicMotion){motionTime+=Math.min(.05,Math.max(0,(t-lastT)/1000));animateMusic(motionTime);}waterMat.uniforms.time.value=reduced.matches?0:t*.001;renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;lastT=t;needsFrame=false;
        const w=$('world').clientWidth,h=$('world').clientHeight,placed=[];
        for(const a of anchors){
          const p=a.p.clone().project(camera),x=(p.x*.5+.5)*w;let y=(-p.y*.5+.5)*h;
          const width=a.el.offsetWidth||120;
          for(let attempt=0;attempt<6&&placed.some(b=>Math.abs(x-b.x)<(width+b.width)/2+5&&Math.abs(y-b.y)<34);attempt++)y-=34;
          const hidden=p.z>1||p.z<-1||x<20||x>w-20||y<80||y>h-200;
          a.el.style.display=hidden?'none':'';a.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;
          if(!hidden)placed.push({x,y,width});
        }
        document.body.dataset.rendered='true';
      }
    }
    if(!reduced.matches||musicMotion||tween||needsFrame)requestFrame();
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{needsFrame=true;requestFrame();}});
  reduced.addEventListener('change',()=>{controls.enableDamping=!reduced.matches;needsFrame=true;requestFrame();});
  canvas.addEventListener('webglcontextlost',(e)=>{e.preventDefault();setMode('plan');status('The 3D view paused. The 2D site plan remains available.');});
  go('overview',true);resize();
  return {go,setNight,setMusicMotion,setVisible(v){visible=v;if(!v){cancelAnimationFrame(raf);raf=0;}else{needsFrame=true;requestFrame();}},stats(){return {triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,trees:treeList.length};}};
}

try {
  sceneAPI=await buildWorld();
  sceneAPI.setNight(night);sceneAPI.setMusicMotion(media.isAnimating());
  $('loading').hidden=true;
  document.body.dataset.ready='true';
  setMode('3d');
  status('The landscape is ready. Explore with the place buttons or drag the scene.');
} catch(error) {
  console.error('Lab landscape:',error);
  $('loading').hidden=true;
  document.body.dataset.ready='fallback';
  setMode('plan');
  $('plan-toggle').disabled=true;
  $('plan-toggle').textContent='2D plan';
  $('navigation-hint').textContent='3D unavailable · explore the site plan';
  status('3D is unavailable on this device. The site plan and all place descriptions are available.');
}
