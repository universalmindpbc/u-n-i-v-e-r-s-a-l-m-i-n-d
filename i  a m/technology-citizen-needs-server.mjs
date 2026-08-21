import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADAPTIVE_INFERENCE_SYSTEM_PROMPT,
  SYSTEM_PROMPT_SHA256,
  SYSTEM_PROMPT_SOURCE,
  SYSTEM_PROMPT_VERSION,
} from "../cloudflare/adaptive-inference-system-prompt-v5-55.js";
import {
  ADAPTIVE_MUSIC_ROOM_SELECTION_GUIDE,
  MUSIC_ROOM_SELECTION_GUIDE_VERSION,
} from "../cloudflare/adaptive-music-room-selection-guide-v1.js";
import {
  CURRENT_INFERENCE_FUSION_POLICY_VERSION,
  resolveCurrentInferenceFusion,
} from "./current-inference-fusion-v1.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const STATIC_ROOT = resolve(__dirname);
const PORT = Number(process.env.PORT || 8125);
const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || "python3";
const SELECTOR_CORE_PATH = join(__dirname, "selector_core.py");
const DEPLOYED_INFERENCE_ENDPOINT = "https://iam-citizen-needs-inference.universalmind.workers.dev/citizen-needs-inference";

export const CITIZEN_NEEDS_INFERENCE_MODEL = process.env.OPENAI_INFERENCE_MODEL || "gpt-5.5";

const allowedHighlights = [
  "Calm",
  "Hope",
  "Curiosity",
  "Gratitude",
  "Joy",
  "Love",
  "Awe",
  "Purpose",
  "Self-actualisation",
  "Fear",
  "Anxiety",
  "Anger",
  "Shame",
  "Loneliness",
  "Trust",
  "Belonging",
  "Connection",
  "Empathy",
  "Psychological Safety",
  "Self Transcendence",
  "Attention",
  "Clarity",
  "Mental Load",
  "Rumination",
  "Motivation",
  "Executive Function",
  "Arousal",
  "Recovery",
  "Stress",
  "Sleep Pressure",
  "Fatigue",
  "Hypervigilance",
  "Avoidance",
  "Intrusions",
  "Emotional Numbing",
  "Sleep Disturbance",
  "Startle Sensitivity",
];

const allowedMusicRooms = ["inner-planes", "champagne-bohemia", "modul8-infinity", "james-bondage", "safety-cushion"];
const allowedAdaptiveSoundBands = ["delta", "theta", "alpha", "gamma"];
const allowedAdaptiveSoundCarriers = ["cognition_joy", "self_connection", "presence", "social_connection", "earth_focus_reward"];
const allowedAdaptiveSoundCues = [
  "sleep", "rest", "mindfulness", "calm", "inspiration", "cognition", "joy",
  "connection to self", "body and mind", "personal love", "happiness", "presence", "self-awareness",
  "connection to others", "community", "family", "unconditional nonjudgmental love",
  "connection to earth", "breath", "hydration", "grounded", "on Country", "focus", "reward",
];
const allowedLocationPrecisions = ["none", "approximate", "precise"];
const allowedDomains = ["Emotion", "Social", "Cognitive", "Physiological", "Threat", "Clinical Risk"];
const allowedInferenceIds = [
  "settled_resting",
  "active_energised",
  "strained_activated",
  "low_energy_withdrawn",
  "fatigued_recovering",
  "mixed_uncertain",
  "high_concern_support_first",
  "insufficient_context",
];
const requiredInferenceHorizons = ["horizon_1", "horizon_2", "horizon_3"];

