import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {overviewPose,mobileOverviewPose,orbitPose,ORBIT_DURATION} from '../../../../lab/orbit.mjs';
import {ORBIT_START,STORY_END} from '../../../../lab/story.mjs';
const live=process.argv.includes('--live'),quick=process.argv.includes('--quick'),origin='https://staging.universalmind.tv';
const out=live?'documents/universal-mind-lab/qa/continuous-circuit':'/private/tmp/um-circuit-proof';fs.mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),checks=[];
try{
for(const vp of (quick?[{width:1440,height:1000}]:[{width:393,height:647},{width:320,height:568},{width:844,height:390},{width:1440,height:1000}])){
 const mobile=vp.width<1000,c=await browser.newContext({viewport:vp,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
 try{
 await c.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;HTMLMediaElement.prototype.play=function(){this.dispatchEvent(new Event('playing'));return Promise.resolve()};});
 await c.route(origin+'/**',async r=>{
  const u=new URL(r.request().url()),f=path.resolve('.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));
  if(u.pathname.endsWith('/hls.min.js'))return r.fulfill({contentType:'application/javascript',body:'window.Hls=class{static isSupported(){return true}static Events={ERROR:"error"};on(){}loadSource(){}attachMedia(){}destroy(){}}'});
  if(u.pathname==='/lab/lab.mjs'){
   let source=fs.readFileSync(f,'utf8');if(live){const res=await r.fetch();assert.equal(res.status(),200);assert.equal(await res.text(),source);}
   source=source.replace('createStory, ORBIT_START','createStory, storyFrame, ORBIT_START');
   source=source.replace("go('overview',true);resize();",`go('overview',true);resize();window.__qa={read:()=>({position:camera.position.toArray(),target:controls.target.toArray(),cinematic:cinematicCamera}),frame:t=>{autoTourCancelled=false;applyStory(storyFrame(t));emotionPanel(false);},view:key=>selectPlace(key),fullscreen:active=>{Object.defineProperty(document,'fullscreenElement',{configurable:true,value:active?document.documentElement:null});Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:true});document.documentElement.requestFullscreen=()=>Promise.resolve();syncFullscreen();}};`);
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
 const lineup=async expected=>{assert.equal(await p.locator('body').getAttribute('data-lineup-visible'),String(expected));assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),String(!expected));};
 for(const [t,shown] of [[0,true],[4,true],[15,true],[29,true],[37,true],[39,false],[69,false],[83,false],[112,false],[149,false],[151,true]]){
  const elapsed=Number(await p.locator('body').getAttribute('data-story-time'));
  if(t>elapsed)await p.clock.fastForward((t-elapsed)*1000);await p.clock.runFor(40);await lineup(shown);
  timeline.push({seconds:t,lineup:shown,phase:await p.locator('body').getAttribute('data-story')});
 }
 assert.equal(await p.locator('body').getAttribute('data-story'),'complete');
 await p.clock.fastForward(1500);await p.clock.runFor(40);
 const expected=mobile?mobileOverviewPose(vp.height>vp.width,vp.height):overviewPose(),state=await p.evaluate(()=>window.__qa.read());
 for(const axis of ['position','target'])for(let i=0;i<3;i++)assert(Math.abs(state[axis][i]-expected[axis][i])<.001,'Final framing');
 assert.equal(await p.locator('.mast-right button').count(),3);
 assert.equal(await p.locator('#music-toggle,#tv-toggle,#motion-toggle,#mix-toggle,#layout-toggle,#plan-toggle').count(),0);
 assert.equal(await p.locator('#music-video').evaluate(e=>e.style.opacity),'0.07');
 await p.evaluate(()=>window.__qa.fullscreen(true));assert(await p.locator('#fullscreen-toggle').isHidden());
 await p.evaluate(()=>window.__qa.fullscreen(false));assert(await p.locator('#fullscreen-toggle').isVisible());
 const settle=async()=>{await p.clock.runFor(40);await p.clock.fastForward(1400);await p.clock.runFor(40);await new Promise(r=>setTimeout(r,400));};
 await p.evaluate(()=>{window.__qa.frame(32);window.__qa.view('overview');});await settle();
 await p.locator('#headline').evaluate(e=>e.querySelectorAll('span').forEach(s=>s.getAnimations().forEach(a=>{a.pause();a.currentTime=2000;})));
 await settle();
 const style=await p.evaluate(()=>{const h=getComputedStyle(document.querySelector('.headline-ink')),b=getComputedStyle(document.querySelector('.punk-bolt'));return {bolt:{left:b.left,top:b.top,width:b.width,height:b.height},headingShadow:h.textShadow,headingBackground:h.backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth,lineupVisibility:getComputedStyle(document.querySelector('#artist-lineup')).visibility,logos:[...document.querySelectorAll('.artist-mark')].map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label'),x:r.x,y:r.y,width:r.width,height:r.height}})};});
 assert.equal(style.headingShadow,'none');assert.equal(style.headingBackground,'rgba(0, 0, 0, 0)');assert.equal(style.overflow,false);assert.equal(style.lineupVisibility,'visible');
 assert.equal(style.logos.length,4);for(const logo of style.logos)assert(logo.x>=0&&logo.x+logo.width<=vp.width&&logo.y>=0&&logo.y+logo.height<vp.height,'All four logos fit');
 if(vp.width===1440)assert.deepEqual(style.bolt,{left:'300px',top:'-5px',width:'82px',height:'150px'});
 if(mobile){assert(await p.locator('#place-list').isHidden());assert(await p.locator('.view-tools').isHidden());}
 await p.screenshot({path:out+'/day-'+vp.width+'.png'});
 await p.evaluate(t=>window.__qa.frame(t),STORY_END);await settle();await lineup(true);await p.screenshot({path:out+'/night-'+vp.width+'.png'});
 if(!mobile){
  const nav=await p.locator('#place-list button').evaluateAll(items=>items.map(e=>{const n=e.querySelector('.place-number').getBoundingClientRect(),name=e.querySelector('.place-name'),r=name.getBoundingClientRect();return {text:name.innerText,numberRight:n.right,textLeft:r.left,display:getComputedStyle(e).display}}));
  assert.deepEqual(nav.map(n=>n.text),['Linfox truck','Main pavilion','International Food\nFair','Mobile\nmusic making','Apple listening\npods','Support area','Fashion runway']);assert(nav.every(n=>n.display==='grid'&&n.textLeft>n.numberRight));
  await p.locator('#place-list [data-view="truck"]').click();await settle();assert.equal(await p.locator('#place-title').textContent(),'Linfox truck');
  const truck=await p.evaluate(()=>window.__qa.read());assert(truck.position.every((v,i)=>Math.abs(v-[-62,4.8,28][i])<.00001));await p.screenshot({path:out+'/truck.png'});
  await p.locator('#reset-view').click();await settle();await lineup(true);await p.locator('#tour-toggle').click();await lineup(false);await p.locator('#tour-toggle').click();
  for(const [seconds,name] of [[6,'front'],[19,'stage-east'],[35,'support'],[46,'trucks'],[56,'music'],[65,'return']]){
   await p.evaluate(t=>window.__qa.frame(t),ORBIT_START+seconds);await settle();await lineup(false);
   const camera=await p.evaluate(()=>window.__qa.read()),pose=orbitPose(seconds);assert(camera.cinematic);for(let i=0;i<3;i++)assert(Math.abs(camera.position[i]-pose.position[i])<1e-8,'Ground camera not clamped by orbit controls');
   assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');await p.screenshot({path:out+'/orbit-'+name+'.png'});
  }
 }
 await p.locator('#about-open').click();
 await p.locator('#vision').waitFor({state:'visible'});
 assert.equal(await p.locator('#vision .proposal-lead').textContent(),'A free travelling mental health lab.');
 assert.equal(await p.locator('#mindfulness-opening-title').textContent(),'Electronic music and fashion as mindfulness');
 assert.equal(await p.locator('.proposal-opening p').textContent(),'Making a beat. Designing a garment. Listening closely. Creating together. Universal Mind brings electronic music and fashion together as a mindfulness experience, using creativity to practise presence, self-awareness and connection.');
 assert(await p.locator('#vision').evaluate(e=>e.querySelector('.proposal-opening').compareDocumentPosition(e.querySelector('.day-programme'))&Node.DOCUMENT_POSITION_FOLLOWING));
 const biofeedback=p.locator('.proposal-story section').filter({has:p.getByRole('heading',{name:'Change your emotions. Change your world.',exact:true})});
 assert.equal(await biofeedback.locator('p').first().textContent(),'Through Apple Watch biofeedback, participants explore emotional regulation as the light and sound around them respond.');
 assert.equal(await biofeedback.locator('.proposal-journey li').count(),3);
 assert(await p.getByRole('heading',{name:'Free access. Dissolving stigma. Clear pathways to support.',exact:true}).isVisible());
 const aboutBox=await p.locator('#vision').boundingBox();assert(aboutBox.x>=0&&aboutBox.x+aboutBox.width<=vp.width&&aboutBox.y>=0&&aboutBox.y+aboutBox.height<=vp.height);
 assert(await p.locator('.proposal-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth));
 await p.screenshot({path:out+'/about-'+vp.width+'.png'});
 await biofeedback.locator('h3').scrollIntoViewIfNeeded();await p.screenshot({path:out+'/about-biofeedback-'+vp.width+'.png'});
 await p.locator('#about-close').click();assert(await p.locator('#vision').isHidden());
 await p.locator('#replay-story').click();await settle();await lineup(true);
 assert.deepEqual(errors,[]);checks.push({viewport:vp,timeline,style,pageErrors:errors});console.log(vp.width+'px passed');
 }finally{for(const p of c.pages())await p.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await c.close();}
}
fs.writeFileSync(out+'/verification.json',JSON.stringify({live,processMuted:true,mediaStubbed:true,nativeFullscreenNeverInvoked:true,testOnlySceneReadout:true,checks},null,2)+'\n');
}finally{await browser.close();await server.close();}
