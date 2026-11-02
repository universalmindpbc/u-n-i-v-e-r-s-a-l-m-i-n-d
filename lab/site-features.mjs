import { createFurnishings } from './furnishings.mjs?v=20261102f';
// Metric spatial studies. Stage visibility is managed by the scene controller.
export function createSiteFeatures(THREE, scene, video) {
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
  for(const z of [-5,9.2]){const g=new THREE.Group();truck.add(g);trailers.push(g);g.position.z=z;box(2.55,3.15,12.7,white,g,0,2.75);box(2.6,.23,12.85,red,g,0,1.12);for(const side of [-1,1])sign('LINFOX','UNIVERSAL MIND LAB · CONCEPT',7.4,2.1,g,side*1.285,2.95,0,side*Math.PI/2);}
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
  // 96 chairs are instanced in two draws. Four marked bays remain clear.
  const chair=furniture.chair(),dummy=new THREE.Object3D(),seatMatrices=[];
  for(let row=0;row<8;row++)for(let col=0;col<12;col++){
    const x=col<6?-6.9+col*1.06:1.6+(col-6)*1.06,z=-14.7+row*1.19;
    dummy.position.set(x,.1,z);dummy.rotation.set(0,Math.PI,0);dummy.scale.setScalar(1);dummy.updateMatrix();seatMatrices.push(dummy.matrix.clone());
  }
  for(const part of chair.children){const batch=new THREE.InstancedMesh(part.geometry,part.material,96);batch.castShadow=true;batch.receiveShadow=true;seatMatrices.forEach((m,i)=>batch.setMatrixAt(i,m));fitout.add(batch);}
  const lines=new THREE.LineBasicMaterial({color:'#41665d'});
  function outline(x,z,w,d){const p=[[x-w/2,.12,z-d/2],[x+w/2,.12,z-d/2],[x+w/2,.12,z+d/2],[x-w/2,.12,z+d/2],[x-w/2,.12,z-d/2]].map(a=>V(...a));layout.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),lines));}
  for(const x of [-8.5,8.5])for(const z of [-10,-6.4])outline(x,z,1.5,1.6);
  outline(0,-12,22.6,18.4);outline(0,-10.4,2,11.5);
  const lounge=(obj,x,z,rotation=0)=>{obj.position.set(x,.1,z);obj.rotation.y=rotation;fitout.add(obj);return obj;};
  lounge(furniture.daybed(),-17,10,-.5);lounge(furniture.daybed(),18,19,.4);
  lounge(furniture.hangingSeat(),25,18,-.7);lounge(furniture.hangingSeat(),20,23,.5);
  for(const [x,z,r] of [[22,6,-1.4],[25,11,-1.4],[21,14,-1.1],[18,9,-1.1]])lounge(furniture.chair({low:true}),x,z,r);
  for(const [x,z] of [[-24,-7],[-20,-8],[-26,18]]){lounge(furniture.table(),x,z);for(let i=0;i<3;i++){const a=i/3*Math.PI*2;lounge(furniture.chair(),x+Math.sin(a)*1.5,z+Math.cos(a)*1.5,a+Math.PI);}}
  // Tubular glass, rather than tablet-shaped screens. All audio uses the single video timeline.
  const pylonGlass=new THREE.MeshPhysicalMaterial({color:'#b9edf0',metalness:.08,roughness:.08,transparent:true,opacity:.19,side:THREE.DoubleSide,depthWrite:false});
  const glow=new THREE.MeshBasicMaterial({color:'#9be7dc'}),pylonMaps=[];
  for(const [x,z,h] of [[23,5,3.1],[26,10,3.4],[22,13,2.9],[19,8,3.2]]){
    const g=new THREE.Group();g.name='Tubular Apple Music listening pylon';g.position.set(x,.1,z);fitout.add(g);
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
  const wall=box(14,4.2,.2,dark,programme,0,2.8,-20.1);
  const videoMap=new THREE.VideoTexture(video);videoMap.colorSpace=THREE.SRGBColorSpace;
  const screen=mesh(new THREE.PlaneGeometry(13.8,3.88),new THREE.MeshBasicMaterial({map:videoMap,toneMapped:false}),programme);screen.position.set(0,2.85,-19.985);screen.castShadow=false;
  sign('UNIVERSAL MIND','MUSIC · FASHION · MINDFULNESS',5.5,.65,programme,0,.72,-16.59);
  for(const x of [-9.4,9.4])for(const z of [-19,-4.5]){
    box(.10,5.8,.10,steel,programme,x,2.9,z);box(1,.12,1,steel,programme,x,.1,z);
    for(let i=0;i<7;i++){const a=box(.82,.29,.58,dark,programme,x,5.6-i*.29,z);a.rotation.x=(i-3)*.035;box(.74,.2,.015,steel,programme,x,5.6-i*.29,z+.3);}
    box(.95,.8,.85,dark,programme,x,.5,z);
  }
  // Smart-device music workshop, food demonstration and sheltered play activity.
  for(const x of [-5,5]){box(3,.12,1.2,wood,programme,x,.78,1.2);for(const dx of [-1.25,1.25])box(.07,.75,.07,steel,programme,x+dx,.39,1.2);for(let i=0;i<4;i++){const device=box(.19,.015,.35,dark,programme,x-1.05+i*.7,.86,1.2);device.rotation.x=-.1;}}
  box(5,.95,.85,wood,programme,-25,.55,-12);box(5.1,.07,.95,steel,programme,-25,1.06,-12);
  for(const x of [-26.5,-25,-23.5]){const pot=mesh(new THREE.CylinderGeometry(.23,.20,.2,24),steel,programme);pot.position.set(x,1.2,-12);}
  sign('Cooking lab','FOOD & COMMUNITY',2.3,.65,programme,-25,.68,-11.56);
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
  let phase='open',isNight=false,isRain=false,showLayout=false,arrivalAt=0;
  function sync(){delivery.visible=phase!=='site';cargo.visible=phase==='arrival'||phase==='assembly';assembly.visible=phase==='assembly';fitout.visible=['fitout','open'].includes(phase);programme.visible=phase==='open';shelter.visible=isRain&&fitout.visible;layout.visible=showLayout&&fitout.visible;glowGroup.visible=isNight;}
  sync();
  return {setStage(value,animate=false){phase=value;arrivalAt=animate&&value==='arrival'?performance.now():0;truck.position.z=27;sync();},setNight(value){isNight=value;sync();},setRain(value){isRain=value;sync();},setLayout(value){showLayout=value;sync();},update(t,now){projectionMaterial.uniforms.time.value=t;if(arrivalAt){const p=Math.min(1,(now-arrivalAt)/2400);truck.position.z=27+(1-p)*(1-p)*38;if(p===1)arrivalAt=0;}return !!arrivalAt;},stats:{designPositions:100,seats:96,mobilitySpaces:4,listeningPylons:4,lineArrays:4}};
}
