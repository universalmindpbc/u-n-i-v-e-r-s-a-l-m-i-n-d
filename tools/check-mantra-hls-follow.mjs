import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,webkit} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const useWebKit=process.env.MANTRA_BROWSER==='webkit';
if(useWebKit&&process.env.APPROVED_WEBKIT_PLAYBACK!=='1')throw Error('Fresh explicit approval is required for this potentially audible WebKit playback test.');
let server;
const browser=useWebKit?await webkit.launch({headless:true,executablePath:process.env.WEBKIT_EXECUTABLE||'/private/tmp/um-wallet-hover-qa/browsers/webkit-2336/pw_run.sh'}):await (async()=>{
 server=await chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--mute-audio']});
 assert.ok(server.process().spawnargs.includes('--mute-audio'));return chromium.connect(server.wsEndpoint());
})();
const page=await browser.newPage({viewport:{width:1470,height:956},...(!useWebKit?{userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.2 Safari/605.1.15'}:{})});
const out=process.env.MANTRA_QA_DIR||'/private/tmp/um-mantra-hls-follow';await fs.mkdir(out,{recursive:true});
const report={browser:useWebKit?'WebKit':'Process-muted Chromium exercising Safari decode path',trackReason:'Billy Idol is the user-reported failure; the generic proof URL remains unparameterized.',samples:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(Error('QA disables fullscreen'));HTMLVideoElement.prototype.webkitEnterFullscreen=Element.prototype.requestFullscreen;if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=()=>Promise.reject(Error('QA disables microphone'))});
const sample=()=>page.evaluate(()=>{const programme=IAMQuantumTree.getMantraProgrammeState();const media=programme.media;return{quantum:IAMQuantumTree.diagnostics(),mantra:IAMSubaudibleMantra.diagnostics(),decoded:media?IAMStreamController.getDecodedAudioLevel(media):null,time:media?.currentTime,analysis:media?.dataset.streamAudioAnalysis,analysisError:media?.dataset.streamAudioAnalysisError}});
try{
 if(process.env.MANTRA_QA_LOCAL==='1')for(const file of ['index.html','emdr-shader.js','cloudflare-stream-controller.js','adaptive-environment-television.js','adaptive-sound/mantra-policy-v1.js','adaptive-sound/mantra-v1.js'])await page.route('**/'+file+'*',route=>route.fulfill({path:path.join(root,'i  a m',file),contentType:file.endsWith('.html')?'text/html':'text/javascript'}));
 await page.goto('https://staging.universalmind.tv/vogue/iam/index.html?selected_track_id=billy-idol-eyes-without-a-face',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.IAMSubaudibleMantra);
 await page.locator('[data-television-play]').click();
 await page.waitForFunction(()=>document.body.classList.contains('television-room-open')&&!document.body.classList.contains('television-wallet-settling')&&!document.body.classList.contains('television-wallet-pointer-locked'));
 await page.mouse.move(700,450);await page.locator('[data-reaction-wallet]').hover();
 if(await page.locator('[data-reaction-wallet]').getAttribute('data-wallet-view')!=='video')await page.locator('[data-wallet-category=video]').click();
 await page.locator('[data-video-mantra-open]').click();
 await page.waitForFunction(()=>IAMSubaudibleMantra.diagnostics().outputVerified,null,{timeout:30000});
 for(let i=0;i<60;i++){await page.waitForTimeout(200);report.samples.push(await sample());}
 assert.ok(report.samples.filter(s=>s.decoded>0).length>50,'Shared HLS measurement across multiple fragments');
 assert.ok(report.samples.filter(s=>s.mantra.outputVerified).length>50,'Actual post-gain mantra signal');
 assert.ok(report.samples.every(s=>Math.abs(s.mantra.targetGain-s.mantra.quantumGain/3)<1e-10),'Exactly one-third of the sampled Quantum Tree gain');
 assert.ok(report.samples.at(-1).time-report.samples[0].time>10);
 const wave=await page.locator('[data-mantra-signal-wave]').evaluate(c=>c.toDataURL());await page.waitForTimeout(200);
 assert.notEqual(await page.locator('[data-mantra-signal-wave]').evaluate(c=>c.toDataURL()),wave);
 await page.screenshot({path:out+'/mantra-signal.png'});
 await page.evaluate(()=>{IAMQuantumTree.getMantraProgrammeState().media.volume=.05});await page.waitForTimeout(1400);report.fade=await sample();
 assert.ok(report.fade.mantra.currentGain<report.samples.at(-1).mantra.currentGain);
 await page.evaluate(()=>{document.querySelector('.adaptive-television-local-video').volume=1});await page.waitForFunction(()=>IAMSubaudibleMantra.diagnostics().outputVerified);
 await page.evaluate(()=>document.querySelector('.adaptive-television-local-video').pause());await page.waitForFunction(()=>IAMSubaudibleMantra.diagnostics().currentGain===0);report.paused=await sample();
 assert.equal(report.paused.mantra.outputVerified,false);assert.deepEqual(report.errors,[]);report.passed=true;
}finally{report.last=await sample().catch(()=>null);await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await page.evaluate(()=>{window.IAMSubaudibleMantra?.setEnabled(false);window.IAMQuantumTree?.setEnabled(false,{persist:false});document.querySelectorAll('audio,video').forEach(m=>m.pause())}).catch(()=>{});await browser.close();await server?.close();}
console.log(JSON.stringify({passed:report.passed,browser:report.browser,samples:report.samples.length,nonzeroHls:report.samples.filter(s=>s.decoded>0).length,measuredMantra:report.samples.filter(s=>s.mantra.outputVerified).length,errors:report.errors},null,2));
