import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const candidate=process.argv.includes('--candidate');
const out=path.join(root,'research/informatics/e8-layers-20261109');await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());const results=[],errors=[];
async function contextFor(width,height){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
 await context.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.resolve();};});
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(request.resourceType()==='media'||/\.(mp4|mp3|m3u8|webm|wav)(?:$|\?)/.test(url.href))return route.abort();
  if(request.method()!=='GET')return route.abort();
  if(candidate&&url.origin==='https://staging.universalmind.tv'){
   let relative=decodeURIComponent(url.pathname).replace(/^\//,'').replace(/^informatics\//,'Informatics/');
   if(relative==='Informatics/geometry/')relative='Informatics/chapters/geometry.html';
   else if(relative.endsWith('/'))relative+='index.html';
   try{const body=await fs.readFile(path.join(root,relative));const contentType={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.csv':'text/csv','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.bin':'application/octet-stream'}[path.extname(relative)]||'application/octet-stream';return route.fulfill({status:200,body,contentType});}catch{}
  }
  return route.continue();
 });return context;
}
async function close(context){for(const p of context.pages())for(const frame of p.frames())await frame.evaluate(()=>document.querySelectorAll('audio,video').forEach(m=>m.pause())).catch(()=>{});await context.close();}
try{
 for(const width of [1440,390,320]){
  const context=await contextFor(width,width===1440?950:844),hostPage=await context.newPage();hostPage.on('pageerror',e=>errors.push(e.message));
  await hostPage.goto('https://staging.universalmind.tv/informatics/geometry/?record=fibonacci-m9-p24&record-mode=research#e8',{waitUntil:'domcontentloaded'});
  const iframe=await hostPage.waitForSelector('#atlas-frame');const page=await iframe.contentFrame();
  try{await page.locator('#e8-view').waitFor({state:'visible'});}catch(error){console.log(JSON.stringify({errors,url:page.url(),text:(await page.locator('body').innerText()).slice(0,4000)}));throw error;}
  const tabs=await page.locator('nav [role=tab]').allTextContents();assert.equal(tabs[tabs.indexOf('E8')+1],'Odom’s construction');
  assert.equal(await page.locator('[role=tab][aria-selected=true]').innerText(),'E8');
  assert(!/quantum|genomic|OXTR/i.test(await page.locator('#e8-view').innerText()));
  assert(await page.locator('#e8-alpha').isChecked());assert(await page.locator('#e8-gamma').isChecked());assert(!(await page.locator('#e8-beta').isChecked()));
  for(const mode of ['symbolic','p24','p30']){
   await page.selectOption('#e8-projection',mode);
   await page.waitForFunction(mode=>document.querySelector('.e8-drawing').dataset.projection===mode,mode);
   assert.equal(await page.locator('[data-root-id]').count(),240);
   assert.equal(await page.locator('[data-cycle-active=true]').count(),mode==='p30'?8:10);
   assert.equal(await page.locator('#e8-step').getAttribute('max'),mode==='p30'?'29':'23');
   for(let mask=0;mask<8;mask++){
    for(const [i,name]of ['alpha','beta','gamma'].entries())await page.locator('#e8-'+name).setChecked(Boolean(mask&(1<<i)));
    assert.equal(await page.locator('[data-e8-reference]').count(),mask&1?24:0);
    assert.equal(await page.locator('[data-e8-beta-value]').count(),mask&2?6:0);
    assert.equal(await page.locator('[data-e8-beta-grid]').count(),mask&2?9:0);
    assert.equal(await page.locator('[data-e8-gamma-index]').count(),mask&4?6:0);
    assert.equal(await page.locator('[data-e8-gamma-path]').count(),mask&4?2:0);
    assert.equal(await page.locator('[data-root-id]').count(),240);
    for(const [i,name]of ['alpha','beta','gamma'].entries())assert.equal(await page.locator('#e8-'+name+'-legend').isVisible(),Boolean(mask&(1<<i)));
   }
   assert.deepEqual(await page.locator('[data-e8-beta-value]').evaluateAll(nodes=>nodes.map(n=>+n.dataset.e8BetaValue)),[4,8,7,5,1,2]);
   assert(await page.evaluate(()=>[...document.querySelectorAll('[data-e8-gamma-index]')].every(n=>{const a=document.querySelector(`[data-e8-reference="${n.dataset.e8GammaIndex}"]`);return Math.abs(+n.getAttribute('cx')-(+a.getAttribute('x')+(+a.getAttribute('width'))/2))<1e-9&&Math.abs(+n.getAttribute('cy')-(+a.getAttribute('y')+(+a.getAttribute('height'))/2))<1e-9;})));
   assert.equal(await page.locator('[data-e8-beta-path]').getAttribute('stroke'),'#ffea42');
   assert.equal(await page.locator('[data-e8-gamma-path]').first().getAttribute('stroke'),'#ff84c5');
   const fixed=await page.locator('[data-e8-layer]').evaluateAll(nodes=>nodes.map(n=>n.outerHTML));
   await page.locator('#e8-step').fill(mode==='p30'?'29':'23');
   assert.match(await page.locator('#e8-step-label').innerText(),mode==='p30'?/30 of 30/:/24 of 24/);
   if(mode==='p30'){assert.deepEqual(await page.locator('[data-e8-layer]').evaluateAll(nodes=>nodes.map(n=>n.outerHTML)),fixed);assert(await page.locator('#e8-cycle-note').isVisible());}
   await page.locator('#e8-guide').uncheck();assert.equal(await page.locator('[data-e8-guide]').count(),0);assert.equal(await page.locator('[data-e8-gamma-path]').count(),2);
   await page.locator('#e8-guide').check();assert.equal(await page.locator('[data-e8-guide]').count(),3);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert(await page.locator('.e8-drawing').evaluate(svg=>{const b=svg.viewBox.baseVal;return [...svg.querySelectorAll('[data-root-id]')].every(n=>{const x=+n.getAttribute('cx'),y=+n.getAttribute('cy');return Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=b.width&&y>=0&&y<=b.height;});}));
   results.push({width,mode,rootCount:240,layerCombinations:8,gammaOnAlphaNodes:true,betaNativeCycle:true,cycleStep:true,guideIndependent:true,noHorizontalOverflow:true});
   if(mode==='p24'||(width===1440&&mode==='symbolic'))await hostPage.screenshot({path:path.join(out,`${candidate?'candidate':'staging'}-${mode}-${width}.png`),fullPage:false});
   await page.locator('#e8-beta').uncheck();
  }
  await page.getByRole('tab',{name:'Odom’s construction',exact:true}).click();assert(await page.locator('#e8-view').isHidden());assert(await page.locator('#odom-view').isVisible());
  await page.getByRole('tab',{name:'E8',exact:true}).click();assert(await page.locator('#odom-view').isHidden());
  await page.evaluate(()=>window.AtlasResearch.selectRecord('fibonacci-m18-p24','alpha'));
  await page.waitForFunction(()=>!document.querySelector('nav').textContent.includes('E8'));
  assert(await page.locator('#e8-view').isHidden());
  await page.evaluate(()=>window.AtlasResearch.selectRecord('fibonacci-m9-p24','e8'));
  await page.locator('#e8-view').waitFor({state:'visible'});
  await page.evaluate(()=>window.AtlasResearch.selectRecord('m-summary'));
  await page.locator('#family-view').waitFor({state:'visible'});assert(await page.locator('#e8-view').isHidden());
  assert.equal(await page.evaluate(()=>document.fullscreenElement),null);await close(context);
 }
 const context=await contextFor(1440,950),page=await context.newPage();
 await page.goto('https://staging.universalmind.tv/informatics/geometry/?record=fibonacci-m9-p24&record-mode=research#e8',{waitUntil:'domcontentloaded'});
 const frame=page.frameLocator('#atlas-frame');await frame.locator('#e8-view').waitFor({state:'visible',timeout:30000});
 await frame.locator('#e8-projection').selectOption('p24');assert.equal(await frame.locator('[data-root-id]').count(),240);
 await page.screenshot({path:path.join(out,`${candidate?'candidate':'staging'}-embedded-desktop.png`)});
 assert.equal(new URL(page.url()).hash,'#e8');results.push({embedded:true,deepLink:true,rootCount:240});await close(context);
 assert.deepEqual(errors,[]);
 const report={mode:candidate?'candidate':'staging',processAudioMuted:true,playbackBlocked:true,nativeFullscreen:false,results};
 await fs.writeFile(path.join(out,`${report.mode}-browser.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await server.close();}
