// Read-only retrieval of the published General chapters. No database mutation or fine-tuning.
import {createHash} from 'node:crypto';
import edition from '../Informatics/library-data/general-edition.json' with {type:'json'};
import library from '../Informatics/library-data/library.json' with {type:'json'};
import dock2 from '../Informatics/library-data/dock2-research-register.json' with {type:'json'};
import oxtr from '../Informatics/library-data/oxtr-il6-research-register.json' with {type:'json'};
import mental from '../Informatics/library-data/il6-mental-health-research-register.json' with {type:'json'};
import {youthMatches} from './informatics-youth-knowledge.js';

const registers={'dock2-trauma-ptsd':dock2,'oxtr-il6-inflammation':oxtr,'il6-mental-health':mental};
const chapters=edition.chapters.filter(c=>registers[c.id]);
const libraryById=new Map(library.records.map(r=>[r.id,r]));
const normal=value=>String(value||'').trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//,'').replace(/[‐‑–—]/g,'-');
export const inflammationRecords=chapters.flatMap(c=>registers[c.id].records.map(r=>{
 const papers=c.topics.flatMap(t=>t.papers).filter(p=>p.recordId===r.recordId);
 const metadata=libraryById.get(r.recordId);
 return {...papers[0],...r,id:r.recordId,aliases:[...new Set(papers.map(p=>p.id).filter(Boolean))],collections:metadata?.collections||['general'],conditions:metadata?.conditions||[],researchChapter:c.id,reviewedAt:registers[c.id].reviewedAt};
}));
const byIdentity=new Map(inflammationRecords.flatMap(r=>[r.id,r.doi,r.pmid,...r.aliases].filter(Boolean).map(id=>[normal(id),r])));
export const inflammationRecord=id=>byIdentity.get(normal(id));
export const inflammationReplaces=row=>!![row.id,row.data?.doi,row.data?.pmid].filter(Boolean).find(inflammationRecord);
export const inflammationVersion={version:'general-inflammation-20261128-v5',sourceSHA256:createHash('sha256').update(JSON.stringify({chapters,registers,classifications:inflammationRecords.map(({id,collections,conditions})=>({id,collections,conditions}))})).digest('hex'),sourceRecords:inflammationRecords.length,chapters:chapters.map(c=>({id:c.id,number:c.number,sourceRecords:registers[c.id].sourceCount,reviewedAt:registers[c.id].reviewedAt}))};

