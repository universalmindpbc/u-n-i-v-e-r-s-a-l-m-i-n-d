import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import '../Informatics/library-model.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),base='https://staging.universalmind.tv/informatics/',candidate=process.env.CANDIDATE==='1';
const output='/private/tmp/language-research-'+(candidate?'candidate':'staging');await fs.mkdir(output,{recursive:true});
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const portal=(await read('research/informatics/library/language-approved-portal-20261023.json')).layer;
const language=await read('Informatics/library-data/language-edition.json'),general=await read('Informatics/library-data/general-edition.json');
const original=(await read('Informatics/library-data/library.json')).records.flatMap(r=>(r.archiveEntries || []).filter(a=>a.collection==='language').map(a=>({recordId:r.id,...a})));
const languagePapers=language.chapters.flatMap(c=>c.topics.flatMap(t=>t.papers));
const expansion=(await read('Informatics/library-data/mindfulness-expansion.json')).records;
assert.equal(original.length,299);
assert.equal(original.reduce((sum,a)=>sum+(mCount(a.historicalCitationCount)),0),11165);
function mCount(value){return Number((String(value||'').match(/citations:\s*([\d,]+)/i)?.[1]||'0').replaceAll(',',''));}
assert.equal(expansion.length,19);
assert.deepEqual([1,2,3].map(score=>expansion.filter(r=>r.trustAssessment.score===score).length),[8,9,2]);
for(const r of expansion){assert.ok(r.trustAssessment.sources.length);assert.ok(Number.isInteger(r.citationSnapshot.count));assert.equal(r.citationSnapshot.source,'Crossref');assert.equal(r.jadad.status,'unassessed');}
for(const a of original){
 const matches=languagePapers.filter(p=>p.recordId===a.recordId && p.sourcePages.join(',')===a.pages.join(','));assert.ok(matches.length,a.recordId+' retained');
 assert.ok(matches.some(p=>p.quotes.map(q=>q.map(s=>s.text).join('')).join('\n\n')===(a.originalNote || '')),a.recordId+' quotation intact');
}
assert.equal(language.chapters.slice(0,3).flatMap(c=>c.topics).length,18);
assert.equal(languagePapers.filter(p=>p.bibliography).length,2);
assert.ok(languagePapers.every(p=>p.quotes.every(q=>q.every(s=>typeof s.emphasis==='boolean'))));
const m=globalThis.UniversalResearchModel;
for(let score=0;score<=5;score++){
 assert.equal(m.matchesJadad({jadad:{status:'assessed',score}},String(score)),true);
 assert.equal(m.matchesJadad({},String(score)),false);
}
assert.equal(m.matchesJadad({jadad:{status:'not-applicable',score:null}},'not-applicable'),true);
assert.equal(m.matchesJadad({jadad:{status:'assessed',score:null}},'unassessed'),true);
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));const browser=await chromium.connect(server.wsEndpoint());const errors=[],checks=[];
async function context(width){
 const ctx=await browser.newContext({viewport:{width,height:956},acceptDownloads:true});
 if(candidate)await ctx.route(base+'**',async route=>{
  const file=path.join(root,'Informatics',new URL(route.request().url()).pathname.replace('/informatics/',''));
  try{await route.fulfill({status:200,body:await fs.readFile(file),contentType:{'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'}[path.extname(file)]||'application/octet-stream'});}catch{await route.continue();}
 });return ctx;
}
async function download(page){const pending=page.waitForEvent('download');await page.locator('#export-json').click();const d=await pending;const file=output+'/export.json';await d.saveAs(file);return JSON.parse(await fs.readFile(file));}
async function close(ctx){for(const p of ctx.pages())await p.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await ctx.close();}
try{
 for(const width of [1470,1024,390,320]){
  const ctx=await context(width);try{
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'library.html?collection=language',{waitUntil:'domcontentloaded'});await page.locator('.contents-chapter').first().waitFor();
   assert.equal(await page.locator('.contents-chapter').count(),4);assert.equal(await page.locator('.contents-topic-meta').count(),21);
   for(const topic of language.chapters[3].topics){
    const row=page.locator(`.contents-chapter [data-topic="${topic.id}"]`);
    assert.equal(await row.locator('.score-group').count(),topic.trustScoreDistribution.length);
    for(let i=0;i<topic.trustScoreDistribution.length;i++){
     const group=topic.trustScoreDistribution[i];assert.equal(await row.locator('.score-group').nth(i).locator('svg').count(),group.score);
     assert.match(await row.locator('.score-group').nth(i).innerText(),new RegExp('^'+group.papers+' papers?'));
    }
   }
   assert.equal(await page.locator('.collection-introduction').innerText(),"Language research begins with mindfulness-based stress reduction, initially with a focus on mantra meditation. In the future, this section will include nonviolent communication, emotional intelligence and talking therapies.");assert.equal(await page.locator('.collection-introduction h2').count(),0);
   const panel=page.locator('#language-assessment-panel');await panel.locator(':scope > summary').focus();await page.keyboard.press('Enter');
   assert.equal(await panel.locator('.assessment-title').innerText(),'Language research assessment');
   assert.equal(await panel.locator('.assessment-grade > span:last-child').innerText(),'Positive systematic evidence');
   assert.equal(await panel.locator('.assessment-introduction h2').innerText(),'Mantra and mindfulness-based stress reduction');
   assert.equal(await panel.locator('.language-assessment-definition').innerText(),'Positive systematic evidence, with meaningful heterogeneity or a product translation gap.');
   assert.match(await panel.locator('.language-assessment-summary').innerText(),/Transcendental Meditation, and mindfulness-based stress reduction/);
   assert.doesNotMatch(await panel.innerText(),/Supported active practice|Mantra research assessment/);
   assert.deepEqual(await panel.locator('.assessment-finding > p:first-child').allTextContents(),portal.heroStudies.map(h=>h.finding));assert.deepEqual(await panel.locator('.assessment-finding .assessment-note').allTextContents(),portal.heroStudies.map(h=>'Limit: '+h.limitation));
   for(const mode of ['video','black','white']){
    await page.locator(`.reading-toolbar [data-reading-background="${mode}"]`).click();await panel.scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,width+mode);
    await page.screenshot({path:output+`/assessment-${width}-${mode}.png`});
   }
   await panel.locator(':scope > summary').click();await page.locator('.collection-introduction').scrollIntoViewIfNeeded();await page.screenshot({path:output+`/contents-${width}.png`});
   await page.locator('.contents-chapter [data-topic="mindfulness-rna"]').click();assert.equal(new URL(page.url()).searchParams.get('chapter'),'4');
   for(const r of expansion){
    const paper=page.locator(`.chapter-reader .paper[data-paper="${r.id}"]`);
    assert.equal(await paper.locator('.scored-study svg').count(),r.trustAssessment.score);
    assert.match(await paper.locator('.study-details').innerText(),new RegExp(r.citationCount.toLocaleString()+' citations?'));
   }
   await page.locator('#topic-mindfulness-rna').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await page.screenshot({path:output+`/mindfulness-scores-${width}.png`});
   assert.equal(await page.locator('#topic-mindfulness-rna .paper').count(),11);await page.locator('#topic-mindfulness-rna .paper').first().locator('.study-methods:not(.trust-assessment) > summary').click();assert.match(await page.locator('#topic-mindfulness-rna .paper').first().innerText(),/Blood leukocytes/);
   await page.locator('#topic-mindfulness-rna .paper').first().locator('[data-paper-detail]').click();assert.equal(await page.locator('#article').evaluate(e=>e.open),true);assert.match(await page.locator('#article-body').innerText(),/Jadad: Not yet assessed/);await page.keyboard.press('Escape');assert.equal(await page.locator('#article').evaluate(e=>e.open),false);
   await page.goBack();assert.equal(await page.locator('.contents-chapter').count(),4);
   await page.locator('[data-view="search"]').click();assert.equal(await page.locator('#jadad').isVisible(),true);
   const allLanguage=await download(page);assert.equal(allLanguage.records.length,327);
   for(const r of expansion){const exported=allLanguage.records.find(e=>e.id===r.id || e.aliases.includes(r.id));assert.equal(exported.articleTrustScore,r.trustAssessment.score);assert.deepEqual(exported.topicTrustScores,[r.trustAssessment.score]);}
   for(const score of [3,2,1]){
    await page.locator('#trust').selectOption(String(score));const scored=await download(page);
    for(const r of expansion){assert.equal(scored.records.some(e=>e.id===r.id || e.aliases.includes(r.id)),r.trustAssessment.score===score);}
   }
   await page.locator('#trust').selectOption('');
   await page.locator('#jadad').selectOption('unassessed');assert.equal((await download(page)).records.length,allLanguage.records.length);
   await page.locator('#jadad').selectOption('0');assert.match(await page.locator('#result-count').innerText(),/^0 papers/);assert.equal(await page.locator('#export-json').isDisabled(),true);
   await page.reload();await page.locator('.empty-state').waitFor();assert.equal(await page.locator('#jadad').inputValue(),'0');
   await page.locator('.jadad-guide > summary').click();assert.match(await page.locator('.jadad-guide').innerText(),/No points awarded after assessment/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.screenshot({path:output+`/jadad-${width}.png`});
   await page.locator('#reset').click();assert.equal(await page.locator('#jadad').inputValue(),'');
   await page.locator('#target').selectOption('FKBP5');assert.ok(await page.locator('.search-paper').count());await page.locator('#reset').click();
   await page.locator('[data-collection="general"]').click();assert.equal(await page.locator('.contents-chapter').count(),7);assert.equal(await page.locator('#language-assessment').isVisible(),false);
   await page.locator('.contents-chapter [data-topic="language-vi"]').click();assert.equal(new URL(page.url()).searchParams.get('collection'),'general');assert.match(await page.locator('.chapter-opening').innerText(),/Molecular hydrogen/);
   await page.locator('[data-view="search"]').click();const generalRecords=(await download(page)).records;assert.ok(generalRecords.some(r=>r.collections.includes('language')));assert.ok(generalRecords.some(r=>r.collections.includes('sound')));
   await page.locator('[data-collection="all"]').click();const all=(await download(page)).records;assert.equal(new Set(all.map(m.identity)).size,all.length);
   for(const r of generalRecords)assert.ok(all.some(a=>m.identity(a)===m.identity(r)));
   const stats=Object.fromEntries((await page.locator('[data-stat]').evaluateAll(es=>es.map(e=>[e.dataset.stat,Number(e.textContent.replaceAll(',',''))]))));assert.equal(stats.papers,all.length);
   checks.push({width,languagePapers:allLanguage.records.length,generalPapers:generalRecords.length,allPapers:all.length,originalQuotesRetained:299,verbatimHeroStudies:true,languageAssessmentScope:true,assessedMindfulnessPapers:19,datedCitationSnapshots:19,trustScoreFilters:true,jadadStates:true,crossListing:true,keyboard:true,themes:3,overflow:false});
  }finally{await close(ctx);}
 }
 assert.deepEqual(errors,[]);await fs.writeFile(output+'/verification.json',JSON.stringify({url:base+'library.html?collection=language',candidate,checkedAt:new Date().toISOString(),processAudioMuted:true,checks,errors},null,2)+'\n');console.log(JSON.stringify({output,checks,errors},null,2));
}finally{await browser.close();await server.close();}
