const LANE_IDS = Object.freeze(["delta", "theta", "alpha", "gamma"]);

export const ADAPTIVE_SOUND_SCHEMA_VERSION = "iam_adaptive_sound_lab_v1";
export const ADAPTIVE_SOUND_RENDERER_VERSION = "iam_adaptive_sound_renderer_v1_phase1";

export const NOMINAL_ISOCHRONIC_HZ = Object.freeze({
  delta: 3.33,
  theta: 7.38,
  alpha: 10.11,
  gamma: 111,
});

export const PRINCIPAL_CARRIER_HZ = Object.freeze([111, 222, 444, 555, 999]);

// Ben-locked allocation, 2026-08-10. The four frequency lanes remain the
// diamond; noise and silence are explicit micro-allocations that complete the
// profile budget without being presented as extra diamond points.
export const DIAMOND_FREQUENCY_POWER_TOTAL = 0.9998;
export const NOISE_POWER_WEIGHT = 0.0001;
export const SILENCE_POWER_WEIGHT = 0.0001;

// Provenance only. This is the existing pre-rendered Quantum Tree description,
// not a profile for the new renderer and not a source of rounded values.
export const LEGACY_QUANTUM_TREE_PRESET = Object.freeze({
  status: "baseline_only",
  isochronic_hz: 7.38088,
  carrier_hz: 111.011,
  constant_tone_hz: 528.088,
  renderer: "pre_rendered_quantum_tree_aac",
});

// Phase 1 laboratory candidates. None of these IDs is a public product default.
export const ENVELOPE_CANDIDATES = deepFreeze({
  raised_cosine_50_depth_80_v1: {
    status: "phase1_candidate",
    shape: "raised_cosine",
    duty_cycle: 0.5,
    minimum_gain: 0.2,
    maximum_gain: 1,
    edge_fraction: 0.5,
  },
  tukey_50_depth_80_v1: {
    status: "phase1_candidate",
    shape: "tukey",
    duty_cycle: 0.5,
    minimum_gain: 0.2,
    maximum_gain: 1,
    edge_fraction: 0.32,
  },
  tukey_35_depth_85_v1: {
    status: "phase1_candidate",
    shape: "tukey",
    duty_cycle: 0.35,
    minimum_gain: 0.15,
    maximum_gain: 1,
    edge_fraction: 0.4,
  },
});

export const LOWPASS_CANDIDATES = deepFreeze({
  butterworth_12db_minimum_phase_v1: {
    status: "phase1_candidate",
    topology: "biquad_lowpass",
    order: 2,
    q: Math.SQRT1_2,
    target_cutoff_hz: 14444,
    cutoff_definition: "minus_3_db",
    resonant_peak: false,
    phase: "minimum_phase",
  },
  bessel_damped_12db_minimum_phase_v1: {
    status: "phase1_candidate",
    topology: "biquad_lowpass",
    order: 2,
    q: 1 / Math.sqrt(3),
    target_cutoff_hz: 14444,
    cutoff_definition: "minus_3_db",
    resonant_peak: false,
    phase: "minimum_phase",
  },
});

export const COMPRESSION_CANDIDATES = deepFreeze({
  glue_ny_calibration_v1: {
    status: "phase1_candidate",
    main: {
      threshold_db: -12.5,
      ratio: 2,
      attack_seconds: 0.025,
      release_seconds: 0.25,
      knee_db: 6,
      makeup_db: 0,
    },
    parallel: {
      threshold_db: -19.1,
      ratio: 6,
      attack_seconds: 0.006,
      release_seconds: 0.18,
      knee_db: 8,
      makeup_db: 4,
      additional_colour_drive: 1.08,
    },
    parallel_blend: 0.15,
    differential_latency_samples: 0,
  },
});

// Versioned deterministic noise algorithms. Profile-specific colour defaults
// are recorded separately below; array order is never a preference signal.
export const NOISE_CANDIDATES = deepFreeze({
  white_noise_v1: {
    status: "phase1_candidate",
    colour: "white",
    algorithm: "seeded_xorshift32_binary_v1",
    seed_uint32: 0x6d2b79f5,
    insertion_point: "post_diamond_sum_pre_invariant_limiter",
  },
  pink_noise_v1: {
    status: "phase1_candidate",
    colour: "pink",
    algorithm: "seeded_voss_mccartney_16_row_v1",
    seed_uint32: 0x1b873593,
    insertion_point: "post_diamond_sum_pre_invariant_limiter",
  },
  brown_noise_v1: {
    status: "phase1_candidate",
    colour: "brown",
    algorithm: "seeded_stationary_ar1_20hz_v1",
    seed_uint32: 0x85ebca6b,
    insertion_point: "post_diamond_sum_pre_invariant_limiter",
  },
});

