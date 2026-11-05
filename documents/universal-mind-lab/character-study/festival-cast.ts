// Copy the two festival .ts files to the pinned Ara 3D Gen scripts directory.
// node --import tsx scripts/festival-cast.ts <output directory> [look IDs...]
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {MeshoptSimplifier} from 'meshoptimizer';
import {nodeLibrary} from './node-assets';
import {DEFAULT_PARAMS,yearsToAge,type HumanParams} from '../src/core/params';
import {buildHuman,textureFiles} from '../src/core/human';
import {Animator} from '../src/core/anim/evaluate';
import {gait,WALK} from '../src/core/anim/clips/gait';
import {idle} from '../src/core/anim/clips/basic';
import {cheer} from '../src/core/anim/clips/emotes';
import {side,fingers} from '../src/core/anim/clips/helpers';
import type {Clip,Ch} from '../src/core/anim/clips/types';
import type {MeshData} from '../src/core/mesh';
import {exportGLB} from '../src/export/glb';
import './festival-garments';

const output=process.argv[2];
if(!output)throw Error('Pass an output directory');
await fs.mkdir(output,{recursive:true});
const library=await nodeLibrary();
await MeshoptSimplifier.ready;
const colour={coal:'#28292d',plum:'#693551',ivory:'#f3f1e9',cobalt:'#193e96',denim:'#94adc4',olive:'#555e43'};
type Look = {id:string; age:number; gender:number; skin:string; hair:string; top:string; bottom:string; topColour:string; bottomColour:string; pose:string; extra:Partial<HumanParams>};
function look(id:string, age:number, gender:number, skin:string, hair:string, top:string, bottom:string, topColour:string, bottomColour:string, pose:string,extra:Partial<HumanParams>={}):Look {
  return {id,age,gender,skin:'young_'+skin+'_'+(gender?'male':'female'),hair,top,bottom,topColour,bottomColour,pose,extra};
}
const {coal,plum,ivory,cobalt,denim,olive}=colour;
const blond={hairTint:'#ffe2a6'},shorts='cutoffs',tee='classic-crew',crop='sport-crop',suit='suit_jacket',shirt='suit_shirt_tie';
const looks=[
  look('01',21,1,'african','box_braids','tank_top','baggy_jeans',coal,'#363438','chair'),
  look('02',20,0,'caucasian','ponytail01',crop,'leggings','#b594c1','#bc9bc6','floor'),
  look('03',22,0,'asian','bun01',crop,'baggy_jeans',coal,'#875a94','daybed',{earrings:'small_hoops'}),
  look('04',20,0,'african','ponytail01',crop,'leggings','#25242b','#282930','chair'),
  look('05',21,1,'caucasian','short02',tee,'baggy_jeans',ivory,'#424247','floor',blond),
  look('06',20,0,'asian','long01',crop,'hotpants',ivory,coal,'floor',{hairTint:'#ce906b'}),
  look('07',21,1,'african','buzz','tank_top','trousers',coal,'#212b40','chair'),
  look('08',20,0,'caucasian','bob01',crop,'leggings',plum,plum,'floor',{...blond,jacket:'quilted-puffer',weight:.61}),
  look('09',22,1,'asian','short01',tee,'training',olive,coal,'chair'),
  look('A',21,0,'asian','bob02','short-rash',shorts,cobalt,denim,'idle'),
  look('B',22,0,'caucasian','ponytail01','long-rash',shorts,cobalt,denim,'idle',blond),
  look('C',23,0,'african','short03','one-piece',shorts,coal,denim,'idle',{earrings:'studs'}),
  look('D1',20,1,'african','afro01','star-tee','boxing',ivory,cobalt,'groove'),
  look('D2',22,1,'caucasian','short02','star-tee','boxing',ivory,'#ed7133','groove',blond),
  look('D3',21,1,'asian','buzz','star-tee','boxing',ivory,'#bb334c','idle'),
  look('river-arena',21,0,'african','afro01','bikini_top',shorts,'#e97667',denim,'dance',{earrings:'small_hoops',accessories:['festival-ink']}),
  look('army-service',24,0,'caucasian','bun01',shirt,'suit_trousers','#c5b691','#8f8363','idle',{jacket:suit,shoes:'oxfords'}),
  look('army-field',19,1,'asian','short01','fatigue_shirt','fatigue_pants','#7c805d','#79805f','idle',{shoes:'combat_boots'}),
  look('navy-whites',23,1,'african','short02','uniform_shirt','uniform_trousers','#faf9f0','#f0f0e8','idle',{shoes:'oxfords'}),
  look('navy-working',20,0,'asian','short01','fatigue_shirt','fatigue_pants','#5d6d79','#62727e','idle',{hat:'baseball_cap',shoes:'combat_boots'}),
  look('air-service',24,1,'caucasian','short03',shirt,'suit_trousers','#c5d7e6','#222d40','idle',{jacket:suit,shoes:'oxfords'}),
  look('aircrew',22,0,'african','ponytail01','uniform_shirt_long','fatigue_pants',olive,olive,'helmet',{shoes:'combat_boots'})
];
// Original show studies. The two wardrobes share four fictional runway models.
const runwayModels=[
  ['african','ponytail01','#e8d5bb','#9f6a59','#b7a4cc','#433340'],
  ['caucasian','short02','#a2c5c8','#405a66','#a87865','#d6b4a8'],
  ['asian','long01','#c697ac','#793e59','#bad263','#334c47'],
  ['african','bob01','#c0a276','#4c4655','#e3acbb','#663b55'],
  ['asian','ponytail01','#c5d4df','#8088a9','#9fb6c4','#443753'],
  ['african','buzz','#eed4b6','#b1866c','#98c1a1','#29373c'],
  ['caucasian','long01','#b07388','#744c69','#8d778e','#d2bd96'],
  ['asian','short03','#c8d2bb','#8c938d','#cfab89','#583b40']
];
for(const [i,[skin,hair,pearl,shadow,knit,trim]] of runwayModels.entries()){
  looks.push(look('iris-'+i,20+i%5,0,skin,hair,'sculpted-bodice','wave-skirt-'+(i%4),pearl,shadow,'walk'));
  const bottom=i%2===0?'contour-short':'contour-leg';
  looks.push(look('nagnata-'+i,20+i%5,0,skin,hair,'contour-crop',bottom,knit,knit,'walk',{
    garmentStyles:{'contour-crop':{color:knit,color2:trim,pattern:'rib'},[bottom]:{color:knit,color2:trim,pattern:'rib'}}
  }));
}
// Keep the approved outfits while fitting the rigs to furniture and held devices.
for(const id of ['01','02','09','04']){
  const base=looks.find(item=>item.id===id)!;
  const pose=id==='04'?'yoga':'phone';
  looks.push({...base,id:pose+'-'+id,pose});
}
for(const [id,skin,hair,colour] of [['clinician-1','asian','long01','#547d81'],['clinician-2','african','braid01','#747193']]){
  looks.push(look(id,30,0,skin,hair,'tank_top','suit_trousers',colour,'#313b45','idle',{
    jacket:'overcoat',shoes:'heels',garmentStyles:{
      overcoat:{color:'#faf8ee',pattern:'solid'},tank_top:{color:colour,pattern:'solid'},
      suit_trousers:{color:'#323b43',pattern:'solid'},heels:{color:'#35373b',pattern:'solid'}
    }
  }));
}
const section = (s:string)=>s==='chair'||s==='floor'||s==='daybed';
function seated(pose:string):Clip {
  const crossed=pose!=='chair';
  return {id:pose,name:'Upright '+pose,category:'Sitting & lying',duration:4,loop:true,sample(t){
    const wave=Math.sin(t*Math.PI*.5);
    const bones:Record<string,Ch>={Spine:[1,0,0],Spine1:[.75*wave,0,0],Head:[.6*wave,1.2*wave,0]};
    side(bones,'UpLeg',crossed?[141,-24,-94]:[93,0,5],crossed?[136,-23,-88]:[93,0,5]);
    side(bones,'Leg',crossed?[-130,0,0]:[-80,0,0],crossed?[-132,0,0]:[-80,0,0]);
    side(bones,'Foot',crossed?[-35,-12,19]:[1,0,0],crossed?[-30,-12,15]:[1,0,0]);fingers(bones,10);
    const hand=(s:number)=>({pos:[s*(crossed?.31:.15),-.49,crossed?.21:.32],pole:[s,-.65,-.5],dir:[s*.04,-.16,1],palm:[0,-1,0]}) as const;
    return {bones,root:{ground:false},ik:{Left:hand(1),Right:hand(-1)}} as ReturnType<Clip['sample']>;
  }};
}
function movement(pose:string):Clip {
  if(section(pose))return seated(pose);
  if(pose==='phone')return {id:pose,name:'Seated device session',duration:4,loop:true,category:'Interaction',sample(t){
    const p=seated('chair').sample(t),beat=Math.sin(t*Math.PI);
    side(p.bones,'UpLeg',[83,0,4],[83,0,4]);side(p.bones,'Leg',[-88,0,0],[-88,0,0]);
    p.bones.Head=[12+1.3*beat,1.4*beat,0];p.gaze=[0,-10];
    p.ik={
      Left:{pos:[.051,-.24,.31],pole:[.5,-.6,-.2],dir:[-.24,.5,.7],palm:[-.9,.24,.12]},
      Right:{pos:[-.088+.006*beat,-.226+.011*beat,.319],pole:[-.5,-.65,-.22],dir:[.56,.33,.8],palm:[.75,-.4,.1]}
    };
    fingers(p.bones,15);return p;
  }};
  if(pose==='yoga')return {id:pose,name:'Downward-facing dog',duration:5,loop:true,category:'Sitting & lying',sample(t){
    const breath=Math.sin(t*2*Math.PI/5),bones:Record<string,Ch>={Spine:[2,0,0],Spine1:[1.3+breath,0,0],Head:[7,0,0]};
    side(bones,'UpLeg',[104,0,4],[104,0,4]);side(bones,'Leg',[-6,0,0],[-6,0,0]);
    side(bones,'Foot',[22,0,0],[22,0,0]);fingers(bones,2);
    const hand=(side:number)=>({space:'floor',pos:[side*.20,.018,.63],pole:[side,-.1,-.5],dir:[0,-.05,1],palm:[0,-1,0]}) as const;
    return {bones,root:{pitch:137,ground:true},ik:{Left:hand(1),Right:hand(-1)}} as ReturnType<Clip['sample']>;
  }};
  if(pose==='walk')return {id:'runway',name:'Runway walk',duration:1.2,loop:true,category:'Locomotion',sample:t=>gait(WALK,t/1.2)};
  if(pose==='dance')return {...cheer,name:'Hands overhead',sample(t){const p=cheer.sample(t);fingers(p.bones!,7);return {...p,thumbs:undefined};}};
  if(pose==='groove')return {...idle,name:'Dance-floor sway',sample(t){const p=idle.sample(t),w=Math.sin(t/idle.duration*Math.PI*2);
    p.bones!.Spine=[0,4*w,3*w];side(p.bones!,'ForeArm',[52+13*w,0,0],[38-12*w,0,0]);return p;}};
  if(pose==='helmet')return {...idle,name:'Carrying flight helmet',sample(t){const p=idle.sample(t);return {...p,ik:{Left:{pos:[.33,-.49,.14],pole:[.7,-1,-.5],dir:[0,-.5,1],palm:[0,1,.15]}}};}};
  return idle;
}
// Preserve the original vertices and skin weights at UV seams and garment edges.
function optimise(mesh:MeshData){
  const used=new Map<number,number>();
  for(const group of mesh.groups){
    const original=group.indices;
    const target=Math.max(90,Math.floor(original.length*.40/3)*3);
    const indices=original.length>target?MeshoptSimplifier.simplify(original,mesh.positions,3,target,.002,['Sparse'])[0]:original;
    group.indices=Uint32Array.from(indices,i=>{
      if(!used.has(i))used.set(i,used.size);
      return used.get(i)!;
    });
  }
  for(const [key,width] of [['positions',3],['normals',3],['uvs',2],['joints',4],['weights',4]] as const){
    const source=mesh[key]!, result=source.slice(0,used.size*width);
    for(const [old,i] of used)result.set(source.subarray(old*width,old*width+width),i*width);
    Object.assign(mesh,{[key]:result});
  }
}
const star=Array.from({length:16},(_,i)=>{const r=i%2?25:78,a=i*Math.PI/8;return [100+r*Math.sin(a),100-r*Math.cos(a)].join(',');}).join(' ');
const triangles=Array.from({length:8},(_,i)=>'<path transform="rotate('+i*45+' 100 100)" d="M62 26 L100 61 L138 26"/>').join('');
const emblem=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><g fill="none" stroke="white" stroke-width="3"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="91"/><defs><mask id="outer"><rect width="200" height="200" fill="white"/><polygon points="'+star+'" fill="black" stroke="black" stroke-width="7"/></mask></defs><g mask="url(#outer)">'+triangles+'</g><polygon points="'+star+'"/></g></svg>')).png().toBuffer();
const flower=Array.from({length:7},(_,i)=>{const a=i*Math.PI/3;return '<circle cx="'+(50+(i<6?19*Math.cos(a):0))+'" cy="'+(50+(i<6?19*Math.sin(a):0))+'" r="19"/>';}).join('');
const ink=new Map();
const detail=(svg:string)=>sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="400" height="200">'+svg+'</svg>')).png().toBuffer();
ink.set('denim-stitch.png',await detail('<g fill="none" stroke="#758b9c" stroke-width="2.2"><path d="M1 42 Q26 35 38 8 M199 42 Q174 35 162 8 M100 8 V95 Q117 89 117 55 V8"/><path d="M3 45 Q28 38 41 9 M197 45 Q172 38 159 9" stroke="#e4dac9" stroke-width="1.3"/><path d="M54 0 V20 H59 V0 M142 0 V20 H147 V0"/></g><circle cx="101" cy="8" r="4.5" fill="#86847f"/>'));
ink.set('rash-zip.png',await detail('<rect x="65" width="70" height="100" fill="#202329"/><path d="M94 0 V100 M107 0 V100" stroke="#a4aab1" stroke-width="6" stroke-dasharray="1 1"/><rect x="73" y="12" width="53" height="9" rx="5" fill="#81878b"/>'));
for(const [file,mark] of [['flower-ink.png','<g fill="none" stroke="#302c2e" stroke-width="2.2">'+flower+'<circle cx="50" cy="50" r="39"/></g>'],['affirmation-ink.png','<g transform="rotate(-90 50 50)"><text x="50" y="54" text-anchor="middle" fill="#302c2e" font-family="serif" font-style="italic" font-size="16">I am enough</text></g>']]){
  ink.set(file,await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 100 100">'+mark+'</svg>')).png().toBuffer());
}
for(const [index,spec] of looks.entries()){
  if(process.argv.length>3&&!process.argv.slice(3).includes(spec.id))continue;
  const field=['army-field','navy-working'].includes(spec.id);
  const tones={african:[.58,.12,.30],asian:[.10,.72,.18],caucasian:[.12,.08,.80]};
  const [african,asian,caucasian]=tones[spec.skin.split('_')[1] as keyof typeof tones];
  const params:HumanParams={...DEFAULT_PARAMS,name:spec.id,gender:spec.gender,age:yearsToAge(spec.age),height:.41+(index%5)*.034,
    weight:.43+(index%4)*.043,muscle:.39,seed:83+index,african,asian,caucasian,skin:spec.skin,hair:spec.hair==='bun01'?'braid01':spec.hair,
    hairColor:'#352823',eyes:index%5===4?'green':'brown',outfit:'none',top:spec.top,bottom:spec.bottom,shoes:'sneakers',
    faceShapes:false,speechShapes:false,teeth:'none',tongue:false,earringMetal:'silver',expression:'happy',
    garmentStyles:{[spec.top]:{pattern:field?'camo':'solid',color:spec.topColour,color2:field?(spec.id==='army-field'?'#9f9479':'#89969c'):spec.id==='navy-whites'?'#263145':spec.topColour},
      [spec.bottom]:{pattern:(field||spec.id==='03')?'camo':spec.bottom==='cutoffs'?'denim':'solid',color:spec.bottomColour,color2:field?spec.topColour:spec.id==='03'?'#c08fac':'#d3dce3'},
      'suit_jacket':{color:spec.bottomColour,pattern:'solid'},'quilted-puffer':{color:'#d9dcde'},'baseball_cap':{color:'#253047'},
      oxfords:{color:spec.id==='navy-whites'?'#efeee6':'#292526'}},...spec.extra};
  const character=await buildHuman(library,params),mesh=character.mesh;
  optimise(mesh);
  const rig=character.rig!,animator=new Animator(rig,character.face),clip=movement(process.argv.includes('--walk')?'walk':process.argv.includes('--standing')?'groove':spec.pose),baked=animator.bake(clip,10);
  if((section(spec.pose)||spec.pose==='phone')&&!process.argv.includes('--standing')&&!process.argv.includes('--walk')){
    const height=spec.pose==='phone'?.551:spec.pose==='chair'?.45:spec.pose==='daybed'?.723:.230;
    for(const f of baked.frames)for(const root of f.rootPos.keys())f.rootPos.set(root,[0,height,0]);
  }
  const textures=new Map<string,Uint8Array>();
  for(const file of textureFiles(mesh)){
    if(ink.has(file)){textures.set(file,ink.get(file));continue;}
    if(file==='festival-emblem.png'){textures.set(file,emblem);continue;}
    const size=file.startsWith('skin_')?512:256;
    let img=sharp(await library.texture(file)).resize({width:size,height:size,fit:'inside',withoutEnlargement:true});
    if(spec.extra.hairTint===blond.hairTint && file.startsWith('hair_'))img=img.linear([.72,.65,.55,1],[142,116,73,0]);
    textures.set(file,await (file.endsWith('.png')?img.png({palette:true,quality:88}):img.jpeg({quality:79})).toBuffer());
  }
  const bytes=exportGLB(mesh,spec.id,textures,rig,[{name:clip.name,loop:true,...baked}]);
  await fs.writeFile(path.join(output,spec.id+'.glb'),bytes);
  console.log(spec.id,spec.pose,Math.round(bytes.length/1024)+' KiB');
}
