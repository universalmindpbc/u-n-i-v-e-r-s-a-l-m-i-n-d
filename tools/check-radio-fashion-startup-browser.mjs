import assert from "node:assert/strict";
import path from "node:path";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const chromiumExecutable = process.env.CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const baseUrl = process.env.RADIO_QA_URL || "https://staging.universalmind.tv/vogue/iam/index.html";
const throttleKbps = Number(process.env.RADIO_QA_THROTTLE_KBPS || 0);
const networkKbps = Number(process.env.RADIO_QA_NETWORK_KBPS || 0);
const overrideRoot = process.env.RADIO_QA_OVERRIDE_ROOT || "";
const channelIds = (process.env.RADIO_QA_CHANNELS || "radio-champagne-bohemia,radio-james-bondage")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const timeoutMs = Number(process.env.RADIO_QA_TIMEOUT_MS || 32000);
const attempts = Math.max(1, Math.min(5, Number(process.env.RADIO_QA_ATTEMPTS || 1)));

function qaUrl() {
  const url = new URL(baseUrl);
  if (throttleKbps > 0) url.searchParams.set("qaThrottleKbps", String(throttleKbps));
  return url.href;
}

async function snapshot(page) {
  return page.evaluate(() => {
    const visual = document.querySelector("video.is-radio-visual-active") ||
      document.querySelector("video[data-radio-visual-runway-id]");
    const state = window.IAMMusicChannels?.getState?.() || {};
    const streamMedia = Array.from(document.querySelectorAll("video")).map((media) => ({
      className: media.className,
      streamFile: media.dataset.streamFile || "",
      streamRole: media.dataset.streamRole || "",
      streamPriority: media.dataset.streamPriority || "",
      loadingState: media.dataset.streamLoadingState || "",
      auxiliaryState: media.dataset.streamAuxiliaryState || "",
      paused: media.paused,
      currentTime: Number(media.currentTime || 0),
      readyState: Number(media.readyState || 0),
    }));
    return {
      atMs: Math.round(performance.now()),
      channelLoading: document.body.dataset.channelLoadingState || "",
      broadcastChannelId: state.broadcast?.channelId || "",
      stationId: state.broadcast?.stationId || "",
      radioPlayback: state.radioPlayback?.state || "",
      visualMode: state.radioVisualBroadcast?.mode || "",
      visualChannelId: state.radioVisualBroadcast?.channelId || "",
      runwayId: state.radioVisualBroadcast?.runwayId || document.body.dataset.radioVisualRunwayId || "",
      visualPresent: Boolean(visual),
      visualActive: Boolean(visual?.classList.contains("is-radio-visual-active")),
      visualPaused: visual?.paused ?? null,
      visualCurrentTime: Number(visual?.currentTime || 0),
      visualReadyState: Number(visual?.readyState || 0),
      visualBufferSeconds: Number(window.IAMStreamController?.bufferedAhead?.(visual) || 0),
      visualPreload: visual?.dataset.radioFashionPreload || "",
      visualStreamPreload: visual?.dataset.streamPreload || "",
      visualPriority: visual?.dataset.streamPriority || "",
      visualAuxiliaryState: visual?.dataset.streamAuxiliaryState || "",
      visualAttach: visual?.dataset.televisionStreamAttach || "",
      visualError: visual?.dataset.televisionStreamError || visual?.dataset.radioFashionPreloadError || "",
      streamMedia,
    };
  });
}

