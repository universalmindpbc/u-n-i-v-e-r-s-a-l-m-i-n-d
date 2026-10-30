import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const candidate=process.env.CANDIDATE==='1';
const out=path.join(root,'research/informatics/communities-contexts-20261030');
const expected=JSON.parse(await fs.readFile(path.join(root,'Informatics/library-data/community-calibration.json'),'utf8'));
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());const errors=[],results=[];
async function downloadRecords(page,frame){const promise=page.waitForEvent('download');await frame.locator('#export-json').click();const download=await promise;const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);return JSON.parse(Buffer.concat(chunks).toString()).records;}
async function select(frame,values){await frame.locator('#community-toggle').click();for(const value of values)await frame.locator(`#community-options input[value="${value}"]`).check();await frame.locator('#community-toggle').click();}
try{
 for(const width of [1440,390,320]){
  const ctx=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true});
  await ctx.route(/\.(mp4|mp3|wav|m3u8|m4s|ts)(\?|$)/,r=>r.abort());
  if(candidate)await ctx.route(base+'**',async route=>{
   const url=new URL(route.request().url());let rel=decodeURIComponent(url.pathname.replace('/informatics/',''));if(!rel)rel='index.html';
   const file=path.join(root,'Informatics',rel);
   try{const body=await fs.readFile(file);await route.fulfill({status:200,body,contentType:{'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.csv':'text/csv','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream'});}catch{await route.continue();}
  });
  const page=await ctx.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'library.html?collection=all&view=search&calibration=batch',{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#research-frame');await frame.locator('#result-count').filter({hasText:'50 papers'}).waitFor({timeout:45000});
  assert.equal(await frame.locator('#calibration-only').isChecked(),true);
  assert.equal(await frame.locator('#community option').count(),7);
  await frame.locator('#community-toggle').click();await frame.locator('#community-options input[type=search]').fill('DV');assert.equal(await frame.locator('#community-options .multi-options label:visible').count(),1);await frame.locator('#community-options input[type=search]').fill('');await frame.locator('#community-toggle').click();
  const batch=await downloadRecords(page,frame);assert.equal(batch.length,50);
  assert.deepEqual(new Set(batch.flatMap(r=>r.communityAssessments.map(a=>a.recordId))),new Set(expected.records.map(r=>r.recordId)));
  assert.ok(batch.every(r=>r.communityReview==='pending'));
  await select(frame,['domestic-violence']);assert.equal(await frame.locator('#result-count').innerText(),'3 papers');
  const direct=await downloadRecords(page,frame);assert.ok(direct.some(r=>r.id==='pmid-15913391'));assert.ok(!direct.some(r=>r.id==='pmid-20193089'));
  await frame.locator('[data-record="pmid-15913391"]').first().click();
  await frame.locator('#article .community-evidence summary').click();assert.match(await frame.locator('#article .community-evidence').innerText(),/domestic-violence shelters/);
  assert.match(await frame.locator('#article .community-evidence').innerText(),/Awaiting Universal Mind review/i);
  await frame.locator('[data-close="article"]').click();
  await frame.locator('#include-related').check();assert.equal(await frame.locator('#result-count').innerText(),'8 papers');
  const expanded=await downloadRecords(page,frame);assert.ok(expanded.some(r=>r.id==='pmid-20193089'));assert.ok(expanded.some(r=>r.id==='pmid-27898068'));
  assert.equal(await frame.locator('.community-tag.related').count(),5);
  const inner=page.frames().find(f=>f.url().includes('/library.html'));
  assert.ok(inner.url().includes('community=domestic-violence')&&inner.url().includes('related=1'));
  await inner.goto(inner.url());await frame.locator('#result-count').filter({hasText:'8 papers'}).waitFor();
  assert.equal(await frame.locator('#include-related').isChecked(),true);
  await frame.locator('[data-collection="language"]').click();assert.equal(await frame.locator('#result-count').innerText(),'3 papers in Language');
  await frame.locator('[data-collection="all"]').click();
  await frame.locator('#community-coverage').scrollIntoViewIfNeeded();
  assert.equal(await inner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No horizontal overflow at '+width);
  await page.screenshot({path:path.join(out,`${candidate?'candidate':'staging'}-${width}.png`)});
  await frame.locator('#reset').click();assert.equal(await frame.locator('#calibration-only').isChecked(),false);assert.equal(await frame.locator('#include-related').isChecked(),false);
  assert.equal(await frame.locator('#result-count').innerText(),'1,108 papers');
  await select(frame,['refugees','housing']);const combined=await downloadRecords(page,frame);assert.equal(combined.length,16,'OR within community categories');
  await frame.locator('#condition-toggle').click();await frame.locator('#condition-options input[type=checkbox]').first().check();await frame.locator('#condition-toggle').click();
  const condition=await frame.locator('#condition').evaluate(el=>[...el.selectedOptions].map(o=>o.value).filter(Boolean)[0]);
  const n=await frame.locator('.search-paper').count();if(n){const intersection=await downloadRecords(page,frame);assert.ok(intersection.every(r=>r.conditions.includes(condition)));assert.ok(intersection.every(r=>combined.some(c=>c.id===r.id)));}
  await frame.locator('#reset').click();await frame.locator('#query').fill('no-such-community-study-000');await frame.locator('#search-form').evaluate(f=>f.requestSubmit());assert.equal(await frame.locator('#export-json').isDisabled(),true);
  results.push({width,batch:batch.length,directDomesticViolence:direct.length,includingRelated:expanded.length,combinedCategories:combined.length,overflow:false,passed:true});
  for(const f of page.frames())await f.evaluate(()=>{for(const media of document.querySelectorAll('audio,video')){media.pause();media.removeAttribute('src');}}).catch(()=>{});
  await ctx.close();
 }
 assert.deepEqual(errors,[]);
 const report={mode:candidate?'candidate':'staging',audioDisabledAtLaunch:true,errors,results,passed:true};
 await fs.writeFile(path.join(out,`${candidate?'candidate':'staging'}-browser.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await server.close();}
