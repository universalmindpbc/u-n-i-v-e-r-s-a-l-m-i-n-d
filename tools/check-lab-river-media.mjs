import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
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
 const before=Number(await page.locator('body').getAttribute('data-river-time'));await page.waitForTimeout(700);assert.ok(Number(await page.locator('body').getAttribute('data-river-time'))>before+.3);
 await page.screenshot({path:path.join(out,'entry-music-river.png')});
 await page.locator('#music-toggle').click();assert.equal(await video.evaluate(v=>v.paused),true);
 const afterPause=Number(await page.locator('body').getAttribute('data-river-time'));await page.waitForTimeout(700);assert.ok(Number(await page.locator('body').getAttribute('data-river-time'))>afterPause+.3);
 await page.locator('#motion-toggle').click();await page.waitForTimeout(150);const stopped=await page.locator('body').getAttribute('data-river-time');await page.waitForTimeout(600);assert.equal(await page.locator('body').getAttribute('data-river-time'),stopped);
 await page.locator('#music-toggle').click();await page.waitForFunction(()=>!document.getElementById('music-video').paused);await page.waitForTimeout(400);assert.equal(await page.locator('body').getAttribute('data-river-time'),stopped);
 assert.deepEqual(errors,[]);
 const report={url:page.url(),date:new Date().toISOString(),processMuted:true,nativeFullscreenInvoked:false,checks:['No media before entry','Entry starts actual Cloudflare decoding at 7% blend without error notice','River moves with music and continues when music pauses','Motion off freezes river even while music resumes'],subjectiveSoundQualityTested:false,errors};fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await page?.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await browser.close();await server.close();}
