import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://staging.universalmind.tv/informatics/';
const candidate = process.env.INFORMATICS_CANDIDATE === '1';
const output = process.env.INFORMATICS_QA_OUTPUT || '/private/tmp/informatics-science-qa';
await fs.mkdir(output, {recursive: true});
const server = await chromium.launchServer({
  executablePath: '/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  headless: true, args: ['--mute-audio'],
});
assert.ok(server.process().spawnargs.includes('--mute-audio'));
const browser = await chromium.connect(server.wsEndpoint());
const results = [];
try {
  for (const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
    const context = await browser.newContext({viewport, reducedMotion:'reduce'});
    await context.addInitScript(() => {
      // Test layout at explicit viewport dimensions; never enter native fullscreen.
      Element.prototype.requestFullscreen = async function () {};
      document.exitFullscreen = async function () {};
      HTMLMediaElement.prototype.play = async function () {};
    });
    if (candidate) await context.route(/https:\/\/staging\.universalmind\.tv\/(?:I|i)nformatics\//, async route => {
      const u = new URL(route.request().url());
      const relative = decodeURIComponent(u.pathname).replace(/^\/(?:I|i)nformatics\//, '') || 'index.html';
      const file = path.resolve(root, 'Informatics', relative);
      if (!file.startsWith(path.join(root,'Informatics') + path.sep)) return route.abort();
      try {
        const contentType = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)] || 'application/octet-stream';
        await route.fulfill({status:200,contentType,body:await fs.readFile(file)});
      } catch { await route.fulfill({status:404,body:'Missing candidate file'}); }
    });
    await context.route(/\.mp4(?:\?|$)/, route => route.fulfill({status:204,body:''}));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '?about=science', {waitUntil:'domcontentloaded'});
    await page.locator('#launch').waitFor({state:'visible'});
    await page.waitForFunction(() => !document.querySelector('#launch').disabled);
    assert.equal(await page.locator('#about').evaluate(e=>e.open), true);
    assert.equal(await page.locator('.science-teachables button').count(), 4);
    await page.locator('#about-science').scrollIntoViewIfNeeded();
    const closeRect = await page.locator('#about-close').boundingBox();
    assert.ok(closeRect && closeRect.y >= 0 && closeRect.y + closeRect.height <= viewport.height, 'About close remains visible while reading');
    const dialogRect = await page.locator('#about').boundingBox();
    const headingRect = await page.locator('#about .about-heading').boundingBox();
    assert.ok(Math.abs(headingRect.y - dialogRect.y) <= 2, 'About heading stays flush with the dialog while scrolling');
    await page.locator('.science-teachables img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    await page.screenshot({path:path.join(output, `about-${viewport.width}.png`)});
    await page.locator('#about-science [data-science-card="gamma"]').click();
    const reader = page.locator('.science-reader');
    assert.equal(await reader.evaluate(e=>e.open), true);
    assert.equal(await reader.locator('.science-visual').evaluate(e=>e.open), true);
    await reader.locator('.science-image-button img').scrollIntoViewIfNeeded();
    await reader.locator('.science-image-button img').evaluate(img=>img.decode());
    assert.match(await reader.locator('.science-image-note').innerText(), /Tyr–Trp/);
    await reader.locator('.science-image-button').click();
    assert.equal(await page.locator('.science-zoom').evaluate(e=>e.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.science-zoom').evaluate(e=>e.open), false);
    assert.equal(await reader.evaluate(e=>e.open), true);
    for (const id of ['alpha','beta','gamma','epsilon']) {
      await reader.locator(`[data-reader-card="${id}"]`).click();
      assert.equal(await reader.locator('.science-visual').evaluate(e=>e.open), true);
      assert.match(await reader.locator('.science-evidence').innerText(), /Numerical score unassigned/);
      assert.equal(await reader.locator('.science-doi').count(), 1);
    }
    await reader.locator('[data-reader-card="alpha"]').click();
    await reader.locator('.science-atlas-link').click();
    await page.locator('#atlas-panel').waitFor({state:'visible'});
    const frame = page.frameLocator('#atlas-frame');
    await frame.locator('#m9-science-summary').waitFor({state:'visible'});
    assert.equal(await frame.locator('#research-record').inputValue(), 'fibonacci-m9-p24');
    assert.equal(await frame.locator('#m9-science-summary img').count(), 0);
    assert.equal(await frame.locator('#m9-science-summary .science-literature-list article').count(), 4);
    await frame.getByRole('tab', {name:'Geometry summary', exact:true}).click();
    assert.equal(await frame.locator('#summary-science-slot #m9-science-summary').count(), 1);
    await frame.locator('#shape-summary').screenshot({path:path.join(output, `atlas-summary-${viewport.width}.png`)});
    await frame.locator('#m9-science-summary [data-science-card="gamma"]').click();
    const atlasReader = frame.locator('.science-reader');
    assert.equal(await atlasReader.locator('.science-visual').evaluate(e=>e.open), false);
    assert.match(await atlasReader.innerText(), /Cryo-electron microscopy/);
    assert.match(await atlasReader.innerText(), /engineered components/);
    await atlasReader.screenshot({path:path.join(output, `literature-${viewport.width}.png`)});
    for (const id of ['alpha','beta','gamma','epsilon']) {
      await atlasReader.locator(`[data-reader-card="${id}"]`).click();
      assert.equal(await atlasReader.locator('.science-visual').evaluate(e=>e.open), false);
      assert.match(await atlasReader.locator('.science-evidence').innerText(), /OPEN ATLAS QUESTION/);
    }
    await atlasReader.locator('.science-visual > summary').click();
    await atlasReader.locator('.science-image-button img').scrollIntoViewIfNeeded();
    await atlasReader.locator('.science-image-button img').evaluate(img=>img.decode());
    await atlasReader.locator('.science-atlas-link').click();
    await frame.locator('[role=tab][aria-selected=true]').filter({hasText:/^Epsilon$/}).waitFor();
    assert.equal(await frame.getByRole('tab',{name:'Epsilon',exact:true}).getAttribute('aria-selected'),'true');
    for (const id of ['fibonacci-m18-p24','fibonacci-m1-p1','fibonacci-m48-p24','m-summary']) {
      // Record IDs are read from the actual selector rather than inferred periods.
      const value = id.startsWith('fibonacci-m48') ? await frame.locator('#research-record option').evaluateAll(opts => opts.find(o=>o.textContent.startsWith('Fibonacci · M48 /')).value) : id;
      await frame.locator('#research-record').selectOption(value);
      await frame.locator('#m9-science-summary').waitFor({state:'hidden'});
      if (value === 'm-summary') await frame.locator('#family-view').waitFor({state:'visible'});
      else await frame.locator('.intro h1').filter({hasText:new RegExp('^M'+value.match(/-m(\d+)-/)[1]+' /')}).waitFor();
      if (value === 'fibonacci-m18-p24') {
        await frame.getByRole('tab',{name:'Epsilon',exact:true}).click();
        await frame.locator('#epsilon-reduced').click();
        assert.equal(await frame.locator('#epsilon-reduced').getAttribute('aria-pressed'),'true');
      }
    }
    await frame.locator('#research-record').selectOption('fibonacci-m9-p24');
    await frame.locator('#m9-science-summary').waitFor({state:'visible'});
    await frame.locator('#atlas-downloads > summary').click();
    assert.equal(await frame.locator('.atlas-download-menu a').count(),3);
    await frame.locator('#atlas-downloads').press('Escape');
    assert.equal(await frame.locator('#atlas-downloads').evaluate(e=>e.open),false);
    assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth),true);
    assert.equal(await frame.locator('html').evaluate(e=>e.scrollWidth <= innerWidth),true);
    assert.deepEqual(errors,[]);
    results.push({viewport,aboutCards:4,atlasPapers:4,atlasIllustrationsCollapsed:true,otherRecordsExcluded:true,errors});
    await page.evaluate(()=>document.querySelectorAll('video,audio').forEach(m=>m.pause()));
    await context.close();
  }
  console.log(JSON.stringify({passed:true,candidate,processMuted:true,nativeFullscreen:false,results,output},null,2));
} finally {
  await browser.close().catch(()=>{});
  await server.close().catch(()=>{});
}
