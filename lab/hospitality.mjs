import {buildVipBar} from './vip-bar.mjs?v=20261105bondage1';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {loadCastMember} from './festival-cast.mjs?v=20261105activity3';

export const venueLocations = {bar:[-10,5], tea:[19,59], vip:[18,-11]};

// Build each venue by material so the stonework, cushions and stocked shelves
// cost a handful of draw calls even when the full grounds are visible on a phone.
export function createHospitality(THREE,requestFrame){
  const group=new THREE.Group(), mixers=[];
  const make=(colour,options={})=>new THREE.MeshStandardMaterial({color:colour,roughness:.76,...options});
  const timber=make('#916346'),dark=make('#393c38'),brass=make('#cba668',{metalness:.36}),
    cream=make('#ede1b9'),clay=make('#b35b43'),green=make('#537561'),jade=make('#a4c3a5'),
    linen=make('#ded1ae'),roof=make('#484c49'),red=make('#8f3340'),teaGlaze=make('#6c9188',{roughness:.23}),
    glow=make('#f8e6ae',{emissive:'#e5b76a',emissiveIntensity:.58});
  function venue(key,name){
    const node=new THREE.Group(), batches=new Map();
    const [x,z]=venueLocations[key];node.userData.venue=key;node.name=name;node.position.set(x,0,z);group.add(node);
    const transform=new THREE.Object3D();
    function add(geometry,mat,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){
      const g=geometry.index?geometry.toNonIndexed():geometry;
      if(g!==geometry)geometry.dispose();
      g.deleteAttribute('uv');transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);
      transform.rotation.set(rx,ry,rz);transform.updateMatrix();g.applyMatrix4(transform.matrix);
      if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(g);
    }
    function box(mat,x,y,z,w,h,d,rz=0){add(new THREE.BoxGeometry(1,1,1),mat,x,y,z,w,h,d,0,0,rz);}
    function cylinder(mat,x,y,z,rt,rb,h,n=16){add(new THREE.CylinderGeometry(rt,rb,h,n),mat,x,y,z);}
    function sign(text,width,height,x,y,z,background='#213f39',foreground='#fff4d8'){
      const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=144;
      const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,1024,144);ctx.fillStyle=foreground;ctx.font='500 83px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,75,980);
      const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
      const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map}));m.position.set(x,y,z);node.add(m);
    }
    function finish(){
      for(const [mat,geometries] of batches){const merged=mergeGeometries(geometries);const m=new THREE.Mesh(merged,mat);m.castShadow=true;m.receiveShadow=true;node.add(m);geometries.forEach(g=>g.dispose());}
    }
    return {node,box,add,cylinder,sign,finish};
  }

  const bar=venue('bar','Non-alcoholic bar');
  bar.box(timber,0,.035,0,6.7,.16,3.6);
  for(const x of [-3.1,3.1])for(const z of [-1.55,1.55])bar.box(timber,x,1.56,z,.14,3.16,.14);
  bar.box(dark,0,2.99,0,6.9,.15,3.85);
  for(let i=0;i<15;i++)bar.box(i%2?cream:green,(i-7)*.45,3.095,0,.45,.08,3.8);
  bar.box(green,0,.61,1.04,6.15,1.05,.62);
  for(let i=0;i<39;i++)bar.box(jade,(i-19)*.15,.61,1.37,.045,.93,.04);
  bar.box(cream,0,1.16,1.04,6.35,.12,.94);
  bar.box(timber,0,1.04,-1.47,5.8,1.9,.12);
  bar.box(dark,0,1.65,-1.35,5.55,1.83,.09);
  const bottles=[jade,clay,cream,green,red];
  for(const y of [1.13,1.70]){
    bar.box(timber,0,y,-1.06,5.4,.08,.51);
    for(let i=0;i<19;i++){
      const x=(i-9)*.275,m=bottles[(i+(y>1.5?2:0))%bottles.length];
      bar.cylinder(m,x,y+.17,-1.03,.085,.085,.26);
      if(i%3===0){bar.cylinder(m,x,y+.35,-1.03,.036,.065,.12);bar.cylinder(brass,x,y+.422,-1.03,.035,.035,.025);}
      else bar.cylinder(cream,x,y+.306,-1.03,.080,.080,.015);
    }
  }
  for(const x of [-2.1,-1.75,-1.4]){bar.cylinder(brass,x,1.48,1,.035,.045,.52);bar.box(dark,x,1.74,1.09,.07,.08,.23);bar.cylinder(cream,x,1.81,1.02,.035,.036,.15);}
  bar.sign('Non-alcoholic bar',4.9,.64,0,2.68,1.61);bar.finish();

  const tea=venue('tea','Tea house'),stone=[make('#8b897d'),make('#aaa798'),make('#777e72')];
  tea.cylinder(linen,0,-.033,0,6.18,6.2,.16,72);
  // Leave a clear entrance facing the curved path at the south of the circle.
  for(let i=0;i<31;i++){
    const a=.28+i*(Math.PI*2-.56)/30;
    tea.add(new THREE.IcosahedronGeometry(1,0),stone[i%3],Math.sin(a)*6.05,.13,Math.cos(a)*6.05,.64,.26+(i%4)*.04,.52,.1,a+.6,.12);
  }
  for(const [radius,number] of [[2.55,12],[4.65,21]]){
    for(let i=0;i<number;i++){
      const a=.30+(i+.5)*(Math.PI*2-.60)/number;
      tea.add(new THREE.SphereGeometry(1,18,10),[green,clay,cream][i%3],Math.sin(a)*radius,.21,Math.cos(a)*radius,.44,.145,.39,0,a,0);
    }
  }
  // A timber tea pavilion shelters the hosts while the circle remains open to the sky.
  for(const x of [-1.82,1.82])for(const z of [-1.83,.45])tea.box(timber,x,1.42,z,.13,2.82,.13);
  tea.box(timber,0,2.75,-.7,4.05,.16,2.75);
  const eaves=new THREE.PlaneGeometry(5.15,3.75,24,16);eaves.rotateX(-Math.PI/2);
  const pos=eaves.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i)/2.575,z=pos.getZ(i)/1.875;pos.setY(i,.62*(1-Math.abs(z))+.21*x*x*z*z);}
  eaves.computeVertexNormals();roof.side=THREE.DoubleSide;tea.add(eaves,roof,0,2.85,-.69);
  for(let i=0;i<16;i++){const x=-1.7+i*.227;tea.box(timber,x,1.3,-1.8,.04,2.55,.045);}
  tea.box(timber,0,.35,.16,2.75,.12,.85);for(const x of [-1.13,1.13])tea.box(dark,x,.19,.16,.14,.30,.59);
  tea.add(new THREE.SphereGeometry(1,18,12),teaGlaze,.05,.59,.14,.23,.17,.20);
  tea.cylinder(dark,.05,.75,.14,.10,.14,.04);
  tea.add(new THREE.ConeGeometry(.09,.27,12),teaGlaze,-.20,.65,.14,1,1,1,0,0,.85);
  tea.add(new THREE.TorusGeometry(.128,.024,7,16),teaGlaze,.28,.62,.14);
  for(let i=0;i<6;i++)tea.cylinder(cream,-.95+i*.35,.475,.40,.073,.048,.10);
  for(const x of [-1.55,1.55]){tea.box(brass,x,2.57,.25,.018,.34,.018);tea.add(new THREE.SphereGeometry(1,18,14),glow,x,2.27,.25,.16,.22,.16);}
  tea.sign('Tea house',1.5,.27,0,2.62,.67);tea.finish();

  const vip=buildVipBar(THREE,venue('vip','James Bondage VIP'),make,requestFrame);
  let started=false;
  function loadHosts(){
    if(started)return;started=true;
    const people=[['tea-host-1',-.69,-.53,.27,.055],['tea-host-2',.71,-.53,-.32,.055]];
    for(const [id,index] of [['02',2],['05',7],['06',10]]){
      const a=.30+(index+.5)*(Math.PI*2-.60)/12;
      people.push([id,Math.sin(a)*2.55,Math.cos(a)*2.55,a+Math.PI,.305]);
    }
    for(const [i,[id,x,z,yaw,floor]] of people.entries()){
      loadCastMember(id).then(asset=>{
        const model=asset.scene;model.position.set(x,floor,z);model.rotation.y=yaw;
        model.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;});tea.node.add(model);
        const mixer=new THREE.AnimationMixer(model);mixer.clipAction(asset.animations[0]).play();mixer.setTime(i*.81);mixers.push(mixer);
        requestFrame();
      }).catch(error=>console.error('Tea house cast asset',id,error));
    }
  }
  let serviceStarted=false;
  function loadServer(){
    serviceStarted=true;
    loadCastMember('D3').then(asset=>{
      asset.scene.position.set(.50,.116,-.16);asset.scene.rotation.y=.16;
      asset.scene.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;});
      bar.node.add(asset.scene);const mixer=new THREE.AnimationMixer(asset.scene);
      mixer.clipAction(asset.animations[0]).play();mixer.setTime(.4);barMixer=mixer;requestFrame();
    }).catch(e=>console.error('Bar server asset',e));
  }
  let barMixer=null;
  return {group,setNight:vip.setNight,stats:{teaCushions:33,teaStones:31,barShelves:2,vipCapacity:22},update(camera,time,moving){
    if(!group.visible)return false;
    const vipMoving=vip.update(camera,time,moving);
    const nearBar=Math.hypot(camera.position.x-bar.node.position.x,camera.position.z-bar.node.position.z)<36;
    if(nearBar&&!serviceStarted)loadServer();
    if(nearBar&&barMixer&&moving)barMixer.setTime(time*.75);
    if(Math.hypot(camera.position.x-tea.node.position.x,camera.position.z-tea.node.position.z)>48)return vipMoving||Boolean(nearBar&&barMixer&&moving);
    loadHosts();if(!moving)return false;mixers.forEach((m,i)=>m.setTime(time*.65+i*.81));return vipMoving||mixers.length>0;
  }};
}
