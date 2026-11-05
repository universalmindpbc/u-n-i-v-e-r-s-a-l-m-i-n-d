import {loadCastMember} from './festival-cast.mjs?v=20261105movement1';

// Workshop rooms reuse the same geometry, material and request for every look.
const libraries = new Map();
function library(THREE, pack) {
  if (!libraries.has(pack)) {
    libraries.set(pack, loadCastMember(pack).then(asset => {
      const looks = new Map();
      for (const mesh of asset.scene.children) {
        mesh.geometry.computeVertexNormals();
        looks.set(mesh.userData.look, mesh.geometry);
      }
      return {looks, material:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,side:THREE.DoubleSide})};
    }));
  }
  return libraries.get(pack);
}

// A straight stretch in each direction with a half-circle at either end.
// People travel at a steady stride and turn continuously without teleporting.
export function walkingRoute(x1,z1,x2,z2,radius) {
  const dx=x2-x1, dz=z2-z1, straight=Math.hypot(dx,dz), yaw=Math.atan2(dx,dz);
  const cosine=Math.cos(yaw), sine=Math.sin(yaw), bend=Math.PI*radius;
  const length=2*(straight+bend);
  return {length, place(object, distance) {
    let d=distance%length, x=radius, z=d, facing=0;
    if(d>=straight && d<straight+bend){
      const a=(d-straight)/radius;
      x=radius*Math.cos(a);z=straight+radius*Math.sin(a);facing=-a;
    }else if(d>=straight+bend && d<2*straight+bend){
      x=-radius;z=2*straight+bend-d;facing=Math.PI;
    }else if(d>=2*straight+bend){
      const a=Math.PI+(d-2*straight-bend)/radius;
      x=radius*Math.cos(a);z=radius*Math.sin(a);facing=-a;
    }
    object.position.set(x1+x*cosine+z*sine,.05,z1-x*sine+z*cosine);
    object.rotation.y=yaw+facing;
  }};
}

// Eight poses from the actual skinned bodies bake into a single mesh per look.
// Room seating stays fixed. Walkers use the same gait clock for feet and travel.
export function createVisitorGroup(THREE, pack, visitors, requestFrame, onReady) {
  const group=new THREE.Group(), batches=[], transform=new THREE.Object3D();
  group.name=pack+' visitors';group.userData={status:'waiting',count:visitors.length};
  let lastTick=-1;
  function draw(seconds) {
    for(const {mesh,people,pose} of batches){
      const weights=pose.morphTargetInfluences,n=weights.length+1;
      for(const [i,p] of people.entries()){
        const cycle=seconds/p.period+p.phase, frame=(cycle%1)*n, base=Math.floor(frame), mix=frame-base;
        weights.fill(0);
        if(base)weights[base-1]=1-mix;
        if(base+1<n)weights[base]=mix;
        mesh.setMorphAt(i,pose);
        if(p.route){
          p.route.place(transform,p.offset+seconds*p.speed);
          transform.scale.setScalar(p.scale);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
        }
      }
      mesh.morphTexture.needsUpdate=true;
      if(people[0].route)mesh.instanceMatrix.needsUpdate=true;
    }
  }
  async function start(){
    if(group.userData.status!=='waiting')return;
    group.userData.status='loading';
    try{
      const {looks,material}=await library(THREE,pack);
      for(const [id,geometry] of looks){
        const people=visitors.filter(p=>p.look===id);
        if(!people.length)continue;
        const mesh=new THREE.InstancedMesh(geometry,material,people.length);
        mesh.name=pack+' look '+id;
        const pose={morphTargetInfluences:new Array(geometry.morphAttributes.position.length).fill(0)};
        for(const [i,p] of people.entries()){
          transform.position.set(p.x??0,p.y??0,p.z??0);transform.rotation.set(0,p.yaw??0,0);
          transform.scale.setScalar(p.scale);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
        }
        if(people[0].route){
          mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          // A route spans more ground than the bounds of its starting positions.
          mesh.frustumCulled=false;
        }else mesh.computeBoundingSphere();
        batches.push({mesh,people,pose});group.add(mesh);
      }
      draw(0);group.userData.status='ready';onReady?.();requestFrame();
    }catch(error){group.userData.status='error';console.error('Loading '+pack+' visitors',error);requestFrame();}
  }
  function update(time,moving){
    if(group.userData.status!=='ready'||!moving)return false;
    const tick=Math.floor(time*20);
    if(tick===lastTick)return false;
    lastTick=tick;draw(tick/20);return true;
  }
  return {group,start,update};
}

