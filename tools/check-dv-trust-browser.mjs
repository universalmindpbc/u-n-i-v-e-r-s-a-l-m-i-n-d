import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const live=process.env.STAGING==='1',phase=live?'staging':'candidate';
const out=path.join(root,'research/informatics/dv-trust-20261101');
const browser=await chromium.launch({headless:true,args:['--mute-audio']});
const context=await browser.newContext({acceptDownloads:true});
await context.route('**/*',async route=>{
 const u=new URL(route.request().url());
 if(/\.(mp4|mp3|wav|m3u8|m4s|ts)(\?|$)/.test(u.href))return route.abort();
 if(live||!u.href.startsWith(base))return route.continue();
 const rel=decodeURIComponent(u.pathname.slice('/informatics/'.length))||'index.html';
 if(rel.includes('..'))return route.abort();
 try{return route.fulfill({status:200,contentType:({'.json':'application/json','.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(rel)]||'application/octet-stream',body:await fs.readFile(path.join(root,'Informatics',rel))});}
 catch{return route.fulfill({status:404,body:'Missing'});}
});
const page=await context.newPage(),reader=page.frameLocator('#research-frame'),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 for(const width of [1440,320]){
  await page.setViewportSize({width,height:950});
  for(const [collection,count,score] of [['sound',8,1],['vision',10,2],['language',99,2]]){
   await page.goto(base+'library.html?collection='+collection,{waitUntil:'domcontentloaded'});
   const link=reader.locator('.contents-chapter a[data-topic="domestic-family-violence"]');
   await link.waitFor({timeout:60000});
   assert.equal(await link.locator('.paper-count').innerText(),count+' papers');
   assert.equal(await link.locator('.trust-score svg').count(),score);
   assert.equal(await link.locator('.trust-score').getAttribute('aria-label'),`Subchapter Trust Factor: ${score} of 3`);
   assert.equal(await link.locator('.trust-score path').first().getAttribute('fill'),'#fff');
   assert.ok(await reader.locator('html').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   await link.scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(out,`${phase}-${collection}-contents-${width}.png`)});
   await link.click();
   const topic=reader.locator('#topic-domestic-family-violence');
   await topic.waitFor();
   assert.equal(await topic.locator('.topic-heading .trust-score svg').count(),score);
   assert.match(await topic.innerText(),/Trust Factor describes the study designs/);
   assert.match(await topic.innerText(),/Linked reports of the same trial count once/);
   assert.equal(await topic.locator('.paper').count(),count);
   assert.ok(await reader.locator('html').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   await topic.locator('h3').scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(out,`${phase}-${collection}-chapter-${width}.png`)});
   checks.push({width,collection,papers:count,contentsCrosses:score,chapterCrosses:score,introduction:true,noHorizontalOverflow:true});
  }
 }
 assert.deepEqual(errors,[]);
 const report={passed:true,phase,mutedHeadless:true,checks,errors};
 await fs.writeFile(path.join(out,phase+'-browser.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}finally{for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});await browser.close();}
