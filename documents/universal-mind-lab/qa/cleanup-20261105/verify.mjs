import { chromium } from '/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const live = process.argv.includes('--live');
const out = 'documents/universal-mind-lab/qa/cleanup-20261105/' + (live ? 'live' : 'local');
const origin = 'https://staging.universalmind.tv';
fs.mkdirSync(out, { recursive: true });
const server = await chromium.launchServer({
  headless: true,
  executablePath: '/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  args: ['--mute-audio', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
assert(server.process().spawnargs.includes('--mute-audio'));
const browser = await chromium.connect(server.wsEndpoint());
const results = [], hashes = [];
try {
  for (const mobile of [false, true]) {
    const vp = mobile ? { width: 393, height: 780 } : { width: 1440, height: 900 };
    const context = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block' });
    try {
      await context.addInitScript(() => {
        Element.prototype.requestFullscreen = undefined;
        Element.prototype.webkitRequestFullscreen = undefined;
        HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      });
      if (live && !mobile) {
        for (const f of ['index.html', 'lab.css', 'lab.mjs']) {
          const response = await context.request.get(origin + '/lab/' + f + '?verify=cleanup-20261105');
          assert.equal(response.status(), 200);
          const body = await response.body();
          const source = f === 'index.html' ? Buffer.from(body.toString().replace(/<script\b[^>]*src="https:\/\/static\.cloudflareinsights\.com\/[^>]*><\/script>\n?/g, '')) : body;
          assert(source.equals(fs.readFileSync('lab/' + f)), f + ' deployed source differs');
          hashes.push({ file: f, sha256: createHash('sha256').update(source).digest('hex') });
        }
      }
      await context.route(origin + '/**', async route => {
        const url = new URL(route.request().url());
        const file = path.resolve('.' + url.pathname + (url.pathname.endsWith('/') ? 'index.html' : ''));
        if (url.pathname.endsWith('/hls.min.js')) return route.fulfill({ contentType: 'application/javascript', body: 'window.Hls=class{static isSupported(){return true}static Events={ERROR:"error"};on(){}loadSource(){}attachMedia(){}destroy(){}}' });
        if (url.pathname === '/lab/lab.mjs') {
          let source = fs.readFileSync(file, 'utf8');
          if (live) assert.equal(await (await route.fetch()).text(), source);
          source = source.replace('createStory, ORBIT_START', 'createStory, storyFrame, ORBIT_START').replace("go('overview',true);resize();", "go('overview',true);resize();window.__qa={frame:t=>{autoTourCancelled=false;applyStory(storyFrame(t));},day:()=>{story.setNight(0);syncNight(false);setNight(0);}};");
          return route.fulfill({ contentType: 'application/javascript', body: source });
        }
        if (!live) return fs.existsSync(file) && fs.statSync(file).isFile() ? route.fulfill({ path: file }) : route.abort();
        return route.continue();
      });
      await context.route('**/*.m3u8*', route => route.abort());
      const page = await context.newPage(), errors = [], previewRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.url().includes('portal-preview')) previewRequests.push(request.url()); });
      await page.clock.install();
      await page.clock.pauseAt(new Date(Date.now() + 2000));
      await page.goto(origin + '/lab/');
      await page.waitForFunction(() => document.body.dataset.ready === 'true', {}, { timeout: 60000 });
      await page.locator('#explore-enter').click();
      await page.clock.fastForward(160000);
      await page.clock.runFor(40);
      await page.evaluate(() => { window.__qa.frame(160); window.__qa.day(); });
      const settle = async () => { await page.clock.runFor(40); await page.clock.fastForward(1500); await page.clock.runFor(80); await page.waitForTimeout(500); };
      await settle();
      assert.equal(await page.locator('[id^="portal-preview"]').count(), 0);
      await page.screenshot({ path: out + '/overview-' + vp.width + '.png' });
      for (const width of mobile ? [393, 320, 900] : [1440, 1024]) {
        await page.setViewportSize({ width, height: vp.height });
        await settle();
        const footer = await page.locator('.footline').evaluate(element => {
          const data = Object.fromEntries(['.initiative-credit', '.proposal-status', '.research-link', '.impact-ticker'].map(selector => {
            const node = element.querySelector(selector), style = getComputedStyle(node), rect = node.getBoundingClientRect();
            return [selector, { font: style.fontSize, display: style.display, align: style.textAlign, center: rect.x + rect.width / 2, width: rect.width, bottom: rect.bottom }];
          }));
          return { ...data, viewport: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth };
        });
        assert.equal(footer['.research-link'].display === 'none', mobile);
        assert.equal(footer['.initiative-credit'].font, mobile ? '9px' : '12px');
        assert.equal(footer['.proposal-status'].font, mobile ? '8.5px' : '9.6px');
        assert.equal(footer.overflow, false);
        if (mobile) {
          assert.equal(footer['.impact-ticker'].font, '11px');
          for (const selector of ['.initiative-credit', '.proposal-status', '.impact-ticker']) {
            assert.equal(footer[selector].align, 'center');
            assert(Math.abs(footer[selector].center - width / 2) < 2, selector + ' centered');
            assert(footer[selector].bottom <= vp.height);
          }
        }
        await page.locator('.explore-bar').screenshot({ path: out + '/footer-' + width + '.png' });
        results.push({ width, mobile, footer });
      }
      await page.setViewportSize(vp);
      await settle();
      await page.locator('#about-open').click();
      assert.equal(await page.getByText('Launch realistic preview', { exact: true }).count(), 0);
      await page.locator('#portal-about').click();
      await settle();
      assert.equal(await page.locator('#place-title').textContent(), 'I Am Portal');
      await page.locator('[data-portal-room="portal-emdr"]').click();
      await settle();
      assert.equal(await page.locator('[data-portal-room="portal-emdr"]').getAttribute('aria-pressed'), 'true');
      await page.screenshot({ path: out + '/emdr-' + vp.width + '.png' });
      assert.deepEqual(previewRequests, []);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ viewport: vp, pass: true, pageErrors: errors, previewRequests }));
    } finally {
      for (const page of context.pages()) await page.evaluate(() => document.querySelectorAll('audio,video').forEach(media => media.pause())).catch(() => {});
      await context.close();
    }
  }
  fs.writeFileSync(out + '/verification.json', JSON.stringify({ live, processMuted: true, mediaStubbed: true, timelineInstrumented: true, nativeFullscreenNeverInvoked: true, results, liveSourceHashes: hashes }, null, 2) + '\n');
} finally {
  await browser.close();
  await server.close();
}
