import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),live=process.argv.includes('--live'),origin='https://staging.universalmind.tv';
const out=live?path.join(root,'documents/universal-mind-lab/qa/youth-mobile-destinations'):'/private/tmp/um-youth-mobile-destinations-qa';
fs.mkdirSync(out,{recursive:true});
const data=JSON.parse(fs.readFileSync(path.join(root,'Informatics/library-data/youth-expansion.json')));
const cases=[
 ['all','Youth Research for Universal Mind Lab','universal-mind-mobile-lab'],
 ['orygen','Orygen Research','orygen-youth'],['black-dog','Black Dog Institute Research','black-dog-youth'],
 ['music','Music Listening and Therapy for Youth','music-youth'],['music-making','Music Making for Youth','music-making-youth'],
 ['brain-entrainment','Sound and Brain Entrainment for Youth','sound-entrainment-youth'],['emdr','EMDR for Youth','emdr-youth'],
 ['mindfulness','Mindfulness for Youth','mindfulness-youth'],['mantra','Mantra for Youth','mantra-youth'],
 ['transcendental-meditation','Transcendental Meditation for Youth','transcendental-meditation-youth'],['yoga','Yoga for Youth','yoga-youth'],
 ['connection','Access, Digital Support and Connection for Youth','youth-access-connection']
];
const checks=[],errors=[],hashes=[];
const record=s=>{checks.push(s);console.log(s);};
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const c=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
await c.addInitScript(()=>{HTMLMediaElement.prototype.play=()=>Promise.reject(new Error('Non-playback research check'));Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true});Element.prototype.requestFullscreen=undefined;Element.prototype.webkitRequestFullscreen=undefined;});
if(!live)await c.route(origin+'/**',async r=>{
 const u=new URL(r.request().url());let relative=decodeURIComponent(u.pathname).slice(1);
 if(relative.startsWith('informatics/'))relative='Informatics/'+relative.slice(12);
 if(relative==='Informatics/research/')relative='Informatics/chapters/research.html';
 if(relative.endsWith('/'))relative+='index.html';
 const f=path.join(root,relative);
 if(fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});
 if(u.pathname.startsWith('/vogue/iam/'))return r.fulfill({status:204,body:''});
 return r.abort();
});
const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
async function library(expectedYouth=new URL(p.url()).searchParams.get('youth')){
 for(let n=0;n<100;n++){
  for(const f of p.frames())if(new URL(f.url()).searchParams.get('youth')===expectedYouth&&await f.locator('.youth-publications, #result-count:not(:empty)').count())return f;
  await new Promise(r=>setTimeout(r,200));
 }
 throw new Error('Research did not render: '+p.frames().map(f=>f.url()).join(', '));
}
async function verify(row){
 const [key,title,topic]=row,f=await library(key);
 await f.locator('.youth-publications').waitFor();
 assert.equal(await f.locator('.library-intro h1').textContent(),title);
 const heading=await f.locator('.library-intro h1').boundingBox();
 assert(heading&&heading.y>=0&&heading.y+heading.height<p.viewportSize().height,`${key}: title visible on arrival`);
 assert(await f.locator('.youth-scope').isVisible());
 assert.match(await f.locator('.youth-scope').textContent(),/youth aged 16–24/);
 assert(!/young people/i.test(await f.locator('.library-intro').textContent()));
 assert.equal(await f.locator('#reading-content').getAttribute('data-youth-topic'),topic);
 const expected=[...new Set(Object.values(data.chapters).flatMap(ch=>ch.topics).filter(t=>t.id===topic).flatMap(t=>t.papers.map(x=>x.recordId)))].sort();
 const actual=await f.locator('.youth-papers [data-paper]').evaluateAll(nodes=>nodes.map(n=>n.dataset.paper).sort());
 assert.deepEqual(actual,expected,`${key}: exact relevant publications, no duplicates or other topic papers`);
 if(key==='all')assert.equal(actual.length,105);
 assert.equal(await f.locator('.youth-paper .age-population').count(),actual.length);
 assert.equal(await f.locator('.research-guide').isVisible(),false);
 assert.equal(await f.locator('.collection-nav').isVisible(),false);
 assert.equal(await f.locator('.research-assessment:visible').count(),0);
 assert.equal(await f.locator('.contents-rail:visible').count(),0);
 assert.equal(await f.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 if(!actual.length){assert(await f.getByText('No qualifying publications are currently included in this youth topic.',{exact:false}).isVisible());assert.equal(await f.locator('.youth-context').getAttribute('open'),'');}
 record(`${key}: matching visible title, explicit youth scope, ${actual.length} exact publications and their reported ages`);
 return f;
}
try{
 for(const row of cases){
  await p.goto(origin+'/lab/research.html');
  await p.locator(`a[href="/informatics/research/?youth=${row[0]}"]`).click();
  const f=await verify(row);
  assert.equal(new URL(p.url()).searchParams.get('youth'),row[0],'Canonical shell URL retains selected topic');
  if(['orygen','black-dog','emdr','mantra'].includes(row[0]))await p.screenshot({path:path.join(out,row[0]+'.png')});
  if(row[0]==='orygen'){
   const source=f.locator('.youth-paper h3 a').first();assert.match(await source.getAttribute('href'),/^https:\/\//);assert.equal(await source.getAttribute('target'),'_blank');
   await f.locator('[data-paper-detail]').first().click();await f.locator('#article[open]').waitFor();assert((await f.locator('#article-title').textContent()).length>10);
   await f.locator('[data-close="article"]').click();assert.equal(await f.locator('#article').isVisible(),false);
   await p.waitForURL(url=>!url.searchParams.has('record'));
   await p.reload();await verify(row);
   await p.goBack();await p.locator('#full-collection').waitFor();assert.equal(new URL(p.url()).pathname,'/lab/research.html');
   record('Orygen: citation dialog, source link, reload and browser Back retain the correct journey');
  }
 }
 await p.goto(origin+'/lab/research.html');await p.getByRole('link',{name:'Browse the wider youth research library'}).click();let f=await library();
 assert.equal(await f.locator('.library-intro h1').textContent(),'Youth Research');assert(await f.locator('#result-count').isVisible());record('Wider library identifies Youth Research above the existing age-filtered search');
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  await p.setViewportSize(viewport);
  await p.goto(origin+'/lab/research.html');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await p.locator('a[href="/informatics/research/?youth=music-making"]').click();f=await verify(cases[4]);
  await p.screenshot({path:path.join(out,`music-making-${viewport.width}.png`)});
 }
 await p.setViewportSize({width:1440,height:1000});
 await p.goto(origin+'/lab/research.html');await p.locator('a[href="/informatics/research/?youth=emdr"]').click();f=await library();
 await f.locator('.youth-topic-menu summary').click();await f.getByRole('link',{name:'Orygen Research',exact:true}).click();await verify(cases[1]);
 await p.goBack();await verify(cases[6]);record('Topic navigation and Back keep the canonical URL, heading and paper set together');
 f=await library();await f.getByRole('link',{name:'All Informatics research'}).click();
 f=await library();assert.equal(await f.locator('.library-intro h1').textContent(),'Universal Research');assert.equal(await f.locator('body').evaluate(el=>el.classList.contains('youth-focus')),false);assert(await f.locator('.collection-nav').isVisible());
 await f.locator('[data-collection="sound"]').click();await f.locator('[data-view="chapters"]').click();assert(await f.locator('#reading-content').isVisible());record('General search and ordinary Sound chapters restore the full library interface');
 if(live)for(const file of ['Informatics/library-youth.js','Informatics/library.js','Informatics/library.html','Informatics/library.css','lab/research.html','events/assets/choice.css']){
  const urlFile=file.replace(/^Informatics\//,'informatics/');const res=await p.request.get(origin+'/'+urlFile+'?embedded=1&qa=youth-destinations',{headers:{'Cache-Control':'no-cache'}});assert.equal(res.status(),200);const sha256=createHash('sha256').update(await res.body()).digest('hex');assert.equal(sha256,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),file);hashes.push({file,sha256});
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({date:new Date().toISOString(),live,processMuted:true,nativeFullscreenInvoked:false,playbackMocked:true,checks,hashes,errors},null,2)+'\n');
}catch(error){
 console.log(JSON.stringify({url:p.url(),frames:await Promise.all(p.frames().map(async f=>({url:f.url(),state:await f.evaluate(()=>({title:document.title,entered:document.body.dataset.entered,area:document.querySelector('#experience')?.dataset.area,loadError:document.querySelector('#launch-status')?.textContent})).catch(()=>null)}))),errors}));await p.screenshot({path:path.join(out,'failure.png')});throw error;
}finally{
 for(const page of c.pages())for(const frame of page.frames())await frame.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause())).catch(()=>{});
 await c.close();await browser.close();await server.close();
}
