import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const live=process.argv.includes('--live'), mobile=process.argv.includes('--mobile');
const width=mobile?430:1280,height=mobile?785:800;
const out='/private/tmp/um-festival-qa-20261105';fs.mkdirSync(out,{recursive:true});
const origin='https://staging.universalmind.tv',lab=path.resolve('lab');
const binary='/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const server=await chromium.launchServer({headless:true,executablePath:binary,args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
try{
 const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'});
 const errors=[],loads=new Set(),hashes={};
 await context.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;HTMLMediaElement.prototype.play=async function(){};});
 const hook=`window.castQA={go:key=>selectPlace(key),show:()=>setStory({...storyFrame(160),night:0}),instant:key=>go(key,true),
  night:()=>setNight(1), roster:()=>festivalCast.group.children.map(g=>({id:g.name,loaded:g.children.length,visible:g.visible})),
  crowdPose:()=>Array.from(scene.getObjectByName('Lookbook crowd').children[0].morphTexture.source.data.data.slice(0,12)),
  distant:()=>scene.getObjectByName('Lookbook crowd').children.reduce((sum,g)=>sum+g.count,0),
  study:()=>portal.zones.find(z=>z.config.id==='emdr').interior.userData.characterStudy,
  pose:id=>scene.getObjectByName(id)?.getObjectByName('LeftHand')?.quaternion.toArray(),
  portrait:(id,dist)=>{controls.minDistance=1.6;document.getElementById('place-card').hidden=true;const m=scene.getObjectByName(id);const centre=m.getWorldPosition(new THREE.Vector3());centre.y+=.95;
   camera.position.copy(centre).add(new THREE.Vector3(0,.1,dist).applyAxisAngle(new THREE.Vector3(0,1,0),m.rotation.y));controls.target.copy(centre);controls.update();needsFrame=true;requestFrame();},
  seatFit:()=>{const zone=portal.zones.find(z=>z.config.id==='emdr').interior,cast=zone.getObjectByName('EMDR character fidelity study');
    return cast.children.filter(m=>m.userData.role==='participant').map(m=>{
      const p=new THREE.Vector3(),inv=m.matrixWorld.clone().invert();let sole=10,seat=10,front=-10;
      m.traverse(o=>{if(!o.isSkinnedMesh)return;const name=o.material.name.toLowerCase();
        const shoe=/sneaker|sole|lace|shoe/.test(name),lower=/pant|trouser|jean|legging|training|hotpants|boxing/.test(name);
        if(!shoe&&!lower)return;const seen=new Set(o.geometry.index.array);for(const i of seen){o.getVertexPosition(i,p);p.applyMatrix4(o.matrixWorld).applyMatrix4(inv);
          if(shoe){sole=Math.min(sole,p.y);front=Math.max(front,p.z);}if(lower&&p.z>-.19&&p.z<.045&&Math.abs(p.x)<.14)seat=Math.min(seat,p.y);}});
      return {id:m.name,pose:m.userData.pose,sole,seat,front};
    }).sort((a,b)=>a.id.localeCompare(b.id));}
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
     if(name==='index.html'){assert(raw.includes(Buffer.from('./lab.mjs?v=20261105cast1')));buffer=raw;}
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
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Festival look'))errors.push(m.text());});
 try{
   await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1600));
   await page.goto(origin+'/lab/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.castQA,null,{timeout:90000});
   assert.equal(loads.size,0,'construction starts without cast downloads');
   await page.locator('#explore-enter').click();await page.clock.fastForward(165000);await page.clock.runFor(60);
   await page.evaluate(()=>window.castQA.show());
   for(const area of ['main','river','food','support','portal-emdr']){
     if(!mobile&&area!=='portal-emdr')await page.locator('#place-list [data-view="'+area+'"]').click();
     await page.evaluate(area=>{window.castQA.go(area);window.castQA.instant(area);},area);
     await page.clock.fastForward(1800);await page.clock.runFor(90);
     const wanted={main:'river-arena',river:'A',food:'navy-working',support:'army-service','portal-emdr':'aircrew'}[area];
     await page.waitForFunction(id=>window.castQA.roster().some(g=>g.id===id&&g.loaded&&g.visible),wanted,{polling:100,timeout:120000});
     if(area==='portal-emdr')await page.waitForFunction(()=>window.castQA.study().status==='ready',null,{polling:100,timeout:120000});
     await page.clock.runFor(70);await page.screenshot({path:out+'/'+(live?'live-':'')+width+'-'+area+'.jpg',type:'jpeg',quality:83});
   }
   const study=await page.evaluate(()=>window.castQA.study());assert.equal(study.loaded,10);assert.deepEqual(study.errors,[]);
   const roster=await page.evaluate(()=>window.castQA.roster());assert.equal(roster.length,13);assert.equal(roster.filter(g=>g.loaded).length,13);
   const seats=await page.evaluate(()=>window.castQA.seatFit());
   for(const p of seats){
     if(p.pose==='chair'){assert(Math.abs(p.sole)<.022,p.id+' chair soles');assert(Math.abs(p.seat-.355)<.026,p.id+' chair seat');assert(p.front>.43,p.id+' knees clear front');}
     if(p.pose==='floor')assert(Math.abs(p.seat-.14)<.027,p.id+' floor cushion');
     if(p.pose==='daybed'){assert(Math.abs(p.seat-.619)<.04,p.id+' daybed cushion');assert(Math.abs(p.sole-.525)<.03,p.id+' daybed feet');}
   }
   await page.evaluate(()=>{window.castQA.instant('main');window.castQA.night();});
   await page.clock.runFor(160);
   await page.evaluate(()=>document.getElementById('music-video').dispatchEvent(new Event('playing')));
   const crowdBefore=await page.evaluate(()=>window.castQA.crowdPose());
   const before=await page.evaluate(()=>window.castQA.pose('river-arena'));await page.clock.runFor(370);
   const after=await page.evaluate(()=>window.castQA.pose('river-arena'));assert.notDeepEqual(before,after);assert.notDeepEqual(crowdBefore,await page.evaluate(()=>window.castQA.crowdPose()));
   if(!mobile){for(const id of ['river-arena','D1','A','army-service','aircrew','EMDR participant 4']){
     await page.evaluate(id=>{window.castQA.show();window.castQA.portrait(id,3.45);},id);await page.clock.runFor(70);
     await page.screenshot({path:out+'/detail-'+id+'.jpg',type:'jpeg',quality:85});
   }}
   await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(60);
   const quiet=await page.evaluate(()=>window.castQA.pose('river-arena'));await page.clock.runFor(400);
   assert.deepEqual(await page.evaluate(()=>window.castQA.pose('river-arena')),quiet);
   assert.deepEqual(errors,[]);assert.equal([...loads].filter(f=>f.startsWith('assets/festival/')).length,23);assert.equal(await page.evaluate(()=>window.castQA.distant()),70);
   const record={width,height,live,muted:true,mediaStubbed:true,animated:true,reducedMotion:true,roster:roster.map(g=>g.id),seats,loads:[...loads],errors,hashes};
   fs.writeFileSync(out+'/'+(live?'live-':'local-')+width+'.json',JSON.stringify(record,null,2));console.log(JSON.stringify({width,live,seats,models:loads.size}));
 }finally{await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});await context.close();}
}finally{await browser.close();await server.close();}
