import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { chromium } from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root='/private/tmp/iam-production-release-20261027';
const out='/private/tmp/iam-production-audit-20261027/counts-nav';
const source=JSON.parse(fs.readFileSync(`${out}/informatics-source-counts.json`));
const resume=process.env.QA_RESUME_SHOP==='1';
const files=resume?[]:JSON.parse(fs.readFileSync('/private/tmp/iam-research-counts-nav-files.json'));
const base='https://universalmind.tv/vogue/iam/';
const report=resume?JSON.parse(fs.readFileSync(`${out}/verification.json`)):{sourceCommit:'2a3ea0635ee1ba8084747b1e0d0b6f871404ac89',processMuted:false,assets:[],counts:[],navigation:[],pageErrors:[]};
delete report.failure;
function decodeEmail(value){const bytes=Buffer.from(value,'hex');return Buffer.from(bytes.subarray(1).map(n=>n^bytes[0])).toString();}
function normalizeEmailProtection(value){return value.toString()
 .replace(/href="\/cdn-cgi\/l\/email-protection#([0-9a-f]+)"/gi,(_,hex)=>`href="mailto:${decodeEmail(hex)}"`)
 .replace(/<span class="__cf_email__" data-cfemail="([0-9a-f]+)">[\s\S]*?<\/span>/gi,(_,hex)=>decodeEmail(hex))
 .replace(/<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[^"\s]+\/cloudflare-static\/email-decode\.min\.js"><\/script>/g,'');}
const server=await chromium.launchServer({headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
report.processMuted=true;
const browser=await chromium.connect(server.wsEndpoint());
try{
 const context=await browser.newContext({viewport:{width:1470,height:1000},reducedMotion:'reduce',permissions:[],serviceWorkers:'block'});
 await context.route('**/*',route=>route.request().resourceType()==='media'?route.abort():route.continue());
 context.on('page',page=>page.on('pageerror',error=>report.pageErrors.push({url:page.url(),message:error.message})));
 for(const f of files){
  const name=f.slice('i  a m/'.length),local=fs.readFileSync(`${root}/${f}`);
  let url=base+name;
  if(name==='global-navigation.js')url+='?v=global-navigation-canonical-14-'+crypto.createHash('sha256').update(local).digest('hex').slice(0,12);
  else if(name.endsWith('.js'))url+='?v='+crypto.createHash('sha256').update(local).digest('hex').slice(0,12);
  const response=await context.request.get(url);
  assert.equal(response.status(),200,url);
  const served=await response.body(),exactMatch=local.equals(served);
  assert.ok(exactMatch || (name.endsWith('.html') && normalizeEmailProtection(local)===normalizeEmailProtection(served)),'Live file matches source: '+name);
  report.assets.push({url,sha256:crypto.createHash('sha256').update(local).digest('hex'),verification:exactMatch?'byte-identical':'matches after decoding host email protection'});
 }
 const page=await context.newPage();
 for(const width of resume?[]:[1470,390]){
  await page.setViewportSize({width,height:width===390?844:1000});
  await page.goto(base+'science.html#research-tracker',{waitUntil:'domcontentloaded'});
  await page.locator('[data-research-layer]').first().waitFor();
  for(const [layer,collection] of [['sound','sound'],['emdr','vision'],['mantra','language']]){
   const stats=source.collections[collection],card=page.locator(`[data-research-layer="${layer}"]`);
   const button=card.locator('[data-layer-toggle]');
   if(await button.getAttribute('aria-expanded')!=='true')await button.click();
   const values=await card.locator('.research-dossier-stats b').allTextContents();
   assert.deepEqual(values.map(v=>Number(v.replaceAll(',',''))),[stats.papers,stats.journals,stats.citations]);
   assert.deepEqual(await card.locator('.research-dossier-stats small').allTextContents(),['publications','journals','recorded citations']);
   const row=await card.locator('.research-evidence').innerText();
   for(const n of [stats.papers,stats.journals,stats.citations])assert.ok(row.includes(n.toLocaleString('en-AU')));
   assert.equal(await card.locator('.research-link').getAttribute('href'),stats.sourceUrl);
   await card.locator('.research-dossier-stats').scrollIntoViewIfNeeded();
   await page.screenshot({path:`${out}/${layer}-counts-${width}.png`});
   report.counts.push({layer,collection,width,publications:stats.papers,journals:stats.journals,recordedCitations:stats.citations,repositoryMatch:true});
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 }
 for(const [name,width] of resume?[['shop.html?standalone=1',1470]]:[['science.html',1470],['science.html',390],['index.html',1470],['research.html',1470],['light.html',1470],['shop.html?standalone=1',1470]]){
  await page.setViewportSize({width,height:width===390?844:1000});
  await page.goto(base+name,{waitUntil:'domcontentloaded'});
  await page.locator('[data-global-nav]').waitFor({state:'attached'});
  const trigger=page.locator('[data-nav-open]:visible').first();
  await trigger.click({timeout:20000});
  await page.locator('[data-global-nav].is-open').waitFor();
  await page.locator('[data-nav-item="research"]').click();
  const submenu=page.locator('[data-nav-submenu="research"]');
  await submenu.locator('a').first().waitFor({state:'visible'});
  assert.deepEqual((await submenu.locator('a').allTextContents()).map(t=>t.trim().toLowerCase()),['rct','computer vision','informatics','participate']);
  const link=submenu.locator('[data-nav-subitem="research-informatics"]');
  assert.equal(await link.getAttribute('target'),'_blank');
  assert.match(await link.getAttribute('rel'),/noopener/);
  assert.equal(await link.getAttribute('href'),'https://universalmind.tv/informatics/');
  await link.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${out}/navigation-${name.split('?')[0].replace('.html','')}-${width}.png`});
  const originalUrl=page.url(),popupReady=page.waitForEvent('popup');
  await link.focus();await link.press('Enter');
  const popup=await popupReady;
  await popup.waitForLoadState('domcontentloaded');
  assert.equal(popup.url(),'https://universalmind.tv/informatics/');
  await popup.locator('#launch').waitFor();
  assert.equal(await popup.evaluate(()=>window.opener===null),true);
  assert.equal(page.url(),originalUrl);
  const navResult={page:name,width,order:['RCT','Computer Vision','Informatics','Participate'],newTab:true,keyboard:true,portalPreserved:true};
  if(name==='index.html'){
   await page.waitForFunction(()=>document.querySelector('[data-adaptive-selection-source="no_checkin_random"]'),{timeout:15000});
   navResult.selectionSource='no_checkin_random';
  }
  report.navigation.push(navResult);
  for(const f of popup.frames())await f.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});
  await popup.close();
 }
 assert.deepEqual(report.pageErrors,[]);
 report.passed=true;
 await context.close();
}catch(error){report.passed=false;report.failure=String(error.stack||error);throw error;}
finally{
 for(const page of browser.contexts().flatMap(c=>c.pages()))for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});
 await browser.close();await server.close();
 report.checkedAt=new Date().toISOString();
 fs.writeFileSync(`${out}/verification.json`,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}
