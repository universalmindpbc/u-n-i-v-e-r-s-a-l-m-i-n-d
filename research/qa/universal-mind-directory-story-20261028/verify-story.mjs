import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin='https://staging.universalmind.tv';
const out='/private/tmp/um-directory-20261028/story-qa';
await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={verifiedAt:new Date().toISOString(),origin,processAudioDisabled:true,nativeFullscreenInvoked:false,checks:[],errors:[]};
const expected='Universal Mind is an electronic music company for mental health';
const names=['watch','events','festivals','research'];
const pause=async page=>{for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(media=>media.pause())).catch(()=>{});};
try{
 const context=await browser.newContext({viewport:{width:1664,height:936}});
 await context.addInitScript(()=>{
  window.__storySamples=[];
  document.addEventListener('DOMContentLoaded',()=>{
   const start=performance.now();
   const timer=setInterval(()=>{
    window.__storySamples.push({at:Math.round(performance.now()-start),phase:document.documentElement.dataset.story,typed:Number(document.querySelector('h1')?.dataset.typedCharacters||0),progress:[...document.querySelectorAll('.route-track')].map(x=>Number(x.dataset.progress||0)),titles:[...document.querySelectorAll('.destination-title')].map(x=>Number(getComputedStyle(x).opacity)),subtitles:[...document.querySelectorAll('.destination-description')].map(x=>Number(getComputedStyle(x).opacity)),trains:[...document.querySelectorAll('.rail-train')].map(x=>Number(x.getAttribute('opacity')))});
    if(performance.now()-start>10500)clearInterval(timer);
   },80);
  });
 });
 const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
 await page.goto(origin+'/home/',{waitUntil:'domcontentloaded'});
 await page.locator('.routes.is-ready').waitFor();
 await page.waitForFunction(()=>Number(document.querySelector('h1').dataset.typedCharacters)>12);
 await page.screenshot({path:out+'/intro-1664.png'});
 await page.waitForFunction(()=>Number(document.querySelector('[data-route=events]').dataset.progress)>.5);
 await page.screenshot({path:out+'/routes-1664.png'});
 await page.waitForFunction(()=>document.documentElement.dataset.story==='complete');
 await page.waitForTimeout(700);
 await page.screenshot({path:out+'/complete-1664.png'});
 await page.waitForTimeout(2000);
 const samples=await page.evaluate(()=>__storySamples);
 assert(samples.some(x=>x.typed>0&&x.typed<61));
 assert(samples.every(x=>x.progress.filter(p=>p>0&&p<1).length<=1),'Rail draws overlap');
 const arrivals=names.map((name,i)=>({name,routeStart:samples.find(x=>x.progress[i]>0)?.at,titleStart:samples.find(x=>x.titles[i]>0)?.at}));
 assert(arrivals.every(x=>x.routeStart&&x.titleStart));
 for(let i=1;i<4;i++){
  assert(arrivals[i].routeStart>arrivals[i-1].routeStart+900);
  assert(arrivals[i].titleStart>arrivals[i-1].titleStart+900);
 }
 assert(samples.every(x=>Math.max(...x.subtitles)-Math.min(...x.subtitles)<.01),'Subtitles not simultaneous');
 assert(samples.find(x=>x.subtitles[0]>0).progress.every(p=>p===1));
 assert(samples.filter(x=>x.phase==='complete').every(x=>x.trains.filter(p=>p>0).length<=1));
 assert.equal(await page.locator('h1').textContent(),expected);
 assert.equal(await page.locator('h1').getAttribute('aria-label'),expected);
 report.checks.push({storySequence:true,arrivals,allSubtitlesTogetherAt:samples.find(x=>x.subtitles[0]>0).at,completeAt:samples.find(x=>x.phase==='complete').at,oneAmbientTrainAtATime:true,exactHeadingPreserved:true});
 report.timeline=samples;
 const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const {root}=await cdp.send('DOM.getDocument');
 const fonts=[];
 for(const selector of ['h1','.destination-title','.destination-description']){
  const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});
  const actual=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
  const computed=await page.locator(selector).first().evaluate(x=>getComputedStyle(x).fontFamily);
  assert.equal(computed,'"Helvetica Neue", sans-serif');
  assert(actual.fonts.length&&actual.fonts.every(f=>f.familyName==='Helvetica Neue'));
  fonts.push({selector,computed,actual:actual.fonts});
 }
 report.checks.push({renderedTypography:fonts});
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v.readyState>=2&&!v.paused;},null,{timeout:45000});
 const before=await page.locator('video').evaluate(v=>v.currentTime);await page.waitForTimeout(350);
 const media=await page.locator('video').evaluate(v=>({muted:v.muted,defaultMuted:v.defaultMuted,volume:v.volume,loop:v.loop,currentTime:v.currentTime,source:v.currentSrc}));
 assert(media.muted&&media.defaultMuted&&media.loop&&media.currentTime>before);assert.equal(media.volume,0);
 report.checks.push({silentFestivalVideo:media});
 await page.locator('.ambient-toggle').click();
 const frozen=await page.locator('.rail-train').evaluateAll(xs=>xs.map(x=>x.getAttribute('transform')));await page.waitForTimeout(400);
 assert.deepEqual(await page.locator('.rail-train').evaluateAll(xs=>xs.map(x=>x.getAttribute('transform'))),frozen);
 assert(await page.locator('video').evaluate(v=>v.paused));
 await page.locator('.ambient-toggle').click();
 report.checks.push({pauseControlsFilmAndRailMotion:true});
 for(const name of ['watch','events','research']){
  const link=page.locator(`[data-destination=${name}]`);await link.hover();await page.waitForTimeout(220);
  const colour=await link.evaluate(x=>({title:getComputedStyle(x.querySelector('.destination-title')).color,dot:getComputedStyle(x.querySelector('.station')).backgroundColor}));
  assert.equal(colour.title,'rgb(255, 230, 0)');assert.equal(colour.dot,'rgb(255, 230, 0)');
 }
 await page.locator('[data-destination=festivals]').hover();await page.waitForTimeout(220);
 assert.equal(await page.locator('[data-destination=festivals]').getAttribute('href'),null);
 assert.equal(await page.locator('[data-destination=festivals] .destination-title').evaluate(x=>getComputedStyle(x).color),'rgb(255, 255, 255)');
 report.checks.push({activeDestinationsYellowOnHover:true,happinessInactive:true});
 for(const viewport of[{width:1920,height:1080},{width:1470,height:920},{width:390,height:844},{width:320,height:568}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(200);
  const geometry=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,flower:{width:document.querySelector('.directory-flower').getBoundingClientRect().width,opacity:getComputedStyle(document.querySelector('.directory-flower')).opacity},rails:[...document.querySelectorAll('.rail-outline')].map(x=>({length:x.getTotalLength(),stroke:getComputedStyle(x).strokeWidth})),cards:[...document.querySelectorAll('.destination')].map(x=>{const r=x.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom};})}));
  assert(geometry.scrollWidth<=geometry.width);assert.equal(geometry.flower.width,viewport.width<=520?82:94);assert.equal(geometry.flower.opacity,'1');assert(geometry.rails.every(x=>x.length>0&&x.stroke==='9px'));
  for(const card of geometry.cards)assert(card.left>=0&&card.right<=geometry.width);
  report.checks.push({viewport,geometry});
  if(viewport.width===390)await page.screenshot({path:out+'/complete-390.png',fullPage:true});
 }
 await pause(page);await context.close();
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const staticPage=await reduced.newPage();
 await staticPage.goto(origin+'/home/',{waitUntil:'domcontentloaded'});await staticPage.waitForFunction(()=>document.documentElement.dataset.story==='complete');
 assert(await staticPage.locator('video').evaluate(v=>v.paused));
 assert((await staticPage.locator('.destination-title,.destination-description').evaluateAll(xs=>xs.map(x=>getComputedStyle(x).opacity))).every(x=>x==='1'));
 assert((await staticPage.locator('.rail-train').evaluateAll(xs=>xs.map(x=>getComputedStyle(x).display))).every(x=>x==='none'));
 await reduced.close();report.checks.push({reducedMotionImmediateCompleteAndStatic:true});
 const keyboard=await browser.newContext({viewport:{width:1470,height:920}});const keyboardPage=await keyboard.newPage();
 await keyboardPage.goto(origin+'/home/',{waitUntil:'domcontentloaded'});await keyboardPage.locator('.routes.is-ready').waitFor();await keyboardPage.keyboard.press('Tab');
 assert.equal(await keyboardPage.evaluate(()=>document.documentElement.dataset.story),'complete');
 assert.equal(await keyboardPage.evaluate(()=>document.activeElement.dataset.destination),'watch');
 await pause(keyboardPage);await keyboard.close();report.checks.push({keyboardSkipsEntrance:true});
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=String(error.stack||error);}
finally{
 for(const context of browser.contexts()){for(const page of context.pages())await pause(page);await context.close();}
 await browser.close();await server.close();
 await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,checks:report.checks,errors:report.errors,failure:report.failure,out},null,2));
 if(!report.passed)process.exitCode=1;
}
