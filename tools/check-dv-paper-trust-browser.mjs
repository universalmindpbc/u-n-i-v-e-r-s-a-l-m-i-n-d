import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const live=process.env.STAGING==='1',phase=live?'staging':'candidate';
const out=path.join(root,'research/informatics/dv-paper-trust-20261101');
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
page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
const approved=JSON.parse(await fs.readFile(path.join(root,'Informatics/library-data/domestic-violence-expansion.json'),'utf8'));
const expected=new Map(approved.records.map(r=>[r.id,r.assessmentRecord.studyDesignAssessment.isRandomizedControlledTrial===true ? (r.assessmentRecord.design.doubleBlindingVerified===true ? 3 : 2) : 1]));
assert.equal([...expected.values()].filter(s=>s===2).length,51);
async function go(params){await page.goto(base+'library.html?'+params,{waitUntil:'domcontentloaded'});await reader.locator('[data-stat="papers"]').waitFor({timeout:60000});}
async function rows(selector,idAttribute){return reader.locator(selector).evaluateAll((els,attr)=>els.map(el=>({id:el.getAttribute(attr),crosses:el.querySelectorAll(':scope > h3 .trust-score svg, :scope > h4 .trust-score svg').length,label:el.querySelector(':scope > h3 .trust-score, :scope > h4 .trust-score')?.getAttribute('aria-label')})),idAttribute);}
function validate(items){for(const item of items){assert.equal(item.crosses,expected.get(item.id),item.id);assert.match(item.label,new RegExp('Paper Trust Factor: '+item.crosses+' of 3'));}}
try{
 for(const width of [1440,320]){
  await page.setViewportSize({width,height:950});
  for(const [collection,count,chapter,chapterScore] of [['sound',8,7,1],['vision',10,7,2],['language',99,5,2]]){
   await go('collection='+collection+'&chapter='+chapter);
   const topic=reader.locator('#topic-domestic-family-violence');await topic.waitFor();
   const items=await rows('#topic-domestic-family-violence > .paper','data-paper');
   assert.equal(items.length,count);validate(items);
   assert.equal(await topic.locator('.topic-heading .trust-score svg').count(),chapterScore);
   assert.ok(await reader.locator('html').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
   const first=topic.locator('.paper').first();await first.scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(out,`${phase}-${collection}-papers-${width}.png`)});
   await first.locator('[data-paper-detail]').click();await reader.locator('#article').waitFor();
   assert.equal(await reader.locator('#article-body > .paper > h2 .trust-score svg').count(),items[0].crosses);
   await reader.locator('#article [data-close]').click();
   checks.push({width,collection,allPaperCardsChecked:count,oneCross:items.filter(r=>r.crosses===1).length,twoCrosses:items.filter(r=>r.crosses===2).length,threeCrosses:items.filter(r=>r.crosses===3).length,dialogMatches:true,chapterCrosses:chapterScore,noHorizontalOverflow:true});
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 const topics=['sound','vision','language'].map(c=>'topic='+c+':domestic-family-violence').join('&');
 await go('collection=all&view=search&'+topics);
 const seen=new Set();
 for(;;){const items=await rows('#results > .search-paper','data-id');validate(items);for(const r of items){assert.ok(!seen.has(r.id));seen.add(r.id);}if(await reader.locator('#next').isDisabled())break;await reader.locator('#next').click();}
 assert.equal(seen.size,117);
 for(const [score,count] of [[1,66],[2,51],[3,0]]){await go('collection=all&view=search&'+topics+'&trust='+score);assert.match(await reader.locator('#result-count').innerText(),new RegExp('^'+count+' papers'));validate(await rows('#results > .search-paper','data-id'));}
 await go('collection=all&view=search&'+topics);
 const pending=page.waitForEvent('download');await reader.locator('#export-json').click();const download=await pending;const file=path.join(out,phase+'-filtered.json');await download.saveAs(file);
 const exported=JSON.parse(await fs.readFile(file,'utf8')).records;assert.equal(exported.length,117);
 for(const r of exported){assert.equal(r.paperTrustAssessment.score,expected.get(r.id));assert.equal(r.paperTrustAssessment.displayCrosses,expected.get(r.id));}
 assert.equal(expected.get('dv-mindbody-41024298'),1,'The nonrandomized mindfulness paper is not upgraded by its RCT title');
 await go('collection=all&view=search&trust=3');const first=reader.locator('#results > .search-paper').first();await first.waitFor();
 assert.equal(await first.locator('h3 .trust-score svg').count(),3);
 await first.locator('h3 button[data-record]').click();await reader.locator('#article').waitFor();
 assert.equal(await reader.locator('#article-body > .paper > h2 .trust-score svg').count(),3);
 await page.screenshot({path:path.join(out,phase+'-existing-double-blind.png')});await reader.locator('#article [data-close]').click();
 assert.deepEqual(errors,[]);
 const report={passed:true,phase,mutedHeadless:true,checks,all117PaginatedSearchResultsChecked:true,filters:{one:66,two:51,three:0},exportedRatingsMatchVisibleCrosses:true,existingDoubleBlindPaperShowsThree:true,errors};
 await fs.writeFile(path.join(out,phase+'-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});await browser.close();}
