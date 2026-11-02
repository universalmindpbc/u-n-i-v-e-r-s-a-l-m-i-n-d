import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),rel='Informatics/review/youth-20261102',base=path.join(root,rel),prefix='/informatics/review/youth-20261102/';
const out=path.join(root,'research/informatics/youth-20261102/qa');await fs.mkdir(out,{recursive:true});
const live=process.env.STAGING==='1',phase=live?'staging':'candidate';
const index=JSON.parse(await fs.readFile(path.join(base,'index.json'),'utf8')),data=JSON.parse(await fs.readFile(path.join(base,index.batch),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let server,url='https://staging.universalmind.tv'+prefix;
if(!live){
 server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!pathname.startsWith(prefix)){res.writeHead(404);return res.end();}
  const name=decodeURIComponent(pathname.slice(prefix.length))||'index.html';if(name.includes('..')||name.includes('/')){res.writeHead(403);return res.end();}
  const type=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':name.endsWith('.csv')?'text/csv':name.endsWith('.md')?'text/plain':'text/html';
  try{const bytes=await fs.readFile(path.join(base,name));res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end();}
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url='http://127.0.0.1:'+server.address().port+prefix;
}
const browser=await chromium.launch({headless:true,args:['--mute-audio','--disable-background-networking']});
const errors=[],checks=[];
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('#integrity').textContent.startsWith('Batch verified'));
  assert.match(await page.locator('#result-count').innerText(),/^105 records match/);assert.equal(await page.locator('.record').count(),18);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Initial overflow '+width);
  assert.equal(await page.locator('audio,video,iframe').count(),0);
  await page.screenshot({path:path.join(out,phase+'-'+width+'.png'),fullPage:false});
  await page.locator('#next').click();assert.match(await page.locator('#page-count').innerText(),/Page 2/);await page.locator('#clear-filters').click();
  await page.locator('[data-institution="Black Dog Institute"]').click();assert.match(await page.locator('#result-count').innerText(),/^28 records match/);
  await page.locator('[data-institution="Orygen"]').click();assert.match(await page.locator('#result-count').innerText(),/^30 records match/);
  await page.locator('#clear-filters').click();await page.locator('#topic').selectOption('Mantra');assert.equal(await page.locator('.empty').count(),1);await page.locator('#show-all').click();assert.ok(await page.locator('.record').count()>0);
  await page.locator('#clear-filters').click();await page.locator('#existing').selectOption('new');assert.match(await page.locator('#result-count').innerText(),/^100 records match/);
  await page.locator('#clear-filters').click();await page.locator('#query').fill('definitely-no-matching-publication-9999999');assert.equal(await page.locator('.empty').count(),1);
  await page.locator('#clear-filters').click();await page.locator('#query').fill('29622047');assert.equal(await page.locator('.record').count(),1);assert.match(await page.locator('.marker').innerText(),/×××/);
  await page.locator('summary').click();assert.match(await page.locator('details').innerText(),/Approved crosses: not awarded/);assert.match(await page.locator('details').innerText(),/SHA-256/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Details overflow '+width);await page.locator('.record').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,phase+'-evidence-'+width+'.png'),fullPage:false});
  await page.goto(url+'brief.html',{waitUntil:'networkidle'});assert.match(await page.locator('main').innerText(),/105 qualified papers/);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Brief overflow '+width);assert.ok(await page.locator('table').count()>=2);
  await page.goto(url+'index.html#youth-pmid-39720610',{waitUntil:'networkidle'});await page.waitForSelector('#youth-pmid-39720610 details[open]');assert.equal(await page.locator('.record').count(),1);
  if(width===1440){
   for(const [id,file,expected] of [['json-download',index.batch,index.sha256],['csv-download',index.csv,index.csvSHA256]]){
    const pending=page.waitForEvent('download');await page.locator('#'+id).click();const dl=await pending;const dest=path.join(out,phase+'-'+file);await dl.saveAs(dest);assert.equal(sha(await fs.readFile(dest)),expected);await fs.unlink(dest);
   }
   if(live){
    const files=(await fs.readdir(base)).filter(x=>!x.startsWith('.'));const assets=[];
    for(const file of files){const response=await context.request.get(url+file);assert.equal(response.status(),200,file);assert.equal(sha(await response.body()),sha(await fs.readFile(path.join(base,file))),file);assert.match(response.headers()['x-robots-tag']||'',/noindex/);assets.push(file);}
    checks.push({publishedAssetsMatchCommittedBytes:assets,stagingNoindexHeaders:true});
   }
  }
  checks.push({width,qualified:105,qualifiedNew:100,institutionFilters:true,provisionalMantraVisible:true,searchAndEmptyState:true,pagination:true,details:true,directRecordLink:true,brief:true,horizontalOverflow:false});await context.close();
 }
 assert.deepEqual(errors,[]);const report={passed:true,phase,checkedAt:new Date().toISOString(),url,sourceCommit:process.env.SOURCE_COMMIT||null,batchSHA256:index.sha256,audioDisabledAtProcessLaunch:true,errors,checks};await fs.writeFile(path.join(out,phase+'-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
