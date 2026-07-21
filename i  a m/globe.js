const musicVideo = document.querySelector("[data-music-video]");
const checkInLabel = document.querySelector("[data-checkin-label]");
const iamForm = document.querySelector("[data-iam-form]");
const iamStart = document.querySelector("[data-iam-start]");
const iamControl = document.querySelector("[data-iam-control]");
const iamDisplay = document.querySelector("[data-iam-display]");
const iamInput = document.querySelector("[data-iam-input]");
const iamJoiningLoader = document.querySelector(".iam-joining-loader");
const iamReflection = document.querySelector("[data-iam-reflection]");
const iamReflectionFlora = document.querySelector("[data-iam-reflection-flora]");
const iamReflectionText = document.querySelector("[data-iam-reflection-text]");
const iamTransfer = document.querySelector("[data-iam-transfer]");
const globePage = document.querySelector(".globe-page");
const isCommunityOverlay = document.documentElement.classList.contains("iam-community-overlay");
const communityMonogramTextureUrl = "a s s e t s/universal-mind-flora-travel-monogram-leather-v1.webp";
const configuredInferenceEndpoint =
  window.IAM_CITIZEN_NEEDS_INFERENCE_ENDPOINT ||
  document.querySelector('meta[name="iam-citizen-needs-inference-endpoint"]')?.content;
const previewUsesSameOriginInference =
  ["127.0.0.1", "localhost", "::1"].includes(window.location.hostname) ||
  window.location.hostname.endsWith(".trycloudflare.com");
const citizenNeedsInferenceEndpoint =
  (previewUsesSameOriginInference && "/api/citizen-needs-inference") ||
  configuredInferenceEndpoint ||
  "/api/citizen-needs-inference";
const configuredMusicVideoSelectionEndpoint =
  window.IAM_ADAPTIVE_MUSIC_VIDEO_SELECTION_ENDPOINT ||
  document.querySelector('meta[name="iam-adaptive-music-video-selection-endpoint"]')?.content;
const adaptiveMusicVideoSelectionEndpoint = configuredMusicVideoSelectionEndpoint || "/api/adaptive-music-video-selection";
const musicTelevisionStorageKeys = [
  "iamMusicTelevisionSelection",
  "iamLatestMusicVideoSelection",
  "iamMusicTelevisionRecommendation",
  "iamLatestMusicVideoRecommendation",
];
const musicSelectionHistoryKey = "iamMusicTelevisionSelectionHistory";
const musicSelectionCountKey = "iamMusicTelevisionSelectionCount";
const musicVisitorIdKey = "iamAnonymousMusicVisitorId";
const pendingCheckInPipelineKey = "iamPendingCheckInPipeline";
const resetMusicTelevisionSelection = new URLSearchParams(window.location.search).get("resetMusicTv") === "1";

if (resetMusicTelevisionSelection) {
  [window.sessionStorage, window.localStorage].forEach((store) => {
    musicTelevisionStorageKeys.forEach((key) => store.removeItem(key));
  });
  delete window.__iamLatestMusicTelevisionSelection;
}

const umLogoImage = new Image();
umLogoImage.decoding = "async";
umLogoImage.src = "a s s e t s/Universal Mind [ I o H ] Logo.PNG";

const checkInData = [
  { lat: 40.7128, lng: -74.0060, label: "New York", size: 0.08, color: "#ffffff" },
  { lat: 51.5072, lng: -0.1276, label: "London", size: 0.07, color: "#ffffff" },
  { lat: 35.6762, lng: 139.6503, label: "Tokyo", size: 0.08, color: "#80a8ff" },
  { lat: 25.2048, lng: 55.2708, label: "Dubai", size: 0.07, color: "#ffffff" },
  { lat: -33.9249, lng: 18.4241, label: "Cape Town", size: 0.07, color: "#ffffff" },
  { lat: -17.7134, lng: 178.0650, label: "Fiji", size: 0.08, color: "#80a8ff" },
  { lat: -33.8688, lng: 151.2093, label: "Sydney", size: 0.07, color: "#ffffff" },
  { lat: 37.5665, lng: 126.9780, label: "Seoul", size: 0.07, color: "#80a8ff" },
  { lat: 28.6139, lng: 77.2090, label: "Delhi", size: 0.07, color: "#ffffff" },
];

const arcData = [
  { startLat: 32.7157, startLng: -117.1611, endLat: 40.7128, endLng: -74.0060, color: "#ffffff" },
  { startLat: 35.1434, startLng: -78.9922, endLat: 48.8566, endLng: 2.3522, color: "#00f0d8" },
  { startLat: -33.8688, startLng: 151.2093, endLat: 48.8566, endLng: 2.3522, color: "#d8fff8" },
];

const namasteData = [
  { lat: 42.0, lng: -12.0, text: "नमस्ते", color: "#ffd92e" },
  { lat: 48.0, lng: 82.0, text: "合十礼", color: "#d8fff8" },
  { lat: 10.0, lng: 46.0, text: "نَمَسْتِي", color: "#00f0d8" },
  { lat: 62.0, lng: -48.0, text: "namaste", color: "#ffffff" },
];

const communityNodes = [
  { lat: -28.6474, lng: 153.6020, name: "Byron Bay", checkin: "I am hopeful", hero: true },
  { lat: 64.5399, lng: 40.5158, name: "Gulf of Archangel", checkin: "I am healing", hero: true },
  { lat: 21.1619, lng: -86.8515, name: "Cancun", checkin: "I am strong", hero: true },
  { lat: 45.4642, lng: 9.1900, name: "Northern Italy", checkin: "I am grateful", hero: true },
  { lat: 37.5665, lng: 126.9780, name: "Seoul", checkin: "I am grounded", hero: true },
  { lat: -3.0674, lng: 37.3556, name: "Mt Kilimanjaro", checkin: "I am alone", hero: true },
  { lat: 46.0207, lng: 7.7491, name: "Zermatt", checkin: "I am enough", hero: true },
  { lat: -33.4647, lng: 151.4358, name: "Avoca Beach", checkin: "I am safe", hero: true },
  { lat: 28.6139, lng: 77.2090, name: "Delhi", checkin: "I am anxious", hero: true },
  { lat: 31.2304, lng: 121.4737, name: "Shanghai", checkin: "I am present", hero: true },
  { lat: 25.2048, lng: 55.2708, name: "Dubai", checkin: "I am resilient", hero: true },
  { lat: -33.8915, lng: 151.2767, name: "Bondi Beach", checkin: "I am supported", hero: true },
  { lat: -25.3444, lng: 131.0369, name: "Uluru", checkin: "I am connected", hero: true },
  { lat: -43.5950, lng: 170.1418, name: "Aoraki Mt Cook" },
  { lat: -17.7134, lng: 178.0650, name: "Fiji" },
  { lat: -8.3405, lng: 115.0920, name: "Bali" },
  { lat: 35.6762, lng: 139.6503, name: "Tokyo" },
  { lat: 51.5072, lng: -0.1276, name: "London" },
  { lat: 40.7128, lng: -74.0060, name: "New York" },
  { lat: 35.1434, lng: -78.9922, name: "Fort Liberty" },
  { lat: -33.8688, lng: 151.2093, name: "Sydney" },
  { lat: -33.9249, lng: 18.4241, name: "Cape Town" },
];

let checkInIndex = 0;
const tickerMessages = [
  "Privacy By Design.",
  "You Own Your Data.",
  "No Internet Connection Required.",
];

function playVideo() {
  if (!musicVideo) return;

  musicVideo.muted = true;
  musicVideo.volume = 0;
  musicVideo.play().catch(() => {
    musicVideo.play().catch(() => {});
  });
}

playVideo();

if (checkInLabel) {
  function runTickerCycle() {
    checkInLabel.textContent = tickerMessages[checkInIndex];
    checkInLabel.classList.add("is-visible");

    window.setTimeout(() => {
      checkInLabel.classList.remove("is-visible");
    }, 6000);

    window.setTimeout(() => {
      checkInIndex = (checkInIndex + 1) % tickerMessages.length;
      runTickerCycle();
    }, 9000);
  }

  checkInLabel.textContent = tickerMessages[checkInIndex];
  window.setTimeout(runTickerCycle, 100);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

const iamTiming = {
  textFade: 180,
  focusPause: 120,
  thankYouHold: 900,
  joiningHold: 900,
  preparingHold: 520,
  transferDuration: 3600,
  transferTextRevealAt: 2400,
  reflectionFadeIn: 900,
  reflectionHold: 1300,
  reflectionDissolve: 480,
  integrationHold: 700,
  integratedGlobeHold: 6500,
  arrivalHomepageDelay: 10000,
  homeRedirectDelay: 900,
};

let isSubmitRunning = false;
let activeTransferAnimation = null;
let activeReflectionFloraAnimation = null;

async function currentEnvironmentContext() {
  if (typeof window.IAMLocalContext?.getContext !== "function") return null;

  try {
    const context = await window.IAMLocalContext.getContext();
    if (context?.gpt) return context.gpt;
    if (context) return window.IAMLocalContext.toGPTContext?.(context) || context;
  } catch {
    return null;
  }

  return null;
}

function normalizeCheckInResponse(value) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^i\s+am\s+/i, "")
    .replace(/^i'm\s+/i, "")
    .trim();
}

function punctuatePhrase(phrase) {
  return /[.!?]$/.test(phrase) ? phrase : `${phrase}.`;
}

function normalizeCheckInPhrase(value) {
  const response = normalizeCheckInResponse(value || "");
  return response ? `I am ${response}` : "";
}

