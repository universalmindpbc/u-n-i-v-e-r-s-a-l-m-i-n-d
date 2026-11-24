import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out=import.meta.dirname,api='informatics-universal-one.universalmind.workers.dev';
const stagingReport=JSON.parse(await fs.readFile(out+'/../live-verification.json','utf8'));
const report={passed:false,processAudioMuted:true,hardwareJobs:0,studyCalls:0,limitUSD:stagingReport.limitUSD-stagingReport.chargedUpperUSD,priorStagingChargedUpperUSD:stagingReport.chargedUpperUSD,totalTaskLimitUSD:stagingReport.limitUSD,chargedUpperUSD:0,requests:[],turns:[],errors:[],blocked:[]};
report.passed=false;
const save=()=>fs.writeFile(out+'/live-verification.json',JSON.stringify(report,null,2)+'\n');
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());let context;
try{
 context=await browser.newContext({viewport:{width:1440,height:1050}});
 await context.addInitScript(()=>{
  HTMLMediaElement.prototype.play=()=>Promise.reject(Error('Playback disabled for research QA'));
  Element.prototype.requestFullscreen=()=>Promise.reject(Error('Native fullscreen disabled'));
  if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=()=>Promise.reject(Error('Microphone disabled'));
 });
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(request.resourceType()==='media')return route.abort();
  if(url.hostname===api&&request.method()==='POST'){
   if(url.pathname!=='/research'){report.blocked.push(url.pathname);return route.abort();}
   assert(report.requests.length<1,'Unexpected additional model requests');
   const limit=Math.min(2.25,report.limitUSD-report.chargedUpperUSD);assert(limit>1.5,'QA allowance exhausted');
   report.chargedUpperUSD+=limit;await save();
   const response=await route.fetch({headers:{...request.headers(),'X-Research-QA-Max-USD':String(limit)},timeout:360000,maxRetries:0});
   const result=await response.json(),usage=result.qaSpend||result.usage?.qaSpend;
   if(usage){assert(usage.chargedUpperUSD<=limit+1e-9);report.chargedUpperUSD+=usage.chargedUpperUSD-limit;}
   report.requests.push({question:request.postDataJSON().question,status:response.status(),response:result});await save();
   await route.fulfill({response});return;
  }
  if(request.method()==='POST'&&/quantum|astra|study/.test(url.pathname)){report.blocked.push(url.pathname);return route.abort();}
  await route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const response=await page.goto('https://universalmind.tv/informatics/research/?collection=general&chapter=13',{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
 await page.locator('.iam-realtime-voice__summon').click();
 await page.locator('#uo-question').waitFor({state:'visible'});
 async function ask(question,match){
  const before=report.requests.length,start=Date.now();await page.locator('#uo-question').fill(question);await page.locator('[data-send]').click();
  await page.waitForFunction(()=>window.UniversalOneResearch?.getState().busy===false,null,{timeout:360000});
  assert.equal(report.requests.length,before+1);const {status,response:data}=report.requests.at(-1);
  assert.equal(status,200,JSON.stringify(data));assert(data.answer);assert.equal(data.reasoning,'max');assert(data.providerResponses.length>0);
  assert(data.providerResponses.every(r=>r.status==='completed'&&r.providerReasoning==='max'));
  const rendered=await page.locator('.uo-message[data-role=assistant]').last().innerText();
  assert.match(rendered,match);assert(data.sources.length>0);assert(rendered.includes(data.answer.replace(/\[S\d+\]/g,'').trim().slice(0,30))||rendered.length>data.answer.length*.65);
  assert.equal(data.knowledgeVersions.inflammation.sourceRecords,75);
  report.turns.push({question,rendered,elapsedMs:Date.now()-start,citations:data.sources.map(s=>({id:s.id,url:s.url})),providerResponses:data.providerResponses});await save();
  console.log(JSON.stringify({turn:report.turns.length,elapsedMs:Date.now()-start,answer:data.answer,chargedUpperUSD:report.chargedUpperUSD}));
 }
 await ask('Using our published OXTR/IL-6 and DOCK2/PTSD chapters, give two brief evidence summaries, one for each topic. Contrast laboratory findings with mixed human IL-6 results, and explain whether DOCK2 is validated for tracking intervention response. Cite the reviewed evidence and preserve its limits.',/DOCK2/);
 assert.match(report.requests[0].response.answer,/IL.?6/);
 assert.equal(report.requests[0].response.knowledgeVersions.inflammation.version,'general-inflammation-20261125-v3');
 const last=page.locator('.uo-message[data-role=assistant]').last();
 await last.locator('.uo-answer a').first().click();assert(await last.locator('details').evaluate(el=>el.open));
 assert((await last.locator('.uo-source a').first().getAttribute('href')).startsWith('https://'));
 await last.locator('details summary').click();report.productionCitationInteractionVerified=true;
 await page.locator('.uo-log').evaluate(el=>{el.scrollTop=el.scrollHeight;});
 await page.screenshot({path:out+'/production-desktop.png'});
 await page.setViewportSize({width:390,height:950});await page.locator('.uo-log').evaluate(el=>{el.scrollTop=el.scrollHeight;});await page.screenshot({path:out+'/production-mobile.png'});
 assert.deepEqual(report.blocked,[]);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.error=error.message;throw error;}finally{await save();await context?.close();await browser.close();await server.close();}
