import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const url=base+'review/domestic-violence-20261031/';
const live=process.env.STAGING==='1',phase=live?'staging':'candidate';
const out=path.join(root,'research/informatics/dot-dv-20261031/qa');
await fs.mkdir(out,{recursive:true});
const errors=[],checks=[];
const browser=await chromium.launch({headless:true,args:['--mute-audio','--disable-background-networking']});
async function routeLocal(context,fail=false){
  await context.route('**/*',async route=>{
    const target=route.request().url();
    if(!target.startsWith(base))return route.abort();
    const rel=decodeURIComponent(new URL(target).pathname.slice(new URL(base).pathname.length));
    if(rel.split('/').includes('..'))return route.abort();
    const name=rel.endsWith('/')?rel+'index.html':rel;
    if((fail===true&&name.endsWith('/index.json'))||(fail==='coverage'&&name.endsWith('/coverage.json')))return route.fulfill({status:503,body:'Unavailable'});
    const type=name.endsWith('.json')?'application/json':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html';
    try{return route.fulfill({status:200,contentType:type,body:await fs.readFile(path.join(root,'Informatics',name))});}
    catch{return route.fulfill({status:404,body:'Missing asset'});}
  });
}
try{
  for(const width of [1440,390,320]){
    const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true});
    if(!live)await routeLocal(context);
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelectorAll('.paper').length===117);
    assert.equal(await page.locator('[data-decision="recommended-summary"]').count(),117);
    assert.match(await page.locator('#collection-overview').innerText(),/51 reports from randomised controlled trials, 25 reviews and meta-analyses, and 41 other research reports/);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow '+width);
    await page.screenshot({path:path.join(out,phase+'-overview-'+width+'.png')});
    if(width===1440){
      let pending=page.waitForEvent('download');await page.locator('#download').click();
      let download=await pending;const jsonPath=path.join(out,phase+'-recommended.json');await download.saveAs(jsonPath);
      const data=JSON.parse(await fs.readFile(jsonPath,'utf8'));
      assert.equal(data.count,117);assert.equal(data.productionEligible,false);
      assert.ok(data.records.every(r=>r.publicationRecommendation.status==='recommended-summary'));
      pending=page.waitForEvent('download');await page.locator('#csv').click();download=await pending;
      const csvPath=path.join(out,phase+'-recommended.csv');await download.saveAs(csvPath);
      const csv=await fs.readFile(csvPath,'utf8');assert.equal(csv.split('\n').length,118);
      for(const r of data.records)assert.ok(csv.includes(r.contentHash));
      checks.push({recommendedExports:117,decisionAndHashIncluded:true});
    }
    await page.locator('#decision').selectOption('withheld');
    assert.equal(await page.locator('.paper').count(),13);
    for(const id of ['dv-children-25596929','dv-children-35285428'])assert.equal(await page.locator('#'+id+' .crosses').count(),0);
    await page.locator('#query').fill('dv-reviews-27599224');
    assert.equal(await page.locator('.paper').count(),1);
    assert.match(await page.locator('.finding').innerText(),/0.25–1.12/);
    await page.locator('.paper details').click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Detail overflow '+width);
    await page.locator('.paper').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(out,phase+'-hold-'+width+'.png')});
    await page.locator('#clear').click();assert.equal(await page.locator('.paper').count(),117);
    await page.locator('#collection').selectOption('sound');assert.equal(await page.locator('.paper').count(),8);
    await page.locator('#clear').click();await page.locator('#design').selectOption('review');assert.equal(await page.locator('.paper').count(),25);
    await page.locator('#clear').click();await page.locator('#access').selectOption('abstract');assert.equal(await page.locator('.paper').count(),74);
    for(const [approach,count] of [['emdr',10],['mindfulness',9],['music',8]]){
      await page.locator('[data-approach="'+approach+'"]').click();
      assert.equal(await page.locator('.paper').count(),count);
      assert.equal(await page.locator('#approach').inputValue(),approach);
      assert.equal(await page.locator('[data-decision="recommended-summary"]').count(),count);
    }
    checks.push({width,defaultRecommended:117,withheld:13,sound:8,reviews:25,abstract:74,approachLinks:{emdr:10,mindfulness:9,music:8},noHorizontalOverflow:true});
    await context.close();
  }
  if(!live){
    for(const failure of [true,'coverage']){
      const context=await browser.newContext();await routeLocal(context,failure);const page=await context.newPage();
      await page.goto(url);await page.waitForFunction(()=>document.querySelector('#result-count').textContent.includes('unavailable'));
      assert.equal(await page.locator('.paper').count(),0);assert.ok(await page.locator('#download').isDisabled());assert.ok(await page.locator('#csv').isDisabled());
      checks.push({missingEvidenceFailsClosed:true,failure});await context.close();
    }
  }
  assert.deepEqual(errors,[]);
  const result={passed:true,phase,url,mutedHeadlessBrowser:true,checks,errors};
  await fs.writeFile(path.join(out,phase+'-browser.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}finally{await browser.close();}
