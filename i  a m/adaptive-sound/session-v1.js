import {
  ADAPTIVE_SOUND_SCHEMA_VERSION,
  NOMINAL_ISOCHRONIC_HZ,
  PRINCIPAL_CARRIER_HZ,
  PROFILE_CANDIDATES,
} from "./profiles-v1.js?v=3f39020ebeab";
import {
  CURRENT_INFERENCE_FUSION_POLICY_VERSION,
  resolvedAdaptiveSoundIntent,
} from "../current-inference-fusion-v1.js?v=611b43aaaefb";

export const ADAPTIVE_SOUND_SESSION_EVENT = "iam:adaptive-sound-profile";
export const ADAPTIVE_SOUND_SESSION_STORAGE_KEY = "iamAdaptiveSoundSessionSnapshotV1";
export const ADAPTIVE_SOUND_SESSION_CHOICE_KEY = "iamAdaptiveSoundSessionChoiceV1";
export const ADAPTIVE_SOUND_SESSION_SCHEMA_VERSION = "iam_adaptive_sound_session_resolution_v1";

const POLICY_URL = new URL("../adaptive-sound-intent-policy-v1.json", import.meta.url);
const INFERENCE_KEYS = Object.freeze(["iamLatestInference", "citizenNeedsLatestInference"]);
const PROFILE_IDS = Object.freeze(Object.keys(PROFILE_CANDIDATES));
const CARRIER_SET = Object.freeze([...PRINCIPAL_CARRIER_HZ]);

let browserSessionSingleton = null;

