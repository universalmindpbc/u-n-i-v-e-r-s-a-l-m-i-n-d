import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin='https://staging.universalmind.tv',out='/private/tmp/um-directory-20261028/autoplay-startup-qa';
await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={verifiedAt:new Date().toISOString(),processAudioDisabled:true,nativeFullscreenInvoked:false,engine:'Chromium mobile emulation; actual iPhone Safari confirmation pending',checks:[],errors:[]};
const pause=async page=>{for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});};
const media=async page=>{await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.readyState>=2;},null,{timeout:30000});const first=await page.locator('video').evaluate(v=>v.currentTime);await page.waitForTimeout(500);const state=await page.locator('video').evaluate(v=>({source:v.currentSrc,src:v.getAttribute('src'),time:v.currentTime,muted:v.muted,defaultMuted:v.defaultMuted,volume:v.volume,autoplay:v.autoplay,inline:v.playsInline,opacity:getComputedStyle(v).opacity,parentOpacity:getComputedStyle(v.parentElement).opacity}));assert(state.time>first&&state.muted&&state.defaultMuted&&state.inline&&state.autoplay);assert.equal(state.volume,0);assert.equal(state.opacity,'1');assert.equal(state.parentOpacity,'1');return state;};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const html=await (await context.request.get(origin+'/home/')).text();assert(/<video[^>]+src="\/home\/assets\/festival-loop\.mp4"[^>]+autoplay muted loop playsinline/.test(html));
 await page.goto(origin+'/home/',{waitUntil:'domcontentloaded'});report.checks.push({automaticPlaybackWithoutTap:await media(page),sourceDeclaredInInitialHTML:true});await pause(page);await context.close();
 const blocked=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await blocked.grantPermissions(['clipboard-read','clipboard-write']);
 await blocked.addInitScript(()=>{
  window.__qaAllowPlayback=false;
  document.addEventListener('click',event=>{if(event.target.closest?.('.ambient-toggle'))window.__qaAllowPlayback=true;},true);
  document.addEventListener('play',event=>{const v=event.target;if(v.classList?.contains('festival-film')&&!window.__qaAllowPlayback){v.pause();v.removeAttribute('autoplay');}},true);
  const native=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){if(this.classList.contains('festival-film')){if(!window.__qaAllowPlayback){this.pause();this.removeAttribute('autoplay');return Promise.reject(new DOMException('Autoplay blocked for QA','NotAllowedError'));}this.autoplay=true;}return native.call(this);};
 });
 const fallback=await blocked.newPage();fallback.on('pageerror',e=>report.errors.push(e.message));await fallback.goto(origin+'/home/?autoplay-debug=1',{waitUntil:'domcontentloaded'});await fallback.getByRole('button',{name:'Play background motion',exact:true}).waitFor();
 const poster=await fallback.locator('video').evaluate(async v=>{const image=new Image();image.src=v.poster;await image.decode();return{poster:v.poster,imageWidth:image.naturalWidth,imageHeight:image.naturalHeight,opacity:getComputedStyle(v).opacity,parentOpacity:getComputedStyle(v.parentElement).opacity,paused:v.paused};});assert(poster.imageWidth>0&&poster.paused);assert.equal(poster.opacity,'1');assert.equal(poster.parentOpacity,'1');await fallback.waitForTimeout(2000);await fallback.screenshot({path:out+'/blocked-autoplay-poster-390.png',fullPage:true});report.checks.push({blockedPlaybackRetainsVisiblePoster:poster});
 await fallback.getByRole('button',{name:'Copy playback diagnostics',exact:true}).click();await fallback.waitForTimeout(100);assert(await fallback.locator('video').evaluate(v=>v.paused));const diagnostic=JSON.parse(await fallback.evaluate(()=>navigator.clipboard.readText()));assert(diagnostic.playFailure.includes('NotAllowedError'));assert.equal(diagnostic.reducedMotion,false);report.checks.push({diagnosticCopyPreservesBlockedState:true,diagnostic});
 await fallback.getByRole('button',{name:'Play background motion',exact:true}).click();report.checks.push({explicitPlayRecovery:await media(fallback)});await pause(fallback);await blocked.close();
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const still=await reduced.newPage();await still.goto(origin+'/home/',{waitUntil:'domcontentloaded'});await still.waitForFunction(()=>document.documentElement.dataset.story==='complete');await still.waitForTimeout(200);assert(await still.locator('video').evaluate(v=>v.paused));assert.equal(await still.locator('video').evaluate(v=>getComputedStyle(v).opacity),'1');report.checks.push({reducedMotionKeepsStaticVisiblePoster:true});await pause(still);await reduced.close();assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=String(error.stack||error);}
finally{for(const context of browser.contexts()){for(const page of context.pages())await pause(page);await context.close();}await browser.close();await server.close();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;}
