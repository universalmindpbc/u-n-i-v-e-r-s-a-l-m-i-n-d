import {GLTFLoader} from './vendor/GLTFLoader.js';

/** Textured, rigged EMDR study; the other workshop groups retain their approved style. */
export function createEMDRPeople(THREE,parent,layout){
 const group=new THREE.Group();group.name='EMDR character fidelity study';parent.add(group);
 const loader=new GLTFLoader(),mixers=[];
 let started=false,dirty=false,lastTime=null;
 const data={status:'waiting',loaded:0,total:10,errors:[],skinnedMeshes:0,animated:true,heldPhones:0,longDresses:0};
 group.userData=data;
 const matte=new THREE.MeshStandardMaterial({color:'#20292d',roughness:.58});
 const shell=new THREE.MeshStandardMaterial({color:'#d8dedb',roughness:.47,metalness:.16});
 function headset(model){
  const head=model.getObjectByName('Head');if(!head)return;
  model.updateMatrixWorld(true);
  const p=head.getWorldPosition(new THREE.Vector3()),device=new THREE.Group();device.name='Fitted Galea-style research headset';
  function part(geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);device.add(m);return m;}
  part(new THREE.BoxGeometry(.218,.089,.068),matte,0,.09,.118);
  part(new THREE.BoxGeometry(.205,.026,.063),shell,0,.148,.108);
  for(const x of [-.108,.108]){part(new THREE.SphereGeometry(.038,12,8),matte,x,.075,.012).scale.set(.43,1.2,1);part(new THREE.BoxGeometry(.012,.025,.14),matte,x,.11,.04);}
  const band=part(new THREE.TorusGeometry(.115,.009,6,28,Math.PI),shell,0,.13,0);band.rotation.y=0;
  device.position.copy(p);model.add(device);head.attach(device);
 }
 async function loadOne(i){
  try{
   const gltf=await loader.loadAsync(new URL('./assets/emdr/participant-'+String(i+1).padStart(2,'0')+'.glb',import.meta.url).href);
   const model=gltf.scene;model.name=i===9?'EMDR facilitator':'EMDR participant '+(i+1);
   model.traverse(o=>{if(o.isSkinnedMesh){data.skinnedMeshes++;o.frustumCulled=false;}if(o.isMesh){o.castShadow=false;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.map)m.map.anisotropy=4;}}});
   if(i<6)headset(model);
   const [x,z,pose]=i<9?layout[i]:[-.3,-2.1,'stand'];
   model.position.set(x,0,z);model.rotation.y=i===9?.1:Math.atan2(-x,.1-z)+(i%3-1)*.12;
   model.userData={role:i===9?'facilitator':'participant',pose,heldDevice:false,headset:i<6};group.add(model);
   const mixer=new THREE.AnimationMixer(model);gltf.animations.forEach(clip=>mixer.clipAction(clip).play());mixer.setTime(i*.63);mixers.push({mixer,phase:i*.63});
   data.loaded++;dirty=true;
  }catch(e){data.errors.push({participant:i+1,message:String(e.message||e)});dirty=true;}
 }
 async function start(){if(started)return;started=true;data.status='loading';let next=0;
  await Promise.all([0,1].map(async()=>{while(next<10)await loadOne(next++);}));data.status=data.errors.length?'error':'ready';dirty=true;
 }
 return {group,start,update(time,moving){const changed=dirty;dirty=false;if(moving){for(const {mixer,phase}of mixers)mixer.setTime(time*.65+phase);lastTime=time;return mixers.length>0;}if(lastTime===null){for(const {mixer,phase}of mixers)mixer.setTime(phase);lastTime=time;}return changed;}};
}
