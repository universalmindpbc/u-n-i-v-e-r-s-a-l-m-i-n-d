import CreateShenaiSDK, {
  InitializationResult,
  MeasurementPreset,
  OnboardingMode,
  PrecisionMode,
  UiVersion,
} from "./vendor/shenai-sdk/index.mjs";
import { createDeepARBrightGlasses } from "./deepar-bright-glasses.js?v=deepar-bright-glasses-js-d622e574d883";
import { handoffHeartCheckToHomepage } from "./shen-heart-recommendation.js?v=b3324d1c790c";
import {
  heartCheckShenWasmUrl,
  warmHeartCheckAssets,
} from "./heart-check-preload.js?v=heart-check-preload-78750d6b05f6";

const offer = document.querySelector("[data-heart-rate-offer]");
const offerPanel = document.querySelector("[data-heart-rate-offer-panel]");
const acceptButton = document.querySelector("[data-heart-rate-accept]");
const skipButton = document.querySelector("[data-heart-rate-skip]");
const stage = document.querySelector("[data-shen-stage]");
const canvas = document.querySelector("#mxcanvas");
const loader = document.querySelector("[data-heart-rate-loader]");
const loadingLabel = document.querySelector("[data-heart-rate-loading-label]");
const backgroundVideo = document.querySelector("[data-stream-role=\"fashion\"]");
const liveHeartRate = document.querySelector("[data-heart-rate-live]");
const liveHeartRateValue = document.querySelector("[data-heart-rate-live-value]");
const deepARPreview = document.querySelector("[data-heart-rate-deepar]");
const deepARPreviewElement = document.querySelector("[data-heart-rate-deepar-preview]");
const deepARVideoElement = document.querySelector("[data-heart-rate-deepar-source]");
const shenVisualPlanes = [...document.querySelectorAll("[data-shen-visual-plane]")];
const finalHeartRate = document.querySelector("[data-heart-rate-result]");
const finalHeartRateValue = document.querySelector("[data-heart-rate-result-value]");
const status = document.querySelector("[data-shen-status]");
const currentHeartRateStorageKey = "iamCurrentCheckinHeartRateV1";
const legacyHeartDataKeys = Object.freeze([
  "iam.shenResearch.preHeartRate.v1",
  "iam.shenResearch.user.v1",
  currentHeartRateStorageKey,
]);

let shenaiSDK = null;
let transientMeasurementId = null;
let isStarting = false;
let isFinishing = false;
let liveHeartRateTimer = 0;
let sharedCameraStream = null;
let shenOwnsSharedCameraStream = false;
let deepARSession = null;
let cameraLifecycle = 0;
let shenCompositorFrame = 0;
let shenCompositorActive = false;
let shenCompositorLastFrameAt = 0;
let loadingSequenceTimers = [];

const FINAL_READING_HOLD_MS = 2200;
const SHEN_COMPOSITOR_FRAME_MS = 1000 / 24;

function revealExistingBrand() {
  document.querySelector(".brand-name")?.classList.add("is-visible");
  document.querySelector(".brand-suffix")?.classList.add("is-visible");
  document.querySelectorAll("[data-atomic-logo]").forEach((logo) => {
    const reveal = () => { logo.dataset.logoReady = "true"; };
    if (logo.complete && logo.naturalWidth > 0) reveal();
    else logo.addEventListener("load", reveal, { once: true });
  });
}

function experienceUrl({ heartCheckCompleted = false } = {}) {
  const target = new URL("index.html", window.location.href);
  const current = new URLSearchParams(window.location.search);
  const selectedTrackId = current.get("selected_track_id");
  if (selectedTrackId) target.searchParams.set("selected_track_id", selectedTrackId);
  const selectionSource = heartCheckCompleted
    ? "heart_check_inference"
    : current.get("selection_source");
  if (selectionSource) target.searchParams.set("selection_source", selectionSource);
  return target.href;
}

