import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADAPTIVE_SOUND_RENDERER_VERSION,
  DIAMOND_FREQUENCY_POWER_TOTAL,
  ENVELOPE_CANDIDATES,
  LEGACY_QUANTUM_TREE_PRESET,
  LOWPASS_CANDIDATES,
  NOMINAL_ISOCHRONIC_HZ,
  NOISE_CANDIDATES,
  NOISE_POWER_WEIGHT,
  PRINCIPAL_CARRIER_HZ,
  PROFILE_CANDIDATES,
  PROFILE_NOISE_DEFAULTS,
  SILENCE_POWER_WEIGHT,
  canonicalConditionJson,
  createCandidateCondition,
} from "../i  a m/adaptive-sound/profiles-v1.js";
import {
  AUTHORED_LOWPASS_HZ,
  AdaptiveSoundRendererV1,
  AuthoredLowPass,
  DeterministicNoiseSource,
  IsochronicEnvelope,
  LookaheadSafetyLimiter,
  OversampledColourCore,
  PhaseAccumulator,
  gainToDb,
  renderDualMono,
} from "../i  a m/adaptive-sound/dsp-v1.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IAM_DIR = path.join(ROOT, "i  a m");
const SAMPLE_RATES = [44100, 48000];
const TWO_PI = Math.PI * 2;
const results = [];
const EXPLICIT_TEST_NOISE = "white_noise_v1";

function candidateCondition(options = {}) {
  return createCandidateCondition({ noiseCandidateId: EXPLICIT_TEST_NOISE, ...options });
}

await check("locked nominal rates and principal carriers are exact", () => {
  assert.deepEqual(NOMINAL_ISOCHRONIC_HZ, { delta: 3.33, theta: 7.38, alpha: 10.11, gamma: 111 });
  assert.deepEqual(PRINCIPAL_CARRIER_HZ, [111, 222, 444, 555, 999]);
  assert.equal(NOMINAL_ISOCHRONIC_HZ.gamma, 111);
});

await check("legacy Quantum Tree preset remains a separate exact baseline", () => {
  assert.deepEqual(LEGACY_QUANTUM_TREE_PRESET, {
    status: "baseline_only",
    isochronic_hz: 7.38088,
    carrier_hz: 111.011,
    constant_tone_hz: 528.088,
    renderer: "pre_rendered_quantum_tree_aac",
  });
});

await check("locked profile allocation is exactly 80%, 6.66% x3, 0.01% noise and 0.01% silence", () => {
  assert.equal(DIAMOND_FREQUENCY_POWER_TOTAL, 0.9998);
  assert.equal(NOISE_POWER_WEIGHT, 0.0001);
  assert.equal(SILENCE_POWER_WEIGHT, 0.0001);
  for (const profileId of [
    "sleep_delta_80_v1",
    "mindfulness_theta_80_v1",
    "calm_alpha_80_v1",
    "inspiration_gamma_80_v1",
  ]) {
    const weights = Object.values(PROFILE_CANDIDATES[profileId].diamond_power_weights);
    assert.equal(weights.filter((weight) => weight === 0.8).length, 1);
    assert.equal(weights.filter((weight) => weight === 0.0666).length, 3);
    assert.equal((0.0666 * 100).toFixed(2), "6.66");
    assert.ok(Math.abs(weights.reduce((sum, weight) => sum + weight, 0) - 0.9998) < 1e-12);
    assert.ok(Math.abs(weights.reduce((sum, weight) => sum + weight, NOISE_POWER_WEIGHT + SILENCE_POWER_WEIGHT) - 1) < 1e-12);
  }
  assert.throws(() => createCandidateCondition(), /explicit white, pink or brown/i);
});