function readUrlCheckIn() {
  try {
    const params = new URLSearchParams(window.location.search);
    return normalizeCheckInPhrase(params.get("iamTest") || params.get("checkin") || params.get("iam"));
  } catch {
    return "";
  }
}

function writeStoredValue(store, key, value) {
  try {
    store?.setItem(key, value);
  } catch {
    // Storage can be unavailable in private or restricted browser modes.
  }
}

function readStoredValue(store, key) {
  try {
    return store?.getItem(key) || "";
  } catch {
    return "";
  }
}

function queuePendingCheckInPipeline(phrase) {
  const record = {
    phrase: normalizeCheckInPhrase(phrase),
    queuedAt: Date.now(),
  };
  const serialized = JSON.stringify(record);
  [window.sessionStorage, window.localStorage].forEach((store) => {
    writeStoredValue(store, pendingCheckInPipelineKey, serialized);
  });
  return record;
}

function readPendingCheckInPipeline() {
  for (const store of [window.sessionStorage, window.localStorage]) {
    try {
      const serialized = readStoredValue(store, pendingCheckInPipelineKey);
      const record = serialized ? JSON.parse(serialized) : null;
      if (record?.phrase) return record;
    } catch {
      // Try the other store when a pending record is unavailable or malformed.
    }
  }
  return null;
}

function clearPendingCheckInPipeline() {
  [window.sessionStorage, window.localStorage].forEach((store) => {
    try {
      store?.removeItem(pendingCheckInPipelineKey);
    } catch {
      // Storage can be unavailable in private or restricted browser modes.
    }
  });
}

function persistLatestCheckIn(phrase, inference = {}, status = "pending") {
  const updatedAt = Date.now();
  const record = {
    checkin: phrase,
    updatedAt,
    status,
    ...inference,
  };
  const serializedRecord = JSON.stringify(record);
  const stores = [window.sessionStorage, window.localStorage];

  stores.forEach((store) => {
    writeStoredValue(store, "iamLatestCheckinValue", phrase);
    writeStoredValue(store, "iamLatestCheckinUpdated", String(updatedAt));
    writeStoredValue(store, "citizenNeedsLatestCheckinValue", phrase);
    writeStoredValue(store, "citizenNeedsLatestCheckinUpdated", String(updatedAt));
    writeStoredValue(store, "iamLatestInference", serializedRecord);
    writeStoredValue(store, "citizenNeedsLatestInference", serializedRecord);
  });

  window.__iamLatestInference = record;
  window.dispatchEvent(new CustomEvent("iam:inference-updated", { detail: record }));
  return record;
}

async function requestCitizenNeedsInference(phrase) {
  const environmentContext = await currentEnvironmentContext();

  if (!window.fetch || !window.AbortController) {
    throw new Error("gpt_inference_unavailable");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(citizenNeedsInferenceEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkin: phrase,
        environment_context: environmentContext,
      }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "gpt_inference_unavailable");
    }

    return persistLatestCheckIn(phrase, {
      ...payload,
      environment_context: payload.environment_context || environmentContext,
    }, "complete");
  } catch (error) {
    persistLatestCheckIn(phrase, { error: "gpt_inference_unavailable" }, "error");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function persistMusicTelevisionSelection(selection) {
  if (!selection || selection.schema_version !== "adaptive_music_video_selection_v1.11") return null;
  const previousHistory = readMusicSelectionHistory();
  const recommendationIndex = readMusicSelectionCount();
  const enrichedSelection = {
    ...selection,
    selected_at: Date.now(),
    selection_context: {
      ...(selection.selection_context || {}),
      visitor_id: getAnonymousMusicVisitorId(),
      recent_track_ids_before_selection: previousHistory,
      recommendation_index: recommendationIndex,
    },
  };
  const serialized = JSON.stringify(enrichedSelection);
  [window.sessionStorage, window.localStorage].forEach((store) => {
    writeStoredValue(store, "iamMusicTelevisionSelection", serialized);
    writeStoredValue(store, "iamLatestMusicVideoSelection", serialized);
    writeStoredValue(store, "iamMusicTelevisionRecommendation", serialized);
    writeStoredValue(store, "iamLatestMusicVideoRecommendation", serialized);
  });
  rememberMusicSelection(selection.selected_track_id);
  writeMusicSelectionCount(recommendationIndex + 1);
  window.__iamLatestMusicTelevisionSelection = enrichedSelection;
  window.dispatchEvent(new CustomEvent("iam:music-television-selection-updated", { detail: enrichedSelection }));
  return enrichedSelection;
}

function getAnonymousMusicVisitorId() {
  for (const store of [window.localStorage, window.sessionStorage]) {
    const existing = readStoredValue(store, musicVisitorIdKey);
    if (existing) return existing;
  }
  const visitorId = window.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  [window.localStorage, window.sessionStorage].forEach((store) => writeStoredValue(store, musicVisitorIdKey, visitorId));
  return visitorId;
}

function readMusicSelectionHistory() {
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = readStoredValue(store, musicSelectionHistoryKey);
      if (!raw) continue;
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String).slice(0, 13);
    } catch {
      // Try the other store when one history record is malformed.
    }
  }
  return [];
}

function rememberMusicSelection(trackId) {
  if (!trackId) return;
  const history = [String(trackId), ...readMusicSelectionHistory().filter((id) => id !== String(trackId))].slice(0, 13);
  const serialized = JSON.stringify(history);
  [window.localStorage, window.sessionStorage].forEach((store) => writeStoredValue(store, musicSelectionHistoryKey, serialized));
}

function readMusicSelectionCount() {
  for (const store of [window.localStorage, window.sessionStorage]) {
    const raw = readStoredValue(store, musicSelectionCountKey);
    if (!raw.trim()) continue;
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0) return Math.floor(value);
  }
  return readMusicSelectionHistory().length;
}

function writeMusicSelectionCount(value) {
  const normalized = String(Math.max(0, Math.floor(Number(value) || 0)));
  [window.localStorage, window.sessionStorage].forEach((store) => writeStoredValue(store, musicSelectionCountKey, normalized));
}

function clearStoredMusicTelevisionSelection() {
  [window.sessionStorage, window.localStorage].forEach((store) => {
    musicTelevisionStorageKeys.forEach((key) => {
      try {
        store?.removeItem(key);
      } catch {
        // Storage can be unavailable in private or restricted browser modes.
      }
    });
  });
  delete window.__iamLatestMusicTelevisionSelection;
}

function stopActiveAdaptiveMedia() {
  const windows = [window];
  try {
    if (window.parent && window.parent !== window) windows.push(window.parent);
  } catch {
    // Cross-origin parents cannot be controlled; this journey is same-origin.
  }

  windows.forEach((targetWindow) => {
    try {
      targetWindow.__iamStopAdaptiveMedia?.();
      targetWindow.__iamAdaptiveEnvironment?.stopRadio?.();
      const sharedRadio = targetWindow.__iamAdaptiveEnvironment?.audio;
      if (sharedRadio) {
        sharedRadio.pause();
        sharedRadio.muted = true;
        sharedRadio.volume = 0;
      }
      targetWindow.document?.querySelectorAll?.("audio, video").forEach((media) => {
        media.pause();
        media.muted = true;
      });
    } catch {
      // Continue stopping media in every accessible document.
    }
  });
}

function stopAdaptiveMediaOnCheckInArrival() {
  const isCheckInPage =
    document.querySelector("[data-iam-skip-transfer]")?.dataset.iamSkipTransfer === "true" ||
    document.body?.dataset.iamSkipTransfer === "true";
  if (!isCheckInPage) return;
  stopActiveAdaptiveMedia();
}

stopAdaptiveMediaOnCheckInArrival();

async function requestAdaptiveMusicVideoSelection(phrase, inferenceRecord = {}) {
  if (!window.fetch || !adaptiveMusicVideoSelectionEndpoint) throw new Error("music_selector_unavailable");
  const highlights = Array.isArray(inferenceRecord.top_needs_used) && inferenceRecord.top_needs_used.length
    ? inferenceRecord.top_needs_used
    : inferenceRecord.highlights;
  const payload = {
    citizen_checkin: phrase,
    interpretation_summary: inferenceRecord.soundtrack_reason || inferenceRecord.interpretation_summary || "",
    soundtrack_stage_gate: inferenceRecord.soundtrack_stage_gate || "",
    human_review_relevance: inferenceRecord.human_review_relevance,
    citizen_needs: {
      top_highlights: Array.isArray(highlights) ? highlights : [],
      top_needs_used: Array.isArray(highlights) ? highlights : [],
      needs_scorecard: inferenceRecord.needs_scorecard || null,
      safety_flags: Array.isArray(inferenceRecord.safety_flags) ? inferenceRecord.safety_flags : [],
      interpretation_summary: inferenceRecord.soundtrack_reason || "",
      soundtrack_stage_gate: inferenceRecord.soundtrack_stage_gate || "",
    },
    needs_scorecard: inferenceRecord.needs_scorecard || null,
    environment_context: inferenceRecord.environment_context || await currentEnvironmentContext(),
    inference_provenance: {
      model: inferenceRecord.model || "",
      prompt_version: inferenceRecord.prompt_version || "",
      prompt_sha256: inferenceRecord.prompt_sha256 || "",
    },
    selection_context: {
      visitor_id: getAnonymousMusicVisitorId(),
      recent_track_ids: readMusicSelectionHistory(),
      recommendation_index: readMusicSelectionCount(),
    },
  };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(adaptiveMusicVideoSelectionEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ v444_payload: payload }),
      signal: controller.signal,
    });
    const selection = await response.json().catch(() => null);
    if (!response.ok || !selection) {
      throw new Error(selection?.error || "music_selector_unavailable");
    }

    const persistedSelection = persistMusicTelevisionSelection(selection);
    if (!persistedSelection?.selected_track_id) {
      throw new Error("music_selector_invalid_response");
    }
    return persistedSelection;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function processPendingCheckInPipeline(phrase) {
  const normalizedPhrase = normalizeCheckInPhrase(phrase);
  if (!normalizedPhrase) throw new Error("checkin_unavailable");
  const inference = await requestCitizenNeedsInference(normalizedPhrase);
  const selection = await requestAdaptiveMusicVideoSelection(normalizedPhrase, inference);
  clearPendingCheckInPipeline();
  return { inference, selection };
}

