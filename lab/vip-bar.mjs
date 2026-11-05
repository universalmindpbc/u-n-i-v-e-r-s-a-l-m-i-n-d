import {loadCastMember} from './festival-cast.mjs?v=20261105activity3';

import {createVipDancers} from './vip-dancers.mjs?v=20261105fit2';
import {createVipEffects} from './vip-effects.mjs?v=20261105fit2';

export function buildVipBar(THREE, venue, make, requestFrame) {
  const {node,box,cylinder,add,sign} = venue;
  const velvet=make('#242424',{roughness:.95}), graphite=make('#353535'), marble=make('#f7f7f7',{roughness:.30});
  const chrome=make('#bcbcbc',{metalness:.60,roughness:.29}), lacquer=make('#161616',{roughness:.40});
  const pearl=make('#dcdcdc'), smokedGlass=make('#545454'), glass=make('#ababab',{metalness:.22,roughness:.20});
  const light=make('#ffffff',{emissive:'#ffffff',emissiveIntensity:.48});
  const ink=make('#202020'), label=make('#f4f4f4');

  // Two equal radii; their centres sit one radius apart. The deck is their
  // geometric union, with both complete circles traced separately on its surface.
  const radius=3.5, left=-radius/2, right=radius/2;
  const floor=.15;
  const v=(x,y,z)=>new THREE.Vector3(x,y,z);
  function deck(shape,mat,bottom,height){
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:72});
    geometry.rotateX(-Math.PI/2);add(geometry,mat,0,bottom,0);
  }
  function arcPoint(cx,r,angle,y){return v(cx+r*Math.cos(angle),y,r*Math.sin(angle));}
  function rail(mat,cx,r,start,end,y,tubeRadius){
    const points=Array.from({length:65},(_,i)=>arcPoint(cx,r,start+(end-start)*i/64,y));
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,tubeRadius,6,false),mat,0,0,0);
  }
  function ring(cx,r,y,mat,width){add(new THREE.TorusGeometry(r,width,7,96),mat,cx,y,0,1,1,1,Math.PI/2);}
  const outline=new THREE.Shape();
  outline.absarc(left,0,radius,Math.PI/3,Math.PI*5/3,false);
  outline.absarc(right,0,radius,Math.PI*4/3,Math.PI*8/3,false);outline.closePath();deck(outline,lacquer,-.045,.19);
  // The white carpet owns the shared lens. The black crescent meets its edge
  // at the same height, with a slim contrasting inlay tracing each whole circle.
  const dance=new THREE.Shape();
  dance.absarc(left,0,radius,Math.PI/3,Math.PI*5/3,false);
  dance.absarc(right,0,radius,Math.PI*4/3,Math.PI*2/3,true);dance.closePath();
  const danceSurface=make('#111111',{roughness:.48});
  danceSurface.name='Black dance floor';deck(dance,danceSurface,floor,.016);
  const pile=new Uint8Array(64*64);
  let seed=173;
  for(let i=0;i<pile.length;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    pile[i]=seed>>>24;
  }
  const weave=new THREE.DataTexture(pile,64,64,THREE.RedFormat);
  weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(24,24);
  weave.generateMipmaps=true;weave.minFilter=THREE.LinearMipmapLinearFilter;weave.magFilter=THREE.LinearFilter;weave.needsUpdate=true;
  const carpetSurface=make('#fafafa',{roughness:1,bumpMap:weave,bumpScale:.003});
  carpetSurface.name='White carpet';
  const carpet=new THREE.Mesh(new THREE.CircleGeometry(radius,144),carpetSurface);
  carpet.rotation.x=-Math.PI/2;carpet.position.set(right,floor+.016,0);carpet.receiveShadow=true;node.add(carpet);
  ring(left,radius-.032,.179,chrome,.021);ring(right,radius-.032,.179,graphite,.022);
  for(const r of [1.12,1.89,2.63])rail(graphite,left,r,.65*Math.PI,1.42*Math.PI,.170,.011);
  // Velvet ropes follow the two outside arcs, leaving the centre open at the front.
  function ropeArc(cx,start,end){
    const angles=Array.from({length:8},(_,i)=>start+(end-start)*i/7);
    angles.forEach((angle,i)=>{
      const p=arcPoint(cx,radius-.04,angle,1);
      cylinder(chrome,p.x,.21,p.z,.13,.20,.06);cylinder(chrome,p.x,.59,p.z,.03,.038,.72);
      add(new THREE.SphereGeometry(.075,12,8),chrome,p.x,.985,p.z);
      if(!i)return;
      const a=angles[i-1],b=angle,points=[arcPoint(cx,radius-.04,a,.94),arcPoint(cx,radius-.04,(a+b)/2,.68),arcPoint(cx,radius-.04,b,.94)];
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),14,.048,8,false),velvet,0,0,0);
    });
  }
  ropeArc(left,.42*Math.PI,1.61*Math.PI);ropeArc(right,-.61*Math.PI,.58*Math.PI);

  // The right circle holds the backbar and a curved, chrome-edged service counter.
  function sector(cx,cz,inner,outer,start,end,bottom,height,mat){
    const shape=new THREE.Shape();shape.absarc(cx,-cz,outer,start,end,false);
    shape.absarc(cx,-cz,inner,end,start,true);shape.closePath();deck(shape,mat,bottom,height);
  }
  const counterX=right+.22,counterZ=-.93;
  sector(counterX,counterZ,1.12,1.64,-2.83,-.29,.18,.90,velvet);
  sector(counterX,counterZ,1.08,1.68,-2.83,-.29,1.08,.045,chrome);
  sector(counterX,counterZ,1.04,1.72,-2.83,-.29,1.125,.09,marble);
  for(let i=0;i<31;i++){
    const a=.31+i*(2.81-.31)/30;const x=counterX+1.64*Math.cos(a),z=counterZ+1.64*Math.sin(a);
    cylinder(graphite,x,.66,z,.038,.038,.83,10);
  }
  for(const angle of [-.78*Math.PI,-.56*Math.PI,-.30*Math.PI]){
    const p=arcPoint(right,2.87,angle,.19);
    cylinder(chrome,p.x,1.27,p.z,.032,.043,2.20);
    cylinder(graphite,p.x,.25,p.z,.12,.13,.14);
  }
  for(const y of [.93,1.63,2.26]){
    sector(right,0,2.50,3.02,.28*Math.PI,.80*Math.PI,y,.085,graphite);
    rail(light,right,2.51,-.80*Math.PI,-.28*Math.PI,y+.025,.022);
    for(let i=0;i<12;i++){
      const p=arcPoint(right,2.76,-Math.PI*(.30+i*.48/11),y);
      const m=[glass,smokedGlass,pearl,graphite][(i+Math.round(y*4))%4];
      cylinder(m,p.x,y+.22,p.z,.077,.08,.255);cylinder(m,p.x,y+.389,p.z,.032,.069,.083);
      cylinder(chrome,p.x,y+.45,p.z,.033,.036,.04);box(label,p.x,y+.235,p.z+.074,.076,.1,.012);
    }
  }
  for(const x of [right-.67,right+.67]){
    cylinder(chrome,x,2.76,-2.65,.023,.023,.51);add(new THREE.SphereGeometry(.13,16,12),light,x,2.46,-2.65);
  }
  for(const x of [right-1.70,right+1.70])cylinder(chrome,x,1.59,-2.65,.030,.042,2.86);
  // Match the Russian landing-page heading, including its lowercase serif treatment.
  const banner=sign('джеймс бондаж',3.48,.48,right,2.84,-2.60,'#141414','#ffffff',
    {font:'400 121px "Times New Roman", Times, serif',spacing:'-5px'});
  banner.name='Джеймс Бондаж';
  const shimmer={value:0};
  banner.material.onBeforeCompile=shader=>{
    shader.uniforms.bannerTime=shimmer;
    shader.fragmentShader='uniform float bannerTime;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float glint = 1.0 - smoothstep(0.0, 0.15, abs(vMapUv.x - (fract(bannerTime*0.12)*1.55-0.28)));
      diffuseColor.rgb += glint*vec3(0.065,0.070,0.083);`);
  };

  // A round podium, twin turntables and a mixer face into the left dance floor.
  const djX=left-.59,djZ=-1.82;
  cylinder(chrome,djX,.21,djZ,1.22,1.26,.08,56);
  cylinder(graphite,djX,.35,djZ,1.22,1.22,.21,56);
  const deskZ=djZ+.39;
  box(graphite,djX,.91,deskZ,1.94,.88,.58);
  box(marble,djX,1.38,deskZ,2.03,.08,.63);
  box(ink,djX,1.448,deskZ,1.83,.055,.46);
  for(const x of [djX-.62,djX+.62]){
    cylinder(chrome,x,1.49,deskZ,.18,.18,.02);cylinder(ink,x,1.51,deskZ,.15,.15,.019);
    cylinder(light,x,1.524,deskZ,.032,.032,.01);
  }
  for(let i=0;i<4;i++){
    box(chrome,djX-.21+i*.13,1.492,deskZ,.014,.014,.20);
    box(pearl,djX-.21+i*.13,1.513,deskZ-.04+(i%2)*.07,.068,.03,.03);
  }
  for(const x of [djX-1.05,djX+1.05]){
    cylinder(chrome,x,.94,-2.24,.035,.09,1.46);box(ink,x,1.93,-2.24,.38,.63,.33);
    for(const y of [1.80,2.06])add(new THREE.CylinderGeometry(.11,.11,.025,18),lacquer,x,y,-2.06,1,1,1,Math.PI/2);
  }
  for(const x of [right+.70,right+1.67]){
    cylinder(chrome,x,.24,1.94,.15,.19,.08);cylinder(chrome,x,.59,1.94,.037,.05,.65);
    cylinder(velvet,x,.95,1.94,.22,.23,.13);
  }
  const effects=createVipEffects(THREE,venue,{ink,chrome,carpet:carpetSurface},djX,djZ,left,radius);
  venue.finish();
  const updateDancers=createVipDancers(THREE,node,requestFrame);

  const cast=[],servers=[],floorStaff=[];
  let started=false;
  // Service passes in front of the counter, around the dancers and back past
  // the stools. Arc-length sampling keeps both servers at a steady walking pace.
  const route=new THREE.CatmullRomCurve3([
    [4.38,1.04],[3.75,.60],[3.07,1.12],[1.78,1.36],[.35,1.13],[-1.5,.20],
    [-3.65,-.10],[-4.42,.68],[-4.18,1.74],[-3.1,2.57],[-1.96,2.95],
    [-.78,2.60],[.05,2.16],[1.14,2.55],[2.44,2.82],[3.58,2.66],[4.26,1.89]
  ].map(([x,z])=>v(x,.168,z)),true);
  const lapSeconds=route.getLength()/.81;
  const makeMesh=(geometry,material)=>new THREE.Mesh(geometry,material);
  function serviceProps(model) {
    const right=model.getObjectByName('RightHand'),left=model.getObjectByName('LeftHand');
    const bottle=new THREE.Group(),cup=new THREE.Group();
    const body=makeMesh(new THREE.CylinderGeometry(.047,.054,.19,14),glass);bottle.add(body);
    const neck=makeMesh(new THREE.CylinderGeometry(.021,.038,.09,12),chrome);neck.position.y=.135;bottle.add(neck);
    const bowl=makeMesh(new THREE.CylinderGeometry(.071,.022,.074,18),pearl);bowl.position.y=.075;cup.add(bowl);
    const stem=makeMesh(new THREE.CylinderGeometry(.009,.009,.065,10),chrome);cup.add(stem);
    const base=makeMesh(new THREE.CylinderGeometry(.041,.041,.01,12),chrome);base.position.y=-.038;cup.add(base);
    const stream=makeMesh(new THREE.CylinderGeometry(.007,.007,1,8),light);
    node.add(bottle,cup,stream);return {right,left,bottle,cup,stream};
  }
  function cocktailTray(){
    const tray=new THREE.Group();
    tray.add(makeMesh(new THREE.CylinderGeometry(.173,.155,.018,28),chrome));
    for(const x of [-.071,.071]){
      const tumbler=makeMesh(new THREE.CylinderGeometry(.036,.026,.084,12),glass);
      tumbler.position.set(x,.051,.012);tray.add(tumbler);
    }
    node.add(tray);return tray;
  }
  async function person(id,x,y,z,phase,yaw=0) {
    try {
      const {scene:model,animations}=await loadCastMember(id);model.position.set(x,y,z);model.rotation.y=yaw;model.userData.vipRole=id;node.add(model);
      model.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;});
      const mixer=new THREE.AnimationMixer(model);mixer.clipAction(animations[0]).play();
      const entry={mixer,phase};cast.push(entry);
      if(id.startsWith('vip-pour'))servers.push({...serviceProps(model),phase});
      if(id.startsWith('vip-service'))floorStaff.push({model,phase,tray:cocktailTray(),hand:model.getObjectByName('LeftHand')});
      requestFrame();
    }catch(error){console.error('VIP cast asset',id,error);}
  }
  const a=v(0,0,0),b=v(0,0,0),direction=v(0,0,0),up=v(0,1,0);
  function update(camera,time,moving){
    const t=moving?time:0;
    const crowdChanged=updateDancers(camera,t,moving);
    effects.update(t,moving);shimmer.value=t;
    if(Math.hypot(camera.position.x-node.position.x,camera.position.z-node.position.z)>34)return crowdChanged;
    if(!started){
      started=true;person('vip-pour-1',counterX-.67,.17,-.45,1.1);person('vip-pour-2',counterX+.67,.17,-.45,2.55);
      person('vip-dj',djX,.455,djZ,.7);
      person('vip-service-white',0,.168,0,lapSeconds*.20);
      person('vip-service-black',0,.168,0,lapSeconds*.70);
    }
    cast.forEach(({mixer,phase})=>mixer.setTime(t+phase));
    for(const {model,phase,tray,hand} of floorStaff){
      const u=((t+phase)/lapSeconds)%1;
      route.getPointAt(u,model.position);route.getTangentAt(u,direction);
      model.rotation.y=Math.atan2(direction.x,direction.z);
      hand.getWorldPosition(a);node.worldToLocal(a);
      tray.position.copy(a).addScaledVector(direction,.067);tray.position.y+=.016;
    }
    for(const {right,left,bottle,cup,stream,phase} of servers){
      right.getWorldPosition(a);node.worldToLocal(a);left.getWorldPosition(b);node.worldToLocal(b);
      bottle.position.copy(a);bottle.position.z+=.046;cup.position.copy(b);cup.position.z+=.046;
      const lift=(1-Math.cos((t+phase)*2*Math.PI/5))/2;
      bottle.rotation.z=-.17-1.98*lift;
      a.set(0,.18,0).applyQuaternion(bottle.quaternion).add(bottle.position);
      b.copy(cup.position);b.y+=.106;direction.subVectors(a,b);
      stream.visible=lift>.68&&a.y>b.y;
      if(stream.visible){stream.position.addVectors(a,b).multiplyScalar(.5);stream.scale.y=direction.length();stream.quaternion.setFromUnitVectors(up,direction.normalize());}
    }
    return moving;
  }
  return {setNight:effects.setNight,update};
}
