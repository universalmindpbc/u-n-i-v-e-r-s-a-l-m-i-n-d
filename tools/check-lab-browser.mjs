import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const localSource=process.env.LAB_QA_SOURCE_LOCAL==='1';
const out=localSource ? '/private/tmp/um-lab-five-stages-qa' : path.join(root,'documents/universal-mind-lab/qa/landing-five-stages');fs.mkdirSync(out,{recursive:true});
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
try {
  const {c,p}=await context({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await p.goto(url,{waitUntil:'networkidle'});await p.waitForFunction(()=>document.body.dataset.ready==='true');
  assert.ok(await p.locator('#landing').isVisible());assert.equal(await p.locator('#world').evaluate(e=>e.inert),true);
  assert.ok(await p.locator('#music-video').evaluate(v=>v.paused&&!v.currentSrc));
  await p.screenshot({path:path.join(out,'lab-landing.png')});
  await p.locator('#explore-enter').click();await p.waitForFunction(()=>document.body.dataset.rendered==='true');
  assert.equal(await p.locator('#music-video').evaluate(v=>getComputedStyle(v).opacity),'0.07');
  assert.equal(await p.locator('body').getAttribute('data-ready'),'true');
  await p.screenshot({path:path.join(out,'lab-desktop.png')});
  assert.equal(await p.title(),'Universal Mind — Proposal');
  const copy=await p.locator('body').textContent();
  for(const text of ['music · fashion · mindfulness','Next generation','next generation','headspace.org.au/eora','NSW Education, Headspace & Universal Mind'])assert.ok(copy.includes(text),text);
  assert.equal(await p.locator('.membership a').getAttribute('href'),'https://headspace.org.au/eora');
  assert.doesNotMatch(await p.locator('body').innerText(),/A place to become|A place to belong|Designed to grow/);
  const fsButton=p.locator('#fullscreen-toggle');
  assert.equal(await fsButton.getAttribute('aria-pressed'),'true');assert.equal(await fsButton.getAttribute('aria-label'),'Exit fullscreen');
  assert.equal(await p.evaluate(()=>window.__labFullscreenQA.calls[0].target),'HTML');
  await p.locator('#about-open').click();assert.ok(await p.locator('#vision').isVisible());await p.locator('#about-close').click();
  await fsButton.click();assert.equal(await fsButton.getAttribute('aria-pressed'),'false');
  await fsButton.click();await p.evaluate(()=>window.__labFullscreenQA.exit());assert.equal(await fsButton.getAttribute('aria-label'),'Enter fullscreen');
  await p.setViewportSize({width:1920,height:1080});await p.waitForTimeout(250);
  assert.equal(await p.locator('#world').evaluate(e=>e.clientHeight),1080);
  assert.equal(await p.locator('#scene canvas').evaluate(e=>e.clientHeight),1080);
  await p.screenshot({path:path.join(out,'lab-wide.png')});
  await p.setViewportSize({width:1440,height:1000});
  checks.push('Fibonacci landing, Explore gesture, 7% overlay and requested fullscreen; approved branding and membership URL; standard fullscreen enter/exit and external exit via test doubles; complete-page target; 1920×1080 layout');
  for(const stage of ['site','arrival','assembly','fitout','open']){await p.locator(`[data-stage="${stage}"]`).click();assert.equal(await p.locator('body').getAttribute('data-build-stage'),stage);await p.waitForTimeout(250);await p.screenshot({path:path.join(out,`lab-stage-${stage}.png`)});}
  await p.locator('#sequence-play').click();assert.equal(await p.locator('body').getAttribute('data-build-stage'),'site');await p.waitForTimeout(3500);assert.equal(await p.locator('body').getAttribute('data-build-stage'),'arrival');await p.locator('[data-stage="open"]').click();assert.equal(await p.locator('#sequence-play').getAttribute('aria-pressed'),'false');
  await p.locator('#layout-toggle').click();assert.ok(await p.locator('#layout-notes').isVisible());await p.locator('#rain-toggle').click();assert.equal(await p.locator('body').getAttribute('data-rain'),'true');await p.waitForTimeout(250);await p.screenshot({path:path.join(out,'lab-rain-layout.png')});await p.locator('#rain-toggle').click();await p.locator('#layout-toggle').click();
  await p.locator('#tour-toggle').click();assert.equal(await p.locator('#tour-toggle').getAttribute('aria-pressed'),'true');await p.locator('[data-view="main"]').click();assert.equal(await p.locator('#tour-toggle').getAttribute('aria-pressed'),'false');await p.locator('#reset-view').click();
  checks.push('Five construction stages, replay progression and cancellation; rain shelter and 100-position layout; guided tour cancellation');
  const renderStats=await p.evaluate(()=>({drawCalls:Number(document.body.dataset.renderCalls),triangles:Number(document.body.dataset.renderTriangles)}));
  const initial=await p.locator('#scene canvas').screenshot();
  await p.locator('[data-view="main"]').click();await p.waitForTimeout(350);
  assert.equal(await p.locator('#place-title').innerText(),'Main pavilion');
  assert.notDeepEqual(await p.locator('#scene canvas').screenshot(),initial);
  await p.screenshot({path:path.join(out,'lab-main-pavilion.png')});
  for(const key of ['food','play','river','support']){await p.locator(`[data-view="${key}"]`).click();assert.equal(await p.locator(`[data-view="${key}"]`).getAttribute('aria-pressed'),'true');}
  await p.locator('[data-view="play"]').click();await p.waitForTimeout(250);await p.screenshot({path:path.join(out,'lab-playground.png')});
  await p.locator('[data-view="support"]').click();
  assert.equal(await p.locator('body').getAttribute('data-brand-assets'),'ready');
  await p.screenshot({path:path.join(out,'lab-support.png')});
  await p.locator('[data-view="river"]').click();await p.waitForTimeout(250);
  await p.screenshot({path:path.join(out,'lab-apple.png')});
  await p.locator('#plan-toggle').click();assert.equal(await p.locator('body').getAttribute('data-mode'),'plan');assert.ok(await p.locator('#plan').isVisible());
  await p.locator('#reset-view').click();await p.screenshot({path:path.join(out,'lab-plan.png')});
  await p.locator('#plan-toggle').click();await p.locator('#labels-toggle').click();assert.equal(await p.locator('#labels').isVisible(),false);
  await p.locator('#labels-toggle').click();await p.locator('#about-open').click();assert.ok(await p.locator('#vision').isVisible());await p.keyboard.press('Escape');assert.equal(await p.locator('#vision').isVisible(),false);await p.waitForFunction(()=>document.activeElement?.id==='about-open');
  await p.locator('#scene canvas').focus();assert.equal(await p.evaluate(()=>document.activeElement?.tagName),'CANVAS');const keyboardBefore=await p.locator('#scene canvas').screenshot();await p.keyboard.press('ArrowLeft');await changedFrame(p,keyboardBefore);
  const dragBefore=await p.locator('#scene canvas').screenshot();await p.mouse.move(700,650);await p.mouse.down();await p.mouse.move(800,690,{steps:10});await p.mouse.up();await changedFrame(p,dragBefore);
  const zoomBefore=await p.locator('#scene canvas').screenshot();await p.mouse.wheel(0,-200);await changedFrame(p,zoomBefore);
  assert.equal(await p.evaluate(()=>document.querySelectorAll('audio,form').length),0);
  const assets=[];
  for(const file of ['index.html','lab.css','lab.mjs','media.mjs','landing-rain.js','architecture.mjs','furnishings.mjs','site-features.mjs','vendor/hls.min.js','vendor/LICENSE-hls.txt','vendor/three.module.js','vendor/OrbitControls.js','vendor/LICENSE-three.txt','assets/headspace.svg','assets/msf.svg','assets/nsw-government.svg','assets/apple-music.svg','assets/universal-mind-flower.png']) {
    const result=await p.evaluate(async file=>{const version=new URL(document.querySelector('link[rel=stylesheet]').href).search;const requestedURL=new URL('./'+file+(file==='index.html'?'':version),location.href).href;const r=await fetch(requestedURL,{cache:'reload'});const data=await r.arrayBuffer();const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');return {file,requestedURL,status:r.status,bytes:data.byteLength,sha256:hash};},file);
    assert.equal(result.status,200,file);assert.equal(result.sha256,createHash('sha256').update(fs.readFileSync(path.join(root,'lab',file))).digest('hex'),file);assets.push(result);
  }
  fs.writeFileSync(path.join(out,'lab-http.json'),JSON.stringify({url,assets},null,2)+'\n');
  checks.push('Desktop WebGL, camera presets, keyboard orbit, mouse drag/zoom, labels, plan and vision dialog','All eighteen staging files match local SHA-256 hashes');await c.close();
  const mob=await context({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await mob.p.goto(url,{waitUntil:'networkidle'});await mob.p.waitForFunction(()=>document.body.dataset.ready==='true');await mob.p.screenshot({path:path.join(out,'lab-landing-mobile.png')});await mob.p.locator('#explore-enter').tap();await mob.p.waitForFunction(()=>document.body.dataset.rendered==='true');
  assert.equal(await mob.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await mob.p.screenshot({path:path.join(out,'lab-mobile.png')});
  await mob.p.locator('[data-view="food"]').tap();await mob.p.waitForTimeout(250);assert.ok(await mob.p.locator('#place-card').isVisible());
  await mob.p.screenshot({path:path.join(out,'lab-mobile-detail.png')});
  await mob.p.locator('#about-open').tap();assert.ok(await mob.p.locator('#vision').isVisible());await mob.p.locator('#about-close').tap();
  checks.push('390×844 mobile layout, touch preset and dialog');await mob.c.close();
  const landscape=await context({viewport:{width:844,height:390},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await landscape.p.goto(url,{waitUntil:'networkidle'});await landscape.p.waitForFunction(()=>document.body.dataset.ready==='true');await landscape.p.locator('#explore-enter').tap();await landscape.p.waitForFunction(()=>document.body.dataset.rendered==='true');
  assert.equal(await landscape.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight),true);
  const intro=await landscape.p.locator('.build-controls').boundingBox();const nav=await landscape.p.locator('.explore-bar').boundingBox();assert.ok(intro.y+intro.height<nav.y);
  await landscape.p.screenshot({path:path.join(out,'lab-landscape.png')});await landscape.c.close();
  for(const mode of ['prefixed','denied','unsupported']){
    const test=await context({viewport:{width:1280,height:900},fullscreen:mode});
    await test.p.goto(url,{waitUntil:'networkidle'});
    await test.p.locator('#explore-enter').click();
    const button=test.p.locator('#fullscreen-toggle');
    if(mode==='unsupported')assert.equal(await button.isVisible(),false);
    else {
      assert.equal(await button.getAttribute('aria-pressed'),String(mode==='prefixed'));
      if(mode==='prefixed'){await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false');}
      else {assert.ok(await test.p.locator('#fullscreen-status').isVisible());assert.equal(await button.isEnabled(),true);}
    }
    await test.c.close();
  }
  checks.push('844×390 landscape fits the viewport; prefixed fullscreen, denied request and unsupported browser handled with test doubles; native fullscreen never invoked');
  const fallback=await context({viewport:{width:1280,height:900}});
  await fallback.p.route('**/vendor/three.module.js',route=>route.abort());
  await fallback.p.goto(url,{waitUntil:'networkidle'});await fallback.p.waitForFunction(()=>document.body.dataset.ready==='fallback');
  await fallback.p.locator('#explore-enter').click();assert.ok(await fallback.p.locator('#plan').isVisible());await fallback.p.locator('[data-view="main"]').click();assert.ok(await fallback.p.locator('#place-card').isVisible());
  checks.push('Blocked 3D runtime retains the site plan and place descriptions');await fallback.c.close();
  const nojs=await context({viewport:{width:1280,height:900},javaScriptEnabled:false});await nojs.p.goto(url,{waitUntil:'networkidle'});assert.ok(await nojs.p.locator('#plan').isVisible());checks.push('No-JavaScript site plan');await nojs.c.close();
  checks.push('Six camera presets including support, all five identity textures loaded, support vehicle/booth/staff and Apple Music flag captured in scene');
  const unexpected=errors.filter(e=>!e.includes('ERR_FAILED')&&!e.includes('Failed to fetch dynamically imported module')&&!e.startsWith('Lab landscape:'));
  assert.deepEqual(unexpected,[]);assert.deepEqual(failed,[]);
  const report={url,renderStats,source:localSource?'local source intercepted at staging URL':'live staging',nativeFullscreenTest:false,fullscreenStateTests:'standard, prefixed, external exit, denied and unsupported mocked API',date:new Date().toISOString(),processMuted:true,hiddenBrowser:true,checks,unexpectedErrors:unexpected,httpFailures:failed,physicalPhoneTest:false};
  fs.writeFileSync(path.join(out,'lab-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
} finally {await browser.close();await server.close();}
