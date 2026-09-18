import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const base = process.env.IAM_BROWSER_BASE_URL || "https://staging.universalmind.tv/vogue/iam/";
const output = process.env.IAM_RESEARCH_QA_OUTPUT || "/private/tmp/sex-ed-research-continuity-20260918";
await fs.mkdir(output, { recursive: true });
const server = await chromium.launchServer({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell",
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
assert.ok(server.process()?.spawnargs.includes("--mute-audio"));
const browser = await chromium.connect(server.wsEndpoint());
const report = { processMuted: true, nativeFullscreenTested: false, results: [] };

function playbackState() {
  const video = document.querySelector(".adaptive-television-local-video");
  return {
    sameDocument: window.__researchQa.document === document,
    sameMedia: window.__researchQa.media === video,
    time: video.currentTime,
    source: video.currentSrc,
    paused: video.paused,
    muted: video.muted,
    volume: video.volume,
    pauses: window.__researchQa.pauses,
    reloads: window.__researchQa.reloads,
    fullscreenCalls: window.__researchSafety.fullscreen,
    microphoneCalls: window.__researchSafety.microphone,
  };
}

try {
  for (const [label, viewport] of [["desktop", { width: 1440, height: 1000 }], ["mobile", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(() => {
      window.__researchSafety = { fullscreen: 0, microphone: 0 };
      Element.prototype.requestFullscreen = function () {
        window.__researchSafety.fullscreen++;
        return Promise.reject(new Error("Native fullscreen is disabled in QA"));
      };
      if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = function () {
        window.__researchSafety.microphone++;
        return Promise.reject(new Error("Live capture is disabled in QA"));
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(`${base}index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(() => window.IAMTelevisionRoom && window.IAMStreamController);
      assert.equal(await page.locator("body").getAttribute("data-adaptive-selection-source"), "no_checkin_random");
      await page.evaluate(() => window.IAMTelevisionRoom.preparePresentationEntry());
      await page.locator("[data-reaction-wallet]").hover();
      await page.locator('[data-wallet-category="video"]').click();
      await page.locator(".adaptive-television-local-video").evaluate(video => {
        video.muted = false;
        window.IAMStreamController.play(video).catch(() => {});
      });
      await page.waitForFunction(() => {
        const video = document.querySelector(".adaptive-television-local-video");
        return video && !video.paused && video.currentTime > 1;
      }, null, { timeout: 60000 });
      await page.evaluate(() => {
        const media = document.querySelector(".adaptive-television-local-video");
        window.__researchQa = { document, media, pauses: 0, reloads: 0 };
        media.addEventListener("pause", () => window.__researchQa.pauses++);
        media.addEventListener("emptied", () => window.__researchQa.reloads++);
      });
      const before = await page.evaluate(playbackState);
      const outerUrl = page.url();
      const outerOrigin = await page.evaluate(() => performance.timeOrigin);
      // The animated wallet can intercept pointer coordinates while it settles.
      await page.locator("[data-sex-ed-link]").evaluate(link => link.click());
      await page.locator('[data-sex-ed-shelf][aria-hidden="false"]').waitFor();
      const cycles = [];
      for (const returnLink of [".back-link", "footer [data-sex-ed-return]"]) {
        await page.locator("[data-sex-ed-research]").click();
        const frame = page.frameLocator("[data-television-page-frame]");
        await frame.locator('html[data-music-television-frame="embedded"]').waitFor();
        await frame.locator("h1").waitFor();
        assert.equal(page.url(), outerUrl);
        assert.equal(await page.evaluate(() => performance.timeOrigin), outerOrigin);
        await frame.locator(".identity").waitFor({ state: "hidden" });
        assert.equal(await frame.locator(".references p").count(), 13);
        await page.waitForTimeout(1800);
        const during = await page.evaluate(playbackState);
        assert.equal(during.source, before.source);
        assert.equal(during.sameDocument, true);
        assert.equal(during.sameMedia, true);
        assert.ok(during.time > before.time);
        assert.equal(during.paused, false);
        assert.equal(during.muted, before.muted);
        assert.equal(during.volume, before.volume);
        assert.equal(during.pauses, 0);
        assert.equal(during.reloads, 0);
        if (returnLink === ".back-link") await page.screenshot({ path: `${output}/${label}-embedded.png` });
        await frame.locator(returnLink).click();
        await page.locator('[data-television-page-view][aria-hidden="true"]').waitFor();
        await page.locator('[data-sex-ed-shelf][aria-hidden="false"]').waitFor();
        await page.waitForTimeout(600);
        const after = await page.evaluate(playbackState);
        assert.equal(page.url(), outerUrl);
        assert.ok(after.time > during.time);
        assert.equal(after.sameMedia, true);
        assert.equal(after.paused, false);
        assert.equal(after.source, before.source);
        assert.equal(after.pauses, 0);
        assert.equal(after.reloads, 0);
        assert.equal(after.fullscreenCalls, 0);
        assert.equal(after.microphoneCalls, 0);
        cycles.push({ returnLink, during, after });
      }
      assert.deepEqual(errors, []);
      report.results.push({ label, viewport, before, cycles, pageErrors: errors });
    } catch (error) {
      await page.screenshot({ path: `${output}/${label}-failure.png` }).catch(() => {});
      console.error(await page.evaluate(() => ({ url: location.href, classes: document.body.className, shelf: document.querySelector('[data-sex-ed-shelf]')?.getAttribute('aria-hidden') })).catch(() => ({})));
      throw error;
    } finally {
      await page.evaluate(() => document.querySelectorAll("video,audio").forEach(media => media.pause())).catch(() => {});
      await context.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
  await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + "\n");
}
console.log(JSON.stringify(report, null, 2));
