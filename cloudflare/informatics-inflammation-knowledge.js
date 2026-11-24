// Read-only retrieval of the published General chapters. No database mutation or fine-tuning.
import {createHash} from 'node:crypto';
import edition from '../Informatics/library-data/general-edition.json' with {type:'json'};
import dock2 from '../Informatics/library-data/dock2-research-register.json' with {type:'json'};
import oxtr from '../Informatics/library-data/oxtr-il6-research-register.json' with {type:'json'};
import {youthMatches} from './informatics-youth-knowledge.js';

const registers={'dock2-trauma-ptsd':dock2,'oxtr-il6-inflammation':oxtr};
const chapters=edition.chapters.filter(c=>registers[c.id]);
const normal=value=>String(value||'').trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//,'').replace(/[‐‑–—]/g,'-');
export const inflammationRecords=chapters.flatMap(c=>registers[c.id].records.map(r=>{
 const papers=c.topics.flatMap(t=>t.papers).filter(p=>p.recordId===r.recordId);
 return {...papers[0],...r,id:r.recordId,aliases:[...new Set(papers.map(p=>p.id).filter(Boolean))],collections:['general'],conditions:c.id==='dock2-trauma-ptsd'?['PTSD']:[],researchChapter:c.id,reviewedAt:registers[c.id].reviewedAt};
}));
const byIdentity=new Map(inflammationRecords.flatMap(r=>[r.id,r.doi,r.pmid,...r.aliases].filter(Boolean).map(id=>[normal(id),r])));
export const inflammationRecord=id=>byIdentity.get(normal(id));
export const inflammationReplaces=row=>!![row.id,row.data?.doi,row.data?.pmid].filter(Boolean).find(inflammationRecord);
export const inflammationVersion={version:'general-inflammation-20261125',sourceSHA256:createHash('sha256').update(JSON.stringify({chapters,registers})).digest('hex'),sourceRecords:inflammationRecords.length,chapters:chapters.map(c=>({id:c.id,number:c.number,sourceRecords:registers[c.id].sourceCount,reviewedAt:registers[c.id].reviewedAt}))};

function directChapters(query){
 const q=normal(query),ids=[];
 if(/\bdock\s*2\b|\bcg16277944\b/.test(q))ids.push('dock2-trauma-ptsd');
 if(/\bil[ -]?6\b|interleukin[ -]?6|\b(?:oxytocin|oxtr)\b.*(?:inflamma|cytokine|immune)|(?:inflamma|cytokine|immune).*\b(?:oxytocin|oxtr)\b/.test(q))ids.push('oxtr-il6-inflammation');
 const record=inflammationRecord(query);if(record)ids.push(record.researchChapter);
 return [...new Set(ids)];
}
export function inflammationChapters(query,history=[]){
 const direct=directChapters(query);if(direct.length)return direct;
 // Carry the subject only for short, referential follow-ups, never a new unrelated topic.
 if(!/\b(?:it|its|they|them|those|that|this|these|both|same|more|follow.up)\b/i.test(query))return [];
 for(const m of history.slice(-6).reverse()){
  if(m.role!=='user')continue;
  const previous=directChapters(m.content||'');if(previous.length)return previous;
 }
 return [];
}
const stop=new Set('the a an and or of for in to on with from study studies research evidence what is are does do this that tell me about can human humans our has have how which'.split(' '));
export function inflammationSearch(query,filters={},limit=8){
 const exact=inflammationRecord(query);if(exact)return youthMatches(exact,filters)?[exact]:[];
 const terms=[...new Set(normal(query).replace(/interleukin[ -]?6|il[ -]6/g,'il6').match(/[\p{L}\p{N}-]+/gu)||[])].filter(t=>!stop.has(t)&&t.length>2);
 return inflammationRecords.filter(r=>youthMatches(r,filters)).map(r=>{
  const title=normal(r.title).replace(/il-6/g,'il6');
  const text=normal([r.title,r.summary,r.limitation,r.design,r.sourceAccess,r.id,r.doi,r.pmid,...r.targets].join(' ')).replace(/interleukin[ -]?6|il[ -]6/g,'il6');
  const words=new Set(text.match(/[\p{L}\p{N}-]+/gu)||[]),titleWords=new Set(title.match(/[\p{L}\p{N}-]+/gu)||[]);
  return {r,score:terms.reduce((n,t)=>n+(words.has(t)?1:0)+(titleWords.has(t)?2:0),0)};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.r.id.localeCompare(b.r.id)).slice(0,limit).map(x=>x.r);
}
const anchors={
 'dock2-trauma-ptsd':['mehta2017','bainomugisa2021','katrinli2024','hummel2022'],
 'oxtr-il6-inflammation':['szeto2008','ross2013','clodi2008','boutin2025','ditzen2023','schneider2026']
};
export function inflammationKnowledge(args={},origin='https://staging.universalmind.tv'){
 const chapter=chapters.find(c=>c.id===args.id);if(!chapter)return null;
 const register=registers[chapter.id],topic=args.topic?chapter.topics.find(t=>t.id===args.topic):null;
 if(args.topic&&!topic)return null;
 let rows=inflammationRecords.filter(r=>r.researchChapter===chapter.id);
 if(topic){const ids=new Set(topic.papers.map(p=>p.recordId));rows=rows.filter(r=>ids.has(r.id));}
 if(args.query){const eligible=new Set(rows.map(r=>r.id));rows=inflammationSearch(args.query,{},75).filter(r=>eligible.has(r.id));}
 else if(!topic){const keys=anchors[chapter.id],rank=r=>keys.includes(r.key)?keys.indexOf(r.key):100;rows.sort((a,b)=>rank(a)-rank(b));}
 const offset=Math.max(0,Number(args.offset)||0),limit=6;
 return {id:chapter.id,title:chapter.title,url:`${origin}/informatics/research/?collection=general&chapter=${chapter.number}`,version:inflammationVersion,reviewedAt:register.reviewedAt,sourceCount:register.sourceCount,reviewMethod:register.reviewMethod,overview:chapter.overview,evidenceOverview:chapter.evidenceOverview,evidenceOverviewNote:chapter.evidenceOverviewNote,biomarkers:register.biomarkers,
  topics:(topic?[topic]:chapter.topics).map(({papers,paragraphs,paragraphSources,...t})=>({...t,...(topic?{paragraphs,paragraphSources}:{}),sourceIds:papers.map(p=>p.recordId)})),
  matchedRecords:rows.length,offset,nextOffset:offset+limit<rows.length?offset+limit:null,records:rows.slice(offset,offset+limit),
  downloads:Object.fromEntries(['json','csv','reading'].map(k=>[k,`${origin}/informatics/${chapter.researchRegister[k]}`])),
  knowledgeMethod:'Versioned retrieval of the published source appraisals and chapter synthesis. Source counts include different evidence types and linked reports; they are not counts of independent experiments. Full-text access remains source-specific. No model fine-tuning.'};
}
