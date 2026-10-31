import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {dvKnowledge,dvRecord,dvSearch,dvReplaces} from '../cloudflare/informatics-dv-knowledge.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const approved=read('Informatics/library-data/domestic-violence-expansion.json');
const audit=read('Informatics/review/domestic-violence-20261031/audit-16f8e1d36d3f40c4.json');
const sandbox=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'Informatics/library-model.js'),'utf8'),sandbox);
const model=sandbox.UniversalResearchModel;
assert.equal(approved.records.length,117);assert.equal(new Set(approved.records.map(r=>r.id)).size,117);
for(const source of audit.records){
 const record=dvRecord(source.id);
 if(!source.reviewReady){assert.equal(record,undefined);continue;}
 assert.ok(record);assert.equal(record.summary,source.finding);assert.equal(record.limitation,source.limitation);
 assert.equal(record.publicationApproval.sourceContentHash,source.contentHash);
 assert.equal(record.paperTrustAssessment.displayCrosses,source.design.crosses);
 assert.equal(record.paperTrustAssessment.humanApproval,false);
 assert.equal(record.publicationApproval.status,'approved-for-publication');
 assert.deepEqual(record.targets,[]);assert.ok(record.sourceAccess.level);
 assert.equal(model.matchesStudy(record,'trial'),source.studyDesignAssessment.category==='rct');
}
assert.equal(approved.records.filter(r=>model.matchesStudy(r,'trial')).length,51);
assert.equal(approved.records.filter(r=>model.matchesStudy(r,'double-blind')).length,0);
assert.equal(approved.records.filter(r=>model.matchesStudy(r,'review')).length,25);
assert.equal(model.matchesStudy(dvRecord('41024298'),'trial'),false,'An inaccurate RCT title cannot override the audited single-arm design');
assert.equal(dvRecord('dv-sound-15913391').id,'pmid-15913391');
assert.ok(dvReplaces({id:'old-database-alias',data:{doi:'10.1093/mtp/miw004'}}));
for(const [c,count] of Object.entries(approved.counts.collections))assert.equal(dvKnowledge({collection:c}).matchedRecords,count);
for(const [approach,count] of [['emdr',10],['mindfulness',9],['music',8]])assert.equal(dvKnowledge({approach}).matchedRecords,count);
assert.ok(dvSearch('41024298').some(r=>r.pmid==='41024298'));
assert.ok(dvSearch('Strength at Home physical recidivism').some(r=>r.pmid==='26613288'));
assert.deepEqual(dvSearch('OXTR',{targets:['OXTR']}),[]);
const report={passed:true,approved:117,excluded:13,rctReports:51,reviews:25,other:41,doubleBlind:0,allFindingsAndLimitationsPreserved:true,sourceHashesPreserved:true,aliasesResolved:true,noInventedGenes:true,knowledgeRetrievable:true};
fs.writeFileSync(path.join(root,'research/informatics/dv-integration-20261101/integration-checks.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
