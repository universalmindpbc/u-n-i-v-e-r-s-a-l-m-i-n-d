import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const protocol=JSON.parse(await fs.readFile(path.join(root,'i  a m/study/protocol-v1.json'),'utf8'));
const base='https://staging.universalmind.tv/vogue/iam/';
const browser=await chromium.launch({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--disable-dev-shm-usage']});
const report={url:base+'study.php?preview=1',checks:[],errors:[],safety:{audio:'--mute-audio',camera:false,nativeFullscreen:false,previewRecordsOnly:true}};
const record=(check)=>{report.checks.push(check);console.log(check);};
let page;
try{
 for(const scenario of ['desktop','mobile','reduced']){
  const context=await browser.newContext({viewport:scenario==='desktop'?{width:1440,height:900}:{width:390,height:844},reducedMotion:scenario==='reduced'?'reduce':'no-preference'});
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.addInitScript(()=>{
   window.__qa={camera:0,fullscreen:0};
   if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=async()=>{window.__qa.camera++;throw new Error('No device capture in QA');};
   Element.prototype.requestFullscreen=async()=>{window.__qa.fullscreen++;};Element.prototype.webkitRequestFullscreen=async()=>{window.__qa.fullscreen++;};
  });
  await page.goto(base+'study.php?preview=1',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Welcome to I AM.',exact:true}).waitFor();
  const state=()=>page.evaluate(async()=>await(await fetch('api/study.php')).json());
  const fresh=await state();assert.equal(fresh.participant.consent,null);assert.equal(fresh.participant.sessions.length,0);
  assert.equal(await page.locator('iframe,[data-form="consent"],.study-reflection input,.study-reflection textarea').count(),0);
  assert.equal(await page.locator('[data-reflection-skip]').isVisible(),false);
  if(scenario==='desktop'){
   await page.waitForFunction(()=>document.querySelectorAll('.reflection-word.is-visible').length>0);
   assert.ok(await page.evaluate(()=>document.querySelectorAll('.reflection-word.is-visible').length<document.querySelectorAll('.reflection-word').length));
   await page.screenshot({path:'/private/tmp/um-welcome-staging-typing.png'});
   // An unfinished welcome can be reopened without manufacturing completion.
   await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Welcome to I AM.',exact:true}).waitFor();
   assert.equal((await state()).participant.welcome,undefined);
   record('Welcome animates before consent; an unfinished introduction remains available on reload');
  }
  const next=page.locator('[data-reflection-next]');
  for(let i=0;i<protocol.onboarding_welcome.messages.length;i++){
   await page.locator(`[data-reflection-message="${i+1}"]`).waitFor();
   if(scenario==='reduced')assert.equal(await page.locator('.is-typing').count(),0);
   else if(await next.textContent()==='Show message')await next.click();
   assert.equal(await page.locator(`[data-reflection-message="${i+1}"] .reflection-visual`).textContent(),protocol.onboarding_welcome.messages[i].text);
   if(i<protocol.onboarding_welcome.messages.length-1)await next.press('Enter');
  }
  assert.equal(await next.textContent(),'Continue to briefing');
  await page.waitForFunction(()=>[...document.querySelectorAll('.reflection-word')].every(w=>getComputedStyle(w).opacity==='1'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const rect=await next.boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=(scenario==='desktop'?900:844));
  await page.screenshot({path:`/private/tmp/um-welcome-staging-${scenario}.png`});
  record(scenario+': all six approved messages match exactly, keyboard Continue works, and the final button fits the viewport');
  if(scenario==='desktop'){
   let fail=true;
   await page.route('**/api/study.php',async route=>{
    let payload;try{payload=route.request().postDataJSON();}catch{}
    if(fail&&payload?.action==='welcome.complete'){fail=false;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Please try again.'})});return;}
    await route.continue();
   });
   await next.click();await page.getByRole('alert').filter({hasText:'Please try again.'}).waitFor();
   assert.equal(await next.isEnabled(),true);assert.equal((await state()).participant.welcome,undefined);
   record('Failed save preserves the welcome and enables retry without claiming completion');
  }
  await next.click();await page.getByRole('heading',{name:'Welcome.',exact:true}).waitFor();
  const saved=await state();assert.equal(saved.participant.welcome.version,protocol.onboarding_welcome.version);
  assert.equal(saved.participant.consent,null);assert.equal(saved.participant.sessions.length,0);
  assert.equal(await page.locator('[data-requirements]').textContent(),protocol.requirements);
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-form="consent"]').waitFor();
  assert.equal(await page.getByRole('heading',{name:'Welcome to I AM.',exact:true}).count(),0);
  assert.deepEqual((await state()).participant.welcome,saved.participant.welcome);
  for(const box of await page.locator('[data-form="consent"] input').all())await box.check();
  await page.locator('[data-form="consent"] [type="submit"]').click();
  await page.getByRole('heading',{name:'Your Heart Check',exact:true}).waitFor();
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Your Heart Check',exact:true}).waitFor();
  assert.equal(await page.locator('.study-reflection').count(),0);
  assert.equal((await state()).participant.sessions[0].state,'before_vitals');
  assert.deepEqual(await page.evaluate(()=>window.__qa),{camera:0,fullscreen:0});
  record(scenario+': completion persists once, practical briefing and consent remain explicit, and returning participants resume their study');
  await context.close();page=null;
 }
 assert.deepEqual(report.errors,[]);report.at=new Date().toISOString();report.all_browser_sessions_closed=true;
 await fs.writeFile('/private/tmp/um-welcome-staging-qa.json',JSON.stringify(report,null,2)+'\n');
} catch(e){if(page)await page.screenshot({path:'/private/tmp/um-welcome-failure.png'}).catch(()=>{});throw e;}
finally{if(page)await page.context().close();await browser.close();}
