import CreateShenaiSDK, {
  InitializationResult,
  MeasurementPreset,
  Metric,
  OnboardingMode,
  PrecisionMode,
  UiVersion,
} from "./vendor/shenai-sdk/index.mjs";
import { reconcileHeartCheckInference } from "./shen-heart-recommendation.js?v=b3de95f8a562";

const offer = document.querySelector("[data-heart-rate-offer]");
const offerPanel = document.querySelector("[data-heart-rate-offer-panel]");
const acceptButton = document.querySelector("[data-heart-rate-accept]");
const skipButton = document.querySelector("[data-heart-rate-skip]");
const stage = document.querySelector("[data-shen-stage]");
const canvas = document.querySelector("#mxcanvas");
const loader = document.querySelector("[data-heart-rate-loader]");
const loadingLabel = document.querySelector("[data-heart-rate-loading-label]");
const loadingTrack = document.querySelector("[data-heart-rate-loading-track]");
const loadingProgress = document.querySelector("[data-heart-rate-loading-progress]");
const liveHeartRate = document.querySelector("[data-heart-rate-live]");
const liveHeartRateValue = document.querySelector("[data-heart-rate-live-value]");
const arGlasses = document.querySelector("[data-heart-rate-ar-glasses]");
const finalHeartRate = document.querySelector("[data-heart-rate-result]");
const finalHeartRateValue = document.querySelector("[data-heart-rate-result-value]");
const status = document.querySelector("[data-shen-status]");
const legacyHeartDataKeys = Object.freeze([
  "iam.shenResearch.preHeartRate.v1",
  "iam.shenResearch.user.v1",
]);

let shenaiSDK = null;
let transientMeasurementId = null;
let isStarting = false;
let isFinishing = false;
let liveHeartRateTimer = 0;
let arGlassesFrame = 0;
let arGlassesActive = false;

const FINAL_READING_HOLD_MS = 2200;

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
    // Storage may be unavailable; this version never writes biometric data.
  }
}

function createTransientMeasurementId() {
  return globalThis.crypto?.randomUUID?.() || "";
}

function setLoadingProgress(progress) {
  const bounded = Math.max(0, Math.min(100, Number(progress) || 0));
  loadingProgress.style.width = `${bounded}%`;
  loadingTrack.setAttribute("aria-valuenow", String(Math.round(bounded)));
}

function showLoader(label, { showProgress = true } = {}) {
  loadingLabel.textContent = label;
  loadingTrack.hidden = !showProgress;
  loader.hidden = false;
}

function showMeasurementInterface() {
  stage.dataset.state = "measurement";
  stage.dataset.shenVisualizationConfig = "face-map-and-blood-flow";
  stage.dataset.shenMeasurement = "heart-rate-10-seconds";
  loader.hidden = true;
  canvas.removeAttribute("aria-hidden");
  startLiveHeartRateMonitor();
}

function boundedUnit(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : null;
}

function normalizedFaceBox(value) {
  if (!value) return null;
  const candidate = value.boundingBox || value.bbox || value;
  const values = Array.isArray(candidate) || ArrayBuffer.isView(candidate)
    ? Array.from(candidate)
    : null;
  let left = values?.[0] ?? candidate.left ?? candidate.x ?? candidate.xMin ?? candidate.x_min;
  let top = values?.[1] ?? candidate.top ?? candidate.y ?? candidate.yMin ?? candidate.y_min;
  let width = values?.[2] ?? candidate.width ?? candidate.w;
  let height = values?.[3] ?? candidate.height ?? candidate.h;

  const right = candidate.right ?? candidate.xMax ?? candidate.x_max;
  const bottom = candidate.bottom ?? candidate.yMax ?? candidate.y_max;
  if (!values && width == null && right != null) width = Number(right) - Number(left);
  if (!values && height == null && bottom != null) height = Number(bottom) - Number(top);

  left = boundedUnit(left);
  top = boundedUnit(top);
  width = boundedUnit(width);
  height = boundedUnit(height);
  if (left === null || top === null || width === null || height === null) return null;
  if (width < 0.08 || height < 0.1 || left + width > 1.05 || top + height > 1.05) return null;
  return { left, top, width, height };
}

