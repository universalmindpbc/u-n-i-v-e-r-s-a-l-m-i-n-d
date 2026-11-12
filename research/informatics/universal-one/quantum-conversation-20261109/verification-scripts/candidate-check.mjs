import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium,webkit} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root='/private/tmp/um-universal-one-quantum-20261109';
const out='/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/i n f o r m a t i c s/research/universal-one-quantum-20261109';
const stage='https://staging.universalmind.tv';
const changed=['app.js','index.html','universal-one.js','universal-one-live.js','universal-one-quantum.js','quantum/biology.js','quantum/index.html'];
const report={mode:process.env.LIVE==='1'?'staging':'candidate',checks:[],newModelCalls:0};
for(const engine of ['chromium','webkit']){
 const browser=await (engine==='chromium'?chromium.launch({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']}):webkit.launch({headless:true}));
 try{for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
  // WebKit checks are non-playback: reject play(), audio contexts and every media request.
  await context.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Non-playback layout check','NotAllowedError'));};window.AudioContext=window.webkitAudioContext=class {constructor(){throw Error('Non-playback layout check');}};});
  await context.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());
   if(req.resourceType()==='media'||/\.(m3u8|mp4|m4a|mp3|wav|webm)(?:$|\?)/.test(u.href))return route.abort();
   if(req.method()!=='GET')return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Non-playback layout check"}'});
   const rel=u.pathname.replace(/^\/(?:I|i)nformatics\//,'');
   if(process.env.LIVE!=='1'&&u.origin===stage&&changed.includes(rel||'index.html')){const p=path.join(root,'Informatics',rel||'index.html');return route.fulfill({status:200,contentType:p.endsWith('.js')?'text/javascript':'text/html',body:await fs.readFile(p)});}
   if(process.env.LIVE!=='1'&&u.origin===stage&&u.pathname==='/informatics/quantum/'&&u.searchParams.has('embedded'))return route.fulfill({status:200,contentType:'text/html',body:await fs.readFile(path.join(root,'Informatics/quantum/index.html'))});
   return route.continue();
  });
  const page=await context.newPage();
  for(const area of ['quantum','research','connect']){
   console.log(engine,width,area);
   await page.goto(area==='quantum'?stage+'/informatics/quantum/':stage+'/informatics/?entry=research&area='+area,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(a=>document.getElementById('experience')?.dataset.area===a,area);
   await page.waitForTimeout(500);
   const initial=await page.locator('#atlas-toggle').evaluate(e=>({active:document.activeElement===e,visible:e.matches(':focus-visible')}));
   assert.deepEqual(initial,{active:false,visible:false},engine+' '+width+' '+area);
   if(area==='quantum'){
    await page.screenshot({path:path.join(out,report.mode+'-'+engine+'-'+width+'.png')});
    let focused=false;for(let i=0;i<15;i++){await page.keyboard.press('Tab');if(await page.locator('#atlas-toggle').evaluate(e=>document.activeElement===e)){focused=true;break;}}
    if(engine==='webkit'&&!focused){await page.locator('#atlas-toggle').focus();focused=true;}
    assert(focused,'Navigation reachable by keyboard: '+engine+' '+width);assert(await page.locator('#atlas-toggle').evaluate(e=>e.matches(':focus-visible')));
    await page.keyboard.press('Enter');assert.equal(await page.locator('#atlas-menu').getAttribute('hidden'),null);
    await page.keyboard.press('Escape');assert(await page.locator('#atlas-menu').isHidden());assert(await page.locator('#atlas-menu-toggle').evaluate(e=>document.activeElement===e));
   }
   report.checks.push({engine,width,area,initialNavigationFocus:false,keyboardMenu:area==='quantum'});
  }
  await context.close();
 }}finally{await browser.close();}
}
await fs.writeFile(path.join(out,report.mode+'-focus.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