const MINOR_WEIGHT = 0.0666;
const BALANCED_FREQUENCY_WEIGHT = DIAMOND_FREQUENCY_POWER_TOTAL / 4;

export const PROFILE_CANDIDATES = deepFreeze({
  sleep_delta_80_v1: profile("sleep", {
    delta: 0.8,
    theta: MINOR_WEIGHT,
    alpha: MINOR_WEIGHT,
    gamma: MINOR_WEIGHT,
  }),
  mindfulness_theta_80_v1: profile("mindfulness", {
    delta: MINOR_WEIGHT,
    theta: 0.8,
    alpha: MINOR_WEIGHT,
    gamma: MINOR_WEIGHT,
  }),
  calm_alpha_80_v1: profile("calm", {
    delta: MINOR_WEIGHT,
    theta: MINOR_WEIGHT,
    alpha: 0.8,
    gamma: MINOR_WEIGHT,
  }),
  inspiration_gamma_80_v1: profile("inspiration", {
    delta: MINOR_WEIGHT,
    theta: MINOR_WEIGHT,
    alpha: MINOR_WEIGHT,
    gamma: 0.8,
  }),
  balanced_24_995_v1: profile("balanced", {
    delta: BALANCED_FREQUENCY_WEIGHT,
    theta: BALANCED_FREQUENCY_WEIGHT,
    alpha: BALANCED_FREQUENCY_WEIGHT,
    gamma: BALANCED_FREQUENCY_WEIGHT,
  }),
});

// Ben-locked default colour routing, 2026-08-10. Gamma's three colours share
// the same total 0.01% noise allocation equally in the power domain.
export const PROFILE_NOISE_DEFAULTS = deepFreeze({
  sleep_delta_80_v1: profileNoiseDefault("delta_brown_default_v1", {
    brown_noise_v1: NOISE_POWER_WEIGHT,
  }),
  mindfulness_theta_80_v1: profileNoiseDefault("theta_white_default_v1", {
    white_noise_v1: NOISE_POWER_WEIGHT,
  }),
  calm_alpha_80_v1: profileNoiseDefault("alpha_pink_default_v1", {
    pink_noise_v1: NOISE_POWER_WEIGHT,
  }),
  inspiration_gamma_80_v1: profileNoiseDefault("gamma_equal_white_pink_brown_default_v1", {
    white_noise_v1: NOISE_POWER_WEIGHT / 3,
    pink_noise_v1: NOISE_POWER_WEIGHT / 3,
    brown_noise_v1: NOISE_POWER_WEIGHT / 3,
  }),
});

export function createCandidateCondition({
  profileId = "balanced_24_995_v1",
  carrierHz = 111,
  envelopeCandidateId = "raised_cosine_50_depth_80_v1",
  lowpassCandidateId = "butterworth_12db_minimum_phase_v1",
  compressionCandidateId = "glue_ny_calibration_v1",
  noiseCandidateId = "",
  masteringCondition = "engineering_on",
  transitionSeconds = 40,
  carrierPhaseCycles = 0,
  lanePhaseCycles = {},
  technicalOutputGain = 0.08,
  limiterCeiling = 0.85,
} = {}) {
  const selectedProfile = PROFILE_CANDIDATES[profileId];
  if (!selectedProfile) throw new Error(`Unknown adaptive-sound profile: ${profileId}`);
  const noiseSelection = resolveNoiseSelection(profileId, noiseCandidateId);

  const condition = {
    schema_version: ADAPTIVE_SOUND_SCHEMA_VERSION,
    renderer_version: ADAPTIVE_SOUND_RENDERER_VERSION,
    status: "phase1_laboratory_candidate",
    profile_id: profileId,
    intent_label: selectedProfile.intent_label,
    carrier_hz: Number(carrierHz),
    carrier_mode: "single",
    carrier_phase_cycles: normalizedPhase(carrierPhaseCycles),
    isochronic_hz: { ...NOMINAL_ISOCHRONIC_HZ },
    lane_phase_cycles: Object.fromEntries(LANE_IDS.map((laneId) => [
      laneId,
      normalizedPhase(lanePhaseCycles[laneId] ?? 0),
    ])),
    diamond_power_weights: { ...selectedProfile.diamond_power_weights },
    noise_power_weight: NOISE_POWER_WEIGHT,
    silence_power_weight: SILENCE_POWER_WEIGHT,
    noise_selection_id: noiseSelection.selection_id,
    noise_selection_authority: noiseSelection.authority,
    noise_power_weights: { ...noiseSelection.power_weights },
    enabled_lanes: Object.fromEntries(LANE_IDS.map((laneId) => [laneId, true])),
    envelope_candidate_id: envelopeCandidateId,
    lowpass_candidate_id: lowpassCandidateId,
    compression_candidate_id: compressionCandidateId,
    resolved_dsp_candidates: {
      envelope: cloneValue(ENVELOPE_CANDIDATES[envelopeCandidateId]),
      lowpass: cloneValue(LOWPASS_CANDIDATES[lowpassCandidateId]),
      compression: cloneValue(COMPRESSION_CANDIDATES[compressionCandidateId]),
      noise: resolvedNoiseCandidates(noiseSelection.power_weights),
    },
    mastering_condition: masteringCondition,
    transition_seconds: Number(transitionSeconds),
    technical_output_gain: Number(technicalOutputGain),
    technical_output_gain_authority: "phase1_muted_render_only_not_product_ceiling",
    limiter_ceiling: Number(limiterCeiling),
  };

  validateCondition(condition);
  return deepFreeze(condition);
}

