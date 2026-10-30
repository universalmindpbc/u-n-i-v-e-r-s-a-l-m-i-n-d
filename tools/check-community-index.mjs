import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),site=path.join(root,'Informatics');
const read=p=>fs.readFileSync(path.join(site,p),'utf8');
const source=read('library.js'),slice=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const names=['sound-edition','library','publication-access','language-edition','general-edition','mindfulness-expansion','vision-edition','vision-expansion','clinical-conditions','nature-expansion','fulltext-availability','fibonacci-expansion','hyperspectral-expansion'];
const inputs=names.map(n=>JSON.parse(read('library-data/'+n+'.json'))),data=JSON.parse(read('library-data/community-index.json'));
const context=vm.createContext({inputs,data});
vm.runInContext(read('library-model.js'),context);vm.runInContext(read('library-communities.js'),context);
vm.runInContext(`const model=globalThis.UniversalResearchModel;let publicationAccess={},clinicalConditions={},editions={},papers=[];
${slice('  const normalize =','  const model =')}
const quoteText=quote=>quote.map(span=>span.text).join('');
${slice('  function buildRecords(data) {','  function search()')}
const [sound,data0,access,language,general,expansion,vision,visionExpansion,conditions,natureExpansion,fulltexts,fibonacciExpansion,hyperspectralExpansion]=inputs;
let data=data0;
${slice('      publicationAccess =',"      $('#condition')")}
${slice('      editions = {sound,language,general,vision};','      const allTargets=')}
globalThis.records=buildRecords(data);`,context);
const records=context.records,model=context.UniversalResearchCommunities;
const audit=JSON.parse(fs.readFileSync(path.join(root,'research/informatics/communities-full-20261030/classification-audit.json'),'utf8'));
const baseline=JSON.parse(fs.readFileSync(path.join(root,'research/informatics/communities-contexts-20261030/calibration-snapshot.json'),'utf8'));
assert.equal(records.length,1108);
assert.equal(data.records.length,records.length);
assert.equal(audit.records.length,records.length);
assert.deepEqual(new Set(data.records.map(r=>r.recordId)),new Set(records.map(r=>r.id)));
assert.equal(new Set(audit.records.map(r=>r.recordId)).size,records.length);
for(const row of data.records){assert.deepEqual(Object.keys(row).sort(),['matches','recordId']);for(const m of row.matches){assert.ok(data.taxonomy.some(t=>t.id===m.categoryId));assert.ok(['direct','context','related'].includes(m.relation));}}
for(const record of records){model.attach(record,data);assert.equal(record.communityAssessments.length,1);assert.equal('communityReview' in record,false);}
assert.equal(audit.humanReviewedCount,50);
assert.equal(audit.records.filter(r=>r.reviewStatus==='approved').length,50);
for(const original of baseline.records){const row=audit.records.find(r=>r.recordId===original.recordId);assert.deepEqual(row.matches,original.matches);assert.equal(row.reviewStatus,'approved');assert.equal(row.reviewedBy,'Universal Mind');}
for(const row of audit.records){if(row.reviewStatus==='pending')assert.equal(row.reviewedBy,null);for(const e of row.evidence){assert.ok(e.quote.split(/\s+/).length<=25);assert.match(e.url,/^https?:\/\//);}}
const rec=id=>records.find(r=>r.id===id);
const has=(id,cat,related=false)=>model.matches(rec(id),cat,related);
assert.ok(has('pmid-25046280','housing')&&has('pmid-25046280','defence'));
assert.ok(has('pmid-31645664','defence'),'Abstract establishes soldiers absent from title');
assert.ok(has('pmid-36658116','war-trauma')&&!has('pmid-36658116','defence'),'Civilian conflict survivors are not assigned to armed services');
assert.ok(has('pmid-39758524','domestic-violence'));
assert.equal(rec('pmid-39758524').communityMatches[0].relation,'context');
assert.ok(!has('pmid-15913391','housing'),'A domestic-violence shelter does not establish homelessness');
assert.ok(!has('pmid-19654388','defence'),'Excluded veterans are not included in the review population');
assert.ok(!has('doi-53aa4106dfd35960','indigenous'),'Indigenous disciplinary theory is not Indigenous peoples');
assert.ok(!has('src-453f6cf677d9','indigenous'));
assert.ok(!has('src-0d9b2343d896','defence'),'Love Army is not an armed service');
assert.ok(!has('src-6d277422d0a0','war-trauma'),'Combat stress is not evidence of combat exposure');
assert.ok(!has('hsi-30eaacfb450209','defence'),'Hospital affiliation does not establish patient population');
assert.ok(!has('hsi-ee301b86285079','war-trauma'),'Combating measurement errors is not war trauma');
assert.ok(!has('pmid-36350591','indigenous'),'A combined demographic category does not establish a distinct Indigenous sample');
assert.ok(!has('src-f265f80eb04c','indigenous'),'Conflicting source identity stays unresolved');
assert.ok(!has('pmid-20193089','domestic-violence')&&has('pmid-20193089','domestic-violence',true));
assert.ok(!has('pmid-30858808','war-trauma')&&has('pmid-30858808','war-trauma',true));
assert.ok(!has('pmid-30760920','war-trauma',true),'Mouse mechanism alone does not establish community relevance');
assert.ok(!has('pmid-29899015','war-trauma',true),'REWARD is not a war term');
assert.ok(!has('pmid-29228794','indigenous',true),'Marginalized youth does not establish Indigenous identity');
const counts=Object.fromEntries(data.taxonomy.map(t=>[t.id,{directAndContext:records.filter(r=>model.matches(r,t.id)).length,includingRelated:records.filter(r=>model.matches(r,t.id,true)).length}]));
assert.deepEqual(counts,{'refugees':{directAndContext:97,includingRelated:133},'housing':{directAndContext:38,includingRelated:79},'defence':{directAndContext:56,includingRelated:84},'indigenous':{directAndContext:21,includingRelated:34},'domestic-violence':{directAndContext:5,includingRelated:62},'war-trauma':{directAndContext:24,includingRelated:79}});
const overlay=JSON.parse(fs.readFileSync(path.join(root,'research/informatics/communities-related-20261030/related-assessments.json'),'utf8'));
assert.equal(overlay.screenedRecordCount,1108);
assert.equal(overlay.links.length,118);
assert.equal(new Set(overlay.links.map(l=>l.recordId+'|'+l.categoryId)).size,118);
for(const link of overlay.links){
 assert.equal(link.reviewStatus,'pending');assert.equal(link.reviewedBy,null);assert.equal(link.relation,'related');
 assert.ok(link.rationale&&link.transferLimit&&link.sourceVerification);
 assert.ok(link.anchorRecordIds.length);
 for(const id of link.anchorRecordIds)assert.ok(audit.records.find(r=>r.recordId===id)?.matches.some(m=>m.categoryId===link.categoryId&&m.relation!=='related'));
 assert.ok(has(link.recordId,link.categoryId,true));assert.ok(!has(link.recordId,link.categoryId));
}
for(const original of audit.records)for(const match of original.matches)assert.ok(data.records.find(r=>r.recordId===original.recordId).matches.some(m=>m.categoryId===match.categoryId&&m.relation===match.relation));
for(const category of ['defence','refugees','housing','indigenous'])assert.ok(counts[category].includingRelated>counts[category].directAndContext);
assert.ok(has('pmid-35820992','indigenous',true),'Null youth mindfulness finding remains discoverable');
assert.ok(has('pmid-33709117','housing',true),'Neutral pediatric PTSD outcome remains discoverable');
assert.ok(!has('pmid-40749778','indigenous',true),'Mouse light-schedule experiment is not community evidence');
const html=read('library.html');assert.doesNotMatch(html,/calibration|Awaiting Universal Mind review|50.paper/i);assert.doesNotMatch(source,/community-coverage|calibration-only|community-evidence|Calibration · pending review/);
const report={passed:true,visibleCorpus:records.length,assessed:data.records.length,unassessed:0,humanApproved:50,directOrContextual:records.filter(r=>r.communityMatches.some(m=>m.relation!=='related')).length,includingRelated:records.filter(r=>r.communityMatches.length).length,baselineStatusCounts:audit.statusCounts,newRelatedLinks:overlay.links.length,newRelatedPapers:new Set(overlay.links.map(l=>l.recordId)).size,counts};
fs.writeFileSync(path.join(root,'research/informatics/communities-related-20261030/classification-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));

export {records};
