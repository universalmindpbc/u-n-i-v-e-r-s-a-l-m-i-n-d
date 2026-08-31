import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const requestedTarget = process.env.IAM_JBH_ETHICS_TARGET || "";
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
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

const chromiumServer = await chromium.launchServer({
  executablePath: chromiumExecutable,
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
assert.ok(chromiumServer.process()?.spawnargs?.includes("--mute-audio"), "Chromium must be process-muted before navigation.");
const browser = await chromium.connect(chromiumServer.wsEndpoint());

async function preparePage(context, viewportName) {
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (["127.0.0.1", "localhost", "staging.universalmind.tv", "customer-1vpwglz3v6fiyaas.cloudflarestream.com"].includes(url.hostname)) return route.fallback();
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.IAMTelevisionRoom && window.IAMSexEdProgramme), null, { timeout: 60000 });
  await page.evaluate(() => {
    window.IAMStreamController = {
      async attach(video) {
        if (video?.matches?.("[data-emdr-jbh-foreground]")) {
          Object.defineProperty(video, "videoWidth", { configurable: true, get: () => 1280 });
          Object.defineProperty(video, "videoHeight", { configurable: true, get: () => 720 });
        }
        return true;
      },
      async play(video) {
        Object.defineProperty(video, "paused", { configurable: true, get: () => false });
        Object.defineProperty(video, "readyState", { configurable: true, get: () => 4 });
        video.dataset.qaPlayRequested = "true";
        return true;
      },
      release(video) {
        if (video) video.dataset.qaReleased = "true";
      },
      setPriority() {},
    };
    window.IAMTelevisionRoom.preparePresentationEntry();
    window.IAMSexEdProgramme.openShelf();
    const ethicsVideo = document.querySelector("[data-jbh-ethics-video]");
    ethicsVideo.poster = "https://customer-1vpwglz3v6fiyaas.cloudflarestream.com/181f8904e190da728c3dce0ac00de471/thumbnails/thumbnail.jpg?time=60s&width=1280&height=720&fit=crop";
    const underlying = document.createElement("audio");
    underlying.dataset.qaUnderlyingProgramme = "true";
    underlying.volume = .68;
    underlying.muted = false;
    document.querySelector(".site-shell").append(underlying);
    const foregroundCanvas = document.querySelector("[data-emdr-jbh-foreground-canvas]");
    const foregroundContext = {
      globalAlpha: 1,
      fillStyle: "#000",
      fillRect() {},
      drawImage() {},
    };
    foregroundCanvas.getContext = () => foregroundContext;
    window.dispatchEvent(new CustomEvent("iam:emdr-gif-presentation", { detail: { active: true, preset: "jbh-ii" } }));
  });
  await page.waitForFunction(() => document.body.dataset.emdrJbhForegroundRenderer === "canvas", null, { timeout: 10000 });
  await page.evaluate(() => {
    const canvas = document.querySelector("[data-emdr-jbh-foreground-canvas]");
    const video = document.querySelector("[data-emdr-jbh-foreground]");
    window.__qaCanvasRendererState = {
      renderer: document.body.dataset.emdrJbhForegroundRenderer,
      mirror: canvas.dataset.jbhForegroundMirror,
      canvasOpacity: getComputedStyle(canvas).opacity,
      videoOpacity: getComputedStyle(video).opacity,
      videoClipPath: getComputedStyle(video).clipPath,
    };
    window.dispatchEvent(new CustomEvent("iam:emdr-gif-presentation", { detail: { active: false, preset: "jbh-ii" } }));
  });
  await page.waitForFunction(() => document.querySelector("[data-sex-ed-shelf]")?.getAttribute("aria-hidden") === "false");
  await page.locator("[data-jbh-ethics-open]").click();
  await page.waitForFunction(() => document.querySelector("[data-jbh-ethics]")?.getAttribute("aria-hidden") === "false");
  await page.waitForTimeout(250);
  const state = await page.evaluate((viewportName) => {
    const modal = document.querySelector("[data-jbh-ethics]");
    const panel = modal.querySelector(".jbh-ethics__panel");
    const band = modal.querySelector(".jbh-ethics__band");
    const video = document.querySelector("[data-jbh-ethics-video]");
    const underlying = document.querySelector("[data-qa-underlying-programme]");
    const wallet = document.querySelector("[data-reaction-wallet]");
    wallet.dataset.walletView = "emdr";
    wallet.dataset.emdrControlsView = "gif";
    wallet.classList.add("is-reaction-wallet-open");
    const panelRect = panel.getBoundingClientRect();
    const bandRect = band.getBoundingClientRect();
    const geometryRect = modal.querySelector(".jbh-ethics__geometry").getBoundingClientRect();
    const walletRect = wallet.getBoundingClientRect();
    const emdrMediaStyle = getComputedStyle(document.querySelector("[data-emdr-jbh-background]"));
    const episode15Image = document.querySelector('[data-sex-ed-card][data-sex-ed-episode="15"] img')?.src || "";
    const episode16Image = document.querySelector('[data-sex-ed-card][data-sex-ed-episode="16"] img')?.src || "";
    return {
      modalOpen: modal.getAttribute("aria-hidden"),
      modalInsideFullscreenOwner: Boolean(document.querySelector(".site-shell")?.contains(modal)),
      panelRect: { x: panelRect.x, y: panelRect.y, width: panelRect.width, height: panelRect.height },
      bandRect: { x: bandRect.x, y: bandRect.y, width: bandRect.width, height: bandRect.height },
      bandOverflowX: band.scrollWidth - band.clientWidth,
      bandOverflowY: band.scrollHeight - band.clientHeight,
      bandBackground: getComputedStyle(band).backgroundColor,
      backgroundVideoOpacity: Number(getComputedStyle(video).opacity),
      geometryWidth: geometryRect.width,
      floraCount: modal.querySelectorAll(".jbh-ethics__geometry .adaptive-television-reaction__glyph--flora-trigger").length,
      lsiDecode: modal.querySelector(".jbh-ethics__decode")?.textContent.trim(),
      title: modal.querySelector("#jbh-ethics-title")?.textContent.trim(),
      ethicsLink: document.querySelector("[data-jbh-ethics-open]")?.textContent.trim(),
      introduction: modal.querySelector(".jbh-ethics__introduction")?.textContent.replace(/\s+/g, " ").trim(),
      values: Array.from(modal.querySelectorAll(".jbh-ethics__values li"), (item) => item.textContent.trim()),
      tagCount: modal.querySelectorAll(".jbh-ethics__values span, [role='listitem']").length,
      diversityCopy: modal.querySelector(".jbh-ethics__principles")?.textContent.replace(/\s+/g, " ").trim(),
      videoFile: video.dataset.streamFile,
      videoMuted: video.muted,
      videoVolume: video.volume,
      videoRole: video.dataset.streamRole,
      videoPlayRequested: video.dataset.qaPlayRequested,
      underlyingMuted: underlying.muted,
      underlyingVolume: underlying.volume,
      hardMuted: document.body.dataset.jbhEthicsProgrammeHardMuted,
      mixLevel: document.body.dataset.jbhEthicsProgrammeMixLevel,
      canvasRendererState: window.__qaCanvasRendererState,
      walletWidth: walletRect.width,
      safariUserSelect: emdrMediaStyle.userSelect,
      episode15Image,
      episode16Image,
      pageCount: window.__qaPageCount,
      viewportName,
    };
  }, viewportName);
  return { page, state };
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1952, height: 1269 } });
  await desktop.addInitScript(() => { window.__qaPageCount = 1; });
  const { page: desktopPage, state: desktopState } = await preparePage(desktop, "desktop");
  assert.equal(desktopState.modalOpen, "false");
  assert.equal(desktopState.modalInsideFullscreenOwner, true);
  assert.equal(desktopState.title, "Ethics");
  assert.equal(desktopState.ethicsLink, "ethics");
  assert.equal(desktopState.floraCount, 3);
  assert.match(desktopState.lsiDecode, /^LSI — Love · Sex · Intelligence$/);
  assert.match(desktopState.introduction, /^James Bondage is 24\/7 electronic music television broadcasting sex x mindfulness/);
  assert.match(desktopState.introduction, /Our James Bondage Health series \[ sex-ed \] shares female lead conversations/);
  assert.equal(desktopState.values.length, 17);
  assert.deepEqual(desktopState.values.slice(0, 4), ["LSI triangle (love, sex, intelligence)", "female first", "all female hosted", "no more violence"]);
  assert.equal(desktopState.values.at(-1), "powered via ethics.org.au");
  assert.equal(desktopState.tagCount, 0);
  assert.match(desktopState.diversityCopy, /age, race, gender, identity, lived experience and opportunity/);
  assert.match(desktopState.diversityCopy, /non-binary people and others/);
  assert.match(desktopState.diversityCopy, /transgender people and gay men/);
  assert.equal(desktopState.videoFile, "The Shamen - LSI (Love Sex Intelligence) HD_1.mp4");
  assert.equal(desktopState.videoMuted, false);
  assert.equal(desktopState.videoVolume, 1);
  assert.equal(desktopState.videoRole, "music");
  assert.equal(desktopState.videoPlayRequested, "true");
  assert.equal(desktopState.underlyingMuted, true);
  assert.equal(desktopState.underlyingVolume, 0);
  assert.equal(desktopState.hardMuted, "true");
  assert.equal(desktopState.mixLevel, "0");
  assert.deepEqual(desktopState.canvasRendererState, {
    renderer: "canvas",
    mirror: "ready",
    canvasOpacity: "1",
    videoOpacity: "0",
    videoClipPath: "inset(50%)",
  });
  assert.ok(desktopState.backgroundVideoOpacity >= .9);
  assert.equal(desktopState.bandBackground, "rgb(5, 3, 6)");
  assert.ok(desktopState.geometryWidth <= 160, `Expected a restrained LSI mark; received ${desktopState.geometryWidth}px.`);
  assert.ok(desktopState.panelRect.x >= 0 && desktopState.panelRect.y >= 0);
  assert.ok(desktopState.panelRect.x + desktopState.panelRect.width <= 1952);
  assert.ok(desktopState.panelRect.y + desktopState.panelRect.height <= 1269);
  assert.ok(desktopState.bandRect.y >= 100 && desktopState.bandRect.y + desktopState.bandRect.height <= 1169, "The LSI film must remain visible above and below the central black band.");
  assert.ok(desktopState.bandOverflowX <= 1);
  assert.ok(desktopState.walletWidth >= 1400, `Expected the desktop GIF wallet to widen; received ${desktopState.walletWidth}px.`);
  assert.equal(desktopState.safariUserSelect, "none");
  assert.match(desktopState.episode15Image, /3be25d8ba3bb884e35ab57cc6f5c43c3\/thumbnails\/thumbnail\.jpg\?time=330s/);
  assert.match(desktopState.episode16Image, /2c099816dba26973d4d4d36452d05f99\/thumbnails\/thumbnail\.jpg\?time=600s/);
  await desktopPage.screenshot({ path: "/private/tmp/jbh-ethics-browser.png", fullPage: false });
  await desktopPage.locator(".jbh-ethics__close").click();
  await desktopPage.waitForTimeout(520);
  for (let pageIndex = 0; pageIndex < 3; pageIndex += 1) {
    await desktopPage.locator("[data-sex-ed-shelf-next]").click();
    await desktopPage.waitForTimeout(240);
  }
  await desktopPage.waitForFunction(() => document.querySelector("[data-sex-ed-shelf-counter]")?.textContent.trim() === "13–16 / 16");
  await desktopPage.screenshot({ path: "/private/tmp/jbh-sex-ed-shelf.png", fullPage: false });
  const closedState = await desktopPage.evaluate(() => ({
    hidden: document.querySelector("[data-jbh-ethics]")?.getAttribute("aria-hidden"),
    inert: document.querySelector("[data-jbh-ethics]")?.hasAttribute("inert"),
    muted: document.querySelector("[data-jbh-ethics-video]")?.muted,
    released: document.querySelector("[data-jbh-ethics-video]")?.dataset.qaReleased,
    underlyingMuted: document.querySelector("[data-qa-underlying-programme]")?.muted,
    underlyingVolume: document.querySelector("[data-qa-underlying-programme]")?.volume,
  }));
  assert.equal(closedState.hidden, "true");
  assert.equal(closedState.inert, true);
  assert.equal(closedState.muted, true);
  assert.equal(closedState.released, "true");
  assert.equal(closedState.underlyingMuted, false);
  assert.ok(Math.abs(closedState.underlyingVolume - .68) < .01);
  await desktopPage.locator('[data-sex-ed-card][data-sex-ed-episode="15"]').click();
  await desktopPage.waitForFunction(() => document.querySelector("[data-jbh-content-gate]")?.getAttribute("aria-hidden") === "false");
  await desktopPage.locator("[data-jbh-content-gate-confirm]").click();
  await desktopPage.waitForFunction(() => document.body.dataset.sexEdEpisode === "15");
  const episode15State = await desktopPage.evaluate(() => ({
    episode: document.body.dataset.sexEdEpisode,
    presentation: document.body.dataset.sexEdPresentation,
    foregroundMuted: document.body.dataset.sexEdForegroundMuted,
    backgroundAudible: document.body.dataset.sexEdBackgroundAudible,
    foregroundFile: document.querySelector("[data-sex-ed-shell-video]")?.dataset.streamFile,
    backgroundFile: document.querySelector("[data-sex-ed-background]")?.dataset.streamFile,
  }));
  assert.deepEqual(episode15State, {
    episode: "15",
    presentation: "jbh-editorial",
    foregroundMuted: "true",
    backgroundAudible: "true",
    foregroundFile: "Pirelli 2010 Calendar.mp4",
    backgroundFile: "Shashi Solluna - How I Healed my Sexual Pain using Nature +12dB.mp4",
  });
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const { state: mobileState } = await preparePage(mobile, "mobile");
  assert.ok(mobileState.panelRect.x >= 0 && mobileState.panelRect.y >= 0);
  assert.ok(mobileState.panelRect.x + mobileState.panelRect.width <= 390);
  assert.ok(mobileState.panelRect.y + mobileState.panelRect.height <= 844);
  assert.ok(mobileState.bandOverflowX <= 1);
  assert.ok(mobileState.bandOverflowY > 0, "The compact black band should scroll vertically rather than escape the viewport.");
  assert.equal(mobileState.bandBackground, "rgb(5, 3, 6)");
  await mobile.close();

  console.log(JSON.stringify({ target, mutedProcess: true, desktopState, episode15State, mobileState, screenshot: "/private/tmp/jbh-ethics-browser.png" }, null, 2));
} finally {
  await browser.close();
  await chromiumServer.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
