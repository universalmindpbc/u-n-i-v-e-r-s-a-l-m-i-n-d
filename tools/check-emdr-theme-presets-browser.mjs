import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const requestedTarget = process.env.IAM_EMDR_THEME_TARGET || "";
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
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

const browser = await chromium.launch({
  executablePath: chromiumExecutable,
  headless: true,
  args: ["--mute-audio"],
});

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

async function runViewport(viewport) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(() => {
    window.__iamThemeSafety = { playCalls: 0, fullscreenCalls: 0, microphoneCalls: 0 };
    HTMLMediaElement.prototype.play = function mutedQaPlayback() {
      window.__iamThemeSafety.playCalls += 1;
      return Promise.resolve();
    };
    Element.prototype.requestFullscreen = function blockedQaFullscreen() {
      window.__iamThemeSafety.fullscreenCalls += 1;
      return Promise.reject(new Error("Fullscreen blocked by EMDR theme QA"));
    };
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia = () => {
        window.__iamThemeSafety.microphoneCalls += 1;
        return Promise.reject(new Error("Microphone blocked by EMDR theme QA"));
      };
    }
  });
  const page = await context.newPage();
  const pageErrors = [];
  let blockedMediaRequests = 0;
  await page.route("**/*", (route) => {
    if (route.request().resourceType() === "media") {
      blockedMediaRequests += 1;
      route.abort();
      return;
    }
    route.continue();
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.IAMTelevisionRoom && window.IAMEMDRGif), null, { timeout: 60000 });
  await page.evaluate(() => {
    const state = { active: false, style: 5, intensity: .8, reactionEnabled: false };
    const syncGif = () => window.IAMEMDRGif?.setActive?.(state.active && state.style === 7);
    window.IAMEMDR = {
      get active() { return state.active; },
      get style() { return state.style; },
      get intensity() { return state.intensity; },
      get reactionEnabled() { return state.reactionEnabled; },
      setActive(value) { state.active = Boolean(value); syncGif(); return state.active; },
      setStyle(value) { state.style = Number(value); syncGif(); return state.style; },
      setIntensity(value) { state.intensity = Number(value); return state.intensity; },
      setReactionEnabled(value) { state.reactionEnabled = Boolean(value); return state.reactionEnabled; },
      setTimelineSource() {},
      setAudioSource() {},
      getAudioLevel() { return 0; },
    };
    document.body.classList.add("television-room-open", "television-wallet-pointer-locked");
    const wallet = document.querySelector("[data-reaction-wallet]");
    wallet.classList.add("is-reaction-wallet-open");
    wallet.dataset.walletView = "categories";
    document.querySelector("[data-wallet-categories]")?.setAttribute("aria-hidden", "false");
  });

  const click = async (selector) => {
    await page.$eval(selector, (element) => element.click());
    await page.waitForTimeout(460);
  };
  await click('[data-wallet-category="video"]');
  await click('[data-video-mode="emdr"]');

  const snapshots = [];
  for (const preset of [
    { index: 0, key: "cb", label: "CB", controlsView: "gif", tileVideos: 0, tileImages: 6 },
    { index: 1, key: "m8", label: "M8", controlsView: "gif", tileVideos: 0, tileImages: 6 },
    { index: 2, key: "jbh", label: "JBH", controlsView: "gif", tileVideos: 4, tileImages: 2 },
    { index: 3, key: "stella", label: "Stella", controlsView: "stellar", tileVideos: 0, tileImages: 0 },
  ]) {
    await click(`[data-emdr-style-index="${preset.index}"]`);
    if (preset.key !== "stella") {
      try {
        await page.waitForFunction((key) => {
          const diagnostics = window.IAMEMDRGif?.diagnostics?.();
          const panel = document.querySelector(`.adaptive-television-emdr-gif-grid[data-emdr-gif-preset="${key}"]`);
          return diagnostics?.active && diagnostics?.preset === key && panel?.classList.contains("is-active");
        }, preset.key, { timeout: 20000 });
      } catch (error) {
        const diagnostics = await page.evaluate((key) => ({
          expected: key,
          gif: window.IAMEMDRGif?.diagnostics?.(),
          bodyPreset: document.body.dataset.emdrPreset,
          bodyGifPreset: document.body.dataset.emdrGifPreset,
          rootActive: document.querySelector("[data-emdr-gif-world]")?.classList.contains("is-active"),
          panels: [...document.querySelectorAll(".adaptive-television-emdr-gif-grid[data-emdr-gif-preset]")].map((panel) => ({
            key: panel.dataset.emdrGifPreset,
            active: panel.classList.contains("is-active"),
            ready: panel.dataset.emdrGifReady || "",
          })),
        }), preset.key);
        throw new Error(`${error.message}: ${JSON.stringify(diagnostics)}`);
      }
    }
    const snapshot = await page.evaluate((expected) => {
      const wallet = document.querySelector("[data-reaction-wallet]");
      const group = document.querySelector(".adaptive-television-emdr-style-group");
      const groupRect = group.getBoundingClientRect();
      const selectedPanel = document.querySelector(`.adaptive-television-emdr-gif-grid[data-emdr-gif-preset="${expected.key}"]`);
      return {
        key: expected.key,
        label: document.querySelector(`[data-emdr-style-index="${expected.index}"]`)?.textContent.trim(),
        pressed: document.querySelector(`[data-emdr-style-index="${expected.index}"]`)?.getAttribute("aria-pressed"),
        bodyPreset: document.body.dataset.emdrPreset,
        controlsView: wallet.dataset.emdrControlsView,
        gifActive: Boolean(window.IAMEMDRGif?.active),
        gifPreset: window.IAMEMDRGif?.preset,
        activePanel: selectedPanel?.classList.contains("is-active") || false,
        tileVideos: selectedPanel?.querySelectorAll("video").length || 0,
        tileImages: selectedPanel?.querySelectorAll("img").length || 0,
        buttonsVisible: [...group.querySelectorAll("button")].every((button) => Boolean(button.getClientRects().length)),
        groupContained: groupRect.left >= 0 && groupRect.right <= window.innerWidth,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    }, preset);
    assert.equal(snapshot.label, preset.label);
    assert.equal(snapshot.pressed, "true");
    assert.equal(snapshot.bodyPreset, preset.key);
    assert.equal(snapshot.controlsView, preset.controlsView);
    assert.equal(snapshot.gifActive, preset.key !== "stella");
    if (preset.key !== "stella") {
      assert.equal(snapshot.gifPreset, preset.key);
      assert.equal(snapshot.activePanel, true);
      assert.equal(snapshot.tileVideos, preset.tileVideos);
      assert.equal(snapshot.tileImages, preset.tileImages);
    }
    assert.equal(snapshot.buttonsVisible, true);
    assert.equal(snapshot.groupContained, true, JSON.stringify(snapshot));
    assert.equal(snapshot.horizontalOverflow, false, JSON.stringify(snapshot));
    snapshots.push(snapshot);
  }

  const safety = await page.evaluate(() => ({ ...window.__iamThemeSafety }));
  assert.equal(safety.fullscreenCalls, 0);
  assert.equal(safety.microphoneCalls, 0);
  assert.deepEqual(pageErrors, []);
  await page.evaluate(() => document.querySelectorAll("audio, video").forEach((media) => media.pause()));
  await context.close();
  return { viewport, snapshots, safety, blockedMediaRequests, pageErrors };
}

try {
  const matrix = [];
  for (const viewport of viewports) matrix.push(await runViewport(viewport));

  const libraryContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const libraryPage = await libraryContext.newPage();
  const libraryUrl = new URL("emdr-modul8-gif-library.html", target).href;
  await libraryPage.goto(libraryUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  const librarySnapshot = await libraryPage.evaluate(() => ({
    figures: document.querySelectorAll("figure").length,
    leadSet: document.querySelectorAll('figure[data-current-m8="true"]').length,
    title: document.querySelector("h1")?.textContent.trim(),
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
  assert.deepEqual(librarySnapshot, {
    figures: 33,
    leadSet: 6,
    title: "GIF source library",
    horizontalOverflow: false,
  });
  await libraryContext.close();

  console.log(JSON.stringify({ target, mutedProcess: true, matrix, library: librarySnapshot }, null, 2));
} finally {
  await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