export function resolveAdaptiveSoundSession(inferenceInput = {}, policy, options = {}) {
  validatePolicy(policy);
  const inference = unwrapInference(inferenceInput);
  const sessionChoice = normalizeSessionChoice(options.sessionChoice, policy);
  const preferences = {
    ...objectValue(inference.selection_context?.adaptive_sound_preferences),
    ...objectValue(options.preferences),
    ...(sessionChoice ? { high_concern_session_opt_in: sessionChoice.high_concern_session_opt_in === true } : {}),
  };
  const payload = {
    ...inference,
    selection_context: {
      ...objectValue(inference.selection_context),
      adaptive_sound_session_choice: sessionChoice,
      adaptive_sound_preferences: preferences,
    },
  };

  const bands = policy.bands;
  const carriers = policy.carriers;
  const needScores = collectNeedScores(payload);
  const bandScores = scoreOptions(bands, needScores);
  const carrierScores = scoreOptions(carriers, needScores);
  const explicit = explicitSelection(payload, bands, carriers);
  const semanticIntent = objectValue(resolvedAdaptiveSoundIntent(payload));
  const explicitInsufficientContext = semanticIntent.relevant === false
    && !hasAcceptedSelfReport(payload)
    && explicit.selection_basis !== "citizen_session_override";
  const fingerprint = stableStringify({
    needs: needScores,
    intent: semanticIntent,
    visitor: String(payload.selection_context?.visitor_id || "anonymous"),
  });

  const bandIntent = explicit.band_intent || (!explicitInsufficientContext
    ? chooseScored(bandScores, fingerprint, "band")
    : null);
  const carrierIntent = explicit.carrier_intent || (!explicitInsufficientContext
    ? chooseScored(carrierScores, fingerprint, "carrier")
    : null);
  const safety = resolveSafety(payload, policy);
  const promptIdentity = readPromptIdentity(inference);
  const authority = {
    selection_authority: selectionAuthority(explicit.selection_basis, bandIntent, carrierIntent),
    resolver: "deterministic_browser_policy_resolver_v1",
    policy_registry: "adaptive-sound-intent-policy-v1.json",
    policy_version: policy.policy_version,
    profile_registry: ADAPTIVE_SOUND_SCHEMA_VERSION,
    inference_engine_version: promptIdentity.engine_version,
    prompt_version: promptIdentity.prompt_version,
    prompt_sha256: promptIdentity.prompt_sha256,
  };
  const inferenceAudit = currentInferenceAudit(payload);
  const baseAudit = {
    source_event: String(options.sourceEvent || "session_initialization"),
    raw_checkin_text_used: false,
    research_hypotheses_registry_loaded: false,
    automatic_mid_session_morph: false,
    current_session_only: true,
    session_choice_present: Boolean(sessionChoice?.band_intent || sessionChoice?.carrier_intent),
    fusion_policy_version: String(inferenceAudit.fusion_policy_version || ""),
    fusion_action: String(inferenceAudit.fusion_action || ""),
    fusion_outputs_changed: [...inferenceAudit.fusion_outputs_changed],
    ...inferenceAudit,
  };

  if (!bandIntent || !carrierIntent) {
    safety.adaptive_frequencies_enabled = false;
    return deepFreeze({
      schema_version: ADAPTIVE_SOUND_SESSION_SCHEMA_VERSION,
      policy_version: policy.policy_version,
      selected: false,
      reason: "no_structured_checkin_intent_or_need_scores",
      selection_basis: "insufficient_context",
      session_scope: "current_session_only",
      carrier_mode: "single",
      band_intent: null,
      dominant_lane: null,
      dominant_isochronic_hz: null,
      profile_id: null,
      carrier_intent: null,
      carrier_hz: null,
      safety,
      authority,
      research_boundary: "biological_targets_not_loaded_or_used_by_product_resolver",
      claim_boundary: policy.claim_boundary,
      audit: baseAudit,
    });
  }

  const band = bands[bandIntent];
  const carrier = carriers[carrierIntent];
  const profile = PROFILE_CANDIDATES[band.profile_id];
  if (!profile) throw new Error(`Adaptive-sound policy references an unknown profile: ${band.profile_id}`);
  const carrierHz = Number(carrier.carrier_hz);
  if (!CARRIER_SET.includes(carrierHz)) throw new Error("Adaptive-sound policy carrier is outside the principal set");
  const rankedNeeds = Object.entries(needScores).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const reportedNeeds = arrayValue(semanticIntent.top_needs_used)
    .map((label) => String(label || "").trim())
    .filter(Boolean)
    .slice(0, 4);
  const allowedCues = new Set([
    ...Object.values(carriers).flatMap((definition) => arrayValue(definition.experience)).map(normalizeLabel),
    ...Object.values(bands).map((definition) => normalizeLabel(definition.experience)),
  ]);
  const explicitCues = arrayValue(semanticIntent.explicit_cues_used)
    .map((cue) => String(cue || "").trim())
    .filter((cue) => cue && allowedCues.has(normalizeLabel(cue)))
    .slice(0, 4);
  const semanticConfidence = number01(semanticIntent.confidence);
  const dominantRate = Number(policy.isochronic_hz[bandIntent]);

  return deepFreeze({
    schema_version: ADAPTIVE_SOUND_SESSION_SCHEMA_VERSION,
    policy_version: policy.policy_version,
    selected: true,
    selection_basis: explicit.selection_basis,
    session_scope: "current_session_only",
    automatic_mid_session_morph: false,
    band_intent: bandIntent,
    dominant_lane: bandIntent,
    dominant_isochronic_hz: dominantRate,
    experience: band.experience,
    profile_id: band.profile_id,
    carrier_intent: carrierIntent,
    carrier_hz: carrierHz,
    carrier_mode: "single",
    diamond_power_weights: { ...profile.diamond_power_weights },
    isochronic_hz: { ...NOMINAL_ISOCHRONIC_HZ },
    noise_power_weight: Number(policy.allocation.noise_power),
    silence_power_weight: Number(policy.allocation.silence_power),
    top_needs_used: reportedNeeds.length
      ? reportedNeeds
      : rankedNeeds.filter(([, score]) => score > 0).slice(0, 4).map(([label]) => label),
    explicit_cues_used: explicitCues,
    confidence: semanticConfidence || round6(Math.max(bandScores[bandIntent] || 0, carrierScores[carrierIntent] || 0)),
    scores: {
      selected_band: round6(bandScores[bandIntent] || 0),
      selected_carrier: round6(carrierScores[carrierIntent] || 0),
    },
    safety,
    authority,
    research_boundary: "biological_targets_not_loaded_or_used_by_product_resolver",
    claim_boundary: policy.claim_boundary,
    audit: baseAudit,
  });
}

