import {characterClip} from './character-motion.mjs?v=20261105movement1';
import {GLTFLoader} from './vendor/GLTFLoader.js';

// One model per person. Small batches keep texture decoding off the critical path.
const loader = new GLTFLoader();
const waiting = [];
let active = 0;
function pump() {
  while (active < 2 && waiting.length) {
    const {url, resolve, reject} = waiting.shift();
    active++;
    loader.loadAsync(url).then(resolve, reject).finally(() => { active--; pump(); });
  }
}
// Refresh every previously cached form of the adjusted jersey, including the baked cast.
const refitted=new Set(['05','09','D1','D2','D3','crowd','walkers','workshops']);
export function loadCastMember(id) {
  const url = new URL('./assets/festival/' + encodeURIComponent(id) + '.glb', import.meta.url).href;
  const versioned=refitted.has(id)?url+'?v=20261105activity2':url;
  return new Promise((resolve, reject) => { waiting.push({url:versioned, resolve, reject}); pump(); });
}

// Positions in metres on the pavilion deck, riverbank, food lawn and Portal approach.
const guests = [
  ['river-arena','main',2.1,.08,-3.65,-.72],
  ['D1','main',3.35,.08,-4.75,-1.15],
  ['D2','main',-3.3,.08,-5.55,.74],
  ['C','main',-2.45,.08,-4.65,.95],
  ['B','river',28.9,-.12,13.25,.45],
  ['A','river',28.05,-.12,14.48,1.35],
  ['D3','river',27.05,-.12,14.15,.87],
  ['navy-working','food',-17.8,-.12,-3.85,1.25],
  ['army-field','food',-18.75,-.12,-3.15,.85],
  ['air-service','support',-30.15,-.12,-17.72,.56],
  ['army-service','support',-29.1,-.12,-18.12,-.55],
  ['aircrew','portal',-32.9,.055,53.3,.42],
  ['navy-whites','portal',-31.86,.055,53.04,-.40]
];

function attachServiceKit(THREE, model, id) {
  const army=id.startsWith('army-'), peaked=id==='navy-whites'||id==='air-service', flight=id==='aircrew';
  if (!(army||peaked||flight)) return;
  const bone=model.getObjectByName(flight?'LeftHand':'Head');
  if (!bone) return;
  // Model-space dimensions and orientation are retained while parenting to the rig.
  model.updateMatrixWorld(true);
  const kit=new THREE.Group();
  bone.getWorldPosition(kit.position);
  if(flight)kit.position.x+=.066;
  else kit.position.y-=.030;
  function part(shape, colour, y, z, scale) {
    const m=new THREE.Mesh(shape,new THREE.MeshStandardMaterial({color:colour,roughness:.74}));
    m.scale.set(...scale);m.position.set(0,y,z);kit.add(m);return m;
  }
  if (flight) {
    kit.name='Carried flight helmet';
    part(new THREE.SphereGeometry(1,20,14),'#8a9292',.064,.07,[.108,.124,.126]);
    part(new THREE.SphereGeometry(1,20,12),'#252e34',.079,.143,[.100,.064,.057]);
    part(new THREE.SphereGeometry(1,12,8),'#575f59',.026,.164,[.037,.034,.044]);
  } else {
    kit.name=army?'Brim-down slouch hat':'Peaked service cap';
    const cap=army?'#81795d':id==='navy-whites'?'#edece4':'#323e50';
    part(new THREE.CylinderGeometry(.82,1,1,32),cap,.159,0,[.105,.083,.121]);
    part(new THREE.CylinderGeometry(1,1,1,32),army?'#beb091':'#242829',.133,0,[.107,.023,.124]);
    if (army) {
      const brim=new THREE.LatheGeometry([new THREE.Vector2(.091,.132),new THREE.Vector2(.141,.123),new THREE.Vector2(.177,.099),new THREE.Vector2(.177,.094),new THREE.Vector2(.091,.127)],36);
      part(brim,cap,0,0,[1,1,1.08]);
    } else part(new THREE.SphereGeometry(1,20,8),'#272a2b',.118,.102,[.097,.012,.083]);
  }
  model.add(kit);bone.attach(kit);
}

