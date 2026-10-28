import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../..');
const origin='https://staging.universalmind.tv';
let password=process.env.HAPPINESS_QA_PASSWORD;
assert(password,'Supply an invitation credential through the QA environment.');
delete process.env.HAPPINESS_QA_PASSWORD;
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={verifiedAt:new Date().toISOString(),origin,processAudioDisabled:true,nativeFullscreenInvoked:false,checks:[],errors:[]};
const pause=async page=>{for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});};
const stub=async context=>context.addInitScript(()=>{
 let active=null;window.__fullscreenRequests=0;
 Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>active});
 Element.prototype.requestFullscreen=function(){active=this;window.__fullscreenRequests++;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();};
 document.exitFullscreen=()=>{active=null;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();};
});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 const context=await browser.newContext({viewport:{width:1470,height:920}});await stub(context);
 const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
 const denied=await context.request.get(origin+'/happiness/media.php');assert.equal(denied.status(),401);
 const access=await context.request.get(origin+'/happiness/access.php');assert.equal(access.status(),403);
 const invalid=await context.request.post(origin+'/happiness/',{form:{csrf:'invalid',password:'invalid'},headers:{Accept:'application/json'}});assert.equal(invalid.status(),403);
 await page.goto(origin+'/happiness/',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('iframe').count(),0);
 await page.locator('#password').fill('invalid-happiness-qa');await page.locator('.access-submit').click();await page.getByText('Please check your invitation password.',{exact:true}).waitFor();
 await page.locator('#password').fill(password);await page.locator('.access-submit').click();
 await page.locator('iframe.events-stage').waitFor();
 const frame=page.frames().find(f=>f.url().includes('/happiness/?experience=1'))||await new Promise(resolve=>page.once('framenavigated',resolve));
 await frame.locator('#network-canvas').waitFor();
 await frame.waitForFunction(()=>document.querySelector('#network-field').dataset.animationState==='running');
 report.checks.push({invitationGate:true,invalidCsrf403:true,invalidPassword401:true,unauthenticatedMedia401:true,accessSource403:true,pathScopedSession:true});
 const cookie=(await context.cookies()).find(c=>c.name==='um_happiness');assert(cookie&&cookie.secure&&cookie.httpOnly&&cookie.path==='/happiness/');
 assert.equal(await page.evaluate(()=>document.querySelector('#password').value),'');
 await frame.waitForFunction(()=>{const v=document.getElementById('opening-loop');return v.readyState>=2&&!v.paused;},null,{timeout:60000});
 const start=await frame.locator('#opening-loop').evaluate(v=>v.currentTime);await wait(600);
 const background=await frame.locator('#opening-loop').evaluate(v=>({muted:v.muted,defaultMuted:v.defaultMuted,volume:v.volume,time:v.currentTime,source:v.currentSrc,width:v.videoWidth,height:v.videoHeight}));
 assert(background.muted&&background.defaultMuted&&background.volume===0&&background.time!==start);
 report.checks.push({silentBackground:background});
 const f1=Number(await frame.locator('#network-canvas').getAttribute('data-frame'));await wait(300);const f2=Number(await frame.locator('#network-canvas').getAttribute('data-frame'));assert(f2>f1);
 await frame.locator('#motion-toggle').click();const frozen=await frame.locator('#network-canvas').getAttribute('data-frame');await wait(350);assert.equal(await frame.locator('#network-canvas').getAttribute('data-frame'),frozen);assert(await frame.locator('#opening-loop').evaluate(v=>v.paused));
 await frame.locator('#motion-toggle').click();await wait(200);assert(Number(await frame.locator('#network-canvas').getAttribute('data-frame'))>Number(frozen));
 report.checks.push({network:await frame.evaluate(()=>({nodes:HappinessNetwork.nodeCount,edges:HappinessNetwork.edgeCount})),animationPauseResume:true});
 await frame.locator('[data-response=lighting]').click();assert((await frame.locator('#system-detail').textContent()).startsWith('Lighting —'));
 await frame.locator('[data-response=lighting]').click();assert.equal(await frame.locator('#system-detail').textContent(),'');
 await frame.locator('#global-nav-toggle').click();await frame.locator('#about-panel').waitFor();
 const expected=(await fs.readFile(path.join(root,'happiness/index.php'),'utf8')).match(/<article class="about-copy"[\s\S]*?<\/article>/)[0].match(/<p>[^<]+<\/p>/g).map(p=>p.slice(3,-4).replaceAll('&amp;','&'));
 const actual=await frame.locator('.about-copy > p:not(.about-eyebrow)').allTextContents();assert.deepEqual(actual,expected);
 await page.keyboard.press('Shift+Tab');assert.equal(await frame.evaluate(()=>document.activeElement.id),'about-return');await page.keyboard.press('Escape');assert(await frame.locator('#about-panel').isHidden());
 report.checks.push({exactAboutText:true,aboutFocusTrapAndEscape:true,interactiveResponseDetails:true});
 for(const viewport of [{width:1920,height:1080},{width:1470,height:920},{width:1024,height:768},{width:390,height:844},{width:320,height:568}]){
  await page.setViewportSize(viewport);await wait(250);
  const dimensions=await frame.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,paths:document.querySelectorAll('#connection-paths path').length,logoWidth:document.querySelector('#central-flower').getBoundingClientRect().width,networkWidth:document.querySelector('#network-field').getBoundingClientRect().width,headerLogo:document.querySelector('.brand-flower img').naturalWidth}));
  assert(dimensions.scroll<=dimensions.viewport,`Horizontal overflow at ${viewport.width}`);assert.equal(dimensions.paths,16);assert(dimensions.logoWidth/dimensions.networkWidth<=.33);assert.equal(dimensions.headerLogo,1352);
  if(viewport.width===1470||viewport.width===390){await frame.locator('#motion-toggle').click();await frame.locator('body').screenshot({path:path.join(here,`happiness-${viewport.width}.png`)});await frame.locator('#motion-toggle').click();}
  report.checks.push({layout:viewport,dimensions});
 }
 await page.setViewportSize({width:1470,height:920});
 for(const startAt of [0,60,103]){
  await frame.locator(`[data-film-start="${startAt}"]`).click();
  await frame.locator('#film-mount iframe').waitFor({timeout:30000});
  await frame.waitForFunction(start=>Number(document.querySelector('#film-view').dataset.currentTime)>start+.3,startAt,{timeout:60000});
  assert(await frame.locator('#opening-loop').evaluate(v=>v.paused));assert.equal(await frame.locator('#network-field').getAttribute('data-animation-state'),'paused');
  const current=Number(await frame.locator('#film-view').getAttribute('data-current-time'));assert(current<startAt+12);
  assert.equal(await frame.locator('#film-view button').count(),1);assert.equal(await frame.locator('#film-view input').count(),0);
  assert.equal(await frame.locator('#film-view button').getAttribute('id'),'film-back');
  const timer=await frame.locator('#film-timecode').evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,bottom:innerHeight-r.bottom,text:el.textContent};});assert.equal(timer.left,26);assert.equal(timer.bottom,23);assert(timer.text.includes(' / 5:55'));
  await frame.locator('#film-back').click();assert.equal(await frame.locator('#film-mount iframe').count(),0);
  await frame.waitForFunction(()=>document.querySelector('#network-field').dataset.animationState==='running');
  report.checks.push({filmStart:startAt,timeAdvanced:current,timerBottomLeft:true,backOnly:true,backRemovesPlayer:true});
 }
 await frame.locator('#fullscreen-toggle').click();assert.equal(await frame.locator('#fullscreen-toggle').getAttribute('aria-label'),'Enter fullscreen');await frame.locator('#fullscreen-toggle').click();assert.equal(await frame.locator('#fullscreen-toggle').getAttribute('aria-label'),'Exit fullscreen');
 report.checks.push({fullscreenControlsTestedWithApiStub:true});
 // Compare the actual deployed static files with the committed local source.
 for(const file of ['happiness/assets/happiness.css','happiness/assets/happiness.js','happiness/assets/network.js','happiness/assets/gate-launch.js','happiness/assets/universal-mind-flower.png']){
  const response=await context.request.get(origin+'/'+file);assert.equal(response.status(),200);
  const local=await fs.readFile(path.join(root,file));assert((await response.body()).equals(local),`Served file differs: ${file}`);
  report.checks.push({asset:file,sha256:crypto.createHash('sha256').update(local).digest('hex')});
 }
 await pause(page);await context.close();
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await stub(reduced);
 const quiet=await reduced.newPage();await quiet.goto(origin+'/happiness/');await quiet.locator('#password').fill(password);await quiet.locator('.access-submit').click();await quiet.locator('.events-stage').waitFor();
 const staticFrame=quiet.frames().find(f=>f.url().includes('?experience=1'))||await new Promise(resolve=>quiet.once('framenavigated',resolve));await staticFrame.locator('#network-canvas').waitFor();await wait(300);
 assert.equal(await staticFrame.locator('#network-field').getAttribute('data-animation-state'),'paused');assert(await staticFrame.locator('#opening-loop').evaluate(v=>v.paused&&!v.getAttribute('src')));
 assert((await staticFrame.locator('.connection-pulse').evaluateAll(paths=>paths.map(p=>getComputedStyle(p).animationName))).every(name=>name==='none'));
 report.checks.push({reducedMotionStaticNetworkAndPoster:true});await reduced.close();
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=String(error.stack||error).replaceAll(password,'[redacted]');}
finally{
 for(const context of browser.contexts()){for(const page of context.pages())await pause(page);await context.close();}
 await browser.close();await server.close();password='';await fs.writeFile(path.join(here,'verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors,failure:report.failure},null,2));if(!report.passed)process.exitCode=1;
}