await check("profile noise defaults are Delta brown, Theta white, Alpha pink and Gamma equal split", () => {
  const expected = {
    sleep_delta_80_v1: { white_noise_v1: 0, pink_noise_v1: 0, brown_noise_v1: NOISE_POWER_WEIGHT },
    mindfulness_theta_80_v1: { white_noise_v1: NOISE_POWER_WEIGHT, pink_noise_v1: 0, brown_noise_v1: 0 },
    calm_alpha_80_v1: { white_noise_v1: 0, pink_noise_v1: NOISE_POWER_WEIGHT, brown_noise_v1: 0 },
    inspiration_gamma_80_v1: {
      white_noise_v1: NOISE_POWER_WEIGHT / 3,
      pink_noise_v1: NOISE_POWER_WEIGHT / 3,
      brown_noise_v1: NOISE_POWER_WEIGHT / 3,
    },
  };
  const metrics = [];
  for (const [profileId, expectedWeights] of Object.entries(expected)) {
    assert.deepEqual(PROFILE_NOISE_DEFAULTS[profileId].power_weights, expectedWeights);
    const condition = createCandidateCondition({ profileId });
    assert.equal(condition.noise_selection_authority, "ben_locked_profile_default");
    assert.deepEqual(condition.noise_power_weights, expectedWeights);
    assert.ok(Math.abs(Object.values(condition.noise_power_weights).reduce((sum, weight) => sum + weight, 0) - NOISE_POWER_WEIGHT) < 1e-15);
    const renderer = new AdaptiveSoundRendererV1(condition, 48000);
    const outputHash = hashFloat32(renderer.render(48000));
    const components = renderer.diagnostics().noise.components;
    assert.deepEqual(Object.keys(components).sort(), Object.keys(expectedWeights).filter((candidateId) => expectedWeights[candidateId] > 0).sort());
    metrics.push({ profile_id: profileId, selection_id: condition.noise_selection_id, noise_power_weights: condition.noise_power_weights, output_sha256: outputHash });
  }
  const gammaCondition = createCandidateCondition({ profileId: "inspiration_gamma_80_v1" });
  assert.equal(
    hashFloat32(new AdaptiveSoundRendererV1(gammaCondition, 48000).render(48000)),
    hashFloat32(new AdaptiveSoundRendererV1(gammaCondition, 48000).render(48000))
  );
  return { total_noise_power_weight: NOISE_POWER_WEIGHT, gamma_each_noise_power_weight: NOISE_POWER_WEIGHT / 3, metrics };
});

await check("laboratory schema carries no biological-response mapping", () => {
  const schemaText = JSON.stringify({
    NOMINAL_ISOCHRONIC_HZ,
    PRINCIPAL_CARRIER_HZ,
    PROFILE_CANDIDATES,
    ENVELOPE_CANDIDATES,
    LOWPASS_CANDIDATES,
    NOISE_CANDIDATES,
  });
  for (const forbidden of ["SLC6A4", "CD38", "DOCK2", "OXTR", "DRD2", "gene activated", "brain entrained"]) {
    assert.equal(schemaText.includes(forbidden), false, `renderer schema must not encode ${forbidden}`);
  }
});

await check("candidate condition is stable, versioned and single-carrier", () => {
  const first = candidateCondition({ profileId: "sleep_delta_80_v1", carrierHz: 111 });
  const second = candidateCondition({ profileId: "sleep_delta_80_v1", carrierHz: 111 });
  assert.equal(first.renderer_version, ADAPTIVE_SOUND_RENDERER_VERSION);
  assert.equal(first.carrier_mode, "single");
  assert.deepEqual(first.resolved_dsp_candidates.envelope, ENVELOPE_CANDIDATES[first.envelope_candidate_id]);
  assert.deepEqual(first.resolved_dsp_candidates.lowpass, LOWPASS_CANDIDATES[first.lowpass_candidate_id]);
  assert.deepEqual(first.resolved_dsp_candidates.noise, { [EXPLICIT_TEST_NOISE]: NOISE_CANDIDATES[EXPLICIT_TEST_NOISE] });
  assert.equal(first.noise_selection_id, `explicit_${EXPLICIT_TEST_NOISE}_override`);
  assert.equal(first.noise_selection_authority, "phase1_explicit_lab_override");
  assert.equal(first.noise_power_weights[EXPLICIT_TEST_NOISE], NOISE_POWER_WEIGHT);
  assert.equal(first.noise_power_weight, 0.0001);
  assert.equal(first.silence_power_weight, 0.0001);
  assert.equal(canonicalConditionJson(first), canonicalConditionJson(second));
  assert.equal(first.technical_output_gain_authority, "phase1_muted_render_only_not_product_ceiling");
});

await check("unsupported sample rate fails closed rather than moving 14,444 Hz", () => {
  assert.throws(
    () => new AdaptiveSoundRendererV1(candidateCondition(), 24000),
    /14,444 Hz|low-pass/
  );
});

await check("carrier generation is accurate at 44.1 and 48 kHz", () => {
  const metrics = [];
  for (const sampleRate of SAMPLE_RATES) {
    for (const frequencyHz of PRINCIPAL_CARRIER_HZ) {
      const estimate = estimateOscillatorFrequency(frequencyHz, sampleRate, 4);
      const errorHz = Math.abs(estimate - frequencyHz);
      assert.ok(errorHz < 0.001, `${frequencyHz} Hz error ${errorHz} at ${sampleRate}`);
      metrics.push({ sample_rate: sampleRate, target_hz: frequencyHz, estimated_hz: estimate, error_hz: errorHz });
    }
  }
  return { metrics };
});