export function startAdaptiveSoundSession({ windowRef = globalThis.window, fetchImpl = globalThis.fetch } = {}) {
  if (!windowRef) return null;
  if (browserSessionSingleton?.windowRef === windowRef) return browserSessionSingleton.api;
  if (windowRef.IAMAdaptiveSoundSession?.schema_version === ADAPTIVE_SOUND_SESSION_SCHEMA_VERSION) {
    return windowRef.IAMAdaptiveSoundSession;
  }

  const state = {
    policy: null,
    inference: readCurrentSessionInference(windowRef),
    choice: readJson(windowRef.sessionStorage, ADAPTIVE_SOUND_SESSION_CHOICE_KEY),
    snapshot: null,
    started: false,
  };

  const api = {
    schema_version: ADAPTIVE_SOUND_SESSION_SCHEMA_VERSION,
    ready: null,
    current: () => state.snapshot,
    currentChoice: () => cloneValue(state.choice),
    refresh(inference, sourceEvent = "manual_refresh") {
      if (inference && typeof inference === "object") state.inference = unwrapInference(inference);
      return publish(sourceEvent);
    },
    setSessionChoice(choice = {}, sourceEvent = "sound_panel_session_choice") {
      if (!state.policy) return state.snapshot;
      state.choice = mergeSessionChoice(state.choice, choice, state.policy);
      writeJson(windowRef.sessionStorage, ADAPTIVE_SOUND_SESSION_CHOICE_KEY, state.choice);
      return publish(sourceEvent);
    },
    clearSessionChoice(sourceEvent = "sound_panel_session_choice_cleared") {
      state.choice = null;
      safeRemove(windowRef.sessionStorage, ADAPTIVE_SOUND_SESSION_CHOICE_KEY);
      return publish(sourceEvent);
    },
  };

  async function start() {
    if (state.started) return state.snapshot;
    state.started = true;
    windowRef.addEventListener("iam:inference-updated", (event) => {
      state.inference = unwrapInference(event.detail);
      publish("iam:inference-updated");
    });
    windowRef.addEventListener("iam:checkin-pipeline-complete", (event) => {
      state.inference = unwrapInference(event.detail);
      publish("iam:checkin-pipeline-complete");
    });
    state.policy = await loadPolicy(fetchImpl);
    publish("session_initialization");
    return state.snapshot;
  }

  function publish(sourceEvent) {
    if (!state.policy) return state.snapshot;
    const masterEnabled = safeGet(windowRef.localStorage, "iamSoundResearchLayer") !== "off";
    const snapshot = resolveAdaptiveSoundSession(state.inference || {}, state.policy, {
      sessionChoice: state.choice,
      sourceEvent,
      preferences: {
        sound_master_enabled: masterEnabled,
        quantum_tree_enabled: masterEnabled,
        adaptive_frequencies_enabled: true,
      },
    });
    state.snapshot = snapshot;
    windowRef.IAMAdaptiveSoundSnapshot = snapshot;
    writeJson(windowRef.sessionStorage, ADAPTIVE_SOUND_SESSION_STORAGE_KEY, snapshot);
    windowRef.dispatchEvent(new windowRef.CustomEvent(ADAPTIVE_SOUND_SESSION_EVENT, { detail: snapshot }));
    return snapshot;
  }

  api.ready = start().catch((error) => {
    const snapshot = policyFailureSnapshot(error);
    state.snapshot = snapshot;
    windowRef.IAMAdaptiveSoundSnapshot = snapshot;
    writeJson(windowRef.sessionStorage, ADAPTIVE_SOUND_SESSION_STORAGE_KEY, snapshot);
    windowRef.dispatchEvent(new windowRef.CustomEvent(ADAPTIVE_SOUND_SESSION_EVENT, { detail: snapshot }));
    return snapshot;
  });
  windowRef.IAMAdaptiveSoundSession = api;
  browserSessionSingleton = { windowRef, api };
  return api;
}

async function loadPolicy(fetchImpl) {
  if (typeof fetchImpl !== "function") throw new Error("Adaptive-sound policy fetch is unavailable");
  const response = await fetchImpl(POLICY_URL, { credentials: "same-origin", cache: "no-store" });
  if (!response?.ok) throw new Error(`Adaptive-sound policy unavailable (${response?.status || "network"})`);
  const policy = await response.json();
  validatePolicy(policy);
  return policy;
}