async function runChannel(channelId, attempt) {
  const chromiumServer = await chromium.launchServer({
    headless: true,
    executablePath: chromiumExecutable,
    args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
  });
  const browserProcess = chromiumServer.process();
  assert.ok(browserProcess?.spawnargs.includes("--mute-audio"), "Chromium must be process-muted before navigation");
  const browser = await chromium.connect(chromiumServer.wsEndpoint());

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  let cdp = null;
  if (networkKbps > 0) {
    cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
  }
  const pageErrors = [];
  const consoleErrors = [];
  const streamRequests = [];
  if (overrideRoot) {
    for (const fileName of ["script.js", "cloudflare-stream-controller.js", "adaptive-environment-television.js"]) {
      await page.route(`**/${fileName}*`, (route) => route.fulfill({ path: path.join(overrideRoot, "i  a m", fileName) }));
    }
  }
  page.on("pageerror", (error) => pageErrors.push(String(error?.message || error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const url = request.url();
    if (!url.includes("cloudflarestream.com") || (!url.includes(".m3u8") && !url.includes("/seg_"))) return;
    streamRequests.push({ atMs: Date.now(), url: url.replace(/\?.*$/, "") });
    if (streamRequests.length > 80) streamRequests.shift();
  });
  await page.addInitScript(() => {
    const suppressFullscreen = () => Promise.reject(new DOMException("Fullscreen disabled by muted QA", "NotAllowedError"));
    Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: suppressFullscreen });
    Object.defineProperty(Element.prototype, "webkitRequestFullscreen", { configurable: true, value: suppressFullscreen });
    if (globalThis.HTMLVideoElement) {
      Object.defineProperty(HTMLVideoElement.prototype, "webkitEnterFullscreen", { configurable: true, value: suppressFullscreen });
    }
  });

  try {
    await page.goto(qaUrl(), { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForFunction(() => Boolean(window.IAMMusicChannels && window.IAMBroadcastClock), null, { timeout: 30000 });
    await page.locator("[data-television-play]").click({ timeout: 30000 });
    await page.waitForFunction(() => document.body.classList.contains("television-room-open"), null, { timeout: 10000 });
    if (cdp) {
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 35,
        downloadThroughput: (networkKbps * 1024) / 8,
        uploadThroughput: (networkKbps * 1024) / 8,
        connectionType: "cellular4g",
      });
    }
    await page.evaluate((id) => {
      window.__iamRadioQaJoinSettled = false;
      window.__iamRadioQaJoinValue = null;
      window.__iamRadioQaJoinError = "";
      Promise.resolve(window.IAMMusicChannels.joinBroadcast(id))
        .then((value) => { window.__iamRadioQaJoinValue = value; })
        .catch((error) => { window.__iamRadioQaJoinError = String(error?.message || error); })
        .finally(() => { window.__iamRadioQaJoinSettled = true; });
    }, channelId);

    const startedAt = Date.now();
    const samples = [];
    let firstAdvancingTime = null;
    while (Date.now() - startedAt < timeoutMs) {
      const current = await snapshot(page);
      const prior = samples.at(-1);
      const visualDelta = prior ? current.visualCurrentTime - prior.visualCurrentTime : 0;
      if (
        prior?.visualActive &&
        current.visualActive &&
        !prior.visualPaused &&
        !current.visualPaused &&
        visualDelta > 0.08 &&
        visualDelta < 1.5
      ) firstAdvancingTime ||= current.atMs;
      samples.push(current);
      if (
        current.broadcastChannelId === channelId &&
        current.visualActive &&
        !current.visualPaused &&
        firstAdvancingTime &&
        ["playing", "buffering", "reconnecting"].includes(current.radioPlayback)
      ) break;
      await page.waitForTimeout(500);
    }

    const final = samples.at(-1) || await snapshot(page);
    const join = await page.evaluate(() => ({
      settled: window.__iamRadioQaJoinSettled,
      value: window.__iamRadioQaJoinValue,
      error: window.__iamRadioQaJoinError,
    }));
    return {
      channelId,
      attempt,
      url: qaUrl(),
      elapsedMs: Date.now() - startedAt,
      join,
      firstAdvancingTime,
      final,
      samples: samples
        .filter((_sample, index) => index === 0 || index === samples.length - 1 || index % 4 === 0)
        .map(({ streamMedia: _streamMedia, ...sample }) => sample),
      pageErrors,
      consoleErrors: consoleErrors.filter((value) => !value.includes("ERR_ABORTED")),
      streamRequests,
    };
  } finally {
    await page.evaluate(() => {
      document.querySelectorAll("video, audio").forEach((media) => {
        try { media.pause(); } catch {}
        media.muted = true;
      });
    }).catch(() => {});
    await context.close();
    await browser.close();
    await chromiumServer.close();
  }
}

const results = [];
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  for (const channelId of channelIds) results.push(await runChannel(channelId, attempt));
}
const report = results.map(({ samples, streamRequests, ...result }) => ({
  ...result,
  samples: samples.length,
  streamRequests: streamRequests.length,
}));
process.stdout.write(`${JSON.stringify({ muted: true, throttleKbps, networkKbps, attempts, results: report }, null, 2)}\n`);

for (const result of results) {
  const label = `${result.channelId} attempt ${result.attempt}`;
  assert.equal(result.join.error, "", `${label} join threw: ${result.join.error}`);
  assert.ok(result.join.settled, `${label} join did not settle`);
  assert.equal(result.final.broadcastChannelId, result.channelId, `${label} did not become the active broadcast`);
  assert.ok(result.final.visualActive, `${label} did not reveal its Fashion visual`);
  assert.ok(result.firstAdvancingTime, `${label} Fashion visual did not advance`);
}

process.stdout.write("Radio Fashion startup browser QA passed.\n");
