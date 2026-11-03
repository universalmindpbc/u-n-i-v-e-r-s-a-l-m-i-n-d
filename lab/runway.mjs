/** Metric runway and video-totem study. The scene controller owns media playback. */
export function createRunway(THREE,scene,videoTexture) {
  const group=new THREE.Group();group.name='Fashion runway and video sculpture walk';
  scene.add(group);group.position.y=.03;
  const deckMaterial=new THREE.MeshStandardMaterial({color:'#e4dfd3',roughness:.76,metalness:.05});
  const edgeMaterial=new THREE.MeshStandardMaterial({color:'#a89c80',roughness:.42,metalness:.6});
  const frameMaterial=new THREE.MeshStandardMaterial({color:'#252b2c',roughness:.32,metalness:.7});
  const screenMaterial=new THREE.MeshBasicMaterial({map:videoTexture||null,color:videoTexture?'#ffffff':'#263b3c',toneMapped:false});
  const lineMaterial=new THREE.MeshStandardMaterial({color:'#e3e9d9',emissive:'#bacfc2',emissiveIntensity:.18,roughness:.4});
  function mesh(geometry,material,parent=group){
    const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function box(w,h,d,material,parent,x,y,z){
    const m=mesh(new THREE.BoxGeometry(w,h,d),material,parent);m.position.set(x,y,z);return m;
  }
  // Four-and-a-half centimetre visual deck, aligned with the existing central route.
  const deck=box(3.8,.045,30,deckMaterial,group,0,.0225,23);deck.name='Clear central fashion runway';deck.castShadow=false;
  for(const side of [-1,1]){
    box(.018,.014,30,edgeMaterial,group,side*1.892,.052,23).castShadow=false;
    box(.025,.008,29.7,lineMaterial,group,side*1.84,.05,23).castShadow=false;
  }
  // Crop UVs on these panels only. The shared video texture remains untouched.
  const screenGeometry=new THREE.PlaneGeometry(1.3,2.6);
  const sourceAspect=(videoTexture?.image?.videoWidth&&videoTexture?.image?.videoHeight)
    ?videoTexture.image.videoWidth/videoTexture.image.videoHeight:16/9;
  const panelAspect=1.3/2.6,uv=screenGeometry.getAttribute('uv');
  const cropX=Math.min(1,panelAspect/sourceAspect),cropY=Math.min(1,sourceAspect/panelAspect);
  for(let i=0;i<uv.count;i++)uv.setXY(i,.5+(uv.getX(i)-.5)*cropX,.5+(uv.getY(i)-.5)*cropY);
  uv.needsUpdate=true;
  const frameGeometry=new THREE.BoxGeometry(1.42,2.78,.14);
  const baseGeometry=new THREE.BoxGeometry(1.64,.08,.48);
  for(const side of [-1,1])for(const z of [12,23,34]){
    const totem=new THREE.Group();totem.name='Inward-facing runway video totem';totem.position.set(side*4.8,0,z);
    totem.rotation.y=side<0?Math.PI/2:-Math.PI/2;group.add(totem);
    const frame=mesh(frameGeometry,frameMaterial,totem);frame.position.y=1.48;
    const screen=mesh(screenGeometry,screenMaterial,totem);screen.name='Shared performance feed';screen.position.set(0,1.48,.076);screen.castShadow=false;screen.receiveShadow=false;
    const base=mesh(baseGeometry,frameMaterial,totem);base.position.y=.04;
    box(.22,.14,.16,frameMaterial,totem,0,.12,0);
    box(1.18,.012,.018,lineMaterial,totem,0,.122,.082);
    totem.userData={role:'runway-video',faces:'central path',sharedVideo:true};
  }
  // A single continuous loop has a gently twisted plane and a restrained spectral finish.
  const points=[];
  for(let i=0;i<16;i++){
    const a=i/16*Math.PI*2;
    points.push(new THREE.Vector3(.67*Math.sin(a)*(1+.14*Math.cos(a)),1.68+1.57*Math.cos(a),.34*Math.sin(a*2)));
  }
  const loopGeometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,true,'centripetal'),112,.048,8,true);
  const positions=loopGeometry.getAttribute('position'),colours=[],tint=new THREE.Color();
  for(let i=0;i<positions.count;i++){
    const t=THREE.MathUtils.clamp(positions.getY(i)/3.3,0,1);
    tint.setHSL(.74-.67*t,.5,.66);colours.push(tint.r,tint.g,tint.b);
  }
  loopGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
  const loopMaterial=new THREE.MeshPhysicalMaterial({vertexColors:true,metalness:.7,roughness:.25,clearcoat:.45,clearcoatRoughness:.18});
  const plinthGeometry=new THREE.CylinderGeometry(.38,.43,.08,32);
  for(const side of [-1,1])for(const [index,z] of [17.5,28.5].entries()){
    const sculpture=new THREE.Group();sculpture.name='Curving spectral metal sculpture';sculpture.position.set(side*5.8,0,z);
    sculpture.rotation.y=side*(index?-.65:.45);group.add(sculpture);
    const loop=mesh(loopGeometry,loopMaterial,sculpture);loop.scale.setScalar(index?.88:1);loop.position.y=.03;
    const plinth=mesh(plinthGeometry,edgeMaterial,sculpture);plinth.position.y=.04;
  }
  group.userData={role:'runway',clearWidth:3.8,length:30,zStart:8,zEnd:38,screenCount:6,sculptureCount:4,sharedVideo:true};
  return {group,setVisible(visible){group.visible=Boolean(visible);}};
}
