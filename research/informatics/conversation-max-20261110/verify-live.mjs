import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out=import.meta.dirname,ledgerFile=out+'/spend.json',report={paidStudyCalls:0,hardwareJobs:0,gpuJobs:0,processAudioMuted:true,turns:[],requests:[],errors:[]};
const api='informatics-universal-one-staging.universalmind.workers.dev';
async function reserve(limit,path){const ledger=JSON.parse(await fs.readFile(ledgerFile));assert(ledger.approved);const remaining=ledger.limitUSD-ledger.calls.reduce((s,r)=>s+r.chargedUpperUSD,0),amount=Math.min(limit,remaining);assert(amount>.02,'Approved conversation allowance exhausted');const row={id:crypto.randomUUID(),path,status:'reserved',chargedUpperUSD:amount};ledger.calls.push(row);await fs.writeFile(ledgerFile,JSON.stringify(ledger,null,2)+'\n');return row;}
async function settle(row,data){const usage=data.qaSpend||data.usage?.qaSpend;if(!usage)return;assert(usage.chargedUpperUSD<=row.chargedUpperUSD+1e-9);const ledger=JSON.parse(await fs.readFile(ledgerFile));Object.assign(ledger.calls.find(r=>r.id===row.id),{chargedUpperUSD:usage.chargedUpperUSD,status:'reconciled'});await fs.writeFile(ledgerFile,JSON.stringify(ledger,null,2)+'\n');}
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});assert(execFileSync('ps',['-p',String(server.process().pid),'-o','command='],{encoding:'utf8'}).includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());let context,page,requests=0;
try{
 context=await browser.newContext({viewport:{width:1440,height:1050}});await context.addInitScript(()=>{HTMLMediaElement.prototype.play=()=>Promise.reject(Error('Playback disabled for conversation QA'));});
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url);
  if(request.resourceType()==='media')return route.abort();
  if(url.hostname===api&&request.method()==='POST'){
   if(!['/quantum/command','/research'].includes(url.pathname))return route.abort();
   assert(++requests<=12,'Unexpected additional model call');const row=await reserve(url.pathname==='/research'?2:.25,url.pathname);
   const response=await route.fetch({headers:{...request.headers(),'X-Research-QA-Max-USD':String(row.chargedUpperUSD)},timeout:360000,maxRetries:0});const body=await response.json();await settle(row,body);
   report.requests.push({path:url.pathname,status:response.status(),question:request.postDataJSON().question,sessionHeaderPresent:!!request.headers().authorization,portalHeaderPresent:!!request.headers()['x-quantum-portal'],response:body});
   await fs.writeFile(out+'/live-progress.json',JSON.stringify(report,null,2)+'\n');return route.fulfill({response});
  }return route.continue();
 });
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto('https://staging.universalmind.tv/informatics/quantum/',{waitUntil:'domcontentloaded'});const frame=page.frameLocator('#quantum-frame');await frame.locator('#ask-button:enabled').waitFor();
 assert.equal(await frame.locator('#question').getAttribute('placeholder'),'Ask a question, refine an idea, or ask me to run a study...');
 async function ask(question,portal){const before=await frame.locator('.chat-message[data-role=assistant]').count(),start=Date.now();await frame.locator('#question').fill(question);await frame.locator('#ask-button').click();await page.waitForFunction(n=>document.getElementById('quantum-frame')?.contentDocument.querySelectorAll('.chat-message[data-role=assistant]').length>n,before,{timeout:360000});await frame.locator('#ask-button:enabled').waitFor({timeout:15000});
  const answer=await frame.locator('.chat-message[data-role=assistant]').last().innerText();const data=report.requests.filter(r=>r.path==='/research').at(-1);assert.equal(data.status,200);assert.equal(data.response.reasoning,'max');assert(data.response.providerResponses.every(r=>r.requestedReasoning==='max'&&r.providerReasoning==='max'));assert.equal(data.portalHeaderPresent,portal);assert.match(answer,/CUDA.Q|CPU/i);assert(!answer.includes('Universal Informatics connects to quantum computing through Amazon Braket. With I AM portal access'));
  report.turns.push({question,answer,portal,elapsedMs:Date.now()-start,providerResponses:data.response.providerResponses});await fs.writeFile(out+'/live-progress.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({turn:report.turns.length,portal,elapsedMs:Date.now()-start,answer}));
 }
 await ask('Do you have access to CUDA-Q now?',false);
 await frame.locator('#portal-open').click();await frame.locator('#portal-password').fill(await fs.readFile('/private/tmp/um-cudaq-portal-code.txt','utf8'));
 const loginResponse=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/quantum-portal.php'));await frame.locator('#portal-login button').click();const login=await loginResponse;report.portalLoginStatus=login.status();assert.equal(login.status(),200,'Provided portal code was rejected');await frame.locator('#portal-return').waitFor({state:'visible',timeout:30000});await frame.locator('#portal-return').click();
 await ask('and now?',true);
 await ask("So you have access to CUDA-Q now that I'm logged in?",true);
 await ask('Do you have access to CUDA-Q?',true);
 assert.equal(new Set(report.turns.map(t=>t.answer)).size,report.turns.length,'Repeated fixed reply');assert.deepEqual(report.errors,[]);
 await frame.locator('#ask').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/live-conversation-1440.png'});await page.setViewportSize({width:390,height:950});await frame.locator('#ask').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/live-conversation-390.png'});report.passed=true;
}catch(e){report.passed=false;report.error=e.message;throw e;}finally{await fs.writeFile(out+'/live-verification.json',JSON.stringify(report,null,2)+'\n');await context?.close();await browser.close();await server.close();}
