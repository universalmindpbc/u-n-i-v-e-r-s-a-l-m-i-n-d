import {createVisitorGroup} from './visitor-groups.mjs?v=20261105activity3';
import {levelHeight} from './elevation.mjs?v=20261105grounds1';

export function createTowerVisitors(THREE,tower,requestFrame){
  // Conversation pairs at the four lookouts, with a larger group at the rooftop bar.
  const floors=[
    [[-1.16,.45,1.1],[-.40,1.16,-2.4]],
    [[.64,.76,1.9],[1.35,-.20,-.65]],
    [[-.85,-1.20,-.6],[-1.43,-.18,2.57]],
    [[-.40,1.37,2.15],[.68,.76,-1.05]],
    [[-2,-.05,-.15],[-2.2,1.05,2.94],[1.94,-1.42,-1.8],[1.20,-2.12,.83]]
  ];
  const hosts=['A','D3','B'];
  const observers=floors.flatMap((floor,level)=>floor.map(([x,z,yaw],i)=>({
    look:hosts[(level+i)%hosts.length],x,z,y:.183+level*levelHeight,yaw,scale:1,
    phase:(level*.31+i*.42)%1,period:2.5+.28*i+.13*level
  })));
  function ramp(level){
    return {place(transform,distance){
      const angle=distance/2.60,progress=(1-Math.cos(angle))*.34+.12;
      const a=progress*2*Math.PI;
      transform.position.set(2.60*Math.sin(a),.183+(level+progress)*levelHeight,2.60*Math.cos(a));
      transform.rotation.y=a+Math.PI*.5+(1-Math.tanh(8*Math.sin(angle)))*Math.PI*.5;
    }};
  }
  const walkers=[{look:'04',route:ramp(0),speed:.68,offset:2,scale:1,period:1.4,phase:.3},
    {look:'09',route:ramp(2),speed:.62,offset:7,scale:1,period:1.5,phase:.6}];
  const guests=createVisitorGroup(THREE,'workshops',observers,requestFrame);
  const stairs=createVisitorGroup(THREE,'walkers',walkers,requestFrame);
  guests.group.name='Elevation lookout and rooftop guests';stairs.group.name='Elevation spiral walkers';
  tower.add(guests.group,stairs.group);
  return (camera,time,moving)=>{
    if(tower.position.distanceToSquared(camera.position)>220*220)return false;
    guests.start();stairs.start();
    const changed=guests.update(time,moving);return stairs.update(time,moving)||changed;
  };
}
