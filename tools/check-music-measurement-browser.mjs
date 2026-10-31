import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.QA_OUTPUT||path.join(root,'research/informatics/music-measurement-20261031');
await fs.mkdir(out,{recursive:true});
const candidate=process.env.CANDIDATE==='1';
const mode=candidate?'candidate':'staging';
const base='https://staging.universalmind.tv/informatics/';
const changed=new Set(['index.html','music-measurement.css','music-measurement.js','media/music-measurement/unified-timeline.jpeg','media/music-measurement/brain-state-dashboard.jpeg','media/music-measurement/peak-moment-timeline.jpeg']);
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const errors=[],results=[];
try {
 for(const width of [1440,1024,390,320]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  if(candidate)await context.route(/https:\/\/staging\.universalmind\.tv\/(?:I|i)nformatics\//,async route=>{
   const rel=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/(?:I|i)nformatics\//,'')||'index.html';
   if(!changed.has(rel))return route.continue();
   await route.fulfill({status:200,contentType:{'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpeg':'image/jpeg'}[path.extname(rel)],body:await fs.readFile(path.join(root,'Informatics',rel))});
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?entry=research&area=sound',{waitUntil:'domcontentloaded'});
  await page.locator('#area-sound').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>document.fullscreenElement===null),true);
  const chapter=page.locator('#music-measurement');
  assert.equal(await chapter.locator('.measurement-image').count(),3);
  assert.deepEqual(await chapter.locator('.measurement-image img').evaluateAll(images=>images.map(i=>i.getAttribute('src').split('/').at(-1))),['unified-timeline.jpeg','brain-state-dashboard.jpeg','peak-moment-timeline.jpeg']);
  assert.ok(await page.evaluate(()=>document.querySelector('#sound-construction').compareDocumentPosition(document.querySelector('#music-measurement'))&Node.DOCUMENT_POSITION_FOLLOWING));
  for (const tab of ['sequence','melody','scale','chromatic','fifths','tuning']) {
   await page.locator(`[data-sound-view="${tab}"]`).click();
   assert.equal(await page.locator(`[data-sound-view="${tab}"]`).getAttribute('aria-selected'),'true');
   assert.equal(await chapter.isVisible(),true);
  }
  await chapter.scrollIntoViewIfNeeded();
  await chapter.evaluate(el=>el.scrollIntoView({block:'start'}));
  await page.screenshot({path:path.join(out,`${mode}-chapter-${width}.png`)});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.equal(await page.locator('#atlas-sections').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  for(let i=0;i<3;i++) {
   const button=chapter.locator('.measurement-image').nth(i);
   await button.scrollIntoViewIfNeeded();
   await button.locator('img').evaluate(img=>img.decode());
   assert.ok(await button.locator('img').evaluate(img=>img.naturalWidth>0));
   await button.focus();await page.keyboard.press('Enter');
   const dialog=page.locator('.measurement-dialog[open]');
   await dialog.waitFor();
   await dialog.locator('img').evaluate(img=>img.decode());
   assert.ok(await dialog.locator('[data-measurement-close]').evaluate(el=>el===document.activeElement));
   await dialog.locator('[data-measurement-zoom]').click();
   assert.equal(await dialog.getAttribute('data-enlarged'),'true');
   if(width===320&&i===0)assert.ok(await dialog.locator('.measurement-dialog-scroll').evaluate(el=>el.scrollWidth>el.clientWidth));
   await dialog.locator('[data-measurement-zoom]').click();
   assert.equal(await dialog.getAttribute('data-enlarged'),'false');
   if(i===0)await page.screenshot({path:path.join(out,`${mode}-image-${width}.png`)});
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('.measurement-dialog[open]').count(),0);
   assert.equal(await button.evaluate(el=>el===document.activeElement),true);
  }
  await chapter.locator('.measurement-next').evaluate(el=>el.scrollIntoView({block:'start'}));
  assert.match(await chapter.locator('.measurement-next').innerText(),/A\$600–A\$1,000/);
  const garvan=chapter.locator('.measurement-next a');
  assert.equal(await garvan.getAttribute('href'),'https://www.garvan.org.au/research/services/genome');
  assert.match(await chapter.innerText(),/HRV power spectral density \(PSD\)/);
  assert.equal(await chapter.locator('a[href="https://www.getimmersion.com/"]').count(),1);
  assert.equal(await chapter.locator('a[href="https://www.your6.com/"]').count(),1);
  assert.equal((await chapter.innerText()).includes('requiring independent validation'),false);
  await page.screenshot({path:path.join(out,`${mode}-sequencing-${width}.png`)});
  assert.equal(await page.locator('#atlas-sections').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  results.push({width,images:3,existingTabs:6,keyboardOpenClose:true,focusRestored:true,originalSizeScroll:true,noHorizontalPageOverflow:true,nativeFullscreen:false});
  await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>{m.pause();m.removeAttribute('src');m.load();}));
  await context.close();
 }
 assert.deepEqual(errors,[]);
 const report={mode,processAudioMuted:true,errors,results,passed:true};
 await fs.writeFile(path.join(out,`${mode}-browser.json`),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}finally{await browser.close();await server.close();}
