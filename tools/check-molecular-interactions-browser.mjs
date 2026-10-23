import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import png from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs/lib/png.js';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=process.env.ATLAS_ROOT||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),live=process.env.ATLAS_LIVE==='1',out=process.env.ATLAS_QA_OUT||'/private/tmp/atlas-interactions-qa';await fs.mkdir(out,{recursive:true});
const base='https://staging.universalmind.tv/informatics/',results=[];
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));const browser=await chromium.connect(server.wsEndpoint());
async function candidate(ctx){if(live)return;await ctx.route(/https:\/\/staging\.universalmind\.tv\/informatics\//,async route=>{
 const rel=decodeURIComponent(new URL(route.request().url()).pathname.replace('/informatics/','')),file=path.resolve(root,'Informatics',!rel||rel.endsWith('/')?rel+'index.html':rel);
 if(!file.startsWith(root+'/Informatics/'))return route.abort();
 try{await route.fulfill({status:200,body:await fs.readFile(file),contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.cube':'text/plain','.pdb':'text/plain','.bcif':'application/octet-stream'}[path.extname(file)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Missing candidate asset'});}
});}
async function idle(page,level){await page.waitForFunction(level=>document.body.dataset.level===level&&document.body.dataset.ready==='true'&&document.body.dataset.busy==='false',level,{timeout:60000});await page.evaluate(()=>window.MolecularAtlas.whenIdle());}
async function pixels(page){const plain=await page.addStyleTag({content:'body{background:#000!important}.molecular-film,.molecular-film-shade,.target-caption,.interaction-legend,.source-caption,.scene-tools,.interaction-hint,#geometry-badge,.quantum-switch,.teaching-labels,.teaching-note{visibility:hidden!important}'});try{const {data}=png.PNG.sync.read(await page.locator('#viewport canvas').screenshot());let n=0;for(let i=0;i<data.length;i+=4)if(data[i+3]>10&&(data[i]>70||data[i+1]>70||data[i+2]>70))n++;assert.ok(n>150,'Rendered model pixels '+n);return n;}finally{await plain.evaluate(e=>e.remove());}}
async function stop(ctx,page){await page.evaluate(()=>{window.MolecularAtlas?.interactionUi.pause();document.querySelectorAll('audio,video').forEach(e=>e.pause());});await ctx.close();}
try{
 for(const viewport of process.env.ATLAS_EMBEDDED_ONLY==='1'?[]:process.env.ATLAS_SMOKE_ONLY==='1'?[{width:1470,height:956}]:[{width:1470,height:956},{width:1024,height:768},{width:390,height:844},{width:320,height:844}]){
  const ctx=await browser.newContext({viewport,reducedMotion:'reduce',acceptDownloads:true});await candidate(ctx);const page=await ctx.newPage(),errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/informatics/'))failed.push(r.status()+':'+r.url());});
  await page.goto(base+'molecular/?level=docking',{waitUntil:'domcontentloaded'});await idle(page,'docking');await page.waitForTimeout(450);
  assert.equal(await page.locator('.biology-toggle button').count(),4);assert.equal(await page.locator('#target-selector button').count(),1);
  assert.equal(await page.locator('#dock-metrics').isVisible(),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.evaluate(()=>[...window.MolecularAtlas.engine.plugin.state.data.cells.values()].filter(x=>x.params?.values?.type?.name==='ball-and-stick').every(x=>x.obj.data.repr.state.visible===false)),true);
  const dockPixels=await pixels(page);await page.screenshot({path:out+`/docking-${viewport.width}.png`,fullPage:true});
  await page.locator('#dock-progress').fill('350');assert.equal(await page.evaluate(()=>window.MolecularAtlas.interactionUi.model.snapshot().progress),.35);assert.equal(await page.locator('#dock-metrics').isVisible(),false);
  await page.locator('#dock-play').click();await page.waitForTimeout(600);assert.ok(await page.evaluate(()=>window.MolecularAtlas.interactionUi.model.snapshot().progress>.36));await page.locator('#dock-play').click();
  const paused=await page.evaluate(()=>window.MolecularAtlas.interactionUi.model.snapshot().progress);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.MolecularAtlas.interactionUi.model.snapshot().progress),paused);
  await page.locator('#dock-bound').click();assert.equal(await page.locator('#dock-metrics').isVisible(),true);await page.locator('#dock-planes').uncheck();assert.equal(await page.evaluate(()=>window.MolecularAtlas.interactionUi.model.snapshot().planes),false);await page.locator('#dock-planes').check();
  await page.locator('#dock-opacity').fill('12');await page.waitForTimeout(100);await page.evaluate(()=>window.MolecularAtlas.whenIdle());
  for(const focus of ['complex','pocket','contact'])await page.locator(`[data-contact-focus=${focus}]`).click();
  await page.locator('[data-view=evidence]').click();assert.match(await page.locator('#detail-content').innerText(),/illustrative translation/);await page.keyboard.press('Escape');
  await page.locator('[data-view=collection]').click();assert.match(await page.locator('#collection-grid').innerText(),/OXT–OXTR contact/);await page.locator('[data-view=structure]').click();
  if(viewport.width===1470){const [d]=await Promise.all([page.waitForEvent('download'),page.locator('#save-state').click()]);await d.saveAs(out+'/docking-view.json');const saved=JSON.parse(await fs.readFile(out+'/docking-view.json','utf8'));assert.equal(saved.model.receptorOpacity,.12);assert.equal(saved.model.kind,'docking');assert.equal('field' in saved.model,false);}
  await page.locator('[data-level=quantum]').click();await idle(page,'quantum');await page.waitForTimeout(450);
  assert.equal(await page.locator('#dock-play').count(),0);await page.locator('[data-quantum-view=calculated]').click();await page.evaluate(()=>window.MolecularAtlas.whenIdle());const quantumPixels=await pixels(page);await page.screenshot({path:out+`/quantum-${viewport.width}.png`,fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  for(const f of ['lumo','density','homo-minus-1','homo']){await page.locator('#quantum-field').selectOption(f);await page.evaluate(()=>window.MolecularAtlas.whenIdle());await page.waitForFunction(f=>document.body.dataset.quantumField===f&&document.body.dataset.busy==='false',f);await pixels(page);}
  await page.locator('#quantum-iso').fill('0.035');await page.locator('#quantum-opacity').fill('45');await page.waitForTimeout(180);await page.evaluate(()=>window.MolecularAtlas.whenIdle());assert.equal(await page.evaluate(()=>window.MolecularAtlas.interactionUi.model.snapshot().isovalue),.035);
  await page.locator('[data-quantum-focus=ring]').click();await page.locator('[data-quantum-focus=pair]').click();
  await page.locator('[data-view=evidence]').click();assert.match(await page.locator('#detail-content').innerText(),/Gas phase/);assert.match(await page.locator('#detail-content').innerText(),/not electron trajectories/);await page.keyboard.press('Escape');
  if(viewport.width===1470){
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#quantum-download').click()]);const file=out+'/download-homo.cube';await download.saveAs(file);const data=await fs.readFile(file),expected=await fs.readFile(root+'/Informatics/molecular/data/interactions/homo.cube');assert.equal(createHash('sha256').update(data).digest('hex'),createHash('sha256').update(expected).digest('hex'));
   const [state]=await Promise.all([page.waitForEvent('download'),page.locator('#save-state').click()]);await state.saveAs(out+'/download-view.json');const saved=JSON.parse(await fs.readFile(out+'/download-view.json','utf8'));assert.equal(saved.level,'quantum');assert.equal(saved.provenance.scfConverged,true);assert.equal('progress' in saved.model,false);assert.equal(saved.model.field,'homo');
   const canvas=page.locator('#viewport canvas');await canvas.focus();const before=await page.evaluate(()=>window.MolecularAtlas.engine.snapshot().camera.position);await page.keyboard.press('ArrowLeft');await page.waitForTimeout(250);assert.notDeepEqual(await page.evaluate(()=>window.MolecularAtlas.engine.snapshot().camera.position),before);
  }
  await page.locator('[data-view=collection]').click();assert.match(await page.locator('#collection-grid').innerText(),/Teaching & calculated orbitals/);await page.locator('[data-view=structure]').click();
  await page.locator('[data-level=gene]').click();await idle(page,'gene');assert.equal(await page.locator('#target-selector button').count(),8);await page.locator('#geometry-kind').selectOption('truncated-icosahedron');await page.evaluate(()=>window.MolecularAtlas.whenIdle());assert.equal(await page.evaluate(()=>document.body.dataset.geometry),'truncated-icosahedron');
  await page.locator('[data-level=protein]').click();await idle(page,'protein');assert.equal(await page.evaluate(()=>window.MolecularAtlas.engine.snapshot().pdb),'7QVM');assert.equal(await page.evaluate(()=>document.body.dataset.geometry),'truncated-icosahedron');
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);assert.equal(await page.locator('video').evaluateAll(es=>es.every(e=>e.muted&&e.paused)),true);
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);results.push({viewport,dockPixels,quantumPixels,controls:true,quantumFields:4,geometryPreserved:true,noOverflow:true,errors,failed});await stop(ctx,page);
 }
 for(const viewport of process.env.ATLAS_SMOKE_ONLY==='1'?[]:[{width:1470,height:956},{width:390,height:844}]){
  const ctx=await browser.newContext({viewport,reducedMotion:'reduce'});await candidate(ctx);
  await ctx.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{};Element.prototype.webkitRequestFullscreen=()=>{};});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?area=molecular');await page.waitForFunction(()=>!document.querySelector('#launch').disabled);await page.locator('#launch').click();
  const frame=page.frameLocator('#molecular-frame');await frame.locator('body[data-ready="true"][data-busy="false"]').waitFor({timeout:60000});
  for(const mode of ['docking','quantum']){await frame.locator('[data-level='+mode+']').click();await frame.locator('body[data-level="'+mode+'"][data-ready="true"][data-busy="false"]').waitFor({timeout:60000});await frame.locator('body').evaluate(()=>window.MolecularAtlas.whenIdle());await page.screenshot({path:out+'/embedded-'+mode+'-'+viewport.width+'.png',fullPage:true});}
  await frame.locator('[data-level=docking]').click();await frame.locator('body[data-level=docking][data-busy=false]').waitFor({timeout:60000});await frame.locator('#dock-play').click();
  await page.locator('#atlas-toggle').click();await page.locator('#atlas-menu [data-area=geometry]').click();
  await frame.locator('body[data-docking-playing=false]').waitFor({state:'attached',timeout:5000});assert.equal(await frame.locator('body').evaluate(()=>window.MolecularAtlas.interactionUi.model.snapshot().playing),false);
  await page.locator('#atlas-toggle').click();await page.locator('#atlas-menu [data-area=molecular]').click();assert.equal(await frame.locator('body').getAttribute('data-level'),'docking');
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);assert.deepEqual(errors,[]);results.push({viewport,embedded:true,entry:true,separateViews:true,pauseOnExit:true,selectionPreserved:true});await stop(ctx,page);
 }
 // A direct Quantum URL never passes through the docking experience.
 const directCtx=await browser.newContext({viewport:{width:1470,height:956},reducedMotion:'reduce'});await candidate(directCtx);const direct=await directCtx.newPage();await direct.goto(base+'molecular/?level=quantum');await idle(direct,'quantum');assert.equal(await direct.locator('#dock-play').count(),0);await stop(directCtx,direct);
 // Invalid field bytes leave a visible error, not an old or invented orbital.
 const badCtx=await browser.newContext({reducedMotion:'reduce'});await candidate(badCtx);await badCtx.route('**/interactions/homo.cube',r=>r.fulfill({status:200,body:'invalid quantum field'}));const bad=await badCtx.newPage();await bad.goto(base+'molecular/?level=quantum&quantum=calculated');await bad.waitForFunction(()=>document.querySelector('#loading').dataset.error==='true');assert.match(await bad.locator('#loading-message').innerText(),/checksum/);await stop(badCtx,bad);
 await fs.writeFile(out+'/verification.json',JSON.stringify({live,audioMutedAtProcessLevel:true,nativeFullscreen:false,results,directQuantum:true,checksumFailureVisible:true},null,2));console.log(JSON.stringify({live,viewports:results.length,passed:true,out}));
}finally{for(const ctx of browser.contexts()){for(const page of ctx.pages())await page.evaluate(()=>{window.MolecularAtlas?.interactionUi.pause();document.querySelectorAll('audio,video').forEach(e=>e.pause());}).catch(()=>{});await ctx.close();}await browser.close();await server.close();}
