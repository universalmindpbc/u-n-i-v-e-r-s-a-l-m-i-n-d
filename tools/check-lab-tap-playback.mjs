import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),live=process.argv.includes('--live'),origin='https://staging.universalmind.tv';
const out=live?path.join(root,'documents/universal-mind-lab/qa/mobile-tap-playback'):'/private/tmp/um-mobile-tap-playback-qa';fs.mkdirSync(out,{recursive:true});
let password='';if(live){for await(const chunk of process.stdin)password+=chunk;password=password.trim();assert(password);}
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--autoplay-policy=user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),checks=[],errors=[];
try{
 const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
 try{
  await c.addInitScript(()=>{
   Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;
   Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true});
   window.__mediaCalls=[];const original=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(){
    if(this.id==='music-video'){
     const active=navigator.userActivation.isActive;window.__mediaCalls.push({active,time:performance.now(),nativeHLS:!!this.canPlayType('application/vnd.apple.mpegurl')});
     if(!active)return Promise.reject(new DOMException('Test requires the original tap','NotAllowedError'));
    }
    return original.call(this);
   };
  });
  if(!live)await c.route(origin+'/**',async r=>{
   const u=new URL(r.request().url());let file=u.pathname.slice(1);
   if(file==='events/'||file==='events/choice.php')return r.fulfill({body:fs.readFileSync(path.join(root,'events/choice.php'),'utf8').replace(/<\?php[\s\S]*?\?>/g,''),contentType:'text/html'});
   if(file.endsWith('/'))file+='index.html';const f=path.join(root,file);if(fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.abort();
  });
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  let choice;
  if(live){
   await p.goto(origin+'/');await p.locator('[data-access-password]').fill(password);await p.locator('[data-access-form] button').tap();password='';
   await p.frameLocator('.um-experience-frame').locator('[data-destination="events"]').tap();
   await p.frameLocator('.um-experience-frame').locator('.event-options').waitFor();
   choice=p.frames().find(f=>f.url().includes('/events/'));
  }else{await p.goto(origin+'/events/?experience=1');choice=p.mainFrame();}
  await choice.locator('.event-option--lab:not([aria-disabled="true"])').waitFor({timeout:45000});
  let lab=p.frames().find(f=>f.url().includes('/lab/?prepare=1'));
  assert(lab);assert.deepEqual(await lab.evaluate(()=>window.__mediaCalls),[],'No media starts behind the landing');
  await choice.getByRole('link',{name:'Explore Universal Mind Lab',exact:true}).tap();
  await lab.locator('body[data-entered="true"]').waitFor();
  await lab.waitForFunction(()=>{const v=document.querySelector('#music-video');return !v.paused&&v.currentTime>1&&v.videoWidth>0;},null,{timeout:60000});
  const state=await lab.evaluate(()=>{const v=document.querySelector('#music-video');return {calls:window.__mediaCalls,time:v.currentTime,width:v.videoWidth,ready:v.readyState,muted:v.muted,volume:v.volume,opacity:getComputedStyle(v).opacity,notice:document.querySelector('#media-status').hidden,audioBytes:v.webkitAudioDecodedByteCount};});
  assert(state.calls.length>0&&state.calls.every(call=>call.active),'Playback requested inside the initiating tap');
  assert.equal(state.muted,false);assert(state.volume>0);assert.equal(state.opacity,'0.07');assert(state.notice);assert(state.audioBytes>0,'Audio is decoded in the process-muted browser');
  assert.equal(await lab.locator('#landing').isVisible(),false);
  checks.push({name:'Single mobile tap starts decoded sound and video at 7%, with no second landing',state});
  await p.screenshot({path:path.join(out,'launched-phone.png')});
  await lab.locator('#music-toggle').tap();assert(await lab.locator('#music-video').evaluate(v=>v.paused));
  await lab.locator('#music-toggle').tap();await lab.waitForFunction(()=>!document.querySelector('#music-video').paused);checks.push({name:'Designed Music control pauses and resumes playback'});
  await p.goBack();
  if(live)await p.frameLocator('.um-experience-frame').locator('.event-options').waitFor();else await p.locator('.event-options').waitFor();
  assert.equal(new URL(p.url()).pathname,'/events/');
  const noPlaying=await Promise.all(p.frames().map(f=>f.evaluate(()=>[...document.querySelectorAll('video,audio')].every(v=>v.paused||v.muted))));assert(noPlaying.every(Boolean));
  checks.push({name:'Browser Back restores Events and stops Lab audio'});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({date:new Date().toISOString(),live,processMuted:true,strictTapRequirement:true,physicalIPhoneTested:false,nativeFullscreenInvoked:false,checks,errors},null,2)+'\n');console.log(JSON.stringify(checks,null,2));
 }finally{for(const p of c.pages())for(const f of p.frames())await f.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await c.close();}
}finally{await browser.close();await server.close();}
