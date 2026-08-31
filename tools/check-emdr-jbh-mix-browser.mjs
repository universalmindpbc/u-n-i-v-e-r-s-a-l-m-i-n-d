import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const requestedTarget = process.env.IAM_EMDR_MIX_TARGET || "";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
]);

let server = null;
let target = requestedTarget;
if (!target) {
  server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url || "/", "http://127.0.0.1").pathname);
      const relative = pathname.replace(/^\/vogue\/iam\/?/, "") || "index.html";
      const requestedPath = path.resolve(iam, relative);
      if (!requestedPath.startsWith(`${iam}${path.sep}`) && requestedPath !== iam) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const bytes = await fs.readFile(requestedPath);
      response.writeHead(200, { "content-type": contentTypes.get(path.extname(requestedPath).toLowerCase()) || "application/octet-stream" });
      response.end(bytes);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  target = `http://127.0.0.1:${server.address().port}/vogue/iam/index.html`;
}

const chromiumServer = await chromium.launchServer({
  executablePath,
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
assert.ok(chromiumServer.process()?.spawnargs?.includes("--mute-audio"), "Chromium must be process-muted before EMDR media loads.");
const browser = await chromium.connect(chromiumServer.wsEndpoint());

try {
  const context = await browser.newContext({ viewport: { width: 1952, height: 1269 } });
  await context.route("**/*", async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (["127.0.0.1", "localhost", "staging.universalmind.tv"].includes(hostname)) return route.fallback();
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.IAMTelevisionRoom && window.IAMEMDR), null, { timeout: 60000 });
  await page.evaluate(() => {
    window.IAMStreamController = {
      async attach() { return true; },
      async play(video) {
        Object.defineProperty(video, "paused", { configurable: true, get: () => false });
        Object.defineProperty(video, "readyState", { configurable: true, get: () => 4 });
        return true;
      },
      release() {},
      setPriority() {},
    };
    window.IAMTelevisionRoom.preparePresentationEntry();
    const programme = document.querySelector(".adaptive-television-local-video-frame video");
    Object.defineProperty(programme, "paused", { configurable: true, get: () => false });
    Object.defineProperty(programme, "readyState", { configurable: true, get: () => 4 });
    programme.muted = false;
    programme.volume = .12;
    window.dispatchEvent(new CustomEvent("iam:emdr-gif-presentation", { detail: { active: true, preset: "jbh-ii" } }));
  });
  await page.waitForFunction(() => document.body.classList.contains("television-emdr-jbh-editorial-active"));
  await page.waitForTimeout(520);
  const activeState = await page.evaluate(() => ({
    mix: document.body.dataset.emdrJbhProgrammeMixLevel,
    programmeVolume: document.querySelector(".adaptive-television-local-video-frame video")?.volume,
  }));
  assert.equal(activeState.mix, "0.36");
  assert.ok(Math.abs(activeState.programmeVolume - .36) < .01, `Expected JBH programme music at .36, received ${activeState.programmeVolume}.`);

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("iam:emdr-gif-presentation", { detail: { active: false, preset: "jbh-ii" } }));
  });
  await page.waitForFunction(() => !document.body.classList.contains("television-emdr-jbh-editorial-active"));
  await page.waitForTimeout(520);
  const restoredVolume = await page.locator(".adaptive-television-local-video-frame video").evaluate((video) => video.volume);
  assert.ok(Math.abs(restoredVolume - 1) < .01, `Expected the normal programme volume to restore to 1, received ${restoredVolume}.`);

  const stellarWallet = await page.evaluate(() => {
    const wallet = document.querySelector("[data-reaction-wallet]");
    const controls = wallet.querySelector(".adaptive-television-emdr-controls");
    wallet.dataset.walletView = "emdr";
    wallet.dataset.emdrControlsView = "stellar";
    wallet.classList.add("is-reaction-wallet-open");
    const walletRect = wallet.getBoundingClientRect();
    const buttonRects = [...controls.querySelectorAll(":scope > button:not([hidden]), .adaptive-television-emdr-style-group > button:not([hidden])")]
      .map((button) => button.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    return {
      width: walletRect.width,
      flexWrap: getComputedStyle(controls).flexWrap,
      buttonRows: [...new Set(buttonRects.map((rect) => Math.round(rect.y)))],
      buttonYSpread: Math.max(...buttonRects.map((rect) => rect.y)) - Math.min(...buttonRects.map((rect) => rect.y)),
      overflow: wallet.scrollWidth - wallet.clientWidth,
    };
  });
  assert.ok(stellarWallet.width >= 1400, `Expected the Stella wallet to widen, received ${stellarWallet.width}px.`);
  assert.equal(stellarWallet.flexWrap, "nowrap");
  assert.ok(stellarWallet.buttonYSpread < 10, `Expected a single clean Stella control row: ${JSON.stringify(stellarWallet)}.`);
  assert.ok(stellarWallet.overflow <= 1, `The Stella wallet overflows by ${stellarWallet.overflow}px.`);

  console.log(JSON.stringify({ passed: true, chromiumProcessMuted: true, target, activeState, restoredVolume, stellarWallet }, null, 2));
  await context.close();
} finally {
  await browser.close().catch(() => {});
  await chromiumServer.close().catch(() => {});
  if (server) await new Promise((resolve) => server.close(resolve));
}
