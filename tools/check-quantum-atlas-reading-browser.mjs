import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.QA_OUTPUT||path.join(root,'research/informatics/quantum-wiki-20261101');await fs.mkdir(out,{recursive:true});
const base=process.env.QA_BASE||'https://staging.universalmind.tv';
const candidate=process.env.CANDIDATE==='1',mode=candidate?'candidate':base.includes('staging.')?'staging':'production';
const guide=JSON.parse(await fs.readFile(path.join(root,'Informatics/quantum/reading/quantum-atlas.json'),'utf8'));
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),errors=[],results=[];
async function routing(context){if(candidate)await context.route(base+'/**',async route=>{
 const pathname=decodeURIComponent(new URL(route.request().url()).pathname);let rel=pathname.replace(/^\/(?:I|i)nformatics\//,'Informatics/').replace(/^\//,'');if(rel.endsWith('/'))rel+='index.html';
 if(!['Informatics/index.html','Informatics/quantum/index.html','Informatics/llms.txt','read/index.html','read/resources.json','llms.txt'].includes(rel)&&!rel.startsWith('Informatics/read/')&&!rel.startsWith('Informatics/quantum/reading/'))return route.continue();
 const type={'.html':'text/html','.json':'application/json','.md':'text/markdown','.csv':'text/csv','.css':'text/css'}[path.extname(rel)]||'text/plain';
 await route.fulfill({status:200,contentType:type,body:await fs.readFile(path.join(root,rel))});
});}
async function downloads(page,scope){for(const ext of ['json','csv','md']){
 const waiting=page.waitForEvent('download');await scope.locator(`a[download="quantum-atlas.${ext}"]`).first().click();const d=await waiting;assert.equal(d.suggestedFilename(),`quantum-atlas.${ext}`);
 const local=path.join(out,'download-check.'+ext);await d.saveAs(local);assert.deepEqual(await fs.readFile(local),await fs.readFile(path.join(root,'Informatics/quantum/reading/quantum-atlas.'+ext)));await d.delete();await fs.unlink(local);
}}
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',acceptDownloads:true});await routing(context);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/informatics/?entry=research&area=quantum',{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#quantum-frame');await frame.locator('h1').first().waitFor({state:'visible'});
  assert.equal(await page.locator('#quantum-atlas-machine').isVisible(),false);
  assert.equal(await frame.locator('#quantum-atlas-machine').isVisible(),false);
  assert.deepEqual(await page.locator('#quantum-atlas-data').evaluate(e=>JSON.parse(e.textContent)),guide);
  assert.deepEqual(await frame.locator('#quantum-atlas-data').evaluate(e=>JSON.parse(e.textContent)),guide);
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
  await page.screenshot({path:path.join(out,mode+'-quantum-'+width+'.png')});
  await frame.locator('[data-hypothesis="modular"]').click();assert.equal(await frame.locator('#hypothesis-detail').innerText(),guide.geometry_explanations.modular);
  await frame.locator('#open-nature').click();assert.equal(await frame.locator('#nature-dialog').isVisible(),true);await frame.locator('#close-nature').click();
  const footer=frame.locator('nav.quantum-reading-links');await footer.scrollIntoViewIfNeeded();assert.equal(await footer.locator('a').count(),4);
  assert.equal(await frame.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:path.join(out,mode+'-downloads-'+width+'.png')});
  if(width===1440){if(!candidate)await downloads(page,footer);const pending=page.waitForEvent('popup');await footer.locator('a').first().click();const popup=await pending;await popup.waitForLoadState('domcontentloaded');assert.equal(await popup.locator('h1').count(),2);assert.equal(await popup.locator('table').count(),4);await popup.close();assert.equal(await page.locator('#quantum-frame').isVisible(),true);}
  for(const f of page.frames())await f.evaluate(()=>document.querySelectorAll('video,audio').forEach(x=>x.pause())).catch(()=>{});
  await context.close();results.push({width,hiddenData:true,footerLinks:4,hypothesisControl:true,natureDialog:true,noHorizontalOverflow:true,nativeFullscreen:false});
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900},acceptDownloads:true});await routing(context);
 for(const rel of ['/informatics/read/quantum/index.html','/informatics/read/vision/index.html','/informatics/read/computer-vision/index.html','/informatics/read/index.html','/read/']){
  const p=await context.newPage();await p.goto(base+rel,{waitUntil:'load'});assert.equal(await p.locator('script').count(),0,rel);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,rel);assert((await p.locator('body').innerText()).includes('separate research directions'),rel);
  if(rel.includes('/quantum/')){if(!candidate)await downloads(p,p.locator('nav.quantum-reading-links').first());await p.screenshot({path:path.join(out,mode+'-quantum-wiki-no-js.png')});}
  await p.close();
 }
 await context.close();assert.deepEqual(errors,[]);
 const report={passed:true,mode,processAudioMuted:true,errors,wikiPagesWithoutJavascript:5,primaryAndWikiDownloadsByteMatched:!candidate,existingControlsVerified:true,results};await fs.writeFile(path.join(out,mode+'-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await server.close();}