await check("all four envelope rates are accurate, including Gamma at 111 Hz", () => {
  const candidate = ENVELOPE_CANDIDATES.raised_cosine_50_depth_80_v1;
  const metrics = [];
  for (const sampleRate of SAMPLE_RATES) {
    for (const [laneId, frequencyHz] of Object.entries(NOMINAL_ISOCHRONIC_HZ)) {
      const estimate = estimateEnvelopeFrequency(frequencyHz, sampleRate, candidate, 5);
      const errorHz = Math.abs(estimate - frequencyHz);
      assert.ok(errorHz < 0.002, `${laneId} ${frequencyHz} Hz error ${errorHz} at ${sampleRate}`);
      metrics.push({ lane_id: laneId, sample_rate: sampleRate, target_hz: frequencyHz, estimated_hz: estimate, error_hz: errorHz });
    }
  }
  return { metrics };
});

await check("white, pink and brown micro-noise candidates are explicit, deterministic and spectrally ordered", () => {
  const sampleRate = 48000;
  const warmupFrames = sampleRate;
  const fftSize = 65536;
  const metrics = [];
  for (const [candidateId, candidate] of Object.entries(NOISE_CANDIDATES)) {
    const firstSource = new DeterministicNoiseSource(sampleRate, candidate);
    const secondSource = new DeterministicNoiseSource(sampleRate, candidate);
    for (let index = 0; index < warmupFrames; index += 1) {
      assert.equal(firstSource.next(), secondSource.next());
    }
    const first = new Float64Array(fftSize);
    const second = new Float64Array(fftSize);
    for (let index = 0; index < fftSize; index += 1) {
      first[index] = firstSource.next();
      second[index] = secondSource.next();
    }
    assert.equal(hashFloat64(first), hashFloat64(second));
    assert.ok(first.every(Number.isFinite));
    const measuredRms = rms(first);
    const measuredPeak = peak(first);
    assert.ok(measuredRms >= 0.45 && measuredRms <= 1.5, `${candidateId} RMS ${measuredRms}`);
    assert.ok(measuredPeak <= 4 + 1e-12, `${candidateId} peak ${measuredPeak}`);
    const windowed = first.map((sample, index) => sample * hann(index, fftSize));
    const spectrum = fftPower(windowed);
    const lowBand = averageBandPower(spectrum, 187.5, 375, sampleRate);
    const highBand = averageBandPower(spectrum, 3000, 6000, sampleRate);
    const spectralTiltDb = 10 * Math.log10(highBand / Math.max(Number.EPSILON, lowBand));
    metrics.push({ candidate_id: candidateId, colour: candidate.colour, rms: measuredRms, peak: measuredPeak, spectral_tilt_db_high_minus_low: spectralTiltDb, output_sha256: hashFloat64(first) });
  }
  const byColour = Object.fromEntries(metrics.map((metric) => [metric.colour, metric]));
  assert.ok(Math.abs(byColour.white.spectral_tilt_db_high_minus_low) < 4);
  assert.ok(byColour.pink.spectral_tilt_db_high_minus_low < -3);
  assert.ok(byColour.pink.spectral_tilt_db_high_minus_low > -24);
  assert.ok(byColour.brown.spectral_tilt_db_high_minus_low < byColour.pink.spectral_tilt_db_high_minus_low - 4);
  assert.ok(byColour.brown.spectral_tilt_db_high_minus_low > -60);
  assert.equal(new Set(metrics.map((metric) => metric.output_sha256)).size, 3);
  return { allocation_power_weight: NOISE_POWER_WEIGHT, selection_status: "algorithms_verified_profile_defaults_tested_separately", metrics };
});

await check("111 Hz carrier and 111 Hz Gamma remain two simultaneous signal roles", () => {
  const sampleRate = 48000;
  const frames = sampleRate * 4;
  const carrier = new PhaseAccumulator(111, sampleRate, 0);
  const gamma = new IsochronicEnvelope({
    frequencyHz: 111,
    sampleRate,
    candidate: ENVELOPE_CANDIDATES.raised_cosine_50_depth_80_v1,
    initialPhaseCycles: 0,
  });
  const signal = new Float64Array(frames);
  for (let index = 0; index < frames; index += 1) signal[index] = carrier.nextSine() * gamma.next();
  const carrierComponent = projectionAmplitude(signal, 111, sampleRate);
  const modulationSideband = projectionAmplitude(signal, 222, sampleRate);
  assert.ok(carrierComponent > 0.05, `111 Hz component is missing (${carrierComponent})`);
  assert.ok(modulationSideband > 0.01, `111/111 modulation sideband is missing (${modulationSideband})`);
  return { carrier_component: carrierComponent, upper_sideband_222_hz: modulationSideband };
});

