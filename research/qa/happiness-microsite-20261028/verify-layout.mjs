import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../..');
const source=await fs.readFile(root+'/happiness/index.php','utf8');
const html='<!doctype html><html><head><base href="https://staging.universalmind.tv/happiness/"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="assets/happiness.css?v=1"><script src="assets/network.js?v=1" defer></script><script src="assets/happiness.js?v=1" defer></script></head><body class="entered">'+source.split('<?php else: ?>\n<svg')[1].split('<?php endif; ?>')[0].replace(/^/, '<svg')+'</body></html>';
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={kind:'Local rendered source with deployed assets; no authenticated visitor journey',processAudioDisabled:true,checks:[],errors:[]};
try {
 const context=await browser.newContext({viewport:{width:1470,height:920}});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const gate=await context.request.get('https://staging.universalmind.tv/happiness/');assert.equal(gate.status(),200);assert((await gate.text()).includes('launch happiness'));
 for(const [route,status] of [['media.php',401],['access.php',403]]){const response=await context.request.get('https://staging.universalmind.tv/happiness/'+route);assert.equal(response.status(),status);report.checks.push({route,status});}
 const csrf=await context.request.post('https://staging.universalmind.tv/happiness/',{form:{csrf:'invalid',password:'invalid'},headers:{Accept:'application/json'}});assert.equal(csrf.status(),403);report.checks.push({invalidCsrf:403});
 await page.setContent(html,{waitUntil:'load'});
 await page.waitForFunction(()=>window.HappinessNetwork&&document.querySelector('#network-canvas').dataset.frame>2);
 const start=Number(await page.locator('#network-canvas').getAttribute('data-frame'));await page.waitForTimeout(300);assert(Number(await page.locator('#network-canvas').getAttribute('data-frame'))>start);
 await page.locator('#motion-toggle').click();const frame=await page.locator('#network-canvas').getAttribute('data-frame');await page.waitForTimeout(300);assert.equal(await page.locator('#network-canvas').getAttribute('data-frame'),frame);
 report.checks.push({networkFramesAdvance:true,pauseHoldsFrame:true});
 for(const viewport of [{width:1920,height:1080},{width:1470,height:920},{width:1024,height:768},{width:390,height:844},{width:320,height:568}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(180);
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,paths:document.querySelectorAll('#connection-paths path').length}));assert(layout.width>=layout.scroll);assert.equal(layout.paths,16);
  if([1470,390].includes(viewport.width))await page.screenshot({path:out+'/local-layout-'+viewport.width+'.png',fullPage:true});
  report.checks.push({viewport,layout});
 }
 await page.locator('#global-nav-toggle').click();assert(await page.locator('#about-panel').isVisible());await page.keyboard.press('Escape');assert(await page.locator('#about-panel').isHidden());
 const logo=await page.locator('#central-flower').evaluate(el=>({naturalWidth:el.naturalWidth,width:el.getBoundingClientRect().width,network:el.parentElement.getBoundingClientRect().width}));assert.equal(logo.naturalWidth,1352);assert(logo.width/logo.network<=.33);
 report.checks.push({aboutEscape:true,originalLogo:logo});
 assert.deepEqual(report.errors,[]);report.passed=true;
} catch(error){report.passed=false;report.failure=String(error.stack||error);}
finally{for(const context of browser.contexts()){for(const page of context.pages())await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await context.close();}await browser.close();await server.close();await fs.writeFile(out+'/local-layout-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
