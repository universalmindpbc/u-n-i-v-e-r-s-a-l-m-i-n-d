import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const root=dirname(dirname(fileURLToPath(import.meta.url))),live=process.argv.includes('--live');
const out=join(root,'research/informatics/spacetime-mobile-20261110',live?'staging':'candidate');mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),report={mode:live?'staging':'candidate',process_audio_disabled:true,devices:[]};
try{
 for(const device of [{name:'desktop',viewport:{width:1440,height:1050}},{name:'iPhone viewport in Chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}]){
  const context=await browser.newContext({...device,reducedMotion:'reduce'});
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='customer-1vpwglz3v6fiyaas.cloudflarestream.com'&&u.pathname.endsWith('/thumbnails/thumbnail.jpg'))return route.continue();
   if(u.hostname==='staging.universalmind.tv'&&u.pathname.startsWith('/informatics/spacetime/')){
    if(live)return route.continue();
    const relative=u.pathname.slice('/informatics/spacetime/'.length)||'index.html';
    return route.fulfill({body:readFileSync(join(root,'Informatics/spacetime',relative)),contentType:{'.mp4':'video/mp4','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.html':'text/html'}[extname(relative)]||'text/plain'});
   }
   return route.abort();
  });
  const page=await context.newPage();
  try{
   await page.goto('https://staging.universalmind.tv/informatics/spacetime/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>{const v=document.querySelector('#earth-film');return v.videoWidth===1280&&!v.paused&&v.currentTime>.5;},null,{timeout:30000});
   assert.equal(await page.locator('#background-motion').count(),0);
   const before=await page.locator('#earth-film').evaluate(v=>v.currentTime);await page.waitForTimeout(1000);
   const playback=await page.locator('#earth-film').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,time:v.currentTime,duration:v.duration,muted:v.muted,defaultMuted:v.defaultMuted,volume:v.volume,loop:v.loop,playsInline:v.playsInline,autoplay:v.autoplay,controls:v.controls,source:v.currentSrc,audioBytes:v.webkitAudioDecodedByteCount||0}));
   assert.ok(playback.time>before);assert.ok(playback.duration>=44&&playback.duration<=46);assert.equal(playback.audioBytes,0);
   for(const key of ['muted','defaultMuted','loop','playsInline','autoplay'])assert.equal(playback[key],true);assert.equal(playback.controls,false);assert.equal(playback.volume,0);assert.ok(playback.source.includes('/media/inner-planes-loop.mp4'));
   await page.locator('#earth-film').evaluate(v=>{v.currentTime=v.duration-.3;});await page.waitForFunction(()=>document.querySelector('#earth-film').currentTime<2,null,{timeout:5000});
   await page.selectOption('#zen-pattern','fibonacci');await page.screenshot({path:join(out,device.isMobile?'patterns-mobile.png':'patterns-desktop.png'),fullPage:true});
   report.devices.push({name:device.name,playback,autoplay_without_gesture:true,loop_verified:true});
  }finally{await page.locator('video').evaluateAll(videos=>videos.forEach(v=>v.pause())).catch(()=>{});await context.close();}
 }
 report.status='passed';report.limit='Chromium mobile emulation is not a physical iPhone Safari test.';
}finally{await browser.close();await server.close();writeFileSync(join(out,'media-verification.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
