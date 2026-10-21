import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.join(process.env.ATLAS_ROOT||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),'Informatics');
const base='https://staging.universalmind.tv/informatics/',live=process.env.ATLAS_LIVE==='1',out=process.env.ATLAS_QA_OUT||'/private/tmp/molecular-atlas-style-qa';
await fs.mkdir(out,{recursive:true});
const menu=['About','Geometry Atlas','Molecular Atlas','Sound Atlas','Vision Atlas','Language Atlas','Universal Research','Partners'];
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),results=[];
async function headerProof(page){
 assert.equal(await page.locator('.molecular-header-link').count(),0);
 assert.equal(await page.locator('#atlas-toggle').innerText(),'Research Atlas');
 const boxes=await page.locator('#experience header .brand,#atlas-toggle,#atlas-menu-toggle,#record-toggle,#sound,#fullscreen,#back').evaluateAll(es=>es.filter(e=>e.offsetWidth&&e.offsetHeight).map(e=>{const r=e.getBoundingClientRect();return {id:e.id||'brand',x:r.x,y:r.y,w:r.width,h:r.height};}));
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<=1||Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)<=1,`Header overlap: ${a.id}/${b.id}`);}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
}
async function area(page,name){await page.locator('#atlas-toggle').click();await page.locator(`#atlas-menu [data-area="${name}"]`).click();await page.waitForFunction(n=>document.querySelector('#experience').dataset.area===n,name);}
async function roadmap(page,mode,width){
 await page.locator('#about [data-network]').click();const dialog=page.locator('.network-overlay');await dialog.waitFor();assert.equal(await dialog.getAttribute('data-video'),mode);
 const box=await dialog.boundingBox();assert.equal(box.x,0);assert.equal(box.y,0);assert.equal(box.width,await page.evaluate(()=>innerWidth));assert.equal(box.height,await page.evaluate(()=>innerHeight));
 assert.equal(await page.locator('#about').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 const video=page.locator(mode==='shared'?'#film':'.network-film');if(mode==='fallback'){assert.equal(await video.evaluate(v=>v.muted),true);await dialog.locator('[data-network-play]').click();}
 await video.evaluate(v=>new Promise((resolve,reject)=>{const start=v.currentTime,deadline=Date.now()+45000;const tick=()=>{if(v.currentTime>start+.15&&!v.paused)resolve();else if(Date.now()>deadline)reject(Error('Roadmap video did not advance'));else setTimeout(tick,100);};tick();}));
 await page.screenshot({path:path.join(out,`roadmap-${mode}-${width}.png`)});
 await dialog.locator('.network-zoom').click();assert.equal(await dialog.locator('.network-map-scroll').evaluate(e=>e.classList.contains('is-enlarged')),true);await dialog.locator('.network-zoom').click();
 await dialog.locator('[data-network-close]').click();await dialog.waitFor({state:'hidden'});await page.locator('#about [data-network]:focus').waitFor();
 if(mode==='fallback')await page.waitForFunction(()=>{const v=document.querySelector('.network-film');return v.paused&&!v.getAttribute('src');});else assert.equal(await video.evaluate(v=>v.paused),false);
}
try{
 for(const viewport of [{width:1470,height:956},{width:1024,height:768},{width:390,height:844},{width:320,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  await context.addInitScript(()=>{let full=null;window.__nativeCalls={enter:0,exit:0};Object.defineProperty(document,'fullscreenElement',{get:()=>full});Element.prototype.requestFullscreen=async function(){full=this;window.__nativeCalls.enter++;document.dispatchEvent(new Event('fullscreenchange'));};document.exitFullscreen=async()=>{full=null;window.__nativeCalls.exit++;document.dispatchEvent(new Event('fullscreenchange'));};});
  if(!live)await context.route(/https:\/\/staging\.universalmind\.tv\/(informatics|Informatics)\//,async route=>{const rel=decodeURIComponent(new URL(route.request().url()).pathname.replace(/^\/(informatics|Informatics)\//,''))||'index.html',file=path.resolve(root,rel.endsWith('/')?rel+'index.html':rel);if(!file.startsWith(root+'/'))return route.abort();try{await route.fulfill({status:200,body:await fs.readFile(file),contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'}[path.extname(file)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Missing'});}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?area=geometry');await page.locator('.landing-name[data-about]').click();await roadmap(page,'fallback',viewport.width);await page.locator('#about-close').click();await page.waitForFunction(()=>!document.querySelector('#launch').disabled);await page.locator('#launch').click();
  await page.waitForFunction(()=>{const v=document.querySelector('#film');return v.readyState>=2&&!v.paused&&v.currentTime>.2;},null,{timeout:60000});
  await headerProof(page);await page.locator('#atlas-toggle').focus();await page.keyboard.press('ArrowDown');assert.deepEqual(await page.locator('#atlas-menu [role="menuitem"]').allTextContents(),menu);assert.equal(await page.locator('#atlas-menu [data-about]').evaluate(e=>e===document.activeElement),true);await page.screenshot({path:path.join(out,`navigation-${viewport.width}.png`)});await page.keyboard.press('Enter');await page.locator('#about[open]').waitFor();await roadmap(page,'shared',viewport.width);await page.keyboard.press('Escape');await page.locator('#about').waitFor({state:'hidden'});await page.locator('#atlas-menu-toggle:focus').waitFor();
  for(const destination of ['sound','vision','language','partners','geometry']){await area(page,destination);assert.equal(await page.locator('#experience').getAttribute('data-area'),destination);}

  await page.evaluate(()=>{window.__film=document.querySelector('#film');window.__mediaEvents=[];for(const name of ['pause','emptied','loadstart'])__film.addEventListener(name,()=>__mediaEvents.push(name));window.__startTime=__film.currentTime;});
  const initial=await page.evaluate(()=>({src:__film.src,full:document.fullscreenElement.id,calls:__nativeCalls}));
  await area(page,'molecular');const frame=page.frameLocator('#molecular-frame');await frame.locator('body[data-ready="true"]').waitFor({timeout:60000});await headerProof(page);
  assert.equal(await page.locator('#record-navigation').isVisible(),false);assert.equal(await frame.locator('video,audio').count(),0);assert.equal(await frame.locator('.brand').isVisible(),false);
  const transparency=await frame.locator('#viewport canvas').evaluate(src=>{const c=document.createElement('canvas');c.width=c.height=10;const ctx=c.getContext('2d');ctx.drawImage(src,0,0,10,10);return ctx.getImageData(0,0,1,1).data[3];});assert.equal(transparency,0);
  assert.equal(await frame.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');assert.equal(await page.locator('#film').evaluate(e=>getComputedStyle(e).opacity),'0.75');
  await page.screenshot({path:path.join(out,`embedded-${viewport.width}.png`),fullPage:true});
  await frame.locator('#target-selector [data-target="DOCK2"]').click();await frame.locator('body[data-target="DOCK2"][data-busy="false"]').waitFor({timeout:60000});
  await frame.locator('#geometry-kind').selectOption('icosahedron');await frame.locator('#geometry-badge').waitFor();await frame.locator('#return').click();await page.waitForFunction(()=>document.querySelector('#experience').dataset.area==='geometry');assert.equal(await page.locator('#atlas-toggle').evaluate(e=>e===document.activeElement),true);await headerProof(page);
  await area(page,'molecular');assert.equal(await frame.locator('#target-title').innerText(),'DOCK2');await frame.locator('#target-selector [data-target="OXTR"]').click();await frame.locator('body[data-target="OXTR"][data-busy="false"]').waitFor({timeout:60000});
  await frame.locator('[data-view="evidence"]').click();await frame.locator('[data-dna-context]').click();await page.locator('.science-tfbs[open]').waitFor();await page.keyboard.press('Escape');await frame.locator('[data-dna-context]:focus').waitFor();await frame.locator('#close-detail').click();
  await page.locator('#atlas-toggle').click();await page.locator('#atlas-menu [data-library="all"]').click();const library=page.frameLocator('.library-overlay iframe');await library.locator('.contents-chapter').first().waitFor({timeout:60000});await library.locator('#atlas-toggle').click();assert.deepEqual(await library.locator('#atlas-menu [role="menuitem"]').allTextContents(),menu);await page.keyboard.press('Escape');await page.locator('.library-overlay [aria-label="Close Universal Research"]').click();
  assert.deepEqual(await page.evaluate(()=>({src:document.querySelector('#film').src,full:document.fullscreenElement.id,calls:__nativeCalls})),initial);assert.equal(await page.evaluate(()=>window.__film===document.querySelector('#film')),true);assert.deepEqual(await page.evaluate(()=>__mediaEvents),[]);assert.ok(await page.evaluate(()=>__film.currentTime>__startTime));
  await page.locator('#sound').click();assert.equal(await page.locator('#film').evaluate(e=>e.muted),true);await page.locator('#sound').click();assert.equal(await page.locator('#film').evaluate(e=>e.muted),false);
  await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(e=>e.pause()));
  await page.goto(base+'molecular/');await page.locator('body[data-ready="true"]').waitFor({timeout:60000});
  assert.equal(await page.locator('.brand .brand-flower').getAttribute('src'),'/vogue/iam/favicon.png');assert.equal(await page.locator('.brand strong').evaluate(e=>getComputedStyle(e).fontWeight),'700');assert.equal(await page.locator('.brand>span').evaluate(e=>getComputedStyle(e).fontWeight),'400');
  assert.equal(await page.locator('.brand').innerText(),'UNIVERSAL\nINFORMATICS');assert.equal(await page.locator('.brand .brand-flower').evaluate(e=>e.complete&&e.naturalWidth>0),true);
  assert.equal(await page.locator('.molecular-film').evaluate(e=>e.muted&&e.paused),true);await page.locator('#background-play').click();await page.waitForFunction(()=>document.querySelector('.molecular-film').currentTime>.2);await page.screenshot({path:path.join(out,`standalone-${viewport.width}.png`),fullPage:true});await page.locator('#background-play').click();assert.equal(await page.locator('.molecular-film').evaluate(e=>e.paused),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(e=>e.pause()));await context.close();
  results.push({viewport,navigationOrder:menu,aboutFirstKeyboardAndFocus:true,atlasDestinations:true,libraryMenuMatches:true,roadmapFullViewportVideo:true,roadmapLandingFallbackMuted:true,roadmapSharedFilmPreserved:true,roadmapCleanupAndFocus:true,noHeaderOverlap:true,transparentCanvas:true,existingVideoPreserved:true,playbackContinued:true,globalSoundControls:true,selectionPreservedAcrossAreas:true,dnaEvidenceLink:true,universalResearchLink:true,brandLogoAndWeights:true,standaloneMutedVideoControls:true});
 }
 const report={passed:true,live,processMuted:true,nativeFullscreen:false,results};await fs.writeFile(path.join(out,'entry-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close().catch(()=>{});await server.close().catch(()=>{});}
