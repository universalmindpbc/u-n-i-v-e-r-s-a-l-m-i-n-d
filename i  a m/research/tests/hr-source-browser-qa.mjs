import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, open, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const execFile = promisify(execFileCallback);
const testDirectory = dirname(fileURLToPath(import.meta.url));
const researchDirectory = resolve(testDirectory, "..");
const iamDirectory = resolve(researchDirectory, "..");
const sdkDirectory = resolve(researchDirectory, "vendor", "shenai-sdk");
const chromiumExecutable = "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const proofOrigin = "https://staging.universalmind.tv";
const researchUrl = `${proofOrigin}/vogue/iam/research.php?offer=heart-rate&selected_track_id=hr-source-qa&selection_source=checkin`;

const profileDirectory = await mkdtemp(join(tmpdir(), "um-shen-qa-profile-"));
const outputDirectory = await mkdtemp(join(tmpdir(), "um-shen-qa-output-"));
const fakeCameraPath = join(profileDirectory, "synthetic-face.y4m");
const browserArgs = [
  "--mute-audio",
  "--use-fake-device-for-media-stream",
  "--use-fake-ui-for-media-stream",
  `--use-file-for-fake-video-capture=${fakeCameraPath}`,
  "--autoplay-policy=user-gesture-required",
];

let context = null;
let processProof = [];
let cleanupPassed = false;

