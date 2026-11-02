/** Four animated performance roles for the proposed live programme. */
export function createPerformance(THREE){
 const group=new THREE.Group();group.name='Live stage — DJ, vocalist, guitar and drums';
 const material=(color,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness:metalness?.32:.76,metalness});
 const dark=material('#151c23'),chrome=material('#aab7b9',.8),skin=material('#d4a281'),hair=material('#503526'),gold=material('#cfaa56',.65),white=material('#e8e7dd'),red=material('#a74349',.3);
 const sphere=new THREE.SphereGeometry(1,14,10),boxGeo=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,12);
 const up=new THREE.Vector3(0,1,0),dir=new THREE.Vector3();
 function shape(parent,geo,mat,pos,scale){const m=new THREE.Mesh(geo,mat);m.position.fromArray(pos);m.scale.fromArray(scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const box=(p,m,pos,s)=>shape(p,boxGeo,m,pos,s),ball=(p,m,pos,s)=>shape(p,sphere,m,pos,s),tube=(p,m,pos,s)=>shape(p,cylinder,m,pos,s);
 function rod(parent,a,b,r=.025,mat=chrome){const m=tube(parent,mat,[0,0,0],[r,1,r]);const set=(a,b)=>{dir.subVectors(b,a);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=dir.length();m.quaternion.setFromUnitVectors(up,dir.normalize());};set(new THREE.Vector3(...a),new THREE.Vector3(...b));m.userData.set=(a,b)=>set(new THREE.Vector3(...a),new THREE.Vector3(...b));return m;}
 function stand(parent,x,z,h){tube(parent,dark,[x,h/2,z],[.025,h,.025]);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod(parent,[x,.15,z],[x+Math.cos(a)*.3,.02,z+Math.sin(a)*.3],.014,dark);}}
 function person(role,x,z,shirt){const g=new THREE.Group();g.name=role;g.position.set(x,.6,z);group.add(g);const cloth=material(shirt);
  const torso=box(g,cloth,[0,1.18,0],[.43,.55,.25]);ball(g,skin,[0,1.65,0],[.12,.16,.115]);ball(g,skin,[0,1.64,.12],[.025,.035,.035]);ball(g,hair,[0,1.75,-.035],[.13,.12,.13]);
  if(role==='Vocalist'||role==='Guitarist')box(g,hair,[0,1.57,-.11],[.25,.3,.08]);
  for(const side of [-1,1]){rod(g,[side*.1,.94,0],[side*.13,.12,.02],.075,dark);box(g,dark,[side*.13,.055,.065],[.15,.11,.29]);}
  const arms=[];for(const side of [-1,1]){arms.push({side,upper:rod(g,[side*.23,1.4,0],[side*.3,1.1,.12],.06,cloth),lower:rod(g,[side*.3,1.1,.12],[side*.25,.95,.2],.043,skin),hand:ball(g,skin,[side*.25,.95,.2],[.05,.06,.04])});}
  return {g,role,torso,arms,pose(time,active){const beat=active?Math.sin(time*4):0;torso.rotation.z=active?.025*Math.sin(time*2):0;
    for(const a of arms){const side=a.side;let elbow=[side*.3,1.13,.16],wrist=[side*.28,1,.35];
      if(role==='Vocalist'&&side===1){elbow=[.3,1.3,.19];wrist=[.08,1.55,.25];}else if(role==='Vocalist'){elbow=[-.34,1.18+beat*.05,.06];wrist=[-.47,1.1+beat*.12,.16];}
      if(role==='Guitarist'){elbow=side<0?[-.32,1.2,.14]:[.28,1.12,.22];wrist=side<0?[-.53,1.3,.28]:[.08,1.05+beat*.055,.32];}
      if(role==='Drummer'){elbow=[side*.3,1.2,.14];wrist=[side*.35,1.12+Math.sin(time*7+side)*.15*(active?1:0),.46];}
      a.upper.userData.set([side*.23,1.4,0],elbow);a.lower.userData.set(elbow,wrist);a.hand.position.fromArray(wrist);
    }
  }};}
 const dj=person('DJ',-5,-17.8,'#416c77'),vocal=person('Vocalist',-1.5,-17.05,'#e4d7bb'),guitar=person('Guitarist',1.9,-17.4,'#a36b82'),drummer=person('Drummer',5,-18,'#59847c');
 const performers=[dj,vocal,guitar,drummer];
 // Two decks, mixer, and an angled laptop.
 box(dj.g,dark,[0,.93,.42],[1.65,.16,.65]);for(const x of [-.55,.55]){tube(dj.g,chrome,[x,1.025,.43],[.23,.025,.23]);tube(dj.g,dark,[x,1.045,.43],[.16,.015,.16]);box(dj.g,dark,[x,.44,.42],[.065,.88,.065]);}
 for(let i=0;i<5;i++)box(dj.g,chrome,[-.13+i*.065,1.03,.4],[.02,.02,.21]);
 const laptop=box(dj.g,dark,[.46,1.2,.17],[.4,.27,.025]);laptop.rotation.x=-.18;box(dj.g,material('#89cfc9'),[.46,1.2,.188],[.35,.22,.008]);
 // Microphone, floor stand and wedges face the audience (+Z).
 stand(vocal.g,.04,.3,1.4);const mic=tube(vocal.g,dark,[.07,1.55,.26],[.035,.2,.035]);mic.rotation.x=Math.PI/2;
 const instrument=new THREE.Group();guitar.g.add(instrument);instrument.position.set(.05,1.02,.32);instrument.rotation.z=-.65;
 ball(instrument,red,[0,0,0],[.23,.28,.07]);ball(instrument,red,[0,.2,0],[.16,.18,.06]);box(instrument,material('#81694b'),[0,.49,0],[.075,.66,.045]);box(instrument,chrome,[0,.87,0],[.10,.15,.04]);
 for(let i=0;i<6;i++)rod(instrument,[-.025+i*.01,-.12,.071],[-.025+i*.01,.9,.035],.0015,chrome);
 rod(guitar.g,[-.17,1.43,0],[.25,.92,.29],.025,dark);
 // Drum shells, heads and cymbals.
 const kit=new THREE.Group();group.add(kit);kit.position.set(5,.6,-17.55);
 const kick=tube(kit,red,[0,.43,.45],[.43,.56,.43]);kick.rotation.x=Math.PI/2;
 const head=tube(kit,white,[0,.43,.74],[.41,.015,.41]);head.rotation.x=Math.PI/2;
 for(const [x,y,z,r] of [[-.35,.95,.32,.22],[.23,.98,.3,.24],[-.64,.66,.45,.26],[.66,.55,.33,.3]]){tube(kit,red,[x,y,z],[r,.28,r]);tube(kit,white,[x,y+.15,z],[r,.015,r]);}
 const cymbals=[];for(const [x,z,h] of [[-1,.25,1.25],[.9,.05,1.37],[-.8,-.45,1.42]]){stand(kit,x,z,h);const cym=tube(kit,gold,[x,h,z],[.36,.012,.36]);cymbals.push(cym);}
 const sticks=drummer.arms.map(a=>rod(drummer.g,[a.side*.35,1.12,.46],[a.side*.4,1.13,.78],.009,white));
 for(const x of [-6,-2,2,6]){const monitor=box(group,dark,[x,.83,-16.64],[.8,.45,.5]);monitor.rotation.x=-.25;}
 group.userData={roles:performers.map(p=>p.role),count:4,stageFront:1};
 performers.forEach(p=>p.pose(0,false));
 return {group,update(time,active){if(!group.visible)return;performers.forEach(p=>p.pose(time,active));sticks.forEach((s,i)=>{const a=drummer.arms[i].hand.position;s.userData.set(a.toArray(),[a.x,a.y+.02,a.z+.34]);});cymbals.forEach((c,i)=>c.rotation.z=active?.025*Math.sin(time*7+i):0);}};
}
