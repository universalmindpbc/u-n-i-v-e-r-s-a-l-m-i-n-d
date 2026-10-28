import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../..');
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={verifiedAt:new Date().toISOString(),kind:'Live unauthenticated portal entry and access boundaries; reduced-motion render uses local source',processAudioDisabled:true,nativeFullscreenInvoked:false,checks:[],errors:[]};
try{
 const context=await browser.newContext({viewport:{width:1470,height:920}});
 await context.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new DOMException('Native fullscreen disabled in QA','NotAllowedError'));});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('https://staging.universalmind.tv/home/',{waitUntil:'domcontentloaded'});
 const link=page.locator('[data-destination=festivals]');assert.equal(await link.getAttribute('href'),'/events/happiness-entry.php');assert.equal(await link.getAttribute('target'),'_top');
 await link.click();await page.waitForURL('https://staging.universalmind.tv/happiness/');await page.locator('#password').waitFor();
 report.checks.push({livePortalLink:true,unauthenticatedEntryReachesInvitation:true});
 await page.locator('#password').fill('not-a-real-invitation-qa');await page.locator('.access-submit').click();await page.getByText('Please check your invitation password.',{exact:true}).waitFor();
 assert.equal(await page.locator('.events-stage').count(),0);report.checks.push({invalidInvitationRejected:true,blockedFullscreenHandled:true});
 const cookie=(await context.cookies()).find(c=>c.name==='um_happiness');assert(cookie.secure&&cookie.httpOnly&&cookie.path==='/happiness/');report.checks.push({secureHttpOnlyPathScopedSession:true});
 for(const [route,status] of [['/happiness/media.php',401],['/happiness/access.php',403]]){const response=await context.request.get('https://staging.universalmind.tv'+route);assert.equal(response.status(),status);report.checks.push({route,status});}
 const response=await context.request.get('https://staging.universalmind.tv/home/index.html');assert((await response.body()).equals(await fs.readFile(root+'/home/index.html')));report.checks.push({directoryHtmlByteMatch:true});
 await context.close();
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const quiet=await reduced.newPage();
 const source=await fs.readFile(root+'/happiness/index.php','utf8');
 const html='<!doctype html><html><head><base href="https://staging.universalmind.tv/happiness/"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="assets/happiness.css?v=2"><script src="assets/network.js?v=1" defer></script><script src="assets/happiness.js?v=2" defer></script></head><body class="entered"><svg'+source.split('<?php else: ?>\n<svg')[1].split('<?php endif; ?>')[0]+'</body></html>';
 await quiet.setContent(html,{waitUntil:'load'});await quiet.waitForFunction(()=>window.HappinessNetwork);await quiet.waitForTimeout(200);
 assert.equal(await quiet.locator('#network-field').getAttribute('data-animation-state'),'paused');assert(await quiet.locator('#opening-loop').evaluate(v=>v.paused&&!v.getAttribute('src')));
 const count=await quiet.locator('#network-canvas').getAttribute('data-frame');await quiet.waitForTimeout(200);assert.equal(await quiet.locator('#network-canvas').getAttribute('data-frame'),count);
 report.checks.push({reducedMotionStaticNetworkAndPoster:true});await reduced.close();
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=String(error.stack||error);}
finally{for(const context of browser.contexts()){for(const page of context.pages())await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await context.close();}await browser.close();await server.close();await fs.writeFile(path.join(out,'entry-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;}
