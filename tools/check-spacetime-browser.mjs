import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const root=dirname(dirname(fileURLToPath(import.meta.url))),live=process.argv.includes('--live');
const out=join(root,'research/informatics/spacetime-20261110',live?'staging':'candidate');mkdirSync(out,{recursive:true});
const server=await chromium.launchServer({headless:true,executablePath:process.env.CHROMIUM_BIN||'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint());
const report={mode:live?'staging':'candidate interception',muted:true,viewports:[],errors:[],checks:[]};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(route.request().resourceType()==='media')return route.abort();
  if(url.hostname!=='staging.universalmind.tv'||!url.pathname.startsWith('/informatics/spacetime/'))return route.abort();
  if(live)return route.continue();
  const relative=url.pathname.replace('/informatics/spacetime/','')||'index.html';
  const contentType={'.mjs':'application/javascript','.css':'text/css','.html':'text/html'}[extname(relative)]||'text/plain';
  await route.fulfill({body:readFileSync(join(root,'Informatics/spacetime',relative)),contentType});
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const response=await page.goto('https://staging.universalmind.tv/informatics/spacetime/',{waitUntil:'networkidle'});
 assert.equal(response.status(),200);if(live)assert.match(response.headers()['x-robots-tag'],/noindex/);
 await page.waitForSelector('#chart .trace');
 assert.equal(await page.locator('#sequence-table tr').count(),64);
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
 const chunks=[];for await(const chunk of await download.createReadStream())chunks.push(chunk);const exportData=JSON.parse(Buffer.concat(chunks).toString('utf8'));assert.equal(exportData.settings.throughUTC,'2012-12-21T11:00:00.000Z');assert.equal(exportData.evaluation.length,769);assert.equal(exportData.evaluation.at(-1).timewave,0);
 await page.screenshot({path:join(out,'timewave.png'),fullPage:false});
 await page.click('[data-range="25"]');await page.waitForTimeout(50);
 await page.locator('#inspect').fill('1000');await page.locator('#inspect').dispatchEvent('input');
 assert.match(await page.locator('#readout').innerText(),/Beyond historical zero/);
 await page.click('.clock-detail summary');await page.fill('#from','2025-12-31');await page.fill('#through','2000-01-01');await page.click('#apply-dates');assert.ok((await page.locator('#date-error').innerText()).length>0);
 await page.click('#reset');await page.waitForTimeout(50);assert.equal(await page.inputValue('#clock'),'month');
 await page.locator('#inspect').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.inputValue('#inspect'),'651');
 for(const layer of ['fibonacci','solar','king'])await page.locator(`[data-layer=${layer}]`).uncheck();
 await page.waitForTimeout(50);assert.match(await page.locator('#chart').textContent(),/Select a layer/);
 assert.deepEqual(report.errors,[]);report.checks=['page response','noindex','four viewport widths','64 hexagrams','16 clock/method combinations','dense envelopes','overlay','sequence space','historical zero','JSON download','date validation','reset','keyboard inspection','layer toggles'];
 await context.close();
}finally{await browser.close();await server.close();writeFileSync(join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
