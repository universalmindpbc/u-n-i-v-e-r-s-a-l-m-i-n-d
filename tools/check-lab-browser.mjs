import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const localSource=process.env.LAB_QA_SOURCE_LOCAL==='1';
const out=localSource ? '/private/tmp/um-lab-story-qa' : path.join(root,'documents/universal-mind-lab/qa/story-revision');fs.mkdirSync(out,{recursive:true});
const executablePath='/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const server=await chromium.launchServer({headless:true,executablePath,args:['--mute-audio','--autoplay-policy=user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const errors=[],failed=[];const checks=[];
const url='https://staging.universalmind.tv/lab/';
async function changedFrame(page,before){
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex');const previous=hash(before);
  for(let i=0;i<15;i++){await page.waitForTimeout(200);if(hash(await page.locator('#scene canvas').screenshot())!==previous)return;}
  assert.fail('Camera input did not change the rendered scene within the render window');
}
async function context({fullscreen='standard',...options}={}) {
  const c=await browser.newContext({serviceWorkers:'block',...options});
  // Never invoke a native fullscreen implementation during QA.
  await c.addInitScript((mode)=>{
    Object.defineProperty(window,'Hls',{configurable:true,get:()=>undefined,set(){}});
    HTMLMediaElement.prototype.canPlayType=()=> 'probably';
    HTMLMediaElement.prototype.play=()=>Promise.reject(new Error('Playback disabled for Lab QA'));
    let active=null;
    window.__labFullscreenQA={calls:[],exit(){active=null;document.dispatchEvent(new Event(mode==='prefixed'?'webkitfullscreenchange':'fullscreenchange'));}};
    const define=(target,name,descriptor)=>Object.defineProperty(target,name,{configurable:true,...descriptor});
    const enter=async function(){
      window.__labFullscreenQA.calls.push({action:'enter',target:this.tagName});
      if(mode==='denied')throw new DOMException('Fullscreen denied in test','NotAllowedError');
      active=this;document.dispatchEvent(new Event(mode==='prefixed'?'webkitfullscreenchange':'fullscreenchange'));
    };
    const leave=async function(){window.__labFullscreenQA.calls.push({action:'exit'});window.__labFullscreenQA.exit();};
    define(document,'fullscreenElement',{get:()=>mode==='prefixed'?null:active});
    define(document,'webkitFullscreenElement',{get:()=>mode==='prefixed'?active:null});
    define(document,'fullscreenEnabled',{value:mode!=='unsupported'&&mode!=='prefixed'});
    define(document,'webkitFullscreenEnabled',{value:mode==='prefixed'});
    define(Element.prototype,'requestFullscreen',{value:mode==='unsupported'||mode==='prefixed'?undefined:enter});
    define(Element.prototype,'webkitRequestFullscreen',{value:mode==='prefixed'?enter:undefined});
    define(document,'exitFullscreen',{value:mode==='prefixed'?undefined:leave});
    define(document,'webkitExitFullscreen',{value:mode==='prefixed'?leave:undefined});
  },fullscreen);
  if(localSource) await c.route('https://staging.universalmind.tv/lab/**',route=>{
    const pathname=new URL(route.request().url()).pathname;
    const file=pathname==='/lab/'?'index.html':pathname.slice('/lab/'.length);
    return route.fulfill({path:path.join(root,'lab',file)});
  });
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
  return {c,p};
}
async function enter(p){await p.waitForFunction(()=>document.body.dataset.ready==='true');await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+100));await p.locator('#explore-enter').click({force:true});await p.clock.runFor(80);}
async function at(p,time){const current=Number(await p.locator('body').getAttribute('data-story-time'));if(time>current)await p.clock.fastForward((time-current)*1000);await p.clock.runFor(80);}
async function click(p,selector){await p.locator(selector).click({force:true});await p.clock.runFor(100);}
try {
  const {c,p}=await context({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await p.goto(url,{waitUntil:'networkidle'});await p.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:30000});
  assert.equal(await p.title(),'Universal Mind Lab');assert.ok(await p.locator('#landing').isVisible());assert.equal(await p.locator('#world').evaluate(e=>e.inert),true);
  assert.equal((await p.locator('#landing').innerText()).trim(),'universal mind lab\nLaunch Full Screen');
  assert.ok(await p.locator('#music-video').evaluate(v=>v.paused&&!v.currentSrc));
  await p.screenshot({path:path.join(out,'lab-landing.png')});await enter(p);
  assert.equal(await p.locator('#music-video').evaluate(v=>getComputedStyle(v).opacity),'0.07');
  assert.equal(await p.locator('body').getAttribute('data-ready'),'true');
  assert.ok(!await p.locator('#place-list').isVisible());assert.ok(!await p.locator('#labels').isVisible());
  assert.equal(await p.locator('#fullscreen-toggle').getAttribute('aria-pressed'),'true');assert.equal(await p.evaluate(()=>window.__labFullscreenQA.calls[0].target),'HTML');
  assert.equal(await p.locator('[data-stage]').count(),0);
  assert.equal(await p.locator('.wordmark>span').textContent(),'universalmind[lab]');
  const tracking=await p.locator('.wordmark').evaluate(e=>[e.querySelector('span'),e.querySelector('b'),e.querySelector('em')].map(x=>getComputedStyle(x).letterSpacing));assert.ok(tracking.every(x=>x===tracking[0]));
  await p.screenshot({path:path.join(out,'lab-site.png')});await at(p,4);assert.equal(await p.locator('body').getAttribute('data-story'),'arrival');
  await at(p,11);assert.equal(await p.locator('body').getAttribute('data-story'),'assembly');assert.ok(!(await p.locator('body').getAttribute('data-revealed')).includes('main'));
  await p.screenshot({path:path.join(out,'lab-assembly.png')});await at(p,17);assert.equal(await p.locator('body').getAttribute('data-story'),'fitout');assert.equal(await p.locator('body').getAttribute('data-revealed'),'main');
  await at(p,23);assert.equal(await p.locator('body').getAttribute('data-revealed'),'main,food,park,support');assert.ok(!await p.locator('#place-list').isVisible());
  await at(p,32);assert.equal(await p.locator('body').getAttribute('data-story'),'open');assert.ok(await p.locator('#place-list').isVisible());assert.equal(await p.locator('body').getAttribute('data-night-progress'),'0.000');
  await p.screenshot({path:path.join(out,'lab-open-day.png')});
  checks.push('Exact minimal Informatics landing content; original logo/favicon; visitor launch at 7%; uniform tracking across universalmind[lab]; no stage selector; truck arrival, ten-second construction and sequential facilities; navigation and tags wait until open');
  await at(p,50);assert.equal(await p.locator('body').getAttribute('data-night-progress'),'0.000');
  await at(p,56);assert.ok(Number(await p.locator('body').getAttribute('data-night-progress'))>.45);await at(p,62);assert.equal(await p.locator('body').getAttribute('data-story'),'complete');assert.equal(await p.locator('body').getAttribute('data-night-progress'),'1.000');
  await p.screenshot({path:path.join(out,'lab-auto-night.png')});
  const renderStats=await p.evaluate(()=>({drawCalls:Number(document.body.dataset.renderCalls),triangles:Number(document.body.dataset.renderTriangles)}));
  await click(p,'[data-view="main"]');await click(p,'#interior-view');await p.screenshot({path:path.join(out,'lab-main-interior.png')});
  await click(p,'[data-view="food"]');await p.screenshot({path:path.join(out,'lab-food.png')});await click(p,'[data-view="support"]');await p.screenshot({path:path.join(out,'lab-support.png')});
  await click(p,'[data-view="play"]');await p.screenshot({path:path.join(out,'lab-playground.png')});await click(p,'[data-view="river"]');await p.screenshot({path:path.join(out,'lab-apple.png')});
  await click(p,'[data-view="fashion"]');await p.screenshot({path:path.join(out,'lab-runway.png')});await click(p,'#reset-view');await click(p,'#night-toggle');assert.equal(await p.locator('body').getAttribute('data-night'),'false');
  await click(p,'#layout-toggle');await click(p,'#rain-toggle');assert.ok(await p.locator('#layout-notes').isVisible());assert.equal(await p.locator('body').getAttribute('data-rain'),'true');await p.screenshot({path:path.join(out,'lab-rain-layout.png')});await click(p,'#rain-toggle');await click(p,'#layout-toggle');
  await click(p,'#plan-toggle');assert.ok(await p.locator('#plan').isVisible());await click(p,'#plan-toggle');await click(p,'#about-open');assert.ok(await p.locator('#vision').isVisible());await click(p,'#about-close');
  await click(p,'#mix-toggle');assert.ok(await p.locator('#mix-panel').isVisible());const panel=await p.locator('#mix-panel').boundingBox();assert.ok(panel.y<180);await click(p,'#mix-close');
  await click(p,'#fullscreen-toggle');assert.equal(await p.locator('#fullscreen-toggle').getAttribute('aria-pressed'),'false');await click(p,'#fullscreen-toggle');await p.evaluate(()=>window.__labFullscreenQA.exit());assert.equal(await p.locator('#fullscreen-toggle').getAttribute('aria-pressed'),'false');
  await p.setViewportSize({width:1920,height:1080});await p.clock.runFor(100);assert.equal(await p.locator('#world').evaluate(e=>e.clientHeight),1080);await p.setViewportSize({width:1440,height:1000});await p.clock.runFor(100);
  await click(p,'#replay-story');assert.ok(Number(await p.locator('body').getAttribute('data-story-time'))<1);assert.equal(await p.locator('body').getAttribute('data-night-progress'),'0.000');assert.ok(!await p.locator('#place-list').isVisible());
  checks.push('Automatic daylight hold and gradual night completion; interior and all area camera views; rain/layout, plan, proposal and top-right media settings; Replay resets scene/daylight; fullscreen state mocked only; 1920×1080 layout');
  const assets=[];
  for(const file of ['index.html','lab.css','lab.mjs','media.mjs','story.mjs','crowd.mjs','light-show.mjs','stage-visuals.mjs','runway.mjs','landing-rain.js','architecture.mjs','furnishings.mjs','site-features.mjs','vendor/hls.min.js','vendor/LICENSE-hls.txt','vendor/three.module.js','vendor/OrbitControls.js','vendor/LICENSE-three.txt','assets/headspace.svg','assets/msf.svg','assets/nsw-government.svg','assets/apple-music.svg','assets/universal-mind-flower.png','assets/favicon.png','assets/landing-flower.png','assets/hexeosis-hx_4a480.mp4','assets/vogue.png']) {
    const result=await p.evaluate(async file=>{const version=new URL(document.querySelector('link[rel=stylesheet]').href).search;const requestedURL=new URL('./'+file+(file==='index.html'?'':version),location.href).href;const r=await fetch(requestedURL,{cache:'reload'});const data=await r.arrayBuffer();const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');return {file,requestedURL,status:r.status,bytes:data.byteLength,sha256:hash};},file);
    assert.equal(result.status,200,file);assert.equal(result.sha256,createHash('sha256').update(fs.readFileSync(path.join(root,'lab',file))).digest('hex'),file);assets.push(result);
  }
  fs.writeFileSync(path.join(out,'lab-http.json'),JSON.stringify({url,assets},null,2)+'\n');await c.close();
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
    const mob=await context({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});await mob.p.goto(url,{waitUntil:'networkidle'});await mob.p.waitForFunction(()=>document.body.dataset.ready==='true');await mob.p.screenshot({path:path.join(out,`lab-landing-${viewport.width}.png`)});await enter(mob.p);await at(mob.p,32);
    assert.equal(await mob.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),true);
    const boxes=await mob.p.locator('.wordmark,.mast-right').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));assert.ok(boxes.every(b=>b.x>=0&&b.right<=viewport.width));assert.ok(boxes[1].bottom<145,'Mobile controls remain in one row beneath identity');
    await mob.p.screenshot({path:path.join(out,`lab-mobile-${viewport.width}.png`)});await click(mob.p,'[data-view="main"]');assert.ok(await mob.p.locator('#place-card').isVisible());await click(mob.p,'#about-open');assert.ok(await mob.p.locator('#vision').isVisible());await mob.c.close();
  }
  checks.push('390×844 portrait and 844×390 landscape: no page overflow, header in bounds, touch place detail and proposal');
  for(const mode of ['prefixed','denied','unsupported']){
    const test=await context({viewport:{width:1280,height:900},fullscreen:mode,reducedMotion:'reduce'});await test.p.goto(url,{waitUntil:'networkidle'});await test.p.waitForFunction(()=>document.body.dataset.ready==='true');await test.p.locator('#explore-enter').click();
    const button=test.p.locator('#fullscreen-toggle');if(mode==='unsupported')assert.ok(!await button.isVisible());else{assert.equal(await button.getAttribute('aria-pressed'),String(mode==='prefixed'));if(mode==='denied')assert.ok(await test.p.locator('#fullscreen-status').isVisible());}await test.c.close();
  }
  checks.push('Prefixed, denied and unsupported fullscreen through API doubles; native fullscreen never invoked');
  const nojs=await context({viewport:{width:1280,height:900},javaScriptEnabled:false});await nojs.p.goto(url,{waitUntil:'networkidle'});assert.ok(await nojs.p.locator('#plan').isVisible());assert.ok(await nojs.p.locator('.plan-assembled').first().isVisible());await nojs.c.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const report={url,source:localSource?'local source intercepted at staging URL':'live staging',renderStats,date:new Date().toISOString(),processMuted:true,hiddenBrowser:true,nativeFullscreenTest:false,physicalPhoneTest:false,checks,unexpectedErrors:errors,httpFailures:failed,assetsVerified:assets.length};
  fs.writeFileSync(path.join(out,'lab-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{for(const c of browser.contexts())for(const p of c.pages())await p.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await browser.close();await server.close();}
