import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {orbitPose} from '../lab/orbit.mjs';
import {storyFrame,STORY_END} from '../lab/story.mjs';
import * as THREE from '../lab/vendor/three.module.js';
import {createCrowd} from '../lab/crowd.mjs';
import {createPerformance} from '../lab/performance.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),live=process.argv.includes('--live'),origin='https://staging.universalmind.tv';
const out=live?path.join(root,'documents/universal-mind-lab/qa/orbit-stage'):'/private/tmp/um-lab-orbit-qa';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[];
for(const phone of [false,true]){let last=orbitPose(0,phone);for(let t=.05;t<=24;t+=.05){const p=orbitPose(t,phone);assert(p.position.every(Number.isFinite));assert(Math.hypot(...p.position.map((n,i)=>n-last.position[i]))<5,'Camera path remains continuous');last=p;}assert.deepEqual(orbitPose(24,phone).position,phone?[102,90,134]:[65,51,82]);}
assert.equal(storyFrame(78).phase,'orbit');assert.equal(storyFrame(STORY_END).phase,'night');
const crowd=createCrowd(THREE),face=crowd.visitors.children.find(m=>m.geometry.type==='SphereGeometry'),a=new THREE.Matrix4(),b=new THREE.Matrix4(),head=new THREE.Vector3(),nose=new THREE.Vector3();
for(let i=0;i<56;i++){face.getMatrixAt(i*4,a);face.getMatrixAt(i*4+1,b);head.setFromMatrixPosition(a);nose.setFromMatrixPosition(b);const front=nose.sub(head).normalize(),toward=new THREE.Vector3(-head.x,0,-18.4-head.z).normalize();assert(front.dot(toward)>.98,'Dancers face the band');}
const performance=createPerformance(THREE);assert.deepEqual(performance.group.userData.roles,['DJ','Vocalist','Guitarist','Drummer']);performance.update(10,true);performance.group.traverse(o=>{if(o.isMesh)assert(o.position.toArray().every(Number.isFinite));});checks.push('Continuous desktop/mobile camera curve; all 56 dancers face the stage; four articulated performance roles');
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
async function context(viewport={width:1440,height:1000},reducedMotion='no-preference'){
 const c=await browser.newContext({viewport,reducedMotion,serviceWorkers:'block'});
 await c.addInitScript(()=>{Object.defineProperty(window,'Hls',{get:()=>undefined,set(){},configurable:true});HTMLMediaElement.prototype.canPlayType=()=> 'probably';HTMLMediaElement.prototype.play=()=>Promise.reject(new Error('Muted layout check'));
 Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true});Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});Object.defineProperty(Element.prototype,'webkitRequestFullscreen',{value:undefined,configurable:true});});
 if(!live)await c.route(origin+'/**',async r=>{const u=new URL(r.request().url());if(u.pathname==='/events/')return r.fulfill({body:fs.readFileSync(path.join(root,'events/choice.php'),'utf8').replace(/<\?php[\s\S]*?\?>/g,''),contentType:'text/html'});const f=path.join(root,u.pathname.slice(1)+(u.pathname.endsWith('/')?'index.html':''));if(fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.abort();});
 const p=await c.newPage();await p.clock.install();p.on('pageerror',e=>errors.push(e.message));return {c,p};
}
async function close(c){for(const p of c.pages())for(const f of p.frames())await f.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await c.close();}
async function at(p,t){const now=Number(await p.locator('body').getAttribute('data-story-time'));if(t>now)await p.clock.fastForward((t-now)*1000);await p.clock.runFor(50);}
try{
 const {c,p}=await context();
 try{
  await p.goto(origin+'/lab/?launch=1');await p.waitForFunction(()=>document.body.dataset.ready==='true');await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now()+5000)));
  assert.equal(await p.locator('body').getAttribute('data-entered'),'true');assert.equal(await p.locator('#landing').isVisible(),false);assert.equal(await p.locator('#video-opacity').inputValue(),'7');assert.equal(await p.locator('#fullscreen-status').isVisible(),false);
  await at(p,81);assert.equal(await p.locator('body').getAttribute('data-cinematic'),'true');assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');await p.screenshot({path:path.join(out,'stage-front.png')});
  for(const [t,name] of [[83.5,'apple'],[88.5,'behind-stage'],[93,'video-trailers'],[95,'rear-trailer'],[96.5,'playground']]){await at(p,t);await p.screenshot({path:path.join(out,name+'.png')});}
  await at(p,103);assert.equal(await p.locator('body').getAttribute('data-story'),'complete');assert.equal(await p.locator('body').getAttribute('data-cinematic'),'false');assert.equal(await p.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'visible');
  assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'false');await p.locator('#lineup-toggle').click({force:true});assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'true');await p.locator('#lineup-toggle').click({force:true});assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'false');
  await p.locator('[data-view="main"]').click({force:true});await p.clock.fastForward(1400);await p.clock.runFor(50);await p.locator('#interior-view').click({force:true});await p.clock.fastForward(1400);await p.clock.runFor(50);await p.screenshot({path:path.join(out,'band.png')});
  await p.locator('#replay-story').click({force:true});await at(p,84);await p.locator('#scene canvas').press('ArrowLeft');assert.equal(await p.locator('body').getAttribute('data-cinematic'),'false');await at(p,89);assert.equal(await p.locator('body').getAttribute('data-cinematic'),'false');
  checks.push('Direct launch with 7% blend; complete orbit and labels restored; Lineup show/hide; replay and manual camera interruption');
  if(live){const hashes=[];for(const f of ['lab/lab.mjs','lab/performance.mjs','lab/orbit.mjs','lab/media.mjs','lab/story.mjs','lab/crowd.mjs','lab/lab.css','lab/index.html']){const response=await p.request.get(origin+'/'+f+'?qa=orbit',{headers:{'Cache-Control':'no-cache'}});assert.equal(response.status(),200);const digest=createHash('sha256').update(await response.body()).digest('hex');assert.equal(digest,createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex'));hashes.push({file:f,sha256:digest});}fs.writeFileSync(path.join(out,'source-hashes.json'),JSON.stringify(hashes,null,2));}
 }finally{await close(c);}
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){const {c,p}=await context(viewport,'reduce');try{await p.goto(origin+'/lab/?launch=1');await p.waitForFunction(()=>document.body.dataset.ready==='true');await p.clock.pauseAt(new Date(await p.evaluate(()=>Date.now()+5000)));await at(p,103);await p.locator('#emotion-close').click({force:true}).catch(()=>{});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.locator('#lineup-toggle').scrollIntoViewIfNeeded();assert(await p.locator('#lineup-toggle').isVisible());await p.screenshot({path:path.join(out,'lab-'+viewport.width+'.png')});}finally{await close(c);}}
 checks.push('Phone and landscape layout; reduced-motion skips camera circuit');
 // Simulate an already-fullscreen ancestor without invoking native fullscreen.
 const {c:fc,p:fp}=await context();try{
  await fc.route(origin+'/qa-fullscreen-shell',r=>r.fulfill({contentType:'text/html',body:`<script>Object.defineProperty(document,'fullscreenElement',{get:()=>document.documentElement});window.UniversalMindEntry={fullscreenActive:()=>true};</script><iframe src="/lab/?launch=1" style="width:100%;height:900px"></iframe>`}));
  await fp.goto(origin+'/qa-fullscreen-shell');const f=fp.frameLocator('iframe');await f.locator('body[data-ready="true"]').waitFor();assert.equal(await f.locator('#fullscreen-toggle').getAttribute('aria-pressed'),'true');assert.equal(await f.locator('#fullscreen-status').isVisible(),false);checks.push('Already-fullscreen root owner recognized, with no duplicate request or blank notice');
 }finally{await close(fc);}
 if(!live)for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){const {c,p}=await context(viewport);try{await p.goto(origin+'/events/?experience=1');await p.locator('[data-rain-status="running"]').waitFor();assert.equal(await p.locator('.event-option img').count(),0);assert.equal(await p.locator('.event-option').count(),2);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:path.join(out,'events-'+viewport.width+'.png')});}finally{await close(c);}}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({live,date:new Date().toISOString(),processMuted:true,nativeFullscreenInvoked:false,playbackMocked:true,checks,errors},null,2)+'\n');console.log(checks.join('\n'));
}finally{await browser.close();await server.close();}