const scorecardDomains = {
  human_needs_radar: allowedHighlights,
  maslow_human_needs: [
    "Physiological Regulation",
    "Rest",
    "Shelter",
    "Safety",
    "Stability",
    "Protection",
    "Belonging",
    "Love",
    "Esteem",
    "Recognition",
    "Agency",
    "Self-Actualisation",
    "Self-Transcendence",
    "Meaning",
    "Contribution",
    "Creative Expression",
  ],
  mindfulness_dadirri: [
    "DM 01 Deep Listening",
    "DM 02 Presence",
    "DM 03 Connection to Country",
    "DM 04 Awareness",
    "DM 05 Trust",
    "DM 06 Self Compassion",
    "DM 07 Integration",
    "DM 08 Intention",
    "DM 09 Clarity",
    "DM 10 Curiosity",
    "DM 11 Courage",
    "DM 12 Service",
    "DM 13 Celebration",
    "DM 14 Grounded Readiness",
    "DM 15 Embodied Peace",
  ],
  meditative_values_applied: [
    "MVA 1 Anxiety to Peace Of Mind",
    "MVA 2 This Too Shall Pass",
    "MVA 3 Compassion Without Fixing",
    "MVA 4 Common Humanity via Body",
    "MVA 5 Awakening the Dreamtime",
    "MVA 6 Dadirri",
    "MVA 7 Grounded on Country",
    "MVA 8 Healing Wisdom of Nature",
  ],
  monomyth_hero_journey: [
    "MM 01 Call To Adventure",
    "MM 02 Refusal Of The Call",
    "MM 03 Supernatural Aid Mentor",
    "MM 04 Crossing First Threshold",
    "MM 05 Belly Of The Whale",
    "MM 06 Road Of Trials",
    "MM 07 Meeting With The Goddess",
    "MM 08 Temptation Distraction",
    "MM 09 Atonement With Authority",
    "MM 10 Apotheosis",
    "MM 11 Ultimate Boon",
    "MM 12 Refusal Of The Return",
    "MM 13 Magic Flight",
    "MM 14 Rescue From Without",
    "MM 15 Crossing Return Threshold",
    "MM 16 Master Of Two Worlds",
    "MM 17 Freedom To Live",
  ],
  memory_state: [
    "Memory Activation Strength",
    "Memory Specificity",
    "Nostalgia Intensity",
    "Somatic Memory Signal",
    "Agency After Listening",
    "Hope After Listening",
    "Place Memory Relevance",
    "Relationship Memory Relevance",
    "Sensory Memory Relevance",
    "Autobiographical Trigger Relevance",
    "Cultural Memory Relevance",
    "Future Memory Seeding",
  ],
  mental_health_safety: [
    "Fear",
    "Anxiety",
    "Anger",
    "Shame",
    "Loneliness",
    "Stress",
    "Rumination",
    "Hypervigilance",
    "Avoidance",
    "Intrusions",
    "Emotional Numbing",
    "Sleep Disturbance",
    "Startle Sensitivity",
    "Dysregulation",
    "Grounding Need",
    "Support Need",
    "Acute Distress",
    "Human Review Need",
    "Window of Tolerance",
    "Emotional Regulation Need",
    "Dissociation Risk",
    "Overwhelm",
    "Burnout Signal",
    "Isolation Risk",
    "Anger Activation",
    "Grief Activation",
    "Trauma Sensitivity",
  ],
  contextual_modifiers: [
    "Morning Activation",
    "Afternoon Sustain",
    "Evening Downshift",
    "Night Recovery",
    "Cold Weather Containment",
    "Warm Weather Expansion",
    "Clear Weather Brightness",
    "Rain Weather Holding",
    "Urban Density",
    "Coastal Openness",
    "Private Space",
    "Public Space",
  ],
};

function scorecardDomainSchema(labels) {
  return {
    type: "object",
    additionalProperties: false,
    properties: Object.fromEntries(labels.map((label) => [
      label,
      {
        type: "number",
        minimum: 0,
        maximum: 1,
      },
    ])),
    required: labels,
  };
}

const scorecardSchema = {
  type: "object",
  additionalProperties: false,
  properties: Object.fromEntries(
    Object.entries(scorecardDomains).map(([domain, labels]) => [domain, scorecardDomainSchema(labels)]),
  ),
  required: Object.keys(scorecardDomains),
};

