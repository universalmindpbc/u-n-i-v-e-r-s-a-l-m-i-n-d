import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../..');
const local=process.argv.includes('--local'),origin='https://staging.universalmind.tv';
const source=await fs.readFile(root+'/happiness/index.php','utf8'),config=await fs.readFile(root+'/happiness/film-config.php','utf8');
const filmBase=config.match(/\$base = '([^']+)'/)[1];
const body=('<svg'+source.split('<?php else: ?>\n<svg')[1].split('<?php endif; ?>')[0]).replace(/<\?= htmlspecialchars\(\$filmConfig\['hls'\], ENT_QUOTES, 'UTF-8'\) \?>/,filmBase+'/manifest/video.m3u8').replace(/<\?= \(int\)\$filmConfig\['duration'\] \?>/,'355');
const head='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
const html='<!doctype html><html><head>'+head+source.match(/<link rel="preload" as="image" href="assets\/universal-mind-flower.png">[\s\S]*?<script src="assets\/happiness.js\?v=\d+" defer><\/script>/)[0]+'</head><body class="entered">'+body+'</body></html>';
const gateBody=source.split('<canvas class="rain-canvas"')[1].split('<?php else: ?>')[0].replace(/<\?=[\s\S]*?\?>/g,'');
const gate='<!doctype html><html><head>'+head+source.match(/<link rel="stylesheet" href="\/events\/assets\/gate.css[\s\S]*?<script src="assets\/gate-launch.js\?v=\d+" defer><\/script>/)[0]+'</head><body class="invitation"><canvas class="rain-canvas"'+gateBody+'</body></html>';
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={verifiedAt:new Date().toISOString(),mode:local?'local-candidate':'staging-assets',processAudioDisabled:true,nativeFullscreenInvoked:false,scope:'Source-rendered gate and authenticated HTML with simulated authentication; real staged video and HLS decoding. Per-element user-gesture denial emulates the reported browser restriction. Physical iPhone Safari and real authentication are separate checks.',checks:[],errors:[]};
async function close(context){for(const p of context.pages())for(const f of p.frames())await f.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await context.close();}
async function setup({width=390,height=844,gesturePolicy=false,reduced=false,gateEntry=false}={}){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<900,hasTouch:true,reducedMotion:reduced?'reduce':'no-preference'});
 await context.addInitScript(({gesturePolicy})=>{
  window.__mediaCalls=[];window.__qaGesture=false;
  for(const type of ['touchend','click','keydown','submit'])document.addEventListener(type,()=>{window.__qaGesture=true;setTimeout(()=>window.__qaGesture=false,0);},true);
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){
   const ambient=this.id==='opening-loop'||this.classList.contains('happiness-entry-background');
   if(ambient){
    if(window.__qaGesture)this.__qaUnlocked=true;
    window.__mediaCalls.push({gesture:window.__qaGesture,unlocked:Boolean(this.__qaUnlocked),time:this.currentTime,id:this.id||this.className});
    if(gesturePolicy&&!this.__qaUnlocked)return Promise.reject(new DOMException('QA per-element gesture restriction','NotAllowedError'));
   }
   return play.call(this);
  };
  const blocked=()=>Promise.reject(new DOMException('Native fullscreen disabled in QA','NotAllowedError'));
  Element.prototype.requestFullscreen=blocked;Element.prototype.webkitRequestFullscreen=blocked;
  HTMLVideoElement.prototype.webkitEnterFullscreen=()=>{throw new Error('Unexpected native fullscreen test');};
 },{gesturePolicy});
 if(local)await context.route(origin+'/happiness/assets/**',async route=>{
  const name=new URL(route.request().url()).pathname.slice(1);const mime=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'image/jpeg';
  await route.fulfill({body:await fs.readFile(root+'/'+name),contentType:mime});
 });
 // Only the policy tests suppress parser autoplay so the browser cannot bypass
 // the explicitly emulated play() denial. The ordinary run uses exact HTML.
 const rendered=gesturePolicy?html.replace(' autoplay muted loop',' muted loop'):html;
 await context.route(origin+'/happiness/**',async route=>{
  const url=new URL(route.request().url());if(url.pathname.includes('/assets/'))return route.fallback();
  if(route.request().method()==='POST'){await new Promise(r=>setTimeout(r,1200));return route.fulfill({json:{granted:true}});}
  await route.fulfill({contentType:'text/html; charset=utf-8',body:url.searchParams.has('qa-gate')?gate:rendered});
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(origin+'/happiness/'+(gateEntry?'?qa-gate=1':''),{waitUntil:'domcontentloaded'});
 return{context,page};
}
try{
 if(!local){const context=await browser.newContext();for(const file of ['happiness/assets/happiness.js','happiness/assets/happiness.css','happiness/assets/gate-launch.js','happiness/assets/gate-background.css']){const response=await context.request.get(origin+'/'+file);const bytes=await response.body();assert.equal(response.status(),200);assert(bytes.equals(await fs.readFile(root+'/'+file)));report.checks.push({deployedAsset:file,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}await close(context);}
 for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:1470,height:920}]){
  const {context,page}=await setup(viewport);
  await page.waitForFunction(()=>window.HappinessNetwork);
  const geometry=await page.locator('#watch-film').evaluate(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,centerX:r.x+r.width/2,centerY:r.y+r.height/2,innerWidth,innerHeight,scrollWidth:document.documentElement.scrollWidth};});
  assert(Math.abs(geometry.centerY-viewport.height/2)<2);assert(Math.abs(geometry.centerX-viewport.width/2)<2);assert(geometry.y>=0&&geometry.y+geometry.height<=viewport.height);assert(geometry.scrollWidth<=viewport.width);
  assert.equal(await page.locator('.experience-footer,.concept-note,.motion-toggle,.chapters').count(),0);
  await page.waitForFunction(()=>{const v=document.querySelector('#opening-loop');return v.currentTime>.3&&v.getVideoPlaybackQuality().totalVideoFrames>0;},null,{timeout:40000});
  const media=await page.locator('#opening-loop').evaluate(v=>({currentTime:v.currentTime,frames:v.getVideoPlaybackQuality().totalVideoFrames,muted:v.muted,source:v.currentSrc,opacity:getComputedStyle(v).opacity,audioBytes:v.webkitAudioDecodedByteCount}));assert(media.muted);assert.equal(media.audioBytes,0);
  if(viewport.width===390||viewport.width===1470)await page.screenshot({path:out+'/'+(local?'local':'staging')+'-opening-'+viewport.width+'.png'});
  report.checks.push({viewport,centeredCTA:geometry,video:media,removedFooter:true});await close(context);
 }
 {
  const {context,page}=await setup({gesturePolicy:true});await page.waitForFunction(()=>document.body.dataset.backgroundPlayback==='awaiting-gesture');
  const before=await page.locator('#opening-loop').evaluate(v=>v.currentTime);assert.equal(before,0);
  await page.locator('h1').tap();await page.waitForFunction(()=>document.querySelector('#opening-loop').currentTime>.3,null,{timeout:40000});
  report.checks.push({autoplayDenialRecoveredOnRealTap:true});await close(context);
 }
 {
  const {context,page}=await setup({gesturePolicy:true,gateEntry:true});
  await page.locator('#password').fill('QA fixture only');await page.locator('.access-submit').tap();
  await page.waitForFunction(()=>document.querySelector('.happiness-entry-background')?.currentTime>.2,null,{timeout:40000});
  const first=await page.locator('.happiness-entry-background').evaluate(v=>{v.dataset.qaIdentity='retained';return{time:v.currentTime,unlocked:v.__qaUnlocked};});assert(first.unlocked);
  await page.locator('.events-stage').waitFor();const frame=page.frames().find(f=>f.url().includes('experience=1'));assert(frame);
  await frame.waitForFunction(()=>document.documentElement.dataset.backgroundHosted==='true');
  await page.waitForFunction(()=>document.querySelector('.happiness-entry-background').currentTime>1.5,null,{timeout:40000});
  assert.equal(await page.locator('video').count(),1);assert.equal(await page.locator('video').getAttribute('data-qa-identity'),'retained');
  assert.equal(await frame.locator('#opening-loop').getAttribute('src'),null);
  assert.equal(await frame.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
  await page.screenshot({path:out+'/'+(local?'local':'staging')+'-retained-entry.png'});
  await frame.locator('#watch-film').tap();await frame.waitForFunction(()=>document.querySelector('#film-player')?.currentTime>.3,null,{timeout:60000});
  assert(await page.locator('.happiness-entry-background').evaluate(v=>v.paused));
  const paused=await page.locator('.happiness-entry-background').evaluate(v=>v.currentTime);
  await frame.locator('#film-back').tap();await page.waitForFunction(time=>{const v=document.querySelector('.happiness-entry-background');return!v.paused&&v.currentTime>time+.2;},paused,{timeout:40000});
  const after=await page.locator('.happiness-entry-background').evaluate(v=>({time:v.currentTime,identity:v.dataset.qaIdentity,unlocked:v.__qaUnlocked}));assert.equal(after.identity,'retained');
  report.checks.push({directGateRetainsGestureStartedVideo:true,authenticationDelayMs:1200,first,after,presentationPausesBackground:true,backResumesSameVideo:true});await close(context);
 }
 {
  const {context,page}=await setup({reduced:true});await page.waitForFunction(()=>window.HappinessNetwork);assert.equal(await page.locator('#network-field').getAttribute('data-animation-state'),'paused');assert(await page.locator('#opening-loop').evaluate(v=>v.paused));report.checks.push({reducedMotionRespected:true});await close(context);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.passed=false;report.failure=String(e.stack||e);}
finally{for(const c of browser.contexts())await close(c);await browser.close();await server.close();await fs.writeFile(out+'/'+(local?'local':'staging')+'-background-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
