import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const live=process.argv.includes('--live'),origin='https://staging.universalmind.tv';
const out=live?'documents/universal-mind-lab/qa/tour-focus':'/private/tmp/um-tour-focus-proof';fs.mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),checks=[];
try{
for(const vp of [{width:1440,height:900},{width:393,height:647}]){
 const c=await browser.newContext({viewport:vp,isMobile:vp.width<800,hasTouch:vp.width<800,serviceWorkers:'block'});
 try{
 await c.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;HTMLMediaElement.prototype.play=function(){this.dispatchEvent(new Event('playing'));return Promise.resolve()};});
 await c.route(origin+'/**',async r=>{
  const u=new URL(r.request().url()),f=path.resolve('.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));
  if(u.pathname.endsWith('/hls.min.js'))return r.fulfill({contentType:'application/javascript',body:'window.Hls=class{static isSupported(){return true}static Events={ERROR:"error"};on(){}loadSource(){}attachMedia(){}destroy(){}}'});
  if(u.pathname==='/lab/lab.mjs'){
   let source=fs.readFileSync(f,'utf8');if(live){const res=await r.fetch();assert.equal(res.status(),200);assert.equal(await res.text(),source);}
   source=source.replace('createStory, ORBIT_START','createStory, storyFrame, ORBIT_START');
   source=source.replace("go('overview',true);resize();",`go('overview',true);resize();window.__qa={read:()=>({position:camera.position.toArray(),target:controls.target.toArray()}),frame:t=>{autoTourCancelled=false;applyStory(storyFrame(t));},view:key=>selectPlace(key),emotion:emotionPanel};`);
   return r.fulfill({contentType:'application/javascript',body:source});
  }
  if(!live){if(fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.abort();}
  return r.continue();
 });
 await c.route('**/*.m3u8*',r=>r.abort());
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+2000));await p.goto(origin+'/lab/');await p.waitForFunction(()=>document.body.dataset.ready==='true');
 await p.locator('#explore-enter').click();await p.clock.runFor(40);
 const timeline=[];
 for(const [t,visible] of [[30,false],[31,true],[34,true],[36,false],[39,false],[45,false],[50,false],[55,false],[60,false],[65,false],[70,false],[90,false],[151,false]]){
  const elapsed=Number(await p.locator('body').getAttribute('data-story-time'));
  if(t>elapsed)await p.clock.fastForward((t-elapsed)*1000);await p.clock.runFor(40);
  const labelVisibility=await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility);
  assert.equal(labelVisibility,visible?'visible':'hidden');
  timeline.push({seconds:t,labels:labelVisibility,phase:await p.locator('body').getAttribute('data-story')});
 }
 assert.equal(await p.locator('body').getAttribute('data-story'),'complete');
 if(vp.width>800)assert(await p.locator('#emotion-panel').isVisible());
 assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 const settle=async()=>{await p.clock.runFor(40);await p.clock.fastForward(1400);await p.clock.runFor(40);};
 await p.evaluate(()=>window.__qa.view('main'));await settle();
 assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 assert(await p.locator('#place-card').isVisible());assert.equal(await p.locator('#place-title').textContent(),'Main pavilion');
 const camera=await p.evaluate(()=>window.__qa.read());
 if(vp.width>800){
  assert(camera.position.every((v,i)=>Math.abs(v-[0,3.2,12][i])<.001));assert(camera.target.every((v,i)=>Math.abs(v-[2.5,2,-12][i])<.001));
  assert(await p.locator('#place-list').isVisible());
 }
 await p.screenshot({path:out+'/main-pavilion-'+vp.width+'.png'});
 for(const key of ['truck','food','play','river','support','fashion']){await p.evaluate(k=>window.__qa.view(k),key);assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');assert(await p.locator('#place-card').isVisible());}
 if(vp.width>800){
  await p.locator('#reset-view').click();await settle();assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'visible');
  await p.locator('#scene canvas').focus();await p.keyboard.press('ArrowLeft');assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await p.locator('#reset-view').click();await settle();assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'visible');
  await p.clock.fastForward(5100);assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await p.locator('#labels-toggle').click();assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'visible');
  await p.locator('#emotion-toggle').click();assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await p.locator('#emotion-close').click();assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await p.locator('#tour-toggle').click();assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await p.clock.fastForward(6400);await p.clock.runFor(40);assert.equal(await p.locator('#place-title').textContent(),'Main pavilion');assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await p.screenshot({path:out+'/main-pavilion-tour.png'});await p.locator('#tour-toggle').click();
 }
 await p.locator('#about-open').click();assert.equal(await p.locator('#mindfulness-opening-title').textContent(),'Electronic music and fashion as mindfulness');await p.locator('#about-close').click();
 assert.deepEqual(errors,[]);checks.push({viewport:vp,timeline,camera,pageErrors:errors});console.log(vp.width+'px passed');
 }finally{for(const p of c.pages())await p.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await c.close();}
}
fs.writeFileSync(out+'/verification.json',JSON.stringify({live,processMuted:true,mediaStubbed:true,nativeFullscreenNeverInvoked:true,checks},null,2)+'\n');
}finally{await browser.close();await server.close();}
