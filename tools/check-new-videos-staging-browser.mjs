import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "cloudflare-stream-new-videos-20260827-manifest.json"), "utf8"));
const baseUrl = process.env.IAM_BROWSER_BASE_URL || "https://staging.universalmind.tv/vogue/iam/";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";

assert.equal(manifest.readyToStreamCount, 21);
assert.equal(Object.keys(manifest.files || {}).length, 21);

const chromiumServer = await chromium.launchServer({
  executablePath,
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const browserProcess = chromiumServer.process();
assert.ok(browserProcess?.spawnargs?.includes("--mute-audio"), "Chromium must be process-muted before any Stream playback begins.");
const browser = await chromium.connect(chromiumServer.wsEndpoint());

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}index.html`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForFunction(() => Boolean(window.IAMStreamController?.attach && window.IAMStreamReady), null, { timeout: 30_000 });
  const results = [];

  for (const [id, record] of Object.entries(manifest.files)) {
    const result = await page.evaluate(async ({ fileName, uid }) => {
      const video = document.createElement("video");
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.playsInline = true;
      video.preload = "auto";
      video.dataset.streamFile = fileName;
      video.dataset.streamRole = "music";
      video.dataset.streamPriority = "primary";
      video.style.cssText = "position:fixed;width:2px;height:2px;opacity:0;pointer-events:none";
      document.body.append(video);
      const startedAt = performance.now();
      try {
        await window.IAMStreamReady;
        await window.IAMStreamController.attach(video, {
          fileName,
          role: "music",
          autoplay: false,
          preload: true,
          preloadTargetSeconds: 2,
        });
        await (window.IAMStreamController.play?.(video) || video.play());
        while (performance.now() - startedAt < 30_000) {
          if (!video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime > .35) break;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return {
          expectedUid: uid,
          actualUid: video.dataset.streamUid || "",
          readyState: video.readyState,
          currentTime: video.currentTime,
          paused: video.paused,
          networkState: video.networkState,
          error: video.error?.message || video.dataset.streamError || "",
        };
      } finally {
        try { video.pause(); } catch {}
        window.IAMStreamController.detach?.(video);
        video.remove();
      }
    }, { fileName: record.fileName, uid: record.uid });

    assert.equal(result.actualUid, record.uid, `${id} did not attach its exact Stream UID.`);
    assert.ok(result.readyState >= 2, `${id} never reached HAVE_CURRENT_DATA.`);
    assert.ok(result.currentTime > .35, `${id} did not advance under process-muted playback.`);
    assert.equal(result.paused, false, `${id} was unexpectedly paused during the playback observation.`);
    assert.equal(result.error, "", `${id} reported a media error: ${result.error}`);
    results.push({ id, uid: record.uid, secondsAdvanced: Number(result.currentTime.toFixed(3)) });
  }

  await context.close();
  console.log(JSON.stringify({
    passed: true,
    chromiumProcessMuted: true,
    genericEntryUrl: `${baseUrl}index.html`,
    verifiedCount: results.length,
    results,
  }, null, 2));
} finally {
  await browser.close().catch(() => {});
  await chromiumServer.close().catch(() => {});
}
