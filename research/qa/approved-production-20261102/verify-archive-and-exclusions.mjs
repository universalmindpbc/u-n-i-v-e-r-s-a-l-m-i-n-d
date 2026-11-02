import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=process.cwd(),out=root+'/research/qa/approved-production-20261102';
const scope=JSON.parse(await fs.readFile(out+'/scope.json')),integrity=JSON.parse(await fs.readFile(out+'/source-integrity.json'));
const headers={'User-Agent':'Mozilla/5.0 UniversalMind-Production-Verification'};
const queue=integrity.files.filter(x=>x.path.startsWith('Informatics/exports/')&&x.path.endsWith('.bin')),results=[];
async function worker(){while(queue.length){const item=queue.shift(),url='https://universalmind.tv/'+item.path.replace('Informatics/','informatics/');const r=await fetch(url,{method:'HEAD',headers});assert.equal(r.status,200,url);const bytes=(await fs.stat(root+'/'+item.path)).size;assert.equal(Number(r.headers.get('content-length')),bytes,url);results.push({path:item.path,status:r.status,bytes,localSHA256:item.sha256,check:'Production HTTP size; committed local checksum'});}}
await Promise.all(Array.from({length:4},worker));
const excluded=[];for(const path of scope.excludedLaterFiles.filter(p=>p.startsWith('Informatics/'))){const r=await fetch('https://universalmind.tv/'+path.replace('Informatics/','informatics/'),{method:'HEAD',headers,redirect:'manual'});assert.equal(r.status,404,path);excluded.push({path,status:r.status});}
await fs.writeFile(out+'/archive-and-exclusions.json',JSON.stringify({passed:true,archives:results,excludedYouthReview:excluded},null,2)+'\n');
console.log(JSON.stringify({passed:true,archiveParts:results.length,excludedYouthFiles:excluded.length}));
