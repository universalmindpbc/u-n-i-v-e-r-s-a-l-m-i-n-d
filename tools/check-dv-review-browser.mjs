import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rel='review/domestic-violence-20261030/';
const site=path.join(root,'Informatics');
const out=path.join(root,'research/informatics/dot-dv-20261030/qa');await fs.mkdir(out,{recursive:true});
const live=process.env.STAGING==='1',phase=live?'staging':'candidate';
const url='https://staging.universalmind.tv/informatics/'+rel;
const index=JSON.parse(await fs.readFile(path.join(site,rel,'index.json'),'utf8'));
const data=JSON.parse(await fs.readFile(path.join(site,rel,index.batch),'utf8'));
const browser=await chromium.launch({headless:true,args:['--mute-audio','--disable-background-networking']});
const errors=[],checks=[];
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  if(!live)await context.route('**/*',async route=>{
   const requested=new URL(route.request().url());
   const prefix='/informatics/'+rel;
   if(requested.origin==='https://staging.universalmind.tv'&&requested.pathname.startsWith(prefix)){
    const name=decodeURIComponent(requested.pathname.slice(prefix.length))||'index.html';
    if(name.includes('..'))return route.abort();
    const file=path.join(site,rel,name),type=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/html';
    try{return route.fulfill({status:200,contentType:type,body:await fs.readFile(file)});}catch{return route.fulfill({status:404,body:'Missing candidate file'});}
   }
   return route.abort();
  });
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForFunction(n=>document.querySelectorAll('article.paper').length===n,data.records.length);
  assert.equal(await page.locator('.paper').count(),data.metrics.assessed);
  assert.match(await page.locator('#metrics').innerText(),new RegExp(String(data.metrics.screenedReportGroups)+'\\s+Provisional screened report groups'));
  assert.match(await page.locator('.notice').innerText(),/Awaiting Universal Mind review/);
  assert.equal(await page.locator('.paper .badge.pending').count(),data.records.length);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow '+width);
  await page.screenshot({path:path.join(out,phase+'-'+width+'.png'),fullPage:false});
  await page.locator('#collection').selectOption('sound');
  assert.equal(await page.locator('.paper').count(),data.records.filter(r=>r.collection==='sound').length);
  await page.locator('#design').selectOption('rct');
  assert.equal(await page.locator('.paper').count(),data.records.filter(r=>r.collection==='sound'&&r.design.crosses>0).length);
  await page.locator('#clear').click();
  await page.locator('#relation').selectOption('related');
  assert.equal(await page.locator('.paper').count(),data.records.filter(r=>r.relevance.relation==='related').length);
  await page.locator('#clear').click();
  await page.locator('#query').fill('definitely-no-matching-publication-99999');
  assert.equal(await page.locator('.paper').count(),0);assert.equal(await page.locator('.empty').count(),1);
  await page.locator('#clear').click();
  await page.locator('.paper details').first().locator('summary').click();
  assert.ok(await page.locator('.paper details').first().getAttribute('open')!==null);
  assert.match(await page.locator('.paper details').first().innerText(),/SHA-256/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Detail overflow '+width);
  await page.locator('.paper').first().scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,phase+'-evidence-'+width+'.png'),fullPage:false});
  checks.push({width,records:data.records.length,filters:true,emptyState:true,details:true,overflow:false});
  if(width===1440){
   await page.locator('#collection').selectOption('sound');
   const pending=page.waitForEvent('download');await page.locator('#download').click();const download=await pending;
   const exportPath=path.join(out,phase+'-filtered.json');await download.saveAs(exportPath);
   const exported=JSON.parse(await fs.readFile(exportPath,'utf8'));
   assert.equal(exported.count,data.records.filter(r=>r.collection==='sound').length);
   assert.ok(exported.records.every(r=>r.review.status==='pending'&&r.collection==='sound'));
   const csvPending=page.waitForEvent('download');await page.locator('#csv').click();const csv=await csvPending;
   const csvPath=path.join(out,phase+'-review.csv');await csv.saveAs(csvPath);
   const contents=await fs.readFile(csvPath,'utf8');assert.ok(contents.includes('humanDecision,humanNotes'));
   assert.ok(!contents.includes('Reviewed by Universal Mind'));
   checks.push({filteredJSON:true,reviewCSV:true,pendingStatusPreserved:true});
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);
 const report={passed:true,phase,checkedAt:new Date().toISOString(),url,batchRevision:data.batchRevision,audioDisabledAtProcessLaunch:true,errors,checks};
 await fs.writeFile(path.join(out,phase+'-browser.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}finally{await browser.close();}
