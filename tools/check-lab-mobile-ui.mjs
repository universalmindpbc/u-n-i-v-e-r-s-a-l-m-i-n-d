import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const live=process.argv.includes('--live'),origin='https://staging.universalmind.tv';
const out=live?path.join(root,'documents/universal-mind-lab/qa/mobile-ui'):'/private/tmp/um-lab-mobile-ui-qa';
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],hashes=[];
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
async function at(p,t){const now=Number(await p.locator('body').getAttribute('data-story-time'));if(t>now)await p.clock.fastForward((t-now)*1000);await p.clock.runFor(60);}
async function visibleBounds(p,selector){
 const e=p.locator(selector);assert(await e.isVisible(),selector+' visible');
 const r=await e.boundingBox(),v=p.viewportSize();
 assert(r.x>=-1&&r.y>=-1&&r.x+r.width<=v.width+1&&r.y+r.height<=v.height+1,selector+' inside viewport '+JSON.stringify(r));
 return r;
}
try{
 for(const viewport of [{width:390,height:844},{width:320,height:668},{width:430,height:932},{width:844,height:390},{width:1440,height:1000}].filter(v=>!process.env.QA_WIDTH||v.width===Number(process.env.QA_WIDTH))){
  const phone=viewport.width<1000;
  const c=await browser.newContext({viewport,isMobile:phone,hasTouch:phone,serviceWorkers:'block'});
  try{
   await c.addInitScript(()=>{
    Object.defineProperty(window,'Hls',{get:()=>undefined,set(){},configurable:true});
    HTMLMediaElement.prototype.canPlayType=()=> 'probably';
    HTMLMediaElement.prototype.play=()=>Promise.reject(new Error('Non-playback interface check'));
    Element.prototype.requestFullscreen=()=>{throw new Error('Native fullscreen is excluded from QA');};
    Element.prototype.webkitRequestFullscreen=undefined;
   });
   if(!live)await c.route(origin+'/**',async r=>{const u=new URL(r.request().url()),f=path.join(root,u.pathname.slice(1)+(u.pathname.endsWith('/')?'index.html':''));if(fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.abort();});
   const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+5000));await p.goto(origin+'/lab/?launch=1');
   await p.waitForFunction(()=>document.body.dataset.ready==='true');
   await p.waitForFunction(()=>document.querySelector('#mobile-options').childElementCount>0||innerWidth>1000);
   assert.equal(await p.locator('#video-opacity').inputValue(),'7');
   assert.equal(await p.locator('#fullscreen-status').isVisible(),false);
   assert(await p.locator('#music-symbol svg').count());
   assert(!await p.locator('button,a').evaluateAll(nodes=>nodes.some(n=>/[▶⏯⏸↗↺◐▦⌖◇]/u.test(n.textContent))));
   for(const sel of ['#music-toggle','#video-toggle','#mix-toggle','#replay-story','#about-open']){
    const r=await visibleBounds(p,sel);if(phone)assert(r.height>=44&&r.width>=44,sel+' touch area');
   }
   // Verify both designed playback states without starting media.
   await p.locator('#music-video').evaluate(v=>v.dispatchEvent(new Event('playing')));
   assert.equal(await p.locator('#music-toggle').getAttribute('aria-label'),'Pause music');
   assert(await p.locator('#music-symbol svg path').count());
   await p.locator('#music-video').evaluate(v=>v.dispatchEvent(new Event('pause')));
   await at(p,31.5);
   for(const sel of ['#place-list','.view-tools','#labels'])assert.equal(await p.locator(sel).isVisible(),!phone,sel+' responsive visibility');
   if(phone){
    assert.equal(await p.locator('#motion-toggle').isVisible(),false);
    await p.locator('#mix-toggle').click();await visibleBounds(p,'#mix-panel');
    await p.locator('#lineup-toggle').click();assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'false');
    await p.locator('#lineup-toggle').click();assert.equal(await p.locator('#artist-lineup').getAttribute('aria-hidden'),'true');
    const before=await p.locator('#motion-toggle').getAttribute('aria-pressed');await p.locator('#motion-toggle').click();assert.notEqual(await p.locator('#motion-toggle').getAttribute('aria-pressed'),before);
    await p.locator('#mix-close').click();assert.equal(await p.locator('#mix-panel').isVisible(),false);
    await p.locator('#replay-story').click();await at(p,31.5);
   }
   await p.screenshot({path:path.join(out,`day-${viewport.width}.png`)});
   for(const t of [46,62,73]){await at(p,t);if(phone)assert.equal(await p.locator('#place-card').isVisible(),false,'Automatic tour leaves mobile scene unobscured');}
   await at(p,103);await p.clock.runFor(1600);
   if(await p.locator('#emotion-panel').isVisible())await p.locator('#emotion-close').click();
   for(const sel of ['#place-list','.view-tools','#labels'])assert.equal(await p.locator(sel).isVisible(),!phone);
   await visibleBounds(p,'.research-link');await visibleBounds(p,'.membership');await visibleBounds(p,'#emotion-toggle');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const overlaps=await p.evaluate(()=>{
    const selectors=['.masthead','.intro','#artist-lineup','#emotion-toggle','.explore-bar'];
    const nodes=selectors.map(s=>({s,e:document.querySelector(s)})).filter(({e})=>getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).opacity!=='0');
    return nodes.flatMap(({s,e},i)=>nodes.slice(i+1).flatMap(({s:t,e:f})=>{const a=e.getBoundingClientRect(),b=f.getBoundingClientRect();return Math.min(a.right,b.right)>Math.max(a.left,b.left)+1&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+1?[[s,t]]:[];}));
   });assert.deepEqual(overlaps,[],'Primary overlays have separate space');
   await p.screenshot({path:path.join(out,`night-${viewport.width}.png`)});
   await p.locator('#emotion-toggle').click();await visibleBounds(p,'#emotion-panel');
   await p.locator('[data-connection="earth"]').click();assert.match(await p.locator('#connection-cue').textContent(),/feet on the ground/);
   await p.locator('#support-pathway').click();assert.match(await p.locator('#place-title').textContent(),/Support/);await visibleBounds(p,'#place-card');
   await p.locator('#place-close').click();
   await p.locator('#about-open').click();await visibleBounds(p,'#vision');assert.match(await p.locator('#vision').textContent(),/youth aged 16–24/);await p.locator('#about-close').click();
   checks.push(`${viewport.width} × ${viewport.height}: drawn controls, responsive visibility, automatic tour, settings, lineup, biofeedback, support and proposal verified`);
   console.log(checks.at(-1));
   if(live&&viewport.width===1440)for(const file of ['lab/index.html','lab/lab.css','lab/lab.mjs','lab/media.mjs','lab/icons.mjs','lab/research.html','lab/research.css']){
    const res=await p.request.get(origin+'/'+file+'?qa=mobile-20261103',{headers:{'Cache-Control':'no-cache'}});assert.equal(res.status(),200);
    const sha256=createHash('sha256').update(await res.body()).digest('hex');assert.equal(sha256,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'));hashes.push({file,sha256});
   }
  }finally{for(const p of c.pages())await p.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await c.close();}
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({date:new Date().toISOString(),live,processMuted:true,playbackMocked:true,nativeFullscreenInvoked:false,physicalIPhoneTested:false,checks,hashes,errors},null,2)+'\n');
}finally{await browser.close();await server.close();}