function showStatus(message, { allowContinue = false } = {}) {
  status.replaceChildren(document.createTextNode(message));
  if (allowContinue) {
    status.append(document.createTextNode(" "));
    const link = document.createElement("a");
    link.href = experienceUrl();
    link.textContent = "Continue without measuring.";
    status.append(link);
  }
  status.hidden = false;
}

function hideOffer() {
  offer.hidden = true;
  offer.setAttribute("aria-hidden", "true");
}

function clearLegacyHeartData() {
  try {
    legacyHeartDataKeys.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Storage may be unavailable; Heart Check remains optional and non-blocking.
  }
}

function storeCurrentCheckinHeartRate(heartRate) {
  const normalized = normalizedHeartRate(heartRate);
  if (normalized === null) return false;

  const record = {
    schema_version: "iam_current_checkin_heart_rate_v1",
    heart_rate_bpm: normalized,
    measured_at: Date.now(),
    measurement_duration_seconds: 10,
    source: "shen_quick_hr",
    scope: "current_tab_session",
  };

  try {
    sessionStorage.setItem(currentHeartRateStorageKey, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

function createTransientMeasurementId() {
  return globalThis.crypto?.randomUUID?.() || "";
}

function setLoadingProgress(progress) {
  const bounded = Math.max(0, Math.min(100, Number(progress) || 0));
  stage.dataset.shenLoadingProgress = String(Math.round(bounded));
  if (bounded >= 92 && stage.dataset.state === "loading") {
    loadingLabel.textContent = "Almost ready";
  }
}

function stopLoadingSequence() {
  loadingSequenceTimers.forEach((timer) => window.clearTimeout(timer));
  loadingSequenceTimers = [];
}

function showLoader(label) {
  stopLoadingSequence();
  loadingLabel.textContent = label;
  loader.hidden = false;
  loadingSequenceTimers = [
    window.setTimeout(() => {
      if (stage.dataset.state === "loading") {
        loadingLabel.textContent = "Setting up private on-device processing";
      }
    }, 4200),
    window.setTimeout(() => {
      if (stage.dataset.state === "loading") loadingLabel.textContent = "Almost ready";
    }, 9800),
  ];
}

function stopShenPixelCompositor() {
  shenCompositorActive = false;
  window.cancelAnimationFrame(shenCompositorFrame);
  shenCompositorFrame = 0;
  shenCompositorLastFrameAt = 0;
  shenVisualPlanes.forEach((plane) => {
    const context = plane.getContext("2d");
    context?.clearRect(0, 0, plane.width, plane.height);
    plane.hidden = true;
  });
}

function renderShenPixelPlanes(timestamp = performance.now()) {
  if (!shenCompositorActive || !deepARSession || stage.dataset.state !== "measurement") return;
  try {
    if (canvas.width > 0
      && canvas.height > 0
      && timestamp - shenCompositorLastFrameAt >= SHEN_COMPOSITOR_FRAME_MS) {
      const splitY = Math.round(canvas.height * 0.76);
      shenCompositorLastFrameAt = timestamp;
      shenVisualPlanes.forEach((plane) => {
        if (plane.width !== canvas.width || plane.height !== canvas.height) {
          plane.width = canvas.width;
          plane.height = canvas.height;
        }
        const context = plane.getContext("2d");
        context.clearRect(0, 0, plane.width, plane.height);
        if (plane.dataset.shenVisualPlane === "upper") {
          context.drawImage(canvas, 0, 0, canvas.width, splitY, 0, 0, plane.width, splitY);
        } else {
          const lowerHeight = canvas.height - splitY;
          context.drawImage(
            canvas,
            0,
            splitY,
            canvas.width,
            lowerHeight,
            0,
            splitY,
            plane.width,
            lowerHeight,
          );
        }
        plane.hidden = false;
      });
    }
  } catch {
    stopShenPixelCompositor();
    deepARPreview.hidden = true;
    deepARPreview.setAttribute("aria-hidden", "true");
    stage.dataset.deeparReady = "false";
    stage.dataset.deeparComposite = "unavailable";
    return;
  }
  shenCompositorFrame = window.requestAnimationFrame(renderShenPixelPlanes);
}

function startShenPixelCompositor() {
  stopShenPixelCompositor();
  if (!deepARSession || shenVisualPlanes.length !== 2) return false;
  shenCompositorActive = true;
  renderShenPixelPlanes(performance.now());
  return true;
}

function showMeasurementInterface() {
  stopLoadingSequence();
  stage.dataset.state = "measurement";
  stage.dataset.shenVisualizationConfig = "face-map-and-blood-flow";
  stage.dataset.shenMeasurement = "quick-heart-rate-10-seconds";
  loader.hidden = true;
  canvas.removeAttribute("aria-hidden");
  const hasDeepAR = Boolean(deepARSession);
  stage.dataset.deeparReady = String(hasDeepAR);
  deepARPreview.hidden = !hasDeepAR;
  deepARPreview.setAttribute("aria-hidden", String(!hasDeepAR));
  const compositorReady = hasDeepAR && startShenPixelCompositor();
  stage.dataset.deeparReady = String(compositorReady);
  stage.dataset.deeparComposite = compositorReady
    ? "full-frame-with-live-shen-pixel-planes"
    : "unavailable";
  if (!compositorReady) {
    deepARPreview.hidden = true;
    deepARPreview.setAttribute("aria-hidden", "true");
  }
  startLiveHeartRateMonitor();
}

function normalizedHeartRate(value) {
  const heartRate = Number(value);
  return Number.isFinite(heartRate) && heartRate >= 30 && heartRate <= 220
    ? Math.round(heartRate)
    : null;
}

function updateLiveHeartRate() {
  const heartRate = normalizedHeartRate(shenaiSDK?.getHeartRate4s?.());
  if (heartRate === null) return;
  liveHeartRateValue.textContent = String(heartRate);
  liveHeartRate.hidden = false;
}

function startLiveHeartRateMonitor() {
  window.clearInterval(liveHeartRateTimer);
  updateLiveHeartRate();
  liveHeartRateTimer = window.setInterval(updateLiveHeartRate, 1000);
}

function stopLiveHeartRateMonitor() {
  window.clearInterval(liveHeartRateTimer);
  liveHeartRateTimer = 0;
  liveHeartRate.hidden = true;
  liveHeartRateValue.textContent = "";
}

function showFinalHeartRate(heartRate) {
  stage.dataset.state = "result";
  loader.hidden = true;
  canvas.setAttribute("aria-hidden", "true");
  finalHeartRateValue.textContent = String(heartRate);
  finalHeartRate.hidden = false;
}

function clearFinalHeartRate() {
  finalHeartRate.hidden = true;
  finalHeartRateValue.textContent = "";
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function measurementPresetValue(preset) {
  return Number(preset?.value ?? preset);
}

async function confirmQuickHeartRatePreset() {
  if (typeof shenaiSDK?.setMeasurementPreset !== "function"
    || typeof shenaiSDK?.getMeasurementPreset !== "function") {
    return false;
  }
  const expected = measurementPresetValue(MeasurementPreset.QUICK_HR_MODE);
  shenaiSDK.setMeasurementPreset(MeasurementPreset.QUICK_HR_MODE);
  let active = Number.NaN;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    active = measurementPresetValue(shenaiSDK.getMeasurementPreset());
    if (Number.isFinite(expected) && active === expected) break;
    await wait(50);
  }
  stage.dataset.shenMeasurementPresetExpected = String(expected);
  stage.dataset.shenMeasurementPresetActive = String(active);
  return Number.isFinite(expected) && active === expected;
}

async function acquireSharedVideoStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser cannot open the camera for Heart Check.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: "user" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });
  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();
  if (videoTracks.length !== 1 || audioTracks.length !== 0) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error("Heart Check requires one video-only camera stream.");
  }
  stage.dataset.cameraStreams = "1";
  stage.dataset.cameraVideoTracks = "1";
  stage.dataset.cameraAudioTracks = "0";
  return stream;
}

