import assert from "node:assert/strict";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const baseUrl = process.env.IAM_BROWSER_BASE_URL || "http://127.0.0.1:41783/i%20%20a%20m/";
const baseHostname = new URL(baseUrl).hostname;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const comedyNowMs = Date.parse("2026-07-24T00:00:00.000Z") + (420 * 1000);

const chromiumServer = await chromium.launchServer({
  executablePath,
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const browserProcess = chromiumServer.process();
assert.ok(browserProcess?.spawnargs?.includes("--mute-audio"), "Chromium must be process-muted before any media route loads.");
const browser = await chromium.connect(chromiumServer.wsEndpoint());

async function installClock(context) {
  await context.route("**/api/broadcast-clock.php?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ server_now_ms: comedyNowMs }),
    });
  });
}

async function blockRemoteMedia(context) {
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === baseHostname || url.hostname === "127.0.0.1" || url.hostname === "localhost") return route.fallback();
    return route.abort();
  });
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await installClock(desktop);
  await blockRemoteMedia(desktop);
  const programPage = await desktop.newPage();
  await programPage.goto(`${baseUrl}program.html`, { waitUntil: "domcontentloaded" });
  await programPage.waitForFunction(() => document.body.dataset.programGuideState === "ready");
  const desktopProgram = await programPage.evaluate(() => {
    const panel = document.querySelector("[data-program-panel]");
    const primary = document.querySelector(".program-mode-switcher");
    const destinations = document.querySelector(".program-destination-switcher");
    const zone = document.querySelector(".program-zone-switcher");
    const rect = (element) => element?.getBoundingClientRect().toJSON();
    return {
      primaryLabels: [...primary.querySelectorAll("button")].map((button) => button.textContent.trim()),
      destinationLabels: [...destinations.querySelectorAll("button")].map((button) => button.textContent.trim()),
      primary: rect(primary),
      destinations: rect(destinations),
      zone: rect(zone),
      panelOverflow: panel.scrollWidth - panel.clientWidth,
    };
  });
  assert.deepEqual(desktopProgram.primaryLabels, ["VIDEOS", "PARTIES", "RADIO"]);
  assert.deepEqual(desktopProgram.destinationLabels, ["COMEDY", "SEX-ED"]);
  assert.ok(desktopProgram.destinations.x > desktopProgram.primary.x + desktopProgram.primary.width + 20, "Comedy and Sex-Ed must sit in a separate right-side hierarchy.");
  assert.ok(desktopProgram.zone.x > desktopProgram.destinations.x + desktopProgram.destinations.width, "The destination controls must remain distinct from the city clock.");
  assert.ok(desktopProgram.panelOverflow <= 1, "The desktop Program header must not overflow.");
  await programPage.locator('[data-zone="Australia/Sydney"]').click();
  const wallClockByMode = {};
  for (const mode of ["videos", "parties", "radio", "comedy"]) {
    await programPage.locator(`button[data-program-mode="${mode}"]`).click();
    wallClockByMode[mode] = (await programPage.locator("[data-now-time]").textContent()).trim();
  }
  assert.deepEqual(Object.values(wallClockByMode), ["10:07", "10:07", "10:07", "10:07"], "Every Program mode must show the same server-synchronised Sydney wall clock.");
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await installClock(mobile);
  await blockRemoteMedia(mobile);
  const mobileProgramPage = await mobile.newPage();
  await mobileProgramPage.goto(`${baseUrl}program.html`, { waitUntil: "domcontentloaded" });
  await mobileProgramPage.waitForFunction(() => document.body.dataset.programGuideState === "ready");
  const mobileProgram = await mobileProgramPage.evaluate(() => {
    const primary = document.querySelector(".program-mode-switcher").getBoundingClientRect();
    const destinations = document.querySelector(".program-destination-switcher").getBoundingClientRect();
    const zone = document.querySelector(".program-zone-switcher").getBoundingClientRect();
    const panel = document.querySelector("[data-program-panel]");
    return {
      primaryBottom: primary.bottom,
      destinationsTop: destinations.top,
      destinationsBottom: destinations.bottom,
      zoneTop: zone.top,
      overflow: panel.scrollWidth - panel.clientWidth,
    };
  });
  assert.ok(mobileProgram.destinationsTop >= mobileProgram.primaryBottom, "Mobile destinations must occupy their own row.");
  assert.ok(mobileProgram.zoneTop >= mobileProgram.destinationsBottom, "The mobile city clock must remain on the row below the destinations.");
  assert.ok(mobileProgram.overflow <= 1, "The mobile Program header must not overflow.");

  const sexEdPage = await mobile.newPage();
  await sexEdPage.goto(`${baseUrl}index.html?sexEd=1`, { waitUntil: "domcontentloaded" });
  await sexEdPage.waitForFunction(() => document.querySelector("[data-sex-ed-shelf]")?.getAttribute("aria-hidden") === "false");
  assert.equal(await sexEdPage.locator("[data-sex-ed-card]").count(), 16);
  assert.equal((await sexEdPage.locator("#sex-ed-shelf-title + p").textContent()).trim(), "16 lessons");
  await sexEdPage.locator("[data-sex-ed-card]").first().click();
  await sexEdPage.waitForFunction(() => document.body.classList.contains("television-sex-ed-active"));
  const loaderState = await sexEdPage.evaluate(() => {
    const player = document.querySelector("[data-television-player]");
    const episode = document.querySelector("[data-sex-ed-shell-video]");
    const world = document.querySelector("[data-sex-ed-world]");
    const tileGrid = document.querySelector(".adaptive-television-sex-ed-grid");
    const underlyingMedia = [...player.children]
      .filter((element) => !element.matches(".adaptive-television-channel-loading, .adaptive-television-timecode"))
      .map((element) => {
        const style = getComputedStyle(element);
        return { className: element.className, opacity: Number(style.opacity), visibility: style.visibility };
      });
    return {
      staticStartHidden: document.querySelector("[data-sex-ed-shell-start]")?.hidden,
      aggregateCount: document.querySelectorAll("[data-channel-loading-overlay]").length,
      aggregateActive: document.querySelector("[data-channel-loading-overlay]")?.classList.contains("is-active") || false,
      worldBackground: getComputedStyle(world).backgroundColor,
      episodeVisibility: getComputedStyle(episode).visibility,
      tileGridOpacity: Number(getComputedStyle(tileGrid).opacity),
      tileGridVisibility: getComputedStyle(tileGrid).visibility,
      underlyingMedia,
    };
  });
  assert.equal(loaderState.staticStartHidden, true, "The redundant static Sex-Ed play triangle must remain hidden.");
  assert.equal(loaderState.aggregateCount, 1, "Sex-Ed must use only the single aggregate loading overlay.");
  assert.equal(loaderState.aggregateActive, true, "The aggregate spinner must explain the episode transition.");
  assert.equal(loaderState.worldBackground, "rgb(8, 8, 10)", "Sex-Ed loading must use a clean opaque black canvas.");
  assert.equal(loaderState.episodeVisibility, "visible", "The intended Sex-Ed episode composition must remain visible.");
  assert.equal(loaderState.tileGridOpacity, 1, "The six-tile EMDR field must remain visible while Sex-Ed loads.");
  assert.equal(loaderState.tileGridVisibility, "visible", "Sex-Ed loading must not hide or deprioritise the animated tiles.");
  assert.ok(loaderState.underlyingMedia.every((item) => item.visibility === "hidden" && item.opacity === 0), "No outgoing portrait or programme media may show through the Sex-Ed loader.");

  const episode15Page = await mobile.newPage();
  await episode15Page.goto(`${baseUrl}index.html?sexEd=1`, { waitUntil: "domcontentloaded" });
  await episode15Page.waitForFunction(() => document.querySelector("[data-sex-ed-shelf]")?.getAttribute("aria-hidden") === "false");
  await episode15Page.locator('[data-sex-ed-card][data-sex-ed-episode="15"]').click();
  await episode15Page.waitForFunction(() => document.querySelector("[data-jbh-content-gate]")?.getAttribute("aria-hidden") === "false");
  const episode15Gate = await episode15Page.evaluate(() => ({
    active: document.body.classList.contains("television-sex-ed-active"),
    title: document.querySelector("[data-jbh-content-gate-title]")?.textContent.trim(),
    editorNoteHidden: document.querySelector("[data-jbh-content-gate-editor-note]")?.hidden,
    previewCount: document.querySelectorAll("[data-sex-ed-card][data-sex-ed-episode=\"15\"] video").length,
  }));
  assert.deepEqual(episode15Gate, {
    active: false,
    title: "Pirelli 2010 · editor's note",
    editorNoteHidden: false,
    previewCount: 0,
  }, "Episode 15 must remain stopped behind its complete editor's note.");
  await episode15Page.locator("[data-jbh-content-gate-confirm]").click();
  await episode15Page.waitForFunction(() => document.body.classList.contains("television-sex-ed-active"));
  const episode15State = await episode15Page.evaluate(() => ({
    episode: document.body.dataset.sexEdEpisode,
    title: document.body.dataset.sexEdEpisodeTitle,
    host: document.body.dataset.sexEdEpisodeGuest,
    foregroundMuted: document.body.dataset.sexEdForegroundMuted,
    backgroundAudible: document.body.dataset.sexEdBackgroundAudible,
    musicMix: document.body.dataset.programmeFixedMixLevel,
  }));
  assert.deepEqual(episode15State, {
    episode: "15",
    title: "Healing Sexual Trauma in Nature",
    host: "Shashi Solana",
    foregroundMuted: "true",
    backgroundAudible: "true",
    musicMix: "0.15",
  });
  await episode15Page.close();

  const episode16Page = await mobile.newPage();
  await episode16Page.goto(`${baseUrl}index.html?sexEd=1`, { waitUntil: "domcontentloaded" });
  await episode16Page.waitForFunction(() => document.querySelector("[data-sex-ed-shelf]")?.getAttribute("aria-hidden") === "false");
  await episode16Page.locator('[data-sex-ed-card][data-sex-ed-episode="16"]').click();
  await episode16Page.waitForFunction(() => document.querySelector("[data-jbh-content-gate]")?.getAttribute("aria-hidden") === "false");
  const episode16Gate = await episode16Page.evaluate(() => ({
    active: document.body.classList.contains("television-sex-ed-active"),
    editorNoteHidden: document.querySelector("[data-jbh-content-gate-editor-note]")?.hidden,
    previewCount: document.querySelectorAll("[data-sex-ed-card][data-sex-ed-episode=\"16\"] video").length,
  }));
  assert.deepEqual(episode16Gate, { active: false, editorNoteHidden: true, previewCount: 0 });
  await episode16Page.locator("[data-jbh-content-gate-confirm]").click();
  await episode16Page.waitForFunction(() => document.body.classList.contains("television-sex-ed-active"));
  const episode16State = await episode16Page.evaluate(() => ({
    episode: document.body.dataset.sexEdEpisode,
    title: document.body.dataset.sexEdEpisodeTitle,
    host: document.body.dataset.sexEdEpisodeGuest,
    foregroundMuted: document.body.dataset.sexEdForegroundMuted,
    backgroundAudible: document.body.dataset.sexEdBackgroundAudible,
    syncLayers: document.body.dataset.sexEdSyncLayers,
    musicMix: document.body.dataset.programmeFixedMixLevel,
  }));
  assert.deepEqual(episode16State, {
    episode: "16",
    title: "Dissolving Toxic Masculinity",
    host: "Karl Lagerfeld & Shashi Solana",
    foregroundMuted: "false",
    backgroundAudible: "false",
    syncLayers: "true",
    musicMix: "0.15",
  });
  await episode16Page.close();
  await mobile.close();

  const comedyContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await installClock(comedyContext);
  const comedyPage = await comedyContext.newPage();
  await comedyPage.goto(`${baseUrl}index.html?comedy=1`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await comedyPage.waitForFunction(() => document.body.classList.contains("television-comedy-active"));
  await comedyPage.waitForFunction(() => {
    const video = document.querySelector("[data-comedy-video]");
    return video && !video.paused && video.readyState >= 2 && video.currentTime > 0;
  }, null, { timeout: 60000 });
  const startTime = await comedyPage.locator("[data-comedy-video]").evaluate((video) => video.currentTime);
  await comedyPage.waitForFunction((baseline) => {
    const video = document.querySelector("[data-comedy-video]");
    return video && !video.paused && video.currentTime > baseline + 0.25;
  }, startTime, { timeout: 10000 });
  const advancedTime = await comedyPage.locator("[data-comedy-video]").evaluate((video) => video.currentTime);
  assert.ok(advancedTime > startTime + 0.25, "The process-muted Comedy stream must advance.");
  await comedyPage.waitForFunction(() => document.querySelector("[data-comedy-video]")?.dataset.comedyCropState === "ready", null, { timeout: 12000 });
  const comedyState = await comedyPage.evaluate(() => {
    const world = document.querySelector("[data-comedy-world]");
    const video = document.querySelector("[data-comedy-video]");
    const wallet = document.querySelector("[data-reaction-wallet]");
    const live = document.querySelector("[data-television-live-pill]");
    const timecode = document.querySelector(".adaptive-television-timecode");
    return {
      streamFile: document.body.dataset.comedyStreamFile,
      soundMultiplier: document.body.dataset.comedySoundOutputMultiplier,
      cropScale: Number(video.dataset.comedyCropScale),
      cropBars: video.dataset.comedyCropBars,
      cropState: video.dataset.comedyCropState,
      objectFit: getComputedStyle(video).objectFit,
      worldZ: Number(getComputedStyle(world).zIndex),
      walletZ: Number(getComputedStyle(wallet).zIndex),
      walletVisible: getComputedStyle(wallet).visibility !== "hidden" && Number(getComputedStyle(wallet).opacity) > 0,
      liveVisible: getComputedStyle(live).visibility !== "hidden" && Number(getComputedStyle(live).opacity) > 0,
      timecodeVisible: Number(getComputedStyle(timecode).opacity) > 0,
      timecode: timecode.textContent,
      nowPlaying: window.IAMNowPlaying?.getState?.(),
      closeCount: document.querySelectorAll("[data-comedy-close]").length,
      overlayCount: document.querySelectorAll("[data-comedy-now]").length,
      worldRect: world.getBoundingClientRect().toJSON(),
      videoRect: video.getBoundingClientRect().toJSON(),
    };
  });
  assert.match(comedyState.streamFile || "", /THE BIG LEZ SHOW - ALL OF SEASON 1\.mp4/);
  assert.equal(comedyState.soundMultiplier, "0.11");
  assert.equal(comedyState.cropState, "ready");
  assert.equal(comedyState.objectFit, "cover");
  if (comedyState.cropBars === "none") assert.equal(comedyState.cropScale, 1);
  else assert.ok(comedyState.cropScale > 1.02, `Detected encoded black bars were not cropped: ${comedyState.cropBars}`);
  assert.ok(comedyState.videoRect.width >= comedyState.worldRect.width && comedyState.videoRect.height >= comedyState.worldRect.height);
  assert.ok(comedyState.worldZ < comedyState.walletZ, "The canonical wallet must sit above Comedy.");
  assert.equal(comedyState.walletVisible, true);
  assert.equal(comedyState.liveVisible, true);
  assert.equal(comedyState.timecodeVisible, true);
  assert.notEqual(comedyState.timecode, "0:00");
  assert.equal(comedyState.nowPlaying?.mode, "comedy");
  assert.match(comedyState.nowPlaying?.title || "", /Big Lez Show/);
  assert.equal(comedyState.closeCount, 0);
  assert.equal(comedyState.overlayCount, 0);

  if (await comedyPage.locator("[data-wallet-categories]").getAttribute("aria-hidden") === "true") {
    await comedyPage.locator("[data-reaction-wallet-trigger]").click({ force: true });
  }
  await comedyPage.waitForFunction(() => document.querySelector("[data-wallet-categories]")?.getAttribute("aria-hidden") === "false");
  await comedyPage.waitForTimeout(1100);
  await comedyPage.locator('[data-wallet-category="video"]').click({ force: true });
  await comedyPage.waitForFunction(() => document.querySelector("[data-reaction-wallet]")?.dataset.walletView === "video");
  await comedyPage.evaluate(() => window.IAMMusicChannels?.openChannels?.("videos"));
  await comedyPage.waitForFunction(() => document.querySelector("[data-music-shelf]")?.getAttribute("aria-hidden") === "false");
  await comedyPage.locator("[data-music-shelf-track] button").first().click();
  await comedyPage.waitForFunction(() => document.querySelector("[data-broadcast-entry]")?.getAttribute("aria-hidden") === "false");
  await comedyPage.locator("[data-broadcast-join]").click({ force: true });
  await comedyPage.waitForFunction(() => !document.body.classList.contains("television-comedy-active"));
  const navigationState = await comedyPage.evaluate(() => ({
    comedyActive: document.body.classList.contains("television-comedy-active"),
    soundMultiplier: document.body.dataset.comedySoundOutputMultiplier || "",
  }));
  assert.equal(navigationState.comedyActive, false);
  assert.equal(navigationState.soundMultiplier, "", "Comedy-only sound scaling must clear when wallet navigation selects another channel.");
  await comedyContext.close();

  console.log(JSON.stringify({
    passed: true,
    chromiumProcessMuted: true,
    desktopProgram,
    wallClockByMode,
    mobileProgram,
    loaderState,
    episode15Gate,
    episode15State,
    episode16Gate,
    episode16State,
    comedyState: {
      streamFile: comedyState.streamFile,
      cropScale: comedyState.cropScale,
      cropBars: comedyState.cropBars,
      timecode: comedyState.timecode,
      nowPlaying: comedyState.nowPlaying,
    },
    navigationState,
  }, null, 2));
} finally {
  await browser.close().catch(() => {});
  await chromiumServer.close().catch(() => {});
}
