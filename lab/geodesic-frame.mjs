// Keep the upper hemisphere and clip edges that cross the equator.
export function geodesicFrame(THREE,radius,detail){
  const solid=new THREE.IcosahedronGeometry(radius,detail),edges=new THREE.EdgesGeometry(solid,1);
  const vertices=edges.attributes.position,lines=[];
  const a=new THREE.Vector3(),b=new THREE.Vector3();
  for(let i=0;i<vertices.count;i+=2){
    a.fromBufferAttribute(vertices,i);b.fromBufferAttribute(vertices,i+1);
    if(a.y<0&&b.y<0)continue;
    if(a.y<0)a.lerp(b,-a.y/(b.y-a.y));
    if(b.y<0)b.lerp(a,-b.y/(a.y-b.y));
    lines.push(a.x,a.y,a.z,b.x,b.y,b.z);
  }
  solid.dispose();edges.dispose();
  return new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
}