function stopSharedVideoStream() {
  const stream = sharedCameraStream;
  sharedCameraStream = null;
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    if (track.readyState !== "ended") track.stop();
  });
}

async function releaseShen() {
  cameraLifecycle += 1;
  const active = shenaiSDK;
  const activeDeepAR = deepARSession;
  shenaiSDK = null;
  deepARSession = null;
  stopLoadingSequence();
  stopLiveHeartRateMonitor();
  stopShenPixelCompositor();
  deepARPreview.hidden = true;
  deepARPreview.setAttribute("aria-hidden", "true");
  delete stage.dataset.deeparReady;
  delete stage.dataset.deeparComposite;
  transientMeasurementId = null;
  const shenOwnedStream = shenOwnsSharedCameraStream;
  shenOwnsSharedCameraStream = false;
  let shenReleaseStarted = false;
  try {
    active?.deinitialize?.();
    shenReleaseStarted = Boolean(active && shenOwnedStream);
  } catch {
    // The application-owned fallback below still releases the camera.
  }
  if (shenReleaseStarted) sharedCameraStream = null;
  else stopSharedVideoStream();
  try {
    await activeDeepAR?.cleanup?.();
  } catch {
    // Camera release remains authoritative if the display-only overlay fails.
  }
}

async function finishAndContinue() {
  if (isFinishing) return;
  isFinishing = true;

  let measurementResult = null;
  let momentaryHeartRate = null;
  let displayHeartRate = null;
  try {
    measurementResult = shenaiSDK?.getMeasurementResults?.() || null;
    momentaryHeartRate = Number(measurementResult?.heart_rate_bpm);
    displayHeartRate = normalizedHeartRate(momentaryHeartRate);
  } finally {
    measurementResult = null;
  }

  await releaseShen();
  try {
    if (displayHeartRate !== null) {
      showFinalHeartRate(displayHeartRate);
      await wait(FINAL_READING_HOLD_MS);
      const handoff = await handoffHeartCheckToHomepage(momentaryHeartRate, {
        storage: sessionStorage,
        fetchImpl: (...args) => fetch(...args),
      });
      if (handoff.accepted) storeCurrentCheckinHeartRate(displayHeartRate);
    }
  } finally {
    momentaryHeartRate = null;
    displayHeartRate = null;
    clearFinalHeartRate();
  }
  stage.dataset.state = "complete";
  window.location.assign(experienceUrl({ heartCheckCompleted: true }));
}

