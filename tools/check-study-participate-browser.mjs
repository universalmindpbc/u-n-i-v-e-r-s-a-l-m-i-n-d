import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const origin='https://staging.universalmind.tv',base=origin+'/vogue/iam/';
const local=process.argv.includes('--local');
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={at:new Date().toISOString(),mode:local?'local-candidate-with-staging-preview':'live-staging',processMuted:true,nativeFullscreen:false,camera:false,checks:[]};
try{
 for(const priorState of ['fresh','briefing','experience']){
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
  const page=await context.newPage();const errors=[],studyRequests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',req=>{if(req.url()===base+'api/study.php'&&req.method()==='POST')studyRequests.push(req.postDataJSON().action);});
  await page.addInitScript(()=>{
   Element.prototype.requestFullscreen=async()=>{};Element.prototype.webkitRequestFullscreen=async()=>{};HTMLVideoElement.prototype.webkitEnterFullscreen=()=>{};
   if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=async()=>{throw Error('Camera disabled in QA');};
  });
  if(local){
   await page.route(origin+'/study',route=>route.fulfill({status:302,headers:{location:base+'study.php?login=1'}}));
   await page.route('**/study/app.js?*',async route=>route.fulfill({contentType:'text/javascript',body:await fs.readFile(fileURLToPath(new URL('../i  a m/study/app.js',import.meta.url)))}));
  }
  let expectedSession=null;
  if(priorState!=='fresh'){
   await page.goto(base+'study.php?preview=1');await page.locator('[data-form="consent"]').waitFor();
   if(priorState==='experience')expectedSession=await page.evaluate(async()=>{
    const {request}=await import([...document.scripts].find(s=>s.src.includes('/study/app.js')).src);
    const state=await request();await request('consent',{version:state.protocol.version,adult_woman:true,equipment:true,participation:true,research_data:true});
    const {session_id}=await request('session.start');await request('vitals',{session_id,values:{unavailable_reason:'preview'}});
    await request('report',{session_id,happiness:5,stress:5,connection:5,text:'Synthetic navigation regression.'});
    await request('reflection.complete',{session_id,version:state.protocol.pre_music_reflection.version,choice:'skipped'});
    return session_id;
   });
  }
  await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.dataset.adaptiveSelectionSource==='no_checkin_random');
  await page.locator('[data-television-play]').click({timeout:60000});
  await page.waitForFunction(()=>document.querySelector('.adaptive-television-local-video')?.currentTime>.2,null,{timeout:60000});
  const played=await page.locator('.adaptive-television-local-video').evaluate(v=>v.currentTime);
  const before=studyRequests.length;
  await page.locator('[data-nav-open]:visible').last().click();await page.locator('[data-nav-item="research"]:visible').click();await page.locator('[data-nav-subitem="research-participate"]:visible').click();
  await page.waitForURL(/study\.php/);await page.locator('[data-form="login"]').waitFor();
  assert.equal(await page.locator('body').getAttribute('data-study-state'),'login');
  assert.equal(page.frames().length,1,'Saved experience must not mount before re-authentication');
  assert.equal(new URL(page.url()).searchParams.has('login'),false,'Reload must not repeat the entry logout');
  assert.deepEqual(studyRequests.slice(before),['logout']);
  const gate=await page.evaluate(async()=>await(await fetch('api/study.php')).json());
  assert.equal(gate.participant,null);assert.equal(gate.preview,false);
  await page.getByLabel('password',{exact:true}).fill('invalid-navigation-regression');
  await page.locator('[data-form="login"] button').click();
  await page.getByRole('status').filter({hasText:'That password was not recognised.'}).waitFor();
  assert.equal(page.frames().length,1);assert.equal(await page.locator('[data-form="login"]').isVisible(),true);
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-form="login"]').waitFor();
  assert.equal(studyRequests.slice(before).filter(a=>a==='logout').length,1);
  assert.deepEqual(errors,[]);
  report.checks.push({priorState,expectedSession:!!expectedSession,realVideoSeconds:played,loginVisible:true,participant:null,noStudyPlayerBeforeLogin:true,invalidPasswordRejected:true,reloadDoesNotRepeatLogout:true,errors});
  console.log('Passed: '+priorState+' → music playback → Research → Participate → password gate');
  await context.close();
 }
 report.passed=true;
 console.log(JSON.stringify(report,null,2));
 if(process.env.STUDY_PARTICIPATE_REPORT)await fs.writeFile(process.env.STUDY_PARTICIPATE_REPORT,JSON.stringify(report,null,2)+'\n');
}finally{
 for(const p of browser.contexts().flatMap(c=>c.pages()))await p.evaluate(()=>{document.querySelectorAll('video,audio').forEach(m=>m.pause());for(const f of document.querySelectorAll('iframe'))f.contentWindow.postMessage({type:'study-stop'},location.origin);}).catch(()=>{});
 await browser.close();await server.close();
}
