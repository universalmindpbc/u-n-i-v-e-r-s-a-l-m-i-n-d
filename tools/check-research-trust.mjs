import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.join(root,'Informatics');
const read=p=>fs.readFileSync(path.join(site,p),'utf8');
const source=read('library.js');
const slice=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const names=['sound-edition','library','publication-access','language-edition','general-edition','mindfulness-expansion','vision-edition','vision-expansion','clinical-conditions','nature-expansion','fulltext-availability','fibonacci-expansion'];
const context=vm.createContext({inputs:names.map(n=>JSON.parse(read('library-data/'+n+'.json')))});
vm.runInContext(read('library-model.js'),context);
vm.runInContext(`const model=globalThis.UniversalResearchModel;
let publicationAccess={},clinicalConditions={},editions={},papers=[];
${slice('  const normalize =','  const model =')}
const quoteText=quote=>quote.map(span=>span.text).join('');
${slice('  function buildRecords(data) {','  function search()')}
const [sound,data,access,language,general,expansion,vision,visionExpansion,conditions,natureExpansion,fulltexts,fibonacciExpansion]=inputs;
${slice('      publicationAccess =',"      $('#condition')")}
${slice('      editions = {sound,language,general,vision};','      const allTargets=')}
globalThis.records=buildRecords(data);globalThis.books=editions;`,context);
const model=context.UniversalResearchModel;
const records=context.records;
const counts={};
for(const collection of ['sound','vision','language','general','all']){
 const rs=records.filter(r=>collection==='all'||r.collections.includes(collection));
 counts[collection]={papers:rs.length,scores:{},singleBlind:rs.filter(r=>model.matchesStudy(r,'single-blind')).length,doubleBlind:rs.filter(r=>model.matchesStudy(r,'double-blind')).length,rct:rs.filter(r=>model.matchesStudy(r,'trial')).length};
 for(const score of [1,2,3,null])counts[collection].scores[String(score)]=rs.filter(r=>model.paperTrustScore(r)===score).length;
 assert.equal(counts[collection].rct,counts[collection].scores[2]+counts[collection].scores[3]);
 assert.equal(counts[collection].doubleBlind,counts[collection].scores[3]);
}
assert.equal(records.length,892,'All publications retained; a corrected quantum-review citation no longer merged into the military trial');
const warrior=records.find(r=>r.id==='src-6d277422d0a0');
assert.equal(model.paperTrustScore(warrior),3);
const quantumReview=records.find(r=>r.id==='src-9329423f6826');
assert.equal(quantumReview.doi,'10.1002/wcms.1481');
assert.equal(model.paperTrustScore(quantumReview),1);
assert.ok(model.matchesStudy(warrior,'double-blind'));
assert.equal(model.matchesPaperTrust(warrior,2),false);
const chapter=context.books.sound.chapters.flatMap(c=>c.topics).find(t=>t.id==='xx');
assert.equal(chapter.trustAssessment.counts.rct,2,'Repeated Sound Mind Warrior reports count once');
assert.equal(chapter.trustScore,null,'Two verified trials do not meet the three-trial threshold');
const tms=context.books.sound.chapters.flatMap(c=>c.topics).find(t=>t.id==='xiv');
assert.equal(tms.trustScore,3);
assert.equal(tms.trustAssessment.counts['double-blind-rct'],4);
assert.equal(model.paperTrustScore({topics:[{trustScore:3}]}),null);
assert.equal(model.matchesStudy({design:'Peer-reviewed research'},'review'),false);
for(const r of records){
 assert.ok(r.paperTrustAssessment, 'Missing paper assessment '+r.id);
 if(r.paperTrustAssessment.blinding==='not-confirmed')assert.equal(model.matchesStudy(r,'single-blind'),false);
 for(const p of r.chapterEntries)assert.equal(p.paperTrustAssessment.score,r.paperTrustAssessment.score,'Inconsistent paper rating '+r.id);
}
const result={passed:true,counts,checks:['all publication records retained','paper and chapter scores independent','RCT filters include all recorded blinding types','unspecified blinding never labelled single-blind','chapter thresholds count distinct trials','chapter browsing and search share paper ratings','Sound Mind Warrior has three crosses','TMS chapter has four double-blind trials'],manualFullTextAuditOfEveryPaper:false};
fs.mkdirSync(path.join(root,'research/informatics/trust-factor-20261027'),{recursive:true});
fs.writeFileSync(path.join(root,'research/informatics/trust-factor-20261027/model-verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
