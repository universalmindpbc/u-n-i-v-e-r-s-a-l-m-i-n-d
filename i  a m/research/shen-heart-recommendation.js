const MIN_SUPPORTED_HEART_RATE = 30;
const MAX_SUPPORTED_HEART_RATE = 240;
const HEART_CHECK_HANDOFF_ENDPOINT = "api/heart-check-handoff.php";
const HEART_CHECK_HANDOFF_TIMEOUT_MS = 1500;
const CHECKIN_STORAGE_KEYS = Object.freeze([
  "iamLatestCheckinValue",
  "citizenNeedsLatestCheckinValue",
]);
const INFERENCE_STORAGE_KEYS = Object.freeze([
  "iamLatestInference",
  "citizenNeedsLatestInference",
]);
const RAW_HEART_RATE_KEYS = new Set(["heart_rate_bpm", "heartratebpm", "bpm"]);

function normalizedHeartRate(value) {
  const roundedHeartRate = Math.round(Number(value));
  return Number.isFinite(roundedHeartRate)
    && roundedHeartRate >= MIN_SUPPORTED_HEART_RATE
    && roundedHeartRate <= MAX_SUPPORTED_HEART_RATE
    ? roundedHeartRate
    : null;
}

function readStorageValue(storage, key) {
  try {
    return storage?.getItem?.(key) || "";
  } catch {
    return "";
  }
}

function currentCheckin(storage) {
  for (const key of CHECKIN_STORAGE_KEYS) {
    const value = readStorageValue(storage, key).trim();
    if (value) return value;
  }
  for (const key of INFERENCE_STORAGE_KEYS) {
    const serialized = readStorageValue(storage, key);
    if (!serialized) continue;
    try {
      const inference = JSON.parse(serialized);
      if (typeof inference?.checkin === "string" && inference.checkin.trim()) {
        return inference.checkin.trim();
      }
    } catch {
      // A malformed current-session inference behaves like unavailable context.
    }
  }
  return "";
}

function containsRawHeartRate(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsRawHeartRate);
  return Object.entries(value).some(([key, nested]) => (
    RAW_HEART_RATE_KEYS.has(key.toLowerCase()) || containsRawHeartRate(nested)
  ));
}

/**
 * Gives the first-party server one ephemeral final Shen BPM before the normal
 * homepage check-in pipeline starts. The server returns only acceptance and
 * owns the unreadable, single-use HttpOnly handoff cookie. This helper never
 * writes BPM, a handoff id or a derived recommendation into browser storage.
 */
export async function handoffHeartCheckToHomepage(heartRate, {
  storage,
  fetchImpl,
  endpoint = HEART_CHECK_HANDOFF_ENDPOINT,
  AbortControllerImpl = globalThis.AbortController,
  timeoutMs = HEART_CHECK_HANDOFF_TIMEOUT_MS,
} = {}) {
  let bpm = normalizedHeartRate(heartRate);
  const checkin = currentCheckin(storage);
  if (bpm === null || !checkin || typeof fetchImpl !== "function" || !AbortControllerImpl) {
    bpm = null;
    return Object.freeze({ status: "unavailable", accepted: false });
  }

  const body = JSON.stringify({
    checkin,
    momentary_physiology: {
      heart_rate_bpm: bpm,
      measurement_duration_seconds: 10,
      measurement_timing: "immediately_after_current_self_report",
      source: "shen_quick_hr",
    },
  });
  bpm = null;

  const controller = new AbortControllerImpl();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status !== 202 || payload.accepted !== true || containsRawHeartRate(payload)) {
      return Object.freeze({ status: "unavailable", accepted: false });
    }
    return Object.freeze({ status: "accepted", accepted: true });
  } catch {
    return Object.freeze({ status: "unavailable", accepted: false });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export const heartCheckHandoffPrivacy = Object.freeze({
  endpoint: HEART_CHECK_HANDOFF_ENDPOINT,
  measurement_duration_seconds: 10,
  max_acceptance_wait_ms: HEART_CHECK_HANDOFF_TIMEOUT_MS,
  scope: "current_session_single_use",
  opaque_cookie_http_only: true,
  raw_heart_rate_sent_to_openai: false,
  raw_heart_rate_returned: false,
  raw_heart_rate_persisted_in_browser: false,
  direct_heart_rate_to_song_room_band_carrier_or_dsp: false,
});
