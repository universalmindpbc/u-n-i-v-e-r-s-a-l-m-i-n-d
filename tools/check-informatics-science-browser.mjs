import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const candidate=process.env.INFORMATICS_CANDIDATE==='1';
const output=process.env.INFORMATICS_QA_OUTPUT||'/private/tmp/first-principles-qa';
await fs.mkdir(output,{recursive:true});
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const results=[];
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  await context.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{};document.exitFullscreen=async()=>{};HTMLMediaElement.prototype.play=async()=>{};});
  if(candidate)await context.route(/https:\/\/staging\.universalmind\.tv\/(?:I|i)nformatics\//,async route=>{
   const relative=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/(?:I|i)nformatics\//,'')||'index.html';
   const file=path.resolve(root,'Informatics',relative);
   if(!file.startsWith(path.join(root,'Informatics')+path.sep))return route.abort();
   try{await route.fulfill({status:200,contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream',body:await fs.readFile(file)});}
   catch{await route.fulfill({status:404,body:'Missing candidate file'});}
  });
  await context.route(/\.mp4(?:\?|$)/,route=>route.fulfill({status:204,body:''}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?about=1',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#about').evaluate(e=>e.open),true);
  assert.match(await page.locator('#about .about-lead').innerText(),/Investigating relationships.*Fibonacci.*OXTR/);
  assert.equal(await page.locator('#about .science-teachables').count(),0);
  assert.equal(await page.locator('#about .about-resources a').count(),4);
  await page.locator('#about img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  await page.screenshot({path:path.join(output,`about-${viewport.width}.png`)});
  await page.getByRole('link',{name:'Science and Open Questions'}).click();
  await page.waitForURL('**/genomics.html');
  assert.equal(await page.locator('h1').innerText(),'Explore First Principles Genomics');
  assert.match(await page.locator('.genomics-lead').innerText(),/Our hypothesis/);
  assert.equal(await page.locator('.genomics-targets li').count(),5);
  assert.equal(await page.locator('.science-teachables button').count(),4);
  await page.locator('.science-teachables img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  assert.equal(await page.locator('.science-register').evaluate(e=>e.open),false);
  assert.doesNotMatch(await page.locator('main').innerText(),/golden[ -]ratio|Explore the science/i);
  await page.screenshot({path:path.join(output,`genomics-${viewport.width}.png`),fullPage:true});
  await page.locator('.science-teachables [data-science-card="gamma"]').click();
  const reader=page.locator('.science-reader');
  assert.equal(await reader.locator('.science-visual').evaluate(e=>e.open),true);
  await reader.locator('.science-image-button img').scrollIntoViewIfNeeded();
  await reader.locator('.science-image-button img').evaluate(img=>img.decode());
  await reader.locator('.science-image-button').click();
  assert.equal(await page.locator('.science-zoom').evaluate(e=>e.open),true);
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  await page.locator('.genomics-main [data-science-register]').click();
  const register=page.locator('.science-register');
  assert.equal(await register.evaluate(e=>e.open),true);
  assert.equal(await register.locator('tbody tr').count(),14);
  assert.equal(await register.locator('.science-hero').count(),4);
  assert.deepEqual(await register.locator('tr:has(.science-hero)').evaluateAll(rows=>rows.map(r=>r.dataset.studyId)),['E03','E06','E08','E11']);
  assert.equal(new Set(await register.locator('.science-study-title').evaluateAll(links=>links.map(a=>a.href))).size,14);
  const data=await page.evaluate(()=>window.InformaticsStudies);
  assert.equal(data.length,14);
  assert.ok(data.every(s=>s.score===Object.values(s.scoreParts).reduce((a,b)=>a+b,0)&&s.score>=0&&s.score<=10&&s.jadad==='Not applicable'));
  for(const study of data){
   await register.locator(`[data-study-score="${study.id}"]`).click();
   const appraisal=page.locator('.science-appraisal');
   assert.equal(await appraisal.evaluate(e=>e.open),true);
   assert.match(await appraisal.innerText(),/Jadad: not applicable/);
   assert.match(await appraisal.locator('h2').innerText(),new RegExp('^'+study.score+' / 10'));
   await page.keyboard.press('Escape');
   assert.equal(await register.evaluate(e=>e.open),true);
   assert.equal(await register.locator(`[data-study-score="${study.id}"]`).evaluate(e=>e===document.activeElement),true);
  }
  await register.evaluate(e=>{e.scrollTop=0;e.querySelector('.science-table-scroll').scrollLeft=0;});
  await register.screenshot({path:path.join(output,`register-${viewport.width}.png`)});
  await register.locator('[data-science-card="gamma"]').click();
  assert.equal(await reader.locator('.science-visual').evaluate(e=>e.open),false);
  assert.match(await reader.innerText(),/Cryo-electron microscopy/);
  await reader.locator('.science-atlas-link').click();
  await page.waitForURL('**/?atlas=1&record=fibonacci-m9-p24#gamma');
  await page.waitForFunction(()=>!document.querySelector('#launch').disabled);
  await page.locator('#launch').click();
  const frame=page.frameLocator('#atlas-frame');
  await frame.locator('#m9-science-summary').waitFor({state:'visible'});
  assert.equal(await frame.locator('#research-record').inputValue(),'fibonacci-m9-p24');
  assert.equal(await frame.locator('#m9-science-summary img, #m9-science-summary article').count(),0);
  await frame.getByRole('tab',{name:'Geometry summary',exact:true}).click();
  assert.equal(await frame.locator('#summary-science-slot #m9-science-summary').count(),1);
  await frame.locator('#m9-science-summary').screenshot({path:path.join(output,`atlas-context-${viewport.width}.png`)});
  await frame.locator('#m9-science-summary [data-science-register]').click();
  const atlasRegister=frame.locator('.science-register'),atlasReader=frame.locator('.science-reader');
  assert.equal(await atlasRegister.locator('tbody tr').count(),14);
  for(const id of ['alpha','beta','gamma','epsilon']){
   await atlasRegister.locator(`[data-science-card="${id}"]`).click();
   assert.equal(await atlasReader.locator('.science-visual').evaluate(e=>e.open),false);
   assert.match(await atlasReader.locator('.science-evidence').innerText(),/OPEN ATLAS QUESTION/);
   if(id==='epsilon'){
    await atlasReader.locator('.science-visual>summary').click();
    await atlasReader.locator('.science-image-button img').scrollIntoViewIfNeeded();
    await atlasReader.locator('.science-image-button img').evaluate(img=>img.decode());
    await atlasReader.locator('.science-atlas-link').click();
   }else await atlasReader.locator('button[aria-label="Close research card"]').click();
  }
  await frame.locator('[role=tab][aria-selected=true]').filter({hasText:/^Epsilon$/}).waitFor();
  assert.equal(await atlasRegister.evaluate(e=>e.open),false);
  for(const id of ['fibonacci-m18-p24','fibonacci-m1-p1','fibonacci-m48','m-summary']){
   const value=id==='fibonacci-m48'?await frame.locator('#research-record option').evaluateAll(opts=>opts.find(o=>o.textContent.startsWith('Fibonacci · M48 /')).value):id;
   await frame.locator('#research-record').selectOption(value);
   await frame.locator('#m9-science-summary').waitFor({state:'hidden'});
   if(value==='m-summary')await frame.locator('#family-view').waitFor({state:'visible'});
   else await frame.locator('.intro h1').filter({hasText:new RegExp('^M'+value.match(/-m(\d+)-/)[1]+' /')}).waitFor();
   if(value==='fibonacci-m18-p24'){
    await frame.getByRole('tab',{name:'Epsilon',exact:true}).click();await frame.locator('#epsilon-reduced').click();
    assert.equal(await frame.locator('#epsilon-reduced').getAttribute('aria-pressed'),'true');
   }
  }
  assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await frame.locator('html').evaluate(e=>e.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  results.push({viewport,compactAbout:true,separateGenomicsPage:true,studies:14,heroes:4,scoreBreakdowns:14,atlasLiteratureFirst:true,otherRecordsExcluded:true,errors});
  await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause()));await context.close();
 }
 console.log(JSON.stringify({passed:true,candidate,processMuted:true,nativeFullscreen:false,results,output},null,2));
}finally{await browser.close().catch(()=>{});await server.close().catch(()=>{});}
