import assert from "node:assert/strict";
import fs from "node:fs";

const playwrightModule = process.env.PLAYWRIGHT_MODULE || "playwright";
const { chromium } = await import(playwrightModule);

const baseUrl = process.env.SCIENCE_QA_BASE_URL || "http://127.0.0.1:8765";
const allowedHost = new URL(baseUrl).hostname;
const screenshotDir = process.env.SCIENCE_QA_SCREENSHOT_DIR || "/private/tmp";
const shopUrl = `${baseUrl}/i%20%20a%20m/shop.html?standalone=1`;
const expectedScienceUrl = `${baseUrl}/i%20%20a%20m/shop-science.html`;
const screenshotNames = [
  "jb-shop-science-editorial-desktop.png",
  "jb-shop-science-editorial-table-desktop.png",
  "jb-shop-science-editorial-mobile.png",
  "jb-shop-science-editorial-cards-mobile.png",
];

function normalize(value) {
  return value.replace(/[“”]/g, "").replace(/\s+/g, " ").trim();
}

async function launchMutedBrowser() {
  const server = await chromium.launchServer({
    headless: true,
    args: ["--mute-audio", "--autoplay-policy=user-gesture-required"],
  });
  const process = server.process();
  assert.ok(process, "Chromium process must be observable");
  assert.ok(process.spawnargs.includes("--mute-audio"), "Chromium must be process-muted before navigation");
  const browser = await chromium.connect(server.wsEndpoint());
  return { browser, server };
}

