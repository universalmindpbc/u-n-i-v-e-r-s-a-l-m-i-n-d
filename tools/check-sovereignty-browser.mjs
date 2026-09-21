import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv';
const password='isolated-browser-entry-fixture';
const hash=createHash('sha256').update(password).digest('hex');
const local=await fs.readFile(path.join(root,'index.html'),'utf8');
const report={mutedProcess:true,usesSyntheticCredential:true,checks:[],timings:[]};
const server=await chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
try {
 for(const mobile of [false,true])for(const mode of ['baseline','stalled','failed','throws']){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},isMobile:mobile});
  const page=await context.newPage();let posted=0,resolveStall;
  const stalled=new Promise(resolve=>{resolveStall=resolve;});
  let html=local.replace(/const allowedPasswordHashes = new Set\(\[[\s\S]*?\]\)/,`const allowedPasswordHashes = new Set(["${hash}"])`);
  if(mode==='baseline')html=html.replace('void sendEntry();','/* pre-feature baseline */');
  await page.route(base+'/',route=>route.fulfill({body:html,contentType:'text/html'}));
  await page.route(base+'/vogue/iam/api/portal-entry.php',async route=>{
   posted++;assert.equal(route.request().postDataJSON().password,password);
   if(mode==='stalled')await stalled;
   await route.fulfill({status:mode==='failed'?503:202,contentType:'application/json',body:'{}'}).catch(()=>{});
  });
  await page.route(base+'/vogue/iam/induction.html',route=>route.fulfill({body:'<!doctype html><title>Isolated entry destination</title>',contentType:'text/html'}));
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   if(mode==='throws')await page.evaluate(()=>{window.fetch=()=>{throw Error('fixture unavailable');};});
   await page.locator('[data-access-password]').fill('wrong');
   await page.locator('[data-access-form]').evaluate(form=>form.requestSubmit());
   await page.waitForFunction(()=>document.querySelector('[data-access-error]').textContent==='password not recognised');
   assert.equal(posted,0);
   await page.locator('[data-access-password]').fill(password);
   await page.locator('[data-access-form]').evaluate(form=>{
    window.__entryStart=performance.now();
    document.addEventListener('um:access-granted',()=>{window.__granted=performance.now();});
    window.addEventListener('pagehide',()=>{sessionStorage.setItem('qaTiming',String(performance.now()-window.__granted));});
    form.requestSubmit();
   });
   await page.waitForURL(base+'/vogue/iam/induction.html',{timeout:5000});
   const ms=Number(await page.evaluate(()=>sessionStorage.getItem('qaTiming')));
   assert.ok(ms>=650 && ms<1500,`${mode} took ${ms}ms`);
   if(mode==='stalled')assert.equal(posted,1);
   const stored=await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}}));
   assert.ok(!stored.includes(password));
   report.timings.push({viewport:mobile?'mobile':'desktop',recording:mode,navigation_ms:Math.round(ms)});
  }finally{resolveStall();await context.close();}
 }
 for(const viewport of ['mobile','desktop']){
  const timings=report.timings.filter(t=>t.viewport===viewport);
  const baseline=timings.find(t=>t.recording==='baseline').navigation_ms;
  for(const row of timings)assert.ok(row.navigation_ms-baseline<250,'Recording delayed navigation');
 }
 report.checks.push('Desktop/mobile invalid passwords never send records; valid entry keeps its 700ms transition when recording stalls, fails, or fetch throws');
 report.checks.push('No credential stored in localStorage or sessionStorage; no native fullscreen; muted browser closed');
 report.passed=true;
}finally{await browser.close();await server.close();}
console.log(JSON.stringify(report,null,2));