await check("14,444 Hz low-pass candidates hit their recorded -3 dB definition", () => {
  const metrics = [];
  for (const sampleRate of SAMPLE_RATES) {
    for (const [candidateId, candidate] of Object.entries(LOWPASS_CANDIDATES)) {
      const filter = new AuthoredLowPass(sampleRate, candidate);
      const responseDb = gainToDb(filter.responseAt(AUTHORED_LOWPASS_HZ));
      assert.ok(Math.abs(responseDb + 3.01029995664) < 0.001, `${candidateId} is ${responseDb} dB at 14,444 Hz`);
      assert.equal(candidate.phase, "minimum_phase");
      assert.equal(candidate.resonant_peak, false);
      metrics.push({
        candidate_id: candidateId,
        sample_rate: sampleRate,
        target_hz: AUTHORED_LOWPASS_HZ,
        response_db: responseDb,
        design_frequency_hz: filter.designFrequencyHz,
      });
    }
  }
  return { metrics };
});

await check("custom 4x colour core is deterministic, finite and harmonically active", () => {
  const sampleRate = 48000;
  const frames = sampleRate * 3;
  const first = renderColourProbe(sampleRate, frames, 111);
  const second = renderColourProbe(sampleRate, frames, 111);
  assert.equal(hashFloat64(first), hashFloat64(second));
  assert.ok(first.every(Number.isFinite));
  const settled = first.subarray(sampleRate);
  const fundamental = projectionAmplitude(settled, 111, sampleRate);
  const secondHarmonic = projectionAmplitude(settled, 222, sampleRate);
  const thirdHarmonic = projectionAmplitude(settled, 333, sampleRate);
  const harmonicRatio = Math.hypot(secondHarmonic, thirdHarmonic) / fundamental;
  assert.ok(fundamental > 0.05);
  assert.ok(secondHarmonic > 1e-5, `second harmonic too low (${secondHarmonic})`);
  assert.ok(thirdHarmonic > 1e-5, `third harmonic too low (${thirdHarmonic})`);
  assert.ok(harmonicRatio >= 0.002 && harmonicRatio <= 0.04, `harmonic ratio ${harmonicRatio} is outside the restrained colour range`);
  return { fundamental, second_harmonic: secondHarmonic, third_harmonic: thirdHarmonic, harmonic_ratio: harmonicRatio };
});

await check("oversampled mastered path keeps near-Nyquist alias-band energy conservative", () => {
  const sampleRate = 48000;
  const fftSize = 65536;
  const core = new OversampledColourCore(sampleRate);
  const oscillator = new PhaseAccumulator(999, sampleRate, 0);
  for (let index = 0; index < sampleRate; index += 1) core.process(oscillator.nextSine() * 0.35);
  const signal = new Float64Array(fftSize);
  for (let index = 0; index < fftSize; index += 1) signal[index] = core.process(oscillator.nextSine() * 0.35) * hann(index, fftSize);
  const spectrum = fftPower(signal);
  const total = sumBand(spectrum, 0, sampleRate / 2, sampleRate);
  const aliasBand = sumBand(spectrum, 18000, sampleRate / 2, sampleRate);
  const ratio = aliasBand / Math.max(Number.EPSILON, total);
  assert.ok(ratio < 1e-4, `near-Nyquist energy ratio is ${ratio}`);
  return { alias_band_start_hz: 18000, alias_to_total_energy_ratio: ratio };
});

await check("parallel branches declare and retain zero differential latency", () => {
  const renderer = new AdaptiveSoundRendererV1(candidateCondition(), 48000);
  renderer.render(48000);
  const diagnostics = renderer.diagnostics();
  assert.equal(diagnostics.mastering.compression.differential_latency_samples, 0);
  assert.equal(diagnostics.mastering.latency_samples, 0);
  return { mastering: diagnostics.mastering };
});

