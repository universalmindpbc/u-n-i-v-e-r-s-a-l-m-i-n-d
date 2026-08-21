import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const requestedTarget = process.env.IAM_EMDR_DYNAMIC_POWER_TARGET || "";
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
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

const browser = await chromium.launch({
  executablePath: chromiumExecutable,
  headless: true,
  args: ["--mute-audio"],
});

const viewportCases = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

function assertPowerState(snapshot, { active, calls, controlsView, disabled = false }) {
  assert.equal(snapshot.active, active);
  assert.deepEqual(snapshot.activeCalls, calls);
  assert.equal(snapshot.controlsView, controlsView);
  assert.equal(snapshot.toggleText, active ? "on" : "off");
  assert.equal(snapshot.togglePressed, String(active));
  assert.equal(snapshot.toggleDisabled, disabled);
  assert.equal(snapshot.toggleVisible, true);
  assert.equal(snapshot.toggleClipped, false);
  assert.equal(snapshot.horizontalContainment, true, JSON.stringify(snapshot));
  assert.equal(snapshot.horizontalOverflow, false, JSON.stringify(snapshot));
  if (active) {
    assert.equal(snapshot.toggleBackground, "rgba(255, 255, 255, 0.18)");
    assert.equal(snapshot.toggleTransform, "none");
    assert.match(snapshot.toggleBoxShadow, /18px/);
    assert.equal(snapshot.toggleHighlighted, true);
    assert.equal(snapshot.toggleDepressed, false);
  } else {
    assert.equal(snapshot.toggleBackground, "rgba(0, 0, 0, 0.22)");
    assert.notEqual(snapshot.toggleTransform, "none");
    assert.match(snapshot.toggleBoxShadow, /inset/);
    assert.equal(snapshot.toggleHighlighted, false);
    assert.equal(snapshot.toggleDepressed, true);
  }
}