const inferenceInstructions = [
  ADAPTIVE_INFERENCE_SYSTEM_PROMPT,
  [
    "Current live MVP endpoint constraint:",
    "- Use the short current self-report and supplied environment_context JSON to form the model-side current-session Inference.",
    "- Privacy boundary: raw Heart Rate and Heart Rate-derived health data are not sent to the external model. The model schema contains no Heart Rate fields; the deterministic local application layer reconciles the optional 10-second observation after the semantic response.",
    "- Use the word Inference, never Scenario. Return one semantic Current Inference Matrix ID: settled_resting, active_energised, strained_activated, low_energy_withdrawn, fatigued_recovering, mixed_uncertain, high_concern_support_first or insufficient_context.",
    "- Self-report is the primary current meaning. Heart Rate is supporting or conflicting evidence only. There is no personal baseline, trend or cross-session comparison.",
    "- Never infer stress, activity, mood, illness, a song, a band, a carrier or DSP from a Heart Rate threshold alone. Missing, declined or invalid Heart Rate is safe and non-blocking.",
    "- Select exactly four labels from the existing UI radar label list.",
    "- Also score the complete needs_scorecard. Every field must be a number from 0.00 to 1.00.",
    "- Treat needs_scorecard values as present-state relevance signals for adaptive music matching, not as clinical facts.",
    "- The four highlights remain the hero vectors. They should be the four strongest or most decision-relevant human_needs_radar signals.",
    "- Return a semantic music-room affinity through the canonical music rooms only: inner planes, champagne bohemia, modul8 infinity, james bondage, or safety cushion. The deterministic local fusion layer owns the final room candidate.",
    "- Calm, chill, and house are not recommendation categories. Calm remains a human-needs signal; chillout and house remain genres inside the relevant rooms.",
    "- Select a room from musical identity, stated intent and taste, constructive trajectory, context, continuity, and catalogue eligibility. Do not reduce room selection to an arousal ladder.",
    "- The UX sequence is check-in, needs-matched VOD music video, needs-matched extended livestream, then manual portal exploration.",
    "- Recommend the music room only. The application owns the stable Parties 80% / Radio 10% / Videos 10% slot, readiness validation and exact source ID resolution.",
    "- Always return null for selected_format and source_id, and false for catalogue_ready. Never invent or resolve a channel source.",
    "- Every accepted non-empty self-report is sufficient for adaptive sound. Return semantic_adaptive_sound_intent with relevant true, selection_basis current_checkin, exactly one semantic band intent and exactly one semantic carrier intent. The deterministic local fusion layer owns the resolved band and carrier.",
    "- Heart Rate is optional refinement only. Missing, skipped, declined, expired or invalid Heart Rate never permits insufficient_context, null sound intents, a camera requirement or a withheld recommendation. Lower confidence for sparse context and choose the safest semantic fit from the self-report and structured needs scores.",
    "- Band intents are delta sleep/rest, theta mindfulness, alpha calm and gamma inspiration. Carrier intents are cognition_joy, self_connection, presence, social_connection and earth_focus_reward.",
    "- Do not output DSP settings or use biological targets, research hypotheses or music metadata to choose adaptive sound.",
    "- Time, weather and location must materially influence every adaptive music and adaptive-sound intent decision across Horizons 1, 2 and 3. Record all three as used or unavailable; never invent missing context.",
    "- High concern must set semantic_adaptive_sound_intent.safety_state to high_concern. The model never contacts any person; notification is consented authorised human-in-the-loop only.",
    "- Treat local time, weather, temperature and location as required adaptive-environment modifiers for all three horizons, never as clinical evidence.",
    "- Environmental context never creates clinical evidence and never overrides citizen self-report.",
    "- Return top_needs_used, dominant_domains, and context_modifiers_used as the audit trail for music-room selection.",
    `Music-room selection JSON guide: ${JSON.stringify(ADAPTIVE_MUSIC_ROOM_SELECTION_GUIDE)}`,
    "- Obey the API-provided strict JSON schema exactly. Do not add, omit, or rename scorecard fields.",
    "- Treat the output as language-theme mapping for adaptive interface exploration.",
    "- Do not diagnose, prescribe, claim certainty, or provide clinical advice.",
  ].join("\n"),
].join("\n\n");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
  if (!body) return {};
  return JSON.parse(body);
}

function parseStructuredResponse(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return JSON.parse(payload.output_text);
  }

  const textItem = payload.output
    ?.flatMap((item) => item.content || [])
    ?.find((content) => content.type === "output_text" && typeof content.text === "string");

  if (textItem?.text) {
    return JSON.parse(textItem.text);
  }

  throw new Error("The model response did not include structured text.");
}

function cleanContextString(value, maxLength = 96) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function cleanContextNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 10) / 10 : null;
}

function heartRateObservationZone(value) {
  const heartRate = Number(value);
  if (!Number.isFinite(heartRate) || heartRate < 30 || heartRate > 240) return "not_available";
  if (heartRate < 60) return "low_observed";
  if (heartRate <= 100) return "mid_observed";
  return "elevated_observed";
}

function normalizeMomentaryPhysiology(value) {
  const input = value && typeof value === "object" ? value : {};
  const heartRate = Number(input.heart_rate_bpm ?? input.heartRateBpm);
  const heartRateZone = heartRateObservationZone(heartRate);
  const valid = heartRateZone !== "not_available";
  return {
    heart_rate_bpm: valid ? Math.round(heartRate) : null,
    heart_rate_zone: heartRateZone,
    measurement_duration_seconds: 10,
    measurement_timing: "immediately_after_current_self_report",
    source: valid ? "shen_quick_hr" : "not_available",
    baseline_available: false,
    trend_available: false,
    valid,
    optional_non_blocking: true,
    scope: "current_inference_request_only",
  };
}