export function createFestivalCast(THREE, requestFrame) {
  const group=new THREE.Group();group.name='Festival lookbook guests';
  const roster=guests.map(([id,area,x,y,z,yaw],index)=>{
    const anchor=new THREE.Group();
    anchor.name=id;anchor.position.set(x,y,z);anchor.rotation.y=yaw;group.add(anchor);
    const bounds=new THREE.Sphere(new THREE.Vector3(x,y+1,z),1.45);
    return {id,area,anchor,index,bounds,status:'waiting',phase:index*.47,mixer:null,time:null};
  });
  group.visible=false;
  async function load(guest) {
    guest.status='loading';
    try {
      const asset=await loadCastMember(guest.id);

      for (const child of asset.scene.children) child.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;});

      guest.mixer=new THREE.AnimationMixer(asset.scene);
      for (const clip of asset.animations)guest.mixer.clipAction(characterClip(THREE,clip,guest.area==='main'?'dance':'talk',guest.index)).play();
      guest.mixer.setTime(guest.phase);
      attachServiceKit(THREE,asset.scene,guest.id);guest.anchor.add(asset.scene);
      guest.status='ready';
    } catch (error) {
      guest.status='error';console.error('Festival look '+guest.id,error);
    }
    requestFrame();
  }
  let programme=0;
  return {group,
    setStory(state){programme=state.programme;group.visible=programme>0;},
    update(camera,time,moving,frustum){
      if (!group.visible) return false;
      let changed=false;
      for (const guest of roster) {
        const distance=guest.anchor.position.distanceToSquared(camera.position);
        const visible=programme>guest.index*.028 && distance<60*60 && frustum.intersectsSphere(guest.bounds);
        guest.anchor.visible=visible;
        if (!visible) continue;
        if (guest.status==='waiting'&&distance<50*50)load(guest);
        const stamp=Math.floor(time*(distance<28*28?24:12));
        if (guest.mixer&&moving&&guest.time!==stamp) {
          guest.mixer.setTime(time+guest.phase);guest.time=stamp;changed=true;
        }
      }
      return changed;
    }
  };
}

// The distance cast uses four baked poses per outfit. Each outfit takes a single
// draw call for all its visitors while individual phases keep the dance varied.
export function createDistanceCast(THREE, people, fallback, parent, requestFrame) {
  const batches=[], group=new THREE.Group();group.name='Lookbook crowd';parent.add(group);
  let status='waiting', progress=0, previous=-1;
  const transform=new THREE.Object3D(), proxy={morphTargetInfluences:[0,0,0]};
  async function load() {
    status='loading';
    try {
      const asset=await loadCastMember('crowd');
      const looks=asset.scene.children;
      const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88,side:THREE.DoubleSide});
      looks.forEach((look,k)=>{
        const guests=people.filter(p=>(p.index*7+Math.floor(p.index/8)*3)%looks.length===k);
        if(!guests.length)return;
        const g=look.geometry;g.computeVertexNormals();
        const mesh=new THREE.InstancedMesh(g,material,guests.length);
        mesh.name='Festival crowd '+look.userData.look;
        const members=guests.map((p,i)=>{
          transform.position.set(p.x,p.floorY??(p.index<56?.085:-.08),p.z);
          transform.rotation.y=p.yaw;transform.scale.set(p.scale*(.95+.016*(p.index%6)),p.scale,p.scale);
          transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
          // Allocate for every slot before the story starts revealing visitors.
          mesh.setMorphAt(i,proxy);
          return {person:p,matrix:transform.matrix.clone(),bounds:new THREE.Sphere(new THREE.Vector3(p.x,1,p.z),1.4)};
        });
        mesh.computeBoundingSphere();mesh.count=0;mesh.receiveShadow=true;group.add(mesh);batches.push({mesh,members,slots:[]});
      });
      status='ready';fallback.visible=false;requestFrame();
    } catch(error) {status='error';console.error('Loading lookbook crowd',error);}
  }
  return {
    setProgramme(value) {progress=value;if(value>0&&status==='waiting')load();},
    update(time,moving,frustum) {
      if(status!=='ready')return;
      const tick=moving?Math.floor(time*16):Math.max(0,previous);
      for(const {mesh,members,slots} of batches){
        const limit=Math.floor(progress*members.length);
        let count=0,matricesChanged=false,posesChanged=false;
        for(let i=0;i<limit;i++){
          const member=members[i];
          if(!frustum.intersectsSphere(member.bounds))continue;
          const moved=slots[count]!==member;
          if(moved){slots[count]=member;mesh.setMatrixAt(count,member.matrix);matricesChanged=true;}
          if(moved||tick!==previous){
            const p=member.person,rate=(p.index<56?2.7:1.05)+.065*(p.index%5);
            const cycle=(tick/16*rate+p.phase)%4,base=Math.floor(cycle),fraction=cycle-base;
            const weights=proxy.morphTargetInfluences;weights.fill(0);
            if(base)weights[base-1]=1-fraction;
            if(base<3)weights[base]=fraction;
            mesh.setMorphAt(count,proxy);posesChanged=true;
          }
          count++;
        }
        mesh.count=count;mesh.visible=count>0;
        if(matricesChanged)mesh.instanceMatrix.needsUpdate=true;
        if(posesChanged)mesh.morphTexture.needsUpdate=true;
      }
      previous=tick;
    }
  };
}
