import assert from "node:assert/strict";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const baseUrl = process.env.IAM_BROWSER_BASE_URL || "https://staging.universalmind.tv/vogue/iam/";
const episodes = String(process.env.IAM_SEX_ED_EPISODES || "02,03,04,07,15,16")
  .split(",")
  .map((episode) => episode.trim().padStart(2, "0"))
  .filter(Boolean);
const blockSexEdAudio = process.env.IAM_SEX_ED_BLOCK_AUDIO === "1";
const sexEdAudioStreamIds = ["16beb0de56b4924810211bae6d917ebb", "f1257734ca8ee5702b3022619db360cd"];
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";

const chromiumServer = await chromium.launchServer({
  executablePath,
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const browserProcess = chromiumServer.process();
assert.ok(browserProcess?.spawnargs?.includes("--mute-audio"), "Chromium must be process-muted before Sex Ed media loads.");
const browser = await chromium.connect(chromiumServer.wsEndpoint());

function stateSnapshot() {
  const body = document.body;
  const foreground = document.querySelector("[data-sex-ed-shell-video]");
  const background = document.querySelector("[data-sex-ed-background]");
  const tiles = [...document.querySelectorAll(".adaptive-television-sex-ed-grid img, .adaptive-television-sex-ed-grid video")];
  const mediaState = (media) => media ? {
    paused: media.paused,
    readyState: media.readyState,
    currentTime: Number(media.currentTime || 0),
    error: media.error?.message || "",
    streamError: media.dataset.sexEdStreamError || media.dataset.televisionStreamError || "",
  } : null;
  return {
    episode: body.dataset.sexEdEpisode || "",
    title: body.dataset.sexEdEpisodeTitle || "",
    loading: body.dataset.sexEdLoadingState || "",
    foregroundLoading: body.dataset.sexEdLoadingForeground || "",
    backgroundLoading: body.dataset.sexEdLoadingBackground || "",
    tilesLoading: body.dataset.sexEdLoadingTiles || "",
    tileReadyCount: Number(body.dataset.sexEdLoopReadyCount || 0),
    tileExpectedCount: Number(body.dataset.sexEdLoopExpectedCount || 0),
    audioLoading: body.dataset.sexEdLoadingAudio || "",
    elapsedMs: Number(body.dataset.sexEdLoadingElapsedMs || 0),
    audioPlayback: body.dataset.audioPartyPlaybackState || body.dataset.radioPlaybackState || "",
    audioStage: body.dataset.audioPartyStartupStage || "",
    audioAttempt: body.dataset.audioPartyStartupAttempt || "",
    audioMaxAttempts: body.dataset.audioPartyStartupMaxAttempts || "",
    audioError: body.dataset.audioPartyPlaybackError || body.dataset.radioPlaybackError || "",
    foreground: mediaState(foreground),
    background: mediaState(background),
    tiles: tiles.map((tile) => tile instanceof HTMLVideoElement ? mediaState(tile) : {
      complete: tile.complete,
      naturalWidth: tile.naturalWidth,
      src: tile.currentSrc || tile.src || "",
    }),
  };
}

const results = [];
try {
  for (const episode of episodes) {
    const context = await browser.newContext({ viewport: { width: 1952, height: 1269 } });
    if (blockSexEdAudio) {
      await context.route("**/*", async (route) => {
        if (sexEdAudioStreamIds.some((streamId) => route.request().url().includes(streamId))) return route.abort();
        return route.fallback();
      });
    }
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text().slice(0, 240));
    });
    page.on("pageerror", (error) => errors.push(String(error?.message || error).slice(0, 240)));
    await page.goto(`${baseUrl}index.html?sexEd=1&sexEdReliability=${episode}-${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForFunction(() => document.querySelector("[data-sex-ed-shelf]")?.getAttribute("aria-hidden") === "false", null, { timeout: 30000 });
    await page.locator(`[data-sex-ed-card][data-sex-ed-episode="${episode}"]`).click({ force: true });
    const gateVisible = await page.locator("[data-jbh-content-gate]").getAttribute("aria-hidden").then((value) => value === "false");
    if (gateVisible) await page.locator("[data-jbh-content-gate-confirm]").click({ force: true });
    await page.waitForFunction(() => document.body.classList.contains("television-sex-ed-active"), null, { timeout: 15000 });
    await page.waitForFunction(() => ["ready", "error"].includes(document.body.dataset.sexEdLoadingState || ""), null, { timeout: 60000 })
      .catch(() => {});
    const state = await page.evaluate(stateSnapshot);
    results.push({ ...state, consoleErrors: errors });
    await context.close();
  }
  const failures = results.filter((result) => result.loading !== "ready");
  const reportResults = process.env.IAM_SEX_ED_VERBOSE === "1" || failures.length
    ? results
    : results.map((result) => ({
      episode: result.episode,
      title: result.title,
      loading: result.loading,
      foreground: result.foregroundLoading,
      background: result.backgroundLoading,
      tiles: result.tilesLoading,
      tileReadiness: result.tileExpectedCount ? `${result.tileReadyCount}/${result.tileExpectedCount}` : "not used",
      audio: result.audioLoading,
      audioAttempt: result.audioAttempt ? `${result.audioAttempt}/${result.audioMaxAttempts}` : "not used",
      elapsedMs: result.elapsedMs,
    }));
  console.log(JSON.stringify({ passed: failures.length === 0, chromiumProcessMuted: true, blockSexEdAudio, baseUrl, results: reportResults }, null, 2));
  if (failures.length) process.exitCode = 1;
} finally {
  await browser.close().catch(() => {});
  await chromiumServer.close().catch(() => {});
}
