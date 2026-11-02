import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),origin='https://staging.universalmind.tv';
const live=process.env.PORTAL_LIVE==='1',only=process.env.PORTAL_ONLY||'all',out=process.env.PORTAL_QA_OUT||'/private/tmp/portal-route-qa';
const config=JSON.parse(await fs.readFile(path.join(root,'site-navigation/portals.json'))),inf=config.portals.find(p=>p.id==='informatics');
await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),results=[],errors=[];
async function makeContext(viewport={width:1470,height:956},options={}) {
 const ctx=await browser.newContext({viewport,...options});
 await ctx.addInitScript(()=>{
  let full=null;window.__fullscreenCalls=0;window.__fullscreenExits=0;
  Object.defineProperty(document,'fullscreenElement',{get:()=>full});
  Element.prototype.requestFullscreen=async function(){full=this;window.__fullscreenCalls++;document.dispatchEvent(new Event('fullscreenchange'));};
  document.exitFullscreen=async()=>{full=null;window.__fullscreenExits++;document.dispatchEvent(new Event('fullscreenchange'));};
 });
 if(!live)await ctx.route(origin+'/**',async route=>{
  const url=new URL(route.request().url());let rel=decodeURIComponent(url.pathname).slice(1);
  if(rel.startsWith('informatics/')) {
   const entry=inf.entries.find(e=>e.url===url.pathname);
   rel=entry&&!url.searchParams.has('embedded')?'Informatics/chapters/'+entry.id+'.html':'Informatics/'+rel.slice(12);
  }else if(rel.startsWith('vogue/iam/'))rel='i  a m/'+rel.slice(10);
  if(!rel||rel.endsWith('/'))rel+='index.html';
  const file=path.resolve(root,rel);if(!file.startsWith(root+'/'))return route.abort();
  if(/\.(php|mp4|m3u8|ts)$/.test(file))return route.continue();
  try{const body=await fs.readFile(file);await route.fulfill({status:200,body,contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.xml':'application/xml'}[path.extname(file)]||'application/octet-stream'});}catch{return route.continue();}
 });
 return ctx;
}
async function stop(ctx){for(const p of ctx.pages())for(const f of p.frames())await f.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});await ctx.close();}
async function snapshot(page,selector){return page.evaluate(selector=>{const m=document.querySelector(selector);return {same:m===window.__routeMedia,src:m?.currentSrc,time:m?.currentTime,paused:m?.paused,muted:m?.muted,volume:m?.volume,full:document.fullscreenElement?.id||document.fullscreenElement?.tagName,calls:__fullscreenCalls,exits:__fullscreenExits};},selector);}
function continuity(before,after,label){assert.equal(after.same,true,label+' identity');for(const key of ['src','muted','volume','full','calls','exits'])assert.equal(after[key],before[key],label+' '+key);assert.equal(after.paused,false,label+' playing');assert.ok(after.time>=before.time,label+' time');}
try {
 if(only==='all'||only==='informatics') {
  const ctx=await makeContext(),page=await ctx.newPage();page.on('pageerror',e=>errors.push({portal:'informatics',message:e.message}));
  try{
   await page.goto(origin+'/informatics/',{waitUntil:'domcontentloaded'});
   await page.locator('#launch:not([disabled])').waitFor({timeout:60000});await page.locator('#launch').click();
   await page.waitForFunction(()=>{const v=document.querySelector('#film');return v&&!v.paused&&v.currentTime>1;},{timeout:60000});
   await page.evaluate(()=>window.__routeMedia=document.querySelector('#film'));
   let before=await snapshot(page,'#film');assert.equal(before.muted,false);assert.equal(before.full,'experience');
   for(const entry of inf.entries){
    await page.locator('#atlas-toggle').click();
    await page.locator('#atlas-menu [href$="'+entry.url+'"]').click();
    await page.waitForFunction(id=>document.querySelector('#experience').dataset.area===id,entry.id);
    assert.equal(new URL(page.url()).pathname,entry.url);
    await page.waitForTimeout(400);
    const after=await snapshot(page,'#film');continuity(before,after,entry.id);before=after;
    console.log('Informatics '+entry.id+' retained');
    results.push({portal:'informatics',chapter:entry.id,url:page.url(),media:after});
   }
   await page.goBack();await page.waitForFunction(()=>document.querySelector('#experience').dataset.area==='connect');continuity(before,await snapshot(page,'#film'),'Back');
   await page.goForward();await page.waitForFunction(()=>document.querySelector('#experience').dataset.area==='partners');
   await page.evaluate(()=>document.dispatchEvent(new CustomEvent('atlas:route',{detail:{route:PortalRoutes.resolve('/informatics/research/?collection=sound'),mode:'push'}})));
   await page.frameLocator('#research-frame').locator('.contents-chapter').first().waitFor({timeout:60000});
   assert.ok((await page.locator('#research-frame').getAttribute('data-portal-src')).includes('collection=sound'));
   await page.evaluate(()=>document.dispatchEvent(new CustomEvent('atlas:route',{detail:{route:PortalRoutes.resolve('/informatics/sitemap/'),mode:'push'}})));
   await page.frameLocator('#connect-frame').locator('a[href="/informatics/language/"]').click();
   await page.waitForFunction(()=>document.querySelector('#experience').dataset.area==='language');
   continuity(before,await snapshot(page,'#film'),'Map return');
   await page.screenshot({path:path.join(out,'informatics-desktop.png')});
  }finally{await stop(ctx);}
 }
 if(only==='all'||only==='iam') {
  const ctx=await makeContext(),page=await ctx.newPage();page.on('pageerror',e=>errors.push({portal:'iam',message:e.message}));
  try{
   await page.goto(origin+(live?'/vogue/iam/index.html':'/iam/tv/'),{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.body.dataset.adaptiveSelectionSource==='no_checkin_random',{timeout:90000});
   await page.locator('[data-television-play]').click({timeout:60000});
   await page.waitForFunction(()=>{const v=document.querySelector('[data-television-player] video');return v&&!v.paused&&v.currentTime>1;},{timeout:60000});
   await page.evaluate(()=>window.__routeMedia=document.querySelector('[data-television-player] video'));
   let before=await snapshot(page,'[data-television-player] video');assert.equal(before.muted,false);
   const entries=config.portals.find(p=>p.id==='iam').entries.filter(e=>e.source&&e.id!=='home');
   for(const entry of entries){
    await page.evaluate(id=>{document.querySelector('[data-nav-item="'+id+'"]').click();document.querySelector('[data-nav-submenu="'+id+'"] a')?.click();},entry.id);
    await page.waitForFunction(()=>document.body.classList.contains('television-page-view-open'));
    assert.equal(new URL(page.url()).pathname,entry.url);
    await page.waitForTimeout(500);
    const after=await snapshot(page,'[data-television-player] video');continuity(before,after,entry.id);before=after;
    console.log('I AM '+entry.id+' retained');
    results.push({portal:'iam',chapter:entry.id,url:page.url(),media:after});
   }
   await page.goBack();assert.equal(new URL(page.url()).pathname,'/iam/our-team/');continuity(before,await snapshot(page,'[data-television-player] video'),'I AM Back');
   await page.goForward();assert.equal(new URL(page.url()).pathname,'/iam/shop/');
   await page.screenshot({path:path.join(out,'iam-desktop.png')});
  }finally{await stop(ctx);}
 }
 if(only==='all'||only==='direct') {
  const ctx=await makeContext(),page=await ctx.newPage();
  try {
   await page.goto(origin+'/iam/shop/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.body.classList.contains('television-page-view-open'),null,{timeout:60000});
   assert.equal(new URL(page.url()).pathname,'/iam/shop/');
   assert.ok(await page.locator('[data-television-page-frame]').count());
   await page.goto(origin+'/iam/about/',{waitUntil:'domcontentloaded'});
   await page.locator('[data-nav-item="science"]').waitFor({state:'attached'});
   await page.evaluate(()=>document.querySelector('[data-nav-item="science"]').click());
   await page.waitForFunction(()=>location.pathname==='/iam/science/');
   await page.locator('.research-link').first().waitFor({state:'attached'});
   assert.deepEqual(await page.locator('.research-link').evaluateAll(links=>links.map(link=>link.href)),['vision','sound','language'].map(collection=>origin+'/informatics/research/?collection='+collection));
   await page.goto(origin+'/iam/check-in/?full=1',{waitUntil:'domcontentloaded'});
   assert.equal(await page.evaluate(()=>new URL(document.body.dataset.iamNextPage,document.baseURI).pathname),'/vogue/iam/research.php');
   results.push({directEntries:['shop','about-to-science','check-in-relative-route'],passed:true});
  }finally{await stop(ctx);}
 }
 if(only==='all'||only==='mobile') {
  const ctx=await makeContext({width:390,height:844},{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'}),page=await ctx.newPage();
  try {
   await page.goto(origin+'/iam/about/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.documentElement.dataset.mobileEditorial==='true');
   await page.locator('[data-nav-item="science"]').waitFor({state:'attached'});
   await page.evaluate(()=>document.querySelector('[data-nav-item="science"]').click());
   await page.waitForFunction(()=>location.pathname==='/iam/science/');
   await page.locator('.research-link').first().waitFor({state:'attached'});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   results.push({mobile:'About to Science',phonePolicy:true,width:390});
  }finally{await stop(ctx);}
 }
 if(only==='all'||only==='shell') {
  const ctx=await makeContext(),page=await ctx.newPage();
  try {
   await page.goto(origin+'/home/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.UniversalMindEntry);
   await page.evaluate(()=>UniversalMindEntry.openDestination('/informatics/','Universal Informatics'));
   const child=page.frameLocator('.um-experience-frame');
   await child.locator('#launch:not([disabled])').waitFor({timeout:60000});await child.locator('#launch').click();
   await child.locator('#film').evaluate(async m=>{window.__routeMedia=m;while(m.currentTime<1)await new Promise(r=>setTimeout(r,100));});
   const original=await page.evaluate(()=>{window.__routeFrame=document.querySelector('.um-experience-frame');return {history:history.length,full:document.fullscreenElement?.tagName,calls:__fullscreenCalls};});
   await child.locator('#atlas-toggle').click();await child.locator('#atlas-menu [href$="/informatics/sound/"]').click();
   assert.equal(new URL(page.url()).pathname,'/informatics/sound/');
   assert.equal(await page.evaluate(()=>history.length),original.history+1);
   await page.goBack();
   await child.locator('#experience[data-area="home"]').waitFor();
   await page.goForward();await child.locator('#experience[data-area="sound"]').waitFor();
   assert.deepEqual(await page.evaluate(()=>({full:document.fullscreenElement?.tagName,calls:__fullscreenCalls,same:document.querySelector('.um-experience-frame')===window.__routeFrame})),{full:original.full,calls:original.calls,same:true});
   assert.equal(await child.locator('#film').evaluate(m=>m===window.__routeMedia&&!m.paused&&!m.muted),true);
   results.push({portal:'root-shell',singleHistoryEntry:true,retainedFrame:true,retainedMedia:true});
  }finally{await stop(ctx);}
 }
 if(only==='all'||only==='layout')for(const width of [1470,1024,390,320]){
  const ctx=await makeContext({width,height:900}),page=await ctx.newPage();
  try{for(const route of ['/sitemap/','/informatics/sitemap/','/iam/sitemap/','/informatics/sound/','/iam/about/','/iam/science/']){
    await page.goto(origin+route,{waitUntil:'domcontentloaded'});
    if(route==='/informatics/sound/')await page.waitForFunction(()=>document.querySelector('#experience').dataset.area==='sound',{timeout:60000});
    if(route==='/iam/science/'){await page.locator('.research-link').first().waitFor({state:'attached'});assert.deepEqual(await page.locator('.research-link').evaluateAll(links=>links.map(link=>link.href)),['vision','sound','language'].map(collection=>origin+'/informatics/research/?collection='+collection));}
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),route+' fits '+width);
    results.push({layout:route,width});
   }}finally{await stop(ctx);}
 }
 await fs.writeFile(path.join(out,'results.json'),JSON.stringify({passed:true,live,mutedProcess:true,fullscreen:'instrumented, not native',results,errors},null,2));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,live,checks:results.length,errors:errors.length,out}));
} catch(error){await fs.writeFile(path.join(out,'failure.json'),JSON.stringify({message:error.stack,results,errors},null,2));throw error;}
finally{await browser.close();await server.close();}
