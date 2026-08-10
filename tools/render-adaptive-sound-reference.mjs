import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  DIAMOND_FREQUENCY_POWER_TOTAL,
  ENVELOPE_CANDIDATES,
  LOWPASS_CANDIDATES,
  NOISE_CANDIDATES,
  NOISE_POWER_WEIGHT,
  PRINCIPAL_CARRIER_HZ,
  PROFILE_CANDIDATES,
  PROFILE_NOISE_DEFAULTS,
  SILENCE_POWER_WEIGHT,
  canonicalConditionJson,
  createCandidateCondition,
} from "../i  a m/adaptive-sound/profiles-v1.js";
import { renderDualMono } from "../i  a m/adaptive-sound/dsp-v1.js";

const argumentsMap = parseArguments(process.argv.slice(2));
const outputDirectory = path.resolve(
  argumentsMap["output-dir"]
    || path.join(os.tmpdir(), `iam-adaptive-sound-phase1-${Date.now()}`)
);
const sampleRate = positiveInteger(argumentsMap["sample-rate"] || 48000, "sample rate");
const durationSeconds = positiveNumber(argumentsMap.duration || 4, "duration");
const profileId = String(argumentsMap.profile || "");
const envelopeCandidateId = argumentsMap.envelope || "raised_cosine_50_depth_80_v1";
const lowpassCandidateId = argumentsMap.lowpass || "butterworth_12db_minimum_phase_v1";
const matrix = Boolean(argumentsMap.matrix);
const noiseMatrix = Boolean(argumentsMap["noise-matrix"]);
const requestedNoiseCandidateId = String(argumentsMap.noise || "");
const rendererSourceHash = await hashRendererSources();

if (!PROFILE_CANDIDATES[profileId]) {
  throw new Error("Select an explicit --profile; no Phase 1 profile is a product default");
}
if (!ENVELOPE_CANDIDATES[envelopeCandidateId]) throw new Error(`Unknown envelope candidate: ${envelopeCandidateId}`);
if (!LOWPASS_CANDIDATES[lowpassCandidateId]) throw new Error(`Unknown low-pass candidate: ${lowpassCandidateId}`);
if (!noiseMatrix && requestedNoiseCandidateId && !NOISE_CANDIDATES[requestedNoiseCandidateId]) {
  throw new Error("Explicit --noise must be white_noise_v1, pink_noise_v1 or brown_noise_v1");
}
if (!noiseMatrix && !requestedNoiseCandidateId && !PROFILE_NOISE_DEFAULTS[profileId]) {
  throw new Error(`Profile ${profileId} has no approved noise default; select an explicit --noise candidate`);
}

const requestedNoiseSelections = noiseMatrix
  ? Object.keys(NOISE_CANDIDATES)
  : [requestedNoiseCandidateId || null];

const requestedCarrier = Number(argumentsMap.carrier || 111);
const requestedMastering = argumentsMap.mastering || "engineering_on";
const baseConditions = matrix
  ? PRINCIPAL_CARRIER_HZ.flatMap((carrierHz) => ["engineering_on", "engineering_clean_reference"].map((masteringCondition) => ({ carrierHz, masteringCondition })))
  : [{ carrierHz: requestedCarrier, masteringCondition: requestedMastering }];
const conditions = requestedNoiseSelections.flatMap((noiseCandidateId) => baseConditions.map((condition) => ({
  ...condition,
  noiseCandidateId,
})));

await fs.mkdir(outputDirectory, { recursive: true });
const report = {
  report_version: "iam_adaptive_sound_phase1_render_report_v1",
  created_at: new Date().toISOString(),
  authority: "muted_technical_render_only_not_product_release_or_safety_calibration",
  sample_rate: sampleRate,
  duration_seconds: durationSeconds,
  output_layout: "identical_dual_mono_float32_wav",
  allocation: {
    profile_id: profileId,
    diamond_frequency_power_weights: PROFILE_CANDIDATES[profileId].diamond_power_weights,
    diamond_frequency_total: DIAMOND_FREQUENCY_POWER_TOTAL,
    noise_power_weight: NOISE_POWER_WEIGHT,
    silence_power_weight: SILENCE_POWER_WEIGHT,
    total: 1,
  },
  noise_selection_status: noiseMatrix
    ? "explicit_phase1_colour_override_matrix"
    : (requestedNoiseCandidateId ? "explicit_phase1_colour_override" : "ben_locked_profile_default"),
  noise_selections_requested: requestedNoiseSelections.map((selection) => selection || "profile_default"),
  renderer_source_sha256: rendererSourceHash,
  study_ready: false,
  outstanding_phase2_requirement: "latency_and_loudness_matched_mastering_on_off_condition",
  output_directory: outputDirectory,
  conditions: [],
  engineering_comparisons: [],
};