async function runViewport(viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  await context.addInitScript(() => {
    window.__iamEmdrMediaSafetyQa = { playCalls: 0, fullscreenCalls: 0, microphoneCalls: 0 };
    HTMLMediaElement.prototype.play = function blockedQaPlayback() {
      window.__iamEmdrMediaSafetyQa.playCalls += 1;
      return Promise.resolve();
    };
    Element.prototype.requestFullscreen = function blockedQaFullscreen() {
      window.__iamEmdrMediaSafetyQa.fullscreenCalls += 1;
      return Promise.reject(new Error("Fullscreen blocked by EMDR QA"));
    };
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia = () => {
        window.__iamEmdrMediaSafetyQa.microphoneCalls += 1;
        return Promise.reject(new Error("Microphone blocked by EMDR QA"));
      };
    }
  });
  const page = await context.newPage();
  const pageErrors = [];
  let blockedMediaRequests = 0;
  await page.route("**/*", (route) => {
    if (route.request().resourceType() === "media") {
      blockedMediaRequests += 1;
      route.abort();
      return;
    }
    route.continue();
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.IAMTelevisionRoom), null, { timeout: 60000 });
  await page.evaluate(() => {
    const state = {
      active: false,
      style: 0,
      intensity: 0.8,
      reactionEnabled: false,
      activeCalls: [],
    };
    window.__iamEmdrDynamicPowerQa = state;
    window.IAMEMDR = {
      get active() { return state.active; },
      get style() { return state.style; },
      get intensity() { return state.intensity; },
      get reactionEnabled() { return state.reactionEnabled; },
      setActive(active) {
        state.active = Boolean(active);
        state.activeCalls.push(state.active);
        return state.active;
      },
      setStyle(value) { state.style = Number(value); return state.style; },
      setIntensity(value) { state.intensity = Number(value); return state.intensity; },
      setReactionEnabled(value) { state.reactionEnabled = Boolean(value); return state.reactionEnabled; },
      setTimelineSource() {},
      setAudioSource() {},
      getAudioLevel() { return 0; },
    };
    document.body.classList.add("television-room-open", "television-wallet-pointer-locked");
    const wallet = document.querySelector("[data-reaction-wallet]");
    wallet.classList.add("is-reaction-wallet-open");
    wallet.dataset.walletView = "categories";
    document.querySelector("[data-wallet-categories]")?.setAttribute("aria-hidden", "false");
  });

  const settle = () => page.waitForTimeout(420);
  const click = async (selector) => {
    await page.$eval(selector, (element) => element.click());
    await settle();
  };
  const openEmdr = async () => {
    await click('[data-wallet-category="video"]');
    await click('[data-video-mode="emdr"]');
  };
  const inspect = () => page.evaluate(() => {
    const state = window.__iamEmdrDynamicPowerQa;
    const wallet = document.querySelector("[data-reaction-wallet]");
    const toggle = document.querySelector("[data-emdr-toggle]");
    const style = getComputedStyle(toggle);
    const toggleRect = toggle.getBoundingClientRect();
    return {
      active: state.active,
      activeCalls: [...state.activeCalls],
      walletView: wallet.dataset.walletView,
      controlsView: wallet.dataset.emdrControlsView,
      gifPressed: document.querySelector('[data-emdr-style-index="0"]')?.getAttribute("aria-pressed"),
      stellarPressed: document.querySelector('[data-emdr-style-index="1"]')?.getAttribute("aria-pressed"),
      toggleText: toggle.textContent.trim(),
      togglePressed: toggle.getAttribute("aria-pressed"),
      toggleDisabled: toggle.disabled,
      toggleVisible: Boolean(toggle.getClientRects().length),
      toggleClipped: toggle.scrollWidth > toggle.clientWidth,
      toggleBackground: style.backgroundColor,
      toggleBoxShadow: style.boxShadow,
      toggleTransform: style.transform,
      toggleHighlighted: state.active && style.transform === "none" && style.boxShadow.includes("18px"),
      toggleDepressed: !state.active && style.transform !== "none" && style.boxShadow.includes("inset"),
      horizontalContainment: toggleRect.left >= 0 && toggleRect.right <= window.innerWidth,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });

  await openEmdr();
  const neutralOff = await inspect();
  assertPowerState(neutralOff, { active: false, calls: [], controlsView: "neutral", disabled: true });

  await click('[data-emdr-style-index="0"]');
  const gifOn = await inspect();
  assertPowerState(gifOn, { active: true, calls: [true], controlsView: "gif" });
  assert.equal(gifOn.gifPressed, "true");

  await page.evaluate(() => { document.querySelector("[data-reaction-wallet]").dataset.emdrControlsView = "neutral"; });
  await settle();
  const neutralOn = await inspect();
  assertPowerState(neutralOn, { active: true, calls: [true], controlsView: "neutral" });
  await page.evaluate(() => { document.querySelector("[data-reaction-wallet]").dataset.emdrControlsView = "gif"; });

  await click("[data-emdr-toggle]");
  const gifOff = await inspect();
  assertPowerState(gifOff, { active: false, calls: [true, false], controlsView: "gif" });
  await click('[data-wallet-panel="emdr"] [data-wallet-home]');
  await openEmdr();
  const gifOffNavigation = await inspect();
  assertPowerState(gifOffNavigation, { active: false, calls: [true, false], controlsView: "gif" });

  await click("[data-emdr-toggle]");
  const gifOnAgain = await inspect();
  assertPowerState(gifOnAgain, { active: true, calls: [true, false, true], controlsView: "gif" });
  await click('[data-wallet-panel="emdr"] [data-wallet-home]');
  await openEmdr();
  const gifOnNavigation = await inspect();
  assertPowerState(gifOnNavigation, { active: true, calls: [true, false, true], controlsView: "gif" });

  await click('[data-emdr-style-index="1"]');
  const stellarOn = await inspect();
  assertPowerState(stellarOn, { active: true, calls: [true, false, true, true], controlsView: "stellar" });
  assert.equal(stellarOn.stellarPressed, "true");

  await click("[data-emdr-toggle]");
  const stellarOff = await inspect();
  assertPowerState(stellarOff, { active: false, calls: [true, false, true, true, false], controlsView: "stellar" });
  await click('[data-wallet-panel="emdr"] [data-wallet-home]');
  await openEmdr();
  const stellarOffNavigation = await inspect();
  assertPowerState(stellarOffNavigation, { active: false, calls: [true, false, true, true, false], controlsView: "stellar" });

  await click("[data-emdr-toggle]");
  const stellarOnAgain = await inspect();
  assertPowerState(stellarOnAgain, { active: true, calls: [true, false, true, true, false, true], controlsView: "stellar" });
  await click('[data-wallet-panel="emdr"] [data-wallet-home]');
  await openEmdr();
  const stellarOnNavigation = await inspect();
  assertPowerState(stellarOnNavigation, { active: true, calls: [true, false, true, true, false, true], controlsView: "stellar" });

  const safety = await page.evaluate(() => ({
    ...window.__iamEmdrMediaSafetyQa,
    mediaActuallyPlaying: [...document.querySelectorAll("audio, video")].some((media) => !media.paused && media.readyState >= 2 && media.currentTime > 0),
  }));
  assert.equal(safety.fullscreenCalls, 0);
  assert.equal(safety.microphoneCalls, 0);
  assert.deepEqual(pageErrors, []);

  await page.evaluate(() => {
    document.querySelectorAll("audio, video").forEach((media) => media.pause());
  });
  const mediaPlayingAfterCleanup = await page.evaluate(() =>
    [...document.querySelectorAll("audio, video")].some((media) => !media.paused)
  );
  assert.equal(mediaPlayingAfterCleanup, false);

  await context.close();
  return {
    viewport,
    neutralOff,
    neutralOn,
    gifOn,
    gifOff,
    gifOffNavigation,
    gifOnNavigation,
    stellarOn,
    stellarOff,
    stellarOffNavigation,
    stellarOnNavigation,
    safety: { ...safety, blockedMediaRequests, mediaPlayingAfterCleanup },
    pageErrors,
  };
}

try {
  const matrix = [];
  for (const viewport of viewportCases) matrix.push(await runViewport(viewport));
  console.log(JSON.stringify({ target, mutedProcess: true, matrix }, null, 2));
} finally {
  await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
