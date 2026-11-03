/** Shared wellbeing and music-making activities; fictional scene figures. */
export function createActivities(THREE, architecture) {
  const group=new THREE.Group();group.name='Support, play and collaborative music';
  const support=new THREE.Group(),play=new THREE.Group(),music=new THREE.Group();group.add(support,play,music);
  support.name='Three seated children, yoga and two female doctors';play.name='Three children sliding';music.name='Phone music circle';
  const V=(...p)=>new THREE.Vector3(...p),up=V(0,1,0);
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8});
  const glow=new THREE.MeshBasicMaterial({color:'#6de3e6',side:THREE.DoubleSide});
  const actors=[],phones=[],waves=[];
  function person({skin='#80533d',shirt='#5a9c9c',pose='seated',scale=.78,doctor=false,hairColour='#242526'}){
    const root=new THREE.Group(),parts=[];
    function part(geo,colour,position=[0,0,0],rotation=null){
      const matrix=new THREE.Matrix4().compose(V(...position),rotation||new THREE.Quaternion(),V(1,1,1));geo.applyMatrix4(matrix);parts.push({geo,colour});
    }
    function ball(p,r,colour,stretch=[1,1,1]){const g=new THREE.SphereGeometry(r,12,9);g.scale(...stretch);part(g,colour,p);}
    function bone(a,b,r,colour,r2=r){const dir=V(...b).sub(V(...a));part(new THREE.CylinderGeometry(r,r2,dir.length(),10),colour,V(...a).add(V(...b)).multiplyScalar(.5).toArray(),new THREE.Quaternion().setFromUnitVectors(up,dir.normalize()));}
    function box(p,size,colour){part(new THREE.BoxGeometry(...size),colour,p);}
    function tube(points,r,colour){part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>V(...p))),24,r,6,false),colour);}
    let hip=[0,.3,0],neck=[0,.91,0],head=[0,1.09,0],ls=[-.19,.85,0],rs=[.19,.85,0];
    let legs=[[[-.1,.3,0],[-.4,.12,.22],[.15,.08,.39]],[[.1,.3,0],[.4,.12,.22],[-.15,.1,.39]]];
    let arms=[[ls,[-.3,.56,.15],[-.36,.23,.22]],[rs,[.3,.56,.15],[.36,.23,.22]]];
    if(pose==='phone'){
      hip=[0,.59,0];neck=[0,1.19,0];head=[0,1.37,.025];ls=[-.19,1.13,0];rs=[.19,1.13,0];
      legs=[[[-.1,.59,0],[-.14,.55,.38],[-.14,.09,.43]],[[.1,.59,0],[.14,.55,.38],[.14,.09,.43]]];
      arms=[[ls,[-.26,.89,.14],[-.08,1.03,.36]],[rs,[.26,.88,.14],[.09,1.01,.36]]];
    }else if(pose==='slide'){
      hip=[0,.2,0];neck=[0,.78,-.1];head=[0,.96,-.13];ls=[-.19,.72,-.09];rs=[.19,.72,-.09];
      legs=[[[-.1,.2,0],[-.13,.14,.38],[-.14,.09,.78]],[[.1,.2,0],[.13,.14,.38],[.14,.09,.78]]];
      arms=[[ls,[-.3,.5,.05],[-.28,.22,.16]],[rs,[.3,.5,.05],[.28,.22,.16]]];
    }else if(pose==='yoga'){
      hip=[0,1.15,-.15];neck=[0,.66,.5];head=[0,.49,.54];ls=[-.17,.7,.45];rs=[.17,.7,.45];
      legs=[[[-.1,1.15,-.15],[-.14,.61,-.48],[-.16,.09,-.87]],[[.1,1.15,-.15],[.14,.61,-.48],[.16,.09,-.87]]];
      arms=[[ls,[-.18,.38,.73],[-.2,.06,1.03]],[rs,[.18,.38,.73],[.2,.06,1.03]]];
    }else if(doctor){
      hip=[0,.96,0];neck=[0,1.5,0];head=[0,1.7,0];ls=[-.19,1.44,0];rs=[.19,1.44,0];
      legs=[[[-.11,.93,0],[-.12,.49,0],[-.13,.09,0]],[[.11,.93,0],[.12,.49,.02],[.13,.09,.04]]];
      arms=[[ls,[-.28,1.15,.03],[-.27,.93,.1]],[rs,[.35,1.2,.1],[.46,1.24,.24]]];
    }
    if(doctor){
      bone([0,1.03,0],[0,1.43,0],.20,'#f3f4ed',.15);
      const skirt=new THREE.CylinderGeometry(.15,.29,.53,16);skirt.scale(1,1,.72);part(skirt,'#f3f4ed',[0,.81,0]);
    }else bone(hip,neck,.19,shirt,.22);
    ball(hip,.16,'#354551',[1.1,.6,.78]);
    legs.forEach(points=>{bone(points[0],points[1],.08,'#354551');bone(points[1],points[2],.065,'#354551');if(doctor){const [x,y,z]=points[2];ball([x,y+.035,z+.065],.08,'#26343d',[.8,.55,1.65]);box([x,.045,z-.04],[.035,.09,.04],'#26343d');}else ball(points[2],.078,skin,[.75,.6,1.7]);});
    arms.forEach(points=>{bone(points[0],points[1],.065,doctor?'#f3f4ed':shirt);bone(points[1],points[2],.047,doctor?'#f3f4ed':skin);ball(points[2],.055,skin,[.8,1,.8]);});
    bone(neck,head,.06,skin);ball(head,.13,skin,[.84,1.12,.86]);
    const hair=new THREE.SphereGeometry(.137,12,8,0,Math.PI*2,0,Math.PI*.58);hair.scale(.9,.9,.94);part(hair,hairColour,[head[0],head[1]+.04,head[2]-.01]);
    if(doctor){
      ball([0,1.51,-.09],.14,hairColour,[1.04,1.85,.65]);
      for(const side of [-1,1])ball([side*.115,1.51,-.02],.075,hairColour,[.65,2.2,.82]);
    }
    ball([head[0],head[1]-.015,head[2]+.11],.023,skin);
    // Closed eyes on the seated figures make the pose legible at closer range.
    if(pose==='seated')for(const x of [-.045,.045])bone([x-.018,head[1]+.015,.108],[x+.018,head[1]+.015,.108],.006,'#30292a');
    if(doctor){
      box([0,.94,.205],[.014,.76,.012],'#b8c5c4');
      for(const x of [-.16,.16])box([x,.76,.193],[.10,.12,.018],'#e1e6e1');
      box([-.14,1.34,.205],[.09,.11,.025],'#51a7a2');
      tube([[-.11,1.48,.15],[-.16,1.3,.23],[-.1,1.18,.24],[0,1.14,.24],[.09,1.23,.23],[.1,1.47,.15]],.016,'#23444e');
      tube([[0,1.14,.24],[.04,1.04,.25],[.12,1.09,.25]],.013,'#23444e');
      ball([.12,1.09,.26],.043,'#bacbd0',[1,1,.35]);
    }
    const positions=[],normals=[],colours=[];
    for(const {geo,colour} of parts){const g=geo.index?geo.toNonIndexed():geo,p=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(colour);for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));colours.push(c.r,c.g,c.b);}if(g!==geo)g.dispose();geo.dispose();}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
    const body=new THREE.Mesh(geo,material);body.castShadow=true;body.receiveShadow=true;root.add(body);root.scale.setScalar(scale);
    root.userData={role:doctor?'doctor':pose,skin,...(doctor?{gender:'female',coat:'long',footwear:'heels',hair:'long',stethoscope:true}:{})};actors.push(root);
    return root;
  }
  function place(parent,actor,x,y,z,yaw=0){actor.position.set(x,y,z);actor.rotation.y=yaw;parent.add(actor);return actor;}
  function mat(parent,x,z,w,d,colour,yaw=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.035,d),new THREE.MeshStandardMaterial({color:colour,roughness:1}));m.position.set(x,.11,z);m.rotation.y=yaw;m.receiveShadow=true;parent.add(m);}
  for(const [i,x,z,skin,shirt] of [[0,-35,-24.5,'#744a35','#6b9e9b'],[1,-33.3,-24.7,'#513729','#d19b67'],[2,-34.15,-22.9,'#956044','#aa7cac']]){
    mat(support,x,z+.12,1.15,1.05,['#c5d6bf','#d6c5a9','#c4bdd7'][i]);
    const child=place(support,person({skin,shirt}),x,.15,z,.5);child.name='Cross-legged meditation '+(i+1);
  }
  mat(support,-31.8,-24,1.05,2.25,'#9cbec1',.3);
  place(support,person({skin:'#744a35',shirt:'#d299aa',pose:'yoga'}),-31.8,.15,-24,.3).name='Downward-facing dog';
  place(support,person({skin:'#9b6b50',doctor:true,scale:1,hairColour:'#30251f'}),-31.1,.08,-21.9,.55).name='Female doctor with long lab coat, heels and stethoscope';
  place(support,person({skin:'#c48c6d',doctor:true,scale:1,hairColour:'#73452e'}),-35.8,.08,-21.5,.7).name='Female headspace clinician with long lab coat, heels and stethoscope';

  const sliding=[];
  for(let i=0;i<3;i++){const child=person({skin:['#724a37','#b27a55','#543a2f'][i],shirt:['#edac61','#7ac2c6','#b18bc8'][i],pose:'slide',scale:.74});child.name='Sliding child '+(i+1);play.add(child);sliding.push(child);}
  const slideRotation=new THREE.Matrix4().makeRotationY(.35),slideOrigin=V(-17,.08,31);
  const slidePosition=(t)=>V(...architecture.slidePoint(t)).applyMatrix4(slideRotation).add(slideOrigin);

  // The music circle uses the three existing Moroso chairs around the rotunda table.
  for(let i=0;i<3;i++){
    const a=i/3*Math.PI*2,x=-26+Math.sin(a)*1.5,z=18+Math.cos(a)*1.5;
    const child=place(music,person({skin:['#83543d','#bd8d6a','#593d30'][i],shirt:['#6eafb6','#bd90b4','#d5ad62'][i],pose:'phone',scale:.85}),x,.08,z,a+Math.PI);child.name='Phone beat-maker '+(i+1);
    const phone=new THREE.Group();phone.position.set(0,1.04,.36);phone.rotation.x=.78;child.add(phone);
    const casing=new THREE.Mesh(new THREE.BoxGeometry(.16,.29,.025),new THREE.MeshStandardMaterial({color:'#1b2930',roughness:.35}));phone.add(casing);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(.135,.245),glow);screen.position.z=-.014;screen.rotation.y=Math.PI;phone.add(screen);
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
  function update(t,moving=true){
    if(!group.visible)return false;
    if(!moving&&lastTime>=0)return false;
    if(t===lastTime)return false;lastTime=t;
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
      const a=phones[i].phone.getWorldPosition(V()),b=phones[(i+1)%3].phone.getWorldPosition(V()),attr=wave.geometry.attributes.position;
      for(let j=0;j<=64;j++){const u=j/64,envelope=Math.sin(u*Math.PI),p=a.clone().lerp(b,u);p.y+=envelope*(.27+.09*Math.sin(u*30-t*5+i));attr.setXYZ(j,p.x,p.y,p.z);}attr.needsUpdate=true;wave.geometry.computeBoundingSphere();
    });
    const beat=Math.floor(t*3)%16;if(beat!==lastBeat){for(let i=0;i<16;i++)pads.setColorAt(i,new THREE.Color(i===beat?'#f5d466':i%4===0?'#67d6cd':'#315b65'));pads.instanceColor.needsUpdate=true;lastBeat=beat;}
    return true;
  }
  update(0,true);group.visible=false;
  return {group,update,setStory(value){group.visible=value.programme>0;support.visible=value.support>=1;play.visible=value.playground>=1;music.visible=value.park>=1;},stats:{meditatingChildren:3,yogaChildren:1,doctors:2,slidingChildren:3,musicMakingChildren:3,deviceWaveforms:3,spatialSpeakers:1},snapshot(){return {visible:group.visible,actors:actors.map(a=>({name:a.name,position:a.position.toArray(),...a.userData})),beat:lastBeat,time:lastTime};}};
}
