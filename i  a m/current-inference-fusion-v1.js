export const CURRENT_INFERENCE_FUSION_POLICY_VERSION = "iam_current_inference_fusion_v1.0";

const VALID_INFERENCE_IDS = new Set([
  "settled_resting",
  "active_energised",
  "strained_activated",
  "low_energy_withdrawn",
  "fatigued_recovering",
  "mixed_uncertain",
  "high_concern_support_first",
  "insufficient_context",
]);
const VALID_HEART_RATE_ROLES = new Set(["supporting", "conflicting", "not_available", "invalid"]);
const VALID_HEART_RATE_ZONES = new Set(["low_observed", "mid_observed", "elevated_observed", "not_available"]);
const LOWER_ACTIVATION_INFERENCES = new Set(["settled_resting", "low_energy_withdrawn", "fatigued_recovering"]);
const HIGHER_ACTIVATION_INFERENCES = new Set(["active_energised", "strained_activated"]);
const VALID_MUSIC_ROOMS = new Set([
  "inner-planes",
  "champagne-bohemia",
  "modul8-infinity",
  "james-bondage",
  "safety-cushion",
]);
const VALID_BANDS = new Set(["delta", "theta", "alpha", "gamma"]);
const VALID_CARRIERS = new Set([
  "cognition_joy",
  "self_connection",
  "presence",
  "social_connection",
  "earth_focus_reward",
]);

const BOUNDED_DOWNSHIFT_ROOMS = Object.freeze({
  "modul8-infinity": "champagne-bohemia",
  "james-bondage": "champagne-bohemia",
});

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function stringValue(value, maxLength = 96) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function contextHour(value) {
  const match = stringValue(value, 32).match(/(?:^|\D)([01]?\d|2[0-3]):[0-5]\d/);
  return match ? Number(match[1]) : null;
}

export function classifyFusionContextRole(environmentContext = {}) {
  const context = objectValue(environmentContext);
  const hour = contextHour(context.local_time || context.time_of_day);
  const weather = stringValue(context.weather_condition, 64).toLowerCase();
  const location = stringValue(context.location_label || context.location_type, 96).toLowerCase();
  let downshift = 0;
  let activation = 0;

  if (hour !== null && (hour >= 22 || hour < 5)) downshift += 2;
  else if (hour !== null && hour >= 8 && hour < 18) activation += 1;
  if (/\b(home|private|bedroom|rest|quiet)\b/.test(location)) downshift += 1;
  if (/\b(urban|city|public|outdoor|gym|club|festival|coast|beach)\b/.test(location)) activation += 1;
  if (/\b(rain|storm|wind|snow)\b/.test(weather)) downshift += 1;
  if (/\b(clear|sun|bright)\b/.test(weather)) activation += 1;
  if (downshift >= 2 && downshift > activation) return "downshift_supporting";
  if (activation >= 2 && activation > downshift) return "activation_supporting";
  return "neutral_or_unavailable";
}

export function classifyHeartRateEvidenceRole(inferenceId, heartRateZone, available = true) {
  if (!available || heartRateZone === "not_available") return "not_available";
  if (!VALID_HEART_RATE_ZONES.has(heartRateZone)) return "invalid";
  if (LOWER_ACTIVATION_INFERENCES.has(inferenceId) && heartRateZone === "elevated_observed") return "conflicting";
  if (HIGHER_ACTIVATION_INFERENCES.has(inferenceId) && heartRateZone === "low_observed") return "conflicting";
  return "supporting";
}

function normalizedSemanticSound(value) {
  const intent = objectValue(value);
  const bandIntent = String(intent.band_intent || "").toLowerCase();
  const carrierIntent = String(intent.carrier_intent || "").toLowerCase();
  return {
    ...intent,
    relevant: intent.relevant !== false,
    band_intent: VALID_BANDS.has(bandIntent) ? bandIntent : null,
    carrier_intent: VALID_CARRIERS.has(carrierIntent) ? carrierIntent : null,
  };
}

