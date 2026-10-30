import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),site=path.join(root,'Informatics');
const read=p=>fs.readFileSync(path.join(site,p),'utf8');
const source=read('library.js'),slice=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const names=['sound-edition','library','publication-access','language-edition','general-edition','mindfulness-expansion','vision-edition','vision-expansion','clinical-conditions','nature-expansion','fulltext-availability','fibonacci-expansion','hyperspectral-expansion'];
const inputs=names.map(n=>JSON.parse(read('library-data/'+n+'.json'))),data=JSON.parse(fs.readFileSync(path.join(root,'research/informatics/communities-contexts-20261030/calibration-snapshot.json'),'utf8'));
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
assert.equal(data.records.length,50);assert.equal(new Set(data.records.map(r=>r.recordId)).size,50);
assert.equal(data.humanReviewedCount,0);
for(const r of data.records){assert.equal(r.reviewStatus,'pending');assert.equal(r.reviewedBy,null);assert.ok(r.evidence.length);for(const e of r.evidence){assert.ok(e.quote.split(/\s+/).length<=25);assert.match(e.url,/^https:\/\//);}for(const m of r.matches)assert.ok(data.taxonomy.some(t=>t.id===m.categoryId));}
for(const r of records)model.attach(r,data);
const assessed=records.filter(r=>r.communityAssessments.length);
const missing=data.records.filter(a=>!assessed.some(r=>r.communityAssessments.includes(a))).map(r=>r.recordId);
assert.deepEqual(missing,[],'Calibration records must exist in the visible deduplicated corpus');
assert.equal(assessed.length,50,'Each calibration record maps to one unique publication');
const rec=id=>records.find(r=>r.id===id || r.aliases.includes(id));
assert.equal(model.matches(rec('pmid-25046280'),'housing'),true);assert.equal(model.matches(rec('pmid-25046280'),'defence'),true);
assert.equal(model.matches(rec('pmid-19654388'),'defence'),false,'Veterans are excluded by this review');
assert.equal(model.matches(rec('pmid-15913391'),'domestic-violence'),true);assert.equal(model.matches(rec('pmid-15913391'),'housing'),false,'A DV shelter does not establish homelessness');
assert.equal(model.matches(rec('pmid-30858808'),'war-trauma'),false);assert.equal(model.matches(rec('pmid-30858808'),'domestic-violence'),false);
assert.equal(model.matches(rec('pmid-30858808'),'domestic-violence',true),true,'Inferred relevance is explicit opt-in');
assert.equal(model.matches(rec('pmid-20193089'),'domestic-violence'),false);assert.equal(model.matches(rec('pmid-20193089'),'domestic-violence',true),true);
assert.equal(model.matches(rec('pmid-29899015'),'war-trauma',true),false,'REWARD is not war exposure');
assert.equal(model.matches(rec('pmid-29228794'),'indigenous',true),false,'Marginalized youth does not establish identity');
assert.equal(model.matches(rec('pmid-30279666'),'defence'),true,'Abstract establishes population absent from title');
assert.equal(rec('pmid-24257410').communityAssessments[0].studyRole,'protocol-population');
const counts=Object.fromEntries(data.taxonomy.map(t=>[t.id,{directAndContext:records.filter(r=>model.matches(r,t.id)).length,includingRelated:records.filter(r=>model.matches(r,t.id,true)).length}]));
const report={passed:true,visibleCorpus:records.length,calibration:assessed.length,unassessed:records.length-assessed.length,statusCounts:data.statusCounts,counts};
fs.writeFileSync(path.join(root,'research/informatics/communities-contexts-20261030/classification-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