export function createGroundWalkers(THREE,requestFrame) {
  // Parallel to the road-train displays, along the food and music approaches,
  // past the play lawn, along the riverbank and towards the workshop village.
  const paths=[
    [-44,16,-44,34,.65,4],[-15,-12,-15,1,.6,3],[-21,14,-21,22,.55,3],
    [-12,25,-12,34,.55,2],[18,13,24,19,.55,3],[-28,37,-32,51,.6,4],
    [-25,-18,-22,-22,.5,2],[8,17,8,31,.55,3]
  ];
  const ids=['01','04','06','09','A','D2'],visitors=[];
  paths.forEach(([x1,z1,x2,z2,r,n],pathIndex)=>{
    const route=walkingRoute(x1,z1,x2,z2,r);
    for(let i=0;i<n;i++){
      const scale=.94+.025*((i+pathIndex)%5),speed=.88+.07*((i*3+pathIndex)%4);
      visitors.push({look:ids[(i+pathIndex*2)%ids.length],route,offset:(i+.23*pathIndex)%n*route.length/n,scale,speed,period:1.2*scale/speed,phase:(i*.31+pathIndex*.19)%1});
    }
  });
  return createVisitorGroup(THREE,'walkers',visitors,requestFrame);
}

export function createSeatedVisitors(THREE,requestFrame){
  const seats=[];
  for(const [cx,cz] of [[-24,-7],[-20,-8]]){
    for(let i=0;i<3;i++){
      const angle=i*2*Math.PI/3;
      seats.push([cx+1.5*Math.sin(angle),cz+1.5*Math.cos(angle),angle+Math.PI,.1]);
    }
  }
  seats.push([22,6,-1.4,0],[25,11,-1.4,0],[21,14,-1.1,0],[18,9,-1.1,0]);
  const people=seats.map(([x,z,yaw,y],i)=>({x,z,yaw,y,scale:1,look:['01','04','07','09'][i%4],phase:(i*.37)%1,period:4+i%3*.34}));
  const cast=createVisitorGroup(THREE,'workshops',people,requestFrame);
  cast.group.name='Food fair diners and river listeners';
  return cast;
}

export function createShowRunway(THREE,requestFrame){
  const group=new THREE.Group(),route=walkingRoute(0,8.75,0,37.25,.75);
  group.visible=false;
  let selected='iris',lastTime=0;
  function sync(){
    const ready=shows[selected].group.userData.status==='ready';
    for(const [name,cast] of Object.entries(shows))cast.group.visible=ready?name===selected:name!==selected&&cast.group.userData.status==='ready';
    requestFrame();
  }
  const shows=Object.fromEntries(['iris','nagnata'].map(name=>{
    const people=Array.from({length:8},(_,i)=>({
      look:name+'-'+i,route,offset:i*route.length/8,scale:.976+.011*(i%5),
      speed:1,period:1.20,phase:(i*.29)%1
    }));
    const cast=createVisitorGroup(THREE,name,people,requestFrame,sync);
    group.add(cast.group);return [name,cast];
  }));
  group.name='First Nations-led runway proposal';
  return {group,select(name){
    if(!Object.hasOwn(shows,name))return;
    selected=name;if(group.visible)shows[name].start();sync();
    shows[name].update(lastTime,true);
  },update(time,moving){
    if(!group.visible)return false;
    lastTime=time;shows[selected].start();
    let changed=false;
    for(const cast of Object.values(shows))if(cast.group.visible&&cast.update(time,moving))changed=true;
    return changed;
  }};
}
