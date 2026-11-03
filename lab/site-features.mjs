import { createStageVisuals } from './stage-visuals.mjs?v=20261102mind1';
import { createFurnishings } from './furnishings.mjs?v=20261102mind1';
// Metric spatial studies. Stage visibility is managed by the scene controller.
export function createSiteFeatures(THREE, scene, video, architecture, geometryVideo) {
  const furniture=createFurnishings(THREE),V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const group=(name)=>{const g=new THREE.Group();g.name=name;scene.add(g);return g;};
  const delivery=group('Road train and unloading'),assembly=group('Illustrative assembly frame'),fitout=group('Furniture and listening'),programme=group('Programme and production'),shelter=group('Light-rain study'),layout=group('Layout dimensions');
  const mat=(color,roughness=.75,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const steel=mat('#858e8e',.32,.7),white=mat('#f1eee5',.5),dark=mat('#171d20',.8),wood=mat('#a58963'),stone=mat('#c7bea7'),yellow=mat('#f6c32c',.4),red=mat('#bd292d',.4),glass=mat('#47656b',.12,.5);
  function mesh(geo,material,parent){const m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(w,h,d,m,p,x=0,y=0,z=0){const o=mesh(new THREE.BoxGeometry(w,h,d),m,p);o.position.set(x,y,z);return o;}
  function tube(points,r,m,p){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>V(...a))),Math.max(12,points.length*6),r,7,false),m,p);}
  function label(text,sub='',bg='#eeeae0',fg='#263b38'){
    const c=document.createElement('canvas');c.width=1024;c.height=384;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,1024,384);x.fillStyle=fg;x.textAlign='center';x.font='500 87px Arial';x.fillText(text,512,185);x.font='32px Arial';x.fillText(sub,512,257);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  function sign(text,sub,w,h,parent,x,y,z,rot=0){const o=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:label(text,sub),side:THREE.DoubleSide}),parent);o.position.set(x,y,z);o.rotation.y=rot;o.castShadow=false;return o;}
  // The truck remains on the service edge, separated from the open public lawn.
  const truck=new THREE.Group();delivery.add(truck);truck.position.set(-40,0,27);
  truck.name='Linfox road-train concept';
  box(2.6,.3,30,steel,truck,0,.9,0);box(2.5,2.4,3.3,yellow,truck,0,2.1,-13.5);box(2.5,.65,3.5,red,truck,0,1,-13.5);
  box(2.2,.95,.035,glass,truck,0,2.7,-15.17);box(2.65,.3,.2,steel,truck,0,.85,-15.3);
  sign('LINFOX','',1.65,.62,truck,0,1.75,-15.18,Math.PI);
  for(const side of [-1,1]){box(.04,.85,1.6,glass,truck,side*1.27,2.75,-13.8);box(.18,.4,.5,steel,truck,side*1.43,2.65,-14.6);}
  const trailers=[];
  for(const [i,z] of [-5,9.2].entries()){
    const g=new THREE.Group();g.name=i===0?'Fashion video trailer':'Anime video trailer';truck.add(g);trailers.push(g);g.position.z=z;
    box(2.55,3.15,12.7,dark,g,0,2.75);box(2.6,.23,12.85,red,g,0,1.12);
    const key=i===0?'fashion':'anime',clip=document.getElementById('truck-'+key+'-video');
    const poster=new THREE.TextureLoader().load(new URL('./assets/truck-'+key+'.jpg',import.meta.url).href);poster.colorSpace=THREE.SRGBColorSpace;poster.wrapS=THREE.MirroredRepeatWrapping;
    const videoTexture=new THREE.VideoTexture(clip);videoTexture.colorSpace=THREE.SRGBColorSpace;videoTexture.wrapS=THREE.MirroredRepeatWrapping;
    const panelMaterial=new THREE.MeshBasicMaterial({map:poster,side:THREE.DoubleSide,toneMapped:false});
    clip.addEventListener('loadeddata',()=>{panelMaterial.map=videoTexture;panelMaterial.needsUpdate=true;poster.dispose();});
    const panelGeometry=(w,h)=>{const geometry=new THREE.PlaneGeometry(w,h),uv=geometry.attributes.uv,aspect=i===0?720/332:1280/590,span=w/h/aspect;for(let j=0;j<uv.count;j++)uv.setX(j,.5+(uv.getX(j)-.5)*span);return geometry;};
    for(const side of [-1,1]){const screen=mesh(panelGeometry(12.65,3.12),panelMaterial,g);screen.position.set(side*1.283,2.75,0);screen.rotation.y=side*Math.PI/2;screen.castShadow=false;}
    const rear=mesh(panelGeometry(2.53,3.12),panelMaterial,g);rear.position.set(0,2.75,6.36);rear.castShadow=false;
    const roof=sign('LINFOX','',6.2,2.1,g,0,4.34,0);roof.rotation.set(-Math.PI/2,0,Math.PI/2);
  }
  for(const z of [-14,-11.7,-10.6,-1.2,0,1.2,13,14.2,15.4])for(const x of [-1.25,1.25]){const tire=mesh(new THREE.CylinderGeometry(.51,.51,.36,20),dark,truck);tire.rotation.z=Math.PI/2;tire.position.set(x,.55,z);const hub=mesh(new THREE.CylinderGeometry(.26,.26,.38,12),steel,truck);hub.rotation.z=Math.PI/2;hub.position.copy(tire.position);}
  const cargo=new THREE.Group();delivery.add(cargo);cargo.position.set(-34,.05,31);
  for(let i=0;i<5;i++){box(1.7,1.2,1.4,wood,cargo,(i%2)*2, .6,Math.floor(i/2)*1.8);box(1.75,.08,1.45,stone,cargo,(i%2)*2,1.24,Math.floor(i/2)*1.8);}
  for(let i=0;i<12;i++)box(.14,.7,.14,wood,delivery,-36,.35,9+i*3.4);
  // Assembly is a construction illustration, not a folding masonry mechanism.
  box(24,.18,20,stone,assembly,0,0,-12);
  for(const x of [-10.5,-5.2,0,5.2,10.5]){
    const p=[];for(let i=0;i<=24;i++){const t=i/24;p.push([x,.25+7.2*Math.sin(t*Math.PI),-21.2+18.4*t]);}tube(p,.085,steel,assembly);
  }
  for(const z of [-19,-12,-5]){tube([[-10.5,3,z],[0,7.4,z],[10.5,3,z]],.07,steel,assembly);}
  for(const x of [-12.8,12.8])for(const z of [-19,-13,-7]){box(.06,6,.06,steel,assembly,x,3,z);box(.06,6,.06,steel,assembly,x+1.4,3,z);for(const y of [2,4,6])box(1.6,.09,2.1,wood,assembly,x+.7,y,z);}
  const mainFurniture=new THREE.Group(),foodFurniture=new THREE.Group(),parkFurniture=new THREE.Group(),appleFurniture=new THREE.Group();
  fitout.add(mainFurniture,foodFurniture,parkFurniture,appleFurniture);
  const lines=new THREE.LineBasicMaterial({color:'#41665d'});
  function outline(x,z,w,d){const p=[[x-w/2,.12,z-d/2],[x+w/2,.12,z-d/2],[x+w/2,.12,z+d/2],[x-w/2,.12,z+d/2],[x-w/2,.12,z-d/2]].map(a=>V(...a));layout.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),lines));}
  outline(0,-12,22.6,18.4);outline(0,-10.8,11.5,9.5);
  const lounge=(obj,x,z,rotation=0,parent=mainFurniture)=>{obj.position.set(x,.1,z);obj.rotation.y=rotation;parent.add(obj);return obj;};
  // Loose social clusters leave the centre open for dancing and circulation.
  for(const [x,z,r] of [[-7.7,-14,.7],[-8.6,-11,1.3],[-7.1,-8,2],[-8.7,-5.5,.4],[7.5,-14,-.8],[8.5,-11,-1.2],[7,-7.6,-2],[8.7,-4.8,-.5],[-5.5,-4,2.6],[5.6,-4,-2.6]])lounge(furniture.chair({low:true}),x,z,r);
  lounge(furniture.daybed(),-8.2,-17.2,.7);lounge(furniture.daybed(),8.2,-17.2,-.7);
  lounge(furniture.hangingSeat(),-9,-7,1);lounge(furniture.hangingSeat(),9,-7,-1);
  lounge(furniture.hangingSeat(),-7.8,-3.7,.9);lounge(furniture.hangingSeat(),7.8,-3.7,-.9);
  lounge(furniture.daybed(),18,19,.4,appleFurniture);
  lounge(furniture.hangingSeat(),25,18,-.7,appleFurniture);lounge(furniture.hangingSeat(),20,23,.5,appleFurniture);
  for(const [x,z,r] of [[22,6,-1.4],[25,11,-1.4],[21,14,-1.1],[18,9,-1.1]])lounge(furniture.chair({low:true}),x,z,r,appleFurniture);
  for(const [x,z] of [[-24,-7],[-20,-8],[-26,18]]){const parent=z>0?parkFurniture:foodFurniture;lounge(furniture.table(),x,z,0,parent);for(let i=0;i<3;i++){const a=i/3*Math.PI*2;lounge(furniture.chair(),x+Math.sin(a)*1.5,z+Math.cos(a)*1.5,a+Math.PI,parent);}}
  // Tubular glass, rather than tablet-shaped screens. All audio uses the single video timeline.
  const pylonGlass=new THREE.MeshPhysicalMaterial({color:'#b9edf0',metalness:.08,roughness:.08,transparent:true,opacity:.19,side:THREE.DoubleSide,depthWrite:false});
  const glow=new THREE.MeshBasicMaterial({color:'#9be7dc'}),pylonMaps=[];
  for(const [x,z,h] of [[23,5,3.1],[26,10,3.4],[22,13,2.9],[19,8,3.2]]){
    const g=new THREE.Group();g.name='Tubular Apple Music listening pylon';g.position.set(x,.1,z);appleFurniture.add(g);
    mesh(new THREE.CylinderGeometry(.48,.58,h,48,1,true),pylonGlass,g).position.y=h/2;
    const footing=mesh(new THREE.CylinderGeometry(.62,.68,.15,40),steel,g);footing.position.y=.075;
    for(const y of [.22,h-.1]){const ring=mesh(new THREE.TorusGeometry(.49,.018,8,48),glow,g);ring.rotation.x=Math.PI/2;ring.position.y=y;}
    const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');
    ctx.fillStyle='rgba(12,48,54,.15)';ctx.fillRect(0,0,1024,512);ctx.textAlign='center';ctx.fillStyle='#234f50';ctx.font='500 74px Arial';ctx.fillText('Apple Music',512,190);ctx.font='30px Arial';ctx.fillText('LISTEN',512,250);
    for(let i=0;i<38;i++){ctx.fillStyle='rgba(57,148,154,.65)';const h=12+Math.abs(Math.sin(i*.59))*65;ctx.fillRect(130+i*20,360-h/2,5,h);}
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;pylonMaps.push(map);
    const display=mesh(new THREE.CylinderGeometry(.49,.49,1.2,36,1,true,-Math.PI/2,Math.PI*1.15),new THREE.MeshBasicMaterial({map,transparent:true,opacity:.86,side:THREE.DoubleSide}),g);display.position.y=1.65;
    // K812 silhouette study: broad open-back cups and dual headband, no acoustic claim.
    const headphones=new THREE.Group();headphones.name='AKG K812 reference study';headphones.position.set(.7,1.1,0);g.add(headphones);
    for(const zz of [-.025,.025]){const p=[];for(let i=0;i<=20;i++){const a=i/20*Math.PI;p.push([Math.cos(a)*.14,.13+Math.sin(a)*.19,zz]);}tube(p,.013,dark,headphones);}
    for(const side of [-1,1]){const cup=mesh(new THREE.CylinderGeometry(.10,.10,.065,24),dark,headphones);cup.rotation.z=Math.PI/2;cup.position.set(side*.14,.11,0);const grille=mesh(new THREE.CylinderGeometry(.085,.085,.069,20),steel,headphones);grille.rotation.z=Math.PI/2;grille.position.copy(cup.position);}
    box(.055,1,.055,steel,g,.7,.5,0);
  }
  // Main-stage screen and four illustrative line-array positions.
  box(15,.5,3.6,dark,programme,0,.34,-18.4);
  const stageVisuals=createStageVisuals(THREE,video,geometryVideo),videoMap=stageVisuals.videoMap;
  const screenVertices=[],screenUV=[],screenIndices=[];
  for(let i=0;i<=80;i++){const x=-11.1+i/80*22.2,top=architecture.roofHeight(x,-6.9);screenVertices.push(x,.18,-18.9,x,top,-18.9);screenUV.push(i/80,0,i/80,top/6.5);if(i<80){const n=i*2;screenIndices.push(n,n+2,n+1,n+1,n+2,n+3);}}
  const screenGeometry=new THREE.BufferGeometry();screenGeometry.setAttribute('position',new THREE.Float32BufferAttribute(screenVertices,3));screenGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(screenUV,2));screenGeometry.setIndex(screenIndices);screenGeometry.computeVertexNormals();
  const screen=mesh(screenGeometry,stageVisuals.material,programme);screen.name='Roof-profile panoramic stage screen';screen.castShadow=false;
  for(const x of [-9.4,9.4])for(const z of [-19,-4.5]){
    box(.10,5.8,.10,steel,programme,x,2.9,z);box(1,.12,1,steel,programme,x,.1,z);
    for(let i=0;i<7;i++){const a=box(.82,.29,.58,dark,programme,x,5.6-i*.29,z);a.rotation.x=(i-3)*.035;box(.74,.2,.015,steel,programme,x,5.6-i*.29,z+.3);}
    box(.95,.8,.85,dark,programme,x,.5,z);
  }
  // Smart-device music workshop, food demonstration and sheltered play activity.
  for(const x of [-5,5]){box(3,.12,1.2,wood,programme,x,.78,1.2);for(const dx of [-1.25,1.25])box(.07,.75,.07,steel,programme,x+dx,.39,1.2);for(let i=0;i<4;i++){const device=box(.19,.015,.35,dark,programme,x-1.05+i*.7,.86,1.2);device.rotation.x=-.1;}}
  box(5,.95,.85,wood,programme,-25,.55,-12);box(5.1,.07,.95,steel,programme,-25,1.06,-12);
  for(const x of [-26.5,-25,-23.5]){const pot=mesh(new THREE.CylinderGeometry(.23,.20,.2,24),steel,programme);pot.position.set(x,1.2,-12);}
  const glowGroup=new THREE.Group();programme.add(glowGroup);
  const laserMaterial=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.19,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  for(const x of [-7,7]){const vertices=[],colours=[];for(let i=0;i<7;i++){const c=new THREE.Color().setHSL(i/8,.8,.6);const ex=x+(i-3)*1.3,ez=9+i*1.4;vertices.push(x,5.7,-19,ex-.08,7,ez,ex+.08,7,ez);for(let j=0;j<3;j++)colours.push(c.r,c.g,c.b);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));mesh(geo,laserMaterial,glowGroup).castShadow=false;}
  const projectionMaterial=new THREE.ShaderMaterial({uniforms:{time:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 p; void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 p; uniform float time; void main(){vec2 q=(p-.5)*2.;float r=length(q);float petal=.5+.5*sin(atan(q.y,q.x)*7.+r*9.-time*.35);float a=smoothstep(1.,.1,r)*(.12+.5*pow(petal,3.));vec3 c=.5+.5*cos(vec3(0.,2.,4.)+r*4.+time*.12);gl_FragColor=vec4(c,a);}' });
  for(const [x,z,r] of [[-12,6,5],[12,5,5],[-17,30,4],[16,26,4]]){const p=mesh(new THREE.CircleGeometry(r,64),projectionMaterial,glowGroup);p.rotation.x=-Math.PI/2;p.position.set(x,.11,z);p.castShadow=false;}
  for(const [x,z] of [[-9,39],[13,22],[16,-24]]){const p=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;p.push([x+Math.cos(a)*1.2,2+Math.sin(a)*1.8,z+Math.sin(a*2)*.5]);}tube(p,.08,steel,fitout);tube(p,.035,glow,glowGroup);}
  // Modular rain cover follows circulation; it does not fill the open lawn.
  const rainMat=new THREE.MeshPhysicalMaterial({color:'#f5f1dd',roughness:.45,transparent:true,opacity:.58,side:THREE.DoubleSide,depthWrite:false});
  function covered(points,width=2.6){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>V(x,3.15,z))),p=[],ix=[];for(let i=0;i<=32;i++){const v=curve.getPoint(i/32),t=curve.getTangent(i/32);p.push(v.x-t.z*width/2,v.y+.18,v.z+t.x*width/2,v.x+t.z*width/2,v.y,v.z-t.x*width/2);if(i<32){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2);}if(i%8===0)for(const side of [-1,1])box(.06,3.15,.06,steel,shelter,v.x+side*t.z*(width/2-.1),1.58,v.z-side*t.x*(width/2-.1));}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();mesh(g,rainMat,shelter);}
  covered([[0,-2],[0,8],[-10,3],[-20,-5]]);covered([[0,8],[-10,20],[-23,20]]);covered([[0,8],[10,13],[20,10],[25,5]]);covered([[-23,-8],[-30,-14],[-34,-20]]);
  for(const x of [-11.4,11.4]){const screen=mesh(new THREE.PlaneGeometry(14,2.8),rainMat,shelter);screen.rotation.y=Math.PI/2;screen.position.set(x,1.5,-12);}
  let responseLevel=.7;
  let state={seconds:0,main:0,food:0,park:0,apple:0,furniture:0,programme:0,navigation:false,truck:0},isNight=0,isRain=false,showLayout=false;
  const reveal=(g,p)=>{g.visible=p>0;g.children.forEach((child,i)=>child.visible=p>=(i+1)/(g.children.length+1));};
  function sync(){
    delivery.visible=state.seconds>2;truck.position.z=27+Math.pow(1-state.truck,2)*65;
    cargo.visible=state.seconds>=6&&state.seconds<29;cargo.children.forEach((c,i)=>c.visible=state.main<1-i*.13);
    assembly.visible=state.seconds>=6&&state.main<1;
    fitout.visible=true;reveal(mainFurniture,state.furniture);reveal(foodFurniture,state.food);reveal(parkFurniture,state.park);reveal(appleFurniture,state.apple);
    programme.visible=state.programme>0;programme.children.forEach((c,i)=>{if(c!==glowGroup)c.visible=state.programme>=(i+1)/(programme.children.length+1);});
    shelter.visible=isRain&&state.navigation;layout.visible=showLayout&&state.navigation;glowGroup.visible=isNight>0&&state.programme>0;laserMaterial.opacity=(.09+.14*responseLevel)*isNight;
  }
  sync();
  return {videoMap,setResponse(value){responseLevel=value;sync();},setStory(value){state=value;sync();},setNight(value){isNight=Number(value);sync();},setRain(value){isRain=value;sync();},setLayout(value){showLayout=value;sync();},update(t){stageVisuals.update();projectionMaterial.uniforms.time.value=t;return state.seconds>2&&state.seconds<31;},stats:{attendanceAmbition:100,mainLoungeChairs:10,mainHangingSeats:4,mainDaybeds:2,listeningPylons:4,lineArrays:4}};
}
