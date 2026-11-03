import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out='documents/universal-mind-lab/qa/clarity-activities';fs.mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());let page;
try{
 const context=await browser.newContext({viewport:{width:393,height:740},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;HTMLMediaElement.prototype.play=function(){this.dispatchEvent(new Event('playing'));return Promise.resolve()};});
 await context.route('**/hls.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.Hls=class{static isSupported(){return true}static Events={ERROR:"error"};on(){}loadSource(){}attachMedia(){}destroy(){}}'}));
 await context.route('**/*.m3u8*',r=>r.abort());
 page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://staging.universalmind.tv/lab/');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#explore-enter').click();
 const states=[];const read=()=>page.locator('#headline').evaluate(e=>({time:performance.now(),height:e.getBoundingClientRect().height,opacity:[...e.children].map(s=>getComputedStyle(s).opacity),transform:[...e.children].map(s=>getComputedStyle(s).transform),animation:[...e.children].map(s=>s.getAnimations().map(a=>({state:a.playState,time:a.currentTime})))}));
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.headline-description')).opacity==='1');states.push(await read());await page.screenshot({path:out+'/headline-natural-first-mobile.png'});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.headline-unity')).opacity==='1',{},{timeout:18000});states.push(await read());await page.screenshot({path:out+'/headline-natural-unity-mobile.png'});
 assert.deepEqual(states[0].opacity,['1','0']);assert.deepEqual(states[1].opacity,['0','1']);assert.equal(states[0].height,states[1].height);assert(states.every(s=>s.transform.every(t=>t==='none')));
 await page.locator('#mix-toggle').click();await page.locator('#motion-toggle').click();const stopped=await read();assert.deepEqual(stopped.opacity,['1','0']);assert(stopped.animation.every(a=>a.length===0));assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/natural-headline.json',JSON.stringify({live:true,viewport:{width:393,height:740},processMuted:true,mediaStubbed:true,nativeFullscreenDisabled:true,naturalAnimationClock:true,states,motionOff:stopped,pageErrors:errors},null,2)+'\n');console.log('Natural phone headline crossfade and Motion control passed.');
}finally{if(page)await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await browser.close();await server.close();}
