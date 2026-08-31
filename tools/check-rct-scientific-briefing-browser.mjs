import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const target = process.argv[2];
assert.ok(target, "Usage: node tools/check-rct-scientific-briefing-browser.mjs <research-page-url>");

const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const screenshotDir = process.env.RCT_SCREENSHOT_DIR || "";
if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });

const expectedVision = "modul8 infinity represents our underlying platform capability—exploring the frontier of real-time targeted gene expression and epigenetic modulation through prescription sound radiation, EMDR, and silent mantra.";
const oldVisionFragment = "prescription digital sound, visual bilateral stimulation, and neural entrainment";
const expectedPdfPath = "a s s e t s/research/modul8-infinity-rct-scientific-briefing-v1.pdf";
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

const chromiumServer = await chromium.launchServer({
  executablePath: chromiumExecutable,
  headless: true,
  args: ["--mute-audio"],
});
assert.ok(chromiumServer.process()?.spawnargs?.includes("--mute-audio"), "Chromium must be process-muted before navigation.");
const browser = await chromium.connect(chromiumServer.wsEndpoint());

const results = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    const response = await page.goto(target, { waitUntil: "networkidle", timeout: 45_000 });
    assert.equal(response?.status(), 200, `${viewport.name}: Research page must return HTTP 200`);
    await page.evaluate(() => {
      for (const media of document.querySelectorAll("audio, video")) media.pause();
    });

    const state = await page.evaluate(({ expectedVision, oldVisionFragment, expectedPdfPath }) => {
      const bodyText = document.body.innerText;
      const downloads = [...document.querySelectorAll("a[download]")]
        .filter((anchor) => anchor.textContent.includes("Download Scientific Briefing (PDF)"))
        .map((anchor) => {
          const rect = anchor.getBoundingClientRect();
          return {
            href: anchor.getAttribute("href"),
            text: anchor.textContent.trim().replace(/\s+/g, " "),
            visible: rect.width > 0 && rect.height > 0,
            width: rect.width,
            height: rect.height,
          };
        });
      const vision = document.querySelector(".research-identity div:last-child dd")?.textContent.trim();
      return {
        vision,
        hasExpectedVision: bodyText.includes(expectedVision),
        hasOldVision: bodyText.includes(oldVisionFragment),
        downloads,
        allDownloadTargetsCorrect: downloads.every((item) => item.href === expectedPdfPath),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        mediaCount: document.querySelectorAll("audio, video").length,
      };
    }, { expectedVision, oldVisionFragment, expectedPdfPath });

    assert.equal(state.vision, expectedVision, `${viewport.name}: exact Notion Vision Statement must render`);
    assert.equal(state.hasExpectedVision, true, `${viewport.name}: updated Vision Statement is absent`);
    assert.equal(state.hasOldVision, false, `${viewport.name}: superseded Vision Statement remains visible`);
    assert.equal(state.downloads.length, 2, `${viewport.name}: top and bottom PDF downloads must both render`);
    assert.equal(state.allDownloadTargetsCorrect, true, `${viewport.name}: PDF download target is incorrect`);
    assert.ok(state.downloads.every((item) => item.visible), `${viewport.name}: both PDF downloads must be visible`);
    assert.ok(state.downloads.every((item) => item.height >= 44), `${viewport.name}: PDF downloads must remain clear tap targets`);
    assert.equal(state.horizontalOverflow, false, `${viewport.name}: page has horizontal overflow`);
    assert.deepEqual(pageErrors, [], `${viewport.name}: page errors detected`);
    assert.deepEqual(consoleErrors, [], `${viewport.name}: console errors detected`);

    const pdfUrl = new URL(expectedPdfPath, target).href;
    const pdfResponse = await context.request.get(pdfUrl, { timeout: 45_000 });
    assert.equal(pdfResponse.status(), 200, `${viewport.name}: PDF must return HTTP 200`);
    assert.match(pdfResponse.headers()["content-type"] || "", /application\/pdf/i, `${viewport.name}: PDF content type must be application/pdf`);
    assert.ok((await pdfResponse.body()).byteLength > 250_000, `${viewport.name}: PDF response is unexpectedly small`);

    if (screenshotDir) {
      await page.screenshot({
        path: path.join(screenshotDir, `research-${viewport.name}.png`),
        fullPage: true,
      });
    }
    results.push({ viewport, state, pdfStatus: pdfResponse.status(), pageErrors, consoleErrors });
    await context.close();
  }
  console.log(JSON.stringify({ passed: true, chromiumProcessMuted: true, target, results }, null, 2));
} finally {
  await browser.close().catch(() => {});
  await chromiumServer.close().catch(() => {});
}
