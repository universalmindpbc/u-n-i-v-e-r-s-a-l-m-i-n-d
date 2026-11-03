import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const origin='https://universalmind.tv',out='documents/universal-mind-lab/qa/production-20261104/media';fs.mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--autoplay-policy=user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),checks=[];let page;
try{
 for(const viewport of [{width:393,height:647},{width:1440,height:1000}]){
  const context=await browser.newContext({viewport,isMobile:viewport.width<800,hasTouch:viewport.width<800,serviceWorkers:'block'});
  try{
   await context.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
   page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/lab/');await page.waitForFunction(()=>document.body.dataset.ready==='true');
   assert(await page.locator('#music-video').evaluate(v=>v.paused&&!v.currentSrc));
   await page.locator('#explore-enter').click();
   await page.waitForFunction(()=>[...document.querySelectorAll('video')].every(v=>v.videoWidth>0&&v.currentTime>0&&!v.paused),null,{timeout:45000});
   const videos=await page.locator('video').evaluateAll(vs=>vs.map(v=>({id:v.id,time:v.currentTime,width:v.videoWidth,height:v.videoHeight,loop:v.loop,muted:v.muted,volume:v.volume})));
   assert(videos.every(v=>v.loop));assert(videos.filter(v=>v.id!=='music-video').every(v=>v.muted));
   await page.waitForFunction(prior=>prior.every(({id,time})=>document.getElementById(id).currentTime!==time),videos,{timeout:10000});
   assert.equal(await page.locator('#music-video').evaluate(v=>getComputedStyle(v).opacity),'0.07');
   assert(await page.locator('#media-status').isHidden());assert.equal(await page.locator('body').getAttribute('data-lineup-visible'),'true');
   await page.locator('#music-video').evaluate(v=>v.pause());await page.locator('#replay-story').click();
   await page.waitForFunction(()=>!document.getElementById('music-video').paused&&document.body.dataset.musicPlaying==='true');
   assert.deepEqual(errors,[]);checks.push({viewport,videos,entryPlayback:true,replayPlayback:true,blend:.07,errors});
  }finally{await page?.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await context.close();}
 }
 const request=await browser.newContext();const hashes=[];
 try{
  for(const file of ['index.html','lab.css','lab.mjs','media.mjs','orbit.mjs','story.mjs']){
   const response=await request.request.get(origin+'/lab/'+file+'?v=20261103continuous1');assert.equal(response.status(),200);
   const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),sha256=hash(await response.body());assert.equal(sha256,hash(fs.readFileSync('lab/'+file)));hashes.push({file,status:200,sha256});
  }
 }finally{await request.close();}
 const result={date:new Date().toISOString(),url:origin+'/lab/',passed:true,processMuted:true,nativeFullscreenInvoked:false,playbackStubbed:false,subjectiveSoundQualityTested:false,checks,hashes};
 fs.writeFileSync(out+'/media-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:true,viewports:checks.map(x=>x.viewport),sourceMatches:hashes.length}));
}finally{await browser.close();await server.close();}
