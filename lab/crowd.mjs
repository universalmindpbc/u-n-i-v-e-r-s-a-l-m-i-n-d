import {createDistanceCast} from './festival-cast.mjs?v=20261105movement1';
/** Deterministic, fictional people for the Universal Mind spatial concept. Metres; ground Y=0. */
export function createCrowd(THREE, requestFrame) {
  const visitors=new THREE.Group(),builders=new THREE.Group();
  visitors.name='Universal Mind visitors — articulated scene study';
  builders.name='Local construction team — articulated scene study';
  const skins=['#e7bd98','#c8926f','#a56e4c','#79503b','#53392d','#e4b5a2'];
  const shirts=['#db806d','#527e75','#bca270','#c7bcd4','#45889b','#e0d2b8','#7c6594','#657595'];
  const trousers=['#384958','#68715e','#565661','#a3997e','#615149'];
  const hairs=['#292321','#49362b','#77604a','#aa8c60','#c6b4a0','#1b1e21'];
  const glowColours=['#82d9c3','#e0a1c8','#d6cf8f','#85b9df'];
  let seed=1357911;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const pick=a=>a[Math.floor(rand()*a.length)];
  const cloth=new THREE.MeshStandardMaterial({roughness:.91,metalness:0});
  const bandMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',emissive:'#ffffff',emissiveIntensity:0,roughness:.6});
  const geometry={
    body:new THREE.CylinderGeometry(1,.76,1,10,1),
    limb:new THREE.CylinderGeometry(.88,1,1,8,1),
    sphere:new THREE.SphereGeometry(1,10,8),
    hair:new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI*.63),
    box:new THREE.BoxGeometry(1,1,1),
    band:new THREE.TorusGeometry(.043,.013,4,10)
  };
  const scratch=new THREE.Object3D(),direction=new THREE.Vector3(),mid=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),color=new THREE.Color();
  const yToRing=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
  function mesh(group,type,count,material=cloth){
    const m=new THREE.InstancedMesh(geometry[type],material,count);m.name=`Crowd ${type}`;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.castShadow=type!=='band';m.receiveShadow=true;
    // The spatial groups are small; per-frame bounds recomputation is unnecessary.
    m.frustumCulled=false;group.add(m);return m;
  }
  function palette(m,index,hex){m.setColorAt(index,color.set(hex));}
  function matrix(m,index,p,sx,sy,sz,rotation=null){
    scratch.position.copy(p);scratch.scale.set(sx,sy,sz);scratch.quaternion.identity();
    if(rotation)scratch.quaternion.copy(rotation);scratch.updateMatrix();m.setMatrixAt(index,scratch.matrix);
  }
  function bone(m,index,a,b,radius,depth=radius){
    direction.subVectors(b,a);const length=direction.length();mid.copy(a).add(b).multiplyScalar(.5);
    scratch.quaternion.setFromUnitVectors(up,direction.multiplyScalar(1/Math.max(length,.0001)));
    scratch.position.copy(mid);scratch.scale.set(radius,length,depth);scratch.updateMatrix();m.setMatrixAt(index,scratch.matrix);
  }
  const names=['hip','waist','neck','head','nose','hair','ls','le','lw','rs','re','rw','lh','lk','la','rh','rk','ra','lf','rf'];
  function person(x,z,role,index){
    const p={x,z,role,index,scale:(1.6+rand()*.3)/1.8,phase:rand()*Math.PI*2,yaw:(rand()-.5)*.5,skin:pick(skins),shirt:pick(shirts),pants:pick(trousers),hair:pick(hairs),hairSize:.96+rand()*.12,action:index%3,joints:Object.fromEntries(names.map(n=>[n,new THREE.Vector3()])),rotation:new THREE.Quaternion(),bodyRotation:new THREE.Quaternion()};
    if(role==='visitor')p.yaw=index<56?Math.atan2(-x,-18.4-z)+(rand()-.5)*.12:rand()*Math.PI*2;
    return p;
  }
  const visitorPeople=[];
  // Loose groups leave space around the lounges and between the stage and lawn.
  while(visitorPeople.length<56){
    const x=(rand()-.5)*12.2,z=-16+rand()*9.6;
    if(visitorPeople.some(p=>(p.x-x)**2+(p.z-z)**2<.78**2))continue;
    const p=person(x,z,'visitor',visitorPeople.length);
    p.yaw+=(rand()-.5)*(p.index%4===0?3.7:1.25);
    visitorPeople.push(p);
  }
  const lounge=[[-23,-6],[-21,-5],[-26,-8],[-23,-11],[21,10],[24,8],[25,12],[22,13],[-12,7],[-10,9],[7,8],[9,10],[-17,16],[-20,17]];
  lounge.forEach(([x,z],i)=>visitorPeople.push(person(x,z,'visitor',56+i)));
  // Small groups face each other, a display or the runway. The clear deck is
  // reserved for the models and the road-train loading side stays open.
  const gatherings=[
    [-43,20,2.5,'truck'],[-43.8,30,1.7,'truck'],[-42.6,33,2.1,'truck'],
    [-17,-7,-1.2,'food'],[-18.2,-8.3,.7,'food'],[-27,-4.7,2.5,'food'],
    [-28.3,-5.3,1.1,'food'],[-29.8,17.5,1.4,'play'],[-29.6,16,.85,'play'],
    [-24.2,21,-2.6,'play'],[-23,20.4,-2.4,'play'],[-12.8,30.7,-1.7,'playground'],
    [-13.1,32,-2,'playground'],[-19.8,27.5,.6,'playground'],[-20.9,28.2,.4,'playground'],
    [26.1,13.4,-2.5,'river'],[26.7,12.4,-1.8,'river'],[-32,-20.7,-2.8,'support'],
    [-30.9,-20.8,-1.5,'support'],[-32.7,-26,.7,'support'],
    [-3.4,12.8,1.45,'fashion'],[-3.5,14,1.6,'fashion'],[3.7,19.5,-1.5,'fashion'],
    [3.6,20.8,-1.5,'fashion'],[-3.5,25,1.4,'fashion'],[-3.6,26.1,1.6,'fashion'],
    [3.4,32.2,-1.4,'fashion'],[3.7,33.4,-1.65,'fashion'],
    [-30.4,54.1,-1.5,'portal'],[-29.4,53.5,-.9,'portal'],[-32.7,55,.1,'portal']
  ];
  for(const [x,z,yaw,area] of gatherings){
    const visitor=person(x,z,'visitor',visitorPeople.length);visitor.yaw=yaw;visitor.area=area;
    visitorPeople.push(visitor);
  }
  const workSites=[[-7,-9],[7,-9],[-6,-15],[6,-15],[0,-6],[-28,-7],[-21,-9],[-26,19],[-20,22],[-31,-20],[21,8],[25,13]];
  const builderPeople=workSites.map(([x,z],i)=>person(x,z,'builder',i));
  function createBatch(group,people,isBuilder){
    const n=people.length,b={people,group,isBuilder,
      torso:mesh(group,'body',n*2),limbs:mesh(group,'limb',n*9),skin:mesh(group,'sphere',n*4),hair:mesh(group,'hair',n),shoes:mesh(group,'box',n*2),bands:mesh(group,'band',n,bandMaterial)};
    if(isBuilder){b.helmets=mesh(group,'hair',n);b.tools=mesh(group,'box',n*2);}
    people.forEach((p,i)=>{
      palette(b.torso,i*2,p.shirt);palette(b.torso,i*2+1,p.pants);
      for(let j=0;j<9;j++)palette(b.limbs,i*9+j,j<4?p.pants:j===8?p.skin:j%2===0?p.shirt:p.skin);
      for(let j=0;j<4;j++)palette(b.skin,i*4+j,p.skin);
      palette(b.hair,i,p.hair);palette(b.bands,i,pick(glowColours));
      palette(b.shoes,i*2,'#34383a');palette(b.shoes,i*2+1,'#34383a');
      if(isBuilder){palette(b.helmets,i,i%2?'#e5b44d':'#ece9dd');palette(b.tools,i*2,p.action===0?'#c29b68':'#957754');palette(b.tools,i*2+1,p.action===0?'#c29b68':'#747b7e');}
    });
    for(const m of group.children)if(m.instanceColor)m.instanceColor.needsUpdate=true;
    return b;
  }
  const fallback=new THREE.Group();visitors.add(fallback);
  const visitorBatch=createBatch(fallback,visitorPeople,false),builderBatch=createBatch(builders,builderPeople,true);
  const lookbook=createDistanceCast(THREE,visitorPeople,fallback,visitors,requestFrame);
  for(const mesh of fallback.children)mesh.userData.fullCount=mesh.count;
  const angles=new THREE.Euler(),tmp=new THREE.Vector3(),tmp2=new THREE.Vector3(),bandRotation=new THREE.Quaternion();
  function pose(batch,time,active){
    for(const p of batch.people){
      const {joints:j,scale:s,index:i}=p,work=batch.isBuilder&&active,dance=!batch.isBuilder&&active;
      const beat=time*3.5+p.phase,walking=work&&p.action===0;
      const step=walking?Math.sin(time*2.7+p.phase):0;
      const bend=work&&p.action===1?.22+.17*(1+Math.sin(time*2.8+p.phase)):work&&p.action===2?.10+.13*(1+Math.sin(time*1.9+p.phase)):dance?.045*Math.sin(beat):0;
      const bounce=dance?.035*(1+Math.sin(beat*2)):walking?.015*Math.abs(step):0;
      const sway=dance?.065*Math.sin(beat):0;
      const travel=walking?Math.sin(time*.42+p.phase)*1.25:0;
      const yaw=p.yaw+(walking?Math.cos(time*.42+p.phase)<0?Math.PI:0:0)+(dance?.13*Math.sin(beat*.5):0);
      const cy=Math.cos(yaw),sy=Math.sin(yaw),cb=Math.cos(bend),sb=Math.sin(bend);
      p.rotation.setFromAxisAngle(up,yaw);angles.set(bend,yaw,dance?-.06*Math.sin(beat):0,'YXZ');p.bodyRotation.setFromEuler(angles);
      function point(name,x,y,z,upper=false){
        if(upper){const dy=y-.87;y=.87+dy*cb-z*sb;z=dy*sb+z*cb;x+=sway;}
        j[name].set(p.x+(x*cy+z*sy)*s,p.scale*(y+bounce),p.z+travel+(-x*sy+z*cy)*s);
      }
      point('hip',0,.88,0);point('waist',0,1.13,0,true);point('neck',0,1.35,0,true);
      point('head',0,1.63,0,true);point('nose',0,1.62,.115,true);point('hair',0,1.68,-.012,true);
      point('ls',-.205,1.38,0,true);point('rs',.205,1.38,0,true);
      const arm=work&&p.action===1?Math.sin(time*5+p.phase):dance?Math.sin(beat+p.phase):0;
      for(const side of [-1,1]){
        const armSide=side===-1?'l':'r';
        let elbowX=side*.25,elbowY=1.10,elbowZ=.015,wristX=side*.27,wristY=.87,wristZ=.035;
        if(walking){elbowX=side*.24;elbowY=1.12;elbowZ=.23;wristX=side*.24;wristY=1.06;wristZ=.44;}
        else if(work&&p.action===1){elbowX=side*.24;elbowY=side>0?1.18+arm*.12:1.04;elbowZ=.27;wristX=side*.15;wristY=side>0?1.13+arm*.27:.82;wristZ=.52;}
        else if(work&&p.action===2){const lift=.18*(1+Math.sin(time*1.9+p.phase));elbowX=side*.25;elbowY=1.08+lift;elbowZ=.25;wristX=side*.22;wristY=1.02+lift*1.5;wristZ=.46;}
        else if(dance){elbowX=side*(.30+.035*arm);elbowY=1.18+.10*Math.sin(beat+side);elbowZ=.10;wristX=side*(.30+.09*Math.sin(beat*.7));wristY=1.22+.22*Math.sin(beat+side);wristZ=.27;}
        point(`${armSide}e`,elbowX,elbowY,elbowZ,true);point(`${armSide}w`,wristX,wristY,wristZ,true);
        const stride=step*side*.24,footLift=walking?Math.max(0,step*side)*.095:0;
        point(`${armSide}h`,side*.105,.88,0);point(`${armSide}k`,side*(.105+(dance?.025*Math.sin(beat+side):0)),.48,walking?stride*.55:0);
        point(`${armSide}a`,side*.12,.10+footLift,walking?stride:0);point(`${armSide}f`,side*.12,.055+footLift,.055+(walking?stride:0));
      }
      matrix(batch.torso,i*2,j.waist,.21*s,.46*s,.135*s,p.bodyRotation);matrix(batch.torso,i*2+1,j.hip,.17*s,.16*s,.125*s,p.rotation);
      const pairs=[['lh','lk',.085],['lk','la',.068],['rh','rk',.085],['rk','ra',.068],['ls','le',.065],['le','lw',.045],['rs','re',.065],['re','rw',.045],['neck','head',.065]];
      for(let k=0;k<pairs.length;k++){const [a,b,r]=pairs[k];bone(batch.limbs,i*9+k,j[a],j[b],r*s,r*s);}
      matrix(batch.skin,i*4,j.head,.113*s,.143*s,.108*s,p.bodyRotation);matrix(batch.skin,i*4+1,j.nose,.026*s,.034*s,.034*s,p.bodyRotation);
      matrix(batch.skin,i*4+2,j.lw,.047*s,.062*s,.038*s,p.bodyRotation);matrix(batch.skin,i*4+3,j.rw,.047*s,.062*s,.038*s,p.bodyRotation);
      matrix(batch.hair,i,j.hair,.119*s*p.hairSize,.113*s*p.hairSize,.116*s*p.hairSize,p.bodyRotation);
      matrix(batch.shoes,i*2,j.lf,.13*s,.10*s,.26*s,p.rotation);matrix(batch.shoes,i*2+1,j.rf,.13*s,.10*s,.26*s,p.rotation);
      direction.subVectors(j.lw,j.le).normalize();bandRotation.setFromUnitVectors(up,direction).multiply(yToRing);matrix(batch.bands,i,j.lw,s,s,s,bandRotation);
      if(batch.isBuilder){
        tmp.copy(j.hair);tmp.y+=.027*s;matrix(batch.helmets,i,tmp,.142*s,.125*s,.145*s,p.bodyRotation);
        if(p.action===0||p.action===2){
          mid.copy(j.lw).add(j.rw).multiplyScalar(.5);matrix(batch.tools,i*2,mid,(p.action===0?1.15:.58)*s,.08*s,.14*s,p.rotation);
          tmp.copy(mid);tmp.y-=.09*s;matrix(batch.tools,i*2+1,tmp,p.action===0?1.1*s:.57*s,.07*s,.12*s,p.rotation);
        }else{
          tmp.copy(j.rw);tmp.y+=.17*s;bone(batch.tools,i*2,j.rw,tmp,.023*s,.023*s);
          tmp2.copy(tmp);matrix(batch.tools,i*2+1,tmp2,.17*s,.065*s,.07*s,p.rotation);
        }
      }
    }
    for(const m of batch.group.children)m.instanceMatrix.needsUpdate=true;
  }
  pose(visitorBatch,0,false);pose(builderBatch,0,false);
  visitors.userData={count:visitorPeople.length,assetType:'fictional articulated visitor study'};
  builders.userData={count:12,assetType:'fictional articulated construction study'};
  let visitorsMoving=false,buildersMoving=false,lastNight=-1;
  return {builders,visitors,setProgramme(value){
    lookbook.setProgramme(value);
    for(const mesh of fallback.children)mesh.count=Math.floor(value*visitorPeople.length)*(mesh.userData.fullCount/visitorPeople.length);
  },update(time,{construction=0,dancing=false,visible=true,night=0,frustum}={}){
    if(!visible)return;
    const safeTime=Number.isFinite(time)?time:0,work=construction>0&&construction<1;
    if(visitors.visible)lookbook.update(safeTime,dancing,frustum);
    if(visitors.visible&&fallback.visible&&(dancing||visitorsMoving)){pose(visitorBatch,safeTime,!!dancing);visitorsMoving=!!dancing;}
    if(builders.visible&&(work||buildersMoving)){pose(builderBatch,safeTime,work);buildersMoving=work;}
    const nightValue=Math.max(0,Math.min(1,Number.isFinite(night)?night:0));
    if(lastNight!==nightValue){bandMaterial.emissiveIntensity=nightValue*1.3;lastNight=nightValue;}
  }};
}