window.IAMCheckInPipeline = {
  queue: queuePendingCheckInPipeline,
  readPending: readPendingCheckInPipeline,
  clearPending: clearPendingCheckInPipeline,
  process: processPendingCheckInPipeline,
};

function setIamState(state, text = "") {
  if (!iamForm || !iamDisplay) return;

  iamForm.dataset.state = state;
  iamForm.classList.toggle("is-busy", state === "joining" || state === "reflecting" || state === "integrating");
  iamJoiningLoader?.setAttribute("aria-hidden", String(state !== "joining"));

  if (state === "idle") {
    iamDisplay.textContent = "I am...";
    if (iamInput) iamInput.value = "";
  } else if (state === "reflecting" || state === "integrating") {
    iamDisplay.textContent = "";
  } else if (text) {
    iamDisplay.textContent = text;
  }
}

async function transitionIamState(state, text = "", pause = 0) {
  if (!iamForm) return;

  iamForm.classList.add("is-text-fading");
  await wait(iamTiming.textFade);
  setIamState(state, text);
  iamForm.getBoundingClientRect();
  iamForm.classList.remove("is-text-fading");

  if (pause > 0) {
    await wait(pause);
  }
}

function setGlobeReceiving(isReceiving) {
  if (!globePage) return;
  globePage.classList.toggle("is-receiving", isReceiving);
}

function focusIamInput() {
  if (!iamInput) return;
  iamInput.focus({ preventScroll: true });
}

function activateIamPrompt() {
  if (!iamForm || iamForm.classList.contains("is-busy")) return;
  if (iamForm.dataset.state === "typing") {
    focusIamInput();
    return;
  }

  transitionIamState("prompt", "How are you feeling?", iamTiming.focusPause);
  focusIamInput();
}

function showIamReflection(phrase) {
  if (!iamReflection || !iamReflectionText) return;

  iamReflectionText.textContent = punctuatePhrase(phrase);
  startReflectionFlora();
  window.requestAnimationFrame(() => {
    iamReflection.classList.add("is-visible");
  });
}

function hideIamReflection() {
  if (!iamReflection) return;
  iamReflection.classList.remove("is-visible");
  window.setTimeout(stopReflectionFlora, iamTiming.reflectionDissolve + 120);
}

function loadMainHomepage() {
  const nextPage =
    document.querySelector("[data-iam-next-page]")?.dataset.iamNextPage ||
    document.body?.dataset.iamNextPage ||
    "index.html";
  const nextUrl = new URL(nextPage, window.location.href);
  const currentParams = new URLSearchParams(window.location.search);
  const isMusicTelevisionFrame = currentParams.get("musicTelevisionFrame") === "1";
  const isAdaptiveFrame = currentParams.get("adaptiveFrame") === "1";
  const inMemoryTrackId = window.__iamLatestMusicTelevisionSelection?.selected_track_id || "";
  const explicitTrackId = currentParams.get("selected_track_id") || "";
  let selectedTrackId = inMemoryTrackId || explicitTrackId;
  let selectionSource = inMemoryTrackId ? "fresh_memory" : explicitTrackId ? "explicit_url" : "none";

  if (!selectedTrackId) {
    for (const key of musicTelevisionStorageKeys) {
      try {
        const stored = readStoredValue(window.localStorage, key) || readStoredValue(window.sessionStorage, key);
        const parsed = stored ? JSON.parse(stored) : null;
        selectedTrackId = parsed?.selected_track_id || parsed?.track_id || "";
        if (selectedTrackId) {
          selectionSource = `storage_${key}`;
          break;
        }
      } catch {
        // The explicit URL handoff can still use the current page parameter.
      }
    }
  }

  if (selectedTrackId) {
    nextUrl.searchParams.set("selected_track_id", selectedTrackId);
    nextUrl.searchParams.set("selection_source", selectionSource);
    const selectedNeeds = window.__iamLatestMusicTelevisionSelection?.citizen_needs_used;
    if (Array.isArray(selectedNeeds) && selectedNeeds.length) {
      nextUrl.searchParams.set("selection_needs", selectedNeeds.slice(0, 4).join("|"));
    }
  }

  if (isMusicTelevisionFrame) {
    nextUrl.searchParams.set("adaptiveFrame", "1");
    nextUrl.searchParams.set("musicTelevisionFrame", "1");
  }

  if ((isAdaptiveFrame || isMusicTelevisionFrame) && /\/index\.html$/.test(nextUrl.pathname) && window.top && window.top !== window) {
    nextUrl.searchParams.delete("adaptiveFrame");
    nextUrl.searchParams.delete("musicTelevisionFrame");
    nextUrl.searchParams.set("selection", String(Date.now()));
    window.top.location.href = nextUrl.href;
    return;
  }

  window.location.href = nextUrl.href;
}

