import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),live=process.argv.includes('--live'),origin='https://staging.universalmind.tv';
const out=live?path.join(root,'documents/universal-mind-lab/qa/research-entry'):'/private/tmp/um-lab-research-qa';
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],hashes=[];
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
async function setup(viewport){
 const c=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
 await c.addInitScript(()=>{
  Object.defineProperty(window,'Hls',{get:()=>undefined,set(){},configurable:true});
  HTMLMediaElement.prototype.canPlayType=()=> 'probably';HTMLMediaElement.prototype.play=()=>Promise.reject(new Error('Non-playback research layout check'));
  Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true});Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;
 });
 if(!live)await c.route(origin+'/**',async r=>{const u=new URL(r.request().url()),f=path.join(root,u.pathname.slice(1)+(u.pathname.endsWith('/')?'index.html':''));if(fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.abort();});
 c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 const p=await c.newPage();return {c,p};
}
async function close(c){for(const p of c.pages())for(const f of p.frames())await f.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});await c.close();}
async function researchLayout(p,viewport){
 await p.locator('#full-collection').waitFor();
 assert.equal(await p.locator('.topics nav a').count(),9);
 assert.equal(await p.locator('.institutions a').count(),2);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const urls=await p.locator('main a').evaluateAll(links=>links.map(a=>a.href));
 assert(urls.every(url=>new URL(url).pathname==='/informatics/research/'));
 assert.deepEqual(new URL(urls[0]).searchParams.getAll('topic'),['sound:universal-mind-mobile-lab','vision:universal-mind-mobile-lab','language:universal-mind-mobile-lab']);
 await p.screenshot({path:path.join(out,`research-${viewport.width}.png`),fullPage:true});
 checks.push(`Research introduction at ${viewport.width} × ${viewport.height}: two institutions, nine topics, all research links point to Informatics`);
}
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){
  const {c,p}=await setup(viewport);
  try{
   await p.goto(origin+'/lab/?launch=1');await p.locator('body[data-ready="true"][data-site-ready="true"]').waitFor({timeout:45000});
   const link=p.locator('.research-link');await link.waitFor({state:'visible'});
   const bounds=await link.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=viewport.width+1&&bounds.y+bounds.height<=viewport.height);
   const overlap=await p.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect(),r=rect('.research-link');
    return ['.footline>span','.proposal-status','#place-list','.view-tools'].filter(s=>{const b=rect(s);return Math.min(r.right,b.right)>Math.max(r.left,b.left)&&Math.min(r.bottom,b.bottom)>Math.max(r.top,b.top);});
   });assert.deepEqual(overlap,[],'Footer link has its own visible space');
   await p.screenshot({path:path.join(out,`footer-${viewport.width}.png`)});
   const original=p.url(),opened=c.waitForEvent('page');await link.click();const research=await opened;
   await research.waitForLoadState('domcontentloaded');assert.equal(p.url(),original);assert.equal(new URL(research.url()).pathname,'/lab/research.html');
   await researchLayout(research,viewport);
   checks.push(`Festival footer opens research separately and retains the festival at ${viewport.width} × ${viewport.height}`);
   if(live&&viewport.width===1440){
    await research.locator('#full-collection').click();
    let library;
    for(let i=0;i<60;i++){
     for(const f of research.frames())if(await f.locator('#result-count').count()){library=f;break;}
     if(library&&(await library.locator('#result-count').textContent()).trim()==='105 papers')break;
     await new Promise(resolve=>setTimeout(resolve,500));
    }
    assert(library,'Informatics research frame exists: '+research.frames().map(f=>f.url()).join(', '));
    assert.equal((await library.locator('#result-count').textContent()).trim(),'105 papers');
    await research.screenshot({path:path.join(out,'informatics-full-collection.png')});
    checks.push('Full collection opens the canonical Informatics library with exactly 105 papers');
    for(const topic of ['orygen-youth','black-dog-youth','mantra-youth']){
     await research.goto(origin+'/lab/research.html');await research.locator(`a[href$="#topic-${topic}"]`).click();
     let found=false;
     for(let i=0;i<60;i++){for(const f of research.frames())if(await f.locator('#topic-'+topic).count()){found=true;break;}if(found)break;await new Promise(resolve=>setTimeout(resolve,500));}
     assert(found,`Canonical topic exists: ${topic}`);
    }
    checks.push('Orygen, Black Dog Institute and mantra context links open their exact Informatics topic sections');
    for(const file of ['lab/index.html','lab/lab.css','lab/lab.mjs','lab/media.mjs','lab/research.html','lab/research.css']){
     const response=await p.request.get(origin+'/'+file+'?qa=refine',{headers:{'Cache-Control':'no-cache'}});assert.equal(response.status(),200);
     const sha256=createHash('sha256').update(await response.body()).digest('hex');assert.equal(sha256,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'));hashes.push({file,sha256});
    }
   }
  }finally{await close(c);}
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({date:new Date().toISOString(),live,processMuted:true,nativeFullscreenInvoked:false,playbackMocked:true,checks,hashes,errors},null,2)+'\n');console.log(checks.join('\n'));
}finally{await browser.close();await server.close();}