export function validateCondition(condition) {
  if (!condition || typeof condition !== "object") throw new TypeError("Adaptive-sound condition must be an object");
  if (condition.schema_version !== ADAPTIVE_SOUND_SCHEMA_VERSION) throw new Error("Unsupported adaptive-sound schema version");
  if (condition.renderer_version !== ADAPTIVE_SOUND_RENDERER_VERSION) throw new Error("Unsupported adaptive-sound renderer version");
  if (condition.status !== "phase1_laboratory_candidate") throw new Error("Phase 1 accepts laboratory candidates only");
  if (!PRINCIPAL_CARRIER_HZ.includes(condition.carrier_hz)) throw new Error("Carrier is outside the locked principal research set");
  if (condition.carrier_mode !== "single") throw new Error("Phase 1 conditions use one carrier at a time");
  if (!ENVELOPE_CANDIDATES[condition.envelope_candidate_id]) throw new Error("Unknown envelope candidate");
  if (!LOWPASS_CANDIDATES[condition.lowpass_candidate_id]) throw new Error("Unknown 14,444 Hz low-pass candidate");
  if (!COMPRESSION_CANDIDATES[condition.compression_candidate_id]) throw new Error("Unknown compression candidate");
  if (!PROFILE_CANDIDATES[condition.profile_id]) throw new Error("Unknown condition profile");
  assertResolvedCandidate(
    condition.resolved_dsp_candidates?.envelope,
    ENVELOPE_CANDIDATES[condition.envelope_candidate_id],
    "envelope"
  );
  assertResolvedCandidate(
    condition.resolved_dsp_candidates?.lowpass,
    LOWPASS_CANDIDATES[condition.lowpass_candidate_id],
    "low-pass"
  );
  assertResolvedCandidate(
    condition.resolved_dsp_candidates?.compression,
    COMPRESSION_CANDIDATES[condition.compression_candidate_id],
    "compression"
  );
  validateNoiseSelection(condition);
  if (!["engineering_on", "engineering_clean_reference"].includes(condition.mastering_condition)) {
    throw new Error("Phase 1 mastering condition must be an engineering reference state");
  }

  let weightTotal = 0;
  for (const laneId of LANE_IDS) {
    if (condition.isochronic_hz?.[laneId] !== NOMINAL_ISOCHRONIC_HZ[laneId]) {
      throw new Error(`${laneId} must remain at its exact nominal Phase 1 rate`);
    }
    const weight = Number(condition.diamond_power_weights?.[laneId]);
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new Error(`Invalid ${laneId} power weight`);
    weightTotal += weight;
    if (typeof condition.enabled_lanes?.[laneId] !== "boolean") throw new Error(`Missing ${laneId} enabled state`);
    const phase = Number(condition.lane_phase_cycles?.[laneId]);
    if (!Number.isFinite(phase) || phase < 0 || phase >= 1) throw new Error(`Invalid ${laneId} phase`);
  }
  if (Math.abs(weightTotal - DIAMOND_FREQUENCY_POWER_TOTAL) > 1e-12) {
    throw new Error("Diamond frequency power weights must total exactly 99.98%");
  }
  if (condition.noise_power_weight !== NOISE_POWER_WEIGHT) throw new Error("Noise allocation must remain exactly 0.01%");
  if (condition.silence_power_weight !== SILENCE_POWER_WEIGHT) throw new Error("Silence allocation must remain exactly 0.01%");
  const allocationTotal = weightTotal + condition.noise_power_weight + condition.silence_power_weight;
  if (Math.abs(allocationTotal - 1) > 1e-12) throw new Error("Frequency, noise and silence allocations must total one");
  if (!Number.isFinite(condition.transition_seconds) || condition.transition_seconds < 0) throw new Error("Invalid transition duration");
  if (!Number.isFinite(condition.technical_output_gain) || condition.technical_output_gain <= 0 || condition.technical_output_gain > 0.25) {
    throw new Error("Phase 1 technical output gain must be positive and no greater than 0.25");
  }
  if (condition.technical_output_gain_authority !== "phase1_muted_render_only_not_product_ceiling") {
    throw new Error("Technical output gain cannot be represented as a product ceiling");
  }
  if (!Number.isFinite(condition.limiter_ceiling) || condition.limiter_ceiling <= 0 || condition.limiter_ceiling > 0.98) {
    throw new Error("Invalid invariant limiter ceiling");
  }
  return true;
}

