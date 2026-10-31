import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),base='https://staging.universalmind.tv/informatics/';
const live=process.env.STAGING==='1',phase=live?'staging':'candidate',out=path.join(root,'research/informatics/dv-integration-20261101');
const approved=JSON.parse(await fs.readFile(path.join(root,'Informatics/library-data/domestic-violence-expansion.json'),'utf8'));
const browser=await chromium.launch({headless:true,args:['--mute-audio','--disable-background-networking']});
const errors=[],checks=[];
const context=await browser.newContext({acceptDownloads:true});
if(!live)await context.route('**/*',async route=>{
 const u=new URL(route.request().url());if(/\.(mp4|mp3|wav|m3u8|m4s|ts)(\?|$)/.test(u.href))return route.abort();if(!u.href.startsWith(base))return route.continue();
 const rel=decodeURIComponent(u.pathname.slice('/informatics/'.length))||'index.html';if(rel.includes('..'))return route.abort();
 try{return route.fulfill({status:200,contentType:({'.json':'application/json','.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'})[path.extname(rel)]||'application/octet-stream',body:await fs.readFile(path.join(root,'Informatics',rel))});}catch{return route.fulfill({status:404,body:'Missing'});}
});
const page=await context.newPage();const reader=page.frameLocator('#research-frame');page.on('pageerror',e=>errors.push(e.message));
async function go(params){await page.goto(base+'library.html?'+params,{waitUntil:'domcontentloaded',timeout:60000});await reader.locator('[data-stat="papers"]').waitFor({timeout:45000}).catch(async error=>{console.log('PAGE',page.url(),'FRAMES',page.frames().map(f=>f.url()),errors);throw error;});assert.ok(await reader.locator('#load-error').isHidden());}
async function download(){const pending=page.waitForEvent('download');await reader.locator('#export-json').click();const d=await pending;const p=path.join(out,phase+'-filtered.json');await d.saveAs(p);const payload=JSON.parse(await fs.readFile(p,'utf8'));return payload.records||payload;}
try{
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:950});
  for(const [collection,count] of Object.entries(approved.counts.collections)){
   await go('collection='+collection+'&chapter='+approved.chapters[collection].number);
   assert.equal(await reader.locator('.paper').count(),count);
   assert.match(await reader.locator('#topic-domestic-family-violence').innerText(),/117 publications.*51 randomized controlled trial reports/s);
   assert.equal(await reader.locator('.publication-approval').count(),count);
   assert.equal(await reader.locator('body').getByText('[object Object]',{exact:false}).count(),0);
   assert.ok(await reader.locator('html').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Overflow '+collection+' '+width);
   await reader.locator('#topic-domestic-family-violence h3').scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(out,phase+'-'+collection+'-'+width+'.png')});
  }
  checks.push({width,chapters:{sound:8,vision:10,language:99},noHorizontalOverflow:true});
 }
 await page.setViewportSize({width:1440,height:1000});
 const topics=['sound','vision','language'].map(c=>'topic='+c+':domestic-family-violence').join('&');
 await go('collection=all&view=search&'+topics);assert.match(await reader.locator('#result-count').innerText(),/^117 papers/);
 const exported=await download();assert.equal(exported.length,117);
 assert.deepEqual(new Set(exported.map(r=>r.id)),new Set(approved.records.map(r=>r.id)));
 for(const r of exported){const original=approved.records.find(a=>a.id===r.id);assert.equal(r.summary,original.summary);assert.equal(r.limitation,original.limitation);assert.ok(r.publicationApproval);assert.ok(r.ageGroups.length);}
 for(const [kind,n] of [['trial',51],['review',25],['double-blind',0]]){await go('collection=all&view=search&'+topics+'&kind='+kind);assert.match(await reader.locator('#result-count').innerText(),new RegExp('^'+n+' papers'));}
 for(const facet of ['condition','age','category','target','journal','trust','jadad']){
  const values=facet==='condition'?[['ptsd',r=>r.conditions.includes('ptsd')]]:facet==='age'?[['children',r=>r.ageGroups.includes('children')]]:facet==='category'?[['Clinical & self-report',r=>r.categories.includes('Clinical & self-report')]]:facet==='target'?[['OXTR',r=>r.targets.includes('OXTR')]]:facet==='journal'?[[exported[0].journalKey,r=>r.journalKey===exported[0].journalKey]]:facet==='trust'?[['2',r=>r.paperTrustAssessment.score===2]]:[['unassessed',r=>r.jadad.status==='unassessed']];
  for(const [value,predicate] of values){await go('collection=all&view=search&'+topics+'&'+facet+'='+encodeURIComponent(value));assert.match(await reader.locator('#result-count').innerText(),new RegExp('^'+exported.filter(predicate).length+' papers?'),'Facet '+facet);}
 }
 await go('collection=all&view=search&community=domestic-violence');assert.match(await reader.locator('#dv-overview').innerText(),/117 publications/);assert.match(await reader.locator('#result-count').innerText(),/^115 papers/);
 await go('collection=language&chapter=5');assert.equal(await reader.locator('[data-paper="dv-adult-therapy-42326745"] .trust-score svg').count(),1);assert.equal(await reader.locator('[data-paper="dv-mindbody-41024298"] .trust-score').count(),0);
 const pending=page.waitForEvent('download');await go('collection=all&view=search&'+topics);await reader.locator('#export-csv').click();const csv=await pending;await csv.saveAs(path.join(out,phase+'-filtered.csv'));
 assert.deepEqual(errors,[]);checks.push({filteredJSON:117,csv:true,designFilters:true,sourceFindingsAndLimitsPreserved:true,ageConditionCategoryTargetJournalTrustJadadFilters:true,rctHasOneCross:true,inaccurateRCTTitleHasNoCross:true});
 const report={passed:true,phase,mutedHeadless:true,checks,errors};await fs.writeFile(path.join(out,phase+'-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});await browser.close();}
