// A visual projection study. All patterns fade smoothly; no strobe sequence.
export function createLightShow(THREE,scene,architectureGroups){
  const uniforms={labTime:{value:0},labNight:{value:0}};
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
        shader.fragmentShader='varying vec3 labPosition; uniform float labTime; uniform float labNight;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
          vec2 q = labPosition.xz * 0.34;
          float bands = pow(0.5+0.5*sin(q.x+sin(q.y*1.6)+labTime*0.25),3.0);
          float petals = pow(0.5+0.5*cos(length(q)*3.0+atan(q.y,q.x)*6.0-labTime*0.2),5.0);
          vec3 lightColour = 0.52+0.48*cos(vec3(0.0,2.1,4.2)+q.x*0.36+q.y*0.2+labTime*0.08);
          totalEmissiveRadiance += labNight*lightColour*(0.16+0.48*bands+0.7*petals);`);
      };
      material.customProgramCacheKey=()=> 'lab-roof-projection-v1';
      return material;
    };
    object.material=Array.isArray(object.material)?object.material.map(project):project(object.material);
  });
  const show=new THREE.Group();show.name='Geodesic hologram and projection towers';scene.add(show);
  const hologram=new THREE.Group();show.add(hologram);hologram.position.set(0,8.5,-12);
  const edgeSource=new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(12,2),1),a=edgeSource.attributes.position,lines=[];
  for(let i=0;i<a.count;i+=2){const p=new THREE.Vector3().fromBufferAttribute(a,i),q=new THREE.Vector3().fromBufferAttribute(a,i+1);if(p.y<0&&q.y<0)continue;if(p.y<0)p.lerp(q,-p.y/(q.y-p.y));if(q.y<0)q.lerp(p,-q.y/(p.y-q.y));lines.push(p.x,p.y,p.z,q.x,q.y,q.z);}
  const material=new THREE.LineBasicMaterial({color:'#78efe2',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
  const frame=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(lines,3)),material);hologram.add(frame);edgeSource.dispose();
  const ringMaterial=new THREE.MeshBasicMaterial({color:'#b1a0ff',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(12,.035,6,100),ringMaterial);ring.rotation.x=Math.PI/2;hologram.add(ring);
  const towerMat=new THREE.MeshStandardMaterial({color:'#465a58',metalness:.75,roughness:.45}),towers=new THREE.Group();show.add(towers);const lights=[];
  for(const [x,z,tx,tz,colour] of [[-15,-27,0,-12,'#cab1ff'],[16,-27,0,-12,'#7be1f4'],[-33,1,-24,-9,'#ffbd82'],[-35,29,-23,20,'#a5b4ff'],[-43,-30,-34,-23,'#f3a5d6']]){
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.075,.16,12,8),towerMat);pole.position.set(x,6,z);towers.add(pole);
    const head=new THREE.Mesh(new THREE.BoxGeometry(.7,.35,.8),towerMat);head.position.set(x,12,z);head.lookAt(tx,4,tz);towers.add(head);
    const light=new THREE.SpotLight(colour,0,60,.7,.8,1);light.position.set(x,12,z);light.target.position.set(tx,3,tz);show.add(light,light.target);lights.push(light);
  }
  let amount=0;
  return {set(value,ready){amount=value;show.visible=ready;hologram.visible=value>0;hologram.position.y=5.8+value*2.7;material.opacity=value*.63;ringMaterial.opacity=value*.32;uniforms.labNight.value=value;lights.forEach((light,i)=>light.intensity=Math.max(0,Math.min(1,(value-i*.11)/.35))*26);},update(time){uniforms.labTime.value=time;if(amount>0)material.color.setHSL(.48+Math.sin(time*.07)*.06,.66,.68);}};
}