function normalizeEnvironmentContext(value) {
  const input = value && typeof value === "object" ? value : {};
  const locationPrecision = cleanContextString(input.location_precision || input.locationPrecision, 24) || "none";
  const normalized = {
    local_time: cleanContextString(input.local_time || input.localTime, 32),
    location_label: cleanContextString(input.location_label || input.locationLabel, 96),
    location_precision: allowedLocationPrecisions.includes(locationPrecision) ? locationPrecision : "none",
    location_source: cleanContextString(input.location_source || input.locationSource, 64),
    weather_condition: cleanContextString(input.weather_condition || input.weatherCondition, 64),
    temperature_celsius: cleanContextNumber(input.temperature_celsius ?? input.temperatureCelsius),
    context_available: Boolean(input.context_available ?? input.contextAvailable),
    context_role: "all_adaptive_decisions_all_horizons",
  };

  normalized.context_available = normalized.context_available ||
    Boolean(normalized.local_time || normalized.location_label || normalized.weather_condition || normalized.temperature_celsius !== null);

  if (!normalized.location_label) normalized.location_precision = "none";

  return normalized;
}

function normalizeScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, Math.round(number * 100) / 100));
}

function normalizeNeedsScorecard(value) {
  const input = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    Object.entries(scorecardDomains).map(([domain, labels]) => {
      const domainInput = input[domain] && typeof input[domain] === "object" ? input[domain] : {};
      return [
        domain,
        Object.fromEntries(labels.map((label) => [label, normalizeScore(domainInput[label])])),
      ];
    }),
  );
}

function contextDimensionAudit(environmentContext) {
  return {
    time: Boolean(environmentContext.local_time),
    weather: Boolean(environmentContext.weather_condition || environmentContext.temperature_celsius !== null),
    location: Boolean(environmentContext.location_label),
  };
}

