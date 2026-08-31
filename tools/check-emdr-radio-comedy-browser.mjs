import assert from "node:assert/strict";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const target = process.env.IAM_EMDR_SURFACES_TARGET || "https://staging.universalmind.tv/vogue/iam/index.html";
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const viewport = {
  width: Math.max(320, Number(process.env.IAM_EMDR_SURFACES_VIEWPORT_WIDTH || 1440)),
  height: Math.max(568, Number(process.env.IAM_EMDR_SURFACES_VIEWPORT_HEIGHT || 900)),
};

const radioChannels = [
  { id: "radio-inner-planes", label: "Inner Planes" },
  { id: "radio-champagne-bohemia", label: "Champagne Bohemia" },
  { id: "radio-modul8-infinity", label: "modul8 infinity" },
  { id: "radio-james-bondage", label: "james bondage" },
];

const presets = [
  { index: 0, key: "cb", label: "CB", kind: "gif" },
  { index: 1, key: "m8", label: "M8", kind: "gif" },
  { index: 2, key: "jbh-i", label: "JBH i", kind: "gif" },
  { index: 3, key: "jbh-ii", label: "JBH ii", kind: "gif", gated: true },
  { index: 4, key: "jbh-iii", label: "JBH iii", kind: "gif", gated: true },
  { index: 5, key: "stella", label: "Stella", kind: "stellar" },
];

const browser = await chromium.launch({
  executablePath: chromiumExecutable,
  headless: true,
  args: ["--mute-audio"],
});
const context = await browser.newContext({ viewport });
await context.addInitScript(() => {
  window.__iamEmdrSurfaceSafety = {
    fullscreenCalls: 0,
    microphoneCalls: 0,
    videoFrameRequests: 0,
  };
  const blockFullscreen = () => {
    window.__iamEmdrSurfaceSafety.fullscreenCalls += 1;
    return Promise.reject(new DOMException("Fullscreen disabled by muted EMDR surface QA", "NotAllowedError"));
  };
  Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: blockFullscreen });
  Object.defineProperty(Element.prototype, "webkitRequestFullscreen", { configurable: true, value: blockFullscreen });
  if (globalThis.HTMLVideoElement) {
    Object.defineProperty(HTMLVideoElement.prototype, "webkitEnterFullscreen", { configurable: true, value: blockFullscreen });
    const requestVideoFrameCallback = HTMLVideoElement.prototype.requestVideoFrameCallback;
    if (requestVideoFrameCallback) {
      Object.defineProperty(HTMLVideoElement.prototype, "requestVideoFrameCallback", {
        configurable: true,
        value(callback) {
          this.dataset.qaVideoFrameRequests = String(Number(this.dataset.qaVideoFrameRequests || 0) + 1);
          window.__iamEmdrSurfaceSafety.videoFrameRequests += 1;
          return requestVideoFrameCallback.call(this, callback);
        },
      });
    }
  }
  if (navigator.mediaDevices?.getUserMedia) {
    navigator.mediaDevices.getUserMedia = () => {
      window.__iamEmdrSurfaceSafety.microphoneCalls += 1;
      return Promise.reject(new DOMException("Microphone disabled by muted EMDR surface QA", "NotAllowedError"));
    };
  }
});

const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(String(error)));