await check("compressor candidates remain within the Phase 1 calibration ranges", () => {
  const metrics = [];
  for (const carrierHz of PRINCIPAL_CARRIER_HZ) {
    const renderer = new AdaptiveSoundRendererV1(candidateCondition({ carrierHz }), 48000);
    renderer.render(48000 * 2);
    const compression = renderer.diagnostics().mastering.compression;
    assert.ok(compression.main_gain_reduction_db >= 0.5 && compression.main_gain_reduction_db <= 3,
      `${carrierHz} Hz main gain reduction ${compression.main_gain_reduction_db} dB`);
    assert.ok(compression.parallel_gain_reduction_db >= 4 && compression.parallel_gain_reduction_db <= 12,
      `${carrierHz} Hz parallel gain reduction ${compression.parallel_gain_reduction_db} dB`);
    metrics.push({ carrier_hz: carrierHz, ...compression });
  }
  return { metrics };
});

await check("mastering ON and engineering clean reference have matched sample latency", () => {
  const on = new AdaptiveSoundRendererV1(candidateCondition({ masteringCondition: "engineering_on" }), 48000);
  const off = new AdaptiveSoundRendererV1(candidateCondition({ masteringCondition: "engineering_clean_reference" }), 48000);
  assert.equal(on.diagnostics().mastering.latency_samples, off.diagnostics().mastering.latency_samples);
  assert.equal(on.diagnostics().limiter.latency_samples, off.diagnostics().limiter.latency_samples);
  assert.notEqual(hashFloat32(on.render(48000)), hashFloat32(off.render(48000)));
});

await check("invariant safety limiter contains worst-case aligned input", () => {
  const limiter = new LookaheadSafetyLimiter(48000, { ceiling: 0.85 });
  let peak = 0;
  for (let index = 0; index < 24000; index += 1) {
    const input = index % 97 === 0 ? (index % 194 === 0 ? 4 : -4) : Math.sin(index * 0.13) * 1.4;
    peak = Math.max(peak, Math.abs(limiter.process(input)));
  }
  assert.ok(peak <= 0.8500000001, `limiter emitted ${peak}`);
  assert.ok(limiter.diagnostics().activation_samples > 0);
  return { measured_peak: peak, limiter: limiter.diagnostics() };
});

await check("renderer is sample-deterministic for identical condition and sample rate", () => {
  const condition = candidateCondition({ profileId: "sleep_delta_80_v1", carrierHz: 111 });
  const first = new AdaptiveSoundRendererV1(condition, 48000).render(96000);
  const second = new AdaptiveSoundRendererV1(condition, 48000).render(96000);
  assert.equal(hashFloat32(first), hashFloat32(second));
  return { output_sha256: hashFloat32(first) };
});

await check("lane-off becomes quieter and never renormalises remaining lanes upward", () => {
  const condition = candidateCondition({ profileId: "balanced_24_995_v1", carrierHz: 222 });
  const allRenderer = new AdaptiveSoundRendererV1(condition, 48000);
  const reducedRenderer = new AdaptiveSoundRendererV1(condition, 48000);
  reducedRenderer.setLaneEnabled("gamma", false);
  const all = allRenderer.render(48000 * 4);
  const reduced = reducedRenderer.render(48000 * 4);
  const allRms = rms(all.subarray(48000));
  const reducedRms = rms(reduced.subarray(48000));
  assert.ok(reducedRms < allRms, `${reducedRms} should be below ${allRms}`);
  return { all_lanes_rms: allRms, gamma_disabled_rms: reducedRms };
});

await check("power-domain morph stays normalised and under the invariant ceiling", () => {
  const condition = candidateCondition({ profileId: "sleep_delta_80_v1", carrierHz: 555 });
  const renderer = new AdaptiveSoundRendererV1(condition, 48000);
  renderer.setPowerWeights(PROFILE_CANDIDATES.inspiration_gamma_80_v1.diamond_power_weights, 0.5);
  const output = renderer.render(48000);
  assert.ok(peak(output) <= condition.limiter_ceiling + 1e-9);
  const finalWeights = Object.values(renderer.diagnostics().lanes).map((lane) => lane.power_weight);
  assert.ok(Math.abs(finalWeights.reduce((sum, value) => sum + value, 0) - DIAMOND_FREQUENCY_POWER_TOTAL) < 1e-12);
});

await check("dual-mono renderer produces sample-identical left and right", () => {
  const condition = candidateCondition({ profileId: "calm_alpha_80_v1", carrierHz: 999 });
  const rendered = renderDualMono(condition, 44100, 44100);
  assert.equal(rendered.left.length, rendered.right.length);
  assert.equal(hashFloat32(rendered.left), hashFloat32(rendered.right));
  for (let index = 0; index < rendered.left.length; index += 1) assert.equal(rendered.left[index], rendered.right[index]);
});

