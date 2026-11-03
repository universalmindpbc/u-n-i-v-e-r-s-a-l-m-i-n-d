/** Reference-based Tropicália studies for the Lab concept. Dimensions are provisional metres. */
export function createFurnishings(THREE) {
  const colours=['#d83275','#f187a6','#f5d324','#e86836','#30a5ae','#7daf42','#7540a2','#e7e0ce','#217660'];
  const metal=new THREE.MeshStandardMaterial({color:'#a7afad',metalness:.75,roughness:.31});
  const fibre=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:.02});
  const textile=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.98});
  const timber=new THREE.MeshStandardMaterial({color:'#aa8f6b',roughness:.87});
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const mix=(a,b,t)=>a.clone().lerp(b,t);
  class Batch {
    constructor(){this.p=[];this.n=[];this.c=[];}
    add(geometry,colour='#ffffff',matrix=null){
      const g=geometry.index?geometry.toNonIndexed():geometry;
      const pos=g.attributes.position,norm=g.attributes.normal,c=new THREE.Color(colour),normalMatrix=matrix?new THREE.Matrix3().getNormalMatrix(matrix):null;
      const v=new THREE.Vector3(),n=new THREE.Vector3();
      for(let i=0;i<pos.count;i++){
        v.fromBufferAttribute(pos,i);if(matrix)v.applyMatrix4(matrix);this.p.push(v.x,v.y,v.z);
        n.fromBufferAttribute(norm,i);if(normalMatrix)n.applyMatrix3(normalMatrix).normalize();this.n.push(n.x,n.y,n.z);this.c.push(c.r,c.g,c.b);
      }
      if(g!==geometry)g.dispose();geometry.dispose();
    }
    tube(points,radius,colour='#ffffff',smooth=false){
      const curve=smooth?new THREE.CatmullRomCurve3(points,false,'centripetal'):new THREE.CurvePath();
      if(!smooth)for(let i=1;i<points.length;i++)curve.add(new THREE.LineCurve3(points[i-1],points[i]));
      this.add(new THREE.TubeGeometry(curve,smooth?Math.max(16,points.length*7):Math.max(1,points.length-1),radius,5,false),colour);
    }
    geometry(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.computeBoundingSphere();return g;}
    mesh(material,parent){const m=new THREE.Mesh(this.geometry(),material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  }
  function shapeBatch(batch,geometry,position,scale,colour,rotation=null){
    const o=new THREE.Object3D();o.position.copy(position);o.scale.copy(scale);if(rotation)o.rotation.set(...rotation);o.updateMatrix();batch.add(geometry,colour,o.matrix);
  }
  function cushion(batch,x,y,z,sx,sy,sz,colour,rotation=null){
    const geometry=new THREE.SphereGeometry(1,16,10);
    if(rotation){
      const positions=geometry.attributes.position;
      for(let i=0;i<positions.count;i++)for(let j=0;j<3;j++){
        const v=positions.array[i*3+j];positions.array[i*3+j]=Math.sign(v)*Math.pow(Math.abs(v),.53);
      }
      geometry.computeVertexNormals();
    }
    shapeBatch(batch,geometry,V(x,y,z),V(sx,sy,sz),colour,rotation);
  }
  function makeChair(low=false){
    const g=new THREE.Group();g.name=low?'Tropicália low-chair reference study':'Tropicália armchair reference study';
    const frame=new Batch(),weave=new Batch();
    const seat=low?.33:.46,h=low?.88:1.03,w=low?.42:.36,front=low?.42:.34,rear=-.32;
    const a=V(-w,seat,front),b=V(w,seat,front),c=V(w*.94,seat-.015,rear),d=V(-w*.94,seat-.015,rear);
    frame.tube([a,b,c,d,a],.014);
    const bl=V(-w*.85,h,-.48),br=V(w*.85,h,-.48),ml=V(-w*1.28,seat+.23,-.36),mr=V(w*1.28,seat+.23,-.36);
    frame.tube([d,ml,bl,br,mr,c],.013);
    const al=V(-w*1.23,seat+.19,.2),ar=V(w*1.23,seat+.19,.2);
    if(!low){frame.tube([a,al,ml],.012);frame.tube([b,ar,mr],.012);}
    for(const side of [-1,1])frame.tube([V(side*w,seat,front),V(side*(w+.035),.028,front+.1),V(side*(w+.07),.028,rear-.1),V(side*w*.94,seat-.015,rear)],.012);
    for(let i=0;i<42;i++){
      const t=i/41;
      const p=mix(a,b,t),q=mix(d,c,t);p.y-=Math.sin(t*Math.PI)*.025;q.y-=Math.sin(t*Math.PI)*.02;
      weave.tube([p,q],.0048,colours[Math.floor(i/7)%colours.length]);
    }
    for(let i=0;i<31;i++){
      const t=i/30,p=mix(a,d,t),q=mix(b,c,t);p.y+=.005;q.y+=.005;
      weave.tube([p,q],.0042,colours[(Math.floor(i/5)+2)%colours.length]);
    }
    for(let i=0;i<39;i++){
      const t=i/38;
      weave.tube([mix(d,c,t),mix(bl,br,t)],.0048,colours[i<14?6:i<25?5:1]);
    }
    for(let i=0;i<31;i++){
      const t=i/30;
      const left=t<.4?mix(d,ml,t/.4):mix(ml,bl,(t-.4)/.6);
      const right=t<.4?mix(c,mr,t/.4):mix(mr,br,(t-.4)/.6);
      weave.tube([left,right],.0041,colours[Math.floor(i/6)%colours.length]);
    }
    if(!low)for(let i=0;i<18;i++){
      const t=i/17;
      weave.tube([mix(a,d,t),mix(al,ml,t)],.0048,colours[(Math.floor(i/5)+3)%colours.length]);
      weave.tube([mix(b,c,t),mix(ar,mr,t)],.0048,colours[(Math.floor(i/5)+5)%colours.length]);
    }
    frame.mesh(metal,g);weave.mesh(fibre,g);
    g.userData={assetType:'reference-based furniture',seats:1,nominalWidth:low?1.08:.93,nominalDepth:low?1.0:.93};return g;
  }
  function makeDaybed(){
    const g=new THREE.Group();g.name='Tropicália domed daybed reference study';
    const frame=new Batch(),weave=new Batch(),soft=new Batch();
    const ring=(y,r,zScale=1)=>Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2;return V(Math.cos(a)*r,y,Math.sin(a)*r*zScale);});
    frame.tube(ring(.35,1.13,.88),.022);frame.tube(ring(.09,.93,.88),.018);
    // Six-sided open-front dome, with the upper shell gently receding from the seat.
    const ribs=9,columns=[];
    for(let r=0;r<ribs;r++){
      const a=Math.PI+(r/(ribs-1))*Math.PI;
      const points=Array.from({length:19},(_,j)=>{
        const t=j/18,rad=1.1*Math.cos(t*1.29);
        return V(Math.cos(a)*rad,.35+1.52*Math.sin(t*1.29),Math.sin(a)*rad*.9-.13*t);
      });columns.push(points);frame.tube(points,.015);
    }
    for(let j=0;j<42;j++){
      const t=j/41,rad=1.1*Math.cos(t*1.29),y=.35+1.52*Math.sin(t*1.29);
      const points=Array.from({length:33},(_,i)=>{const a=Math.PI+i/32*Math.PI;return V(Math.cos(a)*rad,y,Math.sin(a)*rad*.9-.13*t);});
      weave.tube(points,.0055,colours[Math.floor(j/5)%colours.length]);
    }
    for(let i=0;i<44;i++){
      const a=i/44*Math.PI*2,p=V(Math.cos(a)*1.13,.35,Math.sin(a)*1.13*.88),q=V(Math.cos(a+.18)*.93,.09,Math.sin(a+.18)*.93*.88);
      weave.tube([p,q],.0055,colours[Math.floor(i/5)%colours.length]);
    }
    cushion(soft,0,.42,0,1.09,.105,.92,'#658b67');
    cushion(soft,-.52,.64,-.46,.37,.21,.16,'#e8d7bd',[.05,0,.12]);
    cushion(soft,.05,.64,-.58,.39,.23,.15,'#8157a4',[.1,0,-.08]);
    cushion(soft,.57,.60,-.36,.28,.17,.15,'#e8bf45',[.1,-.25,-.14]);
    frame.mesh(metal,g);weave.mesh(fibre,g);soft.mesh(textile,g);
    g.userData={assetType:'reference-based furniture',seats:2,nominalWidth:2.3,nominalDepth:2.05};return g;
  }
  function makeHanging(){
    const g=new THREE.Group();g.name='Tropicália cocoon reference study with independent frame';
    const frame=new Batch(),weave=new Batch(),soft=new Batch(),support=new Batch();
    // The dedicated frame carries the suspended seat; display pylons are independent.
    support.tube([V(-.93,.035,.62),V(-.86,2.6,0),V(0,3.02,0),V(.86,2.6,0),V(.93,.035,.62)],.035,'#ffffff',true);
    support.tube([V(-.93,.035,-.62),V(-.86,2.6,0)],.035);support.tube([V(.93,.035,-.62),V(.86,2.6,0)],.035);
    support.tube([V(0,3.02,0),V(0,2.6,0)],.014);
    const ring=(y,rx,rz,front=true)=>Array.from({length:front?49:33},(_,i)=>{
      const a=front?i/48*Math.PI*2:Math.PI+i/32*Math.PI;return V(Math.cos(a)*rx,y,Math.sin(a)*rz);
    });
    frame.tube(ring(.66,.64,.56),.018);
    const backPoint=(a,t)=>{
      const radius=.64*Math.cos(t*Math.PI/2)+.16*Math.sin(t*Math.PI),y=.66+t*1.94;
      return V(Math.cos(a)*radius,y,Math.sin(a)*radius*.85);
    };
    for(let i=0;i<9;i++){
      const a=Math.PI+i/8*Math.PI,points=Array.from({length:25},(_,j)=>backPoint(a,j/24));
      points[0]=V(Math.cos(a)*.64,.66,Math.sin(a)*.56);frame.tube(points,.012);
    }
    // Side outline reaches forward at seat level, framing a clear open entrance.
    frame.tube([V(-.64,.66,0),V(-.73,1.1,.12),V(-.62,1.64,.02),V(-.36,2.25,-.02),V(0,2.6,0)],.013,'#ffffff',true);
    frame.tube([V(.64,.66,0),V(.73,1.1,.12),V(.62,1.64,.02),V(.36,2.25,-.02),V(0,2.6,0)],.013,'#ffffff',true);
    for(let j=0;j<55;j++){
      const t=j/54,pts=Array.from({length:33},(_,i)=>backPoint(Math.PI+i/32*Math.PI,t));
      weave.tube(pts,.0049,colours[Math.floor(j/5)%colours.length]);
    }
    for(let j=0;j<28;j++){
      const t=j/27,x=(t-.5)*1.25,z=.55*Math.sqrt(Math.max(0,1-(x/.64)**2));
      weave.tube([V(x,.66,-z),V(x,.66,z)],.005,colours[Math.floor(j/5)%colours.length]);
    }
    cushion(soft,0,.72,-.015,.60,.09,.52,'#d9c5ab');
    cushion(soft,0,1.06,-.30,.37,.30,.12,'#38816e',[-.15,0,.05]);
    cushion(soft,-.37,.91,-.18,.21,.22,.11,'#d4638e',[-.1,.2,-.3]);
    support.mesh(timber,g);frame.mesh(metal,g);weave.mesh(fibre,g);soft.mesh(textile,g);
    g.userData={assetType:'reference-based furniture with concept support frame',seats:1,nominalWidth:1.94,nominalDepth:1.32};return g;
  }
  function makeTable(){
    const g=new THREE.Group();g.name='Circular workshop table';const b=new Batch();
    shapeBatch(b,new THREE.CylinderGeometry(.57,.57,.045,32),V(0,.72,0),V(1,1,1),'#c9b99a');
    shapeBatch(b,new THREE.CylinderGeometry(.075,.12,.66,12),V(0,.36,0),V(1,1,1),'#7b8579');
    shapeBatch(b,new THREE.CylinderGeometry(.34,.34,.04,24),V(0,.02,0),V(1,1,1),'#7b8579');b.mesh(fibre,g);return g;
  }
  function ground(group){
    const bounds=new THREE.Box3().setFromObject(group);
    for(const mesh of group.children)mesh.position.y-=bounds.min.y;
    group.userData.height=bounds.max.y-bounds.min.y;
    return group;
  }
  const normal=ground(makeChair()),low=ground(makeChair(true)),daybed=ground(makeDaybed()),hanging=ground(makeHanging()),table=ground(makeTable());
  return {
    chair:({low:useLow=false}={})=>(useLow?low:normal).clone(true),
    daybed:()=>daybed.clone(true),
    hangingSeat:()=>hanging.clone(true),
    table:()=>table.clone(true)
  };
}
