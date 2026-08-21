import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const requestedTarget = process.env.IAM_FASHION_EMDR_TARGET || "";
const screenshotPath = process.env.IAM_FASHION_EMDR_SCREENSHOT || "";
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
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

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-emdr-gif-crossfader]", { state: "attached" });
  await page.waitForFunction(() => Boolean(window.IAMTelevisionRoom), null, { timeout: 60000 });
  await page.evaluate(() => {
    document.body.classList.add("television-room-open", "television-emdr-gif-active", "television-wallet-pointer-locked");
    const wallet = document.querySelector("[data-reaction-wallet]");
    wallet.dataset.walletView = "emdr";
    wallet.dataset.emdrControlsView = "gif";
    wallet.classList.add("is-reaction-wallet-open");
    document.querySelector("[data-wallet-categories]")?.setAttribute("aria-hidden", "true");
    document.querySelector('[data-wallet-panel="emdr"]')?.setAttribute("aria-hidden", "false");
  });
  await page.waitForTimeout(900);

  const inspect = () => page.evaluate(() => {
    const wallet = document.querySelector("[data-reaction-wallet]");
    const mixer = document.querySelector("[data-emdr-gif-mix-controls]");
    const selectors = [...document.querySelectorAll("[data-fashion-runway-selector]")];
    const gifSelector = mixer.querySelector("[data-fashion-runway-selector]");
    const crossfader = document.querySelector("[data-emdr-gif-crossfader]");
    const fashionEndpoint = mixer.querySelector('[data-video-mix-endpoint="fashion"]');
    const musicEndpoint = mixer.querySelector('[data-video-mix-endpoint="music"]');
    const crossfaderWrap = crossfader.closest("[data-video-tooltip]");
    const walletRect = wallet.getBoundingClientRect();
    const mixerRect = mixer.getBoundingClientRect();
    const selectorRect = gifSelector.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      walletWidth: walletRect.width,
      mixerWidth: mixerRect.width,
      gifSelectorWidth: selectorRect.width,
      selectorCount: selectors.length,
      mixerDisplay: getComputedStyle(mixer).display,
      crossfaderWidth: crossfader.getBoundingClientRect().width,
      crossfaderVisible: crossfader.getBoundingClientRect().height > 0,
      fashionEndpointSize: [fashionEndpoint.getBoundingClientRect().width, fashionEndpoint.getBoundingClientRect().height],
      musicEndpointSize: [musicEndpoint.getBoundingClientRect().width, musicEndpoint.getBoundingClientRect().height],
      fashionEndpointVisible: fashionEndpoint.getBoundingClientRect().width >= 44 && fashionEndpoint.getBoundingClientRect().height >= 44,
      musicEndpointVisible: musicEndpoint.getBoundingClientRect().width >= 44 && musicEndpoint.getBoundingClientRect().height >= 44,
      fashionAsset: fashionEndpoint.querySelector("img")?.getAttribute("src") || "",
      musicAsset: musicEndpoint.querySelector("img")?.getAttribute("src") || "",
      fashionTooltip: fashionEndpoint.dataset.videoTooltip,
      musicTooltip: musicEndpoint.dataset.videoTooltip,
      crossfaderTooltip: crossfaderWrap?.dataset.videoTooltip || "",
      withinViewport: walletRect.left >= 0 && walletRect.right <= window.innerWidth,
    };
  });

  const desktop = await inspect();
  assert.equal(desktop.selectorCount, 2);
  assert.equal(desktop.mixerDisplay, "flex");
  assert.ok(desktop.crossfaderVisible && desktop.crossfaderWidth > 80);
  assert.ok(desktop.fashionEndpointVisible && desktop.musicEndpointVisible);
  assert.match(desktop.fashionAsset, /wallet-fashion-reference\.png\?v=reference-2$/);
  assert.match(desktop.musicAsset, /wallet-turntable-reference\.png\?v=reference-2$/);
  assert.equal(desktop.fashionTooltip, "Watch a runway while the music continues uninterrupted.");
  assert.equal(desktop.musicTooltip, "Stay with the original music video, DJ set, or live performance.");
  assert.equal(desktop.crossfaderTooltip, "Dial in the balance between music and fashion.");
  assert.ok(desktop.withinViewport);

  await page.evaluate(() => document.querySelector("[data-reaction-wallet]")?.classList.add("is-video-tooltip-armed"));
  const tooltipTargets = [
    ['[data-emdr-gif-mix-controls] [data-video-mix-endpoint="fashion"]', '"Watch a runway while the music continues uninterrupted."'],
    ['[data-emdr-gif-mix-controls] .adaptive-television-video-crossfader-wrap', '"Dial in the balance between music and fashion."'],
    ['[data-emdr-gif-mix-controls] [data-video-mix-endpoint="music"]', '"Stay with the original music video, DJ set, or live performance."'],
  ];
  for (const [selector, expectedContent] of tooltipTargets) {
    await page.hover(selector);
    await page.waitForTimeout(320);
    const tooltip = await page.$eval(selector, (element) => {
      const style = getComputedStyle(element, "::after");
      return { content: style.content, opacity: style.opacity };
    });
    assert.equal(tooltip.content, expectedContent);
    assert.equal(tooltip.opacity, "1");
  }
  if (screenshotPath) await page.screenshot({ path: screenshotPath, fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await inspect();
  assert.equal(mobile.mixerDisplay, "grid");
  assert.ok(mobile.crossfaderVisible && mobile.crossfaderWidth > 160);
  assert.ok(mobile.fashionEndpointVisible && mobile.musicEndpointVisible);
  assert.ok(mobile.withinViewport);

  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotion = await page.evaluate(() => {
    const identity = document.createElement("span");
    identity.className = "adaptive-television-fashion-runway-identity adaptive-television-fashion-runway-identity--channel";
    document.querySelector("[data-fashion-runway-label]")?.append(identity);
    const computed = getComputedStyle(identity);
    const result = { animationName: computed.animationName, position: computed.position, opacity: computed.opacity };
    identity.remove();
    return result;
  });
  assert.equal(reducedMotion.animationName, "none");
  assert.equal(reducedMotion.position, "static");
  assert.equal(reducedMotion.opacity, "1");

  console.log(JSON.stringify({ target, mutedProcess: true, desktop, mobile, reducedMotion }, null, 2));
} finally {
  await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
