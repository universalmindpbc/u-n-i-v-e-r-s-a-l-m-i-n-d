import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin='https://staging.universalmind.tv',repo='/private/tmp/um-directory-20261028/repo',out='/private/tmp/um-directory-20261028/organic-qa';
await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={verifiedAt:new Date().toISOString(),processAudioDisabled:true,nativeFullscreenInvoked:false,fullscreenVerification:'Fullscreen API intercepted; persistent owner document, activation and routing verified without invoking native fullscreen.',checks:[],errors:[]};
let password='';
const pause=async page=>{for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(x=>x.pause())).catch(()=>{});};
const stub=async context=>context.addInitScript(()=>{
 window.__documentToken=Math.random().toString(36);window.__fullscreenRequests=[];let active=null;
 Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>active});
 Element.prototype.requestFullscreen=function(){window.__fullscreenRequests.push({activation:navigator.userActivation.isActive});active=this;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();};
 document.exitFullscreen=()=>{active=null;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();};
});
const directory=page=>page.frames().find(f=>new URL(f.url()).pathname==='/home/'&&f!==page.mainFrame())||page.mainFrame();
const mediaCheck=async frame=>{
 await frame.waitForFunction(()=>{const v=document.querySelector('.festival-film');return v?.readyState>=2&&!v.paused;},null,{timeout:45000});
 const first=await frame.locator('.festival-film').evaluate(v=>v.currentTime);await new Promise(r=>setTimeout(r,500));
 const state=await frame.locator('.festival-film').evaluate(v=>({source:v.currentSrc,muted:v.muted,defaultMuted:v.defaultMuted,volume:v.volume,paused:v.paused,playsInline:v.playsInline,autoplay:v.autoplay,ready:v.readyState,time:v.currentTime,error:v.error?.code}));
 assert.equal(state.source,origin+'/home/assets/festival-loop.mp4');assert(state.muted&&state.defaultMuted&&state.playsInline&&state.autoplay&&!state.paused&&state.time>first);assert.equal(state.volume,0);return state;
};
try{
 password=process.env.EVENTS_QA_PASSWORD||'';assert(password,'Set EVENTS_QA_PASSWORD for the authorized staging login check.');
 const context=await browser.newContext({viewport:{width:1664,height:936}});await stub(context);const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});const token=await page.evaluate(()=>__documentToken);
 await page.locator('[data-access-password]').fill(password);await page.waitForTimeout(80);await page.getByRole('button',{name:'enter',exact:true}).click();await page.waitForURL(origin+'/home/');await page.frameLocator('.um-experience-frame').locator('.routes.is-ready').waitFor();
 let home=directory(page);await home.locator('.routes.is-ready').waitFor();await home.waitForFunction(()=>document.documentElement.dataset.story==='complete',null,{timeout:30000});
 assert.equal(await page.evaluate(()=>__documentToken),token);assert(await page.evaluate(()=>Boolean(document.fullscreenElement)));assert((await page.evaluate(()=>__fullscreenRequests))[0].activation);
 report.checks.push({loginFullscreenOwnerRetained:true,silentVideo:await mediaCheck(home)});
 const rain=await home.locator('[data-directory-rain]').evaluate(c=>({columns:Number(c.dataset.rainColumns),landingColumns:Number(c.dataset.landingColumns),density:c.dataset.rainDensity,status:c.dataset.rainStatus,visiblePixels:c.getContext('2d').getImageData(0,0,c.width,c.height).data.filter((x,i)=>i%4===3&&x>0).length}));
 assert.equal(rain.columns,Math.max(1,Math.round(rain.landingColumns*.1)));assert.equal(rain.status,'running');assert(rain.visiblePixels>0);report.checks.push({sparseLandingRain:rain});
 const paths=await home.locator('.rail-line').evaluateAll(xs=>xs.map(x=>({d:x.getAttribute('d'),length:x.getTotalLength()})));assert.equal(new Set(paths.map(x=>x.d)).size,4);assert(paths.every(x=>(x.d.match(/ C /g)||[]).length>=4));
 await page.waitForTimeout(400);assert.notDeepEqual(await home.locator('.rail-line').evaluateAll(xs=>xs.map(x=>x.getAttribute('d'))),paths.map(x=>x.d));report.checks.push({fourDistinctOrganicPaths:true,contoursMoveGently:true,pathLengths:paths.map(x=>x.length)});
 await page.screenshot({path:out+'/desktop-1664.png'});
 await home.locator('.ambient-toggle').click();await page.waitForTimeout(100);
 const frozen=await home.evaluate(()=>({paths:[...document.querySelectorAll('.rail-line')].map(x=>x.getAttribute('d')),rain:document.querySelector('[data-directory-rain]').dataset.rainStatus,film:document.querySelector('video').paused}));await page.waitForTimeout(350);assert.deepEqual(await home.evaluate(()=>({paths:[...document.querySelectorAll('.rail-line')].map(x=>x.getAttribute('d')),rain:document.querySelector('[data-directory-rain]').dataset.rainStatus,film:document.querySelector('video').paused})),frozen);assert(frozen.film&&frozen.rain==='paused');await home.locator('.ambient-toggle').click();report.checks.push({motionPauseResume:true});
 for(const name of ['watch','events','festivals','research']){
  home=directory(page);await home.locator('.routes.is-ready').waitFor();await home.locator('[data-destination='+name+']').focus();await page.keyboard.press('Tab');
  const link=home.locator('[data-destination='+name+']');await link.hover();await page.waitForTimeout(200);assert.equal(await link.locator('.destination-title').evaluate(x=>getComputedStyle(x).color),'rgb(255, 230, 0)');
  await link.click();
  const expected=name==='watch'?/\/vogue\/iam\/(induction|vogue-self-report)\.html/:name==='events'?/\/events\/\?experience=1/:name==='festivals'?/\/happiness\//:/\/informatics\//;
  await page.waitForURL(expected);await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>__documentToken),token);assert(await page.evaluate(()=>Boolean(document.fullscreenElement)));assert.equal(await page.locator('.um-experience-frame').count(),1);
  const destination=page.frames().find(f=>f!==page.mainFrame()&&expected.test(f.url()));assert(destination);
  if(name==='events')await destination.locator('body.entered').waitFor();
  if(name==='festivals')await destination.locator('#experience').waitFor();
  if(name==='research')await destination.locator('#landing').waitFor();
  assert.equal(await destination.locator('input[type=password]').count(),0);
  report.checks.push({destination:name,url:page.url(),sameFullscreenDocument:true,noSecondPassword:true});
  await pause(page);await page.goBack({waitUntil:'domcontentloaded'});await page.waitForURL(origin+'/home/');await page.frameLocator('.um-experience-frame').locator('.routes.is-ready').waitFor();await directory(page).locator('.routes.is-ready').waitFor();assert(await page.evaluate(()=>Boolean(document.fullscreenElement)));
 }
 await pause(page);await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});await stub(mobile);const phone=await mobile.newPage();phone.on('pageerror',e=>report.errors.push(e.message));
 await phone.goto(origin+'/home/',{waitUntil:'domcontentloaded'});await phone.locator('.routes.is-ready').waitFor();await phone.keyboard.press('Tab');
 assert((await phone.locator('.destination-description').evaluateAll(xs=>xs.map(x=>getComputedStyle(x).display))).every(x=>x==='none'));
 report.checks.push({mobileVideo:await mediaCheck(phone),mobileDescriptionsHidden:true});
 await phone.screenshot({path:out+'/mobile-390.png',fullPage:true});
 for(const width of [320,760,1470,1920]){
  await phone.setViewportSize({width,height:width>760?920:844});await phone.waitForTimeout(150);
  const size=await phone.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,descriptions:[...document.querySelectorAll('.destination-description')].map(x=>getComputedStyle(x).display),flower:parseFloat(getComputedStyle(document.querySelector('.directory-flower')).width),endpoints:[...document.querySelectorAll('.destination')].map(x=>{const r=x.getBoundingClientRect();return{left:r.left,right:r.right};})}));assert(size.scrollWidth<=size.width);assert.equal(size.flower,width<=520?82:94);assert(size.descriptions.every(x=>width<=760?x==='none':x!=='none'));assert(size.endpoints.every(x=>x.left>=0&&x.right<=size.width));report.checks.push({layoutWidth:width,...size});
 }
 await pause(phone);await mobile.close();
 const blocked=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await stub(blocked);
 await blocked.addInitScript(()=>{const nativePlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(this.classList.contains('festival-film')){if(!navigator.userActivation.isActive){this.pause();this.removeAttribute('autoplay');return Promise.reject(new DOMException('Autoplay blocked for QA','NotAllowedError'));}this.autoplay=true;}return nativePlay.call(this);};});
 const fallback=await blocked.newPage();await fallback.goto(origin+'/home/',{waitUntil:'domcontentloaded'});await fallback.getByRole('button',{name:'Play background motion',exact:true}).waitFor();await fallback.getByRole('button',{name:'Play background motion',exact:true}).click();report.checks.push({blockedAutoplayRecoveredByExistingPlayControl:true,media:await mediaCheck(fallback)});await pause(fallback);await blocked.close();
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await stub(reduced);const still=await reduced.newPage();await still.goto(origin+'/home/',{waitUntil:'domcontentloaded'});await still.waitForFunction(()=>document.documentElement.dataset.story==='complete');assert(await still.locator('video').evaluate(v=>v.paused));assert.equal(await still.locator('[data-directory-rain]').getAttribute('data-rain-status'),'static');report.checks.push({reducedMotionStatic:true});await pause(still);await reduced.close();
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=String(error.stack||error).replaceAll(password||'__NO_PASSWORD__','[redacted]');}
finally{for(const context of browser.contexts()){for(const page of context.pages())await pause(page);await context.close();}await browser.close();await server.close();password='';await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks,errors:report.errors,failure:report.failure,out},null,2));if(!report.passed)process.exitCode=1;}