function validatePolicy(policy) {
  if (!policy || typeof policy !== "object") throw new TypeError("Adaptive-sound policy must be an object");
  if (policy.schema_version !== "iam_adaptive_sound_intent_policy_v1") throw new Error("Unsupported adaptive-sound intent policy");
  if (!policy.bands || !policy.carriers || !policy.safety_policy) throw new Error("Incomplete adaptive-sound policy");
  for (const [bandIntent, definition] of Object.entries(policy.bands)) {
    if (!Object.hasOwn(NOMINAL_ISOCHRONIC_HZ, bandIntent)) throw new Error(`Unknown adaptive-sound band: ${bandIntent}`);
    if (!PROFILE_IDS.includes(definition.profile_id)) throw new Error(`Unknown adaptive-sound profile: ${definition.profile_id}`);
    if (Number(policy.isochronic_hz?.[bandIntent]) !== NOMINAL_ISOCHRONIC_HZ[bandIntent]) {
      throw new Error(`Adaptive-sound rate mismatch for ${bandIntent}`);
    }
  }
  for (const definition of Object.values(policy.carriers)) {
    if (!CARRIER_SET.includes(Number(definition.carrier_hz))) throw new Error("Unknown adaptive-sound carrier");
  }
}

function explicitSelection(payload, bands, carriers) {
  const choice = objectValue(payload.selection_context?.adaptive_sound_session_choice);
  const choiceBand = String(choice.band_intent || "").toLowerCase();
  const choiceCarrier = String(choice.carrier_intent || "").toLowerCase();
  if (Object.hasOwn(bands, choiceBand) && Object.hasOwn(carriers, choiceCarrier)) {
    return { band_intent: choiceBand, carrier_intent: choiceCarrier, selection_basis: "citizen_session_override" };
  }
  const intent = objectValue(resolvedAdaptiveSoundIntent(payload));
  const bandIntent = String(intent.band_intent || "").toLowerCase();
  const carrierIntent = String(intent.carrier_intent || "").toLowerCase();
  if (intent.relevant !== false && Object.hasOwn(bands, bandIntent) && Object.hasOwn(carriers, carrierIntent)) {
    return {
      band_intent: bandIntent,
      carrier_intent: carrierIntent,
      selection_basis: intent.resolution_authority === "deterministic_local_fusion"
        ? "fused_current_inference"
        : "inference_semantic_intent",
    };
  }
  return { band_intent: null, carrier_intent: null, selection_basis: "deterministic_needs_scores" };
}

function resolveSafety(payload, policy) {
  const safetyPolicy = policy.safety_policy;
  const supportLevel = String(payload.adaptive_support_relevance?.level || "none").toLowerCase();
  const reviewValue = payload.human_review_relevance;
  const reviewLevel = String(typeof reviewValue === "object" ? reviewValue?.level || "none" : reviewValue || "none").toLowerCase();
  const intentSafety = String(resolvedAdaptiveSoundIntent(payload).safety_state || "standard").toLowerCase();
  const flagText = arrayValue(payload.safety_flags).map((flag) => String(flag).toLowerCase()).join(" ");
  const highConcern = safetyPolicy.high_concern_support_levels.includes(supportLevel)
    || safetyPolicy.high_concern_human_review_levels.includes(reviewLevel)
    || intentSafety === "high_concern"
    || ["acute", "crisis", "immediate danger", "urgent"].some((token) => flagText.includes(token));
  const preferences = objectValue(payload.selection_context?.adaptive_sound_preferences);
  const masterEnabled = preferences.sound_master_enabled !== false;
  const quantumTreePreference = preferences.quantum_tree_enabled !== false;
  const frequencyPreference = preferences.adaptive_frequencies_enabled !== false;
  const highConcernOptIn = preferences.high_concern_session_opt_in === true;
  const contactConsent = preferences.authorized_human_contact_consent === true;
  const verifiedContact = Boolean(String(preferences.authorized_contact_id || "").trim());
  const humanApproval = preferences.human_in_the_loop_approval === true;
  const notificationStatus = !highConcern
    ? "not_applicable"
    : contactConsent && verifiedContact && humanApproval
      ? "authorized_for_human_operator_not_sent_by_model"
      : contactConsent && verifiedContact
        ? "pending_human_review_approval"
        : "blocked_until_consent_and_verified_contact";
  return {
    state: highConcern ? "high_concern" : "standard",
    quantum_tree_enabled: masterEnabled && quantumTreePreference,
    quantum_tree_policy: safetyPolicy.quantum_tree,
    adaptive_frequencies_enabled: masterEnabled && frequencyPreference && (!highConcern || highConcernOptIn),
    adaptive_frequencies_default: !highConcern,
    citizen_session_opt_in_required: highConcern,
    human_review_required: highConcern,
    notification: {
      status: notificationStatus,
      authority: safetyPolicy.notification_authority,
      model_must_not_contact_any_person: true,
    },
  };
}

