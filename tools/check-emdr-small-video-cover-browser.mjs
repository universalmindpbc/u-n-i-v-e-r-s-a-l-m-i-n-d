import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || "/", "http://127.0.0.1").pathname);
    const relative = pathname.replace(/^\/vogue\/iam\/?/, "") || "index.html";
    const requestedPath = path.resolve(iam, relative);
    if (!requestedPath.startsWith(`${iam}${path.sep}`) && requestedPath !== iam) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const bytes = await fs.readFile(requestedPath);
    response.writeHead(200, {
      "content-type": contentTypes.get(path.extname(requestedPath).toLowerCase()) || "application/octet-stream",
    });
    response.end(bytes);
  } catch {
    response.writeHead(404).end("Not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const target = `http://127.0.0.1:${server.address().port}/vogue/iam/index.html`;

const chromiumServer = await chromium.launchServer({
  executablePath: chromiumExecutable,
  headless: true,
  args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"],
});
const browserProcess = chromiumServer.process();
assert.ok(browserProcess, "Chromium process must be observable");
assert.ok(browserProcess.spawnargs.includes("--mute-audio"), "Chromium must be process-muted before navigation");
const browser = await chromium.connect(chromiumServer.wsEndpoint());

const cases = [
  {
    name: "desktop-pillar-matte-crossfade",
    viewport: { width: 1440, height: 900 },
    music: { width: 160, height: 90, matte: "pillar", inset: 25, color: [244, 54, 52] },
    crossfade: true,
  },
  {
    name: "mobile-letter-matte",
    viewport: { width: 390, height: 844 },
    music: { width: 160, height: 90, matte: "letter", inset: 13, color: [70, 220, 92] },
  },
  {
    name: "desktop-portrait-source",
    viewport: { width: 1440, height: 900 },
    music: { width: 90, height: 160, matte: "none", inset: 0, color: [238, 174, 48] },
  },
  {
    name: "mobile-square-source",
    viewport: { width: 390, height: 844 },
    music: { width: 120, height: 120, matte: "none", inset: 0, color: [218, 86, 230] },
  },
];

const results = [];

try {
  for (const testCase of cases) results.push(await runCase(testCase));
} finally {
  await browser.close().catch(() => null);
  await chromiumServer.close().catch(() => null);
  await new Promise((resolve) => server.close(resolve));
}

assert.ok(browserProcess.exitCode !== null || browserProcess.killed, "Owned muted Chromium process must close");
console.log(JSON.stringify({ target, mutedProcess: true, results }, null, 2));

async function runCase(testCase) {
  const context = await browser.newContext({ viewport: testCase.viewport });
  await context.addInitScript(() => {
    window.__iamSmallVideoSafety = { fullscreenCalls: 0, microphoneCalls: 0 };
    Element.prototype.requestFullscreen = function blockedFullscreen() {
      window.__iamSmallVideoSafety.fullscreenCalls += 1;
      return Promise.reject(new Error("Fullscreen blocked by EMDR small-video QA"));
    };
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia = () => {
        window.__iamSmallVideoSafety.microphoneCalls += 1;
        return Promise.reject(new Error("Microphone blocked by EMDR small-video QA"));
      };
    }
  });
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") {
      route.abort();
      return;
    }
    if (request.resourceType() === "media") {
      route.abort();
      return;
    }
    route.continue();
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.IAMTelevisionRoom), null, { timeout: 60000 });
  await page.evaluate(() => window.IAMTelevisionRoom.preparePresentationEntry());
  await page.waitForSelector(".adaptive-television-local-video", { state: "attached", timeout: 60000 });

  await page.evaluate(async ({ music }) => {
    const waitForEvent = (target, eventName, timeoutMs = 10000) => new Promise((resolve, reject) => {
      if (target.readyState >= HTMLMediaElement.HAVE_METADATA) {
        resolve();
        return;
      }
      const timeout = window.setTimeout(() => reject(new Error(`${eventName} timeout`)), timeoutMs);
      target.addEventListener(eventName, () => {
        window.clearTimeout(timeout);
        resolve();
      }, { once: true });
    });
    const createFeed = async (video, spec) => {
      window.IAMStreamController?.detach?.(video);
      try { video.pause(); } catch {}
      video.removeAttribute("src");
      video.srcObject = null;
      const canvas = document.createElement("canvas");
      canvas.width = spec.width;
      canvas.height = spec.height;
      const context = canvas.getContext("2d", { alpha: false });
      let frame = 0;
      const draw = () => {
        context.fillStyle = "#000";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = `rgb(${spec.color.join(",")})`;
        if (spec.matte === "pillar") {
          context.fillRect(spec.inset, 0, canvas.width - (spec.inset * 2), canvas.height);
        } else if (spec.matte === "letter") {
          context.fillRect(0, spec.inset, canvas.width, canvas.height - (spec.inset * 2));
        } else {
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.fillStyle = `rgba(255,255,255,${frame % 2 ? 0.04 : 0.02})`;
        context.fillRect(canvas.width * .45, canvas.height * .45, canvas.width * .1, canvas.height * .1);
        frame += 1;
        spec.animationFrame = requestAnimationFrame(draw);
      };
      draw();
      const stream = canvas.captureStream(30);
      video.__iamStreamAttachPromise = Promise.resolve(video);
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.playsInline = true;
      video.srcObject = stream;
      await waitForEvent(video, "loadedmetadata");
      await video.play();
      return { canvas, stream, spec };
    };

    const localVideo = document.querySelector(".adaptive-television-local-video");
    const fashionVideo = document.querySelector(".adaptive-television-fashion-video");
    const musicFeed = await createFeed(localVideo, { ...music });
    const fashionFeed = await createFeed(fashionVideo, {
      width: 160,
      height: 90,
      matte: "none",
      inset: 0,
      color: [38, 128, 246],
    });
    window.__iamSyntheticFeeds = [musicFeed, fashionFeed];
    document.body.classList.add("television-emdr-gif-active");
    window.dispatchEvent(new CustomEvent("iam:emdr-gif-presentation", { detail: { active: true } }));
    const crossfader = document.querySelector("[data-emdr-gif-crossfader]");
    crossfader.value = "100";
    crossfader.dispatchEvent(new Event("input", { bubbles: true }));
    localVideo.dispatchEvent(new Event("timeupdate"));
    window.__inspectSmallVideoCanvas = () => {
      const player = document.querySelector("[data-television-player]");
      const frame = document.querySelector(".adaptive-television-fashion-hero-frame");
      const canvas = frame.querySelector("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const points = [
        [2, Math.floor(canvas.height / 2)],
        [canvas.width - 3, Math.floor(canvas.height / 2)],
        [Math.floor(canvas.width / 2), 2],
        [Math.floor(canvas.width / 2), canvas.height - 3],
      ];
      const edgePixels = points.map(([x, y]) => [...context.getImageData(x, y, 1, 1).data.slice(0, 3)]);
      const centerPixel = [...context.getImageData(
        Math.floor(canvas.width / 2),
        Math.floor(canvas.height / 2),
        1,
        1
      ).data.slice(0, 3)];
      const luma = ([red, green, blue]) => (red * .2126) + (green * .7152) + (blue * .0722);
      const rect = frame.getBoundingClientRect();
      return {
        largeScale: Number(player.dataset.edgeCropScale || 0),
        largeSource: player.dataset.edgeCropSource || "",
        mirrorScale: Number(frame.dataset.emdrGifMusicEdgeScale || 0),
        mirrorSource: frame.dataset.emdrGifMusicEdgeSource || "",
        musicAmount: frame.dataset.emdrGifMusicAmount || "",
        edgePixels,
        blackEdgeCount: edgePixels.filter((pixel) => luma(pixel) < 35).length,
        centerPixel,
        centerLuma: luma(centerPixel),
        frameRatio: rect.width / rect.height,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    };
  }, testCase);

  await page.waitForFunction(({ matte }) => {
    const player = document.querySelector("[data-television-player]");
    const frame = document.querySelector(".adaptive-television-fashion-hero-frame");
    const detected = Number(player?.dataset.edgeCropScale || 0);
    return frame?.dataset.fashionHeroMirror === "ready" &&
      Number(frame.dataset.emdrGifMusicEdgeScale || 0) === detected &&
      (matte === "none" || player.dataset.edgeCropSource === "detected-edge-matte");
  }, testCase.music, { timeout: 20000 });
  await page.waitForTimeout(700);

  const musicSnapshot = await page.evaluate(() => window.__inspectSmallVideoCanvas());
  assert.equal(musicSnapshot.musicAmount, "100", JSON.stringify(musicSnapshot));
  assert.equal(musicSnapshot.mirrorScale, musicSnapshot.largeScale, JSON.stringify(musicSnapshot));
  assert.equal(musicSnapshot.blackEdgeCount, 0, JSON.stringify(musicSnapshot));
  assert.ok(Math.abs(musicSnapshot.frameRatio - (16 / 9)) < .02, JSON.stringify(musicSnapshot));
  assert.equal(musicSnapshot.horizontalOverflow, false, JSON.stringify(musicSnapshot));

  const crossfade = {};
  if (testCase.crossfade) {
    for (const amount of [0, 50, 100]) {
      await page.evaluate(async (nextAmount) => {
        const fashionVideo = document.querySelector(".adaptive-television-fashion-video");
        const fashionFeed = window.__iamSyntheticFeeds?.[1];
        if (nextAmount < 100 && fashionVideo && fashionFeed) {
          if (fashionVideo.srcObject !== fashionFeed.stream) {
            const metadataReady = new Promise((resolve) => {
              fashionVideo.addEventListener("loadedmetadata", resolve, { once: true });
            });
            fashionVideo.srcObject = fashionFeed.stream;
            await metadataReady;
          }
          if (fashionVideo.paused) await fashionVideo.play();
        }
        const crossfader = document.querySelector("[data-emdr-gif-crossfader]");
        crossfader.value = String(nextAmount);
        crossfader.dispatchEvent(new Event("input", { bubbles: true }));
      }, amount);
      await page.waitForFunction((nextAmount) => (
        document.querySelector(".adaptive-television-fashion-hero-frame")?.dataset.emdrGifMusicAmount === String(nextAmount)
      ), amount, { timeout: 10000 });
      await page.waitForTimeout(180);
      crossfade[amount] = await page.evaluate(() => window.__inspectSmallVideoCanvas());
      assert.equal(crossfade[amount].blackEdgeCount, 0, JSON.stringify(crossfade[amount]));
    }
    assert.ok(crossfade[0].centerPixel[2] > crossfade[0].centerPixel[0], JSON.stringify(crossfade[0]));
    assert.ok(crossfade[100].centerPixel[0] > crossfade[100].centerPixel[2], JSON.stringify(crossfade[100]));
    assert.ok(crossfade[50].centerLuma > 45, JSON.stringify(crossfade[50]));
  }

  const safety = await page.evaluate(() => ({ ...window.__iamSmallVideoSafety }));
  assert.deepEqual(safety, { fullscreenCalls: 0, microphoneCalls: 0 });
  assert.deepEqual(pageErrors, []);

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("iam:emdr-gif-presentation", { detail: { active: false } }));
    for (const feed of window.__iamSyntheticFeeds || []) {
      cancelAnimationFrame(feed.spec.animationFrame);
      feed.stream.getTracks().forEach((track) => track.stop());
    }
    document.querySelectorAll("audio, video").forEach((media) => {
      try { media.pause(); } catch {}
      if (media.srcObject) media.srcObject = null;
    });
  });
  await context.close();

  return {
    name: testCase.name,
    viewport: testCase.viewport,
    source: testCase.music,
    music: musicSnapshot,
    crossfade,
    safety,
    pageErrors,
  };
}
