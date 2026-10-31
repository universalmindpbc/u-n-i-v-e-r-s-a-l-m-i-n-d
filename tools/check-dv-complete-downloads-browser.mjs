import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'Informatics/exports/manifest.json'),'utf8'));
const browser=await chromium.launch({headless:true,args:['--mute-audio']});
const context=await browser.newContext({acceptDownloads:true});
await context.route(/\.(mp4|mp3|wav|m3u8|m4s|ts)(\?|$)/,r=>r.abort());
const page=await context.newPage(),requests=[],downloads=[];
page.on('request',r=>{if(r.url().includes('/exports/manifest.json'))requests.push(r.url());});
try{
 await page.goto('https://staging.universalmind.tv/informatics/connect.html#downloads',{waitUntil:'domcontentloaded'});
 const frame=page.frameLocator('#connect-frame');
 await frame.locator('#complete-download-status').filter({hasText:'1,182 data files'}).waitFor({timeout:60000});
 for(const format of ['json','csv']){
  const pending=page.waitForEvent('download',{timeout:240000});
  await frame.locator(`[data-complete-download="${format}"]`).click();
  const download=await pending;const filename='/tmp/dv-staging-complete.'+format+'.gz';await download.saveAs(filename);
  const data=await fs.readFile(filename),sha256=crypto.createHash('sha256').update(data).digest('hex');
  assert.equal(sha256,manifest.downloads[format].sha256);assert.equal(data.length,manifest.downloads[format].bytes);
  await frame.locator('#complete-download-status').filter({hasText:manifest.dataset_version.slice(0,12)}).waitFor();
  downloads.push({format,bytes:data.length,sha256,filename:download.suggestedFilename()});console.log('Verified actual browser download',format,data.length);
 }
 assert.ok(requests.length>=3&&requests.every(u=>new URL(u).searchParams.has('snapshot')));
 assert.equal(new Set(requests).size,requests.length);
 const report={passed:true,actualNativeDownloads:true,mutedBrowser:true,freshManifestRequests:requests.length,datasetVersion:manifest.dataset_version,downloads};
 await fs.writeFile(path.join(root,'research/informatics/dv-integration-20261101/staging-complete-downloads.json'),JSON.stringify(report,null,2)+'\n');
}finally{for(const f of page.frames())await f.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});await browser.close();}
