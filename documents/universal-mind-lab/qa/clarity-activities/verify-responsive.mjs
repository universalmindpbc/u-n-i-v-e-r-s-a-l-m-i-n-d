import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const live=process.argv.includes('--live'),quick=process.argv.includes('--quick'),origin='https://staging.universalmind.tv';
const out=live?'documents/universal-mind-lab/qa/clarity-activities':'/private/tmp/um-lab-clarity-activities-proof';fs.mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),checks=[];
try{
for(const vp of (quick?[{width:1440,height:1000}]:[{width:393,height:647},{width:320,height:568},{width:844,height:390},{width:1440,height:1000}])){
 const mobile=vp.width<1000,portrait=mobile&&vp.height>vp.width;
 const c=await browser.newContext({viewport:vp,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
 try{
 await c.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;HTMLMediaElement.prototype.play=function(){this.dispatchEvent(new Event('playing'));return Promise.resolve()};});
 await c.route(origin+'/**',async r=>{
  const u=new URL(r.request().url()),f=path.resolve('.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));
  if(u.pathname.endsWith('/hls.min.js'))return r.fulfill({contentType:'application/javascript',body:'window.Hls=class{static isSupported(){return true}static Events={ERROR:"error"};on(){}loadSource(){}attachMedia(){}destroy(){}}'});
  if(u.pathname==='/lab/lab.mjs'){
   let source=fs.readFileSync(f,'utf8');if(live){const res=await r.fetch();assert.equal(res.status(),200);assert.equal(await res.text(),source);}
   source=source.replace('createStory, ORBIT_START','createStory, storyFrame, ORBIT_START');
   source=source.replace("go('overview',true);resize();",`go('overview',true);resize();window.__qa={read:()=>({position:camera.position.toArray(),target:controls.target.toArray(),activities:activities.snapshot(),stats:activities.stats}),frame:t=>{applyStory(storyFrame(t));emotionPanel(false);},view:(key,show=false)=>{lineupOverride=null;selectPlace(key,show);go(key,true)},lineup:()=>{lineupOverride=true;syncLineup()},camera:(p,t)=>{tween=null;camera.position.fromArray(p);controls.target.fromArray(t);controls.update();needsFrame=true;requestFrame()},activity:t=>activities.update(t,true),orbit:t=>orbit(t)};`);
   return r.fulfill({contentType:'application/javascript',body:source});
  }
  if(!live){if(fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.abort();}
  return r.continue();
 });
 await c.route('**/*.m3u8*',r=>r.abort());
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+2000));await p.goto(origin+'/lab/');await p.waitForFunction(()=>document.body.dataset.ready==='true');
 await p.locator('#explore-enter').click();await p.clock.runFor(40);
 const initial=await p.evaluate(()=>window.__qa.read());assert.equal(initial.activities.visible,false);
 const expected=portrait?[132.9,117+Math.max(20,28+(647-vp.height)*.16),174.2]:mobile?[102,90,134]:[65,51,82];assert(initial.position.every((n,i)=>Math.abs(n-expected[i])<.02));
 await p.clock.fastForward(110000);await p.clock.runFor(40);await p.clock.fastForward(1500);await p.clock.runFor(40);
 assert.equal(await p.locator('body').getAttribute('data-story'),'complete');
 const final=await p.evaluate(()=>window.__qa.read());assert(final.position.every((n,i)=>Math.abs(n-expected[i])<.02));
 assert.equal(final.activities.visible,true);assert.equal(final.activities.actors.length,11);
 assert.deepEqual(final.stats,{meditatingChildren:3,yogaChildren:1,doctors:1,slidingChildren:3,musicMakingChildren:3,deviceWaveforms:3,spatialSpeakers:1});
 await p.evaluate(()=>{window.__qa.frame(32);window.__qa.view('overview');window.__qa.lineup();});await p.clock.runFor(40);await p.clock.fastForward(800);await p.clock.runFor(40);await new Promise(r=>setTimeout(r,800));
 const style=await p.evaluate(()=>{const h=getComputedStyle(document.querySelector('.intro h1')),a=getComputedStyle(document.querySelector('.artist-lineup')),v=getComputedStyle(document.querySelector('.vignette'),'::before');return {heading:h.color,headingShadow:h.textShadow,logos:a.color,logoFilter:a.filter,skyOpacity:v.opacity,skyBackground:v.backgroundImage,gold:getComputedStyle(document.querySelector('.mindfulness-line span:nth-child(2)')).color};});
 assert.equal(style.heading,'rgb(25, 35, 38)');assert.equal(style.logos,style.heading);assert.equal(style.headingShadow,'none');assert.equal(style.logoFilter,'none');assert.equal(style.skyOpacity,'1');
 const header=await p.locator('.wordmark').evaluate(e=>{const f=e.querySelector('img'),t=e.querySelector('span'),fr=f.getBoundingClientRect(),tr=t.getBoundingClientRect();return {loaded:f.complete&&f.naturalWidth>0,flowerRight:fr.right,textLeft:tr.left,textRight:tr.right,viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth};});
 assert(header.loaded);assert(header.flowerRight<header.textLeft);assert(header.textRight<=vp.width-10);assert.equal(header.overflow,false);
 // Inspect both quiet headline states at fixed points in their CSS animation.
 const headline=await p.locator('#headline').boundingBox();
 for(const [time,name] of [[2000,'description'],[10000,'unity']]){
  await p.locator('#headline').evaluate((e,time)=>e.querySelectorAll('span').forEach(s=>s.getAnimations().forEach(a=>{a.pause();a.currentTime=time;})),time);
  const state=await p.locator('#headline').evaluate(e=>({height:e.getBoundingClientRect().height,opacity:[...e.children].map(s=>getComputedStyle(s).opacity),transforms:[...e.children].map(s=>getComputedStyle(s).transform)}));
  assert.equal(state.height,headline.height);assert.deepEqual(state.opacity,name==='description'?['1','0']:['0','1']);assert(state.transforms.every(t=>t==='none'));
  await p.clock.runFor(100);await new Promise(r=>setTimeout(r,500));if(name==='unity')await p.screenshot({path:out+'/unity-'+vp.width+'.png'});
 }
 await p.locator('#headline').evaluate(e=>e.querySelectorAll('span').forEach(s=>s.getAnimations().forEach(a=>{a.currentTime=2000;})));
 await p.clock.runFor(100);await new Promise(r=>setTimeout(r,500));await p.screenshot({path:out+'/day-'+vp.width+'.png'});
 await p.evaluate(()=>{window.__qa.frame(102);window.__qa.view('overview');window.__qa.lineup();});await p.clock.runFor(40);await p.clock.fastForward(800);await p.clock.runFor(40);await new Promise(r=>setTimeout(r,800));
 assert.equal(await p.locator('.vignette').evaluate(e=>getComputedStyle(e,'::before').opacity),'0');await p.screenshot({path:out+'/night-'+vp.width+'.png'});
 if(!mobile){
  for(const [view,name] of [['support','support'],['play','playground']]){
   await p.evaluate(view=>{window.__qa.frame(32);window.__qa.view(view);},view);await p.clock.runFor(40);await p.clock.fastForward(800);await p.clock.runFor(40);await new Promise(r=>setTimeout(r,800));await p.screenshot({path:out+'/'+name+'.png'});
  }
  await p.evaluate(()=>{window.__qa.view('food');window.__qa.camera([-31,3.7,24],[-26,1,18]);});await p.clock.runFor(40);await p.screenshot({path:out+'/music-circle.png'});
  await p.evaluate(()=>window.__qa.activity(3));const a=await p.evaluate(()=>window.__qa.read().activities);await p.evaluate(()=>window.__qa.activity(5));const b=await p.evaluate(()=>window.__qa.read().activities);assert.notDeepEqual(a.actors.filter(x=>x.role==='slide'),b.actors.filter(x=>x.role==='slide'));assert.notEqual(a.beat,b.beat);
 }
 await p.locator('#about-open').click();assert(await p.locator('#vision').evaluate(e=>e.open));
 assert.deepEqual(await p.locator('.day-order b').allTextContents(),['Dining experience','Leisure','Workshops','Rave']);
 await p.screenshot({path:out+'/about-'+vp.width+'.png'});
 await p.locator('#learn-about').click();assert(await p.locator('#learning').evaluate(e=>e.open));
 const learning=await p.locator('#learning').evaluate(e=>({bounds:e.getBoundingClientRect().toJSON(),background:getComputedStyle(e).backgroundColor,title:getComputedStyle(e.querySelector('h2')).color,items:e.querySelectorAll('.mindfulness-practices li').length,diagram:e.querySelector('.learning-map').getAttribute('aria-labelledby'),scroll:e.querySelector('.learning-scroll').scrollHeight>e.querySelector('.learning-scroll').clientHeight}));
 assert.equal(learning.background,'rgb(16, 45, 52)');assert.equal(learning.items,9);assert(learning.bounds.width<=vp.width);assert(learning.bounds.height<=vp.height*.91);
 await p.screenshot({path:out+'/learn-'+vp.width+'.png'});
 await p.locator('.learning-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);assert(await p.getByText('Mindfulness of the body · Yoga',{exact:true}).isVisible());
 await p.screenshot({path:out+'/learn-scrolled-'+vp.width+'.png'});
 await p.keyboard.press('Escape');await p.clock.runFor(40);assert.equal(await p.locator('#learning').evaluate(e=>e.open),false);assert(await p.locator('#vision').evaluate(e=>e.open));
 await p.keyboard.press('Escape');await p.clock.runFor(40);assert.equal(await p.locator('#vision').evaluate(e=>e.open),false);
 await p.evaluate(()=>window.__qa.view('main',true));await p.clock.runFor(40);await p.locator('#learn-main').click();assert(await p.locator('#learning').evaluate(e=>e.open));await p.locator('#learn-close').click();await p.clock.runFor(40);assert.equal(await p.locator('#learning').evaluate(e=>e.open),false);
 await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.headline-description').evaluate(e=>getComputedStyle(e).animationName),'none');await p.emulateMedia({reducedMotion:'no-preference'});
 assert.deepEqual(errors,[]);checks.push({viewport:vp,initialCamera:initial.position,finalCamera:final.position,style,header,learning,stats:final.stats,pageErrors:errors});console.log(vp.width+'px passed');
 }finally{for(const p of c.pages())await p.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await c.close();}
}
fs.writeFileSync(out+'/verification.json',JSON.stringify({live,processMuted:true,mediaStubbed:true,nativeFullscreenDisabled:true,testOnlySceneReadout:true,checks},null,2)+'\n');
}finally{await browser.close();await server.close();}
