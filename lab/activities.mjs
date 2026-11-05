import {loadCastMember} from './festival-cast.mjs?v=20261105activity3';
/** Shared wellbeing and music-making activities; fictional scene figures. */
export function createActivities(THREE, architecture, requestFrame) {
  const group=new THREE.Group();group.name='Support, play and collaborative music';
  const support=new THREE.Group(),play=new THREE.Group(),music=new THREE.Group();group.add(support,play,music);
  support.name='Meditation, yoga and two clinicians';play.name='Three children sliding';music.name='Phone music circle';
  const V=(...p)=>new THREE.Vector3(...p),up=V(0,1,0);
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8});
  const glow=new THREE.MeshBasicMaterial({color:'#6de3e6',side:THREE.DoubleSide});
  const actors=[],phones=[],waves=[];
  // The small figures on the separate playground follow its curved slide.
  function slideRider(skin,shirt){
    const root=new THREE.Group(),parts=[];
    function part(geo,colour,position=[0,0,0],rotation=null){
      const matrix=new THREE.Matrix4().compose(V(...position),rotation||new THREE.Quaternion(),V(1,1,1));geo.applyMatrix4(matrix);parts.push({geo,colour});
    }
    function ball(p,r,colour,stretch=[1,1,1]){const g=new THREE.SphereGeometry(r,12,9);g.scale(...stretch);part(g,colour,p);}
    function bone(a,b,r,colour,r2=r){const dir=V(...b).sub(V(...a));part(new THREE.CylinderGeometry(r,r2,dir.length(),10),colour,V(...a).add(V(...b)).multiplyScalar(.5).toArray(),new THREE.Quaternion().setFromUnitVectors(up,dir.normalize()));}
    const hip=[0,.2,0],neck=[0,.78,-.1],head=[0,.96,-.13];
    bone(hip,neck,.19,shirt,.22);ball(hip,.16,'#354551',[1.1,.6,.78]);
    for(const side of [-1,1]){
      const knee=[side*.13,.14,.38],foot=[side*.14,.09,.78],elbow=[side*.3,.5,.05],hand=[side*.28,.22,.16];
      bone([side*.1,.2,0],knee,.08,'#354551');bone(knee,foot,.065,'#354551');ball(foot,.078,skin,[.75,.6,1.7]);
      bone([side*.19,.72,-.09],elbow,.065,shirt);bone(elbow,hand,.047,skin);ball(hand,.055,skin,[.8,1,.8]);
    }
    bone(neck,head,.06,skin);ball(head,.13,skin,[.84,1.12,.86]);
    const hair=new THREE.SphereGeometry(.137,12,8,0,Math.PI*2,0,Math.PI*.58);hair.scale(.9,.9,.94);part(hair,'#242526',[0,1,-.14]);
    ball([0,.945,-.02],.023,skin);
    const positions=[],normals=[],colours=[];
    for(const {geo,colour} of parts){const g=geo.index?geo.toNonIndexed():geo,p=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(colour);for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));colours.push(c.r,c.g,c.b);}if(g!==geo)g.dispose();geo.dispose();}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
    const body=new THREE.Mesh(geo,material);body.castShadow=true;body.receiveShadow=true;root.add(body);root.scale.setScalar(.74);
    root.userData={role:'slide',skin};actors.push(root);
    return root;
  }

  const cast=[];
  function visitor(parent,name,asset,role,x,y,z,yaw,details={}){
    const anchor=new THREE.Group();
    anchor.name=name;anchor.position.set(x,y,z);anchor.rotation.y=yaw;
    anchor.userData={role,asset,status:'waiting',...details};parent.add(anchor);actors.push(anchor);
    const member={anchor,parent,phase:cast.length*.71,mixer:null,tick:-1,phone:null,
      bounds:new THREE.Sphere(V(x,y+.85,z),1.55)};
    cast.push(member);return member;
  }
  function fitStethoscope(model){
    const neck=model.getObjectByName('Neck'),chest=model.getObjectByName('Spine2');
    const kit=new THREE.Group();kit.name='Stethoscope and clinical ID';
    const rubber=new THREE.MeshStandardMaterial({color:'#20383b',roughness:.75});
    const metal=new THREE.MeshStandardMaterial({color:'#b8cccc',metalness:.6,roughness:.38});
    function tube(points,radius,material){
      kit.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>V(...p))),20,radius,6,false),material));
    }
    tube([[-.085,0,.022],[-.114,-.09,.11],[-.069,-.199,.138],[.011,-.211,.141],[.083,-.13,.134],[.084,0,.022]],.009,rubber);
    tube([[.004,-.21,.141],[.034,-.268,.141],[.072,-.25,.141]],.006,rubber);
    const bell=new THREE.Mesh(new THREE.CylinderGeometry(.026,.028,.013,16),metal);
    bell.rotation.x=Math.PI/2;bell.position.set(.077,-.242,.147);kit.add(bell);
    const badge=new THREE.Mesh(new THREE.BoxGeometry(.049,.067,.008),new THREE.MeshStandardMaterial({color:'#7cb7ad'}));
    badge.position.set(-.11,-.155,.138);kit.add(badge);
    kit.position.copy(neck.getWorldPosition(V()));model.worldToLocal(kit.position);model.add(kit);chest.attach(kit);
  }
  async function load(member){
    const {anchor,phase,phone}=member,data=anchor.userData;
    data.status='loading';
    try{
      const asset=await loadCastMember(data.asset),model=asset.scene;
      model.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;});
      anchor.add(model);
      member.mixer=new THREE.AnimationMixer(model);
      member.mixer.clipAction(asset.animations[0]).play();member.mixer.setTime(phase);anchor.updateWorldMatrix(true,true);
      if(data.role==='doctor')fitStethoscope(model);
      if(phone){
        const hand=model.getObjectByName('LeftHand'),grip=model.getObjectByName('LeftHandMiddle1');
        model.worldToLocal(grip.getWorldPosition(phone.position));
        phone.position.add(V(-.033,.018,.018));model.add(phone);hand.attach(phone);phone.visible=true;
      }
      data.status='ready';
    }catch(error){data.status='error';console.error('Loading activity visitor '+data.asset,error);}
    requestFrame();
  }
  function mat(parent,x,z,w,d,colour,yaw=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.035,d),new THREE.MeshStandardMaterial({color:colour,roughness:1}));m.position.set(x,.11,z);m.rotation.y=yaw;m.receiveShadow=true;parent.add(m);}
  for(const [i,[x,z,id]] of [[-35,-24.5,'02'],[-33.3,-24.7,'05'],[-34.15,-22.9,'06']].entries()){
    mat(support,x,z+.12,1.15,1.05,['#c5d6bf','#d6c5a9','#c4bdd7'][i]);
    visitor(support,'Cross-legged meditation '+(i+1),id,'seated',x,.14,z,.5);
  }
  mat(support,-31.8,-24,1.05,2.25,'#9cbec1',.3);
  visitor(support,'Downward-facing dog','yoga-04','yoga',-31.8,.13,-24,.3);
  const uniform={gender:'female',coat:'long',footwear:'heels',hair:'long',stethoscope:true};
  visitor(support,'Support clinician','clinician-1','doctor',-31.1,.08,-21.9,.55,uniform);
  visitor(support,'Welcome clinician','clinician-2','doctor',-35.8,.08,-21.5,.7,uniform);

  const sliding=[];
  for(let i=0;i<3;i++){const child=slideRider(['#724a37','#b27a55','#543a2f'][i],['#edac61','#7ac2c6','#b18bc8'][i]);child.name='Sliding child '+(i+1);play.add(child);sliding.push(child);}
  const slideRotation=new THREE.Matrix4().makeRotationY(.35),slideOrigin=V(-17,.08,31);
  const slidePosition=(t)=>V(...architecture.slidePoint(t)).applyMatrix4(slideRotation).add(slideOrigin);

  // The music circle uses the three existing Moroso chairs around the rotunda table.
  for(let i=0;i<3;i++){
    const a=i/3*Math.PI*2,x=-26+Math.sin(a)*1.5,z=18+Math.cos(a)*1.5;
    const player=visitor(music,'Phone beat-maker '+(i+1),['phone-02','phone-09','phone-01'][i],'phone',x,.085,z,a+Math.PI);
    const phone=new THREE.Group();phone.name='Music handset';phone.rotation.x=.84;phone.visible=false;player.phone=phone;
    const casing=new THREE.Mesh(new THREE.BoxGeometry(.078,.158,.012),new THREE.MeshStandardMaterial({color:'#1b2930',roughness:.35}));phone.add(casing);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(.071,.146),glow);screen.position.z=-.007;screen.rotation.y=Math.PI;phone.add(screen);
    const c=document.createElement('canvas');c.width=128;c.height=224;const ctx=c.getContext('2d'),map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
    screen.material=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide});phones.push({phone,ctx,map,index:i});
  }
  music.updateMatrixWorld(true);
  for(let i=0;i<3;i++){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(65*3),3));
    const wave=new THREE.Line(geo,new THREE.LineBasicMaterial({color:['#40bccd','#e5b94c','#c479b4'][i],transparent:true,opacity:.85,depthWrite:false}));wave.name='Shared device waveform';music.add(wave);waves.push(wave);
  }
  const pads=new THREE.InstancedMesh(new THREE.BoxGeometry(.16,.025,.16),new THREE.MeshBasicMaterial({color:'#ffffff'}),16),dummy=new THREE.Object3D();
  pads.name='Shared 16-step beat sequencer';pads.position.set(-26,.91,18);music.add(pads);
  for(let i=0;i<16;i++){dummy.position.set((i%4-1.5)*.21,0,(Math.floor(i/4)-1.5)*.21);dummy.updateMatrix();pads.setMatrixAt(i,dummy.matrix);pads.setColorAt(i,new THREE.Color('#315b65'));}
  const speaker=new THREE.Group();speaker.name='360-degree table speaker';speaker.position.set(-26,.92,18);music.add(speaker);
  const grille=new THREE.MeshStandardMaterial({color:'#233c42',roughness:.65,metalness:.3});
  const speakerBody=new THREE.Mesh(new THREE.CylinderGeometry(.19,.21,.38,40),grille);speakerBody.position.y=.19;speakerBody.castShadow=true;speaker.add(speakerBody);
  const ringMaterial=new THREE.MeshBasicMaterial({color:'#73e4d5',transparent:true,opacity:.85});
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.19,.012,6,40),ringMaterial);rim.rotation.x=Math.PI/2;rim.position.y=.37;speaker.add(rim);
  const slots=new THREE.InstancedMesh(new THREE.BoxGeometry(.009,.27,.008),new THREE.MeshStandardMaterial({color:'#81989a',metalness:.5,roughness:.45}),40);
  for(let i=0;i<40;i++){const a=i/40*Math.PI*2;dummy.position.set(Math.sin(a)*.205,.19,Math.cos(a)*.205);dummy.rotation.y=a;dummy.updateMatrix();slots.setMatrixAt(i,dummy.matrix);}speaker.add(slots);
  const soundRings=[];for(let i=0;i<3;i++){const mat=ringMaterial.clone(),ring=new THREE.Mesh(new THREE.TorusGeometry(.25,.008,5,48),mat);ring.rotation.x=Math.PI/2;ring.position.y=.19;speaker.add(ring);soundRings.push(ring);}
  // Keep the shared beat pads clear of the speaker at the centre of the table.
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;dummy.position.set(Math.sin(a)*.44,0,Math.cos(a)*.44);dummy.rotation.set(0,a,0);dummy.scale.setScalar(.72);dummy.updateMatrix();pads.setMatrixAt(i,dummy.matrix);}pads.instanceMatrix.needsUpdate=true;
  let lastBeat=-1,lastTime=-1;
  function update(t,moving=true,camera,frustum){
    let castChanged=false;
    if(group.visible&&camera){
      for(const member of cast){
        const {anchor,parent,bounds}=member;
        anchor.visible=parent.visible&&frustum.intersectsSphere(bounds);
        if(!anchor.visible)continue;
        if(anchor.userData.status==='waiting'&&camera.position.distanceToSquared(bounds.center)<65**2)load(member);
        const tick=Math.floor(t*20);
        if(member.mixer&&tick!==member.tick){
          member.mixer.setTime(t+member.phase);member.tick=tick;castChanged=true;
        }
      }
    }
    if(!group.visible)return false;
    if(!moving&&lastTime>=0&&!castChanged)return false;
    if(t===lastTime&&!castChanged)return false;lastTime=t;
    soundRings.forEach((ring,i)=>{const phase=(t*.8+i/3)%1;ring.scale.setScalar(1+phase*2.4);ring.material.opacity=(1-phase)*.55;});rim.material.opacity=.65+.25*Math.sin(t*6*Math.PI);
    sliding.forEach((child,i)=>{
      const u=((t*.14+i/3)%1),p=slidePosition(u),ahead=slidePosition(Math.min(1,u+.002)),behind=slidePosition(Math.max(0,u-.002)),d=ahead.sub(behind);
      child.position.copy(p);child.position.y+=.07;child.rotation.set(Math.atan2(-d.y,Math.hypot(d.x,d.z)),Math.atan2(d.x,d.z),0,'YXZ');
    });
    phones.forEach(({ctx,map,index})=>{
      ctx.fillStyle='#17363d';ctx.fillRect(0,0,128,224);ctx.strokeStyle=['#61d8e4','#f3cf63','#e5a6d5'][index];ctx.lineWidth=5;ctx.beginPath();
      for(let j=0;j<128;j++){const y=60+Math.sin(j*.12-t*4-index)*Math.sin(j/128*Math.PI)*22;j?ctx.lineTo(j,y):ctx.moveTo(j,y);}ctx.stroke();
      for(let j=0;j<16;j++){ctx.fillStyle=(j===Math.floor(t*3)%16||j%5===index)?'#64d9cc':'#315b65';ctx.fillRect(12+j%4*28,105+Math.floor(j/4)*27,20,19);}map.needsUpdate=true;
    });
    music.updateMatrixWorld(true);
    waves.forEach((wave,i)=>{
      const start=phones[i].phone,end=phones[(i+1)%3].phone;
      wave.visible=start.visible&&end.visible&&start.parent&&end.parent&&music.visible;
      if(!wave.visible)return;
      const a=start.getWorldPosition(V()),b=end.getWorldPosition(V()),attr=wave.geometry.attributes.position;
      for(let j=0;j<=64;j++){const u=j/64,envelope=Math.sin(u*Math.PI),p=a.clone().lerp(b,u);p.y+=envelope*(.27+.09*Math.sin(u*30-t*5+i));attr.setXYZ(j,p.x,p.y,p.z);}attr.needsUpdate=true;wave.geometry.computeBoundingSphere();
    });
    const beat=Math.floor(t*3)%16;if(beat!==lastBeat){for(let i=0;i<16;i++)pads.setColorAt(i,new THREE.Color(i===beat?'#f5d466':i%4===0?'#67d6cd':'#315b65'));pads.instanceColor.needsUpdate=true;lastBeat=beat;}
    return true;
  }
  update(0,true);group.visible=false;
  return {group,update,setStory(value){group.visible=value.programme>0;support.visible=value.support>=1;play.visible=value.playground>=1;music.visible=value.park>=1;},stats:{meditatingChildren:3,yogaChildren:1,doctors:2,slidingChildren:3,musicMakingChildren:3,deviceWaveforms:3,spatialSpeakers:1},snapshot(){return {visible:group.visible,actors:actors.map(a=>({name:a.name,position:a.position.toArray(),...a.userData})),beat:lastBeat,time:lastTime};}};
}
