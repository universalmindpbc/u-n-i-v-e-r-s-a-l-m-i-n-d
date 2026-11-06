import {loadCastMember} from './festival-cast.mjs?v=20261105activity3';

export const vipCapacity=55;

function guestList({radius,djX,djZ,counterX,counterZ,route}){
  let seed=9841;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const serviceLane=route.getSpacedPoints(160);
  const guests=[];
  const left=-radius/2,right=radius/2;
  // Crowd the booth, then open up into a few conversations on the white carpet.
  const groups=[
    [-3.45,-.8,2.6,1.45,13],[-5.05,.55,1.8,2.10,9],[-2.05,.65,2.65,2.15,10],
    [-3,2.65,2.1,1.65,5],[-.1,-.95,1.7,2.3,8],[1.65,2.1,2.4,1.75,5],[4.85,.35,1.9,2.25,5]
  ];
  for(const [cx,cz,spreadX,spreadZ,count] of groups){
    for(let i=0;i<count;i++){
      let x,z,best=-Infinity;
      for(let sample=0;sample<320;sample++){
        const px=cx+(random()*2-1)*spreadX,pz=cz+(random()*2-1)*spreadZ;
        if(Math.min(Math.hypot(px-left,pz),Math.hypot(px-right,pz))>radius-.48)continue;
        if(Math.hypot(px-djX,pz-djZ)<1.82||Math.hypot(px-djX+1.29,pz-djZ-.6)<.8)continue;
        if(px>right-2.12 && pz<counterZ+.65)continue; // Backbar and staff.
        if(Math.hypot(px-counterX,pz-counterZ)<2.16)continue;
        if([right+.70,right+1.67].some(stool=>Math.hypot(px-stool,pz-1.94)<.71))continue;
        if(serviceLane.some(p=>(px-p.x)**2+(pz-p.z)**2<.57**2))continue;
        // Leave an entrance through the front notch of the interlocking circles.
        if(Math.abs(px)<.83&&pz>2.75)continue;
        let clearance=2;
        for(const g of guests)clearance=Math.min(clearance,Math.hypot(px-g.x,pz-g.z));
        const score=clearance-.12*Math.hypot(px-cx,pz-cz);
        if(score>best){best=score;x=px;z=pz;}
      }
      if(x===undefined)throw new Error('VIP group has no usable floor space');
      const n=guests.length,red=[7,33,51].indexOf(n);
      const look=red>=0?13+red:1+((n*7+Math.floor(n/12)*3)%12);
      const yaw=(cx>0&&i%3!==0?Math.atan2(cx-x,cz-z):Math.atan2(djX-x,djZ-z))+(random()-.5)*.92;
      guests.push({x,z,look,yaw,phase:random(),rate:.48+random()*.23,scale:.96+random()*.08});
    }
  }
  return guests;
}

export function createVipDancers(THREE,room,requestFrame,layout){
  const floor=new THREE.Group();
  floor.name='VIP dance crowd';
  room.add(floor);
  const batches=[],transform=new THREE.Object3D();
  let loading=false,lastFrame=-1;
  async function load(){
    loading=true;
    try{
      const {scene}=await loadCastMember('vip-dance-floor');
      const jersey=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,side:THREE.DoubleSide});
      const satin=jersey.clone();satin.roughness=.32;satin.metalness=.12;
      const guests=guestList(layout);
      for(const look of scene.children){
        const id=Number(look.userData.look.slice(6));
        const dancers=guests.filter(guest=>guest.look===id);
        const g=look.geometry;
        if(!g.attributes.normal)g.computeVertexNormals();
        const mesh=new THREE.InstancedMesh(g,id>=13?satin:jersey,dancers.length);
        const pose={morphTargetInfluences:new Array(g.morphAttributes.position.length).fill(0)};
        let scale=1;
        if(id>=13){
          const rest=new THREE.Box3().setFromBufferAttribute(g.attributes.position);
          scale=[1.68,1.71,1.73][id-13]/(rest.max.y-rest.min.y);
        }
        mesh.name='VIP '+look.userData.look;
        mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        for(const [i,dancer] of dancers.entries()){
          dancer.scale=id>=13?scale:dancer.scale;
          mesh.setMorphAt(i,pose);
        }
        floor.add(mesh);batches.push({mesh,dancers,pose});
      }
      requestFrame();
    }catch(error){console.error('Loading VIP dancers',error);}
  }
  return function update(camera,time,moving){
    const distance=Math.hypot(room.position.x-camera.position.x,room.position.z-camera.position.z);
    if(!loading&&distance<200)load();
    if(!batches.length||distance>=200)return false;
    const fps=distance<45?24:10,tick=Math.floor((moving?time:0)*fps);
    if(tick===lastFrame)return false;
    lastFrame=tick;
    const t=tick/fps;
    for(const {mesh,dancers,pose} of batches){
      const weights=pose.morphTargetInfluences,frames=weights.length+1;
      for(let i=0;i<dancers.length;i++){
        const {x,z,yaw,phase,rate,scale}=dancers[i],cycle=(t*rate+phase)%1;
        const at=cycle*frames,base=Math.floor(at),blend=at-base;
        weights.fill(0);
        if(base)weights[base-1]=1-blend;
        if(base<weights.length)weights[base]=blend;
        mesh.setMorphAt(i,pose);
        const beat=cycle*Math.PI*2,step=.055*Math.sin(beat);
        transform.position.set(x+Math.cos(yaw)*step,.17+.024*(1-Math.cos(beat*2)),z-Math.sin(yaw)*step);
        transform.rotation.set(.025*Math.cos(beat*2),yaw+.105*Math.sin(beat),.04*Math.sin(beat),'YXZ');
        transform.scale.setScalar(scale);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;mesh.morphTexture.needsUpdate=true;
    }
    return true;
  };
}
