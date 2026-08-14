import CreateShenaiSDK, {
  InitializationResult,
  MeasurementPreset,
  OnboardingMode,
  OperatingMode,
  PrecisionMode,
  UiVersion,
} from "./vendor/shenai-sdk/index.mjs";
import { ADAPTIVE_SOUND_SESSION_CHOICE_KEY } from "../adaptive-sound/session-v1.js?v=3f39020ebeab";
import { writeEphemeralHeartCheckRecommendation } from "./shen-heart-recommendation.js";

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
const status = document.querySelector("[data-shen-status]");
const legacyHeartDataKeys = Object.freeze([
  "iam.shenResearch.preHeartRate.v1",
  "iam.shenResearch.user.v1",
]);

let shenaiSDK = null;
let transientMeasurementId = null;
let isStarting = false;
let isFinishing = false;
let visualizationMonitor = 0;
let activeVisualization = "";

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
    ? "heart_check_recommendation"
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
  loader.hidden = true;
  canvas.removeAttribute("aria-hidden");
}

function setShenVisualization(mode) {
  if (mode === activeVisualization) return;
  const showBloodFlow = mode === "blood-flow";
  shenaiSDK?.setShowFaceMask?.(!showBloodFlow);
  shenaiSDK?.setShowBloodFlow?.(showBloodFlow);
  stage.dataset.shenVisualization = mode;
  activeVisualization = mode;
}

function syncShenVisualization() {
  if (!shenaiSDK) return;
  const operatingMode = shenaiSDK.getOperatingMode?.();
  if (operatingMode === OperatingMode.MEASURE) {
    setShenVisualization("blood-flow");
  } else if (operatingMode === OperatingMode.POSITIONING) {
    setShenVisualization("face-mask");
  }
}

function startVisualizationMonitor() {
  window.clearInterval(visualizationMonitor);
  setShenVisualization("face-mask");
  visualizationMonitor = window.setInterval(syncShenVisualization, 100);
}

function showRecommendationTransition() {
  stage.dataset.state = "recommendation";
  canvas.setAttribute("aria-hidden", "true");
  showLoader("Finding your experience", { showProgress: false });
}

async function releaseShen() {
  const active = shenaiSDK;
  shenaiSDK = null;
  window.clearInterval(visualizationMonitor);
  visualizationMonitor = 0;
  activeVisualization = "";
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
  try {
    measurementResult = shenaiSDK?.getMeasurementResults?.() || null;
    momentaryHeartRate = Number(measurementResult?.heart_rate_bpm);
    writeEphemeralHeartCheckRecommendation(
      momentaryHeartRate,
      sessionStorage,
      ADAPTIVE_SOUND_SESSION_CHOICE_KEY,
    );
  } finally {
    momentaryHeartRate = null;
    measurementResult = null;
  }

  showRecommendationTransition();
  await releaseShen();
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
      showBloodFlow: false,
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
        startVisualizationMonitor();
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
window.addEventListener("pagehide", releaseShen);

clearLegacyHeartData();
revealExistingBrand();
window.setTimeout(() => offerPanel.focus({ preventScroll: true }), 0);
