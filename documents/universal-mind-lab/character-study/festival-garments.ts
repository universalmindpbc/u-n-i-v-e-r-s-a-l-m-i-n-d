// Run beside festival-cast.ts in the pinned generator's scripts directory.
import {garmentById, type GarmentDef} from '../src/core/garments/catalog';
import {cm, REGION} from '../src/core/garments/body';
import {cloth, isTrunk, isUpper, mat, shellPart, skirt, torsoY} from '../src/core/garments/kit';
import {dressPts, hang, legsUnder, loosePart} from '../src/core/garments/drape';
import type {PolyMesh} from '../src/core/geometry';
import {Caster} from '../src/core/garments/project';

type Build = GarmentDef['build'];
function register(id: string, slot: GarmentDef['slot'], build: Build) {
  garmentById.set(id, {id, label:id, slot, patterns:['solid'], color:'#ffffff', color2:'#fafafa', build});
}
function transfer(surface,centre,width,height,file,colour,name){
  const divisions=18, positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(let row=0;row<=divisions;row++)for(let col=0;col<=divisions;col++){
    const u=col/divisions,v=row/divisions,hit=surface.hit((u-.5)*width,centre+(v-.5)*height);
    if(!hit)throw Error(name+' outside garment');
    positions.push(hit.p[0],hit.p[1],hit.p[2]+cm(.18));uvs.push(u,v);
    if(row&&col){const i=row*(divisions+1)+col;indices.push(i-divisions-2,i-divisions-1,i,i-1);}
  }
  const mesh={positions:Float32Array.from(positions),uvs:Float32Array.from(uvs),faceSizes:new Uint8Array(divisions*divisions).fill(4),faceVerts:Uint32Array.from(indices),faceUVs:Uint32Array.from(indices)};
  return {mesh,material:mat(name,null,{map:file,color:colour,alpha:'mask',doubleSided:true})};
}
const emblemTop = (source: Build, ink: string): Build => (g, style) => {
  const parts=source(g,style),surface=new Caster(parts[0].mesh,null,()=>true,'front');
  parts.push(transfer(surface,torsoY(g.body,.65),cm(21.2),cm(21.2),'festival-emblem.png',ink,'In This World chest print'));
  if(ink==='#ffffff')parts.push(transfer(surface,torsoY(g.body,.63),cm(.65),cm(32),'rash-zip.png','#ffffff','Front zip'));
  return parts;
};
// Fit the jersey to its own wearer's chest and shoulder. The older street tee
// used a wide drape envelope that pulled the chest and sleeves out when seated.
const classicTee:Build=(g,s)=>{
  const shoulder=g.body.L.shoulderX;
  return shellPart(g,{
    covers:v=>{
      const collar=(v.ax/(.40*shoulder))**2+((1.02-v.tt)/(.08))**2<1;
      return !collar&&((isUpper(v)&&v.tt>.065)||(v.region===REGION.upperarm&&v.t<.58));
    },
    offset:v=>cm(v.region===REGION.upperarm?.65:.88),tile:.25,relax:3
  },mat('Classic crew tee',null,{color:s.color,roughness:.94}));
};
register('classic-crew','top',classicTee);
register('star-tee','top',emblemTop(classicTee,'#2448a4'));
register('sport-crop','top',(g,s)=>shellPart(g,{
  covers:v=>isUpper(v)&&v.tt>.45&&(v.tt<.78||Math.abs(v.ax-.62*g.body.L.shoulderX)<.19*g.body.L.shoulderX),
  offset:cm(.5),relax:3
},cloth(g,'Technical knit crop',s)));
register('one-piece','top',(g,s)=>shellPart(g,{
  covers:v=>isUpper(v)&&(v.tt<.75||Math.abs(v.ax-.64*g.body.L.shoulderX)<.17*g.body.L.shoulderX),
  offset:cm(.48),relax:3
},cloth(g,'Scoop-neck swimsuit',s)));
for(const long of [false,true]){
  const build:Build=(g,s)=>shellPart(g,{
    covers:v=>(isTrunk(v)&&v.tt>.08)||(v.region===REGION.neck&&v.tt<1.02)||(v.region===REGION.upperarm&&(long||v.t<.52))||(long&&v.region===REGION.lowerarm&&v.t<.98),
    offset:cm(.64),relax:3
  },cloth(g,'Cobalt neoprene',s));
  register(long?'long-rash':'short-rash','top',emblemTop(build,'#ffffff'));
}
register('quilted-puffer','jacket',(g,s)=>shellPart(g,{
  covers:v=>(isTrunk(v)&&v.tt>.15&&Math.abs(v.tth)>.54)||v.region===REGION.upperarm||(v.region===REGION.lowerarm&&v.t<.92),
  offset:v=>cm(2.8+1.3*Math.sin(v.t*28)**2),relax:2
},cloth(g,'Open quilted puffer',s)));
for(const [id,length,ease] of [['leggings',1,.42],['hotpants',.34,.55],['training',.53,1.3],['cutoffs',.32,1.45],['boxing',.76,3.3]] as const){
  register(id,'bottom',(g,s)=>{
    const parts=shellPart(g,{
      covers:v=>(isTrunk(v)&&v.t<.32)||(v.region===REGION.upperleg&&v.t<length+(id==='cutoffs'?.035*Math.sin(v.theta*9):0))||(id==='leggings'&&v.region===REGION.lowerleg&&v.t<.93),
      offset:v=>cm(ease*(v.region===REGION.upperleg?1+v.t*.5:1)),relax:3
    },cloth(g,id,s,{roughness:id==='boxing'?.43:.86}));
    if(id==='boxing'||id==='cutoffs'){
      parts.push(...shellPart(g,{covers:v=>isTrunk(v)&&v.t>.22&&v.t<.32,offset:cm(ease+.18)},mat('Waistband',null,{color:id==='boxing'?'#faf4e6':'#96a9bd'}),false));
    }
    if(id==='cutoffs'){
      const surface=new Caster(parts[0].mesh,null,()=>true,'front');
      parts.push(transfer(surface,torsoY(g.body,.17),cm(22),cm(12),'denim-stitch.png','#ffffff','Fly and pocket stitching'));
    }
    return parts;
  });
}

