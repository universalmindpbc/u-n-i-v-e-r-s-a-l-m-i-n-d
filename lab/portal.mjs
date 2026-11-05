import {solids,portalZones,portalPlacement,placedVertices} from './portal-geometry.mjs?v=20261104emdr1';
import {createFurnishings} from './furnishings.mjs';
import {createPortalInteriors} from './portal-interiors.mjs?v=20261105activity3';

/** Seven small workshop marquees. Undistorted polyhedral envelopes meet the grass plane.
 * Ground intersections are concept studies, not foundation or fabrication details.
 */
export function createPortal(THREE, requestFrame){
 const root=new THREE.Group();root.name='I Am Portal';root.position.set(portalPlacement.x,0,portalPlacement.z);
 const furnishings=createFurnishings(THREE),V=(x,y,z)=>new THREE.Vector3(x,y,z),zones=[];
 const white=new THREE.MeshStandardMaterial({color:'#f5f4e8',roughness:.54,metalness:.16});
 const clear=new THREE.MeshStandardMaterial({color:'#d8e9e4',transparent:true,opacity:.075,roughness:.3,metalness:.02,side:THREE.DoubleSide,depthWrite:false});
 const peopleMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82});
 const chairMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65,metalness:.16});
 let seed=241;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 class Batch{
  constructor(){this.positions=[];this.normals=[];this.colours=[];}
  add(geometry,position,scale,colour,quaternion){
   let g=geometry.index?geometry.toNonIndexed():geometry.clone();const transform=new THREE.Matrix4().compose(position,quaternion||new THREE.Quaternion(),scale||V(1,1,1));g.applyMatrix4(transform);
   const p=g.getAttribute('position'),n=g.getAttribute('normal'),old=g.getAttribute('color'),c=new THREE.Color(colour||'#ffffff');
   for(let i=0;i<p.count;i++){this.positions.push(p.getX(i),p.getY(i),p.getZ(i));this.normals.push(n.getX(i),n.getY(i),n.getZ(i));this.colours.push(c.r*(old?old.getX(i):1),c.g*(old?old.getY(i):1),c.b*(old?old.getZ(i):1));}g.dispose();
  }
  object(object){object.updateMatrixWorld(true);object.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);this.add(g,V(0,0,0),V(1,1,1),o.material.color);g.dispose();});}
  mesh(material,parent,name){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.normals,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.colours,3));const m=new THREE.Mesh(g,material);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 }
 const cube=new THREE.BoxGeometry(1,1,1),ball=new THREE.SphereGeometry(1,10,7),rod=new THREE.CylinderGeometry(1,1,1,7),disc=new THREE.CylinderGeometry(1,1,1,32);
 function box(b,p,s,c,q){b.add(cube,V(...p),V(...s),c,q);}
 function sphere(b,p,s,c){b.add(ball,V(...p),V(...s),c);}
 function tube(b,a,end,r,c){const start=V(...a),finish=V(...end),delta=finish.clone().sub(start);b.add(rod,start.add(finish).multiplyScalar(.5),V(r,delta.length(),r),c,new THREE.Quaternion().setFromUnitVectors(V(0,1,0),delta.normalize()));}
 function circle(b,p,r,h,c){b.add(disc,V(...p),V(r,h,r),c);}
 const interiors=createPortalInteriors(THREE,{Batch,V,box,sphere,tube,circle,peopleMaterial,chairMaterial,furnishings,requestFrame});
 function sign(text,parent,z){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=176;const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f2e4';ctx.fillRect(0,0,1024,176);ctx.fillStyle='#283b37';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 51px Arial';ctx.fillText(text,512,88);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(2.9,.49,.055),new THREE.MeshStandardMaterial({map:texture,roughness:.86}));mesh.position.set(0,.49,z);mesh.name=text;parent.add(mesh);
  const b=new Batch();for(const x of [-1.28,1.28])box(b,[x,.25,z],[.035,.5,.035],'#eee8da');b.mesh(peopleMaterial,parent,'Sign supports');
 }
 // The supplied flower, including its overlapping filled petals; applied directly to grass.
 const grassCanvas=document.createElement('canvas');grassCanvas.width=grassCanvas.height=1024;const gx=grassCanvas.getContext('2d');
 const flowerMap=new THREE.CanvasTexture(grassCanvas);flowerMap.colorSpace=THREE.SRGBColorSpace;flowerMap.anisotropy=4;
 const flowerImage=new Image();flowerImage.onload=()=>{
  gx.drawImage(flowerImage,0,0,1024,1024);gx.globalCompositeOperation='source-atop';for(let i=0;i<95000;i++){gx.fillStyle=i%2?'rgba(60,91,40,.13)':'rgba(244,239,182,.15)';gx.fillRect(random()*1024,random()*1024,.65,1.2+random()*3);}gx.globalCompositeOperation='source-over';flowerMap.needsUpdate=true;
 };flowerImage.src=new URL('./assets/universal-mind-flower.png',import.meta.url).href;
 const flower=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshBasicMaterial({map:flowerMap,transparent:true,opacity:.84,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1}));flower.name='Universal Mind flower in coloured grass';flower.rotation.x=-Math.PI/2;flower.position.y=.018;root.add(flower);
 for(const config of portalZones){
  const zone=new THREE.Group();zone.name=config.title;zone.position.set(config.position[0],.055,config.position[1]);root.add(zone);
  const solid=solids[config.shape];
  // A rotation and ONE radius preserve the regular geometry, without aspect fitting.
  const vertices=placedVertices(config).map(v=>V(...v));
  const frame=new THREE.InstancedMesh(new THREE.CylinderGeometry(.022,.022,1,7),white,solid.edges.length),dummy=new THREE.Object3D();
  solid.edges.forEach(([a,b],i)=>{const delta=vertices[b].clone().sub(vertices[a]);dummy.position.copy(vertices[a]).add(vertices[b]).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(V(0,1,0),delta.clone().normalize());dummy.scale.set(1,delta.length(),1);dummy.updateMatrix();frame.setMatrixAt(i,dummy.matrix);});frame.name=config.shape+' regular frame';frame.castShadow=true;zone.add(frame);
  const position=[];for(const face of solid.faces){const center=face.reduce((sum,i)=>sum.add(vertices[i]),V(0,0,0)).multiplyScalar(1/face.length);
   // Open front and lower panels for entry and air. Frame vertices remain unchanged.
   if(center.y<1.25||center.z>config.radius*.35)continue;
   for(let i=1;i<face.length-1;i++)position.push(...vertices[face[0]].toArray(),...vertices[face[i]].toArray(),...vertices[face[i+1]].toArray());
  }
  const panelGeometry=new THREE.BufferGeometry();panelGeometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));panelGeometry.computeVertexNormals();const panels=new THREE.Mesh(panelGeometry,clear);panels.name='Transparent upper panels';zone.add(panels);
  const interior=interiors.makeInterior(config,zones.length);zone.add(interior);
  sign(config.label,zone,3.5);
  const light=new THREE.PointLight(config.colour,0,11,2);light.position.set(0,2.6,0);zone.add(light);
  zone.userData={zone:config.id,shape:config.shape,participants:9,facilitators:1,capacity:10,regular:true,uniformScale:config.radius,groundIntersection:Math.min(...vertices.map(v=>v.y))<-.01};zones.push({group:zone,interior,light,config,closeCast:interior.getObjectByName('EMDR character fidelity study')});
 }
 const roomBounds=new THREE.Sphere(new THREE.Vector3(),4.8);
 return {group:root,zones,stats:{zones:7,participants:63,facilitators:7,capacity:70},
  setStory(state){root.visible=state.seconds>=24;zones.forEach(({group,interior},i)=>{group.visible=state.seconds>=24+i*.8;interior.visible=state.programme>0;});},
  setNight(value){zones.forEach(({light})=>light.intensity=Number(value)*22);flower.material.color.set('#ffffff');flower.material.opacity=.84+Number(value)*.12;},
  update(time,moving,camera,frustum){
    if(!root.visible)return false;
    let changed=false;
    for(const {group,interior,config,closeCast} of zones){
      if(!group.visible||!interior.visible)continue;
      interior.getWorldPosition(roomBounds.center);roomBounds.center.y+=1;
      const nearby=camera.position.distanceToSquared(roomBounds.center)<(config.id==='emdr'?38**2:65**2);
      const show=nearby&&frustum.intersectsSphere(roomBounds);
      // Skinned meshes need room-level culling because their bounds move with the rig.
      if(closeCast)closeCast.visible=show;
      if(!show)continue;
      interior.userData.startCharacters();
      if(interior.userData.animateCharacters(time,moving))changed=true;
    }
    return changed;
  },
  camera(id){const zone=zones.find(z=>z.config.id===id);if(!zone)return {pos:[root.position.x+23,19,root.position.z+29],target:[root.position.x,1.9,root.position.z]};const x=root.position.x+zone.group.position.x,z=root.position.z+zone.group.position.z;return {pos:[x+.8,2.8,z+8.5],target:[x,1.25,z]};}
 };
}
