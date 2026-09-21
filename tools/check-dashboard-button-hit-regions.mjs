import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium, webkit} from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.env.HIT_QA_DIR || '/private/tmp/um-dashboard-hit-qa';
await fs.mkdir(out, {recursive:true});
const report = {authentication:'Owner API response fixture; no settings writes', playback:'All click actions and media playback blocked; WebKit is used only for hit testing', browsers:[]};
const selectors = ['[data-preview-toggle]', '[data-mantra-preview-toggle]', '[data-preview-together]', '[data-synth-preview-toggle]'];

for (const name of ['chromium', 'webkit']) {
  let server, browser;
  try {
    if (name === 'chromium') {
      server = await chromium.launchServer({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--mute-audio']});
      assert.ok(server.process().spawnargs.includes('--mute-audio'));
      browser = await chromium.connect(server.wsEndpoint());
    } else browser = await webkit.launch({headless:true});
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.__hits = [];
      // Capture first, before any owner action can start audio or write settings.
      document.addEventListener('click', event => {
        window.__hits.push(event.target.closest('button'));
        event.preventDefault(); event.stopImmediatePropagation();
      }, true);
      HTMLMediaElement.prototype.play = () => Promise.reject(Error('Non-playback hit-area test'));
    });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/quantum-tree-settings.php', route => route.fulfill({json:{authenticated:true,csrf_token:'fixture-no-writes',peak_volume:.055,mantra_enabled:true}}));
    if (process.env.HIT_QA_LOCAL === '1') for (const file of ['quantum-tree-control.html','quantum-tree-control.js','adaptive-sound/owner-synth-v1.js','adaptive-sound-intent-policy-v1.json']) {
      await page.route('**/'+file+'*', route => route.fulfill({path:path.join(root,'i  a m',file),contentType:file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'text/javascript'}));
    }
    await page.goto('https://staging.universalmind.tv/vogue/iam/quantum-tree-control.html', {waitUntil:'domcontentloaded'});
    await page.locator('[data-owner-dashboard]').waitFor({state:'visible'});
    const results = [];
    for (const viewport of [{width:1470,height:956},{width:390,height:844}]) {
      await page.setViewportSize(viewport);
      for (const selector of selectors) {
        const button = page.locator(selector); await button.scrollIntoViewIfNeeded();
        await page.mouse.move(0,0); await page.waitForTimeout(100);
        const rect = await button.boundingBox();
        for (const [x,y] of [[.5,.15],[.5,.5],[.5,.85],[.1,.5],[.9,.5]]) {
          const point = {x:rect.x+rect.width*x,y:rect.y+rect.height*y};
          assert.equal(await page.evaluate(({point,selector}) => document.elementFromPoint(point.x,point.y)?.closest('button') === document.querySelector(selector), {point,selector}), true);
          const count = await page.evaluate(() => __hits.length);
          await page.mouse.move(point.x,point.y); await page.mouse.down();
          // Hold over several animation frames: WebKit lost text-targeted clicks before the fix.
          await page.waitForTimeout(120); await page.mouse.up();
          const delivered = await page.evaluate(({count,selector}) => __hits.length === count+1 && __hits[count] === document.querySelector(selector), {count,selector});
          results.push({viewport,selector,position:[x,y],delivered});
        }
      }
      await page.screenshot({path:path.join(out,`${name}-${viewport.width}.png`)});
    }
    report.browsers.push({name,results,errors});
    assert.deepEqual(errors,[]);
    assert.ok(results.every(result => result.delivered), `${name}: every button position must deliver exactly one click`);
  } finally { await browser?.close(); await server?.close(); await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)); }
}
report.passed = true;
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:true,browsers:report.browsers.map(({name,results})=>({name,clicks:results.length,delivered:results.filter(r=>r.delivered).length}))},null,2));
