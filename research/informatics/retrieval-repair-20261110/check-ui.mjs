import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium,webkit} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(import.meta.dirname,'../../..'),out=import.meta.dirname,live=process.env.LIVE==='1',checks=[];
const voiceStub=`window.UniversalOneLive=o=>{let active=false,muted=false,mic;return{setVisible(){},getState:()=>({active,muted,microphone:active,connected:active,inputEnabled:active&&!muted}),async start(){active=true;mic=await navigator.mediaDevices.getUserMedia({audio:true});o.onMicrophone(mic);o.onState('listening','Listening…');},end(){active=false;mic?.getTracks().forEach(t=>t.stop());o.onMicrophone(null);},toggleMute(){muted=!muted;o.onState(muted?'muted':'listening',muted?'Microphone muted':'Listening…');},interrupt(){o.onState('listening','Listening…');}}};`;
for(const engine of (process.env.ENGINE?[process.env.ENGINE]:['chromium','webkit'])){
 const server=engine==='chromium'?await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']}):null;
 if(server)assert(execFileSync('ps',['-p',String(server.process().pid),'-o','command='],{encoding:'utf8'}).includes('--mute-audio'));
 const browser=server?await chromium.connect(server.wsEndpoint()):await webkit.launch({headless:true});
 try{for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000}}),errors=[];
  await context.addInitScript(()=>{
   HTMLMediaElement.prototype.play=()=>Promise.reject(Error('Playback blocked by QA'));
   Object.defineProperty(Object.getPrototypeOf(navigator.mediaDevices),'getUserMedia',{configurable:true,value:async()=>{window.qaStage='creating context';const c=new AudioContext(),osc=c.createOscillator(),gain=c.createGain(),dest=c.createMediaStreamDestination();osc.connect(gain);gain.connect(dest);gain.gain.value=0;osc.start();window.qaStage='resuming context';await c.resume();window.qaStage='stream ready';window.qaGain=gain;window.qaStreams??=[];window.qaStreams.push(dest.stream);for(const track of dest.stream.getTracks()){const stop=track.stop.bind(track);track.stop=()=>{stop();c.close();};}return dest.stream;}});
  });
  await context.route('**/*',async r=>{
   const q=r.request(),u=new URL(q.url());if(q.resourceType()==='media')return r.abort();
   if(u.pathname.endsWith('/universal-one-live.js'))return r.fulfill({body:voiceStub,contentType:'text/javascript'});
   if(u.pathname.endsWith('/astra-session.php'))return r.fulfill({json:{token:btoa(JSON.stringify({exp:Date.now()/1000+3600}))+'.fixture'}});
   if(u.hostname.startsWith('informatics-universal-one-staging')){
    if(u.pathname==='/agent/demo/access')return r.fulfill({json:{authenticated:false,credit:0,available:true,study:null}});
    if(u.pathname==='/transcribe')return r.fulfill({json:{text:'Explore SLC6A4.'}});
    if(q.method()==='POST')return r.abort();
   }
   if(!live&&u.origin==='https://staging.universalmind.tv'&&u.pathname.startsWith('/informatics/')){
    let rel=u.pathname.slice(13);if(u.pathname==='/informatics/quantum/'&&!u.searchParams.has('embedded'))rel='chapters/quantum.html';else if(rel.endsWith('/'))rel+='index.html';
    if(/\.(js|css|html)$/.test(rel)){try{return r.fulfill({body:await fs.readFile(path.join(root,'Informatics',rel)),contentType:rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':'text/html'});}catch{}}
   }return r.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://staging.universalmind.tv/informatics/quantum/');
  const f=page.frameLocator('#quantum-frame');await f.locator('#ask-button:enabled').waitFor().catch(async e=>{console.log(JSON.stringify({errors,frames:page.frames().map(f=>f.url()),parent:await page.evaluate(()=>({one:!!window.UniversalOneResearch,live:typeof window.UniversalOneLive}))}));throw e;});
  const diagram=await f.locator('#workflow').evaluate(n=>{const before=n.getBoundingClientRect().height,card=n.querySelector('.literature-support').getBoundingClientRect(),flow=n.querySelector('.live-flow').getBoundingClientRect();const style=document.createElement('style');style.textContent='.literature-support{display:none!important}@media(max-width:900px){.scientific-review-rail{gap:20px!important;padding-bottom:25px!important;margin-bottom:30px!important}.review-phase{margin-top:2px!important}}';document.head.append(style);const original=n.getBoundingClientRect().height;style.remove();return {height:before,originalHeight:original,cardClearOfMainFlow:card.bottom<=flow.top,cardVisible:card.height>0,phaseLabelsClear:[...n.querySelectorAll(".review-phase")].every(x=>{const r=x.getBoundingClientRect();return r.bottom<=card.top||r.top>=card.bottom||r.right<=card.left||r.left>=card.right;})};});
  assert(Math.abs(diagram.height-diagram.originalHeight)<1,'Flowchart height is unchanged');assert(diagram.cardClearOfMainFlow);assert(diagram.cardVisible);assert(diagram.phaseLabelsClear);
  assert.equal(await f.locator('#question').getAttribute('placeholder'),'Ask a question, refine an idea, or ask me to run a study...');
  assert.deepEqual(await f.locator('[data-gene]').allTextContents(),['OXTR','SLC6A4','DRD2','NMDAR','IL6','DOCK2','NR3C1','CD38']);
  await f.locator('[data-gene=NMDAR]').click();assert.equal(await f.locator('#question').inputValue(),'Explore NMDA receptor genes.');
  for(const mode of ['black','white','video']){
   await f.locator('[data-quantum-background='+mode+']').click();
   assert.equal(await f.locator('html').getAttribute('data-reading-background'),mode);
   assert.equal(await page.locator('html').getAttribute('data-quantum-reading'),mode);
   assert.equal(await page.locator('#film').evaluate(n=>getComputedStyle(n).visibility),mode==='video'?'visible':'hidden');
   await f.locator('#ask').scrollIntoViewIfNeeded();
   await page.screenshot({path:out+'/'+(live?'staging':'candidate')+'-'+engine+'-'+width+'-'+mode+'.png'});
   assert(await f.locator('body').evaluate(n=>n.scrollWidth<=innerWidth+1),'No horizontal overflow');
   if(mode==='white'&&engine==='chromium')await f.locator('#workflow').screenshot({path:out+'/'+(live?'staging':'candidate')+'-diagram-'+width+'.png'});
   if(mode==='white'&&engine==='chromium'&&width===1440){for(const id of ['workflow','completed-study','access']){await f.locator('#'+id).scrollIntoViewIfNeeded();await page.screenshot({path:out+'/'+(live?'staging':'candidate')+'-white-'+id+'.png'});}await f.locator('#step-classical').click();await f.locator('#results-dialog').waitFor({state:'visible'});await page.screenshot({path:out+'/'+(live?'staging':'candidate')+'-white-results.png'});await f.locator('#results-dialog').press('Escape');}
  }
  await f.locator('[data-quantum-background=white]').click();await page.reload();await f.locator('#ask-button:enabled').waitFor();assert.equal(await f.locator('html').getAttribute('data-reading-background'),'white');
  await f.locator('#chat-dictate').click();await f.locator('#chat-waveform').waitFor({state:'visible'}).catch(async e=>{console.log(JSON.stringify({engine,width,status:await f.locator('#question-status').textContent(),state:await page.evaluate(()=>({...UniversalOneResearch.getState(),qaStage:window.qaStage,micFunction:String(navigator.mediaDevices.getUserMedia).slice(0,100)})),errors}));throw e;});
  await page.waitForFunction(()=>window.UniversalOneResearch.getState().waveform.active);
  const before=await f.locator('#chat-waveform').evaluate(n=>n.toDataURL());await page.evaluate(()=>window.qaGain.gain.value=.25);
  await page.waitForFunction(()=>window.UniversalOneResearch.getState().waveform.level>.05);
  const after=await f.locator('#chat-waveform').evaluate(n=>n.toDataURL());assert.notEqual(before,after,'Waveform responds to microphone signal');
  await page.screenshot({path:out+'/'+(live?'staging':'candidate')+'-'+engine+'-'+width+'-dictation.png'});
  await f.locator('#chat-dictate').click();await page.waitForFunction(()=>!window.UniversalOneResearch.getState().microphone);
  await f.locator('#question').filter({visible:true}).waitFor();await page.waitForFunction(()=>!window.UniversalOneResearch.getState().busy);
  await page.waitForFunction(()=>document.querySelector('#quantum-frame')?.contentDocument?.querySelector('#question')?.value==='Explore SLC6A4.');assert.equal(await f.locator('#question').inputValue(),'Explore SLC6A4.');assert.equal(await f.locator('#chat-waveform').isVisible(),false);
  await f.locator('#chat-voice').click();await f.locator('#chat-waveform').waitFor({state:'visible'});assert.equal(await page.locator('.uo-dock').isVisible(),false);await f.locator('#chat-mute').click();assert.equal(await f.locator('#chat-mute').getAttribute('aria-pressed'),'true');
  await f.locator('#chat-voice').click();assert.equal(await f.locator('#chat-waveform').isVisible(),false);assert.equal(await page.locator('.uo-panel').isVisible(),false);
  assert(await page.evaluate(()=>window.qaStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))),'All synthetic microphones released');
  assert.deepEqual(errors,[]);checks.push({engine,width,diagram,themes:3,preferencePersists:true,originalPlaceholder:true,candidates:8,signalWaveform:true,inlineVoice:true,microphonesReleased:true,errors});await context.close();
 }}finally{await browser.close();if(server)await server.close();}
}
await fs.writeFile(out+'/'+(live?'staging':'candidate')+'-ui'+(process.env.ENGINE?'-'+process.env.ENGINE:'')+'.json',JSON.stringify({passed:true,controlledVoiceAndTranscription:true,checks},null,2));console.log(JSON.stringify(checks));