async function recoverFromInferenceFailure() {
  setGlobeReceiving(false);
  if (iamInput) iamInput.readOnly = false;
  isSubmitRunning = false;
  await transitionIamState("prompt", "GPT inference unavailable. Please try again.");
  focusIamInput();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeInOut(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function easeOut(value) {
  return 1 - Math.pow(1 - value, 3);
}

function mix(start, end, progress) {
  return start + (end - start) * progress;
}

function startReflectionFlora() {
  if (!iamReflectionFlora) return;

  if (activeReflectionFloraAnimation) {
    activeReflectionFloraAnimation.cancelled = true;
  }

  const ctx = iamReflectionFlora.getContext("2d", { alpha: true });
  if (!umLogoImage.complete || !umLogoImage.naturalWidth || !umLogoImage.naturalHeight) {
    umLogoImage.addEventListener("load", startReflectionFlora, { once: true });
    return;
  }

  const animation = { cancelled: false };
  const animationStartedAt = performance.now();
  activeReflectionFloraAnimation = animation;

  function resizeCanvas() {
    const width = iamReflectionFlora.clientWidth || 78;
    const height = iamReflectionFlora.clientHeight || 78;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (iamReflectionFlora.width !== Math.round(width * dpr) || iamReflectionFlora.height !== Math.round(height * dpr)) {
      iamReflectionFlora.width = Math.round(width * dpr);
      iamReflectionFlora.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return { width, height };
  }

  function draw(now) {
    if (animation.cancelled) return;

    const { width, height } = resizeCanvas();
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const elapsed = now - animationStartedAt;
    const settle = easeInOut(clamp(elapsed / iamTiming.reflectionFadeIn, 0, 1));
    const markSize = Math.min(width, height) * (0.92 + settle * 0.08);
    const x = centerX - markSize * 0.5;
    const y = centerY - markSize * 0.5;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = settle;
    ctx.shadowBlur = 0;
    ctx.drawImage(umLogoImage, x, y, markSize, markSize);
    ctx.globalAlpha = 1;

    window.requestAnimationFrame(draw);
  }

  window.requestAnimationFrame(draw);
}

function stopReflectionFlora() {
  if (activeReflectionFloraAnimation) {
    activeReflectionFloraAnimation.cancelled = true;
    activeReflectionFloraAnimation = null;
  }

  if (iamReflectionFlora) {
    const ctx = iamReflectionFlora.getContext("2d", { alpha: true });
    ctx.clearRect(0, 0, iamReflectionFlora.width, iamReflectionFlora.height);
  }
}

function makeTransferTargets(width, height, phrase) {
  const targetCanvas = document.createElement("canvas");
  const targetCtx = targetCanvas.getContext("2d", { willReadFrequently: true });
  const scale = 2;
  let fontSize = width < 760 ? 28 : 34;
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const logoGap = width < 760 ? 48 : 74;
  const maxTextWidth = width < 760 ? width * 0.68 : width * 0.72;

  targetCanvas.width = Math.round(width * scale);
  targetCanvas.height = Math.round(height * scale);
  targetCtx.scale(scale, scale);
  targetCtx.clearRect(0, 0, width, height);
  targetCtx.fillStyle = "#fff";
  targetCtx.strokeStyle = "#fff";
  targetCtx.lineCap = "round";
  targetCtx.lineJoin = "round";
  targetCtx.font = `300 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  targetCtx.textBaseline = "middle";
  targetCtx.textAlign = "left";

  const finalPhrase = punctuatePhrase(phrase);
  const measuredTextWidth = targetCtx.measureText(finalPhrase).width;
  if (measuredTextWidth > maxTextWidth) {
    fontSize = Math.max(width < 760 ? 19 : 24, Math.floor(fontSize * (maxTextWidth / measuredTextWidth)));
    targetCtx.font = `300 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  }

  const textWidth = Math.min(targetCtx.measureText(finalPhrase).width, maxTextWidth);
  const textStartX = centerX - (textWidth + logoGap) * 0.5 + logoGap;
  targetCtx.fillText(finalPhrase, textStartX, centerY, maxTextWidth);

  const image = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
  const points = [];
  const step = width < 760 ? 7 : 6;
  for (let y = 0; y < targetCanvas.height; y += step) {
    for (let x = 0; x < targetCanvas.width; x += step) {
      const alpha = image.data[(y * targetCanvas.width + x) * 4 + 3];
      if (alpha > 40) {
        points.push({
          x: x / scale + (Math.random() - 0.5) * 2.8,
          y: y / scale + (Math.random() - 0.5) * 2.8,
        });
      }
    }
  }

  return points.length ? points : [{ x: centerX, y: centerY }];
}

function makeTransferParticle(index, total, startRect, endX, endY, targets) {
  const phraseProgress = total <= 1 ? 0 : index / (total - 1);
  const strand = index % 2 === 0 ? 1 : -1;
  const startSpreadX = (Math.random() - 0.5) * startRect.width * 0.82;
  const startSpreadY = (Math.random() - 0.5) * startRect.height * 0.42;
  const target = targets[index % targets.length];
  const accentRoll = Math.random();
  const color = accentRoll > 0.965
    ? "rgba(255, 217, 46,"
    : accentRoll > 0.93
      ? "rgba(255, 143, 202,"
      : accentRoll > 0.89
        ? "rgba(182, 207, 115,"
        : accentRoll > 0.82
          ? "rgba(128, 220, 255,"
          : "rgba(226, 255, 250,";

  return {
    startX: startRect.left + startRect.width * 0.5 + startSpreadX,
    startY: startRect.top + startRect.height * 0.5 + startSpreadY,
    targetX: target.x,
    targetY: target.y,
    u: phraseProgress,
    phase: Math.random() * Math.PI * 2,
    speed: 0.7 + Math.random() * 0.62,
    strand,
    drift: 8 + Math.random() * 28,
    size: Math.random() > 0.88 ? 2.1 + Math.random() * 2.4 : 0.85 + Math.random() * 1.55,
    alpha: 0.22 + Math.random() * 0.72,
    color,
    endX: endX + (Math.random() - 0.5) * 120,
    endY: endY + (Math.random() - 0.5) * 80,
  };
}

function drawTransferParticle(ctx, particle, x, y, alpha, time, progress) {
  const pulse = 0.72 + Math.sin(time * 0.006 * particle.speed + particle.phase) * 0.28;
  const size = particle.size * (0.72 + pulse * 0.72) * (progress > 0.72 ? 0.82 : 1);
  const stretched = progress > 0.2 && progress < 0.66;
  const particleAlpha = clamp(alpha * particle.alpha, 0, 1);

  ctx.globalAlpha = 1;
  ctx.fillStyle = `${particle.color}${particleAlpha})`;
  ctx.shadowColor = particle.color.includes("226") ? "rgba(185, 255, 248, 0.62)" : `${particle.color}0.48)`;
  ctx.shadowBlur = particle.size > 2.4 ? 12 : 7;
  ctx.beginPath();
  if (stretched) {
    ctx.ellipse(x, y, size * 1.65, size * 0.74, particle.phase + progress * Math.PI, 0, Math.PI * 2);
  } else {
    ctx.arc(x, y, size, 0, Math.PI * 2);
  }
  ctx.fill();
}

function getTransferStartRect() {
  const source =
    iamControl ||
    document.querySelector("[data-iam-transfer-source]") ||
    document.querySelector(".globe-welcome-copy") ||
    document.querySelector(".globe-brand");
  const rect = source?.getBoundingClientRect();

  if (rect && rect.width > 0 && rect.height > 0) return rect;

  const width = window.innerWidth;
  const height = window.innerHeight;
  return {
    left: width * 0.08,
    top: height * 0.48,
    width: Math.max(180, width * 0.18),
    height: 48,
  };
}

function runPhraseTransfer(phrase, onTextReady) {
  if (!iamTransfer) return Promise.resolve();

  if (activeTransferAnimation) {
    activeTransferAnimation.cancelled = true;
  }

  iamTransfer.replaceChildren();

  const canvas = document.createElement("canvas");
  canvas.className = "iam-transfer-canvas";
  iamTransfer.append(canvas);

  const ctx = canvas.getContext("2d", { alpha: true });
  const startRect = getTransferStartRect();
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const endX = width * 0.5;
  const endY = height * 0.5;
  const targets = makeTransferTargets(width, height, phrase);
  const particleCount = width < 760 ? 420 : 760;
  const particles = Array.from({ length: particleCount }, (_, index) => (
    makeTransferParticle(index, particleCount, startRect, endX, endY, targets)
  ));
  const animation = { cancelled: false };
  activeTransferAnimation = animation;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return new Promise((resolve) => {
    const start = performance.now();
    let hasRevealedText = false;

    function frame(now) {
      if (animation.cancelled) {
        iamTransfer.replaceChildren();
        resolve();
        return;
      }

      const elapsed = now - start;
      const progress = clamp(elapsed / iamTiming.transferDuration, 0, 1);
      const dissolve = clamp(progress / 0.2, 0, 1);
      const helix = clamp((progress - 0.12) / 0.54, 0, 1);
      const coalesce = clamp((progress - 0.56) / 0.26, 0, 1);
      const resolveFade = 1 - easeInOut(clamp((progress - 0.82) / 0.18, 0, 1));
      const helixEase = easeInOut(helix);
      const coalesceEase = easeInOut(coalesce);
      const ribbonLift = Math.min(180, height * 0.2);
      const startX = startRect.left + startRect.width * 0.5;
      const startY = startRect.top + startRect.height * 0.5;
      const controlX = mix(startX, endX, 0.48);
      const controlY = Math.min(startY, endY) - ribbonLift;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      particles.forEach((particle) => {
        const ribbonU = (particle.u + elapsed * 0.000045 * particle.speed) % 1;
        const curveA = (1 - ribbonU) * (1 - ribbonU);
        const curveB = 2 * (1 - ribbonU) * ribbonU;
        const curveC = ribbonU * ribbonU;
        const spineX = curveA * startX + curveB * controlX + curveC * endX;
        const spineY = curveA * startY + curveB * controlY + curveC * endY;
        const wave = Math.sin(ribbonU * Math.PI * 10 + elapsed * 0.0048 + particle.phase);
        const counterWave = Math.cos(ribbonU * Math.PI * 6 + elapsed * 0.0026 + particle.phase);
        const amplitude = (24 + Math.sin(ribbonU * Math.PI) * 86) * particle.strand;
        const ribbonX = spineX + wave * amplitude + counterWave * 12;
        const ribbonY = spineY + Math.cos(ribbonU * Math.PI * 10 + elapsed * 0.0048 + particle.phase) * amplitude * 0.32;
        const bloomX = particle.endX + Math.sin(elapsed * 0.002 + particle.phase) * particle.drift;
        const bloomY = particle.endY + Math.cos(elapsed * 0.0023 + particle.phase) * particle.drift * 0.58;
        const preX = mix(particle.startX, ribbonX, easeOut(dissolve));
        const preY = mix(particle.startY, ribbonY, easeOut(dissolve));
        const textX = mix(bloomX, particle.targetX, coalesceEase);
        const textY = mix(bloomY, particle.targetY, coalesceEase);
        const x = mix(preX, textX, coalesceEase);
        const y = mix(preY, textY, coalesceEase);
        const alphaIn = easeOut(clamp(progress / 0.13, 0, 1));
        const ribbonAlpha = mix(0.46, 1, Math.sin(Math.PI * helixEase));
        const alpha = alphaIn * ribbonAlpha * resolveFade;

        drawTransferParticle(ctx, particle, x, y, alpha, elapsed, progress);
      });

      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.globalAlpha = clamp(Math.sin(Math.PI * helixEase) * 0.12 * resolveFade, 0, 0.12);
      const veil = ctx.createRadialGradient(endX, endY, 0, endX, endY, Math.min(width, height) * 0.42);
      veil.addColorStop(0, "rgba(185, 255, 248, 0.22)");
      veil.addColorStop(1, "rgba(185, 255, 248, 0)");
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, width, height);

      if (!hasRevealedText && elapsed >= iamTiming.transferTextRevealAt) {
        hasRevealedText = true;
        if (typeof onTextReady === "function") onTextReady();
      }

      if (progress < 1) {
        window.requestAnimationFrame(frame);
        return;
      }

      iamTransfer.replaceChildren();
      if (activeTransferAnimation === animation) {
        activeTransferAnimation = null;
      }
      resolve();
    }

    window.requestAnimationFrame(frame);
  });
}

async function submitIamCheckIn() {
  if (!iamInput || !iamInput.value.trim() || iamForm?.classList.contains("is-busy") || isSubmitRunning) return;

  const response = normalizeCheckInResponse(iamInput.value);
  if (!response) return;

  isSubmitRunning = true;
  const phrase = `I am ${response}`;
  stopActiveAdaptiveMedia();
  clearStoredMusicTelevisionSelection();
  persistLatestCheckIn(phrase, {}, "pending");
  iamInput.blur();
  iamInput.readOnly = true;
  await transitionIamState("thanks", "✓ Thank you.", iamTiming.thankYouHold);

  const shouldSkipTransfer =
    document.querySelector("[data-iam-skip-transfer]")?.dataset.iamSkipTransfer === "true" ||
    document.body?.dataset.iamSkipTransfer === "true";

  if (shouldSkipTransfer) {
    queuePendingCheckInPipeline(phrase);
    await transitionIamState("joining", "Preparing your experience...", iamTiming.preparingHold);
    iamInput.readOnly = false;
    isSubmitRunning = false;
    loadMainHomepage();
    return;
  }

  setGlobeReceiving(true);
  const inferencePromise = requestCitizenNeedsInference(phrase);
  await transitionIamState("joining", "Joining the global check in...", iamTiming.joiningHold);

  await transitionIamState("reflecting");
  const transferPromise = runPhraseTransfer(phrase, () => {
    showIamReflection(phrase);
  });
  await transferPromise;
  await wait(iamTiming.reflectionFadeIn + iamTiming.reflectionHold);
  hideIamReflection();
  await wait(iamTiming.reflectionDissolve);

  await transitionIamState("integrating");
  if (window.__iamGlobeCheckIn?.integrateCheckIn) {
    window.__iamGlobeCheckIn.integrateCheckIn(phrase);
  }
  await wait(iamTiming.integrationHold);

  setGlobeReceiving(false);
  try {
    await inferencePromise.then((record) => requestAdaptiveMusicVideoSelection(phrase, record));
  } catch {
    await recoverFromInferenceFailure();
    return;
  }
  await wait(iamTiming.integratedGlobeHold);
  iamInput.readOnly = false;
  isSubmitRunning = false;
  await wait(iamTiming.homeRedirectDelay);
  loadMainHomepage();
}

if (iamForm && iamStart && iamControl && iamInput) {
  setIamState("idle");

  iamStart.addEventListener("click", activateIamPrompt);
  iamControl.addEventListener("click", activateIamPrompt);

  iamInput.addEventListener("input", () => {
    if (iamInput.value.length > 0 && iamForm.dataset.state !== "typing") {
      setIamState("typing");
    }
  });

  iamInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitIamCheckIn();
    } else if (iamForm.dataset.state === "prompt" && event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      setIamState("typing");
    }
  });

  iamInput.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (!iamInput.value.trim() && iamForm.dataset.state === "prompt" && document.activeElement !== iamInput) {
        setIamState("idle");
      }
    }, 120);
  });

  iamForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitIamCheckIn();
  });
}

