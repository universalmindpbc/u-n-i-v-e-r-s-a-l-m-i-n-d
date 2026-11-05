import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const live=process.argv.includes('--live'),mobile=process.argv.includes('--mobile');
const width=mobile?393:1470,height=mobile?785:956;
const output=process.env.ACTIVITY_QA_OUTPUT||'/private/tmp/um-activity-proof-20261105';
const origin='https://staging.universalmind.tv', lab=path.resolve('lab');
const server=await chromium.launchServer({headless:true,
  executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const result={live,width,height,areas:{},errors:[]};
const files=new Set();
function diagnostic(THREE,activities,park,groundWalkingPaths,walkingRoute,camera,canvas,renderer,scene){
  function members(role){
    const entries=[];
    activities.group.traverse(o=>{if(o.userData.asset&&(!role||o.userData.role===role))entries.push(o);});
    return entries;
  }
  function locations(area){
    return members().filter(o=>(o.userData.role==='phone')===(area==='play')).map(o=>{
      o.updateWorldMatrix(true,true);
      const position=name=>o.getObjectByName(name)?.getWorldPosition(new THREE.Vector3()).toArray();
      const local={};
      for(const key of ['Head','Hips','LeftFoot','LeftHand','RightHand','LeftHandMiddle1','LeftHandIndex1','LeftToeBase','Music handset','Stethoscope and clinical ID']){
        const xyz=position(key);
        if(xyz)local[key]=o.worldToLocal(new THREE.Vector3(...xyz)).toArray().map(v=>+v.toFixed(4));
      }
      let skins=0;const materials=new Set();o.traverse(m=>{if(m.isSkinnedMesh){skins++;materials.add(m.material.name);}});
      return {name:o.name,...o.userData,visible:o.visible,skins,materials:[...materials],bones:local};
    });
  }
  function clearances(){
    // A conservative plan envelope of every shell triangle reaching a visitor's height.
    park.updateWorldMatrix(true,true);
    const shell=park.children[0],geometry=shell.geometry,index=geometry.index,position=geometry.attributes.position;
    const box=new THREE.Box2(), tri=[0,1,2].map(()=>new THREE.Vector3());
    for(let i=0;i<index.count;i+=3){
      tri.forEach((v,j)=>shell.localToWorld(v.fromBufferAttribute(position,index.getX(i+j))));
      if(tri.some(v=>v.y<=2.2))for(const v of tri)box.expandByPoint(new THREE.Vector2(v.x,v.z));
    }
    const test=new THREE.Object3D();
    return groundWalkingPaths.map(([x1,z1,x2,z2,radius,people])=>{
      const route=walkingRoute(x1,z1,x2,z2,radius);
      const steps=Math.ceil(route.length/.05);let wall=Infinity,seats=Infinity;
      for(let i=0;i<=steps;i++){
        route.place(test,route.length*i/steps);
        const p=new THREE.Vector2(test.position.x,test.position.z);
        wall=Math.min(wall,box.distanceToPoint(p));
        for(const chair of members('phone'))seats=Math.min(seats,p.distanceTo(new THREE.Vector2(chair.position.x,chair.position.z)));
      }
      return {people,steps,wall:+wall.toFixed(3),seats:+seats.toFixed(3)};
    });
  }
  // Technical close-up taken with a separate virtual camera in the same scene.
  function portrait(){
    const person=members('seated').find(o=>o.userData.asset==='05'),lens=camera.clone();
    const aim=person.localToWorld(new THREE.Vector3(0,.53,0));
    lens.position.copy(person.localToWorld(new THREE.Vector3(.63,.99,2.06)));lens.lookAt(aim);
    lens.fov=35;lens.updateProjectionMatrix();renderer.render(scene,lens);
    const size=Math.min(canvas.width,canvas.height),out=document.createElement('canvas');out.width=out.height=512;
    out.getContext('2d').drawImage(canvas,(canvas.width-size)/2,(canvas.height-size)/2,size,size,0,0,512,512);
    renderer.render(scene,camera);return out.toDataURL('image/png').split(',')[1];
  }
  return {locations,clearances,portrait,waves:()=>activities.group.getObjectsByProperty('name','Shared device waveform').filter(w=>w.visible).length};
}
try{
  await fs.mkdir(output,{recursive:true});
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',
    userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'});
  await context.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;HTMLMediaElement.prototype.play=async function(){};});
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url()),name=url.pathname.slice(5)||'index.html';
    if(url.pathname.endsWith('/hls.min.js'))return route.fulfill({contentType:'application/javascript',body:'window.Hls=class{static isSupported(){return false}}'});
    if(url.origin!==origin||!url.pathname.startsWith('/lab/'))return route.abort();
    const f=path.join(lab,name);
    let body;
    try{body=await fs.readFile(f);}catch{return route.abort();}
    if(live){
      if(!name.endsWith('.mjs')&&!name.endsWith('.glb')&&name!=='index.html')return route.continue();
      const res=await route.fetch();assert.equal(res.status(),200,name);
      const raw=await res.body();
      if(name==='index.html')assert(raw.includes(Buffer.from('./lab.mjs?v=20261105activity2')));
      else assert(raw.equals(body),name);
      body=raw;
    }
    if(name.endsWith('.glb'))files.add(name);
    if(name==='lab.mjs'){
      let source=body.toString().replace('import {createGroundWalkers,','import {walkingRoute,groundWalkingPaths,createGroundWalkers,');
      const marker="go('overview',true);resize();";
      assert(source.includes(marker));source=source.replace(marker,marker+'window.activityQA=('+diagnostic.toString()+')(THREE,activities,buildings.park,groundWalkingPaths,walkingRoute,camera,canvas,renderer,scene);');
      return route.fulfill({contentType:'application/javascript',body:source});
    }
    return route.fulfill({path:f,body,...(name.endsWith('.mjs')?{contentType:'application/javascript'}:{})});
  });
  const page=await context.newPage();
  page.on('pageerror',e=>result.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&m.text().includes('activity visitor'))result.errors.push(m.text());});
  try{
    await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
    await page.goto(origin+'/lab/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.activityQA,null,{timeout:90000});
    assert.equal(files.size,0);
    await page.locator('#explore-enter').click();
    await page.clock.fastForward(mobile?53500:31200);
    for(const [i,area] of ['play','support'].entries()){
      if(mobile&&i)await page.clock.fastForward(8500);
      if(!mobile)await page.locator('#place-list [data-view="'+area+'"]').click();
      await page.clock.fastForward(1450);await page.clock.runFor(50);
      assert.equal(await page.locator('body').getAttribute('data-camera-view'),area);
      await page.waitForFunction(key=>activityQA.locations(key).every(person=>person.status==='ready'),area,{polling:100,timeout:90000});
      await page.clock.runFor(35);
      const before=await page.evaluate(key=>activityQA.locations(key),area);
      assert.equal(before.length,area==='play'?3:6);
      assert(before.every(p=>p.skins>0&&p.visible),area+' visible lookbook models');
      await page.clock.fastForward(450);await page.clock.runFor(65);
      const after=await page.evaluate(key=>activityQA.locations(key),area);
      for(const [j,p] of after.entries())assert.notDeepEqual(p.bones.Head,before[j].bones.Head,p.name+' animated');
      if(area==='play'){
        for(const p of after){
          assert(p.bones['Music handset']);
          const gap=Math.hypot(...p.bones['Music handset'].map((x,i)=>x-p.bones.LeftHandMiddle1[i]));
          assert(gap<.065,'handset follows grip');
        }
        assert.equal(await page.evaluate(()=>activityQA.waves()),3);
      }else{
        for(const p of after.filter(p=>p.role==='doctor'))assert(p.bones['Stethoscope and clinical ID']);
        const yoga=after.find(p=>p.role==='yoga');
        assert(yoga.bones.LeftHandMiddle1[1]<.05&&yoga.bones.LeftToeBase[1]<.09,'hands and feet at mat height');
        const person=after.find(p=>p.asset==='05');
        assert(person.materials.includes('Classic crew tee'));
        if(!mobile){
          const pixels=await page.evaluate(()=>activityQA.portrait());
          await fs.writeFile(path.join(output,(live?'live-':'local-')+width+'-tee.png'),Buffer.from(pixels,'base64'));
        }
      }
      result.areas[area]=after;
      await page.screenshot({path:path.join(output,(live?'live-':'local-')+width+'-'+area+'.jpg'),quality:82});
      console.log(area,after.map(p=>p.asset).join(' '));
    }
    result.clearances=await page.evaluate(()=>activityQA.clearances());
    assert.equal(result.clearances.reduce((n,r)=>n+r.people,0),24);
    assert(result.clearances.every(r=>r.wall>.75&&r.seats>1.15));
    await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(45);
    const still=await page.evaluate(()=>activityQA.locations('support'));
    await page.clock.fastForward(300);await page.clock.runFor(60);assert.deepEqual(still,await page.evaluate(()=>activityQA.locations('support')));
    result.reducedMotion=true;result.assets=[...files].sort();assert.deepEqual(result.errors,[]);
    await fs.writeFile(path.join(output,(live?'live-':'local-')+width+'.json'),JSON.stringify(result,null,2)+'\n');
    console.log('Nearest wall clearance, centre of walking path in metres',Math.min(...result.clearances.map(r=>r.wall)));
  }finally{await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(v=>v.pause())).catch(()=>{});await context.close();}
}finally{await browser.close();await server.close();}
