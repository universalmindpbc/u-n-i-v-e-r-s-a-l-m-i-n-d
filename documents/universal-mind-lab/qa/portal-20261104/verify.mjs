import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const live=process.argv.includes('--live'),out=live?'documents/universal-mind-lab/qa/portal-20261104/live':'/private/tmp/um-portal-qa',origin='https://staging.universalmind.tv';fs.mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),results=[];
try{
 for(const vp of [{width:1440,height:900},{width:393,height:780}]){
 const context=await browser.newContext({viewport:vp,isMobile:vp.width<800,hasTouch:vp.width<800,serviceWorkers:'block',userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'});
 try{
 await context.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;HTMLMediaElement.prototype.play=function(){return Promise.resolve();};});
 const hashes=[];
 if(live)for(const f of ['index.html','lab.mjs','lab.css','portal.mjs','portal-geometry.mjs','story.mjs','orbit.mjs']){const r=await context.request.get(origin+'/lab/'+f+'?verify=portal1');assert.equal(r.status(),200);const body=await r.body();const source=f==='index.html'?Buffer.from(body.toString().replace(/<script\b[^>]*src="https:\/\/static\.cloudflareinsights\.com\/[^>]*><\/script>\n?/g,'')):body;assert(source.equals(fs.readFileSync('lab/'+f)),f+' deployed source differs');hashes.push({file:f,sha256:createHash('sha256').update(source).digest('hex'),edgeAnalyticsRemoved:f==='index.html'});}
 await context.route(origin+'/**',async r=>{const u=new URL(r.request().url()),f=path.resolve('.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));
 if(u.pathname.endsWith('/hls.min.js'))return r.fulfill({contentType:'application/javascript',body:'window.Hls=class{static isSupported(){return true}static Events={ERROR:"error"};on(){}loadSource(){}attachMedia(){}destroy(){}}'});
 if(u.pathname==='/lab/lab.mjs'){
 let source=fs.readFileSync(f,'utf8');if(live){const res=await r.fetch();assert.equal(await res.text(),source);}
 source=source.replace('createStory, ORBIT_START','createStory, storyFrame, ORBIT_START').replace("go('overview',true);resize();",`go('overview',true);resize();window.__qa={view:key=>selectPlace(key),day:()=>{story.setNight(0);syncNight(false);setNight(0);},night:()=>{story.setNight(1);syncNight(true);setNight(1);},frame:t=>{autoTourCancelled=false;applyStory(storyFrame(t));},portalStats:()=>portal.zones.map(z=>({...z.group.userData,scale:z.group.scale.toArray()})),camera:()=>({position:camera.position.toArray(),target:controls.target.toArray()}),movePortal:(x,z)=>{portal.group.position.set(x,0,z)},stats:()=>({triangles:renderer.info.render.triangles,calls:renderer.info.render.calls}),showAll:()=>{setStory({...storyFrame(160),night:0});}};`);
 return r.fulfill({contentType:'application/javascript',body:source});}
 if(!live){if(fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.abort();}return r.continue();});
 await context.route('**/*.m3u8*',r=>r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+2000));await page.goto(origin+'/lab/');await page.waitForFunction(()=>document.body.dataset.ready==='true',{},{timeout:60000});
 await page.locator('#explore-enter').click();await page.clock.fastForward(160000);await page.clock.runFor(40);
 const settle=async()=>{await page.clock.runFor(40);await page.clock.fastForward(1500);await page.clock.runFor(80);await page.waitForTimeout(800);};
 await page.evaluate(()=>window.__qa.frame(82.9));await settle();const entryCamera=await page.evaluate(()=>window.__qa.camera());await page.evaluate(()=>window.__qa.frame(83));const circuitStart=await page.evaluate(()=>window.__qa.camera());assert.deepEqual(circuitStart,entryCamera);await page.evaluate(()=>window.__qa.frame(160));await settle();
 await page.evaluate(()=>window.__qa.day());await page.evaluate(()=>window.__qa.view('overview'));await settle();await page.screenshot({path:out+'/overview-'+vp.width+'.png'});
 if(vp.width>800){await page.evaluate(()=>window.__qa.movePortal(-44,43));await settle();await page.screenshot({path:out+'/placement-near-trucks.png'});await page.evaluate(()=>window.__qa.movePortal(-34,66));await settle();await page.screenshot({path:out+'/placement-path.png'});}
 await page.locator('#about-open').click();assert(await page.locator('#portal-about').isVisible());await page.locator('#portal-about').click();await settle();assert.equal(await page.locator('#place-title').textContent(),'I Am Portal');assert(await page.locator('#portal-rooms').isVisible());
 assert.equal(await page.locator('#labels').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 assert.equal(await page.locator('body').getAttribute('data-lineup-visible'),'false');
 await page.screenshot({path:out+'/portal-'+vp.width+'.png'});
 const stats=await page.evaluate(()=>window.__qa.portalStats());assert.equal(stats.length,7);for(const s of stats){assert.equal(s.participants,9);assert.equal(s.facilitators,1);assert.deepEqual(s.scale,[1,1,1]);}
 const rooms=['steam','mantra','sound','comedy','sexed','atelier','emdr'];
 for(const id of rooms){await page.locator(`[data-portal-room="portal-${id}"]`).click();await settle();assert.equal(await page.locator(`[data-portal-room="portal-${id}"]`).getAttribute('aria-pressed'),'true');if(vp.width>800||id==='steam')await page.screenshot({path:out+'/'+id+'-'+vp.width+'.png'});}
 await page.locator('[data-portal-room="portal"]').click();await settle();await page.evaluate(()=>window.__qa.night());await page.clock.runFor(80);await page.screenshot({path:out+'/portal-night-'+vp.width+'.png'});
 if(vp.width<800){assert.equal(await page.locator('#place-list').isVisible(),false);assert.equal(await page.locator('.view-tools').isVisible(),false);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await page.locator('#place-close').click();await page.evaluate(()=>window.__qa.view('main'));await settle();assert.equal(await page.locator('#place-title').textContent(),'Main pavilion');
 assert.deepEqual(errors,[]);results.push({viewport:vp,stats,render:await page.evaluate(()=>window.__qa.stats()),pageErrors:errors,liveSourceHashes:hashes});console.log(vp.width+'px passed');
 }finally{for(const p of context.pages())await p.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});await context.close();}
 }
 fs.writeFileSync(out+'/verification.json',JSON.stringify({live,processMuted:true,mediaStubbed:true,nativeFullscreenNeverInvoked:true,results},null,2)+'\n');
}finally{await browser.close();await server.close();}