// Project the ink onto the individual arm surface before skin binding.
register('festival-ink','acc',g=>{
  return [[REGION.upperarm,-1,'flower-ink.png',3.9,3.9],[REGION.lowerarm,1,'affirmation-ink.png',2.6,5.4]].map(([region,side,file,width,height])=>{
    const [a,b]=g.body.axis(Number(region),Number(side)),t=.43;
    const mid=a.map((p,i)=>p+(b[i]-p)*t), dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
    const ux=-dy/length,uy=dx/length;
    const caster=new Caster(g.body,g.faceVerts,face=>{
      const info=g.body.info[g.faceVerts[face*4]];
      return info.region===region&&info.side===side;
    },'front');
    const positions:number[]=[],uvs:number[]=[],faces:number[]=[];
    for(let row=0;row<=6;row++)for(let col=0;col<=6;col++){
      const u=col/6,v=row/6,w=(u-.5)*cm(Number(width)),h=(v-.5)*cm(Number(height));
      const hit=caster.hit(mid[0]+ux*w-dx/length*h,mid[1]+uy*w-dy/length*h);
      if(!hit)throw Error('Arm transfer outside surface: '+file);
      positions.push(...hit.p.map((p,k)=>p+hit.n[k]*cm(.12)));uvs.push(u,v);
      if(row&&col){const i=row*7+col;faces.push(i-8,i-7,i,i-1);}
    }
    return {mesh:{positions:Float32Array.from(positions),uvs:Float32Array.from(uvs),faceSizes:new Uint8Array(36).fill(4),faceVerts:Uint32Array.from(faces),faceUVs:Uint32Array.from(faces)},material:mat('Fine-line arm ink',null,{map:String(file),alpha:'mask',doubleSided:true})};
  });
});

// Sculptural pleats and layered hems for the opening show.
register('sculpted-bodice','top',(g,s)=>shellPart(g,{
  covers:v=>isTrunk(v)&&v.tt>.18&&v.tt<.87,
  offset:v=>cm(.8+1.3*(.5+.5*Math.cos(v.tth*18+v.tt*9))),relax:1
},cloth(g,'Pleated bodice',s)));
for(let style=0;style<4;style++){
  register('wave-skirt-'+style,'bottom',(g,s)=>{
    const top=torsoY(g.body,.36),length=cm([83,56,91,68][style]),parts=[];
    for(let layer=0;layer<3;layer++){
      const drop=length*(1-.27*layer);
      const mesh=skirt(g.body,top,top-drop,cm(.9+.45*layer),.38+.18*layer,undefined,96);
      if(!mesh)continue;
      const p=mesh.positions;
      for(let j=0;j<p.length;j+=3){
        const x=p[j],z=p[j+2]-g.body.L.torsoZ,t=(top-p[j+1])/drop;
        const angle=Math.atan2(x,z),r=Math.hypot(x,z)||1;
        const pleat=cm(2.6)*t*Math.cos(angle*(14+style*2)+t*4);
        p[j]+=pleat*x/r;p[j+2]+=pleat*z/r;
        p[j+1]+=cm(8+style)*t*t*Math.sin(3*angle+style+layer*.65);
      }
      parts.push({mesh,material:cloth(g,'Wave pleat '+layer,{...s,color:layer===1?'#dbc8b5':s.color},{doubleSided:true})});
    }
    return parts;
  });
}
// Wide contrast bands follow the knit rather than floating above the body.
for(const [id,base] of [['contour-crop','sport-crop'],['contour-short','hotpants'],['contour-leg','leggings']] as const){
  register(id,id==='contour-crop'?'top':'bottom',(g,s)=>{
    const parts=garmentById.get(base)!.build(g,s);
    const band=id==='contour-crop'?.46:.27;
    parts.push(...shellPart(g,{covers:v=>isTrunk(v)&&v.tt>band&&v.tt<band+.054,offset:cm(.85),relax:1},mat('Contrast knit band',null,{color:s.color2||'#443743'}),false));
    if(id!=='contour-crop')parts.push(...shellPart(g,{covers:v=>v.region===REGION.upperleg&&v.t>.06&&v.t<(id==='contour-leg'?.92:.34)&&v.ax>g.body.L.shoulderX*.75,offset:cm(.82)},mat('Side stripe',null,{color:s.color2||'#443743'}),false));
    return parts;
  });
}