try {
  await writeSyntheticFaceVideo(fakeCameraPath);
  context = await chromium.launchPersistentContext(profileDirectory, {
    executablePath: chromiumExecutable,
    headless: true,
    viewport: { width: 1440, height: 1040 },
    args: browserArgs,
  });

  processProof = await verifyIsolatedBrowserProcess(profileDirectory, browserArgs);
  await installSafetyInstrumentation(context);

  const localRouter = createLocalCandidateRouter();

  const checkInPage = await context.newPage();
  await checkInPage.route("**/*", localRouter);
  await checkInPage.goto(`${proofOrigin}/vogue/iam/check-in-research.php`, { waitUntil: "domcontentloaded" });
  assert.deepEqual(await checkInPage.locator("[data-iam-next-page]").evaluateAll((elements) => (
    elements.map((element) => element.getAttribute("data-iam-next-page"))
  )), ["research.php?offer=heart-rate", "research.php?offer=heart-rate"]);
  assert.equal(await checkInPage.locator("[data-iam-form]").count(), 1);
  await checkInPage.close();

  const skipEvidence = { tokenPosts: 0, cameraCalls: 0, destination: "" };
  const skipPage = await context.newPage();
  await skipPage.route("**/*", localRouter);
  skipPage.on("request", (request) => {
    if (request.url().endsWith("/api/shen-token.php") && request.method() === "POST") skipEvidence.tokenPosts += 1;
  });
  await skipPage.goto(researchUrl, { waitUntil: "domcontentloaded" });
  await assertSingleDisclosure(skipPage);
  await skipPage.screenshot({ path: join(outputDirectory, "heart-check-consent.png"), fullPage: true });
  await skipPage.locator("[data-heart-rate-skip]").click();
  await skipPage.waitForURL(/\/vogue\/iam\/index\.html/);
  skipEvidence.destination = skipPage.url();
  skipEvidence.cameraCalls = await skipPage.evaluate(() => window.__hrQaMediaCalls?.length || 0);
  assert.equal(skipEvidence.tokenPosts, 0);
  assert.equal(skipEvidence.cameraCalls, 0);
  assert.match(skipEvidence.destination, /selected_track_id=hr-source-qa/);
  assert.match(skipEvidence.destination, /selection_source=checkin/);
  await skipPage.close();

  const acceptEvidence = {
    tokenPosts: 0,
    tokenStatus: null,
    sdkRequests: 0,
    wasmRequests: 0,
    workerResponses: 0,
    workerHeaderFailures: 0,
    sameOriginFailures: [],
    pageErrors: [],
    consoleErrors: [],
  };
  const acceptPage = await context.newPage();
  await acceptPage.addInitScript(() => {
    sessionStorage.setItem("iam.shenResearch.preHeartRate.v1", "legacy-biometric-data");
    sessionStorage.setItem("iam.shenResearch.user.v1", "legacy-user-id");
  });
  await acceptPage.route("**/*", localRouter);
  acceptPage.on("pageerror", (error) => acceptEvidence.pageErrors.push(error.message));
  acceptPage.on("console", (message) => {
    if (message.type() === "error") acceptEvidence.consoleErrors.push(message.text());
  });
  acceptPage.on("request", (request) => {
    const url = request.url();
    if (url.endsWith("/api/shen-token.php") && request.method() === "POST") acceptEvidence.tokenPosts += 1;
    if (url.includes("/research/vendor/shenai-sdk/")) acceptEvidence.sdkRequests += 1;
  });
  acceptPage.on("requestfailed", (request) => {
    const url = request.url();
    if (url.includes("Homepage%20-%20Hero%20Background%20Video") || url.includes("Homepage - Hero Background Video")) return;
    if (url.startsWith(proofOrigin)) acceptEvidence.sameOriginFailures.push(`${request.method()} ${new URL(url).pathname}`);
  });
  acceptPage.on("response", async (response) => {
    const url = response.url();
    if (url.endsWith("/api/shen-token.php") && response.request().method() === "POST") {
      acceptEvidence.tokenStatus = response.status();
    }
    if (url.endsWith("/research/vendor/shenai-sdk/shenai_sdk.wasm")) acceptEvidence.wasmRequests += 1;
    if (url.endsWith("/research/vendor/shenai-sdk/shenai_sdk.mjs")) {
      acceptEvidence.workerResponses += 1;
      const headers = await response.allHeaders();
      if (response.status() !== 200
        || headers["cross-origin-embedder-policy"] !== "require-corp"
        || headers["cross-origin-resource-policy"] !== "same-origin") {
        acceptEvidence.workerHeaderFailures += 1;
      }
    }
  });

  await acceptPage.goto(researchUrl, { waitUntil: "domcontentloaded" });
  await assertSingleDisclosure(acceptPage);
  assert.equal(await acceptPage.evaluate(() => sessionStorage.getItem("iam.shenResearch.preHeartRate.v1")), null);
  assert.equal(await acceptPage.evaluate(() => sessionStorage.getItem("iam.shenResearch.user.v1")), null);

  await acceptPage.locator("[data-heart-rate-accept]").click();
  await acceptPage.locator("[data-heart-rate-loader]").waitFor({ state: "visible" });
  assert.equal(await acceptPage.locator("[data-heart-rate-loading-label]").textContent(), "Loading");
  await acceptPage.screenshot({ path: join(outputDirectory, "heart-check-loading.png"), fullPage: true });

  await acceptPage.locator('[data-shen-stage][data-state="measurement"]').waitFor({ state: "visible", timeout: 90_000 });
  assert.equal(
    await acceptPage.locator("[data-shen-stage]").getAttribute("data-shen-visualization-config"),
    "blood-flow-only",
  );
  assert.equal(
    await acceptPage.locator("[data-shen-stage]").getAttribute("data-shen-measurement"),
    "heart-rate-30-seconds",
  );
  assert.equal(
    await acceptPage.locator("[data-shen-stage]").getAttribute("data-shen-custom-measurement"),
    "runtime-setter",
  );
  const sdkBrandingControl = await acceptPage.locator("[data-shen-stage]").getAttribute("data-shen-branding");
  assert.ok(["hidden", "sdk-controlled"].includes(sdkBrandingControl));
  assert.equal(await acceptPage.locator("[data-heart-rate-live]").isHidden(), true);
  assert.equal(await acceptPage.locator("[data-heart-rate-result]").isHidden(), true);
  await acceptPage.waitForTimeout(1_000);
  const stageGeometry = await acceptPage.locator("[data-shen-stage]").evaluate((element) => {
    const stageRect = element.getBoundingClientRect();
    const canvasRect = element.querySelector("canvas").getBoundingClientRect();
    return {
      stageWidth: Math.round(stageRect.width),
      stageHeight: Math.round(stageRect.height),
      canvasWidth: Math.round(canvasRect.width),
      canvasHeight: Math.round(canvasRect.height),
    };
  });
  assert.ok(stageGeometry.stageWidth < stageGeometry.canvasWidth);
  assert.ok(stageGeometry.stageWidth / stageGeometry.stageHeight < 0.65);
  await acceptPage.screenshot({ path: join(outputDirectory, "heart-check-shen-ui.png"), fullPage: true });

  const stageBox = await acceptPage.locator("[data-shen-stage]").boundingBox();
  assert.ok(stageBox);
  await acceptPage.mouse.click(stageBox.x + (stageBox.width / 2), stageBox.y + (stageBox.height * 0.89));
  await acceptPage.waitForFunction(() => (
    (window.__hrQaMediaTracks?.length || 0) > 0
      || (window.__hrQaMediaErrors?.length || 0) > 0
  ), null, { timeout: 12_000 });

  const cameraEvidence = await acceptPage.evaluate(() => ({
    calls: window.__hrQaMediaCalls || [],
    tracks: window.__hrQaMediaTracks || [],
    errors: window.__hrQaMediaErrors || [],
  }));
  assert.ok(cameraEvidence.calls.length >= 1);
  assert.deepEqual(cameraEvidence.errors, [], JSON.stringify(cameraEvidence));
  assert.ok(cameraEvidence.calls.every((constraints) => constraints?.audio !== true));
  assert.ok(cameraEvidence.tracks.filter(({ kind }) => kind === "video").length >= 1);
  assert.equal(cameraEvidence.tracks.filter(({ kind }) => kind === "audio").length, 0);
  await acceptPage.waitForTimeout(1_000);
  await acceptPage.screenshot({ path: join(outputDirectory, "heart-check-camera.png"), fullPage: true });
  await acceptPage.evaluate(() => {
    const live = document.querySelector("[data-heart-rate-live]");
    live.querySelector("[data-heart-rate-live-value]").textContent = "69";
    live.hidden = false;
  });
  assert.equal(await acceptPage.locator("[data-heart-rate-live]").isVisible(), true);
  await acceptPage.screenshot({ path: join(outputDirectory, "heart-check-live-bpm-fixture.png"), fullPage: true });
  await acceptPage.evaluate(() => {
    const live = document.querySelector("[data-heart-rate-live]");
    live.hidden = true;
    live.querySelector("[data-heart-rate-live-value]").textContent = "";
  });
  await acceptPage.evaluate(() => {
    const stage = document.querySelector("[data-shen-stage]");
    const result = document.querySelector("[data-heart-rate-result]");
    stage.dataset.state = "result";
    stage.querySelector("canvas").setAttribute("aria-hidden", "true");
    result.querySelector("[data-heart-rate-result-value]").textContent = "69";
    result.hidden = false;
  });
  assert.equal(await acceptPage.locator("[data-heart-rate-result]").isVisible(), true);
  assert.equal(await acceptPage.locator("[data-heart-rate-result-value]").textContent(), "69");
  await acceptPage.screenshot({ path: join(outputDirectory, "heart-check-final-bpm-fixture.png"), fullPage: true });
  await acceptPage.evaluate(() => {
    const result = document.querySelector("[data-heart-rate-result]");
    result.hidden = true;
    result.querySelector("[data-heart-rate-result-value]").textContent = "";
  });
  assert.equal(acceptEvidence.tokenPosts, 1);
  assert.equal(acceptEvidence.tokenStatus, 200);
  assert.ok(acceptEvidence.sdkRequests >= 3);
  assert.equal(acceptEvidence.wasmRequests, 1);
  assert.ok(acceptEvidence.workerResponses >= 1);
  assert.equal(acceptEvidence.workerHeaderFailures, 0);
  assert.deepEqual(acceptEvidence.sameOriginFailures, []);
  assert.deepEqual(acceptEvidence.pageErrors, []);
  assert.deepEqual(acceptEvidence.consoleErrors, []);

  const sdkIntegrity = await readSdkIntegrity();
  assert.equal(sdkIntegrity.version, "3.1.9");

  await acceptPage.close();
  await context.close();
  context = null;
  cleanupPassed = (await findProcessesForProfile(profileDirectory)).length === 0;
  assert.equal(cleanupPassed, true);

  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    processFlagsVerifiedBeforeNavigation: processProof.length > 0,
    checkIn: "canonical renderer destination present",
    disclosure: "one Universal Mind consent and wellness disclosure",
    skip: skipEvidence,
    accept: {
      tokenPosts: acceptEvidence.tokenPosts,
      tokenStatus: acceptEvidence.tokenStatus,
      sdkVersion: sdkIntegrity.version,
      sdkEntrySha256: sdkIntegrity.entrySha256,
      sdkWasmSha256: sdkIntegrity.wasmSha256,
      sdkRequests: acceptEvidence.sdkRequests,
      wasmRequests: acceptEvidence.wasmRequests,
      workerResponses: acceptEvidence.workerResponses,
      workerHeaderFailures: acceptEvidence.workerHeaderFailures,
      stageGeometry,
      cameraCalls: cameraEvidence.calls.length,
      videoTracks: cameraEvidence.tracks.filter(({ kind }) => kind === "video").length,
      audioTracks: cameraEvidence.tracks.filter(({ kind }) => kind === "audio").length,
      visualizationInitialized: "blood-flow-only",
      measurementDurationSeconds: 30,
      liveHeartRateDisplay: "ephemeral 4-second metric when available",
      liveBpmPresentationFixture: 69,
      finalHeartRateDisplay: "ephemeral 2.2-second hold when available",
      finalBpmPresentationFixture: 69,
      sdkBrandingControl,
      realFaceVisualizationProofRequired: true,
      noSyntheticPhysiologicalReadingClaimed: true,
    },
    errors: {
      page: acceptEvidence.pageErrors.length,
      console: acceptEvidence.consoleErrors.length,
      sameOriginNetwork: acceptEvidence.sameOriginFailures.length,
    },
    screenshots: outputDirectory,
    cleanup: cleanupPassed,
  }, null, 2)}\n`);
} finally {
  if (context) await context.close().catch(() => {});
  await rm(profileDirectory, { recursive: true, force: true });
}

async function assertSingleDisclosure(page) {
  const dialog = page.locator('[role="dialog"]');
  assert.equal(await dialog.count(), 1);
  assert.equal(await dialog.getByRole("heading", { name: "What Colour Is Your Heart?" }).count(), 1);
  assert.equal(await dialog.getByText("General wellness and research information only.", { exact: false }).count(), 1);
  assert.equal(await page.locator(".shen-heart-rate-wellness").count(), 0);
}

async function installSafetyInstrumentation(browserContext) {
  await browserContext.addInitScript(() => {
    window.__hrQaMediaCalls = [];
    window.__hrQaMediaTracks = [];
    window.__hrQaMediaErrors = [];
    const originalGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    if (originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        window.__hrQaMediaCalls.push(JSON.parse(JSON.stringify(constraints || {})));
        try {
          const stream = await originalGetUserMedia(constraints);
          window.__hrQaMediaTracks.push(...stream.getTracks().map((track) => ({
            kind: track.kind,
            label: track.label ? "synthetic-device" : "",
            muted: track.muted,
          })));
          return stream;
        } catch (error) {
          window.__hrQaMediaErrors.push({ name: error?.name || "Error", message: error?.message || "" });
          throw error;
        }
      };
    }
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("video").forEach((video) => video.pause());
    }, { once: true });
  });
}

function createLocalCandidateRouter() {
  return async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = decodeURIComponent(url.pathname);

    if (path === "/vogue/iam/check-in-research.php") {
      const canonical = await readFile(resolve(iamDirectory, "vogue-self-report.html"), "utf8");
      const rendered = canonical
        .replace(/data-iam-next-page="index\.html[^"]*"/g, 'data-iam-next-page="research.php?offer=heart-rate"')
        .replace("<title>Check In | I Am</title>", '<meta name="robots" content="noindex, nofollow">\n    <title>Research Check In | I Am</title>');
      await route.fulfill({ status: 200, headers: pageHeaders(), contentType: "text/html; charset=utf-8", body: rendered });
      return;
    }

    if (path === "/vogue/iam/research.php") {
      const php = await readFile(resolve(iamDirectory, "research.php"), "utf8");
      const html = php.slice(php.indexOf("<!doctype html>"));
      await route.fulfill({ status: 200, headers: pageHeaders(), contentType: "text/html; charset=utf-8", body: html });
      return;
    }

    if (path === "/vogue/iam/index.html") {
      await route.fulfill({
        status: 200,
        headers: pageHeaders(),
        contentType: "text/html; charset=utf-8",
        body: "<!doctype html><title>QA destination</title><p>Recommendation received.</p>",
      });
      return;
    }

    const localFiles = new Map([
      ["/vogue/iam/styles.css", resolve(iamDirectory, "styles.css")],
      ["/vogue/iam/research/shen-heart-rate.css", resolve(researchDirectory, "shen-heart-rate.css")],
      ["/vogue/iam/research/shen-heart-rate.js", resolve(researchDirectory, "shen-heart-rate.js")],
      ["/vogue/iam/research/shen-heart-recommendation.js", resolve(researchDirectory, "shen-heart-recommendation.js")],
      ["/vogue/iam/adaptive-sound/session-v1.js", resolve(iamDirectory, "adaptive-sound", "session-v1.js")],
      ["/vogue/iam/adaptive-sound/profiles-v1.js", resolve(iamDirectory, "adaptive-sound", "profiles-v1.js")],
      ["/vogue/iam/a s s e t s/Universal Mind [ I o H ] Logo 512.png", resolve(iamDirectory, "a s s e t s", "Universal Mind [ I o H ] Logo 512.png")],
      ["/vogue/iam/favicon.png", resolve(iamDirectory, "favicon.png")],
    ]);
    if (localFiles.has(path)) {
      await fulfillLocalFile(route, localFiles.get(path), path);
      return;
    }

    if (path.startsWith("/vogue/iam/research/vendor/shenai-sdk/")) {
      const relativePath = path.slice("/vogue/iam/research/vendor/shenai-sdk/".length);
      assert.ok(relativePath && !relativePath.includes(".."));
      await fulfillLocalFile(route, resolve(sdkDirectory, relativePath), path, {
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Resource-Policy": "same-origin",
      });
      return;
    }

    if (path.endsWith("cloudflare-stream-catalogue.js") || path.endsWith("cloudflare-stream-controller.js")) {
      await route.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", body: "" });
      return;
    }

    if (path.includes("Homepage - Hero Background Video - Chanel 2020 Runway Show.mp4")) {
      await route.abort("blockedbyclient");
      return;
    }

    await route.continue();
  };
}

async function fulfillLocalFile(route, filePath, urlPath, additionalHeaders = {}) {
  const body = await readFile(filePath);
  await route.fulfill({
    status: 200,
    headers: {
      "Cross-Origin-Resource-Policy": "same-origin",
      ...additionalHeaders,
    },
    contentType: contentTypeFor(urlPath),
    body,
  });
}

function pageHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Permissions-Policy": "camera=(self), microphone=()",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
}

function contentTypeFor(path) {
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".js") || path.endsWith(".mjs")) return "text/javascript; charset=utf-8";
  if (path.endsWith(".wasm")) return "application/wasm";
  if (path.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

async function verifyIsolatedBrowserProcess(profilePath, requiredArgs) {
  const lines = await findProcessesForProfile(profilePath);
  assert.ok(lines.length > 0, "Isolated Chromium process was not found before navigation");
  const command = lines.join("\n");
  for (const argument of requiredArgs) assert.ok(command.includes(argument), `Missing Chromium safety flag: ${argument}`);
  return lines;
}

async function findProcessesForProfile(profilePath) {
  const { stdout } = await execFile("ps", ["-ax", "-o", "command="]);
  return stdout.split("\n").filter((line) => line.includes(profilePath));
}

async function readSdkIntegrity() {
  const [version, entry, wasm] = await Promise.all([
    readFile(resolve(sdkDirectory, "VERSION"), "utf8"),
    readFile(resolve(sdkDirectory, "index.mjs")),
    readFile(resolve(sdkDirectory, "shenai_sdk.wasm")),
  ]);
  return {
    version: version.trim(),
    entrySha256: createHash("sha256").update(entry).digest("hex"),
    wasmSha256: createHash("sha256").update(wasm).digest("hex"),
  };
}

async function writeSyntheticFaceVideo(path) {
  const width = 480;
  const height = 640;
  const frames = 120;
  const frameRate = 30;
  const handle = await open(path, "w");
  try {
    await handle.write(`YUV4MPEG2 W${width} H${height} F${frameRate}:1 Ip A1:1 C420jpeg\n`);
    for (let frameIndex = 0; frameIndex < frames; frameIndex += 1) {
      const y = Buffer.alloc(width * height, 185);
      const u = Buffer.alloc((width / 2) * (height / 2), 128);
      const v = Buffer.alloc((width / 2) * (height / 2), 128);
      const pulse = Math.round(Math.sin((frameIndex / frameRate) * Math.PI * 2 * 1.18) * 3);
      drawEllipse(y, width, height, width / 2, height * 0.48, 135, 185, 151 + pulse);
      drawEllipse(y, width, height, width / 2, height * 0.30, 145, 75, 48);
      drawEllipse(y, width, height, width * 0.43, height * 0.45, 18, 10, 38);
      drawEllipse(y, width, height, width * 0.57, height * 0.45, 18, 10, 38);
      drawEllipse(y, width, height, width * 0.50, height * 0.60, 48, 10, 72);
      drawEllipse(u, width / 2, height / 2, width / 4, height * 0.24, 68, 93, 108);
      drawEllipse(v, width / 2, height / 2, width / 4, height * 0.24, 68, 93, 150 + pulse);
      await handle.write("FRAME\n");
      await handle.write(Buffer.concat([y, u, v]));
    }
  } finally {
    await handle.close();
  }
}

function drawEllipse(plane, width, height, centerX, centerY, radiusX, radiusY, value) {
  const minX = Math.max(0, Math.floor(centerX - radiusX));
  const maxX = Math.min(width - 1, Math.ceil(centerX + radiusX));
  const minY = Math.max(0, Math.floor(centerY - radiusY));
  const maxY = Math.min(height - 1, Math.ceil(centerY + radiusY));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const normalizedX = (x - centerX) / radiusX;
      const normalizedY = (y - centerY) / radiusY;
      if ((normalizedX * normalizedX) + (normalizedY * normalizedY) <= 1) {
        plane[(y * width) + x] = Math.max(0, Math.min(255, value));
      }
    }
  }
}