function loadImageAsset(source) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => resolve(null), { once: true });
    image.src = source;
  });
}

function traceNormalizedLand(ctx, points, width, height) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    const pointX = x * width;
    const pointY = y * height;
    if (index === 0) ctx.moveTo(pointX, pointY);
    else ctx.lineTo(pointX, pointY);
  });
  ctx.closePath();
}

function makeCommunityGlobeTexture(monogramImage) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const ocean = ctx.createLinearGradient(0, 0, width, height);
  ocean.addColorStop(0, "#082f52");
  ocean.addColorStop(0.42, "#11637d");
  ocean.addColorStop(0.7, "#0c526c");
  ocean.addColorStop(1, "#061f3c");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, width, height);

  const oceanLight = ctx.createRadialGradient(width * 0.42, height * 0.28, 20, width * 0.42, height * 0.28, width * 0.64);
  oceanLight.addColorStop(0, "rgba(112, 196, 196, 0.28)");
  oceanLight.addColorStop(0.44, "rgba(31, 119, 145, 0.08)");
  oceanLight.addColorStop(1, "rgba(2, 19, 41, 0.36)");
  ctx.fillStyle = oceanLight;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(193, 227, 213, 0.075)";
  ctx.lineWidth = 2;
  for (let y = 60; y < height; y += 68) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= width; x += 80) {
      ctx.quadraticCurveTo(x + 20, y - 8, x + 40, y);
      ctx.quadraticCurveTo(x + 60, y + 8, x + 80, y);
    }
    ctx.stroke();
  }

  let leatherPattern = null;
  if (monogramImage) {
    const tile = document.createElement("canvas");
    tile.width = 320;
    tile.height = 320;
    tile.getContext("2d").drawImage(monogramImage, 0, 0, tile.width, tile.height);
    leatherPattern = ctx.createPattern(tile, "repeat");
  }

  const landMasses = [
    [[0.018, 0.27], [0.052, 0.20], [0.11, 0.17], [0.16, 0.20], [0.19, 0.24], [0.245, 0.26], [0.285, 0.33], [0.274, 0.39], [0.238, 0.41], [0.214, 0.38], [0.174, 0.43], [0.145, 0.40], [0.112, 0.43], [0.075, 0.38], [0.032, 0.35]],
    [[0.207, 0.41], [0.247, 0.43], [0.275, 0.50], [0.285, 0.58], [0.267, 0.67], [0.242, 0.76], [0.218, 0.69], [0.205, 0.58], [0.19, 0.49]],
    [[0.295, 0.10], [0.335, 0.08], [0.363, 0.14], [0.352, 0.22], [0.318, 0.25], [0.29, 0.19]],
    [[0.438, 0.27], [0.466, 0.23], [0.51, 0.25], [0.535, 0.3], [0.52, 0.35], [0.48, 0.34], [0.448, 0.32]],
    [[0.46, 0.34], [0.505, 0.32], [0.546, 0.38], [0.55, 0.48], [0.525, 0.62], [0.486, 0.66], [0.458, 0.55], [0.44, 0.44]],
    [[0.505, 0.24], [0.55, 0.18], [0.61, 0.16], [0.66, 0.2], [0.71, 0.17], [0.77, 0.2], [0.832, 0.19], [0.89, 0.25], [0.93, 0.31], [0.91, 0.38], [0.86, 0.4], [0.825, 0.46], [0.77, 0.43], [0.735, 0.49], [0.68, 0.45], [0.65, 0.39], [0.604, 0.37], [0.565, 0.32], [0.53, 0.31]],
    [[0.776, 0.59], [0.823, 0.55], [0.875, 0.58], [0.902, 0.65], [0.878, 0.72], [0.821, 0.74], [0.785, 0.69]],
    [[0.925, 0.42], [0.943, 0.39], [0.952, 0.45], [0.944, 0.51], [0.932, 0.49]],
    [[0.55, 0.62], [0.56, 0.65], [0.555, 0.72], [0.543, 0.69]],
    [[0, 0.86], [0.08, 0.84], [0.17, 0.87], [0.27, 0.85], [0.37, 0.88], [0.48, 0.85], [0.58, 0.88], [0.68, 0.85], [0.78, 0.88], [0.9, 0.84], [1, 0.87], [1, 1], [0, 1]],
  ];

  landMasses.forEach((points, index) => {
    traceNormalizedLand(ctx, points, width, height);
    ctx.fillStyle = leatherPattern || "#9a4b21";
    ctx.fill();
    ctx.save();
    ctx.clip();
    const emeraldWash = ctx.createLinearGradient(0, 0, width, height);
    emeraldWash.addColorStop(0, "rgba(31, 111, 72, 0.7)");
    emeraldWash.addColorStop(0.54, "rgba(18, 92, 65, 0.38)");
    emeraldWash.addColorStop(1, "rgba(111, 132, 62, 0.52)");
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = emeraldWash;
    ctx.fillRect(0, 0, width, height);
    const leatherHighlight = ctx.createLinearGradient(0, height * 0.12, 0, height * 0.82);
    leatherHighlight.addColorStop(0, "rgba(255, 207, 136, 0.2)");
    leatherHighlight.addColorStop(0.5, "rgba(120, 58, 24, 0.02)");
    leatherHighlight.addColorStop(1, "rgba(49, 20, 7, 0.26)");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = leatherHighlight;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    traceNormalizedLand(ctx, points, width, height);
    ctx.strokeStyle = index === landMasses.length - 1 ? "rgba(220, 181, 115, 0.42)" : "rgba(234, 193, 124, 0.74)";
    ctx.lineWidth = index === landMasses.length - 1 ? 2 : 3;
    ctx.stroke();
  });

  const glaze = ctx.createLinearGradient(0, 0, width, 0);
  glaze.addColorStop(0, "rgba(86, 28, 8, 0.14)");
  glaze.addColorStop(0.28, "rgba(255, 217, 162, 0.07)");
  glaze.addColorStop(0.66, "rgba(57, 137, 124, 0.05)");
  glaze.addColorStop(1, "rgba(25, 8, 4, 0.18)");
  ctx.fillStyle = glaze;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