async function requestShortTermToken() {
  const response = await fetch("api/shen-token.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    credentials: "same-origin",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.token) {
    throw new Error(payload.error || "The heart-rate check is unavailable right now.");
  }
  return payload.token;
}

function initializeWithToken(token) {
  return new Promise((resolve, reject) => {
    const settings = {
      measurementPreset: MeasurementPreset.QUICK_HR_MODE,
      onboardingMode: OnboardingMode.HIDDEN,
      precisionMode: PrecisionMode.STRICT,
      uiVersion: UiVersion.V3,
      showUserInterface: true,
      showDisclaimer: false,
      showInfoButton: false,
      showStartStopButton: true,
      showSignalQualityIndicator: true,
      showFaceMask: true,
      showBloodFlow: true,
      enableSummaryScreen: false,
      showResultsFinishButton: false,
      enableStartAfterSuccess: false,
      hideShenaiLogo: true,
      showTrialMetricLabels: false,
      eventCallback(event) {
        if (event === "MEASUREMENT_FINISHED" || event === "USER_FLOW_FINISHED") {
          void finishAndContinue();
        }
      },
      onCameraError() {
        void releaseShen();
        showStatus("Camera access is needed for this optional Heart Check.", { allowContinue: true });
      },
    };

    shenaiSDK.initialize(token, transientMeasurementId, settings, async (result) => {
      if (result === InitializationResult.OK) {
        if (typeof shenaiSDK?.setMediaStream !== "function" || !sharedCameraStream) {
          reject(new Error("The shared Heart Check camera stream is unavailable."));
          return;
        }
        shenaiSDK.setMediaStream(sharedCameraStream, true);
        shenOwnsSharedCameraStream = true;
        const quickHrConfirmed = await confirmQuickHeartRatePreset();
        stage.dataset.shenMeasurementPreset = quickHrConfirmed ? "quick-hr-mode" : "unexpected";
        if (!quickHrConfirmed) {
          reject(new Error("The 10-second Heart Check could not be confirmed."));
          return;
        }
        shenaiSDK.setShowFaceMask?.(true);
        shenaiSDK.setShowBloodFlow?.(true);
        shenaiSDK.setHideShenaiLogo?.(true);
        stage.dataset.shenBranding = shenaiSDK.getHideShenaiLogo?.() === true
          ? "hidden"
          : "sdk-controlled";
        resolve();
        return;
      }
      reject(new Error("The Heart Check could not start."));
    });
  });
}

