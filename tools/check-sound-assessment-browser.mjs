import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const portal={window:{}};
vm.runInNewContext(await fs.readFile(path.join(root,'i  a m/science-research-data-v1.js'),'utf8'),portal);
const approvedStudies=Array.from(portal.window.IAMScienceResearch.layers.find(l=>l.id==='sound').heroStudies).filter(s=>!s.internal);
const candidate=process.env.CANDIDATE==='1';
const production=process.env.PRODUCTION==='1';
assert.ok(!(candidate&&production),'Production verification must use served assets.');
const base=`https://${production?'':'staging.'}universalmind.tv/informatics/`;
const output=`/private/tmp/sound-assessment-${production?'production':candidate?'candidate':'staging'}`;
await fs.mkdir(output,{recursive:true});
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const errors=[],checks=[];
const sources=[
 'https://pubmed.ncbi.nlm.nih.gov/40547443/',
 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12244202/',
 'https://pubmed.ncbi.nlm.nih.gov/39004412/',
 'https://www.scirp.org/journal/paperinformation?paperid=87146',
 'https://pubmed.ncbi.nlm.nih.gov/42349368/',
 'https://pubmed.ncbi.nlm.nih.gov/15668624/',
 'https://www.frontiersin.org/journals/aging-neuroscience/articles/10.3389/fnagi.2025.1622816/full'
];
async function newContext(viewport){
 const ctx=await browser.newContext({viewport});
 if(candidate)await ctx.route(base+'**',async route=>{
  const relative=new URL(route.request().url()).pathname.replace('/informatics/','')||'index.html';
  const file=path.join(root,'Informatics',relative);
  try{await route.fulfill({status:200,body:await fs.readFile(file),contentType:{'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'}[path.extname(file)]||'application/octet-stream'});}catch{await route.continue();}
 });
 return ctx;
}
async function pauseMedia(ctx){for(const page of ctx.pages())for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});}
try{
 for(const [width,height] of [[1470,956],[1024,768],[390,844],[320,844]]){
  const ctx=await newContext({width,height});
  try{
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'library.html?collection=sound',{waitUntil:'domcontentloaded'});
   await page.locator('.contents-chapter').first().waitFor();
   const panel=page.locator('#sound-assessment-panel'),toggle=panel.locator(':scope > summary');
   assert.match(await page.locator('#sound-assessment .assessment-grade').innerText(),/Positive systematic evidence/);
   assert.deepEqual(await page.locator('#sound-assessment .assessment-method dd').allTextContents(),[
    'Supported by current clinical guidance and multiple controlled evidence syntheses.',
    'Positive systematic evidence, with meaningful heterogeneity or a product translation gap.',
    'Promising or indirect evidence. The proposed delivery itself is not yet established.'
   ]);
   assert.match(await page.locator('#sound-assessment .assessment-method').textContent(),/Grades describe the research basis, not a medical recommendation\./);
   assert.equal(await panel.evaluate(e=>e.open),false);
   assert.deepEqual(await page.locator('[data-stat]').allTextContents(),['284','145','24,691']);
   assert.equal(await page.locator('.contents-chapter').count(),6);
   assert.equal(await page.locator('.contents-topic-meta').count(),19);
   assert.equal(await page.locator('#sound-assessment .assessment-studies article').count(),5);
   assert.deepEqual(await page.locator('#sound-assessment .assessment-finding > p:first-child').allTextContents(),approvedStudies.map(s=>s.finding));
   assert.deepEqual(await page.locator('#sound-assessment .assessment-finding .assessment-note').allTextContents(),approvedStudies.map(s=>'Limit: '+s.limitation));
   const molecular=await page.locator('#sound-assessment .assessment-molecular-studies').textContent();
   for(const gene of ['IL6','NR3C1','NFKB1','IFNG','IL10','LGALS3','CXCL8','THOP1'])assert.ok(molecular.includes(gene),gene+' is named');
   const explanatory=await page.locator('#sound-assessment .assessment-body p').allTextContents();
   assert.equal(explanatory.some(t=>/auditory[- ]beats?\b/i.test(t)),false);
   assert.deepEqual(await page.locator('#sound-assessment h4 a').evaluateAll(es=>es.map(e=>e.href)),sources);
   assert.equal(await page.locator('#collection-statistics').evaluate(e=>e.nextElementSibling.id),'sound-assessment');
   await toggle.focus();await page.keyboard.press('Enter');assert.equal(await panel.evaluate(e=>e.open),true);
   await toggle.focus();await page.keyboard.press('Space');assert.equal(await panel.evaluate(e=>e.open),false);
   for(const mode of ['video','black','white']){
    await page.locator(`.reading-toolbar [data-reading-background="${mode}"]`).click();
    await page.locator('#sound-assessment').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:`${output}/collapsed-${width}-${mode}.png`});
    await toggle.click();assert.equal(await panel.evaluate(e=>e.open),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`${width} ${mode} page fits`);
    const overflow=await page.locator('#sound-assessment *').evaluateAll(es=>es.filter(e=>{
     if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();return r.left < -1 || r.right > innerWidth+1;
    }).map(e=>e.tagName+'.'+e.className));
    assert.deepEqual(overflow,[],`${width} ${mode} assessment fits`);
    await page.locator('#sound-assessment').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:`${output}/expanded-${width}-${mode}.png`});
    await page.locator('#sound-molecular-evidence').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:`${output}/molecular-${width}-${mode}.png`});
    const method=page.locator('#sound-assessment .assessment-method');await method.locator(':scope > summary').focus();await page.keyboard.press('Enter');
    assert.equal(await method.evaluate(e=>e.open),true);await page.keyboard.press('Space');assert.equal(await method.evaluate(e=>e.open),false);
    await toggle.click();assert.equal(await panel.evaluate(e=>e.open),false);
   }
   await toggle.click();
   await page.locator('[data-view="search"]').click();assert.equal(await panel.isVisible(),true);assert.match(await page.locator('#result-count').innerText(),/284 papers/);
   for(const collection of ['vision','language','all']){
    await page.locator(`[data-collection="${collection}"]`).click();assert.equal(await page.locator('#sound-assessment').isVisible(),false);
   }
   await page.locator('[data-collection="sound"]').click();assert.equal(await panel.evaluate(e=>e.open),true);
   await page.locator('#sound-assessment .assessment-chapter-link').click();
   assert.equal(new URL(page.url()).searchParams.get('chapter'),'3');
   assert.match(await page.locator('.chapter-opening h2').innerText(),/Music and gene expression/);
   await page.goBack();assert.equal(await panel.isVisible(),true);
   checks.push({width,height,modes:['video','black','white'],approvedPortalCopyPreserved:true,namedGenesPresent:true,requestedTerminology:true,keyboard:true,collectionIsolation:true,chapterNavigation:true,countsPreserved:true,overflow:false,status:'passed'});
  }finally{await pauseMedia(ctx);await ctx.close();}
 }
 const ctx=await newContext({width:1470,height:956});
 try{
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'library.html?collection=sound',{waitUntil:'domcontentloaded'});
  await page.locator('.contents-chapter').first().waitFor();
  await page.locator('#atlas-toggle').click();await page.locator('[data-global-area="sound"]').click();
  await page.locator('#area-sound').waitFor({state:'visible'});
  await page.locator('#atlas-toggle').click();await page.locator('#atlas-menu [data-library]').click();
  const frame=page.frameLocator('.library-overlay iframe');await frame.locator('#sound-assessment').waitFor();
  await frame.locator('#sound-assessment-panel > summary').click();assert.equal(await frame.locator('#sound-key-studies').isVisible(),true);
  await frame.locator('#sound-assessment .assessment-chapter-link').click();assert.match(await frame.locator('.chapter-opening h2').innerText(),/Music and gene expression/);
  assert.equal(new URL(page.url()).pathname,'/informatics/');checks.push({embedded:true,internalNavigationPreservesParent:true,status:'passed'});
 }finally{await pauseMedia(ctx);await ctx.close();}
 assert.deepEqual(errors,[]);
 await fs.writeFile(output+'/verification.json',JSON.stringify({url:base+'library.html?collection=sound',candidate,checkedAt:new Date().toISOString(),processAudioMuted:true,mediaPausedAndContextsClosed:true,sources,checks,errors},null,2)+'\n');
 console.log(JSON.stringify({output,checks,errors},null,2));
}finally{await browser.close();await server.close();}
