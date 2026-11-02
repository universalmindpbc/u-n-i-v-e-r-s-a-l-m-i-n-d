import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),local=process.env.LAB_QA_SOURCE_LOCAL==='1';
const out=local?'/private/tmp/um-lab-river-qa':path.join(root,'documents/universal-mind-lab/qa/river-biofeedback');fs.mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),errors=[],failed=[],checks=[];
const url='https://staging.universalmind.tv/lab/';
async function setup(viewport,reducedMotion='reduce'){
 const c=await browser.newContext({viewport,reducedMotion,serviceWorkers:'block'});
 await c.addInitScript(()=>{
  Object.defineProperty(window,'Hls',{get:()=>undefined,set(){},configurable:true});HTMLMediaElement.prototype.canPlayType=()=> 'probably';HTMLMediaElement.prototype.play=()=>Promise.reject(new Error('Silent layout QA'));
  Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true});Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});Object.defineProperty(Element.prototype,'webkitRequestFullscreen',{value:undefined,configurable:true});
 });
 if(local)await c.route(url+'**',r=>r.fulfill({path:path.join(root,'lab',new URL(r.request().url()).pathname.slice(5)||'index.html')}));
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
 await p.goto(url,{waitUntil:'networkidle'});await p.waitForFunction(()=>document.body.dataset.ready==='true');
 assert.equal((await p.locator('#landing').innerText()).trim(),'universal mind lab\nLaunch Full Screen');
 await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+100));await p.locator('#explore-enter').click({force:true});await p.clock.runFor(100);
 return {c,p};
}
async function at(p,t){const now=Number(await p.locator('body').getAttribute('data-story-time'));if(t>now)await p.clock.fastForward((t-now)*1000);await p.clock.runFor(100);}
async function click(p,s){await p.locator(s).click({force:true});await p.clock.runFor(100);}
async function contentFit(p){return p.locator('#emotion-panel').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,overflow:e.scrollHeight>e.clientHeight+2}));}
try{
 const {c,p}=await setup({width:1440,height:1000});
 assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'false');assert.ok(await p.locator('.proposal-status').isVisible());assert.equal(await p.locator('.proposal-status').count(),1);
 assert.deepEqual(await p.locator('.artist-mark').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label'))),['Tame Impala','Justice','Flume','Sampa the Great']);
 await p.clock.runFor(800);await p.screenshot({path:path.join(out,'opening-day.png')});
 await at(p,7);assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'true');
 await at(p,39);assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'true');
 await at(p,44);assert.equal(await p.locator('body').getAttribute('data-camera-view'),'main');assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'true');
 await at(p,79);await p.clock.runFor(800);assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'false');assert.equal(await p.locator('body').getAttribute('data-night'),'true');
 assert.equal(await p.locator('.artist-lineup').evaluate(e=>getComputedStyle(e).color),'rgb(241, 239, 224)');
 assert.equal(await p.locator('#emotion-panel .eyebrow').innerText(),'MINDFULNESS IN MOTION VIA BIOFEEDBACK');
 assert.deepEqual(await p.locator('.response-ends span').allTextContents(),['Anxiety','Peace of mind']);
 for(const [key,label,cue] of [['earth','Connection to our earth','feet on the ground'],['self','Connection to self','breath'],['others','Connection to each other','people around you']]){
  await click(p,`[data-connection="${key}"]`);assert.equal(await p.locator('#response-state').innerText(),label);assert.ok((await p.locator('#connection-cue').innerText()).includes(cue));assert.equal(await p.locator(`[data-connection="${key}"]`).getAttribute('aria-pressed'),'true');
 }
 await p.screenshot({path:path.join(out,'desktop-panel-check.png')});const fit=await contentFit(p);assert.equal(fit.overflow,false,'Desktop biofeedback content fits '+JSON.stringify(fit));
 await p.screenshot({path:path.join(out,'final-night.png')});
 await click(p,'#plan-toggle');assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'true');await click(p,'#plan-toggle');assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'false');
 await click(p,'[data-view="river"]');assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'true');
 await click(p,'#reset-view');await p.clock.runFor(800);assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'false');
 if(await p.locator('#emotion-panel').isVisible())await click(p,'#emotion-close');await click(p,'#night-toggle');await click(p,'#motion-toggle');
 assert.equal(await p.locator('body').getAttribute('data-river-flow'),'downstream');
 const before=Number(await p.locator('body').getAttribute('data-river-time'));
 const clip={x:1130,y:310,width:250,height:400};const a=await p.screenshot({clip,path:path.join(out,'river-flow-a.png')});await p.clock.runFor(1800);const b=await p.screenshot({clip,path:path.join(out,'river-flow-b.png')});
 assert.ok(Number(await p.locator('body').getAttribute('data-river-time'))>before+1);assert.notEqual(createHash('sha256').update(a).digest('hex'),createHash('sha256').update(b).digest('hex'));
 await click(p,'#motion-toggle');const frozen=await p.locator('body').getAttribute('data-river-time');await p.clock.runFor(800);assert.equal(await p.locator('body').getAttribute('data-river-time'),frozen);
 checks.push('Opening and final overview lineup; hidden during construction, tour and close views; charcoal/ivory treatment; single visible footer disclosure; ordered connection controls and grounding cues; moving water pixels and elapsed flow; Motion freezes the river');
 const files=['index.html','lab.css','lab.mjs','media.mjs','assets/lineup/tame-impala.svg','assets/lineup/justice.svg','assets/lineup/flume.svg','assets/lineup/sampa-the-great.svg'];const hashes=[];
 for(const file of files){const result=await p.evaluate(async file=>{const r=await fetch(new URL(file,location.href),{cache:'reload'}),bytes=await r.arrayBuffer();return {file,status:r.status,sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('')};},file);assert.equal(result.status,200);assert.equal(result.sha256,createHash('sha256').update(fs.readFileSync(path.join(root,'lab',file))).digest('hex'));hashes.push(result);}
 await click(p,'#about-open');assert.ok(await p.locator('#vision').isVisible());
 for(const text of ['Life Be In It','16–24','CSIRO technology','Participation is free','onward referrals','STEAM','fashion label','Change your emotions. Change your world.'])assert.ok((await p.locator('#vision').innerText()).includes(text));
 assert.equal(await p.locator('.proposal-journey li').count(),3);await p.screenshot({path:path.join(out,'proposal-desktop.png')});await click(p,'#about-close');checks.push('Proposal narrative: travelling mental health lab, free access, stigma, referral pathways, STEAM, fashion and Apple Watch biofeedback');
 await c.close();
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1920,height:1080}]){
  const {c,p}=await setup(viewport);await p.clock.runFor(800);await p.screenshot({path:path.join(out,`opening-${viewport.width}.png`)});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),true);
  const logos=await p.locator('#artist-lineup').boundingBox();assert.ok(logos.x>=0&&logos.x+logos.width<=viewport.width);
  await at(p,79);await p.clock.runFor(800);assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'false');await p.screenshot({path:path.join(out,`final-${viewport.width}.png`)});
  if(!await p.locator('#emotion-panel').isVisible())await click(p,'#emotion-toggle');
  assert.equal((await contentFit(p)).overflow,false,`${viewport.width} biofeedback content fits`);await p.screenshot({path:path.join(out,`biofeedback-${viewport.width}.png`)});
  assert.equal(await p.locator('body').getAttribute('data-river-time'),'0.000','Reduced-motion initial water stays still');
  await click(p,'#about-open');assert.ok(await p.locator('#vision').isVisible());await p.locator('.proposal-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);await p.screenshot({path:path.join(out,`proposal-end-${viewport.width}.png`)});assert.ok(await p.locator('#about-close').isVisible());await p.locator('#about-close').click();
  await c.close();
 }
 checks.push('390×844, 844×390, 1440×1000 and 1920×1080 layout; complete biofeedback panel; reduced-motion river remains still');
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 const report={url,source:local?'local at staging URL':'live staging',date:new Date().toISOString(),processMuted:true,playbackMocked:true,nativeFullscreenInvoked:false,checks,hashes,errors,httpFailures:failed};fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{for(const c of browser.contexts())for(const p of c.pages())await p.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await browser.close();await server.close();}
