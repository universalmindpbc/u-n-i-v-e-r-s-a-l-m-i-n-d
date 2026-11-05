import {geodesicFrame} from './geodesic-frame.mjs';
export function createVipEffects(THREE,venue,materials,djX,djZ){
  const {node,box,cylinder}=venue;
  const {ink,chrome,carpet}=materials;
  const uv=new THREE.MeshStandardMaterial({color:'#393155',emissive:'#a071ff',emissiveIntensity:0});
  const flash=new THREE.MeshBasicMaterial({color:'#555555'});
  const rigZ=djZ-.42;
  for(const x of [djX-.85,djX+.85]){
    cylinder(chrome,x,1.43,rigZ,.025,.041,2.54);
    box(ink,x,2.57,rigZ,.69,.16,.15);
    box(uv,x,2.57,rigZ+.08,.61,.05,.02);
  }
  box(ink,djX,2.57,rigZ,.55,.19,.17);
  box(flash,djX,2.57,rigZ+.09,.46,.11,.025);
  box(ink,djX-1.29,.32,djZ+.6,.36,.24,.44);
  cylinder(chrome,djX-1.29,.46,djZ+.67,.064,.082,.05);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
  const ctx=canvas.getContext('2d');
  // A soft texture with several overlapping lobes breaks up the edges of each puff.
  for(const [x,y,r] of [[43,46,39],[52,50,33],[34,54,26],[53,38,23]]){
    const grad=ctx.createRadialGradient(x,y,0,x,y,r);
    grad.addColorStop(0,'rgba(255,255,255,.45)');grad.addColorStop(.55,'rgba(255,255,255,.21)');grad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,96,96);
  }
  const map=new THREE.CanvasTexture(canvas);
  const puffs=Array.from({length:8},(_,i)=>{
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,color:'#e6ddf3',transparent:true,depthWrite:false}));
    sprite.name='VIP haze';sprite.material.rotation=i*.86;node.add(sprite);return sprite;
  });
  const dome=new THREE.LineSegments(geodesicFrame(THREE,3.72,1),new THREE.LineBasicMaterial({
    color:'#d2c2ff',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending
  }));
  dome.name='VIP geodome hologram';
  dome.position.set(-.94,2.85,0);dome.scale.y=.72;node.add(dome);
  // The smoke rises into the projection above head height, leaving the guest silhouettes clear.
  const mist=Array.from({length:6},(_,i)=>{
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,color:'#cfc0f7',transparent:true,depthWrite:false}));
    sprite.name='VIP projection haze';sprite.material.rotation=i*.81;node.add(sprite);return sprite;
  });
  const fill=new THREE.PointLight('#e4d3ff',0,9,2);
  fill.position.set(-1,4.45,.75);node.add(fill);
  const poolGeo=new THREE.PlaneGeometry(1,1);poolGeo.rotateX(-Math.PI/2);
  function pool(name,color,w,h){
    const mat=new THREE.MeshBasicMaterial({map,color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    const mesh=new THREE.Mesh(poolGeo,mat);mesh.name=name;mesh.scale.set(w,1,h);mesh.position.set(djX,.193,djZ+1.75);node.add(mesh);
    return mat;
  }
  const purple=pool('VIP ultraviolet wash','#aa67ff',3.4,3.1),white=pool('VIP local strobe','#ffffff',2.4,1.8);
  let darkness=0;
  function setNight(amount){
    darkness=amount;dome.visible=amount>.015;dome.material.opacity=amount*.85;fill.intensity=amount*22;uv.emissiveIntensity=amount*1.35;
    purple.opacity=amount*.43;carpet.emissive.setHex(0x615079);carpet.emissiveIntensity=amount*.065;
  }
  function update(time,moving){
    for(const [i,puff] of puffs.entries()){
      const age=(time*.19+i/puffs.length)%1, spread=1+2.3*age;
      puff.position.set(djX-1.29+age*1.65+.18*Math.sin(i+age*5),.47+.76*age,djZ+.67+1.03*age);
      puff.scale.set(.44*spread,.32*spread,1);
      puff.material.opacity=(.12+.16*darkness)*Math.sin(age*Math.PI)**1.4;
    }
    for(const [i,puff] of mist.entries()){
      const age=(time*.10+i/mist.length)%1,theta=i*2.4+age*.45;
      puff.position.set(djX+.4+age*1.4+Math.cos(theta)*age*2,.9+age*3.9,djZ+1+Math.sin(theta)*age*2.3);
      puff.scale.set(1.2+3.2*age,1+2.8*age,1);
      puff.material.opacity=.23*darkness*Math.sin(age*Math.PI);
    }
    // One local flash every two seconds. Reduced motion holds the UV wash alone.
    const beat=time%2, pulse=moving?Math.max(0,1-Math.abs(beat-.18)/.16)*darkness:0;
    white.opacity=pulse*.48;flash.color.setScalar(.15+.85*pulse);
  }
  setNight(0);update(0,false);
  return {setNight,update};
}
