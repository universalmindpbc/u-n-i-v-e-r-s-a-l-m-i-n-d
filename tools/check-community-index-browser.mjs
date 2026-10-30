import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const candidate=process.env.CANDIDATE==='1';
const out=path.join(root,'research/informatics/communities-related-20261030');
const expected=JSON.parse(await fs.readFile(path.join(root,'Informatics/library-data/community-index.json'),'utf8'));
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
  const frame=page.frameLocator('#research-frame');await frame.locator('#result-count').filter({hasText:'1,108 papers'}).waitFor({timeout:45000});
  assert.equal(await frame.locator('#calibration-only, #community-coverage, .community-calibration').count(),0);
  assert.equal(await frame.locator('#include-related').isChecked(),false);
  assert.equal(await frame.locator('#community option').count(),7);
  await frame.locator('#include-related').check();assert.equal(await frame.locator('#result-count').innerText(),'1,108 papers');await frame.locator('#include-related').uncheck();
  await frame.locator('#community-toggle').click();await frame.locator('#community-options input[type=search]').fill('DV');assert.equal(await frame.locator('#community-options .multi-options label:visible').count(),1);await frame.locator('#community-options input[type=search]').fill('');await frame.locator('#community-toggle').click();
  const batch=await downloadRecords(page,frame);assert.equal(batch.length,1108);
  assert.deepEqual(new Set(batch.flatMap(r=>r.communityAssessments.map(a=>a.recordId))),new Set(expected.records.map(r=>r.recordId)));
  assert.ok(batch.every(r=>!('communityReview' in r)));
  assert.doesNotMatch(await frame.locator('body').innerText(),/50 papers in the calibration|About this calibration|Awaiting Universal Mind review|Calibration · pending review/i);
  await select(frame,['domestic-violence']);assert.equal(await frame.locator('#result-count').innerText(),'5 papers');
  const direct=await downloadRecords(page,frame);assert.ok(direct.some(r=>r.id==='pmid-15913391'));assert.ok(!direct.some(r=>r.id==='pmid-20193089'));
  await frame.locator('[data-record="pmid-15913391"]').first().click();
  assert.equal(await frame.locator('#article .community-evidence').count(),0);
  assert.doesNotMatch(await frame.locator('#article').innerText(),/Awaiting Universal Mind review|Calibration · pending review/i);
  await frame.locator('[data-close="article"]').click();
  await frame.locator('#include-related').check();assert.equal(await frame.locator('#result-count').innerText(),'62 papers');
  const expanded=await downloadRecords(page,frame);assert.ok(expanded.some(r=>r.id==='pmid-20193089'));assert.ok(expanded.some(r=>r.id==='pmid-27898068'));
  assert.equal(expanded.filter(r=>r.communityMatches.some(m=>m.categoryId==='domestic-violence'&&m.relation==='related')).length,57);
  assert.ok(await frame.locator('.community-tag.related').count()>0);
  const inner=page.frames().find(f=>f.url().includes('/library.html'));
  assert.ok(inner.url().includes('community=domestic-violence')&&inner.url().includes('related=1'));
  await inner.goto(inner.url());await frame.locator('#result-count').filter({hasText:'62 papers'}).waitFor();
  assert.equal(await frame.locator('#include-related').isChecked(),true);
  await frame.locator('[data-collection="language"]').click();assert.equal(await frame.locator('#result-count').innerText(),'11 papers in Language');
  await frame.locator('[data-collection="all"]').click();
  await frame.locator('#include-related').scrollIntoViewIfNeeded();
  assert.equal(await inner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No horizontal overflow at '+width);
  await page.screenshot({path:path.join(out,`${candidate?'candidate':'staging'}-${width}.png`)});
  await frame.locator('#reset').click();assert.equal(await frame.locator('#include-related').isChecked(),false);
  assert.equal(await frame.locator('#result-count').innerText(),'1,108 papers');
  const communityCounts={};
  for(const [category,directCount,relatedCount] of [['defence',56,84],['indigenous',21,34],['refugees',97,133],['housing',38,79],['war-trauma',24,79]]){
   await select(frame,[category]);assert.equal(await frame.locator('#result-count').innerText(),directCount+' papers');
   await frame.locator('#include-related').check();assert.equal(await frame.locator('#result-count').innerText(),relatedCount+' papers');
   const selected=await downloadRecords(page,frame);assert.equal(selected.length,relatedCount);
   assert.equal(new Set(selected.map(r=>r.id)).size,selected.length);
   assert.equal(selected.filter(r=>r.communityMatches.some(m=>m.categoryId===category&&m.relation==='related')).length,relatedCount-directCount);
   assert.ok(selected.every(r=>r.communityMatches.some(m=>m.categoryId===category)));
   assert.ok(await frame.locator('.community-tag.related').count()>0);
   if(category==='indigenous')await page.screenshot({path:path.join(out,`${candidate?'candidate':'staging'}-related-${width}.png`)});
   await frame.locator('#include-related').uncheck();assert.equal(await frame.locator('#result-count').innerText(),directCount+' papers');
   communityCounts[category]={direct:directCount,includingRelated:relatedCount};await frame.locator('#reset').click();
  }
  await frame.locator('#age-toggle').click();await frame.locator('#age-options input[value="youth"]').check();await frame.locator('#age-toggle').click();
  assert.equal(await frame.locator('#result-count').innerText(),'170 papers');
  const youth=await downloadRecords(page,frame);assert.ok(youth.every(r=>r.ageGroups.includes('youth')));
  assert.equal(youth.filter(r=>r.agePopulation.youthScope==='focus').length,63);
  await select(frame,['refugees']);assert.equal(await frame.locator('#result-count').innerText(),'12 papers');
  await frame.locator('#include-related').check();assert.equal(await frame.locator('#result-count').innerText(),'25 papers');
  const ageURL=page.frames().find(f=>f.url().includes('/library.html')).url();assert.ok(ageURL.includes('age=youth'));
  await inner.goto(ageURL);await frame.locator('#result-count').filter({hasText:'25 papers'}).waitFor();
  const youthRefugees=await downloadRecords(page,frame);assert.ok(youthRefugees.every(r=>r.ageGroups.includes('youth')&&r.communityMatches.some(m=>m.categoryId==='refugees')));
  await frame.locator('[data-record="pmid-42324567"]').first().click();assert.match(await frame.locator('#article .age-population').innerText(),/8–18 years/);await frame.locator('[data-close="article"]').click();
  await frame.locator('#age-toggle').scrollIntoViewIfNeeded();assert.equal(await inner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:path.join(out,`${candidate?'candidate':'staging'}-age-${width}.png`)});
  await frame.locator('#reset').click();assert.equal(await frame.locator('#age').evaluate(el=>[...el.selectedOptions].filter(o=>o.value).length),0);
  await select(frame,['refugees','housing']);const combined=await downloadRecords(page,frame);assert.equal(combined.length,133,'OR within community categories');
  await frame.locator('#include-related').check();const combinedRelated=await downloadRecords(page,frame);assert.equal(combinedRelated.length,173);assert.equal(new Set(combinedRelated.map(r=>r.id)).size,173);await frame.locator('#include-related').uncheck();
  await frame.locator('#condition-toggle').click();await frame.locator('#condition-options input[type=checkbox]').first().check();await frame.locator('#condition-toggle').click();
  const condition=await frame.locator('#condition').evaluate(el=>[...el.selectedOptions].map(o=>o.value).filter(Boolean)[0]);
  const n=await frame.locator('.search-paper').count();if(n){const intersection=await downloadRecords(page,frame);assert.ok(intersection.every(r=>r.conditions.includes(condition)));assert.ok(intersection.every(r=>combined.some(c=>c.id===r.id)));}
  await frame.locator('#reset').click();await frame.locator('#query').fill('no-such-community-study-000');await frame.locator('#search-form').evaluate(f=>f.requestSubmit());assert.equal(await frame.locator('#export-json').isDisabled(),true);
  results.push({width,batch:batch.length,directDomesticViolence:direct.length,includingRelated:expanded.length,youthPapers:youth.length,youthRefugees:youthRefugees.length,communityCounts,combinedCategories:combined.length,combinedWithRelated:combinedRelated.length,overflow:false,passed:true});
  for(const f of page.frames())await f.evaluate(()=>{for(const media of document.querySelectorAll('audio,video')){media.pause();media.removeAttribute('src');}}).catch(()=>{});
  await ctx.close();
 }
 assert.deepEqual(errors,[]);
 const report={mode:candidate?'candidate':'staging',audioDisabledAtLaunch:true,errors,results,passed:true};
 await fs.writeFile(path.join(out,`${candidate?'candidate':'staging'}-browser.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await server.close();}
