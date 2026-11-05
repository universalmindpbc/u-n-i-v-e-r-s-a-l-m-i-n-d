import {loadCastMember} from './festival-cast.mjs?v=20261105activity3';

export function buildVipBar(THREE, venue, make, requestFrame) {
  const {node,box,cylinder,add,sign} = venue;
  const velvet=make('#9c203e',{roughness:.92}), claret=make('#461127'), marble=make('#f1d9c4',{roughness:.32});
  const brass=make('#d2a25f',{metalness:.56,roughness:.31}), lacquer=make('#322831',{roughness:.37});
  const blush=make('#df9483'), amber=make('#ae542a'), glass=make('#9cb7aa',{metalness:.24,roughness:.24});
  const light=make('#ffdda7',{emissive:'#ffc18a',emissiveIntensity:.95});
  const ink=make('#24232a'), cream=make('#feeacc');

  // The two rope runs stop short of the entrance, leaving a clear central aisle.
  box(claret,0,.06,0,8.8,.18,8.0);
  box(lacquer,0,.16,-.34,8.62,.03,7.1);
  box(velvet,0,.162,1.9,1.7,.03,4.15);
  for(const x of [-.9,.9])box(brass,x,.181,1.9,.026,.012,4.15);
  const v=(x,y,z)=>new THREE.Vector3(x,y,z);
  function rope(x1,z1,x2,z2){
    const curve=new THREE.QuadraticBezierCurve3(v(x1,1.02,z1),v((x1+x2)/2,.43,(z1+z2)/2),v(x2,1.02,z2));
    add(new THREE.TubeGeometry(curve,20,.05,8,false),velvet,0,0,0);
  }
  for(const side of [-1,1]){
    const posts=[[side*1.12,3.83],[side*2.62,3.83],[side*4.16,3.83],[side*4.16,1.81]];
    posts.forEach(([x,z],i)=>{
      cylinder(brass,x,.20,z,.18,.23,.07);cylinder(brass,x,.63,z,.03,.042,.81);
      add(new THREE.SphereGeometry(.083,12,8),brass,x,1.06,z);
      if(i)rope(...posts[i-1],x,z);
    });
    for(const z of [.38,2.00]){
      box(velvet,side*3.67,.39,z,.80,.45,1.52);
      box(claret,side*4.03,.68,z,.19,.61,1.52);
    }
    for(const z of [.18,1.88]){
      cylinder(brass,side*2.80,.19,z,.21,.26,.05);
      cylinder(brass,side*2.80,.46,z,.055,.07,.5);
      cylinder(marble,side*2.80,.74,z,.32,.32,.07);
    }
  }

  // Gently scalloped velvet behind the bottle display and DJ podium.
  const curtain=new THREE.PlaneGeometry(8.6,3.38,120,1);
  const cp=curtain.attributes.position;
  for(let i=0;i<cp.count;i++)cp.setZ(i,.075*Math.cos(cp.getX(i)*23));
  curtain.computeVertexNormals();velvet.side=THREE.DoubleSide;
  add(curtain,velvet,0,1.84,-3.77);
  for(const x of [-4.15,4.15])box(brass,x,1.81,-3.6,.055,3.34,.055);
  box(brass,0,3.48,-3.58,8.45,.07,.08);
  sign('Adaptogen VIP Bar',4.7,.63,0,3.13,-3.47,'#491626','#ffdeab');
  for(const y of [.86,1.56,2.27]){
    box(lacquer,-1.7,y,-3.16,4.35,.09,.61);
    box(light,-1.7,y-.045,-2.84,4.35,.027,.03);
    for(let i=0;i<11;i++){
      const x=-3.66+i*.386,z=-3.1;const mat=[glass,amber,blush,claret][(i+Math.round(y*8))%4];
      cylinder(mat,x,y+.19,z,.083,.086,.27);cylinder(mat,x,y+.355,z,.038,.078,.09);cylinder(brass,x,y+.426,z,.037,.037,.055);
      box(cream,x,y+.20,z+.078,.085,.106,.012);
    }
  }
  box(claret,-1.69,.70,-.82,4.76,1.05,.73);
  for(let i=0;i<32;i++)cylinder(velvet,-3.94+i*.145,.69,-.449,.071,.071,.96,10);
  box(marble,-1.69,1.24,-.81,4.92,.10,.85);
  box(brass,-1.69,1.155,-.38,4.94,.036,.04);
  for(const x of [-3.72,.31]){
    cylinder(brass,x,1.46,-.79,.075,.06,.32);
    cylinder(marble,x,1.65,-.79,.155,.155,.07);
    cylinder(amber,x,1.80,-.79,.062,.065,.23);
    cylinder(brass,x,1.95,-.79,.027,.033,.08);
  }

  box(lacquer,2.47,.32,-2.0,2.75,.33,2.50);
  box(brass,2.47,.46,-.75,2.73,.04,.04);
  box(claret,2.47,.94,-1.45,2.29,.90,.62);
  box(marble,2.47,1.40,-1.45,2.37,.08,.70);
  box(ink,2.47,1.465,-1.45,1.80,.062,.48);
  for(const x of [1.89,3.05]){
    cylinder(brass,x,1.505,-1.45,.19,.19,.02);
    cylinder(ink,x,1.524,-1.45,.157,.157,.02);
    cylinder(light,x,1.537,-1.45,.036,.036,.01);
  }
  for(let i=0;i<4;i++){
    box(brass,2.30+i*.11,1.503,-1.44,.018,.014,.22);
    box(blush,2.30+i*.11,1.527,-1.48+(i%2)*.07,.075,.043,.036);
  }
  for(const x of [1.04,3.92]){
    cylinder(brass,x,1.03,-2.82,.035,.10,1.69);
    box(ink,x,2.0,-2.82,.42,.68,.36);
    for(const y of [1.87,2.15])add(new THREE.CylinderGeometry(.122,.122,.025,18),lacquer,x,y,-2.627,1,1,1,Math.PI/2);
  }
  for(const x of [-3.9,.48,3.83]){
    box(brass,x,2.98,-3.03,.035,.91,.035);
    add(new THREE.SphereGeometry(.14,16,12),light,x,2.48,-3.03);
  }
  venue.finish();

  const cast=[],servers=[];let started=false;
  const makeMesh=(geometry,material)=>new THREE.Mesh(geometry,material);
  function serviceProps(model) {
    const right=model.getObjectByName('RightHand'),left=model.getObjectByName('LeftHand');
    const bottle=new THREE.Group(),cup=new THREE.Group();
    const body=makeMesh(new THREE.CylinderGeometry(.047,.054,.19,14),glass);bottle.add(body);
    const neck=makeMesh(new THREE.CylinderGeometry(.021,.038,.09,12),brass);neck.position.y=.135;bottle.add(neck);
    const bowl=makeMesh(new THREE.CylinderGeometry(.071,.022,.074,18),blush);bowl.position.y=.075;cup.add(bowl);
    const stem=makeMesh(new THREE.CylinderGeometry(.009,.009,.065,10),brass);cup.add(stem);
    const base=makeMesh(new THREE.CylinderGeometry(.041,.041,.01,12),brass);base.position.y=-.038;cup.add(base);
    const stream=makeMesh(new THREE.CylinderGeometry(.007,.007,1,8),light);
    node.add(bottle,cup,stream);return {right,left,bottle,cup,stream};
  }
  async function person(id,x,y,z,phase) {
    try {
      const {scene:model,animations}=await loadCastMember(id);model.position.set(x,y,z);node.add(model);
      model.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;});
      const mixer=new THREE.AnimationMixer(model);mixer.clipAction(animations[0]).play();
      const entry={mixer,phase};cast.push(entry);
      if(id.startsWith('vip-pour'))servers.push({...serviceProps(model),phase});
      requestFrame();
    }catch(error){console.error('VIP cast asset',id,error);}
  }
  const a=v(0,0,0),b=v(0,0,0),direction=v(0,0,0),up=v(0,1,0);
  function update(camera,time,moving){
    if(Math.hypot(camera.position.x-node.position.x,camera.position.z-node.position.z)>34)return false;
    if(!started){
      started=true;person('vip-pour-1',-2.65,.17,-1.52,1.1);person('vip-pour-2',-.78,.17,-1.52,2.55);
      person('vip-dj',2.45,.485,-1.86,.7);
    }
    if(!cast.length)return false;
    const t=moving?time:0;
    cast.forEach(({mixer,phase})=>mixer.setTime(t+phase));
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
  return {update};
}