function validateInference(result, checkin, environmentContext, momentaryPhysiology) {
  if (!result || !Array.isArray(result.highlights) || result.highlights.length !== 4) {
    throw new Error("The model response must include exactly four highlights.");
  }

  const uniqueHighlights = new Set(result.highlights);
  if (uniqueHighlights.size !== 4) {
    throw new Error("The model response must include four unique highlights.");
  }

  result.highlights.forEach((highlight) => {
    if (!allowedHighlights.includes(highlight)) {
      throw new Error(`Unknown radar highlight: ${highlight}`);
    }
  });

  const topNeedsUsed = Array.isArray(result.top_needs_used)
    ? result.top_needs_used.filter((need) => allowedHighlights.includes(need)).slice(0, 4)
    : result.highlights;
  const dominantDomains = Array.isArray(result.dominant_domains)
    ? result.dominant_domains.filter((domain) => allowedDomains.includes(domain)).slice(0, 4)
    : [];
  const reportedContextModifiers = Array.isArray(result.context_modifiers_used)
    ? result.context_modifiers_used
      .filter((modifier) => typeof modifier === "string" && modifier.trim())
      .map((modifier) => modifier.trim().replace(/\s+/g, " ").slice(0, 80))
      .slice(0, 6)
    : [];
  const requiredContextAudit = [
    `time:${environmentContext.local_time || "unavailable"}`,
    `weather:${environmentContext.weather_condition || (environmentContext.temperature_celsius !== null ? `${environmentContext.temperature_celsius}C` : "unavailable")}`,
    `location:${environmentContext.location_label || "unavailable"}`,
  ];
  const contextModifiersUsed = [...requiredContextAudit, ...reportedContextModifiers]
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 6);
  const semanticCurrentInference = result.semantic_current_inference && typeof result.semantic_current_inference === "object"
    ? result.semantic_current_inference
    : {};
  const physiologyAvailable = momentaryPhysiology.valid === true;
  const semanticInferenceId = allowedInferenceIds.includes(semanticCurrentInference.inference_id)
    ? semanticCurrentInference.inference_id
    : "insufficient_context";
  const semanticMusicRoom = allowedMusicRooms.includes(result.semantic_music_room)
    ? result.semantic_music_room
    : null;
  const semanticAdaptiveSound = {
    relevant: true,
    selection_basis: "current_checkin",
    band_intent: allowedAdaptiveSoundBands.includes(result.semantic_adaptive_sound_intent?.band_intent)
      ? result.semantic_adaptive_sound_intent.band_intent
      : null,
    carrier_intent: allowedAdaptiveSoundCarriers.includes(result.semantic_adaptive_sound_intent?.carrier_intent)
      ? result.semantic_adaptive_sound_intent.carrier_intent
      : null,
    top_needs_used: Array.isArray(result.semantic_adaptive_sound_intent?.top_needs_used)
      ? result.semantic_adaptive_sound_intent.top_needs_used.filter((need) => allowedHighlights.includes(need)).slice(0, 4)
      : [],
    explicit_cues_used: Array.isArray(result.semantic_adaptive_sound_intent?.explicit_cues_used)
      ? result.semantic_adaptive_sound_intent.explicit_cues_used.filter((cue) => allowedAdaptiveSoundCues.includes(cue)).slice(0, 4)
      : [],
    context_modifiers_used: contextModifiersUsed,
    horizons_considered: [...requiredInferenceHorizons],
    confidence: typeof result.semantic_adaptive_sound_intent?.confidence === "number"
      ? normalizeScore(result.semantic_adaptive_sound_intent.confidence)
      : 0,
    safety_state: result.semantic_adaptive_sound_intent?.safety_state === "high_concern" ? "high_concern" : "standard",
    session_scope: "current_session_only",
    research_boundary: "biological_targets_not_used_in_product_decisions",
  };
  const fusion = resolveCurrentInferenceFusion({
    acceptedSelfReport: typeof checkin === "string" && checkin.trim().length > 0,
    semanticInference: { ...semanticCurrentInference, inference_id: semanticInferenceId },
    semanticMusicRoom,
    semanticAdaptiveSoundIntent: semanticAdaptiveSound,
    environmentContext,
    heartRateZone: physiologyAvailable ? momentaryPhysiology.heart_rate_zone : "not_available",
    heartRateAvailable: physiologyAvailable,
  });
  const heartRateRole = fusion.heart_rate_role;
  const modelInferenceConfidence = typeof semanticCurrentInference.confidence === "number"
    ? normalizeScore(semanticCurrentInference.confidence)
    : 0;
  const normalizedCurrentInference = {
    inference_id: fusion.inference_id,
    semantic_inference_id: fusion.semantic_inference_id,
    human_label: fusion.inference_id === "mixed_uncertain"
      ? "Mixed / uncertain"
      : (typeof semanticCurrentInference.human_label === "string" ? semanticCurrentInference.human_label.slice(0, 80) : "Mixed / uncertain"),
    summary: typeof semanticCurrentInference.summary === "string" ? semanticCurrentInference.summary.slice(0, 320) : "",
    confidence: heartRateRole === "conflicting" ? normalizeScore(modelInferenceConfidence - 0.08) : modelInferenceConfidence,
    heart_rate_role: heartRateRole,
    heart_rate_zone: fusion.heart_rate_zone,
    evidence_used: Array.isArray(semanticCurrentInference.evidence_used)
      ? semanticCurrentInference.evidence_used.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim().slice(0, 120)).slice(0, 8)
      : [],
    context_dimensions_considered: contextDimensionAudit(environmentContext),
    horizons_considered: [...requiredInferenceHorizons],
    baseline_comparison_used: false,
    raw_heart_rate_retained: false,
    fusion,
    clinical_status: "not_a_diagnosis",
  };
  const adaptiveSoundConfidence = semanticAdaptiveSound.confidence;
  const musicRoomConfidence = typeof result.semantic_music_room_confidence === "number"
    ? normalizeScore(result.semantic_music_room_confidence)
    : 0;

  return {
    highlights: result.highlights,
    confidence: heartRateRole === "conflicting"
      ? normalizeScore((typeof result.confidence === "number" ? result.confidence : 0) - 0.05)
      : (typeof result.confidence === "number" ? result.confidence : 0),
    selected_music_room: fusion.selected_music_room,
    selected_format: null,
    source_id: null,
    catalogue_ready: false,
    music_room_confidence: heartRateRole === "conflicting"
      ? normalizeScore(musicRoomConfidence - 0.08)
      : musicRoomConfidence,
    music_room_reason: typeof result.semantic_music_room_reason === "string" ? result.semantic_music_room_reason : "",
    needs_scorecard: normalizeNeedsScorecard(result.needs_scorecard),
    dominant_domains: dominantDomains,
    top_needs_used: topNeedsUsed.length ? topNeedsUsed : result.highlights,
    context_modifiers_used: contextModifiersUsed,
    current_inference: normalizedCurrentInference,
    uncertainty_notes: Array.isArray(result.uncertainty_notes) ? result.uncertainty_notes.slice(0, 3) : [],
    human_review_relevance: result.human_review_relevance || "not_indicated",
    adaptive_sound_intent: {
      ...semanticAdaptiveSound,
      band_intent: fusion.adaptive_sound.band_intent,
      carrier_intent: fusion.adaptive_sound.carrier_intent,
      confidence: heartRateRole === "conflicting"
        ? normalizeScore(adaptiveSoundConfidence - 0.08)
        : adaptiveSoundConfidence,
      resolution_authority: "deterministic_local_fusion",
      fusion_policy_version: fusion.policy_version,
      fusion_action: fusion.action,
    },
    semantic_intents: {
      current_inference: {
        inference_id: semanticInferenceId,
        human_label: typeof semanticCurrentInference.human_label === "string" ? semanticCurrentInference.human_label.slice(0, 80) : "Mixed / uncertain",
        confidence: modelInferenceConfidence,
      },
      music_room: {
        room: semanticMusicRoom,
        confidence: musicRoomConfidence,
        reason: typeof result.semantic_music_room_reason === "string" ? result.semantic_music_room_reason : "",
      },
      adaptive_sound: semanticAdaptiveSound,
    },
    interpretation_type: result.interpretation_type || "language_theme_mapping",
    clinical_status: "not_a_diagnosis",
    model: CITIZEN_NEEDS_INFERENCE_MODEL,
    prompt_version: SYSTEM_PROMPT_VERSION,
    prompt_sha256: SYSTEM_PROMPT_SHA256,
    prompt_source: SYSTEM_PROMPT_SOURCE,
    music_room_selection_guide_version: MUSIC_ROOM_SELECTION_GUIDE_VERSION,
    fusion_policy_version: CURRENT_INFERENCE_FUSION_POLICY_VERSION,
  };
}