export function canonicalConditionJson(condition) {
  validateCondition(condition);
  return JSON.stringify(sortValue(condition));
}

export function adaptiveSoundLaneIds() {
  return LANE_IDS.slice();
}

function profile(intentLabel, weights) {
  return {
    status: "phase1_candidate",
    intent_label: intentLabel,
    diamond_power_weights: weights,
  };
}

function profileNoiseDefault(selectionId, activeWeights) {
  return {
    status: "ben_locked_profile_default_2026_08_10",
    selection_id: selectionId,
    authority: "ben_locked_profile_default",
    power_weights: completeNoisePowerWeights(activeWeights),
  };
}

function resolveNoiseSelection(profileId, noiseCandidateId) {
  if (noiseCandidateId) {
    if (!NOISE_CANDIDATES[noiseCandidateId]) throw new Error(`Unknown explicit noise candidate: ${noiseCandidateId}`);
    return {
      selection_id: `explicit_${noiseCandidateId}_override`,
      authority: "phase1_explicit_lab_override",
      power_weights: completeNoisePowerWeights({ [noiseCandidateId]: NOISE_POWER_WEIGHT }),
    };
  }
  const profileDefault = PROFILE_NOISE_DEFAULTS[profileId];
  if (!profileDefault) {
    throw new Error(`Profile ${profileId} has no approved noise default; select an explicit white, pink or brown Phase 1 candidate`);
  }
  return profileDefault;
}

function completeNoisePowerWeights(activeWeights) {
  return Object.fromEntries(Object.keys(NOISE_CANDIDATES).map((candidateId) => [
    candidateId,
    Number(activeWeights[candidateId] || 0),
  ]));
}

function resolvedNoiseCandidates(powerWeights) {
  return Object.fromEntries(Object.entries(powerWeights)
    .filter(([, weight]) => weight > 0)
    .map(([candidateId]) => [candidateId, cloneValue(NOISE_CANDIDATES[candidateId])]));
}

function validateNoiseSelection(condition) {
  const candidateIds = Object.keys(NOISE_CANDIDATES);
  if (JSON.stringify(Object.keys(condition.noise_power_weights || {}).sort()) !== JSON.stringify(candidateIds.slice().sort())) {
    throw new Error("Noise power weights must record white, pink and brown candidates explicitly");
  }
  let noiseTotal = 0;
  for (const candidateId of candidateIds) {
    const weight = Number(condition.noise_power_weights[candidateId]);
    if (!Number.isFinite(weight) || weight < 0 || weight > NOISE_POWER_WEIGHT) throw new Error(`Invalid ${candidateId} power weight`);
    noiseTotal += weight;
  }
  if (Math.abs(noiseTotal - NOISE_POWER_WEIGHT) > 1e-15) throw new Error("Noise colour power weights must total exactly 0.01%");

  if (condition.noise_selection_authority === "ben_locked_profile_default") {
    const expected = PROFILE_NOISE_DEFAULTS[condition.profile_id];
    if (!expected) throw new Error("Profile has no Ben-locked noise default");
    if (condition.noise_selection_id !== expected.selection_id) throw new Error("Noise default selection ID does not match profile");
    assertResolvedCandidate(condition.noise_power_weights, expected.power_weights, "profile noise weights");
  } else if (condition.noise_selection_authority === "phase1_explicit_lab_override") {
    const activeIds = candidateIds.filter((candidateId) => condition.noise_power_weights[candidateId] > 0);
    if (activeIds.length !== 1 || condition.noise_power_weights[activeIds[0]] !== NOISE_POWER_WEIGHT) {
      throw new Error("An explicit Phase 1 noise override must select exactly one colour");
    }
    if (condition.noise_selection_id !== `explicit_${activeIds[0]}_override`) throw new Error("Explicit noise selection ID mismatch");
  } else {
    throw new Error("Unknown noise selection authority");
  }

  assertResolvedCandidate(
    condition.resolved_dsp_candidates?.noise,
    resolvedNoiseCandidates(condition.noise_power_weights),
    "noise"
  );
}

function normalizedPhase(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new Error("Phase must be finite");
  return ((numeric % 1) + 1) % 1;
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]));
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
}

function assertResolvedCandidate(actual, expected, label) {
  if (JSON.stringify(sortValue(actual)) !== JSON.stringify(sortValue(expected))) {
    throw new Error(`Resolved ${label} parameters do not match the versioned candidate registry`);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
