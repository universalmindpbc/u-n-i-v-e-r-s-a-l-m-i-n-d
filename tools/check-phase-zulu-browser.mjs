import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const candidate=process.env.INFORMATICS_CANDIDATE==='1';
const output=process.env.INFORMATICS_QA_OUTPUT||'/private/tmp/phase-zulu-qa';
await fs.mkdir(output,{recursive:true});
const outer=['DRD2','SLC6A4','NMDAR','IL6','DOCK2','NR3C1'];
const inner=['NOS3','NAD+','Telomeres','CD38','COL1A1','TERRA'];
const aims=['dopamine','serotonin','learning + memory','immunity + inflammation','PTSD','cortisol','gasotransmitter','electron transfer','biological clock','oxytocin release','collagen','chromosome stability','oxytocin','neurotransmitter'];
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),results=[];
try{
 for(const viewport of [{width:1470,height:956},{width:1024,height:768},{width:390,height:844},{width:320,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  if(candidate)await context.route(/https:\/\/staging\.universalmind\.tv\/(?:I|i)nformatics\//,async route=>{
   const relative=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/(?:I|i)nformatics\//,'')||'index.html',file=path.resolve(root,'Informatics',relative);
   if(!file.startsWith(path.join(root,'Informatics')+path.sep))return route.abort();
   try{await route.fulfill({status:200,contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream',body:await fs.readFile(file)});}catch{await route.fulfill({status:404,body:'Missing candidate file'});}
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?about=1',{waitUntil:'domcontentloaded'});
  await page.locator('[data-network]').click();await page.locator('.network-overlay[open]').waitFor();
  const map=page.locator('#network-diagram');assert.equal(await map.isVisible(),true);
  assert.deepEqual(await map.locator('[data-ring="outer"]').evaluateAll(nodes=>nodes.map(n=>n.dataset.networkTarget)),outer);
  assert.deepEqual(await map.locator('[data-ring="inner"]').evaluateAll(nodes=>nodes.map(n=>n.dataset.networkTarget)),inner);
  assert.equal(await map.locator('[data-ring="nested"]').getAttribute('data-network-target'),'NOS1');
  assert.equal(await map.locator('[data-ring="core"]').getAttribute('data-network-target'),'OXTR');
  assert.deepEqual(await map.locator('.network-node-aim').allTextContents(),aims);
  assert.equal(await map.locator('rect').count(),0);
  assert.equal(await map.locator('.network-petal--outer').count(),6);
  assert.equal(await map.locator('.network-petal--inner').count(),6);
  assert.equal(await map.locator('.network-nos1-casing').count(),1);
  assert.equal(await map.locator('[data-network-target="NMDAR"]').getAttribute('data-library-gene'),'NMDA');
  assert.equal(await map.locator('[data-network-target="Telomeres"]').getAttribute('data-library-gene'),'Telomerase');
  assert.deepEqual(await page.locator('.network-sequence li a').allTextContents(),['OXTR',...outer]);
  assert.match(await page.locator('.network-system-heading').innerText(),/Transcript Element Listening System/);
  assert.match(await page.locator('.network-system-heading').innerText(),/Pathway of transcription of neurotransmitter-based genes/);
  assert.match(await page.locator('.network-status').innerText(),/validation pending/);
  const geometry=await map.locator('[data-network-target]').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>{const m=n.transform.baseVal.consolidate().matrix;return [n.dataset.networkTarget,{x:m.e,y:m.f}];})));
  assert.ok(geometry.NR3C1.y<geometry.DRD2.y&&geometry.DRD2.y<geometry.SLC6A4.y&&geometry.SLC6A4.y<geometry.NMDAR.y);
  assert.ok(geometry.DRD2.x>600&&geometry.SLC6A4.x>600&&geometry.IL6.x<600&&geometry.DOCK2.x<600);
  assert.ok(geometry.NOS3.x<600&&geometry['NAD+'].x>600&&geometry.TERRA.x<600&&geometry.Telomeres.x>600&&geometry.COL1A1.x<600&&geometry.CD38.x>600);
  assert.ok(Math.hypot(geometry.NOS1.x-600,geometry.NOS1.y-410)+41<132);
  const textBounds=await map.locator('text').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect(),s=n.ownerSVGElement.getBoundingClientRect();return {label:n.textContent,inside:r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1};}));
  assert.deepEqual(textBounds.filter(t=>!t.inside),[]);
  assert.equal(await page.locator('.network-body').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
  await page.screenshot({path:path.join(output,`network-${viewport.width}.png`)});
  await map.screenshot({path:path.join(output,`map-${viewport.width}.png`)});
  await page.locator('.network-zoom').click();assert.equal(await page.locator('.network-zoom').getAttribute('aria-pressed'),'true');
  assert.ok(await page.locator('.network-map-scroll').evaluate(e=>e.scrollWidth>e.clientWidth));
  await page.screenshot({path:path.join(output,`enlarged-${viewport.width}.png`)});
  await page.locator('.network-zoom').click();assert.equal(await page.locator('.network-zoom').getAttribute('aria-pressed'),'false');
  // Keyboard activation enters the same in-experience research library.
  const node=map.locator('[data-network-target="IL6"]');await node.focus();await page.keyboard.press('Enter');
  const frame=page.frameLocator('.library-overlay iframe');await frame.locator('.research-card').first().waitFor();assert.equal(await frame.locator('#target').inputValue(),'IL6');
  await page.locator('.library-overlay button').click();assert.equal(await node.evaluate(e=>e===document.activeElement),true);
  for(const [id,filter] of [['NMDAR','NMDA'],['Telomeres','Telomerase']]){
   await map.locator(`[data-network-target="${id}"]`).click();await frame.locator('#target').waitFor();assert.equal(await frame.locator('#target').inputValue(),filter);await page.locator('.library-overlay button').click();
  }
  await page.locator('.network-directory summary').click();assert.equal(await page.locator('.network-directory article').count(),14);
  assert.deepEqual(await page.locator('.network-directory h4').allTextContents(),['Outer sequence','Inner biological targets','Central focus & nested target']);
  assert.equal(await page.locator('.network-references a').count(),2);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('.network-directory').screenshot({path:path.join(output,`directory-${viewport.width}.png`)});
  await page.keyboard.press('Escape');assert.equal(await page.locator('[data-network]').evaluate(e=>e===document.activeElement),true);
  assert.deepEqual(errors,[]);
  results.push({viewport,targets:14,outer:6,inner:6,nestedNOS1:true,centralOXTR:true,originalResearchAims:true,sequencePreserved:true,noRectangularNodes:true,mapVisible:true,zoom:true,keyboardLibraryNavigation:true,filterAliases:true,focusRestored:true,noHorizontalPageOverflow:true,errors});
  await context.close();
 }
 const result={passed:true,candidate,checkedAt:new Date().toISOString(),base,processMuted:true,nativeFullscreen:false,results};
 await fs.writeFile(path.join(output,'verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{for(const context of browser.contexts()){for(const page of context.pages())await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});await context.close();}await browser.close().catch(()=>{});await server.close().catch(()=>{});}
