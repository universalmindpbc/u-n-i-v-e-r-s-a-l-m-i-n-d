import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import '../Informatics/library-model.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='https://staging.universalmind.tv/informatics/';
const candidate=process.env.CANDIDATE==='1';
const output=`/private/tmp/research-search-${candidate?'candidate':'staging'}`;
await fs.mkdir(output,{recursive:true});
const server=await chromium.launchServer({executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',headless:true,args:['--mute-audio']});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser=await chromium.connect(server.wsEndpoint()), errors=[],results=[];
const model=globalThis.UniversalResearchModel;
async function readDownload(download) {const file=output+'/download.json';await download.saveAs(file);return JSON.parse(await fs.readFile(file,'utf8'));}
try {
 for(const width of [1470,390,320]) {
  const ctx=await browser.newContext({viewport:{width,height:956},acceptDownloads:true});
  if(candidate) await ctx.route(base+'**',async route=>{
   const file=path.join(root,'Informatics',new URL(route.request().url()).pathname.replace('/informatics/',''));
   try {await route.fulfill({status:200,body:await fs.readFile(file),contentType:{'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'}[path.extname(file)]||'application/octet-stream'});}catch{await route.continue();}
  });
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'library.html');await page.locator('.contents-chapter').first().waitFor();
  assert.equal(await page.locator('.contents-chapter > .paper-count').count(),6);
  assert.equal(await page.locator('.contents-chapter li .paper-count').count(),19);
  await page.locator('[data-view="search"]').click();
  for(const id of ['topic','journal','category','physiology','target','kind','period','trust','sort']) assert.equal(await page.locator('#'+id).isVisible(),true,id);
  assert.equal(await page.locator('details.search-filters').count(),0);
  const stats={};
  for(const collection of ['sound','vision','language','all']) {
   await page.locator(`[data-collection="${collection}"]`).click();
   if(collection==='sound')await page.locator('[data-view="search"]').click();
   const downloadPromise=page.waitForEvent('download');await page.locator('#export-json').click();const download=await downloadPromise;
   const json=await readDownload(download);
   const metrics=await page.locator('[data-stat]').evaluateAll(es=>Object.fromEntries(es.map(e=>[e.dataset.stat,Number(e.textContent.replaceAll(',',''))])));
   assert.equal(json.records.length,metrics.papers);
   const calculated=model.statistics(json.records,collection);
   for(const key of ['papers','journals','citations'])assert.equal(calculated[key],metrics[key],collection+':'+key);
   assert.equal(new Set(json.records.map(model.identity)).size,json.records.length);
   stats[collection]=metrics;
  }
  assert.ok(stats.all.papers < stats.sound.papers+stats.vision.papers+stats.language.papers);
  for(const design of ['double-blind','single-blind']) {
   await page.locator('#kind').selectOption(design);
   const downloadPromise=page.waitForEvent('download');await page.locator('#export-json').click();
   const json=await readDownload(await downloadPromise);
   assert.ok(json.records.length>0);assert.ok(json.records.every(r=>model.matchesStudy(r,design)));
   await page.reload();await page.locator('#results .search-paper').first().waitFor();assert.equal(await page.locator('#kind').inputValue(),design);
  }
  await page.locator('#reset').click();
  await page.locator('#journal').selectOption({label:'Frontiers in psychology'});
  let chosen=await page.locator('#journal').inputValue();assert.ok(chosen);
  await page.reload();await page.locator('#results .search-paper').first().waitFor();assert.equal(await page.locator('#journal').inputValue(),chosen);
  await page.locator('#reset').click();
  await page.locator('#physiology').selectOption('Heart rate & autonomic');
  assert.ok(await page.locator('.search-paper').count());
  await page.locator('#target').selectOption('OXTR');
  assert.ok(await page.locator('.search-paper').count());
  await page.locator('#reset').click();
  await page.locator('[data-collection="sound"]').click();await page.locator('[data-view="search"]').click();
  await page.locator('#topic').selectOption('sound:iii');
  assert.match(await page.locator('#result-count').innerText(),/17 papers/);
  await page.locator('#reset').click();
  await page.locator('#query').fill('Psychophysiological reactivity');await page.locator('#search-form').evaluate(f=>f.requestSubmit());
  await page.locator('#results h3 button').first().click();
  assert.equal(await page.locator('#article-title a').getAttribute('href'),'https://dialnet.unirioja.es/servlet/tesis?codigo=45360');
  await page.locator('[data-close="article"]').click();await page.locator('#query').fill('Sound Mind Warrior');await page.locator('#search-form').evaluate(f=>f.requestSubmit());
  await page.locator('#results h3 button').first().click();assert.equal(await page.locator('#article-title a').getAttribute('href'),'https://www.sigmarepository.org/inrc/2016/presentations_2016/143/');
  await page.locator('[data-close="article"]').click();await page.locator('#reset').click();
  for(const mode of ['video','black','white']) {
   await page.locator(`.reading-toolbar [data-reading-background="${mode}"]`).click();
   await page.locator('#collection-statistics').scrollIntoViewIfNeeded();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   const tops=await page.locator('[data-stat]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));
   assert.ok(Math.max(...tops)-Math.min(...tops)<1,'Collection totals align on every screen width');
   await page.screenshot({path:output+`/search-${width}-${mode}.png`,fullPage:false});
  }
  results.push({width,stats,status:'passed'});await ctx.close();
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile(output+'/verification.json',JSON.stringify({results,errors,muted:true},null,2)+'\n');console.log(JSON.stringify({output,results,errors},null,2));
} finally {await browser.close();await server.close();}
