import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out=process.env.MANTRA_QA_DIR||'/private/tmp/um-mantra-analysis-qa';await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={mutedProcess:true,trackReason:'Billy Idol is the exact user-reported first-track failure; this is a regression fixture, not the generic proof URL.',checks:[]};
try {
 for(const failFirstConnection of [false,true]) {
  const context=await browser.newContext({viewport:{width:1470,height:956}});
  const page=await context.newPage();page.setDefaultTimeout(20000);
  await page.addInitScript(({failFirstConnection})=>{
   window.qaMediaContexts=new WeakMap();window.qaFailedConnection=false;window.qaClaims=0;
   const create=AudioContext.prototype.createMediaElementSource;
   const resume=AudioContext.prototype.resume;
   AudioContext.prototype.createMediaElementSource=function(media){
    if(failFirstConnection && !window.qaFailedConnection && media.matches?.('.adaptive-television-local-video')){
     window.qaFailedConnection=true;throw new DOMException('QA transient source connection failure','NotAllowedError');
    }
    const source=create.call(this,media);window.qaMediaContexts.set(media,this);window.qaClaims++;return source;
   };
   AudioContext.prototype.resume=function(){return window.qaBlockedContext===this ? Promise.reject(new DOMException('QA gesture required','NotAllowedError')):resume.call(this)};
   document.addEventListener('pointerdown',event=>{if(event.isTrusted)window.qaBlockedContext=null},true);
   Element.prototype.requestFullscreen=()=>Promise.reject(Error('QA disables fullscreen'));
   HTMLVideoElement.prototype.webkitEnterFullscreen=Element.prototype.requestFullscreen;
   if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=()=>Promise.reject(Error('QA disables microphone'));
  },{failFirstConnection});
  if(process.env.MANTRA_QA_LOCAL==='1')for(const file of ['emdr-shader.js','adaptive-sound/mantra-v1.js'])await page.route('**/'+file+'?*',route=>route.fulfill({path:path.join(root,'i  a m',file),contentType:'text/javascript'}));
  try{
   await page.goto('https://staging.universalmind.tv/vogue/iam/index.html?selected_track_id=billy-idol-eyes-without-a-face',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.IAMSubaudibleMantra&&window.IAMEMDR);
   await page.locator('[data-television-play]').click();
   await page.waitForFunction(()=>document.body.classList.contains('television-room-open')&&!document.body.classList.contains('television-wallet-settling')&&!document.body.classList.contains('television-wallet-pointer-locked'));
   await page.mouse.move(700,450);await page.locator('[data-reaction-wallet]').hover();
   if(await page.locator('[data-reaction-wallet]').getAttribute('data-wallet-view')!=='video')await page.locator('[data-wallet-category=video]').click();
   await page.locator('[data-video-mantra-open]').click();
   await page.waitForFunction(()=>IAMSubaudibleMantra.diagnostics().outputVerified,null,{timeout:45000});
   const initial=await page.evaluate(()=>IAMSubaudibleMantra.diagnostics());
   assert.equal(initial.programmeAnalysis.connected,true);assert.equal(initial.programmeAnalysis.contextState,'running');
   assert.equal(await page.evaluate(()=>window.qaFailedConnection),failFirstConnection);
   const claims=await page.evaluate(()=>window.qaClaims);
   const firstWave=await page.locator('[data-mantra-signal] canvas').evaluate(canvas=>canvas.toDataURL());
   await page.waitForTimeout(150);
   assert.notEqual(await page.locator('[data-mantra-signal] canvas').evaluate(canvas=>canvas.toDataURL()),firstWave);
   await page.screenshot({path:out+`/billy-idol-${failFirstConnection?'recovered':'fresh'}.png`});
   await page.evaluate(async()=>{const media=IAMQuantumTree.getMantraProgrammeState().media;window.qaProgrammeContext=window.qaMediaContexts.get(media);await window.qaProgrammeContext.suspend()});
   await page.waitForFunction(()=>window.qaProgrammeContext.state==='running'&&IAMSubaudibleMantra.diagnostics().outputVerified);
   const autoRecovered=await page.evaluate(()=>IAMSubaudibleMantra.diagnostics());
   await page.evaluate(async()=>{window.qaBlockedContext=window.qaProgrammeContext;await window.qaProgrammeContext.suspend()});
   await page.waitForTimeout(350);
   const blocked=await page.evaluate(()=>IAMSubaudibleMantra.diagnostics());
   assert.equal(blocked.currentGain,0);assert.equal(blocked.outputVerified,false);assert.equal(blocked.programmeAnalysis.contextState,'suspended');
   await page.locator('.mantra-signal p').click();
   await page.waitForFunction(()=>IAMSubaudibleMantra.diagnostics().outputVerified);
   assert.equal(await page.evaluate(()=>window.qaClaims),claims,'Recovery must reuse the existing media sources');
   report.checks.push({case:failFirstConnection?'Transient first-connection failure':'Fresh playback',initial,autoRecovered,blocked,recovered:await page.evaluate(()=>IAMSubaudibleMantra.diagnostics()),waveformChanged:true});
  }finally{await page.evaluate(()=>{window.IAMSubaudibleMantra?.setEnabled(false);document.querySelectorAll('audio,video').forEach(media=>media.pause())}).catch(()=>{});await context.close()}
 }
 report.passed=true;await fs.writeFile(out+'/recovery.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({passed:true,cases:report.checks.map(c=>c.case),checks:['Fresh TV directly to Mantra without opening Sound','Actual post-gain signal and changing waveform','Missed initial media connection repaired','Suspended context automatically resumed','Blocked output closes; trusted click resumes','Sources are reused, never double claimed']},null,2));
}finally{await browser.close();await server.close()}
