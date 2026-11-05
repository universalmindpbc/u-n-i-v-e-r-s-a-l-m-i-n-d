// Both spaces have their own entrance and camera destination. The consultation
// screen shields the sample bench from the approach to the pill testing booth.
export function createHealthVenues(THREE,venue,make){
  const green=make('#237661'),dark=make('#284c47'), white=make('#f6f4e8'),linen=make('#c5d2c2');
  const metal=make('#8c9b99',{metalness:.42}),vinyl=make('#4b8586'),screen=make('#344c53');
  const testing=venue('checking','Pill testing');
  testing.box(linen,0,.015,0,4.5,.09,3.45);
  testing.box(white,0,2.74,0,4.76,.12,3.7);
  testing.box(dark,0,2.52,1.76,4.76,.34,.10);
  testing.sign('Pill testing',2.35,.32,0,2.54,1.82,'#284c47','#ffffff');
  testing.box(linen,0,1.30,-1.67,4.48,2.48,.07);
  for(const x of [-2.18,2.18]){
    testing.box(linen,x,1.28,-.43,.07,2.42,2.48);
    testing.cylinder(metal,x,1.35,1.65,.045,.05,2.62);
  }
  testing.box(white,-.92,1.47,.15,2.35,2.15,.08);
  testing.box(metal,-.86,.81,-1.19,2.1,.07,.71);
  for(const x of [-1.77,.05])testing.box(dark,x,.41,-1.18,.06,.78,.52);
  testing.box(screen,-1.12,1.01,-1.17,.53,.30,.43);
  testing.box(white,-.92,1.14,-.96,.18,.10,.015);
  testing.box(white,1.19,.84,.93,1.28,.09,.63);
  for(const x of [.70,1.68])testing.box(metal,x,.43,.93,.05,.8,.51);
  testing.finish();

  const aid=venue('first-aid','First aid');
  const radius=3.3;
  aid.cylinder(linen,0,.005,0,radius,radius,.11,64);
  // Clip the triangular geodesic shell at ground level, then leave the
  // south-facing first-aid entrance open for the cot and stretcher.
  const ico=new THREE.IcosahedronGeometry(radius,2),source=ico.attributes.position,triangles=[];
  for(let i=0;i<source.count;i+=3){
    const face=Array.from({length:3},(_,j)=>new THREE.Vector3().fromBufferAttribute(source,i+j));
    const centre=face[0].clone().add(face[1]).add(face[2]).multiplyScalar(1/3);
    if(centre.z>1.40&&Math.abs(centre.x)<1.48&&centre.y<2.05)continue;
    const clipped=[];
    for(let j=0;j<3;j++){
      const a=face[j],b=face[(j+1)%3];
      if(a.y>=0)clipped.push(a);
      if((a.y<0)!==(b.y<0))clipped.push(a.clone().lerp(b,a.y/(a.y-b.y)));
    }
    for(let j=1;j<clipped.length-1;j++)for(const p of [clipped[0],clipped[j],clipped[j+1]])triangles.push(p.x,p.y,p.z);
  }
  ico.dispose();
  const shell=new THREE.BufferGeometry();shell.setAttribute('position',new THREE.Float32BufferAttribute(triangles,3));shell.computeVertexNormals();
  const roof=new THREE.Mesh(shell,make('#f3f4ec',{side:THREE.DoubleSide}));roof.name='First aid geodesic shell';aid.node.add(roof);
  const ribs=new THREE.LineSegments(new THREE.EdgesGeometry(shell,1),new THREE.LineBasicMaterial({color:'#7f9a91'}));ribs.scale.setScalar(1.003);aid.node.add(ribs);
  // Australian first-aid wayfinding uses a white cross on dark green.
  aid.box(green,0,2.50,2.08,.90,.82,.11);
  aid.box(white,0,2.50,2.15,.18,.59,.025);aid.box(white,0,2.50,2.16,.60,.18,.025);
  aid.sign('First Aid',1.86,.36,0,2.01,2.58,'#225f4e','#ffffff');
  for(const x of [-1.55,1.52]){
    aid.box(vinyl,x,.70,-.22,.70,.15,1.86);aid.box(white,x,.81,-.86,.52,.09,.36);
    for(const z of [-.96,.53])aid.box(metal,x,.37,z,.49,.54,.06);
  }
  aid.box(white,.05,1.34,-2.18,.91,.66,.31);
  aid.box(green,.05,1.34,-1.995,.21,.055,.027);aid.box(green,.05,1.34,-1.99,.055,.22,.028);
  // An event ambulance stands beside the dome, facing the service track.
  const ax=4.85;
  aid.box(white,ax,1.22,-.40,2.04,1.65,3.38);
  aid.box(white,ax,.87,1.75,1.96,.89,1.05);
  aid.box(white,ax,1.62,1.25,1.90,.64,1.01);
  aid.box(screen,ax,1.65,1.775,1.67,.45,.04);
  aid.box(white,ax,2.12,-.34,2.08,.16,3.55);
  aid.box(vinyl,ax,2.25,.72,1.20,.11,.26);
  for(const side of [-1,1]){
    for(let i=0;i<8;i++){
      const z=-1.85+i*.44;
      aid.box((i%2)?green:linen,ax+side*1.03,.92,z,.04,.24,.44);
    }
    for(const z of [-1.54,1.36])aid.add(new THREE.CylinderGeometry(.38,.38,.19,20),screen,ax+side*.99,.40,z,1,1,1,0,0,Math.PI/2);
  }
  aid.sign('AMBULANCE',1.58,.22,ax,1.16,2.30,'#f5f6ec','#216953');
  aid.finish();
  return {testing,aid};
}
