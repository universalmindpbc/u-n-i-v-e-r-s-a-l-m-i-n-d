import CreateShenaiSDK, {
  InitializationResult,
  MeasurementPreset,
  OnboardingMode,
  PrecisionMode,
  UiVersion,
} from "./vendor/shenai-sdk/index.mjs";

const offer = document.querySelector("[data-heart-rate-offer]");
const offerPanel = document.querySelector("[data-heart-rate-offer-panel]");
const acceptButton = document.querySelector("[data-heart-rate-accept]");
const skipButton = document.querySelector("[data-heart-rate-skip]");
const stage = document.querySelector("[data-shen-stage]");
const status = document.querySelector("[data-shen-status]");
const resultStorageKey = "iam.shenResearch.preHeartRate.v1";
let shenaiSDK = null;
let isStarting = false;

function revealExistingBrand() {
  document.querySelector(".brand-name")?.classList.add("is-visible");
  document.querySelector(".brand-suffix")?.classList.add("is-visible");
  document.querySelectorAll("[data-atomic-logo]").forEach((logo) => {
    const reveal = () => { logo.dataset.logoReady = "true"; };
    if (logo.complete && logo.naturalWidth > 0) reveal();
    else logo.addEventListener("load", reveal, { once: true });
  });
}

function experienceUrl() {
  const target = new URL("index.html", window.location.href);
  const current = new URLSearchParams(window.location.search);
  ["selected_track_id", "selection_source", "selection_needs"].forEach((name) => {
    const value = current.get(name);
    if (value) target.searchParams.set(name, value);
  });
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

function pseudonymousUserId() {
  const key = "iam.shenResearch.user.v1";
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) return stored;
    const value = crypto.randomUUID();
    sessionStorage.setItem(key, value);
    return value;
  } catch {
    return "";
  }
}

function storeHeartRateResult() {
  const result = shenaiSDK?.getMeasurementResults?.();
  const bpm = Math.round(Number(result?.heart_rate_bpm));
  if (!Number.isFinite(bpm) || bpm < 30 || bpm > 240) return;

  try {
    sessionStorage.setItem(resultStorageKey, JSON.stringify({
      metric: "heart_rate",
      bpm,
      averageSignalQuality: Number.isFinite(Number(result?.average_signal_quality))
        ? Number(result.average_signal_quality)
        : null,
      measuredAt: new Date().toISOString(),
      provider: "Shen AI",
    }));
  } catch {
    // The Shen result remains visible even when session storage is unavailable.
  }
}

async function releaseShen() {
  const active = shenaiSDK;
  shenaiSDK = null;
  try {
    active?.deinitialize?.();
  } catch {
    // Page navigation still releases the browser camera and runtime.
  }
}

async function finishAndContinue() {
  storeHeartRateResult();
  await releaseShen();
  window.location.assign(experienceUrl());
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
      showDisclaimer: true,
      showInfoButton: true,
      showStartStopButton: true,
      showSignalQualityIndicator: true,
      enableSummaryScreen: true,
      showResultsFinishButton: true,
      enableStartAfterSuccess: false,
      hideShenaiLogo: false,
      showTrialMetricLabels: false,
      eventCallback(event) {
        if (event === "MEASUREMENT_FINISHED") storeHeartRateResult();
        if (event === "USER_FLOW_FINISHED") finishAndContinue();
      },
      onCameraError() {
        showStatus("Camera access is needed for this optional heart-rate check.", { allowContinue: true });
      },
    };

    shenaiSDK.initialize(token, pseudonymousUserId(), settings, (result) => {
      if (result === InitializationResult.OK) {
        resolve();
        return;
      }
      reject(new Error("Shen could not start the heart-rate check."));
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

  try {
    const tokenPromise = requestShortTermToken();
    shenaiSDK = await CreateShenaiSDK({
      enableErrorReporting: false,
      enablePreloadDisplay: true,
      preloadDisplayCanvasId: "mxcanvas",
      hidePreloadDisplayLogo: false,
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

revealExistingBrand();
window.setTimeout(() => offerPanel.focus({ preventScroll: true }), 0);
