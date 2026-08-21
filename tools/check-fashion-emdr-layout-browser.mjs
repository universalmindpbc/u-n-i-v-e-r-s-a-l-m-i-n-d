import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const requestedTarget = process.env.IAM_FASHION_EMDR_TARGET || "";
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
  await page.evaluate(() => {
    document.body.classList.add("television-room-open", "television-emdr-gif-active");
    const wallet = document.querySelector("[data-reaction-wallet]");
    wallet.dataset.walletView = "emdr";
    wallet.dataset.emdrControlsView = "gif";
    wallet.classList.add("is-reaction-wallet-open");
    document.querySelector('[data-wallet-panel="emdr"]')?.setAttribute("aria-hidden", "false");
  });

  const inspect = () => page.evaluate(() => {
    const wallet = document.querySelector("[data-reaction-wallet]");
    const mixer = document.querySelector("[data-emdr-gif-mix-controls]");
    const selectors = [...document.querySelectorAll("[data-fashion-runway-selector]")];
    const gifSelector = mixer.querySelector("[data-fashion-runway-selector]");
    const crossfader = document.querySelector("[data-emdr-gif-crossfader]");
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
      withinViewport: walletRect.left >= 0 && walletRect.right <= window.innerWidth,
    };
  });

  const desktop = await inspect();
  assert.equal(desktop.selectorCount, 2);
  assert.equal(desktop.mixerDisplay, "flex");
  assert.ok(desktop.crossfaderVisible && desktop.crossfaderWidth > 80);
  assert.ok(desktop.withinViewport);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await inspect();
  assert.equal(mobile.mixerDisplay, "grid");
  assert.ok(mobile.crossfaderVisible && mobile.crossfaderWidth > 160);
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
