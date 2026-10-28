import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='/private/tmp/um-directory-20261028/early-pause-qa';
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={verifiedAt:new Date().toISOString(),processAudioDisabled:true,nativeFullscreenInvoked:false,checks:[]};
try {
 for (const width of [390,1470]) {
  const context=await browser.newContext({viewport:{width,height:width===390?844:956},isMobile:width===390,hasTouch:width===390});
  const page=await context.newPage();
  await page.goto('https://staging.universalmind.tv/home/',{waitUntil:'domcontentloaded'});
  await page.locator('.routes.is-ready').waitFor();
  await page.waitForFunction(()=>!document.querySelector('.festival-film').paused,{timeout:15000});
  assert.notEqual(await page.locator('html').getAttribute('data-story'),'complete');
  await page.getByRole('button',{name:'Pause background motion',exact:true}).click();
  assert.equal(await page.locator('html').getAttribute('data-story'),'complete');
  assert.equal(await page.locator('html').getAttribute('data-motion'),'paused');
  await page.waitForFunction(()=>[...document.querySelectorAll('.destination-title,.station')].every(e=>getComputedStyle(e).opacity==='1'));
  for(const route of ['watch','events','festivals','research']) await page.locator(`[data-destination="${route}"]`).click({trial:true});
  const snapshot=()=>({paths:[...document.querySelectorAll('.rail-line')].map(e=>e.getAttribute('d')),videoPaused:document.querySelector('.festival-film').paused});
  const before=await page.evaluate(snapshot);
  await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(snapshot),before);
  assert(before.videoPaused);
  await page.getByRole('button',{name:'Play background motion',exact:true}).click();
  assert.equal(await page.locator('html').getAttribute('data-story'),'complete');
  assert.equal(await page.locator('html').getAttribute('data-motion'),'playing');
  await page.waitForFunction(()=>!document.querySelector('.festival-film').paused);
  report.checks.push({width,earlyPauseRevealsAllDestinations:true,allFourLinksPassClickActionability:true,pausedPathsAndVideo:true,resumeKeepsDestinationsVisible:true});
  await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(e=>e.pause()));
  await context.close();
 }
 report.passed=true;
} catch(error) {report.passed=false;report.failure=String(error.stack);}
finally {
 for(const context of browser.contexts()){for(const page of context.pages())await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(e=>e.pause())).catch(()=>{});await context.close();}
 await browser.close();await server.close();
 await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
}