function makeMiniPlanetTexture(seed = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const ocean = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  ocean.addColorStop(0, seed % 2 ? "#0b4d72" : "#0d6380");
  ocean.addColorStop(1, "#071f42");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const islands = [
    [0.08, 0.32, 0.2, 0.19],
    [0.32, 0.56, 0.26, 0.24],
    [0.59, 0.24, 0.22, 0.22],
    [0.76, 0.62, 0.28, 0.2],
  ];
  ctx.fillStyle = seed % 2 ? "#4a8a55" : "#3d9a70";
  islands.forEach(([x, y, width, height], index) => {
    ctx.beginPath();
    ctx.ellipse((x + seed * 0.07) % 1 * canvas.width, y * canvas.height, width * canvas.width, height * canvas.height, index * 0.42, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = "rgba(228, 190, 123, 0.62)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height * 0.48);
  ctx.bezierCurveTo(canvas.width * 0.27, canvas.height * 0.32, canvas.width * 0.63, canvas.height * 0.66, canvas.width, canvas.height * 0.44);
  ctx.stroke();
  return canvas;
}

function makeGlobeTexture(monogramImage = null) {
  if (isCommunityOverlay) return makeCommunityGlobeTexture(monogramImage);

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#06070b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  const landBands = [
    [[130, 170], [205, 128], [290, 150], [330, 218], [260, 254], [160, 230]],
    [[408, 148], [466, 116], [540, 142], [552, 220], [486, 244], [418, 204]],
    [[512, 244], [590, 226], [662, 270], [640, 350], [556, 354]],
    [[690, 150], [790, 126], [880, 186], [850, 278], [728, 252]],
    [[802, 306], [906, 296], [946, 356], [880, 394], [810, 374]],
  ];

  landBands.forEach((points) => {
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  });

  const scan = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  scan.addColorStop(0, "rgba(255,0,94,0.18)");
  scan.addColorStop(0.48, "rgba(0,240,216,0.12)");
  scan.addColorStop(1, "rgba(255,217,46,0.1)");
  ctx.fillStyle = scan;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}

function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return new window.THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function visualSurfaceVector(x, y, radius) {
  const surfaceX = x * radius;
  const surfaceY = y * radius;
  const surfaceZ = Math.sqrt(Math.max(0, (radius * radius) - (surfaceX * surfaceX) - (surfaceY * surfaceY)));

  return new window.THREE.Vector3(surfaceX, surfaceY, surfaceZ);
}

function makeArcCurve(start, end) {
  const mid = start.clone().add(end).normalize().multiplyScalar(1.46);
  return new window.THREE.QuadraticBezierCurve3(start, mid, end);
}

function makeTextSprite(text, color) {
  const THREE = window.THREE;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = '300 54px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      depthWrite: false,
    })
  );
  sprite.scale.set(0.72, 0.22, 1);
  return sprite;
}

