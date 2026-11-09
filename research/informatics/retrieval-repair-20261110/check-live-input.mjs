import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out=import.meta.dirname,ledgerFile=out+'/../research-input-20261109/openai-verification-spend.json';
const audioRoot='/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/i n f o r m a t i c s/research/';
const mode=process.env.MODE||'text',caseName=process.env.CASE||mode,report={mode,caseName,newStudies:0,syntheticInput:true,processAudioMuted:true,network:[],responses:[]};
const load=async()=>JSON.parse(await fs.readFile(ledgerFile,'utf8'));
async function reserve(amount,kind){const l=await load();assert.equal(l.approved,true,'Live checks require the approved allowance');assert(l.calls.reduce((n,c)=>n+c.chargedUpperUSD,0)+amount<=l.limitUSD+1e-9,'Staging allowance exhausted');const row={id:crypto.randomUUID(),kind,chargedUpperUSD:amount,status:'reserved'};l.calls.push(row);await fs.writeFile(ledgerFile,JSON.stringify(l,null,2)+'\n');return row.id;}
async function settle(id,amount){const l=await load(),r=l.calls.find(x=>x.id===id);assert(Number.isFinite(amount)&&amount>=0&&amount<=r.chargedUpperUSD);r.chargedUpperUSD=amount;r.status='reconciled';await fs.writeFile(ledgerFile,JSON.stringify(l,null,2)+'\n');}
assert((await load()).approved,'Approval is required before live requests');
const args=['--mute-audio','--autoplay-policy=user-gesture-required'];
if(mode!=='text')args.push('--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture='+audioRoot+(mode==='voice'?'universal-one-safari-20261109/hardware-voice.wav':'universal-one-quantum-20261109/dictation-input.wav'));
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args});
assert(execFileSync('ps',['-p',String(server.process().pid),'-o','command='],{encoding:'utf8'}).includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());let context,page,timer,admitted=0;
try{
 context=await browser.newContext({viewport:{width:1440,height:1000},permissions:mode==='text'?[]:['microphone']});
 await context.addInitScript(()=>{const PC=RTCPeerConnection;window.qaVoiceEvents=[];window.RTCPeerConnection=class extends PC{createDataChannel(...a){const c=super.createDataChannel(...a),send=c.send.bind(c);let responses=0;c.send=v=>{const m=JSON.parse(v);if(m.type==='response.create'){if(++responses>3){window.UniversalOneResearch?.close();return;}m.response={...m.response,max_output_tokens:700};}return send(JSON.stringify(m));};c.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.type==='response.done'||m.type.includes('transcription')||m.type.startsWith('output_audio_buffer'))window.qaVoiceEvents.push({type:m.type,transcript:m.transcript,status:m.response?.status,usage:m.response?.usage});});return c;}};});
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());if(req.resourceType()==='media'&&!u.hostname.endsWith('openai.com'))return route.abort();
  if(u.hostname==='informatics-universal-one-staging.universalmind.workers.dev'){
   if(['/quantum/question','/agent/start'].includes(u.pathname)||req.method()==='POST'&&u.pathname.startsWith('/agent/'))return route.abort();
   if(['/research','/quantum/command'].includes(u.pathname)&&req.method()==='POST'){
    if(++admitted>2)return route.abort();const ledger=await load(),ceiling=Math.min(.95,ledger.limitUSD-ledger.calls.reduce((n,c)=>n+c.chargedUpperUSD,0));assert(ceiling>0);const id=await reserve(ceiling,u.pathname);
    const response=await route.fetch({headers:{...req.headers(),'X-Research-QA-Max-USD':String(ceiling)},timeout:240000}),body=await response.json();report.responses.push({path:u.pathname,status:response.status(),body});
    const spend=body.qaSpend||body.usage?.qaSpend;if(spend&&spend.chargedUpperUSD<=ceiling)await settle(id,spend.chargedUpperUSD);
    return route.fulfill({response});
   }
  }return route.continue();
 });
 page=await context.newPage();page.on('response',r=>{if(r.url().includes('workers.dev')||r.url().includes('/realtime/calls'))report.network.push({path:new URL(r.url()).pathname,status:r.status()});});
 await page.goto('https://staging.universalmind.tv/informatics/quantum/',{waitUntil:'domcontentloaded'});const f=page.frameLocator('#quantum-frame');await f.locator('#ask-button:enabled').waitFor();
 if(mode==='text'){
  await f.locator('#question').fill(caseName==='normal'?'Explore CD38 and its connection to oxytocin. What does the evidence show, and what are its limits?':'Explore CD38. This is a connection test: first search PubMed and Europe PMC for CD38 oxytocin. Then call Perplexity Search once to check original publisher pages for publication details or corrections missing from those search records. Briefly report whether each connection returned sources and cite one result from each retrieval. Do not call the Opus agent or run a study.');await f.locator('#ask-button').click();
 }else if(mode==='dictation'){
  await reserve(.01,'dictation');await f.locator('#chat-dictate').click();await f.locator('#chat-waveform').waitFor({state:'visible'});await page.waitForFunction(()=>UniversalOneResearch.getState().waveform.level>.01);await page.waitForTimeout(8500);const transcription=page.waitForResponse(r=>new URL(r.url()).pathname==='/transcribe',{timeout:60000});await f.locator('#chat-dictate').click();const transcribed=await transcription;assert.equal(transcribed.status(),200);await page.waitForFunction(()=>!UniversalOneResearch.getState().busy&&!!document.getElementById('quantum-frame')?.contentDocument.querySelector('#question')?.value.trim(),{},{timeout:60000});report.transcript=await f.locator('#question').inputValue();assert.match(report.transcript,/progress/i);await f.locator('#ask-button').click();
 }else{
  await reserve(.6,'live voice: 60 seconds, at most three 700-token responses');timer=setTimeout(()=>page.evaluate(()=>UniversalOneResearch.close()).catch(()=>{}),60000);await f.locator('#chat-voice').click();await page.waitForFunction(()=>UniversalOneResearch.getState().live.active,undefined,{timeout:45000});await f.locator('#chat-waveform').waitFor({state:'visible'});assert.equal(await page.locator('.uo-dock').isVisible(),false);
 }
 await f.locator('.chat-message[data-role=assistant]').last().waitFor({timeout:180000});
 if(mode==='voice'){await page.waitForFunction(()=>document.getElementById('quantum-frame').contentDocument.querySelectorAll('.chat-message[data-role=assistant]').length>=2&&!UniversalOneResearch.getState().live.pending&&!UniversalOneResearch.getState().live.playing,undefined,{timeout:60000});await page.waitForFunction(()=>window.qaVoiceEvents.some(x=>x.type==='output_audio_buffer.started'),undefined,{timeout:55000});report.voiceEvents=await page.evaluate(()=>window.qaVoiceEvents);assert(report.network.some(x=>x.path==='/v1/realtime/calls'&&[200,201].includes(x.status)));}
 report.answer=await f.locator('.chat-message[data-role=assistant]').last().innerText();assert(report.answer.length>20);assert(report.responses.length>0&&report.responses.every(r=>r.status===200));
 if(mode==='text'){const result=report.responses.find(r=>r.path==='/research')?.body;if(caseName==='normal'){assert(result?.sources.length>0);assert(!/Perplexity|source_unavailable|redirect.configuration|connection.test|tool.{0,15}(?:called|invoked)|(?:search|retrieval).{0,15}successful/i.test(report.answer),'Ordinary research replies need scientific findings, not transport diagnostics');}else{assert(result?.sources.some(s=>s.dataRecord?.tool==='search_literature'));assert(result?.sources.some(s=>s.dataRecord?.tool==='search_literature_fallback'),'A cited Perplexity Search receipt is required');}report.sourceRecords=result.sources.filter(s=>s.dataRecord).map(s=>({label:s.label,url:s.url,schema:s.dataRecord.schema,tool:s.dataRecord.tool}));}
 await f.locator('#ask').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/staging-live-'+caseName+'.png'});report.passed=true;
}finally{
 clearTimeout(timer);if(page){await page.evaluate(()=>UniversalOneResearch?.close()).catch(()=>{});for(const f of page.frames())await f.evaluate(()=>document.querySelectorAll('audio,video').forEach(x=>x.pause())).catch(()=>{});}await context?.close();await browser.close();await server.close();await fs.writeFile(out+'/staging-live-'+caseName+'.json',JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({mode,passed:report.passed,network:report.network,sourceRecords:report.sourceRecords}));