async function handleInference(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    try {
      const body = await readRequestJson(request);
      const workerResponse = await fetch(DEPLOYED_INFERENCE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://universalmind.tv",
        },
        body: JSON.stringify(body),
      });
      const payload = await workerResponse.json().catch(() => ({
        error: "The inference engine returned an invalid response.",
      }));
      sendJson(response, workerResponse.status, payload);
    } catch {
      sendJson(response, 502, { error: "The inference engine could not be reached." });
    }
    return;
  }

  let checkin = "";
  let environmentContext = normalizeEnvironmentContext(null);
  let momentaryPhysiology = normalizeMomentaryPhysiology(null);
  try {
    const body = await readRequestJson(request);
    checkin = typeof body.checkin === "string" ? body.checkin.trim() : "";
    environmentContext = normalizeEnvironmentContext(body.environment_context || body.environmentContext || body.context);
    momentaryPhysiology = normalizeMomentaryPhysiology(body.momentary_physiology || body.momentaryPhysiology);
  } catch {
    sendJson(response, 400, { error: "Invalid JSON request." });
    return;
  }

  if (!checkin || checkin.length > 180) {
    sendJson(response, 400, { error: "Provide a short I am check-in." });
    return;
  }

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CITIZEN_NEEDS_INFERENCE_MODEL,
        store: false,
        reasoning: {
          effort: "low",
        },
        input: [
          {
            role: "system",
            content: inferenceInstructions,
          },
          {
            role: "user",
            content: [
              `Allowed UI radar labels: ${allowedHighlights.join(", ")}`,
              "Pick exactly four unique labels from that list.",
              `Needs scorecard domains and fields: ${JSON.stringify(scorecardDomains)}`,
              "Score every needs_scorecard field from 0.00 to 1.00. Use 0.00 when there is no evidence; use higher scores only when the check-in or adaptive context supports present-state relevance.",
              "Keep the four highlights aligned with the most salient human_needs_radar scores, but do not hide important lower-level signals from the full scorecard.",
              `Return a semantic music-room affinity from: ${allowedMusicRooms.join(", ")}; otherwise return null. The local fusion layer resolves the final room candidate.`,
              "The application owns extended-session format and exact source resolution. Return selected_format and source_id as null and catalogue_ready as false.",
              "Use high scores only as stronger present-state relevance, never as diagnosis.",
              `Environment context JSON: ${JSON.stringify(environmentContext)}`,
              `Citizen check-in: ${checkin}`,
            ].join("\n"),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "citizen_needs_language_theme_mapping",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                highlights: {
                  type: "array",
                  minItems: 4,
                  maxItems: 4,
                  items: {
                    type: "string",
                    enum: allowedHighlights,
                  },
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                },
                semantic_music_room: {
                  type: ["string", "null"],
                  enum: [...allowedMusicRooms, null],
                },
                selected_format: {
                  type: "null",
                },
                source_id: {
                  type: "null",
                },
                catalogue_ready: {
                  type: "boolean",
                  enum: [false],
                },
                semantic_music_room_confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                },
                semantic_music_room_reason: {
                  type: "string",
                },
                needs_scorecard: scorecardSchema,
                dominant_domains: {
                  type: "array",
                  minItems: 1,
                  maxItems: 4,
                  items: {
                    type: "string",
                    enum: allowedDomains,
                  },
                },
                top_needs_used: {
                  type: "array",
                  minItems: 1,
                  maxItems: 4,
                  items: {
                    type: "string",
                    enum: allowedHighlights,
                  },
                },
                context_modifiers_used: {
                  type: "array",
                  minItems: 0,
                  maxItems: 4,
                  items: {
                    type: "string",
                  },
                },
                uncertainty_notes: {
                  type: "array",
                  minItems: 1,
                  maxItems: 3,
                  items: {
                    type: "string",
                  },
                },
                human_review_relevance: {
                  type: "string",
                  enum: [
                    "not_indicated",
                    "consider_if_persistent_or_escalating",
                    "human_review_recommended",
                    "urgent_human_review",
                  ],
                },
                semantic_current_inference: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    inference_id: { type: "string", enum: allowedInferenceIds },
                    human_label: { type: "string" },
                    summary: { type: "string" },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence_used: {
                      type: "array",
                      minItems: 1,
                      maxItems: 8,
                      items: { type: "string" },
                    },
                    context_dimensions_considered: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        time: { type: "boolean" },
                        weather: { type: "boolean" },
                        location: { type: "boolean" },
                      },
                      required: ["time", "weather", "location"],
                    },
                    horizons_considered: {
                      type: "array",
                      minItems: 3,
                      maxItems: 3,
                      items: { type: "string", enum: requiredInferenceHorizons },
                    },
                    baseline_comparison_used: { type: "boolean", enum: [false] },
                    clinical_status: { type: "string", enum: ["not_a_diagnosis"] },
                  },
                  required: [
                    "inference_id",
                    "human_label",
                    "summary",
                    "confidence",
                    "evidence_used",
                    "context_dimensions_considered",
                    "horizons_considered",
                    "baseline_comparison_used",
                    "clinical_status",
                  ],
                },
                semantic_adaptive_sound_intent: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    relevant: { type: "boolean", enum: [true] },
                    selection_basis: {
                      type: "string",
                      enum: ["current_checkin"],
                    },
                    band_intent: {
                      type: "string",
                      enum: allowedAdaptiveSoundBands,
                    },
                    carrier_intent: {
                      type: "string",
                      enum: allowedAdaptiveSoundCarriers,
                    },
                    top_needs_used: {
                      type: "array",
                      minItems: 0,
                      maxItems: 4,
                      items: { type: "string", enum: allowedHighlights },
                    },
                    explicit_cues_used: {
                      type: "array",
                      minItems: 0,
                      maxItems: 4,
                      items: { type: "string", enum: allowedAdaptiveSoundCues },
                    },
                    context_modifiers_used: {
                      type: "array",
                      minItems: 3,
                      maxItems: 6,
                      items: { type: "string" },
                    },
                    horizons_considered: {
                      type: "array",
                      minItems: 3,
                      maxItems: 3,
                      items: { type: "string", enum: requiredInferenceHorizons },
                    },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    safety_state: { type: "string", enum: ["standard", "high_concern"] },
                    session_scope: { type: "string", enum: ["current_session_only"] },
                    research_boundary: { type: "string", enum: ["biological_targets_not_used_in_product_decisions"] },
                  },
                  required: [
                    "relevant",
                    "selection_basis",
                    "band_intent",
                    "carrier_intent",
                    "top_needs_used",
                    "explicit_cues_used",
                    "context_modifiers_used",
                    "horizons_considered",
                    "confidence",
                    "safety_state",
                    "session_scope",
                    "research_boundary",
                  ],
                },
                interpretation_type: {
                  type: "string",
                  enum: ["language_theme_mapping"],
                },
                clinical_status: {
                  type: "string",
                  enum: ["not_a_diagnosis"],
                },
              },
              required: [
                "highlights",
                "confidence",
                "semantic_music_room",
                "selected_format",
                "source_id",
                "catalogue_ready",
                "semantic_music_room_confidence",
                "semantic_music_room_reason",
                "needs_scorecard",
                "dominant_domains",
                "top_needs_used",
                "context_modifiers_used",
                "uncertainty_notes",
                "human_review_relevance",
                "semantic_current_inference",
                "semantic_adaptive_sound_intent",
                "interpretation_type",
                "clinical_status",
              ],
            },
          },
          verbosity: "low",
        },
      }),
    });

    const payload = await openaiResponse.json();
    if (!openaiResponse.ok) {
      console.error("OpenAI inference error:", openaiResponse.status, payload.error?.message || "No error message.");
      sendJson(response, 502, { error: "The inference engine is unavailable for this prototype." });
      return;
    }

    const result = {
      ...validateInference(parseStructuredResponse(payload), checkin, environmentContext, momentaryPhysiology),
      environment_context: environmentContext,
    };
    console.info("Citizen needs inference QA", {
      model: result.model,
      prompt_version: result.prompt_version,
      prompt_sha256: result.prompt_sha256,
      highlights: result.highlights,
      human_review_relevance: result.human_review_relevance,
    });
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 502, { error: error.message || "We could not interpret this check-in yet. Please try again." });
  }
}

