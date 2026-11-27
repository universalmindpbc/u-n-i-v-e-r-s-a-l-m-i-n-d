import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflammationRecords as records,inflammationRecord as lookup,inflammationSearch as search,inflammationChapters as subjects,inflammationKnowledge as guide,inflammationVersion} from '../cloudflare/informatics-inflammation-knowledge.js';
import {repository,recordsCSV} from '../cloudflare/informatics-repository.js';
import {connectorTools,openAPI} from '../cloudflare/informatics-connectors.js';

let checks=0;
function check(name,run){run();checks++;console.log('PASS '+name);}
const registers=await Promise.all(['dock2','oxtr-il6','il6-mental-health'].map(async n=>JSON.parse(await readFile(new URL('../Informatics/library-data/'+n+'-research-register.json',import.meta.url)))));
const library=JSON.parse(await readFile(new URL('../Informatics/library-data/library.json',import.meta.url)));
check('All 195 source records preserve current appraisals and identifiers',()=>{
 assert.equal(records.length,195);assert.equal(new Set(records.map(r=>r.id)).size,195);
 for(const source of registers.flatMap(r=>r.records)){
  const record=lookup(source.recordId);assert(record);
  const canonical=library.records.find(r=>r.id===record.id);assert(canonical);
  assert.deepEqual(record.collections,canonical.collections);
  assert.deepEqual(record.conditions,canonical.conditions||[]);
  for(const field of Object.keys(source))assert.deepEqual(record[field],source[field]);
  for(const id of [record.id,record.doi,record.pmid,...record.aliases].filter(Boolean))assert.equal(lookup(id),record);
  if(record.doi)assert.equal(lookup('HTTPS://DOI.ORG/'+record.doi.toUpperCase()),record);
 }
});
check('Chapter pages cover the complete registers without duplicates',()=>{
 for(const chapter of inflammationVersion.chapters){
  let offset=0,all=[];
  do{const page=guide({id:chapter.id,offset});all.push(...page.records.map(r=>r.id));offset=page.nextOffset;}while(offset!==null);
  assert.equal(all.length,chapter.sourceRecords);assert.equal(new Set(all).size,all.length);
  const first=guide({id:chapter.id});
  for(const topic of first.topics){const detail=guide({id:chapter.id,topic:topic.id});assert(Array.isArray(detail.topics[0].paragraphs));assert(detail.topics[0].description);assert(detail.records.every(r=>topic.sourceIds.includes(r.id)));}
 }
 assert.equal(guide({id:'missing'}),null);assert.equal(guide({id:'oxtr-il6-inflammation',topic:'missing'}),null);
});
check('Evidence boundaries, negative findings and linked reports remain available',()=>{
 const o=guide({id:'oxtr-il6-inflammation'});
 assert(o.overview.join(' ').includes('mixed'));assert.equal(o.biomarkers.length,10);
 for(const key of ['ross2013','boutin2025','clodi2008'])assert(o.records.some(r=>r.key===key));
 const linked=records.filter(r=>['ditzen2023','schneider2026'].includes(r.key));assert.equal(linked[0].studyFamilyId,linked[1].studyFamilyId);
 assert(guide({id:'dock2-trauma-ptsd'}).records.some(r=>r.key==='katrinli2024'));
});
check('Target detection and follow-ups preserve subject without gene conflation',()=>{
 assert.deepEqual(subjects('IL-6 and mental health'),['il6-mental-health']);
 assert.deepEqual(subjects('IL-6 and depression'),['il6-mental-health']);
 assert.deepEqual(subjects('OXTR and IL-6'),['oxtr-il6-inflammation']);
 assert.deepEqual(subjects('DOCK2 and IL6'),['dock2-trauma-ptsd','oxtr-il6-inflammation']);
 assert.deepEqual(subjects('What are its limits?',[{role:'user',content:'DOCK2 in PTSD'}]),['dock2-trauma-ptsd']);
 assert.deepEqual(subjects('What are its limits?',[{role:'user',content:'DOCK2 in PTSD'},{role:'user',content:'Explain music therapy'}]),[]);
 assert.deepEqual(subjects('Explain that more',[{role:'user',content:'DOCK2 in PTSD'},{role:'user',content:'What are its limits?'}]),['dock2-trauma-ptsd']);
 for(const q of ['DOC2','CK2','Pisano periods','Music and youth'])assert.deepEqual(subjects(q,[{role:'user',content:'OXTR and IL6'}]),[]);
 assert.equal(search('CK2').length,0);
});
check('Queries support IL-6 synonyms, exact lookup and collection filters',()=>{
 for(const query of ['IL-6','IL6','interleukin 6'])assert(search(query).length>0);
 assert.equal(search('18593851')[0].key,'clodi2008');assert.equal(search('18593851',{collections:['sound']}).length,0);
 assert(search('DOCK2',{collections:['general'],targets:['DOCK2']}).every(r=>r.targets.includes('DOCK2')));
 assert.equal(search('zzzxxyz').length,0);
});

