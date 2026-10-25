const {chromium}=require('/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const candidate=process.argv.includes('--candidate'),out=process.argv[2],base='https://staging.universalmind.tv/informatics/';
const expected=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=await chromium.launchServer({headless:true,args:['--mute-audio','--autoplay-policy=user-gesture-required']});
 assert(server.process().spawnargs.includes('--mute-audio'));const browser=await chromium.connect(server.wsEndpoint());
 const report={candidate,audio:'Dedicated Chromium --mute-audio before navigation',viewports:[],animation:{},errors:[]};
 async function open(width,height,motion='reduce'){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:motion,acceptDownloads:true});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{};HTMLMediaElement.prototype.play=async()=>{};});
  if(candidate)await page.route('https://staging.universalmind.tv/**',async route=>{
   const u=new URL(route.request().url()),name=u.pathname.toLowerCase().replace('/informatics/','');
   const files={'':'index.html','index.html':'index.html','atlas-visuals.js':'atlas-visuals.js','atlas.css':'atlas.css'};
   if(u.pathname.toLowerCase().startsWith('/informatics/')&&Object.hasOwn(files,name))return route.fulfill({path:'/private/tmp/chromatic-candidate/Informatics/'+files[name],contentType:files[name].endsWith('.html')?'text/html':files[name].endsWith('.css')?'text/css':'text/javascript'});
   return route.continue();
  });
  await page.goto(base+'?entry=research&area=sound&sound=chromatic',{waitUntil:'networkidle',timeout:60000});
  if(await page.locator('#launch').isVisible())await page.locator('#launch').click();
  await page.locator('#sound-diagram[data-view=chromatic]').waitFor({state:'visible',timeout:20000});
  return {page,context};
 }
 async function close(page,context){await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(el=>el.pause()));await context.close();}
 try{
  for(const [width,height]of [[1470,956],[1024,768],[390,844],[320,844]]){
   const {page,context}=await open(width,height);
   try{
    const state=await page.evaluate(()=>{
     const svg=document.querySelector('#sound-diagram'),box=svg.viewBox.baseVal;
     return {tabs:[...document.querySelectorAll('[data-sound-view]')].map(el=>el.dataset.soundView),selected:document.querySelector('[data-sound-view][aria-selected=true]').dataset.soundView,progress:svg.dataset.progress,playing:svg.dataset.playing,layout:svg.dataset.chromaticLayout,pitches:[...svg.querySelectorAll('[data-chromatic-pitch]')].map(el=>el.dataset.note),keys:[...svg.querySelectorAll('[data-chromatic-key]')].map(el=>({pitch:+el.dataset.chromaticKey,color:el.dataset.keyColor})),groups:[...svg.querySelectorAll('[data-black-key-group]')].map(el=>+el.dataset.blackKeyGroup),overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...svg.querySelectorAll('text')].filter(el=>{const b=el.getBBox();return b.x<box.x-1||b.y<box.y-1||b.x+b.width>box.x+box.width+1||b.y+b.height>box.y+box.height+1;}).map(el=>el.textContent)};
    });
    assert.deepEqual(state.tabs,['sequence','melody','scale','chromatic','fifths','tuning']);assert.equal(state.selected,'chromatic');assert.deepEqual(state.pitches,expected);assert.equal(state.keys.filter(k=>k.color==='white').length,8);assert.equal(state.keys.filter(k=>k.color==='black').length,5);assert.deepEqual(state.keys.map(k=>k.pitch).sort((a,b)=>a-b),Array.from({length:13},(_,i)=>i));assert.deepEqual(state.groups,[2,3]);assert.equal(state.progress,'1.0000');assert.equal(state.playing,'false');assert.equal(state.overflow,false);assert.deepEqual(state.clipped,[]);
    await page.locator('#sound-diagram').screenshot({path:path.join(out,`diagram-${width}.png`)});
    await page.locator('#area-sound').screenshot({path:path.join(out,`page-${width}.png`)});
    await page.locator('#sound-tab-scale').click();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-sound-view][aria-selected=true]').getAttribute('data-sound-view'),'chromatic');
    await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-sound-view][aria-selected=true]').getAttribute('data-sound-view'),'fifths');
    await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#sound-tab-chromatic').getAttribute('aria-selected'),'true');
    await page.locator('#sound-workings summary').click();assert.match(await page.locator('#sound-workings').innerText(),/not a derivation of chromatic tuning/);assert.equal(await page.locator('#sound-atlas-link').isVisible(),false);
    if(width===1470){
     const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#sound-svg').click()]);await download.saveAs(path.join(out,download.suggestedFilename()));const exported=fs.readFileSync(path.join(out,download.suggestedFilename()),'utf8');assert.equal((exported.match(/data-chromatic-pitch=/g)||[]).length,12);assert.equal((exported.match(/data-chromatic-key=/g)||[]).length,13);report.svgExport=download.suggestedFilename();
     for(const view of ['scale','fifths','melody','sequence','tuning']){await page.locator('[data-sound-view="'+view+'"]').click();assert.equal(await page.locator('#sound-diagram').getAttribute('data-view'),view);assert.equal(await page.locator('#sound-atlas-link').isVisible(),true);}
    }
    report.viewports.push({width,height,...state,keyboardNavigation:true,workings:true});
   }finally{await close(page,context);}
  }
  const {page,context}=await open(1470,956,'no-preference');
  try{
   await page.locator('#sound-replay').click();await page.waitForTimeout(500);const first=Number(await page.locator('#sound-diagram').getAttribute('data-progress'));await page.waitForTimeout(600);const second=Number(await page.locator('#sound-diagram').getAttribute('data-progress'));assert(second>first);assert.equal(await page.locator('[data-chromatic-tracer]').count(),1);
   await page.locator('#sound-play').click();const paused=await page.locator('#sound-diagram').getAttribute('data-progress');await page.waitForTimeout(400);assert.equal(await page.locator('#sound-diagram').getAttribute('data-progress'),paused);await page.locator('#sound-diagram').screenshot({path:path.join(out,'animation-in-progress.png')});
   await page.locator('#sound-replay').click();await page.waitForTimeout(120);const replay=Number(await page.locator('#sound-diagram').getAttribute('data-progress'));assert(replay<Number(paused));await page.waitForTimeout(4800);const completed=Number(await page.locator('#sound-diagram').getAttribute('data-progress'));assert.equal(completed,1);await page.waitForTimeout(1200);const loop=Number(await page.locator('#sound-diagram').getAttribute('data-progress'));assert(loop<1);await page.locator('#sound-play').click();
   report.animation={first,second,paused:Number(paused),replay,completed,loop,pass:true};
  }finally{await close(page,context);}
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,candidate,viewports:report.viewports.map(x=>x.width),animation:report.animation,svgExport:report.svgExport,errors:report.errors}));
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
