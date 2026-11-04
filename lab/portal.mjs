import {solids,portalZones,portalPlacement,placedVertices} from './portal-geometry.mjs?v=20261104portal1';
import {createFurnishings} from './furnishings.mjs';

/** Seven small workshop marquees. Undistorted polyhedral envelopes meet the grass plane.
 * Ground intersections are concept studies, not foundation or fabrication details.
 */
export function createPortal(THREE){
 const root=new THREE.Group();root.name='I Am Portal';root.position.set(portalPlacement.x,0,portalPlacement.z);
 const furnishings=createFurnishings(THREE),V=(x,y,z)=>new THREE.Vector3(x,y,z),zones=[],pulses=[];
 const white=new THREE.MeshStandardMaterial({color:'#f5f4e8',roughness:.54,metalness:.16});
 const clear=new THREE.MeshStandardMaterial({color:'#d8e9e4',transparent:true,opacity:.075,roughness:.3,metalness:.02,side:THREE.DoubleSide,depthWrite:false});
 const peopleMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82});
 const chairMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65,metalness:.16});
 let seed=241;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 class Batch{
  constructor(){this.positions=[];this.normals=[];this.colours=[];}
  add(geometry,position,scale,colour,quaternion){
   let g=geometry.index?geometry.toNonIndexed():geometry.clone();const transform=new THREE.Matrix4().compose(position,quaternion||new THREE.Quaternion(),scale||V(1,1,1));g.applyMatrix4(transform);
   const p=g.getAttribute('position'),n=g.getAttribute('normal'),old=g.getAttribute('color'),c=new THREE.Color(colour||'#ffffff');
   for(let i=0;i<p.count;i++){this.positions.push(p.getX(i),p.getY(i),p.getZ(i));this.normals.push(n.getX(i),n.getY(i),n.getZ(i));this.colours.push(c.r*(old?old.getX(i):1),c.g*(old?old.getY(i):1),c.b*(old?old.getZ(i):1));}g.dispose();
  }
  object(object){object.updateMatrixWorld(true);object.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);this.add(g,V(0,0,0),V(1,1,1),o.material.color);g.dispose();});}
  mesh(material,parent,name){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.normals,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.colours,3));const m=new THREE.Mesh(g,material);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 }
 const cube=new THREE.BoxGeometry(1,1,1),ball=new THREE.SphereGeometry(1,10,7),rod=new THREE.CylinderGeometry(1,1,1,7),disc=new THREE.CylinderGeometry(1,1,1,32);
 function box(b,p,s,c,q){b.add(cube,V(...p),V(...s),c,q);}
 function sphere(b,p,s,c){b.add(ball,V(...p),V(...s),c);}
 function tube(b,a,end,r,c){const start=V(...a),finish=V(...end),delta=finish.clone().sub(start);b.add(rod,start.add(finish).multiplyScalar(.5),V(r,delta.length(),r),c,new THREE.Quaternion().setFromUnitVectors(V(0,1,0),delta.normalize()));}
 function circle(b,p,r,h,c){b.add(disc,V(...p),V(r,h,r),c);}
 const shirt=['#627b82','#876a98','#d9ad65','#626a4e','#c08c98','#b0c3b8','#d1bcad','#314e67','#8d5574'];
 const skin=['#613c2b','#895b41','#bb896a','#d9b194','#4e3026','#a56f51'];
 function person({seated=true,index=0,visor=false,phone=false,facilitator=false}={}){
  const b=new Batch(),s=skin[index%skin.length],top=facilitator?'#e3d8c8':shirt[index%shirt.length],hip=seated?.57:.88,neck=hip+.53,head=neck+.18;
  box(b,[0,hip+.28,0],[.35,.47,.22],top);sphere(b,[0,head,.015],[.13,.16,.125],s);sphere(b,[0,head+.085,-.02],[.132,.09,.12],index%3?'#25272c':'#66544a');
  if(facilitator){sphere(b,[.09,head+.05,-.07],[.09,.14,.1],'#827c74');}
  for(const side of [-1,1]){
   const x=side*.105,knee=seated?[x,.48,.36]:[x,.44,.02],ankle=seated?[x,.10,.42]:[x,.09,.025];
   tube(b,[x,hip,0],knee,.075,'#363e4b');tube(b,knee,ankle,.06,'#363e4b');box(b,[x,.065,ankle[2]+.045],[.13,.10,.25],'#333837');
   const hand=phone?[side*.085,hip+.30,.39]:[side*.18,seated?.77:1.02,seated?.29:.22];
   const elbow=[side*.25,hip+.23,.15];tube(b,[side*.20,neck-.07,0],elbow,.055,top);tube(b,elbow,hand,.045,s);sphere(b,hand,[.05,.055,.045],s);
  }
  if(phone){box(b,[0,hip+.33,.40],[.13,.21,.026],'#1b2b32');box(b,[0,hip+.33,.416],[.11,.17,.004],'#78cacc');}
  if(visor){box(b,[0,head,.12],[.28,.115,.08],'#151c23');tube(b,[-.13,head,.04],[.13,head,.04],.025,'#171d24');for(const x of [-.09,0,.09])sphere(b,[x,head+.15,0],[.018,.02,.018],'#57c2cb');}
  const g=new THREE.Group();b.mesh(peopleMaterial,g,facilitator?'Facilitator':'Participant');g.userData.role=facilitator?'facilitator':'participant';return g;
 }
 function sign(text,parent,z){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=176;const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f2e4';ctx.fillRect(0,0,1024,176);ctx.fillStyle='#283b37';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 51px Arial';ctx.fillText(text,512,88);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(2.9,.49,.055),new THREE.MeshStandardMaterial({map:texture,roughness:.86}));mesh.position.set(0,.49,z);mesh.name=text;parent.add(mesh);
  const b=new Batch();for(const x of [-1.28,1.28])box(b,[x,.25,z],[.035,.5,.035],'#eee8da');b.mesh(peopleMaterial,parent,'Sign supports');
 }
 // The supplied flower, including its overlapping filled petals; applied directly to grass.
 const grassCanvas=document.createElement('canvas');grassCanvas.width=grassCanvas.height=1024;const gx=grassCanvas.getContext('2d');
 const flowerMap=new THREE.CanvasTexture(grassCanvas);flowerMap.colorSpace=THREE.SRGBColorSpace;flowerMap.anisotropy=4;
 const flowerImage=new Image();flowerImage.onload=()=>{
  gx.drawImage(flowerImage,0,0,1024,1024);gx.globalCompositeOperation='source-atop';for(let i=0;i<95000;i++){gx.fillStyle=i%2?'rgba(60,91,40,.13)':'rgba(244,239,182,.15)';gx.fillRect(random()*1024,random()*1024,.65,1.2+random()*3);}gx.globalCompositeOperation='source-over';flowerMap.needsUpdate=true;
 };flowerImage.src=new URL('./assets/universal-mind-flower.png',import.meta.url).href;
 const flower=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshBasicMaterial({map:flowerMap,transparent:true,opacity:.64,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1}));flower.name='Universal Mind flower in coloured grass';flower.rotation.x=-Math.PI/2;flower.position.y=.018;root.add(flower);
 for(const config of portalZones){
  const zone=new THREE.Group();zone.name=config.title;zone.position.set(config.position[0],.055,config.position[1]);root.add(zone);
  const solid=solids[config.shape];
  // A rotation and ONE radius preserve the regular geometry, without aspect fitting.
  const vertices=placedVertices(config).map(v=>V(...v));
  const frame=new THREE.InstancedMesh(new THREE.CylinderGeometry(.022,.022,1,7),white,solid.edges.length),dummy=new THREE.Object3D();
  solid.edges.forEach(([a,b],i)=>{const delta=vertices[b].clone().sub(vertices[a]);dummy.position.copy(vertices[a]).add(vertices[b]).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(V(0,1,0),delta.clone().normalize());dummy.scale.set(1,delta.length(),1);dummy.updateMatrix();frame.setMatrixAt(i,dummy.matrix);});frame.name=config.shape+' regular frame';frame.castShadow=true;zone.add(frame);
  const position=[];for(const face of solid.faces){const center=face.reduce((sum,i)=>sum.add(vertices[i]),V(0,0,0)).multiplyScalar(1/face.length);
   // Open front and lower panels for entry and air. Frame vertices remain unchanged.
   if(center.y<1.25||center.z>config.radius*.35)continue;
   for(let i=1;i<face.length-1;i++)position.push(...vertices[face[0]].toArray(),...vertices[face[i]].toArray(),...vertices[face[i+1]].toArray());
  }
  const panelGeometry=new THREE.BufferGeometry();panelGeometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));panelGeometry.computeVertexNormals();const panels=new THREE.Mesh(panelGeometry,clear);panels.name='Transparent upper panels';zone.add(panels);
  const interior=new THREE.Group(),seats=new Batch(),actors=new Batch(),equipment=new Batch();zone.add(interior);
  // Nine youth participants and one facilitator per workshop; ten people total.
  for(let i=0;i<9;i++){
   const angle=(50+i*32.5)*Math.PI/180,x=Math.sin(angle)*1.97,z=Math.cos(angle)*1.97,turn=Math.atan2(-x,-z);
   const chair=furnishings.chair();chair.position.set(x,0,z);chair.rotation.y=turn;seats.object(chair);
   const actor=person({index:i+zones.length,visor:config.id==='emdr',phone:['steam','mantra','sound'].includes(config.id)});actor.position.set(x,0,z);actor.rotation.y=turn;actors.object(actor);
  }
  const leader=person({seated:false,index:zones.length+4,facilitator:true});leader.position.set(.9,0,1.95);leader.rotation.y=-2.8;actors.object(leader);
  actors.mesh(peopleMaterial,interior,'Nine participants and one facilitator');
  if(['steam','atelier','mantra','sound'].includes(config.id)){
   circle(equipment,[0,.73,0],1.12,.065,'#d1c0a4');circle(equipment,[0,.36,0],.12,.72,'#6c7774');circle(equipment,[0,.035,0],.52,.07,'#6c7774');
  }
  if(config.id==='steam'){
   circle(equipment,[0,.82,0],.19,.12,'#728b94');tube(equipment,[0,.88,0],[.12,1.34,0],.07,'#e5ded0');sphere(equipment,[.12,1.34,0],[.12,.12,.12],'#253e47');tube(equipment,[.12,1.34,0],[.55,1.20,.05],.065,'#e5ded0');sphere(equipment,[.55,1.20,.05],[.09,.09,.09],'#253e47');tube(equipment,[.55,1.2,.05],[.61,1.01,.08],.04,'#d4d5ca');
   for(const [x,z] of [[-.65,0],[.45,.55],[.3,-.55]]){box(equipment,[x,.79,z],[.42,.035,.29],'#253b42');box(equipment,[x,.81,z],[.37,.01,.24],'#68b8c8');}
   equipment.add(new THREE.IcosahedronGeometry(.16),V(-.32,.96,.55),V(1,1,1),'#d6b74d');box(equipment,[-.6,.92,-.48],[.24,.24,.24],'#d59ba3');
  }
  if(config.id==='mantra'||config.id==='sound'){
   box(equipment,[0,.81,0],[1.5,.10,.5],'#213641');for(let k=0;k<18;k++)box(equipment,[-.68+k*.08,.87,.07],[.062,.02,.25],k%3?'#efe9db':'#192930');
   box(equipment,[.52,.84,-.52],[.45,.12,.33],'#34424b');for(let j=0;j<4;j++)for(let k=0;k<4;k++)box(equipment,[.37+k*.1,.91,-.63+j*.075],[.065,.01,.048],j%2?'#72bdb1':'#d99cba');
   for(const x of [-.45,.4]){tube(equipment,[x,.8,-.34],[x,1.3,-.34],.013,'#313c43');tube(equipment,[x,1.3,-.34],[x+.18,1.3,-.15],.03,'#26363b');}
  }
  if(config.id==='sound'){
   for(const x of [-.48,.48]){box(equipment,[x,1.0,-2.1],[.85,1.7,.47],'#293037');for(const y of [.55,1.12]){equipment.add(disc,V(x,y,-1.85),V(.25,.04,.25),'#151c21',new THREE.Quaternion().setFromAxisAngle(V(1,0,0),Math.PI/2));}equipment.add(new THREE.ConeGeometry(.35,.4,24,1,true),V(x,2.05,-2.04),V(1,1,1),'#d6bc8e',new THREE.Quaternion().setFromAxisAngle(V(1,0,0),Math.PI/2));}
  }
  if(config.id==='atelier'){
   for(const x of [-.52,.43]){box(equipment,[x,.84,0],[.42,.15,.27],'#e3d8c5');box(equipment,[x+.1,.98,0],[.16,.2,.19],'#e3d8c5');box(equipment,[x-.02,.77,.22],[.55,.01,.3],x<0?'#b482a5':'#668ca5');}
   const mannequin=(x,z,colour)=>{tube(equipment,[x,.05,z],[x,1.4,z],.022,'#635c54');sphere(equipment,[x,1.22,z],[.23,.34,.14],colour);tube(equipment,[x-.3,.04,z],[x+.3,.04,z],.02,'#635c54');};mannequin(-2.2,-.5,'#e3cfb8');mannequin(2.2,-.5,'#b682a0');
   for(const x of [-1,1])tube(equipment,[x,0,-2.15],[x,1.7,-2.15],.02,'#7e7c6d');tube(equipment,[-1,1.7,-2.15],[1,1.7,-2.15],.02,'#7e7c6d');for(let i=0;i<6;i++)box(equipment,[-.8+i*.32,1.0,-2.15],[.23,1.1,.1],shirt[i]);
  }
  if(config.id==='comedy'){tube(equipment,[0,0,.5],[0,1.37,.5],.016,'#303e43');tube(equipment,[0,1.37,.5],[.13,1.4,.5],.026,'#303e43');circle(equipment,[0,.025,.5],.18,.05,'#303e43');}
  if(config.id==='sexed'){circle(equipment,[0,.45,0],.65,.06,'#d1c0a4');for(let i=0;i<3;i++)box(equipment,[-.3+i*.3,.49,0],[.22,.03,.29],shirt[i+2]);}
  if(config.id==='emdr'){const lounge=furnishings.daybed();lounge.position.set(0,0,-2.55);seats.object(lounge);const soft=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),new THREE.MeshStandardMaterial({color:'#d4a1b0',roughness:1}));soft.position.set(0,.24,0);soft.scale.set(.65,.24,.65);interior.add(soft);}
  seats.mesh(chairMaterial,interior,'Moroso Tropicália furniture');
  equipment.mesh(peopleMaterial,interior,'Workshop instruments and equipment');
  const pulse=new THREE.Mesh(new THREE.TorusGeometry(.26,.012,5,40),new THREE.MeshBasicMaterial({color:config.colour,transparent:true,opacity:.55,depthWrite:false}));pulse.rotation.x=-Math.PI/2;pulse.position.set(0,.88,0);pulse.visible=['steam','mantra','sound'].includes(config.id);interior.add(pulse);pulses.push(pulse);
  sign(config.label,zone,3.5);
  const rug=new THREE.Mesh(new THREE.CircleGeometry(2.75,48),new THREE.MeshStandardMaterial({color:config.colour,roughness:1,transparent:true,opacity:.24,depthWrite:false}));rug.rotation.x=-Math.PI/2;rug.position.y=.006;zone.add(rug);
  const light=new THREE.PointLight(config.colour,0,11,2);light.position.set(0,2.6,0);zone.add(light);
  zone.userData={zone:config.id,shape:config.shape,participants:9,facilitators:1,capacity:10,regular:true,uniformScale:config.radius,groundIntersection:Math.min(...vertices.map(v=>v.y))<-.01};zones.push({group:zone,interior,light,config});
 }
 return {group:root,zones,stats:{zones:7,participants:63,facilitators:7,capacity:70},
  setStory(state){root.visible=state.seconds>=24;zones.forEach(({group,interior},i)=>{group.visible=state.seconds>=24+i*.8;interior.visible=state.programme>0;});},
  setNight(value){zones.forEach(({light})=>light.intensity=Number(value)*22);flower.material.color.set('#ffffff').lerp(new THREE.Color('#526a67'),Number(value));},
  update(time,moving){if(!root.visible||!moving)return false;pulses.forEach((p,i)=>{const wave=(time*.4+i*.12)%1;p.scale.setScalar(1+wave*.75);p.material.opacity=(1-wave)*.45;});return true;},
  camera(id){const zone=zones.find(z=>z.config.id===id);if(!zone)return {pos:[root.position.x+23,19,root.position.z+29],target:[root.position.x,1.9,root.position.z]};const x=root.position.x+zone.group.position.x,z=root.position.z+zone.group.position.z;return {pos:[x+.8,2.8,z+8.5],target:[x,1.25,z]};}
 };
}
