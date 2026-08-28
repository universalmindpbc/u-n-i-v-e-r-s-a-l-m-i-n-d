import assert from "node:assert/strict";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const target = process.env.IAM_EMDR_PROGRAMME_TARGET || "https://staging.universalmind.tv/vogue/iam/index.html";
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const expectedProgrammePattern = process.env.IAM_EMDR_PROGRAMME_EXPECT
  ? new RegExp(process.env.IAM_EMDR_PROGRAMME_EXPECT, "i")
  : null;
const expectedCardPattern = process.env.IAM_EMDR_PROGRAMME_CARD_EXPECT
  ? new RegExp(process.env.IAM_EMDR_PROGRAMME_CARD_EXPECT, "i")
  : null;

const browser = await chromium.launch({
  executablePath: chromiumExecutable,
  headless: true,
  args: ["--mute-audio"],
});

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  window.__iamEmdrProgrammeQa = { fullscreenCalls: 0, microphoneCalls: 0, videoFrameRequests: 0 };
  const suppressFullscreen = () => {
    window.__iamEmdrProgrammeQa.fullscreenCalls += 1;
    return Promise.reject(new DOMException("Fullscreen disabled by muted EMDR programme QA", "NotAllowedError"));
  };
  Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: suppressFullscreen });
  Object.defineProperty(Element.prototype, "webkitRequestFullscreen", { configurable: true, value: suppressFullscreen });
  if (globalThis.HTMLVideoElement) {
    Object.defineProperty(HTMLVideoElement.prototype, "webkitEnterFullscreen", { configurable: true, value: suppressFullscreen });
    const requestVideoFrameCallback = HTMLVideoElement.prototype.requestVideoFrameCallback;
    if (requestVideoFrameCallback) {
      Object.defineProperty(HTMLVideoElement.prototype, "requestVideoFrameCallback", {
        configurable: true,
        value(callback) {
          this.dataset.qaVideoFrameRequests = String(Number(this.dataset.qaVideoFrameRequests || 0) + 1);
          window.__iamEmdrProgrammeQa.videoFrameRequests += 1;
          return requestVideoFrameCallback.call(this, callback);
        },
      });
    }
  }
  if (navigator.mediaDevices?.getUserMedia) {
    navigator.mediaDevices.getUserMedia = () => {
      window.__iamEmdrProgrammeQa.microphoneCalls += 1;
      return Promise.reject(new DOMException("Microphone disabled by EMDR programme QA", "NotAllowedError"));
    };
  }
});

const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(String(error)));