function currentInferenceAudit(payload) {
  const intent = objectValue(resolvedAdaptiveSoundIntent(payload));
  const current = objectValue(payload.current_inference);
  const fusion = objectValue(current.fusion);
  const validHeartRateRoles = new Set(["supporting", "conflicting", "not_available", "invalid"]);
  const validHeartRateZones = new Set(["low_observed", "mid_observed", "elevated_observed", "not_available"]);
  const validHorizons = new Set(["horizon_1", "horizon_2", "horizon_3"]);
  const heartRateRole = String(current.heart_rate_role || "not_available");
  const heartRateZone = String(current.heart_rate_zone || "not_available");
  const horizonsConsidered = arrayValue(intent.horizons_considered)
    .map(String)
    .filter((value) => validHorizons.has(value));
  return {
    context_modifiers_used: arrayValue(intent.context_modifiers_used)
      .map((value) => String(value || "").trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 6),
    context_dimensions_considered: ["time", "weather", "location"],
    horizons_considered: horizonsConsidered.length
      ? horizonsConsidered
      : ["horizon_1", "horizon_2", "horizon_3"],
    heart_rate_role: validHeartRateRoles.has(heartRateRole) ? heartRateRole : "invalid",
    heart_rate_zone: validHeartRateZones.has(heartRateZone) ? heartRateZone : "not_available",
    raw_heart_rate_retained: false,
    baseline_comparison_used: false,
    fusion_policy_version: fusion.policy_version === CURRENT_INFERENCE_FUSION_POLICY_VERSION
      ? fusion.policy_version
      : "",
    fusion_action: String(fusion.action || ""),
    fusion_outputs_changed: arrayValue(fusion.outputs_changed).map(String).slice(0, 4),
  };
}

function normalizeSessionChoice(value, policy) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = objectValue(value);
  const bandIntent = String(source.band_intent || "").toLowerCase();
  const carrierIntent = String(source.carrier_intent || "").toLowerCase();
  return {
    band_intent: Object.hasOwn(policy.bands, bandIntent) ? bandIntent : null,
    carrier_intent: Object.hasOwn(policy.carriers, carrierIntent) ? carrierIntent : null,
    high_concern_session_opt_in: source.high_concern_session_opt_in === true,
    scope: "current_session_only",
  };
}

function mergeSessionChoice(previous, update, policy) {
  const current = normalizeSessionChoice(previous, policy) || {
    band_intent: null,
    carrier_intent: null,
    high_concern_session_opt_in: false,
  };
  const next = objectValue(update);
  let bandIntent = String(next.band_intent || "").toLowerCase();
  let carrierIntent = String(next.carrier_intent || "").toLowerCase();
  if (!bandIntent && next.profile_id) {
    bandIntent = Object.entries(policy.bands).find(([, definition]) => definition.profile_id === next.profile_id)?.[0] || "";
  }
  if (!carrierIntent && Number.isFinite(Number(next.carrier_hz))) {
    carrierIntent = Object.entries(policy.carriers).find(([, definition]) => Number(definition.carrier_hz) === Number(next.carrier_hz))?.[0] || "";
  }
  return normalizeSessionChoice({
    band_intent: Object.hasOwn(policy.bands, bandIntent) ? bandIntent : current.band_intent,
    carrier_intent: Object.hasOwn(policy.carriers, carrierIntent) ? carrierIntent : current.carrier_intent,
    high_concern_session_opt_in: next.high_concern_session_opt_in === true || current.high_concern_session_opt_in,
  }, policy);
}

function collectNeedScores(payload) {
  const scores = {};
  for (const field of ["citizen_needs", "needs_scorecard", "radar_scores"]) flattenScores(payload[field], scores);
  for (const field of ["top_highlights", "highlights", "top_needs_used"]) {
    for (const label of arrayValue(payload[field])) {
      const key = normalizeLabel(label);
      if (key) scores[key] = Math.max(scores[key] || 0, 0.82);
    }
  }
  return scores;
}

function hasAcceptedSelfReport(payload) {
  return typeof payload.checkin === "string" && payload.checkin.trim().length > 0;
}

function flattenScores(value, scores) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const [label, child] of Object.entries(value)) {
    if (child && typeof child === "object" && !Array.isArray(child)) flattenScores(child, scores);
    else if (typeof child === "number" && Number.isFinite(child)) {
      const key = normalizeLabel(label);
      scores[key] = Math.max(scores[key] || 0, number01(child));
    }
  }
}

