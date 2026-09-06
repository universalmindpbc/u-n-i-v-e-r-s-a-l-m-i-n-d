// The mantra follows the existing Quantum Tree mix; it has no second detector.
export const MANTRA_POLICY = Object.freeze({
  version: "mantra-quantum-follow-v3",
  quantumGainRatio: 1 / 3,
  measurementLeaseMs: 80,
});

export function mantraTarget({ enabled, platformEnabled, masterEnabled, available,
  advancing, quantumGain }) {
  if (!enabled || !platformEnabled || !masterEnabled || !available || !advancing
    || !Number.isFinite(quantumGain) || quantumGain <= 0) return 0;
  return Math.min(1, quantumGain) * MANTRA_POLICY.quantumGainRatio;
}
