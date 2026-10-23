import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/',live=process.env.ATLAS_LIVE==='1';
const out=process.env.ATLAS_QA_OUT||'/private/tmp/molecular-truncated-candidate';
const kind='truncated-icosahedron',results=[];
await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
async function candidate(context){
 if(live)return;
 await context.route(/https:\/\/staging\.universalmind\.tv\/informatics\/molecular\/(?:\?.*)?$|https:\/\/staging\.universalmind\.tv\/informatics\/molecular\/(?:index\.html|vendor\/engine\.js)(?:\?.*)?$/,async route=>{
  const name=new URL(route.request().url()).pathname.endsWith('engine.js')?'vendor/engine.js':'index.html';
  await route.fulfill({status:200,body:await fs.readFile(root+'/Informatics/molecular/'+name),contentType:name.endsWith('.js')?'text/javascript':'text/html'});
 });
}
async function idle(page){await page.waitForFunction(()=>document.body.dataset.ready==='true'&&document.body.dataset.busy==='false',null,{timeout:60000});await page.evaluate(()=>window.MolecularAtlas.whenIdle());}
async function imageProof(page){
 return page.evaluate(async()=>{
  const url=await window.MolecularAtlas.engine.screenshot({transparent:true,size:400}),img=new Image();img.src=url;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=400;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
  const pixels=ctx.getImageData(0,0,400,400).data;let gold=0;
  for(let i=0;i<pixels.length;i+=4)if(pixels[i]>120&&pixels[i+1]>80&&pixels[i]>pixels[i+2]*1.25&&pixels[i+3]>50)gold++;
  return {url,gold};
 });
}
try{
 for(const viewport of [{width:1470,height:956},{width:1024,height:768},{width:390,height:844},{width:320,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce',acceptDownloads:true}),errors=[],failed=[];
  await candidate(context);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/informatics/'))failed.push(r.url()+':'+r.status());});
  await page.goto(base+'molecular/',{waitUntil:'domcontentloaded'});await idle(page);
  const options=await page.locator('#geometry-kind option').evaluateAll(nodes=>nodes.map(n=>n.value));
  assert.deepEqual(options,['icosahedron','tetrahedron','cube','octahedron','dodecahedron','stellated',kind,'odom','phi']);
  const shape=await page.evaluate(kind=>{const g=MolecularEngine.geometry(kind);return {name:g.name,vertices:g.vertices.length,edges:g.edges.length,segments:g.segments.length};},kind);
  assert.deepEqual(shape,{name:'Truncated icosahedron',vertices:60,edges:90,segments:90});
  for(const level of ['gene','protein']){
   if(level==='protein'){await page.locator('[data-level="protein"]').click();await idle(page);}
   await page.locator('#geometry-kind').selectOption(kind);await idle(page);
   for(const [id,value] of [['scale','1.2'],['rotation','0'],['offset','0'],['opacity','0.7']])await page.locator('#geometry-'+id).fill(value);
   await page.waitForTimeout(150);await idle(page);
   assert.equal(await page.locator('#geometry-toggle').isChecked(),true);
   assert.equal(await page.locator('#geometry-label').innerText(),'Truncated icosahedron');
   assert.match(await page.locator('#geometry-note').innerText(),/Archimedean solid · 12 pentagons and 20 hexagons/);
   assert.equal(await page.evaluate(()=>document.body.dataset.geometry),kind);
   const proof=await imageProof(page);assert.ok(proof.gold>50,'Visible gold geometry: '+proof.gold);
   await fs.writeFile(`${out}/${level}-${viewport.width}-render.png`,Buffer.from(proof.url.split(',')[1],'base64'));
   await page.evaluate(()=>{window.scrollTo(0,0);document.querySelector('.inspector').scrollTop=0;});
   await page.screenshot({path:`${out}/${level}-${viewport.width}.png`,fullPage:true});
   await page.locator('#geometry-info').click();const detail=await page.locator('#detail-content').innerText();assert.match(detail,/Vertices\s+60\s+Edges\s+90/);assert.match(detail,/Archimedean/);
   await page.keyboard.press('Escape');assert.equal(await page.locator('#detail-panel').isVisible(),false);
   for(const [id,value] of [['scale','1.5'],['rotation','45'],['offset','0.25'],['opacity','0.5']])await page.locator('#geometry-'+id).fill(value);
   await page.waitForTimeout(150);await idle(page);
   const pending=page.waitForEvent('download');await page.locator('#save-state').click();const download=await pending,file=`${out}/${level}-${viewport.width}-view.json`;await download.saveAs(file);
   const saved=JSON.parse(await fs.readFile(file,'utf8'));assert.equal(saved.level,level);assert.deepEqual(saved.geometry,{enabled:true,kind,scale:1.5,rotation:45,offset:.25,opacity:.5});
   await page.locator('#geometry-toggle').uncheck();await idle(page);assert.equal(await page.evaluate(()=>document.body.dataset.geometry),'none');
   await page.locator('#geometry-toggle').check();await idle(page);
   await page.locator('[data-view="collection"]').click();await page.locator('[data-view="structure"]').click();await idle(page);assert.equal(await page.locator('#geometry-kind').inputValue(),kind);
   await page.locator('#geometry-kind').selectOption('stellated');await idle(page);assert.equal(await page.locator('#geometry-label').innerText(),'Stellated octahedron');
   await page.locator('#geometry-kind').selectOption(kind);await idle(page);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
   results.push({viewport,level,shape,goldPixels:proof.gold,controls:true,download:true,collectionReturn:true,previousSolid:true,noOverflow:true});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(e=>e.pause()));await context.close();
 }
 for(const viewport of [{width:1470,height:956},{width:390,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});await candidate(context);
  // Exercise entry at fixed viewport dimensions without native fullscreen.
  await context.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{};Element.prototype.webkitRequestFullscreen=()=>{};});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?area=molecular');await page.waitForFunction(()=>!document.querySelector('#launch').disabled);await page.locator('#launch').click();
  const frame=page.frameLocator('#molecular-frame');await frame.locator('body[data-ready="true"][data-busy="false"]').waitFor({timeout:60000});
  await frame.locator('#geometry-kind').selectOption(kind);await frame.locator('body').evaluate(()=>window.MolecularAtlas.whenIdle());
  assert.equal(await frame.locator('#geometry-label').innerText(),'Truncated icosahedron');
  await page.screenshot({path:`${out}/embedded-${viewport.width}.png`,fullPage:true});
  await page.locator('#atlas-toggle').click();await page.locator('#atlas-menu [data-area="geometry"]').click();
  await page.locator('#atlas-toggle').click();await page.locator('#atlas-menu [data-area="molecular"]').click();
  assert.equal(await frame.locator('#geometry-kind').inputValue(),kind);
  assert.equal(await frame.locator('#geometry-toggle').isChecked(),true);
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);assert.deepEqual(errors,[]);
  results.push({viewport,embedded:true,entry:true,selectionPreserved:true});
  await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(e=>e.pause()));await context.close();
 }
 await fs.writeFile(out+'/results.json',JSON.stringify({passed:true,live,processMuted:true,nativeFullscreen:false,results},null,2));
 console.log(JSON.stringify({passed:true,live,checks:results.length,out}));
}finally{for(const context of browser.contexts()){for(const page of context.pages())await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(e=>e.pause())).catch(()=>{});await context.close();}await browser.close();await server.close();}
