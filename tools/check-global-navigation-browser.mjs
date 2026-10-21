import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../Informatics');
const live=process.env.ATLAS_LIVE==='1',out=process.env.ATLAS_QA_OUT||'/private/tmp/global-navigation-qa';
const base='https://staging.universalmind.tv/informatics/';
const labels=['About','Geometry Atlas','Transcription Atlas','Molecular Atlas','Sound Atlas','Vision Atlas','Language Atlas','Universal Research','Partners'];
await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),results=[];
async function menu(page){
 await page.locator('#atlas-toggle').focus();await page.keyboard.press('ArrowDown');
 assert.deepEqual(await page.locator('#atlas-menu [role=menuitem]').allTextContents(),labels);
 await page.keyboard.press('End');assert.equal(await page.locator('#atlas-menu [role=menuitem]').last().evaluate(e=>e===document.activeElement),true);
 await page.keyboard.press('Home');assert.equal(await page.locator('#atlas-menu [role=menuitem]').first().evaluate(e=>e===document.activeElement),true);
 const box=await page.locator('#atlas-menu').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=(await page.evaluate(()=>innerWidth))+1&&box.y+box.height<=(await page.evaluate(()=>innerHeight))+1,'Menu fits viewport');
}
async function catalogue(page){
 await page.locator('.science-tfbs[open]').waitFor();
 await page.locator('.science-tfbs .tfbs-source-guide').waitFor({timeout:60000});
 await page.locator('.science-tfbs #tfbs-explorer-heading').waitFor({state:'attached',timeout:60000});
 assert.equal(await page.locator('.science-tfbs').count(),1);
}
async function closeCatalogue(page){await page.locator('.science-tfbs .science-close').click();await page.locator('.science-tfbs').waitFor({state:'hidden'});await page.locator('#atlas-toggle:focus').waitFor();}
try{
 for(const viewport of [{width:1470,height:956},{width:1024,height:768},{width:390,height:844},{width:320,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  await context.addInitScript(()=>{let full=null;window.__fullscreenCalls=0;Object.defineProperty(document,'fullscreenElement',{get:()=>full});Element.prototype.requestFullscreen=async function(){full=this;window.__fullscreenCalls++;document.dispatchEvent(new Event('fullscreenchange'));};document.exitFullscreen=async()=>{full=null;document.dispatchEvent(new Event('fullscreenchange'));};});
  if(!live)await context.route(/https:\/\/staging\.universalmind\.tv\/(informatics|Informatics)\//,async route=>{const rel=decodeURIComponent(new URL(route.request().url()).pathname.replace(/^\/(informatics|Informatics)\//,''))||'index.html',file=path.resolve(root,rel.endsWith('/')?rel+'index.html':rel);if(!file.startsWith(root+'/'))return route.abort();try{await route.fulfill({status:200,body:await fs.readFile(file),contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.bcif':'application/octet-stream'}[path.extname(file)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Missing'});}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'?area=geometry');await page.waitForFunction(()=>!document.querySelector('#launch').disabled);await page.locator('#launch').click();
   await page.waitForFunction(()=>!document.querySelector('#experience').hidden);
   await menu(page);await page.screenshot({path:path.join(out,`main-menu-${viewport.width}.png`)});
   const before=await page.evaluate(()=>({film:document.querySelector('#film').src,full:document.fullscreenElement?.id,calls:__fullscreenCalls}));
   await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await catalogue(page);
   assert.equal(await page.locator('#atlas-menu').isVisible(),false);await closeCatalogue(page);
   assert.deepEqual(await page.evaluate(()=>({film:document.querySelector('#film').src,full:document.fullscreenElement?.id,calls:__fullscreenCalls})),before);
   await menu(page);await page.locator('#atlas-menu [data-area="molecular"]').click();
   await page.frameLocator('#molecular-frame').locator('body[data-ready=true]').waitFor({timeout:60000});
   assert.equal(await page.frameLocator('#molecular-frame').locator('#atlas-navigation').isVisible(),false);
   await menu(page);await page.locator('#atlas-menu [data-science-tfbs]').click();await catalogue(page);await closeCatalogue(page);
   assert.equal(await page.locator('#experience').getAttribute('data-area'),'molecular');
   await menu(page);await page.locator('#atlas-menu [data-library]').click();
   const library=page.frameLocator('.library-overlay iframe');await library.locator('.contents-chapter').first().waitFor({timeout:60000});
   await library.locator('#atlas-toggle').click();assert.deepEqual(await library.locator('#atlas-menu [role=menuitem]').allTextContents(),labels);
   await library.locator('[data-global-area="transcription"]').click();await catalogue(page);assert.equal(await page.locator('.library-overlay').isVisible(),false);await closeCatalogue(page);
   assert.equal(await page.locator('#experience').getAttribute('data-area'),'molecular');
   await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause()));
   await page.goto(base+'molecular/');await page.locator('body[data-ready=true]').waitFor({timeout:60000});
   await menu(page);await page.screenshot({path:path.join(out,`molecular-menu-${viewport.width}.png`)});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.keyboard.press('Escape');assert.equal(await page.locator('#atlas-menu').isVisible(),false);assert.equal(await page.locator('#atlas-toggle').evaluate(e=>e===document.activeElement),true);
   await menu(page);await page.locator('#atlas-menu [data-global-area="transcription"]').click();await catalogue(page);await closeCatalogue(page);
   assert.equal(await page.evaluate(()=>__fullscreenCalls),0);
   await page.goto(base+'library.html');await page.locator('.contents-chapter').first().waitFor({timeout:60000});
   await menu(page);await page.screenshot({path:path.join(out,`library-menu-${viewport.width}.png`)});
   await page.locator('#atlas-menu [data-global-area="transcription"]').click();await catalogue(page);await closeCatalogue(page);
   assert.deepEqual(errors,[]);
   results.push({viewport,sharedMenuLabels:labels,keyboardAndFocus:true,allMenusFit:true,mainAndEmbeddedMolecularTranscription:true,standaloneMolecularTranscription:true,embeddedAndStandaloneResearchTranscription:true,originalCatalogueReused:true,mediaSourceAndFullscreenPreserved:true,noPageErrors:true});
  }finally{for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await context.close();}
 }
 const report={passed:true,live,processMuted:true,nativeFullscreen:false,results};await fs.writeFile(path.join(out,'navigation-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close().catch(()=>{});await server.close().catch(()=>{});}
