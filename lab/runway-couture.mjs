// Couture shells are fitted in the walking rig's space, then travel with its hips.
const tau=Math.PI*2;
function textile(THREE,width,height,paint){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  paint(canvas.getContext('2d'),width,height);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=THREE.RepeatWrapping;map.anisotropy=4;return map;
}
function surface(THREE,cols,rows,point,material,name){
  const position=[],uv=[],indices=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const u=i/cols,v=j/rows;
    position.push(...point(u,v));uv.push(u,v);
    if(i&&j){const k=j*(cols+1)+i;indices.push(k-cols-2,k-cols-1,k,k-cols-2,k,k-1);}
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.castShadow=!material.transparent;return mesh;
}
function pearlLantern(THREE,neck,hip){
  const silk=textile(THREE,128,256,(ctx,w,h)=>{
    const shade=ctx.createLinearGradient(0,0,w,0);
    for(const [at,tone] of [[0,'#777978'],[.09,'#a8a89f'],[.23,'#e8e7d7'],[.57,'#fff9e9'],[.9,'#dedfd5'],[1,'#777978']])shade.addColorStop(at,tone);
    ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
  });silk.repeat.x=46;
  const material=new THREE.MeshPhysicalMaterial({map:silk,roughness:.52,metalness:.07,iridescence:.25,side:THREE.DoubleSide});
  const hem=.048,bust=neck-.075;
  // Two swollen, fluted volumes meet at a narrow gathered ring below the hips.
  const profile=new THREE.SplineCurve([
    [.0,.43],[.055,.48],[.16,.46],[.30,.33],[.42,.16],[.47,.14],
    [.56,.25],[.68,.32],[.78,.32],[.89,.25],[1,.145]
  ].map(([y,r])=>new THREE.Vector2(r*hip/.80,y)));
  return surface(THREE,184,54,(u,v)=>{
    const ring=profile.getPoint(v),a=tau*u,twist=.11*Math.sin(v*Math.PI*2);
    const r=ring.x+.009*Math.cos(46*a);
    return [r*Math.sin(a+twist),hem+ring.y*(bust-hem),.023+.84*r*Math.cos(a+twist)];
  },material,'Pearl double-lantern gown');
}
function filamentFan(THREE,neck,hip){
  const thread=textile(THREE,256,384,(c,w,h)=>{
    c.fillStyle='rgba(30,29,39,.52)';c.fillRect(0,0,w,h);
    c.strokeStyle='#fff9e6';c.lineWidth=3;
    for(let i=0;i<=12;i++){
      const y=8+i*30;
      c.beginPath();c.moveTo(0,y);c.bezierCurveTo(.25*w,y+58,.68*w,y-36,w,y);c.stroke();
    }
    c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.lineTo(0,h);c.stroke();
  });thread.repeat.x=11;
  const organza=new THREE.MeshPhysicalMaterial({map:thread,side:THREE.DoubleSide,transparent:true,depthWrite:false,roughness:.68,emissive:'#e6ddc7',emissiveMap:thread,emissiveIntensity:.16});
  organza.forceSinglePass=true;
  const dress=new THREE.Group();dress.name='Ivory filaments on charcoal organza';
  for(const sign of [-1,1]){
    dress.add(surface(THREE,132,18,(u,v)=>{
      const a=-1.47+2.75*u,flute=Math.cos(u*tau*11);
      const outer=(.64+.07*Math.sin(2*a)+.032*flute)*hip/.80;
      const r=.045+v*(outer-.045);
      return [sign*(.022+r*Math.cos(a)),hip+.16+r*Math.sin(a),
        .145-.32*v+.087*v*Math.sin(u*tau*11+.6*v)];
    },organza,'Fan of embroidered pleats'));
  }
  const skirt=new THREE.MeshStandardMaterial({color:'#28252c',roughness:.58,side:THREE.DoubleSide});
  dress.add(surface(THREE,96,16,(u,v)=>{
    const a=tau*u,r=.14+(.20+.025*Math.cos(a*18))*v;
    return [r*Math.sin(a),hip+.16-.42*v,.018+.84*r*Math.cos(a)];
  },skirt,'Pleated charcoal underskirt'));return dress;
}
function pleatedWings(THREE,neck,hip){
  const veil=textile(THREE,512,512,(c,w,h)=>{
    const ink=c.createLinearGradient(0,h,0,0);
    for(const [at,tone] of [[0,'#b4ac71'],[.22,'#e8e1a2'],[.55,'#f4f0c4'],[.73,'#bdc6a4'],[.90,'#536566'],[1,'#29303c']])ink.addColorStop(at,tone);
    c.fillStyle=ink;c.fillRect(0,0,w,h);
    for(let i=0;i<72;i++){const x=i*w/72;c.fillStyle='rgba(42,46,51,.20)';c.fillRect(x,0,1.5,h);}
  });
  const material=new THREE.MeshPhysicalMaterial({map:veil,side:THREE.DoubleSide,roughness:.60,transparent:true,opacity:.91,depthWrite:false});
  material.forceSinglePass=true;
  const dress=new THREE.Group();dress.name='Pleated wings in pale gold and ink';
  const spread=hip/.82;
  const edge=new THREE.CatmullRomCurve3([
    [.12,neck-.03,.06],[.36,neck+.29,.12],[.44,neck+.34,.11],
    [.65,neck+.13,.01],[.77,neck-.19,-.08],[.78,hip-.12,-.13],
    [.67,.42,-.16],[.42,.14,-.16],[.23,.055,-.16],[.10,.055,-.08]
  ].map(([x,y,z])=>new THREE.Vector3(x*spread,y,z)));
  for(const side of [-1,1])dress.add(surface(THREE,144,24,(u,v)=>{
    const e=edge.getPoint(u),rootY=hip+.18,fold=Math.sin(u*tau*36);
    return [side*(.082+(e.x-.082)*v),rootY+(e.y-rootY)*v,
      .14+(e.z-.14)*v+(.009+.026*v)*fold];
  },material,'Hand-raised pleated silk wing'));
  const skirt=new THREE.MeshStandardMaterial({map:veil,roughness:.61,side:THREE.DoubleSide});
  dress.add(surface(THREE,144,22,(u,v)=>{
    const a=tau*u,r=.143+v*.15+.012*Math.cos(a*36);
    return [r*Math.sin(a),hip+.22-(hip+.17)*v,.024+r*Math.cos(a)];
  },skirt,'Floor-length pleated train'));return dress;
}

const patterns={'pearl-lantern':pearlLantern,'filament-fan':filamentFan,'pleated-wings':pleatedWings};
export function fitCouture(THREE,model,id){
  const hips=model.getObjectByName('Hips'),p=new THREE.Vector3();
  const hip=hips.getWorldPosition(p).y,neck=model.getObjectByName('Neck').getWorldPosition(p).y;
  const garment=patterns[id](THREE,neck,hip);
  model.add(garment);hips.attach(garment);
}
