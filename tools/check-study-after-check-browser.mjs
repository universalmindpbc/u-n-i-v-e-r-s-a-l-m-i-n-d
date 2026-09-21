import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const mode=process.argv[2]||'proof',origin='https://staging.universalmind.tv';
// This task tests the user-selected study film, not the random Music Television entry.
const browser=await chromium.launch({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--disable-dev-shm-usage']});
const ordinary=mode==='ordinary',api=ordinary?'api/study.php':'api/study-ending-test.php';
const report={mode,url:origin+'/vogue/iam/'+(ordinary?'study.php?preview=1':'study-ending-test.php'),checks:[],errors:[],endedRequests:0,ordinaryRequests:0};
const record=(text,details)=>{report.checks.push({text,...details});console.log(text,details?JSON.stringify(details):'');};
let page;
try {
 page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',async response=>{if(/\/api\/study(?:-ending-test)?\.php$/.test(response.url())){try{const body=await response.json();console.log('API',response.request().method(),response.url().split('/').at(-1),JSON.stringify({status:response.status(),ending:body.ending_test,id:body.participant?.id,sessions:body.participant?.sessions?.map(s=>({state:s.state})),stream:body.config?.stream_uid,error:body.error}));}catch{}}});
 await page.addInitScript(()=>{
  window.__qa={camera:0,fullscreen:0,exitFullscreen:0,messages:[]};window.addEventListener('message',e=>{if(e.data?.type?.startsWith('study-'))window.__qa.messages.push({type:e.data.type,message:e.data.message});});
  if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=async()=>{window.__qa.camera++;throw new Error('Camera disabled in automated QA');};
  Element.prototype.requestFullscreen=async()=>{window.__qa.fullscreen++;};
  Document.prototype.exitFullscreen=async()=>{window.__qa.exitFullscreen++;};
 });
 await page.route('**/'+api,async route=>{
  let body;try{body=route.request().postDataJSON();}catch{}
  if(body?.action==='exposure.tick'){
   if(body.ended){
    report.endedRequests++;
    if(mode==='retry'&&report.endedRequests===1){await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,state:'experience',exposure_seconds:0})});return;}
    if(mode==='retry'&&report.endedRequests===2){await route.fetch();await route.abort('failed');return;}
   }else report.ordinaryRequests++;
   if(mode==='retry'&&report.ordinaryRequests===1&&!body.ended){const response=await route.fetch();await new Promise(r=>setTimeout(r,3500));await route.fulfill({response});return;}
  }
  await route.continue();
 });
 await page.goto(report.url,{waitUntil:'domcontentloaded'});
 async function state(){return page.evaluate(async url=>await(await fetch(url)).json(),api);}
 async function scan(bpm){
  await page.locator('[data-action="scan"]').click();
  const iframe=page.locator('.study-scan iframe');await iframe.waitFor();
  const frame=await(await iframe.elementHandle()).contentFrame();await frame.waitForSelector('[data-heart-rate-accept]');
  assert.equal(await frame.evaluate(()=>window.__qa.camera),0);
  if(!ordinary)assert.ok(frame.url().includes('ending_test=1'));
  await frame.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/study/shen-bridge.js?v=')));
  await frame.evaluate(async value=>{const moduleUrl=performance.getEntriesByType('resource').find(r=>r.name.includes('/study/shen-bridge.js?v=')).name;const {saveStudyScan}=await import(moduleUrl);await saveStudyScan({measurement_duration_seconds:10,heart_rate_bpm:value});},bpm);
  await page.locator('[data-question="happiness"]').first().waitFor();
 }
 async function answer(q,v){
  await page.locator(`[data-question="${q}"]`).first().waitFor();
  if(q==='text')await page.locator('#self-report').fill(v);else await page.getByRole('radio',{name:`${v*10}%`,exact:true}).check();
  await page.locator('[data-form="answer"] [type="submit"]').click();
 }
 if(ordinary){
  await page.getByRole('heading',{name:'Welcome.',exact:true}).waitFor();
  for(const box of await page.locator('[data-form="consent"] input').all())await box.check();
  await page.locator('[data-form="consent"] [type="submit"]').click();
  await page.getByRole('heading',{name:'Your Heart Check',exact:true}).waitFor();
  await scan(70);
  for(const [q,v]of [['happiness',5],['stress',8],['connection',4],['text','Isolated ordinary preview fixture.']])await answer(q,v);
 }
 await page.locator('.study-exposure iframe').waitFor();
 const player=await(await page.locator('.study-exposure iframe').elementHandle()).contentFrame();
 await page.waitForFunction(()=>window.__qa.messages.some(e=>['study-prepared','study-error'].includes(e.type)),{},{timeout:120000});
 assert.ok(await page.evaluate(()=>window.__qa.messages.some(e=>e.type==='study-prepared')),JSON.stringify(await page.evaluate(()=>window.__qa.messages)));
 await player.locator('[data-television-play]:not([disabled])').waitFor();
 assert.equal(await page.locator('.study-proof-skip, [data-action="proofEnding"], [data-action="proofAfter"]').count(),0);
 assert.equal(await player.evaluate(()=>typeof window.IAMStudyExperience.previewFinal30),'undefined');
 const before=await player.evaluate(()=>{const v=document.querySelector('.adaptive-television-local-video');window.__qa.realEnded=0;v.addEventListener('ended',()=>window.__qa.realEnded++);return {time:v.currentTime,duration:v.duration,paused:v.paused,seeking:v.seeking,ready:v.readyState};});
 const beforeState=await state();
 if(ordinary){assert.equal(before.time,0);assert.equal(beforeState.ending_test,false);record('Ordinary participant preview starts at zero with no proof controls',before);}
 else{
  assert.ok(before.duration>488&&before.duration<489);assert.ok(Math.abs(before.duration-before.time-30)<0.25);assert.equal(before.paused,true);assert.equal(before.seeking,false);assert.ok(before.ready>=2);
  assert.equal(beforeState.ending_test,true);assert.equal(beforeState.participant.sessions[0].before_vitals,null);assert.equal(beforeState.participant.sessions[0].before_report,null);
  record('Separate ending page buffers actual final 30 seconds before native Play; no skip controls or fabricated baseline',before);
 }
 await page.screenshot({path:`/private/tmp/um-study-ending-${mode}-home.png`,animations:'disabled'});
 await player.locator('[data-television-play]').click();
 await player.waitForFunction(time=>{const v=document.querySelector('.adaptive-television-local-video');return !v.paused&&v.currentTime>time+0.5;},before.time,{timeout:45000});
 const playback=await player.evaluate(()=>{const v=document.querySelector('.adaptive-television-local-video');return {time:v.currentTime,duration:v.duration,timer:document.querySelector('.adaptive-television-timecode')?.textContent,locked:document.documentElement.hasAttribute('data-study-navigation-locked')};});
 assert.equal(playback.locked,true);
 await page.screenshot({path:`/private/tmp/um-study-ending-${mode}-playing.png`,animations:'disabled'});
 record('Native Play starts real video and bottom-left timer; navigation locked',playback);
 if(!ordinary){
  await page.getByRole('heading',{name:'Are you ready for an after-check?',exact:true}).waitFor({timeout:65000});
  assert.ok(await player.evaluate(()=>window.__qa.realEnded>=1),'Real HTMLMediaElement ended event required');
  await player.evaluate(()=>{parent.postMessage({type:'study-error',message:'QA late stopped-player error'},location.origin);parent.postMessage({type:'study-paused'},location.origin);});
  await page.waitForTimeout(300);
  const after=await state(),s=after.participant.sessions[0];
  assert.equal(s.state,'after_vitals');assert.ok(!s.preview_exposure_skipped);assert.ok(s.exposure_seconds>27&&s.exposure_seconds<34);
  if(mode==='retry')assert.ok(report.endedRequests>=3);
  assert.equal(await page.locator('.study-exposure').isVisible(),false);
  assert.equal(await player.evaluate(()=>document.querySelector('.adaptive-television-local-video').paused),true);
  assert.equal(await page.evaluate(()=>window.__qa.exitFullscreen),0);
  await page.screenshot({path:`/private/tmp/um-study-ending-${mode}-after.png`,animations:'disabled'});
  record('Natural video end opens after-check; no forced completion or fullscreen exit',{observedExposure:s.exposure_seconds,endedRequests:report.endedRequests});
  await scan(63);record('After-check opens real Heart Check UI and saves a synthetic reading in isolated test storage');
  for(const [q,v]of [['happiness',8],['stress',4],['connection',7],['text','Isolated ending proof fixture.']])await answer(q,v);
  await page.getByRole('button',{name:'See your results',exact:true}).waitFor();
  await page.getByRole('button',{name:'See your results',exact:true}).click();
  await page.getByRole('heading',{name:'Your results',exact:true}).waitFor();
  assert.equal((await state()).participant.sessions[0].state,'complete');
  await player.waitForFunction(()=>!document.documentElement.hasAttribute('data-study-navigation-locked'));
  await page.screenshot({path:`/private/tmp/um-study-ending-${mode}-results.png`,animations:'disabled'});
  record('After surveys, reward display, results and navigation unlock complete');
  const regular=await page.evaluate(async()=>await(await fetch('api/study.php')).json());assert.equal(regular.participant,null);
  const cookies=await page.context().cookies();assert.ok(cookies.some(c=>c.name==='iam_study_ending_test'));assert.ok(cookies.some(c=>c.name==='iam_study'));
  record('Regular participant API remains signed out in same browser; separate test cookie verified');
  if(mode==='proof'){
   const completedId=(await state()).participant.sessions[0].id;
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__qa.messages.some(e=>e.type==='study-prepared'),{},{timeout:120000});
   const fresh=await state();assert.notEqual(fresh.participant.sessions[0].id,completedId);assert.equal(fresh.participant.sessions[0].state,'experience');
   const freshFrame=await(await page.locator('.study-exposure iframe').elementHandle()).contentFrame();
   const freshRemaining=await freshFrame.evaluate(()=>{const v=document.querySelector('.adaptive-television-local-video');return {remaining:v.duration-v.currentTime,paused:v.paused};});
   assert.ok(Math.abs(freshRemaining.remaining-30)<0.25);assert.equal(freshRemaining.paused,true);
   record('Reload creates a fresh final-30-second test without login or extra controls');
  }
 }
 assert.equal(await page.evaluate(()=>window.__qa.camera),0);assert.equal(report.errors.length,0,report.errors.join('\n'));
 report.at=new Date().toISOString();
 await fs.writeFile(`/private/tmp/um-study-ending-${mode}-qa.json`,JSON.stringify(report,null,2)+'\n');
} catch(error) {
 console.error('QA failure',error);if(page){console.error(await page.evaluate(()=>({status:document.querySelector('#study-status')?.textContent,messages:window.__qa?.messages.filter(m=>m.type!=='study-tick')})).catch(()=>null));await page.screenshot({path:`/private/tmp/um-study-ending-${mode}-failure.png`}).catch(()=>{});}throw error;
} finally {
 if(page)await page.evaluate(()=>{for(const f of document.querySelectorAll('iframe'))f.contentWindow.postMessage({type:'study-stop'},location.origin);}).catch(()=>{});
 await browser.close();
}