async function beginShenMeasurement() {
  if (isStarting) return;
  isStarting = true;
  const lifecycle = cameraLifecycle + 1;
  cameraLifecycle = lifecycle;
  let pendingDeepAR = null;
  acceptButton.disabled = true;
  skipButton.disabled = true;
  hideOffer();
  stage.hidden = false;
  stage.dataset.state = "loading";
  showLoader("Preparing your Heart Check");
  setLoadingProgress(0);
  void warmHeartCheckAssets();

  try {
    transientMeasurementId = createTransientMeasurementId();
    sharedCameraStream = await acquireSharedVideoStream();
    const tokenPromise = requestShortTermToken();
    pendingDeepAR = createDeepARBrightGlasses({
      previewElement: deepARPreviewElement,
      videoElement: deepARVideoElement,
      stream: sharedCameraStream,
    }).catch(() => null);
    shenaiSDK = await CreateShenaiSDK({
      enableErrorReporting: false,
      enablePreloadDisplay: false,
      hidePreloadDisplayLogo: true,
      onWasmLoadingProgress: setLoadingProgress,
      locateFile(path, prefix) {
        if (path === "shenai_sdk.wasm") return heartCheckShenWasmUrl;
        return new URL(path, prefix || import.meta.url).href;
      },
    });
    const token = await tokenPromise;
    await initializeWithToken(token);
    const initializedDeepAR = await pendingDeepAR;
    pendingDeepAR = null;
    if (lifecycle !== cameraLifecycle) {
      await initializedDeepAR?.cleanup?.();
      return;
    }
    deepARSession = initializedDeepAR;
    stage.dataset.deeparEffect = deepARSession
      ? "official-bright-glasses"
      : "unavailable";
    showMeasurementInterface();
  } catch (error) {
    const unusedDeepAR = await pendingDeepAR?.catch?.(() => null);
    await unusedDeepAR?.cleanup?.();
    await releaseShen();
    stage.hidden = true;
    showStatus(error?.message || "The heart-rate check is unavailable right now.", { allowContinue: true });
  } finally {
    isStarting = false;
  }
}

acceptButton.addEventListener("click", beginShenMeasurement);
skipButton.addEventListener("click", () => window.location.assign(experienceUrl()));
window.addEventListener("beforeunload", releaseShen);
window.addEventListener("pagehide", releaseShen);

clearLegacyHeartData();
revealExistingBrand();
const beginWarmup = () => { void warmHeartCheckAssets(); };
if (backgroundVideo?.readyState >= 2) beginWarmup();
else {
  ["loadeddata", "canplay", "playing"].forEach((eventName) => {
    backgroundVideo?.addEventListener(eventName, beginWarmup, { once: true });
  });
  window.setTimeout(beginWarmup, 1800);
}
window.setTimeout(() => offerPanel.focus({ preventScroll: true }), 0);