function hasExplicitRestCue(semanticSound) {
  return arrayValue(semanticSound.explicit_cues_used)
    .some((cue) => ["sleep", "rest"].includes(String(cue || "").toLowerCase()));
}

function boundedRoom(room) {
  return BOUNDED_DOWNSHIFT_ROOMS[room] || room;
}

function boundedActiveConflictSound(semanticSound) {
  return {
    band_intent: semanticSound.band_intent === "gamma" ? "alpha" : semanticSound.band_intent,
    carrier_intent: semanticSound.carrier_intent === "cognition_joy" ? "presence" : semanticSound.carrier_intent,
  };
}

function boundedLowerConflictSound(semanticSound) {
  const preserveExplicitRest = semanticSound.band_intent === "delta" && hasExplicitRestCue(semanticSound);
  return {
    band_intent: semanticSound.band_intent === "delta" && !preserveExplicitRest ? "alpha" : semanticSound.band_intent,
    carrier_intent: semanticSound.carrier_intent,
  };
}

export function resolveCurrentInferenceFusion({
  acceptedSelfReport = false,
  semanticInference = {},
  semanticMusicRoom = null,
  semanticAdaptiveSoundIntent = {},
  environmentContext = {},
  heartRateZone = "not_available",
  heartRateAvailable = false,
  heartRateRole = null,
} = {}) {
  const semantic = objectValue(semanticInference);
  const semanticInferenceId = VALID_INFERENCE_IDS.has(semantic.inference_id)
    ? semantic.inference_id
    : "insufficient_context";
  const normalizedZone = VALID_HEART_RATE_ZONES.has(heartRateZone) ? heartRateZone : "not_available";
  const suppliedRole = VALID_HEART_RATE_ROLES.has(heartRateRole) ? heartRateRole : null;
  const role = suppliedRole || classifyHeartRateEvidenceRole(
    semanticInferenceId,
    normalizedZone,
    heartRateAvailable,
  );
  const contextRole = classifyFusionContextRole(environmentContext);
  const semanticRoom = VALID_MUSIC_ROOMS.has(semanticMusicRoom) ? semanticMusicRoom : null;
  const semanticSound = normalizedSemanticSound(semanticAdaptiveSoundIntent);
  const eligible = acceptedSelfReport
    && semanticInferenceId !== "insufficient_context"
    && semanticSound.relevant !== false;
  let inferenceId = semanticInferenceId;
  let musicRoom = semanticRoom;
  let bandIntent = semanticSound.band_intent;
  let carrierIntent = semanticSound.carrier_intent;
  let action = "unavailable_semantic_preserved";
  let rationaleCodes = ["self_report_primary"];
  let activationCap = null;
  let trajectoryScale = 1;
  let trajectoryEmphasis = [];

  if (!eligible) {
    inferenceId = "insufficient_context";
    musicRoom = null;
    bandIntent = null;
    carrierIntent = null;
    action = "no_personalised_selection_without_self_report";
    rationaleCodes = ["self_report_required", "heart_rate_cannot_select_alone"];
  } else if (semanticInferenceId === "high_concern_support_first") {
    action = "high_concern_semantic_and_safety_preserved";
    rationaleCodes.push("heart_rate_never_creates_high_concern");
  } else if (role === "conflicting" && semanticInferenceId === "active_energised") {
    if (contextRole === "activation_supporting") {
      action = "conflict_context_explained_semantic_preserved";
      rationaleCodes.push("activation_context_supports_semantic_intent", "heart_rate_bounded_no_override");
    } else {
      action = "bounded_conflict_downshift";
      inferenceId = "mixed_uncertain";
      musicRoom = boundedRoom(semanticRoom);
      ({ band_intent: bandIntent, carrier_intent: carrierIntent } = boundedActiveConflictSound(semanticSound));
      activationCap = 1;
      trajectoryScale = 0.75;
      trajectoryEmphasis = ["Calm", "Clarity"];
      rationaleCodes.push("activation_evidence_conflicts", "conservative_current_session_resolution");
    }
  } else if (role === "conflicting" && LOWER_ACTIVATION_INFERENCES.has(semanticInferenceId)) {
    if (contextRole === "activation_supporting") {
      action = "conflict_context_explained_semantic_preserved";
      rationaleCodes.push("activation_context_explains_momentary_evidence", "heart_rate_bounded_no_override");
    } else {
      action = "bounded_conflict_stabilise";
      inferenceId = "mixed_uncertain";
      ({ band_intent: bandIntent, carrier_intent: carrierIntent } = boundedLowerConflictSound(semanticSound));
      activationCap = 1;
      trajectoryScale = 0.75;
      trajectoryEmphasis = ["Calm", "Clarity"];
      rationaleCodes.push("lower_activation_evidence_conflicts", "explicit_rest_cue_preserved_when_present");
    }
  } else if (role === "conflicting") {
    action = "conflicting_semantic_preserved";
    rationaleCodes.push("coherent_self_report_not_overridden");
  } else if (role === "supporting") {
    action = "supporting_semantic_preserved";
    rationaleCodes.push("momentary_evidence_supports_semantic_intent");
  } else if (role === "invalid") {
    action = "invalid_semantic_preserved";
    rationaleCodes.push("invalid_evidence_ignored");
  } else {
    rationaleCodes.push("heart_rate_not_available_non_blocking");
  }

  const outputsChanged = [];
  if (musicRoom !== semanticRoom) outputsChanged.push("music_room");
  if (activationCap !== null) outputsChanged.push("exact_music_selection");
  if (bandIntent !== semanticSound.band_intent) outputsChanged.push("adaptive_sound_band");
  if (carrierIntent !== semanticSound.carrier_intent) outputsChanged.push("adaptive_sound_carrier");

  return Object.freeze({
    schema_version: "iam_current_inference_fusion_v1",
    policy_version: CURRENT_INFERENCE_FUSION_POLICY_VERSION,
    eligible,
    semantic_inference_id: semanticInferenceId,
    inference_id: inferenceId,
    heart_rate_role: role,
    heart_rate_zone: role === "not_available" ? "not_available" : normalizedZone,
    context_role: contextRole,
    action,
    rationale_codes: Object.freeze(rationaleCodes),
    selected_music_room: musicRoom,
    adaptive_sound: Object.freeze({
      band_intent: bandIntent,
      carrier_intent: carrierIntent,
    }),
    music_selection: Object.freeze({
      adjustment: action,
      activation_cap: activationCap,
      trajectory_scale: trajectoryScale,
      trajectory_emphasis: Object.freeze(trajectoryEmphasis),
    }),
    outputs_changed: Object.freeze(outputsChanged),
    self_report_primary: true,
    heart_rate_can_select_alone: false,
    raw_heart_rate_retained: false,
    baseline_comparison_used: false,
    session_scope: "current_session_only",
  });
}

export function resolvedAdaptiveSoundIntent(payload = {}) {
  const source = objectValue(payload);
  const semantic = normalizedSemanticSound(
    source.semantic_intents?.adaptive_sound || source.semantic_adaptive_sound_intent || source.adaptive_sound_intent,
  );
  const fusion = objectValue(source.current_inference?.fusion);
  const fusedSound = objectValue(fusion.adaptive_sound);
  if (fusion.policy_version !== CURRENT_INFERENCE_FUSION_POLICY_VERSION) {
    return semantic;
  }
  const bandIntent = String(fusedSound.band_intent || "").toLowerCase();
  const carrierIntent = String(fusedSound.carrier_intent || "").toLowerCase();
  return {
    ...semantic,
    band_intent: VALID_BANDS.has(bandIntent) ? bandIntent : null,
    carrier_intent: VALID_CARRIERS.has(carrierIntent) ? carrierIntent : null,
    resolution_authority: "deterministic_local_fusion",
    fusion_policy_version: fusion.policy_version,
    fusion_action: stringValue(fusion.action, 80),
  };
}
