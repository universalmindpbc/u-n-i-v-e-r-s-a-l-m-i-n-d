import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const candidate=process.env.INFORMATICS_CANDIDATE==='1';
const baseline=path.join(root,'research/informatics/trust-factor-20261027');
const out=process.env.INFORMATICS_QA_OUTPUT||baseline;
await fs.mkdir(out,{recursive:true});
const expected=JSON.parse(await fs.readFile(path.join(baseline,'model-verification.json'),'utf8')).counts;
const server=await chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={candidate,base,checkedAt:new Date().toISOString(),processMuted:true,results:[],errors:[]};
try{
 for(const width of [1470,390,320]){
  const context=await browser.newContext({viewport:{width,height:956},reducedMotion:'reduce'});
  if(candidate)await context.route(/https:\/\/staging\.universalmind\.tv\/(?:I|i)nformatics\//,async route=>{
   const p=new URL(route.request().url()).pathname.replace(/^\/(?:I|i)nformatics\//,'');
   const local=path.resolve(root,'Informatics',p||'index.html');
   assert.ok(local.startsWith(path.join(root,'Informatics')+path.sep));
   try{await route.fulfill({body:await fs.readFile(local),contentType:{'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'}[path.extname(local)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Not found'});}
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  let reader;
  async function visit(url){
   if(!reader){
    await page.goto(base+'?entry=research&area=research',{waitUntil:'domcontentloaded'});
    await page.locator('#research-frame').waitFor();
    reader=await (await page.locator('#research-frame').elementHandle()).contentFrame();
    await reader.waitForSelector('#result-count',{state:'attached'});
   }
   const target=new URL(url);target.searchParams.set('embedded','1');
   await reader.goto(target.href,{waitUntil:'domcontentloaded'});
   await reader.waitForSelector('#result-count',{state:'attached'});
  }
  for(const collection of ['sound','vision','language']){
   await visit(base+'library.html?collection='+collection+'&view=search');
   await reader.waitForFunction(()=>document.querySelector('#result-count')?.textContent.includes('papers'));
   assert.equal(await reader.locator('#result-count').textContent(),`${expected[collection].papers} papers in ${collection[0].toUpperCase()+collection.slice(1)}`);
   assert.equal(await reader.locator('#trust-label').textContent(),'Trust Factor');
   assert.equal(await reader.locator('#kind-label').textContent(),'Study design');
   for(const score of [3,2,1]){
    await reader.locator('#trust-toggle').click();
    await reader.locator(`#trust-options input[value="${score}"]`).check();
    await page.keyboard.press('Escape');
    const n=expected[collection].scores[score];
    assert.equal(await reader.locator('#result-count').textContent(),`${n} ${n===1?'paper':'papers'} in ${collection[0].toUpperCase()+collection.slice(1)}`);
    assert.equal(await reader.locator('.search-paper').count(),Math.min(n,15));
    assert.equal(await reader.locator('.search-context .trust-score').count(),0);
    for(const badge of await reader.locator('.search-paper h3 .trust-score').all()){
     assert.equal(await badge.getAttribute('aria-label'),`Paper Trust Factor: ${score} of 3`);
     assert.equal(await badge.locator('svg').count(),score);
    }
    assert.equal(await reader.locator('.search-paper h3 .trust-score').count(),score===1?0:Math.min(n,15));
    if(score===1 && n){
     await reader.locator('.search-paper [data-record]').first().click();
     assert.equal(await reader.locator('#article-title .trust-score').count(),0);
     await page.keyboard.press('Escape');
    }
    if(width===1470 && score===2){
     const event=page.waitForEvent('download');await reader.locator('#export-json').click();
     const download=await event;const file=path.join(out,`${candidate?'candidate-':''}${collection}-two-crosses.json`);await download.saveAs(file);
     const data=JSON.parse(await fs.readFile(file,'utf8'));
     assert.equal(data.records.length,n);
     assert.ok(data.records.every(r=>r.paperTrustAssessment.score===2 && r.paperTrustAssessment.randomizedControlledTrial));
     const csvEvent=page.waitForEvent('download');await reader.locator('#export-csv').click();
     const csvDownload=await csvEvent;await csvDownload.saveAs(path.join(out,`${candidate?'candidate-':''}${collection}-two-crosses.csv`));
    }
    await reader.locator(`[aria-label="Remove Trust Factor: ${score} ${score===1?'cross':'crosses'}"]`).click();
   }
   await reader.locator('#kind-toggle').click();await reader.locator('#kind-options input[value="trial"]').check();await page.keyboard.press('Escape');
   assert.match(await reader.locator('#result-count').textContent(),new RegExp('^'+expected[collection].rct+' papers'));
   await reader.locator('[data-view="chapters"]').click();
   assert.equal(await reader.locator('#reading-content').isVisible(),true);
   assert.equal(await reader.locator('[aria-label="Paper Trust Factor: 1 of 3"]').count(),0);
   assert.ok(await reader.locator('#trust-key [aria-label="Subchapter Trust Factor: 1 of 3"]').count()>0);
   assert.ok((await reader.locator('#trust-key').textContent()).includes('At least 3 randomized controlled trials'));
   assert.ok(!(await reader.locator('.research-guide').textContent()).includes('Individual paper'));
   assert.equal(await reader.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   const edition=JSON.parse(await fs.readFile(path.join(root,`Informatics/library-data/${collection}-edition.json`),'utf8'));
   const singleChapter=edition.chapters.find(c=>c.topics.some(t=>t.trustAssessment?.score===1));
   const singleTopic=singleChapter.topics.find(t=>t.trustAssessment?.score===1);
   await visit(base+`library.html?collection=${collection}&chapter=${singleChapter.number}#topic-${singleTopic.id}`);
   await reader.locator(`#topic-${singleTopic.id}`).waitFor();
   assert.equal(await reader.locator(`#topic-${singleTopic.id} > .topic-heading [aria-label="Subchapter Trust Factor: 1 of 3"] svg`).count(),1);
   assert.equal(await reader.locator('[aria-label="Paper Trust Factor: 1 of 3"]').count(),0);
   report.results.push({width,collection,trustFilters:[1,2,3],paperBadges:true,singlePaperBadgesHidden:true,singleChapterLegendRetained:true,singleChapterBadgeRetained:true,trialFilter:true,chapterLegend:true,noHorizontalOverflow:true});
  }
  await visit(base+'library.html?collection=sound&view=search&trust=3&query=Sound%20Mind%20Warrior');
  await reader.locator('[data-id="src-6d277422d0a0"]').waitFor();
  assert.equal(await reader.locator('[data-id="src-6d277422d0a0"] .trust-score svg').count(),3);
  await reader.locator('#results').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,`${candidate?'candidate-':''}sound-warrior-${width}.png`)});
  await reader.locator('[data-record="src-6d277422d0a0"]').first().click();
  assert.equal(await reader.locator('#article-title .trust-score svg').count(),3);
  await page.keyboard.press('Escape');
  assert.equal(await reader.locator('#article').evaluate(el=>el.open),false);
  const sound=JSON.parse(await fs.readFile(path.join(root,'Informatics/library-data/sound-edition.json'),'utf8'));
  const chapter=sound.chapters.find(c=>c.topics.some(t=>t.id==='xx'));
  await visit(base+`library.html?collection=sound&chapter=${chapter.number}#topic-xx`);
  await reader.locator('#topic-xx').waitFor();
  assert.equal(await reader.locator('#topic-xx > .topic-heading .trust-score').count(),0);
  assert.equal(await reader.locator('#topic-xx [data-paper="src-6d277422d0a0"] h4 .trust-score svg').count(),3);
  await reader.locator('#topic-xx [data-paper="src-6d277422d0a0"]').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,`${candidate?'candidate-':''}sound-chapter-${width}.png`)});
  assert.equal(await reader.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(el=>el.pause()));
  await context.close();
 }
 if(!candidate){
  const context=await browser.newContext({viewport:{width:1470,height:956},reducedMotion:'reduce'});
  const page=await context.newPage();
  const proofURL=base+'library.html?collection=sound&view=search&trust=3&query=Sound%20Mind%20Warrior';
  await page.goto(proofURL,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#research-frame')?.contentDocument?.querySelector('[data-id="src-6d277422d0a0"]'),null,{timeout:45000});
  const frame=await (await page.locator('#research-frame').elementHandle()).contentFrame();
  assert.equal(await frame.locator('[data-id="src-6d277422d0a0"] .trust-score svg').count(),3);
  report.proofURL=proofURL;report.directProofLink=true;
  for(const f of page.frames())await f.evaluate(()=>document.querySelectorAll('audio,video').forEach(el=>el.pause())).catch(()=>{});
  await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
 await fs.writeFile(path.join(out,(candidate?'candidate-':'')+'browser-verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await server.close();}