async function openScienceFromShop(viewport) {
  const { browser, server } = await launchMutedBrowser();
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
    permissions: [],
    serviceWorkers: "block",
  });
  const telemetry = {
    blocked: { media: 0, external: 0 },
    consoleErrors: [],
    pageErrors: [],
    localFailures: [],
    badLocalResponses: [],
  };

  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.resourceType() === "media") {
      telemetry.blocked.media += 1;
      await route.abort("blockedbyclient");
      return;
    }
    if (url.hostname !== allowedHost) {
      telemetry.blocked.external += 1;
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });

  function monitor(page) {
    page.on("console", (message) => {
      const text = message.text();
      if (message.type() === "error" && !text.includes("ERR_BLOCKED_BY_CLIENT")) telemetry.consoleErrors.push(`${page.url()} :: ${text}`);
    });
    page.on("pageerror", (error) => telemetry.pageErrors.push(`${page.url()} :: ${error.message}`));
    page.on("requestfailed", (request) => {
      const url = new URL(request.url());
      if (url.hostname === allowedHost && request.resourceType() !== "media") {
        telemetry.localFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || "failed"}`);
      }
    });
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.hostname === allowedHost && response.status() >= 400 && response.request().resourceType() !== "media") {
        telemetry.badLocalResponses.push(`${response.status()} ${response.url()}`);
      }
    });
  }

  context.on("page", monitor);
  const shopPage = await context.newPage();
  await shopPage.goto(shopUrl, { waitUntil: "domcontentloaded" });
  await shopPage.waitForSelector(".shop-masthead__nav", { state: "visible" });
  assert.equal(await shopPage.locator("[data-shop-science]").count(), 0, "Normal Shop must not contain inline SCIENCE content");
  assert.equal(await shopPage.locator("link[href*='shop-science.css'], script[src*='shop-science']").count(), 0, "Normal Shop must not load SCIENCE assets");
  const scienceLink = shopPage.locator(".shop-masthead__nav > a[href='shop-science.html']");
  assert.equal(await scienceLink.getAttribute("target"), "_blank", "Shop SCIENCE must request a new browser tab");
  assert.equal(await scienceLink.getAttribute("rel"), "noopener", "New SCIENCE tab must be isolated");
  assert.equal(await scienceLink.evaluate((node) => node.previousElementSibling?.getAttribute("href")), "#sex-ed", "SCIENCE must sit immediately after SEX ED");

  await shopPage.evaluate(() => { window.location.hash = "#catalogue/all"; });
  await shopPage.waitForFunction(() => document.body.dataset.shopView === "catalogue");
  const catalogueProducts = await shopPage.locator("[data-catalogue-grid] [data-catalogue-product]").count();
  assert.ok(catalogueProducts > 0, "Normal Shop catalogue must still render after removing inline SCIENCE");
  await shopPage.evaluate(() => { window.location.hash = "#top"; });
  await shopPage.waitForFunction(() => document.body.dataset.shopView === "editorial");

  const sciencePagePromise = context.waitForEvent("page");
  await scienceLink.click();
  const sciencePage = await sciencePagePromise;
  await sciencePage.waitForLoadState("domcontentloaded");
  await sciencePage.waitForSelector("[data-shop-science]", { state: "visible" });
  await sciencePage.waitForFunction(() => document.querySelectorAll("[data-science-brand-rows] > tr:not(.shop-material__detail)").length === 27);
  assert.equal(sciencePage.url(), expectedScienceUrl, "Shop link must open the dedicated SCIENCE route");
  assert.equal(context.pages().length, 2, "SCIENCE must be a separate browser tab from Shop");

  return { browser, server, context, shopPage, sciencePage, telemetry, catalogueProducts };
}

async function checkShared(page) {
  assert.equal(normalize(await page.locator("#shop-science-title").innerText()), "THE SCIENCE OF FEELING LIKE YOURSELF");
  assert.equal(normalize(await page.locator(".science-hero__lead").innerText()), "What we choose to wear can change how we feel in our bodies.");
  assert.equal(normalize(await page.locator("#shop-science-hypothesis-title").innerText()), "In consenting adults, wearing a self-selected, well-fitting James Bondage [ health ] intimate garment designed for tactile comfort, adjustability and personally meaningful self-expression will produce short-term improvements in state body appreciation, perceived agency, comfort and positive affect, compared with a materially and fit-matched neutral garment.");
  assert.ok(await page.locator(".science-hero__portrait img").evaluate((image) => image.complete && image.naturalWidth > 0), "Hero photography must render");
  assert.ok(await page.locator(".science-page img").count() >= 10, "Page must retain photography and flower cues");
  assert.equal(await page.locator("[data-science-silent-video]").count(), 1, "Page must retain the editorial fashion film");
  assert.equal(await page.locator("[data-science-silent-video]").evaluate((video) => video.muted && video.defaultMuted), true, "Editorial film must be explicitly muted");
  assert.ok(await page.locator(".science-flower").count() >= 5, "Universal Mind flower must cue the editorial journey");

  const heroColors = await page.locator(".science-hero__copy").evaluate((node) => ({ background: getComputedStyle(node.parentElement).backgroundColor, color: getComputedStyle(node).color }));
  assert.notEqual(heroColors.background, "rgb(0, 0, 0)", "Hero must not return to black-background treatment");
  assert.notEqual(heroColors.color, "rgb(255, 255, 255)", "Hero headlines must not return to white-on-black treatment");

  const research = page.locator("[data-science-research]");
  assert.equal(await research.getAttribute("open"), null, "Research must initially be collapsed");
  await research.locator(":scope > summary").click();
  assert.equal(await research.getAttribute("open"), "");
  assert.equal(await page.locator(".shop-science__study").count(), 15);
  assert.equal(await page.locator(".shop-science__study a").count(), 15);
  await research.locator(":scope > summary").click();
  assert.equal(await research.getAttribute("open"), null);

  for (const selector of ["[data-science-method]", "[data-science-material-notes]"]) {
    const detail = page.locator(selector);
    assert.equal(await detail.getAttribute("open"), null);
    await detail.locator(":scope > summary").click();
    assert.equal(await detail.getAttribute("open"), "");
    await detail.locator(":scope > summary").click();
    assert.equal(await detail.getAttribute("open"), null);
  }

  assert.equal(await page.locator("[data-science-brand-rows] > tr:not(.shop-material__detail)").count(), 27);
  assert.equal(await page.locator("[data-science-brand-cards] > details").count(), 27);
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.ok(dimensions.scrollWidth <= dimensions.clientWidth + 1, `${label} must not overflow horizontally: ${JSON.stringify(dimensions)}`);
  return dimensions;
}

async function assertTelemetryClean(result, label) {
  await result.sciencePage.waitForTimeout(500);
  assert.deepEqual(result.telemetry.pageErrors, [], `${label} page errors: ${result.telemetry.pageErrors.join(" | ")}`);
  assert.deepEqual(result.telemetry.localFailures, [], `${label} same-origin failures: ${result.telemetry.localFailures.join(" | ")}`);
  assert.deepEqual(result.telemetry.badLocalResponses, [], `${label} bad same-origin responses: ${result.telemetry.badLocalResponses.join(" | ")}`);
  assert.deepEqual(result.telemetry.consoleErrors, [], `${label} actionable console errors: ${result.telemetry.consoleErrors.join(" | ")}`);
}

const report = { url: expectedScienceUrl };

let desktop;
try {
  desktop = await openScienceFromShop({ width: 1440, height: 1000 });
  await checkShared(desktop.sciencePage);
  const toggles = desktop.sciencePage.locator(".shop-material__evidence-toggle");
  assert.equal(await toggles.count(), 27);
  for (let index = 0; index < 27; index += 1) {
    const toggle = toggles.nth(index);
    const targetId = await toggle.getAttribute("aria-controls");
    assert.ok(targetId);
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-expanded"), "true");
    assert.ok(await desktop.sciencePage.locator(`#${targetId}`).isVisible());
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  }
  await toggles.first().click();
  report.desktopRowColors = await desktop.sciencePage.locator("[data-science-brand-rows] > tr:not(.shop-material__detail)").evaluateAll((rows) => Array.from(new Set(rows.map((row) => getComputedStyle(row.firstElementChild).backgroundColor))));
  assert.ok(report.desktopRowColors.length >= 6, `Desktop table must use a meaningful colour rhythm: ${report.desktopRowColors.join(", ")}`);
  report.desktopOverflow = await assertNoHorizontalOverflow(desktop.sciencePage, "Desktop SCIENCE");
  report.desktopCatalogueProducts = desktop.catalogueProducts;
  report.desktopBlocked = desktop.telemetry.blocked;
  await desktop.sciencePage.screenshot({ path: `${screenshotDir}/${screenshotNames[0]}`, fullPage: true });
  await desktop.sciencePage.locator(".shop-material__ratings").screenshot({ path: `${screenshotDir}/${screenshotNames[1]}` });
  await assertTelemetryClean(desktop, "Desktop");
} finally {
  if (desktop) {
    await desktop.context.close().catch(() => {});
    await desktop.browser.close().catch(() => {});
    await desktop.server.close().catch(() => {});
  }
}

let mobile;
try {
  mobile = await openScienceFromShop({ width: 390, height: 844 });
  await checkShared(mobile.sciencePage);
  assert.equal(await mobile.sciencePage.locator(".shop-material__table-wrap").evaluate((node) => getComputedStyle(node).display), "none");
  assert.equal(await mobile.sciencePage.locator(".shop-material__cards").evaluate((node) => getComputedStyle(node).display), "grid");
  const cards = mobile.sciencePage.locator(".shop-material__card");
  assert.equal(await cards.count(), 27);
  for (let index = 0; index < 27; index += 1) {
    const card = cards.nth(index);
    assert.equal(await card.getAttribute("open"), null);
    await card.locator(":scope > summary").click();
    assert.equal(await card.getAttribute("open"), "");
    assert.match(normalize(await card.innerText()), /Material Intelligence/i);
    assert.match(normalize(await card.innerText()), /Responsible Making/i);
    assert.match(normalize(await card.innerText()), /Evidence state:/);
    await card.locator(":scope > summary").click();
  }
  await cards.first().locator(":scope > summary").click();
  report.mobileCardColors = await cards.evaluateAll((nodes) => Array.from(new Set(nodes.map((node) => getComputedStyle(node).backgroundColor))));
  assert.ok(report.mobileCardColors.length >= 6, `Mobile disclosures must use a meaningful colour rhythm: ${report.mobileCardColors.join(", ")}`);
  report.mobileOverflow = await assertNoHorizontalOverflow(mobile.sciencePage, "Mobile SCIENCE");
  report.mobileCatalogueProducts = mobile.catalogueProducts;
  report.mobileBlocked = mobile.telemetry.blocked;
  await mobile.sciencePage.screenshot({ path: `${screenshotDir}/${screenshotNames[2]}`, fullPage: true });
  await mobile.sciencePage.locator(".shop-material__ratings").screenshot({ path: `${screenshotDir}/${screenshotNames[3]}` });
  await assertTelemetryClean(mobile, "Mobile");
} finally {
  if (mobile) {
    await mobile.context.close().catch(() => {});
    await mobile.browser.close().catch(() => {});
    await mobile.server.close().catch(() => {});
  }
}

for (const screenshot of screenshotNames) {
  assert.ok(fs.statSync(`${screenshotDir}/${screenshot}`).size > 50_000, `${screenshot} must contain rendered visual proof`);
}

console.log(JSON.stringify(report, null, 2));
console.log("Shop SCIENCE browser checks passed: new-tab journey, restored Shop flow, warm editorial design, photography/film/flower cues, colour evidence projections, accessibility, responsive layout, and clean local runtime.");