async function selectPreset(preset) {
  await page.locator(`[data-emdr-style-index="${preset.index}"]`).evaluate((button) => button.click());
  if (preset.gated) {
    await page.waitForFunction(() => (
      document.querySelector("[data-jbh-content-gate]")?.getAttribute("aria-hidden") === "false"
    ), null, { timeout: 10000 });
    await page.locator("[data-jbh-content-gate-confirm]").evaluate((button) => button.click());
  }
  try {
    await page.waitForFunction(({ key, kind }) => {
      if (!window.IAMEMDR?.active || document.body.dataset.emdrPreset !== key) return false;
      if (kind === "stellar") {
        return Math.round(Number(window.IAMEMDR.style)) === 5 &&
          document.querySelector("[data-emdr-three-canvas]")?.classList.contains("is-active");
      }
      const panel = document.querySelector(`.adaptive-television-emdr-gif-grid[data-emdr-gif-preset="${key}"]`);
      return Math.round(Number(window.IAMEMDR.style)) === 7 &&
        window.IAMEMDRGif?.active &&
        window.IAMEMDRGif?.preset === key &&
        panel?.classList.contains("is-active");
    }, preset, { timeout: 30000 });
  } catch (error) {
    const diagnostics = await page.evaluate((selectedPreset) => ({
      expected: selectedPreset,
      bodyPreset: document.body.dataset.emdrPreset || "",
      bodyGifPreset: document.body.dataset.emdrGifPreset || "",
      emdr: window.IAMEMDR?.diagnostics?.() || null,
      gif: window.IAMEMDRGif?.diagnostics?.() || null,
      selectedButton: document.querySelector(`[data-emdr-style-index="${selectedPreset.index}"]`)?.getAttribute("aria-pressed") || "",
      gateHidden: document.querySelector("[data-jbh-content-gate]")?.getAttribute("aria-hidden") || "",
      panels: [...document.querySelectorAll(".adaptive-television-emdr-gif-grid[data-emdr-gif-preset]")].map((panel) => ({
        key: panel.dataset.emdrGifPreset || "",
        active: panel.classList.contains("is-active"),
      })),
    }), preset);
    throw new Error(`${error.message}: ${JSON.stringify(diagnostics)}`);
  }
}

async function currentSurfaceSnapshot(mode, preset) {
  return page.evaluate(({ surfaceMode, selectedPreset }) => {
    const player = document.querySelector("[data-television-player]");
    const frame = document.querySelector(".adaptive-television-fashion-hero-frame");
    const gifWorld = document.querySelector("[data-emdr-gif-world]");
    const comedyWorld = document.querySelector("[data-comedy-world]");
    const threeCanvas = document.querySelector("[data-emdr-three-canvas]");
    const source = surfaceMode === "comedy"
      ? document.querySelector("[data-comedy-video]")
      : document.querySelector(".adaptive-television-radio-visual-video.is-radio-visual-active");
    const panel = selectedPreset.kind === "gif"
      ? document.querySelector(`.adaptive-television-emdr-gif-grid[data-emdr-gif-preset="${selectedPreset.key}"]`)
      : null;
    const videoTiles = panel ? [...panel.querySelectorAll("video[data-emdr-gif-tile]")] : [];
    const imageTiles = panel ? [...panel.querySelectorAll("img[data-emdr-gif-tile]")] : [];
    return {
      source: {
        exists: Boolean(source),
        currentTime: Number(source?.currentTime || 0),
        paused: Boolean(source?.paused),
        readyState: Number(source?.readyState || 0),
        frameRequests: Number(source?.dataset.qaVideoFrameRequests || 0),
        role: surfaceMode === "comedy" ? "comedy" : "radio-visual",
        id: surfaceMode === "comedy"
          ? (document.body.dataset.comedyProgramme || "")
          : (source?.dataset.radioVisualRunwayId || ""),
      },
      foreground: {
        state: frame?.dataset.fashionHeroMirror || "",
        source: frame?.dataset.emdrGifForegroundSource || "",
        drawCount: Number(frame?.dataset.fashionHeroDrawCount || 0),
        mediaTime: Number(frame?.dataset.fashionHeroMediaTime || 0),
        zIndex: Number(getComputedStyle(frame).zIndex || 0),
      },
      programmeContract: {
        mode: player?.dataset.emdrGifSourceMode || "",
        source: player?.dataset.emdrGifForegroundSource || "",
        videoBlend: player?.dataset.videoBlend || "",
        radioMixState: document.body.dataset.radioVisualMixState || "",
        editorialActive: document.body.classList.contains("television-emdr-jbh-editorial-active"),
        fashionBroadcast: window.IAMMusicChannels?.getState?.().fashionBroadcast?.channelId || "",
      },
      artwork: {
        gifWorldActive: Boolean(gifWorld?.classList.contains("is-active")),
        gifWorldZ: Number(getComputedStyle(gifWorld).zIndex || 0),
        comedyWorldZ: Number(getComputedStyle(comedyWorld).zIndex || 0),
        threeActive: Boolean(threeCanvas?.classList.contains("is-active")),
        threeZ: Number(getComputedStyle(threeCanvas).zIndex || 0),
        imageTilesReady: imageTiles.filter((tile) => tile.complete && tile.naturalWidth > 0).length,
        imageTileCount: imageTiles.length,
        videoTilesPlaying: videoTiles.filter((tile) => !tile.paused && tile.readyState >= 2).length,
        videoTileCount: videoTiles.length,
      },
      safety: { ...window.__iamEmdrSurfaceSafety },
    };
  }, { surfaceMode: mode, selectedPreset: preset });
}

