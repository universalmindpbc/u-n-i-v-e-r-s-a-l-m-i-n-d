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
const report={verifiedAt:new Date().toISOString(),mode:local?'local-candidate':'staging-assets',processAudioDisabled:true,nativeFullscreenInvoked:false,browser:browser.version(),scope:'Native HLS and iframe playback in muted Chromium, with an iPhone viewport and tap-owned play assertions. Authenticated HTML is rendered from source in memory; no invitation credential is used. Physical iPhone Safari is not available in this environment.',checks:[],errors:[]};
const paths=['happiness/assets/happiness.js','happiness/assets/happiness.css','happiness/assets/network.js'];
async function closeContext(context){
 for(const page of context.pages())for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(video=>video.pause())).catch(()=>{});
 await context.close();
}
async function setup({fallback=false,nested=false,slow=false}={}){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addInitScript(({fallback})=>{
  window.__tapActive=false;window.__playCalls=[];
  document.addEventListener('click',event=>{if(event.target.closest('[data-film-start]')){window.__tapActive=true;setTimeout(()=>{window.__tapActive=false;},0);}},true);
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){
   if(this.id==='film-player')window.__playCalls.push({tap:window.__tapActive,userActivation:navigator.userActivation.isActive,src:this.src,inline:this.playsInline,controls:this.controls,muted:this.muted});
   return play.call(this);
  };
  if(fallback){const canPlay=HTMLMediaElement.prototype.canPlayType;HTMLMediaElement.prototype.canPlayType=function(type){return type==='application/vnd.apple.mpegurl'?'':canPlay.call(this,type);};}
  Element.prototype.requestFullscreen=()=>Promise.reject(new DOMException('Native fullscreen disabled in QA','NotAllowedError'));
 },{fallback});
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
  const gate=await context.request.get(origin+'/happiness/');assert.equal(gate.status(),200);assert((await gate.text()).includes('launch happiness'));assert(!(await gate.text()).includes('data-hls='));
  const privateConfig=await context.request.get(origin+'/happiness/film-config.php');assert.equal(privateConfig.status(),403);report.checks.push({phpGateLoads:true,deliveryConfigHiddenBeforeLogin:true,privateConfig403:true});await context.close();
 }
 const native=await setup({slow:true});
 for(const start of [0,60,103]){
  await native.frame.locator(`[data-film-start="${start}"]`).tap();
  await native.frame.locator('#film-mount video').waitFor();assert.equal(await native.frame.locator('#film-view').getAttribute('data-player'),'native-hls');
  await native.frame.waitForFunction(start=>Number(document.querySelector('#film-view').dataset.currentTime)>start+.45,start,{timeout:60000});
  const state=await native.frame.locator('#film-player').evaluate(video=>({time:video.currentTime,duration:video.duration,width:video.videoWidth,height:video.videoHeight,inline:video.playsInline,controls:video.controls,muted:video.muted,readyState:video.readyState,paused:video.paused}));
  assert(state.time<start+15&&state.duration>354&&state.duration<357&&state.width>0&&!state.paused&&state.inline&&!state.controls&&!state.muted);
  assert.equal(await native.frame.locator('#film-back span').textContent(),'←');assert.equal(await native.frame.locator('#film-view button').count(),1);assert.equal(await native.frame.locator('#film-view input').count(),0);
  const timer=await native.frame.locator('#film-timecode').evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,bottom:innerHeight-r.bottom,text:el.textContent};});assert.equal(timer.left,18);assert.equal(timer.bottom,18);assert(timer.text.includes(' / 5:55'));
  assert(await native.frame.locator('#opening-loop').evaluate(video=>video.paused));
  if(start===103)await native.page.screenshot({path:out+'/'+(local?'local':'staging')+'-mobile-native.png'});
  await native.frame.evaluate(()=>{window.__previousVideo=document.getElementById('film-player');});
  await native.frame.locator('#film-back').tap();assert.equal(await native.frame.locator('#film-mount video').count(),0);assert(await native.frame.evaluate(()=>__previousVideo.paused&&!__previousVideo.getAttribute('src')));
  report.checks.push({nativeStart:start,state,timer,backAbortsVideo:true});
 }
 const calls=await native.frame.evaluate(()=>__playCalls);assert.equal(calls.length,3);assert(calls.every(call=>call.tap&&call.userActivation&&call.inline&&!call.controls&&!call.muted));
 assert(!native.requests.some(url=>url.includes('/happiness/media.php')||url.includes('sdk.latest.js')));report.checks.push({tapOwnsNativePlay:calls,noMediaFetchOrSdkBeforeNativePlayback:true});await closeContext(native.context);
 const nested=await setup({nested:true});await nested.frame.locator('#watch-film').tap();await nested.frame.waitForFunction(()=>Number(document.querySelector('#film-view').dataset.currentTime)>.5,null,{timeout:60000});await nested.frame.locator('#film-back').tap();report.checks.push({nestedInvitationFrameNativePlayback:true});await closeContext(nested.context);
 const fallback=await setup({fallback:true});await fallback.frame.locator('[data-film-start="103"]').tap();await fallback.frame.locator('#film-mount iframe').waitFor();await fallback.frame.waitForFunction(()=>Number(document.querySelector('#film-view').dataset.currentTime)>103.4,null,{timeout:60000});await fallback.frame.locator('#film-back').tap();assert.equal(await fallback.frame.locator('#film-mount iframe').count(),0);report.checks.push({nonNativeStreamIframeFallback:true});await closeContext(fallback.context);
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=String(error.stack||error);}
finally{
 for(const context of browser.contexts()){for(const page of context.pages())for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(video=>video.pause())).catch(()=>{});await context.close();}
 await browser.close();await server.close();await fs.writeFile(out+'/'+(local?'local':'staging')+'-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks,errors:report.errors,failure:report.failure}));if(!report.passed)process.exitCode=1;
}
