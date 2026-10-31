import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),origin='https://staging.universalmind.tv';
const manifest=JSON.parse(await fs.readFile(path.join(root,'Informatics/exports/manifest.json'),'utf8'));
const paths=['Informatics/library.js','Informatics/library.html','Informatics/library-data/domestic-violence-expansion.json','Informatics/library-data/community-index.json','Informatics/library-data/age-index.json','Informatics/exports/manifest-'+manifest.dataset_version+'.json','Informatics/complete-downloads.js','Informatics/connect.html','Informatics/llms.txt','Informatics/read/index.html','Informatics/read/publications/index.html','Informatics/read/publications/pmid-15913391-3c919d2a.html','Informatics/read/publications/src-47a527b4dc03-d3194c22.html','sitemap.xml','llms.txt','read/index.html','read/resources.json'];
const browser=await chromium.launch({headless:true,args:['--mute-audio']});
const results=[];
try{
 const page=await browser.newPage();await page.goto(origin+'/informatics/read/access.html',{waitUntil:'domcontentloaded'});
 for(const local of paths){
  const url=origin+'/'+local.replace(/^Informatics\//,'informatics/');
  const result=await page.evaluate(async url=>{const r=await fetch(url,{cache:'no-store'});const b=await r.arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',b);return {url,status:r.status,bytes:b.byteLength,sha256:Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('')};},url);
  assert.equal(result.status,200);const data=await fs.readFile(path.join(root,local));assert.equal(result.sha256,crypto.createHash('sha256').update(data).digest('hex'),local);results.push(result);console.log('Verified',local,result.bytes);
 }
 const report={passed:true,sourceFilesAndPartsMatched:results.length,completeExportVersion:manifest.dataset_version,completeExportPartsVerifiedBy:'check-dv-complete-downloads-browser.mjs',results};
 await fs.writeFile(path.join(root,'research/informatics/dv-integration-20261101/staging-integrity.json'),JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