async function initGlobe() {
  const container = document.getElementById("globeViz");
  if (!container) return;

  try {
    const module = await import("https://unpkg.com/three@0.165.0/build/three.module.js");
    window.THREE = module;
  } catch (error) {
    container.dataset.globeError = "true";
    return;
  }

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  const nodeLabel = document.createElement("div");
  const nodeLabelBeacon = document.createElement("i");
  const nodeLabelName = document.createElement("strong");
  const nodeLabelState = document.createElement("span");
  const globeGroup = new THREE.Group();
  const signalMarkers = [];
  const communityMarkers = [];
  const namasteSprites = [];
  const currentParticles = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const projectedPosition = new THREE.Vector3();
  let hoveredCommunityMarker = null;
  const communityActivationSequence = communityNodes
    .map((node, index) => (node.hero ? index : null))
    .filter((index) => index !== null);
  const beaconColors = isCommunityOverlay
    ? ["#e2b675", "#5da882", "#8abec5"]
    : ["#80a8ff", "#ffd92e", "#ff005e"];
  const beaconSoftColors = isCommunityOverlay
    ? ["rgba(226, 182, 117, 0.18)", "rgba(93, 168, 130, 0.18)", "rgba(138, 190, 197, 0.18)"]
    : ["rgba(128, 168, 255, 0.24)", "rgba(255, 217, 46, 0.24)", "rgba(255, 0, 94, 0.24)"];
  let activeCommunityIndex = communityActivationSequence[0];
  let activeCommunityStep = -1;
  let lastCommunityActivation = 0;
  const radius = 1.55;
  const heroLayout = {
    "Gulf of Archangel": { x: -0.52, y: 0.74, labelSide: "left" },
    "Zermatt": { x: -0.18, y: 0.76, labelSide: "left" },
    "Northern Italy": { x: 0.24, y: 0.74, labelSide: "right" },
    "Seoul": { x: 0.56, y: 0.52, labelSide: "right" },
    "Shanghai": { x: 0.74, y: 0.28, labelSide: "right" },
    "Delhi": { x: 0.64, y: 0.02, labelSide: "right" },
    "Dubai": { x: 0.44, y: -0.16, labelSide: "right" },
    "Cancun": { x: -0.58, y: 0.28, labelSide: "left" },
    "Mt Kilimanjaro": { x: 0.18, y: -0.42, labelSide: "right" },
    "Uluru": { x: 0.50, y: -0.58, labelSide: "right" },
    "Byron Bay": { x: 0.68, y: -0.70, labelSide: "right" },
    "Bondi Beach": { x: 0.76, y: -0.44, labelSide: "right" },
    "Avoca Beach": { x: 0.58, y: -0.76, labelSide: "right" },
  };
  const monogramImage = isCommunityOverlay ? await loadImageAsset(communityMonogramTextureUrl) : null;
  const texture = new THREE.CanvasTexture(makeGlobeTexture(monogramImage));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  let leatherBumpTexture = null;
  if (isCommunityOverlay && monogramImage) {
    leatherBumpTexture = new THREE.Texture(monogramImage);
    leatherBumpTexture.wrapS = THREE.RepeatWrapping;
    leatherBumpTexture.wrapT = THREE.RepeatWrapping;
    leatherBumpTexture.repeat.set(7, 3.5);
    leatherBumpTexture.needsUpdate = true;
  }

  nodeLabel.className = "globe-node-label";
  nodeLabelBeacon.className = "globe-label-beacon";
  nodeLabel.style.opacity = "0";
  nodeLabel.append(nodeLabelBeacon, nodeLabelName, nodeLabelState);

  const globeMaterial = isCommunityOverlay
    ? new THREE.MeshPhysicalMaterial({
      map: texture,
      bumpMap: leatherBumpTexture,
      bumpScale: leatherBumpTexture ? 0.018 : 0,
      color: "#ffffff",
      metalness: 0.12,
      roughness: 0.46,
      clearcoat: 0.42,
      clearcoatRoughness: 0.31,
      sheen: 0.5,
      sheenColor: new THREE.Color("#8a4b2a"),
      sheenRoughness: 0.58,
      emissive: "#180b06",
      emissiveIntensity: 0.08,
    })
    : new THREE.MeshStandardMaterial({
      map: texture,
      color: "#ffffff",
      metalness: 0.1,
      roughness: 0.78,
      emissive: "#07070d",
      emissiveIntensity: 0.42,
      opacity: 0.889,
      transparent: true,
    });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 96), globeMaterial);

  const atmosphereMaterial = isCommunityOverlay
    ? new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec3 vViewNormal;
        void main() {
          vViewNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vViewNormal;
        void main() {
          float rim = pow(1.0 - abs(dot(vViewNormal, vec3(0.0, 0.0, 1.0))), 3.2);
          vec3 emerald = vec3(0.20, 0.48, 0.39);
          vec3 champagne = vec3(0.90, 0.68, 0.40);
          vec3 color = mix(emerald, champagne, 0.64 + vViewNormal.y * 0.12);
          gl_FragColor = vec4(color, rim * 0.42);
        }
      `,
    })
    : new THREE.MeshBasicMaterial({
      color: "#80a8ff",
      transparent: true,
      opacity: 0.12,
      wireframe: true,
    });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radius * (isCommunityOverlay ? 1.035 : 1.018), 96, 96), atmosphereMaterial);

  scene.add(globeGroup);
  globeGroup.add(globe, atmosphere);
  if (isCommunityOverlay) {
    scene.add(new THREE.HemisphereLight("#f4dec0", "#133c3a", 1.65));
  } else {
    scene.add(new THREE.AmbientLight("#ffffff", 1.8));
  }

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.12,
    blending: isCommunityOverlay ? THREE.NormalBlending : THREE.AdditiveBlending,
    depthWrite: false,
  });
  const cyanRingMaterial = ringMaterial.clone();
  cyanRingMaterial.color = new THREE.Color(isCommunityOverlay ? "#d9aa67" : "#00f0d8");
  cyanRingMaterial.opacity = isCommunityOverlay ? 0.16 : 0.07;
  const magentaRingMaterial = ringMaterial.clone();
  magentaRingMaterial.color = new THREE.Color(isCommunityOverlay ? "#5f9a79" : "#d8fff8");
  magentaRingMaterial.opacity = isCommunityOverlay ? 0.11 : 0.025;

  const currentRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.06, 0.003, 8, 160), cyanRingMaterial);
  currentRing.rotation.set(1.25, 0.12, 0.5);
  const counterRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.12, 0.0025, 8, 160), magentaRingMaterial);
  counterRing.rotation.set(1.42, 0.64, -0.35);
  globeGroup.add(currentRing, counterRing);

  const keyLight = new THREE.DirectionalLight(isCommunityOverlay ? "#ffe0b4" : "#ffffff", isCommunityOverlay ? 4.2 : 3.4);
  keyLight.position.set(4, 2, 5);
  scene.add(keyLight);
  let fashionFillLight = null;
  if (isCommunityOverlay) {
    fashionFillLight = new THREE.PointLight("#6eb5a0", 1.35, 14, 2);
    fashionFillLight.position.set(-4, -1.2, 3.6);
    scene.add(fashionFillLight);
    const rimLight = new THREE.DirectionalLight("#d7a867", 2.2);
    rimLight.position.set(-3.5, 2.8, -4);
    scene.add(rimLight);
  }

  const orbitingPlanets = [];
  if (isCommunityOverlay) {
    const planetDefinitions = [
      { size: 0.075, orbit: 1.94, height: 0.72, depth: 0.52, phase: 0.2, speed: 0.00022 },
      { size: 0.105, orbit: 2.12, height: 0.48, depth: 0.64, phase: 2.4, speed: -0.00016 },
      { size: 0.06, orbit: 2.28, height: 0.88, depth: 0.38, phase: 4.3, speed: 0.00012 },
    ];
    planetDefinitions.forEach((definition, index) => {
      const planetTexture = new THREE.CanvasTexture(makeMiniPlanetTexture(index));
      planetTexture.colorSpace = THREE.SRGBColorSpace;
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(definition.size, 32, 32),
        new THREE.MeshPhysicalMaterial({
          map: planetTexture,
          metalness: 0.08,
          roughness: 0.38,
          clearcoat: 0.48,
          clearcoatRoughness: 0.24,
        })
      );
      orbitingPlanets.push({ mesh: planet, ...definition });
      globeGroup.add(planet);
    });
  }

  checkInData.forEach((point, index) => {
    const surface = latLngToVector3(point.lat, point.lng, radius);
    const top = latLngToVector3(point.lat, point.lng, radius + point.size);
    const pointColor = isCommunityOverlay ? ["#e2b675", "#68ad86", "#9ac7ca"][index % 3] : point.color;
    const material = new THREE.MeshBasicMaterial({ color: pointColor });
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.025, 18, 18), material);
    const spike = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([surface, top]),
      new THREE.LineBasicMaterial({ color: pointColor, transparent: true, opacity: isCommunityOverlay ? 0.34 : 0.58 })
    );

    marker.position.copy(top);
    signalMarkers.push(marker);
    globeGroup.add(marker, spike);
  });

  const arcLines = arcData.map((arc, arcIndex) => {
    const start = latLngToVector3(arc.startLat, arc.startLng, radius + 0.025);
    const end = latLngToVector3(arc.endLat, arc.endLng, radius + 0.025);
    const curve = makeArcCurve(start, end);
    const points = curve.getPoints(64);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: isCommunityOverlay ? ["#e2b675", "#5da882", "#9ac7ca"][arcIndex % 3] : arc.color, transparent: true, opacity: isCommunityOverlay ? 0.18 : 0.24 })
    );
    globeGroup.add(line);
    return { line, curve, color: isCommunityOverlay ? ["#e2b675", "#5da882", "#9ac7ca"][arcIndex % 3] : arc.color };
  });

  arcLines.forEach((arc, arcIndex) => {
    for (let i = 0; i < 6; i += 1) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 12, 12),
        new THREE.MeshBasicMaterial({
          color: arc.color,
          transparent: true,
          opacity: 0.46,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      currentParticles.push({
        mesh: particle,
        curve: arc.curve,
        phase: (i / 6) + arcIndex * 0.17,
      });
      globeGroup.add(particle);
    }
  });

  namasteData.forEach((item, index) => {
    const sprite = makeTextSprite(item.text, isCommunityOverlay ? ["#efd7b0", "#d3a765", "#7eb493", "#f4ead8"][index % 4] : item.color);
    sprite.position.copy(latLngToVector3(item.lat, item.lng, radius + 0.34));
    namasteSprites.push(sprite);
    globeGroup.add(sprite);
  });

  function addCommunityMarker(node, index, visualOverride) {
    const isHero = node.hero === true;
    const warmth = isCommunityOverlay
      ? (index % 3 === 0 ? "#f0d0a0" : index % 3 === 1 ? "#75aa87" : "#9fc7c2")
      : (index % 3 === 0 ? "#fff6d6" : index % 3 === 1 ? "#ffd9ec" : "#d9fff8");
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(isHero ? 0.014 : 0.009, 14, 14),
      new THREE.MeshBasicMaterial({
        color: warmth,
        transparent: true,
        opacity: 0.74,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(isHero ? 0.043 : 0.025, 18, 18),
      new THREE.MeshBasicMaterial({
        color: warmth,
        transparent: true,
        opacity: 0.10,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 24, 24),
      new THREE.MeshBasicMaterial({
        color: beaconColors[0],
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const position = latLngToVector3(node.lat, node.lng, radius + 0.018);
    const labelPosition = latLngToVector3(node.lat, node.lng, radius + 0.28);
    const visual = visualOverride || (isHero ? heroLayout[node.name] : null);
    const visualPosition = visual ? visualSurfaceVector(visual.x, visual.y, radius + 0.018) : null;
    const visualLabelPosition = visual ? visualSurfaceVector(visual.x, visual.y, radius + 0.30) : null;
    const labelAnchor = new THREE.Object3D();
    core.position.copy(position);
    halo.position.copy(position);
    beacon.position.copy(position);
    labelAnchor.position.copy(labelPosition);
    core.renderOrder = 20;
    halo.renderOrder = 19;
    beacon.renderOrder = 18;
    core.userData.name = node.checkin || "";
    core.userData.state = node.name;
    core.userData.isHero = isHero;
    core.userData.communityIndex = index;
    communityMarkers.push({
      core,
      halo,
      beacon,
      labelAnchor,
      name: node.checkin || "",
      state: node.name,
      isHero,
      phase: index * 0.71,
      baseColor: warmth,
      geoPosition: position.clone(),
      geoLabelPosition: labelPosition.clone(),
      visualPosition,
      visualLabelPosition,
      visualLabelSide: visual?.labelSide || "auto",
      currentLabelSide: "auto",
    });
    globeGroup.add(beacon, halo, core, labelAnchor);
    return communityMarkers[communityMarkers.length - 1];
  }

  communityNodes.forEach((node, index) => {
    addCommunityMarker(node, index);
  });

  function integrateCheckIn(phrase) {
    const index = communityNodes.length;
    const node = {
      lat: -33.8688,
      lng: 151.2093,
      name: "Global check in",
      checkin: phrase,
      hero: true,
    };

    communityNodes.push(node);
    communityActivationSequence.push(index);
    addCommunityMarker(node, index, { x: 0.58, y: -0.04, labelSide: "right" });
    activeCommunityStep = communityActivationSequence.length - 1;
    activeCommunityIndex = index;
    lastCommunityActivation = performance.now();
  }

  window.__iamGlobeCheckIn = {
    integrateCheckIn,
  };

  window.__globeFDebug = {
    heroNames: communityActivationSequence.map((index) => communityNodes[index].name),
    heroLayout,
  };

  camera.position.set(0, 0, 5.15);
  camera.lookAt(0, 0, 0);
  globeGroup.rotation.y = -0.55;
  container.replaceChildren(renderer.domElement, nodeLabel);

  function resizeGlobe() {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
  }

  function setHoveredCommunityMarker(marker) {
    hoveredCommunityMarker = marker;
    renderer.domElement.style.cursor = marker ? "default" : "";
  }

  function updateCommunityHover(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(communityMarkers.map((marker) => marker.core), false);
    const heroIntersection = intersections.find((item) => item.object.userData.isHero);
    setHoveredCommunityMarker(heroIntersection ? communityMarkers[heroIntersection.object.userData.communityIndex] : null);
  }

  function clearCommunityHover() {
    setHoveredCommunityMarker(null);
  }

  function getGlobeScreenBounds(width, height) {
    const point = new THREE.Vector3();
    const projected = new THREE.Vector3();
    const bounds = {
      minX: width,
      maxX: 0,
      minY: height,
      maxY: 0,
    };

    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lng = -180; lng < 180; lng += 20) {
        point.copy(latLngToVector3(lat, lng, radius));
        globeGroup.localToWorld(point);
        projected.copy(point).project(camera);

        if (projected.z < -1 || projected.z > 1) continue;

        const x = (projected.x * 0.5 + 0.5) * width;
        const y = (-projected.y * 0.5 + 0.5) * height;
        bounds.minX = Math.min(bounds.minX, x);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxY = Math.max(bounds.maxY, y);
      }
    }

    return bounds;
  }

  function getSpaceLabelPosition(width, height, projectedX, projectedY, preferredSide) {
    const bounds = getGlobeScreenBounds(width, height);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const screenRadiusX = (bounds.maxX - bounds.minX) / 2;
    const screenRadiusY = (bounds.maxY - bounds.minY) / 2;
    const labelWidth = width < 760 ? 190 : 220;
    const pad = width < 760 ? 18 : 24;
    const containerRect = container.getBoundingClientRect();
    const copyRect = document.querySelector(".landing-copy")?.getBoundingClientRect();
    const mobileMinY = 92;
    const mobileMaxY = copyRect
      ? Math.max(mobileMinY, copyRect.top - containerRect.top - 34)
      : height - 150;
    const clampX = (value) => Math.max(pad, Math.min(width - labelWidth - pad, value));
    const clampY = (value) => width < 760
      ? Math.max(mobileMinY, Math.min(Math.min(height - 150, mobileMaxY), value))
      : Math.max(86, Math.min(height - 88, value));
    const normalizedY = Math.max(-0.92, Math.min(0.92, (projectedY - centerY) / screenRadiusY));
    const horizontalReach = Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY)) * screenRadiusX;
    let side = preferredSide || (projectedX < centerX ? "left" : "right");
    let x = side === "right"
      ? clampX(centerX + horizontalReach + 18)
      : clampX(centerX - horizontalReach - labelWidth - 18);
    let y = clampY(projectedY);

    if (side === "left" && copyRect && y > copyRect.top - 28) {
      side = "right";
      x = clampX(centerX + horizontalReach + 18);
      y = clampY(y);
    }

    return [x, y];
  }

  function updateNodeLabel(marker, emphasis, placement) {
    if (!marker || emphasis <= 0.04) {
      nodeLabel.style.opacity = "0";
      return;
    }

    marker.labelAnchor.getWorldPosition(projectedPosition);
    projectedPosition.project(camera);

    if (projectedPosition.z < -1 || projectedPosition.z > 1) {
      nodeLabel.style.opacity = "0";
      return;
    }

    const width = renderer.domElement.clientWidth || container.clientWidth;
    const height = renderer.domElement.clientHeight || container.clientHeight;
    const copyRect = document.querySelector(".landing-copy")?.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const projectedX = (projectedPosition.x * 0.5 + 0.5) * width;
    const projectedY = (-projectedPosition.y * 0.5 + 0.5) * height;
    let x = projectedX;
    let y = projectedY;
    let isOffset = false;
    let isSpace = false;

    if (placement) {
      [x, y] = getSpaceLabelPosition(width, height, projectedX, projectedY, placement === "auto" ? null : placement);
      isSpace = true;
    }

    if (!isSpace && copyRect) {
      const copyRight = copyRect.right - containerRect.left;
      const copyTop = copyRect.top - containerRect.top;
      const copyBottom = copyRect.bottom - containerRect.top;
      const labelWouldSitInCopy = projectedX < copyRight + 28 && projectedY > copyTop - 40 && projectedY < copyBottom + 40;

      if (labelWouldSitInCopy) {
        if (width < 760) {
          x = Math.min(width - 212, Math.max(24, projectedX));
          y = Math.max(116, copyTop - 28);
        } else {
          x = Math.min(width - 220, copyRight + 32);
          y = Math.max(copyTop + 24, Math.min(projectedY, copyBottom - 24));
        }
        isOffset = true;
      }
    }

    if (width < 760 && y < 150) {
      y = 150;
      isOffset = true;
    }

    nodeLabelName.textContent = marker.name;
    nodeLabelState.textContent = marker.state;
    nodeLabelBeacon.style.setProperty("--beacon-color", beaconColors[activeCommunityStep % beaconColors.length]);
    nodeLabelBeacon.style.setProperty("--beacon-color-soft", beaconSoftColors[activeCommunityStep % beaconSoftColors.length]);
    nodeLabel.classList.toggle("is-offset", isOffset);
    nodeLabel.classList.toggle("is-space", isSpace);
    nodeLabel.style.left = `${x}px`;
    nodeLabel.style.top = `${y}px`;
    nodeLabel.style.opacity = String(Math.min(0.78, emphasis));
  }

  function animateGlobe(time) {
    globeGroup.rotation.y += isCommunityOverlay ? 0.00108 : 0.0015;
    globeGroup.rotation.x = Math.sin(time * 0.00022) * (isCommunityOverlay ? 0.035 : 0.05);
    currentRing.rotation.z += isCommunityOverlay ? 0.00075 : 0.0018;
    counterRing.rotation.z -= isCommunityOverlay ? 0.00052 : 0.0012;
    if (isCommunityOverlay) {
      keyLight.position.x = 4.2 + Math.sin(time * 0.00018) * 1.8;
      keyLight.position.y = 2.2 + Math.cos(time * 0.00013) * 0.65;
      if (fashionFillLight) {
        fashionFillLight.position.x = -3.7 + Math.cos(time * 0.00016) * 1.4;
        fashionFillLight.position.y = -0.8 + Math.sin(time * 0.00019) * 0.9;
      }
      orbitingPlanets.forEach((planet, index) => {
        const angle = time * planet.speed + planet.phase;
        planet.mesh.position.set(
          Math.cos(angle) * planet.orbit,
          Math.sin(angle * 1.18 + index * 0.8) * planet.height,
          Math.sin(angle) * planet.depth
        );
        planet.mesh.rotation.y += 0.003 + index * 0.0007;
      });
    }
    signalMarkers.forEach((marker, index) => {
      const pulse = 1 + Math.sin(time * 0.004 + index) * 0.28;
      marker.scale.setScalar(pulse);
    });
    if (!lastCommunityActivation || time - lastCommunityActivation > 5000) {
      activeCommunityStep = (activeCommunityStep + 1) % communityActivationSequence.length;
      activeCommunityIndex = communityActivationSequence[activeCommunityStep];
      lastCommunityActivation = time;
    }

    let visibleCommunityMarker = null;
    let visibleCommunityEmphasis = 0;
    const activeHeroWindow = new Set();
    for (let offset = -3; offset <= 3; offset += 1) {
      const sequenceIndex = (activeCommunityStep + offset + communityActivationSequence.length) % communityActivationSequence.length;
      const markerIndex = communityActivationSequence[sequenceIndex];
      activeHeroWindow.add(markerIndex);
    }

    communityMarkers.forEach((marker, index) => {
      const isFeatured = index === activeCommunityIndex;
      const isHovered = marker === hoveredCommunityMarker;
      const isActiveHeroNode = marker.isHero && activeHeroWindow.has(index);
      const elapsed = time - lastCommunityActivation;
      const featuredEmphasis = elapsed < 650 ? elapsed / 650 : elapsed < 3600 ? 1 : Math.max(0, 1 - (elapsed - 3600) / 900);
      const emphasis = isHovered ? 1 : isFeatured ? featuredEmphasis : 0;
      const baseScale = marker.isHero ? (isActiveHeroNode ? 1 : 0.62) : 0.78;
      const pulse = baseScale + Math.sin(time * 0.0019 + marker.phase) * 0.10 + emphasis * 0.42;

      if (marker.isHero && marker.visualPosition) {
        marker.core.position.copy(marker.visualPosition);
        marker.halo.position.copy(marker.visualPosition);
        marker.beacon.position.copy(marker.visualPosition);
        marker.labelAnchor.position.copy(marker.visualLabelPosition);
        marker.currentLabelSide = marker.visualLabelSide;
      } else {
        marker.core.position.copy(marker.geoPosition);
        marker.halo.position.copy(marker.geoPosition);
        marker.beacon.position.copy(marker.geoPosition);
        marker.labelAnchor.position.copy(marker.geoLabelPosition);
        marker.currentLabelSide = "auto";
      }

      marker.core.scale.setScalar(pulse);
      marker.halo.scale.setScalar(0.7 + pulse * 0.28 + emphasis * 0.28);
      marker.core.material.color.set(marker.baseColor);
      marker.halo.material.color.set(marker.baseColor);
      marker.core.material.opacity = marker.isHero
        ? (isActiveHeroNode ? 0.58 : 0.18) + Math.sin(time * 0.0014 + index) * 0.06 + emphasis * 0.18
        : 0.34 + Math.sin(time * 0.0014 + index) * 0.08;
      marker.halo.material.opacity = marker.isHero
        ? (isActiveHeroNode ? 0.10 : 0.025) + Math.sin(time * 0.0016 + marker.phase) * 0.02 + emphasis * 0.08
        : 0.055 + Math.sin(time * 0.0016 + marker.phase) * 0.022;
      if (marker.beacon) {
        marker.beacon.material.opacity = 0;
      }

      if (marker.isHero && emphasis > visibleCommunityEmphasis) {
        visibleCommunityMarker = marker;
        visibleCommunityEmphasis = emphasis;
      }
    });

    const spacePlacement = hoveredCommunityMarker ? null : (visibleCommunityMarker?.currentLabelSide || "auto");
    updateNodeLabel(visibleCommunityMarker, visibleCommunityEmphasis, spacePlacement);
    arcLines.forEach((arc, index) => {
      arc.line.material.opacity = 0.16 + Math.sin(time * 0.002 + index) * 0.08;
    });
    currentParticles.forEach((particle, index) => {
      const t = (time * 0.00018 + particle.phase) % 1;
      particle.mesh.position.copy(particle.curve.getPoint(t));
      particle.mesh.material.opacity = 0.16 + Math.sin(time * 0.006 + index) * 0.12;
    });
    const showLanguageSprites = renderer.domElement.clientWidth >= 760;
    namasteSprites.forEach((sprite, index) => {
      sprite.material.opacity = showLanguageSprites ? 0.58 + Math.sin(time * 0.0016 + index) * 0.26 : 0;
    });
    renderer.render(scene, camera);
    window.requestAnimationFrame(animateGlobe);
  }

  window.addEventListener("resize", resizeGlobe);
  renderer.domElement.addEventListener("pointermove", updateCommunityHover);
  renderer.domElement.addEventListener("pointerleave", clearCommunityHover);
  resizeGlobe();
  animateGlobe(0);

  const shouldAutoIntegrate =
    document.querySelector("[data-iam-auto-integrate]")?.dataset.iamAutoIntegrate === "true" ||
    document.body?.dataset.iamAutoIntegrate === "true";
  const storedCheckIn =
    readUrlCheckIn() ||
    readStoredValue(window.sessionStorage, "iamLatestCheckinValue") ||
    readStoredValue(window.localStorage, "iamLatestCheckinValue") ||
    readStoredValue(window.sessionStorage, "citizenNeedsLatestCheckinValue") ||
    readStoredValue(window.localStorage, "citizenNeedsLatestCheckinValue");

  if (shouldAutoIntegrate && storedCheckIn) {
    window.setTimeout(async () => {
      document.body?.classList.add("is-arrival-integrating");
      setGlobeReceiving(true);
      const transferPromise = runPhraseTransfer(storedCheckIn, () => {
        showIamReflection(storedCheckIn);
      });
      await transferPromise;
      await wait(iamTiming.reflectionFadeIn + iamTiming.reflectionHold);
      hideIamReflection();
      await wait(iamTiming.reflectionDissolve);

      await transitionIamState("integrating");
      integrateCheckIn(storedCheckIn);
      await wait(iamTiming.integrationHold);

      setGlobeReceiving(false);
      await wait(iamTiming.arrivalHomepageDelay);
      document.body?.classList.remove("is-arrival-integrating");
      loadMainHomepage();
    }, 1100);
  }
}

initGlobe();