await check("AudioWorklet adapter renders identical dual mono and fades master off", async () => {
  const posted = [];
  let RegisteredProcessor = null;
  globalThis.sampleRate = 48000;
  globalThis.AudioWorkletProcessor = class {
    constructor() {
      this.port = { postMessage: (message) => posted.push(message), onmessage: null };
    }
  };
  globalThis.registerProcessor = (name, processorClass) => {
    assert.equal(name, "iam-adaptive-sound-v1");
    RegisteredProcessor = processorClass;
  };
  try {
    await import(`../i  a m/adaptive-sound/worklet-v1.js?objective-test=${Date.now()}`);
    assert.ok(RegisteredProcessor);
    const processor = new RegisteredProcessor({ processorOptions: { condition: candidateCondition() } });
    const output = [[new Float32Array(128), new Float32Array(128)]];
    assert.equal(processor.process([], output), true);
    assert.equal(hashFloat32(output[0][0]), hashFloat32(output[0][1]));
    for (let index = 0; index < 96; index += 1) processor.process([], output);
    assert.ok(posted.some((message) => message.type === "diagnostics"
      && message.meter?.frame_count > 0
      && message.meter?.output_peak >= 0));
    processor.handleMessage({ type: "set_master_enabled", enabled: false });
    for (let index = 0; index < 8; index += 1) processor.process([], output);
    assert.ok(output[0][0].every((sample) => sample === 0));
    assert.ok(posted.some((message) => message.type === "ready"));
  } finally {
    delete globalThis.sampleRate;
    delete globalThis.AudioWorkletProcessor;
    delete globalThis.registerProcessor;
  }
});

await check("AudioWorklet adapter fails closed for an invalid condition", async () => {
  const posted = [];
  let RegisteredProcessor = null;
  globalThis.sampleRate = 48000;
  globalThis.AudioWorkletProcessor = class {
    constructor() {
      this.port = { postMessage: (message) => posted.push(message), onmessage: null };
    }
  };
  globalThis.registerProcessor = (_name, processorClass) => { RegisteredProcessor = processorClass; };
  try {
    await import(`../i  a m/adaptive-sound/worklet-v1.js?fail-closed-test=${Date.now()}`);
    const processor = new RegisteredProcessor({ processorOptions: { condition: { invalid: true } } });
    const output = [[new Float32Array(128), new Float32Array(128)]];
    output[0][0].fill(1);
    output[0][1].fill(1);
    assert.equal(processor.process([], output), true);
    assert.ok(output[0][0].every((sample) => sample === 0));
    assert.ok(output[0][1].every((sample) => sample === 0));
    assert.ok(posted.some((message) => message.type === "fatal_error"
      && message.fail_safe === "adaptive_synth_off_quantum_tree_and_programme_unchanged"));
  } finally {
    delete globalThis.sampleRate;
    delete globalThis.AudioWorkletProcessor;
    delete globalThis.registerProcessor;
  }
});

await check("desktop objective renderer sustains faster than real time", () => {
  const audioSeconds = 10;
  const renderer = new AdaptiveSoundRendererV1(candidateCondition({ carrierHz: 999 }), 48000);
  const started = performance.now();
  renderer.render(48000 * audioSeconds);
  const elapsedSeconds = (performance.now() - started) / 1000;
  const realtimeFactor = audioSeconds / elapsedSeconds;
  assert.ok(realtimeFactor > 1, `renderer achieved only ${realtimeFactor}x real time`);
  return { rendered_audio_seconds: audioSeconds, elapsed_seconds: elapsedSeconds, realtime_factor: realtimeFactor };
});

