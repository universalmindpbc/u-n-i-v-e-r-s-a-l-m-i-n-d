import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const root=dirname(dirname(fileURLToPath(import.meta.url))),live=process.argv.includes('--live');
const out=join(root,'research/informatics/spacetime-zen-20261110',live?'staging':'candidate');mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),report={mode:live?'staging':'candidate',process_audio_disabled:true};
let page;
try{
 const context=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='customer-1vpwglz3v6fiyaas.cloudflarestream.com'&&u.pathname.startsWith('/08d6983ef6584f2b8659ceaf0cfa248a/'))return route.continue();
  if(u.hostname==='staging.universalmind.tv'&&u.pathname.startsWith('/informatics/spacetime/')){
   if(live)return route.continue();
   const relative=u.pathname.slice('/informatics/spacetime/'.length)||'index.html';
   return route.fulfill({body:readFileSync(join(root,'Informatics/spacetime',relative)),contentType:{'.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.html':'text/html'}[extname(relative)]||'text/plain'});
  }
  return route.abort();
 });
 page=await context.newPage();await page.goto('https://staging.universalmind.tv/informatics/spacetime/',{waitUntil:'networkidle'});
 assert.ok(await page.locator('#earth-film').evaluate(v=>v.paused&&!v.currentSrc));
 await page.click('#background-motion');
 await page.waitForFunction(()=>{const v=document.querySelector('#earth-film');return v.videoWidth>0&&!v.paused&&v.currentTime>8.2;},null,{timeout:45000});
 await page.waitForFunction(()=>document.querySelector('#earth-film').videoHeight>=720,null,{timeout:30000});
 const before=await page.locator('#earth-film').evaluate(v=>v.currentTime);await page.waitForTimeout(1200);
 report.playback=await page.locator('#earth-film').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,time:v.currentTime,muted:v.muted,defaultMuted:v.defaultMuted,volume:v.volume,loop:v.loop,playsInline:v.playsInline,paused:v.paused}));
 assert.ok(report.playback.width>=1280&&report.playback.height>=720);assert.ok(report.playback.time>before);
 for(const key of ['muted','defaultMuted','loop','playsInline'])assert.equal(report.playback[key],true);assert.equal(report.playback.volume,0);
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:join(out,'background-desktop.png'),fullPage:true});
 await page.click('#background-motion');assert.ok(await page.locator('#earth-film').evaluate(v=>v.paused));
 await page.click('#one-summon');await page.screenshot({path:join(out,'universal-one.png'),fullPage:false});await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:join(out,'background-mobile.png'),fullPage:true});
 await page.emulateMedia({reducedMotion:'no-preference'});await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>{const v=document.querySelector('#earth-film');return !v.paused&&v.currentTime>8.1;},null,{timeout:45000});
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#earth-film').paused);
 report.autoplay_and_reduced_motion_change=true;
 report.status='passed';report.checks=['Single dedicated browser with process-level mute before navigation','Reduced motion starts with poster','Explicit playback advances using the existing Inner Planes stream','Muted, zero volume, inline looping','Pause control','Desktop/mobile screenshots and Universal One preview'];
}finally{
 if(page&&!page.isClosed())await page.locator('video').evaluateAll(videos=>videos.forEach(v=>v.pause())).catch(()=>{});
 await browser.close();await server.close();writeFileSync(join(out,'media-verification.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report));
