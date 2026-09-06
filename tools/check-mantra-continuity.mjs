import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.MANTRA_QA_DIR||'/private/tmp/um-mantra-continuity';await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--mute-audio']});assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());const report={mutedProcess:true,tracks:[],trackReason:'Flume and Caroline are the reported interruptions; fixed tracks are regression fixtures only.'};
try{for(const track of ['flume-tiny-cities','caroline-polachek-welcome-to-my-island']){
 const page=await browser.newPage({viewport:{width:1470,height:956},userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.2 Safari/605.1.15'});page.setDefaultTimeout(20000);
 const requests=[],errors=[];let releaseAsset;const heldAsset=new Promise(resolve=>{releaseAsset=resolve});
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(Error('QA no fullscreen'));HTMLVideoElement.prototype.webkitEnterFullscreen=Element.prototype.requestFullscreen;
 if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=()=>Promise.reject(Error('QA no microphone'));
 window.qaMedia=new Set();window.qaStates=[];window.qaErrors=[];const play=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(){qaMedia.add(this);return play.call(this)};
 window.qaMantra=()=>[...qaMedia].find(m=>m instanceof HTMLAudioElement&&m.src.startsWith('blob:')&&m.duration>334&&m.duration<335);
 let before='';setInterval(()=>{const d=window.IAMSubaudibleMantra?.diagnostics();if(d&&d.status!==before){before=d.status;qaStates.push({at:performance.now(),status:d.status,playing:d.playing,time:d.currentTime,gain:d.currentGain})}},20);
 });
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/quantum-tree-mantra-v1.m4a',async route=>{requests.push({range:route.request().headers().range||null});await heldAsset;return route.continue()});
 if(process.env.MANTRA_QA_LOCAL==='1')for(const file of ['index.html','script.js','cloudflare-stream-controller.js','adaptive-sound/mantra-v1.js'])await page.route('**/'+file+'*',route=>route.fulfill({path:path.join(root,'i  a m',file),contentType:file.endsWith('.html')?'text/html':'text/javascript'}));
 const diag=()=>page.evaluate(()=>IAMSubaudibleMantra.diagnostics());
 try{
 await page.goto('https://staging.universalmind.tv/vogue/iam/index.html?selected_track_id='+track,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.IAMSubaudibleMantra);
 await page.locator('[data-television-play]').click();await page.waitForTimeout(300);releaseAsset();
 await page.waitForFunction(()=>document.body.classList.contains('television-room-open')&&!document.body.classList.contains('television-wallet-settling')&&!document.body.classList.contains('television-wallet-pointer-locked'));
 await page.mouse.move(700,450);await page.locator('[data-reaction-wallet]').hover();if(await page.locator('[data-reaction-wallet]').getAttribute('data-wallet-view')!=='video')await page.locator('[data-wallet-category=video]').click();await page.locator('[data-video-mantra-open]').click();
 await page.waitForFunction(()=>IAMSubaudibleMantra.diagnostics().outputVerified,null,{timeout:30000});
 const initial=await diag();assert.equal(initial.delivery,'complete_blob');assert.ok(initial.assetBytes>7_000_000);assert.equal(requests.length,1);assert.equal(requests[0].range,null);
 await page.waitForFunction(()=>document.querySelector('[data-mantra-signal-state]').textContent==='Following music');
 const start=initial.currentTime;
 await page.evaluate(()=>{const v=IAMQuantumTree.getMantraProgrammeState().media;v.dispatchEvent(new Event('stalled'));v.dispatchEvent(new Event('waiting'));});
 await page.waitForTimeout(600);const flagged=await diag();assert.equal(flagged.playing,true);assert.ok(flagged.currentTime>start+.4);assert.equal(flagged.outputVerified,true);assert.equal(flagged.status,'mixing');
 await page.evaluate(()=>{const v=IAMQuantumTree.getMantraProgrammeState().media;v.dispatchEvent(new Event('playing'));Object.defineProperty(v,'readyState',{configurable:true,get:()=>2});});await page.waitForTimeout(350);const currentData=await diag();assert.equal(currentData.playing,true);assert.equal(currentData.outputVerified,true);
 const decodedCurrentData=await page.evaluate(()=>IAMStreamController.getDecodedAudioLevel(IAMQuantumTree.getMantraProgrammeState().media));assert.ok(Number.isFinite(decodedCurrentData)&&decodedCurrentData>0, "Use the decoded HLS waveform with current audio data, without relying on Chromium fallback");
 await page.evaluate(()=>{const v=IAMQuantumTree.getMantraProgrammeState().media;delete v.readyState;window.qaFixedClock=v.currentTime;Object.defineProperty(v,'currentTime',{configurable:true,get:()=>qaFixedClock});});
 await page.waitForTimeout(260);const stalled=await diag();assert.equal(stalled.currentGain,0);assert.equal(stalled.playing,true);await page.waitForFunction(()=>document.querySelector('[data-mantra-signal-state]').textContent==='Following music');
 await page.evaluate(()=>{delete IAMQuantumTree.getMantraProgrammeState().media.currentTime;});await page.waitForFunction(()=>IAMSubaudibleMantra.diagnostics().outputVerified);
 await page.evaluate(()=>{const a=qaMantra();a.currentTime=a.duration-.5});await page.waitForTimeout(1400);const loop=await diag();assert.ok(loop.currentTime<3);assert.equal(loop.playing,true);assert.equal(requests.length,1);
 await page.waitForTimeout(Number(process.env.CONTINUITY_MS||90000));const final=await diag();assert.equal(final.outputVerified,true);assert.equal(requests.length,1);
 const states=await page.evaluate(()=>qaStates);assert.deepEqual(errors,[]);
 report.tracks.push({track,initial,flagged,currentData,decodedCurrentData,stalled,loop,final,requests,states,errors});await page.screenshot({path:out+'/'+track+'.png'});console.log(track+': complete Blob, transient flags, genuine stall ducking, loop and continuous playback passed.');
 }finally{releaseAsset();await page.evaluate(()=>{IAMSubaudibleMantra?.setEnabled(false);IAMQuantumTree?.setEnabled(false,{persist:false});qaMedia.forEach(m=>m.pause())}).catch(()=>{});await page.close()}
}report.passed=true;}finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();await server.close();}
