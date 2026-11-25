import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out=import.meta.dirname,api='informatics-universal-one-staging.universalmind.workers.dev';
const report={passed:false,processAudioMuted:true,limitUSD:6,chargedUpperUSD:0,requests:[],turns:[],errors:[],blocked:[]};
const save=()=>fs.writeFile(out+'/live-verification.json',JSON.stringify(report,null,2)+'\n');
const server=await chromium.launchServer({headless:true,args:['--mute-audio']});
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
   assert(report.requests.length<1,'Unexpected additional model request');
   const limit=Math.min(2.25,report.limitUSD-report.chargedUpperUSD);assert(limit>1.5);
   report.chargedUpperUSD+=limit;await save();
   const response=await route.fetch({headers:{...request.headers(),'X-Research-QA-Max-USD':String(limit)},timeout:360000,maxRetries:0});
   const result=await response.json(),usage=result.qaSpend||result.usage?.qaSpend;
   if(usage){assert(usage.chargedUpperUSD<=limit+1e-9);report.chargedUpperUSD+=usage.chargedUpperUSD-limit;}
   report.requests.push({question:request.postDataJSON().question,status:response.status(),response:result});await save();
   return route.fulfill({response});
  }
  if(request.method()==='POST'&&/quantum|astra|study/.test(url.pathname)){report.blocked.push(url.pathname);return route.abort();}
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('https://staging.universalmind.tv/informatics/research/?collection=sound&chapter=1#topic-ii',{waitUntil:'domcontentloaded'});
 await page.locator('.iam-realtime-voice__summon').click();
 await page.locator('#uo-question').waitFor({state:'visible'});
 async function ask(question){
  const before=report.requests.length,start=Date.now();
  await page.locator('#uo-question').fill(question);await page.locator('[data-send]').click();
  await page.waitForFunction(()=>window.UniversalOneResearch?.getState().busy===false,null,{timeout:360000});
  assert.equal(report.requests.length,before+1);const {status,response:data}=report.requests.at(-1);
  assert.equal(status,200,JSON.stringify(data));assert(data.answer);assert.equal(data.reasoning,'max');
  assert(data.providerResponses.length&&data.providerResponses.every(r=>r.status==='completed'&&r.providerReasoning==='max'));
  assert.equal(data.knowledgeVersions.sound528.sourceRecords,12);assert(data.sources.length);
  const rendered=await page.locator('.uo-message[data-role=assistant]').last().innerText();
  assert.match(rendered,/528/);assert(rendered.length>data.answer.length*.65);
  report.turns.push({question,rendered,elapsedMs:Date.now()-start,citations:data.sources.map(s=>({id:s.id,url:s.url})),providerResponses:data.providerResponses});await save();
  console.log(JSON.stringify({turn:report.turns.length,answer:data.answer,chargedUpperUSD:report.chargedUpperUSD}));
  return data;
 }
 const first=await ask('Briefly explain the five-minute oxytocin finding, its possible relevance to felt connection, and whether the four 528 Hz RCTs all used blinding. Include the trial-size range.');
 assert.match(first.answer,/oxytocin.{0,35}(?:almost|nearly) doubled|(?:almost|nearly) doubled.{0,50}oxytocin/is);
 assert.match(first.answer,/five minutes|5 minutes/i);assert.match(first.answer,/440/);
 assert.match(first.answer,/not statistically significant|not significant/i);
 assert.match(first.answer,/connection/i);
 assert.match(first.answer,/hypothes|possible|potential|not.{0,30}(?:measur|establish|demonstrat)|unproven/i);
 assert.match(first.answer,/48/);assert.match(first.answer,/162/);
 assert.match(first.answer,/blind/i);assert.match(first.answer,/assessor|laboratory/i);
 assert(!/next study|CABI|radio link/i.test(first.answer));
 const last=page.locator('.uo-message[data-role=assistant]').last();
 await last.locator('.uo-answer a').first().click();assert(await last.locator('details').evaluate(el=>el.open));
 assert((await last.locator('.uo-source a').first().getAttribute('href')).startsWith('https://'));
 await last.locator('details summary').click();
 await page.locator('.uo-log').evaluate(el=>{el.scrollTop=el.scrollHeight;});
 await page.screenshot({path:out+'/universal-one-desktop.png'});
 await page.setViewportSize({width:390,height:950});await page.screenshot({path:out+'/universal-one-mobile.png'});
 assert.deepEqual(report.blocked,[]);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.error=error.message;throw error;}finally{await save();await context?.close();await browser.close();await server.close();}
