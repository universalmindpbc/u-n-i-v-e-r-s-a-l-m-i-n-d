import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.QA_OUTPUT||path.join(root,'research/informatics/music-ai-20261031');
await fs.mkdir(out,{recursive:true});
const candidate=process.env.CANDIDATE==='1';
const mode=candidate?'candidate':'staging';
const base='https://staging.universalmind.tv/informatics/';
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const errors=[],results=[];
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',acceptDownloads:true});
  if(candidate)await context.route(/https:\/\/staging\.universalmind\.tv\/(?:I|i)nformatics\//,async route=>{
   const rel=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/(?:I|i)nformatics\//,'')||'index.html';
   if(rel!=='index.html'&&!rel.startsWith('music-atlas/')&&!rel.startsWith('read/music/'))return route.continue();
   await route.fulfill({status:200,contentType:{'.html':'text/html','.json':'application/json','.md':'text/markdown','.css':'text/css','.csv':'text/csv'}[path.extname(rel)],body:await fs.readFile(path.join(root,'Informatics',rel))});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?entry=research&area=sound',{waitUntil:'domcontentloaded'});
  await page.locator('#area-sound').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);
  assert.equal(await page.locator('#music-atlas-machine').isVisible(),false);
  assert.equal(await page.locator('#music-atlas-machine [data-music-model]').count(),6);
  assert.equal(await page.locator('#music-atlas-machine table').count(),10);
  assert.equal(await page.locator('#music-atlas-data').isVisible(),false);
  const downloaded=JSON.parse(await fs.readFile(path.join(root,'Informatics/music-atlas/music-atlas.json'),'utf8'));
  assert.deepEqual(await page.locator('#music-atlas-data').evaluate(el=>JSON.parse(el.textContent)),downloaded);
  assert.equal(await page.locator('#music-atlas-downloads a').count(),4);
  const snapshots=[];
  for(const tab of ['sequence','melody','scale','chromatic','fifths','tuning']){
   await page.locator(`[data-sound-view="${tab}"]`).click();
   assert.equal(await page.locator(`[data-sound-view="${tab}"]`).getAttribute('aria-selected'),'true');
   const text=await page.locator('#sound-workings > div').innerHTML();
   assert.equal(text,downloaded.models.find(m=>m.id===tab).workings_html);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   snapshots.push({tab,title:await page.locator('#sound-view-title').innerText(),box:await page.locator('#sound-construction').boundingBox()});
  }
  await page.locator('[data-sound-view="sequence"]').click();
  await page.screenshot({path:path.join(out,`${mode}-atlas-${width}.png`)});
  await page.locator('#music-atlas-downloads').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('#music-atlas-downloads').isVisible(),true);
  assert.equal(await page.locator('#atlas-sections').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  assert.equal(await page.locator('#music-measurement').locator('.measurement-image').count(),3);
  await page.screenshot({path:path.join(out,`${mode}-downloads-${width}.png`)});
  if(width===1440){
   for(const ext of candidate?[]:['json','csv','md']){
    const event=page.waitForEvent('download');
    await page.locator(`#music-atlas-downloads a[download="music-atlas.${ext}"]`).click();
    const download=await event;assert.equal(download.suggestedFilename(),`music-atlas.${ext}`);
    const file=path.join(out,`download-check.${ext}`);await download.saveAs(file);const actual=await fs.readFile(file);const expected=await fs.readFile(path.join(root,`Informatics/music-atlas/music-atlas.${ext}`));
    assert.equal(crypto.createHash('sha256').update(actual).digest('hex'),crypto.createHash('sha256').update(expected).digest('hex'));
    await download.delete();await fs.unlink(file);
   }
   const popupEvent=page.waitForEvent('popup');await page.locator('#music-atlas-downloads a').first().click();
   const popup=await popupEvent;await popup.waitForLoadState('domcontentloaded');
   assert.equal(await popup.locator('[data-music-model]').count(),6);
   assert.equal(await popup.locator('a[download]').count(),6);
   await popup.close();
   assert.equal(await page.locator('#area-sound').isVisible(),true);
  }
  await page.evaluate(()=>document.querySelectorAll('audio,video').forEach(m=>m.pause()));await context.close();
  results.push({width,models:6,semanticTables:10,visibleDownloadLinks:4,existingTabsUnchanged:snapshots,nativeFullscreen:false});
 }
 const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});
 if(candidate)await noJS.route(base+'read/music/index.html',async route=>route.fulfill({status:200,contentType:'text/html',body:await fs.readFile(path.join(root,'Informatics/read/music/index.html'))}));
 const wiki=await noJS.newPage();await wiki.goto(base+'read/music/index.html',{waitUntil:'domcontentloaded'});
 assert.equal(await wiki.locator('[data-music-model]').count(),6);assert.equal(await wiki.locator('table').count(),10);
 assert.equal(await wiki.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,JSON.stringify(await wiki.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,70),width:el.getBoundingClientRect().width})))));
 await wiki.screenshot({path:path.join(out,`${mode}-wiki-no-javascript.png`)});await noJS.close();
 assert.deepEqual(errors,[]);
 const report={passed:true,mode,processAudioMuted:true,errors,downloadsByteVerified:!candidate,wikiWithoutJavascript:true,results};
 await fs.writeFile(path.join(out,`${mode}-browser.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await server.close();}