await check("portal integration preserves the existing Quantum Tree controller, preference and asset", async () => {
  const televisionController = await fs.readFile(path.join(IAM_DIR, "adaptive-environment-television.js"), "utf8");
  const adaptiveController = await fs.readFile(path.join(IAM_DIR, "adaptive-sound", "controller-v1.js"), "utf8");
  const page = await fs.readFile(path.join(IAM_DIR, "index.html"), "utf8");
  const ownerController = await fs.readFile(path.join(IAM_DIR, "quantum-tree-control.html"), "utf8");
  const ownerApi = await fs.readFile(path.join(IAM_DIR, "api", "quantum-tree-settings.php"), "utf8");
  const quantumTreeAsset = await fs.readFile(path.join(IAM_DIR, "a s s e t s", "q u a n t u m [ t r e e ].m4a"));
  assert.ok(televisionController.includes('localStorage.getItem("iamSoundResearchLayer") !== "off"'));
  assert.ok(televisionController.includes('const SOUND_RESEARCH_DEFAULT_MAX_VOLUME = 0.055;'));
  assert.ok(televisionController.includes('const SOUND_RESEARCH_AUDIO_SRC = "a s s e t s/q u a n t u m [ t r e e ].m4a";'));
  assert.ok(televisionController.includes('window.dispatchEvent(new CustomEvent("iam:adaptive-sound-open"))'));
  assert.ok(ownerController.includes("data-owner-login"));
  assert.ok(ownerApi.includes("const QUANTUM_TREE_DEFAULT_PEAK = 0.055;"));
  assert.ok(ownerApi.includes("require_same_origin();"));
  assert.ok(ownerApi.includes("hash_equals($_SESSION['quantum_tree_csrf'], $csrf)"));
  assert.ok(page.includes('type="module" src="adaptive-sound/controller-v1.js'));
  assert.equal(page.includes("adaptive-sound/worklet-v1.js"), false, "The page must load the worklet only through its controller");
  assert.ok(adaptiveController.includes("new AudioWorkletNode(context, PROCESSOR_NAME"));
  assert.ok(adaptiveController.includes("window.IAMQuantumTree?.setEnabled?.(state.masterEnabled)"));
  assert.ok(adaptiveController.includes('output_layout: "mono_source_identical_dual_mono"'));
  assert.ok(quantumTreeAsset.length > 900000 && quantumTreeAsset.length < 1200000);
  return {
    quantum_tree_asset_bytes: quantumTreeAsset.length,
    quantum_tree_asset_sha256: createHash("sha256").update(quantumTreeAsset).digest("hex"),
    portal_integration: true,
    quantum_tree_separate_from_adaptive_mastering: true,
  };
});

const failed = results.filter((result) => result.status !== "passed");
const report = {
  report_version: "iam_adaptive_sound_phase1_objective_report_v1",
  created_at: new Date().toISOString(),
  authority: "objective_dsp_verification_only_no_subjective_or_biological_inference",
  renderer_source_sha256: await rendererSourceHash(),
  passed: failed.length === 0,
  checks: results,
};

const reportPath = process.argv.includes("--report")
  ? process.argv[process.argv.indexOf("--report") + 1]
  : "";
