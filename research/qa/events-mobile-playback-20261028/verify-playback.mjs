import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=process.env.EVENTS_QA_OUTPUT || new URL('.',import.meta.url).pathname;
await fs.mkdir(out,{recursive:true});
const origin=process.env.EVENTS_QA_URL || 'https://staging.universalmind.tv/events/';
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio','--autoplay-policy=document-user-activation-required']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={origin,browser:'Chromium 151 with mobile viewport and touch emulation',realIphoneSafariTested:false,processAudioDisabled:true,nativeFullscreenInvoked:false,scenarios:[]};
try{
 for(const scenario of ['native-hls','native-hls-blocked-loop','iframe-fallback']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>requests.push(r.url()));
  await page.addInitScript(({scenario})=>{
   Element.prototype.requestFullscreen=function(){return Promise.resolve();};
   window.__playCalls=[];
   if(scenario==='native-hls-blocked-loop'){
    const blockAutoplay=new MutationObserver(()=>{
     const loop=document.getElementById('opening-loop');
     if(loop){loop.autoplay=false;loop.removeAttribute('autoplay');loop.pause();blockAutoplay.disconnect();}
    });
    blockAutoplay.observe(document,{childList:true,subtree:true});
   }
   const play=HTMLMediaElement.prototype.play,canPlay=HTMLMediaElement.prototype.canPlayType;
   HTMLMediaElement.prototype.canPlayType=function(type){return scenario==='iframe-fallback'&&type.includes('mpegurl')?'':canPlay.call(this,type);};
   HTMLMediaElement.prototype.play=function(){
    const gesture=Boolean(window.event?.isTrusted&&['click','touchend','keydown'].includes(window.event.type));
    const call={id:this.id,gesture,event:window.event?.type||null,muted:this.muted,src:this.currentSrc||this.src};
    window.__playCalls.push(call);
    if(this.id==='native-film'&&!gesture)return Promise.reject(new DOMException('Gesture required by regression probe','NotAllowedError'));
    if(this.id==='opening-loop'&&scenario==='native-hls-blocked-loop'){
     if(gesture)window.__loopUnlocked=true;
     if(!window.__loopUnlocked)return Promise.reject(new DOMException('Autoplay blocked by regression probe','NotAllowedError'));
    }
    return play.call(this);
   };
  },{scenario});
  await page.goto(origin,{waitUntil:'networkidle'});
  await page.locator('#password').fill(process.env.EVENTS_QA_PASSWORD);await page.getByRole('button',{name:'enter',exact:true}).tap();
  const stage=page.locator('iframe.events-stage').contentFrame();await stage.locator('#festival-title').waitFor();
  const loop=stage.locator('#opening-loop'),flower=stage.locator('#global-nav-toggle');
  await page.waitForTimeout(800);
  assert.equal(await loop.evaluate(v=>getComputedStyle(v).opacity),'1');
  assert(await loop.evaluate(v=>v.muted&&v.defaultMuted&&v.playsInline&&v.volume===0));
  assert(!requests.some(url=>url.includes('cloudflarestream.com')),'Full film requested before Watch tap');
  if(scenario==='native-hls-blocked-loop')assert(await loop.evaluate(v=>v.paused));
  await flower.tap();assert(await stage.locator('#about-panel').isVisible());
  await page.waitForTimeout(600);let time=await loop.evaluate(v=>v.currentTime);await page.waitForTimeout(500);
  assert(await loop.evaluate((v,time)=>!v.paused&&v.currentTime!==time,time));
  await stage.locator('#about-return').tap();
  await page.screenshot({path:`${out}/${scenario}-poster.png`});
  await stage.locator('#watch-film').tap();
  const native=scenario!=='iframe-fallback';
  const film=native?stage.locator('#native-film'):stage.frameLocator('#film-player').locator('video');
  await film.waitFor({state:'visible',timeout:30000});
  let state;
  for(let i=0;i<60;i++){
   state=await film.evaluate(v=>({time:v.currentTime,paused:v.paused,muted:v.muted,volume:v.volume,duration:v.duration,controls:v.controls,playsInline:v.playsInline,error:v.error?.code||null}));
   if(state.time>.2&&!state.paused)break;
   await page.waitForTimeout(500);
  }
  assert(state.time>.2&&!state.paused,JSON.stringify(state));assert(!state.muted&&state.volume===1&&!state.controls);assert(state.duration>140&&state.duration<144);
  if(native){assert(state.playsInline);assert.equal(await stage.locator('#film-player').count(),0);}
  assert(await loop.evaluate(v=>v.paused));
  await page.waitForTimeout(1100);const later=await film.evaluate(v=>v.currentTime);assert(later>state.time);
  const timecode=await stage.locator('#film-timecode').textContent();assert(/^[0-9]:[0-9]{2} \/ 2:22$/.test(timecode));
  await page.screenshot({path:`${out}/${scenario}-film.png`});
  if(native){
   await film.evaluate(v=>v.pause());await stage.locator('#film-retry').waitFor({state:'visible'});
   await stage.locator('#film-retry').tap();await page.waitForTimeout(700);assert(await film.evaluate(v=>!v.paused));
   assert.equal(await stage.locator('#film-retry').isVisible(),false);
  }
  await flower.tap();assert(await stage.locator('#about-panel').isVisible());await stage.locator('#about-return').tap();
  await stage.locator('#film-back').tap();assert.equal(await stage.locator('#film-view').isVisible(),false);
  assert.equal(await stage.locator('#film-player').count(),0);assert.equal(await stage.locator('#native-film').getAttribute('src'),null);
  time=await loop.evaluate(v=>v.currentTime);await page.waitForTimeout(600);assert(await loop.evaluate((v,time)=>!v.paused&&v.currentTime!==time&&v.muted,time));
  // A second visit exercises cleanup and restarting, still inside the real tap.
  await stage.locator('#watch-film').tap();await film.waitFor({state:'visible',timeout:30000});
  for(let i=0;i<40;i++){if(await film.evaluate(v=>!v.paused&&v.currentTime>.1))break;await page.waitForTimeout(500);}
  assert(await film.evaluate(v=>!v.paused&&v.currentTime>.1));await stage.locator('#film-back').tap();
  const calls=await stage.locator('body').evaluate(()=>window.__playCalls);
  const filmCalls=calls.filter(call=>call.id==='native-film');
  if(native){assert(filmCalls.length>=3&&filmCalls.every(call=>call.gesture));assert(filmCalls.every(call=>call.src.endsWith('/manifest/video.m3u8')));}
  assert.deepEqual(errors,[]);
  report.scenarios.push({scenario,pass:true,initialFilm:state,later,timecode,filmCalls,loopRecovery:scenario==='native-hls-blocked-loop',aboutAndBackWork:true,repeatedWatchWorks:true,errors});
  await loop.evaluate(v=>v.pause());await context.close();
 }
 report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;throw error;}
finally{await browser.close();await server.close();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
