import {guardedCommand} from './command-budget.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='/Users/benkorbel/Documents/m o d u l 8 i n f i n i t y/i n f o r m a t i c s/research/universal-one-quantum-20261109';
const report={processAudioMuted:true,syntheticInput:true,modes:[]};
for(const mode of ['dictation','voice']){
 const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture='+path.join(out,mode==='voice'?'voice-input.wav':'dictation-input.wav')]});
 assert(server.process().spawnargs.includes('--mute-audio'));const browser=await chromium.connect(server.wsEndpoint());let context,page;const network=[],commands=[];let admittedCommands=0,voiceTimer;
 try{
  context=await browser.newContext({viewport:{width:1440,height:1000},storageState:'/private/tmp/um-quantum-reasoning-session.json',permissions:['microphone']});
  // The interpreter uses the existing per-request spending guard. No study submission is permitted in this test.
  await context.route('https://informatics-universal-one-staging.universalmind.workers.dev/**',async route=>{
   const req=route.request(),u=new URL(req.url());
   if(u.pathname==='/quantum/question')return route.abort();
   if(u.pathname==='/quantum/command'&&++admittedCommands>1)return route.abort();
   if(u.pathname==='/quantum/command')return guardedCommand(route);
   if(u.pathname==='/research')return route.abort();
   return route.continue();
  });
  await context.addInitScript(()=>{const PC=RTCPeerConnection;window.__qaVoiceEvents=[];window.RTCPeerConnection=class extends PC{createDataChannel(...args){const c=super.createDataChannel(...args),originalSend=c.send.bind(c);let responseRequests=0;c.send=value=>{const message=JSON.parse(value);if(message.type==='response.create'&&++responseRequests>3){window.UniversalOneResearch?.close();return;}return originalSend(value);};c.addEventListener('message',e=>{const d=JSON.parse(e.data);if(d.type==='response.done'||d.type.includes('transcript')||d.type.includes('transcription')||d.type.startsWith('output_audio_buffer'))window.__qaVoiceEvents.push({type:d.type,transcript:d.transcript,status:d.response?.status,usage:d.response?.usage});});return c;}};});
  page=await context.newPage();page.on('response',async r=>{if(r.url().includes('workers.dev')||r.url().includes('/realtime/calls')){network.push({path:new URL(r.url()).pathname,status:r.status()});if(r.url().endsWith('/quantum/command'))commands.push(await r.json());}});
  await page.goto('https://staging.universalmind.tv/informatics/?entry=research&area=quantum',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.UniversalOneQuantum?.available());await page.locator('.uo .iam-realtime-voice__summon').click();
  let transcript;
  if(mode==='dictation'){
   await page.locator('.uo [data-record]').click();await page.waitForTimeout(8500);await page.locator('.uo [data-record]').click();
   await page.waitForFunction(()=>document.getElementById('uo-question').value.length>5,undefined,{timeout:30000});transcript=await page.locator('#uo-question').inputValue();assert.match(transcript,/progress/i);assert.match(transcript,/quantum/i);
   await page.locator('[data-send]').click();await page.waitForFunction(()=>document.querySelector('.uo-message[data-role=assistant]'),undefined,{timeout:90000});
  }else{
   voiceTimer=setTimeout(()=>page.evaluate(()=>window.UniversalOneResearch?.close()).catch(()=>{}),60000);await page.locator('[data-mode=voice]').click();await page.waitForFunction(()=>UniversalOneResearch.getState().live.active,undefined,{timeout:45000});
   await page.waitForFunction(()=>document.querySelector('.uo-message[data-role=user]')?.textContent.toLowerCase().includes('progress'),undefined,{timeout:55000});
   await page.waitForFunction(()=>document.querySelectorAll('.uo-message[data-role=assistant]').length>=2,undefined,{timeout:90000});
   transcript=await page.locator('.uo-message[data-role=user]').last().innerText();
   await page.waitForFunction(()=>!UniversalOneResearch.getState().live.playing&&!UniversalOneResearch.getState().live.pending,undefined,{timeout:45000});
   await page.locator('[data-mute]').click();await page.locator('.uo .iam-realtime-voice__summon').click();await page.locator('[data-transcript]').click();
  }
  const response=await page.locator('.uo-message[data-role=assistant]').last().innerText();assert.match(response,/ready|complete|finished/i);
  assert(commands.length>=1&&commands.every(x=>x.action==='status'));assert(network.some(x=>x.path.startsWith('/agent/studies/')&&x.status===200));assert(!network.some(x=>x.path==='/quantum/question'));
  await page.screenshot({path:path.join(out,'staging-'+mode+'.png')});
  const events=await page.evaluate(()=>window.__qaVoiceEvents);if(mode==='voice'){assert(events.some(x=>x.type==='output_audio_buffer.started'));assert(network.some(x=>x.path==='/v1/realtime/calls'&&x.status===201||x.path==='/v1/realtime/calls'&&x.status===200));}
  report.modes.push({mode,transcript,response,network,commands,events,newStudies:0});
 }finally{clearTimeout(voiceTimer);if(page){await page.evaluate(()=>window.UniversalOneResearch?.close()).catch(()=>{});for(const f of page.frames())await f.evaluate(()=>document.querySelectorAll('video,audio').forEach(x=>x.pause())).catch(()=>{});}await context?.close();await browser.close();await server.close();await fs.writeFile(path.join(out,'staging-voice-verification.json'),JSON.stringify(report,null,2)+'\n');}
}
console.log(JSON.stringify(report));
