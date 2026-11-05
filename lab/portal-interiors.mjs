import {createVisitorGroup} from './visitor-groups.mjs?v=20261105activity2';
import {createEMDRPeople} from './emdr-people.mjs?v=20261105activity2';
/** Relaxed workshop groups, authored in metres. No participant-held devices. */
export function createPortalInteriors(THREE,kit){
 const {Batch,V,box,sphere,tube,circle,peopleMaterial,chairMaterial,furnishings}=kit;
 const clothes=['#697c93','#a66d95','#e5b95f','#65867a','#cf8793','#b9cbba','#ede0cc','#415a78','#ad625f'];
 const skins=['#684332','#996747','#d8ac89','#f0cfb3','#503125','#b98264','#dfb59b'];
 const hairs=['#292724','#d9b66d','#50392b','#bf8e49','#26252b','#79533b','#e9cb90'];
 function skirt(b,p,rTop,rBottom,h,c){b.add(new THREE.CylinderGeometry(rTop,rBottom,h,14,1,true),V(...p),V(1,1,1),c);}
 function torso(b,y,c,female){
  const points=(female?[[.19,0],[.17,.08],[.125,.20],[.17,.36],[.195,.43],[.10,.48]]:[[.18,0],[.18,.18],[.205,.38],[.20,.43],[.10,.48]]).map(([r,h])=>new THREE.Vector2(r,h));
  b.add(new THREE.LatheGeometry(points,12),V(0,y,0),V(1,1,.68),c);
 }
 function person({pose='chair',index=0,female=false,dress=false,longHair=false,visor=false,facilitator=false}={}){
  const b=new Batch(),s=skins[index%skins.length],top=clothes[index%clothes.length],hair=hairs[index%hairs.length];
  const floor=pose==='floor',standing=pose==='stand',hip=standing?.89:({chair:.55,low:.42,bean:.29,floor:.18,hanging:.82,daybed:.55}[pose]??.55),head=hip+.69;
  torso(b,hip,top,female);tube(b,[0,hip+.44,0],[0,hip+.57,0],.055,s);sphere(b,[0,head,.02],[.127,.16,.12],s);
  sphere(b,[0,head+.085,-.025],[.132,.10,.125],hair);
  if(longHair){sphere(b,[0,head-.105,-.105],[.14,.25,.075],hair);for(const side of [-1,1]){tube(b,[side*.11,head+.02,-.04],[side*.14,head-.29,.01],.045,hair);sphere(b,[side*.13,head-.29,.015],[.045,.08,.05],hair);}}
  else if(index%3===0)for(let j=0;j<9;j++)sphere(b,[Math.sin(j*2.4)*.105,head+.105+Math.cos(j*2.4)*.035,Math.cos(j*2.4)*.09],[.047,.05,.046],hair);
  for(const side of [-1,1]){
   sphere(b,[side*.125,head-.015,0],[.027,.045,.025],s);sphere(b,[side*.044,head+.015,.131],[.012,.012,.006],'#35322e');
   const x=side*.105,knee=standing?[x,.46,.02]:floor?[side*.34,.15,.20]:[x,hip-.08,.35],ankle=standing?[x,.10,.03]:floor?[-side*.16,.09,.36]:[x,.09,.49];
   const leg=dress?s:'#3b4854';tube(b,[x,hip,0],knee,.068,leg);tube(b,knee,ankle,.052,leg);sphere(b,[ankle[0],.065,ankle[2]+.06],[.066,.052,.12],floor?s:'#59524a');
   const gesture=facilitator&&side===1,hand=gesture?[.42,hip+.42,.28]:floor?[side*.30,.28,.23]:[side*.17,hip+.10,.32];
   const elbow=[side*.25,hip+.22,.09];tube(b,[side*.18,hip+.40,0],elbow,.055,top);tube(b,elbow,hand,.042,s);sphere(b,hand,[.045,.053,.04],s);
  }
  if(dress){if(standing)skirt(b,[0,hip-.27,0],.17,.34,.58,top);else {sphere(b,[0,hip-.055,.19],[.26,.13,.34],top);skirt(b,[0,hip-.14,.30],.24,.29,.23,top);}}
  if(visor){box(b,[0,head,.13],[.28,.10,.075],'#17232b');tube(b,[-.13,head,.02],[.13,head,.02],.025,'#24313b');for(const x of [-.09,0,.09])sphere(b,[x,head+.15,0],[.017,.019,.017],'#67c4c7');}
  const g=new THREE.Group();b.mesh(peopleMaterial,g,facilitator?'Facilitator':'Participant');return g;
 }
 function textile(b,x,z,sx,sz,colour,turn=0,fur=false,y=.025){
  const g=new THREE.PlaneGeometry(sx,sz,10,10),a=g.attributes.position;
  for(let i=0;i<a.count;i++){const u=a.getX(i),v=a.getY(i);a.setZ(i,.008*Math.sin(u*19+v*12));}g.computeVertexNormals();
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,turn));b.add(g,V(x,y,z),V(1,1,1),colour,q);
  if(fur)for(let j=0;j<85;j++){const px=Math.sin(j*2.399)*Math.sqrt(j/85)*sx*.47,pz=Math.cos(j*2.399)*Math.sqrt(j/85)*sz*.47;sphere(b,[x+px,y+.023,z+pz],[.06,.027,.045],j%3?'#f1e8d8':'#ded3c1');}
 }
 function cushion(b,x,z,colour,r=.38,y=.10){sphere(b,[x,y,z],[r,y,r*.85],colour);}
 function beanbag(b,x,z,colour,turn){sphere(b,[x,.17,z],[.50,.19,.47],colour);sphere(b,[x-Math.sin(turn)*.25,.31,z-Math.cos(turn)*.25],[.39,.29,.30],colour);}
 const arrangements={
  steam:[[-1.7,.2,'chair'],[-1.4,1.2,'low'],[-.5,1.85,'floor'],[.55,1.9,'bean'],[1.65,1.1,'chair'],[1.85,-.1,'chair'],[1.25,-1.35,'low'],[-.15,-1.8,'stand'],[-1.5,-1.25,'chair']],
  mantra:[[-1.9,-.7,'chair'],[-1.7,.65,'low'],[-.95,1.65,'bean'],[.25,1.9,'floor'],[1.45,1.3,'chair'],[1.9,.05,'low'],[.7,-1.25,'floor'],[-.45,-1.5,'bean'],[-.65,.5,'floor']],
  sound:[[-1.9,-.3,'chair'],[-1.6,1.1,'bean'],[-.4,1.95,'floor'],[.85,1.75,'low'],[1.9,.55,'chair'],[1.75,-.6,'bean'],[-.6,-1.15,'stand'],[-.25,.55,'floor'],[.7,.55,'low']],
  comedy:[[-1.9,-.65,'chair'],[-1.85,.7,'low'],[-.9,1.5,'bean'],[.1,1.85,'floor'],[1.3,1.5,'chair'],[1.9,.25,'bean'],[1.55,-.9,'low'],[.6,.6,'floor'],[-.65,.4,'floor']],
  sexed:[[-1.85,-.55,'chair'],[-1.8,.8,'low'],[-.8,1.65,'bean'],[.35,1.8,'floor'],[1.55,1.2,'chair'],[1.8,-.15,'bean'],[.8,-1.35,'low'],[-.3,-1.5,'floor'],[-.45,.4,'floor']],
  atelier:[[-1.6,-.2,'chair'],[-1.6,1,'low'],[-.5,1.8,'bean'],[.6,1.7,'floor'],[1.8,1.1,'chair'],[1.8,-.1,'stand'],[.8,-1.25,'stand'],[-.45,-1.45,'chair'],[-1.85,-1.4,'stand']],
  emdr:[[-1.75,.12,'chair'],[-1.38,1.42,'floor'],[.40,-1.04,'daybed'],[1.77,.27,'chair'],[.84,1.78,'floor'],[-.38,1.85,'floor'],[-1.55,-1.27,'chair'],[-.35,.34,'floor'],[1.83,-1.27,'chair']]
 };
 function makeInterior(config,index){
  const group=new THREE.Group(),seats=new Batch(),actors=new Batch(),equipment=new Batch(),roster=[];
  const intimate=['sexed','atelier'].includes(config.id),layout=arrangements[config.id];
  layout.forEach(([x,z,pose],i)=>{
   const angle=Math.atan2(-x,.1-z)+(i%3-1)*.12;
   const female=intimate?i<8:i%2===0,dress=female&&(intimate||i%3===0),longHair=female&&(intimate||i%3!==1);
   if(pose==='chair'||pose==='low'){const seat=furnishings.chair({low:pose==='low'});if(config.id==='emdr')seat.scale.y=.77;seat.position.set(x,0,z);seat.rotation.y=angle;seats.object(seat);if(i%3===0&&config.id!=='emdr')textile(seats,x,z,.45,.55,'#eee2d2',angle,true,pose==='low'?.35:.48);}
   if(pose==='bean')beanbag(seats,x,z,['#bb86aa','#d1b276','#9ab4ab'][i%3],angle);
   if(pose==='floor'){textile(seats,x,z,.95,1.05,i%2?'#d6a3a7':'#a2b9b1',angle,i%2===0);cushion(seats,x,z,'#e8d6b8',.33,.07);}
   if(pose==='hanging'){const seat=furnishings.hangingSeat();seat.position.set(x,0,z);seat.rotation.y=angle;seats.object(seat);}
   if(config.id==='emdr'&&pose==='daybed')sphere(seats,[x,.568,z],[.32,.051,.27],'#d1beaa');
   if(pose==='daybed'){const seat=furnishings.daybed();seat.position.set(x,0,z);seat.rotation.y=angle;seats.object(seat);}
   if(config.id!=='emdr'){const actor=person({pose,index:i+index*3,female,dress:config.id==='emdr'?false:dress,longHair,visor:config.id==='emdr'&&i<6});actor.position.set(x,0,z);actor.rotation.y=angle;actors.object(actor);}
   roster.push({pose,female,dress,longHair,hair:hairs[(i+index*3)%hairs.length],heldDevice:false});
  });
  const leaderPosition=config.id==='comedy'?[0,0,-.95]:config.id==='sound'?[.7,0,-1.45]:config.id==='atelier'?[.55,0,-.84]:config.id==='steam'?[.3,0,-1.35]:[.35,0,-.6];
  const leader=person({pose:'stand',index:index+3,female:true,longHair:true,dress:config.id==='sexed'||config.id==='atelier',facilitator:true});leader.position.set(...leaderPosition);leader.rotation.y=config.id==='atelier'?-1.2:.1;actors.object(leader);
  // Small textile islands leave the coloured grass visible between relaxed groups.
  textile(seats,-.4,.35,1.25,.85,'#b29e8e',.17,false);cushion(seats,1,-.2,'#d9a6b7',.25,.09);
  let table='none';
  if(config.id==='steam'){
   table='shared making table';circle(equipment,[0,.73,0],1.06,.065,'#d1c0a4');for(const x of [-.6,.6])for(const z of [-.5,.5])tube(equipment,[x,.03,z],[x,.73,z],.025,'#717c75');
   circle(equipment,[0,.82,0],.19,.12,'#728b94');tube(equipment,[0,.88,0],[.12,1.34,0],.07,'#e5ded0');sphere(equipment,[.12,1.34,0],[.12,.12,.12],'#253e47');tube(equipment,[.12,1.34,0],[.55,1.20,.05],.065,'#e5ded0');sphere(equipment,[.55,1.20,.05],[.09,.09,.09],'#253e47');tube(equipment,[.55,1.2,.05],[.61,1.01,.08],.04,'#d4d5ca');
   for(const [x,z] of [[-.65,0],[.45,.55],[.3,-.55]]){box(equipment,[x,.79,z],[.42,.035,.29],'#253b42');box(equipment,[x,.81,z],[.37,.01,.24],'#68b8c8');}
   equipment.add(new THREE.IcosahedronGeometry(.16),V(-.32,.96,.55),V(1,1,1),'#d6b74d');box(equipment,[-.6,.92,-.48],[.24,.24,.24],'#d59ba3');
  }
  if(config.id==='sound'){
   table='modular synthesizer console';box(equipment,[-.5,.8,-1.65],[1.5,.10,.48],'#8f795e');
   for(const x of [-1.13,.13])tube(equipment,[x,.02,-1.65],[x,.8,-1.65],.025,'#515a59');
   box(equipment,[-.5,1.12,-1.81],[1.48,.58,.15],'#324249');
   for(let col=0;col<7;col++){const x=-1.11+col*.205;box(equipment,[x,1.12,-1.722],[.19,.53,.014],col%3?'#d4d3c4':'#526166');for(let row=0;row<4;row++)sphere(equipment,[x,1.31-row*.11,-1.697],[.026,.026,.023],row%2?'#293c40':'#c888a4');}
   for(let i=0;i<6;i++){
    const x=-1.05+i*.18,end=-.86+((i+3)%7)*.20,c=clothes[i];
    const curve=new THREE.CatmullRomCurve3([V(x,1.15,-1.68),V(x+.1,.93,-1.48),V(end,1.02,-1.48),V(end,1.28,-1.68)]);equipment.add(new THREE.TubeGeometry(curve,14,.011,5,false),V(0,0,0),V(1,1,1),c);
   }
   for(let k=0;k<18;k++)box(equipment,[-1.18+k*.077,.87,-1.55],[.063,.025,.24],k%3?'#efe9db':'#243137');
   for(const x of [1.35,2.12]){box(equipment,[x,.88,-1.8],[.69,1.55,.45],'#293037');for(const y of [.48,1.02])equipment.add(new THREE.CylinderGeometry(.22,.22,.04,24),V(x,y,-1.55),V(1,1,1),'#131f25',new THREE.Quaternion().setFromAxisAngle(V(1,0,0),Math.PI/2));equipment.add(new THREE.ConeGeometry(.28,.38,24,1,true),V(x,1.88,-1.75),V(1,1,1),'#dac7a3',new THREE.Quaternion().setFromAxisAngle(V(1,0,0),Math.PI/2));}
  }
  if(config.id==='mantra'){
   // A small recording station at the edge, leaving the group centre open.
   box(equipment,[-1.5,.72,-1.55],[.85,.06,.50],'#c8b596');for(const x of [-1.8,-1.2])tube(equipment,[x,.03,-1.55],[x,.72,-1.55],.023,'#697b75');box(equipment,[-1.5,.79,-1.55],[.65,.08,.35],'#35434a');for(let j=0;j<8;j++)box(equipment,[-1.77+j*.076,.84,-1.55],[.055,.02,.18],j%3?'#eee6d5':'#bf7e99');
   table='side recording station';
  }
  if(config.id==='mantra'||config.id==='comedy'){
   const x=config.id==='comedy'?-.2:.6,z=config.id==='comedy'?-.45:-.25;tube(equipment,[x,0,z],[x,1.36,z],.014,'#34434a');tube(equipment,[x,1.36,z],[x+.14,1.4,z+.08],.027,'#26373c');circle(equipment,[x,.025,z],.15,.05,'#354049');
  }
  if(config.id==='atelier'){
   table='rectangular fashion workbench';box(equipment,[0,.73,.05],[1.75,.07,.85],'#d5c5ac');for(const x of [-.72,.72])for(const z of [-.28,.38])tube(equipment,[x,.04,z],[x,.73,z],.025,'#64716c');
   box(equipment,[-.43,.84,0],[.42,.15,.27],'#eee4d0');box(equipment,[-.30,.98,0],[.15,.22,.19],'#eee4d0');box(equipment,[-.43,.79,.22],[.55,.015,.30],'#b482a5');
   textile(equipment,.4,.05,.65,.7,'#8babb1',.12,false,.78);for(let i=0;i<3;i++)circle(equipment,[.52+i*.13,.84,-.20],.035,.12,clothes[i]);tube(equipment,[.1,.80,.22],[.5,.80,.22],.01,'#c5ae53');
   for(const [x,z,c] of [[-1.6,-1.8,'#e9d7ba'],[1.65,-1.25,'#b487ad']]){
    tube(equipment,[x,.05,z],[x,1.55,z],.022,'#70695f');for(const dx of [-.22,.22])tube(equipment,[x,.12,z],[x+dx,.03,z+.14],.018,'#70695f');
    const form=new Batch();torso(form,1.02,c,true);skirt(form,[0,.79,0],.17,.38,.52,c);sphere(form,[0,1.53,0],[.06,.06,.06],c);const model=new THREE.Group();form.mesh(peopleMaterial,model,'Dress form');model.position.set(x,0,z);equipment.object(model);
    for(let j=0;j<9;j++)tube(equipment,[x+Math.sin(j*2.4)*.17,1.03,z+Math.cos(j*2.4)*.17],[x+Math.sin(j*2.4)*.37,.54,z+Math.cos(j*2.4)*.37],.012,'#f2e5d2');
   }
   for(const x of [-.85,.85])tube(equipment,[x,.03,-2.05],[x,1.85,-2.05],.018,'#777b72');tube(equipment,[-.85,1.85,-2.05],[.85,1.85,-2.05],.018,'#777b72');
   for(let i=0;i<5;i++){const x=-.64+i*.32,c=clothes[i+1];tube(equipment,[x-.12,1.65,-2.05],[x,1.76,-2.05],.009,'#ddd4bf');tube(equipment,[x,1.76,-2.05],[x+.12,1.65,-2.05],.009,'#ddd4bf');box(equipment,[x,1.46,-2.05],[.23,.36,.07],c);skirt(equipment,[x,1.05,-2.05],.11,.19,.5,c);}
  }
  seats.mesh(chairMaterial,group,'Mixed Tropicália seating, beanbags, cushions and textiles');const fallback=config.id==='emdr'?null:actors.mesh(peopleMaterial,group,'Relaxed workshop participants and facilitator');equipment.mesh(peopleMaterial,group,'Activity-specific workshop equipment');
  group.userData={participants:9,facilitators:1,heldPhones:0,table,roster,modularSynthesizer:config.id==='sound',dressForms:config.id==='atelier'?2:0};if(config.id==='emdr'){group.userData.roster=layout.map((row,i)=>({look:String(i+1).padStart(2,'0'),pose:row[2],heldDevice:false}));const people=createEMDRPeople(THREE,group,layout,kit.requestFrame);group.userData.characterStudy=people.group.userData;group.userData.startCharacters=people.start;group.userData.animateCharacters=people.update;}else{
    const looks={chair:['01','04','07','09'],low:['01','04','07','09'],stand:['A','B','D3'],floor:['02','05','06','08'],bean:['02','05','06','08']};
    const counts={chair:0,floor:0,stand:0};
    const visitors=[...layout,[leaderPosition[0],leaderPosition[2],'stand']].map(([x,z,pose],i)=>{
      const kind=pose==='low'?'chair':pose==='bean'?'floor':pose;
      const options=looks[pose],choice=(counts[kind]+index)%options.length;
      counts[kind]++;
      const yaw=i===9?leader.rotation.y:Math.atan2(-x,.1-z)+(i%3-1)*.12;
      return {look:options[choice],x,z,y:({chair:.105,low:.005,bean:.13}[pose]??0),yaw,
        scale:.97+.014*((i+index)%5),period:(i===9?3.3:4.3)+.12*((i+index)%6),phase:((i+index*3)*.382)%1};
    });
    const cast=createVisitorGroup(THREE,'workshops',visitors,kit.requestFrame,()=>{fallback.visible=false;});
    group.add(cast.group);group.userData.startCharacters=cast.start;group.userData.animateCharacters=cast.update;
  }return group;
 }
 return {makeInterior};
}
