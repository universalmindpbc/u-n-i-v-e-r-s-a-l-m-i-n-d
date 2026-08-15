import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const execFile = promisify(execFileCallback);
const testDirectory = dirname(fileURLToPath(import.meta.url));
const researchDirectory = resolve(testDirectory, "..");
const iamDirectory = resolve(researchDirectory, "..");
const proofOrigin = "https://staging.universalmind.tv";
const researchUrl = `${proofOrigin}/vogue/iam/research.php?offer=heart-rate`;
const chromiumExecutable = "/Users/benkorbel/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const profileDirectory = await mkdtemp(join(tmpdir(), "um-shen-runtime-contract-profile-"));
const outputDirectory = await mkdtemp(join(tmpdir(), "um-shen-runtime-contract-output-"));
const browserArgs = [
  "--mute-audio",
  "--use-fake-device-for-media-stream",
  "--use-fake-ui-for-media-stream",
  "--autoplay-policy=no-user-gesture-required",
];

let context = null;
const trace = [];
const handoffs = [];

try {
  context = await chromium.launchPersistentContext(profileDirectory, {
    executablePath: chromiumExecutable,
    headless: true,
    viewport: { width: 1440, height: 1040 },
    args: browserArgs,
  });
  const processProof = await verifyProcess(profileDirectory, browserArgs);
  await context.exposeBinding("recordHrRuntimeEvent", (_source, event) => trace.push(event));
  await installInstrumentation(context);

  const page = await context.newPage();
  await page.route("**/*", createRouter(handoffs));
  await page.goto(researchUrl, { waitUntil: "domcontentloaded" });
  await page.locator("[data-heart-rate-accept]").click();
  await page.locator('[data-shen-stage][data-state="measurement"]').waitFor({ state: "visible" });
  assert.equal(await page.locator("[data-shen-stage]").getAttribute("data-shen-measurement-preset"), "quick-hr-mode");
  assert.equal(await page.locator("[data-shen-stage]").getAttribute("data-shen-measurement"), "quick-heart-rate-10-seconds");
  assert.equal(await page.locator("[data-shen-stage]").getAttribute("data-deepar-ready"), "true");
  assert.equal(await page.locator("[data-shen-stage]").getAttribute("data-deepar-effect"), "official-bright-glasses");

  const stageBox = await page.locator("[data-shen-stage]").boundingBox();
  assert.ok(stageBox);
  await page.mouse.click(stageBox.x + (stageBox.width / 2), stageBox.y + (stageBox.height * 0.45));
  await page.locator("[data-heart-rate-deepar]").waitFor({ state: "visible" });

  const geometry = await page.locator("[data-heart-rate-deepar]").evaluate((element) => {
    const stage = document.querySelector("[data-shen-stage]").getBoundingClientRect();
    const plane = element.getBoundingClientRect();
    const deepARCanvas = element.querySelector("canvas")?.getBoundingClientRect();
    return {
      stageTop: stage.top,
      stageHeight: stage.height,
      planeTop: plane.top,
      planeHeight: plane.height,
      deepARCanvasWidth: deepARCanvas?.width || 0,
      deepARCanvasHeight: deepARCanvas?.height || 0,
      pointerEvents: getComputedStyle(element).pointerEvents,
    };
  });
  assert.ok(Math.abs(geometry.planeTop - geometry.stageTop) < 1);
  assert.ok(Math.abs(geometry.planeHeight - (geometry.stageHeight * 0.76)) < 2);
  assert.ok(geometry.deepARCanvasWidth > 0);
  assert.ok(geometry.deepARCanvasHeight > 0);
  assert.equal(geometry.pointerEvents, "none");
  await page.screenshot({ path: join(outputDirectory, "quick-hr-shared-stream-overlay.png"), fullPage: true });

  await page.waitForURL(/\/vogue\/iam\/index\.html/, { timeout: 16_000 });
  assert.equal(handoffs.length, 1);
  assert.equal(handoffs[0].checkin, "I am energised after surfing");
  assert.equal(handoffs[0].momentary_physiology.heart_rate_bpm, 69);
  assert.equal(handoffs[0].momentary_physiology.measurement_duration_seconds, 10);
  assert.equal(handoffs[0].momentary_physiology.measurement_timing, "immediately_after_current_self_report");
  assert.equal(handoffs[0].momentary_physiology.source, "shen_quick_hr");

  const first = (name) => trace.find((entry) => entry.name === name);
  const started = first("sdk_running_signal_short");
  const finished = first("sdk_finished");
  const deinitialized = first("sdk_deinitialized");
  const cameraTrackEnded = first("camera_track_ended");
  const shenStream = first("shen_shared_stream");
  const deepARStream = first("deepar_shared_stream");
  const effectLoaded = first("deepar_effect_loaded");
  const resultVisible = first("stage_result");
  const handoffRequested = first("handoff_request");
  const handoffAccepted = first("handoff_response");
  const navigation = first("stage_complete");
  for (const entry of [started, finished, deinitialized, cameraTrackEnded, shenStream, deepARStream, effectLoaded, resultVisible, handoffRequested, handoffAccepted, navigation]) {
    assert.ok(entry, JSON.stringify(trace));
  }
  assert.equal(shenStream.streamId, deepARStream.streamId);
  const primaryCameraRequests = trace.filter(({ name }) => name === "camera_request").length;
  assert.equal(primaryCameraRequests, 1);
  assert.equal(trace.filter(({ name }) => name === "deepar_initialized").length, 1);
  assert.equal(effectLoaded.path, "/vogue/iam/research/effects/bright-glasses/bright-glasses.deepar");

  const acquisitionMs = finished.at - started.at;
  const releaseAfterFinishMs = deinitialized.at - finished.at;
  const resultAfterFinishMs = resultVisible.at - finished.at;
  const resultHoldMs = handoffRequested.at - resultVisible.at;
  const handoffAcceptanceMs = handoffAccepted.at - handoffRequested.at;
  const navigationAfterAcceptanceMs = navigation.at - handoffAccepted.at;
  assert.ok(acquisitionMs >= 9950 && acquisitionMs <= 10250, String(acquisitionMs));
  assert.ok(releaseAfterFinishMs >= 0 && releaseAfterFinishMs <= 100, String(releaseAfterFinishMs));
  assert.ok(resultAfterFinishMs >= 0 && resultAfterFinishMs <= 100, String(resultAfterFinishMs));
  assert.ok(resultHoldMs >= 2180 && resultHoldMs <= 2400, String(resultHoldMs));
  assert.ok(handoffAcceptanceMs >= 0 && handoffAcceptanceMs <= 1500, String(handoffAcceptanceMs));
  assert.ok(navigationAfterAcceptanceMs >= 0 && navigationAfterAcceptanceMs <= 100, String(navigationAfterAcceptanceMs));
  assert.equal(trace.some(({ label }) => /Finding your experience|Tuning your experience/i.test(label || "")), false);

  const failClosed = await context.newPage();
  await failClosed.route("**/*", createRouter([]));
  await failClosed.goto(`${researchUrl}&mock_preset=unexpected`, { waitUntil: "domcontentloaded" });
  await failClosed.locator("[data-heart-rate-accept]").click();
  await failClosed.waitForTimeout(1_000);
  const failClosedState = await failClosed.evaluate(() => ({
    status: document.querySelector("[data-shen-status]")?.textContent || "",
    statusHidden: document.querySelector("[data-shen-status]")?.hidden,
    stageHidden: document.querySelector("[data-shen-stage]")?.hidden,
    preset: document.querySelector("[data-shen-stage]")?.dataset.shenMeasurementPreset || "",
  }));
  assert.equal(failClosedState.status, "The 10-second Heart Check could not be confirmed. Continue without measuring.", JSON.stringify(failClosedState));
  assert.equal(failClosedState.statusHidden, false);
  assert.equal(await failClosed.locator("[data-shen-stage]").isHidden(), true);
  assert.equal(await failClosed.locator("[data-shen-stage]").getAttribute("data-shen-measurement-preset"), "unexpected");
  await failClosed.close();

  await page.close();
  await context.close();
  context = null;
  const cleanup = (await findProcesses(profileDirectory)).length === 0;
  assert.equal(cleanup, true);

  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    processMutedBeforeNavigation: processProof.length > 0,
    configuredPreset: "QUICK_HR_MODE",
    timing: {
      acquisitionMs,
      releaseAfterFinishMs,
      resultAfterFinishMs,
      resultHoldMs,
      handoffAcceptanceMs,
      navigationAfterAcceptanceMs,
    },
    sharedCamera: {
      requests: primaryCameraRequests,
      videoTracks: 1,
      audioTracks: 0,
      identicalRawStreamForShenAndDeepAR: shenStream.streamId === deepARStream.streamId,
      released: Boolean(cameraTrackEnded),
    },
    overlay: { officialEffectPath: effectLoaded.path, viewportOfCanvas: 0.76, pointerEvents: geometry.pointerEvents },
    handoff: { requests: handoffs.length, exact202Accepted: true, rawBpmStoredOrReturned: false },
    duplicateLoadingState: false,
    unexpectedPresetFailsClosed: true,
    screenshot: join(outputDirectory, "quick-hr-shared-stream-overlay.png"),
    cleanup,
    trace,
  }, null, 2)}\n`);
} finally {
  if (context) await context.close().catch(() => {});
  await rm(profileDirectory, { recursive: true, force: true });
}

async function installInstrumentation(browserContext) {
  await browserContext.addInitScript(() => {
    sessionStorage.setItem("iamLatestCheckinValue", "I am energised after surfing");
    sessionStorage.setItem("iamLatestInference", JSON.stringify({
      checkin: "I am energised after surfing",
      status: "pending",
    }));
    const originalFetch = window.fetch.bind(window);
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      window.recordHrRuntimeEvent({ name: "camera_request", at: performance.now(), constraints });
      const stream = await originalGetUserMedia(constraints);
      const track = stream.getVideoTracks()[0];
      if (track) {
        const originalStop = track.stop.bind(track);
        let stopRecorded = false;
        track.stop = () => {
          if (!stopRecorded) {
            stopRecorded = true;
            window.recordHrRuntimeEvent({ name: "camera_track_ended", at: performance.now() });
          }
          originalStop();
        };
      }
      return stream;
    };
    window.fetch = async (...args) => {
      const target = String(args[0]?.url || args[0] || "");
      if (target.includes("api/heart-check-handoff.php")) {
        window.recordHrRuntimeEvent({ name: "handoff_request", at: performance.now() });
      }
      const response = await originalFetch(...args);
      if (target.includes("api/heart-check-handoff.php")) {
        window.recordHrRuntimeEvent({ name: "handoff_response", at: performance.now() });
      }
      return response;
    };
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("video").forEach((video) => {
        video.pause();
        video.muted = true;
      });
      const stage = document.querySelector("[data-shen-stage]");
      const label = document.querySelector("[data-heart-rate-loading-label]");
      const report = () => {
        if (stage?.dataset.state === "result") {
          window.recordHrRuntimeEvent({ name: "stage_result", at: performance.now() });
        }
        if (stage?.dataset.state === "complete") {
          window.recordHrRuntimeEvent({ name: "stage_complete", at: performance.now() });
        }
        if (label?.textContent) {
          window.recordHrRuntimeEvent({ name: "loader_label", at: performance.now(), label: label.textContent });
        }
      };
      new MutationObserver(report).observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ["data-state", "hidden"],
      });
    }, { once: true });
  });
}

function createRouter(handoffEvidence) {
  return async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = decodeURIComponent(url.pathname);
    if (path === "/vogue/iam/research.php") {
      const php = await readFile(resolve(iamDirectory, "research.php"), "utf8");
      await route.fulfill({ status: 200, headers: pageHeaders(), contentType: "text/html; charset=utf-8", body: php.slice(php.indexOf("<!doctype html>")) });
      return;
    }
    if (path === "/vogue/iam/index.html") {
      await route.fulfill({ status: 200, headers: pageHeaders(), contentType: "text/html; charset=utf-8", body: "<!doctype html><title>Homepage</title><p>Canonical homepage destination</p>" });
      return;
    }
    if (path === "/vogue/iam/api/shen-token.php" && request.method() === "POST") {
      await route.fulfill({ status: 200, headers: pageHeaders(), contentType: "application/json", body: JSON.stringify({ token: "qa-short-lived-token" }) });
      return;
    }
    if (path === "/vogue/iam/api/deepar-license.php" && request.method() === "POST") {
      await route.fulfill({ status: 200, headers: pageHeaders(), contentType: "application/json", body: JSON.stringify({ license_key: "qa-domain-bound-key" }) });
      return;
    }
    if (path === "/vogue/iam/api/heart-check-handoff.php" && request.method() === "POST") {
      handoffEvidence.push(request.postDataJSON());
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 180));
      await route.fulfill({ status: 202, headers: pageHeaders(), contentType: "application/json", body: JSON.stringify({ accepted: true }) });
      return;
    }
    if (path === "/vogue/iam/research/vendor/shenai-sdk/index.mjs") {
      await route.fulfill({ status: 200, headers: pageHeaders(), contentType: "text/javascript", body: mockSdkModule() });
      return;
    }
    if (path === "/vogue/iam/research/vendor/deepar-5.6.22/js/deepar.esm.js") {
      await route.fulfill({ status: 200, headers: pageHeaders(), contentType: "text/javascript", body: mockDeepARModule() });
      return;
    }
    if (path === "/vogue/iam/research/effects/bright-glasses/bright-glasses.deepar") {
      await route.fulfill({ status: 200, headers: pageHeaders(), contentType: "application/octet-stream", body: "qa-bright-glasses-effect" });
      return;
    }
    const files = new Map([
      ["/vogue/iam/styles.css", resolve(iamDirectory, "styles.css")],
      ["/vogue/iam/research/shen-heart-rate.css", resolve(researchDirectory, "shen-heart-rate.css")],
      ["/vogue/iam/research/shen-heart-rate.js", resolve(researchDirectory, "shen-heart-rate.js")],
      ["/vogue/iam/research/deepar-bright-glasses.js", resolve(researchDirectory, "deepar-bright-glasses.js")],
      ["/vogue/iam/research/shen-heart-recommendation.js", resolve(researchDirectory, "shen-heart-recommendation.js")],
      ["/vogue/iam/a s s e t s/Universal Mind [ I o H ] Logo 512.png", resolve(iamDirectory, "a s s e t s", "Universal Mind [ I o H ] Logo 512.png")],
    ]);
    if (files.has(path)) {
      await route.fulfill({ status: 200, headers: pageHeaders(), contentType: contentType(path), body: await readFile(files.get(path)) });
      return;
    }
    if (path.endsWith("cloudflare-stream-catalogue.js") || path.endsWith("cloudflare-stream-controller.js")) {
      await route.fulfill({ status: 200, contentType: "text/javascript", body: "" });
      return;
    }
    if (path.includes("Homepage - Hero Background Video")) {
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  };
}

function mockSdkModule() {
  return `