if (reportPath) await fs.writeFile(path.resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`);

if (failed.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    passed: true,
    checks: results.length,
    renderer_version: ADAPTIVE_SOUND_RENDERER_VERSION,
    authority: report.authority,
    report: reportPath ? path.resolve(reportPath) : null,
  }, null, 2));
}

async function check(name, operation) {
  const started = performance.now();
  try {
    const details = await operation();
    results.push({ name, status: "passed", duration_ms: performance.now() - started, ...(details || {}) });
  } catch (error) {
    results.push({ name, status: "failed", duration_ms: performance.now() - started, error: String(error?.stack || error) });
  }
}

function estimateOscillatorFrequency(frequencyHz, sampleRate, seconds) {
  const oscillator = new PhaseAccumulator(frequencyHz, sampleRate, 0.137);
  const crossings = [];
  let previous = oscillator.nextSine();
  const frames = Math.round(sampleRate * seconds);
  for (let index = 1; index < frames; index += 1) {
    const current = oscillator.nextSine();
    if (previous <= 0 && current > 0) {
      const fraction = -previous / Math.max(Number.EPSILON, current - previous);
      crossings.push(index - 1 + fraction);
    }
    previous = current;
  }
  return sampleRate * (crossings.length - 1) / (crossings.at(-1) - crossings[0]);
}

function estimateEnvelopeFrequency(frequencyHz, sampleRate, candidate, seconds) {
  const envelope = new IsochronicEnvelope({ frequencyHz, sampleRate, candidate, initialPhaseCycles: 0.173 });
  const peaks = [];
  let previousPrevious = envelope.next();
  let previous = envelope.next();
  const frames = Math.round(sampleRate * seconds);
  for (let index = 2; index < frames; index += 1) {
    const current = envelope.next();
    if (previous > previousPrevious && previous >= current && previous > candidate.maximum_gain - 1e-4) peaks.push(index - 1);
    previousPrevious = previous;
    previous = current;
  }
  assert.ok(peaks.length >= 2, `insufficient envelope peaks for ${frequencyHz} Hz`);
  return sampleRate * (peaks.length - 1) / (peaks.at(-1) - peaks[0]);
}

function renderColourProbe(sampleRate, frames, frequencyHz) {
  const oscillator = new PhaseAccumulator(frequencyHz, sampleRate, 0);
  const colour = new OversampledColourCore(sampleRate);
  const output = new Float64Array(frames);
  for (let index = 0; index < frames; index += 1) output[index] = colour.process(oscillator.nextSine() * 0.35);
  return output;
}

function projectionAmplitude(signal, frequencyHz, sampleRate) {
  let real = 0;
  let imaginary = 0;
  for (let index = 0; index < signal.length; index += 1) {
    const phase = TWO_PI * frequencyHz * index / sampleRate;
    real += signal[index] * Math.cos(phase);
    imaginary -= signal[index] * Math.sin(phase);
  }
  return 2 * Math.hypot(real, imaginary) / signal.length;
}

function fftPower(signal) {
  const length = signal.length;
  assert.equal(length & (length - 1), 0, "FFT length must be a power of two");
  const real = Float64Array.from(signal);
  const imaginary = new Float64Array(length);
  for (let index = 1, reversed = 0; index < length; index += 1) {
    let bit = length >> 1;
    for (; reversed & bit; bit >>= 1) reversed ^= bit;
    reversed ^= bit;
    if (index < reversed) {
      [real[index], real[reversed]] = [real[reversed], real[index]];
    }
  }
  for (let size = 2; size <= length; size <<= 1) {
    const angle = -TWO_PI / size;
    const stepReal = Math.cos(angle);
    const stepImaginary = Math.sin(angle);
    for (let offset = 0; offset < length; offset += size) {
      let twiddleReal = 1;
      let twiddleImaginary = 0;
      for (let index = 0; index < size / 2; index += 1) {
        const even = offset + index;
        const odd = even + size / 2;
        const oddReal = real[odd] * twiddleReal - imaginary[odd] * twiddleImaginary;
        const oddImaginary = real[odd] * twiddleImaginary + imaginary[odd] * twiddleReal;
        const evenReal = real[even];
        const evenImaginary = imaginary[even];
        real[even] = evenReal + oddReal;
        imaginary[even] = evenImaginary + oddImaginary;
        real[odd] = evenReal - oddReal;
        imaginary[odd] = evenImaginary - oddImaginary;
        const nextReal = twiddleReal * stepReal - twiddleImaginary * stepImaginary;
        twiddleImaginary = twiddleReal * stepImaginary + twiddleImaginary * stepReal;
        twiddleReal = nextReal;
      }
    }
  }
  const power = new Float64Array(length / 2 + 1);
  for (let index = 0; index < power.length; index += 1) power[index] = real[index] ** 2 + imaginary[index] ** 2;
  return power;
}

function sumBand(spectrum, fromHz, toHz, sampleRate) {
  const fftSize = (spectrum.length - 1) * 2;
  const start = Math.max(0, Math.ceil(fromHz * fftSize / sampleRate));
  const end = Math.min(spectrum.length, Math.floor(toHz * fftSize / sampleRate) + 1);
  let total = 0;
  for (let index = start; index < end; index += 1) total += spectrum[index];
  return total;
}

function averageBandPower(spectrum, fromHz, toHz, sampleRate) {
  const fftSize = (spectrum.length - 1) * 2;
  const start = Math.max(0, Math.ceil(fromHz * fftSize / sampleRate));
  const end = Math.min(spectrum.length, Math.floor(toHz * fftSize / sampleRate) + 1);
  return sumBand(spectrum, fromHz, toHz, sampleRate) / Math.max(1, end - start);
}

function rms(signal) {
  let sum = 0;
  for (const sample of signal) sum += sample * sample;
  return Math.sqrt(sum / Math.max(1, signal.length));
}

function peak(signal) {
  let maximum = 0;
  for (const sample of signal) maximum = Math.max(maximum, Math.abs(sample));
  return maximum;
}

function hashFloat32(values) {
  return createHash("sha256").update(Buffer.from(values.buffer, values.byteOffset, values.byteLength)).digest("hex");
}

function hashFloat64(values) {
  return createHash("sha256").update(Buffer.from(values.buffer, values.byteOffset, values.byteLength)).digest("hex");
}

async function rendererSourceHash() {
  const hash = createHash("sha256");
  for (const relativePath of [
    "i  a m/adaptive-sound/profiles-v1.js",
    "i  a m/adaptive-sound/dsp-v1.js",
    "i  a m/adaptive-sound/worklet-v1.js",
  ]) {
    hash.update(await fs.readFile(path.join(ROOT, relativePath)));
  }
  return hash.digest("hex");
}

function hann(index, length) {
  return 0.5 - 0.5 * Math.cos(TWO_PI * index / (length - 1));
}
