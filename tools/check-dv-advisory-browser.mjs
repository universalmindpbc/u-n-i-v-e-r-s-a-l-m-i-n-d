import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rel='Informatics/review/domestic-violence-20261030/';
const site=path.join(root,rel);
const out=path.join(root,'research/informatics/dot-dv-20261030/continuation/approval-followup/qa');
await fs.mkdir(out,{recursive:true});
const live=process.env.STAGING==='1',phase=live?'staging':'candidate';
const url='https://staging.universalmind.tv/informatics/review/domestic-violence-20261030/';
const advisory=JSON.parse(await fs.readFile(path.join(site,'advisory-20261030-r1.json'),'utf8'));
const batch=JSON.parse(await fs.readFile(path.join(site,advisory.frozenBatch+'.json'),'utf8'));
const browser=await chromium.launch({headless:true,args:['--mute-audio','--disable-background-networking']});
const errors=[],checks=[];
async function localRoutes(context,missing=false){
 await context.route('**/*',async route=>{
  const request=new URL(route.request().url());
  if(!request.href.startsWith(url))return route.abort();
  const name=decodeURIComponent(request.pathname.slice(new URL(url).pathname.length))||'index.html';
  if(name.includes('..'))return route.abort();
  if(missing&&name==='advisory-20261030-r1.json')return route.fulfill({status:503,body:'Unavailable'});
  const type=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/html';
  try{return route.fulfill({status:200,contentType:type,body:await fs.readFile(path.join(site,name))});}
  catch{return route.fulfill({status:404,body:'Missing file'});}
 });
}
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true});
  if(!live)await localRoutes(context);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelectorAll('.paper').length===120);
  assert.ok(await page.locator('#later-advisory').isVisible());
  assert.equal(await page.locator('#later-advisory li').count(),3);
  assert.match(await page.locator('#metrics').innerText(),/Originally review-ready/);
  assert.equal(await page.locator('[data-later-advisory="hold"]').count(),3);
  assert.equal(await page.locator('[data-later-advisory="amend"]').count(),5);
  assert.equal(await page.locator('[data-later-advisory="supplement"]').count(),8);
  assert.equal(await page.locator('[data-later-advisory="existing-hold"]').count(),4);
  for(const id of ['dv-children-25596929','dv-children-35285428']){
   assert.equal(await page.locator('#'+id+' .crosses').count(),0);
   assert.match(await page.locator('#'+id).innerText(),/RCT classification on hold/);
  }
  assert.equal(await page.locator('#dv-reviews-27599224 .crosses svg').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Review overflow '+width);
  await page.locator('#later-advisory').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,phase+'-notice-'+width+'.png')});
  await page.locator('#query').fill('dv-children-25596929');
  assert.equal(await page.locator('.paper').count(),1);
  assert.match(await page.locator('.paper .record-advisory').innerText(),/do not approve/);
  if(width===1440){
   const pending=page.waitForEvent('download');await page.locator('#download').click();const downloaded=await pending;
   const filepath=path.join(out,phase+'-hold-export.json');await downloaded.saveAs(filepath);
   const data=JSON.parse(await fs.readFile(filepath,'utf8'));
   assert.equal(data.advisoryRevision,advisory.advisoryRevision);assert.equal(data.laterAdvisories[0].action,'hold');
   assert.deepEqual(data.records[0],batch.records.find(r=>r.id==='dv-children-25596929'));
   const csvPending=page.waitForEvent('download');await page.locator('#csv').click();const csv=await csvPending;
   const csvpath=path.join(out,phase+'-hold-export.csv');await csv.saveAs(csvpath);
   const text=await fs.readFile(csvpath,'utf8');assert.match(text,/laterAdvisoryAction,approvalAction,advisoryURL/);assert.match(text,/"hold"/);
   checks.push({exportsIncludeAdvisory:true,exportedAssessmentUnchanged:true});
  }
  await page.locator('#dv-children-25596929 .record-advisory a').click();
  assert.ok(page.url().endsWith('advisory-20261030-r1.html#dv-children-25596929'));
  assert.equal(await page.locator('.advisory-entry').count(),20);
  assert.match(await page.locator('#dv-children-25596929').innerText(),/stochastic/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Advisory overflow '+width);
  await page.screenshot({path:path.join(out,phase+'-detail-'+width+'.png')});
  checks.push({width,noticeVisible:true,holds:3,amendments:5,staleCrossesSuppressed:2,advisoryLinks:true,overflow:false});
  await context.close();
 }
 if(!live){
  const context=await browser.newContext();await localRoutes(context,true);const page=await context.newPage();
  await page.goto(url,{waitUntil:'networkidle'});assert.equal(await page.locator('.paper').count(),0);
  assert.ok(await page.locator('#download').isDisabled());assert.ok(await page.locator('#csv').isDisabled());
  assert.match(await page.locator('#result-count').innerText(),/do not approve/);
  assert.ok(await page.locator('#later-advisory').isVisible());
  checks.push({missingAdvisoryBlocksHistoricalCardsAndDownloads:true});await context.close();
 }
 assert.deepEqual(errors,[]);
 const report={passed:true,phase,checkedAt:new Date().toISOString(),url,advisoryRevision:advisory.advisoryRevision,audioDisabledAtLaunch:true,errors,checks};
 await fs.writeFile(path.join(out,phase+'-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
