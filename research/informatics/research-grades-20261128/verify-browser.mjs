import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(import.meta.dirname,'../../..'),candidate=process.env.CANDIDATE==='1',out=path.join(import.meta.dirname,candidate?'candidate':'browser');
await fs.mkdir(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()),context=await browser.newContext({viewport:{width:1470,height:1050}});
const report={candidate,processAudioMuted:true,mediaPlaybackDisabled:true,checks:[],errors:[]};
try{
 await context.addInitScript(()=>{localStorage.setItem('informatics-library-background','white');localStorage.setItem('informatics-library-video-paused','true');HTMLMediaElement.prototype.play=()=>Promise.resolve();Element.prototype.requestFullscreen=()=>Promise.reject(Error('Disabled for QA'));if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=()=>Promise.reject(Error('Disabled for QA'));});
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());if(req.resourceType()==='media'||req.method()==='POST')return route.abort();
  if(candidate&&u.hostname==='staging.universalmind.tv'&&u.pathname.startsWith('/informatics/')){
   let rel=u.pathname.slice('/informatics/'.length);if(rel==='research/')rel='chapters/research.html';else if(rel.endsWith('/')||!rel)rel+='index.html';
   try{const body=await fs.readFile(path.join(root,'Informatics',rel));return route.fulfill({body,contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.csv':'text/csv'})[path.extname(rel)]||'application/octet-stream'});}catch{}
  }
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.setDefaultTimeout(25000);
 await page.goto('https://staging.universalmind.tv/informatics/research/?collection=general',{waitUntil:'domcontentloaded'});
 const frame=page.frameLocator('#research-frame');await frame.locator('.contents-chapter').first().waitFor();
 assert.equal(await frame.locator('.contents-chapter').count(),14);
 assert.equal(await frame.locator('.contents-chapter h3 [data-chapter="13"]').innerText(),'Oxytocin, OXTR and IL-6');
 assert.equal(await frame.locator('.contents-chapter h3 [data-chapter="14"]').innerText(),'IL-6 and mental health');
 await frame.locator('.contents-chapter h3 [data-chapter="14"]').click();
 assert.equal(await frame.locator('.chapter-opening h2').innerText(),'IL-6 and mental health');
 assert.equal(await frame.locator('.chapter-reader .topic').count(),16);assert.equal(await frame.locator('.chapter-reader .paper').count(),120);
 assert.equal(await frame.locator('.evidence-summary,.evidence-levels').count(),0);
 const headings=await frame.locator('.topic-heading h3').allTextContents();
 for(const title of ['Depression','Schizophrenia and psychosis','Bipolar disorder: depression and euthymia','Mania','Hypomania','Anxiety disorders','PTSD and trauma','Suicidal ideation and behaviour','ADHD','Addiction: alcohol use disorder','Addiction: opioid use disorder','Addiction: stimulant use disorders'])assert(headings.includes(title),title);
 await frame.locator('.contents-rail [data-topic="il6-mental-health-depression"]').click();
 assert((await frame.locator('#topic-il6-mental-health-depression h3').innerText()).startsWith('Depression'));
 await frame.locator('.paragraph-sources [data-paper-detail]').first().click();await frame.locator('#article[open]').waitFor();await frame.locator('[data-close="article"]').click();
 report.checks.push({distinctContentsChapters:true,mentalHealthSources:120,conditionHeadings:headings,citationDialog:true});
 async function capture(name,width){await page.setViewportSize({width,height:1050});await frame.locator('.chapter-opening h2').evaluate(el=>{el.scrollIntoView({block:'start'});window.scrollBy(0,-140);});const layout=await frame.locator('html').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert(layout.scroll<=layout.width+2);await page.screenshot({path:path.join(out,name+'.png')});report.checks.push({name,width,layout});}
 await capture('mental-health-desktop',1470);await capture('mental-health-mobile',390);
 await frame.locator('.related-research [data-chapter="13"]').click();await frame.getByRole('heading',{name:'Oxytocin, OXTR and IL-6',exact:true}).waitFor();
 assert.equal(await frame.locator('.chapter-opening h2').innerText(),'Oxytocin, OXTR and IL-6');assert.equal(await frame.locator('.chapter-reader .topic').count(),10);assert.equal(await frame.locator('.chapter-reader .paper').count(),42);
 assert.match(await frame.locator('#evidence-summary-title').innerText(),/oxytocin and OXTR.*IL-6/);
 assert.deepEqual(await frame.locator('.evidence-summary-row h4').allTextContents(),['Laboratory cell studies','Animal studies','Human studies']);assert.equal(await frame.locator('.evidence-levels').count(),0);
 for(const width of [1470,390,320]){await capture('oxtr-'+width,width);await frame.locator('#evidence-summary-title').evaluate(el=>{el.scrollIntoView({block:'start'});window.scrollBy(0,-130);});await page.screenshot({path:path.join(out,'oxtr-summary-'+width+'.png')});}
 report.checks.push({OXTRSources:42,scopedSummary:true,noUnlabelledCards:true});
 await frame.locator('.related-research [data-chapter="14"]').click();await frame.getByRole('heading',{name:'IL-6 and mental health',exact:true}).waitFor();assert.equal(await frame.locator('.chapter-opening h2').innerText(),'IL-6 and mental health');
 if(!candidate){for(const [stem,count] of [['oxtr-il6',42],['il6-mental-health',120]]){const response=await context.request.get('https://staging.universalmind.tv/informatics/library-data/'+stem+'-research-register.json?v=research-grades-20261128');assert(response.ok());const data=await response.json();assert.equal(data.records.length,count);assert.deepEqual(data,JSON.parse(await fs.readFile(path.join(root,'Informatics/library-data/'+stem+'-research-register.json'),'utf8')));}}
 for(const [slug,count,title] of [['oxtr-il6',42,'Oxytocin, OXTR and IL-6'],['il6-mental-health',120,'IL-6 and mental health']]){await page.goto('https://staging.universalmind.tv/informatics/read/'+slug+'/index.html',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('h1').innerText(),title);assert.equal(await page.locator('article').count(),count);}

 for(const collection of ['sound','vision','language','general']){
  const edition=JSON.parse(await fs.readFile(path.join(root,'Informatics/library-data/'+collection+'-edition.json'),'utf8'));
  await page.goto('https://staging.universalmind.tv/informatics/research/?collection='+collection,{waitUntil:'domcontentloaded'});
  await frame.locator('.contents-chapter').first().waitFor();
  assert.equal(await frame.locator('.contents-chapter > .trust-score').count(),edition.chapters.filter(c=>c.trustScore).length);
  assert(!/certainty not graded|minimum 3 papers|Not yet graded|Exploratory research/i.test(await frame.locator('body').innerText()));
  for(const chapter of edition.chapters){
   await frame.locator('a.contents-home').count() && await frame.locator('a.contents-home').click();
   await frame.locator('.contents-chapter h3 [data-chapter="'+chapter.number+'"]').click();
   await frame.getByRole('heading',{name:chapter.title,exact:true}).waitFor();
   assert.equal(await frame.locator('.chapter-opening > .trust-score svg').count(),chapter.trustScore||0);
   for(const topic of chapter.topics)assert.equal(await frame.locator('#topic-'+topic.id+' > .topic-heading > .trust-score svg').count(),topic.trustScore||0,topic.id);
   assert.equal(await frame.locator('.topic-score-status').count(),0);
   if(collection==='general'&&chapter.number===14){
    assert.match(await frame.locator('.chapter-opening').innerText(),/IL6 is the gene/);
    assert.match(await frame.locator('.chapter-opening').innerText(),/blood IL-6 tests measure the encoded protein/);
    assert.equal(await frame.locator('.gene-reference a').getAttribute('href'),'https://www.ncbi.nlm.nih.gov/gene/3569');
   }
   if(collection==='general'&&[10,12,14].includes(chapter.number)){await capture('chapter-'+chapter.number+'-desktop',1470);await capture('chapter-'+chapter.number+'-mobile',390);}
   report.checks.push({collection,chapter:chapter.number,chapterScore:chapter.trustScore,topicScoresVerified:chapter.topics.length});
  }
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.error=e.message;throw e;}finally{await fs.writeFile(path.join(out,'browser.json'),JSON.stringify(report,null,2)+'\n');await context.close();await browser.close();await server.close();}
console.log(JSON.stringify(report));
