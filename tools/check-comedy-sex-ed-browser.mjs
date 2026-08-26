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
  assert.equal(await sexEdPage.locator("[data-sex-ed-card]").count(), 14);
  assert.equal((await sexEdPage.locator("#sex-ed-shelf-title + p").textContent()).trim(), "14 lessons");
  await sexEdPage.locator("[data-sex-ed-card]").first().click();
  await sexEdPage.waitForFunction(() => document.body.classList.contains("television-sex-ed-active"));
  const loaderState = await sexEdPage.evaluate(() => ({
    staticStartHidden: document.querySelector("[data-sex-ed-shell-start]")?.hidden,
    aggregateCount: document.querySelectorAll("[data-channel-loading-overlay]").length,
    aggregateActive: document.querySelector("[data-channel-loading-overlay]")?.classList.contains("is-active") || false,
  }));
  assert.equal(loaderState.staticStartHidden, true, "The redundant static Sex-Ed play triangle must remain hidden.");
  assert.equal(loaderState.aggregateCount, 1, "Sex-Ed must use only the single aggregate loading overlay.");
  assert.equal(loaderState.aggregateActive, true, "The aggregate spinner must explain the episode transition.");
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
    mobileProgram,
    loaderState,
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
