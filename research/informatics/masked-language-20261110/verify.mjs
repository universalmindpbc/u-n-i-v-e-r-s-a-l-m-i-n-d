import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=process.cwd(), base='https://staging.universalmind.tv/informatics/', candidate=process.env.MASKED_CANDIDATE==='1';
const out=path.join(root,'research/informatics/masked-language-20261110');
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()), results=[];
try {
for(const width of [1470,1024,390,320]){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
 await context.addInitScript(()=>{HTMLMediaElement.prototype.play=()=>Promise.resolve();});
 if(candidate)await context.route(base+'**',async route=>{
  const url=new URL(route.request().url()),rel=decodeURIComponent(url.pathname).replace('/informatics/','')||'index.html',file=path.resolve(root,'Informatics',rel);
  if(!file.startsWith(path.join(root,'Informatics')+'/'))return route.abort();
  try{await route.fulfill({status:200,contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.csv':'text/csv'}[path.extname(file)]||'application/octet-stream',body:await fs.readFile(file)});}catch{await route.continue();}
 });
 const browserPage=await context.newPage(), errors=[];browserPage.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});browserPage.on('console',m=>{if(m.type()==='error')console.log('BROWSER ERROR',m.text())});
 let page;
 async function visit(url){
  await browserPage.goto(url,{waitUntil:'domcontentloaded'});
  await browserPage.locator('#research-frame').waitFor({state:'attached',timeout:30000});
  const frame=await browserPage.locator('#research-frame').elementHandle().then(e=>e.contentFrame());
  await frame.locator('#reading-content').waitFor({state:'attached'});
  page=frame;
 }
 await visit(base+'library.html?collection=language&chapter=7');
 await page.locator('#topic-masked-lead').waitFor({timeout:15000}).catch(async e=>{console.log('URL',page.url(),'BODY',(await page.locator('body').innerText()).slice(-4000));await browserPage.screenshot({path:path.join(out,'debug.png')});throw e;});
 assert.equal(await page.locator('#load-error').isVisible(),false);
 assert.equal(await page.locator('#topic-masked-lead .paper').count(),5);
 assert.equal(await page.locator('.masked-index-entry').count(),33);
 assert.equal(await page.locator('#topic-masked-lead .paper h4').first().innerText().then(t=>t.split('\n')[0].trim()),'Cerebral bases of subliminal speech priming');
 assert.match(await page.locator('.chapter-opening').innerText(),/Silent mental mantra/);
 assert.equal(await page.locator('#topic-masked-anaesthesia .masked-index-entry').count(),3);
 await page.locator('#topic-masked-outcomes .masked-index-entry').first().locator('summary').first().click();
 assert.match(await page.locator('#topic-masked-outcomes .masked-index-entry').first().innerText(),/Function in the rationale/);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`overflow ${width}`);
 await page.evaluate(()=>window.scrollTo(0,document.querySelector('.chapter-opening').offsetTop-100));
 await browserPage.screenshot({path:path.join(out,`${candidate?'candidate':'staging'}-${width}.png`)});
 const data=await page.evaluate(async()=>await (await fetch('library-data/masked-language-expansion.json?v=masked-language-20261110')).json());
 assert.equal(data.records.length,38);assert.equal(data.geminiSourceCount,11);
 if(candidate){const csv=await page.evaluate(async()=>await (await fetch('library-data/masked-language-register.csv')).text());assert(csv.includes('Cerebral bases'));}else{const dl=browserPage.waitForEvent('download');await page.locator('a[download][href$="register.csv"]').click();const download=await dl;await download.saveAs(path.join(out,'staging-download.csv'));}
 await visit(base+'library.html?collection=language');await page.locator('.masked-feature').waitFor();await page.locator('.masked-feature a').first().click();await page.locator('#topic-masked-lead').waitFor();
 await visit(base+'library.html?collection=language&query=subliminal%20speech%20priming');await page.locator('#results .search-paper').first().waitFor();assert.match(await page.locator('#results').innerText(),/Cerebral bases of subliminal speech priming/);
 await visit(base+'library.html?collection=language&chapter=7&embedded=1#topic-masked-anaesthesia');await page.locator('#topic-masked-anaesthesia').waitFor();assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('embedded')),true);
 // Verify existing language chapter remains available.
 await visit(base+'library.html?collection=language&chapter=1');await page.locator('.chapter-opening h2').waitFor();assert.match(await page.locator('.chapter-opening h2').innerText(),/Mantra, mindfulness and molecular biology/);
 assert.deepEqual(errors,[]);results.push({width,leadStudies:5,indexedSources:33,sourceCount:38,originalReferences:11,overflow,search:true,download:true,embedded:true,existingChapter:true,errors});
 await context.close();
}
await fs.writeFile(path.join(out,`${candidate?'candidate':'staging'}-browser.json`),JSON.stringify({mode:candidate?'candidate routed on permanent staging origin':'live staging',mutedProcess:true,playbackDisabled:true,results},null,2));
console.log(JSON.stringify(results));
}finally{await browser.close();await server.close();}