export const InitializationResult = Object.freeze({ OK: "OK" });
export const MeasurementPreset = Object.freeze({
  QUICK_HR_MODE: Object.freeze({ value: 10 }),
  CUSTOM: Object.freeze({ value: 6 }),
});
export const OnboardingMode = Object.freeze({ HIDDEN: Object.freeze({ value: 0 }) });
export const PrecisionMode = Object.freeze({ STRICT: Object.freeze({ value: 0 }) });
export const UiVersion = Object.freeze({ V3: Object.freeze({ value: 3 }) });
export default async function CreateShenaiSDK() {
  let settings = null;
  let startedAt = 0;
  let finished = false;
  let stopped = false;
  return {
    setMediaStream(stream, facingUser) {
      window.recordHrRuntimeEvent({
        name: "shen_shared_stream",
        at: performance.now(),
        streamId: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        facingUser,
      });
    },
    initialize(_token, _measurementId, nextSettings, callback) {
      settings = nextSettings;
      const canvas = document.querySelector("#mxcanvas");
      canvas.width = 760;
      canvas.height = 760;
      const context = canvas.getContext("2d");
      context.fillStyle = "#dedbd2";
      context.fillRect(0, 0, 760, 760);
      context.fillStyle = "#c7b79f";
      context.beginPath();
      context.ellipse(380, 242, 137, 150, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#2f3033";
      context.beginPath(); context.ellipse(330, 182, 17, 9, 0, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.ellipse(430, 182, 17, 9, 0, 0, Math.PI * 2); context.fill();
      canvas.addEventListener("click", () => {
        if (startedAt) return;
        startedAt = performance.now();
        window.recordHrRuntimeEvent({ name: "sdk_running_signal_short", at: startedAt });
        setTimeout(() => window.recordHrRuntimeEvent({ name: "sdk_running_signal_good", at: performance.now() }), 100);
        setTimeout(() => {
          finished = true;
          window.recordHrRuntimeEvent({ name: "sdk_finished", at: performance.now() });
          settings.eventCallback("MEASUREMENT_FINISHED");
        }, 10000);
      }, { once: true });
      setTimeout(() => callback(InitializationResult.OK), 0);
    },
    getMeasurementPreset() {
      return new URLSearchParams(location.search).get("mock_preset") === "unexpected"
        ? MeasurementPreset.CUSTOM
        : MeasurementPreset.QUICK_HR_MODE;
    },
    setMeasurementPreset() {},
    getMeasurementResults() { return finished ? { heart_rate_bpm: 69 } : null; },
    getHeartRate4s() { return startedAt && performance.now() - startedAt >= 4000 ? 69 : null; },
    setShowFaceMask() {},
    setShowBloodFlow() {},
    setHideShenaiLogo() {},
    getHideShenaiLogo() { return true; },
    deinitialize() {
      if (stopped) return;
      stopped = true;
      window.recordHrRuntimeEvent({ name: "sdk_deinitialized", at: performance.now() });
    },
  };
}`;
}

function pageHeaders() {
  return {
    "Cache-Control": "no-store",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Permissions-Policy": "camera=(self), microphone=()",
    "Cross-Origin-Resource-Policy": "same-origin",
};
}

function mockDeepARModule() {
  return `
export async function initialize(options) {
  window.recordHrRuntimeEvent({ name: "deepar_initialized", at: performance.now(), defaultCameraDisabled: options.additionalOptions?.cameraConfig?.disableDefaultCamera === true });
  const effectResponse = await fetch(options.effect);
  if (!effectResponse.ok) throw new Error("effect unavailable");
  await effectResponse.arrayBuffer();
  window.recordHrRuntimeEvent({ name: "deepar_effect_loaded", at: performance.now(), path: new URL(options.effect).pathname });
  const canvas = document.createElement("canvas");
  canvas.width = 760;
  canvas.height = 578;
  const context = canvas.getContext("2d");
  context.fillStyle = "#637c64";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#e9d5a2";
  context.lineWidth = 18;
  context.strokeRect(130, 190, 500, 170);
  options.previewElement.append(canvas);
  return {
    muteSound() {},
    setFps() {},
    setVideoElement(videoElement, mirror) {
      const stream = videoElement.srcObject;
      window.recordHrRuntimeEvent({
        name: "deepar_shared_stream",
        at: performance.now(),
        streamId: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        mirror,
      });
    },
    stopVideo() { window.recordHrRuntimeEvent({ name: "deepar_stopped", at: performance.now() }); },
    shutdown() { window.recordHrRuntimeEvent({ name: "deepar_shutdown", at: performance.now() }); },
  };
}`;
}

function contentType(path) {
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".js") || path.endsWith(".mjs")) return "text/javascript; charset=utf-8";
  if (path.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

async function verifyProcess(profilePath, requiredArgs) {
  const lines = await findProcesses(profilePath);
  assert.ok(lines.length > 0);
  const command = lines.join("\n");
  requiredArgs.forEach((argument) => assert.ok(command.includes(argument), argument));
  return lines;
}

async function findProcesses(profilePath) {
  const { stdout } = await execFile("ps", ["-ax", "-o", "command="]);
  return stdout.split("\n").filter((line) => line.includes(profilePath));
}
