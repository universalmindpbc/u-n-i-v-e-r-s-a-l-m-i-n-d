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
const [page, televisionController, televisionCss, panelController, panelCss, worklet, dsp, profiles, scienceData, scienceController] = await Promise.all([
  fs.readFile(path.join(IAM, "index.html"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-environment-television.js"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-environment-television.css"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-sound", "controller-v1.js"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-sound", "panel-v1.css"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-sound", "worklet-v1.js"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-sound", "dsp-v1.js"), "utf8"),
  fs.readFile(path.join(IAM, "adaptive-sound", "profiles-v1.js"), "utf8"),
  fs.readFile(path.join(IAM, "science-research-data-v1.js"), "utf8"),
  fs.readFile(path.join(IAM, "science.js"), "utf8"),
]);

assert.match(page, /id="iam-sound-panel"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-hidden="true"[^>]*inert/);
assert.match(page, /data-emdr-sound-research[^>]*aria-haspopup="dialog"[^>]*aria-controls="iam-sound-panel"/);
assert.match(page, /data-video-sound-open[^>]*aria-haspopup="dialog"[^>]*aria-controls="iam-sound-panel"/);
assert.match(page, /data-sound-research-source[^>]*hidden/);
assert.match(page, /data-adaptive-sound-master[^>]*aria-pressed="true"/);
assert.equal((page.match(/data-adaptive-profile=/g) || []).length, 8);
assert.equal((page.match(/data-adaptive-lane-meter=/g) || []).length, 4);
assert.equal((page.match(/data-adaptive-channel-meter=/g) || []).length, 4);
assert.equal((page.match(/data-adaptive-channel-weight=/g) || []).length, 4);
assert.equal((page.match(/data-quantum-tree-panel-meter/g) || []).length, 1);
assert.equal((page.match(/data-quantum-channel-meter=/g) || []).length, 3);
assert.equal((page.match(/data-adaptive-carrier=/g) || []).length, 5);
assert.equal((page.match(/<option value="(?:111|222|444|555|999)"/g) || []).length, 5);
assert.equal((page.match(/data-adaptive-lane-toggle=/g) || []).length, 4);
assert.ok(page.includes("ENTRAINMENT FREQUENCIES"));
assert.ok(page.includes(">Quantum Tree</h3>"));
assert.ok(page.includes("7.38hz x 111hz <span>|</span> 528hz"));
assert.ok(page.includes(">Carrier Frequency</span>"));
assert.ok(page.includes("data-adaptive-carrier-select"));
assert.ok(page.includes(">Isochronic Frequency Matrix</h3>"));
assert.ok(page.includes("<strong>Oxytocin</strong>"));
assert.ok(page.includes('data-adaptive-sound-research-open'));
assert.ok(page.includes('>Research Target For Clinical Research</button>'));
assert.equal((page.match(/class="iam-sound-diamond__point[^>]+disabled/g) || []).length, 4);
assert.equal((page.match(/class="iam-sound-diamond__selector/g) || []).length, 4);
assert.equal((page.match(/class="iam-sound-channel__hit"/g) || []).length, 4);
assert.equal((page.match(/class="iam-sound-diamond__planet/g) || []).length, 4);
assert.equal((page.match(/class="iam-sound-diamond__matrix-line/g) || []).length, 4);
assert.equal((page.match(/data-adaptive-wave-path/g) || []).length, 2);
assert.ok(page.includes('class="iam-sound-diamond__wave"'));
assert.equal(page.includes("iam-sound-channel-wave"), false);
assert.equal(page.includes("data-adaptive-sound-nav"), false);
assert.match(page, /<span class="iam-sound-console__nav" aria-hidden="true">/);
assert.ok(page.includes("3.33 Hz"));
assert.ok(page.includes("7.38 Hz"));
assert.ok(page.includes("10.11 Hz"));
assert.ok(page.includes("111 Hz"));
assert.ok(page.includes("7.38088 Hz"));
assert.ok(page.includes("111.011 Hz"));
assert.ok(page.includes("528.088 Hz"));
assert.match(page, /data-quantum-channel-meter="isochronic"[\s\S]*?<strong>77%<\/strong>/);
assert.match(page, /data-quantum-channel-meter="carrier"[\s\S]*?<strong>77%<\/strong>/);
assert.match(page, /data-quantum-channel-meter="constant"[\s\S]*?<strong>86%<\/strong>/);
assert.ok(page.includes("14,444 Hz LOW-PASS"));
assert.ok(page.includes("MONO · IDENTICAL DUAL MONO"));
assert.ok(page.includes("Delta brown · Theta white · Alpha pink · Gamma equal three-way split"));
assert.ok(page.includes('data-research-frequency="Isochronic tone: 7.38088 Hz, carried on a 111.011 Hz sine wave, plus a separate constant 528.088 Hz sine wave, together as one."'));
assert.ok(page.includes("Sound Research Layer — Investigating whether an optional sound layer modulates short term transcriptional pathways, relevant to mental health."));
assert.ok(page.includes('To learn more about the scientific research behind these selected frequencies, [<a href="science.html#research-sound" data-research-dialog-science-link>click here</a>].'));
assert.ok(page.includes("[ Proposed double blinded RCT with mRNA sequencing via buccal swab and roadmap to CandyCollect lollypop. Target genes include NMDAR for cognition and memory, OXTR, SLC6A4, DRD2, IL6, NR3C1, DOCK2, CD38, together as one ]"));
assert.equal(page.includes("Sound Research Layer — an optional exploratory layer of precisely logged acoustic conditions."), false);
assert.equal(page.includes("Frequencies and gene labels describe study hypotheses only."), false);
assert.equal(page.includes("Adaptive diamond: 3.33 / 7.38 / 10.11 / exactly 111 Hz."), false);
assert.equal(page.includes("Carrier research conditions:"), false);
assert.equal(page.includes("full frequencies, genes + medical research →"), false);
assert.equal(page.includes("gene activated"), false);
assert.equal(page.includes("brain entrained"), false);
assert.equal(scienceData.includes("adaptiveProgramme"), false);
assert.equal(scienceController.includes("research-boundary--adaptive-sound"), false);
assert.equal(televisionCss.includes("adaptive-television-research-tooltip__full"), false);

assert.ok(televisionController.includes('window.dispatchEvent(new CustomEvent("iam:adaptive-sound-open"))'));
assert.ok(televisionController.includes('window.addEventListener("iam:adaptive-sound-research-open", openSoundResearchDetails)'));
assert.ok(televisionController.includes('window.addEventListener("iam:adaptive-sound-navigation", openAdaptiveSoundNavigation)'));
assert.ok(televisionController.includes('document.querySelector("[data-sound-research-source]")'));
assert.ok(televisionController.includes('const SOUND_RESEARCH_DEFAULT_MAX_VOLUME = 0.055;'));
assert.ok(televisionController.includes('const SOUND_RESEARCH_AUDIO_SRC = "a s s e t s/q u a n t u m [ t r e e ].m4a";'));
assert.ok(televisionController.includes("window.IAMQuantumTree ="));

assert.ok(panelController.includes('new URL("./worklet-v1.js?v=6c2022e83bc0", import.meta.url)'));
assert.ok(panelController.includes("new AudioWorkletNode(context, PROCESSOR_NAME"));
assert.ok(panelController.includes("outputChannelCount: [2]"));
assert.ok(panelController.includes("window.IAMQuantumTree?.setEnabled?.(state.masterEnabled)"));
assert.ok(panelController.includes('localStorage.getItem("iamSoundResearchLayer") !== "off"'));
assert.ok(panelController.includes("synthEnabled: true"));
assert.ok(panelController.includes('const directSoundPage = query.get("sound") === "1"'));
assert.ok(panelController.includes('document.body.dataset.adaptiveSoundDirect = "true"'));
assert.equal(panelController.includes("iamAdaptiveSoundLayer"), false);
assert.ok(panelController.includes('await selectProfile(button.dataset.adaptiveProfile || "", "listener_selection")'));
assert.ok(panelController.includes('new CustomEvent("iam:adaptive-sound-research-open")'));
assert.ok(panelController.includes('new CustomEvent("iam:adaptive-sound-navigation")'));
assert.ok(panelController.includes('document.querySelectorAll("[data-video-sound-open], [data-emdr-sound-research]")'));
assert.equal(panelController.includes('researchMoreButton?.click()'), false);
assert.equal(/navigationButton\?\.addEventListener\([\s\S]*?closePanel\(false\)/.test(panelController), false);
assert.ok(panelController.includes('carrierSelect?.addEventListener("change"'));
assert.ok(panelController.includes('localStorage.setItem("iamAdaptiveSoundProfile", profileId)'));
assert.ok(panelController.includes('return { profileId: DEFAULT_PROFILE_ID, authority: "neutral_alpha_default" }'));
assert.ok(panelController.includes("window.IAMQuantumTree?.setAuditionMode?.(state.masterEnabled)"));
assert.ok(panelController.includes("if (!profile || !state.masterEnabled)"));
assert.ok(panelController.includes("if (!state.masterEnabled || !state.synthEnabled)"));
assert.ok(panelController.includes("level: 0.77"));
assert.ok(panelController.includes("level: 0.86"));
assert.ok(panelController.includes('channelMeters[laneId]?.style.setProperty("--channel-meter", String(clamp(mixAllocation, 0, 1)))'));
assert.ok(panelController.includes('waveform_source: "audio_thread_lane_diagnostics"'));
assert.ok(panelController.includes("function updateWaveform(diagnostics)"));
assert.ok(panelController.includes("const MATRIX_LABEL_GAP_PX = 34;"));
assert.ok(panelController.includes("function updateMatrixGeometry()"));
assert.ok(panelController.includes('window.dispatchEvent(new CustomEvent("iam:adaptive-sound-panel-opened"))'));
assert.ok(televisionController.includes('window.addEventListener("iam:adaptive-sound-panel-opened"'));
assert.ok(televisionController.includes("setReactionWalletOpen(false);"));
assert.ok(panelController.includes('panel.querySelector(".iam-sound-diamond__wave")'));
assert.ok(panelController.includes("phase1_explicit_lab_override") === false);
assert.equal(/localVideo|programmeAudio|continuationAudio|soundResearchAudio/.test(panelController), false);

assert.ok(worklet.includes('registerProcessor(PROCESSOR_NAME, IAMAdaptiveSoundProcessorV1)'));
assert.ok(worklet.includes('fail_safe: "adaptive_synth_off_quantum_tree_and_programme_unchanged"'));
assert.ok(worklet.includes("for (const channel of output) channel[frame] = mono"));
assert.ok(worklet.includes("output_peak: this.meterPeak"));

assert.match(panelCss, /\.iam-sound-console \{[\s\S]*?inset: 0;[\s\S]*?background: transparent/);
assert.match(panelCss, /body\.iam-sound-direct-page \.background-video video \{[\s\S]*?opacity: 1 !important/);
assert.match(panelCss, /body\.iam-sound-direct-page \.homepage-welcome-copy,[\s\S]*?visibility: hidden !important;[\s\S]*?transition: none !important/);
assert.match(panelCss, /\.iam-sound-diamond__point--delta \{[\s\S]*?rgba\(26, 146, 229, 0\.44\)/);
assert.match(panelCss, /\.iam-sound-diamond__point--theta \{[\s\S]*?rgba\(245, 177, 22, 0\.44\)/);
assert.match(panelCss, /\.iam-sound-diamond__point--alpha \{[\s\S]*?rgba\(230, 45, 137, 0\.44\)/);
assert.match(panelCss, /\.iam-sound-diamond__point--gamma \{[\s\S]*?rgba\(56, 201, 55, 0\.44\)/);
assert.ok(panelCss.includes("--vesica-diameter: 30.5vw;"));
assert.ok(panelCss.includes("--vesica-offset: 10.7833784139849vw;"));
assert.ok(panelCss.includes("--quantum-group-width: clamp(102px, 6.7vw, 142px);"));
assert.ok(panelCss.includes("--quantum-group-half: clamp(51px, 3.35vw, 71px);"));
assert.match(panelCss, /\.iam-sound-quantum-frequency \{[\s\S]*?width: calc\(var\(--quantum-group-width\) \+ 44px\);[\s\S]*?text-align: center/);
assert.match(panelCss, /\.iam-sound-console__research \{[\s\S]*?left: calc\(7\.1vw \+ \(var\(--quantum-group-offset\) \/ 2\) \+ var\(--quantum-group-half\)\);[\s\S]*?text-align: center/);
assert.ok(panelCss.includes("--microtext-scrim: rgba(0, 0, 0, 0.1);"));
assert.match(panelCss, /\.iam-sound-quantum-frequency::before,[\s\S]*?background: var\(--microtext-scrim\);[\s\S]*?backdrop-filter: blur\(2px\)/);
assert.match(panelCss, /\.iam-sound-module--diamond \{[\s\S]*?pointer-events: none/);
assert.match(panelCss, /\.iam-sound-diamond__wave \{[\s\S]*?top: 39\.5%;[\s\S]*?opacity: 0/);
assert.match(panelCss, /\.iam-sound-panel\[aria-hidden="false"\] \.iam-sound-diamond__wave \{[\s\S]*?iam-sound-wave-reveal 720ms ease 8990ms forwards[\s\S]*?iam-sound-wave-breathe 5\.6s/);
assert.match(panelCss, /@keyframes iam-sound-wave-breathe/);
assert.match(panelCss, /\.iam-sound-diamond__matrix \{[\s\S]*?width: calc\(var\(--vesica-diameter\) \+ \(var\(--vesica-offset\) \* 2\)\)/);
assert.match(panelCss, /\.iam-sound-diamond__matrix-line \{[\s\S]*?stroke-dasharray: var\(--matrix-line-length, 440\);[\s\S]*?stroke-dashoffset: var\(--matrix-line-length, 440\)/);
assert.match(panelCss, /\.iam-sound-diamond__matrix-line--delta-theta \{[\s\S]*?1080ms ease 3800ms forwards/);
assert.match(panelCss, /\.iam-sound-diamond__matrix-line--theta-alpha \{[\s\S]*?1080ms ease 4910ms forwards/);
assert.match(panelCss, /\.iam-sound-diamond__matrix-line--alpha-gamma \{[\s\S]*?1080ms ease 6020ms forwards/);
assert.match(panelCss, /\.iam-sound-diamond__matrix-line--gamma-delta \{[\s\S]*?1080ms ease 7130ms forwards/);
assert.match(panelCss, /\.iam-sound-diamond__point--delta > small \{[\s\S]*?top: 10\.5%/);
assert.match(panelCss, /\.iam-sound-diamond__point--theta > small \{[\s\S]*?right: 10\.5%/);
assert.match(panelCss, /\.iam-sound-diamond__point--alpha > small \{[\s\S]*?bottom: 10\.5%/);
assert.match(panelCss, /\.iam-sound-diamond__point--gamma > small \{[\s\S]*?left: 10\.5%/);
assert.match(panelCss, /\.iam-sound-diamond__interaction \{[\s\S]*?width: calc\(var\(--vesica-diameter\) \+ \(var\(--vesica-offset\) \* 2\)\)/);
assert.match(panelCss, /\.iam-sound-diamond__selector--delta \{[\s\S]*?clip-path:/);
assert.match(panelCss, /\.iam-sound-diamond__core \{[\s\S]*?pointer-events: auto/);
assert.match(panelCss, /\.iam-sound-diamond__core select \{[\s\S]*?appearance: none/);
assert.match(panelCss, /\.iam-sound-panel\[aria-hidden="false"\] \.iam-sound-diamond__orbit \{[\s\S]*?iam-sound-planet-orbit 34s/);
assert.match(panelCss, /\.iam-sound-diamond__planet \{[\s\S]*?radial-gradient/);
assert.match(panelCss, /\.iam-sound-channel__hit \{[\s\S]*?cursor: pointer/);
assert.match(panelCss, /\.iam-sound-diamond__wave-glow \{[\s\S]*?stroke-width: 13/);
assert.match(panelCss, /\.iam-sound-carrier,[\s\S]*?display: none !important/);
assert.match(panelCss, /\.iam-sound-console__master \{[\s\S]*?display: flex/);
assert.match(panelCss, /\.iam-sound-console__master \{[\s\S]*?left: 50%;[\s\S]*?transform: translateX\(-50%\)/);
assert.match(panelCss, /\.iam-sound-console__nav \{[\s\S]*?top: var\(--brand-top[\s\S]*?width: clamp\(64px, 4\.35vw, 90px\)/);
assert.match(panelCss, /\.iam-sound-console__nav \{[\s\S]*?pointer-events: none;[\s\S]*?cursor: default/);
assert.match(panelCss, /\.iam-sound-console__nav img \{[\s\S]*?iam-sound-flower-spin 3s/);
assert.match(panelCss, /data-profile="sleep_delta_80_v1"[\s\S]*?rgba\(26, 146, 229, 0\.97\)/);
assert.match(panelCss, /data-profile="mindfulness_theta_80_v1"[\s\S]*?rgba\(245, 177, 22, 0\.97\)/);
assert.match(panelCss, /data-profile="calm_alpha_80_v1"[\s\S]*?rgba\(230, 45, 137, 0\.97\)/);
assert.match(panelCss, /data-profile="inspiration_gamma_80_v1"[\s\S]*?rgba\(56, 201, 55, 0\.97\)/);
assert.match(panelCss, /body\.iam-sound-panel-open\.nav-open \.global-nav \{[\s\S]*?z-index: 1500/);
assert.match(panelCss, /body\.iam-sound-panel-open\.research-details-open \.adaptive-television-research-dialog \{[\s\S]*?z-index: 1400/);
assert.match(panelCss, /body\.iam-sound-panel-open \.brand,[\s\S]*?body\.iam-sound-panel-open \.global-nav-trigger \{[\s\S]*?visibility: hidden !important/);
assert.equal(panelCss.includes("body.iam-sound-panel-open.research-details-open .adaptive-television-research-dialog__copy"), false);
assert.match(televisionCss, /\.adaptive-television-research-dialog__backdrop \{[\s\S]*?background: rgba\(0, 0, 0, 0\.84\)/);
assert.match(panelCss, /body:not\(\.television-is-fullscreen\) \.iam-sound-module--diamond \{[\s\S]*?--vesica-diameter: min\(30\.5vw,[\s\S]*?--vesica-offset: min\(10\.7833784139849vw/);
assert.match(panelCss, /\.iam-sound-console__close \{[\s\S]*?top: clamp\(7px, 1vh, 14px\)/);
assert.match(panelCss, /@media \(max-width: 900px\)/);
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
  panel: "locked_exact_vesica_interactive_sound_dashboard",
  portal_entry: "Sound button or ?sound=1 opens the full-screen dashboard; sound is armed by default subject to browser autoplay rules",
  interaction_mode: "master_power_primary_frequency_and_carrier_selection",
  quantum_tree_preserved: true,
  programme_audio_routed_through_synth: false,
  adaptive_default_requires_listener_start: true,
  source_sha256: sourceHash,
}, null, 2));

function sha12(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}
