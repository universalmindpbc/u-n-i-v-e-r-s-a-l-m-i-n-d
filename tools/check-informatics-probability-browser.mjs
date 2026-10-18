import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const base = 'https://staging.universalmind.tv/informatics/';
const output = process.env.INFORMATICS_QA_OUTPUT || '/private/tmp/m9-probability-staging';
await fs.mkdir(output, {recursive:true});
const server = await chromium.launchServer({
  executablePath:'/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  headless:true, args:['--mute-audio'],
});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser = await chromium.connect(server.wsEndpoint());
const results = [];
try {
  for (const viewport of [{width:1440,height:1000}, {width:390,height:844}]) {
    const context = await browser.newContext({viewport, reducedMotion:'reduce'});
    // Preserve the app's fullscreen-container flow without native fullscreen.
    await context.addInitScript(() => {
      let fullscreen = null;
      Object.defineProperty(document, 'fullscreenElement', {get:()=>fullscreen});
      Element.prototype.requestFullscreen = async function() {fullscreen=this;document.dispatchEvent(new Event('fullscreenchange'));};
      document.exitFullscreen = async () => {fullscreen=null;document.dispatchEvent(new Event('fullscreenchange'));};
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      const url = base + '?atlas=1&record=fibonacci-m9-p24#geometry-summary';
      await page.goto(url, {waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>!document.querySelector('#launch').disabled);
      await page.locator('#launch').click();
      const frame = page.frameLocator('#atlas-frame');
      const section = frame.locator('#atlas-probability');
      await section.waitFor({state:'visible'});
      assert.equal(await section.locator('h3').innerText(), 'Probability');
      assert.equal(await section.locator('.probability-value').innerText(), 'Approximately 1 in 195.1 billion');
      assert.match(await section.innerText(), /4, 8, 7, 5, 1, 2/);
      assert.equal(await section.evaluate(e=>e.nextElementSibling.id), 'm9-comparison');
      await page.waitForFunction(()=>{const v=document.querySelector('#film');return !v.paused && v.currentTime > 0.2;}, null, {timeout:45000});
      await page.evaluate(()=>{
        window.__probabilityFilm=document.querySelector('#film');
        window.__probabilityMediaEvents=[];
        for(const type of ['pause','emptied','loadstart']) __probabilityFilm.addEventListener(type,()=>__probabilityMediaEvents.push(type));
        window.__probabilityFullscreen=document.fullscreenElement;
      });
      await section.screenshot({path:path.join(output, `probability-${viewport.width}.png`)});
      await section.getByRole('button', {name:'View calculation'}).click();
      const dialog = frame.locator('.probability-reader');
      assert.equal(await dialog.evaluate(e=>e.open), true);
      assert.equal(await dialog.getByRole('heading', {name:'Probability',exact:true}).count(), 1);
      assert.equal(await dialog.locator('ol li').count(), 4);
      assert.match(await dialog.innerText(), /336,614,801,287,564,800/);
      assert.match(await dialog.innerText(), /1,725,543/);
      assert.match(await dialog.innerText(), /263 \/ 51,305,410,956,800/);
      assert.equal(page.url(), url);
      assert.equal(await dialog.evaluate(e=>{
        const r=e.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1 && r.top>=0 && r.bottom<=innerHeight+1 && e.scrollWidth<=e.clientWidth+1;
      }), true);
      await dialog.screenshot({path:path.join(output, `calculation-${viewport.width}.png`)});
      await dialog.getByText('Verification', {exact:true}).click();
      assert.match(await dialog.innerText(), /Three exact counting methods agree/);
      const jsonURL = await dialog.getByRole('link', {name:'Calculation JSON'}).getAttribute('href');
      const jsonResponse = await context.request.get(new URL(jsonURL,base).href);
      assert.equal(jsonResponse.status(),200);
      const probability = await jsonResponse.json();
      assert.equal(probability.result.fraction, '263/51305410956800');
      assert.equal(typeof probability.counts.all_arrangements,'string');
      assert.deepEqual(probability.method.beta_values,[4,8,7,5,1,2]);
      const codeURL = await dialog.getByRole('link', {name:'Python calculation'}).getAttribute('href');
      const codeResponse = await context.request.get(new URL(codeURL,base).href);
      assert.equal(codeResponse.status(),200);
      assert.match(await codeResponse.text(), /labelled_partition_count/);
      await dialog.getByRole('button', {name:'Close probability calculation'}).click();
      assert.equal(await dialog.evaluate(e=>e.open),false);
      assert.equal(await section.locator('button').evaluate(e=>e===document.activeElement),true);
      await section.locator('button').click();
      await page.keyboard.press('Escape');
      assert.equal(await dialog.evaluate(e=>e.open),false);
      assert.equal(await section.locator('button').evaluate(e=>e===document.activeElement),true);

      for (const [modulus,period] of [[18,24],[27,72],[36,24],[45,120],[1,1],[48,24]]) {
        await frame.locator('#research-record').selectOption(`fibonacci-m${modulus}-p${period}`);
        await frame.locator('.intro h1').filter({hasText:new RegExp(`^M${modulus} / P${period}$`)}).waitFor();
        assert.equal(await section.isVisible(),false);
        assert.equal(await section.innerText(),'');
      }
      await frame.locator('#research-record').selectOption('fibonacci-m9-p24');
      await section.waitFor({state:'visible'});
      await frame.getByRole('tab',{name:'Beta',exact:true}).click();
      assert.equal(await frame.locator('#sequence').innerText(),'4 → 8 → 7 → 5 → 1 → 2');
      assert.equal(await section.isVisible(),false);
      await frame.getByRole('tab',{name:'Geometry summary',exact:true}).click();
      await section.waitFor({state:'visible'});
      await frame.locator('#atlas-science-summary [data-science-register]').click();
      assert.equal(await frame.locator('.science-register tbody tr').count(),14);
      await page.keyboard.press('Escape');
      const media = await page.evaluate(()=>({
        same:document.querySelector('#film')===__probabilityFilm,
        playing:!__probabilityFilm.paused,
        events:__probabilityMediaEvents,
        fullscreenPreserved:document.fullscreenElement===__probabilityFullscreen,
      }));
      assert.deepEqual(media,{same:true,playing:true,events:[],fullscreenPreserved:true});
      assert.deepEqual(errors,[]);
      results.push({viewport,probability:true,lightbox:true,downloads:true,originalAlignment:true,
        otherRecordsUnassigned:true,focusReturn:true,musicContinuous:true,nativeFullscreenInvoked:false,errors});
    } finally {
      await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(e=>e.pause())).catch(()=>{});
      await context.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
await fs.writeFile(path.join(output,'results.json'),JSON.stringify({passed:true,results},null,2));
console.log(JSON.stringify({passed:true,results},null,2));