try {
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.IAMMusicChannels && window.IAMBroadcastClock && window.IAMEMDRGif), null, { timeout: 60000 });
  await page.locator("[data-television-play]").click({ timeout: 30000 });
  await page.waitForFunction(() => (
    document.body.classList.contains("television-room-open") &&
    Boolean(document.querySelector(".adaptive-television-local-video"))
  ), null, { timeout: 30000 });

  await page.evaluate(() => {
    window.IAMEMDRGif.setPreset("cb");
    window.IAMEMDRGif.setActive(true);
    const crossfader = document.querySelector("[data-emdr-gif-crossfader]");
    crossfader.value = "100";
    crossfader.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForFunction(() => (
    document.body.classList.contains("television-emdr-gif-active") &&
    document.querySelector("[data-television-player]")?.dataset.emdrGifMusicAmount === "100" &&
    document.querySelector(".adaptive-television-fashion-hero-frame")?.dataset.fashionHeroMirror === "ready"
  ), null, { timeout: 30000 });

  await page.locator("[data-program-open]").last().evaluate((button) => button.click());
  await page.waitForFunction(() => document.body.classList.contains("television-program-open"), null, { timeout: 20000 });
  await page.locator('[data-program-mode="parties"]').first().evaluate((button) => button.click());
  const innerPlanesCard = page.locator('.program-channel-card[data-room="inner-planes"]');
  await innerPlanesCard.waitFor({ state: "visible", timeout: 20000 });
  const cardLabel = await innerPlanesCard.getAttribute("aria-label") || "";
  if (expectedCardPattern) {
    assert.match(cardLabel, expectedCardPattern, `Inner Planes did not expose the expected programme: ${cardLabel}`);
  }

  const before = await page.evaluate(() => {
    const video = document.querySelector(".adaptive-television-local-video:not([data-stream-standby])");
    const frame = document.querySelector(".adaptive-television-fashion-hero-frame");
    video.dataset.qaHandoffRole = "outgoing";
    return {
      trackId: video.dataset.musicTrackId || "",
      currentTime: Number(video.currentTime || 0),
      frameDrawCount: Number(frame?.dataset.fashionHeroDrawCount || 0),
      frameMediaTime: Number(frame?.dataset.fashionHeroMediaTime || 0),
    };
  });

  await innerPlanesCard.evaluate((button) => button.click());
  await page.locator("[data-enter-live]").evaluate((button) => button.click());
  await page.waitForFunction(() => document.body.dataset.programLiveState === "joined", null, { timeout: 90000 });
  await page.waitForFunction((outgoingTrackId) => {
    const video = document.querySelector(".adaptive-television-local-video:not([data-stream-standby])");
    const trackId = window.IAMMusicChannels?.getState?.().broadcast?.trackId || "";
    return Boolean(trackId && trackId !== outgoingTrackId && video?.dataset.musicTrackId === trackId && !video.paused && video.readyState >= 2);
  }, before.trackId, { timeout: 30000 });

  const afterStart = await page.evaluate(() => {
    const video = document.querySelector(".adaptive-television-local-video:not([data-stream-standby])");
    const frame = document.querySelector(".adaptive-television-fashion-hero-frame");
    return {
      trackId: video.dataset.musicTrackId || "",
      currentTime: Number(video.currentTime || 0),
      paused: video.paused,
      readyState: video.readyState,
      frameDrawCount: Number(frame?.dataset.fashionHeroDrawCount || 0),
      frameMediaTime: Number(frame?.dataset.fashionHeroMediaTime || 0),
      videoFrameRequests: Number(video.dataset.qaVideoFrameRequests || 0),
      frameState: frame?.dataset.fashionHeroMirror || "",
      emdrActive: document.body.classList.contains("television-emdr-gif-active"),
      gifPreset: window.IAMEMDRGif?.preset || "",
      programmeState: document.body.dataset.programLiveState || "",
      safety: { ...window.__iamEmdrProgrammeQa },
    };
  });
  await page.waitForTimeout(1800);
  const afterAdvance = await page.evaluate(() => {
    const video = document.querySelector(".adaptive-television-local-video:not([data-stream-standby])");
    const frame = document.querySelector(".adaptive-television-fashion-hero-frame");
    return {
      currentTime: Number(video.currentTime || 0),
      frameDrawCount: Number(frame?.dataset.fashionHeroDrawCount || 0),
      frameMediaTime: Number(frame?.dataset.fashionHeroMediaTime || 0),
      videoFrameRequests: Number(video.dataset.qaVideoFrameRequests || 0),
      frameState: frame?.dataset.fashionHeroMirror || "",
    };
  });

  if (expectedProgrammePattern) {
    assert.match(afterStart.trackId, expectedProgrammePattern, JSON.stringify({ cardLabel, before, afterStart, afterAdvance }));
  }
  assert.equal(afterStart.emdrActive, true);
  assert.equal(afterStart.gifPreset, "cb");
  assert.equal(afterStart.programmeState, "joined");
  assert.equal(afterStart.paused, false);
  assert.ok(afterStart.readyState >= 2);
  assert.equal(afterStart.frameState, "ready");
  assert.ok(afterStart.videoFrameRequests > 0, "The incoming programme video never became the EMDR foreground frame source");
  assert.ok(afterAdvance.currentTime > afterStart.currentTime + .25, "The incoming programme video did not advance");
  assert.ok(afterAdvance.frameDrawCount > afterStart.frameDrawCount, "The small EMDR foreground did not redraw after the programme handoff");
  assert.ok(afterAdvance.frameMediaTime > afterStart.frameMediaTime + .1, "The small EMDR foreground stayed frozen after the programme handoff");
  assert.equal(afterStart.safety.microphoneCalls, 0);
  assert.equal(pageErrors.length, 0, pageErrors.join("\n"));

  console.log(JSON.stringify({ target, mutedProcess: true, cardLabel, before, afterStart, afterAdvance, pageErrors }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
