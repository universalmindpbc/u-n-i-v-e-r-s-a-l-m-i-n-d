// Run in the same pinned generator as festival-cast.ts. Build the numbered
// standing variants with its --standing flag before baking this distance mesh.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptSimplifier} from 'meshoptimizer';

const [standing, assets, pack='crowd']=process.argv.slice(2);
if(!standing||!assets)throw Error('Pass the standing-variant directory and the festival asset directory');
await MeshoptSimplifier.ready;
globalThis.ProgressEvent ??= class {};
const runway=pack==='iris'||pack==='nagnata';
const workshop=pack==='workshops';
const walkers=pack==='walkers';
const samples=runway||workshop||walkers?8:4;
const ids=walkers?['01','04','06','09','A','D2']:runway?Array.from({length:8},(_,i)=>pack+'-'+i):workshop?['01','04','07','09','02','05','06','08','A','B','D3']:['01','02','03','04','05','06','07','08','09','A','B','C','D1','D2','D3','river-arena'];
const gltf={asset:{version:'2.0',generator:'Universal Mind festival cast'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],accessors:[],bufferViews:[],buffers:[],materials:[{name:'Distance wardrobe',doubleSided:true,pbrMetallicRoughness:{metallicFactor:0,roughnessFactor:.88}}]};
const chunks=[];let offset=0;
function accessor(array,width,componentType,extra={}){
  const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}
  const view=gltf.bufferViews.push({buffer:0,byteOffset:offset,byteLength:array.byteLength})-1;
  chunks.push(Buffer.from(array.buffer,array.byteOffset,array.byteLength));offset+=array.byteLength;
  return gltf.accessors.push({bufferView:view,componentType,count:array.length/width,type:['','SCALAR','VEC2','VEC3','VEC4'][width],...extra})-1;
}
const asLinear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
for(const id of ids){
  const source=runway||walkers||(!workshop && /^\d+$/.test(id))?standing:assets;
  const data=await fs.readFile(path.join(source,id+'.glb'));
  const len=data.readUInt32LE(12),json=JSON.parse(data.subarray(20,20+len)),bin=data.subarray(28+len);
  const maps=await Promise.all(json.images.map(img=>{
    const view=json.bufferViews[img.bufferView];return sharp(bin.subarray(view.byteOffset,view.byteOffset+view.byteLength)).resize(128,128,{fit:'fill'}).ensureAlpha().raw().toBuffer();
  }));
  const materials=new Map(json.materials.map(m=>{
    const p=m.pbrMetallicRoughness,index=p.baseColorTexture?.index;
    const sample={rgb:p.baseColorFactor??[1,1,1,1],texture:index===undefined?null:maps[json.textures[index].source],masked:m.alphaMode==='MASK'};
    delete p.baseColorTexture;delete p.metallicRoughnessTexture;delete m.normalTexture;return [m.name,sample];
  }));
  delete json.images;delete json.textures;delete json.samplers;
  json.buffers[0].uri='data:application/octet-stream;base64,'+bin.toString('base64');
  const asset=await new GLTFLoader().parseAsync(JSON.stringify(json),'');
  const mixer=new THREE.AnimationMixer(asset.scene);
  let clip=asset.animations[0];
  if(workshop||pack==='crowd'){
    const {characterClip}=await import('./character-motion.mjs');
    const action=workshop?(['A','B','D3'].includes(id)?'lead':'listen'):('AB'.includes(id)||id==='D3'?'talk':'dance');
    clip=characterClip(THREE,clip,action,ids.indexOf(id));
  }
  mixer.clipAction(clip).play();
  const sequence=Array.from({length:samples},()=>[]),rgb=[],faces=[],p=new THREE.Vector3(),lo=[10,10,10],hi=[-10,-10,-10];
  asset.scene.traverse(object=>{
    if(!object.isSkinnedMesh)return;
    const geom=object.geometry,mat=materials.get(object.material.name);
    if(!mat||/Skin details|Eyelashes|Eyebrows|laces|chest print|Silver/i.test(object.material.name))return;
    const original=Uint32Array.from(geom.index.array);
    const target=Math.min(original.length,Math.max(30,Math.floor(original.length*(runway?.23:workshop?.12:.075)/3)*3));
    const [indices]=MeshoptSimplifier.simplify(original,geom.attributes.position.array,3,target,.013,['Sparse']);
    const ids=new Map(),start=rgb.length/3;
    function sample(i){
      const uv=geom.attributes.uv,x=Math.floor(((uv.getX(i)%1+1)%1)*128),y=Math.floor(((uv.getY(i)%1+1)%1)*128);
      const pixel=(128*y+x)*4, tex=mat.texture;
      return [0,1,2,3].map(k=>k===3?(tex?tex[pixel+3]:255):Math.round(255*(mat.rgb[k]??1)*(tex?asLinear(tex[pixel+k]/255):1)));
    }
    for(let i=0;i<indices.length;i+=3){
      const tri=indices.subarray(i,i+3);
      if(mat.masked&&tri.reduce((sum,j)=>sum+sample(j)[3],0)<255)continue;
      for(const n of tri){
        if(!ids.has(n)){ids.set(n,start+ids.size);rgb.push(...sample(n).slice(0,3));}
        faces.push(ids.get(n));
      }
    }
    for(let f=0;f<samples;f++){
      mixer.setTime(f*clip.duration/samples);asset.scene.updateMatrixWorld(true);
      for(const n of ids.keys()){
        object.getVertexPosition(n,p);sequence[f].push(p.x,p.y,p.z);
        if(f===0)for(const [a,v] of [p.x,p.y,p.z].entries()){lo[a]=Math.min(lo[a],v);hi[a]=Math.max(hi[a],v);}
      }
    }
  });
  const base=sequence[0],position=accessor(Float32Array.from(base),3,5126,{min:lo,max:hi});
  const targets=sequence.slice(1).map(frame=>{
    const delta=Float32Array.from(frame,(v,i)=>v-base[i]),mn=[0,0,0],mx=[0,0,0];
    delta.forEach((v,i)=>{mn[i%3]=Math.min(mn[i%3],v);mx[i%3]=Math.max(mx[i%3],v);});
    return {POSITION:accessor(delta,3,5126,{min:mn,max:mx})};
  });
  const rgba=Uint8Array.from({length:rgb.length/3*4},(_,i)=>i%4===3?255:rgb[Math.floor(i/4)*3+i%4]);
  const colour=accessor(rgba,4,5121,{normalized:true});
  if(rgb.length/3>=65536)throw Error('Distance mesh index overflow');
  const indices=accessor(Uint16Array.from(faces),1,5123);
  const mesh=gltf.meshes.push({name:'Look '+id,primitives:[{attributes:{POSITION:position,COLOR_0:colour},indices,targets,material:0}],weights:Array(samples-1).fill(0)})-1;
  gltf.scenes[0].nodes.push(gltf.nodes.push({name:'Look '+id,mesh,extras:{look:id}})-1);
}
gltf.buffers.push({byteLength:offset});const jsonBytes=Buffer.from(JSON.stringify(gltf));
const header=Buffer.alloc(20),desc=Buffer.alloc((jsonBytes.length+3)&~3,32),bufHeader=Buffer.alloc(8),bytes=Buffer.concat(chunks,(offset+3)&~3);
jsonBytes.copy(desc);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+desc.length+bytes.length,8);header.writeUInt32LE(desc.length,12);header.write('JSON',16);bufHeader.writeUInt32LE(bytes.length);bufHeader.write('BIN',4);
await fs.writeFile(path.join(assets,pack+'.glb'),Buffer.concat([header,desc,bufHeader,bytes]));console.log(ids.length+' wardrobe meshes, '+Math.round(bytes.length/1024)+' KiB');