async function verifyPreset(mode, surfaceLabel, preset, expectedFashionBroadcast) {
  await selectPreset(preset);
  if (preset.kind === "gif") {
    await page.waitForFunction((sourceRole) => {
      const frame = document.querySelector(".adaptive-television-fashion-hero-frame");
      const player = document.querySelector("[data-television-player]");
      return frame?.dataset.fashionHeroMirror === "ready" &&
        frame?.dataset.emdrGifForegroundSource === sourceRole &&
        player?.dataset.emdrGifSourceMode === "current-programme";
    }, mode === "comedy" ? "comedy" : "radio-visual", { timeout: 30000 });
  }
  const before = await currentSurfaceSnapshot(mode, preset);
  await page.waitForTimeout(1500);
  const after = await currentSurfaceSnapshot(mode, preset);

  assert.equal(before.source.exists, true, `${surfaceLabel} ${preset.label}: programme picture is missing`);
  assert.equal(before.source.paused, false, `${surfaceLabel} ${preset.label}: programme picture is paused`);
  assert.ok(before.source.readyState >= 2, `${surfaceLabel} ${preset.label}: programme picture has no decoded frame`);
  assert.ok(after.source.currentTime > before.source.currentTime + .25, `${surfaceLabel} ${preset.label}: programme picture did not advance`);
  assert.equal(after.programmeContract.editorialActive, false, `${surfaceLabel} ${preset.label}: an extra JBH editorial video replaced the current programme`);
  assert.equal(after.programmeContract.fashionBroadcast, expectedFashionBroadcast, `${surfaceLabel} ${preset.label}: the preset replaced the current programme with another Fashion channel`);

  if (preset.kind === "gif") {
    assert.equal(after.programmeContract.mode, "current-programme", `${surfaceLabel} ${preset.label}: current-programme mode was not retained`);
    assert.equal(after.programmeContract.source, after.source.role, `${surfaceLabel} ${preset.label}: the foreground source contract is wrong`);
    assert.equal(after.foreground.source, after.source.role, `${surfaceLabel} ${preset.label}: the foreground is bound to stale media`);
    assert.equal(after.foreground.state, "ready", `${surfaceLabel} ${preset.label}: the foreground mirror is not ready`);
    assert.ok(after.foreground.drawCount > before.foreground.drawCount, `${surfaceLabel} ${preset.label}: the foreground mirror did not redraw`);
    assert.ok(after.foreground.mediaTime > before.foreground.mediaTime + .1, `${surfaceLabel} ${preset.label}: the foreground mirror stayed static`);
    assert.ok(after.source.frameRequests > 0, `${surfaceLabel} ${preset.label}: the active programme never drove the foreground renderer`);
    assert.equal(after.artwork.gifWorldActive, true, `${surfaceLabel} ${preset.label}: the GIF world is not active`);
    if (after.artwork.imageTileCount) {
      assert.ok(after.artwork.imageTilesReady > 0, `${surfaceLabel} ${preset.label}: no animated image tile loaded`);
    }
    if (after.artwork.videoTileCount) {
      assert.ok(after.artwork.videoTilesPlaying > 0, `${surfaceLabel} ${preset.label}: no animated video tile is playing`);
    }
    if (mode === "radio") {
      assert.equal(after.programmeContract.videoBlend, "radio-visual", `${surfaceLabel} ${preset.label}: Radio did not retain its own video`);
      assert.equal(after.programmeContract.radioMixState, "radio-visual", `${surfaceLabel} ${preset.label}: Radio visual mix drifted`);
    } else {
      assert.ok(after.artwork.gifWorldZ > after.artwork.comedyWorldZ, `${surfaceLabel} ${preset.label}: Comedy covers the GIF artwork`);
      assert.ok(after.foreground.zIndex > after.artwork.comedyWorldZ, `${surfaceLabel} ${preset.label}: Comedy covers the moving foreground`);
    }
  } else {
    assert.equal(after.artwork.threeActive, true, `${surfaceLabel} ${preset.label}: Stellar is not active`);
    if (mode === "comedy") {
      assert.ok(after.artwork.threeZ > after.artwork.comedyWorldZ, `${surfaceLabel} ${preset.label}: Comedy covers Stellar`);
    }
  }

  assert.equal(after.safety.microphoneCalls, 0, `${surfaceLabel} ${preset.label}: microphone access was attempted`);
  assert.equal(after.safety.fullscreenCalls, 0, `${surfaceLabel} ${preset.label}: native fullscreen was attempted`);
  console.log(`PASS ${surfaceLabel} / ${preset.label}`);
  return { surfaceLabel, preset: preset.label, before, after };
}

