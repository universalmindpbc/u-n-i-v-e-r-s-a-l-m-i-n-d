import fs from 'node:fs/promises';
import sharp from 'sharp';
import {nodeLibrary} from './node-assets';
import {DEFAULT_PARAMS,yearsToAge} from '../src/core/params';
import {buildHuman,textureFiles} from '../src/core/human';
import {Animator} from '../src/core/anim/evaluate';
import {type Clip} from '../src/core/anim/clips/types';
import {side,fingers} from '../src/core/anim/clips/helpers';
import {exportGLB} from '../src/export/glb';
const output=process.argv[2];
if(!output)throw new Error('Pass an absolute export directory as the first argument');
await fs.mkdir(output,{recursive:true});
const lib=await nodeLibrary();
const looks=[
 {gender:0,hair:'ponytail01',outfit:'female_sportsuit01',skin:'young_african_female',tint:'#9ca5d1',pose:'chair'},
 {gender:1,hair:'short02',skin:'young_caucasian_male',hairTint:'#d3b16b',top:'tank_top',bottom:'cargo_shorts',tint:'#b3c1a4',pose:'low'},
 {gender:0,hair:'bob02',skin:'young_asian_female',outfit:'female_sportsuit01',tint:'#d4a2c4',pose:'bean'},
 {gender:0,hair:'braid01',skin:'young_african_female',outfit:'female_sportsuit01',tint:'#a8bfbd',pose:'floor'},
 {gender:1,hair:'short01',skin:'young_african_male',top:'oversized_tee',bottom:'baggy_jeans',tint:'#9eafd0',pose:'hanging'},
 {gender:0,hair:'long01',skin:'young_caucasian_female',hairTint:'#e6c07d',outfit:'female_sportsuit01',tint:'#c999ac',pose:'daybed'},
 {gender:1,hair:'short03',skin:'young_asian_male',top:'tank_top',bottom:'cargo_shorts',tint:'#a7bea8',pose:'low'},
 {gender:0,hair:'bob01',skin:'young_caucasian_female',outfit:'female_sportsuit01',tint:'#b6a3d0',pose:'floor'},
 {gender:1,hair:'afro01',skin:'young_african_male',top:'oversized_tee',bottom:'baggy_jeans',tint:'#bfb3a3',pose:'bean'},
 {gender:0,hair:'ponytail01',skin:'young_asian_female',outfit:'female_sportsuit01',tint:'#dde4da',pose:'stand'},
];
const manifest=[];
for(let i=0;i<looks.length;i++){
 const look=looks[i],params={...DEFAULT_PARAMS,name:'emdr-'+i,seed:82+i,gender:look.gender,age:yearsToAge(i===9?32:18+i%7),height:.43+(i%4)*.04,weight:.42+(i%3)*.035,muscle:.45,skin:look.skin,hair:look.hair,hairTint:look.hairTint||'#ffffff',outfit:look.outfit||'none',outfitTint:look.tint,top:look.top||'none',bottom:look.bottom||'none',garmentStyles:{[look.top||'none']:{color:look.tint,pattern:'solid'},[look.bottom||'none']:{color:i===6?'#344b51':'#333c4c',pattern:'solid'}},shoes:'shoes03',faceShapes:false,speechShapes:false,detail:'medium' as const};
 const ch=await buildHuman(lib,params),animator=new Animator(ch.rig!,ch.face);
 const floor=look.pose==='floor',standing=look.pose==='stand',relaxed=['bean','daybed'].includes(look.pose);
 const hips=standing?undefined:({chair:.59,low:.44,bean:.30,floor:.22,hanging:.73,daybed:.56} as any)[look.pose];
 const clip:Clip={id:'presence',name:'Relaxed presence',category:'Sitting & lying',duration:8,loop:true,sample(t){
  const a=t/8*Math.PI*2,breath=Math.sin(a),b:any={Spine:[standing?1:relaxed?-8:3,0,0],Spine1:[.8*breath,0,0],Spine2:[.5*breath,0,0],Neck:[0,0,0],Head:[1.2*breath,2.4*Math.sin(a+i),0]};
  if(standing){side(b,'UpLeg',[0,0,-2],[0,0,-2]);side(b,'Leg',[-3,0,0],[-3,0,0]);side(b,'Arm',[8,0,5],[24,0,12]);side(b,'ForeArm',[32,0,0],[72+2*breath,0,0]);}
  else {side(b,'UpLeg',floor?[78,-42,38]:[relaxed?80:90,0,8],floor?[78,-42,38]:[relaxed?80:90,0,8]);side(b,'Leg',floor?[-125,0,0]:[relaxed?-64:-92,0,0],floor?[-125,0,0]:[relaxed?-64:-92,0,0]);side(b,'Foot',floor?[14,10,0]:[2,0,0],floor?[14,10,0]:[2,0,0]);side(b,'Arm',[15,0,12],[12,0,12]);side(b,'ForeArm',[85,0,0],[83,0,0]);}
  const lap=(s:1|-1):any=>({pos:[s*(floor?.24:.15),-.52,.29+(s===1?.008*breath:.025)],pole:[s,-.6,-.5],dir:[s*.05,-.25,1],palm:[0,-1,0]});
  fingers(b,16);return {bones:b,root:{ground:standing},gaze:[1.5*breath,0],...(!standing?{ik:{Left:lap(1),Right:lap(-1)}}:{})};
 }};
 const baked=animator.bake(clip,12);
 if(!standing)for(const frame of baked.frames)for(const [j,p] of frame.rootPos)frame.rootPos.set(j,[0,hips,0]);
 const tex=new Map<string,Uint8Array>();for(const file of textureFiles(ch.mesh)){let s=sharp(await lib.texture(file)).resize({width:512,height:512,fit:'inside',withoutEnlargement:true});const bytes=await (file.endsWith('.png')?s.png():s.jpeg({quality:82})).toBuffer();tex.set(file,bytes);}
 const data=exportGLB(ch.mesh,params.name,tex,ch.rig,[{name:clip.name,loop:true,...baked}]);
 const file='participant-'+String(i+1).padStart(2,'0')+'.glb';await fs.writeFile(output+'/'+file,data);
 manifest.push({file,role:i===9?'facilitator':'participant',pose:look.pose,height:ch.height,bytes:data.length,vertices:ch.mesh.positions.length/3,bones:ch.rig!.bones.length,params,head:ch.rig!.bones.find(b=>b.name==='Head'),headTop:ch.rig!.bones.find(b=>b.name==='HeadTop_End')});
 console.log(file,Math.round(data.length/1024)+'KB',look.pose);
}
await fs.writeFile(output+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
