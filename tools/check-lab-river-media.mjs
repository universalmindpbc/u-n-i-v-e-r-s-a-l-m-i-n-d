import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'documents/universal-mind-lab/qa/river-biofeedback/media');fs.mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--autoplay-policy=user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());let page;const errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
 await context.addInitScript(()=>{Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true});Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});Object.defineProperty(Element.prototype,'webkitRequestFullscreen',{value:undefined,configurable:true});});
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://staging.universalmind.tv/lab/',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.body.dataset.ready==='true');
 const video=page.locator('#music-video');assert.equal(await video.evaluate(v=>v.paused&&!v.currentSrc),true);
 await page.locator('#explore-enter').click();await page.waitForFunction(()=>{const v=document.getElementById('music-video');return !v.paused&&v.videoWidth>0&&v.currentTime>1;},null,{timeout:45000});
 assert.equal(await page.locator('#media-status').isVisible(),false);assert.equal(await video.evaluate(v=>getComputedStyle(v).opacity),'0.07');
 const before=Number(await page.locator('body').getAttribute('data-river-time'));await page.waitForFunction(value=>Number(document.body.dataset.riverTime)>value+.15,before,{timeout:10000});
 await page.screenshot({path:path.join(out,'entry-music-river.png')});
 await page.locator('#music-toggle').click();assert.equal(await video.evaluate(v=>v.paused),true);
 const afterPause=Number(await page.locator('body').getAttribute('data-river-time'));await page.waitForFunction(value=>Number(document.body.dataset.riverTime)>value+.15,afterPause,{timeout:10000});
 await page.locator('#motion-toggle').click();await page.waitForTimeout(150);const stopped=await page.locator('body').getAttribute('data-river-time');await page.waitForTimeout(600);assert.equal(await page.locator('body').getAttribute('data-river-time'),stopped);
 await page.locator('#music-toggle').click();await page.waitForFunction(()=>!document.getElementById('music-video').paused);await page.waitForTimeout(400);assert.equal(await page.locator('body').getAttribute('data-river-time'),stopped);
 await page.setViewportSize({width:390,height:844});await page.locator('#replay-story').click();await page.waitForTimeout(900);
 assert.equal(await page.locator('#media-status').isVisible(),false);assert.equal(await page.locator('.intro').evaluate(e=>getComputedStyle(e).opacity),'1');assert.equal(await page.locator('#artist-lineup').getAttribute('aria-hidden'),'false');
 const headline=await page.locator('.intro').boundingBox(),lineup=await page.locator('#artist-lineup').boundingBox();assert.ok(headline.y+headline.height<lineup.y,'Mobile headline and lineup do not overlap');await page.screenshot({path:path.join(out,'mobile-entry-music.png')});assert.equal(await page.locator('#artist-lineup').evaluate(e=>getComputedStyle(e,'::before').opacity),'1');await page.locator('#night-toggle').evaluate(e=>e.click());await page.waitForFunction(()=>getComputedStyle(document.getElementById('artist-lineup'),'::before').opacity==='0');
 const hashes=[];for(const file of ['index.html','lab.css','lab.mjs','media.mjs','assets/lineup/tame-impala.svg','assets/lineup/justice.svg','assets/lineup/flume.svg','assets/lineup/sampa-the-great.svg']){
 const result=await page.evaluate(async file=>{const target=new URL(file,location.href);if(file==='lab.css')target.searchParams.set('v','20261102river2');else if(file.endsWith('.mjs'))target.searchParams.set('v','20261102river1');const r=await fetch(target,{cache:'reload'}),bytes=await r.arrayBuffer();return{file,url:target.href,status:r.status,sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('')};},file);assert.equal(result.status,200);assert.equal(result.sha256,createHash('sha256').update(fs.readFileSync(path.join(root,'lab',file))).digest('hex'));hashes.push(result);}
 assert.deepEqual(errors,[]);
 const report={url:page.url(),date:new Date().toISOString(),processMuted:true,nativeFullscreenInvoked:false,checks:['No media before entry','Entry starts actual Cloudflare decoding at 7% blend without error notice','River moves with music and continues when music pauses','Motion off freezes river even while music resumes','Mobile visitor entry with actual playback shows headline and artist marks without overlap'],subjectiveSoundQualityTested:false,hashes,errors};fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await page?.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await browser.close();await server.close();}
