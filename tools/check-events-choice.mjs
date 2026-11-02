import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const live=process.env.EVENTS_LIVE==='1'||process.argv.includes('--live'),origin='https://staging.universalmind.tv',out=live?path.join(root,'documents/universal-mind-lab/qa/events-choice'):'/private/tmp/um-events-choice-qa';
await fs.mkdir(out,{recursive:true});
let password='';
if(live){for await(const chunk of process.stdin)password+=chunk;password=password.trim();assert(password,'An approved invitation is required via stdin.');}
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),checks=[],errors=[],hashes=[];
const record=checks.push.bind(checks);checks.push=(...items)=>{console.log(items.join('\n'));return record(...items);};
async function setup(viewport){
 const c=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:'reduce'});
 await c.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true});});
 if(!live)await c.route(origin+'/**',async r=>{
  const url=new URL(r.request().url());
  if(url.pathname==='/events/'||url.pathname==='/events/choice.php'){
   const html=(await fs.readFile(path.join(root,'events/choice.php'),'utf8')).replace(/<\?php[\s\S]*?\?>/g,'');
   return r.fulfill({status:200,body:html,contentType:'text/html'});
  }
  if(url.pathname==='/events/poster.php')return r.fulfill({path:path.join(root,'events/private/poster.jpg'),contentType:'image/jpeg'});
  if(url.pathname.startsWith('/events/assets/')||url.pathname.startsWith('/lab/assets/'))return r.fulfill({path:path.join(root,url.pathname.slice(1))});
  return r.continue();
 });
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')console.log('Browser: '+m.text());});return {c,p};
}
async function close(c){for(const p of c.pages())for(const f of p.frames())await f.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});await c.close();}
async function layout(frame,viewport){
 await frame.waitForFunction(()=>[...document.querySelectorAll('.event-option img')].every(img=>img.complete&&img.naturalWidth>0),null,{timeout:20000});
 assert.equal(await frame.locator('.event-option').count(),2);
 assert.equal(await frame.locator('.choice-main h1').innerText(),'Events');
 assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 for(const link of await frame.locator('.event-option').all()){
  assert(await link.isVisible());const box=await link.boundingBox();assert(box.width>150&&box.x>=0&&box.x+box.width<=viewport.width+1);
  assert(await link.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0));
 }
 checks.push(`Two readable event choices at ${viewport.width} × ${viewport.height}, with loaded artwork and no horizontal overflow`);
}
try{
 if(!live){
  for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){
   const {c,p}=await setup(viewport);
   try{await p.goto(origin+'/events/?experience=1',{waitUntil:'networkidle'});await layout(p,viewport);await p.screenshot({path:path.join(out,`choice-${viewport.width}.png`),fullPage:true});}finally{await close(c);}
  }
 }else{
  // Verify the protected route before exercising the real login.
  const {c:unauth,p:guest}=await setup({width:390,height:844});
  try{await guest.goto(origin+'/events/?experience=1');assert(await guest.locator('[data-access-form]').isVisible());assert.equal(await guest.locator('.event-option').count(),0);const protectedResponse=await guest.request.get(origin+'/events/choice.php');assert.equal(protectedResponse.status(),401);checks.push('Existing invitation gate and direct choice-route protection retained');}finally{await close(unauth);}
  const viewport={width:1440,height:1000},{c,p}=await setup(viewport);
  try{
   await p.goto(origin+'/',{waitUntil:'domcontentloaded'});
   await p.locator('[data-access-password]').fill(password);await p.locator('[data-access-form] button').click();password='';
   const frame=p.frameLocator('.um-experience-frame');
   await frame.locator('[data-destination="events"]').waitFor({timeout:30000});
   await p.evaluate(()=>window.__eventsOwner=window.UniversalMindEntry);
   await frame.locator('[data-destination="events"]').click();
   await frame.locator('.event-options').waitFor();
   const active=()=>p.frames().find(f=>f!==p.mainFrame()&&f.url().includes('/events/'));
   await layout(active(),viewport);await p.screenshot({path:path.join(out,'choice-desktop.png')});
   assert.equal(await p.evaluate(()=>window.__eventsOwner===window.UniversalMindEntry),true);
   assert.equal(await p.locator('iframe.um-experience-frame').count(),1);
   checks.push('Real homepage login → Attend Events → event choice, retaining the original root shell and authenticated session');
   for(const vp of [{width:390,height:844},{width:844,height:390}]){await p.setViewportSize(vp);await layout(active(),vp);await p.screenshot({path:path.join(out,`choice-${vp.width}.png`),fullPage:true});}
   await p.setViewportSize(viewport);
   await frame.getByRole('link',{name:'Explore A Thousand Minds',exact:true}).click();
   await frame.locator('#watch-film').waitFor();assert(new URL(p.url()).searchParams.get('event')==='athousandminds');
   assert.equal(await frame.locator('[data-access-form]').count(),0);
   await p.screenshot({path:path.join(out,'athousandminds-return.png')});
   await frame.locator('.events-return').click();await frame.locator('.event-options').waitFor();
   checks.push('A Thousand Minds opens its existing experience without another login; Events return restores the choice');
   await frame.getByRole('link',{name:'Explore Universal Mind Lab',exact:true}).click();
   await frame.locator('#explore-enter:not([disabled])').waitFor({timeout:45000});
   assert.equal(new URL(p.url()).pathname,'/lab/');
   await frame.locator('#explore-enter').click();
   const lab=p.frames().find(f=>f!==p.mainFrame()&&f.url().includes('/lab/'));
   try { await lab.waitForFunction(()=>{const v=document.querySelector('#music-video');return v&&!v.paused&&v.currentTime>1&&v.videoWidth>0;},null,{timeout:45000}); } catch(error) { console.log(JSON.stringify(await lab.evaluate(()=>{const v=document.querySelector('#music-video');return {notice:document.querySelector('#media-status')?.textContent,paused:v.paused,time:v.currentTime,ready:v.readyState,src:v.currentSrc,error:v.error?.message,Hls:typeof Hls,policy:document.permissionsPolicy?.allowsFeature('autoplay')};}))); throw error; }
   assert.equal(await lab.locator('#music-video').evaluate(v=>getComputedStyle(v).opacity),'0.07');
   await p.goBack();
   try { await frame.locator('.event-options').waitFor({timeout:10000}); } catch(error) { console.log(JSON.stringify({url:p.url(),frames:await Promise.all(p.frames().map(async f=>({url:f.url(),state:await f.evaluate(()=>history.state).catch(()=>null),body:await f.evaluate(()=>document.body?.className).catch(()=>null)})))}));await p.screenshot({path:path.join(out,'back-debug.png')});throw error; }
   assert.equal(await p.evaluate(()=>window.__eventsOwner===window.UniversalMindEntry),true);
   assert.equal(await p.locator('iframe.um-experience-frame').count(),1);
   checks.push('Lab entry starts real decoded music/video at 7% blend; browser Back returns to Events in the same root shell');
   await frame.locator('.choice-home').click();await frame.locator('[data-destination="events"]').waitFor();
   await frame.locator('[data-destination="events"]').click();await frame.locator('.event-options').waitFor();
   checks.push('Home return and repeat Events entry retain access');
   for(let i=0;i<2;i++){
    await frame.getByRole('link',{name:'Explore Universal Mind Lab',exact:true}).click();
    await frame.locator('#explore-enter').waitFor();
    await p.goBack();await frame.locator('.event-options').waitFor();
    await frame.getByRole('link',{name:'Explore A Thousand Minds',exact:true}).click();
    await frame.locator('#watch-film').waitFor();
    await p.goBack();await frame.locator('.event-options').waitFor();
   }
   checks.push('Immediate repeated choice clicks and browser Back retain both destinations in one shell');
   // Verify exact static source assets served by staging; PHP is covered by the real branch journey.
   for(const file of ['events/assets/choice.css','events/assets/choice-nav.js','events/assets/gate-launch.js','events/assets/lab-preview.jpg']){
    const result=await p.evaluate(async file=>{const r=await fetch('/'+file+'?v='+(file.endsWith('gate-launch.js')?'4':file.endsWith('choice-nav.js')?'2':'1'),{cache:'reload'}),b=await r.arrayBuffer();return {file,status:r.status,sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('')};},file);
    assert.equal(result.status,200);assert.equal(result.sha256,createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex'));hashes.push(result);
   }
  }finally{await close(c);}
 }
 assert.deepEqual(errors,[]);
 const report={date:new Date().toISOString(),live,origin,processMuted:true,nativeFullscreenInvoked:false,checks,hashes,errors};await fs.writeFile(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await server.close();}
