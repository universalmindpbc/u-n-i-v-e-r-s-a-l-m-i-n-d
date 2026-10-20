import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const candidate=process.env.INFORMATICS_CANDIDATE==='1', base='https://staging.universalmind.tv/informatics/';
const output=process.env.INFORMATICS_QA_OUTPUT||'/private/tmp/informatics-areas-qa';await fs.mkdir(output,{recursive:true});
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'),'Process-level audio is disabled before navigation');
const browser=await chromium.connect(server.wsEndpoint());let activePage;const results=[];
const question1='Does electronic music modulate gene expression of OXTR?';
const question2='Within the above deliverable, do Fibonacci* numbers predict gene expression locations, via transcription factor binding sites?';
const visionHypothesis='We hypothesise that a hexagonally structured saccadic tracking pattern imposes a distinct oculomotor and visual psychophysics load compared to standard linear tracking. We propose that the complex coordination required to navigate this geometric pattern optimises retinal and visual pathway signalling, thereby driving a downstream biological response that upregulates OXTR gene transcription (measured via mRNA sequencing) and enhances emotional regulation.';
try{
 for(const viewport of [{width:1440,height:1000},{width:1024,height:768},{width:390,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce',acceptDownloads:true});
  await context.addInitScript(()=>{
   // Emulate the fullscreen container without invoking browser or macOS fullscreen.
   let fullscreenElement=null;Object.defineProperty(document,'fullscreenElement',{get:()=>fullscreenElement});
   Element.prototype.requestFullscreen=async function(){fullscreenElement=this;document.dispatchEvent(new Event('fullscreenchange'));};
   document.exitFullscreen=async()=>{fullscreenElement=null;document.dispatchEvent(new Event('fullscreenchange'));};
  });
  if(candidate)await context.route(/https:\/\/staging\.universalmind\.tv\/(?:I|i)nformatics\//,async route=>{
   const relative=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/(?:I|i)nformatics\//,'')||'index.html',file=path.resolve(root,'Informatics',relative);
   if(!file.startsWith(path.join(root,'Informatics')+path.sep))return route.abort();
   try{await route.fulfill({status:200,contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream',body:await fs.readFile(file)});}catch{await route.fulfill({status:404,body:'Missing candidate asset'});}
  });
  const page=await context.newPage();activePage=page;const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?area=sound',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!document.querySelector('#launch').disabled);await page.locator('#launch').click();await page.locator('#area-sound').waitFor({state:'visible'});await page.waitForFunction(()=>{const v=document.querySelector('#film');return !v.paused&&v.currentTime>.1;},null,{timeout:45000});await page.evaluate(()=>{window.__mediaEvents=[];for(const name of ['pause','loadstart','emptied'])document.querySelector('#film').addEventListener(name,()=>window.__mediaEvents.push(name));});
  const navigate=async area=>{if(viewport.width<=470)await page.locator('#atlas-area-select').selectOption(area);else await page.locator('.atlas-area-nav [data-area="'+area+'"]').click();await page.locator('#area-'+area).waitFor({state:'visible'});};
  const noOverflow=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('#atlas-sections').scrollWidth<=document.querySelector('#atlas-sections').clientWidth+1),true,'No horizontal page overflow');
  assert.deepEqual(await page.locator('.atlas-area-button').allTextContents(),['About','Geometry','Genomics','Sound','Vision']);
  assert.deepEqual(await page.locator('.atlas-questions li').allTextContents(),[question1,question2]);
  assert.equal(await page.locator('.atlas-footnote').textContent(),"*Fibonacci Sequence Modulus 9 Pisano 24 and it's 4 subset sequences.");
  assert.equal(await page.locator('#atlas-sound-title').innerText(),'does music modulate our emotions because of balance, geometry, resolution and symmetry?');
  assert.equal(await page.locator('#vision-play').getAttribute('aria-pressed'),'false');
  const math=await page.evaluate(()=>({residues:InformaticsSoundMath.residues,f440:InformaticsSoundMath.frequencies(440),f432:InformaticsSoundMath.frequencies(432),g:InformaticsSoundMath.scales.G}));
  assert.deepEqual(math.residues,[4,8,7,5,1,2]);assert.equal(math.f440[5],440);assert.ok(Math.abs(math.f440[7]/math.f440[0]-2)<1e-12);assert.ok(math.f440.every((n,i)=>Math.abs(math.f432[i]/n-432/440)<1e-12));assert.deepEqual(math.g,['G','A','B','C','D','E','F♯']);
  await noOverflow();await page.screenshot({path:path.join(output,'sound-sequence-'+viewport.width+'.png')});
  for(const view of ['sequence','melody','fifths','scale','tuning']){
   await page.locator('[data-sound-view='+view+']').click();assert.equal(await page.locator('[data-sound-view='+view+']').getAttribute('aria-selected'),'true');
   await page.locator('#sound-workings summary').click();assert.equal(await page.locator('#sound-workings').evaluate(e=>e.open),true);await page.locator('#sound-workings summary').click();
   assert.equal(await page.locator('#sound-diagram title').count(),1);assert.equal(await page.locator('#sound-diagram desc').count(),1);
   assert.equal(await page.locator('#sound-diagram').evaluate(svg=>{const bounds=svg.viewBox.baseVal;return [...svg.querySelectorAll('text')].every(text=>{const r=text.getBBox();return r.x>=-1&&r.y>=-1&&r.x+r.width<=bounds.width+1&&r.y+r.height<=bounds.height+1;});}),true,'All '+view+' labels fit inside the SVG');
   await page.locator('#sound-replay').click();await page.waitForFunction(()=>Number(document.querySelector('#sound-progress').value)>10);await page.locator('#sound-play').click();const paused=await page.locator('#sound-progress').inputValue();await page.waitForTimeout(100);assert.equal(await page.locator('#sound-progress').inputValue(),paused);
   await page.locator('#sound-progress').fill('1000');if(viewport.width===390&&view==='sequence'){await page.locator('#sound-diagram').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'sound-detail-390.png')});}
   if(view==='scale'){await page.locator('#sound-key').selectOption('G');assert.match(await page.locator('#sound-diagram').textContent(),/F♯/);await page.locator('#sound-key').selectOption('C');}
   if(view==='tuning'){await page.locator('#sound-reference').selectOption('444');assert.match(await page.locator('#sound-diagram').textContent(),/A4 = 444 Hz/);await page.locator('#sound-reference').selectOption('432');assert.match(await page.locator('#sound-diagram').textContent(),/A4 = 432 Hz/);}
   if(viewport.width===1440){await page.locator('#atlas-sections').evaluate(e=>e.scrollTop=0);await page.screenshot({path:path.join(output,'sound-'+view+'-'+viewport.width+'.png')});}
   const downloadPromise=page.waitForEvent('download');await page.locator('#sound-svg').click();const download=await downloadPromise,file=path.join(output,viewport.width+'-'+download.suggestedFilename());await download.saveAs(file);const svg=await fs.readFile(file,'utf8');assert.match(svg,/<svg/);assert.match(svg,/xmlns="http:\/\/www.w3.org\/2000\/svg"/);assert.doesNotMatch(svg,/NaN|undefined/);
  }
  await page.locator('[data-sound-view=sequence]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#sound-tab-sequence').getAttribute('aria-selected'),'true'); // wraps from active tuning
  await page.keyboard.press('End');assert.equal(await page.locator('#sound-tab-tuning').getAttribute('aria-selected'),'true');await page.keyboard.press('Home');assert.equal(await page.locator('#sound-tab-sequence').getAttribute('aria-selected'),'true');
  await page.locator('#sound-replay').click();await navigate('vision');assert.equal(await page.locator('#sound-play').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('.vision-research-copy section').nth(1).locator('p').innerText(),visionHypothesis);
  assert.equal(await page.locator('#vision-progress').inputValue(),'0');await noOverflow();await page.screenshot({path:path.join(output,'vision-'+viewport.width+'.png')});
  for(const mode of ['hexagon','linear','both']){await page.locator('#vision-mode').selectOption(mode);assert.equal(await page.locator('#vision-diagram circle[r="6"]').count(),mode==='both'?2:1);}
  await page.locator('#vision-progress').fill('250');const steppedX=await page.locator('#vision-diagram circle[r="6"]').last().getAttribute('cx');await page.locator('#vision-motion').selectOption('continuous');await page.locator('#vision-progress').fill('250');assert.notEqual(await page.locator('#vision-diagram circle[r="6"]').last().getAttribute('cx'),steppedX);await page.locator('#vision-motion').selectOption('stepped');await page.locator('#vision-duration').selectOption('6');await page.locator('#vision-replay').click();await page.waitForFunction(()=>Number(document.querySelector('#vision-progress').value)>20);await page.locator('#vision-play').click();await page.locator('#vision-progress').fill('500');assert.equal(await page.locator('#vision-step').textContent(),'3.0 s');
  const visionDownload=page.waitForEvent('download');await page.locator('#vision-svg').click();await (await visionDownload).saveAs(path.join(output,'vision-'+viewport.width+'.svg'));
  await navigate('genomics');assert.equal(await page.locator('#vision-play').getAttribute('aria-pressed'),'false');await page.locator('#area-genomics [data-science-transcription]').click();await page.locator('.science-transcription').waitFor({state:'visible'});assert.equal(await page.locator('.science-transcription').evaluate(e=>e.parentElement===document.fullscreenElement),true);await page.keyboard.press('Escape');
  for(const [attribute,dialog]of [['data-science-tfbs','.science-tfbs'],['data-science-register','dialog[aria-labelledby="science-register-title"]'],['data-science-genomics','.science-genomics']]){await page.locator('#area-genomics ['+attribute+']').click();await page.locator(dialog).waitFor({state:'visible'});await page.keyboard.press('Escape');}
  await navigate('geometry');const frame=page.frameLocator('#atlas-frame');await frame.locator('#research-record option').nth(1000).waitFor({state:'attached'});assert.equal(await frame.locator('#research-record option').count(),1002);
  for(const name of ['Alpha','Beta','Gamma','Epsilon','Odom’s construction']){await frame.getByRole('tab',{name,exact:true}).click();if(name.startsWith('Odom'))await frame.locator('#odom-view').waitFor({state:'visible'});else await frame.locator('#diagram').evaluate(img=>img.decode());}
  await frame.locator('#research-record').selectOption('fibonacci-m18-p24');await frame.getByRole('tab',{name:'Beta',exact:true}).click();await navigate('sound');await navigate('geometry');assert.equal(await frame.locator('#research-record').inputValue(),'fibonacci-m18-p24');
  await navigate('sound');await page.locator('#sound-atlas-link').click();await page.locator('#area-geometry').waitFor({state:'visible'});await frame.getByRole('tab',{name:'Beta',exact:true}).filter({hasNot:frame.locator('[aria-selected=false]')}).waitFor();await page.waitForFunction(()=>document.querySelector('#atlas-frame').contentDocument.querySelector('#research-record').value==='fibonacci-m9-p24');
  await page.locator('#atlas-toggle').click();await page.locator('#experience>main').waitFor({state:'visible'});await page.locator('#atlas-toggle').click();await page.locator('#atlas-panel').waitFor({state:'visible'});
  await navigate('about');await noOverflow();await page.screenshot({path:path.join(output,'about-'+viewport.width+'.png')});
  assert.deepEqual(errors,[],'No page exceptions');assert.deepEqual(await page.evaluate(()=>window.__mediaEvents),[],'Navigation and dialogs preserve the background media');
  await page.locator('#back').click();assert.equal(await page.locator('#film').evaluate(v=>v.paused),true);await page.locator('#landing').waitFor({state:'visible'});
  results.push({viewport,passed:true,areas:5,soundViews:5,svgExports:6,geometryRecords:1001});await page.close();activePage=null;await context.close();
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify({candidate,processMuted:true,results},null,2));console.log(JSON.stringify({candidate,processMuted:true,results,output},null,2));
}finally{if(activePage){await activePage.evaluate(()=>document.querySelectorAll('video,audio').forEach(v=>v.pause())).catch(()=>{});await activePage.screenshot({path:path.join(output,'last-state.png')}).catch(()=>{});}await browser.close();await server.close();}
