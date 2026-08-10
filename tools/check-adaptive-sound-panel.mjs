import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  NOISE_POWER_WEIGHT,
  PROFILE_NOISE_DEFAULTS,
} from "../i  a m/adaptive-sound/profiles-v1.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IAM = path.join(ROOT, "i  a m");
const [page, televisionController, panelController, panelCss, worklet, dsp, profiles] = await Promise.all([
  fs.readFile(path.join(IAM, "index.html"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-environment-television.js"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-sound", "controller-v1.js"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-sound", "panel-v1.css"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-sound", "worklet-v1.js"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-sound", "dsp-v1.js"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-sound", "profiles-v1.js"), "utf8"),
]);

assert.match(page, /id="iam-sound-panel"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-hidden="true"[^>]*inert/);
assert.match(page, /data-emdr-sound-research[^>]*aria-haspopup="dialog"[^>]*aria-controls="iam-sound-panel"/);
assert.match(page, /data-adaptive-sound-master[^>]*aria-pressed="true"/);
assert.equal((page.match(/data-adaptive-profile=/g) || []).length, 4);
assert.equal((page.match(/data-adaptive-lane-meter=/g) || []).length, 4);
assert.equal((page.match(/data-quantum-tree-panel-meter/g) || []).length, 1);
assert.equal((page.match(/data-adaptive-carrier=/g) || []).length, 5);
assert.equal((page.match(/data-adaptive-lane-toggle=/g) || []).length, 4);
assert.ok(page.includes("ENTRAINMENT FREQUENCIES"));
assert.ok(page.includes("3.33 Hz"));
assert.ok(page.includes("7.38 Hz"));
assert.ok(page.includes("10.11 Hz"));
assert.ok(page.includes("111 Hz"));
assert.ok(page.includes("7.38088 Hz"));
assert.ok(page.includes("111.011 Hz"));
assert.ok(page.includes("528.088 Hz"));
assert.ok(page.includes("14,444 Hz LOW-PASS"));
assert.ok(page.includes("MONO · IDENTICAL DUAL MONO"));
assert.ok(page.includes("Delta brown · Theta white · Alpha pink · Gamma equal three-way split"));
assert.ok(page.includes("It makes no medical, wellness, neurological or biological benefit claim."));
assert.equal(page.includes("Sound Research Layer - Investigating whether an optional sound layer modulates short term transcriptional pathways"), false);
assert.equal(page.includes("gene activated"), false);
assert.equal(page.includes("brain entrained"), false);

assert.ok(televisionController.includes('window.dispatchEvent(new CustomEvent("iam:adaptive-sound-open"))'));
assert.ok(televisionController.includes('const SOUND_RESEARCH_DEFAULT_MAX_VOLUME = 0.055;'));
assert.ok(televisionController.includes('const SOUND_RESEARCH_AUDIO_SRC = "a s s e t s/q u a n t u m [ t r e e ].m4a";'));
assert.ok(televisionController.includes("window.IAMQuantumTree ="));

assert.ok(panelController.includes('new URL("./worklet-v1.js?v=6c2022e83bc0", import.meta.url)'));
assert.ok(panelController.includes("new AudioWorkletNode(context, PROCESSOR_NAME"));
assert.ok(panelController.includes("outputChannelCount: [2]"));
assert.ok(panelController.includes("window.IAMQuantumTree?.setEnabled?.(state.masterEnabled)"));
assert.ok(panelController.includes('localStorage.getItem("iamSoundResearchLayer") !== "off"'));
assert.ok(panelController.includes('localStorage.getItem("iamAdaptiveSoundLayer") === "on"'));
assert.ok(panelController.includes("state.synthEnabled = false"));
assert.ok(panelController.includes('const directSoundPage = query.get("sound") === "1"'));
assert.ok(panelController.includes('document.body.dataset.adaptiveSoundDirect = "true"'));
assert.ok(panelController.includes('localStorage.setItem("iamAdaptiveSoundLayer", "off")'));
assert.ok(panelController.includes("phase1_explicit_lab_override") === false);
assert.equal(/localVideo|programmeAudio|continuationAudio|soundResearchAudio/.test(panelController), false);

assert.ok(worklet.includes('registerProcessor(PROCESSOR_NAME, IAMAdaptiveSoundProcessorV1)'));
assert.ok(worklet.includes('fail_safe: "adaptive_synth_off_quantum_tree_and_programme_unchanged"'));
assert.ok(worklet.includes("for (const channel of output) channel[frame] = mono"));
assert.ok(worklet.includes("output_peak: this.meterPeak"));

assert.match(panelCss, /\.iam-sound-module--quantum \{[\s\S]*?display: grid/);
assert.match(panelCss, /\.iam-sound-diamond \{[\s\S]*?display: grid/);
assert.match(panelCss, /repeating-linear-gradient/);
assert.match(panelCss, /#171816/i);
assert.match(panelCss, /\.iam-sound-module--control,[\s\S]*?display: none !important/);
assert.match(panelCss, /\.iam-sound-console__master \{[\s\S]*?display: none/);
assert.match(panelCss, /@media \(max-width: 620px\)/);
assert.match(panelCss, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(panelCss, /:focus-visible/);
assert.equal(/Didot|Bodoni|Vogue logo|Neve logo|Raytheon logo/i.test(panelCss), false);

assert.deepEqual(PROFILE_NOISE_DEFAULTS.sleep_delta_80_v1.power_weights, {
  white_noise_v1: 0,
  pink_noise_v1: 0,
  brown_noise_v1: NOISE_POWER_WEIGHT,
});
assert.deepEqual(PROFILE_NOISE_DEFAULTS.mindfulness_theta_80_v1.power_weights, {
  white_noise_v1: NOISE_POWER_WEIGHT,
  pink_noise_v1: 0,
  brown_noise_v1: 0,
});
assert.deepEqual(PROFILE_NOISE_DEFAULTS.calm_alpha_80_v1.power_weights, {
  white_noise_v1: 0,
  pink_noise_v1: NOISE_POWER_WEIGHT,
  brown_noise_v1: 0,
});
assert.ok(Math.abs(Object.values(PROFILE_NOISE_DEFAULTS.inspiration_gamma_80_v1.power_weights)
  .reduce((sum, weight) => sum + weight, 0) - NOISE_POWER_WEIGHT) < 1e-15);
assert.ok(profiles.includes("gamma_equal_white_pink_brown_default_v1"));

assert.ok(page.includes(`adaptive-sound/panel-v1.css?v=${sha12(panelCss)}`));
assert.ok(page.includes(`adaptive-sound/controller-v1.js?v=${sha12(panelController)}`));
assert.ok(panelController.includes(`./profiles-v1.js?v=${sha12(profiles)}`));
assert.ok(panelController.includes(`./worklet-v1.js?v=${sha12(worklet)}`));
assert.ok(worklet.includes(`./dsp-v1.js?v=${sha12(dsp)}`));
assert.ok(dsp.includes(`./profiles-v1.js?v=${sha12(profiles)}`));

const sourceHash = createHash("sha256")
  .update(panelController)
  .update(panelCss)
  .update(worklet)
  .update(profiles)
  .digest("hex");

console.log(JSON.stringify({
  passed: true,
  panel: "minimal_quantum_tree_plus_four_frequency_led_bars",
  portal_entry: "Sound button or ?sound=1 opens a calm five-bar page with one listen/stop control",
  quantum_tree_preserved: true,
  programme_audio_routed_through_synth: false,
  adaptive_default_requires_listener_start: true,
  source_sha256: sourceHash,
}, null, 2));

function sha12(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}
