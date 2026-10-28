import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.QA_OUTPUT||'/private/tmp/events-safari-animation-qa';
const url='https://staging.universalmind.tv/events/';
assert(process.env.EVENTS_QA_PASSWORD,'Provide the existing invitation password through EVENTS_QA_PASSWORD.');
await fs.mkdir(out,{recursive:true});
const digest=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const server=await chromium.launchServer({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={url,processAudioDisabled:true,realIphoneSafariTested:false,nativeFullscreenInvoked:false,cases:[]};
try {
  for (const mode of ['normal','blocked','reduced-motion']) {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:mode==='reduced-motion'?'reduce':'no-preference'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(({mode})=>{
      Element.prototype.requestFullscreen=function(){throw new Error('Page fullscreen attempted during verification');};
      HTMLVideoElement.prototype.webkitEnterFullscreen=function(){throw new Error('Native fullscreen attempted during verification');};
      if (mode!=='blocked') return;
      const observer=new MutationObserver(()=>{
        const video=document.getElementById('opening-loop');
        if(video){video.autoplay=false;video.removeAttribute('autoplay');video.pause();observer.disconnect();}
      });
      observer.observe(document,{childList:true,subtree:true});
      const play=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(){
        if(this.id==='opening-loop') return Promise.reject(new DOMException('Autoplay blocked for verification','NotAllowedError'));
        return play.call(this);
      };
    },{mode});
    await page.goto(url);
    await page.locator('#password').fill(process.env.EVENTS_QA_PASSWORD);
    await page.getByRole('button',{name:'enter',exact:true}).click();
    const stage=page.locator('iframe.events-stage').contentFrame();
    await stage.locator('#festival-title').waitFor();
    const loop=stage.locator('#opening-loop'),animation=stage.locator('#opening-animation');
    await page.waitForTimeout(5600);
    if(mode==='normal'){
      const before=await loop.evaluate(v=>({time:v.currentTime,muted:v.muted,defaultMuted:v.defaultMuted,volume:v.volume,paused:v.paused,visible:getComputedStyle(v).visibility}));
      await page.waitForTimeout(350);
      const after=await loop.evaluate(v=>v.currentTime);
      assert(!before.paused&&before.muted&&before.defaultMuted&&before.volume===0&&before.visible==='visible');
      assert(after!==before.time);assert.equal(await animation.isVisible(),false);
      report.cases.push({mode,videoAdvances:true,muted:true,volume:0,animationCoveredByPlayingVideo:true});
    } else if(mode==='blocked') {
      assert(await loop.evaluate(v=>v.paused&&getComputedStyle(v).visibility==='visible'));
      assert(await animation.isVisible());
      await animation.locator('img').evaluate(img=>img.decode());
      // Freeze interface animations so changing pixels come only from the image loop.
      await stage.locator('head').evaluate(head=>{const s=document.createElement('style');s.textContent='*{animation:none!important;transition:none!important}';head.append(s);});
      const clip={x:85,y:185,width:270,height:570};
      const first=await page.screenshot({path:out+'/blocked-frame-a.png',clip});
      await page.waitForTimeout(500);
      const second=await page.screenshot({path:out+'/blocked-frame-b.png',clip});
      assert.notEqual(digest(first),digest(second),'Blocked video fallback is static');
      const img=animation.locator('img'),source=await img.getAttribute('src');
      await img.evaluate(img=>{img.src='poster.php';return img.decode();});
      const staticA=await page.screenshot({clip});await page.waitForTimeout(500);const staticB=await page.screenshot({clip});
      assert.equal(digest(staticA),digest(staticB),'Static control changed, so the motion comparison is inconclusive');
      await img.evaluate((img,src)=>{img.src=src;return img.decode();},source);
      await stage.locator('#global-nav-toggle').tap();assert(await stage.locator('#about-panel').isVisible());assert(await animation.isVisible());
      await stage.locator('#about-return').tap();
      await stage.locator('#watch-film').tap();
      const film=stage.locator('#native-film');
      for(let i=0;i<60;i++){if(await film.evaluate(v=>!v.paused&&v.currentTime>.3))break;await page.waitForTimeout(300);}
      const filmState=await film.evaluate(v=>({time:v.currentTime,paused:v.paused,muted:v.muted,volume:v.volume}));
      assert(!filmState.paused&&filmState.time>.3&&!filmState.muted&&filmState.volume===1);
      assert.equal(await animation.isVisible(),false);
      await stage.locator('#film-back').tap();assert(await animation.isVisible());
      const asset=await context.request.get(url+'animation.php?v=1');assert.equal(asset.status(),200);
      const bytes=await asset.body();assert(asset.headers()['content-type'].startsWith('image/webp'));
      if(process.env.EVENTS_SOURCE_ROOT)assert.equal(digest(bytes),digest(await fs.readFile(process.env.EVENTS_SOURCE_ROOT+'/events/private/opening-animation.webp')));
      report.cases.push({mode,backgroundVideoPermanentlyBlocked:true,animationMovesWithoutFurtherGesture:true,staticControlStable:true,animationBytes:bytes.length,animationSha256:digest(bytes),aboutPassed:true,filmState,backPassed:true});
      await page.screenshot({path:out+'/blocked-portrait.png'});
    } else {
      assert(await loop.evaluate(v=>v.paused));
      assert((await animation.locator('img').evaluate(img=>img.currentSrc)).endsWith('/poster.php'));
      report.cases.push({mode,staticPosterSelected:true,videoPaused:true});
    }
    assert.deepEqual(errors,[]);
    for(const frame of page.frames())await frame.locator('video').evaluateAll(videos=>videos.forEach(video=>video.pause())).catch(()=>{});
    await context.close();
  }
  const anonymous=await browser.newContext();
  const response=await anonymous.request.get(url+'animation.php?v=1');
  assert.equal(response.status(),401);report.privateAssetProtected=true;
  await anonymous.close();report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;throw error;}
finally{await browser.close();await server.close();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
