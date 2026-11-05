import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const live=process.argv.includes('--live'), mobile=process.argv.includes('--mobile');
const width=mobile?393:1280,height=mobile?785:800;
const out='/private/tmp/um-arena-motion-20261105';fs.mkdirSync(out,{recursive:true});
const origin='https://staging.universalmind.tv',lab=path.resolve('lab');
const binary='/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const server=await chromium.launchServer({headless:true,executablePath:binary,args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
try{
 const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'});
 const errors=[],loads=new Set(),hashes={};
 await context.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;HTMLMediaElement.prototype.play=async function(){};});
 const hook=`window.castQA={
   jump(key){selectPlace(key);go(key,true);},
   castStatus(){
     const emdr=portal.zones.find(z=>z.config.id==='emdr').interior;
     const room=portal.zones.find(z=>'portal-'+z.config.id===selected)?.interior;
     const pack=runwayCrowd.group.children.find(c=>c.visible&&c.userData.status==='ready');
     return {emdr:emdr.userData.characterStudy,room:room?.children.find(g=>g.name==='workshops visitors')?.userData,
       walkers:walkers.group.userData,seated:seatedVisitors.group.userData,show:pack?.name,activeModels:pack?.children.reduce((count,batch)=>count+batch.count,0),
       crowd:crowd.visitors.userData.count,roster:festivalCast.group.children.filter(c=>c.visible&&c.children.length).map(c=>c.name)};
   },
   sample(key){
     let obj=scene.getObjectByName(key);
     if(key==='workshop')obj=portal.zones.find(z=>'portal-'+z.config.id===selected)?.interior.getObjectByName('workshops visitors')?.children[0];
     if(key==='runway')obj=runwayCrowd.group.children.find(c=>c.visible)?.children[0];
     if(key==='walking')obj=walkers.group.children[0];
     if(key==='pavilion crowd')obj=scene.getObjectByName('Lookbook crowd').children.find(m=>m.count>0);
     if(!obj)return null;
     if(obj.isInstancedMesh)return {pose:Array.from(obj.morphTexture.source.data.data.slice(0,8)),position:Array.from(obj.instanceMatrix.array.slice(12,15))};
     const hand=obj.getObjectByName('RightHand'),head=obj.getObjectByName('Head');if(!head)return null;
     return {hand:hand.getWorldPosition(new THREE.Vector3()).toArray(),head:head.getWorldQuaternion(new THREE.Quaternion()).toArray()};
   },
   stats(){return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,musicMotion,peopleTime,view:selected};}
 };`;
 await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.endsWith('/hls.min.js'))return route.fulfill({contentType:'application/javascript',body:'window.Hls=class{static isSupported(){return false}}'});
   if(url.origin!==origin||!url.pathname.startsWith('/lab/'))return route.abort();
   const name=url.pathname.slice(5)||'index.html',f=path.join(lab,name);
   if(!fs.existsSync(f))return route.abort();
   if(live && !name.endsWith('.mjs')&&!name.endsWith('.glb')&&name!=='index.html')return route.continue();
   let buffer=fs.readFileSync(f);
   if(live){
     const res=await route.fetch();assert.equal(res.status(),200,name);
     const raw=await res.body();
     if(name==='index.html'){assert(raw.includes(Buffer.from('./lab.mjs?v=20261105movement1')));buffer=raw;}
     else {assert(raw.equals(buffer),name);hashes[name]=createHash('sha256').update(raw).digest('hex');}
   }
   if(name.endsWith('.glb'))loads.add(name);
   if(name==='lab.mjs'){
     let code=buffer.toString().replace('createStory, ORBIT_START','createStory, storyFrame, ORBIT_START');
     const marker="go('overview',true);resize();";assert(code.includes(marker));code=code.replace(marker,marker+hook);
     return route.fulfill({contentType:'application/javascript',body:code});
   }
   return route.fulfill({path:f,...(name.endsWith('.mjs')?{contentType:'application/javascript'}:{}),...(name==='index.html'?{contentType:'text/html',body:buffer}:{})});
 });
 const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.error('Browser exception',e.message);});
 page.on('console',m=>{if(m.type()==='error')console.error('Browser:',m.text().slice(0,320));if(m.type()==='error'&&/Festival look|visitors|WebGLProgram/.test(m.text()))errors.push(m.text());});
 try{
   await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1600));
   await page.goto(origin+'/lab/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.castQA,null,{timeout:90000});
   console.log('Scene ready');assert.equal(loads.size,0,'construction starts without cast downloads');
   await page.locator('.landing-name').click();
   const expected=['Anna Lunoe','Brian Eno','Damian Lazarus','FISHER','Fred again..','In This World','Iris van Herpen','Jamie xx','Luciano','Matthewdavid','Nagnata','Nastia','Nina Kraviz','Peggy Gou','Seth Troxler','Steve Aoki','Sven Väth','Tiga','Timmy Trumpet'];
   const lineup=page.locator('#about-lineup'),summary=lineup.locator('summary');
   assert.equal(await lineup.evaluate(x=>x.open),false);await summary.click();
   assert.equal(await lineup.locator('#lineup-order').innerText(),'In alphabetical order');
   assert.equal(await lineup.locator('.programme-more').innerText(),'+ more');
   const names=await lineup.locator('.lineup-names li').allTextContents();
   assert.deepEqual(names,expected);assert.deepEqual(names,[...names].sort(new Intl.Collator('en-AU',{sensitivity:'base'}).compare));
   assert.equal(await lineup.locator('.lineup-names li').evaluateAll(items=>new Set(items.map(el=>getComputedStyle(el).font)).size),1);
   await lineup.locator('.lineup-programme').scrollIntoViewIfNeeded();
   await page.screenshot({path:out+'/'+(live?'live-':'local-')+width+'-lineup.jpg',quality:82});
   await summary.click();
   assert((await page.locator('#vision').innerText()).includes('Australian Indigenous Mentoring Experience (AIME)'));
   await page.locator('#watch-runway').click();
   await page.clock.runFor(100);console.log('Entered',await page.evaluate(()=>({ready:document.body.dataset.ready,view:document.body.dataset.cameraView,cast:castQA.castStatus()})));
   const ready=async(test,arg)=>page.waitForFunction(test,arg,{polling:100,timeout:90000});
   const record={live,width,height,muted:true,mediaStubbed:true,views:{},models:[]};
   async function different(key){
     const before=await page.evaluate(k=>castQA.sample(k),key);assert(before,key+' ready');
     await page.clock.fastForward(240);await page.clock.runFor(90);
     const after=await page.evaluate(k=>castQA.sample(k),key);assert.notDeepEqual(after,before,key+' moving');return {before,after};
   }
   for(const show of ['iris','nagnata','iris']){
     console.log('Checking show',show);const button=page.locator('[data-runway-show="'+show+'"]');await button.click();
     assert.equal(await button.getAttribute('aria-pressed'),'true');
     await ready(name=>castQA.castStatus().show===name+' visitors',show);
     assert.equal(await page.evaluate(()=>castQA.castStatus().activeModels),8);
     await page.evaluate(()=>castQA.jump('fashion'));
     await page.clock.runFor(100);await different('runway');
     await page.screenshot({path:out+'/'+(live?'live-':'local-')+width+'-'+show+'.jpg',quality:82});
   }
   if(!mobile){
     await page.locator('#lineup-toggle').click();
     assert(await lineup.evaluate(x=>x.open));assert(await page.locator('#lineup-order').isVisible());
     await page.locator('#about-close').click();
     await page.clock.runFor(32);
     assert.equal(await lineup.evaluate(x=>x.open),false);
   }else assert.equal(await page.locator('#lineup-more-open').isVisible(),false);
   record.programme={names,orderLabel:'In alphabetical order',equalBilling:true};
   await ready(()=>castQA.castStatus().walkers.status==='ready'&&castQA.castStatus().seated.status==='ready');
   await different('walking');
   const areas=['truck','main','food','play','river','support','fashion','portal','portal-steam','portal-mantra','portal-sound','portal-comedy','portal-sexed','portal-atelier','portal-emdr'];
   for(const area of areas){
     console.log('Checking',area);
     if(!mobile&&!area.startsWith('portal-'))await page.locator('#place-list [data-view="'+area+'"]').click();
     await page.evaluate(id=>castQA.jump(id),area);await page.clock.runFor(90);
     if(area==='main'){
       await ready(()=>castQA.castStatus().roster.includes('river-arena'));
       await different('river-arena');await different('pavilion crowd');
     }else if(area==='portal-emdr'){
       await ready(()=>castQA.castStatus().emdr.status==='ready');assert.equal((await page.evaluate(()=>castQA.castStatus().emdr)).loaded,10);
       await different('EMDR participant 4');await different('EMDR facilitator');
     }else if(area.startsWith('portal-')){
       await ready(()=>castQA.castStatus().room?.status==='ready');await different('workshop');
     }
     if(['portal-steam','portal-emdr','main','truck','river'].includes(area))await page.screenshot({path:out+'/'+(live?'live-':'local-')+width+'-'+area+'.jpg',quality:78});
     record.views[area]=await page.evaluate(()=>castQA.stats());assert.equal(record.views[area].musicMotion,false);
   }
   await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(100);
   const rest=await page.evaluate(()=>castQA.sample('EMDR participant 4'));await page.clock.runFor(220);
   assert.deepEqual(rest,await page.evaluate(()=>castQA.sample('EMDR participant 4')));
   record.cast=await page.evaluate(()=>castQA.castStatus());record.models=[...loads];record.errors=errors;record.hashes=hashes;
   assert.deepEqual(errors,[]);assert(record.cast.crowd>=100);assert.equal(record.cast.walkers.count,24);
   fs.writeFileSync(out+'/'+(live?'live-':'local-')+width+'.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({live,width,views:areas.length,files:loads.size,cast:record.cast.crowd,walkers:record.cast.walkers.count}));
 }finally{await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});await context.close();}
}finally{await browser.close();await server.close();}
