import {geodesicFrame} from './geodesic-frame.mjs';
// Roof projections, main-stage lasers and perimeter moving heads.
export function createLightShow(THREE,scene,architectureGroups,architecture){
  const uniforms={labTime:{value:0},labNight:{value:0},labResponse:{value:.7}};
  const materialCopies=new Map();
  for(const group of architectureGroups)group.traverse(object=>{
    if(!object.isMesh)return;
    const project=source=>{
      if(materialCopies.has(source))return materialCopies.get(source);
      const material=source.clone();material.clippingPlanes=source.clippingPlanes;materialCopies.set(source,material);
      material.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,uniforms);
        shader.vertexShader='varying vec3 labPosition;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
          vec4 labWorld = vec4(transformed,1.0);
          #ifdef USE_INSTANCING
            labWorld = instanceMatrix * labWorld;
          #endif
          labPosition = (modelMatrix * labWorld).xyz;`);
        shader.fragmentShader='varying vec3 labPosition; uniform float labTime; uniform float labNight; uniform float labResponse;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
          vec2 q = labPosition.xz * 0.34;
          float bands = pow(0.5+0.5*sin(q.x+sin(q.y*1.6)+labTime*0.25),3.0);
          float petals = pow(0.5+0.5*cos(length(q)*3.0+atan(q.y,q.x)*6.0-labTime*0.2),5.0);
          vec3 lightColour = 0.52+0.48*cos(vec3(0.0,2.1,4.2)+q.x*0.36+q.y*0.2+labTime*0.08+labResponse*2.0);
          totalEmissiveRadiance += labNight*(0.55+labResponse*.65)*lightColour*(0.16+0.48*bands+0.7*petals);`);
      };
      material.customProgramCacheKey=()=> 'lab-roof-projection-v1';
      return material;
    };
    object.material=Array.isArray(object.material)?object.material.map(project):project(object.material);
  });
  const show=new THREE.Group();show.name='Geodesic hologram and projection towers';scene.add(show);
  const hologram=new THREE.Group();show.add(hologram);hologram.position.set(0,.08,-12);
  const material=new THREE.LineBasicMaterial({color:'#78efe2',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
  const frame=new THREE.LineSegments(geodesicFrame(THREE,10.2,2),material);hologram.add(frame);
  const bases=[],heights=[];
  const vertices=frame.geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),z=vertices.getZ(i)*.8;
    const base=architecture.roofHeight(x,z)+.36;
    bases.push(base);heights.push(vertices.getY(i)*.66);vertices.setXYZ(i,x,base+heights[i],z);
  }
  frame.geometry.computeBoundingSphere();
  document.body.dataset.hologramAnchor='roof-surface';document.body.dataset.hologramDiameter='20.4';
  const towers=[
    [-15,-27,0,-12,'#b9a6ff'],[16,-27,0,-12,'#78dff6'],[-33,1,-24,-9,'#ffc58d'],
    [-35,29,-23,20,'#9ca8ff'],[-43,-30,-34,-23,'#efa4ca'],
    [28,-18,19,-10,'#aaa5ff'],[30,19,19,11,'#73dded'],[26,45,12,35,'#a2c6fa'],
    [-7,58,-9,40,'#e3b7ed'],[-45,78,-32,62,'#8fdaef']
  ];
  const rigMat=new THREE.MeshStandardMaterial({color:'#435052',metalness:.65,roughness:.41});
  const poles=new THREE.InstancedMesh(new THREE.CylinderGeometry(.085,.16,12,8),rigMat,towers.length);
  const heads=new THREE.InstancedMesh(new THREE.BoxGeometry(.70,.46,.86),rigMat,towers.length);
  show.add(poles,heads);
  const lamp=new THREE.Object3D(), aim=new THREE.Vector3(), direction=new THREE.Vector3();
  const up=new THREE.Vector3(0,1,0),origin=new THREE.Vector3();
  function beamBatch(count,width,name){
    // Instance colour and a tip-to-tail fade give the shafts depth in haze.
    const geo=new THREE.CylinderGeometry(width,.016,1,12,1,true);geo.translate(0,.5,0);
    const mat=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      uniforms:{power:{value:0}},
      vertexShader:'varying vec3 tint; varying float reach; void main(){tint=instanceColor;reach=uv.y;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',
      fragmentShader:'uniform float power; varying vec3 tint; varying float reach; void main(){float fade=1.-smoothstep(.04,1.,reach);gl_FragColor=vec4(tint,power*fade);}'
    });
    const mesh=new THREE.InstancedMesh(geo,mat,count);mesh.name=name;mesh.frustumCulled=false;show.add(mesh);return mesh;
  }
  const sweeps=beamBatch(towers.length,2.05,'Perimeter moving beams');
  const interior=beamBatch(9,.052,'Main arena interior lasers');
  const roof=beamBatch(9,.12,'Dome rooftop festival lasers');
  const beamPose=new THREE.Object3D();
  function pointBeam(mesh,i,start,delta){
    const len=delta.length();
    beamPose.position.copy(start);beamPose.quaternion.setFromUnitVectors(up,delta.divideScalar(len));
    beamPose.scale.set(1,len,1);beamPose.updateMatrix();mesh.setMatrixAt(i,beamPose.matrix);
  }
  const spots=[];
  for(const [i,[x,z,tx,tz,colour]] of towers.entries()){
    lamp.position.set(x,6,z);lamp.updateMatrix();poles.setMatrixAt(i,lamp.matrix);
    sweeps.setColorAt(i,new THREE.Color(colour));
    // Keep the original five dynamic spotlights. The remaining perimeter heads
    // share instanced volumetric beams, limiting the cost of the wider rig.
    if(i<5){
      const light=new THREE.SpotLight(colour,0,60,.48,.75,1);
      light.position.set(x,12,z);light.target.position.set(tx,3,tz);show.add(light,light.target);spots.push(light);
    }
  }
  for(const rig of [interior,roof])for(let i=0;i<rig.count;i++)rig.setColorAt(i,new THREE.Color().setHSL(i/rig.count,.98,.57));
  let amount=-1,lastTime=-1;
  function aimRigs(t){
    for(const [i,[x,z,tx,tz]] of towers.entries()){
      const phase=i*1.37, azimuth=Math.atan2(tx-x,tz-z)+.51*Math.sin(.32*t+phase);
      origin.set(x,12,z);
      direction.set(24*Math.sin(azimuth),-9.5+2.2*Math.sin(.26*t+phase),24*Math.cos(azimuth));
      aim.copy(origin).add(direction);if(spots[i])spots[i].target.position.copy(aim);
      lamp.position.copy(origin);lamp.lookAt(aim);lamp.updateMatrix();heads.setMatrixAt(i,lamp.matrix);
      pointBeam(sweeps,i,origin,direction);
    }
    for(let i=0;i<interior.count;i++){
      const ray=i/(interior.count-1)-.5;
      // The rear truss projects above the crowd, under the main canopy towards its open entrance.
      origin.set(0,3.75,-19);
      direction.set(ray*12+1.15*Math.sin(t*.31),-.65+.48*Math.cos(t*.31+ray),17.5);
      pointBeam(interior,i,origin,direction);
      // A second projector at the dome crown covers the public lawns and the path to the Portal.
      origin.set(0,architecture.roofHeight(0,0)+.44,-12);
      direction.set(-9+ray*46+4*Math.sin(t*.24),4+1.8*Math.sin(t*.29+ray),49);
      pointBeam(roof,i,origin,direction);
    }
    for(const rig of [heads,sweeps,interior,roof])rig.instanceMatrix.needsUpdate=true;
  }
  function setLaserPower(){
    const power=Math.max(0,amount)*(.55+.45*uniforms.labResponse.value);
    interior.material.uniforms.power.value=power*.88;
    roof.material.uniforms.power.value=power*.82;
  }
  aimRigs(0);
  return {
    setResponse(value){uniforms.labResponse.value=value;setLaserPower();},
    set(value,ready){
      show.visible=ready;if(amount===value)return;
      amount=value;hologram.visible=interior.visible=roof.visible=sweeps.visible=value>0;
      for(let i=0;i<vertices.count;i++)vertices.setY(i,bases[i]+heights[i]*value);
      vertices.needsUpdate=true;material.opacity=value*.63;uniforms.labNight.value=value;
      sweeps.material.uniforms.power.value=value*.16;
      setLaserPower();
      spots.forEach((spot,i)=>spot.intensity=Math.max(0,Math.min(1,(value-i*.11)/.35))*26);
    },
    update(time,rigTime){
      uniforms.labTime.value=time;
      if(amount<=0||!show.visible)return;
      material.color.setHSL(.48+Math.sin(time*.07)*.06,.66,.68);
      // A steady frame under reduced motion, with the same spectrum at night.
      if(rigTime!==lastTime){aimRigs(rigTime);lastTime=rigTime;}
    }
  };
}
