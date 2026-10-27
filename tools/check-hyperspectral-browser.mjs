import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const candidate=process.env.INFORMATICS_CANDIDATE==='1';
const out=path.join(root,'research/informatics/hyperspectral-20261027');
const server=await chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={candidate,base,checkedAt:new Date().toISOString(),processMuted:true,results:[],errors:[]};
try{
 for(const width of [1470,390,320]){
  const context=await browser.newContext({acceptDownloads:true,viewport:{width,height:956},reducedMotion:'reduce'});
  if(candidate)await context.route(/https:\/\/staging\.universalmind\.tv\/informatics\//,async route=>{
   const rel=new URL(route.request().url()).pathname.replace(/^\/informatics\//,'');
   const local=path.resolve(root,'Informatics',rel||'index.html');
   assert.ok(local.startsWith(path.join(root,'Informatics')+path.sep));
   try{await route.fulfill({body:await fs.readFile(local),contentType:{'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.csv':'text/csv'}[path.extname(local)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Not found'});}
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log('BROWSER',m.text());});
  await page.goto(base+'?entry=research&area=research',{waitUntil:'domcontentloaded'});
  await page.locator('#research-frame').waitFor();
  let reader=await (await page.locator('#research-frame').elementHandle()).contentFrame();
  await reader.waitForSelector('.contents-grid, .search-paper');
  await reader.goto(base+'library.html?collection=general&embedded=1',{waitUntil:'domcontentloaded'});
  await reader.locator('.contents-chapter h3 a[data-chapter="11"]').click();
  assert.match(reader.url(),/chapter=11/);
  await reader.locator('#chapter-source-register').waitFor({state:'attached'});
  assert.equal(await reader.locator('.chapter-opening h2').textContent(),'Hyperspectral Imaging');
  assert.equal(await reader.locator('.chapter-reader > .topic').count(),6);
  assert.equal(await reader.locator('[data-source-reference]').count(),240);
  assert.equal(await reader.locator('.technology-timeline > li').count(),13);
  assert.equal(await reader.locator('[aria-label="Paper Trust Factor: 1 of 3"]').count(),0);
  await reader.locator('.chapter-opening').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,`${candidate?'candidate-':''}chapter-${width}.png`)});
  await reader.locator('a[href="#chapter-source-register"]').click();
  await reader.locator('#source-register-query').fill('NPL-1');
  assert.equal(await reader.locator('[data-source-reference]:visible').count(),1);
  const npl1=reader.locator('[data-source-reference="NPL-1"]');
  await npl1.locator('summary').click();await npl1.locator('[data-record]').click();
  await reader.locator('#article[open]').waitFor();
  assert.match(await reader.locator('#article-title').textContent(),/Full Resolution From Arbitrary/);
  assert.match(await reader.locator('#article .source-provenance summary').textContent(),/NPL-1, NPL-153/);
  await page.keyboard.press('Escape');assert.equal(await reader.locator('#article').evaluate(el=>el.open),false);
  await reader.locator('#source-register-query').fill('');await reader.locator('#source-register-type').selectOption('PAT');
  await reader.waitForFunction(()=>document.querySelector('#source-register-count').textContent==='11 entries');
  assert.equal(await reader.locator('[data-source-reference]:visible').count(),11);
  await reader.locator('[data-source-reference="PAT-7"] summary').click();
  assert.match(await reader.locator('[data-source-reference="PAT-7"]').textContent(),/Booz Allen Hamilton/);
  await reader.locator('#source-register-type').selectOption('review');
  assert.equal(await reader.locator('[data-source-reference]:visible').count(),14);
  await reader.locator('#source-register-heading').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,`${candidate?'candidate-':''}register-${width}.png`)});
  assert.equal(await reader.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await reader.locator('#source-register-type').selectOption('');
  for(const format of ['json','csv']){
   if(candidate){const body=await reader.evaluate(async href=>(await fetch(href)).text(),`library-data/hyperspectral-register.${format}`);assert.equal(body,await fs.readFile(path.join(root,`Informatics/library-data/hyperspectral-register.${format}`),'utf8'));continue;}
   const pending=page.waitForEvent('download');await reader.locator(`.register-downloads a[download][href$=".${format}"]`).click();
   const download=await pending;const file=path.join(out,`${candidate?'candidate-':''}download-${width}.${format}`);await download.saveAs(file);
   assert.deepEqual(await fs.readFile(file),await fs.readFile(path.join(root,`Informatics/library-data/hyperspectral-register.${format}`)));
  }
  await reader.goto(base+'library.html?collection=general&view=search&query=NPL-9b&embedded=1',{waitUntil:'domcontentloaded'});
  await reader.waitForFunction(()=>document.querySelector('#result-count')?.textContent.includes('paper'));
  assert.equal(await reader.locator('.search-paper').count(),1);
  await reader.locator('.search-paper [data-record]').first().click();
  assert.match(await reader.locator('#article-title').textContent(),/SpectralSeq/);
  assert.match(await reader.locator('#article .source-provenance').textContent(),/Related publication versions/);
  await page.keyboard.press('Escape');
  if(width===1470){
   await page.goto(base+'library.html?collection=general&chapter=11',{waitUntil:'domcontentloaded'});
   await page.locator('#research-frame').waitFor();
   reader=await (await page.locator('#research-frame').elementHandle()).contentFrame();
   await reader.locator('.chapter-opening h2').waitFor();
   assert.equal(await reader.locator('.chapter-opening h2').textContent(),'Hyperspectral Imaging');
   report.deepLinkVerified=true;
  }
  await reader.evaluate(()=>document.querySelectorAll('audio,video').forEach(el=>el.pause()));
  await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(el=>el.pause()));
  await context.close();
  report.results.push({width,chapterNavigation:true,subchapters:6,sourceEntries:240,timeline:13,exactReferenceFilter:true,patentFilter:11,unresolvedFilter:14,citationDialog:true,versionLinks:true,jsonCSVByteParity:true,downloadMethod:candidate?'routed candidate fetch':'browser download',noHorizontalOverflow:true,singleCrossRulePreserved:true});
 }
 assert.deepEqual(report.errors,[]);
}finally{
 await browser.close();await server.close();
 await fs.writeFile(path.join(out,`${candidate?'candidate-':''}browser-verification.json`),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report));
