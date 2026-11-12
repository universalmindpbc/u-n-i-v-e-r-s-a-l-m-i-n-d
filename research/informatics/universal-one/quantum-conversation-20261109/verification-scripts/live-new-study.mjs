import {guardedCommand} from './command-budget.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/i n f o r m a t i c s/research/universal-one-quantum-20261109/live-new-study';
const sessionFile='/private/tmp/um-uo-live-study-session.json';
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
let context,page,lastTask,questionResponse;
const network=[];
await fs.mkdir(out,{recursive:true});
try {
 const options={viewport:{width:1440,height:1000},reducedMotion:'reduce',acceptDownloads:true};
 if(process.env.RESUME==='1')options.storageState=sessionFile;
 context=await browser.newContext(options);await context.route('https://informatics-universal-one-staging.universalmind.workers.dev/quantum/command',route=>guardedCommand(route));page=await context.newPage();
 page.on('response',async r=>{
  const u=new URL(r.url());if(!u.hostname.startsWith('informatics-universal-one-staging.'))return;
  if(u.pathname==='/quantum/question'||u.pathname.startsWith('/agent/studies/')){
   network.push({path:u.pathname,status:r.status(),time:new Date().toISOString()});await fs.writeFile(path.join(out,'live-network-progress.json'),JSON.stringify(network,null,2)+'\n');
   try{const d=await r.json();if(u.pathname==='/quantum/question'){questionResponse=d;await fs.writeFile(path.join(out,'live-question.json'),JSON.stringify(d,null,2)+'\n');console.log(JSON.stringify({route:d.route,status:d.status,agent_id:d.agent?.id,genes:d.genes}));if(d.agent)lastTask=d.agent;}else if(d.id&&d.status)lastTask=d;}catch{}
  }
 });
 await page.goto('https://staging.universalmind.tv/informatics/?entry=research&area=quantum',{waitUntil:'domcontentloaded'});
 const f=page.frameLocator('#quantum-frame');await f.locator('#question').waitFor({state:'visible',timeout:30000});
 for(let tries=0;tries<60;tries++){if(await f.locator('#question-form').evaluate(e=>typeof e.onsubmit==='function'))break;assert(tries<59,'Question form handler did not initialise');await new Promise(r=>setTimeout(r,500));}
 console.log('Staging form handler ready');
 if(process.env.RESUME==='1'){
  await f.locator('#resume-study').click();
  const state=JSON.parse(await fs.readFile(sessionFile,'utf8')),saved=state.origins.find(o=>o.origin==='https://staging.universalmind.tv').localStorage;
  const auth=saved.find(x=>x.name==='astra-research-session-v1').value,active=JSON.parse(saved.find(x=>x.name==='quantum-atlas-question-v3').value);
  const response=await context.request.get('https://informatics-universal-one-staging.universalmind.workers.dev/agent/studies/'+active.agent.id,{headers:{Origin:'https://staging.universalmind.tv',Authorization:'Bearer '+auth}});
  assert.equal(response.status(),200);lastTask=await response.json();network.push({path:'/agent/studies/'+active.agent.id,status:response.status(),time:new Date().toISOString()});
 }
 else {await page.waitForFunction(()=>window.UniversalOneQuantum?.available());await page.locator('.uo .iam-realtime-voice__summon').click();await page.locator('#uo-question').fill('Please run the existing OXTR investigation now. Test whether Fibonacci spacing, Phi Ratio and M9 P24 Alpha, Beta, Gamma and Epsilon improve transcription factor occupancy prediction around OXTR, using the fixed supported recipe and recorded measurements, with no new paid quantum or GPU jobs.');await page.locator('[data-send]').click();}
 let prior='';const startedAt=Date.now(),deadline=startedAt+35*60*1000;
 while(Date.now()<deadline){
  const status=await f.locator('#agent-status').textContent();const message=await f.locator('#agent-message').textContent();
  const now=JSON.stringify({id:lastTask?.id,status:lastTask?.status,stage:lastTask?.stage,message:message||status});
  if(now!==prior){console.log(now);prior=now;await context.storageState({path:sessionFile});await fs.chmod(sessionFile,0o600);}
  if(lastTask&&['complete','needs_attention','failed','cancelled'].includes(lastTask.status))break;
  if(questionResponse&&!questionResponse.agent)throw Error('Router returned '+questionResponse.route+' / '+questionResponse.status+' without a study');const error=await f.locator('#question-status').textContent();if(error)throw Error(error);if(!lastTask&&Date.now()>startedAt+120000)throw Error('No task after the request timeout');
  await new Promise(r=>setTimeout(r,4000));
 }
 assert(lastTask,'No persistent task returned');
 await fs.writeFile(path.join(out,'live-task.json'),JSON.stringify(lastTask,null,2)+'\n');
 await fs.writeFile(path.join(out,'live-network.json'),JSON.stringify({processAudioMuted:true,questionRequestSucceeded:network.some(x=>x.path==='/quantum/question'&&x.status===200),routerReceipt:questionResponse?{model:questionResponse.model,provider_response_id:questionResponse.provider_response_id,route:questionResponse.route}:null,network},null,2)+'\n');
 if(await page.locator('.uo-panel').isVisible())await page.locator('.uo-minimize').click();
 await f.locator('#agent-progress').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'live-progress.png')});
 assert.equal(lastTask.status,'complete',lastTask.message);
 const r=lastTask.report;assert.equal(lastTask.policy.maxModelTokens,64000);assert.equal(r.model_settings.astra.study_token_limit,64000);assert.equal(r.plan_receipt.max_output_tokens,16384);assert.equal(r.max_output_tokens,16384);assert.equal(r.service_tier,'default');assert.equal(r.plan_receipt.service_tier,'default');assert.equal(r.routing_receipt.service_tier,'default');assert(r.routing_receipt.total_tokens+r.plan_receipt.tokens+r.tokens<=64000);assert.equal(r.model_settings.astra.effort,'max');assert.equal(r.model_settings.gemini.thinking_level,'HIGH');
 assert.equal(r.plan_receipt.reasoning_effort,'max');assert.equal(r.reasoning_effort,'max');assert(r.plan_receipt.provider_response_id&&r.provider_response_id);
 assert(r.reviews.some(x=>x.phase==='design'&&x.thinking_level==='HIGH'));assert(r.reviews.some(x=>x.phase==='final'&&x.thinking_level==='HIGH'&&x.decision==='approve'));
 await f.locator('#agent-open').click();await f.locator('#results-dialog').waitFor({state:'visible'});
 assert((await f.locator('#results-dialog').innerText()).includes('What we found'));
 await page.screenshot({path:path.join(out,'live-insights.png')});
 for(const format of ['JSON','CSV']){
  const downloadPromise=page.waitForEvent('download');await f.locator('#results-dialog').getByRole('button',{name:new RegExp('Download complete study · '+format)}).click();
  const download=await downloadPromise;await download.saveAs(path.join(out,'verified-study.'+format.toLowerCase()));
 }
 const summary={task_id:lastTask.id,complete:true,interfaceReportVisible:true,downloadFormats:['JSON','CSV'],model_settings:r.model_settings,plan_receipt:r.plan_receipt,narrative_receipt:{model:r.model,reasoning_effort:r.reasoning_effort,provider_response_id:r.provider_response_id,tokens:r.tokens},reviews:r.reviews.map(({phase,decision,model,thinking_level,provider_response_id,usage,accounted_micro_usd})=>({phase,decision,model,thinking_level,provider_response_id,usage,accounted_micro_usd})),new_paid_Aquila_USD:r.spend.new_Aquila_USD,new_qBraid_credits:r.spend.new_qBraid_credits};
 await fs.writeFile(path.join(out,'live-verification.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
}finally{if(page)for(const f of page.frames())await f.evaluate(()=>document.querySelectorAll('video,audio').forEach(x=>x.pause())).catch(()=>{});await context?.close();await browser.close();await server.close();}
