import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const requestedTarget = process.env.IAM_EMDR_CONTINUITY_TARGET || "";
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
  await page.waitForFunction(() => Boolean(window.IAMTelevisionRoom), null, { timeout: 60000 });
  await page.evaluate(() => {
    const state = {
      active: true,
      style: 7,
      intensity: 0.8,
      reactionEnabled: false,
      activeCalls: [],
    };
    window.__iamEmdrContinuityQa = state;
    window.IAMEMDR = {
      get active() { return state.active; },
      get style() { return state.style; },
      get intensity() { return state.intensity; },
      get reactionEnabled() { return state.reactionEnabled; },
      setActive(active) {
        state.active = Boolean(active);
        state.activeCalls.push(state.active);
        return state.active;
      },
      setStyle(value) { state.style = Number(value); return state.style; },
      setIntensity(value) { state.intensity = Number(value); return state.intensity; },
      setReactionEnabled(value) { state.reactionEnabled = Boolean(value); return state.reactionEnabled; },
      setTimelineSource() {},
      setAudioSource() {},
      getAudioLevel() { return 0; },
    };
    document.body.classList.add("television-room-open", "television-emdr-gif-active", "television-wallet-pointer-locked");
    const wallet = document.querySelector("[data-reaction-wallet]");
    wallet.classList.add("is-reaction-wallet-open");
    wallet.dataset.walletView = "categories";
    document.querySelector("[data-wallet-categories]")?.setAttribute("aria-hidden", "false");
  });

  const click = (selector) => page.$eval(selector, (element) => element.click());
  const inspect = () => page.evaluate(() => {
    const state = window.__iamEmdrContinuityQa;
    const wallet = document.querySelector("[data-reaction-wallet]");
    return {
      active: state.active,
      style: state.style,
      activeCalls: [...state.activeCalls],
      walletView: wallet.dataset.walletView,
      controlsView: wallet.dataset.emdrControlsView,
      gifPressed: document.querySelector('[data-emdr-style-index="0"]')?.getAttribute("aria-pressed"),
      stellarPressed: document.querySelector('[data-emdr-style-index="1"]')?.getAttribute("aria-pressed"),
      togglePressed: document.querySelector("[data-emdr-toggle]")?.getAttribute("aria-pressed"),
      toggleDisabled: Boolean(document.querySelector("[data-emdr-toggle]")?.disabled),
      toggleText: document.querySelector("[data-emdr-toggle]")?.textContent?.trim(),
      toggleVisible: Boolean(document.querySelector("[data-emdr-toggle]")?.getClientRects().length),
      toggleClipped: document.querySelector("[data-emdr-toggle]")?.scrollWidth > document.querySelector("[data-emdr-toggle]")?.clientWidth,
      gifPresentationActive: document.body.classList.contains("television-emdr-gif-active"),
    };
  });

  await click('[data-wallet-category="video"]');
  await click('[data-video-mode="emdr"]');
  const gifNavigation = await inspect();
  assert.equal(gifNavigation.active, true);
  assert.deepEqual(gifNavigation.activeCalls, []);
  assert.equal(gifNavigation.walletView, "emdr");
  assert.equal(gifNavigation.controlsView, "gif");
  assert.equal(gifNavigation.gifPressed, "true");
  assert.equal(gifNavigation.togglePressed, "true");
  assert.equal(gifNavigation.toggleDisabled, false);
  assert.equal(gifNavigation.toggleText, "on/off");
  assert.equal(gifNavigation.toggleVisible, true);
  assert.equal(gifNavigation.toggleClipped, false);
  assert.equal(gifNavigation.gifPresentationActive, true);

  await click('[data-wallet-panel="emdr"] [data-wallet-home]');
  await page.evaluate(() => {
    const state = window.__iamEmdrContinuityQa;
    state.active = true;
    state.style = 5;
    document.body.classList.remove("television-emdr-gif-active");
  });
  await click('[data-wallet-category="video"]');
  await click('[data-video-mode="emdr"]');
  const stellarNavigation = await inspect();
  assert.equal(stellarNavigation.active, true);
  assert.deepEqual(stellarNavigation.activeCalls, []);
  assert.equal(stellarNavigation.walletView, "emdr");
  assert.equal(stellarNavigation.controlsView, "stellar");
  assert.equal(stellarNavigation.stellarPressed, "true");
  assert.equal(stellarNavigation.togglePressed, "true");
  assert.equal(stellarNavigation.toggleText, "on/off");
  assert.equal(stellarNavigation.toggleVisible, true);
  assert.equal(stellarNavigation.toggleClipped, false);

  await click("[data-emdr-toggle]");
  const poweredOff = await inspect();
  assert.equal(poweredOff.active, false);
  assert.deepEqual(poweredOff.activeCalls, [false]);
  assert.equal(poweredOff.controlsView, "stellar");
  assert.equal(poweredOff.stellarPressed, "true");
  assert.equal(poweredOff.togglePressed, "false");
  assert.equal(poweredOff.toggleDisabled, false);
  assert.equal(poweredOff.toggleText, "on/off");

  await click("[data-emdr-toggle]");
  const poweredOn = await inspect();
  assert.equal(poweredOn.active, true);
  assert.deepEqual(poweredOn.activeCalls, [false, true]);
  assert.equal(poweredOn.controlsView, "stellar");
  assert.equal(poweredOn.stellarPressed, "true");
  assert.equal(poweredOn.togglePressed, "true");
  assert.equal(poweredOn.toggleText, "on/off");

  console.log(JSON.stringify({ target, mutedProcess: true, gifNavigation, stellarNavigation, poweredOff, poweredOn }, null, 2));
} finally {
  await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
