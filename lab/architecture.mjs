/** Reference-based architectural studies, in metres. These are original concept meshes. */
export function createArchitecture(THREE) {
  let seed=7162;
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  function canvasTexture(width,height,paint,{repeat=true,colour=false}={}) {
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    paint(canvas.getContext('2d'),width,height);
    const texture=new THREE.CanvasTexture(canvas);
    if(repeat)texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    if(colour)texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;return texture;
  }
  // One small repeating tile atlas, with staggered courses and restrained colour variation.
  const tileMap=canvasTexture(1024,1024,(ctx,w,h)=>{
    ctx.fillStyle='#947b60';ctx.fillRect(0,0,w,h);
    const columns=8,rows=16,cw=w/columns,ch=h/rows;
    for(let row=0;row<rows;row++)for(let col=-1;col<=columns;col++){
      const x=col*cw+(row%2)*cw*.5,y=row*ch,tone=Math.round(random()*19-9);
      ctx.fillStyle=`rgb(${191+tone},${155+tone},${115+tone})`;
      ctx.fillRect(x+1.5,y+1.3,cw-3,ch-2.6);
      ctx.fillStyle='rgba(245,221,185,.14)';ctx.fillRect(x+2,y+2,cw-5,1.5);
      ctx.fillStyle='rgba(67,44,25,.10)';ctx.fillRect(x+cw-3,y+3,1,ch-5);
    }
    for(let n=0;n<19000;n++){
      ctx.fillStyle=random()>.5?'rgba(254,235,201,.055)':'rgba(64,40,19,.05)';
      ctx.fillRect(random()*w,random()*h,1+random()*3,1+random()*2);
    }
  },{colour:true});
  const tileBump=canvasTexture(1024,1024,(ctx,w,h)=>{
    ctx.fillStyle='#626262';ctx.fillRect(0,0,w,h);const cw=w/8,ch=h/16;
    for(let row=0;row<16;row++)for(let col=-1;col<=8;col++){
      const tone=181+Math.round(random()*18);ctx.fillStyle=`rgb(${tone},${tone},${tone})`;
      ctx.fillRect(col*cw+(row%2)*cw*.5+1.5,row*ch+1.4,cw-3,ch-2.8);
    }
  });
  const clayMap=canvasTexture(512,512,(ctx,w,h)=>{
    ctx.fillStyle='#c7aa85';ctx.fillRect(0,0,w,h);
    for(let n=0;n<18000;n++){
      ctx.fillStyle=random()>.5?'rgba(255,234,199,.055)':'rgba(92,66,40,.045)';
      ctx.fillRect(random()*w,random()*h,1+random()*2,1+random()*2);
    }
  },{colour:true});
  const edgeMap=canvasTexture(256,256,(ctx,w,h)=>{
    ctx.fillStyle='#ae8861';ctx.fillRect(0,0,w,h);
    for(let row=0;row<4;row++){
      ctx.fillStyle=row%2?'#b9966e':'#c5a078';ctx.fillRect(0,row*h/4+2,w,h/4-4);
      ctx.fillStyle='#8d7358';ctx.fillRect(0,row*h/4,w,2);
    }
    for(let col=0;col<8;col++){
      ctx.fillStyle='rgba(102,73,45,.15)';ctx.fillRect(col*w/8,0,1,h);
    }
  },{colour:true});
  const vaultOutside=new THREE.MeshStandardMaterial({color:'#ead9bd',map:tileMap,bumpMap:tileBump,bumpScale:.018,roughness:.91});
  const vaultInside=new THREE.MeshStandardMaterial({color:'#e3cfad',map:tileMap,bumpMap:tileBump,bumpScale:.016,roughness:.95});
  const layeredEdge=new THREE.MeshStandardMaterial({color:'#e9d6b6',map:edgeMap,roughness:.94});
  const satelliteOutside=vaultOutside.clone();satelliteOutside.name='Shared earthen tile exterior';
  const satelliteInside=vaultInside.clone();satelliteInside.name='Shared earthen tile underside';

  function closedShell(surface,{uSteps=80,vSteps=64,thickness=.24,textureScale=[2.56,2.56],diagonal=false,arcTexture=false,normalThickness=false}={}) {
    const position=[],uv=[],index=[],samples=[],rowLength=uSteps+1;
    const topCount=(uSteps+1)*(vSteps+1),underside=[],arcAcross=[],arcAlong=[];
    for(let j=0;j<=vSteps;j++)for(let i=0;i<=uSteps;i++)samples.push(surface(i/uSteps,j/vSteps));
    const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
    for(let j=0;j<=vSteps;j++)for(let i=0;i<=uSteps;i++){
      const k=j*rowLength+i,p=samples[k];
      arcAcross[k]=i?arcAcross[k-1]+distance(p,samples[k-1]):0;
      arcAlong[k]=j?arcAlong[k-rowLength]+distance(p,samples[k-rowLength]):0;
      if(normalThickness){
        const left=samples[j*rowLength+Math.max(0,i-1)],right=samples[j*rowLength+Math.min(uSteps,i+1)];
        const back=samples[Math.max(0,j-1)*rowLength+i],front=samples[Math.min(vSteps,j+1)*rowLength+i];
        const du=new THREE.Vector3(right[0]-left[0],right[1]-left[1],right[2]-left[2]);
        const dv=new THREE.Vector3(front[0]-back[0],front[1]-back[1],front[2]-back[2]);
        const normal=new THREE.Vector3().crossVectors(dv,du).normalize();
        underside[k]=[p[0]-normal.x*thickness,j===0?0:Math.max(0,p[1]-normal.y*thickness),p[2]-normal.z*thickness];
      }else underside[k]=[p[0],Math.max(0,p[1]-thickness),p[2]];
    }
    for(let side=0;side<2;side++)for(let j=0;j<=vSteps;j++)for(let i=0;i<=uSteps;i++){
      const p=samples[j*rowLength+i];
      position.push(...(side?underside[j*rowLength+i]:p));
      // Arc distance keeps the masonry pattern continuous around each arch.
      const across=Math.asin(Math.max(-1,Math.min(1,(i/uSteps)*2-1)))*11.3;
      const along=Math.asin(Math.max(-1,Math.min(1,(j/vSteps)*2-1)))*9.2;
      const k=j*rowLength+i,fanAcross=arcAcross[k]-arcAcross[j*rowLength+Math.floor(uSteps/2)],fanAlong=arcAlong[k];
      const a=arcTexture?(fanAcross+fanAlong)*.70710678:diagonal?(across+along)*.70710678:p[0];
      const b=arcTexture?(fanAlong-fanAcross)*.70710678:diagonal?(along-across)*.70710678:p[2]+p[1]*.45;
      uv.push(a/textureScale[0],b/textureScale[1]);
    }
    for(let j=0;j<vSteps;j++)for(let i=0;i<uSteps;i++){
      const a=j*rowLength+i,b=a+1,c=a+rowLength,d=c+1;
      index.push(a,c,b,b,c,d);
    }
    const topIndices=index.length;
    for(let j=0;j<vSteps;j++)for(let i=0;i<uSteps;i++){
      const a=topCount+j*rowLength+i,b=a+1,c=a+rowLength,d=c+1;
      index.push(a,b,c,b,d,c);
    }
    const undersideIndices=index.length-topIndices;
    let edgeDistance=0;
    function rim(a,b){
      const pa=samples[a],pb=samples[b],k=position.length/3;
      const distance=Math.hypot(pb[0]-pa[0],pb[1]-pa[1],pb[2]-pa[2]);
      position.push(...pa,...pb,...underside[a],...underside[b]);
      uv.push(edgeDistance/2,1,(edgeDistance+distance)/2,1,edgeDistance/2,0,(edgeDistance+distance)/2,0);
      index.push(k,k+1,k+2,k+1,k+3,k+2);edgeDistance+=distance;
    }
    for(let i=0;i<uSteps;i++)rim(i,i+1);
    for(let j=0;j<vSteps;j++)rim(j*rowLength+uSteps,(j+1)*rowLength+uSteps);
    for(let i=uSteps;i>0;i--)rim(vSteps*rowLength+i,vSteps*rowLength+i-1);
    for(let j=vSteps;j>0;j--)rim(j*rowLength,(j-1)*rowLength);
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(index);
    geometry.addGroup(0,topIndices,0);geometry.addGroup(topIndices,undersideIndices,1);geometry.addGroup(topIndices+undersideIndices,index.length-topIndices-undersideIndices,2);
    geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
    return geometry;
  }
  function arch(s){
    const end=Math.sqrt(.028),centre=Math.sqrt(1.028);
    return (Math.sqrt(Math.max(.028,1.028-s*s))-end)/(centre-end);
  }
  const vaultGeometry=closedShell((u,v)=>{
    const x=u*2-1,z=v*2-1;
    return [x*11.3,.24+4.24*arch(x)+3.56*arch(z),z*9.2];
  },{uSteps:88,vSteps:72,thickness:.24,diagonal:true});
  // Continuous support, rolled outer shoulders and a shallow dished canopy.
  // The rounded leading edge is formed by the shell boundary, with no cut-out holes.
  const spine=new THREE.CubicBezierCurve3(new THREE.Vector3(0,.22,-4.22),new THREE.Vector3(0,6.6,-5.72),new THREE.Vector3(0,7.15,-.12),new THREE.Vector3(0,5.8,4.65));
  const satelliteGeometry=closedShell((u,v)=>{
    const q=u*2-1,p=spine.getPoint(v),opening=Math.sin(v*Math.PI/2),across=Math.abs(q);
    const taper=Math.sqrt(Math.max(0,1-Math.pow(v,8)));
    const halfWidth=.16+(1.24+5.45*Math.pow(opening,.92)-.65*Math.pow(v,5))*taper;
    const crown=.13*Math.sin(v*Math.PI)*(1-q*q);
    const rolledEdge=.68*Math.pow(across,2.6)*Math.pow(opening,.7)*taper;
    const returnLift=.16*Math.pow(across,10)*Math.pow(opening,1.5)*taper;
    const twist=.11*q*Math.sin(v*Math.PI);
    const frontRounding=(1.5*q*q*Math.pow(v,3)+.3*Math.pow(across,6)*Math.pow(v,5))*(1-Math.pow(v,6));
    return [q*halfWidth,p.y+crown-rolledEdge+returnLift+twist,
      p.z+.48*q*q*Math.pow(1-v,2)+.28*q*q*Math.sin(v*Math.PI)-frontRounding];
  },{uSteps:72,vSteps:72,thickness:.22,textureScale:[2.56,2.56],arcTexture:true,normalThickness:true});
  function roofHeight(x,z){
    const localX=THREE.MathUtils.clamp(x,-11.3,11.3)/11.3;
    const localZ=THREE.MathUtils.clamp(z,-9.2,9.2)/9.2;
    return Math.max(0,4.24*arch(localX)+3.56*arch(localZ));
  }

  // A separate ribbon bridge play study: two flowing landings and one open underpass.
  const playProfile=(u,v)=>{
    const q=v*2-1,arch=Math.max(0,Math.sin(Math.PI*u));
    return [11*(u-.5),.18+2.42*Math.pow(arch,.85)+.6*Math.pow(Math.abs(q),6)*Math.pow(arch,.55),
      q*(1.6+Math.sin(Math.PI*u))+1.2*Math.sin(Math.PI*2*u)];
  };
  const playGeometry=closedShell(playProfile,{uSteps:80,vSteps:24,thickness:.18,textureScale:[2,2]});
  const slidePoint=t=>{const p=playProfile(.48+.52*t,.17);p[1]+=.055;return p;};
  const slideVertices=[],slideIndices=[],slideEdges=[[],[]];
  for(let i=0;i<=48;i++){
    const t=i/48,p=slidePoint(t),a=slidePoint(Math.max(0,t-.001)),b=slidePoint(Math.min(1,t+.001));
    const angle=Math.atan2(b[2]-a[2],b[0]-a[0]),nx=-Math.sin(angle)*.48,nz=Math.cos(angle)*.48;
    for(const [j,side] of [-1,1].entries()){slideVertices.push(p[0]+side*nx,p[1],p[2]+side*nz);slideEdges[j].push(new THREE.Vector3(p[0]+side*nx,p[1]+.075,p[2]+side*nz));}
    if(i<48){const n=i*2;slideIndices.push(n,n+2,n+1,n+1,n+2,n+3);}
  }
  const slideGeometry=new THREE.BufferGeometry();slideGeometry.setAttribute('position',new THREE.Float32BufferAttribute(slideVertices,3));slideGeometry.setIndex(slideIndices);slideGeometry.computeVertexNormals();
  const rainbowColours=[],playPositions=playGeometry.getAttribute('position'),tint=new THREE.Color();
  for(let i=0;i<playPositions.count;i++){
    const t=(playPositions.getX(i)+5.5)/11;
    tint.setHSL(.77*(1-t),.72,.62);rainbowColours.push(tint.r,tint.g,tint.b);
  }
  playGeometry.setAttribute('color',new THREE.Float32BufferAttribute(rainbowColours,3));
  const silver=new THREE.MeshStandardMaterial({color:'#e2e5e3',metalness:.73,roughness:.29,bumpMap:clayMap,bumpScale:.003});
  const rainbowMetal=new THREE.MeshStandardMaterial({vertexColors:true,metalness:.58,roughness:.29,bumpMap:clayMap,bumpScale:.003});
  const playWood=new THREE.MeshStandardMaterial({color:'#8b7153',roughness:.8});
  const treadGeometry=new THREE.BoxGeometry(.21,.055,1.9);
  function dimensions(geometry,scale,thickness){
    const size=geometry.boundingBox.getSize(new THREE.Vector3());
    return {width:size.x*scale,depth:size.z*scale,height:size.y*scale,nominalShellThickness:thickness*scale};
  }
  function object(geometry,materials,name){
    const group=new THREE.Group();group.name=name;
    const shell=new THREE.Mesh(geometry,materials);shell.name=name+' shell';shell.castShadow=true;shell.receiveShadow=true;group.add(shell);
    group.userData.geometrySource='Original reference-based concept mesh';
    group.userData.engineered=false;
    return group;
  }
  return {
    roofHeight,
    slidePoint,
    mainVault(){
      const group=object(vaultGeometry,[vaultOutside,vaultInside,layeredEdge],'Droneport-derived four-contact vault');
      group.userData.dimensions={width:22.6,depth:18.4,height:8.04,nominalShellThickness:.24};
      group.userData.footContacts=[[-11.3,0,-9.2],[11.3,0,-9.2],[11.3,0,9.2],[-11.3,0,9.2]];
      return group;
    },
    satellite({scale=1}={}){
      const group=object(satelliteGeometry,[satelliteOutside,satelliteInside,layeredEdge],'Volu-informed continuous earthen canopy');group.scale.setScalar(scale);
      group.userData.dimensions=dimensions(satelliteGeometry,scale,.22);
      group.userData.shellMapping={support:'negative Z',opening:'positive Z',texture:'arc-length fan courses',nominalThickness:.22};
      return group;
    },
    playground({rainbow=true}={}){
      const group=object(playGeometry,[rainbow?rainbowMetal:silver,silver,silver],'Striatus-informed fluid play bridge');
      const treads=new THREE.InstancedMesh(treadGeometry,playWood,41),dummy=new THREE.Object3D();
      for(let i=0;i<41;i++){
        const u=(i+.5)/41,p=playProfile(u,.5),before=playProfile(Math.max(0,u-.001),.5),after=playProfile(Math.min(1,u+.001),.5);
        dummy.position.set(p[0],p[1]+.035,p[2]);dummy.rotation.set(0,-Math.atan2(after[2]-before[2],after[0]-before[0]),0);dummy.updateMatrix();
        treads.setMatrixAt(i,dummy.matrix);
      }
      treads.name='Timber route markers';treads.castShadow=true;treads.receiveShadow=true;group.add(treads);
      const slideMaterial=new THREE.MeshStandardMaterial({color:'#b8dfe0',metalness:.65,roughness:.24,side:THREE.DoubleSide});
      const slide=new THREE.Mesh(slideGeometry,slideMaterial);slide.name='Smooth sliding ribbon';slide.receiveShadow=true;group.add(slide);
      for(const edge of slideEdges){const rail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge),64,.075,8,false),slideMaterial);rail.name='Rounded slide edge';rail.castShadow=true;group.add(rail);}
      group.userData.dimensions=dimensions(playGeometry,1,.18);group.userData.engineered=false;
      group.userData.use='Visual play landscape concept; access and fall protection remain design work';
      return group;
    }
  };
}
