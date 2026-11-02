import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'documents/universal-mind-lab/qa');fs.mkdirSync(out,{recursive:true});
const executablePath='/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const server=await chromium.launchServer({headless:true,executablePath,args:['--mute-audio','--autoplay-policy=user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const errors=[],failed=[];const checks=[];
const url='https://staging.universalmind.tv/lab/';
async function changedFrame(page,before){
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex');const previous=hash(before);
  for(let i=0;i<15;i++){await page.waitForTimeout(200);if(hash(await page.locator('canvas').screenshot())!==previous)return;}
  assert.fail('Camera input did not change the rendered scene within the render window');
}
async function context(options={}) {
  const c=await browser.newContext({serviceWorkers:'block',...options});
  await c.addInitScript(()=>{HTMLMediaElement.prototype.play=()=>Promise.reject(new Error('Playback disabled for Lab QA'));Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Native fullscreen disabled for Lab QA'));});
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
  return {c,p};
}
try {
  const {c,p}=await context({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await p.goto(url,{waitUntil:'networkidle'});await p.waitForFunction(()=>document.body.dataset.rendered==='true',{timeout:30000});
  assert.equal(await p.locator('body').getAttribute('data-ready'),'true');
  await p.screenshot({path:path.join(out,'stage-01-desktop.png')});
  const initial=await p.locator('canvas').screenshot();
  await p.locator('[data-view="main"]').click();await p.waitForTimeout(350);
  assert.equal(await p.locator('#place-title').innerText(),'Under one shared roof.');
  assert.notDeepEqual(await p.locator('canvas').screenshot(),initial);
  await p.screenshot({path:path.join(out,'stage-01-main-pavilion.png')});
  for(const key of ['food','river']){await p.locator(`[data-view="${key}"]`).click();assert.equal(await p.locator(`[data-view="${key}"]`).getAttribute('aria-pressed'),'true');}
  await p.locator('#plan-toggle').click();assert.equal(await p.locator('body').getAttribute('data-mode'),'plan');assert.ok(await p.locator('#plan').isVisible());
  await p.locator('#reset-view').click();await p.screenshot({path:path.join(out,'stage-01-plan.png')});
  await p.locator('#plan-toggle').click();await p.locator('#labels-toggle').click();assert.equal(await p.locator('#labels').isVisible(),false);
  await p.locator('#labels-toggle').click();await p.locator('#about-open').click();assert.ok(await p.locator('#vision').isVisible());await p.keyboard.press('Escape');assert.equal(await p.locator('#vision').isVisible(),false);await p.waitForFunction(()=>document.activeElement?.id==='about-open');
  await p.locator('canvas').focus();assert.equal(await p.evaluate(()=>document.activeElement?.tagName),'CANVAS');const keyboardBefore=await p.locator('canvas').screenshot();await p.keyboard.press('ArrowLeft');await changedFrame(p,keyboardBefore);
  const dragBefore=await p.locator('canvas').screenshot();await p.mouse.move(700,650);await p.mouse.down();await p.mouse.move(800,690,{steps:10});await p.mouse.up();await changedFrame(p,dragBefore);
  const zoomBefore=await p.locator('canvas').screenshot();await p.mouse.wheel(0,-200);await changedFrame(p,zoomBefore);
  assert.equal(await p.evaluate(()=>document.querySelectorAll('audio,video,form').length),0);
  const assets=[];
  for(const file of ['index.html','lab.css','lab.mjs','vendor/three.module.js','vendor/OrbitControls.js','vendor/LICENSE-three.txt']) {
    const result=await p.evaluate(async file=>{const r=await fetch('./'+file,{cache:'reload'});const data=await r.arrayBuffer();const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');return {file,status:r.status,bytes:data.byteLength,sha256:hash};},file);
    assert.equal(result.status,200,file);assert.equal(result.sha256,createHash('sha256').update(fs.readFileSync(path.join(root,'lab',file))).digest('hex'),file);assets.push(result);
  }
  fs.writeFileSync(path.join(out,'stage-01-http.json'),JSON.stringify({url,assets},null,2)+'\n');
  checks.push('Desktop WebGL, camera presets, keyboard orbit, mouse drag/zoom, labels, plan and vision dialog','All six staging files match local SHA-256 hashes');await c.close();
  const mob=await context({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await mob.p.goto(url,{waitUntil:'networkidle'});await mob.p.waitForFunction(()=>document.body.dataset.rendered==='true');
  assert.equal(await mob.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await mob.p.screenshot({path:path.join(out,'stage-01-mobile.png')});
  await mob.p.locator('[data-view="food"]').tap();await mob.p.waitForTimeout(250);assert.ok(await mob.p.locator('#place-card').isVisible());
  await mob.p.screenshot({path:path.join(out,'stage-01-mobile-detail.png')});
  await mob.p.locator('#about-open').tap();assert.ok(await mob.p.locator('#vision').isVisible());await mob.p.locator('#about-close').tap();
  checks.push('390×844 mobile layout, touch preset and dialog');await mob.c.close();
  const fallback=await context({viewport:{width:1280,height:900}});
  await fallback.p.route('**/vendor/three.module.js',route=>route.abort());
  await fallback.p.goto(url,{waitUntil:'networkidle'});await fallback.p.waitForFunction(()=>document.body.dataset.ready==='fallback');
  assert.ok(await fallback.p.locator('#plan').isVisible());await fallback.p.locator('[data-view="main"]').click();assert.ok(await fallback.p.locator('#place-card').isVisible());
  checks.push('Blocked 3D runtime retains the site plan and place descriptions');await fallback.c.close();
  const nojs=await context({viewport:{width:1280,height:900},javaScriptEnabled:false});await nojs.p.goto(url,{waitUntil:'networkidle'});assert.ok(await nojs.p.locator('#plan').isVisible());checks.push('No-JavaScript site plan');await nojs.c.close();
  const unexpected=errors.filter(e=>!e.includes('ERR_FAILED')&&!e.includes('Failed to fetch dynamically imported module')&&!e.startsWith('Lab landscape:'));
  assert.deepEqual(unexpected,[]);assert.deepEqual(failed,[]);
  const report={url,date:new Date().toISOString(),processMuted:true,hiddenBrowser:true,checks,unexpectedErrors:unexpected,httpFailures:failed,physicalPhoneTest:false};
  fs.writeFileSync(path.join(out,'stage-01-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
} finally {await browser.close();await server.close();}
