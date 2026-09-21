import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const mode=process.argv[2]||'proof',origin='https://staging.universalmind.tv';
const browser=await chromium.launch({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--disable-dev-shm-usage']});
const report={mode,url:origin+'/vogue/iam/study.php?preview=1',checks:[],errors:[],endedRequests:0,ordinaryRequests:0};
const record=(text,details)=>{report.checks.push({text,...details});console.log(text,details?JSON.stringify(details):'');};
let page;
try {
 page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{
  window.__qa={camera:0,fullscreen:0,exitFullscreen:0,messages:[]};window.addEventListener('message',e=>{if(e.data?.type?.startsWith('study-'))window.__qa.messages.push({type:e.data.type,message:e.data.message});});
  if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=async()=>{window.__qa.camera++;throw new Error('Camera disabled in automated QA');};
  Element.prototype.requestFullscreen=async()=>{window.__qa.fullscreen++;};
  Document.prototype.exitFullscreen=async()=>{window.__qa.exitFullscreen++;};
 });
 await page.route('**/api/study.php',async route=>{
  let body;try{body=route.request().postDataJSON();}catch{}
  if(body?.action==='exposure.tick'){
   if(body.ended){
    report.endedRequests++;
    if(mode==='retry'&&report.endedRequests===1){
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,state:'experience',exposure_seconds:0})});return;
    }
    if(mode==='retry'&&report.endedRequests===2){await route.fetch();await route.abort('failed');return;}
   }else report.ordinaryRequests++;
   if(mode==='retry'&&report.ordinaryRequests===1&&!body.ended){const response=await route.fetch();await new Promise(r=>setTimeout(r,3500));await route.fulfill({response});return;}
  }
  await route.continue();
 });
 await page.goto(report.url,{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'Welcome.',exact:true}).waitFor();
 for(const box of await page.locator('[data-form="consent"] input').all())await box.check();
 await page.locator('[data-form="consent"] [type="submit"]').click();
 await page.getByRole('heading',{name:'Your Heart Check',exact:true}).waitFor();
 async function scan(bpm){
  await page.locator('[data-action="scan"]').click();
  const iframe=page.locator('.study-scan iframe');await iframe.waitFor();
  const frame=await(await iframe.elementHandle()).contentFrame();await frame.waitForSelector('[data-heart-rate-accept]');
  assert.equal(await frame.evaluate(()=>window.__qa.camera),0);
  await frame.evaluate(async value=>{const {saveStudyScan}=await import('./study/shen-bridge.js');await saveStudyScan({measurement_duration_seconds:10,heart_rate_bpm:value});},bpm);
  await page.locator('[data-question="happiness"]').first().waitFor();
 }
 async function answer(q,v){
  await page.locator(`[data-question="${q}"]`).first().waitFor();
  if(q==='text')await page.locator('#self-report').fill(v);else await page.getByRole('radio',{name:`${v*10}%`,exact:true}).check();
  await page.locator('[data-form="answer"] [type="submit"]').click();
 }
 await scan(70);
 for(const [q,v]of [['happiness',5],['stress',8],['connection',4],['text','Isolated proofing fixture before.']])await answer(q,v);
 await page.locator('.study-exposure iframe').waitFor();
 const player=await(await page.locator('.study-exposure iframe').elementHandle()).contentFrame();
 await page.waitForFunction(()=>window.__qa.messages.some(e=>e.type==='study-prepared'),{},{timeout:120000});
 await player.locator('[data-television-play]:not([disabled])').waitFor();
 await page.locator('[data-action="proofEnding"]').waitFor();
 record('Preview control is available before playback');
 if(mode==='layout'){
  const box=await page.locator('[data-action="proofEnding"]').boundingBox();assert.ok(box.y>=20&&box.y<70);
  await page.screenshot({path:'/private/tmp/um-study-after-check-proof-control.png',animations:'disabled'});
  record('Proof control is at the top right, clear of the native planet, with no playback started',{box});
 }else{
 if(mode==='proof'){
  await page.screenshot({path:'/private/tmp/um-study-after-check-proof-control.png',animations:'disabled'});
  await page.locator('[data-action="proofEnding"]').click();
  await player.waitForFunction(()=>{const v=document.querySelector('.adaptive-television-local-video');return v.currentTime>v.duration-31;});
  const remaining=await player.evaluate(()=>{const v=document.querySelector('.adaptive-television-local-video');return v.duration-v.currentTime;});assert.ok(remaining>27&&remaining<=30);record('Proof button seeks to the real final 30 seconds; normal playback continues',{remaining});
 } else {
  await player.locator('[data-television-play]').click();
  await player.waitForFunction(()=>document.querySelector('.adaptive-television-local-video')?.currentTime>1.5,{},{timeout:45000});
  const timing=await player.evaluate(()=>{const v=document.querySelector('.adaptive-television-local-video');return {time:v.currentTime,duration:v.duration,paused:v.paused};});
  assert.ok(timing.duration>488&&timing.duration<489);record('Research video playing with real duration',timing);
  if(mode==='retry')await player.evaluate(()=>{const v=document.querySelector('.adaptive-television-local-video');v.currentTime=v.duration-0.3;});
  else record('Running the complete 8:08 video without seeking');
 }
 let progress;
 if(mode==='full')progress=setInterval(async()=>{try{console.log('Full-run progress',await player.evaluate(()=>document.querySelector('.adaptive-television-timecode')?.textContent));}catch{}},45000);
 try{await page.getByRole('heading',{name:'Are you ready for an after-check?',exact:true}).waitFor({timeout:mode==='full'?600000:60000});}finally{clearInterval(progress);}
 await player.evaluate(()=>{parent.postMessage({type:'study-error',message:'QA late stopped-player error'},location.origin);parent.postMessage({type:'study-paused'},location.origin);});
 await page.waitForTimeout(300);
 assert.equal(await page.locator('[data-action="proofAfter"]').count(),0);
 const after=await page.evaluate(async()=>await(await fetch('api/study.php')).json());
 assert.equal(after.preview,true);assert.equal(after.participant.sessions[0].state,'after_vitals');
 const s=after.participant.sessions[0];
 if(mode==='proof'){assert.ok(!s.preview_exposure_skipped);assert.ok(s.exposure_seconds>27&&s.exposure_seconds<34);assert.equal(report.endedRequests,1);}
 if(mode==='retry'){assert.ok(report.endedRequests>=3);assert.ok(s.exposure_seconds<8);}
 if(mode==='full'){assert.ok(s.exposure_seconds>470);assert.ok(s.video_duration_seconds>488);assert.ok(!s.preview_exposure_skipped);}
 await page.screenshot({path:`/private/tmp/um-study-after-check-${mode}-transition.png`,animations:'disabled'});
 console.log('Transition layout',await page.evaluate(()=>({mode:document.body.dataset.studyState,messages:window.__qa.messages.filter(e=>e.type!=='study-tick'),status:document.querySelector('#study-status')?.textContent,exposures:[...document.querySelectorAll('.study-exposure')].map(e=>({hidden:e.hidden,attr:e.getAttribute('hidden'),display:getComputedStyle(e).display,classes:e.className})),heading:document.querySelector('h1')?.textContent,cover:document.elementFromPoint(innerWidth/2,innerHeight/2)?.outerHTML?.slice(0,150)})));
 assert.equal(await page.locator('.study-exposure').isVisible(),false);
 assert.equal(await player.evaluate(()=>!document.querySelector('.adaptive-television-local-video')||document.querySelector('.adaptive-television-local-video').paused),true);
 assert.equal(await page.evaluate(()=>window.__qa.exitFullscreen),0);
 await page.screenshot({path:`/private/tmp/um-study-after-check-${mode}-after.png`,animations:'disabled'});
 record('Natural ending shows after-check; video paused; no fullscreen-exit request',{observedExposure:s.exposure_seconds,skipped:!!s.preview_exposure_skipped,endedRequests:report.endedRequests});
 await scan(63);record('After-check opens the embedded Heart Check and saves the isolated result');
 for(const [q,v]of [['happiness',8],['stress',4],['connection',7],['text','Isolated proofing fixture after.']])await answer(q,v);
 await page.getByRole('button',{name:'See your results',exact:true}).waitFor();
 await page.getByRole('button',{name:'See your results',exact:true}).click();
 await page.getByRole('heading',{name:'Your results',exact:true}).waitFor();
 const final=await page.evaluate(async()=>await(await fetch('api/study.php')).json());
 assert.equal(final.participant.sessions[0].state,'complete');
 await player.waitForFunction(()=>!document.documentElement.hasAttribute('data-study-navigation-locked'));
 assert.equal(await page.locator('[data-action="proofEnding"]').isVisible(),false);
 assert.equal(await page.evaluate(()=>window.__qa.camera),0);
 assert.equal(report.errors.length,0,report.errors.join('\n'));
 await page.screenshot({path:`/private/tmp/um-study-after-check-${mode}-results.png`,animations:'disabled'});
 record('Tail-end surveys, reward, biometrics results and navigation unlock complete');
 }
 report.at=new Date().toISOString();
 await fs.writeFile(`/private/tmp/um-study-after-check-${mode}-qa.json`,JSON.stringify(report,null,2)+'\n');
} finally {
 if(page)await page.evaluate(()=>{for(const f of document.querySelectorAll('iframe'))f.contentWindow.postMessage({type:'study-stop'},location.origin);}).catch(()=>{});
 await browser.close();
}
