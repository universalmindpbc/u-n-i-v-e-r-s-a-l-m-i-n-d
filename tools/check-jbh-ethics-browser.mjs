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
    if (["127.0.0.1", "localhost", "staging.universalmind.tv"].includes(url.hostname)) return route.fallback();
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.IAMTelevisionRoom && window.IAMSexEdProgramme), null, { timeout: 60000 });
  await page.evaluate(() => {
    window.IAMStreamController = {
      async attach() { return true; },
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
  });
  await page.waitForFunction(() => document.querySelector("[data-sex-ed-shelf]")?.getAttribute("aria-hidden") === "false");
  await page.locator("[data-jbh-ethics-open]").click();
  await page.waitForFunction(() => document.querySelector("[data-jbh-ethics]")?.getAttribute("aria-hidden") === "false");
  await page.waitForTimeout(250);
  const state = await page.evaluate((viewportName) => {
    const modal = document.querySelector("[data-jbh-ethics]");
    const panel = modal.querySelector(".jbh-ethics__panel");
    const video = document.querySelector("[data-jbh-ethics-video]");
    const wallet = document.querySelector("[data-reaction-wallet]");
    wallet.dataset.walletView = "emdr";
    wallet.dataset.emdrControlsView = "gif";
    wallet.classList.add("is-reaction-wallet-open");
    const panelRect = panel.getBoundingClientRect();
    const walletRect = wallet.getBoundingClientRect();
    const emdrMediaStyle = getComputedStyle(document.querySelector("[data-emdr-jbh-background]"));
    const episode15Image = document.querySelector('[data-sex-ed-card][data-sex-ed-episode="15"] img')?.src || "";
    const episode16Image = document.querySelector('[data-sex-ed-card][data-sex-ed-episode="16"] img')?.src || "";
    return {
      modalOpen: modal.getAttribute("aria-hidden"),
      modalInsideFullscreenOwner: Boolean(document.querySelector(".site-shell")?.contains(modal)),
      panelRect: { x: panelRect.x, y: panelRect.y, width: panelRect.width, height: panelRect.height },
      panelOverflowX: panel.scrollWidth - panel.clientWidth,
      panelOverflowY: panel.scrollHeight - panel.clientHeight,
      floraCount: modal.querySelectorAll(".jbh-ethics__geometry .adaptive-television-reaction__glyph--flora-trigger").length,
      lsiDecode: modal.querySelector(".jbh-ethics__decode")?.textContent.trim(),
      diversityCopy: modal.querySelector(".jbh-ethics__principles")?.textContent.replace(/\s+/g, " ").trim(),
      videoFile: video.dataset.streamFile,
      videoMuted: video.muted,
      videoVolume: video.volume,
      videoRole: video.dataset.streamRole,
      videoPlayRequested: video.dataset.qaPlayRequested,
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
  assert.equal(desktopState.floraCount, 3);
  assert.match(desktopState.lsiDecode, /^LSI — Love · Sex · Intelligence$/);
  assert.match(desktopState.diversityCopy, /age, race, gender, identity, lived experience and opportunity/);
  assert.match(desktopState.diversityCopy, /non-binary people and others/);
  assert.match(desktopState.diversityCopy, /transgender people and gay men/);
  assert.equal(desktopState.videoFile, "The Shamen - LSI (Love Sex Intelligence) HD_1.mp4");
  assert.equal(desktopState.videoMuted, false);
  assert.equal(desktopState.videoVolume, 1);
  assert.equal(desktopState.videoRole, "music");
  assert.equal(desktopState.videoPlayRequested, "true");
  assert.ok(desktopState.panelRect.x >= 0 && desktopState.panelRect.y >= 0);
  assert.ok(desktopState.panelRect.x + desktopState.panelRect.width <= 1952);
  assert.ok(desktopState.panelRect.y + desktopState.panelRect.height <= 1269);
  assert.ok(desktopState.panelOverflowX <= 1);
  assert.ok(desktopState.walletWidth >= 1400, `Expected the desktop GIF wallet to widen; received ${desktopState.walletWidth}px.`);
  assert.equal(desktopState.safariUserSelect, "none");
  assert.match(desktopState.episode15Image, /d064fc7c011c38b9423b0b177ef61368\/thumbnails\/thumbnail\.jpg\?time=450s/);
  assert.match(desktopState.episode16Image, /2c099816dba26973d4d4d36452d05f99\/thumbnails\/thumbnail\.jpg\?time=600s/);
  await desktopPage.screenshot({ path: "/private/tmp/jbh-ethics-browser.png", fullPage: false });
  await desktopPage.locator(".jbh-ethics__close").click();
  const closedState = await desktopPage.evaluate(() => ({
    hidden: document.querySelector("[data-jbh-ethics]")?.getAttribute("aria-hidden"),
    inert: document.querySelector("[data-jbh-ethics]")?.hasAttribute("inert"),
    muted: document.querySelector("[data-jbh-ethics-video]")?.muted,
    released: document.querySelector("[data-jbh-ethics-video]")?.dataset.qaReleased,
  }));
  assert.deepEqual(closedState, { hidden: "true", inert: true, muted: true, released: "true" });
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const { state: mobileState } = await preparePage(mobile, "mobile");
  assert.ok(mobileState.panelRect.x >= 0 && mobileState.panelRect.y >= 0);
  assert.ok(mobileState.panelRect.x + mobileState.panelRect.width <= 390);
  assert.ok(mobileState.panelRect.y + mobileState.panelRect.height <= 844);
  assert.ok(mobileState.panelOverflowX <= 1);
  assert.ok(mobileState.panelOverflowY > 0, "The compact modal should scroll vertically rather than escape the viewport.");
  await mobile.close();

  console.log(JSON.stringify({ target, mutedProcess: true, desktopState, mobileState, screenshot: "/private/tmp/jbh-ethics-browser.png" }, null, 2));
} finally {
  await browser.close();
  await chromiumServer.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
