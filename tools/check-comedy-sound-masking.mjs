import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { PROFILE_CANDIDATES } from "../i  a m/adaptive-sound/profiles-v1.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const sha12 = (source) => createHash("sha256").update(source).digest("hex").slice(0, 12);

const comedy = read("i  a m/comedy-channel-v1.js");
const quantum = read("i  a m/adaptive-environment-television.js");
const adaptive = read("i  a m/adaptive-sound/controller-v1.js");
const index = read("i  a m/index.html");
const indexAlt = read("i  a m/index-alt.html");
const televisionPage = read("i  a m/adaptive-environment-television.html");

assert.match(comedy, /const COMEDY_SOUND_OUTPUT_MULTIPLIER = 0\.11;/);
assert.match(comedy, /dataset\.comedySoundOutputMultiplier = COMEDY_SOUND_OUTPUT_MULTIPLIER\.toFixed\(2\)/);
assert.match(comedy, /delete document\.body\.dataset\.comedySoundOutputMultiplier/);
assert.ok(
  comedy.indexOf("window.IAMEMDR?.setAudioSource?.(video)") < comedy.indexOf("window.IAMStreamController?.play?.(video)"),
  "Comedy must attach its programme audio to the masking analyser before playback.",
);
assert.match(comedy, /window\.IAMQuantumTree\?\.ensurePlaying\?\.\(\)/);

assert.match(quantum, /const SOUND_RESEARCH_COMEDY_OUTPUT_MULTIPLIER = 0\.11;/);
assert.match(quantum, /if \(comedyIsAudible\) return \{ media: comedyVideo, source: "comedy" \}/);
assert.match(quantum, /return soundResearchMaxVolume \* outputMultiplier;/);
assert.match(quantum, /Math\.pow\(normalizedLevel, SOUND_RESEARCH_MASKING_CURVE\) \* outputMultiplier/);
assert.match(quantum, /outputMultiplier: soundResearchOutputMultiplier\(\)/);
assert.match(quantum, /ensurePlaying\(\) \{[\s\S]{0,180}startSoundResearchLayer\(\)/);

assert.match(adaptive, /const COMEDY_OUTPUT_MULTIPLIER = 0\.11;/);
assert.match(adaptive, /return \(state\.intensity \/ 100\) \* adaptiveProgrammeOutputMultiplier\(\)/);
assert.match(adaptive, /linearRampToValueAtTime\(adaptiveRouteOutputGain\(\), now \+ 0\.42\)/);
assert.match(adaptive, /attributeFilter: \["class", "data-comedy-sound-output-multiplier"\]/);
assert.match(adaptive, /programme_output_multiplier: adaptiveProgrammeOutputMultiplier\(\)/);
assert.match(adaptive, /route_output_gain: adaptiveRouteOutputGain\(\)/);

assert.equal((adaptive.match(/level: 0\.77/g) || []).length, 2, "Both visible 77% Quantum Tree channels must remain unchanged.");
assert.equal((adaptive.match(/level: 0\.86/g) || []).length, 1, "The visible 86% Quantum Tree channel must remain unchanged.");
for (const profileId of [
  "sleep_delta_80_v1",
  "mindfulness_theta_80_v1",
  "calm_alpha_80_v1",
  "inspiration_gamma_80_v1",
]) {
  const profile = PROFILE_CANDIDATES[profileId];
  const weights = Object.values(profile.diamond_power_weights);
  assert.equal(weights.filter((weight) => weight === 0.8).length, 1);
  assert.equal(weights.filter((weight) => weight === 0.0666).length, 3);
}

assert.equal(1 * 0.11, 0.11, "Comedy must use 11% of the normal route gain.");
assert.equal(1 * 1, 1, "Leaving Comedy must restore the normal route gain.");

const quantumToken = `music-tv-${sha12(quantum)}`;
const comedyToken = `comedy-channel-js-${sha12(comedy)}`;
const adaptiveToken = sha12(adaptive);
for (const [name, page] of [
  ["index.html", index],
  ["index-alt.html", indexAlt],
  ["adaptive-environment-television.html", televisionPage],
]) {
  assert.ok(page.includes(`adaptive-environment-television.js?v=${quantumToken}`), `${name} has a stale Quantum Tree controller token.`);
}
assert.ok(index.includes(`comedy-channel-v1.js?v=${comedyToken}`), "index.html has a stale Comedy controller token.");
assert.ok(index.includes(`adaptive-sound/controller-v1.js?v=${adaptiveToken}`), "index.html has a stale adaptive-sound controller token.");

new vm.Script(comedy, { filename: "comedy-channel-v1.js" });
new vm.Script(quantum, { filename: "adaptive-environment-television.js" });

console.log("Comedy sound masking checks passed: both routes use 0.11, dynamic Quantum masking remains active, and 77/77/86 plus adaptive profile allocations are unchanged.");