// Simulate a stale DB record with a different ID but the same DOI. The overlay replaces it
// across counts, exports and lookups, and pagination remains lossless at the boundary.
const db={query:async(sql,args=[])=>{
 if(sql.includes('(SELECT count(*)::int FROM research.publications)'))return [{publications:3,atlas:1001,full_texts:1,public_full_texts:1,m9_family:100}];
 if(sql.startsWith('SELECT count(*)::int total FROM research.publications p WHERE (p.id=')){
  assert(args[1].includes('10.1111/acps.12778'));return [{total:1}];
 }
 if(sql.startsWith('SELECT count(*)::int total FROM research.publications p WHERE')){assert(sql.includes('AND NOT'));assert(args[6].includes('10.1111/acps.12778'));return [{total:2}];}
 if(sql.startsWith('SELECT p.id,p.data FROM research.publications p WHERE'))return [{id:'db-a',data:{title:'Retained A'}},{id:'db-b',data:{title:'Retained B'}}].slice(args[9],args[9]+args[8]);
 throw Error('Unexpected query '+sql);
}};
const repo=repository(db,{DATASET_VERSION:'fixture',ALLOWED_ORIGIN:'https://staging.universalmind.tv'},'https://api.example');
const inventory=await repo.inventory();let offset=0,all=[];
do{const result=await repo.publications({limit:100,offset});all.push(...result.records);offset=result.page.nextOffset;}while(offset!==null);
check('Repository union, duplicate exclusion and pagination agree',()=>{
 assert.equal(all.length,inventory.counts.publications);assert.equal(new Set(all.map(r=>r.id)).size,all.length);
 for(const r of records)assert.deepEqual(all.find(x=>x.id===r.id),r);
 assert.equal(inventory.coverage.inflammationSourceRecords,195);
 assert(inventory.datasetVersion.includes(inflammationVersion.sourceSHA256.slice(0,12)));
 assert(recordsCSV(records,'publications').includes('No validated Universal Mind'));
});
for(const r of records)assert.deepEqual((await repo.publication(r.id)).record,r);
const chapter=await repo.call('get_research_chapter',{id:'oxtr-il6-inflammation',topic:'oxtr-il6-il6'});
check('REST and MCP expose the same chapter and biomarker narrative',()=>{
 assert.equal(chapter.topics[0].id,'oxtr-il6-il6');assert.equal(chapter.sourceCount,42);
 assert(connectorTools.some(t=>t.name==='get_research_chapter'));
 assert(openAPI({ALLOWED_ORIGIN:'https://staging.universalmind.tv'},'https://api.example').paths['/api/v1/research-chapters/{id}']);
});
check('Mental-health questions retrieve condition-specific narrative and full appraisals',()=>{
 for(const [query,key] of [['IL6 and depression','depression'],['IL6 schizophrenia','psychosis'],['IL6 bipolar depression','bipolar'],['IL6 mania','mania'],['IL6 hypomania','hypomania'],['IL6 anxiety','anxiety'],['IL6 PTSD','ptsd'],['IL6 suicidal ideation','suicidality'],['IL6 ADHD','adhd'],['IL6 alcohol','alcohol'],['IL6 opioids','opioids'],['IL6 methamphetamine','stimulants']]){
  const result=guide({id:'il6-mental-health',query});
  assert(result.matchedNarratives.some(t=>t.id==='il6-mental-health-'+key),query);
  assert(result.records.length>0,query);assert.equal(result.mentalHealthPublicationCount,117);
 }
 assert.equal(lookup('37069570').blinding,'open-label');
 assert.equal(lookup('33719920').randomizedControlledTrial,false);
 assert.match(lookup('42160062').summary,/no statistically significant/);
 assert.match(lookup('40305022').summary,/did not reduce/);
 assert.match(lookup('36052304').summary,/did not significantly/);
});
console.log(JSON.stringify({passed:true,checks,sourceRecords:records.length,version:inflammationVersion}));
