import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const target = process.argv[2];
assert.ok(target, "Usage: node tools/check-rct-scientific-briefing-browser.mjs <research-page-url>");

const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const screenshotDir = process.env.RCT_SCREENSHOT_DIR || "";
if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });

const expectedVision = "modul8 infinity represents our underlying platform capability—exploring the frontier of real-time targeted gene expression and epigenetic modulation through prescription sound radiation, EMDR, and silent mantra, together as one — paired with pioneering hyperspectral computer vision research toward contact-free, non-invasive inference of gene expression in real time.";
const expectedContact = "Universal Mind bk@universalmind.tv universalmind.tv Universal Mind TV, PBC (A Delaware Public Benefit Corporation) ABN: 15 885 248 650";
const oldVisionFragment = "prescription sound radiation, EMDR, and silent mantra.";
const expectedPdfPath = "a s s e t s/research/modul8-infinity-rct-scientific-briefing-v1.pdf?v=rct-optical-20260910";
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
const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "rct-pdf-downloads-"));

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
    const opticalPanel = page.locator(".research-subsection--optical");
    const opticalCopy = (await opticalPanel.innerText()).replace(/\s+/g, " ");
    assert.ok(opticalCopy.includes("Synchronized alignment of facial region-of-interest (ROI) blood flow dynamics—captured via research grade hyperspectral cameras during the 10-minute intervention—against scRNA-seq ground truth."), `${viewport.name}: exact Notion camera wording must render`);
    assert.ok(opticalCopy.includes("To train downstream machine learning algorithms capable of detecting acute OXTR transcriptional shifts through contact-free facial optical analysis."), `${viewport.name}: OXTR spacing must render correctly`);
    if (screenshotDir) {
      await opticalPanel.screenshot({ path: path.join(screenshotDir, `research-optical-${viewport.name}.png`) });
    }
    const contactPanel = page.locator(".research-panel--contact");
    await contactPanel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);

    const state = await page.evaluate(({ expectedVision, expectedContact, oldVisionFragment, expectedPdfPath }) => {
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
      const contactElement = document.querySelector(".research-contact");
      const contact = contactElement?.textContent.trim().replace(/\s+/g, " ");
      const contactRect = contactElement?.getBoundingClientRect();
      return {
        vision,
        contact,
        contactVisible: Boolean(contactRect && contactRect.width > 0 && contactRect.height > 0),
        hasExpectedVision: bodyText.includes(expectedVision),
        hasOldVision: bodyText.includes(oldVisionFragment),
        downloads,
        allDownloadTargetsCorrect: downloads.every((item) => item.href === expectedPdfPath),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        mediaCount: document.querySelectorAll("audio, video").length,
      };
    }, { expectedVision, expectedContact, oldVisionFragment, expectedPdfPath });

    assert.equal(state.vision, expectedVision, `${viewport.name}: exact Notion Vision Statement must render`);
    assert.equal(state.hasExpectedVision, true, `${viewport.name}: updated Vision Statement is absent`);
    assert.equal(state.hasOldVision, false, `${viewport.name}: superseded Vision Statement remains visible`);
    assert.equal(state.contact, expectedContact, `${viewport.name}: exact contact block must render once`);
    assert.equal(state.contactVisible, true, `${viewport.name}: contact block must be visibly laid out`);
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
    const servedPdf = await pdfResponse.body();
    const localPdf = fs.readFileSync(new URL(`../i  a m/${expectedPdfPath.split("?")[0]}`, import.meta.url));
    assert.ok(servedPdf.equals(localPdf), `${viewport.name}: served PDF must match the exact committed artifact`);
    const downloadButtons = page.getByRole("link", { name: "Download Scientific Briefing (PDF)" });
    for (let index = 0; index < 2; index++) {
      const downloadEvent = page.waitForEvent("download");
      await downloadButtons.nth(index).click();
      const download = await downloadEvent;
      assert.equal(await download.failure(), null, `${viewport.name}: PDF download ${index + 1} failed`);
      const downloadedPath = path.join(downloadDir, `${viewport.name}-${index + 1}.pdf`);
      await download.saveAs(downloadedPath);
      assert.ok(fs.readFileSync(downloadedPath).equals(localPdf), `${viewport.name}: PDF download ${index + 1} must contain the corrected artifact`);
    }

    if (screenshotDir) {
      await contactPanel.screenshot({
        path: path.join(screenshotDir, `research-contact-${viewport.name}.png`),
      });
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
  fs.rmSync(downloadDir, { recursive: true, force: true });
}
