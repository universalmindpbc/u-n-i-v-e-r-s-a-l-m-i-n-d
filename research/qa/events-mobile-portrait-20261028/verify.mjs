import{createRequire}from'node:module';import fs from'node:fs/promises';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.QA_OUTPUT||'/private/tmp/events-mobile-portrait-qa',url='https://staging.universalmind.tv/events/';await fs.mkdir(out,{recursive:true});assert(process.env.EVENTS_QA_PASSWORD,'Provide the existing invitation password through EVENTS_QA_PASSWORD.');
const server=await chromium.launchServer({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--mute-audio']});assert(server.process().spawnargs.includes('--mute-audio'));const browser=await chromium.connect(server.wsEndpoint());
const report={url,processAudioDisabled:true,realIphoneSafariTested:false,nativeFullscreenInvoked:false,fullscreenApiStubbed:true,cases:[]};
try{
 for(const mode of ['desktop','phone-supported','phone-standard','phone-unsupported']){
  const mobile=mode!=='desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1470,height:920},isMobile:mobile,hasTouch:mobile,reducedMotion:'no-preference'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({mode})=>{
   window.__nativeFullscreenCalls=0;window.__pageFullscreenCalls=0;
   if(mode==='desktop'){Element.prototype.requestFullscreen=function(){return Promise.resolve();};return;}
   Element.prototype.requestFullscreen=function(){window.__pageFullscreenCalls++;return Promise.resolve();};Object.defineProperty(document,'fullscreenEnabled',{configurable:true,get:()=>mode==='phone-standard'});
   Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>mode==='phone-standard'&&document.querySelector('#native-film')?.__mockFullscreen?document.querySelector('#native-film'):null});
   HTMLVideoElement.prototype.requestFullscreen=mode==='phone-standard'?function(){window.__nativeFullscreenCalls++;this.__mockFullscreen=true;document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();}:undefined;
   Object.defineProperty(HTMLVideoElement.prototype,'webkitSupportsFullscreen',{configurable:true,get:()=>mode==='phone-supported'});
   Object.defineProperty(HTMLVideoElement.prototype,'webkitDisplayingFullscreen',{configurable:true,get(){return Boolean(this.__mockFullscreen);}});
   HTMLVideoElement.prototype.webkitEnterFullscreen=mode==='phone-supported'?function(){window.__nativeFullscreenCalls++;this.__mockFullscreen=true;this.dispatchEvent(new Event('webkitbeginfullscreen'));}:undefined;
   if(mode==='phone-supported'){
    const observer=new MutationObserver(()=>{const v=document.getElementById('opening-loop');if(v){v.autoplay=false;v.removeAttribute('autoplay');v.pause();observer.disconnect();}});observer.observe(document,{childList:true,subtree:true});
    const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const gesture=Boolean(window.event?.isTrusted&&['click','touchend','keydown'].includes(window.event.type));if(this.id==='opening-loop'){if(gesture)window.__unlockedLoop=true;if(!window.__unlockedLoop)return Promise.reject(new DOMException('Autoplay blocked for verification','NotAllowedError'));}return play.call(this);};
   }
  },{mode});
  await page.goto(url);await page.locator('#password').fill(process.env.EVENTS_QA_PASSWORD);await page.getByRole('button',{name:'enter',exact:true}).click();const stage=page.locator('iframe.events-stage').contentFrame();await stage.locator('#festival-title').waitFor();await page.waitForTimeout(5500);
  if(mode==='desktop'){
   const baseline=JSON.parse(await fs.readFile(fileURLToPath(new URL('./desktop-baseline.json',import.meta.url)),'utf8'));
   const actual=await stage.locator('body').evaluate((element,selectors)=>Object.fromEntries(selectors.map(selector=>{const el=document.querySelector(selector),r=el.getBoundingClientRect(),s=getComputedStyle(el);return[selector,{x:r.x,y:r.y,width:r.width,height:r.height,font:s.fontFamily,fontSize:s.fontSize,weight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,color:s.color}]})),Object.keys(baseline));
   const differences=[];for(const[selector,expected]of Object.entries(baseline))for(const[key,value]of Object.entries(expected))if(actual[selector][key]!==value)differences.push({selector,key,before:value,after:actual[selector][key]});
   for(const diff of differences){assert(diff.selector==='.watch-film'&&typeof diff.before==='number'&&Math.abs(diff.after-diff.before)<.6,`Desktop changed: ${JSON.stringify(diff)}`);}
   report.cases.push({mode,differences,actual});await page.screenshot({path:out+'/desktop.png'});
  }else{
   assert.equal(await page.evaluate(()=>window.__pageFullscreenCalls),0);
   const loop=stage.locator('#opening-loop'),fullscreen=stage.locator('#fullscreen-toggle');assert.equal(await fullscreen.isVisible(),false);
   if(mode==='phone-supported'){
    assert(await loop.evaluate(v=>v.paused&&getComputedStyle(v).visibility==='hidden'));
    await page.screenshot({path:out+'/blocked-background.png'});
    await stage.locator('#global-nav-toggle').tap();await page.waitForTimeout(600);assert(await loop.evaluate(v=>!v.paused&&getComputedStyle(v).visibility==='visible'));
    await stage.locator('#about-return').tap();
    for(const size of[{width:320,height:568},{width:390,height:844},{width:430,height:932}]){
     await page.setViewportSize(size);await stage.locator('body').evaluate(()=>window.scrollTo(0,0));
     const geometry=await stage.locator('body').evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:innerHeight,pageHeight:document.documentElement.scrollHeight,items:Object.fromEntries(['.presenters','#festival-title','.tagline','#watch-film','.event-description','.venues','.hashtags','.proposal-label'].map(selector=>{const el=document.querySelector(selector),r=el.getBoundingClientRect(),s=getComputedStyle(el);return[selector,{left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height,fontSize:parseFloat(s.fontSize),position:s.position,font:s.fontFamily}]}))}));
     assert(geometry.scrollWidth<=geometry.width);assert(geometry.items['#festival-title'].right<=size.width-20);assert(geometry.items['.event-description'].fontSize>=16);assert(geometry.items['.tagline'].fontSize>=22);assert(geometry.items['#watch-film'].height>=44);assert(geometry.items['#watch-film'].bottom<=size.height-10);
     for(const[a,b]of[['.presenters','#festival-title'],['#festival-title','.tagline'],['.tagline','#watch-film'],['#watch-film','.event-description'],['.event-description','.venues'],['.venues','.hashtags'],['.hashtags','.proposal-label']])assert(geometry.items[a].bottom<geometry.items[b].top,`${size.width} overlap: ${a}, ${b}`);
     assert.equal(await stage.locator('#watch-film svg').count(),1);assert(!/[▶►⏵]/.test(await stage.locator('#watch-film').textContent()));
     await page.screenshot({path:out+`/portrait-${size.width}.png`});await stage.locator('.proposal-label').scrollIntoViewIfNeeded();await page.screenshot({path:out+`/details-${size.width}.png`});report.cases.push({mode,portrait:geometry});
    }
   }
   await page.setViewportSize({width:390,height:844});await stage.locator('#watch-film').tap();const film=stage.locator('#native-film');await film.waitFor({state:'visible'});
   for(let i=0;i<60;i++){if(await film.evaluate(v=>!v.paused&&v.currentTime>.2))break;await page.waitForTimeout(500);}assert(await film.evaluate(v=>!v.paused&&v.currentTime>.2));
   for(const size of [{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(size);
    if(mode!=='phone-unsupported'){
     assert(await fullscreen.isVisible());const box=await fullscreen.boundingBox();assert(box.x>size.width-70&&box.y>size.height-80&&box.width>=44);
     const back=await stage.locator('#film-back').boundingBox(),flower=await stage.locator('#global-nav-toggle').boundingBox();assert(back.x>=flower.x+flower.width+8,'Film Back overlaps flower');
     await fullscreen.tap();assert.equal(await fullscreen.isVisible(),false);
     await film.evaluate(v=>{v.__mockFullscreen=false;v.dispatchEvent(new Event('webkitendfullscreen'));document.dispatchEvent(new Event('fullscreenchange'));});assert(await fullscreen.isVisible());
     await page.screenshot({path:out+`/${mode}-film-${size.width}.png`});report.cases.push({mode,fullscreenLayout:{size,box},nativeCallRouted:true});
    }else assert.equal(await fullscreen.isVisible(),false);
   }
   await stage.locator('#film-back').tap();assert.equal(await fullscreen.isVisible(),false);assert.equal(await stage.locator('#film-view').isVisible(),false);
   report.cases.push({mode,unsupportedHidden:mode==='phone-unsupported',pageFullscreenAbsent:true,filmBackWorks:true,nativeCalls:await stage.locator('body').evaluate(()=>window.__nativeFullscreenCalls)});
   if(mode==='phone-supported'){
    await loop.evaluate(v=>v.pause());await page.setViewportSize({width:390,height:844});await page.goto(url+'?experience=1');await page.waitForTimeout(5500);await page.screenshot({path:out+'/portrait-full-page.png',fullPage:true});await page.locator('#opening-loop').evaluate(v=>v.pause());
   }
  }
  for(const f of page.frames()){await f.locator('video').evaluateAll(videos=>videos.forEach(v=>v.pause())).catch(()=>{});}assert.deepEqual(errors,[]);await context.close();
 }
 report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;throw error;}
finally{await browser.close();await server.close();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failure:report.failure,cases:report.cases.map(c=>({mode:c.mode,differences:c.differences,viewport:c.portrait?.width,fullscreen:c.fullscreenLayout,nativeCalls:c.nativeCalls}))},null,2));}
