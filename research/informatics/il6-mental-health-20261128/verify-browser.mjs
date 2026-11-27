import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const candidate=false;
const out=path.join(root,'research/informatics/il6-mental-health-20261128','browser');
await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const context=await browser.newContext({viewport:{width:1470,height:1000},reducedMotion:'reduce'});
await context.addInitScript(()=>{
 localStorage.setItem('informatics-library-background','white');
 localStorage.setItem('informatics-library-video-paused','true');
 HTMLMediaElement.prototype.play=()=>Promise.resolve();
 Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Fullscreen disabled for QA'));
 if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=()=>Promise.reject(new Error('Microphone disabled for QA'));
});
if(candidate)await context.route('https://staging.universalmind.tv/**',async route=>{
 const url=new URL(route.request().url());let rel=decodeURIComponent(url.pathname);
 if(/^\/informatics\//i.test(rel)){
  rel=rel.replace(/^\/informatics\//i,'');
  if(rel==='research/')rel='chapters/research.html';
  else if(!rel)rel='index.html';
  else if(rel.endsWith('/'))rel+='index.html';
  const file=path.join(root,'Informatics',rel);
  try{const body=await fs.readFile(file);const ext=path.extname(file);return route.fulfill({status:200,body,contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.csv':'text/csv','.svg':'image/svg+xml'})[ext]||'application/octet-stream'});}catch{}
 }
 return route.continue();
});
await context.route('**/*',route=>route.request().resourceType()==='media'||route.request().method()==='POST'?route.abort():route.continue());
const page=await context.newPage();page.setDefaultTimeout(25000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')console.log('Browser:',m.text());});
const network=[];page.on('requestfailed',r=>network.push({url:r.url(),error:r.failure()?.errorText}));
const report={candidate,mutedProcess:true,mediaPlaybackDisabled:true,checks:[]};
const base='https://staging.universalmind.tv/informatics/';
try{
 await page.goto(base+'research/?collection=general&chapter=13',{waitUntil:'domcontentloaded',timeout:60000});
 const frame=page.frameLocator('#research-frame');
 await frame.locator('.chapter-opening h2').waitFor();
 assert.match(await frame.locator('.chapter-opening h2').innerText(),/^IL-6, mental health and inflammation/);
 assert.equal(await frame.locator('.chapter-reader .topic').count(),26);
 assert.equal(await frame.locator('.chapter-reader .paper').count(),162);
 const content=await frame.locator('.chapter-reader').innerText();
 for(const word of ['ADHD','hypomania','ibudilast','tocilizumab','suicid'])assert(content.toLowerCase().includes(word.toLowerCase()),word);
 assert.equal(await frame.locator('a[href*="il6-mental-health-research-register"]').count(),2);
 assert.match(content,/emerging, promising and mixed|emerging and promising, but mixed/);assert.match(content,/higher IL-6/);
 assert.match(content,/wellbeing improves without IL-6 changing/);assert.match(content,/zero enrolment/);assert.equal(await frame.locator('.evidence-level').count(),5);assert.equal(await frame.locator('.biomarker-guide dt').count(),10);
 assert.match(content,/OXTR/);assert.match(content,/certainty not graded/);
 const order=await frame.locator('.contents-rail > ol > li > a').evaluateAll(a=>a.map(x=>Number(x.dataset.chapter)));
 assert.deepEqual(order,Array.from({length:13},(_,i)=>i+1));
 report.checks.push({chapter:13,topics:26,sources:162,chapterOrder:order,scientificBoundaries:true});
 for(const width of[1470,1024,390,320]){
  await page.setViewportSize({width,height:width<600?844:1000});
  await page.waitForTimeout(180);
  await frame.locator('.chapter-opening h2').evaluate(el=>{el.scrollIntoView({block:'start'});window.scrollBy(0,-140);});
  const layout=await frame.locator('html').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));
  assert(layout.scroll<=layout.width+2,JSON.stringify({width,layout}));
  await page.screenshot({path:path.join(out,`${width}.png`)});
  if(width===390){await frame.locator('.biomarker-guide').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'biomarkers-mobile.png')});}
  report.checks.push({viewport:width,layout});
 }
 await page.setViewportSize({width:1470,height:1000});
 await frame.locator('.paragraph-sources [data-paper-detail]').first().click();
 await frame.locator('#article[open]').waitFor();
 assert((await frame.locator('#article-title').innerText()).length>10);
 await frame.locator('[data-close="article"]').click();
 report.checks.push({citationDialog:true});
 await frame.locator('[data-view="search"]').click();
 await frame.locator('#target-toggle').click();
 await frame.locator('#target-options input[value="IL6"]').check();
 await frame.locator('#target-toggle').click();
 await frame.locator('#results .search-paper').first().waitFor();
 const count=await frame.locator('#results .search-paper').count();assert(count>0);
 report.checks.push({il6FilterMatches:count});
 await frame.locator('#query').fill('Oxytocin alleviates the neuroendocrine');
 await frame.locator('#search-form').evaluate(form=>form.requestSubmit());
 await frame.locator('#results [data-id="pmid-18593851"]').waitFor();
 report.checks.push({originalStudySearch:true});
 const chapterData=JSON.parse(await fs.readFile(path.join(root,'Informatics/library-data/oxtr-il6-research-register.json'),'utf8'));
 if(!candidate){
  for(const ext of['json','csv']){
   const response=await context.request.get(base+`library-data/oxtr-il6-research-register.${ext}?embedded=1`);assert(response.ok());
   assert.deepEqual(await response.body(),await fs.readFile(path.join(root,`Informatics/library-data/oxtr-il6-research-register.${ext}`)));
  }
  report.liveAssets=[];
  for(const rel of['library-data/il6-mental-health-research-register.json','library-data/il6-mental-health-research-register.csv','library.js','library.css','library-data/general-edition.json','library-data/library.json','exports/manifest.json']){
   const response=await context.request.get(base+rel+'?embedded=1&v=il6-mental-health-20261128-r2');assert(response.ok(),rel);
   const bytes=await response.body();assert.deepEqual(bytes,await fs.readFile(path.join(root,'Informatics',rel)),rel);
   report.liveAssets.push({path:rel,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  }
  const manifest=JSON.parse(await fs.readFile(path.join(root,'Informatics/exports/manifest.json'),'utf8'));
  report.completeExportParts=[];
  for(const part of Object.values(manifest.downloads).flatMap(d=>d.parts)){
   const response=await context.request.head(base+'exports/'+part.file);assert(response.ok(),part.file);
   const length=Number(response.headers()['content-length']);assert.equal(length,part.bytes);
   report.completeExportParts.push({file:part.file,bytes:length});
  }
  const production=await context.request.get('https://universalmind.tv/informatics/library-data/general-edition.json?embedded=1');assert(production.ok());
  const boundary=JSON.parse(await fs.readFile(path.join(root,'research/informatics/il6-mental-health-20261128/production-boundary.json'),'utf8'));
  report.productionGeneralSHA256=crypto.createHash('sha256').update(await production.body()).digest('hex');
  assert.equal(report.productionGeneralSHA256,boundary.general.sha256);
 }
 assert.equal(chapterData.records.length,162);assert.equal(chapterData.records.filter(r=>r.supplied).length,19);
 await page.goto(base+'read/oxtr-il6/index.html',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('article').count(),162);
 assert.match(await page.locator('h1').innerText(),/OXTR/);
 report.checks.push({readingPageSources:162,sourceRegister:true});
 await page.goto(base+'research/?collection=language&chapter=7',{waitUntil:'domcontentloaded'});
 await frame.locator('.chapter-opening h2').waitFor();
 assert.match(await frame.locator('.chapter-opening h2').innerText(),/Sub-audible mantra/);
 assert.match(await frame.locator('.chapter-opening').innerText(),/38 sources/);
 report.checks.push({languageRegression:true});
 await page.goto(base+'research/?collection=general&chapter=12',{waitUntil:'domcontentloaded'});
 await frame.locator('.chapter-opening h2').waitFor();assert.match(await frame.locator('.chapter-opening h2').innerText(),/^DOCK2/);assert.equal(await frame.locator('.chapter-reader .paper').count(),33);report.checks.push({dock2Regression:true});
 assert.deepEqual(errors,[]);report.passed=true;
}finally{
 report.finalUrl=page.url();if(!report.passed)report.frames=await Promise.all(page.frames().map(async f=>({url:f.url(),text:(await f.locator('body').innerText().catch(()=>'' )).slice(0,1200)})));report.network=network;
 await page.screenshot({path:path.join(out,'final.png')}).catch(()=>{});
 report.errors=errors;await fs.writeFile(path.join(out,'browser.json'),JSON.stringify(report,null,2)+'\n');
 await context.close();await browser.close();await server.close();
}
console.log(JSON.stringify(report));
