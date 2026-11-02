const $ = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = () => innerWidth < 700;
const status = (message) => { $('scene-status').textContent = message; };
const places = {
  overview: { number: '01 · THE CLEARING', title: 'Room to connect.', copy: 'A generous green lawn holds the programme together. Forest meets two boundaries; a river or creek frames a third.', note: 'An illustrative setting. The host community will help choose and shape the actual site.' },
  main: { number: '02 · MAIN PAVILION', title: 'Under one shared roof.', copy: 'Music, fashion and collective experiences gather beneath a single vaulted shell, opening onto the lawn.', note: 'A Droneport-derived form study. Capacity, construction and rain protection remain design workstreams.' },
  food: { number: '03 · FOOD & PLAY', title: 'Gather. Make. Play.', copy: 'Two fluid satellite shells create places for cooking, conversation and younger visitors, with clear views across the lawn.', note: 'The same provisional material palette as the main vault, with simpler surfaces and no oval apertures.' },
  river: { number: '04 · BY THE WATER', title: 'Space to listen.', copy: 'A quieter edge reserved for individual music discovery. Future stages add Tropicália seats and transparent tubular listening pylons.', note: 'Waterway separation, acoustics and light-rain shelter will be developed for the selected site.' }
};
let sceneAPI = null;
let mode = '3d';
let selected = 'overview';
function selectPlace(key, show = true) {
  selected = key;
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
  $('navigation-hint').textContent = mode === 'plan' ? 'Select a place to read its story' : mobile() ? 'Drag to orbit · pinch to zoom' : 'Drag to look around · scroll to move closer';
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
$('vision').addEventListener('close', () => $('about-open').focus());

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
  scene.add(new THREE.HemisphereLight('#f4f6ed', '#718360', 2.3));
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
  // Human scale figures are illustrative, with no artist likenesses.
  const personColours=['#ded7c1','#6c8174','#c1b09a','#7c858e','#cebea5'];
  const people=[[-2,0],[3,-8],[-6,-13],[6,-15],[-24,-5],[-21,-7],[-18,20],[-26,20],[0,29],[1,34],[16,13],[21,7],[-10,9],[-8,8],[6,20],[-2,-17]];
  people.forEach(([x,z],i)=>{
    const g=new THREE.Group();g.position.set(x,.08,z);g.rotation.y=random()*6.28;scene.add(g);
    const cloth=new THREE.MeshStandardMaterial({color:personColours[i%personColours.length],roughness:1});
    const torso=mesh(new THREE.CapsuleGeometry(.19,.48,3,6),cloth,g);torso.position.y=1.02;
    const head=mesh(new THREE.SphereGeometry(.135,8,6),new THREE.MeshStandardMaterial({color:i%3?'#bba286':'#806956'}),g);head.position.y=1.55;
    for(const s of [-1,1]){const leg=mesh(new THREE.CylinderGeometry(.065,.05,.69,5),cloth,g);leg.position.set(s*.11,.35,0);}
  });
  const anchorData=[['main','Main pavilion',[0,8.4,-12]],['food','Food',[-24,6.5,-9]],['food','Play',[-23,5.7,20]],['river','Future listening',[22,1.3,8]]];
  const anchors=anchorData.map(([key,label,p])=>{
    const el=document.createElement('button');el.className='scene-label';el.dataset.key=key;el.tabIndex=-1;el.innerHTML='<i></i>'+label;el.addEventListener('click',()=>selectPlace(key));$('labels').append(el);return {el,p:new THREE.Vector3(...p)};
  });
  const presets={
    overview:{pos:[65,51,82],target:[-1,0,0]},
    main:{pos:[27,17,24],target:[0,3,-10]},
    food:{pos:[3,23,40],target:[-22,2,4]},
    river:{pos:[54,19,36],target:[15,1,1]}
  };
  let tween=null,visible=true,raf=0,needsFrame=true,lastT=0;
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
    if(!reduced.matches||needsFrame){
      // Keep the water subtle and cap animation work at approximately 30fps.
      if(t-lastT>30||needsFrame){waterMat.uniforms.time.value=reduced.matches?0:t*.001;renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;lastT=t;needsFrame=false;
        const w=$('world').clientWidth,h=$('world').clientHeight;
        for(const a of anchors){const p=a.p.clone().project(camera),x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;const hidden=p.z>1||p.z<-1||x<20||x>w-20||y<80||y>h-200;a.el.style.display=hidden?'none':'';a.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;}
        document.body.dataset.rendered='true';
      }
    }
    if(!reduced.matches||tween||needsFrame)requestFrame();
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{needsFrame=true;requestFrame();}});
  reduced.addEventListener('change',()=>{controls.enableDamping=!reduced.matches;needsFrame=true;requestFrame();});
  canvas.addEventListener('webglcontextlost',(e)=>{e.preventDefault();setMode('plan');status('The 3D view paused. The 2D site plan remains available.');});
  go('overview',true);resize();
  return {go,setVisible(v){visible=v;if(!v){cancelAnimationFrame(raf);raf=0;}else{needsFrame=true;requestFrame();}},stats(){return {triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,trees:treeList.length};}};
}

try {
  sceneAPI=await buildWorld();
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