function directChapters(query){
 const q=normal(query),ids=[];
 if(/\bdock\s*2\b|\bcg16277944\b/.test(q))ids.push('dock2-trauma-ptsd');
 const il6=/\bil[ -]?6\b|interleukin[ -]?6/.test(q);
 const clinical=/mental|psychiatr|depress|schizophren|psychosis|psychotic|bipolar|mani[ac]|anxiety|ptsd|trauma|suicid|adhd|attention.deficit|addiction|substance|alcohol|opioid|methadone|heroin|stimulant|methamphetamine|cocaine|cannabis|nicotine|smoking/.test(q);
 const oxtr=/\b(?:oxytocin|oxtr)\b/.test(q);
 if(il6&&clinical)ids.push('il6-mental-health');
 if((il6&&(!clinical||oxtr))||(oxtr&&/inflamma|cytokine|immune/.test(q)))ids.push('oxtr-il6-inflammation');
 const record=inflammationRecord(query);if(record)ids.push(record.researchChapter);
 return [...new Set(ids)];
}
export function inflammationChapters(query,history=[]){
 const direct=directChapters(query);if(direct.length)return direct;
 // Carry the subject only for short, referential follow-ups, never a new unrelated topic.
 const referential=q=>/\b(?:it|its|they|them|those|that|this|these|both|same|more|follow.up)\b/i.test(q);
 if(!referential(query))return [];
 for(const m of history.slice(-6).reverse()){
  if(m.role!=='user')continue;
  const previous=directChapters(m.content||'');if(previous.length)return previous;
  if(!referential(m.content||''))return [];
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
 'il6-mental-health':['mental-42160062','mental-29090685','mental-40305022','mental-34413283','mental-27476619','mental-38725444'],
 'oxtr-il6-inflammation':['szeto2008','ross2013','clodi2008','boutin2025','ditzen2023','schneider2026']
};

const clinicalRoutes=[
 ['hypomania',/hypomani/i],['mania',/(?<!hypo)mani[ac]/i],['bipolar',/bipolar/i],
 ['depression',/depress/i],['psychosis',/schizophren|psychosis|psychotic/i],
 ['ptsd',/ptsd|trauma/i],['anxiety',/anxiety|panic|gad|phobia/i],
 ['suicidality',/suicid|self.harm/i],['adhd',/adhd|attention.deficit/i],
 ['alcohol',/alcohol|drinking|\baud\b/i],['opioids',/opioid|methadone|heroin/i],
 ['stimulants',/stimulant|methamphetamine|cocaine/i],['cannabis-nicotine',/cannabis|nicotine|tobacco|smoking/i]
];
const clinicalAnchors=['42160062','29090685','30322824','40305022','39128677','36052304','24568073','32256407','42287409','35660454','34413283','38725444','23612048','34778863','36938380','37779624','41272690','27476619','25451609','39504756','37424424'];
function relevantNarratives(chapter,query){
 if(!query||chapter.id!=='il6-mental-health')return [];
 const keys=clinicalRoutes.filter(([key,rx])=>rx.test(query)&&!(key==='depression'&&/bipolar/i.test(query))).map(([key])=>key);
 if(/addiction|substance.use/i.test(query)&&!keys.some(k=>['alcohol','opioids','stimulants'].includes(k)))keys.push('alcohol','opioids','stimulants');
 if(!keys.length&&/mental|psychiatr|illness|disease|all.*literature|systems|hypothesis/i.test(query))keys.push('mental-health-map','systems-hypothesis');
 return keys.map(k=>chapter.topics.find(t=>t.id==='il6-mental-health-'+k)).filter(Boolean).slice(0,3);
}

export function inflammationKnowledge(args={},origin='https://staging.universalmind.tv'){
 const chapter=chapters.find(c=>c.id===args.id);if(!chapter)return null;
 const narratives=relevantNarratives(chapter,args.query||'');
 const register=registers[chapter.id],topic=args.topic?chapter.topics.find(t=>t.id===args.topic):null;
 if(args.topic&&!topic)return null;
 let rows=inflammationRecords.filter(r=>r.researchChapter===chapter.id);
 if(topic){const ids=new Set(topic.papers.map(p=>p.recordId));rows=rows.filter(r=>ids.has(r.id));}
 if(args.query){
  const topicIds=new Set(narratives.flatMap(t=>t.papers.map(p=>p.recordId)));
  const eligible=new Set(rows.filter(r=>!topicIds.size||topicIds.has(r.id)).map(r=>r.id));
  rows=inflammationSearch(args.query,{},500).filter(r=>eligible.has(r.id));
  if(narratives.length){
   const ranked=rows.map((r,i)=>({r,i,anchor:clinicalAnchors.includes(r.pmid)}));
   rows=ranked.sort((a,b)=>Number(b.anchor)-Number(a.anchor)||a.i-b.i).map(x=>x.r);
  }
 }
 else if(!topic){const keys=anchors[chapter.id],rank=r=>keys.includes(r.key)?keys.indexOf(r.key):100;rows.sort((a,b)=>rank(a)-rank(b));}
 const offset=Math.max(0,Number(args.offset)||0),limit=6;
 return {id:chapter.id,title:chapter.title,url:`${origin}/informatics/research/?collection=general&chapter=${chapter.number}`,version:inflammationVersion,reviewedAt:register.reviewedAt,sourceCount:register.sourceCount,reviewMethod:register.reviewMethod,overview:chapter.overview,evidenceOverviewTitle:chapter.evidenceOverviewTitle,evidenceOverviewIntro:chapter.evidenceOverviewIntro,evidenceOverview:chapter.evidenceOverview,evidenceOverviewNote:chapter.evidenceOverviewNote,biomarkers:register.biomarkers,
  topics:(topic?[topic]:chapter.topics).map(({papers,paragraphs,paragraphSources,...t})=>({...t,...(topic?{paragraphs,paragraphSources}:{}),sourceIds:papers.map(p=>p.recordId)})),
  matchedNarratives:narratives.map(({papers,...t})=>t),mentalHealthPublicationCount:register.mentalHealthPublicationCount||null,expansionPublicationCount:register.expansionPublicationCount||null,matchedRecords:rows.length,offset,nextOffset:offset+limit<rows.length?offset+limit:null,records:rows.slice(offset,offset+limit),
  downloads:Object.fromEntries(['json','csv','reading'].map(k=>[k,`${origin}/informatics/${chapter.researchRegister[k]}`])),
  knowledgeMethod:'Versioned retrieval of the published source appraisals and chapter synthesis. Source counts include different evidence types and linked reports; they are not counts of independent experiments. Full-text access remains source-specific. No model fine-tuning.'};
}
