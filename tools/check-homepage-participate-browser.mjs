import assert from 'node:assert/strict';
import { chromium } from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const base = 'https://staging.universalmind.tv/vogue/iam/';
const server = await chromium.launchServer({headless:true,
  executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  args:['--mute-audio','--disable-dev-shm-usage']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser = await chromium.connect(server.wsEndpoint());
const report = { processMuted:true, nativeFullscreenInvoked:false, checks:[] };
try {
  for (const kind of ['standard','webkit','ordinary']) {
    const context = await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
    const page = await context.newPage();
    const crashes=[];
    page.on('crash',()=>crashes.push('crash'));
    await page.addInitScript(({kind})=>{
      window.__qaFs={active:null,exitCalls:0};
      const qa=window.__qaFs;
      const enter=function(){qa.active=this;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();};
      Element.prototype.requestFullscreen=enter;
      Element.prototype.webkitRequestFullscreen=enter;
      HTMLVideoElement.prototype.webkitEnterFullscreen=enter;
      Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>kind==='standard'?qa.active:null});
      Object.defineProperty(document,'webkitFullscreenElement',{configurable:true,get:()=>kind==='webkit'?qa.active:null});
      document.exitFullscreen=kind==='standard'?()=>{
        qa.exitCalls++;
        return new Promise(resolve=>{qa.finish=()=>{qa.active=null;document.dispatchEvent(new Event('fullscreenchange'));resolve();};});
      }:undefined;
      document.webkitExitFullscreen=kind==='webkit'?()=>{
        qa.exitCalls++;
        qa.finish=()=>{qa.active=null;document.dispatchEvent(new Event('webkitfullscreenchange'));};
      }:undefined;
    },{kind});
    await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.dataset.adaptiveSelectionSource==='no_checkin_random' && window.IAMAdaptiveSoundSnapshot);
    assert.equal(await page.locator('[data-adaptive-session-frequency]').isVisible(),false);
    assert.equal(await page.evaluate(()=>window.IAMAdaptiveSoundSnapshot.selected),false);
    let played=0;
    if(kind!=='ordinary'){
      await page.locator('[data-television-play]').click({timeout:60000});
      await page.waitForFunction(()=>document.querySelector('.adaptive-television-local-video')?.currentTime>.2,null,{timeout:60000});
      played=await page.locator('.adaptive-television-local-video').evaluate(v=>v.currentTime);
    }
    await page.locator('[data-nav-open]:visible').last().click();
    await page.locator('[data-nav-item="research"]:visible').click();
    await page.locator('[data-nav-subitem="research-participate"]:visible').click();
    if(kind!=='ordinary'){
      await page.waitForFunction(()=>window.__qaFs.exitCalls===1);
      await page.waitForTimeout(450);
      assert.equal(page.url(),base+'index.html','Must not navigate while fullscreen exit is pending');
      assert.equal(await page.locator('.adaptive-television-local-video').evaluate(v=>v.paused),true);
      // Repeated input must not initiate a second transition.
      await page.locator('[data-nav-subitem="research-participate"]').evaluate(a=>a.click());
      assert.equal(await page.evaluate(()=>window.__qaFs.exitCalls),1);
      await page.evaluate(()=>window.__qaFs.finish());
    }
    await page.waitForURL(/\/study(?:\.php)?(?:[?#]|$)/,{timeout:30000});
    await page.waitForFunction(()=>document.querySelector('input[type="password"]'));
    assert.equal(page.frames().length,1,'Research login must be top-level');
    assert.deepEqual(crashes,[]);
    report.checks.push({kind,realVideoSeconds:played,pausedBeforeExit:kind!=='ordinary',destination:page.url(),passwordInput:true});
    await context.close();
  }
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.goto(base+'quantum-tree-control.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.IAMOwnerSynthAudition);
  await page.evaluate(()=>window.IAMOwnerSynthAudition.play());
  await page.waitForFunction(()=>window.IAMOwnerSynthAudition.diagnostics().outputRms>0,null,{timeout:30000});
  const diagnostics=await page.evaluate(()=>window.IAMOwnerSynthAudition.diagnostics());
  assert.equal(diagnostics.carrierHz,222);
  assert.equal(diagnostics.profileId,'calm_alpha_80_v1');
  await page.evaluate(()=>window.IAMOwnerSynthAudition.stop());
  report.ownerTest={profile:diagnostics.profileId,carrier:diagnostics.carrierHz,outputRms:diagnostics.outputRms};
  await context.close();
  report.passed=true;
} finally {
  for(const page of browser.contexts().flatMap(c=>c.pages())){
    await page.evaluate(()=>{document.querySelectorAll('audio,video').forEach(m=>m.pause());window.__iamStopAdaptiveMedia?.();window.IAMOwnerSynthAudition?.stop();}).catch(()=>{});
  }
  await browser.close();await server.close();
}
console.log(JSON.stringify(report,null,2));