// Host garments for the tea house. The skirt hangs from the waist to the ankle.
register('ceremony-silk','top',(g,s)=>{
  const bodice=shellPart(g,{
    covers:v=>(isTrunk(v)&&v.tt>.03)||(v.region===REGION.upperarm)||(v.region===REGION.lowerarm&&v.t<.93),
    offset:v=>cm(v.region===REGION.lowerarm?1.6:.74),relax:3
  },mat('Red silk',null,{color:s.color,roughness:.36}));
  const front=new Caster(bodice[0].mesh,null,()=>true,'front');
  bodice.push(transfer(front,torsoY(g.body,.60),cm(13),cm(19),'tea-embroidery.png','#e0b669','Gold star embroidery'));
  return bodice;
});
register('ceremony-skirt','bottom',(g,s)=>{
  const top=torsoY(g.body,.36);
  const ankle=g.body.axis(REGION.lowerleg,1)[1][1];
  const mesh=skirt(g.body,top,ankle+cm(3),cm(1.25),.105,undefined,56);
  if(!mesh)throw Error('Tea gown hem does not reach the ankle');
  return [{mesh,material:mat('Long silk skirt',null,{color:s.color,roughness:.36,doubleSided:true})}];
});


// Map satin panels once around the figure. Duplicating UVs across the rear seam
// keeps the narrow centre-back zip aligned as the waist and skirt deform.
function dressUV(mesh:PolyMesh, centreZ:number, hem:number, top:number) {
  const uv:number[]=[];
  let corner=0;
  for(const count of mesh.faceSizes) {
    const face=mesh.faceVerts.subarray(corner,corner+count);
    const us=Array.from(face,index=>.5+Math.atan2(mesh.positions[index*3],mesh.positions[index*3+2]-centreZ)/(2*Math.PI));
    const wrap=Math.max(...us)-Math.min(...us)>.5;
    for(let j=0;j<count;j++) {
      uv.push(us[j]+(wrap&&us[j]<.5?1:0),(mesh.positions[face[j]*3+1]-hem)/(top-hem));
    }
    corner+=count;
  }
  mesh.uvs=Float32Array.from(uv);
  mesh.faceUVs=Uint32Array.from(mesh.faceVerts,(_,i)=>i);
}
register('waspie-bodice','top',(g,s)=>{
  const {body}=g, shoulder=body.L.shoulderX;
  const parts=shellPart(g,{
    covers:v=>{
      const front=Math.max(0,Math.cos(v.tth));
      const sweetheart=.55+front*(.18+.08*Math.sin(Math.min(1,v.ax/shoulder)*Math.PI));
      const strap=Math.abs(v.ax/shoulder-.62)<.105;
      return isUpper(v)&&v.tt>.23&&(v.tt<sweetheart||strap);
    },
    offset:cm(.52),relax:2
  },mat('Sweetheart satin bodice',null,{map:'waspie-bodice.png',color:s.color,roughness:.37,doubleSided:true}));
  for(const part of parts) dressUV(part.mesh,body.L.torsoZ,torsoY(body,.26),torsoY(body,1.03));
  return parts;
});
register('waspie-mini','bottom',(g,s)=>{
  const body=g.body, top=torsoY(body,.35),hem=body.L.hipY-cm(21);
  const mesh=hang(body,dressPts(body),top,hem,{offset:cm(.95),shrink:.045,samples:64});
  if(!mesh)throw Error('Missing fitted VIP skirt');
  dressUV(mesh,body.L.torsoZ,hem,top);
  const satin=mat('Banded satin mini',null,{map:'waspie-skirt.png',color:s.color,roughness:.39,doubleSided:true});
  return loosePart(body,mesh,satin,.30,.26,legsUnder(g,hem,cm(4)));
});
