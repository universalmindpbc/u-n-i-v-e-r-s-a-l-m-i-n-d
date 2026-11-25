// Versioned, read-only retrieval of the reviewed 528 Hz tuning-family research.
import {createHash} from 'node:crypto';
import register from '../Informatics/library-data/528hz-research-register.json' with {type:'json'};
import {youthMatches} from './informatics-youth-knowledge.js';
export const sound528Records=register.records;
const normal=value=>String(value||'').trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//,'').replace(/[‐‑–—]/g,'-');
const identities=new Map(sound528Records.flatMap(r=>[r.id,r.doi,r.pmid,...r.aliases].filter(Boolean).map(id=>[normal(id),r])));
export const sound528Record=id=>identities.get(normal(id));
export const sound528Replaces=row=>[row.id,row.data?.doi,row.data?.pmid].some(id=>id&&sound528Record(id));
export const sound528Version={version:'sound528-20261125-v1',sourceSHA256:createHash('sha256').update(JSON.stringify(register)).digest('hex'),sourceRecords:sound528Records.length,completedAuthorReportedRCTs:5,explicitly528HzRCTs:4};
const direct=query=>/\b(?:528|444)\s*(?:hz|hertz)?\b|solfeggio|sound of tranquillit/i.test(query)||!!sound528Record(query);
export function sound528Relevant(query,history=[]){
 if(direct(query))return true;
 const referential=q=>/\b(?:it|its|they|them|those|that|this|these|same|more|follow.up)\b/i.test(q);
 if(!referential(query))return false;
 for(const message of history.slice(-6).reverse()){
  if(message.role!=='user')continue;
  if(direct(message.content||''))return true;
  if(!referential(message.content||''))return false;
 }
 return false;
}
export function sound528Search(query,filters={},limit=12){
 const exact=sound528Record(query);if(exact)return youthMatches(exact,filters)?[exact]:[];
 const terms=[...new Set(normal(query).match(/[\p{L}\p{N}]+/gu)||[])].filter(t=>t.length>2&&!['the','and','research','evidence','study','studies','what','about'].includes(t));
 return sound528Records.filter(r=>youthMatches(r,filters)).map(r=>{
  const text=normal([r.title,r.summary,r.limitation,r.design,r.doi,...r.targets].join(' '));
  return {r,score:terms.reduce((n,t)=>n+(text.includes(t)?1:0),0)};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.r);
}
export function sound528Knowledge(args={},origin='https://staging.universalmind.tv'){
 if(args.id!=='528hz-sound-tuning'||args.topic&&!['ii','528hz'].includes(args.topic))return null;
 const rows=args.query?sound528Search(args.query,{},12):sound528Records;
 const offset=Math.max(0,Number(args.offset)||0),limit=6;
 return {id:register.id,title:register.title,url:origin+'/informatics/research/?collection=sound&chapter=1#topic-ii',version:sound528Version,reviewedAt:register.reviewedAt,sourceCount:register.sourceCount,reviewMethod:register.reviewMethod,sourceAudit:register.sourceAudit,overview:[register.topic.context,...register.topic.paragraphs],trustAssessment:register.topic.trustAssessment,
  designAudit:sound528Records.map(r=>({id:r.id,title:r.title,design:r.design,role:r.evidence?.researchRole,randomizedControlledTrial:r.paperTrustAssessment?.randomizedControlledTrial??null,sourceVerification:r.sourceVerification})),
  topics:[{id:'ii',title:register.topic.title,description:register.topic.description,paragraphs:register.topic.paragraphs,sourceIds:sound528Records.map(r=>r.id)}],
  matchedRecords:rows.length,offset,nextOffset:offset+limit<rows.length?offset+limit:null,records:rows.slice(offset,offset+limit),downloads:{json:origin+'/informatics/library-data/528hz-research-register.json',reading:origin+'/informatics/read/528hz/'},knowledgeMethod:'Versioned retrieval of source appraisals and chapter synthesis; no model fine-tuning. Publication count includes mixed evidence types. Five completed reports describe RCT designs, four explicitly include 528 Hz. Unhale classification and IEEE methods remain unresolved.'};
}
