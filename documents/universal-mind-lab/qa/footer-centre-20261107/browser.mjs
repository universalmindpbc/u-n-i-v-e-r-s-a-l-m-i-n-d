import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=process.cwd(),mode=process.argv[2]||'local';
const out=path.join(root,'documents/universal-mind-lab/qa/footer-centre-20261107',mode);
fs.mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--autoplay-policy=user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
await context.addInitScript(()=>{Element.prototype.requestFullscreen=async()=>{};Element.prototype.webkitRequestFullscreen=async()=>{};});
if(mode==='local')await context.route('https://staging.universalmind.tv/lab/**',route=>{
  const pathname=new URL(route.request().url()).pathname;
  return route.fulfill({path:path.join(root,'lab',pathname==='/lab/'?'index.html':pathname.slice(5))});
});
const page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
try{
  await page.goto('https://staging.universalmind.tv/lab/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+100));
  await page.locator('#explore-enter').click();await page.clock.runFor(40);await page.clock.fastForward(32000);await page.clock.runFor(40);
  await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause()));
  for(const viewport of [{width:390,height:844},{width:320,height:740},{width:844,height:390},{width:667,height:375},{width:1440,height:1000}]){
    await page.setViewportSize(viewport);await page.clock.runFor(40);
    const geometry=await page.locator('#world .footline').evaluate(e=>{
      const rect=x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,cx:r.x+r.width/2};};
      const credit=e.querySelector('.initiative-credit'),proposal=e.querySelector('.proposal-status');
      const textRects=[];const walker=document.createTreeWalker(credit,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){if(!walker.currentNode.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(walker.currentNode);for(const r of range.getClientRects())textRects.push({x:r.x,y:r.y,width:r.width,height:r.height});}
      return {pageCentre:innerWidth/2,credit:rect(credit),proposal:rect(proposal),logos:[...e.querySelectorAll('.partner-mark')].map(rect),textRects,footer:rect(e),overflow:e.scrollWidth-e.clientWidth};
    });
    assert(Math.abs(geometry.credit.cx-geometry.pageCentre)<.6,JSON.stringify({viewport,geometry}));
    assert(Math.abs(geometry.proposal.cx-geometry.pageCentre)<.6,JSON.stringify({viewport,geometry}));
    assert(geometry.overflow<1);
    for(const t of geometry.textRects)for(const l of geometry.logos){const overlap=Math.min(t.x+t.width,l.x+l.width)-Math.max(t.x,l.x)>0&&Math.min(t.y+t.height,l.y+l.height)-Math.max(t.y,l.y)>0;assert(!overlap,'Credit overlaps logo '+JSON.stringify({viewport,t,l}));}
    await page.locator('#world .footline').screenshot({path:path.join(out,`footer-${viewport.width}.png`)});
    checks.push({viewport,...geometry});
  }
  const http=[];
  if(mode==='live')for(const file of ['index.html','partner-marks.css']){
    const response=await context.request.get('https://staging.universalmind.tv/lab/'+file+'?qa=footer-centre-20261107');assert.equal(response.status(),200);
    const sha=b=>createHash('sha256').update(b).digest('hex');const digest=sha(await response.body());assert.equal(digest,sha(fs.readFileSync(path.join(root,'lab',file))));http.push({file,status:response.status(),sha256:digest});
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,mode,processMuted:true,nativeFullscreen:false,checks,http,errors},null,2)+'\n');
  console.log(JSON.stringify({passed:true,mode,viewports:checks.length,maxCentreError:Math.max(...checks.map(c=>Math.abs(c.credit.cx-c.pageCentre)))}));
}finally{await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await context.close();await browser.close();await server.close();}
