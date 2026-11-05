import {loadCastMember} from './festival-cast.mjs?v=20261105activity3';

// Keep the service circuit clear. Models 1–9 wear the three swimwear looks;
// 13–15 wear the red tailored jumpsuits. Coordinates are local to the VIP deck.
const spots=[
  [-2.90,.85],[-1.40,1.55],[-3.70,1.25],[-1.50,-.55],[-.50,-1.45],
  [-.30,1.55],[-2.40,1.75],[-1.90,.85],[-.40,-.15],[1.70,2.05],
  [-4.20,-1.25],[.30,.35],[-.90,-2.25],[3.70,1.45],[-4.50,-.45]
];

export function createVipDancers(THREE,room,requestFrame){
  const floor=new THREE.Group();
  floor.name='VIP dance crowd';
  room.add(floor);
  const guests=[];
  let loading=false,lastFrame=-1;
  async function load(){
    loading=true;
    try{
      const {scene}=await loadCastMember('vip-dance-floor');
      const jersey=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,side:THREE.DoubleSide});
      const satin=jersey.clone();satin.roughness=.32;satin.metalness=.12;
      for(const mesh of [...scene.children]){
        const i=Number(mesh.userData.look.slice(6))-1;
        const [x,z]=spots[i];
        mesh.material=i>=12?satin:jersey;
        mesh.geometry.computeVertexNormals();
        mesh.name='VIP dancer '+(i+1);
        mesh.position.set(x,.17,z);
        const towardsDJ=Math.atan2(-2.34-x,-1.82-z);
        const yaw=i===13?-1.15:towardsDJ+.26*Math.sin(i*4.13);
        mesh.rotation.y=yaw;
        floor.add(mesh);
        guests.push({mesh,x,z,yaw,phase:i*.69,rate:.46+.045*(i%4)});
      }
      requestFrame();
    }catch(error){console.error('Loading VIP dancers',error);}
  }
  return function update(camera,time,moving){
    const distance=Math.hypot(room.position.x-camera.position.x,room.position.z-camera.position.z);
    if(!loading&&distance<200)load();
    if(!guests.length)return false;
    const tick=Math.floor((moving?time:0)*(distance<45?24:10)),fps=distance<45?24:10;
    if(tick===lastFrame)return false;
    lastFrame=tick;
    for(const {mesh,x,z,yaw,phase,rate} of guests){
      const t=tick/fps,weights=mesh.morphTargetInfluences,count=weights.length+1;
      const cycle=(t*rate+phase)%1,at=cycle*count,pose=Math.floor(at),next=(pose+1)%count,blend=at-pose;
      weights.fill(0);
      if(pose)weights[pose-1]=1-blend;
      if(next)weights[next-1]=blend;
      const beat=cycle*Math.PI*2,step=.08*Math.sin(beat);
      mesh.position.set(x+Math.cos(yaw)*step,.17+.028*(1-Math.cos(beat*2)),z-Math.sin(yaw)*step);
      mesh.rotation.set(.025*Math.cos(beat*2),yaw+.105*Math.sin(beat),.040*Math.sin(beat),'YXZ');
    }
    return true;
  };
}