function positionArGlasses() {
  if (!arGlassesActive) return;
  let faceBox = null;
  try {
    faceBox = normalizedFaceBox(shenaiSDK?.getNormalizedFaceBbox?.());
  } catch {
    // Shen retains ownership of face detection; the centred guide remains safe.
  }

  if (faceBox) {
    const centreX = faceBox.left + (faceBox.width / 2);
    const eyeLine = faceBox.top + (faceBox.height * 0.39);
    const glassesWidth = Math.max(0.24, Math.min(0.52, faceBox.width * 1.12));
    arGlasses.style.setProperty("--ar-glasses-x", `${centreX * 100}%`);
    arGlasses.style.setProperty("--ar-glasses-y", `${eyeLine * 100}%`);
    arGlasses.style.setProperty("--ar-glasses-width", `${glassesWidth * 100}%`);
    arGlasses.dataset.tracking = "face";
  } else {
    arGlasses.style.removeProperty("--ar-glasses-x");
    arGlasses.style.removeProperty("--ar-glasses-y");
    arGlasses.style.removeProperty("--ar-glasses-width");
    arGlasses.dataset.tracking = "guide";
  }
  arGlassesFrame = window.requestAnimationFrame(positionArGlasses);
}

function startArGlasses() {
  if (arGlassesActive || stage.dataset.state !== "measurement") return;
  arGlassesActive = true;
  arGlasses.hidden = false;
  positionArGlasses();
}

function stopArGlasses() {
  arGlassesActive = false;
  window.cancelAnimationFrame(arGlassesFrame);
  arGlassesFrame = 0;
  arGlasses.hidden = true;
  arGlasses.dataset.tracking = "guide";
  arGlasses.style.removeProperty("--ar-glasses-x");
  arGlasses.style.removeProperty("--ar-glasses-y");
  arGlasses.style.removeProperty("--ar-glasses-width");
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

function showRecommendationTransition() {
  stage.dataset.state = "recommendation";
  canvas.setAttribute("aria-hidden", "true");
  showLoader("Finding your experience", { showProgress: false });
}

async function releaseShen() {
  const active = shenaiSDK;
  shenaiSDK = null;
  stopLiveHeartRateMonitor();
  stopArGlasses();
  transientMeasurementId = null;
  try {
    active?.deinitialize?.();
  } catch {
    // Page navigation still releases the browser camera and runtime.
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
  const inferencePromise = displayHeartRate === null
    ? Promise.resolve(null)
    : reconcileHeartCheckInference(momentaryHeartRate, {
      storage: sessionStorage,
      fetchImpl: (...args) => fetch(...args),
    }).catch(() => null);
  momentaryHeartRate = null;
  if (displayHeartRate !== null) {
    showFinalHeartRate(displayHeartRate);
    await wait(FINAL_READING_HOLD_MS);
    clearFinalHeartRate();
    displayHeartRate = null;
  }
  showRecommendationTransition();
  await inferencePromise;
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
    const customMeasurementConfig = {
      durationSeconds: 10,
      instantMetrics: [Metric.HEART_RATE],
      summaryMetrics: [Metric.HEART_RATE],
      realtimeHrPeriodSeconds: 4,
    };
    if (typeof shenaiSDK.setCustomMeasurementConfig !== "function") {
      reject(new Error("The 10-second Heart Check is unavailable in this SDK."));
      return;
    }
    shenaiSDK.setCustomMeasurementConfig(customMeasurementConfig);

    const settings = {
      measurementPreset: MeasurementPreset.CUSTOM,
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
        showStatus("Camera access is needed for this optional Heart Check.", { allowContinue: true });
      },
    };

    shenaiSDK.initialize(token, transientMeasurementId, settings, (result) => {
      if (result === InitializationResult.OK) {
        stage.dataset.shenCustomMeasurement = "runtime-setter";
        shenaiSDK.setShowFaceMask?.(true);
        shenaiSDK.setShowBloodFlow?.(true);
        shenaiSDK.setHideShenaiLogo?.(true);
        stage.dataset.shenBranding = shenaiSDK.getHideShenaiLogo?.() === true
          ? "hidden"
          : "sdk-controlled";
        showMeasurementInterface();
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
  acceptButton.disabled = true;
  skipButton.disabled = true;
  hideOffer();
  stage.hidden = false;
  stage.dataset.state = "loading";
  showLoader("Loading");
  setLoadingProgress(0);

  try {
    transientMeasurementId = createTransientMeasurementId();
    const tokenPromise = requestShortTermToken();
    shenaiSDK = await CreateShenaiSDK({
      enableErrorReporting: false,
      enablePreloadDisplay: false,
      hidePreloadDisplayLogo: true,
      onWasmLoadingProgress: setLoadingProgress,
    });
    const token = await tokenPromise;
    await initializeWithToken(token);
  } catch (error) {
    await releaseShen();
    stage.hidden = true;
    showStatus(error?.message || "The heart-rate check is unavailable right now.", { allowContinue: true });
  } finally {
    isStarting = false;
  }
}

acceptButton.addEventListener("click", beginShenMeasurement);
skipButton.addEventListener("click", () => window.location.assign(experienceUrl()));
stage.addEventListener("click", startArGlasses);
window.addEventListener("pagehide", releaseShen);

clearLegacyHeartData();
revealExistingBrand();
window.setTimeout(() => offerPanel.focus({ preventScroll: true }), 0);
