import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const requestedTarget = process.env.IAM_JBH_STREAM_TARGET || "";
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
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
  executablePath: chromiumExecutable,
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
assert.ok(chromiumServer.process()?.spawnargs?.includes("--mute-audio"), "Chromium must be process-muted before navigation.");
const browser = await chromium.connect(chromiumServer.wsEndpoint());

try {
  const context = await browser.newContext({ viewport: { width: 1952, height: 1269 } });
  await context.route("**/*", async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if ([
      "127.0.0.1",
      "localhost",
      "staging.universalmind.tv",
      "customer-1vpwglz3v6fiyaas.cloudflarestream.com",
      "cdn.jsdelivr.net",
    ].includes(hostname)) return route.fallback();
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.IAMTelevisionRoom && window.IAMStreamReady), null, { timeout: 60000 });
  await page.evaluate(async () => {
    await window.IAMStreamReady;
    window.IAMTelevisionRoom.preparePresentationEntry();
    window.dispatchEvent(new CustomEvent("iam:emdr-gif-presentation", { detail: { active: true, preset: "jbh-ii" } }));
  });
  await page.waitForFunction(() => (
    document.body.dataset.emdrJbhEditorialState === "ready" &&
    document.body.dataset.emdrJbhForegroundRenderer === "canvas" &&
    document.querySelector("[data-emdr-jbh-foreground-canvas]")?.dataset.jbhForegroundMirror === "ready"
  ), null, { timeout: 90000 });
  const before = await page.evaluate(() => Number(document.querySelector("[data-emdr-jbh-foreground]")?.currentTime || 0));
  await page.waitForTimeout(1800);
  const state = await page.evaluate(() => {
    const foreground = document.querySelector("[data-emdr-jbh-foreground]");
    const background = document.querySelector("[data-emdr-jbh-background]");
    const canvas = document.querySelector("[data-emdr-jbh-foreground-canvas]");
    return {
      editorialState: document.body.dataset.emdrJbhEditorialState,
      renderer: document.body.dataset.emdrJbhForegroundRenderer,
      mirror: canvas?.dataset.jbhForegroundMirror,
      mirrorError: canvas?.dataset.jbhForegroundError || "",
      canvasWidth: canvas?.width,
      canvasHeight: canvas?.height,
      canvasOpacity: getComputedStyle(canvas).opacity,
      foregroundOpacity: getComputedStyle(foreground).opacity,
      foregroundClipPath: getComputedStyle(foreground).clipPath,
      foregroundFile: foreground?.dataset.streamFile,
      foregroundMuted: foreground?.muted,
      foregroundVolume: foreground?.volume,
      foregroundCurrentTime: Number(foreground?.currentTime || 0),
      foregroundReadyState: foreground?.readyState,
      foregroundVideoWidth: foreground?.videoWidth,
      foregroundVideoHeight: foreground?.videoHeight,
      backgroundFile: background?.dataset.streamFile,
      backgroundMuted: background?.muted,
      backgroundVolume: background?.volume,
      backgroundCurrentTime: Number(background?.currentTime || 0),
      backgroundReadyState: background?.readyState,
    };
  });
  assert.equal(state.editorialState, "ready");
  assert.equal(state.renderer, "canvas");
  assert.equal(state.mirror, "ready");
  assert.equal(state.mirrorError, "");
  assert.ok(state.canvasWidth > 0 && state.canvasHeight > 0);
  assert.equal(state.canvasOpacity, "1");
  assert.equal(state.foregroundOpacity, "0");
  assert.equal(state.foregroundClipPath, "inset(50%)");
  assert.equal(state.foregroundFile, "Pirelli 2010 Calendar.mp4");
  assert.equal(state.foregroundMuted, true);
  assert.equal(state.foregroundVolume, 0);
  assert.ok(state.foregroundCurrentTime - before > .4, `Expected foreground playback to advance; delta=${state.foregroundCurrentTime - before}.`);
  assert.ok(state.foregroundReadyState >= 2);
  assert.ok(state.foregroundVideoWidth > 0 && state.foregroundVideoHeight > 0);
  assert.equal(state.backgroundFile, "Shashi Solluna - How I Healed my Sexual Pain using Nature +12dB.mp4");
  assert.equal(state.backgroundMuted, false);
  assert.equal(state.backgroundVolume, 1);
  assert.ok(state.backgroundCurrentTime > 0);
  assert.ok(state.backgroundReadyState >= 2);
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("iam:emdr-gif-presentation", { detail: { active: false, preset: "jbh-ii" } }));
  });
  await context.close();
  console.log(JSON.stringify({ target, mutedProcess: true, before, state }, null, 2));
} finally {
  await browser.close();
  await chromiumServer.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
