import assert from "node:assert/strict";
import { mantraTarget, MANTRA_POLICY } from "../i  a m/adaptive-sound/mantra-policy-v1.js";
const full = { enabled: true, platformEnabled: true, masterEnabled: true, available: true,
  advancing: true, speechRms: 0.12, quantumGain: 0.055, outputMultiplier: 1 };
assert.ok(mantraTarget(full) > 0);
for (const flag of ["enabled", "platformEnabled", "masterEnabled", "available", "advancing"]) {
  assert.equal(mantraTarget({ ...full, [flag]: false }), 0, `${flag} must close the gate`);
}
for (const speechRms of [undefined, NaN, Infinity, -1, 0, 0.001, MANTRA_POLICY.speechFloor]) {
  assert.equal(mantraTarget({ ...full, speechRms }), 0, "Quiet or invalid analysis must silence mantra");
}
for (const speechRms of [0.0181, 0.025, 0.05, 0.12, 0.8]) {
  for (const quantumGain of [0, 0.001, 0.055, 0.2, 1]) {
    for (const outputMultiplier of [0, 0.11, 1]) {
      const actual = mantraTarget({ ...full, speechRms, quantumGain, outputMultiplier });
      assert.ok(actual <= quantumGain / 3, "One-third ceiling");
      assert.ok(actual <= speechRms * 0.01 * outputMultiplier + 1e-12, "Speech masking peak budget");
    }
  }
}
let previous = 0;
for (let i = 0; i <= 1000; i++) {
  const actual = mantraTarget({ ...full, speechRms: i / 1000 });
  assert.ok(actual >= previous, "Fading programme must never raise the target");
  previous = actual;
}
console.log("Mantra masking policy passed: stop conditions, missing analysis, quiet threshold, downward limits, monotonic fade.");
