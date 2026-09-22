import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://staging.universalmind.tv',base=origin+'/vogue/iam/';
const local=process.argv.includes('--local'),protocol=JSON.parse(await fs.readFile(path.join(root,'i  a m/study/protocol-v1.json'),'utf8'));
const browser=await chromium.launch({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--disable-dev-shm-usage']});
const report={mode:local?'local-module':'staging-journey',checks:[],errors:[],safety:{audio:'--mute-audio',nativeFullscreen:false,camera:false,syntheticPreviewOnly:true}};
let page;
const record=(check,details={})=>{report.checks.push({check,...details});console.log(check);};
async function clean(){if(page){await page.evaluate(()=>{for(const f of document.querySelectorAll('iframe'))f.contentWindow?.postMessage({type:'study-stop'},location.origin);for(const m of document.querySelectorAll('video,audio'))m.pause();}).catch(()=>{});await page.context().close();page=null;}}
try{
 for(const scenario of ['read','skip','reduced']){
  const context=await browser.newContext({viewport:scenario==='read'?{width:1440,height:900}:{width:390,height:844},reducedMotion:scenario==='reduced'?'reduce':'no-preference'});
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.addInitScript(()=>{
   window.__qa={camera:0,fullscreen:0,messages:[]};window.addEventListener('message',event=>{if(event.data?.type?.startsWith('study-'))window.__qa.messages.push({type:event.data.type,message:event.data.message});});
   if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=async()=>{window.__qa.camera++;throw new Error('No camera in QA');};
   Element.prototype.requestFullscreen=async()=>{window.__qa.fullscreen++;};Element.prototype.webkitRequestFullscreen=async()=>{window.__qa.fullscreen++;};
   Document.prototype.exitFullscreen=async()=>{};
  });
  if(local){
   await page.route(base+'**',async route=>{
    const url=new URL(route.request().url()),relative=decodeURIComponent(url.pathname.slice('/vogue/iam/'.length));
    if(relative==='study.php'){
     const css=await fs.readFile(path.join(root,'i  a m/study/style.css'),'utf8');
     await route.fulfill({contentType:'text/html',body:`<html><head><meta charset="utf-8"><base href="${base}"><style>${css}</style><link rel="stylesheet" href="study/reflection.css"></head><body class="study-page" data-study-state="reflection"><main id="study-app"></main><script type="module">import {mountReflection} from './study/reflection.js';window.__choices=[];window.__reflection=mountReflection(document.querySelector('main'),{script:${JSON.stringify(protocol.pre_music_reflection)},onFinish:async choice=>{if(window.__fail){window.__fail=false;throw new Error('Please try again.');}window.__choices.push(choice);window.__reflection.destroy();}});</script></body></html>`});
    }else if(['study/reflection.js','study/reflection.css'].includes(relative))await route.fulfill({contentType:relative.endsWith('.js')?'text/javascript':'text/css',body:await fs.readFile(path.join(root,'i  a m',relative))});
    else await route.fulfill({status:204,body:''});
   });
  }
  await page.goto(base+'study.php'+(local?'':'?preview=1'),{waitUntil:'domcontentloaded'});
  async function state(){return page.evaluate(async()=>await(await fetch('api/study.php')).json());}
  if(!local){
   await page.getByRole('heading',{name:'Welcome.',exact:true}).waitFor();
   for(const box of await page.locator('[data-form="consent"] input').all())await box.check();
   await page.locator('[data-form="consent"] [type="submit"]').click();
   await page.getByRole('heading',{name:'Your Heart Check',exact:true}).waitFor();
   assert.equal(await page.locator('.study-reflection').count(),0);
   // Synthetic measurement in the server's separate staging preview store; no camera capture.
   await page.evaluate(async()=>{const moduleUrl=performance.getEntriesByType('resource').find(r=>/\/study\/app\.js\?/.test(r.name)).name;const {request}=await import(moduleUrl);const s=await request();await request('vitals',{session_id:s.participant.sessions.at(-1).id,values:{unavailable_reason:'preview'}});});
   await page.reload({waitUntil:'domcontentloaded'});
   for(const [q,v]of [['happiness',5],['stress',7],['connection',4],['text','Synthetic reflection QA baseline.']]){
    await page.locator(`[data-question="${q}"]`).first().waitFor();assert.equal(await page.locator('.study-reflection').count(),0);
    if(q==='text')await page.locator('#self-report').fill(v);else await page.getByRole('radio',{name:`${v*10}%`,exact:true}).locator('..').click();
    await page.locator('[data-form="answer"] [type="submit"]').click();
   }
  }
  await page.locator('.study-reflection').waitFor();
  const next=page.locator('[data-reflection-next]');
  if(!local){
   const s=(await state()).participant.sessions.at(-1);assert.equal(s.exposure_seconds,0);assert.equal(s.before_report.text,'Synthetic reflection QA baseline.');
   assert.equal(await page.locator('.study-exposure').isVisible(),false);assert.equal(await page.evaluate(()=>window.__qa.fullscreen),0);
   record(scenario+': reflection appears only after saved baseline, with player hidden and zero exposure');
  }
  if(scenario==='read'){
   await page.waitForFunction(()=>document.querySelectorAll('.reflection-word.is-visible').length>0);
   const words=await page.evaluate(()=>({all:document.querySelectorAll('.reflection-word').length,visible:document.querySelectorAll('.reflection-word.is-visible').length}));
   assert.ok(words.visible<words.all);record('Visible text advances progressively');
   await page.screenshot({path:'/private/tmp/um-reflection-'+(local?'local':'staging')+'-typing.png'});
  }
  if(scenario!=='skip'){
   for(let i=0;i<4;i++){
    await page.locator(`[data-reflection-message="${i+1}"]`).waitFor();
    if(scenario==='reduced')assert.equal(await page.locator('.is-typing').count(),0);
    else if(await next.textContent()==='Show message')await next.click();
    const message=protocol.pre_music_reflection.messages[i];
    const visible=await page.locator(`[data-reflection-message="${i+1}"] .reflection-visual`).textContent();
    assert.ok(visible.includes(message.text));if(message.quote)assert.ok(visible.includes(message.quote));
    if(i<3)await next.click();
   }
   assert.equal(await next.textContent(),'Let’s begin');
   assert.equal(await page.locator('.study-reflection input,.study-reflection textarea').count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.waitForFunction(()=>[...document.querySelectorAll('.reflection-word')].every(word=>getComputedStyle(word).opacity==='1'));
   await page.screenshot({path:'/private/tmp/um-reflection-'+(local?'local':'staging')+'-'+scenario+'.png'});
   record(scenario+': four exact messages, no text input, accessible read controls and no horizontal overflow');
  }
  if(local&&scenario==='read'){
   await page.evaluate(()=>window.__fail=true);await next.click();await page.getByRole('alert').filter({hasText:'Please try again.'}).waitFor();assert.equal(await next.isEnabled(),true);
   record('Save failure keeps the introduction and enables retry');
  }
  if(!local&&scenario!=='skip'){
   await page.waitForFunction(()=>window.__qa.messages.some(m=>['study-prepared','study-error'].includes(m.type)),{},{timeout:90000});
   assert.ok(await page.evaluate(()=>window.__qa.messages.some(m=>m.type==='study-prepared')),JSON.stringify(await page.evaluate(()=>window.__qa.messages)));
   const f=await(await page.locator('.study-exposure iframe').elementHandle()).contentFrame();
   const before=await f.evaluate(()=>{const v=document.querySelector('.adaptive-television-local-video');return {time:v.currentTime,paused:v.paused};});
   assert.equal(before.time,0);assert.equal(before.paused,true);
  }
  if(scenario==='skip')await page.locator('[data-reflection-skip]').click();else await next.click();
  await page.locator('.study-reflection').waitFor({state:'detached'});
  if(local){assert.deepEqual(await page.evaluate(()=>window.__choices),[scenario==='skip'?'skipped':'read']);await page.waitForTimeout(900);assert.equal(await page.locator('.study-reflection').count(),0);}
  else{
   const saved=(await state()).participant.sessions.at(-1);
   assert.equal(saved.reflection.choice,scenario==='skip'?'skipped':'read');assert.equal(saved.reflection.version,protocol.pre_music_reflection.version);
   assert.equal(saved.before_report.text,'Synthetic reflection QA baseline.');
   if(scenario!=='skip'){
    const f=await(await page.locator('.study-exposure iframe').elementHandle()).contentFrame();
    await f.waitForFunction(()=>{const v=document.querySelector('.adaptive-television-local-video');return v&&!v.paused&&v.currentTime>1;},{},{timeout:45000});
    record(scenario+': Let’s begin launches the actual Empire of the Sun film after saving the choice');
    await page.evaluate(()=>document.querySelector('.study-exposure iframe').contentWindow.postMessage({type:'study-stop'},location.origin));
   }
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('.study-exposure iframe').waitFor();assert.equal(await page.locator('.study-reflection').count(),0);
   assert.equal((await state()).participant.sessions.at(-1).reflection.choice,saved.reflection.choice);
   record(scenario+': read/skip choice and version persist; reload does not repeat the reflection');
  }
  assert.equal(await page.evaluate(()=>window.__qa.camera),0);await clean();
 }
 assert.equal(report.errors.length,0,report.errors.join('\n'));report.at=new Date().toISOString();
 await fs.writeFile('/private/tmp/um-reflection-'+(local?'local':'staging')+'-qa.json',JSON.stringify(report,null,2)+'\n');
} catch(error){if(page){await page.screenshot({path:'/private/tmp/um-reflection-failure.png'}).catch(()=>{});console.error(await page.locator('#study-status').textContent({timeout:500}).catch(()=>''));}throw error;}
finally{await clean();await browser.close();}
