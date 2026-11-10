import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {HUMAN} from '../Informatics/spacetime/human.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const root=dirname(dirname(fileURLToPath(import.meta.url))),live=process.argv.includes('--live');
const out=join(root,'research/informatics/spacetime-mobile-20261110',live?'staging':'candidate');mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:process.env.CHROMIUM_BIN||'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={mode:live?'staging':'candidate interception',muted:true,viewports:[],errors:[],checks:[]};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce',hasTouch:true});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(route.request().resourceType()==='media')return route.abort();
  if(url.hostname==='services.swpc.noaa.gov')return route.continue();
  if(url.hostname==='customer-1vpwglz3v6fiyaas.cloudflarestream.com'&&url.pathname.endsWith('/thumbnails/thumbnail.jpg'))return route.continue();
  if(url.hostname!=='staging.universalmind.tv'||!url.pathname.startsWith('/informatics/spacetime/'))return route.abort();
  if(live)return route.continue();
  const relative=url.pathname.replace('/informatics/spacetime/','')||'index.html';
  const contentType={'.js':'application/javascript','.json':'application/json','.mjs':'application/javascript','.css':'text/css','.html':'text/html'}[extname(relative)]||'text/plain';
  await route.fulfill({body:readFileSync(join(root,'Informatics/spacetime',relative)),contentType});
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const response=await page.goto('https://staging.universalmind.tv/informatics/spacetime/',{waitUntil:'networkidle'});
 assert.equal(response.status(),200);if(live)assert.match(response.headers()['x-robots-tag'],/noindex/);
 await page.waitForSelector('#chart .trace');
 assert.equal(await page.locator('#sequence-table tr').count(),64);
 assert.ok(await page.locator('#one-summon').isVisible());
 assert.ok(await page.locator('#earth-film').evaluate(e=>e.autoplay&&e.loop&&e.playsInline&&e.muted&&!e.controls));assert.equal(await page.locator('#background-motion').count(),0);
 await page.click('#one-summon');assert.ok(await page.locator('#one-panel').isVisible());
 assert.match(await page.locator('#one-panel').innerText(),/AI connection planned/);
 await page.keyboard.press('Escape');assert.ok(!(await page.locator('#one-panel').isVisible()));
 assert.ok(await page.locator('#one-summon').evaluate(e=>e===document.activeElement));
 const kernel=await page.evaluate(async()=>{const r=await fetch('kernel.json');return {type:r.headers.get('content-type'),value:await r.json()};});
 assert.match(kernel.type,/application\/json/);assert.equal(kernel.value.series.length,11);assert.deepEqual(kernel.value.analysis_contract.results,[]);

 assert.ok(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return new Set(ids).size===ids.length;}),'Unique document IDs');
 assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow,noarchive');
 for(const width of [1440,1024,390,320]){
  await page.setViewportSize({width,height:1100});await page.waitForTimeout(100);
  const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,chart:document.querySelector('#chart').getBoundingClientRect().width}));
  assert.ok(metrics.scroll<=metrics.client,`overflow ${width}: ${JSON.stringify(metrics)}`);
  report.viewports.push({width,...metrics});
  if(width===1440||width===390)await page.screenshot({path:join(out,`${width}.png`),fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1100});
 await page.waitForFunction(()=>{const e=document.querySelector('#chart');return Math.abs(e.viewBox.baseVal.width-e.getBoundingClientRect().width)<1;});
 assert.equal(await page.getAttribute('body','data-view'),'zen');
 assert.ok(await page.locator('button[data-view=zen]').isVisible());
 assert.ok(!(await page.locator('.inspector').isVisible()));
 assert.ok(!(await page.locator('.research-library').isVisible()));
 assert.equal(await page.locator('#chart .trace').count(),2);
 const zenHeight=await page.locator('#chart').evaluate(e=>e.getBoundingClientRect().height);
 await page.selectOption('#zen-pattern','fibonacci');await page.waitForTimeout(60);
 assert.equal(await page.locator('#chart .trace').count(),3);
 assert.ok(await page.locator('#chart').evaluate(e=>e.getBoundingClientRect().height)>zenHeight);assert.equal(await page.inputValue('#zen-clock'),'year');
 assert.match(await page.locator('#chart-note').innerText(),/clock fixed/);
 await page.selectOption('#zen-pattern','king');await page.waitForSelector('[data-series=king]');assert.equal(await page.locator('#chart .trace').count(),3);
 await page.selectOption('#zen-pattern','timewave');await page.waitForSelector('[data-series=timewave]');assert.equal(await page.inputValue('#through'),'2012-12-21');
 await page.selectOption('#zen-range','25');
 await page.selectOption('#zen-pattern','none');
 for(const id of HUMAN.map(h=>h.id)){
  await page.selectOption('#zen-indicator',id);await page.waitForTimeout(30);
  assert.equal(await page.locator('#chart .trace').count(),2);
  assert.ok(!(await page.locator('#chart').innerHTML()).match(/NaN|Infinity/));
  assert.ok((await page.locator('#zen-source-note').textContent()).includes(HUMAN.find(h=>h.id===id).publisher));
 }
 await page.selectOption('#zen-indicator','growth');
 await page.setViewportSize({width:390,height:1100});await page.selectOption('#zen-pattern','fibonacci');await page.locator('#chart').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
 const cdp=await context.newCDPSession(page),box=await page.locator('#chart').boundingBox();
 const range=()=>page.locator('#chart').evaluate(e=>[Number(e.dataset.windowFrom),Number(e.dataset.windowThrough)]);
 const startRange=await range();const y=box.y+130;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:125,y,id:1},{x:225,y,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:85,y,id:1},{x:265,y,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);
 const pinched=await range();assert.ok(pinched[1]-pinched[0]<(startRange[1]-startRange[0])*.7);assert.equal(await page.locator('#chart').getAttribute('data-clock'),'year');assert.equal(await page.evaluate(()=>visualViewport.scale),1);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:230,y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(50);
 assert.notEqual((await range())[0],pinched[0]);await page.click('#zoom-reset');await page.waitForFunction(start=>Number(document.querySelector('#chart').dataset.windowFrom)===start,startRange[0]);assert.deepEqual(await range(),startRange);
 await page.selectOption('#zen-range','24h');await page.waitForSelector('.kp-bin',{timeout:20000});assert.equal(await page.locator('.kp-bin').count(),8);assert.ok(await page.locator('#weather-panel').isVisible());assert.ok(!(await page.locator('.chart-wrap').isVisible()));
 await page.selectOption('#social-indicator','hostility');assert.match(await page.locator('#social-title').innerText(),/bullying/);assert.match(await page.locator('.social-placeholder').innerText(),/connection pending/);
 await page.click('#zoom-in');assert.ok(await page.locator('.kp-bin').count()<8);await page.click('#zoom-reset');assert.equal(await page.locator('.kp-bin').count(),8);
 await page.click('.weather-sources summary');const dailyPromise=page.waitForEvent('download');await page.click('#weather-export');const dailyDownload=await dailyPromise;const dailyChunks=[];for await(const c of await dailyDownload.createReadStream())dailyChunks.push(c);const daily=JSON.parse(Buffer.concat(dailyChunks));assert.equal(daily.observations.length,8);assert.equal(daily.social.observations,null);assert.equal(daily.cadence,'3 hours');
 await page.click('.weather-sources summary');
 for(const id of ['wind-speed','wind-density','bz','xray']){
  await page.selectOption('#space-indicator',id);await page.waitForSelector('#weather-chart[data-series="'+id+'"] .weather-trace',{timeout:25000});
  assert.ok(!(await page.locator('#weather-chart').innerHTML()).match(/NaN|Infinity/));assert.ok((await page.locator('#weather-chart .weather-trace').getAttribute('d')).length>100);
  await page.click('.weather-sources summary');const exportPromise=page.waitForEvent('download');await page.click('#weather-export');const exported=await exportPromise,parts=[];for await(const part of await exported.createReadStream())parts.push(part);const seriesExport=JSON.parse(Buffer.concat(parts));assert.equal(seriesExport.series,id);assert.equal(seriesExport.cadence,'1 minute');assert.ok(seriesExport.observations.length>500);assert.equal(seriesExport.social.observations,null);assert.ok(seriesExport.observations.every(r=>r.source_record&&typeof r.valid==='boolean'));await page.click('.weather-sources summary');

  await page.click('#zoom-in');await page.click('#zoom-reset');
 }
 assert.match(await page.locator('#weather-chart').textContent(),/logarithmic/);
 await page.selectOption('#space-indicator','wind-speed');await page.waitForSelector('#weather-chart[data-series="wind-speed"] .weather-trace');
 await page.screenshot({path:join(out,'weather-mobile.png'),fullPage:true});
 await page.selectOption('#space-indicator','kp');await page.waitForSelector('.kp-bin');
 await page.selectOption('#zen-range','25');await page.selectOption('#zen-pattern','none');await page.setViewportSize({width:1440,height:1100});
 await page.click('button[data-view=research]');
 assert.ok(await page.locator('.inspector').isVisible());
 assert.ok(await page.locator('#one-summon').isVisible());
 await page.selectOption('#clock','year');await page.selectOption('#method','multiscale');await page.selectOption('#depth','4');
 await page.locator('[data-layer=king]').uncheck();await page.click('[data-layout=overlay]');
 await page.click('button[data-view=zen]');await page.waitForTimeout(40);
 assert.equal(await page.locator('#chart .trace').count(),2);
 await page.selectOption('#zen-indicator','market-return');await page.selectOption('#zen-range','100');
 await page.click('button[data-view=research]');
 assert.equal(await page.inputValue('#clock'),'year');assert.equal(await page.inputValue('#method'),'multiscale');assert.equal(await page.inputValue('#depth'),'4');
 assert.equal(await page.inputValue('#human-indicator'),'market-return');assert.equal(await page.inputValue('#from'),'1926-01-01');
 assert.ok(!(await page.locator('[data-layer=king]').isChecked()));assert.equal(await page.getAttribute('[data-layout=overlay]','aria-pressed'),'true');
 await page.click('#reset');
 for(const indicator of ['growth','development','positive','negative','satisfaction','market-return','market-price','market-volatility','conflict']){
  await page.selectOption('#human-indicator',indicator);await page.click('#human-range');await page.waitForTimeout(40);
  assert.ok((await page.locator('#human-coverage').innerText()).includes(indicator.startsWith('market-')?'United States':'World'));
  assert.ok(await page.locator('#chart .observation').count()>15);
  assert.ok(!(await page.locator('#chart').innerHTML()).match(/NaN|Infinity/));
 }
 assert.ok(await page.locator('#chart .uncertainty').count()>15);
 await page.click('#reset');await page.selectOption('#human-indicator','market-return');await page.waitForTimeout(50);
 await page.locator('.workspace').screenshot({path:join(out,'market.png')});
 await page.click('.clock-detail summary');await page.fill('#from','2020-03-01');await page.fill('#through','2020-03-31');await page.click('#apply-dates');await page.waitForTimeout(40);
 const expected=HUMAN.find(s=>s.id==='market-return').rows.find(r=>r.year===2020&&r.month===3).value.toLocaleString('en-AU',{maximumFractionDigits:2});
 assert.ok((await page.locator('#readout').innerText()).includes(expected+' % per month'));
 await page.click('.clock-detail summary');await page.click('#reset');
 for(const clock of ['day','month','year','decade']){
  await page.selectOption('#clock',clock);
  for(const method of ['values','change','multiscale','entropy']){
   await page.selectOption('#method',method);await page.waitForTimeout(30);
   assert.ok(!(await page.locator('#chart').innerHTML()).match(/NaN|Infinity/));
  }
 }
 await page.selectOption('#method','multiscale');await page.selectOption('#depth','4');await page.selectOption('#clock','day');
 await page.click('[data-range=all]');await page.waitForTimeout(100);
 assert.ok(await page.locator('#chart .envelope').count()>0);
 await page.click('[data-layout=overlay]');await page.waitForTimeout(50);
 await page.click('[data-range=sequence]');await page.waitForTimeout(50);
 assert.ok(await page.locator('#clock').isDisabled());assert.ok(await page.locator('[data-layer=solar]').isDisabled());
 await page.click('#timewave-preset');await page.waitForTimeout(100);
 assert.ok(await page.locator('[data-layer=timewave]').isChecked());
 const downloadPromise=page.waitForEvent('download');await page.click('#export');const download=await downloadPromise;
 const chunks=[];for await(const chunk of await download.createReadStream())chunks.push(chunk);const exportData=JSON.parse(Buffer.concat(chunks).toString('utf8'));assert.equal(exportData.schema,'spacetime-view/v5');assert.equal(exportData.kernel.series,11);assert.equal(exportData.kernel.sha256.length,64);assert.equal(exportData.settings.throughUTC,'2012-12-21T11:00:00.000Z');assert.equal(exportData.evaluation.length,769);assert.equal(exportData.evaluation.at(-1).timewave,0);assert.equal(exportData.human_indicator.id,'growth');assert.ok(exportData.human_indicator.rows.length>40);assert.equal(exportData.human_indicator.units,'% per year');
 await page.screenshot({path:join(out,'timewave.png'),fullPage:false});
 await page.click('[data-range="25"]');await page.waitForTimeout(50);
 await page.locator('#inspect').fill('1000');await page.locator('#inspect').dispatchEvent('input');
 assert.match(await page.locator('#readout').innerText(),/Beyond historical zero/);
 await page.click('.clock-detail summary');await page.fill('#from','2025-12-31');await page.fill('#through','2000-01-01');await page.click('#apply-dates');assert.ok((await page.locator('#date-error').innerText()).length>0);
 await page.click('#reset');await page.waitForTimeout(50);assert.equal(await page.inputValue('#clock'),'month');
 await page.locator('#inspect').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.inputValue('#inspect'),'651');
 for(const layer of ['fibonacci','solar','king'])await page.locator(`[data-layer=${layer}]`).uncheck();
 await page.selectOption('#human-indicator','none');
 await page.waitForTimeout(50);assert.match(await page.locator('#chart').textContent(),/Select a layer/);
 assert.deepEqual(report.errors,[]);report.checks=['Real two-finger CDP pinch and touch pan, viewport scale preserved','Zoom reset and fixed sequence clock','Five live space-weather choices, Kp intervals, native minute traces, log X-rays, zoom and JSON export','Missing social provider is explicit','Universal One preview, Escape and focus return','Native silent autoplay markup and no playback controls','Kernel JSON retrieval and export reference','Zen default and visible switch','two observed series in Zen','Fibonacci and King Wen native yearly steps on a separate scale; historical Timewave option','nine Zen indicator choices','Research configuration preserved across view changes','page response','noindex','four viewport widths','64 hexagrams','16 clock/method combinations','dense envelopes','overlay','sequence space','historical zero','JSON download','date validation','reset','keyboard inspection','layer toggles','nine human and market choices','source coverage','conflict ranges','market monthly observations','human export'];
 await context.close();
}finally{await browser.close();await server.close();writeFileSync(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
