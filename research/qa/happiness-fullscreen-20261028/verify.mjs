import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../..');
const local=process.argv.includes('--local');
const origin='https://staging.universalmind.tv';
const source=await fs.readFile(root+'/happiness/index.php','utf8');
const config=await fs.readFile(root+'/happiness/film-config.php','utf8');
const filmBase=config.match(/\$base = '([^']+)'/)[1];
const duration=Number(config.match(/'duration' => (\d+)/)[1]);
const body=('<svg'+source.split('<?php else: ?>\n<svg')[1].split('<?php endif; ?>')[0])
 .replace(/<\?= htmlspecialchars\(\$filmConfig\['hls'\], ENT_QUOTES, 'UTF-8'\) \?>/,filmBase+'/manifest/video.m3u8')
 .replace(/<\?= \(int\)\$filmConfig\['duration'\] \?>/,String(duration));
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+source.match(/<link rel="preload" as="image" href="assets\/universal-mind-flower.png">[\s\S]*?<script src="assets\/happiness.js\?v=\d+" defer><\/script>/)[0]+'</head><body class="entered">'+body+'</body></html>';
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={verifiedAt:new Date().toISOString(),mode:local?'local-candidate':'staging-assets',processAudioDisabled:true,nativeFullscreenInvoked:false,browser:browser.version(),scope:'Real video playback in muted Chromium; WebKit video and standard fullscreen APIs are intercepted. Tests verify user-gesture ownership, fullscreen state, landscape layout and playback continuity without invoking native fullscreen. The authenticated page is rendered from source; no invitation credential is used.',checks:[],errors:[]};
const paths=['happiness/assets/happiness.js','happiness/assets/happiness.css','happiness/assets/network.js'];
async function closeContext(context){
 for(const page of context.pages())for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(video=>video.pause())).catch(()=>{});
 await context.close();
}
async function setup({fallback=false,nested=false,slow=false,mode="standard"}={}){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addInitScript(({fallback,mode})=>{
  window.__tapActive=false;window.__playCalls=[];
  document.addEventListener('click',event=>{if(event.target.closest('[data-film-start]')){window.__tapActive=true;setTimeout(()=>{window.__tapActive=false;},0);}},true);
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){
   if(this.id==='film-player')window.__playCalls.push({tap:window.__tapActive,userActivation:navigator.userActivation.isActive,src:this.src,inline:this.playsInline,controls:this.controls,muted:this.muted});
   return play.call(this);
  };
  if(fallback){const canPlay=HTMLMediaElement.prototype.canPlayType;HTMLMediaElement.prototype.canPlayType=function(type){return type==='application/vnd.apple.mpegurl'?'':canPlay.call(this,type);};}
  let fullscreenElement=null;
  window.__fullscreenCalls=[];window.__fullscreenTap=false;window.__blockFullscreen=false;
  document.addEventListener('click',event=>{if(event.target.closest('#film-fullscreen')){window.__fullscreenTap=true;setTimeout(()=>{window.__fullscreenTap=false;},0);}},true);
  for(const key of ['fullscreenElement','webkitFullscreenElement'])Object.defineProperty(document,key,{configurable:true,get:()=>fullscreenElement});
  const record=(method,target)=>window.__fullscreenCalls.push({method,target:target.id,tap:window.__fullscreenTap,userActivation:navigator.userActivation.isActive});
  Element.prototype.requestFullscreen=function(){record('standard-enter',this);if(window.__blockFullscreen)return Promise.reject(new DOMException('QA denial','NotAllowedError'));fullscreenElement=this;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();};
  Element.prototype.webkitRequestFullscreen=Element.prototype.requestFullscreen;
  document.exitFullscreen=()=>{record('standard-exit',fullscreenElement||document.documentElement);fullscreenElement=null;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();};
  document.webkitExitFullscreen=document.exitFullscreen;
  Object.defineProperty(HTMLVideoElement.prototype,'webkitDisplayingFullscreen',{configurable:true,get(){return Boolean(this.__qaFullscreen);}});
  Object.defineProperty(HTMLVideoElement.prototype,'webkitSupportsFullscreen',{configurable:true,get(){return mode==='webkit'&&this.readyState>=1;}});
  const nativeEnter=function(){record('webkit-enter',this);if(window.__blockFullscreen)throw new DOMException('QA denial','NotAllowedError');this.__qaFullscreen=true;this.dispatchEvent(new Event('webkitbeginfullscreen'));};
  const nativeExit=function(){record('webkit-exit',this);this.__qaFullscreen=false;this.dispatchEvent(new Event('webkitendfullscreen'));};
  HTMLVideoElement.prototype.webkitEnterFullscreen=mode==='webkit'?nativeEnter:undefined;
  HTMLVideoElement.prototype.webkitEnterFullScreen=HTMLVideoElement.prototype.webkitEnterFullscreen;
  HTMLVideoElement.prototype.webkitExitFullscreen=nativeExit;HTMLVideoElement.prototype.webkitExitFullScreen=nativeExit;
 },{fallback,mode});
 if(local)await context.route(origin+'/happiness/assets/**',async route=>{
  const name=new URL(route.request().url()).pathname.slice(1);
  const mime=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'image/jpeg';
  await route.fulfill({body:await fs.readFile(root+'/'+name),contentType:mime});
 });
 await context.route(origin+'/happiness/?qa=safari-source',route=>route.fulfill({body:html,contentType:'text/html; charset=utf-8',headers:{'Cache-Control':'no-store'}}));
 await context.route(origin+'/happiness/media.php',route=>route.fulfill({json:{film:filmBase+'/iframe',hls:filmBase+'/manifest/video.m3u8',duration}}));
 if(slow)await context.route('**/manifest/video.m3u8',async route=>{await new Promise(resolve=>setTimeout(resolve,1200));await route.continue();});
 const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
 const requests=[];page.on('request',request=>requests.push(request.url()));
 if(nested){
  await context.route(origin+'/happiness/?qa=parent',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:'<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><iframe title="Happiness" src="/happiness/?qa=safari-source" allow="autoplay; fullscreen; encrypted-media" style="position:fixed;inset:0;border:0;width:100%;height:100%"></iframe></body></html>'}));
  await page.goto(origin+'/happiness/?qa=parent',{waitUntil:'domcontentloaded'});
 }else await page.goto(origin+'/happiness/?qa=safari-source',{waitUntil:'domcontentloaded'});
 const frame=nested?await new Promise(resolve=>{const found=page.frames().find(f=>f.url().includes('qa=safari-source'));if(found)resolve(found);else page.on('framenavigated',f=>{if(f.url().includes('qa=safari-source'))resolve(f);});}):page.mainFrame();
 await frame.locator('#watch-film').waitFor();return{context,page,frame,requests};
}
try{
 if(!local){
  const context=await browser.newContext();
  for(const file of paths){const response=await context.request.get(origin+'/'+file);const bytes=await response.body();assert.equal(response.status(),200);assert(bytes.equals(await fs.readFile(root+'/'+file)));report.checks.push({deployedAsset:file,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
  await context.close();
 }
 for(const mode of ['webkit','standard']){
  const session=await setup({mode,nested:mode==='webkit'}),{frame,page}=session;
  await frame.locator('[data-film-start="103"]').tap();
  await frame.waitForFunction(()=>Number(document.querySelector('#film-view').dataset.currentTime)>103.4,null,{timeout:60000});
  const button=frame.getByRole('button',{name:'Enter video fullscreen',exact:true});await button.waitFor();assert(await button.isEnabled());
  assert.equal(await frame.locator('#film-view button').count(),2);assert.equal(await frame.locator('#film-view input').count(),0);
  const before=await frame.locator('#film-player').evaluate(v=>({src:v.src,time:v.currentTime}));
  const portrait=await button.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight};});
  assert.equal(portrait.width,44);assert.equal(portrait.height,44);assert(portrait.right<=portrait.viewportWidth&&portrait.bottom<=portrait.viewportHeight);
  await page.screenshot({path:out+'/'+(local?'local':'staging')+'-'+mode+'-portrait.png'});
  await button.tap();await frame.getByRole('button',{name:'Exit video fullscreen',exact:true}).waitFor();
  const calls=await frame.evaluate(()=>__fullscreenCalls);assert.equal(calls[0].method,mode==='webkit'?'webkit-enter':'standard-enter');assert.equal(calls[0].target,mode==='webkit'?'film-player':'film-view');assert(calls[0].tap&&calls[0].userActivation);
  await page.setViewportSize({width:844,height:390});
  const landscape=await frame.locator('#film-fullscreen').evaluate(el=>{const r=el.getBoundingClientRect();return {right:r.right,bottom:r.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight};});assert(landscape.right<=landscape.viewportWidth&&landscape.bottom<=landscape.viewportHeight);
  await page.screenshot({path:out+'/'+(local?'local':'staging')+'-'+mode+'-landscape.png'});
  if(mode==='webkit')await frame.evaluate(()=>document.getElementById('film-player').webkitExitFullscreen());
  else await frame.getByRole('button',{name:'Exit video fullscreen',exact:true}).tap();
  await frame.getByRole('button',{name:'Enter video fullscreen',exact:true}).waitFor();
  const after=await frame.locator('#film-player').evaluate(v=>({src:v.src,time:v.currentTime,paused:v.paused}));assert.equal(after.src,before.src);assert(after.time>=before.time&&!after.paused);
  if(mode==='standard'){
   await frame.evaluate(()=>{window.__blockFullscreen=true;});await frame.locator('#film-fullscreen').tap();await frame.getByText('Fullscreen is unavailable. Please try again.',{exact:true}).waitFor();assert.equal(await frame.locator('#film-fullscreen').getAttribute('aria-pressed'),'false');
   await frame.evaluate(()=>{window.__blockFullscreen=false;});
  }
  await frame.locator('#film-fullscreen').tap();await frame.getByRole('button',{name:'Exit video fullscreen',exact:true}).waitFor();await frame.locator('#film-back').tap();
  assert.equal(await frame.locator('#film-mount video').count(),0);assert(await frame.evaluate(()=>!document.fullscreenElement));assert.equal(await frame.locator('#film-fullscreen').getAttribute('aria-pressed'),'false');assert.equal(await frame.locator('#fullscreen-status').textContent(),'');
  report.checks.push({mode,nested:mode==='webkit',portrait,landscape,enterCall:calls[0],timeBefore:before.time,timeAfterExit:after.time,returnPreservesVideo:true,backExitsAndCleansUp:true,blockedFullscreenRecovery:mode==='standard'});
  await closeContext(session.context);
 }
 const fallback=await setup({fallback:true,mode:'standard'});await fallback.frame.locator('#watch-film').tap();await fallback.frame.waitForFunction(()=>Number(document.querySelector('#film-view').dataset.currentTime)>.4,null,{timeout:60000});
 await fallback.frame.locator('#film-fullscreen').tap();assert.equal(await fallback.frame.locator('#film-fullscreen').getAttribute('aria-pressed'),'true');assert.equal(await fallback.frame.evaluate(()=>__fullscreenCalls[0].target),'film-view');await fallback.frame.locator('#film-back').tap();assert.equal(await fallback.frame.locator('#film-mount iframe').count(),0);report.checks.push({embeddedPlayerFullscreenFallback:true});await closeContext(fallback.context);
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=String(error.stack||error);}
finally{
 for(const context of browser.contexts())await closeContext(context);
 await browser.close();await server.close();await fs.writeFile(out+'/'+(local?'local':'staging')+'-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks,errors:report.errors,failure:report.failure}));if(!report.passed)process.exitCode=1;
}
