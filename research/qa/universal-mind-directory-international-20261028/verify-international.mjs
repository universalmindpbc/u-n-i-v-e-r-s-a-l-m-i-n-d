import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin='https://staging.universalmind.tv';
const out='/private/tmp/um-directory-20261028/international-qa';
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
    window.__storySamples.push({at:Math.round(performance.now()-start),phase:document.documentElement.dataset.story,language:document.querySelector('h1')?.dataset.language,languageOpacity:[...document.querySelectorAll('.intro-language')].map(x=>Number(getComputedStyle(x).opacity)),progress:[...document.querySelectorAll('.route-track')].map(x=>Number(x.dataset.progress||0)),titles:[...document.querySelectorAll('.destination-title')].map(x=>Number(getComputedStyle(x).opacity)),subtitles:[...document.querySelectorAll('.destination-description')].map(x=>Number(getComputedStyle(x).opacity)),flows:[...document.querySelectorAll('.rail-flow')].map(x=>({opacity:Number(x.getAttribute('opacity')),offset:Number(x.getAttribute('stroke-dashoffset'))}))});
    if(performance.now()-start>33000)clearInterval(timer);
   },100);
  });
 });
 const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
 await page.goto(origin+'/home/',{waitUntil:'domcontentloaded'});await page.locator('.routes.is-ready').waitFor();
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.intro-language[lang=en]')).opacity)>.99);
 await page.screenshot({path:out+'/english-entrance-1664.png'});
 await page.waitForFunction(()=>document.documentElement.dataset.story==='complete',null,{timeout:30000});
 await page.screenshot({path:out+'/mandarin-1664.png'});
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.intro-language[lang=ar]')).opacity)>.99);
 await page.screenshot({path:out+'/arabic-1664.png'});
 await page.waitForFunction(()=>document.querySelector('h1').dataset.language==='en'&&Number(getComputedStyle(document.querySelector('.intro-language[lang=en]')).opacity)>.99);
 await page.screenshot({path:out+'/english-complete-1664.png'});
 const samples=await page.evaluate(()=>__storySamples);
 const sequence=samples.reduce((out,x)=>{if(x.language&&out.at(-1)!==x.language)out.push(x.language);return out;},[]);
 assert.deepEqual(sequence,['en','zh-Hans','ar','en']);
 assert(samples.some(x=>x.languageOpacity[0]>.1&&x.languageOpacity[0]<.8));
 assert(samples.every(x=>x.languageOpacity.filter(p=>p>0).length<=1));
 assert(samples.every(x=>x.progress.filter(p=>p>0&&p<1).length<=1));
 const arrivals=names.map((name,i)=>({name,routeStart:samples.find(x=>x.progress[i]>0)?.at,titleStart:samples.find(x=>x.titles[i]>0)?.at}));
 for(let i=1;i<4;i++)assert(arrivals[i].titleStart>arrivals[i-1].titleStart+2700);
 assert(samples.every(x=>Math.max(...x.subtitles)-Math.min(...x.subtitles)<.02));
 assert(samples.find(x=>x.subtitles[0]>0).progress.every(p=>p===1));
 assert(samples.filter(x=>x.phase==='complete').every(x=>x.flows.filter(p=>p.opacity>0).length===1));
 assert.equal(await page.locator('.intro-language[lang=en]').textContent(),expected);
 assert.equal(await page.locator('h1').getAttribute('aria-label'),expected);
 assert.equal(await page.locator('.intro-language[lang=ar]').getAttribute('dir'),'rtl');
 assert.equal(await page.locator('.intro-language[lang=zh-Hans]').textContent(),'宇宙之心是一家致力于心理健康的电子音乐公司');
 assert.equal(await page.locator('.intro-language[lang=ar]').textContent(),'العقل الكلي شركة موسيقى إلكترونية للصحة النفسية');
 assert(!(await page.locator('.intro-language:not([lang=en])').allTextContents()).some(x=>/[A-Za-z]/.test(x)));
 assert.equal(await page.locator('.intro-character,.rail-bed,.rail-ties,.rail-train').count(),0);
 report.checks.push({languageCycle:sequence,softFades:true,arrivals,sharedSubtitlesAt:samples.find(x=>x.subtitles[0]>0).at,completeAt:samples.find(x=>x.phase==='complete').at,singlePathsWithContinuousLight:true,exactEnglishPreserved:true});
 report.timeline=samples;
 const flowers=await page.locator('.destination').evaluateAll(xs=>xs.map(x=>{const title=x.querySelector('.destination-title'),flower=x.querySelector('.property-flower'),label=x.querySelector('.destination-label');return{name:x.dataset.destination,size:parseFloat(getComputedStyle(flower).width),fontSize:parseFloat(getComputedStyle(title).fontSize),imageOnLeft:flower.compareDocumentPosition(label)===Node.DOCUMENT_POSITION_FOLLOWING,source:flower.currentSrc,opacity:getComputedStyle(flower).opacity,duration:getComputedStyle(flower).animationDuration};}));
 for(const flower of flowers){assert(Math.abs(flower.size-flower.fontSize)<.05);assert.equal(flower.imageOnLeft,['watch','festivals'].includes(flower.name));assert.equal(flower.opacity,'1');assert.equal(flower.duration,'3s');}
 const rotateBefore=await page.locator('.directory-flower,.property-flower').evaluateAll(xs=>xs.map(x=>getComputedStyle(x).transform));await page.waitForTimeout(350);
 const rotateAfter=await page.locator('.directory-flower,.property-flower').evaluateAll(xs=>xs.map(x=>getComputedStyle(x).transform));assert(rotateBefore.every((x,i)=>x!==rotateAfter[i]));
 report.checks.push({fiveRotatingOriginalFlowers:true,propertyFlowerPlacement:flowers});
 const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const {root}=await cdp.send('DOM.getDocument');
 const fonts=[];
 for(const selector of ['.intro-language[lang=en]','.intro-language[lang=zh-Hans]','.intro-language[lang=ar]','.destination-label','.destination-description']){
  const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});const actual=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});const computed=await page.locator(selector).first().evaluate(x=>getComputedStyle(x).fontFamily);assert.equal(computed,'"Helvetica Neue", sans-serif');assert(actual.fonts.length);
  if(!selector.includes('zh-Hans')&&!selector.includes('lang=ar'))assert(actual.fonts.every(f=>f.familyName==='Helvetica Neue'));
  fonts.push({selector,actual:actual.fonts});
 }
 report.checks.push({renderedTypography:fonts});
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v.readyState>=2&&!v.paused;},null,{timeout:45000});
 const before=await page.locator('video').evaluate(v=>v.currentTime);await page.waitForTimeout(350);const media=await page.locator('video').evaluate(v=>({muted:v.muted,defaultMuted:v.defaultMuted,volume:v.volume,loop:v.loop,currentTime:v.currentTime,source:v.currentSrc}));assert(media.muted&&media.defaultMuted&&media.loop&&media.currentTime>before);assert.equal(media.volume,0);
 const shade=await page.locator('.festival-shade').evaluate(x=>getComputedStyle(x).backgroundImage);assert(shade.includes('0.24'));
 report.checks.push({silentFestivalVideo:media,brighterOverlay:shade});
 await page.locator('.ambient-toggle').click();await page.waitForTimeout(100);assert((await page.locator('.directory-flower,.property-flower').evaluateAll(xs=>xs.map(x=>getComputedStyle(x).animationPlayState))).every(x=>x==='paused'));const frozen=await page.evaluate(()=>({flowers:[...document.querySelectorAll('.directory-flower,.property-flower')].map(x=>getComputedStyle(x).transform),flows:[...document.querySelectorAll('.rail-flow')].map(x=>x.getAttribute('stroke-dashoffset')),language:[...document.querySelectorAll('.intro-language')].map(x=>x.style.opacity)}));await page.waitForTimeout(350);
 assert.deepEqual(await page.evaluate(()=>({flowers:[...document.querySelectorAll('.directory-flower,.property-flower')].map(x=>getComputedStyle(x).transform),flows:[...document.querySelectorAll('.rail-flow')].map(x=>x.getAttribute('stroke-dashoffset')),language:[...document.querySelectorAll('.intro-language')].map(x=>x.style.opacity)})),frozen);assert(await page.locator('video').evaluate(v=>v.paused));await page.locator('.ambient-toggle').click();report.checks.push({pauseControlsAllMotion:true});
 for(const name of ['watch','events','research']){const link=page.locator(`[data-destination=${name}]`);await link.hover();await page.waitForTimeout(220);const colour=await link.evaluate(x=>({title:getComputedStyle(x.querySelector('.destination-title')).color,dot:getComputedStyle(x.querySelector('.station')).backgroundColor}));assert.equal(colour.title,'rgb(255, 230, 0)');assert.equal(colour.dot,'rgb(255, 230, 0)');}
 assert.equal(await page.locator('[data-destination=festivals]').getAttribute('href'),null);report.checks.push({yellowRolloverAndInactiveHappiness:true});
 for(const viewport of[{width:1920,height:1080},{width:1470,height:920},{width:390,height:844},{width:320,height:568}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(200);const geometry=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,flower:{width:parseFloat(getComputedStyle(document.querySelector('.directory-flower')).width),opacity:getComputedStyle(document.querySelector('.directory-flower')).opacity},cards:[...document.querySelectorAll('.destination')].map(x=>{const r=x.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,scrollWidth:x.querySelector('.destination-label').scrollWidth,width:x.querySelector('.destination-label').clientWidth};})}));assert(geometry.scrollWidth<=geometry.width);assert.equal(geometry.flower.width,viewport.width<=520?82:94);assert.equal(geometry.flower.opacity,'1');for(const card of geometry.cards){assert(card.left>=0&&card.right<=geometry.width);assert(card.scrollWidth<=card.width+1);}report.checks.push({viewport,geometry});if(viewport.width===390)await page.screenshot({path:out+'/mobile-390.png',fullPage:true});
 }
 await pause(page);await context.close();
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const staticPage=await reduced.newPage();await staticPage.goto(origin+'/home/',{waitUntil:'domcontentloaded'});await staticPage.waitForFunction(()=>document.documentElement.dataset.story==='complete');assert(await staticPage.locator('video').evaluate(v=>v.paused));assert((await staticPage.locator('.destination-title,.destination-description').evaluateAll(xs=>xs.map(x=>getComputedStyle(x).opacity))).every(x=>x==='1'));assert((await staticPage.locator('.directory-flower,.property-flower').evaluateAll(xs=>xs.map(x=>getComputedStyle(x).animationName))).every(x=>x==='none'));assert.equal(await staticPage.locator('h1').getAttribute('data-language'),'en');await reduced.close();report.checks.push({reducedMotionStaticEnglishComplete:true});
 const keyboard=await browser.newContext({viewport:{width:1470,height:920}});const keyboardPage=await keyboard.newPage();await keyboardPage.goto(origin+'/home/',{waitUntil:'domcontentloaded'});await keyboardPage.locator('.routes.is-ready').waitFor();await keyboardPage.keyboard.press('Tab');assert.equal(await keyboardPage.evaluate(()=>document.documentElement.dataset.story),'complete');assert.equal(await keyboardPage.evaluate(()=>document.activeElement.dataset.destination),'watch');await pause(keyboardPage);await keyboard.close();report.checks.push({keyboardSkipsEntrance:true});
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=String(error.stack||error);}
finally{for(const context of browser.contexts()){for(const page of context.pages())await pause(page);await context.close();}await browser.close();await server.close();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks,errors:report.errors,failure:report.failure,out},null,2));if(!report.passed)process.exitCode=1;}
