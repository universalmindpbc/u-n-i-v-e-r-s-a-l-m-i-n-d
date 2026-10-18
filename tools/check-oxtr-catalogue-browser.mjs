import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const candidate=process.env.INFORMATICS_CANDIDATE==='1';
const out='/private/tmp/oxtr-browser-'+(candidate?'candidate':'staging');
await fs.mkdir(out,{recursive:true});
const data=JSON.parse(await fs.readFile(path.join(root,'Informatics/pilot-v1/oxtr-tfbs-v1/catalogue.json'),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const server=await chromium.launchServer({downloadsPath:out,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'),'Process-level silence required before navigation');
const browser=await chromium.connect(server.wsEndpoint()),results=[];
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport,acceptDownloads:true,reducedMotion:'reduce'});
  await context.addInitScript(()=>{let full=null;Object.defineProperty(document,'fullscreenElement',{get:()=>full});Element.prototype.requestFullscreen=async function(){full=this;document.dispatchEvent(new Event('fullscreenchange'));};document.exitFullscreen=async()=>{full=null;document.dispatchEvent(new Event('fullscreenchange'));};});
  if(candidate)await context.route(base+'**',async route=>{
   const relative=decodeURIComponent(new URL(route.request().url()).pathname.slice('/informatics/'.length))||'index.html';
   const file=path.resolve(root,'Informatics',relative);if(!file.startsWith(path.join(root,'Informatics')+'/'))return route.abort();
   try{await route.fulfill({status:200,body:await fs.readFile(file),contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.csv':'text/csv','.zip':'application/zip'}[path.extname(file)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Missing candidate asset'});}
  });
  let failFirstCatalogue=true;
  await context.route(base+'pilot-v1/oxtr-tfbs-v1/catalogue.json*',async route=>{
   if(failFirstCatalogue){failFirstCatalogue=false;return route.fulfill({status:503,body:'Deliberate retry check'});}
   return route.fallback();
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'?atlas=1&record=fibonacci-m9-p24',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!document.querySelector('#launch').disabled);await page.locator('#launch').click();
   const frame=page.frameLocator('#atlas-frame');
   await frame.locator('.intro h1').filter({hasText:'M9 / P24'}).waitFor();
   const originalUrl=page.url();
   const before=await page.evaluate(()=>({fullscreen:document.fullscreenElement?.id,media:[...document.querySelectorAll('video,audio')].map(m=>({src:m.currentSrc,paused:m.paused,time:m.currentTime}))}));
   const entry=frame.locator('#atlas-science-summary [data-science-tfbs]');
   await entry.click();
   const dialog=frame.locator('.science-tfbs');
   await dialog.getByRole('button',{name:'Try again',exact:true}).click();
   await dialog.locator('#tfbs-species').waitFor();
   assert.equal(await dialog.locator('tbody tr').count(),data.evidence.filter(r=>r.species==='Homo sapiens').length);
   await dialog.locator('#tfbs-species').selectOption('animal');
   assert.equal(await dialog.locator('tbody tr').count(),data.evidence.filter(r=>r.species!=='Homo sapiens').length);
   await dialog.locator('#tfbs-species').selectOption('all');
   assert.equal(await dialog.locator('tbody tr').count(),43);
   await dialog.locator('#tfbs-kind').selectOption('tested_candidate');
   assert.equal(await dialog.locator('tbody tr').count(),4);
   await dialog.locator('#tfbs-kind').selectOption('all');
   await dialog.locator('#tfbs-species').selectOption('human');
   await dialog.evaluate(e=>e.scrollTop=0);
   assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
   await page.screenshot({path:path.join(out,`catalogue-${viewport.width}.png`)});
   if(viewport.width===1440){
    for(const [label,file] of [['Complete JSON data','oxtr-tfbs-json.zip'],['Complete CSV data','oxtr-tfbs-csv.zip'],['Literature table','literature-evidence.csv']]){
     const link=dialog.getByRole('link',{name:label+' ↓',exact:true});
     if(candidate){
      const url=await link.getAttribute('href');
      const digest=await page.evaluate(async u=>{const bytes=await (await fetch(u)).arrayBuffer();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');},url);
      assert.equal(digest,hash(await fs.readFile(path.join(root,'Informatics/pilot-v1/oxtr-tfbs-v1',file))));
     }else{
      const wait=page.waitForEvent('download',{timeout:120000});await link.click();const download=await wait;const saved=path.join(out,file);await download.saveAs(saved);
      assert.equal(hash(await fs.readFile(saved)),hash(await fs.readFile(path.join(root,'Informatics/pilot-v1/oxtr-tfbs-v1',file))));
     }
    }
   }
   await page.keyboard.press('Escape');
   assert.equal(await dialog.evaluate(e=>e.open),false);
   assert.equal(await entry.evaluate(e=>e===document.activeElement),true);
   await page.keyboard.press('Enter');
   assert.equal(await dialog.evaluate(e=>e.open),true);
   const bounds=await dialog.boundingBox();
   await page.mouse.click(bounds.x-3,bounds.y+20);
   assert.equal(await dialog.evaluate(e=>e.open),false);
   assert.equal(await entry.evaluate(e=>e===document.activeElement),true);
   await frame.getByRole('tab',{name:'Geometry summary',exact:true}).click();
   await frame.locator('#summary-science-slot [data-science-tfbs]').click();
   assert.equal(await dialog.evaluate(e=>e.open),true);
   await dialog.getByRole('button',{name:'Close binding-site catalogue',exact:true}).click();
   // Shared background entry remains available on a different modulus.
   await frame.locator('#research-record').selectOption('fibonacci-m18-p24');
   await frame.locator('.intro h1').filter({hasText:'M18 / P24'}).waitFor();
   assert.equal(await frame.locator('#atlas-science-summary [data-science-tfbs]').count(),1);
   assert.equal(page.url(),originalUrl);
   const after=await page.evaluate(()=>({fullscreen:document.fullscreenElement?.id,media:[...document.querySelectorAll('video,audio')].map(m=>({src:m.currentSrc,paused:m.paused,time:m.currentTime}))}));
   assert.equal(after.fullscreen,before.fullscreen);
   assert.deepEqual(after.media.map(m=>[m.src,m.paused]),before.media.map(m=>[m.src,m.paused]));
   // About -> Genomics -> existing register -> catalogue stays in the experience.
   await page.locator('#experience [data-about]').click();
   await page.locator('#about [data-science-genomics]').click();
   await page.locator('.science-genomics [data-science-register]').click();
   await page.locator('.science-register:not(.science-tfbs) [data-science-tfbs]').click();
   await page.locator('.science-tfbs #tfbs-species').waitFor();
   assert.equal(page.url(),originalUrl);
   assert.equal(await page.evaluate(()=>document.fullscreenElement?.id),before.fullscreen);
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('.science-register:not(.science-tfbs)').evaluate(e=>e.open),true);
   assert.deepEqual(errors,[]);
   results.push({viewport,filters:true,retryAfterFailure:true,keyboardAndOutsideClose:true,escapeAndFocus:true,summaryAndSidebar:true,aboutNestedLightbox:true,fullscreenStatePreserved:true,mediaStatePreserved:true,downloadsMatched:viewport.width===1440,errors});
  }finally{await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});await context.close();}
 }
 const result={passed:true,candidate,processMuted:true,results};await fs.writeFile(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();await server.close();}