const results = [];
try {
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Boolean(
    window.IAMTelevisionRoom &&
    window.IAMMusicChannels &&
    window.IAMComedyChannel &&
    window.IAMEMDR &&
    window.IAMEMDRGif
  ), null, { timeout: 60000 });
  await page.evaluate(() => window.IAMTelevisionRoom.preparePresentationEntry());
  await page.waitForFunction(() => (
    document.body.classList.contains("television-room-open") &&
    Boolean(document.querySelector(".adaptive-television-local-video"))
  ), null, { timeout: 30000 });

  for (const channel of radioChannels) {
    const joined = await page.evaluate((channelId) => window.IAMMusicChannels.joinBroadcast(channelId), channel.id);
    assert.equal(joined, true, `${channel.label}: Radio channel did not join`);
    await page.waitForFunction((channelId) => {
      const radioVideo = document.querySelector(".adaptive-television-radio-visual-video.is-radio-visual-active");
      return document.body.classList.contains("television-radio-continuation") &&
        document.body.dataset.broadcastChannelId === channelId &&
        document.body.dataset.radioPlaybackState === "playing" &&
        radioVideo && !radioVideo.paused && radioVideo.readyState >= 2;
    }, channel.id, { timeout: 90000 });
    const expectedFashionBroadcast = await page.evaluate(() => window.IAMMusicChannels.getState().fashionBroadcast.channelId || "");
    for (const preset of presets) {
      results.push(await verifyPreset("radio", channel.label, preset, expectedFashionBroadcast));
    }
  }

  const comedyJoined = await page.evaluate(() => window.IAMComedyChannel.joinBroadcast());
  assert.equal(comedyJoined, true, "Comedy channel did not join");
  await page.waitForFunction(() => {
    const comedyVideo = document.querySelector("[data-comedy-video]");
    return document.body.classList.contains("television-comedy-active") &&
      document.body.dataset.comedyPlaybackState === "playing" &&
      comedyVideo && !comedyVideo.paused && comedyVideo.readyState >= 2;
  }, null, { timeout: 90000 });
  const comedyFashionBroadcast = await page.evaluate(() => window.IAMMusicChannels.getState().fashionBroadcast.channelId || "");
  for (const preset of presets) {
    results.push(await verifyPreset("comedy", "Comedy", preset, comedyFashionBroadcast));
  }

  assert.equal(pageErrors.length, 0, pageErrors.join("\n"));
  const finalSafety = await page.evaluate(() => ({ ...window.__iamEmdrSurfaceSafety }));
  assert.equal(finalSafety.microphoneCalls, 0);
  assert.equal(finalSafety.fullscreenCalls, 0);
  console.log(JSON.stringify({
    target,
    viewport,
    mutedProcess: true,
    checked: results.map(({ surfaceLabel, preset }) => `${surfaceLabel} / ${preset}`),
    finalSafety,
    pageErrors,
  }, null, 2));
} finally {
  await page.evaluate(() => {
    window.IAMEMDR?.setActive?.(false, { canvas: document.querySelector("[data-emdr-canvas]") });
    window.__iamStopAdaptiveMedia?.();
  }).catch(() => {});
  await context.close();
  await browser.close();
}
