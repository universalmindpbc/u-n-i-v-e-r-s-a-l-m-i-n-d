import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.QA_OUTPUT||'/private/tmp/events-retained-player-qa';
const origin=process.env.QA_ORIGIN||'https://universalmind.tv';
assert(process.env.EVENTS_QA_PASSWORD);
await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={url:origin+'/events/',processAudioDisabled:true,realIphoneSafariTested:false,nativeFullscreenInvoked:false,checks:[]};
async function setup(blocked=false){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(({blocked})=>{
    let gesture=false;const granted=new WeakSet();window.__mediaTrace=[];
    for(const type of ['click','touchend','keydown','submit'])document.addEventListener(type,event=>{
      if(event.isTrusted){gesture=true;setTimeout(()=>{gesture=false;},0);}
    },true);
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){
      const background=this.id!=='native-film';
      const role=this.id||this.className;
      const allowed=(!blocked||!background)&&(gesture||granted.has(this));
      window.__mediaTrace.push({event:'play',role,gesture,allowed});
      if(!allowed)return Promise.reject(new DOMException('Per-element gesture required for verification','NotAllowedError'));
      granted.add(this);return play.call(this);
    };
    const seen=new WeakSet();new MutationObserver(()=>{
      for(const video of document.querySelectorAll('video'))if(!seen.has(video)){
        seen.add(video);video.autoplay=false;video.removeAttribute('autoplay');
        if(!granted.has(video))video.pause();
      }
    }).observe(document,{childList:true,subtree:true});
    const fetch=window.fetch;window.fetch=function(input,options){
      if(options?.method==='POST')window.__mediaTrace.push({event:'authentication'});
      return fetch.apply(this,arguments);
    };
    Element.prototype.requestFullscreen=()=>Promise.resolve();
    Element.prototype.webkitRequestFullscreen=()=>Promise.resolve();
    HTMLVideoElement.prototype.webkitEnterFullscreen=()=>{throw new Error('Native fullscreen forbidden in this check');};
  },{blocked});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  return {context,page,errors};
}
const rootMedia=page=>page.evaluate(()=>{
  const v=window.UniversalMindEntry.getBackgroundFilm();
  return {src:v.src,time:v.currentTime,paused:v.paused,muted:v.muted,defaultMuted:v.defaultMuted,volume:v.volume,loop:v.loop,playsInline:v.playsInline,poster:v.getAttribute('poster'),userPaused:v.dataset.userPaused,retained:v===window.__retainedFilm};
});
async function moving(page,pathname){
  await page.waitForFunction(path=>{const v=window.UniversalMindEntry?.getBackgroundFilm?.();return v&&!v.paused&&v.readyState>=2&&v.currentSrc.includes(path);},pathname);
  const a=await rootMedia(page);await page.waitForTimeout(350);const b=await rootMedia(page);
  assert.notEqual(a.time,b.time);assert(b.muted&&b.defaultMuted&&b.volume===0&&b.playsInline&&b.retained);return b;
}
async function close(session){
  for(const frame of session.page.frames())await frame.locator('video').evaluateAll(videos=>videos.forEach(v=>v.pause())).catch(()=>{});
  assert.deepEqual(session.errors,[]);await session.context.close();
}
try{
  const direct=await setup();
  await direct.page.route('**/events/',async route=>{if(route.request().method()==='POST')await new Promise(resolve=>setTimeout(resolve,6500));await route.continue();});
  await direct.page.goto(origin+'/events/');
  await direct.page.locator('#password').fill(process.env.EVENTS_QA_PASSWORD);
  await direct.page.getByRole('button',{name:'enter',exact:true}).tap();
  await direct.page.waitForFunction(()=>window.UniversalMindEntry?.getBackgroundFilm?.());
  await direct.page.evaluate(()=>{window.__retainedFilm=window.UniversalMindEntry.getBackgroundFilm();});
  const primer=await moving(direct.page,'/events/assets/entry-primer.mp4');
  assert.equal(await direct.page.locator('iframe.events-stage').count(),0);
  const stage=direct.page.locator('iframe.events-stage').contentFrame();await stage.locator('#festival-title').waitFor();
  const native=await moving(direct.page,'/events/loop.php');
  assert.equal(await stage.locator('html').getAttribute('data-background-hosted'),'true');
  assert.equal(await stage.locator('#opening-loop').getAttribute('src'),null);
  assert.equal(await stage.locator('#opening-animation').isVisible(),false);
  const trace=await direct.page.evaluate(()=>window.__mediaTrace);
  assert.equal(trace[0].event,'play');assert(trace[0].gesture&&trace[0].allowed);assert.equal(trace[1].event,'authentication');
  await stage.locator('#global-nav-toggle').tap();assert(await stage.locator('#about-panel').isVisible());await moving(direct.page,'/events/loop.php');
  await stage.locator('#about-return').tap();await stage.locator('#watch-film').tap();
  for(let i=0;i<100;i++){if(await stage.locator('#native-film').evaluate(v=>!v.paused&&v.currentTime>0))break;await direct.page.waitForTimeout(300);}
  assert(await stage.locator('#native-film').evaluate(v=>!v.paused&&v.currentTime>0));
  assert((await rootMedia(direct.page)).paused);
  await stage.locator('#film-back').tap();await moving(direct.page,'/events/loop.php');
  await direct.page.screenshot({path:out+'/direct-entry-390.png'});
  report.checks.push({journey:'direct Events password entry',authenticationDelayMs:6500,playBeforeAuthentication:true,samePlayerAcrossAuthentication:true,primerTime:primer.time,privateLoopTime:native.time,aboutPassed:true,filmAndBackPassed:true,trace});
  await close(direct);

  const root=await setup();await root.page.goto(origin+'/');
  await root.page.locator('[data-access-password]').fill(process.env.EVENTS_QA_PASSWORD);await root.page.getByRole('button',{name:'enter',exact:true}).tap();
  await root.page.waitForURL(origin+'/home/');
  const frame=root.page.locator('.um-experience-frame').contentFrame();await frame.locator('.routes.is-ready').waitFor();
  await root.page.evaluate(()=>{window.__retainedFilm=window.UniversalMindEntry.getBackgroundFilm();});
  await moving(root.page,'/home/assets/festival-loop.mp4');
  await root.page.evaluate(()=>{window.UniversalMindEntry.getBackgroundFilm().currentTime=37;});
  for(const paused of [false,true]){
    await root.page.waitForFunction(()=>document.querySelector('.um-experience-frame')?.contentDocument.documentElement.dataset.story==='complete');
    if(paused)await frame.locator('.ambient-toggle').tap();
    const before=await rootMedia(root.page);assert.equal(before.paused,paused);
    await frame.locator('[data-destination=events]').evaluate(link=>link.addEventListener('click',()=>{
      parent.__eventsDepartureTime=parent.UniversalMindEntry.getBackgroundFilm().currentTime;
    },{once:true,capture:true}));
    await frame.locator('[data-destination=events]').tap();await root.page.waitForURL(origin+'/events/?experience=1');await frame.locator('#festival-title').waitFor();
    before.time=await root.page.evaluate(()=>window.__eventsDepartureTime);
    await moving(root.page,'/events/loop.php');
    const returningAt=Date.now();
    await root.page.goBack({waitUntil:'domcontentloaded'});await root.page.waitForURL(origin+'/home/');await frame.locator('.routes.is-ready').waitFor();
    await root.page.waitForFunction(()=>window.UniversalMindEntry.getBackgroundFilm().readyState>=2);
    const after=await rootMedia(root.page);
    for(const key of ['src','muted','defaultMuted','volume','loop','playsInline','poster','userPaused'])assert.equal(after[key],before[key],`Restoration ${key}`);
    const returnElapsed=(Date.now()-returningAt)/1000;
    assert(after.retained);assert.equal(after.paused,paused);
    assert(Math.abs(after.time-before.time-(paused?0:returnElapsed))<2,`Position reset: ${before.time} -> ${after.time} after ${returnElapsed}s`);
    report.checks.push({journey:'directory → Events → Back',initiallyPaused:paused,samePlayer:true,originalSourceRestored:true,allMediaFlagsRestored:true,timeBefore:before.time,timeAfter:after.time,pausedAfter:after.paused});
  }
  await frame.locator('.ambient-toggle').tap();
  await root.page.waitForFunction(()=>document.querySelector('.um-experience-frame')?.contentDocument.documentElement.dataset.story==='complete');
  await frame.locator('[data-destination=festivals]').tap();await root.page.waitForURL(/\/happiness\//);await frame.locator('#experience').waitFor();
  const happiness=await moving(root.page,'/home/assets/festival-loop.mp4');
  assert(happiness.retained);await root.page.goBack({waitUntil:'domcontentloaded'});await frame.locator('.routes.is-ready').waitFor();
  await moving(root.page,'/home/assets/festival-loop.mp4');
  report.checks.push({journey:'Events → directory → Happiness → directory',originalBackgroundSourcePreserved:true,samePlayer:true});
  await close(root);

  const blocked=await setup(true);await blocked.page.goto(origin+'/events/');await blocked.page.locator('#password').fill(process.env.EVENTS_QA_PASSWORD);await blocked.page.getByRole('button',{name:'enter',exact:true}).tap();
  const fallback=blocked.page.locator('iframe.events-stage').contentFrame();await fallback.locator('#festival-title').waitFor();await fallback.locator('#opening-animation img').evaluate(img=>img.decode());
  await fallback.locator('head').evaluate(head=>{const style=document.createElement('style');style.textContent='*{animation:none!important;transition:none!important}';head.append(style);});
  assert(await fallback.locator('#opening-animation').isVisible());
  const clip={x:85,y:185,width:270,height:570};const a=await blocked.page.screenshot({clip});await blocked.page.waitForTimeout(500);const b=await blocked.page.screenshot({clip});
  assert.notEqual(crypto.createHash('sha256').update(a).digest('hex'),crypto.createHash('sha256').update(b).digest('hex'));
  assert((await rootMedia(blocked.page)).paused);
  report.checks.push({journey:'all background video denied',animationFallbackMoves:true});await close(blocked);
  report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;throw error;}
finally{await browser.close();await server.close();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
