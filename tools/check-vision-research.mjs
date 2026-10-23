import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),base='https://staging.universalmind.tv/informatics/',candidate=process.env.CANDIDATE==='1';
const out='/private/tmp/vision-research-'+(candidate?'candidate':'staging');await fs.mkdir(out,{recursive:true});
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const book=await read('Informatics/library-data/vision-edition.json'),exp=await read('Informatics/library-data/vision-expansion.json'),lib=await read('Informatics/library-data/library.json'),portal=(await read('research/informatics/library/emdr-review-20261023/approved-portal.json')).layer;
const papers=book.chapters.flatMap(c=>c.topics.flatMap(t=>t.papers));
const text=p=>p.quotes.map(q=>q.map(s=>s.text).join('')).join('\n\n');
for(const r of lib.records){for(const a of (r.archiveEntries||[]).filter(a=>a.collection==='vision')){
 const entries=papers.filter(p=>p.recordId===r.id);assert.ok(entries.length,r.id+' retained');
 const quote=(a.originalNote||'').replaceAll('Trauma As Usual','Treatment as Usual');
 if(r.id==='src-796cb6656464'){
  assert.equal(text(entries[0])+'\n\n'+text(papers.find(p=>p.recordId==='pmid-33415797')),quote);
 }else for(const q of quote.split('\n\n').filter(Boolean))assert.ok(entries.some(p=>text(p).includes(q)),r.id+' exact quotation');
}}
assert.equal(new Set(papers.map(p=>p.recordId)).size,76);
assert.equal(book.chapters[3].topics.flatMap(t=>t.papers).length,10);
assert.equal(book.chapters[0].topics.find(t=>t.id==='children').trustScore,2);
assert.ok(book.chapters[1].topics.every(t=>t.trustAssessment.status==='clinical-guidance' && t.trustScore===null));
assert.equal(exp.publicationAccess['src-796cb6656464'].doi,'10.1891/emdr-d-20-00054');
assert.equal(papers.find(p=>p.recordId==='pmid-33415797').doi,'10.1002/cpp.2549');
for(const r of exp.records){assert.ok(r.studyDesignAssessment.sources.length);assert.ok(r.urls.length);assert.equal(r.jadad.status,'unassessed');}
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));const browser=await chromium.connect(server.wsEndpoint());const checks=[],errors=[];
try{
 for(const width of [1470,1024,390,320]){
  const ctx=await browser.newContext({viewport:{width,height:956},acceptDownloads:true});
  try{
   if(candidate)await ctx.route(base+'**',async route=>{const f=path.join(root,'Informatics',new URL(route.request().url()).pathname.replace('/informatics/',''));try{await route.fulfill({status:200,body:await fs.readFile(f),contentType:{'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.jpg':'image/jpeg'}[path.extname(f)]||'application/octet-stream'});}catch{await route.continue();}});
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'library.html?collection=vision',{waitUntil:'domcontentloaded'});await page.locator('.contents-chapter').first().waitFor();
   assert.equal(await page.locator('.contents-chapter').count(),4);assert.equal(await page.locator('.contents-topic-meta').count(),15);assert.equal(await page.locator('.collection-introduction').innerText(),book.introduction.paragraphs[0]);
   const panel=page.locator('#vision-assessment-panel');await panel.locator(':scope > summary').focus();await page.keyboard.press('Enter');
   assert.equal(await panel.locator('.vision-assessment-summary').innerText(),portal.summary);assert.equal(await panel.locator('.grade-letter').innerText(),'A');
   assert.deepEqual(await panel.locator('.assessment-finding > p:first-child').allTextContents(),portal.heroStudies.map(h=>h.finding));assert.deepEqual(await panel.locator('.assessment-finding .assessment-note').allTextContents(),portal.heroStudies.map(h=>'Limit: '+h.limitation));
   for(const mode of ['video','black','white']){await page.locator(`.reading-toolbar [data-reading-background="${mode}"]`).click();await panel.scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+mode);await page.screenshot({path:out+`/assessment-${width}-${mode}.png`});}
   await panel.locator(':scope > summary').click();await page.locator('.collection-introduction').scrollIntoViewIfNeeded();await page.screenshot({path:out+`/contents-${width}.png`});
   await page.locator('.contents-chapter [data-topic="rna"]').click();assert.equal(await page.locator('.chapter-reader .paper').count(),10);
   for(const t of book.chapters[3].topics){assert.equal(await page.locator(`#topic-${t.id} .topic-heading svg`).count(),t.trustScore);for(const p of t.papers){const article=page.locator(`#topic-${t.id} .paper[data-paper="${p.recordId}"]`);assert.match(await article.locator('.study-details').innerText(),new RegExp(p.citationCount.toLocaleString()+' citations?'));}}
   await page.locator('#topic-rna').scrollIntoViewIfNeeded();await page.screenshot({path:out+`/molecular-${width}.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.locator('.chapter-reader .paper').first().locator('[data-paper-detail]').click();await page.locator('#article').waitFor({state:'visible'});assert.match(await page.locator('#article-body').innerText(),/Jadad: Not yet assessed/);await page.keyboard.press('Escape');assert.equal(await page.locator('#article').isVisible(),false);
   await page.locator('[data-view="search"]').click();assert.equal(await page.locator('#search-view').isVisible(),true);await page.locator('#target').selectOption('NR3C1');assert.match(await page.locator('#result-count').innerText(),/^1 paper in Vision$/);assert.match(await page.locator('#results').innerText(),/Transcriptional Modulation/i);
   await page.locator('#reset').click();await page.locator('#kind').selectOption('meta-analysis');assert.ok(await page.locator('#results .search-paper').count()>0);
   await page.locator('#reset').click();await page.locator('#topic').selectOption('vision:children');await page.locator('#trust').selectOption('2');assert.match(await page.locator('#result-count').innerText(),/^8 papers/);await page.locator('#kind').selectOption('single-blind');assert.match(await page.locator('#result-count').innerText(),/^3 papers/);
   await page.locator('#reset').click();const pending=page.waitForEvent('download');await page.locator('#export-json').click();const download=await pending;const destination=out+`/export-${width}.json`;await download.saveAs(destination);const exported=JSON.parse(await fs.readFile(destination));assert.ok(exported.records.some(r=>r.id==='pmid-33415797'));assert.ok(exported.records.some(r=>r.id==='src-796cb6656464'));
   await page.goto(base+'library.html?collection=vision&chapter=1#topic-iv');await page.locator('.research-figure img').first().waitFor();await page.locator('.research-figure').first().scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('.research-figure img')].every(x=>x.complete&&x.naturalWidth>0));assert.equal(await page.locator('.research-figure').count(),2);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:out+`/links-${width}.png`});
   await page.locator('.chapter-reader .paper[data-paper="pmid-23702050"] .summary-limitation').waitFor();assert.match(await page.locator('.chapter-reader .paper[data-paper="pmid-23702050"] .summary-limitation').innerText(),/trial protocol/);
   await page.goto(base+'library.html?collection=vision&chapter=3#topic-self-help');await page.locator('.chapter-reader .paper[data-paper="src-796cb6656464"] .summary-limitation').waitFor();assert.match(await page.locator('.chapter-reader .paper[data-paper="src-796cb6656464"] .summary-limitation').innerText(),/Parent-supported story-based intervention/);
   checks.push({width,themes:3,chapters:4,topics:15,molecularPapers:10,exported:exported.records.length,stats:await page.locator('#collection-statistics dl').innerText()});
  }finally{for(const p of ctx.pages())await p.evaluate(()=>document.querySelectorAll('video,audio').forEach(x=>x.pause())).catch(()=>{});await ctx.close();}
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/verification.json',JSON.stringify({candidate,checks,errors,audio:'Chromium process launched with --mute-audio; all pages paused and closed'},null,2));console.log(JSON.stringify({out,checks,errors}));
}finally{await browser.close();await server.close();}
