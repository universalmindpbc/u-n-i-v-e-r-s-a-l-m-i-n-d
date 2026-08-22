import assert from "node:assert/strict";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const baseUrl = process.env.MOBILE_INDUCTION_QA_URL || "https://staging.universalmind.tv/vogue/iam/induction.html";
const executablePath = process.env.CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const skipServerRedirect = process.env.MOBILE_INDUCTION_SKIP_SERVER_REDIRECT === "1";
const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

const chromiumServer = await chromium.launchServer({
  headless: true,
  executablePath,
  args: ["--mute-audio", "--autoplay-policy=user-gesture-required"],
});
const browserProcess = chromiumServer.process();
assert.ok(browserProcess?.spawnargs.includes("--mute-audio"), "Chromium must be process-muted before navigation");

const browser = await chromium.connect(chromiumServer.wsEndpoint());
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  screen: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  serviceWorkers: "block",
  userAgent,
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(String(error?.message || error)));

await page.addInitScript(() => {
  HTMLMediaElement.prototype.play = function blockedPlay() {
    return Promise.reject(new DOMException("Playback blocked by mobile induction QA", "NotAllowedError"));
  };
  const rejectFullscreen = () => Promise.reject(new DOMException("Fullscreen blocked by mobile induction QA", "NotAllowedError"));
  Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: rejectFullscreen });
  Object.defineProperty(Element.prototype, "webkitRequestFullscreen", { configurable: true, value: rejectFullscreen });
});

await page.route("**/*", async (route) => {
  if (route.request().resourceType() === "media") return route.abort("blockedbyclient");
  return route.continue();
});

try {
  const forcedUrl = new URL(baseUrl);
  forcedUrl.searchParams.set("mobile", "1");
  forcedUrl.searchParams.set("induction", "show");
  await page.goto(forcedUrl.href, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(500);
  await assertMobileInduction(page, "forced mobile induction");

  const cookies = await context.cookies();
  assert.equal(
    cookies.some((cookie) => cookie.name === "universalMindIAmInductionVisits"),
    false,
    "Mobile induction must not set the desktop auto-forward cookie",
  );

  const handoffUrl = skipServerRedirect
    ? new URL("induction.html?mobile=1", baseUrl)
    : new URL("vogue-self-report.html", baseUrl);
  await page.goto(handoffUrl.href, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(900);
  await assertMobileInduction(page, "mobile self-report redirect");

  await page.locator('.mobile-experience-notice a[href^="about.html"]').click();
  await page.waitForLoadState("domcontentloaded");
  assert.match(page.url(), /\/about\.html(?:\?|$)/, "Mobile editorial navigation must reach About");
  assert.equal(await page.locator("html").getAttribute("data-mobile-editorial"), "true");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Mobile page must not overflow horizontally");
  assert.deepEqual(pageErrors, [], `Mobile induction must not raise page errors: ${pageErrors.join(" | ")}`);

  console.log(JSON.stringify({
    processMuted: true,
    playbackBlockedBeforeNavigation: true,
    viewport: "390x844",
    selfReportRedirectSettled: !skipServerRedirect,
    editorialNavigation: "about.html",
    finalUrl: page.url(),
  }, null, 2));
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

async function assertMobileInduction(targetPage, label) {
  assert.match(targetPage.url(), /\/induction\.html(?:\?|$)/, `${label} must settle on induction`);
  assert.equal(await targetPage.locator("html").getAttribute("data-mobile-editorial"), "true", `${label} must activate mobile mode`);
  await assertVisible(targetPage.locator(".mobile-experience-notice"), `${label} notice`);
  await assertHidden(targetPage.locator(".induction-alternate__explore"), `${label} Explore link`);
  assert.equal(
    await targetPage.locator(".mobile-experience-notice nav a").count(),
    5,
    `${label} must expose the five approved editorial destinations`,
  );
  assert.equal(await targetPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${label} must not overflow horizontally`);
}

async function assertVisible(locator, label) {
  assert.equal(await locator.isVisible(), true, `${label} must be visible`);
}

async function assertHidden(locator, label) {
  assert.equal(await locator.isHidden(), true, `${label} must be hidden`);
}
