import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../..');
const source=await fs.readFile(root+'/happiness/index.php','utf8');
const html='<!doctype html><html><head><base href="https://staging.universalmind.tv/happiness/"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="assets/happiness.css?v=2"><script src="assets/network.js?v=1" defer></script><script src="assets/happiness.js?v=2" defer></script></head><body class="entered"><svg'+source.split('<?php else: ?>\n<svg')[1].split('<?php endif; ?>')[0]+'</body></html>';
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio']});assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={kind:'Frontend player using local PHP-rendered markup, byte-matched staging assets and the uploaded public Cloudflare film; invitation authentication is outside this test',processAudioDisabled:true,nativeFullscreenInvoked:false,checks:[],errors:[]};
try{
 const context=await browser.newContext({viewport:{width:1470,height:920}});
 const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
 // The public film URL is already present in the task source. This fixture tests
 // presentation controls only and makes no authenticated request to the server.
 await page.exposeFunction('happinessFixtureFilm',()=>({film:'https://customer-1vpwglz3v6fiyaas.cloudflarestream.com/8dc27681c2ab042abf567389868cea9e/iframe',duration:355}));
 await page.evaluate(()=>{const original=fetch;window.fetch=async(input,options)=>String(input)==='media.php'?new Response(JSON.stringify(await window.happinessFixtureFilm()),{headers:{'Content-Type':'application/json'}}):original(input,options);});
 await page.setContent(html,{waitUntil:'load'});await page.locator('#network-canvas').waitFor();
 for(const file of ['happiness/assets/happiness.css','happiness/assets/happiness.js','happiness/assets/network.js','happiness/assets/universal-mind-flower.png']){
  const response=await context.request.get('https://staging.universalmind.tv/'+file+'?qa=controls-v2');assert.equal(response.status(),200);assert((await response.body()).equals(await fs.readFile(root+'/'+file)),file+' differs');report.checks.push({byteMatch:file});
 }
 for(const start of [0,60,103]){
  await page.locator(`[data-film-start="${start}"]`).click();await page.locator('#film-mount iframe').waitFor({timeout:30000});
  await page.waitForFunction(start=>Number(document.querySelector('#film-view').dataset.currentTime)>start+.4,start,{timeout:60000});
  const current=Number(await page.locator('#film-view').getAttribute('data-current-time'));assert(current<start+12);
  assert.equal(await page.locator('#film-view button').count(),1);assert.equal(await page.locator('#film-view button').getAttribute('id'),'film-back');assert.equal(await page.locator('#film-view input').count(),0);
  const timer=await page.locator('#film-timecode').evaluate(el=>{const r=el.getBoundingClientRect();return {text:el.textContent,left:r.left,bottom:innerHeight-r.bottom};});assert(timer.text.includes(' / 5:55'));assert.equal(timer.left,26);assert.equal(timer.bottom,23);
  assert(await page.locator('#opening-loop').evaluate(v=>v.paused));
  if(start===103){await page.screenshot({path:out+'/player-1470.png'});await page.setViewportSize({width:390,height:844});const mobile=await page.locator('#film-timecode').evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,bottom:innerHeight-r.bottom};});assert.equal(mobile.left,18);assert.equal(mobile.bottom,18);await page.screenshot({path:out+'/player-390.png'});}
  await page.locator('#film-back').click();assert.equal(await page.locator('#film-mount iframe').count(),0);await page.waitForFunction(()=>document.querySelector('#network-field').dataset.animationState==='running');
  report.checks.push({start,timeAdvanced:current,timer,backOnly:true,backRemovesPlayer:true,animationResumes:true});
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=String(error.stack||error);}
finally{for(const context of browser.contexts()){for(const page of context.pages())for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await context.close();}await browser.close();await server.close();await fs.writeFile(out+'/player-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
