// Provisional engineering calibration. Digital limits do not prove inaudibility.
export const MANTRA_POLICY = Object.freeze({
  version: "mantra-masking-v2",
  quantumGainRatio: 1 / 3,
  speechFloor: 0.018,
  speechFull: 0.08,
  speechPeakRatio: 0.01,
  openAfterMs: 400,
  measurementLeaseMs: 80,
});

export function mantraTarget({ enabled, platformEnabled, masterEnabled, available,
  advancing, speechRms, quantumGain, outputMultiplier }) {
  if (!enabled || !platformEnabled || !masterEnabled || !available || !advancing
    || !Number.isFinite(speechRms) || !Number.isFinite(quantumGain)
    || !Number.isFinite(outputMultiplier) || outputMultiplier <= 0
    || speechRms <= MANTRA_POLICY.speechFloor || quantumGain <= 0) return 0;
  const masking = Math.min(1, (speechRms - MANTRA_POLICY.speechFloor)
    / (MANTRA_POLICY.speechFull - MANTRA_POLICY.speechFloor));
  // A downward-only peak budget below speech-band RMS, in addition to the
  // proposed one-third Quantum Tree ceiling. No normalisation or solo mode.
  return Math.min(
    Math.max(0, Math.min(1, quantumGain)) * MANTRA_POLICY.quantumGainRatio * masking * masking,
    speechRms * MANTRA_POLICY.speechPeakRatio * Math.min(1, outputMultiplier),
  );
}
