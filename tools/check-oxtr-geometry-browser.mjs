import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const candidate=process.env.INFORMATICS_CANDIDATE==='1',base='https://staging.universalmind.tv/informatics/';
const out='/private/tmp/oxtr-geometry-'+(candidate?'candidate':'staging');await fs.mkdir(out,{recursive:true});
const dataRoot=path.join(root,'Informatics/pilot-v1/oxtr-tfbs-v1/experiment-v1');
const manifest=JSON.parse(await fs.readFile(path.join(dataRoot,'manifest.json'),'utf8'));
const data={};for(const [k,{file}] of Object.entries(manifest.files)){const b=await fs.readFile(path.join(dataRoot,file));data[k]=JSON.parse(file.endsWith('.gz')?gunzipSync(b):b);}
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),report=[];
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport,acceptDownloads:true,reducedMotion:'reduce'});
  await context.addInitScript(()=>{let full=null;Object.defineProperty(document,'fullscreenElement',{get:()=>full});Element.prototype.requestFullscreen=async function(){full=this;document.dispatchEvent(new Event('fullscreenchange'));};document.exitFullscreen=async()=>{full=null;document.dispatchEvent(new Event('fullscreenchange'));};});
  if(candidate)await context.route(base+'**',async route=>{
   const rel=decodeURIComponent(new URL(route.request().url()).pathname.slice('/informatics/'.length))||'index.html';
   const file=path.resolve(root,'Informatics',rel);if(!file.startsWith(path.join(root,'Informatics')+'/'))return route.abort();
   try{await route.fulfill({status:200,body:await fs.readFile(file),contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'}[path.extname(file)]||'application/octet-stream'});}catch{return route.fulfill({status:404,body:'Missing candidate asset'});}
  });
  let fail=true;
  await context.route(base+'pilot-v1/oxtr-tfbs-v1/experiment-v1/studies.json',async route=>{if(fail){fail=false;return route.fulfill({status:503,body:'Deliberate loading failure'});}return route.fallback();});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'?atlas=1&record=fibonacci-m9-p24',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!document.querySelector('#launch').disabled);await page.locator('#launch').click();
   const frame=page.frameLocator('#atlas-frame');await frame.locator('.intro h1').filter({hasText:'M9 / P24'}).waitFor();
   const entry=frame.locator('#atlas-science-summary [data-science-tfbs]');await entry.click();
   const dialog=frame.locator('.science-tfbs'),geo=dialog.locator('.tfbs-geometry');
   await geo.getByRole('button',{name:'Retry experiment',exact:true}).click();
   const status=geo.locator('.geometry-status');
   const expectCount=async n=>status.filter({hasText:new RegExp('^'+n.toLocaleString('en-AU')+' ')}).waitFor({timeout:60000});
   await expectCount(2);assert.equal(await geo.locator('[data-geometry-view="line"]').getAttribute('aria-pressed'),'true');
   const startUrl=page.url();
   const before=await page.evaluate(()=>({full:document.fullscreenElement?.id,srcs:[...document.querySelectorAll('audio,video')].map(e=>e.currentSrc),times:[...document.querySelectorAll('audio,video')].map(e=>e.currentTime)}));
   for(const source of ['studies','encode','jaspar']){
    await geo.locator('#geometry-source').selectOption(source);await expectCount(data[source].length);
    for(const view of ['line','circle','m9']){
     await geo.locator(`[data-geometry-view="${view}"]`).click();
     for(const pattern of ['alpha','beta','gamma','epsilon']){
      await geo.locator(`[data-geometry-pattern="${pattern}"]`).click();
      assert.equal(await geo.locator(`[data-geometry-pattern="${pattern}"]`).getAttribute('aria-pressed'),'true');
      assert.equal(await geo.locator('.geometry-panels svg').count(),2);
      assert.equal(await geo.locator('.geometry-reference-plot svg').getAttribute('aria-label'),`${pattern} reference, Fibonacci M9 P24, ${pattern==='beta'?9:24} positions`);
     }
     if(view==='m9'){
      const counts=await geo.locator('.geometry-node-counts strong').allTextContents();
      assert.deepEqual(counts.map(s=>Number(s.replaceAll(',',''))),manifest.summaries[source].residue_counts_0_to_8);
     }
    }
    await geo.locator('[data-geometry-pattern="beta"]').click();
    await geo.locator('.geometry-panels').screenshot({path:path.join(out,`${source}-m9-${viewport.width}.png`)});
    // Node drill-down retains all rows in an export, not just the visible table page.
    const residue=source==='studies'?7:0;
    const node=geo.locator(`.geometry-node-counts [data-geometry-residue="${residue}"]`);await node.focus();await page.keyboard.press('Enter');
    const expected=data[source].filter(r=>r.mapping.m9_residue===residue);
    const promise=page.waitForEvent('download');await geo.locator('[data-geometry-export="json"]').click();
    const file=path.join(out,`${source}-${viewport.width}.json`);await(await promise).saveAs(file);
    const result=JSON.parse(await fs.readFile(file,'utf8'));assert.equal(result.count,expected.length);assert.deepEqual(result.records.map(r=>r.id),expected.map(r=>r.id));
    assert.equal(result.mapping.modulo9,manifest.mapping.modulo9);assert.equal(result.parameters.inspection_group.value,residue);
    assert.equal(result.verification.python.wolfram_coordinate_table_sha256,result.verification.wolfram.coordinate_table_sha256);
    for(const r of result.records)assert.deepEqual(r.mapping,expected.find(x=>x.id===r.id).mapping);
    await geo.locator('[data-geometry-clear-group]').click();
   }
   await geo.locator('#geometry-search').fill('not-a-factor');await expectCount(0);assert.equal(await geo.locator('[data-geometry-export="json"]').isDisabled(),true);
   await geo.locator('#geometry-search').fill('');await expectCount(9164);
   await geo.locator('#geometry-score').selectOption('800');await expectCount(data.jaspar.filter(r=>r.score>=800).length);
   await geo.locator('#geometry-source').selectOption('encode');await expectCount(255);
   await geo.locator('#geometry-search').fill('CTCF');await expectCount(data.encode.filter(r=>r.factor.includes('CTCF')).length);
   await geo.locator('#geometry-source').selectOption('studies');await expectCount(2);
   await geo.locator('[data-geometry-view="line"]').click();await geo.locator('#geometry-zoom').check();
   await geo.locator('.geometry-panels').screenshot({path:path.join(out,`studies-line-zoom-${viewport.width}.png`)});
   const first=await geo.locator('.geometry-inspector-body h4').textContent();
   await geo.locator('[data-geometry-step="1"]').click();assert.notEqual(await geo.locator('.geometry-inspector-body h4').textContent(),first);
   // Verify CSV and vector/raster exports are actual downloadable data and images.
   for(const format of ['csv','svg','png']){
    const download=page.waitForEvent('download');await geo.locator(`[data-geometry-export="${format}"]`).click();
    const file=path.join(out,`studies-${viewport.width}.${format}`);await(await download).saveAs(file);const bytes=await fs.readFile(file);
    if(format==='csv'){const s=bytes.toString();assert.ok(s.includes('TFBS012')&&s.includes('TFBS013')&&s.includes('anchor_offset_bp')&&s.includes('mapping_rules'));}
    if(format==='svg')assert.ok(bytes.toString().includes('<metadata>')&&bytes.toString().includes('OXTR binding-site geometry'));
    if(format==='png')assert.equal(bytes.subarray(1,4).toString(),'PNG');
   }
   assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
   await dialog.evaluate(e=>e.scrollTop=0);await page.screenshot({path:path.join(out,`experiment-${viewport.width}.png`)});
   // Preserve the source-data browser, learning lightbox, and Atlas/music context.
   assert.equal(await dialog.locator('.tfbs-datasets button').count(),4);
   await dialog.locator('[data-science-tfbs-learning]').click();await frame.locator('.science-tfbs-learning').waitFor({state:'visible'});await page.keyboard.press('Escape');
   assert.equal(await dialog.evaluate(e=>e.open),true);
   await page.keyboard.press('Escape');assert.equal(await dialog.evaluate(e=>e.open),false);assert.equal(await entry.evaluate(e=>e===document.activeElement),true);
   const after=await page.evaluate(()=>({full:document.fullscreenElement?.id,srcs:[...document.querySelectorAll('audio,video')].map(e=>e.currentSrc),times:[...document.querySelectorAll('audio,video')].map(e=>e.currentTime)}));
   assert.equal(page.url(),startUrl);assert.equal(after.full,before.full);assert.deepEqual(after.srcs,before.srcs);
   assert.deepEqual(errors,[]);
   report.push({viewport,combinations:36,source_counts:{studies:2,encode:255,jaspar:9164},retry:true,exports:['json','csv','svg','png'],keyboard:true,overflow:false,media_context_preserved:true,errors});
  } finally {await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(e=>e.pause())).catch(()=>{});await context.close();}
 }
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({candidate,results:report},null,2));console.log(JSON.stringify({out,results:report},null,2));
}finally{await browser.close();await server.close();}
