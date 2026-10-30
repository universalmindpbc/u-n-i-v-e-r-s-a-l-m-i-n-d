import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const candidate=process.env.CANDIDATE==='1';
const out=path.join(root,'research/informatics/facet-counts-20261030');
const report={mode:candidate?'candidate':'staging',audioMutedAtLaunch:true,checks:[],errors:[]};
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
try {
 for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:1100},acceptDownloads:true});
  await context.route(/\.(mp4|mp3|wav|m3u8|m4s|ts)(\?|$)/,r=>r.abort());
  if(candidate)await context.route(base+'**',async route=>{
   const name=new URL(route.request().url()).pathname.split('/').pop();
   if(!['library.html','library.js'].includes(name))return route.continue();
   await route.fulfill({status:200,body:await fs.readFile(path.join(root,'Informatics',name)),contentType:name.endsWith('.js')?'text/javascript':'text/html'});
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  try {
   await page.goto(base+'library.html?collection=all&view=search',{waitUntil:'domcontentloaded'});
   const frame=page.frameLocator('#research-frame');
   await frame.locator('#result-count').filter({hasText:'1,108 papers'}).waitFor({timeout:45000});
   const count=async()=>Number((await frame.locator('#result-count').innerText()).match(/[\d,]+/)[0].replaceAll(',',''));
   const options=async id=>frame.locator('#'+id).evaluate(s=>[...s.options].filter(o=>o.value).map(o=>({value:o.value,text:o.textContent,selected:o.selected})));
   const set=async(id,values)=>{
    const details=frame.locator('#'+id+'-toggle').locator('..');
    if(!await details.evaluate(d=>d.open))await frame.locator('#'+id+'-toggle').click();
    for(const value of values){
     await frame.locator(`#${id}-options input[value=${JSON.stringify(value)}]`).check();
     if(['age','community'].includes(id))assert.equal(await details.evaluate(d=>d.open),true,'Keep multi-select open');
    }
    if(await details.evaluate(d=>d.open))await frame.locator('#'+id+'-toggle').click();
   };
   const download=async()=>{
    if(await count()===0)return [];
    const pending=page.waitForEvent('download');await frame.locator('#export-json').click();const d=await pending;
    const stream=await d.createReadStream(),parts=[];for await(const part of stream)parts.push(part);
    return JSON.parse(Buffer.concat(parts).toString()).records;
   };
   const counts=async(id,rows)=>{
    const related=await frame.locator('#include-related').isChecked(),values=await options(id);
    const result={};
    for(const option of values){
     const expected=rows.filter(r=>id==='age'?r.ageGroups.includes(option.value):r.communityMatches.some(m=>m.categoryId===option.value&&(related||m.relation!=='related'))).length;
     assert.match(option.text,new RegExp('\\('+expected+'\\)$'),id+': '+option.value);
     assert.equal(await frame.locator(`#${id}-options input[value=${JSON.stringify(option.value)}]`).locator('..').locator('span').textContent(),option.text);
     result[option.value]=expected;
    }
    return result;
   };
   const all=await download();assert.equal(all.length,1108);
   await counts('age',all);await counts('community',all);
   for(const [community,total,children,expanded] of [['domestic-violence',5,1,62],['defence',56,0,84]]){
    await frame.locator('#reset').click();await set('community',[community]);assert.equal(await count(),total);
    const rows=await download(),ageCounts=await counts('age',rows);assert.equal(ageCounts.children,children);
    await frame.locator('#age-toggle').click();await frame.locator('#age-options').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(out,`${report.mode}-${community}-${width}.png`)});await frame.locator('#age-toggle').click();
    await set('age',['children']);assert.equal(await count(),children);
    await counts('community',all.filter(r=>r.ageGroups.includes('children')));
    await frame.locator('#age-toggle').click();await frame.locator('#age-options button').click();await frame.locator('#age-toggle').click();
    assert.equal(await count(),total);
    await frame.locator('#include-related').check();assert.equal(await count(),expanded);
    const expandedAges=await counts('age',await download());
    report.checks.push({width,community,total,ageCounts,includingRelated:expanded,expandedAges});
   }
   await frame.locator('#reset').click();await set('community',['refugees','housing']);
   const combined=await download();assert.equal(combined.length,133);await counts('age',combined);
   await set('age',['children','youth']);
   assert.equal(await count(),combined.filter(r=>r.ageGroups.some(v=>['children','youth'].includes(v))).length);
   await counts('age',combined);await counts('community',all.filter(r=>r.ageGroups.some(v=>['children','youth'].includes(v))));
   const inner=page.frames().find(f=>f.url().includes('/library.html'));
   const before=await options('age');await inner.goto(inner.url());await frame.locator('#result-count').waitFor();
   await frame.locator('#age option[value=youth]').filter({hasText:/\(\d+\)/}).waitFor({state:'attached'});
   assert.deepEqual(await options('age'),before);
   await frame.locator('[data-collection=language]').click();
   const language=all.filter(r=>r.collections.includes('language'));
   const languageCommunities=language.filter(r=>r.communityMatches.some(m=>['refugees','housing'].includes(m.categoryId)&&m.relation!=='related'));
   await counts('age',languageCommunities);
   await counts('community',language.filter(r=>r.ageGroups.some(v=>['children','youth'].includes(v))));
   await frame.locator('[data-collection=all]').click();
   if(width===1440){
    for(const id of ['topic','condition','journal','category','physiology','target','kind','period','trust','jadad']){
     await frame.locator('#reset').click();const choices=await options(id);assert.ok(choices.length);
     const preferred={kind:'trial',period:'recent',trust:'2',jadad:'unassessed',target:'BDNF',condition:'ptsd'};
     await set(id,[choices.some(o=>o.value===preferred[id])?preferred[id]:choices[0].value]);
     const rows=await download();await counts('age',rows);await counts('community',rows);
     await set('community',['domestic-violence']);await counts('age',await download());
     report.checks.push({filter:id,baseResults:rows.length,withDomesticViolence:await count()});
    }
   }
   await frame.locator('#reset').click();await set('community',['domestic-violence']);
   await frame.locator('#query').fill('EMDR');await frame.locator('#search-form').evaluate(f=>f.requestSubmit());await counts('age',await download());
   await frame.locator('#query').fill('no-matching-publication-9999');await frame.locator('#search-form').evaluate(f=>f.requestSubmit());
   assert.equal(await count(),0);await counts('age',[]);await counts('community',[]);
   await frame.locator('#reset').click();assert.equal(await count(),1108);await counts('age',all);await counts('community',all);
   assert.equal(await inner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  } finally {
   for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});
   await context.close();
  }
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
} catch(error){report.error=error.stack;throw error;} finally {
 await browser.close();await server.close();await fs.writeFile(path.join(out,report.mode+'-browser.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({passed:report.passed,mode:report.mode,checks:report.checks.length}));
