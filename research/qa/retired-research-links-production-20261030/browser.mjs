import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=require('playwright');
const out=new URL('./',import.meta.url);
const origin='https://universalmind.tv';
const browser=await chromium.launch({headless:true,args:['--mute-audio','--enable-automation']});
const report={collections:[],scienceLinks:[],pageErrors:[],pdfRequests:[],screenshots:[]};
try {
 const cdp=await browser.newBrowserCDPSession();
 assert((await cdp.send('Browser.getBrowserCommandLine')).arguments.includes('--mute-audio'));
 report.processAudioDisabled=true;await cdp.detach();
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 try {
  const page=await context.newPage();
  page.on('pageerror',e=>report.pageErrors.push(e.message));
  page.on('request',r=>{if(/Medical(?:%20| )Research\.pdf/i.test(r.url()))report.pdfRequests.push(r.url());});
  const loadedAssets=[];
  page.on('response',r=>{if(/\/science(?:-research-data-v1)?\.js\?/.test(r.url()))loadedAssets.push({url:r.url(),status:r.status()});});
  await page.goto('https://universalmind.tv/vogue/iam/science.html#research-tracker',{waitUntil:'domcontentloaded'});
  const scienceLinks=page.locator('a.research-link[href*="/informatics/library.html?collection="]');
  await scienceLinks.first().waitFor({state:'attached'});
  for(const layer of ['emdr','sound','mantra']) {
   await page.locator('[data-layer-toggle="'+layer+'"]').click();
   await page.locator('#research-detail-'+layer+' a.research-link').waitFor({state:'visible'});
  }
  assert.equal(await scienceLinks.count(),3);
  report.scienceLinks=await scienceLinks.evaluateAll(els=>els.map(el=>({url:el.href,target:el.target})));
  assert.deepEqual(report.scienceLinks.map(x=>new URL(x.url).searchParams.get('collection')),['vision','sound','language']);
  assert(report.scienceLinks.every(x=>x.target==='_blank'));
  assert.equal(loadedAssets.length,2);assert(loadedAssets.every(x=>x.status===200));report.scienceAssets=loadedAssets.slice();
  for(const [collection,title] of [['vision','Vision research'],['sound','Sound research'],['language','Language research']]) {
   await page.goto(origin+'/read/#resources',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('a[href*="Medical%20Research.pdf"]').count(),0);
   await page.getByRole('link',{name:title,exact:true}).click();
   await page.waitForFunction(collection=>{
    const selector='[data-collection="'+collection+'"][aria-pressed="true"]';
    if(document.querySelector(selector))return true;
    return [...document.querySelectorAll('iframe')].some(frame=>{try{return Boolean(frame.contentDocument?.querySelector(selector));}catch{return false;}});
   },collection);
   const library=(await page.locator('iframe[src*="library.html"]').count()) ? page.frameLocator('iframe[src*="library.html"]') : page;
   await library.locator('[data-collection="'+collection+'"][aria-pressed="true"]').waitFor({state:'visible'});
   await library.locator('#collection-statistics').waitFor({state:'visible'});
   const statistics=await library.locator('#collection-statistics').innerText();assert(/\d/.test(statistics));
   report.collections.push({collection,url:page.url(),selected:true,statistics});
   await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(m=>m.pause()));
  }
  for(const width of [1440,390]) {
   await page.setViewportSize({width,height:900});
   await page.goto(origin+'/read/#resources',{waitUntil:'domcontentloaded'});
   await page.getByRole('link',{name:'Vision research',exact:true}).scrollIntoViewIfNeeded();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const filename='resources-'+width+'.png';await page.screenshot({path:new URL(filename,out).pathname});report.screenshots.push(filename);
  }
  assert.deepEqual(report.pdfRequests,[]);assert.deepEqual(report.pageErrors,[]);report.passed=true;
 } finally {
  for(const page of context.pages())await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(m=>m.pause())).catch(()=>{});
  await context.close();
 }
} finally {
 await browser.close();report.browserClosed=true;
 await fs.writeFile(new URL('browser.json',out),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({passed:report.passed,collectionsVerified:report.collections.length,liveScienceLinksCorrect:report.scienceLinks.length,pdfRequests:report.pdfRequests.length,processAudioDisabled:true,browserClosed:true}));
