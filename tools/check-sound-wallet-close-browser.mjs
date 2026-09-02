import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const target = "https://staging.universalmind.tv/vogue/iam/index.html";
const localAssets = process.env.IAM_WALLET_LOCAL_ASSETS === "1";
const width = Number(process.env.IAM_WALLET_WIDTH || 1470);
const height = Number(process.env.IAM_WALLET_HEIGHT || 835);
const screenshot = process.env.IAM_WALLET_SCREENSHOT;
const server = await chromium.launchServer({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--mute-audio"],
});
assert.ok(server.process().spawnargs.includes("--mute-audio"), "Browser must be process-muted before navigation");
const browser = await chromium.connect(server.wsEndpoint());
const page = await browser.newPage({ viewport: { width, height } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.addInitScript(() => {
  window.__walletQASafety = { fullscreen: 0, microphone: 0 };
  const blockFullscreen = () => {
    window.__walletQASafety.fullscreen += 1;
    return Promise.reject(new Error("Native fullscreen disabled during wallet QA"));
  };
  Element.prototype.requestFullscreen = blockFullscreen;
  Element.prototype.webkitRequestFullscreen = blockFullscreen;
  HTMLVideoElement.prototype.webkitEnterFullscreen = blockFullscreen;
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => {
    window.__walletQASafety.microphone += 1;
    return Promise.reject(new Error("Microphone disabled during wallet QA"));
  };
});
if (localAssets) {
  for (const asset of ["adaptive-environment-television.css", "adaptive-sound/controller-v1.js"]) {
    const body = await fs.readFile(fileURLToPath(new URL(`../i  a m/${asset}`, import.meta.url)));
    await page.route(`**/vogue/iam/${asset}?*`, (route) => route.fulfill({
      status: 200, contentType: asset.endsWith(".css") ? "text/css" : "application/javascript", body,
    }));
  }
}

async function closedWallet(label) {
  await page.waitForFunction(() => {
    const wallet = document.querySelector("[data-reaction-wallet]");
    return document.body.dataset.adaptiveSoundPanelOpen === "false" &&
      wallet.dataset.walletView === "closed" && parseFloat(getComputedStyle(wallet).width) <= 68;
  });
  const state = await page.evaluate(() => {
    const wallet = document.querySelector("[data-reaction-wallet]");
    const flower = wallet.querySelector("[data-reaction-wallet-trigger]");
    return {
      view: wallet.dataset.walletView,
      width: parseFloat(getComputedStyle(wallet).width),
      background: getComputedStyle(wallet).backgroundColor,
      flowerOpacity: getComputedStyle(flower).opacity,
      focusOnFlower: document.activeElement === flower,
      visiblePanels: wallet.querySelectorAll('[data-wallet-panel][aria-hidden="false"]').length,
      mediaTime: document.querySelector(".adaptive-television-local-video")?.currentTime,
      mediaPaused: document.querySelector(".adaptive-television-local-video")?.paused,
    };
  });
  assert.equal(state.view, "closed", label);
  assert.ok(state.width <= 68, `${label}: empty glass shell remains`);
  assert.match(state.background, /, 0\)$/, `${label}: glass background remains`);
  assert.equal(state.flowerOpacity, "1", `${label}: closed flower is hidden`);
  assert.equal(state.focusOnFlower, true, `${label}: focus returned to hidden Sound control`);
  assert.equal(state.visiblePanels, 0, label);
  assert.equal(state.mediaPaused, false, `${label}: closing Sound stopped the music`);
  console.log(`PASS ${label}`, JSON.stringify(state));
  return state;
}

try {
  console.log(JSON.stringify({ browser: browser.version(), localAssets, width, height, processMuted: true }));
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.IAMTelevisionRoom && window.IAMAdaptiveSound);
  assert.equal(await page.locator("body").getAttribute("data-adaptive-selection-source"), "no_checkin_random");
  await page.evaluate(() => window.IAMTelevisionRoom.preparePresentationEntry());
  await page.locator("[data-reaction-wallet]").hover();
  await page.locator('[data-wallet-category="video"]').click();
  await page.locator(".adaptive-television-local-video").evaluate((video) => {
    window.IAMStreamController.play(video).catch(() => {});
  });
  await page.waitForFunction(() => document.querySelector(".adaptive-television-local-video")?.currentTime > 0.2);
  const start = await page.locator(".adaptive-television-local-video").evaluate((video) => video.currentTime);

  await page.locator("[data-video-sound-open]").click();
  await page.locator(".iam-sound-console__close").click();
  const first = await closedWallet("Sound close button");
  assert.ok(first.mediaTime > start, "Video must continue through Sound open and close");
  if (screenshot) await page.screenshot({ path: screenshot });

  // Keyboard activation must restore the remembered wallet view with controls.
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector('[data-wallet-panel="video"]')?.getAttribute("aria-hidden") === "false");
  // Restored secondary panels retain the existing 450 ms click-through guard.
  await page.waitForTimeout(600);
  await page.locator("[data-video-sound-open]").focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.body.dataset.adaptiveSoundPanelOpen === "true");
  await page.keyboard.press("Escape");
  await closedWallet("Keyboard Escape and reopen");

  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  await page.locator('[data-video-mode="emdr"]').click();
  await page.waitForFunction(() => document.querySelector("[data-reaction-wallet]")?.dataset.walletView === "emdr");
  console.log("PASS EMDR wallet remains available after Sound close and reopen");

  assert.deepEqual(await page.evaluate(() => window.__walletQASafety), { fullscreen: 0, microphone: 0 });
  assert.deepEqual(errors, [], "No page errors during wallet journey");
  console.log("PASS Sound wallet close regression, playback continuity, and browser safety");
} finally {
  await page.evaluate(() => document.querySelectorAll("video,audio").forEach((media) => media.pause())).catch(() => {});
  await browser.close();
  await server.close();
}
