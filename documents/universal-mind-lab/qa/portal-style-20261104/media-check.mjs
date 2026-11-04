import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out='documents/universal-mind-lab/qa/portal-style-20261104/live';
fs.mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const context=await browser.newContext({viewport:{width:1440,height:900},userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'});
let page;
try{
 await context.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
 page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://staging.universalmind.tv/lab/');
 await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
 await page.locator('#explore-enter').click();
 await page.waitForFunction(()=>{const v=document.getElementById('music-video');return !v.paused&&v.readyState>=2&&v.currentTime>1;},null,{timeout:60000});
 const read=()=>page.evaluate(()=>{const v=document.getElementById('music-video');return {time:v.currentTime,paused:v.paused,readyState:v.readyState,frames:v.getVideoPlaybackQuality().totalVideoFrames,opacity:getComputedStyle(v).opacity,zIndex:getComputedStyle(v).zIndex,src:v.currentSrc,videoCount:document.querySelectorAll('video').length,audiblePlayers:[...document.querySelectorAll('video,audio')].filter(e=>!e.paused&&!e.muted&&e.volume>0).length};});
 await page.evaluate(()=>{window.__previewMedia=document.getElementById('music-video');});
 const before=await read();
 await page.locator('#about-open').click();await page.locator('#portal-preview-about').click();
 await page.locator('#portal-preview-image').evaluate(e=>e.decode());
 await page.waitForTimeout(3500);
 const during=await read();assert.equal(during.opacity,'0.07');assert.equal(during.zIndex,'101');assert(during.time>before.time+1);assert(during.frames>before.frames);assert.equal(during.paused,false);assert.equal(during.videoCount,before.videoCount);assert.equal(during.audiblePlayers,1);assert.equal(during.src,before.src);
 assert(await page.evaluate(()=>window.__previewMedia===document.getElementById('music-video')));
 await page.screenshot({path:out+'/preview-playing-1440.png'});
 await page.locator('#portal-preview-close').click();await page.waitForTimeout(1800);const after=await read();assert(after.time>during.time);assert.equal(after.zIndex,'2');assert.equal(after.paused,false);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/media-verification.json',JSON.stringify({processMuted:true,mediaStubbed:false,nativeFullscreenNeverInvoked:true,before,during,after,pageErrors:errors},null,2)+'\n');
 console.log('Live video time and decoded frames advance across preview open and close; one audio source, 7% blend.');
}finally{
 if(page)await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});
 await context.close();await browser.close();await server.close();
}