for (const request of conditions) {
  const condition = createCandidateCondition({
    profileId,
    carrierHz: request.carrierHz,
    envelopeCandidateId,
    lowpassCandidateId,
    noiseCandidateId: request.noiseCandidateId,
    masteringCondition: request.masteringCondition,
  });
  const conditionJson = canonicalConditionJson(condition);
  const conditionHash = createHash("sha256").update(conditionJson).digest("hex");
  const frameCount = Math.round(durationSeconds * sampleRate);
  const rendered = renderDualMono(condition, sampleRate, frameCount);
  const stem = [
    profileId,
    `${request.carrierHz}hz`,
    request.masteringCondition === "engineering_on" ? "mastering-on" : "clean-reference",
    condition.noise_selection_id,
    conditionHash.slice(0, 12),
  ].join("--");
  const wavPath = path.join(outputDirectory, `${stem}.wav`);
  const manifestPath = path.join(outputDirectory, `${stem}.json`);
  const wav = encodeFloat32StereoWav(rendered.left, rendered.right, sampleRate);
  await fs.writeFile(wavPath, wav);
  const wavHash = createHash("sha256").update(wav).digest("hex");
  const conditionManifest = {
    condition_hash_sha256: conditionHash,
    renderer_source_sha256: rendererSourceHash,
    wav_hash_sha256: wavHash,
    condition,
    diagnostics: rendered.diagnostics,
    technical_render: {
      duration_seconds: durationSeconds,
      frame_count: frameCount,
      sample_rate: sampleRate,
      channels: 2,
      channel_relationship: "sample_identical",
      encoding: "IEEE_FLOAT_32_LE",
      file: path.basename(wavPath),
    },
  };
  await fs.writeFile(manifestPath, `${JSON.stringify(conditionManifest, null, 2)}\n`);
  report.conditions.push({
    condition_hash_sha256: conditionHash,
    wav_hash_sha256: wavHash,
    carrier_hz: request.carrierHz,
    noise_selection_id: condition.noise_selection_id,
    noise_selection_authority: condition.noise_selection_authority,
    noise_power_weights: condition.noise_power_weights,
    mastering_condition: request.masteringCondition,
    output_peak: rendered.diagnostics.output_peak,
    output_rms: rendered.diagnostics.output_rms,
    limiter_activation_samples: rendered.diagnostics.limiter.activation_samples,
    lowpass_applied: rendered.diagnostics.mastering.lowpass_applied,
    lowpass_response_at_target_db: rendered.diagnostics.mastering.lowpass_response_at_target_db,
    wav_file: path.basename(wavPath),
    manifest_file: path.basename(manifestPath),
  });
}

const renderedNoiseSelectionIds = [...new Set(report.conditions.map((entry) => entry.noise_selection_id))];
for (const noiseSelectionId of renderedNoiseSelectionIds) {
  for (const carrierHz of PRINCIPAL_CARRIER_HZ) {
    const mastered = report.conditions.find((entry) => entry.noise_selection_id === noiseSelectionId
      && entry.carrier_hz === carrierHz
      && entry.mastering_condition === "engineering_on");
    const clean = report.conditions.find((entry) => entry.noise_selection_id === noiseSelectionId
      && entry.carrier_hz === carrierHz
      && entry.mastering_condition === "engineering_clean_reference");
    if (!mastered || !clean) continue;
    report.engineering_comparisons.push({
      carrier_hz: carrierHz,
      noise_selection_id: noiseSelectionId,
      rms_difference_db_mastering_on_minus_clean: 20 * Math.log10(mastered.output_rms / clean.output_rms),
      peak_difference_db_mastering_on_minus_clean: 20 * Math.log10(mastered.output_peak / clean.output_peak),
      interpretation: "unmatched_phase1_engineering_reference_not_a_study_condition",
    });
  }
}

const reportPath = path.join(outputDirectory, "render-report.json");
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  output_directory: outputDirectory,
  report: reportPath,
  rendered_conditions: report.conditions.length,
  authority: report.authority,
}, null, 2));

function encodeFloat32StereoWav(left, right, wavSampleRate) {
  if (left.length !== right.length) throw new Error("Dual-mono channel lengths differ");
  const channels = 2;
  const bytesPerSample = 4;
  const dataBytes = left.length * channels * bytesPerSample;
  const buffer = Buffer.allocUnsafe(44 + dataBytes);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(3, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(wavSampleRate, 24);
  buffer.writeUInt32LE(wavSampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataBytes, 40);
  let offset = 44;
  for (let index = 0; index < left.length; index += 1) {
    buffer.writeFloatLE(left[index], offset);
    buffer.writeFloatLE(right[index], offset + bytesPerSample);
    offset += channels * bytesPerSample;
  }
  return buffer;
}

function parseArguments(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("--")) throw new Error(`Unexpected argument: ${argument}`);
    const key = argument.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) values[key] = true;
    else {
      values[key] = next;
      index += 1;
    }
  }
  return values;
}

function positiveInteger(value, label) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) throw new Error(`${label} must be a positive integer`);
  return numeric;
}

function positiveNumber(value, label) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) throw new Error(`${label} must be positive`);
  return numeric;
}

async function hashRendererSources() {
  const hash = createHash("sha256");
  for (const source of [
    new URL("../i  a m/adaptive-sound/profiles-v1.js", import.meta.url),
    new URL("../i  a m/adaptive-sound/dsp-v1.js", import.meta.url),
    new URL("../i  a m/adaptive-sound/worklet-v1.js", import.meta.url),
  ]) {
    hash.update(await fs.readFile(source));
  }
  return hash.digest("hex");
}
