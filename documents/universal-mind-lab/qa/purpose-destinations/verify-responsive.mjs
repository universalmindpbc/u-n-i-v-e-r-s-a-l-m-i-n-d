import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const live=process.argv.includes('--live'),quick=process.argv.includes('--quick'),origin='https://staging.universalmind.tv';
const out=live?'documents/universal-mind-lab/qa/purpose-destinations':'/private/tmp/um-purpose-proof';fs.mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),checks=[];
try{
for(const vp of (quick?[{width:1440,height:1000}]:[{width:393,height:647},{width:320,height:568},{width:844,height:390},{width:1440,height:1000}])){
 const mobile=vp.width<1000;
 const c=await browser.newContext({viewport:vp,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
 try{
 await c.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;HTMLMediaElement.prototype.play=function(){this.dispatchEvent(new Event('playing'));return Promise.resolve()};});
 await c.route(origin+'/**',async r=>{
  const u=new URL(r.request().url()),f=path.resolve('.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));
  if(u.pathname.endsWith('/hls.min.js'))return r.fulfill({contentType:'application/javascript',body:'window.Hls=class{static isSupported(){return true}static Events={ERROR:"error"};on(){}loadSource(){}attachMedia(){}destroy(){}}'});
  if(u.pathname==='/lab/lab.mjs'){
   let source=fs.readFileSync(f,'utf8');if(live){const res=await r.fetch();assert.equal(res.status(),200);assert.equal(await res.text(),source);}
   source=source.replace('createStory, ORBIT_START','createStory, storyFrame, ORBIT_START');
   source=source.replace("go('overview',true);resize();",`go('overview',true);resize();window.__qa={read:()=>({position:camera.position.toArray(),target:controls.target.toArray(),activities:activities.snapshot(),stats:activities.stats}),frame:t=>{applyStory(storyFrame(t));emotionPanel(false);},view:(key,show=false)=>{lineupOverride=null;selectPlace(key,show);go(key,true)},lineup:()=>{lineupOverride=true;syncLineup()},camera:(p,t)=>{tween=null;camera.position.fromArray(p);controls.target.fromArray(t);controls.update();needsFrame=true;requestFrame()},activity:t=>activities.update(t,true)};`);
   return r.fulfill({contentType:'application/javascript',body:source});
  }
  if(!live){if(fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.abort();}
  return r.continue();
 });
 await c.route('**/*.m3u8*',r=>r.abort());
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+2000));await p.goto(origin+'/lab/');await p.waitForFunction(()=>document.body.dataset.ready==='true');
 await p.locator('#explore-enter').click();await p.clock.runFor(40);
 await p.clock.fastForward(110000);await p.clock.runFor(40);await p.clock.fastForward(1500);await p.clock.runFor(40);
 assert.equal(await p.locator('body').getAttribute('data-story'),'complete');
 const state=await p.evaluate(()=>window.__qa.read());assert.equal(state.activities.actors.length,12);assert.equal(state.stats.doctors,2);
 const doctors=state.activities.actors.filter(a=>a.role==='doctor');assert(doctors.every(d=>d.gender==='female'&&d.coat==='long'&&d.hair==='long'&&d.footwear==='heels'&&d.stethoscope));
 assert.equal(await p.locator('body').getAttribute('data-food-flags'),'United Nations|Australian Aboriginal|Japan|France|Italy');
 for(const label of ['International Food Fair','Mobile music making','Apple listening pods'])assert((await p.locator('#place-list').textContent()).includes(label));
 assert.equal((await p.locator('.headline-unity').textContent()).trim(),'Together,let’s beat as one');
 const settle=async()=>{await p.clock.runFor(40);await p.clock.fastForward(800);await p.clock.runFor(40);await new Promise(r=>setTimeout(r,750));};
 await p.evaluate(()=>{window.__qa.frame(32);window.__qa.view('overview');window.__qa.lineup();});await settle();
 await p.locator('#headline').evaluate(e=>e.querySelectorAll('span').forEach(s=>s.getAnimations().forEach(a=>{a.pause();a.currentTime=2000;})));
 const style=await p.evaluate(()=>{const h=getComputedStyle(document.querySelector('.headline-ink')),a=getComputedStyle(document.querySelector('.artist-mark'),'::before'),v=getComputedStyle(document.querySelector('.vignette'),'::before');return {heading:h.color,headingBackground:h.backgroundColor,headingShadow:h.textShadow,logoInk:a.backgroundColor,skyContent:v.content,skyBackground:v.backgroundImage,gold:getComputedStyle(document.querySelector('.mindfulness-line span:nth-child(2)')).color,overflow:document.documentElement.scrollWidth>innerWidth};});
 assert.equal(style.headingShadow,'none');assert.equal(style.skyContent,'none');assert.equal(style.skyBackground,'none');assert.equal(style.overflow,false);
 assert.equal(style.heading,'rgb(244, 245, 239)');assert.equal(style.headingBackground,'rgb(23, 43, 48)');assert.equal(style.logoInk,style.heading);
 await settle();await p.screenshot({path:out+'/day-'+vp.width+'.png'});
 await p.locator('#headline').evaluate(e=>e.querySelectorAll('span').forEach(s=>s.getAnimations().forEach(a=>a.currentTime=10000)));await settle();await p.screenshot({path:out+'/unity-'+vp.width+'.png'});
 await p.evaluate(()=>{window.__qa.frame(102);window.__qa.view('overview');window.__qa.lineup();});await settle();await p.screenshot({path:out+'/night-'+vp.width+'.png'});
 if(!mobile){
  for(const [key,title] of [['food','International Food Fair'],['play','Mobile music making'],['river','Apple listening pods'],['support','Support & connection']]){
   await p.evaluate(()=>window.__qa.frame(32));await p.locator('#place-list [data-view="'+key+'"]').click();await p.clock.fastForward(1500);await settle();
   assert.equal(await p.locator('#place-title').textContent(),title);
   await p.screenshot({path:out+'/'+key+'.png'});
  }
  await p.evaluate(()=>{window.__qa.frame(102);window.__qa.view('play',true);});await settle();await p.screenshot({path:out+'/play-night.png'});
 }
 assert.deepEqual(errors,[]);checks.push({viewport:vp,style,doctors,stats:state.stats,pageErrors:errors});console.log(vp.width+'px passed');
 }finally{for(const p of c.pages())await p.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await c.close();}
}
fs.writeFileSync(out+'/verification.json',JSON.stringify({live,processMuted:true,mediaStubbed:true,nativeFullscreenDisabled:true,testOnlySceneReadout:true,checks},null,2)+'\n');
}finally{await browser.close();await server.close();}