function runSelectorCore(payload) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(PYTHON_EXECUTABLE, [SELECTOR_CORE_PATH, "--stdin"], {
      cwd: __dirname,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (code !== 0) {
        rejectPromise(new Error(stderr.trim() || `selector_core.py exited with code ${code}`));
        return;
      }

      try {
        resolvePromise(JSON.parse(stdout));
      } catch (error) {
        rejectPromise(error);
      }
    });

    child.stdin.end(JSON.stringify(payload || {}));
  });
}

async function handleMusicVideoSelection(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const body = await readRequestJson(request);
    const payload = [body.v555_payload, body.v445_payload, body.v444_payload, body.inference, body]
      .find((candidate) => candidate && typeof candidate === "object");
    const result = await runSelectorCore(payload);
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 502, {
      error: error.message || "The adaptive music television selector is unavailable.",
    });
  }
}

async function handleStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const relativePath = pathname === "/" ? "technology-citizen-needs.html" : pathname.replace(/^\/+/, "");
  const safePath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = resolve(join(STATIC_ROOT, safePath));

  if (!filePath.startsWith(STATIC_ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const extension = extname(filePath).toLowerCase();
    const type = contentTypes[extension] || "application/octet-stream";
    const fileStat = await stat(filePath);
    const isVideo = type.startsWith("video/");

    if (isVideo) {
      const range = request.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) {
          response.writeHead(416, {
            "Content-Range": `bytes */${fileStat.size}`,
            "Accept-Ranges": "bytes",
          });
          response.end();
          return;
        }

        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Number(match[2]) : fileStat.size - 1;
        if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= fileStat.size) {
          response.writeHead(416, {
            "Content-Range": `bytes */${fileStat.size}`,
            "Accept-Ranges": "bytes",
          });
          response.end();
          return;
        }

        const safeEnd = Math.min(end, fileStat.size - 1);
        response.writeHead(206, {
          "Content-Type": type,
          "Content-Length": String(safeEnd - start + 1),
          "Content-Range": `bytes ${start}-${safeEnd}/${fileStat.size}`,
          "Accept-Ranges": "bytes",
        });
        if (request.method === "HEAD") {
          response.end();
          return;
        }
        createReadStream(filePath, { start, end: safeEnd }).pipe(response);
        return;
      }

      response.writeHead(200, {
        "Content-Type": type,
        "Content-Length": String(fileStat.size),
        "Accept-Ranges": "bytes",
      });
      if (request.method === "HEAD") {
        response.end();
        return;
      }
      createReadStream(filePath).pipe(response);
      return;
    }

    const data = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": type,
      "Content-Length": String(data.byteLength),
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

const server = createServer((request, response) => {
  if (request.url?.startsWith("/api/citizen-needs-inference")) {
    handleInference(request, response);
    return;
  }

  if (request.url?.startsWith("/api/adaptive-music-video-selection")) {
    handleMusicVideoSelection(request, response);
    return;
  }

  handleStatic(request, response);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Citizen Needs demo: http://127.0.0.1:${PORT}/technology-citizen-needs.html`);
  console.log(`Inference model: ${CITIZEN_NEEDS_INFERENCE_MODEL}`);
});
