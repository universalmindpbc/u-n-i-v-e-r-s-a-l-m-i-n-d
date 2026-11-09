import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const candidate=process.argv.includes('--candidate');
const out=path.join(root,process.env.E8_QA_OUT||'research/informatics/e8-hypothesis-20261110');await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required','--disable-gpu','--disable-partial-raster','--run-all-compositor-stages-before-draw']});
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
 for(const width of (process.env.E8_QA_WIDTH?[+process.env.E8_QA_WIDTH]:[1470,1280,1024,390,320])){
  const context=await contextFor(width,width>=1400||width===1024?950:width===1280?800:844),hostPage=await context.newPage();hostPage.on('pageerror',e=>errors.push(e.message));
  await hostPage.goto('https://staging.universalmind.tv/informatics/geometry/?record=fibonacci-m9-p24&record-mode=research#e8',{waitUntil:'domcontentloaded'});
  const iframe=await hostPage.waitForSelector('#atlas-frame');const page=await iframe.contentFrame();
  try{await page.locator('#e8-view').waitFor({state:'visible'});}catch(error){console.log(JSON.stringify({errors,url:page.url(),text:(await page.locator('body').innerText()).slice(0,4000)}));throw error;}
  await page.getByRole('tab',{name:'E8',exact:true}).waitFor({state:'visible'});await page.getByRole('tab',{name:'Odom’s construction',exact:true}).waitFor({state:'visible'});
  const tabs=await page.locator('nav [role=tab]').allTextContents();assert.equal(tabs[tabs.indexOf('E8')+1],'Odom’s construction');
  assert.equal(await page.locator('[role=tab][aria-selected=true]').innerText(),'E8');
  assert.equal(await page.locator('#e8-research-hypothesis').textContent(),"Geometric representations derived from E8, including its triangular and tetrahedral face structure, may improve the speed, accuracy and cost efficiency of hyperspectral computer vision within our OXTR research programme. We propose investigating whether these structures provide useful ways to organise and process spectral information. Their connection to Odom\u2019s construction and the Phi Ratio supplies mathematical motivation; computational benefits remain to be established experimentally.");
  const notes=page.locator('#e8-view details').first();
  assert(!(await notes.evaluate(n=>n.open)));
  await notes.locator('summary').click();
  assert(await page.locator('#e8-research-hypothesis').isVisible());
  assert.match(await page.locator('#e8-root-polytope-note').innerText(),/60,480.*241,920/);
  assert.match(await page.locator('#e8-odom-note').innerText(),/Phi Ratio/);
  if(width===1470){const hypothesis=page.locator('#e8-research-hypothesis');await hypothesis.scrollIntoViewIfNeeded();await hypothesis.screenshot({path:path.join(out,`${candidate?'candidate':'staging'}-hypothesis-text.png`),animations:'disabled'});}
  await notes.locator('summary').click();
  await page.evaluate(()=>window.scrollTo(0,0));
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
   assert(await page.evaluate(()=>{
    const [cx,cy]=document.querySelector('.e8-drawing').dataset.m9Center.split(',').map(Number),ratio=.34/.56;
    return [...document.querySelectorAll('[data-e8-gamma-index]')].every(n=>{
     const a=document.querySelector(`[data-e8-reference="${n.dataset.e8GammaIndex}"]`);
     return Math.abs((+n.getAttribute('cx')-cx)-ratio*(+a.getAttribute('x')+(+a.getAttribute('width'))/2-cx))<1e-8&&Math.abs((+n.getAttribute('cy')-cy)-ratio*(+a.getAttribute('y')+(+a.getAttribute('height'))/2-cy))<1e-8;
    });
   }));
   const spacing=await page.evaluate(()=>{
    const svg=document.querySelector('.e8-drawing'),[cx,cy]=svg.dataset.m9Center.split(',').map(Number),r=+svg.dataset.m9Scale;
    const labels=[...svg.querySelectorAll('[data-e8-layer="alpha"] text')].map(n=>n.getBBox());
    const labelBounds=labels.flatMap(b=>[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]]).map(([x,y])=>Math.hypot(x-cx,y-cy));
    const roots=[...svg.querySelectorAll('[data-root-id]')].map(n=>[+n.getAttribute('cx'),+n.getAttribute('cy')]);
    const overlappingLabels=labels.some((a,i)=>labels.slice(i+1).some(b=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height));
    const separate=svg.dataset.projection==='symbolic'?Math.min(...roots.map(([x,y])=>Math.hypot(x-cx,y-cy)))>Math.max(...labelBounds)+5:true;
    const rootRadii=roots.map(([x,y])=>Math.hypot(x-cx,y-cy));
    const labelRingClear=svg.dataset.projection==='symbolic'||rootRadii.every(radius=>radius<Math.min(...labelBounds)-.8||radius>Math.max(...labelBounds)+.8);
    return {labelFont:getComputedStyle(svg.querySelector('[data-e8-layer=alpha] text')).fontSize,labelBand:[Math.min(...labelBounds),Math.max(...labelBounds)],rootRadii:[...new Set(rootRadii.map(n=>+n.toFixed(3)))],radius:r,svgHeight:svg.getBoundingClientRect().height,viewportHeight:innerHeight,figureTop:document.querySelector('.e8-figure').getBoundingClientRect().top,labels:labels.length,overlappingLabels,labelRingClear,clearOfCentralGeometry:Math.min(...labelBounds)>r*.44+8,separate,layout:svg.dataset.layout,diameter:svg.getBoundingClientRect().width};
   });
   if(spacing.overlappingLabels)await hostPage.waitForTimeout(750);
   await hostPage.screenshot({path:path.join(out,'candidate-spacing-failure.png')});
   assert.equal(spacing.labels,24);assert(!spacing.overlappingLabels,JSON.stringify({width,mode,spacing}));assert(spacing.clearOfCentralGeometry,JSON.stringify(spacing));assert(spacing.separate,JSON.stringify(spacing));
   assert.equal(spacing.layout,'overlay');assert(spacing.labelRingClear,JSON.stringify(spacing));
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
   results.push({width,mode,rootCount:240,layerCombinations:8,gammaInsetAnglesPreserved:true,spacing,betaNativeCycle:true,cycleStep:true,guideIndependent:true,noHorizontalOverflow:true});
   await page.locator('#e8-beta').uncheck();
   await page.evaluate(()=>window.scrollTo(0,0));
   const fold=await page.evaluate(()=>{
    const fig=document.querySelector('.e8-figure').getBoundingClientRect(),aside=document.querySelector('#e8-view aside').getBoundingClientRect(),svg=document.querySelector('.e8-drawing').getBoundingClientRect();
    return {height:innerHeight,figureTop:fig.top,figureBottom:fig.bottom,drawingHeight:svg.height,sidebarBeside:aside.x>=fig.right,controls:[...document.querySelectorAll('#e8-view select,#e8-view input')].map(n=>{const r=n.getBoundingClientRect();return {id:n.id,top:r.top,bottom:r.bottom};})};
   });
   if(width>=1000){assert(fold.figureTop>=0&&fold.figureBottom<=fold.height,JSON.stringify({width,mode,fold}));assert(fold.controls.every(c=>c.top>=0&&c.bottom<=fold.height),JSON.stringify({width,mode,fold}));}
   if(width>=1000)assert(fold.sidebarBeside,JSON.stringify(fold));
   results.at(-1).viewportFit=fold;
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await hostPage.waitForTimeout(750);
   await hostPage.screenshot({path:path.join(out,`${candidate?'candidate':'staging'}-${mode}-${width}.png`),animations:'disabled',fullPage:true});
   if(mode==='symbolic'){
    await page.locator('#e8-beta').check();
    await page.evaluate(()=>window.scrollTo(0,0));
    if(width>=1000)assert(await page.locator('.e8-figure').evaluate(n=>n.getBoundingClientRect().bottom<=innerHeight));
    await hostPage.waitForTimeout(750);
   await hostPage.screenshot({path:path.join(out,`${candidate?'candidate':'staging'}-all-layers-${width}.png`),fullPage:true});
    await page.locator('#e8-beta').uncheck();
   }
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
 await page.waitForTimeout(750);
 await page.screenshot({path:path.join(out,`${candidate?'candidate':'staging'}-embedded-desktop.png`),fullPage:true});
 assert.equal(new URL(page.url()).hash,'#e8');results.push({embedded:true,deepLink:true,rootCount:240});await close(context);
 assert.deepEqual(errors,[]);
 const report={mode:candidate?'candidate':'staging',softwareRendering:true,processAudioMuted:true,playbackBlocked:true,nativeFullscreen:false,results};
 await fs.writeFile(path.join(out,`${report.mode}-browser.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await server.close();}
