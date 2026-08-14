const MIN_SUPPORTED_HEART_RATE = 30;
const MAX_SUPPORTED_HEART_RATE = 240;
const CURRENT_INFERENCE_ENDPOINT = "api/citizen-needs-inference.php";
const INFERENCE_STORAGE_KEYS = Object.freeze([
  "iamLatestInference",
  "citizenNeedsLatestInference",
]);
const CHECKIN_STORAGE_KEYS = Object.freeze([
  "iamLatestCheckinValue",
  "citizenNeedsLatestCheckinValue",
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

function readStoredInference(storage) {
  for (const key of INFERENCE_STORAGE_KEYS) {
    const serialized = readStorageValue(storage, key);
    if (!serialized) continue;
    try {
      const parsed = JSON.parse(serialized);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      // A malformed current-session handoff behaves like unavailable context.
    }
  }
  return null;
}

function currentCheckin(storage, inference) {
  if (typeof inference?.checkin === "string" && inference.checkin.trim()) return inference.checkin.trim();
  for (const key of CHECKIN_STORAGE_KEYS) {
    const value = readStorageValue(storage, key).trim();
    if (value) return value;
  }
  return "";
}

function environmentContext(inference) {
  const source = inference?.environment_context;
  return source && typeof source === "object" && !Array.isArray(source) ? source : {};
}

function containsRawHeartRate(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsRawHeartRate);
  return Object.entries(value).some(([key, nested]) => (
    RAW_HEART_RATE_KEYS.has(key.toLowerCase()) || containsRawHeartRate(nested)
  ));
}

function persistSafeInference(storage, checkin, payload) {
  if (!storage?.setItem || containsRawHeartRate(payload)) return false;
  const record = {
    checkin,
    updatedAt: Date.now(),
    status: "complete",
    ...payload,
  };
  if (containsRawHeartRate(record)) return false;
  const serialized = JSON.stringify(record);
  try {
    for (const key of INFERENCE_STORAGE_KEYS) storage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Re-runs the current first-party inference request with one ephemeral final
 * Shen BPM. The first-party Worker strips BPM before calling OpenAI, reconciles
 * supporting/conflicting evidence locally, and returns no raw BPM. This helper
 * never derives or stores a song, room, band, carrier or DSP choice.
 */
export async function reconcileHeartCheckInference(heartRate, {
  storage,
  fetchImpl,
  endpoint = CURRENT_INFERENCE_ENDPOINT,
} = {}) {
  let bpm = normalizedHeartRate(heartRate);
  if (bpm === null || !storage || typeof fetchImpl !== "function") {
    return Object.freeze({ status: "unavailable", inference: null, persisted: false });
  }

  const previousInference = readStoredInference(storage);
  const checkin = currentCheckin(storage, previousInference);
  if (!checkin) {
    bpm = null;
    return Object.freeze({ status: "unavailable", inference: null, persisted: false });
  }

  const body = JSON.stringify({
    checkin,
    environment_context: environmentContext(previousInference),
    momentary_physiology: {
      heart_rate_bpm: bpm,
      measurement_duration_seconds: 10,
      measurement_timing: "immediately_after_current_self_report",
      source: "shen_quick_hr",
    },
  });
  bpm = null;

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || containsRawHeartRate(payload) || !payload.current_inference) {
    return Object.freeze({ status: "failed", inference: null, persisted: false });
  }

  const persisted = persistSafeInference(storage, checkin, payload);
  return Object.freeze({
    status: persisted ? "complete" : "failed",
    inference: persisted ? payload : null,
    persisted,
  });
}

export const heartCheckInferencePrivacy = Object.freeze({
  measurement_duration_seconds: 10,
  scope: "current_session_only",
  raw_heart_rate_sent_to_openai: false,
  raw_heart_rate_returned: false,
  raw_heart_rate_persisted: false,
  direct_heart_rate_to_song_room_band_carrier_or_dsp: false,
});
