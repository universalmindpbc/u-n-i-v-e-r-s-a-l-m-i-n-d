const MIN_SUPPORTED_HEART_RATE = 30;
const MAX_SUPPORTED_HEART_RATE = 240;

/**
 * Creates a current-session adaptive-sound choice without retaining the
 * underlying heart-rate reading. This is an exploratory pacing heuristic,
 * not a physiological or mental-health classification.
 */
export function deriveHeartCheckRecommendation(heartRate) {
  const roundedHeartRate = Math.round(Number(heartRate));
  if (!Number.isFinite(roundedHeartRate)
    || roundedHeartRate < MIN_SUPPORTED_HEART_RATE
    || roundedHeartRate > MAX_SUPPORTED_HEART_RATE) {
    return null;
  }

  if (roundedHeartRate < 60) {
    return Object.freeze({
      band_intent: "gamma",
      carrier_intent: "cognition_joy",
      high_concern_session_opt_in: false,
      scope: "current_session_only",
    });
  }

  if (roundedHeartRate < 85) {
    return Object.freeze({
      band_intent: "alpha",
      carrier_intent: "presence",
      high_concern_session_opt_in: false,
      scope: "current_session_only",
    });
  }

  return Object.freeze({
    band_intent: "theta",
    carrier_intent: "self_connection",
    high_concern_session_opt_in: false,
    scope: "current_session_only",
  });
}

export function writeEphemeralHeartCheckRecommendation(heartRate, storage, storageKey) {
  const recommendation = deriveHeartCheckRecommendation(heartRate);
  if (!recommendation || !storage || !storageKey) return false;
  try {
    storage.setItem(storageKey, JSON.stringify(recommendation));
    return true;
  } catch {
    return false;
  }
}