function scoreOptions(options, needScores) {
  return Object.fromEntries(Object.entries(options).map(([optionId, definition]) => {
    const weights = objectValue(definition.need_weights);
    const entries = Object.entries(weights);
    const denominator = entries.reduce((sum, [, weight]) => sum + Number(weight || 0), 0) || 1;
    const score = entries.reduce((sum, [label, weight]) => sum + (needScores[normalizeLabel(label)] || 0) * Number(weight || 0), 0) / denominator;
    return [optionId, score];
  }));
}

function chooseScored(scores, fingerprint, namespace) {
  const best = Math.max(0, ...Object.values(scores));
  if (!(best > 0)) return null;
  const tied = Object.keys(scores).filter((key) => Math.abs(scores[key] - best) <= 1e-12).sort();
  if (tied.length === 1) return tied[0];
  const hash = fnv1a64(`${namespace}\u241f${fingerprint}`);
  return tied[Number(hash % BigInt(tied.length))];
}

function selectionAuthority(basis, bandIntent, carrierIntent) {
  if (!bandIntent || !carrierIntent) return "no_current_session_selection";
  if (basis === "default_session_profile") return "platform_default_session_profile";
  if (basis === "citizen_session_override") return "citizen_current_session_choice";
  if (basis === "inference_semantic_intent") return "adaptive_inference_engine_semantic_intent";
  return "deterministic_structured_needs_policy";
}

function readPromptIdentity(inference) {
  return {
    engine_version: stringOrNull(inference.engine_version),
    prompt_version: stringOrNull(inference.prompt_version),
    prompt_sha256: /^[a-f0-9]{64}$/i.test(String(inference.prompt_sha256 || "")) ? String(inference.prompt_sha256) : null,
  };
}

function readCurrentSessionInference(windowRef) {
  if (windowRef.__iamLatestInference && typeof windowRef.__iamLatestInference === "object") {
    return unwrapInference(windowRef.__iamLatestInference);
  }
  for (const key of INFERENCE_KEYS) {
    const value = readJson(windowRef.sessionStorage, key);
    if (value && typeof value === "object") return unwrapInference(value);
  }
  return {};
}

function unwrapInference(value) {
  const source = objectValue(value);
  return source.inference && typeof source.inference === "object"
    ? source.inference
    : source;
}

function policyFailureSnapshot(error) {
  return deepFreeze({
    schema_version: ADAPTIVE_SOUND_SESSION_SCHEMA_VERSION,
    policy_version: null,
    selected: false,
    reason: "adaptive_sound_policy_unavailable",
    selection_basis: "insufficient_context",
    session_scope: "current_session_only",
    band_intent: null,
    dominant_lane: null,
    dominant_isochronic_hz: null,
    profile_id: null,
    carrier_intent: null,
    carrier_hz: null,
    safety: {
      state: "standard",
      quantum_tree_enabled: safeGet(globalThis.window?.localStorage, "iamSoundResearchLayer") !== "off",
      adaptive_frequencies_enabled: false,
      adaptive_frequencies_default: false,
      citizen_session_opt_in_required: false,
      human_review_required: false,
    },
    authority: {
      selection_authority: "no_current_session_selection",
      resolver: "deterministic_browser_policy_resolver_v1",
      policy_registry: "adaptive-sound-intent-policy-v1.json",
    },
    research_boundary: "biological_targets_not_loaded_or_used_by_product_resolver",
    audit: {
      source_event: "policy_load_error",
      raw_checkin_text_used: false,
      research_hypotheses_registry_loaded: false,
      current_session_only: true,
      error_code: String(error?.message || "policy_unavailable").slice(0, 120),
    },
  });
}

function normalizeLabel(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function number01(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0;
}

function round6(value) {
  return Math.round(Number(value || 0) * 1_000_000) / 1_000_000;
}

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function stringOrNull(value) {
  const text = String(value || "").trim();
  return text || null;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a64(value) {
  let hash = 0xcbf29ce484222325n;
  for (const character of String(value)) {
    hash ^= BigInt(character.codePointAt(0));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash;
}

function safeGet(store, key) {
  try { return store?.getItem(key) || ""; } catch { return ""; }
}

function readJson(store, key) {
  try { return JSON.parse(store?.getItem(key) || "null"); } catch { return null; }
}

function writeJson(store, key, value) {
  try { store?.setItem(key, JSON.stringify(value)); } catch {}
}

function safeRemove(store, key) {
  try { store?.removeItem(key); } catch {}
}

function cloneValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
